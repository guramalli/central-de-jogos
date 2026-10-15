// Jocelino — pensao.js — tradução de jogo/nucleo/pensao.gd.
// Pensão da Rosa (o sushi bar do Bancho, em PF de peão): reforma da casa da Dona Cotinha, despensa de ingredientes
// (raridade e fase), fama em 5 graus (o Cooksta, sem despesa fixa), cardápio da noite, preço, estrelas e gorjeta.
// Regras puras; a janta passo a passo fica em turno_janta.js.

class Pensao {
  // A fama em 6 degraus (os ranks do Cooksta no Dave): cada um pede curtidas (clientes que deram 4 estrelas ou mais),
  // melhor sabor (o prato mais caprichado) e receitas pesquisadas; libera vagas no cardápio, banquetas e clientes, e
  // cobra uma despesa por noite (gás, gelo, luz).
  static DEGRAUS = ECO.pensao.degraus;   // os números moram no ECO (economia.js)
  static GRAUS = Pensao.DEGRAUS;
  static DESPENSA_INICIAL = { arroz: 5, feijao: 5, ovo: 5 };
  static CHANCE_PEDRA_VOLTA = 0.5;
  // A pedra também é material de obra: a despensa guarda só a da sopa (o resto fica na mochila).
  static PEDRA_MAX = 2;
  static RECEITAS_INICIAIS = ['pf_peao', 'peixe_frito', 'sopa_pedra', 'cocada_tijolinho'];
  // Caprichar (o Enhance do Bancho): cópias do ingrediente principal para subir do nível n para n+1 (1 → 10).
  static NIVEL_MAX = 10;
  static get SABOR_POR_NIVEL() { return ECO.pensao.saborPorNivel; }

