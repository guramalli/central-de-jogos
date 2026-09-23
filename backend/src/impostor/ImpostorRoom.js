import {
  validarDica,
  chuteCorreto,
  apurarVotos,
  calcularPontuacao,
  embaralhar,
} from "./regras.js";

// O IMPOSTOR — motor de UMA sala (só memória).
//
//   LOBBY → CARTAS (10s) → DICAS (rodada 1, rodada 2) → VOTACAO (30s)
//         → REVELACAO → (ULTIMA_CHANCE 15s) → FIM → LOBBY
//
// A sala não conhece socket nem banco. Tudo que sai dela passa por
// `enviar(userId, evento, dados)`, que o socketImpostor liga num emit POR
// SOCKET do jogador — nunca broadcast. Isso é o que garante, num ponto só,
// que a palavra não vaza pro impostor: cada pacote é montado pra uma pessoa.
//
// O QUE NUNCA SAI ANTES DA HORA:
//   - a palavra: só na carta dos tripulantes, e pra todos só no FIM (depois
//     da última chance);
//   - quem é o impostor: só a partir da REVELACAO;
//   - em quem cada um votou: nunca. Na revelação sai só a contagem.

export const FASES = {
  LOBBY: "LOBBY",
  CARTAS: "CARTAS",
  DICAS: "DICAS",
  VOTACAO: "VOTACAO",
  REVELACAO: "REVELACAO",
  ULTIMA_CHANCE: "ULTIMA_CHANCE",
  FIM: "FIM",
};

export const CONFIG = {
  MIN_JOGADORES: 4,
  MAX_JOGADORES: 12,
  MIN_PARA_CONTINUAR: 3, // abaixo disso a partida é encerrada
  RODADAS: 2,
  SEG_CARTAS: 10,
  SEG_DICA: 30,
  SEG_VOTACAO: 30,
  // A revelação é uma animação no cliente ("A VERDADE", votos um a um,
  // suspense, nome do acusado). O servidor só segura a fase por esse tempo.
  SEG_REVELACAO: 7,
  SEG_ULTIMA_CHANCE: 15,
  SEG_FIM: 90, // sem o anfitrião clicar em "Próxima partida", volta sozinho
  SEG_TOLERANCIA: 30, // quem cai continua na partida por esse tempo
  SEG_TOLERANCIA_SALA: 20, // no lobby/fim: tempo pra voltar (recarregar a página) sem perder a vaga
  MAX_CHUTE: 40,
};

const CORES = [
  "#7FD1FF", "#C9A7FF", "#8BE3B5", "#FF9F8A", "#FFB547", "#FF8FC7",
  "#9FB4FF", "#F2D16B", "#6FE0E0", "#D6A2E8", "#B5E36B", "#FFA95E",
];

const EM_PARTIDA = new Set([FASES.CARTAS, FASES.DICAS, FASES.VOTACAO, FASES.REVELACAO, FASES.ULTIMA_CHANCE]);
const COM_REVELACAO = new Set([FASES.REVELACAO, FASES.ULTIMA_CHANCE, FASES.FIM]);

export class ImpostorRoom {
  // sortearPalavra: async (sala) => { tema, palavra }
  // aoFimDePartida: (resultado) => void — grava no banco (socketImpostor)
  constructor({ codigo, enviar, sortearPalavra, aoFimDePartida = null, aleatorio = Math.random, config = {} }) {
    this.codigo = codigo;
    this.enviar = enviar;
    this.sortearPalavra = sortearPalavra;
    this.aoFimDePartida = aoFimDePartida;
    this.aleatorio = aleatorio;
    this.cfg = { ...CONFIG, ...config };
    this.jogadores = new Map(); // userId -> jogador
    this.anfitriaoId = null;
    this.fase = FASES.LOBBY;
    this.partida = null;
    this.iniciando = false;
    this.timer = null;
    this.prazo = null;
    this.tique = null;
    this.historico = []; // palavras já usadas nesta sala (palavras.js evita repetir)
  }

