/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📜 AS QUESTS LENDÁRIAS (v287), como as quests famosas do Tibia (Fire Sword, Black Knight, Pits of Inferno,
   Demon Helmet, Annihilator...), com nome e história do nosso futebol.
   - No FUNDO de 9 dungeons (uma por faixa de nível) há um BAÚ LENDÁRIO guardado por um GUARDIÃO (chefão único).
   - Vença o guardião, abra o baú e ESCOLHA 1 DE 3 ITENS ÚNICOS (só uma vez por personagem).
   - Os prêmios são mais fortes que tudo o que se compra no mesmo nível (abaixo só dos míticos das arenas).
   - O LIVRO DAS QLENDAS (☰ Mais → 📜 Lendas) conta cada história e onde procurar.
   O baú e o guardião entram no mapa da dungeon sozinhos: no ponto MAIS LONGE da entrada (o "fundo" da caverna).
   Carregar NO FIM (depois de todos os itens, dungeons e cacadas).
   ============================================================ */
const QLENDAS = [
  { id: 'metro', nome: 'O Baú Esquecido do Metrô', lvl: 20, caca: 'caca_metro', guardiao: 'O Vigia do Último Trem',
    lore: 'Dizem que no último vagão do metrô abandonado ficou um baú de achados e perdidos que ninguém nunca buscou. O Vigia do Último Trem ainda faz a ronda — e não deixa ninguém chegar perto.',
    premios: [['chuteira_ultimo_trem', 'Chuteira do Último Trem', 'chuteira'], ['bone_maquinista', 'Boné do Maquinista', 'cabeca'], ['apito_metro', 'Apito do Metrô', 'acessorio']] },
  { id: 'tumba', nome: 'O Escaravelho Dourado', lvl: 56, caca: 'caca_tumba', guardiao: 'Faraó Adormecido',
    lore: 'Um faraó que amava futebol mandou enterrar seus tesouros com ele, bem no fundo da tumba. Quem acordar o Faraó Adormecido e vencê-lo no jogo limpo ganha o direito de escolher um presente.',
    premios: [['amuleto_escaravelho', 'Amuleto do Escaravelho', 'acessorio'], ['faixa_farao', 'Faixa do Faraó', 'cabeca'], ['sandalia_nilo', 'Sandália Dourada do Nilo', 'chuteira']] },
  { id: 'fogo', nome: 'A Chuteira de Fogo', lvl: 106, caca: 'caca_cratera', guardiao: 'Guardião da Chama',
    lore: 'A lenda mais famosa da Patagônia: no fundo da cratera, perto da lava, um ferreiro forjou uma chuteira que solta faíscas a cada chute. O Guardião da Chama cuida dela há cem anos.',
    premios: [['chuteira_fogo', 'Chuteira de Fogo', 'chuteira'], ['caneleira_brasa', 'Caneleira de Brasa', 'perna'], ['camisa_chama', 'Camisa da Chama', 'camisa']] },
  { id: 'navegador', nome: 'O Tesouro do Navegador', lvl: 130, caca: 'caca_caravela', guardiao: 'Capitão Barba-Ruiva',
    lore: 'O porão da velha caravela esconde o baú do grande navegador, que atravessou o oceano com uma bola de couro na bagagem. O Capitão Barba-Ruiva jura que o tesouro é dele.',
    premios: [['bussola_dourada', 'Bússola Dourada', 'acessorio'], ['chapeu_capitao', 'Chapéu do Capitão', 'cabeca'], ['calcao_marujo', 'Calção do Marujo', 'calcao']] },
  { id: 'cavaleiro', nome: 'O Cavaleiro Negro', lvl: 162, caca: 'caca_catacumba', guardiao: 'Cavaleiro Negro da Zaga',
    lore: 'Nas catacumbas de Milão vive o zagueiro mais temido da história: o Cavaleiro Negro, de armadura escura, que nunca levou um drible. Quem conseguir passar por ele encontra o baú da sua armadura.',
    premios: [['caneleira_negra', 'Caneleira Negra', 'perna'], ['camisa_armadura', 'Camisa da Armadura Negra', 'camisa'], ['elmo_negro', 'Elmo do Cavaleiro Negro', 'cabeca']] },
  { id: 'farao', nome: 'A Máscara do Faraó Artilheiro', lvl: 234, caca: 'caca_piramide', guardiao: 'Faraó Artilheiro',
    lore: 'A pirâmide perdida de Atlântida guarda o Faraó Artilheiro, que marcou mil gols e foi enterrado com a bola nos pés. Seu baú tem a máscara dourada que dizem dar "olhos de artilheiro".',
    premios: [['mascara_farao', 'Máscara do Faraó Artilheiro', 'cabeca'], ['ankh_eterno', 'Ankh da Vida Eterna', 'acessorio'], ['calcao_linho', 'Calção de Linho Sagrado', 'calcao']] },
  { id: 'pocos', nome: 'Os Poços do Vulcão', lvl: 288, caca: 'caca_vulcao', guardiao: 'Senhor dos Poços',
    lore: 'Descendo os poços de fogo do vulcão, os aventureiros encontram o trono do Senhor dos Poços. Poucos voltaram — e os que voltaram contam de um baú cheio de tesouros de magma.',
    premios: [['chuteira_magma', 'Chuteira de Magma', 'chuteira'], ['camisa_pocos', 'Camisa dos Poços de Fogo', 'camisa'], ['colar_rubi', 'Colar de Rubi Vulcânico', 'acessorio']] },
  { id: 'dragao', nome: 'O Capacete do Dragão', lvl: 296, caca: 'caca_covil', guardiao: 'Dragão Ancião Rei',
    lore: 'O rei dos dragões dorme sobre o seu tesouro no fundo do covil. Diz a lenda que o capacete de escamas dele protege até de chute de bicicleta.',
    premios: [['capacete_dragao', 'Capacete do Dragão', 'cabeca'], ['caneleira_escamas', 'Caneleira de Escamas', 'perna'], ['calcao_dragao', 'Calção do Dragão', 'calcao']] },
  { id: 'aniquilador', nome: 'Os Aniquiladores', lvl: 397, caca: 'caca_et_cavaleiro', guardiao: 'O Aniquilador Estelar',
    lore: 'A maior de todas as lendas: no fundo da Fortaleza Estelar, o Aniquilador Estelar protege o baú dos campeões da galáxia. Só os craques mais fortes do universo chegam até ele.',
    premios: [['camisa_aniquilador', 'Camisa do Aniquilador', 'camisa'], ['chuteira_supernova', 'Chuteira Supernova', 'chuteira'], ['coroa_estelar', 'Coroa Estelar', 'cabeca']] },
];
const QLENDA_POR_ID = Object.fromEntries(QLENDAS.map(l => [l.id, l]));
function lendaDados(id) { const s = G.save; s.lendas = s.lendas || {}; return s.lendas[id] || (s.lendas[id] = {}); }

