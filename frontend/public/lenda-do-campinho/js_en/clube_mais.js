/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏟️ MODO CLUBE — MUITO MAIS CONTEÚDO (v236)
   - COPAS CONTINENTAIS: terminar entre os 2 primeiros da liga principal de um país classifica
     para a copa do continente na temporada seguinte (Libertadores, Liga dos Campeões...):
     oitavas, quartas, semi e final, jogadas entre as rodadas da liga.
   - MUNDIAL INTERCLUBES: o campeão continental joga semifinal e final contra os campeões dos outros continentes.
   - SELEÇÃO BRASILEIRA: a partir do nível 60 o seu craque é convocado. Ciclo de 4 temporadas:
     Eliminatórias → Copa América → Eliminatórias → COPA DO MUNDO (grupo + mata-mata).
     Um jogo da seleção por "Data FIFA" (a cada 2 jogos do clube).
   - EVOLUÇÃO DO CLUBE EM IMAGENS: cada estrutura muda de desenho conforme cresce (o estádio vai do
     campinho de terra até a arena), com álbum do clube e festa na tela quando muda de fase.
   - EVENTOS E COLETIVAS: entre as rodadas acontecem coisas (aumento, proposta, festa, patrocinador,
     ação social...) com escolhas e consequências; depois de um título, coletiva de imprensa.
   Carregar DEPOIS de team.js, partida.js e time_guia.js.
   ============================================================ */

/* ---------- utilidades ---------- */
const CM_P = () => premioDiv(G.save.time.div);
const cmImg = id => `a/${id}.webp`;
function cmFoto(id, titulo, txt, aoFechar) { // tela cheia com a ilustração (não mexe no modal que está aberto)
  const ov = el('div', { class: 'cm-foto' }, el('div', { class: 'cm-foto-caixa' },
    el('img', { src: cmImg(id), alt: titulo }), el('h3', {}, titulo), txt ? el('p', {}, txt) : null,
    el('button', { class: 'btn amarelo', onclick: () => { ov.remove(); if (aoFechar) aoFechar(); } }, 'Continue')));
  document.body.append(ov); return ov;
}
function cmAlbum(id, legenda) { const t = G.save.time; t.album = t.album || []; if (!t.album.some(a => a.id === id)) t.album.push({ id, legenda, temp: t.temporada }); }

/* ============================================================
   1) COPAS CONTINENTAIS e MUNDIAL INTERCLUBES
   ============================================================ */
