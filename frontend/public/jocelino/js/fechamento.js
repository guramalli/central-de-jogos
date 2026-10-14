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

// ---------- a contagem do fechamento (14/10, o Dave: o dinheiro contado com som, as estrelas uma a uma, a fanfarra do degrau) ----------
// Depois de a vinheta de samba do fim da janta entrar (FECHAMENTO_ESPERA s), as parcelas sobem de 0 com um "ka-ching" cada, as
// estrelas da nota acendem uma por uma num "plim" que sobe de tom e, por fim, a conquista da noite (um som só: o degrau da
// pensão, ou receita nova / o Paladar contente; o Paladar descontente resmunga). Lógica pura: [{ t, som?, acao?, k? }].
const FECHAMENTO_ESPERA = 1.2, FECHAMENTO_ESTRELA = 0.32;
function planoFechamento(r, nota, lucro) {
  const P = [], D = FECHAMENTO_ESPERA;
  P.push({ t: D, acao: 'conta', k: 'vendas' }); if (r.ganho) P.push({ t: D + 0.5, som: ['contagem_dinheiro', 1, 0.02, -4] });
  P.push({ t: D + 0.7, acao: 'conta', k: 'gorjetas' }); if (r.gorjeta) P.push({ t: D + 1.2, som: ['contagem_dinheiro', 1.08, 0.02, -4] });
  P.push({ t: D + 1.4, acao: 'conta', k: 'lucro' }); P.push({ t: D + 1.9, som: lucro >= 0 ? ['contagem_dinheiro', 1.16, 0.02, -2] : ['cliente_hmpf', 1, 0.03, -4] });
  let t = D + 2.3;
  for (let k = 1; k <= nota; k++, t += FECHAMENTO_ESTRELA) P.push({ t, acao: 'estrela', k, som: ['estrela_' + k, 1, 0, -4] });
  t += 0.4;
  const novas = (r.aprendidas || []).length + (r.chef && r.chef.inventou ? r.chef.inventou.length : 0);
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
function abrirFechamento(r) {
  const p = G.pensao, nota = Metas.notaDaNoite(r);
  const vendas = r.ganho, gorj = r.gorjeta, custo = r.custo || 0, lucro = vendas + gorj - custo;
  const linha = (a, b, cls = '') => el('div', { class: 'fx-linha ' + cls }, el('span', {}, a), el('b', {}, b));
  // as parcelas que a contagem sobe de 0 (fora do modo de teste começam em "Cr$ 0") e as estrelas que acendem uma a uma
  const anima = !MODO_TESTE.leve;
  const parcela = (a, k, v, cls = '') => el('div', { class: 'fx-linha ' + cls }, el('span', {}, a), el('b', { 'data-conta': k, 'data-valor': v, 'data-pre': 'Cr$ ' }, `Cr$ ${anima ? 0 : v}`));
  const estrelas = Array.from({ length: 5 }, (_, i) => el('i', { class: i < nota ? 'fx-estrela' + (anima ? ' apagada' : '') : 'fx-estrela-vazia' }, i < nota ? '★' : '☆'));
  const px = p.proximoDegrau();
  const caixa = el('div', { class: 'painel fechamento' },
    el('div', { class: 'titulo titulo-tela' }, 'Fechamento do caixa'),
    el('div', { class: 'fx-nota' }, ...estrelas, el('span', {}, ` Nota da noite: ${nota}`)),
    el('div', { class: 'fx-col' },
      // (tarefa 7, o robô jogador) "comeram" conta gente, não pratos: o Tonhão pede 3 vezes e a noite mostrava "8 clientes (9 comeram)";
      // os pratos a mais vão entre parênteses, e "1 foi embora" no singular
      linha('Clientes', `${r.clientes} (${r.comeram ?? r.servidos} comeram${r.servidos > (r.comeram ?? r.servidos) ? `, ${r.servidos} pratos` : ''}, ${r.embora} ${r.embora === 1 ? 'foi embora' : 'foram embora'})`),
      parcela('Pratos vendidos', 'vendas', vendas), parcela('Gorjetas', 'gorjetas', gorj), linha(`Bebidas servidas`, `${r.bebidas || 0} (${r.medida || 0} na medida)`),
      r.cafes ? linha('Só cafezinho (faltou ingrediente)', `${r.cafes}`) : null,
      linha('Despesa da noite (gás, gelo, luz)', `− Cr$ ${r.despesa || 0}`, 'menos'), r.salarios ? linha('Salários', `− Cr$ ${r.salarios}`, 'menos') : null,
      r.desperdicio ? linha('Foi para o lixo', `${r.desperdicio} prato(s)`, 'menos') : null,
      // (o cardápio do Bancho) quem ficou sem prato do quadro levou o prato da casa; a sobra da panela foi para o lixo (r.sobra = { prato: n })
      r.casa ? linha('Prato da casa (sem curtida)', `${r.casa} ${r.casa === 1 ? 'prato' : 'pratos'}`) : null,   // (tarefa 7: conta pratos — o Tonhão repete — e dava "9 clientes" de 8)
      textoSobra(r.sobra) ? linha('Sobrou', textoSobra(r.sobra).replace(/^Sobrou: /, ''), 'menos') : null,
      parcela('Lucro da noite', 'lucro', lucro, lucro >= 0 ? 'lucro' : 'menos')),
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
  contarFechamento(caixa, planoFechamento(r, nota, lucro));
}
