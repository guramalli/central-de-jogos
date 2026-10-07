/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — interface: painéis, diálogos, lojas,
   minijogos (pênalti, quiz, matemática), álbum, ranking
   ============================================================ */

/* ---------------- log, banner ---------------- */
// v366 (dono: "o horário no chat está sempre o mesmo"): a hora de cada mensagem é a HORA DE VERDADE (como num chat).
// Antes era o relógio do jogo, que fica parado com o Modo Treino ligado e dentro de casas/prédios. Guarda 400 mensagens
// (o histórico grande está em historico.js) e só desce sozinho se você não estiver lendo mais em cima.
function log(msg, cls = 'l-info') {
  const L = $('#log'); if (!L) return;
  const d = new Date(), h = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  // v410.2 (desempenho, dono: "pequenas travadas que atrapalham" nas vitórias): antes cada linha lia o tamanho do registro
  // ANTES e DEPOIS de escrever — cada leitura obrigava o navegador a refazer o layout da página inteira no meio do quadro
  // (uma vitória escreve 2–7 linhas). Agora "está no fim?" é anotado quando a pessoa rola (evento scroll) e a descida até
  // o fim acontece UMA vez, no próximo quadro. O que aparece é o mesmo.
  if (!L._lgOk) { L._lgOk = true; L._lgFim = true; L.addEventListener('scroll', () => { L._lgFim = L.scrollHeight - L.scrollTop - L.clientHeight < 40; }, { passive: true }); }
  L.append(el('div', { class: cls, title: G.save ? `Game day ${G.save.dia || 1}` : '' }, h + ' ' + msg));
  while (L.children.length > 400) L.firstChild.remove();
  if (!L._lgRola) { L._lgRola = true; requestAnimationFrame(() => { L._lgRola = false; if (L._lgFim || !document.body.classList.contains('log-grande')) { L.scrollTop = L.scrollHeight; L._lgFim = true; } }); }
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
// v407 (Raio-X T4): montaRetrato saiu daqui — boneco.js declara a mesma função depois e só a de lá rodava.
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
  box.append(el('p', { class: 'resumo' }, 'Loading the world...'), el('div', { class: 'progresso', style: 'width:min(360px,80vw)' }, barra));
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
  $('#btnSom').onclick = () => { G.somOn = !G.somOn; $('#btnSom').textContent = G.somOn ? '🔊' : '🔇'; $('#btnSom').title = G.somOn ? 'Sound on (click to turn off)' : 'Sound off (click to turn on)'; };
}
function atualizaBarras() {
  const s = G.save, st = stats();
  s.hp = Math.min(s.hp, st.maxHp); s.foco = Math.min(s.foco, st.maxFoco);
  $('#bHp').style.width = (s.hp / st.maxHp * 100) + '%'; $('#tHp').textContent = `Stamina (HP) ${fmt(s.hp)} / ${fmt(st.maxHp)}`;
  $('#bFoco').style.width = (s.foco / st.maxFoco * 100) + '%'; $('#tFoco').textContent = `Focus (mana) ${fmt(s.foco)} / ${fmt(st.maxFoco)}`;
  const a = xpPara(s.nivel), b = xpPara(s.nivel + 1);
  $('#bXp').style.width = ((s.xp - a) / (b - a) * 100) + '%'; $('#tXp').textContent = `XP ${fmt(s.xp)} / ${fmt(b)}`;
  $('#ouro').textContent = fmt(s.ouro);
  const h = Math.floor(s.hora / 60) % 24, mi = Math.floor(s.hora % 60);
  $('#relogio').textContent = `Day ${s.dia} — ${String(h).padStart(2, '0')}:${String(mi - mi % 10).padStart(2, '0')}`;
}
function atualizaHotbarCd() {
  const s = G.save; const st = stats();
  { const b = $('#btnClasse'); const cl = CLASSES[s.classe]; let cd = b.querySelector('.cd'); const rest = (G.cds.classe || 0) - G.agora;
    if (cl && rest > 0) { if (!cd) { cd = el('i', { class: 'cd' }); b.append(cd); } cd.style.width = (rest / cl.especial.cd * 100) + '%'; } else if (cd) cd.remove(); }
  document.querySelectorAll('#hotbar .slot').forEach((b, i) => {
    const h = s.hotbar[i]; let cd = b.querySelector('.cd');
    if (!h) { if (cd) cd.remove(); return; }
    let fim = 0, dur = 1;
    let grupo = false;
    if (h.t === 'd') { const dr = DRIBLES[h.id]; const g = grupoDrible(dr); const fimG = G.cds[g] || 0, fimP = G.cds[h.id] || 0; fim = Math.max(fimG, fimP); grupo = fimG > fimP; dur = !grupo ? Math.max(dr.cd, 1000) : CD_GRUPO[g]; b.classList.toggle('off', s.nivel < dr.lvl || s.foco < Math.ceil(dr.foco * (st.custoFoco || 1))); }
    else { fim = G.cds.pocao || 0; dur = 1000; const q = b.querySelector('.qtd'); const n = contaItem(h.id); if (q) q.textContent = n; b.classList.toggle('off', !n); }
    const rest = fim - G.agora;
    if (rest > 0) { if (!cd) { cd = el('i', { class: 'cd' }); b.append(cd); } cd.classList.toggle('grupo', grupo); cd.style.height = clamp(rest / dur * 100, 0, 100) + '%'; } else if (cd) cd.remove();
  });
}
function atualizaPaineis() {
  const s = G.save; if (!s) return; const st = stats();
  // perfil
  $('#pNome').textContent = s.nome;
  $('#pFase').textContent = FASES[faseIdx(s.nivel)].nome + (s.posicao ? ' — ' + POSICOES[s.posicao].nome : '');
  $('#pNivel').textContent = 'Level ' + s.nivel;
  $('#btnModo').textContent = 'X · ' + (G.modo === 'drible' ? 'Dribbling' : 'Shooting');
  { const cl = CLASSES[s.classe]; $('#btnClasse').innerHTML = ''; $('#btnClasse').append(el('span', { class: 'tecla' }, '⇧'), cl ? `${cl.emoji} ${cl.especial.nome}` : 'Class'); $('#btnClasse').title = cl ? cl.especial.desc : ''; }
  $('#btnCaca').textContent = 'G · Hunt: ' + (G.caca ? 'ON' : 'off'); $('#btnCaca').classList.toggle('ligado', !!G.caca);
  $('#btnFicha').classList.toggle('tem-pontos', (s.pontos || 0) > 0); { const tx = (s.pontos || 0) > 0 ? `📋 Profile +${s.pontos}` : '📋 Profile'; if ($('#btnFicha').textContent !== tx) $('#btnFicha').textContent = tx; }
  // hotbar
  document.querySelectorAll('#hotbar .slot').forEach((b, i) => {
    const h = s.hotbar[i]; b.innerHTML = ''; b.append(el('span', { class: 'tecla' }, teclaSlot(i)));
    b.classList.remove('tj'); b.style.removeProperty('--tj');
    if (!h) { b.title = 'Empty'; return; }
    if (h.t === 'd') { const dr = DRIBLES[h.id]; b.prepend(iconeClone(iconeDrible(h.id))); const tj = typeof tipoJogada === 'function' ? tipoJogada(dr) : null; if (tj) { b.classList.add('tj'); b.style.setProperty('--tj', tj.cor); b.append(el('span', { class: 'faixa-tj' }, (typeof TJ_FAIXA !== 'undefined' && TJ_FAIXA[tj.k]) || tj.rot)); } /* v267: faixa colorida com o tipo */ b.title = `${dr.nome} — ${dr.desc}${tj ? ' ' + textoJogada(dr) : ''} (level ${dr.lvl}, ${dr.foco} focus). Right-click removes it.`; }
    else { b.prepend(iconeClone(iconeItem(h.id))); b.append(el('span', { class: 'qtd' }, contaItem(h.id))); b.title = ITENS[h.id].nome + ' — right-click removes it.'; }
  });
  atualizaHotbarCd(); // v358: o redesenho apagava o escurecido do cooldown até a próxima checagem (0,35 s): os botões piscavam
  // equipamento: boneco com cada peça no seu lugar do corpo (desenho, posições e linhas em layout.js)
  // v410.7: equipamento (com o boneco desenhado) só é refeito no laço quando as peças mudaram
  const parcial = typeof DSQ !== 'undefined' && DSQ.noLaco;
  const sigEq = JSON.stringify([s.equip, s.equipR || {}, s.costas && s.costas.id, mochilaSlots(), s.nivel, s.classe, G.icoGer || 0]); // (v411: G.icoGer = arte de ícone que chegou depois → refaz)
  const eq = $('#equip');
  G.eqIntacto = !!(parcial && eq._sig === sigEq && eq.firstChild); // (avisa itens.js para não pôr o selo de novo)
  if (!G.eqIntacto) {
  eq._sig = sigEq; eq.innerHTML = '';
  const g = el('div', { class: 'equip-grade equip-boneco' });
  // v400 (dono: "a mochila deve ficar igual os itens, do lado do jogador"): a mochila das costas é um quadro do boneco (Mochila)
  const rot = { cabeca: 'Head', acessorio: 'Neck', camisa: 'Jersey', calcao: 'Shorts', perna: 'Shin Guards', chuteira: 'Cleats', costas: 'Backpack' };
  for (const slot of ['cabeca', 'camisa', 'acessorio', 'perna', 'calcao', 'chuteira', 'costas']) {
    const id = slot === 'costas' ? (s.costas && ITENS[s.costas.id] ? s.costas.id : null) : s.equip[slot]; const b = el('div', { class: 'eq-slot ' + (id ? 'cheio' : 'eq-vazio'), 'data-slot': slot, title: id ? `${ITENS[id].nome} — ${ITENS[id].desc} (click to take it off)` : `${rot[slot]}: empty. Drag an item from the Backpack here.` });
    if (id) b.append(iconeClone(iconeItem(id)));
    else if (typeof fantasmaSlot === 'function') b.append(fantasmaSlot(slot));
    const rq = (s.equipR || {})[slot]; if (id && rq) { b.append(el('span', { class: 'ref' }, '+' + rq)); b.title = nomeItem(id, rq) + ' — click to take it off'; }
    b.append(el('span', { class: 'rot' }, rot[slot]));
    b.onclick = () => id && desequipar(slot);
    if (slot === 'costas') { b.title = id ? `${ITENS[id].nome} (${mochilaSlots()} slots) — drag another backpack here to swap` : 'Backpack'; b.onclick = () => { if (typeof abreAba === 'function') abreAba('mochila'); }; }
    g.append(b);
  }
  if (typeof montaBonecoEquip === 'function') montaBonecoEquip(g);
  eq.append(g); // (v400: Ataque, Defesa e Velocidade ficam no status, perto do fôlego e do foco)
  } // (fim do equipamento)
  // mochila
  // v396 (dono: "refaça a mecânica das backpacks... quero algo igual o Tibia"): uma COLUNA de janelas, como no Tibia:
  // a mochila das costas (sempre a primeira; minimiza, não fecha) e uma janela para cada bolsa aberta (↑ volta para a de
  // fora, 🎯 loot, – minimiza, ✕ fecha). Cada quadro guarda em data-i o índice do item em s.mochila (os enfeites de
  // itens.js/layout.js/itens_marcas.js usam o data-i). Arrastar, dividir pilhas e trocar a mochila das costas: mochila_tibia.js
  // v410.7 (desempenho, rastro do navegador 07/10): no laço do jogo, a mochila só é refeita quando o que ela mostra mudou
  // (uma vitória que só mexe em ouro/XP não refaz 105 quadros). G.moIntacta avisa os enfeites (itens.js, itens_marcas.js, layout.js)
  // para não enfeitar de novo os mesmos quadros. Fora do laço (clique, arrastar, janela) refaz sempre.
  const mo = $('#mochila');
  const sigMo = sigEq + JSON.stringify([s.mochila.map(e => [e.id, e.q, e.r || 0, e.c ?? null, e.u ?? null]), s.bolsasAbertas, s.bolsasMin, Object.keys(s.travados || {}), Math.round(pesoMochila(s)), capPeso(s), document.body.classList.contains('modo-celular')]);
  G.moIntacta = !!(parcial && mo._sig === sigMo && mo.firstChild);
  if (!G.moIntacta) {
  mo._sig = sigMo; mo.innerHTML = '';
  if (typeof arrumaBolsas === 'function') arrumaBolsas(s);
  const peso = pesoMochila(s), cap = capPeso(s);
  const abertas = (s.bolsasAbertas = (s.bolsasAbertas || []).filter(u => s.mochila.some(e => e.u === u)));
  const minis = new Set(s.bolsasMin || []);
  // v399 (dono: "vamos simplificar"): sem a linha de cima; o PESO que você carrega fica no título da primeira mochila e o
  // CAP (quanto aguenta) no status do personagem. Botão direito numa mochila abre; item que entra vai para a 1ª posição.
  const grade = (u, espacos) => {
    const gm = el('div', { class: 'mochila-grade', 'data-bolsa': u == null ? '' : String(u) });
    const dentro = []; s.mochila.forEach((e, i) => { if ((e.c ?? null) === (u ?? null)) dentro.push(i); });
    for (let k = 0; k < Math.max(espacos, dentro.length); k++) {
      const i = dentro[k], it = i != null ? s.mochila[i] : null; const b = el('button', { class: 'slot' + (it && ITENS[it.id].raro ? ' raro' : '') });
      if (it) {
        b.dataset.i = i; b.draggable = true;
        b.append(iconeClone(iconeItem(it.id))); if (it.q > 1) b.append(el('span', { class: 'qtd' }, it.q));
        if (it.r) b.append(el('span', { class: 'ref' }, '+' + it.r));
        b.title = nomeItem(it.id, it.r) + (it.q > 1 ? ` (${it.q})` : '');
        if (ehBolsa(it.id)) { // mochila: BOTÃO DIREITO abre/fecha a janela dela (como no Tibia); clique mostra a mochila
          b.classList.add('bolsa'); if (abertas.includes(it.u)) b.classList.add('aberta');
          b.title += ' — right-click to open'; b.onclick = () => modalItem(it.id, 0); b.oncontextmenu = ev => { ev.preventDefault(); abreBolsa(it.u); };
        } else {
          b.onclick = () => modalItem(it.id, it.r || 0);
          b.oncontextmenu = ev => { ev.preventDefault(); if (ITENS[it.id].tipo === 'equip') equipar(it.id, it.r || 0); else usarItem(it.id); };
        }
      }
      gm.append(b);
    }
    return gm;
  };
  const janela = (u, iconeId, nome, n, espacos, botoes) => {
    const chave = u == null ? 'raiz' : String(u), mini = minis.has(chave);
    const j = el('div', { class: 'bolsa-janela' + (u == null ? ' mt-raiz' : '') + (mini ? ' mini' : ''), 'data-bolsa': u == null ? '' : String(u), 'data-janela': chave },
      el('div', { class: 'bolsa-tit', draggable: u == null ? null : 'true', title: u == null ? '' : 'Drag to change the order of the windows' },
        iconeClone(iconeItem(iconeId)), el('b', {}, nome), el('small', {}, `${n}/${espacos}`), ...botoes,
        el('button', { class: 'btn mini', type: 'button', title: mini ? 'Show' : 'Minimize', onclick: () => { const l = new Set(s.bolsasMin || []); l.has(chave) ? l.delete(chave) : l.add(chave); s.bolsasMin = [...l]; G.uiSujo = true; } }, mini ? '▢' : '–')));
    if (!mini) j.append(grade(u, espacos));
    return j;
  };
  { // a mochila das costas
    const c = s.costas && ITENS[s.costas.id] ? s.costas.id : null, n = s.mochila.filter(e => e.c == null).length;
    mo.append(janela(null, c || 'mochila_viagem', c ? ITENS[c].nome : 'Backpack', n, mochilaSlots(), [
      el('span', { class: 'mt-peso' + (peso > cap * 0.9 ? ' pesada' : ''), title: `Weight you're carrying (your CAP is ${fmt(cap)})` }, `⚖️ ${fmt(Math.round(peso))}`),
      typeof organizaMochila === 'function' ? el('button', { class: 'btn mini', type: 'button', title: 'Sort the backpack (by type: drinks, food, equipment, materials...)', onclick: () => organizaMochila('funcao') }, '⇅') : '']));
  }
  for (const u of abertas) {
    const bag = s.mochila.find(e => e.u === u); const def = ITENS[bag.id]; const n = s.mochila.filter(e => e.c === u).length;
    mo.append(janela(u, bag.id, def.nome, n, def.espacos, [
      el('button', { class: 'btn mini', type: 'button', title: 'Back to the outer bag', onclick: () => { if (typeof mtSobe === 'function') mtSobe(u); } }, '↑'),
      el('button', { class: 'btn mini', type: 'button', title: 'Close the bag', onclick: () => abreBolsa(u) }, '✕')]));
  }
  mo.append(el('div', { class: 'vazio' }, 'Right-click: opens the backpack / uses or equips the item. Drag items into backpacks (they go into the 1st slot; Shift splits the stack). Backpack full: the rest goes into the backpack inside it. Shift + click describes the item.'));
  } // (fim da mochila)
  { const bp = document.getElementById('bolsasAbertas'); if (bp) bp.innerHTML = ''; }
  // habilidades
  const sk = $('#skills'); sk.innerHTML = '';
  const a = xpPara(s.nivel), bxp = xpPara(s.nivel + 1);
  // v402 (dono: "faça no estilo do Tibia... pequeno, menos é mais"): uma linha por habilidade (nome à esquerda, valor à
  // direita) e uma barrinha fina embaixo com o quanto falta; o bônus (equipamentos, comidas) aparece pequeno em verde
  const pcN = Math.floor((s.xp - a) / (bxp - a) * 100);
  const linha = (nome, valor, pc, dica, bonus, cls) => el('div', { class: 'skt' + (cls ? ' ' + cls : ''), title: dica },
    el('div', { class: 'skt-l' }, el('span', {}, nome), bonus ? el('small', {}, `+${num1(bonus)}`) : '', el('b', {}, valor)),
    pc === null ? '' : el('div', { class: 'skt-b' }, el('i', { style: `width:${pc}%` })));
  sk.append(linha('Level', fmt(s.nivel), pcN, `${pcN}% of the level — ${fmt(bxp - s.xp)} XP left to level ${s.nivel + 1}`, 0, 'xp'),
    linha('Experience', fmt(s.xp), null, `${fmt(bxp - s.xp)} XP left to level ${s.nivel + 1}`, 0, 'sub'));
  for (const k of ['drible', 'chute', 'defesa', 'visao']) {
    const o = s.sk[k]; const bonus = st[k] - o.lv, pc = Math.min(99, Math.floor(o.t / precisaTentativas(k, o.lv) * 100));
    sk.append(linha(SKILLS[k].nome, String(o.lv), pc, `${SKILLS[k].desc} — ${pc}% to ${o.lv + 1}` + (bonus ? `. ${o.lv} trained + ${num1(bonus)} bonus (equipment, food...) = ${num1(st[k])} in game` : ''), bonus));
  }
  const hh = Math.floor(s.st.tempo / 3600), mm = Math.floor(s.st.tempo / 60) % 60;
  sk.append(el('div', { class: 'sk-info' },
    el('span', {}, 'Position:'), el('b', {}, s.posicao ? POSICOES[s.posicao].nome : 'level 10'),
    el('span', {}, 'Opponents:'), el('b', {}, fmt(s.st.abates)),
    el('span', {}, 'Bosses:'), el('b', {}, s.st.chefes),
    el('span', {}, 'Penalty goals:'), el('b', {}, s.st.gols),
    el('span', {}, 'Quiz answers right:'), el('b', {}, s.st.quiz + s.st.prof),
    el('span', {}, 'Stickers:'), el('b', {}, `${Object.keys(s.figs).length}/${FIGURINHAS.length}`),
    el('span', {}, 'Times exhausted:'), el('b', {}, s.st.mortes),
    el('span', {}, 'Play time:'), el('b', {}, `${hh}h${String(mm).padStart(2, '0')}`),
  ));
  sk.append(el('p', { class: 'vazio' }, 'Dribbles learned: ' + (s.dribles.map(d => DRIBLES[d].nome).join(', ') || 'nenhum ainda')));
  atualizaRastreador(); atualizaBatalha(); atualizaBarras();
}
function barraI(p) { const i = el('i'); i.style.width = clamp(p * 100, 0, 100) + '%'; return i; }
// v410.2 (desempenho): cada redesenho dos painéis (barra de atalhos, mochila, equipamento) criava ~60 telinhas novas e
// jogava fora as de antes — memória que o navegador precisa limpar depois (travadinha). Agora, SÓ durante o redesenho dos
// painéis (ICONE_POOL.ger > 0, ligado em desempenho_v410.js), a cópia do redesenho anterior que saiu da tela é
// reaproveitada para o MESMO ícone: limpa os enfeites que alguém pôs nela e redesenha igual. Fora dele: como sempre.
const ICONE_POOL = { m: new WeakMap(), ger: 0, on: false };
function iconeClone(c) {
  if (!ICONE_POOL.on || !c) { const n = mkCanvas(c.width, c.height); n.getContext('2d').drawImage(c, 0, 0); return n; }
  let l = ICONE_POOL.m.get(c); if (!l) ICONE_POOL.m.set(c, l = []);
  let n = null;
  for (let i = 0; i < l.length; i++) if (!l[i].isConnected && l[i]._icGer !== ICONE_POOL.ger) { n = l[i]; break; }
  if (n) {
    for (const a of [...n.attributes]) if (a.name !== 'width' && a.name !== 'height') n.removeAttribute(a.name);
    if (n.width !== c.width || n.height !== c.height) { n.width = c.width; n.height = c.height; } else n.getContext('2d').clearRect(0, 0, n.width, n.height);
  } else { n = mkCanvas(c.width, c.height); if (l.length < 24) l.push(n); }
  n._icGer = ICONE_POOL.ger; // (pedido 2x no mesmo redesenho: cada um ganha a sua)
  n.getContext('2d').drawImage(c, 0, 0);
  return n;
}

