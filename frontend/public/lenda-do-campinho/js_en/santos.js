/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👑 SANTOS E O REI (v234)
   - Os MENINOS DA VILA: os adversários de Santos, com desenho próprio (moicano, tatuagens, faixa).
   - "Nos Passos do Rei": 5 missões com a guia do Museu Pelé, cada uma um capítulo da vida de Pelé,
     que terminam no desafio ao ESQUADRÃO DE 1962 na Vila Belmiro (o capitão é o Rei, de coroa).
   - Capítulo "O Rei do Futebol" (cutscene) na primeira chegada a Santos.
   - A final da Copa (Rio) só abre depois da Vila Belmiro.
   Carregar DEPOIS de arquetipos.js e magias_adv.js (o último a mexer nos adversários e nos mapas).
   ============================================================ */

/* ---------- os Meninos da Vila ---------- */
const META_MENINOS = {"menino_vila_a":[{"cabeca":[40,32,159,137],"tronco":[82,137,118,203]},{"cabeca":[39,32,158,137],"tronco":[82,137,118,203]},{"cabeca":[43,32,161,137],"tronco":[82,137,118,203]},{"cabeca":[41,32,160,137],"tronco":[82,137,118,203]},{"cabeca":[48,39,156,141],"tronco":[82,141,118,205]},{"cabeca":[48,39,155,141],"tronco":[82,141,118,205]},{"cabeca":[49,39,156,141],"tronco":[82,141,118,205]},{"cabeca":[49,39,157,141],"tronco":[82,141,118,205]},{"cabeca":[42,29,159,136],"tronco":[82,136,118,202]},{"cabeca":[43,30,160,136],"tronco":[82,136,118,202]},{"cabeca":[42,29,159,136],"tronco":[82,136,118,202]},{"cabeca":[42,29,159,136],"tronco":[82,136,118,202]}],"menino_vila_b":[{"cabeca":[41,32,160,137],"tronco":[82,137,118,203]},{"cabeca":[40,30,159,136],"tronco":[82,136,118,202]},{"cabeca":[42,33,161,138],"tronco":[82,138,118,203]},{"cabeca":[40,30,160,136],"tronco":[82,136,118,202]},{"cabeca":[41,40,162,142],"tronco":[82,142,118,205]},{"cabeca":[40,38,161,141],"tronco":[82,141,118,205]},{"cabeca":[41,38,161,141],"tronco":[82,141,118,205]},{"cabeca":[42,39,163,141],"tronco":[82,141,118,205]},{"cabeca":[42,33,158,138],"tronco":[82,138,118,203]},{"cabeca":[43,33,160,138],"tronco":[82,138,118,203]},{"cabeca":[41,33,158,138],"tronco":[82,138,118,203]},{"cabeca":[41,33,158,138],"tronco":[82,138,118,203]}]};
Object.assign(META_BONECOS, META_MENINOS);
for (const f in META_MENINOS) CORPOS_MODO[f] = 'fixo';
if (typeof carregaFolhas === 'function') carregaFolhas();
for (const [id, folha] of [['santos_rapido', 'menino_vila_a'], ['santos_meia', 'menino_vila_b'], ['santos_zagueiro', 'menino_vila_b'], ['santos_chefe', 'menino_vila_a']]) {
  const d = MONSTROS[id]; if (!d) continue;
  d.look = Object.assign({}, d.look, { folha, corpo: 'm', grande: id === 'santos_chefe' }); delete d.look._kb;
  d.falas = id === 'santos_chefe' ? ['This is the Village!', 'Step-over on him!', 'Nobody can stop the Meninos da Vila!'] : ['Check out that step-over!', 'Rainbow Flick!', 'Nutmeg!', 'Menino da Vila coming through!'];
}

