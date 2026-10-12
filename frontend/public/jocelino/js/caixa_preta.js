// Jocelino — caixa_preta.js — a caixa-preta (Frente 1 das melhorias, 11/10/2026): grava COMO o jogador joga, para provar a
// diversão em vez de adivinhar. Só observa: não mexe em nenhum número do jogo nem no save. O tempo em cada mapa e em cada
// tela, o resumo de cada dia, as paradas (mais de 60 s sem tecla nem clique com o jogo rodando), o que ficou esquecido, os
// cliques mudos, os erros e as notas do jogador (tecla N). Fica no armazenamento do navegador (as 3 últimas sessões) e sai
// num arquivo pelo botão "Baixar o diário da sessão" das Opções. Uma falha aqui nunca para o jogo.
const CAIXA_CHAVE = 'familia_santos_caixa_preta';
// (letras, não bytes: o navegador conta cada letra como 2 bytes; 300 mil dão centenas de dias e deixam espaço para o save)
// (pausa: depois de 5 min sem tecla nem clique, o tempo para de contar no dia, no mapa e na tela — o PC suspenso, o jantar da família)
const CAIXA_LIMITES = { sessoes: 3, letras: 300000, parada: 60000, pausa: 300000 };
// O registro puro: o armazém (getItem/setItem) e o relógio (ms) vêm de fora, para os testes usarem os de mentira.
function criarCaixaPreta(armazem, relogio = () => Date.now()) {
  const vazio = () => ({ versao: 1, sessoes: [] });
  const c = {
    dados: vazio(), relogio,
    _s: null, _sujo: false, _jaDesc: 0, _semEspaco: false, _errosSoltos: [], _mapa: null, _mapaDesde: 0, _tela: null, _telaDesde: 0, _ultimaEntrada: 0, _parada: null, _diaDesde: 0, _acum: { mapas: {}, telas: {} },
    carregar() {
      try { const t = armazem.getItem(CAIXA_CHAVE), d = t ? JSON.parse(t) : null; c.dados = d && d.versao === 1 && Array.isArray(d.sessoes) ? d : vazio(); }
      catch (e) { c.dados = vazio(); }
      return c;
    },
    // Sem espaço: o diário sai do armazenamento (o save do jogo vem antes) e segue só na memória da sessão.
    gravar() {
      if (c._semEspaco) return false;
      c._sujo = false;
      try { armazem.setItem(CAIXA_CHAVE, c._limitarTexto()); return true; }
      catch (e) { c._semEspaco = true; try { if (armazem.removeItem) armazem.removeItem(CAIXA_CHAVE); } catch (e2) { } return false; }
    },
    // A gravação de 30 em 30 s: só quando algo novo entrou no diário.
    gravarSeMudou() { return c._sujo ? c.gravar() : false; },
    novaSessao(info = {}) {
      const agora = c.relogio();
      c._s = { inicio: new Date(agora).toISOString(), saveDia: info.dia || 1, dias: [], paradas: [], notas: [], mudos: [], erros: [] };
      // As sessões anteriores sem nada (recarregar a página, Continuar e sair) não tomam a vaga das que têm dias jogados.
      c.dados.sessoes = c.dados.sessoes.filter(x => x.dias.length || x.notas.length || x.paradas.length || x.mudos.length || x.erros.length);
      c._s.erros.push(...c._errosSoltos.splice(0)); c.dados.sessoes.push(c._s);
      while (c.dados.sessoes.length > CAIXA_LIMITES.sessoes) c.dados.sessoes.shift();
      c._mapa = null; c._tela = null; c._parada = null; c._ultimaEntrada = agora; c._diaDesde = agora; c._jaDesc = 0; c._acum = { mapas: {}, telas: {} }; c._sujo = true;
      return c._s;
    },
    sessao() { return c._s || c.novaSessao(); },
    _soma(tipo, nome, ms) { if (!nome || ms <= 0) return; c._acum[tipo][nome] = Math.round(((c._acum[tipo][nome] || 0) + ms / 1000) * 10) / 10; },
    entraMapa(id) { const agora = c.relogio(); if (c._mapa) c._soma('mapas', c._mapa, agora - c._mapaDesde); c._mapa = id; c._mapaDesde = agora; },
    abreTela(nome) { const agora = c.relogio(); if (c._tela) c._soma('telas', c._tela, agora - c._telaDesde); c._tela = nome || 'menu'; c._telaDesde = agora; },
    fechaTela() { const agora = c.relogio(); if (c._tela) c._soma('telas', c._tela, agora - c._telaDesde); c._tela = null; },
    tela() { return c._tela; },
    // A pausa longa: o que passou de 5 min desde a última entrada sai do dia, do mapa e da tela (empurrando o começo deles).
    _descontaPausa(agora) {
      const extra = Math.max(0, agora - c._ultimaEntrada - CAIXA_LIMITES.pausa) - c._jaDesc; if (extra <= 0) return;
      c._jaDesc += extra;
      for (const k of ['_diaDesde', '_mapaDesde', '_telaDesde']) c[k] = Math.min(c[k] + extra, agora);
    },
    // Uma tecla ou um clique: a parada aberta fecha com a duração; a contagem recomeça.
    entrada() {
      const agora = c.relogio(); c._descontaPausa(agora); c._ultimaEntrada = agora; c._jaDesc = 0;
      if (c._parada) { c._parada.s = Math.round((agora - c._parada.desde) / 1000); delete c._parada.desde; c._parada = null; c._sujo = true; }
    },
    // A cada quadro com o jogo rodando: passou de 60 s sem entrada, abre uma parada (uma só, até a próxima entrada).
    tique(ctx) {
      const agora = c.relogio();
      if (c._parada || agora - c._ultimaEntrada < CAIXA_LIMITES.parada) return null;
      c._parada = Object.assign({ desde: c._ultimaEntrada, s: 0, tela: c._tela }, ctx);
      c.sessao().paradas.push(c._parada); c._sujo = true;
      return c._parada;
    },
    nota(texto, ctx) {
      const t = String(texto || '').trim().slice(0, 500); if (!t) return null;
      const n = Object.assign({ texto: t, tela: c._tela, quando: new Date(c.relogio()).toISOString() }, ctx, { texto: t });
      c.sessao().notas.push(n); c.gravar(); return n;
    },
    mudo(ctx) { const s = c.sessao(); if (s.mudos.length < 300) { s.mudos.push(ctx); c._sujo = true; } },
    // Um erro antes de abrir a sessão (ainda na capa) espera a sessão, sem abrir uma sozinho.
    erro(msg) { const s = c._s, l = s ? s.erros : c._errosSoltos; if (l.length < 50) { l.push(String(msg).slice(0, 200)); c._sujo = true; } },
    fimDoDia(resumo) {
      const agora = c.relogio(); c._descontaPausa(agora);
      if (c._mapa) { c._soma('mapas', c._mapa, agora - c._mapaDesde); c._mapaDesde = agora; }
      if (c._tela) { c._soma('telas', c._tela, agora - c._telaDesde); c._telaDesde = agora; }
      const d = Object.assign({ real: Math.round((agora - c._diaDesde) / 1000), mapas: c._acum.mapas, telas: c._acum.telas }, resumo);
      c.sessao().dias.push(d); delete c.sessao().parcial; c._acum = { mapas: {}, telas: {} }; c._diaDesde = agora; c.gravar();
      return d;
    },
    // A página fechando (pagehide): a parada aberta ganha a duração até aqui e o dia em andamento fica como parcial (o próximo
    // fim de dia o troca pelo dia inteiro). É o momento mais revelador: onde o jogador largou o jogo.
    fecharPagina(resumo) {
      const agora = c.relogio(); c._descontaPausa(agora);
      if (c._parada) c._parada.s = Math.round((agora - c._parada.desde) / 1000);
      const ac = JSON.parse(JSON.stringify(c._acum)), soma = (o, nome, ms) => { if (nome && ms > 0) o[nome] = Math.round(((o[nome] || 0) + ms / 1000) * 10) / 10; };
      soma(ac.mapas, c._mapa, agora - c._mapaDesde); soma(ac.telas, c._tela, agora - c._telaDesde);
      c.sessao().parcial = Object.assign({ real: Math.round((agora - c._diaDesde) / 1000), mapas: ac.mapas, telas: ac.telas }, resumo, { parcial: true });
      return c.gravar();
    },
    // O limite de tamanho: saem as sessões velhas; depois, na sessão que sobra, os cliques mudos e as paradas mais antigas.
    // Os dias e as notas nunca saem.
    limitar() { return c._limitarTexto().length; },
    _limitarTexto() {
      let t = JSON.stringify(c.dados);
      while (t.length > CAIXA_LIMITES.letras && c.dados.sessoes.length > 1) { c.dados.sessoes.shift(); t = JSON.stringify(c.dados); }
      const s = c.dados.sessoes[0];
      while (t.length > CAIXA_LIMITES.letras && s && (s.mudos.length || s.paradas.length > 50)) {
        if (s.mudos.length) s.mudos.splice(0, Math.ceil(s.mudos.length / 2)); else s.paradas.splice(0, Math.min(Math.ceil(s.paradas.length / 4), s.paradas.length - 50));
        t = JSON.stringify(c.dados);
      }
      return t;
    },
    exportar() { return JSON.stringify(c.dados, null, 1); },
  };
  return c;
}
// ---------- no jogo ----------
const seguroCP = f => function (...a) { try { return f.apply(this, a); } catch (e) { return undefined; } };   // a caixa-preta nunca para o jogo
const CAIXA = criarCaixaPreta((() => { try { return window.localStorage || { getItem: () => null, setItem: () => {} }; } catch (e) { return { getItem: () => null, setItem: () => {} }; } })()).carregar();
const CAIXA_ABERTOS = new Set();
let _nomeSistemaCP = null, _avisosCP = 0, _dinheiroManhaCP = null, _desmaioCP = false;
const _vistoCartaCP = {}, _vistoTarefaCP = {};
function ctxJogo() {
  return { dia: G.dia, hora: typeof relogio !== 'undefined' && relogio.textoHora ? relogio.textoHora() : G.minutos, mapa: G.mapaId,
    x: G.jog ? Math.floor(G.jog.x / TILE) : 0, y: G.jog ? Math.floor((G.jog.y - 36) / TILE) : 0 };
}
// O nome da tela: o do sistema que a abriu; senão o título do painel; senão quem fala; senão a classe do painel.
function nomeDaTela(n) {
  if (_nomeSistemaCP) return _nomeSistemaCP;
  try {
    const t = n.querySelector && (n.querySelector('.titulo') || n.querySelector('.quem'));
    // (só o título: o texto que vem depois, como o dinheiro da banca, fica de fora)
    const txt = t ? ((t.firstChild && t.firstChild.nodeType === 3 ? t.firstChild.textContent : t.textContent) || '').replace(/^[^\p{L}\d]+/u, '').trim() : ''; if (txt) return txt.slice(0, 40);
    return String(n.className || 'menu').replace('painel', '').trim().slice(0, 40) || 'menu';
  } catch (e) { return 'menu'; }
}
// Os sistemas que a caixa-preta acompanha (abertos ou nunca abertos na sessão); só os que existem no jogo.
// (só funções declaradas com `function` ficam em window; o abrirQuadroServicos é const e chama o abrirQuadro, que é o embrulhado)
const SISTEMAS_CAIXA = [['mochila', 'abrirMochila'], ['caderno', 'abrirCaderno'], ['quadro de serviços', 'abrirQuadro'], ['tela da pensão', 'abrirPainelPensao'],
  ['metas', 'abrirMetas'], ['habilidades', 'abrirHabilidades'], ['fabricar', 'abrirFabricar'], ['Bazar', 'abrirBazar'], ['depósito', 'abrirLoja'],
  ['melhorias', 'abrirMelhorias'], ['equipe', 'abrirEquipe'], ['correio', 'abrirCorreio'], ['ferraria', 'abrirFerraria'], ['Prefeitura', 'abrirPrefeitura'],
  ['despensa', 'abrirDespensa'], ['prancheta', 'abrirPrancheta'], ['opções', 'abrirOpcoes']].filter(([, f]) => typeof window[f] === 'function');
