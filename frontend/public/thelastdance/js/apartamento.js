// Cena do APARTAMENTO em blocos (planta para aprovação, FASE 4): piso, paredes, móveis como caixas com nome,
// colisão e o protagonista andando (folhas de caminhada em pixel art, 4 direções). Sem arte final do mapa.
// Funciona no celular: joystick de toque, câmera que segue o personagem quando o mapa não cabe na tela.
// Parâmetros: ?comodo=sala|quarto (onde começa), ?conjunto=video|prancha|recorte_sul+video, ?demo, ?grade.
(function () {
  "use strict";
  const { CONFIG, estado, ISO } = NSF;
  const P = NSF.PLANTA_ATUAL || NSF.PLANTA_APARTAMENTO; // o mapa vem da planta que a página carregou
  const params = new URLSearchParams(location.search);
  const PASTA_SPR = "assets/characters/personagem_v2/pixel/";
  const VEL = 2.2;            // m/s
  const RAIO = 0.22;          // corpo do personagem no chão (m)
  const ALTURA_PERSONAGEM = 173; // px lógicos (≈ 1,73 m na escala do mapa); a escala vem da folha (jogo.json)
  const INICIOS = Object.assign({ inicio: { x: P.inicio.x, y: P.inicio.y } }, P.inicios || {});

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
    const f = frenteDaPorta();
    irPara(f.x, f.y, abrirPorta);
  }
  function abrirPorta() {
    porta.aberta = true;
    jog.dir = PORTA.plano === "x0" ? "esquerda" : "cima";
    mostrarDestinos();
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
  function sair(destino) {
    if (porta.saindo) return;
    porta.saindo = true;
    if (porta.menu) { porta.menu.remove(); porta.menu = null; }
    if (NSF.Audio) NSF.Audio.clique(false);
    efeitoJogador("sumir", 560, () => {
      if (NSF.Audio) NSF.Audio.musica(false);
      const cortina = cortinaCom("Indo para", destino.nome);
      document.body.appendChild(cortina);
      requestAnimationFrame(() => requestAnimationFrame(() => cortina.classList.add("fechada")));
      const url = destino.url + (destino.url.includes("?") ? "&" : "?") + "chegada=1";
      setTimeout(() => { location.href = url; }, 1200);
    });
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
    setTimeout(() => {
      c.classList.remove("sem-transicao", "fechada");
      setTimeout(() => {
        c.remove();
        if (NSF.Audio) NSF.Audio.clique(true);
        efeitoJogador("aparecer", 560, () => setTimeout(() => { porta.aberta = false; }, 350));
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
  const alturaNpc = (n) => (n.postura === "sentado" ? 1.35 : 1.8);
  function retanguloNpc(n) {
    const [bx, by] = T(n.x, n.y, 0), ty = T(n.x, n.y, alturaNpc(n))[1];
    return { x0: bx - 34, x1: bx + 34, y0: ty - 12, y1: by + 6 };
  }
  function npcNoToque(m) { // se dois se sobrepõem na tela, vale o da frente
    let achado = null;
    for (const n of NPCS) {
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
    const roteiro = n.dialogo && NSF.DIALOGOS && NSF.DIALOGOS[n.dialogo];
    if (roteiro && NSF.Ligacao) {
      teclas.clear(); caminho = []; destinoToque = null;
      NSF.Ligacao.atender(roteiro, { aoTerminar: (r) => { n.resultado = r; } });
      return;
    }
    if (n.fala) n.balao = { texto: n.fala, ate: performance.now() + 3500 };
  }

  // Botão direito do mouse = interagir: porta (com área de clique maior), pessoas e celular. Nunca anda.
  function interagir(m) {
    if (ligacao.tocando && ligacao.icone && Math.hypot(m.telaX - ligacao.icone[0], m.telaY - ligacao.icone[1]) < 90) {
      irAtender();
      return;
    }
    const npc = npcNoToque(m);
    if (npc) { irFalarCom(npc); return; }
    const rp = retanguloPorta(), folga = 40;
    if (rp && m.telaX >= rp.x0 - folga && m.telaX <= rp.x1 + folga && m.telaY >= rp.y0 - folga && m.telaY <= rp.y1 + folga) irParaPorta();
  }
  canvas.addEventListener("contextmenu", (e) => e.preventDefault()); // sem o menu do navegador no mapa
  // No computador (mouse), a dica fala de clique e botão direito.
  const dica = document.getElementById("dica");
  if (dica && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    dica.textContent = "Clique no chão para andar · botão direito na porta" + (P.npcs ? " ou nas pessoas" : "") + " para interagir";
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (NSF.Ligacao && NSF.Ligacao.aberta()) return;
    if (porta.menu || porta.saindo || efeito.tipo || jog.oculto) return;
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
    ligacao.tocando = true;   // fica vibrando no criado-mudo até o jogador tocar nele (ou no aviso)
    mostrarAviso(true);
    if (NSF.Audio) NSF.Audio.toque(true);
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
    } });
  }
  function agendarLigacao(segundos) {
    clearTimeout(ligacao.relogio);
    ligacao.relogio = setTimeout(telefoneToca, segundos * 1000);
  }
  const bSom = document.getElementById("som");
  if (bSom) bSom.addEventListener("click", () => {
    const on = NSF.Audio ? NSF.Audio.alternar() : false;
    bSom.textContent = on ? "Som: ligado" : "Som: desligado";
    bSom.setAttribute("aria-pressed", String(on));
  });
  if (NSF.Audio) NSF.Audio.musica(true);
  const bLig = document.getElementById("ligacao");
  if (bLig) bLig.addEventListener("click", () => telefoneToca());

  function atualizar(dt) {
    let sx = 0, sy = 0, wx = 0, wy = 0;
    if (NSF.Ligacao && NSF.Ligacao.aberta()) { jog.andando = false; jog.tempo = 0; return; }
    if (efeito.tipo || jog.oculto) { jog.andando = false; jog.tempo = 0; return; } // sumindo/aparecendo
    const teclando = teclas.size > 0;
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

  function quadParede(ctx, w) {
    if (w.saida && porta.aberta) { portaAbertaDesenho(ctx, w); return; }
    if (w.soSemTextura && imgProps[TEXTURA_PAREDE]) return; // a textura da parede já desenha isso
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
  function texturaFace(ctx, eixo, fixo, a, b, h, escurecer) {
    const info = props && props.props[TEXTURA_PAREDE], tex = imgProps[TEXTURA_PAREDE];
    if (!tex || !info) return;
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
    const ef = quadroEfeito(performance.now());
    if (jog.oculto && !ef) return;
    const f = manifesto.conjuntos[conjunto][jog.dir], im = folhas[f.folha];
    const q = quadroSprite(f), px = f.pes[0], py = f.pes[1];
    const [x, y] = T(jog.x, jog.y, 0);
    const e = ALTURA_PERSONAGEM / (manifesto.altura_personagem_px || 128);
    const meio = y - ALTURA_PERSONAGEM * 0.5; // o "clique" fecha no meio do corpo
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath(); ctx.ellipse(x, y, 46 * (ef ? Math.min(1, ef.sx) : 1), 13, 0, 0, 2 * Math.PI); ctx.fill();
    if (ef) { ctx.translate(x, meio); ctx.scale(ef.sx, ef.sy); ctx.translate(-x, -meio); }
    ctx.imageSmoothingEnabled = true; // folha em alta resolução reduzida: suavizar (sem serrilhado nem blocos)
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(im, q * f.larg, 0, f.larg, f.alt, x - px * e, y - py * e, f.larg * e, f.alt * e);
    ctx.restore();
    if (ef && ef.brilho > 0) { // linha de luz rosa-branca onde ele some/aparece
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
  }

  // Boneco provisório: sombra, pernas (em pé), tronco, braços, cabeça, cabelo e olhos virados para "dir".
  // Escala igual à do mapa (1 m de altura = px de ISO.tela). Só até chegar a arte de cada personagem.
  function desenharNpc(ctx, n) {
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
  function desenharSinaisNpc(ctx, agora) {
    for (const n of NPCS) {
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
      } else if (n.dialogo) {
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
    // paredes do fundo (altas) e o que está nelas
    for (const c of P.caixas.filter((k) => k.fundo)) caixa(ctx, c);
    for (const w of P.naParede) quadParede(ctx, w);

    // móveis, paredes cortadas e o personagem, na ordem de profundidade
    const itens = P.caixas.filter((k) => !k.fundo && !k.oculto).map((c) => Object.assign({ desenho: "caixa" }, c));
    itens.push({ desenho: "jogador", x0: jog.x - 0.05, y0: jog.y - 0.05, x1: jog.x + 0.05, y1: jog.y + 0.05 });
    for (const n of NPCS) if (n.postura !== "sentado") itens.push({ desenho: "npc", npc: n, x0: n.x - 0.05, y0: n.y - 0.05, x1: n.x + 0.05, y1: n.y + 0.05 });
    for (const it of ISO.ordenar(itens)) {
      if (it.desenho === "jogador") desenharJogador(ctx);
      else if (it.desenho === "npc") desenharNpc(ctx, it.npc);
      else { caixa(ctx, it); if (it.ocupante) desenharNpc(ctx, it.ocupante); }
    }
    desenharSinaisNpc(ctx, agora);

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
  }).then(() => {
    // toca quando ele acorda no quarto (não toda vez que volta para casa)
    if (ROTEIRO_LIGACAO && comodo === "quarto" && !params.has("semligacao")) agendarLigacao(ROTEIRO_LIGACAO.toque_segundos || 4);
    marcar(); window.NSF_APTO = { ligacao, telefoneToca, atenderTelefone, irPara, telaParaMundo, porta, irParaPorta, retanguloPorta, planta: P, efeito, sair, interagir,
      npcs: NPCS, retanguloNpc, irFalarCom, falarCom,
      mundoParaTela(x, y) { // inverso de telaParaMundo (para testes): ponto do mundo -> coordenada do toque
        const v = ultimaVista, r = canvas.getBoundingClientRect(), [lx, ly] = T(x, y, 0);
        return [r.left + (lx * v.z * v.escala + v.dx) * r.width / canvas.width,
                r.top + (ly * v.z * v.escala + v.dy) * r.height / canvas.height];
      },
      get caminho() { return caminho; }, pronto: true, jog, atualizar, teclas, toque, desenhar }; })
    .catch((e) => { estado.erros.push(String(e)); console.error(e); });
  NSF.iniciar(canvas, desenhar, { adaptar: true });
})();
