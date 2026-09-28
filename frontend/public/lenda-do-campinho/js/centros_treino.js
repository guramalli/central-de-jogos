/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏋️ CENTROS DE TREINAMENTO (v169): em cada cidade, uma fileira de
   aparelhos. Clique num aparelho (ou chegue perto e aperte E) e o seu
   personagem fica treinando UMA habilidade até você andar:
     🎯 Boneco de Chute → Chute        🏋️ Academia → Defesa (força)
     🔶 Circuito de Cones → Drible     🧠 Quadro Tático → Visão de jogo
   O ritmo é o mesmo do boneco de treino (1 tentativa a cada 1,5 s; a visão
   ganha 3, como gastar foco). Vale para o Modo Treino e o treino offline.
   Carregar DEPOIS de monumentos.js (o centro procura lugar no mapa pronto).
   ============================================================ */
const APARELHOS = {
  chute: { spr: 'ct_chute', sk: 'chute', nome: 'Boneco de Chute', ic: '🎯', ar: 0.83, n: 1, txt: 'Chute de longe no boneco' },
  defesa: { spr: 'ct_academia', sk: 'defesa', nome: 'Academia', ic: '🏋️', ar: 0.77, n: 1, txt: 'Supino e halteres: força para aguentar as divididas' },
  drible: { spr: 'ct_cones2', sk: 'drible', nome: 'Circuito de Cones', ic: '🔶', ar: 0.311, n: 1, txt: 'Zigue-zague com a bola entre os cones' },
  visao: { spr: 'ct_quadro', sk: 'visao', nome: 'Quadro Tático', ic: '🧠', ar: 0.948, n: 3, txt: 'Estudar jogadas no quadro' },
};
const ORDEM_EST = ['chute', 'defesa', 'drible', 'visao'];
const EST_CD = 1200; // v195: treinar ONLINE no aparelho rende 2,5x o treino offline (o boneco comum: 2x)
// onde fica o centro (coordenada de projeto, antes do "espalha"); sem ref = perto de onde a pessoa chega
const CENTROS_TREINO = { vila: [12, 22], ct: [8, 31], praia: null, cidade: null, cairo: null, toquio: null, doha: null, miami: null, lisboa: null, madri: null, milao: null, munique: null, londres: null, paris: null, buenos: null, rio: null, santos: null };
for (const e of Object.values(APARELHOS)) {
  if (!ASSET_SET.has(e.spr)) { ASSETS.push(e.spr); ASSET_SET.add(e.spr); }
  const W = 2.5, H = W * e.ar;
  PORTAS[e.spr] = { x: 0.3, y: 1 - 0.12 / H }; // desenho centrado nos 2 quadros da base
  e.alto = Math.max(0, Math.ceil(H * 0.97 - 1));
}

