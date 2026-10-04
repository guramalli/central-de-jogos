/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🛡️ GUILDAS — "MMO leve", etapa 3 (v382; dono: "pode criar a parte de guilda")
   ☰ Mais › 🛡️ Guilda. Público infantil: NADA de texto livre.
   - Nome montado com partes de listas ("Os Leões de Fogo", "As Águias Douradas"), escudo e cor de listas.
   - Até 30 membros; líder, vices e membros. Entra por CONVITE de líder/vice, só AMIGO de quem convida.
   - META DA SEMANA: os adversários que cada um derrota (com pelo menos 60% do seu nível) somam para a guilda; cada faixa atingida dá um
     prêmio (XP + tostões, pelo seu nível) para quem ajudou com pelo menos 50 na semana. Ranking semanal das guildas.
   - Frases prontas para a guilda inteira; o escudo aparece em cima do nome nas cidades; colegas de guilda podem
     caçar em grupo mesmo sem ser amigos.
   Servidor: /api/lenda/guilda (routes/lendaGuilda.js) + socket "guilda-*" (socketMundo.js). Steam: desligado.
   Carregar DEPOIS de mundo_online.js e caca_grupo.js.
   ============================================================ */
const GLD = { dados: null, pend: 0, tEnvio: 0, carregando: false, convitesVistos: new Set() };
const GLD_LIBERADO = true;
// (cópia das listas do servidor — a ordem é a mesma de src/lenda/guilda.js)
const GLD_NOMES = [['Leões', 'm'], ['Águias', 'f'], ['Tubarões', 'm'], ['Dragões', 'm'], ['Lobos', 'm'], ['Panteras', 'f'], ['Corujas', 'f'], ['Tigres', 'm'], ['Falcões', 'm'], ['Raposas', 'f'], ['Foguetes', 'm'], ['Cometas', 'm'], ['Estrelas', 'f'], ['Feras', 'f'], ['Craques', 'm'], ['Titãs', 'm'], ['Guardiões', 'm'], ['Lendas', 'f'], ['Fênix', 'f'], ['Piratas', 'm'], ['Ursos', 'm'], ['Onças', 'f']];
const GLD_COMPL = [['de Fogo', 'de Fogo'], ['do Trovão', 'do Trovão'], ['do Campinho', 'do Campinho'], ['da Vila', 'da Vila'], ['da Lua', 'da Lua'], ['das Estrelas', 'das Estrelas'], ['do Mar', 'do Mar'], ['do Gol', 'do Gol'], ['da Várzea', 'da Várzea'], ['do Futuro', 'do Futuro'], ['Dourados', 'Douradas'], ['Galácticos', 'Galácticas'], ['Invencíveis', 'Invencíveis'], ['Imparáveis', 'Imparáveis'], ['Lendários', 'Lendárias'], ['Azuis', 'Azuis'], ['Vermelhos', 'Vermelhas'], ['Velozes', 'Velozes'], ['Furiosos', 'Furiosas'], ['Brilhantes', 'Brilhantes'], ['do Arco-Íris', 'do Arco-Íris'], ['da Floresta', 'da Floresta']];
const GLD_ESCUDOS = ['🦁', '🦅', '🐉', '⚡', '🔥', '🌟', '⚽', '🛡️', '🐺', '🦈', '🚀', '👑', '🐯', '🦊', '🌙', '💎'];
const GLD_CORES = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#ec407a'];
const GLD_FRASES = ['Bora bater a meta! 🎯', 'Bora caçar juntos!', 'Bom dia, guilda! ☀️', 'Boa noite, guilda! 🌙', 'Valeu, time! 🙏', 'Parabéns! 🎉', 'Quem quer grupo? 👥', 'Estou na Torre 🗼', 'Estou no Multiverso 🌌', 'Preciso de ajuda! 🆘', 'Subi de nível! ⬆️', 'Somos os melhores! 🏆'];
const GLD_PREMIO = [{ xp: 0.03, ouro: 200 }, { xp: 0.06, ouro: 500 }, { xp: 0.12, ouro: 1200 }, { xp: 0.2, ouro: 3000 }]; // por faixa: fração do nível em XP + tostões × nível
const GLD_NIVEL_CRIAR = 20;
const gldLigado = () => GLD_LIBERADO && typeof PORTAL !== 'undefined' && PORTAL.ativo && !!PORTAL.token && !window.LENDA_STEAM;
const gldNome = (n, c) => { const a = GLD_NOMES[n], b = GLD_COMPL[c]; if (!a || !b) return ''; const f = a[1] === 'f'; return `${f ? 'As' : 'Os'} ${a[0]} ${f ? b[1] : b[0]}`; };
const gldBadge = (g, tam = 34) => el('span', { class: 'gld-badge', style: `background:${g.cor};width:${tam}px;height:${tam}px;font-size:${Math.round(tam * 0.6)}px` }, g.escudo);
async function gldPede(metodo, caminho, corpo) {
  const r = await fetch(PORTAL.api + '/api/lenda/guilda' + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, dados: j };
}
const gldErro = r => (r && r.dados && r.dados.error) || (r && r.status === 503 ? 'As guildas ainda estão chegando ao servidor. Tente mais tarde!' : 'Não deu agora. Tente de novo em instantes.');
async function gldCarrega() {
  let r; try { r = await gldPede('GET', '/minha'); } catch (e) { r = { ok: false }; }
  if (!r.ok) return r;
  GLD.dados = r.dados;
  for (const c of r.dados.convites || []) if (!GLD.convitesVistos.has(c.id)) { GLD.convitesVistos.add(c.id); log(`🛡️ ${c.de} convidou você para a guilda ${c.guilda.escudo} ${c.guilda.nome}! Abra ☰ Mais › 🛡️ Guilda.`, 'l-xp'); banner('🛡️ Convite de guilda!', `${c.guilda.escudo} ${c.guilda.nome}`); }
  gldLigaSocket();
  return r;
}