  // ---------------- consultas ----------------
  conectado(j) { return j.sockets.size > 0; }
  conectados() { return [...this.jogadores.values()].filter((j) => this.conectado(j)); }
  vazia() { return this.conectados().length === 0; }
  // Quem está NA partida agora (inclui quem caiu e ainda está na tolerância).
  ativos() { return [...this.jogadores.values()].filter((j) => j.naPartida); }
  ehAtivo(id) { return !!this.jogadores.get(id)?.naPartida; }
  get vezDe() {
    const p = this.partida;
    return this.fase === FASES.DICAS && p ? p.ordem[p.vez] ?? null : null;
  }

  // ---------------- entrada e saída ----------------
  entrar(user, socketId) {
    let j = this.jogadores.get(user.id);
    if (!j) {
      if (this.jogadores.size >= this.cfg.MAX_JOGADORES) return `Sala cheia (${this.cfg.MAX_JOGADORES} jogadores).`;
      j = {
        id: user.id,
        nickname: user.nickname,
        cor: this.corLivre(),
        sockets: new Set(),
        naPartida: false,
        cartaVista: false,
        timerSaida: null,
      };
      this.jogadores.set(user.id, j);
    }
    j.sockets.add(socketId);
    if (j.timerSaida) { clearTimeout(j.timerSaida); j.timerSaida = null; }
    this.ajustarAnfitriao();
    // Voltou de uma queda no meio da partida: recebe a carta de novo.
    if (j.naPartida && EM_PARTIDA.has(this.fase)) this.enviarCarta(j);
    this.transmitir();
    return null;
  }

  // Conexão caiu (ou fechou a aba). Ninguém sai na hora: na partida são 30s
  // de tolerância; no lobby/fim, SEG_TOLERANCIA_SALA — sem isso, o anfitrião
  // que recarregava a página perdia o posto (e, se passasse pra um bot,
  // ninguém mais conseguia iniciar).
  sair(socketId) {
    const j = [...this.jogadores.values()].find((x) => x.sockets.has(socketId));
    if (!j) return;
    j.sockets.delete(socketId);
    if (this.conectado(j)) return;
    if (j.naPartida && EM_PARTIDA.has(this.fase)) {
      j.timerSaida = setTimeout(() => this.protegido(() => this.removerDaPartida(j.id)), this.cfg.SEG_TOLERANCIA * 1000);
      if (this.fase === FASES.CARTAS) this.conferirCartasVistas();
      if (this.fase === FASES.VOTACAO) this.conferirVotacaoCompleta();
      this.transmitir();
      return;
    }
    this.segurarVaga(j);
    this.transmitir();
  }

  segurarVaga(j) {
    if (j.timerSaida) clearTimeout(j.timerSaida);
    j.timerSaida = setTimeout(() => this.protegido(() => this.removerDaSala(j.id)), this.cfg.SEG_TOLERANCIA_SALA * 1000);
  }

  // Fim da tolerância fora de partida: sai da sala.
  removerDaSala(id) {
    const j = this.jogadores.get(id);
    if (!j || this.conectado(j) || (j.naPartida && EM_PARTIDA.has(this.fase))) return;
    if (j.timerSaida) { clearTimeout(j.timerSaida); j.timerSaida = null; }
    this.jogadores.delete(id);
    this.ajustarAnfitriao();
    this.transmitir();
  }

  // Botão "Sair da sala": sai de vez, sem tolerância.
  sairDeVez(userId) {
    const j = this.jogadores.get(userId);
    if (!j) return;
    j.sockets.clear();
    if (j.timerSaida) { clearTimeout(j.timerSaida); j.timerSaida = null; }
    if (j.naPartida && EM_PARTIDA.has(this.fase)) this.removerDaPartida(userId);
    else { this.jogadores.delete(userId); this.ajustarAnfitriao(); this.transmitir(); }
  }

