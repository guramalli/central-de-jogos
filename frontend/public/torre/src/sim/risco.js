// Modo "Obra Viva com risco" (index.html?risco): uma torre só, em Santa Brisa, que precisa sobreviver ano a ano.
// A torre tem integridade. De tempos em tempos chega uma ameaça, avisada antes; o dano depende da altura, do ano
// (cresce sem teto: uma hora a torre cai), do dia do ano e das defesas compradas na árvore. As ameaças mudam com a
// altura (faixas). Sobreviver aos 365 dias dá Reputação e 1 prêmio à escolha entre 3 (acumulam até a torre cair).
// Integridade zero = a obra é INTERDITADA (não cai): o laudo da Defesa Civil oferece 3 jeitos de reforçar, pagos com
// dinheiro; a obra fica parada até um ser cumprido. Na 3ª interdição do mesmo ano a torre é condenada e desaba; a
// próxima torre começa do zero com a Reputação e 1 prêmio guardado.
// O Ministério do Trabalho não derruba: abaixo da Segurança exigida, embarga a obra e multa.
import { S, fresh, setState, save } from './state.js';
import { rates, cost } from './economy.js';
import { roundSecs, roundFrac, pointsFor } from './prestige.js';
import { VIVA } from '../data/viva.js';
import { floorOf } from '../data/height.js';
import { MARKS } from '../data/eras.js';
import { PREMIOS, PREMIO_IDS } from '../data/premios.js';

export const RISCO = {
  gap: [55, 85],      // segundos entre ameaças
  warn: 20,           // segundos de aviso (Previsão do tempo dobra)
  hit: 4,             // duração da ameaça na tela
  regen: 0.06,        // integridade por segundo por nível de Manutenção
  def: 0.35,          // (antigo) cada nível de defesa dividia o dano por (1 + def × nível)
  premioDefMax: 0.6, // prêmios de defesa somam −25% cada, mas no máximo tiram 60% do dano de um grupo (×0,5 multiplicado deixava o jogo fácil)
  defMul: 0.92,       // cada nível de defesa multiplica o dano por defMul: a defesa acompanha o dano que cresce (quem investe certo segue subindo)
  anoK: 1.5,          // dano × anoK^(ano − 1): sem teto
  gapAno: 0.9,        // a cada ano as ameaças vêm mais seguidas (intervalo × gapAno^(ano − 1), no mínimo metade)
  diaK: 0.5,          // +50% do dia 1 ao dia 365
  bonusAno: 1,        // pontos de Reputação por ano sobrevivido (além da altura nova)
  taxaEra: [50, 150, 1000, 10000, 50000, 100000, 150000], // taxa de liberação por andar, pela era de cada andar (~1 min de renda)
  parcelaJuros: 0.2,  // parcelar o reforço custa 20% a mais
  interdMax: 3,       // na 3ª interdição do mesmo ano a torre é condenada (desaba)
  reforco: 0.5,       // na virada do ano, essa fração da integridade que sobrou soma na integridade máxima
  altPow: 0.35,       // peso da altura no dano: (1 + (altura/150 m)^altPow)
};
// tipo → nome, dano-base, nó de defesa, grupo dos prêmios de defesa, se deixa a obra mais lenta (s)
export const AMEACAS = {
  chuva: { n: 'Chuva forte', base: 8, def: 'clima', grupo: 'clima', lento: 30 },
  vento: { n: 'Ventania', base: 10, def: 'contravento', grupo: 'vento' },
  sismo: { n: 'Terremoto', base: 18, def: 'sondagem', grupo: 'base' },
  recalque: { n: 'Recalque do solo', base: 24, def: 'sondagem', grupo: 'base' },
  furacao: { n: 'Furacão', base: 26, def: 'contravento', grupo: 'vento' },
  tsunami: { n: 'Tsunami', base: 22, def: 'sondagem', grupo: 'base' },
  raios: { n: 'Tempestade de raios', base: 16, def: 'clima', grupo: 'clima' },
  granizo: { n: 'Granizo', base: 12, def: 'clima', grupo: 'clima' },
  nevasca: { n: 'Nevasca', base: 14, def: 'clima', grupo: 'clima', lento: 40 },
  gelo: { n: 'Gelo na estrutura', base: 14, def: 'clima', grupo: 'clima' },
  ventoAlt: { n: 'Vento de altitude', base: 18, def: 'contravento', grupo: 'vento' },
  meteoros: { n: 'Chuva de meteoros', base: 24, def: 'clima', grupo: 'clima' },
  solar: { n: 'Tempestade solar', base: 20, def: 'clima', grupo: 'clima' },
  fiscal: { n: 'Fiscalização do Ministério do Trabalho', base: 0, def: 'seguranca' },
};
// faixas de altura (Santa Brisa): cada faixa traz ameaças novas; as de baixo continuam com peso menor
const FAIXAS = [
  { de: 0, pesos: { chuva: 2.5, vento: 3, sismo: 1 } },
  { de: 1000, pesos: { furacao: 2, tsunami: 1.5, raios: 2, granizo: 1.5 } },
  { de: 12000, pesos: { nevasca: 2.5, gelo: 2, ventoAlt: 2.5 } },
  { de: 100000, pesos: { meteoros: 3, solar: 2.5 } },
];
export function pesosDe(alt) {
  const ativas = FAIXAS.filter(f => alt >= f.de), out = { fiscal: 2 };
  ativas.forEach((f, i) => { const k = i === ativas.length - 1 ? 1 : 0.4; for (const t in f.pesos) out[t] = f.pesos[t] * k; });
  return out;
}
export const faixaDe = alt => Object.keys(pesosDe(alt));

