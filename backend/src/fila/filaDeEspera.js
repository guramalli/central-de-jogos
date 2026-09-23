// FILA DE ESPERA — genérica, pra qualquer jogo. A pessoa COLOCA O NOME na
// fila de um ou de VÁRIOS jogos e segue a vida; é chamada quando juntar gente.
//
// 1. Com o MÍNIMO de um jogo, abre uma janela de SEG_JUNTAR segundos pra mais
//    gente entrar (até o MÁXIMO). Com o máximo, fecha na hora.
// 2. Fechou: vira uma PROPOSTA ("Partida encontrada!"). Cada um tem
//    SEG_ACEITAR segundos pra Aceitar ou Recusar — ninguém é levado pra sala
//    sem confirmar (pode estar jogando Stop, ou longe do computador).
//    Enquanto confirma, a pessoa fica PAUSADA nas outras filas (não perde o
//    lugar, mas não recebe duas "Partida encontrada" ao mesmo tempo).
// 3. Fim da proposta:
//    - aceitou e a partida saiu → sai de TODAS as outras filas;
//    - recusou → sai só da fila desse jogo (continua nas outras);
//    - não respondeu → sai de TODAS (provavelmente saiu de perto);
//    - aceitou mas não deu o mínimo → volta pro COMEÇO dessa fila.
// Bots: só no manual ("Jogar agora com bots"), e também passa pela
// confirmação. Nos jogos sem bot (Acromania), vale "Começar com quem está"
// a partir de `minComecarAgora` pessoas.
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
  filasDe(userId) {
    return [...this.filas].filter(([, f]) => f.some((p) => p.id === userId)).map(([j]) => j);
  }

  pausado(userId) { return this.propostaDe.has(userId); }

  // Quem pode entrar num grupo agora (quem está confirmando outra partida, não).
  disponiveis(jogo) { return this.filas.get(jogo).filter((p) => !this.pausado(p.id)); }

  contagens() {
    return Object.fromEntries([...this.filas].map(([j, f]) => [j, f.length]));
  }

  estadoNoJogo(userId, jogo) {
    const fila = this.filas.get(jogo);
    const cfg = this.jogos[jogo];
    const j = this.juntando.get(jogo);
    return {
      posicao: fila.findIndex((p) => p.id === userId) + 1,
      naFila: fila.length,
      minimo: cfg.min,
      maximo: cfg.max,
      fechaEmMs: j ? Math.max(0, j.fimEm - Date.now()) : null,
      bots: !!cfg.bots,
      pausado: this.pausado(userId),
      podeComecarAgora: cfg.bots ? true : fila.length >= (cfg.minComecarAgora || cfg.min),
    };
  }

  // { filas: { impostor: {...}, tribunal: {...} } } — só os jogos em que a pessoa está.
  estadoDe(userId) {
    return { filas: Object.fromEntries(this.filasDe(userId).map((j) => [j, this.estadoNoJogo(userId, j)])) };
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
    if (!this.jogos[jogo]) return "Jogo inválido.";
    if (this.jogos[jogo].ativo && !this.jogos[jogo].ativo()) return `O ${this.jogos[jogo].nome} está em manutenção agora.`;
    if (this.pausado(user.id)) return "Você tem uma partida esperando confirmação.";
    const fila = this.filas.get(jogo);
    if (fila.some((p) => p.id === user.id)) return null;
    fila.push({ id: user.id, nickname: user.nickname });
    this.mudou(jogo);
    this.enviar(user.id, "fila-estado", this.estadoDe(user.id));
    this.conferirFormacao(jogo);
    return null;
  }

  // Sem `jogo`: tira o nome de TODAS as filas.
  sair(userId, jogo = null) {
    const jogos = jogo ? this.filasDe(userId).filter((j) => j === jogo) : this.filasDe(userId);
    for (const j of jogos) this.tirar(userId, j);
    this.mudou(...jogos);
    this.enviar(userId, "fila-estado", this.estadoDe(userId));
    return null;
  }

  // Todas as abas da pessoa fecharam: sai de todas as filas; se tinha
  // proposta, conta como recusa.
  desconectou(userId) {
    const idProposta = this.propostaDe.get(userId);
    if (idProposta) this.responder(userId, idProposta, false);
    this.sair(userId);
  }

  tirar(userId, jogo) {
    const fila = this.filas.get(jogo);
    const i = fila.findIndex((p) => p.id === userId);
    if (i >= 0) fila.splice(i, 1);
    if (this.disponiveis(jogo).length < this.jogos[jogo].min) this.pararJuntar(jogo);
  }

  // Avisa todo mundo das filas (posição/contagem) e a contagem pública.
  mudou(...jogos) {
    const avisar = new Set();
    for (const jogo of new Set(jogos.filter(Boolean))) for (const p of this.filas.get(jogo)) avisar.add(p.id);
    for (const id of avisar) this.enviar(id, "fila-estado", this.estadoDe(id));
    this.avisarContagem(this.contagens());
  }

  // ---------------- formar grupo ----------------
  conferirFormacao(jogo) {
    if (this.propostaAberta(jogo)) return; // um grupo por vez em cada jogo
    const cfg = this.jogos[jogo];
    const livres = this.disponiveis(jogo);
    if (livres.length >= cfg.max) {
      this.pararJuntar(jogo);
      this.criarProposta(jogo, livres.slice(0, cfg.max), { comBots: false, minimo: cfg.min });
      return;
    }
    if (livres.length >= cfg.min && !this.juntando.get(jogo)) {
      const fimEm = Date.now() + SEG_JUNTAR * 1000;
      const timer = setTimeout(() => {
        this.juntando.delete(jogo);
        const l = this.disponiveis(jogo);
        if (l.length >= cfg.min && !this.propostaAberta(jogo)) this.criarProposta(jogo, l.slice(0, cfg.max), { comBots: false, minimo: cfg.min });
      }, SEG_JUNTAR * 1000);
      this.juntando.set(jogo, { timer, fimEm });
      this.mudou(jogo);
    }
  }

  propostaAberta(jogo) {
    for (const p of this.propostas.values()) if (p.jogo === jogo) return true;
    return false;
  }

  pararJuntar(jogo) {
    const j = this.juntando.get(jogo);
    if (j) { clearTimeout(j.timer); this.juntando.delete(jogo); }
  }

  // "Jogar agora com bots" (ou "Começar com quem está", sem bots): proposta
  // com quem está livre na fila agora. Quem clicou já conta como aceito.
  comecarAgora(userId, jogo) {
    if (!jogo || !this.filasDe(userId).includes(jogo)) return "Seu nome não está nessa fila.";
    if (this.pausado(userId)) return "Você tem uma partida esperando confirmação.";
    if (this.propostaAberta(jogo)) return "Já tem uma partida sendo confirmada nesse jogo. Espere um instante.";
    const cfg = this.jogos[jogo];
    const livres = this.disponiveis(jogo);
    const minimo = cfg.bots ? 1 : (cfg.minComecarAgora || cfg.min);
    if (livres.length < minimo) return `Precisa de pelo menos ${minimo} pessoas na fila.`;
    this.pararJuntar(jogo);
    // Quem clicou vai sempre no grupo, mesmo se a fila estiver cheia.
    const eu = livres.find((p) => p.id === userId);
    const membros = [eu, ...livres.filter((p) => p.id !== userId)].slice(0, cfg.max);
    this.criarProposta(jogo, membros, { comBots: !!cfg.bots, minimo, iniciadaPor: userId });
    return null;
  }

  criarProposta(jogo, membros, { comBots, minimo, iniciadaPor = null }) {
    const ids = new Set(membros.map((m) => m.id));
    this.filas.set(jogo, this.filas.get(jogo).filter((p) => !ids.has(p.id)));
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
    for (const m of membros) this.propostaDe.set(m.id, id);
    this.avisarProposta(p);
    // Saíram dessa fila e ficaram pausados nas outras.
    this.mudou(jogo, ...new Set(membros.flatMap((m) => this.filasDe(m.id))));
    for (const m of membros) this.enviar(m.id, "fila-estado", this.estadoDe(m.id));
    // Sozinho na fila com "Jogar agora com bots": já está tudo confirmado.
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
    const nome = this.jogos[p.jogo].nome;
    const tocados = new Set([p.jogo]);

    const aceitos = p.membros.filter((m) => p.aceitos.has(m.id));
    for (const m of p.membros.filter((x) => !p.aceitos.has(x.id))) {
      const recusou = p.recusados.has(m.id);
      if (!recusou) { // não respondeu: sai de TODAS as filas
        for (const j of this.filasDe(m.id)) { this.tirar(m.id, j); tocados.add(j); }
      }
      this.enviar(m.id, "fila-estado", this.estadoDe(m.id));
      this.enviar(m.id, "fila-fim", {
        ok: false,
        motivo: recusou ? "recusou" : "sem-resposta",
        mensagem: recusou
          ? `Você recusou a partida e tirou seu nome da fila do ${nome}.`
          : "Você não confirmou a partida, então tiramos seu nome de todas as filas.",
      });
    }

    if (aceitos.length >= p.minimo) {
      let destino;
      try {
        destino = this.jogos[p.jogo].criarSala({ membros: aceitos, comBots: p.comBots });
      } catch (err) {
        console.error(`Fila: falha ao criar a sala de ${p.jogo}:`, err);
        this.devolver(p.jogo, aceitos, "Não foi possível criar a sala. Seu nome voltou pra fila.");
        return this.retomar(tocados, aceitos);
      }
      // Partida saiu: tira o nome das outras filas.
      for (const m of aceitos) {
        for (const j of this.filasDe(m.id)) { this.tirar(m.id, j); tocados.add(j); }
        this.enviar(m.id, "fila-estado", this.estadoDe(m.id));
        this.enviar(m.id, "fila-fim", { ok: true, jogo: p.jogo, destino });
      }
      this.mudou(...tocados);
      return this.retomar(tocados, []);
    }
    this.devolver(p.jogo, aceitos, "Nem todo mundo confirmou. Seu nome voltou pro começo da fila.");
    this.retomar(tocados, aceitos);
  }

  // Quem aceitou volta pro COMEÇO da fila desse jogo, na mesma ordem.
  devolver(jogo, membros, mensagem) {
    const ids = new Set(membros.map((m) => m.id));
    this.filas.set(jogo, [...membros, ...this.filas.get(jogo).filter((p) => !ids.has(p.id))]);
    for (const m of membros) {
      this.enviar(m.id, "fila-estado", this.estadoDe(m.id));
      this.enviar(m.id, "fila-fim", { ok: false, motivo: "voltou", mensagem });
    }
  }

  // Terminou a pausa: as filas em que essas pessoas estão podem formar grupo.
  retomar(tocados, pessoas) {
    for (const m of pessoas) for (const j of this.filasDe(m.id)) tocados.add(j);
    this.mudou(...tocados);
    for (const jogo of Object.keys(this.jogos)) this.conferirFormacao(jogo);
  }

  parar() {
    for (const j of this.juntando.values()) clearTimeout(j.timer);
    for (const p of this.propostas.values()) clearTimeout(p.timer);
    this.juntando.clear();
    this.propostas.clear();
  }
}
