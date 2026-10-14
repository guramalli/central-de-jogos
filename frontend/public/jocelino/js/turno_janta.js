// Jocelino — turno_janta.js — tradução de jogo/nucleo/turno_janta.gd.
// Uma janta da Pensão da Rosa no balcão (com o serviço do Bancho no Dave the Diver como referência): os clientes
// chegam das 17h às 20h30, sentam, leem o cardápio e pedem sozinhos; a Rosa cozinha os pedidos (2 bocas, gastando
// farinha da farinheira) e põe os pratos no passe da cozinha — prato sem dono: serve qualquer um que pediu aquele.
// O Jocelino leva na bandeja (até 3 coisas: prato, bebida que ele encheu no bebedouro, louça), serve, recolhe a louça e
// larga na bacia; o que sobrar vai para o lixo. O cliente come, paga (preço + gorjeta pelas estrelas; bebida na medida
// dá gorjeta extra) e deixa a louça. A paciência conta do pedido até o prato chegar: esgotou, vai embora (sem multa).
// Tempo em segundos reais (dt); chegadas pelo relógio do jogo (minutos).
// (anotar/montar e o preparo por banqueta ficam para o salão antigo e os testes velhos: modo 'antigo'.)
// (o cardápio do Bancho, 13/10) No balcão só sai o que o jogador montou no cardápio da noite (Pensao.montarNoite): a Rosa repõe
// o prato com "repõe" ligado; acabou tudo, o prato da casa; a sobra vai para o lixo no fechar.

class TurnoJanta {
  // (14/10, Tarefa A) Os números da janta moram no ECO (ECO.pensao.janta): lidos na hora, para o balanço mexer num lugar só.
  static get PACIENCIA_PEDIDO() { return ECO.pensao.janta.PACIENCIA_PEDIDO; }
  static get PACIENCIA_PRATO() { return ECO.pensao.janta.PACIENCIA_PRATO; }
  static get PREPARO() { return ECO.pensao.janta.PREPARO; }
  static get COMENDO() { return ECO.pensao.janta.COMENDO; }
  static ABRE = 17 * 60;
  static ULTIMA_CHEGADA = 20 * 60 + 30;
  static FECHA = 21 * 60;
  static FECHA_MAX = 24 * 60;   // (roteiro de 13/10) a janta vai até o último freguês; à meia-noite fecha de qualquer jeito
  static CAFE = 2;
  static ROSA_MAX = 4;
  static CHEIRO = 0.1;
  static get LENDO() { return ECO.pensao.janta.LENDO; }               // segundos lendo o cardápio antes de pedir
  static get FARINHA_MAX() { return ECO.pensao.janta.FARINHA_MAX; }   // a farinheira (o wasabi do Bancho): cada prato que sai gasta 1
  static get REPOR_ATE() { return ECO.pensao.janta.REPOR_ATE; }       // só repõe a farinheira com tanto ou menos (não gasta um saco à toa)
  static get PASSE_MAX() { return ECO.pensao.janta.PASSE_MAX; }       // pratos prontos que cabem no passe da cozinha
  static get BANDEJA_MAX() { return ECO.pensao.janta.BANDEJA_MAX; }   // o que o Jocelino carrega de uma vez
  static get BOCAS() { return ECO.pensao.janta.BOCAS; }               // pratos no fogo ao mesmo tempo (o fogão de 4 bocas melhora)
  static MAX_MESAS = 6;         // banquetas no balcão do palco
  static get GORJETA_MEDIDA() { return ECO.pensao.janta.GORJETA_MEDIDA; }   // bebida na medida: parte do preço a mais de gorjeta
  // (decisão do controlador) A gorjeta da medida só vem da bebida sem preço (o cafezinho, o guaraná, o caldo); a que se paga à parte
  // (a cerveja) na medida dá a aura, o carimbo e a estrela da bebida, mas não a gorjeta extra: ela já paga o copo.
  static gorjetaDaMedida(b) { return !TurnoJanta.precoBebida(b); }
  // (14/10, Tarefa C) A farinheira avisa com tanto ou menos; a cerveja vem depois do prato (quem acabou de comer espera um pouco).
  // (revisão, o Dave só avisa com o wasabi no fim) O alerta acende com um terço da farinheira (no mínimo 3): 5 na de 15, 9 na de 25.
  static alertaFarinha(max) { const A = ECO.pensao.janta.ALERTA_FARINHA; return Math.max(A.minimo, Math.ceil((max || TurnoJanta.FARINHA_MAX) / A.parte)); }
  alertaFarinha() { return TurnoJanta.alertaFarinha(this.farinhaMax); }
  static get ESPERA_CERVEJA() { return ECO.pensao.janta.ESPERA_CERVEJA; }
  // Os segundos para peneirar a farinheira: quem ('jocelino', 'ajudante' ou 'mestre').
  static peneira(quem) { return ECO.pensao.janta.PENEIRA[quem] || ECO.pensao.janta.PENEIRA.jocelino; }
  // (13/10, o Dave) Sem banqueta livre, o freguês senta ao lado da louça suja: se ninguém recolher em LENDO_LOUCA s, ele vai embora.
  static get LENDO_LOUCA() { return ECO.pensao.janta.LENDO_LOUCA; }
  // O preço de cada bebida servida (0 para a que não se paga à parte).
  static precoBebida(b) { return (ECO.pensao.janta.precoBebida || {})[b] || 0; }
  // (13/10, o Dave: a música acelera perto de fechar) A "Última rodada!": quem chega depois pede mais bebida.
  static ULTIMA_RODADA = 20 * 60;
  static BEBIDA_ULTIMA = 0.8;

