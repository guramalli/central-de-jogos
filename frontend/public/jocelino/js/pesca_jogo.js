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
let _esperaSoltar = false;   // a linha acabou com o botão apertado: só lança de novo depois de soltar (como no Stardew)
function varaNaMao(id) {
  if (!VARAS.includes(id)) return false;
  if (G.linha || _esperaSoltar) return true;   // o ATUALIZADOR cuida do resto (soltar, fisgar, recolher)
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
  if (!seg) _esperaSoltar = false;
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

// ---------- a banca do Seu Lourival (o Willy): vende peixe; compra isca, covo e a vara boa ----------
const PRECO_BANCA = { isca: 5, covo: 50, vara_boa: 250 };
const PEDE_PESCA = { vara_boa: 2 };
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
      linhas = Object.keys(PRECO_BANCA).map(id => { const pede = PEDE_PESCA[id], trava = pede && Habilidades.nivel('pesca') < pede, preco = Math.max(1, Math.round(PRECO_BANCA[id] * descontoHab()));
        return el('div', { class: 'linha' + (trava ? ' trancado' : ''), onclick: e => { e.stopPropagation(); if (trava) { avisar(`Isso pede Pesca ${pede}.`); return; } _comprar(id, e.shiftKey && id === 'isca' ? 5 : 1, preco); desenha(); } },
          el('img', { src: urlItem(id) }), el('div', {}, Itens.nome(id), trava ? el('div', { class: 'tem' }, `pede Pesca ${pede}`) : el('div', { class: 'tem' }, 'tem ' + G.mochila.total(id))), el('span', { class: 'preco' }, 'Cr$ ' + preco)); });
    }
    caixa.append(el('div', { class: 'grade' }, ...linhas), el('div', { class: 'rodape' }, 'Clique: 1 · Shift+clique: tudo (vender) ou 5 iscas'));
  };
  desenha(); abrirModal(caixa); sons.tocar('abrir', 1.1, 0.03, -6); return true;
}


// A minhoca: cavar grama com a pá às vezes dá uma (8%), em qualquer mapa.
function minhocaAoCavar(alvo) { if (Math.random() < 0.08) soltar('minhoca', 1, (alvo.x + 0.5) * TILE, (alvo.y + 0.7) * TILE); }

// ---------- o covo de siri: na água da margem, com isca; de manhã tem coisa ----------
const margem = (b, x, y) => b.ehAgua(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !b.ehAgua(x + dx, y + dy));
function covoNoChao(t) {
  const b = G.mapa; if (!b || itemDaMao() !== 'covo') return false;
  if (!['praia', 'mata'].includes(b.id)) { avisar('O covo vai na água da praia ou do rio.'); return true; }
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
  if (c.dentro) { const s = G.mochila.adicionar(c.dentro.id, c.dentro.qtd); if (s) soltar(c.dentro.id, s, G.jog.x, G.jog.y); avisar('+ ' + Itens.qtd(c.dentro.qtd, c.dentro.id)); Habilidades.ganhar('pesca', 3 * c.dentro.qtd); c.dentro = null; hudSujo(); return true; }
  if (c.isca || Habilidades.tem('isqueiro')) { abrirPlaca('O covo está iscado. Volte amanhã cedo.'); return true; }
  const isca = G.mochila.total('isca') ? 'isca' : G.mochila.total('minhoca') ? 'minhoca' : '';
  if (!isca) { abrirPlaca('O covo está vazio e sem isca. A banca do Lourival vende isca.'); return true; }
  G.mochila.remover(isca, 1); c.isca = true; sons.tocar('agua', 1.1, 0.05, -6); avisar('Covo iscado.'); hudSujo(); return true;
}
MANHA.push(() => { for (const c of G.pesca.covos) if (!c.dentro && (c.isca || Habilidades.tem('isqueiro'))) { c.dentro = Pesca.covoManha(c.mapa === 'mata' ? 'rio' : 'mar')[0]; c.isca = false; } });
AO_MONTAR.push(b => { if (b.id === 'praia' || b.id === 'mata') poeCovos(b); });
TAREFAS.push(() => { const n = G.pesca ? G.pesca.covos.filter(c => c.dentro).length : 0; return n ? [{ texto: `Pesca: ${n} ${n === 1 ? 'covo tem' : 'covos têm'} coisa dentro` }] : []; });


function abrirBauPesca() {
  const r = Pesca.bau();
  if (r.dinheiro) { G.dinheiro += r.dinheiro; G.ganhoHoje += r.dinheiro; avisar(`Um baú! Dentro: Cr$ ${r.dinheiro}.`); }
  else { const s = G.mochila.adicionar(r.id, r.qtd); if (s) soltar(r.id, s, G.jog.x, G.jog.y); avisar(`Um baú! Dentro: ${Itens.qtd(r.qtd, r.id)}.`); }
  sons.tocar('fanfarra', 1.3, 0, -8); hudSujo();
}
function entregarLendarioARosa() {
  const id = Object.keys(LENDARIOS).find(k => G.mochila.total(k) > 0); if (!id) return false;
  G.mochila.remover(id, 1); if (G.pensao) G.pensao.curtidas += 10; hudSujo(); sons.tocar('fanfarra', 1, 0, -4);
  abrirConversa('Rosa', urlArte('retratos/rosa_alegre'), [`Jocelino! Um ${Itens.nome(id)}?! A Vila inteira vai querer ver!`, 'Vou contar pra todo freguês. A pensão ficou mais famosa (+10 curtidas).']);
  return true;
}
AO_MONTAR.push(b => { const r = b.moradores.find(m => m.id === 'rosa'); if (!r) return; const antes = r.aoConversar; r.aoConversar = () => entregarLendarioARosa() || (antes ? antes() : (conversaPadrao(r), true)); });
function conversaPadrao(p) { const f = FALAS[p.id], pg = typeof f === 'function' ? f() : (f || ['Bom dia, Jocelino!']); abrirConversa(p.nome, urlArte('retratos/' + p.id + '_normal'), Array.isArray(pg[0]) ? pg[0] : pg); }
// O Lourival dá a dica de um lendário que falta, um por semana.
const DICAS_LENDARIO = { tainha_rainha: 'Dizem que no inverno, com chuva, a Tainha-Rainha passa no fundo da praia.', robalo_flecha: 'O Robalo-Flecha só aparece no verão, no fim da tarde, lá da ponta do píer.',
  bagre_assombrado: 'Tem um bagre no rio da mata que só morde depois da meia-noite. Assombrado, juram.', traira_velha: 'A Traíra-Velha mora no poço da cachoeira. Na primavera, com chuva, ela sai.',
  mero: 'Há 30 anos eu caço o mero lá no alto-mar. No outono, em cima de cardume... um dia a gente pega.' };
function dicaDoLourival() { const falta = Object.keys(DICAS_LENDARIO).filter(k => !G.pesca.lendarios.includes(k)); return falta.length ? DICAS_LENDARIO[falta[Math.floor(G.dia / 7) % falta.length]] : ''; }

function conversarLourival(p) {
  const f = FALAS.lourival, pg = typeof f === 'function' ? f() : f, fala = (Array.isArray(pg[0]) ? pg[0] : pg).slice(), dica = dicaDoLourival();
  if (dica) fala.push(dica);
  abrirConversa('Seu Lourival', urlArte('retratos/lourival_normal'), fala, typeof ofertaAltoMar === 'function' ? () => ofertaAltoMar() : null);
  return true;
}

