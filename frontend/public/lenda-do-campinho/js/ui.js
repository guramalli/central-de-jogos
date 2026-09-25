/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — interface: painéis, diálogos, lojas,
   minijogos (pênalti, quiz, matemática), álbum, ranking
   ============================================================ */

/* ---------------- log, banner ---------------- */
function log(msg, cls = 'l-info') {
  const L = $('#log'); if (!L) return;
  const h = G.save ? String(Math.floor(G.save.hora / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(G.save.hora % 60)).padStart(2, '0') : '';
  L.append(el('div', { class: cls }, (h ? h + ' ' : '') + msg));
  while (L.children.length > 120) L.firstChild.remove();
  L.scrollTop = L.scrollHeight;
}
let bannerT;
function banner(t1, t2 = '') {
  const b = $('#banner'); if (!b) return;
  b.innerHTML = ''; b.append(el('div', { class: 'b1' }, t1), el('div', { class: 'b2' }, t2));
  b.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), 2600);
}

/* ---------------- retrato com as peças do site ---------------- */
function camadasRetrato(cfg) {
  // cfg: {corpo, pele, cabelo, corCabelo, roupa, baixo, rosto, chapeu, pescoco, mao, costas, fundo}
  const url = p => `${ASSET_BASE}/avatar/${p}-v2.webp`;
  const L = [];
  if (cfg.fundo) L.push({ src: url('fundo/' + cfg.fundo) });
  if (cfg.costas) L.push({ src: url('costas/' + cfg.costas) });
  L.push({ src: url('pele/' + cfg.pele + (cfg.corpo === 'f' ? '-f' : '')) });
  if (cfg.baixo) L.push({ src: url('parteDeBaixo/' + cfg.baixo) });
  if (cfg.roupa) L.push({ src: url('roupa/' + cfg.roupa) });
  if (cfg.pescoco) L.push({ src: url('pescoco/' + cfg.pescoco) });
  if (cfg.cabelo) {
    const cor = (AVATAR.coresCabelo.find(c => c.id === cfg.corCabelo) || {}).cor;
    if (cor) L.push({ tinta: url('cabelo/' + cfg.cabelo.replace(/$/, '-cinza')), cor });
    else L.push({ src: url('cabelo/' + cfg.cabelo) });
  }
  if (cfg.rosto) L.push({ src: url('rosto/' + cfg.rosto) });
  if (cfg.chapeu) L.push({ src: url('chapeu/' + cfg.chapeu) });
  if (cfg.mao) L.push({ src: url('mao/' + cfg.mao) });
  return L;
}
function montaRetrato(alvo, cfg, aura) {
  alvo.innerHTML = '';
  if (aura) alvo.append(el('span', { class: 'aura' }));
  for (const c of camadasRetrato(cfg)) {
    if (c.tinta) {
      const w = el('span', { class: 'pintado' });
      w.append(el('img', { src: c.tinta, alt: '', draggable: 'false' }));
      const t = el('span', { class: 'tinta' }); t.style.backgroundColor = c.cor; t.style.maskImage = `url("${c.tinta}")`; t.style.webkitMaskImage = `url("${c.tinta}")`;
      w.append(t); alvo.append(w);
    } else {
      const img = el('img', { src: c.src, alt: '', draggable: 'false' });
      img.onerror = () => img.remove();
      alvo.append(img);
    }
  }
}
function cfgRetratoJogador() {
  const s = G.save; const eq = s.equip; const fase = faseIdx(s.nivel);
  const av = id => id && ITENS[id] && ITENS[id].avatar;
  const cfg = { corpo: s.corpo, pele: s.look.pele, cabelo: s.look.cabelo, corCabelo: s.look.corCabelo, rosto: s.look.rosto, fundo: FASES[fase].fundo };
  cfg.roupa = av(eq.camisa) || (eq.camisa ? s.look.roupa : 'roupa-regata');
  cfg.baixo = av(eq.calcao) || s.look.baixo;
  const cab = av(eq.cabeca); if (cab) cfg.chapeu = cab;
  const pes = av(eq.acessorio); if (pes) cfg.pescoco = pes;
  if (s.flags.craque) cfg.mao = 'mao-estatueta-ouro';
  else if (s.flags.pegou_bola) cfg.mao = 'mao-bola';
  if (fase === 0) cfg.costas = 'costas-mochila';
  if (fase === 4) cfg.costas = 'costas-anjo';
  return cfg;
}
function atualizaRetrato() {
  if (!G.save) return; const r = $('#retrato'); if (!r) return;
  r.innerHTML = ''; if (faseIdx(G.save.nivel) >= 3) r.append(el('span', { class: 'aura' }));
  const c = mkCanvas(300, 400); c.className = 'retrato-cv'; r.append(c); pintaAparencia(c, lookJogador(true), { inteiro: true });
}
function abreAba(nome) { const b = document.querySelector(`.abas button[data-aba=${nome}]`); if (b) b.click(); }
function telaCarregando(save) {
  const box = $('#inicioMenu'); $('#criacao').hidden = true; box.hidden = false; box.innerHTML = '';
  const barra = el('i'); barra.style.width = '0%';
  box.append(el('p', { class: 'resumo' }, 'Carregando o mundo...'), el('div', { class: 'progresso', style: 'width:min(360px,80vw)' }, barra));
  const urls = [...camadasDe(lookJogador(true)), ...camadasDe(lookJogador())].map(l => l.url);
  return carregaAssets(urls, p => barra.style.width = Math.round(p * 100) + '%');
}
// integra o módulo Copa dos Sonhos (se existir)
if (typeof NPC_COPA !== 'undefined') { NPCS.almanaque = NPC_COPA; if (typeof MISSOES_COPA !== 'undefined') MISSOES_COPA.forEach(q => { if (!MISSOES.some(m => m.id === q.id)) MISSOES.push(q); }); }
function cfgCriacaoFallback(d) { return { corpo: d.corpo, pele: d.pele, cabelo: d.cabelo, corCabelo: d.corCabelo, roupa: d.roupa, baixo: d.baixo, rosto: d.rosto, fundo: 'fundo-quarto', costas: 'costas-mochila' }; }

