// Jocelino — ferreiro.js — o Seu Tonico na ferraria (o Clint do Stardew; ferreiro.gd do Godot): melhora uma
// ferramenta por vez por dinheiro + 5 barras, e ela fica 2 dias na oficina. Nesta etapa só o nível "reforçada"
// (ferro); profissional (aço) e de mestre (bronze) vêm com as bancadas da pedreira (etapa 5). Ele também funde o
// ferro velho em barra: 5 por 1, Cr$ 10. Aberta das 8h às 18h, menos domingo.

const NIVEIS_FERR = ['comum', 'reforçada', 'profissional', 'de mestre'];
const Ferreiro = {
  CUSTOS: ECO.ferreiro.custos,
  FERRAMENTAS: ['machado', 'picareta', 'pa', 'regador', 'foice', 'colher'],
  DIAS: 2, FUNDIR: 5, PRECO_FUNDIR: ECO.ferreiro.fundir,
  iniciar(s) { G.ferreiro = { oficina: s.ferreiro && s.ferreiro.oficina ? Object.assign({}, s.ferreiro.oficina) : null }; G.nivelFerr = Object.assign({}, s.nivelFerr || {}); },
  salvar(s) { s.ferreiro = { oficina: G.ferreiro.oficina ? Object.assign({}, G.ferreiro.oficina) : null }; s.nivelFerr = Object.assign({}, G.nivelFerr); },
  custo(id) { return Ferreiro.CUSTOS[nivelFerramenta(id) + 1] || null; },
  deixar(id, mochila, dinheiro, dia) {
    if (!Ferreiro.FERRAMENTAS.includes(id)) return { ok: false, gasto: 0, motivo: 'Isso o Tonico não melhora.' };
    if (G.ferreiro.oficina) return { ok: false, gasto: 0, motivo: 'Já tem uma ferramenta sua na oficina.' };
    const c = Ferreiro.custo(id);
    if (!c) return { ok: false, gasto: 0, motivo: 'Essa já é de mestre: não tem como melhorar mais.' };
    if (mochila.total(id) < 1) return { ok: false, gasto: 0, motivo: 'Traga a ferramenta na mochila.' };
    const preco = Math.round(c.dinheiro * (typeof Habilidades !== 'undefined' ? Habilidades.desconto() : 1));
    if (dinheiro < preco) return { ok: false, gasto: 0, motivo: `O dinheiro não dá (Cr$ ${preco}).` };
    for (const m in c) if (m !== 'dinheiro' && mochila.total(m) < c[m]) return { ok: false, gasto: 0, motivo: `Falta ${Itens.qtd(c[m], m)}.` };
    for (const m in c) if (m !== 'dinheiro') mochila.remover(m, c[m]);
    mochila.remover(id, 1);
    G.ferreiro.oficina = { id, nivel: nivelFerramenta(id) + 1, pronta: dia + (typeof Gremio !== 'undefined' ? Gremio.diasTonico(Ferreiro.DIAS) : Ferreiro.DIAS) };
    return { ok: true, gasto: preco, motivo: '' };
  },
  pronta(dia) { return !!G.ferreiro.oficina && dia >= G.ferreiro.oficina.pronta; },
  buscar(mochila, dia) {
    const o = G.ferreiro.oficina;
    if (!o) return { ok: false, motivo: 'Não tem nada seu na oficina.' };
    if (dia < o.pronta) return { ok: false, motivo: `Ainda não ficou pronta: volte em ${o.pronta - dia} dia(s).` };
    if (!mochila.cabe(o.id)) return { ok: false, motivo: 'A mochila está cheia.' };
    mochila.adicionar(o.id, 1); G.nivelFerr[o.id] = o.nivel; G.ferreiro.oficina = null;
    return { ok: true, motivo: '', id: o.id, nivel: o.nivel };
  },
  fundir(mochila, dinheiro) {
    const n = Math.floor(mochila.total('ferro_velho') / Ferreiro.FUNDIR);
    if (!n) return { ok: false, gasto: 0, motivo: `Precisa de ${Ferreiro.FUNDIR} ferros velhos para uma barra.` };
    const preco = Math.round(Ferreiro.PRECO_FUNDIR * (typeof Gremio !== 'undefined' ? Gremio.fatorFundir() : 1));
    const k = Math.min(n, Math.floor(dinheiro / preco));
    if (!k) return { ok: false, gasto: 0, motivo: `Cada barra custa Cr$ ${preco}.` };
    mochila.remover('ferro_velho', k * Ferreiro.FUNDIR); mochila.adicionar('barra_ferro', k);
    return { ok: true, gasto: k * preco, motivo: '' };
  },
  // O irrigador (o aspersor do Stardew): o preço do ECO + 2 barras de ferro, pronto na hora.
  irrigador(mochila, dinheiro) {
    const preco = Math.round(ECO.ferreiro.irrigador * (typeof Habilidades !== 'undefined' ? Habilidades.desconto() : 1));
    if (mochila.total('barra_ferro') < 2) return { ok: false, gasto: 0, motivo: 'O irrigador pede 2 barras de ferro.' };
    if (dinheiro < preco) return { ok: false, gasto: 0, motivo: `O dinheiro não dá (Cr$ ${preco}).` };
    if (!mochila.cabe('irrigador')) return { ok: false, gasto: 0, motivo: 'A mochila está cheia.' };
    mochila.remover('barra_ferro', 2); mochila.adicionar('irrigador', 1);
    return { ok: true, gasto: preco, motivo: '' };
  },
  // O molinete (a vara de irídio do Stardew): o preço do ECO + 3 barras de ferro, pede Pesca 6, pronto na hora.
  molinete(mochila, dinheiro) {
    if (typeof Habilidades !== 'undefined' && Habilidades.nivel('pesca') < 6) return { ok: false, gasto: 0, motivo: 'O molinete pede Pesca 6.' };
    const preco = Math.round(ECO.ferreiro.molinete * (typeof Habilidades !== 'undefined' ? Habilidades.desconto() : 1));
    if (mochila.total('barra_ferro') < 3) return { ok: false, gasto: 0, motivo: 'O molinete pede 3 barras de ferro.' };
    if (dinheiro < preco) return { ok: false, gasto: 0, motivo: `O dinheiro não dá (Cr$ ${preco}).` };
    if (!mochila.cabe('molinete')) return { ok: false, gasto: 0, motivo: 'A mochila está cheia.' };
    mochila.remover('barra_ferro', 3); mochila.adicionar('molinete', 1);
    return { ok: true, gasto: preco, motivo: '' };
  },

  aberta() { return !relogio.domingo() && G.minutos >= 8 * 60 && G.minutos < 18 * 60; },
};
// Machado e picareta batem com 1 + nível; pá, regador e colher cobrem 3 ladrilhos em linha no nível reforçado.
const danoDaFerramenta = (id, n = nivelFerramenta(id)) => ['machado', 'picareta'].includes(id) ? 1 + n : 1;
const areaDaFerramenta = id => ['pa', 'regador', 'colher'].includes(id) ? (nivelFerramenta(id) >= 1 || (id === 'regador' && typeof Habilidades !== 'undefined' && Habilidades.tem('rega_de_mestre')) ? 3 : 1) : 1;
// A área do golpe (o Stardew): pá, regador e colher — 3 em linha no nível 1 (ou com a Rega de mestre), 5 em linha no 2 e
// 3×3 à frente no 3 (começa no ladrilho alvo). A foice corta em leque (linha transversal à direção): 3 no nível 1, 5 no 2
// e um 3×3 à frente no 3. O resto acerta só o alvo. O "n" opcional deixa a ferraria perguntar pelo PRÓXIMO nível.
function areaDoGolpe(id, alvo, dir, n = nivelFerramenta(id)) {
  const v = DIR_VET[dir], p = [v[1], v[0]], r = [];
  const quadrado = () => { for (let k = 0; k < 3; k++) for (let s = -1; s <= 1; s++) r.push({ x: alvo.x + v[0] * k + p[0] * s, y: alvo.y + v[1] * k + p[1] * s }); return r; };
  if (id === 'foice') {
    if (n >= 3) return quadrado();
    const meio = n >= 2 ? 2 : n >= 1 ? 1 : 0;
    for (let s = -meio; s <= meio; s++) r.push({ x: alvo.x + p[0] * s, y: alvo.y + p[1] * s });
    return r;
  }
  if (!['pa', 'regador', 'colher'].includes(id)) return [alvo];
  if (n >= 3) return quadrado();
  const tam = n >= 2 ? 5 : (n >= 1 || (id === 'regador' && typeof Habilidades !== 'undefined' && Habilidades.tem('rega_de_mestre')) ? 3 : 1);
  for (let k = 0; k < tam; k++) r.push({ x: alvo.x + v[0] * k, y: alvo.y + v[1] * k });
  return r;
}