function atualizaBatalha() {
  const L = $('#listaBatalha'); if (!L || !G.p) return;
  const p = G.p; const vis = G.mons.filter(m => Math.abs(m.x - p.x) <= 7 && Math.abs(m.y - p.y) <= 5).sort((a, b) => dist(a, p) - dist(b, p));
  const chave = vis.map(m => m.uid + ':' + Math.round(m.hp / m.d.hp * 20)).join(',') + '|' + (G.alvo ? G.alvo.uid : '');
  if (L.dataset.k === chave) return; L.dataset.k = chave;
  L.innerHTML = '';
  if (!vis.length) { L.append(el('div', { class: 'vazio' }, 'No opponents nearby. Click an opponent on the map (or press SPACE) to target them.')); return; }
  for (const m of vis) {
    const c = mkCanvas(64, 80); pintaAparencia(c, m.d.look);
    const pc = m.d.treino ? 1 : clamp(m.hp / m.d.hp, 0, 1);
    const hp = el('div', { class: 'bl-hp' }); const i = el('i'); i.style.width = pc * 100 + '%'; i.style.background = pc > 0.6 ? '#3ad83a' : pc > 0.3 ? '#e8d23a' : '#e83a3a'; hp.append(i);
    const row = el('div', { class: 'bl-item' + (G.alvo === m ? ' alvo' : '') }, c, el('div', { style: 'flex:1' }, el('div', { class: 'bl-nome' }, el('span', { class: 'bl-nv', style: `color:${corNivel(nivelMonstro(m.d))}` }, `Lv ${nivelMonstro(m.d)} `), m.d.nome + (m.d.chefe ? ' ★' : '')), hp));
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
    R.append(el('div', { class: 'cartao-dica' }, el('b', {}, '💡 Tip'), el('p', {}, dc.txt), el('button', { class: 'btn amarelo mini', onclick: () => { G.dicasFila.shift(); G.uiSujo = true; } }, 'Got it')));
    if (dc.destaque) document.querySelectorAll(dc.destaque).forEach(e => e.classList.add('destaque'));
  } else if (s.tut < TUTORIAL.length) {
    const st = TUTORIAL[s.tut];
    if (G.tutMin === s.tut) {
      // passo minimizado: só uma etiqueta; ele continua valendo e avança sozinho quando a ação for feita
      R.append(el('button', { class: 'btn mini cartao-tut-min', type: 'button', onclick: () => { G.tutMin = -1; G.uiSujo = true; } }, `📖 Tutorial ${s.tut + 1}/${TUTORIAL.length} · see tip`));
    } else {
      const ops = el('div', { class: 'tut-ops' });
      if (st.ok) ops.append(el('button', { class: 'btn amarelo mini', onclick: avancaTutorial }, 'Got it'));
      // v407 (Raio-X R2b): "Ok" parecia "feito" mas só escondia; agora diz o que faz (o passo avança quando você faz o que ele pede)
      else ops.append(el('button', { class: 'btn mini', title: 'Hides the tip; the tutorial continues when you do what it asks', onclick: () => { G.tutMin = s.tut; G.uiSujo = true; } }, 'Hide tip'));
      ops.append(el('button', { class: 'btn mini', onclick: async () => { if (await perguntaJogo('Skip the tutorial? Tips will keep showing up.', { sim: 'Skip' })) pularTutorial(); } }, 'Skip tutorial'));
      R.append(el('div', { class: 'cartao-tut' }, el('div', { class: 'tut-topo' }, el('b', {}, `Tutorial ${s.tut + 1}/${TUTORIAL.length}`), st.tecla ? el('span', { class: 'kbd' }, st.tecla) : ''), el('p', {}, st.txt), ops));
      if (st.destaque) document.querySelectorAll(st.destaque).forEach(e => e.classList.add('destaque'));
    }
  }
  if (s.tut >= TUTORIAL.length) {
    let n = 0;
    for (const q of MISSOES) {
      const e = s.quests[q.id]; if (!e || e.s !== 'ativa') continue; if (n++ >= 2) break;
      const [a, b] = progressoMissao(q); const pronta = a >= b;
      // v238: diz com quem entregar e onde; clicar faz a seta amarela levar até a pessoa
      const nNpc = (NPCS[q.npc] || {}).nome || 'quem te deu', onde = typeof ondeFica === 'function' ? ondeFica(q.npc) : '';
      const leva = ev => { ev.stopPropagation(); G.guiaPedido = { npc: q.npc, quest: q.id, entregar: true }; G.guiaOn = true; G.uiSujo = true; log(`📍 The yellow arrow now leads to ${nNpc}${onde ? ` (${onde})` : ''}.`, 'l-xp'); if (typeof avisoTela === 'function') avisoTela(`📍 Follow the yellow arrow to ${nNpc}`, 'l-xp'); };
      R.append(el('div', { class: 'rast rast-q' + (pronta ? ' pronta' : ''), title: `Click and the yellow arrow takes you to ${nNpc}`, onclick: leva }, el('b', {}, q.titulo), el('br'), pronta ? `✔ Done! Turn it in to ${nNpc}` : `${descMissao(q)}: ${a}/${b}`,
        el('div', { class: 'rast-onde' }, `📍 ${pronta ? '' : 'Deliver to: ' + nNpc + ' · '}${onde || 'check the map'} · click to go`)));
    }
    if (s.tarefa) R.append(el('div', { class: 'rast' + (s.tarefa.p >= s.tarefa.n ? ' pronta' : '') }, el('b', {}, 'Challenge: '), `${MONSTROS[s.tarefa.m].nome} ${s.tarefa.p}/${s.tarefa.n}`));
  }
}

