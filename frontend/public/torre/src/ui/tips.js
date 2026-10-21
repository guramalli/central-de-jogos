// Dicas para quem começa (Obra Viva): decide qual dica mostrar e quando. Uma por vez; cada uma só uma vez (S.dicas).
// Ordem: fim de obra e proposta primeiro (são momentos), depois o começo (placas e Melhorias), a primeira vez na árvore
// (ramos, pedreiro, efeito, comprar) e as de primeira vez (subida, aluguel, sinais na obra).
import { S, save } from '../sim/state.js';
import { TIPS, START_SEQ, TREE_SEQ } from '../data/tips.js';
import { UP } from '../data/upgrades.js';
import { VIVA } from '../data/viva.js';
import { FLAGS } from '../data/flags.js';
import { FH, TL, TW, SLAB } from '../data/constants.js';
import { V } from '../render/view.js';
import { introActive } from './intro.js';
import { skillsOpen, closeSkills, selectedKey, revealNode } from './skills.js';
import { cfg, setCfg } from './config.js';
import { homeOpen } from './home.js';
import { showTip, coachBusy, coachTip, dropTip, rectOf, worldRect, updateCoach } from './coach.js';
import { closeGear } from './gear.js';

const $ = id => document.getElementById(id);
let enabled = false;
const since = {}; // desde quando cada sinal da obra está ligado (s de jogo)
const seen = k => !!(S.dicas && S.dicas[k]);
const shown = id => { const e = $(id); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; };
const lasting = (k, on, secs) => { if (!on) { delete since[k]; return false; } since[k] ??= V.t; return V.t - since[k] >= secs; };

const TARGET = {
  andar: rectOf('#hPlateFloor'), dinheiro: rectOf('#hPlateMoney'), relogio: rectOf('#hPlateClock'), melhorias: rectOf('#openUp'),
  ramos: rectOf('#skTree'), pedreiro: rectOf('[data-up="pedreiro"]'), efeito: rectOf('#sdFx'), comprar: rectOf('#sdBuy'),
  subida: rectOf('#sdFx'), aluguel: rectOf('#sdFx'),
  limite: rectOf('#openUp'),
  dormindo: () => worldRect(TL, Math.floor(S.floors) * FH + SLAB, TW, FH * 0.8)(),
  pilha: worldRect(160, 0, 100, 70),
};
const tip = id => showTip(id, TARGET[id], { action: !!TIPS[id].a });

export function initTips({ test = false } = {}) {
  enabled = FLAGS.viva && !test;
  $('skTips').onclick = () => { dropTip(); setCfg({ dicas: true }); S.dicas = {}; save(); closeGear(); closeSkills(); }; // rever todas desde o começo (e religa)
}
export const setTips = on => { enabled = FLAGS.viva && !!on; };
export const tickTips = () => { if (enabled) updateCoach(); };

export function updateTips() {
  if (!enabled || !cfg().dicas || introActive() || homeOpen()) return; // nada por cima da página de Início
  updateCoach();
  if (coachBusy()) return;
  const open = skillsOpen(), sg = V.signs || {};
  if (!open) { const k = START_SEQ.find(x => !seen(x)); if (k) { tip(k); return; } }
  if (open) {
    if (!seen('melhorias')) { S.dicas = { ...S.dicas, melhorias: true }; save(); } // abriu sozinho: a dica de Melhorias já foi aprendida
    const k = TREE_SEQ.find(x => !seen(x));
    if (k) { if (k === 'pedreiro') revealNode('pedreiro'); tip(k); return; }
    const b = selectedKey() && UP[selectedKey()] && UP[selectedKey()].b;
    if (!seen('subida') && b === 'log') { tip('subida'); return; }
    if (!seen('aluguel') && b === 'merc') { tip('aluguel'); return; }
    return;
  }
  if (START_SEQ.some(x => !seen(x))) return;
  if (!seen('limite') && lasting('limite', sg.capped, 2)) { tip('limite'); return; }
  if (!seen('dormindo') && lasting('dormindo', sg.starving, 3)) { tip('dormindo'); return; }
  if (!seen('pilha') && lasting('pilha', sg.groundJam, 3)) { tip('pilha'); return; }
}