// v195: o setor fica no CHÃO DO PRÓPRIO LUGAR (praça, calçada, areia, terra...), sem pintar grama e sem moldura.
// Regras (o dono pediu mais critério): só num pedaço de um tipo de chão só — o chão principal do mapa, nunca rua
// nem caminho —, com 1 quadro de folga em volta; longe de prédios, quadras, pessoas, saídas e de onde os
// adversários valentes andam e atacam. Formatos: fileira (15×6) ou, se não couber, 2×2 (9×10). Não coube: o mapa
// fica sem centro (melhor que feio). Ambientação: um bebedouro e uma sacola de bolas nas pontas.
const CT_FORMATOS = [
  { W: 15, H: 6, est: [[2, 1], [5, 1], [8, 1], [11, 1]], bonecos: [[3, 4], [7, 4], [11, 4]], placa: [0, 2], enfeites: [['bebedouro', 0, 1], ['sacola_bolas', 14, 1]] },
  { W: 9, H: 10, est: [[1, 1], [5, 1], [1, 5], [5, 5]], bonecos: [[2, 8], [6, 8]], placa: [0, 3], enfeites: [['bebedouro', 8, 1], ['sacola_bolas', 8, 5]] },
  { W: 12, H: 3, est: [[1, 1], [4, 1], [7, 1], [10, 1]], bonecos: [], placa: [0, 2], enfeites: [['bebedouro', 0, 1]] }, // cidade apertada: só a fileira dos aparelhos
];
function poeCentroTreino(m, refProj) {
  const i = (x, y) => y * m.w + x;
  const cid = typeof CIDADES !== 'undefined' && CIDADES.find(k => k.id === m.id);
  // enfeite/mobiliário solto de praça pode sair de dentro do setor (rede de vôlei, baú, placa e prédio, nunca)
  const deco = new Set(['arvore', 'arvore2', 'arbusto', 'pedra', 'flores', 'vaso', 'vaso2', 'lixeira', 'lixeira2', 'banco', 'banco2', 'cones', 'barreiras', 'sacola_bolas',
    'poste', 'poste2', 'poste3', 'canteiro', 'caixa_correio', 'hidrante', 'coqueiro', 'coqueiro2', 'guarda_sol', ...(cid ? [...(cid.props || []), ...(cid.arvores || [])] : [])]);
  const placaVelha = new Set(m.placas.filter(pl => /^TREINO LIVRE/.test(pl.texto)).map(pl => i(pl.x, pl.y)));
  const solto = k => { const o = m.obj[k]; return !o || (deco.has(o.t) && !o.predio) || (o.t === 'placa' && placaVelha.has(k)); };
  // o chão principal do mapa (o mais comum que dá para andar, fora água e rua)
  const ruas = typeof tiposRua === 'function' ? tiposRua(m.id) : new Set([CH.ASFALTO]);
  const conta = {}; for (const c of m.chao) if (CH_ANDA(c) && c !== CH.AGUA && !ruas.has(c)) conta[c] = (conta[c] || 0) + 1;
  const base = +Object.keys(conta).sort((a, b) => conta[b] - conta[a])[0];
  const FAMILIA = [[CH.GRAMA, CH.GRAMA_FLOR]]; // grama com florzinha é o mesmo gramado
  const fam = FAMILIA.find(f => f.includes(base)) || [base];
  const noChao = (x, y) => x >= 1 && y >= 1 && x < m.w - 1 && y < m.h - 1 && fam.includes(m.chao[i(x, y)]);
  const dp = refProj && typeof dimProjeto === 'function' && dimProjeto(m.id);
  const inicio = m.renasce || m.inicio || { x: m.w >> 1, y: m.h >> 1 };
  const ref = refProj ? (dp ? { x: escalaCoord(refProj[0], dp[0], tamNovo(dp[0])), y: escalaCoord(refProj[1], dp[1], tamNovo(dp[1])) } : { x: refProj[0], y: refProj[1] }) : inicio;
  const cruza = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const pontosIn = (V, lista) => lista.some(p => p.x >= V[0] && p.x < V[2] && p.y >= V[1] && p.y < V[3]);
  const alto = Math.max(...ORDEM_EST.map(k => APARELHOS[k].alto));
  const treino = s => MONSTROS[s.m] && MONSTROS[s.m].treino;
  const antes = alcancaveis(m, inicio), importantes = pontosImportantes(m).filter(pt => antes[pt.y * m.w + pt.x]);
  for (const F of CT_FORMATOS) {
    const cands = [];
    for (let Y = alto + 2; Y < m.h - F.H - 2; Y++) for (let X = 2; X < m.w - F.W - 2; X++) {
      let ok = true;
      // por dentro: um tipo de chão só e nada fixo; a volta: qualquer piso de andar, mas nunca rua nem água
      for (let j = Y - 1; j <= Y + F.H && ok; j++) for (let k = X - 1; k <= X + F.W && ok; k++) {
        const dentro = j >= Y && j < Y + F.H && k >= X && k < X + F.W, c = m.chao[i(k, j)];
        if (dentro ? (!noChao(k, j) || !solto(i(k, j))) : (!CH_ANDA(c) || c === CH.AGUA || ruas.has(c) || (m.obj[i(k, j)] && !solto(i(k, j))))) ok = false;
      }
      for (let j = Y - 2; j <= Y + F.H + 1 && ok; j++) for (let k = X - 2; k <= X + F.W + 1 && ok; k++) if (j >= 0 && k >= 0 && j < m.h && k < m.w && ruas.has(m.chao[i(k, j)])) ok = false; // longe da rua
      // logo abaixo do setor não pode ter nada fixo e grande: o desenho sobe e cobre os aparelhos (ex.: a pirâmide do Cairo)
      for (let j = Y + F.H + 1; j <= Y + F.H + 5 && ok; j++) for (let k = X - 8; k <= X + F.W + 7 && ok; k++) {
        const o = j < m.h && k >= 0 && k < m.w && m.obj[i(k, j)]; if (!o || o.t === 'x' || solto(i(k, j)) || !OBJ_INFO[o.t] || OBJ_INFO[o.t].w < 1.5) continue;
        const meia = OBJ_INFO[o.t].w / 2; if (k + 0.5 + meia > X - 1 && k + 0.5 - meia < X + F.W + 1) ok = false; // a largura do desenho alcança o setor
      }
      if (!ok) continue;
      const V = [X - 1, Y + 1 - alto, X + F.W + 1, Y + F.H + 1];
      const V3 = [V[0] - 2, V[1] - 2, V[2] + 2, V[3] + 2], V4 = [V[0] - 4, V[1] - 4, V[2] + 4, V[3] + 4]; // pessoas a 2; saídas/entradas de dungeon a 4
      if (m.predios.some(p => p.interior && cruza(V4, [p.x, p.y - (p.alto || 3), p.x + p.w, p.y + p.h]))) continue;
      if (pontosIn(V3, m.npcs) || pontosIn(V4, m.saidas) || pontosIn(V, m.placas.filter(pl => !/^TREINO LIVRE/.test(pl.texto))) || pontosIn(V, m.pontos)) continue;
      if (m.campos.some(c => cruza(V, [c.x - 1, c.y - 1, c.x + c.w + 1, c.y + c.h + 1]))) continue;
      if ((m.zonas || []).some(z => cruza(V, [z.x - 1, z.y - 1, z.x + z.w + 1, z.y + z.h + 1]))) continue;
      if (m.predios.some(p => cruza(V, [p.x - 1, p.y - (p.alto || 3) - 1, p.x + p.w + 1, p.y + p.h + 1]))) continue; // nem colado, nem escondido atrás do prédio
      if (m.spawns.some(s => { if (treino(s)) return false; const r = (s.raio || 0) + 1; return s.x >= V[0] - r && s.x < V[2] + r && s.y >= V[1] - r && s.y < V[3] + r; })) continue; // fora de onde os bichos passeiam (o setor é zona segura: zona_segura.js)
      cands.push({ X, Y, d: Math.hypot(X + F.W / 2 - ref.x, Y + F.H / 2 - ref.y) });
    }
    cands.sort((a, b) => a.d - b.d);
    for (const { X, Y } of cands.slice(0, 30)) {
      const guarda = [], marca = (k, o) => { guarda.push([k, m.obj[k]]); m.obj[k] = o; };
      for (let j = Y - 1; j <= Y + F.H; j++) for (let k = X - 1; k <= X + F.W; k++) if (m.obj[i(k, j)]) marca(i(k, j), null); // tira os enfeites soltos de dentro e da volta (árvore/guarda-sol colado cobria os aparelhos)
      for (const [dx, dy] of F.est) for (let k = 0; k < 2; k++) marca(i(X + dx + k, Y + dy), { t: 'x', v: 0, predio: true });
      for (const [t, dx, dy] of F.enfeites) marca(i(X + dx, Y + dy), { t, v: 0 });
      marca(i(X + F.placa[0], Y + F.placa[1]), { t: 'placa', v: 1 });
      const depois = alcancaveis(m, inicio);
      if (F.est.every(([dx, dy]) => depois[i(X + dx, Y + dy + 1)]) && importantes.every(pt => depois[pt.y * m.w + pt.x])) {
        ORDEM_EST.forEach((k, e) => { const d = APARELHOS[k], [dx, dy] = F.est[e]; m.predios.push({ spr: d.spr, x: X + dx, y: Y + dy, w: 2, h: 1, porta: { x: X + dx, y: Y + dy }, alto: d.alto, estacao: k }); });
        // os bonecos de treino antigos (soltos pelo mapa) vêm para dentro do setor (se o formato tiver lugar para eles)
        if (F.bonecos.length) {
          m.spawns = m.spawns.filter(s => !treino(s));
          for (const pl of m.placas.filter(pl => /^TREINO LIVRE/.test(pl.texto))) { if (m.obj[i(pl.x, pl.y)] && m.obj[i(pl.x, pl.y)].t === 'placa') m.obj[i(pl.x, pl.y)] = null; }
          m.placas = m.placas.filter(pl => !/^TREINO LIVRE/.test(pl.texto));
        }
        for (const [dx, dy] of F.bonecos) m.spawns.push({ m: 'boneco', x: X + dx, y: Y + dy, qtd: 1, raio: 0 });
        m.placas.push({ x: X + F.placa[0], y: Y + F.placa[1], texto: '🏋️ CENTRO DE TREINAMENTO — clique num aparelho para treinar: 🎯 Boneco = Chute · 🏋️ Academia = Defesa · 🔶 Cones = Drible · 🧠 Quadro tático = Visão de jogo. Treina até você andar.' + (F.bonecos.length ? ' Os bonecos de treino: bata no modo Drible ou Chute.' : '') });
        m.centroTreino = { x: X + F.est[0][0], y: Y + F.H / 2, X, Y, W: F.W, H: F.H };
        return true;
      }
      for (let g = guarda.length - 1; g >= 0; g--) m.obj[guarda[g][0]] = guarda[g][1]; // fecharia algum caminho: desfaz
    }
  }
  console.warn('centro de treinamento sem lugar:', m.id); return false;
}
for (const [id, ref] of Object.entries(CENTROS_TREINO)) {
  const base = MAPAS_DEF[id]; if (!base) continue;
  MAPAS_DEF[id] = function () { const m = base(); try { poeCentroTreino(m, ref); } catch (e) { console.error('centro de treino', id, e); } return m; };
}
// no mapa (tecla M): a legenda "Centro de Treinamento" e o nome ao passar o mouse
if (typeof desenhaMarcadores === 'function') {
  const _marcCt = desenhaMarcadores;
  desenhaMarcadores = function (x, tx, ty, e, grande) {
    const r = _marcCt.apply(this, arguments);
    const c = G.mapa && G.mapa.centroTreino;
    if (c && c.X != null && grande && typeof rotuloMini === 'function') rotuloMini(x, '🏋️ Centro de Treinamento', tx(c.X + c.W / 2), ty(c.Y + c.H / 2), e * 0.95, '#b8ffb0');
    return r;
  };
}
if (typeof oQueTemNoMapa === 'function') {
  const _oqCt = oQueTemNoMapa;
  oQueTemNoMapa = function (wx, wy, raio) {
    const r = _oqCt.apply(this, arguments); const c = G.mapa && G.mapa.centroTreino;
    if (c && c.X != null && wx >= c.X - 0.5 && wx <= c.X + c.W + 0.5 && wy >= c.Y - 1 && wy <= c.Y + c.H + 0.5 && r.length < 3) r.push('🏋️ Centro de Treinamento — aparelhos para treinar Chute, Defesa, Drible e Visão');
    return r;
  };
}
/* ---------- treinar ---------- */
const frenteEst = b => ({ x: b.x + 1, y: b.y + 1.5 });
function estacaoPerto(raio = 1.3) {
  if (!G.mapa || !G.p) return null;
  let melhor = null, md = raio;
  for (const b of G.mapa.predios) if (b.estacao) { const d = dist(frenteEst(b), G.p); if (d <= md) { md = d; melhor = b; } }
  return melhor;
}
function comecaEstacao(b) {
  const d = APARELHOS[b.estacao]; if (!d || !G.save || G.save.hp <= 0) return;
  G.alvo = null; G.caminho = null; G.teclas && G.teclas.clear();
  G.estTreino = { b, d, x0: G.p.x, y0: G.p.y, prox: G.agora + 400 };
  G.p.flip = b.x + 1 < G.p.x;
  log(`${d.ic} Treinando ${SKILLS[d.sk].nome} no ${d.nome}. Ande para parar.`, 'l-xp');
  dica('centro_treino', `${d.ic} ${d.nome}: seu personagem fica treinando ${SKILLS[d.sk].nome} sozinho até você andar. Vai deixar treinando? Ligue o Modo Treino (☰ Mais → 🏋️ Treino) para o calendário do clube parar.`);
  G.uiSujo = true; chipEstacao();
}
function paraEstacao(msg) {
  if (!G.estTreino) return;
  G.estTreino = null; if (msg) log(msg, 'l-sis'); chipEstacao();
}
function tickEstacao() {
  const t = G.estTreino, p = G.p, b = t.b, d = t.d, alvo = { x: b.x + 1, y: b.y + 0.6 };
  treinaSkill(d.sk, d.n); p.flip = alvo.x < p.x; t.anim = G.agora;
  if (d.sk === 'chute') { p.golpe = G.agora; som('chute'); projetil(p, { x: b.x + 0.55, y: b.y + 0.55 }, 'bola', () => { b.hitT = G.agora; efeito('toque', b.x + 0.55, b.y + 0.2); }); }
  else if (d.sk === 'drible') { som('toque'); efeito('toque', p.x + (Math.random() < 0.5 ? -0.3 : 0.3), p.y); }
  else if (d.sk === 'defesa') { if (Math.random() < 0.35) texto(p, '💪', '#ffd24a', 700); }
  else if (Math.random() < 0.35) texto(p, '💡', '#ffe98a', 700);
  chipEstacao();
}
(function () {
  const _atualizaEst = atualiza;
  atualiza = function (dt) {
    const r = _atualizaEst.apply(this, arguments);
    const t = G.estTreino;
    if (t) {
      const p = G.p;
      if (!G.mapa || !G.mapa.predios.includes(t.b) || !G.save || G.save.hp <= 0) paraEstacao();
      else if (Math.hypot(p.x - t.x0, p.y - t.y0) > 0.3 || (G.caminho && G.caminho.length) || (G.alvo && G.mons.includes(G.alvo))) paraEstacao(`Você parou de treinar ${SKILLS[t.d.sk].nome}.`);
      else if (!G.pausado && G.agora >= t.prox) { t.prox = G.agora + EST_CD; tickEstacao(); }
    }
    return r;
  };
  // clique no aparelho: vai até a frente dele e começa
  const _cliqueEst = cliqueTela;
  cliqueTela = function (ev) {
    if (G.rodando && !G.pausado && G.mapa) {
      const w = mundoDoMouse(ev);
      if (!entNoPonto(w)) {
        const tx = Math.floor(w.x), ty = Math.floor(w.y);
        const b = G.mapa.predios.find(b => b.estacao && tx >= b.x && tx < b.x + b.w && ty >= b.y - b.alto && ty <= b.y);
        if (b) { const f = frenteEst(b); return irE(f.x, f.y, 0.6, () => comecaEstacao(b)); }
      }
    }
    return _cliqueEst.apply(this, arguments);
  };
  // tecla E / botão Falar perto do aparelho
  const _interacaoEst = interacaoPerto;
  interacaoPerto = function () {
    const it = _interacaoEst.apply(this, arguments);
    const b = G.p && G.save && G.save.hp > 0 && estacaoPerto(1.3);
    if (b && (!it || dist(frenteEst(b), G.p) < dist(it, G.p))) { const d = APARELHOS[b.estacao]; return { tipo: 'estacao', b, x: b.x + 1, y: b.y + 0.9, alt: b.alto + 0.4, txt: G.estTreino && G.estTreino.b === b ? 'Parar de treinar' : `Treinar ${SKILLS[d.sk].nome}` }; }
    return it;
  };
  const _interagirEst = interagir;
  interagir = function () {
    const it = interacaoPerto();
    if (it && it.tipo === 'estacao') { if (G.estTreino && G.estTreino.b === it.b) return paraEstacao('Você parou de treinar.'); return comecaEstacao(it.b); }
    return _interagirEst.apply(this, arguments);
  };
  // treino offline também vale perto de um centro
  if (typeof pertoDeBoneco === 'function') { const _pertoEst = pertoDeBoneco; pertoDeBoneco = function () { return _pertoEst.apply(this, arguments) || !!(G.mapa && G.mapa.predios.some(b => b.estacao && dist(frenteEst(b), G.p) < 5)); }; }
  // o boneco balança quando a bola acerta
  const _desenhaPredioEst = desenhaPredio;
  desenhaPredio = function (ctx, b) {
    if (b.estacao && b.hitT && G.agora - b.hitT < 260) { const k = Math.sin((G.agora - b.hitT) / 260 * Math.PI * 3) * (1 - (G.agora - b.hitT) / 260); ctx.save(); ctx.translate(k * 3, 0); _desenhaPredioEst.apply(this, arguments); ctx.restore(); return; }
    return _desenhaPredioEst.apply(this, arguments);
  };
  // animação do personagem: academia (levanta a barra), cones (bola no zigue-zague), quadro (fica olhando)
  const _desenhaEntEst = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    const t = G.estTreino;
    if (e !== G.p || !t || t.d.sk === 'chute' || t.d.sk === 'visao') return _desenhaEntEst.apply(this, arguments);
    const alt = alturaEnt(e) * T, fase = (G.agora % EST_CD) / EST_CD;
    if (t.d.sk === 'defesa') {
      const sobe = Math.sin(fase * Math.PI * 2) * 0.5 + 0.5; // sobe e desce uma vez por repetição
      _desenhaEntEst.apply(this, arguments);
      // um halter em cada mão, subindo do quadril até o ombro (rosca)
      const y = e.y * T - alt * (0.3 + 0.26 * sobe), x = e.x * T, hw = 0.13 * T;
      ctx.save(); ctx.lineCap = 'round';
      for (const sd of [-1, 1]) {
        const cx = x + sd * 0.3 * T;
        ctx.strokeStyle = '#55555f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - hw, y); ctx.lineTo(cx + hw, y); ctx.stroke();
        ctx.fillStyle = sd < 0 ? '#d8453a' : '#3a78d8'; for (const pl of [-1, 1]) { ctx.beginPath(); ctx.roundRect(cx + pl * hw - 3.5, y - 6, 7, 12, 2.5); ctx.fill(); }
      }
      ctx.restore(); return;
    }
    // drible: o personagem gira de um lado para o outro com a bola no pé
    const lado = Math.sin(fase * Math.PI * 2), ox = lado * 0.22;
    const g = { x: e.x, mov: e.mov, fase: e.fase }; e.x = g.x + ox; e.flip = lado < 0; e.mov = true; e.fase = G.agora / 90;
    _desenhaEntEst.apply(this, arguments); e.x = g.x; e.mov = g.mov; e.fase = g.fase; const x0 = g.x;
    if (typeof desenhaProjetil === 'function') desenhaProjetil(ctx, 'bola', (x0 + ox + (lado < 0 ? -0.28 : 0.28)) * T, (e.y - 0.05) * T, fase);
  };
})();

