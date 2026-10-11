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
    G.ferreiro.oficina = { id, nivel: nivelFerramenta(id) + 1, pronta: dia + Ferreiro.DIAS };
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
    const k = Math.min(n, Math.floor(dinheiro / Ferreiro.PRECO_FUNDIR));
    if (!k) return { ok: false, gasto: 0, motivo: `Cada barra custa Cr$ ${Ferreiro.PRECO_FUNDIR}.` };
    mochila.remover('ferro_velho', k * Ferreiro.FUNDIR); mochila.adicionar('barra_ferro', k);
    return { ok: true, gasto: k * Ferreiro.PRECO_FUNDIR, motivo: '' };
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
const danoDaFerramenta = id => ['machado', 'picareta'].includes(id) ? 1 + nivelFerramenta(id) : 1;
const areaDaFerramenta = id => ['pa', 'regador', 'colher'].includes(id) ? (nivelFerramenta(id) >= 1 || (id === 'regador' && typeof Habilidades !== 'undefined' && Habilidades.tem('rega_de_mestre')) ? 3 : 1) : 1;
// A área do golpe (o Stardew): pá, regador e colher — 3 em linha no nível 1 (ou com a Rega de mestre), 5 em linha no 2 e
// 3×3 à frente no 3 (começa no ladrilho alvo); o resto acerta só o alvo.
function areaDoGolpe(id, alvo, dir) {
  const v = DIR_VET[dir], n = nivelFerramenta(id), r = [];
  if (!['pa', 'regador', 'colher'].includes(id)) return [alvo];
  if (n >= 3) { const p = [v[1], v[0]]; for (let k = 0; k < 3; k++) for (let s = -1; s <= 1; s++) r.push({ x: alvo.x + v[0] * k + p[0] * s, y: alvo.y + v[1] * k + p[1] * s }); return r; }
  const tam = n >= 2 ? 5 : areaDaFerramenta(id);
  for (let k = 0; k < tam; k++) r.push({ x: alvo.x + v[0] * k, y: alvo.y + v[1] * k });
  return r;
}
INICIADORES.push(s => Ferreiro.iniciar(s));
COLETORES.push(s => Ferreiro.salvar(s));
MANHA.push(() => { if (Ferreiro.pronta(G.dia) && G.dia === G.ferreiro.oficina.pronta) G.feitosHoje.push(`O Seu Tonico terminou ${NOME_FERRAMENTA[G.ferreiro.oficina.id] || G.ferreiro.oficina.id} (${NIVEIS_FERR[G.ferreiro.oficina.nivel]}): passe na ferraria.`); });
TAREFAS.push(() => G.ferreiro && Ferreiro.pronta(G.dia) ? [{ texto: 'Buscar a ferramenta na ferraria do Tonico' }] : []);

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

