import { ACUSACOES, SENTENCAS, ARGUMENTOS_BOT, PACOTES } from "./acusacoes.js";

// O TRIBUNAL — motor de uma sala (só memória).
//
// Rodada: um jogador é o RÉU de um crime absurdo; um PROMOTOR tenta
// condenar, um ADVOGADO tenta salvar; o réu tem a ÚLTIMA PALAVRA; os
// JURADOS votam CULPADO ou INOCENTE.
//
// Cada CASO é um debate em rodadas (zip 575):
//   escrever (90s)      → promotor e advogado escrevem AO MESMO TEMPO
//   julgamento (16s)    → os dois argumentos aparecem (8s cada)
//   deliberar (15s)     → o JÚRI decide: "mais provas" (nova rodada) ou
//                         "prontos pra votar"; máx. 2 rodadas; empate = prontos
//   ultima (45s)        → o réu escreve a ÚLTIMA PALAVRA
//   palavraFinal (8s)   → a última palavra aparece
//   votar (20s)         → CULPADO / INOCENTE (+ curtidas em qualquer frase)
//   veredito (8s)       → pena e pontos
//
// Papéis: no modo ROTATIVO (padrão), cada jogador é réu uma vez (casos = nº
// de jogadores na largada). No modo FIXO (zip 585), o elenco é sorteado uma
// vez e, depois de cada veredito, TODOS votam "sortear de novo" ou "manter
// os papéis" (só muda o crime) — empate ou sem votos: mantém. Com 5+
// jogadores na rodada, sobra gente pra uma TESTEMUNHA (deps da acusação e
// da defesa), além do júri. Última caso vale o DOBRO. Empate: in dubio pro reo.

// Mínimo 3 (era 4): com exatamente 3 na rodada, o réu se defende SOZINHO
// (é promotor × réu em causa própria, e 1 jurado); com 4 ou mais, tem
// advogado separado e o réu dá a última palavra no fim.
export const MIN_JOGADORES = 3;
export const MAX_JOGADORES = 8;
// 90s (era 40): no celular não dava tempo de escrever um argumento. O
// limite é só pra quem demora — quando os três entregam, o julgamento
// começa na hora (a rodada não fica mais lenta).
export const SEG_ESCREVER = 90;
// Leitura: 8s por texto (era 5 — pouco pra ler acusação e defesa de até 200
// caracteres). A tela divide este total por 3, sincronizada pelo relógio.
export const SEG_POR_TEXTO = 8;
export const SEG_JULGAMENTO = SEG_POR_TEXTO * 3;
export const SEG_VOTAR = 20; // (era 15) acaba antes se todos votarem
// Debate em rodadas (zip 575): depois de cada rodada, o JÚRI decide se quer
// mais provas ou se está pronto. Máximo de 2 rodadas por caso (era 3; com 3
// uma sessão de 8 passava de 40 minutos).
export const MAX_DEBATE = 2;
export const SEG_DELIBERAR = 15;
export const SEG_ULTIMA = 45;   // última palavra do réu (acaba quando ele entrega)
export const SEG_VEREDITO = 8;
export const SEG_ESCOLHA_PAPEIS = 15; // modo fixo: votação "sortear" x "manter"
export const MAX_TEXTO = 200;
export const MAX_CURTIDAS = 3; // (era 2) com o debate há mais frases pra curtir

// Pontos (× 2 na última rodada)
export const PONTOS = {
  vitoria: 500,      // advogado se inocentado, promotor se condenado
  derrota: 100,      // quem perdeu o duelo (por ter lutado)
  unanimidade: 200,  // bônus pra quem venceu com TODOS os votos (≥2 votos)
  reuSalvo: 200,     // réu inocentado
  juradoMaioria: 100,
  curtida: 100,
  testemunha: 100,   // por ter depoido (não toma partido — só participa)
};

const PADRAO = {
  promotor: "O promotor não compareceu à audiência.",
  advogado: "O advogado não compareceu à audiência.",
  acusado: "O réu preferiu ficar em silêncio.",
  testemunha: "A testemunha não quis depor.",
};
const PAPEIS = ["promotor", "advogado", "acusado"];
const FASES_COM_RELOGIO = ["escrever", "julgamento", "deliberar", "ultima", "palavraFinal", "votar", "veredito", "escolhaPapeis"];
const MAX_CHAT = 60;
export const REACOES = ["😂", "⚖️", "😱", "🔥", "👏", "🤡"];

function embaralhar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const novoId = () => Math.random().toString(36).slice(2, 8);
const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];

export class TribunalRoom {
  // opcoes.publica: sala ABERTA (dono = quem chegou primeiro).
  // opcoes.permiteBots: se o dono pode chamar bots pra completar.
  constructor(codigo, dono, enviar, acusacoes = ACUSACOES, opcoes = {}) {
    this.codigo = codigo;
    this.publica = !!opcoes.publica;
    this.permiteBots = opcoes.permiteBots !== false;
    this.nomeSala = opcoes.nome || null;
    this.donoId = dono?.id || null;
    this.enviar = enviar;
    this.acusacoes = acusacoes;
    this.baralho = [];
    this.ultimaAcusacaoIdx = -1;
    this.jogadores = new Map();
    this.fase = "aguardando";
    this.rodada = 0;
    this.totalRodadas = 0;
    this.ordem = [];            // réus, na ordem (modo rotativo)
    this.modoPapeis = "rotativo";   // "rotativo" | "fixo" (zip 585)
    this.contagemPapel = new Map(); // userId -> { promotor, advogado, acusado, testemunha }
    this.votosPapeis = new Map();   // modo fixo: userId -> "sortear" | "manter"
    this.tempo = 0;
    this.tempoTotal = 0;
    this.timer = null;
    this.chat = [];
    this.reacoes = [];
    this.ultimaFala = new Map();
    this.patentes = new Map();
    this.aoFimDePartida = null;
    this.limparRodada();
  }

