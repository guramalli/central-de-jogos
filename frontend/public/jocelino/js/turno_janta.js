// Jocelino — turno_janta.js — tradução de jogo/nucleo/turno_janta.gd.
// Uma janta da Pensão da Rosa (o turno do sushi bar do Dave, sem reflexo): os clientes chegam das 17h às 20h30,
// sentam, esperam anotar, a Rosa prepara (alguns segundos), o Jocelino monta o prato no balcão e leva à banqueta;
// o cliente come, paga (preço + gorjeta pelas estrelas) e deixa a louça. Paciência longa: esgotou, vai embora e
// volta outro dia (sem multa). Tempo em segundos reais (dt); chegadas pelo relógio do jogo (minutos).

class TurnoJanta {
  static PACIENCIA_PEDIDO = 45;
  static PACIENCIA_PRATO = 70;
  static PREPARO = 6;
  static COMENDO = 8;
  static ABRE = 17 * 60;
  static ULTIMA_CHEGADA = 20 * 60 + 30;
  static FECHA = 21 * 60;
  static CAFE = 2;
  static ROSA_MAX = 4;
  static CHEIRO = 0.1;

  static relatorioVazio() { return { clientes: 0, servidos: 0, embora: 0, ganho: 0, gorjeta: 0, estrelas: 0, cafes: 0, faltou: [], pratos: {} }; }

  constructor() { this.pensao = null; this.mesas = []; this.relatorio = TurnoJanta.relatorioVazio(); this.eventos = []; this._fila = []; this._cardapio = []; this._rng = null; }

