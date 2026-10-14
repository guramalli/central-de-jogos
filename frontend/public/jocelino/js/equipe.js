// Jocelino — equipe.js — os ajudantes da pensão (os funcionários do Bancho, do nosso jeito): anúncio (cartaz na padaria,
// rádio, jornal) traz 3 candidatos no dia seguinte; contratar nas vagas que o degrau da fama libera (ou na reserva); atributos
// Serviço (anda e entrega mais rápido), Cozinha (a Rosa prepara mais rápido), Compras (traz mais na expedição) e Simpatia
// (gorjeta e o bônus da expedição); treinar custa dinheiro e vai até o nível 20; salário por noite trabalhada.
// (14/10, Tarefa B, o Dave) Cada pessoa tem 2 habilidades fixas da vocação dela (o ponto forte), à vista antes de contratar: uma
// abre no nível 3 e a outra no 7; no 12 ou no 15 abre a 3ª, a "Mestre". A habilidade só vale com a pessoa no posto dela (a do
// Salão, no Salão). O ajudante de salão começa recolhendo a louça (a "louca", que vem na contratação e não conta entre as 2).
// A reserva (a sala de espera do Dave): contratar sem posto; a pessoa fica parada (meio salário) até ir para um posto livre ou
// sair numa expedição. A expedição (o dispatch do Dave): quem está na reserva, ou no posto de Expedição, busca um ingrediente
// escolhido e volta na manhã seguinte.
// Regras puras (testadas na s1 e na s41); no palco os ajudantes de salão andam e trabalham (palco.js).

