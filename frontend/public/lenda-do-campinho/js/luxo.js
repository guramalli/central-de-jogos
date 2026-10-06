/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   MOCHILA MAIOR, VENDA DE LOOT E LOJA DE LUXO (v152)
   - BOLSAS (tipo 'bolsa'): ficam DENTRO da mochila e aumentam os espaços
     (+8, +15, +25, +40). Contam até 4 bolsas (capMochila no game.js).
     Não dá para tirar uma bolsa se as coisas não couberem sem ela.
   - Lojas: "💰 Vender todo o loot" (só itens tipo 'loot'; não vende o que
     uma missão ainda pede, nem equipamento/poção/comida).
   - BARÃO DIAMANTE (Miami, perto do Mr. Johnny): montarias e skins de
     luxo ABSURDAMENTE caras + as bolsas grandes. Precisa do nível.
   Carregar DEPOIS de montarias.js e montaria_arte.js.
   ============================================================ */

// ---------- bolsas ----------
const BOLSAS = {
  bolsinha: { nome: 'Bolsinha de Couro', espacos: 8, lvl: 5, preco: 900, desc: 'Presa na mochila: +8 espaços.' },
  mochila_viagem: { nome: 'Mochila de Viagem', espacos: 15, lvl: 40, preco: 30000, desc: 'Cabe muita coisa: +15 espaços.' },
  mochila_craque: { nome: 'Mochila do Craque', espacos: 25, lvl: 120, preco: 600000, desc: 'Mochila de atleta profissional: +25 espaços.' },
  mochila_galactica: { nome: 'Mochila Galáctica', espacos: 40, lvl: 300, preco: 9000000, desc: 'Tecnologia alienígena, cabe um estádio: +40 espaços.' },
};
for (const [id, b] of Object.entries(BOLSAS)) {
  ITENS[id] = { nome: b.nome, tipo: 'bolsa', espacos: b.espacos, lvl: b.lvl, preco: b.preco, venda: 0, raro: b.espacos >= 25, desc: `${b.desc} Fica dentro da mochila (até 4 bolsas contam).`, icon: { k: 'pacote', c: '#a8743a' } };
  const ic = 'i_' + id; if (!ASSET_SET.has(ic)) { ASSETS.push(ic); ASSET_SET.add(ic); }
}
// bolsinha e mochila de viagem em toda loja comum
for (const [id, n] of Object.entries(NPCS)) if (Array.isArray(n.loja) && !/casa|movel|marcen/i.test(id + (n.nome || ''))) for (const b of ['bolsinha', 'mochila_viagem']) if (!n.loja.includes(b)) n.loja.push(b);

// tirar uma bolsa: só se o resto couber sem ela
function podeTirarBolsa(id) {
  const s = G.save; if (!ITENS[id] || ITENS[id].tipo !== 'bolsa') return true;
  const i = s.mochila.findIndex(x => x.id === id); if (i < 0) return true;
  const sem = { mochila: s.mochila.filter((x, k) => k !== i) };
  if (sem.mochila.length > capMochila(sem)) { log(`Não dá para tirar a ${ITENS[id].nome}: suas coisas não caberiam na mochila. Guarde ou venda algumas antes.`, 'l-dano'); som('erro'); return false; }
  return true;
}
const _removeItemLx = removeItem;
removeItem = function (id, q) { if (!podeTirarBolsa(id)) return false; return _removeItemLx.apply(this, arguments); };
if (typeof guardaDaMochila === 'function') { const _guardaLx = guardaDaMochila; guardaDaMochila = function (i) { const e = G.save.mochila[i]; if (e && !podeTirarBolsa(e.id)) return false; return _guardaLx.apply(this, arguments); }; }

