// v408 (dono: "Deixe o skalzinho escolher um nick, não uma lista"): filtro do nome do time digitado.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { confereNome, nomeAprovado } from "../../src/lenda/filtroNome.js";
import { TIME_PREFIXOS, TIME_LUGARES } from "../../src/lenda/times.js";
import { LISTA } from "../../src/impostor/filtroPalavroes.js";

const BONS = ["Skal FC", "Os Craques", "Vila Nova FC", "Leões da Vila 2026", "Flamenguinho", "Time do Gu", "Disputa FC", "Cupim FC", "Escudo Real",
  "Picanha FC", "Esporte Clube Campinho", "Real Pau-Brasil", "Estrela D'Alva", "Bola de Ouro", "Sub 17 da Rua", "Unidos do Morro",
  // v408.2 (exceções aprovadas pelo dono): palavras inocentes que contêm um trecho proibido
  "Pica-Pau", "Pica Pau FC", "Picapau", "Pica-Pau FC", "Pikachu", "Pikachu FC", "Enviados", "Pícaro", "Viadutos", "Os Aviadores", "Percussão",
  "Notários", "Internazionale", "Badminton FC", "Chupa-Cabra", "Inter Matarazzo",
  // ... e as que caíam por causa de "v vale u" / reservados que agora só valem como palavra inteira
  "Guiados FC", "Esquiadores", "Maquiadora", "Ecossistema", "Suboficial", "Groot FC", "Bônus FC", "Matadores", "Cacetinho"];
// clubes, bichos e comidas comuns (nenhum pode cair no filtro)
const COMUNS = ("Atlético,Coritiba,Vasco,Sport,Ponte Preta,Chapecoense,Cuiabá,Juventude,Bahia,Fortaleza,Ceará,Paraná,Santa Cruz,Botafogo,Fluminense," +
  "Flamengo,Palmeiras,Corinthians,São Paulo,Santos,Grêmio,Internacional,Cruzeiro,Bragantino,Goiás,Vitória,Náutico,Remo,Paysandu,Avaí,Figueirense," +
  "Criciúma,Guarani,Juventus,Barcelona,Real Madrid,Manchester United,Liverpool,Arsenal,Chelsea,Bayern,Borussia,Milan,Inter de Milão,Napoli,Roma," +
  "Lazio,Porto,Benfica,Sporting,Ajax,PSG,Boca Juniors,River Plate,Peñarol,Nacional,América Mineiro,Athletico,Mirassol,Novorizontino,Ituano," +
  "Operário,Tombense,Sampaio Corrêa,ABC,CSA,CRB,Londrina,Brusque,Águias,Tubarões,Cobras,Jacarés,Tucanos,Pumas,Leopardos,Picolé,Pipoca,Pastel," +
  "Coxinha,Pudim,Paçoca,Brigadeiro,Abacaxi,Cupuaçu,Açaí,Jabuticaba,Caju,Cajá,Pequi,Sorvete,Bolacha,Biscoito,Pirulito,Piranhas,Picasso,Pipa," +
  "Capivara,Tatu,Quati,Sucuri,Jiboia,Mico,Bugio,Urubu,Sabiá,Bem-te-vi,Arara,Maritaca,Periquito,Peixe-boi,Boto,Baleia,Golfinho,Polvo,Lula,Siri,Camarão").split(",");
const RUINS = ["Skalzinho pika FC", "p1k4", "P1K4 FC", "piiika", "p.i.k.a", "p i k a fc", "skalzinhopika", "Pica FC", "p1c4", "Caralho FC", "K4R4LHO",
  "Puta FC", "pvta", "Porra Time", "porrrra", "Fodase", "fd p", "Merda FC", "Bosta FC", "vsf time", "Time do C U", "cu", "Buceta", "Viadinho",
  "Admin FC", "Equipe Oficial", "zap 11999998888", "insta do gu", "<b>Time</b>", "a", "ab", "1234", "x".repeat(25), "Time 😀", "Otario FC", "arrombado",
  // v408.2: as exceções não abrem brecha (leetspeak, letra repetida, grudada, junto com o palavrão)
  "pika fc", "p1kachu", "pikachupika", "Pikachu pika", "Pi Pikachu Ka", "Pica-Pau pica", "piiica pau", "p1ca pau", "Viado FC", "Sistema FC",
  "Equipe FC", "Badmin FC", "Matar FC", "Enviados do cu", "pikapau"];

