/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   MODO GRAVAÇÃO (vídeo de divulgação) — só liga com ?gravar=1
   O jogo se joga sozinho, cena por cena, com legenda grande:
     1. de lambreta pela Vila      4. forjando uma chuteira no Seu Remendo
     2. driblando na Cidade        5. desafiando o chefão da Arena do Terrão
     3. comprando e mostrando a casa · e um cartão final com o site.
   Quem grava é a pessoa (Win+Alt+R no PC, Gravação de Tela no iPhone).
   Usa um personagem de TESTE: nada é salvo (nem no aparelho, nem online,
   nem no ranking). Opções: &celular=1 (em pé, 9:16) · &nome=Fulano
   Carregar por ÚLTIMO.
   ============================================================ */
const GRAVANDO = /[?&]gravar=1/.test(location.search);

if (GRAVANDO) (function () {
  const Q = new URLSearchParams(location.search);
  const NIVEL = 34; // perto do chefão (nível 32): sem aviso de "fraco demais"
  const DEMO = { simular: false, cena: '' };
  window.DEMO = DEMO;

  /* ---------- nada sai daqui: sem save, sem nuvem, sem ranking ---------- */
  salvar = function () { };
  atualizaRanking = function () { };
  enviaRankingOnline = function () { };
  if (typeof NUVEM !== 'undefined') { NUVEM.ativa = false; NUVEM.parada = true; NUVEM.pacote = null; }
  if (typeof publicaCasa === 'function') publicaCasa = function () { };
  avisaMudancaCasa = function () { };
  dica = function () { };
  desenhaGuia = function () { }; // sem a setinha amarela do objetivo
  // no vídeo, o registro mostra só o que é bonito de ler
  const _logGv = log;
  log = function (txt, cls) {
    txt = String(txt).replace(/ ?\((bem )?mais fraco que você[^)]*\)/g, '').replace(/ ?\(fraco demais[^)]*\)/g, '');
    if (/Aperte U|Bem-vindo\(a\) de volta|Você chegou em|Tem rival|deite o celular|barras do Safari|está em campo na/.test(txt)) return;
    return _logGv.call(this, txt, cls);
  };

  /* ---------- tempo: de verdade (gravando) ou acelerado (teste) ---------- */
  function passo(dt) { G.agora += dt; if (!G.rodando) return; if (!G.pausado) atualiza(dt); desenha(dt); }
  async function esperar(ms) {
    if (!DEMO.simular) return new Promise(r => setTimeout(r, ms));
    for (let t = 0; t < ms; t += 16) { passo(16); if (DEMO.pausaSe && DEMO.pausaSe()) { DEMO.pausaSe = null; await new Promise(r => { DEMO.solta = r; }); } }
    await Promise.resolve();
  }
  async function ate(cond, max) { const fim = max / 100; for (let i = 0; i < fim && !cond(); i++) await esperar(100); }

  /* ---------- diretor: o personagem não perde e a luta dura o tempo do vídeo ---------- */
  const _recebeDano = recebeDano;
  recebeDano = function (dano, m) {
    const s = G.save, max = stats().maxHp;
    const r = _recebeDano.call(this, Math.max(1, Math.round(dano * 0.12)), m);
    if (s.hp < max * 0.55) s.hp = Math.round(max * 0.7);
    return r;
  };
  const LUTA = { m: null, t0: 0, dur: 13000 };
  const _aplicaDano = aplicaDano;
  aplicaDano = function (m, dano) {
    if (m === LUTA.m && dano > 0) {
      const max = m.d.hp, t = (G.agora - LUTA.t0) / LUTA.dur;
      const meta = max * Math.max(0, 1 - t); // o fôlego do chefão acompanha o relógio
      if (t < 0.8) dano = Math.max(Math.min(dano, m.hp - max * 0.06), m.hp - meta);
      else dano = Math.max(dano, m.hp - meta);
      dano = Math.max(1, Math.round(dano));
    }
    return _aplicaDano.call(this, m, dano);
  };
  // arena sempre aberta e chefão sempre disponível
  janelaArena = function () { return { aberta: true, resta: 30, abre: 0 }; };
  venceuHoje = function () { return !!DEMO.venceu; };
  // o chefão do vídeo sempre deixa cair um item MÍTICO
  const _matarGv = matar;
  matar = function (m) {
    if (m !== LUTA.m) return _matarGv.apply(this, arguments);
    DEMO.venceu = true; const rnd = Math.random; Math.random = () => 0.001;
    try { return _matarGv.apply(this, arguments); } finally { Math.random = rnd; }
  };
  // sempre dia de sol
  if (typeof climaAtual === 'function') { const _ca = climaAtual; climaAtual = function () { const c = _ca(); return c ? Object.assign({}, c, { tempo: 'sol' }) : c; }; }

  /* ---------- o personagem de teste ---------- */
  function melhorItem(slot) {
    const ord = { comum: 0, incomum: 1, raro: 2, epico: 3, lendario: 4, mitico: 5 };
    let best = null, bv = -1;
    for (const [id, it] of Object.entries(ITENS)) {
      if (it.tipo !== 'equip' || it.slot !== slot || (it.lvl || 0) > NIVEL) continue;
      const rar = typeof raridadeItem === 'function' ? raridadeItem(id) : 'comum'; if (rar === 'mitico') continue;
      const v = (it.lvl || 0) * 10 + (ord[rar] || 0); if (v > bv) { bv = v; best = id; }
    }
    return best;
  }
  function criaPersonagem() {
    const s = novoSave({ nome: (Q.get('nome') || 'Craque').slice(0, 14), corpo: 'm', pele: 'pele-morena', cabelo: 'cabelo-cacheado', corCabelo: 'original', roupa: 'roupa-camiseta', baixo: 'baixo-shorts', rosto: null, classe: 'driblador' });
    s.nivel = NIVEL; s.xp = xpPara(NIVEL) + Math.round((xpPara(NIVEL + 1) - xpPara(NIVEL)) * 0.6);
    s.atr = { defesa: 25, habilidade: 55, inteligencia: 30, folego: 45 };
    for (const k of ['drible', 'chute', 'defesa', 'visao']) s.sk[k] = { lv: k === 'chute' ? 58 : 48, t: 0 };
    for (const slot of Object.keys(s.equip)) { const id = melhorItem(slot); if (id) s.equip[slot] = id; }
    s.equipR = { chuteira: 6, camisa: 4, calcao: 3, cabeca: 3 };
    s.ouro = 48000; s.tut = 99; s.dia = 3; s.hora = 10 * 60;
    Object.assign(s.flags, { cena_adulto: true, paredao: true, mundo: true });
    s.montarias = ['skate', 'bicicleta', 'lambreta']; s.montaria = 'lambreta'; s.montado = false;
    s.dribles = Object.keys(DRIBLES).filter(id => DRIBLES[id].lvl <= NIVEL && daVocacao(id));
    const barra = ['pedalada', 'chapeu', 'elastico', 'caneta', 'tabela', 'trivela', 'chuva_bolas', 'chute_colocado', 'voleio'].filter(id => DRIBLES[id] && s.dribles.includes(id));
    s.hotbar = [{ t: 'i', id: 'isotonico' }, ...barra.map(id => ({ t: 'd', id }))].slice(0, 10);
    while (s.hotbar.length < 10) s.hotbar.push(null);
    s.mochila = [{ id: 'agua', q: 8 }, { id: 'isotonico', q: 6 }];
    if (!ITENS.isotonico) s.hotbar[0] = { t: 'i', id: 'agua' };
    return s;
  }
  // só as jogadas que esta vocação usa de verdade (as das outras ficam de fora)
  function daVocacao(id) { if (typeof VOCACAO === 'undefined') return true; for (const [k, v] of Object.entries(VOCACAO)) if (v.magias && v.magias.includes(id)) return k === 'driblador'; return true; }

  /* ---------- legenda, tela preta e cartão final ---------- */
  const css = document.createElement('style');
  css.textContent = `
    body.gravando .selo-beta, body.gravando .tag-beta, body.gravando .aviso-beta, body.gravando .cartao-tut-min, body.gravando #nuvemStatus, body.gravando .portal-barra, body.gravando #btnBug { display: none !important; }
    #gvLegenda { position: fixed; left: 50%; top: 27%; transform: translate(-50%, -12px); z-index: 9000; pointer-events: none; opacity: 0; transition: opacity .45s, transform .45s;
      font: 700 clamp(22px, 5.2vmin, 46px)/1.15 Fredoka, sans-serif; color: #fff; text-align: center; width: min(92vw, 900px);
      text-shadow: 0 3px 0 #2b1b5e, 0 0 14px rgba(0,0,0,.6), 2px 2px 0 #2b1b5e, -2px 2px 0 #2b1b5e, 2px -2px 0 #2b1b5e, -2px -2px 0 #2b1b5e; }
    #gvLegenda.on { opacity: 1; transform: translate(-50%, 0); }
    body:has(#modal:not([hidden])) #gvLegenda { opacity: 0; } /* janela aberta: a legenda sai da frente */
    #gvLegenda small { display: block; font-size: .5em; color: #ffe14a; margin-top: 6px; }
    #gvPreto { position: fixed; inset: 0; background: #120a26; z-index: 8990; opacity: 0; pointer-events: none; transition: opacity .5s; }
    #gvPreto.on { opacity: 1; }
    #gvFim { position: fixed; inset: 0; z-index: 9100; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 18px; text-align: center; padding: 24px;
      background: radial-gradient(circle at 50% 35%, #4a2d8e, #1a0f38 70%); color: #fff; font-family: Fredoka, sans-serif; }
    #gvFim.on { display: flex; animation: gvEntra .7s ease-out; }
    #gvFim img { width: min(78vw, 520px); filter: drop-shadow(0 8px 18px rgba(0,0,0,.5)); }
    #gvFim b { font-size: clamp(22px, 5vmin, 44px); color: #ffe14a; }
    #gvFim span { font-size: clamp(16px, 3.4vmin, 28px); opacity: .95; }
    @keyframes gvEntra { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: none; } }
    #gvInicio { position: fixed; inset: 0; z-index: 9200; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 20px; text-align: center;
      background: rgba(18,10,38,.93); color: #fff; font-family: Nunito, sans-serif; }
    #gvInicio h2 { font-family: Fredoka, sans-serif; margin: 0; font-size: 30px; color: #ffe14a; }
    #gvInicio p { max-width: 560px; margin: 0; line-height: 1.45; }
    #gvInicio .btn { font-size: 18px; }
    #gvConta { position: fixed; inset: 0; z-index: 9300; display: none; align-items: center; justify-content: center; font: 700 30vmin Fredoka, sans-serif; color: #ffe14a; text-shadow: 0 6px 0 #2b1b5e; pointer-events: none; }
  `;
  document.head.append(css);
  const legenda = el('div', { id: 'gvLegenda' }), preto = el('div', { id: 'gvPreto' }), conta = el('div', { id: 'gvConta' });
  const logo = (document.querySelector('.logo-jogo img') || {}).src || 'a/logo_jogo.webp';
  const fim = el('div', { id: 'gvFim' }, el('img', { src: logo, alt: 'Lenda do Campinho' }), el('b', {}, 'O RPG de futebol do Educação Gamer'), el('span', {}, 'Jogue grátis no navegador ou no celular'), el('b', {}, 'educacaogamer.com.br'));
  document.body.append(legenda, preto, conta, fim);

  async function mostraLegenda(txt, sub, ms = 3200) {
    legenda.innerHTML = ''; legenda.append(txt, sub ? el('small', {}, sub) : '');
    legenda.classList.add('on'); await esperar(ms); legenda.classList.remove('on');
  }
  function legendaFixa(txt, sub) { legenda.innerHTML = ''; legenda.append(txt, sub ? el('small', {}, sub) : ''); legenda.classList.add('on'); }
  async function escurece() { preto.classList.add('on'); await esperar(550); }
  async function clareia() { preto.classList.remove('on'); await esperar(450); }

  /* ---------- ações ---------- */
  function vaiPara(x, y) {
    const p = G.p; const tx = Math.floor(x), ty = Math.floor(y);
    const c = caminho(Math.floor(p.x), Math.floor(p.y), (i, j) => Math.abs(i - tx) + Math.abs(j - ty) <= 0, 8000)
      || caminho(Math.floor(p.x), Math.floor(p.y), (i, j) => Math.hypot(i - tx, j - ty) <= 1.5, 8000);
    if (!c) return false;
    if (c.length) c[c.length - 1] = { x, y }; else c.push({ x, y });
    G.caminho = c; G.acaoChegar = null; return true;
  }
  async function andaAte(x, y, max = 9000) { if (vaiPara(x, y)) await ate(() => !G.caminho, max); }
  function vaiMapa(id, x, y) { fechaModal(); G.alvo = null; G.caminho = null; if (G.save.montado) G.save.montado = false; trocaMapa(id, x, y); G.save.hp = stats().maxHp; G.save.foco = stats().maxFoco; }
  function botao(texto) { return [...document.querySelectorAll('#modalConteudo button')].find(b => b.textContent.includes(texto) && !b.disabled); }
  async function clica(b) { if (!b) return false; b.style.outline = '4px solid #ffe14a'; b.style.transform = 'scale(1.08)'; await esperar(650); b.click(); return true; }
  function npc(id) { return G.npcs.find(n => n.id === id); }
  function cheioDeFoco() { const st = stats(); G.save.foco = st.maxFoco; }
  function joga(id, alvo) {
    if (!DRIBLES[id] || !G.save.dribles.includes(id)) return;
    cheioDeFoco(); G.cds = {}; if (alvo) G.alvo = alvo; usarDrible(id);
  }
  function rivaisPerto(r) { return G.mons.filter(m => m.hp > 0 && !m.d.treino && !m.d.chefe && dist(m, G.p) < r).sort((a, b) => dist(a, G.p) - dist(b, G.p)); }

  /* ---------- as cenas ---------- */
  async function cenaLambreta() {
    vaiMapa('vila', 9.5, 12.5); if (!montadoAgora()) montar();
    await clareia();
    legendaFixa('🛵 Passeie de lambreta pelo bairro', 'skate, bicicleta, lambreta, carro...');
    await andaAte(22.5, 12.5, 4500);
    legenda.classList.remove('on');
    await andaAte(30.5, 20.5, 4500);
    await andaAte(40.5, 22.5, 4500);
    await esperar(400);
  }
  async function cenaDribles() {
    await escurece(); vaiMapa('cidade', 40.5, 38.5); G.modo = 'drible';
    await clareia();
    legendaFixa('⚽ Drible os adversários com jogadas especiais');
    const jogadas = ['pedalada', 'chapeu', 'elastico', 'caneta', 'tabela'];
    const t0 = G.agora; let i = 0, sumiu = false;
    while (G.agora - t0 < 13000) {
      if (!sumiu && G.agora - t0 > 3200) { legenda.classList.remove('on'); sumiu = true; }
      let a = G.alvo && G.mons.includes(G.alvo) && G.alvo.hp > 0 ? G.alvo : rivaisPerto(9)[0];
      if (!a) { await andaAte(44.5, 34.5, 2500); continue; }
      G.alvo = a; G.caminho = null;
      if (dist(a, G.p) > 1.2) {
        if (i % 3 === 2) { joga(i % 2 ? 'chuva_bolas' : 'trivela', a); i++; await esperar(900); continue; } // de longe também
        await ate(() => !G.mons.includes(a) || dist(a, G.p) <= 1.2, 2500); continue;
      }
      joga(jogadas[i % jogadas.length], a); i++;
      await esperar(1050);
    }
    G.alvo = null;
  }
  async function cenaCasa() {
    await escurece(); vaiMapa('cidade', 18.5, 47.5); G.modo = 'drible';
    G.mons.forEach(m => { if (dist(m, G.p) < 12) { m.bravo = false; m.dest = null; } });
    await clareia();
    legendaFixa('🏠 Compre a sua casa própria', 'e decore do seu jeito');
    const id = 'casa_cidade_1', def = CASAS[id];
    await andaAte(def.porta.x + 0.5, def.porta.y + 1.5, 5000);
    abreCasaPorta(id); await esperar(1800);
    await clica(botao('Comprar')); await esperar(1600);
    legenda.classList.remove('on');
    decoraCasa(id);
    await escurece(); const m = getMapa(id); trocaMapa(id, m.inicio ? m.inicio.x + 0.5 : m.w / 2, m.inicio ? m.inicio.y + 0.5 : m.h - 2.5); await clareia();
    legendaFixa('🏆 Mostre seus troféus para os amigos');
    const c = minhaCasa(); const alvo = c.itens[0] || c.moveis[0];
    if (alvo) await andaAte(alvo.x + 0.5, alvo.y + 1.5, 3500);
    await esperar(1500); legenda.classList.remove('on');
    if (c.moveis[2]) await andaAte(c.moveis[2].x + 0.5, c.moveis[2].y + 1.5, 2500);
    await esperar(600);
  }
  function decoraCasa(id) {
    const s = G.save, c = s.casa; if (!c || c.id !== id) return;
    delete MAPAS[id]; const m = montaCasa(CASAS[id]); delete MAPAS[id];
    const livre = (x, y) => x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1 && !m.obj[y * m.w + x] && podeAndarNo(m, x, y) && !m.saidas.some(sd => Math.abs(sd.x - x) + Math.abs(sd.y - y) < 3);
    const pos = []; for (let y = 1; y < m.h - 2; y++) for (let x = 1; x < m.w - 1; x++) if (livre(x, y)) pos.push({ x, y });
    // encostado nas paredes de cima e dos lados, deixando o meio livre para andar
    const parede = pos.filter(p => p.y <= 3 || p.x <= 1 || p.x >= m.w - 2).sort((a, b) => a.y - b.y || a.x - b.x);
    const moveis = ['mv_estante', 'mv_tv', 'mv_mesa', 'mv_sofa', 'mv_palmeira_vaso', 'mv_trofeu', 'mv_geladeira', 'mv_estatua'].filter(k => ITENS[k]);
    const usados = [];
    for (const mid of moveis) {
      const p = parede.find(p => !usados.some(u => Math.abs(u.x - p.x) < 2 && Math.abs(u.y - p.y) < 2)); if (!p) break;
      usados.push(p); c.moveis.push({ id: mid, x: p.x, y: p.y });
    }
    const tapete = pos.find(p => Math.abs(p.x - m.w / 2) < 1 && Math.abs(p.y - m.h / 2) < 1.5);
    if (tapete && ITENS.mv_tapete) c.moveis.push({ id: 'mv_tapete', x: tapete.x, y: tapete.y });
    // itens expostos em cima da mesa e da estante
    const brilho = (ARENAS[0].miticos || []).concat(['chuteira_ouro', 'camisa_selecao']).filter(k => ITENS[k]);
    for (const mv of c.moveis.filter(mv => mv.id === 'mv_mesa' || mv.id === 'mv_estante').slice(0, 2)) { const it = brilho.shift(); if (it) c.itens.push({ id: it, x: mv.x, y: mv.y, r: 7 }); }
  }
  function podeAndarNo(m, x, y) { const ch = m.chao[y * m.w + x]; return typeof CH_ANDA === 'function' ? CH_ANDA(ch) : true; }
  async function cenaForja() {
    await escurece(); vaiMapa('vila', 31.5, 13.5); await clareia();
    legendaFixa('🔨 Forje seus itens até +10', 'quanto mais alto, mais difícil!');
    await andaAte(31.5, 10.4, 4000);
    const n = npc('remendo'); if (!n) return;
    const it = itensRefinaveis().find(o => o.slot === 'chuteira' || o.id === G.save.equip.chuteira) || itensRefinaveis()[0];
    if (it) { const c = custoRefino(it.id, it.r); for (const [mid, q] of c.mats) addItem(mid, q); G.save.ouro = Math.max(G.save.ouro, c.tostoes + 12000); }
    modalRefino(n); await esperar(2200);
    legenda.classList.remove('on');
    const linha = [...document.querySelectorAll('#modalConteudo .linha-item')].find(l => it && l.textContent.includes(ITENS[it.id].nome));
    const b = linha && linha.querySelector('button');
    if (b) { b.scrollIntoView({ block: 'center' }); const rnd = Math.random; Math.random = () => 0.001; try { await clica(b); } finally { Math.random = rnd; } }
    await esperar(350);
    const msg = document.querySelector('#modalConteudo .refino-msg'); if (msg) { msg.scrollIntoView({ block: 'center' }); msg.style.fontSize = '1.25em'; }
    await esperar(1900); fechaModal(); await esperar(1600);
  }
  async function cenaArena() {
    await escurece(); vaiMapa('cidade', 28.5, 46.5); G.modo = 'chute';
    G.mons.forEach(m => { m.bravo = false; m.dest = null; });
    await clareia();
    legendaFixa('🏟️ Desafie os chefões das arenas', 'e ganhe itens MÍTICOS');
    await andaAte(28.5, 44.4, 3500);
    const port = npc('port_terrao'); if (port) { abrirNPC(port); await esperar(2600); await clica(botao('Entrar na arena')); }
    legenda.classList.remove('on');
    await ate(() => G.mapa && G.mapa.arena, 3000);
    const a = arenaAtual(); await ate(() => a && chefeDaArena(a), 4000);
    const chefe = a && chefeDaArena(a); if (!chefe) return;
    await esperar(1200);
    await andaAte(chefe.x, Math.min(chefe.y + 4.5, ARENA_H - 5), 4000); // chega perto: o chefão precisa estar na tela
    LUTA.m = chefe; LUTA.t0 = G.agora; G.alvo = chefe;
    const jogadas = ['chuva_bolas', 'trivela', 'chute_colocado', 'voleio', 'tabela'];
    let i = 0;
    while (G.mons.includes(chefe) && chefe.hp > 0 && G.agora - LUTA.t0 < LUTA.dur + 6000) {
      G.alvo = chefe; G.modo = 'chute';
      // foge dos círculos vermelhos, como um jogador de verdade
      const perigo = (G.teleArena || []).find(t => t && t.tipo === 'circ' && Math.hypot((t.x || 0) - G.p.x, (t.y || 0) - G.p.y) < (t.r || 2) + 0.6);
      if (perigo) { const ang = Math.atan2(G.p.y - perigo.y, G.p.x - perigo.x); vaiPara(clamp(G.p.x + Math.cos(ang) * 3.5, 3, ARENA_W - 4), clamp(G.p.y + Math.sin(ang) * 3.5, 4, ARENA_H - 5)); await esperar(700); continue; }
      if (dist(chefe, G.p) > 5.5) { vaiPara(chefe.x + (G.p.x < chefe.x ? -3 : 3), chefe.y + 3); await esperar(500); continue; }
      joga(jogadas[i++ % jogadas.length], chefe);
      await esperar(1150);
    }
    LUTA.m = null; G.alvo = null;
    await esperar(3500);
  }

  async function roteiro() {
    document.body.classList.add('gravando');
    for (const n of [3, 2, 1]) { conta.textContent = n; conta.style.display = 'flex'; await esperar(800); }
    conta.style.display = 'none';
    preto.classList.add('on');
    await iniciarJogo(criaPersonagem());
    G.save.hp = stats().maxHp; cheioDeFoco();
    await esperar(400);
    const cenas = [['lambreta', cenaLambreta], ['dribles', cenaDribles], ['casa', cenaCasa], ['forja', cenaForja], ['arena', cenaArena]];
    const so = Q.get('cena');
    for (const [nome, fn] of cenas) {
      if (so && so !== nome) continue;
      DEMO.cena = nome;
      try { await fn(); } catch (e) { console.error('gravação: cena', nome, e); }
    }
    DEMO.cena = 'fim';
    await escurece(); fim.classList.add('on'); preto.classList.remove('on');
  }
  DEMO.roteiro = roteiro;

  /* ---------- tela de início da gravação ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    if (Q.get('auto') === '1') return; // testes: quem chama é o próprio teste
    const emPe = document.body.classList.contains('modo-celular');
    const url = location.href.replace(/[?&]celular=1/, '') + (location.search ? '&' : '?') + 'celular=1';
    const caixa = el('div', { id: 'gvInicio' },
      el('h2', {}, '🎬 Modo gravação'),
      el('p', {}, 'O jogo vai se jogar sozinho (uns 70 segundos): lambreta, dribles, casa, forja e o chefão da arena. Nada disso é salvo no seu personagem.'),
      el('p', {}, el('b', {}, 'Comece a gravar a tela ANTES de apertar o botão: '), 'no PC, Win + Alt + R; no iPhone, Gravação de Tela na Central de Controle.'),
      el('button', { class: 'btn amarelo', type: 'button', onclick: () => { caixa.remove(); roteiro(); } }, '▶️ Começar'),
      emPe ? '' : el('button', { class: 'btn', type: 'button', onclick: () => window.open(url, 'lenda_gravar', 'width=432,height=768') }, '📱 Abrir em pé (9:16, para Reels)'));
    document.body.append(caixa);
  });
})();
