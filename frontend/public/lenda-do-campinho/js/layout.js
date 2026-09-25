/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — BONECO DE EQUIPAMENTO + PAINÉIS MÓVEIS
   - Equipamento vira um "boneco" (estilo Tibia): cada peça fica
     ao lado da parte do corpo onde é usada, com uma linha até ela.
     Arraste um item da Mochila para o boneco para vestir; arraste
     uma peça do boneco para a Mochila para tirar.
   - Painéis da lateral (retrato, minimapa, grupos de abas) mudam de
     lugar pela alça ⠿: coluna da direita, coluna da esquerda, ou
     outra ordem. Cada aba (Batalha, Equipamento, Mochila, Habilidades)
     pode ficar sozinha num painel ou em QUALQUER grupo de abas:
     arraste a aba para uma coluna (vira painel), para a barra de abas
     de um grupo ou para o título de um painel solto (juntam). ⇕ empilha
     um grupo; ↩ devolve a aba para o grupo principal.
     Fica salvo em rac_layout_v1 (formato v2; o formato antigo é lido).
   - No celular (tela estreita) fica sempre o layout padrão.
   Carregar DEPOIS de itens.js.
   ============================================================ */
const LAYOUT_KEY = 'rac_layout_v1';
const LAY_ABAS = ['batalha', 'equip', 'mochila', 'skills'];
const LAY_NOMES = { batalha: 'Batalha', equip: 'Equipamento', mochila: 'Mochila', skills: 'Habilidades' };
const MIME_PAINEL = 'application/x-rac-painel', MIME_EQUIP = 'application/x-rac-equip', MIME_TIRA = 'application/x-rac-tira';
const LAY_ESTREITO = window.matchMedia ? window.matchMedia('(max-width: 900px)') : { matches: false };

