/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚽ CARREIRA COM JOGOS DE VERDADE (v284)
   Antes o clube da carreira nunca jogava: era só contrato, metas e reunião.
   Agora (e bem diferente do MEU TIME, onde você é o dono/técnico e ASSISTE):
   - TEMPORADA: liga de 8 clubes (os da divisão do seu clube + clubes do país), 7 rodadas,
     UMA RODADA POR DIA DE JOGO; tabela, artilharia, campeão, pódio e rebaixamento de humor;
   - DIA DE JOGO: o técnico escala você como TITULAR (4 lances) ou RESERVA (entra no 2º tempo, 2 lances)
     pela sua fase (média das últimas notas) e pelo humor do dirigente;
   - LANCES AO VIVO no gramado do estádio, com a torcida do país: você joga de verdade —
     ATAQUE (passe pelos marcadores e vença o goleiro), PASSE (tire os marcadores e deixe o companheiro
     na cara do gol), DEFESA (desarme os atacantes do rival antes que finalizem) e PÊNALTI;
     o resto da partida corre no relógio, com gols dos seus companheiros e do rival;
   - no fim: NOTA de 0 a 10, gols, assistências, CRAQUE DO JOGO, bicho (prêmio por vitória), fama,
     torcida e dirigente; fim da temporada: TAÇA de campeão, chuteira de ouro do artilheiro, pódio;
   - METAS da liga (gols, nota, vitórias, jogos) no lugar das "partidas do Meu Time"
     (as vitórias do Meu Time não contam mais para o clube da carreira).
   Faltou ao jogo (o dia virou)? O time joga sem você: o dirigente não gosta.
   Carregar DEPOIS de carreira.js e carreira_metas.js.
   ============================================================ */
const CJ_TIMES = 8, CJ_RODADAS = 7, CJ_MAPA = 'jogo_carr';
const CJ_W = 40, CJ_H = 26, CJ_CY = 13; // campo: x 5..34, y 5..20; gol nosso em x=5, gol deles em x=34
// ---------- nomes ----------
const CJ_NOMES = {
  brasil: { pre: ['Esporte Clube', 'Atlético', 'União', 'Grêmio', 'Sociedade Esportiva', 'Associação'], lug: ['Ipê Amarelo', 'Cajueiro', 'Serra Azul', 'Beira-Rio', 'Pinheiral', 'Vale Verde', 'Jequitibá', 'Canarinho', 'Rio Claro', 'Três Coqueiros'], jog: ['Juninho', 'Rafinha', 'Tico', 'Dedé', 'Nenê', 'Carlinhos', 'Guto', 'Léo', 'Binho', 'Mimi', 'Zezinho', 'Toninho'] },
  egito: { pre: ['Al', 'Nadi'], lug: ['Delta', 'Blue Nile', 'Luxor', 'Aswan', 'Oasis', 'Pharaohs', 'Alexandria', 'Giza', 'Sinai', 'Karnak'], jog: ['Omar', 'Karim', 'Hassan', 'Tarek', 'Amr', 'Youssef', 'Ziad', 'Mostafa'] },
  catar: { pre: ['Al', 'Nadi'], lug: ['Wakra', 'Dunes', 'Pearl', 'Corniche', 'Falcons', 'Lusail', 'Khor', 'Sands', 'Blue Oasis', 'Souq'], jog: ['Khalid', 'Faisal', 'Nasser', 'Hamad', 'Saad', 'Rashid', 'Tamim', 'Yasser'] },
  japao: { suf: ['FC', 'SC', 'United'], lug: ['Sakura', 'Kaze', 'Hikari', 'Yama', 'Umi', 'Tora', 'Ryu', 'Kumo', 'Hoshi', 'Sora'], jog: ['Haruto', 'Sora', 'Ren', 'Kaito', 'Yuto', 'Riku', 'Daiki', 'Shota'] },
  eua: { suf: ['United', 'FC', 'Stars', 'City'], lug: ['Bay', 'Sunshine', 'Canyon', 'Lakeside', 'Redwood', 'Harbor', 'Liberty', 'Prairie', 'Coastal', 'Summit'], jog: ['Jake', 'Tyler', 'Mason', 'Logan', 'Ethan', 'Carter', 'Owen', 'Wyatt'] },
  argentina: { pre: ['Club Atlético', 'Deportivo', 'Sportivo'], lug: ['Pampa', 'Río Dorado', 'Los Andes', 'Tango', 'Barrio Sur', 'Estrella', 'Ombú', 'Patagonia', 'Mendoza', 'Rosales'], jog: ['Nacho', 'Facu', 'Pipa', 'Toto', 'Lucho', 'Maxi', 'Chino', 'Pato'] },
  portugal: { pre: ['Sporting', 'Clube', 'Académico', 'Desportivo'], lug: ['Algarve', 'Douro', 'Minho', 'Ribeira', 'Alfama', 'Tejo', 'Serra', 'Atlântico', 'Belém', 'Mondego'], jog: ['Tiago', 'Duarte', 'Rui', 'Nuno', 'Vasco', 'Gonçalo', 'Afonso', 'Diogo'] },
  franca: { pre: ['FC', 'Olympique', 'Racing', 'AS'], lug: ['Provence', 'Loire', 'Bretagne', 'Alsace', 'Normandie', 'Riviera', 'Lumière', 'Bordeaux', 'Seine', 'Alpes'], jog: ['Hugo', 'Théo', 'Lucas', 'Mathis', 'Enzo', 'Jules', 'Louis', 'Nathan'] },
  alemanha: { pre: ['SV', 'FC', 'VfB', 'TSV'], lug: ['Waldberg', 'Rheintal', 'Nordhafen', 'Sonnental', 'Eichenfeld', 'Bergstadt', 'Seeburg', 'Falkenau', 'Lindenhof', 'Brückstadt'], jog: ['Lukas', 'Jonas', 'Felix', 'Leon', 'Finn', 'Paul', 'Noah', 'Emil'] },
  italia: { pre: ['AC', 'US', 'Sporting', 'Unione'], lug: ['Toscana', 'Laguna', 'Vesuvio', 'Dolomiti', 'Sicilia', 'Arno', 'Colosseo', 'Portofino', 'Garda', 'Verona Nord'], jog: ['Luca', 'Matteo', 'Davide', 'Marco', 'Pietro', 'Andrea', 'Simone', 'Filippo'] },
  espanha: { pre: ['CD', 'Real', 'Atlético', 'UD'], lug: ['Sierra', 'Costa Brava', 'Alhambra', 'Galicia', 'Toledo', 'Rioja', 'Mallorca', 'Castilla', 'Andaluz', 'Navarra'], jog: ['Pablo', 'Álvaro', 'Iker', 'Sergio', 'Dani', 'Rodrigo', 'Marcos', 'Adrián'] },
  inglaterra: { suf: ['Rovers', 'Athletic', 'Town', 'Wanderers', 'City'], lug: ['Ashford', 'Kingsbridge', 'Riverside', 'Oakwood', 'Brighton Vale', 'Westfield', 'Northgate', 'Hillcrest', 'Lionsbury', 'Thornbury'], jog: ['Harry', 'Jack', 'Oliver', 'George', 'Alfie', 'Charlie', 'Freddie', 'Archie'] },
};
const CJ_CORES = [['#d0202a', '#ffffff'], ['#1a3ab9', '#ffffff'], ['#2a8a3a', '#ffd23f'], ['#1a1a1a', '#ffffff'], ['#f0c020', '#1a3ab9'], ['#7a2a9a', '#ffffff'], ['#e86a1a', '#1a1a1a'], ['#12a0a8', '#ffffff'], ['#8a1a2a', '#e8c048'], ['#3aa0e8', '#ffffff'], ['#2a4a2a', '#e8e8e8'], ['#c02a6a', '#ffe0f0']];
const CJ_ESTILOS = ['listras', 'faixa', 'metade', 'horizontal'];
// ---------- utilidades ----------
function cjRng(seed) { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function cjPoisson(l, r = Math.random) { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= r(); } while (p > L && k < 12); return k - 1; }
function cjSigla(nome) { const p = nome.replace(/^(Esporte Clube|Sociedade Esportiva|Club Atlético|Associação|Atlético|União|Grêmio|Al|Nadi|Deportivo|Sportivo|Sporting|Clube|Académico|Desportivo|FC|Olympique|Racing|AS|SV|VfB|TSV|AC|US|Unione|CD|Real|UD)\s+/, '').split(/\s+/); return (p.length > 1 ? p.map(w => w[0]).join('') : p[0].slice(0, 3)).toUpperCase().slice(0, 3); }
function cjTemp() { const c = G.save && G.save.carreira; return c && c.temporada; }
function cjDia() { return (G.save && G.save.dia) || 1; }
function cjEu() { const t = cjTemp(); return t && t.times[0]; }
function cjPosicao() { const s = G.save; const p = s.posicao || (typeof posicaoDaClasse === 'function' ? posicaoDaClasse(s.classe) : 'meia'); return p === 'zagueiro' || p === 'atacante' ? p : 'meia'; }