  // (o cardápio do Bancho, 13/10) casa: quantos levaram o prato da casa; acabou: os pratos que saíram do cardápio na noite;
  // sobra: as porções que foram para o lixo no fim ({ prato: n }); estrelasCasa: as estrelas dadas ao prato da casa (fora da fama).
  // (14/10, Tarefa A: o fechamento completo, o "Cooking / Others / Tips" do Dave) ganho = vendaPratos + vendaBebidas (os pratos,
  // inclusive o da casa; as bebidas que se pagam à parte); perdida: o preço do prato de quem foi embora esperando ele; pedidos: os
  // pedidos de cada prato (sem o da casa) e maisPedido: { prato, qtd } (no fechar); gargalos: os segundos com a farinheira vazia
  // e a Rosa parada, as vezes que o passe encheu, a espera média até o prato (s) e quantos foram embora pela louça suja do lado.
  static relatorioVazio() { return { favoritos: [], clientes: 0, servidos: 0, embora: 0, ganho: 0, gorjeta: 0, estrelas: 0, cafes: 0, faltou: [], pratos: {}, desperdicio: 0, bebidas: 0, curtidas: 0, casa: 0, estrelasCasa: 0, acabou: [], sobra: {},
    derramou: 0, vendaPratos: 0, vendaBebidas: 0, perdida: 0, pedidos: {}, maisPedido: null, gargalos: { farinhaVazia: 0, passeCheio: 0, esperaMedia: 0, emboraLouca: 0 } }; }
  // (Tarefa A) A conta do fechamento, na ordem da lousa: Pratos + Bebidas + Gorjetas + Prêmios = Receita; Receita − Despesa −
  // Salários = Lucro. A despesa e os salários são o que saiu de verdade (despesaPaga/salariosPagos: o bolso vazio não paga tudo).
  static conta(r) {
    const bebidas = r.vendaBebidas || 0, pratos = (r.ganho || 0) - bebidas, gorjetas = r.gorjeta || 0, premios = r.premios || 0;
    const receita = pratos + bebidas + gorjetas + premios, despesa = r.despesaPaga ?? (r.despesa || 0), salarios = r.salariosPagos ?? (r.salarios || 0);
    return { pratos, bebidas, gorjetas, premios, receita, despesa, salarios, lucro: receita - despesa - salarios };
  }
  // O prato mais pedido ({ prato: n } → { prato, qtd }; empate: o que foi pedido primeiro), ou null.
  static maisPedido(cont) { let m = null; for (const id in cont || {}) if (cont[id] > 0 && (!m || cont[id] > m.qtd)) m = { prato: id, qtd: cont[id] }; return m; }
  // O que a noite conta para a fama (estrelas → curtidas, pitadas) e para a experiência da Rosa: sem o prato da casa.
  static paraFama(r) { return { estrelas: Math.max(0, r.estrelas - (r.estrelasCasa || 0)), servidos: Math.max(0, r.servidos - (r.casa || 0)) }; }

  constructor() { this.pensao = null; this.mesas = []; this.relatorio = TurnoJanta.relatorioVazio(); this.eventos = []; this._fila = []; this._rng = null; this.farinha = TurnoJanta.FARINHA_MAX; this._prontos = []; this._avisouFarinha = false; this.passe = []; this.bandeja = []; this.fogo = []; this.fatorPreparo = 1; this.bocas = TurnoJanta.BOCAS; this.gorjetaExtra = 0; this.paciencia = 1; this.moedas = []; }

