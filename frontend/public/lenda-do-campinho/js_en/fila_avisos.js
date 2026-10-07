/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📬 FILA DE AVISOS (v351 — "os primeiros 10 minutos", item 1 do dono)
   Ao entrar no jogo, em ~1 segundo apareciam juntos: a faixa do topo ("Sua casa — Dia 1"), a faixa da proposta de
   carreira (que APAGAVA a primeira antes de dar para ler), avisos verdes de adorno e de arena, dica...
   - FAIXAS DO TOPO (banner): agora uma de cada vez, cada uma com o seu tempo (faixa repetida não entra de novo).
   - AVISOS VERDES (avisoTela): nos primeiros 8 s depois de entrar, um por vez, com folga entre eles.
   (As dicas já tinham fila própria.) Carregar DEPOIS de teclas.js, avisos.js e carga_rapida.js.
   ============================================================ */
{
  const FA = { fila: [], ativo: false, entrouEm: 0, avisos: [], avAtivo: false };
  window.FILA_AVISOS = FA;
  const _bannerFA = banner;
  function proxBanner() {
    const b = FA.fila.shift(); if (!b) { FA.ativo = false; return; }
    FA.ativo = true; _bannerFA.call(this, b[0], b[1]);
    setTimeout(proxBanner, 2700);
  }
  banner = function (t1, t2 = '') {
    if (FA.fila.some(b => b[0] === t1 && b[1] === t2)) return;
    FA.fila.push([t1, t2]); if (FA.fila.length > 4) FA.fila.splice(0, FA.fila.length - 4); // fila curta: se acumular, ficam os mais novos
    if (!FA.ativo) proxBanner();
  };
  // avisos verdes logo depois de entrar: um por vez
  if (typeof avisoTela === 'function') {
    const _avisoFA = avisoTela;
    function proxAviso() {
      const a = FA.avisos.shift(); if (!a) { FA.avAtivo = false; return; }
      FA.avAtivo = true; _avisoFA.apply(this, a); setTimeout(proxAviso, 1800);
    }
    avisoTela = function () {
      if (performance.now() - FA.entrouEm > 8000 && !FA.avAtivo) return _avisoFA.apply(this, arguments);
      if (FA.avisos.length < 5) FA.avisos.push([...arguments]);
      if (!FA.avAtivo) proxAviso();
    };
  }
  const _iniciarFA = iniciarJogo;
  iniciarJogo = async function () { FA.entrouEm = performance.now() + 1e9; const r = await _iniciarFA.apply(this, arguments); FA.entrouEm = performance.now(); return r; };
}
