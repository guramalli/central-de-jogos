/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏟️ ARENAS DE VERDADE (v357 — dono: "as arenas são um dos locais mais atrativos das cidades: crie arenas de
   verdade perto do aeroporto, com temática, skin nova nos porteiros e o nome escrito no prédio")
   - Cada arena ganhou um PRÉDIO temático (arte Higgsfield a/arp_<tema>.webp) com o nome na fachada, perto do
     aeroporto da cidade-sede (na Praia, que não tem aeroporto, perto da chegada).
   - A PORTA do prédio leva direto para a arena (a partir do nível mínimo; antes disso ela avisa e não abre).
   - O porteiro fica ao lado da porta, vestido no tema (gorro na Nevasca, nemes nas Pirâmides, neon em Tóquio...),
     e continua mostrando o horário do chefão, os míticos e os itens guardados.
   - O lugar é escolhido na hora de montar o mapa: retângulo livre, fora da rua, sem fechar o caminho para nada
     (mesmas checagens da feirinha). Não coube: fica como antes (só o porteiro).
   Carregar DEPOIS de arenas.js, cidade_arrumada.js e cidades_novas.js (embrulha MAPAS_DEF das cidades-sede).
   ============================================================ */
const ARENA_PREDIO = { arena_terrao: 'arp_terrao', arena_ondas: 'arp_ondas', arena_piramides: 'arp_piramides', arena_neon: 'arp_neon', arena_nevasca: 'arp_nevasca', arena_lendas: 'arp_lendas', arena_copa: 'arp_copa' };
const ARENA_PW = 8, ARENA_PH = 5; // tamanho do prédio em quadradinhos (o desenho é mais alto: sobe pela tela)
for (const spr of Object.values(ARENA_PREDIO)) { if (!ASSET_SET.has(spr)) { ASSETS.push(spr); ASSET_SET.add(spr); } PORTAS[spr] = { x: 0.5, y: 0.96 }; }
// porteiros com o visual do tema
const ARENA_PORTEIRO_LOOK = {
  arena_terrao: { roupa: 'roupa-moletom', corRoupa: '#e8803a', baixo: 'baixo-jeans', chapeu: 'chapeu-bone', chapeuVar: 'bone', pescoco: 'pescoco-apito' },
  arena_ondas: { roupa: 'roupa-regata', corRoupa: '#e83a3a', baixo: 'baixo-praia', chapeu: 'chapeu-panama', chapeuVar: 'panama_miami', rosto: 'rosto-escuros', pescoco: 'pescoco-apito' },
  arena_piramides: { roupa: 'roupa-terno', corRoupa: '#f0dca0', baixo: 'baixo-jeans', chapeu: 'chapeu-coroa', chapeuVar: 'nemes_dourado', pescoco: 'pescoco-medalha' },
  arena_neon: { roupa: 'roupa-couro', corRoupa: '#ff3ad0', baixo: 'baixo-saia', chapeu: 'chapeu-headset', chapeuVar: 'headset_neon', rosto: 'rosto-escuros' },
  arena_nevasca: { roupa: 'roupa-moletom', corRoupa: '#3a7ac8', baixo: 'baixo-moletom', chapeu: 'chapeu-gorro', chapeuVar: 'gorro_alpes', pescoco: 'pescoco-cachecol' },
  arena_lendas: { roupa: 'roupa-terno', corRoupa: '#1a2a5a', baixo: 'baixo-saia', chapeu: 'chapeu-louros', chapeuVar: 'louros_rei', pescoco: 'pescoco-medalha', costas: 'costas-capa' },
  arena_copa: { roupa: 'roupa-futebol', corRoupa: '#2ad96a', baixo: 'baixo-shorts', chapeu: 'chapeu-bone', chapeuVar: 'bone_maraca', rosto: 'rosto-pintura', pescoco: 'pescoco-apito' },
};
for (const a of ARENAS) { const n = NPCS[a.porteiro.id], L = ARENA_PORTEIRO_LOOK[a.id]; if (n && L) { n.look = Object.assign({}, n.look, L); } }
// o porteiro do Terrão deixa a bilheteria da feirinha: agora ele fica na porta da arena de verdade
if (typeof FEIRA_BARRACAS !== 'undefined') delete FEIRA_BARRACAS.port_terrao;

// enfeites que podem sair para a arena caber (nunca prédio, cerca, placa, baú ou rua)
const ARENA_DECOR = new Set(['arvore', 'arbusto', 'coqueiro', 'coqueiro2', 'mangueira', 'ipe_amarelo', 'ipe_roxo', 'canteiro', 'roseira', 'rede', 'banco', 'lixeira', 'lixeira2', 'vaso', 'toalha', 'kit_praia', 'guarda_sol', 'cone_deco', 'grafite', 'flor', 'flores', 'pedra', 'rochas', 'tufo',
  'poste', 'poste2', 'poste3', 'hidrante', 'caixa_correio', 'bicicletario', 'orelhao', 'maquina', 'carro', 'carro2', 'rede']);
// altura dos desenhos (altura/largura da arte) dos prédios das cidades-sede: o desenho sobe acima do "pé" do prédio
const ARTE_PROP = {"b_ap1":1.26,"b_padaria":0.86,"b_ap2":1.19,"b_aeroporto":0.69,"b_loja":0.76,"ent_metro":0.96,"fe_oficina":1.09,"fe_atelie":1.05,"fe_imobiliaria":1.08,"fe_marcenaria":1,"fe_frutas":0.96,"ct_chute":0.83,"ct_academia":0.77,"ct_cones2":0.31,"ct_quadro":0.95,"b_pastelaria":0.89,"b_mercadinho":0.96,"b_cinema":0.99,"b_predio_cid":1.28,"ent_gruta_praia":0.97,"b_pescador_azul":0.87,"b_pescador_rosa":1.01,"b_escola_surf":0.85,"b_salva_vidas":1.13,"b_cairo1":1.07,"b_cairo2":0.85,"b_cairo3":1.49,"b_cairo5":1,"b_cairo6":0.97,"b_cairo4":1.01,"ent_tumba":0.94,"est_cairo":0.72,"mon_esfinge":0.79,"ent_bazar":1.09,"b_toquio2":0.88,"b_toquio6":1.02,"b_toquio3":1.44,"b_toquio1":0.7,"b_toquio4":1.02,"b_toquio5":0.84,"ent_torii":1.02,"est_toquio":0.7,"mon_toquio":2.02,"ent_dojo":1.09,"b_munique1":0.9,"b_munique2":0.9,"b_munique3":1.2,"b_munique5":0.96,"b_munique6":1.12,"b_munique4":1.04,"ent_gelo":1.01,"est_munique":0.68,"mon_rathaus":1.34,"ent_relogio":1.44,"b_londres1":1.24,"b_londres4":1.09,"b_londres6":1.25,"b_londres5":1.19,"b_londres3":1.14,"ent_bueiro":0.75,"est_londres":0.72,"mon_bigben":1.73,"b_rio3":1.51,"b_rio5":1.34,"b_rio1":1.39,"b_rio6":1.33,"b_rio2":1.43,"b_rio4":1.19,"ent_cristal":1.03,"ent_celeste":1.16,"est_rio":0.72,"mon_cristo":1.44,"mon_paodeacucar":0.85,"ent_barracao":0.98};
function topoDesenho(p) { // linha (em quadradinhos) onde começa o desenho do prédio, igual ao desenhaPredio do game.js
  // v407 (Raio-X A2): só lê a arte se ela JÁ chegou (antes pedia ~25 prédios de várias cidades ainda na tela inicial, só para medir)
  const e = typeof SPR !== 'undefined' && SPR[p.spr], im = e && e.ok ? e.im : null, prop = im ? im.height / im.width : ARTE_PROP[p.spr] || 1.5;
  const py = (PORTAS[p.spr] || { y: 0.95 }).y, porta = p.porta || { y: p.y + p.h - 1 };
  return porta.y + 1 - py * (p.w + 0.5) * prop;
}
function colocaArenaPredio(m, a, leve) {
  const spr = ARENA_PREDIO[a.id]; if (!spr) return false;
  const W = m.w, H = m.h, i = (x, y) => y * W + x;
  const ruas = typeof faixasRua === 'function' && typeof tiposRua === 'function' ? faixasRua(m, tiposRua(m.id)).tipo : null;
  const livreObj = (x, y) => { const o = m.obj[i(x, y)]; return !o || (leve && !o.predio && ARENA_DECOR.has(o.t)); };
  const ok = (x, y) => x > 1 && y > 1 && x < W - 2 && y < H - 2 && livreObj(x, y) && CH_ANDA(m.chao[i(x, y)]) && m.chao[i(x, y)] !== CH.AGUA && !(ruas && ruas[i(x, y)])
    && !m.saidas.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1) && !m.npcs.some(n => n.id !== a.porteiro.id && Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1)
    && !m.campos.some(c => x >= c.x - 1 && x <= c.x + c.w && y >= c.y - 1 && y <= c.y + c.h) && !m.predios.some(p => x >= p.x - 1 && x <= p.x + p.w && y >= p.y - 2 && y <= p.y + p.h) // (o desenho dos prédios sobe pela tela: perto demais, cobre a porta da arena)
    && (leve || !m.spawns.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1)); // 2ª tentativa: o ponto de nascer muda de lugar (abaixo)
  const aero = m.predios.find(p => p.spr === 'b_aeroporto'), ref = aero ? { x: aero.x + aero.w / 2, y: aero.y + aero.h / 2 } : (m.renasce || m.inicio || { x: W >> 1, y: H >> 1 });
  const cands = [];
  // 2ª tentativa: também um prédio um pouco menor (7×4), se ficar bem mais perto do aeroporto (vale 6 quadradinhos de "desconto")
  for (const [w, h] of leve ? [[ARENA_PW, ARENA_PH], [7, 4]] : [[ARENA_PW, ARENA_PH]]) for (let y = 3; y < H - h - 3; y++) for (let x = 2; x < W - w - 2; x++) {
    const d = Math.hypot(x + w / 2 - ref.x, y + h / 2 - ref.y); if (d > (leve ? 70 : 20)) continue;
    let bom = true; for (let yy = y - 1; yy <= y + h && bom; yy++) for (let xx = x - 1; xx <= x + w && bom; xx++) if (!ok(xx, yy)) bom = false; // + a calçada da frente livre
    // e nenhum prédio logo ABAIXO cujo desenho (que sobe pela tela) cubra a frente da arena
    if (bom && m.predios.some(p => p.x < x + w + 1 && p.x + p.w > x - 1 && p.y >= y + h && topoDesenho(p) < y + h)) bom = false; // (pode encostar na calçada, nunca na porta)
    if (bom) cands.push({ x, y, w, h, d: d + (w < ARENA_PW ? 6 : 0) });
  }
  cands.sort((p, q) => p.d - q.d);
  let inicio = m.renasce || m.inicio; if (!inicio || typeof alcancaveis !== 'function') return false;
  { // (na Praia o ponto de renascer caiu em cima de um vaso: a busca de caminho começa do quadradinho livre mais perto)
    const livre = (x, y) => x >= 0 && y >= 0 && x < W && y < H && CH_ANDA(m.chao[i(x, y)]) && !m.obj[i(x, y)];
    if (!livre(inicio.x, inicio.y)) for (let r = 1, achou = false; r < 6 && !achou; r++) for (let dy = -r; dy <= r && !achou; dy++) for (let dx = -r; dx <= r && !achou; dx++) if (livre(inicio.x + dx, inicio.y + dy)) { inicio = { x: inicio.x + dx, y: inicio.y + dy }; achou = true; }
  }
  const imp = pontosImportantes(m).filter(pt => alcancaveis(m, inicio)[pt.y * W + pt.x]);
  for (const { x, y, w, h } of cands.slice(0, 60)) {
    const marcas = [], px = x + (w >> 1), tirados = [];
    if (leve) for (let yy = y - 1; yy <= y + h; yy++) for (let xx = x - 1; xx <= x + w; xx++) { const o = m.obj[i(xx, yy)]; if (o && ARENA_DECOR.has(o.t)) { tirados.push([i(xx, yy), o]); m.obj[i(xx, yy)] = null; } }
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { marcas.push(i(xx, yy)); m.obj[i(xx, yy)] = { t: 'x', v: 0, predio: true }; }
    m.obj[i(px, y + h - 1)] = null; // a porta
    const dep = alcancaveis(m, inicio);
    if (imp.every(pt => dep[pt.y * W + pt.x]) && dep[i(px, y + h)] && dep[i(px + 2, y + h)]) {
      // tira o porteiro (e a placa dele) de onde estava
      const velho = m.npcs.find(n => n.id === a.porteiro.id);
      if (velho) { const pl = m.placas.findIndex(p => p.x === velho.x + 1 && p.y === velho.y && /ARENA/.test(p.texto)); if (pl >= 0) { const p = m.placas[pl]; if (m.obj[i(p.x, p.y)] && m.obj[i(p.x, p.y)].t === 'placa') m.obj[i(p.x, p.y)] = null; m.placas.splice(pl, 1); } }
      m.npcs = m.npcs.filter(n => n.id !== a.porteiro.id);
      m.predios.push({ spr, x, y, w, h, porta: { x: px, y: y + h - 1 }, arenaPredio: a.id });
      m.saidas.push({ x: px, y: y + h - 1, para: a.id, porta: true, req: { flag: 'arena_lib_' + a.id, msg: `🔒 ${a.nome}: the doors open from level ${a.req}. Talk to the doorman!` } });
      m.npcs.push({ id: a.porteiro.id, x: px + 2, y: y + h });
      m.obj[i(px - 2, y + h)] = { t: 'placa', v: 1 }; m.placas.push({ x: px - 2, y: y + h, texto: `🏟️ ${a.nome.toUpperCase()} — boss: ${a.chefe.nome} (level ${a.req}+). Go in through the door; the doorman tells you the schedule.` });
      a.porta = { x: px, y: y + h - 1 }; // a saída da arena volta para a frente da porta
      // pontos onde nascem adversários e que ficaram dentro/colados na arena: vão para o quadradinho livre mais perto
      for (const sp of m.spawns) if (sp.x >= x - 1 && sp.x <= x + w && sp.y >= y - 1 && sp.y <= y + h) {
        let melhor = null;
        for (let r = 2; r < 12 && !melhor; r++) for (let dy = -r; dy <= r && !melhor; dy++) for (let dx = -r; dx <= r && !melhor; dx++) {
          const nx = sp.x + dx, ny = sp.y + dy; if (nx >= x - 2 && nx <= x + w + 1 && ny >= y - 2 && ny <= y + h + 1) continue;
          if (nx > 1 && ny > 1 && nx < W - 2 && ny < H - 2 && CH_ANDA(m.chao[i(nx, ny)]) && !m.obj[i(nx, ny)] && dep[i(nx, ny)]) melhor = { x: nx, y: ny };
        }
        if (melhor) { sp.x = melhor.x; sp.y = melhor.y; }
      }
      return true;
    }
    for (const k of marcas) m.obj[k] = null;
    for (const [k, o] of tirados) m.obj[k] = o; // não serviu: os enfeites voltam
  }
  if (!leve) return colocaArenaPredio(m, a, true); // 2ª tentativa: pode tirar árvores e enfeites do lugar
  console.warn('arena sem lugar em', m.id); return false;
}
for (const a of ARENAS) {
  const base = MAPAS_DEF[a.host];
  MAPAS_DEF[a.host] = function () { const m = base.apply(this, arguments); try { colocaArenaPredio(m, a); } catch (e) { console.warn('arena', a.id, e); } return m; };
}
// a porta abre pelo nível (a trava de saída usa uma "flag")
setInterval(() => { try { const s = G.save; if (!s || !G.rodando) return; for (const a of ARENAS) if (s.nivel >= a.req && !s.flags['arena_lib_' + a.id]) s.flags['arena_lib_' + a.id] = true; } catch (e) { } }, 2000);
// entrou pela porta: o mesmo aviso que o porteiro dá
{
  const _entraAr = entrarMapa;
  entrarMapa = function (id) {
    const r = _entraAr.apply(this, arguments);
    try { const a = typeof ARENA_POR_ID !== 'undefined' && ARENA_POR_ID[id]; if (a && typeof chefeEmCampo === 'function') banner(`🏟️ ${a.nome}`, chefeEmCampo(a) ? `${a.chefe.nome} is on the field!` : statusArenaTxt(a).txt); } catch (e) { }
    return r;
  };
}
// a chegada da arena (e o corredor até a saída) nunca fica embaixo de um enfeite sorteado — na Nevasca caía um poste em cima
for (const a of ARENAS) {
  const base = MAPAS_DEF[a.id]; if (!base) continue;
  MAPAS_DEF[a.id] = function () {
    const m = base.apply(this, arguments);
    try { const c = m.inicio; if (c) for (let y = c.y - 1; y < m.h - 1; y++) for (let x = c.x - 1; x <= c.x + 1; x++) { const o = m.obj[y * m.w + x]; if (o && o.t !== 'placa' && o.t !== 'x' && !o.predio) m.obj[y * m.w + x] = null; } } catch (e) { }
    return m;
  };
}
