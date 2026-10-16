// Núcleo do Noite Sem Fim: configuração, modo de teste e laço de quadros. Sem engine, Canvas 2D puro.
// Valores de resolução são PROVISÓRIOS (docs/decisions.md).
(function (global) {
  "use strict";

  const CONFIG = {
    larguraBase: 1920,   // resolução lógica do mundo/tela (D-03)
    alturaBase: 1080,
    fpsTeste: 30,        // limite no modo de teste (?test=1)
    corFundo: "#0e0a17",
  };

  // ?test=1 liga o modo de teste: 30 fps, sem efeitos pesados, sem som. Sem o parâmetro, nada muda.
  function lerModoTeste(busca) {
    const p = new URLSearchParams(busca || "");
    return p.get("test") === "1";
  }

  // Decide se um quadro deve ser desenhado, respeitando o limite de fps (0 = sem limite).
  function deveDesenhar(agoraMs, ultimoMs, fpsMax) {
    if (!fpsMax) return true;
    return agoraMs - ultimoMs >= 1000 / fpsMax - 0.5;
  }

  // Escala que encaixa a resolução base inteira na tela, mantendo proporção (letterbox).
  function escalaParaTela(larguraTela, alturaTela, larguraBase, alturaBase) {
    const escala = Math.min(larguraTela / larguraBase, alturaTela / alturaBase);
    return {
      escala,
      dx: (larguraTela - larguraBase * escala) / 2,
      dy: (alturaTela - alturaBase * escala) / 2,
    };
  }

  const NSF = {
    CONFIG,
    lerModoTeste,
    deveDesenhar,
    escalaParaTela,
    estado: { pronto: false, quadros: 0, modoTeste: false, efeitos: true, som: true, erros: [] },
  };

  // Inicia o laço de desenho numa <canvas>. desenhar(ctx, t) recebe o contexto já na escala da resolução base.
  NSF.iniciar = function (canvas, desenhar) {
    const est = NSF.estado;
    est.modoTeste = lerModoTeste(global.location && global.location.search);
    est.efeitos = !est.modoTeste;
    est.som = !est.modoTeste;
    const fpsMax = est.modoTeste ? CONFIG.fpsTeste : 0;
    const ctx = canvas.getContext("2d");
    let ultimo = -Infinity;

    function ajustar() {
      const dpr = global.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    }
    global.addEventListener("resize", ajustar);
    ajustar();

    function quadro(agora) {
      global.requestAnimationFrame(quadro);
      if (!deveDesenhar(agora, ultimo, fpsMax)) return;
      ultimo = agora;
      const e = escalaParaTela(canvas.width, canvas.height, CONFIG.larguraBase, CONFIG.alturaBase);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(e.escala, 0, 0, e.escala, e.dx, e.dy);
      ctx.imageSmoothingEnabled = true; // arte pintada: suavização ligada (não é pixel art)
      ctx.imageSmoothingQuality = "high";
      desenhar(ctx, agora);
      est.quadros++;
      est.pronto = true;
    }
    global.requestAnimationFrame(quadro);
  };

  global.NSF = NSF;
  if (typeof module !== "undefined") module.exports = NSF;
})(typeof window !== "undefined" ? window : globalThis);