  limparRodada() {
    this.papeis = { acusado: null, promotor: null, advogado: null, testemunha: null };
    this.causaPropria = false;      // réu = advogado (rodada com 3 jogadores)
    this.acusacao = null;
    this.pacoteAcusacao = null;
    this.debate = [];               // [{ promotor, advogado }] — uma entrada por rodada de debate
    this.ultima = null;             // última palavra do réu
    this.deliberacao = new Map();   // juradoId -> "mais" | "prontos"
    this.votos = new Map();         // juradoId -> "culpado" | "inocente"
    this.curtidas = new Map();      // juradoId -> Set(chave da frase)
    this.resultado = null;
  }

  novoJogador(id, nickname, bot = false) {
    return { id, nickname, bot, sockets: new Set(), pontos: 0, ganhou: 0, naPartida: false, agenda: null,
      stats: { vitorias: 0, absolvido: 0, curtidas: 0, juriCerto: 0 } };
  }

  // ---------------- entrada e saída ----------------
  entrar(user, socketId) {
    let j = this.jogadores.get(user.id);
    if (!j) {
      if (this.jogadores.size >= MAX_JOGADORES) return "Sala cheia (8 jogadores).";
      j = this.novoJogador(user.id, user.nickname); this.jogadores.set(user.id, j);
      this.avisoChat(`👋 ${user.nickname} entrou na sala.`);
    }
    j.sockets.add(socketId);
    if (!this.donoId || !this.humanos().some((h) => h.id === this.donoId)) this.donoId = user.id;
    if (!this.timer && FASES_COM_RELOGIO.includes(this.fase)) this.iniciarRelogio();
    this.transmitir();
    return null;
  }

  sair(socketId) {
    for (const j of this.jogadores.values()) {
      if (!j.sockets.delete(socketId)) continue;
      if (j.sockets.size === 0 && (this.fase === "aguardando" || this.fase === "fim")) this.jogadores.delete(j.id);
    }
    if (!this.humanos().some((j) => j.id === this.donoId)) this.donoId = this.humanos()[0]?.id || null;
    if (this.vazia()) this.parar();
    else { this.conferirFimAntecipado(); this.transmitir(); }
  }

  online() { return [...this.jogadores.values()].filter((j) => j.bot || j.sockets.size > 0); }
  humanos() { return this.online().filter((j) => !j.bot); }
  vazia() { return this.humanos().length === 0; }
  naPartidaOnline() { return this.online().filter((j) => j.naPartida); }

  adicionarBot(userId) {
    if (userId !== this.donoId) return "Só o dono da sala adiciona bots.";
    if (!this.permiteBots) return "Esta sala é só com gente de verdade.";
    if (this.fase !== "aguardando" && this.fase !== "fim") return "Dá pra chamar bots só antes de começar.";
    if (this.jogadores.size >= MAX_JOGADORES) return "Sala cheia.";
    const n = [...this.jogadores.values()].filter((j) => j.bot).length + 1;
    const id = `bot-${this.codigo}-${n}-${novoId()}`;
    this.jogadores.set(id, this.novoJogador(id, `Robô Jurista ${n}`, true));
    this.transmitir();
    return null;
  }

  removerBots(userId) {
    if (userId !== this.donoId) return "Só o dono da sala remove bots.";
    if (this.fase !== "aguardando" && this.fase !== "fim") return "Só antes de começar.";
    for (const j of [...this.jogadores.values()]) if (j.bot) this.jogadores.delete(j.id);
    this.transmitir();
    return null;
  }

  // Sala ABERTA que esvaziou: volta pra espera.
  reiniciarVazia() {
    this.pararRelogio();
    this.limparRodada();
    for (const j of [...this.jogadores.values()]) if (j.bot || j.sockets.size === 0) this.jogadores.delete(j.id);
    this.fase = "aguardando"; this.rodada = 0; this.totalRodadas = 0; this.ordem = [];
    this.modoPapeis = "rotativo"; this.baralho = []; this.chat = [];
    this.donoId = this.humanos()[0]?.id || null;
  }

  // Dono muda o modo ANTES de começar. "rotativo" (padrão): papéis mudam a
  // cada caso, todo mundo passa por todos. "fixo": elenco sorteado uma vez,
  // e o grupo vota depois de cada veredito se quer sortear de novo.
  definirModoPapeis(userId, modo) {
    if (userId !== this.donoId) return "Só o dono da sala muda o modo.";
    if (this.fase !== "aguardando" && this.fase !== "fim") return "Só dá pra mudar antes de começar.";
    if (modo !== "rotativo" && modo !== "fixo") return "Modo inválido.";
    this.modoPapeis = modo;
    this.transmitir();
    return null;
  }