// ---------- o "O que muda" de cada cartão da ferraria ----------
// Tudo sai do próprio código (DETRITOS, danoDaFerramenta, areaDoGolpe, AGUA_REGADOR, o custo do golpe): se o jogo mudar,
// o cartão muda junto. Só os nomes dos alvos e as frases moram aqui.
const ALVOS_FORCA = {
  machado: [['arvore', 'a árvore', 'cai'], ['toco', 'o toco', 'cai'], ['toco_lei', 'o toco de lei', 'cai']],
  picareta: [['pedregulho', 'o pedregulho', 'quebra'], ['ferro', 'a rocha de ferro', 'quebra'], ['aco', 'a rocha de aço', 'quebra'], ['bronze', 'a rocha de bronze', 'quebra']],
};
const LIBERA_DETRITO = { toco_lei: 'Corta os tocos de madeira de lei.' };
const FERRAMENTA_COM_AREA = { pa: ['Cava', 'covas'], regador: ['Rega', 'covas'], colher: ['Assenta', 'ladrilhos'], foice: ['Corta o mato', 'matos'] };
Object.assign(Ferreiro, {
  golpesPara(det, id, n) { return Math.ceil(DETRITOS[det].golpes / danoDaFerramenta(id, n)); },
  // Os dois alvos que mais mudam do nível n para o n+1 (se nenhum muda, o primeiro, para a conta aparecer).
  alvosQueMudam(id, n) {
    const L = (ALVOS_FORCA[id] || []).filter(([det]) => !DETRITOS[det].nivel || DETRITOS[det].nivel <= n + 1);
    const muda = L.filter(([det]) => Ferreiro.golpesPara(det, id, n) !== Ferreiro.golpesPara(det, id, n + 1));
    return (muda.length ? muda : L.slice(0, 1)).slice(0, 2);
  },
  vezes(x) { return String(Math.round(x * 10) / 10).replace('.', ','); },
  golpes(g) { return g === 1 ? '1 golpe' : g + ' golpes'; },
  custoGolpe(id, n) { return (typeof Habilidades !== 'undefined' ? Habilidades.custo(id) : CUSTO_GOLPE) * (1 + 0.5 * n); },
  // quantos ladrilhos o golpe pega no nível n e como (linha, leque ou quadrado)
  areaTexto(id, n) {
    const q = areaDoGolpe(id, { x: 0, y: 0 }, DIR.DIREITA, n).length;
    if (id === 'foice') return q === 1 ? 'Corta o mato 1 por vez' : n >= 3 ? `Corta o mato num quadrado 3×3 à frente: ${q} de uma vez` : `Corta o mato em leque: ${q} de uma vez`;
    const [verbo, coisa] = FERRAMENTA_COM_AREA[id];
    return q === 1 ? `${verbo} ${coisa === 'covas' ? '1 cova' : '1 ladrilho'} por vez` : `${verbo} ${q} ${coisa} de uma vez, ${n >= 3 ? 'num quadrado 3×3 à frente' : 'em linha'}`;
  },
  // { hoje, muda: [frases], energia } do nível atual para o próximo; null se já é de mestre.
  oQueMuda(id) {
    const n = nivelFerramenta(id), p = n + 1;
    const hoje = Ferreiro.hoje(id, n);
    if (!Ferreiro.custo(id)) return { hoje, muda: [], energia: '', maximo: true };
    const muda = [];
    if (['machado', 'picareta'].includes(id)) {
      const alvos = Ferreiro.alvosQueMudam(id, n), r = danoDaFerramenta(id, p) / danoDaFerramenta(id, n);
      muda.push(`Bate ${Ferreiro.vezes(r)}× mais forte: ` + alvos.map(([det, nome, verbo], i) => `${nome} ${i === 0 ? verbo + ' ' : ''}em ${Ferreiro.golpes(Ferreiro.golpesPara(det, id, p))} (hoje ${Ferreiro.golpesPara(det, id, n)})`).join(', ') + '.');
      for (const det in LIBERA_DETRITO) { const D = DETRITOS[det]; if (D && D.ferramenta === id && D.nivel > n && D.nivel <= p) muda.push(LIBERA_DETRITO[det]); }
    } else {
      muda.push(Ferreiro.areaTexto(id, p) + '.');
      if (id === 'regador' && Horta.aguaMax(p) !== Horta.aguaMax(n)) muda.push(`Leva mais água: ${Horta.aguaMax(p)} (hoje ${Horta.aguaMax(n)}).`);
    }
    const a = Ferreiro.custoGolpe(id, n), b = Ferreiro.custoGolpe(id, p);
    return { hoje, muda, energia: `Cada golpe fica mais caro: ${Ferreiro.vezes(b)} de energia por golpe (hoje ${Ferreiro.vezes(a)}).` };
  },
  hoje(id, n) {
    if (['machado', 'picareta'].includes(id)) return 'Hoje: ' + (n >= 3 ? ALVOS_FORCA[id].slice(0, 2) : Ferreiro.alvosQueMudam(id, n)).map(([det, nome, verbo]) => `${nome} ${verbo} em ${Ferreiro.golpes(Ferreiro.golpesPara(det, id, n))}`).join(', ') + '.';
    const base = Ferreiro.areaTexto(id, n);
    return 'Hoje: ' + base.charAt(0).toLowerCase() + base.slice(1) + (id === 'regador' ? `; leva ${Horta.aguaMax(n)} de água` : '') + '.';
  },
});
INICIADORES.push(s => Ferreiro.iniciar(s));
COLETORES.push(s => Ferreiro.salvar(s));
MANHA.push(() => { if (Ferreiro.pronta(G.dia) && G.dia === G.ferreiro.oficina.pronta) G.feitosHoje.push(`O Seu Tonico terminou ${NOME_FERRAMENTA[G.ferreiro.oficina.id] || G.ferreiro.oficina.id} (${NIVEIS_FERR[G.ferreiro.oficina.nivel]}): passe na ferraria.`); });
TAREFAS.push(() => G.ferreiro && Ferreiro.pronta(G.dia) ? [{ texto: 'Buscar a ferramenta na ferraria do Tonico', urgente: true }] : []);

