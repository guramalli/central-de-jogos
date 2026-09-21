import { CURIOSIDADES } from "./curiosidades.js";

// MENTIRA SINCERA — jogo de blefe (inspirado no Fibbage). Regras aprovadas:
//   - 7 rodadas; a ÚLTIMA vale o dobro;
//   - ESCREVER (45s): cada um inventa uma mentira pra completar a curiosidade.
//     Escreveu a própria verdade? "essa é a resposta certa, invente outra!";
//   - ESCOLHER (25s): mentiras embaralhadas com a verdade (e mentiras da casa
//     se houver pouca gente); ninguém escolhe a própria;
//   - REVELAR: quem caiu em cada mentira e, por último, a verdade;
//   - acertou a verdade: +500; cada pessoa que cai na sua mentira: +250 pra
//     você (mentiras iguais se juntam e os autores dividem);
//   - o dono da sala pode PULAR uma curiosidade ruim.
// Tudo em memória (sem banco): a sala existe enquanto tiver gente.
// A VERDADE só sai do servidor na revelação.

export const TOTAL_RODADAS = 7;
export const SEG_ESCREVER = 45;
export const SEG_ESCOLHER = 25;
const PONTOS_VERDADE = 500;
const PONTOS_POR_ENGANADO = 250;
const MIN_OPCOES = 4;
const MAX_MENTIRA = 60;

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
  if (!n) return false;
  for (const certa of [cur.verdade, ...(cur.aceitas || [])].map(normalizar)) {
    if (!certa) continue;
    if (n === certa) return true;
    if (certa.length >= 6 && distancia(n, certa) <= 1) return true;
    // "contém a verdade" só vale pra respostas longas: "porco-espinho" é uma
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
    this.jogadores = new Map(); // userId -> { id, nickname, pontos, sockets:Set }
    this.fase = "aguardando";
    this.rodada = 0;
    this.baralho = [];
    this.timer = null;
    this.tempo = 0;
    this.criadaEm = Date.now();
    this.limparRodada();
  }

  limparRodada() {
    this.curiosidade = null;
    this.mentiras = new Map(); // userId -> texto
    this.opcoes = [];
    this.votos = new Map(); // userId -> opcaoId
    this.revelacao = null;
    this.ganhosDaRodada = new Map();
  }

  // ---------------- gente ----------------
  entrar(user, socketId) {
    let j = this.jogadores.get(user.id);
    if (!j) {
      j = { id: user.id, nickname: user.nickname, pontos: 0, sockets: new Set() };
      this.jogadores.set(user.id, j);
    }
    j.sockets.add(socketId);
    this.transmitir();
  }

  sair(socketId) {
    for (const j of this.jogadores.values()) {
      if (!j.sockets.delete(socketId)) continue;
      // Na sala de espera, quem sai sai de vez; no meio da partida fica
      // (pode voltar e manter os pontos).
      if (j.sockets.size === 0 && this.fase === "aguardando") this.jogadores.delete(j.id);
    }
    if (!this.online().some((j) => j.id === this.donoId)) {
      const novo = this.online()[0];
      if (novo) this.donoId = novo.id;
    }
    if (this.online().length === 0) this.parar();
    else { this.conferirFimAntecipado(); this.transmitir(); }
  }

  online() { return [...this.jogadores.values()].filter((j) => j.sockets.size > 0); }
  vazia() { return this.online().length === 0; }

  // ---------------- controle ----------------
  comecar(userId) {
    if (userId !== this.donoId) return "Só quem criou a sala começa a partida.";
    if (this.fase !== "aguardando" && this.fase !== "fim") return "A partida já está rolando.";
    if (this.online().length < 2) return "Precisa de pelo menos 2 jogadores.";
    for (const j of this.jogadores.values()) j.pontos = 0;
    // Remove quem saiu durante a partida anterior.
    for (const j of [...this.jogadores.values()]) if (j.sockets.size === 0) this.jogadores.delete(j.id);
    this.rodada = 0;
    this.proximaRodada();
    this.iniciarRelogio();
    return null;
  }

  pular(userId) {
    if (userId !== this.donoId) return "Só o dono da sala pode pular.";
    if (this.fase !== "escrever") return "Só dá pra pular enquanto escrevem.";
    this.rodada -= 1; // a rodada pulada não conta
    this.proximaRodada();
    return null;
  }

  proximaRodada() {
    this.limparRodada();
    this.rodada += 1;
    if (this.baralho.length === 0) this.baralho = embaralhar(this.curiosidades.map((c) => c.id));
    const id = this.baralho.shift();
    this.curiosidade = this.curiosidades.find((c) => c.id === id);
    this.fase = "escrever";
    this.tempo = SEG_ESCREVER;
    this.transmitir();
  }

  get multiplicador() { return this.rodada === TOTAL_RODADAS ? 2 : 1; }

  // ---------------- jogadas ----------------
  mentir(userId, texto) {
    if (this.fase !== "escrever") return "Agora não é hora de escrever.";
    if (!this.jogadores.has(userId)) return "Você não está nesta sala.";
    const t = String(texto || "").replace(/\s+/g, " ").trim().slice(0, MAX_MENTIRA);
    if (!t) return "Escreva alguma coisa.";
    if (ehAVerdade(t, this.curiosidade)) return "Essa é a resposta certa! Invente outra mentira.";
    this.mentiras.set(userId, t);
    this.conferirFimAntecipado();
    this.transmitir();
    return null;
  }

  escolher(userId, opcaoId) {
    if (this.fase !== "escolher") return "Agora não é hora de escolher.";
    if (!this.jogadores.has(userId)) return "Você não está nesta sala.";
    const op = this.opcoes.find((o) => o.id === opcaoId);
    if (!op) return "Opção inválida.";
    if (op.autores.includes(userId)) return "Essa é a sua mentira — escolha outra.";
    this.votos.set(userId, opcaoId);
    this.conferirFimAntecipado();
    this.transmitir();
    return null;
  }

  conferirFimAntecipado() {
    const ativos = this.online();
    if (!ativos.length) return;
    if (this.fase === "escrever" && ativos.every((j) => this.mentiras.has(j.id))) this.irParaEscolha();
    else if (this.fase === "escolher" && ativos.every((j) => this.votos.has(j.id))) this.irParaRevelacao();
  }

  // ---------------- fases ----------------
  irParaEscolha() {
    const porTexto = new Map(); // mentiras iguais viram uma opção só
    for (const [uid, t] of this.mentiras) {
      const n = normalizar(t);
      if (!porTexto.has(n)) porTexto.set(n, { id: novoId(), texto: t, autores: [], verdade: false, casa: false });
      porTexto.get(n).autores.push(uid);
    }
    const opcoes = [...porTexto.values(), { id: novoId(), texto: this.curiosidade.verdade, autores: [], verdade: true, casa: false }];
    for (const falsa of embaralhar(this.curiosidade.casa || [])) {
      if (opcoes.length >= MIN_OPCOES) break;
      if (porTexto.has(normalizar(falsa))) continue;
      opcoes.push({ id: novoId(), texto: falsa, autores: [], verdade: false, casa: true });
    }
    this.opcoes = embaralhar(opcoes);
    this.fase = "escolher";
    this.tempo = SEG_ESCOLHER;
    this.transmitir();
  }

  irParaRevelacao() {
    const mult = this.multiplicador;
    const ganhos = new Map();
    const somar = (uid, pts) => ganhos.set(uid, (ganhos.get(uid) || 0) + pts);
    const itens = this.opcoes.map((o) => {
      const escolheram = [...this.votos].filter(([, op]) => op === o.id).map(([uid]) => uid);
      if (o.verdade) escolheram.forEach((uid) => somar(uid, PONTOS_VERDADE * mult));
      else if (o.autores.length && escolheram.length) {
        const cada = Math.round((PONTOS_POR_ENGANADO * mult * escolheram.length) / o.autores.length);
        o.autores.forEach((uid) => somar(uid, cada));
      }
      return { ...o, escolheram };
    });
    for (const [uid, pts] of ganhos) { const j = this.jogadores.get(uid); if (j) j.pontos += pts; }
    this.ganhosDaRodada = ganhos;
    // Ordem da revelação: mentiras em que alguém caiu; a verdade por último.
    const caidas = itens.filter((i) => !i.verdade && i.escolheram.length);
    this.revelacao = { itens: [...caidas, itens.find((i) => i.verdade)], ninguemCaiu: itens.filter((i) => !i.verdade && !i.casa && !i.escolheram.length) };
    this.fase = "revelar";
    this.tempo = Math.min(30, Math.ceil(caidas.length * 3.5) + 6);
    this.transmitir();
  }

  depoisDaRevelacao() {
    if (this.rodada >= TOTAL_RODADAS) {
      this.fase = "fim";
      this.pararRelogio();
      this.transmitir();
    } else this.proximaRodada();
  }

  // ---------------- relógio ----------------
  iniciarRelogio() {
    this.pararRelogio();
    this.timer = setInterval(() => this.tick(), 1000);
  }
  pararRelogio() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  parar() { this.pararRelogio(); }

  tick() {
    if (!["escrever", "escolher", "revelar"].includes(this.fase)) return;
    this.tempo -= 1;
    if (this.tempo > 0) { this.transmitirTempo(); return; }
    if (this.fase === "escrever") this.irParaEscolha();
    else if (this.fase === "escolher") this.irParaRevelacao();
    else this.depoisDaRevelacao();
  }

  // ---------------- o que cada um vê ----------------
  estadoPara(userId) {
    const eu = this.jogadores.get(userId);
    const base = {
      codigo: this.codigo,
      fase: this.fase,
      rodada: this.rodada,
      totalRodadas: TOTAL_RODADAS,
      dobro: this.multiplicador === 2,
      tempo: this.tempo,
      donoId: this.donoId,
      souDono: userId === this.donoId,
      jogadores: [...this.jogadores.values()]
        .map((j) => ({
          id: j.id, nickname: j.nickname, pontos: j.pontos, online: j.sockets.size > 0,
          pronto: this.fase === "escrever" ? this.mentiras.has(j.id) : this.fase === "escolher" ? this.votos.has(j.id) : false,
          ganhou: this.fase === "revelar" || this.fase === "fim" ? this.ganhosDaRodada.get(j.id) || 0 : 0,
        }))
        .sort((a, b) => b.pontos - a.pontos),
      curiosidade: this.curiosidade ? { texto: this.curiosidade.texto } : null,
      minhaMentira: eu ? this.mentiras.get(userId) || null : null,
      meuVoto: this.votos.get(userId) || null,
    };
    if (this.fase === "escolher") {
      base.opcoes = this.opcoes.map((o) => ({ id: o.id, texto: o.texto, minha: o.autores.includes(userId) }));
    }
    if (this.fase === "revelar" || this.fase === "fim") {
      const nome = (uid) => this.jogadores.get(uid)?.nickname || "alguém";
      const traduzir = (i) => ({
        id: i.id, texto: i.texto, verdade: i.verdade, casa: i.casa,
        autores: i.autores.map(nome), escolheram: i.escolheram.map(nome),
        euCai: i.escolheram.includes(userId), minha: i.autores.includes(userId),
      });
      base.revelacao = this.revelacao ? { itens: this.revelacao.itens.map(traduzir), ninguemCaiu: this.revelacao.ninguemCaiu.map(traduzir) } : null;
      if (this.curiosidade) base.curiosidade.verdade = this.curiosidade.verdade;
    }
    return base;
  }

  transmitir() { for (const j of this.jogadores.values()) if (j.sockets.size) this.enviar(j.id, this.estadoPara(j.id)); }
  // Só o relógio mudou: manda o estado inteiro mesmo (poucos jogadores).
  transmitirTempo() { this.transmitir(); }
}