const CONTINENTES = {
  sul: { nome: 'Copa Libertadores', paises: ['brasil', 'argentina', 'uruguai', 'colombia'] },
  europa: { nome: 'Champions League', paises: ['portugal', 'franca', 'alemanha', 'italia', 'espanha', 'inglaterra', 'escocia', 'turquia', 'belgica', 'holanda'] },
  norte: { nome: 'Concacaf Champions Cup', paises: ['eua', 'mexico'] },
  asia: { nome: 'Asian Champions League', paises: ['japao', 'catar', 'china', 'arabia'] },
  africa: { nome: 'African Champions League', paises: ['egito'] },
};
const contDe = pid => Object.keys(CONTINENTES).find(k => CONTINENTES[k].paises.includes(pid));
const FASES_CONT = ['Round of 16', 'Quarterfinals', 'Semifinal', 'Final'];
const GAT_CONT = [2, 6, 10, 14];            // rodadas da liga depois das quais cada fase abre
const MULT_CONT = [2, 2.5, 3.2, 4.5];
const FASES_MUNDIAL = ['World Championship Semifinal', 'World Championship Final'];
const MULT_MUNDIAL = [5, 7];
const cmPara = f => 'the'; // "para as Quartas", "para a Final"
const cmDa = nome => 'of the'; // "a Final do Mundial", "a Final da Libertadores"
const topoBase = pid => { const d = PAIS[pid].divs; return d[d.length - 1][1]; };
function timeDoPais(pid, extra, evita) {
  const p = PAIS[pid]; const k = p.divs.length - 1; const base = topoBase(pid) + (extra || 0);
  const a = novoTimeIA(pid, base, new Set([G.save.time.nome]));
  const reais = CLUBES_PAIS[pid] && CLUBES_PAIS[pid][k];
  if (reais) { const livres = reais.slice(0, 5).filter(r => !evita.has(r[0])); const r = livres[rndi(0, Math.max(0, livres.length - 1))] || reais[0]; Object.assign(a, { nome: r[0], cor1: r[1], cor2: r[2] }); }
  evita.add(a.nome); a.pais = pid; a.ovr = Math.round(base + rndi(-1, 2)); return a;
}
function novaContinental(cont) {
  const C = CONTINENTES[cont]; const ps = [...C.paises].sort((a, b) => topoBase(a) - topoBase(b)); const evita = new Set();
  const advs = FASES_CONT.map((f, i) => { const pid = ps[Math.min(ps.length - 1, Math.floor((ps.length - 0.01) * (0.3 + i * 0.23)))]; return timeDoPais(pid, i * 1.5, evita); });
  return { cont, nome: C.nome, fase: 0, status: 'vivo', advs, res: [], temp: G.save.time.temporada };
}
function novoMundial(cont) {
  // semifinal: o campeão de outro continente; final: o gigante da Europa (ou da América do Sul, se você é europeu)
  const evita = new Set(); const outros = Object.keys(CONTINENTES).filter(k => k !== cont && k !== 'europa' && k !== 'sul');
  const semi = timeDoPais(CONTINENTES[outros[rndi(0, outros.length - 1)]].paises[0], 4, evita);
  const final = timeDoPais(cont === 'europa' ? 'brasil' : 'inglaterra', 5, evita);
  return { nome: 'Club World Cup', fase: 0, status: 'vivo', advs: [semi, final], res: [] };
}
// quem termina entre os 2 primeiros da liga PRINCIPAL vai para a copa continental da próxima temporada
{
  const _fimTempCM = fimTemporada;
  fimTemporada = function () {
    const t = G.save.time; const d = DIVS[t.div]; const pos = minhaPosicao(); const pais = t.pais;
    const vaga = d && d.topo && pos <= 2 && contDe(pais);
    // v239: 25% do lucro dos jogos da temporada vai para o seu bolso (o dono também ganha!)
    const lucro = Math.round(t.opTemp || 0), parte = Math.max(0, Math.min(Math.round(lucro * 0.25), Math.floor(t.caixa))); t.opTemp = 0;
    if (parte > 0) { t.caixa -= parte; G.save.ouro += parte; log(`💼 Your share of the season's profit: +${fmt(parte)} coins in your pocket.`, 'l-loot'); }
    const r = _fimTempCM.apply(this, arguments);
    { const box = document.getElementById('modalConteudo'), bt = box && box.querySelector('.opcoes'); if (bt) bt.before(el('p', { class: 'meta-linha' }, parte > 0 ? `💼 Match profit: ${fmt(lucro)}. Your owner's share (25%): +${fmt(parte)} coins in your pocket!` : `💼 The season's matches didn't make a profit (${fmt(lucro)}), so there was no owner's share. The stadium, the store and fan memberships increase income.`)); }
    if (vaga) {
      t.cont = novaContinental(vaga);
      log(`🌎 CONTINENTAL SPOT! ${t.nome} will play in the ${t.cont.nome} this season (🌎 Continental tab).`, 'l-lendario');
      const box = document.getElementById('modalConteudo'); if (box) { const bt = box.querySelector('.opcoes'); if (bt) bt.before(el('p', { class: 'meta-linha' }, `🌎 Qualified for the ${t.cont.nome}! The games happen between league rounds.`)); }
    } else if (t.cont && t.cont.status !== 'vivo') t.cont = null;
    if (t.mundial && t.mundial.status !== 'vivo') t.mundial = null;
    salvar(); return r;
  };
}
// os jogos continentais e do Mundial entram na fila do "próximo jogo"
{
  const _proxCM = proximoJogo;
  proximoJogo = function () {
    const t = G.save.time; const L = t.liga;
    const m = t.mundial; if (m && m.status === 'vivo') return { tipo: 'mundial', fase: m.fase, casa: false, adv: m.advs[m.fase] };
    const c = t.cont; if (c && c.status === 'vivo' && c.fase < 4 && L.rodada >= GAT_CONT[c.fase]) return { tipo: 'cont', fase: c.fase, casa: c.fase < 3 && c.fase % 2 === 0, adv: c.advs[c.fase] };
    return _proxCM.apply(this, arguments);
  };
}
function cmTituloJogo(pj) {
  const t = G.save.time;
  if (pj.tipo === 'cont') return `🌎 ${t.cont.nome} — ${FASES_CONT[pj.fase]}`;
  if (pj.tipo === 'mundial') return `🌍 ${t.mundial.nome} — ${FASES_MUNDIAL[pj.fase]}`;
  return null;
}
// o título certo na tela de pré-jogo e na partida ao vivo
{
  const _preCM = telaPreJogo;
  telaPreJogo = function () {
    const w = _preCM.apply(this, arguments); const pj = proximoJogo(); const tit = pj && cmTituloJogo(pj);
    if (tit) {
      const h = w.querySelector('h3'); if (h) h.textContent = tit;
      const mult = pj.tipo === 'cont' ? MULT_CONT[pj.fase] : MULT_MUNDIAL[pj.fase];
      const pv = [...w.querySelectorAll('p.vazio')].find(p => /Prêmio por vitória|Prize per win/.test(p.textContent));
      if (pv) pv.textContent = `Prize per win: ${fmt(Math.round(CM_P() * mult))} coins (+25% win bonus in your pocket) and ${fmt(Math.round(xpDiv(G.save.time.div) * mult))} XP. A tie in the knockout round goes to penalties.`;
    }
    return w;
  };
  const _jogarCM = jogarPartida;
  jogarPartida = function (pj) {
    const r = _jogarCM.apply(this, arguments); const tit = cmTituloJogo(pj);
    if (tit) { const s = document.querySelector('#modalConteudo .pt-topo small'); if (s) s.textContent = tit; }
    return r;
  };
}
// resultado dos jogos novos (mesmo motor do jogo de copa) + extras de todos os jogos
{
  const _conclCM = concluiJogo;
  concluiJogo = function (pj, gn, ge, escN, rapido, nos, eles) {
    let r;
    if (pj.tipo !== 'cont' && pj.tipo !== 'mundial') r = _conclCM.apply(this, arguments);
    else r = cmConcluiTorneio(pj, gn, ge, escN, rapido, nos, eles);
    cmExtrasPosJogo(pj, r);
    return r;
  };
}
function cmConcluiTorneio(pj, gn, ge, escN, rapido, nos, eles) {
  const s = G.save; const t = s.time; const P = premioDiv(t.div), X = xpDiv(t.div);
  const tt = TATICAS[t.tatica]; const est = t.estr;
  escN.forEach(x => { if (!x.j) return; const gasto = rndi(16, 24) * tt.en * (1 - 0.05 * (est.med || 0)); if (x.j.eu) t.energiaEu = Math.max(0, t.energiaEu - gasto); else { x.j.energia = Math.max(0, x.j.energia - gasto); ganhaXpJogador(x.j, Math.round(40 * (1 + 0.3 * (est.ct || 0)))); } });
  t.jogos++;
  let venceu = gn > ge, pen = null;
  if (gn === ge) { venceu = Math.random() < clamp(0.5 + (nos.gol - eles.gol) * 0.006, 0.25, 0.75); pen = venceu ? [rndi(4, 5), rndi(2, 3)] : [rndi(2, 3), rndi(4, 5)]; }
  const cont = pj.tipo === 'cont'; const T = cont ? t.cont : t.mundial; const mult = (cont ? MULT_CONT : MULT_MUNDIAL)[pj.fase];
  const premio = Math.round(P * mult * (venceu ? 1 : 0.3)); const xp = Math.round(X * mult * (venceu ? 1 : 0.3) * (rapido ? 0.5 : 1)); const bicho = venceu ? Math.round(premio * 0.25) : 0;
  const fin = [['Match prize', premio]];
  if (pj.casa) fin.push(['Ticket sales', Math.round(P * 0.8 * (1 + 0.5 * (est.estadio || 0)) * (1 + t.moral * 0.08))]);
  const saldo = fin.reduce((a, [, v]) => a + v, 0); t.caixa += saldo; t.fin = fin; fin.forEach(([, v]) => { if (v >= 0) t.finTemp.ent += v; else t.finTemp.sai += v; });
  s.ouro += bicho; ganhaXp(xp);
  if (venceu) { t.vitorias++; t.moral = Math.min(3, t.moral + 1); } else t.moral = Math.max(-3, t.moral - 1);
  const placar = `${t.nome} ${gn} × ${ge} ${pj.adv.nome}${pen ? ` (penalties ${pen[0]}×${pen[1]})` : ''}`;
  T.res[pj.fase] = { gn, ge, pen, venceu };
  let txt;
  const nFases = cont ? 4 : 2;
  if (venceu) {
    T.fase++;
    if (T.fase >= nFases) {
      T.status = 'campeao'; const bonus = Math.round(P * (cont ? 10 : 18)); t.caixa += bonus; t.finTemp.ent += bonus; t.trofeus.push({ nome: T.nome, temp: t.temporada }); t.titulos++;
      s.flags[cont ? 'campeao_cont_' + T.cont : 'campeao_mundial_interclubes'] = true;
      banner(cont ? 'CONTINENTAL CHAMPION!' : 'WORLD CHAMPION!', T.nome); som('nivel');
      txt = `${cmDa(T.nome).toUpperCase()} ${T.nome.toUpperCase()} CHAMPION! +${fmt(bonus)} in the club bank.`;
      t._celebra = t._celebra || [];
      if (cont) { t.mundial = novoMundial(T.cont); txt += ' The club will play in the GLOBAL CLUB SUPER CUP!'; t._celebra.push(['cap_clube_continental', `${T.nome} Champion!`, `${t.nome} is the best on the continent. Now the Club World Cup is waiting for you!`]); cmAlbum('cap_clube_continental', `${T.nome} Champion (S${t.temporada})`); }
      else { if (recebeItem('medalha_ouro', 1) !== 'mochila') log('The Gold Medal went to Storage (backpack full).', 'l-loot'); t._celebra.push(['cap_clube_mundial', 'GLOBAL CLUB SUPER CUP CHAMPION!', `The club born in the Sandlot League is now the best on the planet! You won a Gold Medal.`]); cmAlbum('cap_clube_mundial', `Club World Cup Champion (S${t.temporada})`); }
      t.evento = cmEventoColetiva(T.nome);
    } else txt = cont ? `Qualified for ${cmPara(FASES_CONT[T.fase])} ${FASES_CONT[T.fase]} ${cmDa(T.nome)} ${T.nome}!` : `Qualified for the ${FASES_MUNDIAL[T.fase]}!`;
  } else { T.status = 'eliminado'; txt = `Knocked out ${cmDa(T.nome)} ${T.nome}.`; }
  if (typeof carreiraEvento === 'function') carreiraEvento('partida', { vitoria: venceu });
  log(`${placar}. ${txt} +${fmt(bicho)} coins, +${fmt(xp)} XP.`, venceu ? 'l-xp' : 'l-info');
  salvar();
  return { txt: `${placar}. ${txt}`, venceu, empate: false, pen, bicho, xp, fin, saldo };
}
function telaContinental() {
  const t = G.save.time; const w = el('div'); const L = t.liga;
  const bloco = (T, fases, gat) => {
    w.append(el('h3', {}, `${T.nome === 'Club World Cup' ? '🌍' : '🌎'} ${T.nome}`));
    const lista = el('div', { class: 'lista' });
    fases.forEach((f, i) => {
      const adv = T.advs[i]; const r = T.res[i]; let st;
      if (r) st = `${r.gn} × ${r.ge}${r.pen ? ` (pen. ${r.pen[0]}×${r.pen[1]})` : ''} — ${r.venceu ? 'advanced!' : 'eliminado'}`;
      else if (T.status !== 'vivo' || i > T.fase) st = T.status === 'eliminado' ? '—' : gat ? `after round ${gat[i]}` : 'up next';
      else st = !gat || L.rodada >= gat[i] ? 'NEXT GAME!' : `after round ${gat[i]}`;
      lista.append(el('div', { class: 'linha-item' + (T.status === 'eliminado' && !r ? ' bloq' : '') }, el('b', { class: 'pos-tag' }, i + 1),
        el('div', { class: 'nm' }, el('b', {}, f), el('small', {}, i <= T.fase || r ? `vs ${adv.nome}${adv.pais && PAIS[adv.pais] ? ' (' + PAIS[adv.pais].nome + ')' : ''} · power ${adv.ovr}` : 'opponent to be decided')), el('b', {}, st)));
    });
    w.append(lista);
    if (T.status === 'campeao') w.append(el('p', { class: 'meta-linha' }, `🏆 ${T.nome} CHAMPION!`));
    if (T.status === 'eliminado') w.append(el('p', { class: 'vazio' }, 'Knocked out this time. Finish in the top 2 of the top league to come back!'));
  };
  if (t.mundial) bloco(t.mundial, FASES_MUNDIAL, null);
  if (t.cont) bloco(t.cont, FASES_CONT, GAT_CONT);
  if (!t.cont && !t.mundial) {
    const c = contDe(t.pais); const d = DIVS[t.div];
    w.append(el('h3', {}, '🌎 Continental cups'), el('p', {}, c ? `Finish in the TOP 2 of the top league of ${PAIS[t.pais].nome} (${PAIS[t.pais].divs[PAIS[t.pais].divs.length - 1][0]}) to play in the ${CONTINENTES[c].nome} next season.${d && !d.topo ? ' First, climb up to the top division!' : ''}` : 'There’s no continental cup in the Club World Cup.'),
      el('p', {}, 'The continental champion earns a spot in the GLOBAL CLUB SUPER CUP, against the champions of the other continents.'));
  }
  const tit = Object.entries(CONTINENTES).filter(([k]) => G.save.flags['campeao_cont_' + k]).map(([, C]) => C.nome);
  if (tit.length || G.save.flags.campeao_mundial_interclubes) w.append(el('p', {}, `🏆 International titles: ${[...tit, G.save.flags.campeao_mundial_interclubes ? 'Club World Cup' : null].filter(Boolean).join(', ')}.`));
  if (proximoJogo() && ['cont', 'mundial'].includes(proximoJogo().tipo)) w.append(el('div', { class: 'opcoes', style: 'justify-content:center' }, el('button', { class: 'btn amarelo', onclick: () => abrirTime('jogar') }, '⚽ Go to the game')));
  return w;
}

