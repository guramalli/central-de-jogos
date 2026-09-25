import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { abrirSave, fichaPublica } from "../../src/lenda/ficha.js";

const saveExemplo = {
  v: 2, nome: "Gu<b>Freestyle</b>", corpo: "m", nivel: 31, xp: 123456, ouro: 99999,
  posicao: "atacante", classe: "driblador",
  atr: { defesa: 10, habilidade: 30, inteligencia: 8, folego: 12 },
  sk: { drible: { lv: 40, t: 3 }, chute: { lv: 22 }, defesa: { lv: 18 }, visao: { lv: 5 } },
  equip: { cabeca: "bone", camisa: "camisa_vila", calcao: null, perna: null, chuteira: "chuteira_couro", acessorio: "../hack" },
  equipR: { camisa: 4 },
  mochila: [{ id: "agua", q: 3 }], quests: { q1: { s: "ativa" } }, flags: { segredo: true },
  kills: { moleque: 50, pombo: 10, skatista: 99 },
  figs: { f_pombo: 1, f_moleque: 1 },
  st: { abates: 159, chefes: 2, gols: 7, mortes: 3, tempo: 3600 },
  arenas: { arena_terrao: { vitorias: 2, itens: ["mt_1"] } },
  montarias: ["skate"], skins: [],
  exaustoes: [{ nivel: 30, por: "Salva-vidas", mapa: "praia", em: 1700000000000 }],
  casa: { id: "casa_vila_1", moveis: [] },
  mapa: "praia", x: 12.5, y: 3.5, criado: 1690000000000, dia: 40,
  carreira: { fama: 1200, clube: { nome: "Vila FC", cidadeNome: "Vila", tier: 1, salario: 999 } },
  time: { nome: "Os Craques", div: 3, titulos: 1 },
};

test("abrirSave abre o gzip+base64 do jogo", () => {
  const dados = gzipSync(Buffer.from(JSON.stringify(saveExemplo))).toString("base64");
  assert.equal(abrirSave(dados).nome, saveExemplo.nome);
  assert.equal(abrirSave("lixo!!"), null);
  assert.equal(abrirSave(""), null);
});

test("fichaPublica mostra só o que é público", () => {
  const f = fichaPublica(saveExemplo);
  assert.equal(f.nome, "GubFreestyle/b"); // sem < >
  assert.equal(f.nivel, 31);
  assert.equal(f.skills.drible, 40);
  assert.deepEqual(f.equip.camisa, { id: "camisa_vila", r: 4 });
  assert.equal(f.equip.acessorio, undefined); // id inválido fica de fora
  assert.equal(f.kills[0].id, "skatista");
  assert.equal(f.estatisticas.figurinhas, 2);
  assert.equal(f.arenas[0].vitorias, 2);
  assert.equal(f.exaustoes[0].por, "Salva-vidas");
  assert.equal(f.casa, "casa_vila_1");
  assert.equal(f.clube.nome, "Vila FC");
  // nada de privado
  const json = JSON.stringify(f);
  for (const campo of ["ouro", "mochila", "quests", "flags", "salario", "segredo", "x", "y", "hotbar"]) assert.ok(!json.includes(`"${campo}":`), campo);
});

test("fichaPublica aguenta save quebrado", () => {
  assert.equal(fichaPublica(null), null);
  const f = fichaPublica({ nivel: "abc", sk: null, st: null });
  assert.equal(f.nivel, 1);
  assert.equal(f.skills.drible, 0);
  assert.deepEqual(f.kills, []);
});
