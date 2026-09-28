/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   TECLAS CONFIGURÁVEIS (janela "Teclas", tecla H ou ☰ Mais → Atalhos)
   Cada ação tem uma tecla (pela POSIÇÃO no teclado: ev.code, então funciona
   em qualquer idioma de teclado). Trocar: clique na tecla e aperte a nova.
   Se a nova tecla já era de outra ação, as duas trocam de lugar.
   Fixas (não mudam): setas (andar), Enter (falar), Tab / Shift+Tab (alvo),
   Esc (fechar/desmarcar), + e − (zoom).
   Fica guardado neste navegador. Carregar POR ÚLTIMO.
   ============================================================ */
const TECLAS_KEY = 'rac_teclas_v1';
const ACOES_TECLA = [
  ['cima', 'Andar para cima', 'KeyW'], ['baixo', 'Andar para baixo', 'KeyS'], ['esquerda', 'Andar para a esquerda', 'KeyA'], ['direita', 'Andar para a direita', 'KeyD'],
  ['cimaNum', 'Andar para cima (teclado numérico)', 'Numpad8'], ['baixoNum', 'Andar para baixo (teclado numérico)', 'Numpad2'], ['esquerdaNum', 'Andar para a esquerda (teclado numérico)', 'Numpad4'], ['direitaNum', 'Andar para a direita (teclado numérico)', 'Numpad6'],
  ['cimaEsq', 'Andar na diagonal ↖', 'Numpad7'], ['cimaDir', 'Andar na diagonal ↗', 'Numpad9'], ['baixoEsq', 'Andar na diagonal ↙', 'Numpad1'], ['baixoDir', 'Andar na diagonal ↘', 'Numpad3'],
  ['interagir', 'Falar / usar / abrir baú / pênalti', 'KeyE'], ['alvo', 'Marcar o próximo adversário', 'Space'], ['prioridade', 'Trocar a prioridade de ataque', 'KeyV'],
  ['modo', 'Modo Drible / Chute', 'KeyX'], ['classe', 'Habilidade especial da classe', 'ShiftLeft'], ['folego', 'Beber a melhor bebida de FÔLEGO', 'KeyF'], ['foco', 'Beber a melhor bebida de FOCO', 'KeyR'],
  ['caca', 'Caça contínua', 'KeyG'], ['montar', 'Subir / descer da montaria', 'KeyP'],
  ['ficha', 'Ficha do personagem', 'KeyC'], ['mochila', 'Mochila', 'KeyI'], ['habilidades', 'Habilidades', 'KeyK'], ['batalha', 'Lista de batalha', 'KeyL'],
  ['mapa', 'Mapa grande', 'KeyM'], ['missoes', 'Missões', 'KeyJ'], ['time', 'Meu Time', 'KeyT'], ['carreira', 'Carreira', 'KeyU'], ['album', 'Álbum de figurinhas', 'KeyB'], ['atalhos', 'Teclas (esta janela)', 'KeyH'],
  ...Array.from({ length: 10 }, (_, i) => ['slot' + i, `Barra de atalhos: espaço ${(i + 1) % 10}`, 'Digit' + ((i + 1) % 10)]),
  ...Array.from({ length: 10 }, (_, i) => ['slot' + (10 + i), `Barra de atalhos (2ª fileira): F${i + 1}`, 'F' + (i + 1)]),
];
const TECLA_PADRAO = Object.fromEntries(ACOES_TECLA.map(([a, , c]) => [a, c]));
const TECLAS_FIXAS = new Set(['Escape', 'Tab', 'Enter', 'NumpadEnter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Equal', 'Minus', 'NumpadAdd', 'NumpadSubtract', 'MetaLeft', 'MetaRight', 'ContextMenu']);
let TECLAS = {};
try { TECLAS = JSON.parse(localStorage.getItem(TECLAS_KEY) || '{}') || {}; } catch (e) { TECLAS = {}; }
const teclaDe = a => TECLAS[a] || TECLA_PADRAO[a];
function acaoDaTecla(code) { for (const [a] of ACOES_TECLA) if (teclaDe(a) === code) return a; return null; }
// teclas que o game.js antigo usava (Q = especial, teclado numérico = 2ª fileira): agora não fazem nada sozinhas
const CODIGOS_PADRAO = new Set([...Object.values(TECLA_PADRAO), 'KeyQ', ...Array.from({ length: 10 }, (_, i) => 'Numpad' + i)]);
// v168: andar como no Tibia — teclado numérico (8 2 4 6 retos; 7 9 1 3 diagonais, mesmo com o Num Lock ligado)
// e Home / PgUp / End / PgDn (as diagonais do teclado numérico com o Num Lock desligado)
// v176: 8 2 4 6 viraram ações que dá para trocar; Home/PgUp/End/PgDn só andam se não forem de nenhuma ação
const ANDA_FIXA = { Home: 'ul', PageUp: 'ur', End: 'dl', PageDown: 'dr' };
const MOD_TECLA = /^(Shift|Control|Alt)(Left|Right)$/;
function nomeTecla(code, curto) {
  if (!code) return '—';
  let m = /^Key([A-Z])$/.exec(code); if (m) return m[1];
  m = /^Digit(\d)$/.exec(code); if (m) return m[1];
  m = /^Numpad(\d)$/.exec(code); if (m) return (curto ? 'N' : 'Num ') + m[1];
  if (curto && /^Shift/.test(code)) return '⇧';
  const nomes = { Space: 'Espaço', ShiftLeft: 'Shift', ShiftRight: 'Shift dir.', ControlLeft: 'Ctrl', ControlRight: 'Ctrl dir.', AltLeft: 'Alt', AltRight: 'AltGr', Backquote: '´', Semicolon: 'Ç', Quote: '~', BracketLeft: '´', BracketRight: '[', Backslash: ']', Comma: ',', Period: '.', Slash: ';', IntlBackslash: '\\', CapsLock: 'Caps', Backspace: '⌫', Delete: 'Del', Insert: 'Ins', Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn', NumpadDecimal: 'Num ,', NumpadMultiply: 'Num *', NumpadDivide: 'Num /' };
  if (nomes[code]) return curto && nomes[code].length > 3 ? nomes[code].slice(0, 3) : nomes[code];
  m = /^F(\d+)$/.exec(code); if (m) return code;
  return code;
}
function salvaTeclas() { try { localStorage.setItem(TECLAS_KEY, JSON.stringify(TECLAS)); } catch (e) { } G.uiSujo = true; }

const MOVE_TECLA = { cima: 'u', baixo: 'd', esquerda: 'l', direita: 'r', cimaNum: 'u', baixoNum: 'd', esquerdaNum: 'l', direitaNum: 'r', cimaEsq: 'ul', cimaDir: 'ur', baixoEsq: 'dl', baixoDir: 'dr' };
function executaAcao(a) {
  if (MOVE_TECLA[a]) { G.teclas.delete(MOVE_TECLA[a]); G.teclas.add(MOVE_TECLA[a]); return; } // vai para o fim da fila: a última apertada manda
  if (a.startsWith('slot')) { usarHotbar(+a.slice(4)); return; }
  const f = {
    interagir: () => interagir(), alvo: () => alvoMaisProximo(), prioridade: () => trocaModoAlvo(), modo: () => trocaModo(), classe: () => usarClasse(),
    folego: () => bebeMelhor('hp'), foco: () => bebeMelhor('foco'), caca: () => alternaCaca(), montar: () => { if (typeof montar === 'function') montar(); },
    ficha: () => abreFicha(), mochila: () => abreAba('mochila'), habilidades: () => abreAba('skills'), batalha: () => abreAba('batalha'),
    mapa: () => modalMapa(), missoes: () => modalMissoes(), time: () => abrirTime(), carreira: () => { if (typeof abrirCarreira === 'function') abrirCarreira(); },
    album: () => modalAlbum(), atalhos: () => modalAtalhos(),
  }[a];
  if (f) f();
}

let TECLA_ESPERA = null; // { acao, aoTerminar } enquanto espera a pessoa apertar a tecla nova
window.addEventListener('keydown', ev => {
  if (TECLA_ESPERA && document.getElementById('modal').hidden) TECLA_ESPERA = null; // fechou a janela no meio da troca: desarma
  if (TECLA_ESPERA) { // trocando uma tecla: essa tecla é a nova
    ev.preventDefault(); ev.stopImmediatePropagation();
    const { acao, aoTerminar } = TECLA_ESPERA; TECLA_ESPERA = null;
    if (ev.code !== 'Escape' && ev.code) {
      if (TECLAS_FIXAS.has(ev.code)) { aoTerminar(`A tecla ${nomeTecla(ev.code)} é fixa do jogo. Escolha outra.`); return; }
      const antiga = teclaDe(acao), outra = acaoDaTecla(ev.code);
      if (outra && outra !== acao) TECLAS[outra] = antiga; // quem usava a tecla nova fica com a antiga (troca)
      TECLAS[acao] = ev.code;
      for (const k of Object.keys(TECLAS)) if (TECLAS[k] === TECLA_PADRAO[k]) delete TECLAS[k];
      salvaTeclas();
      aoTerminar(outra && outra !== acao ? `Trocou: "${ACOES_TECLA.find(x => x[0] === outra)[1]}" agora usa ${nomeTecla(antiga)}.` : '');
    } else aoTerminar('');
    return;
  }
  // Ctrl + seta (ou tecla de andar): vira para o lado sem sair do lugar, como no Tibia
  if (ev.ctrlKey && !ev.altKey && !ev.metaKey && G.rodando && !G.pausado && G.p && !(typeof HIST !== 'undefined' && HIST)) {
    const tok = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r' }[ev.code] || MOVE_TECLA[acaoDaTecla(ev.code)];
    const dir = tok && { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[tok];
    if (dir) {
      ev.preventDefault(); ev.stopImmediatePropagation();
      if (!G.p.pas) { if (dir[0]) G.p.flip = dir[0] < 0; olha(G.p, dir[0], dir[1]); G.p.tVista = G.agora + 3600000; } // fica virado até andar
      return;
    }
  }
  if (!G.rodando || G.pausado || ev.ctrlKey || ev.metaKey || ev.altKey || ev.code === 'Escape') return;
  if (typeof HIST !== 'undefined' && HIST) return; // cena da história aberta
  const tag = (ev.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  if (!MOD_TECLA.test(ev.code)) TECLA_MOD = null;
  if (ANDA_FIXA[ev.code] && !acaoDaTecla(ev.code)) { ev.preventDefault(); ev.stopImmediatePropagation(); if (!ev.repeat) { G.teclas.delete(ANDA_FIXA[ev.code]); G.teclas.add(ANDA_FIXA[ev.code]); } return; }
  const a = acaoDaTecla(ev.code) || (MOD_TECLA.test(ev.code) ? acaoDaTecla(ev.code.replace('Right', 'Left')) : null); // Shift da direita = Shift da esquerda
  // ação num Shift/Ctrl/Alt: só vale ao SOLTAR sem ter apertado outra tecla junto (Shift+Tab, Shift+clique continuam normais)
  if (a && MOD_TECLA.test(ev.code)) { if (!ev.repeat) TECLA_MOD = { code: ev.code, acao: a }; return; }
  if (a) {
    ev.preventDefault(); ev.stopImmediatePropagation();
    if (ev.repeat && !a.startsWith('slot')) return; // segurar a tecla não abre a mesma janela 30 vezes (e andar não reordena a fila) // segurar a tecla não abre a mesma janela 30 vezes
    executaAcao(a); return;
  }
  // tecla que era de uma ação e mudou de dono: não faz mais nada
  if (CODIGOS_PADRAO.has(ev.code)) { ev.preventDefault(); ev.stopImmediatePropagation(); }
}, true);
let TECLA_MOD = null;
window.addEventListener('mousedown', () => { TECLA_MOD = null; }, true);
window.addEventListener('pointerdown', () => { TECLA_MOD = null; }, true);
window.addEventListener('keyup', ev => {
  if (TECLA_MOD && TECLA_MOD.code === ev.code) {
    const { acao } = TECLA_MOD; TECLA_MOD = null;
    if (G.rodando && !G.pausado && !(typeof HIST !== 'undefined' && HIST)) executaAcao(acao);
    return;
  }
  if (ANDA_FIXA[ev.code] && !acaoDaTecla(ev.code)) { G.teclas.delete(ANDA_FIXA[ev.code]); ev.stopImmediatePropagation(); return; }
  const a = acaoDaTecla(ev.code);
  if (a && MOVE_TECLA[a]) { G.teclas.delete(MOVE_TECLA[a]); ev.stopImmediatePropagation(); }
  else if (CODIGOS_PADRAO.has(ev.code) && !a) ev.stopImmediatePropagation();
}, true);

// a barra de atalhos e os botões mostram a tecla escolhida
teclaSlot = function (i) { return nomeTecla(teclaDe('slot' + i), true); };
(function () {
  const _paineis = atualizaPaineis;
  atualizaPaineis = function (...r) {
    const res = _paineis.apply(this, r);
    const bm = document.getElementById('btnModo'); if (bm) bm.textContent = bm.textContent.replace(/^[^·]+·/, nomeTecla(teclaDe('modo'), true) + ' ·');
    const bc = document.getElementById('btnCaca'); if (bc) bc.textContent = bc.textContent.replace(/^[^·]+·/, nomeTecla(teclaDe('caca'), true) + ' ·');
    const cl = document.querySelector('#btnClasse .tecla'); if (cl) cl.textContent = nomeTecla(teclaDe('classe'), true);
    return res;
  };
})();

// janela "Teclas": lista tudo e deixa trocar
modalAtalhos = function () {
  const aviso = el('p', { class: 'tec-aviso' }, 'Clique na tecla de uma ação e aperte a tecla nova (Esc cancela). Se a tecla já for de outra ação, as duas trocam.');
  const lista = el('div', { class: 'tec-lista' });
  const monta = () => {
    lista.innerHTML = '';
    for (const [a, nome] of ACOES_TECLA) {
      const mudou = !!TECLAS[a];
      const bt = el('button', { class: 'btn mini tec-bt' + (mudou ? ' mudou' : ''), type: 'button', title: 'Clique e aperte a tecla nova' }, nomeTecla(teclaDe(a)));
      bt.onclick = () => {
        lista.querySelectorAll('.tec-bt.esperando').forEach(b => b.classList.remove('esperando'));
        bt.classList.add('esperando'); bt.textContent = 'aperte…';
        TECLA_ESPERA = { acao: a, aoTerminar: (msg) => { aviso.textContent = msg || 'Pronto! Clique em outra ação se quiser trocar mais.'; monta(); } };
      };
      lista.append(el('div', { class: 'tec-linha' }, el('span', {}, nome), bt));
    }
  };
  monta();
  const fixas = el('div', { class: 'tec-fixas' }, el('b', {}, 'Sempre valem: '), 'setas = andar · Home / PgUp / End / PgDn = diagonais · Enter = falar · Tab / Shift+Tab = próximo / anterior adversário · Esc = fechar/desmarcar · roda do mouse ou + / − = zoom · clique no chão = andar · clique no adversário = marcar');
  const restaurar = el('button', { class: 'btn', type: 'button', onclick: () => { TECLAS = {}; salvaTeclas(); aviso.textContent = 'Teclas voltaram ao padrão.'; monta(); } }, '↺ Voltar ao padrão');
  abreModal.largo = true;
  abreModal(el('h2', {}, '⌨️ Teclas do jogo'), aviso, fixas, lista, el('div', { class: 'opcoes' }, restaurar));
};
(function () {
  const st = document.createElement('style');
  st.textContent = `
  .tec-aviso { font-weight: 700; margin: 0 0 6px; }
  .tec-fixas { font-size: 12.5px; background: rgba(0,0,0,.05); border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; }
  .tec-lista { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 4px 14px; max-height: 58vh; overflow-y: auto; padding-right: 4px; }
  .tec-linha { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 3px 0; border-bottom: 1px dashed rgba(0,0,0,.12); font-size: 13.5px; }
  .tec-bt { min-width: 74px; font-weight: 800; }
  .tec-bt.mudou { background: #ffd23f; color: #3a2400; text-shadow: none; }
  .tec-bt.esperando { background: #fff; color: #3a2400; text-shadow: none; animation: tecPisca .6s ease-in-out infinite alternate; }
  @keyframes tecPisca { to { filter: brightness(1.2); } }
  `;
  document.head.append(st);
})();

/* ---------- v180: os textos mostram a tecla que a pessoa escolheu ----------
   Muitos textos dizem "aperte E", "tecla I", "(C)"... Se a ação daquela letra mudou de tecla,
   troca a letra pelo nome da tecla nova (numa passada só: trocar E↔F sai certo nos dois textos).
   Vale para dicas, avisos, janelas, placas, tutorial e o balãozinho em cima das coisas. */
function mapaLetrasTrocadas() {
  const m = {};
  for (const [a, , cod] of ACOES_TECLA) { const k = /^Key([A-Z])$/.exec(cod); if (!k) continue; const atual = teclaDe(a); if (atual !== cod) m[k[1]] = nomeTecla(atual); }
  return m;
}
function textoComTeclas(t) {
  if (typeof t !== 'string' || !t) return t;
  const m = mapaLetrasTrocadas(); const ls = Object.keys(m); if (!ls.length) return t;
  const L = ls.join('');
  return t.replace(new RegExp(`\\b([Aa]perte|[Tt]ecla|[Aa]pertar) ([${L}])\\b`, 'g'), (_, v, l) => `${v} ${m[l]}`)
    .replace(new RegExp(`\\(([${L}])\\)`, 'g'), (_, l) => `(${m[l]})`);
}
function teclaDaAcao(a) { return nomeTecla(teclaDe(a), true); }
{
  const _logTx = log; log = function (msg, ...r) { return _logTx.call(this, textoComTeclas(msg), ...r); };
  const _bannerTx = banner; banner = function (a, b) { return _bannerTx.call(this, textoComTeclas(a), textoComTeclas(b)); };
  if (typeof dica === 'function') { const _dicaTx = dica; dica = function (id, txt, ...r) { return _dicaTx.call(this, id, textoComTeclas(txt), ...r); }; }
  const trocaNos = raiz => {
    if (!raiz || !Object.keys(mapaLetrasTrocadas()).length) return;
    const tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { const v = textoComTeclas(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    const m = mapaLetrasTrocadas(); raiz.querySelectorAll('.kbd').forEach(k => { const t = k.textContent.trim(); if (m[t]) k.textContent = m[t]; }); // selo de tecla do tutorial
  };
  const _abreModalTx = abreModal; abreModal = function () { const r = _abreModalTx.apply(this, arguments); trocaNos(document.getElementById('modalConteudo')); return r; };
  // o cartão de dica/tutorial é refeito a cada atualização da tela (ex.: a cada chute no treino): se ele JÁ
  // estava lá com o mesmo texto, volta sem a animação de entrada (antes ficava piscando)
  let cartoesAntes = new Set();
  const _rastTx = atualizaRastreador; atualizaRastreador = function () {
    const r = _rastTx.apply(this, arguments); const R = document.getElementById('rastreador'); trocaNos(R);
    if (R) { const cs = [...R.querySelectorAll('.cartao-dica, .cartao-tut, .cartao-tut-min')]; cs.forEach(c => { if (cartoesAntes.has(c.textContent)) c.style.animation = 'none'; }); cartoesAntes = new Set(cs.map(c => c.textContent)); }
    return r;
  };
}
