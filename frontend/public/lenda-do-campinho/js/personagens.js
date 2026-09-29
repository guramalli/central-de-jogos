/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   PERSONAGENS — a página de cada jogador, no jeito do Tibia:
   "Informações do personagem", "Habilidades", "Equipamento", "Conquistas",
   "Exaustões" (as "mortes" do Tibia) e "Conta". Tem busca pelo apelido e
   a lista dos jogadores. Dados: GET /api/lenda/personagens e
   /api/lenda/personagem/:apelido (o site monta a ficha pública a partir do
   save na nuvem). Fora do site mostra o personagem deste aparelho.
   Link direto: /lenda-do-campinho/?personagem=Apelido
   Carregar DEPOIS de wiki.js.
   ============================================================ */
// guarda as últimas 10 vezes que o personagem ficou sem fôlego (aparece na página)
(function () {
  const _morrerP = morrer;
  morrer = function (m, ...r) {
    const nv = G.save ? G.save.nivel : 0;
    const res = _morrerP.call(this, m, ...r);
    try { const s = G.save; s.exaustoes = [{ nivel: nv, por: m && m.d ? m.d.nome : null, mapa: G.mapa && G.mapa.id, em: Date.now() }, ...(s.exaustoes || [])].slice(0, 10); } catch (e) { }
    return res;
  };
})();

// mesma ficha que o site monta (backend/src/lenda/ficha.js), para o personagem deste aparelho
function fichaDoSaveLocal(s) {
  if (!s) return null;
  const c = s.carreira || {};
  return {
    nome: s.nome, genero: s.corpo === 'f' ? 'f' : 'm', nivel: s.nivel, xp: Math.floor(s.xp || 0), posicao: s.posicao, classe: s.classe,
    atr: Object.assign({}, s.atr), skills: { drible: s.sk.drible.lv, chute: s.sk.chute.lv, defesa: s.sk.defesa.lv, visao: s.sk.visao.lv },
    equip: Object.fromEntries(Object.entries(s.equip || {}).filter(([, v]) => v).map(([k, v]) => [k, { id: v, r: (s.equipR || {})[k] || 0 }])),
    mapa: s.mapa, casa: s.casa && s.casa.id, time: s.time ? { nome: s.time.nome, div: s.time.div, titulos: s.time.titulos || 0 } : null,
    clube: c.clube ? { nome: c.clube.nome, cidade: c.clube.cidadeNome, tier: c.clube.tier } : null, fama: c.fama || 0,
    estatisticas: { abates: s.st.abates || 0, chefes: s.st.chefes || 0, gols: s.st.gols || 0, mortes: s.st.mortes || 0, quiz: s.st.quiz || 0, tempo: s.st.tempo || 0, recordePenalti: s.st.recordePenalti || 0, figurinhas: Object.keys(s.figs || {}).length, dribles: (s.dribles || []).length },
    kills: Object.entries(s.kills || {}).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, n]) => ({ id, n })),
    arenas: Object.entries(s.arenas || {}).map(([id, a]) => ({ id, vitorias: a.vitorias || 0, miticos: (a.itens || []).length })).filter(a => a.vitorias > 0),
    montarias: s.montarias || [], skins: s.skins || [], exaustoes: s.exaustoes || [], criado: s.criado, dia: s.dia,
  };
}