/* ---------- o Rei na Vila Belmiro ---------- */
{
  const e = typeof EST_POR_ID !== 'undefined' && EST_POR_ID.est_santos;
  const cap = e && e.jog.find(j => j.cap);
  if (cap && MONSTROS[cap.id]) {
    const d = MONSTROS[cap.id];
    d.nome = 'King Pelé'; d.falas = ['Come play with me, star!', 'Soccer is joy!', 'One-two, Coutinho!', 'Show me your moves!'];
    if (META_BONECOS.cap_santos) { d.look = Object.assign({}, d.look, { folha: 'cap_santos' }); delete d.look._kb; }
  }
}
{ const q = typeof CONQUISTAS !== 'undefined' && CONQUISTAS.find(c => c.id === 'c_estadios_todos');
  if (q) { const n = ESTADIOS.length; q.desc = `Beat all ${n} teams, in every stadium in the world.`; q.dica = `Beat the team from each of the ${n} stadiums.`; } }

/* ---------- missões da cidade (textos com os Meninos da Vila) ---------- */
{
  const tx = { santos_m1: 'The Meninos da Vila run along the whole seafront with step-overs and rainbow flicks. Show them how Campinho Village plays: get past 30 Village Rascals.',
    santos_m2: 'The Vila Belmiro Sheriffs are the most skillful defense around: they dribble their way out! Beat 30.',
    santos_m3: 'The Baixada Number 10s read the game like nobody else. Beat 30 to learn from them.',
    santos_m4: 'The CAPTAIN OF THE MENINOS DA VILA rules Beach Point. Beat him and all of Vila Belmiro will be talking about you!' };
  for (const [id, t] of Object.entries(tx)) { const q = MISSOES.find(x => x.id === id); if (q) q.texto = t; }
  const m4 = MISSOES.find(x => x.id === 'santos_m4'); if (m4) m4.fim = 'The Meninos da Vila gave you a round of applause! Now go to the Pelé Museum: the guide has a story to tell you.';
}