/* ============================================================ TEMPORADA ============================================================ */
function cjNovaTemporada(k) {
  const c = carrDados(), def = carrClube(k.id); if (!def) return null;
  const s = G.save, dia = cjDia(), seed = hashTxt(k.id + ':' + dia + ':' + (s.criado || 1)), r = cjRng(seed);
  const pais = def.pais, P = CJ_NOMES[pais] || CJ_NOMES.brasil;
  const times = [{ id: def.id, nome: def.nome, sigla: def.sigla, cor1: def.cor1, cor2: def.cor2, estilo: def.estilo, f: 1.0, eu: true }];
  // os outros clubes da mesma divisão (e do mesmo país)
  for (const o of CARREIRA_CLUBES) if (o.id !== def.id && o.tier === def.tier && o.pais === pais && times.length < CJ_TIMES) times.push({ id: o.id, nome: o.nome, sigla: o.sigla, cor1: o.cor1, cor2: o.cor2, estilo: o.estilo, f: 0.9 + r() * 0.25 });
  // completa com clubes do país
  const usados = new Set(times.map(t => t.nome)); let tent = 0;
  while (times.length < CJ_TIMES && tent++ < 200) {
    const lug = P.lug[(r() * P.lug.length) | 0];
    const nome = P.suf ? `${lug} ${P.suf[(r() * P.suf.length) | 0]}` : `${P.pre[(r() * P.pre.length) | 0]} ${lug}`;
    if (usados.has(nome) || [...usados].some(n => n.includes(lug))) continue; usados.add(nome);
    const cor = CJ_CORES[(r() * CJ_CORES.length) | 0];
    times.push({ id: 'cj' + times.length, nome, sigla: cjSigla(nome), cor1: cor[0], cor2: cor[1], estilo: CJ_ESTILOS[(r() * 4) | 0], f: 0.82 + r() * 0.34 });
  }
  times.forEach((t, i) => Object.assign(t, { tier: def.tier, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, craque: { nome: P.jog[(r() * P.jog.length) | 0] + (i ? '' : ''), g: 0 } }));
  times[0].craque.nome = P.jog[(seed >>> 3) % P.jog.length]; // o companheiro artilheiro do seu time
  // tabela de jogos: todos contra todos (método do círculo), mando alternado
  const ids = times.map((_, i) => i), rodadas = [];
  for (let rd = 0; rd < CJ_TIMES - 1; rd++) {
    const jogos = [];
    for (let i = 0; i < CJ_TIMES / 2; i++) { const a = ids[i], b = ids[CJ_TIMES - 1 - i]; jogos.push((rd + i) % 2 ? [b, a] : [a, b]); }
    rodadas.push(jogos); ids.splice(1, 0, ids.pop());
  }
  const dia0 = (s.hora || 0) < 18 * 60 ? dia : dia + 1; // assinou tarde da noite: a estreia é amanhã
  const t = { v: 1, clubeId: def.id, liga: CARR_TIERS[def.tier].liga, tier: def.tier, pais, times, rodadas, rodada: 0, dia0, eu: { J: 0, G: 0, A: 0, notas: [], titular: 0 }, resultados: [], ano: (c.temporadasJogadas || 0) + 1 };
  c.temporada = t;
  carrHist(`${t.liga} kicks off! ${def.nome} plays its first game ${dia0 === dia ? 'hoje' : 'tomorrow'} against ${cjAdversario(t, 0).nome}. ${CJ_RODADAS} rounds, one per day.`);
  carrLog(`⚽ The ${t.liga} season has started! ${CJ_RODADAS} rounds, ONE PER GAME DAY. ${dia0 === dia ? 'Game day today: press U (Career) → Play the round.' : 'The first game is tomorrow.'}`, 'l-lvl');
  return t;
}
function cjJogoDaRodada(t, rd) { return t.rodadas[rd].find(j => j[0] === 0 || j[1] === 0); }
function cjAdversario(t, rd) { const j = cjJogoDaRodada(t, rd); return t.times[j[0] === 0 ? j[1] : j[0]]; }
function cjEmCasa(t, rd) { return cjJogoDaRodada(t, rd)[0] === 0; }
function cjTabela(t) { return t.times.map((x, i) => Object.assign({ i }, x, { P: x.V * 3 + x.E, SG: x.GP - x.GC })).sort((a, b) => b.P - a.P || b.V - a.V || b.SG - a.SG || b.GP - a.GP || a.nome.localeCompare(b.nome)); }
function cjPos(t, i) { return cjTabela(t).findIndex(x => x.i === i) + 1; }
function cjRegistra(t, a, b, ga, gb, semVoce) {
  const A = t.times[a], B = t.times[b];
  A.J++; B.J++; A.GP += ga; A.GC += gb; B.GP += gb; B.GC += ga;
  if (ga > gb) { A.V++; B.D++; } else if (ga < gb) { B.V++; A.D++; } else { A.E++; B.E++; }
  // o craque de cada time fica com parte dos gols (artilharia)
  for (const [T, g, i] of [[A, ga, a], [B, gb, b]]) if (i !== 0 || semVoce) for (let k = 0; k < g; k++) if (Math.random() < 0.45) T.craque.g++; // os gols do seu time no jogo com você já foram contados lance a lance
}
// simula os outros jogos da rodada
function cjSimulaOutros(t, rd) {
  const lista = [];
  for (const [a, b] of t.rodadas[rd]) {
    if (a === 0 || b === 0) continue;
    const A = t.times[a], B = t.times[b];
    const ga = cjPoisson(1.25 * A.f / B.f * 1.08), gb = cjPoisson(1.25 * B.f / A.f * 0.94);
    cjRegistra(t, a, b, ga, gb); lista.push({ a, b, ga, gb });
  }
  return lista;
}
// o dia virou e a rodada passou sem você jogar: o time joga desfalcado
function cjRodadaSemVoce(t, rd) {
  const j = cjJogoDaRodada(t, rd), eu = j[0] === 0, adv = t.times[eu ? j[1] : j[0]], nos = t.times[0];
  const gn = cjPoisson(1.15 * nos.f * 0.9 / adv.f), ga = cjPoisson(1.25 * adv.f / (nos.f * 0.9));
  if (eu) cjRegistra(t, 0, j[1], gn, ga, true); else cjRegistra(t, j[0], 0, ga, gn, true);
  const outros = cjSimulaOutros(t, rd);
  t.resultados.push({ rd, eu: true, faltou: true, casa: eu, adv: t.times.indexOf(adv), gn, ga, outros });
  const ef = carrAplica({ dir: -4, tor: -2 });
  carrLog(`😬 You didn't show up for the Round ${rd + 1} game! ${nos.nome} played without you: ${nos.sigla} ${gn} × ${ga} ${adv.sigla}. President ${ef.dir || 0}, fans ${ef.tor || 0}.`, 'l-dano');
  carrHist(`${nos.nome} ${gn} × ${ga} ${adv.nome} (Round ${rd + 1}) — ${carrNome()} didn't play.`);
  t.rodada = rd + 1;
}
function cjFimTemporada(t) {
  const c = carrDados(), tab = cjTabela(t), pos = tab.findIndex(x => x.i === 0) + 1, k = c.clube, sal = k ? k.salario : 300;
  const lider = t.times.map((x, i) => ({ nome: x.craque.nome, time: x.nome, g: x.craque.g, i })).sort((a, b) => b.g - a.g)[0];
  const artilheiro = t.eu.G > 0 && t.eu.G >= (lider ? lider.g : 0);
  c.temporadasJogadas = (c.temporadasJogadas || 0) + 1;
  c.titulosLiga = c.titulosLiga || [];
  let titulo = '', ef = {};
  if (pos === 1) {
    titulo = `🏆 ${t.liga.toUpperCase()} CHAMPIONS!`; c.titulosLiga.push({ liga: t.liga, clube: t.times[0].nome, dia: cjDia() });
    ef = carrAplica({ fama: 50 + t.tier * 5, dir: 15, tor: 15, emp: 6, ouro: sal * 6 });
    recebeItem('taca_liga', 1);
    carrBanner(`CHAMPIONS!`, `${t.times[0].nome} wins the ${t.liga}!`); carrSom('nivel');
    carrHist(`CHAMPIONS! ${carrNome()}'s ${t.times[0].nome} wins the ${t.liga}!`);
  } else if (pos <= 3) {
    titulo = `🥈 #${pos} in the ${t.liga}`; ef = carrAplica({ fama: 20 + t.tier * 2, dir: 6, tor: 6, ouro: sal * 2 });
    if (pos === 2) recebeItem('prata_liga', 1);
    carrHist(`${t.times[0].nome} finishes the ${t.liga} in #${pos} place.`);
  } else if (pos >= CJ_TIMES - 1) {
    titulo = `😟 #${pos} place: a rough season`; ef = carrAplica({ dir: -8, tor: -6 });
    carrHist(`A season to forget: ${t.times[0].nome} finishes #${pos} in the ${t.liga}.`);
  } else { titulo = `#${pos} in the ${t.liga}`; ef = carrAplica({ fama: 6, dir: 1 }); carrHist(`${t.times[0].nome} finishes the ${t.liga} at #${pos}.`); }
  if (artilheiro) { const e2 = carrAplica({ fama: 20 }); ef.fama = (ef.fama || 0) + (e2.fama || 0); recebeItem('chuteira_artilheiro', 1); carrHist(`${carrNome()} is the ${t.liga} TOP SCORER with ${t.eu.G} goals!`); }
  const media = t.eu.notas.length ? t.eu.notas.reduce((a, b) => a + b, 0) / t.eu.notas.length : 0;
  t.fim = { pos, titulo, artilheiro, lider, media: Math.round(media * 10) / 10, ef };
  c.ultimaTemporada = { liga: t.liga, clube: t.times[0].nome, pos, G: t.eu.G, A: t.eu.A, media: t.fim.media, artilheiro };
  carrLog(`${titulo} You: ${t.eu.J} games, ${t.eu.G} goals, ${t.eu.A} assists, average rating ${t.fim.media.toFixed(1)}.${artilheiro ? ' 👟 LEAGUE TOP SCORER!' : ''}`, pos === 1 ? 'l-lendario' : 'l-lvl');
  c.temporada = null; c.proximaTemporadaDia = cjDia() + 1;
  carrSujo(); carrSalvar();
  setTimeout(() => cjTelaFimTemporada(c.ultimaTemporada, titulo, ef, t), 400);
}
// chamado a cada segundo (junto com a carreira)
function cjChecaTemporada() {
  const s = G.save; if (!s || !s.carreira || !s.carreira.ativa) return;
  const c = carrDados(), k = c.clube, d = cjDia();
  if (!k) return;
  let t = c.temporada;
  if (G.jogoC) return; // no meio do jogo não mexe
  if (!t || t.clubeId !== k.id) {
    if (c.proximaTemporadaDia && d < c.proximaTemporadaDia && (!t || t.clubeId === k.id)) return; // folga entre as temporadas
    t = cjNovaTemporada(k); carrSujo(); carrSalvar(); return;
  }
  // rodadas que passaram sem você
  while (t.rodada < CJ_RODADAS && d - t.dia0 > t.rodada && d >= t.dia0) cjRodadaSemVoce(t, t.rodada);
  if (t.rodada >= CJ_RODADAS) { cjFimTemporada(t); return; }
  // hoje tem jogo: avisa uma vez
  if (d - t.dia0 === t.rodada && t.avisou !== d) {
    t.avisou = d; const adv = cjAdversario(t, t.rodada);
    carrBanner('⚽ Game day!', `Round ${t.rodada + 1}: ${cjEmCasa(t, t.rodada) ? t.times[0].nome + ' × ' + adv.nome : adv.nome + ' × ' + t.times[0].nome} — press U`);
    carrLog(`⚽ There's a ${t.liga} game today (Round ${t.rodada + 1}) against ${adv.nome}! Press U → "Play the round". If the day ends, the team plays without you.`, 'l-xp'); carrSom('apito');
  }
}
function cjHojeTemJogo() { const t = cjTemp(); return !!(t && G.save.carreira.clube && t.clubeId === G.save.carreira.clube.id && t.rodada < CJ_RODADAS && cjDia() - t.dia0 === t.rodada && !G.jogoC); }
// titular ou reserva? a fase (média das 3 últimas notas) e o humor do dirigente
function cjTitular(t) {
  const c = carrDados(); const ult = t.eu.notas.slice(-3); const forma = ult.length ? ult.reduce((a, b) => a + b, 0) / ult.length : 6.5;
  return { titular: forma >= 5.8 || c.satDir >= 50, forma: Math.round(forma * 10) / 10 };
}