  // ---------------- partida ----------------
  comecar(userId) {
    if (userId !== this.donoId) return "Só o dono da sala começa a partida.";
    if (this.fase !== "aguardando" && this.fase !== "fim") return "A partida já começou.";
    const na = this.online();
    if (na.length < MIN_JOGADORES) return `Precisa de pelo menos ${MIN_JOGADORES} jogadores.`;
    for (const j of this.jogadores.values()) { j.pontos = 0; j.ganhou = 0; j.naPartida = false; j.stats = { vitorias: 0, absolvido: 0, curtidas: 0, juriCerto: 0 }; }
    for (const j of na) j.naPartida = true;
    this.totalRodadas = na.length;
    this.contagemPapel = new Map(na.map((j) => [j.id, { promotor: 0, advogado: 0, acusado: 0, testemunha: 0 }]));
    this.rodada = 0;
    this.avisoChat("⚖️ Silêncio no tribunal! A sessão vai começar.");
    if (this.modoPapeis === "fixo") {
      this.ordem = []; this.plano = null;
      this.rodada = 1;
      this.limparRodada();
      this.iniciarCaso(this.montarElenco(na.map((j) => j.id), null));
    } else {
      this.ordem = embaralhar(na.map((j) => j.id));
      this.plano = this.planejarPapeis(this.ordem);
      this.proximaRodada();
    }
    this.iniciarRelogio();
    return null;
  }

  get ehUltima() { return this.rodada === this.totalRodadas; }
  get multiplicador() { return this.ehUltima ? 2 : 1; }

  // Sorteio = baralho embaralhado (Fisher-Yates): nenhum crime repete até
  // todos saírem. Ao reembaralhar, garante que o primeiro do baralho novo não
  // seja o último que acabou de sair (senão repetiria em sequência).
  tirarAcusacao() {
    if (this.baralho.length === 0) {
      this.baralho = embaralhar(this.acusacoes.map((_, i) => i));
      if (this.acusacoes.length > 1 && this.baralho[0] === this.ultimaAcusacaoIdx) {
        this.baralho.push(this.baralho.shift());
      }
    }
    this.ultimaAcusacaoIdx = this.baralho.shift();
    return this.acusacoes[this.ultimaAcusacaoIdx];
  }

  // Promotor e advogado: entre os que NÃO são o réu, quem menos fez aquele
  // papel (sorteio no empate), sem repetir a mesma pessoa nos dois.
  // Equilíbrio: primeiro quem teve MENOS papéis no total (promotor +
  // advogado); no empate, quem menos fez ESTE papel; depois, sorteio.
  escolherPapel(papel, candidatos) {
    const vazio = () => ({ promotor: 0, advogado: 0, acusado: 0, testemunha: 0 });
    const c0 = (id) => this.contagemPapel.get(id) || vazio();
    const total = (id) => { const c = c0(id); return c.promotor + c.advogado + c.acusado + c.testemunha; };
    const peso = (id) => total(id) * 100 + c0(id)[papel];
    const menor = Math.min(...candidatos.map(peso));
    const escolhido = sortear(candidatos.filter((id) => peso(id) === menor));
    const c = this.contagemPapel.get(escolhido) || vazio();
    c[papel]++; this.contagemPapel.set(escolhido, c);
    return escolhido;
  }

  // Monta o elenco de UM caso: réu (dado, no rotativo, ou sorteado, no fixo),
  // promotor/advogado (ou causaPropria, com 3 na rodada) e, se sobrar gente
  // (2+ depois desses três), uma TESTEMUNHA — o resto vira júri. No rotativo,
  // reaproveita o plano equilibrado da largada (this.plano); sem plano (modo
  // fixo, ou plano indisponível), escolhe na hora com escolherPapel.
  montarElenco(presentes, reuFixo = null) {
    const reu = reuFixo && presentes.includes(reuFixo) ? reuFixo : this.escolherPapel("acusado", presentes);
    const outros = presentes.filter((id) => id !== reu);
    let promotor, advogado;
    if (presentes.length === 3) {
      const planejado = this.plano?.[this.rodada - 1];
      promotor = planejado && outros.includes(planejado.promotor) ? planejado.promotor : this.escolherPapel("promotor", outros);
      if (planejado && promotor === planejado.promotor) { const c = this.contagemPapel.get(promotor); if (c) c.promotor++; }
      advogado = reu;
    } else {
      const planejado = this.plano?.[this.rodada - 1];
      if (planejado && outros.includes(planejado.promotor) && outros.includes(planejado.advogado)) {
        ({ promotor, advogado } = planejado);
        for (const [papel, id] of [["promotor", promotor], ["advogado", advogado]]) { const c = this.contagemPapel.get(id); if (c) c[papel]++; }
      } else {
        promotor = this.escolherPapel("promotor", outros);
        advogado = this.escolherPapel("advogado", outros.filter((id) => id !== promotor));
      }
    }
    const resto = outros.filter((id) => id !== promotor && id !== advogado);
    const testemunha = resto.length >= 2 ? this.escolherPapel("testemunha", resto) : null;
    return { acusado: reu, promotor, advogado, testemunha };
  }

