// Folha "Construtora" na tela de Melhorias (Obra Viva): vender a construtora (prestígio) e o Conselho.
import { VIVA } from '../data/viva.js';
import { S } from '../sim/state.js';
import { sharesFor, vgvBonus, canPrestige, councilLevel, councilCost, councilMaxed, canBuyCouncil, buyCouncil, councilMoney } from '../sim/prestige.js';
import { $, setText } from './dom.js';
import { fmt, fmtM } from './format.js';

const P = () => VIVA.prestige;
const sheet = $('skCorp');
export const corpOpen = () => !sheet.hidden;

// o que cada item do Conselho dá no nível seguinte (texto curto)
function nextText(id, lv) {
  if (id === 'capital') return `começa com R$ ${fmt(councilMoney(lv + 1))}`;
  if (id === 'fundacao') return `fundação inicial nível ${lv + 1}`;
  if (id === 'offline') return `+${(lv + 1) * P().council.offline.hours} h fora do jogo`;
  return `+${lv + 1} no começo da obra`;
}

let rows = null;
function buildCouncil() {
  const box = $('cpItems'); box.innerHTML = ''; rows = {};
  for (const id in P().council) {
    const it = P().council[id], row = document.createElement('div'); row.className = 'cp-row';
    row.innerHTML = `<div><b>${it.n}</b> <span class="cp-lv"></span><div class="hint">${it.d}</div><div class="cp-next"></div></div><button class="btn sm"></button>`;
    const bt = row.querySelector('button');
    bt.onclick = () => { if (buyCouncil(id)) updateCorp(); };
    box.appendChild(row);
    rows[id] = { lv: row.querySelector('.cp-lv'), next: row.querySelector('.cp-next'), bt };
  }
}

let armed = 0;
export function updateCorp() {
  const has = (S.shares || 0) > 0;
  setText($('skShares'), `Ações ${fmt(S.shares || 0)}`);
  $('skShares').hidden = !has;
  $('skCorpBtn').hidden = !(canPrestige() || has);
  if (sheet.hidden) return;
  if (!rows) buildCouncil();
  const n = sharesFor(), ok = canPrestige(), base = Math.floor(P().base * Math.pow((S.maxAlt || 0) / 1000, P().pow));
  setText($('cpAlt'), fmtM(S.maxAlt || 0));
  setText($('cpBase'), fmt(base));
  setText($('cpVgv'), `+${Math.round(vgvBonus() * 100)}%`);
  setText($('cpGain'), ok ? `${fmt(n)} Ações (+${fmt(n * P().bonusPer * 100)}% em tudo)` : '—');
  setText($('cpIntro'), ok
    ? 'Os investidores compram a torre e a empresa. O aluguel desta torre para, e o valor vira Ações: um bônus permanente em tudo e moeda do Conselho. Você recomeça uma obra nova do chão, bem mais rápido.'
    : `Libera quando esta obra chegar a ${fmtM(P().minAlt)} (agora em ${fmtM(S.maxAlt || 0)}).`);
  const bt = $('cpSell');
  bt.disabled = !ok;
  if (!armed) setText(bt, ok ? `Vender a construtora · +${fmt(n)} Ações` : 'Vender a construtora');
  setText($('cpBal'), `${fmt(S.sharesBal || 0)} Ações`);
  setText($('cpBonus'), has ? `Bônus atual: +${fmt((S.shares || 0) * P().bonusPer * 100)}% em tudo (${fmt(S.shares)} Ações ganhas · ${fmt(S.prestiges || 0)} ${S.prestiges === 1 ? 'venda' : 'vendas'}). Os itens do Conselho valem a partir da próxima obra.` : 'Ainda sem Ações: venda a construtora para ganhar as primeiras. Os itens do Conselho valem a partir da próxima obra.');
  for (const id in rows) {
    const r = rows[id], lv = councilLevel(id), mx = councilMaxed(id);
    setText(r.lv, `Nv ${lv}/${P().council[id].max}`);
    setText(r.next, mx ? 'Nível máximo' : 'Próximo: ' + nextText(id, lv));
    r.bt.hidden = mx; r.bt.disabled = !canBuyCouncil(id);
    setText(r.bt, `${fmt(councilCost(id))} Ações`);
  }
}

export function initCorp(onSell, onShow) {
  $('skCorpBtn').onclick = () => { sheet.hidden = false; $('skSheet').hidden = true; onShow(); updateCorp(); };
  $('skCorpClose').onclick = () => { sheet.hidden = true; onShow(); };
  const bt = $('cpSell');
  bt.onclick = () => {
    if (!canPrestige()) return;
    if (armed) { clearTimeout(armed); armed = 0; bt.classList.remove('armed'); sheet.hidden = true; onSell(); return; }
    setText(bt, `Confirmar: vender por ${fmt(sharesFor())} Ações`); bt.classList.add('armed');
    armed = setTimeout(() => { armed = 0; bt.classList.remove('armed'); updateCorp(); }, 3500);
  };
}
export const closeCorp = () => { sheet.hidden = true; };
