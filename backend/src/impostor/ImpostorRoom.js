import {
  validarTextoDaVez,
  validarResposta,
  chuteCorreto,
  apurarVotos,
  calcularPontuacao,
  embaralhar,
  normalizar,
  MODOS,
  LIMITES,
} from "./regras.js";
import { sortearConteudo as sortearConteudoPadrao, opcoesDoChute } from "./conteudoModos.js";
import { CerebroBot } from "./bots.js";

// O IMPOSTOR — motor de UMA sala (só memória).
//
//   LOBBY → CARTAS (10s) → DICAS (rodada 1, rodada 2) → VOTACAO (30s)
//         → REVELACAO → (ULTIMA_CHANCE 15s) → FIM → LOBBY
//
// No fim de cada rodada de dicas há uma pausa curta (SEG_ULTIMA_DICA), ainda
// na fase DICAS e sem ninguém na vez, pra todo mundo ler a última dica.
//
// MODOS (o anfitrião escolhe no lobby; a partida guarda o modo da largada):
//   palavra  — o original: tripulantes recebem tema + palavra (do banco),
//              o impostor só o tema. Dica = 1 palavra. Última chance digitada.
//   situacao — tripulantes recebem uma situação ("Na fila do SUS"), o
//              impostor nada. Dica de 1 a 3 palavras. Última chance: 6 opções.
//   historia — tripulantes recebem o tema de uma história, o impostor nada.
//              Na vez, cada um escreve UMA frase (até 120) continuando a
//              história (SEG_FRASE). Última chance: 6 opções.
//   pergunta — todos recebem uma pergunta; o impostor, outra parecida (e,
//              com PERGUNTA_IMPOSTOR_SABE = false, nem sabe que é o impostor).
//              LOBBY → CARTAS → RESPOSTAS (40s, todos ao mesmo tempo) →
//              CONFRONTO (10s: respostas na mesa, pergunta ainda escondida) →
//              VOTACAO (45s, agora com a pergunta da maioria) → REVELACAO →
//              FIM. SEM última chance: descoberto = tripulantes vencem.
//
// ---------------- PROTOCOLO (pro cliente) ----------------
// Cliente → servidor (todos com callback { ok } | { erro }):
//   impostor-modo     { modo }          anfitrião, só no LOBBY. modo ∈ MODOS.
//   impostor-iniciar  { modo? }         anfitrião; `modo` opcional (= impostor-modo antes).
//   impostor-dica     { texto }         DICAS: dica (palavra/situação) ou frase (história).
//   impostor-resposta { texto }         RESPOSTAS (pergunta): uma resposta, sem troca.
//   impostor-chute    { palavra } | { opcao }   ULTIMA_CHANCE. Palavra: texto.
//                                       Situação/História: `opcao` = índice (0–5) em
//                                       `estado.opcoes` (ou o texto exato da opção).
//   (os demais — carta-vista, votar, proxima, chat, bot, sair — não mudaram)
//
// Servidor → cliente:
//   impostor-carta (individual, a partir de CARTAS e de novo ao voltar de queda):
//     palavra : { papel: "impostor", tema } | { papel: "tripulante", tema, palavra }
//     situacao: { papel: "impostor" }       | { papel: "tripulante", situacao }
//     historia: { papel: "impostor" }       | { papel: "tripulante", historia }
//     pergunta: { pergunta }  (a sua; o impostor recebe a DELE, sem `papel`.
//               Com PERGUNTA_IMPOSTOR_SABE = true vai também `papel`.)
//   impostor-estado (por jogador) — além dos campos de sempre:
//     sempre: modo  (no LOBBY é o escolhido pra próxima; na partida, o dela)
//     LOBBY : modos [{ id, nome, descricao }]
//     na partida: limites { caracteres, palavras? } do texto do modo
//                 tema = categoria (palavra) ou "Situação"/"Pergunta"/"História"
//     DICAS (palavra/situacao/historia): dicas [{ rodada, jogadorId, texto }]
//             — na história, `texto` é a frase; a história é a lista em ordem.
//     RESPOSTAS: responderam (quantos), totalRespondentes, minhaResposta (só a sua | null)
//     CONFRONTO, VOTACAO, REVELACAO, FIM (pergunta):
//             respostas [{ jogadorId, texto }] (texto "" = em branco), ordem embaralhada
//     VOTACAO, REVELACAO, FIM (pergunta): perguntaReal (a da maioria)
//     ULTIMA_CHANCE (situacao/historia): opcoes [6 textos] (pra todos)
//     FIM: resultado ganha `modo`, `palavra` = o segredo (palavra, situação,
//          pergunta da maioria ou tema da história) e, na pergunta,
//          `perguntaImpostor`. `chute` = texto digitado ou opção escolhida.
//          motivo novo: "descoberto" (pergunta: impostor votado, sem última chance).
//
// A sala não conhece socket nem banco. Tudo que sai dela passa por
// `enviar(userId, evento, dados)`, que o socketImpostor liga num emit POR
// SOCKET do jogador — nunca broadcast. Isso é o que garante, num ponto só,
// que a palavra não vaza pro impostor: cada pacote é montado pra uma pessoa.
//
// O QUE NUNCA SAI ANTES DA HORA:
//   - a palavra: só na carta dos tripulantes, e pra todos só no FIM (depois
//     da última chance). Vale igual pro segredo dos outros modos (situação,
//     tema da história) — com a exceção das 6 opções da última chance, que
//     são justamente a pergunta feita ao impostor;
//   - pergunta: a da maioria só a partir da VOTACAO (depois do confronto
//     das respostas); a do impostor, pros outros, só no FIM; a resposta de
//     cada um só a partir do CONFRONTO;
//   - quem é o impostor: só a partir da REVELACAO;
//   - em quem cada um votou: nunca. Na revelação sai só a contagem.