test("filtro: aceita nome normal e recusa palavrão (com leetspeak, letras repetidas, separadores e grudado)", () => {
  for (const n of BONS) assert.equal(confereNome(n).ok, true, n);
  for (const n of COMUNS) assert.equal(confereNome(n.length < 3 ? n + " FC" : n).ok, true, n);
  for (const n of RUINS) assert.equal(confereNome(n).ok, false, n);
  assert.equal(nomeAprovado("  Skal    FC "), "Skal FC", "espaços arrumados");
  assert.equal(nomeAprovado("Skalzinho pika FC"), null);
  assert.equal(confereNome("ab").motivo, "curto");
  assert.equal(confereNome("x".repeat(25)).motivo, "longo");
  assert.equal(confereNome("Admin FC").motivo, "reservado");
  assert.equal(confereNome("zap 11999998888").motivo, "contato");
});

test("filtro: toda a lista de palavrões do site é recusada", () => {
  for (const p of LISTA) assert.equal(confereNome(p + " fc").ok, false, p);
});

test("filtro: as sugestões das listas (🎲) que cabem em 24 letras passam", () => {
  let n = 0;
  for (const p of TIME_PREFIXOS) for (const l of TIME_LUGARES) {
    const nome = `${p} ${l}`; if (nome.length > 24) continue;
    assert.equal(confereNome(nome).ok, true, nome); n++;
  }
  assert.ok(n > 200);
});

// o jogo tem uma cópia do filtro (js/online_seguro.js, entre FILTRO-NOME-INICIO e FILTRO-NOME-FIM): os dois têm que concordar.
// Confere a cópia publicada no site (frontend/public) e, se existir, a pasta do jogo em LENDA_JOGO.
const copias = [new URL("../../../frontend/public/lenda-do-campinho/js/online_seguro.js", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")];
if (process.env.LENDA_JOGO) copias.push(process.env.LENDA_JOGO + "/js/online_seguro.js");
for (const arq of copias) {
  test("o filtro do jogo é igual ao do servidor: " + arq, (t) => {
    if (!existsSync(arq)) return t.skip("sem o arquivo");
    const src = readFileSync(arq, "utf8");
    const i = src.indexOf("/* FILTRO-NOME-INICIO */"), f = src.indexOf("/* FILTRO-NOME-FIM */");
    if (i < 0 || f < 0) return t.skip("jogo ainda sem o filtro (antes da v408)");
    // o jogo publicado no site pode estar uma versão do filtro atrás (servidor e jogo saem juntos na publicação)
    const versao = (txt) => Number((txt.match(/const NF_VERSAO = (\d+);/) || [])[1] || 1);
    const vSrv = versao(readFileSync(new URL("../../src/lenda/filtroNome.js", import.meta.url), "utf8")), vJogo = versao(src);
    if (!process.env.LENDA_JOGO || !arq.startsWith(process.env.LENDA_JOGO)) { if (vJogo < vSrv) return t.skip(`jogo publicado com o filtro v${vJogo} (servidor: v${vSrv}) — publicar o jogo junto`); }
    assert.equal(vJogo, vSrv, "a versão do filtro no jogo é a mesma do servidor");
    const listaJogo = src.match(/const NF_SITE = (\[[^\]]*\]);/);
    assert.ok(listaJogo, "o jogo tem a lista de palavrões do site");
    const confereJogo = new Function(src.slice(i, f) + "; return (t) => nfConfere(t, " + listaJogo[1] + ");")();
    for (const n of [...BONS, ...COMUNS, ...RUINS, ...LISTA.map((p) => p + " fc")]) assert.deepEqual(confereJogo(n), confereNome(n), n);
  });
}