  removerDaPartida(id) {
    const j = this.jogadores.get(id);
    if (!j || !j.naPartida || !EM_PARTIDA.has(this.fase)) return;
    if (j.timerSaida) { clearTimeout(j.timerSaida); j.timerSaida = null; }
    j.naPartida = false;
    if (!this.conectado(j)) this.jogadores.delete(id);
    this.ajustarAnfitriao();
    const p = this.partida;

    if (id === p.impostorId) return this.cancelar("impostor_saiu");
    if (this.ativos().length < this.cfg.MIN_PARA_CONTINUAR) return this.cancelar("poucos_jogadores");

    if (this.fase === FASES.CARTAS) this.conferirCartasVistas();
    if (this.fase === FASES.DICAS && this.vezDe === id) return this.proximaVez();
    if (this.fase === FASES.VOTACAO) { p.votos.delete(id); this.conferirVotacaoCompleta(); }
    this.transmitir();
  }

  corLivre() {
    const usadas = new Set([...this.jogadores.values()].map((j) => j.cor));
    return CORES.find((c) => !usadas.has(c)) || CORES[this.jogadores.size % CORES.length];
  }

  // O anfitrião só é trocado quando sai de vez — não durante a tolerância.
  ajustarAnfitriao() {
    const atual = this.jogadores.get(this.anfitriaoId);
    if (atual && (this.conectado(atual) || atual.timerSaida)) return;
    this.anfitriaoId = this.conectados()[0]?.id || null;
  }

  // ---------------- início ----------------
  async iniciar(userId) {
    if (this.fase !== FASES.LOBBY) return "A partida já começou.";
    if (userId !== this.anfitriaoId) return "Só o anfitrião inicia a partida.";
    if (this.iniciando) return "A partida já está começando.";
    if (this.conectados().length < this.cfg.MIN_JOGADORES) return `Precisa de pelo menos ${this.cfg.MIN_JOGADORES} jogadores.`;

    this.iniciando = true;
    let sorteio;
    try {
      sorteio = await this.sortearPalavra(this);
    } catch (err) {
      console.error("Impostor: falha ao sortear palavra:", err.message);
      return "Não foi possível sortear a palavra. Tente de novo.";
    } finally {
      this.iniciando = false;
    }
    if (!sorteio?.tema || !sorteio?.palavra) return "Não foi possível sortear a palavra. Tente de novo.";

    // Alguém pode ter saído durante o sorteio (que vai ao banco).
    if (this.fase !== FASES.LOBBY) return "A partida já começou.";
    const participantes = this.conectados();
    if (participantes.length < this.cfg.MIN_JOGADORES) return `Precisa de pelo menos ${this.cfg.MIN_JOGADORES} jogadores.`;

    const impostor = participantes[Math.floor(this.aleatorio() * participantes.length)];
    for (const j of this.jogadores.values()) { j.naPartida = false; j.cartaVista = false; }
    for (const j of participantes) j.naPartida = true;
    this.historico.push(sorteio.palavra);
    if (this.historico.length > 50) this.historico.shift();

    this.partida = {
      tema: sorteio.tema,
      palavra: sorteio.palavra,
      impostorId: impostor.id,
      participantes: participantes.map((j) => j.id),
      // Nome e cor guardados na largada: quem sai no meio some de
      // `jogadores`, mas continua aparecendo nas dicas e no resultado.
      nomes: Object.fromEntries(participantes.map((j) => [j.id, { nickname: j.nickname, cor: j.cor }])),
      rodada: 0,
      ordem: [],
      vez: -1,
      dicas: [],
      votos: new Map(),
      apuracao: null,
      descoberto: false,
      chute: null,
      adivinhou: false,
      vencedor: null,
      motivo: null,
      pontos: {},
    };

    this.fase = FASES.CARTAS;
    for (const j of participantes) this.enviarCarta(j);
    this.agendar(this.cfg.SEG_CARTAS, () => this.iniciarDicas());
    this.transmitir();
    return null;
  }

