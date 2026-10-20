// Turismo pela altura: visitantes pagam ingresso para subir. Capacidade vem do elevador
// panorâmico e do heliponto; acima de 100 km, o porto espacial leva turistas espaciais.
import { BAL } from '../data/balance.js';
import { altOf } from '../data/height.js';
import { techMult } from './tech.js';
import { MPF } from '../data/constants.js';
import { S } from './state.js';
import { mods } from './mods.js';
import { typeCount } from './realty.js';
import { FLAGS } from '../data/flags.js';
import { VIVA } from '../data/viva.js';
import { boardMult, cityMult } from './prestige.js';

const T = BAL.tourism;

export function tourism() {
  const L = S.lv, M = mods(), alt = altOf(S.floors);
  const hotels = typeCount('hotel'), obs = typeCount('obs');
  const demand = L.bilheteria < 1 ? 0
    : T.demand * Math.pow(alt, T.demandPow) * (1 + 0.25 * L.marketing) * (1 + 0.15 * Math.log2(1 + hotels / 10)) * techMult('tour') * M.mult('tourism') * boardMult('tour') * cityMult('tour');
  // Obra Viva: a capacidade acompanha a altura (cabines maiores e mais rápidas, como aparece na cena), no mesmo
  // ritmo dos interessados, e cada nível multiplica (×1,6) em vez de somar; assim Marketing e Agência continuam valendo
  const lvCap = n => n < 1 ? 0 : FLAGS.viva ? Math.pow(1.6, n - 1) * Math.pow(Math.max(1, alt / 40), T.demandPow) : n;
  const cap = T.capPanoramic * lvCap(L.bilheteria) + T.capHeli * lvCap(L.heliponto);
  const ticket = T.ticket * Math.pow(alt / 10, T.ticketPow) * (1 + 0.25 * Math.log2(1 + obs / 10)) * techMult('ticket') * M.mult('ticket');
  const served = Math.min(demand, cap);
  const sDemand = L.porto < 1 ? 0 : T.spaceDemand * Math.pow(alt / 1000, 0.8) * M.mult('tourism');
  const sCap = T.spaceCap * L.porto, sServed = Math.min(sDemand, sCap), sTicket = ticket * T.spaceTicketMult;
  return {
    demand, cap, ticket, served, queue: Math.max(0, demand - cap),
    space: { demand: sDemand, cap: sCap, served: sServed, ticket: sTicket },
    // Obra Viva: antes do Elevador panorâmico, curiosos pagam um trocado para ver a obra famosa pelo tapume
    curious: FLAGS.viva && L.bilheteria < 1 ? VIVA.curious : 0,
    revenue: served * ticket + sServed * sTicket + (FLAGS.viva && L.bilheteria < 1 ? VIVA.curious : 0),
  };
}
