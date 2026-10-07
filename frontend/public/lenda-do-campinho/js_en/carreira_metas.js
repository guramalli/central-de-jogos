/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎯 METAS DA CARREIRA LIGADAS AO CLUBE (v229, opção B do dono)
   Antes: 7 tipos fixos (pênalti só na Vila, "conclua missões" que eram as da Vila...) e repetitivos.
   Agora o dirigente oferece 5 metas e VOCÊ ESCOLHE 3, todas no nível e na cidade do clube:
   área de caça, estádio, arena, Caçada da vez, tarefas da semana, Centro de Treinamento,
   figurinhas, XP, dribles, partidas do seu time, Copa, chefões, disciplina...
   - Dá para trocar as metas até começar a cumprir alguma delas.
   - Pênalti só aparece para o clube da Vila; missões só contam as do seu nível.
   Carregar DEPOIS de carreira.js, tarefas.js, estadios.js, arenas.js, cacadas.js e centros_treino.js.
   ============================================================ */
Object.assign(CARR_META_EMOJI, { caca: '🗺️', estadio: '🏟️', arena: '🥊', tarefa: '🎯', semana: '📅', treino: '🏋️', figurinha: '🃏', xp: '✨', dribles: '🌀' });
const CARR_META_NOVAS = new Set(['caca', 'estadio', 'arena', 'tarefa', 'semana', 'treino', 'figurinha', 'xp', 'dribles']);
let CARR_MISSAO_LVL = null; // nível da missão que acabou de ser concluída (para filtrar as muito fáceis)

function carrNomeMapa(id) { try { return getMapa(id).nome.split(' —')[0]; } catch (e) { return carrCidadeNome(id); } }
// área de caça no nível do jogador: a da cidade do clube se servir; se não, a mais perto do seu nível entre as que você já conhece
function carrCacaBoa(k) {
  const s = G.save, nv = s.nivel || 1; if (typeof CACADAS === 'undefined') return null;
  const nivelDe = c => (MONSTROS[c.m] ? nivelMonstro(MONSTROS[c.m]) : 0);
  const liberado = h => typeof MAPAS_FLAG !== 'undefined' && Object.prototype.hasOwnProperty.call(MAPAS_FLAG, h) && (!MAPAS_FLAG[h] || (s.flags && s.flags[MAPAS_FLAG[h]]));
  const conhece = c => c.host === k.cidade || (s.kills && s.kills[c.m] > 0) || liberado(c.host);
  const lista = CACADAS.filter(c => MONSTROS[c.m] && conhece(c)).map(c => ({ c, nv: nivelDe(c) })).filter(x => x.nv <= nv + 10);
  const daCidade = lista.find(x => x.c.host === k.cidade && x.nv >= nv - 15);
  if (daCidade) return daCidade.c;
  lista.sort((a, b) => Math.abs(a.nv - nv) - Math.abs(b.nv - nv));
  return lista.length && lista[0].nv >= nv - 15 ? lista[0].c : null; // nada fácil demais
}
function carrEstadioBom(k) {
  if (typeof ESTADIOS === 'undefined') return null; const nv = G.save.nivel || 1;
  const daCidade = ESTADIOS.find(e => e.host === k.cidade && nv >= e.req); if (daCidade) return daCidade;
  const ok = ESTADIOS.filter(e => nv >= e.req && nv <= e.L + 25).sort((a, b) => b.req - a.req); return ok[0] || null;
}
function carrArenaBoa(k) {
  if (typeof ARENAS === 'undefined') return null; const nv = G.save.nivel || 1;
  const daCidade = ARENAS.find(a => a.host === k.cidade && nv >= a.req); if (daCidade) return daCidade;
  const ok = ARENAS.filter(a => nv >= a.req && nv <= a.L + 25).sort((a, b) => b.req - a.req); return ok[0] || null;
}
function carrMissoesDoNivel() {
  try { const nv = G.save.nivel || 1; return MISSOES.filter(q => ['disponivel', 'ativa', 'pronta'].includes(statusMissao(q)) && (q.lvl || 1) >= nv - 20).length; } catch (e) { return 0; }
}
function carrCidadeTemInimigos(k) {
  try { const nv = G.save.nivel || 1; const m = getMapa(k.cidade); return m.spawns.some(sp => MONSTROS[sp.m] && !MONSTROS[sp.m].treino && nivelMonstro(MONSTROS[sp.m]) >= nv - 15); } catch (e) { return false; }
}

