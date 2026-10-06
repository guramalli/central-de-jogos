import { test } from "node:test";
import assert from "node:assert/strict";
import { validarSave, validarCasa, escolherCasas, LIMITES, validarRanking, xpPara, xpDoNivel, conferirProgresso, PROGRESSO } from "../../src/lenda/validar.js";

// Nada aqui toca o banco: só as regras do que o jogo pode mandar.

const casaBoa = () => ({
  casaId: "casa_vila_1", mapa: "vila", prestigio: 51,
  moveis: [{ x: 3, y: 3, id: "mv_sofa" }, { x: 6, y: 4, id: "mv_mesa" }],
  itens: [{ x: 6, y: 4, id: "chuteira_trovao", r: 0 }, { x: 3, y: 6, id: "coroa" }],
  vitrine: [{ id: "chuteira_trovao", r: 0 }, { id: "coroa" }],
});

test("save: aceita base64 dentro do limite", () => {
  const v = validarSave({ dados: "H4sIAAAAAAAAA6tWSs7PS8tMLVKyUkpKLEpVqgUAkXPmqhYAAAA=", nivel: 12 });
  assert.equal(v.ok, true);
});
test("save: recusa vazio, grande, fora do formato e nível errado", () => {
  assert.ok(validarSave({ dados: "", nivel: 1 }).erro);
  assert.ok(validarSave({ dados: "A".repeat(LIMITES.saveMaxChars + 4), nivel: 1 }).erro);
  assert.ok(validarSave({ dados: "<script>", nivel: 1 }).erro);
  assert.ok(validarSave({ dados: "QUJD", nivel: 0 }).erro);
  assert.ok(validarSave({ dados: "QUJD", nivel: 1.5 }).erro);
  assert.ok(validarSave(null).erro);
});

test("casa: aceita uma casa normal e limpa campos extras", () => {
  const b = casaBoa(); b.moveis[0].extra = "x"; b.hack = true;
  const v = validarCasa(b);
  assert.equal(v.ok, true);
  assert.deepEqual(v.casa.moveis[0], { x: 3, y: 3, id: "mv_sofa" });
  assert.equal(v.casa.itens[1].r, 0); // refino ausente vira 0
  assert.equal("hack" in v.casa, false);
});
test("casa: id e lugar precisam combinar", () => {
  assert.ok(validarCasa({ ...casaBoa(), casaId: "casa_cidade_1" }).erro);
  assert.ok(validarCasa({ ...casaBoa(), casaId: "../../etc" }).erro);
  assert.ok(validarCasa({ ...casaBoa(), mapa: "VILA" }).erro);
});
test("casa: recusa móveis/itens inválidos, repetidos ou demais", () => {
  const b = casaBoa();
  assert.ok(validarCasa({ ...b, moveis: [{ x: 1, y: 1, id: "sofa" }] }).erro);            // sem prefixo mv_
  assert.ok(validarCasa({ ...b, moveis: [{ x: 1, y: 1, id: "mv_sofa" }, { x: 1, y: 1, id: "mv_tv" }] }).erro);
  assert.ok(validarCasa({ ...b, itens: [{ x: 99, y: 1, id: "coroa" }] }).erro);          // fora da casa
  assert.ok(validarCasa({ ...b, itens: [{ x: 1, y: 1, id: "coroa", r: 11 }] }).erro);    // refino acima de +10
  assert.ok(validarCasa({ ...b, itens: [{ x: 1, y: 1, id: "<b>oi</b>" }] }).erro);
  assert.ok(validarCasa({ ...b, moveis: Array.from({ length: LIMITES.moveisMax + 1 }, (_, i) => ({ x: i % 40, y: Math.floor(i / 40), id: "mv_vaso" })) }).erro);
  assert.ok(validarCasa({ ...b, vitrine: [{ id: "a1" }, { id: "a2" }, { id: "a3" }, { id: "a4" }] }).erro);
  assert.ok(validarCasa({ ...b, prestigio: -1 }).erro);
  assert.ok(validarCasa({ ...b, prestigio: LIMITES.prestigioMax + 1 }).erro);
});

test("escolherCasas: tira a própria pessoa, põe as mais prestigiadas primeiro e respeita o limite", () => {
  const lista = [
    { userId: "a", prestigio: 5 }, { userId: "b", prestigio: 90 }, { userId: "eu", prestigio: 500 },
    { userId: "c", prestigio: 40 }, { userId: "d", prestigio: 1 }, { userId: "e", prestigio: 12 },
  ];
  const r = escolherCasas(lista, { excluir: "eu", limite: 4, topo: 2, sortear: () => 0 });
  assert.equal(r.length, 4);
  assert.deepEqual(r.slice(0, 2).map((c) => c.userId), ["b", "c"]);
  assert.equal(r.some((c) => c.userId === "eu"), false);
  assert.equal(new Set(r.map((c) => c.userId)).size, 4);
  assert.deepEqual(escolherCasas([], { limite: 3 }), []);
});

