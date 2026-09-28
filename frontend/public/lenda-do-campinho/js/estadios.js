/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏟️ ESTÁDIOS (v154): cada cidade do mundo tem o estádio do seu time.
   Fale com o técnico e DESAFIE o time: o time entra em campo em ondas
   (ataque → meio-campo → defesa → o CAPITÃO), com o relógio de 0' a 90'.
   Vença os 11 antes do apito final!
   - prêmio (XP + tostões) uma vez por dia em cada estádio;
   - na primeira vitória: a FLÂMULA do clube (troféu da coleção).
   Nomes: paródia com uma letra trocada, como na Copa dos Sonhos.
   Carregar DEPOIS de monumentos.js e ANTES de ruas.js / ambiente.js.
   ============================================================ */
const EST_DURACAO = 12 * 60 * 1000;  // 12 minutos de verdade = 90 minutos de jogo
const EST_W = 34, EST_H = 26;
// lista: POS Nome (★ = capitão)
const ESTADIOS = [
  { host: 'cairo', time: 'Al Ahlly', nome: 'Estádio Internacional do Cairu', cores: ['#d0202a', '#ffffff'], gol: '#2a8a3a', ar: 0.722, ref: [26, 6],
    lore: 'O clube mais vitorioso da África: a torcida canta o jogo inteiro!', tecnico: ['Mister Hassan', 'm', 'pele-morena', 'cabelo-curto', 'grisalho'],
    lista: 'GOL El Hadarry, ZAG Wael Gumaa, ZAG Xady Mohamed, LAT Ahmed Fathyy, LAT Sayed Moawadd, VOL Hossam Ghally, MEI Abutrika★, MEI Barakatt, ATA Emad Metebb, ATA Flávyo, ATA Hossam Hasan' },
  { host: 'toquio', time: 'FC Tókyo', nome: 'Estádio Nacional de Tókyo', cores: ['#1a3ab9', '#d42a2a'], padrao: 'listras', gol: '#e8c030', ar: 0.699, ref: [26, 6],
    lore: 'Disciplina e velocidade: o time corre como um trem-bala!', tecnico: ['Técnico Yamada', 'm', 'pele-clara', 'cabelo-curto', 'preto'],
    lista: 'GOL Gonnda, ZAG Yoshyda, ZAG Tomiyassu, LAT Nagatomu, LAT Sakkai, VOL Endou, MEI Kubbo★, MEI Kagawá, ATA Hondá, ATA Mitomma, ATA Kazu Miurra' },
  { host: 'doha', time: 'Al Sadh', nome: 'Estádio Jassim bin Hamadd', cores: ['#f4f4f8', '#1a1a1a'], gol: '#e05a2a', ar: 0.723, ref: [26, 6],
    lore: 'O time do deserto que toca a bola como ninguém.', tecnico: ['Técnico Khalid', 'm', 'pele-morena', 'cabelo-curto', 'preto'],
    lista: 'GOL Saad Al Xeeb, ZAG Abdelkarim Hasan, ZAG Boualem Khoukhy, LAT Pedru Miguel, LAT Hamid Ismaeel, VOL Gabbi, MEI Xavy★, MEI Al Haydoss, ATA Akram Afiff, ATA Baghdad Bounedjá, ATA Rodrigu Tabata' },
  { host: 'miami', time: 'Inter Miamy', nome: 'Estádio Rosa de Miamy', cores: ['#f5a0c0', '#1a1a1a'], gol: '#3ac8e8', ar: 0.686, ref: [26, 6],
    lore: 'O time rosa que trouxe o maior craque do mundo para a praia.', tecnico: ['Coach Martinez', 'm', 'pele-media', 'cabelo-curto', 'grisalho'],
    lista: 'GOL Callendar, ZAG Yedlyn, ZAG Avillés, LAT Jordi Albba, LAT Weigant, VOL Busquetz, MEI Redondu, MEI Alendi, ATA Messy★, ATA Suarezz, ATA Taylorr' },
  { host: 'lisboa', time: 'Benfyca', nome: 'Estádio da Luz', cores: ['#d0202a', '#ffffff'], gol: '#e8c030', ar: 0.727, ref: [26, 6],
    lore: 'A águia voa sobre o estádio antes de cada jogo!', tecnico: ['Mister Jorge', 'm', 'pele-clara', 'cabelo-curto', 'grisalho'],
    lista: 'GOL Preudomme, ZAG Luizão, ZAG Rúben Diaz, LAT Grimaldu, LAT Maxi Pereyra, VOL Fejsá, MEI Rui Costta, MEI Pablo Aimarr, ATA Eusébiu★, ATA Nuno Gomez, ATA Di Marya' },
  { host: 'madri', time: 'Reau Madrid', nome: 'Santiago Bernabéo', cores: ['#f4f4f8', '#e8c048'], gol: '#3a3a4a', ar: 0.723, ref: [26, 6],
    lore: 'Os Galácticos: um time cheio de estrelas.', tecnico: ['Don Vicente', 'm', 'pele-clara', 'cabelo-curto', 'grisalho'],
    lista: 'GOL Casilhas, ZAG Hierru, ZAG Helguerra, LAT Míchel Salgadu, LAT Roberto Carlus, VOL Makelelê, MEI Zidanne★, MEI Figu, ATA Raúll, ATA Morientis, ATA Ronaldu' },
  { host: 'milao', time: 'Millan', nome: 'San Syro', cores: ['#c8102e', '#1a1a1a'], padrao: 'listras', gol: '#3aa04a', ar: 0.761, ref: [26, 6],
    lore: 'O trio holandês e a defesa mais famosa da história.', tecnico: ['Mister Arrigo', 'm', 'pele-clara', 'cabelo-curto', 'castanho'],
    lista: 'GOL Gallí, ZAG Baresy, ZAG Maldinni, LAT Tassottí, LAT Costacurtta, VOL Rijkardd, VOL Ancelotty, MEI Donadonni, ATA Van Bastenn★, ATA Gullitt, ATA Massarro' },
  { host: 'munique', time: 'Baiern de Munique', nome: 'Aliança Arena', cores: ['#d0202a', '#ffffff'], gol: '#3a3a4a', ar: 0.682, ref: [26, 6],
    lore: 'O estádio que brilha em vermelho à noite. Aqui, ninguém desiste até o fim.', tecnico: ['Trainer Franz', 'm', 'pele-clara', 'cabelo-curto', 'loiro'],
    lista: 'GOL Neuerr, ZAG Boatengg, ZAG Beckenbaur, LAT Lahmm, LAT Alabba, VOL Kimmichi, MEI Müllerr, MEI Schweinstaiger, ATA Lewandowsky★, ATA Robbenn, ATA Ribérry' },
  { host: 'londres', time: 'Chelsy', nome: 'Stamford Brydge', cores: ['#1a3ab9', '#ffffff'], gol: '#e8c030', ar: 0.717, ref: [26, 6],
    lore: 'Os Blues de Londres: força, raça e um centroavante imparável.', tecnico: ['Mister Frank', 'm', 'pele-clara', 'cabelo-curto', 'castanho'],
    lista: 'GOL Petr Cechh, ZAG Terri, ZAG Carvalhu, LAT Ashley Colle, LAT Ivanovyc, VOL Kantê, MEI Lampardi, MEI Hazardi, ATA Drogbá★, ATA Joe Colle, ATA Willyan' },
  { host: 'paris', time: 'Paris Saint-Germaim', nome: 'Parque dos Príncipes', cores: ['#1a2a6a', '#d42a2a'], padrao: 'faixa', gol: '#3ac850', ar: 0.736, ref: [26, 6],
    lore: 'O time da Cidade Luz, com o atacante mais rápido do mundo.', tecnico: ['Monsieur Laurent', 'm', 'pele-negra', 'cabelo-curto', 'preto'],
    lista: 'GOL Donnarumá, ZAG Thiago Sylva, ZAG Marquinhus, LAT Hakimy, LAT Nunu Mendes, VOL Vitinhia, MEI Raý, MEI Verratty, ATA Mbapê★, ATA Ibrahimovyc, ATA Ronaldinhu Gaúxo' },
  { host: 'buenos', time: 'Boka Juniors', nome: 'La Bombonerra', cores: ['#1a3ab9', '#f8d838'], padrao: 'banda', gol: '#3a3a4a', ar: 0.764, ref: [26, 6],
    lore: 'Quando a torcida pula, o estádio inteiro treme!', tecnico: ['Profe Carlos', 'm', 'pele-media', 'cabelo-curto', 'preto'],
    lista: 'GOL Córdobba, ZAG Samuell, ZAG Bermudezz, LAT Ibarrra, LAT Arruabarena, VOL Battaglya, MEI Riquelmi★, MEI Maradonna, ATA Palermu, ATA Tevés, ATA Guillermu' },
  { host: 'rio', time: 'Flamengu', nome: 'Maracanã', cores: ['#c8102e', '#1a1a1a'], padrao: 'aros', gol: '#3a3a4a', ar: 0.725, ref: [26, 6],
    lore: 'O time campeão do mundo de 1981, no maior estádio do Brasil.', tecnico: ['Seu Paulo César', 'm', 'pele-negra', 'cabelo-curto', 'grisalho'],
    lista: 'GOL Raull, ZAG Marinhu, ZAG Mozerr, LAT Leandru, LAT Júniur, VOL Andradi, MEI Adíliu, MEI Zicu★, MEI Licu, ATA Nunis, ATA Titta' },
];
const EST_POR_ID = {};
const EST_ARQ = { GOL: 'zagueiro', ZAG: 'zagueiro', LAT: 'meia', VOL: 'meia', MEI: 'meia', ATA: 'rapido' };
const EST_PELES = ['pele-clara', 'pele-media', 'pele-morena', 'pele-negra', 'pele-retinta'];
for (const e of ESTADIOS) {
  e.id = 'est_' + e.host; EST_POR_ID[e.id] = e; e.flamula = 'flamula_' + e.host;
  const c = typeof CIDADES !== 'undefined' && CIDADES.find(k => k.id === e.host);
  const Lc = c ? c.L : (typeof NIVEL_EUROPA !== 'undefined' && NIVEL_EUROPA[e.host]) || 100;
  e.L = Lc + 12; e.req = Lc + 6; // mais forte que o chefão da arena (cidade + ~10)
  e.jog = e.lista.split(',').map((t, k) => { const [pos, ...nm] = t.trim().split(' '); const nome = nm.join(' '); const cap = /★$/.test(nome); return { pos, nome: nome.replace('★', ''), cap, id: `${e.id}_${k}` }; });
  // os jogadores viram adversários do tamanho do time
  for (const j of e.jog) {
    const arq = j.cap ? 'chefe' : EST_ARQ[j.pos];
    const lk = { pele: EST_PELES[hashTxt(j.id) % EST_PELES.length], cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: j.pos === 'GOL' ? e.gol : e.cores[0], cor2: e.cores[1], baixo: 'baixo-shorts' };
    const d = montaMonstro(j.id, j.nome, arq, j.cap ? e.L + 2 : e.L, { falas: j.cap ? ['Aqui é a nossa casa!', 'Vem, que o capitão sou eu!', 'O estádio é nosso!'] : ['Marca ele!', 'Aqui não!', 'Toca pra mim!'], look: lk });
    d.respawn = 1e12; d.estadio = e.id; d.posicao = j.pos;
    if (j.cap) { // o capitão: ataque, defesa e nível acima do chefão de arena; e ele vem depois de 10 jogadores, com o relógio correndo
      const b = statsNivel(e.L + 3); d.hp = Math.round(b.hp * 16); d.atk = Math.round(b.atk * 1.25); d.def = b.def; d.xp = Math.round(b.xp * 30);
      d.ranged = { alcance: 5, dano: Math.round(d.atk * 0.95), cd: 2300, proj: 'bolaforte' }; d.ouro = [e.L * 150, e.L * 250]; d.loot = [['fio_ouro', 1, 2, 4]];
    } else { d.hp = Math.round(d.hp * 1.25); d.xp = Math.round(d.xp * 1.5); d.loot = [['couro', 0.3, 1, 2], ['fio_ouro', 0.03, 1, 1]]; } // jogador profissional: mais vida que o adversário da rua
    // corpo desenhado: goleiro com o corpo de goleiro, o resto no corpo de jogador (tingido com a camisa do time)
    const grupo = typeof GRUPOS_CORPO !== 'undefined' ? GRUPOS_CORPO[j.pos === 'GOL' ? 'goleiro' : j.pos === 'ZAG' ? 'grande' : 'jogador'].m.filter(f => META_BONECOS[f]) : [];
    if (!j.cap && grupo.length) d.look = Object.assign({}, d.look, { folha: grupo[hashTxt(j.id) % grupo.length] });
  }
  // flâmula: o troféu do clube
  ITENS[e.flamula] = { nome: `Flâmula do ${e.time}`, tipo: 'chave', desc: `Troféu: você venceu o ${e.time} no ${e.nome}!` };
  if (!ASSET_SET.has('i_' + e.flamula)) { ASSETS.push('i_' + e.flamula); ASSET_SET.add('i_' + e.flamula); }
  // técnico
  const [tn, tc, tp, tcab, tcor] = e.tecnico;
  NPCS['tec_' + e.host] = { nome: tn, estadioId: e.id, ola: `Bem-vindo(a) ao ${e.nome}, a casa do ${e.time}! ${e.lore}`, look: { tipo: 'humano', corpo: tc, alt: 1.72, pele: tp, cabelo: tcab, corCabelo: tcor, roupa: 'roupa-moletom', corRoupa: e.cores[0], baixo: 'baixo-moletom', pescoco: 'pescoco-apito' } };
  if (typeof PADRAO_TIME !== 'undefined' && e.padrao) PADRAO_TIME[e.id] = [e.padrao, e.cores[1]];
  if (typeof CLIMA_CIDADE !== 'undefined' && CLIMA_CIDADE[e.host]) CLIMA_CIDADE[e.id] = CLIMA_CIDADE[e.host];
  // desenho do estádio (de fora), a porta no meio embaixo
  const spr = e.id; if (!ASSET_SET.has(spr)) { ASSETS.push(spr); ASSET_SET.add(spr); }
  e.w = 14; e.h = 7; const W = e.w + 0.5, H = W * e.ar; // o maior prédio da cidade
  PORTAS[spr] = { x: 0.5 + 0.5 / W, y: 1 - 0.3 / H };
  e.alto = Math.max(0, Math.ceil(H * 0.97 - e.h));
}

