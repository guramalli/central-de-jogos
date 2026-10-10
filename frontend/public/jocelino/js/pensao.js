// Jocelino — pensao.js — tradução de jogo/nucleo/pensao.gd.
// Pensão da Rosa (o sushi bar do Bancho, em PF de peão): reforma da casa da Dona Cotinha, despensa de ingredientes
// (raridade e fase), fama em 5 graus (o Cooksta, sem despesa fixa), cardápio da noite, preço, estrelas e gorjeta.
// Regras puras; a janta passo a passo fica em turno_janta.js.

class Pensao {
  static GRAUS = [
    { nome: 'Marmita de Esquina', pontos: 0, vagas: 2 },
    { nome: 'Parada dos Peões', pontos: 40, vagas: 3 },
    { nome: 'Falada na Vila', pontos: 120, vagas: 4 },
    { nome: 'Famosa em Praia Grande', pontos: 300, vagas: 5 },
    { nome: 'Saiu na Gazeta', pontos: 600, vagas: 6 },
  ];
  static TELHAS = 10;
  static MADEIRA = 20;
  static DESPENSA_INICIAL = { arroz: 5, feijao: 5, ovo: 5 };
  static CHANCE_PEDRA_VOLTA = 0.5;
  // A pedra também é material de obra: a despensa guarda só a da sopa (o resto fica na mochila).
  static PEDRA_MAX = 2;
  static RECEITAS_INICIAIS = ['pf_peao', 'peixe_frito', 'sopa_pedra', 'cocada_tijolinho'];

  constructor() {
    this.estado = 'fechada';   // fechada, limpar, telhas, mesas, pronta, aberta
    this.abreDia = -1; this.telhas = 0; this.madeira = 0; this.mesas = 2; this.fama = 0;
    this.despensa = {}; this.cardapio = []; this.receitas = Pensao.RECEITAS_INICIAIS.slice(); this.ultimaJanta = -1;
  }
  grau() { let g = 1; Pensao.GRAUS.forEach((x, i) => { if (this.fama >= x.pontos) g = i + 1; }); return g; }
  nomeGrau(g) { return Pensao.GRAUS[clamp(g, 1, Pensao.GRAUS.length) - 1].nome; }
  vagas() { return Pensao.GRAUS[this.grau() - 1].vagas; }
  pontosDoGrau(g) { return Pensao.GRAUS[clamp(g, 1, Pensao.GRAUS.length) - 1].pontos; }
  // Pontos que faltam para o próximo grau (0 no último).
  faltaParaSubir() { const g = this.grau(); return g >= Pensao.GRAUS.length ? 0 : Pensao.GRAUS[g].pontos - this.fama; }
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
  // Tira da despensa uma porção. Devolve a raridade do principal (0 se não rende).
  consumir(prato, rng) {
    if (this.rende(prato) <= 0) return 0;
    const p = Pratos.PRATOS[prato];
    let rar = 1;
    for (const id in p.porcao) {
      let q = p.porcao[id];
      if (id === 'peixe') {
        for (const peixe of Pratos.PEIXES) {
          while (q > 0 && this.aceita(peixe) && (this.despensa[peixe] || 0) > 0) {
            this.despensa[peixe]--; q--;
            if (p.principal === 'peixe') rar = Pratos.raridade(peixe);
          }
        }
      } else {
        this.despensa[id] -= q;
        if (p.principal === id) rar = Pratos.raridade(id);
      }
    }
    if (prato === 'sopa_pedra' && rng.randf() < Pensao.CHANCE_PEDRA_VOLTA) this.despensa.pedra = (this.despensa.pedra || 0) + 1;
    for (const id of Object.keys(this.despensa)) if (this.despensa[id] <= 0) delete this.despensa[id];
    return rar;
  }
  preco(prato, raridade) { return Math.round(Pratos.PRATOS[prato].preco * Pratos.RARIDADE_PRECO[clamp(raridade, 1, 4)]); }
  // Estrelas (1 a 5): base 1, +1 atendido rápido, +1 prato certo, +1 bebida, +1 sabor ou salada.
  static estrelas(rapido, certo, sabor, bebida, saladaExtra) {
    let e = 1 + (rapido ? 1 : 0) + (certo ? 1 : 0) + (bebida ? 1 : 0) + ((sabor > 0 || saladaExtra) ? 1 : 0);
    return clamp(e, 1, 5);
  }
  static gorjeta(preco, estrelas) { return Math.round(preco * 0.3 * (estrelas - 1) / 4); }
  // Soma as estrelas da noite na fama. Devolve o grau novo (0 se não subiu).
  registrarNoite(estrelas, dia) {
    const antes = this.grau();
    this.fama += Math.max(0, estrelas);
    this.ultimaJanta = dia;
    return this.grau() > antes ? this.grau() : 0;
  }
  // Pratos da noite: os marcados no quadro de giz que rendem; se nenhum rende, o que a despensa rende.
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

