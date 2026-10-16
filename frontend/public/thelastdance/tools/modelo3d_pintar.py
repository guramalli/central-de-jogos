"""Pinta a forma 3D com os PRÓPRIOS desenhos da ficha (projeção ortográfica de 4 vistas) e grava numa textura.

Uso (Blender, sem janela):
    blender -b -P tools/modelo3d_pintar.py -- <forma.glb> <pasta_entrada> <alinhamento.json> <saida.glb> [--textura 2048]

Como funciona:
- Cada vista da ficha (frente, esquerda, costas, direita) é um desenho ortográfico. Para cada vértice, calcula onde
  ele cai em cada desenho (usando a escala e o encaixe medidos por tools/modelo3d_alinhar.py) -> 4 mapas de UV.
- O peso de cada vista vem da direção da superfície (normal): virada para a câmera da vista = peso alto. Pontos
  escondidos naquela vista (atrás de outra parte do corpo) recebem peso zero (teste de profundidade).
- Um material mistura as 4 imagens por esses pesos; o Cycles "assa" o resultado numa textura única (UV nova).
- Sai um GLB com a textura pintada, pés no chão (z = 0), centralizado, de frente para −Y (padrão do Blender).
"""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

VISTAS = ["front", "left", "back", "right"]
RES_COMPARACAO = 512
POTENCIA = 12.0  # quanto maior, mais "seco" o limite entre as vistas (menos "fantasma" de duas vistas)
PRIORIDADE = {"front": 1.15, "left": 1.0, "back": 1.0, "right": 1.0}  # leve preferência pela frente (rosto)
BORDA_PX = 7  # perto da borda do desenho (contorno preto) a vista perde peso: evita emendas escuras


def distancia_borda(alfa, maximo):
    """Distância (em px, até 'maximo') de cada pixel dentro do desenho até a borda; fora = 0."""
    dentro = alfa > 0.5
    dist = np.zeros(alfa.shape)
    atual = dentro.copy()
    for i in range(1, maximo + 1):
        dist[atual] = i
        e = atual.copy()  # erosão em cruz
        e[1:, :] &= atual[:-1, :]
        e[:-1, :] &= atual[1:, :]
        e[:, 1:] &= atual[:, :-1]
        e[:, :-1] &= atual[:, 1:]
        atual = e
    return dist


def zbuffer(px, py, prof, faces, Z):
    """Profundidade exata por triângulo (maior = mais perto da câmera), em grade Z × Z."""
    zb = np.full((Z, Z), -1e9)
    X, Y = px * Z, py * Z
    for f in faces:
        xs, ys, zs = X[f], Y[f], prof[f]
        x0, x1 = int(max(0, np.floor(xs.min()))), int(min(Z - 1, np.ceil(xs.max())))
        y0, y1 = int(max(0, np.floor(ys.min()))), int(min(Z - 1, np.ceil(ys.max())))
        if x1 < x0 or y1 < y0:
            continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        d = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
        if abs(d) < 1e-12:
            continue
        l0 = ((ys[1] - ys[2]) * (gx - xs[2]) + (xs[2] - xs[1]) * (gy - ys[2])) / d
        l1 = ((ys[2] - ys[0]) * (gx - xs[2]) + (xs[0] - xs[2]) * (gy - ys[2])) / d
        l2 = 1 - l0 - l1
        dentro = (l0 >= -1e-3) & (l1 >= -1e-3) & (l2 >= -1e-3)
        if not dentro.any():
            continue
        z = l0 * zs[0] + l1 * zs[1] + l2 * zs[2]
        sub = zb[y0:y1 + 1, x0:x1 + 1]
        np.maximum(sub, np.where(dentro, z, -1e9), out=sub)
    return zb


def args():
    a = sys.argv[sys.argv.index("--") + 1:]
    op = {"forma": str(Path(a[0]).resolve()), "entrada": Path(a[1]).resolve(), "alinhamento": str(Path(a[2]).resolve()),
          "saida": str(Path(a[3]).resolve()), "textura": 2048}
    if "--textura" in a:
        op["textura"] = int(a[a.index("--textura") + 1])
    return op


