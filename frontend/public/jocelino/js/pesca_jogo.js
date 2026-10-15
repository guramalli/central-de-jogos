// Jocelino — pesca_jogo.js — a pesca no mundo (o Stardew): com a vara na mão, segurar enche a força e soltar lança a boia
// na água à frente; a boia espera, afunda com "!" e o clique fisga; o minijogo da barra decide. Andar, trocar de item,
// trocar de mapa, abrir um menu ou dormir recolhe a linha. As regras estão em pesca.js.

const VARAS = ['vara', 'vara_boa', 'molinete'];
const LINHA = { ESPERA: [2, 8], JANELA: 1, VEL_FORCA: 1.4, CUSTO: 3 };
INICIADORES.push(s => { const p = s.pesca || {}; G.pesca = { covos: (p.covos || []).map(c => Object.assign({}, c)), lendarios: (p.lendarios || []).slice(), varaDada: !!p.varaDada, dicaLendario: p.dicaLendario || 0, serra: (p.serra || []).slice() }; G.linha = null; if (G.jog) G.jog.pescando = false; });
COLETORES.push(s => { s.pesca = JSON.parse(JSON.stringify(G.pesca)); });

// Água de pesca: mar ou rio dentro do mapa, fora das tábuas do píer e da ponte da mata (por baixo delas o chão é água).
const dentroMapa = (b, x, y) => x >= 0 && y >= 0 && x < b.larg && y < b.alt;
function naPonte(b, x, y) {
  if (b.id === 'praia' && typeof PRAIA !== 'undefined') return x >= PRAIA.PIER_X && x < PRAIA.PIER_X + 2 && y >= PRAIA.MAR_Y && y <= PRAIA.PIER_FIM;
  if (b.id === 'alto_mar' && typeof ALTO !== 'undefined') { const C = ALTO.CONVES; return x >= C.x && x < C.x + C.w && y >= C.y && y < C.y + C.h; }
  if (b.id === 'mata' && typeof MATA !== 'undefined') return x >= MATA.PONTE_X && x < MATA.PONTE_X + 2 && y >= MATA.RIO_Y && y < MATA.RIO_Y + MATA.RIO_ALTURA;
  if (b.id === 'serra' && typeof SERRA !== 'undefined') return naSerraR(SERRA.PINGUELA, x, y);   // (T4 da mata) a pinguela: o tronco por cima do rio
  return false;
}
const aguaDePesca = (b, x, y) => dentroMapa(b, x, y) && b.ehAgua(x, y) && !naPonte(b, x, y);
function localDaPesca(b, tx, ty) {
  if (!aguaDePesca(b, tx, ty)) return '';
  if (b.id === 'alto_mar') return 'alto';
  if (b.id === 'serra') return 'serra';   // (T4 da mata) o rio da serra, os poções e o poço da Cachoeira Grande
  return b.chaoEm(tx, ty) === CH.RIO ? 'rio' : 'mar';
}
// Fundo: a boia a 3+ ladrilhos de chão que não é água (a ponta do píer); no rio da mata, o poço da cachoeira (x ≤ 7); na serra, só o
// poço da Cachoeira Grande (SERRA.POCO: o rio e os poções são rasos).
function ehFundo(b, tx, ty) {
  if (b.id === 'mata' && tx <= 7) return true;
  if (b.id === 'serra') return typeof SERRA !== 'undefined' && naSerraR(SERRA.POCO, tx, ty) && aguaDePesca(b, tx, ty);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = tx + dx, y = ty + dy; if (dentroMapa(b, x, y) && !aguaDePesca(b, x, y)) return false; }   // além da borda o mar continua
  return true;
}
const segurandoPesca = () => G.mouse.segura || G.teclas.has('Space') || G.teclas.has(TECLAS.usar);
let _esperaSoltar = false;   // a linha acabou com o botão apertado: só lança de novo depois de soltar (como no Stardew)
// ---------- a primeira pescaria (o Willy dá a vara no Stardew; o Dave pausa e mostra cada coisa) ----------
// A aula do Seu Lourival: uma conversa curta na primeira vez com a vara na mão perto da água (G.limpou.pesca_aula).
// Quem já pescou (save antigo) não ouve: nada trava o lançamento de quem já sabe.
const AULA_PESCA = ['Vai pescar, compadre? Presta atenção que eu te ensino.',
  'Fique perto da água e segure o botão: a força sobe. Solte para jogar a boia.',
  'Agora espere a boia afundar. Quando aparecer o "!", clique rápido para fisgar.',
  'Depois vem a barrinha. Segure para a faixa verde subir e solte para ela descer. Deixe o peixe dentro da faixa até o medidor encher. Se o peixe ficar fora, o medidor esvazia e ele escapa.'];
