/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🖼️ ÍCONES QUE SE ATUALIZAM SOZINHOS (v330). O dono abriu o armazém e a Camisa da Armadura Negra "não estava lá";
   depois "apareceu". Causa: a arte de cada item só carrega na primeira vez que ele aparece; enquanto ela não chega,
   o ícone saía VAZIO (itens de arte tingida, atlantida.js), só com o brilho (míticos, arenas.js) ou com o desenho
   genérico (assets.js) — e a janela já aberta ficava assim. Agora:
   - o ícone pedido antes da hora é marcado como "esperando a arte";
   - a cópia que vai para a janela (iconeClone) se redesenha sozinha quando a arte chega;
   - os painéis (mochila, barra de atalhos) são redesenhados (G.uiSujo).
   Carregar DEPOIS de assets.js, arte.js, atlantida.js e arenas.js (no fim).
   ============================================================ */
(function () {
  const ESPERA = new WeakMap(); // canvas → id do item cuja arte ainda está chegando
  const arteDo = id => { const it = ITENS[id] || {}; return it.iconeBase || (typeof ICON_ALIAS !== 'undefined' && ICON_ALIAS[id]) || 'i_' + id; };
  const pronta = nome => { if (typeof ASSET_SET !== 'undefined' && !ASSET_SET.has(nome)) return true; const e = spr(nome); return !!(e && e.ok); };
  const _iconeItemViva = iconeItem;
  iconeItem = function (id) {
    const c = _iconeItemViva.apply(this, arguments);
    try { if (c && ITENS[id] && !pronta(arteDo(id))) { ESPERA.set(c, id); FALTAM.add(arteDo(id)); } } catch (e) { }
    return c;
  };
  // os painéis que se desenham sozinhos (mochila, atalhos) são refeitos quando alguma arte que faltava chega
  const FALTAM = new Set();
  setInterval(() => { if (!FALTAM.size) return; let chegou = false; for (const nome of FALTAM) if (pronta(nome)) { FALTAM.delete(nome); chegou = true; } if (chegou && typeof G !== 'undefined') G.uiSujo = true; }, 400);
  const _iconeCloneViva = iconeClone;
  iconeClone = function (c) {
    const n = _iconeCloneViva.apply(this, arguments);
    const id = c && ESPERA.get(c);
    if (id) {
      const nome = arteDo(id); let voltas = 0;
      const tenta = () => {
        if (++voltas > 120) return; // 30 s: desiste (arte com erro)
        if (!pronta(nome)) { setTimeout(tenta, 250); return; }
        try { const novo = iconeItem(id); n.width = novo.width; n.height = novo.height; n.getContext('2d').drawImage(novo, 0, 0); G.uiSujo = true; } catch (e) { } // mesmo tamanho da arte (nítido); o CSS cuida do tamanho na tela
      };
      setTimeout(tenta, 250);
    }
    return n;
  };
})();
