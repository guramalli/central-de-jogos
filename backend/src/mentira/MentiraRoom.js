import { CURIOSIDADES } from "./curiosidades.js";
import { FRASES_SOBRE, VERDADES_BOT } from "./frasesSobre.js";

// MENTIRA SINCERA — jogo de blefe (inspirado no Fibbage 4). Regras:
//   - 7 perguntas em 3 FASES: 1–3 valem ×1; 4–6 valem ×2; a 7ª é a FINAL
//     (×3) com MENTIRA DUPLA: duas curiosidades, UMA mentira pras duas;
//   - ESCREVER: cada um inventa uma mentira. Escreveu a verdade? "essa é a
//     resposta certa, invente outra!";
//   - ESCOLHER: mentiras embaralhadas com a verdade (e mentiras da casa se
//     houver pouca gente); ninguém escolhe a própria. Depois de escolher dá
//     pra CURTIR as mentiras engraçadas (troféu "Mais Engraçado");
//   - REVELAR: quem caiu em cada mentira e, por último, a verdade;
//   - pontos (× fase): verdade +500; cada enganado +250 pro autor (mentiras
//     iguais dividem); cair na mentira DA CASA −250 (placar nunca negativo);
//     na final, mentira escolhida nas DUAS perguntas: +1000;
//   - o dono pode PULAR uma curiosidade ruim; bots de teste opcionais.
// Tudo em memória (sem banco). A VERDADE só sai do servidor na revelação.

export const TOTAL_RODADAS = 7;
export const SEG_ESCREVER = 45;
export const SEG_ESCOLHER = 25; // (referência; o tempo real é proporcional às opções)
export const SEG_ESCREVER_FINAL = 60;
export const SEG_ESCOLHER_FINAL = 35; // (referência)

// TEMPO DE VOTO proporcional ao número de opções na tela (o que a pessoa
// precisa ler): base pra se situar + um tanto por opção, com piso e teto.
// Na final dupla, contam as opções das DUAS perguntas.
export function tempoDeVoto(opcoesPorPergunta) {
  const total = opcoesPorPergunta.reduce((a, n) => a + n, 0);
  if (opcoesPorPergunta.length > 1) return Math.min(60, Math.max(25, Math.round(8 + 4 * total)));
  return Math.min(50, Math.max(18, Math.round(8 + 4.5 * total)));
}
export const SEG_CONFESSAR = 60;
// Depois que TODO MUNDO vota, a escolha não fecha na hora: sobra esse tempo
// pra curtir as mentiras (senão ninguém premia a mais criativa).
export const SEG_CURTIR = 7;
// Revelação: tempo de cada carta + o resumo da rodada no fim (a tela usa os
// MESMOS números pra sincronizar).
export const SEG_POR_CARTA = 5.5;
export const SEG_RESUMO = 11;
// Modo "Sobre Vocês": cada um confessa uma verdade sobre si; depois, uma
// rodada por pessoa (os OUTROS mentem e tentam achar a verdade dela).
const PONTOS_VERDADE = 500;
const PONTOS_POR_ENGANADO = 250;
const PENALIDADE_CASA = 250;
const BONUS_DUPLA = 1000;
// CRIATIVIDADE VALE PONTOS: cada curtida recebida dá +100 (× a fase).
// Contra combinação: até 2 curtidas por pessoa por rodada, e a mesma
// pessoa só ganha uma vez de cada curtidor na rodada.
export const PONTOS_POR_CURTIDA = 100;
export const MAX_CURTIDAS = 2;
const MIN_OPCOES = 4;
const MAX_MENTIRA = 60;
const MAX_JOGADORES = 8;
// CHAT da sala: mensagens (as últimas ficam no estado) + reações flutuantes.
const MAX_CHAT = 60;
export const REACOES = ["😂", "🤥", "😱", "🔥", "👏", "🤡"];
const MENTIRAS_BOT = ["um pato de borracha", "o Faustão", "três pinguins", "uma galinha", "o Silvio Santos", "pão de queijo", "um fusca azul", "a Xuxa", "um tamanduá", "uma panela de pressão"];

export const normalizar = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9 ]/g, " ").replace(/\b(o|a|os|as|um|uma|de|do|da|dos|das|no|na|num|numa)\b/g, " ").replace(/\s+/g, " ").trim();

