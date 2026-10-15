// Jocelino — fabricar.js — a tela Fabricar (o crafting do Stardew; receitas.gd do Godot): as receitas que os níveis das habilidades
// liberam (a tabela NIVEIS_RECOMPENSA de habilidades.js diz a habilidade e o nível de cada uma; os ingredientes moram no ECO) e as
// que vêm de prêmio da Prefeitura. O Ananias vende cal e impermeabilizante (mais caros que fabricar); o acelerador só se fabrica.

const RECEITAS_FABRICAR = {
  cal: { custo: { pedra: 3, fibra: 1 }, da: 2 },
  impermeabilizante: { custo: { cimento: 1, fibra: 3 }, da: 1 },
  acelerador: { custo: { cimento: 2, cal: 1 }, da: 1 },
  // (15/10, T4) as receitas novas dos níveis (Fôlego, Alvenaria e Acabamento); o baú custa o mesmo que o Tio Juca cobra
  bau: { custo: { madeira: ECO.quintal.bau }, da: 1 },
};
for (const id in ECO.niveis.receitas) RECEITAS_FABRICAR[id] = { custo: Object.assign({}, ECO.niveis.receitas[id]), da: ECO.niveis.rende[id] || 1 };
// (T4b, Roça 7) As sementes da colheita: um cartão só; o ingrediente é a colheita que o jogador escolhe (1 colheita da horta dá 2
// sementes dela, até fora da estação da loja). `especial` diz que o custo não é fixo (a tela e o Fabricar.fazer tratam à parte).
RECEITAS_FABRICAR.sementes_colheita = { custo: {}, da: ECO.niveis.rende.sementes_colheita, especial: 'sementes', icone: 'semente_alface', nome: 'Sementes da colheita' };
// O nível de cada uma vem da tabela (nenhum número solto aqui). Receita que nenhum nível dá não entra (só por prêmio).
for (const id in RECEITAS_FABRICAR) { const o = Habilidades.nivelDaReceita(id); if (o) Object.assign(RECEITAS_FABRICAR[id], o); else RECEITAS_FABRICAR[id].soPremio = true; }
const Fabricar = {
  conhecida(id) {
    const r = RECEITAS_FABRICAR[id]; if (!r) return false;
    return (G.empreitas && G.empreitas.receitasExtras.includes(id)) || (typeof Habilidades !== 'undefined' && Habilidades.nivel(r.hab) >= r.nivel);
  },
  // Faz até `vezes` (para no que faltar); 'ok' se fez pelo menos uma.
  // (T4b) As sementes da colheita: `de` é a colheita (alface, couve...) que vira as sementes dela.
  fazer(id, mochila, vezes = 1, de = '') {
    const r = RECEITAS_FABRICAR[id];
    if (!r || !Fabricar.conhecida(id)) return 'nao';
    const R = Fabricar.custoDe(id, de); if (!R) return 'nao';
    let feitas = 0, motivo = 'falta';
    for (let k = 0; k < vezes; k++) {
      if (Object.keys(R.custo).some(m => mochila.total(m) < R.custo[m])) { motivo = 'falta'; break; }
      if (!mochila.cabe(R.sai)) { motivo = 'cheia'; break; }
      for (const m in R.custo) mochila.remover(m, R.custo[m]);
      const sobra = mochila.adicionar(R.sai, r.da); if (sobra && typeof soltar === 'function' && G.jog && G.mapa) soltar(R.sai, sobra, G.jog.x, G.jog.y);
      feitas++;
    }
    return feitas ? 'ok' : motivo;
  },
  // O custo e o que sai: { custo, sai }; nas sementes da colheita, a colheita `de` e a semente dela (null: não é colheita da horta).
  custoDe(id, de = '') {
    const r = RECEITAS_FABRICAR[id]; if (!r) return null;
    if (r.especial !== 'sementes') return { custo: r.custo, sai: id };
    return typeof CULTURAS !== 'undefined' && CULTURAS[de] ? { custo: { [de]: 1 }, sai: CULTURAS[de].semente } : null;
  },
  // "1 sardinha dá 4" / "2 estercos + 1 cal" (o verbo concorda com o que se gasta).
  textoCusto(id) {
    const r = RECEITAS_FABRICAR[id], ps = Object.entries(r.custo), custo = ps.map(([m, q]) => Itens.qtd(q, m)).join(' + ');
    if (r.especial === 'sementes') return `1 colheita da horta dá ${r.da} sementes dela`;
    return custo + (r.da > 1 ? ` ${ps.length === 1 && ps[0][1] === 1 ? 'dá' : 'dão'} ${r.da}` : '');
  },
};
// (T4b) O cartão das sementes da colheita: um botão por colheita da horta que está na mochila ("Alface → 2").
function cartaoSementes(desenha) {
  const r = RECEITAS_FABRICAR.sementes_colheita, tem = Object.keys(CULTURAS).filter(c => G.mochila.total(c) > 0);
  return el('div', { class: 'orel-item' }, el('img', { src: urlItem('semente_alface') }),
    el('div', {}, el('b', {}, r.nome), el('div', { class: 'orel-preco' }, tem.length ? `1 colheita dá ${r.da} sementes dela` : 'Traga uma colheita da horta na mochila.'),
      el('div', { class: 'orel-bts' }, ...tem.map(c => el('button', { class: 'botao', title: `1 ${Itens.nome(c).toLowerCase()} dá ${r.da} de ${Itens.nome(CULTURAS[c].semente).toLowerCase()}. Shift: faz 5`, onclick: e => { e.stopPropagation();
        const res = Fabricar.fazer('sementes_colheita', G.mochila, e.shiftKey ? 5 : 1, c);
        if (res === 'ok') { sons.tocar('pousar', 1, 0.05, -4); avisar('+ ' + Itens.qtd(r.da, CULTURAS[c].semente)); hudSujo(); desenha(); } else avisar(res === 'cheia' ? 'A mochila está cheia.' : 'Falta a colheita.'); } },
        el('img', { src: urlItem(CULTURAS[c].semente), style: 'height:20px;vertical-align:middle' }), ' ' + Itens.nome(c))))));
}
function abrirFabricar() {
  const caixa = el('div', { class: 'painel orelhao' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Fabricar'),
      el('div', { class: 'rodape', style: 'text-align:left' }, 'Cada nível de habilidade ensina receitas. Os aditivos, a manta e a lona vão na plaquinha do lote, com o item na mão.'));
    // (15/10, T4) uma grade por habilidade, na ordem da tela H; a trancada mostra o nível que libera
    const ids = Object.keys(RECEITAS_FABRICAR), grupos = Habilidades.LISTA.map(h => [h, ids.filter(id => RECEITAS_FABRICAR[id].hab === h).sort((a, b) => RECEITAS_FABRICAR[a].nivel - RECEITAS_FABRICAR[b].nivel)]);
    grupos.push(['', ids.filter(id => RECEITAS_FABRICAR[id].soPremio && Fabricar.conhecida(id))]);
    for (const [h, lista] of grupos) {
      if (!lista.length) continue;
      const grade = el('div', { class: 'orel-grade' });
      for (const id of lista) {
        if (RECEITAS_FABRICAR[id].especial === 'sementes' && Fabricar.conhecida(id)) { grade.append(cartaoSementes(desenha)); continue; }
        const r = RECEITAS_FABRICAR[id], sabe = Fabricar.conhecida(id), custo = Object.entries(r.custo).map(([m, q]) => Itens.qtd(q, m)).join(' + ');
        grade.append(el('div', { class: 'orel-item' + (sabe ? '' : ' trancado') }, el('img', { src: urlItem(r.icone || id), style: sabe ? '' : 'filter:brightness(0);opacity:.35' }),
          el('div', {}, el('b', {}, sabe ? `${Itens.nome(id)}${r.da > 1 ? ' (' + r.da + ')' : ''}` : '???'), el('div', { class: 'orel-preco' }, sabe ? custo : `${NOMES_HAB[r.hab]} ${r.nivel}`)),
          sabe ? el('button', { class: 'botao', title: 'Shift: faz 5', onclick: e => { e.stopPropagation(); const res = Fabricar.fazer(id, G.mochila, e.shiftKey ? 5 : 1);
            if (res === 'ok') { sons.tocar('pousar', 1, 0.05, -4); avisar('+ ' + Itens.qtd(r.da, id)); hudSujo(); desenha(); } else avisar(res === 'cheia' ? 'A mochila está cheia.' : 'Falta material: ' + custo + '.'); } }, 'Fazer') : null));
      }
      caixa.append(el('div', { class: 'nivel-secao' }, h ? NOMES_HAB[h] : 'Prêmios'), grade);
    }
    caixa.append(el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha(); abrirModal(caixa); sons.tocar('abrir', 1, 0.03, -6); return true;
}