/* ---------- o estádio por dentro ---------- */
function criaEstadio(e) {
  const W = EST_W, H = EST_H;
  const b = new Construtor(e.id, e.nome, W, H, CH.CONCRETO, 700 + ESTADIOS.indexOf(e));
  bordaInvisivel(b);
  for (let x = 2; x < W - 2; x++) { b.obj(x, 1, 'arquibancada'); b.obj(x, 2, 'arquibancada'); }
  for (let y = 3; y < H - 2; y++) { b.obj(1, y, 'arquibancada'); b.obj(W - 2, y, 'arquibancada'); }
  for (let x = 2; x < W - 2; x++) if (Math.abs(x - 17) > 3) b.obj(x, H - 2, 'arquibancada'); // embaixo também, com a entrada livre
  b.ret(3, 3, W - 6, H - 7, CH.PISTA);
  b.campo(5, 5, W - 10, H - 11, CH.CAMPO);
  for (const [x, y] of [[3, 3], [W - 4, 3], [3, H - 5], [W - 4, H - 5]]) b.obj(x, y, 'holofote');
  b.obj(10, 3, 'bandeirao'); b.obj(W - 11, 3, 'bandeirao'); objLargo(b, 17, 3, 'placar', 3);
  b.obj(9, H - 5, 'banco_reservas'); b.obj(W - 10, H - 5, 'banco_reservas');
  b.npc('tec_' + e.host, 13, H - 4);
  b.placa(21, H - 4, `🏟️ ${e.nome.toUpperCase()} — a casa do ${e.time}. Fale com o técnico para desafiar o time!`);
  b.saida(17, H - 1, e.host); b.m.saidas.forEach(s => { if (s.para === e.host) s.volta = true; });
  b.m.inicio = { x: 17, y: H - 3 }; b.m.renasce = { x: 17, y: H - 3 };
  b.m.estadio = e.id;
  return b.m;
}
for (const e of ESTADIOS) {
  MAPAS_DEF[e.id] = () => criaEstadio(e);
  const base = MAPAS_DEF[e.host]; if (!base) continue;
  const def = { spr: e.id, w: e.w, h: e.h, ar: e.ar, alto: e.alto, ref: e.ref, nome: e.nome, txt: `A casa do ${e.time}. Entre e desafie o time!`, interior: e.id, limpa: true };
  MAPAS_DEF[e.host] = function () { const m = base(); try { poeMonumento(m, def); } catch (err) { console.error('estádio', e.id, err); } return m; };
}

