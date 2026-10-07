/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   MONTARIAS E SKINS
   - Montarias ganhas em missões: do skate da infância ao carro de
     luxo de quem ficou rico. Deixam o jogador mais rápido; tecla P
     sobe/desce. Duelar (ou levar bolada) faz descer.
   - Skins exclusivas: missões de coleção que pedem MUITOS itens
     raros. Mudam o visual e têm efeito próprio (brilho, neve...).
   - Missões com vários itens + tostões (req.itens / req.ouro).
   Carregar DEPOIS de arenas.js.
   ============================================================ */

/* ---------- montarias ---------- */
// face: para onde a arte original olha ('e' esquerda, 'd' direita)
// assento: onde fica o quadril do jogador (fração da arte); corte: quanto do boneco aparece
// janela: carro fechado, o jogador aparece pelo vidro [x0, y0, x1, y1]
const MONTARIAS = {
  skate: { nome: 'Skateboard', lvl: 5, bonus: 0.15, tipo: 'skate', desc: 'Every star\'s first "car". +15% speed.' },
  bicicleta: { nome: 'Bike with a Basket', lvl: 12, bonus: 0.25, spr: 'bicicleta', face: 'd', w: 1.6, assento: [0.31, 0.27], corte: 0.64, vista: 'lado', frente: false, desc: 'Pedaling along the boardwalk. +25% speed.' },
  lambreta: { nome: 'Blue Scooter', lvl: 30, bonus: 0.35, spr: 'vespa', face: 'e', w: 1.8, assento: [0.66, 0.47], corte: 0.64, vista: 'lado', frente: false, desc: 'Classic and stylish. +35% speed.' },
  carro: { nome: 'Compact Car', lvl: 50, bonus: 0.45, spr: 'carro2', face: 'e', w: 2.5, janela: [0.3, 0.2, 0.56, 0.44], escala: 0.62, vista: 'frente', desc: 'Your first car! +45% speed.' },
  conversivel: { nome: 'Classic Convertible', lvl: 86, bonus: 0.55, spr: 'carro_retro', face: 'e', w: 2.8, assento: [0.56, 0.4], corte: 0.5, vista: 'frente', frente: false, desc: 'Wind in your hair in Miami. +55% speed.' },
  luxo: { nome: 'Golden Luxury Car', lvl: 110, bonus: 0.7, spr: 'carro_luxo', face: 'e', w: 2.9, janela: [0.3, 0.18, 0.54, 0.4], escala: 0.62, vista: 'frente', dourado: true, desc: 'For those who got RICH. +70% speed.' },
};
const ORDEM_MONT = Object.keys(MONTARIAS);

/* ---------- skins ---------- */
const SKINS = {
  camuflado: { nome: 'Camo Star', lvl: 20, efeito: 'folhas', cor: '#6a8a3a', look: { roupa: 'roupa-futebol', corRoupa: '#5a6a3a', baixo: 'baixo-camuflada', chapeu: 'chapeu-bone' }, desc: 'An old-school sandlot uniform, with little leaves flying around.' },
  ouro: { nome: 'Golden Star', lvl: 45, efeito: 'brilho', cor: '#ffcf3a', look: { roupa: 'roupa-camisa10-ouro', corBaixo: '#1a1a1a', corCabelo: '#ffcf3a' }, desc: 'A golden number 10 jersey with a star\'s shine.' },
  farao: { nome: 'Dribble Pharaoh', lvl: 60, efeito: 'areia', cor: '#e8c060', look: { roupa: 'roupa-futebol', corRoupa: '#f4f0e0', corBaixo: '#e8b830', chapeu: 'chapeu-coroa', pescoco: 'pescoco-medalha', costas: 'costas-capa' }, desc: 'Desert royalty, with golden sand swirling around.' },
  neon: { nome: 'Neon Samurai', lvl: 75, efeito: 'neon', cor: '#ff3ad0', look: { roupa: 'roupa-couro', corRoupa: '#ff3ad0', corBaixo: '#1a1a2a', corCabelo: '#3ae0ff', rosto: 'rosto-escuros', costas: 'costas-capa' }, desc: 'Pink and blue lights of Tokyo at night.' },
  gelo: { nome: 'Ice Star', lvl: 140, efeito: 'neve', cor: '#bfefff', look: { roupa: 'roupa-moletom', corRoupa: '#bfe8ff', corBaixo: '#e8f4ff', corCabelo: '#f4f8ff', pescoco: 'pescoco-cachecol' }, desc: 'Snowflakes falling all around you.' },
  lenda: { nome: 'Eternal Legend', lvl: 155, efeito: 'aura', cor: '#ffe070', look: { roupa: 'roupa-cavaleiro-ouro', chapeu: 'chapeu-louros', costas: 'costas-anjo', corCabelo: '#ffcf3a' }, desc: 'Golden armor, wings and the aura of an eternal champion.' },
};