/* ---------- os prêmios: um pouco acima do melhor item daquela parte do corpo no mesmo nível ---------- */
{
  const score = it => (it.atk || 0) * 2 + (it.def || 0) * 2 + Object.values(it.st || {}).reduce((a, v) => a + v, 0) * 0.2;
  const eq = Object.values(ITENS).filter(i => i.tipo === 'equip' && !i.mitico && !i.lenda);
  const EXTRA = { chuteira: { vel: 3 }, cabeca: { visao: 2 }, acessorio: { regen: 2 }, camisa: { defesa: 1 }, perna: { defesa: 1 }, calcao: { vel: 3 } };
  const AV = { cabeca: 'chapeu-bone', camisa: 'roupa-futebol' };
  for (const L of QLENDAS) {
    for (const [id, nome, slot] of L.premios) {
      const base = eq.filter(i => i.slot === slot && (i.lvl || 0) <= L.lvl).sort((a, b) => score(b) - score(a))[0] || { lvl: L.lvl, def: 3 };
      const k = 1.2 * Math.pow(Math.max(1, L.lvl / Math.max(1, base.lvl || 1)), 0.6); // se o melhor é de nível bem mais baixo, cresce junto
      const st = {}; for (const [a, v] of Object.entries(base.st || {})) st[a] = Math.max(1, Math.round(v * k));
      for (const [a, v] of Object.entries(EXTRA[slot] || {})) st[a] = (st[a] || 0) + v + Math.floor(L.lvl / 80);
      const it = { nome, tipo: 'equip', slot, lvl: L.lvl, preco: Math.round(L.lvl * L.lvl * 30), venda: Math.round(L.lvl * 60), raro: true, lenda: L.id, st, desc: '' };
      if (base.atk) it.atk = Math.round(base.atk * k); if (base.def) it.def = Math.round(base.def * k);
      if (!it.atk && !it.def) it.def = Math.max(2, Math.round(L.lvl / 12));
      if (AV[slot] && base.avatar) it.avatar = base.avatar;
      const nm = { hp: 'fôlego', foco: 'foco', vel: 'velocidade', drible: 'drible', chute: 'chute', visao: 'visão', defesa: 'defesa', regen: 'recuperação' };
      it.desc = `LENDÁRIO — prêmio da quest "${L.nome}". ` + [it.atk ? `Ataque ${it.atk}` : '', it.def ? `Defesa ${it.def}` : '', ...Object.entries(st).map(([a, v]) => `+${v} ${nm[a] || a}`)].filter(Boolean).join(', ') + '.';
      ITENS[id] = it;
      if (!ASSET_SET.has('i_' + id)) { ASSETS.push('i_' + id); ASSET_SET.add('i_' + id); }
      if (typeof RAR_CACHE !== 'undefined' && RAR_CACHE) RAR_CACHE[id] = 'lendario';
    }
  }
  OBJ_INFO.bau_lendario = { w: 1.35, b: 1 }; OBJ_BLOQUEIA.add('bau_lendario'); if (!ASSET_SET.has('bau_lendario')) { ASSETS.push('bau_lendario'); ASSET_SET.add('bau_lendario'); }
}

