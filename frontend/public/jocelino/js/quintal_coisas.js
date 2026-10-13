// Jocelino — quintal_coisas.js — o que se põe no quintal (o "colocar" do Stardew; mapa_quintal.gd do Godot): cerca que se
// liga sozinha, portão, irrigador; machado ou picareta recolhe. O Tio Juca faz a cerca e o portão com madeira. As
// galinhas da vizinhança bicam a horta aberta (os corvos do Stardew), o irrigador do Tonico rega de manhã e os filhos
// ajudam a regar.

const COLOCAVEIS_QUINTAL = ['cerca', 'portao', 'irrigador', 'irrigador_bom', 'forja', 'betoneira'];
// Motivo para não colocar ('' = pode).
function podeColocar(b, x, y) {
  if (b.id !== 'quintal' || !b.livreEm(x, y)) return 'Aqui não dá.';
  if (b.saidaEm(x, y) || b.chaoEm(x, y) !== CH.GRAMA) return 'Na trilha não: o caminho até a Vila fica livre.';
  if (b.ocupado.has(chaveT(x, y))) return 'Já tem coisa aí.';
  if (reservadoQuintal(x, y)) return 'Esse terreno é da obra da família.';
  const c = Horta.cova(x, y); if (c && c.planta) return 'Tem planta aí: escolha uma cova vazia ou a grama (a foice arranca um pé, se quiser abrir o meio).';
  // A caixa sólida do objeto (ladrilho inteiro de largura) não pode encostar no pé do Jocelino nem de um morador: prenderia.
  const cx = b._caixa((x + 0.5) * TILE, (y + 1) * TILE, 48, 48), sobre = (a, d) => a.x < d.x + d.w && a.x + a.w > d.x && a.y < d.y + d.h && a.y + a.h > d.y;
  if (sobre(cx, G.jog.caixa())) return 'O Jocelino está em cima.';
  if (b.moradores.some(m => m.visivel !== false && sobre(cx, { x: m.x - 14, y: m.y - 14, w: 28, h: 14 }))) return 'Tem gente aí.';
  return '';
}
// A cerca do Stardew: um mourão por ladrilho; duas ripas ligam o mourão ao da direita e uma ripa (vista de cima) ao de
// baixo; o portão fica no lugar do mourão, de frente numa fileira e de lado numa coluna. As ripas e o portão ocupam só o
// vão entre as bordas dos mourões (o mourão tem 14 px), então a ordem do desenho não importa. Peça = {arte, x, y, w, h}.
const colocadoEm = (x, y) => G.horta.colocados.find(c => c.x === x && c.y === y && (c.id === 'cerca' || c.id === 'portao'));
const ehCerca = (x, y) => { const c = colocadoEm(x, y); return !!c && c.id === 'cerca'; };
function pecasCerca(x, y) {
  const c = colocadoEm(x, y); if (!c) return [];
  const cx = x * TILE + TILE / 2, base = (y + 1) * TILE, MEIO = 7, r = [];
  if (c.id === 'portao') {
    const deLado = (colocadoEm(x, y - 1) || colocadoEm(x, y + 1)) && !colocadoEm(x - 1, y) && !colocadoEm(x + 1, y);
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
function desenhaCerca(ctx, o) { for (const p of pecasCerca(o.cx, o.cy)) { const img = spr(p.arte); if (img) ctx.drawImage(img, p.x, p.y, p.w, p.h); } }
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
  }
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
  const m = podeColocar(G.mapa, x, y); if (m) { avisar(m); return false; }
  if (Horta.cova(x, y)) delete G.horta.covas[chaveH(x, y)];   // cova vazia vira chão de cerca
  G.horta.colocados.push({ id, x, y }); G.mochila.remover(id, 1);
  sons.tocar('pousar', 1, 0.05, -4); poeColocados(G.mapa); hudSujo(); return true;
}
function recolher(o) {
  G.horta.colocados = G.horta.colocados.filter(c => !(c.x === o.cx && c.y === o.cy));
  const sobra = G.mochila.adicionar(o.item, 1); if (sobra) soltar(o.item, 1, o.x, o.y - 10);
  sons.tocar('madeira', 1, 0.05, -4); poeColocados(G.mapa); hudSujo();
}
AO_MONTAR.push(b => { if (b.id === 'quintal') poeColocados(b); });

