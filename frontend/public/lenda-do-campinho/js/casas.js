/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   CASAS (inspirado no Tibia)
   - Prédios dos mapas viram casas à venda (e onde não sobra prédio,
     o jogo constrói uma casinha). Cada lugar novo é mais caro.
   - Uma casa por pessoa. Compra na porta (ou com a corretora).
   - Móveis do Seu Tonico, o marceneiro: dentro da sua casa, use o
     móvel para colocar na sua frente; aperte E perto dele para guardar.
   - Ostentar: itens da mochila podem ficar expostos no chão (ou em
     cima de mesas e estantes). Tudo conta para o PRESTÍGIO da casa,
     e aparecem visitantes para admirar.
   Tudo fica salvo em save.casa = { id, moveis:[{x,y,id}], itens:[{x,y,id,r}] }
   (formato simples, pronto para um servidor no futuro multijogador).
   Carregar DEPOIS de montarias.js.
   ============================================================ */

// [mapa, nome do lugar, preço base, rua, tema da parede]
const CASA_LOCAIS = [
  ['vila', 'Vila do Campinho', 2500, 'Rua das Mangueiras', 'casa'],
  ['praia', 'Praia', 7000, 'Avenida da Orla', 'casa_azul'],
  ['cidade', 'Cidade', 18000, 'Rua do Comércio', 'casa_verde'],
  ['ct', 'CT', 30000, 'Alameda do Treino', 'casa'],
  ['estadio', 'Estádio', 45000, 'Travessa da Torcida', 'casa_verde'],
  ['cairo', 'Cairo', 80000, 'Rua do Nilo', 'casa_areia'],
  ['toquio', 'Tóquio', 120000, 'Rua das Cerejeiras', 'casa_zen'],
  ['doha', 'Doha', 160000, 'Avenida das Dunas', 'casa_areia'],
  ['miami', 'Miami', 220000, 'Ocean Drive', 'casa_rosa'],
  ['lisboa', 'Lisboa', 320000, 'Rua de Alfama', 'casa_luxo'],
  ['madri', 'Madri', 420000, 'Calle Mayor', 'casa_luxo'],
  ['milao', 'Milão', 550000, 'Via della Moda', 'casa_luxo'],
  ['munique', 'Munique', 700000, 'Rua do Relógio', 'casa_luxo'],
  ['londres', 'Londres', 900000, 'Baker Street', 'casa_luxo'],
];
const CASA_MAX_POR_MAPA = 3, CASA_MIN_POR_MAPA = 2;
const CASAS = {}, CASAS_POR_MAPA = {};
Object.assign(TEMA_PAREDE, {
  casa_azul: { papel: '#d8ecf6', listra: '#c4e0f0', rodape: '#3a7ab0' },
  casa_verde: { papel: '#e2f0d8', listra: '#d0e6c2', rodape: '#4a8a4a' },
  casa_areia: { papel: '#f0dcb0', listra: '#e6cc98', rodape: '#a8743a' },
  casa_zen: { papel: '#f4ece0', listra: '#e8dcc8', rodape: '#6a3a2a' },
  casa_rosa: { papel: '#fbe0ec', listra: '#f4cce0', rodape: '#c04a8a' },
  casa_luxo: { papel: '#3a2a4a', listra: '#4a3a5a', rodape: '#c8a040' },
});

/* ---------- móveis (Seu Tonico, o marceneiro) ---------- */
const MOVEIS = [
  ['tapete', 'Tapete', 150], ['vaso', 'Vaso de Flores', 120], ['palmeira_vaso', 'Palmeira no Vaso', 220], ['cama', 'Cama', 350], ['sofa', 'Sofá', 480],
  ['mesa', 'Mesa', 260], ['mesa_cafe', 'Mesinha de Café', 380], ['banco', 'Banco de Praça', 200], ['estante', 'Estante', 420], ['guarda_roupa', 'Guarda-roupa', 520],
  ['geladeira', 'Geladeira', 750], ['tv', 'TV', 900], ['bau', 'Baú (abre o armazém)', 320], ['balcao', 'Balcão', 500], ['lousa', 'Lousa Tática', 650], ['sacola_bolas', 'Sacola de Bolas', 260],
  ['cones', 'Cones de Treino', 110], ['bebedouro', 'Bebedouro', 420], ['maquina', 'Máquina de Lanches', 1600], ['cadeira_praia', 'Cadeira de Praia', 320], ['guarda_sol', 'Guarda-sol', 420],
  ['flamingo', 'Flamingo de Enfeite', 750], ['maneki', 'Gato da Sorte', 950], ['jarros', 'Jarros Egípcios', 950], ['lanterna_pedra', 'Lanterna Japonesa', 1200], ['bambu', 'Bambu Decorativo', 800],
  ['trofeu', 'Troféu Decorativo', 2000], ['bicicleta', 'Bicicleta de Enfeite', 3200], ['estatua', 'Estátua de Craque', 6000], ['vespa', 'Lambreta de Enfeite', 9000],
];
const MOVEL_EXPOSITOR = new Set(['mesa', 'mesa_cafe', 'balcao', 'estante', 'bau']); // dá para expor item em cima
for (const [obj, nome, preco] of MOVEIS) {
  ITENS['mv_' + obj] = { nome, tipo: 'movel', obj, preco, venda: Math.round(preco * 0.4), desc: `Móvel para decorar a sua casa.${MOVEL_EXPOSITOR.has(obj) ? ' Dá para expor itens em cima dele!' : ''} Dentro da sua casa, use (ou botão direito) para colocar na sua frente.` };
  ICON_ALIAS['mv_' + obj] = obj;
}
const _empilhaCs = empilha;
empilha = function (id) { return (ITENS[id] && ITENS[id].tipo === 'movel') || _empilhaCs(id); };