  // Planeja promotor/advogado de TODAS as rodadas na largada: testa várias
  // combinações e fica com a mais equilibrada (cada um com o mesmo número de
  // papéis, ±1). Escolher rodada a rodada às vezes "encurralava": quem mais
  // precisava de papel era justamente o réu da última rodada.
  planejarPapeis(ordem) {
    let melhor = null, melhorNota = Infinity;
    for (let tentativa = 0; tentativa < 300; tentativa++) {
      const cont = new Map(ordem.map((id) => [id, { promotor: 0, advogado: 0 }]));
      const plano = ordem.map((reu) => {
        const outros = embaralhar(ordem.filter((id) => id !== reu));
        const pega = (papel, cands) => {
          const peso = (id) => (cont.get(id).promotor + cont.get(id).advogado) * 100 + cont.get(id)[papel];
          const menor = Math.min(...cands.map(peso));
          const id = cands.find((c) => peso(c) === menor);
          cont.get(id)[papel]++;
          return id;
        };
        const promotor = pega("promotor", outros);
        if (ordem.length === 3) return { promotor, advogado: reu };
        const advogado = pega("advogado", outros.filter((id) => id !== promotor));
        return { promotor, advogado };
      });
      const totais = [...cont.values()].map((c) => c.promotor + c.advogado);
      const porPapel = [...cont.values()].flatMap((c) => [c.promotor, c.advogado]);
      const nota = (Math.max(...totais) - Math.min(...totais)) * 10 + (Math.max(...porPapel) - Math.min(...porPapel));
      if (nota < melhorNota) { melhor = plano; melhorNota = nota; if (nota <= 1) break; }
    }
    return melhor;
  }

  proximaRodada() {
    // pula réus que caíram
    while (this.rodada < this.totalRodadas) {
      this.rodada++;
      const reu = this.ordem[this.rodada - 1];
      const presentes = this.naPartidaOnline().map((j) => j.id);
      if (presentes.length < MIN_JOGADORES) { this.encerrar("Faltou gente no tribunal: a sessão foi encerrada."); return; }
      if (!presentes.includes(reu)) continue;
      this.limparRodada();
      this.iniciarCaso(this.montarElenco(presentes, reu));
      return;
    }
    this.encerrar();
  }

  // Monta o caso a partir de um elenco pronto: define papéis, sorteia o
  // crime (com o pacote opcional de testemunha/prova/álibi) e abre a escrita.
  iniciarCaso(elenco) {
    this.papeis = { acusado: elenco.acusado, promotor: elenco.promotor, advogado: elenco.advogado, testemunha: elenco.testemunha };
    this.causaPropria = elenco.advogado === elenco.acusado;
    this.acusacao = this.tirarAcusacao();
    // Pacote opcional (zip 585): testemunha (dossiê), prova e álibi. Nem todo
    // crime tem — quem não tem, mostra só o crime, como sempre foi.
    this.pacoteAcusacao = PACOTES[this.acusacao] || null;
    this.avisoChat(`⚖️ Caso ${this.rodada}: ${this.jogadores.get(elenco.acusado).nickname} no banco dos réus!`);
    this.novoDebate();
  }

  // ---------------- debate (até MAX_DEBATE rodadas) ----------------
  novoDebate() {
    // testemunha só depõe na 1ª rodada do debate (this.debate.length será 1
    // nesse push); nas seguintes o campo fica sempre null e não é cobrado.
    this.debate.push({ promotor: null, advogado: null, testemunha: null });
    this.deliberacao = new Map();
    this.fase = "escrever";
    this.tempo = this.tempoTotal = SEG_ESCREVER;
    if (this.debate.length > 1) this.avisoChat(`🔍 O júri quer mais provas! Rodada ${this.debate.length} de debate.`);
    this.transmitir();
  }
  get debateAtual() { return this.debate[this.debate.length - 1]; }

  papelDe(userId) {
    if (this.papeis.testemunha === userId) return "testemunha";
    for (const p of PAPEIS) if (this.papeis[p] === userId) return p;
    const j = this.jogadores.get(userId);
    return j?.naPartida ? "jurado" : "fora";
  }
  jurados() { return this.naPartidaOnline().filter((j) => this.papelDe(j.id) === "jurado"); }
  ausente(uid) { const j = this.jogadores.get(uid); return !j || (!j.bot && j.sockets.size === 0); }

  // Promotor e advogado escrevem no DEBATE; o réu escreve a ÚLTIMA PALAVRA.
  escrever(userId, texto) {
    const papel = this.papelDe(userId);
    const t = String(texto || "").replace(/\s+/g, " ").trim().slice(0, MAX_TEXTO);
    if (this.fase === "escrever") {
      if (papel === "acusado") return "Agora é o debate: sua última palavra vem no final, antes do veredito.";
      if (papel === "testemunha") {
        if (this.debate.length > 1) return "Você já deu seu depoimento; agora é a réplica entre promotor e advogado.";
        if (!t) return "Escreva seu depoimento.";
        this.debateAtual.testemunha = t;
      } else if (papel === "promotor" || papel === "advogado") {
        if (!t) return "Escreva seu argumento.";
        this.debateAtual[papel] = t;
      } else return "Nesta rodada você é jurado: só observe (e julgue)!";
    } else if (this.fase === "ultima") {
      if (papel !== "acusado") return "Agora só o réu fala.";
      if (!t) return "Escreva sua última palavra.";
      this.ultima = t;
    } else return "Agora não é hora de escrever.";
    this.conferirFimAntecipado();
    this.transmitir();
    return null;
  }

