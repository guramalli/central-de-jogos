// Jocelino — horta.js — a horta do quintal (a lavoura do Stardew; horta.gd do Godot), as regras: a pá cava a cova, a
// semente da estação planta, o regador molha (água do barril), a chuva rega, à noite cresce o que foi regado e a virada
// da estação seca o que não é dela; tomate e milho rebrotam. A colheita vai para a despensa da Rosa ou para a caixa.

const CULTURAS = {
  alface: { semente: 'semente_alface', dias: 4, estacoes: [0, 1, 2], preco: 6, venda: 14 },
  couve: { semente: 'semente_couve', dias: 5, estacoes: [0, 1], preco: 8, venda: 20 },
  tomate: { semente: 'semente_tomate', dias: 8, estacoes: [0, 1, 2], preco: 12, venda: 34, rebrota: 4 },
  milho: { semente: 'semente_milho', dias: 9, estacoes: [2, 3], preco: 14, venda: 40, rebrota: 4 },
  abobora: { semente: 'semente_abobora', dias: 12, estacoes: [3, 0], preco: 20, venda: 70 },
  mandioca: { semente: 'rama_mandioca', dias: 14, estacoes: [0, 1, 2, 3], preco: 16, venda: 60 },
};
const AGUA_REGADOR = [30, 50], HORTA_SOME = 0.2;
const estacaoDoDia = dia => Math.floor((dia - 1) / 28) % 4;
const culturaDaSemente = item => Object.keys(CULTURAS).find(id => CULTURAS[id].semente === item) || '';
const chaveH = (x, y) => x + ',' + y;
for (const id in CULTURAS) PRECO_CAIXA[id] = CULTURAS[id].venda;   // a caixa de venda paga a colheita

