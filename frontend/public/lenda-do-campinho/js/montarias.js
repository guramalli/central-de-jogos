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
  skate: { nome: 'Skate', lvl: 5, bonus: 0.15, tipo: 'skate', desc: 'O primeiro "carro" de todo craque. +15% de velocidade.' },
  bicicleta: { nome: 'Bicicleta com Cestinha', lvl: 12, bonus: 0.25, spr: 'bicicleta', face: 'd', w: 1.6, assento: [0.31, 0.27], corte: 0.64, vista: 'lado', frente: false, desc: 'Pedalando pela orla. +25% de velocidade.' },
  lambreta: { nome: 'Lambreta Azul', lvl: 30, bonus: 0.35, spr: 'vespa', face: 'e', w: 1.8, assento: [0.66, 0.47], corte: 0.64, vista: 'lado', frente: false, desc: 'Clássica e estilosa. +35% de velocidade.' },
  carro: { nome: 'Carrinho Popular', lvl: 50, bonus: 0.45, spr: 'carro2', face: 'e', w: 2.5, janela: [0.3, 0.2, 0.56, 0.44], escala: 0.62, vista: 'frente', desc: 'Seu primeiro carro! +45% de velocidade.' },
  conversivel: { nome: 'Conversível Clássico', lvl: 86, bonus: 0.55, spr: 'carro_retro', face: 'e', w: 2.8, assento: [0.56, 0.4], corte: 0.5, vista: 'frente', frente: false, desc: 'Cabelo ao vento em Miami. +55% de velocidade.' },
  luxo: { nome: 'Carro de Luxo Dourado', lvl: 110, bonus: 0.7, spr: 'carro_luxo', face: 'e', w: 2.9, janela: [0.3, 0.18, 0.54, 0.4], escala: 0.62, vista: 'frente', dourado: true, desc: 'Coisa de quem ficou RICO. +70% de velocidade.' },
};
const ORDEM_MONT = Object.keys(MONTARIAS);

/* ---------- skins ---------- */
const SKINS = {
  camuflado: { nome: 'Craque Camuflado', lvl: 20, efeito: 'folhas', cor: '#6a8a3a', look: { roupa: 'roupa-futebol', corRoupa: '#5a6a3a', baixo: 'baixo-camuflada', chapeu: 'chapeu-bone' }, desc: 'Uniforme da várzea raiz, com folhinhas voando.' },
  ouro: { nome: 'Craque de Ouro', lvl: 45, efeito: 'brilho', cor: '#ffcf3a', look: { roupa: 'roupa-camisa10-ouro', corBaixo: '#1a1a1a', corCabelo: '#ffcf3a' }, desc: 'Camisa 10 dourada e brilho de estrela.' },
  farao: { nome: 'Faraó do Drible', lvl: 60, efeito: 'areia', cor: '#e8c060', look: { roupa: 'roupa-futebol', corRoupa: '#f4f0e0', corBaixo: '#e8b830', chapeu: 'chapeu-coroa', pescoco: 'pescoco-medalha', costas: 'costas-capa' }, desc: 'Realeza do deserto, com areia dourada girando.' },
  neon: { nome: 'Samurai Neon', lvl: 75, efeito: 'neon', cor: '#ff3ad0', look: { roupa: 'roupa-couro', corRoupa: '#ff3ad0', corBaixo: '#1a1a2a', corCabelo: '#3ae0ff', rosto: 'rosto-escuros', costas: 'costas-capa' }, desc: 'Luz rosa e azul de Tóquio à noite.' },
  gelo: { nome: 'Astro do Gelo', lvl: 140, efeito: 'neve', cor: '#bfefff', look: { roupa: 'roupa-moletom', corRoupa: '#bfe8ff', corBaixo: '#e8f4ff', corCabelo: '#f4f8ff', pescoco: 'pescoco-cachecol' }, desc: 'Flocos de neve caindo em volta de você.' },
  lenda: { nome: 'Lenda Eterna', lvl: 155, efeito: 'aura', cor: '#ffe070', look: { roupa: 'roupa-cavaleiro-ouro', chapeu: 'chapeu-louros', costas: 'costas-anjo', corCabelo: '#ffcf3a' }, desc: 'Armadura dourada, asas e aura de campeão eterno.' },
};