/* ================= BONECO DE EQUIPAMENTO ================= */
// lado do quadro (e = esquerda, d = direita) e parte do corpo de cada peça
const EQ_POS = { cabeca: ['e', 'cabeca'], camisa: ['e', 'peito'], perna: ['e', 'canela'], acessorio: ['d', 'pescoco'], calcao: ['d', 'quadril'], chuteira: ['d', 'pe'] };
// ícones "fantasma" dos lugares vazios (contorno)
const EQ_SVG = {
  cabeca: '<path d="M4 15.5C4 10 7.6 7 12 7s8 3 8 8.5z"/><path d="M20 15.5h2.6c0 1.4-1.1 2.3-2.6 2.3H4.2"/><path d="M12 7v8.5M8 8.4c-.9 2-1.2 4.4-1.2 7.1M16 8.4c.9 2 1.2 4.4 1.2 7.1"/><circle cx="12" cy="6.2" r=".9"/>',
  acessorio: '<path d="M4.5 3c.8 5.4 3.6 8.6 7.5 9.4 3.9-.8 6.7-4 7.5-9.4"/><path d="M6.4 6.2l1.2-.5M8.6 9.2l1-.8M17.6 6.2l-1.2-.5M15.4 9.2l-1-.8"/><circle cx="12" cy="17" r="4"/><path d="M12 14.6l.8 1.6 1.7.2-1.3 1.2.3 1.7-1.5-.8-1.5.8.3-1.7-1.3-1.2 1.7-.2z"/>',
  camisa: '<path d="M8.5 3L4 5.2 1.6 10.4l3.6 1.5 1.3-2.2V21h11V9.7l1.3 2.2 3.6-1.5L20 5.2 15.5 3c-.6 1.6-1.9 2.5-3.5 2.5S9.1 4.6 8.5 3z"/><path d="M12 9.5v3M10.5 11h3"/>',
  calcao: '<path d="M4.8 4h14.4l1.9 14.6-7.2 1.2L12 11.6l-1.9 8.2-7.2-1.2z"/><path d="M5 7h14M12 4v3"/>',
  perna: '<path d="M8 2.5h8c.8 0 1.3.5 1.3 1.3v10.8c0 3.7-2.3 6.3-5.3 7.4-3-1.1-5.3-3.7-5.3-7.4V3.8c0-.8.5-1.3 1.3-1.3z"/><path d="M6.7 6.5h10.6M6.7 15h10.6M12 9v3.5"/>',
  chuteira: '<path d="M2.8 16.8V8.9c0-1.2.9-2 2-2h4.3l1.6 4c3.2.4 6.6 1.1 9 2.1 1.4.6 2.1 1.7 2.1 3v.8z"/><path d="M5 19.5v-2.7M9 19.5v-2.7M14.2 19.5v-2.7M19 19.5v-2.7M6.3 9.8l1.6 1.2M5.3 12l1.8 1"/>',
};
function fantasmaSlot(slot) {
  return el('span', { class: 'eq-fantasma', html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EQ_SVG[slot] || ''}</svg>` });
}
// onde fica cada parte do corpo no desenho: [altura, borda esquerda, borda direita] (frações do sprite)
const EQ_ANC_PADRAO = { cabeca: [0.25, 0.15, 0.85], pescoco: [0.47, 0.45, 0.55], peito: [0.57, 0.2, 0.8], quadril: [0.76, 0.3, 0.7], canela: [0.87, 0.32, 0.68], pe: [0.955, 0.3, 0.7] };
// quanto o ponto entra na parte do corpo, a partir da borda do lado do quadro (0 = borda, .5 = meio)
const EQ_K = { cabeca: 0.2, pescoco: 0.5, peito: 0.3, quadril: 0.3, canela: 0.2, pe: 0.2 };
const EQ_ANC_CACHE = new WeakMap();
// acha as partes do corpo pelo contorno do sprite (serve para criança, adulto, corpo m/f...)
function ancorasSprite(c) {
  if (EQ_ANC_CACHE.has(c)) return EQ_ANC_CACHE.get(c);
  let a = EQ_ANC_PADRAO;
  try {
    const W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data;
    const x0 = new Array(H).fill(-1), x1 = new Array(H).fill(-1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 40) { if (x0[y] < 0) x0[y] = x; x1[y] = x; }
    const larg = y => (x0[y] < 0 ? 0 : x1[y] - x0[y] + 1);
    let top = 0; while (top < H && !larg(top)) top++;
    let bot = H - 1; while (bot > top && !larg(bot)) bot--;
    const h = bot - top; if (h < 20) throw 0;
    let pesc = -1, mn = 1e9; // pescoço: a linha mais estreita entre a cabeça e o tronco
    for (let y = Math.round(top + 0.25 * h); y <= top + 0.7 * h; y++) { const w = larg(y); if (w && w < mn) { mn = w; pesc = y; } }
    if (pesc < 0) throw 0;
    let tMax = pesc, wMax = 0; // tronco + braços: a parte mais larga logo abaixo
    for (let y = pesc; y <= Math.min(bot, pesc + 0.4 * h); y++) if (larg(y) > wMax) { wMax = larg(y); tMax = y; }
    let pern = -1; // onde começam as pernas: a largura cai bastante
    for (let y = tMax; y <= bot; y++) if (larg(y) && larg(y) < wMax * 0.7) { pern = y; break; }
    if (pern < 0 || pern - pesc < h * 0.08) throw 0;
    const q = y => Math.round(clamp(y, top, bot));
    const linha = y => (larg(y) ? [y / H, x0[y] / W, (x1[y] + 1) / W] : [y / H, 0.4, 0.6]);
    const yCab = q((top + pesc) / 2), yPei = q(pesc + (pern - pesc) * 0.45), yQua = q(pern + h * 0.03), yCan = q((pern + bot) / 2 + h * 0.03), yPe = q(bot - h * 0.03);
    a = { cabeca: linha(yCab), pescoco: linha(pesc), peito: linha(yPei), quadril: linha(yQua), canela: linha(yCan), pe: linha(yPe) };
  } catch (e) { a = EQ_ANC_PADRAO; }
  EQ_ANC_CACHE.set(c, a); return a;
}
// silhueta simples, se o desenho do boneco não estiver disponível
function silhuetaEquip(x, X, Y, W, H) {
  x.save(); x.fillStyle = 'rgba(94,47,20,.28)'; x.strokeStyle = 'rgba(94,47,20,.55)'; x.lineWidth = Math.max(1.5, W * 0.02);
  const cx = X + W / 2, rr = (px, py, pw, ph, r) => { x.beginPath(); x.roundRect ? x.roundRect(px, py, pw, ph, r) : x.rect(px, py, pw, ph); x.fill(); x.stroke(); };
  x.beginPath(); x.ellipse(cx, Y + H * 0.25, W * 0.36, H * 0.2, 0, 0, Math.PI * 2); x.fill(); x.stroke();
  rr(cx - W * 0.26, Y + H * 0.48, W * 0.52, H * 0.26, W * 0.08);
  rr(cx - W * 0.4, Y + H * 0.5, W * 0.12, H * 0.2, W * 0.05); rr(cx + W * 0.28, Y + H * 0.5, W * 0.12, H * 0.2, W * 0.05);
  rr(cx - W * 0.2, Y + H * 0.74, W * 0.16, H * 0.24, W * 0.05); rr(cx + W * 0.04, Y + H * 0.74, W * 0.16, H * 0.24, W * 0.05);
  x.restore();
}
const EQ_REG = { x: 26, y: 5, w: 48, h: 90 }; // área do boneco no quadro (%)
const EQ_TAM = 21;                              // tamanho de cada quadro (% da largura)
// chamado por atualizaPaineis (ui.js) depois de criar os quadros .eq-slot[data-slot]
function montaBonecoEquip(g) {
  const N = 360, cv = mkCanvas(N, N); cv.className = 'eq-corpo'; const x = cv.getContext('2d');
  let spr = null;
  try { if (typeof spriteBoneco === 'function' && G.save) spr = spriteBoneco(lookJogador(), 'frente', 0).c; } catch (e) { spr = null; }
  const R = EQ_REG; let bx, by, bw, bh, anc;
  if (spr && spr.width && spr.height) {
    const k = Math.min(R.w / spr.width, R.h / spr.height); bw = spr.width * k; bh = spr.height * k;
    bx = R.x + (R.w - bw) / 2; by = R.y + R.h - bh; anc = ancorasSprite(spr);
  } else { bw = R.w * 0.62; bh = R.h * 0.92; bx = R.x + (R.w - bw) / 2; by = R.y + R.h - bh; anc = EQ_ANC_PADRAO; }
  const P = v => v * N / 100;
  // luz de fundo e sombra no chão
  const luz = x.createRadialGradient(P(50), P(by + bh * 0.55), P(4), P(50), P(by + bh * 0.55), P(40));
  luz.addColorStop(0, 'rgba(255,250,230,.95)'); luz.addColorStop(1, 'rgba(255,250,230,0)');
  x.fillStyle = luz; x.fillRect(0, 0, N, N);
  x.fillStyle = 'rgba(60,30,10,.22)'; x.beginPath(); x.ellipse(P(50), P(by + bh * 0.985), P(bw * 0.38), P(2.6), 0, 0, Math.PI * 2); x.fill();
  if (spr) { x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(spr, P(bx), P(by), P(bw), P(bh)); }
  else silhuetaEquip(x, P(bx), P(by), P(bw), P(bh));
  // posição de cada quadro: na altura da sua parte do corpo, sem encostar nos vizinhos
  const D = EQ_TAM + 7, MIN = EQ_TAM / 2 + 1.5, MAX = 100 - EQ_TAM / 2 - 6.5;
  const lados = { e: [], d: [] };
  for (const slot in EQ_POS) {
    const [lado, parte] = EQ_POS[slot]; const [fy, f0, f1] = anc[parte] || EQ_ANC_PADRAO[parte]; const k = EQ_K[parte];
    lados[lado].push({ slot, ax: bx + (lado === 'e' ? f0 + (f1 - f0) * k : f1 - (f1 - f0) * k) * bw, ay: by + fy * bh });
  }
  const eqp = (G.save && G.save.equip) || {}; const svg = [];
  for (const lado of ['e', 'd']) {
    const L = lados[lado].sort((a, b) => a.ay - b.ay);
    for (let i = 0; i < L.length; i++) L[i].c = Math.max(L[i].ay, MIN, i ? L[i - 1].c + D : -1e9);
    for (let i = L.length - 1; i >= 0; i--) L[i].c = Math.min(L[i].c, MAX, i < L.length - 1 ? L[i + 1].c - D : 1e9);
    const esq = 2.5, left = lado === 'e' ? esq : 100 - esq - EQ_TAM;
    for (const o of L) {
      const b = g.querySelector(`.eq-slot[data-slot="${o.slot}"]`);
      if (b) { b.style.left = left + '%'; b.style.top = (o.c - EQ_TAM / 2) + '%'; b.style.width = EQ_TAM + '%'; }
      // linha em "cotovelo": sai do quadro, desce/sobe por fora do corpo e entra reto na parte do corpo
      const sx = lado === 'e' ? left + EQ_TAM : left, gx = lado === 'e' ? Math.min(R.x - 0.5, o.ax - 1) : Math.max(R.x + R.w + 0.5, o.ax + 1);
      const f = n => n.toFixed(2);
      svg.push(`<g class="eq-lig${eqp[o.slot] ? ' cheio' : ''}" data-lig="${o.slot}"><polyline points="${f(sx)},${f(o.c)} ${f(gx)},${f(o.c)} ${f(gx)},${f(o.ay)} ${f(o.ax)},${f(o.ay)}"/><circle cx="${f(o.ax)}" cy="${f(o.ay)}" r="1.4"/></g>`);
    }
  }
  const lig = el('div', { class: 'eq-linhas', html: `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${svg.join('')}</svg>` });
  g.prepend(cv, lig);
}

/* ---------- arrastar: Mochila → boneco (vestir) e boneco → Mochila (tirar) ---------- */
let ARR = null; // { tipo: 'equip', i, id, r, slot } | { tipo: 'tira', slot } | { tipo: 'painel', item, tabs, bloco }
function limpaArrasto() {
  ARR = null;
  document.body.classList.remove('arrastando-equip', 'arrastando-painel');
  const cls = ['alvo-equip', 'nivel-baixo', 'alvo-tira', 'alvo-abas', 'arrastado', 'alvo-junta', 'insere-antes', 'insere-fim'];
  document.querySelectorAll(cls.map(c => '.' + c).join(', ')).forEach(e => e.classList.remove(...cls));
  document.querySelectorAll('.eq-lig.alvo').forEach(e => e.classList.remove('alvo'));
  if (LAY_IND.parentNode) LAY_IND.remove();
  clearTimeout(LAY_MOLA.t); LAY_MOLA.aba = null;
}
function abaVisivel(nome) { const a = $('#aba-' + nome); return !!(a && a.offsetParent); }
function marcaAlvos() {
  if (!ARR) return;
  if (ARR.tipo === 'equip') {
    document.body.classList.add('arrastando-equip');
    const b = document.querySelector(`#equip .eq-slot[data-slot="${ARR.slot}"]`); const it = ITENS[ARR.id];
    if (b) { b.classList.add('alvo-equip'); b.classList.toggle('nivel-baixo', !!(it && it.lvl && G.save.nivel < it.lvl)); }
    const l = document.querySelector(`#equip [data-lig="${ARR.slot}"]`); if (l) l.classList.add('alvo');
    avisaAba('equip');
  } else if (ARR.tipo === 'tira') {
    const mo = $('#mochila'); if (mo) mo.classList.add('alvo-tira');
    avisaAba('mochila');
  }
}
// aba escondida (outra aba aberta no grupo, ou painel minimizado): pisca o botão da aba ou o título do painel
function avisaAba(nome) {
  if (abaVisivel(nome)) return;
  const bt = document.querySelector(`.abas button[data-aba=${nome}]`);
  if (bt && bt.offsetParent) bt.classList.add('alvo-equip');
  else { const cab = document.querySelector(`.bloco-cab[data-aba=${nome}]`); if (cab) cab.classList.add('alvo-equip'); }
}
// segurar o item em cima da aba abre a aba (para soltar no boneco / na mochila)
const LAY_MOLA = { t: 0, aba: null };
function molaAba(nome) {
  if (LAY_MOLA.aba === nome) return; clearTimeout(LAY_MOLA.t); LAY_MOLA.aba = nome;
  LAY_MOLA.t = setTimeout(() => { if (ARR && LAY_MOLA.aba === nome && !abaVisivel(nome)) { abreAba(nome); setTimeout(marcaAlvos, 0); } }, 350);
}
function instalaArrastoEquip() {
  const mo = $('#mochila'), eq = $('#equip'); if (!mo || !eq || mo._layEq) return; mo._layEq = true;
  mo.addEventListener('dragstart', ev => {
    const b = ev.target.closest && ev.target.closest('.mochila-grade .slot'); if (!b || !G.save) return;
    const i = [...b.parentNode.children].indexOf(b); const it = G.save.mochila[i];
    if (!it || !ITENS[it.id] || ITENS[it.id].tipo !== 'equip') return;
    ev.dataTransfer.setData(MIME_EQUIP, String(i)); ev.dataTransfer.setData('text/plain', 'e:' + i); ev.dataTransfer.effectAllowed = 'move';
    if (typeof escondeTip === 'function') escondeTip();
    ARR = { tipo: 'equip', i, id: it.id, r: it.r || 0, slot: ITENS[it.id].slot };
    setTimeout(marcaAlvos, 0);
  });
  const aceita = (alvo, tipo) => ['dragenter', 'dragover'].forEach(t => alvo.addEventListener(t, ev => { if (ARR && ARR.tipo === tipo) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; } }));
  aceita(eq, 'equip');
  eq.addEventListener('drop', ev => {
    if (!ARR || ARR.tipo !== 'equip') return; ev.preventDefault(); ev.stopPropagation();
    const a = ARR; limpaArrasto(); const it = G.save.mochila[a.i];
    if (it && it.id === a.id) equipar(a.id, a.r); else if (G.save.mochila.some(m => m.id === a.id)) equipar(a.id, a.r);
  });
  eq.addEventListener('dragstart', ev => {
    const b = ev.target.closest && ev.target.closest('.eq-slot[data-slot]'); if (!b || !G.save || !G.save.equip[b.dataset.slot]) return;
    ev.dataTransfer.setData(MIME_TIRA, b.dataset.slot); ev.dataTransfer.setData('text/plain', 'q:' + b.dataset.slot); ev.dataTransfer.effectAllowed = 'move';
    if (typeof escondeTip === 'function') escondeTip();
    ARR = { tipo: 'tira', slot: b.dataset.slot }; setTimeout(marcaAlvos, 0);
  });
  aceita(mo, 'tira');
  mo.addEventListener('drop', ev => {
    if (!ARR || ARR.tipo !== 'tira') return; ev.preventDefault(); ev.stopPropagation();
    const slot = ARR.slot; limpaArrasto(); desequipar(slot);
  });
  // o fim do arrasto às vezes não chega (a mochila é redesenhada no meio): limpa de qualquer jeito
  document.addEventListener('dragend', () => { if (ARR) limpaArrasto(); }, true);
  document.addEventListener('drop', () => { if (ARR) setTimeout(() => { if (ARR) limpaArrasto(); }, 0); });
  document.addEventListener('mousemove', () => { if (ARR) limpaArrasto(); }, { passive: true }); // durante o arrasto o mouse não "move"
}
// depois de cada redesenho dos painéis: itens de vestir e peças vestidas ficam arrastáveis
const _atualizaPaineisLay = atualizaPaineis;
atualizaPaineis = function () {
  _atualizaPaineisLay();
  const s = G.save; if (!s) return;
  document.querySelectorAll('#mochila .mochila-grade .slot').forEach((b, i) => {
    const it = s.mochila[i]; if (!it || !ITENS[it.id] || ITENS[it.id].tipo !== 'equip') return;
    b.draggable = true; b.classList.add('arrasta-equip');
  });
  document.querySelectorAll('#equip .eq-slot.cheio').forEach(b => { b.draggable = true; });
  if (ARR) marcaAlvos();
  expandeDestaques();
};

