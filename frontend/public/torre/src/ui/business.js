// Página Negócios: imóveis (vender/alugar, tipos, corretor), turismo e banco.
// Também o aviso de andares prontos no card do canteiro.
import { FLOOR_TYPES, TYPE_IDS } from '../data/floorTypes.js';
import { S, save } from '../sim/state.js';
import { pending, preview, assign, buildType, setBuildType, typeUnlocked } from '../sim/realty.js';
import { borrow, repay } from '../sim/bank.js';
import { rates } from '../sim/economy.js';
import { $, setText } from './dom.js';
import { fmt, fmtM } from './format.js';

const money = v => 'R$ ' + fmt(v);
const num = v => v.toFixed(v < 10 ? 2 : 1).replace('.', ',');

// ---------- ações ----------
const qty = v => v === 'all' ? Infinity : +v;
document.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => { assign(qty(b.dataset.sell), 'sell'); save(); updateBusiness('imoveis'); });
document.querySelectorAll('[data-rent]').forEach(b => b.onclick = () => { assign(qty(b.dataset.rent), 'rent'); save(); updateBusiness('imoveis'); });
$('qRent').onclick = () => { assign(Infinity, 'rent'); save(); updateBusiness('imoveis'); };
$('qSell').onclick = () => { assign(Infinity, 'sell'); save(); updateBusiness('imoveis'); };

document.querySelectorAll('[data-loan]').forEach(b => b.onclick = () => {
  const R = rates(); borrow(R.bank.available * +b.dataset.loan, R.income); save(); updateBusiness('banco');
});
document.querySelectorAll('[data-pay]').forEach(b => b.onclick = () => {
  repay(S.debt * +b.dataset.pay); save(); updateBusiness('banco');
});

const bOn = $('b-on'), bPct = $('b-pct');
bOn.onchange = () => { S.broker.on = bOn.checked; save(); updateBusiness('imoveis'); };
bPct.oninput = () => { S.broker.sellPct = +bPct.value; updateBusiness('imoveis'); };
bPct.onchange = () => save();
const presets = document.querySelectorAll('[data-preset]');
presets.forEach(b => b.onclick = () => { S.broker.sellPct = +b.dataset.preset; S.broker.on = true; save(); updateBusiness('imoveis'); });

// ---------- tipos de andar ----------
const typesEl = $('types');
TYPE_IDS.forEach(t => {
  const T = FLOOR_TYPES[t], bt = document.createElement('button');
  bt.className = 'type'; bt.id = 'ty-' + t;
  bt.innerHTML = `<b>${T.n}</b><small class="tm">aluguel ×${num(T.rent)} · venda ×${num(T.sale)}</small><small class="td"></small>`;
  bt.onclick = () => { if (setBuildType(t)) { save(); updateBusiness('imoveis'); } };
  typesEl.appendChild(bt);
});

// ---------- atualização ----------
// page: painel aberto ('imoveis' atualiza imóveis e turismo; 'banco' atualiza o banco).
// O aviso de andares prontos, sobre o canvas, atualiza sempre.
export function updateBusiness(page) {
  const p = pending(), hasBroker = S.lv.corretor >= 1;
  // aviso no canteiro: só sem corretor ligado
  const showReady = p > 0 && !(hasBroker && S.broker.on);
  $('ready').hidden = !showReady;
  if (showReady) {
    setText($('readyN'), fmt(p));
    setText($('readyTxt'), p === 1 ? 'andar pronto' : 'andares prontos');
  }
  if (page !== 'imoveis' && page !== 'banco') return;
  const R = rates();
  if (page === 'banco') { updateBank(R); return; }

  // imóveis
  setText($('r-pend'), fmt(p)); setText($('r-rented'), fmt(S.rented)); setText($('r-sold'), fmt(S.sold));
  setText($('r-rent'), money(R.rent) + '/s');
  const all = preview(p);
  setText($('r-sellv'), p ? '+' + money(all.sale) : '');
  setText($('r-rentv'), p ? '+' + money(all.rentNow) + '/s' : '');
  document.querySelectorAll('[data-sell],[data-rent]').forEach(b => b.disabled = p <= 0);
  const cur = buildType();
  TYPE_IDS.forEach(t => {
    const el = $('ty-' + t), ok = typeUnlocked(t);
    el.disabled = !ok; el.setAttribute('aria-pressed', t === cur);
    setText(el.querySelector('.td'), ok ? FLOOR_TYPES[t].d : 'Libera com a torre em ' + fmtM(FLOOR_TYPES[t].alt));
  });
  // corretor
  $('broker').hidden = !hasBroker; $('brokerHint').hidden = hasBroker;
  if (hasBroker) {
    bOn.checked = S.broker.on;
    if (document.activeElement !== bPct) bPct.value = S.broker.sellPct;
    bPct.disabled = !S.broker.on;
    setText($('b-sell'), `Vender ${S.broker.sellPct}%`); setText($('b-rent'), `Alugar ${100 - S.broker.sellPct}%`);
    presets.forEach(b => { b.setAttribute('aria-pressed', S.broker.on && +b.dataset.preset === S.broker.sellPct); b.disabled = false; });
  }

  // turismo: aparece quando a torre fica alta o bastante para atrair visitantes
  $('tourCard').hidden = S.maxAlt < 40;
  const T = R.tour, on = S.lv.bilheteria >= 1;
  $('t-off').hidden = on; $('t-on').hidden = !on;
  if (on) {
    setText($('t-dem'), num(T.demand) + '/s'); setText($('t-cap'), num(T.cap) + '/s');
    setText($('t-tick'), money(T.ticket)); setText($('t-rev'), money(T.revenue) + '/s');
    $('t-bar').firstElementChild.style.width = Math.min(100, T.cap / Math.max(T.demand, 1e-9) * 100) + '%';
    let h = T.queue > 0.01
      ? `Fila no térreo: ${num(T.queue)} visitante/s a mais do que a torre leva. Aumente a capacidade.`
      : 'Sobra lugar nos passeios: atraia mais gente com Marketing, hotéis ou altura.';
    if (T.space.cap > 0) h += ` Turismo espacial: ${num(T.space.served)}/s a ${money(T.space.ticket)}.`;
    setText($('t-hint'), h);
  }
}

function updateBank(R) {
  const B = R.bank;
  setText($('k-tier'), ['Banco do bairro', 'Banco regional', 'Banco nacional', 'Mercado de títulos'][Math.min(3, S.lv.banco)]);
  setText($('k-debt'), money(S.debt)); setText($('k-lim'), money(B.limit));
  setText($('k-rate'), (B.rate * 100).toFixed(2).replace('.', ',') + '%/min');
  setText($('k-share'), S.debt > 0 ? `${Math.round(B.share * 100)}% da renda` : '—');
  $('k-def').hidden = !S.inDefault;
  if (S.inDefault) setText($('k-def'), `Renegociação de emergência: juros pela metade, sem novos empréstimos e ${Math.round(B.share * 100)}% da renda retida até a dívida voltar a ${money(B.limit)}. A obra continua; vender andares acelera a saída.`);
  setText($('k-avail'), B.available > 0 ? 'até ' + money(B.available) : '');
  document.querySelectorAll('[data-loan]').forEach(b => b.disabled = B.available < 1);
  document.querySelectorAll('[data-pay]').forEach(b => b.disabled = S.debt <= 0 || S.money < 1);
}

// andares prontos esperando decisão (aviso no botão Imóveis)
export const businessAlert = () => pending() > 0 && !(S.lv.corretor >= 1 && S.broker.on);