  iniciar(p, dia, quantos) {
    this.pensao = p;
    const f = mulberry(dia * 31337);
    this._rng = { randf: f, randi: () => Math.floor(f() * 4294967296) };
    this._cardapio = p.cardapioDaNoite();
    this.mesas = [];
    for (let i = 0; i < p.mesas; i++) this.mesas.push(this._mesaLivre());
    this.relatorio = TurnoJanta.relatorioVazio();
    this._fila = [];
    // Sem repetir o mesmo cliente enquanto der (dois Seu Lourival juntos não dá).
    let pool = [];
    for (let k = 0; k < quantos; k++) {
      if (!pool.length) pool = Pratos.CLIENTES.slice();
      const c = pool.splice(this._rng.randi() % pool.length, 1)[0];
      const minuto = TurnoJanta.ABRE + Math.round((TurnoJanta.ULTIMA_CHEGADA - TurnoJanta.ABRE) * k / Math.max(1, quantos));
      this._fila.push({ minuto, cliente: c });
    }
  }
  _mesaLivre() {
    return { estado: 'livre', cliente: {}, prato: '', bebida: '', raridade: 1, espera: 0, preparo: 0, pronto: false, montado: false,
      certo: false, salada: false, bebidaCerta: false, rapido: false, come: 0, vezes: 0, reacao: '' };
  }
  tick(dt, minutos) {
    while (this._fila.length && minutos >= this._fila[0].minuto && minutos < TurnoJanta.FECHA) {
      const i = this.mesas.findIndex(m => m.estado === 'livre');
      if (i < 0) break;
      this._sentar(i, this._fila.shift().cliente);
    }
    this.mesas.forEach((m, i) => {
      if (m.estado === 'pedido' || m.estado === 'prato') {
        m.espera += dt;
        if (m.estado === 'prato' && !m.pronto) {
          m.preparo -= dt;
          if (m.preparo <= 0) { m.pronto = true; this.eventos.push({ tipo: 'pronto', mesa: i, prato: m.prato }); }
        }
        const limite = m.estado === 'pedido' ? TurnoJanta.PACIENCIA_PEDIDO : TurnoJanta.PACIENCIA_PRATO;
        if (m.espera >= limite) {
          this.relatorio.embora++;
          this.eventos.push({ tipo: 'embora', mesa: i, cliente: m.cliente });
          this.mesas[i] = this._mesaLivre();
        }
      } else if (m.estado === 'comendo') {
        m.come -= dt;
        if (m.come <= 0) this._pagar(i);
      }
    });
  }
  _sentar(i, cliente) {
    const m = this._mesaLivre();
    m.estado = 'pedido'; m.cliente = cliente;
    this.mesas[i] = m;
    this.relatorio.clientes++;
    this.eventos.push({ tipo: 'chegou', mesa: i, cliente });
    // Seu Lourival chega cheirando a peixe: a banqueta do lado perde paciência.
    if (cliente.mania === 'cheiro') this.mesas.forEach((o, j) => {
      if (j !== i && (o.estado === 'pedido' || o.estado === 'prato')) { o.espera += TurnoJanta.PACIENCIA_PEDIDO * TurnoJanta.CHEIRO; this.eventos.push({ tipo: 'reacao', mesa: j, reacao: 'nojo' }); }
    });
  }
  // Anota o pedido: escolhe o prato (do cardápio que ainda rende), já tira a porção da despensa e a Rosa começa.
  anotar(i) {
    const m = this.mesas[i];
    if (!m || m.estado !== 'pedido') return false;
    const opcoes = this._cardapio.filter(id => this.pensao.rende(id) > 0);
    if (!opcoes.length) {
      // Sem nada que renda: um cafezinho e a promessa de voltar. Registra o que faltou.
      this.relatorio.cafes++;
      this.relatorio.ganho += TurnoJanta.CAFE;
      const marcados = this.pensao.cardapio.length ? this.pensao.cardapio : this.pensao.receitas;
      for (const id of marcados) if (!this.relatorio.faltou.includes(id)) this.relatorio.faltou.push(id);
      m.estado = 'suja';
      this.eventos.push({ tipo: 'cafe', mesa: i, cliente: m.cliente });
      return true;
    }
    m.prato = opcoes[this._rng.randi() % opcoes.length];
    const bebidas = Object.keys(Pratos.BEBIDAS);
    m.bebida = bebidas[this._rng.randi() % bebidas.length];
    m.raridade = this.pensao.consumir(m.prato, this._rng);
    m.rapido = m.espera < TurnoJanta.PACIENCIA_PEDIDO / 2;
    m.estado = 'prato'; m.espera = 0; m.preparo = TurnoJanta.PREPARO; m.pronto = false; m.montado = false;
    return true;
  }
  // Monta o prato pronto no balcão. A ordem não importa; salada é extra.
  montar(i, componentes, bebida) {
    const m = this.mesas[i];
    if (!m || m.estado !== 'prato' || !m.pronto || m.montado) return false;
    const pede = Pratos.PRATOS[m.prato].montar;
    const semSalada = componentes.filter(c => c !== 'salada');
    m.certo = semSalada.length === pede.length && pede.every(c => semSalada.includes(c));
    m.salada = componentes.includes('salada');
    m.bebidaCerta = !!bebida && bebida === m.bebida;
    m.montado = true;
    return true;
  }
  // Leva o prato montado à banqueta dele.
  servir(i) {
    const m = this.mesas[i];
    if (!m || m.estado !== 'prato' || !m.montado) return false;
    m.estado = 'comendo'; m.come = TurnoJanta.COMENDO;
    if (m.espera > TurnoJanta.PACIENCIA_PRATO / 2) m.rapido = false;
    m.reacao = m.certo ? Pratos.PRATOS[m.prato].reacao : 'nojo';
    this.eventos.push({ tipo: 'reacao', mesa: i, reacao: m.reacao });
    return true;
  }
  _pagar(i) {
    const m = this.mesas[i];
    const gostaSalada = m.cliente.mania === 'feijao' && m.salada;
    const sabor = Pratos.RARIDADE_SABOR[clamp(m.raridade, 1, 4)];
    const est = Pensao.estrelas(m.rapido, m.certo, sabor, m.bebidaCerta, gostaSalada);
    const preco = this.pensao.preco(m.prato, m.raridade);
    const gorj = Pensao.gorjeta(preco, est);
    const r = this.relatorio;
    r.servidos++; r.ganho += preco; r.gorjeta += gorj; r.estrelas += est;
    r.pratos[m.prato] = (r.pratos[m.prato] || 0) + 1;
    this.eventos.push({ tipo: 'pagou', mesa: i, valor: preco + gorj, estrelas: est });
    m.vezes++;
    // Tonhão pede de novo até 3 vezes (e a banqueta nem chega a sujar).
    if (m.cliente.mania === 'tres' && m.vezes < 3) { m.estado = 'pedido'; m.espera = 0; m.prato = ''; return; }
    m.estado = 'suja';
  }
  limpar(i) { if (!this.mesas[i] || this.mesas[i].estado !== 'suja') return false; this.mesas[i] = this._mesaLivre(); return true; }
  mesaPronta() { return this.mesas.findIndex(m => m.estado === 'prato' && m.pronto && !m.montado); }
  encerrado(minutos) { return minutos >= TurnoJanta.FECHA; }
  // Fecha a janta: quem está comendo paga; quem esperava vai embora sem castigo.
  fechar() { this.mesas.forEach((m, i) => { if (m.estado === 'comendo') this._pagar(i); }); return this.relatorio; }
  // O Jocelino faltou: a Rosa serve sozinha até 4 PFs (preço base, sem gorjeta, 3 estrelas cada).
  static rosaSozinha(p, rng) {
    const r = TurnoJanta.relatorioVazio();
    for (let k = 0; k < TurnoJanta.ROSA_MAX && p.rende('pf_peao') > 0; k++) {
      p.consumir('pf_peao', rng);
      r.servidos++; r.clientes++; r.ganho += p.preco('pf_peao', 1); r.estrelas += 3;
    }
    return r;
  }
}