test("ranking: aceita o resumo do progresso; nome do time digitado só se passar no filtro (v408)", () => {
  const v = validarRanking({ nivel: 27, xp: 15400, posicao: "atacante", fase: "Sub-20", time: { nome: " <b>Campinho</b> FC ", div: 3, titulos: 1 }, chefes: 4, figs: 30 });
  assert.equal(v.ok, true);
  assert.equal(v.ranking.time.nome, null, "com < > não passa");
  assert.equal(validarRanking({ nivel: 27, xp: 15400, fase: "Sub-20", time: { nome: "  Skal   FC ", div: 3 } }).ranking.time.nome, "Skal FC");
  assert.equal(validarRanking({ nivel: 27, xp: 15400, fase: "Sub-20", time: { nome: "Skalzinho pika FC", div: 3 } }).ranking.time.nome, null);
  assert.ok(validarRanking({ nivel: 27, xp: 15400, fase: "Sub-20", time: { nome: "x".repeat(500), div: 3 } }).ok, "nome enorme não derruba o envio");
  assert.equal(v.ranking.nivel, 27);
  const l = validarRanking({ nivel: 27, xp: 15400, fase: "Sub-20", time: { nome: "p1k4", partes: "3.0", div: 3 } });
  assert.deepEqual(l.ranking.time, { partes: "3.0", nome: "Unidos do Campinho", div: 3, titulos: 0 });
  assert.equal(validarRanking({ nivel: 27, xp: 15400, fase: "Sub-20", time: { partes: "3.999", div: 3 } }).ranking.time.nome, null);
});

test("ranking: recusa números absurdos, fase inventada e posição estranha", () => {
  assert.ok(!validarRanking({ nivel: 0, xp: 10, fase: "Criança" }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: -1, fase: "Criança" }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: 1.5, fase: "Criança" }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: 10, fase: "Deus" }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: 10, fase: "Criança", posicao: "<script>" }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: 10, fase: "Criança", time: { nome: "", div: 99 } }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: 10, fase: "Criança", time: "Meu time" }).ok);
  assert.ok(validarRanking({ nivel: 5, xp: 10, fase: "Criança" }).ok);
});

test("ranking: aceita exatamente o que o jogo manda (posicao e time nulos, fase com acento)", () => {
  // corpo do enviaRankingOnline (js/game.js) de um jogador novo, sem time
  const v = validarRanking({ nivel: 3, xp: 120, posicao: null, fase: "Criança", time: null, chefes: 0, figs: 0 });
  assert.equal(v.ok, true);
  assert.equal(v.ranking.posicao, null);
  assert.equal(v.ranking.time, null);
  for (const fase of ["Criança", "Juvenil", "Sub-20", "Profissional", "Lenda"]) assert.ok(validarRanking({ nivel: 1, xp: 0, fase }).ok, fase);
});

test("ranking: aceita o XP dos níveis altos (passa de 2 bilhões por volta do nível 355)", () => {
  const v = validarRanking({ nivel: 481, xp: 7_189_595_200, posicao: "atacante", fase: "Lenda", chefes: 900, figs: 200 });
  assert.ok(v.ok);
  assert.equal(v.ranking.xp, 7_189_595_200);
  assert.ok(!validarRanking({ nivel: 481, xp: 1e16, fase: "Lenda" }).ok);
});

test("ranking: habilidades (v388) — opcionais, números de 0 a 1000", () => {
  const ok = validarRanking({ nivel: 600, xp: 10, fase: "Lenda", skills: { drible: 68, chute: 79, defesa: 69, visao: 66 } });
  assert.equal(ok.ok, true); assert.deepEqual(ok.skills, { drible: 68, chute: 79, defesa: 69, visao: 66 });
  assert.equal(validarRanking({ nivel: 5, xp: 10, fase: "Criança" }).skills, null, "jogo antigo sem habilidades continua valendo");
  assert.ok(!validarRanking({ nivel: 5, xp: 10, fase: "Criança", skills: { drible: 5000 } }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: 10, fase: "Criança", skills: { visao: 2.5 } }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: 10, fase: "Criança", skills: "muito" }).ok);
});

// ---------- v407 (Raio-X U7): o ranking confere o progresso ----------
import { readFileSync, existsSync } from "node:fs";
test("a curva de XP do servidor é a MESMA do jogo publicado (js/game.js, xpPara)", (t) => {
  const arq = new URL("../../../frontend/public/lenda-do-campinho/js/game.js", import.meta.url);
  if (!existsSync(arq)) return t.skip("jogo não está nesta cópia");
  const m = readFileSync(arq, "utf8").match(/function xpPara\(L\) \{[^\n]*\}/);
  assert.ok(m, "achei a xpPara do jogo");
  const xpJogo = new Function(m[0] + "; return xpPara;")();
  for (let L = 1; L <= 1000; L++) assert.equal(xpPara(L), xpJogo(L), "nível " + L);
});