  constructor() {
    this.estado = 'fechada';   // fechada, limpar, telhado, balcao, cozinha, pintura, pronta, aberta (as etapas em ECO.reforma)
    this.abreDia = -1; this.reforma = { entregue: {}, dias: 0, hoje: 0 }; this._golpes = 0; this.limpos = []; this.mesas = 2; this.fama = 0;
    this.despensa = {}; this.cardapio = []; this.cardapioNoite = {}; this.receitas = Pensao.RECEITAS_INICIAIS.slice(); this.ultimaJanta = -1;
    this.niveis = {}; this.pitadas = 0; this.vistos = []; this.curtidas = 0;
    this.equipe = []; this.candidatos = []; this.anuncio = ''; this.melhorias = []; this.agenda = []; this.metas = []; this.panela = {}; this.panelaRar = {}; this.chef = { nivel: 1, xp: 0 };
    this.premios = []; this.garfos = 0; this.paladarNotas = []; this.concursos = {};
    this.ampliacoes = []; this.obra = null; this.nivelMelhoria = {};
    this.servidos = {};   // (Tarefa D1) o nível mais alto em que cada prato já foi servido (o "melhor sabor" do Dave)
    // (15/10, o fechamento do Dave) as últimas noites da pensão, para o gráfico do fechamento: [{ dia, receita, lucro, nota, clientes, rosa? }]
    this.historico = [];
  }
  // (14/10, Tarefa D1, o Dave: o Cooksta guarda o maior sabor entre os pratos JÁ SERVIDOS) O melhor sabor conta o nível em que cada
  // prato saiu para um cliente (serviu), não o nível do caderno: caprichar e não servir ainda não sobe o degrau.
  melhorSabor() { return Math.max(0, ...Object.values(this.servidos || {}).map(n => n * Pensao.SABOR_POR_NIVEL)); }
  // O prato saiu para um cliente (pago): guarda o nível dele, se for o mais alto já servido. O prato da casa não conta.
  serviu(prato) { if (!Pratos.PRATOS[prato]) return; this.servidos = this.servidos || {}; this.servidos[prato] = Math.max(this.servidos[prato] || 0, this.nivel(prato)); }
  pesquisadas() { return this.receitas.filter(id => !Pensao.RECEITAS_INICIAIS.includes(id)).length; }
  // As estrelas da casa (0 a 5): o degrau menos 1.
  estrelasCasa(g = this.grau()) { return g - 1; }
  static textoEstrelas(n) { return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n)); }
  nomeComEstrelas(g = this.grau()) { return Pensao.textoEstrelas(g - 1) + ' ' + this.nomeGrau(g); }
  // Visitas do Paladar (noites diferentes) com pelo menos n garfos; vitórias no concurso da Rádio.
  visitasCom(n) { return new Set((this.paladarNotas || []).filter(x => x.nota >= n).map(x => x.dia)).size; }
  vitorias() { return Object.values(this.concursos || {}).filter(v => v === 'venceu').length; }
  // O degrau pede curtidas, sabor e pesquisadas; os altos, o calendário: visitas do Paladar e vitória no concurso.
  _cumpre(d) {
    const paladar = this._semPaladar || !d.garfos || this.visitasCom(d.garfos) >= (d.visitas || 1);
    const concurso = this._semPaladar || this.vitorias() >= (d.concurso || 0);
    return this.curtidas >= d.curtidas && this.melhorSabor() >= d.sabor && this.pesquisadas() >= d.pesquisadas && paladar && concurso;
  }
  grau() { let g = 1; for (let i = 1; i < Pensao.DEGRAUS.length && this._cumpre(Pensao.DEGRAUS[i]); i++) g = i + 1; return Math.max(g, this.grauMinimo || 1); }
  degrau(g = this.grau()) { return Pensao.DEGRAUS[clamp(g, 1, Pensao.DEGRAUS.length) - 1]; }
  nomeGrau(g) { return this.degrau(g).nome; }
  // (o cardápio do Bancho, 13/10) As vagas do cardápio: 2 a 5, pelo degrau (ECO.pensao.vagas).
  vagas() { return ECO.pensao.vagas[clamp(this.grau(), 1, ECO.pensao.vagas.length) - 1]; }
  maxMesas() { return 6 + ((this.ampliacoes || []).includes('salao_maior') ? 2 : 0); }
  mesasDaNoite() { return Math.max(this.mesas, this.degrau().mesas) + (this.melhorias || []).filter(id => id === 'banqueta_extra').length + ((this.ampliacoes || []).includes('salao_maior') ? 2 : 0); }
  clientesDaNoite() { return this.degrau().clientes + ((this.ampliacoes || []).includes('varanda') ? 3 : 0); }
  despesa() { return this.degrau().despesa; }
  // O próximo degrau e o que falta de cada coisa (null no último).
  proximoDegrau() {
    const g = this.grau();
    if (g >= Pensao.DEGRAUS.length) return null;
    const d = Pensao.DEGRAUS[g];
    return { grau: g + 1, nome: d.nome, d, falta: { curtidas: Math.max(0, d.curtidas - this.curtidas), sabor: Math.max(0, d.sabor - this.melhorSabor()), pesquisadas: Math.max(0, d.pesquisadas - this.pesquisadas()), visitas: d.garfos ? Math.max(0, (d.visitas || 1) - this.visitasCom(d.garfos)) : 0, garfos: d.garfos || 0, concurso: Math.max(0, (d.concurso || 0) - this.vitorias()) } };
  }
  // Progresso para o próximo degrau (0 a 1), pela média das três exigências.
  progresso() {
    const p = this.proximoDegrau(); if (!p) return 1;
    const a = this.degrau(), d = p.d, f = (v, x0, x1) => x1 <= x0 ? 1 : clamp((v - x0) / (x1 - x0), 0, 1);
    const partes = [f(this.curtidas, a.curtidas, d.curtidas), f(this.melhorSabor(), a.sabor, d.sabor), f(this.pesquisadas(), a.pesquisadas, d.pesquisadas)];
    if (d.garfos) partes.push(clamp(this.visitasCom(d.garfos) / (d.visitas || 1), 0, 1)); if (d.concurso) partes.push(clamp(this.vitorias() / d.concurso, 0, 1));
    return partes.reduce((s, x) => s + x, 0) / partes.length;
  }
  // Compatibilidade (textos antigos): pontos que faltam = curtidas que faltam.
  faltaParaSubir() { const p = this.proximoDegrau(); return p ? Math.max(1, p.falta.curtidas) : 0; }
  aceita(id) { return !!Pratos.INGREDIENTES[id] && Pratos.fase(id) <= this.grau(); }

  // Guarda na despensa tudo o que a fase aceita. Devolve {id: qtd}.
  guardar(mochila) {
    const r = {};
    for (const id in Pratos.INGREDIENTES) {
      let n = mochila.total(id);
      if (id === 'pedra') n = Math.min(n, Pensao.PEDRA_MAX - (this.despensa.pedra || 0));
      if (n <= 0 || !this.aceita(id)) continue;
      mochila.remover(id, n);
      this.despensa[id] = (this.despensa[id] || 0) + n;
      this.veIngrediente(id);
      r[id] = n;
    }
    return r;
  }
  // Recusados pela fase (para o aviso).
  recusados(mochila) { return Object.keys(Pratos.INGREDIENTES).filter(id => mochila.total(id) > 0 && !this.aceita(id)); }
  _tem(id) {
    if (id === 'peixe') return Pratos.PEIXES.reduce((n, p) => n + (this.aceita(p) ? (this.despensa[p] || 0) : 0), 0);
    return this.despensa[id] || 0;
  }
  rende(prato) {
    const porcao = Pratos.PRATOS[prato].porcao;
    let r = 9999;
    for (const id in porcao) r = Math.min(r, Math.floor(this._tem(id) / porcao[id]));
    return r;
  }
  // O que a próxima panela tira da despensa, sem tirar nada: {tira: {ingrediente: qtd}, rar, principal} (null se não rende). O
  // "peixe" sai do peixe que a pensão aceita, do mais comum para o mais raro; a raridade é a do principal (no peixe, a do último
  // peixe que entrou). O consumir tira por aqui, e o quadro e o caderno mostram o preço por aqui: a mesma conta.
  planoPanela(prato) {
    if (this.rende(prato) <= 0) return null;
    const p = Pratos.PRATOS[prato], tira = {};
    let rar = 1, principal = p.principal;
    for (const id in p.porcao) {
      let q = p.porcao[id];
      if (id === 'peixe') {
        for (const peixe of Pratos.PEIXES) {
          const n = Math.min(q, this.aceita(peixe) ? (this.despensa[peixe] || 0) : 0);
          if (n <= 0) continue;
          tira[peixe] = (tira[peixe] || 0) + n; q -= n;
          if (p.principal === 'peixe') { rar = Pratos.raridade(peixe); principal = peixe; }
        }
      } else {
        tira[id] = (tira[id] || 0) + q;
        if (p.principal === id) rar = Pratos.raridade(id);
      }
    }
    return { tira, rar, principal };
  }
  // Tira da despensa uma porção. Devolve a raridade do principal (0 se não rende).
  consumir(prato, rng) {
    const plano = this.planoPanela(prato);
    if (!plano) return 0;
    for (const [id, q] of Object.entries(plano.tira)) this.despensa[id] -= q;
    if (prato === 'sopa_pedra' && rng.randf() < Pensao.CHANCE_PEDRA_VOLTA) this.despensa.pedra = (this.despensa.pedra || 0) + 1;
    for (const id of Object.keys(this.despensa)) if (this.despensa[id] <= 0) delete this.despensa[id];
    return plano.rar;
  }
  // (15/10, a clareza) O preço que a panela vai cobrar, para o quadro e o caderno: com a panela no fogo, a raridade dela (a do
  // servirPorcao); sem panela, a da próxima, com o que a despensa tem agora (planoPanela). Quando o preço depende do ingrediente
  // (o "peixe" do peixe frito e do pirão) e a despensa não tem nenhum, a faixa: de o peixe mais comum ao mais raro que a pensão aceita.
  // {preco, rar, principal, noFogo, faixa: [min, max] ou null, varia}
  precoDaPanela(prato) {
    const P = Pratos.PRATOS[prato], varia = P.principal === 'peixe', noFogo = this.porcoes(prato) > 0;
    const plano = noFogo ? null : this.planoPanela(prato);
    const rar = noFogo ? (this.panelaRar[prato] || 1) : plano ? plano.rar : varia ? 0 : Pratos.raridade(P.principal);
    if (rar) return { preco: this.preco(prato, rar), rar, principal: plano ? plano.principal : P.principal, noFogo, faixa: null, varia };
    const rars = Pratos.PEIXES.filter(id => this.aceita(id)).map(id => Pratos.raridade(id)), min = Math.min(1, ...rars), max = Math.max(1, ...rars);
    return { preco: this.preco(prato, min), rar: min, principal: 'peixe', noFogo, faixa: min < max ? [this.preco(prato, min), this.preco(prato, max)] : null, varia };
  }
  // O preço em texto: "Cr$ 11", "Cr$ 11 (com sardinha ★ da despensa)", "Cr$ 11 (peixe ★ da panela)" ou "Cr$ 11 a 14 conforme o peixe".
  textoPreco(prato) {
    const d = this.precoDaPanela(prato);
    if (!d.varia) return `Cr$ ${d.preco}`;
    if (d.faixa) return `Cr$ ${d.faixa[0]} a ${d.faixa[1]} conforme o peixe`;
    if (d.noFogo) return `Cr$ ${d.preco} (peixe ${'★'.repeat(d.rar)} da panela)`;
    if (d.principal === 'peixe') return `Cr$ ${d.preco}`;
    const nome = typeof Itens !== 'undefined' && Itens.nome ? Itens.nome(d.principal) : d.principal;
    return `Cr$ ${d.preco} (com ${nome.toLowerCase()} ${'★'.repeat(d.rar)} da despensa)`;
  }
  preco(prato, raridade) { return Math.round(Pratos.PRATOS[prato].preco * ECO.pratos.fator * Pratos.RARIDADE_PRECO[clamp(raridade, 1, 4)] * (1 + ECO.precoPorNivel * (this.nivel(prato) - 1)) * (typeof temperoDaRoca === 'function' ? temperoDaRoca(prato) : 1)); }

  // ---------------- a panela da noite: a Rosa prepara as porções antes (ou na hora, se faltar)
  porcoesPorPanela(prato) {
    const b = ECO.porcoes[prato] || ECO.porcoesPadrao, pr = Pratos.PRATOS[prato], peixe = pr && (pr.principal === 'peixe' || Pratos.PEIXES.includes(pr.principal));
    return b + Math.floor(b * ECO.porcoesNivel10 * (this.nivel(prato) - 1) / 9) + (peixe && (this.premios || []).includes('freezer') ? 2 : 0);
  }
  porcoes(prato) { return this.panela[prato] || 0; }
  // Prepara n panelas do prato com o que a despensa tem. Devolve {feitas, faltou: [ingredientes]}.
  prepararPanela(prato, n, rng) {
    let feitas = 0;
    for (let k = 0; k < n; k++) {
      if (this.rende(prato) <= 0) break;
      const rar = this.consumir(prato, rng);
      this.panelaRar[prato] = Math.max(this.panelaRar[prato] || 1, rar);
      this.panela[prato] = this.porcoes(prato) + this.porcoesPorPanela(prato);
      feitas++;
    }
    const faltou = feitas < n ? Object.keys(Pratos.PRATOS[prato].porcao).filter(id => this._tem(id) < Pratos.PRATOS[prato].porcao[id]) : [];
    return { feitas, faltou };
  }
  // Tira uma porção (para o pedido). Devolve a raridade da panela.
  servirPorcao(prato) { if (this.porcoes(prato) <= 0) return 0; this.panela[prato]--; if (!this.panela[prato]) delete this.panela[prato]; return this.panelaRar[prato] || 1; }

  // ---------------- o cardápio da noite (o do Bancho, 13/10): o jogador escolhe, antes de abrir, quantas panelas de cada prato e
  // se a Rosa repõe sozinha quando acabar ({ prato: { panelas, repoe } }); os ingredientes saem da despensa na hora.
  static CASA = 'casa';   // o prato da casa (o Norimaki do Dave): ECO.pensao.pratoCasa
  // Os dados de um prato para a tela e a janta (o prato da casa não é receita do caderno: não entra em Pratos.PRATOS).
  static prato(id) {
    if (id !== Pensao.CASA) return Pratos.PRATOS[id];
    const c = ECO.pensao.pratoCasa;
    return { nome: c.nome, preco: c.preco, fase: 1, principal: 'arroz', porcao: {}, montar: ['arroz', 'feijao'], reacao: 'coracao', icone: 'itens/prato_pf_peao',
      desc: 'Sempre tem: o arroz com feijão da panela da família. Barato, sem ingrediente da despensa.' };
  }
  // Monta o cardápio da noite: guarda a escolha (o quadro abre com ela amanhã) e prepara as panelas pedidas, na ordem, só das
  // receitas do caderno e até as vagas do degrau. A vaga é de quem está na panela (o que já tinha e o que saiu agora): o prato
  // sem ingrediente nenhum não ocupa vaga. Devolve { feitas: {prato: n > 0}, faltou: [pratos que não saíram inteiros],
  // ingredientes: {prato: [faltaram]}, semVaga: [pratos que não couberam] }.
  montarNoite(cardapio, rng) {
    this.cardapioNoite = JSON.parse(JSON.stringify(cardapio || {}));
    const r = { feitas: {}, faltou: [], ingredientes: {}, semVaga: [] }, ocupa = new Set(this.pratosDaNoite());
    for (const id of Object.keys(this.cardapioNoite)) {
      const n = this.cardapioNoite[id].panelas | 0;
      if (n <= 0 || !this.receitas.includes(id)) continue;
      if (!ocupa.has(id) && ocupa.size >= this.vagas()) { r.semVaga.push(id); continue; }
      const f = this.prepararPanela(id, n, rng);
      if (f.feitas) { r.feitas[id] = f.feitas; ocupa.add(id); }
      if (f.feitas < n) { r.faltou.push(id); r.ingredientes[id] = f.faltou; }
    }
    return r;
  }
  // Os pratos que o cliente pode pedir agora: os que têm porção na panela.
  pratosDaNoite() { return Object.keys(this.panela).filter(id => this.porcoes(id) > 0); }
  // O prato acabou na janta: com "repõe" ligado e ingrediente, a Rosa faz outra panela. Devolve 'repos', 'faltou' (repõe
  // ligado sem ingrediente) ou 'saiu' (repõe desligado); '' se ainda tem porção.
  reporSeAcabou(prato, rng) {
    if (this.porcoes(prato) > 0) return '';
    if (!(this.cardapioNoite[prato] || {}).repoe) return 'saiu';
    return this.prepararPanela(prato, 1, rng).feitas ? 'repos' : 'faltou';
  }
  // No fim da noite a sobra vai para o lixo (como no Dave). Devolve { prato: porções }.
  jogarSobra() {
    const sobra = {};
    for (const id in this.panela) if (this.panela[id] > 0) sobra[id] = this.panela[id];
    this.panela = {}; this.panelaRar = {};
    return sobra;
  }

  // ---------------- o caderno da Rosa: nível do prato, pitadas de tempero, receitas a descobrir
  nivel(prato) { return this.niveis[prato] || 1; }
  sabor(prato) { return this.nivel(prato) * Pensao.SABOR_POR_NIVEL; }
  // Caprichar (o Enhance do Bancho): gasta TODOS os ingredientes da receita, cada um floor((qtd+1)·1,5^(nível−1)).
  custoCaprichar(prato) {
    const n = this.nivel(prato);
    if (n >= Pensao.NIVEL_MAX) return {};
    const c = {}, por = Pratos.PRATOS[prato].porcao;
    for (const id in por) c[id] = Math.floor((por[id] + 1) * Math.pow(ECO.pensao.caprichoCresce, n - 1));
    return c;
  }
  // O nível mais alto que a Rosa já sabe caprichar: cresce com as estrelas da pensão.
  tetoCapricho() { return Math.min(Pensao.NIVEL_MAX, ECO.pensao.capricho.base + ECO.pensao.capricho.porEstrela * this.estrelasCasa()); }
  // Sobe o nível do prato: 'ok', 'falta', 'teto' (precisa de mais estrelas) ou 'max'.
  caprichar(prato) {
    const n = this.nivel(prato);
    if (n >= Pensao.NIVEL_MAX) return 'max';
    if (n >= this.tetoCapricho()) return 'teto';
    const c = this.custoCaprichar(prato);
    for (const id in c) if (this._tem(id) < c[id]) return 'falta';
    for (const id in c) {
      let q = c[id];
      if (id === 'peixe') { for (const px of Pratos.PEIXES) while (q > 0 && this.aceita(px) && (this.despensa[px] || 0) > 0) { this.despensa[px]--; q--; } }
      else this.despensa[id] -= q;
    }
    for (const id of Object.keys(this.despensa)) if (this.despensa[id] <= 0) delete this.despensa[id];
    this.niveis[prato] = n + 1;
    return 'ok';
  }
  // O ingrediente passou pela mão do Jocelino: a receita que usa ele fica disponível para pesquisar.
  veIngrediente(id) { if (Pratos.INGREDIENTES[id] && !this.vistos.includes(id)) this.vistos.push(id); }
  _visto(princ) { return princ === 'peixe' ? Pratos.PEIXES.some(px => this.vistos.includes(px)) : this.vistos.includes(princ); }
  // As receitas que ainda não estão no caderno: {id, principal, caminho, conhecida (dá para pesquisar agora), custo}.
  // Só as do caminho 'ingrediente' se pesquisam; as outras chegam pelo degrau, pela Rosa, pelo ajudante, pelo VIP, pela
  // festa ou pelo Viajante (o caderno mostra como).
  receitasADescobrir() {
    return Object.keys(typeof RECEITAS_NOVAS !== 'undefined' ? RECEITAS_NOVAS : {}).filter(id => !this.receitas.includes(id))
      .map(id => { const r = Pratos.PRATOS[id], cam = r.caminho || 'ingrediente';
        return { id, principal: r.principal, caminho: cam, conhecida: cam === 'ingrediente' && this._visto(r.principal), custo: r.pitadas }; });
  }
  // As que dá para pesquisar agora (ingrediente já visto).
  receitasLiberadas() { return this.receitasADescobrir().filter(r => r.conhecida).map(r => r.id); }
  // Põe a receita no caderno (VIP, festa, Viajante, degrau): true se era nova.
  liberarReceita(id) { if (!Pratos.PRATOS[id] || this.receitas.includes(id)) return false; this.receitas.push(id); return true; }
  // As receitas do degrau atual e dos de baixo que ainda faltam: entram no caderno. Devolve as novas.
  liberarDoDegrau() {
    const g = this.grau();
    return Object.keys(typeof RECEITAS_NOVAS !== 'undefined' ? RECEITAS_NOVAS : {})
      .filter(id => RECEITAS_NOVAS[id].caminho === 'degrau' && RECEITAS_NOVAS[id].grau <= g && this.liberarReceita(id));
  }
  // O texto de como a receita entra no caderno (o caderno mostra no lugar do botão).
  comoLiberar(id) {
    const r = Pratos.PRATOS[id];
    if (!r) return 'Receita desconhecida.';
    if (this.receitas.includes(id)) return 'Já está no caderno da Rosa.';
    const ing = n => (n === 'peixe' ? 'um peixe' : Itens.nome(n).toLowerCase());
    switch (r.caminho || 'ingrediente') {
      case 'degrau': return `A Rosa aprende quando a Pensão chegar em "${this.nomeGrau(r.grau)}" (degrau ${r.grau}).`;
      case 'chef': return 'A Rosa inventa sozinha quando subir de nível como chef (nos níveis 3, 6 e 9).';
      case 'ajudante': return 'Um ajudante de cozinha ensina quando chegar ao nível 5 ou 10 de treino.';
      case 'vip': { const v = typeof vipDe === 'function' && vipDe(r.vip); return `Chega pela carta de ${v ? v.nome : 'um cliente especial'}, 3 dias antes de ele jantar na pensão (quando a pensão já aceitar os ingredientes).`; }
      case 'festa': { const f = typeof FESTAS !== 'undefined' && FESTAS.find(x => x.ensina === id); return `A Rosa aprende na festa "${f ? f.nome : 'da Vila'}", servindo o prato da festa.`; }
      case 'viajante': return `O Viajante da Capital vende por Cr$ ${typeof Viajante !== 'undefined' ? Viajante.RECEITAS[id] : '?'}, às quintas na Vila (a partir do degrau ${typeof Viajante !== 'undefined' ? Viajante.GRAU : 3}).`;
      default: return this._visto(r.principal) ? `Pesquise com a Rosa: ${r.pitadas} pitadas de tempero.` : `Traga ${ing(r.principal)} para a Rosa ver (${typeof origemDe === 'function' ? origemDe(r.principal) : ''}).`;
    }
  }
  // Pesquisa uma receita: 'ok', 'falta_ingrediente' ou 'sem_pitadas'.
  pesquisar(id) {
    const r = this.receitasADescobrir().find(x => x.id === id);
    if (!r) return 'ja_tem';
    if (r.caminho !== 'ingrediente') return 'outro_caminho';
    if (!r.conhecida) return 'falta_ingrediente';
    if (this.pitadas < r.custo) return 'sem_pitadas';
    this.pitadas -= r.custo; this.receitas.push(id);
    return 'ok';
  }
  // Estrelas (1 a 5): base 1, +1 atendido rápido, +1 prato certo, +1 bebida, +1 sabor ou salada.
  static estrelas(rapido, certo, sabor, bebida, saladaExtra) {
    let e = 1 + (rapido ? 1 : 0) + (certo ? 1 : 0) + (bebida ? 1 : 0) + ((sabor > 0 || saladaExtra) ? 1 : 0);
    return clamp(e, 1, 5);
  }
  static gorjeta(preco, estrelas) { return Math.round(preco * ECO.pensao.gorjeta * (estrelas - 1) / 4); }
  // Soma as estrelas da noite na fama. Devolve o grau novo (0 se não subiu).
  registrarNoite(estrelas, dia, curtidas = 0) {
    const antes = this.grau();
    this.fama += Math.max(0, estrelas);
    this.curtidas += Math.max(0, curtidas);
    this.ultimaJanta = dia;
    if (estrelas > 0) this.pitadas += Math.max(1, Math.floor(estrelas / ECO.pensao.estrelasPorPitada));   // as estrelas viram pitadas de tempero (a "Artisan's Flame")
    this.grauMinimo = Math.max(this.grauMinimo || 1, this.grau());             // a pensão nunca desce de degrau
    return this.grau() > antes ? this.grau() : 0;
  }
  // Pratos da noite: os marcados no quadro de giz que rendem; se nenhum rende, o que a despensa rende. (Só o salão antigo; o balcão usa
  // o cardápio montado: montarNoite e pratosDaNoite.)
  cardapioDaNoite() {
    let r = this._queRendem(this.cardapio.length ? this.cardapio : this.receitas);
    if (!r.length && this.cardapio.length) r = this._queRendem(this.receitas);
    return r;
  }
  _queRendem(base) {
    const r = [];
    for (const id of base) if (this.receitas.includes(id) && this.rende(id) > 0 && r.length < this.vagas()) r.push(id);
    return r;
  }

  // ---------------- reforma (roteiro de 13/10: 5 etapas, cada uma com material entregue à Rosa e dias de trabalho no salão)
  _etapa() { return ECO.reforma.find(e => e.id === this.estado) || null; }
  _proxima() { const k = ECO.reforma.findIndex(e => e.id === this.estado); const n = ECO.reforma[k + 1]; this.reforma = { entregue: {}, dias: 0, hoje: (this.reforma || {}).hoje || 0 }; this._golpes = 0; if (n) this.estado = n.id; else { this.estado = 'pronta'; this.abreDia = this._diaPronta + 1; } }
  abrirReforma() { if (this.estado === 'fechada') { this.estado = 'limpar'; this.reforma = { entregue: {}, dias: 0, hoje: 0 }; } }
  limpou() { if (this.estado === 'limpar') this._proxima(); }
  faltaMaterial() {
    const E = this._etapa(); if (!E) return {};
    const r = {}; for (const it in E.material) { const f = E.material[it] - ((this.reforma.entregue || {})[it] || 0); if (f > 0) r[it] = f; }
    return r;
  }
  // A etapa que acabou hoje passa a vez para amanhã: a atual ainda não começou e hoje já teve trabalho na reforma.
  comecaAmanha(dia) { return !!this._etapa() && this.reforma.hoje === dia && !this.reforma.dias; }
  // (revisão final) Hoje a reforma já deu o que tinha: o material todo entregue e o dia de trabalho feito (nesta etapa ou na que
  // acabou hoje). O guia cede (sem seta nem Agora para a pensão) e a Rosa diz "amanhã tem mais".
  feitaHoje(dia) { const E = this._etapa(); return !!E && E.id !== 'limpar' && this.reforma.hoje === dia && !Object.keys(this.faltaMaterial()).length; }
  // Entrega à Rosa o que a mochila tem para a etapa atual (uma etapa por vez). Devolve o texto do que aconteceu ('' se nada).
  entregar(mochila) {
    const E = this._etapa(); if (!E || E.id === 'limpar') return '';
    const partes = [];
    for (const [it, f] of Object.entries(this.faltaMaterial())) { const n = Math.min(mochila.total(it), f); if (!n) continue; mochila.remover(it, n); this.reforma.entregue[it] = (this.reforma.entregue[it] || 0) + n; partes.push(`${Itens.qtd(n, it)}`); }
    const falta = this.faltaMaterial();
    return partes.length ? `${E.nome}: entregou ${partes.join(', ')}.${Object.keys(falta).length ? ' Falta: ' + Object.entries(falta).map(([i, q]) => Itens.qtd(q, i)).join(', ') + '.' : ` Material completo: agora ${E.dias} dia(s) de trabalho no salão.`}` : '';
  }
  // Um dia de trabalho na etapa (o clique no lugar dela, no salão): só com o material todo, uma vez por dia. O dia vale para a
  // reforma inteira: a etapa que acabou hoje passa a vez para amanhã (o `hoje` segue para a etapa seguinte).
  trabalharReforma(dia) {
    const E = this._etapa(); if (!E || E.id === 'limpar') return 'etapa_feita';
    if (this.reforma.hoje === dia) return 'ja_hoje';
    if (Object.keys(this.faltaMaterial()).length) return 'falta_material';
    this.reforma.hoje = dia; this.reforma.dias++;
    if (this.reforma.dias >= E.dias) { this._diaPronta = dia; this._proxima(); }
    return 'ok';
  }
  // De manhã: a pensão pronta abre no dia marcado, com o presente da Rosa na despensa.
  manha(dia) {
    this._golpes = 0;   // os golpes do dia na reforma (3 = um dia de trabalho) recomeçam toda manhã
    if (this.estado === 'pronta' && dia >= this.abreDia) {
      this.estado = 'aberta';
      for (const id in Pensao.DESPENSA_INICIAL) this.despensa[id] = (this.despensa[id] || 0) + Pensao.DESPENSA_INICIAL[id];
    }
  }
  // A marmita do Jocelino (o cardápio do Bancho, 13/10): de manhã a Rosa completa a mesa de casa até ECO.pensao.marmita.porDia,
  // gastando ECO.pensao.marmita.gasta da despensa (o gasto da fornada da manhã, não por marmita). Só com a pensão aberta: antes,
  // a despensa não existe (a reforma não guarda nada). naMesa: as que sobraram de ontem. Devolve { feitas, falta: [ingredientes] }.
  fazerMarmitas(naMesa = 0) {
    const M = ECO.pensao.marmita, quer = Math.max(0, M.porDia - naMesa);
    if (this.estado !== 'aberta' || !quer) return { feitas: 0, falta: [] };
    const falta = Object.keys(M.gasta).filter(id => this._tem(id) < M.gasta[id]);
    if (falta.length) return { feitas: 0, falta };
    for (const id in M.gasta) { this.despensa[id] -= M.gasta[id]; if (this.despensa[id] <= 0) delete this.despensa[id]; }
    return { feitas: quer, falta: [] };
  }
  paraDict() {
    return { estado: this.estado, abreDia: this.abreDia, reforma: JSON.parse(JSON.stringify(this.reforma || null)), golpes: this._golpes || 0, limpos: (this.limpos || []).slice(), mesas: this.mesas, fama: this.fama,
      despensa: Object.assign({}, this.despensa), cardapio: this.cardapio.slice(), cardapioNoite: JSON.parse(JSON.stringify(this.cardapioNoite || {})), receitas: this.receitas.slice(), ultimaJanta: this.ultimaJanta,
      niveis: Object.assign({}, this.niveis), pitadas: this.pitadas, vistos: this.vistos.slice(), curtidas: this.curtidas, grauMinimo: this.grauMinimo || 1,
      equipe: JSON.parse(JSON.stringify(this.equipe)), candidatos: JSON.parse(JSON.stringify(this.candidatos)), anuncio: this.anuncio, melhorias: this.melhorias.slice(), agenda: JSON.parse(JSON.stringify(this.agenda || [])), metas: JSON.parse(JSON.stringify(this.metas || [])), panela: Object.assign({}, this.panela), panelaRar: Object.assign({}, this.panelaRar), chef: Object.assign({}, this.chef),
      premios: this.premios.slice(), garfos: this.garfos, paladarNotas: JSON.parse(JSON.stringify(this.paladarNotas)), concursos: Object.assign({}, this.concursos), estrelasPremiadas: this.estrelasPremiadas ?? null, festaDia: this.festaDia || 0,
      ampliacoes: this.ampliacoes.slice(), obra: this.obra ? Object.assign({}, this.obra) : null, nivelMelhoria: Object.assign({}, this.nivelMelhoria), servidos: Object.assign({}, this.servidos || {}),
      historico: (this.historico || []).map(h => Object.assign({}, h)) };
  }
  deDict(d) {
    d = d || {};
    this.estado = d.estado || 'fechada'; this.abreDia = d.abreDia ?? -1; this.limpos = (d.limpos || []).slice();
    this.reforma = JSON.parse(JSON.stringify(d.reforma || { entregue: {}, dias: 0, hoje: 0 })); this.reforma.entregue = this.reforma.entregue || {}; this._golpes = d.golpes | 0;
    // Save de antes das 5 etapas: as telhas viram o telhado e a madeira das banquetas vira o balcão, com o que já foi entregue.
    if (this.estado === 'telhas') { this.estado = 'telhado'; this.reforma.entregue.telha = d.telhas | 0; }
    if (this.estado === 'mesas') { this.estado = 'balcao'; this.reforma.entregue.madeira = d.madeira | 0; }
    this.mesas = d.mesas || 2; this.fama = d.fama | 0; this.despensa = Object.assign({}, d.despensa || {});
    this.cardapio = (d.cardapio || []).slice(); this.receitas = (d.receitas || Pensao.RECEITAS_INICIAIS).slice(); this.ultimaJanta = d.ultimaJanta ?? -1;
    this.niveis = Object.assign({}, d.niveis || {}); this.pitadas = d.pitadas | 0; this.vistos = (d.vistos || Object.keys(this.despensa)).slice();
    this.curtidas = d.curtidas != null ? d.curtidas | 0 : Math.floor(this.fama / 4);   // save velho: as estrelas viram curtidas
    // Save de antes dos 6 degraus: o grau que a fama antiga dava não se perde (0, 40, 120, 300, 600 pontos).
    this.grauMinimo = d.grauMinimo || (d.curtidas == null ? [0, 40, 120, 300, 600].filter(x => this.fama >= x).length : 1);
    this.equipe = JSON.parse(JSON.stringify(d.equipe || [])); this.candidatos = JSON.parse(JSON.stringify(d.candidatos || [])); this.anuncio = d.anuncio || ''; this.melhorias = (d.melhorias || []).slice(); this.agenda = JSON.parse(JSON.stringify(d.agenda || [])); this.metas = JSON.parse(JSON.stringify(d.metas || [])); this.panela = Object.assign({}, d.panela || {}); this.panelaRar = Object.assign({}, d.panelaRar || {}); this.chef = Object.assign({ nivel: 1, xp: 0 }, d.chef || {});
    this.premios = (d.premios || []).slice(); this.garfos = d.garfos || 0; this.paladarNotas = JSON.parse(JSON.stringify(d.paladarNotas || [])); this.concursos = Object.assign({}, d.concursos || {});
    if (!this.paladarNotas.length && this.garfos > 0) this.paladarNotas.push({ dia: 0, nota: this.garfos });   // save antigo: a nota guardada vira a 1ª visita
    this.estrelasPremiadas = d.estrelasPremiadas ?? null; this.festaDia = d.festaDia || 0;
    this.ampliacoes = (d.ampliacoes || []).slice(); this.obra = d.obra ? Object.assign({}, d.obra) : null; this.nivelMelhoria = Object.assign({}, d.nivelMelhoria || {});
    // (Tarefa D1) Save de antes do "melhor sabor servido": os pratos do caderno contam como servidos no nível de hoje (ninguém perde
    // o que já tinha; daqui para a frente só o servido sobe).
    if (d.servidos == null) { this.servidos = {}; for (const id of this.receitas) if (Pratos.PRATOS[id]) this.servidos[id] = this.nivel(id); }
    else this.servidos = Object.assign({}, d.servidos);
    // (15/10) Save de antes do gráfico do fechamento: o caderno das noites começa vazio (a 1ª noite daqui para a frente abre o gráfico).
    this.historico = Array.isArray(d.historico) ? d.historico.filter(h => h && Number.isFinite(h.dia)).map(h => Object.assign({}, h)) : [];
    // Save de antes dos garfos do Doutor Paladar: o degrau que já tinha não cai (os garfos só valem daqui para a frente).
    // Save de antes do cardápio do Bancho (13/10): o quadro de giz antigo vira o cardápio da noite (uma panela, a Rosa repõe) e a
    // panela começa vazia (a sobra de ontem já foi para o lixo).
    if (d.cardapioNoite == null) { this.cardapioNoite = {}; for (const id of this.cardapio) this.cardapioNoite[id] = { panelas: 1, repoe: true }; this.panela = {}; this.panelaRar = {}; }
    else this.cardapioNoite = JSON.parse(JSON.stringify(d.cardapioNoite));
    if (d.garfos == null) { this._semPaladar = true; const g = this.grau(); this._semPaladar = false; this.grauMinimo = Math.max(this.grauMinimo || 1, g); }
    // (14/10, Tarefa B) A equipe do save antigo ganha a ficha completa: a vocação, as 2 habilidades fixas (começando pelas que já
    // ganhou: ninguém perde habilidade), o Mestre; quem estava em Compras continua trazendo, no "sorteio" até o jogador escolher.
    if (typeof Equipe !== 'undefined') { this.equipe.forEach(e => Equipe.normalizar(e)); this.candidatos.forEach(c => Equipe.normalizar(c)); }
  }
}
