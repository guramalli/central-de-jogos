// FILA DE ESPERA ("Jogar agora") — genérica, pra qualquer jogo.
//
// 1. A pessoa entra na fila de um jogo (uma fila por pessoa).
// 2. Com o MÍNIMO do jogo, abre uma janela de SEG_JUNTAR segundos pra mais
//    gente entrar (até o MÁXIMO). Com o máximo, fecha na hora.
// 3. Fechou: vira uma PROPOSTA ("Partida encontrada!"). Cada um tem
//    SEG_ACEITAR segundos pra Aceitar ou Recusar — ninguém é levado pra sala
//    sem confirmar (pode estar jogando Stop, ou longe do computador).
// 4. Fim da proposta:
//    - aceitaram pelo menos o mínimo → cria a sala SÓ com quem aceitou;
//    - não deu o mínimo → quem aceitou volta pro COMEÇO da fila;
//    - quem recusou ou não respondeu sai da fila (com aviso).
// Bots: só no manual ("Começar agora com bots"), e também passa pela
// confirmação. Nos jogos sem bot (Acromania), o botão é "Começar agora" e
// vale a partir de `minComecarAgora` pessoas.
//
// Sem socket nem banco aqui: tudo sai por `enviar(userId, evento, dados)` e
// `contagem(dados)`, e a sala é criada por `jogos[jogo].criarSala(...)`.

export const SEG_JUNTAR = 10;
export const SEG_ACEITAR = 20;

export class Filas {
  // jogos: { chave: { nome, min, max, bots, minComecarAgora, criarSala({ membros, comBots }) => destino } }
  constructor({ jogos, enviar, contagem = () => {} }) {
    this.jogos = jogos;
    this.enviar = enviar;
    this.avisarContagem = contagem;
    this.filas = new Map(Object.keys(jogos).map((j) => [j, []])); // jogo -> [{ id, nickname }]
    this.juntando = new Map(); // jogo -> { timer, fimEm }
    this.propostas = new Map(); // id -> proposta
    this.propostaDe = new Map(); // userId -> id da proposta
    this.seq = 0;
  }

  // ---------------- consultas ----------------
  filaDe(userId) {
    for (const [jogo, fila] of this.filas) if (fila.some((p) => p.id === userId)) return jogo;
    return null;
  }

  contagens() {
    return Object.fromEntries([...this.filas].map(([j, f]) => [j, f.length]));
  }

  estadoDe(userId) {
    const jogo = this.filaDe(userId);
    if (!jogo) return { jogo: null };
    const fila = this.filas.get(jogo);
    const cfg = this.jogos[jogo];
    const j = this.juntando.get(jogo);
    return {
      jogo,
      posicao: fila.findIndex((p) => p.id === userId) + 1,
      naFila: fila.length,
      minimo: cfg.min,
      maximo: cfg.max,
      fechaEmMs: j ? Math.max(0, j.fimEm - Date.now()) : null,
      bots: !!cfg.bots,
      podeComecarAgora: cfg.bots ? fila.length >= 1 : fila.length >= (cfg.minComecarAgora || cfg.min),
    };
  }

  propostaPara(userId) {
    const p = this.propostas.get(this.propostaDe.get(userId));
    if (!p) return null;
    return {
      id: p.id,
      jogo: p.jogo,
      nomeJogo: this.jogos[p.jogo].nome,
      total: p.membros.length,
      aceitos: p.aceitos.size,
      eu: p.aceitos.has(userId) ? "aceitei" : null,
      comBots: p.comBots,
      prazoMs: Math.max(0, p.fimEm - Date.now()),
    };
  }

  // ---------------- entrar / sair ----------------
  entrar(user, jogo) {
    const cfg = this.jogos[jogo];
    if (!cfg) return "Jogo inválido.";
    if (this.propostaDe.has(user.id)) return "Você tem uma partida esperando confirmação.";
    const atual = this.filaDe(user.id);
    if (atual === jogo) return null;
    if (atual) this.tirar(user.id, atual);
    this.filas.get(jogo).push({ id: user.id, nickname: user.nickname });
    this.mudou(jogo, atual);
    this.conferirFormacao(jogo);
    return null;
  }

  sair(userId) {
    const jogo = this.filaDe(userId);
    if (!jogo) return null;
    this.tirar(userId, jogo);
    this.mudou(jogo);
    this.enviar(userId, "fila-estado", this.estadoDe(userId));
    return null;
  }

  // Todas as abas da pessoa fecharam: sai da fila; se tinha proposta, recusa.
  desconectou(userId) {
    const idProposta = this.propostaDe.get(userId);
    if (idProposta) this.responder(userId, idProposta, false);
    this.sair(userId);
  }

  tirar(userId, jogo) {
    const fila = this.filas.get(jogo);
    const i = fila.findIndex((p) => p.id === userId);
    if (i >= 0) fila.splice(i, 1);
    const cfg = this.jogos[jogo];
    if (fila.length < cfg.min) this.pararJuntar(jogo);
  }

  // Avisa todo mundo da fila (posição/contagem) e a contagem pública.
  mudou(...jogos) {
    for (const jogo of new Set(jogos.filter(Boolean))) {
      for (const p of this.filas.get(jogo)) this.enviar(p.id, "fila-estado", this.estadoDe(p.id));
    }
    this.avisarContagem(this.contagens());
  }

