/* Lenda do Campinho — vitrine (/lenda/). © 2026 Educação Gamer. Todos os direitos reservados. */
/* Idioma da vitrine (PT/EN): escolhe o inicial (?lang= > escolha salva >
   idioma do navegador > português), aplica os textos de window.TEXTOS nos
   elementos marcados com data-t* e troca pelo botão PT/EN sem recarregar.
   Avisa a página com o evento "idioma" (o trailer troca de língua). */
(function (raiz) {
  'use strict';
  const IDIOMAS = ['pt', 'en'];
  function inicial(op) {
    const o = op || {};
    for (const v of [o.param, o.salvo]) { const c = String(v || '').toLowerCase(); if (IDIOMAS.includes(c)) return c; }
    return /^en\b/i.test(String(o.navegador || '')) ? 'en' : 'pt';
  }
  function aplica(doc, textos, lang) {
    const T = (textos && textos[lang]) || (textos && textos.pt) || {};
    doc.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    const cada = (attr, fn) => doc.querySelectorAll(`[${attr}]`).forEach((el) => { const v = T[el.getAttribute(attr)]; if (v != null) fn(el, v); });
    cada('data-t', (el, v) => { el.textContent = v; });
    cada('data-t-html', (el, v) => { el.innerHTML = v; });
    cada('data-t-alt', (el, v) => { if (el.tagName === 'IMG') el.alt = v; else el.dataset.alt = v; });
    cada('data-t-aria', (el, v) => { el.setAttribute('aria-label', v); });
    if (T['meta.titulo']) doc.title = T['meta.titulo'];
    doc.querySelectorAll('[data-idioma]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.idioma === lang)));
    doc.dispatchEvent(new doc.defaultView.CustomEvent('idioma', { detail: lang }));
  }
  raiz.Idioma = { IDIOMAS, inicial, aplica };
  if (typeof document === 'undefined') return;

  let salvo = null;
  try { salvo = localStorage.getItem('lenda_idioma'); } catch (e) { /* armazenamento bloqueado */ }
  const param = new URLSearchParams(location.search).get('lang');
  aplica(document, raiz.TEXTOS, inicial({ param, salvo, navegador: navigator.language }));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-idioma]');
    if (!b) return;
    try { localStorage.setItem('lenda_idioma', b.dataset.idioma); } catch (er) { /* sem memória */ }
    aplica(document, raiz.TEXTOS, b.dataset.idioma);
  });
})(typeof window !== 'undefined' ? window : globalThis);