// O que o Tonico faz na hora (com dinheiro e material); as entregas seguintes acrescentam forja, irrigador bom e betoneira.
const RECEITAS_TONICO = JSON.parse(JSON.stringify(ECO.ferreiro.tonico));   // os preços moram no ECO
Ferreiro.fazer = function (id, mochila, dinheiro) {
  const r = RECEITAS_TONICO[id]; if (!r) return { ok: false, gasto: 0, motivo: 'Isso o Tonico não faz.' };
  const preco = Math.round(r.dinheiro * (typeof Habilidades !== 'undefined' ? Habilidades.desconto() : 1));
  for (const m in r) if (m !== 'dinheiro' && mochila.total(m) < r[m]) return { ok: false, gasto: 0, motivo: `Falta ${Itens.qtd(r[m], m)}.` };
  if (dinheiro < preco) return { ok: false, gasto: 0, motivo: `O dinheiro não dá (Cr$ ${preco}).` };
  if (!mochila.cabe(id)) return { ok: false, gasto: 0, motivo: 'A mochila está cheia.' };
  for (const m in r) if (m !== 'dinheiro') mochila.remover(m, r[m]);
  mochila.adicionar(id, 1); return { ok: true, gasto: preco, motivo: '' };
};

// ---------- os itens que o Tonico faz na hora (cada um vira um cartão na ferraria) ----------
// O "O que faz" vem da descrição do próprio item (ITENS[id].descricao, sem o "Do Seu Tonico."); o alcance do irrigador, de
// VIZ_IRRIGADOR (quintal_coisas.js); os preços, do ECO. Se o jogo mudar, o cartão muda junto.
Object.assign(Ferreiro, {
  descontoTonico() { return typeof Habilidades !== 'undefined' ? Habilidades.desconto() : 1; },
  descricaoItem(id) { return ((ITENS[id] && ITENS[id].descricao) || '').replace(/^Do Seu Tonico\.\s*/, '').replace(/^Coloque no quintal: /, 'No quintal: '); },
  alcanceIrrigador(id) {
    const v = typeof VIZ_IRRIGADOR !== 'undefined' && VIZ_IRRIGADOR[id]; if (!v) return '';
    return `${v.length} covas coladas no irrigador${v.some(([x, y]) => x && y) ? ' (com as diagonais)' : ' (em cruz: cima, baixo e lados)'}`;
  },
  // [{ id, icone, nome, botao, receita (com dinheiro), faz, alcance, aviso, fazer() }]
  itensDeFazer() {
    const L = [
      { id: 'irrigador', receita: { dinheiro: ECO.ferreiro.irrigador, barra_ferro: 2 }, botao: 'Fazer', aviso: 'O Tonico fez um irrigador: coloque no quintal, perto das covas.', fazer: () => Ferreiro.irrigador(G.mochila, G.dinheiro) },
      { id: 'molinete', receita: { dinheiro: ECO.ferreiro.molinete, barra_ferro: 3 }, pesca: 6, botao: 'Fazer', aviso: 'O Tonico fez um molinete!', fazer: () => Ferreiro.molinete(G.mochila, G.dinheiro) },
    ];
    for (const id in RECEITAS_TONICO) L.push({ id, receita: RECEITAS_TONICO[id], botao: 'Fazer', aviso: `O Tonico fez ${Itens.qtd(1, id)}.`, fazer: () => Ferreiro.fazer(id, G.mochila, G.dinheiro) });
    const preco = Math.round(Ferreiro.PRECO_FUNDIR * (typeof Gremio !== 'undefined' ? Gremio.fatorFundir() : 1));
    L.push({ id: 'barra_ferro', fundir: true, receita: { dinheiro: preco, ferro_velho: Ferreiro.FUNDIR }, nome: 'Fundir ferro velho', botao: 'Fundir', faz: `Funde ${Ferreiro.FUNDIR} ferros velhos em 1 barra de ferro (Cr$ ${preco} por barra).`, fazer: () => Ferreiro.fundir(G.mochila, G.dinheiro) });
    for (const it of L) {
      it.icone = it.id; it.nome = it.nome || Itens.nome(it.id);
      it.faz = it.faz || Ferreiro.descricaoItem(it.id); it.alcance = Ferreiro.alcanceIrrigador(it.id);
      if (!it.fundir) it.receita = Object.assign({}, it.receita, { dinheiro: Math.round(it.receita.dinheiro * Ferreiro.descontoTonico()) });
    }
    return L;
  },
  textoCusto(it) { return `Cr$ ${it.receita.dinheiro}` + Object.entries(it.receita).filter(([m]) => m !== 'dinheiro').map(([m, q]) => ' + ' + Itens.qtd(q, m)).join('') + (it.fundir ? ' (por barra)' : ''); },
  // O que falta para fazer agora (texto) ou '' se dá.
  faltaFazer(it) {
    const f = [];
    if (it.pesca && typeof Habilidades !== 'undefined' && Habilidades.nivel('pesca') < it.pesca) f.push(`Pesca ${it.pesca}`);
    for (const m in it.receita) if (m !== 'dinheiro' && G.mochila.total(m) < it.receita[m]) f.push(Itens.qtd(it.receita[m] - G.mochila.total(m), m));
    if (G.dinheiro < it.receita.dinheiro) f.push(`Cr$ ${it.receita.dinheiro - G.dinheiro}`);
    if (!f.length && !it.fundir && !G.mochila.cabe(it.id)) f.push('espaço na mochila');
    return f.join(', ');
  },
});