carrGeraMetas = function (k) {
  const s = G.save; const t = k.tier; const nv = s.nivel || 1; const dif = k.promessa ? 1.5 : 1; const r = x => Math.max(1, Math.round(x * dif));
  const cand = [];
  const caca = carrCacaBoa(k);
  if (caca) cand.push({ tipo: 'caca', w: 3, n: r(25 + t * 2.5), alvo: caca.m, extra: caca.id });
  if (carrCidadeTemInimigos(k)) cand.push({ tipo: 'abates', w: 1.5, n: r(15 + nv * 0.2 + t * 2), alvo: k.cidade });
  const est = carrEstadioBom(k); if (est) cand.push({ tipo: 'estadio', w: 2, n: 1, alvo: est.id });
  const ar = carrArenaBoa(k); if (ar) cand.push({ tipo: 'arena', w: 1.5, n: 1, alvo: ar.id });
  cand.push({ tipo: 'tarefa', w: 2, n: 1 });
  cand.push({ tipo: 'semana', w: 1.5, n: k.promessa ? 3 : 2 });
  cand.push({ tipo: 'treino', w: 1.5, n: r(50 + t * 5) });
  { const falta = FIGURINHAS.length - Object.keys(s.figs || {}).length; if (falta > 0) cand.push({ tipo: 'figurinha', w: 1, n: Math.min(falta, k.promessa ? 3 : 2) }); } // v237: nunca pede mais do que falta
  { const xpNv = (xpPara(nv + 1) - xpPara(nv)) || 1000; cand.push({ tipo: 'xp', w: 1.5, n: Math.round(xpNv * 0.45 * dif) }); }
  cand.push({ tipo: 'dribles', w: 1.5, n: r(30 + t * 3) });
  cand.push({ tipo: 'chefe', w: 1, n: k.promessa ? 2 : 1 });
  cand.push({ tipo: 'copa', w: 1, n: 1 });
  cand.push({ tipo: 'disciplina', w: 1, n: Math.max(k.promessa ? 0 : 1, 4 - Math.floor(t / 3) - (k.promessa ? 1 : 0)) });
  const mis = carrMissoesDoNivel(); if (mis > 0) cand.push({ tipo: 'missoes', w: 1.5, n: Math.min(mis, 1 + (t >= 6 ? 1 : 0) + (k.promessa ? 1 : 0)) });
  if (s.time) cand.push({ tipo: 'partidas', w: 2, n: r(1 + Math.floor(t / 4)) });
  if (k.cidade === 'vila') cand.push({ tipo: 'gols', w: 1, n: r(2 + Math.ceil(t / 3)) }); // a marca do pênalti fica na Vila
  const opcoes = [];
  while (opcoes.length < 5 && cand.length) {
    const tot = cand.reduce((a, x) => a + x.w, 0); let rr = Math.random() * tot; let i = 0;
    for (; i < cand.length - 1; i++) { rr -= cand[i].w; if (rr <= 0) break; }
    const c = cand.splice(i, 1)[0];
    const m = { tipo: c.tipo, alvo: c.alvo || null, extra: c.extra || null, n: Math.max(0, c.n), desc: '', prog: 0 };
    m.desc = carrDescMeta(m); opcoes.push(m);
  }
  k.opcoesMeta = opcoes; k.metasTravadas = false;
  return opcoes.slice(0, 3); // sugestão do dirigente (dá para trocar)
};

