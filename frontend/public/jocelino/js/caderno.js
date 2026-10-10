// Jocelino — caderno.js — o caderno de receitas da Rosa (o Menu + Enhance + Research do Bancho, do nosso jeito):
// página da esquerda com as receitas da Rosa (nível) e as receitas a descobrir (silhueta e dica); página da direita com
// o prato escolhido: a fala da Rosa, os ingredientes (quanto tem, quanto precisa e de onde vem), nível, preço e sabor,
// e o botão Caprichar (gasta cópias do ingrediente principal) ou Pesquisar (gasta pitadas de tempero).
// A arte do caderno é a/ui/caderno_aberto (Higgsfield); o texto é escrito por cima.

const ORIGEM_ENCOMENDA = 'Encomenda pelo orelhão da Vila';
function origemDe(id) {
  const ing = Pratos.INGREDIENTES[id];
  const o = ing ? ing.origem : (id === 'peixe' ? 'Pesca (qualquer peixe)' : '?');
  const enc = typeof ENCOMENDA !== 'undefined' && ENCOMENDA[id];
  return enc && !/Mercearia/.test(o) ? `${o} · ou ${ORIGEM_ENCOMENDA}` : o;
}
const nomeIngrediente = id => id === 'peixe' ? 'Peixe' : (Itens.nome ? Itens.nome(id) : id);
const iconeIngrediente = id => urlItem(id === 'peixe' ? 'sardinha' : id);

let _cadernoSel = null;
// Os caminhos das receitas a descobrir, na ordem do caderno (receitas.js explica cada um).
const CAMINHOS_CADERNO = [['ingrediente', 'Pesquisar com a Rosa'], ['degrau', 'Quando a Pensão subir'], ['chef', 'A Rosa inventa'],
  ['ajudante', 'Os ajudantes ensinam'], ['vip', 'Os clientes especiais ensinam'], ['festa', 'Nas festas da Vila'], ['viajante', 'O Viajante da Capital vende']];