/* ---------- socket: frases da guilda (usa a conexão do mundo compartilhado) ---------- */
async function gldLigaSocket() {
  if (typeof moConecta !== 'function') return;
  try { await moConecta(); } catch (e) { return; }
  const s = MO.sock; if (!s) return;
  if (!s._gldEscuta) {
    s._gldEscuta = true;
    s.on('guilda-frase', ({ de, apelido, i }) => {
      const f = GLD_FRASES[i]; if (!f) return; const eu = de === PORTAL.contaId;
      log(`🛡️ ${eu ? 'Você' : apelido}: ${f}`, 'l-xp');
      const o = MO.outros.get(de); if (eu) moBalao('eu', f); else if (o && !MO_ESCONDE && !MO_MUDOS.has(de)) moBalao(de, f);
    });
    s.on('guilda-convite', () => gldCarrega());
    s.on('connect', () => s.emit('guilda-ligar', {}, () => { }));
  }
  s.emit('guilda-ligar', {}, () => { });
}

/* ---------- janela ---------- */
async function gldAbre() {
  if (!gldLigado()) return avisoJogo('🛡️ As guildas só funcionam no site (educacaogamer.com.br), com a sua conta.');
  abreModal(el('h2', {}, '🛡️ Guilda'), el('p', { class: 'vazio' }, 'Carregando...'));
  const r = await gldCarrega();
  if (!r.ok) return abreModal(el('h2', {}, '🛡️ Guilda'), el('p', {}, gldErro(r)));
  GLD.dados.guilda ? gldTelaGuilda() : gldTelaSemGuilda();
}
function gldTelaSemGuilda() {
  const d = GLD.dados, convites = (d.convites || []).map(c => el('div', { class: 'amg-linha amg-novo' }, el('span', {}, gldBadge(c.guilda, 26), ` ${c.guilda.nome} — convite de ${c.de}`), el('div', { class: 'amg-botoes' },
    el('button', { class: 'btn mini amarelo', type: 'button', onclick: async () => { const r = await gldPede('POST', `/convite/${c.id}/aceitar`); if (!r.ok) return avisoJogo('🛡️ ' + gldErro(r)); som('nivel'); banner('🛡️ Bem-vindo à guilda!', `${c.guilda.escudo} ${c.guilda.nome}`); gldAbre(); } }, '✅ Entrar'),
    el('button', { class: 'btn mini', type: 'button', onclick: async () => { await gldPede('DELETE', `/convite/${c.id}`); gldAbre(); } }, '❌'))));
  abreModal(el('h2', {}, '🛡️ Guilda'),
    el('p', {}, 'Uma guilda junta até 30 amigos: vocês têm um escudo, caçam juntos, batem a META DA SEMANA e ganham prêmios.'),
    convites.length ? el('div', { class: 'amg-lista' }, ...convites) : el('p', { class: 'vazio' }, 'Nenhum convite agora. Um amigo que tem guilda pode convidar você.'),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn amarelo', type: 'button', onclick: gldTelaCriar }, '➕ Criar uma guilda'),
      el('button', { class: 'btn', type: 'button', onclick: gldRanking }, '🏆 Ranking da semana')));
}
function gldTelaCriar() {
  if (G.save.nivel < GLD_NIVEL_CRIAR) return avisoJogo(`🛡️ Para criar uma guilda é preciso estar no nível ${GLD_NIVEL_CRIAR}. Mas você pode entrar na guilda de um amigo antes!`);
  const esc = { n: 0, c: 0, e: 0, k: 5 };
  const prev = el('div', { class: 'gld-prev' });
  const atualiza = () => { prev.innerHTML = ''; prev.append(gldBadge({ escudo: GLD_ESCUDOS[esc.e], cor: GLD_CORES[esc.k] }, 54), el('b', {}, gldNome(esc.n, esc.c))); };
  const sel = (lista, k, rot) => { const s = el('select', { onchange: e => { esc[k] = +e.target.value; atualiza(); } }, ...lista.map((x, i) => el('option', { value: i }, rot(x, i)))); return s; };
  const grade = (lista, k, desenha) => el('div', { class: 'gld-grade' }, ...lista.map((x, i) => { const b = el('button', { type: 'button', class: 'gld-op', onclick: () => { esc[k] = i; [...b.parentNode.children].forEach(c => c.classList.toggle('on', c === b)); atualiza(); } }, desenha(x)); if (i === esc[k]) b.classList.add('on'); return b; }));
  atualiza();
  abreModal(el('h2', {}, '➕ Criar guilda'), prev,
    el('div', { class: 'gld-campos' }, el('label', {}, 'Nome: ', sel(GLD_NOMES, 'n', x => x[0])), el('label', {}, 'Complemento: ', sel(GLD_COMPL, 'c', x => x[0] === x[1] ? x[0] : `${x[0]} / ${x[1]}`))),
    el('h3', {}, 'Escudo'), grade(GLD_ESCUDOS, 'e', x => x),
    el('h3', {}, 'Cor'), grade(GLD_CORES, 'k', x => el('span', { class: 'gld-cor', style: `background:${x}` })),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn amarelo', type: 'button', onclick: async () => { const r = await gldPede('POST', '/criar', { nome: esc.n, complemento: esc.c, escudo: esc.e, cor: esc.k, nivel: G.save.nivel }); if (!r.ok) return avisoJogo('🛡️ ' + gldErro(r)); som('nivel'); banner('🛡️ Guilda criada!', `${r.dados.guilda.escudo} ${r.dados.guilda.nome}`); gldAbre(); } }, '🛡️ Criar'),
      el('button', { class: 'btn', type: 'button', onclick: gldAbre }, '← Voltar')));
}
function gldTelaGuilda() {
  const d = GLD.dados, g = d.guilda, eu = d.eu, metas = d.metas || [2000, 10000, 30000, 80000], min = d.minAjuda || 50;
  const ehChefe = eu.papel === 'lider' || eu.papel === 'vice';
  // meta da semana
  const total = g.pontosSemana, topo = metas[metas.length - 1];
  const barra = el('div', { class: 'gld-barra' }, el('i', { style: `width:${Math.min(100, total / topo * 100)}%` }), ...metas.map(m => el('span', { class: 'gld-marca', style: `left:${m / topo * 100}%` })));
  const faixas = metas.map((m, i) => {
    const chegou = total >= m, pego = (eu.premios || 0) & (1 << i), p = GLD_PREMIO[i];
    const txt = `${i + 1}ª meta: ${m.toLocaleString('pt-BR')} — +${Math.round(p.xp * 100)}% de um nível em XP e ${(p.ouro * G.save.nivel).toLocaleString('pt-BR')} tostões`;
    return el('div', { class: 'gld-faixa' + (chegou ? ' ok' : '') }, el('span', {}, (pego ? '✅ ' : chegou ? '🎁 ' : '🔒 ') + txt),
      chegou && !pego ? el('button', { class: 'btn mini amarelo', type: 'button', disabled: eu.pontosSemana < min ? 'disabled' : null, title: eu.pontosSemana < min ? `Ajude com ${min} adversários nesta semana para resgatar` : '', onclick: () => gldResgata(i) }, eu.pontosSemana < min ? `faltam ${min - eu.pontosSemana} seus` : 'Resgatar') : '');
  });
  const icone = { lider: '👑', vice: '⭐', membro: '⚽' };
  const membros = (d.membros || []).map(m => {
    const eu2 = m.userId === PORTAL.contaId, botoes = [];
    if (!eu2 && eu.papel === 'lider') {
      botoes.push(el('button', { class: 'btn mini', type: 'button', onclick: () => gldAcao('/cargo', { userId: m.userId, papel: m.papel === 'vice' ? 'membro' : 'vice' }) }, m.papel === 'vice' ? '⬇ Membro' : '⭐ Vice'));
      botoes.push(el('button', { class: 'btn mini', type: 'button', onclick: async () => { if (await perguntaJogo(`Passar a liderança para ${m.apelido}? Você vira vice.`, { sim: 'Passar', nao: 'Cancelar' })) gldAcao('/lider', { userId: m.userId }); } }, '👑'));
    }
    if (!eu2 && (eu.papel === 'lider' && m.papel !== 'lider' || eu.papel === 'vice' && m.papel === 'membro'))
      botoes.push(el('button', { class: 'btn mini', type: 'button', onclick: async () => { if (await perguntaJogo(`Tirar ${m.apelido} da guilda?`, { sim: 'Tirar', nao: 'Cancelar' })) gldAcao('/expulsar', { userId: m.userId }); } }, '🚪'));
    return el('div', { class: 'amg-linha' }, el('span', {}, `${icone[m.papel] || '⚽'} ${m.apelido}${eu2 ? ' (você)' : ''} · ${m.pontosSemana.toLocaleString('pt-BR')} nesta semana`), el('div', { class: 'amg-botoes' }, ...botoes));
  });
  const convidar = el('div', { class: 'co-amigos' });
  abreModal(el('h2', { class: 'gld-titulo' }, gldBadge(g, 40), ` ${g.nome}`, g.numero ? el('small', {}, ` #${g.numero}`) : ''),
    el('h3', {}, `🎯 Meta da semana: ${total.toLocaleString('pt-BR')} adversários`), barra, el('div', { class: 'gld-faixas' }, ...faixas),
    el('p', { class: 'dica' }, `Você ajudou com ${eu.pontosSemana.toLocaleString('pt-BR')} nesta semana. Contam os adversários a partir do nível ${gldMinNivel(G.save.nivel)} (60% do seu); os prêmios são para quem ajudou com pelo menos ${min}. A semana vira na segunda-feira.`),
    el('h3', {}, '💬 Falar com a guilda'), el('div', { class: 'gld-frases' }, ...GLD_FRASES.map((f, i) => el('button', { class: 'btn', type: 'button', onclick: () => { if (MO.sock && MO.sock.connected) MO.sock.emit('guilda-frase', { i }); else avisoJogo('🛡️ Conectando... tente de novo em instantes.'); } }, f))),
    el('h3', {}, `👥 Membros (${(d.membros || []).length}/30)`), el('div', { class: 'amg-lista' }, ...membros),
    ehChefe ? el('h3', {}, '📨 Convidar amigos') : '', ehChefe ? convidar : '',
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn', type: 'button', onclick: gldRanking }, '🏆 Ranking da semana'),
      el('button', { class: 'btn', type: 'button', onclick: async () => { if (await perguntaJogo(eu.papel === 'lider' ? 'Sair da guilda? A liderança passa para um vice (ou o membro mais antigo).' : 'Sair da guilda?', { sim: 'Sair', nao: 'Ficar' })) { await gldPede('POST', '/sair'); GLD.dados = null; gldLigaSocket(); gldAbre(); } } }, '🚪 Sair da guilda')));
  if (ehChefe) gldListaConvidar(convidar);
}
async function gldListaConvidar(caixa) {
  caixa.append(el('p', { class: 'vazio' }, 'Carregando amigos...'));
  let lista = []; try { const r = await amgPede('GET', '/amigos'); lista = (r.ok && r.dados.amigos) || []; } catch (e) { }
  caixa.innerHTML = '';
  const dentro = new Set((GLD.dados.membros || []).map(m => m.userId));
  const fora = lista.filter(a => !dentro.has(a.id));
  if (!fora.length) caixa.append(el('p', { class: 'vazio' }, 'Nenhum amigo para convidar agora.'));
  for (const a of fora.slice(0, 20)) caixa.append(el('div', { class: 'amg-linha' }, el('span', {}, `${a.apelido} · Nv ${a.nivel}`),
    el('button', { class: 'btn mini', type: 'button', onclick: async ev => { const r = await gldPede('POST', '/convidar', { userId: a.id }); ev.target.textContent = r.ok ? '✅ Convidado' : '❌'; ev.target.disabled = true; if (!r.ok) avisoJogo('🛡️ ' + gldErro(r)); } }, '📨 Convidar')));
  caixa.append(el('button', { class: 'btn mini', type: 'button', onclick: () => typeof modalAmigos === 'function' && modalAmigos() }, '➕ Adicionar amigos'));
}
async function gldAcao(caminho, corpo) { const r = await gldPede('POST', caminho, corpo); if (!r.ok) avisoJogo('🛡️ ' + gldErro(r)); gldAbre(); }
async function gldResgata(i) {
  const r = await gldPede('POST', '/premio', { faixa: i });
  if (!r.ok) return avisoJogo('🛡️ ' + gldErro(r));
  const s = G.save, p = GLD_PREMIO[i], xp = Math.round((xpPara(s.nivel + 1) - xpPara(s.nivel)) * p.xp), ouro = p.ouro * s.nivel;
  s.ouro += ouro; ganhaXp(xp); som('nivel');
  log(`🛡️ Prêmio da ${i + 1}ª meta da guilda: +${xp.toLocaleString('pt-BR')} XP e +${ouro.toLocaleString('pt-BR')} tostões!`, 'l-xp');
  banner('🛡️ Meta da guilda!', `+${ouro.toLocaleString('pt-BR')} tostões e XP`); G.uiSujo = true; salvar(); gldAbre();
}
async function gldRanking() {
  let r; try { r = await gldPede('GET', '/ranking'); } catch (e) { r = { ok: false }; }
  if (!r.ok) return avisoJogo('🛡️ ' + gldErro(r));
  const lista = r.dados.ranking || [];
  abreModal(el('h2', {}, '🏆 Guildas da semana'),
    lista.length ? el('div', { class: 'amg-lista' }, ...lista.map(g => el('div', { class: 'amg-linha' }, el('span', {}, `${g.pos}º `, gldBadge(g, 24), ` ${g.nome}`), el('b', {}, g.pontosSemana.toLocaleString('pt-BR'))))) : el('p', { class: 'vazio' }, 'Nenhuma guilda pontuou nesta semana ainda. Seja a primeira!'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: gldAbre }, '← Voltar')));
}