/* ============================================================
   2) ESTRUTURAS COM IMAGENS (evolução do clube) + receitas novas
   ============================================================ */
const ESTR_FOTOS = {
  estadio: ['cap_clube_estadio_0', 'cap_clube_estadio_1', 'cap_clube_estadio_2', 'cap_clube_estadio_3', 'cap_clube_estadio_4'],
  ct: [null, 'cap_clube_ct_1', 'cap_clube_ct_2', 'cap_clube_ct_3', 'cap_clube_ct_4'],
  med: [null, 'cap_clube_med_1', 'cap_clube_med_2', 'cap_clube_med_3', 'cap_clube_med_4'],
  base: [null, 'cap_clube_base_1', 'cap_clube_base_2', 'cap_clube_base_3', 'cap_clube_base_4'],
  olheiro: [null, 'cap_clube_olheiro_1', 'cap_clube_olheiro_2', 'cap_clube_olheiro_3'],
  loja: [null, 'cap_clube_loja_1', 'cap_clube_loja_2', 'cap_clube_loja_3'],
  torcida: [null, 'cap_clube_torcida_1', 'cap_clube_torcida_2', 'cap_clube_torcida_3'],
};
function estagioEstr(k, n) { const f = ESTR_FOTOS[k]; if (!f) return 0; if (!n) return 0; return f.length === 5 ? Math.min(4, Math.ceil(n / 2)) : Math.min(3, Math.ceil(n / 3)); }
function fotoEstr(k, n) { const f = ESTR_FOTOS[k]; const st = estagioEstr(k, n); return (f && f[st]) || 'cap_clube_terreno'; }
const FRASE_FASE = { estadio: ['The dirt pitch', 'The first real stadium!', 'The stadium grew!', 'A modern stadium!', 'A giant ARENA!'],
  ct: [null, 'The first training field', 'A real Training Center!', 'A modern Training Center!', 'A world-class Training Center!'],
  med: [null, 'The physio\'s little room', 'The medical department grew!', 'Sports medicine center!', 'Recovery center of the future!'],
  base: [null, 'The youth school has started!', 'A real youth academy!', 'A huge youth academy!', 'An elite academy!'],
  olheiro: [null, 'The first scout', 'A scouting office!', 'A worldwide scouting center!'],
  loja: [null, 'The little jersey stand', 'The official club store!', 'A mega store!'],
  torcida: [null, 'The first loyal fans', 'The club membership program!', 'A giant crowd of fans!'] };
function decoraClube(box) {
  const t = G.save.time; t.estr = Object.assign({ ct: 0, med: 0, estadio: 0, base: 0, olheiro: 0, loja: 0, torcida: 0 }, t.estr || {});
  const h = [...box.querySelectorAll('h3')].find(x => /Estrutura|Facilities|Structure/.test(x.textContent)); if (!h) return;
  const lista = h.nextElementSibling; if (!lista) return;
  const ks = Object.keys(ESTRUTURA); [...lista.children].forEach((row, i) => {
    const k = ks[i]; if (!k) return; const n = t.estr[k] || 0; const id = fotoEstr(k, n);
    const img = el('img', { class: 'cm-miniatura', src: cmImg(id), alt: ESTRUTURA[k].nome, title: 'See the photo', onclick: () => cmFoto(id, `${ESTRUTURA[k].nome} — level ${n}`, n ? ESTRUTURA[k].desc(n) : 'Not built yet: upgrade it to start construction!') });
    row.prepend(img);
  });
  h.after(el('p', { class: 'guia-legenda' }, `Each facility goes up to level ${ESTR_MAX} and changes its look as it grows. Tap the photo to see it up close.`));
  // álbum do clube: as fases que o clube já viveu
  const album = el('div', { class: 'cm-album' }, ...(t.album || []).map(a => el('figure', { onclick: () => cmFoto(a.id, a.legenda) }, el('img', { src: cmImg(a.id), alt: a.legenda }), el('figcaption', {}, a.legenda))));
  const hT = [...box.querySelectorAll('h3')].find(x => /Sala de troféus|Trophy room/.test(x.textContent));
  if (hT) hT.before(el('h3', {}, `📸 Club album (${(t.album || []).length})`), (t.album || []).length ? album : el('p', { class: 'vazio' }, 'Photos of the club\'s history show up here: new buildings, continental titles and the Global Club Super Cup.'));
}
// fase nova de uma estrutura = festa na tela (e foto no álbum)
function cmConfereFases() {
  const t = G.save.time; if (!t) return null; t.fotoEstr = t.fotoEstr || null;
  if (!t.fotoEstr) { t.fotoEstr = {}; for (const k in ESTR_FOTOS) { t.fotoEstr[k] = estagioEstr(k, t.estr[k] || 0); if (t.fotoEstr[k] || k === 'estadio') cmAlbum(fotoEstr(k, t.estr[k] || 0), `${ESTRUTURA[k].nome}: ${FRASE_FASE[k][t.fotoEstr[k]] || ''}`); } return null; }
  for (const k in ESTR_FOTOS) {
    const st = estagioEstr(k, t.estr[k] || 0);
    if (st > (t.fotoEstr[k] || 0)) { t.fotoEstr[k] = st; const id = fotoEstr(k, t.estr[k]); cmAlbum(id, `${ESTRUTURA[k].nome}: ${FRASE_FASE[k][st]} (T${t.temporada})`); salvar(); return [id, FRASE_FASE[k][st], `${ESTRUTURA[k].nome} level ${t.estr[k]}: ${ESTRUTURA[k].desc(t.estr[k])}`]; }
  }
  return null;
}
function cmExtrasPosJogo(pj, r) {
  const t = G.save.time; if (!t || !r) return; const P = premioDiv(t.div); const est = t.estr || {};
  const add = (rot, v) => { if (!v) return; t.caixa += v; t.finTemp.ent += v; r.fin.push([rot, v]); r.saldo = (r.saldo || 0) + v; };
  const mult = pj.tipo === 'copa' ? [1.5, 2, 3][pj.fase] || 1 : pj.tipo === 'cont' ? MULT_CONT[pj.fase] : pj.tipo === 'mundial' ? MULT_MUNDIAL[pj.fase] : 1;
  if (est.loja) add('Club store', Math.round(P * mult * 0.15 * estrMult(est.loja)));
  if (pj.casa && est.torcida) add('Club members', Math.round(P * 0.5 * (1 + 0.5 * estrMult(est.estadio || 0)) * 0.06 * estrMult(est.torcida, 1.35)));
  if (est.torcida) t.moral = Math.max(t.moral, -3 + Math.min(3, Math.ceil(est.torcida / 2)));
  if (t.desafioPatro && pj.tipo === 'liga') { if (r.venceu) { add('Sponsor challenge', t.desafioPatro); log(`🤝 Sponsor challenge completed: +${fmt(t.desafioPatro)} in the club bank!`, 'l-loot'); } else log('🤝 The sponsor challenge didn\'t work out this time.', 'l-info'); t.desafioPatro = 0; }
  t.fin = r.fin;
  t.opTemp = (t.opTemp || 0) + (r.saldo || 0); // v239: lucro dos jogos na temporada (prêmios, bilheteria, loja... menos salários)
  // título da copa nacional → coletiva de imprensa
  if (pj.tipo === 'copa' && t.copa && t.copa.status === 'campeao' && !t.copa._coletiva) { t.copa._coletiva = true; t.evento = cmEventoColetiva(t.copa.nome); }
  // eventos entre as rodadas
  if (pj.tipo === 'liga' && !t.evento) { t.semEvento = (t.semEvento || 0) + 1; if (t.semEvento >= 3 && Math.random() < 0.4) { const e = cmSorteiaEvento(); if (e) { t.evento = e; t.semEvento = 0; } } }
  salvar();
}