/* ---------- os guardiões: chefões únicos (voltam em 5 minutos) ---------- */
for (const L of QLENDAS) {
  const c = CACADAS.find(k => k.id === L.caca); if (!c || !MONSTROS[c.m]) continue;
  const base = MONSTROS[c.m], Lg = L.lvl + 4, b = statsNivel(Lg);
  const d = montaMonstro('guard_' + L.id, L.guardiao, 'chefe', Lg, { falas: ['Ninguém toca no baú!', 'Aqui é o fim da linha!', 'O tesouro é meu!'] });
  d.look = Object.assign({}, base.look, { grande: true }); delete d.look._kb;
  Object.assign(d, { hp: Math.round(b.hp * 10), atk: Math.round(b.atk * 1.15), def: Math.round(b.def * 1.2), xp: Math.round(b.xp * 22), respawn: 300000, chefe: true, lendaGuardiao: L.id,
    ouro: [L.lvl * 90, L.lvl * 160], loot: [['fio_ouro', 0.6, 1, 2]] });
  d.ranged = { alcance: 5, dano: Math.round(d.atk * 0.85), cd: 2600, proj: 'bolaforte' };
}

/* ---------- o baú e o guardião no fundo da dungeon ---------- */
function lendaPoeNoMapa(m, L) {
  const W = m.w, H = m.h, i = (x, y) => y * W + x;
  const anda = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && CH_ANDA(m.chao[i(x, y)]) && m.chao[i(x, y)] !== CH.AGUA && !(m.obj[i(x, y)] && OBJ_BLOQUEIA.has(m.obj[i(x, y)].t));
  const ini = m.inicio || m.renasce; if (!ini) return false;
  // distância (a pé) de cada quadrado até a entrada
  const dist = new Int32Array(W * H).fill(-1), pai = new Int32Array(W * H).fill(-1), fila = [i(ini.x, ini.y)]; dist[fila[0]] = 0;
  for (let q = 0; q < fila.length; q++) { const k = fila[q], x = k % W, y = (k / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!anda(nx, ny) || dist[i(nx, ny)] >= 0) continue; dist[i(nx, ny)] = dist[k] + 1; pai[i(nx, ny)] = k; fila.push(i(nx, ny)); } }
  const perto = (x, y) => m.saidas.some(s => Math.abs(s.x - x) < 3 && Math.abs(s.y - y) < 3) || m.npcs.some(n => Math.abs(n.x - x) < 3 && Math.abs(n.y - y) < 3) || m.pontos.some(p => Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3);
  let melhor = -1, md = -1;
  for (let k = 0; k < W * H; k++) {
    if (dist[k] <= md) continue; const x = k % W, y = (k / W) | 0;
    let livre = true; for (let dy = -1; dy <= 1 && livre; dy++) for (let dx = -1; dx <= 1 && livre; dx++) livre = anda(x + dx, y + dy);
    if (!livre || perto(x, y)) continue; melhor = k; md = dist[k];
  }
  if (melhor < 0) return false;
  const bx = melhor % W, by = (melhor / W) | 0;
  m.obj[i(bx, by)] = { t: 'bau_lendario', v: 1 };
  m.pontos.push({ x: bx, y: by, tipo: 'bau_lenda', lenda: L.id });
  // o guardião fica uns passos antes do baú, no caminho
  let k = melhor; for (let n = 0; n < 4 && pai[k] >= 0; n++) k = pai[k];
  m.spawns.push({ m: 'guard_' + L.id, x: k % W, y: (k / W) | 0, qtd: 1, raio: 1 });
  // uma plaquinha na entrada: tem lenda aqui
  for (let r = 1; r < 6; r++) { let posto = false; for (let dy = -r; dy <= r && !posto; dy++) for (let dx = -r; dx <= r && !posto; dx++) { const x = ini.x + dx, y = ini.y + dy; if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !anda(x, y) || perto(x, y) || dist[i(x, y)] < 0) continue; m.obj[i(x, y)] = { t: 'placa', v: 1 }; m.placas.push({ x, y, texto: `📜 DIZ A LENDA... "${L.nome}": no fundo desta caverna, o ${L.guardiao} guarda um BAÚ LENDÁRIO (nível ${L.lvl}). Leia mais no Livro das Lendas (☰ Mais → 📜 Lendas).` }); posto = true; } if (posto) break; }
  m.lenda = L.id;
  return true;
}
for (const L of QLENDAS) {
  const base = MAPAS_DEF[L.caca]; if (!base) continue;
  MAPAS_DEF[L.caca] = function () { const m = base.apply(this, arguments); try { lendaPoeNoMapa(m, L); } catch (e) { console.error('lenda', L.id, e); } return m; };
}