/* ---------- a meta: conta os adversários do seu nível e manda de tempos em tempos ---------- */
// só vale adversário com pelo menos 60% do seu nível (o jogo não tira mais XP de adversário fraco: sem isso, um nível 600
// enchia a meta derrubando jacarés)
const gldMinNivel = n => Math.max(1, Math.min(n - 15, Math.floor(n * 0.6)));
const gldConta = d => nivelMonstro(d) >= gldMinNivel(G.save.nivel);
{
  const _matarGld = matar;
  matar = function (m) {
    try { if (GLD.dados && GLD.dados.guilda && m && m.d && !m.d.treino && gldConta(m.d)) GLD.pend++; } catch (e) { }
    return _matarGld.apply(this, arguments);
  };
}
setInterval(async () => {
  if (!gldLigado() || !GLD.dados || !GLD.dados.guilda || GLD.pend <= 0 || GLD.enviando) return;
  GLD.enviando = true;
  try {
    const r = await gldPede('POST', '/pontos', { n: GLD.pend });
    if (r.ok && r.dados.pontos > 0) { GLD.pend = Math.max(0, GLD.pend - r.dados.pontos); const g = GLD.dados.guilda; g.pontosSemana = r.dados.guildaSemana ?? g.pontosSemana; GLD.dados.eu.pontosSemana = r.dados.meusSemana ?? GLD.dados.eu.pontosSemana; }
  } catch (e) { } finally { GLD.enviando = false; }
}, 60000);

