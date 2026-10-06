/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚙️ CONFIGURAÇÕES + ☰ MENU (v397; dono: "o menu Mais tem uma lista gigantesca e deixa o jogo poluído... um sistema de
   configurações digno de um jogo de verdade"; escolhas do dono: abas laterais, menu em grade com grupos, e as novidades:
   salvar som geral e zoom, seta amarela e dicas, o que mostrar na tela, acessibilidade).
   - ⚙️ CONFIGURAÇÕES (botão ⚙️ no topo, ou Esc quando não há nada para fechar): 🔊 Som · 🖥️ Vídeo · 🧩 Interface ·
     🎮 Jogo · ⌨️ Teclas · 🌐 Online (só no site, logado) · ♿ Acessibilidade · 💾 Conta. As opções que já existiam
     espalhadas (🎵, gráficos leves, arcos, interface, tela e painéis, atalhos, esconder jogadores, estatísticas, backup)
     agora moram aqui; as janelas de tela/atalhos/backup aparecem DENTRO da aba (opcEmbute).
   - ☰ MENU: o antigo "☰ Mais" vira uma grade com grupos (Personagem, Aventura, Social, Coleção, Ajuda); o que é
     configuração sai dele. ⚙️ Configurações e 🚪 Sair ficam no rodapé.
   - NOVIDADES: som geral e zoom ficam salvos; ligar/desligar seta amarela, dicas, números de dano/cura, nomes,
     barras de vida dos adversários, efeitos/partículas e clima; tamanho do texto; cores para daltônicos.
   Tudo em rac_opcoes_v1 (deste aparelho). Carregar POR ÚLTIMO.
   ============================================================ */
const OPC_KEY = 'rac_opcoes_v1';
const OPC_PADRAO = { somGeral: true, zoom: null, seta: true, dicas: true, numeros: true, nomes: true, barrasAdv: true, particulas: true, clima: true, texto: 'normal', daltonico: false };
let OPC = Object.assign({}, OPC_PADRAO, (() => { try { return JSON.parse(localStorage.getItem(OPC_KEY) || '{}') || {}; } catch (e) { return {}; } })());
function opcGrava() { try { localStorage.setItem(OPC_KEY, JSON.stringify(OPC)); } catch (e) { } }

/* ---------- as opções novas: onde elas agem ---------- */
// som geral (o botão 🔊) e zoom: salvos
function opcAplicaSom() { G.somOn = OPC.somGeral !== false; const b = document.getElementById('btnSom'); if (b) { b.textContent = G.somOn ? '🔊' : '🔇'; b.title = G.somOn ? 'Som ligado (clique para desligar)' : 'Som desligado (clique para ligar)'; } }
document.addEventListener('click', ev => { if (ev.target && ev.target.closest && ev.target.closest('#btnSom')) setTimeout(() => { OPC.somGeral = G.somOn !== false; opcGrava(); }, 0); }, true);
if (typeof mudaZoom === 'function') { const _mzOpc = mudaZoom; mudaZoom = function () { const r = _mzOpc.apply(this, arguments); OPC.zoom = G.zoomVis; opcGrava(); return r; }; }
// seta amarela e dicas
if (typeof dica === 'function') { const _dicaOpc = dica; dica = function () { if (OPC.dicas === false) return; return _dicaOpc.apply(this, arguments); }; }
// números de dano/cura, nomes, barras de vida dos adversários, efeitos
if (typeof texto === 'function') { const _txOpc = texto; texto = function (ent, txt) { if (OPC.numeros === false && /^\s*[+\-−]?\s*[\d.,]+\s*[!]?\s*$/.test(String(txt))) return; return _txOpc.apply(this, arguments); }; }
if (typeof placaNPC === 'function') { const _plOpc = placaNPC; placaNPC = function () { if (OPC.nomes === false) return; return _plOpc.apply(this, arguments); }; }
if (typeof rotulo === 'function') { const _roOpc = rotulo; rotulo = function (ctx, txt) { if (OPC.nomes === false && /^Nv \d+ · /.test(String(txt))) return; return _roOpc.apply(this, arguments); }; }
if (typeof barraVida === 'function') { const _bvOpc = barraVida; barraVida = function () { if (OPC.barrasAdv === false && arguments[5] === 5) return; return _bvOpc.apply(this, arguments); }; } // (a barra dos adversários é a de altura 5)
if (typeof efeito === 'function') { const _efOpc = efeito; efeito = function (tipo) { if (OPC.particulas === false && tipo !== 'nivel') return; return _efOpc.apply(this, arguments); }; }
function opcAplicaClima() { if (typeof VENTO !== 'undefined') VENTO.on = OPC.clima !== false && !G.leve; }
// acessibilidade: tamanho do texto da interface (o mapa não muda) e cores para daltônicos
const OPC_DALT = { incomum: '#56b4e9', raro: '#0072b2', epico: '#cc79a7', lendario: '#e69f00' }, OPC_RAR0 = {};
function opcAplicaAcess() {
  const b = document.body; b.classList.remove('opc-texto-pequeno', 'opc-texto-grande', 'opc-texto-enorme'); if (OPC.texto && OPC.texto !== 'normal') b.classList.add('opc-texto-' + OPC.texto);
  b.classList.toggle('opc-daltonico', !!OPC.daltonico);
  if (typeof RARIDADE !== 'undefined') for (const [k, c] of Object.entries(OPC_DALT)) if (RARIDADE[k]) { if (!(k in OPC_RAR0)) OPC_RAR0[k] = RARIDADE[k].cor; RARIDADE[k].cor = OPC.daltonico ? c : OPC_RAR0[k]; }
  if (typeof encaixaTela === 'function') setTimeout(() => { try { encaixaTela(); } catch (e) { } }, 60);
}
if (typeof corNivel === 'function') { const _cnOpc = corNivel; corNivel = function (n) { const c = _cnOpc.apply(this, arguments); if (!OPC.daltonico) return c; return { '#7aff8a': '#56b4e9', '#ffb040': '#e69f00', '#ff5a4a': '#d55e00' }[c] || c; }; }
function opcAplicaTudo() { opcAplicaSom(); opcAplicaClima(); opcAplicaAcess(); if (OPC.zoom) G.zoomVis = OPC.zoom; G.guiaOn = OPC.seta !== false; }
{ const _iniOpc = iniciarJogo; iniciarJogo = async function () { const r = await _iniOpc.apply(this, arguments); try { opcAplicaTudo(); } catch (e) { } return r; }; }
try { opcAplicaSom(); opcAplicaAcess(); } catch (e) { }