/* ---------------- modal genérico ---------------- */
function abreModal(...conteudo) {
  const M = $('#modal'); const C = $('#modalConteudo'); C.innerHTML = ''; C.append(...conteudo.flat().filter(x => x != null && x !== false)); // sem "null" escrito na janela
  M.hidden = false; G.pausado = true; G.teclas.clear(); M.querySelector('.fechar').hidden = false;
  M.querySelector('.modal-caixa').classList.toggle('largo', !!abreModal.largo); abreModal.largo = false;
}
function fechaModalX() { if ($('#modal .fechar').hidden) return; const morto = !!(G.save && G.save.hp <= 0); fechaModal(); if (morto && typeof renascer === 'function') renascer(); }
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
  if (it.tipo !== 'equip') for (const k in (it.st || {})) info.push(`+${it.st[k]} ${({ drible: 'drible', chute: 'chute', defesa: 'defesa', visao: 'vision', hp: 'stamina', foco: 'foco', vel: 'velocidade', regen: 'regeneration' })[k]}`);
  if (it.lvl) info.push(`Level ${it.lvl}`);
  const ops = el('div', { class: 'opcoes' });
  if (it.tipo === 'equip') ops.append(el('button', { class: 'btn amarelo', onclick: () => { equipar(id, r); fechaModal(); } }, 'Equip'));
  if (it.tipo === 'comida') ops.append(el('button', { class: 'btn amarelo', onclick: () => { usarItem(id); fechaModal(); } }, 'Eat'), el('button', { class: 'btn', onclick: () => { poeNaHotbar('i', id); fechaModal(); } }, 'Put on the hotbar'));
  if (it.tipo === 'consumivel') {
    ops.append(el('button', { class: 'btn amarelo', onclick: () => { usarItem(id); fechaModal(); } }, 'Use'));
    ops.append(el('button', { class: 'btn', onclick: () => { poeNaHotbar('i', id); fechaModal(); } }, 'Put on the hotbar'));
  }
  if (it.tipo !== 'chave') ops.append(el('button', { class: 'btn', onclick: async () => { if (await perguntaJogo(`Throw away ${it.nome}?`, { sim: 'Throw away', perigo: true })) { if (it.tipo === 'equip') removeEquipR(id, r); else removeItem(id, n); fechaModal(); } } }, 'Throw away'));
  abreModal(el('h2', {}, nomeItem(id, r)), el('div', { class: 'npc-topo' }, c, el('div', {}, el('p', {}, it.desc || ''), el('p', {}, info.join(' · ')), el('p', {}, `You have: ${n}` + (it.venda ? ` · Worth ${it.venda} coins` : '')))), ops);
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
      fala = ativa.fim ? 'You did it!' : fala;
      ops.append(el('button', { class: 'btn amarelo', onclick: () => { entregaMissao(ativa); abrirNPCDepois(npc, ativa.fim); } }, `Turn in: ${ativa.titulo}`));
    } else {
      extras.push(el('div', { class: 'linha-item' }, el('div', { class: 'nm' }, el('b', {}, ativa.titulo), el('small', {}, `${descMissao(ativa)} — ${a}/${b}`)), ));
      if (ativa.id === 'q_peneira') ops.append(el('button', { class: 'btn amarelo', onclick: modalPosicao }, 'Do the tryout'));
    }
  } else {
    const disp = qs.find(q => statusMissao(q) === 'disponivel');
    if (disp) ops.append(el('button', { class: 'btn amarelo', onclick: () => modalMissao(npc, disp) }, `Mission: ${disp.titulo}`));
    else {
      const prox = qs.find(q => statusMissao(q) === 'nivel');
      if (prox) extras.push(el('p', {}, `(Come back when you're level ${prox.lvl}: I have another mission for you.)`));
    }
  }
  if (d.loja) ops.append(el('button', { class: 'btn verde', onclick: () => modalLoja(npc) }, 'Buy / sell'));
  // v227: sem o botão "Dribles que ensino": os dribles chegam sozinhos pelo nível (dribles_nivel.js)
  if (d.quiz) ops.append(el('button', { class: 'btn roxo', onclick: () => modalQuiz('futebol') }, quizFalta('futebol') > 0 ? `Soccer quiz (back in ${fmtFalta(quizFalta('futebol'))})` : 'Soccer quiz'));
  if (d.prof) ops.append(el('button', { class: 'btn roxo', onclick: () => modalQuiz('mat') }, quizFalta('mat') > 0 ? `Math class (back in ${fmtFalta(quizFalta('mat'))})` : 'Math class'));
  if (d.copa && typeof abrirCopaSonhos === 'function') ops.append(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); abrirCopaSonhos(); } }, 'Dream Cup'));
  if (d.cura) ops.append(el('button', { class: 'btn', onclick: () => { const st = stats(); s.hp = st.maxHp; s.foco = st.maxFoco; efeito('curaforte', G.p.x, G.p.y, '#5affb0'); som('cura'); log(`${d.nome} took care of you. Stamina and focus are full!`, 'l-npc'); fechaModal(); } }, 'Rest (recovers everything)'));
  if (d.refino) ops.append(el('button', { class: 'btn amarelo', onclick: () => modalRefino(npc) }, 'Upgrade equipment'));
  if (d.aviao && typeof modalVoo === 'function') ops.append(el('button', { class: 'btn amarelo', onclick: () => modalVoo(npc) }, '✈️ Fly'));
  if (d.empresario && typeof abrirCarreira === 'function' && s.nivel >= 25) ops.append(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); abrirCarreira(); } }, 'My career'));
  if (d.onibus) ops.append(el('button', { class: 'btn', onclick: modalOnibus }, 'Travel by bus'));
  if (d.empresario) ops.append(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); abrirTime(); } }, s.time ? 'Manage my team' : 'Found my team'));
  /* v257: não existe mais 'Trocar de posição' — a posição vem da classe (troque a classe até o nível 25) */
  if (d.posicao && s.classe && s.nivel <= CLASSE_TROCA_ATE) ops.append(el('button', { class: 'btn', onclick: modalTrocaClasse }, `🎭 Change class (free up to level ${CLASSE_TROCA_ATE})`)); // v256
  if (d.posicao && s.classe && s.nivel >= 2) ops.append(el('button', { class: 'btn amarelo', onclick: redistribuiAtributos }, `🔄 Reset stat points (${custoRedistribuir() ? fmt(custoRedistribuir()) + ' coins' : 'free the 1st time'})`));
  ops.append(el('button', { class: 'btn', onclick: fechaModal }, 'Bye!'));
  abreModal(el('h2', {}, d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, fala), ...extras)), ops);
}
function abrirNPCDepois(npc, txt) {
  abreModal(el('h2', {}, npc.d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, txt || 'Thanks!'))), el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => abrirNPC(npc) }, 'Continue'), el('button', { class: 'btn', onclick: fechaModal }, 'Close')));
}
function modalMissao(npc, q) {
  const r = q.rec; const rec = [];
  if (r.xp) rec.push(`${fmt(r.xp)} XP`); if (r.ouro) rec.push(`${fmt(r.ouro)} coins`);
  (r.itens || []).forEach(([id, n]) => rec.push(`${n}x ${ITENS[id].nome}`)); if (r.drible) rec.push(`drible ${DRIBLES[r.drible].nome}`);
  abreModal(el('h2', {}, q.titulo), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, q.texto), el('p', {}, el('b', {}, 'Goal: '), descMissao(q)), el('p', {}, el('b', {}, 'Reward: '), rec.join(', ')))),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => { aceitaMissao(q); fechaModal(); } }, 'Accept!'), el('button', { class: 'btn', onclick: () => abrirNPC(npc) }, 'Not now')));
}
// v257: a POSIÇÃO vem da CLASSE (antes eram duas escolhas separadas e confundia): Paredão = Zagueiro,
// Artilheiro = Atacante, Cérebro e Motorzinho = Meio-campo. A peneira só confirma a posição da sua classe.
const POSICAO_DA_CLASSE = { paredao: 'zagueiro', driblador: 'atacante', cerebro: 'meia', motorzinho: 'meia' };
function posicaoDaClasse(cl) { return POSICAO_DA_CLASSE[cl] || 'meia'; }
function modalPosicao() {
  const s = G.save; const cl = CLASSES[s.classe]; const k = posicaoDaClasse(s.classe), p = POSICOES[k];
  abreModal(el('h2', {}, '⚽ The tryout'),
    el('p', {}, `Seu Zé watched you play and already knows: ${cl ? `${cl.emoji} ${cl.nome} plays as` : 'you play as'} ${p.nome.toUpperCase()}!`),
    el('div', { class: 'card-pos', style: `border-color:${p.cor};max-width:320px;margin:0 auto` }, el('h4', {}, p.nome), el('p', {}, p.desc), el('p', {}, `+${p.hp} stamina and +${p.foco} focus per level`)),
    el('p', { class: 'dica' }, `Your position comes with your class. Up to level ${typeof CLASSE_TROCA_ATE !== 'undefined' ? CLASSE_TROCA_ATE : 25}, if you change class here with Seu Zé, your position changes too.`),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => {
      s.posicao = k; s.flags.escolheu_posicao = true; const st = stats(); s.hp = st.maxHp; s.foco = st.maxFoco;
      log(`Tryout passed: you're a ${p.nome}!`, 'l-lvl'); banner(p.nome.toUpperCase(), 'Passed the tryout'); som('nivel'); salvar(); fechaModal();
    } }, 'Let\'s play!')));
}