/* ============================================================
   3) EVENTOS DO CLUBE e COLETIVAS (escolhas com consequência)
   ============================================================ */
function cmJogadorAleatorio(filtro) { const t = G.save.time; const l = t.elenco.filter(j => !j.lenda && (!filtro || filtro(j))); return l.length ? l[rndi(0, l.length - 1)] : null; }
const EVENTOS_CLUBE = {
  aumento: () => { const j = cmJogadorAleatorio(); return j && { id: 'aumento', jid: j.id, titulo: `💬 ${j.nome} asks for a raise`, txt: `${j.nome} (${POS_NOME[j.pos]}) thinks they deserve more money after the last few games.` }; },
  proposta: () => { const t = G.save.time; const j = cmJogadorAleatorio(x => ovr(x) >= forcaTitulares() - 3); if (!j) return null; return { id: 'proposta', jid: j.id, valor: Math.round(precoJogador(j) * (1.3 + Math.random() * 0.5)), titulo: `📨 Offer for ${j.nome}`, txt: `A rival club wants to sign ${j.nome} (${POS_NOME[j.pos]}, power ${ovr(j)}).` }; },
  festa: () => ({ id: 'festa', titulo: '🎉 The fans want to throw a party', txt: 'The fans want to welcome the team with flags, drums and paper confetti at the next home game.' }),
  patrocinio: () => ({ id: 'patrocinio', valor: Math.round(CM_P() * 3), titulo: '🤝 Sponsor challenge', txt: 'A cleats brand promises a bonus if the team WINS the next league game.' }),
  imprensa: () => ({ id: 'imprensa', titulo: '📰 The press criticizes the team', txt: 'A newspaper wrote that the team "plays without heart". The players got upset.' }),
  lesao: () => { const j = cmJogadorAleatorio(x => G.save.time.titulares.includes(x.id)); return j && { id: 'lesao', jid: j.id, titulo: `🩹 ${j.nome} got hurt in training`, txt: `${j.nome} took a knock in training. The medical department (level ${G.save.time.estr.med || 0}) is checking it out.` }; },
  base: () => { const t = G.save.time; if (!t.base.length) return null; const j = [...t.base].sort((a, b) => b.pot - a.pot)[0]; return { id: 'base', jid: j.id, titulo: `🌱 ${j.nome} is shining in the youth team`, txt: `The young talent ${j.nome} (${POS_NOME[j.pos]}, potential ${j.pot}) scored 4 goals in the last U-17 game.` }; },
  social: () => ({ id: 'social', titulo: '💛 Invitation to a charity event', txt: 'A neighborhood school invited the team to a day of soccer with the kids.' }),
  amistoso: () => ({ id: 'amistoso', valor: Math.round(CM_P() * 4), titulo: '✈️ Invitation to a friendly abroad', txt: 'A summer tournament wants the team for an international friendly. It pays well, but it\'s tiring.' }),
};
function cmSorteiaEvento() { const ids = Object.keys(EVENTOS_CLUBE).sort(() => Math.random() - 0.5); for (const id of ids) { const e = EVENTOS_CLUBE[id](); if (e) return e; } return null; }
function cmEventoColetiva(nome) { return { id: 'coletiva', titulo: `🎤 Press conference: ${nome} champion!`, txt: 'The reporters want to know: what do you say after the title?' }; }
function cmOpcoesEvento(e) {
  const s = G.save; const t = s.time; const P = CM_P(); const j = e.jid && (t.elenco.find(x => x.id === e.jid) || t.base.find(x => x.id === e.jid));
  const moral = d => { t.moral = clamp(t.moral + d, -3, 3); };
  const todos = f => t.elenco.forEach(f);
  switch (e.id) {
    case 'aumento': return [
      [`Give a bonus (${fmt(Math.round(P * 1.5))})`, () => { if (t.caixa < P * 1.5) return 'The club bank doesn\'t have money for the bonus right now.'; t.caixa -= Math.round(P * 1.5); t.finTemp.sai -= Math.round(P * 1.5); moral(1); return `${j.nome} is happy and so is the locker room! Morale +1.`; }],
      ['Have a calm talk', () => Math.random() < 0.6 ? `${j.nome} understood: the club is growing and recognition will come.` : (moral(-1), `${j.nome} got a little upset. Morale −1.`)],
      ['Refuse', () => { moral(-1); return `${j.nome} didn't like it. Morale −1.`; }]];
    case 'proposta': return [
      [`Sell for ${fmt(e.valor)}`, () => { t.elenco = t.elenco.filter(x => x.id !== e.jid); t.titulares = t.titulares.map(id => id === e.jid ? null : id); autoEscalar(); t.caixa += e.valor; t.finTemp.ent += e.valor; return `${j.nome} was sold! +${fmt(e.valor)} in the club bank. The lineup was fixed automatically.`; }],
      ['Refuse: they stay!', () => { moral(1); return `${j.nome} is happy to be valued. Morale +1.`; }]];
    case 'festa': return [
      [`Support the party (${fmt(P)})`, () => { if (t.caixa < P) return 'No money for the party right now.'; t.caixa -= P; t.finTemp.sai -= P; moral(2); return 'What a party! The team took the field flying. Morale +2.'; }],
      ['Thank them on social media', () => { moral(1); return 'The fans loved it. Morale +1.'; }]];
    case 'patrocinio': return [
      ['Accept the challenge', () => { t.desafioPatro = e.valor; return `Deal: if you win the next league game, you get +${fmt(e.valor)}.`; }],
      ['Refuse', () => 'That\'s okay, the sponsor understands.']];
    case 'imprensa': return [
      ['Answer calmly and respectfully', () => { t.patro = Math.min(2, +(t.patro + 0.03).toFixed(2)); return 'The polite answer pleased the sponsor. Sponsorship +3%.'; }],
      ['"We\'ll answer on the field!"', () => { moral(1); return 'The squad got fired up! Morale +1.'; }]];
    case 'lesao': return [
      ['Rest and treat', () => { j.energia = (t.estr.med || 0) >= 3 ? 60 : 25; return `${j.nome} will recover calmly (energy ${j.energia}%).`; }],
      ['Take the risk and let them play', () => { if (Math.random() < 0.5) return `${j.nome} is fine, it was just a scare!`; j.energia = 0; moral(-1); return `${j.nome} felt it again and will need to rest (energy 0%). Morale −1.`; }]];
    case 'base': return [
      ['Promote to the first team', () => { if (t.elenco.length >= 19) return 'The squad is full (20). Sell someone first.'; t.base = t.base.filter(x => x.id !== e.jid); t.elenco.push(j); return `${j.nome} moved up to the first team!`; }],
      ['Let them grow a little more', () => { j.pot = Math.min(99, j.pot + 3); return `${j.nome} will train more in the youth team. Potential +3 (now ${j.pot}).`; }]];
    case 'social': return [
      ['Go with the whole squad', () => { todos(x => x.energia = Math.max(0, x.energia - 10)); moral(1); t.patro = Math.min(2, +(t.patro + 0.05).toFixed(2)); return 'The kids had a blast! Morale +1 and sponsorship +5% (the team got a little tired).'; }],
      [`Send signed jerseys (${fmt(Math.round(P * 0.5))})`, () => { t.caixa -= Math.round(P * 0.5); t.finTemp.sai -= Math.round(P * 0.5); t.patro = Math.min(2, +(t.patro + 0.03).toFixed(2)); return 'A lovely gift! Sponsorship +3%.'; }]];
    case 'amistoso': return [
      [`Accept (+${fmt(e.valor)})`, () => { t.caixa += e.valor; t.finTemp.ent += e.valor; todos(x => x.energia = Math.max(0, x.energia - 15)); return `Friendly played! +${fmt(e.valor)} in the club bank, but the team got tired (−15 energy).`; }],
      ['Refuse and rest', () => { todos(x => x.energia = Math.min(100, x.energia + 10)); return 'The team took the chance to rest (+10 energy).'; }]];
    case 'coletiva': return [
      ['"This title belongs to the fans!"', () => { moral(2); t.estr.torcida = t.estr.torcida || 0; return 'The fans went wild! Morale +2.'; }],
      ['"Congrats to our opponent, it was a great game."', () => { t.patro = Math.min(2, +(t.patro + 0.08).toFixed(2)); return 'Fair play that everyone admires. Sponsorship +8%.'; }],
      ['"I dedicate it to Campinho Village!"', () => { moral(1); G.save.ouro += Math.round(P * 2); return `The whole Village celebrated and sent a gift: +${fmt(Math.round(P * 2))} coins in your pocket. Morale +1.`; }]];
  }
  return [['OK', () => '']];
}
function cmCartaoEvento(aba) {
  const t = G.save.time; const e = t.evento; if (!e) return null;
  const ops = cmOpcoesEvento(e);
  return el('div', { class: 'cm-evento' }, el('b', {}, e.titulo), el('p', {}, e.txt), el('div', { class: 'opcoes' }, ...ops.map(([rot, fn]) => el('button', { class: 'btn amarelo mini', onclick: () => {
    const res = fn(); t.evento = null; if (res) log(`${e.titulo.replace(/^\S+\s/, '')}: ${res}`, 'l-info'); salvar(); abrirTime(aba); if (res) setTimeout(() => banner('Decision made', res.length > 70 ? res.slice(0, 68) + '…' : res), 50);
  } }, rot))));
}

