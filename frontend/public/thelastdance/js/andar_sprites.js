// Teste dos sprites de caminhada (4 direções) do personagem v2: anda pelo piso com o teclado ou sozinho
// (demonstração automática percorrendo um quadrado). Ciclo: passo A, parado, passo B, parado.
(function () {
  "use strict";
  const { CONFIG, estado } = NSF;
  const PASTA = "assets/characters/personagem_v2/sprites/";
  const params = new URLSearchParams(location.search);
  const VELOCIDADE = 230; // px por segundo (resolução lógica 1920×1080)

  let info = null;
  const img = {};
  const jogador = { x: 960, y: 760, dir: "baixo", andando: false, tempo: 0 };
  const teclas = new Set();
  let demo = !params.has("dir");
  let ultimo = null, ociosoDesde = 0;

  const botaoDemo = document.getElementById("demo");
  function marcarDemo() { botaoDemo.setAttribute("aria-pressed", String(demo)); }
  botaoDemo.addEventListener("click", () => { demo = !demo; marcarDemo(); });
  const MAPA = { ArrowUp: "c", KeyW: "c", ArrowDown: "b", KeyS: "b", ArrowLeft: "e", KeyA: "e", ArrowRight: "d", KeyD: "d" };
  addEventListener("keydown", (e) => {
    if (!MAPA[e.code]) return;
    e.preventDefault();
    teclas.add(MAPA[e.code]);
    if (demo) { demo = false; marcarDemo(); }
  });
  addEventListener("keyup", (e) => { if (MAPA[e.code]) teclas.delete(MAPA[e.code]); });
  addEventListener("blur", () => teclas.clear());

  // Demonstração: quadrado no sentido horário a partir do centro (baixo, esquerda, cima, direita).
  const ROTA = [[960, 900], [560, 900], [560, 620], [1360, 620], [1360, 900], [960, 900], [960, 760]];
  let alvo = 0;

  function direcaoDe(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy) * 1.05) return dx > 0 ? "direita" : "esquerda";
    return dy > 0 ? "baixo" : "cima";
  }

  function atualizar(dt) {
    let dx = 0, dy = 0;
    if (demo) {
      const [ax, ay] = ROTA[alvo];
      const vx = ax - jogador.x, vy = ay - jogador.y, d = Math.hypot(vx, vy);
      if (d < 4) { alvo = (alvo + 1) % ROTA.length; } else { dx = vx / d; dy = vy / d; }
    } else {
      dx = (teclas.has("d") ? 1 : 0) - (teclas.has("e") ? 1 : 0);
      dy = (teclas.has("b") ? 1 : 0) - (teclas.has("c") ? 1 : 0);
      const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n; // diagonal sem bônus de velocidade
    }
    jogador.andando = dx !== 0 || dy !== 0;
    if (jogador.andando) {
      jogador.dir = direcaoDe(dx, dy);
      jogador.x = Math.min(1820, Math.max(100, jogador.x + dx * VELOCIDADE * dt));
      jogador.y = Math.min(1040, Math.max(420, jogador.y + dy * VELOCIDADE * dt));
      jogador.tempo += dt * 1000;
    } else {
      jogador.tempo = 0;
    }
  }

  function quadroAtual() {
    if (params.has("dir")) {
      const d = params.get("dir");
      return d + "_" + (params.get("quadro") || "2");
    }
    if (!jogador.andando) return info.parado[jogador.dir];
    const ciclo = info.ciclos[jogador.dir], dur = info.duracoes_ms;
    const total = dur.reduce((a, b) => a + b, 0);
    let t = jogador.tempo % total, i = 0;
    while (t >= dur[i]) { t -= dur[i]; i++; }
    return ciclo[i];
  }

  function fundo(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, CONFIG.alturaBase);
    g.addColorStop(0, "#160b26"); g.addColorStop(0.45, "#2a0f3d"); g.addColorStop(1, "#3a1046");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CONFIG.larguraBase, CONFIG.alturaBase);
    ctx.strokeStyle = "rgba(255,70,200,0.22)";
    ctx.lineWidth = 2;
    for (let i = -24; i <= 24; i++) { // piso em losangos (2:1), só para dar referência de chão
      ctx.beginPath(); ctx.moveTo(960 + i * 140, 400); ctx.lineTo(960 + i * 140 - 1360, 1080); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(960 + i * 140, 400); ctx.lineTo(960 + i * 140 + 1360, 1080); ctx.stroke();
    }
  }

  function desenharJogador(ctx, nome, x, y, escala) {
    const q = img[nome];
    const [px, py] = info.pes;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath(); ctx.ellipse(x, y, 62 * escala, 17 * escala, 0, 0, 2 * Math.PI); ctx.fill();
    ctx.drawImage(q, x - px * escala, y - py * escala, q.width * escala, q.height * escala);
    ctx.restore();
  }

  function desenhar(ctx, agora) {
    fundo(ctx);
    if (!info) return;
    const dt = ultimo == null ? 0 : Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    atualizar(dt);
    desenharJogador(ctx, quadroAtual(), jogador.x, jogador.y, 1);

    // Faixa de conferência: as 4 direções andando no lugar, menores.
    const dur = info.duracoes_ms;
    const tempo = agora % dur.reduce((a, b) => a + b, 0);
    let t = tempo, i = 0;
    while (t >= dur[i]) { t -= dur[i]; i++; }
    ["baixo", "esquerda", "direita", "cima"].forEach((d, k) => {
      desenharJogador(ctx, info.ciclos[d][i], 1300 + k * 140, 330, 0.5);
    });
    ctx.fillStyle = "#cbb8ef";
    ctx.font = "600 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("as 4 direções no lugar (metade do tamanho)", 1510, 372);
  }

  fetch(PASTA + "sprites.json").then((r) => r.json()).then((j) => {
    info = j;
    return Promise.all(Object.entries(j.quadros).map(([nome, arq]) => new Promise((ok, erro) => {
      const im = new Image();
      im.onload = ok;
      im.onerror = () => erro(new Error("sprite não carregou: " + arq));
      im.src = PASTA + arq;
      img[nome] = im;
    })));
  }).then(() => { window.NSF_SPRITES = { pronto: true, jogador, quadroAtual, atualizar }; })
    .catch((e) => { estado.erros.push(String(e)); console.error(e); });
  NSF.iniciar(document.getElementById("tela"), desenhar);
})();
