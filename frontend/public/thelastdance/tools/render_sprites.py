"""Renderiza um personagem 3D animado (GLB) como sprites isométricos: 8 direções × N quadros, PNG com alpha.

Uso (o Blender roda o script; nada abre na tela):
    blender -b -P tools/render_sprites.py -- modelo.glb pasta_saida [--quadros 12] [--altura 512] [--acao NOME]
           [--inicio Q --fim Q] [--direcoes S,SE,...] [--sem-contorno] [--sem-luz] [--elevacao GRAUS]

--sem-luz: mostra a cor da textura como está (modelo pintado com os desenhos: a luz já está na pintura).
--elevacao: altura da câmera em graus (30 = isométrico do jogo; 0 = de frente, para comparar com a ficha).

--inicio/--fim: trecho de UM ciclo da animação (aceita fração); os quadros saem igualmente espaçados, sem
repetir o último (o laço volta ao primeiro).

Saída: pasta_saida/<acao>_<DIR>_<NN>.png  (DIR = S, SE, E, NE, N, NO, O, SO) + folha.json com pivô e tempos.
Câmera ortográfica dimétrica 2:1 (D-A6 provisória). O personagem gira; câmera e luz ficam fixas, então a luz
vem sempre do mesmo lado da tela. O deslocamento da caminhada é anulado (o jogo é quem move o personagem).
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

DIRECOES = ["S", "SE", "E", "NE", "N", "NO", "O", "SO"]  # S = de frente para a câmera; sentido horário na tela
CONTORNO = (0.04, 0.05, 0.12)  # azul-marinho escuro (escopo: contornos pretos/azul-marinho)


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if len(a) < 2:
        sys.exit("uso: blender -b -P render_sprites.py -- modelo.glb saida [--quadros N] [--altura PX] [--acao NOME] [--inicio Q] [--fim Q] [--direcoes S,SE] [--sem-contorno] [--sem-luz] [--elevacao GRAUS]")
    op = {"glb": a[0], "saida": a[1], "quadros": 12, "altura": 512, "acao": None, "contorno": True, "inicio": None, "fim": None, "direcoes": None, "sem_luz": False, "elevacao": 30.0}
    for i, k in enumerate(a):
        if k == "--quadros":
            op["quadros"] = int(a[i + 1])
        elif k == "--altura":
            op["altura"] = int(a[i + 1])
        elif k == "--sem-luz":
            op["sem_luz"] = True
        elif k == "--elevacao":
            op["elevacao"] = float(a[i + 1])
        elif k == "--direcoes":
            op["direcoes"] = a[i + 1].upper().split(",")
        elif k == "--inicio":
            op["inicio"] = float(a[i + 1])
        elif k == "--fim":
            op["fim"] = float(a[i + 1])
        elif k == "--sem-contorno":
            op["contorno"] = False
        elif k == "--acao":
            op["acao"] = a[i + 1]
    return op


def limpar_cena():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def motor(cena):
    for nome in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            cena.render.engine = nome
            return nome
        except TypeError:
            continue
    cena.render.engine = "CYCLES"
    return "CYCLES"


def caixa_mundo(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx


def osso_quadril(arm):
    for b in arm.pose.bones:
        if "hip" in b.name.lower() or "pelvis" in b.name.lower():
            return b
    return arm.pose.bones[0]


def main():
    op = args()
    saida = Path(op["saida"])
    saida.mkdir(parents=True, exist_ok=True)
    limpar_cena()
    cena = bpy.context.scene
    bpy.ops.import_scene.gltf(filepath=op["glb"])

    arm = next((o for o in cena.objects if o.type == "ARMATURE"), None)
    malhas = [o for o in cena.objects if o.type == "MESH"]
    # Malhas auxiliares minúsculas (ex.: a esfera que vem no GLB do Higgsfield) não são o personagem.
    for o in malhas:
        if len(o.data.polygons) < 200:
            o.hide_render = True
    malhas = [o for o in malhas if not o.hide_render]
    acoes = list(bpy.data.actions)
    acao = next((x for x in acoes if op["acao"] and op["acao"].lower() in x.name.lower()), acoes[0] if acoes else None)
    if arm and acao:
        arm.animation_data_create()
        arm.animation_data.action = acao
        ini, fim = acao.frame_range
        ini = op["inicio"] if op["inicio"] is not None else ini
        fim = op["fim"] if op["fim"] is not None else fim
    else:
        ini, fim = 1, 1
    nome_acao = (op["acao"] or (acao.name if acao else "parado")).split("|")[-1].lower()

    # Pai único que gira o personagem e anula o deslocamento da caminhada.
    pivo = bpy.data.objects.new("pivo", None)
    cena.collection.objects.link(pivo)
    for o in cena.objects:
        if o.parent is None and o is not pivo and o.type in ("ARMATURE", "MESH", "EMPTY"):
            o.parent = pivo

    # Altura de referência: pose do primeiro quadro, sem girar.
    cena.frame_set(int(ini), subframe=ini - int(ini))
    bpy.context.view_layer.update()
    mn, mx = caixa_mundo(malhas)
    altura_mundo = mx.z - mn.z
    pivo.location.z -= mn.z  # pés no chão (z = 0)

    # Câmera ortográfica dimétrica 2:1: elevação ~30° (tan = 0,5 → 26,57° na projeção do chão).
    cam_dado = bpy.data.cameras.new("cam")
    cam_dado.type = "ORTHO"
    margem = 1.25
    cam_dado.ortho_scale = altura_mundo * margem
    cam = bpy.data.objects.new("cam", cam_dado)
    cena.collection.objects.link(cam)
    cena.camera = cam
    elev = math.radians(op["elevacao"])
    dist = altura_mundo * 10
    alvo = Vector((0, 0, altura_mundo * 0.5))
    cam.location = alvo + Vector((0, -dist * math.cos(elev), dist * math.sin(elev)))
    cam.rotation_euler = (math.radians(90) - elev, 0, 0)

    if op["sem_luz"]:  # troca cada material por "emissão" da própria textura
        for mat in bpy.data.materials:
            if not mat.use_nodes:
                continue
            nt = mat.node_tree
            tex = next((n for n in nt.nodes if n.type == "TEX_IMAGE"), None)
            no_saida = next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"), None)
            if tex and no_saida:
                em = nt.nodes.new("ShaderNodeEmission")
                nt.links.new(tex.outputs["Color"], em.inputs["Color"])
                nt.links.new(em.outputs[0], no_saida.inputs["Surface"])

    # Luz fixa (alto à esquerda da tela) + luz de preenchimento fraca.
    for nome, energia, rot in (("sol", 4.5, (math.radians(50), 0, math.radians(-35))),
                               ("preench", 1.5, (math.radians(70), 0, math.radians(150)))):
        l = bpy.data.lights.new(nome, "SUN")
        l.energy = energia
        lo = bpy.data.objects.new(nome, l)
        lo.rotation_euler = rot
        cena.collection.objects.link(lo)
    mundo = bpy.data.worlds.new("mundo")
    mundo.use_nodes = True
    mundo.node_tree.nodes["Background"].inputs[1].default_value = 0.6
    cena.world = mundo

    # Render: fundo transparente, cores sem curva de filme, contorno Freestyle.
    motor(cena)
    r = cena.render
    r.film_transparent = True
    r.resolution_y = op["altura"]
    r.resolution_x = op["altura"]
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGBA"
    cena.view_settings.view_transform = "Standard"
    r.use_freestyle = True
    r.line_thickness_mode = "ABSOLUTE"
    r.line_thickness = max(1.0, op["altura"] / 256)
    ls = cena.view_layers[0].freestyle_settings.linesets
    lin = ls[0] if len(ls) else ls.new("contorno")
    if lin.linestyle is None:
        lin.linestyle = bpy.data.linestyles.new("contorno")
    lin.linestyle.color = CONTORNO
    lin.select_by_visibility = True
    lin.select_by_edge_types = True
    # Só a silhueta externa: em malha gerada por IA (densa), "crease" e "silhouette" internos viram manchas.
    lin.select_silhouette = lin.select_border = lin.select_crease = False
    lin.select_external_contour = True
    r.use_freestyle = op["contorno"]

    quadril = osso_quadril(arm) if arm else None
    n = max(1, op["quadros"])
    quadros = [ini + i * (fim - ini) / n for i in range(n)] if fim > ini else [ini]

    def anular_deslocamento():
        if not quadril:
            return
        bpy.context.view_layer.update()
        p = arm.matrix_world @ quadril.head
        pivo.location.x -= p.x
        pivo.location.y -= p.y

    meta = {"acao": nome_acao, "altura_px": op["altura"], "fps_origem": cena.render.fps,
            "duracao_ciclo_s": round((fim - ini) / cena.render.fps, 3),
            "pivo_px": [op["altura"] / 2, None], "direcoes": DIRECOES, "quadros": []}
    for d, nome_dir in enumerate(DIRECOES):
        if op["direcoes"] and nome_dir not in op["direcoes"]:
            continue
        for k, f in enumerate(quadros):
            cena.frame_set(int(f), subframe=f - int(f))
            pivo.location.x = pivo.location.y = 0
            pivo.rotation_euler.z = math.radians(45 * d)  # +45° leva a frente (-Y) para a direita da tela
            anular_deslocamento()
            r.filepath = str(saida / f"{nome_acao}_{nome_dir}_{k:02d}.png")
            bpy.ops.render.render(write_still=True)
            meta["quadros"].append({"dir": nome_dir, "n": k, "quadro_origem": round(f, 3)})
    # Pivô vertical: onde o chão (z=0) cai na imagem.
    from bpy_extras.object_utils import world_to_camera_view
    v = world_to_camera_view(cena, cam, Vector((0, 0, 0)))
    meta["pivo_px"][1] = round((1 - v.y) * op["altura"], 1)
    (saida / "folha.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print("PRONTO", len(meta["quadros"]), "quadros em", saida)


main()
