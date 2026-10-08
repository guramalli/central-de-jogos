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
  L.append(el('div', { class: cls, title: G.save ? `Dia ${G.save.dia || 1} do jogo` : '' }, h + ' ' + msg));
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
  $('#bHp').style.width = (s.hp / st.maxHp * 100) + '%'; $('#tHp').textContent = `Fôlego (HP) ${fmt(s.hp)} / ${fmt(st.maxHp)}`;
  $('#bFoco').style.width = (s.foco / st.maxFoco * 100) + '%'; $('#tFoco').textContent = `Foco (mana) ${fmt(s.foco)} / ${fmt(st.maxFoco)}`;
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
  $('#pNivel').textContent = 'Nível ' + s.nivel;
  $('#btnModo').textContent = 'X · ' + (G.modo === 'drible' ? 'Drible' : 'Chute');
  { const cl = CLASSES[s.classe]; $('#btnClasse').innerHTML = ''; $('#btnClasse').append(el('span', { class: 'tecla' }, '⇧'), cl ? `${cl.emoji} ${cl.especial.nome}` : 'Classe'); $('#btnClasse').title = cl ? cl.especial.desc : ''; }
  $('#btnCaca').textContent = 'G · Caça: ' + (G.caca ? 'ON' : 'off'); $('#btnCaca').classList.toggle('ligado', !!G.caca);
  $('#btnFicha').classList.toggle('tem-pontos', (s.pontos || 0) > 0); { const tx = (s.pontos || 0) > 0 ? `📋 Ficha +${s.pontos}` : '📋 Ficha'; if ($('#btnFicha').textContent !== tx) $('#btnFicha').textContent = tx; }
  // hotbar
  document.querySelectorAll('#hotbar .slot').forEach((b, i) => {
    const h = s.hotbar[i]; b.innerHTML = ''; b.append(el('span', { class: 'tecla' }, teclaSlot(i)));
    b.classList.remove('tj'); b.style.removeProperty('--tj');
    if (!h) { b.title = 'Vazio'; return; }
    if (h.t === 'd') { const dr = DRIBLES[h.id]; b.prepend(iconeClone(iconeDrible(h.id))); const tj = typeof tipoJogada === 'function' ? tipoJogada(dr) : null; if (tj) { b.classList.add('tj'); b.style.setProperty('--tj', tj.cor); b.append(el('span', { class: 'faixa-tj' }, (typeof TJ_FAIXA !== 'undefined' && TJ_FAIXA[tj.k]) || tj.rot)); } /* v267: faixa colorida com o tipo */ b.title = `${dr.nome} — ${dr.desc}${tj ? ' ' + textoJogada(dr) : ''} (nível ${dr.lvl}, ${dr.foco} de foco). Botão direito remove.`; }
    else { b.prepend(iconeClone(iconeItem(h.id))); b.append(el('span', { class: 'qtd' }, contaItem(h.id))); b.title = ITENS[h.id].nome + ' — botão direito remove.'; }
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
  const rot = { cabeca: 'Cabeça', acessorio: 'Pescoço', camisa: 'Camisa', calcao: 'Calção', perna: 'Caneleira', chuteira: 'Chuteira', costas: 'Mochila' };
  for (const slot of ['cabeca', 'camisa', 'acessorio', 'perna', 'calcao', 'chuteira', 'costas']) {
    const id = slot === 'costas' ? (s.costas && ITENS[s.costas.id] ? s.costas.id : null) : s.equip[slot]; const b = el('div', { class: 'eq-slot ' + (id ? 'cheio' : 'eq-vazio'), 'data-slot': slot, title: id ? `${ITENS[id].nome} — ${ITENS[id].desc} (clique para tirar)` : `${rot[slot]}: vazio. Arraste um item da Mochila para cá.` });
    if (id) b.append(iconeClone(iconeItem(id)));
    else if (typeof fantasmaSlot === 'function') b.append(fantasmaSlot(slot));
    const rq = (s.equipR || {})[slot]; if (id && rq) { b.append(el('span', { class: 'ref' }, '+' + rq)); b.title = nomeItem(id, rq) + ' — clique para tirar'; }
    b.append(el('span', { class: 'rot' }, rot[slot]));
    b.onclick = () => id && desequipar(slot);
    if (slot === 'costas') { b.title = id ? `${ITENS[id].nome} (${mochilaSlots()} espaços) — arraste outra mochila para cá para trocar` : 'Mochila'; b.onclick = () => { if (typeof abreAba === 'function') abreAba('mochila'); }; }
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
          b.title += ' — botão direito abre'; b.onclick = () => modalItem(it.id, 0); b.oncontextmenu = ev => { ev.preventDefault(); abreBolsa(it.u); };
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
      el('div', { class: 'bolsa-tit', draggable: u == null ? null : 'true', title: u == null ? '' : 'Arraste para mudar a ordem das janelas' },
        iconeClone(iconeItem(iconeId)), el('b', {}, nome), el('small', {}, `${n}/${espacos}`), ...botoes,
        el('button', { class: 'btn mini', type: 'button', title: mini ? 'Mostrar' : 'Minimizar', onclick: () => { const l = new Set(s.bolsasMin || []); l.has(chave) ? l.delete(chave) : l.add(chave); s.bolsasMin = [...l]; G.uiSujo = true; } }, mini ? '▢' : '–')));
    if (!mini) j.append(grade(u, espacos));
    return j;
  };
  { // a mochila das costas
    const c = s.costas && ITENS[s.costas.id] ? s.costas.id : null, n = s.mochila.filter(e => e.c == null).length;
    mo.append(janela(null, c || 'mochila_viagem', c ? ITENS[c].nome : 'Mochila', n, mochilaSlots(), [
      el('span', { class: 'mt-peso' + (peso > cap * 0.9 ? ' pesada' : ''), title: `Peso que você carrega (seu cap é ${fmt(cap)})` }, `⚖️ ${fmt(Math.round(peso))}`),
      typeof organizaMochila === 'function' ? el('button', { class: 'btn mini', type: 'button', title: 'Organizar a mochila (por tipo: bebidas, comidas, equipamentos, materiais...)', onclick: () => organizaMochila('funcao') }, '⇅') : '']));
  }
  for (const u of abertas) {
    const bag = s.mochila.find(e => e.u === u); const def = ITENS[bag.id]; const n = s.mochila.filter(e => e.c === u).length;
    mo.append(janela(u, bag.id, def.nome, n, def.espacos, [
      el('button', { class: 'btn mini', type: 'button', title: 'Voltar para a bolsa de fora', onclick: () => { if (typeof mtSobe === 'function') mtSobe(u); } }, '↑'),
      el('button', { class: 'btn mini', type: 'button', title: 'Fechar a bolsa', onclick: () => abreBolsa(u) }, '✕')]));
  }
  mo.append(el('div', { class: 'vazio' }, 'Botão direito: abre a mochila / usa ou equipa o item. Arraste itens para dentro das mochilas (entram na 1ª posição; Shift divide a pilha). Mochila cheia: o resto vai para a mochila que está dentro dela. Shift + clique descreve o item.'));
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
  sk.append(linha('Nível', fmt(s.nivel), pcN, `${pcN}% do nível — faltam ${fmt(bxp - s.xp)} XP para o nível ${s.nivel + 1}`, 0, 'xp'),
    linha('Experiência', fmt(s.xp), null, `Faltam ${fmt(bxp - s.xp)} XP para o nível ${s.nivel + 1}`, 0, 'sub'));
  for (const k of ['drible', 'chute', 'defesa', 'visao']) {
    const o = s.sk[k]; const bonus = st[k] - o.lv, pc = Math.min(99, Math.floor(o.t / precisaTentativas(k, o.lv) * 100));
    sk.append(linha(SKILLS[k].nome, String(o.lv), pc, `${SKILLS[k].desc} — ${pc}% para o ${o.lv + 1}` + (bonus ? `. ${o.lv} treinado + ${num1(bonus)} de bônus (equipamentos, comidas...) = ${num1(st[k])} no jogo` : ''), bonus));
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
      // v407 (Raio-X R2b): "Ok" parecia "feito" mas só escondia; agora diz o que faz (o passo avança quando você faz o que ele pede)
      else ops.append(el('button', { class: 'btn mini', title: 'Esconde a dica; o tutorial continua quando você fizer o que ela pede', onclick: () => { G.tutMin = s.tut; G.uiSujo = true; } }, 'Esconder dica'));
      ops.append(el('button', { class: 'btn mini', onclick: async () => { if (await perguntaJogo('Pular o tutorial? As dicas continuam aparecendo.', { sim: 'Pular' })) pularTutorial(); } }, 'Pular tutorial'));
      R.append(el('div', { class: 'cartao-tut' }, el('div', { class: 'tut-topo' }, el('b', {}, `Tutorial ${s.tut + 1}/${TUTORIAL.length}`), st.tecla ? el('span', { class: 'kbd' }, st.tecla) : ''), el('p', {}, st.txt), ops));
      if (st.destaque) document.querySelectorAll(st.destaque).forEach(e => e.classList.add('destaque'));
    }
  }
  if (s.tut >= TUTORIAL.length) {
    let n = 0;
    // v412 (dono: "opção de ticar a quest que você quer acompanhar"): as 📌 acompanhadas (missao_fixa.js) vêm primeiro,
    // e todas elas aparecem (até 3); sem nenhuma, fica como antes (as 2 primeiras ativas)
    const fix = typeof qfLista === 'function' ? qfLista() : [], qsFix = fix.map(id => qfMissao(id)).filter(Boolean);
    const lim = Math.max(2, qsFix.length);
    for (const q of qsFix.length ? qsFix.concat(MISSOES.filter(m => !fix.includes(m.id))) : MISSOES) {
      const e = s.quests[q.id]; if (!e || e.s !== 'ativa') continue; if (n++ >= lim) break;
      const fixa = fix.includes(q.id);
      const [a, b] = progressoMissao(q); const pronta = a >= b;
      // v238: diz com quem entregar e onde; clicar faz a seta amarela levar até a pessoa
      const nNpc = (NPCS[q.npc] || {}).nome || 'quem te deu', onde = typeof ondeFica === 'function' ? ondeFica(q.npc) : '';
      const leva = ev => { ev.stopPropagation(); G.guiaPedido = { npc: q.npc, quest: q.id, entregar: true }; G.guiaOn = true; G.uiSujo = true; log(`📍 A seta amarela agora leva até ${nNpc}${onde ? ` (${onde})` : ''}.`, 'l-xp'); if (typeof avisoTela === 'function') avisoTela(`📍 Siga a seta amarela até ${nNpc}`, 'l-xp'); };
      R.append(el('div', { class: 'rast rast-q' + (pronta ? ' pronta' : '') + (fixa ? ' fixa' : ''), title: `Clique e a seta amarela te leva até ${nNpc}`, onclick: leva }, fixa ? el('span', { class: 'rast-pin', title: 'Missão que você está acompanhando' }, '📌 ') : null, el('b', {}, q.titulo), el('br'), pronta ? `✔ Pronta! Entregue para ${nNpc}` : `${descMissao(q)}: ${a}/${b}`,
        el('div', { class: 'rast-onde' }, `📍 ${pronta ? '' : 'Entregar para: ' + nNpc + ' · '}${onde || 'veja no mapa'} · clique para ir`)));
    }
    if (s.tarefa) R.append(el('div', { class: 'rast' + (s.tarefa.p >= s.tarefa.n ? ' pronta' : '') }, el('b', {}, 'Desafio: '), `${MONSTROS[s.tarefa.m].nome} ${s.tarefa.p}/${s.tarefa.n}`));
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
  if (it.tipo !== 'equip') for (const k in (it.st || {})) info.push(`+${it.st[k]} ${({ drible: 'drible', chute: 'chute', defesa: 'defesa', visao: 'visão', hp: 'fôlego', foco: 'foco', vel: 'velocidade', regen: 'regeneração' })[k]}`);
  if (it.lvl) info.push(`Nível ${it.lvl}`);
  const ops = el('div', { class: 'opcoes' });
  if (it.tipo === 'equip') ops.append(el('button', { class: 'btn amarelo', onclick: () => { equipar(id, r); fechaModal(); } }, 'Equipar'));
  if (it.tipo === 'comida') ops.append(el('button', { class: 'btn amarelo', onclick: () => { usarItem(id); fechaModal(); } }, 'Comer'), el('button', { class: 'btn', onclick: () => { poeNaHotbar('i', id); fechaModal(); } }, 'Pôr na barra de atalhos'));
  if (it.tipo === 'consumivel') {
    ops.append(el('button', { class: 'btn amarelo', onclick: () => { usarItem(id); fechaModal(); } }, 'Usar'));
    ops.append(el('button', { class: 'btn', onclick: () => { poeNaHotbar('i', id); fechaModal(); } }, 'Pôr na barra de atalhos'));
  }
  if (it.tipo !== 'chave') ops.append(el('button', { class: 'btn', onclick: async () => { if (await perguntaJogo(`Jogar fora ${it.nome}?`, { sim: 'Jogar fora', perigo: true })) { if (it.tipo === 'equip') removeEquipR(id, r); else removeItem(id, n); fechaModal(); } } }, 'Jogar fora'));
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
      if (ativa.id === 'q_peneira') ops.append(el('button', { class: 'btn amarelo', onclick: modalPosicao }, 'Fazer a peneira'));
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
  // v227: sem o botão "Dribles que ensino": os dribles chegam sozinhos pelo nível (dribles_nivel.js)
  if (d.quiz) ops.append(el('button', { class: 'btn roxo', onclick: () => modalQuiz('futebol') }, quizFalta('futebol') > 0 ? `Quiz de futebol (volta em ${fmtFalta(quizFalta('futebol'))})` : 'Quiz de futebol'));
  if (d.prof) ops.append(el('button', { class: 'btn roxo', onclick: () => modalQuiz('mat') }, quizFalta('mat') > 0 ? `Aula de matemática (volta em ${fmtFalta(quizFalta('mat'))})` : 'Aula de matemática'));
  if (d.copa && typeof abrirCopaSonhos === 'function') ops.append(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); abrirCopaSonhos(); } }, 'Copa dos Sonhos'));
  if (d.cura) ops.append(el('button', { class: 'btn', onclick: () => { const st = stats(); s.hp = st.maxHp; s.foco = st.maxFoco; efeito('curaforte', G.p.x, G.p.y, '#5affb0'); som('cura'); log(`${d.nome} cuidou de você. Fôlego e foco cheios!`, 'l-npc'); fechaModal(); } }, 'Descansar (recupera tudo)'));
  if (d.refino) ops.append(el('button', { class: 'btn amarelo', onclick: () => modalRefino(npc) }, 'Refinar equipamentos'));
  if (d.aviao && typeof modalVoo === 'function') ops.append(el('button', { class: 'btn amarelo', onclick: () => modalVoo(npc) }, '✈️ Voar'));
  if (d.empresario && typeof abrirCarreira === 'function' && s.nivel >= 25) ops.append(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); abrirCarreira(); } }, 'Minha carreira'));
  if (d.onibus) ops.append(el('button', { class: 'btn', onclick: modalOnibus }, 'Viajar de ônibus'));
  if (d.empresario) ops.append(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); abrirTime(); } }, s.time ? 'Gerenciar meu time' : 'Fundar meu time'));
  /* v257: não existe mais 'Trocar de posição' — a posição vem da classe (troque a classe até o nível 25) */
  if (d.posicao && s.classe && s.nivel <= CLASSE_TROCA_ATE) ops.append(el('button', { class: 'btn', onclick: modalTrocaClasse }, `🎭 Trocar de classe (grátis até o nível ${CLASSE_TROCA_ATE})`)); // v256
  if (d.posicao && s.classe && s.nivel >= 2) ops.append(el('button', { class: 'btn amarelo', onclick: redistribuiAtributos }, `🔄 Redistribuir pontos de atributo (${custoRedistribuir() ? fmt(custoRedistribuir()) + ' tostões' : 'grátis na 1ª vez'})`));
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
// v257: a POSIÇÃO vem da CLASSE (antes eram duas escolhas separadas e confundia): Paredão = Zagueiro,
// Artilheiro = Atacante, Cérebro e Motorzinho = Meio-campo. A peneira só confirma a posição da sua classe.
const POSICAO_DA_CLASSE = { paredao: 'zagueiro', driblador: 'atacante', cerebro: 'meia', motorzinho: 'meia' };
function posicaoDaClasse(cl) { return POSICAO_DA_CLASSE[cl] || 'meia'; }
function modalPosicao() {
  const s = G.save; const cl = CLASSES[s.classe]; const k = posicaoDaClasse(s.classe), p = POSICOES[k];
  abreModal(el('h2', {}, '⚽ A peneira'),
    el('p', {}, `O Seu Zé olhou você jogar e já sabe: ${cl ? `${cl.emoji} ${cl.nome} joga de` : 'você joga de'} ${p.nome.toUpperCase()}!`),
    el('div', { class: 'card-pos', style: `border-color:${p.cor};max-width:320px;margin:0 auto` }, el('h4', {}, p.nome), el('p', {}, p.desc), el('p', {}, `+${p.hp} fôlego e +${p.foco} foco por nível`)),
    el('p', { class: 'dica' }, `A posição vem junto com a classe. Até o nível ${typeof CLASSE_TROCA_ATE !== 'undefined' ? CLASSE_TROCA_ATE : 25}, se trocar de classe aqui com o Seu Zé, a posição troca junto.`),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => {
      s.posicao = k; s.flags.escolheu_posicao = true; const st = stats(); s.hp = st.maxHp; s.foco = st.maxFoco;
      log(`Peneira aprovada: você é ${p.nome}!`, 'l-lvl'); banner(p.nome.toUpperCase(), 'Aprovado na peneira'); som('nivel'); salvar(); fechaModal();
    } }, 'Bora jogar!')));
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
      const qtd = el('input', { type: 'number', min: 1, max: 1000, value: 1 }); // v391 (dono: "tentei comprar 200 bolinhos de alga, o máximo é 100"): até 1.000 de uma vez
      const bloq = it.lvl && s.nivel < it.lvl;
      lista.append(el('div', { class: 'linha-item' + (bloq ? ' bloq' : '') }, iconeClone(iconeItem(id)),
        el('div', { class: 'nm' }, el('b', {}, it.nome), el('small', {}, it.desc + (it.lvl > 1 ? ` (nível ${it.lvl})` : ''))),
        precoTag(it.preco), empilha(id) ? qtd : '',
        el('button', { class: 'btn verde mini', onclick: () => {
          const q = empilha(id) ? clamp(parseInt(qtd.value) || 1, 1, 1000) : 1; const total = q * it.preco;
          if (s.ouro < total) { const da = Math.floor(s.ouro / it.preco); log(da > 0 ? `Tostões insuficientes! Dá para comprar até ${da}x ${it.nome}.` : 'Tostões insuficientes!', 'l-dano'); som('erro'); return; }
          { const pe = typeof pesoItem === 'function' ? pesoItem(id) : 0; if (pe > 0 && q > 1 && pesoMochila(s) + pe * q > capPeso(s)) { const cabe = Math.max(0, Math.floor((capPeso(s) - pesoMochila(s)) / pe)); log(cabe > 0 ? `Pesado demais para levar ${q} de uma vez: cabem ${cabe}x ${it.nome} na sua carga.` : 'Sua carga está cheia!', 'l-dano'); som('erro'); return; } }
          if (addItem(id, q)) { s.ouro -= total; log(`Você comprou ${q}x ${it.nome} por ${fmt(total)} tostões.`, 'l-loot'); som('moeda'); modalLoja(npc, 'comprar'); }
        } }, 'Comprar')));
    }
  } else {
    const vendaveis = s.mochila.map((m, i) => ({ ...m, i })).filter(m => ITENS[m.id].venda);
    if (!vendaveis.length) lista.append(el('p', {}, 'Você não tem nada para vender.'));
    const vistos = new Set();
    // v326: etiqueta de raridade em cada linha, forjado com destaque laranja, e confirmação para o que é valioso
    const rarDe = id => (typeof raridadeItem === 'function' ? raridadeItem(id) : 'comum');
    const rarTag = id => { const r = rarDe(id); return el('span', { class: 'tag-rar rar-' + r }, String((RARIDADE[r] || { nome: r }).nome).toUpperCase()); };
    const valioso = id => ['epico', 'lendario', 'mitico'].includes(rarDe(id)) || !!(ITENS[id] && (ITENS[id].mitico || ITENS[id].lenda));
    const comDica = (row, id, r) => { if (typeof comTip === 'function' && typeof tipItem === 'function') comTip(row, () => tipItem(id, r || 0)); return row; };
    for (const m of vendaveis) {
      const chave = m.id + '|' + (m.r || 0); if (vistos.has(chave)) continue; vistos.add(chave);
      if (m.r) { const itR = ITENS[m.id]; const v = Math.round(itR.venda * (1 + 0.5 * m.r)); lista.append(comDica(el('div', { class: 'linha-item venda-forjado' }, iconeClone(iconeItem(m.id)), el('div', { class: 'nm' }, el('b', { class: 'txt-' + rarDe(m.id) }, nomeItem(m.id, m.r)), el('span', { class: 'venda-tags' }, rarTag(m.id), el('span', { class: 'tag-forjado' }, `⚒️ FORJADO +${m.r}`))), precoTag(v), el('button', { class: 'btn mini vermelho', onclick: async () => { if (!(await perguntaJogo(`⚠️ ${nomeItem(m.id, m.r)} está FORJADO (+${m.r}). O refino se perde se você vender. Vender mesmo assim?`, { sim: 'Vender', perigo: true }))) return; removeEquipR(m.id, m.r); s.ouro += v; som('moeda'); modalLoja(npc, 'vender'); } }, 'Vender')), m.id, m.r)); continue; }
      const it = ITENS[m.id]; const n = s.mochila.filter(x => x.id === m.id && !x.r).reduce((a, x) => a + x.q, 0);
      const confirma = async q => !valioso(m.id) || await perguntaJogo(`${it.nome} é ${String((RARIDADE[rarDe(m.id)] || { nome: rarDe(m.id) }).nome).toUpperCase()}. Vender ${q > 1 ? q + ' unidades' : '1 unidade'} por ${fmt(it.venda * q)} tostões?`, { sim: 'Vender', perigo: true });
      lista.append(comDica(el('div', { class: 'linha-item' + (valioso(m.id) ? ' venda-valioso' : '') }, iconeClone(iconeItem(m.id)), el('div', { class: 'nm' }, el('b', { class: 'txt-' + rarDe(m.id) }, it.nome), el('span', { class: 'venda-tags' }, rarTag(m.id), el('small', {}, `Você tem ${n}`))), precoTag(it.venda),
        el('button', { class: 'btn mini', onclick: async () => { if (!(await confirma(1))) return; removeItem(m.id, 1); s.ouro += it.venda; som('moeda'); modalLoja(npc, 'vender'); } }, 'Vender 1'),
        n > 1 ? el('button', { class: 'btn mini', onclick: async () => { if (!(await confirma(n))) return; removeItem(m.id, n); s.ouro += it.venda * n; som('moeda'); log(`Vendeu ${n}x ${it.nome} por ${fmt(it.venda * n)} tostões.`, 'l-loot'); modalLoja(npc, 'vender'); } }, `Todos (${fmt(it.venda * n)})`) : ''), m.id, 0));
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
      pronta ? el('button', { class: 'btn amarelo', onclick: () => { s.ouro += ouro; recebeItem('pacotinho', 1); s.tarefa = null; log(`Desafio concluído! +${fmt(ouro)} tostões.`, 'l-loot'); ganhaXp(xp); salvar(); modalQuadro(); } }, 'Resgatar!') :
        el('button', { class: 'btn mini', onclick: async () => { if (await perguntaJogo('Desistir do desafio atual?', { sim: 'Desistir', perigo: true })) { s.tarefa = null; modalQuadro(); } } }, 'Desistir')));
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
  /* v407 (Raio-X R8): a aula saía com "287 gols no primeiro tempo", "940 minutos", "1 gols" e desconto em % já no nível 6.
     Agora os números ficam na faixa da escola (até ~100, divisões e porcentagens exatas), a dificuldade sobe com as
     respostas certas (s.st.prof) e não com o nível do boneco, e porcentagem só a partir do nível 15. */
  const n = G.save.nivel; const r = (a, b) => rndi(a, b);
  const D = Math.min(5, Math.floor(((G.save.st && G.save.st.prof) || 0) / 8) + (n >= 15 ? 1 : 0) + (n >= 40 ? 1 : 0)); // 0..5
  const pl = (k, um, varios) => `${k} ${k === 1 ? um : varios}`;
  const tipos = [
    () => { const a = r(1, 5 + D * 8), b = r(1, 5 + D * 8); return [`Seu time fez ${pl(a, 'gol', 'gols')} no primeiro tempo e ${pl(b, 'gol', 'gols')} no segundo. Quantos gols no total?`, a + b]; },
    () => { const t = r(20, 40 + D * 12), f = r(2, t - 2); return [`Um treino tem ${t} minutos. Já se passaram ${f} minutos. Quantos minutos faltam?`, t - f]; },
    () => { const v = r(1, 4 + D * 2), e = r(0, 5); return [`Vitória vale 3 pontos e empate vale 1. Com ${pl(v, 'vitória', 'vitórias')} e ${pl(e, 'empate', 'empates')}, quantos pontos?`, v * 3 + e]; },
    () => { const a = r(2, 5 + D), b = r(2, 9); return [`Você fez ${a} embaixadinhas por dia durante ${b} dias. Quantas no total?`, a * b]; },
    () => { const k = r(2, 4 + Math.floor(D / 2)), q = r(2, 5 + D); return [`O treinador dividiu ${k * q} bolas igualmente entre ${k} grupos. Quantas bolas cada grupo recebeu?`, q]; },
    () => { const g = r(2, 6), j = r(3, 8); return [`Um atacante faz em média ${g} gols a cada ${j} jogos. Em ${j * 3} jogos, quantos gols ele deve fazer?`, g * 3]; },
    () => { const a = r(10, 30 + D * 14), b = r(10, 30 + D * 14); return [`No primeiro jogo vieram ${a} torcedores e no segundo ${b}. Qual a diferença entre os dois jogos?`, Math.abs(a - b)]; },
    () => { const p = [10, 20, 25, 50][r(0, 3)], c = p === 25 ? r(1, 5) * 20 : r(1, 10) * 10; return [`Uma chuteira custa ${c} tostões e está com ${p}% de desconto. Quanto você paga?`, c - c * p / 100]; },
    () => { const lug = r(1, 5) * 20, p = [10, 25, 50, 75][r(0, 3)]; return [`O campinho tem ${lug} lugares e ${p}% estão ocupados. Quantas pessoas estão lá?`, lug * p / 100]; },
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
const QUIZ_QUEM = { futebol: { nome: 'Seu Juca', erro: 'O Seu Juca coçou a cabeça: "Errou, hein? Respira e tenta a próxima!"', cheio: 'O Seu Juca riu: "Você já sabe muita coisa! Pode continuar, mas agora vale menos XP. Que tal um jogo lá fora?"' },
  mat: { nome: 'Professora Lúcia', erro: 'A Professora Lúcia sorriu: "Quase! Pense com calma na próxima."', cheio: 'A Professora Lúcia sorriu: "Excelente aula! Pode continuar, mas agora vale menos XP. Que tal descansar a cabeça?"' } };
function estadoQuiz(tipo) { const s = G.save; s.quizCd = s.quizCd || {}; const e = s.quizCd[tipo] = s.quizCd[tipo] || { ate: 0, certas: 0 };
  if (!e.hora || Date.now() - e.hora > QUIZ_HORA) { e.hora = Date.now(); e.n = 0; } if (e.ate > Date.now() + QUIZ_PAUSA_ERRO) e.ate = Date.now() + QUIZ_PAUSA_ERRO; return e; } // saves antigos com pausa de 10 min
function quizFalta(tipo) { return Math.max(0, estadoQuiz(tipo).ate - Date.now()); }
// v219: no máximo 1 casa depois da vírgula (os bônus em % davam 8.29999999999997)
const num1 = v => String(Math.round(v * 10) / 10).replace('.', ',');
function fmtFalta(ms) { const t = Math.ceil(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }
function pausaQuiz(tipo, ms) { const e = estadoQuiz(tipo); e.ate = Date.now() + ms; e.certas = 0; salvar(); }
function modalQuizPausa(tipo) {
  const quem = QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol; const txt = el('b', {}, fmtFalta(quizFalta(tipo)));
  const tm = setInterval(() => { const f = quizFalta(tipo); if (!document.body.contains(txt)) return clearInterval(tm); if (f <= 0) { clearInterval(tm); modalQuiz(tipo); return; } txt.textContent = fmtFalta(f); }, 500);
  abreModal(el('h2', {}, tipo === 'mat' ? 'Aula da Professora Lúcia' : 'Quiz do Seu Juca'), el('p', {}, `${quem.nome} está descansando. Volte em `, txt, '.'),
    el('p', { class: 'vazio' }, `Respire fundo... já já tem outra pergunta!`), el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'Ok')));
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
      ganhaXp(xp); som('moeda'); log(`Resposta certa! +${xp} XP e um pouco de Visão de Jogo.`, 'l-xp');
      e.ate = 0; e.certas++; e.n++;
      fim.prepend(el('p', {}, `✔ Certa! +${xp} XP` + (e.certas >= 2 ? ` · ${e.certas} seguidas 🔥` : '')));
      if (e.n === QUIZ_CHEIO || e.n === QUIZ_MEIO) fim.append(el('p', { class: 'dica' }, `${(QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol).cheio} (as próximas perguntas desta hora dão menos XP)`));
    } else {
      som('erro'); fim.prepend(el('p', {}, `✘ ${op ? 'Errou' : 'Tempo esgotado'}! A resposta era: ${certa}`));
      pausaQuiz(tipo, QUIZ_PAUSA_ERRO); fim.append(el('p', {}, `${(QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol).erro} (${QUIZ_PAUSA_ERRO / 1000} s)`));
    }
    if (quizFalta(tipo) > 0) { // espera curta dentro da própria janela: o botão libera sozinho
      const prox = el('button', { class: 'btn amarelo', disabled: 'disabled', onclick: () => modalQuiz(tipo) }, `Próxima em ${Math.ceil(quizFalta(tipo) / 1000)} s`);
      const tp = setInterval(() => { if (!document.body.contains(prox)) return clearInterval(tp); const f = quizFalta(tipo); if (f <= 0) { clearInterval(tp); prox.disabled = false; prox.textContent = 'Próxima pergunta'; } else prox.textContent = `Próxima em ${Math.ceil(f / 1000)} s`; }, 250);
      fim.append(prox, el('button', { class: 'btn', onclick: fechaModal }, 'Parar'));
    }
    else fim.append(el('button', { class: 'btn amarelo', onclick: () => modalQuiz(tipo) }, 'Próxima pergunta'), el('button', { class: 'btn', onclick: fechaModal }, 'Parar'));
  };
  emb.forEach(op => { const b = el('button', { class: 'btn' }, op); b.onclick = () => responder(op, b); grade.append(b); });
  const tm = setInterval(() => { const k = 1 - (performance.now() - t0) / DUR; barra.style.width = clamp(k * 100, 0, 100) + '%'; if (k <= 0) responder(null, null); }, 100);
  window.pararQuiz = () => { clearInterval(tm); if (!resp) { resp = true; pausaQuiz(tipo, QUIZ_PAUSA_ERRO); log(`Você saiu no meio da pergunta. ${(QUIZ_QUEM[tipo] || QUIZ_QUEM.futebol).nome} volta em ${QUIZ_PAUSA_ERRO / 1000} s.`, 'l-sis'); } window.pararQuiz = null; };
  window.teclaModal = ev => { const n = '1234'.indexOf(ev.key); if (n >= 0 && !resp) grade.children[n].click(); };
  abreModal(el('h2', {}, tipo === 'mat' ? 'Aula da Professora Lúcia' : 'Quiz do Seu Juca'), el('div', { class: 'timer' }, barra), el('p', { style: 'font-size:18px' }, pergunta), grade, fim);
}