// ---------- vender todo o loot ----------
function lootVendavel() {
  const s = G.save; const pede = typeof itemPedidoEmMissao === 'function' ? itemPedidoEmMissao : () => false;
  return s.mochila.filter(m => { const it = ITENS[m.id]; return it && it.tipo === 'loot' && it.venda > 0 && !m.r && !pede(m.id); });
}
async function venderTodoLoot(npc) {
  const s = G.save; const lista = lootVendavel(); if (!lista.length) return;
  const total = lista.reduce((a, m) => a + ITENS[m.id].venda * m.q, 0), n = lista.reduce((a, m) => a + m.q, 0);
  if (!(await perguntaJogo(`Vender ${fmt(n)} item(ns) de loot por ${fmt(total)} tostões?\n(Equipamentos, poções, comidas e o que uma missão ainda pede NÃO são vendidos.)`, { sim: 'Vender tudo' }))) return;
  for (const m of lista) _removeItemLx(m.id, m.q);
  s.ouro += total; som('moeda'); log(`💰 Vendeu ${fmt(n)} item(ns) de loot por ${fmt(total)} tostões.`, 'l-loot'); salvar(); G.uiSujo = true;
  modalLoja(npc, 'vender');
}
const _modalLojaLx = modalLoja;
modalLoja = function (npc, aba = 'comprar') {
  const r = _modalLojaLx.apply(this, arguments);
  if (aba === 'vender') {
    const lista = lootVendavel(); const box = document.getElementById('modalConteudo');
    const alvo = box && box.querySelector('.tabs-modal');
    if (alvo && lista.length) {
      const total = lista.reduce((a, m) => a + ITENS[m.id].venda * m.q, 0);
      alvo.after(el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => venderTodoLoot(npc) }, `💰 Vender todo o loot (${fmt(total)} tostões)`)));
    }
  }
  return r;
};

// ---------- montarias e skins de luxo ----------
Object.assign(MONTARIAS, {
  hover: { nome: 'Hoverboard Arco-Íris', lvl: 120, bonus: 0.72, tipo: 'skate', luxo: 4000000, desc: 'Flutua com um rastro de arco-íris. +72% de velocidade.' },
  diamante: { nome: 'Carrão de Diamante', lvl: 200, bonus: 0.76, spr: 'carro_luxo', face: 'e', w: 2.9, janela: [0.3, 0.18, 0.54, 0.4], escala: 0.62, vista: 'frente', luxo: 20000000, desc: 'Feito de cristal brilhante. Só os MUITO ricos! +76% de velocidade.' },
  dragao: { nome: 'Dragão Dourado', lvl: 280, bonus: 0.82, spr: 'carro_luxo', face: 'e', w: 2.6, janela: [0.3, 0.18, 0.54, 0.4], escala: 0.62, vista: 'frente', luxo: 90000000, desc: 'Um dragão amigo de escamas de ouro. +82% de velocidade.' },
  nave: { nome: 'Nave Estelar', lvl: 350, bonus: 0.88, spr: 'carro_luxo', face: 'e', w: 2.4, janela: [0.3, 0.18, 0.54, 0.4], escala: 0.62, vista: 'frente', luxo: 350000000, desc: 'Direto da Copa Intergaláctica. A montaria mais rara do jogo! +88% de velocidade.' },
});
const MONT_LUXO = ['hover', 'diamante', 'dragao', 'nave'];
MONT_LUXO.forEach(id => { if (!ORDEM_MONT.includes(id)) ORDEM_MONT.push(id); });
Object.assign(MONT_ARTE, { hover: { w: 1.3, anda: 300 }, diamante: { w: 2.9, anda: 260, face: 'e' }, dragao: { w: 2.5, anda: 220 }, nave: { w: 2.4, anda: 200 } });
const ARTE_LUXO = { hover: 'mt_hover', diamante: 'mt_diamante', dragao: 'mt_dragao', nave: 'mt_nave' };
Object.values(ARTE_LUXO).forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
// ícone da montaria de luxo = o quadro 1 da arte (com o jogador pintado)
const _iconeMontariaLx = iconeMontaria;
iconeMontaria = function (id) {
  if (!ARTE_LUXO[id] || typeof montariaPintada !== 'function') return _iconeMontariaLx.apply(this, arguments);
  const c = mkCanvas(96, 72); const x = c.getContext('2d');
  try { const im = montariaPintada(id, 0, specDe(lookJogador())); if (im) { const s = Math.min(92 / im.width, 70 / im.height); x.drawImage(im, (96 - im.width * s) / 2, (72 - im.height * s) / 2, im.width * s, im.height * s); } } catch (e) { }
  return c;
};