/* ---------- "Nos Passos do Rei": a guia do Museu Pelé ---------- */
NPCS.guia_rei = { nome: 'Dona Celeste, Pelé Museum guide', ola: 'Welcome to the Pelé Museum! Here we tell the story of the King of Soccer. Each mission is a chapter of his life. Shall we go together?',
  look: { tipo: 'humano', corpo: 'f', alt: 1.7, pele: 'pele-negra', cabelo: 'cabelo-cacheado', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: '#1a1a1a', baixo: 'baixo-saia', pescoco: 'pescoco-cachecol' } };
{
  const L = 188, xpN = x => xpPara(x + 1) - xpPara(x);
  // v407 (Raio-X, textos longos): o pedido fica curto (até ~200 letras) e a história vai para "📖 Saiba mais" (campo mais)
  MISSOES.push(
    { id: 'santos_rei1', npc: 'guia_rei', titulo: 'The King (1): The Sock Ball', lvl: 182,
      texto: 'Pelé grew up in a humble family and played in the street with a sock ball. Show off your moves like he did: get past 40 Village Rascals along the Santos seafront.', mais: 'Edson Arantes do Nascimento was born in 1940 in Três Corações (Minas Gerais) and grew up in Bauru (São Paulo). He shined shoes to help his family and played with a ball made of old socks tied together. The nickname "Pelé" came from his friends teasing him!',
      req: { kill: 'santos_rapido', n: 40 }, rec: { xp: Math.round(xpN(L) * 1.2), ouro: L * 150, itens: [['pastel_caldo', 5]] }, fim: 'With a sock ball and lots of joy, a star was born!' },
    { id: 'santos_rei2', npc: 'guia_rei', titulo: 'The King (2): The 1950 Promise', lvl: 183, pre: 'santos_rei1',
      texto: 'In 1950, little Edson made a promise to his dad: "One day I’m going to win a World Cup for you!" Show the same fighting spirit: get past 40 Baixada Number 10s, here in Santos.', mais: 'Brazil had lost the World Cup final at the Maracanã. The boy’s dad, Dondinho, who was also a player, cried listening to the game on the radio. Little Edson hugged him and made the promise.',
      req: { kill: 'santos_meia', n: 40 }, rec: { xp: Math.round(xpN(L) * 1.3), ouro: L * 170 }, fim: 'And he kept his promise... three times!' },
    { id: 'santos_rei3', npc: 'guia_rei', titulo: 'The King (3): At 15, at the Village', lvl: 184, pre: 'santos_rei2',
      texto: 'He joined Santos at 15, and at 17 he was already a world champion! Defenders tried everything to stop him. Get past 40 Vila Belmiro Sheriffs, here in Santos.', mais: 'It was in 1956 that he arrived at Vila Belmiro, and he soon became a starter. At the 1958 World Cup, in Sweden, he scored in the final, cried with joy, and Brazil became world champion for the first time.',
      req: { kill: 'santos_zagueiro', n: 40 }, rec: { xp: Math.round(xpN(L) * 1.4), ouro: L * 190 }, fim: 'World champion at 17. The promise was kept!' },
    { id: 'santos_rei4', npc: 'guia_rei', titulo: 'The King (4): The Plaque Goal', lvl: 186, pre: 'santos_rei3',
      texto: 'In 1961 he scored a goal so beautiful that it got a plaque at the Maracanã: that’s where the Brazilian saying "gol de placa" (a goal worthy of a plaque) comes from! Make your play: beat the Captain of the Meninos da Vila at Beach Point.', mais: 'For that goal he dribbled past half the Fluminense team. And in 1969 he scored his 1,000th goal and dedicated it to the children.',
      req: { kill: 'santos_chefe', n: 1 }, rec: { xp: Math.round(xpN(L) * 2), ouro: L * 300 }, fim: 'Now that was a goal worthy of a plaque!' },
    { id: 'santos_rei5', npc: 'guia_rei', titulo: 'The King (5): The 1962 Squad', lvl: 188, pre: 'santos_rei4',
      texto: 'The 1962 Squad, the King’s team, takes the field again at Vila Belmiro just for you! Talk to the coach at the Vila Belmiro stadium, here in Santos, and beat the King’s team.', mais: 'In 1962, the Santos of Pelé, Coutinho, Pepe, Zito and Gilmar won the Copa Libertadores and became club world champions: lots of people say it was the greatest team of all time! And in 1970, in Mexico, Pelé won his third World Cup: he’s the only player to be a three-time world champion.',
      req: { flag: 'venceu_est_santos', desc: 'Beat the 1962 Santos at Vila Belmiro' }, rec: { xp: Math.round(xpN(L) * 4), ouro: L * 500, flag: 'bencao_rei', itens: [['estatueta_rei', 1]] },
      fim: 'After the final whistle, the King took off his crown, smiled and said: "You play with joy, like a kid from the village. Now go to Rio and bring the Cup home!"' },
  );
  // a final da Copa (Rio) vem DEPOIS da Vila Belmiro
  const copa = MISSOES.find(q => q.id === 'rio_m5');
  if (copa) { copa.pre = 'santos_rei5'; copa.texto = 'The King gave you his blessing at Vila Belmiro. The time has come: the WORLD CUP ARENA has opened its doors here in Rio, and THE CUP LEGEND is waiting for you on the field. Win the final and bring the trophy home!'; }
}
// a guia fica na frente do Museu Pelé (o museu é posto no mapa pelos monumentos)
{
  const base = MAPAS_DEF.santos;
  if (base) MAPAS_DEF.santos = function () {
    const m = base();
    try {
      const livre = (x, y) => x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1 && !m.obj[y * m.w + x] && CH_ANDA(m.chao[y * m.w + x])
        && !m.npcs.some(n => n.x === x && n.y === y) && !m.saidas.some(s => s.x === x && s.y === y) && !m.placas.some(p => p.x === x && p.y === y);
      const p = m.predios.find(q => q.spr === 'mon_museu_pele'); let pos = null;
      if (p) for (let dy = 0; dy < 3 && !pos; dy++) for (let dx = p.w - 1; dx >= 0 && !pos; dx--) { const x = p.x + dx, y = p.y + p.h + dy; if (livre(x, y)) pos = { x, y }; }
      if (!pos) for (let r = 0; r < 8 && !pos; r++) for (let dx = -r; dx <= r && !pos; dx++) if (livre(10 + dx, 22)) pos = { x: 10 + dx, y: 22 };
      if (pos) m.npcs.push({ id: 'guia_rei', x: pos.x, y: pos.y });
      // a praça da estátua do Rei com o mosaico da orla (não a pedra cinza das outras praças)
      const e = m.predios.find(q => q.spr === 'mon_pele');
      if (e && CH.CALCADA_SANTOS != null) for (let y = e.y - 1; y <= e.y + e.h + 1; y++) for (let x = e.x - 2; x <= e.x + e.w + 1; x++) { const k = y * m.w + x; if (m.chao[k] === CH.PEDRA) m.chao[k] = CH.CALCADA_SANTOS; }
    } catch (e) { console.error('museum guide', e); }
    return m;
  };
}