/* ---------- registro (no save) ---------- */
function hojeEst() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
// guardado junto com as arenas: a ficha pública do site (backend/ficha.js) já publica s.arenas → as conquistas aparecem lá sem mudar o servidor
function regEstadio(id) { const s = G.save; s.arenas = s.arenas || {}; const r = s.arenas[id] || (s.arenas[id] = {}); if (typeof r.vitorias !== 'number') r.vitorias = 0; return r; }

/* ---------- janela do técnico ---------- */
function retratoCapitao(e) {
  const j = e.jog.find(x => x.cap); const c = mkCanvas(110, 138); c.className = 'ar-retrato'; c.style.borderColor = e.cores[0];
  pintaAparencia(c, MONSTROS[j.id].look, { fundo: '#241640' }); return c;
}
function modalEstadio(npc) {
  const e = EST_POR_ID[npc.d.estadioId]; const s = G.save; const reg = regEstadio(e.id);
  const cap = e.jog.find(j => j.cap); const premioHoje = reg.dia !== hojeEst(); const pode = s.nivel >= e.req;
  const escal = el('div', { class: 'est-escal' });
  for (const pos of ['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA']) { const js = e.jog.filter(j => j.pos === pos); if (js.length) escal.append(el('div', {}, el('b', {}, POS_NOME[pos] + ': '), js.map(j => j.nome + (j.cap ? ' ★' : '')).join(', '))); }
  const ops = el('div', { class: 'opcoes' });
  ops.append(el('button', { class: 'btn amarelo', disabled: pode && !G.desafio ? null : 'disabled', onclick: () => { fechaModal(); iniciaDesafio(e); } }, pode ? `⚽ Desafiar o ${e.time}` : `Precisa do nível ${e.req}`));
  ops.append(el('button', { class: 'btn', onclick: fechaModal }, 'Tchau!'));
  abreModal(el('h2', {}, `🏟️ ${e.nome}`),
    el('div', { class: 'npc-topo' }, retratoCapitao(e), el('div', { class: 'fala' },
      el('p', {}, typeof escudo === 'function' ? escudo(e.cores[0], e.cores[1], 22) : null, ' ', el('b', {}, e.time), ` · nível ${e.L} · capitão: ${cap.nome} ★`),
      el('p', {}, e.lore),
      el('ul', { class: 'ar-regras' },
        el('li', {}, 'O time entra em campo em ondas: primeiro o ATAQUE, depois o MEIO-CAMPO, a DEFESA e, no fim, o GOLEIRO com o CAPITÃO.'),
        el('li', {}, 'Vença os 11 antes do apito final (90 minutos de jogo = 12 minutos de verdade).'),
        el('li', {}, '⚠️ Mais difícil que os chefões das arenas: é um time profissional inteiro, e o capitão é o craque do time.'),
        el('li', {}, premioHoje ? `🎁 Prêmio de hoje: ${fmt(premioEstadio(e).xp)} XP, ${fmt(premioEstadio(e).ouro)} tostões e ${premioEstadio(e).fios} fios de ouro.` : '✔ Você já ganhou o prêmio de hoje aqui. Pode jogar de novo por diversão!'),
        el('li', {}, reg.flamula ? `🚩 Você já tem a Flâmula do ${e.time}. Vitórias aqui: ${reg.vitorias}.` : `🚩 Na primeira vitória você ganha a Flâmula do ${e.time}!`)))),
    el('h3', {}, '📋 Escalação'), escal, ops);
}
function premioEstadio(e) { const b = statsNivel(e.L); return { xp: Math.round(b.xp * 35 * 1.5), ouro: e.L * 600, fios: 5 }; } // 1,5× o chefão de arena do mesmo nível
{ const _abrirNPCEst = abrirNPC; abrirNPC = function (npc) { if (npc && npc.d && npc.d.estadioId) return modalEstadio(npc); return _abrirNPCEst.apply(this, arguments); }; }
if (typeof iconeNPC === 'function') { const _iconeNPCEst = iconeNPC; iconeNPC = function (n) { const d = n.d || NPCS[n.id] || {}; return d.estadioId ? '⚽' : _iconeNPCEst(n); }; }

