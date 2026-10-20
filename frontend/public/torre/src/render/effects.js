// Obra Viva — o que cada evento mostra e toca. Só apresentação: nada aqui mexe em saldo.
import { FH, TW, TL, SLAB, MPF } from '../data/constants.js';
import { altOf, floorOf, mpfAt } from '../data/height.js';
import { ERA_STYLE, eraAt } from '../data/eras.js';
import { UP } from '../data/upgrades.js';
import { S } from '../sim/state.js';
import { V } from './view.js';
import { dust } from './particles.js';
import { SHAFT_X, SHAFT_W } from './tower.js';
import { onEvent } from './events.js';
import { sfx } from '../ui/audio.js';
import { FLAGS } from '../data/flags.js';
import { VIVA } from '../data/viva.js';
import { rentSum } from '../sim/realty.js';
import { fmt } from '../ui/format.js';
import { eraVis, onMoon } from './eravis.js';

export const MAX_TOP_WORKERS = 6; // acima disso, os pedreiros viram uma equipe com contador

const topY = () => Math.floor(S.floors) * FH;
let floatGate = 0; // limita textos quando a obra está muito rápida

// texto que sobe e some (coordenadas de mundo)
const RISE = 20, GAP = 34; // os textos sobem RISE px/s; dois textos na mesma faixa ficam a pelo menos GAP px
export function float(x, y, a, b = '', c = '#f2b630', life = 2.2, extra = null) {
  while (V.floats.length >= 3) V.floats.shift(); // no máximo 3 textos na tela
  // fila: o novo texto nasce acima de todos os que estão subindo na mesma faixa (pela altura de agora, não a de nascer)
  let yy = y;
  for (const f of V.floats) if (Math.abs(f.x - x) < 120) { const cur = f.y + f.t * RISE; if (Math.abs(cur - yy) < GAP || (cur > yy && cur < yy + 160)) yy = Math.max(yy, cur + GAP); }
  V.floats.push({ x, y: yy, a, b, c, t: 0, life, ...extra });
}

export function updateEffects(dt) {
  floatGate = Math.max(0, floatGate - dt);
  V.floats = V.floats.filter(f => (f.t += dt) < f.life);
  if (V.flash && (V.flash.t -= dt) <= 0) V.flash = null;
  for (let i = 0; i < V.shaftBuild.length; i++) if (V.shaftBuild[i] < 1) V.shaftBuild[i] = Math.min(1, V.shaftBuild[i] + dt / 1.6);
  if (V.craneBuild < 1) V.craneBuild = Math.min(1, V.craneBuild + dt / 2.2);
}

// andares concluídos em seguida viram um texto só ("+3 ANDARES"), que se renova; devolve se juntou
function mergeFloor(n, pay) {
  const last = V.floats.find(f => f.floor && f.t < 1.4);
  if (!last) return false;
  last.n = (last.n || 1) + n; last.a = `+${last.n} ANDARES`; if (pay) last.b = pay; last.t = Math.min(last.t, 0.25);
  return true;
}
function onFloor(e) {
  const y = e.to * FH, st = ERA_STYLE[eraVis(altOf(y / FH))];
  if (e.n <= 2) {
    // celebração completa: luzes acendem, poeira na laje e "+1 andar"
    V.flash = { i: e.to - 1, t: 1.8 };
    for (let k = 0; k < 6; k++) dust(TL + 20 + k * 40, y + 2, k % 2 ? '#ffe27a' : '#d8cdb8', 3, 1.2);
    // protótipo Obra Viva: a recompensa do andar entregue aparece junto; no modo atual, o lembrete de decidir o destino
    const first = !FLAGS.viva && S.assigned < e.to && S.lv.corretor < 1 && e.to <= 3;
    const pay = FLAGS.viva ? `+R$ ${fmt(rentSum(e.from, e.n) * VIVA.floorPaySecs)} pela obra` : '';
    if (!mergeFloor(e.n, pay)) float(0, y + 30, '+1 ANDAR', pay || (first ? 'pronto para alugar ou vender' : ''), '#f2b630', 2.2, { floor: true, n: 1 });
    sfx('floor');
  } else if (!mergeFloor(e.n, '') && floatGate <= 0) {
    // obra rápida: um aviso agregado de vez em quando
    floatGate = 1.2;
    float(0, y + FH * 1.2, `+${e.n} ${e.n === 1 ? 'ANDAR' : 'ANDARES'}`, '', '#f2b630', 2.2, { floor: true, n: e.n });
    sfx('floor');
  }
}

// onde cada compra aparece na cena
function spot(k) {
  const b = UP[k].b;
  if (k === 'elevador' || k === 'motor' || k === 'cacamba' || k === 'maglev') return [SHAFT_X(Math.min(S.lv.elevador, 6) - 1) + SHAFT_W / 2, topY() + 70];
  if (b === 'forn') return [200, 90];
  if (k === 'fundacao') return [0, 40];
  return [0, topY() + FH + 20];
}

const LABEL = {
  pedreiro: '+1 PEDREIRO', elevador: 'NOVO ELEVADOR', guindaste: 'GUINDASTE', ferram: 'FERRAMENTAS ELÉTRICAS',
  caminhao: 'BETONEIRA', cacamba: 'CARRINHOS E CAÇAMBA', motor: 'MOTOR NOVO', treino: 'EQUIPE TREINADA',
  mestre: 'MESTRE DE OBRAS', olaria: 'OLARIA', fornec: 'MAIS TIJOLOS', fundacao: 'FUNDAÇÃO REFORÇADA',
};

function onBuy(e) {
  const { k, lv } = e, [x, y] = spot(k);
  const label = LABEL[k] || UP[k].n.toUpperCase();
  // compras em sequência viram um texto só ("+3 MELHORIAS"), que se renova a cada compra
  const last = V.floats.find(f => f.buy && f.t < 1.6);
  if (last) { last.n = (last.n || 1) + 1; last.a = `+${last.n} MELHORIAS`; last.b = label + (lv > 1 ? ' · nível ' + lv : ''); last.t = Math.min(last.t, 0.25); }
  else float(x, y, label, lv > 1 ? 'nível ' + lv : '', '#6fd08c', 2.2, { buy: true });
  if (k === 'pedreiro') {
    // o novo pedreiro entra pela direita, vindo do elevador
    const j = Math.min(lv, MAX_TOP_WORKERS) - 1;
    if (lv <= MAX_TOP_WORKERS) V.bx[j] = TL + TW + 70;
    sfx('buy');
  } else if (k === 'elevador') {
    V.shaftBuild[lv - 1] = 0; sfx('machine');
  } else if (k === 'guindaste' && lv === 1) {
    V.craneBuild = 0; sfx('machine');
  } else if (k === 'fundacao') {
    for (let i = 0; i < 8; i++) dust(TL + i * 30, 2, '#8a7556', 3, 1.3);
    sfx('machine');
  } else if (k === 'ferram') {
    dust(0, topY() + SLAB + 30, '#ffe27a', 8); sfx('drill');
  } else sfx('buy');
}

let wired = false;
export function initEffects() {
  if (wired) return; wired = true;
  onEvent(e => {
    if (e.type === 'floor_completed') onFloor(e);
    else if (e.type === 'worker_hired' || e.type === 'upgrade_purchased') onBuy(e);
    else if (e.type === 'floor_phase_changed') sfx('phase');
    else if (e.type === 'piece_placed') sfx(e.piece);
  });
}