/* ================= PAINÉIS MÓVEIS ================= */
// Layout = { esq: [...], dir: [...], min: { perfil, mini } }; cada item da coluna é 'perfil', 'mini' ou um
// bloco de abas { g: ['batalha', ...], a: aba aberta, m: minimizado }. Bloco com 1 aba = painel solto;
// com 2+ abas = grupo com barra de abas. Os 4 botões e os 4 painéis originais (do index.html) só mudam
// de lugar: nunca são recriados (ui.js e itens.js continuam ligados neles).
const LAY_IND = el('div', { class: 'indicador-painel' });
const colunas = () => [$('#lateralEsq'), $('#lateral')].filter(Boolean);
const BOTOES = {}, PAINEIS = {};
let LAY = null;        // layout escolhido (salvo)
let LAY_VISTO = null;  // layout desenhado agora (LAY; no celular, o padrão)
const ehAbas = it => !!(it && typeof it === 'object' && Array.isArray(it.g));
const padraoLayout = () => ({ esq: [], dir: ['perfil', 'mini', { g: LAY_ABAS.slice(), a: 'batalha', m: false }], min: {} });
const listasDe = L => [L.esq, L.dir];
function itemDaAba(n, L = LAY_VISTO) { if (!L) return null; for (const l of listasDe(L)) for (const it of l) if (ehAbas(it) && it.g.includes(n)) return it; return null; }
const promovida = n => { const it = itemDaAba(n); return !!(it && it.g.length === 1); };
const podeMexer = () => !LAY_ESTREITO.matches && LAY_VISTO === LAY;

