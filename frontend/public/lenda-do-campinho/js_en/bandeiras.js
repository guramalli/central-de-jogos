/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏳️ BANDEIRAS DESENHADAS (v407, Raio-X R9)
   O Windows não tem as bandeiras em emoji: "🇧🇷" aparecia como as letras "BR" ("Brasil BR" na carreira, na seleção,
   na viagem...). Aqui cada bandeira é um desenhinho (SVG feito por código, sem arquivo para baixar):
   - nos textos da página (janelas, cartões, listas), o emoji vira uma imagem pequena da bandeira;
   - dentro de campos de texto, títulos e no canvas do jogo, onde não cabe imagem, a bandeira sai e fica só o nome.
   Só liga quando o navegador NÃO desenha bandeiras (Windows); no celular e no Mac continua o emoji.
   Prefixo: bdr. Pode carregar em qualquer ponto (depois de utils.js).
   ============================================================ */
const BDR_SVG = {
  BR: '<rect width="30" height="20" fill="#229e45"/><path d="M15 2.6 27.4 10 15 17.4 2.6 10z" fill="#f8d838"/><circle cx="15" cy="10" r="4.6" fill="#22408c"/><path d="M10.6 9.2c3-.9 6.2-.6 8.8.9" stroke="#fff" stroke-width=".9" fill="none"/>',
  EG: '<rect width="30" height="20" fill="#111"/><rect width="30" height="13.3" fill="#fff"/><rect width="30" height="6.7" fill="#ce1126"/><path d="M15 7.6l1.6 1.5v2.6H13.4V9.1z" fill="#c09300"/>',
  JP: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="5.6" fill="#bc002d"/>',
  QA: '<rect width="30" height="20" fill="#8a1538"/><path d="M0 0h9l3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1H0z" fill="#fff"/>',
  US: '<rect width="30" height="20" fill="#fff"/><path d="M0 0h30v1.54H0zm0 3.08h30v1.54H0zm0 3.08h30V7.7H0zm0 3.08h30v1.54H0zm0 3.08h30v1.54H0zm0 3.08h30v1.54H0zm0 3.08h30V20H0z" fill="#b22234"/><rect width="13" height="10.8" fill="#3c3b6e"/><g fill="#fff"><circle cx="2.2" cy="2" r=".7"/><circle cx="5.4" cy="2" r=".7"/><circle cx="8.6" cy="2" r=".7"/><circle cx="11" cy="2" r=".7"/><circle cx="3.8" cy="4.2" r=".7"/><circle cx="7" cy="4.2" r=".7"/><circle cx="10.2" cy="4.2" r=".7"/><circle cx="2.2" cy="6.4" r=".7"/><circle cx="5.4" cy="6.4" r=".7"/><circle cx="8.6" cy="6.4" r=".7"/><circle cx="11" cy="6.4" r=".7"/><circle cx="3.8" cy="8.6" r=".7"/><circle cx="7" cy="8.6" r=".7"/><circle cx="10.2" cy="8.6" r=".7"/></g>',
  PT: '<rect width="30" height="20" fill="#da291c"/><rect width="12" height="20" fill="#046a38"/><circle cx="12" cy="10" r="3.6" fill="#ffe900" stroke="#9a7a00" stroke-width=".5"/><path d="M10.4 8.2h3.2v2.6c0 1.2-.7 1.8-1.6 1.8s-1.6-.6-1.6-1.8z" fill="#da291c" stroke="#fff" stroke-width=".5"/>',
  ES: '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/><rect x="7" y="7.4" width="3.4" height="5.2" rx=".8" fill="#aa151b" opacity=".85"/>',
  IT: '<rect width="30" height="20" fill="#fff"/><rect width="10" height="20" fill="#009246"/><rect x="20" width="10" height="20" fill="#ce2b37"/>',
  DE: '<rect width="30" height="20" fill="#ffce00"/><rect width="30" height="13.3" fill="#dd0000"/><rect width="30" height="6.7" fill="#000"/>',
  GB: '<rect width="30" height="20" fill="#012169"/><path d="M0 0l30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="3.4"/>',
  AR: '<rect width="30" height="20" fill="#74acdf"/><rect y="6.7" width="30" height="6.6" fill="#fff"/><circle cx="15" cy="10" r="2.2" fill="#f6b40e" stroke="#85340a" stroke-width=".4"/>',
  FR: '<rect width="30" height="20" fill="#fff"/><rect width="10" height="20" fill="#002395"/><rect x="20" width="10" height="20" fill="#ed2939"/>',
};
const BDR_RX = /[\u{1F1E6}-\u{1F1FF}]{2}/gu;
const bdrCodigo = par => [...par].map(c => String.fromCharCode(c.codePointAt(0) - 0x1F1E6 + 65)).join('');
const BDR_URL = {};
function bandeiraURL(cod) {
  if (!BDR_SVG[cod]) return null;
  if (!BDR_URL[cod]) BDR_URL[cod] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="30" height="20">${BDR_SVG[cod]}<rect x=".4" y=".4" width="29.2" height="19.2" fill="none" stroke="rgba(0,0,0,.35)" stroke-width=".8"/></svg>`);
  return BDR_URL[cod];
}
// imagem da bandeira para usar em qualquer janela (ex.: el('span', {}, bandeiraImg('BR'), ' Brasil'))
function bandeiraImg(cod, alt) { const u = bandeiraURL(cod); if (!u) return document.createTextNode(''); const i = document.createElement('img'); i.className = 'bdr-img'; i.src = u; i.alt = ''; i.title = alt || ''; i.draggable = false; return i; }

// o navegador desenha a bandeira em emoji? (no Windows não: vira duas letras em preto e branco)
const BDR_TEM_EMOJI = (() => {
  try {
    const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d');
    x.textBaseline = 'top'; x.font = '20px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; x.fillText('\u{1F1E7}\u{1F1F7}', 0, 0);
    const d = x.getImageData(0, 0, 24, 24).data; let cor = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 60 && (Math.abs(d[i] - d[i + 1]) > 40 || Math.abs(d[i + 1] - d[i + 2]) > 40)) cor++;
    return cor > 12;
  } catch (e) { return false; }
})();

if (!BDR_TEM_EMOJI) {
  const semImg = n => { const p = n.parentElement; return !p || /^(OPTION|TEXTAREA|SCRIPT|STYLE|TITLE|INPUT|SELECT)$/.test(p.tagName) || p.isContentEditable; };
  const troca = n => {
    const t = n.nodeValue; if (!t || !BDR_RX.test(t)) return; BDR_RX.lastIndex = 0;
    if (semImg(n)) { n.nodeValue = t.replace(BDR_RX, '').replace(/\s{2,}/g, ' '); return; }
    const frag = document.createDocumentFragment(); let ult = 0;
    t.replace(BDR_RX, (m, i) => { if (i > ult) frag.append(t.slice(ult, i)); const cod = bdrCodigo(m); frag.append(BDR_SVG[cod] ? bandeiraImg(cod) : ''); ult = i + m.length; return m; });
    if (ult < t.length) frag.append(t.slice(ult));
    n.replaceWith(frag);
  };
  const varre = raiz => {
    if (raiz.nodeType === 3) return troca(raiz);
    if (raiz.nodeType !== 1 || !BDR_RX.test(raiz.textContent || '')) { BDR_RX.lastIndex = 0; return; }
    BDR_RX.lastIndex = 0;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT); const nos = []; while (w.nextNode()) nos.push(w.currentNode);
    nos.forEach(troca);
  };
  const tiraAttr = e => { if (e.nodeType !== 1) return; for (const a of ['title', 'aria-label', 'placeholder']) { const v = e.getAttribute && e.getAttribute(a); if (v && BDR_RX.test(v)) { BDR_RX.lastIndex = 0; e.setAttribute(a, v.replace(BDR_RX, '').replace(/\s{2,}/g, ' ').trim()); } BDR_RX.lastIndex = 0; } };
  const obs = new MutationObserver(lista => {
    for (const m of lista) {
      if (m.type === 'characterData') troca(m.target);
      else if (m.type === 'attributes') tiraAttr(m.target);
      else for (const n of m.addedNodes) { varre(n); if (n.nodeType === 1) { tiraAttr(n); n.querySelectorAll && n.querySelectorAll('[title]').forEach(tiraAttr); } }
    }
  });
  const liga = () => { varre(document.body); obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder'] }); };
  if (document.body) liga(); else document.addEventListener('DOMContentLoaded', liga);
  // canvas do jogo: sem imagem no meio do texto — a bandeira sai e fica só o nome
  try {
    const P = CanvasRenderingContext2D.prototype;
    for (const f of ['fillText', 'strokeText', 'measureText']) {
      const orig = P[f];
      P[f] = function (txt, ...r) { if (typeof txt === 'string' && txt.length > 1 && BDR_RX.test(txt)) { BDR_RX.lastIndex = 0; txt = txt.replace(BDR_RX, '').replace(/\s{2,}/g, ' ').trim(); } BDR_RX.lastIndex = 0; return orig.call(this, txt, ...r); };
    }
  } catch (e) { }
  // tamanho da bandeirinha no meio do texto
  const st = document.createElement('style');
  st.textContent = `.bdr-img { display: inline-block; width: 1.35em; height: .9em; vertical-align: -0.08em; margin: 0 .12em; border-radius: 2px; box-shadow: 0 0 0 1px rgba(0,0,0,.18); object-fit: cover; }`;
  document.head.append(st);
}
