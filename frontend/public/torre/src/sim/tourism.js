// Turismo pela altura: visitantes pagam ingresso para subir. Capacidade vem do elevador
// panorâmico e do heliponto; acima de 100 km, o porto espacial leva turistas espaciais.
import { BAL } from '../data/balance.js';
import { MPF } from '../data/constants.js';
import { S } from './state.js';
import { mods } from './mods.js';
import { typeCount } from './realty.js';

const T = BAL.tourism;

export function tourism() {
  const L = S.lv, M = mods(), alt = S.floors * MPF;
  const hotels = typeCount('hotel'), obs = typeCount('obs');
  const demand = L.bilheteria < 1 ? 0
    : T.demand * Math.pow(alt, T.demandPow) * (1 + 0.25 * L.marketing) * (1 + 0.15 * Math.log2(1 + hotels / 10)) * M.mult('tourism');
  const cap = T.capPanoramic * L.bilheteria + T.capHeli * L.heliponto;
  const ticket = T.ticket * Math.pow(alt / 10, T.ticketPow) * (1 + 0.25 * Math.log2(1 + obs / 10)) * M.mult('ticket');
  const served = Math.min(demand, cap);
  const sDemand = L.porto < 1 ? 0 : T.spaceDemand * Math.pow(alt / 1000, 0.8) * M.mult('tourism');
  const sCap = T.spaceCap * L.porto, sServed = Math.min(sDemand, sCap), sTicket = ticket * T.spaceTicketMult;
  return {
    demand, cap, ticket, served, queue: Math.max(0, demand - cap),
    space: { demand: sDemand, cap: sCap, served: sServed, ticket: sTicket },
    revenue: served * ticket + sServed * sTicket,
  };
}
