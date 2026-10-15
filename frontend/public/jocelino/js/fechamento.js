// Jocelino — fechamento.js — o fechamento do caixa da noite (o relatório do Bancho, do nosso jeito): a nota da noite,
// as vendas, as despesas, o lucro, as curtidas e pitadas, as metas cumpridas e quanto falta para o próximo degrau.
// (14/10, Tarefa A: o fechamento completo) A conta na ordem do Dave (vendas separadas, despesas, lucro), com os prêmios da noite
// dentro da receita: Pratos + Bebidas + Gorjetas + Prêmios = Receita; Receita − Despesa − Salários = Lucro (TurnoJanta.conta).
// Ao lado, a noite: clientes, a receita perdida, a sobra, o mais pedido e os gargalos (só os que aconteceram).
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

// ---------- a contagem do fechamento (14/10, o Dave: o dinheiro contado com som, as estrelas uma a uma, a fanfarra do degrau) ----------
// Depois de a vinheta de samba do fim da janta entrar (FECHAMENTO_ESPERA s), as parcelas sobem de 0 com um "ka-ching" cada, as
// estrelas da nota acendem uma por uma num "plim" que sobe de tom e, por fim, a conquista da noite (um som só: o degrau da
// pensão, ou receita nova / o Paladar contente; o Paladar descontente resmunga). Lógica pura: [{ t, som?, acao?, k? }].
const FECHAMENTO_ESPERA = 1.2, FECHAMENTO_ESTRELA = 0.32;
function planoFechamento(r, nota, lucro) {
  const P = [], D = FECHAMENTO_ESPERA, c = TurnoJanta.conta(r);
  // (Tarefa A) as parcelas da receita, uma a uma: "ka-ching" só na que tem dinheiro; a receita (a soma) sobe calada
  [['vendas', c.pratos, 1], ['bebidas', c.bebidas, 1.04], ['gorjetas', c.gorjetas, 1.08], ['premios', c.premios, 1.12]].forEach(([k, v, tom], i) => {
    P.push({ t: D + 0.3 * i, acao: 'conta', k }); if (v) P.push({ t: D + 0.3 * i + 0.4, som: ['contagem_dinheiro', tom, 0.02, -4] }); });
  P.push({ t: D + 1.2, acao: 'conta', k: 'receita' });
  P.push({ t: D + 1.5, acao: 'conta', k: 'lucro' }); P.push({ t: D + 1.9, som: lucro >= 0 ? ['contagem_dinheiro', 1.16, 0.02, -2] : ['cliente_hmpf', 1, 0.03, -4] });
  let t = D + 2.3;
  for (let k = 1; k <= nota; k++, t += FECHAMENTO_ESTRELA) P.push({ t, acao: 'estrela', k, som: ['estrela_' + k, 1, 0, -4] });
  t += 0.4;
  const novas = (r.aprendidas || []).length + (r.chef && r.chef.inventou ? r.chef.inventou.length : 0);
  // (14/10, o pacote de cozinha) O resultado da noite, logo depois da última estrela: nota 4 ou 5 (ou o degrau), o "passou de
  // fase" (Pass Level); nota 1 ou 2, o "não foi dessa vez" (Fail Level); a 3, nada. Ele vem antes da conquista; no degrau os
  // dois se juntam (a fanfarra entra por cima do fim dele). Também espera a vinheta (conquista), mas não toca com a tela fechada.
  const boa = nota >= 4 || !!r.subiu, ruim = !boa && nota <= 2;
  if (boa || ruim) { P.push({ t, som: [boa ? 'noite_boa' : 'noite_ruim', 1, 0, -4], conquista: true }); t += r.subiu ? 0.9 : 1.8; }
  // a conquista toca mesmo com a tela já fechada (sempre) e nunca por cima da vinheta (conquista: espera ela acabar)
  if (r.subiu) P.push({ t, som: ['degrau_fanfarra', 1, 0, -2], conquista: true, sempre: true });
  else if (novas || r.paladar >= 4) P.push({ t, som: ['fanfarra', 1.1, 0, -4], conquista: true, sempre: true });
  else if (r.paladar) P.push({ t, som: ['cliente_hmpf', 1, 0, -4], conquista: true, sempre: true });
  if (r.chef && r.chef.subiu) P.push({ t: t + 1.2, som: ['rosa_animada', 1, 0.05, -2], conquista: true, sempre: true });
  return P;
}
// Toca o plano na tela aberta (fechou a tela, a contagem para). No modo de teste os números e as estrelas já aparecem prontos
// (as fotos e os testes leem o texto final); os sons seguem o plano do mesmo jeito (lá o sons.tocar não toca nada).
function contarFechamento(caixa, plano) {
  const anima = !MODO_TESTE.leve, c0 = plano.find(x => x.conquista);
  for (const x of plano) setTimeout(function vez() {
    if (!x.sempre && (!caixa.isConnected || caixa.closest('[hidden]'))) return;
    // a conquista nunca toca por cima da vinheta: se ela ainda soa, espera (mantendo o intervalo entre as conquistas)
    const resta = x.conquista ? sons.vinhetaResta() : 0;
    if (resta > 0.05) { setTimeout(vez, (resta + 0.3 + x.t - c0.t) * 1000); return; }
    if (x.som) sons.tocar(...x.som);
    if (!anima) return;
    if (x.acao === 'estrela') { const e = caixa.querySelectorAll('.fx-estrela')[x.k - 1]; if (e) { e.classList.remove('apagada'); e.classList.add('acesa'); } }
    else if (x.acao === 'conta') { const b = caixa.querySelector(`[data-conta="${x.k}"]`); if (!b) return;
      const fim = Number(b.dataset.valor) || 0, pre = b.dataset.pre || '', t0 = performance.now();
      const passo = () => { const u = Math.min(1, (performance.now() - t0) / 450); b.textContent = pre + Math.round(fim * u); if (u < 1 && caixa.isConnected) requestAnimationFrame(passo); };
      passo(); }
  }, x.t * 1000);
}