/* ---------- a partida ---------- */
G.desafio = null;
function ondasDo(e) {
  const semCap = e.jog.filter(j => !j.cap);
  return [semCap.filter(j => j.pos === 'ATA'), semCap.filter(j => j.pos === 'MEI' || j.pos === 'VOL'), semCap.filter(j => j.pos === 'ZAG' || j.pos === 'LAT'), [...semCap.filter(j => j.pos === 'GOL'), ...e.jog.filter(j => j.cap)]].filter(o => o.length);
}
const EST_NOME_ONDA = ['O ATAQUE entrou em campo!', 'Agora vem o MEIO-CAMPO!', 'A DEFESA não vai deixar barato!', 'O CAPITÃO e o GOLEIRO entraram em campo!'];
function iniciaDesafio(e) {
  if (G.desafio) return;
  const ondas = ondasDo(e);
  G.desafio = { e, ondas, onda: -1, ini: G.agora, fim: G.agora + EST_DURACAO, vencidos: 0, total: e.jog.length, prox: G.agora + 2500 };
  G.mons = G.mons.filter(m => !(m.sp && m.sp.desafio));
  banner(`${e.time} × ${G.save.nome}`, 'Vai começar a partida! Vença os 11 antes do apito final.'); som('apito');
  log(`⚽ Começou o desafio contra o ${e.time} no ${e.nome}!`, 'l-lendario');
  placarEstadio();
}
function soltaOnda() {
  const D = G.desafio; D.onda++; D.prox = null;
  const lista = D.ondas[D.onda], n = lista.length;
  lista.forEach((j, k) => {
    const x = Math.round(7 + (EST_W - 14) * (n === 1 ? 0.5 : k / (n - 1))), y = j.cap ? 9 : 7 + (k % 2) * 3;
    const m = criaMonstro({ m: j.id, x, y, qtd: 1, raio: 1, desafio: true }); if (!m) return;
    m.bravo = true; G.mons.push(m); efeito('puff', m.x, m.y);
  });
  banner(lista.some(j => j.cap) ? EST_NOME_ONDA[3] : EST_NOME_ONDA[Math.min(D.onda, 2)], D.e.time); som('apito');
  const cap = lista.find(j => j.cap); if (cap) { const m = G.mons.find(x => x.tipo === cap.id); if (m) fala(m, MONSTROS[cap.id].falas[0]); }
}
function fimDesafio(venceu, motivo) {
  const D = G.desafio; if (!D) return; G.desafio = null;
  G.mons = G.mons.filter(m => !(m.sp && m.sp.desafio)); G.respawns = G.respawns.filter(r => !(r.sp && r.sp.desafio));
  if (G.alvo && !G.mons.includes(G.alvo)) G.alvo = null;
  placarEstadio();
  const e = D.e;
  if (!venceu) {
    if (motivo !== 'saiu') { banner('Fim de jogo!', motivo === 'tempo' ? `O juiz apitou: você venceu ${D.vencidos} de ${D.total}. Tente de novo!` : 'Você ficou sem fôlego. Tente de novo!'); som('erro'); }
    log(`⚽ Desafio contra o ${e.time}: ${motivo === 'tempo' ? 'acabou o tempo' : motivo === 'saiu' ? 'você saiu do estádio' : 'você ficou sem fôlego'} (${D.vencidos}/${D.total}).`, 'l-sis');
    return;
  }
  const s = G.save, reg = regEstadio(e.id); reg.vitorias++;
  const minuto = Math.min(90, Math.ceil((G.agora - D.ini) / EST_DURACAO * 90));
  banner('VITÓRIA!', `Você venceu o ${e.time} no ${e.nome} aos ${minuto}'!`); som('nivel'); efeito('nivel', G.p.x, G.p.y);
  log(`🏆 VITÓRIA! Você venceu o ${e.time} no ${e.nome} (${minuto}').`, 'l-lendario');
  if (reg.dia !== hojeEst()) { const p = premioEstadio(e); reg.dia = hojeEst(); s.ouro += p.ouro; ganhaXp(p.xp); recebeItem('fio_ouro', p.fios); log(`🎁 Prêmio do dia: ${fmt(p.xp)} XP, ${fmt(p.ouro)} tostões e ${p.fios} fios de ouro.`, 'l-loot'); }
  if (!reg.flamula) { reg.flamula = true; recebeItem(e.flamula, 1); log(`🚩 Você ganhou a Flâmula do ${e.time}!`, 'l-lendario'); }
  if (typeof oferecerDivulgar === 'function') oferecerDivulgar({ feito: `Venci o ${e.time} no ${e.nome}!` });
  G.uiSujo = true; salvar();
}
// placar na tela
function placarEstadio() {
  let p = document.getElementById('placarEst'); const D = G.desafio;
  if (!D) { if (p) p.remove(); return; }
  if (!p) { p = el('div', { id: 'placarEst' }); document.body.append(p); }
  const min = Math.min(90, Math.floor((G.agora - D.ini) / EST_DURACAO * 90));
  const txt = `⏱️ ${min}'  ·  ${D.e.time}: ${D.vencidos}/${D.total} vencidos`;
  if (p.textContent !== txt) p.textContent = txt;
}
{ const st = document.createElement('style'); st.textContent = `#placarEst { position: fixed; left: 50%; top: 116px; transform: translateX(-50%); z-index: 55; background: rgba(26,16,38,.88); color: #ffe14a; font: 800 16px Nunito, "Segoe UI", sans-serif; padding: 6px 14px; border-radius: 12px; border: 2px solid #ffe14a; pointer-events: none; white-space: nowrap; } .est-escal { font-size: 14px; line-height: 1.5; margin-bottom: 8px; }`; document.head.append(st); }
// ganchos: contar quem foi vencido, relógio, fôlego, sair do estádio
{
  const _matarEst = matar;
  matar = function (m) {
    const r = _matarEst.apply(this, arguments);
    if (m && m.sp && m.sp.desafio) {
      G.respawns = G.respawns.filter(x => !(x.sp && x.sp.desafio));
      const D = G.desafio; if (D) { D.vencidos++; if (!G.mons.some(x => x.sp && x.sp.desafio)) { if (D.onda >= D.ondas.length - 1) fimDesafio(true); else { D.prox = G.agora + 1800; banner(`${D.vencidos}/${D.total}`, 'Boa! Vem mais gente aí...'); } } placarEstadio(); }
    }
    return r;
  };
  const _morrerEst = morrer;
  morrer = function () { if (G.desafio) fimDesafio(false, 'folego'); return _morrerEst.apply(this, arguments); };
  const _atualizaEst = atualiza;
  atualiza = function (dt) {
    const r = _atualizaEst.apply(this, arguments);
    const D = G.desafio;
    if (D) {
      if (!G.mapa || G.mapa.id !== D.e.id) fimDesafio(false, 'saiu');
      else if (G.agora >= D.fim) fimDesafio(false, 'tempo');
      else { if (D.prox && G.agora >= D.prox) soltaOnda(); if (!D._t || G.agora - D._t > 250) { D._t = G.agora; placarEstadio(); } }
    }
    return r;
  };
}