/* ---------------- painéis laterais ---------------- */
function montaPaineis() {
  const hb = $('#hotbar'); hb.innerHTML = '';
  while (G.save.hotbar.length < HOTBAR_N) G.save.hotbar.push(null); // saves antigos ganham a 2ª fileira
  for (let i = 0; i < HOTBAR_N; i++) {
    const b = el('button', { class: 'slot' + (i >= 10 ? ' num' : ''), 'data-i': i, title: '' });
    b.addEventListener('click', () => usarHotbar(i));
    b.addEventListener('contextmenu', ev => { ev.preventDefault(); G.save.hotbar[i] = null; G.uiSujo = true; });
    hb.append(b);
  }
  document.querySelectorAll('.abas button').forEach(b => b.onclick = () => {
    const sel = `[data-aba=${b.dataset.aba}]`;
    if (G.save.tut < TUTORIAL.length && TUTORIAL[G.save.tut].destaque === sel) avancaTutorial();
    if (G.dicasFila[0] && G.dicasFila[0].destaque === sel) { G.dicasFila.shift(); G.uiSujo = true; }
    document.querySelectorAll('.abas button').forEach(x => x.classList.toggle('ativa', x === b));
    document.querySelectorAll('.aba').forEach(a => a.classList.toggle('ativa', a.id === 'aba-' + b.dataset.aba));
  });
  $('#btnModo').onclick = trocaModo;
  $('#btnClasse').onclick = usarClasse; $('#btnCaca').onclick = alternaCaca; $('#btnFicha').onclick = abreFicha;
  $('#btnSom').onclick = () => { G.somOn = !G.somOn; $('#btnSom').textContent = G.somOn ? '🔊' : '🔇'; $('#btnSom').title = G.somOn ? 'Som ligado (clique para desligar)' : 'Som desligado (clique para ligar)'; };
}
function atualizaBarras() {
  const s = G.save, st = stats();
  s.hp = Math.min(s.hp, st.maxHp); s.foco = Math.min(s.foco, st.maxFoco);
  $('#bHp').style.width = (s.hp / st.maxHp * 100) + '%'; $('#tHp').textContent = `Fôlego ${fmt(s.hp)} / ${fmt(st.maxHp)}`;
  $('#bFoco').style.width = (s.foco / st.maxFoco * 100) + '%'; $('#tFoco').textContent = `Foco ${fmt(s.foco)} / ${fmt(st.maxFoco)}`;
  const a = xpPara(s.nivel), b = xpPara(s.nivel + 1);
  $('#bXp').style.width = ((s.xp - a) / (b - a) * 100) + '%'; $('#tXp').textContent = `XP ${fmt(s.xp)} / ${fmt(b)}`;
  $('#ouro').textContent = fmt(s.ouro);
  const h = Math.floor(s.hora / 60) % 24, mi = Math.floor(s.hora % 60);
  $('#relogio').textContent = `Dia ${s.dia} — ${String(h).padStart(2, '0')}:${String(mi - mi % 10).padStart(2, '0')}`;
}
function atualizaHotbarCd() {
  const s = G.save; const st = stats();
  { const b = $('#btnClasse'); const cl = CLASSES[s.classe]; let cd = b.querySelector('.cd'); const rest = (G.cds.classe || 0) - G.agora;
    if (cl && rest > 0) { if (!cd) { cd = el('i', { class: 'cd' }); b.append(cd); } cd.style.width = (rest / cl.especial.cd * 100) + '%'; } else if (cd) cd.remove(); }
  document.querySelectorAll('#hotbar .slot').forEach((b, i) => {
    const h = s.hotbar[i]; let cd = b.querySelector('.cd');
    if (!h) { if (cd) cd.remove(); return; }
    let fim = 0, dur = 1;
    if (h.t === 'd') { const dr = DRIBLES[h.id]; const g = dr.tipo === 'cura' ? 'cura' : 'ataque'; fim = Math.max(G.cds[g] || 0, G.cds[h.id] || 0); dur = Math.max(dr.cd, 1000); b.classList.toggle('off', s.nivel < dr.lvl || s.foco < dr.foco); }
    else { fim = G.cds.pocao || 0; dur = 1000; const q = b.querySelector('.qtd'); const n = contaItem(h.id); if (q) q.textContent = n; b.classList.toggle('off', !n); }
    const rest = fim - G.agora;
    if (rest > 0) { if (!cd) { cd = el('i', { class: 'cd' }); b.append(cd); } cd.style.height = clamp(rest / dur * 100, 0, 100) + '%'; } else if (cd) cd.remove();
  });
}
function atualizaPaineis() {
  const s = G.save; if (!s) return; const st = stats();
  // perfil
  $('#pNome').textContent = s.nome;
  $('#pFase').textContent = FASES[faseIdx(s.nivel)].nome + (s.posicao ? ' — ' + POSICOES[s.posicao].nome : '');
  $('#pNivel').textContent = 'Nível ' + s.nivel;
  $('#btnModo').textContent = 'X · ' + (G.modo === 'drible' ? 'Drible' : 'Chute');
  { const cl = CLASSES[s.classe]; $('#btnClasse').innerHTML = ''; $('#btnClasse').append(el('span', { class: 'tecla' }, 'Q'), cl ? `${cl.emoji} ${cl.especial.nome}` : 'Classe'); $('#btnClasse').title = cl ? cl.especial.desc : ''; }
  $('#btnCaca').textContent = 'G · Caça: ' + (G.caca ? 'ON' : 'off'); $('#btnCaca').classList.toggle('ligado', !!G.caca);
  $('#btnFicha').classList.toggle('tem-pontos', (s.pontos || 0) > 0); { const tx = (s.pontos || 0) > 0 ? `📋 Ficha +${s.pontos}` : '📋 Ficha'; if ($('#btnFicha').textContent !== tx) $('#btnFicha').textContent = tx; }
  // hotbar
  document.querySelectorAll('#hotbar .slot').forEach((b, i) => {
    const h = s.hotbar[i]; b.innerHTML = ''; b.append(el('span', { class: 'tecla' }, teclaSlot(i)));
    if (!h) { b.title = 'Vazio'; return; }
    if (h.t === 'd') { const dr = DRIBLES[h.id]; b.prepend(iconeClone(iconeDrible(h.id))); b.title = `${dr.nome} — ${dr.desc} (nível ${dr.lvl}, ${dr.foco} de foco). Botão direito remove.`; }
    else { b.prepend(iconeClone(iconeItem(h.id))); b.append(el('span', { class: 'qtd' }, contaItem(h.id))); b.title = ITENS[h.id].nome + ' — botão direito remove.'; }
  });
  // equipamento: boneco com cada peça no seu lugar do corpo (desenho, posições e linhas em layout.js)
  const eq = $('#equip'); eq.innerHTML = '';
  const g = el('div', { class: 'equip-grade equip-boneco' });
  const rot = { cabeca: 'Cabeça', acessorio: 'Pescoço', camisa: 'Camisa', calcao: 'Calção', perna: 'Caneleira', chuteira: 'Chuteira' };
  for (const slot of ['cabeca', 'camisa', 'acessorio', 'perna', 'calcao', 'chuteira']) {
    const id = s.equip[slot]; const b = el('div', { class: 'eq-slot ' + (id ? 'cheio' : 'eq-vazio'), 'data-slot': slot, title: id ? `${ITENS[id].nome} — ${ITENS[id].desc} (clique para tirar)` : `${rot[slot]}: vazio. Arraste um item da Mochila para cá.` });
    if (id) b.append(iconeClone(iconeItem(id)));
    else if (typeof fantasmaSlot === 'function') b.append(fantasmaSlot(slot));
    const rq = (s.equipR || {})[slot]; if (id && rq) { b.append(el('span', { class: 'ref' }, '+' + rq)); b.title = nomeItem(id, rq) + ' — clique para tirar'; }
    b.append(el('span', { class: 'rot' }, rot[slot]));
    b.onclick = () => id && desequipar(slot);
    g.append(b);
  }
  if (typeof montaBonecoEquip === 'function') montaBonecoEquip(g);
  eq.append(g, el('div', { class: 'eq-tot' }, el('span', {}, 'Ataque ', el('b', {}, st.atk)), el('span', {}, 'Defesa ', el('b', {}, st.armadura)), el('span', {}, 'Veloc. ', el('b', {}, Math.round(st.vel)))));
  // mochila
  const mo = $('#mochila'); mo.innerHTML = '';
  if (typeof organizaMochila === 'function') mo.append(el('div', { class: 'mochila-org' }, el("span", { title: "Itens na mochila" }, `🎒 ${s.mochila.length}/30`),
    el('button', { class: 'btn mini', type: 'button', title: 'Organizar: os mais raros primeiro (mítico → comum)', onclick: () => organizaMochila('raridade') }, '⭐ Por raridade'),
    el('button', { class: 'btn mini', type: 'button', title: 'Organizar: juntos por função: bebidas, comidas, equipamentos (cabeça → chuteira), materiais...', onclick: () => organizaMochila('funcao') }, '🧩 Por função')));
  const gm = el('div', { class: 'mochila-grade' });
  for (let i = 0; i < 30; i++) {
    const it = s.mochila[i]; const b = el('button', { class: 'slot' + (it && ITENS[it.id].raro ? ' raro' : '') });
    if (it) {
      b.append(iconeClone(iconeItem(it.id))); if (it.q > 1) b.append(el('span', { class: 'qtd' }, it.q));
      if (it.r) b.append(el('span', { class: 'ref' }, '+' + it.r));
      b.title = nomeItem(it.id, it.r); b.onclick = () => modalItem(it.id, it.r || 0);
      b.oncontextmenu = ev => { ev.preventDefault(); if (ITENS[it.id].tipo === 'equip') equipar(it.id, it.r || 0); else usarItem(it.id); };
    }
    gm.append(b);
  }
  mo.append(gm, el('div', { class: 'vazio' }, 'Clique num item para ver. Botão direito usa/equipa.'));
  // habilidades
  const sk = $('#skills'); sk.innerHTML = '';
  const a = xpPara(s.nivel), bxp = xpPara(s.nivel + 1);
  sk.append(el('div', { class: 'sk-linha' }, el('div', { class: 'top' }, el('b', {}, 'Nível ' + s.nivel), el('span', {}, `faltam ${fmt(bxp - s.xp)} XP · ${Math.floor((s.xp - a) / (bxp - a) * 100)}%`)), el('div', { class: 'sk-bar' }, barraI((s.xp - a) / (bxp - a)))));
  for (const k of ['drible', 'chute', 'defesa', 'visao']) {
    const o = s.sk[k]; const bonus = st[k] - o.lv;
    sk.append(el('div', { class: 'sk-linha', title: SKILLS[k].desc }, el('div', { class: 'top' }, el('span', {}, SKILLS[k].nome), el('b', {}, st[k] + (bonus ? ` (+${bonus})` : ''), el('small', { class: 'sk-pc' }, ` · ${Math.floor(o.t / precisaTentativas(k, o.lv) * 100)}%`))), el('div', { class: 'sk-bar' }, barraI(o.t / precisaTentativas(k, o.lv)))));
  }
  const hh = Math.floor(s.st.tempo / 3600), mm = Math.floor(s.st.tempo / 60) % 60;
  sk.append(el('div', { class: 'sk-info' },
    el('span', {}, 'Posição:'), el('b', {}, s.posicao ? POSICOES[s.posicao].nome : 'nível 10'),
    el('span', {}, 'Adversários:'), el('b', {}, fmt(s.st.abates)),
    el('span', {}, 'Chefões:'), el('b', {}, s.st.chefes),
    el('span', {}, 'Gols de pênalti:'), el('b', {}, s.st.gols),
    el('span', {}, 'Quiz certas:'), el('b', {}, s.st.quiz + s.st.prof),
    el('span', {}, 'Figurinhas:'), el('b', {}, `${Object.keys(s.figs).length}/${FIGURINHAS.length}`),
    el('span', {}, 'Vezes exausto:'), el('b', {}, s.st.mortes),
    el('span', {}, 'Tempo de jogo:'), el('b', {}, `${hh}h${String(mm).padStart(2, '0')}`),
  ));
  sk.append(el('p', { class: 'vazio' }, 'Dribles aprendidos: ' + (s.dribles.map(d => DRIBLES[d].nome).join(', ') || 'nenhum ainda')));
  atualizaRastreador(); atualizaBatalha(); atualizaBarras();
}
function barraI(p) { const i = el('i'); i.style.width = clamp(p * 100, 0, 100) + '%'; return i; }
function iconeClone(c) { const n = mkCanvas(c.width, c.height); n.getContext('2d').drawImage(c, 0, 0); return n; }

function atualizaBatalha() {
  const L = $('#listaBatalha'); if (!L || !G.p) return;
  const p = G.p; const vis = G.mons.filter(m => Math.abs(m.x - p.x) <= 7 && Math.abs(m.y - p.y) <= 5).sort((a, b) => dist(a, p) - dist(b, p));
  const chave = vis.map(m => m.uid + ':' + Math.round(m.hp / m.d.hp * 20)).join(',') + '|' + (G.alvo ? G.alvo.uid : '');
  if (L.dataset.k === chave) return; L.dataset.k = chave;
  L.innerHTML = '';
  if (!vis.length) { L.append(el('div', { class: 'vazio' }, 'Nenhum adversário por perto. Clique num adversário no mapa (ou aperte ESPAÇO) para marcá-lo como alvo.')); return; }
  for (const m of vis) {
    const c = mkCanvas(64, 80); pintaAparencia(c, m.d.look);
    const pc = m.d.treino ? 1 : clamp(m.hp / m.d.hp, 0, 1);
    const hp = el('div', { class: 'bl-hp' }); const i = el('i'); i.style.width = pc * 100 + '%'; i.style.background = pc > 0.6 ? '#3ad83a' : pc > 0.3 ? '#e8d23a' : '#e83a3a'; hp.append(i);
    const row = el('div', { class: 'bl-item' + (G.alvo === m ? ' alvo' : '') }, c, el('div', { style: 'flex:1' }, el('div', { class: 'bl-nome' }, el('span', { class: 'bl-nv', style: `color:${corNivel(nivelMonstro(m.d))}` }, `Nv ${nivelMonstro(m.d)} `), m.d.nome + (m.d.chefe ? ' ★' : '')), hp));
    row.onclick = () => { G.alvo = G.alvo === m ? null : m; G.uiSujo = true; };
    L.append(row);
  }
}
function atualizaRastreador() {
  const R = $('#rastreador'); if (!R) return; R.innerHTML = '';
  document.querySelectorAll('.destaque').forEach(e => e.classList.remove('destaque'));
  const s = G.save;
  const dc = G.dicasFila[0];
  if (dc) {
    R.append(el('div', { class: 'cartao-dica' }, el('b', {}, '💡 Dica'), el('p', {}, dc.txt), el('button', { class: 'btn amarelo mini', onclick: () => { G.dicasFila.shift(); G.uiSujo = true; } }, 'Entendi')));
    if (dc.destaque) document.querySelectorAll(dc.destaque).forEach(e => e.classList.add('destaque'));
  } else if (s.tut < TUTORIAL.length) {
    const st = TUTORIAL[s.tut];
    if (G.tutMin === s.tut) {
      // passo minimizado: só uma etiqueta; ele continua valendo e avança sozinho quando a ação for feita
      R.append(el('button', { class: 'btn mini cartao-tut-min', type: 'button', onclick: () => { G.tutMin = -1; G.uiSujo = true; } }, `📖 Tutorial ${s.tut + 1}/${TUTORIAL.length} · ver dica`));
    } else {
      const ops = el('div', { class: 'tut-ops' });
      if (st.ok) ops.append(el('button', { class: 'btn amarelo mini', onclick: avancaTutorial }, 'Entendi'));
      else ops.append(el('button', { class: 'btn amarelo mini', title: 'Esconde a dica; o tutorial continua quando você fizer o que ela pede', onclick: () => { G.tutMin = s.tut; G.uiSujo = true; } }, 'Ok'));
      ops.append(el('button', { class: 'btn mini', onclick: () => { if (confirm('Pular o tutorial? As dicas continuam aparecendo.')) pularTutorial(); } }, 'Pular tutorial'));
      R.append(el('div', { class: 'cartao-tut' }, el('div', { class: 'tut-topo' }, el('b', {}, `Tutorial ${s.tut + 1}/${TUTORIAL.length}`), st.tecla ? el('span', { class: 'kbd' }, st.tecla) : ''), el('p', {}, st.txt), ops));
      if (st.destaque) document.querySelectorAll(st.destaque).forEach(e => e.classList.add('destaque'));
    }
  }
  if (s.tut >= TUTORIAL.length) {
    let n = 0;
    for (const q of MISSOES) {
      const e = s.quests[q.id]; if (!e || e.s !== 'ativa') continue; if (n++ >= 2) break;
      const [a, b] = progressoMissao(q); const pronta = a >= b;
      R.append(el('div', { class: 'rast' + (pronta ? ' pronta' : '') }, el('b', {}, q.titulo), el('br'), pronta ? `Pronta! Fale com ${NPCS[q.npc].nome}` : `${descMissao(q)}: ${a}/${b}`));
    }
    if (s.tarefa) R.append(el('div', { class: 'rast' + (s.tarefa.p >= s.tarefa.n ? ' pronta' : '') }, el('b', {}, 'Desafio: '), `${MONSTROS[s.tarefa.m].nome} ${s.tarefa.p}/${s.tarefa.n}`));
  }
}