/* ============================================================ O CAMPO (mapa do jogo) ============================================================ */
function criaCampoCarreira() {
  const W = CJ_W, H = CJ_H;
  const b = new Construtor(CJ_MAPA, 'Stadium — League Game', W, H, CH.CONCRETO, 911);
  bordaInvisivel(b);
  // a torcida lotando as arquibancadas (cada bloco ocupa 2 quadros)
  const torc = ['torcida1', 'torcida2', 'torcida3', 'torcida4'];
  const bloco = (x, y, k) => { b.obj(x, y, torc[k % 4]); b.obj(x + 1, y, 'x'); };
  for (let x = 2; x < W - 2; x++) b.obj(x, 1, 'x');
  for (let x = 2, k = 0; x < W - 3; x += 2, k++) bloco(x, 2, k);
  for (let y = 3; y < H - 2; y++) { b.obj(1, y, 'arquibancada'); b.obj(W - 2, y, 'arquibancada'); }
  for (let x = 2, k = 1; x < W - 3; x += 2, k++) if (x + 1 < 17 || x > 23) bloco(x, H - 2, k);
  b.ret(3, 3, W - 6, H - 6, CH.PISTA);
  b.campo(5, 5, 30, 17, CH.CAMPO);
  for (const [x, y] of [[3, 3], [W - 4, 3], [3, H - 4], [W - 4, H - 4]]) b.obj(x, y, 'holofote');
  objLargo(b, 20, 3, 'placar', 3); b.obj(10, 3, 'bandeirao'); b.obj(W - 11, 3, 'bandeirao');
  b.obj(12, H - 4, 'banco_reservas'); b.obj(W - 13, H - 4, 'banco_reservas');
  b.m.inicio = { x: 20, y: H - 4 }; b.m.renasce = { x: 20, y: H - 4 };
  b.m.estadio = 'est_santos'; // torcida (troca pelo país do clube na hora do jogo)
  return b.m;
}
MAPAS_DEF[CJ_MAPA] = criaCampoCarreira;

