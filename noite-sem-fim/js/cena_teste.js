// Cena vazia de testes da FASE 0: só confirma que a página abre e desenha. Sem personagem, mapa ou mecânica.
(function () {
  "use strict";
  const { CONFIG, estado } = NSF;

  function desenhar(ctx) {
    ctx.fillStyle = CONFIG.corFundo;
    ctx.fillRect(0, 0, CONFIG.larguraBase, CONFIG.alturaBase);
    ctx.fillStyle = "#e9e4f5";
    ctx.textAlign = "center";
    ctx.font = "600 40px system-ui, sans-serif";
    ctx.fillText("Noite Sem Fim — cena de teste vazia (FASE 0)", CONFIG.larguraBase / 2, CONFIG.alturaBase / 2 - 10);
    ctx.font = "28px system-ui, sans-serif";
    ctx.fillStyle = "#9d93b8";
    ctx.fillText("Canvas 2D, sem engine · base " + CONFIG.larguraBase + "×" + CONFIG.alturaBase +
      (estado.modoTeste ? " · modo de teste (30 fps, sem efeitos, sem som)" : ""),
      CONFIG.larguraBase / 2, CONFIG.alturaBase / 2 + 40);
  }

  NSF.iniciar(document.getElementById("tela"), desenhar);
})();