  // ---------------- formar grupo ----------------
  conferirFormacao(jogo) {
    const cfg = this.jogos[jogo];
    const fila = this.filas.get(jogo);
    if (fila.length >= cfg.max) {
      this.pararJuntar(jogo);
      return this.criarProposta(jogo, fila.slice(0, cfg.max), { comBots: false, minimo: cfg.min });
    }
    if (fila.length >= cfg.min && !this.juntando.get(jogo)) {
      const fimEm = Date.now() + SEG_JUNTAR * 1000;
      const timer = setTimeout(() => {
        this.juntando.delete(jogo);
        const f = this.filas.get(jogo);
        if (f.length >= cfg.min) this.criarProposta(jogo, f.slice(0, cfg.max), { comBots: false, minimo: cfg.min });
      }, SEG_JUNTAR * 1000);
      this.juntando.set(jogo, { timer, fimEm });
      this.mudou(jogo);
    }
  }

  pararJuntar(jogo) {
    const j = this.juntando.get(jogo);
    if (j) { clearTimeout(j.timer); this.juntando.delete(jogo); }
  }

  // "Começar agora com bots" (ou "Começar agora", sem bots): proposta com
  // quem está na fila agora. Quem clicou já conta como aceito.
  comecarAgora(userId) {
    const jogo = this.filaDe(userId);
    if (!jogo) return "Você não está na fila.";
    const cfg = this.jogos[jogo];
    const fila = this.filas.get(jogo);
    if (!cfg.bots && fila.length < (cfg.minComecarAgora || cfg.min)) {
      return `Precisa de pelo menos ${cfg.minComecarAgora || cfg.min} pessoas na fila.`;
    }
    this.pararJuntar(jogo);
    const membros = fila.slice(0, cfg.max);
    const minimo = cfg.bots ? 1 : (cfg.minComecarAgora || cfg.min);
    this.criarProposta(jogo, membros, { comBots: !!cfg.bots, minimo, iniciadaPor: userId });
    return null;
  }

  criarProposta(jogo, membros, { comBots, minimo, iniciadaPor = null }) {
    const fila = this.filas.get(jogo);
    const ids = new Set(membros.map((m) => m.id));
    this.filas.set(jogo, fila.filter((p) => !ids.has(p.id)));
    const id = `p${++this.seq}`;
    const p = {
      id, jogo, membros, comBots, minimo,
      aceitos: new Set(iniciadaPor ? [iniciadaPor] : []),
      recusados: new Set(),
      fimEm: Date.now() + SEG_ACEITAR * 1000,
      timer: null,
    };
    p.timer = setTimeout(() => this.resolver(id), SEG_ACEITAR * 1000);
    this.propostas.set(id, p);
    for (const m of membros) {
      this.propostaDe.set(m.id, id);
      this.enviar(m.id, "fila-estado", this.estadoDe(m.id)); // saiu da fila (está confirmando)
    }
    this.avisarProposta(p);
    this.mudou(jogo);
    // Sozinho na fila com "Começar agora com bots": já está tudo confirmado.
    if (p.aceitos.size >= p.membros.length) this.resolver(id);
    return p;
  }

  avisarProposta(p) {
    for (const m of p.membros) this.enviar(m.id, "fila-proposta", this.propostaPara(m.id));
  }

  // ---------------- aceitar / recusar ----------------
  responder(userId, idProposta, aceitou) {
    const p = this.propostas.get(idProposta);
    if (!p || this.propostaDe.get(userId) !== idProposta) return "Essa partida já não está mais esperando.";
    if (aceitou) p.aceitos.add(userId);
    else { p.aceitos.delete(userId); p.recusados.add(userId); }
    if (p.aceitos.size + p.recusados.size >= p.membros.length) this.resolver(idProposta);
    else this.avisarProposta(p);
    return null;
  }

  resolver(idProposta) {
    const p = this.propostas.get(idProposta);
    if (!p) return;
    clearTimeout(p.timer);
    this.propostas.delete(idProposta);
    for (const m of p.membros) this.propostaDe.delete(m.id);

    const aceitos = p.membros.filter((m) => p.aceitos.has(m.id));
    const ficaram = p.membros.filter((m) => !p.aceitos.has(m.id));
    for (const m of ficaram) {
      this.enviar(m.id, "fila-estado", this.estadoDe(m.id));
      this.enviar(m.id, "fila-fim", {
        ok: false,
        motivo: p.recusados.has(m.id) ? "recusou" : "sem-resposta",
        mensagem: p.recusados.has(m.id)
          ? `Você recusou a partida e saiu da fila do ${this.jogos[p.jogo].nome}.`
          : `Você saiu da fila do ${this.jogos[p.jogo].nome} porque não confirmou a partida.`,
      });
    }

    if (aceitos.length >= p.minimo) {
      let destino;
      try {
        destino = this.jogos[p.jogo].criarSala({ membros: aceitos, comBots: p.comBots });
      } catch (err) {
        console.error(`Fila: falha ao criar a sala de ${p.jogo}:`, err);
        return this.devolver(p.jogo, aceitos, "Não foi possível criar a sala. Você voltou pra fila.");
      }
      for (const m of aceitos) this.enviar(m.id, "fila-fim", { ok: true, jogo: p.jogo, destino });
      this.mudou(p.jogo);
      return;
    }
    this.devolver(p.jogo, aceitos, "Nem todo mundo confirmou. Você voltou pro começo da fila.");
  }

  // Quem aceitou volta pro COMEÇO da fila, na mesma ordem.
  devolver(jogo, membros, mensagem) {
    const fila = this.filas.get(jogo);
    const ids = new Set(membros.map((m) => m.id));
    this.filas.set(jogo, [...membros, ...fila.filter((p) => !ids.has(p.id))]);
    for (const m of membros) this.enviar(m.id, "fila-fim", { ok: false, motivo: "voltou", mensagem });
    this.mudou(jogo);
    this.conferirFormacao(jogo);
  }

  parar() {
    for (const j of this.juntando.values()) clearTimeout(j.timer);
    for (const p of this.propostas.values()) clearTimeout(p.timer);
    this.juntando.clear();
    this.propostas.clear();
  }
}