const Horta = {
  iniciar(s) {
    const h = s.horta || {};
    G.horta = { covas: h.covas ? JSON.parse(JSON.stringify(h.covas)) : Horta.canteiroInicial(), agua: h.agua != null ? h.agua : AGUA_REGADOR[0],
      filhos: !!h.filhos, pedidoFilhos: !!h.pedidoFilhos, colocados: (h.colocados || []).map(c => Object.assign({}, c)), galinha: h.galinha || null };
  },
  salvar(s) { s.horta = JSON.parse(JSON.stringify(G.horta)); },
  canteiroInicial() {
    const C = QUINTAL.CANTEIRO, r = {};
    for (let y = C.y; y < C.y + C.h; y++) for (let x = C.x; x < C.x + C.w; x++) r[chaveH(x, y)] = { planta: null, dias: 0, regada: false, adubo: 0, inicial: true };
    return r;
  },
  cova(x, y) { return G.horta.covas[chaveH(x, y)]; },
  aguaMax() { return AGUA_REGADOR[nivelFerramenta('regador') >= 1 ? 1 : 0]; },
  diasPara(id) { const d = CULTURAS[id].dias; return typeof Habilidades !== 'undefined' && Habilidades.tem('agronomo') ? d - Math.ceil(d * 0.1) : d; },
  madura(c) { return !!(c && c.planta && c.dias >= Horta.diasPara(c.planta)); },
  estagio(c) { if (!c || !c.planta) return 0; if (Horta.madura(c)) return 4; if (c.colhida) return 3; return 1 + Math.min(2, Math.floor(c.dias * 3 / Horta.diasPara(c.planta))); },
  molhada(c, dia) { return !!c && (c.regada || (typeof Clima !== 'undefined' && Clima.chove(dia))); },
  cavar(x, y) { if (Horta.cova(x, y)) return 'ja'; G.horta.covas[chaveH(x, y)] = { planta: null, dias: 0, regada: false, adubo: 0 }; return 'ok'; },
  plantar(x, y, item, dia) {
    const id = culturaDaSemente(item); if (!id) return 'nao_e_semente';
    const c = Horta.cova(x, y); if (!c) return 'sem_cova'; if (c.planta) return 'ocupado';
    if (!CULTURAS[id].estacoes.includes(estacaoDoDia(dia))) return 'fora_de_estacao';
    c.planta = id; c.dias = 0; c.colhida = false; return 'ok';
  },
  regar(x, y) {
    const c = Horta.cova(x, y); if (!c) return 'sem_cova'; if (c.regada) return 'ja';
    if (G.horta.agua <= 0) return 'vazio';
    G.horta.agua--; c.regada = true; return 'ok';
  },
  encher() { G.horta.agua = Horta.aguaMax(); },
  // A qualidade da colheita: 0 normal, 1 boa (+1 unidade), 2 caprichada (+2). A fórmula do Stardew com o nível L da Roça e
  // o adubo F (o esterco; a Mão verde soma 1): caprichada 0,2·L/10 + 0,2·F·(L+2)/12 + 0,01; boa min(0,75, 2× caprichada).
  qualidade(rng = Math.random, adubo = 0) {
    const L = typeof Habilidades !== 'undefined' ? Habilidades.nivel('roca') : 0;
    const F = (adubo ? 1 : 0) + (typeof Habilidades !== 'undefined' && Habilidades.tem('mao_verde') ? 1 : 0);
    const cap = 0.2 * (L / 10) + 0.2 * F * ((L + 2) / 12) + 0.01;
    if (rng() < cap) return 2;
    return rng() < Math.min(0.75, cap * 2) ? 1 : 0;
  },
  adubar(x, y) { const c = Horta.cova(x, y); if (!c) return 'sem_cova'; if (c.planta) return 'ocupado'; if (c.adubo) return 'ja'; c.adubo = 1; return 'ok'; },
  colher(x, y, rng = Math.random) {
    const c = Horta.cova(x, y); if (!Horta.madura(c)) return null;
    const id = c.planta, q = Horta.qualidade(rng, c.adubo), C = CULTURAS[id];
    if (C.rebrota) { c.dias = Horta.diasPara(id) - C.rebrota; c.colhida = true; }   // rebrota: volta à fase 3
    else { c.planta = null; c.dias = 0; c.adubo = 0; c.colhida = false; }
    return { id, qtd: 1 + q, qual: q };
  },
  arrancar(x, y) { const c = Horta.cova(x, y); if (!c || !c.planta) return ''; const id = c.planta; c.planta = null; c.dias = 0; c.adubo = 0; c.colhida = false; return id; },
  // A noite: cresce o que foi regado (ou com chuva); vira a estação, seca o que não é dela; a cova vazia pode sumir.
  noite(dia, chove, rng = Math.random) {
    const r = { secaram: [], sumiram: 0 }, vira = estacaoDoDia(dia + 1) !== estacaoDoDia(dia);
    for (const k of Object.keys(G.horta.covas)) {
      const c = G.horta.covas[k];
      if (c.planta && (c.regada || chove)) c.dias++;
      c.regada = false;
      if (c.planta && vira && !CULTURAS[c.planta].estacoes.includes(estacaoDoDia(dia + 1))) { r.secaram.push(c.planta); c.planta = null; c.dias = 0; c.adubo = 0; c.colhida = false; }
      if (!c.planta && !c.adubo && !c.inicial && rng() < HORTA_SOME) { delete G.horta.covas[k]; r.sumiram++; }
    }
    return r;
  },
  plantadas() { return Object.values(G.horta.covas).filter(c => c.planta).length; },
};
INICIADORES.push(s => Horta.iniciar(s));
COLETORES.push(s => Horta.salvar(s));
// Os itens da horta e as vantagens da Roça que mexem no dinheiro (a caixa e o preço do prato na pensão).
Object.assign(ITENS, { esterco: { nome: 'Esterco curtido', pilha: 99, ferramenta: false, descricao: 'Adubo: na cova vazia, antes de plantar. Mais colheita boa e caprichada.' } });
const fatorFeira = id => !CULTURAS[id] || typeof Habilidades === 'undefined' ? 1 : Habilidades.tem('atacadista') ? 1.25 : Habilidades.tem('feirante') ? 1.1 : 1;
const temperoDaRoca = prato => typeof Habilidades !== 'undefined' && Habilidades.tem('tempero_da_roca') && Pratos.PRATOS[prato] && Object.keys(Pratos.PRATOS[prato].porcao || {}).some(i => CULTURAS[i]) ? 1.1 : 1;