def main():
    op = args()
    al = json.loads(Path(op["alinhamento"]).read_text(encoding="utf-8"))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=op["forma"])
    malhas = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.context.view_layer.objects.active = malhas[0]
    for o in malhas:
        o.select_set(True)
    if len(malhas) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for o in list(bpy.context.scene.objects):
        if o is not obj:
            bpy.data.objects.remove(o)

    # Coordenadas glTF (Y para cima) do jeito que o alinhamento mediu: g = (x, z, -y) do Blender.
    me = obj.data
    vb = np.array([v.co for v in me.vertices])
    g = np.stack([vb[:, 0], vb[:, 2], -vb[:, 1]], 1)
    m = np.array(al["matriz"])
    a_ = g @ m.T  # coordenadas alinhadas: personagem de frente para +Z, Y para cima
    # Normais nas coordenadas alinhadas
    nb = np.array([v.normal for v in me.vertices])
    ng = np.stack([nb[:, 0], nb[:, 2], -nb[:, 1]], 1) @ m.T

    imagens, uvs, pesos = {}, {}, {}
    camera = {"front": np.array([0, 0, 1]), "left": np.array([-1, 0, 0]),  # direção para a câmera de cada vista
              "back": np.array([0, 0, -1]), "right": np.array([1, 0, 0])}
    faces = np.array([p.vertices[:] for p in me.polygons if len(p.vertices) == 3])
    for vista in VISTAS:
        info = al["vistas"][vista]
        img = bpy.data.images.load(str(op["entrada"] / f"{vista}.png"))
        imagens[vista] = img
        pix = np.array(img.pixels[:]).reshape(img.size[1], img.size[0], 4)[::-1]  # linhas de cima para baixo
        dborda = distancia_borda(pix[..., 3], BORDA_PX)
        W, H = info["tamanho_imagem"]
        x0, x1 = info["pixels_x"]
        y0, y1 = info["pixels_y"]
        u0, u1 = info["mundo_u"]
        w0, w1 = info["mundo_w"]
        u = a_ @ np.array(info["eixo_tela"])
        w = -a_[:, 1]
        esc = (y1 - y0) / (w1 - w0)
        R = RES_COMPARACAO
        esc_res = R * 0.9 / (w1 - w0)
        x_res = (u - (u0 + u1) / 2) * esc_res + R / 2       # posição na grade da comparação
        frac = (w - w0) / (w1 - w0)                          # 0 = topo do cabelo, 1 = pés
        cab, cor_ = info["cabeca"], info["corpo"]
        t = np.clip((frac - (info["corte_cabeca"] - 0.04)) / 0.08, 0, 1)
        t = t * t * (3 - 2 * t)                              # transição suave no pescoço
        def ajusta(par):
            return (x_res - par["centro_px"]) * par["escala_x"] + par["centro_px"] + par["dx"]
        x_aj = ajusta(cab) * (1 - t) + ajusta(cor_) * t
        px = (x0 + x1) / 2 + (x_aj - R / 2) * (y1 - y0) / (R * 0.9)
        py = y0 + (w - w0) * esc
        uvs[vista] = np.stack([px / W, 1 - py / H], 1)
        # profundidade: quem está mais perto da câmera da vista esconde quem está atrás (z-buffer exato)
        prof = a_ @ camera[vista]
        Z = 1024
        zbuf = zbuffer(px / W, py / H, prof, faces, Z)
        sx = np.clip((px / W * Z).astype(int), 0, Z - 1)
        sy = np.clip((py / H * Z).astype(int), 0, Z - 1)
        viz = np.max(np.stack([zbuf[np.clip(sy + dy, 0, Z - 1), np.clip(sx + dx, 0, Z - 1)]
                               for dy in (-1, 0, 1) for dx in (-1, 0, 1)]), 0)
        altura_mundo = w1 - w0
        visivel = prof >= viz - 0.012 * altura_mundo
        frontal = (PRIORIDADE[vista] * np.clip(ng @ camera[vista], 0, 1)) ** POTENCIA
        ix = np.clip(px.astype(int), 0, W - 1)
        iy = np.clip(py.astype(int), 0, H - 1)
        miolo = np.clip(dborda[iy, ix] / BORDA_PX, 0, 1) ** 2  # 0 fora/na borda do desenho, 1 bem dentro
        pesos[vista] = frontal * visivel * (0.02 + 0.98 * miolo) + 1e-6 * np.clip(ng @ camera[vista] + 1, 0, 2) * miolo
        pesos[vista] = pesos[vista] + 1e-9  # nunca zero
        print(f"{vista}: {visivel.mean() * 100:.0f}% dos vértices visíveis", flush=True)
    soma = sum(pesos.values())
    for vista in VISTAS:
        pesos[vista] = pesos[vista] / soma

    # Grava 4 UVs (uma por vista) e os pesos como cor de vértice (RGBA = frente, esquerda, costas, direita).
    for vista in VISTAS:
        camada = me.uv_layers.new(name="uv_" + vista)
        uvv = uvs[vista]
        for loop in me.loops:
            camada.data[loop.index].uv = uvv[loop.vertex_index]
    cor = me.color_attributes.new(name="pesos", type="FLOAT_COLOR", domain="POINT")
    for i in range(len(me.vertices)):
        cor.data[i].color = (pesos["front"][i], pesos["left"][i], pesos["back"][i], pesos["right"][i])

    # Material de projeção: mistura das 4 imagens pelos pesos.
    mat = bpy.data.materials.new("projecao")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    saida = nt.nodes.new("ShaderNodeOutputMaterial")
    emis = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(emis.outputs[0], saida.inputs["Surface"])
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "pesos"
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(attr.outputs["Color"], sep.inputs[0])
    canais = {"front": (sep, 0), "left": (sep, 1), "back": (sep, 2), "right": (attr, "Alpha")}
    acumulado = None
    for vista in VISTAS:
        uvn = nt.nodes.new("ShaderNodeUVMap")
        uvn.uv_map = "uv_" + vista
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = imagens[vista]
        tex.extension = "EXTEND"
        nt.links.new(uvn.outputs[0], tex.inputs[0])
        mult = nt.nodes.new("ShaderNodeMix")
        mult.data_type = "RGBA"
        mult.blend_type = "MULTIPLY"
        mult.inputs["Factor"].default_value = 1.0
        nt.links.new(tex.outputs["Color"], mult.inputs["A"])
        no, sai = canais[vista]
        nt.links.new(no.outputs[sai], mult.inputs["B"])
        if acumulado is None:
            acumulado = mult
        else:
            add = nt.nodes.new("ShaderNodeMix")
            add.data_type = "RGBA"
            add.blend_type = "ADD"
            add.inputs["Factor"].default_value = 1.0
            nt.links.new(acumulado.outputs["Result"], add.inputs["A"])
            nt.links.new(mult.outputs["Result"], add.inputs["B"])
            acumulado = add
    nt.links.new(acumulado.outputs["Result"], emis.inputs["Color"])
    me.materials.clear()
    me.materials.append(mat)

    # UV nova para a textura final e "assar" a cor.
    final = me.uv_layers.new(name="UVMap")
    me.uv_layers.active = final
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.003)
    bpy.ops.object.mode_set(mode="OBJECT")
    tam = op["textura"]
    img_final = bpy.data.images.new("textura_pintada", tam, tam, alpha=False)
    no_final = nt.nodes.new("ShaderNodeTexImage")
    no_final.image = img_final
    nt.nodes.active = no_final
    cena = bpy.context.scene
    cena.render.engine = "CYCLES"
    cena.cycles.samples = 1
    try:
        cena.cycles.device = "GPU"
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "CUDA"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
    except Exception:
        pass
    cena.render.bake.margin = 8
    bpy.ops.object.bake(type="EMIT")
    caminho_tex = Path(op["saida"]).with_suffix(".png")
    img_final.filepath_raw = str(caminho_tex)
    img_final.file_format = "PNG"
    img_final.save()

    # Material final: só a textura assada (sem luz: a pintura já é a cor final).
    for camada in [l.name for l in me.uv_layers if l.name.startswith("uv_")]:
        me.uv_layers.remove(me.uv_layers[camada])
    me.color_attributes.remove(me.color_attributes["pesos"])
    mat2 = bpy.data.materials.new("pintura")
    mat2.use_nodes = True
    bsdf = mat2.node_tree.nodes.get("Principled BSDF")
    t2 = mat2.node_tree.nodes.new("ShaderNodeTexImage")
    t2.image = img_final
    mat2.node_tree.links.new(t2.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 1.0
    me.materials.clear()
    me.materials.append(mat2)

    # Normaliza a posição: frente para −Y (Blender), pés em z = 0, centro em x = y = 0.
    # Alinhado (glTF): frente +Z, cima +Y  ->  Blender: x = a.x, y = −a.z, z = a.y
    for i, v in enumerate(me.vertices):
        v.co = Vector((a_[i, 0], -a_[i, 2], a_[i, 1]))
    me.update()
    zs = [v.co.z for v in me.vertices]
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    desloc = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
    for v in me.vertices:
        v.co -= desloc
    escala = 1.75 / (max(zs) - min(zs))  # altura do personagem = 1,75 m
    for v in me.vertices:
        v.co *= escala
    me.update()
    obj.name = "personagem"
    bpy.ops.export_scene.gltf(filepath=op["saida"], export_format="GLB", use_selection=False)
    print("PRONTO", op["saida"], caminho_tex)


main()