/* ============================================================
   4) SELEÇÃO BRASILEIRA
   ============================================================ */
const NIVEL_SELECAO = 60;
// [id, nome, força, cor1, cor2, região]
const SELECOES = [
  ['argentina', 'Argentina', 74, '#74acdf', '#ffffff', 'sul'], ['franca', 'France', 74, '#1a2a6a', '#ffffff', 'eu'], ['espanha', 'Spain', 73, '#c60b1e', '#ffc400', 'eu'],
  ['inglaterra', 'England', 72, '#ffffff', '#1a2a6a', 'eu'], ['alemanha', 'Germany', 72, '#ffffff', '#1a1a1a', 'eu'], ['portugal', 'Portugal', 72, '#c8102e', '#006600', 'eu'],
  ['holanda', 'Netherlands', 70, '#ff7a1a', '#ffffff', 'eu'], ['italia', 'Italy', 70, '#1a4ad9', '#ffffff', 'eu'], ['belgica', 'Belgium', 69, '#d42a2a', '#1a1a1a', 'eu'],
  ['croacia', 'Croatia', 68, '#d42a2a', '#ffffff', 'eu'], ['uruguai', 'Uruguay', 68, '#6ab0e0', '#1a1a1a', 'sul'], ['colombia', 'Colombia', 67, '#f8d838', '#1a2a6a', 'sul'],
  ['marrocos', 'Morocco', 66, '#c1272d', '#006233', 'af'], ['suica', 'Switzerland', 65, '#d42a2a', '#ffffff', 'eu'], ['dinamarca', 'Denmark', 65, '#c8102e', '#ffffff', 'eu'],
  ['japao', 'Japan', 65, '#1a2a8a', '#ffffff', 'as'], ['mexico', 'Mexico', 65, '#006847', '#ffffff', 'nor'], ['eua', 'United States', 64, '#ffffff', '#1a2a6a', 'nor'],
  ['senegal', 'Senegal', 64, '#ffffff', '#1a8a3a', 'af'], ['equador', 'Ecuador', 63, '#f8d838', '#1a4ad9', 'sul'], ['nigeria', 'Nigeria', 62, '#1a8a3a', '#ffffff', 'af'],
  ['coreia', 'South Korea', 62, '#d42a2a', '#1a1a1a', 'as'], ['paraguai', 'Paraguay', 61, '#d42a2a', '#ffffff', 'sul'], ['chile', 'Chile', 61, '#d42a2a', '#1a2a6a', 'sul'],
  ['canada', 'Canada', 61, '#d42a2a', '#ffffff', 'nor'], ['peru', 'Peru', 60, '#ffffff', '#d42a2a', 'sul'], ['egito', 'Egypt', 60, '#d42a2a', '#ffffff', 'af'],
  ['gana', 'Ghana', 60, '#ffffff', '#1a1a1a', 'af'], ['australia', 'Australia', 60, '#f8d838', '#1a8a3a', 'as'], ['arabia', 'Saudi Arabia', 58, '#ffffff', '#1a8a3a', 'as'],
  ['venezuela', 'Venezuela', 58, '#8a1a2a', '#1a2a6a', 'sul'], ['catar', 'Qatar', 57, '#8a1538', '#ffffff', 'as'], ['bolivia', 'Bolivia', 56, '#1a8a3a', '#f8d838', 'sul'],
  ['china', 'China', 54, '#d42a2a', '#f8d838', 'as'],
].map(([id, nome, ovr, cor1, cor2, reg]) => ({ id, nome, ovr, cor1, cor2, reg }));
const CICLO_SEL = ['elim', 'america', 'elim', 'mundo'];
const TORNEIO_SEL = { elim: 'Qualifiers', america: 'Copa América', mundo: 'World Cup' };
const FASES_MATA = { america: ['Quarterfinals', 'Semifinal', 'Final'], mundo: ['Round of 16', 'Quarterfinals', 'Semifinal', 'Final'] };
const MULT_SEL = { elim: [1, 1, 1, 1], grupo: [1.2, 1.2, 1.2], 'Round of 16': 1.6, 'Quarterfinals': 2, Semifinal: 2.6, Final: 4 };
function forcaSelecao() { return clamp(Math.round(56 + G.save.nivel * 0.18), 60, 88); }
function selDados() {
  const s = G.save;
  if (!s.selecao) s.selecao = { ciclo: 0, titulos: { america: 0, mundo: 0 }, jogos: 0, vitorias: 0, gols: 0, historico: [], seed: (Math.random() * 1e9) | 0, torneio: null };
  const sel = s.selecao; if (!sel.torneio) sel.torneio = selNovoTorneio(sel);
  return sel;
}
function selSorteia(filtro, usados, n) {
  const pool = SELECOES.filter(x => filtro(x) && !usados.has(x.id)).sort(() => Math.random() - 0.5).slice(0, n);
  pool.forEach(x => usados.add(x.id)); return pool.map(x => ({ ...x }));
}
function selNovoTorneio(sel) {
  const tipo = CICLO_SEL[sel.ciclo % 4]; const usados = new Set(); const t = G.save.time;
  const T = { tipo, nome: `${TORNEIO_SEL[tipo]} ${2026 + sel.ciclo}`, jogos: [], status: 'vivo', grupo: null, libera: (t ? t.jogos : 0) };
  if (tipo === 'elim') selSorteia(x => x.reg === 'sul', usados, 4).forEach((a, i) => T.jogos.push({ fase: `Game ${i + 1}`, tipoFase: 'elim', adv: a, res: null }));
  else {
    const reg = tipo === 'america' ? x => x.reg === 'sul' || x.reg === 'nor' : () => true;
    const g = [...selSorteia(x => reg(x) && x.ovr >= 66, usados, 1), ...selSorteia(x => reg(x) && x.ovr >= 60 && x.ovr < 66, usados, 1), ...selSorteia(x => reg(x) && x.ovr < 62, usados, 1)];
    T.grupo = { times: [{ id: 'bra', nome: 'Brazil', ovr: forcaSelecao(), cor1: '#f8d838', cor2: '#1a9a3a' }, ...g].map(x => Object.assign(x, { pts: 0, gp: 0, gc: 0, j: 0 })) };
    g.forEach((a, i) => T.jogos.push({ fase: `Group stage — round ${i + 1}`, tipoFase: 'grupo', adv: a, res: null }));
    T.usados = [...usados];
  }
  return T;
}
function selProximo(sel) { return sel.torneio && sel.torneio.status === 'vivo' ? sel.torneio.jogos.find(j => !j.res) : null; }
function selLiberado(sel) { const t = G.save.time; return !t || t.jogos >= sel.torneio.libera; }
function selEscalacao() {
  const sel = selDados(); const f = forcaSelecao(); const slots = FORMACOES['4-3-3']; const r = mulberry(sel.seed + sel.ciclo);
  const eu = { ...jogadorEu(), energia: 100 }; let iEu = slots.indexOf(eu.pos); if (iEu < 0) iEu = slots.length - 1;
  const nomes = ['Pedrinho', 'Juninho', 'Rafinha', 'Dudu', 'Gabigol', 'Marquinhos', 'Danilo', 'Thiaguinho', 'Léo', 'Everton', 'Bruninho', 'Matheus', 'Alisson', 'Vitinho', 'Fabinho'];
  return slots.map((slot, i) => i === iEu ? { slot, j: eu } : { slot, j: Object.assign(geraJogador(slot, f, r), { energia: 100, nome: nomes[(i * 7 + sel.ciclo) % nomes.length] }) });
}
function selForcas(adv) {
  const esc = selEscalacao(); const nos = setores(esc, 'equilibrada', 1);
  const eles = setores(timeIA({ seed: hashTxt(adv.id) * 97 + 13, ovr: adv.ovr, formacao: '4-3-3' }), 'equilibrada');
  return { nos, eles, esc };
}
function selRegistra(jogo, gn, ge, pen) {
  const s = G.save; const sel = selDados(); const T = sel.torneio; const t = s.time;
  let venceu = gn > ge; const empate = gn === ge && !pen;
  if (pen) venceu = pen[0] > pen[1];
  jogo.res = { gn, ge, pen, venceu, empate };
  sel.jogos++; sel.gols += gn; if (venceu) sel.vitorias++;
  const mult = jogo.tipoFase === 'elim' ? 1 : jogo.tipoFase === 'grupo' ? 1.2 : MULT_SEL[jogo.fase] || 1.5;
  const baseXp = xpPara(s.nivel + 1) - xpPara(s.nivel);
  const xp = Math.round(baseXp * 0.05 * mult * (venceu ? 1 : empate ? 0.5 : 0.3)); const ouro = Math.round(s.nivel * 60 * mult * (venceu ? 1 : 0.4));
  ganhaXp(xp); s.ouro += ouro;
  T.libera = (t ? t.jogos : 0) + 2; // próxima Data FIFA: depois de mais 2 jogos do clube
  let txt = `Brazil ${gn} × ${ge} ${jogo.adv.nome}${pen ? ` (penalties ${pen[0]}×${pen[1]})` : ''}. ${venceu ? 'VICTORY!' : empate ? 'Draw.' : 'Loss.'} +${fmt(xp)} XP, +${fmt(ouro)} coins.`;
  // fase de grupos: os outros jogos da rodada e a classificação
  if (jogo.tipoFase === 'grupo') {
    const G2 = T.grupo.times; const bra = G2[0]; const adv = G2.find(x => x.id === jogo.adv.id);
    const reg = (a, b, x, y) => { a.j++; b.j++; a.gp += x; a.gc += y; b.gp += y; b.gc += x; if (x > y) a.pts += 3; else if (y > x) b.pts += 3; else { a.pts++; b.pts++; } };
    reg(bra, adv, gn, ge);
    const outros = G2.slice(1).filter(x => x !== adv && x.j < bra.j); if (outros.length === 2) { const [a, b] = outros; const A = setores(timeIA({ seed: hashTxt(a.id), ovr: a.ovr, formacao: '4-4-2' }), 'equilibrada'), B = setores(timeIA({ seed: hashTxt(b.id), ovr: b.ovr, formacao: '4-4-2' }), 'equilibrada'); const [x, y] = simRapida(A, B); reg(a, b, x, y); }
    if (T.jogos.filter(j => j.tipoFase === 'grupo').every(j => j.res)) {
      const tab = [...G2].sort((x, y) => y.pts - x.pts || (y.gp - y.gc) - (x.gp - x.gc) || y.gp - x.gp); const pos = tab.indexOf(bra) + 1;
      if (pos <= 2) { txt += ` Brazil finished ${pos}º in the group!`; selProximaFase(T, 0); } else { T.status = 'eliminado'; txt += ' Brazil was knocked out in the group stage...'; }
    }
  } else if (jogo.tipoFase === 'mata') {
    const fases = FASES_MATA[T.tipo]; const i = fases.indexOf(jogo.fase);
    if (!venceu) { T.status = 'eliminado'; txt += ` Knocked out in the ${jogo.fase}.`; }
    else if (i === fases.length - 1) {
      T.status = 'campeao'; sel.titulos[T.tipo]++; const bonusXp = baseXp * (T.tipo === 'mundo' ? 1.2 : 0.6); const bonusOuro = s.nivel * (T.tipo === 'mundo' ? 2500 : 900);
      ganhaXp(Math.round(bonusXp)); s.ouro += bonusOuro; s.flags['campeao_sel_' + T.tipo] = true;
      const item = T.tipo === 'mundo' ? 'medalha_mundo_sel' : 'medalha_copa_america'; if (recebeItem(item, 1) !== 'mochila') log(`The ${ITENS[item].nome} went to Storage (backpack full).`, 'l-loot');
      txt += ` 🏆 BRAZIL ARE ${T.nome.toUpperCase()} CHAMPIONS! +${fmt(Math.round(bonusXp))} XP and +${fmt(bonusOuro)} coins.`;
      banner('CHAMPIONS!', T.nome); som('nivel');
      sel._celebra = T.tipo === 'mundo' ? ['cap_sel_copa_mundo', `${T.nome.toUpperCase()} CHAMPIONS!`, `${s.nome} lifted the trophy with the National Team. All of Brazil is celebrating!`] : ['cap_sel_copa_america', `${T.nome.toUpperCase()} CHAMPIONS!`, 'The National Team is the best on the continent!'];
    } else { txt += ` Qualified for ${cmPara(fases[i + 1])} ${fases[i + 1]}!`; selProximaFase(T, i + 1); }
  }
  if (jogo.tipoFase === 'elim' && T.jogos.every(j => j.res)) { const pts = T.jogos.reduce((a, j) => a + (j.res.venceu ? 3 : j.res.empate ? 1 : 0), 0); T.status = 'fim'; txt += ` End of the Qualifiers: ${pts} points.${pts >= 7 ? ' Excellent run!' : ''}`; }
  if (T.status !== 'vivo') { sel.historico.unshift(`${T.nome}: ${T.status === 'campeao' ? '🏆 CHAMPION' : T.status === 'eliminado' ? 'eliminado' : 'finished'}`); sel.historico = sel.historico.slice(0, 12); sel.ciclo++; sel.torneio = selNovoTorneio(sel); }
  log(`⭐ National Team: ${txt}`, venceu ? 'l-lendario' : 'l-info'); salvar();
  return txt;
}
function selProximaFase(T, i) {
  const fases = FASES_MATA[T.tipo]; const usados = new Set(T.usados || []);
  const faixa = T.tipo === 'mundo' ? [[62, 68], [66, 71], [69, 73], [72, 75]][i] : [[60, 66], [64, 70], [68, 75]][i];
  const reg = T.tipo === 'america' ? x => x.reg === 'sul' || x.reg === 'nor' : () => true;
  let adv = selSorteia(x => reg(x) && x.ovr >= faixa[0] && x.ovr <= faixa[1], usados, 1)[0] || selSorteia(reg, usados, 1)[0];
  T.usados = [...usados]; T.jogos.push({ fase: fases[i], tipoFase: 'mata', adv, res: null });
}
function telaSelecao() {
  const s = G.save; const w = el('div');
  if (s.nivel < NIVEL_SELECAO) { w.append(el('h3', {}, bandeira('brasil'), ' Brazil national team'), el('p', {}, `When your star reaches level ${NIVEL_SELECAO}, the Brazil coach will call you up! Then you’ll play the Qualifiers, the Copa América and the WORLD CUP.`), el('p', { class: 'vazio' }, `You are at level ${s.nivel}.`)); return w; }
  const sel = selDados();
  if (!s.flags.convocado_selecao) { s.flags.convocado_selecao = true; salvar(); setTimeout(() => cmFoto('cap_sel_convocacao', 'YOU\'VE BEEN CALLED UP!', `${s.nome} will wear the famous yellow jersey! Every FIFA Date (every 2 club games) has a national team game.`), 60); }
  const T = sel.torneio; const prox = selProximo(sel);
  w.append(el('h3', {}, bandeira('brasil'), ` ${T.nome}`), el('p', {}, `National Team power: ${forcaSelecao()} (grows with your level). You play as ${POS_NOME[jogadorEu().pos]} and decide the big plays.`));
  if (T.grupo) {
    const tab = [...T.grupo.times].sort((x, y) => y.pts - x.pts || (y.gp - y.gc) - (x.gp - x.gc) || y.gp - x.gp);
    const tb = el('table', { class: 'tabela' }, el('tr', {}, ...['#', 'National Team', 'J', 'Pts', 'SG'].map(h => el('th', {}, h))), ...tab.map((x, i) => el('tr', { class: x.id === 'bra' ? 'eu' : '' }, el('td', {}, i + 1), el('td', {}, el('span', { class: 'mini-escudo', style: `background:linear-gradient(90deg,${x.cor1} 50%,${x.cor2} 50%)` }), ' ', x.nome), el('td', {}, x.j), el('td', {}, x.pts), el('td', {}, x.gp - x.gc))));
    w.append(el('small', {}, 'Group (top 2 advance):'), tb);
  }
  const lista = el('div', { class: 'lista' });
  T.jogos.forEach((j, i) => lista.append(el('div', { class: 'linha-item' }, el('b', { class: 'pos-tag' }, i + 1),
    el('div', { class: 'nm' }, el('b', {}, j.fase), el('small', {}, `Brazil vs ${j.adv.nome} (power ${j.adv.ovr})`)),
    el('b', {}, j.res ? `${j.res.gn} × ${j.res.ge}${j.res.pen ? ` (pen. ${j.res.pen[0]}×${j.res.pen[1]})` : ''}` : j === prox ? (selLiberado(sel) ? 'NEXT!' : 'on the next FIFA Date') : '—'))));
  w.append(lista);
  if (prox) {
    const lib = selLiberado(sel); const falta = s.time ? sel.torneio.libera - s.time.jogos : 0;
    const { nos, eles } = selForcas(prox.adv); let v = 0, e = 0; for (let i = 0; i < 300; i++) { const [a, b] = simRapida(nos, eles); if (a > b) v++; else if (a === b) e++; }
    w.append(el('p', { style: 'text-align:center' }, `Estimated chances against ${prox.adv.nome}: win ${Math.round(v / 3)}% · tie ${Math.round(e / 3)}% · loss ${Math.round((300 - v - e) / 3)}%`));
    w.append(el('div', { class: 'opcoes', style: 'justify-content:center' },
      el('button', { class: 'btn amarelo grande', disabled: lib ? null : 'disabled', onclick: () => selPartida(prox) }, lib ? '📺 Play for the National Team!' : `FIFA Date in ${falta} club game(s)`),
      el('button', { class: 'btn', disabled: lib ? null : 'disabled', onclick: () => { const [a, b] = simRapida(nos, eles); const pen = prox.tipoFase === 'mata' && a === b ? (Math.random() < 0.55 ? [5, 4] : [3, 4]) : null; const txt = selRegistra(prox, a, b, pen); cmFimSel(txt); } }, 'Simulate')));
  }
  w.append(el('h3', {}, '📜 National Team History'), el('p', {}, `Games: ${sel.jogos} · Wins: ${sel.vitorias} · Team goals: ${sel.gols} · Copa América: ${sel.titulos.america} 🏆 · World Cup: ${sel.titulos.mundo} 🏆`),
    sel.historico.length ? el('div', { class: 'trofeus' }, ...sel.historico.map(h => el('span', { class: 'trofeu' }, h))) : el('p', { class: 'vazio' }, 'The cycle: Qualifiers → Copa América → Qualifiers → WORLD CUP.'));
  return w;
}
function cmFimSel(txt) {
  const sel = G.save.selecao;
  const volta = () => { if (sel && sel._celebra) { const c = sel._celebra; sel._celebra = null; salvar(); cmFoto(c[0], c[1], c[2], () => abrirTime('selecao')); } else abrirTime('selecao'); };
  abreModal.largo = true;
  abreModal(el('h2', {}, bandeira('brasil'), ' National Team Result'), el('p', { style: 'text-align:center' }, txt), el('div', { class: 'opcoes', style: 'justify-content:center' }, el('button', { class: 'btn amarelo', onclick: volta }, 'Continue')));
}
// partida da Seleção: narração ao vivo, e nos lances importantes VOCÊ decide
function selPartida(jogo) {
  const s = G.save; const { nos, eles, esc } = selForcas(jogo.adv); const escE = timeIA({ seed: hashTxt(jogo.adv.id) * 97 + 13, ovr: jogo.adv.ovr, formacao: '4-3-3' });
  const euJ = esc.find(x => x.j.eu).j; let gn = 0, ge = 0, i = 0, dec = 0, pausa = false, fim = false, vel = 1000, timer = null;
  const minutos = Array.from({ length: 16 }, () => rndi(1, 90)).sort((a, b) => a - b);
  const placar = el('div', { class: 'placar-ao-vivo' }); const narr = el('div', { class: 'narracao' }); const escolha = el('div', { class: 'escolha' }); const ctl = el('div', { class: 'opcoes', style: 'justify-content:center' });
  const atu = min => { placar.innerHTML = ''; placar.append(el('span', {}, bandeira('brasil'), ' Brazil'), el('b', {}, `${gn} × ${ge}`), el('span', {}, jogo.adv.nome), el('small', {}, min != null ? `${min}'` : '')); };
  const diz = (txt, cls = '') => narr.prepend(el('div', { class: cls }, txt));
  const nome = (lista, pesos) => { const l = lista.filter(x => x.j); const tot = l.reduce((a, x) => a + (pesos[x.slot] || 0.2), 0); let r = Math.random() * tot; for (const x of l) { r -= pesos[x.slot] || 0.2; if (r <= 0) return x.j; } return l[0].j; };
  const ATQ = { ATA: 3, MEI: 2, LAT: 1, VOL: 0.5, ZAG: 0.2, GOL: 0 };
  function prox() {
    if (pausa || fim) return; if (i >= minutos.length) return terminar();
    const min = minutos[i++]; atu(min); if (i === 9) diz("45' End of the first half.", 'n-sis');
    const r = lance(nos, eles); const X = r.atacaA ? esc : escE; const at = nome(X, ATQ); const nt = r.atacaA ? 'Brazil' : jogo.adv.nome;
    if (r.atacaA && r.tipo !== 'desarme' && dec < 3 && (at.eu || Math.random() < 0.3)) { dec++; return decide(min); }
    if (r.tipo === 'desarme') diz(`${min}' ${at.nome} tries a move, but loses the ball.`);
    else if (r.tipo === 'fora') diz(`${min}' ${at.nome} (${nt}) shoots... wide!`);
    else if (r.tipo === 'defesa') diz(`${min}' ${at.nome} goes for it and the goalkeeper makes a huge save!`, 'n-def');
    else { if (r.atacaA) gn++; else ge++; diz(`${min}' GOOOOAL ${r.atacaA ? 'FOR BRAZIL' : 'de ' + nt}! ${at.nome} scores!`, r.atacaA ? 'n-gol' : 'n-golc'); som(r.atacaA ? 'gol' : 'ai'); }
    atu(min); timer = setTimeout(prox, vel);
  }
  function decide(min) {
    pausa = true; diz(`${min}' The ball comes to YOU, ${s.nome}, at the edge of the box!`, 'n-eu');
    const dm = eles.def / 4.3, gk = eles.gol;
    const pC = clamp(0.25 + (euJ.chu - gk) * 0.012, 0.05, 0.8), pD = clamp(0.5 + (euJ.drb - dm) * 0.015, 0.1, 0.9), pP = clamp(0.6 + (euJ.pas - dm) * 0.012, 0.2, 0.92);
    const res = (gol, txt) => { escolha.innerHTML = ''; pausa = false; if (gol) { gn++; som('gol'); } diz(`${min}' ${txt}`, gol ? 'n-gol' : ''); atu(min); timer = setTimeout(prox, vel); };
    const b = (rot, p, fn) => el('button', { class: 'btn amarelo', onclick: fn }, `${rot} (${Math.round(p * 100)}%)`);
    escolha.innerHTML = ''; escolha.append(el('p', {}, 'What do you do?'), el('div', { class: 'opcoes', style: 'justify-content:center' },
      b('Shoot', pC, () => Math.random() < pC ? res(true, `SCREAMER BY ${s.nome.toUpperCase()} IN THE YELLOW JERSEY!`) : res(false, `${s.nome} shoots and the goalkeeper saves it!`)),
      b('Dribble', pD, () => { if (Math.random() < pD) { Math.random() < clamp(0.45 + (euJ.chu - gk) * 0.01, 0.15, 0.85) ? res(true, `${s.nome} dribbles past two and scores! What a screamer!`) : res(false, `${s.nome} gets past the defender, but the goalkeeper saves it!`); } else res(false, `${s.nome} tries to dribble and loses the ball.`); }),
      b('Pass', pP, () => { if (Math.random() < pP) { const c = nome(esc.filter(x => !x.j.eu), ATQ); Math.random() < 0.42 ? res(true, `${s.nome} makes a perfect pass and ${c.nome} scores!`) : res(false, `${s.nome} passes to ${c.nome}, who shoots over the bar.`); } else res(false, `${s.nome}'s pass is intercepted.`); })));
  }
  function terminar() {
    fim = true; clearTimeout(timer); escolha.innerHTML = ''; let pen = null;
    if (jogo.tipoFase === 'mata' && gn === ge) { const ok = Math.random() < clamp(0.5 + (nos.gol - eles.gol) * 0.006, 0.3, 0.75); pen = ok ? [rndi(4, 5), rndi(2, 3)] : [rndi(2, 3), rndi(4, 5)]; diz(`Tie! Penalties... ${pen[0]} × ${pen[1]}!`, 'n-sis'); }
    const txt = selRegistra(jogo, gn, ge, pen); diz(`Full time! ${txt}`, 'n-sis'); som((pen ? pen[0] > pen[1] : gn > ge) ? 'nivel' : 'apito');
    ctl.innerHTML = ''; ctl.append(el('button', { class: 'btn amarelo', onclick: () => cmFimSel(txt) }, 'Continue'));
  }
  ctl.append(el('button', { class: 'btn', onclick: () => { vel = vel === 1000 ? 380 : 1000; } }, 'Speed'), el('button', { class: 'btn', onclick: () => { vel = 30; } }, 'Skip'));
  window.pararPartida = () => { if (!fim) { clearTimeout(timer); fim = true; } window.pararPartida = null; };
  abreModal.largo = true;
  abreModal(el('h2', {}, bandeira('brasil'), ` ${selDados().torneio.nome} — ${jogo.fase}`), placar, escolha, ctl, narr);
  $('#modal .fechar').hidden = true; const vig = setInterval(() => { if (fim) { $('#modal .fechar').hidden = false; clearInterval(vig); } }, 300);
  atu(0); diz("0' Kickoff! The anthem has played and the stadium is packed in green and yellow.", 'n-sis'); som('apito'); timer = setTimeout(prox, 900);
}
Object.assign(ITENS, {
  medalha_copa_america: { nome: 'Copa América Medal', tipo: 'chave', desc: 'Copa América champion with the Brazil national team!' },
  medalha_mundo_sel: { nome: 'World Champion Medal (National Team)', tipo: 'chave', desc: 'World Cup champion with the Brazil national team! The dream of every kid on the little pitch.' },
});
if (typeof ICON_ALIAS !== 'undefined') { ICON_ALIAS.medalha_copa_america = 'i_medalha_ouro'; ICON_ALIAS.medalha_mundo_sel = 'i_medalha_copa'; }