Object.assign(SKINS, {
  diamante: { nome: 'Craque Diamante', lvl: 150, luxo: 6000000, efeito: 'brilho', cor: '#bff4ff', look: { roupa: 'roupa-futebol', corRoupa: '#cfefff', corBaixo: '#8ad8ff', rosto: 'rosto-estrela', costas: 'costas-capa' }, desc: 'Uniforme de cristal com brilho de diamante.' },
  rei: { nome: 'Rei do Campinho', lvl: 200, luxo: 25000000, efeito: 'aura', cor: '#ffd23a', look: { roupa: 'roupa-smoking-ouro', chapeu: 'chapeu-coroa', costas: 'costas-capa', pescoco: 'pescoco-medalha' }, desc: 'Coroa, capa real e camisa de ouro. Majestade!' },
  rockstar: { nome: 'Astro do Rock Dourado', lvl: 250, luxo: 70000000, efeito: 'neon', cor: '#ff3ad0', look: { roupa: 'roupa-rockstar-ouro', rosto: 'rosto-escuros', chapeu: 'chapeu-cartola' }, desc: 'Jaqueta de ouro, cartola e luz de show.' },
  galaxia: { nome: 'Imperador Galáctico', lvl: 320, luxo: 180000000, efeito: 'estrelas', cor: '#b89aff', look: { roupa: 'roupa-couro', corRoupa: '#4a2a9a', corBaixo: '#1a1440', chapeu: 'chapeu-espartano-ouro', costas: 'costas-anjo', rosto: 'rosto-estrela' }, desc: 'Armadura do espaço, capa estrelada e uma chuva de estrelas.' },
  arcoiris: { nome: 'Lenda Arco-Íris', lvl: 380, luxo: 600000000, efeito: 'arcoiris', cor: '#ff5ad0', look: { roupa: 'roupa-cavaleiro-ouro', chapeu: 'chapeu-louros', costas: 'costas-anjo', pescoco: 'pescoco-medalha' }, desc: 'A skin mais cara do jogo: brilho de TODAS as cores.' },
});
const SKIN_LUXO = ['diamante', 'rei', 'rockstar', 'galaxia', 'arcoiris'];