for (const [nome, f] of SISTEMAS_CAIXA) {
  const orig = window[f];
  window[f] = function (...a) { CAIXA_ABERTOS.add(nome); _nomeSistemaCP = nome; try { return orig.apply(this, a); } finally { _nomeSistemaCP = null; } };
}
// O tempo de cada tela: abrir e fechar menus.
{ const abrir0 = abrirModal, fechar0 = fecharModal;
  abrirModal = function (conteudo, aoFechar) { const r = abrir0(conteudo, aoFechar); seguroCP(() => CAIXA.abreTela(nomeDaTela(conteudo)))(); return r; };
  fecharModal = function () { const aberto = !$('#modal').hidden; const r = fechar0(); if (aberto && $('#modal').hidden) seguroCP(() => CAIXA.fechaTela())(); return r; }; }
// O jogo respondeu com um aviso (para o clique mudo saber).
{ const avisar0 = avisar; avisar = function (...a) { _avisosCP++; return avisar0.apply(this, a); }; }
// O clique mudo: a ação (X ou botão direito) que não abriu nada, não avisou e não mudou nada.
{ const estado = () => JSON.stringify([G.dinheiro, Math.round(G.energia || 0), G.mapaId, G.mapa ? G.mapa.objs.length : 0, G.mochila ? G.mochila.slots.map(x => x ? x.id + x.qtd : '').join() : '',
    G.jog && G.jog.carga ? G.jog.carga.id || '' : '', G.dia, _avisosCP,
    G.obra && G.obra.lista ? JSON.stringify(G.obra.lista.feito) : '', G.guia ? G.guia.versao : 0]);   // (Frente 4: avançar a obra ou o guia também é resposta)
  for (const f of ['acaoNaFrente', 'acaoNoMouse']) {
    const orig = window[f]; if (typeof orig !== 'function') continue;
    // (o alvo: o ladrilho na frente do Jocelino, ou o do mouse no botão direito)
    window[f] = function (...a) { let antes = null, alvo = null;
      try { antes = estado(); const p = f === 'acaoNaFrente' ? G.jog.frente() : mouseMundo(); alvo = [Math.floor(p.x / TILE), Math.floor(p.y / TILE)]; } catch (e) { }
      const r = orig.apply(this, a);
      seguroCP(() => { if (antes !== null && !menuAberto() && estado() === antes) CAIXA.mudo(Object.assign(ctxJogo(), { alvo })); })();
      return r; };
  } }
