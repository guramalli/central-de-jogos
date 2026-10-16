// Jocelino — quintal_coisas.js — o que se põe no quintal (o "colocar" do Stardew; mapa_quintal.gd do Godot): cerca que se
// liga sozinha, portão, irrigador; machado ou picareta recolhe. O Tio Juca faz a cerca e o portão com madeira. As
// galinhas da vizinhança bicam a horta aberta (os corvos do Stardew), o irrigador do Tonico rega de manhã e os filhos
// ajudam a regar.

const COLOCAVEIS_QUINTAL = ['cerca', 'portao', 'irrigador', 'irrigador_bom', 'forja', 'betoneira', 'barril_agua'];
// (15/10, T4) Os colocados de outros arquivos (o tronco de cogumelo, niveis_jogo.js): o que o objeto faz (o, c) e quantos cabem.
const COLOCADO_ACAO = {}, LIMITE_COLOCADO = {};
// (13/10: "dê a opção de trocar o barril de água de local") O barril é um objeto colocado como o baú do Stardew: o machado ou a
// picareta recolhe (vira o item na mochila) e o botão direito põe de novo em qualquer grama livre do quintal. Um só.
ITENS.barril_agua = { nome: 'Barril d\'água', pilha: 1, ferramenta: false, colocavel: true, descricao: 'O barril da chuva: enche o regador. No quintal, botão direito na grama livre para colocar; o machado ou a picareta recolhe.' };
const AVISO_BARRIL_NA_MOCHILA = 'O barril está na mochila: coloque no chão para encher o regador';
// Motivo para não colocar ('' = pode).
function podeColocar(b, x, y) {
  if (b.id !== 'quintal' || !b.livreEm(x, y)) return 'Aqui não dá.';
  if (b.saidaEm(x, y) || b.chaoEm(x, y) !== CH.GRAMA) return 'Na trilha não: o caminho até a Vila fica livre.';
  // (a planta antes do "já tem coisa": a planta também ocupa o ladrilho, e o aviso não dizia o que fazer; teste de 13/10)
  const c = Horta.cova(x, y); if (c && c.planta) return 'Tem planta aí: escolha uma cova vazia ou a grama (a foice arranca um pé, se quiser abrir o meio).';
  if (b.ocupado.has(chaveT(x, y))) return 'Já tem coisa aí.';
  if (reservadoQuintal(x, y)) return 'Esse terreno é da obra da família.';
  // A caixa sólida do objeto (ladrilho inteiro de largura) não pode encostar no pé do Jocelino nem de um morador: prenderia.
  const cx = b._caixa((x + 0.5) * TILE, (y + 1) * TILE, 48, 48), sobre = (a, d) => a.x < d.x + d.w && a.x + a.w > d.x && a.y < d.y + d.h && a.y + a.h > d.y;
  if (sobre(cx, G.jog.caixa())) return 'O Jocelino está em cima.';
  if (b.moradores.some(m => m.visivel !== false && sobre(cx, { x: m.x - 14, y: m.y - 14, w: 28, h: 14 }))) return 'Tem gente aí.';
  return '';
}
// A cerca do Stardew: um mourão por ladrilho; duas ripas ligam o mourão ao da direita e uma ripa (vista de cima) ao de
// baixo; o portão fica no lugar do mourão, de frente numa fileira e de lado numa coluna. As ripas e o portão ocupam só o
// vão entre as bordas dos mourões (o mourão tem 14 px), então a ordem do desenho não importa. Peça = {arte, x, y, w, h}.
// `em` (x, y) → {id, aberto} ou null: de quem é a cerca (a do jogador; o galinheiro do Tio Juca passa a dele, lá embaixo).
const colocadoEm = (x, y) => G.horta.colocados.find(c => c.x === x && c.y === y && (c.id === 'cerca' || c.id === 'portao'));
function pecasCerca(x, y, em = colocadoEm) {
  const c = em(x, y); if (!c) return [];
  const ehCerca = (i, j) => { const d = em(i, j); return !!d && d.id === 'cerca'; };
  const cx = x * TILE + TILE / 2, base = (y + 1) * TILE, MEIO = 7, r = [];
  if (c.id === 'portao') {
    const deLado = (em(x, y - 1) || em(x, y + 1)) && !em(x - 1, y) && !em(x + 1, y);
    // Aberto, o portão gira 90° na dobradiça (o mourão da esquerda ou o de cima): o de frente fica de perfil e o de lado
    // fica de frente — a mesma arte do outro sentido.
    if (c.aberto) {
      if (deLado) r.push({ arte: 'objetos/portao_h', x: cx, y: base - TILE * 2 + 4, w: TILE * 2 - 24, h: 34 });
      else r.push({ arte: 'objetos/portao_v', x: cx - TILE + MEIO - 2, y: base - TILE * 2 + 2, w: 12, h: TILE * 2 - 24 });
    } else if (deLado) r.push({ arte: 'objetos/portao_v', x: cx - 6, y: base - TILE - 6, w: 12, h: TILE * 2 - 24 });
    else r.push({ arte: 'objetos/portao_h', x: cx - TILE + MEIO, y: base - 45, w: TILE * 2 - MEIO * 2, h: 42 });
    return r;
  }
  if (ehCerca(x, y + 1)) r.push({ arte: 'objetos/cerca_ripas_v', x: cx - 5, y: base - 30, w: 10, h: TILE });
  if (ehCerca(x + 1, y)) r.push({ arte: 'objetos/cerca_ripas_h', x: cx + MEIO, y: base - 34, w: TILE - MEIO * 2, h: 22 });
  r.push({ arte: 'objetos/cerca_mourao', x: cx - 24, y: base - 60, w: 48, h: 60 });
  return r;
}
function desenhaCerca(ctx, o) { for (const p of pecasCerca(o.cx, o.cy, o.em || colocadoEm)) { const img = spr(p.arte); if (img) ctx.drawImage(img, p.x, p.y, p.w, p.h); } }
function poeColocados(b) {
  if (!b || b.id !== 'quintal') return;
  for (const o of b.objs.filter(o => o.id === 'colocado')) b.tirar(o);
  for (const c of G.horta.colocados) {
    // (a cerca bloqueia o ladrilho inteiro, como no Stardew: com a caixa só no pé do mourão, o Jocelino passava no vão entre dois
    // mourões de uma cerca em pé; teste de 12/10)
    // (o portão do Stardew: fechado é cerca, aberto deixa passar; o botão direito abre e fecha — teste de 13/10: "o portão não
    // abre", ele era sempre desenhado fechado e não respondia ao clique)
    const solido = c.id !== 'portao' || !c.aberto, pe = c.id === 'cerca' || c.id === 'portao' ? [16, 16] : [16, 10];
    const o = b.interativo('colocado', c.id === 'cerca' ? 'objetos/cerca_mourao' : c.id === 'portao' ? 'objetos/portao_h' : 'objetos/' + c.id, c.x, c.y, 1, 1, solido ? pe : null, solido);
    Object.assign(o, { item: c.id, cx: c.x, cy: c.y });
    if (c.id === 'cerca' || c.id === 'portao') o.desenha = ctx => desenhaCerca(ctx, o);
    o.ferramenta = (p, id) => { if (id !== 'machado' && id !== 'picareta') return; if (trabalhando(p)) { avisar(pronto(p) ? 'Está pronto: tire o que ficou pronto antes de recolher.' : 'Está trabalhando: espere terminar para recolher.'); return; } recolher(p); };
    if (c.id === 'portao') Object.assign(o, { aberto: !!c.aberto, acao: () => abrirPortao(c) });
    if (c.id === 'forja') o.acao = () => usarForja(o);
    if (c.id === 'betoneira') o.acao = () => usarBetoneira(o);
    if (c.id === 'irrigador') o.acao = () => abrirPlaca('O irrigador do Seu Tonico: rega as 4 covas em volta toda manhã.');
    if (c.id === 'irrigador_bom') o.acao = () => abrirPlaca('O irrigador bom do Seu Tonico: rega as 8 covas em volta toda manhã.');
    if (COLOCADO_ACAO[c.id]) COLOCADO_ACAO[c.id](o, c);
  }
  poeBarril(b);
}
// O barril d'água no lugar salvo (G.horta.barril); na mochila (null), o quintal fica sem ele. O botão direito ou o regador
// enchem; o machado ou a picareta recolhem.
function poeBarril(b) {
  for (const o of b.objs.filter(o => o.id === 'barril_agua')) b.tirar(o);
  const p = G.horta.barril; if (!p) return;
  const oc = b.ocupado.get(chaveT(p.x, p.y)); if (oc && oc.tipo === 'detrito') b.tirar(oc);
  const o = b.interativo('barril_agua', 'objetos/barril_agua', p.x, p.y, 1, 1, [16, 10]);
  Object.assign(o, { item: 'barril_agua', cx: p.x, cy: p.y });
  o.acao = () => encherRegador();
  o.ferramenta = (q, id) => { if (id === 'regador') encherRegador(); else if (id === 'machado' || id === 'picareta') recolherBarril(); };
}
function recolherBarril() {
  if (!G.mochila.cabe('barril_agua')) { avisar('A mochila está cheia: abra um espaço para levar o barril.'); return false; }
  G.horta.barril = null; G.mochila.adicionar('barril_agua', 1);
  sons.tocar('madeira', 0.8, 0.05, -4); poeColocados(G.mapa); hudSujo(); avisar('O barril foi para a mochila.');
  return true;
}
// Abre ou fecha o portão (não fecha com o Jocelino no vão: ficaria preso dentro da cerca).
function abrirPortao(c) {
  if (c.aberto) {
    const b = G.mapa, caixa = b._caixa((c.x + 0.5) * TILE, (c.y + 1) * TILE, 48, 48), j = G.jog.caixa();
    if (j.x < caixa.x + caixa.w && j.x + j.w > caixa.x && j.y < caixa.y + caixa.h && j.y + j.h > caixa.y) { avisar('Saia do portão para fechar.'); return true; }
  }
  c.aberto = !c.aberto; sons.tocar('madeira', c.aberto ? 1.3 : 0.9, 0.05, -6); poeColocados(G.mapa); return true;
}
// A forja e a betoneira não se recolhem no meio do serviço (o que estava dentro se perderia).
const trabalhando = o => typeof G.mina !== 'undefined' && G.mina && !!((G.mina.forjas || {})[o.cx + ',' + o.cy] || (G.mina.betoneiras || {})[o.cx + ',' + o.cy]);
const pronto = o => { const k = o.cx + ',' + o.cy, f = G.mina.forjas[k], b = G.mina.betoneiras[k]; return f ? Mina.agora() >= f.pronta : !!b && G.dia >= b.pronta; };
function colocar(id, x, y) {
  if (id === 'barril_agua' && G.horta.barril) { avisar('Já tem um barril no quintal.'); return false; }
  if (LIMITE_COLOCADO[id] && G.horta.colocados.filter(c => c.id === id).length >= LIMITE_COLOCADO[id]) { avisar(`O quintal já tem ${Itens.qtd(LIMITE_COLOCADO[id], id)}: é o máximo.`); return false; }
  const m = podeColocar(G.mapa, x, y); if (m) { avisar(m); return false; }
  if (Horta.cova(x, y)) delete G.horta.covas[chaveH(x, y)];   // cova vazia vira chão de cerca
  if (id === 'barril_agua') { G.horta.barril = { x, y }; if (G.limpou) G.limpou.barril_colocado = 1; }
  else G.horta.colocados.push({ id, x, y });
  G.mochila.remover(id, 1);
  sons.tocar('pousar', 1, 0.05, -4); poeColocados(G.mapa); hudSujo(); return true;
}
function recolher(o) {
  G.horta.colocados = G.horta.colocados.filter(c => !(c.x === o.cx && c.y === o.cy));
  const sobra = G.mochila.adicionar(o.item, 1); if (sobra) soltar(o.item, 1, o.x, o.y - 10);
  sons.tocar('madeira', 1, 0.05, -4); poeColocados(G.mapa); hudSujo();
}
AO_MONTAR.push(b => { if (b.id === 'quintal') poeColocados(b); });

