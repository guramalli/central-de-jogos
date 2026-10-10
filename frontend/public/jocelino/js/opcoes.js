// Jocelino — opcoes.js — o menu de opções (Esc): volumes da música, do ambiente, dos efeitos e da interface, tela cheia
// e os nomes no mapa (nunca, perto, sempre). Fica guardado no navegador (localStorage 'jocelino_opcoes'), separado do save.

const CHAVE_OPCOES = 'jocelino_opcoes';
G.opcoes = { nomes: 1 };
(() => {
  try { const o = JSON.parse(localStorage.getItem(CHAVE_OPCOES) || '{}'); if (o.volumes) Object.assign(sons.volumes, o.volumes); if (o.nomes != null) G.opcoes.nomes = o.nomes; } catch (e) {}
})();
function salvarOpcoes() { try { localStorage.setItem(CHAVE_OPCOES, JSON.stringify({ volumes: sons.volumes, nomes: G.opcoes.nomes })); } catch (e) {} }

const NOMES_VOLUME = { musica: 'Música', ambiente: 'Sons do ambiente', efeitos: 'Efeitos', interface: 'Sons da interface' };
const NOMES_MODO_NOMES = ['Nunca', 'Perto', 'Sempre'];
function abrirOpcoes() {
  const caixa = el('div', { class: 'painel', style: 'min-width:min(86vw,560px)' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:28px;margin-bottom:10px' }, 'Opções'));
    const linha = (rot, ...ctl) => el('div', { style: 'display:flex;align-items:center;gap:10px;margin:8px 0;font-size:19px;font-weight:800' }, el('div', { style: 'flex:1' }, rot), ...ctl);
    for (const b in NOMES_VOLUME) caixa.append(linha(NOMES_VOLUME[b],
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); sons.volumes[b] = clamp(sons.volumes[b] - 10, 0, 100); sons.aplicarVolumes(); salvarOpcoes(); desenha(); } }, '−'),
      el('div', { style: 'width:64px;text-align:center' }, sons.volumes[b] + '%'),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); sons.volumes[b] = clamp(sons.volumes[b] + 10, 0, 100); sons.aplicarVolumes(); salvarOpcoes(); sons.tocar('cursor'); desenha(); } }, '+')));
    caixa.append(linha('Tela cheia (F)', el('button', { class: 'botao', style: 'min-width:150px', onclick: e => { e.stopPropagation(); alternaTelaCheia(); setTimeout(desenha, 300); } }, document.fullscreenElement ? 'Ligada' : 'Desligada')));
    caixa.append(linha('Nomes no mapa', el('button', { class: 'botao', style: 'min-width:150px', onclick: e => { e.stopPropagation(); G.opcoes.nomes = (G.opcoes.nomes + 1) % 3; salvarOpcoes(); desenha(); } }, NOMES_MODO_NOMES[G.opcoes.nomes])));
    caixa.append(el('div', { class: 'rodape', style: 'text-align:left;line-height:1.6' },
      'WASD ou setas: andar · Shift: correr · clique: usar a ferramenta · botão direito ou X: conversar, abrir, entregar, comer · E: mochila · Tab: trocar a fileira · 1–0: escolher na barra · F: tela cheia · Esc: opções'));
    caixa.append(el('div', { style: 'display:flex;gap:10px;justify-content:flex-end;margin-top:10px' },
      el('div', { class: 'rodape', style: 'flex:1;text-align:left' }, 'O jogo salva quando o Jocelino dorme.'),
      el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa);
}
