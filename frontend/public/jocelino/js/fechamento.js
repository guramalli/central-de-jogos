// Jocelino — fechamento.js — o fechamento do caixa da noite (o relatório do Bancho, do nosso jeito): a nota da noite,
// as vendas, as despesas, o lucro, as curtidas e pitadas, as metas cumpridas e quanto falta para o próximo degrau.
// (14/10, Tarefa A: o fechamento completo) A conta na ordem do Dave (vendas separadas, despesas, lucro), com os prêmios da noite
// dentro da receita: Pratos + Bebidas + Gorjetas + Prêmios = Receita; Receita − Despesa − Salários = Lucro (TurnoJanta.conta).
// (15/10, o fechamento do Dave, pedido do dono: "ele compara a última noite com aquela e faz um gráfico animado") A lousa virou
// a tela de resultado do sushi bar: as ENTRADAS aparecem uma a uma subindo de zero (pratos, bebidas, gorjetas, prêmios), depois
// as SAÍDAS (a despesa da noite, os salários, o que saiu da despensa e o que foi para o lixo), o LUCRO grande e o GRÁFICO DE
// BARRAS das últimas noites (G.pensao.historico, até 7), com a diferença para a noite anterior ("+18% que ontem"); por fim as
// estrelas acendem e a conquista toca. O resto da noite (clientes, bebidas, sobra, gargalos) e a fama (curtidas, metas,
// receitas novas, o Paladar, o degrau) ficam nas abas "A noite" e "A fama" — nada sumiu, só saiu da frente.
// Clique na lousa ou Espaço pula a animação (da 2ª noite em diante ela já corre mais rápido). A arte: a lousa, as tábuas e as abas
// de ui/pensao, o trilho de madeira das barras de meta (ui/madeira/trilho) e os ícones do jogo (a caixa registradora e a pilha
// de dinheiro, do Higgsfield); as barras são só o miolo colorido dentro do trilho, como as barras de meta do HUD.
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
// Depois de a vinheta de samba do fim da janta entrar (FECHAMENTO_ESPERA s), as entradas sobem de 0 com um "ka-ching" cada, as
// saídas entram com um "toc" baixo (dinheiro saindo não faz ka-ching), o lucro sobe com o último ka-ching (ou o resmungo do
// prejuízo), as barras do gráfico crescem e a comparação com a noite anterior aparece; então as estrelas da nota acendem uma por
// uma num "plim" que sobe de tom e, por fim, a conquista da noite (um som só: o degrau da pensão, ou receita nova / o Paladar
// contente; o Paladar descontente resmunga). Lógica pura: [{ t, som?, acao?, k? }].
// FECHAMENTO_CONTA: os segundos da conta (entradas → gráfico) antes das estrelas, no ritmo da 1ª noite; da 2ª noite em diante a
// conta corre no fator FECHAMENTO_RAPIDO (as estrelas mantêm o passo, uma a uma).
const FECHAMENTO_ESPERA = 1.2, FECHAMENTO_ESTRELA = 0.32, FECHAMENTO_CONTA = 3.5, FECHAMENTO_RAPIDO = 0.65, FECHAMENTO_HISTORICO = 7;
function planoFechamento(r, nota, lucro, f = 1) {
  const P = [], D = FECHAMENTO_ESPERA, c = TurnoJanta.conta(r), T = x => D + x * f;
  // (Tarefa A) as parcelas da receita, uma a uma: "ka-ching" só na que tem dinheiro; a receita (a soma) sobe calada
  [['vendas', c.pratos, 1], ['bebidas', c.bebidas, 1.04], ['gorjetas', c.gorjetas, 1.08], ['premios', c.premios, 1.12]].forEach(([k, v, tom], i) => {
    P.push({ t: T(0.28 * i), acao: 'conta', k }); if (v) P.push({ t: T(0.28 * i + 0.4), som: ['contagem_dinheiro', tom, 0.02, -4] }); });
  P.push({ t: T(1.1), acao: 'conta', k: 'receita' });
  // (15/10) as saídas: um "toc" baixo em cada uma que tirou dinheiro; depois o que saiu da despensa e o lixo
  P.push({ t: T(1.4), acao: 'conta', k: 'despesa', som: c.despesa ? ['item_pousa', 0.9, 0.03, -8] : null });
  P.push({ t: T(1.62), acao: 'conta', k: 'salarios', som: c.salarios ? ['item_pousa', 0.8, 0.03, -8] : null });
  P.push({ t: T(1.84), acao: 'mostra', k: 'saidas' });
  P.push({ t: T(2.15), acao: 'conta', k: 'lucro' }); P.push({ t: T(2.6), som: lucro >= 0 ? ['contagem_dinheiro', 1.16, 0.02, -2] : ['cliente_hmpf', 1, 0.03, -4] });
  // (15/10) o gráfico das últimas noites cresce e a comparação com a anterior aparece
  P.push({ t: T(2.75), acao: 'grafico' });
  P.push({ t: T(3.3), acao: 'mostra', k: 'compara' });
  let t = T(FECHAMENTO_CONTA);
  for (let k = 1; k <= nota; k++, t += FECHAMENTO_ESTRELA) P.push({ t, acao: 'estrela', k, som: ['estrela_' + k, 1, 0, -4] });
  P.push({ t: t - FECHAMENTO_ESTRELA + 0.2, acao: 'fim' });
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
// Pulou (clique ou Espaço): a lousa já mostra o fim; daí em diante só a conquista toca (o ka-ching e o plim que faltavam, não).
function contarFechamento(caixa, plano, anima = !MODO_TESTE.leve, comSom = true) {
  const c0 = plano.find(x => x.conquista);
  for (const x of plano) setTimeout(function vez() {
    if (!x.sempre && (!caixa.isConnected || caixa.closest('[hidden]'))) return;
    // a conquista nunca toca por cima da vinheta: se ela ainda soa, espera (mantendo o intervalo entre as conquistas)
    const resta = x.conquista ? sons.vinhetaResta() : 0;
    if (resta > 0.05) { setTimeout(vez, (resta + 0.3 + x.t - c0.t) * 1000); return; }
    if (x.som && comSom && (x.conquista || !caixa._pulou)) sons.tocar(...x.som);
    if (x.acao === 'fim') caixa._animando = false;
    if (!anima || caixa._pulou) return;
    passoDoFechamento(caixa, x);
  }, x.t * 1000);
}
function passoDoFechamento(caixa, x) {
  const vivo = sel => caixa.querySelectorAll(sel).forEach(e => e.classList.add('vivo'));
  if (x.acao === 'estrela') { const e = caixa.querySelectorAll('.fx-estrela')[x.k - 1]; if (e) { e.classList.remove('apagada'); e.classList.add('acesa'); } }
  else if (x.acao === 'mostra') vivo(`[data-passo="${x.k}"]`);
  else if (x.acao === 'grafico') vivo('.fx-grafico');
  else if (x.acao === 'conta') {
    vivo(`[data-passo="${x.k}"]`);
    const b = caixa.querySelector(`[data-conta="${x.k}"]`); if (!b) return;
    const fim = Number(b.dataset.valor) || 0, pre = b.dataset.pre || '', t0 = performance.now(), dur = x.k === 'lucro' ? 600 : 450;
    const passo = () => { if (caixa._pulou) return; const u = Math.min(1, (performance.now() - t0) / dur); b.textContent = pre + Math.round(fim * u); if (u < 1 && caixa.isConnected) requestAnimationFrame(passo); };
    passo();
  }
}
// Pula a animação: tudo no lugar do fim (os números contados, as barras cheias, as estrelas acesas). Devolve se estava animando.
function pularFechamento(caixa) {
  if (!caixa || !caixa._animando) return false;
  caixa._pulou = true; caixa._animando = false;
  caixa.classList.remove('fx-anima');
  caixa.querySelectorAll('[data-conta]').forEach(b => { b.textContent = (b.dataset.pre || '') + (Number(b.dataset.valor) || 0); });
  caixa.querySelectorAll('.fx-estrela.apagada').forEach(e => { e.classList.remove('apagada'); e.classList.add('acesa'); });
  const d = caixa.querySelector('.fx-pula'); if (d) d.hidden = true;
  return true;
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
// (15/10) As noites do gráfico: o caderno da pensão (a noite de hoje já está nele, r.hist); um relatório avulso (os testes, a
// noite sem caderno) entra como "hoje" no fim. Devolve { noites: [...até 7], hoje, antes } (antes: a noite anterior, ou null).
function noitesDoGrafico(r, p) {
  const c = TurnoJanta.conta(r);
  let noites = ((p && p.historico) || []).slice(-FECHAMENTO_HISTORICO);
  let hoje = r.hist && noites.includes(r.hist) ? r.hist : null;
  if (!hoje) { hoje = { dia: G.dia, receita: c.receita, lucro: c.lucro, avulsa: true }; noites = noites.filter(h => h.dia < G.dia).concat([hoje]).slice(-FECHAMENTO_HISTORICO); }
  const i = noites.indexOf(hoje);
  return { noites, hoje, antes: i > 0 ? noites[i - 1] : null };
}
// O nome curto da noite embaixo da barra: "hoje", "ontem" ou o dia da semana ("seg 3").
function rotuloDaNoite(h, hoje) {
  if (h === hoje) return 'hoje';
  if (h.dia === hoje.dia - 1) return 'ontem';
  const m = (n, k) => ((n % k) + k) % k;
  return (typeof DIAS !== 'undefined' ? DIAS[m(h.dia - 1, 7)].slice(0, 3) : 'dia') + ' ' + (m(h.dia - 1, 28) + 1);
}
// A frase da comparação com a noite anterior ("+18% que ontem"); com a anterior no prejuízo (ou zero), em cruzeiros.
function textoComparacao(g) {
  if (!g.antes) return { texto: 'A primeira noite no caderno: amanhã já tem com o que comparar.', cls: 'igual' };
  const L = g.hoje.lucro, A = g.antes.lucro, quando = g.antes.dia === g.hoje.dia - 1 ? 'ontem' : 'a última janta';
  if (L === A) return { texto: `Igual a ${quando}`, cls: 'igual' };
  if (A > 0) { const pc = Math.round((L - A) / A * 100); if (pc) return { texto: `${pc > 0 ? '+' : '−'}${Math.abs(pc)}% que ${quando}`, cls: pc > 0 ? 'sobe' : 'desce' }; }
  return { texto: `Cr$ ${Math.abs(L - A)} ${L > A ? 'a mais' : 'a menos'} que ${quando}`, cls: L > A ? 'sobe' : 'desce' };
}
// O gráfico de barras das últimas noites: o miolo colorido dentro do trilho de madeira (a barra de meta do HUD, em pé). Com
// prejuízo em alguma noite, a linha do zero sobe e a barra do prejuízo desce dela (em vermelho de giz).
function graficoDoFechamento(g) {
  const maxP = Math.max(1, ...g.noites.map(h => Math.max(0, h.lucro))), maxN = Math.max(0, ...g.noites.map(h => Math.max(0, -h.lucro)));
  const zero = maxN / (maxP + maxN) * 100;
  const barras = g.noites.map(h => {
    const v = h.lucro, alt = Math.abs(v) / (maxP + maxN) * 100;
    const enche = el('div', { class: 'fx-enche' + (v < 0 ? ' menos' : ''), style: `${v < 0 ? 'top' : 'bottom'}:${v < 0 ? 100 - zero : zero}%;--h:${alt.toFixed(1)}%` });
    return el('div', { class: 'fx-dia' + (h === g.hoje ? ' hoje' : '') + (h.rosa ? ' rosa' : ''), title: h.rosa ? 'A Rosa se virou sozinha nesta noite' : '' },
      el('div', { class: 'fx-valor' }, `${v < 0 ? '−' : ''}Cr$ ${Math.abs(v)}`),
      el('div', { class: 'fx-trilho' }, el('div', { class: 'fx-zero', style: `bottom:${zero}%` }), enche),
      el('div', { class: 'fx-rotulo' }, rotuloDaNoite(h, g.hoje)));
  });
  const cmp = textoComparacao(g);
  return el('div', { class: 'fx-col fx-grafico' },
    el('div', { class: 'fx-sub' }, 'O lucro das últimas noites'),
    el('div', { class: 'fx-barras' }, ...barras),
    el('div', { class: 'fx-compara fx-passo ' + cmp.cls, 'data-passo': 'compara' }, cmp.texto));
}
// As fichas com ícone (o que saiu da despensa, o que foi para o lixo): "[ícone] ×3", o nome no título (o mouse em cima).
function fichasDoFechamento(lista, max = 7) {
  const f = lista.slice(0, max).map(([img, n, nome]) => el('span', { class: 'fx-ficha', title: nome }, el('img', { src: img, alt: '' }), `×${n}`));
  if (lista.length > max) f.push(el('span', { class: 'fx-ficha' }, `+${lista.length - max}`));
  return f;
}
// O dia da noite no topo da lousa ("noite de terça, dia 5").
const noiteDoDia = dia => `noite de ${typeof DIAS !== 'undefined' ? DIAS[(dia - 1) % 7] : 'hoje'}, dia ${(dia - 1) % 28 + 1}`;
// opc.rever: reaberta pelo resumo do dia (sem som nem animação; o botão volta ao resumo e opc.depois roda ao fechar);
// opc.animar: anima mesmo no modo de teste (as fotos do meio da animação).
function abrirFechamento(r, opc = {}) {
  const p = G.pensao, nota = Metas.notaDaNoite(r);
  const c = TurnoJanta.conta(r), lucro = c.lucro;
  const linha = (a, b, cls = '') => el('div', { class: 'fx-linha ' + cls }, el('span', {}, a), el('b', {}, b));
  // as parcelas que a contagem sobe de 0 (fora do modo de teste começam em "Cr$ 0") e as estrelas que acendem uma a uma
  const anima = !opc.rever && (!!opc.animar || !MODO_TESTE.leve);
  const g = noitesDoGrafico(r, p), rapido = g.noites.filter(h => h !== g.hoje).length > 0 ? FECHAMENTO_RAPIDO : 1;
  const parcela = (a, k, v, img, cls = '', pre = 'Cr$ ', extra = null) => el('div', { class: 'fx-linha fx-passo ' + cls, 'data-passo': k },
    el('span', {}, img ? el('img', { class: 'fx-icone', src: img, alt: '' }) : null, a), el('b', { 'data-conta': k, 'data-valor': v, 'data-pre': pre }, `${pre}${anima ? 0 : v}`), extra);
  const qtd = t => el('small', { class: 'fx-qtd' }, ` · ${t}`);
  const estrelas = Array.from({ length: 5 }, (_, i) => el('i', { class: i < nota ? 'fx-estrela' + (anima ? ' apagada' : '') : 'fx-estrela-vazia' }, i < nota ? '★' : '☆'));
  const mp = r.maisPedido, gargalos = frasesGargalos(r.gargalos), fama = famaDoFechamento(r, p, linha);
  const pratosQtd = Math.max(0, (r.servidos || 0) - (r.cafes || 0));
  // as saídas que não são dinheiro: o que as panelas levaram da despensa e o que foi para o lixo (a sobra da panela e os pratos)
  const gastou = Object.entries(r.gastou || {}).sort((a, b) => b[1] - a[1]).map(([id, n]) => [urlItem(id), n, Itens.nome(id)]);
  const lixo = Object.entries(r.sobra || {}).filter(([, n]) => n > 0).map(([id, n]) => [urlArte(iconePrato(id)), n, (Pensao.prato(id) || { nome: id }).nome + ' (sobra da panela)']);
  if (r.desperdicio) lixo.push([urlArte('salao/lixo'), r.desperdicio, 'pratos que caíram ou esfriaram no passe']);
  const conta = el('div', { class: 'fx-col fx-conta' },
    el('div', { class: 'fx-sub' }, 'Entrou'),
    parcela('Pratos', 'vendas', c.pratos, pratosQtd ? urlArte(iconePrato(mp ? mp.prato : 'pf_peao')) : null, '', 'Cr$ ', pratosQtd ? qtd(`${pratosQtd} ${pratosQtd === 1 ? 'prato' : 'pratos'}`) : null),
    parcela('Bebidas', 'bebidas', c.bebidas, urlArte('salao/bebida_cerveja'), '', 'Cr$ ', r.bebidas ? qtd(`${r.bebidas} ${r.bebidas === 1 ? 'copo' : 'copos'}`) : null),
    parcela('Gorjetas', 'gorjetas', c.gorjetas, urlArte('salao/moedas_balcao')),
    parcela('Prêmios', 'premios', c.premios, urlItem('presente')),
    parcela('Receita', 'receita', c.receita, null, 'total'),
    el('div', { class: 'fx-sub fx-passo', 'data-passo': 'despesa' }, 'Saiu'),
    parcela('Despesa da noite', 'despesa', c.despesa, urlItem('fogao_gas'), 'menos', '− Cr$ '),
    parcela('Salários', 'salarios', c.salarios, urlArte('fx/envelope'), 'menos', '− Cr$ '),
    gastou.length ? el('div', { class: 'fx-linha fx-fichas fx-passo', 'data-passo': 'saidas' }, el('span', {}, 'Da despensa'), el('div', {}, ...fichasDoFechamento(gastou))) : null,
    lixo.length ? el('div', { class: 'fx-linha fx-fichas fx-passo menos', 'data-passo': 'saidas' }, el('span', {}, 'No lixo'), el('div', {}, ...fichasDoFechamento(lixo, 5))) : null,
    // (hoje o custo fica limitado ao bolso: o que não deu para pagar fica dito, numa linha)
    r.naoCobriu > 0 ? el('div', { class: 'fx-linha fx-frase menos fx-passo', 'data-passo': 'saidas' }, el('span', {}, `O bolso não cobriu tudo: Cr$ ${r.naoCobriu} ficaram sem pagar.`)) : null,
    el('div', { class: 'fx-linha fx-passo fx-lucro total ' + (lucro >= 0 ? 'lucro' : 'menos'), 'data-passo': 'lucro' },
      el('span', {}, el('img', { class: 'fx-icone grande', src: urlArte('ui/dinheiro_pilha'), alt: '' }), 'Lucro'),
      el('b', { 'data-conta': 'lucro', 'data-valor': lucro, 'data-pre': 'Cr$ ' }, `Cr$ ${anima ? 0 : lucro}`)));
  // os destaques da noite, à vista (o detalhe fica nas abas)
  const destaques = [
    mp ? el('span', { class: 'fx-destaque' }, el('img', { src: urlArte(iconePrato(mp.prato)), alt: '' }), `O mais pedido: ${Pensao.prato(mp.prato).nome} ×${mp.qtd}`) : null,
    r.subiu ? el('span', { class: 'fx-destaque ouro' }, `A pensão subiu: ${p.nomeComEstrelas(r.subiu)}!`) : null,
    ...(r.aprendidas || []).map(id => el('span', { class: 'fx-destaque ouro' }, `Receita nova: ${Pratos.PRATOS[id].nome}`)),
    (r.metasFeitas || []).length ? el('span', { class: 'fx-destaque ouro' }, `${r.metasFeitas.length} ${r.metasFeitas.length === 1 ? 'meta cumprida' : 'metas cumpridas'}`) : null,
    r.paladar ? el('span', { class: 'fx-destaque' }, `O Doutor Paladar: ${r.paladar} ${r.paladar === 1 ? 'garfo' : 'garfos'}`) : null,
    el('span', { class: 'fx-destaque' }, `+${r.curtidas || 0} ${(r.curtidas || 0) === 1 ? 'curtida' : 'curtidas'} · +${r.pitadasGanhas || 0} ${(r.pitadasGanhas || 0) === 1 ? 'pitada' : 'pitadas'}`)].filter(Boolean);
  const noite = el('div', { class: 'fx-col fx-noite' },
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
    gastou.length ? linha('Saiu da despensa', gastou.map(([, n, nome]) => `${n} ${nome.toLowerCase()}`).join(', ')) : null,
    // os gargalos num parágrafo só (frases curtas, uma atrás da outra)
    gargalos.length ? el('div', { class: 'fx-linha fx-frase menos' }, el('span', {}, gargalos.map(f => f + '.').join(' '))) : null);
  // as abas: o caixa (a conta e o gráfico), a noite e a fama
  const paginas = {
    caixa: el('div', { class: 'fx-pagina', 'data-pagina': 'caixa' }, el('div', { class: 'fx-duas' }, conta,
      el('div', { class: 'fx-direita' }, graficoDoFechamento(g), el('div', { class: 'fx-destaques fx-passo', 'data-passo': 'compara' }, ...destaques)))),
    noite: el('div', { class: 'fx-pagina', 'data-pagina': 'noite', hidden: true }, noite),
    fama: el('div', { class: 'fx-pagina', 'data-pagina': 'fama', hidden: true }, fama),
  };
  const nomesAbas = { caixa: 'O caixa', noite: 'A noite', fama: 'A fama' };
  // (as abas são a arte de aba da lousa, não tábuas: as tábuas são as ações da tela; como o "(?)", um elemento com papel de aba)
  const vaiPara = k => { pularFechamento(caixa); for (const j in paginas) paginas[j].hidden = j !== k; abas.querySelectorAll('.aba-lousa').forEach(b => { b.classList.toggle('acesa', b.dataset.aba === k); b.setAttribute('aria-selected', b.dataset.aba === k); }); sons.tocar('cursor', 1, 0.03, -8); };
  const abas = el('div', { class: 'fx-abas', role: 'tablist' }, ...Object.keys(paginas).map(k => el('span', { class: 'aba-lousa' + (k === 'caixa' ? ' acesa' : ''), 'data-aba': k, role: 'tab', tabindex: 0, 'aria-selected': k === 'caixa',
    onclick: e => { e.stopPropagation(); vaiPara(k); }, onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); vaiPara(k); } } }, nomesAbas[k])));
  const caixa = el('div', { class: 'painel fechamento lousa' + (anima ? ' fx-anima' : '') },
    el('div', { class: 'fx-topo' }, el('img', { class: 'fx-registradora', src: urlArte('ui/caixa_registradora'), alt: '' }),
      el('div', {}, el('div', { class: 'titulo titulo-tela' }, 'Fechamento do caixa'), el('div', { class: 'fx-quando' }, noiteDoDia(G.dia)))),
    el('div', { class: 'fx-nota' }, ...estrelas, el('span', {}, ` Nota da noite: ${nota}`)),
    abas, paginas.caixa, paginas.noite, paginas.fama,
    // (15/10, a clareza) o que é cada número, no "(?)" ao lado do botão (fechado, não ocupa linha a mais)
    el('div', { class: 'fx-pe' }, linhaAjuda('fechamento', 'Lucro = receita − despesa − salários.', [
      `Nota da noite: a média das estrelas de quem comeu (1 a 5). ${GLOSSARIO.curtida}`, GLOSSARIO.pitada,
      'Receita: pratos + bebidas + gorjetas + prêmios (cliente especial, pedidos da Vila e metas).',
      GLOSSARIO.despesa + ' Salários: o da equipe, por noite (na reserva, meio salário).',
      'Da despensa: os ingredientes que as panelas da noite levaram (já estavam pagos: não saem do lucro). No lixo: a sobra da panela e os pratos perdidos.',
      'O gráfico: o lucro das últimas noites (a de hoje acesa); a frase compara com a noite anterior.',
      'Receita perdida: o que pagaria quem foi embora sem comer.', GLOSSARIO.casa, GLOSSARIO.sobra,
      'As frases no fim da aba "A noite" contam o que travou a janta (farinheira vazia, passe cheio, espera longa, louça suja).']),
      anima ? el('div', { class: 'fx-pula' }, 'clique ou Espaço para pular') : null,
      el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, opc.rever ? 'Voltar ao resumo' : 'Fechar a pensão')));
  caixa._animando = anima;
  // clique na lousa (fora das abas e dos botões) pula a animação; Espaço/Enter/E também (ui.js, teclaNoModal → _tecla)
  caixa.addEventListener('click', e => { if (caixa._animando && !e.target.closest('button, .ajuda-q, .aba-lousa')) { e.stopPropagation(); pularFechamento(caixa); } });
  caixa._tecla = e => (['Space', 'Enter', 'NumpadEnter', 'KeyE', 'KeyX'].includes(e.code) && pularFechamento(caixa));
  abrirModal(caixa, opc.depois);
  contarFechamento(caixa, planoFechamento(r, nota, lucro, rapido), anima, !opc.rever);
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