const jaPescou = () => typeof jaFezTela === 'function' ? jaFezTela('pesca') : !!(G.hab && G.hab.xp && G.hab.xp.pesca >= 5);   // (o 1º peixe pego)
function pertoDaAgua(raio) {
  const b = G.mapa, p = G.jog && G.jog.ladrilho(); if (!b || !p || !b.ehAgua) return false;
  for (let dy = -raio; dy <= raio; dy++) for (let dx = -raio; dx <= raio; dx++) if (aguaDePesca(b, p.x + dx, p.y + dy)) return true;
  return false;
}
function aulaDaPesca(raio) {
  if (!G.limpou || G.limpou.pesca_aula || jaPescou() || menuAberto() || !pertoDaAgua(raio)) return false;
  G.limpou.pesca_aula = 1;
  abrirConversa('Seu Lourival', urlArte('retratos/lourival_normal'), AULA_PESCA);
  return true;
}
const aulaVista = () => !!(G.limpou && G.limpou.pesca_aula) || jaPescou();
function varaNaMao(id) {
  if (!VARAS.includes(id)) return false;
  if (G.linha || _esperaSoltar) return true;   // o ATUALIZADOR cuida do resto (soltar, fisgar, recolher)
  if (aulaDaPesca(5)) return true;   // (a primeira vez) apertou antes de chegar bem perto: a aula vem antes do lançamento
  if (G.jog.carga && G.jog.carga.id) { avisar('Primeiro largue o que está carregando.'); return true; }
  const custo = LINHA.CUSTO * (typeof Habilidades !== 'undefined' ? Habilidades.custo('vara') / CUSTO_GOLPE : 1);
  if (G.energia < custo) { avisar('O Jocelino está esgotado. Coma alguma coisa ou vá dormir.'); return true; }
  G.linha = { fase: 'carregando', forca: 0, sobe: true, t: 0, custo, vara: id };
  G.jog.pescando = true;
  return true;
}
function recolherLinha(motivo) {
  if (!G.linha) return;
  _esperaSoltar = segurandoPesca();
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
  // A isca da vara boa e do molinete: a isca boa primeiro (Pesca 8: morde na hora), depois a isca e a minhoca. A Mordida ligeira
  // (Pesca 4) tira 15% da espera. (T4b)
  const isca = L.vara === 'vara' ? '' : ['isca_boa', 'isca', 'minhoca'].find(i => G.mochila.total(i) > 0) || '';
  const ligeira = typeof Habilidades !== 'undefined' && Habilidades.ganho('mordida_ligeira') ? ECO.niveis.mordida : 1;
  const espera = isca === 'isca_boa' ? ECO.niveis.iscaBoa.espera : (LINHA.ESPERA[0] + Math.random() * (LINHA.ESPERA[1] - LINHA.ESPERA[0])) * (isca ? 0.5 : 1) * ligeira;
  Object.assign(L, { fase: 'esperando', tx, ty, local, fundo: ehFundo(b, tx, ty), cardume: typeof cardumeEm === 'function' && cardumeEm(tx, ty), isca, espera, t: 0, px: G.jog.x, py: G.jog.y });
  // (T4 da mata) A 1ª boia no poço da Cachoeira Grande: a seta da pesca da serra some, e o aviso diz o porquê do poço.
  if (local === 'serra' && L.fundo && G.limpou && !G.limpou.pesca_serra) { G.limpou.pesca_serra = 1; avisar(FALA_POCO_SERRA); }
  sons.tocar('agua', 1.2, 0.05, -6);
}
function fisgarAgora() {
  const L = G.linha;
  if (L.isca) G.mochila.remover(G.mochila.total(L.isca) > 0 ? L.isca : ['isca_boa', 'isca', 'minhoca'].find(i => G.mochila.total(i) > 0) || L.isca, 1);
  const r = Pesca.fisgar({ local: L.local, dia: G.dia, minutos: G.minutos, chove: typeof Clima !== 'undefined' && Clima.chove(G.dia), fundo: L.fundo, cardume: L.cardume, isca: L.isca });
  if (r.tipo === 'lixo') { const s = G.mochila.adicionar('ferro_velho', 1); if (s) soltar('ferro_velho', 1, G.jog.x, G.jog.y); recolherLinha('Veio um ferro velho enganchado.'); hudSujo(); return; }
  if (r.tipo === 'nada') { recolherLinha('Nada mordeu aqui agora.'); return; }
  const nivel = typeof Habilidades !== 'undefined' ? Habilidades.nivel('pesca') : 0;
  const chanceBau = (typeof Habilidades !== 'undefined' && Habilidades.tem('cacador_de_tesouro')) ? 0.3 : 0.15;
  L.fase = 'minijogo'; L.lendario = r.tipo === 'lendario';
  const firme = typeof Habilidades !== 'undefined' && Habilidades.ganho('linha_firme') ? ECO.niveis.linhaFirme : 1;   // (T4b, Pesca 7)
  L.est = Pescaria.novo(r.id, { faixa: Pesca.faixa(nivel, L.vara === 'molinete'), bau: Math.random() < chanceBau, esvazia: 0.18 * firme });
  // O primeiro minijogo começa parado, com a explicação por cima, até o clique (G.limpou.pesca_minijogo).
  L.pausa = !!G.limpou && !G.limpou.pesca_minijogo && !jaPescou();
  G.jog.pescando = true; sons.tocar('pegar', 0.7, 0.05, -4);
}
// O peixe pego: o item (+1 na perfeita), a experiência e o baú.
function pegouPeixe(id, est, lendario) {
  const qtd = 1 + (est.perfeita && !lendario ? 1 : 0), sobra = G.mochila.adicionar(id, qtd);
  if (sobra) soltar(id, sobra, G.jog.x, G.jog.y);
  // (T4 da mata) O 1º de cada peixe da serra: o aviso conta o que ele é (uma vez só); a lista vai para a linha da Caderneta.
  const novoDaSerra = PEIXES_SERRA.includes(id) && G.pesca.serra && !G.pesca.serra.includes(id);
  if (novoDaSerra) G.pesca.serra.push(id);
  if (lendario) { G.pesca.lendarios.push(id); sons.tocar('fanfarra', 1, 0, -4); avisar(`LENDÁRIO! ${Itens.nome(id)}!`); }
  else avisar(`${est.perfeita ? 'Perfeito! ' : ''}+ ${Itens.qtd(qtd, id)}${novoDaSerra && FALA_PEIXE_SERRA[id] ? '. ' + FALA_PEIXE_SERRA[id] : ''}`);
  if (typeof Habilidades !== 'undefined' && 'pesca' in G.hab.xp) Habilidades.ganhar('pesca', Pesca.xp(id, est.perfeita, lendario));
  if (est.bau && est.bau.pego && typeof abrirBauPesca === 'function') abrirBauPesca();
  sons.tocar('pegar', 1, 0.05, -4); hudSujo();
}
let _segurouAntes = false;
ATUALIZADORES.push(dt => {
  const L = G.linha, seg = segurandoPesca(), aperta = (seg && !_segurouAntes) || !!G.mouse.apertou, solta = !seg && _segurouAntes;
  G.mouse.apertou = false;   // o aperto guardado vale para um quadro
  _segurouAntes = seg;
  if (!seg) _esperaSoltar = false;
  if (!L) {
    if (G.jog && G.jog.pescando) G.jog.pescando = false;
    if (G.jog && !seg && G.limpou && !G.limpou.pesca_aula && VARAS.includes(itemDaMao())) aulaDaPesca(3);   // a aula do Lourival, perto da água
    return;
  }
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
    if (L.pausa) { if (aperta) { L.pausa = false; if (G.limpou) G.limpou.pesca_minijogo = 1; } return; }   // o peixe e o medidor esperam o clique
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
    const pt = poseDaVara(G.jog).ponta, px = pt.x, py = pt.y, lin = spr('fx/linha_pesca');
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
  // (a primeira vez) espaço dos dois lados para as setas e as frases da explicação
  const folga = L.pausa ? Math.min(330, Math.max(10, (G.larg - W) / 2)) : 10;
  const x = Math.max(L.pausa ? folga : -1e9, Math.min(G.larg - W - folga, p.x)), y = Math.max(10, p.y - H);
  if (L.pausa) { ctx.save(); ctx.fillStyle = 'rgba(8, 14, 16, 0.45)'; ctx.fillRect(0, 0, G.larg, G.alt); ctx.restore(); }
  // O trilho e o medidor dentro da moldura, medidos na arte (frações da largura e da altura).
  const TR = { x: x + W * 0.2, w: W * 0.3818, y: y + H * 0.0637, h: H * 0.8742 }, MD = { x: x + W * 0.7152, w: W * 0.097, y: y + H * 0.0621, h: H * 0.8742 };
  ctx.drawImage(mold, x, y, W, H);
  const fx = spr('ui/pesca_faixa'); if (fx) ctx.drawImage(fx, TR.x, TR.y + TR.h * (1 - e.faixaY - e.faixaH), TR.w, TR.h * e.faixaH);
  const med = spr('ui/pesca_medidor'); if (med) { const f = Math.max(0, Math.min(1, e.medidor)); ctx.drawImage(med, 0, med.naturalHeight * (1 - f), med.naturalWidth, med.naturalHeight * f, MD.x, MD.y + MD.h * (1 - f), MD.w, MD.h * f); }
  if (e.bau && e.bau.visivel && !e.bau.pego) { const b = spr('ui/pesca_bau'); if (b) ctx.drawImage(b, TR.x + TR.w / 2 - 16, TR.y + TR.h * (1 - e.bau.y) - 16, 32, 32); }
  const pe = spr('ui/pesca_peixe'); if (pe) ctx.drawImage(pe, TR.x + TR.w / 2 - 16, TR.y + TR.h * (1 - e.pos) - 16, 32, 32);
  if (L.pausa) explicaMinijogo(ctx, e, { x, y, W, H, TR, MD });
});
// O primeiro minijogo, parado: a seta (a arte ui/seta, só posicionada e girada) na faixa, no peixe e no medidor, cada uma com
// uma frase curta; embaixo, "Clique para começar". A seta da arte aponta para baixo: girar a − 90° aponta para o ângulo a.
function explicaMinijogo(ctx, e, { x, y, W, H, TR, MD }) {
  const seta = spr('ui/seta'), sw = 68 * 0.62, sh = 96 * 0.62, bob = Math.sin((G.agora || 0) * 6) * 5;
  const aponta = (px, py, ang) => {   // a ponta da seta em (px, py), vindo do lado oposto ao ângulo
    if (!seta) return; ctx.save(); ctx.translate(px - Math.cos(ang) * (sh / 2 + 4 + bob), py - Math.sin(ang) * (sh / 2 + 4 + bob)); ctx.rotate(ang - Math.PI / 2); ctx.drawImage(seta, -sw / 2, -sh / 2, sw, sh); ctx.restore();
  };
  // As linhas de uma frase com a borda (direita ou esquerda) em bx, centradas na altura cy.
  const frase = (linhas, bx, cy, lado) => {
    ctx.save(); ctx.font = '900 16px Nunito'; const larg = Math.max(...linhas.map(l => ctx.measureText(l).width)); ctx.restore();
    const cx = lado < 0 ? bx - larg / 2 : bx + larg / 2, y0 = cy - (linhas.length - 1) * 10 + 6;
    ctx.save(); linhas.forEach((l, i) => texto(ctx, l, cx, y0 + i * 20, 16, i ? '#ffffff' : '#fff4cf', '900')); ctx.restore();
  };
  const yPeixe = TR.y + TR.h * (1 - e.pos), yFaixa = TR.y + TR.h * (1 - e.faixaY - e.faixaH) + 12, yMed = MD.y + MD.h * 0.5;
  // a faixa: da esquerda, apontando para a direita, na beira de cima da faixa
  aponta(TR.x - 2, yFaixa, 0); frase(['Faixa verde:', 'segure para subir,', 'solte para descer.'], TR.x - sh - 14, yFaixa, -1);
  // o peixe: de cima, dentro do trilho, apontando para baixo; a frase à esquerda, mais acima
  const topoSeta = yPeixe - 18 - sh - 8;
  aponta(TR.x + TR.w / 2, yPeixe - 18, Math.PI / 2); frase(['O peixe:', 'deixe ele dentro', 'da faixa verde.'], x - 8, Math.min(topoSeta + sh / 2, yFaixa - 78), -1);
  // o medidor: da direita, apontando para a esquerda
  aponta(x + W + 2, yMed, Math.PI); frase(['Medidor: enche com', 'o peixe na faixa.', 'Fora dela, esvazia', 'e o peixe escapa.'], x + W + sh + 14, yMed, 1);
  // o começo
  const yc = y >= 44 ? y - 16 : Math.min(y + H + 34, G.alt - 110);   // em cima da moldura (embaixo, a barra de itens cobre)
  ctx.save(); ctx.globalAlpha = 0.88 + 0.12 * Math.sin((G.agora || 0) * 5); texto(ctx, 'Clique para começar', x + W / 2, yc, 22, '#fff4cf', '900'); ctx.restore();
}