/* ---------------- minijogo: pênalti ---------------- */
// v407 (Raio-X T4): abrirPenalti saiu daqui — penalti.js declara a mesma função depois e só a de lá rodava.

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
    // v239: desistir de uma missão aceita (ela volta para quem deu; dá para pegar de novo depois)
    // v241: a confirmação aparece na própria linha (antes era a caixinha do navegador "www... diz")
    const desiste = (st === 'ativa' || st === 'pronta') ? el('button', { class: 'btn mini', type: 'button', title: 'Cancelar esta missão. Ela volta para ' + NPCS[q.npc].nome + ' e você pode aceitar de novo quando quiser.', onclick: ev => {
      const bt = ev.currentTarget;
      const caixa = el('div', { class: 'desiste-conf' }, el('span', {}, a > 0 ? `Desistir? Você perde o progresso (${a}/${b}).` : 'Desistir desta missão?'),
        el('button', { class: 'btn vermelho mini', type: 'button', onclick: () => {
          delete s.quests[q.id]; if (G.guiaPedido && G.guiaPedido.quest === q.id) G.guiaPedido = null;
          log(`Você desistiu da missão "${q.titulo}". Ela continua com ${NPCS[q.npc].nome} se quiser fazer depois.`, 'l-info'); G.uiSujo = true; salvar(); modalMissoes();
        } }, 'Sim, desistir'),
        el('button', { class: 'btn mini', type: 'button', onclick: () => caixa.replaceWith(bt) }, 'Não'));
      bt.replaceWith(caixa);
    } }, 'Desistir') : null;
    lista.append(el('div', { class: 'linha-item' + (st === 'feita' || st === 'nivel' ? ' bloq' : ''), 'data-qid': q.id }, el('div', { class: 'nm' }, el('b', {}, q.titulo), el('small', {}, descMissao(q) + ' — ' + rot), st === 'ativa' ? el('div', { class: 'progresso' }, barraI(a / b)) : ''), desiste));
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
  if (completo && !s.flags.album_premio) ops.append(el('button', { class: 'btn amarelo grande', onclick: () => { s.flags.album_premio = true; recebeItem('medalha_colecionador'); log('ÁLBUM COMPLETO! Você ganhou a Medalha do Colecionador!', 'l-lvl'); banner('ÁLBUM COMPLETO!', 'Medalha do Colecionador'); salvar(); modalAlbum(); } }, 'Resgatar prêmio do álbum!'));
  abreModal.largo = true;
  abreModal(el('h2', {}, `Álbum de figurinhas (${n}/${FIGURINHAS.length})`), el('p', {}, /* v408.3 (ECA Digital): a banca vende a figurinha À VISTA */ 'Figurinhas caem raramente dos adversários (chefões dão mais), vêm de presente em pacotinhos (desafios, Copa, recompensa do dia) e na banca do Seu Juca você escolhe a que quer na vitrine. Repetidas viram 25 tostões. Complete o álbum para ganhar a Medalha do Colecionador!'), ops, g);
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
        on.forEach((x, i) => tabOn.append(el('tr', { class: x.userId === euId ? 'eu' : '' }, el('td', {}, i + 1), el('td', {}, typeof linkPers === 'function' ? linkPers(x.apelido) : x.apelido), el('td', {}, x.nivel), el('td', {}, x.fase + (x.posicao && POSICOES[x.posicao] ? ' · ' + POSICOES[x.posicao].nome : '')), el('td', {}, x.time ? `${x.time.nome || 'Time'} (${nomeDivisao(x.time.div)})` :'—'), el('td', {}, fmt(x.xp)))));
        const avisoOn = PORTAL.token ? 'Ranking de todos os jogadores do Educação Gamer. Seu progresso entra sozinho enquanto você joga.' : 'Ranking de todos os jogadores do Educação Gamer. Entre na sua conta do site para aparecer aqui.';
        // logado mas fora da lista: diz o que aconteceu com o último envio (e deixa mandar de novo)
        let estado = null;
        if (PORTAL.token && G.save && !on.some(x => x.userId === euId)) {
          const R = typeof RANK_ONLINE !== 'undefined' ? RANK_ONLINE : null;
          const txt = !R ? 'Seu progresso vai para o ranking em até 1 minuto de jogo.'
            : R.ok && R.revisao ? 'Seu lugar no ranking está em revisão pela equipe do site (seu jogo continua salvo normalmente). Logo, logo ele volta!' // v407 (Raio-X U7)
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
    el('p', {}, '• Habilidades (Drible, Chute, Defesa, Visão) sobem com USO: quanto mais você dribla, melhor fica. • Nível sobe com XP: adversários, missões, desafios e quiz. • Equipamentos melhores (chuteira = ataque) vêm das lojas, missões e chefões. • O Quadro de Desafios dá bônus repetíveis. • Os bonecos de treino sobem habilidade sem risco.'), // v407 (Raio-X U4): sem a comparação com o Tibia no texto do jogador
    el('p', {}, 'O jogo salva sozinho no seu navegador.'));
}