/* ---------------- modal genérico ---------------- */
function abreModal(...conteudo) {
  const M = $('#modal'); const C = $('#modalConteudo'); C.innerHTML = ''; C.append(...conteudo.flat());
  M.hidden = false; G.pausado = true; G.teclas.clear(); M.querySelector('.fechar').hidden = false;
  M.querySelector('.modal-caixa').classList.toggle('largo', !!abreModal.largo); abreModal.largo = false;
}
function fechaModal() {
  $('#modal').hidden = true; G.pausado = false; window.teclaModal = null;
  if (window.pararPenalti) window.pararPenalti(); if (window.pararQuiz) window.pararQuiz(); if (window.pararPartida) window.pararPartida();
  G.uiSujo = true; if (G.save) salvar();
}
function precoTag(v) { return el('span', { class: 'preco' }, el('i', { class: 'coin' }), fmt(v)); }

function modalItem(id, r = 0) {
  const it = ITENS[id]; const s = G.save; const n = contaItem(id);
  const c = iconeClone(iconeItem(id)); c.style.width = '64px'; c.style.height = '64px';
  const info = [];
  if (it.tipo === 'equip') info.push(statsItemTxt(id, r));
  if (it.tipo !== 'equip') for (const k in (it.st || {})) info.push(`+${it.st[k]} ${({ drible: 'drible', chute: 'chute', defesa: 'defesa', visao: 'visão', hp: 'fôlego', foco: 'foco', vel: 'velocidade', regen: 'regeneração' })[k]}`);
  if (it.lvl) info.push(`Nível ${it.lvl}`);
  const ops = el('div', { class: 'opcoes' });
  if (it.tipo === 'equip') ops.append(el('button', { class: 'btn amarelo', onclick: () => { equipar(id, r); fechaModal(); } }, 'Equipar'));
  if (it.tipo === 'comida') ops.append(el('button', { class: 'btn amarelo', onclick: () => { usarItem(id); fechaModal(); } }, 'Comer'), el('button', { class: 'btn', onclick: () => { poeNaHotbar('i', id); fechaModal(); } }, 'Pôr na barra de atalhos'));
  if (it.tipo === 'consumivel') {
    ops.append(el('button', { class: 'btn amarelo', onclick: () => { usarItem(id); fechaModal(); } }, 'Usar'));
    ops.append(el('button', { class: 'btn', onclick: () => { poeNaHotbar('i', id); fechaModal(); } }, 'Pôr na barra de atalhos'));
  }
  if (it.tipo !== 'chave') ops.append(el('button', { class: 'btn', onclick: () => { if (confirm(`Jogar fora ${it.nome}?`)) { if (it.tipo === 'equip') removeEquipR(id, r); else removeItem(id, n); fechaModal(); } } }, 'Jogar fora'));
  abreModal(el('h2', {}, nomeItem(id, r)), el('div', { class: 'npc-topo' }, c, el('div', {}, el('p', {}, it.desc || ''), el('p', {}, info.join(' · ')), el('p', {}, `Você tem: ${n}` + (it.venda ? ` · Vale ${it.venda} tostões` : '')))), ops);
}

/* ---------------- NPCs ---------------- */
function retratoNPC(npc) {
  const c = mkCanvas(180, 225);
  if (npc.d.quadro) { const im = aSprite('quadro'); if (im) { const x = c.getContext('2d'); const w = 160, h = w * im.height / im.width; x.drawImage(im, 10, 225 - h, w, h); } }
  else pintaAparencia(c, npc.d.look);
  return c;
}
function abrirNPC(npc) {
  const d = npc.d; const s = G.save; if (!d.quadro) npc.flip = G.p.x < npc.x;
  if (d.quadro) return modalQuadro();
  let fala = d.ola;
  const ops = el('div', { class: 'opcoes' });
  const extras = [];
  // missões deste NPC
  const qs = MISSOES.filter(q => q.npc === npc.id);
  const ativa = qs.find(q => ['ativa', 'pronta'].includes(statusMissao(q)));
  if (ativa) {
    const st = statusMissao(ativa); const [a, b] = progressoMissao(ativa);
    if (st === 'pronta') {
      fala = ativa.fim ? 'Você conseguiu!' : fala;
      ops.append(el('button', { class: 'btn amarelo', onclick: () => { entregaMissao(ativa); abrirNPCDepois(npc, ativa.fim); } }, `Entregar: ${ativa.titulo}`));
    } else {
      extras.push(el('div', { class: 'linha-item' }, el('div', { class: 'nm' }, el('b', {}, ativa.titulo), el('small', {}, `${descMissao(ativa)} — ${a}/${b}`)), ));
      if (ativa.id === 'q_peneira') ops.append(el('button', { class: 'btn amarelo', onclick: modalPosicao }, 'Escolher minha posição'));
    }
  } else {
    const disp = qs.find(q => statusMissao(q) === 'disponivel');
    if (disp) ops.append(el('button', { class: 'btn amarelo', onclick: () => modalMissao(npc, disp) }, `Missão: ${disp.titulo}`));
    else {
      const prox = qs.find(q => statusMissao(q) === 'nivel');
      if (prox) extras.push(el('p', {}, `(Volte quando estiver no nível ${prox.lvl}: tenho outra missão pra você.)`));
    }
  }
  if (d.loja) ops.append(el('button', { class: 'btn verde', onclick: () => modalLoja(npc) }, 'Comprar / vender'));
  if (d.professor) ops.append(el('button', { class: 'btn roxo', onclick: () => modalProfessor(npc) }, 'Aprender dribles'));
  if (d.quiz) ops.append(el('button', { class: 'btn roxo', onclick: () => modalQuiz('futebol') }, quizFalta('futebol') > 0 ? `Quiz de futebol (volta em ${fmtFalta(quizFalta('futebol'))})` : 'Quiz de futebol'));
  if (d.prof) ops.append(el('button', { class: 'btn roxo', onclick: () => modalQuiz('mat') }, quizFalta('mat') > 0 ? `Aula de matemática (volta em ${fmtFalta(quizFalta('mat'))})` : 'Aula de matemática'));
  if (d.copa && typeof abrirCopaSonhos === 'function') ops.append(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); abrirCopaSonhos(); } }, 'Copa dos Sonhos'));
  if (d.cura) ops.append(el('button', { class: 'btn', onclick: () => { const st = stats(); s.hp = st.maxHp; s.foco = st.maxFoco; efeito('curaforte', G.p.x, G.p.y, '#5affb0'); som('cura'); log(`${d.nome} cuidou de você. Fôlego e foco cheios!`, 'l-npc'); fechaModal(); } }, 'Descansar (recupera tudo)'));
  if (d.refino) ops.append(el('button', { class: 'btn amarelo', onclick: () => modalRefino(npc) }, 'Refinar equipamentos'));
  if (d.aviao && typeof modalVoo === 'function') ops.append(el('button', { class: 'btn amarelo', onclick: () => modalVoo(npc) }, '✈️ Voar'));
  if (d.empresario && typeof abrirCarreira === 'function' && s.nivel >= 25) ops.append(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); abrirCarreira(); } }, 'Minha carreira'));
  if (d.onibus) ops.append(el('button', { class: 'btn', onclick: modalOnibus }, 'Viajar de ônibus'));
  if (d.empresario) ops.append(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); abrirTime(); } }, s.time ? 'Gerenciar meu time' : 'Fundar meu time'));
  if (d.posicao && s.posicao && s.nivel >= 10) ops.append(el('button', { class: 'btn', onclick: modalPosicao }, 'Trocar de posição'));
  if (d.posicao && s.classe && s.nivel >= 2) ops.append(el('button', { class: 'btn', onclick: redistribuiAtributos }, `Redistribuir atributos (${fmt(150 * s.nivel)})`));
  ops.append(el('button', { class: 'btn', onclick: fechaModal }, 'Tchau!'));
  abreModal(el('h2', {}, d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, fala), ...extras)), ops);
}
function abrirNPCDepois(npc, txt) {
  abreModal(el('h2', {}, npc.d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, txt || 'Valeu!'))), el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => abrirNPC(npc) }, 'Continuar'), el('button', { class: 'btn', onclick: fechaModal }, 'Fechar')));
}
function modalMissao(npc, q) {
  const r = q.rec; const rec = [];
  if (r.xp) rec.push(`${fmt(r.xp)} XP`); if (r.ouro) rec.push(`${fmt(r.ouro)} tostões`);
  (r.itens || []).forEach(([id, n]) => rec.push(`${n}x ${ITENS[id].nome}`)); if (r.drible) rec.push(`drible ${DRIBLES[r.drible].nome}`);
  abreModal(el('h2', {}, q.titulo), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, q.texto), el('p', {}, el('b', {}, 'Objetivo: '), descMissao(q)), el('p', {}, el('b', {}, 'Recompensa: '), rec.join(', ')))),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => { aceitaMissao(q); fechaModal(); } }, 'Aceitar!'), el('button', { class: 'btn', onclick: () => abrirNPC(npc) }, 'Agora não')));
}
function modalPosicao() {
  const s = G.save; const troca = !!s.posicao; const custo = 2000;
  const cards = el('div', { class: 'cards-pos' });
  for (const k in POSICOES) {
    const p = POSICOES[k];
    cards.append(el('div', { class: 'card-pos', style: `border-color:${p.cor}` }, el('h4', {}, p.nome), el('p', {}, p.desc),
      el('p', {}, `+${p.hp} fôlego e +${p.foco} foco por nível`),
      el('button', { class: 'btn amarelo', disabled: s.posicao === k || (troca && s.ouro < custo) ? 'disabled' : null, onclick: () => {
        if (troca) s.ouro -= custo;
        s.posicao = k; s.flags.escolheu_posicao = true; const st = stats(); s.hp = st.maxHp; s.foco = st.maxFoco;
        log(`Você agora é ${p.nome}!`, 'l-lvl'); banner(p.nome.toUpperCase(), 'Posição escolhida'); som('nivel'); salvar(); fechaModal();
      } }, s.posicao === k ? 'Atual' : 'Escolher')));
  }
  abreModal(el('h2', {}, troca ? 'Trocar de posição' : 'A peneira: escolha sua posição'), el('p', {}, troca ? `Trocar custa ${custo} tostões. Seus atributos continuam, mas o crescimento muda.` : 'Cada posição evolui de um jeito. Isso define seu estilo de jogo daqui pra frente.'), cards);
}