  irParaLeitura() {
    this.fase = "julgamento";
    // com testemunha, a 1ª rodada tem 3 textos pra ler (8s cada) em vez de 2.
    const itens = (this.debate.length === 1 && this.papeis.testemunha) ? 3 : 2;
    this.tempo = this.tempoTotal = SEG_POR_TEXTO * itens;
    this.transmitir();
  }

  irParaDeliberacao() {
    // Depois da última rodada possível, não há o que deliberar.
    if (this.debate.length >= MAX_DEBATE || this.jurados().length === 0) { this.irParaUltimaPalavra(); return; }
    this.fase = "deliberar";
    this.deliberacao = new Map();
    this.tempo = this.tempoTotal = SEG_DELIBERAR;
    this.transmitir();
  }

  deliberar(userId, escolha) {
    if (this.fase !== "deliberar") return "Agora não é hora de deliberar.";
    if (this.papelDe(userId) !== "jurado") return "Só os jurados decidem.";
    if (escolha !== "mais" && escolha !== "prontos") return "Escolha inválida.";
    this.deliberacao.set(userId, escolha);
    this.conferirFimAntecipado();
    this.transmitir();
    return null;
  }

  fecharDeliberacao() {
    let mais = 0, prontos = 0;
    for (const v of this.deliberacao.values()) v === "mais" ? mais++ : prontos++;
    // maioria quer mais provas -> nova rodada; empate (ou ninguém votou) -> prontos
    if (mais > prontos) this.novoDebate();
    else { this.avisoChat("✅ O júri está pronto pra decidir."); this.irParaUltimaPalavra(); }
  }

  irParaUltimaPalavra() {
    // Em causa própria, a defesa já foi a última palavra: direto pro voto.
    if (this.causaPropria) { this.irParaVotacao(); return; }
    this.fase = "ultima";
    this.tempo = this.tempoTotal = SEG_ULTIMA;
    this.transmitir();
  }

  irParaLeituraFinal() {
    this.fase = "palavraFinal";
    this.tempo = this.tempoTotal = SEG_POR_TEXTO;
    this.transmitir();
  }

  irParaVotacao() {
    this.fase = "votar";
    this.tempo = this.tempoTotal = SEG_VOTAR;
    this.transmitir();
  }

  votar(userId, voto) {
    if (this.fase !== "votar") return "Agora não é hora de votar.";
    if (this.papelDe(userId) !== "jurado") return "Só os jurados votam.";
    if (voto !== "culpado" && voto !== "inocente") return "Voto inválido.";
    this.votos.set(userId, voto);
    this.conferirFimAntecipado();
    this.transmitir();
    return null;
  }

  // Curtidas: "promotor-1", "advogado-2", "testemunha-1" (texto do debate) ou "ultima".
  autorDaFrase(chave) {
    if (chave === "ultima") return this.ultima ? this.papeis.acusado : null;
    const m = /^(promotor|advogado|testemunha)-(\d+)$/.exec(String(chave || ""));
    if (!m) return null;
    const rodada = this.debate[Number(m[2]) - 1];
    return rodada?.[m[1]] ? this.papeis[m[1]] : null;
  }

  curtir(userId, chave) {
    if (this.fase !== "votar") return "Dá pra curtir só na votação.";
    if (this.papelDe(userId) !== "jurado") return "Só os jurados curtem.";
    if (!this.autorDaFrase(chave)) return "Não dá pra curtir isso.";
    if (!this.curtidas.has(userId)) this.curtidas.set(userId, new Set());
    const minhas = this.curtidas.get(userId);
    if (minhas.has(chave)) minhas.delete(chave);
    else {
      if (minhas.size >= MAX_CURTIDAS) return `Você já usou suas ${MAX_CURTIDAS} curtidas.`;
      minhas.add(chave);
    }
    this.transmitir();
    return null;
  }

  conferirFimAntecipado() {
    if (this.fase === "escrever") {
      const d = this.debateAtual;
      const promOk = d.promotor || this.ausente(this.papeis.promotor);
      const advOk = d.advogado || this.ausente(this.papeis.advogado);
      // a testemunha só é cobrada na 1ª rodada do debate (ela só depõe uma vez)
      const testOk = !this.papeis.testemunha || this.debate.length > 1 || d.testemunha || this.ausente(this.papeis.testemunha);
      if (promOk && advOk && testOk) this.irParaLeitura();
    } else if (this.fase === "ultima") {
      if (this.ultima || this.ausente(this.papeis.acusado)) this.irParaLeituraFinal();
    } else if (this.fase === "deliberar") {
      const jur = this.jurados();
      if (jur.length && jur.every((j) => this.deliberacao.has(j.id))) this.fecharDeliberacao();
    } else if (this.fase === "votar") {
      const jur = this.jurados();
      if (jur.length && jur.every((j) => this.votos.has(j.id))) this.irParaVeredito();
    } else if (this.fase === "escolhaPapeis") {
      const na = this.naPartidaOnline();
      if (na.length && na.every((j) => this.votosPapeis.has(j.id))) this.fecharEscolhaPapeis();
    }
  }

