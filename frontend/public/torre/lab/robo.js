// Central de testes da árvore — o robô que joga (sem tela). Usado pelo Worker da página (lab/worker.js) e pelo Node
// (lab/robo-cli.mjs, tests/lab.test.js). Joga com os módulos de verdade de src/sim/, com as mudanças do laboratório
// aplicadas por cima; no fim desfaz tudo, então dá para comparar "hoje" e "com mudanças" no mesmo processo.
// Quem importa define antes: globalThis.TORRE_FLAGS = { viva: true, risco: true }.
import { UP, KEYS, ERA_TECH, TECH_BY_STAGE } from '../src/data/upgrades.js';
import { VIVA } from '../src/data/viva.js';
import { PREMIOS } from '../src/data/premios.js';
import { altOf } from '../src/data/height.js';
import * as state from '../src/sim/state.js';
import { sim, canBuy, buy, unlocked, maxed, cost, rates } from '../src/sim/economy.js';
import { priorityScore } from '../src/sim/preview.js';
import * as K from '../src/sim/risco.js';

export const MARCOS = [1000, 12000, 50000, 100000, 400000];
const DEF = ['contravento', 'sondagem', 'clima', 'seguranca', 'manutencao'];
// lado A de um par = a tecnologia original (vem antes na lista); lado B = a alternativa
const ORDEM_TECH = Object.keys(ERA_TECH);
export const ladoB = k => !!(UP[k] && UP[k].pair) && ORDEM_TECH.indexOf(k) > ORDEM_TECH.indexOf(UP[k].pair);

// ---------- mudanças: aplicar e desfazer ----------
// m = { up: { chave: { campo: valor } }, novas: { chave: { n, b, st, base, k, mul|add, max, req, reqAlt, pair } },
//       remover: [chave], risco: { campo: valor }, viva: { 'caminho.com.pontos': valor }, premios: { id: { campo: valor } },
//       ameacas: { tipo: { base } } }
const copia = v => JSON.parse(JSON.stringify(v));
function caminho(obj, p) { const ps = p.split('.'), ult = ps.pop(); let o = obj; for (const x of ps) o = o[x]; return [o, ult]; }
export function aplicar(m = {}) {
  const volta = [];
  const troca = (obj, campo, valor) => { const tinha = Object.prototype.hasOwnProperty.call(obj, campo), antes = tinha ? copia(obj[campo]) : undefined; volta.push(() => { if (tinha) obj[campo] = antes; else delete obj[campo]; }); if (valor === null) delete obj[campo]; else obj[campo] = copia(valor); };
  for (const k in m.up || {}) if (UP[k]) for (const c in m.up[k]) troca(UP[k], c, m.up[k][c]);
  for (const k of m.remover || []) if (UP[k]) troca(UP[k], 'max', 0);
  const novas = Object.keys(m.novas || {}).filter(k => !UP[k]);
  for (const k of novas) { UP[k] = { b: 'eng', base: 100, k: 2, ...copia(m.novas[k]), nova: true }; KEYS.push(k); }
  volta.push(() => { for (const k of novas) { delete UP[k]; const i = KEYS.indexOf(k); if (i >= 0) KEYS.splice(i, 1); } });
  // etapas das tecnologias (techMult): refeitas com as etapas novas ou trocadas
  const techAntes = copia(TECH_BY_STAGE);
  for (const s in TECH_BY_STAGE) TECH_BY_STAGE[s] = [];
  for (const k of KEYS) { const u = UP[k]; if (!(u.era || u.nova)) continue; if (u.st) (TECH_BY_STAGE[u.st] ||= []).push(k); if (u.st2) (TECH_BY_STAGE[u.st2] ||= []).push(k); }
  volta.push(() => { for (const s in TECH_BY_STAGE) delete TECH_BY_STAGE[s]; Object.assign(TECH_BY_STAGE, techAntes); });
  for (const c in m.risco || {}) troca(K.RISCO, c, m.risco[c]);
  for (const p in m.viva || {}) { const [o, c] = caminho(VIVA, p); troca(o, c, m.viva[p]); }
  for (const id in m.premios || {}) if (PREMIOS[id]) for (const c in m.premios[id]) troca(PREMIOS[id], c, m.premios[id][c]);
  for (const t in m.ameacas || {}) if (K.AMEACAS[t]) for (const c in m.ameacas[t]) troca(K.AMEACAS[t], c, m.ameacas[t][c]);
  return () => { while (volta.length) volta.pop()(); };
}