/* ---------------- loja ---------------- */
function modalLoja(npc, aba = 'comprar') {
  const s = G.save; const d = npc.d;
  const tabs = el('div', { class: 'tabs-modal' },
    el('button', { class: 'btn ' + (aba === 'comprar' ? 'amarelo' : ''), onclick: () => modalLoja(npc, 'comprar') }, 'Comprar'),
    el('button', { class: 'btn ' + (aba === 'vender' ? 'amarelo' : ''), onclick: () => modalLoja(npc, 'vender') }, 'Vender'),
    el('button', { class: 'btn', onclick: () => abrirNPC(npc) }, 'Voltar'));
  const lista = el('div', { class: 'lista' });
  if (aba === 'comprar') {
    for (const id of d.loja) {
      const it = ITENS[id]; if (!it.preco) continue;
      const qtd = el('input', { type: 'number', min: 1, max: 100, value: 1 });
      const bloq = it.lvl && s.nivel < it.lvl;
      lista.append(el('div', { class: 'linha-item' + (bloq ? ' bloq' : '') }, iconeClone(iconeItem(id)),
        el('div', { class: 'nm' }, el('b', {}, it.nome), el('small', {}, it.desc + (it.lvl > 1 ? ` (nível ${it.lvl})` : ''))),
        precoTag(it.preco), empilha(id) ? qtd : '',
        el('button', { class: 'btn verde mini', onclick: () => {
          const q = empilha(id) ? clamp(parseInt(qtd.value) || 1, 1, 100) : 1; const total = q * it.preco;
          if (s.ouro < total) { log('Tostões insuficientes!', 'l-dano'); som('erro'); return; }
          if (addItem(id, q)) { s.ouro -= total; log(`Você comprou ${q}x ${it.nome} por ${fmt(total)} tostões.`, 'l-loot'); som('moeda'); modalLoja(npc, 'comprar'); }
        } }, 'Comprar')));
    }
  } else {
    const vendaveis = s.mochila.map((m, i) => ({ ...m, i })).filter(m => ITENS[m.id].venda);
    if (!vendaveis.length) lista.append(el('p', {}, 'Você não tem nada para vender.'));
    const vistos = new Set();
    for (const m of vendaveis) {
      const chave = m.id + '|' + (m.r || 0); if (vistos.has(chave)) continue; vistos.add(chave);
      if (m.r) { const itR = ITENS[m.id]; const v = Math.round(itR.venda * (1 + 0.5 * m.r)); lista.append(el('div', { class: 'linha-item' }, iconeClone(iconeItem(m.id)), el('div', { class: 'nm' }, el('b', {}, nomeItem(m.id, m.r)), el('small', {}, 'Refinado')), precoTag(v), el('button', { class: 'btn mini', onclick: () => { if (!confirm('Vender ' + nomeItem(m.id, m.r) + '?')) return; removeEquipR(m.id, m.r); s.ouro += v; som('moeda'); modalLoja(npc, 'vender'); } }, 'Vender'))); continue; }
      const it = ITENS[m.id]; const n = s.mochila.filter(x => x.id === m.id && !x.r).reduce((a, x) => a + x.q, 0);
      lista.append(el('div', { class: 'linha-item' }, iconeClone(iconeItem(m.id)), el('div', { class: 'nm' }, el('b', {}, it.nome), el('small', {}, `Você tem ${n}`)), precoTag(it.venda),
        el('button', { class: 'btn mini', onclick: () => { removeItem(m.id, 1); s.ouro += it.venda; som('moeda'); modalLoja(npc, 'vender'); } }, 'Vender 1'),
        n > 1 ? el('button', { class: 'btn mini', onclick: () => { removeItem(m.id, n); s.ouro += it.venda * n; som('moeda'); log(`Vendeu ${n}x ${it.nome} por ${fmt(it.venda * n)} tostões.`, 'l-loot'); modalLoja(npc, 'vender'); } }, `Todos (${fmt(it.venda * n)})`) : ''));
    }
  }
  abreModal(el('h2', {}, d.nome), el('p', {}, 'Seus tostões: ', precoTag(s.ouro)), tabs, lista);
}

/* ---------------- professor ---------------- */
function modalProfessor(npc) {
  const s = G.save; const lista = el('div', { class: 'lista' });
  for (const id of npc.d.professor) {
    const dr = DRIBLES[id]; const tem = s.dribles.includes(id); const preco = PRECO_DRIBLE[id];
    const q = MISSOES.find(m => m.rec.drible === id);
    const viaMissao = q && !tem;
    lista.append(el('div', { class: 'linha-item' + (tem ? ' bloq' : '') }, iconeClone(iconeDrible(id)),
      el('div', { class: 'nm' }, el('b', {}, dr.nome), el('small', {}, `${dr.desc} Nível ${dr.lvl} · ${dr.foco} de foco.`)),
      tem ? el('b', {}, 'Aprendido') : (viaMissao && statusMissao(q) !== 'feita') ? el('small', {}, `Ganhe na missão "${q.titulo}"`) :
        el('button', { class: 'btn roxo mini', onclick: () => { if (s.ouro < preco) { log('Tostões insuficientes!', 'l-dano'); return; } s.ouro -= preco; aprendeDrible(id); modalProfessor(npc); } }, `Aprender (${fmt(preco)})`)));
  }
  abreModal(el('h2', {}, 'Dribles com ' + npc.d.nome), el('p', {}, 'Dribles ficam na barra de atalhos (teclas 1–0). Os de ataque precisam de um alvo marcado.'), lista, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => abrirNPC(npc) }, 'Voltar')));
}

/* ---------------- ônibus ---------------- */
function modalOnibus() {
  const s = G.save; const lista = el('div', { class: 'lista' });
  MAPAS_ORDEM.forEach((id, i) => {
    const flag = MAPAS_FLAG[id]; const ok = !flag || s.flags[flag]; const preco = 15 * (i + 1);
    const aqui = G.mapa.id === id;
    lista.append(el('div', { class: 'linha-item' + (ok ? '' : ' bloq') }, el('div', { class: 'nm' }, el('b', {}, getMapa(id).nome), el('small', {}, ok ? (aqui ? 'Você está aqui' : 'Liberado') : 'Ainda bloqueado')), ok && !aqui ? precoTag(preco) : '',
      ok && !aqui ? el('button', { class: 'btn amarelo mini', onclick: () => {
        if (s.ouro < preco) { log('Tostões insuficientes para a passagem.', 'l-dano'); return; }
        s.ouro -= preco; const m = getMapa(id); const mot = m.npcs.find(n => n.id === 'motorista');
        fechaModal(); const alvo = mot ? { x: mot.x, y: mot.y + 1 } : m.inicio;
        trocaMapa(id, alvo.x + 0.5, alvo.y + 0.5); if (colide(G.p.x, G.p.y, R_ENT)) { const pos = posLivre(alvo.x, alvo.y, 2); if (pos) Object.assign(G.p, { x: pos.x, y: pos.y }); }
        som('apito');
      } }, 'Viajar') : ''));
  });
  abreModal(el('h2', {}, 'Ônibus circular'), el('p', {}, 'Viaje entre os lugares que você já liberou.'), lista);
}

/* ---------------- quadro de desafios ---------------- */
function modalQuadro() {
  const s = G.save; const lista = el('div', { class: 'lista' });
  const t = s.tarefa;
  if (t) {
    const d = MONSTROS[t.m]; const pronta = t.p >= t.n; const xp = Math.round(d.xp * t.n * 0.6), ouro = Math.round(d.xp * t.n * 0.12);
    lista.append(el('div', { class: 'linha-item' }, el('div', { class: 'nm' }, el('b', {}, `Desafio atual: ${d.nome}`), el('small', {}, `${t.p}/${t.n} — Recompensa: ${fmt(xp)} XP, ${fmt(ouro)} tostões e 1 pacotinho de figurinhas`)),
      pronta ? el('button', { class: 'btn amarelo', onclick: () => { s.ouro += ouro; addItem('pacotinho', 1); s.tarefa = null; log(`Desafio concluído! +${fmt(ouro)} tostões.`, 'l-loot'); ganhaXp(xp); salvar(); modalQuadro(); } }, 'Resgatar!') :
        el('button', { class: 'btn mini', onclick: () => { if (confirm('Desistir do desafio atual?')) { s.tarefa = null; modalQuadro(); } } }, 'Desistir')));
  } else {
    for (const [m, n] of (DESAFIOS[G.mapa.id] || [])) {
      const d = MONSTROS[m]; const xp = Math.round(d.xp * n * 0.6);
      lista.append(el('div', { class: 'linha-item' }, el('div', { class: 'nm' }, el('b', {}, `Vença ${n}x ${d.nome}`), el('small', {}, `Bônus: ${fmt(xp)} XP + tostões + pacotinho de figurinhas`)),
        el('button', { class: 'btn amarelo mini', onclick: () => { s.tarefa = { m, n, p: 0 }; log(`Desafio aceito: vença ${n}x ${d.nome}.`, 'l-xp'); G.uiSujo = true; fechaModal(); } }, 'Aceitar')));
    }
  }
  abreModal(el('h2', {}, 'Quadro de Desafios'), el('p', {}, 'Desafios repetíveis: é aqui que se treina pra valer. Um desafio ativo por vez.'), lista);
}

/* ---------------- quiz de futebol e matemática ---------------- */
function perguntaMat() {
  const n = G.save.nivel; const r = (a, b) => rndi(a, b);
  const tipos = [
    () => { const a = r(1, 5 + n), b = r(1, 5 + n); return [`Seu time fez ${a} gols no primeiro tempo e ${b} no segundo. Quantos gols no total?`, a + b]; },
    () => { const t = r(20, 40 + n * 3), f = r(1, t - 1); return [`Uma partida tem ${t} minutos de treino. Já passaram ${f}. Quantos minutos faltam?`, t - f]; },
    () => { const v = r(1, 6 + Math.floor(n / 2)), e = r(0, 5); return [`Vitória vale 3 pontos e empate vale 1. Com ${v} vitórias e ${e} empates, quantos pontos?`, v * 3 + e]; },
    () => { const a = r(2, 9 + Math.floor(n / 3)), b = r(2, 9); return [`Você fez ${a} embaixadinhas por dia durante ${b} dias. Quantas no total?`, a * b]; },
    () => { const k = r(2, 6), q = r(2, 8 + Math.floor(n / 4)); return [`O treinador dividiu ${k * q} bolas igualmente entre ${k} grupos. Quantas bolas cada grupo recebeu?`, q]; },
    () => { const c = r(2, 12) * 10, p = [10, 20, 25, 50][r(0, 3)]; return [`Uma chuteira custa ${c} tostões e está com ${p}% de desconto. Quanto você paga?`, c - c * p / 100]; },
    () => { const lug = r(2, 9) * 1000, p = [10, 20, 25, 50, 75][r(0, 4)]; return [`O estádio tem ${fmt(lug)} lugares e ${p}% estão ocupados. Quantas pessoas estão lá?`, lug * p / 100]; },
    () => { const g = r(2, 6), j = r(3, 8); return [`Um atacante faz em média ${g} gols a cada ${j} jogos. Em ${j * 3} jogos, quantos gols ele deve fazer?`, g * 3]; },
    () => { const a = r(10, 60), b = r(10, 60); return [`No primeiro jogo vieram ${a} torcedores e no segundo ${b}. Qual a diferença entre os dois jogos?`, Math.abs(a - b)]; },
  ];
  const lim = n < 5 ? 5 : n < 12 ? 7 : tipos.length;
  const [q, resp] = tipos[r(0, lim - 1)]();
  const ops = new Set([resp]);
  while (ops.size < 4) { const d = resp + r(-Math.max(3, Math.round(resp * 0.3)), Math.max(3, Math.round(resp * 0.3))); if (d >= 0 && d !== resp) ops.add(d); }
  return [q, [String(resp), ...[...ops].filter(x => x !== resp).map(String)]];
}
let ultimasQuiz = [];
// Descanso dos quizzes (tempo real): errar/deixar o tempo acabar/fugir da pergunta = pausa curta;
// acertar QUIZ_RODADA seguidas = pausa longa. Evita subir de nível só no quiz.
const QUIZ_RODADA = 5, QUIZ_PAUSA_ERRO = 3 * 60000, QUIZ_PAUSA_RODADA = 10 * 60000;
const QUIZ_QUEM = { futebol: { nome: 'Seu Juca', erro: 'O Seu Juca coçou a cabeça: "Errou, hein? Vai dar uma volta, treina um pouco e depois a gente continua!"', cheio: 'O Seu Juca fechou a banca pra buscar revistas novas. "Bom demais! Volta daqui a pouco que tem mais pergunta!"' },
  mat: { nome: 'Professora Lúcia', erro: 'A Professora Lúcia sorriu: "Quase! Revise com calma e volte daqui a pouco."', cheio: 'A Professora Lúcia foi corrigir provas. "Excelente aula! Descanse a cabeça e volte mais tarde."' } };