// O Tio Juca faz cerca (2 madeiras) e portão (5) — "cerca boa segura galinha e segura menino".
// (T2 das conversas) A fala do dia vem do motor de falas (conversas.js); a emoção (@alegre...) o abrirPlaca mostra no retrato.
function falaDe(p) { return Conversas.paginas(p); }
// Quanto custa cada coisa do Tio Juca (madeiras) e o que ele oferece: 1 cerca, 10 cercas e "quantas a madeira der" (teste de
// 12/10: "ficar comprando de 1 em 1 é chato"; no Stardew a loja compra 5 com Shift), e o portão.
// (14/10) O baú também (bau.js): o preço mora no ECO.
const MADEIRA_JUCA = { cerca: 2, portao: 5, bau: ECO.quintal.bau };
function opcoesJuca() {
  const m = G.mochila.total('madeira'), max = Math.floor(m / MADEIRA_JUCA.cerca), r = [];
  if (max >= 1) r.push(['Fazer 1 cerca (2 madeiras)', 'cerca', 1]);
  if (max >= 10) r.push(['Fazer 10 cercas (20 madeiras)', 'cerca', 10]);
  if (max > 1 && max !== 10) r.push([`Fazer ${max} cercas: toda a madeira (${max * MADEIRA_JUCA.cerca} madeiras)`, 'cerca', max]);
  if (m >= MADEIRA_JUCA.portao) r.push(['Fazer portão (5 madeiras)', 'portao', 1]);
  if (m >= MADEIRA_JUCA.bau) r.push([`Fazer baú (${MADEIRA_JUCA.bau} madeiras)`, 'bau', 1]);
  return r;
}
// Faz até n (para no que a madeira ou a mochila deixar); devolve quantas fez.
function jucaFazer(item, n) {
  const custo = MADEIRA_JUCA[item]; let feitas = 0;
  while (feitas < n && G.mochila.total('madeira') >= custo && G.mochila.cabe(item)) { G.mochila.remover('madeira', custo); G.mochila.adicionar(item, 1); feitas++; }
  if (feitas) { sons.tocar('madeira', 1, 0.05, -4); avisar(`O Tio Juca fez ${Itens.qtd(feitas, item)}.`); hudSujo(); }
  else avisar(G.mochila.total('madeira') < custo ? `Precisa de ${custo} madeiras.` : 'A mochila está cheia.');
  return feitas;
}
function conversarJuca(p) {
  const m = G.mochila.total('madeira');
  // (14/10) Sem madeira para o baú, ele lembra o preço (até o primeiro baú ir para o chão).
  const fala = falaDe(p).concat(m < MADEIRA_JUCA.bau && !((G.limpou || {}).bau_colocado > 0) && !G.mochila.total('bau') ? [`Baú pra guardar as coisas eu faço com ${MADEIRA_JUCA.bau} madeiras. Você tem ${m}.`] : []);
  if (m < MADEIRA_JUCA.cerca) { abrirConversa(p.nome, urlArte('retratos/juca_normal'), fala); return true; }
  abrirConversa(p.nome, urlArte('retratos/juca_normal'), fala.concat(['Cerca boa segura galinha e segura menino. Quer que eu faça com a sua madeira?']), () => {
    const op = opcoesJuca();
    perguntar(`Tio Juca: "Faço o quê?" (você tem ${G.mochila.total('madeira')} madeiras)`, op.map(o => o[0]).concat(['Agora não']), i => { if (op[i]) jucaFazer(op[i][1], op[i][2]); });
  });
  return true;
}
AO_MONTAR.push(b => { if (b.id !== 'quintal') return; const j = b.moradores.find(m => m.id === 'juca'); if (j) j.aoConversar = () => conversarJuca(j); });