/* ============================================================ OS LANCES ============================================================ */
const CJ_LANCES = {
  ataque: { nome: 'COUNTERATTACK', txt: 'Run with the ball, pass to a teammate and SHOOT at the goal!', emoji: '⚽' },
  passe: { nome: 'TEAM PLAY', txt: 'Set up the play: dribble, pass and shoot!', emoji: '🎯' },
  defesa: { nome: 'THEIR ATTACK', txt: 'TACKLE the player with the ball before they shoot!', emoji: '🛡️' },
  penalti: { nome: 'PENALTY!', txt: 'Pick a corner: ⬆ high · ⚽ middle · ⬇ low', emoji: '🎯' },
};
function cjSorteiaLances(titular, tier) {
  const pos = cjPosicao(), n = titular ? 4 : 2;
  const pool = pos === 'atacante' ? ['ataque', 'ataque', 'ataque', 'passe', 'defesa'] : pos === 'zagueiro' ? ['defesa', 'defesa', 'defesa', 'ataque', 'passe'] : ['passe', 'passe', 'ataque', 'ataque', 'defesa'];
  const l = []; for (let i = 0; i < n; i++) l.push(pool[(Math.random() * pool.length) | 0]);
  if (!l.includes(pos === 'zagueiro' ? 'defesa' : 'ataque')) l[0] = pos === 'zagueiro' ? 'defesa' : 'ataque';
  if (Math.random() < (pos === 'atacante' ? 0.3 : 0.15)) l[l.length - 1] = 'penalti';
  const ini = titular ? 8 : 58, fim = 88, passo = (fim - ini) / n;
  return l.map((tipo, i) => ({ tipo, min: Math.round(ini + passo * i + Math.random() * passo * 0.7) }));
}
// o lance é jogado no motor de futebol (carreira_futebol.js)
function cjComecaLance(L) {
  const J = G.jogoC;
  J.lance = L; J.fase = 'lance';
  futComeca(L); J.fimLance = G.fut ? G.fut.fim : G.agora + 25000;
  const info = CJ_LANCES[L.tipo];
  banner(`${info.emoji} ${info.nome} — ${L.min}'`, info.txt); som('apito');
}
// resultado do lance: res = { ok, gol: 'eu' | 'comp' | 'contra' | null, assist, motivo }
function cjFimLanceFut(res) {
  const J = G.jogoC, L = J && J.lance; if (!L) return;
  J.lance = null; J.fase = 'pos'; J.proxFase = G.agora + 2000;
  const eu = J.t.times[0].sigla, adv = J.adv.sigla, nome = carrNome(), comp = J.t.times[0].craque.nome;
  L.ok = res.ok;
  const placar = () => `${eu} ${J.gn} × ${J.ga} ${adv}`;
  if (res.gol === 'eu') { J.gn++; J.meusG++; J.nota += L.tipo === 'penalti' ? 1.0 : 1.3; banner('⚽ GOOOOAL!', `${nome} scores at ${L.min}'! ${placar()}`); som('gol'); efeito('nivel', G.p.x, G.p.y); J.feed.push(`${L.min}' ⚽ GOAL by ${nome}!`); }
  else if (res.gol === 'comp') { J.gn++; J.t.times[0].craque.g++; if (res.assist) { J.meusA++; J.nota += 0.8; } else J.nota += 0.3; banner('⚽ GOAL!', `${comp} at ${L.min}'${res.assist ? ' — your assist!' : ''} ${placar()}`); som('gol'); J.feed.push(`${L.min}' ⚽ GOAL by ${comp}${res.assist ? ` (assist by ${nome})` : ''}`); }
  else if (res.gol === 'contra') { J.ga++; J.nota -= 0.6; banner(`${J.adv.nome} scores...`, placar()); som('erro'); J.feed.push(`${L.min}' 😣 Goal by ${J.adv.nome}`); }
  else if (L.tipo === 'defesa') { J.nota += 0.8; banner('🛡️ BALL WON BACK!', res.motivo === 'tempo' ? 'They couldn\'t get a shot off!' : 'What a stop! The crowd gives a standing ovation.'); som('toque'); J.feed.push(`${L.min}' 🛡️ Great defending by ${nome}`); }
  else {
    J.nota -= 0.35;
    const txt = { defesa: 'The goalie saved it!', goleiro: 'The goalie got the ball.', perdeu: 'Lost the ball!', fora: 'Off target!', tempo: 'The defense shut it down.' }[res.motivo] || 'No luck!';
    banner(txt, 'You\'ll get it next time!'); som('erro'); J.feed.push(`${L.min}' ❌ ${L.tipo === 'penalti' ? 'Penalty missed' : txt}`);
  }
  const st = stats(); G.save.hp = st.maxHp;
  cjPlacar();
}