function estadoQuiz(tipo) { const s = G.save; s.quizCd = s.quizCd || {}; return s.quizCd[tipo] = s.quizCd[tipo] || { ate: 0, certas: 0 }; }
function quizFalta(tipo) { return Math.max(0, estadoQuiz(tipo).ate - Date.now()); }
function fmtFalta(ms) { const t = Math.ceil(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }
function pausaQuiz(tipo, ms) { const e = estadoQuiz(tipo); e.ate = Date.now() + ms; e.certas = 0; salvar(); }
function modalQuizPausa(tipo) {
  const quem = QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol; const txt = el('b', {}, fmtFalta(quizFalta(tipo)));
  const tm = setInterval(() => { const f = quizFalta(tipo); if (!document.body.contains(txt)) return clearInterval(tm); if (f <= 0) { clearInterval(tm); modalQuiz(tipo); return; } txt.textContent = fmtFalta(f); }, 500);
  abreModal(el('h2', {}, tipo === 'mat' ? 'Aula da Professora Lúcia' : 'Quiz do Seu Juca'), el('p', {}, `${quem.nome} está descansando. Volte em `, txt, '.'),
    el('p', { class: 'vazio' }, `Enquanto isso, que tal treinar dribles, fazer missões ou o Quadro de Desafios?`), el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'Ok')));
}
function modalQuiz(tipo) {
  const s = G.save;
  if (quizFalta(tipo) > 0) return modalQuizPausa(tipo);
  let q;
  if (tipo === 'mat') q = perguntaMat();
  else { let i; let tent = 0; do { i = rndi(0, QUIZ.length - 1); } while (ultimasQuiz.includes(i) && tent++ < 50); ultimasQuiz.push(i); if (ultimasQuiz.length > 25) ultimasQuiz.shift(); q = QUIZ[i]; }
  const [pergunta, ops] = q; const certa = ops[0];
  const emb = [...ops]; for (let i = emb.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [emb[i], emb[k]] = [emb[k], emb[i]]; }
  const DUR = 20000; const t0 = performance.now(); let resp = false;
  const barra = el('i'); barra.style.width = '100%';
  const grade = el('div', { class: 'quiz-op' });
  const fim = el('div', { class: 'opcoes' });
  const responder = (op, btn) => {
    if (resp) return; resp = true; clearInterval(tm);
    const ok = op === certa;
    grade.querySelectorAll('button').forEach(b => { b.disabled = true; if (b.textContent === certa) b.classList.add('certo'); });
    if (!ok && btn) btn.classList.add('errado');
    if (ok) {
      const xp = Math.round((tipo === 'mat' ? 8 + s.nivel * 3 : 10 + s.nivel * 4) * stats().xpEstudo);
      treinaSkill('visao', 30);
      if (tipo === 'mat') { s.st.prof++; contaEvento('prof'); } else { s.st.quiz++; contaEvento('quiz'); }
      ganhaXp(xp); som('moeda'); log(`Resposta certa! +${xp} XP e um pouco de Visão de Jogo.`, 'l-xp');
      const e = estadoQuiz(tipo); e.certas++;
      fim.prepend(el('p', {}, `✔ Certa! +${xp} XP (${e.certas}/${QUIZ_RODADA} nesta rodada)`));
      if (e.certas >= QUIZ_RODADA) { pausaQuiz(tipo, QUIZ_PAUSA_RODADA); fim.append(el('p', {}, `🏁 Rodada completa! ${(QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol).cheio} (${QUIZ_PAUSA_RODADA / 60000} min)`)); }
    } else {
      som('erro'); fim.prepend(el('p', {}, `✘ ${op ? 'Errou' : 'Tempo esgotado'}! A resposta era: ${certa}`));
      pausaQuiz(tipo, QUIZ_PAUSA_ERRO); fim.append(el('p', {}, `${(QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol).erro} (${QUIZ_PAUSA_ERRO / 60000} min)`));
    }
    if (quizFalta(tipo) > 0) fim.append(el('button', { class: 'btn amarelo', onclick: fechaModal }, 'Ok'));
    else fim.append(el('button', { class: 'btn amarelo', onclick: () => modalQuiz(tipo) }, 'Próxima pergunta'), el('button', { class: 'btn', onclick: fechaModal }, 'Parar'));
  };
  emb.forEach(op => { const b = el('button', { class: 'btn' }, op); b.onclick = () => responder(op, b); grade.append(b); });
  const tm = setInterval(() => { const k = 1 - (performance.now() - t0) / DUR; barra.style.width = clamp(k * 100, 0, 100) + '%'; if (k <= 0) responder(null, null); }, 100);
  window.pararQuiz = () => { clearInterval(tm); if (!resp) { resp = true; pausaQuiz(tipo, QUIZ_PAUSA_ERRO); log(`Você saiu no meio da pergunta. ${(QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol).nome} vai descansar ${QUIZ_PAUSA_ERRO / 60000} min.`, 'l-sis'); } window.pararQuiz = null; };
  window.teclaModal = ev => { const n = '1234'.indexOf(ev.key); if (n >= 0 && !resp) grade.children[n].click(); };
  abreModal(el('h2', {}, tipo === 'mat' ? 'Aula da Professora Lúcia' : 'Quiz do Seu Juca'), el('div', { class: 'timer' }, barra), el('p', { style: 'font-size:18px' }, pergunta), grade, fim);
}

/* ---------------- minijogo: pênalti ---------------- */
function abrirPenalti() {
  const s = G.save;
  const cv = el('canvas', { id: 'cvPenalti', width: 360, height: 240 });
  const msg = el('p', { style: 'text-align:center;font-size:18px;margin:4px' }, 'Espere a mira passar onde você quer e aperte ESPAÇO (ou toque no campo).');
  const placar = el('p', { style: 'text-align:center;margin:0' });
  let gols = 0, chutes = 0;
  const ctx = cv.getContext('2d');
  const gol = { x: 60, y: 40, w: 240, h: 100 };
  const goleiro = { tipo: 'humano', corpo: 'm', pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#2ad96a', baixo: 'baixo-shorts' }; preCarrega(goleiro);
  let estado = 'mira', t0 = performance.now(), chute = null, anim = null, raf;
  const mira = (t) => ({ x: gol.x + gol.w / 2 + Math.sin(t / 520) * (gol.w / 2 + 14), y: gol.y + gol.h / 2 + Math.sin(t / 330 + 1) * (gol.h / 2 + 8) });
  function desenhar(t) {
    ctx.fillStyle = '#3fa34a'; ctx.fillRect(0, 0, 360, 240);
    for (let x = 0; x < 360; x += 40) { ctx.fillStyle = (x / 40) % 2 ? '#48b052' : '#3fa34a'; ctx.fillRect(x, 0, 40, 240); }
    ctx.fillStyle = '#e8e8f0'; ctx.fillRect(0, gol.y + gol.h, 360, 2); ctx.fillRect(100, 170, 160, 2); ctx.fillRect(176, 205, 8, 4);
    ctx.fillStyle = 'rgba(230,235,245,0.35)';
    for (let x = gol.x; x < gol.x + gol.w; x += 8) ctx.fillRect(x, gol.y, 1, gol.h);
    for (let y = gol.y; y < gol.y + gol.h; y += 8) ctx.fillRect(gol.x, y, gol.w, 1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(gol.x - 5, gol.y - 5, gol.w + 10, 5); ctx.fillRect(gol.x - 5, gol.y, 5, gol.h); ctx.fillRect(gol.x + gol.w, gol.y, 5, gol.h);
    // goleiro
    let gx = 180, gy = gol.y + gol.h - 70, rot = 0;
    if (anim) { const k = Math.min(1, (t - anim.t0) / 450); gx = 180 + (anim.gx - 180) * k; gy = gol.y + gol.h - 70 + (anim.gy - (gol.y + gol.h - 70)) * k; rot = anim.lado * k * 1.2; }
    ctx.save(); ctx.translate(gx, gy + 80); ctx.rotate(rot); { const gc = compoe(goleiro); if (gc) { const hh = 92, ww = hh * gc.c.width / gc.c.height; ctx.drawImage(gc.c, -ww / 2, -hh, ww, hh); } } ctx.restore();
    // bola
    let bx = 180, by = 206, br = 7;
    if (anim) { const k = Math.min(1, (t - anim.t0) / 420); bx = 180 + (anim.bx - 180) * k; by = 206 + (anim.by - 206) * k - Math.sin(k * Math.PI) * 20; br = 7 - 3 * k; }
    ctx.fillStyle = '#140c24'; ctx.beginPath(); ctx.arc(bx, by, br + 1, 0, 7); ctx.fill(); ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1a2a'; ctx.fillRect(bx - 1, by - 1, 3, 3);
    if (estado === 'mira') { const m = mira(t); ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, 7); ctx.stroke(); ctx.fillStyle = '#ff2a2a'; ctx.fillRect(m.x - 1, m.y - 12, 2, 24); ctx.fillRect(m.x - 12, m.y - 1, 24, 2); }
    if (anim && anim.txt && t - anim.t0 > 450) { ctx.font = "700 30px 'Pixelify Sans'"; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.strokeText(anim.txt, 180, 120); ctx.fillStyle = anim.cor; ctx.fillText(anim.txt, 180, 120); }
  }
  function chutar() {
    if (estado !== 'mira') return;
    const t = performance.now(); const m = mira(t); const st = stats();
    const erro = Math.max(3, 28 - st.chute * 0.45);
    const bx = m.x + rnd(-erro, erro), by = m.y + rnd(-erro, erro);
    const dentro = bx > gol.x + 3 && bx < gol.x + gol.w - 3 && by > gol.y + 3 && by < gol.y + gol.h;
    const lado = bx < 180 ? -1 : 1;
    const leu = Math.random() < clamp(0.5 - st.chute * 0.004, 0.18, 0.5);
    const gxAlvo = leu ? bx : 180 + (lado * -1) * rnd(40, 90), gyAlvo = leu ? Math.max(gol.y + 20, by - 10) : gol.y + gol.h - 60;
    const alcance = Math.hypot(bx - gxAlvo, by - (gyAlvo + 30)) < 44;
    const canto = (bx < gol.x + 30 || bx > gol.x + gol.w - 30) && by < gol.y + 30;
    let txt, cor;
    chutes++; treinaSkill('chute', 4); som('chute');
    if (!dentro) { txt = 'PRA FORA!'; cor = '#ffb03a'; }
    else if (leu && alcance && !(canto && Math.random() < 0.6)) { txt = 'DEFENDEU!'; cor = '#8ad8ff'; }
    else { txt = 'GOOOL!'; cor = '#ffe14a'; gols++; s.st.gols++; contaEvento('gols'); if (s.nivel < 10) ganhaXp(3); setTimeout(() => som('gol'), 420); }
    estado = 'anim'; anim = { t0: t, bx, by, gx: gxAlvo, gy: gyAlvo, lado: leu ? (bx < 180 ? -1 : 1) : lado * -1, txt, cor };
    placar.textContent = `Gols: ${gols} de ${chutes} chutes`;
    setTimeout(() => { estado = 'mira'; anim = null; }, 1500);
  }
  function quadro(t) { desenhar(t); raf = requestAnimationFrame(quadro); }
  raf = requestAnimationFrame(quadro);
  cv.addEventListener('click', chutar); cv.addEventListener('touchstart', e => { e.preventDefault(); chutar(); }, { passive: false });
  window.teclaModal = ev => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); chutar(); } };
  window.pararPenalti = () => { cancelAnimationFrame(raf); window.pararPenalti = null; };
  abreModal(el('h2', {}, 'Treino de pênalti'), el('div', { class: 'penalti-wrap' }, cv, msg, placar), el('p', { class: 'vazio' }, 'Cada chute treina sua habilidade Chute. Quanto maior o Chute, mais precisa a batida.'));
}

