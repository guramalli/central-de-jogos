"""Gera a FORMA 3D do personagem a partir das 4 vistas (Hunyuan3D-2mv, local, na placa de vídeo).

Roda no Python das ferramentas 3D (fora do projeto), não no Python do sistema:
    C:/Users/gh0st/Projects/ferramentas3d/.venv/Scripts/python.exe tools/modelo3d_gerar.py <pasta_entrada> <saida.glb>
        [--passos 50] [--resolucao 380] [--semente 12345] [--faces 60000]

Entrada: front.png, left.png, back.png, right.png (RGBA, de tools/modelo3d_entradas.py).
Saída: malha sem textura (a cor vem depois, projetando os próprios desenhos — tools/modelo3d_pintar.py).
Licença do modelo: Tencent Hunyuan 3D 2.0 Community License (ver o repositório do Hunyuan3D-2).
"""
import argparse
import os
import sys
import time
from pathlib import Path

FERRAMENTAS = Path("C:/Users/gh0st/Projects/ferramentas3d")
os.environ.setdefault("HF_HOME", str(FERRAMENTAS / "hf"))  # modelos baixados ficam junto das ferramentas
sys.path.insert(0, str(FERRAMENTAS / "Hunyuan3D-2"))

import torch  # noqa: E402
from PIL import Image  # noqa: E402
from hy3dgen.shapegen import (DegenerateFaceRemover, FaceReducer, FloaterRemover,  # noqa: E402
                              Hunyuan3DDiTFlowMatchingPipeline)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entrada")
    ap.add_argument("saida")
    ap.add_argument("--passos", type=int, default=50)
    ap.add_argument("--resolucao", type=int, default=380)
    ap.add_argument("--semente", type=int, default=12345)
    ap.add_argument("--faces", type=int, default=60000)
    ap.add_argument("--vistas", default="front,left,back,right")
    a = ap.parse_args()

    imagens = {v: Image.open(Path(a.entrada) / f"{v}.png").convert("RGBA") for v in a.vistas.split(",")}
    t0 = time.time()
    pipe = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(
        "tencent/Hunyuan3D-2mv", subfolder="hunyuan3d-dit-v2-mv", variant="fp16")
    print(f"modelo carregado em {time.time() - t0:.0f} s", flush=True)
    t0 = time.time()
    malha = pipe(image=imagens, num_inference_steps=a.passos, octree_resolution=a.resolucao,
                 num_chunks=20000, generator=torch.manual_seed(a.semente), output_type="trimesh")[0]
    print(f"forma gerada em {time.time() - t0:.0f} s | faces: {len(malha.faces)}", flush=True)
    malha = FloaterRemover()(malha)
    malha = DegenerateFaceRemover()(malha)
    malha = FaceReducer()(malha, max_facenum=a.faces)
    Path(a.saida).parent.mkdir(parents=True, exist_ok=True)
    malha.export(a.saida)
    print(f"ok {a.saida} | faces finais: {len(malha.faces)} | memória máx. da placa: "
          f"{torch.cuda.max_memory_allocated() / 2**30:.1f} GB", flush=True)


if __name__ == "__main__":
    main()