/* ---------- NPCs ---------- */
Object.assign(NPCS, {
  pedal: { nome: 'Seu Pedal, da bicicletaria', ola: 'Opa, craque! Conserto bicicleta, skate, patinete... Quer andar mais rápido por aí? Me ajuda que eu te ajudo!', look: { tipo: 'humano', corpo: 'm', pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-xadrez', corRoupa: '#3a6ad9', baixo: 'baixo-jeans', chapeu: 'chapeu-bone', alt: 1.7 } },
  rita: { nome: 'Dona Rita da Oficina', ola: 'Lambreta, carro, motor... aqui a gente faz tudo roncar! Traga as peças que eu monto pra você.', look: { tipo: 'humano', corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-rabo', corCabelo: 'preto', roupa: 'roupa-moletom', corRoupa: '#d86a2a', baixo: 'baixo-jeans', alt: 1.7 } },
  johnny: { nome: 'Mr. Johnny, carros de luxo', ola: 'Welcome! Aqui só tem carrão. Mas carrão é pra quem tem MUITO tostão, hein?', look: { tipo: 'humano', corpo: 'm', pele: 'pele-clara', cabelo: 'cabelo-topete', corCabelo: 'loiro', roupa: 'roupa-terno', corRoupa: '#f4f4f8', baixo: 'baixo-jeans', rosto: 'rosto-escuros', alt: 1.76 } },
  vera: { nome: 'Dona Vera, a estilista', ola: 'Querido(a), estilo é tudo! Eu costuro uniformes ÚNICOS... mas só com materiais raros. E muitos!', look: { tipo: 'humano', corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'roxo', roupa: 'roupa-terno', corRoupa: '#a066ff', baixo: 'baixo-saia', pescoco: 'pescoco-gravata', alt: 1.72 } },
});
// [npc, mapa, perto de qual NPC (opcional)]
const NPCS_MONT_ONDE = [['pedal', 'vila', 'remendo'], ['rita', 'cidade'], ['vera', 'cidade'], ['johnny', 'miami', 'loja_miami']];
function poeNpcPerto(m, id, perto) {
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
const MISSOES_MONT = [
  { id: 'mt_skate', npc: 'pedal', titulo: 'Meu primeiro skate', lvl: 5, texto: 'Tenho um skate parado aqui na oficina! Me traga umas coisas pra eu reformar ele e mais uns tostões pela peça nova.', req: { itens: [['bola_murcha', 5], ['pena', 15]], ouro: 100 }, rec: { xp: 300, montaria: 'skate' }, fim: 'Prontinho! Aperte P para subir e descer do skate. Se for driblar alguém, você desce sozinho(a).' },
  { id: 'mt_bike', npc: 'pedal', titulo: 'Bicicleta com cestinha', lvl: 12, pre: 'mt_skate', texto: 'Montei uma bicicleta linda, com cestinha! Pra terminar, preciso de coisas da praia.', req: { itens: [['concha', 12], ['bola_praia', 15]], ouro: 600 }, rec: { xp: 2500, montaria: 'bicicleta' }, fim: 'É sua! Com ela você vai voar pela orla.' },
  { id: 'mt_lambreta', npc: 'rita', titulo: 'A lambreta azul', lvl: 30, texto: 'Estou restaurando uma lambreta clássica. Me traga peças e o dinheiro da pintura!', req: { itens: [['roda_skate', 12], ['cone', 10], ['couro', 8]], ouro: 6000 }, rec: { xp: 40000, montaria: 'lambreta' }, fim: 'Olha que beleza! Pode dar partida.' },
  { id: 'mt_carro', npc: 'rita', titulo: 'Meu primeiro carro', lvl: 50, pre: 'mt_lambreta', texto: 'Você já é adulto(a)! Tenho um carrinho seminovo. Traga o que eu preciso e mais o pagamento.', req: { itens: [['cronometro', 12], ['prancheta', 12], ['cartao', 10]], ouro: 40000 }, rec: { xp: 150000, montaria: 'carro' }, fim: 'Chave na mão! Dirija com cuidado, hein.' },
  { id: 'mt_conversivel', npc: 'johnny', titulo: 'Conversível clássico', lvl: 86, texto: 'Esse conversível é de colecionador! Pra sair com ele daqui, só com muito estilo e muito tostão.', req: { itens: [['oculos_neon', 25], ['fio_ouro', 12]], ouro: 150000 }, rec: { xp: 1200000, montaria: 'conversivel' }, fim: 'Sensacional! Miami inteira vai olhar pra você.' },
  { id: 'mt_luxo', npc: 'johnny', titulo: 'Carro de luxo dourado', lvl: 110, pre: 'mt_conversivel', texto: 'Meu carro mais caro: todo dourado! Só vendo para quem ficou RICO de verdade.', req: { itens: [['ingresso', 20], ['megafone', 15], ['fio_ouro', 30]], ouro: 500000 }, rec: { xp: 3000000, montaria: 'luxo' }, fim: 'Parabéns, magnata do futebol! O carro de luxo é seu.' },
  { id: 'sk_camuflado', npc: 'vera', titulo: 'Coleção: Craque Camuflado', lvl: 20, texto: 'Vou costurar um uniforme camuflado exclusivo! Mas preciso de MUITO material.', req: { itens: [['oculos_sol', 20], ['roda_skate', 30], ['concha', 40]] }, rec: { xp: 20000, skin: 'camuflado' }, fim: 'Ficou incrível! Vista no botão ✨ Visual.' },
  { id: 'sk_ouro', npc: 'vera', titulo: 'Coleção: Craque de Ouro', lvl: 45, pre: 'sk_camuflado', texto: 'Um uniforme dourado de estrela! Só com itens raríssimos.', req: { itens: [['cartao_vermelho', 12], ['luva', 20], ['fio_ouro', 8]] }, rec: { xp: 200000, skin: 'ouro' }, fim: 'Brilha mais que o sol! Vista no botão ✨ Visual.' },
  { id: 'sk_farao', npc: 'vera', titulo: 'Coleção: Faraó do Drible', lvl: 60, pre: 'sk_ouro', texto: 'Inspirada no Egito! Preciso de muitos tesouros do Cairo.', req: { itens: [['escaravelho', 50], ['lamparina', 25], ['fio_ouro', 20]] }, rec: { xp: 500000, skin: 'farao' }, fim: 'Majestade! Vista no botão ✨ Visual.' },
  { id: 'sk_neon', npc: 'vera', titulo: 'Coleção: Samurai Neon', lvl: 75, pre: 'sk_farao', texto: 'Luzes de Tóquio e troféus da Arena Neon. Quero coisa rara!', req: { itens: [['leque', 40], ['oculos_neon', 30], ['trofeu_neon', 3]] }, rec: { xp: 900000, skin: 'neon' }, fim: 'Que brilho! Vista no botão ✨ Visual.' },
  { id: 'sk_gelo', npc: 'vera', titulo: 'Coleção: Astro do Gelo', lvl: 140, pre: 'sk_neon', texto: 'Um uniforme gelado de outro mundo. Preciso de itens da Europa e troféus da Nevasca.', req: { itens: [['ingresso', 40], ['megafone', 30], ['fio_ouro', 50], ['trofeu_nevasca', 3]] }, rec: { xp: 4000000, skin: 'gelo' }, fim: 'Gelou até a espinha! Vista no botão ✨ Visual.' },
  { id: 'sk_lenda', npc: 'vera', titulo: 'Coleção: Lenda Eterna', lvl: 155, pre: 'sk_gelo', texto: 'Minha obra-prima! Só para quem venceu TODAS as arenas, várias vezes.', req: { itens: [['trofeu_terrao', 2], ['trofeu_ondas', 2], ['trofeu_piramides', 2], ['trofeu_neon', 2], ['trofeu_nevasca', 2], ['trofeu_lendas', 2], ['fio_ouro', 100]] }, rec: { xp: 8000000, skin: 'lenda' }, fim: 'Você é ETERNO(A)! Vista no botão ✨ Visual.' },
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
  return 'Traga: ' + p.join(' · ');
};
const _entregaMissaoMt = entregaMissao;
entregaMissao = function (q) {
  const r = q.req;
  if (r.itens || r.ouro) {
    if (!missaoPronta(q)) { log('Ainda falta coisa para essa missão.', 'l-sis'); return; }
    for (const [id, n] of (r.itens || [])) removeItem(id, n);
    if (r.ouro) { G.save.ouro -= r.ouro; log(`Você pagou ${fmt(r.ouro)} tostões.`, 'l-sis'); }
  }
  _entregaMissaoMt(q);
  if (q.rec.montaria) ganhaMontaria(q.rec.montaria);
  if (q.rec.skin) ganhaSkin(q.rec.skin);
};
const _modalMissaoMt = modalMissao;
modalMissao = function (npc, q) {
  _modalMissaoMt(npc, q);
  const box = document.querySelector('#modalConteudo .fala'); if (!box) return;
  if (q.rec.montaria) { const mt = MONTARIAS[q.rec.montaria]; box.append(el('p', { class: 'mt-premio' }, `🛵 Prêmio: montaria ${mt.nome} (+${Math.round(mt.bonus * 100)}% de velocidade)`)); }
  if (q.rec.skin) { const sk = SKINS[q.rec.skin]; box.append(el('p', { class: 'mt-premio' }, `✨ Prêmio: skin exclusiva "${sk.nome}"`), previewSkin(q.rec.skin, 90)); }
};

/* ---------- estado ---------- */
function estMont() { const s = G.save; if (!Array.isArray(s.montarias)) s.montarias = []; if (!Array.isArray(s.skins)) s.skins = []; return s; }
function montariaAtual() { const s = estMont(); return s.montaria && s.montarias.includes(s.montaria) ? MONTARIAS[s.montaria] : null; }
function montadoAgora() { const s = G.save; return !!(s && s.montado && montariaAtual() && G.mapa && !G.mapa.interior && s.hp > 0); }
function ganhaMontaria(id) {
  const s = estMont(); if (!s.montarias.includes(id)) s.montarias.push(id);
  s.montaria = id; const mt = MONTARIAS[id];
  banner('NOVA MONTARIA!', mt.nome); log(`🛵 Você ganhou a montaria ${mt.nome}! Aperte P para subir e descer. (${mt.desc})`, 'l-lendario'); som('nivel');
  salvar();
}
function ganhaSkin(id) {
  const s = estMont(); if (!s.skins.includes(id)) s.skins.push(id);
  const sk = SKINS[id]; banner('NOVA SKIN!', sk.nome); log(`✨ Skin exclusiva desbloqueada: ${sk.nome}! Vista no botão ✨ Visual.`, 'l-mitico'); som('raro');
  salvar();
}
function rivalPerto() { return G.mons.some(m => m.bravo && !m.d.treino && dist(m, G.p) < 6); }
function montar() {
  const s = estMont();
  if (!s.montarias.length) { log('Você ainda não tem montaria. O Seu Pedal, na Vila, tem um skate para você (nível 5).', 'l-sis'); return; }
  if (!montariaAtual()) s.montaria = s.montarias[s.montarias.length - 1];
  if (s.montado) { desmontar(); return; }
  if (G.mapa.interior) { log('Aqui dentro não dá! Monte lá fora.', 'l-sis'); return; }
  if (rivalPerto()) { log('Tem rival te desafiando! Não dá pra subir na montaria agora.', 'l-dano'); fala(G.p, 'Depois eu subo!'); return; }
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
usarDrible = function (id) { if (montadoAgora()) desmontar('Você desceu da montaria para driblar!'); return _usarDribleMt(id); };
const _recebeDanoMt = recebeDano;
recebeDano = function (dano, m) { if (montadoAgora()) desmontar('Levou uma bolada e desceu da montaria!'); return _recebeDanoMt(dano, m); };
const _atualizaMt = atualiza;
atualiza = function (dt) {
  if (montadoAgora() && G.alvo && G.mons.includes(G.alvo) && dist(G.p, G.alvo) < 2.2) desmontar('Você desceu da montaria para jogar!');
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
  log(id ? `✨ Você vestiu a skin ${SKINS[id].nome}!` : 'Você voltou ao visual normal.', id ? 'l-mitico' : 'l-sis');
  if (id) { efeito('nivel', G.p.x, G.p.y); som('equip'); }
}

/* ---------- janela "Visual": montarias e skins ---------- */
function iconeMontaria(id) {
  const mt = MONTARIAS[id]; const c = mkCanvas(96, 72); const x = c.getContext('2d');
  if (mt.tipo === 'skate') { x.translate(48, 50); x.scale(0.8, 0.8); const TT = T; desenhaSkate(x, '#e84a4a'); return c; }
  const im = imgMontaria(mt); if (!im) return c;
  const s = Math.min(90 / im.width, 68 / im.height); x.drawImage(im, (96 - im.width * s) / 2, (72 - im.height * s) / 2, im.width * s, im.height * s); return c;
}
function ondeMissao(qid) { const q = MISSOES.find(q => q.id === qid); if (!q) return ''; const onde = NPCS_MONT_ONDE.find(([id]) => id === q.npc); return `${NPCS[q.npc].nome} (${({ vila: 'Vila', cidade: 'Cidade', miami: 'Miami' })[onde && onde[1]] || ''}) · nível ${q.lvl}`; }
function modalVisual(aba) {
  const s = estMont(); aba = aba || 'mont';
  const abas = el('div', { class: 'mt-abas' },
    el('button', { class: 'btn mini' + (aba === 'mont' ? ' amarelo' : ''), onclick: () => modalVisual('mont') }, '🛵 Montarias'),
    el('button', { class: 'btn mini' + (aba === 'skin' ? ' amarelo' : ''), onclick: () => modalVisual('skin') }, '✨ Skins'));
  const grade = el('div', { class: 'mt-grade' });
  if (aba === 'mont') {
    for (const id of ORDEM_MONT) {
      const mt = MONTARIAS[id]; const tem = s.montarias.includes(id); const usando = tem && s.montaria === id;
      const q = MISSOES_MONT.find(q => q.rec.montaria === id);
      grade.append(el('div', { class: 'mt-card' + (tem ? '' : ' bloq') + (usando ? ' usando' : '') }, iconeMontaria(id),
        el('b', {}, mt.nome), el('small', {}, `+${Math.round(mt.bonus * 100)}% de velocidade`),
        tem ? el('button', { class: 'btn mini ' + (usando && s.montado ? '' : 'amarelo'), onclick: () => { if (usando && s.montado) desmontar(); else escolheMontaria(id); modalVisual('mont'); } }, usando && s.montado ? 'Descer' : usando ? 'Montar (P)' : 'Usar esta')
          : el('small', { class: 'mt-como' }, `🔒 Missão com ${ondeMissao(q.id)}`)));
    }
  } else {
    grade.append(el('div', { class: 'mt-card' + (!s.skin ? ' usando' : '') }, previewSkin(null), el('b', {}, 'Visual normal'), el('small', {}, 'Suas roupas e equipamentos'), el('button', { class: 'btn mini' + (s.skin ? ' amarelo' : ''), onclick: () => { vesteSkin(null); modalVisual('skin'); } }, s.skin ? 'Usar' : 'Usando')));
    for (const id in SKINS) {
      const sk = SKINS[id]; const tem = s.skins.includes(id); const usando = s.skin === id;
      const q = MISSOES_MONT.find(q => q.rec.skin === id);
      const req = q.req.itens.map(([iid, n]) => `${fmt(Math.min(contaItem(iid), n))}/${fmt(n)} ${ITENS[iid] ? ITENS[iid].nome : iid}`).join(' · ');
      grade.append(el('div', { class: 'mt-card skin' + (tem ? '' : ' bloq') + (usando ? ' usando' : '') }, previewSkin(id), el('b', {}, sk.nome), el('small', {}, sk.desc),
        tem ? el('button', { class: 'btn mini' + (usando ? '' : ' amarelo'), onclick: () => { vesteSkin(usando ? null : id); modalVisual('skin'); } }, usando ? 'Tirar' : 'Vestir')
          : el('small', { class: 'mt-como' }, `🔒 ${ondeMissao(q.id)}. Pede: ${req}`)));
    }
  }
  abreModal.largo = true;
  abreModal(el('h2', {}, '✨ Visual'), el('p', {}, aba === 'mont' ? 'Montarias deixam você mais rápido(a). Aperte P para subir e descer. Ao driblar ou levar bolada, você desce sozinho(a).' : 'Skins exclusivas mudam seu visual e têm efeitos especiais. Só a Dona Vera, na Cidade, faz — e pede MUITOS itens raros.'), abas, grade);
}
// botão no topo, tecla P e botão de toque
(function () {
  const nav = document.querySelector('.topo-nav');
  if (nav && !document.getElementById('btnVisual')) {
    const b = el('button', { class: 'btn mini verde', id: 'btnVisual', type: 'button', title: 'Montarias e skins (P monta/desce)' }, '✨ Visual');
    b.addEventListener('click', () => { if (G.save) modalVisual(); });
    const ref = document.getElementById('btnArenas') || nav.querySelector('[data-abre="album"]'); if (ref) ref.after(b); else nav.append(b);
  }
  const toq = document.querySelector('.toque-acoes');
  if (toq && !document.getElementById('tMontar')) { const t = el('button', { class: 'btn', id: 'tMontar', type: 'button' }, '🛵 Montar'); t.addEventListener('click', () => { if (G.rodando && !G.pausado) montar(); }); toq.prepend(t); }
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
  if (box) box.append(el('div', { class: 'atalho' }, el('span', { class: 'kbd' }, 'P'), el('span', {}, 'Subir / descer da montaria')));
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
