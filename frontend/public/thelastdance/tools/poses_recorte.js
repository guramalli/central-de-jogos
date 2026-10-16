// Calcula, fora do navegador, a matriz final de cada peça para uma lista de poses (mesmas contas do jogo).
// Uso: node tools/poses_recorte.js <pasta_do_rig> <anim> <t1,t2,...|quadros:N> [arquivo_de_animacoes.js] [vista]
//   Sem arquivo: animações do protagonista (piloto). Com vista: usa ANIM[vista] (ex.: personagem_v2 frente/lado).
// Saída (stdout, JSON): [{ anim, t, pecas: { nome: [a,b,c,d,e,f] }, alfas: { nome: 0..1 } }]. Raiz (pés) em (0, 0).
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const R = require("../js/characters/recorte.js");
const [pasta, nomeAnim, quais, arqAnim, vista] = process.argv.slice(2);
const TODAS = require(arqAnim ? path.resolve(arqAnim) : "../js/characters/protagonista_anim.js");
const ANIM = vista ? TODAS[vista] : TODAS;
const rig = JSON.parse(fs.readFileSync(path.join(pasta, "rig.json"), "utf8"));
const anim = ANIM[nomeAnim];
if (!anim) throw new Error("animação desconhecida: " + nomeAnim + " (há: " + Object.keys(ANIM).join(", ") + ")");
const ts = quais.startsWith("quadros:")
  ? Array.from({ length: Number(quais.slice(8)) }, (_, i) => i / Number(quais.slice(8)))
  : quais.split(",").map(Number);

const raiz = rig.ossos[0].pivo;
const base = [1, 0, 0, 1, -raiz[0], -raiz[1]];
const saida = ts.map((t) => {
  const pose = anim.pose(t, rig);
  const mats = R.mundo(rig, pose);
  const a = R.alfas(rig, pose);
  const pecas = {}, alfas = {};
  for (const p of rig.pecas) {
    pecas[p.nome] = R.multiplicar(base, mats[p.osso]);
    alfas[p.nome] = a[p.osso];
  }
  return { anim: nomeAnim, t, duracao: anim.duracao, pecas, alfas };
});
process.stdout.write(JSON.stringify(saida));
