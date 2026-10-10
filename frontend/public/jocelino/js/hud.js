// Jocelino — hud.js — o HUD em HTML por cima do canvas: quadro de tarefas (translúcido, firme com o mouse), relógio com
// o dia, a estação, a hora e o dinheiro, a barra de energia, a barra de 12 itens (1-0, roda do mouse, Tab troca a
// fileira) e, na pensão, o selo da fama. A mochila (E) mostra os 36 espaços: clique pega/solta/troca, direito pega um.

let _hudSujo = true;
function hudSujo() { _hudSujo = true; }
const HUD = {};

function montaHud() {
  const h = $('#hud');
  h.innerHTML = '';
  HUD.quadro = el('div', { class: 'painel quadro' });
  HUD.relogio = el('div', { class: 'painel relogio' }, HUD.dia = el('div', { class: 'dia' }), HUD.estacao = el('div', { class: 'estacao' }),
    HUD.hora = el('div', { class: 'hora' }), HUD.dinheiro = el('div', { class: 'dinheiro' }));
  HUD.energia = el('div', { class: 'painel energia', title: '' }, el('div', { class: 'letra' }, 'E'), el('div', { class: 'fundo' }, HUD.nivel = el('div', { class: 'nivel' })));
  HUD.barra = el('div', { class: 'painel barra' });
  HUD.dicaBarra = el('div', { class: 'dica-barra' });
  HUD.selo = el('div', { class: 'selo', hidden: true });
  HUD.botaoTela = el('button', { class: 'botao botao-tela', title: 'Tela cheia (F)', onclick: () => alternaTelaCheia() }, '⛶');
  h.append(HUD.quadro, HUD.relogio, HUD.energia, HUD.barra, HUD.dicaBarra, HUD.selo, HUD.botaoTela);
}

function atualizaHud() {
  if (!G.comecou || !HUD.relogio) return;
  HUD.dia.textContent = relogio.textoDia();
  HUD.estacao.textContent = ESTACOES[relogio.estacao()];
  HUD.hora.textContent = relogio.textoHora();
  HUD.dinheiro.textContent = 'Cr$ ' + G.dinheiro;
  const f = G.energia / G.energiaMax;
  HUD.nivel.style.height = (f * 100) + '%';
  HUD.nivel.style.background = f > 0.5 ? 'var(--verde)' : f > 0.2 ? '#e8c22c' : 'var(--destaque)';
  HUD.energia.title = `Energia ${Math.round(G.energia)}/${G.energiaMax}`;
  if (_hudSujo) {
    _hudSujo = false;
    HUD.barra.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      const s = G.mochila.slots[i];
      const e = el('div', { class: 'espaco' + (i === G.sel ? ' sel' : ''), title: s ? Itens.nome(s.id) : '', onclick: () => { G.sel = i; hudSujo(); } },
        s ? el('img', { src: urlItem(s.id), draggable: 'false' }) : null, s && Itens.pilha(s.id) > 1 ? el('div', { class: 'qtd' }, s.qtd) : null);
      HUD.barra.append(e);
    }
    const fora = G.mochila.slots.slice(12).filter(Boolean).length;
    HUD.dicaBarra.textContent = fora ? `Tab: próxima fileira (${fora} ${fora === 1 ? 'item' : 'itens'})` : '';
  }
  // Na pensão aberta, a tela é do restaurante (como no Dave): some o quadro de tarefas.
  const noSalao = noSalaoDaPensao() && G.pensao && G.pensao.estado === 'aberta';
  const tarefas = noSalao ? [] : (typeof tarefasQuadro === 'function' ? tarefasQuadro() : []);
  HUD.quadro.hidden = !tarefas.length;
  // As metas da Rosa (★) vêm primeiro: são o caminho da pensão.
  tarefas.sort((a, b) => (b.texto.startsWith('★') ? 1 : 0) - (a.texto.startsWith('★') ? 1 : 0));
  const txt = tarefas.slice(0, 6).map(t => t.texto + (t.meta ? `  ${t.feito}/${t.meta}` : '')).join('|');
  if (HUD.quadro._txt !== txt) { HUD.quadro._txt = txt; HUD.quadro.innerHTML = ''; for (const t of txt ? txt.split('|') : []) HUD.quadro.append(el('div', {}, t)); }
  if (typeof atualizaSeloPensao === 'function') atualizaSeloPensao(HUD.selo, noSalao);
}
ATUALIZADORES.push(() => atualizaHud());
INICIADORES.push(() => { montaHud(); hudSujo(); });
setInterval(() => { if (G.comecou && G.pausado) atualizaHud(); }, 250);

// ---------- mochila (E) ----------
function abrirMochila() {
  const caixa = el('div', { class: 'painel' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:24px;margin-bottom:8px' }, 'Mochila'));
    const grade = el('div', { style: 'display:grid;grid-template-columns:repeat(12,58px);gap:4px' });
    G.mochila.slots.forEach((s, i) => {
      if (i === 12 || i === 24) grade.append(...Array(0));
      grade.append(el('div', { class: 'espaco', style: 'width:58px;height:58px;background:var(--papel-escuro);border:2px solid var(--madeira);border-radius:6px;position:relative;cursor:pointer' + (i < 12 ? ';box-shadow:inset 0 -4px 0 rgba(155,81,60,.35)' : ''),
        title: s ? Itens.nome(s.id) + ' — ' + Itens.descricao(s.id) : '',
        onclick: e => { e.stopPropagation(); G.mochila.clicar(i); hudSujo(); desenha(); },
        oncontextmenu: e => { e.preventDefault(); e.stopPropagation(); G.mochila.clicarDireito(i); hudSujo(); desenha(); } },
        s ? el('img', { src: urlItem(s.id), style: 'position:absolute;inset:4px;width:46px;height:46px', draggable: 'false' }) : null,
        s && Itens.pilha(s.id) > 1 ? el('div', { style: 'position:absolute;right:3px;bottom:0;font-weight:900;color:#fff;text-shadow:0 0 3px #000' }, s.qtd) : null));
    });
    caixa.append(grade);
    const mao = G.mochila.mao;
    caixa.append(el('div', { class: 'rodape' }, mao ? `Na mão: ${Itens.qtd(mao.qtd, mao.id)} — clique num espaço para soltar` : 'A primeira fileira é a barra. Clique pega e troca; botão direito pega um.'));
  };
  desenha();
  abrirModal(caixa, () => { const r = G.mochila.guardarMao(); if (r) soltar(r.id, r.qtd, G.jog.x, G.jog.y); hudSujo(); });
}