// ---------- a tela da ferraria ----------
function abrirFerraria() {
  const diasT = typeof Gremio !== 'undefined' ? Gremio.diasTonico(Ferreiro.DIAS) : Ferreiro.DIAS, nDias = diasT === 1 ? '1 dia' : diasT + ' dias';   // (a Oficina do Grêmio: 1 dia)
  if (!Ferreiro.aberta()) { abrirConversa('Seu Tonico', urlArte('retratos/tonico_normal'), [relogio.domingo() ? 'Domingo a ferraria fecha, Jocelino.' : 'A ferraria abre das 8h às 18h.']); return true; }
  const caixa = el('div', { class: 'painel orelhao' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Ferraria do Seu Tonico'),
      el('div', { class: 'rodape', style: 'text-align:left;margin-bottom:8px' }, '"Ferramenta boa é meio caminho andado." A ferramenta fica ' + nDias + ' com o Tonico. Cada nível rende mais por golpe.'));
    const o = G.ferreiro.oficina;
    if (o) caixa.append(el('div', { class: 'amp-obra' }, `Na oficina: ${Itens.nome(o.id)} (${NIVEIS_FERR[o.nivel]}) — ${Ferreiro.pronta(G.dia) ? 'pronta!' : `fica pronta em ${o.pronta - G.dia} dia(s)`}`,
      Ferreiro.pronta(G.dia) ? el('button', { class: 'botao forte', style: 'margin-left:10px', onclick: e => { e.stopPropagation(); const r = Ferreiro.buscar(G.mochila, G.dia); avisar(r.ok ? `${Itens.nome(r.id)} ${NIVEIS_FERR[r.nivel]}: novinha!` : r.motivo); if (r.ok) sons.tocar('fanfarra', 1.2, 0, -8); hudSujo(); desenha(); } }, 'Buscar') : null));
    const grade = el('div', { class: 'orel-grade', style: 'grid-template-columns:repeat(auto-fill,minmax(430px,1fr))' });
    for (const id of Ferreiro.FERRAMENTAS) {
      const tem = G.mochila.total(id) > 0, c = Ferreiro.custo(id), q = Ferreiro.oQueMuda(id);
      grade.append(el('div', { class: 'orel-item' + (tem ? '' : ' trancado') }, el('img', { src: urlItem(id) }),
        el('div', {}, el('b', {}, `${Itens.nome(id)} (${NIVEIS_FERR[nivelFerramenta(id)]})`), el('div', { class: 'orel-preco' }, c ? `Melhorar para ${NIVEIS_FERR[nivelFerramenta(id) + 1]}: Cr$ ${c.dinheiro} + ${Object.entries(c).filter(([m]) => m !== 'dinheiro').map(([m, q]) => Itens.qtd(q, m)).join(', ')}` : 'De mestre: o melhor que o Tonico faz.')),
        c && tem && !o ? el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Ferreiro.deixar(id, G.mochila, G.dinheiro, G.dia);
          if (r.ok) { G.dinheiro -= r.gasto; G.gastoHoje += r.gasto; sons.tocar('golpe', 0.8, 0.05, -4); avisar(`O Tonico ficou com ${NOME_FERRAMENTA[id] || id}: em ${nDias} está pronta.`); hudSujo(); desenha(); } else avisar(r.motivo); } }, 'Melhorar') : null,
        // o que muda: ocupa a largura toda do cartão, embaixo
        el('div', { class: 'orel-muda', 'data-ferr': id, style: 'grid-column:1/-1' }, el('div', { class: 'orel-preco orel-hoje', style: 'font-style:italic' }, q.hoje),
          q.maximo ? el('div', { class: 'orel-preco orel-sobe', style: 'margin-top:2px;font-weight:800' }, 'No máximo.') : el('div', { class: 'orel-preco orel-sobe', style: 'margin-top:2px' }, el('b', {}, 'O que muda: '), q.muda.join(' '), ' ', q.energia))));
    }
    // Os itens que o Tonico faz na hora: um cartão para cada, com o desenho, o que faz, o custo e o botão.
    const fazer = el('div', { class: 'orel-grade', style: 'grid-template-columns:repeat(auto-fill,minmax(430px,1fr));margin-top:10px' });
    const cartaoFazer = (it) => {
      const falta = Ferreiro.faltaFazer(it), custo = Ferreiro.textoCusto(it);
      return el('div', { class: 'orel-item', 'data-fazer': it.id }, el('img', { src: urlItem(it.icone) }),
        el('div', {}, el('b', {}, it.nome), el('div', { class: 'orel-preco' }, 'Custa: ' + custo)),
        el('button', { class: 'botao', disabled: falta ? 'disabled' : null, title: falta ? 'Falta: ' + falta : '', onclick: e => { e.stopPropagation(); const r = it.fazer(); if (r.ok) { G.dinheiro -= r.gasto; G.gastoHoje += r.gasto; sons.tocar('golpe', 1, 0.05, -6); if (it.aviso) avisar(it.aviso); hudSujo(); desenha(); } else avisar(r.motivo); } }, it.botao),
        el('div', { style: 'grid-column:1/-1' }, el('div', { class: 'orel-preco' }, el('b', {}, 'O que faz: '), it.faz), it.alcance ? el('div', { class: 'orel-preco' }, el('b', {}, 'Alcance: '), it.alcance) : null,
          falta ? el('div', { class: 'orel-preco', style: 'font-weight:800' }, 'Falta: ' + falta + '.') : null));
    };
    for (const it of Ferreiro.itensDeFazer()) fazer.append(cartaoFazer(it));
    caixa.append(grade, el('div', { class: 'titulo', style: 'font-size:20px;margin-top:12px' }, 'O Tonico faz na hora'), fazer, el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap' },
      el('div', { style: 'font-weight:800' }, `Ferro velho: ${G.mochila.total('ferro_velho')} · Barras: ${G.mochila.total('barra_ferro')} · Cr$ ${G.dinheiro}`),
      el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 0.9, 0.03, -6);
  return true;
}