const lv = k => S.lv[k] || 0;
const st = () => {
  const s = (S.risco ||= { integ: 100, max: 100, prox: null, ativa: null, embargo: 0, lento: 0, log: [] });
  s.premios ||= []; if (s.ultimaOferta === undefined) s.ultimaOferta = null;
  s.ano ||= 1;
  return s;
};
export const riscoState = st;
// Segurança do trabalho exigida pela fiscalização: sobe com a altura (2 em 100 m, 6 em 1 km, 11 em 10 km, 16 em 100 km)
export const segExigida = () => 1 + Math.floor(1.6 * Math.log2(1 + S.maxAlt / 100));
// fator da altura, do ano (sem teto) e do dia do ano
const fator = () => (1 + Math.pow(S.maxAlt / 150, RISCO.altPow)) * Math.pow(RISCO.anoK, st().ano - 1) * (1 + RISCO.diaK * roundFrac());
// dano estimado de uma ameaça agora (o aviso mostra e vai subindo até ela chegar); nivelDef: nível da defesa a usar
export function danoDe(tipo, nivelDef = lv(AMEACAS[tipo].def)) {
  const a = AMEACAS[tipo]; if (!a.base) return 0;
  let d = a.base * fator() * (RISCO.defMul ? Math.pow(RISCO.defMul, nivelDef) : 1 / (1 + RISCO.def * nivelDef)) * premioDef(a.grupo);
  if (a.grupo === 'base') d /= 1 + 0.1 * lv('fundacao');
  if (tipo === 'recalque') { const R = rates(); d *= 1 + 4 * Math.max(0, S.floors / R.capF - 0.85) / 0.15; } // pior com a torre no limite
  return Math.round(d);
}
export const regenAgora = (nivel = lv('manutencao')) => RISCO.regen * nivel * premioMult('regen');

function sortear() {
  const s = st(), R = rates(), pesos = pesosDe(S.maxAlt);
  if (S.floors >= R.capF * 0.85) pesos.recalque = 6; // perto do limite da fundação, o solo cede
  const tot = Object.values(pesos).reduce((a, b) => a + b, 0);
  let x = Math.random() * tot, tipo = 'vento';
  for (const k in pesos) { x -= pesos[k]; if (x <= 0) { tipo = k; break; } }
  const g = (RISCO.gap[0] + Math.random() * (RISCO.gap[1] - RISCO.gap[0])) * Math.max(0.5, Math.pow(RISCO.gapAno, s.ano - 1));
  s.prox = { tipo, em: g };
}