// ---------- a tela da ferraria ----------
function abrirFerraria() {
  if (!Ferreiro.aberta()) { abrirConversa('Seu Tonico', urlArte('retratos/tonico_normal'), [relogio.domingo() ? 'Domingo a ferraria fecha, Jocelino.' : 'A ferraria abre das 8h às 18h.']); return true; }
  const caixa = el('div', { class: 'painel orelhao' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Ferraria do Seu Tonico'),
      el('div', { class: 'rodape', style: 'text-align:left;margin-bottom:8px' }, '"Ferramenta boa é meio caminho andado." A ferramenta fica 2 dias aqui. Reforçada: o machado e a picareta batem mais forte; a pá, o regador e a colher pegam 3 ladrilhos.'));
    const o = G.ferreiro.oficina;
    if (o) caixa.append(el('div', { class: 'amp-obra' }, `Na oficina: ${Itens.nome(o.id)} (${NIVEIS_FERR[o.nivel]}) — ${Ferreiro.pronta(G.dia) ? 'pronta!' : `fica pronta em ${o.pronta - G.dia} dia(s)`}`,
      Ferreiro.pronta(G.dia) ? el('button', { class: 'botao forte', style: 'margin-left:10px', onclick: e => { e.stopPropagation(); const r = Ferreiro.buscar(G.mochila, G.dia); avisar(r.ok ? `${Itens.nome(r.id)} ${NIVEIS_FERR[r.nivel]}: novinha!` : r.motivo); if (r.ok) sons.tocar('fanfarra', 1.2, 0, -8); hudSujo(); desenha(); } }, 'Buscar') : null));
    const grade = el('div', { class: 'orel-grade' });
    for (const id of Ferreiro.FERRAMENTAS) {
      const tem = G.mochila.total(id) > 0, c = Ferreiro.custo(id);
      grade.append(el('div', { class: 'orel-item' + (tem ? '' : ' trancado') }, el('img', { src: urlItem(id) }),
        el('div', {}, el('b', {}, `${Itens.nome(id)} (${NIVEIS_FERR[nivelFerramenta(id)]})`), el('div', { class: 'orel-preco' }, c ? `Melhorar para ${NIVEIS_FERR[nivelFerramenta(id) + 1]}: Cr$ ${c.dinheiro} + ${Object.entries(c).filter(([m]) => m !== 'dinheiro').map(([m, q]) => Itens.qtd(q, m)).join(', ')}` : 'De mestre: o melhor que o Tonico faz.')),
        c && tem && !o ? el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Ferreiro.deixar(id, G.mochila, G.dinheiro, G.dia);
          if (r.ok) { G.dinheiro -= r.gasto; G.gastoHoje += r.gasto; sons.tocar('golpe', 0.8, 0.05, -4); avisar(`O Tonico ficou com ${NOME_FERRAMENTA[id] || id}: em 2 dias está pronta.`); hudSujo(); desenha(); } else avisar(r.motivo); } }, 'Melhorar') : null));
    }
    caixa.append(grade, el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap' },
      el('div', { style: 'font-weight:800' }, `Ferro velho: ${G.mochila.total('ferro_velho')} · Barras: ${G.mochila.total('barra_ferro')} · Cr$ ${G.dinheiro}`),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Ferreiro.irrigador(G.mochila, G.dinheiro); if (r.ok) { G.dinheiro -= r.gasto; G.gastoHoje += r.gasto; sons.tocar('golpe', 1, 0.05, -6); avisar('O Tonico fez um irrigador: coloque no quintal, perto das covas.'); hudSujo(); desenha(); } else avisar(r.motivo); } }, `Fazer irrigador: Cr$ ${ECO.ferreiro.irrigador} + 2 barras`),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Ferreiro.molinete(G.mochila, G.dinheiro); if (r.ok) { G.dinheiro -= r.gasto; G.gastoHoje += r.gasto; sons.tocar('golpe', 1, 0.05, -6); avisar('O Tonico fez um molinete!'); hudSujo(); desenha(); } else avisar(r.motivo); } }, `Fazer molinete: Cr$ ${ECO.ferreiro.molinete} + 3 barras`),
      ...Object.keys(RECEITAS_TONICO).map(id => el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Ferreiro.fazer(id, G.mochila, G.dinheiro); if (r.ok) { G.dinheiro -= r.gasto; G.gastoHoje += r.gasto; sons.tocar('golpe', 1, 0.05, -6); avisar(`O Tonico fez ${Itens.qtd(1, id)}.`); hudSujo(); desenha(); } else avisar(r.motivo); } },
        `Fazer ${Itens.nome(id).toLowerCase()}: Cr$ ${RECEITAS_TONICO[id].dinheiro}` + Object.entries(RECEITAS_TONICO[id]).filter(([m]) => m !== 'dinheiro').map(([m, q]) => ' + ' + Itens.qtd(q, m)).join(''))),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Ferreiro.fundir(G.mochila, G.dinheiro); if (r.ok) { G.dinheiro -= r.gasto; G.gastoHoje += r.gasto; sons.tocar('golpe', 1, 0.05, -6); hudSujo(); desenha(); } else avisar(r.motivo); } }, 'Fundir ferro velho em barra'),
      el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 0.9, 0.03, -6);
  return true;
}