// nome do aparelho e o que ele treina, só quando o jogador está perto (sem poluir a cidade)
{
  const _desenhaEst = desenha;
  desenha = function (dt) {
    const r = _desenhaEst.apply(this, arguments);
    const m = G.mapa, p = G.p; if (!m || !p || !m.centroTreino || Math.abs(p.y - m.centroTreino.y) > 6) return r;
    const ctx = CTX, z = G.zoom; ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const b of m.predios) {
      if (!b.estacao) continue; const f = frenteEst(b); const df = dist(f, p); if (df > 3.2 || df <= 1.3) continue; // bem perto, a dica do E já mostra
      const d = APARELHOS[b.estacao], x = ((b.x + 1) * T - G.cam.x) * z, y = ((b.y - b.alto + 0.3) * T - G.cam.y) * z;
      rotulo(ctx, `${d.ic} ${d.nome} · ${SKILLS[d.sk].nome}`, x, y, '#ffe98a', 12);
    }
    return r;
  };
}
/* ---------- aviso na tela enquanto treina ---------- */
function chipEstacao() {
  let c = document.getElementById('chipEstacao'); const t = G.estTreino;
  if (!t) { if (c) c.remove(); return; }
  if (!c) { c = el('div', { id: 'chipEstacao', class: 'chip-estacao' }); document.body.append(c); c.onclick = () => paraEstacao('Você parou de treinar.'); }
  const o = G.save.sk[t.d.sk], pc = Math.min(99, Math.floor(o.t / precisaTentativas(t.d.sk, o.lv) * 100));
  c.innerHTML = ''; c.title = 'Clique (ou ande) para parar';
  const r = CV.getBoundingClientRect(); c.style.left = (r.left + r.width / 2) + 'px'; c.style.top = (r.top + (innerWidth <= 600 ? 34 : 42)) + 'px'; // logo abaixo do nome do mapa
  c.append(el('b', {}, `${t.d.ic} Treinando ${SKILLS[t.d.sk].nome} ${o.lv} `), el('span', { class: 'ce-bar' }, el('i', { style: `width:${pc}%` })), el('small', {}, `${pc}% · ande para parar`));
}
{
  const st = document.createElement('style');
  st.textContent = `.chip-estacao { position: fixed; left: 50%; top: 110px; transform: translateX(-50%); z-index: 40; display: flex; align-items: center; gap: 8px; padding: 5px 12px; border-radius: 999px;
    background: rgba(30,18,40,.86); color: #fff; font-size: 13px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.35); pointer-events: auto; white-space: nowrap; }
  .chip-estacao small { opacity: .8; } .ce-bar { width: 70px; height: 7px; border-radius: 4px; background: rgba(255,255,255,.2); overflow: hidden; } .ce-bar i { display: block; height: 100%; background: #7be07b; }
  @media (max-width: 600px) { .chip-estacao { font-size: 12px; } }`;
  document.head.append(st);
}