// ---------- as galinhas de manhã: aparecem na cova bicada e fogem quando o Jocelino chega a 3 ladrilhos ----------
NOITE.push(linhas => {
  G.horta.galinha = null;
  const id = Horta.galinhas(getMapa('quintal'), mulberry(G.dia * 613 + 3));
  const aberto = G.horta.colocados.some(c => c.id === 'portao' && c.aberto);
  if (id) { linhas.push(`As galinhas da vizinhança bicaram um pé de ${Itens.nome(id).toLowerCase()}. ${aberto ? 'O portão da horta ficou aberto.' : 'Cerca resolve.'}`); if (MAPAS.quintal) sincronizaHorta(MAPAS.quintal); }
});
let _galinha = null;   // {x, y, tx, ty, foge, lado, t, caminho, pula} em pixels (x,y = pé; tx,ty = ladrilho onde está)
// Para onde a galinha foge (relato de 14/10: "correu e passou por cima da cerca"). Como no Stardew, bicho anda pelo chão e respeita
// cerca: busca em largura a partir do ladrilho dela pela MESMA regra do Horta.protegida (livreEm e objeto não sólido; o portão fechado
// é sólido, o aberto passa), até a borda da área livre do mapa. Escolhe a borda que fica mais longe do Jocelino, sem passar por cima
// dele nem encostar nele quando dá. Sem a borda mas com mais de 120 ladrilhos abertos (o limite do protegida), vai até o 121º.
// Devolve a lista de ladrilhos [{x, y}...] (sem o de partida) ou null se a cova está fechada (sem caminho).
function caminhoDaGalinha(b, x0, y0, jx, jy) {
  const L = b.livre, passa = (x, y) => { if (!b.livreEm(x, y)) return false; const o = b.ocupado.get(chaveT(x, y)); return !(o && o.solido); };
  const borda = (x, y) => x === L.x || y === L.y || x === L.x + L.w - 1 || y === L.y + L.h - 1;
  for (const folga of [1, 0, -1]) {   // 1 = não chega perto do Jocelino; 0 = só não pisa nele; -1 = ignora ele
    const veto = (x, y) => folga >= 0 && Math.max(Math.abs(x - jx), Math.abs(y - jy)) < folga + 1 && !(x === x0 && y === y0);
    const pai = new Map([[chaveT(x0, y0), null]]), fila = [{ x: x0, y: y0, d: 0 }], bordas = []; let n = 0, ultimo = null;
    for (let i = 0; i < fila.length; i++) {
      const c = fila[i]; n++; ultimo = c;
      if (borda(c.x, c.y)) bordas.push(c);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = c.x + dx, ny = c.y + dy, k = chaveT(nx, ny);
        if (pai.has(k) || !passa(nx, ny) || veto(nx, ny)) continue;
        pai.set(k, c); fila.push({ x: nx, y: ny, d: c.d + 1 });
      }
    }
    let alvo = null;
    if (bordas.length) { let melhor = -1e9; for (const c of bordas) { const s = Math.hypot(c.x - jx, c.y - jy) * 0.6 - c.d; if (s > melhor) { melhor = s; alvo = c; } } }
    else if (n > 120) alvo = fila[120];
    if (!alvo) continue;
    if (alvo.x === x0 && alvo.y === y0) return [];   // já está na borda: só sai
    const rota = []; for (let c = alvo; c && !(c.x === x0 && c.y === y0); c = pai.get(chaveT(c.x, c.y))) rota.unshift({ x: c.x, y: c.y });
    return rota;
  }
  return null;
}
ATUALIZADORES.push(dt => {
  if (!G.horta || !G.horta.galinha || G.mapaId !== 'quintal') { _galinha = null; return; }
  if (!_galinha) { const c = G.horta.galinha; _galinha = { x: (c.x + 0.5) * TILE, y: (c.y + 1) * TILE, tx: c.x, ty: c.y, foge: false, lado: 1, t: 0, caminho: null, pula: 0 }; }
  const g = _galinha; g.t += dt;
  const jx = Math.floor(G.jog.x / TILE), jy = Math.floor(G.jog.y / TILE);
  const foge = () => {   // traça (ou refaz) o caminho; sem caminho, ela pula no lugar e some com transparência
    g.caminho = caminhoDaGalinha(G.mapa, g.tx, g.ty, jx, jy);
    if (!g.caminho) g.pula = 0.0001;
    else if (!g.caminho.length) { G.horta.galinha = null; _galinha = null; }
  };
  if (!g.foge && Math.hypot(G.jog.x - g.x, G.jog.y - g.y) < 3 * TILE) { g.foge = true; g.lado = G.jog.x < g.x ? 1 : -1; sons.tocar('pegar', 1.6, 0.1, -8); foge(); }
  if (!g.foge) return;
  if (g.pula) {   // sem saída: um pulinho no lugar e some (a arte é a mesma, só muda a posição e a transparência)
    g.pula += dt; if (g.pula > 0.7) { G.horta.galinha = null; _galinha = null; } return;
  }
  let resto = 260 * dt;   // pixels que ainda pode andar neste passo
  while (resto > 0 && g.caminho) {
    const p = g.caminho[0];
    if (!g.caminho.length) { G.horta.galinha = null; _galinha = null; return; }
    const o = G.mapa.ocupado.get(chaveT(p.x, p.y));
    if (o && o.solido) { foge(); if (g.pula) return; continue; }   // o portão fechou no meio do caminho
    const ax = (p.x + 0.5) * TILE, ay = (p.y + 1) * TILE, dx = ax - g.x, dy = ay - g.y, d = Math.hypot(dx, dy);
    if (dx) g.lado = dx > 0 ? 1 : -1;
    if (d <= resto) { g.x = ax; g.y = ay; g.tx = p.x; g.ty = p.y; resto -= d; g.caminho.shift(); if (!g.caminho.length) { G.horta.galinha = null; _galinha = null; return; } }
    else { g.x += dx / d * resto; g.y += dy / d * resto; resto = 0; }
  }
});
AO_MONTAR.push(b => { if (b.id === 'quintal') b.extras = () => _galinha ? [{ y: _galinha.y, desenha(ctx) {
  const g = _galinha, quadro = g.foge || Math.floor(g.t * 3) % 2 ? 'objetos/galinha_1' : 'objetos/galinha_2';
  ctx.save(); ctx.translate(g.x, g.y);
  if (g.pula) { ctx.globalAlpha = Math.max(0, 1 - g.pula / 0.7); ctx.translate(0, -Math.abs(Math.sin(g.pula * 14)) * 14); }
  if (g.lado < 0 || (!g.foge && Math.floor(g.t / 2) % 2)) ctx.scale(-1, 1); desenhaPe(ctx, quadro, 0, 0, 1); ctx.restore(); } }] : []; });
