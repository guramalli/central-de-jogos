// Jocelino — dia.js — o fim do dia e a manhã seguinte (como no Stardew): dormir na casa do Tio Juca (ou desmaiar às
// 2h, perdendo um pouco de dinheiro), o resumo da noite em cartões, a energia cheia, o dia novo e o save.
// Os sistemas acrescentam linhas ao resumo (NOITE) e o que muda de manhã (MANHA); o quadro de tarefas junta o que
// cada sistema pede (TAREFAS).
// (15/10, pedido do dono: "o resumo do dia quando você vai dormir... algo mais interativo que não seja apenas texto") O resumo
// virou a tela de fim de dia do Stardew: cartões com ícone que entram em sequência curta — o dinheiro do dia em barras, a caixa de
// venda item a item com o total contando, a obra (a diária), os recados, a pensão (o lucro e o fechamento da noite de novo), a
// amizade que subiu, a casa, as habilidades, as outras notícias e o AMANHÃ (o tempo do rádio, a janta, o que vence). Clicar num
// cartão abre o detalhe (todas as linhas dele); "Dormir" fecha. Nenhuma linha de antes sumiu: cada uma mora no cartão do sistema
// que a escreveu (as linhas continuam um array de texto; os testes e a caixa-preta leem igual).

const NOITE = [];      // (linhas) antes de virar o dia: cada sistema fecha o seu e escreve no resumo
const MANHA = [];      // () depois de virar o dia
const TAREFAS = [];    // () -> [{texto, feito, meta}] para o quadro de tarefas
let _dormindo = false;

function tarefasQuadro() { const r = []; for (const f of TAREFAS) r.push(...(f() || [])); return r; }

function pedirDormir() {
  // (13/10) Na cama de casa, o Jocelino deita e a tela escurece antes da noite (casa_dentro.js), como no Stardew.
  const vai = () => (typeof deitarNaCama === 'function' && typeof naCasa === 'function' && naCasa() ? deitarNaCama() : dormir());
  if (G.minutos < 18 * 60) {
    perguntar('Ainda é cedo. Dormir até amanhã mesmo assim?', ['Dormir', 'Agora não'], i => { if (i === 0) vai(); });
  } else perguntar('Dormir até amanhã? (o jogo salva)', ['Dormir', 'Agora não'], i => { if (i === 0) vai(); });
  return true;
}

// (15/10) A amizade de manhã (para o cartão "Amizade" do resumo dizer quem subiu no dia). (T1) amizade.js carrega antes deste
// arquivo: o INICIADOR dele (a migração do save antigo) roda antes desta foto.
let _amizadeDaManha = null;
INICIADORES.push(() => { _amizadeDaManha = Object.assign({}, G.amizade || {}); });
MANHA.push(() => { _amizadeDaManha = Object.assign({}, G.amizade || {}); });

