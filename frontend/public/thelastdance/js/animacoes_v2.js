// Página de avaliação das animações do personagem v2: grande (acabamento) e no tamanho de jogo (~300 px),
// de frente, de lado e de lado espelhado (a vista de lado olhando para a esquerda é a mesma, espelhada).
(function () {
  "use strict";
  const { CONFIG, estado, Recorte, ANIM_V2: ANIM } = NSF;
  const params = new URLSearchParams(location.search);
  const PASTA = "assets/characters/personagem_v2/";
  const ALTURA_FONTE = 815; // do topo do cabelo à sola, em pixels da prancha

  const bonecos = {};
  let anim = ANIM.frente[params.get("anim")] ? params.get("anim") : "andar";
  let vista = ["frente", "lado", "lado-esq"].includes(params.get("vista")) ? params.get("vista") : "frente";
  const congelado = params.has("t") ? Number(params.get("t")) : null;
  let relogio = 0, ultimo = null;

  function marcar() {
    document.querySelectorAll("[data-anim]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.anim === anim)));
    document.querySelectorAll("[data-vista]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vista === vista)));
  }
  document.querySelectorAll("[data-anim]").forEach((b) => b.addEventListener("click", () => { anim = b.dataset.anim; relogio = 0; marcar(); }));
  document.querySelectorAll("[data-vista]").forEach((b) => b.addEventListener("click", () => { vista = b.dataset.vista; marcar(); }));
  marcar();
  const verOssos = document.getElementById("ossos");
  const lento = document.getElementById("lento");

  function fundo(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, CONFIG.alturaBase);
    g.addColorStop(0, "#160b26"); g.addColorStop(0.62, "#2a0f3d"); g.addColorStop(1, "#3a1046");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CONFIG.larguraBase, CONFIG.alturaBase);
    ctx.strokeStyle = "rgba(255,70,200,0.25)";
    ctx.lineWidth = 2;
    for (let i = -20; i <= 20; i++) {
      ctx.beginPath(); ctx.moveTo(960 + i * 120, 760); ctx.lineTo(960 + i * 120 - 640, 1080); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(960 + i * 120, 760); ctx.lineTo(960 + i * 120 + 640, 1080); ctx.stroke();
    }
  }

  function sombra(ctx, x, y, larg) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath(); ctx.ellipse(x, y, larg, larg * 0.28, 0, 0, 2 * Math.PI); ctx.fill();
    ctx.restore();
  }

  function poseDe(nomeVista) {
    const b = bonecos[nomeVista];
    const a = ANIM[nomeVista][anim];
    return congelado != null ? a.pose(congelado, b.rig) : Recorte.amostrar(a, relogio, b.rig);
  }

  function desenhar(ctx, agora) {
    fundo(ctx);
    if (!bonecos.frente || !bonecos.lado) return;
    if (ultimo != null) relogio += ((agora - ultimo) / 1000) * (lento.checked ? 0.25 : 1);
    ultimo = agora;

    // Grande, na vista escolhida.
    const v = vista === "frente" ? "frente" : "lado";
    const eG = 940 / ALTURA_FONTE;
    sombra(ctx, 600, 1040, 200);
    const info = Recorte.desenhar(ctx, bonecos[v], poseDe(v), 600, 1040, eG, vista === "lado-esq");
    if (verOssos.checked) Recorte.desenharOssos(ctx, bonecos[v], info);

    // Tamanho de jogo: frente, lado e lado espelhado.
    const eJ = 300 / ALTURA_FONTE;
    const pequenos = [["frente", false, 1220], ["lado", false, 1480], ["lado", true, 1740]];
    for (const [nv, esp, x] of pequenos) {
      sombra(ctx, x, 880, 70);
      Recorte.desenhar(ctx, bonecos[nv], poseDe(nv), x, 880, eJ, esp);
    }
    ctx.fillStyle = "#cbb8ef";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("tamanho de jogo (~300 px): frente · lado · lado espelhado", 1480, 945);
  }

  Promise.all(["frente", "lado"].map((nv) => Recorte.carregar(PASTA + nv + "/").then((b) => { bonecos[nv] = b; })))
    .then(() => { window.NSF_V2 = { pronto: true }; })
    .catch((e) => { estado.erros.push(String(e)); console.error(e); });
  NSF.iniciar(document.getElementById("tela"), desenhar);
})();