/* ---------- capítulo: O Rei do Futebol ---------- */
if (typeof CAPITULOS !== 'undefined') {
  CAPITULOS.rei = {
    rotulo: 'Chapter 5', titulo: 'The King of Soccer', emoji: '👑', implica: ['mundo', 'europa'],
    cond: (s, mapa) => mapa === 'santos',
    cenas: [
      { img: 'cap_rei_1', kb: 'kb-a', cor: ['#f7b35a', '#c8623e'],
        txt: n => 'Long before you were born, a boy from Bauru played ball in the street with a ball made of old socks. His name was Edson... but the whole world would come to know him as PELÉ.' },
      { img: 'cap_rei_2', kb: 'kb-b', cor: ['#3a2a5a', '#f0a040'],
        txt: n => 'In 1950, Brazil lost the World Cup at the Maracanã, and his dad cried next to the radio. The boy hugged him and promised: “One day I’m going to win a World Cup for you!”' },
      { img: 'cap_rei_3', kb: 'kb-c', cor: ['#f8d838', '#1a9a3a'], som: 'gol',
        txt: n => 'Eight years later, in Sweden, that boy was 17. He scored in the final, cried with joy and lifted the trophy. Promise kept! Then came 1962 and 1970: three World Cups.' },
      { img: 'cap_rei_4', kb: 'kb-e', cor: ['#f4f4f8', '#1a1a1a'],
        txt: n => 'At Santos, alongside Coutinho, he invented magical one-twos, scored more than a thousand goals and earned a nickname nobody else has ever earned: the KING OF SOCCER.' },
      { img: 'cap_rei_5', kb: 'kb-zoom', foco: '62% 35%', cor: ['#f7b35a', '#7a4aff'],
        txt: n => `Today a golden statue with a crown honors the King here on the Santos seafront. And they say that, at Vila Belmiro, the 1962 Squad is still waiting for a star with a joyful heart. Could it be ${_hn(n)}?` },
    ],
    final: { emoji: '👑', titulo: 'The King of Soccer', sub: n => 'End of Chapter 5. Visit the Pelé Museum, follow in the King’s footsteps and challenge the 1962 Squad at Vila Belmiro!', botao: 'Continue ⚽' },
  };
  const i = CAPITULOS_ORDEM.indexOf('europa'); if (i >= 0 && !CAPITULOS_ORDEM.includes('rei')) CAPITULOS_ORDEM.splice(i + 1, 0, 'rei');
  // os capítulos seguintes andam uma casa
  const num = { retorno: 6, copa: 7, atlantida: 8, espaco: 9, galaxia: 10 };
  for (const [id, k] of Object.entries(num)) if (CAPITULOS[id]) { CAPITULOS[id].rotulo = 'Chapter ' + k; if (CAPITULOS[id].final && typeof CAPITULOS[id].final.sub === 'function') { const f = CAPITULOS[id].final.sub; CAPITULOS[id].final.sub = n => String(f(n)).replace(/(?:Capítulo|Chapter) \d+/, 'Chapter ' + k); /* v244: também 'Capítulo N começou!' */ } }
  // "Rumo à Copa": depois da bênção do Rei, de volta ao Rio (ou direto na Arena da Copa)
  if (CAPITULOS.retorno) { CAPITULOS.retorno.cond = (s, mapa) => CAP_MAPAS_FINAL.includes(mapa) || (mapa === 'rio' && !!s.flags.bencao_rei); CAPITULOS.retorno.implica = ['mundo', 'europa', 'rei']; }
  for (const id of ['copa', 'atlantida', 'espaco', 'galaxia']) if (CAPITULOS[id] && Array.isArray(CAPITULOS[id].implica) && !CAPITULOS[id].implica.includes('rei')) CAPITULOS[id].implica.push('rei');
}

