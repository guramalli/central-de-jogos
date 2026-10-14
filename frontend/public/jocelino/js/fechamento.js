// Jocelino — fechamento.js — o fechamento do caixa da noite (o relatório do Bancho, do nosso jeito): a nota da noite,
// as vendas, as despesas, o lucro, as curtidas e pitadas, as metas cumpridas e quanto falta para o próximo degrau.
// E os "+Cr$ / +1 ❤" que saltam do cliente na hora que ele paga.

// ---------- flutuantes no palco ----------
const FLUTUANTES = [];
function flutuar(x, y, texto, cor) { FLUTUANTES.push({ x, y, texto, cor, t: 0 }); }
ATUALIZADORES.push(dt => { for (const f of FLUTUANTES) f.t += dt; for (let i = FLUTUANTES.length - 1; i >= 0; i--) if (FLUTUANTES[i].t > 1.4) FLUTUANTES.splice(i, 1); });
function desenhaFlutuantes(ctx) {
  for (const f of FLUTUANTES) {
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
    texto(ctx, f.texto, f.x, f.y - f.t * 60, 24, f.cor, '900');
    ctx.restore();
  }
}

// ---------- a tela do fechamento ----------
function abrirFechamento(r) {
  const p = G.pensao, nota = Metas.notaDaNoite(r);
  const vendas = r.ganho, gorj = r.gorjeta, custo = r.custo || 0, lucro = vendas + gorj - custo;
  const linha = (a, b, cls = '') => el('div', { class: 'fx-linha ' + cls }, el('span', {}, a), el('b', {}, b));
  const px = p.proximoDegrau();
  const caixa = el('div', { class: 'painel fechamento' },
    el('div', { class: 'titulo titulo-tela' }, 'Fechamento do caixa'),
    el('div', { class: 'fx-nota' }, '★'.repeat(nota) + '☆'.repeat(5 - nota), el('span', {}, ` Nota da noite: ${nota}`)),
    el('div', { class: 'fx-col' },
      // (tarefa 7, o robô jogador) "comeram" conta gente, não pratos: o Tonhão pede 3 vezes e a noite mostrava "8 clientes (9 comeram)";
      // os pratos a mais vão entre parênteses, e "1 foi embora" no singular
      linha('Clientes', `${r.clientes} (${r.comeram ?? r.servidos} comeram${r.servidos > (r.comeram ?? r.servidos) ? `, ${r.servidos} pratos` : ''}, ${r.embora} ${r.embora === 1 ? 'foi embora' : 'foram embora'})`),
      linha('Pratos vendidos', `Cr$ ${vendas}`), linha('Gorjetas', `Cr$ ${gorj}`), linha(`Bebidas servidas`, `${r.bebidas || 0} (${r.medida || 0} na medida)`),
      r.cafes ? linha('Só cafezinho (faltou ingrediente)', `${r.cafes}`) : null,
      linha('Despesa da noite (gás, gelo, luz)', `− Cr$ ${r.despesa || 0}`, 'menos'), r.salarios ? linha('Salários', `− Cr$ ${r.salarios}`, 'menos') : null,
      r.desperdicio ? linha('Foi para o lixo', `${r.desperdicio} prato(s)`, 'menos') : null,
      // (o cardápio do Bancho) quem ficou sem prato do quadro levou o prato da casa; a sobra da panela foi para o lixo (r.sobra = { prato: n })
      r.casa ? linha('Prato da casa (sem curtida)', `${r.casa} ${r.casa === 1 ? 'prato' : 'pratos'}`) : null,   // (tarefa 7: conta pratos — o Tonhão repete — e dava "9 clientes" de 8)
      textoSobra(r.sobra) ? linha('Sobrou', textoSobra(r.sobra).replace(/^Sobrou: /, ''), 'menos') : null,
      linha('Lucro da noite', `Cr$ ${lucro}`, lucro >= 0 ? 'lucro' : 'menos')),
    el('div', { class: 'fx-col' },
      linha('Curtidas', `+${r.curtidas || 0} (total ${p.curtidas})`), linha('Pitadas de tempero', `+${r.pitadasGanhas || 0} (total ${p.pitadas})`),
      ...(r.metasFeitas || []).map(m => linha('Meta cumprida', m.texto, 'lucro')),
      ...(r.aprendidas || []).map(id => linha('Receita nova', Pratos.PRATOS[id].nome, 'lucro')),
      ...(r.favoritos || []).map(id => linha('Prato favorito servido', `${(Clientela.dado(id) || { nome: id }).nome} (+1 ❤)`, 'lucro')),
      r.ritinha ? linha('A Ritinha no caixa', `+Cr$ ${r.ritinha} de gorjeta`, 'lucro') : null,
      r.premioFuncao ? linha('Presente do cliente especial', TEXTO_FUNCAO[r.premioFuncao], 'lucro') : null,
      r.paladar ? el('div', { class: 'fx-linha fx-paladar' }, el('img', { class: 'fx-retrato', src: urlArte('retratos/paladar_' + (r.paladar >= 4 ? 'alegre' : 'normal')) }),
        el('span', {}, 'O Doutor Paladar jantou aqui!'), el('b', {}, ...Array.from({ length: r.paladar }, () => el('img', { class: 'fx-garfo', src: urlArte('ui/garfo_nota') })))) : null,
      r.subiu ? linha('A pensão subiu!', `agora é ${p.nomeComEstrelas(r.subiu)}`, 'lucro') : px ? linha(`Para "${px.nome}"`, textoFalta(px.falta)) : null),
    el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar a pensão')));
  abrirModal(caixa);
  sons.tocar(lucro >= 0 ? 'moedas' : 'cliente_hmpf', 1, 0.03, -4);
}