// O Tio Juca faz cerca (2 madeiras) e portão (5) — "cerca boa segura galinha e segura menino".
function falaDe(p) {
  const f = FALAS[p.id], paginas = typeof f === 'function' ? f() : (f || ['Bom dia, Jocelino!']);
  return Array.isArray(paginas[0]) ? paginas[0] : paginas;
}
// Quanto custa cada coisa do Tio Juca (madeiras) e o que ele oferece: 1 cerca, 10 cercas e "quantas a madeira der" (teste de
// 12/10: "ficar comprando de 1 em 1 é chato"; no Stardew a loja compra 5 com Shift), e o portão.
const MADEIRA_JUCA = { cerca: 2, portao: 5 };
function opcoesJuca() {
  const m = G.mochila.total('madeira'), max = Math.floor(m / MADEIRA_JUCA.cerca), r = [];
  if (max >= 1) r.push(['Fazer 1 cerca (2 madeiras)', 'cerca', 1]);
  if (max >= 10) r.push(['Fazer 10 cercas (20 madeiras)', 'cerca', 10]);
  if (max > 1 && max !== 10) r.push([`Fazer ${max} cercas: toda a madeira (${max * MADEIRA_JUCA.cerca} madeiras)`, 'cerca', max]);
  if (m >= MADEIRA_JUCA.portao) r.push(['Fazer portão (5 madeiras)', 'portao', 1]);
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
  const fala = falaDe(p);
  if (G.mochila.total('madeira') < MADEIRA_JUCA.cerca) { abrirConversa(p.nome, urlArte('retratos/juca_normal'), fala); return true; }
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
let _galinha = null;   // {x, y, foge, lado, t} em pixels
ATUALIZADORES.push(dt => {
  if (!G.horta || !G.horta.galinha || G.mapaId !== 'quintal') { _galinha = null; return; }
  if (!_galinha) _galinha = { x: (G.horta.galinha.x + 0.5) * TILE, y: (G.horta.galinha.y + 1) * TILE, foge: false, lado: 1, t: 0 };
  const g = _galinha; g.t += dt;
  if (!g.foge && Math.hypot(G.jog.x - g.x, G.jog.y - g.y) < 3 * TILE) { g.foge = true; g.lado = G.jog.x < g.x ? 1 : -1; sons.tocar('pegar', 1.6, 0.1, -8); }
  if (g.foge) { g.x += g.lado * 260 * dt; const L = G.mapa.livre; if (g.x < L.x * TILE || g.x > (L.x + L.w) * TILE) { G.horta.galinha = null; _galinha = null; } }
});
AO_MONTAR.push(b => { if (b.id === 'quintal') b.extras = () => _galinha ? [{ y: _galinha.y, desenha(ctx) {
  const g = _galinha, quadro = g.foge || Math.floor(g.t * 3) % 2 ? 'objetos/galinha_1' : 'objetos/galinha_2';
  ctx.save(); ctx.translate(g.x, g.y); if (g.lado < 0 || (!g.foge && Math.floor(g.t / 2) % 2)) ctx.scale(-1, 1); desenhaPe(ctx, quadro, 0, 0, 1); ctx.restore(); } }] : []; });
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
function desenhaAlcanceIrrigador(ctx) {
  const id = typeof itemDaMao === 'function' ? itemDaMao() : '';
  if (!VIZ_IRRIGADOR[id] || G.mapaId !== 'quintal' || !G.horta || !G.mouse || (typeof menuAberto === 'function' && menuAberto())) return;
  const pinta = (x, y, cor) => { ctx.fillStyle = cor; ctx.fillRect(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6); };
  ctx.save();
  for (const c of G.horta.colocados) if (VIZ_IRRIGADOR[c.id]) for (const [dx, dy] of VIZ_IRRIGADOR[c.id]) pinta(c.x + dx, c.y + dy, 'rgba(70,160,255,0.22)');
  const t = ladrilhoDoMouse(), ok = !podeColocar(G.mapa, t.x, t.y) && perto1(t);
  for (const [dx, dy] of VIZ_IRRIGADOR[id]) pinta(t.x + dx, t.y + dy, 'rgba(70,160,255,0.4)');
  pinta(t.x, t.y, ok ? 'rgba(80,210,80,0.5)' : 'rgba(225,60,50,0.5)');
  ctx.restore();
}
MANHA.push(() => { if (G.horta) regarComIrrigadores(); });

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
  if (!G.horta.pedidoFilhos && !G.horta.filhos && Horta.plantadas() >= 8) { G.horta.pedidoFilhos = true; G.feitosHoje.push('O Zezinho quer falar com você sobre a horta.'); }
  const n = filhosRegam(); if (n) G.feitosHoje.push(`O Zezinho e a Ritinha regaram ${n} ${n === 1 ? 'cova' : 'covas'}.`);
});
TAREFAS.push(() => G.horta && G.horta.pedidoFilhos && !G.horta.filhos ? [{ texto: G.mochila.total('regadorzinho') ? 'Dar o regadorzinho ao Zezinho' : 'Comprar o regadorzinho do Zezinho (Ananias, Cr$ 30)' }] : []);
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
ATUALIZADORES.push(() => {
  const b = MAPAS.quintal; if (!b || !G.horta || !G.horta.filhos) return;
  const ks = Object.keys(G.horta.covas).filter(k => G.horta.covas[k].planta), manha = G.minutos >= 7 * 60 && G.minutos < 9 * 60 && ks.length;
  for (const id of ['zezinho', 'ritinha']) {
    const m = b.moradores.find(p => p.id === id); if (!m) continue;
    if (!m._areaCasa) m._areaCasa = m.area;
    if (manha) { const xs = ks.map(k => +k.split(',')[0]), ys = ks.map(k => +k.split(',')[1]); m.area = { x: Math.min(...xs) * TILE, y: Math.min(...ys) * TILE, w: (Math.max(...xs) - Math.min(...xs) + 1) * TILE, h: (Math.max(...ys) - Math.min(...ys) + 1) * TILE }; }
    else m.area = m._areaCasa;
  }
});