Object.assign(NPCS, {
  sonia: { nome: 'Dona Sônia, corretora de imóveis', ola: 'Casa própria é o sonho de todo craque! Tenho casas em todos os lugares por onde você passar — e quanto mais longe, mais caras.', corretora: true, look: { tipo: 'humano', corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-coque', corCabelo: 'castanho', roupa: 'roupa-terno', corRoupa: '#c04a4a', baixo: 'baixo-saia', rosto: 'rosto-redondos', alt: 1.7 } },
  tonico: { nome: 'Seu Tonico, o marceneiro', ola: 'Sofá, estante, troféu, até lambreta de enfeite! Tudo pra deixar a sua casa com a sua cara.', loja: MOVEIS.map(([o]) => 'mv_' + o), look: { tipo: 'humano', corpo: 'm', pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-xadrez', corRoupa: '#7a5a3a', baixo: 'baixo-jeans', chapeu: 'chapeu-bone', alt: 1.72 } },
});
if (typeof iconeNPC === 'function') { const _iconeNPCCs = iconeNPC; iconeNPC = function (n) { return ({ sonia: '🏠', tonico: '🪑', visitante: '👀' })[n.id] || _iconeNPCCs(n); }; }

/* ---------- casas nos mapas ---------- */
function livreParaCasa(m, x, y) {
  return x > 1 && y > 1 && x < m.w - 2 && y < m.h - 2 && !m.obj[y * m.w + x] && CH_ANDA(m.chao[y * m.w + x]) && m.chao[y * m.w + x] !== CH.AGUA
    && !m.saidas.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1) && !m.npcs.some(n => Math.abs(n.x - x) <= 2 && Math.abs(n.y - y) <= 2)
    && !m.campos.some(c => x >= c.x - 1 && x <= c.x + c.w && y >= c.y - 1 && y <= c.y + c.h)
    && !m.spawns.some(sp => Math.abs(sp.x - x) <= sp.raio + 1 && Math.abs(sp.y - y) <= sp.raio + 1)
    && !m.predios.some(p => x >= p.x - 1 && x <= p.x + p.w && y >= p.y - 1 && y <= p.y + p.h);
}
function constroiCasinha(m, ref) { // procura um terreno livre 5x3 (+ calçada embaixo) perto de ref
  const W = 5, H = 3; let melhor = null, md = 1e9;
  for (let y = 2; y < m.h - H - 2; y++) for (let x = 2; x < m.w - W - 2; x++) {
    const d = Math.hypot(x + W / 2 - ref.x, y + H - ref.y); if (d >= md) continue;
    let ok = true;
    for (let j = y; j <= y + H && ok; j++) for (let i = x; i < x + W && ok; i++) if (!livreParaCasa(m, i, j)) ok = false;
    if (ok) { melhor = { x, y }; md = d; }
  }
  if (!melhor) return null;
  const { x, y } = melhor; const px = x + Math.floor(W / 2);
  for (let j = y; j < y + H; j++) for (let i = x; i < x + W; i++) m.obj[j * m.w + i] = { t: 'x', v: 0, predio: true };
  m.obj[(y + H - 1) * m.w + px] = null;
  const p = { spr: 'b_casa', x, y, w: W, h: H, porta: { x: px, y: y + H - 1 } };
  m.predios.push(p); return p;
}
function criaCasasNoMapa(m, local) {
  const [mapa, nomeLocal, preco, rua, tema] = local;
  const saidaLivre = p => { const x = p.porta.x, y = p.porta.y + 1; return y < m.h && !m.obj[y * m.w + x] && CH_ANDA(m.chao[y * m.w + x]) && m.chao[y * m.w + x] !== CH.AGUA; };
  const ref = m.inicio || { x: m.w / 2, y: m.h / 2 };
  let cand = m.predios.filter(p => !p.interior && p.porta && !/aeroporto|sede/.test(p.spr) && p.w >= 4 && p.h >= 3 && saidaLivre(p));
  cand.sort((a, b) => Math.hypot(a.porta.x - ref.x, a.porta.y - ref.y) - Math.hypot(b.porta.x - ref.x, b.porta.y - ref.y));
  cand = cand.slice(0, CASA_MAX_POR_MAPA);
  const casaRef = m.predios.find(p => p.spr === 'b_casa') || ref;
  while (cand.length < CASA_MIN_POR_MAPA) { const p = constroiCasinha(m, casaRef.porta || casaRef); if (!p) break; cand.push(p); }
  const lista = [];
  cand.forEach((p, i) => {
    const id = `casa_${mapa}_${i + 1}`;
    const fator = clamp(p.w * p.h / 15, 0.8, 1.8);
    const def = { id, mapa, local: nomeLocal, nome: `${rua}, nº ${10 + i * 2}`, preco: Math.round(preco * fator / 100) * 100, iw: clamp(p.w + 5, 9, 14), ih: clamp(p.h + 5, 8, 11), tema, porta: { x: p.porta.x, y: p.porta.y } };
    p.interior = id;
    m.saidas.push({ x: p.porta.x, y: p.porta.y, para: id, porta: true, req: { flag: 'casa_' + id, casa: id, msg: `Casa à venda: ${def.nome}.` } });
    CASAS[id] = def; lista.push(id);
    MAPAS_DEF[id] = () => montaCasa(def);
  });
  CASAS_POR_MAPA[mapa] = lista;
}
for (const local of CASA_LOCAIS) {
  const base = MAPAS_DEF[local[0]]; if (!base) continue;
  MAPAS_DEF[local[0]] = function () { const m = base(); try { criaCasasNoMapa(m, local); } catch (e) { console.error('casas', e); } return m; };
}
// corretora e marceneiro: na Vila e na Cidade
for (const [npc, mapa, perto] of [['sonia', 'vila', 'juca'], ['tonico', 'vila', 'zuzu'], ['sonia', 'cidade', null], ['tonico', 'cidade', null]]) {
  const base = MAPAS_DEF[mapa]; if (!base) continue;
  MAPAS_DEF[mapa] = function () { const m = base(); if (typeof poeNpcPerto === 'function') poeNpcPerto(m, npc, perto); return m; };
}

/* ---------- interior da casa ---------- */
function montaCasa(def) {
  const b = interior(def.id, '🏠 ' + def.nome, def.iw, def.ih, CH.MADEIRA, def.tema || 'casa', def.mapa);
  const volta = b.m.saidas.find(s => s.volta); volta.tx = def.porta.x; volta.ty = def.porta.y + 1;
  b.m.casa = def.id;
  const s = G.save;
  if (s && s.casa && s.casa.id === def.id) for (const mv of s.casa.moveis) { const it = ITENS[mv.id]; if (it) b.m.obj[mv.y * b.m.w + mv.x] = { t: it.obj, v: 1, movel: mv.id }; }
  return b.m;
}
function minhaCasa() { const s = G.save; return s && s.casa && CASAS[s.casa.id] ? s.casa : null; }
function minhaCasaAqui() { const c = minhaCasa(); return !!(c && G.mapa && G.mapa.casa === c.id); }
function limpaCacheMapa(m) { delete m._mini; delete m._miniHD; }
function garanteTodasAsCasas() { for (const [mapa] of CASA_LOCAIS) if (MAPAS_DEF[mapa]) try { getMapa(mapa); } catch (e) { } }

/* ---------- prestígio ---------- */
const PONTOS_RAR = { comum: 1, incomum: 2, raro: 4, epico: 8, lendario: 15, mitico: 30 };
function prestigioCasa(c) {
  c = c || minhaCasa(); if (!c) return { pontos: 0, estrelas: 0 };
  let p = c.moveis.length;
  for (const it of c.itens) p += (PONTOS_RAR[raridadeItem(it.id)] || 1) + (it.r || 0);
  const estrelas = [5, 15, 35, 70, 130].filter(l => p >= l).length;
  return { pontos: p, estrelas };
}
const estrelasTxt = n => (n ? '★'.repeat(n) : '—') + ` (${n}/5)`;

/* ---------- comprar e vender ---------- */
function comprarCasa(id) {
  const s = G.save, def = CASAS[id]; if (!def) return;
  if (minhaCasa()) { log('Você já tem uma casa. Venda a sua (com a Dona Sônia) para comprar outra.', 'l-sis'); return; }
  if (s.ouro < def.preco) { log(`Faltam ${fmt(def.preco - s.ouro)} tostões para comprar essa casa.`, 'l-dano'); som('erro'); return; }
  s.ouro -= def.preco; s.casa = { id, moveis: [], itens: [], desde: Date.now() }; s.flags['casa_' + id] = true;
  delete MAPAS[id];
  banner('CASA PRÓPRIA!', def.nome); log(`🏠 Você comprou a casa ${def.nome} (${def.local}) por ${fmt(def.preco)} tostões! Decore com móveis do Seu Tonico e exponha seus itens.`, 'l-lendario'); som('nivel');
  salvar(); G.uiSujo = true; avisaMudancaCasa('compra');
}
function devolve(id, r) { // tenta pôr na mochila; se não couber, vai para o armazém
  const s = G.save;
  if (cabeNaMochila(id, r)) { if (r) { s.mochila.push({ id, q: 1, r }); G.uiSujo = true; return true; } if (addItem(id, 1)) return true; }
  armazem(); guardaNoArmazem(id, 1, r || 0); return false;
}
function venderCasa() {
  const s = G.save, c = minhaCasa(); if (!c) return;
  const def = CASAS[c.id]; const volta = Math.round(def.preco * 0.5);
  if (!confirm(`Vender a casa ${def.nome}? Você recebe ${fmt(volta)} tostões (metade do preço). Móveis e itens expostos voltam para você.`)) return;
  let dep = 0;
  for (const mv of c.moveis) if (!devolve(mv.id, 0)) dep++;
  for (const it of c.itens) if (!devolve(it.id, it.r)) dep++;
  s.ouro += volta; delete s.flags['casa_' + c.id]; s.casa = null; delete MAPAS[def.id];
  if (G.mapa && G.mapa.casa === def.id) trocaMapa(def.mapa, def.porta.x + 0.5, def.porta.y + 1.5);
  avisaMudancaCasa('venda');
  log(`Você vendeu a casa e recebeu ${fmt(volta)} tostões.${dep ? ` ${dep} coisa(s) não couberam na mochila: foram para o seu ARMAZÉM.` : ''}`, 'l-loot');
  salvar(); G.uiSujo = true; fechaModal();
}

/* ---------- colocar móveis e expor itens ---------- */
function lugaresNaFrente() {
  const p = G.p, t = tileDe(p), v = p.vista || 'frente';
  let f = v === 'costas' ? [0, -1] : v === 'lado' ? [p.flip ? -1 : 1, 0] : [0, 1];
  const viz = [f, [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  return viz.map(([dx, dy]) => ({ x: t.x + dx, y: t.y + dy }));
}
function itemNoTile(x, y) { const c = minhaCasa(); return c && c.itens.find(i => i.x === x && i.y === y); }
function podeColocar(x, y, tipo) {
  const m = G.mapa; if (x < 1 || y < 2 || x > m.w - 2 || y > m.h - 2) return false;
  const volta = m.saidas.find(s => s.volta); if (volta && x === volta.x && y >= m.h - 3) return false; // deixa o caminho da porta livre
  const o = m.obj[y * m.w + x]; const t = tileDe(G.p);
  if (tipo === 'movel') return !o && !itemNoTile(x, y) && !(t.x === x && t.y === y);
  return !itemNoTile(x, y) && (!o || (o.movel && MOVEL_EXPOSITOR.has(ITENS[o.movel].obj)));
}
function colocaMovel(id) {
  const s = G.save, m = G.mapa, it = ITENS[id];
  if (!minhaCasaAqui()) { log('Móveis só podem ser colocados dentro da SUA casa. A Dona Sônia, corretora, mostra as casas à venda.', 'l-sis'); return; }
  const t = tileDe(G.p); G.p.x = t.x + 0.5; G.p.y = t.y + 0.5; // centraliza para o móvel não prender o personagem
  const lugar = lugaresNaFrente().find(l => podeColocar(l.x, l.y, 'movel'));
  if (!lugar) { log('Não tem espaço livre perto de você. Vá para um lugar mais vazio.', 'l-sis'); return; }
  m.obj[lugar.y * m.w + lugar.x] = { t: it.obj, v: 1, movel: id }; s.casa.moveis.push({ x: lugar.x, y: lugar.y, id });
  removeItem(id, 1); limpaCacheMapa(m); efeito('puff', lugar.x + 0.5, lugar.y + 0.5); som('equip');
  log(`Você colocou ${it.nome} na sua casa. (Chegue perto e aperte E para guardar de novo.)`, 'l-info'); salvar(); G.uiSujo = true; avisaMudancaCasa('movel');
}
function exporItem(id, r) {
  const s = G.save, it = ITENS[id];
  if (!minhaCasaAqui()) { log('Só dá para expor itens dentro da SUA casa.', 'l-sis'); return; }
  if (it.tipo === 'chave') { log('Itens de missão não podem ser expostos.', 'l-sis'); return; }
  const lugar = lugaresNaFrente().find(l => podeColocar(l.x, l.y, 'item'));
  if (!lugar) { log('Não tem espaço livre perto de você para expor. (Dá para expor em cima de mesas, balcões, estantes e baús!)', 'l-sis'); return; }
  if (it.tipo === 'equip') removeEquipR(id, r || 0); else removeItem(id, 1);
  s.casa.itens.push({ x: lugar.x, y: lugar.y, id, r: r || 0 });
  efeito('estrelas', lugar.x + 0.5, lugar.y + 0.5, RARIDADE[raridadeItem(id)].cor); som('moeda');
  const pr = prestigioCasa(); log(`Você expôs ${nomeItem(id, r)} na sua casa. Prestígio: ${estrelasTxt(pr.estrelas)} (${pr.pontos} pontos).`, 'l-info');
  salvar(); G.uiSujo = true; fechaModal(); avisaMudancaCasa('item');
}
function guardaDaCasa(tipo, x, y) {
  const s = G.save, c = minhaCasa(), m = G.mapa; if (!c) return;
  if (tipo === 'movel') {
    if (itemNoTile(x, y)) { log('Tire primeiro o item que está em cima.', 'l-sis'); return; }
    const i = c.moveis.findIndex(mv => mv.x === x && mv.y === y); if (i < 0) return;
    const mv = c.moveis[i]; if (!devolve(mv.id, 0)) log('Mochila cheia: o móvel foi para o seu armazém.', 'l-sis');
    c.moveis.splice(i, 1); m.obj[y * m.w + x] = null; limpaCacheMapa(m);
  } else {
    const i = c.itens.findIndex(it => it.x === x && it.y === y); if (i < 0) return;
    const it = c.itens[i]; if (!devolve(it.id, it.r)) log('Mochila cheia: o item foi para o seu armazém.', 'l-sis');
    c.itens.splice(i, 1);
  }
  efeito('puff', x + 0.5, y + 0.5); som('equip'); salvar(); G.uiSujo = true; fechaModal(); avisaMudancaCasa('guardou');
}
// usar um móvel = colocar na casa
const _usarItemCs = usarItem;
usarItem = function (id) { if (ITENS[id] && ITENS[id].tipo === 'movel') { if (contaItem(id)) colocaMovel(id); return; } return _usarItemCs(id); };
// janela do item: botões de casa
const _modalItemCs = modalItem;
modalItem = function (id, r = 0) {
  _modalItemCs(id, r);
  const ops = document.querySelector('#modalConteudo .opcoes'); const it = ITENS[id]; if (!ops || !it) return;
  if (it.tipo === 'movel') ops.prepend(el('button', { class: 'btn amarelo', type: 'button', onclick: () => { fechaModal(); colocaMovel(id); } }, '🪑 Colocar na minha casa'));
  else if (it.tipo !== 'chave' && minhaCasaAqui()) ops.prepend(el('button', { class: 'btn amarelo', type: 'button', onclick: () => exporItem(id, r) }, '🏠 Expor na casa'));
};

/* ---------- interagir (E) com móveis e itens da casa ---------- */
const _interacaoPertoCs = interacaoPerto;
interacaoPerto = function () {
  const base = _interacaoPertoCs(); if (!minhaCasaAqui() || !G.p) return base;
  const c = minhaCasa(); let melhor = null, md = 1.35;
  for (const it of c.itens) { const d = Math.hypot(it.x + 0.5 - G.p.x, it.y + 0.5 - G.p.y); if (d < md) { md = d; melhor = { tipo: 'casa', qual: 'item', x: it.x + 0.5, y: it.y + 0.5, alt: 0.8, txt: 'Mexer: ' + ITENS[it.id].nome, ref: it }; } }
  for (const mv of c.moveis) { const d = Math.hypot(mv.x + 0.5 - G.p.x, mv.y + 0.5 - G.p.y); if (d < md - 0.05) { md = d; melhor = { tipo: 'casa', qual: 'movel', x: mv.x + 0.5, y: mv.y + 0.5, alt: 1, txt: 'Mexer: ' + ITENS[mv.id].nome, ref: mv }; } }
  if (!melhor) return base; if (!base) return melhor;
  return Math.hypot(base.x - G.p.x, base.y - G.p.y) < md ? base : melhor;
};
const _interagirCs = interagir;
interagir = function () {
  const it = interacaoPerto();
  if (it && it.tipo === 'casa') {
    const r = it.ref, obj = ITENS[r.id];
    const c = iconeClone(iconeItem(r.id)); c.style.width = '64px'; c.style.height = '64px';
    const txt = it.qual === 'item' ? `Exposto na sua casa. Raridade: ${RARIDADE[raridadeItem(r.id)].nome}.` : obj.desc;
    abreModal(el('h2', {}, nomeItem(r.id, r.r || 0)), el('div', { class: 'npc-topo' }, c, el('p', {}, txt)),
      el('div', { class: 'opcoes' },
        it.qual === 'movel' && obj.obj === 'bau' ? el('button', { class: 'btn verde', type: 'button', onclick: () => modalArmazem() }, '📦 Abrir o armazém') : '',
        el('button', { class: 'btn amarelo', type: 'button', onclick: () => guardaDaCasa(it.qual, r.x, r.y) }, it.qual === 'item' ? 'Pegar de volta' : 'Guardar na mochila'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
    return;
  }
  return _interagirCs();
};
// porta de casa à venda: abre a janela de compra
function abreCasaPorta(id) {
  const def = CASAS[id]; if (!def) return; const s = G.save; const tem = minhaCasa();
  const sim = s.ouro >= def.preco && !tem;
  abreModal(el('h2', {}, '🏠 Casa à venda'),
    el('p', {}, el('b', {}, def.nome), ` — ${def.local}`),
    el('ul', { class: 'casa-info' }, el('li', {}, `Tamanho: ${def.iw - 2} × ${def.ih - 3} quadradinhos para decorar`), el('li', {}, `Preço: ${fmt(def.preco)} tostões (você tem ${fmt(s.ouro)})`),
      el('li', {}, 'Uma casa por pessoa (como no Tibia). Dentro dela você coloca móveis e expõe seus itens para todo mundo ver.')),
    tem ? el('p', { class: 'casa-aviso' }, `Você já tem a casa ${CASAS[tem.id].nome}. Para trocar, venda a sua com a Dona Sônia.`) : null,
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn amarelo', type: 'button', disabled: sim ? null : 'disabled', onclick: () => { comprarCasa(id); fechaModal(); } }, sim ? `Comprar por ${fmt(def.preco)}` : tem ? 'Você já tem casa' : `Faltam ${fmt(def.preco - s.ouro)}`),
      el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Agora não')));
}

/* ---------- Dona Sônia: lista de casas e a sua casa ---------- */
function modalCorretora() {
  garanteTodasAsCasas();
  const s = G.save, c = minhaCasa(); const blocos = [];
  if (c) {
    const def = CASAS[c.id], pr = prestigioCasa(c);
    blocos.push(el('div', { class: 'casa-minha' }, el('b', {}, `🏠 Sua casa: ${def.nome}`), el('small', {}, `${def.local} · ${c.moveis.length} móveis · ${c.itens.length} itens expostos · Prestígio ${estrelasTxt(pr.estrelas)} (${pr.pontos} pts)`),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: venderCasa }, `Vender (recebe ${fmt(Math.round(def.preco * 0.5))})`))));
  }
  const lista = el('div', { class: 'lista' });
  for (const [mapa, nomeLocal] of CASA_LOCAIS) for (const id of (CASAS_POR_MAPA[mapa] || [])) {
    const def = CASAS[id]; const minha = c && c.id === id;
    lista.append(el('div', { class: 'linha-item' + (minha ? ' casa-sua' : '') }, el('div', { class: 'nm' }, el('b', {}, `${minha ? '🏠 ' : ''}${def.nome}`), el('small', {}, `${nomeLocal} · ${def.iw - 2}×${def.ih - 3}${minha ? ' · SUA CASA' : ''}`)), precoTag(def.preco)));
  }
  abreModal.largo = true;
  abreModal(el('h2', {}, '🏠 Casas à venda'), el('p', {}, 'Cada lugar novo tem casas mais caras. Para comprar, vá até a PORTA da casa e entre nela. Você pode ter uma casa por vez.'), ...blocos, lista);
}
const _abrirNPCCs = abrirNPC;
abrirNPC = function (npc) {
  if (npc && npc.d && npc.d.corretora) return modalCorretora();
  if (npc && npc.id === 'visitante') { fala(npc, npc.d.comentario || 'Que casa bonita!'); return; }
  return _abrirNPCCs(npc);
};

/* ---------- desenho: itens expostos e placas das portas ---------- */
// o que é aviso para a nuvem (nuvem.js troca esta função); aqui não faz nada
function avisaMudancaCasa(tipo) { }
// itens expostos visíveis agora: os da sua casa, ou os da casa que você está visitando
function itensVisiveisCasa() { if (minhaCasaAqui()) return minhaCasa().itens; if (G.mapa && G.mapa.visita) return G.mapa.visita.itens; return null; }
function desenhaItensCasa(ctx) {
  const lista = itensVisiveisCasa(); if (!lista) return;
  for (const it of lista) { if (!ITENS[it.id]) continue;
    const o = G.mapa.obj[it.y * G.mapa.w + it.x]; const cima = o && o.movel ? (ITENS[o.movel].obj === 'estante' ? 1.0 : 0.55) : 0;
    const x = (it.x + 0.5) * T, y = (it.y + 0.62 - cima) * T; const rar = raridadeItem(it.id); const cor = RARIDADE[rar].cor;
    const bob = Math.sin(G.agora / 500 + it.x * 1.7 + it.y) * 2.5;
    ctx.save();
    if (!cima) { ctx.fillStyle = 'rgba(30,20,40,0.28)'; ctx.beginPath(); ctx.ellipse(x, y + 4, T * 0.3, T * 0.12, 0, 0, 7); ctx.fill(); }
    const g = ctx.createRadialGradient(x, y - T * 0.2, 2, x, y - T * 0.2, T * 0.42); const k = bRgb(cor);
    g.addColorStop(0, `rgba(${k[0]},${k[1]},${k[2]},${rar === 'comum' ? 0.25 : 0.55})`); g.addColorStop(1, `rgba(${k[0]},${k[1]},${k[2]},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - T * 0.2, T * 0.42, 0, 7); ctx.fill();
    const ic = iconeItem(it.id); const s = T * 0.56; ctx.drawImage(ic, x - s / 2, y - T * 0.2 - s / 2 + bob, s, s);
    if (PONTOS_RAR[rar] >= 8 && Math.sin(G.agora / 180 + it.x) > 0.7) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + T * 0.18, y - T * 0.42 + bob, 2.5, 0, 7); ctx.fill(); }
    ctx.restore();
  }
}
const _desenhaDropsCs = desenhaDrops;
desenhaDrops = function (ctx) { desenhaItensCasa(ctx); _desenhaDropsCs(ctx); };
// texto em cima da porta (nuvem.js mostra a casa de outro jogador aqui)
function infoPortaCasa(id) {
  const c = minhaCasa(), def = CASAS[id];
  if (c && c.id === id) return { txt: `🏠 Casa de ${G.save.nome} ${estrelasTxt(prestigioCasa().estrelas)}`, cor: '#ffe14a' };
  return { txt: `🏠 À venda · ${fmt(def.preco)}`, cor: '#9affb0' };
}
const _desenhaBuffsCs = desenhaBuffs;
desenhaBuffs = function (ctx) {
  _desenhaBuffsCs(ctx);
  const lista = G.mapa && CASAS_POR_MAPA[G.mapa.id]; if (!lista || !G.p) return;
  const c = minhaCasa(); const px = G.dpr || 1;
  for (const id of lista) {
    const def = CASAS[id]; const dx = def.porta.x + 0.5 - G.p.x, dy = def.porta.y + 1 - G.p.y; if (Math.hypot(dx, dy) > 5.5) continue;
    const sx = ((def.porta.x + 0.5) * T - G.cam.x) * G.zoom, sy = ((def.porta.y - 0.25) * T - G.cam.y) * G.zoom;
    const info = infoPortaCasa(id);
    rotulo(ctx, info.txt, sx, sy, info.cor, 12);
    if (info.desenha) info.desenha(ctx, sx, sy, px);
  }
};

/* ---------- visitantes admiram a casa ---------- */
const NOMES_VISITA = [['Dona Cotinha', 'f'], ['Seu Zeca', 'm'], ['Tia Marlene', 'f'], ['Juninho', 'm'], ['Dona Lurdes', 'f'], ['Seu Arlindo', 'm'], ['Manu', 'f'], ['Pedrinho', 'm']];
function comentarioVisita() {
  const c = minhaCasa(); if (!c) return 'Que casa aconchegante!';
  const melhor = c.itens.slice().sort((a, b) => (PONTOS_RAR[raridadeItem(b.id)] || 0) - (PONTOS_RAR[raridadeItem(a.id)] || 0))[0];
  if (!melhor) return c.moveis.length > 4 ? 'Que casa bem decorada!' : 'Casa novinha! Falta decorar, hein?';
  const rar = raridadeItem(melhor.id), nome = nomeItem(melhor.id, melhor.r);
  return { mitico: `NÃO ACREDITO! Um(a) ${nome} MÍTICO(A)?!`, lendario: `Uau! ${nome}... isso é LENDÁRIO!`, epico: `Olha só: ${nome}! Que raridade!`, raro: `${nome}? Bonito, hein!`, incomum: `Gostei do(a) ${nome}.`, comum: `Hmm, ${nome}. Legal!` }[rar];
}
let VISITA_PROX = 0;
const _atualizaCs = atualiza;
atualiza = function (dt) {
  _atualizaCs(dt);
  // visitante some depois de um tempo
  if (G.npcs.some(n => n.temp && G.agora > n.temp)) G.npcs = G.npcs.filter(n => !(n.temp && G.agora > n.temp));
  if (!minhaCasaAqui()) { VISITA_PROX = 0; return; }
  const c = minhaCasa(); if (!c.itens.length && c.moveis.length < 3) return;
  if (!VISITA_PROX) VISITA_PROX = G.agora + rnd(15000, 25000);
  if (G.agora < VISITA_PROX || G.npcs.some(n => n.id === 'visitante')) return;
  VISITA_PROX = G.agora + rnd(40000, 70000);
  const volta = G.mapa.saidas.find(s => s.volta); if (!volta) return;
  const [nome, corpo] = NOMES_VISITA[rndi(0, NOMES_VISITA.length - 1)];
  const cor = ['#e04a4a', '#4a8ae0', '#4ac06a', '#e0a03a', '#a04ae0'][rndi(0, 4)];
  const look = { tipo: 'humano', corpo, pele: ['pele-clara', 'pele-media', 'pele-morena', 'pele-negra'][rndi(0, 3)], cabelo: corpo === 'f' ? 'cabelo-coque' : 'cabelo-curto', corCabelo: ['preto', 'castanho', 'grisalho', 'loiro'][rndi(0, 3)], roupa: 'roupa-camiseta', corRoupa: cor, baixo: 'baixo-jeans', alt: 1.66 };
  const coment = comentarioVisita();
  const v = { id: 'visitante', d: { nome: nome + ' (visita)', ola: coment, comentario: coment, look }, x: volta.x + 0.5, y: volta.y - 0.5, flip: false, r: 0.32, temp: G.agora + 15000 };
  G.npcs.push(v); efeito('puff', v.x, v.y); setTimeout(() => { if (G.npcs.includes(v)) fala(v, coment); }, 600);
  log(`👀 ${nome} veio visitar sua casa: "${coment}"`, 'l-npc');
};
// ao entrar na própria casa: placa com o prestígio
const _entrarMapaCs = entrarMapa;
entrarMapa = function (id, x, y, silencioso) {
  const r = _entrarMapaCs(id, x, y, silencioso);
  if (minhaCasaAqui()) { const pr = prestigioCasa(); banner(`Casa de ${G.save.nome}`, `Prestígio ${estrelasTxt(pr.estrelas)}`); dica('casa_dentro', 'Bem-vindo(a) à sua casa! Móveis: compre com o Seu Tonico e use na mochila para colocar. Itens: abra um item da mochila e toque em "Expor na casa". Chegue perto e aperte E para mexer.'); }
  return r;
};
// outra partida na mesma aba: as casas são montadas de novo com o save certo
const _iniciarJogoCs = iniciarJogo;
iniciarJogo = async function (save) { for (const id in CASAS) delete MAPAS[id]; return _iniciarJogoCs.apply(this, arguments); };

(function () {
  const st = document.createElement('style');
  st.textContent = `
  .casa-info { margin: 6px 0; padding-left: 18px; }
  .casa-aviso { background: #ffe8d8; border-radius: 8px; padding: 6px 10px; color: #8a2a1a; font-weight: 800; }
  .casa-minha { background: #fff2d0; border: 2px solid #e8c060; border-radius: 10px; padding: 8px 10px; margin: 6px 0; display: flex; flex-direction: column; gap: 3px; }
  .casa-minha small { font-family: Nunito, sans-serif; font-weight: 700; color: #6a4a2a; }
  .linha-item.casa-sua { background: #fff2a0; }
  `;
  document.head.append(st);
})();
