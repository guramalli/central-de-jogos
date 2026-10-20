// Status da obra (pedido do usuário, out/2026): botão acima da janelinha que abre os números atuais da obra.
// Mostra as taxas lado a lado, sem destacar qual etapa está segurando a obra (quem compara é o jogador).
import { S } from '../sim/state.js';
import { rates, isCapped } from '../sim/economy.js';
import { floorsPerMin } from '../sim/preview.js';
import { FLAGS } from '../data/flags.js';
import { fmt } from './format.js';

const $ = id => document.getElementById(id);
const num = v => v >= 100 ? fmt(v) : v.toFixed(1).replace('.', ',');
const rate = v => num(v) + '/s';

export function initStatus() {
  if (!FLAGS.viva) return;
  $('stBtn').onclick = () => { const p = $('stPanel'); p.hidden = !p.hidden; $('stBtn').classList.toggle('on', !p.hidden); if (!p.hidden) updateStatus(); };
}

// chamada no laço de interface (só redesenha com o painel aberto)
export function updateStatus(hidden) {
  if (!FLAGS.viva) return;
  const b = $('stBtn'); if (b.hidden !== !!hidden) b.hidden = !!hidden;
  const p = $('stPanel');
  if (hidden) { p.hidden = true; b.classList.remove('on'); return; }
  if (p.hidden) return;
  const R = rates(), capped = isCapped(R);
  const rows = [
    ['Suprimento chegando', rate(R.prod)],
    ['Material subindo', rate(R.tran)],
    ['Assentamento', rate(R.lay)],
    ['Material por andar', num(R.fcost)],
    ['Andares por minuto', capped ? 'parada no limite' : num(floorsPerMin(R))],
    ['Renda', 'R$ ' + rate(R.income)],
    ['Material no térreo', num(S.ground)],
    ['Material no topo', num(S.top)],
    ['Limite da fundação', fmt(R.capF) + ' andares'],
  ];
  const html = rows.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('');
  if ($('stRows').innerHTML !== html) $('stRows').innerHTML = html;
}
