// Protótipo "Obra Viva com risco" (index.html?risco): intempéries e problemas que podem derrubar a torre.
// A torre tem integridade (0–100). De tempos em tempos chega uma ameaça, avisada antes; o dano depende da altura,
// do tempo de obra e das defesas compradas na árvore (Contraventamento, Sondagem e estacas, Proteção climática).
// Integridade zero = a torre desaba e a obra é perdida (sem Reputação e sem torre no portfólio).
// O Ministério do Trabalho não derruba: abaixo da Segurança exigida, embarga a obra e multa.
import { S } from './state.js';
import { rates } from './economy.js';
import { city, roundSecs } from './prestige.js';

export const RISCO = {
  gap: [55, 85],      // segundos entre ameaças
  warn: 20,           // segundos de aviso
  hit: 4,             // duração da ameaça na tela
  regen: 0.06,        // integridade por segundo por nível de Manutenção
  def: 0.35,           // cada nível de defesa divide o dano por (1 + 0,5 × nível)
};
// tipo → base de dano, defesa que reduz, se freia a obra (s) e o nome
export const AMEACAS = {
  vento: { n: 'Ventania', base: 10, def: 'contravento' },
  furacao: { n: 'Furacão', base: 26, def: 'contravento' },
  chuva: { n: 'Chuva forte', base: 8, def: 'clima', lento: 30 },
  nevasca: { n: 'Nevasca', base: 14, def: 'clima', lento: 40 },
  areia: { n: 'Tempestade de areia', base: 12, def: 'clima', lento: 30 },
  sismo: { n: 'Terremoto', base: 18, def: 'sondagem' },
  recalque: { n: 'Recalque do solo', base: 24, def: 'sondagem' },
  fiscal: { n: 'Fiscalização do Ministério do Trabalho', base: 0, def: 'seguranca' },
};
// sorteio por cidade (Praia Grande, Rio, Dubai, Ártico, Lua)
const SORTEIO = {
  'praia-grande': { vento: 3, chuva: 2.5, fiscal: 2, sismo: 1, furacao: 1.5 },
  rio: { vento: 2.5, chuva: 3, fiscal: 2, sismo: 0.5, furacao: 2 },
  dubai: { areia: 3.5, vento: 2.5, fiscal: 2, sismo: 2 },
  artico: { nevasca: 4, vento: 3, fiscal: 2, sismo: 1 },
  lua: { sismo: 6, fiscal: 4 },
};

const lv = k => S.lv[k] || 0;
const st = () => (S.risco ||= { integ: 100, max: 100, prox: null, ativa: null, embargo: 0, lento: 0, log: [] });
export const riscoState = st;
// Segurança do trabalho exigida pela fiscalização: sobe com a altura (2 em 100 m, 4 em 1 km, 7 em 10 km…)
export const segExigida = () => 1 + Math.floor(Math.log2(1 + S.maxAlt / 100));
// fator da altura e do tempo de obra: o risco cresce durante a obra inteira
const fator = () => (1 + Math.sqrt(S.maxAlt / 150)) * (1 + roundSecs() / 600);
// dano estimado de uma ameaça agora (o aviso mostra e vai subindo até ela chegar)
export function danoDe(tipo) {
  const a = AMEACAS[tipo]; if (!a.base) return 0;
  let d = a.base * fator() / (1 + RISCO.def * lv(a.def));
  if (tipo === 'sismo' || tipo === 'recalque') d /= 1 + 0.1 * lv('fundacao');
  if (tipo === 'recalque') { const R = rates(); d *= 1 + 4 * Math.max(0, S.floors / R.capF - 0.85) / 0.15; } // pior com a torre no limite
  return Math.round(d);
}

function sortear() {
  const s = st(), R = rates(), pesos = { ...(SORTEIO[city().id] || SORTEIO['praia-grande']) };
  if (pesos.furacao && S.maxAlt < 500) delete pesos.furacao; // furacão só pega torre alta
  if (S.floors >= R.capF * 0.85) pesos.recalque = 6; // perto do limite da fundação, o solo cede
  const tot = Object.values(pesos).reduce((a, b) => a + b, 0);
  let x = Math.random() * tot, tipo = 'vento';
  for (const k in pesos) { x -= pesos[k]; if (x <= 0) { tipo = k; break; } }
  const g = RISCO.gap[0] + Math.random() * (RISCO.gap[1] - RISCO.gap[0]);
  s.prox = { tipo, em: g };
}

// chamado por sim() a cada passo
export function riscoTick(dt) {
  const s = st();
  if (S.colapso) return;
  s.integ = Math.min(s.max, s.integ + RISCO.regen * lv('manutencao') * dt);
  if (s.embargo > 0) s.embargo = Math.max(0, s.embargo - dt);
  if (s.lento > 0) s.lento = Math.max(0, s.lento - dt);
  if (s.ativa) { s.ativa.left -= dt; if (s.ativa.left <= 0) s.ativa = null; }
  if (S.floors < 1) return; // o terreno ainda vazio não sofre
  if (!s.prox) sortear();
  s.prox.em -= dt;
  if (s.prox.em <= 0) golpe();
}

function golpe() {
  const s = st(), tipo = s.prox.tipo, a = AMEACAS[tipo];
  s.prox = null;
  if (tipo === 'fiscal') {
    const falta = segExigida() - lv('seguranca');
    if (falta > 0) {
      const multa = Math.floor(S.money * Math.min(0.6, 0.2 * falta));
      s.embargo = Math.min(120, 30 * falta); S.money -= multa;
      s.ativa = { tipo, left: RISCO.hit, dano: 0, falta, multa, embargo: s.embargo };
    } else s.ativa = { tipo, left: RISCO.hit, dano: 0, ok: true };
    s.log.push({ tipo, falta, t: roundSecs() });
    return;
  }
  const dano = danoDe(tipo);
  s.integ -= dano;
  if (a.lento) s.lento = a.lento;
  s.ativa = { tipo, left: RISCO.hit, dano, forca: dano / s.max };
  s.log.push({ tipo, dano, t: roundSecs() });
  if (s.integ <= 0) { s.integ = 0; S.colapso = { f0: S.floors, alt: S.maxAlt, tipo }; }
}

// fração do assentamento que anda (embargo para a obra; chuva, neve e areia deixam mais lenta)
export const riscoLay = () => { const s = st(); return s.embargo > 0 ? 0 : s.lento > 0 ? 0.6 : 1; };
export const avisando = () => { const s = st(); return !!s.prox && s.prox.em <= RISCO.warn; };