/* ---------- janelas que já existiam, desenhadas DENTRO da aba ---------- */
let OPC_CAP = null; // onde o próximo abreModal desenha (enquanto uma janela embutida está sendo montada)
const OPC_EMB = {}; // nome da função -> elemento da aba (quando a janela de Configurações está aberta nela)
{
  const _abOpc = abreModal;
  abreModal = function (...nos) {
    if (OPC_CAP && document.body.contains(OPC_CAP)) { OPC_CAP.innerHTML = ''; OPC_CAP.append(...nos.filter(n => n && !(n.tagName === 'H2'))); abreModal.largo = false; G.pausado = true; return; }
    return _abOpc.apply(this, arguments);
  };
}
function opcEmbute(nome, alvo) {
  const f = window[nome]; if (typeof f !== 'function') return false;
  if (!f._opc) { const orig = f; window[nome] = function () { const a = OPC_EMB[nome]; if (a && document.body.contains(a)) { const ant = OPC_CAP; OPC_CAP = a; try { return orig.apply(this, arguments); } finally { OPC_CAP = ant; } } return orig.apply(this, arguments); }; window[nome]._opc = true; }
  OPC_EMB[nome] = alvo; window[nome](); return true;
}

/* ---------- a janela ⚙️ Configurações ---------- */
let OPC_ABA = 'som';
const opcOnline = () => typeof PORTAL !== 'undefined' && PORTAL.ativo && !window.LENDA_STEAM;
function opcAbas() {
  return [['som', '🔊', 'Som'], ['video', '🖥️', 'Vídeo'], ['interface', '🧩', 'Interface'], ['jogo', '🎮', 'Jogo'], ['teclas', '⌨️', 'Teclas'],
    ...(opcOnline() ? [['online', '🌐', 'Online']] : []), ['acess', '♿', 'Acessibilidade'], ['conta', '💾', 'Conta']];
}
// peças da janela
const opcLinha = (rot, desc, ctrl) => el('div', { class: 'opc-linha' }, el('div', { class: 'opc-rot' }, el('b', {}, rot), desc ? el('small', {}, desc) : ''), ctrl);
function opcChave(rot, desc, on, fn) {
  const b = el('button', { class: 'opc-chave' + (on ? ' on' : ''), type: 'button', role: 'switch', 'aria-checked': String(!!on), title: on ? 'Ligado' : 'Desligado' }, el('i'), el('span', {}, on ? 'Ligado' : 'Desligado'));
  b.onclick = () => { fn(!on); som('equip'); opcAbre(OPC_ABA); };
  return opcLinha(rot, desc, b);
}
function opcBarra(rot, desc, val, min, max, passo, fmtV, fn) {
  const r = el('input', { type: 'range', min, max, step: passo, value: val }), o = el('output', {}, fmtV(val));
  r.oninput = () => { o.textContent = fmtV(+r.value); fn(+r.value); };
  return opcLinha(rot, desc, el('div', { class: 'opc-barra' }, r, o));
}
function opcEscolha(rot, desc, ops, atual, fn) {
  return opcLinha(rot, desc, el('div', { class: 'opc-chips' }, ...ops.map(([v, txt]) => el('button', { class: 'btn mini' + (v === atual ? ' amarelo' : ''), type: 'button', onclick: () => { fn(v); som('equip'); opcAbre(OPC_ABA); } }, txt))));
}
const opcTit = t => el('h3', { class: 'opc-tit' }, t);
const opcPadrao = chaves => el('div', { class: 'opc-rodape' }, el('button', { class: 'btn mini', type: 'button', onclick: () => { for (const k of chaves) OPC[k] = OPC_PADRAO[k]; opcGrava(); opcAplicaTudo(); if (chaves.includes('zoom')) G.zoomVis = 15.5; opcAbre(OPC_ABA); } }, '↺ Restaurar padrão desta aba'));
function opcConteudo(aba) {
  const c = el('div', { class: 'opc-corpo' }), s = G.save || {};
  if (aba === 'som') {
    const A = window.RAC_AUDIO, pop = document.querySelector('.rac-audio-pop'), ranges = pop ? [...pop.querySelectorAll('input[type=range]')] : [];
    const vol = (rot, chave, k, desc) => opcBarra(rot, desc, A ? Math.round((A.vol[chave] || 0) * 100) : 50, 0, 100, 5, v => v + '%', v => { const r = ranges[k]; if (r) { r.value = v; r.dispatchEvent(new Event('input')); } else if (A) A.vol[chave] = v / 100; });
    c.append(opcTit('🔊 Som'),
      opcChave('Som do jogo', 'Liga e desliga todo o som (o mesmo do botão 🔊). Agora fica salvo.', G.somOn !== false, v => { OPC.somGeral = v; opcGrava(); opcAplicaSom(); }),
      vol('Música', 'musica', 0, 'As músicas de cada lugar'), vol('Ambiente', 'ambiente', 1, 'Chuva, ondas, passarinhos e torcida'), vol('Efeitos', 'sfx', 2, 'Chutes, moedas, golpes'),
      opcPadrao(['somGeral']));
  } else if (aba === 'video') {
    const leveBt = document.getElementById('btnLevePC') || document.getElementById('cmLeve');
    const fpsCx = document.querySelector('.rac-audio-pop input[type=checkbox]');
    c.append(opcTit('🖥️ Vídeo'));
    if (leveBt) c.append(opcChave('Gráficos leves', 'Para computador ou celular mais simples: menos brilho e animação, o jogo fica mais liso.', !!G.leve, () => { leveBt.click(); opcAplicaClima(); }));
    if (fpsCx) c.append(opcChave('Mostrar FPS', 'Quantos quadros por segundo o jogo está fazendo (canto da tela).', fpsCx.checked, () => fpsCx.click()));
    if (typeof TELA_MODO !== 'undefined' && typeof trocaTela === 'function' && !document.body.classList.contains('modo-celular'))
      c.append(opcEscolha('Tela', 'Larga usa toda a largura da janela; cheia esconde o navegador (Esc sai).', [['normal', '🔲 Normal'], ['larga', '⬛ Larga'], ['cheia', '⛶ Cheia']], TELA_MODO, async v => { for (let k = 0; k < 3 && TELA_MODO !== v; k++) await trocaTela(); opcAbre('video'); }));
    if (typeof CV !== 'undefined' && CV && CV.getBoundingClientRect().width >= 640) c.append(opcBarra('Zoom do mapa', 'Mais perto ou mais longe (também na rodinha do mouse e nas teclas + e −). Fica salvo.', Math.round(31 - (G.zoomVis || 15.5)), 9, 22, 0.5, v => (v >= 15.5 ? '+' : '') + Math.round((v - 15.5) * 10) / 10, v => { G.zoomVis = 31 - v; OPC.zoom = G.zoomVis; opcGrava(); }));
    c.append(opcChave('Efeitos e partículas', 'Faíscas, poeira e brilhos dos golpes. Desligar deixa a tela mais limpa.', OPC.particulas !== false, v => { OPC.particulas = v; opcGrava(); }),
      opcChave('Clima', 'Vento, folhas e chuvinha passando pela tela.', OPC.clima !== false, v => { OPC.clima = v; opcGrava(); opcAplicaClima(); }),
      opcPadrao(['zoom', 'particulas', 'clima']));
  } else if (aba === 'interface') {
    c.append(opcTit('🧩 Interface'));
    if (typeof aplicaVisual === 'function') c.append(opcEscolha('Visual', 'Compacto dá mais espaço para o jogo; clássico deixa tudo maior.', [['compacto', 'Compacto'], ['classico', 'Clássico']], visualCompacto() ? 'compacto' : 'classico', v => aplicaVisual(v === 'compacto')));
    if (typeof HUD_BONECO !== 'undefined' && typeof guardaHud === 'function') {
      c.append(opcEscolha('Fôlego e foco no boneco', 'Arcos em volta do personagem, barrinhas em cima da cabeça, ou os dois.', [['ambos', 'Os dois'], ['arcos', 'Só arcos'], ['barras', 'Só barrinhas']], HUD_BONECO, v => { HUD_BONECO = v; ARCOS_ON = v !== 'barras'; guardaHud(); })); // v407 (Raio-X U4): sem a comparação com o Tibia no texto do jogador
      if (HUD_BONECO !== 'barras') c.append(opcEscolha('Distância dos arcos', '', [['perto', 'Perto'], ['media', 'Média'], ['longe', 'Longe']], ARCOS_DIST, v => { ARCOS_DIST = v; guardaHud(); }));
    }
    c.append(opcTit('👀 Mostrar na tela'),
      opcChave('Números de dano e cura', 'Os números que pulam quando alguém leva um golpe ou se cura.', OPC.numeros !== false, v => { OPC.numeros = v; opcGrava(); }),
      opcChave('Nomes', 'Nomes de adversários, personagens e outros jogadores (o seu continua).', OPC.nomes !== false, v => { OPC.nomes = v; opcGrava(); }),
      opcChave('Vida dos adversários', 'A barrinha de vida embaixo do nome de quem está brigando.', OPC.barrasAdv !== false, v => { OPC.barrasAdv = v; opcGrava(); }),
      opcPadrao(['numeros', 'nomes', 'barrasAdv']));
    if (typeof modalTelaPaineis === 'function' && !document.body.classList.contains('modo-celular')) { const box = el('div', { class: 'opc-emb' }); c.append(opcTit('🖥️ Tela e painéis'), box); setTimeout(() => opcEmbute('modalTelaPaineis', box), 0); }
  } else if (aba === 'jogo') {
    c.append(opcTit('🎮 Jogo'),
      opcChave('Seta amarela', 'A seta que aponta o próximo objetivo (missão, saída, personagem).', OPC.seta !== false, v => { OPC.seta = v; G.guiaOn = v; opcGrava(); }),
      opcChave('Dicas na tela', 'Os avisos de "Dica" que explicam o jogo. Quem já conhece pode desligar (o tutorial continua).', OPC.dicas !== false, v => { OPC.dicas = v; opcGrava(); }));
    if (s.nivel && typeof MODOS_ALVO !== 'undefined') c.append(opcEscolha('Quem o ESPAÇO marca', 'Qual adversário vira o alvo quando você aperta Espaço (tecla V troca).', Object.entries(MODOS_ALVO), s.modoAlvo || 'perto', v => { s.modoAlvo = v; G.alvo = null; if (typeof atualizaBotaoAlvo === 'function') atualizaBotaoAlvo(); }));
    if (typeof modalTreino === 'function') c.append(opcLinha('Modo Treino e treino offline', 'Deixar o personagem treinando sozinho.', el('button', { class: 'btn mini', type: 'button', onclick: () => modalTreino() }, '🏋️ Abrir')));
    c.append(opcPadrao(['seta', 'dicas']));
  } else if (aba === 'teclas') {
    const box = el('div', { class: 'opc-emb' }); c.append(opcTit('⌨️ Teclas'), box);
    if (typeof modalAtalhos === 'function') setTimeout(() => opcEmbute('modalAtalhos', box), 0); else box.append(el('p', {}, 'Os atalhos do teclado aparecem aqui.'));
  } else if (aba === 'online') {
    c.append(opcTit('🌐 Online'));
    if (typeof MO_ESCONDE !== 'undefined') c.append(opcChave('Esconder os outros jogadores', 'Você continua no mundo, só não vê os outros.', !!MO_ESCONDE, v => { MO_ESCONDE = v; if (typeof moGrava === 'function') moGrava('rac_mundo_esconde', v); }));
    if (typeof MO_MUDOS !== 'undefined') {
      const l = el('div', { class: 'opc-chips' }); for (const id of MO_MUDOS) { const o = typeof MO !== 'undefined' && MO.outros && MO.outros.get(id); l.append(el('button', { class: 'btn mini', type: 'button', title: 'Mostrar de novo', onclick: () => { MO_MUDOS.delete(id); try { localStorage.setItem('rac_mundo_mudos', JSON.stringify([...MO_MUDOS])); } catch (e) { } opcAbre('online'); } }, `🔈 ${o ? o.apelido : 'jogador ' + String(id).slice(-4)}`)); }
      c.append(opcLinha('Silenciados', MO_MUDOS.size ? 'Toque para mostrar de novo.' : 'Ninguém (botão direito num jogador → Silenciar).', l));
    }
    if (typeof estAlterna === 'function' && typeof estLigado === 'function') c.append(opcChave('Estatísticas anônimas', 'Só contagens (sem nome nem conta) para melhorar o jogo.', estLigado(), () => estAlterna()));
    // v407 (Raio-X U5): convites só de amigos (ligado por padrão) e ficar invisível no mundo (online_seguro.js)
    if (typeof osgMudaPref === 'function') {
      const P = window.ONLINE_SEGURO.OSG_PREFS();
      c.append(opcChave('Convites só de amigos', 'Convite para caçar em grupo só chega de amigos e colegas de guilda. Desligado: qualquer jogador pode chamar você.', !P.convitesTodos, v => osgMudaPref('convitesTodos', !v)),
        opcChave('Ficar invisível no mundo', 'Você continua vendo os outros jogadores, mas ninguém vê você nem os seus emotes.', !!P.invisivel, v => osgMudaPref('invisivel', v)));
    }
  } else if (aba === 'acess') {
    c.append(opcTit('♿ Acessibilidade'),
      opcEscolha('Tamanho do texto', 'Painéis, janelas e menus (o mapa não muda).', [['pequeno', 'A−'], ['normal', 'A'], ['grande', 'A+'], ['enorme', 'A++']], OPC.texto || 'normal', v => { OPC.texto = v; opcGrava(); opcAplicaAcess(); }),
      opcChave('Cores para daltônicos', 'Troca verde e vermelho por azul e laranja nas raridades e na força dos adversários.', !!OPC.daltonico, v => { OPC.daltonico = v; opcGrava(); opcAplicaAcess(); G.uiSujo = true; }),
      opcPadrao(['texto', 'daltonico']));
  } else if (aba === 'conta') {
    c.append(opcTit('💾 Conta e save'));
    const cel = typeof CEL_PREF !== 'undefined';
    if (cel) c.append(opcEscolha('Versão do jogo neste aparelho', 'A de celular tem botões grandes e o joystick; a de computador, os painéis.', [['on', '📱 Celular'], ['off', '🖥️ Computador']], document.body.classList.contains('modo-celular') ? 'on' : 'off', async v => {
      const agora = document.body.classList.contains('modo-celular') ? 'on' : 'off'; if (v === agora) return;
      if (await perguntaJogo(v === 'on' ? 'Usar a versão de CELULAR neste aparelho? O jogo recarrega (nada se perde).' : 'Usar a versão de COMPUTADOR neste aparelho? O jogo recarrega (nada se perde).', { sim: 'Trocar' })) { try { localStorage.setItem(CEL_PREF, v); } catch (e) { } try { if (typeof salvar === 'function') salvar(); } catch (e) { } location.reload(); }
    }));
    if (typeof modalSair === 'function') c.append(opcLinha('Sair', 'Sair do jogo (e da conta, se estiver logado).', el('button', { class: 'btn mini', type: 'button', onclick: () => { fechaModal(); modalSair(); } }, '🚪 Sair')));
    if (typeof modalBackup === 'function') { const box = el('div', { class: 'opc-emb' }); c.append(opcTit('💾 Cópia do save'), box); setTimeout(() => opcEmbute('modalBackup', box), 0); }
    // v407 (Raio-X U6): apagar do SITE os dados do jogo (o personagem deste aparelho continua) — online_seguro.js
    if (typeof osgApagaDados === 'function' && opcOnline()) c.append(opcLinha('Apagar meus dados do jogo', 'Apaga do site o save online, o ranking, a casa, a guilda, a feira e as torcidas. A conta do site continua.', el('button', { class: 'btn mini vermelho', type: 'button', onclick: () => osgApagaDados() }, '🗑️ Apagar')));
  }
  return c;
}
function opcAbre(aba) {
  if (aba) OPC_ABA = aba; const abas = opcAbas(); if (!abas.some(a => a[0] === OPC_ABA)) OPC_ABA = 'som';
  for (const k of Object.keys(OPC_EMB)) delete OPC_EMB[k];
  const nav = el('nav', { class: 'opc-nav' }, ...abas.map(([k, ic, nome]) => el('button', { class: 'opc-aba' + (k === OPC_ABA ? ' ativa' : ''), type: 'button', onclick: () => opcAbre(k) }, el('span', { class: 'opc-ic' }, ic), el('span', {}, nome))));
  abreModal.largo = true;
  abreModal(el('h2', {}, '⚙️ Configurações'), el('div', { class: 'opc-janela' }, nav, opcConteudo(OPC_ABA)));
  const mc = document.querySelector('#modal .modal-caixa'); if (mc) mc.classList.add('opc-modal');
}
{ const _fmOpc = fechaModal; fechaModal = function () { const mc = document.querySelector('#modal .modal-caixa'); if (mc) mc.classList.remove('opc-modal'); for (const k of Object.keys(OPC_EMB)) delete OPC_EMB[k]; return _fmOpc.apply(this, arguments); }; }

