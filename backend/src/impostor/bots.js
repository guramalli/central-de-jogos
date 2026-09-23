import { validarDica } from "./regras.js";

// BOTS DE TESTE dentro da sala (o anfitrião chama no lobby).
//
// Cada bot tem um "cérebro" que recebe os mesmos pacotes que um jogador
// receberia (carta e estado) e responde chamando os mesmos métodos da sala
// que o socket chama — então passa pelas mesmas validações. O bot impostor
// recebe só o tema, como qualquer impostor.
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
    if (e.fase === "DICAS" && e.vezDe === this.id) this.umaVez(`dica-${e.rodada}`, () => this.darDica());
    if (e.fase === "VOTACAO" && e.meuVoto == null) this.umaVez("voto", () => this.votar(e));
    if (e.fase === "ULTIMA_CHANCE" && e.revelacao?.impostorId === this.id) this.umaVez("chute", () => this.chutar());
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

  darDica() {
    // Mesma validação do servidor: nada de dica que seria recusada.
    const palavra = this.carta?.papel === "tripulante" ? this.carta.palavra : null;
    const opcoes = DICAS.filter((d) => !this.minhasDicas.has(d) && !validarDica(d, palavra).erro);
    const dica = sortear(opcoes.length ? opcoes : DICAS, this.aleatorio);
    this.minhasDicas.add(dica);
    this.sala.darDica(this.id, dica);
  }

  votar(e) {
    const alvos = e.jogadores.filter((j) => j.naPartida && j.id !== this.id);
    if (alvos.length) this.sala.votar(this.id, sortear(alvos, this.aleatorio).id);
  }

  chutar() {
    const opcoes = this.palavrasDoTema(this.carta?.tema) || [];
    this.sala.chutar(this.id, opcoes.length ? sortear(opcoes, this.aleatorio) : "não sei");
  }

  parar() {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
  }
}