  // ---------------- reforma
  abrirReforma() { if (this.estado === 'fechada') this.estado = 'limpar'; }
  limpou() { if (this.estado === 'limpar') this.estado = 'telhas'; }
  faltaMaterial() {
    if (this.estado === 'telhas') return { telha: Pensao.TELHAS - this.telhas };
    if (this.estado === 'mesas') return { madeira: Pensao.MADEIRA - this.madeira };
    return {};
  }
  // Entrega o que a mochila tem para a etapa da reforma (uma etapa por vez). Devolve o texto do que aconteceu.
  entregar(mochila, dia) {
    if (this.estado === 'telhas') {
      const n = Math.min(mochila.total('telha'), Pensao.TELHAS - this.telhas);
      mochila.remover('telha', n);
      this.telhas += n;
      let txt = `Telhas: ${this.telhas} de ${Pensao.TELHAS}.`;
      if (this.telhas >= Pensao.TELHAS) { this.estado = 'mesas'; txt += ` Telhado consertado! Agora as banquetas: ${Pensao.MADEIRA} madeiras.`; }
      return txt;
    }
    if (this.estado === 'mesas') {
      const m = Math.min(mochila.total('madeira'), Pensao.MADEIRA - this.madeira);
      mochila.remover('madeira', m);
      this.madeira += m;
      let txt = `Madeira das banquetas: ${this.madeira} de ${Pensao.MADEIRA}.`;
      if (this.madeira >= Pensao.MADEIRA) { this.estado = 'pronta'; this.abreDia = dia + 1; txt += ' Banquetas prontas! A pensão abre amanhã.'; }
      return txt;
    }
    return '';
  }
  // De manhã: a pensão pronta abre no dia marcado, com o presente da Rosa na despensa.
  manha(dia) {
    if (this.estado === 'pronta' && dia >= this.abreDia) {
      this.estado = 'aberta';
      for (const id in Pensao.DESPENSA_INICIAL) this.despensa[id] = (this.despensa[id] || 0) + Pensao.DESPENSA_INICIAL[id];
    }
  }
  paraDict() {
    return { estado: this.estado, abreDia: this.abreDia, telhas: this.telhas, madeira: this.madeira, mesas: this.mesas, fama: this.fama,
      despensa: Object.assign({}, this.despensa), cardapio: this.cardapio.slice(), receitas: this.receitas.slice(), ultimaJanta: this.ultimaJanta };
  }
  deDict(d) {
    d = d || {};
    this.estado = d.estado || 'fechada'; this.abreDia = d.abreDia ?? -1; this.telhas = d.telhas | 0; this.madeira = d.madeira | 0;
    this.mesas = d.mesas || 2; this.fama = d.fama | 0; this.despensa = Object.assign({}, d.despensa || {});
    this.cardapio = (d.cardapio || []).slice(); this.receitas = (d.receitas || Pensao.RECEITAS_INICIAIS).slice(); this.ultimaJanta = d.ultimaJanta ?? -1;
  }
}