  // A CARTA: emissão individual. O impostor recebe só o tema.
  enviarCarta(j) {
    const p = this.partida;
    if (!p) return;
    const carta = j.id === p.impostorId
      ? { papel: "impostor", tema: p.tema }
      : { papel: "tripulante", tema: p.tema, palavra: p.palavra };
    this.enviar(j.id, "impostor-carta", carta);
  }

  cartaVista(userId) {
    if (this.fase !== FASES.CARTAS) return "Agora não é hora da carta.";
    const j = this.jogadores.get(userId);
    if (!j?.naPartida) return "Você não está nesta partida.";
    j.cartaVista = true;
    if (!this.conferirCartasVistas()) this.transmitir();
    return null;
  }

  // Todos os conectados já viram a carta: não precisa esperar os 10s.
  conferirCartasVistas() {
    const faltam = this.ativos().filter((j) => this.conectado(j) && !j.cartaVista);
    if (faltam.length > 0) return false;
    this.iniciarDicas();
    return true;
  }

  // ---------------- dicas ----------------
  iniciarDicas() {
    this.partida.rodada = 1;
    this.novaRodadaDeDicas();
  }

  novaRodadaDeDicas() {
    const p = this.partida;
    p.ordem = embaralhar(this.ativos().map((j) => j.id), this.aleatorio);
    p.vez = -1;
    this.fase = FASES.DICAS;
    this.proximaVez();
  }

  proximaVez() {
    const p = this.partida;
    for (;;) {
      p.vez++;
      if (p.vez >= p.ordem.length) {
        if (p.rodada < this.cfg.RODADAS) { p.rodada++; return this.novaRodadaDeDicas(); }
        return this.iniciarVotacao();
      }
      const j = this.jogadores.get(p.ordem[p.vez]);
      if (!j?.naPartida) continue; // saiu de vez: pula
      if (!this.conectado(j)) { this.registrarDica(j.id, ""); continue; } // caído: dica em branco
      break;
    }
    const quem = p.ordem[p.vez];
    this.agendar(this.cfg.SEG_DICA, () => {
      this.registrarDica(quem, ""); // estourou o tempo: fica em branco
      this.proximaVez();
    });
    this.transmitir();
  }

  registrarDica(jogadorId, texto) {
    this.partida.dicas.push({ rodada: this.partida.rodada, jogadorId, texto });
  }

  darDica(userId, texto) {
    if (this.fase !== FASES.DICAS) return "Agora não é hora de dar dica.";
    if (!this.ehAtivo(userId)) return "Você não está nesta partida.";
    if (this.vezDe !== userId) return "Não é a sua vez.";
    const p = this.partida;
    // Pro impostor, sem checar contra a palavra (ver validarDica).
    const r = validarDica(texto, userId === p.impostorId ? null : p.palavra);
    if (r.erro) return r.erro;
    this.registrarDica(userId, r.dica);
    this.proximaVez();
    return null;
  }

  // ---------------- votação ----------------
  iniciarVotacao() {
    this.fase = FASES.VOTACAO;
    this.partida.votos = new Map();
    this.agendar(this.cfg.SEG_VOTACAO, () => this.apurar());
    this.transmitir();
  }

  votar(userId, alvoId) {
    if (this.fase !== FASES.VOTACAO) return "Agora não é hora de votar.";
    if (!this.ehAtivo(userId)) return "Você não está nesta partida.";
    const p = this.partida;
    if (p.votos.has(userId)) return "Você já votou.";
    if (alvoId === userId) return "Você não pode votar em si mesmo.";
    if (!this.ehAtivo(alvoId)) return "Esse jogador não está na partida.";
    p.votos.set(userId, alvoId);
    if (!this.conferirVotacaoCompleta()) this.transmitir();
    return null;
  }

  // Todos os conectados votaram: apura sem esperar o tempo.
  conferirVotacaoCompleta() {
    const p = this.partida;
    const faltam = this.ativos().filter((j) => this.conectado(j) && !p.votos.has(j.id));
    if (faltam.length > 0) return false;
    this.apurar();
    return true;
  }