// ---------- a banca do Seu Lourival (o Willy): vende peixe; compra isca, covo e a vara boa ----------
const PRECO_BANCA = ECO.lojas.banca;
const PEDE_PESCA = { vara_boa: 2 };
// O preço na banca (a vara boa sai pela metade com o Aquário do Grêmio pronto).
function precoBanca(id) { return Math.max(1, Math.round(PRECO_BANCA[id] * descontoHab() * (id === 'vara_boa' && typeof Gremio !== 'undefined' ? Gremio.fatorVaraBoa() : 1))); }
let _abaBanca = 0;
function abrirBanca() {
  if (relogio.domingo() || G.minutos < 7 * 60 || G.minutos >= 17 * 60) { abrirConversa('Seu Lourival', urlArte('retratos/lourival_normal'), [relogio.domingo() ? 'Domingo a banca descansa, compadre.' : 'A banca abre das 7h às 17h.']); return true; }
  if (!G.pesca.varaDada && G.mochila.total('vara') < 1 && G.mochila.cabe('vara')) { G.mochila.adicionar('vara', 1); G.pesca.varaDada = true; hudSujo(); avisar('O Lourival te deu uma vara de bambu!'); }
  const caixa = el('div', { class: 'painel' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px;display:flex;justify-content:space-between' }, el('span', {}, 'Banca do Seu Lourival'), el('span', {}, 'Cr$ ' + G.dinheiro)));
    caixa.append(el('div', { class: 'abas' }, ['Vender', 'Comprar'].map((n, i) => el('div', { class: 'aba' + (i === _abaBanca ? ' ativa' : ''), onclick: e => { e.stopPropagation(); _abaBanca = i; desenha(); } }, n))));
    let linhas;
    if (_abaBanca === 0) {
      const ids = [...new Set(G.mochila.slots.filter(Boolean).map(s => s.id))].filter(id => DADOS_PEIXE[id]);
      linhas = ids.map(id => el('div', { class: 'linha', onclick: e => { e.stopPropagation(); const n = e.shiftKey ? G.mochila.total(id) : 1; G.mochila.remover(id, n); const v = n * precoPeixe(id); G.dinheiro += v; G.ganhoHoje += v; sons.tocar('dinheiro', 1.1, 0.05, -4); avisar(`Vendeu ${Itens.qtd(n, id)} por Cr$ ${v}.`); hudSujo(); desenha(); } },
        el('img', { src: urlItem(id) }), el('div', {}, Itens.nome(id), el('div', { class: 'tem' }, 'tem ' + G.mochila.total(id))), el('span', { class: 'preco' }, 'Cr$ ' + precoPeixe(id))));
      if (!linhas.length) linhas = [el('div', { class: 'rodape' }, 'Nenhum peixe na mochila.')];
    } else {
      linhas = Object.keys(PRECO_BANCA).map(id => { const pede = PEDE_PESCA[id], trava = pede && Habilidades.nivel('pesca') < pede, preco = precoBanca(id);
        return el('div', { class: 'linha' + (trava ? ' trancado' : ''), onclick: e => { e.stopPropagation(); if (trava) { avisar(`Isso pede Pesca ${pede}.`); return; } _comprar(id, e.shiftKey && id === 'isca' ? 5 : 1, preco); desenha(); } },
          el('img', { src: urlItem(id) }), el('div', {}, Itens.nome(id), trava ? el('div', { class: 'tem' }, `pede Pesca ${pede}`) : el('div', { class: 'tem' }, 'tem ' + G.mochila.total(id))), el('span', { class: 'preco' }, 'Cr$ ' + preco)); });
    }
    caixa.append(el('div', { class: 'grade' }, ...linhas), el('div', { class: 'rodape' }, 'Clique: 1 · Shift+clique: tudo (vender) ou 5 iscas'));
  };
  desenha(); abrirModal(caixa); sons.tocar('abrir', 1.1, 0.03, -6); return true;
}


// A minhoca: cavar grama com a pá às vezes dá uma (8%; 16% com o Minhoqueiro, Pesca 3), em qualquer mapa.
const chanceMinhoca = () => 0.08 * (typeof Habilidades !== 'undefined' && Habilidades.ganho('minhoqueiro') ? ECO.niveis.minhoca : 1);
function minhocaAoCavar(alvo, rng = Math.random) { if (rng() < chanceMinhoca()) soltar('minhoca', 1, (alvo.x + 0.5) * TILE, (alvo.y + 0.7) * TILE); }

// ---------- o covo de siri: na água da margem, com isca; de manhã tem coisa ----------
const margem = (b, x, y) => aguaDePesca(b, x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => dentroMapa(b, x + dx, y + dy) && !b.ehAgua(x + dx, y + dy));
function covoNoChao(t) {
  const b = G.mapa; if (!b || itemDaMao() !== 'covo') return false;
  if (!['praia', 'mata', 'serra'].includes(b.id)) { avisar('O covo vai na água da praia ou do rio.'); return true; }
  const p = G.jog.ladrilho(); if (Math.max(Math.abs(t.x - p.x), Math.abs(t.y - p.y)) > 1) { avisar('Chegue mais perto.'); return true; }
  if (!margem(b, t.x, t.y) || b.ocupado.has(chaveT(t.x, t.y))) { avisar('O covo vai na água, encostado na margem.'); return true; }
  G.pesca.covos.push({ mapa: b.id, x: t.x, y: t.y, isca: false, dentro: null }); G.mochila.remover('covo', 1);
  sons.tocar('agua', 0.9, 0.05, -4); poeCovos(b); hudSujo(); return true;
}
ACOES_NO_CHAO.push(covoNoChao);
function poeCovos(b) {
  for (const o of b.objs.filter(o => o.id === 'covo')) b.tirar(o);
  for (const c of G.pesca.covos.filter(c => c.mapa === b.id)) {
    const o = b.interativo('covo', 'objetos/covo', c.x, c.y, 1, 1, null, false); o.covo = c;
    o.acao = () => acaoNoCovo(o);
    o.ferramenta = (p, id) => { if (id === 'machado' || id === 'picareta') { G.pesca.covos = G.pesca.covos.filter(x => x !== c); const s = G.mochila.adicionar('covo', 1); if (s) soltar('covo', 1, p.x, p.y); poeCovos(G.mapa); hudSujo(); } };
  }
}
function acaoNoCovo(o) {
  const c = o.covo;
  if (c.dentro) { const s = G.mochila.adicionar(c.dentro.id, c.dentro.qtd); if (s) soltar(c.dentro.id, s, G.jog.x, G.jog.y);
    const novo = PEIXES_SERRA.includes(c.dentro.id) && G.pesca.serra && !G.pesca.serra.includes(c.dentro.id); if (novo) G.pesca.serra.push(c.dentro.id);   // (T4 da mata) o pitu do covo conta
    avisar('+ ' + Itens.qtd(c.dentro.qtd, c.dentro.id) + (novo && FALA_PEIXE_SERRA[c.dentro.id] ? '. ' + FALA_PEIXE_SERRA[c.dentro.id] : '')); Habilidades.ganhar('pesca', 3 * c.dentro.qtd); c.dentro = null; hudSujo(); return true; }
  if (c.isca || Habilidades.tem('isqueiro')) { abrirPlaca('O covo está iscado. Volte amanhã cedo.'); return true; }
  const isca = G.mochila.total('isca') ? 'isca' : G.mochila.total('minhoca') ? 'minhoca' : '';
  if (!isca) { abrirPlaca('O covo está vazio e sem isca. A banca do Lourival vende isca.'); return true; }
  G.mochila.remover(isca, 1); c.isca = true; sons.tocar('agua', 1.1, 0.05, -6); avisar('Covo iscado.'); hudSujo(); return true;
}
MANHA.push(() => { for (const c of G.pesca.covos) if (!c.dentro && (c.isca || Habilidades.tem('isqueiro'))) { c.dentro = Pesca.covoManha(c.mapa === 'mata' ? 'rio' : c.mapa === 'serra' ? 'serra' : 'mar')[0]; c.isca = false; } });
AO_MONTAR.push(b => { if (b.id === 'praia' || b.id === 'mata' || b.id === 'serra') poeCovos(b); });
TAREFAS.push(() => { const n = G.pesca ? G.pesca.covos.filter(c => c.dentro).length : 0; return n ? [{ texto: `Pesca: ${n} ${n === 1 ? 'covo tem' : 'covos têm'} coisa dentro` }] : []; });

// ---------- (T4 da mata) a pesca da serra: a 1ª vez no poço, o 1º de cada peixe e a linha da Caderneta ----------
// Como o Stardew (a coleção de peixes do menu, com o lugar, a estação e a hora de cada um): os 6 da serra, um de cada vez, com o
// porquê de onde e quando ele morde. O lambari e a traíra são do rio da mata e não contam aqui.
const PEIXES_SERRA = ['acara', 'jundia', 'mucum', 'tabarana', 'pitu', 'tabarana_ouro'];
const FALA_PEIXE_SERRA = { acara: 'Acará: o peixe manso do rio da serra.', jundia: 'Jundiá: o bagre da serra, que só sai de noite.',
  mucum: 'Muçum! Parece cobra, mas é peixe: só sai com chuva.', tabarana: 'Tabarana! A brava do poço da cachoeira: a Rosa vai querer.',
  pitu: 'Pitu: o camarão de água doce da serra. A Rosa usa na cozinha.' };
const QUANDO_PEIXE_SERRA = { acara: 'o acará: de dia, no rio da serra', jundia: 'o jundiá: de noite, no rio da serra', mucum: 'o muçum: com chuva, no outono e no inverno',
  tabarana: 'a tabarana: no poço da Cachoeira Grande, na primavera e no verão', pitu: 'o pitu: de noite no anzol, ou no covo do rio da serra',
  tabarana_ouro: 'a lendária, a Tabarana-de-Ouro: o Seu Lourival sabe quando ela sobe' };
const FALA_POCO_SERRA = 'O poço da Cachoeira Grande é fundo: a tabarana só morde aqui.';
const FRASE_PESCA_SERRA = 'O poço da cachoeira é fundo: a tabarana só morde aqui. Com a vara na mão, jogue a boia no poço';
const PONTO_POCO_SERRA = () => ({ x: (SERRA.POCO.x + 1.5) * TILE, y: (SERRA.POCO.y + 1) * TILE });   // a água do poço, ao lado do fim da trilha de oeste
// A 1ª pescaria na serra (toda 1ª vez tem seta + frase): com a vara na mochila e a cachoeira já conhecida, a seta vai no poço; some na
// 1ª boia que cai nele (lancar). Vem depois das setas da pinguela, da cachoeira e do 1º achado (guia_setas.js).
function alvoDaPescaDaSerra() {
  if (G.mapaId !== 'serra' || !G.mapa || !G.jog || !G.limpou || !G.limpou.serra_cachoeira || G.limpou.pesca_serra || typeof SERRA === 'undefined') return null;
  if (!VARAS.some(v => G.mochila.total(v) > 0)) return null;
  return { mapa: 'serra', ponto: PONTO_POCO_SERRA(), rotuloFixo: FRASE_PESCA_SERRA };
}
// O próximo peixe da serra que falta: o primeiro que dá para pegar nesta estação (o muçum só no outono e no inverno; a tabarana na
// primavera e no verão; a lendária só no verão), senão o primeiro que falta.
function proximoPeixeDaSerra() {
  const falta = PEIXES_SERRA.filter(id => !(G.pesca.serra || []).includes(id) && !G.pesca.lendarios.includes(id)), est = _estPesca(G.dia);
  const daEstacao = id => { const p = LUGARES_PESCA.serra.find(x => x.id === id) || LENDARIOS[id]; return !p || p.est.includes(est); };
  return falta.find(daEstacao) || falta[0] || '';
}
addEventListener('load', () => {
  if (typeof CADERNETA === 'undefined') return;
  CADERNETA.push(() => {
    if (typeof Mundo === 'undefined' || !Mundo.aberto('serra') || !G.limpou || !G.limpou.serra_cachoeira || !G.pesca) return [];
    const ja = PEIXES_SERRA.filter(id => (G.pesca.serra || []).includes(id) || G.pesca.lendarios.includes(id)).length, prox = proximoPeixeDaSerra();
    if (!prox) return [];
    return [{ id: 'serra_pesca', aba: 'vila', texto: `Os peixes da Mata da Serra: ${ja} de ${PEIXES_SERRA.length} pegos. Falta ${QUANDO_PEIXE_SERRA[prox]}`, feito: ja, meta: PEIXES_SERRA.length,
      alvo: () => G.mapaId === 'serra' ? { mapa: 'serra', ponto: ['tabarana', 'tabarana_ouro'].includes(prox) ? PONTO_POCO_SERRA() : { x: 21.5 * TILE, y: (SERRA.RIO_Y + 1) * TILE } }
        : G.mapaId === 'mata' ? { mapa: 'mata', ponto: { x: 27 * TILE, y: 22 * TILE } } : { mapa: 'mata' },
      rotulo: 'Com a vara na mão: jogue a boia aqui' }];
  });
});


function abrirBauPesca() {
  const r = Pesca.bau();
  if (r.dinheiro) { G.dinheiro += r.dinheiro; G.ganhoHoje += r.dinheiro; avisar(`Um baú! Dentro: Cr$ ${r.dinheiro}.`); }
  else { const s = G.mochila.adicionar(r.id, r.qtd); if (s) soltar(r.id, s, G.jog.x, G.jog.y); avisar(`Um baú! Dentro: ${Itens.qtd(r.qtd, r.id)}.`); }
  sons.tocar('fanfarra', 1.3, 0, -8); hudSujo();
}
function entregarLendarioARosa() {
  const id = Object.keys(LENDARIOS).find(k => G.mochila.total(k) > 0); if (!id) return false;
  G.mochila.remover(id, 1); if (G.pensao) G.pensao.curtidas += 10; hudSujo(); sons.tocar('fanfarra', 1, 0, -4);
  const um = ['tainha_rainha', 'traira_velha', 'tabarana_ouro'].includes(id) ? 'Uma' : 'Um';   // (T4 da mata) as lendárias
  abrirConversa('Rosa', urlArte('retratos/rosa_alegre'), [`Jocelino! ${um} ${Itens.nome(id)}?! A Vila inteira vai querer ver!`, 'Vou contar pra todo freguês. A pensão ficou mais famosa (+10 curtidas).']);
  return true;
}
ANTES_DE_CONVERSAR.push(p => p.id === 'rosa' && entregarLendarioARosa());   // a Rosa do quintal e a do salão
function conversaPadrao(p) { return Conversas.abrir(p); }   // (T2 das conversas) o motor de falas (conversas.js)
// O Lourival dá a dica de um lendário que falta, um por semana.
const DICAS_LENDARIO = { tainha_rainha: 'Dizem que no inverno, com chuva, a Tainha-Rainha passa no fundo da praia.', robalo_flecha: 'O Robalo-Flecha só aparece no verão, no fim da tarde, lá da ponta do píer.',
  bagre_assombrado: 'Tem um bagre no rio da mata que só morde depois da meia-noite. Assombrado, juram.', traira_velha: 'A Traíra-Velha mora no poço da cachoeira. Na primavera, com chuva, ela sai.',
  mero: 'Há 30 anos eu caço o mero lá no alto-mar. No outono, em cima de cardume... um dia a gente pega.',
  tabarana_ouro: 'No verão, de manhã, com chuva, a Tabarana-de-Ouro sobe a cachoeira. Lá na serra, no poço da Cachoeira Grande.' };
// (T4 da mata) A dica da lendária da serra só depois que a serra abre (antes, o lugar nem existe para o jogador). O mateiro (T6)
// conta a mesma: dicaDoLendario('tabarana_ouro').
const dicaDoLendario = id => G.pesca && G.pesca.lendarios.includes(id) ? '' : DICAS_LENDARIO[id] || '';
function dicaDoLourival() { const falta = Object.keys(DICAS_LENDARIO).filter(k => !G.pesca.lendarios.includes(k) && (k !== 'tabarana_ouro' || (typeof Mundo !== 'undefined' && Mundo.aberto('serra')))); return falta.length ? DICAS_LENDARIO[falta[Math.floor(G.dia / 7) % falta.length]] : ''; }

function conversarLourival(p) {
  const dica = dicaDoLourival();   // (T2 das conversas) a fala do dia vem do motor de falas; a dica do lendário vai no fim
  return Conversas.abrir(p || 'lourival', { nome: 'Seu Lourival', mais: dica ? [dica] : [], depois: typeof ofertaAltoMar === 'function' ? () => ofertaAltoMar() : null });
}


// ---------- a vara na mão (a arte do item, só posicionada e girada): para trás na força, apontando para a boia depois ----------
// Na mão vai a arte <vara>_mao (a mesma do ícone, sem a boia pendurada: a boia de verdade está na água); se ela ainda não
// carregou, o ícone, para nunca ficar sem vara.
function poseDaVara(j) {
  const L = G.linha, v = DIR_VET[j.dir], lado = j.dir === DIR.ESQUERDA ? -1 : 1;
  const base = Math.atan2(v[1], v[0]) * 180 / Math.PI;
  const ang = L.fase === 'carregando' ? base - lado * (35 + 70 * L.forca) : base - lado * 35;
  const mao = { x: j.x + (j.dir === DIR.ESQUERDA ? -14 : j.dir === DIR.DIREITA ? 14 : 8), y: j.y - 46 };
  const R = 62, r = ang * Math.PI / 180;
  return { mao, ang, ponta: { x: mao.x + Math.cos(r) * R, y: mao.y + Math.sin(r) * R } };
}
function desenhaVara(ctx, j) {
  if (j !== G.jog || !G.linha) return;
  const v = G.linha.vara || 'vara', img = spr('itens/' + v + '_mao') || spr('itens/' + v); if (!img) return;
  const p = poseDaVara(j);
  ctx.save(); ctx.translate(p.mao.x, p.mao.y); ctx.rotate((p.ang + 45) * Math.PI / 180); ctx.drawImage(img, -6, -50, 56, 56); ctx.restore();
}