{
  const _descMeta = carrDescMeta;
  carrDescMeta = function (m) {
    const n = m.n;
    switch (m.tipo) {
      case 'caca': { const nm = MONSTROS[m.alvo] ? MONSTROS[m.alvo].nome : m.alvo; const c = typeof CACA_POR_ID !== 'undefined' && CACA_POR_ID[m.extra]; return `Beat ${n} ${nm} in the hunting area ${c ? c.nome : ''}`.trim(); }
      case 'estadio': { const e = typeof EST_POR_ID !== 'undefined' && EST_POR_ID[m.alvo]; return e ? `Win ${e.nome}'s challenge (${e.time})` : 'Win a stadium challenge'; }
      case 'arena': { const a = typeof ARENAS !== 'undefined' && ARENAS.find(x => x.id === m.alvo); return a ? `Beat the ${a.nome} boss (when it takes the field)` : 'Beat an arena boss'; }
      case 'tarefa': return 'Complete the current Hunt (🎯 Hunt tasks)';
      case 'semana': return `Complete ${n} weekly tasks (🎯 Hunt tasks)`;
      case 'treino': return `Train ${n} times on the machines at a Training Center`;
      case 'figurinha': return (n === 1 ? 'Get 1 NEW sticker for the album' : `Get ${n} NEW stickers for the album`) + ' (choose from the display case at Seu Juca\'s newsstand)'; // v408.3 (ECA Digital): o pacotinho não se compra mais
      case 'xp': return `Earn ${fmt(n)} XP`;
      case 'dribles': return `Use ${n} dribbles on opponents`;
      case 'missoes': return n === 1 ? 'Complete 1 mission at your level' : `Complete ${n} missions at your level`;
    }
    return _descMeta.apply(this, arguments);
  };
  // v237: álbum completo = meta de figurinha cumprida (antes ficava impossível)
  const _metaOk = carrMetaOk;
  carrMetaOk = function (m) { if (m && m.tipo === 'figurinha' && G.save && Object.keys(G.save.figs || {}).length >= FIGURINHAS.length) return true; return _metaOk.apply(this, arguments); };
  const _progMeta = carrProgMeta;
  carrProgMeta = function (tipo, qtd = 1, filtro) {
    const c = carrDados(); const k = c && c.clube; if (!k || !k.metas) return;
    if (tipo === 'missoes' && CARR_MISSAO_LVL != null && CARR_MISSAO_LVL < (G.save.nivel || 1) - 20) return; // missão fácil demais não conta
    if (qtd > 0 && k.metas.some(m => m.tipo === tipo && (!filtro || filtro(m)))) k.metasTravadas = true; // começou a cumprir: não troca mais
    return _progMeta.apply(this, arguments);
  };
  const _evento = carreiraEvento;
  carreiraEvento = function (tipo, dados = {}) {
    if (tipo === 'missao') { try { const q = MISSOES.find(x => x.id === dados.id); CARR_MISSAO_LVL = q ? (q.lvl || 1) : null; } catch (e) { CARR_MISSAO_LVL = null; } }
    let r; try { r = _evento.apply(this, arguments); } finally { CARR_MISSAO_LVL = null; }
    const c = G.save && G.save.carreira; if (!c || !c.ativa || !c.clube) return r;
    switch (tipo) {
      case 'abate': {
        carrProgMeta('caca', 1, m => m.alvo === dados.monstro);
        const d = MONSTROS[dados.monstro]; if (d && d.arena) carrProgMeta('arena', 1, m => m.alvo === d.arena);
        break;
      }
      case 'estadio': carrProgMeta('estadio', 1, m => m.alvo === dados.id); carrAplica({ fama: 10, tor: 3 }); break;
      case 'tarefa': carrProgMeta('tarefa'); break;
      case 'tarefaSemana': carrProgMeta('semana'); break;
      case 'treino': carrProgMeta('treino'); break;
      case 'figurinha': carrProgMeta('figurinha'); break;
      case 'xp': carrProgMeta('xp', dados.n || 0); break;
      case 'drible': carrProgMeta('dribles'); break;
    }
    return r;
  };
}
// ganchos nos sistemas do jogo
{
  if (typeof fimDesafio === 'function') { const _fim = fimDesafio; fimDesafio = function (venceu) { const D = G.desafio; const r = _fim.apply(this, arguments); if (venceu && D && D.e) carreiraEvento('estadio', { id: D.e.id }); return r; }; }
  if (typeof tickEstacao === 'function') { const _tick = tickEstacao; tickEstacao = function () { const r = _tick.apply(this, arguments); carreiraEvento('treino', {}); return r; }; }
  const _fig = ganhaFigurinha; ganhaFigurinha = function (fid) { const nova = !(G.save.figs || {})[fid]; const r = _fig.apply(this, arguments); if (nova) carreiraEvento('figurinha', {}); return r; };
  const _xp = ganhaXp; ganhaXp = function () { const s = G.save, antes = s ? s.xp : 0; const r = _xp.apply(this, arguments); if (s && s.xp > antes && s.carreira && s.carreira.ativa) carreiraEvento('xp', { n: s.xp - antes }); return r; };
  const _ud = usarDrible; usarDrible = function (id) { const a = G.cds[id]; const r = _ud.apply(this, arguments); const dr = DRIBLES[id]; if (G.cds[id] !== a && dr && dr.tipo !== 'cura' && dr.tipo !== 'buff') carreiraEvento('drible', {}); return r; };
}
// escolher as 3 metas entre as 5 que o dirigente ofereceu
function carrBotaoMetas(k) {
  if (!k || !k.opcoesMeta || k.opcoesMeta.length <= 3 || k.metasTravadas) return null;
  return el('div', { class: 'opcoes', style: 'justify-content:flex-start;margin-top:6px' },
    el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => carrEscolherMetas(k) }, `🔄 Choose your targets (${k.opcoesMeta.length} options, you keep 3)`));
}
function carrEscolherMetas(k) {
  // v284: depois de recarregar o jogo, as metas escolhidas não são mais os MESMOS objetos das opções (o save vira texto): compara pelo conteúdo
  const igual = (a, b) => a.tipo === b.tipo && a.alvo === b.alvo && a.n === b.n;
  const escolhidas = new Set(k.opcoesMeta.filter(o => (k.metas || []).some(m => m === o || igual(m, o))).slice(0, 3));
  const lista = el('div', { class: 'cm-opcoes' });
  const conta = el('p', { class: 'dica' });
  const pinta = () => { conta.textContent = `Chosen: ${escolhidas.size} of 3. Until you start working on any of them, you can still swap.`; ok.disabled = escolhidas.size !== Math.min(3, k.opcoesMeta.length); };
  const ok = el('button', { class: 'btn verde', type: 'button', onclick: () => {
    k.metas = k.opcoesMeta.filter(m => escolhidas.has(m)); k.metas.forEach(m => { m.prog = 0; });
    carrLog('🎯 Targets chosen for this period: ' + k.metas.map(m => m.desc).join(' · '), 'l-xp'); carrSalvar(); if (typeof abrirCarreira === 'function') abrirCarreira(); else fechaModal();
  } }, 'Confirm targets');
  for (const m of k.opcoesMeta) {
    const cb = el('input', { type: 'checkbox', checked: escolhidas.has(m) ? 'checked' : null });
    cb.onchange = () => { if (cb.checked) { if (escolhidas.size >= 3) { cb.checked = false; return; } escolhidas.add(m); } else escolhidas.delete(m); pinta(); };
    const lin = el('label', { class: 'cm-op' + (escolhidas.has(m) ? ' on' : '') }, cb, el('span', { class: 'cm-ic' }, CARR_META_EMOJI[m.tipo] || '🎯'), el('span', { class: 'cm-ds' }, m.desc));
    cb.addEventListener('change', () => lin.classList.toggle('on', cb.checked));
    lista.append(lin);
  }
  pinta();
  abreModal(el('h2', {}, '🎯 Targets for this period'), el('p', {}, 'The club president wants 3 targets done by the next meeting. Pick the ones that suit you:'), lista, conta,
    el('div', { class: 'opcoes' }, ok, el('button', { class: 'btn', type: 'button', onclick: () => { if (typeof abrirCarreira === 'function') abrirCarreira(); else fechaModal(); } }, 'Back')));
}
// XP da meta com separador de milhar (ex.: 4.521/12.000)
{ const _linha = carrMetaLinha; carrMetaLinha = function (m) { const d = _linha.apply(this, arguments); if (m && m.tipo === 'xp') { const nn = d.querySelector('.nn'); if (nn) nn.textContent = `${fmt(Math.min(m.prog, m.n))}/${fmt(m.n)}${carrMetaOk(m) ? ' ✅' : ''}`; } return d; }; }
{
  const st = document.createElement('style');
  st.textContent = `.cm-opcoes { display: grid; gap: 6px; margin: 8px 0; }
  .cm-op { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 10px; background: rgba(0,0,0,.05); border: 2px solid transparent; cursor: pointer; font-weight: 700; }
  .cm-op.on { background: rgba(255,210,63,.3); border-color: #e0a800; }
  .cm-op input { width: 18px; height: 18px; flex: none; } .cm-ic { font-size: 20px; flex: none; } .cm-ds { flex: 1; line-height: 1.3; }`;
  document.head.append(st);
}
