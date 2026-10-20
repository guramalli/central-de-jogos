// Marcos dos primeiros minutos (Obra Viva): uma manchete curta na primeira vez de cada coisa importante.
// Os vistos ficam em S.marcos (vale entre sessões e obras); syncEvents() já evita repetir o que aconteceu offline.
import { S, save } from '../sim/state.js';
import { onEvent } from '../render/events.js';
import { showNews } from './intro.js';
import { FLAGS } from '../data/flags.js';

const MACHINES = ['elevador', 'motor', 'cacamba', 'guindaste'];
const MSG = {
  contrato: 'Primeira contratação: a equipe cresceu e a obra anda mais rápido',
  parede: 'A primeira parede de tijolos está de pé',
  andar: 'Primeiro andar pronto e alugado: a renda começou',
  maquina: 'Primeira máquina na obra: o material sobe mais rápido',
};
function mark(id) {
  if (!S.marcos) S.marcos = {};
  if (S.marcos[id]) return;
  S.marcos[id] = true; save();
  showNews('MARCO DA OBRA', MSG[id]);
}
export function initMilestones() {
  if (!FLAGS.viva) return;
  onEvent(e => {
    if (e.type === 'worker_hired') mark('contrato');
    else if (e.type === 'floor_phase_changed' && e.phase === 'paredes') mark('parede');
    else if (e.type === 'floor_completed' && e.to >= 1) mark('andar');
    else if (e.type === 'upgrade_purchased' && MACHINES.includes(e.k)) mark('maquina');
  });
}