  apurar() {
    const p = this.partida;
    p.apuracao = apurarVotos(p.votos, this.ativos().map((j) => j.id));
    p.descoberto = p.apuracao.acusadoId === p.impostorId;
    this.fase = FASES.REVELACAO;
    this.agendar(this.cfg.SEG_REVELACAO, () => (p.descoberto ? this.iniciarUltimaChance() : this.finalizar()));
    this.transmitir();
  }

  // ---------------- última chance ----------------
  iniciarUltimaChance() {
    this.fase = FASES.ULTIMA_CHANCE;
    this.agendar(this.cfg.SEG_ULTIMA_CHANCE, () => this.finalizar()); // sem chute = errou
    this.transmitir();
  }

  chutar(userId, texto) {
    if (this.fase !== FASES.ULTIMA_CHANCE) return "Agora não é hora de chutar.";
    const p = this.partida;
    if (userId !== p.impostorId) return "Só o impostor pode chutar a palavra.";
    const chute = String(texto ?? "").trim().slice(0, this.cfg.MAX_CHUTE);
    if (!chute) return "Escreva a palavra.";
    p.chute = chute;
    p.adivinhou = chuteCorreto(chute, p.palavra);
    this.finalizar();
    return null;
  }

  // ---------------- fim ----------------
  finalizar() {
    const p = this.partida;
    const { vencedor, pontos } = calcularPontuacao({
      jogadores: this.ativos().map((j) => j.id),
      impostorId: p.impostorId,
      votos: p.votos,
      descoberto: p.descoberto,
      adivinhou: p.adivinhou,
    });
    p.vencedor = vencedor;
    p.pontos = pontos;
    p.motivo = p.apuracao?.empate ? "empate" : !p.descoberto ? "inocente" : p.adivinhou ? "adivinhou" : "errou";
    this.encerrarPartida();
  }

  // Impostor saiu de vez, ou ficou gente de menos: ninguém pontua.
  cancelar(motivo) {
    const p = this.partida;
    p.vencedor = "cancelada";
    p.motivo = motivo;
    p.pontos = {};
    this.encerrarPartida();
  }

  encerrarPartida() {
    this.fase = FASES.FIM;
    // Quem estava caído passa pra tolerância da sala (pode voltar a tempo
    // de ver o resultado e jogar a próxima).
    for (const j of this.jogadores.values()) {
      if (j.timerSaida) { clearTimeout(j.timerSaida); j.timerSaida = null; }
      if (!this.conectado(j)) this.segurarVaga(j);
    }
    this.agendar(this.cfg.SEG_FIM, () => this.voltarAoLobby());
    try { this.aoFimDePartida?.(this.resultado()); } catch (err) { console.error("Impostor: falha ao gravar a partida:", err); }
    this.transmitir();
  }

  resultado() {
    const p = this.partida;
    return {
      sala: this.codigo,
      tema: p.tema,
      palavra: p.palavra,
      impostorId: p.impostorId,
      acusadoId: p.apuracao?.acusadoId ?? null,
      vencedor: p.vencedor,
      motivo: p.motivo,
      pontos: { ...p.pontos },
      participantes: [...p.participantes],
    };
  }

  // "Próxima partida" (anfitrião) — ou sozinho depois de SEG_FIM.
  proxima(userId) {
    if (this.fase !== FASES.FIM) return "A partida ainda não acabou.";
    if (userId !== this.anfitriaoId) return "Só o anfitrião começa a próxima.";
    this.voltarAoLobby();
    return null;
  }

  voltarAoLobby() {
    this.pararRelogio();
    this.partida = null;
    this.fase = FASES.LOBBY;
    for (const j of this.jogadores.values()) { j.naPartida = false; j.cartaVista = false; }
    this.transmitir();
  }

