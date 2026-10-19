// Obra Viva — ponte de eventos visuais.
// Compara o estado do motor de um quadro para o outro e avisa quem estiver ouvindo
// (efeitos, sons). Nunca altera saldos nem a simulação.
// Ao carregar um save ou voltar do tempo offline, chame syncEvents(): a linha de base
// é atualizada sem reproduzir as centenas de andares e compras que aconteceram longe da tela.
import { S } from '../sim/state.js';
import { KEYS } from '../data/upgrades.js';

const prev = { fl: 0, lv: {}, era: 0, ok: false };
const listeners = [];
export const recent = []; // últimos eventos (para testes e depuração)

export const onEvent = fn => { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); };

export function emit(type, data = {}) {
  const e = { type, ...data };
  recent.push(e); if (recent.length > 60) recent.shift();
  for (const fn of listeners) fn(e);
  return e;
}

export function syncEvents() {
  prev.fl = Math.floor(S.floors); prev.lv = { ...S.lv }; prev.era = S.era; prev.ok = true;
}

// Chamada uma vez por quadro, depois da simulação
export function pollEvents() {
  if (!prev.ok) { syncEvents(); return; }
  const fl = Math.floor(S.floors);
  if (fl > prev.fl) emit('floor_completed', { from: prev.fl, to: fl, n: fl - prev.fl });
  prev.fl = fl; // recomeço (fl menor) só atualiza a base
  for (const k of KEYS) {
    const a = prev.lv[k] ?? 0, b = S.lv[k] ?? 0;
    if (b > a) emit(k === 'pedreiro' ? 'worker_hired' : 'upgrade_purchased', { k, lv: b, from: a });
    prev.lv[k] = b;
  }
  if (S.era > prev.era) { emit('era_unlocked', { era: S.era }); prev.era = S.era; }
  else if (S.era < prev.era) prev.era = S.era;
}