  iniciar(p, dia, quantos) {
    this.pensao = p;
    const f = mulberry(dia * 31337);
    this._rng = { randf: f, randi: () => Math.floor(f() * 4294967296) };
    this.mesas = [];
    for (let i = 0; i < Math.min(p.mesasDaNoite ? p.mesasDaNoite() : p.mesas, p.maxMesas ? p.maxMesas() : TurnoJanta.MAX_MESAS); i++) this.mesas.push(this._mesaLivre());
    this.relatorio = TurnoJanta.relatorioVazio();
    this._fila = [];
    this.farinha = TurnoJanta.FARINHA_MAX; this._prontos = []; this._avisouFarinha = false; this.passe = []; this.bandeja = []; this.fogo = []; this.moedas = [];
    this._alertouFarinha = false; this._peneirado = 0;   // (Tarefa C) o alerta da farinheira baixa e o que já foi peneirado
    this._esperaSoma = 0; this._esperaN = 0;   // (Tarefa A) a espera até o prato de cada servido, para a média do fechamento
    // Sem repetir o mesmo cliente enquanto der (dois Seu Lourival juntos não dá).
    // (14/10, o jogador: "sensação de vários clientes e não sempre os mesmos") Uma parte da fila (ECO.pensao.salao.avulsos) são
    // fregueses de fora (CLIENTES_AVULSOS), nunca o mesmo duas vezes na noite. O sorteio deles tem o dado próprio: o morador da
    // vez sai do mesmo jeito de antes (o pedido e a bebida de cada noite não mudam por causa disso).
    const S = TurnoJanta.salao(), ra = mulberry(dia * 7919 + 17);
    this._rngSalao = ra; this._t = 0; this._chegadaT = 0; this._vagouEm = []; this._ultimoVago = -1; this._ocupada = [];
    let pool = [], avulsos = typeof CLIENTES_AVULSOS !== 'undefined' ? CLIENTES_AVULSOS.slice() : [];
    for (let k = 0; k < quantos; k++) {
      if (!pool.length) pool = Pratos.CLIENTES.slice();
      let c = pool.splice(this._rng.randi() % pool.length, 1)[0];
      if (avulsos.length && ra() < S.avulsos) { const a = avulsos.splice(Math.floor(ra() * avulsos.length), 1)[0]; c = { id: a.id, nome: a.apelido || a.nome, mania: '', avulso: true }; }
      const minuto = TurnoJanta.ABRE + Math.round((TurnoJanta.ULTIMA_CHEGADA - TurnoJanta.ABRE) * k / Math.max(1, quantos));
      this._fila.push({ minuto, cliente: c });
    }
  }
  // Os números do salão (ECO.pensao.salao), com o padrão se o ECO não tiver.
  static salao() { return (typeof ECO !== 'undefined' && ECO.pensao && ECO.pensao.salao) || { chegada: [4, 10], folgaBanco: 3, avulsos: 0.5, bebidaAjudante: 3 }; }
  // (14/10, a rotatividade) Quanto tempo (s) o cliente anda da porta até a banqueta i. Aqui, 0: senta na hora (o salão antigo e os
  // testes de regra); o palco (palco.js) troca por distância ÷ passo, e o cliente entra andando.
  tempoAndar(i) { return 0; }
  _mesaLivre() {
    return { estado: 'livre', cliente: {}, prato: '', bebida: '', raridade: 1, espera: 0, preparo: 0, pronto: false, montado: false,
      certo: false, salada: false, bebidaCerta: false, rapido: false, come: 0, vezes: 0, reacao: '',
      lendo: 0, querBebida: false, bebidaServida: false, bebidaMedida: false, modo: '' };
  }
  tick(dt, minutos) {
    // O Zezinho, lá pelas tantas, belisca uma cocada da panela (uma vez por noite).
    if (this.filho === 'zezinho' && !this._roubou && (this._zz = (this._zz || 0) + dt) > 30 && this.pensao.porcoes && this.pensao.porcoes('cocada_tijolinho') > 0) this.zezinhoApronta();
    if (!this._ultima && minutos >= TurnoJanta.ULTIMA_RODADA && minutos < TurnoJanta.FECHA_MAX) { this._ultima = true; this.eventos.push({ tipo: 'ultima_rodada' }); }
    if (this.rotatividade) this._chegadas(dt, minutos);
    else while (this._fila.length && minutos >= this._fila[0].minuto && minutos < TurnoJanta.FECHA_MAX) {
      let i = this.mesas.findIndex(m => m.estado === 'livre');
      if (i < 0) i = this.mesas.findIndex(m => m.estado === 'suja');   // sem livre: senta ao lado da louça (o Dave)
      if (i < 0) break;
      const comLouca = this.mesas[i].estado === 'suja';
      this._sentar(i, this._fila.shift().cliente);
      if (comLouca) { const m = this.mesas[i]; m.louca = true; m.lendo = TurnoJanta.LENDO_LOUCA; this.eventos.push({ tipo: 'louca', mesa: i, cliente: m.cliente }, { tipo: 'reacao', mesa: i, reacao: 'nojo' }); }
    }
    this._cozinhar(dt);
    this.mesas.forEach((m, i) => {
      // (14/10, a rotatividade) Entrando pela porta: a paciência ainda não conta; chegou à banqueta, senta e lê o cardápio.
      if (m.estado === 'chegando') { m.anda -= dt; if (m.anda <= 0) this._assentar(i); return; }
      // Lendo o cardápio: quando acaba, pede sozinho (como no Bancho). Com a louça suja do lado ainda ali, vai embora (e a louça fica).
      if (m.estado === 'pedido' && m.lendo > 0) {
        m.lendo -= dt;
        if (m.lendo <= 0) {
          if (m.louca) { this.relatorio.embora++; this.relatorio.gargalos.emboraLouca++; this.eventos.push({ tipo: 'embora', mesa: i, cliente: m.cliente, louca: true }); this.mesas[i] = Object.assign(this._mesaLivre(), { estado: 'suja' }); }
          else this._pedir(i);
        }
        return;
      }
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
          if (m.estado === 'prato') this.relatorio.perdida += this._precoPerdido(m);   // foi embora esperando o prato: a receita perdida
          if (m.cliente.mania === 'paladar') this.relatorio.paladar = 1;
          this.eventos.push({ tipo: 'embora', mesa: i, cliente: m.cliente });
          this.mesas[i] = this._mesaLivre();
        }
      } else if (m.estado === 'comendo') {
        m.come -= dt;
        // (Tarefa C, o Dave: a cerveja vem DEPOIS do prato) acabou de comer e a cerveja não chegou: espera um pouco antes de pagar
        if (m.come <= 0 && m.bebida === 'cerveja' && this.querBebidaAgora(m) && (m.esperaCerveja = (m.esperaCerveja || 0) + dt) < TurnoJanta.ESPERA_CERVEJA) return;
        if (m.come <= 0) this._pagar(i);
      }
    });
  }
  // O fogão (modo balcão): cozinha os pedidos na ordem, até BOCAS de uma vez; o prato pronto vai para o passe.
  _cozinhar(dt) {
    const quem = this.fogo.slice(0, this.bocas || TurnoJanta.BOCAS);
    if (!quem.length) return;
    // farinheira vazia com pedido no fogo: a Rosa fica parada (o gargalo do fechamento conta esse tempo)
    if (this.farinha <= 0) { this.relatorio.gargalos.farinhaVazia += dt; if (!this._avisouFarinha) { this._avisouFarinha = true; this.eventos.push({ tipo: 'farinha' }); } return; }
    for (const f of quem) {
      if (this.passe.length >= TurnoJanta.PASSE_MAX) break;          // passe cheio: a Rosa espera
      f.t -= dt;
      if (f.t > 0) continue;
      this.fogo.splice(this.fogo.indexOf(f), 1);
      this.farinha--; this._alertaFarinha();
      this.passe.push({ tipo: 'prato', prato: f.prato, raridade: f.raridade });
      if (this.passe.length >= TurnoJanta.PASSE_MAX) this.relatorio.gargalos.passeCheio++;   // o passe encheu (a Rosa vai esperar)
      this.saidos = (this.saidos || 0) + 1;                            // a Rosa leva cada um até o passe (palco)
      this.eventos.push({ tipo: 'pronto', prato: f.prato });
      if (this.farinha <= 0) break;
    }
  }
  // (14/10, Tarefa C, o medidor do wasabi do Dave) A farinheira baixou até o alerta (e ainda tem): a Rosa chama uma vez até repor.
  _alertaFarinha() {
    if (this.farinha > 0 && this.farinha <= this.alertaFarinha() && !this._alertouFarinha) { this._alertouFarinha = true; this.eventos.push({ tipo: 'farinha_baixa', farinha: this.farinha }); }
  }
  // (14/10, a rotatividade, o Dave: o cliente ENTRA no salão e senta num banco livre; ao terminar, sai; o lugar fica com a louça)
  // As chegadas com tempo: entre uma e outra, um intervalo sorteado (ECO.pensao.salao.chegada, s); o cliente escolhe por sorteio
  // um banco livre SEM louça; só senta do lado da louça se não houver outro; e nunca no banco que acabou de vagar (folgaBanco s
  // depois de vagar; e o último que vagou só se não sobrar outro). Sem banco, espera na porta (a fila).
  _chegadas(dt, minutos) {
    const S = TurnoJanta.salao(), ra = this._rngSalao || Math.random, ocup = m => ['chegando', 'pedido', 'prato', 'comendo'].includes(m.estado);
    this._t = (this._t || 0) + dt;
    this._vagouEm = this._vagouEm || []; this._ocupada = this._ocupada || [];
    this.mesas.forEach((m, i) => { const o = ocup(m); if (this._ocupada[i] && !o) { this._vagouEm[i] = this._t; this._ultimoVago = i; } this._ocupada[i] = o; });
    if (this._chegadaT > 0) { this._chegadaT -= dt; return; }
    if (!this._fila.length || minutos < this._fila[0].minuto || minutos >= TurnoJanta.FECHA_MAX) return;
    const descansou = i => this._vagouEm[i] == null || this._t - this._vagouEm[i] >= S.folgaBanco;
    const escolhe = estado => {
      let c = this.mesas.map((m, i) => i).filter(i => this.mesas[i].estado === estado && descansou(i));
      if (c.length > 1) c = c.filter(i => i !== this._ultimoVago);
      return c.length ? c[Math.floor(ra() * c.length)] : -1;
    };
    let i = escolhe('livre');
    if (i < 0) i = escolhe('suja');   // salão cheio: senta do lado da louça (o Dave)
    if (i < 0) return;
    this._entrar(i, this._fila.shift().cliente);
    this._ocupada[i] = true;
    this._chegadaT = S.chegada[0] + ra() * (S.chegada[1] - S.chegada[0]);
  }
  // O cliente entra pela porta e anda até a banqueta i (tempoAndar); a banqueta já é dele. Sem caminhada, senta na hora.
  _entrar(i, cliente) {
    const louca = this.mesas[i].estado === 'suja', m = this._mesaLivre();
    m.estado = 'chegando'; m.cliente = cliente; m.anda = m.andaTotal = Math.max(0, this.tempoAndar(i) || 0); m.louca = louca;
    this.mesas[i] = m;
    this.relatorio.clientes++;
    if (cliente.convidado) this.relatorio.convidados = (this.relatorio.convidados || 0) + 1;
    this.eventos.push({ tipo: 'entrou', mesa: i, cliente });
    if (m.anda <= 0) this._assentar(i);
  }
  // Chegou à banqueta: senta e lê o cardápio (do lado da louça ainda ali, com a paciência curta do LENDO_LOUCA).
  _assentar(i) {
    const m = this.mesas[i];
    m.estado = 'pedido'; m.lendo = TurnoJanta.LENDO; m.espera = 0; m.anda = 0;
    this.eventos.push({ tipo: 'chegou', mesa: i, cliente: m.cliente });
    if (m.louca) { m.lendo = TurnoJanta.LENDO_LOUCA; this.eventos.push({ tipo: 'louca', mesa: i, cliente: m.cliente }, { tipo: 'reacao', mesa: i, reacao: 'nojo' }); }
    this._cheiro(i);
  }
  _cheiro(i) {
    const cliente = this.mesas[i].cliente;
    // Seu Lourival chega cheirando a peixe: a banqueta do lado perde paciência.
    if (cliente.mania === 'cheiro') this.mesas.forEach((o, j) => {
      if (j !== i && (o.estado === 'pedido' || o.estado === 'prato')) { o.espera += TurnoJanta.PACIENCIA_PEDIDO * TurnoJanta.CHEIRO; this.eventos.push({ tipo: 'reacao', mesa: j, reacao: 'nojo' }); }
    });
  }
  _sentar(i, cliente) {
    const m = this._mesaLivre();
    m.estado = 'pedido'; m.cliente = cliente; m.lendo = TurnoJanta.LENDO;
    this.mesas[i] = m;
    this.relatorio.clientes++;
    if (cliente.convidado) this.relatorio.convidados = (this.relatorio.convidados || 0) + 1;   // (o Dave: os convidados da festa, contados no fim)
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
    const p = this.pensao, balcao = m.modo !== 'antigo';
    if (balcao) {
      // (o cardápio do Bancho, 13/10) No balcão o cliente escolhe entre os pratos com porção na panela (o cardápio que o jogador
      // montou). O cliente especial pede o prato dele: da panela, ou a Rosa faz à parte com a despensa (a cena do VIP no Dave).
      // Sem nenhum prato, o prato da casa (o Norimaki).
      if (m.cliente.prato) {
        if (p.porcoes(m.cliente.prato) <= 0 && p.rende(m.cliente.prato) <= 0) return this._vipFaltou(i);
        m.prato = m.cliente.prato;
      } else {
        const menu = p.pratosDaNoite(), quer = m.cliente.favorito || m.cliente.pedeTema;
        if (!menu.length) { m.prato = Pensao.CASA; this.eventos.push({ tipo: 'casa', mesa: i, cliente: m.cliente }); }
        else m.prato = quer && menu.includes(quer) ? quer : menu[this._rng.randi() % menu.length];
      }
    } else {
      // O salão antigo: o cardápio do quadro de giz que rende, a porção sai da despensa; sem nada, só um cafezinho.
      const disp = id => p.rende(id) > 0;
      if (m.cliente.prato && !disp(m.cliente.prato)) return this._vipFaltou(i);
      let opcoes = m.cliente.prato ? [m.cliente.prato] : p.cardapioDaNoite();
      const quer = m.cliente.favorito || m.cliente.pedeTema;
      if (!m.cliente.prato && quer && p.receitas.includes(quer) && disp(quer)) { m.prato = quer; opcoes = null; }
      if (opcoes && !opcoes.length) {
        // Sem nada que renda: um cafezinho e a promessa de voltar. Registra o que faltou.
        this.relatorio.cafes++;
        if (m.cliente.mania === 'paladar') this.relatorio.paladar = 1;
        this.relatorio.ganho += TurnoJanta.CAFE; this.relatorio.vendaBebidas += TurnoJanta.CAFE;
        const marcados = p.cardapio.length ? p.cardapio : p.receitas;
        for (const id of marcados) if (!this.relatorio.faltou.includes(id)) this.relatorio.faltou.push(id);
        m.estado = 'suja';
        this.eventos.push({ tipo: 'cafe', mesa: i, cliente: m.cliente });
        return true;
      }
      if (opcoes) m.prato = opcoes[this._rng.randi() % opcoes.length];
    }
    if (m.prato !== Pensao.CASA) this.relatorio.pedidos[m.prato] = (this.relatorio.pedidos[m.prato] || 0) + 1;
    const bebidas = typeof bebidasDaPensao === 'function' ? bebidasDaPensao(this.pensao) : Object.keys(Pratos.BEBIDAS).filter(b => b !== 'cerveja');
    m.bebida = bebidas[this._rng.randi() % bebidas.length];
    m.raridade = balcao ? this._tirarPorcao(m.prato) : p.consumir(m.prato, this._rng);
    m.querBebida = this._rng.randf() < (this._ultima ? TurnoJanta.BEBIDA_ULTIMA : 0.5); m.bebidaServida = false;
    m.rapido = m.modo === 'antigo' ? m.espera < TurnoJanta.PACIENCIA_PEDIDO / 2 : true;
    m.estado = 'prato'; m.espera = 0; m.preparo = TurnoJanta.PREPARO; m.pronto = false; m.montado = false;
    if (m.modo !== 'antigo') this.fogo.push({ prato: m.prato, raridade: m.raridade, t: TurnoJanta.PREPARO * this.fatorPreparo });
    this.eventos.push({ tipo: 'pediu', mesa: i, prato: m.prato });   // (14/10, os sons do Dave) a campainha do pedido
    return true;
  }
  // Cliente especial sem o prato dele (nem na panela, nem na despensa): vai embora decepcionado.
  _vipFaltou(i) {
    const m = this.mesas[i];
    this.relatorio.vip = 'faltou'; m.estado = 'suja';
    this.eventos.push({ tipo: 'vip_faltou', mesa: i, cliente: m.cliente, prato: m.cliente.prato });
    return true;
  }
  // No balcão: tira a porção do pedido. O prato da casa não gasta nada; o do VIP fora do cardápio sai da despensa (uma porção
  // feita à parte); o resto sai da panela, e a panela que acabou passa pelo "repõe". Devolve a raridade.
  _tirarPorcao(prato) {
    const p = this.pensao;
    if (prato === Pensao.CASA) return 1;
    if (p.porcoes(prato) <= 0) return p.consumir(prato, this._rng);
    const rar = p.servirPorcao(prato);
    this._seAcabou(prato);
    return rar;
  }
  // A panela do prato acabou: com "repõe" ligado e ingrediente, a Rosa faz outra; senão o prato sai do cardápio (e, com o repõe
  // ligado, a falta de ingrediente vai para o relatório).
  _seAcabou(prato) {
    const r = this.pensao.reporSeAcabou(prato, this._rng);
    if (r === 'repos') this.eventos.push({ tipo: 'panela', prato });
    else if (r) {
      if (!this.relatorio.acabou.includes(prato)) this.relatorio.acabou.push(prato);
      if (r === 'faltou' && !this.relatorio.faltou.includes(prato)) this.relatorio.faltou.push(prato);
      this.eventos.push({ tipo: 'prato_saiu', prato, motivo: r });
    }
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
  // (Tarefa B) O prato que o ajudante reservou não sai: pega o primeiro livre.
  pegar(k) {
    if (k < 0 || k >= this.passe.length || this.bandeja.length >= TurnoJanta.BANDEJA_MAX) return false;
    if (this.passe[k].reservadoPara != null) { k = this.passe.findIndex(x => x.reservadoPara == null); if (k < 0) return false; }
    this.bandeja.push(this.passe.splice(k, 1)[0]);
    return true;
  }
  // Os pratos do passe que ninguém reservou.
  livresNoPasse() { return this.passe.filter(x => x.reservadoPara == null); }
  // Os pratos prontos no passe da cozinha.
  passaPrato() { return this.passe; }
  // Tem esse prato pronto (no passe ou na bandeja)? O balão do cliente fica branco.
  temPronto(prato) { return this.passe.some(x => x.prato === prato) || this.bandeja.some(x => x.tipo === 'prato' && x.prato === prato); }
  // (14/10, Tarefa C, o Dave: o chá antes do prato, a cerveja DEPOIS) O cliente quer a bebida dele agora? O café, o guaraná e o caldo
  // desde o pedido (o cafezinho de boas-vindas vem antes do prato); a cerveja só quando o prato chega (comendo, ou acabou de comer
  // e ainda espera a cerveja).
  querBebidaAgora(m) {
    if (!m || !m.querBebida || m.bebidaServida) return false;
    return m.bebida === 'cerveja' ? m.estado === 'comendo' : ['prato', 'comendo'].includes(m.estado);
  }
  // A bebida mais antiga pedida que ainda não está na bandeja (a que o Jocelino vai encher), ou ''.
  bebidaPedida() {
    const naMao = this.bandeja.filter(x => x.tipo === 'bebida').map(x => x.bebida);
    // (14/10) a bebida que um ajudante já está enchendo (bebidaReservada) não entra: é dele
    const quem = this.mesas.filter(m => this.querBebidaAgora(m) && !m.bebidaReservada).sort((a, b) => b.espera - a.espera);
    for (const m of quem) { const k = naMao.indexOf(m.bebida); if (k >= 0) naMao.splice(k, 1); else return m.bebida; }
    return '';
  }
  // Enche a bebida no bebedouro e põe na bandeja. A nota (Tarefa C, as notas do Dave): 'medida' = PERFEITA (na linha; a cerveja com o
  // colarinho de dois dedos); 'ok' = BOA (quase; a cerveja com pouca espuma); 'ruim' = RUIM (derramou; a cerveja com espuma demais).
  encherBebida(bebida, qualidade = 'ok') {
    if (this.bandeja.length >= TurnoJanta.BANDEJA_MAX) return false;
    this.bandeja.push({ tipo: 'bebida', bebida, qualidade });
    return true;
  }
  // Serve a bebida da bandeja a quem pediu aquela bebida.
  servirBebida(i) {
    const m = this.mesas[i];
    if (!this.querBebidaAgora(m)) return false;
    const k = this.bandeja.findIndex(x => x.tipo === 'bebida' && x.bebida === m.bebida);
    if (k < 0) return false;
    const b = this.bandeja.splice(k, 1)[0];
    this._bebidaChegou(m, b.qualidade);
    return true;
  }
  // A bebida chegou à banqueta (pelo Jocelino ou pelo ajudante), com a nota dela ('medida', 'ok' ou 'ruim'; true/false valem como
  // 'medida'/'ok'). Na medida: a gorjeta, a aura e o café antes do prato. Derramada (Tarefa C): servida mesmo assim, mas sem a
  // estrela da bebida e sem a gorjeta extra. Toda bebida se paga à parte (ECO.pensao.janta.precoBebida) e vai para as bebidas do
  // fechamento.
  _bebidaChegou(m, nota) {
    const q = nota === true ? 'medida' : nota === 'medida' || nota === 'ruim' ? nota : 'ok';
    m.bebidaServida = true; m.bebidaMedida = q === 'medida'; m.bebidaRuim = q === 'ruim'; m.bebidaNota = q;
    if (m.estado === 'prato' && m.bebida === 'cafe') m.cafeAntes = true;   // cafezinho de boas-vindas, antes do prato
    this.relatorio.bebidas++; if (m.bebidaMedida) this.relatorio.medida = (this.relatorio.medida || 0) + 1;
    if (m.bebidaRuim) this.relatorio.derramou = (this.relatorio.derramou || 0) + 1;
    const vb = TurnoJanta.precoBebida(m.bebida); if (vb) { this.relatorio.ganho += vb; this.relatorio.vendaBebidas += vb; }
  }
  // Recolhe a louça da banqueta para a bandeja: a banqueta fica livre.
  recolher(i) {
    const m = this.mesas[i];
    // A louça ao lado de quem acabou de sentar: sai para a bandeja e o freguês já lê o cardápio.
    if (m && m.louca && this.bandeja.length < TurnoJanta.BANDEJA_MAX) { this.bandeja.push({ tipo: 'louca' }); m.louca = false; m.lendo = Math.min(m.lendo, TurnoJanta.LENDO); return true; }
    if (!m || m.estado !== 'suja' || this.bandeja.length >= TurnoJanta.BANDEJA_MAX) return false;
    this.bandeja.push({ tipo: 'louca' });
    this.mesas[i] = this._mesaLivre();
    return true;
  }
  // O ajudante de salão: recolhe a louça e leva direto à bacia; serve a bebida pedida (na média, sem copo na medida).
  ajudanteRecolhe(i) { const m = this.mesas[i]; if (m && m.louca) { m.louca = false; m.lendo = Math.min(m.lendo, TurnoJanta.LENDO); return true; } if (!m || m.estado !== 'suja') return false; this.mesas[i] = this._mesaLivre(); return true; }
  // (14/10, a bebida com tempo) O ajudante pega para si a bebida da banqueta i (o Jocelino não enche a mesma); devolve a bebida ou ''.
  reservarBebida(i) {
    const m = this.mesas[i];
    if (!this.querBebidaAgora(m) || m.bebidaReservada) return '';
    m.bebidaReservada = true;
    return m.bebida;
  }
  // Ele chegou com o copo cheio (a bebida b, enchida no bebedouro): serve, se aquele cliente ainda quer aquela bebida. O ajudante
  // comum serve na média; o Mestre da bebida (medida = true) serve sempre na medida: a gorjeta, a aura, o carimbo e o café antes.
  // (Tarefa B) A bebida que se paga à parte (a cerveja) entra nas bebidas do fechamento também quando é ele que serve.
  ajudanteBebida(i, b, medida = false) {
    const m = this.mesas[i];
    if (m) m.bebidaReservada = false;
    if (!this.querBebidaAgora(m) || (b && b !== m.bebida)) return false;
    this._bebidaChegou(m, medida ? 'medida' : 'ok');
    return true;
  }
  // ---- (14/10, Tarefa B) O ajudante que leva prato (o "Leva prato", raro): ele reserva no passe o prato de quem pediu, anda até
  // o passe, pega e leva. O prato reservado (reservadoPara = a banqueta) o Jocelino não pega: os dois nunca levam o mesmo prato.
  // O cliente especial (o VIP, que tem cena) é servido só pelo Jocelino.
  reservarPrato(i) {
    const m = this.mesas[i];
    if (!m || m.estado !== 'prato' || m.modo === 'antigo' || m.pratoReservado || m.cliente.mania === 'vip') return -1;
    const k = this.passe.findIndex(x => x.prato === m.prato && x.reservadoPara == null);
    if (k < 0) return -1;
    this.passe[k].reservadoPara = i; m.pratoReservado = true;
    return k;
  }
  // Chegou ao passe: pega o prato reservado para a banqueta i, se o cliente ainda espera por ele (senão desfaz a reserva). Devolve o prato ou null.
  ajudantePegaPrato(i) {
    const k = this.passe.findIndex(x => x.reservadoPara === i), m = this.mesas[i];
    if (k < 0) { if (m) m.pratoReservado = false; return null; }
    if (!m || m.estado !== 'prato' || !m.pratoReservado || m.prato !== this.passe[k].prato) { delete this.passe[k].reservadoPara; if (m) m.pratoReservado = false; return null; }
    const x = this.passe.splice(k, 1)[0]; delete x.reservadoPara;
    return x;
  }
  // Chegou à banqueta com o prato x: serve, se o cliente ainda quer aquele prato; senão o prato volta para o passe.
  ajudanteServePrato(i, x) {
    const m = this.mesas[i];
    if (!m || m.estado !== 'prato' || m.modo === 'antigo' || m.prato !== x.prato) { if (m && m.estado === 'prato') m.pratoReservado = false; this.devolverAoPasse(x); return false; }
    m.pratoReservado = false; m.raridade = x.raridade; m.certo = true; m.montado = true;
    return this._entregar(i);
  }
  devolverAoPasse(x) { delete x.reservadoPara; if (this.passe.length < TurnoJanta.PASSE_MAX) this.passe.push(x); else this.relatorio.desperdicio++; }
  // Ninguém mais vai levar (o ajudante saiu da tela): todo prato reservado volta a ser de quem pegar.
  soltarReservas() { for (const x of this.passe) delete x.reservadoPara; for (const m of this.mesas) m.pratoReservado = false; }
  // Recolhe as moedas da gorjeta deixadas no balcão da banqueta i. Devolve quanto.
  recolherMoedas(i) { const v = this.moedas.filter(x => x.mesa === i).reduce((n, x) => n + x.valor, 0); this.moedas = this.moedas.filter(x => x.mesa !== i); this.relatorio.gorjeta += v; return v; }
  // Larga a louça na bacia da cozinha. Devolve quantas.
  largarLouca() { const n = this.bandeja.filter(x => x.tipo === 'louca').length; this.bandeja = this.bandeja.filter(x => x.tipo !== 'louca'); return n; }
  // Joga fora o que sobrou na bandeja (pratos e bebidas). Devolve quantos.
  jogarFora() { const n = this.bandeja.filter(x => x.tipo !== 'louca').length; this.bandeja = this.bandeja.filter(x => x.tipo === 'louca'); this.relatorio.desperdicio += n; return n; }
  // Dá para repor a farinheira agora? 'ok', 'cheia' (ainda tem mais que o "repõe com tanto ou menos") ou 'sem_farinha' (na despensa).
  podeReporFarinha() {
    if (this.farinha > (this.farinhaMax || TurnoJanta.FARINHA_MAX) - (TurnoJanta.FARINHA_MAX - TurnoJanta.REPOR_ATE)) return 'cheia';
    if ((this.pensao.despensa.farinha || 0) < 1) return 'sem_farinha';
    return 'ok';
  }
  // Repõe a farinheira com um pacote de farinha da despensa (no fim da peneira: a peneira com tempo é do palco, palco.js).
  reporFarinha() {
    const r = this.podeReporFarinha(); if (r !== 'ok') return r;
    this.pensao.despensa.farinha--;
    this.farinha = this.farinhaMax || TurnoJanta.FARINHA_MAX; this._avisouFarinha = false; this._alertouFarinha = false; this._peneirado = 0;
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
      // (Tarefa B) o Jocelino chegou antes do ajudante: a reserva dele se desfaz (o prato reservado volta a ser de qualquer um)
      if (m.pratoReservado) { m.pratoReservado = false; for (const x of this.passe) if (x.reservadoPara === i) delete x.reservadoPara; }
    }
    return this._entregar(i);
  }
  // O prato chegou à banqueta (pelo Jocelino ou pelo ajudante que leva prato): o cliente começa a comer.
  _entregar(i) {
    const m = this.mesas[i];
    if (!m.montado) return false;
    this._esperaSoma = (this._esperaSoma || 0) + m.espera; this._esperaN = (this._esperaN || 0) + 1;
    m.estado = 'comendo'; m.come = TurnoJanta.COMENDO;
    if (m.espera > TurnoJanta.PACIENCIA_PRATO / 2) m.rapido = false;
    m.reacao = m.certo ? Pensao.prato(m.prato).reacao : 'nojo';
    this.eventos.push({ tipo: 'reacao', mesa: i, reacao: m.reacao });
    // (as cenas de prato, 14/10) o prato chegou à banqueta: o lugar único da entrega (a cena do Bancho decide se toca, cena_prato.js)
    // (14/10, os sons) com a reação e a nota que o prato daria agora: o cliente que gostou (4★ ou mais) faz "huum, delícia!"
    this.eventos.push({ tipo: 'servido', mesa: i, prato: m.prato, cliente: m.cliente, certo: m.certo, reacao: m.reacao, estrelas: this._nota(m) });
    return true;
  }
  // A nota (estrelas) do prato desta banqueta, com o que se sabe agora (a bebida servida depois ainda pode subir).
  _nota(m) {
    const gostaSalada = m.cliente.mania === 'feijao' && m.salada;
    const sabor = Pratos.RARIDADE_SABOR[clamp(m.raridade, 1, 4)];
    // (Tarefa C) a bebida derramada não dá a estrela da bebida
    const bebida = m.modo === 'antigo' ? m.bebidaCerta : (!m.querBebida || (m.bebidaServida && !m.bebidaRuim));
    const est = Pensao.estrelas(m.rapido, m.certo, sabor, bebida, gostaSalada);
    return m.prato === Pensao.CASA ? Math.min(ECO.pensao.pratoCasa.estrelas, est) : est;
  }
  // O preço do prato de quem foi embora esperando ele (a receita perdida do fechamento): o preço de tabela, com o da festa.
  _precoPerdido(m) {
    if (!m.prato) return 0;
    if (m.prato === Pensao.CASA) return ECO.pensao.pratoCasa.preco;
    return Math.round(this.pensao.preco(m.prato, m.raridade) * (this.pratoTema && m.prato === this.pratoTema ? 1.5 : 1));
  }
  _pagar(i) {
    const m = this.mesas[i];
    if (m.cliente.convidado) this.relatorio.convidadosServidos = (this.relatorio.convidadosServidos || 0) + 1;
    // O prato da casa (o Norimaki do Dave): o preço fixo do ECO, sem gorjeta nem curtida, e a nota fica no máximo em pratoCasa.estrelas.
    const casa = m.prato === Pensao.CASA, C = ECO.pensao.pratoCasa;
    const est = this._nota(m);
    const preco = casa ? C.preco : Math.round(this.pensao.preco(m.prato, m.raridade) * (this.pratoTema && m.prato === this.pratoTema ? 1.5 : 1) * (m.cafeAntes && m.bebidaMedida ? ECO.cafeBoasVindas : 1));
    const gorj = casa ? 0 : Pensao.gorjeta(preco, est) + (m.bebidaMedida && TurnoJanta.gorjetaDaMedida(m.bebida) ? Math.round(preco * TurnoJanta.GORJETA_MEDIDA) : 0) + (this.gorjetaExtra > 0 ? Math.ceil(preco * this.gorjetaExtra * est / 5) : 0);
    const r = this.relatorio;
    r.servidos++; r.ganho += preco; r.vendaPratos += preco; r.estrelas += est; if (casa) { r.casa++; r.estrelasCasa += est; }
    // No balcão a gorjeta fica em moedas até o Jocelino recolher (no salão antigo entra direto).
    if (m.modo === 'antigo') r.gorjeta += gorj; else if (gorj > 0) this.moedas.push({ mesa: i, valor: gorj });
    if (est >= 4 && !casa) r.curtidas++;
    if (!casa) r.pratos[m.prato] = (r.pratos[m.prato] || 0) + 1;
    this.eventos.push({ tipo: 'pagou', mesa: i, valor: preco + gorj, estrelas: est, gorjeta: gorj, modo: m.modo });
    if (m.cliente.favorito && m.prato === m.cliente.favorito && est >= 3 && !r.favoritos.includes(m.cliente.id)) { r.favoritos.push(m.cliente.id); r.curtidas++; this.eventos.push({ tipo: 'favorito', mesa: i, cliente: m.cliente }); }
    if (m.cliente.mania === 'paladar') { r.paladar = Paladar.nota({ rapido: m.rapido, louca: this.mesas.filter(o => o.estado === 'suja').length, medida: m.bebidaMedida, nivel: this.pensao.nivel(m.prato), raridade: m.raridade });
      if (casa) r.paladar = Math.min(r.paladar, C.paladarMax); }   // o Paladar com o prato da casa: no máximo o do cafezinho
    if (m.cliente.mania === 'vip') { r.vip = 'servido'; this.eventos.push({ tipo: 'vip_servido', mesa: i, cliente: m.cliente }); }
    if (!m.vezes) r.comeram = (r.comeram || 0) + 1;   // (tarefa 7) a pessoa que comeu, uma vez (o Tonhão repete o prato)
    m.vezes++;
    // Tonhão pede de novo até 3 vezes (e a banqueta nem chega a sujar).
    if (m.cliente.mania === 'tres' && m.vezes < 3) {
      Object.assign(m, { estado: 'pedido', espera: 0, prato: '', pronto: false, montado: false, bebidaServida: false, bebidaMedida: false, bebidaRuim: false, bebidaNota: '', esperaCerveja: 0, lendo: m.modo === 'antigo' ? 0 : TurnoJanta.LENDO });
      return;
    }
    m.estado = 'suja';
  }
  zezinhoApronta() {
    if (this.filho !== 'zezinho') return '';
    const p = this.pensao;
    if (!this._roubou && p.porcoes && p.porcoes('cocada_tijolinho') > 0) {
      p.panela.cocada_tijolinho--; if (p.panela.cocada_tijolinho <= 0) delete p.panela.cocada_tijolinho;
      this._seAcabou('cocada_tijolinho');
      this._roubou = true; this.eventos.push({ tipo: 'zezinho_cocada' }); return 'cocada';
    }
    const i = this.mesas.findIndex(m => m.estado === 'suja');
    if (i >= 0) { this.mesas[i] = this._mesaLivre(); this.eventos.push({ tipo: 'zezinho_louca', mesa: i }); return 'louca'; }
    return '';
  }
  limpar(i) { if (!this.mesas[i] || this.mesas[i].estado !== 'suja') return false; this.mesas[i] = this._mesaLivre(); return true; }
  mesaPronta() { return this.mesas.findIndex(m => m.estado === 'prato' && m.pronto && !m.montado); }
  // A janta acaba quando não sobra ninguém (fila vazia depois da última chegada e nenhuma banqueta ocupada) ou à meia-noite.
  encerrado(minutos) {
    if (minutos >= TurnoJanta.FECHA_MAX) return true;
    if (minutos < TurnoJanta.ULTIMA_CHEGADA || this._fila.length) return false;
    return !this.mesas.some(m => ['chegando', 'pedido', 'prato', 'comendo'].includes(m.estado));
  }
  // Fecha a janta: quem está comendo paga; quem esperava vai embora sem castigo.
  fechar() {
    this.mesas.forEach((m, i) => { if (m.estado === 'comendo') this._pagar(i); });
    for (const x of this.moedas) this.relatorio.gorjeta += x.valor;   // a Rosa recolhe o que sobrou no balcão
    if (this.filho === 'ritinha' && this.relatorio.gorjeta > 0) { const extra = Math.ceil(this.relatorio.gorjeta * Clientela.GORJETA_RITINHA); this.relatorio.gorjeta += extra; this.relatorio.ritinha = extra; }
    this.moedas = [];
    this.relatorio.desperdicio += this.passe.length + this.bandeja.filter(x => x.tipo !== 'louca').length;
    this.passe = []; this.bandeja = []; this.fogo = [];
    // (o cardápio do Bancho, 13/10) A sobra das panelas vai para o lixo (no Dave, o que sobra no cardápio é descartado).
    this.relatorio.sobra = this.pensao ? this.pensao.jogarSobra() : {};
    // (Tarefa A) os números que só fecham no fim: o mais pedido e os gargalos (segundos inteiros)
    const r = this.relatorio, g = r.gargalos;
    r.maisPedido = TurnoJanta.maisPedido(r.pedidos);
    g.farinhaVazia = Math.round(g.farinhaVazia); g.esperaMedia = this._esperaN ? Math.round(this._esperaSoma / this._esperaN) : 0;
    return r;
  }
  // O Jocelino faltou: a Rosa serve sozinha até ROSA_MAX clientes (sem gorjeta, 3 estrelas cada). (o cardápio do Bancho, 13/10;
  // correção 1) Ela cozinha sob demanda, sem montar o cardápio inteiro: o cliente que chega sem porção na panela faz ela preparar 1
  // panela do primeiro prato do cardápio da noite anterior (p.cardapioNoite, panelas > 0, com ingrediente, nas vagas do degrau). O
  // limite de cada prato são as panelas escolhidas; com o "repõe" ligado, ela repõe enquanto a despensa der. Nada dá: o prato da
  // casa. No fim, a sobra vai para o lixo (como no fechar).
  static rosaSozinha(p, rng) {
    const r = TurnoJanta.relatorioVazio(), C = ECO.pensao.pratoCasa, esc = p.cardapioNoite || {}, feitas = {};
    const cozinha = () => {
      for (const o of Object.keys(esc)) {
        const e = esc[o], n = feitas[o] || 0;
        if ((e.panelas | 0) <= 0 || !p.receitas.includes(o) || (!e.repoe && n >= e.panelas)) continue;
        if (!n && Object.keys(feitas).length >= p.vagas()) continue;
        const f = p.prepararPanela(o, 1, rng);
        if (f.feitas) { feitas[o] = n + 1; return o; }
        if (!r.faltou.includes(o)) { r.faltou.push(o); r.ingredientes = Object.assign(r.ingredientes || {}, { [o]: f.faltou }); }   // (onda final) o que faltou, para o resumo
      }
      return '';
    };
    for (let k = 0; k < TurnoJanta.ROSA_MAX; k++) {
      const id = p.pratosDaNoite()[0] || cozinha();
      r.servidos++; r.clientes++; r.comeram = (r.comeram || 0) + 1;
      if (!id) { const e = Math.min(C.estrelas, 3); r.casa++; r.estrelas += e; r.estrelasCasa += e; r.ganho += C.preco; r.vendaPratos += C.preco; continue; }
      const rar = p.servirPorcao(id), v = p.preco(id, rar);
      r.ganho += v; r.vendaPratos += v; r.estrelas += 3; r.pratos[id] = (r.pratos[id] || 0) + 1; r.pedidos[id] = (r.pedidos[id] || 0) + 1;
    }
    r.sobra = p.jogarSobra(); r.maisPedido = TurnoJanta.maisPedido(r.pedidos);
    return r;
  }
}