export const FASES = {
  LOBBY: "LOBBY",
  CARTAS: "CARTAS",
  DICAS: "DICAS",
  RESPOSTAS: "RESPOSTAS",
  CONFRONTO: "CONFRONTO",
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
  // Pausa depois da ÚLTIMA dica de cada rodada: sem ela a tela pulava pra
  // próxima rodada (ou pra votação) e ninguém chegava a ler a última dica.
  SEG_ULTIMA_DICA: 4,
  // História: escrever uma frase inteira (até 120) no celular, depois de
  // ler as anteriores, leva bem mais que uma palavra — 45s em vez de 30.
  SEG_FRASE: 45,
  // Pergunta: todos respondem ao mesmo tempo (texto curto).
  SEG_RESPOSTA: 40,
  // Pergunta: as respostas ficam na mesa, sem a pergunta, pra todo mundo
  // ler (até 12) e desconfiar antes de a pergunta da maioria aparecer.
  SEG_CONFRONTO: 10,
  // Pergunta: a votação é também a discussão (comparar respostas com a
  // pergunta revelada), então tem mais tempo que a do modo Palavra.
  SEG_VOTACAO_PERGUNTA: 45,
  // Pergunta: o impostor sabe que é o impostor? false = não sabe (recebe só
  // a pergunta dele e responde "de boa fé"; descobre ao ver a pergunta real).
  PERGUNTA_IMPOSTOR_SABE: false,
  SEG_VOTACAO: 30,
  // A revelação é uma animação no cliente ("A VERDADE", votos um a um,
  // suspense, nome do acusado). O servidor só segura a fase por esse tempo.
  SEG_REVELACAO: 9,
  SEG_ULTIMA_CHANCE: 15,
  SEG_FIM: 90, // sem o anfitrião clicar em "Próxima partida", volta sozinho
  SEG_TOLERANCIA: 30, // quem cai continua na partida por esse tempo
  SEG_TOLERANCIA_SALA: 20, // no lobby/fim: tempo pra voltar (recarregar a página) sem perder a vaga
  MAX_CHUTE: 40,
  // Fase de testes: nenhuma partida grava ranking (e sala com bot nunca grava).
  VALE_RANKING: false,
  BOT_ATRASO: [1500, 5000], // ms entre o bot "pensar" e agir
  // Chat da sala (mesmos números do Tribunal/Mentira; o anti-flood por
  // conta — utils/antiFlood.js — fica no socketImpostor).
  MAX_MSG_CHAT: 300,
  MAX_HIST_CHAT: 60,
  MS_ENTRE_MSGS: 800,
};

const CORES = [
  "#7FD1FF", "#C9A7FF", "#8BE3B5", "#FF9F8A", "#FFB547", "#FF8FC7",
  "#9FB4FF", "#F2D16B", "#6FE0E0", "#D6A2E8", "#B5E36B", "#FFA95E",
];