// ---------- o irrigador: as 4 covas vizinhas começam o dia molhadas (o bom: as 8) ----------
const VIZ_IRRIGADOR = { irrigador: [[1, 0], [-1, 0], [0, 1], [0, -1]], irrigador_bom: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] };
function regarComIrrigadores() {
  let n = 0;
  for (const c of G.horta.colocados.filter(c => VIZ_IRRIGADOR[c.id])) {
    for (const [dx, dy] of VIZ_IRRIGADOR[c.id]) { const cv = Horta.cova(c.x + dx, c.y + dy); if (cv && !cv.regada) { cv.regada = true; n++; } }
  }
  return n;
}
// O alcance do irrigador (teste de 13/10: "deveria ser colocado no meio e mostrar o raio de ação"). O Stardew não mostra sem mod;
// o mod mais usado (Range Highlight) pinta o alcance quando o irrigador está na mão, e é o que se faz aqui: o ladrilho do mouse
// verde (pode pôr) ou vermelho (não pode), as covas que ele regaria em azul e o alcance dos que já estão no chão.
// No chão (por baixo das plantas), o alcance em azul; por cima de tudo (cima = true), o ladrilho do mouse — senão a planta o cobria.
function desenhaAlcanceIrrigador(ctx, cima = false) {
  const id = typeof itemDaMao === 'function' ? itemDaMao() : '';
  // (o barril na mão também mostra o ladrilho verde ou vermelho; não tem alcance azul)
  if (id === 'barril_agua' && !cima) return;
  if ((!VIZ_IRRIGADOR[id] && id !== 'barril_agua') || G.mapaId !== 'quintal' || !G.horta || !G.mouse || (typeof menuAberto === 'function' && menuAberto())) return;
  const pinta = (x, y, cor) => { ctx.fillStyle = cor; ctx.fillRect(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6); };
  const t = ladrilhoDoMouse();
  ctx.save();
  if (cima) pinta(t.x, t.y, !podeColocar(G.mapa, t.x, t.y) && perto1(t) ? 'rgba(80,210,80,0.45)' : 'rgba(225,60,50,0.45)');
  else {
    for (const c of G.horta.colocados) if (VIZ_IRRIGADOR[c.id]) for (const [dx, dy] of VIZ_IRRIGADOR[c.id]) pinta(c.x + dx, c.y + dy, 'rgba(70,160,255,0.22)');
    for (const [dx, dy] of VIZ_IRRIGADOR[id]) pinta(t.x + dx, t.y + dy, 'rgba(70,160,255,0.4)');
  }
  ctx.restore();
}
MANHA.push(() => { if (G.horta) regarComIrrigadores(); });
// O barril que sumiu (fora do quintal, da mochila e do chão: largado no chão de um mapa, que não vai para o save): de manhã o
// Tio Juca põe de volta no lugar de sempre (ou na grama livre mais perto dele). Sem barril não tem horta.
function barrilSumido() {
  if (!G.horta || G.horta.barril || G.mochila.total('barril_agua') > 0) return false;
  return !Object.values(MAPAS).some(m => m && (m.itens || []).some(i => i.id === 'barril_agua'));
}
MANHA.push(() => {
  if (!barrilSumido()) return;
  const b = getMapa('quintal'), B = QUINTAL.BARRIL; let lugar = null;
  for (let r = 0; r < 8 && !lugar; r++) for (let dy = -r; dy <= r && !lugar; dy++) for (let dx = -r; dx <= r && !lugar; dx++)
    if (Math.max(Math.abs(dx), Math.abs(dy)) === r && !podeColocar(b, B.x + dx, B.y + dy)) lugar = { x: B.x + dx, y: B.y + dy };
  G.horta.barril = lugar || Object.assign({}, B); poeColocados(b); G.feitosHoje.push('O Tio Juca pôs o barril d\'água de volta no quintal.');
});

