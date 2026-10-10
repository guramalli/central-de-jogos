// Jocelino — pensao.js — tradução de jogo/nucleo/pensao.gd.
// Pensão da Rosa (o sushi bar do Bancho, em PF de peão): reforma da casa da Dona Cotinha, despensa de ingredientes
// (raridade e fase), fama em 5 graus (o Cooksta, sem despesa fixa), cardápio da noite, preço, estrelas e gorjeta.
// Regras puras; a janta passo a passo fica em turno_janta.js.

class Pensao {
  // A fama em 6 degraus (os ranks do Cooksta no Dave): cada um pede curtidas (clientes que deram 4 estrelas ou mais),
  // melhor sabor (o prato mais caprichado) e receitas pesquisadas; libera vagas no cardápio, banquetas e clientes, e
  // cobra uma despesa por noite (gás, gelo, luz).
  static DEGRAUS = [
    { nome: 'Marmita de Esquina', curtidas: 0, sabor: 0, pesquisadas: 0, vagas: 2, mesas: 2, clientes: 6, despesa: 0 },
    { nome: 'Boteco Conhecido', curtidas: 10, sabor: 0, pesquisadas: 0, vagas: 3, mesas: 3, clientes: 8, despesa: 5 },
    { nome: 'Pensão Falada', curtidas: 30, sabor: 0, pesquisadas: 2, vagas: 4, mesas: 4, clientes: 10, despesa: 12 },
    { nome: 'Pensão Famosa', curtidas: 80, sabor: 36, pesquisadas: 3, vagas: 5, mesas: 5, clientes: 12, despesa: 25 },
    { nome: 'Casa Tradicional', curtidas: 160, sabor: 60, pesquisadas: 5, vagas: 6, mesas: 6, clientes: 14, despesa: 45 },
    { nome: 'Patrimônio da Vila', curtidas: 300, sabor: 96, pesquisadas: 7, vagas: 7, mesas: 6, clientes: 16, despesa: 70 },
  ];
  static GRAUS = Pensao.DEGRAUS;
  static TELHAS = 10;
  static MADEIRA = 20;
  static DESPENSA_INICIAL = { arroz: 5, feijao: 5, ovo: 5 };
  static CHANCE_PEDRA_VOLTA = 0.5;
  // A pedra também é material de obra: a despensa guarda só a da sopa (o resto fica na mochila).
  static PEDRA_MAX = 2;
  static RECEITAS_INICIAIS = ['pf_peao', 'peixe_frito', 'sopa_pedra', 'cocada_tijolinho'];
  // Caprichar (o Enhance do Bancho): cópias do ingrediente principal para subir do nível n para n+1 (1 → 10).
  static CUSTO_CAPRICHAR = [3, 3, 4, 4, 5, 5, 6, 6, 7];
  static NIVEL_MAX = 10;
  static PRECO_POR_NIVEL = 0.15;     // +15% do preço base a cada nível
  static SABOR_POR_NIVEL = 12;

