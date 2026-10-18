// Regras do minigame de surf (js/surf.js): pontos das manobras, combo, repetição, resultado final e nome do ranking.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const R = require("../js/surf.js");

test("surf: cada manobra tem seus pontos; o aéreo ganha por volta e o tubo por segundo", () => {
  const P = R.PONTOS;
  assert.ok(P.cutback > P.cavada && P.aereo > P.cutback);
  assert.ok(P.tuboSeg > 0 && P.floaterSeg > 0 && P.giro > 0);
  for (const v of Object.values(P)) assert.ok(Number.isInteger(v) && v > 0);
});

test("surf: combo multiplica pela variedade (manobras diferentes), até x5", () => {
  assert.strictEqual(R.multiplicador([]), 1);
  assert.strictEqual(R.multiplicador(["cutback"]), 1);
  assert.strictEqual(R.multiplicador(["cutback", "cutback", "cutback"]), 1);
  assert.strictEqual(R.multiplicador(["cavada", "cutback", "floater"]), 3);
  assert.strictEqual(R.multiplicador(["drop", "cavada", "cutback", "floater", "aereo", "giro", "tubo"]), 5);
  assert.strictEqual(R.valorCombo([{ nome: "cavada", pts: 150 }, { nome: "cutback", pts: 500 }]), 1300);
  assert.strictEqual(R.valorCombo([{ nome: "cutback", pts: 500 }]), 500);
});

test("surf: repetir a mesma manobra vale menos; variar volta ao normal", () => {
  assert.strictEqual(R.repeticao([], "cutback"), 1);
  assert.strictEqual(R.repeticao(["cutback"], "cutback"), 0.6);
  assert.strictEqual(R.repeticao(["cutback", "cutback"], "cutback"), 0.35);
  assert.strictEqual(R.repeticao(["cutback", "cutback", "cutback", "cutback"], "cutback"), 0.2);
  assert.strictEqual(R.repeticao(["cutback", "cavada"], "cutback"), 1);
});

test("surf: pontuação final = soma das 3 ondas; nome do ranking com até 10 letras", () => {
  assert.strictEqual(R.resultado([12000, 8000, 15500]), 35500);
  assert.strictEqual(R.resultado([]), 0);
  assert.match(R.titulo(50000), /Campeão/);
  assert.match(R.titulo(500), /churrasco/);
  assert.strictEqual(R.limparNome("  Gustavo   Brabo  "), "Gustavo Br");
  assert.strictEqual(R.limparNome("Zé"), "Zé");
  assert.strictEqual(R.limparNome(null), "");
  assert.strictEqual(R.NOME_MAX, 10);
});

test("surf: física — descer acelera, subir freia, bombear soma e travar deixa a onda pegar", () => {
  const dt = 1 / 60, rodar = (seg, c, st, inc = 1) => { let o; for (let i = 0; i < seg * 60; i++) o = R.fisica(st, c, dt, inc); return o; };
  const desce = { v: 250, rumo: 0, dir: 1 }; rodar(1, { anda: true, baixo: true }, desce);
  const sobe = { v: 250, rumo: 0, dir: 1 }; rodar(1, { anda: true, cima: true }, sobe);
  assert.ok(desce.v > 320 && sobe.v < 180, `${desce.v} ${sobe.v}`);
  // trimando no pocket anda para a frente; no ombro escorrega de volta
  assert.ok(rodar(4, { anda: true }, { v: 250, rumo: 0, dir: 1 }, 1).u > 120);
  assert.ok(rodar(4, { anda: true }, { v: 250, rumo: 0, dir: 1 }, 0.3).u < 0);
  // travado (sem D/A): perde velocidade e a onda vem pegando
  const travado = { v: 300, rumo: 0, dir: 1 }, o = rodar(2, {}, travado);
  assert.ok(travado.v < 120 && o.u < -60);
  // ir e voltar parecidos
  const ir = rodar(3, { anda: true }, { v: 250, rumo: 0, dir: 1 }).u, voltar = rodar(3, { anda: true }, { v: 250, rumo: 0, dir: -1 }).u;
  assert.ok(Math.abs(Math.abs(ir) - Math.abs(voltar)) < 60, `${ir} ${voltar}`);
  // bombada: soma, e soma menos quando já está rápido
  assert.ok(R.bombear(200) - 200 > R.bombear(450) - 450);
  assert.ok(R.bombear(R.FISICA.vMax) <= R.FISICA.vMax);
});

test("surf: a página existe, está atrás da senha e o carro leva até ela", () => {
  const raiz = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(raiz, "surf.html"), "utf8");
  for (const s of ["js/base.js", "js/vip.js", "js/audio.js", "personagem_modular/dados.js", "personagem_modular/personagem-modular.js", "js/surf.js"]) {
    assert.ok(html.includes(`src="${s}"`), s);
  }
  assert.match(fs.readFileSync(path.join(raiz, "js/vip.js"), "utf8"), /"surf\.html":/);
  // a Praia só aparece no carro depois de aceitar o convite do Carioca (logo após a ligação da Gatinha de Campinas)
  const garagem = fs.readFileSync(path.join(raiz, "js/maps/garagem_planta.js"), "utf8");
  assert.match(garagem, /url: "surf\.html", ativo: true, so: "nsf_surf"/);
  const apto = fs.readFileSync(path.join(raiz, "js/maps/apartamento_planta.js"), "utf8");
  assert.match(apto, /PLANTA\.aoTerminarLigacao/);
  assert.match(apto, /Carioca no ZapZap/);
  assert.match(apto, /sessionStorage\.setItem\("nsf_surf", "1"\)/);
  assert.match(fs.readFileSync(path.join(raiz, "personagem_modular/dados.js"), "utf8"), /neoprene_calca/);
});