// O desmaio (o dormir que veio do cansaço).
{ const dormir0 = dormir; dormir = function (desmaiou) { _desmaioCP = !!desmaiou; return dormir0.apply(this, arguments); }; }
// O que ficou esquecido: cartas na caixa há 3 dias ou mais, tarefas paradas há 5 dias ou mais, sistemas nunca abertos.
// (o que sumiu da caixa ou do quadro recomeça a contagem: a tarefa que se repete não conta os dias de antes)
function esquecidos() {
  const caixa = G.correio ? G.correio.caixa : [];
  for (const id in _vistoCartaCP) if (!caixa.includes(id)) delete _vistoCartaCP[id];
  const cartas = caixa.filter(id => { if (!_vistoCartaCP[id]) _vistoCartaCP[id] = G.dia; return G.dia - _vistoCartaCP[id] >= 3; });
  const tarefas = [], hoje = new Set();
  for (const f of TAREFAS) { try { for (const t of f() || []) { const k = t.texto; hoje.add(k); if (!_vistoTarefaCP[k]) _vistoTarefaCP[k] = G.dia; if (G.dia - _vistoTarefaCP[k] >= 5) tarefas.push(k); } } catch (e) { } }
  for (const k in _vistoTarefaCP) if (!hoje.has(k)) delete _vistoTarefaCP[k];
  return { cartas, tarefas: tarefas.slice(0, 10), nunca: SISTEMAS_CAIXA.map(([n]) => n).filter(n => !CAIXA_ABERTOS.has(n)) };
}
// Os ganchos: a sessão nova ao começar ou carregar; o mapa; a parada; a manhã; o fim do dia; a tecla e o clique; os erros.
INICIADORES.push(seguroCP(s => { CAIXA.novaSessao({ dia: s && s.dia }); CAIXA_ABERTOS.clear(); _dinheiroManhaCP = null;
  for (const o of [_vistoCartaCP, _vistoTarefaCP]) for (const k in o) delete o[k]; }));
