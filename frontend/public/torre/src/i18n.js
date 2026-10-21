// Idioma do jogo: português (pt) ou inglês (en). A escolha fica no aparelho (torre-idioma); sem escolha, segue o idioma
// do aparelho (português abre em português, qualquer outro em inglês). Em Node (testes e robôs) o padrão é português.
// t('texto em português', ...valores): o próprio texto em português é a chave do dicionário (src/i18n/en.js); {0}, {1}…
// são trocados pelos valores. Sem tradução, devolve o português (e guarda em FALTAM, para o teste de navegador).
import { EN } from './i18n/en.js';

const KEY = 'torre-idioma';
function detectar() {
  if (globalThis.TORRE_LANG) return globalThis.TORRE_LANG;
  if (typeof window === 'undefined') return 'pt';
  try { const s = localStorage.getItem(KEY); if (s === 'pt' || s === 'en') return s; } catch (e) { }
  return /^pt/i.test(navigator.language || 'pt') ? 'pt' : 'en';
}
export let LANG = detectar();
export const FALTAM = new Set();

export function t(s, ...a) {
  let r = s;
  if (LANG === 'en' && s) { r = EN[s]; if (r == null) { FALTAM.add(s); r = s; } }
  return a.length ? r.replace(/\{(\d)\}/g, (m, i) => (a[i] ?? m)) : r;
}
// troca o idioma (os testes em Node podem trocar sem recarregar); no navegador grava a escolha e recarrega a página
export function setLang(l, recarregar = true) {
  LANG = l === 'en' ? 'en' : 'pt';
  try { localStorage.setItem(KEY, LANG); } catch (e) { }
  if (recarregar && typeof location !== 'undefined') location.reload();
}

// textos fixos do index.html: cada texto (e title, placeholder, aria-label, alt) que tiver tradução é trocado uma vez,
// ao abrir. O que a interface monta depois passa por t().
const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
export function traduzirDOM(root = document.body) {
  document.documentElement.lang = LANG === 'en' ? 'en' : 'pt-BR';
  if (LANG !== 'en') return;
  if (EN[document.title]) document.title = EN[document.title];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const s = n.nodeValue, k = s.trim();
    if (k && EN[k] != null) n.nodeValue = s.replace(k, EN[k]);
  }
  for (const el of root.querySelectorAll('[title],[placeholder],[aria-label],[alt]'))
    for (const a of ATTRS) { const v = el.getAttribute(a); if (v && EN[v] != null) el.setAttribute(a, EN[v]); }
}
if (typeof document !== 'undefined' && document.body) traduzirDOM();
// testes de navegador: o que ficou sem tradução nesta página
if (typeof window !== 'undefined') window.torreI18n = { FALTAM, get LANG() { return LANG; } };