  constructor() {
    this.estado = 'fechada';   // fechada, limpar, telhas, mesas, pronta, aberta
    this.abreDia = -1; this.telhas = 0; this.madeira = 0; this.mesas = 2; this.fama = 0;
    this.despensa = {}; this.cardapio = []; this.receitas = Pensao.RECEITAS_INICIAIS.slice(); this.ultimaJanta = -1;
    this.niveis = {}; this.pitadas = 0; this.vistos = []; this.curtidas = 0;
    this.equipe = []; this.candidatos = []; this.anuncio = ''; this.melhorias = []; this.agenda = [];
  }
  melhorSabor() { return Math.max(0, ...this.receitas.map(id => this.sabor(id))); }
  pesquisadas() { return this.receitas.filter(id => !Pensao.RECEITAS_INICIAIS.includes(id)).length; }
  _cumpre(d) { return this.curtidas >= d.curtidas && this.melhorSabor() >= d.sabor && this.pesquisadas() >= d.pesquisadas; }
  grau() { let g = 1; for (let i = 1; i < Pensao.DEGRAUS.length && this._cumpre(Pensao.DEGRAUS[i]); i++) g = i + 1; return Math.max(g, this.grauMinimo || 1); }
  degrau(g = this.grau()) { return Pensao.DEGRAUS[clamp(g, 1, Pensao.DEGRAUS.length) - 1]; }
  nomeGrau(g) { return this.degrau(g).nome; }
  vagas() { return this.degrau().vagas; }
  mesasDaNoite() { return Math.max(this.mesas, this.degrau().mesas) + (this.melhorias || []).filter(id => id === 'banqueta_extra').length; }
  clientesDaNoite() { return this.degrau().clientes; }
  despesa() { return this.degrau().despesa; }
  // O próximo degrau e o que falta de cada coisa (null no último).
  proximoDegrau() {
    const g = this.grau();
    if (g >= Pensao.DEGRAUS.length) return null;
    const d = Pensao.DEGRAUS[g];
    return { grau: g + 1, nome: d.nome, d, falta: { curtidas: Math.max(0, d.curtidas - this.curtidas), sabor: Math.max(0, d.sabor - this.melhorSabor()), pesquisadas: Math.max(0, d.pesquisadas - this.pesquisadas()) } };
  }
  // Progresso para o próximo degrau (0 a 1), pela média das três exigências.
  progresso() {
    const p = this.proximoDegrau(); if (!p) return 1;
    const a = this.degrau(), d = p.d, f = (v, x0, x1) => x1 <= x0 ? 1 : clamp((v - x0) / (x1 - x0), 0, 1);
    return (f(this.curtidas, a.curtidas, d.curtidas) + f(this.melhorSabor(), a.sabor, d.sabor) + f(this.pesquisadas(), a.pesquisadas, d.pesquisadas)) / 3;
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
  preco(prato, raridade) { return Math.round(Pratos.PRATOS[prato].preco * Pratos.RARIDADE_PRECO[clamp(raridade, 1, 4)] * (1 + Pensao.PRECO_POR_NIVEL * (this.nivel(prato) - 1))); }

  // ---------------- o caderno da Rosa: nível do prato, pitadas de tempero, receitas a descobrir
  nivel(prato) { return this.niveis[prato] || 1; }
  sabor(prato) { return this.nivel(prato) * Pensao.SABOR_POR_NIVEL; }
  custoCaprichar(prato) { const n = this.nivel(prato); return n >= Pensao.NIVEL_MAX ? 0 : Pensao.CUSTO_CAPRICHAR[n - 1]; }
  // Sobe o nível do prato gastando cópias do ingrediente principal: 'ok', 'falta' ou 'max'.
  caprichar(prato) {
    const n = this.nivel(prato);
    if (n >= Pensao.NIVEL_MAX) return 'max';
    const princ = Pratos.PRATOS[prato].principal, c = this.custoCaprichar(prato);
    if (this._tem(princ) < c) return 'falta';
    if (princ === 'peixe') { let q = c; for (const px of Pratos.PEIXES) while (q > 0 && this.aceita(px) && (this.despensa[px] || 0) > 0) { this.despensa[px]--; q--; } }
    else this.despensa[princ] -= c;
    for (const id of Object.keys(this.despensa)) if (this.despensa[id] <= 0) delete this.despensa[id];
    this.niveis[prato] = n + 1;
    return 'ok';
  }
  // O ingrediente passou pela mão do Jocelino: a receita que usa ele fica disponível para pesquisar.
  veIngrediente(id) { if (Pratos.INGREDIENTES[id] && !this.vistos.includes(id)) this.vistos.push(id); }
  _visto(princ) { return princ === 'peixe' ? Pratos.PEIXES.some(px => this.vistos.includes(px)) : this.vistos.includes(princ); }
  // As receitas que ainda não estão no caderno: {id, principal, conhecida (já viu o ingrediente), custo}.
  receitasADescobrir() {
    return Object.keys(typeof RECEITAS_NOVAS !== 'undefined' ? RECEITAS_NOVAS : {}).filter(id => !this.receitas.includes(id))
      .map(id => ({ id, principal: Pratos.PRATOS[id].principal, conhecida: this._visto(Pratos.PRATOS[id].principal), custo: Pratos.PRATOS[id].pitadas }));
  }
  // Pesquisa uma receita: 'ok', 'falta_ingrediente' ou 'sem_pitadas'.
  pesquisar(id) {
    const r = this.receitasADescobrir().find(x => x.id === id);
    if (!r) return 'ja_tem';
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
  static gorjeta(preco, estrelas) { return Math.round(preco * 0.3 * (estrelas - 1) / 4); }
  // Soma as estrelas da noite na fama. Devolve o grau novo (0 se não subiu).
  registrarNoite(estrelas, dia, curtidas = 0) {
    const antes = this.grau();
    this.fama += Math.max(0, estrelas);
    this.curtidas += Math.max(0, curtidas);
    this.ultimaJanta = dia;
    if (estrelas > 0) this.pitadas += Math.max(1, Math.floor(estrelas / 4));   // as estrelas viram pitadas de tempero (a "Artisan's Flame")
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
      despensa: Object.assign({}, this.despensa), cardapio: this.cardapio.slice(), receitas: this.receitas.slice(), ultimaJanta: this.ultimaJanta,
      niveis: Object.assign({}, this.niveis), pitadas: this.pitadas, vistos: this.vistos.slice(), curtidas: this.curtidas, grauMinimo: this.grauMinimo || 1,
      equipe: JSON.parse(JSON.stringify(this.equipe)), candidatos: JSON.parse(JSON.stringify(this.candidatos)), anuncio: this.anuncio, melhorias: this.melhorias.slice(), agenda: JSON.parse(JSON.stringify(this.agenda || [])) };
  }
  deDict(d) {
    d = d || {};
    this.estado = d.estado || 'fechada'; this.abreDia = d.abreDia ?? -1; this.telhas = d.telhas | 0; this.madeira = d.madeira | 0;
    this.mesas = d.mesas || 2; this.fama = d.fama | 0; this.despensa = Object.assign({}, d.despensa || {});
    this.cardapio = (d.cardapio || []).slice(); this.receitas = (d.receitas || Pensao.RECEITAS_INICIAIS).slice(); this.ultimaJanta = d.ultimaJanta ?? -1;
    this.niveis = Object.assign({}, d.niveis || {}); this.pitadas = d.pitadas | 0; this.vistos = (d.vistos || Object.keys(this.despensa)).slice();
    this.curtidas = d.curtidas != null ? d.curtidas | 0 : Math.floor(this.fama / 4);   // save velho: as estrelas viram curtidas
    // Save de antes dos 6 degraus: o grau que a fama antiga dava não se perde (0, 40, 120, 300, 600 pontos).
    this.grauMinimo = d.grauMinimo || (d.curtidas == null ? [0, 40, 120, 300, 600].filter(x => this.fama >= x).length : 1);
    this.equipe = JSON.parse(JSON.stringify(d.equipe || [])); this.candidatos = JSON.parse(JSON.stringify(d.candidatos || [])); this.anuncio = d.anuncio || ''; this.melhorias = (d.melhorias || []).slice(); this.agenda = JSON.parse(JSON.stringify(d.agenda || []));
  }
}
