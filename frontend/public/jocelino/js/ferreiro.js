// Jocelino — ferreiro.js — o Seu Tonico na ferraria (o Clint do Stardew; ferreiro.gd do Godot): melhora uma
// ferramenta por vez por dinheiro + 5 barras, e ela fica 2 dias na oficina. Nesta etapa só o nível "reforçada"
// (ferro); profissional (aço) e de mestre (bronze) vêm com as bancadas da pedreira (etapa 5). Ele também funde o
// ferro velho em barra: 5 por 1, Cr$ 10. Aberta das 8h às 18h, menos domingo.

const NIVEIS_FERR = ['comum', 'reforçada', 'profissional', 'de mestre'];
const Ferreiro = {
  CUSTOS: { 1: { dinheiro: 100, barra_ferro: 5 } },
  FERRAMENTAS: ['machado', 'picareta', 'pa', 'regador', 'foice', 'colher'],
  DIAS: 2, FUNDIR: 5, PRECO_FUNDIR: 10,
  iniciar(s) { G.ferreiro = { oficina: s.ferreiro && s.ferreiro.oficina ? Object.assign({}, s.ferreiro.oficina) : null }; G.nivelFerr = Object.assign({}, s.nivelFerr || {}); },
  salvar(s) { s.ferreiro = { oficina: G.ferreiro.oficina ? Object.assign({}, G.ferreiro.oficina) : null }; s.nivelFerr = Object.assign({}, G.nivelFerr); },
  custo(id) { return Ferreiro.CUSTOS[nivelFerramenta(id) + 1] || null; },
  deixar(id, mochila, dinheiro, dia) {
    if (!Ferreiro.FERRAMENTAS.includes(id)) return { ok: false, gasto: 0, motivo: 'Isso o Tonico não melhora.' };
    if (G.ferreiro.oficina) return { ok: false, gasto: 0, motivo: 'Já tem uma ferramenta sua na oficina.' };
    const c = Ferreiro.custo(id);
    if (!c) return { ok: false, gasto: 0, motivo: 'O próximo nível pede aço da pedreira: ainda não dá.' };
    if (mochila.total(id) < 1) return { ok: false, gasto: 0, motivo: 'Traga a ferramenta na mochila.' };
    const preco = Math.round(c.dinheiro * (typeof Habilidades !== 'undefined' ? Habilidades.desconto() : 1));
    if (dinheiro < preco) return { ok: false, gasto: 0, motivo: `O dinheiro não dá (Cr$ ${preco}).` };
    for (const m in c) if (m !== 'dinheiro' && mochila.total(m) < c[m]) return { ok: false, gasto: 0, motivo: `Faltam barras de ferro (${c[m]}).` };
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
  aberta() { return !relogio.domingo() && G.minutos >= 8 * 60 && G.minutos < 18 * 60; },
};
// Machado e picareta batem com 1 + nível; pá, regador e colher cobrem 3 ladrilhos em linha no nível reforçado.
const danoDaFerramenta = id => ['machado', 'picareta'].includes(id) ? 1 + nivelFerramenta(id) : 1;
const areaDaFerramenta = id => ['pa', 'regador', 'colher'].includes(id) ? (nivelFerramenta(id) >= 1 || (id === 'regador' && typeof Habilidades !== 'undefined' && Habilidades.tem('rega_de_mestre')) ? 3 : 1) : 1;
INICIADORES.push(s => Ferreiro.iniciar(s));
COLETORES.push(s => Ferreiro.salvar(s));
MANHA.push(() => { if (Ferreiro.pronta(G.dia) && G.dia === G.ferreiro.oficina.pronta) G.feitosHoje.push(`O Seu Tonico terminou ${NOME_FERRAMENTA[G.ferreiro.oficina.id] || G.ferreiro.oficina.id} reforçada: passe na ferraria.`); });
TAREFAS.push(() => G.ferreiro && Ferreiro.pronta(G.dia) ? [{ texto: 'Buscar a ferramenta na ferraria do Tonico' }] : []);

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
        el('div', {}, el('b', {}, `${Itens.nome(id)} (${NIVEIS_FERR[nivelFerramenta(id)]})`), el('div', { class: 'orel-preco' }, c ? `Melhorar: Cr$ ${c.dinheiro} + ${c.barra_ferro} barras de ferro` : 'O próximo nível pede aço (mais para a frente).')),
        c && tem && !o ? el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Ferreiro.deixar(id, G.mochila, G.dinheiro, G.dia);
          if (r.ok) { G.dinheiro -= r.gasto; G.gastoHoje += r.gasto; sons.tocar('golpe', 0.8, 0.05, -4); avisar(`O Tonico ficou com ${NOME_FERRAMENTA[id] || id}: em 2 dias está pronta.`); hudSujo(); desenha(); } else avisar(r.motivo); } }, 'Melhorar') : null));
    }
    caixa.append(grade, el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap' },
      el('div', { style: 'font-weight:800' }, `Ferro velho: ${G.mochila.total('ferro_velho')} · Barras: ${G.mochila.total('barra_ferro')} · Cr$ ${G.dinheiro}`),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Ferreiro.fundir(G.mochila, G.dinheiro); if (r.ok) { G.dinheiro -= r.gasto; G.gastoHoje += r.gasto; sons.tocar('golpe', 1, 0.05, -6); hudSujo(); desenha(); } else avisar(r.motivo); } }, 'Fundir ferro velho em barra'),
      el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 0.9, 0.03, -6);
  return true;
}