/* ---------- NPCs ---------- */
Object.assign(NPCS, {
  pedal: { nome: 'Seu Pedal, from the bike shop', ola: 'Hey there, star! I fix bikes, skateboards, scooters... Want to get around faster? Help me out and I\'ll help you!', look: { tipo: 'humano', corpo: 'm', pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-xadrez', corRoupa: '#3a6ad9', baixo: 'baixo-jeans', chapeu: 'chapeu-bone', alt: 1.7 } },
  rita: { nome: 'Dona Rita from the Garage', ola: 'Scooters, cars, engines... here we make everything roar! Bring me the parts and I\'ll build it for you.', look: { tipo: 'humano', corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-rabo', corCabelo: 'preto', roupa: 'roupa-moletom', corRoupa: '#d86a2a', baixo: 'baixo-jeans', alt: 1.7 } },
  johnny: { nome: 'Mr. Johnny, luxury cars', ola: 'Welcome! Only fancy cars here. But fancy cars are for people with LOTS of coins, okay?', look: { tipo: 'humano', corpo: 'm', pele: 'pele-clara', cabelo: 'cabelo-topete', corCabelo: 'loiro', roupa: 'roupa-terno', corRoupa: '#f4f4f8', baixo: 'baixo-jeans', rosto: 'rosto-escuros', alt: 1.76 } },
  vera: { nome: 'Dona Vera, the fashion designer', ola: 'Darling, style is everything! I sew ONE-OF-A-KIND uniforms... but only with rare materials. And lots of them!', look: { tipo: 'humano', corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'roxo', roupa: 'roupa-terno', corRoupa: '#a066ff', baixo: 'baixo-saia', pescoco: 'pescoco-gravata', alt: 1.72 } },
});
// [npc, mapa, perto de qual NPC (opcional)]
const NPCS_MONT_ONDE = [['pedal', 'vila', 'remendo'], ['rita', 'cidade'], ['vera', 'cidade'], ['johnny', 'miami', 'loja_miami']];
function poeNpcPerto(m, id, perto) {
  if (m.npcs.some(n => n.id === id)) return; // v272: já tem lugar desenhado no mapa
  const livre = (x, y) => x > 1 && y > 1 && x < m.w - 2 && y < m.h - 2 && !m.obj[y * m.w + x] && CH_ANDA(m.chao[y * m.w + x]) && m.chao[y * m.w + x] !== CH.AGUA
    && !m.saidas.some(s => Math.abs(s.x - x) < 2 && Math.abs(s.y - y) < 2) && !m.npcs.some(n => Math.abs(n.x - x) < 3 && Math.abs(n.y - y) < 3)
    && !m.campos.some(c => x >= c.x - 1 && x <= c.x + c.w && y >= c.y - 1 && y <= c.y + c.h);
  const ref = perto && m.npcs.find(n => n.id === perto);
  const c = ref || m.inicio || { x: m.w >> 1, y: m.h >> 1 };
  for (let r = 3; r < 18; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = c.x + dx, y = c.y + dy;
    if (livre(x, y) && livre(x, y + 1)) { m.npcs.push({ id, x, y }); return; }
  }
}
for (const [id, mapa, perto] of NPCS_MONT_ONDE) {
  const base = MAPAS_DEF[mapa]; if (!base) continue;
  MAPAS_DEF[mapa] = function () { const m = base(); poeNpcPerto(m, id, perto); return m; };
}

/* ---------- missões ---------- */
// v407 (Raio-X R8): caixa alta só para nome de chefão (palavras de ênfase e nomes de cidade voltaram ao normal)
const MISSOES_MONT = [
  { id: 'mt_skate', npc: 'pedal', titulo: 'My first skateboard', lvl: 5, texto: 'I\'ve got an old skateboard sitting here in the shop! Bring me a few things so I can fix it up, plus some coins for the new part.', req: { itens: [['bola_murcha', 5], ['pena', 15]], ouro: 100 }, rec: { xp: 300, montaria: 'skate' }, fim: 'All set! Press P to hop on and off the skateboard. If you go to dribble someone, you\'ll hop off by yourself.' },
  { id: 'mt_bike', npc: 'pedal', titulo: 'Bike with a basket', lvl: 12, pre: 'mt_skate', texto: 'I built a beautiful bike with a basket! To finish it, I need some things from the beach.', req: { itens: [['concha', 12], ['bola_praia', 15]], ouro: 600 }, rec: { xp: 2500, montaria: 'bicicleta' }, fim: 'It\'s yours! With it you\'ll fly along the boardwalk.' },
  { id: 'mt_lambreta', npc: 'rita', titulo: 'The blue scooter', lvl: 30, texto: 'I\'m restoring a classic scooter. Bring me parts and the money for the paint job!', req: { itens: [['roda_skate', 12], ['cone', 10], ['couro', 8]], ouro: 6000 }, rec: { xp: 40000, montaria: 'lambreta' }, fim: 'Look how pretty! Go ahead and start it up.' },
  { id: 'mt_carro', npc: 'rita', titulo: 'My first car', lvl: 50, pre: 'mt_lambreta', texto: 'You\'re a grown-up now! I have a lightly used little car. Bring what I need plus the payment.', req: { itens: [['cronometro', 12], ['prancheta', 12], ['cartao', 10]], ouro: 40000 }, rec: { xp: 150000, montaria: 'carro' }, fim: 'Keys in hand! Drive carefully, okay?' },
  { id: 'mt_conversivel', npc: 'johnny', titulo: 'Classic convertible', lvl: 86, texto: 'This convertible is a collector\'s item! To drive it out of here, you\'ll need lots of style and lots of coins.', req: { itens: [['oculos_neon', 25], ['fio_ouro', 12]], ouro: 150000 }, rec: { xp: 1200000, montaria: 'conversivel' }, fim: 'Awesome! All of Miami will be looking at you.' },
  { id: 'mt_luxo', npc: 'johnny', titulo: 'Golden luxury car', lvl: 110, pre: 'mt_conversivel', texto: 'My most expensive car: all gold! I only sell it to people who got truly rich.', req: { itens: [['ingresso', 20], ['megafone', 15], ['fio_ouro', 30]], ouro: 500000 }, rec: { xp: 3000000, montaria: 'luxo' }, fim: 'Congrats, soccer tycoon! The luxury car is yours.' },
  { id: 'sk_camuflado', npc: 'vera', titulo: 'Collection: Camo Star', lvl: 20, texto: 'I’m going to sew an exclusive camo uniform! But I need lots of material.', req: { itens: [['oculos_sol', 20], ['roda_skate', 30], ['concha', 40]] }, rec: { xp: 20000, skin: 'camuflado' }, fim: 'It looks amazing! Put it on with the ✨ Look button.' },
  { id: 'sk_ouro', npc: 'vera', titulo: 'Collection: Golden Star', lvl: 45, pre: 'sk_camuflado', texto: 'A golden star uniform! Only with super rare items.', req: { itens: [['cartao_vermelho', 12], ['luva', 20], ['fio_ouro', 8]] }, rec: { xp: 200000, skin: 'ouro' }, fim: 'It shines brighter than the sun! Put it on with the ✨ Look button.' },
  { id: 'sk_farao', npc: 'vera', titulo: 'Collection: Dribble Pharaoh', lvl: 60, pre: 'sk_ouro', texto: 'Inspired by Egypt! I need lots of treasures from Cairo.', req: { itens: [['escaravelho', 50], ['lamparina', 25], ['fio_ouro', 20]] }, rec: { xp: 500000, skin: 'farao' }, fim: 'Your Majesty! Put it on with the ✨ Look button.' },
  { id: 'sk_neon', npc: 'vera', titulo: 'Collection: Neon Samurai', lvl: 75, pre: 'sk_farao', texto: 'Tokyo lights and trophies from the Neon Arena. I want rare stuff!', req: { itens: [['leque', 40], ['oculos_neon', 30], ['trofeu_neon', 3]] }, rec: { xp: 900000, skin: 'neon' }, fim: 'So shiny! Put it on with the ✨ Look button.' },
  { id: 'sk_gelo', npc: 'vera', titulo: 'Collection: Ice Star', lvl: 140, pre: 'sk_neon', texto: 'An icy uniform from another world. I need items from Europe and trophies from the Blizzard.', req: { itens: [['ingresso', 40], ['megafone', 30], ['fio_ouro', 50], ['trofeu_nevasca', 3]] }, rec: { xp: 4000000, skin: 'gelo' }, fim: 'It\'s chilling to the bone! Put it on with the ✨ Look button.' },
  { id: 'sk_lenda', npc: 'vera', titulo: 'Collection: Eternal Legend', lvl: 170 /* v407 (Raio-X R3): era 155, mas o troféu das Lendas vem de um chefão de nível 194 */, pre: 'sk_gelo', texto: 'My masterpiece! Only for those who have beaten every arena, many times over.', req: { itens: [['trofeu_terrao', 2], ['trofeu_ondas', 2], ['trofeu_piramides', 2], ['trofeu_neon', 2], ['trofeu_nevasca', 2], ['trofeu_lendas', 2], ['fio_ouro', 100]] }, rec: { xp: 8000000, skin: 'lenda' }, fim: 'You\'re ETERNAL! Put it on with the ✨ Look button.' },
];
MISSOES.push(...MISSOES_MONT);

// requisitos com vários itens e tostões
const _progressoMissaoMt = progressoMissao;
progressoMissao = function (q) {
  const r = q.req; if (!r.itens && !r.ouro) return _progressoMissaoMt(q);
  let ok = 0, tot = 0;
  for (const [id, n] of (r.itens || [])) { tot++; if (contaItem(id) >= n) ok++; }
  if (r.ouro) { tot++; if (G.save.ouro >= r.ouro) ok++; }
  return [ok, tot];
};
const _descMissaoMt = descMissao;
descMissao = function (q) {
  const r = q.req; if (!r.itens && !r.ouro) return _descMissaoMt(q);
  const p = (r.itens || []).map(([id, n]) => `${fmt(Math.min(contaItem(id), n))}/${fmt(n)} ${ITENS[id] ? ITENS[id].nome : id}`);
  if (r.ouro) p.push(`${fmt(Math.min(G.save.ouro, r.ouro))}/${fmt(r.ouro)} tostões`);
  return 'Bring: ' + p.join(' · ');
};
const _entregaMissaoMt = entregaMissao;
entregaMissao = function (q) {
  const r = q.req;
  if (r.itens || r.ouro) {
    if (!missaoPronta(q)) { log('You still need more things for this mission.', 'l-sis'); return; }
    for (const [id, n] of (r.itens || [])) removeItem(id, n);
    if (r.ouro) { G.save.ouro -= r.ouro; log(`You paid ${fmt(r.ouro)} coins.`, 'l-sis'); }
  }
  _entregaMissaoMt(q);
  if (q.rec.montaria) ganhaMontaria(q.rec.montaria);
  if (q.rec.skin) ganhaSkin(q.rec.skin);
};
const _modalMissaoMt = modalMissao;
modalMissao = function (npc, q) {
  _modalMissaoMt(npc, q);
  const box = document.querySelector('#modalConteudo .fala'); if (!box) return;
  if (q.rec.montaria) { const mt = MONTARIAS[q.rec.montaria]; box.append(el('p', { class: 'mt-premio' }, `🛵 Reward: ${mt.nome} mount (+${Math.round(mt.bonus * 100)}% speed)`)); }
  if (q.rec.skin) { const sk = SKINS[q.rec.skin]; box.append(el('p', { class: 'mt-premio' }, `✨ Reward: exclusive skin "${sk.nome}"`), previewSkin(q.rec.skin, 90)); }
};

/* ---------- estado ---------- */
function estMont() { const s = G.save; if (!Array.isArray(s.montarias)) s.montarias = []; if (!Array.isArray(s.skins)) s.skins = []; return s; }
function montariaAtual() { const s = estMont(); return s.montaria && s.montarias.includes(s.montaria) && MONTARIAS[s.montaria] ? MONTARIAS[s.montaria] : null; }
function montadoAgora() { const s = G.save; return !!(s && s.montado && montariaAtual() && G.mapa && !G.mapa.interior && s.hp > 0); }
function ganhaMontaria(id) {
  const s = estMont(); if (!s.montarias.includes(id)) s.montarias.push(id);
  s.montaria = id; const mt = MONTARIAS[id];
  banner('NEW MOUNT!', mt.nome); log(`🛵 You got the ${mt.nome} mount! Press P to hop on and off. (${mt.desc})`, 'l-lendario'); som('nivel');
  salvar();
}
function ganhaSkin(id) {
  const s = estMont(); if (!s.skins.includes(id)) s.skins.push(id);
  const sk = SKINS[id]; banner('NEW SKIN!', sk.nome); log(`✨ Exclusive skin unlocked: ${sk.nome}! Put it on with the ✨ Look button.`, 'l-mitico'); som('raro');
  salvar();
}
function rivalPerto() { return G.mons.some(m => m.bravo && !m.d.treino && dist(m, G.p) < 6); }
function montar() {
  const s = estMont(); s.montarias = s.montarias.filter(id => MONTARIAS[id]); // save antigo com montaria que não existe mais
  if (!s.montarias.length) { log('You don\'t have a mount yet. Seu Pedal, in the Village, has a skateboard for you (level 5).', 'l-sis'); return; }
  if (!montariaAtual()) s.montaria = s.montarias[s.montarias.length - 1];
  if (s.montado) { desmontar(); return; }
  if (G.mapa.interior) { log('Not in here! Ride it outside.', 'l-sis'); return; }
  if (rivalPerto()) { log('A rival is challenging you! You can\'t get on your mount right now.', 'l-dano'); fala(G.p, 'I\'ll ride later!'); return; }
  s.montado = true; G.alvo = null; efeito('puff', G.p.x, G.p.y); som('equip'); texto(G.p, montariaAtual().nome + '!', '#ffe14a', 900, -0.3);
  G.uiSujo = true;
}
function desmontar(motivo) {
  const s = G.save; if (!s.montado) return;
  s.montado = false; efeito('puff', G.p.x, G.p.y); if (motivo) log(motivo, 'l-sis'); G.uiSujo = true;
}
function escolheMontaria(id) { const s = estMont(); if (!s.montarias.includes(id)) return; s.montaria = id; if (!s.montado && !G.mapa.interior && !rivalPerto()) montar(); salvar(); }

// velocidade
const _velJogadorMt = velJogador;
velJogador = function () { const v = _velJogadorMt(); return montadoAgora() ? v * (1 + montariaAtual().bonus) : v; };
// duelar, driblar ou levar bolada faz descer
const _usarDribleMt = usarDrible;
usarDrible = function (id) { if (montadoAgora()) desmontar('You hopped off your mount to dribble!'); return _usarDribleMt(id); };
const _recebeDanoMt = recebeDano;
recebeDano = function (dano, m) { if (montadoAgora()) desmontar('You got hit by the ball and fell off your mount!'); return _recebeDanoMt(dano, m); };
const _atualizaMt = atualiza;
atualiza = function (dt) {
  if (montadoAgora() && G.alvo && G.mons.includes(G.alvo) && dist(G.p, G.alvo) < 2.2) desmontar('You hopped off your mount to play!');
  _atualizaMt(dt);
  if (montadoAgora() && G.p.mov && Math.random() < dt / 260) efeito('puff', G.p.x - (G.p.flip ? -1 : 1) * 0.5, G.p.y + 0.1, '#e8d8b0');
  atualizaSkinFx(dt);
};

/* ---------- desenho da montaria ---------- */
const IMG_MONT = new Map();
function imgMontaria(mt) {
  if (IMG_MONT.has(mt.spr)) return IMG_MONT.get(mt.spr);
  const im = aSprite(mt.spr); if (!im) return null;
  if (!mt.dourado) { IMG_MONT.set(mt.spr, im); return im; }
  const c = mkCanvas(im.width, im.height); const x = c.getContext('2d');
  x.filter = 'sepia(0.85) saturate(3.2) hue-rotate(-8deg) brightness(1.08) contrast(1.05)'; x.drawImage(im, 0, 0); x.filter = 'none';
  // brilho metálico
  x.globalCompositeOperation = 'source-atop'; const g = x.createLinearGradient(0, 0, im.width, im.height);
  g.addColorStop(0.2, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,250,220,0.35)'); g.addColorStop(0.55, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, im.width, im.height);
  IMG_MONT.set(mt.spr, c); return c;
}
function desenhaSkate(ctx, cor) {
  const L = T * 0.95, H = T * 0.1;
  ctx.fillStyle = 'rgba(30,20,40,0.25)'; ctx.beginPath(); ctx.ellipse(0, 4, L * 0.55, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#f0c030'; for (const wx of [-L * 0.32, L * 0.32]) { ctx.beginPath(); ctx.arc(wx, -2, T * 0.07, 0, 7); ctx.fill(); ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = cor; ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(-L / 2, -H - T * 0.08, L, H, H / 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-L * 0.35, -H - T * 0.07, L * 0.7, 2);
}
function desenhaMontado(ctx, e) {
  const mt = montariaAtual(); const look = lookJogador(); const alt = alturaEnt({ ...e, _semMont: true }) * T;
  const x = e.x * T, y = e.y * T; const dir = e.flip ? -1 : 1;
  const bump = e.mov ? Math.abs(Math.sin(G.agora / 60)) * 1.6 : 0;
  if (mt.tipo === 'skate') {
    const comp = spriteBoneco(look, 'lado', 0); if (!comp) return false;
    const ph = alt, pw = ph * comp.c.width / comp.c.height;
    ctx.save(); ctx.translate(x, y - bump); ctx.rotate(e.mov ? dir * 0.05 : 0);
    desenhaSkate(ctx, '#e84a4a');
    ctx.scale(dir, 1); ctx.drawImage(comp.c, -pw / 2, -ph - T * 0.16, pw, ph); ctx.restore();
    e._altMont = (ph + T * 0.16) / T; return true;
  }
  const im = imgMontaria(mt); if (!im) return false;
  const comp = spriteBoneco(look, mt.vista, 0); if (!comp) return false;
  const w = mt.w * T, h = w * im.height / im.width; const ph = alt, pw = ph * comp.c.width / comp.c.height;
  const espelha = (dir === 1) !== (mt.face === 'd');
  const vx = -w / 2, vy = T * 0.22 - h;
  ctx.save(); ctx.translate(x, y - bump);
  ctx.fillStyle = 'rgba(30,20,40,0.28)'; ctx.beginPath(); ctx.ellipse(0, T * 0.12, w * 0.46, T * 0.22, 0, 0, 7); ctx.fill();
  const veiculo = () => { ctx.save(); if (espelha) ctx.scale(-1, 1); ctx.drawImage(im, vx, vy, w, h); ctx.restore(); };
  const px = f => (espelha ? -1 : 1) * (vx + f * w);
  if (mt.janela) {
    veiculo();
    const [a0, b0, a1, b1] = mt.janela; let rx0 = px(a0), rx1 = px(a1); if (rx0 > rx1) [rx0, rx1] = [rx1, rx0];
    const ry0 = vy + b0 * h, ry1 = vy + b1 * h; const rw = rx1 - rx0, rh = ry1 - ry0;
    ctx.save(); ctx.beginPath(); ctx.rect(rx0, ry0, rw, rh); ctx.clip();
    const s = mt.escala, phs = ph * s, pws = pw * s;
    ctx.save(); ctx.translate((rx0 + rx1) / 2, ry0 + rh * 0.12); if (e.flip) ctx.scale(-1, 1); ctx.drawImage(comp.c, -pws / 2, 0, pws, phs); ctx.restore();
    const g = ctx.createLinearGradient(rx0, ry0, rx1, ry1); g.addColorStop(0, 'rgba(200,230,255,0.35)'); g.addColorStop(0.5, 'rgba(160,210,255,0.12)'); g.addColorStop(1, 'rgba(200,230,255,0.3)');
    ctx.fillStyle = g; ctx.fillRect(rx0, ry0, rw, rh); ctx.restore();
    e._altMont = -vy / T;
  } else {
    const sx = px(mt.assento[0]), sy = vy + mt.assento[1] * h; const k = mt.corte;
    const jogador = () => { ctx.save(); ctx.translate(sx, sy); if (e.flip) ctx.scale(-1, 1); ctx.drawImage(comp.c, 0, 0, comp.c.width, comp.c.height * k, -pw / 2, -ph * k, pw, ph * k); ctx.restore(); };
    if (mt.vista === 'lado' && typeof pernaDe === 'function') {
      // sentado de lado: corpo até o quadril + as duas pernas saindo do quadril
      // (bicicleta: pedalam quando anda; lambreta: pés apoiados no piso)
      const c = comp.c, p = pernaDe(c), s = pw / c.width;
      const oy = sy - ph * k + p.py * s; // o quadril fica na mesma altura de antes (topo da cabeça no mesmo lugar)
      const t = G.agora / 130, pedala = mt.spr === 'bicicleta';
      const base = pedala ? -0.75 : -0.9;
      const aPerto = base + (pedala && e.mov ? Math.sin(t) * 0.45 : 0), aLonge = base + (pedala ? (e.mov ? Math.sin(t + Math.PI) * 0.45 : 0.25) : 0.15);
      const perna = (ang, escura) => {
        ctx.save(); ctx.rotate(ang); if (escura) ctx.filter = 'brightness(0.72)';
        const h0 = p.fim - p.quadril + 2; ctx.drawImage(c, 0, p.quadril, c.width, h0, -p.px * s, (p.quadril - p.py) * s, c.width * s, h0 * s);
        ctx.restore();
      };
      veiculo();
      ctx.save(); ctx.translate(sx, oy); if (e.flip) ctx.scale(-1, 1);
      perna(aLonge, true);                                                         // perna de trás (mais escura)
      const corteY = p.quadril + 3; ctx.drawImage(c, 0, 0, c.width, corteY, -p.px * s, -p.py * s, c.width * s, corteY * s); // corpo
      perna(aPerto, false);                                                        // perna da frente
      ctx.restore();
      if (mt.frente) veiculo();
    } else if (mt.frente) { jogador(); veiculo(); } else { veiculo(); jogador(); }
    e._altMont = Math.max(-vy, -(sy - ph * k)) / T;
  }
  ctx.restore();
  return true;
}
const _alturaEntMt = alturaEnt;
alturaEnt = function (e) { if (e === G.p && !e._semMont && montadoAgora() && e._altMont) return e._altMont; return _alturaEntMt(e._semMont ? G.p : e); };

/* ---------- efeitos das skins ---------- */
G.skinFx = [];
function skinAtual() { const s = G.save; return s && s.skin && (s.skins || []).includes(s.skin) ? SKINS[s.skin] : null; }
function atualizaSkinFx(dt) {
  const sk = skinAtual(); const p = G.p;
  G.skinFx = G.skinFx.filter(f => G.agora - f.t0 < f.dur);
  if (!sk || G.mapa.interior && sk.efeito === 'neve') return;
  const taxa = { folhas: 220, brilho: 160, areia: 110, neon: 140, neve: 120, aura: 120 }[sk.efeito] || 200;
  if (Math.random() < dt / taxa) {
    const a = Math.random() * Math.PI * 2, r = rnd(0.2, 0.6);
    const f = { t0: G.agora, dur: rnd(900, 1500), x: p.x + Math.cos(a) * r, y: p.y - rnd(0.1, 1.3), vx: rnd(-0.3, 0.3), vy: -rnd(0.1, 0.5), rot: Math.random() * 6, tipo: sk.efeito, cor: sk.cor };
    if (sk.efeito === 'neve') { f.y = p.y - rnd(1.4, 2.2); f.vy = rnd(0.4, 0.8); f.x = p.x + rnd(-0.9, 0.9); }
    if (sk.efeito === 'areia') { f.ang = a; f.r = rnd(0.5, 0.8); f.y = p.y - 0.2; }
    G.skinFx.push(f);
  }
}
function desenhaSkinChao(ctx, e) {
  const sk = skinAtual(); if (!sk) return;
  const x = e.x * T, y = e.y * T;
  if (sk.efeito === 'aura' || sk.efeito === 'neon' || sk.efeito === 'brilho') {
    const pul = 1 + Math.sin(G.agora / 300) * 0.08; ctx.save();
    const g = ctx.createRadialGradient(x, y, 2, x, y, T * 0.75 * pul);
    const c = bRgb(sk.efeito === 'neon' ? (Math.sin(G.agora / 400) > 0 ? '#ff3ad0' : '#3ae0ff') : sk.cor);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.55)`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, T * 0.8 * pul, T * 0.4 * pul, 0, 0, 7); ctx.fill();
    if (sk.efeito === 'aura') { ctx.globalAlpha = 0.25; ctx.strokeStyle = sk.cor; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = G.agora / 900 + i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x, y - T * 0.6); ctx.lineTo(x + Math.cos(a) * T * 1.1, y - T * 0.6 + Math.sin(a) * T * 1.1); ctx.stroke(); } }
    ctx.restore();
  }
}
function desenhaSkinFx(ctx) {
  for (const f of G.skinFx) {
    const k = (G.agora - f.t0) / f.dur; if (k < 0 || k > 1) continue;
    let x = f.x + f.vx * k, y = f.y + f.vy * k;
    if (f.tipo === 'areia') { const a = f.ang + k * 4; x = G.p.x + Math.cos(a) * f.r; y = G.p.y - 0.2 - k * 1.1 + Math.sin(a) * f.r * 0.4; }
    ctx.save(); ctx.globalAlpha = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8; ctx.translate(x * T, y * T); ctx.rotate(f.rot + k * 3);
    if (f.tipo === 'folhas') { ctx.fillStyle = '#6aa83a'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.5, 0, 0, 7); ctx.fill(); }
    else if (f.tipo === 'neve') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, 7); ctx.fill(); }
    else if (f.tipo === 'areia') { ctx.fillStyle = '#f0d890'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, 7); ctx.fill(); }
    else { const c = f.tipo === 'neon' ? (f.rot > 3 ? '#ff5ad8' : '#5ae0ff') : f.cor; ctx.fillStyle = c; const r = f.tipo === 'aura' ? 5 : 4; ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.quadraticCurveTo(0, 0, 0, r); ctx.quadraticCurveTo(0, 0, -r, 0); ctx.quadraticCurveTo(0, 0, 0, -r); ctx.fill(); }
    ctx.restore();
  }
}
const _desenhaEntMt = desenhaEnt;
desenhaEnt = function (ctx, e) {
  if (e !== G.p) return _desenhaEntMt(ctx, e);
  desenhaSkinChao(ctx, e);
  if (!(montadoAgora() && !G.jogada && desenhaMontado(ctx, e))) _desenhaEntMt(ctx, e);
  desenhaSkinFx(ctx);
};

/* ---------- visual do jogador com skin ---------- */
const _lookJogadorMt = lookJogador;
lookJogador = function (retrato) {
  const L = _lookJogadorMt(retrato); const sk = skinAtual();
  if (!sk) return L;
  return Object.assign(L, sk.look);
};
function lookComSkin(id) { const L = _lookJogadorMt(true); return id ? Object.assign(L, SKINS[id].look) : L; }
function previewSkin(id, alt = 120) { const c = mkCanvas(Math.round(alt * 0.75), alt); c.className = 'mt-prev'; pintaAparencia(c, lookComSkin(id), { inteiro: true, fundo: '#2a1a4a' }); return c; }
function vesteSkin(id) {
  const s = estMont(); s.skin = id && s.skins.includes(id) ? id : null;
  if (typeof atualizaRetrato === 'function') atualizaRetrato(); G.uiSujo = true; salvar();
  log(id ? `✨ You put on the ${SKINS[id].nome} skin!` : 'You\'re back to your normal look.', id ? 'l-mitico' : 'l-sis');
  if (id) { efeito('nivel', G.p.x, G.p.y); som('equip'); }
}

/* ---------- janela "Visual": montarias e skins ---------- */
function iconeMontaria(id) {
  const mt = MONTARIAS[id]; const c = mkCanvas(96, 72); const x = c.getContext('2d');
  if (mt.tipo === 'skate') { x.translate(48, 50); x.scale(0.8, 0.8); const TT = T; desenhaSkate(x, '#e84a4a'); return c; }
  const im = imgMontaria(mt); if (!im) return c;
  const s = Math.min(90 / im.width, 68 / im.height); x.drawImage(im, (96 - im.width * s) / 2, (72 - im.height * s) / 2, im.width * s, im.height * s); return c;
}
function ondeMissao(qid) { const q = MISSOES.find(q => q.id === qid); if (!q) return ''; const onde = NPCS_MONT_ONDE.find(([id]) => id === q.npc); return `${NPCS[q.npc].nome} (${({ vila: 'Village', cidade: 'City', miami: 'Miami' })[onde && onde[1]] || ''}) · level ${q.lvl}`; }
function modalVisual(aba) {
  const s = estMont(); aba = aba || 'mont';
  const abas = el('div', { class: 'mt-abas' },
    el('button', { class: 'btn mini' + (aba === 'mont' ? ' amarelo' : ''), onclick: () => modalVisual('mont') }, '🛵 Mounts'),
    el('button', { class: 'btn mini' + (aba === 'skin' ? ' amarelo' : ''), onclick: () => modalVisual('skin') }, '✨ Skins'));
  const grade = el('div', { class: 'mt-grade' });
  if (aba === 'mont') {
    for (const id of ORDEM_MONT) {
      const mt = MONTARIAS[id]; const tem = s.montarias.includes(id); const usando = tem && s.montaria === id;
      const q = MISSOES_MONT.find(q => q.rec.montaria === id);
      grade.append(el('div', { class: 'mt-card' + (tem ? '' : ' bloq') + (usando ? ' usando' : '') }, iconeMontaria(id),
        el('b', {}, mt.nome), el('small', {}, `+${Math.round(mt.bonus * 100)}% speed`),
        tem ? el('button', { class: 'btn mini ' + (usando && s.montado ? '' : 'amarelo'), onclick: () => { if (usando && s.montado) desmontar(); else escolheMontaria(id); modalVisual('mont'); } }, usando && s.montado ? 'Get off' : usando ? 'Ride (P)' : 'Use this one')
          : el('small', { class: 'mt-como' }, (mt.luxo ? `💎 Baron Diamond (Miami): ${fmt(mt.luxo)} coins · level ${mt.lvl}` : q ? `🔒 Mission with ${ondeMissao(q.id)}` : '🔒'))));
    }
  } else {
    grade.append(el('div', { class: 'mt-card' + (!s.skin ? ' usando' : '') }, previewSkin(null), el('b', {}, 'Normal look'), el('small', {}, 'Your clothes and equipment'), el('button', { class: 'btn mini' + (s.skin ? ' amarelo' : ''), onclick: () => { vesteSkin(null); modalVisual('skin'); } }, s.skin ? 'Use' : 'In use')));
    for (const id in SKINS) {
      const sk = SKINS[id]; const tem = s.skins.includes(id); const usando = s.skin === id;
      const q = MISSOES_MONT.find(q => q.rec.skin === id);
      const req = !q ? '' : q.req.itens.map(([iid, n]) => `${fmt(Math.min(contaItem(iid), n))}/${fmt(n)} ${ITENS[iid] ? ITENS[iid].nome : iid}`).join(' · ');
      grade.append(el('div', { class: 'mt-card skin' + (tem ? '' : ' bloq') + (usando ? ' usando' : '') }, previewSkin(id), el('b', {}, sk.nome), el('small', {}, sk.desc),
        tem ? el('button', { class: 'btn mini' + (usando ? '' : ' amarelo'), onclick: () => { vesteSkin(usando ? null : id); modalVisual('skin'); } }, usando ? 'Take off' : 'Put on')
          : el('small', { class: 'mt-como' }, (sk.luxo ? `💎 Baron Diamond (Miami): ${fmt(sk.luxo)} coins · level ${sk.lvl}` : q ? `🔒 ${ondeMissao(q.id)}. Needs: ${req}` : '🔒'))));
    }
  }
  abreModal.largo = true;
  abreModal(el('h2', {}, '✨ Look'), el('p', {}, aba === 'mont' ? 'Mounts make you faster. Press P to hop on and off. When you dribble or get hit by the ball, you hop off by yourself.' : 'Exclusive skins change your look and have special effects. Only Dona Vera, in the City, makes them — and she asks for LOTS of rare items.'), abas, grade);
}
// botão no topo, tecla P e botão de toque
(function () {
  const nav = document.querySelector('.topo-nav');
  if (nav && !document.getElementById('btnVisual')) {
    const b = el('button', { class: 'btn mini verde', id: 'btnVisual', type: 'button', title: 'Mounts and skins (P to hop on/off)' }, '✨ Look');
    b.addEventListener('click', () => { if (G.save) modalVisual(); });
    const ref = document.getElementById('btnArenas') || nav.querySelector('[data-abre="album"]'); if (ref) ref.after(b); else nav.append(b);
  }
  const toq = document.querySelector('.toque-acoes');
  if (toq && !document.getElementById('tMontar')) { const t = el('button', { class: 'btn', id: 'tMontar', type: 'button' }, '🛵 Ride'); t.addEventListener('click', () => { if (G.rodando && !G.pausado) montar(); }); toq.prepend(t); }
  window.addEventListener('keydown', ev => {
    if (!G.rodando || G.pausado || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const tag = (ev.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (ev.key === 'p' || ev.key === 'P') { ev.preventDefault(); montar(); }
  });
})();
const _modalAtalhosMt = modalAtalhos;
modalAtalhos = function () {
  _modalAtalhosMt();
  const box = document.querySelector('#modalConteudo .atalhos');
  if (box) box.append(el('div', { class: 'atalho' }, el('span', { class: 'kbd' }, 'P'), el('span', {}, 'Hop on / off your mount')));
};
if (typeof iconeNPC === 'function') { const _iconeNPCMt = iconeNPC; iconeNPC = function (n) { return ({ pedal: '🛹', rita: '🛵', johnny: '🚗', vera: '✨' })[n.id] || _iconeNPCMt(n); }; }

/* ---------- estilo ---------- */
(function () {
  const st = document.createElement('style');
  st.textContent = `
  .mt-abas { display: flex; gap: 6px; margin: 4px 0 10px; }
  .mt-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .mt-card { background: #fffaf0; border: 3px solid var(--papel2, #ecd09a); border-radius: 10px; padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
  .mt-card canvas { width: 96px; height: 72px; }
  .mt-card.skin canvas.mt-prev { width: 90px; height: 120px; border-radius: 8px; }
  .mt-card b { color: var(--madeira2, #5e2f14); font-size: 15px; }
  .mt-card small { font-family: Nunito, sans-serif; font-weight: 700; font-size: 12px; color: #6a4a2a; line-height: 1.25; }
  .mt-card.bloq { opacity: .85; background: #efe3c8; }
  .mt-card.bloq canvas { filter: grayscale(.85) brightness(.9); }
  .mt-card.usando { border-color: #4fc26a; box-shadow: 0 0 0 2px #4fc26a55; }
  .mt-como { color: #8a4a2a !important; }
  .mt-premio { font-weight: 800; color: #7a2ad9; background: #f3e8ff; border-radius: 6px; padding: 4px 8px; }
  canvas.mt-prev { width: 90px; height: 120px; border-radius: 8px; display: block; margin: 4px auto; }
  #btnVisual { white-space: nowrap; }
  `;
  document.head.append(st);
})();