/* ============================================================ A PARTIDA ============================================================ */
function cjPreJogo() {
  const c = carrDados(), t = cjTemp(); if (!cjHojeTemJogo()) return abrirCarreira();
  const rd = t.rodada, adv = cjAdversario(t, rd), casa = cjEmCasa(t, rd), nos = t.times[0];
  const tt = cjTitular(t), pos = POSICOES[cjPosicao()];
  const esc = (x, lado) => el('div', { class: 'cj-lado' }, carrEscudo(x, 64), el('b', {}, x.nome), el('small', {}, `#${cjPos(t, t.times.indexOf(x))} · ${x.V * 3 + x.E} pts`), lado ? el('small', { class: 'cj-mando' }, lado) : null);
  const lances = tt.titular ? 4 : 2;
  const L = G.save.nivel;
  abreModal.largo = true;
  abreModal(el('h2', {}, `⚽ ${t.liga} — Round ${rd + 1}`),
    el('div', { class: 'cj-confronto' }, esc(casa ? nos : adv, 'mandante'), el('div', { class: 'cj-x' }, '×'), esc(casa ? adv : nos, 'visitante')),
    el('div', { class: 'cj-esc ' + (tt.titular ? 'tit' : 'res') }, tt.titular ? `✅ The coach picked you as a STARTER (${pos.nome})! You'll get ${lances} plays.` : `🪑 You start on the BENCH (form: rating ${tt.forma.toFixed(1)}). You come in for the 2nd half: ${lances} plays. Play well to get back in the starting lineup!`),
    el('ul', { class: 'ar-regras' },
      el('li', {}, '🎮 In your PLAYS you play real soccer: the ball stays at your feet wherever you go.'),
      el('li', {}, '⚽ SHOOT: Space or X  ·  🎯 PASS: C or E (without the ball = call for it)  ·  🌀 DRIBBLE: F (the feint knocks down the defender).'),
      el('li', {}, '🛡️ In THEIR ATTACK, shooting turns into 🦶 TACKLE: get close to the player with the ball and go for it.'),
      el('li', {}, '🎯 PENALTY: pick a corner (⬆ high, ⚽ middle, ⬇ low) and hope the goalie guesses wrong.'),
      el('li', {}, '📱 On mobile: use the joystick to run and the big buttons to shoot, pass and dribble.'),
      el('li', {}, `🏅 At the end: a rating from 0 to 10. Win = a bonus of ${carrFmt(Math.round(carrLiquido(c.clube.salario) * 0.8))} coins.`)),
    el('p', { class: 'dica' }, `Your season: ${t.eu.J} games · ${t.eu.G} goals · ${t.eu.A} assists${t.eu.notas.length ? ` · average rating ${(t.eu.notas.reduce((a, b) => a + b, 0) / t.eu.notas.length).toFixed(1)}` : ''}`),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn amarelo grande', type: 'button', onclick: () => { fechaModal(); cjComecaJogo(tt.titular); } }, '⚽ Take the field'),
      el('button', { class: 'btn', type: 'button', onclick: () => abrirCarreira() }, 'Not now')));
}
function cjComecaJogo(titular) {
  const t = cjTemp(); if (!t || G.jogoC) return;
  const rd = t.rodada, adv = cjAdversario(t, rd), c = carrDados();
  if (typeof montadoAgora === 'function' && montadoAgora() && typeof desmontar === 'function') desmontar();
  const volta = { mapa: G.mapa.id, x: G.p.x, y: G.p.y };
  if (G.mapa.id === CJ_MAPA) { volta.mapa = 'cidade'; volta.x = null; }
  t.retorno = volta;
  const m = getMapa(CJ_MAPA); const def = carrClube(c.clube.id);
  const est = typeof ESTADIOS !== 'undefined' && (ESTADIOS.find(e => e.host === def.cidade) || ESTADIOS.find(e => e.host === ({ egito: 'cairo', catar: 'doha', japao: 'toquio', eua: 'miami', argentina: 'buenos', portugal: 'lisboa', franca: 'paris', alemanha: 'munique', italia: 'milao', espanha: 'madri', inglaterra: 'londres' })[def.pais]));
  m.estadio = est ? est.id : 'est_santos';
  m.nome = `${cjEmCasa(t, rd) ? def.nome + ' × ' + adv.nome : adv.nome + ' × ' + def.nome}`;
  G.jogoC = { t, rd, adv, titular, lances: cjSorteiaLances(titular, t.tier), idx: 0, gn: 0, ga: 0, min: 0, nota: 6.0, meusG: 0, meusA: 0, feed: [], fase: 'intro', proxFase: G.agora + 3000, caca: G.caca };
  G.caca = false;
  trocaMapa(CJ_MAPA, 20.5, CJ_H - 3.5);
  const casa = cjEmCasa(t, rd);
  banner(`${casa ? def.sigla : adv.sigla} × ${casa ? adv.sigla : def.sigla}`, `Round ${t.rodada + 1} of the ${t.liga}. ${titular ? 'You\'re in the starting lineup!' : 'You start on the bench.'}`); som('apito');
  cjPlacar();
}
// os minutos entre um lance e outro: gols dos companheiros e do rival
function cjSegmento(ate) {
  const J = G.jogoC, nos = J.t.times[0], adv = J.adv;
  const dur = Math.max(0, ate - J.min), fN = nos.f * (J.titular || J.min >= 55 ? 1 : 0.95);
  const eventos = [];
  const lamN = 0.85 * fN / adv.f * dur / 90, lamA = 1.05 * adv.f / fN * dur / 90;
  for (let i = 0, n = cjPoisson(lamN); i < n; i++) eventos.push({ min: Math.round(J.min + 1 + Math.random() * (dur - 1)), nos: true });
  for (let i = 0, n = cjPoisson(lamA); i < n; i++) eventos.push({ min: Math.round(J.min + 1 + Math.random() * (dur - 1)), nos: false });
  eventos.sort((a, b) => a.min - b.min);
  J.seg = { de: J.min, ate, t0: G.agora, dur: Math.max(1600, Math.min(4200, dur * 90)), eventos };
  J.fase = 'sim';
}
function cjEventoGol(ev) {
  const J = G.jogoC, nos = J.t.times[0], adv = J.adv;
  if (ev.nos) {
    J.gn++; nos.craque.g++;
    const naBola = (J.titular || J.min >= 55) && cjPosicao() !== 'zagueiro' && Math.random() < 0.3;
    if (naBola) { J.meusA++; J.nota += 0.5; }
    banner(`⚽ GOAL for ${nos.nome}!`, `${nos.craque.nome} at ${ev.min}'${naBola ? ' — with your assist!' : ''}`); som('gol');
    J.feed.push(`${ev.min}' ⚽ GOAL by ${nos.craque.nome}${naBola ? ` (assist by ${carrNome()})` : ''}`);
  } else {
    J.ga++; banner(`Goal for ${adv.nome}`, `${adv.craque.nome} at ${ev.min}'`); som('erro'); J.feed.push(`${ev.min}' 😣 Goal for ${adv.nome} (${adv.craque.nome})`);
  }
  cjPlacar();
}
function cjTick(dt) {
  const J = G.jogoC; if (!J) return;
  if (!G.mapa || G.mapa.id !== CJ_MAPA) { cjAbandona(); return; }
  const agora = G.agora;
  if (J.fase === 'fim') { if (J.fimMostrado && $('#modal').hidden) cjSaiDoCampo(); return; }
  if (J.fase === 'intro' || J.fase === 'pos') {
    if (agora < J.proxFase) return;
    const L = J.lances[J.idx]; cjSegmento(L ? L.min : 90);
  } else if (J.fase === 'sim') {
    const S = J.seg, k = Math.min(1, (agora - S.t0) / S.dur);
    J.min = Math.round(S.de + (S.ate - S.de) * k);
    while (S.eventos.length && S.eventos[0].min <= J.min) cjEventoGol(S.eventos.shift());
    if (!J._tp || agora - J._tp > 200) { J._tp = agora; cjPlacar(); }
    if (k >= 1) {
      const L = J.lances[J.idx];
      if (L) { J.idx++; if (!J.titular && J.idx === 1) banner('🔁 Substitution!', `A teammate comes off, ${carrNome()} comes on!`); cjComecaLance(L); cjPlacar(); }
      else cjFimJogo();
    }
  } else if (J.fase === 'lance') {
    if (!G.fut) { J.lance = null; J.fase = 'pos'; J.proxFase = agora + 800; if (typeof futGradeLivre === 'function') futGradeLivre(false); return; } // (segurança: o lance sumiu)
    futTick(dt);
    if (!J._tp || agora - J._tp > 200) { J._tp = agora; cjPlacar(); }
  }
}
function cjFimJogo() {
  const J = G.jogoC, t = J.t, rd = J.rd, nos = t.times[0], adv = J.adv, ai = t.times.indexOf(adv), c = carrDados(), s = G.save;
  J.fase = 'fim'; J.min = 90; banner('🏁 Full time!', `${nos.sigla} ${J.gn} × ${J.ga} ${adv.sigla}`); som('apito');
  const casa = cjEmCasa(t, rd);
  if (casa) cjRegistra(t, 0, ai, J.gn, J.ga); else cjRegistra(t, ai, 0, J.ga, J.gn);
  nos.craque.g -= 0; // (gols dos companheiros já contados no craque)
  const outros = cjSimulaOutros(t, rd);
  const venceu = J.gn > J.ga, empatou = J.gn === J.ga;
  J.nota += venceu ? 0.5 : empatou ? 0 : -0.4;
  const nota = Math.max(3, Math.min(10, Math.round(J.nota * 10) / 10));
  const craque = nota >= 8;
  t.eu.J++; t.eu.G += J.meusG; t.eu.A += J.meusA; t.eu.notas.push(nota); if (J.titular) t.eu.titular++;
  t.resultados.push({ rd, casa, adv: ai, gn: J.gn, ga: J.ga, nota, g: J.meusG, a: J.meusA, outros });
  t.rodada = rd + 1;
  // prêmios
  const bicho = venceu ? Math.round(carrLiquido(c.clube.salario) * 0.8) : empatou ? Math.round(carrLiquido(c.clube.salario) * 0.3) : 0;
  const ef = carrAplica({ ouro: bicho, fama: J.meusG * 3 + J.meusA * 2 + (craque ? 4 : 0) + (venceu ? 2 : 0), tor: (venceu ? 4 : empatou ? 0 : -3) + J.meusG * 2, dir: (nota >= 7.5 ? 3 : nota <= 5 ? -3 : 0) + (venceu ? 2 : empatou ? 0 : -1) });
  try { const nv = s.nivel, xpNv = (xpPara(nv + 1) - xpPara(nv)) || 1000; ganhaXp(Math.round(xpNv * 0.035 * (nota / 7))); } catch (e) { }
  // metas e contadores
  carrProgMeta('jogosLiga'); if (venceu) carrProgMeta('vitLiga'); if (J.meusG) carrProgMeta('golsLiga', J.meusG); if (nota >= 7) carrProgMeta('notaLiga');
  c.contadores.partidas = (c.contadores.partidas || 0) + 1; if (venceu) c.contadores.vitorias = (c.contadores.vitorias || 0) + 1; c.contadores.gols = (c.contadores.gols || 0) + J.meusG;
  const res = venceu ? 'vence' : empatou ? 'ties with' : 'loses to';
  carrHist(`${nos.nome} ${res} ${adv.nome}: ${J.gn} × ${J.ga} (round ${rd + 1}). ${carrNome()}: rating ${nota.toFixed(1)}${J.meusG ? `, ${J.meusG} goal${J.meusG > 1 ? 's' : ''}` : ''}${J.meusA ? `, ${J.meusA} assist.` : ''}${craque ? ' — PLAYER OF THE MATCH!' : ''}`);
  carrLog(`🏁 ${nos.sigla} ${J.gn} × ${J.ga} ${adv.sigla}. Your rating: ${nota.toFixed(1)}${craque ? ' ⭐ PLAYER OF THE MATCH' : ''}.${bicho ? ` Win bonus: +${carrFmt(bicho)} coins.` : ''}`, venceu ? 'l-lvl' : 'l-info');
  if (typeof carreiraEvento === 'function') try { carreiraEvento('jogoLiga', { venceu, nota }); } catch (e) { }
  carrSujo(); carrSalvar();
  const resumo = { nota, craque, venceu, empatou, gn: J.gn, ga: J.ga, g: J.meusG, a: J.meusA, feed: J.feed.slice(), ef, bicho, outros, rd, adv };
  setTimeout(() => cjTelaFimJogo(resumo), 1600);
}
function cjSaiDoCampo() {
  const J = G.jogoC, t = J && J.t; G.jogoC = null;
  G.mons = G.mons.filter(m => !m.fut); G.fut = null; if (typeof futGradeLivre === 'function') futGradeLivre(false); if (typeof futBotoes === 'function') futBotoes(); G.alvo = null; if (J) G.caca = J.caca;
  cjPlacar();
  const v = t && t.retorno; if (t) t.retorno = null;
  if (G.mapa && G.mapa.id === CJ_MAPA) { if (v && v.mapa && MAPAS_DEF[v.mapa] && v.mapa !== CJ_MAPA) trocaMapa(v.mapa, v.x, v.y); else trocaMapa('cidade'); }
  const st = stats(); G.save.hp = Math.max(G.save.hp, st.maxHp);
}
function cjAbandona() { // saiu do campo no meio do jogo (não deveria acontecer): o jogo não conta, dá para jogar de novo hoje
  const J = G.jogoC; if (!J) return; G.jogoC = null; G.mons = G.mons.filter(m => !m.fut); G.fut = null; if (typeof futGradeLivre === 'function') futGradeLivre(false); if (typeof futBotoes === 'function') futBotoes(); G.caca = J.caca; cjPlacar();
  carrLog('⚠️ The game was interrupted. You can play the round again today (U → Play the round).', 'l-sis');
}