function distancia(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// A "mentira" é, na verdade, a resposta certa (ou quase)?
export function ehAVerdade(texto, cur) {
  const n = normalizar(texto);
  if (!n || !cur) return false;
  for (const certa of [cur.verdade, ...(cur.aceitas || [])].map(normalizar)) {
    if (!certa) continue;
    if (n === certa) return true;
    // Tolera UMA letra de diferença (erro de digitação)… mas não em números:
    // "5 da manhã" é outra resposta, não um erro de "4 da manhã".
    if (certa.length >= 6 && !/\d/.test(n + certa) && distancia(n, certa) <= 1) return true;
    // "contém a verdade" só pra respostas longas: "porco-espinho" é uma
    // mentira legítima quando a verdade é "porco".
    if (certa.length >= 8 && n.includes(certa)) return true;
  }
  return false;
}

function embaralhar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const novoId = () => Math.random().toString(36).slice(2, 8);

export class MentiraRoom {
  // enviar(userId, estado): entrega o estado personalizado a um jogador.
  // opcoes.publica: sala ABERTA da lobby (só Curiosidades; dono = quem chegou
  // primeiro). opcoes.permiteBots: se o dono pode chamar bots pra completar.
  // Sem opcoes: sala de AMIGOS, criada por convite (os dois modos; nasce no
  // Sobre Vocês).
  constructor(codigo, dono, enviar, curiosidades = CURIOSIDADES, opcoes = {}) {
    this.codigo = codigo;
    this.publica = !!opcoes.publica;
    this.permiteBots = opcoes.permiteBots !== false;
    this.nomeSala = opcoes.nome || null;
    this.donoId = dono?.id || null;
    this.enviar = enviar;
    this.curiosidades = curiosidades;
    this.jogadores = new Map(); // userId -> { id, nickname, pontos, sockets:Set, bot?, stats }
    this.fase = "aguardando";
    // Os dois modos no ar; o dono escolhe na sala de espera.
    // Sem temas: curiosidades e frases saem SEMPRE sorteadas do banco inteiro.
    // Padrão: Curiosidades — serve pra qualquer pessoa. O "Sobre Vocês" é o
    // modo ENTRE AMIGOS (quem não se conhece só chuta a verdade dos outros).
    this.modo = "curiosidades"; // curiosidades | sobre
    if (opcoes.modo) this.modo = opcoes.modo;
    this.totalRodadas = TOTAL_RODADAS;
    this.frasesDoJogador = new Map(); // (sobre) userId -> [frases sorteadas]
    this.confissoes = new Map(); // (sobre) userId -> [verdades confessadas]
    this.fila = []; // (sobre) ordem das rodadas: userIds
    this.assuntoId = null; // (sobre) de quem é a rodada
    this.rodada = 0;
    this.baralho = [];
    this.timer = null;
    this.tempo = 0;
    this.segCurtir = SEG_CURTIR; // (os testes zeram pra ir direto)
    this.chat = []; // { id, tipo: "msg" | "sistema", uid?, nick?, texto, em }
    this.aoFimDePartida = null; // (sala) => grava o ranking do mês (socketMentira)
    this.patentes = new Map(); // userId -> { name, icon, brilha } (patente do mês)
    this.ganhoRanking = new Map(); // userId -> pontos que a última partida rendeu no ranking
    this.reacoes = []; // efêmeras: { id, nick, emoji, em } (somem em 4s)
    this.ultimaFala = new Map(); // userId -> horário (limite de velocidade)
    this.limparRodada();
  }

  limparRodada() {
    this.perguntas = []; // 1 curiosidade (ou 2 na final)
    this.mentiras = new Map(); // userId -> texto
    this.opcoes = []; // por pergunta: [[...], [...]]
    this.votos = []; // por pergunta: Map userId -> opcaoId
    this.curtidas = new Map(); // userId -> Set(opcaoId)
    this.revelacao = null;
    this.ganhosDaRodada = new Map();
    this.todosVotaram = false;
    this.curtidasFechadas = false;
  }

  get sobre() { return this.modo === "sobre"; }
  get ehFinal() { return !this.sobre && this.rodada === TOTAL_RODADAS; }
  get multiplicador() {
    if (this.sobre) return this.rodada >= this.totalRodadas ? 2 : 1; // última vale o dobro
    return this.rodada >= TOTAL_RODADAS ? 3 : this.rodada >= 4 ? 2 : 1;
  }
  // Quem joga a rodada (no "Sobre Vocês", o assunto só assiste).
  participantes() { return this.online().filter((j) => j.id !== this.assuntoId); }

  // ---------------- gente ----------------
  novoJogador(id, nickname, bot = false) {
    return { id, nickname, pontos: 0, sockets: new Set(), bot, stats: { enganou: 0, acertos: 0, curtidas: 0 } };
  }

  entrar(user, socketId) {
    let j = this.jogadores.get(user.id);
    if (!j) { j = this.novoJogador(user.id, user.nickname); this.jogadores.set(user.id, j); this.avisoChat(`👋 ${user.nickname} entrou na sala.`); }
    j.sockets.add(socketId);
    if (!this.donoId || !this.humanos().some((h) => h.id === this.donoId)) this.donoId = user.id;
    // Voltou pra uma partida em andamento que tinha ficado sem ninguém (a
    // conexão da única pessoa caiu e o relógio parou): religa o relógio.
    if (!this.timer && ["confessar", "escrever", "escolher", "revelar"].includes(this.fase)) this.iniciarRelogio();
    this.transmitir();
  }

  sair(socketId) {
    for (const j of this.jogadores.values()) {
      if (!j.sockets.delete(socketId)) continue;
      if (j.sockets.size === 0 && this.fase === "aguardando") this.jogadores.delete(j.id);
    }
    if (!this.humanos().some((j) => j.id === this.donoId)) {
      const novo = this.humanos()[0];
      if (novo) this.donoId = novo.id;
    }
    if (this.vazia()) this.parar();
    else { this.conferirFimAntecipado(); this.transmitir(); }
  }

  online() { return [...this.jogadores.values()].filter((j) => j.bot || j.sockets.size > 0); }
  humanos() { return this.online().filter((j) => !j.bot); }
  // Sala "vazia" = sem PESSOAS (bots não seguram a sala nem o relógio).
  vazia() { return this.humanos().length === 0; }

  // ---------------- ranking ----------------
  definirPatente(userId, patente) {
    if (!patente) return;
    this.patentes.set(userId, { name: patente.name, icon: patente.icon || null, brilha: !!patente.brilha });
    this.transmitir();
  }

  // ---------------- chat ----------------
  avisoChat(texto) {
    this.chat.push({ id: novoId(), tipo: "sistema", texto, em: Date.now() });
    if (this.chat.length > MAX_CHAT) this.chat.splice(0, this.chat.length - MAX_CHAT);
  }

  mensagemChat(userId, texto) {
    const j = this.jogadores.get(userId);
    if (!j) return "Você não está nesta sala.";
    const t = String(texto || "").replace(/\s+/g, " ").trim().slice(0, 300);
    if (!t) return null;
    const agora = Date.now();
    if (agora - (this.ultimaFala.get(userId) || 0) < 800) return "Calma! Uma mensagem de cada vez.";
    // ANTI-SPOILER enquanto se escreve e se vota: nada de entregar a própria
    // mentira (todo mundo saberia de quem é) nem a verdade (no "Sobre
    // Vocês" o assunto da rodada sabe a resposta).
    if (this.fase === "escrever" || this.fase === "escolher") {
      const n = normalizar(t);
      const minha = normalizar(this.mentiras.get(userId) || "");
      if (minha.length >= 3 && n.includes(minha)) return "Não entregue sua mentira no chat! 🤫";
      const entregaVerdade = this.perguntas.some((c) => ehAVerdade(t, c) || (normalizar(c.verdade).length >= 4 && n.includes(normalizar(c.verdade))));
      if (entregaVerdade) return "Sem spoiler da resposta! 🤐";
    }
    this.ultimaFala.set(userId, agora);
    this.chat.push({ id: novoId(), tipo: "msg", uid: userId, nick: j.nickname, texto: t, em: agora });
    if (this.chat.length > MAX_CHAT) this.chat.splice(0, this.chat.length - MAX_CHAT);
    this.transmitir();
    return null;
  }

  reagir(userId, emoji) {
    const j = this.jogadores.get(userId);
    if (!j || !REACOES.includes(emoji)) return null;
    const agora = Date.now();
    if (agora - (j.ultimaReacao || 0) < 350) return null; // sem metralhadora
    j.ultimaReacao = agora;
    this.reacoes = this.reacoes.filter((r) => agora - r.em < 4000);
    this.reacoes.push({ id: novoId(), nick: j.nickname, emoji, em: agora });
    this.transmitir();
    return null;
  }

  // ---------------- controle ----------------
  comecar(userId) {
    if (userId === this.donoId) this.ganhoRanking = new Map();
    if (userId !== this.donoId) return "Só quem criou a sala começa a partida.";
    if (this.fase !== "aguardando" && this.fase !== "fim") return "A partida já está rolando.";
    if (this.online().length < 2) return "Precisa de pelo menos 2 jogadores.";
    for (const j of [...this.jogadores.values()]) if (!j.bot && j.sockets.size === 0) this.jogadores.delete(j.id);
    if (this.sobre && this.online().length < 3) return "O modo Sobre Vocês precisa de pelo menos 3 jogadores (vale bot).";
    for (const j of this.jogadores.values()) { j.pontos = 0; j.stats = { enganou: 0, acertos: 0, curtidas: 0 }; }
    this.rodada = 0;
    this.assuntoId = null;
    this.totalRodadas = TOTAL_RODADAS;
    if (this.sobre) this.iniciarConfissoes();
    else this.proximaRodada();
    this.iniciarRelogio();
    return null;
  }

  definirModo(userId, modo) {
    if (userId !== this.donoId) return "Só o dono da sala escolhe o modo.";
    if (this.fase !== "aguardando" && this.fase !== "fim") return "Dá pra trocar o modo só antes de começar.";
    if (!["curiosidades", "sobre"].includes(modo)) return "Modo inválido.";
    if (this.publica && modo === "sobre") return "O Sobre Vocês é pra jogar com amigos — crie uma sala e mande o convite.";
    this.modo = modo;
    this.transmitir();
    return null;
  }

  adicionarBot(userId) {
    if (userId !== this.donoId) return "Só o dono da sala adiciona bots.";
    if (!this.permiteBots) return "Esta sala é só com gente de verdade — pra jogar com bots, vá pra Sala Livre.";
    if (this.jogadores.size >= MAX_JOGADORES) return "A sala já está cheia (8).";
    const n = [...this.jogadores.values()].filter((j) => j.bot).length + 1;
    const id = `bot-${this.codigo}-${n}-${Math.random().toString(36).slice(2, 5)}`;
    this.jogadores.set(id, this.novoJogador(id, `Robô Mentiroso ${n}`, true));
    this.transmitir();
    return null;
  }

  removerBots(userId) {
    if (userId !== this.donoId) return "Só o dono da sala remove bots.";
    for (const j of [...this.jogadores.values()]) if (j.bot) this.jogadores.delete(j.id);
    this.conferirFimAntecipado();
    this.transmitir();
    return null;
  }

  pular(userId) {
    if (userId !== this.donoId) return "Só o dono da sala pode pular.";
    if (this.fase !== "escrever") return "Só dá pra pular enquanto escrevem.";
    if (this.sobre) {
      this.fila.splice(this.rodada - 1, 1);
      this.totalRodadas = this.fila.length;
      this.rodada -= 1;
      if (this.rodada >= this.totalRodadas) { this.fase = "fim"; this.pararRelogio(); this.transmitir(); }
      else this.proximaRodada();
      return null;
    }
    this.rodada -= 1; // a pulada não conta
    this.proximaRodada();
    return null;
  }

  // ---------------- "Sobre Vocês": confissões ----------------
  // Com até 4 jogadores, cada um confessa DUAS verdades (senão a partida
  // teria só 3–4 rodadas); com mais gente, uma. Máximo de 8 rodadas.
  iniciarConfissoes() {
    this.limparRodada();
    this.frasesDoJogador = new Map();
    this.confissoes = new Map();
    const pessoas = this.online();
    const porPessoa = pessoas.length <= 4 ? 2 : 1;
    const frases = embaralhar(FRASES_SOBRE); // sorteadas do banco inteiro
    let k = 0;
    for (const j of pessoas) {
      const minhas = [];
      for (let i = 0; i < porPessoa; i++) minhas.push(frases[k++ % frases.length]);
      this.frasesDoJogador.set(j.id, minhas);
      this.confissoes.set(j.id, minhas.map(() => null));
    }
    this.fase = "confessar";
    this.avisoChat("🤫 Hora das confissões!");
    this.tempo = SEG_CONFESSAR * (porPessoa === 2 ? 1.5 : 1);
    this.tempoTotal = this.tempo;
    this.transmitir();
  }

  confessar(userId, texto, indice = 0) {
    if (this.fase !== "confessar") return "Agora não é hora de confessar.";
    if (!this.frasesDoJogador.has(userId)) return "Você entrou depois — espere a próxima partida.";
    const i = Number(indice) || 0;
    const minhas = this.confissoes.get(userId);
    if (i < 0 || i >= minhas.length) return "Confissão inválida.";
    const t = String(texto || "").replace(/\s+/g, " ").trim().slice(0, MAX_MENTIRA);
    if (!t) return "Escreva a sua verdade.";
    minhas[i] = t;
    const terminou = (uid) => {
      const j = this.jogadores.get(uid);
      return this.confissoes.get(uid).every(Boolean) || (!j?.bot && !j?.sockets.size);
    };
    if ([...this.frasesDoJogador.keys()].every(terminou)) this.iniciarRodadasSobre();
    else this.transmitir();
    return null;
  }

  // Ordem das rodadas: embaralhada, evitando a mesma pessoa duas vezes seguidas.
  iniciarRodadasSobre() {
    const entradas = [];
    for (const [uid, lista] of this.confissoes) {
      if (!this.jogadores.has(uid)) continue;
      lista.forEach((t, i) => { if (t) entradas.push({ uid, i }); });
    }
    let fila = embaralhar(entradas);
    for (let tentativa = 0; tentativa < 30 && fila.some((e, k) => k && fila[k - 1].uid === e.uid); tentativa++) fila = embaralhar(entradas);
    this.fila = fila.slice(0, 8);
    if (this.fila.length === 0) { this.fase = "fim"; this.pararRelogio(); this.transmitir(); return; }
    this.totalRodadas = this.fila.length;
    this.rodada = 0;
    this.proximaRodada();
  }

  curiosidadeSobre({ uid, i }) {
    const frase = this.frasesDoJogador.get(uid)[i];
    const nick = this.jogadores.get(uid)?.nickname || "Alguém";
    return { id: `sobre-${frase.id}-${uid}`, texto: frase.ele.replace("{n}", nick), verdade: this.confissoes.get(uid)[i], aceitas: [], casa: frase.casa };
  }

  tirarDoBaralho() {
    // Baralho embaralhado (Fisher-Yates) do banco INTEIRO: nenhuma repete
    // até todas saírem; nada segue a ordem da lista.
    if (this.baralho.length === 0) this.baralho = embaralhar(this.curiosidades.map((c) => c.id));
    const id = this.baralho.shift();
    return this.curiosidades.find((c) => c.id === id);
  }

  proximaRodada() {
    this.limparRodada();
    this.rodada += 1;
    if (this.sobre) {
      const entrada = this.fila[this.rodada - 1];
      this.assuntoId = entrada.uid;
      this.perguntas = [this.curiosidadeSobre(entrada)];
      this.avisoChat(`🎲 Rodada ${this.rodada}: agora é sobre ${this.jogadores.get(entrada.uid)?.nickname || "alguém"}!`);
      this.fase = "escrever";
      this.tempo = SEG_ESCREVER;
      this.tempoTotal = this.tempo;
      this.transmitir();
      return;
    }
    this.perguntas = [this.tirarDoBaralho()];
    if (this.ehFinal) {
      let segunda = this.tirarDoBaralho();
      if (segunda?.id === this.perguntas[0].id) segunda = this.tirarDoBaralho();
      this.perguntas.push(segunda);
    }
    this.fase = "escrever";
    this.avisoChat(this.ehFinal ? "🎲 FINAL: mentira dupla, pontos triplicados!" : `🎲 Pergunta ${this.rodada} de ${TOTAL_RODADAS} começou.`);
    this.tempo = this.ehFinal ? SEG_ESCREVER_FINAL : SEG_ESCREVER;
    this.tempoTotal = this.tempo;
    this.transmitir();
  }

  // ---------------- jogadas ----------------
  mentir(userId, texto) {
    if (this.fase !== "escrever") return "Agora não é hora de escrever.";
    if (!this.jogadores.has(userId)) return "Você não está nesta sala.";
    if (userId === this.assuntoId) return "Essa rodada é sobre você — só assista (e curta as mentiras)!";
    const t = String(texto || "").replace(/\s+/g, " ").trim().slice(0, MAX_MENTIRA);
    if (!t) return "Escreva alguma coisa.";
    if (this.sobre && this.perguntas.some((c) => ehAVerdade(t, c))) return `Essa é a verdade de ${this.jogadores.get(this.assuntoId)?.nickname || "alguém"}! Invente uma mentira.`;
    if (this.perguntas.some((c) => ehAVerdade(t, c))) {
      return this.ehFinal ? "Essa é a resposta certa de uma das perguntas! Invente outra mentira." : "Essa é a resposta certa! Invente outra mentira.";
    }
    this.mentiras.set(userId, t);
    this.conferirFimAntecipado();
    this.transmitir();
    return null;
  }

  escolher(userId, opcaoId, pergunta = 0) {
    if (this.fase !== "escolher") return "Agora não é hora de escolher.";
    if (!this.jogadores.has(userId)) return "Você não está nesta sala.";
    if (userId === this.assuntoId) return "Essa rodada é sobre você — quem escolhe são os outros.";
    const p = Number(pergunta) || 0;
    const op = (this.opcoes[p] || []).find((o) => o.id === opcaoId);
    if (!op) return "Opção inválida.";
    if (op.autores.includes(userId)) return "Essa é a sua mentira — escolha outra.";
    if (this.votos[p].has(userId)) return "Você já escolheu.";
    this.votos[p].set(userId, opcaoId);
    this.conferirFimAntecipado();
    this.transmitir();
    return null;
  }

  // Curtir (ou descurtir) uma mentira: depois de escolher, ou na REVELAÇÃO
  // (quando a mentira aparece e todo mundo ri). Na escolha a fase acaba
  // assim que o último escolhe — sem a revelação, ele nunca curtiria.
  curtir(userId, opcaoId) {
    if (this.fase !== "escolher" && this.fase !== "revelar") return "Agora não dá pra curtir.";
    if (this.fase === "escolher" && userId !== this.assuntoId && !this.votos.every((v) => v.has(userId))) return "Escolha sua resposta antes de curtir.";
    const op = this.opcoes.flat().find((o) => o.id === opcaoId);
    if (!op) return "Opção inválida.";
    if (op.autores.includes(userId)) return "Não vale curtir a própria mentira.";
    if (this.fase === "revelar" && (op.verdade || op.casa)) return "Curtida é pra mentira de jogador.";
    if (this.curtidasFechadas) return "As curtidas desta rodada já foram contadas.";
    if (!this.curtidas.has(userId)) this.curtidas.set(userId, new Set());
    const minhas = this.curtidas.get(userId);
    if (minhas.has(opcaoId)) minhas.delete(opcaoId);
    else {
      if (minhas.size >= MAX_CURTIDAS) return `Você já usou suas ${MAX_CURTIDAS} curtidas desta rodada — tire uma pra dar outra.`;
      minhas.add(opcaoId);
    }
    this.transmitir();
    return null;
  }

  conferirFimAntecipado() {
    const ativos = this.participantes();
    if (!ativos.length) return;
    if (this.fase === "escrever" && ativos.every((j) => this.mentiras.has(j.id))) this.irParaEscolha();
    else if (this.fase === "escolher" && ativos.every((j) => this.votos.every((v) => v.has(j.id)))) {
      if (this.segCurtir <= 0) { this.irParaRevelacao(); return; }
      if (!this.todosVotaram) {
        this.todosVotaram = true;
        this.tempo = Math.min(this.tempo, this.segCurtir);
      }
    }
  }

  // ---------------- fases ----------------
  montarOpcoes(cur) {
    const porTexto = new Map(); // mentiras iguais viram uma opção só
    for (const [uid, t] of this.mentiras) {
      const n = normalizar(t);
      if (!porTexto.has(n)) porTexto.set(n, { id: novoId(), texto: t, autores: [], verdade: false, casa: false });
      porTexto.get(n).autores.push(uid);
    }
    const opcoes = [...porTexto.values(), { id: novoId(), texto: cur.verdade, autores: [], verdade: true, casa: false }];
    // Mentiras da casa: nunca iguais (ou quase) à VERDADE nem a outra opção.
    // No "Sobre Vocês" a verdade é escrita na hora — se alguém confessa
    // "Evidências" e a casa também tem "Evidências", apareciam duas opções
    // idênticas e quem clicava na "da casa" perdia pontos achando que acertou.
    // Se a da casa for descartada, entra uma reserva no lugar.
    const jaTem = (t) => opcoes.some((o) => normalizar(o.texto) === normalizar(t)) || ehAVerdade(t, cur);
    // Com até 2 jogadores, 5 opções (as 3 mentiras da casa entram): sobra
    // mais coisa pra desconfiar além da mentira do outro jogador.
    const alvo = this.online().length <= 2 ? MIN_OPCOES + 1 : MIN_OPCOES;
    for (const falsa of [...embaralhar(cur.casa || []), ...embaralhar(MENTIRAS_BOT)]) {
      if (opcoes.length >= alvo) break;
      if (jaTem(falsa)) continue;
      opcoes.push({ id: novoId(), texto: falsa, autores: [], verdade: false, casa: true });
    }
    return embaralhar(opcoes);
  }

  irParaEscolha() {
    this.opcoes = this.perguntas.map((c) => this.montarOpcoes(c));
    this.votos = this.perguntas.map(() => new Map());
    this.fase = "escolher";
    this.tempo = tempoDeVoto(this.opcoes.map((l) => l.length));
    this.tempoTotal = this.tempo;
    this.transmitir();
  }

  irParaRevelacao() {
    const mult = this.multiplicador;
    const ganhos = new Map();
    const somar = (uid, pts) => ganhos.set(uid, (ganhos.get(uid) || 0) + pts);
    const stat = (uid, campo, n = 1) => { const j = this.jogadores.get(uid); if (j) j.stats[campo] += n; };
    const enganouEm = this.perguntas.map(() => new Set()); // autores escolhidos em cada pergunta

    const itens = [];
    this.opcoes.forEach((lista, p) => {
      for (const o of lista) {
        const escolheram = [...this.votos[p]].filter(([, op]) => op === o.id).map(([uid]) => uid);
        if (o.verdade) escolheram.forEach((uid) => { somar(uid, PONTOS_VERDADE * mult); stat(uid, "acertos"); });
        else if (o.casa) escolheram.forEach((uid) => somar(uid, -PENALIDADE_CASA * mult));
        else if (o.autores.length && escolheram.length) {
          const cada = Math.round((PONTOS_POR_ENGANADO * mult * escolheram.length) / o.autores.length);
          o.autores.forEach((uid) => { somar(uid, cada); stat(uid, "enganou", escolheram.length); enganouEm[p].add(uid); });
        }
        itens.push({ ...o, pergunta: p, escolheram });
      }
    });

    // Final: mentira escolhida nas DUAS perguntas = bônus.
    const dupla = this.ehFinal ? [...enganouEm[0]].filter((uid) => enganouEm[1]?.has(uid)) : [];
    dupla.forEach((uid) => somar(uid, BONUS_DUPLA));

    for (const [uid, pts] of ganhos) { const j = this.jogadores.get(uid); if (j) j.pontos = Math.max(0, j.pontos + pts); }
    this.ganhosDaRodada = ganhos;


    // Ordem: por pergunta, as mentiras em que alguém caiu; a verdade por último.
    const ordem = [];
    this.perguntas.forEach((_, p) => {
      const daPergunta = itens.filter((i) => i.pergunta === p);
      ordem.push(...daPergunta.filter((i) => !i.verdade && i.escolheram.length), daPergunta.find((i) => i.verdade));
    });
    // "Ninguém caiu": na final a mesma mentira está nas duas perguntas — só
    // entra se ninguém caiu em NENHUMA delas, e aparece uma vez só.
    const caiuEmAlguma = new Set(itens.filter((i) => !i.verdade && !i.casa && i.escolheram.length).map((i) => normalizar(i.texto)));
    const vistas = new Set();
    const ninguemCaiu = itens.filter((i) => {
      if (i.verdade || i.casa || i.escolheram.length) return false;
      const n = normalizar(i.texto);
      if (caiuEmAlguma.has(n) || vistas.has(n)) return false;
      vistas.add(n);
      return true;
    });
    this.revelacao = { itens: ordem, ninguemCaiu, dupla, todas: itens };
    this.fase = "revelar";
    this.tempo = Math.ceil(ordem.length * SEG_POR_CARTA) + SEG_RESUMO;
    this.tempoTotal = this.tempo;
    this.transmitir();
  }

  // Curtidas por opção (só mentiras de jogador contam).
  contarCurtidas() {
    const porOpcao = new Map();
    for (const set of this.curtidas.values()) for (const id of set) porOpcao.set(id, (porOpcao.get(id) || 0) + 1);
    return porOpcao;
  }

  // Conta as curtidas da rodada: pontos pra quem escreveu (e o troféu "Mais
  // Engraçado"). Roda quando o RESUMO começa — assim o placar do resumo já
  // sobe com elas — ou, no máximo, no fim da revelação.
  fecharCurtidas() {
    if (this.curtidasFechadas) return;
    this.curtidasFechadas = true;
    const mult = this.multiplicador;
    const opcoes = this.opcoes.flat();
    for (const [curtidor, ids] of this.curtidas) {
      const jaGanhou = new Set(); // cada autor ganha uma vez por curtidor
      for (const id of ids) {
        const o = opcoes.find((x) => x.id === id);
        if (!o || o.verdade || o.casa) continue;
        const cada = Math.round((PONTOS_POR_CURTIDA * mult) / o.autores.length);
        for (const autor of o.autores) {
          if (autor === curtidor || jaGanhou.has(autor)) continue;
          jaGanhou.add(autor);
          const j = this.jogadores.get(autor);
          if (!j) continue;
          j.pontos += cada;
          j.stats.curtidas += 1;
          this.ganhosDaRodada.set(autor, (this.ganhosDaRodada.get(autor) || 0) + cada);
        }
      }
    }
  }

  depoisDaRevelacao() {
    this.fecharCurtidas();
    // O vencedor da rodada vai pro chat só DEPOIS da revelação (antes seria
    // spoiler das cartas).
    const melhor = Math.max(0, ...this.ganhosDaRodada.values());
    if (melhor > 0) {
      const quem = [...this.ganhosDaRodada].filter(([, v]) => v === melhor).map(([uid]) => this.jogadores.get(uid)?.nickname).filter(Boolean);
      this.avisoChat(`🏆 ${quem.join(" e ")} ${quem.length > 1 ? "venceram" : "venceu"} a rodada (+${melhor.toLocaleString("pt-BR")}).`);
    }
    this.curtidas = new Map();
    if (this.rodada >= this.totalRodadas) {
      this.fase = "fim"; this.assuntoId = null; this.pararRelogio();
      const topo = Math.max(0, ...[...this.jogadores.values()].map((j) => j.pontos));
      const campeoes = [...this.jogadores.values()].filter((j) => topo > 0 && j.pontos === topo).map((j) => j.nickname);
      if (campeoes.length) this.avisoChat(`🎉 ${campeoes.join(" e ")} ${campeoes.length > 1 ? "venceram" : "venceu"} a partida!`);
      try { this.aoFimDePartida?.(this); } catch (err) { console.error("Mentira: falha ao gravar o ranking:", err); }
      this.transmitir();
    }
    else this.proximaRodada();
  }

  // ---------------- bots ----------------
  agirBots() {
    for (const b of [...this.jogadores.values()].filter((j) => j.bot && j.id !== this.assuntoId)) {
      const chave = `${this.fase}-${this.rodada}`;
      if (b.agendaChave !== chave) {
        b.agendaChave = chave;
        b.agenda = this.tempo - (this.fase === "escrever" ? 5 + Math.floor(Math.random() * 15) : 3 + Math.floor(Math.random() * 8));
      }
      if (this.tempo > Math.max(b.agenda, 1)) continue;
      if (this.fase === "confessar") {
        (this.confissoes.get(b.id) || []).forEach((t, i) => {
          if (!t && this.fase === "confessar") this.confessar(b.id, VERDADES_BOT[Math.floor(Math.random() * VERDADES_BOT.length)], i);
        });
        if (this.fase !== "confessar") break;
        continue;
      }
      if (this.fase === "escrever" && !this.mentiras.has(b.id)) {
        const usadas = new Set([...this.mentiras.values()].map(normalizar));
        // Mentira com nexo: as da casa (na final, as das DUAS perguntas). A
        // lista genérica ("o Silvio Santos") é só o último recurso.
        const daCasa = this.perguntas.flatMap((c) => c.casa || []);
        const fonte = [...embaralhar(daCasa), ...embaralhar(MENTIRAS_BOT)];
        const texto = fonte.find((t) => !usadas.has(normalizar(t)) && !this.perguntas.some((c) => ehAVerdade(t, c)));
        if (texto) this.mentir(b.id, texto);
      } else if (this.fase === "escolher") {
        this.opcoes.forEach((lista, p) => {
          if (this.fase !== "escolher" || this.votos[p].has(b.id)) return;
          const possiveis = lista.filter((o) => !o.autores.includes(b.id));
          const verdade = possiveis.find((o) => o.verdade);
          const mentiras = possiveis.filter((o) => !o.verdade);
          const alvo = Math.random() < 0.4 || !mentiras.length ? verdade : mentiras[Math.floor(Math.random() * mentiras.length)];
          if (alvo) this.escolher(b.id, alvo.id, p);
        });
      }
      if (this.fase !== "escrever" && this.fase !== "escolher") break;
    }
  }

  // ---------------- relógio ----------------
  // try/catch: um erro inesperado numa rodada não pode derrubar o servidor
  // inteiro (exceção dentro de setInterval encerra o processo do Node).
  iniciarRelogio() {
    this.pararRelogio();
    this.timer = setInterval(() => {
      try { this.tick(); } catch (err) { console.error(`Mentira: erro na sala ${this.codigo}:`, err); }
    }, 1000);
  }
  pararRelogio() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  parar() { this.pararRelogio(); }

  // Sala ABERTA que esvaziou: volta pra espera, sem bots nem partida velha.
  reiniciarVazia() {
    this.pararRelogio();
    this.limparRodada();
    for (const j of [...this.jogadores.values()]) if (j.bot || j.sockets.size === 0) this.jogadores.delete(j.id);
    this.fase = "aguardando";
    this.rodada = 0;
    this.assuntoId = null;
    this.baralho = [];
    this.chat = [];
    this.donoId = this.humanos()[0]?.id || null;
  }

  tick() {
    const comRelogio = ["confessar", "escrever", "escolher", "revelar"];
    if (!comRelogio.includes(this.fase)) return;
    if (this.fase !== "revelar") this.agirBots();
    if (!comRelogio.includes(this.fase)) return;
    this.tempo -= 1;
    if (this.fase === "revelar" && !this.curtidasFechadas && this.tempo <= SEG_RESUMO) this.fecharCurtidas();
    if (this.tempo > 0) { this.transmitir(); return; }
    if (this.fase === "confessar") this.iniciarRodadasSobre();
    else if (this.fase === "escrever") this.irParaEscolha();
    else if (this.fase === "escolher") this.irParaRevelacao();
    else this.depoisDaRevelacao();
  }

  // ---------------- troféus ----------------
  trofeus() {
    const lista = [...this.jogadores.values()];
    const melhor = (campo) => {
      const max = Math.max(0, ...lista.map((j) => j.stats[campo]));
      if (max <= 0) return null;
      return { nomes: lista.filter((j) => j.stats[campo] === max).map((j) => j.nickname), valor: max };
    };
    return { mentiroso: melhor("enganou"), engracado: melhor("curtidas"), detetive: melhor("acertos") };
  }

  // ---------------- o que cada um vê ----------------
  estadoPara(userId) {
    const minhasCurtidas = [...(this.curtidas.get(userId) || [])];
    const base = {
      codigo: this.codigo,
      fase: this.fase,
      rodada: this.rodada,
      totalRodadas: this.totalRodadas,
      modo: this.modo,
      assunto: this.assuntoId ? { id: this.assuntoId, nickname: this.jogadores.get(this.assuntoId)?.nickname || "alguém" } : null,
      souAssunto: !!this.assuntoId && this.assuntoId === userId,
      minhasFrases: this.fase === "confessar" ? (this.frasesDoJogador.get(userId) || []).map((f) => f.eu) : [],
      minhasConfissoes: this.fase === "confessar" ? this.confissoes.get(userId) || [] : [],
      multiplicador: this.multiplicador,
      final: this.ehFinal,
      tempo: this.tempo,
      tempoTotal: this.tempoTotal || this.tempo,
      donoId: this.donoId,
      souDono: userId === this.donoId,
      publica: this.publica,
      permiteBots: this.permiteBots,
      nomeSala: this.nomeSala,
      todosVotaram: this.todosVotaram,
      segPorCarta: SEG_POR_CARTA,
      jogadores: [...this.jogadores.values()]
        .map((j) => ({
          id: j.id, nickname: j.nickname, pontos: j.pontos, online: !!j.bot || j.sockets.size > 0, bot: !!j.bot,
          patente: j.bot ? null : this.patentes.get(j.id) || null,
          pronto: this.fase === "confessar" ? (this.confissoes.get(j.id) || []).length > 0 && this.confissoes.get(j.id).every(Boolean)
            : this.fase === "escrever" ? this.mentiras.has(j.id)
            : this.fase === "escolher" ? this.votos.every((v) => v.has(j.id)) : false,
          assunto: j.id === this.assuntoId,
          ganhou: this.fase === "revelar" || this.fase === "fim" ? this.ganhosDaRodada.get(j.id) || 0 : 0,
        }))
        .sort((a, b) => b.pontos - a.pontos),
      perguntas: this.perguntas.map((c) => ({ texto: c.texto, ficcao: !!c.ficcao })),
      minhaMentira: this.mentiras.get(userId) || null,
      meusVotos: this.votos.map((v) => v.get(userId) || null),
      minhasCurtidas,
      meuGanhoRanking: this.ganhoRanking.get(userId) ?? null,
      curtidasRestantes: Math.max(0, MAX_CURTIDAS - minhasCurtidas.length),
      curtidasFechadas: this.curtidasFechadas,
      pontosPorCurtida: PONTOS_POR_CURTIDA * this.multiplicador,
      chat: this.chat.slice(-50),
      reacoes: this.reacoes.filter((r) => Date.now() - r.em < 4000).map(({ id, nick, emoji }) => ({ id, nick, emoji })),
    };
    if (this.fase === "escolher") {
      base.opcoes = this.opcoes.map((lista) => lista.map((o) => ({ id: o.id, texto: o.texto, minha: o.autores.includes(userId) })));
    }
    if (this.fase === "revelar" || this.fase === "fim") {
      const nome = (uid) => this.jogadores.get(uid)?.nickname || "alguém";
      const porOpcao = this.contarCurtidas();
      const traduzir = (i) => ({
        id: i.id, texto: i.texto, verdade: i.verdade, casa: i.casa, pergunta: i.pergunta,
        curtidas: i.verdade || i.casa ? 0 : porOpcao.get(i.id) || 0, curtivel: !i.verdade && !i.casa && !i.autores.includes(userId),
        autores: i.autores.map(nome), escolheram: i.escolheram.map(nome),
        euCai: i.escolheram.includes(userId), minha: i.autores.includes(userId),
      });
      base.perguntas = this.perguntas.map((c) => ({ texto: c.texto, verdade: c.verdade, ficcao: !!c.ficcao }));
      base.revelacao = this.revelacao
        ? {
          itens: this.revelacao.itens.map(traduzir),
          ninguemCaiu: this.revelacao.ninguemCaiu.map(traduzir),
          dupla: this.revelacao.dupla.map(nome),
          todas: this.revelacao.todas.map(traduzir), // resumo da rodada
        }
        : null;
    }
    if (this.fase === "fim") base.trofeus = this.trofeus();
    return base;
  }

  transmitir() { for (const j of this.jogadores.values()) if (!j.bot && j.sockets.size) this.enviar(j.id, this.estadoPara(j.id)); }
}