  irParaVeredito() {
    const mult = this.multiplicador;
    let culpado = 0, inocente = 0;
    for (const v of this.votos.values()) v === "culpado" ? culpado++ : inocente++;
    const empate = culpado === inocente;
    const veredito = culpado > inocente ? "culpado" : "inocente"; // empate: in dubio pro reo
    const total = culpado + inocente;
    const unanime = total >= 2 && (culpado === total || inocente === total);
    const ganhos = new Map();
    const somar = (uid, pts) => { if (!uid || !this.jogadores.has(uid)) return; ganhos.set(uid, (ganhos.get(uid) || 0) + pts * mult); };

    const papelVencedor = veredito === "culpado" ? "promotor" : "advogado";
    const papelPerdedor = veredito === "culpado" ? "advogado" : "promotor";
    const escreveuAlgo = (papel) => this.debate.some((d) => d[papel]);
    somar(this.papeis[papelVencedor], PONTOS.vitoria + (unanime ? PONTOS.unanimidade : 0));
    if (escreveuAlgo(papelPerdedor)) somar(this.papeis[papelPerdedor], PONTOS.derrota);
    if (veredito === "inocente") { somar(this.papeis.acusado, PONTOS.reuSalvo); const r = this.jogadores.get(this.papeis.acusado); if (r) r.stats.absolvido++; }
    const vj = this.jogadores.get(this.papeis[papelVencedor]); if (vj) vj.stats.vitorias++;
    if (!empate) for (const [uid, v] of this.votos) if (v === veredito) { somar(uid, PONTOS.juradoMaioria); const j = this.jogadores.get(uid); if (j) j.stats.juriCerto++; }
    if (this.papeis.testemunha && this.debate[0]?.testemunha) somar(this.papeis.testemunha, PONTOS.testemunha);
    const curtidasPorFrase = {};
    for (const set of this.curtidas.values()) for (const chave of set) {
      curtidasPorFrase[chave] = (curtidasPorFrase[chave] || 0) + 1;
      const autor = this.autorDaFrase(chave);
      somar(autor, PONTOS.curtida);
      const j = this.jogadores.get(autor); if (j) j.stats.curtidas++;
    }
    for (const j of this.jogadores.values()) j.ganhou = ganhos.get(j.id) || 0;
    for (const [uid, pts] of ganhos) this.jogadores.get(uid).pontos += pts;

    this.resultado = {
      veredito, empate, unanime, culpado, inocente,
      sentenca: veredito === "culpado" ? sortear(SENTENCAS) : null,
      curtidas: curtidasPorFrase,
      rodadasDeDebate: this.debate.length,
    };
    // Sem marcar gênero ("foi condenado") — o réu pode ser qualquer pessoa.
    const reuNick = this.jogadores.get(this.papeis.acusado)?.nickname;
    this.avisoChat(veredito === "culpado"
      ? `⚖️ Veredito: CULPADO (${culpado} a ${inocente}) — ${reuNick}.`
      : empate ? `🕊️ Veredito: INOCENTE por falta de provas (empate) — ${reuNick}.`
        : `🕊️ Veredito: INOCENTE (${inocente} a ${culpado}) — ${reuNick}.`);
    this.fase = "veredito";
    this.tempo = this.tempoTotal = SEG_VEREDITO;
    this.transmitir();
  }

  depoisDoVeredito() {
    if (this.rodada >= this.totalRodadas) { this.encerrar(); return; }
    if (this.modoPapeis === "fixo") { this.irParaEscolhaPapeis(); return; }
    this.proximaRodada();
  }

  // ---------------- modo FIXO: sortear de novo ou manter? ----------------
  irParaEscolhaPapeis() {
    this.fase = "escolhaPapeis";
    this.votosPapeis = new Map();
    this.tempo = this.tempoTotal = SEG_ESCOLHA_PAPEIS;
    this.transmitir();
  }

  // TODOS votam (não só o júri) — a escolha afeta todo mundo, não só quem
  // vai julgar o próximo caso. Empate ou sem votos: mantém (menos disruptivo).
  escolherPapeis(userId, escolha) {
    if (this.fase !== "escolhaPapeis") return "Agora não é hora de escolher.";
    if (!this.jogadores.get(userId)?.naPartida) return "Você não está na partida.";
    if (escolha !== "sortear" && escolha !== "manter") return "Escolha inválida.";
    this.votosPapeis.set(userId, escolha);
    this.conferirFimAntecipado();
    this.transmitir();
    return null;
  }

