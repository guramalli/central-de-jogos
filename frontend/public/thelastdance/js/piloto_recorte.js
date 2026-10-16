// Cena do piloto de recorte: o protagonista grande (para avaliar o acabamento) e no tamanho de jogo (~300 px).
(function () {
  "use strict";
  const { CONFIG, estado, Recorte, ANIM_PROTAGONISTA: ANIM } = NSF;
  const params = new URLSearchParams(location.search);
  const PASTA = "assets/characters/protagonist/recorte/v01/";
  const ALTURA_FONTE = 1510; // do topo do cabelo à sola do tênis, em pixels do conceito

  let boneco = null;
  let animAtual = ANIM[params.get("anim")] ? params.get("anim") : "andar";
  const congelado = params.has("t") ? Number(params.get("t")) : null;
  let relogio = 0, ultimo = null;

  const botoes = document.querySelectorAll("[data-anim]");
  function marcar() { botoes.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.anim === animAtual))); }
  botoes.forEach((b) => b.addEventListener("click", () => { animAtual = b.dataset.anim; relogio = 0; marcar(); }));
  marcar();
  const verOssos = document.getElementById("ossos");
  const lento = document.getElementById("lento");

  function fundo(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, CONFIG.alturaBase);
    g.addColorStop(0, "#160b26"); g.addColorStop(0.62, "#2a0f3d"); g.addColorStop(1, "#3a1046");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CONFIG.larguraBase, CONFIG.alturaBase);
    // Piso com linhas neon em perspectiva isométrica (só para dar contexto de cor e escala).
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

  function desenhar(ctx, agora) {
    fundo(ctx);
    if (!boneco) return;
    if (ultimo != null) relogio += ((agora - ultimo) / 1000) * (lento.checked ? 0.25 : 1);
    ultimo = agora;
    const anim = ANIM[animAtual];
    const pose = congelado != null ? anim.pose(congelado, boneco.rig) : Recorte.amostrar(anim, relogio, boneco.rig);

    // Grande: ~960 px de altura lógica.
    const eG = 960 / ALTURA_FONTE;
    sombra(ctx, 620, 1040, 210);
    const info = Recorte.desenhar(ctx, boneco, pose, 620, 1040, eG, false);
    if (verOssos.checked) Recorte.desenharOssos(ctx, boneco, info);

    // Tamanho de jogo: ~300 px, e a versão espelhada (para o outro lado da tela).
    const eJ = 300 / ALTURA_FONTE;
    for (const [x, esp] of [[1330, false], [1640, true]]) {
      sombra(ctx, x, 880, 70);
      Recorte.desenhar(ctx, boneco, pose, x, 880, eJ, esp);
    }
    ctx.fillStyle = "#cbb8ef";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("tamanho de jogo (~300 px) · normal e espelhado", 1485, 940);
  }

  Recorte.carregar(PASTA).then((b) => { boneco = b; window.NSF_PILOTO = { pronto: true }; })
    .catch((e) => { estado.erros.push(String(e)); console.error(e); });
  NSF.iniciar(document.getElementById("tela"), desenhar);
})();
