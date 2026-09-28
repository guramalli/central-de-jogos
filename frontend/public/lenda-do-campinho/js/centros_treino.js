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
const EST_CD = 1500;
// onde fica o centro (coordenada de projeto, antes do "espalha"); sem ref = perto de onde a pessoa chega
const CENTROS_TREINO = { vila: [12, 22], ct: [8, 31], praia: null, cidade: null, cairo: null, toquio: null, doha: null, miami: null, lisboa: null, madri: null, milao: null, munique: null, londres: null, paris: null, buenos: null, rio: null };
for (const e of Object.values(APARELHOS)) {
  if (!ASSET_SET.has(e.spr)) { ASSETS.push(e.spr); ASSET_SET.add(e.spr); }
  const W = 2.5, H = W * e.ar;
  PORTAS[e.spr] = { x: 0.3, y: 1 - 0.12 / H }; // desenho centrado nos 2 quadros da base
  e.alto = Math.max(0, Math.ceil(H * 0.97 - 1));
}

// O setor é um gramado de treino de 15×6 (o piso delimita a área):
//   fileira 1: os 4 aparelhos (2 quadros cada, 1 de folga), centralizados
//   fileira 2: onde a pessoa fica treinando · fileira 4: 3 bonecos de treino alinhados
// Só vai para terreno de UM tipo só (não atravessa caminho de grama/calçada), longe dos bichos.
const CT_W = 15, CT_H = 6;
function poeCentroTreino(m, refProj) {
  const i = (x, y) => y * m.w + x;
  // enfeite solto (árvore, flor, pedra...) pode sair de dentro do setor, como nos estádios
  const cid = typeof CIDADES !== 'undefined' && CIDADES.find(k => k.id === m.id);
  const deco = new Set(['arvore', 'arvore2', 'arbusto', 'pedra', 'flores', 'vaso', 'lixeira2', 'banco', 'cones', 'barreiras', 'sacola_bolas', ...(cid ? [...(cid.props || []), ...(cid.arvores || [])] : [])]);
  const placaVelha = new Set(m.placas.filter(pl => /^TREINO LIVRE/.test(pl.texto)).map(pl => i(pl.x, pl.y)));
  const solto = k => { const o = m.obj[k]; return !o || (deco.has(o.t) && !o.predio) || (o.t === 'placa' && placaVelha.has(k)); };
  const livre = (x, y) => x >= 1 && y >= 1 && x < m.w - 1 && y < m.h - 1 && solto(i(x, y)) && CH_ANDA(m.chao[i(x, y)]) && m.chao[i(x, y)] !== CH.AGUA;
  const dp = refProj && typeof dimProjeto === 'function' && dimProjeto(m.id);
  const inicio = m.renasce || m.inicio || { x: m.w >> 1, y: m.h >> 1 };
  const ref = refProj ? (dp ? { x: escalaCoord(refProj[0], dp[0], tamNovo(dp[0])), y: escalaCoord(refProj[1], dp[1], tamNovo(dp[1])) } : { x: refProj[0], y: refProj[1] }) : inicio;
  const cruza = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const pontosIn = (V, lista) => lista.some(p => p.x >= V[0] && p.x < V[2] && p.y >= V[1] && p.y < V[3]);
  const alto = Math.max(...ORDEM_EST.map(k => APARELHOS[k].alto));
  const treino = s => MONSTROS[s.m] && MONSTROS[s.m].treino;
  const cands = [];
  for (let estrito = 1; estrito >= 0 && !cands.length; estrito--) {
    for (let Y = alto + 1; Y < m.h - CT_H - 2; Y++) for (let X = 2; X < m.w - CT_W - 2; X++) {
      let ok = true; const c0 = m.chao[i(X, Y)];
      for (let j = Y; j < Y + CT_H && ok; j++) for (let k = X; k < X + CT_W && ok; k++) if (!livre(k, j) || (estrito && m.chao[i(k, j)] !== c0)) ok = false;
      if (!ok) continue;
      const V = [X, Y + 1 - alto, X + CT_W, Y + CT_H];
      if (pontosIn(V, m.npcs) || pontosIn(V, m.saidas) || pontosIn(V, m.placas.filter(pl => !/^TREINO LIVRE/.test(pl.texto))) || pontosIn(V, m.pontos)) continue;
      if (m.campos.some(c => cruza(V, [c.x - 1, c.y - 1, c.x + c.w + 1, c.y + c.h + 1]))) continue;
      if ((m.zonas || []).some(z => cruza(V, [z.x, z.y, z.x + z.w, z.y + z.h]))) continue;
      if (m.predios.some(p => cruza(V, [p.x - 1, p.y - (p.alto || 3) - 3, p.x + p.w + 1, p.y + p.h + 1]))) continue; // o telhado desenhado sobe mais que a base
      if (m.spawns.some(s => { const r = 1 + (s.raio || 0); return !treino(s) && s.x >= V[0] - r && s.x < V[2] + r && s.y >= V[1] - r && s.y < V[3] + r; })) continue; // longe de onde os bichos andam
      cands.push({ X, Y, d: Math.hypot(X + CT_W / 2 - ref.x, Y + CT_H / 2 - ref.y) });
    }
  }
  cands.sort((a, b) => a.d - b.d);
  const antes = alcancaveis(m, inicio), importantes = pontosImportantes(m).filter(pt => antes[pt.y * m.w + pt.x]);
  const xs = [2, 5, 8, 11]; // os aparelhos dentro do piso (sobram 2 quadros de cada lado)
  for (const { X, Y } of cands.slice(0, 30)) {
    const y = Y + 1, guarda = [];
    for (let j = Y; j < Y + CT_H; j++) for (let k = X; k < X + CT_W; k++) if (m.obj[i(k, j)]) { guarda.push([i(k, j), m.obj[i(k, j)]]); m.obj[i(k, j)] = null; } // tira os enfeites do gramado
    for (const dx of xs) for (let k = 0; k < 2; k++) m.obj[i(X + dx + k, y)] = { t: 'x', v: 0, predio: true };
    const depois = alcancaveis(m, inicio);
    if (xs.every(dx => depois[i(X + dx, y + 1)]) && importantes.every(pt => depois[pt.y * m.w + pt.x])) {
      for (let j = Y; j < Y + CT_H; j++) for (let k = X; k < X + CT_W; k++) m.chao[i(k, j)] = CH.CAMPO; // o gramado do setor
      ORDEM_EST.forEach((k, e) => { const d = APARELHOS[k]; m.predios.push({ spr: d.spr, x: X + xs[e], y, w: 2, h: 1, porta: { x: X + xs[e], y }, alto: d.alto, estacao: k }); });
      // os bonecos de treino antigos (soltos pelo mapa) vêm para dentro do setor, em fila
      m.spawns = m.spawns.filter(s => !treino(s));
      for (const pl of m.placas.filter(pl => /^TREINO LIVRE/.test(pl.texto))) { if (m.obj[i(pl.x, pl.y)] && m.obj[i(pl.x, pl.y)].t === 'placa') m.obj[i(pl.x, pl.y)] = null; }
      m.placas = m.placas.filter(pl => !/^TREINO LIVRE/.test(pl.texto));
      for (const dx of [3, 7, 11]) m.spawns.push({ m: 'boneco', x: X + dx, y: Y + 4, qtd: 1, raio: 0 });
      m.obj[i(X, Y + 2)] = { t: 'placa', v: 1 };
      m.placas.push({ x: X, y: Y + 2, texto: '🏋️ CENTRO DE TREINAMENTO — clique num aparelho para treinar: 🎯 Boneco = Chute · 🏋️ Academia = Defesa · 🔶 Cones = Drible · 🧠 Quadro tático = Visão de jogo. Treina até você andar. Os bonecos de treino da frente: bata no modo Drible ou Chute.' });
      m.centroTreino = { x: X + xs[0], y, X, Y };
      return true;
    }
    for (const dx of xs) for (let k = 0; k < 2; k++) m.obj[i(X + dx + k, y)] = null;
    for (const [k, o] of guarda) m.obj[k] = o; // fecharia algum caminho: devolve os enfeites
  }
  console.warn('centro de treinamento sem lugar:', m.id); return false;
}
for (const [id, ref] of Object.entries(CENTROS_TREINO)) {
  const base = MAPAS_DEF[id]; if (!base) continue;
  MAPAS_DEF[id] = function () { const m = base(); try { poeCentroTreino(m, ref); } catch (e) { console.error('centro de treino', id, e); } return m; };
}

// linha branca de campo em volta do gramado: deixa claro onde é o setor
if (typeof desenhaChaoClima === 'function') {
  const _dccCt = desenhaChaoClima;
  desenhaChaoClima = function (ctx) {
    const r = _dccCt.apply(this, arguments);
    const c = G.mapa && G.mapa.centroTreino;
    if (c && c.X != null) { const k = 0.18 * T; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(c.X * T + k, c.Y * T + k, CT_W * T - 2 * k, CT_H * T - 2 * k, 6); ctx.stroke(); ctx.restore(); }
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