  fecharEscolhaPapeis() {
    let sortear_ = 0, manter = 0;
    for (const v of this.votosPapeis.values()) v === "sortear" ? sortear_++ : manter++;
    const presentes = this.naPartidaOnline().map((j) => j.id);
    if (presentes.length < MIN_JOGADORES) { this.encerrar("Faltou gente no tribunal: a sessão foi encerrada."); return; }
    const elencoAindaPresente = [this.papeis.acusado, this.papeis.promotor, this.papeis.advogado].every((id) => presentes.includes(id));
    let elenco;
    if (sortear_ > manter || !elencoAindaPresente) {
      elenco = this.montarElenco(presentes, null);
      this.avisoChat("🎲 Os papéis foram sorteados de novo!");
    } else {
      // mantém — mas se a testemunha caiu, só ela é reavaliada
      const semTrio = presentes.filter((id) => ![this.papeis.acusado, this.papeis.promotor, this.papeis.advogado].includes(id));
      const testemunha = this.papeis.testemunha && presentes.includes(this.papeis.testemunha)
        ? this.papeis.testemunha
        : (semTrio.length >= 2 ? this.escolherPapel("testemunha", semTrio) : null);
      elenco = { acusado: this.papeis.acusado, promotor: this.papeis.promotor, advogado: this.papeis.advogado, testemunha };
      this.avisoChat("🔁 Os papéis continuam os mesmos — só muda o crime.");
    }
    this.rodada++;
    this.limparRodada();
    this.iniciarCaso(elenco);
  }

  encerrar(aviso = null) {
    this.fase = "fim";
    this.pararRelogio();
    this.limparRodada();
    if (aviso) this.avisoChat(`⚖️ ${aviso}`);
    const topo = Math.max(0, ...[...this.jogadores.values()].filter((j) => j.naPartida).map((j) => j.pontos));
    const campeoes = [...this.jogadores.values()].filter((j) => j.naPartida && topo > 0 && j.pontos === topo).map((j) => j.nickname);
    if (campeoes.length) this.avisoChat(`🏆 ${campeoes.join(" e ")} ${campeoes.length > 1 ? "venceram" : "venceu"} a sessão!`);
    try { this.aoFimDePartida?.(this); } catch (err) { console.error("Tribunal: falha no fim de partida:", err); }
    this.transmitir();
  }

  // ---------------- relógio e bots ----------------
  iniciarRelogio() {
    this.pararRelogio();
    this.timer = setInterval(() => {
      try { this.tick(); } catch (err) { console.error(`Tribunal: erro na sala ${this.codigo}:`, err); }
    }, 1000);
  }
  pararRelogio() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  parar() { this.pararRelogio(); }

  tick() {
    if (!FASES_COM_RELOGIO.includes(this.fase)) return;
    this.agirBots();
    this.tempo -= 1;
    if (this.tempo > 0) { this.transmitir(); return; }
    if (this.fase === "escrever") this.irParaLeitura();
    else if (this.fase === "julgamento") this.irParaDeliberacao();
    else if (this.fase === "deliberar") this.fecharDeliberacao();
    else if (this.fase === "ultima") this.irParaLeituraFinal();
    else if (this.fase === "palavraFinal") this.irParaVotacao();
    else if (this.fase === "votar") this.irParaVeredito();
    else if (this.fase === "veredito") this.depoisDoVeredito();
    else if (this.fase === "escolhaPapeis") this.fecharEscolhaPapeis();
  }

  agirBots() {
    for (const b of this.online().filter((j) => j.bot && j.naPartida)) {
      const papel = this.papelDe(b.id);
      const chave = `${this.fase}-${this.rodada}-${this.debate.length}`;
      if (b.agenda?.chave !== chave) b.agenda = { chave, em: this.tempo - (2 + Math.floor(Math.random() * 6)) };
      if (this.tempo > b.agenda.em) continue;
      if (this.fase === "escrever" && (papel === "promotor" || papel === "advogado") && !this.debateAtual[papel]) this.escrever(b.id, sortear(ARGUMENTOS_BOT[papel]));
      if (this.fase === "escrever" && papel === "testemunha" && this.debate.length === 1 && !this.debateAtual.testemunha) this.escrever(b.id, sortear(ARGUMENTOS_BOT.testemunha));
      if (this.fase === "ultima" && papel === "acusado" && !this.ultima) this.escrever(b.id, sortear(ARGUMENTOS_BOT.acusado));
      if (this.fase === "deliberar" && papel === "jurado" && !this.deliberacao.has(b.id)) this.deliberar(b.id, Math.random() < 0.4 ? "mais" : "prontos");
      if (this.fase === "votar" && papel === "jurado" && !this.votos.has(b.id)) this.votar(b.id, Math.random() < 0.5 ? "culpado" : "inocente");
      if (this.fase === "escolhaPapeis" && !this.votosPapeis.has(b.id)) this.escolherPapeis(b.id, Math.random() < 0.3 ? "sortear" : "manter");
    }
  }