/* ---------------- loja ---------------- */
function modalLoja(npc, aba = 'comprar') {
  const s = G.save; const d = npc.d;
  const tabs = el('div', { class: 'tabs-modal' },
    el('button', { class: 'btn ' + (aba === 'comprar' ? 'amarelo' : ''), onclick: () => modalLoja(npc, 'comprar') }, 'Buy'),
    el('button', { class: 'btn ' + (aba === 'vender' ? 'amarelo' : ''), onclick: () => modalLoja(npc, 'vender') }, 'Sell'),
    el('button', { class: 'btn', onclick: () => abrirNPC(npc) }, 'Back'));
  const lista = el('div', { class: 'lista' });
  if (aba === 'comprar') {
    for (const id of d.loja) {
      const it = ITENS[id]; if (!it.preco) continue;
      const qtd = el('input', { type: 'number', min: 1, max: 1000, value: 1 }); // v391 (dono: "tentei comprar 200 bolinhos de alga, o máximo é 100"): até 1.000 de uma vez
      const bloq = it.lvl && s.nivel < it.lvl;
      lista.append(el('div', { class: 'linha-item' + (bloq ? ' bloq' : '') }, iconeClone(iconeItem(id)),
        el('div', { class: 'nm' }, el('b', {}, it.nome), el('small', {}, it.desc + (it.lvl > 1 ? ` (level ${it.lvl})` : ''))),
        precoTag(it.preco), empilha(id) ? qtd : '',
        el('button', { class: 'btn verde mini', onclick: () => {
          const q = empilha(id) ? clamp(parseInt(qtd.value) || 1, 1, 1000) : 1; const total = q * it.preco;
          if (s.ouro < total) { const da = Math.floor(s.ouro / it.preco); log(da > 0 ? `Not enough coins! You can buy up to ${da}x ${it.nome}.` : 'Not enough coins!', 'l-dano'); som('erro'); return; }
          { const pe = typeof pesoItem === 'function' ? pesoItem(id) : 0; if (pe > 0 && q > 1 && pesoMochila(s) + pe * q > capPeso(s)) { const cabe = Math.max(0, Math.floor((capPeso(s) - pesoMochila(s)) / pe)); log(cabe > 0 ? `Too heavy to carry ${q} at once: ${cabe}x ${it.nome} fit in your load.` : 'Your load is full!', 'l-dano'); som('erro'); return; } }
          if (addItem(id, q)) { s.ouro -= total; log(`You bought ${q}x ${it.nome} for ${fmt(total)} coins.`, 'l-loot'); som('moeda'); modalLoja(npc, 'comprar'); }
        } }, 'Buy')));
    }
  } else {
    const vendaveis = s.mochila.map((m, i) => ({ ...m, i })).filter(m => ITENS[m.id].venda);
    if (!vendaveis.length) lista.append(el('p', {}, 'You have nothing to sell.'));
    const vistos = new Set();
    // v326: etiqueta de raridade em cada linha, forjado com destaque laranja, e confirmação para o que é valioso
    const rarDe = id => (typeof raridadeItem === 'function' ? raridadeItem(id) : 'comum');
    const rarTag = id => { const r = rarDe(id); return el('span', { class: 'tag-rar rar-' + r }, String((RARIDADE[r] || { nome: r }).nome).toUpperCase()); };
    const valioso = id => ['epico', 'lendario', 'mitico'].includes(rarDe(id)) || !!(ITENS[id] && (ITENS[id].mitico || ITENS[id].lenda));
    const comDica = (row, id, r) => { if (typeof comTip === 'function' && typeof tipItem === 'function') comTip(row, () => tipItem(id, r || 0)); return row; };
    for (const m of vendaveis) {
      const chave = m.id + '|' + (m.r || 0); if (vistos.has(chave)) continue; vistos.add(chave);
      if (m.r) { const itR = ITENS[m.id]; const v = Math.round(itR.venda * (1 + 0.5 * m.r)); lista.append(comDica(el('div', { class: 'linha-item venda-forjado' }, iconeClone(iconeItem(m.id)), el('div', { class: 'nm' }, el('b', { class: 'txt-' + rarDe(m.id) }, nomeItem(m.id, m.r)), el('span', { class: 'venda-tags' }, rarTag(m.id), el('span', { class: 'tag-forjado' }, `⚒️ FORGED +${m.r}`))), precoTag(v), el('button', { class: 'btn mini vermelho', onclick: async () => { if (!(await perguntaJogo(`⚠️ ${nomeItem(m.id, m.r)} is FORGED (+${m.r}). The upgrade is lost if you sell it. Sell anyway?`, { sim: 'Sell', perigo: true }))) return; removeEquipR(m.id, m.r); s.ouro += v; som('moeda'); modalLoja(npc, 'vender'); } }, 'Sell')), m.id, m.r)); continue; }
      const it = ITENS[m.id]; const n = s.mochila.filter(x => x.id === m.id && !x.r).reduce((a, x) => a + x.q, 0);
      const confirma = async q => !valioso(m.id) || await perguntaJogo(`${it.nome} is ${String((RARIDADE[rarDe(m.id)] || { nome: rarDe(m.id) }).nome).toUpperCase()}. Sell ${q > 1 ? q + ' unidades' : '1 unit'} for ${fmt(it.venda * q)} coins?`, { sim: 'Sell', perigo: true });
      lista.append(comDica(el('div', { class: 'linha-item' + (valioso(m.id) ? ' venda-valioso' : '') }, iconeClone(iconeItem(m.id)), el('div', { class: 'nm' }, el('b', { class: 'txt-' + rarDe(m.id) }, it.nome), el('span', { class: 'venda-tags' }, rarTag(m.id), el('small', {}, `You have ${n}`))), precoTag(it.venda),
        el('button', { class: 'btn mini', onclick: async () => { if (!(await confirma(1))) return; removeItem(m.id, 1); s.ouro += it.venda; som('moeda'); modalLoja(npc, 'vender'); } }, 'Sell 1'),
        n > 1 ? el('button', { class: 'btn mini', onclick: async () => { if (!(await confirma(n))) return; removeItem(m.id, n); s.ouro += it.venda * n; som('moeda'); log(`Sold ${n}x ${it.nome} for ${fmt(it.venda * n)} coins.`, 'l-loot'); modalLoja(npc, 'vender'); } }, `All (${fmt(it.venda * n)})`) : ''), m.id, 0));
    }
  }
  abreModal(el('h2', {}, d.nome), el('p', {}, 'Your coins: ', precoTag(s.ouro)), tabs, lista);
}

/* ---------------- professor ---------------- */
function modalProfessor(npc) {
  const s = G.save; const lista = el('div', { class: 'lista' });
  for (const id of npc.d.professor) {
    const dr = DRIBLES[id]; const tem = s.dribles.includes(id); const preco = PRECO_DRIBLE[id];
    const q = MISSOES.find(m => m.rec.drible === id);
    const viaMissao = q && !tem;
    lista.append(el('div', { class: 'linha-item' + (tem ? ' bloq' : '') }, iconeClone(iconeDrible(id)),
      el('div', { class: 'nm' }, el('b', {}, dr.nome), el('small', {}, `${dr.desc} Level ${dr.lvl} · ${dr.foco} focus.`)),
      tem ? el('b', {}, 'Learned') : (viaMissao && statusMissao(q) !== 'feita') ? el('small', {}, `Earn it in the mission "${q.titulo}"`) :
        el('button', { class: 'btn roxo mini', onclick: () => { if (s.ouro < preco) { log('Not enough coins!', 'l-dano'); return; } s.ouro -= preco; aprendeDrible(id); modalProfessor(npc); } }, `Learn (${fmt(preco)})`)));
  }
  abreModal(el('h2', {}, 'Dribbles with ' + npc.d.nome), el('p', {}, 'Dribbles go on the hotbar (keys 1–0). Attack ones need a target selected.'), lista, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => abrirNPC(npc) }, 'Back')));
}

/* ---------------- ônibus ---------------- */
function modalOnibus() {
  const s = G.save; const lista = el('div', { class: 'lista' });
  MAPAS_ORDEM.forEach((id, i) => {
    const flag = MAPAS_FLAG[id]; const ok = !flag || s.flags[flag]; const preco = 15 * (i + 1);
    const aqui = G.mapa.id === id;
    lista.append(el('div', { class: 'linha-item' + (ok ? '' : ' bloq') }, el('div', { class: 'nm' }, el('b', {}, getMapa(id).nome), el('small', {}, ok ? (aqui ? 'You are here' : 'Unlocked') : 'Still locked')), ok && !aqui ? precoTag(preco) : '',
      ok && !aqui ? el('button', { class: 'btn amarelo mini', onclick: () => {
        if (s.ouro < preco) { log('Not enough coins for the ticket.', 'l-dano'); return; }
        s.ouro -= preco; const m = getMapa(id); const mot = m.npcs.find(n => n.id === 'motorista');
        fechaModal(); const alvo = mot ? { x: mot.x, y: mot.y + 1 } : m.inicio;
        trocaMapa(id, alvo.x + 0.5, alvo.y + 0.5); if (colide(G.p.x, G.p.y, R_ENT)) { const pos = posLivre(alvo.x, alvo.y, 2); if (pos) Object.assign(G.p, { x: pos.x, y: pos.y }); }
        som('apito');
      } }, 'Travel') : ''));
  });
  abreModal(el('h2', {}, 'Shuttle bus'), el('p', {}, 'Travel between the places you\'ve already unlocked.'), lista);
}

/* ---------------- quadro de desafios ---------------- */
function modalQuadro() {
  const s = G.save; const lista = el('div', { class: 'lista' });
  const t = s.tarefa;
  if (t) {
    const d = MONSTROS[t.m]; const pronta = t.p >= t.n; const xp = Math.round(d.xp * t.n * 0.6), ouro = Math.round(d.xp * t.n * 0.12);
    lista.append(el('div', { class: 'linha-item' }, el('div', { class: 'nm' }, el('b', {}, `Current challenge: ${d.nome}`), el('small', {}, `${t.p}/${t.n} — Reward: ${fmt(xp)} XP, ${fmt(ouro)} coins and 1 sticker pack`)),
      pronta ? el('button', { class: 'btn amarelo', onclick: () => { s.ouro += ouro; recebeItem('pacotinho', 1); s.tarefa = null; log(`Challenge complete! +${fmt(ouro)} coins.`, 'l-loot'); ganhaXp(xp); salvar(); modalQuadro(); } }, 'Claim!') :
        el('button', { class: 'btn mini', onclick: async () => { if (await perguntaJogo('Give up the current challenge?', { sim: 'Give up', perigo: true })) { s.tarefa = null; modalQuadro(); } } }, 'Give up')));
  } else {
    for (const [m, n] of (DESAFIOS[G.mapa.id] || [])) {
      const d = MONSTROS[m]; const xp = Math.round(d.xp * n * 0.6);
      lista.append(el('div', { class: 'linha-item' }, el('div', { class: 'nm' }, el('b', {}, `Beat ${n}x ${d.nome}`), el('small', {}, `Bonus: ${fmt(xp)} XP + coins + sticker pack`)),
        el('button', { class: 'btn amarelo mini', onclick: () => { s.tarefa = { m, n, p: 0 }; log(`Challenge accepted: beat ${n}x ${d.nome}.`, 'l-xp'); G.uiSujo = true; fechaModal(); } }, 'Accept')));
    }
  }
  abreModal(el('h2', {}, 'Challenge Board'), el('p', {}, 'Repeatable challenges: this is where you really train. One active challenge at a time.'), lista);
}