/* ---------- salvar / ler (lê também o formato antigo v1) ---------- */
function normalizaLayout(L) {
  if (!L || !Array.isArray(L.esq) || !Array.isArray(L.dir)) return null;
  const fixos = new Set(), usadas = new Set(); let resto = null;
  const conv = lista => {
    const out = [];
    for (const x of lista) {
      if (x === 'perfil' || x === 'mini') { if (!fixos.has(x)) { fixos.add(x); out.push(x); } continue; }
      if (x === 'abas') { if (!resto) { resto = { g: null, a: 'batalha', m: false }; out.push(resto); } continue; } // v1: grupo com as abas que sobraram
      let g = null, a = null, m = false;
      if (typeof x === 'string' && x.startsWith('aba:')) g = [x.slice(4)];          // v1: aba solta
      else if (ehAbas(x)) { g = x.g; a = x.a; m = !!x.m; }                              // v2
      if (!g) continue;
      g = g.filter(t => LAY_ABAS.includes(t) && !usadas.has(t) && usadas.add(t));
      out.push({ g, a, m });
    }
    return out;
  };
  const esq = conv(L.esq), dir = conv(L.dir);
  if (resto) { resto.g = LAY_ABAS.filter(t => !usadas.has(t)); resto.g.forEach(t => usadas.add(t)); }
  const N = { esq, dir, min: { perfil: !!(L.min && L.min.perfil), mini: !!(L.min && L.min.mini) } }; limpaVazios(N);
  for (const f of ['mini', 'perfil']) if (!fixos.has(f)) N.dir.unshift(f);
  const faltam = LAY_ABAS.filter(t => !usadas.has(t));
  if (faltam.length) { const g = [...N.dir, ...N.esq].find(it => ehAbas(it) && it.g.length > 1); if (g) g.g.push(...faltam); else N.dir.push({ g: faltam, a: faltam[0], m: false }); }
  limpaVazios(N); return N;
}
function limpaVazios(L) {
  for (const k of ['esq', 'dir']) L[k] = L[k].filter(it => !ehAbas(it) || it.g.length);
  for (const l of listasDe(L)) for (const it of l) if (ehAbas(it) && !it.g.includes(it.a)) it.a = it.g[0];
  L.min = L.min || {};
}
function leLayout() { try { return normalizaLayout(JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null')); } catch (e) { return null; } }
function salvaLayout() { try { if (LAY) localStorage.setItem(LAYOUT_KEY, JSON.stringify({ v: 2, esq: LAY.esq, dir: LAY.dir, min: LAY.min || {} })); } catch (e) { } }
const clona = L => JSON.parse(JSON.stringify({ v: 2, esq: L.esq, dir: L.dir, min: L.min || {} }));
function layoutAtual() { return clona(LAY_VISTO || LAY || padraoLayout()); }

/* ---------- minimizar ---------- */
const estaMin = (it, L = LAY_VISTO) => (ehAbas(it) ? !!it.m : !!(L && L.min && L.min[it]));
function blocoDoItem(it) { return [...document.querySelectorAll('.coluna-paineis > .bloco')].find(b => b._item === it) || null; }
function mkBtMin(bloco) {
  const b = el('span', { class: 'bt-min', role: 'button' });
  b.addEventListener('mousedown', ev => ev.stopPropagation());
  b.addEventListener('click', ev => { ev.stopPropagation(); minimiza(bloco); });
  b.addEventListener('dblclick', ev => ev.stopPropagation());
  return b;
}
function atualizaBtMin(bloco) {
  const m = bloco.classList.contains('minimizado');
  bloco.querySelectorAll('.bt-min').forEach(b => { if (b.closest('.bloco') !== bloco) return; b.textContent = m ? '▸' : '▾'; b.title = m ? 'Expandir' : 'Minimizar'; b.setAttribute('aria-label', b.title); });
}
function minimiza(bloco, estado) {
  if (!bloco || LAY_ESTREITO.matches) return;
  const it = bloco._item, L = LAY_VISTO; if (it === undefined || !L) return;
  const v = estado == null ? !estaMin(it) : !!estado;
  if (v === estaMin(it) && bloco.classList.contains('minimizado') === v) return;
  if (ehAbas(it)) it.m = v; else { L.min = L.min || {}; L.min[it] = v; }
  bloco.classList.toggle('minimizado', v); atualizaBtMin(bloco);
  if (LAY_VISTO === LAY) salvaLayout();
  if (it === 'perfil') resumoPerfil();
  depoisDeMover();
}
const expande = elm => { const b = elm && elm.closest && elm.closest('.bloco.minimizado'); if (b) minimiza(b, false); };
// retrato minimizado: uma linha com nome · nível · fôlego/foco
function resumoPerfil() {
  const b = blocoFixo('perfil'); if (!b || !b.classList.contains('minimizado') || !G.save) return;
  const r = b.querySelector('.cab-min'); if (!r) return; const s = G.save; let st; try { st = stats(); } catch (e) { return; }
  r.querySelector('.pr-nome').textContent = s.nome; r.querySelector('.pr-nivel').textContent = 'Nível ' + s.nivel;
  r.querySelector('.pr-hp > i').style.width = clamp(s.hp / st.maxHp * 100, 0, 100) + '%';
  r.querySelector('.pr-foco > i').style.width = clamp(s.foco / st.maxFoco * 100, 0, 100) + '%';
  r.title = `${s.nome} — Nível ${s.nivel} · Fôlego ${fmt(s.hp)}/${fmt(st.maxHp)} · Foco ${fmt(s.foco)}/${fmt(st.maxFoco)} (clique para expandir)`;
}
const _atualizaBarrasLay = atualizaBarras;
atualizaBarras = function () { _atualizaBarrasLay(); resumoPerfil(); };
// dica/tutorial apontando para algo dentro de um painel minimizado: abre o painel (uma vez por dica)
let LAY_DESTAQUE = null;
function expandeDestaques() {
  const s = G.save; if (!s) return;
  const d = G.dicasFila && G.dicasFila[0];
  const sel = (d && d.destaque) || (typeof TUTORIAL !== 'undefined' && s.tut < TUTORIAL.length && TUTORIAL[s.tut].destaque) || null;
  if (sel === LAY_DESTAQUE) return; LAY_DESTAQUE = sel; if (!sel) return;
  try { document.querySelectorAll(sel).forEach(expande); } catch (e) { }
}

/* ---------- desenho ---------- */
function iniciaArrastoBloco(ev, bloco) {
  if (LAY_ESTREITO.matches) { ev.preventDefault(); return; }
  ev.stopPropagation();
  const item = bloco._item, id = bloco.dataset.painel;
  ev.dataTransfer.setData(MIME_PAINEL, id); ev.dataTransfer.setData('text/plain', 'p:' + id); ev.dataTransfer.effectAllowed = 'move';
  const r = bloco.getBoundingClientRect(); try { ev.dataTransfer.setDragImage(bloco, ev.clientX - r.left, Math.min(ev.clientY - r.top, 60)); } catch (e) { }
  if (typeof escondeTip === 'function') escondeTip();
  ARR = { tipo: 'painel', item, tabs: ehAbas(item) ? item.g.slice() : null, bloco };
  setTimeout(() => { if (ARR && ARR.bloco === bloco) { document.body.classList.add('arrastando-painel'); bloco.classList.add('arrastado'); } }, 0);
}
function mkGrip(bloco) {
  const g = el('span', { class: 'grip', title: 'Arraste para mudar este painel de lugar', 'aria-label': 'Mover painel', role: 'button' }, '⠿');
  g.draggable = !LAY_ESTREITO.matches;
  g.addEventListener('mousedown', ev => ev.stopPropagation());
  g.addEventListener('click', ev => ev.stopPropagation());
  g.addEventListener('dragstart', ev => iniciaArrastoBloco(ev, bloco));
  g.addEventListener('dragend', () => { if (ARR && ARR.tipo === 'painel') limpaArrasto(); });
  return g;
}
// alvo de "juntar": barra de abas de um grupo (com posição) ou título de um painel solto
const aceitaJuntar = it => !!(ARR && ARR.tipo === 'painel' && ARR.tabs && ARR.item !== it && podeMexer());
function ligaBarra(bar, it) {
  const marca = x => {
    bar.querySelectorAll('.insere-antes').forEach(b => b.classList.remove('insere-antes'));
    const bts = [...bar.querySelectorAll('button[data-aba]')].filter(b => !ARR.tabs.includes(b.dataset.aba));
    const ref = bts.find(b => { const r = b.getBoundingClientRect(); return x < r.left + r.width / 2; });
    bar._antes = ref ? ref.dataset.aba : null;
    if (ref) ref.classList.add('insere-antes');
    bar.classList.toggle('insere-fim', !ref); bar.classList.add('alvo-abas');
  };
  const sobre = ev => {
    if (!ARR) return;
    if (ARR.tipo === 'equip' || ARR.tipo === 'tira') { const bt = ev.target.closest && ev.target.closest('button[data-aba]'); if (bt) molaAba(bt.dataset.aba); return; }
    if (!aceitaJuntar(it)) return;
    ev.preventDefault(); ev.stopPropagation(); ev.dataTransfer.dropEffect = 'move';
    marca(ev.clientX); if (LAY_IND.parentNode) LAY_IND.remove();
  };
  bar.addEventListener('dragenter', sobre); bar.addEventListener('dragover', sobre);
  bar.addEventListener('dragleave', ev => {
    if (bar.contains(ev.relatedTarget)) return;
    bar.classList.remove('alvo-abas', 'insere-fim'); bar.querySelectorAll('.insere-antes').forEach(b => b.classList.remove('insere-antes'));
    LAY_MOLA.aba = null; clearTimeout(LAY_MOLA.t);
  });
  bar.addEventListener('drop', ev => {
    if (!aceitaJuntar(it)) return;
    ev.preventDefault(); ev.stopPropagation();
    const tabs = ARR.tabs, antes = bar._antes; limpaArrasto(); juntaEm(it, tabs, antes);
  });
}
function ligaTitulo(cab, it) {
  const sobre = ev => {
    if (!ARR) return;
    if (ARR.tipo === 'equip' || ARR.tipo === 'tira') { molaAba(it.g[0]); return; }
    if (!aceitaJuntar(it)) return;
    ev.preventDefault(); ev.stopPropagation(); ev.dataTransfer.dropEffect = 'move';
    cab.classList.add('alvo-junta'); if (LAY_IND.parentNode) LAY_IND.remove();
  };
  cab.addEventListener('dragenter', sobre); cab.addEventListener('dragover', sobre);
  cab.addEventListener('dragleave', ev => { if (!cab.contains(ev.relatedTarget)) { cab.classList.remove('alvo-junta'); LAY_MOLA.aba = null; clearTimeout(LAY_MOLA.t); } });
  cab.addEventListener('drop', ev => {
    if (!aceitaJuntar(it)) return;
    ev.preventDefault(); ev.stopPropagation();
    const tabs = ARR.tabs; limpaArrasto(); juntaEm(it, tabs, null);
  });
}
let LAY_CLIQUE_CAB = false;
function mkBlocoAbas(it) {
  const solto = it.g.length === 1, t0 = it.g[0];
  const b = el('div', { class: 'bloco bloco-abas ' + (solto ? 'bloco-solto' : 'bloco-grupo'), 'data-painel': (solto ? 'aba:' : 'abas:') + it.g.join(',') });
  b._item = it;
  const bar = el('div', { class: 'abas' }); it.g.forEach(t => bar.append(BOTOES[t]));
  if (solto) {
    bar.hidden = true; // o botão continua existindo (abreAba e o tutorial clicam nele)
    const cab = el('div', { class: 'bloco-cab', 'data-aba': t0, title: 'Arraste para mudar de lugar ou juntar com outras abas · duplo clique minimiza · ↩ volta para as abas' },
      el('span', { class: 'bloco-titulo' }, LAY_NOMES[t0] || t0), mkBtMin(b),
      el('button', { class: 'bloco-volta', type: 'button', title: 'Voltar para as abas' }, '↩'));
    cab.prepend(mkGrip(b));
    cab.draggable = !LAY_ESTREITO.matches;
    cab.addEventListener('dragstart', ev => iniciaArrastoBloco(ev, b));
    cab.addEventListener('dragend', () => { if (ARR && ARR.tipo === 'painel') limpaArrasto(); });
    cab.addEventListener('click', ev => {
      if (ev.target.closest('.bloco-volta')) { ev.stopPropagation(); voltaParaGrupo(t0); return; }
      LAY_CLIQUE_CAB = true; try { abreAba(t0); } finally { LAY_CLIQUE_CAB = false; } // mesmo efeito de clicar na aba (tutorial, dicas)
    });
    cab.addEventListener('dblclick', ev => { if (!ev.target.closest('.bloco-volta, .grip')) minimiza(b); });
    ligaTitulo(cab, it);
    b.append(cab, bar);
  } else {
    const emp = el('span', { class: 'abas-empilha', role: 'button', title: 'Empilhar abas (cada aba vira um painel, um embaixo do outro)' }, '⇕');
    emp.addEventListener('click', ev => { ev.stopPropagation(); empilhaGrupo(it); });
    bar.append(el('span', { class: 'abas-ferr' }, mkGrip(b), emp, mkBtMin(b)));
    ligaBarra(bar, it);
    b.append(bar);
  }
  it.g.forEach(t => b.append(PAINEIS[t]));
  b.classList.toggle('minimizado', !!it.m); atualizaBtMin(b);
  return b;
}
// cada grupo mostra a sua aba aberta (ui.js desliga as abas de TODOS os grupos ao clicar numa)
function reafirmaAbas() {
  document.querySelectorAll('.bloco-abas').forEach(b => {
    const it = b._item; if (!ehAbas(it)) return; const solto = it.g.length === 1;
    for (const t of it.g) { if (BOTOES[t]) BOTOES[t].classList.toggle('ativa', !solto && t === it.a); if (PAINEIS[t]) PAINEIS[t].classList.toggle('ativa', solto || t === it.a); }
  });
}
function blocoFixo(id) { return document.querySelector(`.bloco[data-painel="${id}"]`); }
function renderLayout(L) {
  const E = $('#lateralEsq'), D = $('#lateral'); if (!E || !D) return;
  limpaArrasto();
  document.querySelectorAll('.bloco-abas, .bloco[data-painel=abas]').forEach(b => b.remove()); // botões e painéis voltam logo abaixo
  for (const [col, lista] of [[E, L.esq], [D, L.dir]]) for (const it of lista) {
    const b = ehAbas(it) ? mkBlocoAbas(it) : blocoFixo(it);
    if (!b) continue;
    b._item = it; col.append(b);
    if (!ehAbas(it)) { b.classList.toggle('minimizado', !!(L.min && L.min[it])); atualizaBtMin(b); }
  }
  // segurança: nenhum painel pode ficar fora da página
  for (const t of LAY_ABAS) if (PAINEIS[t] && !PAINEIS[t].isConnected) D.append(mkBlocoAbas({ g: [t], a: t, m: false }));
  LAY_VISTO = L;
  const est = LAY_ESTREITO.matches;
  document.querySelectorAll('.grip, .abas button[data-aba], .bloco-cab').forEach(g => { g.draggable = !est; });
  document.body.classList.toggle('layout-fixo', est);
  reafirmaAbas(); atualizaColunas(); resumoPerfil();
}
function atualizaColunas() {
  for (const col of colunas()) col.classList.toggle('vazia', ![...col.children].some(c => c.classList && c.classList.contains('bloco')));
}
function depoisDeMover() {
  atualizaColunas();
  try { if (G.rodando && typeof ajustaCanvas === 'function') ajustaCanvas(); } catch (e) { }
  window.dispatchEvent(new Event('resize'));
}
let LAY_EST_ULT = null;
function desenhaLayout() {
  if (!$('#lateral')) return;
  if (!LAY) LAY = leLayout() || padraoLayout();
  const est = LAY_ESTREITO.matches; LAY_EST_ULT = est;
  renderLayout(est ? padraoLayout() : LAY);
  depoisDeMover();
}
function aplica(L) { limpaVazios(L); LAY = L; salvaLayout(); desenhaLayout(); }

/* ---------- operações ---------- */
function tiraAbas(L, tabs) { for (const l of listasDe(L)) for (const it of l) if (ehAbas(it)) it.g = it.g.filter(t => !tabs.includes(t)); }
// soltar numa coluna: o bloco inteiro muda de lugar, ou a aba arrastada vira painel solto ali
function soltaNaColuna(col) {
  const a = ARR; if (!a || a.tipo !== 'painel' || !podeMexer()) return;
  const L = LAY; const seq = [...col.children].filter(c => c === LAY_IND || (c._item !== undefined && c.classList.contains('bloco')));
  let novo;
  if (a.item) novo = a.item;
  else { tiraAbas(L, a.tabs); novo = { g: a.tabs.slice(), a: a.tabs[0], m: false }; }
  const lista = []; let pos = false;
  for (const c of seq) { if (c === LAY_IND) { lista.push(novo); pos = true; } else if (c._item !== novo) lista.push(c._item); }
  if (!pos) lista.push(novo);
  const k = col.id === 'lateralEsq' ? 'esq' : 'dir', o = k === 'esq' ? 'dir' : 'esq';
  L[k] = lista; L[o] = L[o].filter(it => it !== novo);
  limpaArrasto(); aplica(L);
}
// juntar abas num bloco (grupo ou painel solto); "antes" = aba que fica logo depois das novas
function juntaEm(T, tabs, antes) {
  if (!ehAbas(T) || !tabs || !tabs.length || !podeMexer()) return;
  const L = LAY; tiraAbas(L, tabs);
  let i = antes ? T.g.indexOf(antes) : -1; if (i < 0) i = T.g.length;
  T.g.splice(i, 0, ...tabs); T.a = tabs[0]; T.m = false;
  aplica(L);
}
// ⇕: cada aba do grupo vira um painel solto, no mesmo lugar
function empilhaGrupo(it) {
  if (!podeMexer()) return; const L = LAY;
  for (const k of ['esq', 'dir']) { const i = L[k].indexOf(it); if (i >= 0) L[k].splice(i, 1, ...it.g.map(t => ({ g: [t], a: t, m: false }))); }
  aplica(L);
}
// ↩: a aba solta volta para o grupo principal (o primeiro grupo; sem grupo, junta com o painel de aba mais perto)
function voltaParaGrupo(t) {
  if (!podeMexer()) return; const L = LAY; const src = itemDaAba(t, L); if (!src) return;
  let alvo = [...L.dir, ...L.esq].find(it => ehAbas(it) && it.g.length > 1 && it !== src);
  if (!alvo) {
    const k = L.esq.includes(src) ? 'esq' : 'dir', l = L[k], i = l.indexOf(src);
    alvo = l.slice(i + 1).find(ehAbas) || l.slice(0, i).reverse().find(ehAbas) || [...L.dir, ...L.esq].find(it => ehAbas(it) && it !== src);
  }
  if (!alvo) return;
  tiraAbas(L, [t]);
  let j = alvo.g.findIndex(x => LAY_ABAS.indexOf(x) > LAY_ABAS.indexOf(t)); if (j < 0) j = alvo.g.length;
  alvo.g.splice(j, 0, t); alvo.a = t; alvo.m = false;
  aplica(L);
}
// atalhos da ajuda: todas as abas empilhadas / todas juntas, onde está o primeiro bloco de abas
function presetAbas(juntas) {
  const L = clona(LAY || padraoLayout());
  let k = 'dir', i = -1;
  for (const kk of ['dir', 'esq']) { const j = L[kk].findIndex(ehAbas); if (j >= 0) { k = kk; i = j; break; } }
  for (const kk of ['esq', 'dir']) L[kk] = L[kk].filter(it => !ehAbas(it));
  if (i < 0 || i > L[k].length) i = L[k].length;
  const novos = juntas ? [{ g: LAY_ABAS.slice(), a: 'batalha', m: false }] : LAY_ABAS.map(t => ({ g: [t], a: t, m: false }));
  L[k].splice(i, 0, ...novos);
  aplica(L);
  if (typeof log === 'function' && G.rodando) log(juntas ? 'Abas juntas de novo (Batalha, Equipamento, Mochila, Habilidades).' : 'Abas empilhadas: cada uma virou um painel.', 'l-sis');
}
function destacaBloco(nome) {
  const b = document.querySelector(`.bloco-solto[data-painel="aba:${nome}"]`); if (!b) return;
  b.classList.remove('pisca'); void b.offsetWidth; b.classList.add('pisca');
  try { b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { }
}

/* ---------- ligações que ficam (botões das abas, colunas, painéis fixos) ---------- */
function ligaBotoes() {
  for (const n of LAY_ABAS) {
    const b = BOTOES[n]; if (!b || b._lay) continue; b._lay = true;
    // roda depois do onclick de ui.js: marca a aba aberta do grupo dela, abre o painel minimizado e arruma os outros grupos
    b.addEventListener('click', () => {
      const it = itemDaAba(n); const bl = it && blocoDoItem(it);
      if (it && it.g.length > 1) { it.a = n; if (LAY_VISTO === LAY) salvaLayout(); }
      reafirmaAbas();
      if (bl && !LAY_CLIQUE_CAB) minimiza(bl, false);
      if (it && it.g.length === 1) destacaBloco(n);
    });
    b.addEventListener('dragstart', ev => {
      if (LAY_ESTREITO.matches) { ev.preventDefault(); return; }
      ev.dataTransfer.setData(MIME_PAINEL, 'aba:' + n); ev.dataTransfer.setData('text/plain', 'p:aba:' + n); ev.dataTransfer.effectAllowed = 'move';
      ARR = { tipo: 'painel', item: null, tabs: [n], bloco: null };
      setTimeout(() => { if (ARR && ARR.tabs && ARR.tabs[0] === n && !ARR.item) { document.body.classList.add('arrastando-painel'); b.classList.add('arrastado'); } }, 0);
    });
    b.addEventListener('dragend', () => { if (ARR && ARR.tipo === 'painel') limpaArrasto(); });
  }
}
function preparaFixos() {
  const p = blocoFixo('perfil');
  if (p && !p.querySelector(':scope > .cab-min')) {
    const r = el('div', { class: 'cab-min perfil-resumo' }, el('b', { class: 'pr-nome' }), el('span', { class: 'pr-nivel' }),
      el('span', { class: 'pr-barras' }, el('span', { class: 'pr-hp' }, el('i')), el('span', { class: 'pr-foco' }, el('i'))));
    r.addEventListener('click', () => minimiza(p, false));
    p.prepend(r); p.append(mkBtMin(p), mkGrip(p));
  }
  const m = blocoFixo('mini');
  if (m && !m.querySelector(':scope > .cab-min')) {
    const r = el('div', { class: 'cab-min', title: 'Clique para expandir' }, el('span', {}, '🗺 Minimapa'));
    r.addEventListener('click', () => minimiza(m, false));
    m.prepend(r); m.append(mkBtMin(m), mkGrip(m));
  }
}
function posicionaIndicador(col, y) {
  const filhos = [...col.children].filter(c => c.classList && c.classList.contains('bloco') && c !== (ARR && ARR.bloco));
  const ref = filhos.find(c => { const r = c.getBoundingClientRect(); return y < r.top + r.height / 2; });
  if (ref) { if (LAY_IND.nextSibling !== ref || LAY_IND.parentNode !== col) col.insertBefore(LAY_IND, ref); }
  else if (LAY_IND.parentNode !== col || LAY_IND.nextSibling) col.append(LAY_IND);
}
function instalaColunas() {
  for (const col of colunas()) {
    if (col._lay) continue; col._lay = true;
    const sobre = ev => {
      if (!ARR || ARR.tipo !== 'painel' || !podeMexer()) return;
      ev.preventDefault(); ev.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.alvo-junta, .alvo-abas').forEach(e => e.classList.remove('alvo-junta', 'alvo-abas', 'insere-fim'));
      document.querySelectorAll('.insere-antes').forEach(e => e.classList.remove('insere-antes'));
      posicionaIndicador(col, ev.clientY);
    };
    col.addEventListener('dragenter', sobre); col.addEventListener('dragover', sobre);
    col.addEventListener('drop', ev => { if (!ARR || ARR.tipo !== 'painel') return; ev.preventDefault(); soltaNaColuna(col); });
  }
}
function restauraLayout() {
  try { localStorage.removeItem(LAYOUT_KEY); } catch (e) { }
  LAY = padraoLayout(); desenhaLayout();
  if (typeof log === 'function' && G.rodando) log('Os painéis voltaram para o lugar de sempre.', 'l-sis');
}
let LAY_OK = false;
function iniciaLayout() {
  if (!$('#lateral') || !$('#lateralEsq')) return;
  for (const n of LAY_ABAS) {
    if (!BOTOES[n]) BOTOES[n] = document.querySelector(`.abas button[data-aba=${n}]`);
    if (!PAINEIS[n]) PAINEIS[n] = $('#aba-' + n);
  }
  if (LAY_ABAS.some(n => !BOTOES[n] || !PAINEIS[n])) return; // HTML diferente do esperado: não mexe
  preparaFixos(); ligaBotoes(); instalaColunas(); instalaArrastoEquip();
  if (!LAY_OK) {
    LAY_OK = true;
    // tela estreita <-> larga: troca entre o layout padrão e o escolhido
    const mudou = () => { if (G.rodando && LAY_ESTREITO.matches !== LAY_EST_ULT) desenhaLayout(); };
    if (LAY_ESTREITO.addEventListener) LAY_ESTREITO.addEventListener('change', mudou); else if (LAY_ESTREITO.addListener) LAY_ESTREITO.addListener(mudou);
    window.addEventListener('resize', mudou);
  }
  LAY = leLayout() || padraoLayout(); LAY_DESTAQUE = null;
  desenhaLayout();
}
// aplica o layout salvo quando o jogo começa (depois de montar os painéis)
const _montaPaineisLay = montaPaineis;
montaPaineis = function () { _montaPaineisLay(); try { iniciaLayout(); } catch (e) { console.error('layout', e); } };

// "Como jogar" ganha a explicação dos painéis e os botões de layout
const _modalAjudaLay = modalAjuda;
modalAjuda = function () {
  _modalAjudaLay();
  const box = $('#modalConteudo'); if (!box) return;
  box.append(el('h3', {}, 'Painéis do jogo'),
    el('p', {}, 'Arraste a alça ⠿ de um painel (retrato, minimapa ou abas) para mudar de lugar: dos dois lados do jogo ou em outra ordem. Arraste uma aba (ex.: Equipamento) para uma coluna e ela vira um painel sozinho; solte-a na barra de abas de outro grupo ou no título de outro painel para juntar. ⇕ empilha as abas de um grupo; ↩ devolve a aba; ▾ minimiza o painel (▸ abre de novo). No Equipamento, arraste itens da Mochila direto para o boneco.'),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn', type: 'button', onclick: () => { restauraLayout(); } }, '↺ Restaurar layout'),
      el('button', { class: 'btn', type: 'button', onclick: () => { presetAbas(false); } }, 'Empilhar tudo (4 painéis)'),
      el('button', { class: 'btn', type: 'button', onclick: () => { presetAbas(true); } }, 'Abas juntas (padrão)')));
};

/* ---------- estilo ---------- */
(function () {
  if (document.getElementById('layout-css')) return;
  const st = document.createElement('style'); st.id = 'layout-css';
  const liga = Object.keys(EQ_POS).map(s => `.equip-boneco:has(.eq-slot[data-slot=${s}]:hover) [data-lig=${s}] polyline`).join(', ');
  st.textContent = `
  /* colunas de painéis dos dois lados do jogo */
  .bloco { position: relative; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .bloco.arrastado, .abas button.arrastado { opacity: .45; }
  #lateral.vazia, #lateralEsq.vazia { display: none; }
  @media (min-width: 901px) {
    #principal { grid-template-columns: auto minmax(0, 1fr) auto; column-gap: 0; }
    #principal:has(#lateralEsq:not(.vazia)) { max-width: 1680px; } /* painéis dos dois lados: o jogo não encolhe tanto em tela grande */
    #lateralEsq { grid-column: 1; grid-row: 1; margin-right: 7px; }
    #colJogo { grid-column: 2; grid-row: 1; }
    #lateral { grid-column: 3; grid-row: 1; margin-left: 7px; }
    /* muitos painéis empilhados: a coluna rola sozinha e fica sempre à vista */
    .coluna-paineis { width: 306px; display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: 5px 3px; align-self: start; position: sticky; top: 6px;
      max-height: calc(100vh - 12px); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--madeira3) transparent; }
    body.arrastando-painel .coluna-paineis { outline: 2px dashed rgba(255,210,63,.5); outline-offset: 2px; border-radius: 8px; }
    body.arrastando-painel #lateral.vazia, body.arrastando-painel #lateralEsq.vazia { display: flex; width: 120px; min-height: 280px; align-items: center; justify-content: center; border: 3px dashed var(--amarelo); border-radius: 10px; background: rgba(255,210,63,.1); outline: none; }
    body.arrastando-painel .coluna-paineis.vazia::before { content: 'Solte o painel aqui'; color: var(--amarelo); font-weight: 700; font-size: 13px; text-align: center; padding: 6px; pointer-events: none; }
  }
  @media (max-width: 900px) { .bloco { display: contents; } .grip, .bloco-volta, .bt-min, .abas-ferr, .cab-min { display: none !important; } }
  .indicador-painel { position: relative; height: 0; margin-bottom: -8px; pointer-events: none; }
  .indicador-painel::after { content: ''; position: absolute; left: 0; right: 0; top: -7px; height: 6px; border-radius: 3px; background: var(--amarelo); box-shadow: 0 0 0 2px var(--madeira2), 0 0 12px 3px rgba(255,210,63,.8); }
  .coluna-paineis.vazia .indicador-painel { display: none; }
  .grip { cursor: grab; user-select: none; -webkit-user-select: none; font-size: 15px; line-height: 1; color: var(--madeira2); background: var(--papel2); border: 2px solid var(--madeira3); border-radius: 5px; padding: 2px 3px 1px; opacity: .8; }
  .grip:hover { opacity: 1; background: var(--amarelo); border-color: var(--madeira2); }
  .grip:active { cursor: grabbing; }
  .bt-min { cursor: pointer; user-select: none; -webkit-user-select: none; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; line-height: 1; color: var(--madeira2); background: var(--papel2); border: 2px solid var(--madeira3); border-radius: 5px; min-width: 19px; height: 19px; opacity: .85; }
  .bt-min:hover { opacity: 1; background: var(--amarelo); border-color: var(--madeira2); }
  .bloco[data-painel=perfil] > .grip, .bloco[data-painel=mini] > .grip { position: absolute; top: 6px; right: 6px; z-index: 2; }
  .bloco[data-painel=perfil] > .bt-min, .bloco[data-painel=mini] > .bt-min { position: absolute; top: 6px; right: 30px; z-index: 2; }
  .abas { display: flex; }
  .abas button { flex: 1 1 auto; min-width: 0; padding-left: 2px; padding-right: 2px; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .abas-ferr { flex: none; display: grid; grid-template-columns: auto auto; grid-template-rows: 1fr 1fr; gap: 1px; align-self: center; margin-left: 1px; }
  .abas-ferr .grip { grid-row: 1 / span 2; align-self: stretch; display: flex; align-items: center; width: 14px; justify-content: center; padding: 0; font-size: 12px; border-width: 1px; }
  .abas-ferr .abas-empilha, .abas-ferr .bt-min { min-width: 15px; width: 15px; height: 13px; font-size: 10px; border-width: 1px; border-radius: 3px; }
  .abas-empilha { cursor: pointer; user-select: none; display: inline-flex; align-items: center; justify-content: center; color: var(--madeira2); background: var(--papel2); border: 1px solid var(--madeira3); opacity: .85; line-height: 1; font-weight: 700; }
  .abas-empilha:hover { opacity: 1; background: var(--amarelo); }
  .abas.alvo-abas { outline: 3px dashed var(--amarelo); outline-offset: 2px; border-radius: 6px; }
  .abas button.insere-antes { box-shadow: inset 4px 0 0 #ffd23f, -3px 0 8px rgba(255,210,63,.9); }
  .abas.insere-fim .abas-ferr { box-shadow: -4px 0 0 #ffd23f, -6px 0 8px rgba(255,210,63,.9); border-radius: 2px; }
  .abas button.alvo-equip, .bloco-cab.alvo-equip { animation: pisca .8s ease-in-out infinite; box-shadow: 0 0 0 2px #ffd23f, 0 0 12px 3px rgba(255,210,63,.8); }
  /* aba que virou painel solto */
  .bloco-cab { display: flex; align-items: center; gap: 5px; background: var(--madeira); color: var(--papel); border: 2px solid var(--madeira2); border-radius: 6px 6px 0 0; padding: 3px 6px; font-size: 14px; font-weight: 700; cursor: pointer; margin-bottom: -8px; position: relative; z-index: 1; user-select: none; }
  .bloco-cab.alvo-junta { outline: 3px dashed var(--amarelo); outline-offset: 1px; background: #a8612c; }
  .bloco-cab.alvo-junta .bloco-titulo::after { content: '  + juntar aqui'; color: var(--amarelo); font-size: 12px; }
  .bloco-titulo { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bloco-volta { background: var(--papel2); color: var(--tinta); border: 2px solid var(--madeira2); border-radius: 5px; font-size: 13px; line-height: 1; padding: 2px 6px; }
  .bloco-volta:hover { background: var(--amarelo); }
  .bloco-solto > .aba { display: block; }
  .bloco.pisca > .aba { animation: piscaBloco .45s ease-in-out 3; }
  @keyframes piscaBloco { 50% { box-shadow: 0 0 0 2px var(--madeira2), 0 0 0 5px #ffd23f, 0 0 18px 6px rgba(255,210,63,.8); } }
  /* painel minimizado: só a linha do título fica à vista */
  .bloco.minimizado > .aba, .bloco.minimizado > .painel { display: none !important; }
  .bloco.minimizado > .bloco-cab { margin-bottom: 0; border-radius: 6px; }
  .bloco.minimizado > .abas button { border-radius: 6px; }
  .cab-min { display: none; }
  .bloco.minimizado > .cab-min { display: flex; align-items: center; gap: 8px; min-height: 31px; padding: 3px 58px 3px 10px; background: var(--madeira); color: var(--papel); border: 2px solid var(--madeira2); border-radius: 6px; font-size: 14px; font-weight: 700; cursor: pointer; user-select: none; }
  .perfil-resumo .pr-nome { max-width: 92px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .perfil-resumo .pr-nivel { color: var(--amarelo); white-space: nowrap; }
  .perfil-resumo .pr-barras { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 40px; }
  .perfil-resumo .pr-barras > span { display: block; height: 6px; background: #2a1a10; border: 1px solid var(--madeira2); border-radius: 3px; overflow: hidden; }
  .perfil-resumo .pr-barras i { display: block; height: 100%; transition: width .15s; }
  .perfil-resumo .pr-hp i { background: linear-gradient(#ff7a6a, #d02a2a); }
  .perfil-resumo .pr-foco i { background: linear-gradient(#7ab8ff, #2a5ad9); }

  /* boneco de equipamento */
  #equip .equip-boneco { display: block; position: relative; width: 100%; max-width: 300px; margin: 0 auto; aspect-ratio: 1 / 1; gap: 0; grid-template-columns: none;
    background: linear-gradient(180deg, #f8e8c0, #ecd09a); border: 2px solid var(--madeira3); border-radius: 8px;
    box-shadow: inset 0 0 0 2px rgba(255,246,220,.8), inset 0 -26px 30px -10px rgba(138,75,36,.22); }
  .equip-boneco .eq-corpo { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .equip-boneco .eq-linhas, .equip-boneco .eq-linhas svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
  .eq-lig polyline { fill: none; stroke: var(--madeira3); stroke-width: 1.6; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; opacity: .75; transition: stroke .15s; }
  .eq-lig circle { fill: #fff6e0; stroke: var(--madeira2); stroke-width: 1.3; vector-effect: non-scaling-stroke; }
  .eq-lig.cheio polyline { stroke: var(--madeira); stroke-dasharray: none; opacity: .85; }
  .eq-lig.cheio circle { fill: var(--amarelo); }
  .eq-lig.alvo polyline, ${liga} { stroke: #e09a10; stroke-width: 3; stroke-dasharray: none; opacity: 1; }
  .eq-lig.alvo circle { fill: #ffd23f; stroke: #b0700a; }
  .equip-boneco .eq-slot { position: absolute; width: ${EQ_TAM}%; aspect-ratio: 1; padding: 0; border-radius: 8px; z-index: 1; transition: transform .12s; }
  .equip-boneco .eq-slot.cheio { cursor: pointer; box-shadow: 0 2px 0 rgba(0,0,0,.25); }
  .equip-boneco .eq-slot.cheio:hover { transform: scale(1.07); z-index: 2; }
  .equip-boneco .eq-slot.eq-vazio { background: rgba(255,248,226,.8); border: 2px dashed var(--madeira3); color: var(--madeira); cursor: default; }
  .eq-fantasma { display: flex; width: 70%; height: 70%; opacity: .5; pointer-events: none; }
  .eq-fantasma svg { width: 100%; height: 100%; }
  .equip-boneco .eq-slot .rot { top: calc(100% + 2px); bottom: auto; left: -14px; right: -14px; font-size: 10.5px; font-weight: 700; line-height: 1; color: var(--madeira2); text-shadow: 0 1px 0 rgba(255,246,224,.9); pointer-events: none; }
  .equip-boneco .eq-slot.alvo-equip { outline: 3px solid #ffd23f; outline-offset: 1px; box-shadow: 0 0 14px 5px rgba(255,210,63,.85); animation: pulsaAlvo .6s ease-in-out infinite alternate; z-index: 3; }
  .equip-boneco .eq-slot.alvo-equip.nivel-baixo { outline-color: var(--vermelho); box-shadow: 0 0 12px 4px rgba(232,74,74,.75); }
  @keyframes pulsaAlvo { to { transform: scale(1.1); } }
  body.arrastando-equip #equip .equip-boneco { border-color: #e0a010; }
  #mochila .slot.arrasta-equip { cursor: grab; }
  #mochila.alvo-tira .mochila-grade { outline: 3px dashed #ffd23f; outline-offset: 3px; border-radius: 6px; }
  `;
  document.head.append(st);
})();

/* ---------- a tela do jogo cabe na janela ----------
   No computador, a altura do #tela é o menor valor entre a proporção 16:10 e o espaço que sobra
   na janela depois do topo, da barra de atalhos e do chat. Assim a página não precisa rolar. */
function encaixaTela() {
  const tela = document.getElementById('tela'); if (!tela) return;
  if (innerWidth <= 900 || document.getElementById('app')?.hidden) { tela.style.height = ''; tela.style.aspectRatio = ''; return; }
  const topo = document.getElementById('topo'), barra = document.getElementById('barraAcoes'), log = document.getElementById('log');
  const w = tela.getBoundingClientRect().width; if (!w) return;
  const topoH = topo ? topo.getBoundingClientRect().height : 0;
  document.documentElement.style.setProperty('--topoH', Math.ceil(topoH) + 'px'); // colunas de painéis também cabem abaixo do topo
  const resto = (barra ? barra.offsetHeight : 0) + (log ? log.offsetHeight : 0) + 16 /* gaps */ + 20 /* padding */ + 6;
  const h = Math.floor(Math.max(300, Math.min(w / 1.6, innerHeight - topoH - resto)));
  if (Math.abs((parseFloat(tela.style.height) || 0) - h) > 1) { tela.style.aspectRatio = 'auto'; tela.style.height = h + 'px'; }
}
(function () {
  let pend = false;
  const agenda = () => { if (pend) return; pend = true; setTimeout(() => { pend = false; try { encaixaTela(); } catch (e) { } }, 30); };
  addEventListener('resize', agenda);
  // reserva: se algum navegador não avisar a mudança de tamanho, confere a cada segundo
  let ultTam = '';
  setInterval(() => { const tam = innerWidth + 'x' + innerHeight; if (tam !== ultTam) { ultTam = tam; agenda(); } }, 1000);
  const liga = () => {
    const alvos = ['colJogo', 'topo', 'barraAcoes'].map(id => document.getElementById(id)).filter(Boolean);
    if (window.ResizeObserver) { const ro = new ResizeObserver(agenda); alvos.forEach(a => ro.observe(a)); }
    agenda(); setTimeout(agenda, 300);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', liga); else liga();
  const _iniciarJogoEnc = iniciarJogo;
  iniciarJogo = async function (...a) { const r = await _iniciarJogoEnc.apply(this, a); agenda(); setTimeout(agenda, 200); return r; };
})();
