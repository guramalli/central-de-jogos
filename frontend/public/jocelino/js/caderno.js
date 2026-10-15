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
    // (15/10, a clareza) as pitadas e o chef com o "(?)" do que são
    esq.append(el('div', { class: 'cad-titulo' }, 'Receitas da Rosa'), el('div', { class: 'cad-pitadas' }, `Pitadas de tempero: ${p.pitadas}`),
      el('div', { class: 'cad-chef' }, `Rosa, chef nível ${ch.nivel}` + (ch.nivel < Chef.NIVEL_MAX ? ` · ${ch.xp}/${Chef.xpPara(ch.nivel)} pratos para o próximo` : ' (máximo)') + ` · ${Chef.bocas(p)} bocas no fogão` + (prox ? ` · no nível ${prox} ela inventa uma receita` : '')),
      linhaAjuda('caderno_esq', 'Pitadas pagam receita nova; caprichar sobe o prato.', [GLOSSARIO.pitada, GLOSSARIO.chef, GLOSSARIO.nivelPrato]));
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
      ...(segredo ? [] : [el('div', { class: 'cad-cat' }, textoCozinha(id))]),   // (Tarefa D1) a categoria e o tempo de fogo
      el('div', { class: 'cad-desc' }, segredo ?`A Rosa lembra de um prato com ${nomeIngrediente(pr.principal).toLowerCase()}... Traga um para ela ver.` : '"' + pr.desc + '"'));
    const ings = el('div', { class: 'cad-ings' });
    // (16/10, o gasto por prato) o que UMA panela gasta da despensa (a porção × as porções base × 0,5: Pensao.gasto)
    const gasto = p.gasto(id);
    for (const ing in gasto) {
      const t = p._tem(ing), q = gasto[ing];
      ings.append(el('div', { class: 'cad-ing' + (t >= q ? '' : ' falta') }, el('img', { src: iconeIngrediente(ing) }),
        el('div', {}, el('b', {}, `${nomeIngrediente(ing)} ×${q}`), el('span', {}, ` (tenho ${t})`), el('div', { class: 'cad-origem' }, origemDe(ing)))));
    }
    dir.append(el('div', { class: 'cad-sub' }, 'Ingredientes por panela'), ings);
    if (tem) {
      const n = p.nivel(id), c = p.custoCaprichar(id);
      dir.append(el('div', { class: 'cad-nivelzao' }, '★'.repeat(n) + '☆'.repeat(Pensao.NIVEL_MAX - n)),
        el('div', { class: 'cad-info' }, `Nível ${n} · Preço ${p.textoPreco(id)} · ${p.porcoesPorPanela(id)} porções por panela`));   // (15/10) o preço que a panela cobra
      // (15/10, o dono: "o número de sabor, para que serve?") o sabor em uma linha: para que serve e o que falta; o detalhe no "(?)".
      // (Na lousa a foto do prato vai para o lado do nome: o Caprichar continua à vista sem rolar a página, a s31.)
      const linhaSabor = linhaAjuda('sabor', textoSaborDoPrato(p, id), [GLOSSARIO.sabor, GLOSSARIO.melhorSabor, GLOSSARIO.nivelPrato, GLOSSARIO.panela, 'O preço sobe com o nível do prato; a estrela a mais do cliente vem do ingrediente raro (★★), não do sabor.', GLOSSARIO.precoPanela]);
      linhaSabor.classList.add('cad-sabor'); dir.append(linhaSabor);
      if (n < Pensao.NIVEL_MAX) {
        const pode = n < p.tetoCapricho() && Object.keys(c).every(ing => p._tem(ing) >= c[ing]), custo = Object.entries(c).map(([ing, q]) => ing === 'peixe' ? `${q} ${q === 1 ? 'peixe' : 'peixes'}` : Itens.qtd(q, ing)).join(', ');   // (15/10) o plural: "2 sacos de arroz", não "2 saco"
        const ef = efeitoCaprichar(p, id); p.niveis[id] = n + 1; const porDepois = p.porcoesPorPanela(id); if (n === 1) delete p.niveis[id]; else p.niveis[id] = n;
        dir.append(el('button', { class: 'botao forte cad-capricho' + (pode ? '' : ' desligado'), onclick: e => {
          e.stopPropagation();
          const r = p.caprichar(id);
          if (r === 'ok') { sons.tocar('carimbo', 1, 0.05, -2); carimbar(caixa); avisar(`${pr.nome} subiu para o nível ${p.nivel(id)}! Mais preço, mais sabor e mais porções.`); desenha();
            if (typeof CenaPrato !== 'undefined') CenaPrato.aoCaprichar(id, p.nivel(id)); }   // (Tarefa D2) a cena do Caprichar: o nível 10 e a 1ª vez no jogo
          else avisar(r === 'falta' ? `Para caprichar precisa de: ${custo}.` : r === 'teto' ? `A Rosa ainda não sabe caprichar além do nível ${p.tetoCapricho()}: a pensão precisa de mais uma estrela.` : 'Esse prato já está no capricho máximo.');
        } }, `Caprichar: ${custo}`),
          el('div', { class: 'cad-dica' }, `▸ Nível ${n} → ${n + 1}: preço Cr$ ${ef.preco[0]} → ${ef.preco[1]} · sabor ${ef.sabor[0]} → ${ef.sabor[1]} · porções ${p.porcoesPorPanela(id)} → ${porDepois}`));
        // (15/10, a clareza) o teto do capricho dito na página (antes, só no aviso do clique)
        if (n >= p.tetoCapricho()) dir.append(el('div', { class: 'cad-dica' }, `A Rosa só capricha até o nível ${p.tetoCapricho()} por enquanto: cada estrela da pensão ensina mais ${ECO.pensao.capricho.porEstrela} níveis.`));
      } else dir.append(el('div', { class: 'cad-dica' }, 'No capricho máximo! A Rosa não tem mais o que ensinar desse prato.'));
    } else if (descobrir) {
      if (descobrir.conhecida) dir.append(el('button', { class: 'botao forte cad-capricho' + (p.pitadas >= descobrir.custo ? '' : ' desligado'), onclick: e => {
        e.stopPropagation();
        const r = p.pesquisar(id);
        if (r === 'ok') { sons.tocar('receita_nova', 1, 0, -2); carimbar(caixa); avisar(`Receita nova no caderno: ${pr.nome}! Marque no quadro de giz.`); desenha();
          if (typeof CenaPrato !== 'undefined') CenaPrato.aoPesquisar(id); }   // (Tarefa D2) a cena curta da receita nova
        else avisar(r === 'sem_pitadas' ? `Faltam pitadas: precisa de ${descobrir.custo} (tem ${p.pitadas}). As estrelas da janta viram pitadas.` : 'A Rosa ainda não conhece o ingrediente.');
      } }, `Pesquisar com a Rosa (${descobrir.custo} pitadas)`));
      else dir.append(el('div', { class: 'cad-como' }, el('b', {}, 'Como liberar: '), p.comoLiberar(id)));
    }
    caixa.append(esq, dir, faixaDaTela('cad-faixa'), el('button', { class: 'botao cad-fechar', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar'));
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
