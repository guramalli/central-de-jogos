// Jocelino — pesca_jogo.js — a pesca no mundo (o Stardew): com a vara na mão, segurar enche a força e soltar lança a boia
// na água à frente; a boia espera, afunda com "!" e o clique fisga; o minijogo da barra decide. Andar, trocar de item,
// trocar de mapa, abrir um menu ou dormir recolhe a linha. As regras estão em pesca.js.

const VARAS = ['vara', 'vara_boa', 'molinete'];
const LINHA = { ESPERA: [2, 8], JANELA: 1, VEL_FORCA: 1.4, CUSTO: 3 };
INICIADORES.push(s => { const p = s.pesca || {}; G.pesca = { covos: (p.covos || []).map(c => Object.assign({}, c)), lendarios: (p.lendarios || []).slice(), varaDada: !!p.varaDada, dicaLendario: p.dicaLendario || 0 }; G.linha = null; if (G.jog) G.jog.pescando = false; });
COLETORES.push(s => { s.pesca = JSON.parse(JSON.stringify(G.pesca)); });

// Água de pesca: mar ou rio dentro do mapa, fora das tábuas do píer e da ponte da mata (por baixo delas o chão é água).
const dentroMapa = (b, x, y) => x >= 0 && y >= 0 && x < b.larg && y < b.alt;
function naPonte(b, x, y) {
  if (b.id === 'praia' && typeof PRAIA !== 'undefined') return x >= PRAIA.PIER_X && x < PRAIA.PIER_X + 2 && y >= PRAIA.MAR_Y && y <= PRAIA.PIER_FIM;
  if (b.id === 'mata' && typeof MATA !== 'undefined') return x >= MATA.PONTE_X && x < MATA.PONTE_X + 2 && y >= MATA.RIO_Y && y < MATA.RIO_Y + MATA.RIO_ALTURA;
  return false;
}
const aguaDePesca = (b, x, y) => dentroMapa(b, x, y) && b.ehAgua(x, y) && !naPonte(b, x, y);
function localDaPesca(b, tx, ty) {
  if (!aguaDePesca(b, tx, ty)) return '';
  if (b.id === 'alto_mar') return 'alto';
  return b.chaoEm(tx, ty) === CH.RIO ? 'rio' : 'mar';
}
// Fundo: a boia a 3+ ladrilhos de chão que não é água (a ponta do píer); no rio da mata, o poço da cachoeira (x ≤ 7).
function ehFundo(b, tx, ty) {
  if (b.id === 'mata' && tx <= 7) return true;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = tx + dx, y = ty + dy; if (dentroMapa(b, x, y) && !aguaDePesca(b, x, y)) return false; }   // além da borda o mar continua
  return true;
}
const segurandoPesca = () => G.mouse.segura || G.teclas.has('Space') || G.teclas.has(TECLAS.usar);
function varaNaMao(id) {
  if (!VARAS.includes(id)) return false;
  if (G.linha) return true;   // o ATUALIZADOR cuida do resto (soltar, fisgar, recolher)
  if (G.jog.carga && G.jog.carga.id) { avisar('Primeiro largue o que está carregando.'); return true; }
  const custo = LINHA.CUSTO * (typeof Habilidades !== 'undefined' ? Habilidades.custo('vara') / CUSTO_GOLPE : 1);
  if (G.energia < custo) { avisar('O Jocelino está esgotado. Coma alguma coisa ou vá dormir.'); return true; }
  G.linha = { fase: 'carregando', forca: 0, sobe: true, t: 0, custo, vara: id };
  G.jog.pescando = true;
  return true;
}
function recolherLinha(motivo) {
  if (!G.linha) return;
  G.linha = null; if (G.jog) G.jog.pescando = false;
  if (motivo) avisar(motivo);
}
function lancar() {
  const L = G.linha, p = G.jog.ladrilho(), v = DIR_VET[G.jog.dir], b = G.mapa;
  let dist = 1 + Math.round(L.forca * 4); while (dist > 1 && !dentroMapa(b, p.x + v[0] * dist, p.y + v[1] * dist)) dist--;   // a boia fica dentro do mapa
  const tx = p.x + v[0] * dist, ty = p.y + v[1] * dist, local = localDaPesca(b, tx, ty);
  G.jog.pescando = false;
  if (!local) { recolherLinha('A linha caiu na terra.'); return; }
  G.energia = Math.max(0, G.energia - L.custo); hudSujo();
  const isca = L.vara !== 'vara' && (G.mochila.total('isca') > 0 || G.mochila.total('minhoca') > 0);
  const espera = (LINHA.ESPERA[0] + Math.random() * (LINHA.ESPERA[1] - LINHA.ESPERA[0])) * (isca ? 0.5 : 1);
  Object.assign(L, { fase: 'esperando', tx, ty, local, fundo: ehFundo(b, tx, ty), cardume: typeof cardumeEm === 'function' && cardumeEm(tx, ty), isca, espera, t: 0, px: G.jog.x, py: G.jog.y });
  sons.tocar('agua', 1.2, 0.05, -6);
}
function fisgarAgora() {
  const L = G.linha;
  if (L.isca) G.mochila.remover(G.mochila.total('isca') > 0 ? 'isca' : 'minhoca', 1);
  const r = Pesca.fisgar({ local: L.local, dia: G.dia, minutos: G.minutos, chove: typeof Clima !== 'undefined' && Clima.chove(G.dia), fundo: L.fundo, cardume: L.cardume, isca: L.isca });
  if (r.tipo === 'lixo') { const s = G.mochila.adicionar('ferro_velho', 1); if (s) soltar('ferro_velho', 1, G.jog.x, G.jog.y); recolherLinha('Veio um ferro velho enganchado.'); hudSujo(); return; }
  if (r.tipo === 'nada') { recolherLinha('Nada mordeu aqui agora.'); return; }
  const nivel = typeof Habilidades !== 'undefined' ? Habilidades.nivel('pesca') : 0;
  const chanceBau = (typeof Habilidades !== 'undefined' && Habilidades.tem('cacador_de_tesouro')) ? 0.3 : 0.15;
  L.fase = 'minijogo'; L.lendario = r.tipo === 'lendario';
  L.est = Pescaria.novo(r.id, { faixa: Pesca.faixa(nivel, L.vara === 'molinete'), bau: Math.random() < chanceBau });
  G.jog.pescando = true; sons.tocar('pegar', 0.7, 0.05, -4);
}
// O peixe pego: o item (+1 na perfeita), a experiência e o baú.
function pegouPeixe(id, est, lendario) {
  const qtd = 1 + (est.perfeita && !lendario ? 1 : 0), sobra = G.mochila.adicionar(id, qtd);
  if (sobra) soltar(id, sobra, G.jog.x, G.jog.y);
  if (lendario) { G.pesca.lendarios.push(id); sons.tocar('fanfarra', 1, 0, -4); avisar(`LENDÁRIO! ${Itens.nome(id)}!`); }
  else avisar(`${est.perfeita ? 'Perfeito! ' : ''}+ ${Itens.qtd(qtd, id)}`);
  if (typeof Habilidades !== 'undefined' && 'pesca' in G.hab.xp) Habilidades.ganhar('pesca', Pesca.xp(id, est.perfeita, lendario));
  if (est.bau && est.bau.pego && typeof abrirBauPesca === 'function') abrirBauPesca();
  sons.tocar('pegar', 1, 0.05, -4); hudSujo();
}
let _segurouAntes = false;
ATUALIZADORES.push(dt => {
  const L = G.linha, seg = segurandoPesca(), aperta = seg && !_segurouAntes, solta = !seg && _segurouAntes;
  _segurouAntes = seg;
  if (!L) { if (G.jog && G.jog.pescando) G.jog.pescando = false; return; }
  // Saídas que recolhem: menu aberto, outro item na mão, andar (fora do minijogo e da força).
  if (menuAberto()) { recolherLinha(); return; }
  if (!VARAS.includes(itemDaMao())) { recolherLinha(); return; }
  const anda = [TECLAS.esquerda, TECLAS.direita, TECLAS.cima, TECLAS.baixo, 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some(k => G.teclas.has(k));
  if (anda && (L.fase === 'esperando' || L.fase === 'mordeu')) { recolherLinha(); return; }
  L.t += dt;
  if (L.fase === 'carregando') {
    L.forca += (L.sobe ? 1 : -1) * LINHA.VEL_FORCA * dt; if (L.forca >= 1) { L.forca = 1; L.sobe = false; } if (L.forca <= 0) { L.forca = 0; L.sobe = true; }
    if (!seg) lancar();
    return;
  }
  if (L.fase === 'esperando') {
    if (aperta) { recolherLinha(); return; }
    if (L.t >= L.espera) { L.fase = 'mordeu'; L.t = 0; sons.tocar('agua', 0.7, 0.05, -2); }
    return;
  }
  if (L.fase === 'mordeu') {
    if (aperta) { fisgarAgora(); return; }
    if (L.t > LINHA.JANELA) recolherLinha('Escapou...');
    return;
  }
  if (L.fase === 'minijogo') {
    const fim = Pescaria.passo(L.est, dt, seg);
    if (fim === 'pegou') { const est = L.est, lend = L.lendario; recolherLinha(); pegouPeixe(est.id, est, lend); }
    else if (fim === 'escapou') { recolherLinha('O peixe escapou!'); if (typeof Habilidades !== 'undefined' && 'pesca' in G.hab.xp) Habilidades.ganhar('pesca', 1); }
  }
});
AO_ENTRAR_MAPA.push(() => recolherLinha());
NOITE.push(() => recolherLinha());

// ---------- o desenho: a linha e a boia no mundo; a força (HTML); o minijogo por cima da tela ----------
EXTRAS_MUNDO.push(m => {
  const L = G.linha; if (!L || L.tx == null || G.mapa !== m) return [];
  const bx = (L.tx + 0.5) * TILE, by = (L.ty + 0.6) * TILE + (L.fase === 'mordeu' ? 6 : Math.sin(L.t * 3) * 2);
  return [{ y: by, desenha(ctx) {
    const v = DIR_VET[G.jog.dir], px = G.jog.x + v[0] * 30, py = G.jog.y - 70, lin = spr('fx/linha_pesca');
    if (lin) { const dx = bx - px, dy = by - py; ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(dy, dx)); ctx.drawImage(lin, 0, -2, Math.hypot(dx, dy), 4); ctx.restore(); }
    desenhaPe(ctx, 'fx/boia', bx, by, 1);
    if (L.fase === 'mordeu') desenhaPe(ctx, 'fx/exclamacao', bx, by - 26, 1);
  } }];
});
ATUALIZADORES.push(() => {
  const L = G.linha, mostra = !!(L && L.fase === 'carregando');
  if (!HUD.forca) { if (!$('#hud')) return; HUD.forca = el('div', { class: 'forca-pesca', hidden: true }, HUD.forcaNivel = el('div')); $('#hud').append(HUD.forca); }
  HUD.forca.hidden = !mostra;
  if (mostra) { const p = telaDoMundo(G.jog.x + 36, G.jog.y - 90); HUD.forca.style.left = p.x + 'px'; HUD.forca.style.top = p.y + 'px'; HUD.forcaNivel.style.height = (L.forca * 114) + 'px'; }
});
const telaDoMundo = (x, y) => ({ x: (x - G.cam.x) * G.zoom, y: (y - G.cam.y) * G.zoom });
DESENHOS_TELA.push(ctx => {
  const L = G.linha; if (!L || L.fase !== 'minijogo') return;
  const e = L.est, mold = spr('ui/pesca_moldura'); if (!mold) return;
  const p = telaDoMundo(G.jog.x + 60, G.jog.y - 40), H = Math.min(G.alt * 0.62, mold.naturalHeight * 1.2), W = mold.naturalWidth * H / mold.naturalHeight;
  const x = Math.min(G.larg - W - 10, p.x), y = Math.max(10, p.y - H);
  // O trilho e o medidor dentro da moldura, medidos na arte (frações da largura e da altura).
  const TR = { x: x + W * 0.2, w: W * 0.3818, y: y + H * 0.0637, h: H * 0.8742 }, MD = { x: x + W * 0.7152, w: W * 0.097, y: y + H * 0.0621, h: H * 0.8742 };
  ctx.drawImage(mold, x, y, W, H);
  const fx = spr('ui/pesca_faixa'); if (fx) ctx.drawImage(fx, TR.x, TR.y + TR.h * (1 - e.faixaY - e.faixaH), TR.w, TR.h * e.faixaH);
  const med = spr('ui/pesca_medidor'); if (med) { const f = Math.max(0, Math.min(1, e.medidor)); ctx.drawImage(med, 0, med.naturalHeight * (1 - f), med.naturalWidth, med.naturalHeight * f, MD.x, MD.y + MD.h * (1 - f), MD.w, MD.h * f); }
  if (e.bau && e.bau.visivel && !e.bau.pego) { const b = spr('ui/pesca_bau'); if (b) ctx.drawImage(b, TR.x + TR.w / 2 - 16, TR.y + TR.h * (1 - e.bau.y) - 16, 32, 32); }
  const pe = spr('ui/pesca_peixe'); if (pe) ctx.drawImage(pe, TR.x + TR.w / 2 - 16, TR.y + TR.h * (1 - e.pos) - 16, 32, 32);
});
