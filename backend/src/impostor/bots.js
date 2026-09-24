import { validarTextoDaVez } from "./regras.js";
import {
  situacaoPorTexto, parDaPergunta, DICAS_GENERICAS_SITUACAO, FRASES_GENERICAS, RESPOSTAS_POR_TIPO,
} from "./conteudoModos.js";

// BOTS DE TESTE dentro da sala (o anfitrião chama no lobby).
//
// Cada bot tem um "cérebro" que recebe os mesmos pacotes que um jogador
// receberia (carta e estado) e responde chamando os mesmos métodos da sala
// que o socket chama — então passa pelas mesmas validações. O bot impostor
// recebe só o que qualquer impostor recebe (o tema, nada, ou a pergunta dele).
// Nos modos novos, dicas/frases/respostas vêm de listas de conteudoModos.js.
//
// Sala com bot não vale ranking (ver socketImpostor.js): os bots votam e dão
// dicas de forma boba, e seria ponto fácil.

const DICAS = [
  "grande", "pequeno", "barulho", "cor", "rápido", "antigo", "cheiro", "família",
  "verão", "noite", "dinheiro", "festa", "doce", "gelado", "quente", "cidade",
  "viagem", "trabalho", "brilho", "macio", "forte", "comum", "raro", "redondo",
  "leve", "pesado", "caro", "barato", "alto", "moderno", "útil", "divertido",
];

const sortear = (lista, aleatorio) => lista[Math.floor(aleatorio() * lista.length)];

export class CerebroBot {
  // sala: ImpostorRoom; id: id do bot; palavrasDoTema: (tema) => [palavras]
  constructor(sala, id, { palavrasDoTema = () => [], atraso = [1500, 5000], aleatorio = Math.random } = {}) {
    this.sala = sala;
    this.id = id;
    this.palavrasDoTema = palavrasDoTema;
    this.atraso = atraso;
    this.aleatorio = aleatorio;
    this.carta = null;
    this.feito = new Set(); // ações já agendadas nesta partida (o estado chega várias vezes)
    this.timers = new Set();
    this.minhasDicas = new Set();
  }

  receber(evento, dados) {
    if (evento === "impostor-carta") { this.carta = dados; return; }
    if (evento === "impostor-estado") this.agir(dados);
  }

  agir(e) {
    if (e.fase === "LOBBY") { this.feito.clear(); this.minhasDicas.clear(); this.carta = null; return; }
    if (!e.participo) return;
    if (e.fase === "CARTAS" && !e.cartaVista) this.umaVez("carta", () => this.sala.cartaVista(this.id));
    if (e.fase === "DICAS" && e.vezDe === this.id) this.umaVez(`dica-${e.rodada}`, () => this.darDica(e.modo));
    if (e.fase === "RESPOSTAS" && e.minhaResposta == null) this.umaVez("resposta", () => this.responder());
    if (e.fase === "VOTACAO" && e.meuVoto == null) this.umaVez("voto", () => this.votar(e));
    if (e.fase === "ULTIMA_CHANCE" && e.revelacao?.impostorId === this.id) this.umaVez("chute", () => this.chutar(e));
  }

  umaVez(chave, acao) {
    if (this.feito.has(chave)) return;
    this.feito.add(chave);
    const [min, max] = this.atraso;
    const t = setTimeout(() => {
      this.timers.delete(t);
      this.sala.protegido(acao); // se a fase já mudou, a sala recusa e nada acontece
    }, min + this.aleatorio() * (max - min));
    this.timers.add(t);
  }

  // Palavra: 1 palavra da lista. Situação: as dicas da situação (tripulante)
  // ou genéricas (impostor). História: frases genéricas.
  darDica(modo = "palavra") {
    const tripulante = this.carta?.papel === "tripulante";
    let lista = DICAS;
    let segredo = null;
    if (modo === "situacao") {
      segredo = tripulante ? this.carta.situacao : null;
      lista = [...(situacaoPorTexto(segredo)?.dicas || []), ...DICAS_GENERICAS_SITUACAO];
    } else if (modo === "historia") {
      segredo = tripulante ? this.carta.historia : null;
      lista = FRASES_GENERICAS;
    } else {
      segredo = tripulante ? this.carta.palavra : null;
    }
    // Mesma validação do servidor: nada de texto que seria recusado.
    const opcoes = lista.filter((d) => !this.minhasDicas.has(d) && !validarTextoDaVez(modo, d, segredo).erro);
    const dica = sortear(opcoes.length ? opcoes : lista, this.aleatorio);
    this.minhasDicas.add(dica);
    this.sala.darDica(this.id, dica);
  }

  // Pergunta: responde do banco do TIPO do par (número dentro da faixa, ou
  // uma resposta da lista). O bot impostor faz igual com a pergunta dele —
  // o par tem o mesmo tipo, então a resposta dele "combina".
  responder() {
    const par = parDaPergunta(this.carta?.pergunta);
    let resposta = "não sei";
    if (par?.tipo === "numero") {
      const [min, max] = par.faixa;
      resposta = String(min + Math.floor(this.aleatorio() * (max - min + 1)));
    } else if (par && RESPOSTAS_POR_TIPO[par.tipo]) {
      resposta = sortear(RESPOSTAS_POR_TIPO[par.tipo], this.aleatorio);
    }
    this.sala.responder(this.id, resposta);
  }

  votar(e) {
    const alvos = e.jogadores.filter((j) => j.naPartida && j.id !== this.id);
    if (alvos.length) this.sala.votar(this.id, sortear(alvos, this.aleatorio).id);
  }

  // Múltipla escolha (Situação/História): uma opção qualquer. Palavra: uma
  // palavra do tema.
  chutar(e) {
    if (e?.opcoes?.length) return this.sala.chutar(this.id, Math.floor(this.aleatorio() * e.opcoes.length));
    const opcoes = this.palavrasDoTema(this.carta?.tema) || [];
    this.sala.chutar(this.id, opcoes.length ? sortear(opcoes, this.aleatorio) : "não sei");
  }

  parar() {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
  }
}