/* ============================================================ TELAS ============================================================ */
function cjTabelaEl(t, compacta) {
  const tab = cjTabela(t);
  return el('table', { class: 'cj-tab' }, el('tr', {}, el('th', {}, '#'), el('th', { class: 'nm' }, 'Clube'), el('th', {}, 'P'), el('th', {}, 'J'), el('th', {}, 'V'), compacta ? null : el('th', {}, 'E'), compacta ? null : el('th', {}, 'D'), el('th', {}, 'SG')),
    ...tab.map((x, k) => el('tr', { class: x.i === 0 ? 'eu' : '' }, el('td', {}, `${k + 1}`), el('td', { class: 'nm' }, el('span', { class: 'cj-bola', style: `background:${x.cor1};border-color:${x.cor2}` }), x.nome), el('td', {}, el('b', {}, `${x.P}`)), el('td', {}, `${x.J}`), el('td', {}, `${x.V}`), compacta ? null : el('td', {}, `${x.E}`), compacta ? null : el('td', {}, `${x.D}`), el('td', {}, `${x.SG > 0 ? '+' : ''}${x.SG}`))));
}
function cjTelaFimJogo(r) {
  const J = G.jogoC, t = cjTemp() || (J && J.t); if (!t) { cjSaiDoCampo(); return; }
  const nos = t.times[0];
  const cor = r.nota >= 8 ? '#1a9a3a' : r.nota >= 6.5 ? '#2a6ad9' : r.nota >= 5 ? '#c08a10' : '#c0392b';
  const outros = el('div', { class: 'cj-outros' }, ...r.outros.map(o => el('div', {}, `${t.times[o.a].sigla} ${o.ga} × ${o.gb} ${t.times[o.b].sigla}`)));
  abreModal.largo = true;
  abreModal(el('h2', {}, r.venceu ? '🏆 Victory!' : r.empatou ? '🤝 Tie' : '😣 Loss'),
    el('div', { class: 'cj-final' }, carrEscudo(nos, 54), el('div', { class: 'cj-placarF' }, `${nos.sigla} ${r.gn} × ${r.ga} ${r.adv.sigla}`), carrEscudo(r.adv, 54)),
    el('div', { class: 'cj-nota', style: `--c:${cor}` }, el('div', { class: 'n' }, r.nota.toFixed(1)), el('div', {}, el('b', {}, r.craque ? '⭐ PLAYER OF THE MATCH!' : 'Your rating'), el('small', {}, `${r.g} goal${r.g === 1 ? '' : 's'} · ${r.a} assist${r.a === 1 ? '' : 's'}`))),
    carrChips(r.ef),
    el('div', { class: 'cj-feed' }, ...r.feed.map(f => el('div', {}, f))),
    el('h3', {}, `📋 ${t.liga} — after Round ${r.rd + 1}`), outros, cjTabelaEl(t, true),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => { fechaModal(); cjSaiDoCampo(); } }, 'Leave the field ▶')));
  if (J) J.fimMostrado = true;
}
function cjTelaFimTemporada(u, titulo, ef, t) {
  abreModal.largo = true;
  abreModal(el('h2', {}, titulo),
    u.pos === 1 ? el('div', { class: 'cj-taca' }, iconeClone(iconeItem('taca_liga')), el('p', {}, `${u.clube} wins the ${u.liga}! The TROPHY went to your backpack: put it in your house!`)) : null,
    el('p', {}, `Your season: average rating ${u.media.toFixed(1)} · ${u.G} goals · ${u.A} assists.`),
    u.artilheiro ? el('p', { class: 'cj-art' }, '👟 You were the league\'s TOP SCORER! The Golden Cleat went to your backpack.') : null,
    carrChips(ef), cjTabelaEl(t),
    el('p', { class: 'dica' }, 'The next season starts tomorrow (on the next game day).'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: fechaModal }, 'Let\'s go!')));
}
// placar na tela durante o jogo
function cjPlacar() {
  let p = document.getElementById('placarCj'); const J = G.jogoC;
  if (!J) { if (p) p.remove(); return; }
  if (!p) { p = el('div', { id: 'placarCj' }, el('div', { class: 'l1' }), el('div', { class: 'l2' })); document.body.append(p); }
  const t = J.t, nos = t.times[0], casa = cjEmCasa(t, J.rd);
  const A = casa ? nos : J.adv, B = casa ? J.adv : nos, ga = casa ? J.gn : J.ga, gb = casa ? J.ga : J.gn;
  const l1 = `${A.sigla} ${ga} × ${gb} ${B.sigla}  ·  ⏱️ ${Math.min(90, J.min)}'`;
  let l2 = '';
  if (J.fase === 'lance' && J.lance) { const info = CJ_LANCES[J.lance.tipo]; l2 = document.body.classList.contains('cel3') ? `${info.emoji} ${info.nome}` : `${info.emoji} ${info.nome}: ${info.txt}` + (J.lance.tipo === 'penalti' ? '' : `  ⏳ ${Math.max(0, Math.ceil((J.fimLance - G.agora) / 1000))}s`); }
  else if (J.fase === 'sim') l2 = J.titular || J.min >= 55 ? '▶ The ball is rolling...' : '🪑 You\'re on the bench (you come in for the 2nd half)';
  else if (J.fase === 'fim') l2 = '🏁 Full time!';
  else l2 = `${J.lances.length - J.idx} play${J.lances.length - J.idx === 1 ? '' : 's'} left — your chance${J.lances.length - J.idx === 1 ? '' : 's'} to shine`;
  if (p.children[0].textContent !== l1) p.children[0].textContent = l1;
  if (p.children[1].textContent !== l2) p.children[1].textContent = l2;
  p.classList.toggle('lance', J.fase === 'lance');
}