const _hashEquipe = s => { let h = 7; for (const ch of String(s || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const Equipe = {
  ANUNCIOS: { cartaz: { nome: 'Cartaz na padaria', base: 10, variacao: 15 }, radio: { nome: 'Anúncio no rádio', base: 25, variacao: 20 },
    jornal: { nome: 'Classificado no jornal', base: 45, variacao: 25 } },
  // Gente da Vila e de fora que procura trabalho (as folhas de andar e os retratos já existem).
  PESSOAS: [['neide', 'Neide'], ['lurdes', 'Dona Lurdes'], ['nena', 'Nena'], ['rosinete', 'Rosinete'], ['tonha', 'Tonha'], ['dona_cida', 'Dona Cida'],
    ['paulo', 'Paulo'], ['nenem', 'Neném']],
  // Vagas por degrau da fama: [salão, cozinha, expedição].
  VAGAS: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [2, 1, 0], [2, 1, 1], [2, 1, 1]],
  // O posto 'compras' virou a Expedição (o id fica, por causa do save).
  POSTOS: { salao: 'Salão', cozinha: 'Cozinha', compras: 'Expedição' },
  RESERVA: 'Reserva',
  // O atributo que cresce mais no treino, pelo posto (na reserva, pela vocação); a vocação pelo ponto forte do candidato.
  ATRIBUTO: { salao: 'servico', cozinha: 'cozinha', compras: 'compras' },
  VOCACAO: { servico: 'salao', cozinha: 'cozinha', compras: 'compras', simpatia: 'salao' },
  // As habilidades de cada posto: [id, o que faz]. A primeira do Salão vem na contratação; as "mestre_" e o "leva_prato" são os
  // Mestres (nível alto).
  HABILIDADES: {
    salao: [['louca', 'Recolhe a louça sozinho(a)'], ['bebida', 'Serve a bebida sozinho(a)'], ['farinha', 'Repõe a farinheira'], ['charme', 'Gorjeta caprichada'],
      ['mestre_bebida', 'Mestre da bebida: serve sozinho(a), sempre na medida'], ['mestre_louca', 'Mestre da louça: recolhe bem mais rápido'],
      ['mestre_gorjeta', 'Mestre da gorjeta: recolhe as moedas do balcão'], ['leva_prato', 'Leva prato: pega no passe e leva a quem pediu (raro)']],
    cozinha: [['fogo', 'Uma boca a mais no fogão'], ['pressa', 'A Rosa cozinha ainda mais rápido'], ['mestre_fogao', 'Mestre do fogão: a Rosa cozinha bem mais rápido']],
    compras: [['feira', 'Traz o dobro na expedição'], ['raro', 'Traz mais do ingrediente raro'], ['mestre_compras', 'Mestre da expedição: traz 2 a mais']],
  },
  BASE: { salao: 'louca' },
  MESTRES: { salao: ['mestre_bebida', 'mestre_louca', 'mestre_gorjeta'], cozinha: ['mestre_fogao'], compras: ['mestre_compras'] },
  // O Mestre faz também o que a habilidade simples faz.
  INCLUI: { mestre_bebida: 'bebida', mestre_louca: 'louca' },
  get SALARIO_BASE() { return ECO.equipe.salarioBase; },
  get NIVEL_MAX() { return ECO.equipe.nivelMax; },

  postoDaHab(h) { for (const k in Equipe.HABILIDADES) if (Equipe.HABILIDADES[k].some(x => x[0] === h)) return k; return ''; },
  textoHab(h) { for (const k in Equipe.HABILIDADES) { const x = Equipe.HABILIDADES[k].find(y => y[0] === h); if (x) return x[1]; } return h; },
  // As habilidades que podem ser uma das 2 fixas de quem tem esta vocação (sem a da contratação e sem os Mestres).
  pool(voc) { return (Equipe.HABILIDADES[voc] || []).map(x => x[0]).filter(h => h !== Equipe.BASE[voc] && !h.startsWith('mestre_') && h !== 'leva_prato'); },
  faz(e, h) { return !!e && (e.habilidades || []).some(x => x === h || Equipe.INCLUI[x] === h); },
  nivelDoMestre(e) { return e && e.mestre ? ECO.equipe.mestre[e.mestre === 'leva_prato' ? 'leva_prato' : Equipe.postoDaHab(e.mestre)] || 99 : 99; },
  // A habilidade que abre no nível n (3, 7 ou o do Mestre), ou ''.
  habilidadeDoNivel(e, n) { return n === 3 ? e.habs[0] || '' : n === 7 ? e.habs[1] || '' : n === Equipe.nivelDoMestre(e) ? e.mestre : ''; },
  // A ficha completa (o save antigo e os ajudantes montados à mão nos testes não têm a vocação, as 2 fixas nem o Mestre): a
  // vocação é o posto; as 2 fixas começam pelas que ele já ganhou (ninguém perde habilidade) e o resto vem de um sorteio fixo pelo
  // nome; quem estava em Compras continua trazendo, com o "sorteio" até o jogador escolher o ingrediente.
  normalizar(e) {
    if (!e) return e;
    if (!Array.isArray(e.habilidades)) e.habilidades = [];
    if (!Equipe.HABILIDADES[e.vocacao]) e.vocacao = Equipe.HABILIDADES[e.posto] ? e.posto : 'salao';
    if (!Array.isArray(e.habs) || e.habs.length < 2) {
      const pool = Equipe.pool(e.vocacao), ja = pool.filter(h => e.habilidades.includes(h)), resto = pool.filter(h => !ja.includes(h));
      const k = _hashEquipe(e.id || e.nome) % Math.max(1, resto.length);
      e.habs = ja.concat(resto.slice(k), resto.slice(0, k)).slice(0, 2);
    }
    if (!e.mestre) { const ms = Equipe.MESTRES[e.vocacao], h = _hashEquipe((e.id || e.nome) + ':mestre'); e.mestre = e.vocacao === 'salao' && h % 5 === 0 ? 'leva_prato' : ms[h % ms.length]; }
    if (e.posto === 'compras' && !e.busca) e.busca = 'sorteio';
    return e;
  },

  anunciar(p, tipo) { if (!Equipe.ANUNCIOS[tipo]) return 'tipo'; p.anuncio = tipo; return 'ok'; },
  // De manhã: o anúncio de ontem traz 3 candidatos (some quem não foi contratado no anúncio anterior). Cada um já vem com a
  // vocação, as 2 habilidades fixas e o Mestre (à vista antes de contratar, como no Dave).
  manha(p, rng) {
    if (!p.anuncio) return;
    const a = Equipe.ANUNCIOS[p.anuncio], ja = new Set(p.equipe.map(e => e.id));
    const livres = Equipe.PESSOAS.filter(([id]) => !ja.has(id)), cands = [];
    for (let k = 0; k < 3 && livres.length; k++) {
      const [id, nome] = livres.splice(rng.randi() % livres.length, 1)[0];
      const at = () => Math.round(a.base + rng.randf() * a.variacao);
      const c = { id, nome, nivel: 1, servico: at(), cozinha: at(), compras: at(), simpatia: at(), habilidades: [] };
      const forte = ['servico', 'cozinha', 'compras', 'simpatia'][rng.randi() % 4];
      c[forte] += 15;   // cada um tem um ponto forte
      c.vocacao = Equipe.VOCACAO[forte];
      const pool = Equipe.pool(c.vocacao); c.habs = [];
      while (c.habs.length < 2 && pool.length) c.habs.push(pool.splice(rng.randi() % pool.length, 1)[0]);
      const ms = Equipe.MESTRES[c.vocacao];
      c.mestre = c.vocacao === 'salao' && rng.randf() < ECO.equipe.levaPrato ? 'leva_prato' : ms[rng.randi() % ms.length];
      cands.push(c);
    }
    p.candidatos = cands; p.anuncio = '';
  },
  vagasLivres(p, posto) {
    if (posto === 'reserva') return ECO.equipe.reservaMax - p.equipe.filter(e => e.posto === 'reserva').length;
    const k = ['salao', 'cozinha', 'compras'].indexOf(posto), tot = Equipe.VAGAS[p.grau() - 1][k];
    return tot - p.equipe.filter(e => e.posto === posto).length;
  },
  // Põe a pessoa no posto: no Salão ela já recolhe a louça; na Expedição, o "sorteio" até escolher o ingrediente.
  _poe(e, posto) {
    e.posto = posto;
    if (Equipe.BASE[posto] && !e.habilidades.includes(Equipe.BASE[posto])) e.habilidades.push(Equipe.BASE[posto]);
    if (posto === 'compras' && !e.busca) e.busca = 'sorteio';
  },
  taxaContratacao(c) { return Math.round((c.servico + c.cozinha + c.compras + c.simpatia) * ECO.taxaContratacao); },
  contratar(p, i, posto, dinheiro = Infinity) {
    const c = p.candidatos[i];
    if (!c) return 'nao';
    if (Equipe.vagasLivres(p, posto) <= 0) return 'sem_vaga';
    if (dinheiro < Equipe.taxaContratacao(c)) return 'dinheiro';
    p.candidatos.splice(i, 1);
    Equipe.normalizar(c);
    p.equipe.push(c);
    Equipe._poe(c, posto);
    return 'ok';
  },
  // Troca de posto (ou vai para a reserva): a vaga é por degrau. Quem está fora numa expedição só muda quando voltar.
  mudarPosto(p, i, posto) {
    const e = p.equipe[i];
    if (!e || (posto !== 'reserva' && !Equipe.POSTOS[posto])) return 'nao';
    if (e.posto === posto) return 'ok';
    if (e.expedicao) return 'fora';
    if (Equipe.vagasLivres(p, posto) <= 0) return 'sem_vaga';
    Equipe._poe(e, posto);
    return 'ok';
  },
  demitir(p, i) { p.equipe.splice(i, 1); },
  custoTreino(e) { const T = ECO.equipe.treino; return Math.min(T.teto, Math.round(T.base * Math.pow(T.cresce, e.nivel - 1))); },
  // Treina se o dinheiro der; devolve o custo pago (0 se não deu). A habilidade nova do nível fica em e.ganhou.
  treinar(p, i, dinheiro) {
    const e = p.equipe[i];
    if (!e) return 0;
    Equipe.normalizar(e);
    const c = Equipe.custoTreino(e);
    if (e.nivel >= Equipe.NIVEL_MAX || dinheiro < c) return 0;
    e.nivel++; e.ganhou = '';
    const forte = Equipe.ATRIBUTO[e.posto] || Equipe.ATRIBUTO[e.vocacao] || 'servico';
    e[forte] += 12; e.simpatia += 4; e.servico += 3; e.cozinha += 3; e.compras += 3;
    // O ajudante de cozinha ensina uma receita nos níveis 5, 10, 15 e 20 (como os funcionários do Bancho): as dos ajudantes e,
    // acabadas essas, do 15 em diante, uma das que a Rosa inventaria (se ainda sobrar).
    if (e.posto === 'cozinha' && ECO.equipe.receitas.includes(e.nivel) && typeof Chef !== 'undefined') {
      const id = Chef.receitaNova(p, 'ajudante') || (e.nivel >= 15 ? Chef.receitaNova(p, 'chef') : '');
      if (id) { p.receitas.push(id); e.ensinou = (e.ensinou || []).concat(id); }
    }
    const nova = Equipe.habilidadeDoNivel(e, e.nivel);
    if (nova && !e.habilidades.includes(nova)) { e.habilidades.push(nova); e.ganhou = nova; }
    return c;
  },
  salario(e) { const E = ECO.equipe; return Math.min(E.salarioTeto, E.salarioBase + E.salarioPorNivel * (e.nivel - 1)); },
  // O salário desta noite: na reserva, parado, só a parte do ECO; na expedição, o dia inteiro.
  salarioDaNoite(e) { return e.posto === 'reserva' && !e.expedicao ? Math.ceil(Equipe.salario(e) * ECO.equipe.reserva) : Equipe.salario(e); },
  salarios(p) { return p.equipe.reduce((n, e) => n + Equipe.salarioDaNoite(e), 0); },
  // Alguém no posto da habilidade (o do Salão no Salão...) que a tem (ou o Mestre dela).
  tem(p, hab, posto) { const pp = posto || Equipe.postoDaHab(hab); return p.equipe.some(e => e.posto === pp && Equipe.faz(e, hab)); },
  // Efeitos na janta.
  // (revisão da Tarefa B) O piso de 0,5 vale só para o atributo Cozinha; a "pressa" e o Mestre do fogão multiplicam DEPOIS do piso,
  // senão sumiam com a Cozinha alta (justamente quando a pessoa já é Mestre).
  preparo(p) {
    const c = p.equipe.filter(e => e.posto === 'cozinha');
    if (!c.length) return 1;
    return Math.max(0.5, 1 - c.reduce((n, e) => n + e.cozinha, 0) / 200)
      * (Equipe.tem(p, 'pressa', 'cozinha') ? 1 - ECO.equipe.pressa : 1) * (Equipe.tem(p, 'mestre_fogao', 'cozinha') ? 1 - ECO.equipe.fogao : 1);
  },
  bocasExtra(p) { return Equipe.tem(p, 'fogo', 'cozinha') ? 1 : 0; },
  gorjetaExtra(p) { const s = p.equipe.filter(e => e.posto === 'salao').reduce((n, e) => n + e.simpatia, 0); return Math.min(0.5, s / 300) + (Equipe.tem(p, 'charme', 'salao') ? 0.15 : 0); },

  // ---- A expedição (o dispatch do Dave)
  // (revisão da Tarefa B, decisão do controlador pelo Dave: o dispatch busca o básico, o tempero comum) A lista: os ingredientes
  // de raridade 1 ou 2 que vêm de compra ou de colheita comum (ORIGENS: a Mercearia, a Horta, a Praia de dia, a pesca comum no
  // mar), que a pensão aceita e já viu (o Dave só manda buscar o que já achou; o da Mercearia, que se compra a qualquer hora,
  // conta como visto). Ficam de fora o raro, o do VIP, o da noite, o da estação e o do inverno com chuva, menos a pedra.
  ORIGENS: ['Mercearia do Ananias', 'Horta', 'Praia', 'Pesca no mar'],
  ingredientesDaExpedicao(p) {
    return Object.keys(Pratos.INGREDIENTES).filter(id => { const I = Pratos.INGREDIENTES[id];
      return id !== 'pedra' && I.raridade <= 2 && Equipe.ORIGENS.includes(I.origem) && p.aceita(id) && ((p.vistos || []).includes(id) || I.origem === 'Mercearia do Ananias'); });
  },
  // Quantas unidades a pessoa traz numa viagem (antes da raridade): a base, as Compras, a "feira", o Mestre e o bônus da Simpatia.
  _base(e) {
    const X = ECO.equipe.expedicao;
    let n = X.base + Math.floor((e.compras || 0) / X.porCompras);
    if (Equipe.faz(e, 'feira')) n *= 2;
    if (Equipe.faz(e, 'mestre_compras')) n += X.mestre;
    return n;
  },
  _chanceBonus(e) { const X = ECO.equipe.expedicao; return Math.min(X.bonusMax, (e.simpatia || 0) / X.simpatiaChance); },
  quantidade(e, rng) {
    const X = ECO.equipe.expedicao;
    let n = Equipe._base(e);
    if (rng.randf() < Equipe._chanceBonus(e)) n += X.bonus[0] + rng.randi() % (X.bonus[1] - X.bonus[0] + 1);
    return n;
  },
  // O divisor do ingrediente: a raridade AO QUADRADO (com "raro", a raridade − 1): o ★★ vem em um quarto.
  divisor(e, id) { const r = Math.max(1, Pratos.raridade(id) - (Equipe.faz(e, 'raro') ? 1 : 0)); return r * r; },
  // Quanto se espera que venha (o "traz ~N" da tela): a quantidade média (com o bônus médio) ÷ o divisor. No sorteio (p: a pensão,
  // para a lista), cada unidade sorteada vem com chance 1 ÷ divisor: a média desse 1 ÷ divisor na lista.
  previsao(e, id, p) {
    const X = ECO.equipe.expedicao, n = Equipe._base(e) + Equipe._chanceBonus(e) * (X.bonus[0] + X.bonus[1]) / 2;
    if (id !== 'sorteio') return n / Equipe.divisor(e, id);
    const l = p ? Equipe.ingredientesDaExpedicao(p) : [];
    return l.length ? n * l.reduce((s, x) => s + 1 / Equipe.divisor(e, x), 0) / l.length : 0;
  },
  // O que uma pessoa traz: o ingrediente escolhido (a quantidade ÷ o divisor; o que sobra da divisão é a chance de vir mais 1,
  // então menos de 1 vira uma chance de vir 1) ou, no "sorteio", unidades soltas da lista (cada uma vem com chance 1 ÷ divisor).
  trazer(p, e, busca, rng) {
    const n = Equipe.quantidade(e, rng), r = {}, lista = Equipe.ingredientesDaExpedicao(p);
    if (busca && busca !== 'sorteio' && lista.includes(busca)) {
      const q = n / Equipe.divisor(e, busca), k = Math.floor(q) + (rng.randf() < q - Math.floor(q) ? 1 : 0);
      if (k > 0) r[busca] = k;
      return r;
    }
    for (let k = 0; k < n && lista.length; k++) { const id = lista[rng.randi() % lista.length]; if (rng.randf() < 1 / Equipe.divisor(e, id)) r[id] = (r[id] || 0) + 1; }
    return r;
  },
  // Manda buscar: quem está no posto de Expedição passa a buscar isto toda manhã; quem está na reserva sai hoje e volta amanhã.
  // busca: um id da lista ou 'sorteio'.
  expedir(p, i, busca) {
    const e = p.equipe[i];
    if (!e) return 'nao';
    if (busca !== 'sorteio' && !Equipe.ingredientesDaExpedicao(p).includes(busca)) return 'ingrediente';
    if (e.posto === 'compras') { e.busca = busca; return 'ok'; }
    if (e.posto !== 'reserva') return 'posto';
    if (e.expedicao) return 'fora';
    e.expedicao = { busca, dia: typeof G !== 'undefined' && G ? G.dia : 0 };
    return 'ok';
  },
  // De manhã: quem estava na expedição volta (o da reserva volta para a reserva). Devolve [{ nome, busca, itens }].
  voltas(p, rng) {
    const r = [];
    for (const e of p.equipe) {
      if (e.posto !== 'compras' && !e.expedicao) continue;
      Equipe.normalizar(e);
      const busca = e.expedicao ? e.expedicao.busca : e.busca || 'sorteio';
      r.push({ nome: e.nome, busca, itens: Equipe.trazer(p, e, busca, rng) });
      delete e.expedicao;
    }
    return r;
  },
};
ecoCampo(Equipe.ANUNCIOS, 'preco', ECO.equipe.anuncios);

// De manhã: o anúncio de ontem traz candidatos; quem foi à expedição volta com o ingrediente para a despensa.
MANHA.push(() => {
  const p = G.pensao;
  if (!p || p.estado !== 'aberta') return;
  const f = mulberry(G.dia * 911), rng = { randf: f, randi: () => Math.floor(f() * 4294967296) };
  const tinha = !!p.anuncio;
  Equipe.manha(p, rng);
  if (tinha) G.feitosHoje.push(`O anúncio deu certo: ${p.candidatos.length} candidatos querem trabalhar na pensão (tela Equipe).`);
  for (const v of Equipe.voltas(p, rng)) {
    const partes = [];
    for (const id in v.itens) { p.despensa[id] = (p.despensa[id] || 0) + v.itens[id]; p.veIngrediente(id); partes.push(Itens.qtd(v.itens[id], id)); }
    if (partes.length) G.feitosHoje.push(`${v.nome} voltou da expedição: ${partes.join(', ')} para a despensa.`);
  }
});

// (revisão da Tarefa B, o domingo) A expedição custa o salário do dia. Num dia sem janta (o domingo), a noite não cobra salário,
// mas quem está no posto de Expedição sai do mesmo jeito (e volta amanhã de manhã): o salário dele sai aqui, como o de quem sai da
// reserva paga na saída (palco.js, _cobraNaSaida). O bolso nunca fica negativo (como na janta). Devolve o que saiu.
function cobrarExpedicaoSemJanta(linhas) {
  const p = G.pensao;
  if (!p || p.estado !== 'aberta' || typeof pensaoAbreHoje !== 'function' || pensaoAbreHoje()) return 0;
  const quem = p.equipe.filter(e => e.posto === 'compras'), conta = quem.reduce((s, e) => s + Equipe.salario(e), 0);
  if (!conta) return 0;
  const pago = Math.min(conta, Math.max(0, G.dinheiro));
  G.dinheiro -= pago; G.ganhoHoje = (G.ganhoHoje || 0) - pago;
  if (linhas) linhas.push(`Hoje não teve janta, mas a expedição saiu: o salário de ${quem.map(e => e.nome).join(' e ')} (Cr$ ${pago}).` + (pago < conta ? ` O bolso não cobriu Cr$ ${conta - pago}.` : ''));
  return pago;
}
NOITE.push(linhas => { cobrarExpedicaoSemJanta(linhas); });
