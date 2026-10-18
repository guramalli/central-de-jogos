// Cena do APARTAMENTO em blocos (planta para aprovação, FASE 4): piso, paredes, móveis como caixas com nome,
// colisão e o protagonista andando (folhas de caminhada em pixel art, 4 direções). Sem arte final do mapa.
// Funciona no celular: joystick de toque, câmera que segue o personagem quando o mapa não cabe na tela.
// Parâmetros: ?comodo=sala|quarto (onde começa), ?conjunto=video|prancha|recorte_sul+video, ?demo, ?grade.
(function () {
  "use strict";
  const global = window;
  const { CONFIG, estado, ISO } = NSF;
  const P = NSF.PLANTA_ATUAL || NSF.PLANTA_APARTAMENTO; // o mapa vem da planta que a página carregou
  const params = new URLSearchParams(location.search);
  const PASTA_SPR = "assets/characters/personagem_v2/pixel/";
  const VEL = 2.2;            // m/s
  const RAIO = 0.22;          // corpo do personagem no chão (m)
  let SENTA_LADO = 0.06, SENTA_FRENTE = 0.06; // quanto o personagem em quadros afunda no assento (em metros)
  let SENTA_ENCOSTO = 0.62; // sentado de costas para a câmera: o encosto esconde abaixo desta altura (m)
  const ALTURA_PERSONAGEM = 173; // px lógicos (≈ 1,73 m na escala do mapa); a escala vem da folha (jogo.json)
  const INICIOS = Object.assign({ inicio: { x: P.inicio.x, y: P.inicio.y } }, P.inicios || {});

  // Extensão do mapa na tela (px lógicos, relativa à origem do mapa) e câmera.
  const minX = ISO.tela(0, P.profundidade, 0)[0], maxX = ISO.tela(P.largura, 0, 0)[0];
  const baseY = ISO.tela(P.largura, P.profundidade, 0)[1], topoY = ISO.tela(0, 0, P.peDireito)[1];
  const O = [0, 0];
  const T = (x, y, z) => { const p = ISO.tela(x, y, z); return [p[0] + O[0], p[1] + O[1]]; };
  const canvas = document.getElementById("tela");

  // Zoom: tela baixa (celular deitado) aproxima; tela alta e estreita (celular em pé) segue o personagem.
  // P.zoom (opcional) afasta ou aproxima a câmera do mapa todo (ex.: a balada, grande, usa uma vista mais distante).
  function zoomDaTela() {
    const h = canvas.clientHeight;
    return (h < 500 ? 1.7 : h < 760 ? 1.3 : 1) * (P.zoom || 1);
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
    azulejo: "#d9d4c6", prateleira: "#7a5a3a", cardapio: "#26232b",
  };

  let manifesto = null, conjunto = null;
  // Catálogo de peças do mapa (assets/maps/props/props.json): arte das caixas e texturas de parede.
  const PASTA_PROPS = "assets/maps/props/";
  const TEXTURA_PAREDE = P.texturaParede === undefined ? "parede_lilas" : P.texturaParede; // null = sem textura
  let props = null;
  const imgProps = {};
  const folhas = {};
  const comodo = INICIOS[params.get("comodo")] ? params.get("comodo") : (P.inicioPadrao || "inicio");
  const jog = { x: INICIOS[comodo].x, y: INICIOS[comodo].y, dir: "baixo", andando: false, tempo: 0 };
  const teclas = new Set();
  const toque = { ativo: false, sx: 0, sy: 0 };
  let demo = params.has("demo");
  let mostrarGrade = params.has("grade"), mostrarNomes = params.has("nomes");

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

  // ---------- personagem modular (peças presas a um esqueleto; troca de roupa) ----------
  // É o protagonista padrão; o botão "Sprites" ainda alterna para as folhas antigas. Roupas valem em todos os mapas.
  const PASTA_MOD = "personagem_modular/", MODULAR = "modular";
  const ALTURA_MOD = 1375; // px do personagem no desenho original (pés em 1456, topo do cabelo ~81)
  const VISTA_MOD = { baixo: "frente", cima: "costas", esquerda: "lado_esquerdo", direita: "lado_direito" };
  const pref = {
    ler(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    gravar(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* sem armazenamento: só não lembra */ } },
  };
  let heroi = null, previa = null, heroiRelogio = 0;
  let roupas = (() => { try { return JSON.parse(pref.ler("nsf_roupas")) || []; } catch (_) { return []; } })();
  function guardarRoupas() { roupas = heroi.vestidas.slice(); pref.gravar("nsf_roupas", JSON.stringify(roupas)); }
  function carregarScript(src) {
    return new Promise((ok, erro) => {
      const el = document.createElement("script");
      el.src = src; el.onload = ok; el.onerror = () => erro(new Error("não carregou: " + src));
      document.head.appendChild(el);
    });
  }
  function carregarModular() {
    if (heroi) return Promise.resolve();
    const libs = global.PersonagemModular ? Promise.resolve()
      : carregarScript(PASTA_MOD + "dados.js").then(() => carregarScript(PASTA_MOD + "personagem-modular.js"));
    return libs.then(() => new global.PersonagemModular(global.PERSONAGEM_MODULAR, PASTA_MOD).carregar()).then((h) => {
      heroi = h;
      heroi.pixelado = false; // reduzido no mapa: suavizar, como as folhas de sprite
      for (const r of roupas) if (heroi.roupas[r]) heroi.vestir(r);
    });
  }
  const bJaqueta = document.createElement("button");
  bJaqueta.id = "jaqueta"; bJaqueta.textContent = "Jaqueta"; bJaqueta.hidden = true;
  if (bConj) bConj.after(bJaqueta);
  bJaqueta.addEventListener("click", () => {
    if (!heroi) return;
    heroi.alternar("jaqueta_couro");
    guardarRoupas();
    marcar();
  });

  function marcar() {
    bDemo.setAttribute("aria-pressed", String(demo));
    bGrade.setAttribute("aria-pressed", String(mostrarGrade));
    bNomes.setAttribute("aria-pressed", String(mostrarNomes));
    if (bConj && conjunto) bConj.textContent = "Sprites: " + conjunto;
    bJaqueta.hidden = conjunto !== MODULAR;
    bJaqueta.setAttribute("aria-pressed", String(roupas.includes("jaqueta_couro")));
  }
  bDemo.addEventListener("click", () => { demo = !demo; caminho = []; marcar(); });
  if (bConj) bConj.addEventListener("click", () => {
    if (!manifesto) return;
    const nomes = [...Object.keys(manifesto.conjuntos), MODULAR];
    const proximo = nomes[(nomes.indexOf(conjunto) + 1) % nomes.length];
    bConj.textContent = "Carregando…";
    carregarConjunto(proximo).then(() => { conjunto = proximo; pref.gravar("nsf_conjunto", proximo); marcar(); })
      .catch((e) => { estado.erros.push(String(e)); marcar(); });
  });
  bGrade.addEventListener("click", () => { mostrarGrade = !mostrarGrade; marcar(); });
  if (!params.has("dev")) { // jogador: só voltar ao menu e ligar/desligar o som
    const painel = document.getElementById("painel");
    if (painel) for (const el of painel.children) if (el.tagName !== "A" && el.id !== "som") el.style.display = "none";
  }
  bNomes.addEventListener("click", () => { mostrarNomes = !mostrarNomes; marcar(); });
  marcar();

  // Tocar/clicar para andar: o ponto tocado vira destino; o personagem vai até lá desviando dos móveis.
  // Tocar no celular que está tocando: ele anda até o criado-mudo e atende.
  let destinoToque = null;       // {x, y} no mundo (marcador no chão)
  let aoChegar = null;           // ação ao terminar o caminho (atender o telefone)
  let ultimaVista = null;        // {escala, dx, dy, z} do último quadro desenhado, para converter o toque
  function telaParaMundo(clientX, clientY) {
    if (!ultimaVista) return null;
    const r = canvas.getBoundingClientRect();
    const cx = (clientX - r.left) * canvas.width / r.width, cy = (clientY - r.top) * canvas.height / r.height;
    const v = ultimaVista;
    const lx = ((cx - v.dx) / v.escala) / v.z - O[0], ly = ((cy - v.dy) / v.escala) / v.z - O[1];
    const a = lx / (ISO.LARG / 2), b = ly / (ISO.ALT / 2);  // a = x - y, b = x + y
    return { x: (a + b) / 2, y: (b - a) / 2, telaX: lx + O[0], telaY: ly + O[1] };
  }
  // Ponto alcançável mais perto de (x, y) — tocar num móvel leva para o lado dele.
  function livreMaisPerto(x, y) {
    const g = ISO.alcance(P, jog.x, jog.y, RAIO, 0.1);
    let melhor = null, dMelhor = Infinity;
    for (let j = 0; j < g.ny; j++) {
      for (let i = 0; i < g.nx; i++) {
        if (!g.ok[j * g.nx + i]) continue;
        const px = (i + 0.5) * g.passo, py = (j + 0.5) * g.passo, d = Math.hypot(px - x, py - y);
        if (d < dMelhor) { dMelhor = d; melhor = { x: px, y: py }; }
      }
    }
    return melhor;
  }
  function irPara(x, y, acao) {
    levantar();
    const alvo = livreMaisPerto(x, y);
    if (!alvo) return;
    caminho = rota(jog, alvo);
    caminho.push(alvo);
    destinoToque = alvo;
    aoChegar = acao || null;
    if (demo) { demo = false; marcar(); }
  }
  const PORTA = P.naParede.find((w) => w.saida);
  const porta = { aberta: false, menu: null };
  // Retângulo da porta na tela (px lógicos, já com a câmera): para saber se o toque foi nela.
  function retanguloPorta() {
    if (!PORTA) return null;
    const P3 = (u, z) => (PORTA.plano === "x0" ? T(0, u, z) : T(u, 0, z));
    const pts = [P3(PORTA.a, PORTA.z0), P3(PORTA.b, PORTA.z0), P3(PORTA.b, PORTA.z1), P3(PORTA.a, PORTA.z1)];
    return { x0: Math.min(...pts.map((q) => q[0])) - 12, x1: Math.max(...pts.map((q) => q[0])) + 12,
             y0: Math.min(...pts.map((q) => q[1])) - 12, y1: Math.max(...pts.map((q) => q[1])) + 12 };
  }
  function frenteDaPorta() {
    const m = (PORTA.a + PORTA.b) / 2;
    return PORTA.plano === "x0" ? { x: 0.5, y: m } : { x: m, y: 0.5 };
  }
  function irParaPorta() {
    if (!PORTA || PORTA.trancada) return;
    const f = frenteDaPorta();
    irPara(f.x, f.y, abrirPorta);
  }
  // Porta com "vai" leva direto a um lugar (ex.: a porta do apartamento leva ao elevador); sem "vai", abre o
  // menu de destinos da planta.
  function abrirPorta() {
    porta.aberta = true;
    porta.origem = "porta";
    jog.dir = PORTA.plano === "x0" ? "esquerda" : "cima";
    if (PORTA.vai) sair(PORTA.vai);
    else mostrarDestinos();
  }

  // Objetos que abrem o menu de destinos (o carro na garagem): tocar -> ele vai até "falarDe" -> menu.
  const VEICULOS = P.caixas.filter((c) => c.destinos || c.interacao);
  function caixaNaTela(c, m, folga) {
    const pts = [];
    for (const x of [c.x0, c.x1]) for (const y of [c.y0, c.y1]) for (const z of [0, c.toqueZ || c.z1]) pts.push(T(x, y, z));
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    return m.telaX >= Math.min(...xs) - folga && m.telaX <= Math.max(...xs) + folga &&
           m.telaY >= Math.min(...ys) - folga && m.telaY <= Math.max(...ys) + folga;
  }
  function veiculoNoToque(m, folga) { return VEICULOS.find((c) => caixaNaTela(c, m, folga || 0)); }
  function irAoVeiculo(c) {
    const f = c.falarDe || { x: (c.x0 + c.x1) / 2, y: c.y1 + 0.4 };
    irPara(f.x, f.y, () => {
      const [ax, ay] = ISO.tela(jog.x, jog.y, 0), [bx, by] = ISO.tela((c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, 0);
      jog.dir = direcaoSprite(bx - ax, by - ay);
      if (c.interacao === "armario") abrirArmario();
      else if (c.interacao === "caixa_som") alternarCaixaSom(c);
      else if (c.interacao && P.aoInteragir) P.aoInteragir(c.interacao, c);
      else { porta.origem = "veiculo"; mostrarDestinos(); }
    });
  }
  // ---------- o que dá para usar: setinha em cima e, com o mouse, contorno + nome da ação ----------
  const ACAO = { armario: "Guarda-roupa", caixa_som: "Ligar o som", tv: "Assistir TV", computador: "Usar o computador",
    cama: "Dormir", vinho: "Ver o vinho", churrasqueira: "Assar a carne" };
  const acaoDe = (c) => c.dica || ACAO[c.interacao] || (c.destinos ? "Entrar no carro" : c.nome);
  let sobMouse = null; // { tipo: "objeto"|"porta"|"npc", alvo }
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const m = telaParaMundo(e.clientX, e.clientY);
    sobMouse = null;
    if (m && !porta.menu && !(NSF.Ligacao && NSF.Ligacao.aberta())) {
      const npc = npcNoToque(m), obj = veiculoNoToque(m, 10), rp = retanguloPorta();
      if (npc) sobMouse = { tipo: "npc", alvo: npc };
      else if (obj) sobMouse = { tipo: "objeto", alvo: obj };
      else if (rp && m.telaX >= rp.x0 && m.telaX <= rp.x1 && m.telaY >= rp.y0 && m.telaY <= rp.y1) sobMouse = { tipo: "porta" };
    }
    canvas.style.cursor = sobMouse ? "pointer" : "";
  });
  canvas.addEventListener("pointerleave", () => { sobMouse = null; canvas.style.cursor = ""; });

  function setinha(ctx, x, y, agora, fase) { // seta rosa pulando, apontando para baixo
    const b = Math.sin(agora / 260 + fase) * 4;
    ctx.save();
    ctx.translate(x, y + b);
    ctx.shadowColor = "#ff5ad8"; ctx.shadowBlur = estado.efeitos ? 10 : 0;
    ctx.fillStyle = "rgba(255,90,216,0.92)"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-11, -13); ctx.lineTo(11, -13); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function contornoCaixa(ctx, c) {
    const z = c.toqueZ || c.z1;
    ctx.save();
    ctx.strokeStyle = "rgba(255,120,230,0.95)"; ctx.lineWidth = 3;
    ctx.shadowColor = "#ff5ad8"; ctx.shadowBlur = estado.efeitos ? 12 : 0;
    const face = (pts) => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.stroke(); };
    face([T(c.x0, c.y0, z), T(c.x1, c.y0, z), T(c.x1, c.y1, z), T(c.x0, c.y1, z)]);
    face([T(c.x0, c.y1, 0), T(c.x1, c.y1, 0), T(c.x1, c.y1, z), T(c.x0, c.y1, z)]);
    face([T(c.x1, c.y0, 0), T(c.x1, c.y1, 0), T(c.x1, c.y1, z), T(c.x1, c.y0, z)]);
    ctx.restore();
  }
  function desenharInterativos(ctx, agora) {
    if (porta.menu || jog.oculto || (NSF.Ligacao && NSF.Ligacao.aberta())) return;
    const vistos = new Set(); // sofá e TV fazem a mesma coisa: uma setinha só
    VEICULOS.forEach((c, i) => {
      if (c.interacao && vistos.has(c.interacao)) return;
      vistos.add(c.interacao);
      const [x, y] = T((c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, (c.toqueZ || c.z1) + 0.3);
      setinha(ctx, x, y, agora, i);
    });
    if (PORTA && !porta.saindo && !PORTA.trancada) {
      const m = (PORTA.a + PORTA.b) / 2;
      const [x, y] = PORTA.plano === "x0" ? T(0, m, PORTA.z1 + 0.25) : T(m, 0, PORTA.z1 + 0.25);
      setinha(ctx, x, y, agora, 2.5);
    }
    if (!sobMouse) return;
    let texto = "", px = 0, py = 0;
    if (sobMouse.tipo === "objeto") {
      const c = sobMouse.alvo;
      contornoCaixa(ctx, c);
      texto = acaoDe(c);
      [px, py] = T((c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, (c.toqueZ || c.z1) + 0.75);
    } else if (sobMouse.tipo === "porta") {
      const m = (PORTA.a + PORTA.b) / 2;
      texto = PORTA.vai ? "Ir para: " + PORTA.vai.nome : "Sair";
      [px, py] = PORTA.plano === "x0" ? T(0, m, PORTA.z1 + 0.7) : T(m, 0, PORTA.z1 + 0.7);
    } else {
      const n = sobMouse.alvo;
      texto = n.paquera ? "Chegar nela 😏" : n.dialogo || n.fala ? "Conversar com " + n.nome : n.nome;
      [px, py] = T(n.x, n.y, alturaNpc(n) + 0.95);
    }
    ctx.save();
    ctx.font = "700 15px system-ui, sans-serif";
    const w = ctx.measureText(texto).width + 20;
    ctx.fillStyle = "rgba(176,39,154,0.95)"; ctx.strokeStyle = "#ffd6f4"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(px - w / 2, py - 26, w, 26, 13); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(texto, px, py - 13);
    ctx.restore();
  }

  // ---------- o protagonista: balão de fala/pensamento, sentar e levantar ----------
  let balaoJog = null; // { texto, ate, pensamento }
  function falar(texto, ms, pensamento) { balaoJog = { texto, ate: performance.now() + (ms || 3200), pensamento: !!pensamento }; }
  function pensar(texto, ms) { falar(texto, ms || 3600, true); }
  // Senta em (x, y) virado para dir; ao andar de novo, volta para "voltar" (ponto livre ao lado do assento).
  function sentar(o) {
    caminho = []; destinoToque = null; aoChegar = null;
    jog.sentado = { voltar: { x: jog.x, y: jog.y } };
    jog.x = o.x; jog.y = o.y; jog.dir = o.dir || jog.dir;
    jog.andando = false;
  }
  function levantar() {
    if (!jog.sentado) return;
    jog.x = jog.sentado.voltar.x; jog.y = jog.sentado.voltar.y;
    jog.sentado = null; jog.pose = null;
    if (P.aoLevantar) P.aoLevantar();
  }
  function desenharBalaoJog(ctx, agora) {
    if (!balaoJog || agora > balaoJog.ate || jog.oculto) return;
    const [x, y0] = T(jog.x, jog.y, 0), k = y0 - T(jog.x, jog.y, 1)[1];
    const y = y0 - 2.05 * k + (jog.sentado ? 0.35 * k : 0);
    ctx.save();
    ctx.font = (balaoJog.pensamento ? "italic " : "") + "600 15px system-ui, sans-serif";
    const larg = Math.min(300, ctx.measureText(balaoJog.texto).width + 24);
    const linhas = quebrar(ctx, balaoJog.texto, larg - 22), h = 12 + linhas.length * 19;
    ctx.fillStyle = balaoJog.pensamento ? "rgba(245,240,255,0.96)" : "rgba(22,13,36,0.95)";
    ctx.strokeStyle = balaoJog.pensamento ? "#8a76b8" : "#ff9be9"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x - larg / 2, y - h - 14, larg, h, balaoJog.pensamento ? 16 : 10); ctx.fill(); ctx.stroke();
    if (balaoJog.pensamento) { // bolinhas do pensamento
      for (const [dx, dy, r] of [[6, -8, 5], [12, 0, 3]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 7); ctx.fill(); ctx.stroke(); }
    } else {
      ctx.beginPath(); ctx.moveTo(x - 7, y - 15); ctx.lineTo(x, y - 4); ctx.lineTo(x + 7, y - 15); ctx.fill();
    }
    ctx.fillStyle = balaoJog.pensamento ? "#2b1f40" : "#f3ecff"; ctx.textAlign = "center";
    linhas.forEach((l, i) => ctx.fillText(l, x, y - h - 14 + 24 + i * 19));
    ctx.restore();
  }

  // Caixa de som: liga/desliga a música do lugar e mostra um aviso em cima dela.
  let avisoObjeto = null;
  function alternarCaixaSom(c) {
    if (!NSF.Audio) return;
    if (NSF.Audio.iniciar) NSF.Audio.iniciar();
    const ligar = !NSF.Audio.estado().querMusica;
    NSF.Audio.musica(ligar);
    avisoObjeto = { c, texto: ligar ? "♪ Som na caixa! ♪" : "Silêncio...", ate: performance.now() + 2200 };
  }
  // Guarda-roupa: as roupas são do personagem modular — se ele estiver com outro conjunto, troca para o modular.
  function abrirArmario() {
    if (!NSF.Armario || NSF.Armario.aberto()) return;
    if (/^3d/.test(conjunto) && P.aoArmarioConjunto) { P.aoArmarioConjunto(window.NSF_APTO, Object.keys(manifesto.conjuntos)); return; }
    const antes = conjunto;
    carregarConjunto(MODULAR).then(() => {
      conjunto = MODULAR;
      if (antes !== MODULAR) pref.gravar("nsf_conjunto", MODULAR);
      marcar();
      return previa || new global.PersonagemModular(global.PERSONAGEM_MODULAR, PASTA_MOD).carregar();
    }).then((pv) => {
      previa = pv;
      NSF.Armario.abrir({ heroi, previa, aoMudar: () => { guardarRoupas(); marcar(); } });
    }).catch((e) => { estado.erros.push(String(e)); });
  }
  function fecharPorta() {
    porta.aberta = false;
    if (porta.menu) porta.menu.remove();
    porta.menu = null;
  }
  // Menu "Para onde você vai?" (destinos da planta; os inativos aparecem como "em breve").
  function mostrarDestinos() {
    if (porta.menu) return;
    const fundo = document.createElement("div");
    fundo.className = "destinos";
    fundo.setAttribute("role", "dialog");
    fundo.setAttribute("aria-label", "Para onde você vai?");
    const caixa = document.createElement("div");
    caixa.className = "destinos-caixa";
    const t = document.createElement("h2");
    t.textContent = "Para onde você vai?";
    caixa.appendChild(t);
    for (const d of P.destinos || []) {
      if (d.so && !(() => { try { return sessionStorage.getItem(d.so) === "1"; } catch (_) { return false; } })()) continue;
      const b = document.createElement("button");
      b.disabled = !d.ativo;
      const nome = document.createElement("b"); nome.textContent = d.nome;
      const desc = document.createElement("small"); desc.textContent = d.ativo ? d.descricao : "Em breve";
      b.append(nome, desc);
      b.addEventListener("click", () => sair(d));
      caixa.appendChild(b);
    }
    const ficar = document.createElement("button");
    ficar.className = "ficar";
    ficar.textContent = "Ficar aqui";
    ficar.addEventListener("click", fecharPorta);
    caixa.appendChild(ficar);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    porta.menu = fundo;
    const primeiro = caixa.querySelector("button:not([disabled])");
    if (primeiro) primeiro.focus();
  }
  // ---------- passagem de tela ----------
  // Sair: o personagem some num "clique" (achata, vira uma linha de luz e apaga, como TV antiga), a tela
  // escurece com "Indo para <lugar>" e abre o próximo mapa. Chegar: a tela clareia com o nome do lugar e ele
  // reaparece na porta com o mesmo clique ao contrário.
  const efeito = { tipo: null, t0: 0, dur: 0, fim: null };
  function efeitoJogador(tipo, dur, fim) {
    Object.assign(efeito, { tipo, t0: performance.now(), dur, fim: fim || null });
    if (tipo === "aparecer") jog.oculto = false;
    teclas.clear(); caminho = []; destinoToque = null; aoChegar = null;
    jog.andando = false; jog.tempo = 0;
  }
  // Escala do corpo (sx, sy) e brilho da linha de luz no instante "agora"; null se não há efeito.
  function quadroEfeito(agora) {
    if (!efeito.tipo) return null;
    const bruto = Math.min(1, (agora - efeito.t0) / efeito.dur);
    if (bruto >= 1) {
      const fim = efeito.fim, tipo = efeito.tipo;
      efeito.tipo = null; efeito.fim = null;
      if (tipo === "sumir") jog.oculto = true;
      if (fim) fim();
      return null;
    }
    const p = efeito.tipo === "sumir" ? bruto : 1 - bruto;  // aparecer = o mesmo filme de trás para frente
    let sx, sy;
    if (p < 0.25) { const k = p / 0.25; sx = 1 + 0.2 * k; sy = 1 - 0.15 * k; }          // encolhe para pegar impulso
    else if (p < 0.6) { const k = (p - 0.25) / 0.35; sx = 1.2 + 0.3 * k; sy = 0.85 * (1 - k) + 0.03 * k; } // achata
    else { const k = (p - 0.6) / 0.4; sx = 1.5 * (1 - k); sy = 0.03; }                  // a linha some no meio
    const brilho = p < 0.4 ? 0 : p < 0.75 ? (p - 0.4) / 0.35 : (1 - p) / 0.25;
    return { sx, sy, brilho };
  }
  // opcoes.andando: em vez do "clique", ele atravessa a porta andando e a tela escurece (ex.: saindo do elevador)
  function sair(destino, opcoes) {
    if (porta.saindo) return;
    porta.saindo = true;
    if (porta.menu) { porta.menu.remove(); porta.menu = null; }
    const escurecer = () => {
      if (NSF.Audio) NSF.Audio.musica(false);
      const cortina = cortinaCom("Indo para", destino.nome);
      document.body.appendChild(cortina);
      requestAnimationFrame(() => requestAnimationFrame(() => cortina.classList.add("fechada")));
      const url = destino.url + (destino.url.includes("?") ? "&" : "?") + "chegada=1";
      setTimeout(() => { location.href = url; }, 1200);
    };
    const andando = opcoes ? opcoes.andando : porta.origem !== "veiculo";
    if (andando && PORTA) {
      porta.aberta = true;
      const f = frenteDaPorta();
      const passo = () => { // um passo para dentro do vão da porta, sumindo atrás dela
        jog.dir = PORTA.plano === "x0" ? "esquerda" : "cima";
        jog.oculto = false;
        caminho = [{ x: PORTA.plano === "x0" ? 0.15 : f.x, y: PORTA.plano === "x0" ? f.y : 0.15 }];
        destinoToque = caminho[0];
        aoChegar = null;
        setTimeout(escurecer, 350);
      };
      irPara(f.x, f.y, passo);
      return;
    }
    // entrou no carro: some e a tela escurece
    setTimeout(() => { jog.oculto = true; }, 250);
    setTimeout(escurecer, 450);
  }
  function cortinaCom(linha1, linha2) {
    const c = document.createElement("div");
    c.className = "cortina";
    c.setAttribute("role", "status");
    const t = document.createElement("div");
    t.className = "cortina-texto";
    const a = document.createElement("small"); a.textContent = linha1;
    const b = document.createElement("b"); b.textContent = linha2;
    t.append(a, b);
    c.appendChild(t);
    return c;
  }
  // Chegou pela porta de outro mapa: começa no escuro com o nome do lugar, clareia e ele aparece na porta.
  if (params.has("chegada")) {
    jog.oculto = true;
    porta.aberta = true;
    const c = cortinaCom("Você chegou", P.nome);
    c.classList.add("fechada", "sem-transicao");
    document.body.appendChild(c);
    const resto = location.search.replace(/[?&]chegada=1/, "").replace(/^&/, "?");
    history.replaceState(null, "", location.pathname + resto + location.hash); // recarregar não repete a chegada
    const alvo = { x: jog.x, y: jog.y };
    const f = PORTA ? frenteDaPorta() : null;
    const pelaPorta = f && Math.hypot(alvo.x - f.x, alvo.y - f.y) < 2.5;
    if (pelaPorta) {
      if (Math.hypot(alvo.x - f.x, alvo.y - f.y) < 0.6) { // início colado na porta: anda um pouco para dentro
        alvo.x = PORTA.plano === "x0" ? f.x + 1.4 : f.x;
        alvo.y = PORTA.plano === "x0" ? f.y : f.y + 1.4;
      }
      jog.x = f.x; jog.y = f.y; // começa na soleira da porta (aberta atrás dele)
      jog.dir = PORTA.plano === "x0" ? "direita" : "baixo";
    } else {
      porta.aberta = false;
    }
    setTimeout(() => {
      c.classList.remove("sem-transicao", "fechada");
      setTimeout(() => {
        c.remove();
        jog.oculto = false;
        if (!pelaPorta) return; // desceu do carro: já está ali
        if (params.has("plim") && NSF.Audio) { NSF.Audio.ding(); NSF.Audio.portaElevador(); }
        irPara(alvo.x, alvo.y, () => setTimeout(() => { porta.aberta = false; }, 250)); // entra andando
      }, 650);
    }, 1100);
  }

  // ---------- gente no mapa (bonecos provisórios até a arte) ----------
  // Toque numa pessoa: o protagonista vai até o "falarDe" dela, vira para ela e conversa (roteiro) ou ela solta uma fala.
  const NPCS = (P.npcs || []).map((n) => Object.assign({ balao: null, resultado: null }, n));
  for (const n of NPCS) {
    if (n.postura !== "sentado") continue;
    const c = P.caixas.find((k) => k.tipo === "cadeira" && n.x > k.x0 && n.x < k.x1 && n.y > k.y0 && n.y < k.y1);
    if (c) c.ocupante = n;   // desenhado logo depois da cadeira (a mesa à frente cobre o colo)
  }
  const alturaNpc = (n) => (n.postura === "sentado" ? 1.35 + ((n.assento || 0.47) - 0.47) : 1.8);

  // Pessoas com "personagem": "<id>" usam uma personagem modular de assets/characters/npcs/<id>/ (as mesmas peças
  // e animações do protagonista). A mesma personagem pode aparecer em vários mapas e várias vezes no mesmo mapa:
  // os dados e as imagens são baixados uma vez só; cada pessoa tem a sua instância (vista e tempo próprios).
  const PASTA_NPC = "assets/characters/npcs/";
  const dadosNpc = {};
  function carregarLibs() {
    return global.PersonagemModular ? Promise.resolve()
      : carregarScript(PASTA_MOD + "dados.js").then(() => carregarScript(PASTA_MOD + "personagem-modular.js"));
  }
  if (NPCS.some((n) => n.personagem)) {
    // os amigos (rosto real) só existem destrancados: espera o pacote da área dos amigos (js/vip.js)
    const vip = NSF.VIP ? NSF.VIP.pronto : Promise.resolve();
    Promise.all([carregarLibs(), vip]).then(() => Promise.all(NPCS.filter((n) => n.personagem).map((n) => {
      const id = n.personagem, json = PASTA_NPC + id + "/personagem.json";
      dadosNpc[id] = dadosNpc[id] || fetch(NSF.VIP ? NSF.VIP.url(json) : json).then((r) => r.json());
      return dadosNpc[id].then((d) => new global.PersonagemModular(d, PASTA_NPC + id + "/").carregar()).then((pm) => {
        pm.pixelado = false;
        pm.definirVista(VISTA_MOD[n.dir] || "frente");
        if (n.postura === "sentado") criarPoseSentada(pm);
        pm.tocar(n.postura === "sentado" && pm.vista.startsWith("lado") ? "sentado" : "parado");
        pm.tempo = Math.random() * 2; // cada um respira num ritmo
        n.modular = pm;
      });
    }))).catch((e) => estado.erros.push(String(e)));
  }
  // Pose sentada de perfil: a coxa gira para a frente (horizontal) e a canela volta para baixo. De frente/de
  // costas não dá para dobrar a perna em 2D: ali a mesa (com toalha) cobre da cintura para baixo.
  function girarOsso(graus, px, py) {
    const r = graus * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    return [c, s, -s, c, px - c * px + s * py, py - s * px - c * py];
  }
  function criarPoseSentada(pm) {
    if (pm.animacoes.sentado) return;
    const vistas = {};
    for (const [vista, sinal] of [["lado_direito", -1], ["lado_esquerdo", 1]]) {
      const o = pm.rig.vistas[vista].ossos;
      const q = {};
      // a perna de trás um pouco diferente da da frente (coxa menos erguida, canela mais para trás):
      // de perfil, as duas pernas aparecem em vez de uma cobrir a outra
      for (const [coxa, canela, gc, gk] of [["coxa", "canela", 82, 82], ["coxa_tras", "canela_tras", 62, 34]]) {
        q[coxa] = girarOsso(sinal * gc, o[coxa].pivo[0], o[coxa].pivo[1]);
        q[canela] = girarOsso(-sinal * gk, o[canela].pivo[0], o[canela].pivo[1]);
      }
      vistas[vista] = [q];
    }
    vistas.frente = pm.animacoes.parado.vistas.frente;
    vistas.costas = pm.animacoes.parado.vistas.costas;
    pm.animacoes.sentado = { fps: 1, loop: true, vistas };
  }
  let npcRelogio = 0;
  // Desenho da personagem modular. Sentada: o quadril fica na altura do assento e as pernas são cortadas ali
  // (a mesa na frente cobre o resto) — o esqueleto não tem pose sentada.
  function desenharNpcModular(ctx, n) {
    const pm = n.modular;
    let [fx, fy] = T(n.x, n.y, 0);
    ctx.save();
    const acima = (n.assento || 0.47) - 0.47; // banqueta alta: o corpo sobe junto com o assento
    if (n.postura === "sentado" && pm.vista.startsWith("lado")) {
      fy += (fy - T(n.x, n.y, 1)[1]) * (0.22 - acima); // de perfil: pernas dobradas, o quadril desce até o assento
    } else if (n.postura === "sentado") {
      // corte um pouco abaixo do assento: as mãos (braços para baixo) aparecem; a mesa da frente cobre o resto
      const corte = T(n.x, n.y, (n.assento || 0.47) - 0.24)[1] + 6;
      fy += (fy - T(n.x, n.y, 1)[1]) * (0.3 - acima); // corpo mais baixo: sentada, a cabeça fica abaixo de quem está em pé
      ctx.beginPath(); ctx.rect(fx - 400, corte - 2000, 800, 2000); ctx.clip();
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath(); ctx.ellipse(fx, fy, 40, 11, 0, 0, 2 * Math.PI); ctx.fill();
    }
    pm.desenhar(ctx, fx, fy, ALTURA_PERSONAGEM / ALTURA_MOD);
    ctx.restore();
  }
  function retanguloNpc(n) {
    const [bx, by] = T(n.x, n.y, 0), ty = T(n.x, n.y, alturaNpc(n))[1];
    return { x0: bx - 34, x1: bx + 34, y0: ty - 12, y1: by + 6 };
  }
  function npcNoToque(m) { // se dois se sobrepõem na tela, vale o da frente
    let achado = null;
    for (const n of NPCS) {
      if (n.oculta || n.interagir === false) continue; // interagir: false = só faz parte da cena (sem toque)
      const r = retanguloNpc(n);
      if (m.telaX < r.x0 || m.telaX > r.x1 || m.telaY < r.y0 || m.telaY > r.y1) continue;
      if (!achado || n.x + n.y > achado.x + achado.y) achado = n;
    }
    return achado;
  }
  function irFalarCom(n) {
    const f = n.falarDe || n;
    irPara(f.x, f.y, () => falarCom(n));
  }
  function falarCom(n) {
    const [ax, ay] = ISO.tela(jog.x, jog.y, 0), [bx, by] = ISO.tela(n.x, n.y, 0);
    jog.dir = direcaoSprite(bx - ax, by - ay);
    if (n.paquera && NSF.Paquera) { // menina: caixa de paquera (js/paquera.js)
      teclas.clear(); caminho = []; destinoToque = null;
      NSF.Paquera.abrir(n);
      return;
    }
    const roteiro = n.dialogo && NSF.DIALOGOS && NSF.DIALOGOS[n.dialogo];
    if (roteiro && NSF.Ligacao) {
      teclas.clear(); caminho = []; destinoToque = null;
      NSF.Ligacao.atender(roteiro, { aoTerminar: (r) => { n.resultado = r; } });
      return;
    }
    if (n.fala) {
      const lista = Array.isArray(n.fala) ? n.fala : [n.fala];
      n.vezFala = ((n.vezFala == null ? -1 : n.vezFala) + 1) % lista.length;
      n.balao = { texto: lista[n.vezFala], ate: performance.now() + 3500 };
    }
  }

  // Botão direito do mouse = interagir: porta (com área de clique maior), pessoas e celular. Nunca anda.
  function interagir(m) {
    if (ligacao.tocando && ligacao.icone && Math.hypot(m.telaX - ligacao.icone[0], m.telaY - ligacao.icone[1]) < 90) {
      irAtender();
      return;
    }
    const npc = npcNoToque(m);
    if (npc) { irFalarCom(npc); return; }
    const veiculo = veiculoNoToque(m, 20);
    if (veiculo) { irAoVeiculo(veiculo); return; }
    const rp = retanguloPorta(), folga = 40;
    if (rp && m.telaX >= rp.x0 - folga && m.telaX <= rp.x1 + folga && m.telaY >= rp.y0 - folga && m.telaY <= rp.y1 + folga) irParaPorta();
  }
  canvas.addEventListener("contextmenu", (e) => e.preventDefault()); // sem o menu do navegador no mapa
  // No computador (mouse), a dica fala de clique e botão direito.
  const dica = document.getElementById("dica");
  if (dica && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    dica.textContent = "Clique no chão para andar · botão direito na porta" + (P.npcs ? " ou nas pessoas" : "") + " para interagir";
  }

  let ultimoToque = 0; // a pessoa acabou de mexer: não é hora de o telefone tocar
  canvas.addEventListener("pointerdown", () => { ultimoToque = performance.now(); }, true);
  // Ocupado = interagindo ou alguém falando: telas abertas, menus, caixa de escolha, sentado, dormindo,
  // indo até alguma coisa, balão de fala/pensamento ou voz tocando, ou mexeu há pouco.
  function ocupado() {
    const agora = performance.now();
    if (NSF.Ligacao && NSF.Ligacao.aberta()) return true;
    if (P.ocupado && P.ocupado()) return true; // o mapa tem uma cena rolando (ex.: o encontro no apê)
    if (NSF.Armario && NSF.Armario.aberto && NSF.Armario.aberto()) return true;
    if (porta.menu || porta.saindo || efeito.tipo || jog.oculto || jog.sentado || aoChegar) return true;
    if (document.querySelector(".escolha, .cortina, .aviso-deitar")) return true;
    if (balaoJog && agora < balaoJog.ate) return true;
    if (jog.falandoAte && agora < jog.falandoAte) return true;
    if (NPCS.some((n) => !n.oculta && ((n.balao && agora < n.balao.ate) || (n.falandoAte && agora < n.falandoAte)))) return true;
    return agora - ultimoToque < 6000;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (NSF.Ligacao && NSF.Ligacao.aberta()) return;
    if (porta.menu || porta.saindo || efeito.tipo || jog.oculto) return;
    if (NSF.Armario && NSF.Armario.aberto()) return;
    const m = telaParaMundo(e.clientX, e.clientY);
    if (!m) return;
    e.preventDefault();
    if (e.button === 2) { interagir(m); return; }
    if (ligacao.tocando && ligacao.icone && Math.hypot(m.telaX - ligacao.icone[0], m.telaY - ligacao.icone[1]) < 60) {
      irAtender();
      return;
    }
    const npc = npcNoToque(m);
    if (npc) { irFalarCom(npc); return; }
    const veiculo = veiculoNoToque(m, 0);
    if (veiculo) { irAoVeiculo(veiculo); return; }
    const rp = retanguloPorta();
    if (rp && m.telaX >= rp.x0 && m.telaX <= rp.x1 && m.telaY >= rp.y0 && m.telaY <= rp.y1) { irParaPorta(); return; }
    if (m.x < 0 || m.y < 0 || m.x > P.largura || m.y > P.profundidade) return;
    irPara(m.x, m.y, null);
  });

  // Demonstração: passeia pelos pontos de interesse, desviando pela grade de alcance.
  const ROTEIRO = P.roteiroDemo || P.pontos.map((p) => p.nome);
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

  // ---------- ligação do telefone (primeira interação de teste) ----------
  const ROTEIRO_LIGACAO = P.ligacao && NSF.DIALOGOS && NSF.DIALOGOS[P.ligacao];
  const ligacao = { tocando: false, resultado: null, relogio: null };
  const avisoTocando = document.getElementById("tocando");
  function mostrarAviso(sim) { if (avisoTocando) avisoTocando.classList.toggle("visivel", sim); }
  function irAtender() {
    const cm = P.caixas.find((c) => c.nome === "Criado-mudo");
    irPara((cm.x0 + cm.x1) / 2, cm.y1 + 0.35, atenderTelefone);
  }
  if (avisoTocando) avisoTocando.addEventListener("click", () => irAtender());
  function telefoneToca() {
    if (!ROTEIRO_LIGACAO || !NSF.Ligacao || NSF.Ligacao.aberta()) return;
    ligacao.tocando = true;
    if (NSF.Audio) NSF.Audio.toque(true);
    if (NSF.Celular && NSF.Celular.chamadaCentral) { // o celular do canto toca: atender/recusar no meio da tela
      NSF.Celular.chamadaCentral({ nome: ROTEIRO_LIGACAO.contato, cor: "#c2185b", emoji: "😻",
        aoAtender: atenderTelefone,
        aoRecusar: () => {
          ligacao.tocando = false; if (NSF.Audio) NSF.Audio.toque(false); agendarLigacao(45);
          if (P.aoTerminarLigacao) P.aoTerminarLigacao("recusou", window.NSF_APTO);
        } });
      return;
    }
    mostrarAviso(true);       // sem o celular: fica vibrando no criado-mudo até o jogador tocar nele (ou no aviso)
  }
  function atenderTelefone() {
    if (!ligacao.tocando || NSF.Ligacao.aberta()) return;
    teclas.clear(); caminho = []; destinoToque = null;
    jog.dir = "cima";
    mostrarAviso(false);
    if (NSF.Audio) { NSF.Audio.toque(false); NSF.Audio.abafar(true); }
    NSF.Ligacao.atender(ROTEIRO_LIGACAO, { aoTerminar: (r) => {
      ligacao.tocando = false; ligacao.resultado = r;
      if (NSF.Audio) NSF.Audio.abafar(false);
      if (P.aoTerminarLigacao) P.aoTerminarLigacao(r, window.NSF_APTO); // a história continua (ex.: convite para surfar)
    } });
  }
  function agendarLigacao(segundos) {
    clearTimeout(ligacao.relogio);
    ligacao.relogio = setTimeout(telefoneToca, segundos * 1000);
  }
  // Celular em pé: sugere deitar (paisagem mostra o lugar inteiro). Uma vez por visita; some ao girar.
  (function avisoDeitar() {
    const toque = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    let visto = false;
    try { visto = sessionStorage.getItem("nsf_aviso_deitar") === "1"; } catch (e) { /* sem armazenamento */ }
    if (!toque || visto || innerWidth > innerHeight || params.has("test")) return;
    const a = document.createElement("div");
    a.className = "aviso-deitar"; a.setAttribute("role", "dialog");
    const icone = document.createElement("div"); icone.className = "aviso-deitar-cel"; icone.textContent = "📱"; icone.setAttribute("aria-hidden", "true");
    const t1 = document.createElement("b"); t1.textContent = "Está no celular?";
    const t2 = document.createElement("span"); t2.textContent = "Para uma experiência 100%, deite o celular.";
    const ok = document.createElement("button"); ok.type = "button"; ok.textContent = "Ok, entendi";
    a.append(icone, t1, t2, ok);
    const girou = () => { if (innerWidth > innerHeight) fechar(); };
    function fechar() { a.remove(); removeEventListener("resize", girou); try { sessionStorage.setItem("nsf_aviso_deitar", "1"); } catch (e) { /* ok */ } }
    ok.addEventListener("click", fechar);
    addEventListener("resize", girou);
    document.body.appendChild(a);
  })();

  const bSom = document.getElementById("som");
  if (bSom && NSF.Audio && !NSF.Audio.ligado()) { bSom.textContent = "Som: desligado"; bSom.setAttribute("aria-pressed", "false"); }
  if (bSom) bSom.addEventListener("click", () => {
    const on = NSF.Audio ? NSF.Audio.alternar() : false;
    bSom.textContent = on ? "Som: ligado" : "Som: desligado";
    bSom.setAttribute("aria-pressed", String(on));
  });
  if (NSF.Audio) { NSF.Audio.trilha(P.musica || "apartamento"); NSF.Audio.musica(true); } // cada mapa tem sua música
  const bLig = document.getElementById("ligacao");
  if (bLig) bLig.addEventListener("click", () => telefoneToca());

  function atualizar(dt) {
    let sx = 0, sy = 0, wx = 0, wy = 0;
    if (NSF.Ligacao && NSF.Ligacao.aberta()) { jog.andando = false; jog.tempo = 0; return; }
    if (efeito.tipo || jog.oculto) { jog.andando = false; jog.tempo = 0; return; } // sumindo/aparecendo
    if (NSF.Armario && NSF.Armario.aberto()) { jog.andando = false; jog.tempo = 0; return; }
    const teclando = teclas.size > 0;
    if (teclando && jog.sentado) levantar();
    if (teclando && caminho.length && !demo) { caminho = []; destinoToque = null; aoChegar = null; }
    if (!demo && !teclando && destinoToque && !caminho.length) {
      destinoToque = null; jog.andando = false; jog.tempo = 0;
      const acao = aoChegar; aoChegar = null;
      if (acao) acao();
      return;
    }
    if (demo || (!teclando && caminho.length)) {
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
    if (!tex || !info) return false; // as imagens podem chegar antes do catálogo
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
    for (const f of P.faixas || []) { // tinta no chão: retângulos (x0..x1, y0..y1)
      poli(ctx, [T(f.x0, f.y0, 0), T(f.x1, f.y0, 0), T(f.x1, f.y1, 0), T(f.x0, f.y1, 0)], f.cor || "rgba(235,235,225,0.75)");
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
    // A esquerda da imagem fica à esquerda na tela: na parede x = 0 isso é o lado de y maior (b), não o a.
    const [ua, ub] = w.plano === "x0" ? [w.b, w.a] : [w.a, w.b];
    const o = P3(ua, w.z1), fimU = P3(ub, w.z1), base = P3(ua, w.z0);
    ctx.save();
    if (w.tipo === "neon" && estado.efeitos) { ctx.shadowColor = "#ff3fbf"; ctx.shadowBlur = 28; }
    ctx.transform((fimU[0] - o[0]) / im.width, (fimU[1] - o[1]) / im.width,
      (base[0] - o[0]) / im.height, (base[1] - o[1]) / im.height, o[0], o[1]);
    ctx.drawImage(im, 0, 0);
    ctx.restore();
    return true;
  }

  function portaAbertaDesenho(ctx, w) {
    const P3 = (u, z) => (w.plano === "x0" ? T(0, u, z) : T(u, 0, z));
    const p = [P3(w.a, w.z0), P3(w.b, w.z0), P3(w.b, w.z1), P3(w.a, w.z1)];
    poli(ctx, p, "#0b0712", "rgba(0,0,0,0.6)");
    const fresta = [P3(w.a, w.z0), P3(w.a + (w.b - w.a) * 0.2, w.z0), P3(w.a + (w.b - w.a) * 0.2, w.z1), P3(w.a, w.z1)];
    poli(ctx, fresta, "rgba(255,200,120,0.55)");
  }

  // Espelho desenhado (sem imagem): moldura de aço, vidro claro e faixas de reflexo na diagonal.
  function espelho(ctx, w) {
    const P3 = (u, z) => (w.plano === "x0" ? T(0, u, z) : T(u, 0, z));
    const m = 0.05;
    poli(ctx, [P3(w.a, w.z0), P3(w.b, w.z0), P3(w.b, w.z1), P3(w.a, w.z1)], "#8d8f96", "rgba(0,0,0,0.5)");
    const vidro = [P3(w.a + m, w.z0 + m), P3(w.b - m, w.z0 + m), P3(w.b - m, w.z1 - m), P3(w.a + m, w.z1 - m)];
    const g = ctx.createLinearGradient(vidro[0][0], vidro[2][1], vidro[2][0], vidro[0][1]);
    g.addColorStop(0, "#5d6b78"); g.addColorStop(0.5, "#9fb0bd"); g.addColorStop(1, "#6c7a87");
    poli(ctx, vidro, g);
    ctx.save();
    ctx.beginPath(); vidro.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    const L = w.b - w.a, H = w.z1 - w.z0;
    for (const [u, larg] of [[0.25, 0.12], [0.45, 0.05], [0.7, 0.09]]) { // reflexos inclinados
      const a = w.a + L * u;
      poli(ctx, [P3(a, w.z0), P3(a + L * larg, w.z0), P3(a + L * larg + L * 0.35, w.z0 + H), P3(a + L * 0.35, w.z0 + H)], "rgba(255,255,255,0.18)");
    }
    ctx.restore();
  }

  function quadParede(ctx, w) {
    if (w.saida && porta.aberta) { portaAbertaDesenho(ctx, w); return; }
    if (w.soSemTextura && imgProps[TEXTURA_PAREDE]) return; // a textura da parede já desenha isso
    if (decalque(ctx, w)) return;
    if (w.tipo === "espelho") { espelho(ctx, w); return; }
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
      const linhas = w.texto || ["MAIS UMA", "NOITE?"];
      ctx.fillText(linhas[0], 0, -6); if (linhas[1]) ctx.fillText(linhas[1], 0, 16); ctx.restore();
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
  function texturaFace(ctx, eixo, fixo, a, b, h, escurecer, origem) {
    const info = props && props.props[TEXTURA_PAREDE], tex = imgProps[TEXTURA_PAREDE];
    if (!tex || !info) return;
    const P3 = (u, z) => (eixo === "x" ? T(u, fixo, z) : T(fixo, u, z));
    const L = info.largura_m, H = info.altura_m;
    ctx.save();
    const contorno = [P3(a, 0), P3(b, 0), P3(b, h), P3(a, h)];
    ctx.beginPath(); contorno.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath();
    ctx.clip();
    const u0 = origem === undefined ? a : origem + Math.floor((a - origem) / L) * L; // pedaços seguem o desenho
    for (let u = u0; u < b - 1e-6; u += L) {
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

  function toalha(ctx, c) {
    const m = 0.04, z1 = c.z1 + 0.01, z0 = c.toalhaAte != null ? c.toalhaAte : 0.12;
    const cor = c.toalha, x0 = c.x0 - m, x1 = c.x1 + m, y0 = c.y0 - m, y1 = c.y1 + m;
    const faceY = (a, b) => [T(a, y1, z1), T(b, y1, z1), T(b, y1, z0), T(a, y1, z0)];
    const faceX = (a, b) => [T(x1, a, z1), T(x1, b, z1), T(x1, b, z0), T(x1, a, z0)];
    poli(ctx, faceY(x0, x1), cor, "rgba(0,0,0,0.35)");
    poli(ctx, faceX(y0, y1), cor, "rgba(0,0,0,0.35)");
    poli(ctx, faceX(y0, y1), "rgba(0,0,0,0.16)");              // lado na sombra
    // pregas e barra
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 2;
    for (let x = x0 + 0.2; x < x1; x += 0.2) { const [a, b] = [T(x, y1, z1 - 0.05), T(x, y1, z0 + 0.02)]; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    for (let y = y0 + 0.2; y < y1; y += 0.2) { const [a, b] = [T(x1, y, z1 - 0.05), T(x1, y, z0 + 0.02)]; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 3;
    ctx.beginPath(); [T(x0, y1, z0 + 0.04), T(x1, y1, z0 + 0.04), T(x1, y0, z0 + 0.04)].forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
    ctx.restore();
    // tampo: a toalha aparece só na beirada (a arte da mesa, com xícaras, continua por cima)
    poli(ctx, [T(x0, y1 - 0.08, z1), T(x1 - 0.08, y1 - 0.08, z1), T(x1 - 0.08, y0, z1), T(x1, y0, z1), T(x1, y1, z1), T(x0, y1, z1)], cor);
  }

  function caixa(ctx, c) {
    if (c.toalha) { if (!arte(ctx, c)) caixaBloco(ctx, c); toalha(ctx, c); return; }
    if (arte(ctx, c)) return;
    caixaBloco(ctx, c);
  }
  function caixaBloco(ctx, c) {
    const [cTopo, cEsq, cDir] = c.cor || CORES[c.tipo] || CORES.movel; // c.cor: [topo, esquerda, direita] próprios
    const z = c.z1, linha = c.pedaco ? null : "rgba(0,0,0,0.45)"; // pedaço de parede: sem linha na emenda
    // pedaço do meio de uma parede: a "tampa" que encosta no pedaço seguinte fica escondida — não desenha
    // (com a parede transparente, ela apareceria como uma listra)
    const faceEsq = !c.grupo || c.y1 >= c.grupo.y1 - 1e-9, faceDir = !c.grupo || c.x1 >= c.grupo.x1 - 1e-9;
    // faces visíveis: frente-esquerda (y = y1), frente-direita (x = x1), topo
    if (faceEsq) poli(ctx, [T(c.x0, c.y1, 0), T(c.x1, c.y1, 0), T(c.x1, c.y1, z), T(c.x0, c.y1, z)], cEsq, linha);
    if (faceDir) poli(ctx, [T(c.x1, c.y0, 0), T(c.x1, c.y1, 0), T(c.x1, c.y1, z), T(c.x1, c.y0, z)], cDir, linha);
    poli(ctx, [T(c.x0, c.y0, z), T(c.x1, c.y0, z), T(c.x1, c.y1, z), T(c.x0, c.y1, z)], cTopo, linha);
    if (c.tipo === "parede") { // as duas faces que dão para a câmera recebem a textura (a esquerda mais escura)
      if (faceEsq) texturaFace(ctx, "x", c.y1, c.x0, c.x1, z, 0.22, c.origemX);
      if (faceDir) texturaFace(ctx, "y", c.x1, c.y0, c.y1, z, 0, c.origemY);
    }
  }

  // Paredes compridas (mureta entre os cômodos, paredes da frente) viram pedaços de até 0,5 m SÓ para desenhar:
  // uma caixa comprida não tem uma ordem certa com o personagem e os móveis em volta (às vezes ficava por
  // cima do armário). A colisão continua usando a parede inteira.
  const PEDACO = 0.5;
  const ITENS_FIXOS = [];
  for (const c of P.caixas) {
    if (c.fundo || c.oculto) continue;
    const longoX = c.x1 - c.x0, longoY = c.y1 - c.y0;
    if (c.tipo !== "parede" || Math.max(longoX, longoY) <= PEDACO * 1.5) { ITENS_FIXOS.push(Object.assign({ desenho: "caixa", orig: c }, c)); continue; }
    const eixoX = longoX >= longoY, ini = eixoX ? c.x0 : c.y0, fim = eixoX ? c.x1 : c.y1;
    const n = Math.ceil((fim - ini) / PEDACO);
    for (let k = 0; k < n; k++) {
      const a = ini + (fim - ini) * k / n, b = ini + (fim - ini) * (k + 1) / n;
      ITENS_FIXOS.push(Object.assign({ desenho: "caixa", pedaco: true, grupo: c, origemX: c.x0, origemY: c.y0 }, c,
        eixoX ? { x0: a, x1: b } : { y0: a, y1: b }));
    }
  }

  // Parede na frente do personagem fica transparente (dá para vê-lo atrás da mureta).
  function cobreJogador(c) {
    const pts = [];
    for (const x of [c.x0, c.x1]) for (const y of [c.y0, c.y1]) for (const z of [0, c.z1]) pts.push(T(x, y, z));
    const [jx, jy] = T(jog.x, jog.y, 0);
    const minX = Math.min(...pts.map((q) => q[0])), maxX = Math.max(...pts.map((q) => q[0]));
    const minY = Math.min(...pts.map((q) => q[1])), maxY = Math.max(...pts.map((q) => q[1]));
    return jx + 40 > minX && jx - 40 < maxX && jy > minY && jy - ALTURA_PERSONAGEM < maxY;
  }

  function desenharJogador(ctx) {
    const ef = quadroEfeito(performance.now());
    if (jog.oculto && !ef) return;
    if (jog.semCorpo) return; // o mapa desenha outra imagem no lugar dele (ex.: de tarja, no encontro)
    if (conjunto === MODULAR && heroi) { desenharModular(ctx, ef); return; }
    // conjunto de quadros: a tira de andar; fora dela, a tira da pose da cena (celular, bigode, dançar...), sentado ou
    // parado, quando o conjunto tem (senão, o 1º quadro de andar)
    const fAndar = manifesto.conjuntos[conjunto][jog.dir];
    const extra = (jog.pose && fAndar[jog.pose]) || (jog.sentado && fAndar.sentado) || (!jog.andando && fAndar.parado);
    const f = extra && !(jog.andando && !jog.pose) ? extra : fAndar, im = folhas[f.folha];
    const q = f === fAndar ? quadroSprite(f) : Math.floor(performance.now() / 1000 * f.fps) % f.quadros;
    const px = f.pes[0], py = f.pes[1];
    let [x, y] = T(jog.x, jog.y, 0);
    const e = ALTURA_PERSONAGEM / (f.altura_px || manifesto.altura_personagem_px || 128);
    const sentadoSprite = f === fAndar.sentado; // sentado de verdade (o quadril já está na altura do assento)
    if (sentadoSprite) { // afunda no assento (como o modular): de lado as pernas vão para fora, por cima da beirada
      const k = y - T(jog.x, jog.y, 1)[1], lado = jog.dir === "esquerda" || jog.dir === "direita";
      y += k * (lado ? SENTA_LADO : SENTA_FRENTE);
    }
    const meio = y - ALTURA_PERSONAGEM * 0.5; // o "clique" fecha no meio do corpo
    ctx.save();
    if (sentadoSprite && (jog.dir === "esquerda" || jog.dir === "cima")) {
      // de costas para a câmera: o encosto do assento fica na frente dele e esconde do quadril para baixo
      const corte = T(jog.x, jog.y, SENTA_ENCOSTO)[1];
      ctx.beginPath(); ctx.rect(x - 400, corte - 2000, 800, 2000); ctx.clip();
    }
    if (!sentadoSprite) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath(); ctx.ellipse(x, y, 46 * (ef ? Math.min(1, ef.sx) : 1), 13, 0, 0, 2 * Math.PI); ctx.fill();
    }
    if (ef) { ctx.translate(x, meio); ctx.scale(ef.sx, ef.sy); ctx.translate(-x, -meio); }
    // folha em alta resolução reduzida: suavizar (sem serrilhado); folha em pixel art ("pixelado"): blocos nítidos
    ctx.imageSmoothingEnabled = !f.pixelado;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(im, q * f.larg, 0, f.larg, f.alt, x - px * e, y - py * e, f.larg * e, f.alt * e);
    ctx.restore();
    if (ef && ef.brilho > 0) linhaDeLuz(ctx, x, meio, ef);
  }
  function linhaDeLuz(ctx, x, meio, ef) { // linha de luz rosa-branca onde ele some/aparece
    const larg = 70 * Math.max(ef.sx, 0.12) + 14, alt = 4 + 12 * ef.brilho;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(x, meio, 0, x, meio, larg);
    g.addColorStop(0, "rgba(255,255,255," + ef.brilho + ")");
    g.addColorStop(0.35, "rgba(255,120,230," + 0.8 * ef.brilho + ")");
    g.addColorStop(1, "rgba(255,90,216,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, meio, larg, alt, 0, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255," + ef.brilho + ")";
    ctx.fillRect(x - larg * 0.7, meio - 1.5, larg * 1.4, 3);
    ctx.restore();
  }

  // Protagonista modular: mesma sombra, mesmo "clique" de sumir/aparecer, animação andar/parado.
  function desenharModular(ctx, ef) {
    const agora = performance.now();
    const dt = heroiRelogio ? Math.min(0.1, (agora - heroiRelogio) / 1000) : 0;
    heroiRelogio = agora;
    heroi.definirVista(VISTA_MOD[jog.dir] || "frente");
    // pose da cena (ex.: olhando o celular no elevador) ou andar/parado
    const lado = heroi.vista.startsWith("lado");
    if (jog.sentado) criarPoseSentada(heroi);
    heroi.tocar(jog.pose && heroi.animacoes[jog.pose] ? jog.pose
      : jog.sentado ? (lado ? "sentado" : "parado") : jog.andando ? "andar" : "parado");
    heroi.atualizar(dt);
    let [x, y] = T(jog.x, jog.y, 0);
    const meio = y - ALTURA_PERSONAGEM * 0.5;
    ctx.save();
    if (jog.sentado) {
      const k = y - T(jog.x, jog.y, 1)[1];
      if (!lado) { // de frente/costas: o assento esconde as pernas
        const corte = T(jog.x, jog.y, 0.47)[1] + 6;
        ctx.beginPath(); ctx.rect(x - 400, corte - 2000, 800, 2000); ctx.clip();
      }
      y += k * (lado ? 0.22 : 0.3);
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath(); ctx.ellipse(x, y, 46 * (ef ? Math.min(1, ef.sx) : 1), 13, 0, 0, 2 * Math.PI); ctx.fill();
    }
    if (ef) { ctx.translate(x, meio); ctx.scale(ef.sx, ef.sy); ctx.translate(-x, -meio); }
    heroi.desenhar(ctx, x, y, ALTURA_PERSONAGEM / ALTURA_MOD);
    ctx.restore();
    if (ef && ef.brilho > 0) linhaDeLuz(ctx, x, meio, ef);
  }

  // Boneco provisório: sombra, pernas (em pé), tronco, braços, cabeça, cabelo e olhos virados para "dir".
  // Escala igual à do mapa (1 m de altura = px de ISO.tela). Só até chegar a arte de cada personagem.
  function desenharNpc(ctx, n) {
    if (n.oculta) return; // ainda não entrou em cena
    if (n.modular) { desenharNpcModular(ctx, n); return; }
    const v = n.visual || {}, sentado = n.postura === "sentado";
    const [fx, fy] = T(n.x, n.y, 0), k = fy - T(n.x, n.y, 1)[1];
    const Z = (z) => fy - z * k;
    const contorno = "rgba(12,6,20,0.6)";
    const ret = (x, yBase, w, yTopo, cor, raio) => {
      ctx.beginPath(); ctx.roundRect(x, yTopo, w, yBase - yTopo, raio || 4);
      ctx.fillStyle = cor; ctx.fill(); ctx.strokeStyle = contorno; ctx.lineWidth = 2; ctx.stroke();
    };
    const t0 = sentado ? 0.45 : 0.85, t1 = t0 + 0.55, cab = t1 + 0.17, r = 17;
    const lado = n.dir === "direita" ? 1 : n.dir === "esquerda" ? -1 : 0;
    ctx.save();
    if (!sentado) {
      ctx.fillStyle = "rgba(0,0,0,0.33)";
      ctx.beginPath(); ctx.ellipse(fx, fy, 30, 9, 0, 0, 2 * Math.PI); ctx.fill();
      ret(fx - 15, Z(0.04), 12, Z(t0), v.calca || "#333", 3);
      ret(fx + 3, Z(0.04), 12, Z(t0), v.calca || "#333", 3);
    }
    if (v.estilo === "longo") ret(fx - r - 3, Z(t1 - 0.22), 2 * r + 6, Z(cab + 0.1), v.cabelo, 10); // cabelo atrás
    if (v.estilo === "volume") {
      ctx.beginPath(); ctx.arc(fx, Z(cab) - 3, r + 9, 0, 2 * Math.PI);
      ctx.fillStyle = v.cabelo; ctx.fill(); ctx.strokeStyle = contorno; ctx.lineWidth = 2; ctx.stroke();
    }
    ret(fx - 28, Z(t0 + 0.08), 9, Z(t1 - 0.04), v.roupa, 4);         // braços
    ret(fx + 19, Z(t0 + 0.08), 9, Z(t1 - 0.04), v.roupa, 4);
    ret(fx - 20, Z(t0), 40, Z(t1), v.roupa, 8);                       // tronco
    if (v.avental) ret(fx - 15, Z(t0 - (sentado ? 0 : 0.25)), 30, Z(t1 - 0.25), v.avental, 3);
    ctx.fillStyle = v.pele;
    for (const hx of [fx - 23.5, fx + 23.5]) { ctx.beginPath(); ctx.arc(hx, Z(t0 + 0.06), 5, 0, 2 * Math.PI); ctx.fill(); }
    // cabeça
    const hy = Z(cab);
    if (v.estilo === "coque") { // coque no alto da cabeça
      ctx.beginPath(); ctx.arc(fx, hy - r - 3, 9, 0, 2 * Math.PI);
      ctx.fillStyle = v.cabelo; ctx.fill(); ctx.strokeStyle = contorno; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(fx, hy, r, 0, 2 * Math.PI);
    ctx.fillStyle = n.dir === "cima" && v.estilo !== "careca_barba" ? v.cabelo : v.pele;
    ctx.fill(); ctx.strokeStyle = contorno; ctx.lineWidth = 2; ctx.stroke();
    if (n.dir !== "cima") {
      ctx.fillStyle = v.cabelo;
      if (v.estilo === "curto" || v.estilo === "longo" || v.estilo === "coque") {
        ctx.beginPath(); ctx.arc(fx, hy - 2, r + 1, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill();
      }
      if (v.estilo === "careca_barba") {
        ctx.beginPath(); ctx.arc(fx + lado * 3, hy + 3, r - 2, Math.PI * 0.05, Math.PI * 0.95); ctx.closePath(); ctx.fill();
      }
      if (v.estilo === "bone") {
        ctx.fillStyle = "#1c2a44";
        ctx.beginPath(); ctx.arc(fx, hy - 3, r + 1, Math.PI, 2 * Math.PI); ctx.closePath(); ctx.fill();
        ctx.fillRect(fx - 8 + lado * 12, hy - 6, 22, 5);
      }
      ctx.fillStyle = "#1a1020"; // olhos
      for (const ox of [-6, 6]) { ctx.beginPath(); ctx.arc(fx + ox + lado * 5, hy + 1, 2.2, 0, 2 * Math.PI); ctx.fill(); }
    }
    ctx.restore();
  }

  // Sinal "…" sobre quem tem conversa, e o balão de fala de quem só comenta.
  // Ondinhas de voz saindo da boca de quem está falando agora (voz gravada tocando ao vivo, sem balão):
  // ")))" para o lado em que a pessoa olha (de frente/costas: dos dois lados), fora do rosto.
  function ondasDeFala(ctx, x, y, k, agora, lados) {
    ctx.save();
    ctx.lineCap = "round";
    for (const lado of lados) {
      const cx = x + lado * 0.2 * k;
      for (let i = 0; i < 3; i++) {
        const fase = ((agora / 420) + i / 3) % 1, r = 0.07 * k + fase * 0.26 * k;
        const a0 = lado > 0 ? -0.75 : Math.PI - 0.75, a1 = a0 + 1.5;
        ctx.globalAlpha = 1 - fase;
        ctx.strokeStyle = "rgba(20,10,30,0.8)"; ctx.lineWidth = 6.5;
        ctx.beginPath(); ctx.arc(cx, y, r, a0, a1); ctx.stroke();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(cx, y, r, a0, a1); ctx.stroke();
      }
    }
    ctx.restore();
  }
  const ladosDaFala = (vista) => (vista === "lado_direito" ? [1] : vista === "lado_esquerdo" ? [-1] : [-1, 1]);
  function desenharFalandoAgora(ctx, agora) {
    for (const n of NPCS) {
      if (n.oculta || !n.falandoAte || agora > n.falandoAte) continue;
      const [x, y0] = T(n.x, n.y, 0), k = y0 - T(n.x, n.y, 1)[1];
      const vista = n.modular ? n.modular.vista : n.dir === "direita" ? "lado_direito" : n.dir === "esquerda" ? "lado_esquerdo" : "frente";
      ondasDeFala(ctx, x, y0 - (alturaNpc(n) - 0.32) * k, k, agora, ladosDaFala(vista));
    }
    if (jog.falandoAte && agora < jog.falandoAte && !jog.oculto) {
      const [x, y0] = T(jog.x, jog.y, 0), k = y0 - T(jog.x, jog.y, 1)[1];
      ondasDeFala(ctx, x, y0 - 1.48 * k, k, agora, ladosDaFala(heroi ? heroi.vista : "frente"));
    }
  }
  function desenharSinaisNpc(ctx, agora) {
    for (const n of NPCS) {
      if (n.oculta) continue;
      const [x, y] = T(n.x, n.y, alturaNpc(n) + 0.25);
      if (n.balao && agora > n.balao.ate) n.balao = null;
      if (n.balao) {
        ctx.save();
        ctx.font = "600 15px system-ui, sans-serif";
        const w = Math.min(260, ctx.measureText(n.balao.texto).width + 20);
        const linhas = quebrar(ctx, n.balao.texto, w - 20), h = 10 + linhas.length * 19;
        ctx.fillStyle = "rgba(22,13,36,0.95)"; ctx.strokeStyle = "#cdbdf0"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(x - w / 2, y - h - 12, w, h, 10); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 7, y - 13); ctx.lineTo(x, y - 3); ctx.lineTo(x + 7, y - 13); ctx.fill();
        ctx.fillStyle = "#f3ecff"; ctx.textAlign = "center";
        linhas.forEach((l, i) => ctx.fillText(l, x, y - h - 12 + 23 + i * 19));
        ctx.restore();
      } else if (n.interagir === false) { // só faz parte da cena: sem marca em cima
      } else if (n.paquera) { // dá para paquerar: coração pulando (ou o resultado de hoje)
        const r = NSF.Paquera && NSF.Paquera.resultado(n);
        const b = Math.sin(agora / 260 + n.x) * 3, icone = r === "topou" ? "💕" : r ? "💔" : "♥";
        ctx.save();
        ctx.fillStyle = "#16101f"; ctx.strokeStyle = r ? "#7a6a99" : "#ff5ad8"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.roundRect(x - 18, y - 32 + b, 36, 26, 10); ctx.fill(); ctx.stroke();
        ctx.font = "18px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "#ff4f8b"; ctx.fillText(icone, x, y - 19 + b);
        ctx.restore();
      } else if (n.dialogo || n.fala) { // dá para conversar: "..." pulando em cima
        const b = Math.sin(agora / 260) * 3;
        ctx.save();
        ctx.fillStyle = "#16101f"; ctx.strokeStyle = "#ff5ad8"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.roundRect(x - 18, y - 30 + b, 36, 22, 9); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ff9be9";
        for (const ox of [-8, 0, 8]) { ctx.beginPath(); ctx.arc(x + ox, y - 19 + b, 2.6, 0, 2 * Math.PI); ctx.fill(); }
        ctx.restore();
      }
    }
  }
  function quebrar(ctx, texto, largura) {
    const linhas = [];
    let atual = "";
    for (const p of texto.split(" ")) {
      const t = atual ? atual + " " + p : p;
      if (ctx.measureText(t).width > largura && atual) { linhas.push(atual); atual = p; } else atual = t;
    }
    if (atual) linhas.push(atual);
    return linhas;
  }

  // Enfeites em cima de um móvel: { tipo: cerveja|latinha|copo|churrasco, dx, dy } (metros a partir do canto x0, y0).
  function desenharEnfeites(ctx, c) {
    for (const e of c.enfeites) {
      // com arte pronta (props.json: enfeite_<tipo>), a imagem fica centrada no ponto, em cima do móvel
      const nomeArte = "enfeite_" + e.tipo, info = props && props.props[nomeArte], im = imgProps[nomeArte];
      if (info && im) {
        const [w, d] = info.tamanho_m, [ax, ay] = T(c.x0 + e.dx - w / 2, c.y0 + e.dy - d / 2, c.z1), k = info.escala;
        ctx.drawImage(im, ax - info.origem_px[0] / k, ay - info.origem_px[1] / k, im.width / k, im.height / k);
        continue;
      }
      const [x, y] = T(c.x0 + e.dx, c.y0 + e.dy, c.z1);
      const k = y - T(c.x0 + e.dx, c.y0 + e.dy, c.z1 + 1)[1]; // px por metro na vertical
      ctx.save();
      ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(15,8,4,0.85)";
      if (e.tipo === "cerveja") { // garrafa âmbar com rótulo
        const h = 0.27 * k, w = 7;
        ctx.fillStyle = "#7a4310"; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h * 0.62, w, h * 0.62, 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(x - 2, y - h, 4, h * 0.4, 1); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#f2e6c9"; ctx.fillRect(x - w / 2 + 1, y - h * 0.45, w - 2, h * 0.18);
        ctx.fillStyle = "rgba(255,230,170,0.6)"; ctx.fillRect(x - w / 2 + 1, y - h * 0.6, 1.5, h * 0.5);
      } else if (e.tipo === "vinho") { // garrafa verde-escura com rótulo vinho
        const h = 0.32 * k, w = 7;
        ctx.fillStyle = "#1f3a26"; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h * 0.65, w, h * 0.65, 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(x - 2, y - h, 4, h * 0.38, 1); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#6d1a2a"; ctx.fillRect(x - 2, y - h, 4, 4);
        ctx.fillStyle = "#e9dcc0"; ctx.fillRect(x - w / 2 + 1, y - h * 0.45, w - 2, h * 0.2);
      } else if (e.tipo === "taca") { // taça com um pouco de vinho
        const h = 0.16 * k;
        ctx.strokeStyle = "rgba(230,230,240,0.9)";
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h * 0.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.stroke();
        ctx.fillStyle = "rgba(220,225,235,0.35)"; ctx.beginPath(); ctx.ellipse(x, y - h * 0.75, 4.5, h * 0.27, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#7a1830"; ctx.beginPath(); ctx.ellipse(x, y - h * 0.68, 3.5, h * 0.15, 0, 0, 7); ctx.fill();
      } else if (e.tipo === "latinha") {
        const h = 0.12 * k, w = 7;
        ctx.fillStyle = e.cor || "#c8102e"; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#d9d9de"; ctx.fillRect(x - w / 2 + 1, y - h + 1, w - 2, 2);
      } else if (e.tipo === "copo") { // copo americano de cerveja com espuma
        const h = 0.1 * k, w = 7;
        ctx.fillStyle = "#e8a620"; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h, 1); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#fbf6e8"; ctx.fillRect(x - w / 2, y - h, w, 3);
      } else if (e.tipo === "churrasco") { // tábua com picanha fatiada
        const a = T(c.x0 + e.dx - 0.22, c.y0 + e.dy - 0.14, c.z1), b = T(c.x0 + e.dx + 0.22, c.y0 + e.dy - 0.14, c.z1);
        const cc = T(c.x0 + e.dx + 0.22, c.y0 + e.dy + 0.14, c.z1), d = T(c.x0 + e.dx - 0.22, c.y0 + e.dy + 0.14, c.z1);
        ctx.fillStyle = "#9a6a3a"; ctx.beginPath(); [a, b, cc, d].forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill(); ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const [sx, sy] = T(c.x0 + e.dx - 0.14 + i * 0.07, c.y0 + e.dy, c.z1 + 0.02);
          ctx.fillStyle = i % 2 ? "#8c2f22" : "#a8452f"; ctx.beginPath(); ctx.ellipse(sx, sy - 2, 5, 3.5, 0, 0, 7); ctx.fill();
          ctx.fillStyle = "#f0d9b5"; ctx.fillRect(sx - 4, sy - 5, 8, 1.5); // capa de gordura
        }
      }
      ctx.restore();
    }
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
    const ev = NSF.escalaParaTela(canvas.width, canvas.height, CONFIG.larguraBase, CONFIG.alturaBase);
    ultimaVista = { escala: ev.escala, dx: ev.dx, dy: ev.dy, z };
    ctx.save();
    ctx.scale(z, z);
    posicionarCamera(CONFIG.larguraBase / z, CONFIG.alturaBase / z);

    desenharPiso(ctx);
    if (P.aoDesenharPiso) P.aoDesenharPiso(ctx, T, agora); // efeitos no chão, por baixo de tudo (ex.: luzes da pista)
    // paredes do fundo (altas) e o que está nelas
    for (const c of P.caixas.filter((k) => k.fundo)) caixa(ctx, c);
    for (const w of P.naParede) quadParede(ctx, w);

    // móveis, paredes cortadas e o personagem, na ordem de profundidade
    const itens = ITENS_FIXOS.slice();
    itens.push({ desenho: "jogador", x0: jog.x - 0.05, y0: jog.y - 0.05, x1: jog.x + 0.05, y1: jog.y + 0.05 });
    for (const n of NPCS) if (n.postura !== "sentado") itens.push({ desenho: "npc", npc: n, x0: n.x - 0.05, y0: n.y - 0.05, x1: n.x + 0.05, y1: n.y + 0.05 });
    const ordem = ISO.ordenar(itens);
    // paredes (inteiras, não só o pedaço) desenhadas depois do personagem e na frente dele ficam transparentes
    const iJog = ordem.findIndex((it) => it.desenho === "jogador"), vazadas = new Set();
    if (!jog.oculto) {
      for (let k = iJog + 1; k < ordem.length; k++) {
        const it = ordem[k];
        if (it.tipo === "parede" && it.z1 > 0.6 && cobreJogador(it)) vazadas.add(it.grupo || it);
      }
    }
    for (const it of ordem) {
      if (it.desenho === "jogador") desenharJogador(ctx);
      else if (it.desenho === "npc") desenharNpc(ctx, it.npc);
      else {
        const transparente = vazadas.has(it.grupo || it);
        if (transparente) { ctx.save(); ctx.globalAlpha = 0.4; }
        caixa(ctx, it);
        if (transparente) ctx.restore();
        const ocupante = it.orig ? it.orig.ocupante : it.ocupante; // quem senta depois (encontro) também aparece
        if (ocupante) desenharNpc(ctx, ocupante);
        if (it.enfeites) desenharEnfeites(ctx, it);
      }
    }
    desenharSinaisNpc(ctx, agora);
    desenharFalandoAgora(ctx, agora);
    desenharInterativos(ctx, agora);
    desenharBalaoJog(ctx, agora);
    if (avisoObjeto && agora < avisoObjeto.ate) {
      const o = avisoObjeto.c;
      rotulo(ctx, avisoObjeto.texto, (o.x0 + o.x1) / 2, (o.y0 + o.y1) / 2, o.z1 + 0.5);
    }
    const dtNpc = npcRelogio ? Math.min(0.1, (agora - npcRelogio) / 1000) : 0;
    npcRelogio = agora;
    for (const n of NPCS) if (n.modular) n.modular.atualizar(dtNpc);
    if (P.aoDesenhar) P.aoDesenhar(ctx, T, agora);

    if (destinoToque) { // marcador no chão onde o jogador tocou
      const [mx, my] = T(destinoToque.x, destinoToque.y, 0), p = 0.6 + 0.4 * Math.sin(agora / 150);
      ctx.save();
      ctx.strokeStyle = "rgba(255,90,216," + p + ")"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(mx, my, 26, 13, 0, 0, 2 * Math.PI); ctx.stroke();
      ctx.restore();
    }
    if (ligacao.tocando) {
      const cm = P.caixas.find((c) => c.nome === "Criado-mudo");
      if (cm) {
        const [tx, ty] = T((cm.x0 + cm.x1) / 2, (cm.y0 + cm.y1) / 2, cm.z1 + 0.5);
        ligacao.icone = [tx, ty];
        // celular desenhado (sem emoji: nem todo aparelho tem a fonte), vibrando, com ondas de toque
        const v = Math.sin(agora / 40) * 3;
        ctx.save();
        ctx.translate(tx + v, ty);
        ctx.fillStyle = "#16101f"; ctx.strokeStyle = "#ff5ad8"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(-13, -24, 26, 46, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#59d6ff"; ctx.fillRect(-9, -18, 18, 30);
        ctx.strokeStyle = "rgba(255,90,216," + (0.5 + 0.5 * Math.sin(agora / 120)) + ")"; ctx.lineWidth = 3;
        for (const r of [22, 32]) {
          ctx.beginPath(); ctx.arc(0, 0, r, -0.6, 0.6); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, r, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
        }
        ctx.restore();
      }
    }
    if (mostrarNomes) {
      for (const c of P.caixas) if (c.nome && !c.oculto) rotulo(ctx, c.nome, (c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, c.z1);
      for (const w of P.naParede) {
        const m = (w.a + w.b) / 2;
        if (w.tipo !== "led" && w.tipo !== "cimento") rotulo(ctx, w.nome, w.plano === "x0" ? 0 : m, w.plano === "x0" ? m : 0, w.z1 + 0.15);
      }
      for (const c of P.comodos) rotulo(ctx, c.nome.toUpperCase(), c.x1 - 0.6, c.y1 - 0.4, 0);
      for (const n of NPCS) rotulo(ctx, n.nome, n.x, n.y, alturaNpc(n) + 0.75);
    }
    ctx.restore();
  }

  // Baixa só as folhas de um conjunto (no celular, carregar os 3 conjuntos de uma vez pesaria ~6 MB).
  function carregarConjunto(nome) {
    if (nome === MODULAR) return carregarModular();
    // a tira de andar e todas as tiras extras de cada direção (parado, sentado, celular, dançar, deitado...)
    const arquivos = Object.values(manifesto.conjuntos[nome])
      .flatMap((f) => [f.folha, ...Object.values(f).filter((x) => x && x.folha).map((x) => x.folha)])
      .filter((a, i, l) => a && !folhas[a] && l.indexOf(a) === i);
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
      ...P.comodos.map((c) => c.piso_arte), ...(P.artesExtras || []),
      ...P.caixas.flatMap((c) => (c.enfeites || []).map((e) => "enfeite_" + e.tipo))].filter(Boolean)); // arte das cervejas, churrasco...
    return Promise.all([...usadas].filter((n) => cat.props[n]).map((n) => new Promise((ok) => {
      const im = new Image();
      im.onload = () => { imgProps[n] = im; ok(); };
      im.onerror = () => { estado.erros.push("peça não carregou: " + n); ok(); };
      im.src = PASTA_PROPS + cat.props[n].arquivo;
    }))).then(() => { props = cat; });
  }).catch(() => { /* sem catálogo: continua com as caixas em blocos */ });

  fetch(PASTA_SPR + "jogo.json").then((r) => r.json()).then((j) => {
    manifesto = j;
    const valido = (n) => n && (j.conjuntos[n] || n === MODULAR);
    // o modular é o protagonista; as folhas antigas continuam no botão Sprites
    const pedido = valido(params.get("conjunto")) ? params.get("conjunto") : valido(pref.ler("nsf_conjunto")) ? pref.ler("nsf_conjunto") : MODULAR;
    if (params.get("conjunto") === pedido) pref.gravar("nsf_conjunto", pedido); // escolhido pelo link (tester): vale nas outras telas
    return carregarConjunto(pedido).then(() => { conjunto = pedido; });
  }).then(() => {
    // toca quando ele acorda no quarto (não toda vez que volta para casa)
    if (ROTEIRO_LIGACAO && comodo === "quarto" && !params.has("semligacao")) agendarLigacao(ROTEIRO_LIGACAO.toque_segundos || 4);
    marcar(); window.NSF_APTO = { ligacao, telefoneToca, atenderTelefone, irPara, telaParaMundo, porta, irParaPorta, retanguloPorta, planta: P, efeito, sair, interagir, PORTA, veiculos: VEICULOS, irAoVeiculo, irPara,
      falar, pensar, sentar, levantar, cortinaCom, imgProps, ocupado,
      poseSentada: criarPoseSentada, VISTA_MOD,
      abrirArmario, get heroi() { return heroi; },
      // personagem em quadros (ex.: o 3D): a tira de uma pose e como desenhá-la (a cama usa o "deitado")
      poseConjunto(nome, dir) {
        if (conjunto === MODULAR || !manifesto) return null;
        const c = manifesto.conjuntos[conjunto], f = c && (c[dir || "baixo"] || {})[nome];
        return f && folhas[f.folha] ? f : null;
      },
      desenharTira(ctx, f, x, y, agora) {
        const im = folhas[f.folha], q = Math.floor((agora || performance.now()) / 1000 * f.fps) % f.quadros;
        const e = ALTURA_PERSONAGEM / (f.altura_px || 128);
        ctx.save();
        ctx.imageSmoothingEnabled = !f.pixelado;
        ctx.drawImage(im, q * f.larg, 0, f.larg, f.alt, x - f.pes[0] * e, y - f.pes[1] * e, f.larg * e, f.alt * e);
        ctx.restore();
      },
      get conjunto() { return conjunto; },
      ajusteSentar(l, fr, enc) { SENTA_LADO = l; SENTA_FRENTE = fr; if (enc != null) SENTA_ENCOSTO = enc; }, // conferência
      trocarConjunto(nome) { // looks do personagem em quadros (guarda-roupa do 3D)
        return carregarConjunto(nome).then(() => { conjunto = nome; pref.gravar("nsf_conjunto", nome); marcar(); });
      },
      // troca a roupa toda (fica guardada para as outras telas); acessórios (celular na mão) continuam
      vestirRoupas(ids) {
        heroi.vestidas = heroi.vestidas.filter((r) => heroi.roupas[r] && heroi.roupas[r].acessorio);
        for (const id of ids) if (heroi.roupas[id]) heroi.vestir(id);
        guardarRoupas(); marcar();
      },
      npcs: NPCS, retanguloNpc, irFalarCom, falarCom, desenharNpcModular,
      mundoParaTela(x, y) { // inverso de telaParaMundo (para testes): ponto do mundo -> coordenada do toque
        const v = ultimaVista, r = canvas.getBoundingClientRect(), [lx, ly] = T(x, y, 0);
        return [r.left + (lx * v.z * v.escala + v.dx) * r.width / canvas.width,
                r.top + (ly * v.z * v.escala + v.dy) * r.height / canvas.height];
      },
      get caminho() { return caminho; }, pronto: true, jog, atualizar, teclas, toque, desenhar };
    if (P.aoIniciar) P.aoIniciar(window.NSF_APTO, { chegando: params.has("chegada") || !!efeito.tipo || !!jog.oculto }); })
    .catch((e) => { estado.erros.push(String(e)); console.error(e); });
  NSF.iniciar(canvas, desenhar, { adaptar: true });
})();