// ---------- a tela do fechamento ----------
// Os gargalos da noite em frase curta, só os que aconteceram (a espera média só quando passou da metade da paciência do prato,
// onde o cliente já perde a estrela da rapidez).
function frasesGargalos(g) {
  if (!g) return [];
  const f = [];
  if (g.farinhaVazia > 0) f.push(`A farinheira ficou vazia ${g.farinhaVazia} s`);
  if (g.passeCheio > 0) f.push(`O passe encheu ${g.passeCheio} ${g.passeCheio === 1 ? 'vez' : 'vezes'}`);
  if (g.esperaMedia > TurnoJanta.PACIENCIA_PRATO / 2) f.push(`A espera média até o prato foi ${g.esperaMedia} s`);
  if (g.emboraLouca > 0) f.push(`${g.emboraLouca} ${g.emboraLouca === 1 ? 'foi embora' : 'foram embora'} pela louça suja`);
  return f;
}
function abrirFechamento(r) {
  const p = G.pensao, nota = Metas.notaDaNoite(r);
  const c = TurnoJanta.conta(r), lucro = c.lucro;
  const linha = (a, b, cls = '') => el('div', { class: 'fx-linha ' + cls }, el('span', {}, a), el('b', {}, b));
  // as parcelas que a contagem sobe de 0 (fora do modo de teste começam em "Cr$ 0") e as estrelas que acendem uma a uma
  const anima = !MODO_TESTE.leve;
  const parcela = (a, k, v, cls = '') => el('div', { class: 'fx-linha ' + cls }, el('span', {}, a), el('b', { 'data-conta': k, 'data-valor': v, 'data-pre': 'Cr$ ' }, `Cr$ ${anima ? 0 : v}`));
  const estrelas = Array.from({ length: 5 }, (_, i) => el('i', { class: i < nota ? 'fx-estrela' + (anima ? ' apagada' : '') : 'fx-estrela-vazia' }, i < nota ? '★' : '☆'));
  const mp = r.maisPedido, gargalos = frasesGargalos(r.gargalos), fama = famaDoFechamento(r, p, linha);
  const caixa = el('div', { class: 'painel fechamento' },
    el('div', { class: 'titulo titulo-tela' }, 'Fechamento do caixa'),
    el('div', { class: 'fx-nota' }, ...estrelas, el('span', {}, ` Nota da noite: ${nota}`)),
    // (a lousa no teto de altura) a conta e a noite lado a lado; embaixo, a fama em duas colunas (o que é comprido ocupa as duas)
    el('div', { class: 'fx-duas' },
      // a conta, na ordem: as quatro parcelas, a receita, o que saiu e o lucro (a despesa e os salários são o que saiu de verdade)
      el('div', { class: 'fx-col fx-conta' },
        parcela('Pratos', 'vendas', c.pratos), parcela('Bebidas', 'bebidas', c.bebidas), parcela('Gorjetas', 'gorjetas', c.gorjetas),
        parcela('Prêmios', 'premios', c.premios), parcela('Receita', 'receita', c.receita, 'total'),
        linha('Despesa da noite', `− Cr$ ${c.despesa}`, 'menos'), linha('Salários', `− Cr$ ${c.salarios}`, 'menos'),
        parcela('Lucro', 'lucro', lucro, 'total ' + (lucro >= 0 ? 'lucro' : 'menos')),
        // (hoje o custo fica limitado ao bolso: o que não deu para pagar fica dito, numa linha)
        r.naoCobriu > 0 ? el('div', { class: 'fx-linha fx-frase menos' }, el('span', {}, `O bolso não cobriu tudo: Cr$ ${r.naoCobriu} ficaram sem pagar.`)) : null),
      el('div', { class: 'fx-col fx-noite' },
        // (tarefa 7, o robô jogador) "comeram" conta gente, não pratos: o Tonhão pede 3 vezes e a noite mostrava "8 clientes (9 comeram)";
        // os pratos a mais vão entre parênteses, e "1 foi embora" no singular
        linha('Clientes', `${r.clientes} (${r.comeram ?? r.servidos} comeram${r.servidos > (r.comeram ?? r.servidos) ? `, ${r.servidos} pratos` : ''}, ${r.embora} ${r.embora === 1 ? 'foi embora' : 'foram embora'})`),
        r.perdida ? linha('Receita perdida (sem o prato)', `Cr$ ${r.perdida}`, 'menos') : null,
        // (revisão da E2) as que saíram ruins: o copo derramado (ou a cerveja de espuma demais) e a caipirinha que desandou
        linha('Bebidas servidas', `${r.bebidas || 0} (${r.medida || 0} na medida${r.derramou ? `, ${r.derramou} ${r.derramou === 1 ? 'derramada' : 'derramadas'}` : ''}${r.desandou ? `, ${r.desandou} ${r.desandou === 1 ? 'caipirinha desandou' : 'caipirinhas desandaram'}` : ''})`),
        r.cafes ? linha('Só cafezinho (faltou ingrediente)', `${r.cafes}`) : null,
        // (o cardápio do Bancho) quem ficou sem prato do quadro levou o prato da casa; a sobra da panela foi para o lixo (r.sobra = { prato: n })
        r.casa ? linha('Prato da casa (sem curtida)', `${r.casa} ${r.casa === 1 ? 'prato' : 'pratos'}`) : null,   // (tarefa 7: conta pratos — o Tonhão repete — e dava "9 clientes" de 8)
        textoSobra(r.sobra) ? linha('Sobrou', textoSobra(r.sobra).replace(/^Sobrou: /, ''), 'menos') : null,
        r.desperdicio ? linha('Foi para o lixo', `${r.desperdicio} prato(s)`, 'menos') : null,
        mp ? linha('Mais pedido', `${Pensao.prato(mp.prato).nome} (${mp.qtd})`) : null,
        // os gargalos num parágrafo só (frases curtas, uma atrás da outra)
        gargalos.length ? el('div', { class: 'fx-linha fx-frase menos' }, el('span', {}, gargalos.map(f => f + '.').join(' '))) : null)),
    fama,
    el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar a pensão')));
  abrirModal(caixa);
  contarFechamento(caixa, planoFechamento(r, nota, lucro));
}
// A fama da noite (curtidas, pitadas, metas, receitas novas, favoritos, presentes, o Paladar e o próximo degrau).
function famaDoFechamento(r, p, linha) {
  const px = p.proximoDegrau();
  return el('div', { class: 'fx-col fx-fama' },
      linha('Curtidas', `+${r.curtidas || 0} (total ${p.curtidas})`), linha('Pitadas de tempero', `+${r.pitadasGanhas || 0} (total ${p.pitadas})`),
      ...(r.metasFeitas || []).map(m => linha('Meta cumprida', m.texto, 'lucro largo')),
      ...(r.aprendidas || []).map(id => linha('Receita nova', Pratos.PRATOS[id].nome, 'lucro')),
      ...(r.favoritos || []).map(id => linha('Prato favorito servido', `${(Clientela.dado(id) || { nome: id }).nome} (+1 ❤)`, 'lucro')),
      r.ritinha ? linha('A Ritinha no caixa', `+Cr$ ${r.ritinha} de gorjeta`, 'lucro') : null,
      r.premioFuncao ? linha('Presente do cliente especial', TEXTO_FUNCAO[r.premioFuncao], 'lucro largo') : null,
      r.paladar ? el('div', { class: 'fx-linha fx-paladar largo' }, el('img', { class: 'fx-retrato', src: urlArte('retratos/paladar_' + (r.paladar >= 4 ? 'alegre' : 'normal')) }),
        el('span', {}, 'O Doutor Paladar jantou aqui!'), el('b', {}, ...Array.from({ length: r.paladar }, () => el('img', { class: 'fx-garfo', src: urlArte('ui/garfo_nota') })))) : null,
      r.subiu ? linha('A pensão subiu!', `agora é ${p.nomeComEstrelas(r.subiu)}`, 'lucro largo') : px ? linha(`Para "${px.nome}"`, textoFalta(px.falta), 'largo') : null);
}