function abrirCaderno(sel) {
  const p = G.pensao;
  if (!p || p.estado !== 'aberta') { abrirPlaca('O caderno da Rosa fica na pensão. Ela começa a escrever quando a pensão abrir.'); return true; }
  // O que está na mochila também conta como "já vi" (a receita fica disponível para pesquisar).
  if (G.mochila) for (const id in Pratos.INGREDIENTES) if (G.mochila.total(id) > 0) p.veIngrediente(id);
  _cadernoSel = sel || _cadernoSel || p.receitas[0];
  const caixa = el('div', { class: 'caderno com-arte' });
  const desenha = () => {
    caixa.innerHTML = '';
    const esq = el('div', { class: 'pagina esq' }), dir = el('div', { class: 'pagina dir' });
    const ch = p.chef || { nivel: 1, xp: 0 }, prox = Chef.NIVEIS_INVENTA.find(x => x > ch.nivel);
    esq.append(el('div', { class: 'cad-titulo' }, 'Receitas da Rosa'), el('div', { class: 'cad-pitadas' }, `Pitadas de tempero: ${p.pitadas}`),
      el('div', { class: 'cad-chef' }, `Rosa, chef nível ${ch.nivel}` + (ch.nivel < Chef.NIVEL_MAX ? ` · ${ch.xp}/${Chef.xpPara(ch.nivel)} pratos para o próximo` : ' (máximo)') + ` · ${Chef.bocas(p)} bocas no fogão` + (prox ? ` · no nível ${prox} ela inventa uma receita` : '')));
    for (const id of p.receitas) {
      const pr = Pratos.PRATOS[id], n = p.nivel(id);
      esq.append(el('div', { class: 'cad-linha' + (id === _cadernoSel ? ' sel' : ''), onclick: e => { e.stopPropagation(); _cadernoSel = id; sons.tocar('pagina', 1, 0.05, -6); desenha(); } },
        el('img', { src: urlArte(iconePratoGrande(id)) }), el('div', { class: 'cad-nome' }, pr.nome), el('div', { class: 'cad-nivel' }, 'Nv ' + n)));
    }
    const novas = p.receitasADescobrir();
    if (novas.length) {
      // Agrupadas pelo caminho, em grade de silhuetas (clique para ver como liberar).
      esq.append(el('div', { class: 'cad-sub' }, `A descobrir (${novas.length})`));
      for (const [cam, titulo] of CAMINHOS_CADERNO) {
        const doCam = novas.filter(r => r.caminho === cam);
        if (!doCam.length) continue;
        const g = el('div', { class: 'cad-grade' });
        for (const r of doCam) g.append(el('div', { class: 'cad-icone' + (r.id === _cadernoSel ? ' sel' : '') + (r.conhecida ? ' pode' : ''),
          title: cam !== 'ingrediente' || r.conhecida ? Pratos.PRATOS[r.id].nome : '???', onclick: e => { e.stopPropagation(); _cadernoSel = r.id; sons.tocar('pagina', 1, 0.05, -6); desenha(); } },
          el('img', { src: urlArte(iconePratoGrande(r.id)), class: 'silhueta' })));
        esq.append(el('div', { class: 'cad-cam' }, titulo), g);
      }
    }
    // Página da direita: o prato escolhido.
    const id = _cadernoSel, pr = Pratos.PRATOS[id], tem = p.receitas.includes(id);
    if (!pr) { caixa.append(esq, dir); return; }
    const descobrir = !tem ? novas.find(r => r.id === id) : null;
    const segredo = descobrir && descobrir.caminho === 'ingrediente' && !descobrir.conhecida;   // ingrediente nunca visto: nome escondido
    dir.append(el('img', { class: 'cad-prato' + (descobrir && !descobrir.conhecida ? ' silhueta' : ''), src: urlArte(iconePratoGrande(id)) }),
      el('div', { class: 'cad-titulo' }, segredo ? 'Receita a descobrir' : pr.nome),
      el('div', { class: 'cad-desc' }, segredo ? `A Rosa lembra de um prato com ${nomeIngrediente(pr.principal).toLowerCase()}... Traga um para ela ver.` : '"' + pr.desc + '"'));
    const ings = el('div', { class: 'cad-ings' });
    for (const ing in pr.porcao) {
      const t = p._tem(ing), q = pr.porcao[ing];
      ings.append(el('div', { class: 'cad-ing' + (t >= q ? '' : ' falta') }, el('img', { src: iconeIngrediente(ing) }),
        el('div', {}, el('b', {}, `${nomeIngrediente(ing)} ×${q}`), el('span', {}, ` (tenho ${t})`), el('div', { class: 'cad-origem' }, origemDe(ing)))));
    }
    dir.append(el('div', { class: 'cad-sub' }, 'Ingredientes por prato'), ings);
    if (tem) {
      const n = p.nivel(id), c = p.custoCaprichar(id);
      dir.append(el('div', { class: 'cad-nivelzao' }, '★'.repeat(n) + '☆'.repeat(Pensao.NIVEL_MAX - n)),
        el('div', { class: 'cad-info' }, `Nível ${n} · Preço Cr$ ${p.preco(id, 1)} · Sabor ${p.sabor(id)} · ${p.porcoesPorPanela(id)} porções por panela`));
      if (n < Pensao.NIVEL_MAX) {
        const pode = Object.keys(c).every(ing => p._tem(ing) >= c[ing]), custo = Object.entries(c).map(([ing, q]) => `${q} ${nomeIngrediente(ing).toLowerCase()}`).join(', ');
        const ef = efeitoCaprichar(p, id); p.niveis[id] = n + 1; const porDepois = p.porcoesPorPanela(id); if (n === 1) delete p.niveis[id]; else p.niveis[id] = n;
        dir.append(el('button', { class: 'botao forte cad-capricho' + (pode ? '' : ' desligado'), onclick: e => {
          e.stopPropagation();
          const r = p.caprichar(id);
          if (r === 'ok') { sons.tocar('carimbo', 1, 0.05, -2); carimbar(caixa); avisar(`${pr.nome} subiu para o nível ${p.nivel(id)}! Mais preço, mais sabor e mais porções.`); desenha(); }
          else avisar(r === 'falta' ? `Para caprichar precisa de: ${custo}.` : 'Esse prato já está no capricho máximo.');
        } }, `Caprichar: ${custo}`),
          el('div', { class: 'cad-dica' }, `▸ Nível ${n} → ${n + 1}: preço Cr$ ${ef.preco[0]} → ${ef.preco[1]} · sabor ${ef.sabor[0]} → ${ef.sabor[1]} · porções ${p.porcoesPorPanela(id)} → ${porDepois}`));
      } else dir.append(el('div', { class: 'cad-dica' }, 'No capricho máximo! A Rosa não tem mais o que ensinar desse prato.'));
    } else if (descobrir) {
      if (descobrir.conhecida) dir.append(el('button', { class: 'botao forte cad-capricho' + (p.pitadas >= descobrir.custo ? '' : ' desligado'), onclick: e => {
        e.stopPropagation();
        const r = p.pesquisar(id);
        if (r === 'ok') { sons.tocar('carimbo', 1.1, 0.05, -2); sons.tocar('rosa_animada', 1, 0.05, -4); carimbar(caixa); avisar(`Receita nova no caderno: ${pr.nome}! Marque no quadro de giz.`); desenha(); }
        else avisar(r === 'sem_pitadas' ? `Faltam pitadas: precisa de ${descobrir.custo} (tem ${p.pitadas}). As estrelas da janta viram pitadas.` : 'A Rosa ainda não conhece o ingrediente.');
      } }, `Pesquisar com a Rosa (${descobrir.custo} pitadas)`));
      else dir.append(el('div', { class: 'cad-como' }, el('b', {}, 'Como liberar: '), p.comoLiberar(id)));
    }
    caixa.append(esq, dir, el('button', { class: 'botao cad-fechar', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar'));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('pagina', 1, 0.05, -4);
  return true;
}
// O carimbo de "caprichado" batendo na página (arte a/ui/carimbo_caprichado).
function carimbar(caixa) {
  if (!spr('ui/carimbo_caprichado')) return;
  const c = el('img', { class: 'carimbo', src: urlArte('ui/carimbo_caprichado') });
  caixa.append(c); setTimeout(() => c.remove(), 900);
}