const EM_PARTIDA = new Set([
  FASES.CARTAS, FASES.DICAS, FASES.RESPOSTAS, FASES.CONFRONTO, FASES.VOTACAO, FASES.REVELACAO, FASES.ULTIMA_CHANCE,
]);
const COM_REVELACAO = new Set([FASES.REVELACAO, FASES.ULTIMA_CHANCE, FASES.FIM]);
// Pergunta: fases em que as respostas estão na mesa / a pergunta real aparece.
const COM_RESPOSTAS = new Set([FASES.CONFRONTO, FASES.VOTACAO, FASES.REVELACAO, FASES.FIM]);
const COM_PERGUNTA_REAL = new Set([FASES.VOTACAO, FASES.REVELACAO, FASES.FIM]);

// Nome e explicação curta de cada modo (vão no estado do LOBBY).
export const INFO_MODOS = [
  { id: "palavra", nome: "Palavra", descricao: "Todos recebem uma palavra secreta; o impostor, só o tema. Dicas de uma palavra." },
  { id: "situacao", nome: "Situação", descricao: "Todos sabem onde estão; o impostor, não. Dicas de até 3 palavras." },
  { id: "pergunta", nome: "Pergunta", descricao: "Todos respondem a mesma pergunta; o impostor responde outra parecida." },
  { id: "historia", nome: "História", descricao: "Cada um escreve uma frase de uma história; o impostor não sabe o tema." },
];

// Modos com a última chance em múltipla escolha (os outros: palavra
// digitada; pergunta: sem última chance).
const CHUTE_COM_OPCOES = new Set(["situacao", "historia"]);

export class ImpostorRoom {
  // sortearPalavra: async (sala) => { tema, palavra }
  // aoFimDePartida: (resultado) => void — grava no banco (socketImpostor)
  // palavrasDoTema: (tema) => [palavras] — usado pelo bot impostor no chute
  // sortearConteudo: (modo, historico, aleatorio) => { tema, palavra, ... } —
  //   modos Situação/Pergunta/História (padrão: conteudoModos.js)
  constructor({
    codigo, enviar, sortearPalavra, aoFimDePartida = null, aleatorio = Math.random, config = {},
    palavrasDoTema = () => [], sortearConteudo = sortearConteudoPadrao,
  }) {
    this.codigo = codigo;
    this.enviar = enviar;
    this.sortearPalavra = sortearPalavra;
    this.sortearConteudo = sortearConteudo;
    this.modo = "palavra"; // escolhido pelo anfitrião no lobby
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
    this.palavrasDoTema = palavrasDoTema;
    this.cerebros = new Map(); // botId -> CerebroBot
    this.botsCriados = 0;
    this.chat = []; // últimas MAX_HIST_CHAT mensagens (quem entra recebe o histórico)
    this.chatSeq = 0;
    this.ultimaFala = new Map(); // userId -> ms da última mensagem
  }