/* ---------------- morte ---------------- */
function modalMorte(perda, m) {
  abreModal(el('h2', {}, 'Você ficou sem fôlego!'), el('p', {}, `${m ? m.d.nome + ' te cansou. ' : ''}Você ficou exausto(a), saiu do jogo pra descansar e perdeu ${fmt(perda)} XP.`), el('p', {}, 'Dica: use Água (e depois Respiro) quando o fôlego estiver baixo, e evite brigar com vários ao mesmo tempo.'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: () => { fechaModal(); renascer(); } }, 'Levantar e continuar')));
  $('#modal .fechar').hidden = true;
}

/* ---------------- missões, álbum, ranking, ajuda ---------------- */
function modalMissoes() {
  const s = G.save; const lista = el('div', { class: 'lista' });
  const ordem = { pronta: 0, ativa: 1, disponivel: 2, nivel: 3, bloqueada: 4, feita: 5 };
  const qs = MISSOES.map(q => ({ q, st: statusMissao(q) })).filter(x => x.st !== 'bloqueada').sort((a, b) => ordem[a.st] - ordem[b.st]);
  for (const { q, st } of qs) {
    const [a, b] = progressoMissao(q);
    const rot = { pronta: '✔ Pronta! Fale com ' + NPCS[q.npc].nome, ativa: `Em andamento: ${a}/${b}`, disponivel: 'Disponível com ' + NPCS[q.npc].nome, nivel: `Disponível no nível ${q.lvl} (${NPCS[q.npc].nome})`, feita: 'Concluída' }[st];
    lista.append(el('div', { class: 'linha-item' + (st === 'feita' || st === 'nivel' ? ' bloq' : '') }, el('div', { class: 'nm' }, el('b', {}, q.titulo), el('small', {}, descMissao(q) + ' — ' + rot), st === 'ativa' ? el('div', { class: 'progresso' }, barraI(a / b)) : '')));
  }
  const feitas = MISSOES.filter(q => statusMissao(q) === 'feita').length;
  abreModal(el('h2', {}, 'Missões'), el('p', {}, `${feitas} de ${MISSOES.length} concluídas.`), lista);
}
function modalAlbum() {
  const s = G.save; const g = el('div', { class: 'album' });
  for (const f of FIGURINHAS) {
    const tem = s.figs[f.id];
    if (!tem) { g.append(el('div', { class: 'fig nao' }, '?')); continue; }
    const c = mkCanvas(128, 160);
    const mon = Object.values(MONSTROS).find(m => m.fig === f.id); const npcLook = { f_ze: NPCS.ze, f_tata: NPCS.tata, f_ginga: NPCS.ginga, f_dada: NPCS.dada }[f.id];
    const look = mon ? mon.look : npcLook ? npcLook.look : { tipo: 'humano', corpo: 'm', pele: 'pele-clara', cabelo: 'cabelo-anime', corCabelo: 'roxo', roupa: 'roupa-futebol', corRoupa: '#7a4aff', baixo: 'baixo-shorts' };
    pintaAparencia(c, look, { fundo: f.cor });
    g.append(el('div', { class: 'fig tem' }, c, el('b', {}, f.nome)));
  }
  const n = Object.keys(s.figs).length; const completo = n >= FIGURINHAS.length;
  const ops = el('div', { class: 'opcoes' });
  if (completo && !s.flags.album_premio) ops.append(el('button', { class: 'btn amarelo grande', onclick: () => { s.flags.album_premio = true; addItem('medalha_colecionador'); log('ÁLBUM COMPLETO! Você ganhou a Medalha do Colecionador!', 'l-lvl'); banner('ÁLBUM COMPLETO!', 'Medalha do Colecionador'); salvar(); modalAlbum(); } }, 'Resgatar prêmio do álbum!'));
  abreModal.largo = true;
  abreModal(el('h2', {}, `Álbum de figurinhas (${n}/${FIGURINHAS.length})`), el('p', {}, 'Figurinhas caem raramente dos adversários (chefões dão mais), vêm em pacotinhos do Seu Juca e nos desafios. Repetidas viram 25 tostões. Complete o álbum para ganhar a Medalha do Colecionador!'), ops, g);
}
async function modalRanking() {
  // Online: o top de todos os jogadores do site (GET /api/lenda/ranking).
  // Sem internet ou fora do site, cai no ranking deste aparelho.
  if (typeof PORTAL !== 'undefined' && PORTAL.ativo) {
    try {
      const r = await fetch(PORTAL.api + '/api/lenda/ranking');
      if (r.ok) {
        const on = await r.json(); const euId = PORTAL.user && PORTAL.user.id;
        const tabOn = el('table', { class: 'rank-tab' }, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Jogador'), el('th', {}, 'Nível'), el('th', {}, 'Fase'), el('th', {}, 'Time'), el('th', {}, 'XP')));
        on.forEach((x, i) => tabOn.append(el('tr', { class: x.userId === euId ? 'eu' : '' }, el('td', {}, i + 1), el('td', {}, x.apelido), el('td', {}, x.nivel), el('td', {}, x.fase + (x.posicao && POSICOES[x.posicao] ? ' · ' + POSICOES[x.posicao].nome : '')), el('td', {}, x.time ? `${x.time.nome} (${nomeDivisao(x.time.div)})` : '—'), el('td', {}, fmt(x.xp)))));
        const avisoOn = PORTAL.token ? 'Ranking de todos os jogadores do Educação Gamer. Seu progresso entra sozinho enquanto você joga.' : 'Ranking de todos os jogadores do Educação Gamer. Entre na sua conta do site para aparecer aqui.';
        // logado mas fora da lista: diz o que aconteceu com o último envio (e deixa mandar de novo)
        let estado = null;
        if (PORTAL.token && G.save && !on.some(x => x.userId === euId)) {
          const R = typeof RANK_ONLINE !== 'undefined' ? RANK_ONLINE : null;
          const txt = !R ? 'Seu progresso vai para o ranking em até 1 minuto de jogo.'
            : R.ok ? 'Seu progresso foi enviado! Pode levar até 1 minuto para aparecer aqui.'
            : R.status === 401 ? 'Sua sessão do site expirou: entre de novo na sua conta do Educação Gamer para aparecer no ranking.'
            : `Não deu para entrar no ranking agora (${R.status ? 'erro ' + R.status : 'sem conexão'}${R.msg ? ': ' + R.msg : ''}).`;
          estado = el('div', { class: 'nuvem-caixa' }, el('span', {}, txt), el('button', { class: 'btn mini', type: 'button', onclick: () => { enviaRankingJa(); setTimeout(() => modalRanking(), 1500); } }, '🔄 Enviar agora'));
        }
        abreModal(el('h2', {}, 'Ranking'), el('p', {}, avisoOn), ...(estado ? [estado] : []), on.length ? tabOn : el('p', {}, 'Ninguém no ranking ainda. Seja o primeiro!'));
        if (!G.rodando) $('#modal').onclick = null;
        return;
      }
    } catch (e) { }
  }
  const lista = lerRanking(); const eu = G.save ? G.save.criado : null;
  const tab = el('table', { class: 'rank-tab' }, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Jogador'), el('th', {}, 'Nível'), el('th', {}, 'Fase'), el('th', {}, 'Time'), el('th', {}, 'XP')));
  lista.forEach((r, i) => tab.append(el('tr', { class: r.id === eu ? 'eu' : '' }, el('td', {}, i + 1), el('td', {}, r.nome), el('td', {}, r.nivel), el('td', {}, r.fase + (r.posicao ? ' · ' + POSICOES[r.posicao].nome : '')), el('td', {}, r.time ? `${r.time.nome} (${nomeDivisao(r.time.div)})` : '—'), el('td', {}, fmt(r.xp)))));
  const aviso = 'Este ranking mostra os jogadores criados neste aparelho (o ranking online não respondeu agora).';
  abreModal(el('h2', {}, 'Ranking'), el('p', {}, aviso), lista.length ? tab : el('p', {}, 'Ninguém no ranking ainda. Seja o primeiro!'));
  if (!G.rodando) $('#modal').onclick = null;
}
function modalAjuda() {
  abreModal.largo = true;
  abreModal(el('h2', {}, 'Como jogar'),
    el('p', {}, 'Você nasce na Vila do Campinho. Treine, faça missões, passe pelos adversários, aprenda dribles e cresça: Criança → Juvenil → Sub-20 → Profissional → Lenda. No Sub-20 (nível 25) você pode fundar seu próprio time!'),
    el('div', { class: 'ajuda-grid' },
      el('div', {}, el('span', { class: 'kbd' }, 'Setas'), ' / ', el('span', { class: 'kbd' }, 'WASD'), ' andar (ou clique no mapa)'),
      el('div', {}, el('span', { class: 'kbd' }, 'E'), ' falar, abrir baú, ler placa, marca do pênalti'),
      el('div', {}, el('span', { class: 'kbd' }, 'Clique'), ' num adversário marca como alvo (círculo vermelho). Você corre até ele e dribla sozinho.'),
      el('div', {}, el('span', { class: 'kbd' }, 'Espaço'), ' marca o adversário mais próximo'),
      el('div', {}, el('span', { class: 'kbd' }, '1'), '…', el('span', { class: 'kbd' }, '0'), ' dribles e itens da barra de atalhos'),
      el('div', {}, el('span', { class: 'kbd' }, 'X'), ' alterna modo Drible (colado) / Chute (à distância)'), el('div', {}, el('span', { class: 'kbd' }, 'H'), ' mostra TODOS os atalhos (Q, F, R, G, C, M...)'),
      el('div', {}, el('span', { class: 'kbd' }, 'Esc'), ' desmarca alvo / fecha janelas'), el('div', {}, el('span', { class: 'kbd' }, 'I'), ' abre a mochila'), el('div', {}, 'A SETA AMARELA sempre aponta o próximo objetivo. "!" em cima de alguém = missão nova; "?" = missão pronta para entregar.'),
      el('div', {}, 'Fôlego = sua vida. Foco = energia dos dribles. Os dois voltam com o tempo.'),
    ),
    el('h3', {}, 'Como ficar bom'),
    el('p', {}, '• Habilidades (Drible, Chute, Defesa, Visão) sobem com USO, igual no Tibia: quanto mais você dribla, melhor fica. • Nível sobe com XP: adversários, missões, desafios e quiz. • Equipamentos melhores (chuteira = ataque) vêm das lojas, missões e chefões. • O Quadro de Desafios dá bônus repetíveis. • Os bonecos de treino sobem habilidade sem risco.'),
    el('p', {}, 'O jogo salva sozinho no seu navegador.'));
}

/* ---------------- tela inicial / criação ---------------- */
function telaInicial() {
  const save = lerSave();
  const bc = $('#btnContinuar');
  if (save) { bc.hidden = false; $('#resumoSave').textContent = `${save.nome} — nível ${save.nivel} (${FASES[faseIdx(save.nivel)].nome})`; bc.onclick = () => iniciarJogo(save); }
  $('#btnNovo').onclick = () => { if (save && !confirm(`Criar um novo jogador vai substituir ${save.nome} (nível ${save.nivel}). Continuar?`)) return; abrirCriacao(); };
  $('#btnVoltar').onclick = () => { $('#criacao').hidden = true; $('#inicioMenu').hidden = false; };
  { const bh = $('#btnHistoria'); if (bh) { if (typeof abreMenuCapitulos === 'function') bh.onclick = () => abreMenuCapitulos(); else if (typeof mostraHistoria === 'function') bh.onclick = () => mostraHistoria(null, () => { }); else bh.hidden = true; } }
  document.querySelectorAll('[data-abre]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.abre;
    if (k === 'ranking') modalRanking(); else if (k === 'ajuda') modalAjuda(); else if (!G.save) return;
    else if (k === 'missoes') modalMissoes(); else if (k === 'album') modalAlbum(); else if (k === 'time') abrirTime(); else if (k === 'mapa') modalMapa(); else if (k === 'carreira') { if (typeof abrirCarreira === 'function') abrirCarreira(); } else if (k === 'atalhos') modalAtalhos();
  }));
  $('#modal .fechar').onclick = () => { if (G.save && G.save.hp <= 0) return; fechaModal(); };
  $('#modal').addEventListener('mousedown', ev => { if (ev.target.id === 'modal' && !(G.save && G.save.hp <= 0)) fechaModal(); });
}
function abrirCriacao() {
  $('#inicioMenu').hidden = true; $('#criacao').hidden = false;
  const d = { corpo: 'm', pele: 'pele-morena', cabelo: 'cabelo-cacheado', corCabelo: 'original', roupa: 'roupa-camiseta', baixo: 'baixo-shorts', rosto: null, classe: 'driblador' };
  // só o que o boneco mostra de verdade: cada gênero tem seus penteados; roupa e parte de baixo pelo que aparece
  const CAB_GEN = { m: ['cabelo-curto', 'cabelo-cacheado', 'cabelo-black-power', 'cabelo-moicano'], f: ['cabelo-rabo', 'cabelo-liso-longo', 'cabelo-coque', 'cabelo-cacheado', 'cabelo-black-power'] };
  const cabelosDe = g => CAB_GEN[g].map(id => AVATAR.cabelos.find(c => c.id === id)).filter(Boolean);
  const NOME_ROUPA = { 'roupa-camiseta': 'Roxa', 'roupa-moletom': 'Azul', 'roupa-xadrez': 'Vermelha', 'roupa-regata': 'Branca' };
  const baixosDe = g => [{ id: 'baixo-shorts', nome: 'Shorts azul', cor: '#5878a8' }, { id: 'baixo-moletom', nome: 'Shorts cinza', cor: '#888898' }].concat(g === 'f' ? [{ id: 'baixo-saia', nome: 'Saia (com coque)', cor: '#d84848' }] : []);
  const NOME_ROSTO = { null: 'Sem óculos', 'rosto-redondos': 'Óculos', 'rosto-escuros': 'Óculos escuros' };
  const ajusta = chave => {
    if (!CAB_GEN[d.corpo].includes(d.cabelo)) d.cabelo = d.corpo === 'f' ? 'cabelo-rabo' : 'cabelo-curto';
    if (d.corpo !== 'f' && d.baixo === 'baixo-saia') d.baixo = 'baixo-shorts';
    if (!baixosDe(d.corpo).some(o => o.id === d.baixo)) d.baixo = 'baixo-shorts';
    if (chave === 'baixo' && d.baixo === 'baixo-saia') d.cabelo = 'cabelo-coque';          // a saia vem com coque
    if (chave === 'cabelo' && d.baixo === 'baixo-saia' && d.cabelo !== 'cabelo-coque') d.baixo = 'baixo-shorts';
  };
  const chips = (sel, lista, chave, rot, cor) => {
    const box = $(sel); box.innerHTML = '';
    lista.forEach(o => {
      const b = el('button', { class: 'chip' + (d[chave] === o.id ? ' sel' : ''), type: 'button' });
      if (cor && cor(o)) { const i = el('i'); i.style.background = cor(o); b.append(i); }
      b.append(rot(o));
      b.onclick = () => { d[chave] = o.id; ajusta(chave); render(); };
      box.append(b);
    });
  };
  function render() {
    chips('#opCorpo', [{ id: 'm', nome: 'Menino' }, { id: 'f', nome: 'Menina' }], 'corpo', o => o.nome);
    chips('#opPele', AVATAR.peles, 'pele', o => o.nome, o => d.corpo === 'f' ? o.corF : o.cor);
    chips('#opCabelo', cabelosDe(d.corpo), 'cabelo', o => o.nome, o => o.cor);
    chips('#opCorCabelo', AVATAR.coresCabelo, 'corCabelo', o => o.nome, o => o.cor || (AVATAR.cabelos.find(c => c.id === d.cabelo) || {}).cor);
    chips('#opRoupa', AVATAR.roupas, 'roupa', o => NOME_ROUPA[o.id] || o.nome, o => o.cor);
    chips('#opBaixo', baixosDe(d.corpo), 'baixo', o => o.nome, o => o.cor);
    chips('#opRosto', AVATAR.rostos, 'rosto', o => NOME_ROSTO[o.id] || o.nome);
    { const g = $('#opClasse'); g.innerHTML = ''; Object.keys(CLASSES).forEach(id => g.append(cartaClasse(id, d.classe === id, () => { d.classe = id; render(); }))); }
    montaRetrato($('#retratoCriacao'), cfgCriacaoFallback(d));
  }
  render();
  const gira = setInterval(() => { if ($('#criacao').hidden) return clearInterval(gira); const cv = $('#pixelCriacao'); if (!cv) return; }, 1000);
  $('#btnNascer').onclick = () => {
    const nome = $('#inpNome').value.trim().replace(/[<>]/g, '');
    if (nome.length < 2) { $('#inpNome').focus(); $('#inpNome').style.borderColor = 'red'; return; }
    const save = novoSave({ nome, ...d });
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { }
    if (typeof mostraHistoria === 'function') mostraHistoria(save.nome, () => iniciarJogo(save)); else iniciarJogo(save);
  };
}


