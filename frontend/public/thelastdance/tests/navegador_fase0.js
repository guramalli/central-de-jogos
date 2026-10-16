// Teste da cena vazia num Chromium real (Playwright). Rodar: node tests/navegador_fase0.js
// Headless por padrão; HEADED=1 abre janela. Um navegador por vez (TEST_WORKERS, padrão 1, máx. 2).
// Sempre abre o jogo com ?test=1 (30 fps, sem efeitos, sem som). Fecha tudo, inclusive em falha.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const RAIZ = path.resolve(__dirname, "..");
const SAIDA = path.join(RAIZ, "docs/acceptance/fase_0");
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp" };

function carregaPlaywright() {
  try {
    return require("playwright");
  } catch {
    return require(path.join(execSync("npm root -g").toString().trim(), "playwright"));
  }
}

function servidor() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
      const arq = path.join(RAIZ, rel);
      if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "Content-Type": TIPOS[path.extname(arq)] || "application/octet-stream" });
      fs.createReadStream(arq).pipe(res);
    });
    s.listen(0, "127.0.0.1", () => ok(s));
  });
}

async function main() {
  const { chromium } = carregaPlaywright();
  const workers = Math.min(2, Math.max(1, Number(process.env.TEST_WORKERS) || 1));
  const s = await servidor();
  const url = `http://127.0.0.1:${s.address().port}/index.html?test=1`;
  let navegador;
  const erros = [];
  const resultados = [];
  const check = (nome, ok, det = "") => {
    resultados.push(ok);
    console.log(`${ok ? "PASSOU" : "FALHOU"}  ${nome}${det ? `  (${det})` : ""}`);
  };
  try {
    console.log(`navegador: ${process.env.HEADED === "1" ? "com janela" : "headless"}, workers=${workers}`);
    navegador = await chromium.launch({ headless: process.env.HEADED !== "1" });
    const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
    pagina.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") erros.push(m.text());
    });
    pagina.on("pageerror", (e) => erros.push(String(e)));
    pagina.on("requestfailed", (r) => erros.push("falhou " + r.url()));
    pagina.on("response", (r) => {
      if (r.status() >= 400) erros.push(`${r.status()} ${r.url()}`);
    });

    await pagina.goto(url);
    await pagina.waitForFunction(() => window.NSF && NSF.estado.quadros >= 5, null, { timeout: 10000 });
    const est = await pagina.evaluate(() => NSF.estado);
    check("página carrega e desenha", est.pronto === true, `${est.quadros} quadros`);
    check("modo de teste ligado por ?test=1", est.modoTeste && !est.efeitos && !est.som);

    // FPS no modo de teste: conta quadros em 2 s; deve ficar perto de 30 e nunca passar muito disso.
    const q0 = await pagina.evaluate(() => NSF.estado.quadros);
    await pagina.waitForTimeout(2000);
    const fps = ((await pagina.evaluate(() => NSF.estado.quadros)) - q0) / 2;
    check("fps limitado a ~30 no modo de teste", fps > 5 && fps <= 32, `${fps.toFixed(1)} fps`);

    // A tela não pode estar vazia: a faixa do texto precisa ter pixels claros.
    const claros = await pagina.evaluate(() => {
      const c = document.getElementById("tela");
      const d = c.getContext("2d").getImageData(0, Math.floor(c.height / 2) - 40, c.width, 80).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 150) n++;
      return n;
    });
    check("canvas tem conteúdo desenhado", claros > 200, `${claros} pixels claros`);

    fs.mkdirSync(SAIDA, { recursive: true });
    await pagina.screenshot({ path: path.join(SAIDA, "evid_cena_teste_vazia.png") });
    check("sem erros/avisos no console nem requisições falhas", erros.length === 0, erros.join(" | "));

    // Sem ?test=1 o jogo segue normal: modo de teste desligado e sem limite de 30 fps (abre só por 1 s).
    await pagina.goto(url.replace("?test=1", ""));
    await pagina.waitForFunction(() => window.NSF && NSF.estado.quadros >= 5, null, { timeout: 10000 });
    const normal = await pagina.evaluate(() => NSF.estado);
    const n0 = normal.quadros;
    await pagina.waitForTimeout(1000);
    const fpsNormal = (await pagina.evaluate(() => NSF.estado.quadros)) - n0;
    check("sem ?test=1: modo normal (efeitos e som ligados)", !normal.modoTeste && normal.efeitos && normal.som);
    check("sem ?test=1: fps não fica preso em 30", fpsNormal > 32, `${fpsNormal} fps`);
    await pagina.close();
  } catch (e) {
    check("execução do teste", false, [String(e), ...erros].join(" | "));
  } finally {
    if (navegador) await navegador.close();
    s.close();
  }
  const falhas = resultados.filter((r) => !r).length;
  console.log(`RESULTADO navegador: ${falhas ? "FALHOU" : "PASSOU"} (${falhas} falha(s))`);
  process.exitCode = falhas ? 1 : 0;
}

main();