  // ---------------- consultas ----------------
  // Bot não tem socket, mas está sempre "conectado".
  conectado(j) { return j.bot || j.sockets.size > 0; }
  conectados() { return [...this.jogadores.values()].filter((j) => this.conectado(j)); }
  humanosConectados() { return this.conectados().filter((j) => !j.bot); }
  temBots() { return [...this.jogadores.values()].some((j) => j.bot); }
  // Sala só com bots conta como vazia (é descartada como uma sala sem ninguém).
  vazia() { return this.humanosConectados().length === 0; }
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
    // Histórico do chat pra quem chegou (ou voltou de uma queda).
    this.enviar(user.id, "impostor-chat-historico", { mensagens: this.chat });
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
      if (this.fase === FASES.RESPOSTAS) this.conferirRespostasCompletas();
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
    if (this.fase === FASES.RESPOSTAS) { p.respostas.delete(id); if (this.conferirRespostasCompletas()) return; }
    if (this.fase === FASES.VOTACAO) { p.votos.delete(id); this.conferirVotacaoCompleta(); }
    this.transmitir();
  }

  // ---------------- bots de teste ----------------
  adicionarBot(userId) {
    if (userId !== this.anfitriaoId) return "Só o anfitrião chama bots.";
    if (this.fase !== FASES.LOBBY) return "Dá pra chamar bots só na sala de espera.";
    if (this.jogadores.size >= this.cfg.MAX_JOGADORES) return "Sala cheia.";
    this.botsCriados++;
    const id = `bot-${this.codigo}-${this.botsCriados}`;
    this.jogadores.set(id, {
      id, nickname: `Robô ${this.botsCriados}`, cor: this.corLivre(), bot: true,
      sockets: new Set(), naPartida: false, cartaVista: false, timerSaida: null,
    });
    this.cerebros.set(id, new CerebroBot(this, id, { palavrasDoTema: this.palavrasDoTema, atraso: this.cfg.BOT_ATRASO, aleatorio: this.aleatorio }));
    this.transmitir();
    return null;
  }

  removerBots(userId) {
    if (userId !== this.anfitriaoId) return "Só o anfitrião remove bots.";
    if (this.fase !== FASES.LOBBY) return "Dá pra remover bots só na sala de espera.";
    for (const j of [...this.jogadores.values()]) {
      if (!j.bot) continue;
      this.cerebros.get(j.id)?.parar();
      this.cerebros.delete(j.id);
      this.jogadores.delete(j.id);
    }
    this.botsCriados = 0;
    this.transmitir();
    return null;
  }

  // Todo pacote passa por aqui: pra gente vai pelo socket (enviar), pra
  // bot vai pro "cérebro" dele.
  entregar(uid, evento, dados) {
    const cerebro = this.cerebros.get(uid);
    if (cerebro) cerebro.receber(evento, dados);
    else this.enviar(uid, evento, dados);
  }

  corLivre() {
    const usadas = new Set([...this.jogadores.values()].map((j) => j.cor));
    return CORES.find((c) => !usadas.has(c)) || CORES[this.jogadores.size % CORES.length];
  }

  // O anfitrião só é trocado quando sai de vez — não durante a tolerância.
  ajustarAnfitriao() {
    const atual = this.jogadores.get(this.anfitriaoId);
    if (atual && !atual.bot && (this.conectado(atual) || atual.timerSaida)) return;
    this.anfitriaoId = this.humanosConectados()[0]?.id || null; // bot nunca é anfitrião
  }

  // ---------------- modo ----------------
  // Só no lobby (e não durante o sorteio de um início em andamento).
  definirModo(userId, modo) {
    if (userId !== this.anfitriaoId) return "Só o anfitrião escolhe o modo.";
    if (this.fase !== FASES.LOBBY || this.iniciando) return "Dá pra trocar o modo só na sala de espera.";
    if (!MODOS.includes(modo)) return "Modo de jogo desconhecido.";
    if (modo !== this.modo) { this.modo = modo; this.transmitir(); }
    return null;
  }

  // ---------------- início ----------------
  // `modo` opcional: o cliente pode mandar junto do "Iniciar".
  async iniciar(userId, modo) {
    if (this.fase !== FASES.LOBBY) return "A partida já começou.";
    if (userId !== this.anfitriaoId) return "Só o anfitrião inicia a partida.";
    if (this.iniciando) return "A partida já está começando.";
    if (modo != null) { const e = this.definirModo(userId, modo); if (e) return e; }
    if (this.conectados().length < this.cfg.MIN_JOGADORES) return `Precisa de pelo menos ${this.cfg.MIN_JOGADORES} jogadores.`;

    const modoDaPartida = this.modo;
    this.iniciando = true;
    let sorteio;
    try {
      sorteio = modoDaPartida === "palavra"
        ? await this.sortearPalavra(this)
        : this.sortearConteudo(modoDaPartida, this.historico, this.aleatorio);
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
      modo: modoDaPartida,
      tema: sorteio.tema,
      // O SEGREDO da partida em todos os modos: palavra, situação, pergunta
      // da maioria ou tema da história. Mesmo cuidado em todos.
      palavra: sorteio.palavra,
      perguntaImpostor: sorteio.perguntaImpostor ?? null, // só no modo pergunta
      respostas: new Map(), // pergunta: userId -> resposta
      respostasReveladas: null, // pergunta: [{ jogadorId, texto }] a partir do CONFRONTO
      opcoes: null, // última chance em múltipla escolha
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
    this.agendar(this.cfg.SEG_CARTAS, () => this.depoisDasCartas());
    this.transmitir();
    return null;
  }

  // A CARTA: emissão individual. O impostor recebe só o tema (Palavra),
  // nada (Situação/História) ou a pergunta DELE (Pergunta).
  enviarCarta(j) {
    const p = this.partida;
    if (!p) return;
    const ehImpostor = j.id === p.impostorId;
    let carta;
    if (p.modo === "situacao") carta = ehImpostor ? { papel: "impostor" } : { papel: "tripulante", situacao: p.palavra };
    else if (p.modo === "historia") carta = ehImpostor ? { papel: "impostor" } : { papel: "tripulante", historia: p.palavra };
    else if (p.modo === "pergunta") {
      carta = { pergunta: ehImpostor ? p.perguntaImpostor : p.palavra };
      if (this.cfg.PERGUNTA_IMPOSTOR_SABE) carta.papel = ehImpostor ? "impostor" : "tripulante";
    } else {
      carta = ehImpostor
        ? { papel: "impostor", tema: p.tema }
        : { papel: "tripulante", tema: p.tema, palavra: p.palavra };
    }
    this.entregar(j.id, "impostor-carta", carta);
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
    this.depoisDasCartas();
    return true;
  }

  // Pergunta vai pras respostas simultâneas; os outros modos, pras dicas.
  depoisDasCartas() {
    if (this.partida.modo === "pergunta") return this.iniciarRespostas();
    return this.iniciarDicas();
  }

  // ---------------- respostas (modo pergunta) ----------------
  iniciarRespostas() {
    this.fase = FASES.RESPOSTAS;
    this.partida.respostas = new Map();
    this.agendar(this.cfg.SEG_RESPOSTA, () => this.revelarRespostas()); // quem não respondeu fica em branco
    this.transmitir();
  }

  responder(userId, texto) {
    if (this.fase !== FASES.RESPOSTAS) return "Agora não é hora de responder.";
    if (!this.ehAtivo(userId)) return "Você não está nesta partida.";
    const p = this.partida;
    if (p.respostas.has(userId)) return "Você já respondeu.";
    const r = validarResposta(texto);
    if (r.erro) return r.erro;
    p.respostas.set(userId, r.resposta);
    if (!this.conferirRespostasCompletas()) this.transmitir();
    return null;
  }

  // Todos os conectados responderam: não precisa esperar os 40s.
  conferirRespostasCompletas() {
    const p = this.partida;
    const faltam = this.ativos().filter((j) => this.conectado(j) && !p.respostas.has(j.id));
    if (faltam.length > 0) return false;
    this.revelarRespostas();
    return true;
  }

  // Respostas na mesa, com autor, em ordem embaralhada (a ordem de chegada
  // entregaria quem hesitou). A pergunta da maioria ainda não aparece.
  revelarRespostas() {
    const p = this.partida;
    p.respostasReveladas = embaralhar(this.ativos().map((j) => j.id), this.aleatorio)
      .map((id) => ({ jogadorId: id, texto: p.respostas.get(id) ?? "" }));
    this.fase = FASES.CONFRONTO;
    this.agendar(this.cfg.SEG_CONFRONTO, () => this.iniciarVotacao());
    this.transmitir();
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
    p.ultimaDica = null;
    this.fase = FASES.DICAS;
    this.proximaVez();
  }

  proximaVez() {
    const p = this.partida;
    for (;;) {
      p.vez++;
      if (p.vez >= p.ordem.length) return this.fecharRodada();
      const j = this.jogadores.get(p.ordem[p.vez]);
      if (!j?.naPartida) continue; // saiu de vez: pula
      if (!this.conectado(j)) { this.registrarDica(j.id, ""); continue; } // caído: dica em branco
      break;
    }
    const quem = p.ordem[p.vez];
    const seg = p.modo === "historia" ? this.cfg.SEG_FRASE : this.cfg.SEG_DICA;
    this.agendar(seg, () => {
      this.registrarDica(quem, ""); // estourou o tempo: fica em branco
      this.proximaVez();
    });
    this.transmitir();
  }

  // Todos da rodada já falaram. Se a última dica de verdade (não em branco)
  // acabou de chegar, segura SEG_ULTIMA_DICA na tela antes de seguir — ainda
  // em DICAS, com a vez vazia (vezDe = null) e `ultimaDica` no estado pro
  // cliente destacá-la. Rodada fechada por tempo estourado ou por quem caiu
  // não pausa: a última dica "de verdade" já está na tela faz tempo.
  fecharRodada() {
    const p = this.partida;
    const seguir = () => {
      p.ultimaDica = null;
      if (p.rodada < this.cfg.RODADAS) { p.rodada++; return this.novaRodadaDeDicas(); }
      return this.iniciarVotacao();
    };
    const pausa = this.cfg.SEG_ULTIMA_DICA;
    const ultima = p.dicas.filter((d) => d.rodada === p.rodada && d.texto).at(-1);
    if (!(pausa > 0) || !ultima || Date.now() - ultima.em >= pausa * 1000) return seguir();
    p.ultimaDica = { rodada: ultima.rodada, jogadorId: ultima.jogadorId };
    this.agendar(pausa, seguir);
    this.transmitir();
  }

  // `em` fica só no servidor (decide a pausa da última dica); não vai no estado.
  registrarDica(jogadorId, texto) {
    this.partida.dicas.push({ rodada: this.partida.rodada, jogadorId, texto, em: Date.now() });
  }

  darDica(userId, texto) {
    if (this.fase !== FASES.DICAS) return "Agora não é hora de dar dica.";
    if (!this.ehAtivo(userId)) return "Você não está nesta partida.";
    if (this.vezDe !== userId) return "Não é a sua vez.";
    const p = this.partida;
    // Pro impostor, sem checar contra o segredo (ver validarDica). Na
    // história o "texto" é uma frase (validarFrase), nos outros uma dica.
    const r = validarTextoDaVez(p.modo, texto, userId === p.impostorId ? null : p.palavra);
    if (r.erro) return r.erro;
    this.registrarDica(userId, r.texto);
    this.proximaVez();
    return null;
  }

  // ---------------- chat ----------------
  // Texto livre, pra todo mundo da sala (inclusive quem só assiste). Não
  // tem trava de "spoiler": como nos outros jogos de festa, digitar a
  // palavra no chat é problema do jogador — o servidor nunca revela nada por
  // aqui. Vai pelo `enviar` (por socket, só pra quem está na sala), como
  // todo o resto; bot não recebe nem fala.
  mensagemChat(userId, texto) {
    const j = this.jogadores.get(userId);
    if (!j || j.bot) return "Você não está nesta sala.";
    const t = String(texto ?? "").replace(/\s+/g, " ").trim().slice(0, this.cfg.MAX_MSG_CHAT);
    if (!t) return null;
    const agora = Date.now();
    const antes = this.ultimaFala.get(userId);
    if (antes != null && agora - antes < this.cfg.MS_ENTRE_MSGS) return "Calma! Uma mensagem de cada vez.";
    this.ultimaFala.set(userId, agora);
    const msg = { id: ++this.chatSeq, uid: userId, nick: j.nickname, cor: j.cor, texto: t, em: agora };
    this.chat.push(msg);
    if (this.chat.length > this.cfg.MAX_HIST_CHAT) this.chat.splice(0, this.chat.length - this.cfg.MAX_HIST_CHAT);
    for (const h of this.humanosConectados()) this.enviar(h.id, "impostor-chat", msg);
    return null;
  }

  // ---------------- votação ----------------
  iniciarVotacao() {
    this.fase = FASES.VOTACAO;
    this.partida.votos = new Map();
    const seg = this.partida.modo === "pergunta" ? this.cfg.SEG_VOTACAO_PERGUNTA : this.cfg.SEG_VOTACAO;
    this.agendar(seg, () => this.apurar());
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
    // Pergunta não tem última chance: descoberto = tripulantes vencem.
    const temUltimaChance = p.descoberto && p.modo !== "pergunta";
    this.agendar(this.cfg.SEG_REVELACAO, () => (temUltimaChance ? this.iniciarUltimaChance() : this.finalizar()));
    this.transmitir();
  }

  // ---------------- última chance ----------------
  // Situação/História: múltipla escolha entre 6 (o segredo + 5 da mesma lista).
  iniciarUltimaChance() {
    const p = this.partida;
    if (CHUTE_COM_OPCOES.has(p.modo)) p.opcoes = opcoesDoChute(p.modo, p.palavra, this.aleatorio);
    this.fase = FASES.ULTIMA_CHANCE;
    this.agendar(this.cfg.SEG_ULTIMA_CHANCE, () => this.finalizar()); // sem chute = errou
    this.transmitir();
  }

  // `chute`: o texto digitado (Palavra) ou, nos modos com opções, o índice
  // da opção (número) ou o texto exato dela.
  chutar(userId, texto) {
    if (this.fase !== FASES.ULTIMA_CHANCE) return "Agora não é hora de chutar.";
    const p = this.partida;
    if (userId !== p.impostorId) return "Só o impostor pode chutar a palavra.";
    if (p.opcoes) {
      const escolhida = typeof texto === "number"
        ? p.opcoes[texto]
        : p.opcoes.find((o) => normalizar(o) === normalizar(texto));
      if (!escolhida) return "Escolha uma das opções.";
      p.chute = escolhida;
      p.adivinhou = escolhida === p.palavra;
      this.finalizar();
      return null;
    }
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
    p.motivo = p.apuracao?.empate ? "empate"
      : !p.descoberto ? "inocente"
      : p.modo === "pergunta" ? "descoberto" // sem última chance
      : p.adivinhou ? "adivinhou" : "errou";
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
      modo: p.modo,
      tema: p.tema,
      palavra: p.palavra,
      perguntaImpostor: p.perguntaImpostor,
      impostorId: p.impostorId,
      acusadoId: p.apuracao?.acusadoId ?? null,
      vencedor: p.vencedor,
      motivo: p.motivo,
      pontos: { ...p.pontos },
      participantes: [...p.participantes],
      comBots: p.participantes.some((id) => id.startsWith("bot-")),
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
    for (const j of this.humanosConectados()) this.enviar(j.id, "impostor-tempo", dados);
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
    for (const c of this.cerebros.values()) c.parar();
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
      temBots: this.temBots(),
      valeRanking: this.cfg.VALE_RANKING && !this.temBots(),
      restanteMs: this.fase === FASES.LOBBY ? null : this.restanteMs(),
      jogadores: [...this.jogadores.values()].map((j) => ({
        id: j.id,
        nickname: j.nickname,
        cor: j.cor,
        anfitriao: j.id === this.anfitriaoId,
        conectado: this.conectado(j),
        naPartida: j.naPartida,
        bot: !!j.bot,
      })),
      // No lobby: o modo escolhido pra próxima. Na partida: o dela.
      modo: p ? p.modo : this.modo,
    };
    if (this.fase === FASES.LOBBY) estado.modos = INFO_MODOS.map((m) => ({ ...m }));
    if (!p) return estado;

    estado.limites = { ...LIMITES[p.modo] };
    estado.tema = p.tema;
    estado.nomes = p.nomes;
    estado.participo = p.participantes.includes(uid);
    estado.rodada = p.rodada;
    estado.totalRodadas = this.cfg.RODADAS;
    estado.ordem = [...p.ordem];
    estado.vezDe = this.vezDe;
    estado.dicas = p.dicas.map((d) => ({ rodada: d.rodada, jogadorId: d.jogadorId, texto: d.texto }));
    // Pausa do fim da rodada: qual dica destacar (null fora da pausa).
    if (this.fase === FASES.DICAS) estado.ultimaDica = p.ultimaDica ? { ...p.ultimaDica } : null;

    if (this.fase === FASES.CARTAS) {
      estado.cartasVistas = this.ativos().filter((j) => j.cartaVista).length;
      estado.cartaVista = !!this.jogadores.get(uid)?.cartaVista;
    }
    // Pergunta: durante as respostas, só quantos já foram e a SUA resposta.
    if (this.fase === FASES.RESPOSTAS) {
      estado.responderam = p.respostas.size;
      estado.totalRespondentes = this.ativos().length;
      estado.minhaResposta = p.respostas.get(uid) ?? null;
    }
    if (p.modo === "pergunta" && COM_RESPOSTAS.has(this.fase) && p.respostasReveladas) {
      estado.respostas = p.respostasReveladas.map((r) => ({ jogadorId: r.jogadorId, texto: r.texto }));
    }
    // A pergunta da maioria só depois do confronto das respostas.
    if (p.modo === "pergunta" && COM_PERGUNTA_REAL.has(this.fase)) estado.perguntaReal = p.palavra;
    if (this.fase === FASES.ULTIMA_CHANCE && p.opcoes) estado.opcoes = [...p.opcoes];
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
        modo: p.modo,
        vencedor: p.vencedor,
        motivo: p.motivo,
        impostorId: p.impostorId,
        palavra: p.palavra, // o segredo do modo (ver PROTOCOLO)
        chute: p.chute,
        adivinhou: p.adivinhou,
        pontos: { ...p.pontos },
      };
      if (p.modo === "pergunta") estado.resultado.perguntaImpostor = p.perguntaImpostor;
    }
    return estado;
  }

  transmitir() {
    for (const j of this.conectados()) this.entregar(j.id, "impostor-estado", this.estadoPara(j.id));
  }
}