/* ================= CLASSES, FICHA, MAPA E ATALHOS ================= */
function cartaClasse(id, sel, onclick) {
  const c = CLASSES[id]; const a = ATRIBUTOS[c.principal];
  return el('button', { class: 'card-classe' + (sel ? ' sel' : ''), type: 'button', style: `--cor:${c.cor}`, onclick },
    el('div', { class: 'cc-emoji' }, c.emoji), el('b', {}, c.nome), el('small', { class: 'cc-attr' }, `${a.icone} mais ${a.nome}`),
    el('p', {}, c.desc), el('p', { class: 'cc-pass' }, c.passiva), el('p', { class: 'cc-esp' }, el('span', { class: 'kbd' }, 'Q'), ` ${c.especial.nome}: ${c.especial.desc}`));
}
function modalEscolheClasse(obrigatorio) {
  const s = G.save; let esc = s.classe || 'driblador';
  const grade = el('div', { class: 'grade-classes' });
  const render = () => { grade.innerHTML = ''; Object.keys(CLASSES).forEach(id => grade.append(cartaClasse(id, id === esc, () => { esc = id; render(); }))); };
  render();
  abreModal.largo = true;
  abreModal(el('h2', {}, 'Escolha sua classe'), el('p', {}, 'Cada classe é mais forte em um atributo e tem uma habilidade especial (tecla Q). Você ainda distribui pontos a cada nível, então dá pra misturar!'), grade,
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: () => {
      s.classe = esc; const lv = s.nivel - 1; s.atr = Object.assign({}, CLASSES[esc].base); s.atr[CLASSES[esc].principal] += lv; s.pontos = lv * PONTOS_POR_NIVEL;
      log(`Você agora é ${CLASSES[esc].nome}! ${s.pontos ? 'Aperte C para distribuir seus pontos.' : ''}`, 'l-lvl'); banner(CLASSES[esc].nome.toUpperCase(), 'Classe escolhida'); som('nivel'); salvar(); fechaModal();
    } }, 'Confirmar')));
  if (obrigatorio) $('#modal .fechar').hidden = true;
}
function abreFicha() {
  const s = G.save; const st = stats(); const cl = CLASSES[s.classe];
  const retr = mkCanvas(300, 400); retr.className = 'ficha-retrato'; pintaAparencia(retr, lookJogador(true), { inteiro: true });
  const linhas = el('div', { class: 'ficha-attrs' });
  for (const k of Object.keys(ATRIBUTOS)) {
    const a = ATRIBUTOS[k]; const v = s.atr[k];
    const bar = el('div', { class: 'sk-bar' }); const i = el('i'); i.style.width = Math.min(100, v) + '%'; i.style.background = a.cor; bar.append(i);
    const mais = el('button', { class: 'btn verde mini', disabled: s.pontos > 0 ? null : 'disabled', title: 'Clique: +1 · Shift+clique: +5', onclick: ev => { const n = Math.min(s.pontos, ev.shiftKey ? 5 : 1); s.atr[k] += n; s.pontos -= n; som('equip'); G.uiSujo = true; abreFicha(); } }, '+');
    linhas.append(el('div', { class: 'ficha-linha' + (cl && cl.principal === k ? ' principal' : '') }, el('span', { class: 'fl-ic' }, a.icone), el('div', { class: 'fl-meio' }, el('div', { class: 'top' }, el('b', {}, a.nome), el('b', {}, v + (st.atr[k] > v ? ` (+${st.atr[k] - v} 🍽️)` : ''))), bar, el('small', {}, a.desc)), mais));
  }
  const pct = v => Math.round(v * 100) + '%';
  const deriv = el('div', { class: 'sk-info' },
    el('span', {}, 'Fôlego máx.'), el('b', {}, fmt(st.maxHp)), el('span', {}, 'Foco máx.'), el('b', {}, fmt(st.maxFoco)),
    el('span', {}, 'Defesa total'), el('b', {}, Math.round(st.def)), el('span', {}, 'Dano extra'), el('b', {}, '+' + pct(st.danoMult - 1)),
    el('span', {}, 'Crítico'), el('b', {}, pct(st.crit)), el('span', {}, 'Bloqueio'), el('b', {}, pct(st.bloqueio)),
    el('span', {}, 'Velocidade'), el('b', {}, Math.round(st.vel)), el('span', {}, 'XP em missões/quiz'), el('b', {}, '+' + pct(st.xpEstudo - 1)),
    el('span', {}, 'Recuperação'), el('b', {}, `${st.regenHp.toFixed(1)} / ${st.regenFoco.toFixed(1)} por seg.`));
  abreModal.largo = true;
  abreModal(el('h2', {}, `Ficha de ${s.nome}`),
    el('div', { class: 'ficha' },
      el('div', { class: 'ficha-esq' }, retr, el('b', { class: 'ficha-nome' }, s.nome), el('span', {}, `${FASES[faseIdx(s.nivel)].nome} · Nível ${s.nivel}`), s.posicao ? el('span', {}, POSICOES[s.posicao].nome) : '',
        cl ? el('div', { class: 'ficha-classe', style: `--cor:${cl.cor}` }, el('b', {}, `${cl.emoji} ${cl.nome}`), el('small', {}, cl.passiva), el('small', {}, el('span', { class: 'kbd' }, 'Q'), ` ${cl.especial.nome}: ${cl.especial.desc}`)) : el('button', { class: 'btn amarelo', onclick: () => modalEscolheClasse() }, 'Escolher classe')),
      el('div', { class: 'ficha-dir' },
        el('div', { class: 'ficha-pontos' + (s.pontos ? ' tem' : '') }, s.pontos ? `Você tem ${s.pontos} ponto(s) para distribuir!` : 'Sem pontos livres. Você ganha ' + PONTOS_POR_NIVEL + ' a cada nível.'),
        linhas, el('h3', {}, 'O que isso muda'), deriv,
        el('p', { class: 'vazio' }, 'Quer redistribuir tudo? Fale com o Seu Zé no campinho (custa tostões).'))));
}
function redistribuiAtributos() {
  const s = G.save; const custo = 150 * s.nivel; const cl = CLASSES[s.classe]; if (!cl) return;
  if (s.ouro < custo) { log(`Redistribuir custa ${fmt(custo)} tostões.`, 'l-dano'); return; }
  if (!confirm(`Redistribuir todos os pontos de atributo por ${fmt(custo)} tostões?`)) return;
  s.ouro -= custo; const lv = s.nivel - 1; s.atr = Object.assign({}, cl.base); s.atr[cl.principal] += lv; s.pontos = lv * PONTOS_POR_NIVEL;
  log('Pontos devolvidos! Aperte C para distribuir de novo.', 'l-lvl'); salvar(); abreFicha();
}
function modalMapa() {
  const m = G.mapa; const base = renderMini(m);
  const esc = Math.max(2, Math.min(5, Math.floor(820 / (m.w * 3)))); const c = mkCanvas(base.width * esc, base.height * esc); const x = c.getContext('2d');
  x.imageSmoothingEnabled = false; x.drawImage(base, 0, 0, c.width, c.height);
  const k = 3 * esc;
  x.font = '700 13px Fredoka, sans-serif'; x.textAlign = 'center';
  for (const n of G.npcs) { x.fillStyle = '#5ad8ff'; x.beginPath(); x.arc(n.x * k, n.y * k, 5, 0, 7); x.fill(); x.strokeStyle = '#1a1026'; x.lineWidth = 3; x.strokeText(n.d.nome, n.x * k, n.y * k - 9); x.fillStyle = '#fff'; x.fillText(n.d.nome, n.x * k, n.y * k - 9); }
  for (const s of m.saidas) { x.fillStyle = '#ffd23f'; x.fillRect(s.x * k, s.y * k, k, k); }
  for (const b of m.predios) if (b.interior) { const nm = getMapa(b.interior).nome; x.strokeStyle = '#1a1026'; x.lineWidth = 3; x.strokeText(nm, (b.porta.x + 0.5) * k, (b.porta.y + 1.8) * k); x.fillStyle = '#ffe9a8'; x.fillText(nm, (b.porta.x + 0.5) * k, (b.porta.y + 1.8) * k); }
  const g = alvoGuia(); if (g) { x.fillStyle = '#ffd23f'; x.strokeStyle = '#3d2b3a'; x.lineWidth = 3; x.beginPath(); x.arc(g.x * k, g.y * k, 9, 0, 7); x.fill(); x.stroke(); }
  x.fillStyle = '#ff3aff'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(G.p.x * k, G.p.y * k, 8, 0, 7); x.fill(); x.stroke();
  c.className = 'mapa-grande';
  const regioes = el('div', { class: 'opcoes' }, ...MAPAS_ORDEM.map(id => { const f = MAPAS_FLAG[id]; const ok = !f || G.save.flags[f]; return el('span', { class: 'tag-reg' + (ok ? '' : ' bloq') + (G.mapa.id === id ? ' aqui' : '') }, (ok ? '' : '🔒 ') + getMapa(id).nome); }));
  abreModal.largo = true;
  abreModal(el('h2', {}, `Mapa — ${m.nome}`), el('p', {}, '🟣 Você · 🟡 Objetivo (seta amarela) e saídas · 🔵 Pessoas · 🟠 Adversários'), c, el('h3', {}, 'Regiões'), regioes);
}
function modalAtalhos() {
  const L = [
    ['W A S D / Setas', 'Andar (diagonal também)'], ['Clique no chão', 'Andar até lá'], ['Clique no adversário', 'Marcar alvo e driblar'],
    ['Espaço / Tab', 'Próximo adversário (segue o modo de alvo)'], ['V', 'Modo de alvo: mais perto / mais forte / mais fraco / menos fôlego'], ['Shift + Tab', 'Adversário anterior'], ['Esc', 'Desmarcar alvo / fechar janela'],
    ['E', 'Falar, abrir baú, ler placa, pênalti'], ['1 … 0', 'Dribles e itens da barra (fileira de cima)'], ['Num 1 … Num 0', 'Segunda fileira da barra (teclado numérico)'], ['Q', 'Habilidade especial da classe'],
    ['F', 'Beber a melhor bebida de FÔLEGO'], ['R', 'Beber a melhor bebida de FOCO'], ['G', 'Caça contínua (marca o próximo sozinho)'],
    ['X', 'Modo Drible / Chute'], ['C', 'Ficha do personagem e atributos'], ['I', 'Mochila'], ['K', 'Habilidades'], ['L', 'Lista de batalha'],
    ['M', 'Mapa grande'], ['U', 'Carreira: contrato, metas e reuniões'], ['J', 'Missões'], ['B', 'Álbum de figurinhas'], ['T', 'Meu Time'], ['H', 'Esta lista'], ['Roda do mouse / + −', 'Zoom'],
  ];
  abreModal.largo = true;
  abreModal(el('h2', {}, 'Atalhos do teclado'), el('div', { class: 'atalhos' }, ...L.map(([k, d]) => el('div', { class: 'atalho' }, el('span', { class: 'kbd' }, k), el('span', {}, d)))));
}