/* ============================================================ GANCHOS ============================================================ */
{
  // o relógio do jogo
  const _atualizaCj = atualiza;
  atualiza = function (dt) { const r = _atualizaCj.apply(this, arguments); try { if (G.jogoC && !G.pausado) cjTick(dt); } catch (e) { console.error('career game', e); } return r; };
  // em campo, com a camisa do seu clube
  const _lookCj = lookJogador;
  lookJogador = function (retrato) {
    const L = _lookCj.apply(this, arguments); const J = G.jogoC;
    if (!J || retrato || !L || L.folha) return L;
    if (J._lookBase === L && J._look) return J._look; // o mesmo objeto a cada quadro (o desenho do boneco fica em cache)
    const nos = J.t.times[0];
    J._lookBase = L; J._look = Object.assign({}, L, { roupa: 'roupa-futebol', corRoupa: nos.cor1, cor2: nos.cor2, baixo: 'baixo-shorts' }); delete J._look._kb;
    return J._look;
  };
  // no jogo ninguém desmaia: só perde a bola
  const _morrerCj = morrer;
  morrer = function () {
    if (G.jogoC) { const st = stats(); G.save.hp = st.maxHp; return; }
    return _morrerCj.apply(this, arguments);
  };
  // a temporada anda junto com a carreira
  const _checaCj = checaCarreira;
  checaCarreira = function () { const r = _checaCj.apply(this, arguments); try { cjChecaTemporada(); } catch (e) { console.error('temporada', e); } return r; };
  // quem recarregou o jogo no meio da partida volta para fora do estádio (a rodada pode ser jogada de novo)
  const _iniCj = iniciarJogo;
  iniciarJogo = async function (save, ...resto) {
    try { if (save && save.mapa === CJ_MAPA) { const tp = save.carreira && save.carreira.temporada, v = tp && tp.retorno; if (v && v.mapa && v.mapa !== CJ_MAPA) { save.mapa = v.mapa; save.x = v.x; save.y = v.y; } else { save.mapa = 'cidade'; save.x = null; save.y = null; } if (tp) tp.retorno = null; } } catch (e) { }
    G.jogoC = null; return _iniCj.call(this, save, ...resto);
  };
  // as vitórias do MEU TIME não contam mais para o clube da carreira (cada modo com as suas conquistas)
  const _eventoCj = carreiraEvento;
  carreiraEvento = function (tipo) { if (tipo === 'partida') return; return _eventoCj.apply(this, arguments); };
  // aviso laranja: hoje tem jogo
  if (typeof alertasAtuais === 'function') {
    const _alCj = alertasAtuais;
    alertasAtuais = function () { const l = _alCj.apply(this, arguments); try { if (cjHojeTemJogo() && !(ALERTA_ADIA.jogoLiga > Date.now())) { const t = cjTemp(); l.unshift({ id: 'jogoLiga', ic: '⚽', txt: `League game today: ${t.times[0].sigla} × ${cjAdversario(t, t.rodada).sigla} (Round ${t.rodada + 1})!`, bt: 'Play', fn: () => cjPreJogo() }); } } catch (e) { } return l; };
  }
}

/* ---------- metas da liga ---------- */
Object.assign(CARR_META_EMOJI, { golsLiga: '⚽', notaLiga: '⭐', vitLiga: '🏆', jogosLiga: '👟' });
{
  const _descCj = carrDescMeta;
  carrDescMeta = function (m) {
    const n = m.n;
    switch (m.tipo) {
      case 'golsLiga': return n === 1 ? 'Score 1 league goal (ATTACK or PENALTY plays)' : `Score ${n} league goals (ATTACK or PENALTY plays)`;
      case 'notaLiga': return n === 1 ? 'Get a rating of 7 or higher in 1 league game' : `Get a rating of 7 or higher in ${n} league games`;
      case 'vitLiga': return n === 1 ? 'Win 1 league game' : `Win ${n} league games`;
      case 'jogosLiga': return n === 1 ? 'Play the next league round' : `Play ${n} league rounds (don't miss any!)`;
    }
    return _descCj.apply(this, arguments);
  };
  const _geraCj = carrGeraMetas;
  carrGeraMetas = function (k) {
    const base = _geraCj.apply(this, arguments);
    try {
      const pr = k.promessa ? 1 : 0, pos = cjPosicao();
      const liga = [];
      liga.push({ tipo: 'jogosLiga', n: 2 });
      liga.push(pos === 'zagueiro' ? { tipo: 'notaLiga', n: 1 + pr } : { tipo: 'golsLiga', n: (pos === 'atacante' ? 2 : 1) + pr });
      liga.push(Math.random() < 0.5 ? { tipo: 'vitLiga', n: 1 + pr } : { tipo: 'notaLiga', n: 1 + pr });
      const lm = liga.slice(0, 3).map(c => { const m = { tipo: c.tipo, alvo: null, extra: null, n: c.n, desc: '', prog: 0 }; m.desc = carrDescMeta(m); return m; });
      const outras = (k.opcoesMeta || base).filter(m => m.tipo !== 'partidas');
      k.opcoesMeta = [lm[0], lm[1], ...outras.slice(0, 2), lm[2]].filter(Boolean).slice(0, 5);
      return [lm[0], lm[1], outras[0] || lm[2]].filter(Boolean);
    } catch (e) { return base; }
  };
}