test("ranking confere: XP precisa bater com o nível", () => {
  assert.ok(conferirProgresso({ nivel: 10, xp: xpPara(10) + 5 }, null, new Date()).ok);
  assert.equal(conferirProgresso({ nivel: 10, xp: xpPara(12) }, null, new Date()).motivo, "xp_fora_da_curva");
  assert.equal(conferirProgresso({ nivel: 10, xp: xpPara(9) }, null, new Date()).motivo, "xp_fora_da_curva");
  assert.ok(conferirProgresso({ nivel: 481, xp: 7_189_595_200 }, { nivel: 481, xp: 7_189_000_000, atualizadoEm: new Date(Date.now() - 60e3) }, new Date(0)).ok, "save real do nível 481");
});

test("ranking confere: ganho de XP por hora contra o envio anterior, e nível que pula", () => {
  const agora = Date.UTC(2026, 9, 6, 15);
  const antes = { nivel: 100, xp: xpPara(100) + 10, atualizadoEm: new Date(agora - 60e3) };
  // 1 minuto depois: subir 1 nível é normal
  assert.ok(conferirProgresso({ nivel: 101, xp: xpPara(101) + 1 }, antes, null, agora).ok);
  // 1 minuto depois: subir 15 níveis não dá
  assert.equal(conferirProgresso({ nivel: 115, xp: xpPara(115) }, antes, null, agora).motivo, "xp_rapido_demais");
  // 3 dias sem mandar: subir 40 níveis é possível (jogou sem internet, ou com o ranking parado)
  assert.ok(conferirProgresso({ nivel: 140, xp: xpPara(140) }, { ...antes, atualizadoEm: new Date(agora - 3 * 864e5) }, null, agora).ok);
  // muito tempo depois, mas pulando de vez mais do que o teto por envio
  assert.equal(conferirProgresso({ nivel: 100 + PROGRESSO.niveisPorEnvio + 1, xp: xpPara(100 + PROGRESSO.niveisPorEnvio + 1) }, { ...antes, atualizadoEm: new Date(agora - 400 * 864e5) }, null, agora).motivo, "nivel_pulou");
  // começou outro personagem (nível menor): tudo bem
  assert.ok(conferirProgresso({ nivel: 3, xp: xpPara(3) }, antes, null, agora).ok);
});

test("ranking confere: primeiro envio compara com a idade da conta (até o nível livre passa direto)", () => {
  const agora = Date.UTC(2026, 9, 6, 15);
  assert.ok(conferirProgresso({ nivel: PROGRESSO.nivelLivre, xp: xpPara(PROGRESSO.nivelLivre) }, null, new Date(agora - 60e3), agora).ok);
  assert.equal(conferirProgresso({ nivel: 300, xp: xpPara(300) }, null, new Date(agora - 3600e3), agora).motivo, "xp_rapido_demais");
  assert.ok(conferirProgresso({ nivel: 300, xp: xpPara(300) }, null, new Date(agora - 30 * 864e5), agora).ok, "jogou sem conta e entrou depois");
  assert.ok(xpDoNivel(1) >= 1);
});

test("v409: no nível alto a folga aguenta Torre/Ecos/missões (Skal 853, dono 633); absurdo é separado", () => {
  const agora = Date.UTC(2026, 9, 7, 20);
  for (const nv of [633, 853]) {
    const antes = { nivel: nv, xp: xpPara(nv) + 10, atualizadoEm: new Date(agora - 60e3) };
    // 1 minuto depois: 2 níveis de uma vez (andares novos da Torre, prêmio de missão) passa
    assert.ok(conferirProgresso({ nivel: nv + 2, xp: xpPara(nv + 2) + 5 }, antes, null, agora).ok, "nível " + nv);
    // 1 hora depois: 15 níveis passa
    assert.ok(conferirProgresso({ nivel: nv + 15, xp: xpPara(nv + 15) }, { ...antes, atualizadoEm: new Date(agora - 3600e3) }, null, agora).ok);
    // 1 minuto depois: 30 níveis = rápido demais (só vai para a lista do painel); 140 níveis = absurdo (esconde)
    assert.equal(conferirProgresso({ nivel: nv + 30, xp: xpPara(nv + 30) }, antes, null, agora).motivo, "xp_rapido_demais");
    assert.equal(conferirProgresso({ nivel: nv + 140, xp: xpPara(nv + 140) }, antes, null, agora).motivo, "xp_absurdo");
  }
});