let _acordaEm = null;   // o posto de saúde do Bairro Novo (desmaio)
function dormir(desmaiou = false) {
  if (_dormindo) return;
  _dormindo = true;
  const linhas = [], origem = [];   // origem[i]: o cartão do resumo em que a linha i mora
  const marca = (de, tag) => { for (let i = de; i < linhas.length; i++) if (!origem[i]) origem[i] = tag; };
  if (desmaiou) {
    const posto = typeof desmaioNoPosto === 'function' ? desmaioNoPosto() : null;
    const perde = posto ? Math.min(G.dinheiro, posto.custo) : Math.max(0, Math.min(100, Math.floor(G.dinheiro / 10)));
    G.dinheiro -= perde;
    linhas.push(posto ? `O Jocelino desmaiou de cansaço às 2h e acordou no posto de saúde do Bairro Novo. A consulta custou Cr$ ${perde}.` : `O Jocelino desmaiou de cansaço às 2h. Acharam ele no meio do caminho e levaram para casa${perde ? `; sumiram Cr$ ${perde} do bolso` : ''}.`);
    marca(0, 'noticias');
    _acordaEm = posto;
  }
  const antes = fotoAntesDaNoite();   // (15/10) a caixa de venda e a obra antes da noite fechar (os cartões do resumo)
  for (const f of NOITE) { const i0 = linhas.length; try { f(linhas); } catch (e) { console.error(e); } marca(i0, origemDaNoite(f)); }
  const dados = dadosDoResumo(antes, linhas);   // (antes dos níveis valerem: o preço da caixa é o da madrugada)
  // (15/10) Os níveis ganhos no dia passam a valer agora (depois de todo o NOITE: o XP da caixa de venda também conta).
  { const i0 = linhas.length; if (typeof Habilidades !== 'undefined') { try { Habilidades.dormir(linhas); } catch (e) { console.error(e); } } marca(i0, 'niveis'); }
  { const i0 = linhas.length;
    if (G.ganhoHoje) linhas.push('Ganhou hoje: Cr$ ' + G.ganhoHoje);
    if (G.gastoHoje) linhas.push('Gastou hoje: Cr$ ' + G.gastoHoje);
    marca(i0, 'dinheiro'); }
  for (const f of G.feitosHoje) { linhas.push(f); origem[linhas.length - 1] = cartaoDoFeito(f); }
  if (!linhas.length) { linhas.push('Um dia tranquilo.'); origem[0] = 'noticias'; }
  { const i0 = linhas.length;
    linhas.push('Dinheiro: Cr$ ' + G.dinheiro);
    // (revisão final) Da conversa da Rosa até a compra, o destino do dinheiro é a entrada da lojinha (uma linha só, no lugar do Bazar e da meta).
    // (dia cheio, Frente A) A mesma regra da barrinha sob o relógio: a meta da família; o Bazar só com o "Juntar para" escolhido.
    const mb = typeof metaDaBarrinha === 'function' ? metaDaBarrinha() : null;
    if (mb) linhas.push(mb.texto);
    // (13/10) O dinheiro tem destino à vista, como no Stardew: a meta da família no fim do dia. (revisão 3: uma linha de meta só — com a
    // da barrinha, só ela; sem a barrinha, a meta da família)
    if (!mb && typeof metaFamilia === 'function') { const mf = metaFamilia(); if (mf) linhas.push(`A meta da família: ${mf.texto}`); }
    marca(i0, 'dinheiro');
    if (dados) { dados.meta = mb && mb.meta ? { feito: mb.feito || 0, meta: mb.meta } : null; dados.dinheiro = G.dinheiro; dados.ganho = G.ganhoHoje || 0; dados.gasto = G.gastoHoje || 0; } }
  const diaQueAcabou = G.dia;
  // Vira o dia.
  relogio.novoDia();
  G.energia = desmaiou && !(typeof Habilidades !== 'undefined' && Habilidades.tem('incansavel')) ? Math.round(G.energiaMax * 0.6) : G.energiaMax;
  if (!desmaiou && typeof CasaFamilia !== 'undefined' && CasaFamilia.tem(5) && G.casa.mudou) G.energia = Math.round(G.energiaMax * ECO.casa.quarto);   // o quarto do casal
  if (typeof afetoFimDoDia === 'function') afetoFimDoDia();   // (o total ganho, com tudo o que entrou na noite)
  G.ganhoHoje = 0; G.gastoHoje = 0; G.feitosHoje = [];
  for (const f of MANHA) { try { f(); } catch (e) { console.error(e); } }
  // Acorda ao lado da cama, dentro de casa (13/10, como no Stardew; casa_dentro.js), ou no posto de saúde depois do desmaio.
  if (_acordaEm) { entrarMapa(_acordaEm.mapa, _acordaEm.tile); _acordaEm = null; }
  else if (typeof acordarEmCasa === 'function') acordarEmCasa();
  else entrarMapa('quintal', typeof CasaFamilia !== 'undefined' && CasaFamilia.mudou() ? CasaFamilia.porta() : { x: 7, y: 10 });
  G.jog.dir = DIR.BAIXO; G.jog.deitado = false;
  salvar();
  _dormindo = false;
  if (typeof hudSujo === 'function') hudSujo();   // (tarefa 7) o cartão refeito atrás do resumo (o "Agora" ainda falava do serviço entregue na noite)
  if (dados) { dados.origem = origem; dados.diaQueAcabou = diaQueAcabou; try { dados.amanha = amanhaDoResumo(); } catch (e) { console.error(e); } }
  mostrarResumo('Fim do dia ' + ((diaQueAcabou - 1) % 28 + 1), linhas, typeof telasDeNivel === 'function' ? () => telasDeNivel() : null, dados);   // (15/10) as telas "Subiu de nível!", depois as vantagens
}