/* ============================================================
   5) A TELA DO CLUBE: abas novas, evento do dia e festa das obras
   ============================================================ */
{
  const _abrirCM = abrirTime;
  abrirTime = function (aba = 'elenco') {
    const s = G.save; const t = s.time;
    // festa pendente (título continental / Mundial): primeiro a foto, depois a tela
    if (t && t._celebra && t._celebra.length) { const c = t._celebra.shift(); salvar(); if (!$('#modal').hidden) fechaModal(); cmFoto(c[0], c[1], c[2], () => abrirTime(aba)); return; }
    const minha = aba === 'cont' || aba === 'selecao';
    const r = _abrirCM.call(this, minha ? 'liga' : aba);
    if (!t) return r;
    const box = document.getElementById('modalConteudo'); const tabs = box && box.querySelector('.tabs-modal'); if (!tabs) return r;
    const jogarBt = [...tabs.children].find(b => /Jogar partida|Play match/.test(b.textContent));
    const mk = (id, rot) => el('button', { class: 'btn' + (aba === id ? ' amarelo' : ''), onclick: () => abrirTime(id) }, rot);
    const bC = mk('cont', '🌎 Continental'), bS = mk('selecao', '⭐ National Team');
    if (jogarBt) { tabs.insertBefore(bC, jogarBt); tabs.insertBefore(bS, jogarBt); } else tabs.append(bC, bS);
    if (minha) {
      [...tabs.children].forEach(b => { if (b !== bC && b !== bS && !/Como funciona|How (?:it|My Team) works/.test(b.textContent)) b.classList.remove('amarelo'); });
      let n = tabs.nextSibling; while (n) { const nx = n.nextSibling; n.remove(); n = nx; }
      box.append(aba === 'cont' ? telaContinental() : telaSelecao());
    }
    if (aba === 'clube') decoraClube(box);
    const card = cmCartaoEvento(aba); if (card) tabs.after(card);
    // obra que mudou de fase: festa com a foto nova
    const fase = cmConfereFases(); if (fase) setTimeout(() => cmFoto(fase[0], fase[1], fase[2]), 80);
    return r;
  };
}
{
  const st = document.createElement('style');
  st.textContent = `.cm-foto { position: fixed; inset: 0; z-index: 9500; background: rgba(12,6,30,.82); display: flex; align-items: center; justify-content: center; padding: 16px; }
  .cm-foto-caixa { box-sizing: border-box; background: #fff8e8; color: #3b2410; border: 4px solid #3b2410; border-radius: 16px; padding: 12px; width: min(900px, 96vw); max-height: 94vh; overflow-y: auto; overflow-x: hidden; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,.5); }
  .cm-foto-caixa img { width: 100%; border-radius: 10px; display: block; }
  .cm-foto-caixa h3 { margin: 10px 0 4px; color: #3b2410; font-size: 22px; } .cm-foto-caixa p { margin: 4px 0 10px; color: #5a3a1a; font-size: 15px; }
  .cm-miniatura { width: 86px; height: 48px; object-fit: cover; border-radius: 6px; border: 2px solid #3b2410; cursor: zoom-in; flex: none; margin-right: 8px; }
  .cm-album { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin: 6px 0; }
  .cm-album figure { margin: 0; cursor: zoom-in; } .cm-album img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 8px; border: 2px solid #3b2410; display: block; }
  .cm-album figcaption { font-size: 11px; line-height: 1.2; margin-top: 2px; }
  .cm-evento { margin: 8px 0; padding: 10px 12px; border-radius: 12px; background: #eef4ff; border: 2px solid #3a6ad9; }
  .cm-evento p { margin: 4px 0 8px; }`;
  document.head.append(st);
}