AO_ENTRAR_MAPA.push(seguroCP(id => CAIXA.entraMapa(id)));
ATUALIZADORES.push(seguroCP(() => {
  if (_dinheiroManhaCP === null) _dinheiroManhaCP = G.dinheiro;
  if (CAIXA.tela() && $('#modal').hidden) CAIXA.fechaTela();   // um menu que fechou sem passar pelo fecharModal (as perguntas)
  CAIXA.tique(ctxJogo());
}));
MANHA.push(seguroCP(() => { _dinheiroManhaCP = G.dinheiro; }));
NOITE.push(seguroCP(linhas => {
  const p = G.pensao, r = G.relatorioPensao, l = G.obra && G.obra.lista && G.obra.lista.dia === G.dia ? G.obra.lista : null;
  CAIXA.fimDoDia({ dia: G.dia, hora: G.minutos, dinheiro: [_dinheiroManhaCP === null ? G.dinheiro : _dinheiroManhaCP, G.dinheiro], ganho: G.ganhoHoje, gasto: G.gastoHoje,
    funcao: G.obra ? G.obra.funcao : 0, estrelas: p && p.estrelasCasa ? p.estrelasCasa() : 0,
    obra: l ? (l.paga ? 'paga' : l.fechado ? 'pela metade' : 'sem terminar') : (typeof Obra !== 'undefined' ? Obra.aberta(G.dia, 8 * 60) || 'faltou' : ''),
    janta: r && p && p.ultimaJanta === G.dia ? { clientes: r.clientes, servidos: r.servidos, embora: r.embora, ganho: r.ganho, gorjeta: r.gorjeta, estrelas: r.estrelas }
      : (typeof pensaoAbreHoje === 'function' && pensaoAbreHoje() ? 'a Rosa sozinha' : 'fechada'),
    empreitas: G.empreitas ? { entregues: G.empreitas.entregues, aceitas: Object.keys(G.empreitas.aceitas).length } : null,
    bazar: G.bazar ? G.bazar.comprados.slice() : [], cartasLidas: G.correio ? G.correio.lidas.length : 0, desmaio: _desmaioCP, esquecidos: esquecidos(), linhas: linhas.length });
  _desmaioCP = false;
}));
addEventListener('keydown', seguroCP(() => CAIXA.entrada()), true);
addEventListener('mousedown', seguroCP(() => CAIXA.entrada()), true);
addEventListener('wheel', seguroCP(() => CAIXA.entrada()), { capture: true, passive: true });
addEventListener('error', seguroCP(e => CAIXA.erro(e.message || e)));
// O laço do jogo e o dormir engolem os erros com console.error: eles também vão para o diário.
const _consoleCP = { orig: console.error.bind(console) };
console.error = function (...a) { _consoleCP.orig(...a); seguroCP(() => CAIXA.erro(a.map(x => x && x.message ? x.message : String(x)).join(' ')))(); };
addEventListener('unhandledrejection', seguroCP(e => CAIXA.erro('promessa: ' + (e.reason && e.reason.message || e.reason))));
setInterval(seguroCP(() => CAIXA.gravarSeMudou()), 30000);
// A página fechando: a parada aberta e o dia em andamento entram no diário (onde o jogador largou o jogo).
addEventListener('pagehide', seguroCP(() => {
  if (!G.dia || !$('#capa').hidden) { CAIXA.gravar(); return; }
  const p = G.pensao;
  CAIXA.fecharPagina({ dia: G.dia, hora: G.minutos, dinheiro: [_dinheiroManhaCP === null ? G.dinheiro : _dinheiroManhaCP, G.dinheiro], ganho: G.ganhoHoje, gasto: G.gastoHoje,
    funcao: G.obra ? G.obra.funcao : 0, estrelas: p && p.estrelasCasa ? p.estrelasCasa() : 0, obra: '', janta: '', mapa: G.mapaId });
}));
// ---------- a nota do jogador (tecla N) e a entrega do diário ----------
function abrirNota() {
  if (menuAberto()) return false;
  const ctx = Object.assign(ctxJogo(), { tela: CAIXA.tela() });
  const area = el('textarea', { class: 'nota-texto', rows: 4, maxlength: 500, placeholder: 'Ex.: "não sei o que fazer agora", "isso cansou", "isso foi legal!"' });
  const guardar = () => { const n = CAIXA.nota(area.value, ctx); fecharModal(); avisar(n ? 'Nota guardada no diário. Obrigado!' : 'A nota estava vazia.'); };
  const caixa = el('div', { class: 'painel nota-caixa' }, el('div', { class: 'titulo' }, 'O que você está achando agora?'), area,
    el('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-top:8px' },
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar'),
      el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); guardar(); } }, 'Guardar')));
  _nomeSistemaCP = 'nota'; try { abrirModal(caixa); } finally { _nomeSistemaCP = null; }
  setTimeout(() => area.focus(), 0);
  return true;
}
// N abre a nota (fora de menu e da capa; no salão durante a janta, não: ali a nota fica no menu Esc).
addEventListener('keydown', seguroCP(e => {
  if (e.code !== 'KeyN' || e.repeat || /^(TEXTAREA|INPUT)$/.test((e.target && e.target.tagName) || '')) return;
  if (!$('#capa').hidden || menuAberto() || (typeof noPalco === 'function' && noPalco() && G.turno)) return;
  abrirNota();
}));
function baixarArquivo(nome, texto) {
  const a = el('a', { href: URL.createObjectURL(new Blob([texto], { type: 'application/json' })), download: nome });
  document.body.append(a); a.click(); a.remove();
}
function baixarDiario() {
  CAIXA.gravar();
  const d = new Date(), p = n => String(n).padStart(2, '0');
  baixarArquivo(`familia-santos-diario-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`, CAIXA.exportar());
  avisar('O diário foi baixado (pasta Downloads).');
}