/* ---------- os Turistas Sem Protetor (v407 Raio-X U3; praia, gol caixote): dois jeitos misturados na areia ---------- */
{
  const META_TUR = {"turista_a":[{"cabeca":[37,48,161,147],"tronco":[82,147,118,208]},{"cabeca":[37,48,161,147],"tronco":[82,147,118,208]},{"cabeca":[42,48,165,147],"tronco":[82,147,118,208]},{"cabeca":[39,48,163,147],"tronco":[82,147,118,208]},{"cabeca":[44,61,161,154],"tronco":[82,154,118,212]},{"cabeca":[42,61,159,154],"tronco":[82,154,118,212]},{"cabeca":[43,61,160,154],"tronco":[82,154,118,212]},{"cabeca":[44,60,161,154],"tronco":[82,154,118,212]},{"cabeca":[39,54,161,150],"tronco":[82,150,118,210]},{"cabeca":[41,54,163,150],"tronco":[82,150,118,210]},{"cabeca":[39,54,161,150],"tronco":[82,150,118,210]},{"cabeca":[42,54,164,150],"tronco":[82,150,118,210]}],"turista_b":[{"cabeca":[32,48,169,147],"tronco":[82,147,118,208]},{"cabeca":[32,46,168,145],"tronco":[82,145,118,207]},{"cabeca":[35,46,171,145],"tronco":[82,145,118,207]},{"cabeca":[34,48,170,147],"tronco":[82,147,118,208]},{"cabeca":[45,55,166,151],"tronco":[82,151,118,210]},{"cabeca":[46,55,166,151],"tronco":[82,151,118,210]},{"cabeca":[46,55,167,151],"tronco":[82,151,118,210]},{"cabeca":[47,55,167,151],"tronco":[82,151,118,210]},{"cabeca":[37,48,163,147],"tronco":[82,147,118,208]},{"cabeca":[39,48,165,147],"tronco":[82,147,118,208]},{"cabeca":[36,48,162,147],"tronco":[82,147,118,208]},{"cabeca":[38,48,164,147],"tronco":[82,147,118,208]}]};
  Object.assign(META_BONECOS, META_TUR); for (const f in META_TUR) CORPOS_MODO[f] = 'fixo';
  if (typeof carregaFolhas === 'function') carregaFolhas();
  const d = MONSTROS.santos_turista;
  if (d) { d.look = Object.assign({}, d.look, { folha: 'turista_a', corpo: 'm', grande: false }); delete d.look._kb; }
  const _lookTur = lookDoMonstro;
  lookDoMonstro = function (m, mapa) {
    if (!m || m.tipo !== 'santos_turista' || !m.d || !m.d.look) return _lookTur.apply(this, arguments);
    const L = Object.assign({}, m.d.look, { folha: (m.uid || 0) % 2 ? 'turista_b' : 'turista_a' }); delete L._kb; return L;
  };
}