// ---------- os filhos regam: o pedido do Zezinho, o regadorzinho, a rega da manhã (até 8 covas, das mais perto de casa) ----------
function filhosRegam() {
  if (!G.horta.filhos) return 0;
  const secas = Object.keys(G.horta.covas).filter(k => G.horta.covas[k].planta && !G.horta.covas[k].regada).map(k => k.split(',').map(Number))
    .sort((a, b) => Math.hypot(a[0] - 7, a[1] - 13) - Math.hypot(b[0] - 7, b[1] - 13)).slice(0, 8);
  for (const [x, y] of secas) Horta.cova(x, y).regada = true;
  return secas.length;
}
MANHA.push(() => {
  if (!G.horta) return;
  if (!G.horta.pedidoFilhos && !G.horta.filhos && Horta.plantadas() >= 8) { G.horta.pedidoFilhos = true; if (G.limpou) G.limpou.regadorzinho_dia = G.dia; G.feitosHoje.push('O Zezinho quer falar com você sobre a horta.'); }
  const n = filhosRegam(); if (n) G.feitosHoje.push(`O Zezinho e a Ritinha regaram ${n} ${n === 1 ? 'cova' : 'covas'}.`);
});
// (C3, 16/10; o teste crítico: "Comprar o regadorzinho" ficou parado no Agora do dia 2 ao 25) O pedido do Zezinho fica no Agora por 2
// dias; depois, só na Caderneta (aba Quintal e horta), e volta ao Agora quando o Jocelino está no depósito (onde se compra). Como no
// Stardew: o pedido pequeno de um vizinho fica no diário, e o jogo não o repete na tela. O dia do pedido fica em G.limpou (vai no
// save); o save antigo, sem o dia, conta como pedido antigo. Com o regadorzinho na mochila, "Dar ao Zezinho" fica (é a hora de dar).
const REGADORZINHO_DIAS = 2;
const regadorzinhoPendente = () => !!G.horta && G.horta.pedidoFilhos && !G.horta.filhos;
const pertoDoDeposito = () => {
  if (G.mapaId !== 'vila' || !G.mapa || !G.jog) return false;
  const o = G.mapa.objs.find(x => x.id === 'deposito'); return !!o && Math.hypot(o.x - G.jog.x, o.y - G.jog.y) < 5 * TILE;
};
const regadorzinhoNoAgora = () => { const d = (G.limpou || {}).regadorzinho_dia; return G.mochila.total('regadorzinho') > 0 || (typeof d === 'number' && G.dia - d < REGADORZINHO_DIAS) || pertoDoDeposito(); };
TAREFAS.push(() => regadorzinhoPendente() && regadorzinhoNoAgora() ? [{ texto: G.mochila.total('regadorzinho') ? 'Dar o regadorzinho ao Zezinho' : 'Comprar o regadorzinho do Zezinho (Ananias, Cr$ 30)' }] : []);
// (a Caderneta carrega depois deste arquivo: a linha entra no começo do jogo)
let _regadorzinhoNaCaderneta = false;
INICIADORES.push(() => {
  if (_regadorzinhoNaCaderneta || typeof CADERNETA === 'undefined') return; _regadorzinhoNaCaderneta = true;
  CADERNETA.push(() => regadorzinhoPendente() && !regadorzinhoNoAgora() ? [{ id: 'quintal_regadorzinho', aba: 'quintal',
    texto: 'O Zezinho pediu um regadorzinho (Seu Ananias, Cr$ 30): com ele, ele e a Ritinha regam a horta de manhã', alvo: { mapa: 'vila', objeto: 'deposito' }, rotulo: 'Botão direito: o depósito (aba Sementes)' }] : []);
});
function conversarZezinho(p) {
  if (G.horta.pedidoFilhos && !G.horta.filhos) {
    if (G.mochila.total('regadorzinho') > 0) {
      G.mochila.remover('regadorzinho', 1); G.horta.filhos = true; hudSujo(); sons.tocar('fanfarra', 1.3, 0, -8);
      abrirConversa(p.nome, urlArte('retratos/zezinho_alegre'), ['Oba! Um regadorzinho só meu! Amanhã cedo eu e a Ritinha regamos a horta, pai!']); return true;
    }
    abrirConversa(p.nome, urlArte('retratos/zezinho_normal'), ['Pai, compra um regadorzinho pra mim? Eu e a Ritinha regamos a horta! O Seu Ananias vende.']); return true;
  }
  abrirConversa(p.nome, urlArte('retratos/zezinho_normal'), falaDe(p)); return true;
}
AO_MONTAR.push(b => { if (b.id !== 'quintal') return; const z = b.moradores.find(m => m.id === 'zezinho'); if (z) z.aoConversar = () => conversarZezinho(z); });
// Das 7h às 9h, com a rega ligada, os dois andam pela horta (a área deles muda para as covas).
// (14/10, relato: "o Zezinho travou na cerca") só as covas que o pé dele alcança, pela regra do Horta.protegida (cerca, portão
// fechado e objeto sólido fecham; planta passa): com a área de TODAS as covas e a cerca no meio, os cantos de passeio caíam do
// outro lado da cerca e ele ficava parado encostado nela até as 9h. Sem cova ao alcance, ele fica na área de casa.
// (15/10, foto do jogador: "o Zezinho está ficando preso dentro da plantação sempre... ou simplesmente não fica lá dentro de maneira
// alguma") As crianças só pisam no quintal "de fora": o que o pé alcança a partir da trilha da porta de casa (b.inicio) sem passar por
// cerca, portão fechado nem objeto sólido. Elas nascem no meio da horta cercada (6,13), e de lá não saíam: agora, se estiverem fora
// dessa parte (nasceram lá dentro, o portão fechou com elas no meio), vão para o ladrilho de fora mais perto; e o passeio nunca
// escolhe um canto dentro de uma cerca (Personagem.podeIr). A rega da manhã só vai às covas de fora.
function quintalDeFora(b) {
  const x0 = b.inicio.x, y0 = b.inicio.y, visto = new Set([chaveT(x0, y0)]), fila = [[x0, y0]];
  for (let i = 0; i < fila.length; i++) {
    const [cx, cy] = fila[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy, k = chaveT(nx, ny);
      if (visto.has(k) || !b.livreEm(nx, ny)) continue;
      const o = b.ocupado.get(k); if (o && o.solido) continue;
      visto.add(k); fila.push([nx, ny]);
    }
  }
  return visto;
}
const FILHOS_QUINTAL = ['zezinho', 'ritinha'];
function soltaFilhoDaCerca(b, m, fora) {
  const tx = Math.floor(m.x / TILE), ty = Math.floor(m.y / TILE);
  if (fora.has(chaveT(tx, ty))) return false;
  const a = m._areaCasa || m.area, naArea = (x, y) => !a || (x * TILE >= a.x && x * TILE < a.x + a.w && y * TILE >= a.y && y * TILE < a.y + a.h);
  let melhor = null, dm = 1e9;
  for (const k of fora) { const [x, y] = k.split(',').map(Number), d = Math.hypot(x - tx, y - ty) + (naArea(x, y) ? 0 : 6); if (d < dm) { dm = d; melhor = [x, y]; } }
  if (!melhor) return false;
  m.x = (melhor[0] + 0.5) * TILE; m.y = melhor[1] * TILE + 42; m._alvo = null; m.andando = false; m._espera = rnd(0.5, 1.5);
  return true;
}
function filhosNoQuintalDeFora(b) {
  const fora = quintalDeFora(b);
  for (const id of FILHOS_QUINTAL) { const m = b.moradores.find(p => p.id === id); if (!m) continue;
    m._fora = fora; m.podeIr = (x, y) => !m._fora || m._fora.has(chaveT(x, y)); soltaFilhoDaCerca(b, m, fora); }
  return fora;
}
AO_ENTRAR_MAPA.push(id => { if (id === 'quintal' && G.mapa) filhosNoQuintalDeFora(G.mapa); });
let _tFilhos = 0;
ATUALIZADORES.push(dt => {
  const b = MAPAS.quintal; if (!b || G.mapaId !== 'quintal' || !G.horta) return;
  _tFilhos -= dt || 0; if (_tFilhos > 0) return;
  _tFilhos = 1;   // (a busca a cada 1 s, não a cada quadro: a cerca e o portão mudam quando o Jocelino mexe)
  const fora = filhosNoQuintalDeFora(b);
  const ks = Object.keys(G.horta.covas).filter(k => G.horta.covas[k].planta && fora.has(k)), manha = G.horta.filhos && G.minutos >= 7 * 60 && G.minutos < 9 * 60 && ks.length;
  for (const id of FILHOS_QUINTAL) {
    const m = b.moradores.find(p => p.id === id); if (!m) continue;
    if (!m._areaCasa) m._areaCasa = m.area;
    if (!manha) { m.area = m._areaCasa; continue; }
    const xs = ks.map(k => +k.split(',')[0]), ys = ks.map(k => +k.split(',')[1]);
    m.area = { x: Math.min(...xs) * TILE, y: Math.min(...ys) * TILE, w: (Math.max(...xs) - Math.min(...xs) + 1) * TILE, h: (Math.max(...ys) - Math.min(...ys) + 1) * TILE };
  }
});

