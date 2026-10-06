/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📍 COMO CHEGAR (v394; dono: "tem muita quest vaga, não fala onde fica tal adversário, nem como chegar lá... crie um padrão
   fixo para quests, elas precisam ser explicativas em termos de onde achar os adversários requisitados").
   PADRÃO FIXO de toda missão (calculado dos próprios mapas: missão nova já nasce explicada):
     👾 Quem: o adversário e o nível dele (⚠️ se ainda está forte demais para você)
     🗺️ Onde: o lugar (área de caça, arena, estádio ou mapa) e a região (Brasil, Cairo, Atlântida, Lua...)
     🧭 Como chegar: a viagem até a região (avião, submarino, foguete, portal) + o caminho de mapa em mapa
     📌 Lá dentro: em que parte do mapa ele fica (norte, sul, leste, oeste, centro)
   Missão de itens: o mesmo, para o adversário que mais deixa cair o item. Missão de falar/gols/quiz: onde fica quem procurar.
   Aparece quando o personagem oferece a missão, na conversa (missão em andamento) e na janela Missões (resumido).
   Carregar DEPOIS de ondeachar.js e objetivo_agora.js.
   ============================================================ */
// como entrar em cada região que não se chega andando (a chave é o mapa de chegada da região)
const CC_VIAGEM = {
  atlantida: () => '🌊 No Rio de Janeiro, fale com a Capitã Iara (no porto) e desça de submarino — precisa do Capacete de Mergulho.',
  estacao: () => '🚀 No Rio de Janeiro, fale com a Dra. Estela e decole para a Estação Espacial — precisa do Traje de Astronauta.',
  multiverso: () => '🌀 No Rio de Janeiro, fale com o Guardião do Multiverso.',
  torre_infinita: () => '🗼 No Multiverso, fale com a Mestra Altina (Torre Infinita).',
};
['lua', 'marte', 'saturno', 'nebulosa', 'copa_intergalactica'].forEach(id => { CC_VIAGEM[id] = () => `🚀 Vá até a Estação Espacial (no Rio, com a Dra. Estela — precisa do Traje de Astronauta) e lá a Torre de Controle leva até ${ccNome(id)}.`; });
const ccNome = id => { try { return typeof nomeLugarCurto === 'function' ? nomeLugarCurto(id) : getMapa(id).nome.split(' —')[0]; } catch (e) { return id; } };
// as regiões: grupos de mapas ligados por saídas (andando)
let CC_REG = null;
function ccRegioes() {
  if (CC_REG) return CC_REG;
  const g = indice().grafo, und = {};
  for (const [a, es] of Object.entries(g)) for (const e of es) { if (!MAPAS_DEF[e.para]) continue; (und[a] = und[a] || new Set()).add(e.para); (und[e.para] = und[e.para] || new Set()).add(a); }
  const de = {}, grupos = [];
  for (const id of Object.keys(MAPAS_DEF)) {
    if (de[id] != null) continue; const c = [], q = [id]; de[id] = grupos.length;
    while (q.length) { const a = q.shift(); c.push(a); for (const b of und[a] || []) if (de[b] == null) { de[b] = grupos.length; q.push(b); } }
    grupos.push(c);
  }
  // a porta de entrada de cada região: a vila (Brasil), a cidade do voo, ou o mapa de chegada da viagem especial
  const voos = typeof VOOS !== 'undefined' ? VOOS : {};
  const hub = grupos.map(c => c.includes('vila') ? 'vila' : c.find(m => CC_VIAGEM[m]) || c.find(m => voos[m]) || null);
  return (CC_REG = { de, grupos, hub });
}
function ccViagem(hubId) {
  if (!hubId || hubId === 'vila') return '';
  if (CC_VIAGEM[hubId]) return CC_VIAGEM[hubId]();
  const v = typeof VOOS !== 'undefined' && VOOS[hubId];
  if (hubId === 'cidade') return '✈️ Pegue o avião de volta para o Brasil (desce na Cidade).';
  if (v) return `✈️ Pegue o avião para ${v.nome}${v.lvl > 1 ? ` (a partir do nível ${v.lvl})` : ''} — no Brasil, o aeroporto fica na Cidade, com a Comissária Luana.`;
  return '';
}
// o caminho andando, de mapa em mapa (saídas), sem contar as casas por dentro
function ccCaminho(de, para) {
  if (de === para) return [para];
  const g = indice().grafo, vis = { [de]: null }, fila = [de];
  while (fila.length) { const a = fila.shift(); if (a === para) break; for (const e of g[a] || []) if (MAPAS_DEF[e.para] && !(e.para in vis)) { vis[e.para] = a; fila.push(e.para); } }
  if (!(para in vis)) return null;
  const l = []; for (let c = para; c != null; c = vis[c]) l.unshift(c);
  return l;
}
// em que parte do mapa
function ccParte(mapa, x, y) {
  try {
    const m = getMapa(mapa), fx = x / m.w, fy = y / m.h;
    const v = fy < 0.34 ? 'n' : fy > 0.66 ? 's' : '', h = fx < 0.34 ? 'o' : fx > 0.66 ? 'l' : '';
    if (!v && !h) return 'no meio do mapa';
    const tela = [v === 'n' ? 'em cima' : v === 's' ? 'embaixo' : '', h === 'l' ? 'à direita' : h === 'o' ? 'à esquerda' : ''].filter(Boolean).join(', ');
    const rosa = { n: 'norte', s: 'sul', l: 'leste', o: 'oeste', nl: 'nordeste', no: 'noroeste', sl: 'sudeste', so: 'sudoeste' }[v + h];
    return `${tela} no mapa (${rosa})`;
  } catch (e) { return ''; }
}
// a plaquinha mais perto do ponto (o nome da sala/área, quando a placa diz quem mora ali ou fica bem perto)
function ccPlaca(mapa, x, y, quem) {
  try {
    const m = getMapa(mapa); let melhor = null;
    for (const p of m.placas || []) {
      const d = Math.hypot(p.x - x, p.y - y), fala = quem && p.texto.toLowerCase().includes(quem.split(' ')[0].toLowerCase());
      if (d > (fala ? 12 : 6)) continue; const sc = d - (fala ? 8 : 0); if (!melhor || sc < melhor.sc) melhor = { sc, p };
    }
    if (!melhor) return '';
    const t = melhor.p.texto.split(' — ')[0].trim(); return t.length <= 42 ? t : '';
  } catch (e) { return ''; }
}
// onde um adversário aparece: mapa + ponto (da tabela dos mapas; arena/estádio pelo dado do adversário)
// todos os lugares onde cada adversário aparece (o índice do jogo guarda só o primeiro)
let CC_SP = null;
function ccSpawns(tipo) {
  if (!CC_SP) { CC_SP = {}; for (const id of Object.keys(MAPAS_DEF)) { let m; try { m = getMapa(id); } catch (e) { continue; } for (const sp of m.spawns || []) (CC_SP[sp.m] = CC_SP[sp.m] || []).push({ mapa: id, x: sp.x + 0.5, y: sp.y + 0.5 }); } }
  return CC_SP[tipo] || [];
}
// o lugar certo para a missão: o mapa do nome da missão (ex.: caca_barracao_m1 → caca_barracao), senão o mapa de quem deu
// a missão, senão a mesma região de quem deu, senão o primeiro
function ccOndeMonstro(tipo, q) {
  const d = MONSTROS[tipo]; if (!d) return null;
  const l = ccSpawns(tipo);
  if (l.length) {
    if (q) {
      const doNome = l.find(o => q.id && q.id.startsWith(o.mapa + '_')); if (doNome) return doNome;
      const quem = q.npc && indice().npc[q.npc];
      if (quem) { const mesmo = l.find(o => o.mapa === quem.mapa); if (mesmo) return mesmo; const R = ccRegioes(); const reg = l.find(o => R.de[o.mapa] === R.de[quem.mapa]); if (reg) return reg; }
    }
    return l[0];
  }
  for (const id of [d.arena, d.arena && 'arena_' + d.arena, d.estadio, d.estadio && 'est_' + d.estadio]) if (id && MAPAS_DEF[id]) { const m = getMapa(id); return { mapa: id, x: m.w / 2, y: m.h / 2, arena: !!d.arena, estadio: !!d.estadio }; }
  return null;
}
// o texto completo de "como chegar" a um mapa (a partir de onde você está, se der para ir andando)
function ccRota(mapa) {
  const R = ccRegioes(), r = R.de[mapa]; if (r == null) return null;
  const aqui = G.mapa && !G.mapa.interior ? G.mapa.id : (G.save && G.save.ultimoMapaFora) || 'vila';
  const limpa = c => c && c.filter(id => !getMapa(id).interior || id === mapa);
  const regiao = R.hub[r] && R.hub[r] !== 'vila' ? ccNome(R.hub[r]) : 'Brasil';
  // 1) dá para ir andando daqui
  const direto = ccCaminho(aqui, mapa);
  if (direto) return { viagem: '', caminho: limpa(direto), mesma: true, aqui, regiao, jaAqui: aqui === mapa };
  // 2) senão: a porta de chegada (avião, submarino, foguete, portal) que leva até lá pelo caminho mais curto
  let melhor = null;
  const portas = [...Object.keys(typeof VOOS !== 'undefined' ? VOOS : {}), ...Object.keys(CC_VIAGEM)];
  if (R.de[aqui] === R.de.vila) portas.push('vila'); // (no Brasil dá para voltar andando até a vila)
  for (const p of new Set(portas)) { if (!MAPAS_DEF[p]) continue; const c = ccCaminho(p, mapa); if (c && (!melhor || c.length < melhor.c.length)) melhor = { p, c }; }
  if (!melhor) return { viagem: '', caminho: null, mesma: false, aqui, regiao, jaAqui: false };
  return { viagem: ccViagem(melhor.p), caminho: limpa(melhor.c), mesma: false, aqui, regiao, jaAqui: false };
}
/* v407 (Raio-X R3): missão de ITEM escolhia a primeira fonte da lista (fontesDoItem(id).drops[0]) e mandava criança de
   nível 566 para chefão de nível 700. Agora: a fonte de nível mais perto do jogador (ou da missão, o que for maior), chefão
   muito acima só se não tiver outro jeito; item que vem de baú, loja ou troca mostra QUEM procurar ("Procure: Mestra Altina");
   e pedido de vários itens lista uma fonte por item. */
// itens que também vêm de qualquer adversário de um grupo (sorteio próprio, fora da tabela de loot)
const CC_ITEM_KILL = {
  ovo_tricerinho: () => Object.keys(MONSTROS).filter(t => /^jur_/.test(t) && t !== 'jur_rex' && !MONSTROS[t].chefe), // jurassico.js: qualquer dinossauro do vale
};
// itens que vêm de baú, troca ou de um personagem: quem procurar e como
const CC_ITEM_NPC = {
  brasa_eterna: [['mestre_torre', 'troca Fichas da Torre por Baús da Torre — e o baú pode trazer Brasas Eternas']],
  gelo_eterno: [['mestre_torre', 'troca Fichas da Torre por Baús da Torre — e o baú pode trazer Gelo Eterno']],
  bau_torre: [['mestre_torre', 'troca 12 Fichas da Torre por um Baú da Torre']],
  ficha_torre: [['mestre_torre', 'cada andar vencido na Torre Infinita dá Fichas']],
  taca_multiverso: [['mestre_torre', 'os chefões da Torre Infinita deixam cair Taças do Multiverso']],
};
const ccNivelDe = tipo => { const d = MONSTROS[tipo]; return (d && (d.nivel || (typeof nivelMonstro === 'function' ? nivelMonstro(d) : 0))) || 0; };
const ccRef = q => Math.max((G.save && G.save.nivel) || 1, (q && q.lvl) || 1);
// todas as fontes de um item: adversários (com lugar no mapa) e personagens (loja, troca, baú)
function ccFontesItem(id, ref) {
  const drops = [], vistos = new Set();
  const poe = (tipo, ch) => { if (vistos.has(tipo) || !MONSTROS[tipo]) return; const o = ccOndeMonstro(tipo, null); if (!o) return; vistos.add(tipo); drops.push({ tipo, ch, nivel: ccNivelDe(tipo), chefe: !!MONSTROS[tipo].chefe }); };
  for (const [tipo, d] of Object.entries(MONSTROS)) for (const l of (d.loot || [])) if (l[0] === id && l[1] > 0) poe(tipo, l[1]);
  if (CC_ITEM_KILL[id]) for (const t of CC_ITEM_KILL[id]()) poe(t, 0.0002);
  // o que ajuda mais: perto do nível de referência (acima pesa mais), chefão muito acima quase nunca, e o que deixa cair mais
  const nota = x => Math.abs(x.nivel - ref) * (x.nivel > ref ? 2 : 1) + (x.chefe ? (x.nivel > ref + 10 ? 2000 : 25) : 0) - Math.min(x.ch, 0.5) * 40;
  drops.sort((a, b) => nota(a) - nota(b));
  const npcs = [];
  for (const [nid, como] of CC_ITEM_NPC[id] || []) if (NPCS[nid]) npcs.push({ npc: nid, nome: NPCS[nid].nome.split(',')[0], como });
  for (const [nid, n] of Object.entries(NPCS)) if (Array.isArray(n.loja) && n.loja.includes(id) && !npcs.some(x => x.npc === nid)) npcs.push({ npc: nid, nome: n.nome.split(',')[0], como: 'vende' });
  // um chefão (ou adversário) 30+ níveis acima não é a melhor ideia quando dá para comprar/trocar com alguém
  const longe = x => x && x.nivel > ref + 30;
  const melhor = drops[0] && !(longe(drops[0]) && npcs.length) ? drops[0] : null;
  return { drops, npcs, melhor, npc: !melhor && npcs.length ? npcs[0] : null };
}
// o lugar de um adversário para o bloco (null se ele não aparece em lugar nenhum)
function ccDoMonstro(tipo, q, porItem) {
  const o = ccOndeMonstro(tipo, q); if (!o) return null; const d = MONSTROS[tipo];
  const nv = ccNivelDe(tipo), eu = (G.save && G.save.nivel) || 1;
  return { quem: d.nome.split(',')[0], tipo, nivel: nv, forte: nv > eu + 15, chefe: !!d.chefe, porItem, mapa: o.mapa, onde: ccNome(o.mapa), parte: o.arena || o.estadio ? '' : ccParte(o.mapa, o.x, o.y), placa: ccPlaca(o.mapa, o.x, o.y, d.nome), rota: ccRota(o.mapa) };
}
function ccDoNpc(f, porItem) {
  const a = indice().npc[f.npc]; if (!a || !a.mapa) return null;
  return { quem: f.nome, npc: f.npc, como: f.como, porItem, mapa: a.mapa, onde: ccNome(a.mapa), parte: ccParte(a.mapa, a.x, a.y), rota: ccRota(a.mapa), lugarDe: true };
}
// o bloco do padrão fixo, para uma missão (null se a missão não tem um lugar)
function ccInfo(q) {
  const r = q.req || {};
  if (!r.kill && (r.item || r.itens)) {
    const lista = r.itens ? r.itens.map(([id, n]) => [id, n]) : [[r.item, r.n || 1]], ref = ccRef(q);
    const fontes = lista.filter(([id]) => ITENS[id]).map(([id, n]) => ({ id, n, f: ccFontesItem(id, ref) }));
    // req.de: a missão diz de quem o item deve vir (ex.: q_caramelo → as Bolas Murchas dos caramelos)
    if (r.de && fontes[0]) { const d = fontes[0].f.drops.find(o => o.tipo === r.de); if (d) fontes[0].f.melhor = d; }
    // o item que falta primeiro manda no "Onde" (e na seta); os outros aparecem na linha das fontes
    const falta = fontes.find(x => (typeof contaItem === 'function' ? contaItem(x.id) : 0) < x.n && (x.f.melhor || x.f.npc)) || fontes.find(x => x.f.melhor || x.f.npc);
    if (falta) {
      const I = falta.f.melhor ? ccDoMonstro(falta.f.melhor.tipo, r.de === falta.f.melhor.tipo ? q : null, falta.id) : ccDoNpc(falta.f.npc, falta.id);
      if (I) {
        I.fontes = fontes.length > 1 ? fontes.map(x => ({ item: x.id, quem: x.f.melhor ? MONSTROS[x.f.melhor.tipo].nome.split(',')[0] : x.f.npc ? x.f.npc.nome : '', nivel: x.f.melhor ? x.f.melhor.nivel : 0, chefe: x.f.melhor ? x.f.melhor.chefe : false, onde: x.f.melhor ? ccNome(ccOndeMonstro(x.f.melhor.tipo, null).mapa) : '' })) : null;
        const outroNpc = falta.f.melhor && falta.f.npcs.find(n => n.como !== 'vende') || (!falta.f.melhor ? falta.f.npcs[1] : null);
        if (outroNpc) I.tambem = outroNpc;
        return I;
      }
    }
  }
  if (r.kill) return ccDoMonstro(r.kill, q, null);
  // falar com alguém, gols, quiz...: onde fica quem procurar
  let alvo = null, quem = '';
  try {
    if (r.gols) { alvo = alvoPonto('penalti'); quem = 'a marca do pênalti'; }
    else if (r.quiz) { alvo = indice().npc.juca; quem = (NPCS.juca || {}).nome; }
    else if (r.prof) { alvo = indice().npc.lucia; quem = (NPCS.lucia || {}).nome; }
    else if (r.flag === 'pegou_bola') { alvo = alvoPonto('bau_bola'); quem = 'o baú da bola'; }
    else if (r.fala && NPCS[r.fala]) { alvo = indice().npc[r.fala]; quem = NPCS[r.fala].nome; }
  } catch (e) { }
  if (!alvo || !alvo.mapa) return null;
  return { quem, mapa: alvo.mapa, onde: ccNome(alvo.mapa), parte: ccParte(alvo.mapa, alvo.x, alvo.y), rota: ccRota(alvo.mapa), lugarDe: true };
}
function ccCaminhoTxt(rota) {
  if (!rota || !rota.caminho) return '';
  const c = rota.caminho; if (c.length <= 1) return rota.jaAqui ? 'você já está aqui!' : rota.viagem ? 'a viagem já deixa você lá.' : '';
  const nomes = c.map(ccNome), cortado = nomes.length > 7 ? [...nomes.slice(0, 3), '…', ...nomes.slice(-3)] : nomes;
  return (rota.mesma ? 'daqui: ' : 'de lá: ') + cortado.join(' → ');
}
function blocoComoChegar(q, compacto) {
  let I = null; try { I = ccInfo(q); } catch (e) { console.warn('como chegar', q.id, e); }
  if (!I) return null;
  const linhas = [];
  if (!I.lugarDe) linhas.push(['👾', 'Quem', `${I.quem}${I.chefe ? ' (chefão)' : ''} — nível ${I.nivel}${I.porItem && ITENS[I.porItem] ? ` (é quem mais deixa cair ${ITENS[I.porItem].nome})` : ''}${I.forte ? ' ⚠️ ainda forte para você' : ''}`]);
  else if (I.quem) linhas.push(['🙋', 'Procure', I.quem + (I.como ? ` (${I.como}${I.porItem && ITENS[I.porItem] && I.como === 'vende' ? ' ' + ITENS[I.porItem].nome : ''})` : '')]);
  // v407 (Raio-X R3): pedido de vários itens = uma fonte por item; e quem mais ajuda (troca, baú, loja)
  if (I.fontes) { const fs = I.fontes.filter(x => x.quem && ITENS[x.item]), mx = compacto ? 2 : 5; if (fs.length) linhas.push(['🎒', 'Cada item', fs.slice(0, mx).map(x => `${ITENS[x.item].nome}: ${x.quem}${x.nivel ? ` (nível ${x.nivel}${x.chefe ? ', chefão' : ''}${x.onde ? ', ' + x.onde : ''})` : ''}`).join(' · ') + (fs.length > mx ? ` · e mais ${fs.length - mx}` : '')]); }
  if (I.tambem && !compacto) linhas.push(['🙋', 'Também', `${I.tambem.nome} (${I.tambem.como})`]);
  linhas.push(['🗺️', 'Onde', `${I.onde}${I.rota && I.rota.regiao && I.rota.regiao !== I.onde ? ` (${I.rota.regiao})` : ''}`]);
  const viagem = I.rota && I.rota.viagem, cam = ccCaminhoTxt(I.rota);
  if (viagem) linhas.push(['🧭', 'Viagem', viagem]);
  if (cam) linhas.push(['🧭', 'Caminho', cam]);
  if (I.parte && !compacto) linhas.push(['📌', 'Lá dentro', I.parte + (I.placa ? `, perto da placa “${I.placa}”` : '')]);
  const box = el('div', { class: 'como-chegar' + (compacto ? ' compacto' : '') }, compacto ? null : el('b', {}, '📍 Onde achar e como chegar'));
  if (compacto) box.append(el('div', {}, linhas.map(([ic, k, v]) => `${ic} ${v}`).join(' · ')));
  else for (const [ic, k, v] of linhas) box.append(el('div', {}, el('span', { class: 'cc-ic' }, ic), el('span', {}, el('b', {}, k + ': '), v)));
  return box;
}
// 1) quando o personagem oferece a missão
{
  const _mmCC = modalMissao;
  modalMissao = function (npc, q) {
    const r = _mmCC.apply(this, arguments);
    try { const fala = document.querySelector('#modalConteudo .fala'), b = blocoComoChegar(q, false); if (fala && b) { const ref = fala.querySelector('.onde-achar') || [...fala.querySelectorAll('p')].find(p => /Objetivo/.test(p.textContent)); if (ref) ref.after(b); else fala.append(b); } } catch (e) { }
    return r;
  };
}
// 2) na conversa, a missão em andamento; 3) na janela Missões (resumido)
{
  const poe = (compacto) => {
    for (const li of document.querySelectorAll('#modalConteudo .linha-item')) {
      if (li.classList.contains('bloq') || li.querySelector('.como-chegar')) continue;
      const titulo = (li.querySelector('.nm b') || {}).textContent; const q = titulo && MISSOES.find(x => x.titulo === titulo); if (!q) continue;
      const st = statusMissao(q); if (st !== 'ativa' && st !== 'disponivel') continue;
      const b = blocoComoChegar(q, compacto); if (b) (li.querySelector('.nm') || li).append(b);
    }
  };
  const _abCC = abrirNPC; abrirNPC = function () { const r = _abCC.apply(this, arguments); try { poe(false); } catch (e) { } return r; };
  const _mmsCC = modalMissoes; modalMissoes = function () { const r = _mmsCC.apply(this, arguments); try { poe(true); } catch (e) { } return r; };
}
// a seta amarela e a etiqueta "🎯 Agora" apontam o MESMO lugar do bloco (o adversário que aparece em vários mapas: o da missão)
{
  const ativaKill = () => { if (MISSOES.some(q => statusMissao(q) === 'pronta')) return null; const q = MISSOES.find(q => statusMissao(q) === 'ativa'); return q && q.req && q.req.kill ? q : null; };
  // v407 (Raio-X R3): missão de ITEM também: a seta vai para a fonte escolhida (perto do seu nível), não para o primeiro adversário da tabela
  // o alvo da missão de item (a seta pede isto a cada quadro: guarda a conta por 1,5 s)
  let ccAlvoItem = { id: null, t: 0, a: null };
  const alvoItem = qi => {
    const agora = performance.now(); if (ccAlvoItem.id === qi.id && agora - ccAlvoItem.t < 1500) return ccAlvoItem.a;
    let a = null; const I = ccInfo(qi);
    if (I && I.mapa) {
      if (I.lugarDe && I.npc) { const n = indice().npc[I.npc]; if (n) a = { mapa: n.mapa, x: n.x, y: n.y, npc: I.npc }; }
      else if (I.tipo) { const o = ccOndeMonstro(I.tipo, qi.req.de === I.tipo ? qi : null); if (o) a = { mapa: o.mapa, x: o.x, y: o.y, tipo: I.tipo }; }
    }
    ccAlvoItem = { id: qi.id, t: agora, a }; return a;
  };
  const ativaItem = () => { if (MISSOES.some(q => statusMissao(q) === 'pronta')) return null; const q = MISSOES.find(q => statusMissao(q) === 'ativa'); return q && q.req && !q.req.kill && (q.req.item || q.req.itens) ? q : null; };
  const _oaCC = objetivoAtual;
  objetivoAtual = function () {
    const r = _oaCC.apply(this, arguments);
    try {
      if (!r || r.ent || !G.save || (typeof TUTORIAL !== 'undefined' && G.save.tut < TUTORIAL.length)) return r;
      const qi = ativaItem(); if (qi) { const a = alvoItem(qi); if (a && !(a.tipo && G.mons.some(m => m.tipo === a.tipo)) && (a.npc || a.mapa !== r.mapa)) return { mapa: a.mapa, x: a.x, y: a.y }; return r; }
      const q = ativaKill(); if (!q || G.mons.some(m => m.tipo === q.req.kill)) return r;
      const o = ccOndeMonstro(q.req.kill, q); if (o && o.mapa !== r.mapa) return { mapa: o.mapa, x: o.x, y: o.y };
    } catch (e) { }
    return r;
  };
  if (typeof objetivoTexto === 'function') {
    const _otCC = objetivoTexto;
    objetivoTexto = function () {
      const r = _otCC.apply(this, arguments);
      try { const q = ativaKill(); if (r && q && !r.pronta) { const o = ccOndeMonstro(q.req.kill, q); if (o) { const [a, b] = progressoMissao(q); r.txt = `${descMissao(q) || q.titulo} (${a}/${b}) — ${ccNome(o.mapa)}`; } } } catch (e) { }
      return r;
    };
  }
}
// a região muda quando você viaja (o caminho é "daqui")
{ const _entCC = entrarMapa; entrarMapa = function () { const r = _entCC.apply(this, arguments); try { if (G.mapa && !G.mapa.interior && G.save) G.save.ultimoMapaFora = G.mapa.id; } catch (e) { } return r; }; }
{
  const st = document.createElement('style');
  st.textContent = `.como-chegar { margin: 6px 0; padding: 6px 8px; border-radius: 8px; background: rgba(60,190,110,.12); border-left: 3px solid #2e9e5a; font-size: 14px; line-height: 1.35; }
  .como-chegar > div { display: flex; gap: 6px; align-items: flex-start; margin-top: 3px; } .como-chegar .cc-ic { flex: none; width: 20px; text-align: center; }
  .como-chegar.compacto { font-size: 12px; padding: 4px 6px; margin-top: 4px; } .como-chegar.compacto > div { display: block; }`;
  document.head.append(st);
}
window.COMO_CHEGAR = { ccInfo, ccRota, ccRegioes, ccOndeMonstro, blocoComoChegar };