/* ================= REFINO (Seu Remendo) ================= */
function itensRefinaveis() {
  const s = G.save; const L = [];
  for (const slot in s.equip) { const id = s.equip[slot]; if (id && ITENS[id]) L.push({ id, r: (s.equipR || {})[slot] || 0, onde: 'equip', slot }); }
  s.mochila.forEach((m, i) => { if (ITENS[m.id] && ITENS[m.id].tipo === 'equip') L.push({ id: m.id, r: m.r || 0, onde: 'mochila', i }); });
  return L;
}
function statsItemTxt(id, r) {
  const it = ITENS[id]; const p = [];
  if (it.atk) p.push(`Ataque ${(it.atk * (1 + 0.12 * r)).toFixed(1).replace('.0', '')}`);
  if (it.def) p.push(`Defesa ${(it.def * (1 + 0.12 * r)).toFixed(1).replace('.0', '')}`);
  for (const k in (it.st || {})) p.push(`+${(it.st[k] * (1 + 0.1 * r)).toFixed(1).replace('.0', '')} ${({ drible: 'drible', chute: 'chute', defesa: 'defesa', visao: 'visão', hp: 'fôlego', foco: 'foco', vel: 'veloc.', regen: 'recup.' })[k]}`);
  return p.join(' · ') || 'sem atributos';
}
function modalRefino(npc, msg) {
  const s = G.save; const lista = el('div', { class: 'lista' });
  const itens = itensRefinaveis();
  if (!itens.length) lista.append(el('p', {}, 'Você não tem equipamentos para refinar.'));
  for (const o of itens) {
    const ic = iconeClone(iconeItem(o.id));
    const linha = el('div', { class: 'linha-item' + (o.r >= REFINO_MAX ? ' bloq' : '') }, ic,
      el('div', { class: 'nm' }, el('b', {}, nomeItem(o.id, o.r) + (o.onde === 'equip' ? ' (equipado)' : '')), el('small', {}, statsItemTxt(o.id, o.r) + (o.r < REFINO_MAX ? '  →  ' + statsItemTxt(o.id, o.r + 1) : ''))));
    if (o.r >= REFINO_MAX) { linha.append(el('b', {}, 'MÁXIMO')); lista.append(linha); continue; }
    const c = custoRefino(o.id, o.r);
    const temMats = c.mats.every(([m, n]) => contaItem(m) >= n);
    const pode = s.ouro >= c.tostoes && temMats;
    linha.append(el('div', { class: 'refino-custo' }, precoTag(c.tostoes), ...c.mats.map(([m, n]) => el('small', { class: contaItem(m) >= n ? '' : 'falta' }, `${n}x ${ITENS[m].nome} (${contaItem(m)})`)), el('small', {}, `Chance: ${Math.round(c.chance * 100)}%`)),
      el('button', { class: 'btn amarelo mini', disabled: pode ? null : 'disabled', onclick: () => refinar(o, npc) }, `Refinar +${o.r + 1}`));
    lista.append(linha);
  }
  abreModal.largo = true;
  abreModal(el('h2', {}, 'Oficina do Seu Remendo'), msg ? el('p', { class: 'refino-msg' }, msg) : '',
    el('p', {}, 'Cada refino deixa o item mais forte (+12% de ataque/defesa e +10% nos bônus). Até +3 é garantido; depois pode falhar — se falhar, o item NÃO quebra, só gasta os tostões e os materiais.'),
    el('p', {}, 'Seus tostões: ', precoTag(s.ouro)), lista, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => abrirNPC(npc) }, 'Voltar')));
}
function refinar(o, npc) {
  const s = G.save; const c = custoRefino(o.id, o.r);
  if (s.ouro < c.tostoes || !c.mats.every(([m, n]) => contaItem(m) >= n)) return;
  s.ouro -= c.tostoes; c.mats.forEach(([m, n]) => removeItem(m, n));
  let msg;
  if (Math.random() < c.chance) {
    const novo = o.r + 1;
    if (o.onde === 'equip') { s.equipR = s.equipR || {}; s.equipR[o.slot] = novo; } else if (s.mochila[o.i]) s.mochila[o.i].r = novo;
    msg = `✨ SUCESSO! ${nomeItem(o.id, novo)} ficou mais forte!`; som('nivel'); banner(nomeItem(o.id, novo), 'Refino bem-sucedido!'); log(msg, 'l-lvl'); contaEvento('refino');
  } else { msg = `💥 Não deu certo desta vez... O item continua ${nomeItem(o.id, o.r)}. Tente de novo!`; som('erro'); log(msg, 'l-dano'); }
  salvar(); G.uiSujo = true; atualizaRetrato(); modalRefino(npc, msg);
}

document.addEventListener('DOMContentLoaded', telaInicial);