// ---------- o galinheiro do Tio Juca (o serviço longo cerca_madeira, empreitas.js) ----------
// (16/10, relato com foto do jogador: "existe uma missão do Juca que pede para fazer uma cerca, você faz a cerca mas ela fica lá
// sozinha no meio do quintal") A obra pronta era UM pedaço de cerca de 2 ladrilhos solto na grama ("a cerca do galpão", e galpão
// nenhum). No Stardew a cerca sempre fecha alguma coisa (o cercado dos bichos, a horta, um caminho): pronta, ela vira o galinheiro
// do Tio Juca, um cercado de 5×4 ladrilhos montado com as mesmas peças da cerca do jogador (mourão, ripas e o portão de frente,
// pecasCerca), com 2 galinhas dele ciscando dentro (as da vizinhança, que bicam a horta, continuam como antes). O lote do serviço é
// o começo da fileira de cima (o portão no meio dela, virado para a casa) e o cercado desce dali, no canto de baixo do quintal, longe
// da trilha, da casa, da horta e dos terrenos da família. O lugar fica guardado (G.galinheiro) para não pular; se o jogador já pôs
// coisa ali (cova, cerca, barril, baú, caminho), vai para o lugar livre mais perto que não feche passagem nenhuma. É sólido e não se
// recolhe; quem estiver dentro quando ele aparece (o Jocelino, os filhos) vai para fora.
const GALINHEIRO = { servico: 'cerca_madeira', w: 5, h: 4, portao: 2 };
INICIADORES.push(s => { G.galinheiro = s.galinheiro ? Object.assign({}, s.galinheiro) : null; });
COLETORES.push(s => { if (G.galinheiro) s.galinheiro = Object.assign({}, G.galinheiro); });
// Pronto (para entregar ou entregue) ou feito; pegar de novo (a reforma) volta ao lote com a arte da etapa, como as outras obras.
function galinheiroPronto() {
  const e = G.empreitas, id = GALINHEIRO.servico; if (!e) return false;
  const a = e.aceitas[id]; return a ? a.estado === 'pronta' || a.estado === 'entregue' : !!(e.feitas || {})[id];
}
const dentroGalinheiro = (R, x, y) => !!R && x >= R.x && y >= R.y && x < R.x + R.w && y < R.y + R.h;
// O que o jogador pôs no quintal, pelos dados do save (no AO_MONTAR o galinheiro vem antes dos colocados e dos baús irem para o mapa).
function coisaDoJogadorEm(x, y) {
  const h = G.horta || {};
  return (h.colocados || []).some(c => c.x === x && c.y === y) || (!!h.barril && h.barril.x === x && h.barril.y === y) || !!(h.covas || {})[chaveH(x, y)]
    || (G.baus || []).some(c => c.mapa === 'quintal' && c.x === x && c.y === y) || (G.caminhos || []).includes(chaveT(x, y));
}
const solidoDoJogadorEm = (x, y) => { const h = G.horta || {}, c = (h.colocados || []).find(q => q.x === x && q.y === y);
  return (!!c && !(c.id === 'portao' && c.aberto)) || (!!h.barril && h.barril.x === x && h.barril.y === y) || (G.baus || []).some(q => q.mapa === 'quintal' && q.x === x && q.y === y); };