const PERS_API = () => (typeof PORTAL !== 'undefined' && PORTAL.ativo ? PORTAL.api + '/api/lenda' : null);
function dataPers(ms, comHora) {
  if (!ms) return '—'; const d = new Date(ms); if (isNaN(d)) return '—';
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}${comHora ? `, ${p(d.getHours())}:${p(d.getMinutes())}` : ''}`;
}
function nomeLugarPers(id) { if (!id) return '—'; try { return getMapa(id).nome.split(' —')[0]; } catch (e) { return id; } }
function tempoPers(seg) { const h = Math.floor(seg / 3600), m = Math.floor(seg % 3600 / 60); return h ? `${h} h ${m} min` : `${m} min`; }

// caixa no estilo do site do Tibia: título marrom, linhas bege alternadas
function caixaPers(titulo, linhas, opts = {}) {
  const t = el('table', { class: 'tbia-tab' });
  if (opts.cabecalho) t.append(el('tr', { class: 'tbia-cab' }, ...opts.cabecalho.map(h => el('td', {}, h))));
  linhas.forEach(l => t.append(el('tr', {}, ...l.map((v, i) => el('td', i === 0 && !opts.cabecalho ? { class: 'tbia-rot' } : {}, v)))));
  if (!linhas.length) t.append(el('tr', {}, el('td', { colspan: 9, class: 'tbia-vazio' }, opts.vazio || 'Nada por aqui ainda.')));
  return el('div', { class: 'tbia-caixa' }, el('div', { class: 'tbia-titulo' }, titulo), t);
}
function linkPers(apelido) { return el('a', { href: '#', class: 'tbia-link', onclick: ev => { ev.preventDefault(); modalPersonagens(apelido); } }, apelido); }

function paginaFicha(dados) {
  const f = dados.ficha, r = dados.resumo || {};
  if (!f) return [caixaPers('Informações do personagem', [['Nome:', dados.apelido], ['Nível:', r.nivel || '—'], ['Fase:', r.fase || '—']]),
    el('p', { class: 'tbia-obs' }, 'Esse jogador ainda não salvou o jogo online: a ficha completa aparece depois que ele jogar logado no site.')];
  if (typeof garanteTodasAsCasas === 'function') try { garanteTodasAsCasas(); } catch (e) { }
  const pos = f.posicao && POSICOES[f.posicao] ? POSICOES[f.posicao].nome : '—';
  const cl = f.classe && CLASSES[f.classe] ? `${CLASSES[f.classe].emoji || ''} ${CLASSES[f.classe].nome}` : '—';
  const casa = f.casa && typeof CASAS !== 'undefined' && CASAS[f.casa] ? `${CASAS[f.casa].nome} (${CASAS[f.casa].local})` : '—';
  const time = f.time ? `${f.time.nome} — ${typeof nomeDivisao === 'function' ? nomeDivisao(f.time.div) : 'divisão ' + f.time.div}${f.time.titulos ? ` · ${f.time.titulos} título(s)` : ''}` : '—';
  const clube = f.clube ? `${f.clube.nome}${f.clube.cidade ? ' (' + f.clube.cidade + ')' : ''}` : 'Sem clube';
  const info = [
    ['Nome:', el('b', {}, dados.apelido)],
    ['Personagem:', f.nome || '—'],
    ['Sexo:', f.genero === 'f' ? 'feminino' : 'masculino'],
    ['Posição:', pos], ['Classe:', cl],
    ['Nível:', String(f.nivel)], ['Experiência:', fmt(f.xp)],
    ['Fase:', FASES[faseIdx(f.nivel)].nome],
    ['Onde está:', nomeLugarPers(f.mapa)],
    ['Casa:', casa],
    ['Meu Time:', time],
    ['Clube:', clube], ['Fama:', fmt(f.fama || 0)],
    ['Último jogo:', dataPers(new Date(dados.ultimoJogo).getTime(), true)],
    ['Conta:', dados.visitante ? 'Visitante' : 'Conta Educação Gamer'],
  ];
  const sk = f.skills || {}, a = f.atr || {};
  const habil = [['Drible', sk.drible], ['Chute', sk.chute], ['Defesa', sk.defesa], ['Visão de jogo', sk.visao]].map(([n, v]) => [n, String(v ?? '—')]);
  const atrib = [['Defesa', a.defesa], ['Habilidade', a.habilidade], ['Inteligência', a.inteligencia], ['Fôlego', a.folego]].map(([n, v]) => [n, String(v ?? '—')]);
  const rotSlot = { cabeca: 'Cabeça', camisa: 'Camisa', acessorio: 'Pescoço', perna: 'Caneleira', calcao: 'Calção', chuteira: 'Chuteira' };
  const equip = Object.keys(rotSlot).map(k => { const e = (f.equip || {})[k]; const it = e && ITENS[e.id]; const cel = it ? el('span', { class: 'tbia-item' }, iconeClone(iconeItem(e.id)), `${it.nome}${e.r ? ' +' + e.r : ''}`) : '—'; return [rotSlot[k] + ':', cel]; });
  const e = f.estatisticas || {};
  const conq = [
    ['Adversários driblados:', fmt(e.abates || 0)], ['Chefões vencidos:', fmt(e.chefes || 0)], ['Gols:', fmt(e.gols || 0)],
    ['Figurinhas:', `${e.figurinhas || 0} / ${typeof FIGURINHAS !== 'undefined' ? FIGURINHAS.length : 30}`], ['Dribles aprendidos:', String(e.dribles || 0)],
    ['Recorde no pênalti:', `${e.recordePenalti || 0} / 5`], ['Quiz acertados:', fmt(e.quiz || 0)], ['Tempo de jogo:', tempoPers(e.tempo || 0)],
    ['Montarias:', (f.montarias || []).map(k => (typeof MONTARIAS !== 'undefined' && MONTARIAS[k] ? MONTARIAS[k].nome : k)).join(', ') || '—'],
    ['Skins:', (f.skins || []).map(k => (typeof SKINS !== 'undefined' && SKINS[k] ? SKINS[k].nome : k)).join(', ') || '—'],
  ];
  const arenas = (f.arenas || []).map(ar => { const d = typeof ARENAS !== 'undefined' && ARENAS.find(x => x.id === ar.id); return [d ? d.nome : ar.id, `${ar.vitorias} vitória(s)`, `${ar.miticos} mítico(s)`]; });
  const kills = (f.kills || []).map(k => [MONSTROS[k.id] ? MONSTROS[k.id].nome : k.id, fmt(k.n)]);
  const exaus = (f.exaustoes || []).map(x => [dataPers(x.em, true), `Ficou sem fôlego no nível ${x.nivel}${x.por ? ' contra ' + x.por : ''}${x.mapa ? ' (' + nomeLugarPers(x.mapa) + ')' : ''}.`]);
  const conta = [['Apelido:', dados.apelido], ['Membro desde:', dataPers(new Date(dados.membroDesde).getTime())], ['Personagem criado:', dataPers(f.criado)], ['Dia no jogo:', String(f.dia || '—')]];
  return [
    caixaPers('Informações do personagem', info),
    el('div', { class: 'tbia-duas' }, caixaPers('Habilidades', habil), caixaPers('Atributos', atrib)),
    caixaPers('Equipamento', equip),
    caixaPers('Conquistas', conq),
    caixaPers('Arenas', arenas, { cabecalho: ['Arena', 'Vitórias', 'Itens míticos'], vazio: 'Nenhuma arena vencida ainda.' }),
    caixaPers('Mais driblados', kills, { cabecalho: ['Adversário', 'Vezes'], vazio: 'Ninguém driblado ainda.' }),
    caixaPers('Exaustões', exaus, { vazio: 'Nunca ficou sem fôlego (ou ainda não foi registrado).' }),
    caixaPers('Conta', conta),
  ];
}
function paginaLista(lista, busca) {
  const linhas = lista.map((x, i) => [String(i + 1), linkPers(x.apelido), String(x.nivel), x.posicao && POSICOES[x.posicao] ? POSICOES[x.posicao].nome : '—', x.fase || '—', x.time ? x.time.nome : '—']);
  return [caixaPers(busca ? `Jogadores com "${busca}"` : 'Jogadores', linhas, { cabecalho: ['#', 'Nome', 'Nível', 'Posição', 'Fase', 'Meu Time'], vazio: busca ? 'Nenhum jogador com esse nome.' : 'Ninguém ainda.' })];
}

async function modalPersonagens(apelido) {
  const corpo = el('div', { class: 'tbia-corpo' }, el('p', { class: 'tbia-obs' }, 'Carregando...'));
  const inp = el('input', { type: 'search', class: 'tbia-inp', placeholder: 'Nome do personagem (apelido da conta)', value: apelido || '' });
  const procurar = () => { const v = inp.value.trim(); modalPersonagens(v || null); };
  inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') procurar(); });
  const barra = el('div', { class: 'tbia-busca' }, el('b', {}, 'Personagem:'), inp,
    el('button', { class: 'btn mini', type: 'button', onclick: procurar }, 'Procurar'),
    el('button', { class: 'btn mini', type: 'button', onclick: () => modalPersonagens(null) }, 'Todos'));
  abreModal.largo = true;
  abreModal(el('h2', {}, '📜 Personagens'), barra, corpo);
  if (!G.rodando) $('#modal').onclick = null;
  const poe = (...nos) => { corpo.innerHTML = ''; corpo.append(...nos); };
  const api = PERS_API();
  if (!api) { // fora do site: só o personagem deste aparelho
    const s = G.save || (typeof lerSave === 'function' ? lerSave() : null);
    if (!s) return poe(el('p', { class: 'tbia-obs' }, 'A página de personagens funciona dentro do site Educação Gamer. Neste aparelho ainda não há personagem.'));
    return poe(el('p', { class: 'tbia-obs' }, 'Fora do site: mostrando o personagem deste aparelho.'), ...paginaFicha({ apelido: s.nome, membroDesde: s.criado, ultimoJogo: Date.now(), visitante: true, ficha: fichaDoSaveLocal(s) }));
  }
  try {
    if (apelido) {
      const r = await fetch(`${api}/personagem/${encodeURIComponent(apelido)}`);
      if (r.status === 404) return poe(el('p', { class: 'tbia-obs' }, `Não achei o personagem "${apelido}". Confira o apelido ou procure na lista.`), el('button', { class: 'btn mini', type: 'button', onclick: () => modalPersonagens(null) }, 'Ver todos'));
      if (!r.ok) throw new Error(r.status);
      poe(...paginaFicha(await r.json()));
    } else {
      const r = await fetch(`${api}/personagens`); if (!r.ok) throw new Error(r.status);
      poe(...paginaLista(await r.json(), ''));
    }
  } catch (e) { poe(el('p', { class: 'tbia-obs' }, 'Não deu para carregar agora. Tente de novo em alguns segundos.')); }
}

(function () {
  const menu = document.getElementById('inicioMenu');
  if (menu && !document.getElementById('btnPersInicio')) menu.append(el('button', { class: 'btn', id: 'btnPersInicio', type: 'button', onclick: () => modalPersonagens(null) }, '📜 Personagens'));
  const lista = document.querySelector('#topo .tb-lista');
  if (lista && !document.getElementById('btnPers')) { const b = el('button', { class: 'btn', id: 'btnPers', type: 'button', role: 'menuitem', onclick: () => modalPersonagens(PORTAL && PORTAL.user ? PORTAL.user.nickname : null) }, '📜 Personagens'); const ref = document.getElementById('btnWiki') || document.getElementById('btnSair'); if (ref) ref.before(b); else lista.append(b); }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade && !document.getElementById('cmPers')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmPers', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); modalPersonagens(null); } }, el('span', { class: 'cm-ic' }, '📜'), 'Personagens'));
  // link direto: ?personagem=Apelido
  try { const q = new URLSearchParams(location.search).get('personagem'); if (q) setTimeout(() => modalPersonagens(q), 400); } catch (e) { }
  const st = document.createElement('style');
  st.textContent = `
  .tbia-busca { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; font: 12px Verdana, Arial, sans-serif; }
  .tbia-inp { flex: 1; min-width: 180px; padding: 5px 8px; border: 1px solid #5a2800; border-radius: 3px; font: 13px Verdana, Arial, sans-serif; background: #fffaf0; }
  .tbia-corpo { max-height: 62vh; overflow-y: auto; padding-right: 4px; }
  .tbia-caixa { border: 1px solid #5a2800; background: #fff2db; margin-bottom: 10px; box-shadow: 1px 1px 0 #d4c0a1; }
  .tbia-titulo { background: linear-gradient(#7a3a10, #5a2800); color: #fff; font: bold 12px Verdana, Arial, sans-serif; padding: 4px 7px; letter-spacing: .2px; text-shadow: 1px 1px 0 #2a1000; }
  .tbia-tab { width: 100%; border-collapse: collapse; font: 12px Verdana, Arial, sans-serif; color: #2a1a0a; }
  .tbia-tab td { padding: 4px 7px; border-top: 1px solid #faf0d7; vertical-align: middle; }
  .tbia-tab tr:nth-child(odd) td { background: #f1e0c6; }
  .tbia-tab tr:nth-child(even) td { background: #d4c0a1; }
  .tbia-tab tr.tbia-cab td { background: #b89c74; font-weight: bold; color: #fff; text-shadow: 1px 1px 0 #5a2800; }
  .tbia-rot { font-weight: bold; width: 170px; white-space: nowrap; }
  .tbia-vazio { font-style: italic; opacity: .75; }
  .tbia-duas { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .tbia-duas .tbia-caixa { margin-bottom: 10px; }
  .tbia-item { display: inline-flex; align-items: center; gap: 6px; }
  .tbia-item canvas { width: 20px; height: 20px; }
  .tbia-link { color: #004294; font-weight: bold; text-decoration: none; }
  .tbia-link:hover { text-decoration: underline; }
  .tbia-obs { font: 12px Verdana, Arial, sans-serif; background: #fff2db; border: 1px solid #d4c0a1; padding: 6px 8px; }
  @media (max-width: 600px) { .tbia-duas { grid-template-columns: 1fr; } .tbia-rot { width: auto; } }
  `;
  document.head.append(st);
})();