/* ---------------- quiz de futebol e matemática ---------------- */
function perguntaMat() {
  /* v407 (Raio-X R8): a aula saía com "287 gols no primeiro tempo", "940 minutos", "1 gols" e desconto em % já no nível 6.
     Agora os números ficam na faixa da escola (até ~100, divisões e porcentagens exatas), a dificuldade sobe com as
     respostas certas (s.st.prof) e não com o nível do boneco, e porcentagem só a partir do nível 15. */
  const n = G.save.nivel; const r = (a, b) => rndi(a, b);
  const D = Math.min(5, Math.floor(((G.save.st && G.save.st.prof) || 0) / 8) + (n >= 15 ? 1 : 0) + (n >= 40 ? 1 : 0)); // 0..5
  const pl = (k, um, varios) => `${k} ${k === 1 ? um : varios}`;
  const tipos = [
    () => { const a = r(1, 5 + D * 8), b = r(1, 5 + D * 8); return [`Your team scored ${pl(a, 'goal', 'goals')} in the first half and ${pl(b, 'goal', 'goals')} in the second. How many goals in total?`, a + b]; },
    () => { const t = r(20, 40 + D * 12), f = r(2, t - 2); return [`A practice lasts ${t} minutes. ${f} minutes have gone by. How many minutes are left?`, t - f]; },
    () => { const v = r(1, 4 + D * 2), e = r(0, 5); return [`A win is worth 3 points and a draw is worth 1. With ${pl(v, 'win', 'wins')} and ${pl(e, 'draw', 'draws')}, how many points?`, v * 3 + e]; },
    () => { const a = r(2, 5 + D), b = r(2, 9); return [`You did ${a} keepy-uppies a day for ${b} days. How many in total?`, a * b]; },
    () => { const k = r(2, 4 + Math.floor(D / 2)), q = r(2, 5 + D); return [`The coach split ${k * q} balls equally among ${k} groups. How many balls did each group get?`, q]; },
    () => { const g = r(2, 6), j = r(3, 8); return [`A striker scores on average ${g} goals every ${j} games. In ${j * 3} games, how many goals should he score?`, g * 3]; },
    () => { const a = r(10, 30 + D * 14), b = r(10, 30 + D * 14); return [`${a} fans came to the first game and ${b} to the second. What's the difference between the two games?`, Math.abs(a - b)]; },
    () => { const p = [10, 20, 25, 50][r(0, 3)], c = p === 25 ? r(1, 5) * 20 : r(1, 10) * 10; return [`A pair of cleats costs ${c} coins and is ${p}% off. How much do you pay?`, c - c * p / 100]; },
    () => { const lug = r(1, 5) * 20, p = [10, 25, 50, 75][r(0, 3)]; return [`The little pitch has ${lug} seats and ${p}% are taken. How many people are there?`, lug * p / 100]; },
  ];
  const lim = n < 5 ? 5 : n < 15 ? 7 : tipos.length; // a porcentagem (os 2 últimos) só a partir do nível 15
  const [q, resp] = tipos[r(0, lim - 1)]();
  const ops = new Set([resp]);
  while (ops.size < 4) { const d = resp + r(-Math.max(3, Math.round(resp * 0.3)), Math.max(3, Math.round(resp * 0.3))); if (d >= 0 && d !== resp) ops.add(d); }
  return [q, [String(resp), ...[...ops].filter(x => x !== resp).map(String)]];
}
let ultimasQuiz = [];
// Quiz sem espera longa (feedback: a criança perdia o interesse esperando 3-10 min).
// Errar = só 15 s para respirar. Para não subir de nível só no quiz, o XP vai caindo
// conforme a quantidade de acertos na última hora (100% → 50% → 25%). Acertos seguidos dão bônus.
const QUIZ_PAUSA_ERRO = 15000, QUIZ_HORA = 3600000, QUIZ_CHEIO = 15, QUIZ_MEIO = 30;
function quizMultXp(e) { return e.n < QUIZ_CHEIO ? 1 : e.n < QUIZ_MEIO ? 0.5 : 0.25; }
const QUIZ_QUEM = { futebol: { nome: 'Seu Juca', erro: 'Seu Juca scratched his head: "Missed it, huh? Take a breath and try the next one!"', cheio: 'Seu Juca laughed: "You already know a lot! You can keep going, but now it\'s worth less XP. How about a game outside?"' },
  mat: { nome: 'Teacher Lúcia', erro: 'Teacher Lúcia smiled: "Almost! Think it through calmly on the next one."', cheio: 'Teacher Lúcia smiled: "Excellent class! You can keep going, but now it\'s worth less XP. How about resting your brain?"' } };
function estadoQuiz(tipo) { const s = G.save; s.quizCd = s.quizCd || {}; const e = s.quizCd[tipo] = s.quizCd[tipo] || { ate: 0, certas: 0 };
  if (!e.hora || Date.now() - e.hora > QUIZ_HORA) { e.hora = Date.now(); e.n = 0; } if (e.ate > Date.now() + QUIZ_PAUSA_ERRO) e.ate = Date.now() + QUIZ_PAUSA_ERRO; return e; } // saves antigos com pausa de 10 min
function quizFalta(tipo) { return Math.max(0, estadoQuiz(tipo).ate - Date.now()); }
// v219: no máximo 1 casa depois da vírgula (os bônus em % davam 8.29999999999997)
const num1 = v => String(Math.round(v * 10) / 10);
function fmtFalta(ms) { const t = Math.ceil(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }
function pausaQuiz(tipo, ms) { const e = estadoQuiz(tipo); e.ate = Date.now() + ms; e.certas = 0; salvar(); }
function modalQuizPausa(tipo) {
  const quem = QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol; const txt = el('b', {}, fmtFalta(quizFalta(tipo)));
  const tm = setInterval(() => { const f = quizFalta(tipo); if (!document.body.contains(txt)) return clearInterval(tm); if (f <= 0) { clearInterval(tm); modalQuiz(tipo); return; } txt.textContent = fmtFalta(f); }, 500);
  abreModal(el('h2', {}, tipo === 'mat' ? 'Teacher Lúcia\'s class' : 'Seu Juca\'s quiz'), el('p', {}, `${quem.nome} is resting. Come back in `, txt, '.'),
    el('p', { class: 'vazio' }, `Take a deep breath... another question is coming soon!`), el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'OK')));
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
  { const e0 = estadoQuiz(tipo); e0.ate = Date.now() + QUIZ_PAUSA_ERRO; salvar(); } // já conta como erro se recarregar a página no meio da pergunta
  const barra = el('i'); barra.style.width = '100%';
  const grade = el('div', { class: 'quiz-op' });
  const fim = el('div', { class: 'opcoes' });
  const responder = (op, btn) => {
    if (resp) return; resp = true; clearInterval(tm);
    const ok = op === certa;
    grade.querySelectorAll('button').forEach(b => { b.disabled = true; if (b.textContent === certa) b.classList.add('certo'); });
    if (!ok && btn) btn.classList.add('errado');
    if (ok) {
      const e = estadoQuiz(tipo); const mult = quizMultXp(e) * (1 + Math.min(e.certas, 10) * 0.05);
      const xp = Math.max(1, Math.round((tipo === 'mat' ? 8 + s.nivel * 3 : 10 + s.nivel * 4) * stats().xpEstudo * mult));
      treinaSkill('visao', 30);
      if (tipo === 'mat') { s.st.prof++; contaEvento('prof'); } else { s.st.quiz++; contaEvento('quiz'); }
      ganhaXp(xp); som('moeda'); log(`Right answer! +${xp} XP and a bit of Game Vision.`, 'l-xp');
      e.ate = 0; e.certas++; e.n++;
      fim.prepend(el('p', {}, `✔ Right! +${xp} XP` + (e.certas >= 2 ? ` · ${e.certas} in a row 🔥` : '')));
      if (e.n === QUIZ_CHEIO || e.n === QUIZ_MEIO) fim.append(el('p', { class: 'dica' }, `${(QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol).cheio} (the next questions this hour give less XP)`));
    } else {
      som('erro'); fim.prepend(el('p', {}, `✘ ${op ? 'Wrong' : 'Time\'s up'}! The answer was: ${certa}`));
      pausaQuiz(tipo, QUIZ_PAUSA_ERRO); fim.append(el('p', {}, `${(QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol).erro} (${QUIZ_PAUSA_ERRO / 1000} s)`));
    }
    if (quizFalta(tipo) > 0) { // espera curta dentro da própria janela: o botão libera sozinho
      const prox = el('button', { class: 'btn amarelo', disabled: 'disabled', onclick: () => modalQuiz(tipo) }, `Next in ${Math.ceil(quizFalta(tipo) / 1000)} s`);
      const tp = setInterval(() => { if (!document.body.contains(prox)) return clearInterval(tp); const f = quizFalta(tipo); if (f <= 0) { clearInterval(tp); prox.disabled = false; prox.textContent = 'Next question'; } else prox.textContent = `Next in ${Math.ceil(f / 1000)} s`; }, 250);
      fim.append(prox, el('button', { class: 'btn', onclick: fechaModal }, 'Stop'));
    }
    else fim.append(el('button', { class: 'btn amarelo', onclick: () => modalQuiz(tipo) }, 'Next question'), el('button', { class: 'btn', onclick: fechaModal }, 'Stop'));
  };
  emb.forEach(op => { const b = el('button', { class: 'btn' }, op); b.onclick = () => responder(op, b); grade.append(b); });
  const tm = setInterval(() => { const k = 1 - (performance.now() - t0) / DUR; barra.style.width = clamp(k * 100, 0, 100) + '%'; if (k <= 0) responder(null, null); }, 100);
  window.pararQuiz = () => { clearInterval(tm); if (!resp) { resp = true; pausaQuiz(tipo, QUIZ_PAUSA_ERRO); log(`You left in the middle of a question. ${(QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol).nome} will be back in ${QUIZ_PAUSA_ERRO / 1000} s.`, 'l-sis'); } window.pararQuiz = null; };
  window.teclaModal = ev => { const n = '1234'.indexOf(ev.key); if (n >= 0 && !resp) grade.children[n].click(); };
  abreModal(el('h2', {}, tipo === 'mat' ? 'Teacher Lúcia\'s class' : 'Seu Juca\'s quiz'), el('div', { class: 'timer' }, barra), el('p', { style: 'font-size:18px' }, pergunta), grade, fim);
}

/* ---------------- minijogo: pênalti ---------------- */
// v407 (Raio-X T4): abrirPenalti saiu daqui — penalti.js declara a mesma função depois e só a de lá rodava.

/* ---------------- morte ---------------- */
function modalMorte(perda, m) {
  abreModal(el('h2', {}, 'You ran out of stamina!'), el('p', {}, `${m ? m.d.nome + ' wore you out. ' : ''}You got exhausted, left the game to rest and lost ${fmt(perda)} XP.`), el('p', {}, 'Tip: use Water (and later Breather) when your stamina is low, and avoid taking on several opponents at once.'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: () => { fechaModal(); renascer(); } }, 'Get up and keep going')));
  $('#modal .fechar').hidden = true;
}

