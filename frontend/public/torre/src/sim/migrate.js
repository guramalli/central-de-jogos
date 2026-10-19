// Converte saves antigos para o formato atual
import { MPF } from '../data/constants.js';
import { S } from './state.js';
import { rentSum } from './realty.js';

export function migrate(fromVer) {
  if (fromVer === 1) {
    // v1: todo andar construído rendia aluguel automaticamente → vira andar alugado (apartamento)
    const n = Math.floor(S.floors);
    S.assigned = n; S.rented = n; S.sold = 0;
    S.rentBase = rentSum(0, n);
    S.typeCount = { apto: n };
    S.maxAlt = n * MPF;
  }
  if (fromVer >= 1 && fromVer <= 2) { // v3: recordes de todas as obras (prestígio)
    S.bestAlt = Math.max(S.bestAlt || 0, S.maxAlt || 0);
    S.bestEra = Math.max(S.bestEra || 0, S.era || 0);
  }
}
