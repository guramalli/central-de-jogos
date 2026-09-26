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
  ['interagir', 'Falar / usar / abrir baú / pênalti', 'KeyE'], ['alvo', 'Marcar o próximo adversário', 'Space'], ['prioridade', 'Trocar a prioridade de ataque', 'KeyV'],
  ['modo', 'Modo Drible / Chute', 'KeyX'], ['classe', 'Habilidade especial da classe', 'KeyQ'], ['folego', 'Beber a melhor bebida de FÔLEGO', 'KeyF'], ['foco', 'Beber a melhor bebida de FOCO', 'KeyR'],
  ['caca', 'Caça contínua', 'KeyG'], ['montar', 'Subir / descer da montaria', 'KeyP'],
  ['ficha', 'Ficha do personagem', 'KeyC'], ['mochila', 'Mochila', 'KeyI'], ['habilidades', 'Habilidades', 'KeyK'], ['batalha', 'Lista de batalha', 'KeyL'],
  ['mapa', 'Mapa grande', 'KeyM'], ['missoes', 'Missões', 'KeyJ'], ['time', 'Meu Time', 'KeyT'], ['carreira', 'Carreira', 'KeyU'], ['album', 'Álbum de figurinhas', 'KeyB'], ['atalhos', 'Teclas (esta janela)', 'KeyH'],
  ...Array.from({ length: 10 }, (_, i) => ['slot' + i, `Barra de atalhos: espaço ${(i + 1) % 10}`, 'Digit' + ((i + 1) % 10)]),
  ...Array.from({ length: 10 }, (_, i) => ['slot' + (10 + i), `Barra de atalhos (2ª fileira): N${(i + 1) % 10}`, 'Numpad' + ((i + 1) % 10)]),
];
const TECLA_PADRAO = Object.fromEntries(ACOES_TECLA.map(([a, , c]) => [a, c]));
const TECLAS_FIXAS = new Set(['Escape', 'Tab', 'Enter', 'NumpadEnter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Equal', 'Minus', 'NumpadAdd', 'NumpadSubtract', 'MetaLeft', 'MetaRight', 'ContextMenu']);
let TECLAS = {};
try { TECLAS = JSON.parse(localStorage.getItem(TECLAS_KEY) || '{}') || {}; } catch (e) { TECLAS = {}; }
const teclaDe = a => TECLAS[a] || TECLA_PADRAO[a];
function acaoDaTecla(code) { for (const [a] of ACOES_TECLA) if (teclaDe(a) === code) return a; return null; }
const CODIGOS_PADRAO = new Set(Object.values(TECLA_PADRAO));
function nomeTecla(code, curto) {
  if (!code) return '—';
  let m = /^Key([A-Z])$/.exec(code); if (m) return m[1];
  m = /^Digit(\d)$/.exec(code); if (m) return m[1];
  m = /^Numpad(\d)$/.exec(code); if (m) return (curto ? 'N' : 'Num ') + m[1];
  const nomes = { Space: 'Espaço', ShiftLeft: 'Shift', ShiftRight: 'Shift dir.', ControlLeft: 'Ctrl', ControlRight: 'Ctrl dir.', AltLeft: 'Alt', AltRight: 'AltGr', Backquote: '´', Semicolon: 'Ç', Quote: '~', BracketLeft: '´', BracketRight: '[', Backslash: ']', Comma: ',', Period: '.', Slash: ';', IntlBackslash: '\\', CapsLock: 'Caps', Backspace: '⌫', Delete: 'Del', Insert: 'Ins', Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn', NumpadDecimal: 'Num ,', NumpadMultiply: 'Num *', NumpadDivide: 'Num /' };
  if (nomes[code]) return curto && nomes[code].length > 3 ? nomes[code].slice(0, 3) : nomes[code];
  m = /^F(\d+)$/.exec(code); if (m) return code;
  return code;
}
function salvaTeclas() { try { localStorage.setItem(TECLAS_KEY, JSON.stringify(TECLAS)); } catch (e) { } G.uiSujo = true; }

const MOVE_TECLA = { cima: 'u', baixo: 'd', esquerda: 'l', direita: 'r' };
function executaAcao(a) {
  if (MOVE_TECLA[a]) { G.teclas.add(MOVE_TECLA[a]); return; }
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
  if (!G.rodando || G.pausado || ev.ctrlKey || ev.metaKey || ev.altKey || ev.code === 'Escape') return;
  if (typeof HIST !== 'undefined' && HIST) return; // cena da história aberta
  const tag = (ev.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  const a = acaoDaTecla(ev.code);
  if (a) {
    ev.preventDefault(); ev.stopImmediatePropagation();
    if (ev.repeat && !MOVE_TECLA[a] && !a.startsWith('slot')) return; // segurar a tecla não abre a mesma janela 30 vezes
    executaAcao(a); return;
  }
  // tecla que era de uma ação e mudou de dono: não faz mais nada
  if (CODIGOS_PADRAO.has(ev.code)) { ev.preventDefault(); ev.stopImmediatePropagation(); }
}, true);
window.addEventListener('keyup', ev => {
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
  const fixas = el('div', { class: 'tec-fixas' }, el('b', {}, 'Sempre valem: '), 'setas = andar · Enter = falar · Tab / Shift+Tab = próximo / anterior adversário · Esc = fechar/desmarcar · roda do mouse ou + / − = zoom · clique no chão = andar · clique no adversário = marcar');
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