  // ---------------- relógio ----------------
  // Um timer por fase, controlado aqui. O cliente só mostra o restante.
  agendar(segundos, fn) {
    if (this.timer) clearTimeout(this.timer);
    this.prazo = Date.now() + segundos * 1000;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.protegido(fn);
    }, segundos * 1000);
    if (!this.tique) {
      this.tique = setInterval(() => this.protegido(() => this.enviarTempo()), 1000);
    }
  }

  restanteMs() {
    return this.prazo ? Math.max(0, this.prazo - Date.now()) : null;
  }

  enviarTempo() {
    const dados = { fase: this.fase, restanteMs: this.restanteMs() };
    for (const j of this.conectados()) this.enviar(j.id, "impostor-tempo", dados);
  }

  pararRelogio() {
    if (this.timer) clearTimeout(this.timer);
    if (this.tique) clearInterval(this.tique);
    this.timer = this.tique = this.prazo = null;
  }

  // Sala descartada: nenhum timer pode continuar vivo.
  parar() {
    this.pararRelogio();
    for (const j of this.jogadores.values()) if (j.timerSaida) clearTimeout(j.timerSaida);
  }

  // Um erro num callback de timer não pode travar a sala nem o servidor.
  protegido(fn) {
    try { fn(); } catch (err) { console.error(`Impostor [${this.codigo}]: erro no ciclo da sala:`, err); }
  }

  // ---------------- estado (por jogador) ----------------
  // Montado campo a campo, de propósito: nada entra aqui "de carona".
  estadoPara(uid) {
    const p = this.partida;
    const estado = {
      codigo: this.codigo,
      fase: this.fase,
      euId: uid,
      anfitriaoId: this.anfitriaoId,
      minJogadores: this.cfg.MIN_JOGADORES,
      maxJogadores: this.cfg.MAX_JOGADORES,
      restanteMs: this.fase === FASES.LOBBY ? null : this.restanteMs(),
      jogadores: [...this.jogadores.values()].map((j) => ({
        id: j.id,
        nickname: j.nickname,
        cor: j.cor,
        anfitriao: j.id === this.anfitriaoId,
        conectado: this.conectado(j),
        naPartida: j.naPartida,
      })),
    };
    if (!p) return estado;

    estado.tema = p.tema;
    estado.nomes = p.nomes;
    estado.participo = p.participantes.includes(uid);
    estado.rodada = p.rodada;
    estado.totalRodadas = this.cfg.RODADAS;
    estado.ordem = [...p.ordem];
    estado.vezDe = this.vezDe;
    estado.dicas = p.dicas.map((d) => ({ rodada: d.rodada, jogadorId: d.jogadorId, texto: d.texto }));

    if (this.fase === FASES.CARTAS) {
      estado.cartasVistas = this.ativos().filter((j) => j.cartaVista).length;
      estado.cartaVista = !!this.jogadores.get(uid)?.cartaVista;
    }
    if (this.fase === FASES.VOTACAO) {
      estado.votaram = p.votos.size;
      estado.totalVotantes = this.ativos().length;
    }
    if (this.fase === FASES.VOTACAO || COM_REVELACAO.has(this.fase)) {
      estado.meuVoto = p.votos.get(uid) ?? null;
    }
    if (COM_REVELACAO.has(this.fase) && p.apuracao) {
      estado.revelacao = {
        contagem: p.apuracao.contagem.map((c) => ({ id: c.id, votos: c.votos })),
        acusadoId: p.apuracao.acusadoId,
        empate: p.apuracao.empate,
        impostorId: p.impostorId,
        descoberto: p.descoberto,
      };
    }
    if (this.fase === FASES.FIM) {
      // Só aqui, depois da última chance, a palavra vai pra todo mundo.
      estado.resultado = {
        vencedor: p.vencedor,
        motivo: p.motivo,
        impostorId: p.impostorId,
        palavra: p.palavra,
        chute: p.chute,
        adivinhou: p.adivinhou,
        pontos: { ...p.pontos },
      };
    }
    return estado;
  }

  transmitir() {
    for (const j of this.conectados()) this.enviar(j.id, "impostor-estado", this.estadoPara(j.id));
  }
}