/* ---------- a temporada no painel da carreira ---------- */
{
  const _abrirCj = abrirCarreira;
  abrirCarreira = function () {
    const r = _abrirCj.apply(this, arguments);
    try {
      const c = G.save.carreira, t = c && c.temporada, box = document.getElementById('modalConteudo');
      if (!c || !c.ativa || !c.clube || !box) return r;
      const ops = box.querySelector('.opcoes'); if (!ops) return r;
      const bloco = el('div', { class: 'cj-bloco' });
      if (t && t.clubeId === c.clube.id) {
        const hoje = cjHojeTemJogo(), rd = Math.min(t.rodada, CJ_RODADAS - 1), adv = cjAdversario(t, rd);
        const media = t.eu.notas.length ? (t.eu.notas.reduce((a, b) => a + b, 0) / t.eu.notas.length).toFixed(1) : '—';
        const lider = t.times.map(x => x.craque).concat([{ nome: carrNome(), g: t.eu.G }]).sort((a, b) => b.g - a.g)[0];
        bloco.append(el('h3', {}, `⚽ ${t.liga} — Season ${t.ano}`),
          el('div', { class: 'cj-prox ' + (hoje ? 'hoje' : '') },
            carrEscudo(adv, 44),
            el('div', { style: 'flex:1' }, el('b', {}, hoje ? `TODAY: Round ${t.rodada + 1} against ${adv.nome}` : t.rodada >= CJ_RODADAS ? 'Season over' : `Next game: Round ${t.rodada + 1} against ${adv.nome} (day ${t.dia0 + t.rodada})`),
              el('small', {}, `${cjEmCasa(t, rd) ? '🏠 Home' : '✈️ Away'} · ${adv.nome} is #${cjPos(t, t.times.indexOf(adv))} · you are #${cjPos(t, 0)}`)),
            hoje ? el('button', { class: 'btn amarelo', type: 'button', onclick: () => cjPreJogo() }, '⚽ Play the round') : null),
          el('p', { class: 'dica' }, `You: ${t.eu.J} games · ${t.eu.G} goals · ${t.eu.A} assists · average rating ${media} · league top scorer: ${lider.nome} (${lider.g})`),
          cjTabelaEl(t, true));
      } else if (c.ultimaTemporada) {
        const u = c.ultimaTemporada;
        bloco.append(el('h3', {}, '⚽ League'), el('p', { class: 'dica' }, `Last season: #${u.pos} in the ${u.liga} (${u.clube}) · ${u.G} goals · rating ${u.media.toFixed(1)}. The next one starts on the next game day.`));
      }
      if ((c.titulosLiga || []).length) bloco.append(el('p', { class: 'dica' }, `🏆 League titles: ${c.titulosLiga.map(x => x.liga).join(' · ')}`));
      if (bloco.children.length) ops.before(bloco);
    } catch (e) { console.error('carreira temporada', e); }
    return r;
  };
  // regras da tela de início
  const _inativaCj = carrTelaInativa;
  carrTelaInativa = function () {
    const r = _inativaCj.apply(this, arguments);
    try { const ul = document.querySelector('#modalConteudo ul'); if (ul) ul.append(el('li', {}, '⚽ Your club plays in the LEAGUE: one round per game day. You take the field and play the PLAYS live (attack, team play, counterattack and penalty). Ratings, goals, assists, the champion\'s trophy and the top scorer race!')); } catch (e) { }
    return r;
  };
}

/* ---------- troféus (itens) ---------- */
Object.assign(ITENS, {
  taca_liga: { nome: 'League Champion Trophy', tipo: 'movel', obj: 'taca_liga', preco: 0, venda: 0, raro: true, desc: 'You were a league CHAMPION in your career! Furniture for your house: inside the house, use it (or right-click) to place it in front of you.' },
  prata_liga: { nome: 'Runner-Up Trophy', tipo: 'movel', obj: 'prata_liga', preco: 0, venda: 0, desc: '2nd place in a career league. Furniture for your house.' },
  chuteira_artilheiro: { nome: 'Top Scorer\'s Golden Cleat', tipo: 'movel', obj: 'chuteira_ouro', preco: 0, venda: 0, raro: true, desc: 'You were the TOP SCORER of a career league! Furniture for your house.' },
});
{
  const obj = { taca_liga: 1.3, prata_liga: 1.1, chuteira_ouro: 1.0, medalha_craque: 0.8, torcida1: 2.25, torcida2: 2.25, torcida3: 2.25, torcida4: 2.25 };
  for (const [n, w] of Object.entries(obj)) { OBJ_INFO[n] = { w, b: 1 }; OBJ_BLOQUEIA.add(n); if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } }
  ICON_ALIAS.taca_liga = 'taca_liga'; ICON_ALIAS.prata_liga = 'prata_liga'; ICON_ALIAS.chuteira_artilheiro = 'chuteira_ouro';
  if (typeof RAR_CACHE !== 'undefined' && RAR_CACHE) { RAR_CACHE.taca_liga = 'lendario'; RAR_CACHE.chuteira_artilheiro = 'lendario'; RAR_CACHE.prata_liga = 'epico'; }
}

/* ---------- estilo ---------- */
{
  const st = document.createElement('style');
  st.textContent = `#placarCj{position:fixed;left:50%;top:108px;transform:translateX(-50%);z-index:45;background:rgba(20,12,34,.92);color:#fff;border:3px solid #ffd23f;border-radius:14px;padding:6px 16px;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.45);pointer-events:none;max-width:92vw}
#placarCj .l1{font:900 20px Nunito,sans-serif;color:#ffe14a;letter-spacing:.5px}
#placarCj .l2{font:800 13px Nunito,sans-serif;color:#e8e0ff;margin-top:2px}
#placarCj.lance{border-color:#3ad86a;animation:cjPulsa 1s infinite}
#placarCj.lance .l2{color:#aaffc0;font-size:14px}
@keyframes cjPulsa{50%{box-shadow:0 0 18px rgba(58,216,106,.8)}}
body.cel3 #placarCj{top:62px}
.cj-confronto{display:flex;align-items:center;justify-content:center;gap:18px;margin:6px 0 10px}
.cj-lado{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:140px;text-align:center}
.cj-lado small{opacity:.8}.cj-mando{font-weight:800;opacity:.6!important;text-transform:uppercase;font-size:10px}
.cj-x{font:900 34px Nunito,sans-serif;color:#b07a10}
.cj-esc{padding:8px 12px;border-radius:10px;font-weight:800;margin:6px 0}
.cj-esc.tit{background:rgba(58,216,106,.2);border:2px solid #2aa84a}.cj-esc.res{background:rgba(255,190,60,.2);border:2px solid #e0a000}
.cj-bloco{margin:10px 0 4px;padding:8px 10px;border-radius:12px;background:rgba(0,0,0,.04)}
.cj-bloco h3{margin:0 0 6px}
.cj-prox{display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,.5)}
.cj-prox.hoje{background:rgba(255,210,63,.35);border:2px solid #e0a800;animation:cjPulsa 1.6s infinite}
.cj-tab{width:100%;border-collapse:collapse;font-size:13px;margin-top:6px}
.cj-tab th,.cj-tab td{padding:3px 5px;text-align:center;border-bottom:1px solid rgba(0,0,0,.08)}
.cj-tab .nm{text-align:left}.cj-tab tr.eu{background:rgba(255,210,63,.35);font-weight:800}
.cj-bola{display:inline-block;width:11px;height:11px;border-radius:50%;border:3px solid;margin-right:6px;vertical-align:-1px}
.cj-final{display:flex;align-items:center;justify-content:center;gap:14px;margin:4px 0}
.cj-placarF{font:900 30px Nunito,sans-serif}
.cj-nota{display:flex;align-items:center;justify-content:center;gap:14px;margin:8px 0}
.cj-nota .n{width:78px;height:78px;border-radius:50%;background:var(--c);color:#fff;font:900 32px Nunito,sans-serif;display:grid;place-items:center;box-shadow:0 3px 10px rgba(0,0,0,.3)}
.cj-nota div{display:flex;flex-direction:column}
.cj-feed{max-height:130px;overflow:auto;font-size:13px;background:rgba(0,0,0,.05);border-radius:10px;padding:6px 10px;margin:6px 0}
.cj-outros{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;font-weight:700;opacity:.8}
.cj-taca{display:flex;align-items:center;gap:12px;background:rgba(255,200,58,.25);border:2px solid #e0a800;border-radius:12px;padding:8px}
.cj-taca canvas{width:64px;height:64px}
.cj-art{font-weight:800;color:#a0662a}`;
  document.head.append(st);
}
