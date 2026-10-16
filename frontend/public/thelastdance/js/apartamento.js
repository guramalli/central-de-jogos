// Cena do APARTAMENTO em blocos (planta para aprovação, FASE 4): piso, paredes, móveis como caixas com nome,
// colisão e o protagonista andando (folhas de caminhada em pixel art, 4 direções). Sem arte final do mapa.
// Funciona no celular: joystick de toque, câmera que segue o personagem quando o mapa não cabe na tela.
// Parâmetros: ?comodo=sala|quarto (onde começa), ?conjunto=video|prancha|recorte_sul+video, ?demo, ?grade.
(function () {
  "use strict";
  const { CONFIG, estado, ISO, PLANTA_APARTAMENTO: P } = NSF;
  const params = new URLSearchParams(location.search);
  const PASTA_SPR = "assets/characters/personagem_v2/pixel/";
  const VEL = 2.2;            // m/s
  const RAIO = 0.22;          // corpo do personagem no chão (m)
  const ALTURA_PERSONAGEM = 173; // px lógicos (≈ 1,73 m na escala do mapa); a escala vem da folha (jogo.json)
  const INICIOS = { sala: { x: P.inicio.x, y: P.inicio.y }, quarto: { x: 8.0, y: 2.6 } };

  // Extensão do mapa na tela (px lógicos, relativa à origem do mapa) e câmera.
  const minX = ISO.tela(0, P.profundidade, 0)[0], maxX = ISO.tela(P.largura, 0, 0)[0];
  const baseY = ISO.tela(P.largura, P.profundidade, 0)[1], topoY = ISO.tela(0, 0, P.peDireito)[1];
  const O = [0, 0];
  const T = (x, y, z) => { const p = ISO.tela(x, y, z); return [p[0] + O[0], p[1] + O[1]]; };
  const canvas = document.getElementById("tela");

  // Zoom: tela baixa (celular deitado) aproxima; tela alta e estreita (celular em pé) segue o personagem.
  function zoomDaTela() {
    const h = canvas.clientHeight;
    return h < 500 ? 1.7 : h < 760 ? 1.3 : 1;
  }
  // Uma dimensão da câmera: se o mapa cabe, centraliza; se não, segue o alvo sem mostrar além da borda.
  function eixoCamera(vista, mapaMin, mapaMax, alvo, margem) {
    const tam = mapaMax - mapaMin;
    if (tam + 2 * margem <= vista) return vista / 2 - (mapaMin + mapaMax) / 2;
    const o = vista / 2 - alvo;
    return Math.min(margem - mapaMin, Math.max(vista - margem - mapaMax, o));
  }
  function posicionarCamera(larguraVista, alturaVista) {
    const [px, py] = ISO.tela(jog.x, jog.y, 0);
    O[0] = eixoCamera(larguraVista, minX, maxX, px, 40);
    O[1] = eixoCamera(alturaVista, topoY, baseY, py - 90, 40);
  }

  const CORES = {
    parede: ["#5b5466", "#4a4454", "#6c6478"], movel: ["#6b5a4a", "#574838", "#7d6a57"],
    sofa: ["#9da3ad", "#868c96", "#b3b9c2"], mesa: ["#2b2b30", "#202024", "#3a3a40"],
    cadeira: ["#8f939a", "#797c82", "#a3a7ad"], luz: ["#c08a4a", "#a5753c", "#d9a35e"],
    planta: ["#3f7a45", "#336439", "#4f9156"], cama: ["#b0577a", "#954866", "#c56d8f"],
    armario: ["#7a5c3e", "#654b32", "#8c6c4b"], baixo: ["#5a4d7a", "#4b4066", "#6a5c8e"],
  };
  const PAREDE = {
    ripado: "#8a5a35", tv: "#101318", vidro: "rgba(90,150,210,0.55)", cimento: "#7d7b7f", led: "#ff4fd8",
    vermelha: "#7d2328", porta: "#3a2a24", quadro: "#e0b030", neon: "#ff3fbf",
  };

  let manifesto = null, conjunto = null;
  // Catálogo de peças do mapa (assets/maps/props/props.json): arte das caixas e texturas de parede.
  const PASTA_PROPS = "assets/maps/props/";
  const TEXTURA_PAREDE = "parede_lilas";
  let props = null;
  const imgProps = {};
  const folhas = {};
  const comodo = INICIOS[params.get("comodo")] ? params.get("comodo") : "quarto";
  const jog = { x: INICIOS[comodo].x, y: INICIOS[comodo].y, dir: "baixo", andando: false, tempo: 0 };
  const teclas = new Set();
  const toque = { ativo: false, sx: 0, sy: 0 };
  let demo = params.has("demo");
  let mostrarGrade = params.has("grade"), mostrarNomes = true;

  // ---------- entrada ----------
  const MAPA = { ArrowUp: "c", KeyW: "c", ArrowDown: "b", KeyS: "b", ArrowLeft: "e", KeyA: "e", ArrowRight: "d", KeyD: "d" };
  addEventListener("keydown", (e) => {
    if (e.code === "KeyG") { mostrarGrade = !mostrarGrade; marcar(); return; }
    if (e.code === "KeyN") { mostrarNomes = !mostrarNomes; marcar(); return; }
    if (!MAPA[e.code]) return;
    e.preventDefault();
    teclas.add(MAPA[e.code]);
    if (demo) { demo = false; marcar(); }
  });
  addEventListener("keyup", (e) => { if (MAPA[e.code]) teclas.delete(MAPA[e.code]); });
  addEventListener("blur", () => teclas.clear());
  const bDemo = document.getElementById("demo"), bGrade = document.getElementById("grade"), bNomes = document.getElementById("nomes");
  const bConj = document.getElementById("conjunto");
  function marcar() {
    bDemo.setAttribute("aria-pressed", String(demo));
    bGrade.setAttribute("aria-pressed", String(mostrarGrade));
    bNomes.setAttribute("aria-pressed", String(mostrarNomes));
    if (bConj && conjunto) bConj.textContent = "Sprites: " + conjunto;
  }
  bDemo.addEventListener("click", () => { demo = !demo; caminho = []; marcar(); });
  if (bConj) bConj.addEventListener("click", () => {
    if (!manifesto) return;
    const nomes = Object.keys(manifesto.conjuntos);
    const proximo = nomes[(nomes.indexOf(conjunto) + 1) % nomes.length];
    bConj.textContent = "Carregando…";
    carregarConjunto(proximo).then(() => { conjunto = proximo; marcar(); })
      .catch((e) => { estado.erros.push(String(e)); marcar(); });
  });
  bGrade.addEventListener("click", () => { mostrarGrade = !mostrarGrade; marcar(); });
  bNomes.addEventListener("click", () => { mostrarNomes = !mostrarNomes; marcar(); });
  marcar();

  // Joystick de toque: arrastar a partir do centro dá a direção (na tela); soltar = parar.
  const joy = document.getElementById("joystick"), pino = document.getElementById("pino");
  if (joy) {
    const RAIO_JOY = 55;
    const mover = (e) => {
      const r = joy.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if (d > RAIO_JOY) { dx *= RAIO_JOY / d; dy *= RAIO_JOY / d; }
      pino.style.transform = "translate(" + dx + "px, " + dy + "px)";
      const n = Math.min(1, d / RAIO_JOY);
      toque.ativo = n > 0.2;
      toque.sx = toque.ativo ? dx / RAIO_JOY : 0;
      toque.sy = toque.ativo ? dy / RAIO_JOY : 0;
      if (toque.ativo && demo) { demo = false; marcar(); }
    };
    let dedo = null; // ponteiro que está arrastando (o joystick ignora outros toques)
    const soltar = (e) => {
      if (e && dedo !== null && e.pointerId !== dedo) return;
      dedo = null; toque.ativo = false; toque.sx = 0; toque.sy = 0; pino.style.transform = "";
    };
    joy.addEventListener("pointerdown", (e) => {
      dedo = e.pointerId;
      try { joy.setPointerCapture(e.pointerId); } catch (_) { /* sem captura: segue pelo window */ }
      mover(e); e.preventDefault();
    });
    addEventListener("pointermove", (e) => { if (e.pointerId === dedo) mover(e); });
    addEventListener("pointerup", soltar);
    addEventListener("pointercancel", soltar);
    addEventListener("blur", () => soltar());
  }

  // Demonstração: passeia pelos pontos de interesse, desviando pela grade de alcance.
  const ROTEIRO = ["frente do sofá", "varanda (porta de vidro)", "mesa redonda", "lado da cama",
    "mesa do computador", "armário", "aparador", "porta de entrada"];
  let caminho = [], alvoDemo = 0;
  function rota(dePt, paraPt) { // busca em largura na grade de 0,1 m, devolve pontos do mundo
    const g = ISO.alcance(P, dePt.x, dePt.y, RAIO, 0.1);
    const { nx, ny, passo } = g;
    const idx = (i, j) => j * nx + i;
    const ini = [Math.floor(dePt.x / passo), Math.floor(dePt.y / passo)];
    const fim = [Math.floor(paraPt.x / passo), Math.floor(paraPt.y / passo)];
    const pai = new Int32Array(nx * ny).fill(-1);
    const fila = [ini]; pai[idx(...ini)] = idx(...ini);
    while (fila.length) {
      const [i, j] = fila.shift();
      if (i === fim[0] && j === fim[1]) break;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= nx || b >= ny || pai[idx(a, b)] !== -1 || !g.ok[idx(a, b)]) continue;
        pai[idx(a, b)] = idx(i, j);
        fila.push([a, b]);
      }
    }
    if (pai[idx(...fim)] === -1) return [];
    const pts = [];
    for (let k = idx(...fim); k !== idx(...ini); k = pai[k]) pts.push({ x: (k % nx + 0.5) * passo, y: (Math.floor(k / nx) + 0.5) * passo });
    pts.reverse();
    return pts.filter((_, i) => i % 4 === 3 || i === pts.length - 1);
  }
  const ponto = (nome) => P.pontos.find((p) => p.nome === nome);

  // ---------- movimento ----------
  function direcaoSprite(sx, sy) {
    if (Math.abs(sx) > Math.abs(sy) * 1.05) return sx > 0 ? "direita" : "esquerda";
    return sy > 0 ? "baixo" : "cima";
  }

  function atualizar(dt) {
    let sx = 0, sy = 0, wx = 0, wy = 0;
    if (demo) {
      if (!caminho.length) {
        caminho = rota(jog, ponto(ROTEIRO[alvoDemo]));
        alvoDemo = (alvoDemo + 1) % ROTEIRO.length;
        if (!caminho.length) return;
      }
      const alvo = caminho[0];
      const vx = alvo.x - jog.x, vy = alvo.y - jog.y, d = Math.hypot(vx, vy);
      if (d < 0.06) { caminho.shift(); jog.andando = caminho.length > 0; return; }
      wx = vx / d; wy = vy / d;
      sx = wx - wy; sy = (wx + wy) / 2; // direção na tela, para escolher o sprite
    } else if (toque.ativo) {
      sx = toque.sx; sy = toque.sy;
      [wx, wy] = ISO.direcaoMundo(sx, sy);
    } else {
      sx = (teclas.has("d") ? 1 : 0) - (teclas.has("e") ? 1 : 0);
      sy = (teclas.has("b") ? 1 : 0) - (teclas.has("c") ? 1 : 0);
      [wx, wy] = ISO.direcaoMundo(sx, sy);
    }
    jog.andando = wx !== 0 || wy !== 0;
    if (!jog.andando) { jog.tempo = 0; return; }
    jog.dir = direcaoSprite(sx, sy);
    ISO.mover(P, jog, wx * VEL * dt, wy * VEL * dt, RAIO);
    jog.tempo += dt * 1000;
  }

  // Quadro da folha: andando = ciclo no fps da folha; parado = quadro 0 (contato, pés no chão).
  function quadroSprite(f) {
    if (!jog.andando) return 0;
    return Math.floor(jog.tempo / 1000 * f.fps) % f.quadros;
  }

  // ---------- desenho ----------
  function poli(ctx, pts, cor, contorno) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fillStyle = cor; ctx.fill();
    if (contorno) { ctx.strokeStyle = contorno; ctx.lineWidth = 1.5; ctx.stroke(); }
  }

  // Textura vista de cima aplicada no chão de um cômodo (repetida a cada "metros"), inclinada no ângulo do mapa.
  function pisoTexturizado(ctx, c) {
    const info = props && c.piso_arte && props.props[c.piso_arte], tex = imgProps[c.piso_arte];
    if (!tex) return false;
    const L = info.metros || 2;
    ctx.save();
    const borda = [T(c.x0, c.y0, 0), T(c.x1, c.y0, 0), T(c.x1, c.y1, 0), T(c.x0, c.y1, 0)];
    ctx.beginPath(); borda.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath();
    ctx.clip();
    for (let x = c.x0; x < c.x1 - 1e-6; x += L) {
      for (let y = c.y0; y < c.y1 - 1e-6; y += L) {
        const o = T(x, y, 0), ex = T(x + L, y, 0), ey = T(x, y + L, 0);
        ctx.save();
        // +0.5 px nas bordas evita a linha fina entre repetições
        ctx.transform((ex[0] - o[0]) / (tex.width - 0.5), (ex[1] - o[1]) / (tex.width - 0.5),
          (ey[0] - o[0]) / (tex.height - 0.5), (ey[1] - o[1]) / (tex.height - 0.5), o[0], o[1]);
        ctx.drawImage(tex, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
    return true;
  }

  function desenharPiso(ctx) {
    for (const c of P.comodos) {
      if (pisoTexturizado(ctx, c)) continue;
      for (let x = c.x0; x < c.x1; x += 0.5) {
        for (let y = c.y0; y < c.y1; y += 0.5) {
          const cor = ((x + y) * 2) % 2 ? c.piso : c.piso2;
          poli(ctx, [T(x, y, 0), T(x + 0.5, y, 0), T(x + 0.5, y + 0.5, 0), T(x, y + 0.5, 0)], cor);
        }
      }
    }
    if (mostrarGrade) { // células onde o personagem cabe (verde) — grade de colisão
      const g = ISO.alcance(P, jog.x, jog.y, RAIO, 0.25);
      for (let j = 0; j < g.ny; j++) {
        for (let i = 0; i < g.nx; i++) {
          const x = i * 0.25, y = j * 0.25;
          const cor = g.ok[j * g.nx + i] ? "rgba(60,255,140,0.18)" : "rgba(255,60,90,0.22)";
          poli(ctx, [T(x, y, 0), T(x + 0.25, y, 0), T(x + 0.25, y + 0.25, 0), T(x, y + 0.25, 0)], cor, "rgba(0,0,0,0.15)");
        }
      }
    }
  }

  // Imagem vista de frente colada no retângulo da parede (a..b, z0..z1), no plano x = 0 ou y = 0.
  function decalque(ctx, w) {
    const im = props && w.arte && imgProps[w.arte];
    if (!im) return false;
    const P3 = (u, z) => (w.plano === "x0" ? T(0, u, z) : T(u, 0, z));
    const o = P3(w.a, w.z1), fimU = P3(w.b, w.z1), base = P3(w.a, w.z0);
    ctx.save();
    if (w.tipo === "neon" && estado.efeitos) { ctx.shadowColor = "#ff3fbf"; ctx.shadowBlur = 28; }
    ctx.transform((fimU[0] - o[0]) / im.width, (fimU[1] - o[1]) / im.width,
      (base[0] - o[0]) / im.height, (base[1] - o[1]) / im.height, o[0], o[1]);
    ctx.drawImage(im, 0, 0);
    ctx.restore();
    return true;
  }

  function quadParede(ctx, w) {
    if (decalque(ctx, w)) return;
    const p = w.plano === "x0"
      ? [T(0, w.a, w.z0), T(0, w.b, w.z0), T(0, w.b, w.z1), T(0, w.a, w.z1)]
      : [T(w.a, 0, w.z0), T(w.b, 0, w.z0), T(w.b, 0, w.z1), T(w.a, 0, w.z1)];
    poli(ctx, p, PAREDE[w.tipo], "rgba(0,0,0,0.35)");
    if (w.tipo === "ripado") { // ripas verticais
      ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2;
      for (let a = w.a + 0.12; a < w.b; a += 0.12) {
        const [x0, y0] = T(0, a, w.z0), [x1, y1] = T(0, a, w.z1);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
    }
    if (w.tipo === "vidro") { // cidade à noite atrás do vidro
      ctx.fillStyle = "rgba(255,210,120,0.8)";
      for (let k = 0; k < 14; k++) {
        const a = w.a + (w.b - w.a) * ((k * 37) % 100) / 100, z = w.z0 + 0.3 + (w.z1 - w.z0 - 0.5) * ((k * 61) % 100) / 100;
        const [x, y] = w.plano === "x0" ? T(0, a, z) : T(a, 0, z);
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
    if (w.tipo === "neon" || w.tipo === "led") {
      ctx.save(); ctx.shadowColor = PAREDE[w.tipo]; ctx.shadowBlur = estado.efeitos ? 24 : 0;
      poli(ctx, p, PAREDE[w.tipo]); ctx.restore();
    }
    if (w.tipo === "neon") {
      const [x, y] = w.plano === "x0" ? T(0, (w.a + w.b) / 2, (w.z0 + w.z1) / 2) : T((w.a + w.b) / 2, 0, (w.z0 + w.z1) / 2);
      ctx.save(); ctx.translate(x, y); ctx.transform(1, -0.5, 0, 1, 0, 0);
      ctx.fillStyle = "#fff"; ctx.font = "700 20px system-ui, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("MAIS UMA", 0, -6); ctx.fillText("NOITE?", 0, 16); ctx.restore();
    }
  }

  // Arte pronta de uma peça (props.json): imagem encaixada pelo canto (x0, y0, z = 0) da caixa.
  function arte(ctx, c) {
    const info = props && c.arte && props.props[c.arte], im = info && imgProps[c.arte];
    if (!im) return false;
    const [x, y] = T(c.x0, c.y0, 0), e = info.escala;
    ctx.drawImage(im, x - info.origem_px[0] / e, y - info.origem_px[1] / e, im.width / e, im.height / e);
    return true;
  }

  // Textura reta de parede aplicada numa face, inclinada no ângulo do mapa e repetida a cada largura_m.
  // eixo "x": face no plano y = fixo, de x = a até b; eixo "y": face no plano x = fixo, de y = a até b.
  function texturaFace(ctx, eixo, fixo, a, b, h, escurecer) {
    const info = props && props.props[TEXTURA_PAREDE], tex = imgProps[TEXTURA_PAREDE];
    if (!tex) return;
    const P3 = (u, z) => (eixo === "x" ? T(u, fixo, z) : T(fixo, u, z));
    const L = info.largura_m, H = info.altura_m;
    ctx.save();
    const contorno = [P3(a, 0), P3(b, 0), P3(b, h), P3(a, h)];
    ctx.beginPath(); contorno.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath();
    ctx.clip();
    for (let u = a; u < b - 1e-6; u += L) {
      const o = P3(u, H), fimU = P3(u + L, H), base = P3(u, 0);
      ctx.save();
      ctx.transform((fimU[0] - o[0]) / tex.width, (fimU[1] - o[1]) / tex.width,
        (base[0] - o[0]) / tex.height, (base[1] - o[1]) / tex.height, o[0], o[1]);
      ctx.drawImage(tex, 0, 0);
      ctx.restore();
    }
    if (escurecer) { ctx.fillStyle = "rgba(10,0,25," + escurecer + ")"; ctx.fill(); }
    ctx.restore();
  }

  function caixa(ctx, c) {
    if (arte(ctx, c)) return;
    const [cTopo, cEsq, cDir] = CORES[c.tipo] || CORES.movel;
    const z = c.z1;
    // faces visíveis: frente-esquerda (y = y1), frente-direita (x = x1), topo
    poli(ctx, [T(c.x0, c.y1, 0), T(c.x1, c.y1, 0), T(c.x1, c.y1, z), T(c.x0, c.y1, z)], cEsq, "rgba(0,0,0,0.45)");
    poli(ctx, [T(c.x1, c.y0, 0), T(c.x1, c.y1, 0), T(c.x1, c.y1, z), T(c.x1, c.y0, z)], cDir, "rgba(0,0,0,0.45)");
    poli(ctx, [T(c.x0, c.y0, z), T(c.x1, c.y0, z), T(c.x1, c.y1, z), T(c.x0, c.y1, z)], cTopo, "rgba(0,0,0,0.45)");
    if (c.tipo === "parede") { // as duas faces que dão para a câmera recebem a textura (a esquerda mais escura)
      texturaFace(ctx, "x", c.y1, c.x0, c.x1, z, 0.22);
      texturaFace(ctx, "y", c.x1, c.y0, c.y1, z, 0);
    }
  }

  function desenharJogador(ctx) {
    const f = manifesto.conjuntos[conjunto][jog.dir], im = folhas[f.folha];
    const q = quadroSprite(f), px = f.pes[0], py = f.pes[1];
    const [x, y] = T(jog.x, jog.y, 0);
    const e = ALTURA_PERSONAGEM / (manifesto.altura_personagem_px || 128);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath(); ctx.ellipse(x, y, 46, 13, 0, 0, 2 * Math.PI); ctx.fill();
    ctx.imageSmoothingEnabled = true; // folha em alta resolução reduzida: suavizar (sem serrilhado nem blocos)
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(im, q * f.larg, 0, f.larg, f.alt, x - px * e, y - py * e, f.larg * e, f.alt * e);
    ctx.restore();
  }

  function rotulo(ctx, texto, x, y, z) {
    const [sx, sy] = T(x, y, z);
    ctx.font = "600 15px system-ui, sans-serif";
    const w = ctx.measureText(texto).width + 12;
    ctx.fillStyle = "rgba(10,6,20,0.78)";
    ctx.fillRect(sx - w / 2, sy - 22, w, 20);
    ctx.fillStyle = "#f1e9ff"; ctx.textAlign = "center";
    ctx.fillText(texto, sx, sy - 7);
  }

  function desenhar(ctx, agora) {
    ctx.fillStyle = "#0b0712";
    ctx.fillRect(0, 0, CONFIG.larguraBase, CONFIG.alturaBase);
    if (!manifesto || !conjunto) return;
    const dt = desenhar.ultimo == null ? 0 : Math.min(0.05, (agora - desenhar.ultimo) / 1000);
    desenhar.ultimo = agora;
    atualizar(dt);
    const z = zoomDaTela();
    ctx.save();
    ctx.scale(z, z);
    posicionarCamera(CONFIG.larguraBase / z, CONFIG.alturaBase / z);

    desenharPiso(ctx);
    // paredes do fundo (altas) e o que está nelas
    for (const c of P.caixas.filter((k) => k.fundo)) caixa(ctx, c);
    for (const w of P.naParede) quadParede(ctx, w);

    // móveis, paredes cortadas e o personagem, na ordem de profundidade
    const itens = P.caixas.filter((k) => !k.fundo).map((c) => Object.assign({ desenho: "caixa" }, c));
    itens.push({ desenho: "jogador", x0: jog.x - 0.05, y0: jog.y - 0.05, x1: jog.x + 0.05, y1: jog.y + 0.05 });
    for (const it of ISO.ordenar(itens)) (it.desenho === "jogador" ? desenharJogador(ctx) : caixa(ctx, it));

    if (mostrarNomes) {
      for (const c of P.caixas) if (c.nome) rotulo(ctx, c.nome, (c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, c.z1);
      for (const w of P.naParede) {
        const m = (w.a + w.b) / 2;
        if (w.tipo !== "led" && w.tipo !== "cimento") rotulo(ctx, w.nome, w.plano === "x0" ? 0 : m, w.plano === "x0" ? m : 0, w.z1 + 0.15);
      }
      for (const c of P.comodos) rotulo(ctx, c.nome.toUpperCase(), c.x1 - 0.6, c.y1 - 0.4, 0);
    }
    ctx.restore();
  }

  // Baixa só as folhas de um conjunto (no celular, carregar os 3 conjuntos de uma vez pesaria ~6 MB).
  function carregarConjunto(nome) {
    const arquivos = Object.values(manifesto.conjuntos[nome]).map((f) => f.folha).filter((a) => !folhas[a]);
    return Promise.all(arquivos.map((arq) => new Promise((ok, erro) => {
      const im = new Image();
      im.onload = () => { folhas[arq] = im; ok(); };
      im.onerror = () => erro(new Error("folha não carregou: " + arq));
      im.src = PASTA_SPR + arq;
    })));
  }

  // Peças do mapa: carrega o catálogo e só as imagens usadas na planta (+ a textura de parede).
  fetch(PASTA_PROPS + "props.json").then((r) => r.json()).then((cat) => {
    const usadas = new Set([TEXTURA_PAREDE, ...P.caixas.map((c) => c.arte), ...P.naParede.map((w) => w.arte),
      ...P.comodos.map((c) => c.piso_arte)].filter(Boolean));
    return Promise.all([...usadas].filter((n) => cat.props[n]).map((n) => new Promise((ok) => {
      const im = new Image();
      im.onload = () => { imgProps[n] = im; ok(); };
      im.onerror = () => { estado.erros.push("peça não carregou: " + n); ok(); };
      im.src = PASTA_PROPS + cat.props[n].arquivo;
    }))).then(() => { props = cat; });
  }).catch(() => { /* sem catálogo: continua com as caixas em blocos */ });

  fetch(PASTA_SPR + "jogo.json").then((r) => r.json()).then((j) => {
    manifesto = j;
    const pedido = j.conjuntos[params.get("conjunto")] ? params.get("conjunto") : j.padrao;
    return carregarConjunto(pedido).then(() => { conjunto = pedido; });
  }).then(() => { marcar(); window.NSF_APTO = { pronto: true, jog, atualizar, teclas, toque, desenhar }; })
    .catch((e) => { estado.erros.push(String(e)); console.error(e); });
  NSF.iniciar(canvas, desenhar, { adaptar: true });
})();