function galinheiroCabe(b, R) {
  const id = GALINHEIRO.servico, lotes = [];
  for (const k of Object.keys(EMPREITAS_LONGAS).concat(Object.keys(EMPREITAS_EXTRAS))) { const E = dadosEmpreita(k);
    if (k !== id && E && E.mapa === 'quintal' && !E.familia && (E.area || E.artes) && E.x != null) lotes.push(...tilesDoLote(E)); }
  for (let y = R.y; y < R.y + R.h; y++) for (let x = R.x; x < R.x + R.w; x++) {
    if (!b.livreEm(x, y) || b.saidaEm(x, y) || b.chaoEm(x, y) !== CH.GRAMA || reservadoQuintal(x, y) || coisaDoJogadorEm(x, y)) return false;
    if (lotes.some(t => t.x === x && t.y === y)) return false;
    const o = b.ocupado.get(chaveT(x, y)); if (o && o.tipo !== 'detrito' && !o.galinheiro && o.empreita !== id && o.feita !== id) return false;
  }
  return true;
}
// Fecha passagem? O quintal andável a partir da porta de casa (b.inicio), com e sem o cercado: todo ladrilho de fora dele que se
// alcançava tem que continuar alcançável. Os detritos não contam (o machado e a picareta abrem caminho); o que o jogador pôs conta.
function galinheiroFechaPassagem(b, R) {
  const id = GALINHEIRO.servico, solido = (x, y) => { const o = b.ocupado.get(chaveT(x, y));
    return (!!o && o.solido && o.tipo !== 'detrito' && !o.galinheiro && o.empreita !== id && o.feita !== id) || solidoDoJogadorEm(x, y); };
  const anda = comR => {
    const x0 = b.inicio.x, y0 = b.inicio.y, visto = new Set([chaveT(x0, y0)]), fila = [[x0, y0]];
    for (let i = 0; i < fila.length; i++) { const [cx, cy] = fila[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy, k = chaveT(nx, ny);
        if (visto.has(k) || !b.livreEm(nx, ny) || solido(nx, ny) || (comR && dentroGalinheiro(R, nx, ny))) continue;
        visto.add(k); fila.push([nx, ny]); } }
    return visto;
  };
  const sem = anda(false), com = anda(true);
  for (const k of sem) { const [x, y] = k.split(',').map(Number); if (!dentroGalinheiro(R, x, y) && !com.has(k)) return true; }
  return false;
}
// O lugar guardado; sem ele (a 1ª vez, o save de antes desta correção), o do lote do serviço ou o livre mais perto dele.
function lugarDoGalinheiro(b) {
  if (G.galinheiro) return G.galinheiro;
  const E = dadosEmpreita(GALINHEIRO.servico), { w, h } = GALINHEIRO, cands = [];
  for (let dy = -8; dy <= 8; dy++) for (let dx = -12; dx <= 12; dx++) cands.push({ x: E.x + dx, y: E.y + dy, d: Math.abs(dx) + Math.abs(dy) * 1.2 });
  cands.sort((p, q) => p.d - q.d);
  for (const c of cands) { const R = { x: c.x, y: c.y, w, h }; if (galinheiroCabe(b, R) && !galinheiroFechaPassagem(b, R)) return (G.galinheiro = R); }
  return null;
}
// Chamado no fim de poeEmpreitasNoMapa (empreitas_jogo.js): troca o pedaço de cerca (o lote pronto, a obra feita) pelo cercado.
function poeGalinheiro(b) {
  if (!b || b.id !== 'quintal') return;
  for (const o of b.objs.filter(o => o.galinheiro)) b.tirar(o);
  b._galinheiro = null;
  if (!galinheiroPronto()) return;
  const R = lugarDoGalinheiro(b); if (!R) return;   // (sem lugar nenhum no quintal: fica o pedaço de cerca de antes)
  const id = GALINHEIRO.servico;
  for (const o of b.objs.filter(o => o.id === 'feita_' + id || o.id === 'emp_' + id)) b.tirar(o);
  for (let y = R.y; y < R.y + R.h; y++) for (let x = R.x; x < R.x + R.w; x++) { const o = b.ocupado.get(chaveT(x, y)); if (o && o.tipo === 'detrito') b.tirar(o); }
  // A volta do cercado (o meio fica para as galinhas); o portão no meio da fileira de cima.
  const em = (x, y) => !dentroGalinheiro(R, x, y) || (x > R.x && x < R.x + R.w - 1 && y > R.y && y < R.y + R.h - 1) ? null : { id: x === R.x + GALINHEIRO.portao && y === R.y ? 'portao' : 'cerca' };
  for (let y = R.y; y < R.y + R.h; y++) for (let x = R.x; x < R.x + R.w; x++) {
    const c = em(x, y); if (!c) continue;
    const o = b.interativo('galinheiro', c.id === 'portao' ? 'objetos/portao_h' : 'objetos/cerca_mourao', x, y, 1, 1, [16, 16]);
    Object.assign(o, { galinheiro: true, feita: id, portao: c.id === 'portao', cx: x, cy: y, em });   // (feita: poeEmpreitasNoMapa tira junto)
    o.desenha = ctx => desenhaCerca(ctx, o); o.acao = () => acaoGalinheiro();
  }
  b._galinheiro = R;
  tiraDoGalinheiro(b, R);
  filhosNoQuintalDeFora(b);
}
function acaoGalinheiro() {
  const id = GALINHEIRO.servico; if (G.empreitas.aceitas[id]) return acaoEmpreita(id);   // (pronto: entregar, como a plaquinha)
  const q = G.empreitas.feitas[id], ql = q > 1 ? ` (${NOME_QUALIDADE[q] || 'bom'})` : '';
  abrirPlaca(`O galinheiro do Tio Juca: obra do Jocelino${ql}. "Agora as minhas galinhas têm casa. Cerca boa segura galinha!"`);
  return true;
}
// O Jocelino que estava no lugar (o save no meio do cercado, a chegada pela porta de um mapa): vai para o ladrilho de fora mais perto.
function tiraDoGalinheiro(b, R) {
  if (G.mapa !== b || !G.jog) return;
  const sobre = (a, d) => a.x < d.x + d.w && a.x + a.w > d.x && a.y < d.y + d.h && a.y + a.h > d.y, preso = c => b.objs.some(o => o.galinheiro && o.caixa && sobre(c, o.caixa));
  const t = G.jog.ladrilho(); if (!dentroGalinheiro(R, t.x, t.y) && !preso(G.jog.caixa())) return;
  let melhor = null, dm = 1e9;
  for (const k of quintalDeFora(b)) { const [x, y] = k.split(',').map(Number), d = Math.hypot(x - t.x, y - t.y);
    if (d < dm && !dentroGalinheiro(R, x, y) && !bate(G.jog.caixa((x + 0.5) * TILE, y * TILE + 36), b)) { dm = d; melhor = [x, y]; } }
  if (melhor) { G.jog.x = (melhor[0] + 0.5) * TILE; G.jog.y = melhor[1] * TILE + 36; G.jog.parar(); }
}
// As 2 galinhas do Tio Juca ciscando no meio do cercado (a arte das galinhas da vizinhança; o código só move): cada uma anda até um
// ponto sorteado e fica bicando o chão até o próximo, pelo relógio do jogo (sem estado: o mesmo lugar em todo quadro).
function galinhasDoGalinheiro(b) {
  const R = b && b._galinheiro; if (!R) return [];
  const t = G.agora || 0, x0 = (R.x + 1) * TILE + 12, x1 = (R.x + R.w - 1) * TILE - 12, y0 = (R.y + 1) * TILE + 18, y1 = (R.y + R.h - 1) * TILE - 6;
  const ponto = (k, n) => { const f = mulberry(n * 977 + k * 131 + 7919); return { x: lerp(x0, x1, f()), y: lerp(y0, y1, f()) }; };
  return [0, 1].map(k => {
    const u = (t + k * 1.7) / (3.4 + k * 1.1), n = Math.floor(u), f = u - n, a = ponto(k, n - 1), c = ponto(k, n), anda = f < 0.3, s = anda ? f / 0.3 : 1, e = s * s * (3 - 2 * s);
    return { x: lerp(a.x, c.x, e), y: lerp(a.y, c.y, e), lado: c.x < a.x ? -1 : 1, quadro: anda || Math.floor(t * 3 + k) % 2 ? 'objetos/galinha_1' : 'objetos/galinha_2' };
  });
}
EXTRAS_MUNDO.push(m => m.id !== 'quintal' ? [] : galinhasDoGalinheiro(m).map(g => ({ y: g.y, desenha(ctx) {
  ctx.save(); ctx.translate(g.x, g.y); if (g.lado < 0) ctx.scale(-1, 1); desenhaPe(ctx, g.quadro, 0, 0, 1); ctx.restore(); } })));
