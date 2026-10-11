// Jocelino — fabricar.js — a tela Fabricar (o crafting do Stardew; receitas.gd do Godot): os aditivos das empreitas, com
// receitas que se liberam pelo nível de Acabamento (e por prêmio da Prefeitura). O Ananias vende cal e impermeabilizante
// (mais caros que fabricar); o acelerador só se fabrica.

const RECEITAS_FABRICAR = {
  cal: { hab: 'acabamento', nivel: 2, custo: { pedra: 3, fibra: 1 }, da: 2 },
  impermeabilizante: { hab: 'acabamento', nivel: 5, custo: { cimento: 1, fibra: 3 }, da: 1 },
  acelerador: { hab: 'acabamento', nivel: 8, custo: { cimento: 2, cal: 1 }, da: 1 },
};
const Fabricar = {
  conhecida(id) {
    const r = RECEITAS_FABRICAR[id]; if (!r) return false;
    return (G.empreitas && G.empreitas.receitasExtras.includes(id)) || (typeof Habilidades !== 'undefined' && Habilidades.nivel(r.hab) >= r.nivel);
  },
  // Faz até `vezes` (para no que faltar); 'ok' se fez pelo menos uma.
  fazer(id, mochila, vezes = 1) {
    const r = RECEITAS_FABRICAR[id];
    if (!r || !Fabricar.conhecida(id)) return 'nao';
    let feitas = 0, motivo = 'falta';
    for (let k = 0; k < vezes; k++) {
      if (Object.keys(r.custo).some(m => mochila.total(m) < r.custo[m])) { motivo = 'falta'; break; }
      if (!mochila.cabe(id)) { motivo = 'cheia'; break; }
      for (const m in r.custo) mochila.remover(m, r.custo[m]);
      const sobra = mochila.adicionar(id, r.da); if (sobra && typeof soltar === 'function' && G.jog && G.mapa) soltar(id, sobra, G.jog.x, G.jog.y);
      feitas++;
    }
    return feitas ? 'ok' : motivo;
  },
};
function abrirFabricar() {
  const caixa = el('div', { class: 'painel orelhao' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Fabricar'),
      el('div', { class: 'rodape', style: 'text-align:left' }, 'Os aditivos das empreitas: aplique na plaquinha do lote, com o item na mão, antes de começar a obra.'));
    const grade = el('div', { class: 'orel-grade' });
    for (const id in RECEITAS_FABRICAR) {
      const r = RECEITAS_FABRICAR[id], sabe = Fabricar.conhecida(id), custo = Object.entries(r.custo).map(([m, q]) => Itens.qtd(q, m)).join(' + ');
      grade.append(el('div', { class: 'orel-item' + (sabe ? '' : ' trancado') }, el('img', { src: urlItem(id), style: sabe ? '' : 'filter:brightness(0);opacity:.35' }),
        el('div', {}, el('b', {}, sabe ? `${Itens.nome(id)}${r.da > 1 ? ' (' + r.da + ')' : ''}` : '???'), el('div', { class: 'orel-preco' }, sabe ? custo : `Acabamento ${r.nivel}`)),
        sabe ? el('button', { class: 'botao', title: 'Shift: faz 5', onclick: e => { e.stopPropagation(); const res = Fabricar.fazer(id, G.mochila, e.shiftKey ? 5 : 1);
          if (res === 'ok') { sons.tocar('pousar', 1, 0.05, -4); avisar('+ ' + Itens.qtd(r.da, id)); hudSujo(); desenha(); } else avisar(res === 'cheia' ? 'A mochila está cheia.' : 'Falta material: ' + custo + '.'); } }, 'Fazer') : null));
    }
    caixa.append(grade, el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha(); abrirModal(caixa); sons.tocar('abrir', 1, 0.03, -6); return true;
}
