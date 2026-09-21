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
export const SEG_ESCOLHER = 25;
export const SEG_ESCREVER_FINAL = 60;
export const SEG_ESCOLHER_FINAL = 35;
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
const MIN_OPCOES = 4;
const MAX_MENTIRA = 60;
const MAX_JOGADORES = 8;
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
    if (certa.length >= 6 && distancia(n, certa) <= 1) return true;
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
  constructor(codigo, dono, enviar, curiosidades = CURIOSIDADES) {
    this.codigo = codigo;
    this.donoId = dono.id;
    this.enviar = enviar;
    this.curiosidades = curiosidades;
    this.jogadores = new Map(); // userId -> { id, nickname, pontos, sockets:Set, bot?, stats }
    this.fase = "aguardando";
    this.modo = "curiosidades"; // curiosidades | sobre
    this.totalRodadas = TOTAL_RODADAS;
    this.frasesDoJogador = new Map(); // (sobre) userId -> frase sorteada
    this.confissoes = new Map(); // (sobre) userId -> verdade confessada
    this.fila = []; // (sobre) ordem das rodadas: userIds
    this.assuntoId = null; // (sobre) de quem é a rodada
    this.rodada = 0;
    this.baralho = [];
    this.timer = null;
    this.tempo = 0;
    this.segCurtir = SEG_CURTIR; // (os testes zeram pra ir direto)
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
    if (!j) { j = this.novoJogador(user.id, user.nickname); this.jogadores.set(user.id, j); }
    j.sockets.add(socketId);
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

  // ---------------- controle ----------------
  comecar(userId) {
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
    this.modo = modo;
    this.transmitir();
    return null;
  }

  adicionarBot(userId) {
    if (userId !== this.donoId) return "Só o dono da sala adiciona bots.";
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
  iniciarConfissoes() {
    this.limparRodada();
    this.frasesDoJogador = new Map();
    this.confissoes = new Map();
    const frases = embaralhar(FRASES_SOBRE);
    this.online().forEach((j, i) => this.frasesDoJogador.set(j.id, frases[i % frases.length]));
    this.fase = "confessar";
    this.tempo = SEG_CONFESSAR;
    this.transmitir();
  }

  confessar(userId, texto) {
    if (this.fase !== "confessar") return "Agora não é hora de confessar.";
    if (!this.frasesDoJogador.has(userId)) return "Você entrou depois — espere a próxima partida.";
    const t = String(texto || "").replace(/\s+/g, " ").trim().slice(0, MAX_MENTIRA);
    if (!t) return "Escreva a sua verdade.";
    this.confissoes.set(userId, t);
    if ([...this.frasesDoJogador.keys()].every((uid) => this.confissoes.has(uid) || !this.jogadores.get(uid)?.sockets.size && !this.jogadores.get(uid)?.bot)) this.iniciarRodadasSobre();
    else this.transmitir();
    return null;
  }

  iniciarRodadasSobre() {
    // Uma rodada por pessoa que confessou (quem não confessou fica de fora).
    this.fila = embaralhar([...this.confissoes.keys()].filter((uid) => this.jogadores.has(uid)));
    if (this.fila.length === 0) { this.fase = "fim"; this.pararRelogio(); this.transmitir(); return; }
    this.totalRodadas = this.fila.length;
    this.rodada = 0;
    this.proximaRodada();
  }

  curiosidadeSobre(uid) {
    const frase = this.frasesDoJogador.get(uid);
    const nick = this.jogadores.get(uid)?.nickname || "Alguém";
    return { id: `sobre-${frase.id}-${uid}`, texto: frase.ele.replace("{n}", nick), verdade: this.confissoes.get(uid), aceitas: [], casa: frase.casa };
  }

  tirarDoBaralho() {
    if (this.baralho.length === 0) this.baralho = embaralhar(this.curiosidades.map((c) => c.id));
    const id = this.baralho.shift();
    return this.curiosidades.find((c) => c.id === id);
  }

  proximaRodada() {
    this.limparRodada();
    this.rodada += 1;
    if (this.sobre) {
      this.assuntoId = this.fila[this.rodada - 1];
      this.perguntas = [this.curiosidadeSobre(this.assuntoId)];
      this.fase = "escrever";
      this.tempo = SEG_ESCREVER;
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
    this.tempo = this.ehFinal ? SEG_ESCREVER_FINAL : SEG_ESCREVER;
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
    if (!this.curtidas.has(userId)) this.curtidas.set(userId, new Set());
    const minhas = this.curtidas.get(userId);
    if (minhas.has(opcaoId)) minhas.delete(opcaoId); else minhas.add(opcaoId);
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
    for (const falsa of embaralhar(cur.casa || [])) {
      if (opcoes.length >= MIN_OPCOES) break;
      if (porTexto.has(normalizar(falsa))) continue;
      opcoes.push({ id: novoId(), texto: falsa, autores: [], verdade: false, casa: true });
    }
    return embaralhar(opcoes);
  }

  irParaEscolha() {
    this.opcoes = this.perguntas.map((c) => this.montarOpcoes(c));
    this.votos = this.perguntas.map(() => new Map());
    this.fase = "escolher";
    this.tempo = this.ehFinal ? SEG_ESCOLHER_FINAL : SEG_ESCOLHER;
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
    this.transmitir();
  }

  // Curtidas por opção (só mentiras de jogador contam).
  contarCurtidas() {
    const porOpcao = new Map();
    for (const set of this.curtidas.values()) for (const id of set) porOpcao.set(id, (porOpcao.get(id) || 0) + 1);
    return porOpcao;
  }

  depoisDaRevelacao() {
    // Fecha as curtidas da rodada no placar do troféu "Mais Engraçado".
    const porOpcao = this.contarCurtidas();
    for (const o of this.opcoes.flat()) {
      const n = porOpcao.get(o.id) || 0;
      if (n && !o.verdade && !o.casa) o.autores.forEach((uid) => { const j = this.jogadores.get(uid); if (j) j.stats.curtidas += n; });
    }
    this.curtidas = new Map();
    if (this.rodada >= this.totalRodadas) { this.fase = "fim"; this.assuntoId = null; this.pararRelogio(); this.transmitir(); }
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
        if (!this.confissoes.has(b.id) && this.frasesDoJogador.has(b.id)) this.confessar(b.id, VERDADES_BOT[Math.floor(Math.random() * VERDADES_BOT.length)]);
        if (this.fase !== "confessar") break;
        continue;
      }
      if (this.fase === "escrever" && !this.mentiras.has(b.id)) {
        const usadas = new Set([...this.mentiras.values()].map(normalizar));
        const fonte = this.ehFinal ? embaralhar(MENTIRAS_BOT) : [...embaralhar(this.perguntas[0].casa || []), ...embaralhar(MENTIRAS_BOT)];
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
  iniciarRelogio() { this.pararRelogio(); this.timer = setInterval(() => this.tick(), 1000); }
  pararRelogio() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  parar() { this.pararRelogio(); }

  tick() {
    const comRelogio = ["confessar", "escrever", "escolher", "revelar"];
    if (!comRelogio.includes(this.fase)) return;
    if (this.fase !== "revelar") this.agirBots();
    if (!comRelogio.includes(this.fase)) return;
    this.tempo -= 1;
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
      minhaFrase: this.fase === "confessar" ? this.frasesDoJogador.get(userId)?.eu || null : null,
      minhaConfissao: this.fase === "confessar" ? this.confissoes.get(userId) || null : null,
      multiplicador: this.multiplicador,
      final: this.ehFinal,
      tempo: this.tempo,
      donoId: this.donoId,
      souDono: userId === this.donoId,
      todosVotaram: this.todosVotaram,
      segPorCarta: SEG_POR_CARTA,
      jogadores: [...this.jogadores.values()]
        .map((j) => ({
          id: j.id, nickname: j.nickname, pontos: j.pontos, online: !!j.bot || j.sockets.size > 0, bot: !!j.bot,
          pronto: this.fase === "confessar" ? this.confissoes.has(j.id)
            : this.fase === "escrever" ? this.mentiras.has(j.id)
            : this.fase === "escolher" ? this.votos.every((v) => v.has(j.id)) : false,
          assunto: j.id === this.assuntoId,
          ganhou: this.fase === "revelar" || this.fase === "fim" ? this.ganhosDaRodada.get(j.id) || 0 : 0,
        }))
        .sort((a, b) => b.pontos - a.pontos),
      perguntas: this.perguntas.map((c) => ({ texto: c.texto })),
      minhaMentira: this.mentiras.get(userId) || null,
      meusVotos: this.votos.map((v) => v.get(userId) || null),
      minhasCurtidas,
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
      base.perguntas = this.perguntas.map((c) => ({ texto: c.texto, verdade: c.verdade }));
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