/* ---------------- missões, álbum, ranking, ajuda ---------------- */
function modalMissoes() {
  const s = G.save; const lista = el('div', { class: 'lista' });
  const ordem = { pronta: 0, ativa: 1, disponivel: 2, nivel: 3, bloqueada: 4, feita: 5 };
  const qs = MISSOES.map(q => ({ q, st: statusMissao(q) })).filter(x => x.st !== 'bloqueada').sort((a, b) => ordem[a.st] - ordem[b.st]);
  for (const { q, st } of qs) {
    const [a, b] = progressoMissao(q);
    const rot = { pronta: '✔ Done! Talk to ' + NPCS[q.npc].nome, ativa: `In progress: ${a}/${b}`, disponivel: 'Available from ' + NPCS[q.npc].nome, nivel: `Available at level ${q.lvl} (${NPCS[q.npc].nome})`, feita: 'Completed' }[st];
    // v239: desistir de uma missão aceita (ela volta para quem deu; dá para pegar de novo depois)
    // v241: a confirmação aparece na própria linha (antes era a caixinha do navegador "www... diz")
    const desiste = (st === 'ativa' || st === 'pronta') ? el('button', { class: 'btn mini', type: 'button', title: 'Cancel this mission. It goes back to ' + NPCS[q.npc].nome + ' and you can accept it again whenever you want.', onclick: ev => {
      const bt = ev.currentTarget;
      const caixa = el('div', { class: 'desiste-conf' }, el('span', {}, a > 0 ? `Give up? You lose your progress (${a}/${b}).` : 'Give up this mission?'),
        el('button', { class: 'btn vermelho mini', type: 'button', onclick: () => {
          delete s.quests[q.id]; if (G.guiaPedido && G.guiaPedido.quest === q.id) G.guiaPedido = null;
          log(`You gave up the mission "${q.titulo}". ${NPCS[q.npc].nome} still has it if you want to do it later.`, 'l-info'); G.uiSujo = true; salvar(); modalMissoes();
        } }, 'Yes, give up'),
        el('button', { class: 'btn mini', type: 'button', onclick: () => caixa.replaceWith(bt) }, 'No'));
      bt.replaceWith(caixa);
    } }, 'Give up') : null;
    lista.append(el('div', { class: 'linha-item' + (st === 'feita' || st === 'nivel' ? ' bloq' : '') }, el('div', { class: 'nm' }, el('b', {}, q.titulo), el('small', {}, descMissao(q) + ' — ' + rot), st === 'ativa' ? el('div', { class: 'progresso' }, barraI(a / b)) : ''), desiste));
  }
  const feitas = MISSOES.filter(q => statusMissao(q) === 'feita').length;
  abreModal(el('h2', {}, 'Missions'), el('p', {}, `${feitas} of ${MISSOES.length} completed.`), lista);
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
  if (completo && !s.flags.album_premio) ops.append(el('button', { class: 'btn amarelo grande', onclick: () => { s.flags.album_premio = true; recebeItem('medalha_colecionador'); log('ALBUM COMPLETE! You won the Collector\'s Medal!', 'l-lvl'); banner('ALBUM COMPLETE!', 'Collector\'s Medal'); salvar(); modalAlbum(); } }, 'Claim the album prize!'));
  abreModal.largo = true;
  abreModal(el('h2', {}, `Sticker album (${n}/${FIGURINHAS.length})`), el('p', {}, /* v408.3 (ECA Digital): a banca vende a figurinha À VISTA */ 'Stickers rarely drop from opponents (bosses drop more), come as gifts in packs (challenges, Cup, daily reward), and at Seu Juca\'s newsstand you pick the one you want from the display case. Duplicates turn into 25 coins. Complete the album to win the Collector\'s Medal!'), ops, g);
}
async function modalRanking() {
  // Online: o top de todos os jogadores do site (GET /api/lenda/ranking).
  // Sem internet ou fora do site, cai no ranking deste aparelho.
  if (typeof PORTAL !== 'undefined' && PORTAL.ativo) {
    try {
      const r = await fetch(PORTAL.api + '/api/lenda/ranking');
      if (r.ok) {
        const on = await r.json(); const euId = PORTAL.user && PORTAL.user.id;
        const tabOn = el('table', { class: 'rank-tab' }, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Player'), el('th', {}, 'Level'), el('th', {}, 'Stage'), el('th', {}, 'Team'), el('th', {}, 'XP')));
        on.forEach((x, i) => tabOn.append(el('tr', { class: x.userId === euId ? 'eu' : '' }, el('td', {}, i + 1), el('td', {}, typeof linkPers === 'function' ? linkPers(x.apelido) : x.apelido), el('td', {}, x.nivel), el('td', {}, x.fase + (x.posicao && POSICOES[x.posicao] ? ' · ' + POSICOES[x.posicao].nome : '')), el('td', {}, x.time ? `${x.time.nome || 'Team'} (${nomeDivisao(x.time.div)})` :'—'), el('td', {}, fmt(x.xp)))));
        const avisoOn = PORTAL.token ? 'Ranking of all Educação Gamer players. Your progress goes in by itself while you play.' : 'Ranking of all Educação Gamer players. Log in to your account on the site to show up here.';
        // logado mas fora da lista: diz o que aconteceu com o último envio (e deixa mandar de novo)
        let estado = null;
        if (PORTAL.token && G.save && !on.some(x => x.userId === euId)) {
          const R = typeof RANK_ONLINE !== 'undefined' ? RANK_ONLINE : null;
          const txt = !R ? 'Your progress goes to the ranking within 1 minute of play.'
            : R.ok && R.revisao ? 'Your leaderboard spot is being reviewed by the site team (your game is still saved as usual). It\'ll be back very soon!' // v407 (Raio-X U7)
            : R.ok ? 'Your progress was sent! It can take up to 1 minute to show up here.'
            : R.status === 401 ? 'Your site session expired: log in to your Educação Gamer account again to show up in the ranking.'
            : `Couldn't join the ranking right now (${R.status ? 'erro ' + R.status : 'no connection'}${R.msg ? ': ' + R.msg : ''}).`;
          estado = el('div', { class: 'nuvem-caixa' }, el('span', {}, txt), el('button', { class: 'btn mini', type: 'button', onclick: () => { enviaRankingJa(); setTimeout(() => modalRanking(), 1500); } }, '🔄 Send now'));
        }
        abreModal(el('h2', {}, 'Leaderboard'), el('p', {}, avisoOn), ...(estado ? [estado] : []), on.length ? tabOn : el('p', {}, 'Nobody in the ranking yet. Be the first!'));
        if (!G.rodando) $('#modal').onclick = null;
        return;
      }
    } catch (e) { }
  }
  const lista = lerRanking(); const eu = G.save ? G.save.criado : null;
  const tab = el('table', { class: 'rank-tab' }, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Player'), el('th', {}, 'Level'), el('th', {}, 'Stage'), el('th', {}, 'Team'), el('th', {}, 'XP')));
  lista.forEach((r, i) => tab.append(el('tr', { class: r.id === eu ? 'eu' : '' }, el('td', {}, i + 1), el('td', {}, r.nome), el('td', {}, r.nivel), el('td', {}, r.fase + (r.posicao ? ' · ' + POSICOES[r.posicao].nome : '')), el('td', {}, r.time ? `${r.time.nome} (${nomeDivisao(r.time.div)})` : '—'), el('td', {}, fmt(r.xp)))));
  const aviso = 'This ranking shows the players created on this device (the online ranking didn\'t respond right now).';
  abreModal(el('h2', {}, 'Leaderboard'), el('p', {}, aviso), lista.length ? tab : el('p', {}, 'Nobody in the ranking yet. Be the first!'));
  if (!G.rodando) $('#modal').onclick = null;
}
function modalAjuda() {
  abreModal.largo = true;
  abreModal(el('h2', {}, 'How to Play'),
    el('p', {}, 'You start out in Campinho Village. Train, do missions, get past opponents, learn dribbles and grow: Kid → Youth → U-20 → Pro → Legend. At U-20 (level 25) you can found your own team!'),
    el('div', { class: 'ajuda-grid' },
      el('div', {}, el('span', { class: 'kbd' }, 'Arrows'), ' / ', el('span', { class: 'kbd' }, 'WASD'), ' walk (or click the map)'),
      el('div', {}, el('span', { class: 'kbd' }, 'E'), ' talk, open chest, read sign, penalty spot'),
      el('div', {}, el('span', { class: 'kbd' }, 'Click'), ' on an opponent targets them (red circle). You run to them and dribble by yourself.'),
      el('div', {}, el('span', { class: 'kbd' }, 'Space'), ' targets the nearest opponent'),
      el('div', {}, el('span', { class: 'kbd' }, '1'), '…', el('span', { class: 'kbd' }, '0'), ' dribbles and hotbar items'),
      el('div', {}, el('span', { class: 'kbd' }, 'X'), ' switches Dribble (up close) / Shot (from a distance) mode'), el('div', {}, el('span', { class: 'kbd' }, 'H'), ' shows ALL the shortcuts (Q, F, R, G, C, M...)'),
      el('div', {}, el('span', { class: 'kbd' }, 'Esc'), ' untargets / closes windows'), el('div', {}, el('span', { class: 'kbd' }, 'I'), ' opens the backpack'), el('div', {}, 'The YELLOW ARROW always points to the next goal. "!" above someone = new mission; "?" = mission ready to turn in.'),
      el('div', {}, 'Stamina = your life. Focus = energy for dribbles. Both come back over time.'),
    ),
    el('h3', {}, 'How to get good'),
    el('p', {}, '• Skills (Dribbling, Shooting, Marking, Vision) go up with USE: the more you dribble, the better you get. • Level goes up with XP: opponents, missions, challenges and quizzes. • Better equipment (cleats = attack) comes from shops, missions and bosses. • The Challenge Board gives repeatable bonuses. • Training dummies raise your skills with no risk.'), // v407 (Raio-X U4): sem a comparação com o Tibia no texto do jogador
    el('p', {}, 'The game saves by itself in your browser.'));
}

/* ---------------- tela inicial / criação ---------------- */
function telaInicial() {
  const save = lerSave();
  const bc = $('#btnContinuar');
  if (save) { bc.hidden = false; $('#resumoSave').textContent = `${save.nome} — level ${save.nivel} (${FASES[faseIdx(save.nivel)].nome})`; bc.onclick = () => iniciarJogo(save); }
  $('#btnNovo').onclick = async () => { if (save && !(await perguntaJogo(`Creating a new player will replace ${save.nome} (level ${save.nivel}). Continue?`, { sim: 'Create new', perigo: true }))) return; abrirCriacao(); };
  $('#btnVoltar').onclick = () => { $('#criacao').hidden = true; $('#inicioMenu').hidden = false; };
  { const bh = $('#btnHistoria'); if (bh) { if (typeof abreMenuCapitulos === 'function') bh.onclick = () => abreMenuCapitulos(); else if (typeof mostraHistoria === 'function') bh.onclick = () => mostraHistoria(null, () => { }); else bh.hidden = true; } }
  document.querySelectorAll('[data-abre]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.abre;
    if (k === 'ranking') modalRanking(); else if (k === 'ajuda') modalAjuda(); else if (!G.save) return;
    else if (k === 'missoes') modalMissoes(); else if (k === 'album') modalAlbum(); else if (k === 'time') abrirTime(); else if (k === 'mapa') modalMapa(); else if (k === 'carreira') { if (typeof abrirCarreira === 'function') abrirCarreira(); } else if (k === 'atalhos') modalAtalhos();
  }));
  // v324: antes o ✕ não fazia NADA com o fôlego em 0 (quem desmaiava e abria outra janela, como a Carreira, ficava preso nela).
  // Agora, desmaiado(a), fechar a janela também levanta o boneco — igual ao "Levantar e continuar" (a tela do desmaio continua sem ✕).
  $('#modal .fechar').onclick = () => fechaModalX();
  $('#modal').addEventListener('mousedown', ev => { if (ev.target.id === 'modal' && !$('#modal .fechar').hidden) fechaModalX(); }); // sem ✕ = não fecha clicando fora
}
function abrirCriacao() {
  $('#inicioMenu').hidden = true; $('#criacao').hidden = false;
  const d = { corpo: 'm', pele: 'pele-morena', cabelo: 'cabelo-cacheado', corCabelo: 'original', roupa: 'roupa-camiseta', baixo: 'baixo-shorts', rosto: null, classe: 'driblador' };
  // só o que o boneco mostra de verdade: cada gênero tem seus penteados; roupa e parte de baixo pelo que aparece
  const CAB_GEN = { m: ['cabelo-curto', 'cabelo-cacheado', 'cabelo-black-power', 'cabelo-moicano'], f: ['cabelo-rabo', 'cabelo-liso-longo', 'cabelo-coque', 'cabelo-cacheado', 'cabelo-black-power'] };
  const cabelosDe = g => CAB_GEN[g].map(id => AVATAR.cabelos.find(c => c.id === id)).filter(Boolean);
  const NOME_ROUPA = { 'roupa-camiseta': 'Purple', 'roupa-moletom': 'Blue', 'roupa-xadrez': 'Red', 'roupa-regata': 'White' };
  const baixosDe = g => [{ id: 'baixo-shorts', nome: 'Blue shorts', cor: '#5878a8' }, { id: 'baixo-moletom', nome: 'Gray shorts', cor: '#888898' }].concat(g === 'f' ? [{ id: 'baixo-saia', nome: 'Skirt (with bun)', cor: '#d84848' }] : []);
  const NOME_ROSTO = { null: 'No glasses', 'rosto-redondos': 'Glasses', 'rosto-escuros': 'Sunglasses' };
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
    chips('#opCorpo', [{ id: 'm', nome: 'Boy' }, { id: 'f', nome: 'Girl' }], 'corpo', o => o.nome);
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
    if (nome.length < 2) {
      $('#inpNome').focus(); $('#inpNome').style.borderColor = 'red';
      // v407 (Raio-X R2g): só a borda vermelha não explicava nada; agora diz o que falta, colado no campo do nome
      let av = document.getElementById('avisoNome');
      if (!av) { av = el('div', { id: 'avisoNome', role: 'alert', style: 'color:#d62828;font-weight:700;font-size:14px;margin:4px 0 2px' }); $('#inpNome').after(av); $('#inpNome').addEventListener('input', () => { av.textContent = ''; $('#inpNome').style.borderColor = ''; }); }
      av.textContent = nome.length ? '✏️ Your name needs at least 2 letters.' : '✏️ Type your name here to be born!';
      try { $('#inpNome').scrollIntoView({ block: 'center' }); } catch (e) { }
      return;
    }
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
    el('p', {}, c.desc), el('p', { class: 'cc-pass' }, c.passiva), el('p', { class: 'cc-esp' }, el('span', { class: 'kbd' }, teclaEspecial()), ` ${c.especial.nome}: ${c.especial.desc}`));
}
function modalEscolheClasse(obrigatorio) {
  const s = G.save; let esc = s.classe || 'driblador';
  const grade = el('div', { class: 'grade-classes' });
  const render = () => { grade.innerHTML = ''; Object.keys(CLASSES).forEach(id => grade.append(cartaClasse(id, id === esc, () => { esc = id; render(); }))); };
  render();
  abreModal.largo = true;
  abreModal(el('h2', {}, 'Choose your class'), el('p', {}, 'Each class is stronger in one stat and has a special skill (key ' + teclaEspecial() + '). You still spend points every level, so you can mix and match!'), grade,
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: () => {
      s.classe = esc; if (s.posicao) s.posicao = posicaoDaClasse(esc); const lv = s.nivel - 1; s.atr = Object.assign({}, CLASSES[esc].base); s.atr[CLASSES[esc].principal] += lv; s.pontos = lv * PONTOS_POR_NIVEL;
      log(`You're now a ${CLASSES[esc].nome}! ${s.pontos ? 'Press C to spend your points.' : ''}`, 'l-lvl'); banner(CLASSES[esc].nome.toUpperCase(), 'Class chosen'); som('nivel'); salvar(); fechaModal();
    } }, 'Confirm')));
  if (obrigatorio) $('#modal .fechar').hidden = true;
}
function abreFicha() {
  const s = G.save; const st = stats(); const cl = CLASSES[s.classe];
  const retr = mkCanvas(300, 400); retr.className = 'ficha-retrato'; pintaAparencia(retr, lookJogador(true), { inteiro: true });
  const linhas = el('div', { class: 'ficha-attrs' });
  for (const k of Object.keys(ATRIBUTOS)) {
    const a = ATRIBUTOS[k]; const v = s.atr[k];
    const maxA = Math.max(100, ...Object.keys(ATRIBUTOS).map(x => s.atr[x] || 0)); // v264: a barra acompanha o maior atributo (passava de 100 e ficava sempre cheia)
    const bar = el('div', { class: 'sk-bar' }); const i = el('i'); i.style.width = Math.min(100, v / maxA * 100) + '%'; i.style.background = a.cor; bar.append(i);
    const valB = el('b', {}, v + (st.atr[k] > v ? ` (+${num1(st.atr[k] - v)} 🍽️)` : ''));
    // v264: SEGURAR o "+" vai somando sozinho (e cada vez mais rápido); clique = +1, Shift+clique = +5
    const mais = el('button', { class: 'btn verde mini', type: 'button', disabled: s.pontos > 0 ? null : 'disabled', title: 'Click: +1 · Hold: keeps adding nonstop · Shift+click: +5' }, '+');
    const soma = n => { n = Math.min(s.pontos, n); if (n <= 0) return false; s.atr[k] += n; s.pontos -= n; G.uiSujo = true; valB.textContent = s.atr[k]; i.style.width = Math.min(100, s.atr[k] / Math.max(maxA, s.atr[k]) * 100) + '%'; const pt = document.getElementById('fichaPontos'); if (pt) pt.textContent = s.pontos ? `You have ${s.pontos} point(s) to spend!` : 'Done: all points spent.'; return true; };
    mais.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); if (soma(ev.shiftKey ? 5 : 1)) { som('equip'); abreFicha(); } } });
    mais.addEventListener('pointerdown', ev => {
      if (mais.disabled || (ev.button !== undefined && ev.button !== 0)) return; ev.preventDefault();
      const t0 = Date.now(); let tm = null, acabou = false;
      const fim = () => { if (acabou) return; acabou = true; clearTimeout(tm); window.removeEventListener('pointerup', fim); window.removeEventListener('pointercancel', fim); abreFicha(); };
      if (!soma(ev.shiftKey ? 5 : 1)) return; som('equip');
      const repete = () => { const seg = (Date.now() - t0) / 1000; if (!soma(seg > 3 ? 10 : seg > 1.5 ? 3 : 1)) return fim(); tm = setTimeout(repete, 70); };
      tm = setTimeout(repete, 380);
      window.addEventListener('pointerup', fim); window.addEventListener('pointercancel', fim);
    });
    // v264: ou DIGITA quantos pontos quer pôr e aperta Enter (ou "Pôr")
    const semPts = s.pontos > 0 ? null : 'disabled';
    const qtd = el('input', { type: 'number', class: 'ficha-qtd', min: '1', max: String(s.pontos || 0), step: '1', inputmode: 'numeric', placeholder: 'nº', title: 'Type how many points to put here and press Enter', disabled: semPts });
    const poe = () => { const n = Math.floor(Number(qtd.value)); if (!(n > 0)) { qtd.focus(); return; } if (soma(n)) { som('equip'); abreFicha(); } };
    qtd.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); ev.stopPropagation(); poe(); } });
    const btPoe = el('button', { class: 'btn amarelo mini', type: 'button', disabled: semPts, title: 'Add the typed points', onclick: poe }, 'Add');
    linhas.append(el('div', { class: 'ficha-linha' + (cl && cl.principal === k ? ' principal' : '') }, el('span', { class: 'fl-ic' }, a.icone), el('div', { class: 'fl-meio' }, el('div', { class: 'top' }, el('b', {}, a.nome), valB), bar, el('small', {}, a.desc)), el('div', { class: 'ficha-ctrl' }, qtd, btPoe, mais)));
  }
  const pct = v => Math.round(v * 100) + '%';
  const deriv = el('div', { class: 'sk-info' },
    el('span', {}, 'Max stamina'), el('b', {}, fmt(st.maxHp)), el('span', {}, 'Max focus'), el('b', {}, fmt(st.maxFoco)),
    el('span', {}, 'Total defense'), el('b', {}, Math.round(st.def)), el('span', {}, 'Extra damage'), el('b', {}, (st.danoMult >= 1 ? '+' : '') + pct(st.danoMult - 1)),
    el('span', {}, 'Critical'), el('b', {}, pct(st.crit)), el('span', {}, 'Block'), el('b', {}, pct(st.bloqueio)),
    el('span', {}, 'Speed'), el('b', {}, Math.round(st.vel) + (typeof tpsDeVel === 'function' ? ` (${String(Math.round(tpsDeVel(st.vel) * 10) / 10)} tiles/s)` : '')), el('span', {}, 'XP from missions/quizzes'), el('b', {}, '+' + pct(st.xpEstudo - 1)),
    el('span', {}, 'Recovery'), el('b', {}, `${st.regenHp.toFixed(1)} / ${st.regenFoco.toFixed(1)} por seg.`));
  abreModal.largo = true;
  abreModal(el('h2', {}, `${s.nome}'s Profile`),
    el('div', { class: 'ficha' },
      el('div', { class: 'ficha-esq' }, retr, el('b', { class: 'ficha-nome' }, s.nome), el('span', {}, `${FASES[faseIdx(s.nivel)].nome} · Level ${s.nivel}`), s.posicao ? el('span', {}, POSICOES[s.posicao].nome) : '',
        cl ? el('div', { class: 'ficha-classe', style: `--cor:${cl.cor}` }, el('b', {}, `${cl.emoji} ${cl.nome}`), el('small', {}, cl.passiva), el('small', {}, el('span', { class: 'kbd' }, teclaEspecial()), ` ${cl.especial.nome}: ${cl.especial.desc}`)) : el('button', { class: 'btn amarelo', onclick: () => modalEscolheClasse() }, 'Choose class')),
      el('div', { class: 'ficha-dir' },
        el('div', { class: 'ficha-pontos' + (s.pontos ? ' tem' : ''), id: 'fichaPontos' }, s.pontos ? `You have ${s.pontos} point(s) to spend!` : 'No free points. You get ' + PONTOS_POR_NIVEL + ' every level.'),
        linhas, el('h3', {}, 'What this changes'), deriv,
        el('p', { class: 'vazio' }, 'Want to reset everything? Talk to Seu Zé at the little pitch (it costs coins).'))));
}
// Seu Zé devolve os pontos de atributo gastos (a 1ª vez é grátis, depois o preço sobe com o nível)
// v256: até o nível 25 dá para trocar de classe com o Seu Zé (de graça): os pontos são redistribuídos e as magias
// da classe antiga saem (as da nova chegam conforme o nível)
const CLASSE_TROCA_ATE = 25;
function modalTrocaClasse() {
  const s = G.save; if (!s || !s.classe) return;
  if (s.nivel > CLASSE_TROCA_ATE) { log(`Changing class only works up to level ${CLASSE_TROCA_ATE}.`, 'l-sis'); return; }
  let esc = s.classe; const grade = el('div', { class: 'grade-classes' });
  const bt = el('button', { class: 'btn amarelo grande', type: 'button' }, 'Change class');
  const render = () => { grade.innerHTML = ''; Object.keys(CLASSES).forEach(id => grade.append(cartaClasse(id, id === esc, () => { esc = id; render(); }))); bt.disabled = esc === s.classe; bt.textContent = esc === s.classe ? 'Choose another class' : `Become ${CLASSES[esc].nome}`; };
  bt.onclick = () => {
    if (esc === s.classe) return; const velha = CLASSES[s.classe].nome;
    s.classe = esc; const lv = s.nivel - 1; s.atr = Object.assign({}, CLASSES[esc].base); s.atr[CLASSES[esc].principal] += lv; s.pontos = lv * PONTOS_POR_NIVEL;
    if (s.posicao) s.posicao = posicaoDaClasse(esc); // v257: a posição acompanha a classe
    s.dribles = s.dribles.filter(id => !(DRIBLES[id] && DRIBLES[id].classe && DRIBLES[id].classe !== esc));
    s.hotbar = s.hotbar.map(h => h && h.t === 'd' && !s.dribles.includes(h.id) ? null : h);
    if (typeof aprendeMagiasDaVocacao === 'function') aprendeMagiasDaVocacao();
    G.cds.classe = 0; const st = stats(); s.hp = Math.min(s.hp, st.maxHp); s.foco = Math.min(s.foco, st.maxFoco);
    log(`🎭 You changed class: from ${velha} to ${CLASSES[esc].nome}! ${s.pontos ? 'Press C to spend your points.' : ''}`, 'l-lvl'); banner(CLASSES[esc].nome.toUpperCase(), 'New class'); som('nivel');
    if (typeof atualizaRetrato === 'function') atualizaRetrato(); G.uiSujo = true; salvar(); fechaModal();
  };
  render(); abreModal.largo = true;
  abreModal(el('h2', {}, '🎭 Change class'), el('p', {}, `Up to level ${CLASSE_TROCA_ATE} you can change class here for free. Your stat points come back so you can spend them again, and the old class's spells leave the hotbar (the new class's ones arrive as you level up). Your position comes with it: The Wall plays Defender, Striker plays Forward, Playmaker and Engine play Midfield.`), grade,
    el('div', { class: 'opcoes' }, bt, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Not now')));
}
function custoRedistribuir() { const s = G.save; return s.flags && s.flags.redist_gratis ? 150 * s.nivel + 3 * s.nivel * s.nivel : 0; }
function redistribuiAtributos() {
  const s = G.save; const custo = custoRedistribuir(); const cl = CLASSES[s.classe]; if (!cl) return;
  const lv = s.nivel - 1; const gastos = lv * PONTOS_POR_NIVEL - (s.pontos || 0);
  const voltar = el('button', { class: 'btn', onclick: fechaModal }, 'Not now');
  if (gastos <= 0) return abreModal(el('h2', {}, 'Seu Zé'), el('p', {}, 'You haven\'t spent any stat points yet. Press C to spend them!'), el('div', { class: 'opcoes' }, voltar));
  const txtCusto = custo ? `${fmt(custo)} coins` : 'nothing (the first time is on the house!)';
  const falta = s.ouro < custo;
  const sim = el('button', { class: 'btn amarelo', disabled: falta ? 'disabled' : null, onclick: () => {
    if (s.ouro < custo) return;
    s.ouro -= custo; s.flags.redist_gratis = true;
    s.atr = Object.assign({}, cl.base); s.atr[cl.principal] += lv; s.pontos = lv * PONTOS_POR_NIVEL;
    som('moeda'); efeito('curaforte', G.p.x, G.p.y, '#ffd23f');
    log(`Seu Zé gave you back ${s.pontos} stat points! Spend them again in your Profile.`, 'l-lvl'); salvar(); G.uiSujo = true; fechaModal(); abreFicha();
  } }, falta ? `You need ${fmt(custo - s.ouro)} more coins` : 'Yes, give me my points back');
  abreModal(el('h2', {}, '🔄 Reset stats'),
    el('p', {}, `"Want to change how you play? I'll give you back the ${gastos} stat points you've already used, and you choose everything again."`),
    el('p', {}, 'Cost: ', el('b', {}, txtCusto)),
    el('p', { class: 'dica' }, 'Your level, skills and items stay the same. Only your stat points come back for you to spend.'),
    el('div', { class: 'opcoes' }, sim, voltar));
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
  abreModal(el('h2', {}, `Map — ${m.nome}`), el('p', {}, '🟣 You · 🟡 Goal (yellow arrow) and exits · 🔵 People · 🟠 Opponents'), c, el('h3', {}, 'Regions'), regioes);
}
function modalAtalhos() {
  const L = [
    ['W A S D / Arrows', 'Walk (two together = diagonal)'], ['Num 7 9 1 3', 'Walk diagonally (Num 8 2 4 6 = straight)'], ['Home PgUp End PgDn', 'Diagonals too'], ['Click the ground', 'Walk there'], ['Click an opponent', 'Target and dribble'], // v407 (Raio-X U4): sem a comparação com o Tibia no texto do jogador
    ['Space / Tab', 'Next opponent (follows the target mode)'], ['V', 'Target mode: nearest / strongest / weakest / lowest stamina'], ['Shift + Tab', 'Previous opponent'], ['Esc', 'Untarget / close window'],
    ['E', 'Talk, open chest, read sign, penalty'], ['1 … 0', 'Dribbles and hotbar items (top row)'], ['F1 … F10', 'Second hotbar row'], ['Shift', 'Class special skill'],
    ['F', 'Drink the best STAMINA drink'], ['R', 'Drink the best FOCUS drink'], ['G', 'Auto hunt (targets the next one by itself)'],
    ['X', 'Dribble / Shot mode'], ['C', 'Character profile and stats'], ['I', 'Backpack'], ['K', 'Skills'], ['L', 'Battle list'],
    ['M', 'Big map'], ['U', 'Career: contract, goals and meetings'], ['J', 'Missions'], ['B', 'Sticker album'], ['T', 'My Team'], ['H', 'This list'], ['Mouse wheel / + −', 'Zoom'],
  ];
  abreModal.largo = true;
  abreModal(el('h2', {}, 'Keyboard shortcuts'), el('div', { class: 'atalhos' }, ...L.map(([k, d]) => el('div', { class: 'atalho' }, el('span', { class: 'kbd' }, k), el('span', {}, d)))));
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
  if (it.atk) p.push(`Attack ${(it.atk * (1 + 0.12 * r)).toFixed(1).replace('.0', '')}`);
  if (it.def) p.push(`Defense ${(it.def * (1 + 0.12 * r)).toFixed(1).replace('.0', '')}`);
  for (const k in (it.st || {})) p.push(`+${(it.st[k] * (1 + 0.1 * r)).toFixed(1).replace('.0', '')} ${({ drible: 'drible', chute: 'chute', defesa: 'defesa', visao: 'vision', hp: 'stamina', foco: 'foco', vel: 'veloc.', regen: 'recup.' })[k]}`);
  return p.join(' · ') || 'no stats';
}
function modalRefino(npc, msg) {
  const s = G.save; const lista = el('div', { class: 'lista' });
  const itens = itensRefinaveis();
  if (!itens.length) lista.append(el('p', {}, 'You don\'t have any equipment to upgrade.'));
  for (const o of itens) {
    const ic = iconeClone(iconeItem(o.id));
    const linha = el('div', { class: 'linha-item' + (o.r >= REFINO_MAX ? ' bloq' : '') }, ic,
      el('div', { class: 'nm' }, el('b', {}, nomeItem(o.id, o.r) + (o.onde === 'equip' ? ' (equipped)' : '')), el('small', {}, statsItemTxt(o.id, o.r) + (o.r < REFINO_MAX ? '  →  ' + statsItemTxt(o.id, o.r + 1) : ''))));
    if (o.r >= REFINO_MAX) { linha.append(el('b', {}, 'MAX')); lista.append(linha); continue; }
    const c = custoRefino(o.id, o.r);
    const temMats = c.mats.every(([m, n]) => contaItem(m) >= n);
    const pode = s.ouro >= c.tostoes && temMats;
    linha.append(el('div', { class: 'refino-custo' }, precoTag(c.tostoes), ...c.mats.map(([m, n]) => el('small', { class: contaItem(m) >= n ? '' : 'falta' }, `${n}x ${ITENS[m].nome} (${contaItem(m)})`)), el('small', {}, `Chance: ${Math.round(c.chance * 100)}%`), c.cai ? el('small', { class: 'falta' }, `If it fails: goes back to +${o.r - 1}`) : null),
      el('button', { class: 'btn amarelo mini', disabled: pode ? null : 'disabled', onclick: () => refinar(o, npc) }, `Upgrade +${o.r + 1}`));
    lista.append(linha);
  }
  abreModal.largo = true;
  abreModal(el('h2', {}, 'Seu Remendo\'s Workshop'), msg ? el('p', { class: 'refino-msg' }, msg) : '',
    el('p', {}, 'Each upgrade makes the item stronger (+12% attack/defense and +10% to bonuses). Up to +4 is guaranteed; after that it can fail (+5: 85% · +6: 75% · +7: 62% · +8: 50% · +9: 40% · +10: 30%) — if it fails, the item does NOT break, you just spend the coins and materials. Items from level 20 and up: +5 and above need a RARE material from the region; +9 and +10 need arena TROPHIES; and failing at +8, +9 or +10 makes the item drop back 1 level.'),
    el('p', {}, 'Your coins: ', precoTag(s.ouro)), lista, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => abrirNPC(npc) }, 'Back')));
}
function refinar(o, npc) {
  const s = G.save; const c = custoRefino(o.id, o.r);
  if (s.ouro < c.tostoes || !c.mats.every(([m, n]) => contaItem(m) >= n)) return;
  let alvoM = o.onde === 'mochila' ? s.mochila[o.i] : null; // pega o item ANTES de gastar o material (a mochila anda quando uma pilha acaba)
  // v326: o item está numa pilha (equipamentos iguais sem refino empilham): o refino vale só para UM, que sai da pilha
  const separa = () => { if (alvoM && !alvoM.r && alvoM.q > 1) { alvoM.q--; alvoM = { id: alvoM.id, q: 1 }; s.mochila.push(alvoM); } };
  s.ouro -= c.tostoes; c.mats.forEach(([m, n]) => removeItem(m, n));
  let msg;
  if (Math.random() < c.chance) {
    const novo = o.r + 1;
    if (o.onde === 'equip') { s.equipR = s.equipR || {}; s.equipR[o.slot] = novo; } else if (alvoM) { separa(); alvoM.r = novo; }
    msg = `✨ SUCCESS! ${nomeItem(o.id, novo)} got stronger!`; som('nivel'); banner(nomeItem(o.id, novo), 'Upgrade successful!'); log(msg, 'l-lvl'); contaEvento('refino');
  } else if (c.cai) { // refino alto: falhou, o item volta 1 nível (nunca quebra)
    const volta = Math.max(0, o.r - 1);
    if (o.onde === 'equip') { s.equipR = s.equipR || {}; s.equipR[o.slot] = volta; } else if (alvoM) alvoM.r = volta;
    msg = `💥 It didn't work... and the item went back to ${nomeItem(o.id, volta)}. High upgrades are like that: risky!`; som('erro'); log(msg, 'l-dano');
  } else { msg = `💥 It didn't work this time... The item is still ${nomeItem(o.id, o.r)}. Try again!`; som('erro'); log(msg, 'l-dano'); }
  salvar(); G.uiSujo = true; atualizaRetrato(); modalRefino(npc, msg);
}

document.addEventListener('DOMContentLoaded', telaInicial);

/* v257: saves antigos — a posição passa a ser a da classe (quem era "Artilheiro de Zagueiro" vira Atacante). */
{
  const _iniPosClasse = iniciarJogo;
  iniciarJogo = async function (...a) {
    const r = await _iniPosClasse.apply(this, a);
    try {
      const s = G.save; if (s && s.classe && s.posicao) { const k = posicaoDaClasse(s.classe); if (k !== s.posicao) { const antes = (POSICOES[s.posicao] || {}).nome; s.posicao = k; const st = stats(); s.hp = Math.min(s.hp, st.maxHp); s.foco = Math.min(s.foco, st.maxFoco); salvar(); G.uiSujo = true; setTimeout(() => log(`⚽ Now your position comes with your class: ${CLASSES[s.classe].nome} plays ${POSICOES[k].nome} (before: ${antes}).`, 'l-info'), 2500); } }
    } catch (e) { }
    return r;
  };
}