/* ---------- vencer o guardião destranca o baú ---------- */
{
  const _matarLenda = matar;
  matar = function (m) {
    const id = m && m.d && m.d.lendaGuardiao; const r = _matarLenda.apply(this, arguments);
    if (id && G.save) {
      const L = QLENDA_POR_ID[id], ld = lendaDados(id);
      if (!ld.guardiao) { ld.guardiao = true; if (typeof carrHist === 'function' && G.save.carreira && G.save.carreira.ativa) try { carrHist(`${carrNome()} vence o ${L.guardiao}!`); } catch (e) { } }
      banner('🗝️ O guardião caiu!', ld.aberto ? 'Você já abriu este baú antes.' : 'O BAÚ LENDÁRIO está destrancado!'); som('nivel');
      log(`🗝️ Você venceu o ${L.guardiao}! ${ld.aberto ? '' : 'O baú lendário no fundo da caverna está destrancado: chegue perto e aperte E.'}`, 'l-lendario');
      salvar();
    }
    return r;
  };
  const _usarLenda = usarPonto;
  usarPonto = function (pt) {
    if (!pt || pt.tipo !== 'bau_lenda') return _usarLenda.apply(this, arguments);
    const L = QLENDA_POR_ID[pt.lenda]; if (!L) return; const ld = lendaDados(L.id), s = G.save;
    if (ld.aberto) { log(`📜 O baú de "${L.nome}" está vazio: você já pegou o seu prêmio (${ITENS[ld.aberto] ? ITENS[ld.aberto].nome : ''}).`, 'l-sis'); return; }
    if (s.nivel < L.lvl) { log(`🔒 O baú lendário de "${L.nome}" só abre para quem tem nível ${L.lvl}.`, 'l-sis'); som('erro'); return; }
    if (!ld.guardiao) { log(`🔒 O baú está trancado! Vença o ${L.guardiao} primeiro — ele ronda aqui perto.`, 'l-dano'); som('erro'); return; }
    lendaModalBau(L);
  };
}
function lendaCartao(id, onclick) {
  const it = ITENS[id];
  const b = el('button', { class: 'lenda-premio', type: 'button', onclick }, iconeClone(iconeItem(id)), el('b', {}, it.nome), el('small', {}, it.desc.replace(/^LENDÁRIO — prêmio da quest "[^"]*"\. /, '')));
  if (typeof comTip === 'function' && typeof tipItem === 'function') comTip(b, () => tipItem(id, 0));
  return b;
}
function lendaModalBau(L) {
  const ld = lendaDados(L.id);
  const escolhe = async id => {
    if (ld.aberto) return;
    const ok = typeof perguntaJogo === 'function' ? await perguntaJogo(`Levar a ${ITENS[id].nome}? Só dá para escolher UM prêmio deste baú.`, { titulo: '🗝️ Baú lendário', sim: 'Levar', nao: 'Voltar' }) : true;
    if (!ok) return lendaModalBau(L);
    ld.aberto = id; ld.dia = G.save.dia; recebeItem(id, 1);
    banner(`⭐ ${ITENS[id].nome}!`, `Lenda cumprida: ${L.nome}`); som('raro'); efeito('estrelas', G.p.x, G.p.y, '#ffc83a');
    log(`📜 LENDA CUMPRIDA: "${L.nome}"! Você escolheu: ${ITENS[id].nome}.`, 'l-lendario');
    if (typeof carrHist === 'function' && G.save.carreira && G.save.carreira.ativa) try { carrHist(`${carrNome()} cumpre a lenda "${L.nome}" e leva a ${ITENS[id].nome}!`); } catch (e) { }
    if (typeof oferecerDivulgar === 'function') oferecerDivulgar({ feito: `Cumpri a lenda "${L.nome}"!` });
    salvar(); G.uiSujo = true; fechaModal();
  };
  abreModal.largo = true;
  abreModal(el('h2', {}, `🗝️ ${L.nome}`),
    el('p', {}, 'O baú se abre devagar... três tesouros brilham lá dentro. ', el('b', {}, 'Escolha UM'), ' (os outros voltam a sumir na escuridão):'),
    el('div', { class: 'lenda-premios' }, ...L.premios.map(([id]) => lendaCartao(id, () => escolhe(id)))),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Pensar mais um pouco')));
}

/* ---------- o Livro das Lendas ---------- */
function lendaOnde(L) {
  const c = CACADAS.find(k => k.id === L.caca); if (!c) return '';
  let cid = c.host; try { cid = getMapa(c.host).nome.split(' —')[0]; } catch (e) { }
  return `${c.nome} (${cid})`;
}
function modalLendas() {
  const s = G.save; if (!s) return;
  const feitas = QLENDAS.filter(L => lendaDados(L.id).aberto).length;
  const lista = el('div', { class: 'lendas-lista' });
  for (const L of QLENDAS) {
    const ld = lendaDados(L.id), pode = s.nivel >= L.lvl;
    const st = ld.aberto ? `✅ Cumprida — você levou: ${ITENS[ld.aberto] ? ITENS[ld.aberto].nome : '?'}` : ld.guardiao ? '🗝️ Guardião vencido: o baú está destrancado!' : pode ? '⚔️ Disponível para você' : `🔒 Nível ${L.lvl}`;
    lista.append(el('div', { class: 'lenda-card' + (ld.aberto ? ' feita' : pode ? '' : ' bloq') },
      el('div', { class: 'lenda-cab' }, el('b', {}, `📜 ${L.nome}`), el('span', { class: 'lenda-nv' }, `nível ${L.lvl}`)),
      el('p', { class: 'lenda-lore' }, L.lore),
      el('p', { class: 'lenda-onde' }, `📍 Onde: no fundo do ${lendaOnde(L)} · guardião: ${L.guardiao}`),
      el('div', { class: 'lenda-icones' }, ...L.premios.map(([id]) => { const w = el('span', { class: 'lenda-ic' + (ld.aberto === id ? ' levou' : '') }, iconeClone(iconeItem(id))); if (typeof comTip === 'function' && typeof tipItem === 'function') comTip(w, () => tipItem(id, 0)); return w; })),
      el('p', { class: 'lenda-st' }, st)));
  }
  abreModal.largo = true;
  abreModal(el('h2', {}, '📜 O Livro das Lendas'),
    el('p', {}, `Histórias contadas pelos mais velhos em cada canto do mundo. No fundo de cada caverna há um BAÚ LENDÁRIO com um guardião: vença-o e escolha 1 de 3 tesouros únicos (uma vez por personagem). Lendas cumpridas: ${feitas}/${QLENDAS.length}.`),
    lista, el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
}
{
  const poe = () => {
    const lista = document.querySelector('#topo .tb-lista');
    if (lista && !document.getElementById('btnLendas')) { const b = el('button', { class: 'btn', id: 'btnLendas', type: 'button', role: 'menuitem', onclick: () => { if (G.save) modalLendas(); } }, '📜 Lendas'); const t = document.getElementById('btnTarefas'); if (t) t.after(b); else lista.prepend(b); }
    const grade = document.querySelector('#celMenu .cm-grade');
    if (grade && !document.getElementById('cmLendas')) grade.prepend(el('button', { class: 'btn cm-bt', id: 'cmLendas', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); if (G.save) modalLendas(); } }, el('span', { class: 'cm-ic' }, '📜'), 'Lendas'));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poe, 0)); else setTimeout(poe, 0);
  const _iniLenda = iniciarJogo; iniciarJogo = async function () { const r = await _iniLenda.apply(this, arguments); poe(); return r; };
  // entrou numa dungeon com lenda: um aviso (uma vez)
  const _entrarLenda = entrarMapa;
  entrarMapa = function (id) {
    const r = _entrarLenda.apply(this, arguments);
    try { const m = G.mapa, L = m && m.lenda && QLENDA_POR_ID[m.lenda]; if (L && G.save) { const ld = lendaDados(L.id); if (!ld.avisou && !ld.aberto) { ld.avisou = true; setTimeout(() => log(`📜 Dizem que no fundo desta caverna há um BAÚ LENDÁRIO: "${L.nome}" (nível ${L.lvl}). Leia o Livro das Lendas (☰ Menu → 📒 Caderno do Craque → Lendas).` /* v408 (Raio-X I6) */, 'l-lendario'), 1500); } } } catch (e) { }
    return r;
  };
  const st = document.createElement('style');
  st.textContent = `.lendas-lista{display:grid;gap:10px;max-height:60vh;overflow:auto;padding:2px}
.lenda-card{border-radius:12px;padding:10px 12px;background:linear-gradient(90deg,rgba(255,200,58,.16),rgba(255,200,58,.04));border:2px solid rgba(200,150,40,.5)}
.lenda-card.feita{background:rgba(58,216,106,.12);border-color:#2aa84a}.lenda-card.bloq{opacity:.75;filter:saturate(.7)}
.lenda-cab{display:flex;justify-content:space-between;align-items:center;gap:8px}.lenda-nv{font-weight:900;color:#a0662a}
.lenda-lore{margin:4px 0;font-style:italic;font-size:.93em}.lenda-onde{margin:2px 0;font-size:.88em;font-weight:700}
.lenda-icones{display:flex;gap:8px;margin:4px 0}.lenda-ic{width:46px;height:46px;border-radius:10px;background:rgba(0,0,0,.08);display:grid;place-items:center}
.lenda-ic canvas{max-width:42px;max-height:42px}.lenda-ic.levou{outline:3px solid #2aa84a}
.lenda-st{margin:2px 0 0;font-weight:800}
.lenda-premios{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:10px 0}
.lenda-premio{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px;border-radius:12px;border:3px solid #e0a800;background:linear-gradient(#fff8e0,#ffe8a8);cursor:pointer;text-align:center}
.lenda-premio:hover{transform:translateY(-2px);box-shadow:0 6px 14px rgba(0,0,0,.25)}
.lenda-premio canvas{width:64px;height:64px}.lenda-premio small{font-size:.8em;opacity:.85}`;
  document.head.append(st);
}
