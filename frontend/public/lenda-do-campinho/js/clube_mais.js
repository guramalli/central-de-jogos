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
    el('button', { class: 'btn amarelo', onclick: () => { ov.remove(); if (aoFechar) aoFechar(); } }, 'Continuar')));
  document.body.append(ov); return ov;
}
function cmAlbum(id, legenda) { const t = G.save.time; t.album = t.album || []; if (!t.album.some(a => a.id === id)) t.album.push({ id, legenda, temp: t.temporada }); }

/* ============================================================
   1) COPAS CONTINENTAIS e MUNDIAL INTERCLUBES
   ============================================================ */
const CONTINENTES = {
  sul: { nome: 'Copa Libertadores', paises: ['brasil', 'argentina', 'uruguai', 'colombia'] },
  europa: { nome: 'Liga dos Campeões', paises: ['portugal', 'franca', 'alemanha', 'italia', 'espanha', 'inglaterra', 'escocia', 'turquia', 'belgica', 'holanda'] },
  norte: { nome: 'Copa dos Campeões da Concacaf', paises: ['eua', 'mexico'] },
  asia: { nome: 'Liga dos Campeões da Ásia', paises: ['japao', 'catar', 'china', 'arabia'] },
  africa: { nome: 'Liga dos Campeões da África', paises: ['egito'] },
};
const contDe = pid => Object.keys(CONTINENTES).find(k => CONTINENTES[k].paises.includes(pid));
const FASES_CONT = ['Oitavas de final', 'Quartas de final', 'Semifinal', 'Final'];
const GAT_CONT = [2, 6, 10, 14];            // rodadas da liga depois das quais cada fase abre
const MULT_CONT = [2, 2.5, 3.2, 4.5];
const FASES_MUNDIAL = ['Semifinal do Mundial', 'Final do Mundial'];
const MULT_MUNDIAL = [5, 7];
const cmPara = f => /^(Oitavas|Quartas)/.test(f) ? 'as' : 'a'; // "para as Quartas", "para a Final"
const cmDa = nome => /^Mundial/.test(nome) ? 'do' : 'da'; // "a Final do Mundial", "a Final da Libertadores"
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
  return { nome: 'Mundial Interclubes', fase: 0, status: 'vivo', advs: [semi, final], res: [] };
}
// quem termina entre os 2 primeiros da liga PRINCIPAL vai para a copa continental da próxima temporada
{
  const _fimTempCM = fimTemporada;
  fimTemporada = function () {
    const t = G.save.time; const d = DIVS[t.div]; const pos = minhaPosicao(); const pais = t.pais;
    const vaga = d && d.topo && pos <= 2 && contDe(pais);
    // v239: 25% do lucro dos jogos da temporada vai para o seu bolso (o dono também ganha!)
    const lucro = Math.round(t.opTemp || 0), parte = Math.max(0, Math.min(Math.round(lucro * 0.25), Math.floor(t.caixa))); t.opTemp = 0;
    if (parte > 0) { t.caixa -= parte; G.save.ouro += parte; log(`💼 Sua parte do lucro da temporada: +${fmt(parte)} tostões no seu bolso.`, 'l-loot'); }
    const r = _fimTempCM.apply(this, arguments);
    { const box = document.getElementById('modalConteudo'), bt = box && box.querySelector('.opcoes'); if (bt) bt.before(el('p', { class: 'meta-linha' }, parte > 0 ? `💼 Lucro dos jogos: ${fmt(lucro)}. Sua parte de dono (25%): +${fmt(parte)} tostões no seu bolso!` : `💼 A temporada não deu lucro nos jogos (${fmt(lucro)}), então não teve parte do dono. Estádio, loja e sócio-torcedor aumentam a renda.`)); }
    if (vaga) {
      t.cont = novaContinental(vaga);
      log(`🌎 VAGA CONTINENTAL! O ${t.nome} vai disputar a ${t.cont.nome} nesta temporada (aba 🌎 Continental).`, 'l-lendario');
      const box = document.getElementById('modalConteudo'); if (box) { const bt = box.querySelector('.opcoes'); if (bt) bt.before(el('p', { class: 'meta-linha' }, `🌎 Classificado para a ${t.cont.nome}! Os jogos acontecem entre as rodadas da liga.`)); }
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
      const pv = [...w.querySelectorAll('p.vazio')].find(p => /Prêmio por vitória/.test(p.textContent));
      if (pv) pv.textContent = `Prêmio por vitória: ${fmt(Math.round(CM_P() * mult))} tostões (+25% de bicho no seu bolso) e ${fmt(Math.round(xpDiv(G.save.time.div) * mult))} XP. Empate no mata-mata vai para os pênaltis.`;
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
  const fin = [['Prêmio da partida', premio]];
  if (pj.casa) fin.push(['Bilheteria', Math.round(P * 0.8 * (1 + 0.5 * (est.estadio || 0)) * (1 + t.moral * 0.08))]);
  const saldo = fin.reduce((a, [, v]) => a + v, 0); t.caixa += saldo; t.fin = fin; fin.forEach(([, v]) => { if (v >= 0) t.finTemp.ent += v; else t.finTemp.sai += v; });
  s.ouro += bicho; ganhaXp(xp);
  if (venceu) { t.vitorias++; t.moral = Math.min(3, t.moral + 1); } else t.moral = Math.max(-3, t.moral - 1);
  const placar = `${t.nome} ${gn} × ${ge} ${pj.adv.nome}${pen ? ` (pênaltis ${pen[0]}×${pen[1]})` : ''}`;
  T.res[pj.fase] = { gn, ge, pen, venceu };
  let txt;
  const nFases = cont ? 4 : 2;
  if (venceu) {
    T.fase++;
    if (T.fase >= nFases) {
      T.status = 'campeao'; const bonus = Math.round(P * (cont ? 10 : 18)); t.caixa += bonus; t.finTemp.ent += bonus; t.trofeus.push({ nome: T.nome, temp: t.temporada }); t.titulos++;
      s.flags[cont ? 'campeao_cont_' + T.cont : 'campeao_mundial_interclubes'] = true;
      banner(cont ? 'CAMPEÃO CONTINENTAL!' : 'CAMPEÃO DO MUNDO!', T.nome); som('nivel');
      txt = `CAMPEÃO ${cmDa(T.nome).toUpperCase()} ${T.nome.toUpperCase()}! +${fmt(bonus)} no caixa.`;
      t._celebra = t._celebra || [];
      if (cont) { t.mundial = novoMundial(T.cont); txt += ' O clube vai disputar o MUNDIAL INTERCLUBES!'; t._celebra.push(['cap_clube_continental', `Campeão da ${T.nome}!`, `O ${t.nome} é o melhor do continente. Agora o Mundial Interclubes espera por vocês!`]); cmAlbum('cap_clube_continental', `Campeão da ${T.nome} (T${t.temporada})`); }
      else { if (recebeItem('medalha_ouro', 1) !== 'mochila') log('A Medalha de Ouro foi para o armazém (mochila cheia).', 'l-loot'); t._celebra.push(['cap_clube_mundial', 'CAMPEÃO DO MUNDIAL INTERCLUBES!', `O clube que nasceu na Várzea agora é o melhor do planeta! Você ganhou uma Medalha de Ouro.`]); cmAlbum('cap_clube_mundial', `Campeão do Mundial Interclubes (T${t.temporada})`); }
      t.evento = cmEventoColetiva(T.nome);
    } else txt = cont ? `Classificado para ${cmPara(FASES_CONT[T.fase])} ${FASES_CONT[T.fase]} ${cmDa(T.nome)} ${T.nome}!` : `Classificado para a ${FASES_MUNDIAL[T.fase]}!`;
  } else { T.status = 'eliminado'; txt = `Eliminado ${cmDa(T.nome)} ${T.nome}.`; }
  if (typeof carreiraEvento === 'function') carreiraEvento('partida', { vitoria: venceu });
  log(`${placar}. ${txt} +${fmt(bicho)} tostões, +${fmt(xp)} XP.`, venceu ? 'l-xp' : 'l-info');
  salvar();
  return { txt: `${placar}. ${txt}`, venceu, empate: false, pen, bicho, xp, fin, saldo };
}
function telaContinental() {
  const t = G.save.time; const w = el('div'); const L = t.liga;
  const bloco = (T, fases, gat) => {
    w.append(el('h3', {}, `${T.nome === 'Mundial Interclubes' ? '🌍' : '🌎'} ${T.nome}`));
    const lista = el('div', { class: 'lista' });
    fases.forEach((f, i) => {
      const adv = T.advs[i]; const r = T.res[i]; let st;
      if (r) st = `${r.gn} × ${r.ge}${r.pen ? ` (pên. ${r.pen[0]}×${r.pen[1]})` : ''} — ${r.venceu ? 'classificado!' : 'eliminado'}`;
      else if (T.status !== 'vivo' || i > T.fase) st = T.status === 'eliminado' ? '—' : gat ? `depois da rodada ${gat[i]}` : 'a seguir';
      else st = !gat || L.rodada >= gat[i] ? 'PRÓXIMO JOGO!' : `depois da rodada ${gat[i]}`;
      lista.append(el('div', { class: 'linha-item' + (T.status === 'eliminado' && !r ? ' bloq' : '') }, el('b', { class: 'pos-tag' }, i + 1),
        el('div', { class: 'nm' }, el('b', {}, f), el('small', {}, i <= T.fase || r ? `vs ${adv.nome}${adv.pais && PAIS[adv.pais] ? ' (' + PAIS[adv.pais].nome + ')' : ''} · força ${adv.ovr}` : 'adversário a definir')), el('b', {}, st)));
    });
    w.append(lista);
    if (T.status === 'campeao') w.append(el('p', { class: 'meta-linha' }, `🏆 CAMPEÃO da ${T.nome}!`));
    if (T.status === 'eliminado') w.append(el('p', { class: 'vazio' }, 'Eliminado desta vez. Termine entre os 2 primeiros da liga principal para voltar!'));
  };
  if (t.mundial) bloco(t.mundial, FASES_MUNDIAL, null);
  if (t.cont) bloco(t.cont, FASES_CONT, GAT_CONT);
  if (!t.cont && !t.mundial) {
    const c = contDe(t.pais); const d = DIVS[t.div];
    w.append(el('h3', {}, '🌎 Copas continentais'), el('p', {}, c ? `Termine entre os 2 PRIMEIROS da liga principal de ${PAIS[t.pais].nome} (${PAIS[t.pais].divs[PAIS[t.pais].divs.length - 1][0]}) para disputar a ${CONTINENTES[c].nome} na temporada seguinte.${d && !d.topo ? ' Primeiro, suba até a divisão principal!' : ''}` : 'No Mundial de Clubes não há copa continental.'),
      el('p', {}, 'O campeão continental ganha vaga no MUNDIAL INTERCLUBES, contra os campeões dos outros continentes.'));
  }
  const tit = Object.entries(CONTINENTES).filter(([k]) => G.save.flags['campeao_cont_' + k]).map(([, C]) => C.nome);
  if (tit.length || G.save.flags.campeao_mundial_interclubes) w.append(el('p', {}, `🏆 Títulos internacionais: ${[...tit, G.save.flags.campeao_mundial_interclubes ? 'Mundial Interclubes' : null].filter(Boolean).join(', ')}.`));
  if (proximoJogo() && ['cont', 'mundial'].includes(proximoJogo().tipo)) w.append(el('div', { class: 'opcoes', style: 'justify-content:center' }, el('button', { class: 'btn amarelo', onclick: () => abrirTime('jogar') }, '⚽ Ir para o jogo')));
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
const FRASE_FASE = { estadio: ['O campinho de terra', 'O primeiro estádio de verdade!', 'O estádio cresceu!', 'Um estádio moderno!', 'Uma ARENA gigante!'],
  ct: [null, 'O primeiro campo de treino', 'Um CT de verdade!', 'Um CT moderno!', 'Um CT de nível mundial!'],
  med: [null, 'A salinha do fisioterapeuta', 'O departamento médico cresceu!', 'Centro de medicina esportiva!', 'Centro de recuperação do futuro!'],
  base: [null, 'A escolinha começou!', 'Uma categoria de base de verdade!', 'Uma base enorme!', 'Uma academia de elite!'],
  olheiro: [null, 'O primeiro olheiro', 'Um escritório de observação!', 'Uma central de olheiros mundial!'],
  loja: [null, 'A barraquinha de camisas', 'A loja oficial do clube!', 'Uma megaloja!'],
  torcida: [null, 'Os primeiros torcedores fiéis', 'O programa de sócio-torcedor!', 'Uma torcida gigante!'] };
function decoraClube(box) {
  const t = G.save.time; t.estr = Object.assign({ ct: 0, med: 0, estadio: 0, base: 0, olheiro: 0, loja: 0, torcida: 0 }, t.estr || {});
  const h = [...box.querySelectorAll('h3')].find(x => /Estrutura/.test(x.textContent)); if (!h) return;
  const lista = h.nextElementSibling; if (!lista) return;
  const ks = Object.keys(ESTRUTURA); [...lista.children].forEach((row, i) => {
    const k = ks[i]; if (!k) return; const n = t.estr[k] || 0; const id = fotoEstr(k, n);
    const img = el('img', { class: 'cm-miniatura', src: cmImg(id), alt: ESTRUTURA[k].nome, title: 'Ver a foto', onclick: () => cmFoto(id, `${ESTRUTURA[k].nome} — nível ${n}`, n ? ESTRUTURA[k].desc(n) : 'Ainda não construído: melhore para começar a obra!') });
    row.prepend(img);
  });
  h.after(el('p', { class: 'guia-legenda' }, `Cada estrutura vai até o nível ${ESTR_MAX} e muda de cara conforme cresce. Toque na foto para ver de perto.`));
  // álbum do clube: as fases que o clube já viveu
  const album = el('div', { class: 'cm-album' }, ...(t.album || []).map(a => el('figure', { onclick: () => cmFoto(a.id, a.legenda) }, el('img', { src: cmImg(a.id), alt: a.legenda }), el('figcaption', {}, a.legenda))));
  const hT = [...box.querySelectorAll('h3')].find(x => /Sala de troféus/.test(x.textContent));
  if (hT) hT.before(el('h3', {}, `📸 Álbum do clube (${(t.album || []).length})`), (t.album || []).length ? album : el('p', { class: 'vazio' }, 'As fotos da história do clube aparecem aqui: obras novas, títulos continentais e o Mundial.'));
}
// fase nova de uma estrutura = festa na tela (e foto no álbum)
function cmConfereFases() {
  const t = G.save.time; if (!t) return null; t.fotoEstr = t.fotoEstr || null;
  if (!t.fotoEstr) { t.fotoEstr = {}; for (const k in ESTR_FOTOS) { t.fotoEstr[k] = estagioEstr(k, t.estr[k] || 0); if (t.fotoEstr[k] || k === 'estadio') cmAlbum(fotoEstr(k, t.estr[k] || 0), `${ESTRUTURA[k].nome}: ${FRASE_FASE[k][t.fotoEstr[k]] || ''}`); } return null; }
  for (const k in ESTR_FOTOS) {
    const st = estagioEstr(k, t.estr[k] || 0);
    if (st > (t.fotoEstr[k] || 0)) { t.fotoEstr[k] = st; const id = fotoEstr(k, t.estr[k]); cmAlbum(id, `${ESTRUTURA[k].nome}: ${FRASE_FASE[k][st]} (T${t.temporada})`); salvar(); return [id, FRASE_FASE[k][st], `${ESTRUTURA[k].nome} nível ${t.estr[k]}: ${ESTRUTURA[k].desc(t.estr[k])}`]; }
  }
  return null;
}
function cmExtrasPosJogo(pj, r) {
  const t = G.save.time; if (!t || !r) return; const P = premioDiv(t.div); const est = t.estr || {};
  const add = (rot, v) => { if (!v) return; t.caixa += v; t.finTemp.ent += v; r.fin.push([rot, v]); r.saldo = (r.saldo || 0) + v; };
  const mult = pj.tipo === 'copa' ? [1.5, 2, 3][pj.fase] || 1 : pj.tipo === 'cont' ? MULT_CONT[pj.fase] : pj.tipo === 'mundial' ? MULT_MUNDIAL[pj.fase] : 1;
  if (est.loja) add('Loja do clube', Math.round(P * mult * 0.15 * estrMult(est.loja)));
  if (pj.casa && est.torcida) add('Sócio-torcedor', Math.round(P * 0.5 * (1 + 0.5 * estrMult(est.estadio || 0)) * 0.06 * estrMult(est.torcida, 1.35)));
  if (est.torcida) t.moral = Math.max(t.moral, -3 + Math.min(3, Math.ceil(est.torcida / 2)));
  if (t.desafioPatro && pj.tipo === 'liga') { if (r.venceu) { add('Desafio do patrocinador', t.desafioPatro); log(`🤝 Desafio do patrocinador cumprido: +${fmt(t.desafioPatro)} no caixa!`, 'l-loot'); } else log('🤝 O desafio do patrocinador não saiu desta vez.', 'l-info'); t.desafioPatro = 0; }
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
  aumento: () => { const j = cmJogadorAleatorio(); return j && { id: 'aumento', jid: j.id, titulo: `💬 ${j.nome} pede aumento`, txt: `${j.nome} (${POS_NOME[j.pos]}) acha que merece ganhar mais depois das últimas partidas.` }; },
  proposta: () => { const t = G.save.time; const j = cmJogadorAleatorio(x => ovr(x) >= forcaTitulares() - 3); if (!j) return null; return { id: 'proposta', jid: j.id, valor: Math.round(precoJogador(j) * (1.3 + Math.random() * 0.5)), titulo: `📨 Proposta por ${j.nome}`, txt: `Um clube rival quer contratar ${j.nome} (${POS_NOME[j.pos]}, força ${ovr(j)}).` }; },
  festa: () => ({ id: 'festa', titulo: '🎉 A torcida quer fazer festa', txt: 'Os torcedores querem receber o time com bandeiras, batucada e fogos de papel picado no próximo jogo em casa.' }),
  patrocinio: () => ({ id: 'patrocinio', valor: Math.round(CM_P() * 3), titulo: '🤝 Desafio do patrocinador', txt: 'Uma marca de chuteiras promete um bônus se o time VENCER o próximo jogo da liga.' }),
  imprensa: () => ({ id: 'imprensa', titulo: '📰 A imprensa critica o time', txt: 'Um jornal escreveu que o time "joga sem vontade". Os jogadores ficaram chateados.' }),
  lesao: () => { const j = cmJogadorAleatorio(x => G.save.time.titulares.includes(x.id)); return j && { id: 'lesao', jid: j.id, titulo: `🩹 ${j.nome} sentiu no treino`, txt: `${j.nome} sentiu uma pancada no treino. O departamento médico (nível ${G.save.time.estr.med || 0}) está avaliando.` }; },
  base: () => { const t = G.save.time; if (!t.base.length) return null; const j = [...t.base].sort((a, b) => b.pot - a.pot)[0]; return { id: 'base', jid: j.id, titulo: `🌱 ${j.nome} está brilhando na base`, txt: `A promessa ${j.nome} (${POS_NOME[j.pos]}, potencial ${j.pot}) fez 4 gols no último jogo do sub-17.` }; },
  social: () => ({ id: 'social', titulo: '💛 Convite para uma ação social', txt: 'Uma escola do bairro convidou o time para um dia de futebol com as crianças.' }),
  amistoso: () => ({ id: 'amistoso', valor: Math.round(CM_P() * 4), titulo: '✈️ Convite para amistoso no exterior', txt: 'Um torneio de verão quer o time para um amistoso internacional. Paga bem, mas cansa.' }),
};
function cmSorteiaEvento() { const ids = Object.keys(EVENTOS_CLUBE).sort(() => Math.random() - 0.5); for (const id of ids) { const e = EVENTOS_CLUBE[id](); if (e) return e; } return null; }
function cmEventoColetiva(nome) { return { id: 'coletiva', titulo: `🎤 Coletiva de imprensa: campeão da ${nome}!`, txt: 'Os jornalistas querem saber: o que você diz depois do título?' }; }
function cmOpcoesEvento(e) {
  const s = G.save; const t = s.time; const P = CM_P(); const j = e.jid && (t.elenco.find(x => x.id === e.jid) || t.base.find(x => x.id === e.jid));
  const moral = d => { t.moral = clamp(t.moral + d, -3, 3); };
  const todos = f => t.elenco.forEach(f);
  switch (e.id) {
    case 'aumento': return [
      [`Dar um bônus (${fmt(Math.round(P * 1.5))})`, () => { if (t.caixa < P * 1.5) return 'O caixa não tem dinheiro para o bônus agora.'; t.caixa -= Math.round(P * 1.5); t.finTemp.sai -= Math.round(P * 1.5); moral(1); return `${j.nome} ficou feliz e o vestiário também! Moral +1.`; }],
      ['Conversar com calma', () => Math.random() < 0.6 ? `${j.nome} entendeu: o clube está crescendo e o reconhecimento vai chegar.` : (moral(-1), `${j.nome} ficou um pouco chateado. Moral −1.`)],
      ['Recusar', () => { moral(-1); return `${j.nome} não gostou. Moral −1.`; }]];
    case 'proposta': return [
      [`Vender por ${fmt(e.valor)}`, () => { t.elenco = t.elenco.filter(x => x.id !== e.jid); t.titulares = t.titulares.map(id => id === e.jid ? null : id); autoEscalar(); t.caixa += e.valor; t.finTemp.ent += e.valor; return `${j.nome} foi vendido! +${fmt(e.valor)} no caixa. A escalação foi arrumada automaticamente.`; }],
      ['Recusar: ele fica!', () => { moral(1); return `${j.nome} ficou feliz por ser valorizado. Moral +1.`; }]];
    case 'festa': return [
      [`Apoiar a festa (${fmt(P)})`, () => { if (t.caixa < P) return 'Sem caixa para a festa agora.'; t.caixa -= P; t.finTemp.sai -= P; moral(2); return 'Que festa! O time entrou em campo voando. Moral +2.'; }],
      ['Agradecer nas redes sociais', () => { moral(1); return 'A torcida adorou o carinho. Moral +1.'; }]];
    case 'patrocinio': return [
      ['Aceitar o desafio', () => { t.desafioPatro = e.valor; return `Combinado: se vencer o próximo jogo da liga, entram +${fmt(e.valor)}.`; }],
      ['Recusar', () => 'Tudo bem, o patrocinador entende.']];
    case 'imprensa': return [
      ['Responder com calma e respeito', () => { t.patro = Math.min(2, +(t.patro + 0.03).toFixed(2)); return 'A resposta educada agradou o patrocinador. Patrocínio +3%.'; }],
      ['"A resposta vem dentro de campo!"', () => { moral(1); return 'O elenco se motivou! Moral +1.'; }]];
    case 'lesao': return [
      ['Poupar e tratar', () => { j.energia = (t.estr.med || 0) >= 3 ? 60 : 25; return `${j.nome} vai se recuperar com calma (energia ${j.energia}%).`; }],
      ['Arriscar e deixar jogar', () => { if (Math.random() < 0.5) return `${j.nome} está bem, foi só um susto!`; j.energia = 0; moral(-1); return `${j.nome} sentiu de novo e vai precisar descansar (energia 0%). Moral −1.`; }]];
    case 'base': return [
      ['Promover para o profissional', () => { if (t.elenco.length >= 19) return 'O elenco está cheio (20). Venda alguém primeiro.'; t.base = t.base.filter(x => x.id !== e.jid); t.elenco.push(j); return `${j.nome} subiu para o time profissional!`; }],
      ['Deixar amadurecer mais um pouco', () => { j.pot = Math.min(99, j.pot + 3); return `${j.nome} vai treinar mais na base. Potencial +3 (agora ${j.pot}).`; }]];
    case 'social': return [
      ['Ir com todo o elenco', () => { todos(x => x.energia = Math.max(0, x.energia - 10)); moral(1); t.patro = Math.min(2, +(t.patro + 0.05).toFixed(2)); return 'As crianças fizeram a festa! Moral +1 e patrocínio +5% (o time cansou um pouquinho).'; }],
      [`Mandar camisas autografadas (${fmt(Math.round(P * 0.5))})`, () => { t.caixa -= Math.round(P * 0.5); t.finTemp.sai -= Math.round(P * 0.5); t.patro = Math.min(2, +(t.patro + 0.03).toFixed(2)); return 'Um presente lindo! Patrocínio +3%.'; }]];
    case 'amistoso': return [
      [`Aceitar (+${fmt(e.valor)})`, () => { t.caixa += e.valor; t.finTemp.ent += e.valor; todos(x => x.energia = Math.max(0, x.energia - 15)); return `Amistoso jogado! +${fmt(e.valor)} no caixa, mas o time cansou (−15 de energia).`; }],
      ['Recusar e descansar', () => { todos(x => x.energia = Math.min(100, x.energia + 10)); return 'O time aproveitou para descansar (+10 de energia).'; }]];
    case 'coletiva': return [
      ['"Esse título é da torcida!"', () => { moral(2); t.estr.torcida = t.estr.torcida || 0; return 'A torcida foi à loucura! Moral +2.'; }],
      ['"Parabéns ao adversário, foi um jogão."', () => { t.patro = Math.min(2, +(t.patro + 0.08).toFixed(2)); return 'Fair play que todo mundo admira. Patrocínio +8%.'; }],
      ['"Dedico à Vila do Campinho!"', () => { moral(1); G.save.ouro += Math.round(P * 2); return `A Vila inteira comemorou e mandou um presente: +${fmt(Math.round(P * 2))} tostões no seu bolso. Moral +1.`; }]];
  }
  return [['Ok', () => '']];
}
function cmCartaoEvento(aba) {
  const t = G.save.time; const e = t.evento; if (!e) return null;
  const ops = cmOpcoesEvento(e);
  return el('div', { class: 'cm-evento' }, el('b', {}, e.titulo), el('p', {}, e.txt), el('div', { class: 'opcoes' }, ...ops.map(([rot, fn]) => el('button', { class: 'btn amarelo mini', onclick: () => {
    const res = fn(); t.evento = null; if (res) log(`${e.titulo.replace(/^\S+\s/, '')}: ${res}`, 'l-info'); salvar(); abrirTime(aba); if (res) setTimeout(() => banner('Decisão tomada', res.length > 70 ? res.slice(0, 68) + '…' : res), 50);
  } }, rot))));
}

/* ============================================================
   4) SELEÇÃO BRASILEIRA
   ============================================================ */
const NIVEL_SELECAO = 60;
// [id, nome, força, cor1, cor2, região]
const SELECOES = [
  ['argentina', 'Argentina', 74, '#74acdf', '#ffffff', 'sul'], ['franca', 'França', 74, '#1a2a6a', '#ffffff', 'eu'], ['espanha', 'Espanha', 73, '#c60b1e', '#ffc400', 'eu'],
  ['inglaterra', 'Inglaterra', 72, '#ffffff', '#1a2a6a', 'eu'], ['alemanha', 'Alemanha', 72, '#ffffff', '#1a1a1a', 'eu'], ['portugal', 'Portugal', 72, '#c8102e', '#006600', 'eu'],
  ['holanda', 'Holanda', 70, '#ff7a1a', '#ffffff', 'eu'], ['italia', 'Itália', 70, '#1a4ad9', '#ffffff', 'eu'], ['belgica', 'Bélgica', 69, '#d42a2a', '#1a1a1a', 'eu'],
  ['croacia', 'Croácia', 68, '#d42a2a', '#ffffff', 'eu'], ['uruguai', 'Uruguai', 68, '#6ab0e0', '#1a1a1a', 'sul'], ['colombia', 'Colômbia', 67, '#f8d838', '#1a2a6a', 'sul'],
  ['marrocos', 'Marrocos', 66, '#c1272d', '#006233', 'af'], ['suica', 'Suíça', 65, '#d42a2a', '#ffffff', 'eu'], ['dinamarca', 'Dinamarca', 65, '#c8102e', '#ffffff', 'eu'],
  ['japao', 'Japão', 65, '#1a2a8a', '#ffffff', 'as'], ['mexico', 'México', 65, '#006847', '#ffffff', 'nor'], ['eua', 'Estados Unidos', 64, '#ffffff', '#1a2a6a', 'nor'],
  ['senegal', 'Senegal', 64, '#ffffff', '#1a8a3a', 'af'], ['equador', 'Equador', 63, '#f8d838', '#1a4ad9', 'sul'], ['nigeria', 'Nigéria', 62, '#1a8a3a', '#ffffff', 'af'],
  ['coreia', 'Coreia do Sul', 62, '#d42a2a', '#1a1a1a', 'as'], ['paraguai', 'Paraguai', 61, '#d42a2a', '#ffffff', 'sul'], ['chile', 'Chile', 61, '#d42a2a', '#1a2a6a', 'sul'],
  ['canada', 'Canadá', 61, '#d42a2a', '#ffffff', 'nor'], ['peru', 'Peru', 60, '#ffffff', '#d42a2a', 'sul'], ['egito', 'Egito', 60, '#d42a2a', '#ffffff', 'af'],
  ['gana', 'Gana', 60, '#ffffff', '#1a1a1a', 'af'], ['australia', 'Austrália', 60, '#f8d838', '#1a8a3a', 'as'], ['arabia', 'Arábia Saudita', 58, '#ffffff', '#1a8a3a', 'as'],
  ['venezuela', 'Venezuela', 58, '#8a1a2a', '#1a2a6a', 'sul'], ['catar', 'Catar', 57, '#8a1538', '#ffffff', 'as'], ['bolivia', 'Bolívia', 56, '#1a8a3a', '#f8d838', 'sul'],
  ['china', 'China', 54, '#d42a2a', '#f8d838', 'as'],
].map(([id, nome, ovr, cor1, cor2, reg]) => ({ id, nome, ovr, cor1, cor2, reg }));
const CICLO_SEL = ['elim', 'america', 'elim', 'mundo'];
const TORNEIO_SEL = { elim: 'Eliminatórias', america: 'Copa América', mundo: 'Copa do Mundo' };
const FASES_MATA = { america: ['Quartas de final', 'Semifinal', 'Final'], mundo: ['Oitavas de final', 'Quartas de final', 'Semifinal', 'Final'] };
const MULT_SEL = { elim: [1, 1, 1, 1], grupo: [1.2, 1.2, 1.2], 'Oitavas de final': 1.6, 'Quartas de final': 2, Semifinal: 2.6, Final: 4 };
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
  if (tipo === 'elim') selSorteia(x => x.reg === 'sul', usados, 4).forEach((a, i) => T.jogos.push({ fase: `${i + 1}º jogo`, tipoFase: 'elim', adv: a, res: null }));
  else {
    const reg = tipo === 'america' ? x => x.reg === 'sul' || x.reg === 'nor' : () => true;
    const g = [...selSorteia(x => reg(x) && x.ovr >= 66, usados, 1), ...selSorteia(x => reg(x) && x.ovr >= 60 && x.ovr < 66, usados, 1), ...selSorteia(x => reg(x) && x.ovr < 62, usados, 1)];
    T.grupo = { times: [{ id: 'bra', nome: 'Brasil', ovr: forcaSelecao(), cor1: '#f8d838', cor2: '#1a9a3a' }, ...g].map(x => Object.assign(x, { pts: 0, gp: 0, gc: 0, j: 0 })) };
    g.forEach((a, i) => T.jogos.push({ fase: `Fase de grupos — ${i + 1}ª rodada`, tipoFase: 'grupo', adv: a, res: null }));
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
  let txt = `Brasil ${gn} × ${ge} ${jogo.adv.nome}${pen ? ` (pênaltis ${pen[0]}×${pen[1]})` : ''}. ${venceu ? 'VITÓRIA!' : empate ? 'Empate.' : 'Derrota.'} +${fmt(xp)} XP, +${fmt(ouro)} tostões.`;
  // fase de grupos: os outros jogos da rodada e a classificação
  if (jogo.tipoFase === 'grupo') {
    const G2 = T.grupo.times; const bra = G2[0]; const adv = G2.find(x => x.id === jogo.adv.id);
    const reg = (a, b, x, y) => { a.j++; b.j++; a.gp += x; a.gc += y; b.gp += y; b.gc += x; if (x > y) a.pts += 3; else if (y > x) b.pts += 3; else { a.pts++; b.pts++; } };
    reg(bra, adv, gn, ge);
    const outros = G2.slice(1).filter(x => x !== adv && x.j < bra.j); if (outros.length === 2) { const [a, b] = outros; const A = setores(timeIA({ seed: hashTxt(a.id), ovr: a.ovr, formacao: '4-4-2' }), 'equilibrada'), B = setores(timeIA({ seed: hashTxt(b.id), ovr: b.ovr, formacao: '4-4-2' }), 'equilibrada'); const [x, y] = simRapida(A, B); reg(a, b, x, y); }
    if (T.jogos.filter(j => j.tipoFase === 'grupo').every(j => j.res)) {
      const tab = [...G2].sort((x, y) => y.pts - x.pts || (y.gp - y.gc) - (x.gp - x.gc) || y.gp - x.gp); const pos = tab.indexOf(bra) + 1;
      if (pos <= 2) { txt += ` O Brasil passou em ${pos}º no grupo!`; selProximaFase(T, 0); } else { T.status = 'eliminado'; txt += ' O Brasil caiu na fase de grupos...'; }
    }
  } else if (jogo.tipoFase === 'mata') {
    const fases = FASES_MATA[T.tipo]; const i = fases.indexOf(jogo.fase);
    if (!venceu) { T.status = 'eliminado'; txt += ` Eliminado na ${jogo.fase}.`; }
    else if (i === fases.length - 1) {
      T.status = 'campeao'; sel.titulos[T.tipo]++; const bonusXp = baseXp * (T.tipo === 'mundo' ? 1.2 : 0.6); const bonusOuro = s.nivel * (T.tipo === 'mundo' ? 2500 : 900);
      ganhaXp(Math.round(bonusXp)); s.ouro += bonusOuro; s.flags['campeao_sel_' + T.tipo] = true;
      const item = T.tipo === 'mundo' ? 'medalha_mundo_sel' : 'medalha_copa_america'; if (recebeItem(item, 1) !== 'mochila') log(`A ${ITENS[item].nome} foi para o armazém (mochila cheia).`, 'l-loot');
      txt += ` 🏆 O BRASIL É CAMPEÃO DA ${T.nome.toUpperCase()}! +${fmt(Math.round(bonusXp))} XP e +${fmt(bonusOuro)} tostões.`;
      banner('CAMPEÃO!', T.nome); som('nivel');
      sel._celebra = T.tipo === 'mundo' ? ['cap_sel_copa_mundo', `CAMPEÃO DA ${T.nome.toUpperCase()}!`, `${s.nome} levantou a taça com a Seleção. O Brasil inteiro está em festa!`] : ['cap_sel_copa_america', `CAMPEÃO DA ${T.nome.toUpperCase()}!`, 'A Seleção é a melhor do continente!'];
    } else { txt += ` Classificado para ${cmPara(fases[i + 1])} ${fases[i + 1]}!`; selProximaFase(T, i + 1); }
  }
  if (jogo.tipoFase === 'elim' && T.jogos.every(j => j.res)) { const pts = T.jogos.reduce((a, j) => a + (j.res.venceu ? 3 : j.res.empate ? 1 : 0), 0); T.status = 'fim'; txt += ` Fim das Eliminatórias: ${pts} pontos.${pts >= 7 ? ' Campanha excelente!' : ''}`; }
  if (T.status !== 'vivo') { sel.historico.unshift(`${T.nome}: ${T.status === 'campeao' ? '🏆 CAMPEÃO' : T.status === 'eliminado' ? 'eliminado' : 'concluída'}`); sel.historico = sel.historico.slice(0, 12); sel.ciclo++; sel.torneio = selNovoTorneio(sel); }
  log(`⭐ Seleção: ${txt}`, venceu ? 'l-lendario' : 'l-info'); salvar();
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
  if (s.nivel < NIVEL_SELECAO) { w.append(el('h3', {}, bandeira('brasil'), ' Seleção Brasileira'), el('p', {}, `Quando o seu craque chegar ao nível ${NIVEL_SELECAO}, o técnico da Seleção vai te convocar! Aí você joga Eliminatórias, Copa América e a COPA DO MUNDO.`), el('p', { class: 'vazio' }, `Você está no nível ${s.nivel}.`)); return w; }
  const sel = selDados();
  if (!s.flags.convocado_selecao) { s.flags.convocado_selecao = true; salvar(); setTimeout(() => cmFoto('cap_sel_convocacao', 'VOCÊ FOI CONVOCADO!', `${s.nome} vai vestir a amarelinha! Cada Data FIFA (a cada 2 jogos do clube) tem um jogo da Seleção.`), 60); }
  const T = sel.torneio; const prox = selProximo(sel);
  w.append(el('h3', {}, bandeira('brasil'), ` ${T.nome}`), el('p', {}, `Força da Seleção: ${forcaSelecao()} (cresce com o seu nível). Você joga como ${POS_NOME[jogadorEu().pos]} e decide os lances importantes.`));
  if (T.grupo) {
    const tab = [...T.grupo.times].sort((x, y) => y.pts - x.pts || (y.gp - y.gc) - (x.gp - x.gc) || y.gp - x.gp);
    const tb = el('table', { class: 'tabela' }, el('tr', {}, ...['#', 'Seleção', 'J', 'Pts', 'SG'].map(h => el('th', {}, h))), ...tab.map((x, i) => el('tr', { class: x.id === 'bra' ? 'eu' : '' }, el('td', {}, i + 1), el('td', {}, el('span', { class: 'mini-escudo', style: `background:linear-gradient(90deg,${x.cor1} 50%,${x.cor2} 50%)` }), ' ', x.nome), el('td', {}, x.j), el('td', {}, x.pts), el('td', {}, x.gp - x.gc))));
    w.append(el('small', {}, 'Grupo (os 2 primeiros passam):'), tb);
  }
  const lista = el('div', { class: 'lista' });
  T.jogos.forEach((j, i) => lista.append(el('div', { class: 'linha-item' }, el('b', { class: 'pos-tag' }, i + 1),
    el('div', { class: 'nm' }, el('b', {}, j.fase), el('small', {}, `Brasil vs ${j.adv.nome} (força ${j.adv.ovr})`)),
    el('b', {}, j.res ? `${j.res.gn} × ${j.res.ge}${j.res.pen ? ` (pên. ${j.res.pen[0]}×${j.res.pen[1]})` : ''}` : j === prox ? (selLiberado(sel) ? 'PRÓXIMO!' : 'na próxima Data FIFA') : '—'))));
  w.append(lista);
  if (prox) {
    const lib = selLiberado(sel); const falta = s.time ? sel.torneio.libera - s.time.jogos : 0;
    const { nos, eles } = selForcas(prox.adv); let v = 0, e = 0; for (let i = 0; i < 300; i++) { const [a, b] = simRapida(nos, eles); if (a > b) v++; else if (a === b) e++; }
    w.append(el('p', { style: 'text-align:center' }, `Chance estimada contra ${prox.adv.nome}: vitória ${Math.round(v / 3)}% · empate ${Math.round(e / 3)}% · derrota ${Math.round((300 - v - e) / 3)}%`));
    w.append(el('div', { class: 'opcoes', style: 'justify-content:center' },
      el('button', { class: 'btn amarelo grande', disabled: lib ? null : 'disabled', onclick: () => selPartida(prox) }, lib ? '📺 Jogar pela Seleção!' : `Data FIFA daqui a ${falta} jogo(s) do clube`),
      el('button', { class: 'btn', disabled: lib ? null : 'disabled', onclick: () => { const [a, b] = simRapida(nos, eles); const pen = prox.tipoFase === 'mata' && a === b ? (Math.random() < 0.55 ? [5, 4] : [3, 4]) : null; const txt = selRegistra(prox, a, b, pen); cmFimSel(txt); } }, 'Simular')));
  }
  w.append(el('h3', {}, '📜 Histórico da Seleção'), el('p', {}, `Jogos: ${sel.jogos} · Vitórias: ${sel.vitorias} · Gols do time: ${sel.gols} · Copa América: ${sel.titulos.america} 🏆 · Copa do Mundo: ${sel.titulos.mundo} 🏆`),
    sel.historico.length ? el('div', { class: 'trofeus' }, ...sel.historico.map(h => el('span', { class: 'trofeu' }, h))) : el('p', { class: 'vazio' }, 'O ciclo: Eliminatórias → Copa América → Eliminatórias → COPA DO MUNDO.'));
  return w;
}
function cmFimSel(txt) {
  const sel = G.save.selecao;
  const volta = () => { if (sel && sel._celebra) { const c = sel._celebra; sel._celebra = null; salvar(); cmFoto(c[0], c[1], c[2], () => abrirTime('selecao')); } else abrirTime('selecao'); };
  abreModal.largo = true;
  abreModal(el('h2', {}, bandeira('brasil'), ' Resultado da Seleção'), el('p', { style: 'text-align:center' }, txt), el('div', { class: 'opcoes', style: 'justify-content:center' }, el('button', { class: 'btn amarelo', onclick: volta }, 'Continuar')));
}
// partida da Seleção: narração ao vivo, e nos lances importantes VOCÊ decide
function selPartida(jogo) {
  const s = G.save; const { nos, eles, esc } = selForcas(jogo.adv); const escE = timeIA({ seed: hashTxt(jogo.adv.id) * 97 + 13, ovr: jogo.adv.ovr, formacao: '4-3-3' });
  const euJ = esc.find(x => x.j.eu).j; let gn = 0, ge = 0, i = 0, dec = 0, pausa = false, fim = false, vel = 1000, timer = null;
  const minutos = Array.from({ length: 16 }, () => rndi(1, 90)).sort((a, b) => a - b);
  const placar = el('div', { class: 'placar-ao-vivo' }); const narr = el('div', { class: 'narracao' }); const escolha = el('div', { class: 'escolha' }); const ctl = el('div', { class: 'opcoes', style: 'justify-content:center' });
  const atu = min => { placar.innerHTML = ''; placar.append(el('span', {}, bandeira('brasil'), ' Brasil'), el('b', {}, `${gn} × ${ge}`), el('span', {}, jogo.adv.nome), el('small', {}, min != null ? `${min}'` : '')); };
  const diz = (txt, cls = '') => narr.prepend(el('div', { class: cls }, txt));
  const nome = (lista, pesos) => { const l = lista.filter(x => x.j); const tot = l.reduce((a, x) => a + (pesos[x.slot] || 0.2), 0); let r = Math.random() * tot; for (const x of l) { r -= pesos[x.slot] || 0.2; if (r <= 0) return x.j; } return l[0].j; };
  const ATQ = { ATA: 3, MEI: 2, LAT: 1, VOL: 0.5, ZAG: 0.2, GOL: 0 };
  function prox() {
    if (pausa || fim) return; if (i >= minutos.length) return terminar();
    const min = minutos[i++]; atu(min); if (i === 9) diz("45' Fim do primeiro tempo.", 'n-sis');
    const r = lance(nos, eles); const X = r.atacaA ? esc : escE; const at = nome(X, ATQ); const nt = r.atacaA ? 'Brasil' : jogo.adv.nome;
    if (r.atacaA && r.tipo !== 'desarme' && dec < 3 && (at.eu || Math.random() < 0.3)) { dec++; return decide(min); }
    if (r.tipo === 'desarme') diz(`${min}' ${at.nome} tenta a jogada, mas perde a bola.`);
    else if (r.tipo === 'fora') diz(`${min}' ${at.nome} (${nt}) chuta... pra fora!`);
    else if (r.tipo === 'defesa') diz(`${min}' ${at.nome} arrisca e o goleiro faz uma defesaça!`, 'n-def');
    else { if (r.atacaA) gn++; else ge++; diz(`${min}' GOOOOL ${r.atacaA ? 'DO BRASIL' : 'de ' + nt}! ${at.nome} marca!`, r.atacaA ? 'n-gol' : 'n-golc'); som(r.atacaA ? 'gol' : 'ai'); }
    atu(min); timer = setTimeout(prox, vel);
  }
  function decide(min) {
    pausa = true; diz(`${min}' A bola chega em VOCÊ, ${s.nome}, na entrada da área!`, 'n-eu');
    const dm = eles.def / 4.3, gk = eles.gol;
    const pC = clamp(0.25 + (euJ.chu - gk) * 0.012, 0.05, 0.8), pD = clamp(0.5 + (euJ.drb - dm) * 0.015, 0.1, 0.9), pP = clamp(0.6 + (euJ.pas - dm) * 0.012, 0.2, 0.92);
    const res = (gol, txt) => { escolha.innerHTML = ''; pausa = false; if (gol) { gn++; som('gol'); } diz(`${min}' ${txt}`, gol ? 'n-gol' : ''); atu(min); timer = setTimeout(prox, vel); };
    const b = (rot, p, fn) => el('button', { class: 'btn amarelo', onclick: fn }, `${rot} (${Math.round(p * 100)}%)`);
    escolha.innerHTML = ''; escolha.append(el('p', {}, 'O que você faz?'), el('div', { class: 'opcoes', style: 'justify-content:center' },
      b('Chutar', pC, () => Math.random() < pC ? res(true, `GOLAÇO DE ${s.nome.toUpperCase()} COM A AMARELINHA!`) : res(false, `${s.nome} chuta e o goleiro defende!`)),
      b('Driblar', pD, () => { if (Math.random() < pD) { Math.random() < clamp(0.45 + (euJ.chu - gk) * 0.01, 0.15, 0.85) ? res(true, `${s.nome} dribla dois e marca! Que golaço!`) : res(false, `${s.nome} passa pelo zagueiro, mas o goleiro salva!`); } else res(false, `${s.nome} tenta o drible e perde a bola.`); }),
      b('Tocar', pP, () => { if (Math.random() < pP) { const c = nome(esc.filter(x => !x.j.eu), ATQ); Math.random() < 0.42 ? res(true, `${s.nome} dá um passe perfeito e ${c.nome} marca!`) : res(false, `${s.nome} toca para ${c.nome}, que chuta por cima.`); } else res(false, `O passe de ${s.nome} é interceptado.`); })));
  }
  function terminar() {
    fim = true; clearTimeout(timer); escolha.innerHTML = ''; let pen = null;
    if (jogo.tipoFase === 'mata' && gn === ge) { const ok = Math.random() < clamp(0.5 + (nos.gol - eles.gol) * 0.006, 0.3, 0.75); pen = ok ? [rndi(4, 5), rndi(2, 3)] : [rndi(2, 3), rndi(4, 5)]; diz(`Empate! Pênaltis... ${pen[0]} × ${pen[1]}!`, 'n-sis'); }
    const txt = selRegistra(jogo, gn, ge, pen); diz(`Fim de jogo! ${txt}`, 'n-sis'); som((pen ? pen[0] > pen[1] : gn > ge) ? 'nivel' : 'apito');
    ctl.innerHTML = ''; ctl.append(el('button', { class: 'btn amarelo', onclick: () => cmFimSel(txt) }, 'Continuar'));
  }
  ctl.append(el('button', { class: 'btn', onclick: () => { vel = vel === 1000 ? 380 : 1000; } }, 'Velocidade'), el('button', { class: 'btn', onclick: () => { vel = 30; } }, 'Pular'));
  window.pararPartida = () => { if (!fim) { clearTimeout(timer); fim = true; } window.pararPartida = null; };
  abreModal.largo = true;
  abreModal(el('h2', {}, bandeira('brasil'), ` ${selDados().torneio.nome} — ${jogo.fase}`), placar, escolha, ctl, narr);
  $('#modal .fechar').hidden = true; const vig = setInterval(() => { if (fim) { $('#modal .fechar').hidden = false; clearInterval(vig); } }, 300);
  atu(0); diz("0' Rola a bola! O hino tocou e o estádio está lotado de verde e amarelo.", 'n-sis'); som('apito'); timer = setTimeout(prox, 900);
}
Object.assign(ITENS, {
  medalha_copa_america: { nome: 'Medalha da Copa América', tipo: 'chave', desc: 'Campeão da Copa América com a Seleção Brasileira!' },
  medalha_mundo_sel: { nome: 'Medalha de Campeão do Mundo (Seleção)', tipo: 'chave', desc: 'Campeão da Copa do Mundo com a Seleção Brasileira! O sonho de todo menino do campinho.' },
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
    const jogarBt = [...tabs.children].find(b => /Jogar partida/.test(b.textContent));
    const mk = (id, rot) => el('button', { class: 'btn' + (aba === id ? ' amarelo' : ''), onclick: () => abrirTime(id) }, rot);
    const bC = mk('cont', '🌎 Continental'), bS = mk('selecao', '⭐ Seleção');
    if (jogarBt) { tabs.insertBefore(bC, jogarBt); tabs.insertBefore(bS, jogarBt); } else tabs.append(bC, bS);
    if (minha) {
      [...tabs.children].forEach(b => { if (b !== bC && b !== bS && !/Como funciona/.test(b.textContent)) b.classList.remove('amarelo'); });
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
  return el('small', { class: 'cm-renda' }, `💰 Próximo nível rende +${fmt(ganho)} por temporada na divisão atual · se paga em ~${temps < 1 ? 'menos de 1 temporada' : Math.ceil(temps) + (Math.ceil(temps) > 1 ? ' temporadas' : ' temporada')}`);
}
{ const st = document.createElement('style'); st.textContent = '.cm-renda { display: block; color: #2f7a2f; font-weight: 800; margin-top: 2px; }'; document.head.append(st); }
