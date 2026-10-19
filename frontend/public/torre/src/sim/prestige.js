// Prestígio "Vender a construtora" (só no Obra Viva).
// A torre e a empresa vão para os investidores: o aluguel dela para e o valor vira Ações.
//   - Ações ganhas (total) dão um bônus permanente em tudo (economy.js shareMult).
//   - O saldo de Ações compra itens do Conselho, que valem no começo de cada obra nova.
//   - Zera torre, dinheiro, melhorias, imóveis e dívida; fica a Pesquisa aprendida e os ★ ganhos.
import { VIVA } from '../data/viva.js';
import { FLAGS } from '../data/flags.js';
import { S, fresh, setState, save } from './state.js';
import { invalidateMods } from './mods.js';

const P = () => VIVA.prestige;

// Ações que a venda desta obra renderia agora: altura recorde da obra (retorno decrescente) com um
// bônus pequeno, também decrescente, pelo total já vendido (VGV)
export function vgvBonus(st = S) {
  const v = (st.stats && st.stats.saleTotal) || 0;
  return Math.min(P().vgvMax, P().vgvK * Math.log10(1 + v / P().vgvScale));
}
export function sharesFor(st = S) {
  const km = (st.maxAlt || 0) / 1000;
  if (km <= 0) return 0;
  return Math.floor(P().base * Math.pow(km, P().pow) * (1 + vgvBonus(st)));
}
export const canPrestige = (st = S) => FLAGS.viva && (st.maxAlt || 0) >= P().minAlt;

// ---------- Conselho ----------
export const councilLevel = id => (S.council && S.council[id]) || 0;
export const councilCost = id => { const it = P().council[id]; return Math.ceil(it.base * Math.pow(it.k, councilLevel(id))); };
export const councilMaxed = id => councilLevel(id) >= P().council[id].max;
export const canBuyCouncil = id => !councilMaxed(id) && (S.sharesBal || 0) >= councilCost(id);
export function buyCouncil(id) {
  if (!canBuyCouncil(id)) return false;
  S.sharesBal -= councilCost(id);
  S.council = { ...S.council, [id]: councilLevel(id) + 1 };
  return true;
}
// dinheiro inicial pelo Capital inicial
export const councilMoney = lv => lv > 0 ? P().council.capital.money * Math.pow(P().council.capital.mult, lv - 1) : 0;

// aplica o Conselho no começo de uma obra (níveis e dinheiro iniciais)
export function applyCouncil(st) {
  const c = st.council || {};
  st.money += councilMoney(c.capital || 0);
  st.lv.pedreiro += c.equipe || 0;
  st.lv.fornec += c.fornec || 0;
  st.lv.elevador = Math.min(6, st.lv.elevador + (c.elevador || 0));
  st.lv.fundacao = Math.max(st.lv.fundacao, c.fundacao || 0);
}

// vende: devolve quantas Ações ganhou (0 se ainda não pode)
export function prestige() {
  if (!canPrestige()) return 0;
  const n = sharesFor();
  const keep = {
    tree: S.tree, peSpent: S.peSpent, peBonus: S.peBonus,
    bestAlt: Math.max(S.bestAlt || 0, S.maxAlt), bestEra: Math.max(S.bestEra || 0, S.era),
    shares: (S.shares || 0) + n, sharesBal: (S.sharesBal || 0) + n,
    council: { ...(S.council || {}) }, prestiges: (S.prestiges || 0) + 1,
  };
  const f = Object.assign(fresh(), keep);
  applyCouncil(f);
  setState(f);
  invalidateMods();
  save();
  return n;
}