/* ---------------- tela inicial / criação ---------------- */
function telaInicial() {
  const save = lerSave();
  const bc = $('#btnContinuar');
  if (save) { bc.hidden = false; $('#resumoSave').textContent = `${save.nome} — nível ${save.nivel} (${FASES[faseIdx(save.nivel)].nome})`; bc.onclick = () => iniciarJogo(save); }
  $('#btnNovo').onclick = async () => { if (save && !(await perguntaJogo(`Criar um novo jogador vai substituir ${save.nome} (nível ${save.nivel}). Continuar?`, { sim: 'Criar novo', perigo: true }))) return; abrirCriacao(); };
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
    if (nome.length < 2) {
      $('#inpNome').focus(); $('#inpNome').style.borderColor = 'red';
      // v407 (Raio-X R2g): só a borda vermelha não explicava nada; agora diz o que falta, colado no campo do nome
      let av = document.getElementById('avisoNome');
      if (!av) { av = el('div', { id: 'avisoNome', role: 'alert', style: 'color:#d62828;font-weight:700;font-size:14px;margin:4px 0 2px' }); $('#inpNome').after(av); $('#inpNome').addEventListener('input', () => { av.textContent = ''; $('#inpNome').style.borderColor = ''; }); }
      av.textContent = nome.length ? '✏️ O nome precisa ter pelo menos 2 letras.' : '✏️ Escreva seu nome aqui para nascer!';
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
  abreModal(el('h2', {}, 'Escolha sua classe'), el('p', {}, 'Cada classe é mais forte em um atributo e tem uma habilidade especial (tecla ' + teclaEspecial() + '). Você ainda distribui pontos a cada nível, então dá pra misturar!'), grade,
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: () => {
      s.classe = esc; if (s.posicao) s.posicao = posicaoDaClasse(esc); const lv = s.nivel - 1; s.atr = Object.assign({}, CLASSES[esc].base); s.atr[CLASSES[esc].principal] += lv; s.pontos = lv * PONTOS_POR_NIVEL;
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
    const maxA = Math.max(100, ...Object.keys(ATRIBUTOS).map(x => s.atr[x] || 0)); // v264: a barra acompanha o maior atributo (passava de 100 e ficava sempre cheia)
    const bar = el('div', { class: 'sk-bar' }); const i = el('i'); i.style.width = Math.min(100, v / maxA * 100) + '%'; i.style.background = a.cor; bar.append(i);
    const valB = el('b', {}, v + (st.atr[k] > v ? ` (+${num1(st.atr[k] - v)} 🍽️)` : ''));
    // v264: SEGURAR o "+" vai somando sozinho (e cada vez mais rápido); clique = +1, Shift+clique = +5
    const mais = el('button', { class: 'btn verde mini', type: 'button', disabled: s.pontos > 0 ? null : 'disabled', title: 'Clique: +1 · Segure: vai somando sem parar · Shift+clique: +5' }, '+');
    const soma = n => { n = Math.min(s.pontos, n); if (n <= 0) return false; s.atr[k] += n; s.pontos -= n; G.uiSujo = true; valB.textContent = s.atr[k]; i.style.width = Math.min(100, s.atr[k] / Math.max(maxA, s.atr[k]) * 100) + '%'; const pt = document.getElementById('fichaPontos'); if (pt) pt.textContent = s.pontos ? `Você tem ${s.pontos} ponto(s) para distribuir!` : 'Pronto: todos os pontos distribuídos.'; return true; };
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
    const qtd = el('input', { type: 'number', class: 'ficha-qtd', min: '1', max: String(s.pontos || 0), step: '1', inputmode: 'numeric', placeholder: 'nº', title: 'Digite quantos pontos pôr aqui e aperte Enter', disabled: semPts });
    const poe = () => { const n = Math.floor(Number(qtd.value)); if (!(n > 0)) { qtd.focus(); return; } if (soma(n)) { som('equip'); abreFicha(); } };
    qtd.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); ev.stopPropagation(); poe(); } });
    const btPoe = el('button', { class: 'btn amarelo mini', type: 'button', disabled: semPts, title: 'Pôr os pontos digitados', onclick: poe }, 'Pôr');
    linhas.append(el('div', { class: 'ficha-linha' + (cl && cl.principal === k ? ' principal' : '') }, el('span', { class: 'fl-ic' }, a.icone), el('div', { class: 'fl-meio' }, el('div', { class: 'top' }, el('b', {}, a.nome), valB), bar, el('small', {}, a.desc)), el('div', { class: 'ficha-ctrl' }, qtd, btPoe, mais)));
  }
  const pct = v => Math.round(v * 100) + '%';
  const deriv = el('div', { class: 'sk-info' },
    el('span', {}, 'Fôlego máx.'), el('b', {}, fmt(st.maxHp)), el('span', {}, 'Foco máx.'), el('b', {}, fmt(st.maxFoco)),
    el('span', {}, 'Defesa total'), el('b', {}, Math.round(st.def)), el('span', {}, 'Dano extra'), el('b', {}, (st.danoMult >= 1 ? '+' : '') + pct(st.danoMult - 1)),
    el('span', {}, 'Crítico'), el('b', {}, pct(st.crit)), el('span', {}, 'Bloqueio'), el('b', {}, pct(st.bloqueio)),
    el('span', {}, 'Velocidade'), el('b', {}, Math.round(st.vel) + (typeof tpsDeVel === 'function' ? ` (${String(Math.round(tpsDeVel(st.vel) * 10) / 10).replace('.', ',')} quadradinhos/s)` : '')), el('span', {}, 'XP em missões/quiz'), el('b', {}, '+' + pct(st.xpEstudo - 1)),
    el('span', {}, 'Recuperação'), el('b', {}, `${st.regenHp.toFixed(1)} / ${st.regenFoco.toFixed(1)} por seg.`));
  abreModal.largo = true;
  abreModal(el('h2', {}, `Ficha de ${s.nome}`),
    el('div', { class: 'ficha' },
      el('div', { class: 'ficha-esq' }, retr, el('b', { class: 'ficha-nome' }, s.nome), el('span', {}, `${FASES[faseIdx(s.nivel)].nome} · Nível ${s.nivel}`), s.posicao ? el('span', {}, POSICOES[s.posicao].nome) : '',
        cl ? el('div', { class: 'ficha-classe', style: `--cor:${cl.cor}` }, el('b', {}, `${cl.emoji} ${cl.nome}`), el('small', {}, cl.passiva), el('small', {}, el('span', { class: 'kbd' }, teclaEspecial()), ` ${cl.especial.nome}: ${cl.especial.desc}`)) : el('button', { class: 'btn amarelo', onclick: () => modalEscolheClasse() }, 'Escolher classe')),
      el('div', { class: 'ficha-dir' },
        el('div', { class: 'ficha-pontos' + (s.pontos ? ' tem' : ''), id: 'fichaPontos' }, s.pontos ? `Você tem ${s.pontos} ponto(s) para distribuir!` : 'Sem pontos livres. Você ganha ' + PONTOS_POR_NIVEL + ' a cada nível.'),
        linhas, el('h3', {}, 'O que isso muda'), deriv,
        el('p', { class: 'vazio' }, 'Quer redistribuir tudo? Fale com o Seu Zé no campinho (custa tostões).'))));
}
// Seu Zé devolve os pontos de atributo gastos (a 1ª vez é grátis, depois o preço sobe com o nível)
// v256: até o nível 25 dá para trocar de classe com o Seu Zé (de graça): os pontos são redistribuídos e as magias
// da classe antiga saem (as da nova chegam conforme o nível)
const CLASSE_TROCA_ATE = 25;
function modalTrocaClasse() {
  const s = G.save; if (!s || !s.classe) return;
  if (s.nivel > CLASSE_TROCA_ATE) { log(`A troca de classe só vale até o nível ${CLASSE_TROCA_ATE}.`, 'l-sis'); return; }
  let esc = s.classe; const grade = el('div', { class: 'grade-classes' });
  const bt = el('button', { class: 'btn amarelo grande', type: 'button' }, 'Trocar de classe');
  const render = () => { grade.innerHTML = ''; Object.keys(CLASSES).forEach(id => grade.append(cartaClasse(id, id === esc, () => { esc = id; render(); }))); bt.disabled = esc === s.classe; bt.textContent = esc === s.classe ? 'Escolha outra classe' : `Virar ${CLASSES[esc].nome}`; };
  bt.onclick = () => {
    if (esc === s.classe) return; const velha = CLASSES[s.classe].nome;
    s.classe = esc; const lv = s.nivel - 1; s.atr = Object.assign({}, CLASSES[esc].base); s.atr[CLASSES[esc].principal] += lv; s.pontos = lv * PONTOS_POR_NIVEL;
    if (s.posicao) s.posicao = posicaoDaClasse(esc); // v257: a posição acompanha a classe
    s.dribles = s.dribles.filter(id => !(DRIBLES[id] && DRIBLES[id].classe && DRIBLES[id].classe !== esc));
    s.hotbar = s.hotbar.map(h => h && h.t === 'd' && !s.dribles.includes(h.id) ? null : h);
    if (typeof aprendeMagiasDaVocacao === 'function') aprendeMagiasDaVocacao();
    G.cds.classe = 0; const st = stats(); s.hp = Math.min(s.hp, st.maxHp); s.foco = Math.min(s.foco, st.maxFoco);
    log(`🎭 Você trocou de classe: de ${velha} para ${CLASSES[esc].nome}! ${s.pontos ? 'Aperte C para distribuir seus pontos.' : ''}`, 'l-lvl'); banner(CLASSES[esc].nome.toUpperCase(), 'Nova classe'); som('nivel');
    if (typeof atualizaRetrato === 'function') atualizaRetrato(); G.uiSujo = true; salvar(); fechaModal();
  };
  render(); abreModal.largo = true;
  abreModal(el('h2', {}, '🎭 Trocar de classe'), el('p', {}, `Até o nível ${CLASSE_TROCA_ATE} você pode trocar de classe aqui, de graça. Seus pontos de atributo voltam para distribuir de novo e as magias da classe antiga saem da barra (as da nova chegam conforme o seu nível). A posição vem junto: Paredão joga de Zagueiro, Artilheiro de Atacante, Cérebro e Motorzinho de Meio-campo.`), grade,
    el('div', { class: 'opcoes' }, bt, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Agora não')));
}
function custoRedistribuir() { const s = G.save; return s.flags && s.flags.redist_gratis ? 150 * s.nivel + 3 * s.nivel * s.nivel : 0; }
function redistribuiAtributos() {
  const s = G.save; const custo = custoRedistribuir(); const cl = CLASSES[s.classe]; if (!cl) return;
  const lv = s.nivel - 1; const gastos = lv * PONTOS_POR_NIVEL - (s.pontos || 0);
  const voltar = el('button', { class: 'btn', onclick: fechaModal }, 'Agora não');
  if (gastos <= 0) return abreModal(el('h2', {}, 'Seu Zé'), el('p', {}, 'Você ainda não gastou nenhum ponto de atributo. Aperte C para distribuir!'), el('div', { class: 'opcoes' }, voltar));
  const txtCusto = custo ? `${fmt(custo)} tostões` : 'nada (a primeira vez é por conta da casa!)';
  const falta = s.ouro < custo;
  const sim = el('button', { class: 'btn amarelo', disabled: falta ? 'disabled' : null, onclick: () => {
    if (s.ouro < custo) return;
    s.ouro -= custo; s.flags.redist_gratis = true;
    s.atr = Object.assign({}, cl.base); s.atr[cl.principal] += lv; s.pontos = lv * PONTOS_POR_NIVEL;
    som('moeda'); efeito('curaforte', G.p.x, G.p.y, '#ffd23f');
    log(`Seu Zé devolveu ${s.pontos} pontos de atributo! Distribua de novo na Ficha.`, 'l-lvl'); salvar(); G.uiSujo = true; fechaModal(); abreFicha();
  } }, falta ? `Faltam ${fmt(custo - s.ouro)} tostões` : 'Sim, devolver meus pontos');
  abreModal(el('h2', {}, '🔄 Redistribuir atributos'),
    el('p', {}, `"Quer mudar seu jeito de jogar? Eu te devolvo os ${gastos} pontos de atributo que você já usou, e você escolhe tudo de novo."`),
    el('p', {}, 'Custo: ', el('b', {}, txtCusto)),
    el('p', { class: 'dica' }, 'Seu nível, suas habilidades e seus itens continuam iguais. Só os pontos de atributo voltam para você distribuir.'),
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
  abreModal(el('h2', {}, `Mapa — ${m.nome}`), el('p', {}, '🟣 Você · 🟡 Objetivo (seta amarela) e saídas · 🔵 Pessoas · 🟠 Adversários'), c, el('h3', {}, 'Regiões'), regioes);
}
function modalAtalhos() {
  const L = [
    ['W A S D / Setas', 'Andar (duas juntas = diagonal)'], ['Num 7 9 1 3', 'Andar na diagonal (Num 8 2 4 6 = reto)'], ['Home PgUp End PgDn', 'Diagonais também'], ['Clique no chão', 'Andar até lá'], ['Clique no adversário', 'Marcar alvo e driblar'], // v407 (Raio-X U4): sem a comparação com o Tibia no texto do jogador
    ['Espaço / Tab', 'Próximo adversário (segue o modo de alvo)'], ['V', 'Modo de alvo: mais perto / mais forte / mais fraco / menos fôlego'], ['Shift + Tab', 'Adversário anterior'], ['Esc', 'Desmarcar alvo / fechar janela'],
    ['E', 'Falar, abrir baú, ler placa, pênalti'], ['1 … 0', 'Dribles e itens da barra (fileira de cima)'], ['F1 … F10', 'Segunda fileira da barra'], ['Shift', 'Habilidade especial da classe'],
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
    linha.append(el('div', { class: 'refino-custo' }, precoTag(c.tostoes), ...c.mats.map(([m, n]) => el('small', { class: contaItem(m) >= n ? '' : 'falta' }, `${n}x ${ITENS[m].nome} (${contaItem(m)})`)), el('small', {}, `Chance: ${Math.round(c.chance * 100)}%`), c.cai ? el('small', { class: 'falta' }, `Se falhar: volta pra +${o.r - 1}`) : null),
      el('button', { class: 'btn amarelo mini', disabled: pode ? null : 'disabled', onclick: () => refinar(o, npc) }, `Refinar +${o.r + 1}`));
    lista.append(linha);
  }
  abreModal.largo = true;
  abreModal(el('h2', {}, 'Oficina do Seu Remendo'), msg ? el('p', { class: 'refino-msg' }, msg) : '',
    el('p', {}, 'Cada refino deixa o item mais forte (+12% de ataque/defesa e +10% nos bônus). Até +4 é garantido; depois pode falhar (+5: 85% · +6: 75% · +7: 62% · +8: 50% · +9: 40% · +10: 30%) — se falhar, o item NÃO quebra, só gasta os tostões e os materiais. Itens a partir do nível 20: do +5 em diante pedem um material RARO da região; o +9 e o +10 pedem TROFÉUS de arena; e tentar +8, +9 ou +10 e falhar faz o item voltar 1 nível.'),
    el('p', {}, 'Seus tostões: ', precoTag(s.ouro)), lista, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => abrirNPC(npc) }, 'Voltar')));
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
    msg = `✨ SUCESSO! ${nomeItem(o.id, novo)} ficou mais forte!`; som('nivel'); banner(nomeItem(o.id, novo), 'Refino bem-sucedido!'); log(msg, 'l-lvl'); contaEvento('refino');
  } else if (c.cai) { // refino alto: falhou, o item volta 1 nível (nunca quebra)
    const volta = Math.max(0, o.r - 1);
    if (o.onde === 'equip') { s.equipR = s.equipR || {}; s.equipR[o.slot] = volta; } else if (alvoM) alvoM.r = volta;
    msg = `💥 Não deu certo... e o item voltou para ${nomeItem(o.id, volta)}. Refino alto é assim: arriscado!`; som('erro'); log(msg, 'l-dano');
  } else { msg = `💥 Não deu certo desta vez... O item continua ${nomeItem(o.id, o.r)}. Tente de novo!`; som('erro'); log(msg, 'l-dano'); }
  salvar(); G.uiSujo = true; atualizaRetrato(); modalRefino(npc, msg);
}

document.addEventListener('DOMContentLoaded', telaInicial);

/* v257: saves antigos — a posição passa a ser a da classe (quem era "Artilheiro de Zagueiro" vira Atacante). */
{
  const _iniPosClasse = iniciarJogo;
  iniciarJogo = async function (...a) {
    const r = await _iniPosClasse.apply(this, a);
    try {
      const s = G.save; if (s && s.classe && s.posicao) { const k = posicaoDaClasse(s.classe); if (k !== s.posicao) { const antes = (POSICOES[s.posicao] || {}).nome; s.posicao = k; const st = stats(); s.hp = Math.min(s.hp, st.maxHp); s.foco = Math.min(s.foco, st.maxFoco); salvar(); G.uiSujo = true; setTimeout(() => log(`⚽ Agora a posição vem junto com a classe: ${CLASSES[s.classe].nome} joga de ${POSICOES[k].nome} (antes: ${antes}).`, 'l-info'), 2500); } }
    } catch (e) { }
    return r;
  };
}
