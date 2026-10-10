// Jocelino — turno_janta.js — tradução de jogo/nucleo/turno_janta.gd.
// Uma janta da Pensão da Rosa no balcão (com o serviço do Bancho no Dave the Diver como referência): os clientes
// chegam das 17h às 20h30, sentam, leem o cardápio e pedem sozinhos; a Rosa cozinha os pedidos (2 bocas, gastando
// farinha da farinheira) e põe os pratos no passe da cozinha — prato sem dono: serve qualquer um que pediu aquele.
// O Jocelino leva na bandeja (até 3 coisas: prato, bebida que ele encheu no bebedouro, louça), serve, recolhe a louça e
// larga na bacia; o que sobrar vai para o lixo. O cliente come, paga (preço + gorjeta pelas estrelas; bebida na medida
// dá gorjeta extra) e deixa a louça. A paciência conta do pedido até o prato chegar: esgotou, vai embora (sem multa).
// Tempo em segundos reais (dt); chegadas pelo relógio do jogo (minutos).
// (anotar/montar e o preparo por banqueta ficam para o salão antigo e os testes velhos: modo 'antigo'.)

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
  static LENDO = 1.5;           // segundos lendo o cardápio antes de pedir
  static FARINHA_MAX = 15;      // a farinheira (o wasabi do Bancho): cada prato que sai gasta 1
  static REPOR_ATE = 10;        // só repõe a farinheira com 10 ou menos (não gasta um saco à toa)
  static PASSE_MAX = 4;         // pratos prontos que cabem no passe da cozinha
  static BANDEJA_MAX = 3;       // o que o Jocelino carrega de uma vez
  static BOCAS = 2;             // pratos no fogo ao mesmo tempo (o fogão de 4 bocas melhora)
  static MAX_MESAS = 6;         // banquetas no balcão do palco
  static GORJETA_MEDIDA = 0.15; // bebida na medida: 15% do preço a mais de gorjeta

  static relatorioVazio() { return { clientes: 0, servidos: 0, embora: 0, ganho: 0, gorjeta: 0, estrelas: 0, cafes: 0, faltou: [], pratos: {}, desperdicio: 0, bebidas: 0, curtidas: 0 }; }

  constructor() { this.pensao = null; this.mesas = []; this.relatorio = TurnoJanta.relatorioVazio(); this.eventos = []; this._fila = []; this._cardapio = []; this._rng = null; this.farinha = TurnoJanta.FARINHA_MAX; this._prontos = []; this._avisouFarinha = false; this.passe = []; this.bandeja = []; this.fogo = []; this.fatorPreparo = 1; this.bocas = TurnoJanta.BOCAS; this.gorjetaExtra = 0; this.paciencia = 1; this.moedas = []; }

  iniciar(p, dia, quantos) {
    this.pensao = p;
    const f = mulberry(dia * 31337);
    this._rng = { randf: f, randi: () => Math.floor(f() * 4294967296) };
    this._cardapio = p.cardapioDaNoite();
    this.mesas = [];
    for (let i = 0; i < Math.min(p.mesasDaNoite ? p.mesasDaNoite() : p.mesas, TurnoJanta.MAX_MESAS); i++) this.mesas.push(this._mesaLivre());
    this.relatorio = TurnoJanta.relatorioVazio();
    this._fila = [];
    this.farinha = TurnoJanta.FARINHA_MAX; this._prontos = []; this._avisouFarinha = false; this.passe = []; this.bandeja = []; this.fogo = []; this.moedas = [];
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
      certo: false, salada: false, bebidaCerta: false, rapido: false, come: 0, vezes: 0, reacao: '',
      lendo: 0, querBebida: false, bebidaServida: false, bebidaMedida: false, modo: '' };
  }
  tick(dt, minutos) {
    while (this._fila.length && minutos >= this._fila[0].minuto && minutos < TurnoJanta.FECHA) {
      const i = this.mesas.findIndex(m => m.estado === 'livre');
      if (i < 0) break;
      this._sentar(i, this._fila.shift().cliente);
    }
    this._cozinhar(dt);
    this.mesas.forEach((m, i) => {
      // Lendo o cardápio: quando acaba, pede sozinho (como no Bancho).
      if (m.estado === 'pedido' && m.lendo > 0) { m.lendo -= dt; if (m.lendo <= 0) this._pedir(i); return; }
      if (m.estado === 'pedido' || m.estado === 'prato') {
        m.espera += dt;
        if (m.estado === 'prato' && !m.pronto && m.modo === 'antigo') {
          if (this.farinha > 0) {
            m.preparo -= dt;
            if (m.preparo <= 0) {
              m.pronto = true; this.farinha--;
              if (!this._prontos.includes(i)) this._prontos.push(i);
              this.eventos.push({ tipo: 'pronto', mesa: i, prato: m.prato });
            }
          } else if (!this._avisouFarinha) { this._avisouFarinha = true; this.eventos.push({ tipo: 'farinha' }); }
        }
        const limite = (m.estado === 'pedido' ? TurnoJanta.PACIENCIA_PEDIDO : TurnoJanta.PACIENCIA_PRATO) * (this.paciencia || 1);
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
  // O fogão (modo balcão): cozinha os pedidos na ordem, até BOCAS de uma vez; o prato pronto vai para o passe.
  _cozinhar(dt) {
    const quem = this.fogo.slice(0, this.bocas || TurnoJanta.BOCAS);
    if (!quem.length) return;
    if (this.farinha <= 0) { if (!this._avisouFarinha) { this._avisouFarinha = true; this.eventos.push({ tipo: 'farinha' }); } return; }
    for (const f of quem) {
      if (this.passe.length >= TurnoJanta.PASSE_MAX) break;          // passe cheio: a Rosa espera
      f.t -= dt;
      if (f.t > 0) continue;
      this.fogo.splice(this.fogo.indexOf(f), 1);
      this.farinha--;
      this.passe.push({ tipo: 'prato', prato: f.prato, raridade: f.raridade });
      this.saidos = (this.saidos || 0) + 1;                            // a Rosa leva cada um até o passe (palco)
      this.eventos.push({ tipo: 'pronto', prato: f.prato });
      if (this.farinha <= 0) break;
    }
  }
  _sentar(i, cliente) {
    const m = this._mesaLivre();
    m.estado = 'pedido'; m.cliente = cliente; m.lendo = TurnoJanta.LENDO;
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
    m.modo = 'antigo'; m.lendo = 0;
    return this._pedir(i);
  }
  // O pedido de verdade (sozinho no palco, ou pelo anotar do salão antigo).
  _pedir(i) {
    const m = this.mesas[i];
    if (!m || m.estado !== 'pedido') return false;
    m.lendo = 0;
    // Cliente especial: pede o prato dele; sem ele na despensa, vai embora decepcionado.
    const p = this.pensao, balcao = m.modo !== 'antigo';
    const disp = id => p.rende(id) > 0 || (balcao && p.porcoes && p.porcoes(id) > 0);
    if (m.cliente.prato) {
      if (!disp(m.cliente.prato)) {
        this.relatorio.vip = 'faltou'; m.estado = 'suja';
        this.eventos.push({ tipo: 'vip_faltou', mesa: i, cliente: m.cliente, prato: m.cliente.prato });
        return true;
      }
    }
    // O cardápio é o de agora (não o do começo da janta): o que o jogador guardou ou marcou depois já vale.
    let opcoes = m.cliente.prato ? [m.cliente.prato] : this.pensao.cardapioDaNoite();
    if (balcao && !m.cliente.prato) {
      // No balcão vale o que está na panela ou o que a Rosa ainda consegue cozinhar.
      const base = (p.cardapio.length ? p.cardapio : p.receitas).filter(id => p.receitas.includes(id) && disp(id)).slice(0, p.vagas());
      opcoes = base.length ? base : p.receitas.filter(disp).slice(0, p.vagas());
    }
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
    const bebidas = typeof bebidasDaPensao === 'function' ? bebidasDaPensao(this.pensao) : Object.keys(Pratos.BEBIDAS).filter(b => b !== 'cerveja');
    m.bebida = bebidas[this._rng.randi() % bebidas.length];
    if (balcao) {
      if (p.porcoes(m.prato) <= 0) { p.prepararPanela(m.prato, 1, this._rng); this.eventos.push({ tipo: 'panela', prato: m.prato }); }   // a Rosa repõe sozinha
      m.raridade = p.servirPorcao(m.prato);
    } else m.raridade = this.pensao.consumir(m.prato, this._rng);
    m.querBebida = this._rng.randf() < 0.5; m.bebidaServida = false;
    m.rapido = m.modo === 'antigo' ? m.espera < TurnoJanta.PACIENCIA_PEDIDO / 2 : true;
    m.estado = 'prato'; m.espera = 0; m.preparo = TurnoJanta.PREPARO; m.pronto = false; m.montado = false;
    if (m.modo !== 'antigo') this.fogo.push({ prato: m.prato, raridade: m.raridade, t: TurnoJanta.PREPARO * this.fatorPreparo });
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
  // Pega o prato k do passe para a bandeja (se couber).
  pegar(k) {
    if (k < 0 || k >= this.passe.length || this.bandeja.length >= TurnoJanta.BANDEJA_MAX) return false;
    this.bandeja.push(this.passe.splice(k, 1)[0]);
    return true;
  }
  // Os pratos prontos no passe da cozinha.
  passaPrato() { return this.passe; }
  // Tem esse prato pronto (no passe ou na bandeja)? O balão do cliente fica branco.
  temPronto(prato) { return this.passe.some(x => x.prato === prato) || this.bandeja.some(x => x.tipo === 'prato' && x.prato === prato); }
  // A bebida mais antiga pedida que ainda não está na bandeja (a que o Jocelino vai encher), ou ''.
  bebidaPedida() {
    const naMao = this.bandeja.filter(x => x.tipo === 'bebida').map(x => x.bebida);
    const quem = this.mesas.filter(m => ['prato', 'comendo'].includes(m.estado) && m.querBebida && !m.bebidaServida).sort((a, b) => b.espera - a.espera);
    for (const m of quem) { const k = naMao.indexOf(m.bebida); if (k >= 0) naMao.splice(k, 1); else return m.bebida; }
    return '';
  }
  // Enche a bebida no bebedouro e põe na bandeja ('medida' = na linha; 'ok' = quase).
  encherBebida(bebida, qualidade = 'ok') {
    if (this.bandeja.length >= TurnoJanta.BANDEJA_MAX) return false;
    this.bandeja.push({ tipo: 'bebida', bebida, qualidade });
    return true;
  }
  // Serve a bebida da bandeja a quem pediu aquela bebida.
  servirBebida(i) {
    const m = this.mesas[i];
    if (!m || !['prato', 'comendo'].includes(m.estado) || !m.querBebida || m.bebidaServida) return false;
    const k = this.bandeja.findIndex(x => x.tipo === 'bebida' && x.bebida === m.bebida);
    if (k < 0) return false;
    const b = this.bandeja.splice(k, 1)[0];
    m.bebidaServida = true; m.bebidaMedida = b.qualidade === 'medida';
    if (m.estado === 'prato' && m.bebida === 'cafe') m.cafeAntes = true;   // cafezinho de boas-vindas, antes do prato
    this.relatorio.bebidas++; if (m.bebidaMedida) this.relatorio.medida = (this.relatorio.medida || 0) + 1;
    if (m.bebida === 'cerveja') this.relatorio.ganho += 3;   // cerveja gelada se paga à parte
    return true;
  }
  // Recolhe a louça da banqueta para a bandeja: a banqueta fica livre.
  recolher(i) {
    const m = this.mesas[i];
    if (!m || m.estado !== 'suja' || this.bandeja.length >= TurnoJanta.BANDEJA_MAX) return false;
    this.bandeja.push({ tipo: 'louca' });
    this.mesas[i] = this._mesaLivre();
    return true;
  }
  // O ajudante de salão: recolhe a louça e leva direto à bacia; serve a bebida pedida (na média, sem copo na medida).
  ajudanteRecolhe(i) { const m = this.mesas[i]; if (!m || m.estado !== 'suja') return false; this.mesas[i] = this._mesaLivre(); return true; }
  ajudanteBebida(i) {
    const m = this.mesas[i];
    if (!m || !['prato', 'comendo'].includes(m.estado) || !m.querBebida || m.bebidaServida) return false;
    m.bebidaServida = true; m.bebidaMedida = false; this.relatorio.bebidas++;
    return true;
  }
  // Recolhe as moedas da gorjeta deixadas no balcão da banqueta i. Devolve quanto.
  recolherMoedas(i) { const v = this.moedas.filter(x => x.mesa === i).reduce((n, x) => n + x.valor, 0); this.moedas = this.moedas.filter(x => x.mesa !== i); this.relatorio.gorjeta += v; return v; }
  // Larga a louça na bacia da cozinha. Devolve quantas.
  largarLouca() { const n = this.bandeja.filter(x => x.tipo === 'louca').length; this.bandeja = this.bandeja.filter(x => x.tipo !== 'louca'); return n; }
  // Joga fora o que sobrou na bandeja (pratos e bebidas). Devolve quantos.
  jogarFora() { const n = this.bandeja.filter(x => x.tipo !== 'louca').length; this.bandeja = this.bandeja.filter(x => x.tipo === 'louca'); this.relatorio.desperdicio += n; return n; }
  // Repõe a farinheira com um pacote de farinha da despensa.
  reporFarinha() {
    if (this.farinha > (this.farinhaMax || TurnoJanta.FARINHA_MAX) - (TurnoJanta.FARINHA_MAX - TurnoJanta.REPOR_ATE)) return 'cheia';
    if ((this.pensao.despensa.farinha || 0) < 1) return 'sem_farinha';
    this.pensao.despensa.farinha--;
    this.farinha = this.farinhaMax || TurnoJanta.FARINHA_MAX; this._avisouFarinha = false;
    return 'ok';
  }
  // O minuto em que chega o próximo cliente (para o "Adiantar"), ou -1.
  proximaChegada() { return this._fila.length ? this._fila[0].minuto : -1; }
  // Leva o prato montado à banqueta dele.
  servir(i) {
    const m = this.mesas[i];
    if (!m || m.estado !== 'prato') return false;
    if (m.modo !== 'antigo') {
      // No balcão: o prato daquele tipo que estiver na bandeja.
      const k = this.bandeja.findIndex(x => x.tipo === 'prato' && x.prato === m.prato);
      if (k < 0) return false;
      m.raridade = this.bandeja.splice(k, 1)[0].raridade; m.certo = true; m.montado = true;
    }
    if (!m.montado) return false;
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
    const bebida = m.modo === 'antigo' ? m.bebidaCerta : (!m.querBebida || m.bebidaServida);
    const est = Pensao.estrelas(m.rapido, m.certo, sabor, bebida, gostaSalada);
    const preco = Math.round(this.pensao.preco(m.prato, m.raridade) * (this.pratoTema && m.prato === this.pratoTema ? 1.5 : 1) * (m.cafeAntes && m.bebidaMedida ? ECO.cafeBoasVindas : 1));
    const gorj = Pensao.gorjeta(preco, est) + (m.bebidaMedida ? Math.round(preco * TurnoJanta.GORJETA_MEDIDA) : 0) + (this.gorjetaExtra > 0 ? Math.ceil(preco * this.gorjetaExtra * est / 5) : 0);
    const r = this.relatorio;
    r.servidos++; r.ganho += preco; r.estrelas += est;
    // No balcão a gorjeta fica em moedas até o Jocelino recolher (no salão antigo entra direto).
    if (m.modo === 'antigo') r.gorjeta += gorj; else if (gorj > 0) this.moedas.push({ mesa: i, valor: gorj });
    if (est >= 4) r.curtidas++;
    r.pratos[m.prato] = (r.pratos[m.prato] || 0) + 1;
    this.eventos.push({ tipo: 'pagou', mesa: i, valor: preco + gorj, estrelas: est });
    if (m.cliente.mania === 'vip') { r.vip = 'servido'; this.eventos.push({ tipo: 'vip_servido', mesa: i, cliente: m.cliente }); }
    m.vezes++;
    // Tonhão pede de novo até 3 vezes (e a banqueta nem chega a sujar).
    if (m.cliente.mania === 'tres' && m.vezes < 3) {
      Object.assign(m, { estado: 'pedido', espera: 0, prato: '', pronto: false, montado: false, bebidaServida: false, bebidaMedida: false, lendo: m.modo === 'antigo' ? 0 : TurnoJanta.LENDO });
      return;
    }
    m.estado = 'suja';
  }
  limpar(i) { if (!this.mesas[i] || this.mesas[i].estado !== 'suja') return false; this.mesas[i] = this._mesaLivre(); return true; }
  mesaPronta() { return this.mesas.findIndex(m => m.estado === 'prato' && m.pronto && !m.montado); }
  encerrado(minutos) { return minutos >= TurnoJanta.FECHA; }
  // Fecha a janta: quem está comendo paga; quem esperava vai embora sem castigo.
  fechar() {
    this.mesas.forEach((m, i) => { if (m.estado === 'comendo') this._pagar(i); });
    for (const x of this.moedas) this.relatorio.gorjeta += x.valor;   // a Rosa recolhe o que sobrou no balcão
    this.moedas = [];
    this.relatorio.desperdicio += this.passe.length + this.bandeja.filter(x => x.tipo !== 'louca').length;
    this.passe = []; this.bandeja = []; this.fogo = [];
    return this.relatorio;
  }
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