/* v239: quanto cada obra de renda rende por temporada e em quantas temporadas se paga (aparece na lista de Estrutura) */
function estrRendaTxt(k, n) {
  const t = G.save && G.save.time; if (!t || !['estadio', 'loja', 'torcida'].includes(k) || n >= ESTR_MAX) return null;
  const P = premioDiv(t.div), e = t.estr || {}, casa = 10, jogos = 20; const d = k === 'torcida' ? estrMult(n + 1, 1.35) - estrMult(n, 1.35) : estrMult(n + 1) - estrMult(n);
  const ganho = Math.round(k === 'estadio' ? P * 0.5 * 0.5 * d * casa * (1 + 0.06 * estrMult(e.torcida || 0, 1.35))
    : k === 'loja' ? P * 0.15 * d * jogos
    : P * 0.5 * (1 + 0.5 * estrMult(e.estadio || 0)) * 0.06 * d * casa);
  const temps = custoEstr(k, n) / Math.max(1, ganho);
  return el('small', { class: 'cm-renda' }, `💰 Next level earns +${fmt(ganho)} per season in the current division · pays for itself in ~${temps < 1 ? 'less than 1 season' : Math.ceil(temps) + (Math.ceil(temps) > 1 ? ' temporadas' : ' temporada')}`);
}
{ const st = document.createElement('style'); st.textContent = '.cm-renda { display: block; color: #2f7a2f; font-weight: 800; margin-top: 2px; }'; document.head.append(st); }
