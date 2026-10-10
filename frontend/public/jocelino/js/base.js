// Família Santos: Tijolo e Tempero (antes "Jocelino — Um legado em construção"). © Educação Gamer.
// base.js — o estado global G, ajudantes curtos, o relógio do jogo e o save (localStorage).
// O relógio: 10 minutos do jogo a cada 7 s reais; o dia vai das 6:00 às 2:00 (26:00), como no Stardew.

const TILE = 48;                 // pixels de mundo por ladrilho (a arte foi gerada nesse tamanho)
const VERSAO_SAVE = 1;
const CHAVE_SAVE = 'jocelino_save_v1';

const G = {
  agora: 0, quadros: 0,
  dia: 1, minutos: 6 * 60,
  dinheiro: 100,
  energia: 100, energiaMax: 100,
  mapa: null, mapaId: '',
  cam: { x: 0, y: 0 }, zoom: 1, dpr: 1, larg: 0, alt: 0,
  teclas: new Set(), mouse: { x: 0, y: 0, mundoX: 0, mundoY: 0 },
  pausado: false, somLigado: true, comecou: false,
  jog: null, save: null,
  avisosHoje: [], feitosHoje: [], ganhoHoje: 0, gastoHoje: 0,
};

// Ganchos que cada sistema preenche (os arquivos carregam em ordem; estas listas existem antes de todos).
const ATUALIZADORES = [];      // (dt) a cada quadro com o jogo correndo
const DESENHOS_TELA = [];      // (ctx) por cima do mundo, em pixels de tela
const INICIADORES = [];        // (save) ao começar ou carregar o jogo
const AO_MONTAR = [];          // (mapa) logo depois de um mapa ser montado (cada sistema ajusta o que é dele)

// ---------- ajudantes ----------
const $ = s => document.querySelector(s);
function el(tag, attrs, ...filhos) {
  const e = document.createElement(tag);
  for (const k in (attrs || {})) {
    const v = attrs[k];
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) e.append(f instanceof Node ? f : document.createTextNode(String(f)));
  return e;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const sorteio = lista => lista[Math.floor(Math.random() * lista.length)];
// Gerador com semente (o mesmo mapa sorteado sempre igual, como o _rng.seed do Godot).
function mulberry(semente) {
  let a = semente >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const chaveT = (x, y) => x + ',' + y;

// ---------- relógio ----------
const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const ESTACOES = ['Outono', 'Inverno', 'Primavera', 'Verão'];
const relogio = {
  SEG_POR_10MIN: 7, INICIO: 6 * 60, FIM: 26 * 60, _acum: 0,
  // Avança o tempo real `seg`; devolve quantos passos de 10 minutos passaram.
  avancar(seg) {
    this._acum += seg;
    let passos = 0;
    while (this._acum >= this.SEG_POR_10MIN && G.minutos < this.FIM) { this._acum -= this.SEG_POR_10MIN; G.minutos += 10; passos++; }
    return passos;
  },
  novoDia() { G.dia++; G.minutos = this.INICIO; this._acum = 0; },
  textoHora() { const h = Math.floor(G.minutos / 60) % 24, m = G.minutos % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); },
  textoDia() { return SEMANA[(G.dia - 1) % 7] + '. ' + ((G.dia - 1) % 28 + 1); },
  estacao() { return Math.floor((G.dia - 1) / 28) % 4; },
  domingo() { return (G.dia - 1) % 7 === 6; },
  // 0 de dia, 1 de noite fechada (escurece das 18h às 21h).
  escuridao() { return clamp((G.minutos - 18 * 60) / 180, 0, 1); },
};

// ---------- save ----------
function novoSave() {
  return { versao: VERSAO_SAVE, dia: 1, minutos: 6 * 60, dinheiro: 100, energia: 100, mapa: 'quintal', tile: [7, 10],
    mochila: null, sel: 0, pensao: null, mapas: {}, correio: { caixa: [], lidas: [] }, presente: false, compras: null, opcoes: null };
}
// Completa os campos que faltam num save de outra versão (nunca joga o save fora por um campo novo).
function migraSave(s) {
  const n = novoSave();
  if (!s || typeof s !== 'object') return n;
  for (const k in n) if (!(k in s)) s[k] = n[k];
  // A pensão aberta virou o palco de lado (10/10/2026): quem salvou no salão antigo com ela aberta acorda no palco.
  if (s.mapa === 'pensao_dentro' && s.pensao && ['aberta', 'pronta'].includes(s.pensao.estado)) { s.mapa = 'pensao_palco'; s.tile = [8, 18]; }
  s.versao = VERSAO_SAVE;
  return s;
}
function lerSave() {
  try { const t = localStorage.getItem(CHAVE_SAVE); return t ? migraSave(JSON.parse(t)) : null; }
  catch (e) { console.warn('save ilegível, começando outro', e); return null; }
}
function salvar() {
  if (!G.save || G.save.soTeste) return false;   // o atalho ?pensao=1 nunca grava por cima do save de verdade
  try { coletarSave(); localStorage.setItem(CHAVE_SAVE, JSON.stringify(G.save)); return true; }
  catch (e) { console.error('salvar falhou', e); if (typeof avisar === 'function') avisar('Não deu para salvar (memória do navegador cheia?).'); return false; }
}
// Os sistemas colocam o próprio estado no save (cada um registra uma função).
const COLETORES = [];
function coletarSave() {
  const s = G.save;
  s.dia = G.dia; s.minutos = G.minutos; s.dinheiro = G.dinheiro; s.energia = G.energia;
  for (const f of COLETORES) f(s);
}