// chamado por sim() a cada passo
export function riscoTick(dt) {
  const s = st();
  if (S.colapso || s.fimAno) return;
  if (s.divida > 0) { const p = Math.min(s.divida, retencao() * Math.max(0, rates().income) * dt, Math.max(0, S.money)); S.money -= p; s.divida = Math.max(0, s.divida - p); if (s.divida < 1) s.divida = 0; }
  if (s.interd) { if (s.ativa) { s.ativa.left -= dt; if (s.ativa.left <= 0) s.ativa = null; } return; } // interditada: parada, sem ameaças
  S.torreSeg = (S.torreSeg || 0) + dt; // tempo de jogo desta torre (ranking)
  s.integ = Math.min(s.max, s.integ + regenAgora() * dt);
  if (s.embargo > 0) s.embargo = Math.max(0, s.embargo - dt);
  if (s.lento > 0) s.lento = Math.max(0, s.lento - dt);
  if (s.ativa) { s.ativa.left -= dt; if (s.ativa.left <= 0) s.ativa = null; }
  if (S.floors < 1) return; // o terreno ainda vazio não sofre
  if (!s.prox || !AMEACAS[s.prox.tipo]) sortear();
  s.prox.em -= dt;
  if (s.prox.em <= 0) golpe();
}

function golpe() {
  const s = st(), tipo = s.prox.tipo, a = AMEACAS[tipo];
  s.prox = null;
  if (tipo === 'fiscal') {
    const falta = temPremio('fiscalAmigo') ? 0 : segExigida() - lv('seguranca');
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
  if (s.integ <= 0 && (s.seguro || 0) > 0) { s.seguro--; s.integ = 1; s.log.push({ tipo: 'seguro', t: roundSecs() }); }
  if (s.integ <= 0) {
    s.integ = 0; s.interdAno = (s.interdAno || 0) + 1;
    if (s.interdAno >= RISCO.interdMax) S.colapso = { f0: S.floors, alt: S.maxAlt, tipo, anos: s.ano - 1 }; // condenada
    else interditar(tipo);
  }
}

// ---------- obra interditada: laudo com 3 jeitos de reforçar ----------
const DEFESAS = ['contravento', 'sondagem', 'clima'];
// preço de subir n níveis de uma defesa a partir do nível atual (a mesma conta das compras da árvore)
function precoNiveis(k, n) {
  let c = 0; const l0 = S.lv[k] || 0;
  try { for (let i = 0; i < n; i++) { c += cost(k); S.lv[k] = l0 + i + 1; } } finally { S.lv[k] = l0; }
  return c;
}
function interditar(tipo) {
  const s = st(), def = AMEACAS[tipo].def, taxa = taxaLiberacao();
  const pacote = (id, n, d, niveis, vezes, integ, extraMax = 0) => {
    const custo = vezes * taxa + Object.entries(niveis).reduce((a, [k, q]) => a + precoNiveis(k, q), 0);
    return { id, n, d, niveis, custo: Math.round(custo), integ, extraMax };
  };
  const outras = Object.fromEntries(DEFESAS.filter(k => k !== def).map(k => [k, 1]));
  s.interd = { tipo, def, opcoes: [
    pacote('foco', 'Reforço da defesa que falhou', `${nomeDef(def)} +2 níveis. A obra volta com 60% de integridade.`, { [def]: 2 }, 1, 0.6),
    pacote('geral', 'Reforço geral', 'Todas as defesas +1 nível. A obra volta com 80% de integridade.', Object.fromEntries(DEFESAS.map(k => [k, 1])), 1.5, 0.8),
    pacote('completo', 'Reforço completo com engenharia', `${nomeDef(def)} +2 e as outras defesas +1. A obra volta inteira e com +25 de integridade máxima.`, { [def]: 2, ...outras }, 3, 1, 25),
  ] };
  s.prox = null; s.lento = 0;
}
const NOME_DEF = { contravento: 'Contraventamento', sondagem: 'Sondagem e estacas', clima: 'Proteção climática' };
export const nomeDef = k => NOME_DEF[k] || k;
// taxa de liberação: um valor fixo por andar construído, conforme a era de cada andar
export function taxaLiberacao() {
  const f = Math.floor(S.floors); let t = 0, ini = 0;
  for (let e = 0; e < RISCO.taxaEra.length; e++) {
    const fim = e < MARKS.length ? floorOf(MARKS[e]) : Infinity, n = Math.max(0, Math.min(f, fim) - ini);
    t += n * RISCO.taxaEra[e]; ini = fim; if (f <= fim) break;
  }
  return Math.round(t);
}
// parte da renda que vai para a dívida do parcelamento: de 20% (dívida pequena) a 60% (dívida grande perto da renda)
export const retencao = () => { const d = st().divida || 0; if (d <= 0) return 0; const renda = Math.max(1, rates().income); return Math.min(0.6, 0.2 + 0.4 * d / (d + renda * 600)); };
// cumpre um dos reforços do laudo: à vista (paga agora) ou parcelado (+20%, uma parte da renda vai pagando);
// sobe as defesas, devolve a integridade e a obra volta a andar
export function cumprirReforco(id, parcelar = false) {
  const s = st(), o = s.interd && s.interd.opcoes.find(x => x.id === id);
  if (!o) return false;
  if (parcelar) s.divida = (s.divida || 0) + Math.round(o.custo * (1 + RISCO.parcelaJuros));
  else if (S.money < o.custo) return false;
  else { S.money -= o.custo; S.spent = (S.spent || 0) + o.custo; }
  for (const [k, q] of Object.entries(o.niveis)) S.lv[k] = (S.lv[k] || 0) + q;
  s.max += o.extraMax; s.integ = Math.round(o.integ * s.max);
  s.interd = null; s.prox = null;
  return true;
}

// ---------- avarias na estrutura ----------
const h01 = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
// 0 inteiro, 1 trincado, 2 quebrado: a fração de andares avariados acompanha a integridade perdida (os 3 do topo
// contam em dobro); abaixo de metade da integridade, metade dos avariados quebra. Fixo por andar (sorteio estável).
export function avariaDoAndar(i) {
  const r = st(), perda = 1 - Math.max(0, r.integ) / r.max;
  if (perda <= 0) return 0;
  const topo = i >= Math.floor(S.floors) - 3 ? 2 : 1;
  if (h01(i, 9) >= perda * topo) return 0;
  return r.integ / r.max < 0.5 && h01(i, 13) < 0.5 ? 2 : 1;
}

// ---------- ano ----------
// o relógio do ano zerou com a torre de pé: Reputação (altura nova acima do recorde da campanha + bônus) e 3 prêmios
export function fimDoAno() {
  const s = st();
  const pts = Math.max(0, pointsFor(S.maxAlt) - pointsFor(S.bestAlt || 0)) + RISCO.bonusAno;
  S.pontosTotal = (S.pontosTotal || 0) + pts;
  S.bestAlt = Math.max(S.bestAlt || 0, S.maxAlt);
  s.ganhoAno = pts;
  s.reforco = Math.round(RISCO.reforco * Math.max(0, s.integ)); // quem cuidou da torre começa o próximo ano mais forte
  s.oferta = sortearPremios(); s.ultimaOferta = s.oferta.slice();
  s.fimAno = true;
}
// aplica o efeito imediato de um prêmio (na escolha ou quando ele vem guardado para a torre nova)
export function aplicarNaHora(id, guardado) {
  const s = st(), e = PREMIOS[id] && PREMIOS[id].efeito;
  if (e === 'patrocinio') S.money += guardado ? chequeGuardado() : Math.max(500, 180 * rates().income);
  else if (e === 'nucleo') { s.max += 50; s.integ = s.max; }
  else if (e === 'seguro') s.seguro = 1;
}
// a escolha do fim do ano: o prêmio entra, a mesma torre segue para o próximo ano
export function escolherPremio(id) {
  const s = st();
  if (!s.fimAno || !s.oferta || !s.oferta.includes(id)) return false;
  s.max += Math.round(RISCO.reforco * Math.max(0, s.integ)); s.reforco = 0; // a integridade que sobrou continua; metade dela vira integridade máxima
  s.premios.push(id); aplicarNaHora(id, false);
  s.ano++; S.roundLeft = VIVA.round.secs; s.interdAno = 0; // interdições contam por ano
  s.fimAno = false; s.oferta = null;
  return true;
}

// save do protótipo publicado antes da torre única (uma obra por cidade): vira torre única sem perder a obra
export function migrarRisco() {
  Object.assign(S, { cidade: 0, obra: 1, offers: [], perks: [], mgr: {} });
  if (!S.colapso) S.roundOver = false;
  const r = st();
  if (r.prox && !AMEACAS[r.prox.tipo]) r.prox = null;
}

// ---------- desabamento e torre nova ----------
// o que passa de uma torre para a outra (o resto zera: dinheiro, níveis, altura, prêmios)
const KEEP_RISCO = ['pontosTotal', 'bestAlt', 'introSeen', 'dicas', 'jornais', 'marcos', 'marcosAlt', 'playTime', 'won', 'winSeen', 'rank', 'altTotal', 'orbitaSec']; // orbitaSec: tempo de jogo até a 1ª Órbita (ranking)
// prêmios que a pessoa pode guardar na queda: os desta torre (inclui o que veio guardado), sem repetir
export const premiosDaTentativa = () => [...new Set(st().premios)];
// começa uma torre nova: Reputação fica, 1 prêmio guardado (1 vaga; null mantém o que já estava guardado)
export function novaTorre(guardar) {
  const keep = {}; for (const k of KEEP_RISCO) keep[k] = S[k];
  const guardado = guardar || S.riscoGuardado || null, tent = (S.riscoTentativa || 1) + 1;
  const n = fresh(); Object.assign(n, keep);
  Object.assign(n, { cidade: 0, obra: 1, roundLeft: VIVA.round.secs, riscoGuardado: guardado, riscoTentativa: tent });
  setState(n);
  const r = st();
  if (guardado && PREMIOS[guardado]) { r.premios.push(guardado); aplicarNaHora(guardado, true); }
  save();
}

// ---------- prêmios ----------
export const temPremio = id => st().premios.includes(id);
// multiplicador de um estágio pelos prêmios ativos; repetidos somam; desconto (cost) até a metade
export function premioMult(estagio) {
  let up = 0, down = 0;
  for (const id of st().premios) { const p = PREMIOS[id]; if (!p || p.st !== estagio) continue; if (p.mul > 1) up += p.mul - 1; else down += 1 - p.mul; }
  return (1 + up) * Math.max(0.5, 1 - down);
}
// multiplicador de dano de um grupo de ameaças (vento, base, clima)
export function premioDef(grupo) {
  let c = 0;
  for (const id of st().premios) { const p = PREMIOS[id]; if (p && p.defGrupo === grupo) c += p.defCorte; }
  return 1 - Math.min(RISCO.premioDefMax, c);
}
// 3 prêmios diferentes; o trio nunca repete o anterior; únicos já ativos ficam de fora; raros pesam 1, comuns 3
export function sortearPremios(rand = Math.random) {
  const s = st(), antes = (s.ultimaOferta || []).slice().sort().join();
  const base = PREMIO_IDS.filter(id => !(PREMIOS[id].unico && s.premios.includes(id)));
  for (let tent = 0; tent < 50; tent++) {
    let pool = base.slice(); const out = [];
    while (out.length < 3 && pool.length) {
      const peso = id => PREMIOS[id].raro ? 1 : 3, tot = pool.reduce((a, id) => a + peso(id), 0);
      let x = rand() * tot, id = pool[0];
      for (const k of pool) { x -= peso(k); if (x <= 0) { id = k; break; } }
      out.push(id); pool = pool.filter(k => k !== id);
    }
    if (out.slice().sort().join() !== antes) return out;
  }
  return base.slice(0, 3);
}
// cheque do Patrocínio guardado: a torre nova começa sem renda, então vale pela melhor altura da campanha
export const chequeGuardado = () => Math.max(500, Math.round(1000 * 40 * Math.pow((S.bestAlt || 0) / 1000, 1.2)));

// fração do assentamento que anda (embargo para a obra; chuva e neve deixam mais lenta)
export const riscoLay = () => { const s = st(); return s.interd || s.embargo > 0 ? 0 : s.lento > 0 ? 0.6 : 1; };
// chovendo forte (chuva, granizo, raios, furacão — e a chuva que continua deixando a obra lenta): os bonecos vestem capa
const CHUVA = ['chuva', 'granizo', 'raios', 'furacao'];
export const chovendo = () => { const s = S.risco; if (!s || S.colapso) return false; return !!(s.ativa && CHUVA.includes(s.ativa.tipo)) || (s.lento > 0 && CHUVA.includes(s.clima)); };
export const avisoSegs = () => RISCO.warn * premioMult('warn');
export const avisando = () => { const s = st(); return !!s.prox && !s.fimAno && !s.interd && s.prox.em <= avisoSegs(); };