// fantasias DESENHADAS (folhas a/boneco_sk_*.webp, 4x3 como as outras skins; só cabelo e pele seguem os do jogador)
Object.assign(META_BONECOS, {"sk_diamante":[{"cabeca":[42,55,158,151],"tronco":[82,151,118,210]},{"cabeca":[40,55,158,151],"tronco":[82,151,118,210]},{"cabeca":[44,54,161,150],"tronco":[82,150,118,210]},{"cabeca":[43,55,160,151],"tronco":[82,151,118,210]},{"cabeca":[46,64,159,156],"tronco":[82,156,118,213]},{"cabeca":[44,64,156,156],"tronco":[82,156,118,213]},{"cabeca":[47,64,159,156],"tronco":[82,156,118,213]},{"cabeca":[45,64,158,156],"tronco":[82,156,118,213]},{"cabeca":[43,58,159,152],"tronco":[82,152,118,211]},{"cabeca":[43,57,161,152],"tronco":[82,152,118,211]},{"cabeca":[41,55,157,151],"tronco":[82,151,118,210]},{"cabeca":[43,58,160,152],"tronco":[82,152,118,211]}],"sk_rei":[{"cabeca":[46,55,153,151],"tronco":[82,151,118,210]},{"cabeca":[45,55,152,151],"tronco":[82,151,118,210]},{"cabeca":[48,56,156,151],"tronco":[82,151,118,211]},{"cabeca":[48,55,156,151],"tronco":[82,151,118,210]},{"cabeca":[54,67,160,158],"tronco":[82,158,118,214]},{"cabeca":[52,69,157,159],"tronco":[82,159,118,215]},{"cabeca":[55,69,160,159],"tronco":[82,159,118,215]},{"cabeca":[51,67,158,158],"tronco":[82,158,118,214]},{"cabeca":[47,56,155,151],"tronco":[82,151,118,211]},{"cabeca":[47,56,153,151],"tronco":[82,151,118,211]},{"cabeca":[47,55,154,151],"tronco":[82,151,118,210]},{"cabeca":[48,56,155,151],"tronco":[82,151,118,211]}],"sk_rockstar":[{"cabeca":[37,55,165,151],"tronco":[82,151,118,210]},{"cabeca":[36,55,164,151],"tronco":[82,151,118,210]},{"cabeca":[41,55,168,151],"tronco":[82,151,118,210]},{"cabeca":[39,55,166,151],"tronco":[82,151,118,210]},{"cabeca":[41,60,170,154],"tronco":[82,154,118,212]},{"cabeca":[41,60,171,154],"tronco":[82,154,118,212]},{"cabeca":[43,61,171,154],"tronco":[82,154,118,212]},{"cabeca":[42,59,170,153],"tronco":[82,153,118,212]},{"cabeca":[38,52,166,149],"tronco":[82,149,118,209]},{"cabeca":[40,51,167,148],"tronco":[82,148,118,209]},{"cabeca":[39,49,165,147],"tronco":[82,147,118,208]},{"cabeca":[39,53,165,150],"tronco":[82,150,118,210]}],"sk_galaxia":[{"cabeca":[44,55,156,151],"tronco":[82,151,118,210]},{"cabeca":[42,55,156,151],"tronco":[82,151,118,210]},{"cabeca":[45,56,157,151],"tronco":[82,151,118,211]},{"cabeca":[44,55,156,151],"tronco":[82,151,118,210]},{"cabeca":[58,64,161,156],"tronco":[82,156,118,213]},{"cabeca":[58,62,161,155],"tronco":[82,155,118,212]},{"cabeca":[59,62,162,155],"tronco":[82,155,118,212]},{"cabeca":[59,62,162,155],"tronco":[82,155,118,212]},{"cabeca":[44,53,156,150],"tronco":[82,150,118,210]},{"cabeca":[45,53,157,150],"tronco":[82,150,118,210]},{"cabeca":[44,53,156,150],"tronco":[82,150,118,210]},{"cabeca":[44,53,156,150],"tronco":[82,150,118,210]}],"sk_arcoiris":[{"cabeca":[36,55,163,151],"tronco":[82,151,118,210]},{"cabeca":[36,55,160,151],"tronco":[82,151,118,210]},{"cabeca":[41,55,166,151],"tronco":[82,151,118,210]},{"cabeca":[39,55,161,151],"tronco":[82,151,118,210]},{"cabeca":[53,63,170,155],"tronco":[82,155,118,213]},{"cabeca":[53,61,170,154],"tronco":[82,154,118,212]},{"cabeca":[54,61,170,154],"tronco":[82,154,118,212]},{"cabeca":[54,62,170,155],"tronco":[82,155,118,212]},{"cabeca":[42,55,159,151],"tronco":[81,151,117,210]},{"cabeca":[41,57,158,152],"tronco":[82,152,118,211]},{"cabeca":[41,55,158,151],"tronco":[82,151,118,210]},{"cabeca":[42,56,159,151],"tronco":[82,151,118,211]}]});
for (const f of Object.keys({"sk_diamante": 1, "sk_rei": 1, "sk_rockstar": 1, "sk_galaxia": 1, "sk_arcoiris": 1})) { CORPOS_MODO[f] = 'skin'; if (typeof FOLHAS !== 'undefined' && !FOLHAS[f]) FOLHAS[f] = folhaSobDemanda(f, '152'); } // v407 (Raio-X A2): baixa só quando aparecer
for (const id of SKIN_LUXO) if (META_BONECOS['sk_' + id]) SKINS[id].look = { folha: 'sk_' + id };
// efeitos novos: estrelas (roxas) e arco-íris (cada faísca de uma cor), com brilho no chão
const _atualizaSkinFxLx = atualizaSkinFx;
atualizaSkinFx = function (dt) {
  const n0 = G.skinFx.length; const r = _atualizaSkinFxLx.apply(this, arguments);
  for (let i = n0; i < G.skinFx.length; i++) { const f = G.skinFx[i]; if (f.tipo === 'arcoiris') f.cor = `hsl(${Math.round(Math.random() * 360)},95%,62%)`; else if (f.tipo === 'estrelas') f.cor = Math.random() < 0.5 ? '#ffffff' : '#c8a8ff'; }
  return r;
};
const _desenhaSkinChaoLx = desenhaSkinChao;
desenhaSkinChao = function (ctx, e) {
  const r = _desenhaSkinChaoLx.apply(this, arguments); const sk = skinAtual();
  if (sk && (sk.efeito === 'arcoiris' || sk.efeito === 'estrelas')) {
    const x = e.x * T, y = e.y * T, pul = 1 + Math.sin(G.agora / 300) * 0.08;
    const cor = sk.efeito === 'arcoiris' ? `hsla(${Math.round(G.agora / 12) % 360},95%,60%,0.5)` : 'rgba(170,140,255,0.5)';
    ctx.save(); const g = ctx.createRadialGradient(x, y, 2, x, y, T * 0.8 * pul); g.addColorStop(0, cor); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, T * 0.85 * pul, T * 0.42 * pul, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  return r;
};

// ---------- o Barão Diamante ----------
NPCS.barao = { nome: 'Barão Diamante, o colecionador', luxo: true, ola: 'Bonjour, craque! Eu só vendo o que há de MAIS RARO no mundo. Nada aqui é barato... mas quem tem, é lenda!', look: { tipo: 'humano', corpo: 'm', pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-smoking-ouro', baixo: 'baixo-jeans', corBaixo: '#1a1a1a', chapeu: 'chapeu-cartola', rosto: 'rosto-monoculo', alt: 1.74 } };
{ const base = MAPAS_DEF.miami; if (base) MAPAS_DEF.miami = function () { const m = base(); if (!m.npcs.some(n => n.id === 'barao')) poeNpcPerto(m, 'barao', 'johnny'); return m; }; }
const _abrirNPCLx = abrirNPC;
abrirNPC = function (npc) {
  const r = _abrirNPCLx.apply(this, arguments);
  if (npc && npc.d && npc.d.luxo) {
    const ops = document.querySelector('#modalConteudo .opcoes'); const tchau = ops && [...ops.children].pop();
    const b = el('button', { class: 'btn amarelo', type: 'button', onclick: () => modalLuxo() }, '💎 Ver a coleção de luxo');
    if (tchau) tchau.before(b); else if (ops) ops.append(b);
  }
  return r;
};
function modalLuxo(aba = 'mont') {
  const s = estMont();
  const card = (tipo, id, def, tem, prev) => {
    const falta = s.nivel < def.lvl, pobre = s.ouro < def.luxo;
    return el('div', { class: 'mt-card' + (tem ? ' usando' : falta || pobre ? ' bloq' : '') }, prev, el('b', {}, def.nome), el('small', {}, def.desc),
      el('b', { class: 'lx-preco' }, `💰 ${fmt(def.luxo)}`), el('small', {}, `nível ${def.lvl}`),
      tem ? el('small', { class: 'mt-como' }, '✔ Já é seu!')
        : el('button', { class: 'btn mini ' + (falta || pobre ? '' : 'amarelo'), type: 'button', disabled: falta || pobre ? 'disabled' : null, onclick: () => compraLuxo(tipo, id) }, falta ? `Precisa do nível ${def.lvl}` : pobre ? `Faltam ${fmt(def.luxo - s.ouro)}` : 'Comprar'));
  };
  const grade = el('div', { class: 'mt-grade' });
  if (aba === 'mont') for (const id of MONT_LUXO) grade.append(card('mont', id, MONTARIAS[id], s.montarias.includes(id), iconeMontaria(id)));
  else if (aba === 'skin') for (const id of SKIN_LUXO) grade.append(card('skin', id, SKINS[id], s.skins.includes(id), previewSkin(id)));
  else for (const id of ['mochila_craque', 'mochila_galactica']) { const b = BOLSAS[id]; grade.append(card('bolsa', id, { ...b, luxo: b.preco }, false, iconeClone(iconeItem(id)))); }
  const bt = (k, t) => el('button', { class: 'btn mini' + (aba === k ? ' amarelo' : ''), type: 'button', onclick: () => modalLuxo(k) }, t);
  abreModal(el('h2', {}, '💎 Coleção do Barão Diamante'), el('p', {}, 'Seus tostões: ', precoTag(s.ouro)),
    el('div', { class: 'mt-abas' }, bt('mont', '🛵 Montarias'), bt('skin', '✨ Skins'), bt('bolsa', '🎒 Bolsas')), grade,
    el('p', { class: 'vazio' }, 'Dica: venda o loot dos adversários nas lojas (💰 Vender todo o loot) e quebre Pedras Celestiais para juntar tostões.'));
}
async function compraLuxo(tipo, id) {
  const s = estMont();
  const def = tipo === 'mont' ? MONTARIAS[id] : tipo === 'skin' ? SKINS[id] : { ...BOLSAS[id], luxo: BOLSAS[id].preco };
  if (s.nivel < def.lvl || s.ouro < def.luxo) return;
  if (!(await perguntaJogo(`Comprar ${def.nome} por ${fmt(def.luxo)} tostões?`, { sim: 'Comprar' }))) return;
  if (tipo === 'bolsa') { if (!addItem(id, 1)) return; s.ouro -= def.luxo; log(`🎒 Você comprou a ${def.nome}! A mochila ficou maior.`, 'l-loot'); som('moeda'); salvar(); G.uiSujo = true; return modalLuxo('bolsa'); }
  s.ouro -= def.luxo;
  if (tipo === 'mont') ganhaMontaria(id); else ganhaSkin(id);
  log(`💎 ${def.nome} comprada por ${fmt(def.luxo)} tostões. Poucos jogadores têm isso!`, 'l-lendario');
  modalLuxo(tipo);
  if (typeof oferecerDivulgar === 'function') oferecerDivulgar({ feito: `Conquistei ${tipo === 'mont' ? 'a montaria' : 'a skin'} ${def.nome}!`, montaria: tipo === 'mont' ? id : null, skin: tipo === 'skin' ? id : null });
}

// ---------- asas e capa DESENHADAS (antes: manchas vetoriais lisas) ----------
// a/ac_asas (par, visto de trás), ac_asa_lado, ac_capa (de trás), ac_capa_lado. No espaço de 100 unidades do
// boneco: ombros em (50, 80), tronco com 29 de largura. De costas, a arte vai POR CIMA do corpo.
const ARTE_COSTAS = ['ac_asas', 'ac_asa_lado', 'ac_capa', 'ac_capa_lado'];
ARTE_COSTAS.forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
function desenhaCostasArte(x, k, v) {
  const lado = v === 'l'; const nome = k === 'anjo' ? (lado ? 'ac_asa_lado' : 'ac_asas') : k === 'capa' ? (lado ? 'ac_capa_lado' : 'ac_capa') : null;
  const im = nome && aSprite(nome); if (!im) return false;
  const ar = im.width / im.height;
  let w, x0, y0;
  if (k === 'anjo') { if (lado) { w = 36; x0 = 50 - 40; y0 = 58; } else { w = 88; x0 = 50 - 44; y0 = v === 'c' ? 66 : 62; } }
  else { if (lado) { w = 44; x0 = 50 - 40; y0 = 76; } else { w = v === 'c' ? 38 : 42; x0 = 50 - w / 2; y0 = 77; } }
  x.drawImage(im, x0, y0, w, w / ar); return true;
}
if (typeof costasTras === 'function') {
  const _costasTrasLx = costasTras;
  costasTras = function (x, sp, v) {
    const k = sp && sp.costas;
    // atrás do corpo (de costas, as folhas ainda ganham a arte POR CIMA em comAcessorios)
    if ((k === 'anjo' || k === 'capa') && desenhaCostasArte(x, k, v)) return;
    return _costasTrasLx.apply(this, arguments);
  };
}
if (typeof comAcessorios === 'function') {
  const _comAcessoriosLx = comAcessorios;
  comAcessorios = function (x, sp, v, meta, fase) {
    const r = _comAcessoriosLx.apply(this, arguments);
    const tr = meta && meta.tronco;
    if (fase === 'frente' && v === 'c' && tr && sp && (sp.costas === 'anjo' || sp.costas === 'capa')) {
      const kb = (tr[2] - tr[0]) / 29; x.save(); x.translate((tr[0] + tr[2]) / 2, tr[1]); x.scale(kb, kb); x.translate(-50, -80); desenhaCostasArte(x, sp.costas, 'c'); x.restore();
    }
    return r;
  };
}

// estilo
{ const st = document.createElement('style'); st.textContent = `.lx-preco { color: #b8860b; font-size: 15px; } .mt-card.bloq .lx-preco { color: #8a7a5a; }`; document.head.append(st); }