/* ---------- capitães: desenho próprio ---------- */
const EST_META_CAP = {"cap_cairo":[{"cabeca":[39,40,161,142],"tronco":[82,142,118,205]},{"cabeca":[37,40,158,142],"tronco":[82,142,118,205]},{"cabeca":[42,44,163,144],"tronco":[82,144,118,207]},{"cabeca":[39,40,160,142],"tronco":[82,142,118,205]},{"cabeca":[48,47,157,146],"tronco":[82,146,118,208]},{"cabeca":[46,46,155,145],"tronco":[82,145,118,207]},{"cabeca":[48,47,157,146],"tronco":[82,146,118,208]},{"cabeca":[52,46,158,145],"tronco":[82,145,118,207]},{"cabeca":[39,41,160,143],"tronco":[82,143,118,206]},{"cabeca":[41,45,161,145],"tronco":[82,145,118,207]},{"cabeca":[39,41,159,143],"tronco":[82,143,118,206]},{"cabeca":[40,42,160,143],"tronco":[82,143,118,206]}],"cap_toquio":[{"cabeca":[39,40,162,142],"tronco":[82,142,118,205]},{"cabeca":[37,40,161,142],"tronco":[82,142,118,205]},{"cabeca":[40,40,164,142],"tronco":[82,142,118,205]},{"cabeca":[38,40,162,142],"tronco":[82,142,118,205]},{"cabeca":[42,50,164,148],"tronco":[82,148,118,209]},{"cabeca":[42,50,164,148],"tronco":[82,148,118,209]},{"cabeca":[43,50,165,148],"tronco":[82,148,118,209]},{"cabeca":[40,50,164,148],"tronco":[82,148,118,209]},{"cabeca":[39,44,162,144],"tronco":[82,144,118,207]},{"cabeca":[40,44,163,144],"tronco":[82,144,118,207]},{"cabeca":[39,44,161,144],"tronco":[82,144,118,207]},{"cabeca":[40,44,162,144],"tronco":[82,144,118,207]}],"cap_doha":[{"cabeca":[40,40,161,142],"tronco":[82,142,118,205]},{"cabeca":[39,39,160,141],"tronco":[82,141,118,205]},{"cabeca":[42,39,163,141],"tronco":[82,141,118,205]},{"cabeca":[40,40,161,142],"tronco":[82,142,118,205]},{"cabeca":[42,38,158,141],"tronco":[82,141,118,205]},{"cabeca":[42,40,157,142],"tronco":[82,142,118,205]},{"cabeca":[43,41,159,143],"tronco":[82,143,118,206]},{"cabeca":[45,40,160,142],"tronco":[82,142,118,205]},{"cabeca":[40,34,161,139],"tronco":[82,139,118,204]},{"cabeca":[41,30,162,136],"tronco":[82,136,118,202]},{"cabeca":[39,31,161,137],"tronco":[82,137,118,203]},{"cabeca":[41,34,162,139],"tronco":[82,139,118,204]}],"cap_miami":[{"cabeca":[38,40,163,142],"tronco":[82,142,118,205]},{"cabeca":[37,41,161,143],"tronco":[82,143,118,206]},{"cabeca":[41,41,164,143],"tronco":[82,143,118,206]},{"cabeca":[38,41,163,143],"tronco":[82,143,118,206]},{"cabeca":[43,45,164,145],"tronco":[82,145,118,207]},{"cabeca":[41,45,162,145],"tronco":[82,145,118,207]},{"cabeca":[42,45,163,145],"tronco":[82,145,118,207]},{"cabeca":[42,45,162,145],"tronco":[82,145,118,207]},{"cabeca":[38,36,165,140],"tronco":[82,140,118,204]},{"cabeca":[38,35,165,139],"tronco":[82,139,118,204]},{"cabeca":[36,36,163,140],"tronco":[82,140,118,204]},{"cabeca":[37,38,164,141],"tronco":[82,141,118,205]}],"cap_lisboa":[{"cabeca":[37,40,161,142],"tronco":[82,142,118,205]},{"cabeca":[36,37,162,140],"tronco":[82,140,118,204]},{"cabeca":[41,38,165,141],"tronco":[82,141,118,205]},{"cabeca":[39,40,164,142],"tronco":[82,142,118,205]},{"cabeca":[42,47,163,146],"tronco":[82,146,118,208]},{"cabeca":[40,46,162,145],"tronco":[82,145,118,207]},{"cabeca":[41,46,163,145],"tronco":[82,145,118,207]},{"cabeca":[41,46,163,145],"tronco":[82,145,118,207]},{"cabeca":[38,40,162,142],"tronco":[82,142,118,205]},{"cabeca":[39,40,164,142],"tronco":[82,142,118,205]},{"cabeca":[37,38,161,141],"tronco":[82,141,118,205]},{"cabeca":[37,42,162,143],"tronco":[82,143,118,206]}],"cap_madri":[{"cabeca":[37,40,162,142],"tronco":[82,142,118,205]},{"cabeca":[36,39,161,141],"tronco":[82,141,118,205]},{"cabeca":[40,40,165,142],"tronco":[82,142,118,205]},{"cabeca":[37,40,162,142],"tronco":[82,142,118,205]},{"cabeca":[45,46,157,145],"tronco":[82,145,118,207]},{"cabeca":[45,45,157,145],"tronco":[82,145,118,207]},{"cabeca":[46,45,158,145],"tronco":[82,145,118,207]},{"cabeca":[45,46,158,145],"tronco":[82,145,118,207]},{"cabeca":[36,36,165,140],"tronco":[82,140,118,204]},{"cabeca":[37,35,166,139],"tronco":[82,139,118,204]},{"cabeca":[35,35,164,139],"tronco":[82,139,118,204]},{"cabeca":[36,36,165,140],"tronco":[82,140,118,204]}],"cap_milao":[{"cabeca":[34,40,167,142],"tronco":[82,142,118,205]},{"cabeca":[33,40,165,142],"tronco":[82,142,118,205]},{"cabeca":[38,42,170,143],"tronco":[82,143,118,206]},{"cabeca":[34,40,167,142],"tronco":[82,142,118,205]},{"cabeca":[41,54,164,150],"tronco":[82,150,118,210]},{"cabeca":[40,53,163,150],"tronco":[82,150,118,210]},{"cabeca":[41,53,164,150],"tronco":[82,150,118,210]},{"cabeca":[41,54,164,150],"tronco":[82,150,118,210]},{"cabeca":[39,45,165,145],"tronco":[82,145,118,207]},{"cabeca":[40,46,165,145],"tronco":[82,145,118,207]},{"cabeca":[38,46,163,145],"tronco":[82,145,118,207]},{"cabeca":[40,46,164,145],"tronco":[82,145,118,207]}],"cap_munique":[{"cabeca":[39,40,163,142],"tronco":[82,142,118,205]},{"cabeca":[36,40,161,142],"tronco":[82,142,118,205]},{"cabeca":[41,39,165,141],"tronco":[82,141,118,205]},{"cabeca":[38,40,162,142],"tronco":[82,142,118,205]},{"cabeca":[39,47,164,146],"tronco":[82,146,118,208]},{"cabeca":[38,47,163,146],"tronco":[82,146,118,208]},{"cabeca":[40,47,165,146],"tronco":[82,146,118,208]},{"cabeca":[41,47,167,146],"tronco":[82,146,118,208]},{"cabeca":[39,39,163,141],"tronco":[82,141,118,205]},{"cabeca":[40,38,164,141],"tronco":[82,141,118,205]},{"cabeca":[39,38,162,141],"tronco":[82,141,118,205]},{"cabeca":[40,39,163,141],"tronco":[82,141,118,205]}],"cap_londres":[{"cabeca":[41,40,161,142],"tronco":[82,142,118,205]},{"cabeca":[38,40,159,142],"tronco":[82,142,118,205]},{"cabeca":[44,40,163,142],"tronco":[82,142,118,205]},{"cabeca":[42,40,162,142],"tronco":[82,142,118,205]},{"cabeca":[45,50,161,148],"tronco":[82,148,118,209]},{"cabeca":[46,48,159,147],"tronco":[82,147,118,208]},{"cabeca":[46,48,161,147],"tronco":[82,147,118,208]},{"cabeca":[46,50,160,148],"tronco":[82,148,118,209]},{"cabeca":[41,40,162,142],"tronco":[82,142,118,205]},{"cabeca":[41,45,163,145],"tronco":[82,145,118,207]},{"cabeca":[40,40,161,142],"tronco":[82,142,118,205]},{"cabeca":[39,40,161,142],"tronco":[82,142,118,205]}],"cap_paris":[{"cabeca":[39,40,161,142],"tronco":[82,142,118,205]},{"cabeca":[38,40,160,142],"tronco":[82,142,118,205]},{"cabeca":[42,40,164,142],"tronco":[82,142,118,205]},{"cabeca":[40,40,162,142],"tronco":[82,142,118,205]},{"cabeca":[45,47,158,146],"tronco":[82,146,118,208]},{"cabeca":[45,45,156,145],"tronco":[82,145,118,207]},{"cabeca":[45,45,156,145],"tronco":[82,145,118,207]},{"cabeca":[50,46,161,145],"tronco":[82,145,118,207]},{"cabeca":[39,39,162,141],"tronco":[82,141,118,205]},{"cabeca":[40,39,162,141],"tronco":[82,141,118,205]},{"cabeca":[37,39,161,141],"tronco":[82,141,118,205]},{"cabeca":[40,42,162,143],"tronco":[82,143,118,206]}],"cap_buenos":[{"cabeca":[35,40,167,142],"tronco":[82,142,118,205]},{"cabeca":[34,40,166,142],"tronco":[82,142,118,205]},{"cabeca":[38,40,169,142],"tronco":[82,142,118,205]},{"cabeca":[36,40,167,142],"tronco":[82,142,118,205]},{"cabeca":[42,44,167,144],"tronco":[82,144,118,207]},{"cabeca":[40,42,166,143],"tronco":[82,143,118,206]},{"cabeca":[42,42,168,143],"tronco":[82,143,118,206]},{"cabeca":[41,43,167,144],"tronco":[82,144,118,206]},{"cabeca":[38,40,168,142],"tronco":[82,142,118,205]},{"cabeca":[37,43,168,144],"tronco":[82,144,118,206]},{"cabeca":[34,40,165,142],"tronco":[82,142,118,205]},{"cabeca":[37,40,168,142],"tronco":[82,142,118,205]}],"cap_rio":[{"cabeca":[37,40,165,142],"tronco":[82,142,118,205]},{"cabeca":[36,40,164,142],"tronco":[82,142,118,205]},{"cabeca":[39,40,166,142],"tronco":[82,142,118,205]},{"cabeca":[38,40,165,142],"tronco":[82,142,118,205]},{"cabeca":[41,47,166,146],"tronco":[82,146,118,208]},{"cabeca":[40,47,164,146],"tronco":[82,146,118,208]},{"cabeca":[42,47,167,146],"tronco":[82,146,118,208]},{"cabeca":[41,47,166,146],"tronco":[82,146,118,208]},{"cabeca":[39,42,162,143],"tronco":[82,143,118,206]},{"cabeca":[40,42,163,143],"tronco":[82,143,118,206]},{"cabeca":[38,42,161,143],"tronco":[82,143,118,206]},{"cabeca":[40,42,163,143],"tronco":[82,143,118,206]}]};
Object.assign(META_BONECOS, EST_META_CAP);
for (const e of ESTADIOS) {
  const f = 'cap_' + e.host, cap = e.jog.find(j => j.cap); if (!EST_META_CAP[f]) continue;
  CORPOS_MODO[f] = 'fixo';
  if (typeof FOLHAS !== 'undefined' && !FOLHAS[f]) { const im = new Image(); const fo = FOLHAS[f] = { im, ok: false, rot: null }; im.onload = () => { fo.ok = true; }; im.src = `a/boneco_${f}.webp?v=154`; }
  MONSTROS[cap.id].look = Object.assign({}, MONSTROS[cap.id].look, { folha: f }); delete MONSTROS[cap.id].look._kb;
}

// v233: estádios na ordem do mundo (pelo nível)
ESTADIOS.sort((a, b) => a.L - b.L);
