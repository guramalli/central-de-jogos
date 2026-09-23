import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  criarSalaDeGrupo, conferirInicioDoGrupo, __salasImpostor,
  __configurarImpostorParaTestes, __resetImpostorParaTestes,
} from "../../src/impostor/socketImpostor.js";

// Sala criada pela FILA DE ESPERA: começa sozinha quando o grupo chega.
afterEach(() => __resetImpostorParaTestes());
const esperar = () => new Promise((r) => setTimeout(r, 10)); // sortearPalavra é async

function preparar() {
  __configurarImpostorParaTestes({
    sortearPalavra: async () => ({ tema: "Lugares", palavra: "Praia" }),
    gravarResultado: () => {},
  });
}

test("grupo da fila: a partida começa sozinha quando todos chegam", async () => {
  preparar();
  const membros = ["a", "b", "c", "d"].map((id) => ({ id, nickname: id.toUpperCase() }));
  const { pagina, mesa } = criarSalaDeGrupo({ membros, comBots: false });
  assert.equal(pagina, "impostor");
  const sala = __salasImpostor.get(mesa);
  for (const m of membros.slice(0, 3)) { sala.entrar(m, `s-${m.id}`); conferirInicioDoGrupo(sala); }
  assert.equal(sala.fase, "LOBBY"); // ainda falta um
  sala.entrar(membros[3], "s-d");
  conferirInicioDoGrupo(sala);
  await esperar();
  assert.equal(sala.fase, "CARTAS");
  assert.equal(sala.anfitriaoId, "a"); // o primeiro a chegar
});

test("grupo com bots: completa com bots até o mínimo e começa", async () => {
  preparar();
  const membros = [{ id: "a", nickname: "A" }, { id: "b", nickname: "B" }];
  const { mesa } = criarSalaDeGrupo({ membros, comBots: true });
  const sala = __salasImpostor.get(mesa);
  for (const m of membros) { sala.entrar(m, `s-${m.id}`); conferirInicioDoGrupo(sala); }
  await esperar();
  assert.equal(sala.fase, "CARTAS");
  assert.equal([...sala.jogadores.values()].filter((j) => j.bot).length, 2);
});

test("grupo sem bots em que alguém não veio: fica na sala de espera", async () => {
  preparar();
  const membros = ["a", "b", "c", "d"].map((id) => ({ id, nickname: id }));
  const { mesa } = criarSalaDeGrupo({ membros, comBots: false });
  const sala = __salasImpostor.get(mesa);
  for (const m of membros.slice(0, 3)) sala.entrar(m, `s-${m.id}`);
  // Simula o fim da espera de 20s com "d" ausente: dispara o início com quem veio.
  sala.grupo.esperados.delete("d");
  conferirInicioDoGrupo(sala);
  await esperar();
  assert.equal(sala.fase, "LOBBY"); // 3 pessoas, mínimo 4: espera (anfitrião pode chamar bots)
});