/* ---------- o ☰ MENU em grade ---------- */
// o que é configuração sai do menu (mora na janela ⚙️)
const OPC_SAI_DO_MENU = ['btnLevePC', 'btnArcos', 'btnArcosDist', 'btnInterface', 'btnEst', 'btnBackup'];
const OPC_GRUPOS = [
  ['personagem', '🧍 Personagem', /classe|jogadas|visual|montaria|treino|analisador/i],
  ['aventura', '🗺️ Aventura', /miss|tarefa|saga|origem|lendas|agência|agencia|recompensa|diária|diaria/i],
  ['social', '👥 Social', /amigo|grupo|guilda|feira|torre em grupo|jogando agora/i], // (v407: "👥 Jogando agora", online_seguro.js)
  ['colecao', '🏅 Coleção', /álbum|album|conquista|museu|ranking|personagens|bestiário|bestiario/i],
  ['ajuda', '📚 Ajuda', /wiki|ajuda|como jogar|bug/i],
];
function opcEhConfig(b) { if (OPC_SAI_DO_MENU.includes(b.id)) return true; if (b.dataset && b.dataset.abre === 'atalhos') return true; return /tela e pain|gráficos leves|estatísticas|fôlego e foco no boneco|distância dos arcos|interface (clássica|compacta)|exportar/i.test(b.textContent); }
const opcSepara = txt => { const m = String(txt).trim().match(/^((?:\p{Extended_Pictographic}|\p{Regional_Indicator})️?(?:‍\p{Extended_Pictographic}️?)*)\s*(.*)$/u); return m ? [m[1], m[2]] : ['•', String(txt).trim()]; };
function opcMenu() {
  let m = document.getElementById('opcMenu'); const lista = document.querySelector('#topo .tb-lista'), bt = document.getElementById('tbMais');
  if (m && !m.hidden) { m.hidden = true; return; }
  if (!m) { m = el('div', { id: 'opcMenu', role: 'menu', hidden: 'hidden' }); document.body.append(m); }
  m.innerHTML = '';
  const itens = lista ? [...lista.children].filter(b => b.tagName === 'BUTTON' && b.offsetParent !== undefined && b.style.display !== 'none' && !opcEhConfig(b)) : [];
  const sair = itens.find(b => /^🚪|sair/i.test(b.textContent.trim()) && /sair/i.test(b.textContent));
  const grupos = new Map(OPC_GRUPOS.map(g => [g[0], []])); grupos.set('outros', []);
  for (const b of itens) { if (b === sair) continue; const g = OPC_GRUPOS.find(x => x[2].test(b.textContent)); grupos.get(g ? g[0] : 'outros').push(b); }
  const tile = (b, ic, txt) => el('button', { class: 'opc-tile', type: 'button', title: b.title || txt, onclick: () => { m.hidden = true; b.click(); } }, el('span', { class: 'opc-tile-ic' }, ic), el('span', { class: 'opc-tile-tx' }, txt));
  for (const [k, nome] of [...OPC_GRUPOS.map(g => [g[0], g[1]]), ['outros', '✨ Mais']]) {
    const bs = grupos.get(k); if (!bs.length) continue;
    m.append(el('div', { class: 'opc-grupo' }, el('div', { class: 'opc-gtit' }, nome), el('div', { class: 'opc-grade' }, ...bs.map(b => { const [ic, txt] = opcSepara(b.textContent); return tile(b, ic, txt); }))));
  }
  m.append(el('div', { class: 'opc-mrodape' },
    el('button', { class: 'btn', type: 'button', onclick: () => { m.hidden = true; opcAbre(); } }, '⚙️ Configurações'),
    sair ? el('button', { class: 'btn', type: 'button', onclick: () => { m.hidden = true; sair.click(); } }, '🚪 Sair') : ''));
  m.hidden = false;
  const r = bt ? bt.getBoundingClientRect() : { bottom: 50, right: innerWidth - 10 };
  m.style.top = (r.bottom + 6) + 'px'; m.style.left = Math.max(8, Math.min(innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + 'px';
}
{
  const prende = (t = 0) => {
    const bt = document.getElementById('tbMais'); if (!bt) { if (t < 40) setTimeout(() => prende(t + 1), 250); return; }
    if (bt._opc) return; bt._opc = true;
    bt.textContent = '☰ Menu'; bt.title = 'Menu do jogo';
    bt.addEventListener('click', ev => { ev.stopImmediatePropagation(); ev.preventDefault(); const l = document.querySelector('#topo .tb-lista'); if (l) l.hidden = true; opcMenu(); }, true);
    if (!document.getElementById('btnOpc')) bt.parentElement.before(el('button', { class: 'btn mini', id: 'btnOpc', type: 'button', title: 'Configurações (Esc)', onclick: () => opcAbre() }, '⚙️'));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => prende()); else prende();
  document.addEventListener('pointerdown', ev => { const m = document.getElementById('opcMenu'); if (m && !m.hidden && !m.contains(ev.target) && !(ev.target.closest && ev.target.closest('#tbMais'))) m.hidden = true; }, true);
  // celular: ⚙️ no menu ☰ do celular
  const poeCel = (t = 0) => { const g = document.querySelector('#celMenu .cm-grade'); if (!g) { if (t < 40) setTimeout(() => poeCel(t + 1), 500); return; } if (!document.getElementById('cmOpc')) g.prepend(el('button', { class: 'btn cm-bt', id: 'cmOpc', type: 'button', onclick: () => { const cm = document.getElementById('celMenu'); if (cm) cm.hidden = true; opcAbre(); } }, el('span', { class: 'cm-ic' }, '⚙️'), 'Configurações')); };
  poeCel();
  // Esc: fecha o que estiver aberto; sem nada aberto (nem alvo, nem caminho), abre as Configurações
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape' || !G.rodando || ev.repeat) return;
    const m = document.getElementById('opcMenu'); if (m && !m.hidden) { m.hidden = true; return; }
    const modal = document.getElementById('modal'), aberto = (modal && !modal.hidden) || document.querySelector('.tb-lista:not([hidden]), .rac-audio-pop:not([hidden]), #mjMenu, .cj-caixa') || document.fullscreenElement;
    if (aberto || G.alvo || (G.caminho && G.caminho.length)) return;
    setTimeout(() => { if (document.getElementById('modal').hidden) opcAbre(); }, 0);
  }, true);
}
{
  const st = document.createElement('style');
  st.textContent = `
  #modal .modal-caixa.opc-modal { width: min(880px, 96vw); }
  .opc-janela { display: grid; grid-template-columns: 170px 1fr; gap: 12px; min-height: 380px; }
  .opc-nav { display: flex; flex-direction: column; gap: 4px; border-right: 2px solid rgba(138,75,36,.25); padding-right: 8px; }
  .opc-aba { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 0; border-radius: 8px; background: transparent; font: 700 14px Fredoka, Nunito, sans-serif; color: var(--tinta, #3b2410); cursor: pointer; text-align: left; }
  .opc-aba:hover { background: rgba(255,210,63,.25); } .opc-aba.ativa { background: #ffd23f; box-shadow: inset 0 0 0 2px #8a4b24; }
  .opc-ic { font-size: 18px; width: 22px; text-align: center; }
  .opc-corpo { max-height: 62vh; overflow-y: auto; padding-right: 6px; }
  .opc-tit { margin: 4px 0 6px; font-size: 16px; color: var(--madeira2, #5e2f14); }
  .opc-linha { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 4px; border-bottom: 1px dashed rgba(138,75,36,.25); }
  .opc-rot { display: flex; flex-direction: column; } .opc-rot small { opacity: .75; font-size: 12px; max-width: 420px; }
  .opc-chave { display: inline-flex; align-items: center; gap: 6px; border: 0; background: transparent; cursor: pointer; font: 700 12px Nunito, sans-serif; color: inherit; flex: none; }
  .opc-chave i { width: 40px; height: 22px; border-radius: 12px; background: #b9a68a; position: relative; transition: background .15s; }
  .opc-chave i::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.4); transition: left .15s; }
  .opc-chave.on i { background: #3ac26a; } .opc-chave.on i::after { left: 21px; }
  .opc-barra { display: flex; align-items: center; gap: 8px; flex: none; width: 240px; } .opc-barra input { flex: 1; accent-color: #8a4b24; } .opc-barra output { width: 44px; text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; }
  .opc-chips { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; flex: none; max-width: 360px; }
  .opc-rodape { margin-top: 10px; text-align: right; }
  .opc-emb { padding: 4px 0; } .opc-emb .opcoes { flex-wrap: wrap; }
  @media (max-width: 640px) { .opc-janela { grid-template-columns: 1fr; } .opc-nav { flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 2px solid rgba(138,75,36,.25); padding: 0 0 6px; } .opc-aba { flex: none; padding: 6px 8px; } .opc-linha { flex-wrap: wrap; } .opc-barra { width: 100%; } .opc-chips { justify-content: flex-start; } }
  #opcMenu { position: fixed; z-index: 62; width: min(460px, 96vw); max-height: 80vh; overflow-y: auto; background: var(--papel, #f7e3b5); color: var(--tinta, #3b2410); border: 3px solid var(--madeira, #8a4b24); border-radius: 10px; box-shadow: 0 0 0 2px var(--madeira2, #5e2f14), 0 10px 24px rgba(0,0,0,.4); padding: 8px 10px; }
  .opc-grupo { margin-bottom: 6px; } .opc-gtit { font: 800 12px Fredoka, Nunito, sans-serif; letter-spacing: .04em; text-transform: uppercase; color: var(--madeira2, #5e2f14); margin: 4px 2px; }
  .opc-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 6px; }
  .opc-tile { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px; border: 2px solid #c9a46a; border-radius: 8px; background: #fff7e6; cursor: pointer; font: 700 11px Nunito, sans-serif; color: inherit; line-height: 1.15; }
  .opc-tile:hover { background: #fff0c2; border-color: #e0b020; } .opc-tile-ic { font-size: 22px; } .opc-tile-tx { text-align: center; }
  .opc-mrodape { display: flex; justify-content: space-between; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 2px dashed #c9a46a; }
  #btnOpc { min-width: 30px; }
  /* tamanho do texto da interface (o mapa não muda) */
  body.opc-texto-pequeno :is(#topo, .coluna-paineis, #modal .modal-caixa, #log, #rastreador, #opcMenu) { zoom: .9; }
  body.opc-texto-grande :is(#topo, .coluna-paineis, #modal .modal-caixa, #log, #rastreador, #opcMenu) { zoom: 1.15; }
  body.opc-texto-enorme :is(#topo, .coluna-paineis, #modal .modal-caixa, #log, #rastreador, #opcMenu) { zoom: 1.3; }
  /* cores para daltônicos (Okabe-Ito): verde → azul-claro, azul → azul-escuro, roxo → rosa, dourado → laranja */
  body.opc-daltonico .txt-incomum { color: #1f7fb0 !important; } body.opc-daltonico .txt-raro { color: #005a8c !important; } body.opc-daltonico .txt-epico { color: #a8457f !important; } body.opc-daltonico .txt-lendario { color: #b86f00 !important; }
  body.opc-daltonico .rar-incomum { border-color: #56b4e9 !important; background: radial-gradient(circle at 50% 45%, #eef8ff 0 50%, #a9d8f4 100%) !important; }
  body.opc-daltonico .rar-raro { border-color: #0072b2 !important; } body.opc-daltonico .rar-epico { border-color: #cc79a7 !important; } body.opc-daltonico .rar-lendario { border-color: #e69f00 !important; }
  body.opc-daltonico .barra.hp i { background: linear-gradient(#ffb04a, #d55e00); } body.opc-daltonico .barra.xp i { background: linear-gradient(#fff07a, #c9a400); }`;
  document.head.append(st);
}
window.OPCOES = { OPC, opcAbre, opcMenu, opcAplicaTudo };