// Ficou acordado até as 2h: desmaia.
ATUALIZADORES.push(() => { if (G.minutos >= relogio.FIM && !_dormindo) dormir(true); });

// ---------- (15/10) o resumo do dia em cartões (o fim de dia do Stardew) ----------
// De onde veio cada linha: pela função da NOITE que a escreveu (o nome do sistema aparece no código dela) ou, nas de G.feitosHoje,
// pelo assunto. O que não se encaixa vai para "Outras notícias" (nada fica de fora).
const CARTOES_NOITE = [
  ['caixa', /CaixaVenda/], ['pensao', /relatorioPensao|premiarEstrelas|cobrarExpedicaoSemJanta/],
  ['obra', /listaDeHoje|Empreitas\.noite|Tiao\.noite|PREFEITURA_OBRAS|EquipeObra|largarCarga/], ['recados', /Recados/],
  ['casa', /Horta\.|Bazar|Alugueis|Lojinha|lojinha|linhasNoiteGremio/]];
function origemDaNoite(f) { const s = String(f); for (const [id, re] of CARTOES_NOITE) if (re.test(s)) return id; return 'noticias'; }
function cartaoDoFeito(l) {
  if (/^Recado/.test(l)) return 'recados';
  if (/pensão|Rosa|inaugura|convidados|encomenda|candidatos|expedição|receita|galinheiro|Viajante|Pedido novo|hóspedes|sobrado/i.test(l)) return 'pensao';
  if (/obra|Tonico|Tião|capina|Bira|Moreira/i.test(l)) return 'obra';
  if (/horta|Zezinho|Ritinha|barril|quintal|carta|Tio Juca/i.test(l)) return 'casa';
  return 'noticias';
}
// Antes da noite: o que está na caixa de venda (o carroceiro leva de madrugada) e como ficou a lista da obra hoje.
function fotoAntesDaNoite() {
  try {
    const l = G.obra && G.obra.lista && G.obra.lista.dia === G.dia ? G.obra.lista : null;
    return { caixa: Object.assign({}, G.caixaVenda || {}), obraLista: l ? { paga: !!l.paga, fechado: !!l.fechado, extra: !!l.extra, fracao: typeof Obra !== 'undefined' ? Obra.fracao() : 0 } : null,
      aReceber: G.obra ? G.obra.aReceber || 0 : 0, amizade: _amizadeDaManha };
  } catch (e) { console.error(e); return {}; }
}
// Os números dos cartões, logo depois da noite (a caixa vendida item a item, a obra, a pensão, a amizade). Só leitura.
function dadosDoResumo(antes, linhas) {
  try {
    const d = { caixa: null, obra: null, pensao: null, amigos: [] };
    // a caixa de venda: o que saiu dela (o que não se vende voltou), com o subtotal de cada item somando o total pago
    const linhaCaixa = linhas.find(l => /^O carroceiro levou a caixa de venda e pagou Cr\$ (\d+)/.test(l));
    if (linhaCaixa && typeof CaixaVenda !== 'undefined') {
      const total = Number(linhaCaixa.match(/Cr\$ (\d+)/)[1]), bonus = typeof Habilidades !== 'undefined' ? Habilidades.bonusVenda() : 1;
      const itens = Object.entries(antes.caixa || {}).filter(([id, n]) => n > 0 && CaixaVenda.preco(id) > 0).map(([id, n]) => ({ id, n,
        v: Math.round(CaixaVenda.preco(id) * n * (typeof fatorFeira === 'function' ? fatorFeira(id) : 1) * (typeof fatorPeixe === 'function' ? fatorPeixe(id) : 1) * bonus) }));
      itens.sort((a, b) => b.v - a.v);
      if (itens.length) { const dif = total - itens.reduce((s, x) => s + x.v, 0); itens[0].v += dif; }   // (o arredondamento do total)
      d.caixa = { total, itens };
    }
    // a obra: a lista de hoje (paga, pela metade, sem lista) e o que ficou a receber
    if (G.obra && typeof Obra !== 'undefined') {
      const l = antes.obraLista, falta = Math.max(0, (G.obra.aReceber || 0) - (antes.aReceber || 0));
      d.obra = { funcao: typeof FUNCOES !== 'undefined' ? FUNCOES[G.obra.funcao] : '', diaria: Obra.diaria(), fracao: l ? Math.min(1, l.fracao) : 0,
        estado: !l ? 'sem' : l.paga ? (l.extra ? 'extra' : 'paga') : falta > 0 ? 'metade' : l.fechado ? 'fechada' : 'aberta', aReceber: falta };
    }
    // a pensão: a noite no caderno (o lucro, a nota) e o relatório para reabrir o fechamento
    const p = G.pensao;
    if (p && p.historico) { const h = p.historico.find(x => x.dia === G.dia);
      if (h) d.pensao = { h, antes: p.historico[p.historico.indexOf(h) - 1] || null, r: typeof _noiteDoFechamento !== 'undefined' && _noiteDoFechamento && _noiteDoFechamento.dia === G.dia ? _noiteDoFechamento.r : null }; }
    // a amizade que subiu hoje
    // (T1 das conversas) em pontos (100 = 1 coração), só o povo da Vila: a família não tem número e não entra no cartão
    const am0 = antes.amizade || {}, am = G.amizade || {}, P = typeof Amizade !== 'undefined' ? Amizade.POR_CORACAO : 100;
    for (const id in am) if ((am[id] || 0) > (am0[id] || 0) && (typeof Amizade === 'undefined' || Amizade.daVila(id)))
      d.amigos.push({ id, mais: am[id] - (am0[id] || 0), coracoes: Math.floor(am[id] / P), coracao: Math.floor(am[id] / P) > Math.floor((am0[id] || 0) / P) });
    d.amigos.sort((a, b) => b.mais - a.mais);
    return d;
  } catch (e) { console.error(e); return null; }
}
// O amanhã (o dia que começa): o tempo do rádio, a janta da pensão (o VIP, a festa, os moradores) e os recados que vencem.
function amanhaDoResumo() {
  const a = { chove: typeof Clima !== 'undefined' && Clima.chove(G.dia), quando: `${typeof DIAS !== 'undefined' ? DIAS[(G.dia - 1) % 7] : ''}, dia ${(G.dia - 1) % 28 + 1}`, itens: [] };
  const p = G.pensao;
  if (p && ['aberta', 'pronta'].includes(p.estado) && typeof Calendario !== 'undefined') {
    const c = Calendario.dia(p, G.dia, G.dia), nome = id => (Pratos.PRATOS[id] || { nome: id }).nome;
    if (c.fechado) a.itens.push({ img: urlArte('ui/caixa_registradora'), texto: 'Domingo: a pensão não abre.' });
    else {
      if (c.vip) a.itens.push({ img: urlArte(iconePrato(c.vip.prato)), texto: `Janta: o cliente especial ${c.vip.nome} quer ${nome(c.vip.prato)}.`, ouro: true });
      if (c.festa) a.itens.push({ img: urlArte(iconePrato(c.festa.prato)), texto: `Janta: festa (${c.festa.nome}), o prato do tema é ${nome(c.festa.prato)}.`, ouro: true });
      if (c.concurso) a.itens.push({ img: urlArte('ui/trofeu_concurso'), texto: `O Concurso da Rádio: ${c.concurso.tema}.`, ouro: true });
      if (c.viajante) a.itens.push({ img: urlArte('ui/caixa_encomenda_ui'), texto: 'O Viajante da Capital passa na praça.' });
      if (c.moradores.length) a.itens.push({ img: urlArte('ui/caixa_registradora'), texto: `Janta: ${c.moradores.map(m => m.nome).join(' e ')} ${c.moradores.length === 1 ? 'vem' : 'vêm'} jantar.` });
    }
  }
  if (G.recados && G.recados.ativos && typeof Recados !== 'undefined')
    for (const id of Object.keys(G.recados.ativos)) if (G.recados.ativos[id].ate === G.dia) a.itens.push({ img: urlArte('objetos/quadro_pedidos'), texto: `Vence hoje: o recado (${Recados.titulo(id)}).` });
  return a;
}
// O nome e o retrato de quem a amizade subiu.
function nomeDeAmigo(id) {
  if (typeof Amizade !== 'undefined') return Amizade.nome(id);
  const fam = { rosa: 'Rosa', ritinha: 'Ritinha', zezinho: 'Zezinho', juca: 'Tio Juca' };
  const c = typeof Clientela !== 'undefined' && Clientela.dado(id);
  return fam[id] || (c && c.nome) || (typeof CLIENTE_NOME !== 'undefined' && CLIENTE_NOME[id]) || (typeof RECADO_NOME !== 'undefined' && RECADO_NOME[id]) || (id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '));
}
const retratoDeAmigo = id => (typeof ARTE_LISTA !== 'undefined' && ARTE_LISTA.includes('retratos/' + id + '_alegre') ? urlArte('retratos/' + id + '_alegre') : urlArte('fx/coracao'));

// Um trilho de madeira (o da barrinha de meta do HUD) com o miolo colorido: fr de 0 a 1.
const trilhoDoResumo = (fr, cls = '') => el('div', { class: 'rd-trilho' }, el('div', { class: 'rd-enche ' + cls, style: `--w:${Math.round(Math.max(0, Math.min(1, fr)) * 100)}%` }));
// Os cartões: [{ id, titulo, icone, corpo (o que fica à vista), linhas (todas as do sistema), extra (o detalhe a mais) }].
function cartoesDoResumo(linhas, d) {
  const por = {}; linhas.forEach((l, i) => { const k = (d.origem && d.origem[i]) || 'noticias'; (por[k] = por[k] || []).push(l); });
  const C = [], txt = (t, cls = '') => el('div', { class: 'rd-num ' + cls }, t);
  // o dinheiro do dia: o que entrou e o que saiu em barras, o bolso e a meta
  { const g = d.ganho ?? 0, s = d.gasto ?? 0, m = Math.max(1, g, s);
    C.push({ id: 'dinheiro', titulo: 'O dinheiro do dia', icone: urlArte('ui/dinheiro_pilha'), linhas: por.dinheiro || [],
      corpo: [el('div', { class: 'rd-barra' }, el('span', {}, 'Entrou'), trilhoDoResumo(g / m, 'sobe'), el('b', {}, g ? `Cr$ ${g}` : 'nada')),
        el('div', { class: 'rd-barra' }, el('span', {}, 'Saiu'), trilhoDoResumo(s / m, 'desce'), el('b', {}, s ? `Cr$ ${s}` : 'nada')),
        txt(`No bolso: Cr$ ${d.dinheiro ?? G.dinheiro}`),
        d.meta ? el('div', { class: 'rd-barra rd-meta-linha' }, el('span', {}, 'Meta'), trilhoDoResumo(d.meta.feito / d.meta.meta, 'rd-meta'), el('b', {}, `${Math.round(d.meta.feito / d.meta.meta * 100)}%`)) : null] }); }
  // a caixa de venda: os itens com ícone e o total que conta
  if (d.caixa || por.caixa) {
    const cx = d.caixa;
    C.push({ id: 'caixa', titulo: 'A caixa de venda', icone: urlArte('objetos/caixa_venda'), linhas: por.caixa || [],
      corpo: cx ? [el('div', { class: 'rd-fichas' }, ...cx.itens.slice(0, 6).map(x => el('span', { class: 'rd-ficha', title: Itens.nome(x.id) }, el('img', { src: urlItem(x.id), alt: '' }), `×${x.n}`)),
          cx.itens.length > 6 ? el('span', { class: 'rd-ficha' }, `+${cx.itens.length - 6}`) : null),
        el('div', { class: 'rd-num ouro' }, 'Cr$ ', el('span', { 'data-conta': cx.total }, String(cx.total)))] : [],
      extra: cx ? el('div', { class: 'rd-lista' }, ...cx.itens.map(x => el('div', { class: 'rd-item' }, el('img', { src: urlItem(x.id), alt: '' }), el('span', {}, `${Itens.nome(x.id)} ×${x.n}`), el('b', {}, `Cr$ ${x.v}`))),
        el('div', { class: 'rd-item total' }, el('span', {}, 'Total'), el('b', {}, `Cr$ ${cx.total}`))) : null });
  }
  // a obra: a função, a lista de hoje e a diária
  if (d.obra || por.obra) {
    const o = d.obra, est = o && { sem: 'Sem lista da obra hoje.', paga: `Lista completa: diária paga (Cr$ ${o.diaria}).`, extra: 'O extra do dia: pago.', metade: `Fez parte da lista: Cr$ ${o.aReceber} a receber com o Bira.`,
      fechada: 'A lista ficou pela metade.', aberta: 'A lista ficou sem terminar.' }[o.estado];
    C.push({ id: 'obra', titulo: 'A obra e os serviços', icone: urlItem('colher'), linhas: por.obra || [],
      corpo: o ? [txt(o.funcao ? `${o.funcao} · diária Cr$ ${o.diaria}` : ''), o.estado !== 'sem' ? trilhoDoResumo(o.fracao, o.estado === 'paga' || o.estado === 'extra' ? 'sobe' : 'rd-meta') : null, el('div', { class: 'rd-frase' }, est)] : [] });
  }
  if (por.recados) C.push({ id: 'recados', titulo: 'Os recados da Vila', icone: urlArte('objetos/quadro_pedidos'), linhas: por.recados });
  // a pensão: o lucro da noite (o caderno), a nota e o fechamento de novo
  if (d.pensao || por.pensao) {
    const pn = d.pensao, cmp = pn && typeof textoComparacao === 'function' ? textoComparacao({ hoje: pn.h, antes: pn.antes }) : null;
    C.push({ id: 'pensao', titulo: 'A Pensão da Rosa', icone: urlArte('ui/caixa_registradora'), linhas: por.pensao || [], fechamento: pn && pn.r,
      corpo: pn ? [el('div', { class: 'rd-num ' + (pn.h.lucro >= 0 ? 'ouro' : 'menos') }, `Lucro: Cr$ ${pn.h.lucro}`),
        el('div', { class: 'rd-estrelas' }, '★'.repeat(pn.h.nota || 0) + '☆'.repeat(Math.max(0, 5 - (pn.h.nota || 0))), pn.h.rosa ? el('small', {}, ' (a Rosa sozinha)') : null),
        cmp && pn.antes ? el('div', { class: 'rd-frase ' + cmp.cls }, cmp.texto) : null] : [] });
  }
  if (d.amigos && d.amigos.length) C.push({ id: 'amizade', titulo: 'A amizade', icone: urlArte('fx/coracao'), linhas: [],
    corpo: [el('div', { class: 'rd-amigos' }, ...d.amigos.slice(0, 5).map(a => el('span', { class: 'rd-amigo', title: nomeDeAmigo(a.id) }, el('img', { src: retratoDeAmigo(a.id), alt: '' }), `+${a.mais}`)))],
    extra: el('div', { class: 'rd-lista' }, ...d.amigos.map(a => el('div', { class: 'rd-item' }, el('img', { src: retratoDeAmigo(a.id), alt: '' }), el('span', {}, nomeDeAmigo(a.id)), el('b', {}, `+${a.mais} de amizade` + (a.coracao ? ` (${a.coracoes}º coração!)` : ''))))) });
  if (por.casa) C.push({ id: 'casa', titulo: 'A casa e o quintal', icone: urlItem('regadorzinho'), linhas: por.casa });
  if (por.niveis) { const h = Object.keys(typeof NOMES_HAB !== 'undefined' ? NOMES_HAB : {}).find(k => por.niveis.some(l => l.startsWith(NOMES_HAB[k])));
    C.push({ id: 'niveis', titulo: 'As habilidades', icone: urlItem('hab_' + (h || 'negocio')), linhas: por.niveis }); }
  if (por.noticias) C.push({ id: 'noticias', titulo: 'Outras notícias', icone: urlArte('objetos/radio'), linhas: por.noticias });
  // o amanhã: o tempo do rádio, a janta, o que vence
  if (d.amanha) { const a = d.amanha;
    C.push({ id: 'amanha', titulo: 'Amanhã', icone: urlArte(a.chove ? 'ui/tempo_chuva' : 'ui/tempo_sol'), linhas: [],
      corpo: [txt(`${a.chove ? 'Chuva' : 'Tempo bom'} · ${a.quando}`), el('div', { class: 'rd-frase' }, a.chove ? 'O rádio diz: chuva na Baixada. A chuva rega a horta.' : 'O rádio diz: sol entre nuvens.'),
        ...a.itens.slice(0, 2).map(x => el('div', { class: 'rd-frase' + (x.ouro ? ' ouro' : '') }, x.texto))],
      extra: a.itens.length ? el('div', { class: 'rd-lista' }, ...a.itens.map(x => el('div', { class: 'rd-item' }, el('img', { src: x.img, alt: '' }), el('span', {}, x.texto)))) : null }); }
  // a ordem dos cartões: a pensão primeiro (o centro do jogo), o dinheiro, o que se vendeu e se trabalhou, as pessoas, o resto e o amanhã
  const ORDEM = ['pensao', 'dinheiro', 'caixa', 'obra', 'recados', 'amizade', 'casa', 'niveis', 'noticias', 'amanha'];
  return C.sort((a, b) => ORDEM.indexOf(a.id) - ORDEM.indexOf(b.id));
}
// O resumo da noite: a faixa do céu da noite com o título, os cartões que entram em sequência, o detalhe de um cartão e "Dormir".
// dados (dormir): os números dos cartões e de onde veio cada linha; sem eles (outra chamada), as linhas vão para "Outras notícias".
// dados.semIntro: voltando do fechamento, sem a entrada em sequência.
function mostrarResumo(titulo, linhas, depois, dados) {
  const d = dados || { origem: [] }, anima = !MODO_TESTE.leve && !d.semIntro;
  let cartoes; try { cartoes = cartoesDoResumo(linhas, d); } catch (e) { console.error(e); cartoes = [{ id: 'noticias', titulo: 'O dia', icone: urlArte('objetos/radio'), linhas }]; }
  const caixa = el('div', { class: 'painel placa resumo-dia' + (anima ? ' rd-anima' : '') });
  const grade = el('div', { class: 'rd-grade' }), detalhe = el('div', { class: 'rd-detalhe', hidden: true });
  const VISIVEIS = 3;
  const abre = c => {
    pular(); detalhe.innerHTML = '';
    // (T1: sem o .filter, o cartão sem linhas, como "A amizade", escrevia "null" no detalhe)
    detalhe.append(...[el('div', { class: 'rd-det-topo' }, el('img', { src: c.icone, alt: '' }), el('div', { class: 'titulo' }, c.titulo)),
      ...(c.corpo || []).filter(Boolean).map(n => n.cloneNode(true)), c.extra ? c.extra.cloneNode(true) : null,
      c.linhas.length ? el('div', { class: 'rd-linhas' }, ...c.linhas.map(l => el('div', { class: l.startsWith('   ') ? 'rd-sub' : '' }, l.trim()))) : null,
      el('div', { class: 'rd-det-pe' }, c.fechamento ? botaoFechamento(c) : null, el('button', { class: 'botao', onclick: e => { e.stopPropagation(); fechaDetalhe(); } }, 'Voltar'))].filter(Boolean));
    detalhe.querySelectorAll('[data-conta]').forEach(b => { b.textContent = b.dataset.conta; });
    grade.hidden = true; detalhe.hidden = false; sons.tocar('abrir', 1.1, 0.03, -8);
  };
  const fechaDetalhe = () => { detalhe.hidden = true; grade.hidden = false; sons.tocar('cursor', 1, 0.03, -8); };
  const botaoFechamento = c => el('button', { class: 'botao', onclick: e => { e.stopPropagation();
    abrirFechamento(c.fechamento, { rever: true, depois: () => mostrarResumo(titulo, linhas, depois, Object.assign({}, d, { semIntro: true })) }); } }, 'Ver o fechamento');
  cartoes.forEach((c, i) => {
    const vis = c.linhas.slice(0, (c.corpo || []).filter(Boolean).length ? 2 : VISIVEIS), resto = c.linhas.length - vis.length;
    grade.append(el('div', { class: 'rd-cartao rd-' + c.id, style: `--i:${i}`, role: 'button', tabindex: 0, 'data-cartao': c.id, title: 'Clique para ver tudo',
      onclick: e => { e.stopPropagation(); abre(c); }, onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); abre(c); } } },
      el('div', { class: 'rd-topo' }, el('img', { src: c.icone, alt: '' }), el('span', {}, c.titulo)),
      ...(c.corpo || []).filter(Boolean),
      vis.length ? el('div', { class: 'rd-linhas' }, ...vis.map(l => el('div', { class: l.startsWith('   ') ? 'rd-sub' : '' }, l.trim()))) : null,
      // (todas as linhas ficam na página: as que não cabem no cartão esperam o clique)
      resto > 0 ? el('div', { class: 'rd-linhas', hidden: true }, ...c.linhas.slice(vis.length).map(l => el('div', {}, l.trim()))) : null,
      el('div', { class: 'rd-mais' }, resto > 0 ? `+${resto} — ver tudo` : 'ver tudo'),
      c.fechamento ? botaoFechamento(c) : null));
  });
  caixa.append(
    // O céu da noite fica só na faixa do título (no fundo da caixa inteira, ele cobria as linhas quando o resumo crescia).
    el('div', { class: 'titulo rd-ceu' }, '☾  ' + titulo),
    grade, detalhe,
    el('div', { class: 'rd-pe' }, el('div', { class: 'rodape' }, anima ? 'clique para ver tudo de uma vez' : 'clique num cartão para ver os detalhes'),
      el('button', { class: 'botao forte rd-dormir', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Dormir')));
  // a entrada em sequência: cada cartão entra 110 ms depois do anterior; a caixa de venda conta o total quando o cartão dela chega
  let animando = anima;
  const pular = () => { if (!animando) return false; animando = false; caixa.classList.remove('rd-anima'); caixa.querySelectorAll('.rd-grade [data-conta]').forEach(b => { b.textContent = b.dataset.conta; }); const r = caixa.querySelector('.rd-pe .rodape'); if (r) r.textContent = 'clique num cartão para ver os detalhes'; return true; };
  if (anima) {
    cartoes.forEach((c, i) => setTimeout(() => { if (animando && caixa.isConnected) sons.tocar('letra', 0.9 + i * 0.03, 0.02, -10); }, i * 110 + 60));
    const ci = cartoes.findIndex(c => c.id === 'caixa'), b = ci >= 0 ? caixa.querySelector('.rd-caixa [data-conta]') : null;
    if (b) { b.textContent = '0'; setTimeout(() => { if (!animando) return; const fim = Number(b.dataset.conta), t0 = performance.now();
      const passo = () => { if (!animando || !caixa.isConnected) return; const u = Math.min(1, (performance.now() - t0) / 700); b.textContent = String(Math.round(fim * u)); if (u < 1) requestAnimationFrame(passo); else sons.tocar('contagem_dinheiro', 1.1, 0.02, -6); };
      passo(); }, ci * 110 + 250); }
    setTimeout(pular, cartoes.length * 110 + 1000);
  }
  // o clique fora dos cartões: pula a entrada; depois, é o "Dormir" (como o clique da placa de antes)
  caixa.onclick = e => { e.stopPropagation(); if (pular()) return; if (!detalhe.hidden) { fechaDetalhe(); return; } fecharModal(); };
  caixa._avancar = () => caixa.onclick({ stopPropagation() {} });
  // Esc com um detalhe aberto volta aos cartões; Espaço/Enter pulam a entrada (o resto das teclas faz o de sempre: ui.js)
  caixa._tecla = e => {
    if (!detalhe.hidden && ['Escape', 'Space', 'Enter', 'NumpadEnter', 'KeyE', 'KeyX'].includes(e.code)) { fechaDetalhe(); return true; }
    if (animando && ['Space', 'Enter', 'NumpadEnter', 'KeyE', 'KeyX'].includes(e.code)) { pular(); return true; }
    return false;
  };
  abrirModal(caixa, depois);
  if (anima) sons.tocar('abrir', 1, 0.03, -8);
}