/* ---------- ao entrar e a cada 5 min (convites novos) ---------- */
if (gldLigado()) { setTimeout(() => { if (G.rodando) gldCarrega(); }, 12000); setInterval(() => { if (G.rodando) gldCarrega(); }, 5 * 60000); }
(function poeBotaoGld(t = 0) {
  if (!gldLigado()) return;
  const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => poeBotaoGld(t + 1), 500); return; }
  if (document.getElementById('btnGuilda')) return;
  const b = el('button', { class: 'btn', id: 'btnGuilda', type: 'button', role: 'menuitem' }, '🛡️ Guilda'); b.onclick = gldAbre;
  lista.append(b);
})();
{
  const css = document.createElement('style');
  css.textContent = `.gld-badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 30% 30% 50% 50%; border: 2px solid rgba(0,0,0,.35); box-shadow: inset 0 -4px 0 rgba(0,0,0,.18); vertical-align: middle; }
  .gld-prev { display: flex; align-items: center; gap: 12px; padding: 10px; margin: 6px 0; border-radius: 12px; background: rgba(0,0,0,.06); font-size: 20px; }
  .gld-campos { display: flex; flex-wrap: wrap; gap: 10px; } .gld-campos select { font-weight: 700; padding: 4px; border-radius: 8px; }
  .gld-grade { display: flex; flex-wrap: wrap; gap: 6px; } .gld-op { font-size: 22px; width: 44px; height: 42px; border-radius: 10px; border: 2px solid transparent; background: rgba(0,0,0,.06); cursor: pointer; }
  .gld-op.on { border-color: #f1c40f; background: rgba(241,196,15,.2); } .gld-cor { display: inline-block; width: 24px; height: 24px; border-radius: 50%; }
  .gld-titulo { display: flex; align-items: center; gap: 8px; } .gld-titulo small { opacity: .6; font-size: 14px; }
  .gld-barra { position: relative; height: 16px; border-radius: 8px; background: rgba(0,0,0,.12); overflow: hidden; margin: 6px 0; } .gld-barra i { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg, #2ecc71, #f1c40f); }
  .gld-marca { position: absolute; top: 0; bottom: 0; width: 2px; background: rgba(0,0,0,.35); }
  .gld-faixas { display: flex; flex-direction: column; gap: 4px; } .gld-faixa { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 8px; background: rgba(0,0,0,.04); font-size: 13px; } .gld-faixa.ok { background: rgba(46,204,113,.15); }
  .co-amigos > .btn.mini { align-self: flex-start; }
  .gld-frases { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; }`;
  document.head.append(css);
}
window.GUILDA = { GLD, gldNome, GLD_NOMES, GLD_COMPL, GLD_FRASES };