// ---------- sorteio com semente (mesma semente = mesmas intempéries e prêmios nos dois lados da comparação) ----------
function semente(n) { let a = (n * 2654435761) >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- o robô ----------
// robo: 'excelente' (defesas da faixa em dia antes do aviso), 'bom' (reage ao aviso), 'novato' (compra meio ao acaso, defende pouco)
// build: estilo de jogo — 'equilibrado', 'logistica', 'mercado', 'defesas', 'parA', 'parB', 'premiosObra'
// modo: 'risco' (torre única com intempéries) ou 'corrida' (sem intempéries: só a economia)
export const BUILDS = {
  equilibrado: 'Equilibrado: compra o que mais rende agora',
  logistica: 'Foco em Logística: subida de material vale o dobro',
  mercado: 'Foco em Mercado: aluguel e turismo valem o dobro',
  defesas: 'Defensivo: defesas mais altas e mais manutenção',
  parA: 'Pares: sempre o lado A (a tecnologia original)',
  parB: 'Pares: sempre o lado B (a alternativa)',
  premiosObra: 'Prêmios de obra (renda e etapas) em vez de defesa',
};
export function simular(cfg = {}, aoProgresso = null) {
  const { mudancas = {}, robo = 'excelente', build = 'equilibrado', modo = 'risco', horas = 8, pararNaOrbita = true } = cfg;
  const rnd0 = Math.random; Math.random = semente(cfg.semente || 1);
  const desfaz = aplicar(modo === 'corrida' ? { ...mudancas, risco: { ...(mudancas.risco || {}), gap: [1e12, 1e12] } } : mudancas);
  try { return jogar(); } finally { desfaz(); Math.random = rnd0; }

  function jogar() {
    state.resetState(); const S = () => state.S; S().introSeen = true;
    const out = { marcos: {}, rendaEm: {}, torreEm: {}, quedas: [], serie: [], gasto: {}, compras: {}, maiorEspera: 0, interdicoes: 0, parcelas: 0, t: 0, torres: 1, melhor: 0 };
    const excelente = robo === 'excelente', defende = robo !== 'novato';
    const limiteDef = build === 'defesas' ? 0.2 : 0.3, maxManut = build === 'defesas' ? 16 : 12;
    let espera = 0, util = false;
    const compra = (k, contaUtil = true) => {
      const c = cost(k); if (!buy(k)) return false;
      const ramo = DEF.includes(k) ? 'def' : UP[k].b; out.gasto[ramo] = (out.gasto[ramo] || 0) + c; out.compras[k] = (out.compras[k] || 0) + 1;
      if (contaUtil) util = true; return true;
    };
    const peso = k => { const b = UP[k].b; if (build === 'logistica' && (b === 'log' || k === 'guindaste')) return 2; if (build === 'mercado' && b === 'merc') return 2; return 1; };
    const permitido = k => !(UP[k].pair && ((build === 'parA' && ladoB(k)) || (build === 'parB' && !ladoB(k))));
    const loja = () => {
      for (let i = 0; i < 12; i++) {
        const lista = KEYS.filter(k => !DEF.includes(k) && permitido(k) && unlocked(k) && !maxed(k)).map(k => [k, priorityScore(k) * peso(k)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
        let esc;
        if (robo === 'novato') { const top = lista.slice(0, 6).filter(([k]) => canBuy(k)); esc = top.length ? top[Math.floor(Math.random() * top.length)] : null; }
        else esc = lista.slice(0, 3).find(([k]) => canBuy(k));
        if (!esc) break; compra(esc[0]);
        if (robo === 'novato') break; // o novato compra uma coisa por vez
      }
    };
    const grupoForte = () => { const p = K.pesosDe(S().maxAlt), g = {}; for (const t in p) { const a = K.AMEACAS[t]; if (a.grupo) g[a.grupo] = (g[a.grupo] || 0) + p[t]; } const o = Object.entries(g).sort((a, b) => b[1] - a[1]); return o.length ? o[0][0] : 'vento'; };
    const valorPremio = id => {
      const p = PREMIOS[id]; if (!p) return 0;
      if (build === 'premiosObra') return p.defGrupo ? 2 : id === 'seguro' ? 3 : 8;
      if (id === 'seguro') return 9; if (id === 'nucleoAco') return 8; if (p.defGrupo === grupoForte()) return 7; if (p.defGrupo) return 5; if (id === 'plantao') return 4.5; if (p.tipo === 'obra') return 4; return 3;
    };
    const melhorPremio = lista => robo === 'novato' ? lista[Math.floor(Math.random() * lista.length)] : lista.slice().sort((a, b) => valorPremio(b) - valorPremio(a))[0];
    const fim = horas * 3600;
    while (out.t < fim) {
      const r = K.riscoState();
      if (S().colapso) {
        const c = S().colapso; out.quedas.push({ t: out.t, alt: c.alt, tipo: c.tipo, torre: S().riscoTentativa || 1, ano: r.ano });
        const lista = K.premiosDaTentativa(); K.novaTorre(lista.length ? melhorPremio(lista) : null); out.torres++; continue;
      }
      if (r.interd) {
        const o = ['completo', 'geral', 'foco'].map(id => r.interd.opcoes.find(x => x.id === id)).find(x => S().money >= x.custo);
        if (o) K.cumprirReforco(o.id); else { K.cumprirReforco('foco', true); out.parcelas++; }
        out.interdicoes++; continue;
      }
      if (r.fimAno) { K.escolherPremio(melhorPremio(r.oferta)); continue; }
      sim(1); out.t++; S().playTime = (S().playTime || 0) + 1;
      const alt = altOf(Math.floor(S().floors)); out.melhor = Math.max(out.melhor, S().maxAlt);
      for (const m of MARCOS) if (out.marcos[m] == null && S().maxAlt >= m) { out.marcos[m] = out.t; out.rendaEm[m] = rates().income; out.torreEm[m] = S().riscoTentativa || 1; }
      if (out.t % 30 === 0) out.serie.push([out.t, alt]);
      util = false;
      // defesas
      if (excelente && modo === 'risco') {
        const faixa = K.faixaDe(S().maxAlt);
        for (const d of ['contravento', 'sondagem', 'clima']) {
          const pior = () => Math.max(0, ...faixa.filter(t => K.AMEACAS[t].def === d).map(t => K.danoDe(t)));
          for (let i = 0; i < 10 && pior() > r.max * limiteDef && canBuy(d); i++) compra(d);
        }
        if (r.integ < r.max * 0.8 && canBuy('manutencao') && S().lv.manutencao < maxManut) compra('manutencao');
      }
      if (modo === 'risco' && (defende || Math.random() < 0.02)) {
        if (r.prox && r.prox.em < 25 && K.AMEACAS[r.prox.tipo].base) { const d = K.AMEACAS[r.prox.tipo].def; for (let i = 0; i < 20 && K.danoDe(r.prox.tipo) > r.integ * 0.5 && canBuy(d); i++) compra(d); }
        for (let i = 0; i < 5 && (S().lv.seguranca || 0) < K.segExigida() && canBuy('seguranca'); i++) compra('seguranca');
        if (r.integ < r.max * 0.6 && canBuy('manutencao') && S().lv.manutencao < 8) compra('manutencao');
      }
      if (robo !== 'novato' || out.t % 15 === 0) loja();
      // espera: segundos seguidos em que nada útil dava para comprar (o novato só olha de 15 em 15 s)
      if (robo === 'novato') { if (out.t % 15 === 0) { if (util) espera = 0; else { espera += 15; out.maiorEspera = Math.max(out.maiorEspera, espera); } } }
      else if (util) espera = 0; else { espera++; out.maiorEspera = Math.max(out.maiorEspera, espera); }
      if (aoProgresso && out.t % 300 === 0) aoProgresso({ t: out.t, marcos: { ...out.marcos }, quedas: out.quedas.length, alt, melhor: out.melhor });
      if (pararNaOrbita && out.marcos[400000] != null) break;
    }
    out.repFinal = S().pontosTotal || 0;
    return out;
  }
}