  // ---------------- chat e reações ----------------
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
    if (agora - (j.ultimaReacao || 0) < 350) return null;
    j.ultimaReacao = agora;
    this.reacoes = this.reacoes.filter((r) => agora - r.em < 4000);
    this.reacoes.push({ id: novoId(), nick: j.nickname, emoji, em: agora });
    this.transmitir();
    return null;
  }

  definirPatente(userId, patente) {
    if (!patente) return;
    this.patentes.set(userId, { name: patente.name, icon: patente.icon || null, brilha: !!patente.brilha });
    this.transmitir();
  }

  // ---------------- estado pra tela ----------------
  transmitir() {
    for (const j of this.jogadores.values()) if (!j.bot && j.sockets.size) this.enviar(j.id, this.estadoPara(j.id));
  }

  estadoPara(userId) {
    const nick = (uid) => this.jogadores.get(uid)?.nickname || null;
    const meuPapel = this.papelDe(userId);
    // Debate: rodadas anteriores sempre visíveis; a ATUAL só depois da escrita
    // (enquanto escreve, cada um vê só o próprio texto).
    const escrevendo = this.fase === "escrever";
    const debate = this.debate.map((d, i) => {
      const atual = i === this.debate.length - 1;
      const mostra = !atual || !escrevendo;
      const item = (papel) => {
        if (d[papel]) return mostra || papel === meuPapel ? { texto: d[papel], padrao: false } : null;
        return mostra ? { texto: PADRAO[papel], padrao: true } : null;
      };
      // testemunha só existe (e só é cobrada) na 1ª rodada do debate
      const temTestemunhaAqui = i === 0 && !!this.papeis.testemunha;
      return { rodada: i + 1, promotor: item("promotor"), advogado: item("advogado"), testemunha: temTestemunhaAqui ? item("testemunha") : null };
    });
    const mostraUltima = !this.causaPropria && ["palavraFinal", "votar", "veredito"].includes(this.fase);
    const ultima = mostraUltima
      ? (this.ultima ? { texto: this.ultima, padrao: false } : { texto: PADRAO.acusado, padrao: true })
      : (this.fase === "ultima" && meuPapel === "acusado" && this.ultima ? { texto: this.ultima, padrao: false } : null);
    const d = this.debateAtual || {};
    const minhasCurtidas = [...(this.curtidas.get(userId) || [])];
    return {
      codigo: this.codigo, publica: this.publica, permiteBots: this.permiteBots, nomeSala: this.nomeSala,
      donoId: this.donoId, souDono: userId === this.donoId,
      fase: this.fase, tempo: this.tempo, tempoTotal: this.tempoTotal,
      rodada: this.rodada, totalRodadas: this.totalRodadas, ultima: this.ehUltima && this.rodada > 0, multiplicador: this.multiplicador,
      minJogadores: MIN_JOGADORES, maxDebate: MAX_DEBATE, rodadaDebate: this.debate.length,
      modoPapeis: this.modoPapeis,
      causaPropria: this.causaPropria,
      acusacao: this.acusacao,
      pacote: this.pacoteAcusacao,
      papeis: { acusado: nick(this.papeis.acusado), promotor: nick(this.papeis.promotor), advogado: nick(this.papeis.advogado), testemunha: nick(this.papeis.testemunha) },
      meuPapel,
      jaEscreveram: [...(d.promotor ? ["promotor"] : []), ...(d.advogado ? ["advogado"] : []), ...(this.debate.length === 1 && d.testemunha ? ["testemunha"] : []), ...(this.ultima ? ["acusado"] : [])],
      debate,
      palavraDoReu: ultima,
      minhaDeliberacao: this.deliberacao.get(userId) || null,
      jaDeliberaram: this.deliberacao.size,
      jaVotaram: [...this.votos.keys()].map(nick),
      totalJurados: this.jurados().length,
      meuVoto: this.votos.get(userId) || null,
      minhasCurtidas,
      curtidasRestantes: Math.max(0, MAX_CURTIDAS - minhasCurtidas.length),
      maxCurtidas: MAX_CURTIDAS,
      escolhaPapeis: this.fase === "escolhaPapeis" ? {
        jaVotaram: [...this.votosPapeis.keys()].map(nick),
        total: this.naPartidaOnline().length,
        minhaEscolha: this.votosPapeis.get(userId) || null,
      } : null,
      resultado: this.fase === "veredito" ? this.resultado : null,
      jogadores: [...this.jogadores.values()]
        .sort((a, b) => b.pontos - a.pontos)
        .map((j) => ({
          id: j.id, nickname: j.nickname, pontos: j.pontos, ganhou: j.ganhou, bot: j.bot,
          online: j.bot || j.sockets.size > 0, naPartida: j.naPartida,
          papel: this.fase === "aguardando" || this.fase === "fim" ? null : this.papelDe(j.id),
          patente: j.bot ? null : this.patentes.get(j.id) || null,
        })),
      trofeus: this.fase === "fim" ? this.trofeus() : null,
      chat: this.chat.slice(-50),
      reacoes: this.reacoes.filter((r) => Date.now() - r.em < 4000).map(({ id, nick: n, emoji }) => ({ id, nick: n, emoji })),
    };
  }

  // Troféus do fim: melhor de lábia (mais vitórias), mais engraçado
  // (curtidas) e ficha limpa (mais absolvições como réu).
  trofeus() {
    const na = [...this.jogadores.values()].filter((j) => j.naPartida);
    // Troféu só quando alguém SE DESTACA: se todo mundo empatou, não é troféu.
    const melhor = (campo) => {
      const topo = Math.max(0, ...na.map((j) => j.stats[campo]));
      if (topo <= 0) return null;
      const nomes = na.filter((j) => j.stats[campo] === topo).map((j) => j.nickname);
      return nomes.length < na.length ? { nomes, valor: topo } : null;
    };
    return { labia: melhor("vitorias"), engracado: melhor("curtidas"), fichaLimpa: melhor("absolvido"), juri: melhor("juriCerto") };
  }
}
