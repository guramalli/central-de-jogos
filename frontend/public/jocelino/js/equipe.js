// Jocelino — equipe.js — os ajudantes da pensão (os funcionários do Bancho, do nosso jeito): anúncio (cartaz na padaria,
// rádio, jornal) traz 3 candidatos no dia seguinte; contratar nas vagas que o degrau da fama libera; atributos Serviço
// (anda e entrega mais rápido), Cozinha (a Rosa prepara mais rápido), Compras (traz ingrediente toda manhã) e Simpatia
// (gorjeta); treinar custa dinheiro (×1,5 por nível) e dá habilidade nos níveis 3 e 7; salário por noite trabalhada.
// Regras puras (testadas na s1); no palco os ajudantes de salão andam e trabalham (palco.js).

const Equipe = {
  ANUNCIOS: { cartaz: { nome: 'Cartaz na padaria', preco: 50, base: 10, variacao: 15 }, radio: { nome: 'Anúncio no rádio', preco: 150, base: 25, variacao: 20 },
    jornal: { nome: 'Classificado no jornal', preco: 400, base: 45, variacao: 25 } },
  // Gente da Vila e de fora que procura trabalho (as folhas de andar e os retratos já existem).
  PESSOAS: [['neide', 'Neide'], ['lurdes', 'Dona Lurdes'], ['nena', 'Nena'], ['rosinete', 'Rosinete'], ['tonha', 'Tonha'], ['dona_cida', 'Dona Cida'],
    ['paulo', 'Paulo'], ['nenem', 'Neném']],
  // Vagas por degrau da fama: [salão, cozinha, compras].
  VAGAS: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [2, 1, 0], [2, 1, 1], [2, 1, 1]],
  POSTOS: { salao: 'Salão', cozinha: 'Cozinha', compras: 'Compras' },
  // Habilidades (nível 3 e 7), por posto.
  HABILIDADES: {
    salao: [['louca', 'Recolhe a louça sozinho(a)'], ['bebida', 'Serve a bebida sozinho(a)'], ['farinha', 'Repõe a farinheira'], ['charme', 'Gorjeta caprichada']],
    cozinha: [['fogo', 'Uma boca a mais no fogão'], ['pressa', 'A Rosa cozinha ainda mais rápido']],
    compras: [['feira', 'Traz o dobro da feira'], ['raro', 'Traz ingrediente mais raro']],
  },
  SALARIO_BASE: 4,

  anunciar(p, tipo) { if (!Equipe.ANUNCIOS[tipo]) return 'tipo'; p.anuncio = tipo; return 'ok'; },
  // De manhã: o anúncio de ontem traz 3 candidatos (some quem não foi contratado no anúncio anterior).
  manha(p, rng) {
    if (!p.anuncio) return;
    const a = Equipe.ANUNCIOS[p.anuncio], ja = new Set(p.equipe.map(e => e.id));
    const livres = Equipe.PESSOAS.filter(([id]) => !ja.has(id)), cands = [];
    for (let k = 0; k < 3 && livres.length; k++) {
      const [id, nome] = livres.splice(rng.randi() % livres.length, 1)[0];
      const at = () => Math.round(a.base + rng.randf() * a.variacao);
      const c = { id, nome, nivel: 1, servico: at(), cozinha: at(), compras: at(), simpatia: at(), habilidades: [] };
      c[['servico', 'cozinha', 'compras', 'simpatia'][rng.randi() % 4]] += 15;   // cada um tem um ponto forte
      cands.push(c);
    }
    p.candidatos = cands; p.anuncio = '';
  },
  vagasLivres(p, posto) {
    const k = ['salao', 'cozinha', 'compras'].indexOf(posto), tot = Equipe.VAGAS[p.grau() - 1][k];
    return tot - p.equipe.filter(e => e.posto === posto).length;
  },
  taxaContratacao(c) { return Math.round((c.servico + c.cozinha + c.compras + c.simpatia) * ECO.taxaContratacao); },
  contratar(p, i, posto, dinheiro = Infinity) {
    const c = p.candidatos[i];
    if (!c) return 'nao';
    if (Equipe.vagasLivres(p, posto) <= 0) return 'sem_vaga';
    if (dinheiro < Equipe.taxaContratacao(c)) return 'dinheiro';
    p.candidatos.splice(i, 1);
    p.equipe.push(Object.assign(c, { posto }));
    if (posto === 'salao' && !c.habilidades.includes('louca')) c.habilidades.push('louca');   // começa recolhendo a louça
    return 'ok';
  },
  demitir(p, i) { p.equipe.splice(i, 1); },
  custoTreino(e) { return Math.round(60 * Math.pow(1.5, e.nivel - 1)); },
  // Treina se o dinheiro der; devolve o custo pago (0 se não deu).
  treinar(p, i, dinheiro) {
    const e = p.equipe[i], c = e && Equipe.custoTreino(e);
    if (!e || e.nivel >= 10 || dinheiro < c) return 0;
    e.nivel++;
    const forte = { salao: 'servico', cozinha: 'cozinha', compras: 'compras' }[e.posto] || 'servico';
    e[forte] += 12; e.simpatia += 4; e.servico += 3; e.cozinha += 3; e.compras += 3;
    // O ajudante de cozinha ensina uma receita nos níveis 5 e 10 (como os funcionários do Bancho).
    if (e.posto === 'cozinha' && (e.nivel === 5 || e.nivel === 10) && typeof Chef !== 'undefined') { const id = Chef.receitaNova(p, 'ajudante'); if (id) { p.receitas.push(id); e.ensinou = (e.ensinou || []).concat(id); } }
    if (e.nivel === 3 || e.nivel === 7) {
      const hs = (Equipe.HABILIDADES[e.posto] || Equipe.HABILIDADES.salao).map(h => h[0]).filter(h => !e.habilidades.includes(h));
      if (hs.length) e.habilidades.push(hs[0]);
    }
    return c;
  },
  salario(e) { return Equipe.SALARIO_BASE + 2 * (e.nivel - 1); },
  salarios(p) { return p.equipe.reduce((n, e) => n + Equipe.salario(e), 0); },
  tem(p, hab, posto) { return p.equipe.some(e => (!posto || e.posto === posto) && e.habilidades.includes(hab)); },
  // Efeitos na janta.
  preparo(p) { const c = p.equipe.filter(e => e.posto === 'cozinha'); return c.length ? Math.max(0.5, 1 - c.reduce((n, e) => n + e.cozinha, 0) / 200 - (Equipe.tem(p, 'pressa', 'cozinha') ? 0.1 : 0)) : 1; },
  bocasExtra(p) { return Equipe.tem(p, 'fogo', 'cozinha') ? 1 : 0; },
  gorjetaExtra(p) { const s = p.equipe.filter(e => e.posto === 'salao').reduce((n, e) => n + e.simpatia, 0); return Math.min(0.5, s / 300) + (Equipe.tem(p, 'charme') ? 0.15 : 0); },
  // A ida à feira de manhã (posto de compras): ingredientes da fase da pensão, mais com Compras alto.
  feira(p, rng) {
    const c = p.equipe.find(e => e.posto === 'compras');
    if (!c) return {};
    const ops = Object.keys(typeof ENCOMENDA !== 'undefined' ? ENCOMENDA : {}).filter(id => p.aceita(id));
    if (Equipe.tem(p, 'raro', 'compras')) ops.sort((a, b) => Pratos.raridade(b) - Pratos.raridade(a)).splice(Math.max(2, Math.ceil(ops.length / 2)));
    const n = (1 + Math.floor(c.compras / 25)) * (Equipe.tem(p, 'feira', 'compras') ? 2 : 1), r = {};
    for (let k = 0; k < n && ops.length; k++) { const id = ops[rng.randi() % ops.length]; r[id] = (r[id] || 0) + 1; }
    return r;
  },
};

// De manhã: o anúncio de ontem traz candidatos; quem é de Compras volta da feira com ingredientes para a despensa.
MANHA.push(() => {
  const p = G.pensao;
  if (!p || p.estado !== 'aberta') return;
  const f = mulberry(G.dia * 911), rng = { randf: f, randi: () => Math.floor(f() * 4294967296) };
  const tinha = !!p.anuncio;
  Equipe.manha(p, rng);
  if (tinha) G.feitosHoje.push(`O anúncio deu certo: ${p.candidatos.length} candidatos querem trabalhar na pensão (tela Equipe).`);
  const fe = Equipe.feira(p, rng), partes = [];
  for (const id in fe) { p.despensa[id] = (p.despensa[id] || 0) + fe[id]; p.veIngrediente(id); partes.push(Itens.qtd(fe[id], id)); }
  if (partes.length) G.feitosHoje.push('Da feira, para a despensa: ' + partes.join(', ') + '.');
});
