// Colapso (protótipo): regras de uma run, sem DOM (testável em Node).
// A torre sobe sozinha. A cada CARD_EVERY andares a obra para e o jogador escolhe 1 de 3 cartas.
// Ameaças (ventania, terremoto) chegam de tempos em tempos, avisadas antes; o dano tira integridade.
// Integridade zero = a torre desaba e a run acaba. Ameaças ficam mais fortes com o tempo e com a altura,
// então subir rápido também é defesa (mais cartas e mais altura antes do clima piorar).
import { CARDS, drawOffer } from './cards.js';

export const RUN = {
  v0: 0.25,          // andares por segundo no começo
  cardEvery: 5,      // andares entre uma escolha e outra
  gap: [13, 19],     // segundos entre ameaças (sorteado)
  warn: 7,           // segundos de aviso antes da ameaça
  hit: 3.5,          // duração da ameaça na tela (o dano entra no começo)
  hp: 100,
};

// gerador simples com semente (a mesma semente repete a run — útil para o robô)
export function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

export function newRun(seed = Date.now()) {
  const R = {
    rand: rng(seed), t: 0, f: 0, hp: RUN.hp, hpMax: RUN.hp, dead: false,
    m: { speed: 1, wind: 1, quake: 1, regen: 0, warn: 0, seguro: 0, rush: 0, dmg: 1 },
    cards: [], offer: null, nextCard: RUN.cardEvery, threat: null, active: null, hits: 0, log: [],
  };
  schedule(R);
  return R;
}

const pick = (R, a, b) => a + (b - a) * R.rand();
// próxima ameaça: ventania fica mais comum com a altura; terremoto é o resto
function schedule(R) {
  const pWind = Math.min(0.8, 0.45 + R.f / 150);
  R.threat = { type: R.rand() < pWind ? 'vento' : 'sismo', at: R.t + pick(R, ...RUN.gap) };
}

// força de cada ameaça agora (o aviso mostra a estimativa e ela vai subindo até chegar)
// o clima piora sem parar (exponencial no tempo): nenhuma torre aguenta para sempre. Defesas somadas param em −75%.
const def = x => Math.max(0.25, x);
export const windForce = R => 5 * Math.pow(1 + R.f / 12, 0.7) * Math.exp(R.t / 170) * def(R.m.wind) * R.m.dmg;
export const quakeForce = R => 7 * Math.pow(1 + R.f / 40, 0.5) * Math.exp(R.t / 150) * def(R.m.quake) * R.m.dmg;
export const force = (R, type) => Math.round(type === 'vento' ? windForce(R) : quakeForce(R));
export const speed = R => RUN.v0 * Math.min(3, R.m.speed) * (R.m.rush > 0 ? 3 : 1); // velocidade das cartas no máximo ×3
export const warnIn = R => R.threat ? R.threat.at - R.t : Infinity;
export const warning = R => !!R.threat && warnIn(R) <= RUN.warn + R.m.warn;
export const altM = R => Math.floor(R.f) * 4;

// avança dt segundos (não anda com cartas na mesa nem depois de desabar)
export function step(R, dt) {
  if (R.dead || R.offer) return;
  R.t += dt;
  if (R.active) { R.active.left -= dt; if (R.active.left <= 0) R.active = null; }
  const f0 = R.f;
  R.f += speed(R) * dt;
  const done = Math.floor(R.f) - Math.floor(f0);
  R.hp = Math.min(R.hpMax, R.hp + R.m.regen * dt); // manutenção: integridade por segundo
  if (done > 0 && R.m.rush > 0) R.m.rush = Math.max(0, R.m.rush - done);
  if (R.threat && R.t >= R.threat.at) strike(R);
  if (!R.dead && R.f >= R.nextCard) { R.f = R.nextCard; R.nextCard += RUN.cardEvery; R.offer = drawOffer(R); }
}

function strike(R) {
  const type = R.threat.type, dmg = force(R, type);
  R.hp -= dmg; R.hits++;
  if (R.hp <= 0 && R.m.seguro > 0) { R.m.seguro--; R.hp = 1; R.log.push({ t: R.t, ev: 'seguro' }); }
  R.active = { type, dmg, left: RUN.hit, power: dmg / R.hpMax };
  R.log.push({ t: R.t, ev: type, dmg });
  if (R.hp <= 0) { R.hp = 0; R.dead = true; }
  schedule(R);
}

export function choose(R, i) {
  if (!R.offer) return false;
  const id = R.offer[i]; if (!id) return false;
  CARDS[id].apply(R);
  R.cards.push(id); R.offer = null;
  R.hp = Math.min(R.hp, R.hpMax);
  return true;
}
