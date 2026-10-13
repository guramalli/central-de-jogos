// Jocelino — caderneta.js — a Caderneta do Jocelino (tecla J): o próximo passo de cada frente, com quanto falta e o botão
// Mostrar (a seta leva até lá). Como é no Stardew: o diário (F), a página das habilidades e o Golden Scroll do Centro
// Comunitário; o resto o jogador descobre olhando. Divergência de propósito (o jogador pediu, 12/10): "ele precisa ser
// orientado do que pode ser feito" — a caderneta junta num lugar o que o Stardew deixa espalhado. Cada fonte é uma função
// no registro CADERNETA (como o TAREFAS); a caderneta lê os sistemas, nunca é lida por eles.
const CADERNETA_ABAS = [['hoje', 'Hoje'], ['quintal', 'Quintal e horta'], ['carreira', 'Carreira'], ['vila', 'Vila'], ['pensao', 'Pensão']];
const CADERNETA = [];
const DICA_XP = { folego: 'limpar, cortar e quebrar', alvenaria: 'a pá, a obra e o entulho', acabamento: 'as empreitas de acabamento', negocio: 'vender', roca: 'colher a horta', pesca: 'pescar' };
// "falta 1 obra" / "faltam 5 alfaces, 5 couves" (a concordância com o que falta).
const faltaTxt = partes => ((partes.length > 1 || parseInt(partes[0], 10) > 1) ? 'faltam ' : 'falta ') + partes.join(', ');
const _liberado = sis => typeof Guia === 'undefined' || Guia.liberado(sis);
const Caderneta = {
  linhas() { const r = []; for (const f of CADERNETA) { try { r.push(...(f() || [])); } catch (e) { console.error('caderneta', e); } } return r; },
  linha(id) { return Caderneta.linhas().find(l => l.id === id) || null; },
};
// Hoje: o que tem hora.
CADERNETA.push(() => {
  const r = [], dom = (G.dia - 1) % 7 === 6, l = typeof listaDeHoje === 'function' ? listaDeHoje() : null;
  if (G.obra && !Obra.aberta(G.dia, G.minutos) && !(l && l.paga)) r.push({ id: 'hoje_obra', aba: 'hoje', hoje: true, texto: `A obra do Mestre Bira, na Vila: Cr$ ${Obra.diaria()} por dia, até as 17h`, alvo: { mapa: 'vila', morador: 'bira' } });
  if (G.empreitas && _liberado('quadro') && G.empreitas.quadro.length && !Object.keys(G.empreitas.aceitas).length) r.push({ id: 'hoje_quadro', aba: 'hoje', hoje: true, texto: `${G.empreitas.quadro.length} serviço(s) no quadro da Vila (pagam na hora)`, alvo: { mapa: 'vila', objeto: 'quadro_pedidos' } });
  if (G.pensao && G.pensao.estado === 'aberta' && typeof pensaoAbreHoje === 'function' && pensaoAbreHoje() && G.pensao.ultimaJanta !== G.dia && G.minutos < 17 * 60) r.push({ id: 'hoje_pensao', aba: 'hoje', hoje: true, texto: 'A pensão abre às 17h: a Rosa conta com você', alvo: { mapa: 'vila', objeto: 'pensao' } });
  if (!dom && G.minutos >= 8 * 60 && G.minutos < 17 * 60) r.push({ id: 'hoje_deposito', aba: 'hoje', texto: 'O depósito do Ananias (material, sementes, comida) fecha às 17h', alvo: { mapa: 'vila', objeto: 'deposito' } });
  if (typeof Clima !== 'undefined' && Clima.chove(G.dia)) r.push({ id: 'hoje_chuva', aba: 'hoje', texto: 'Chove hoje: a horta já está regada e a mata dá mais cogumelo' });
  return r;
});
// O quintal e a horta.
const _alvoLimparQuintal = () => { if (G.mapaId !== 'quintal') return { mapa: 'quintal' }; const o = _maisPerto(x => DET_LIMPAR.includes(x.det)); return o ? { mapa: 'quintal', ponto: { x: o.x, y: o.y - 56 }, det: o.det } : null; };
const _pontoCova = k => { const [x, y] = k.split(',').map(Number); return { mapa: 'quintal', ponto: { x: (x + 0.5) * TILE, y: y * TILE } }; };
CADERNETA.push(() => {
  const r = [];
  if (typeof QuintalMarcos !== 'undefined' && G.quintalMarcos) { const t = QuintalMarcos.total(), f = t - QuintalMarcos.restantes(), m = QuintalMarcos.proximo();
    if (m) r.push({ id: 'quintal_limpar', aba: 'quintal', texto: `Limpar o quintal: ${f} de ${t} (o Tio Juca dá um prêmio em ${m}%)`, feito: f, meta: Math.ceil(t * m / 100), alvo: _alvoLimparQuintal }); }
  if (!G.horta || !_liberado('horta')) return r;
  const covas = Object.entries(G.horta.covas), maduras = covas.filter(([, c]) => Horta.madura(c)), secas = covas.filter(([, c]) => c.planta && !Horta.molhada(c, G.dia) && !Horta.madura(c)), vazias = covas.filter(([, c]) => !c.planta);
  const est = estacaoDoDia(G.dia), daEstacao = Object.keys(CULTURAS).filter(id => CULTURAS[id].estacoes.includes(est)), semente = G.mochila.slots.find(s => s && daEstacao.includes(culturaDaSemente(s.id)));
  if (maduras.length) r.push({ id: 'horta_colher', aba: 'quintal', hoje: true, texto: `${maduras.length} pé(s) da horta pronto(s) para colher`, alvo: _pontoCova(maduras[0][0]), rotulo: 'Botão direito: colher' });
  if (secas.length) r.push({ id: 'horta_regar', aba: 'quintal', hoje: true, texto: `Regar ${secas.length} cova(s) da horta (o barril enche o regador)`, alvo: _pontoCova(secas[0][0]), rotulo: 'Use o regador aqui' });
  if (vazias.length && semente) r.push({ id: 'horta_plantar', aba: 'quintal', texto: `${vazias.length} cova(s) vazia(s): plante ${Itens.nome(semente.id).toLowerCase()}`, alvo: _pontoCova(vazias[0][0]), rotulo: 'A semente na mão, botão direito na terra' });
  else if (!semente) r.push({ id: 'horta_sementes', aba: 'quintal', texto: `Sementes da estação (${daEstacao.map(id => Itens.nome(CULTURAS[id].semente)).join(', ')}): no depósito do Ananias, aba Sementes`, alvo: { mapa: 'vila', objeto: 'deposito' }, rotulo: 'Botão direito: comprar sementes (aba Sementes)' });
  r.push({ id: 'horta_espaco', aba: 'quintal', texto: 'A pá cava cova em qualquer grama limpa do quintal: quanto mais limpo, mais horta' });
  const q = MAPAS.quintal;
  if (q && Horta.plantadas() >= MINIMO_GALINHAS && covas.some(([k, c]) => { const [x, y] = k.split(',').map(Number); return c.planta && !Horta.protegida(q, x, y); }))
    r.push({ id: 'horta_cerca', aba: 'quintal', texto: 'Cerque a horta (cerca e portão do Tio Juca): as galinhas bicam a horta aberta' });
  return r;
});
// A carreira: a próxima função, a próxima ferramenta, as habilidades.
CADERNETA.push(() => {
  const r = [];
  if (G.obra && typeof Obra !== 'undefined') { const f = Obra.falta(); if (f) { const prox = FUNCOES[G.obra.funcao + 1], partes = [];
    if (f.obras) partes.push(`${f.obras} obra(s) do Bira`); if (f.alvenaria) partes.push(`Alvenaria +${f.alvenaria} nível(is)`); if (f.empreitas) partes.push(`${f.empreitas} serviço(s) do quadro`);
    r.push({ id: 'carreira_funcao', aba: 'carreira', texto: partes.length ? `Para ${prox}: ${faltaTxt(partes)}` : `${prox}: fale com o Mestre Bira!`, alvo: { mapa: 'vila', morador: 'bira' } }); } }
  if (typeof Ferreiro !== 'undefined' && G.ferreiro && !G.ferreiro.oficina) {
    const op = Ferreiro.FERRAMENTAS.map(id => [id, Ferreiro.custo(id)]).filter(([, c]) => c).sort((a, b) => a[1].dinheiro - b[1].dinheiro)[0];
    if (op) { const [id, c] = op, m = Object.keys(c).find(k => k !== 'dinheiro');
      r.push({ id: 'carreira_ferramenta', aba: 'carreira', texto: `${Itens.nome(id)} melhor no Seu Tonico: Cr$ ${c.dinheiro}` + (m ? ` e ${Itens.qtd(c[m], m)} (tem ${G.mochila.total(m)})` : ''),
        feito: m ? Math.min(G.mochila.total(m), c[m]) : undefined, meta: m ? c[m] : undefined, alvo: { mapa: 'vila', objeto: 'oficina' }, rotulo: 'Botão direito: a oficina do Seu Tonico' }); } }
  if (typeof Habilidades !== 'undefined') for (const h of Habilidades.LISTA) { const n = Habilidades.nivel(h); if (n >= 10) continue;
    r.push({ id: 'hab_' + h, aba: 'carreira', texto: `${NOMES_HAB[h]} nível ${n} → ${n + 1}: ${DICA_XP[h]}`, feito: Math.round(Habilidades.progresso(h) * 100), meta: 100 }); }
  return r;
});
// A Vila: o Grêmio (o pacote mais perto de pronto em cada ala aberta), o Bazar, o museu.
CADERNETA.push(() => {
  const r = [];
  if (typeof Gremio !== 'undefined' && G.gremio && Gremio.aberto()) for (const a of GREMIO_ALAS.filter(a => Gremio.alaAberta(a.id) && !Gremio.alaPronta(a.id))) {
    const pid = a.pacotes.filter(p => !Gremio.pronto(p)).sort((x, y) => Gremio.progresso(y) - Gremio.progresso(x))[0]; if (!pid) continue;
    const P = Gremio.pacote(pid), f = Gremio.falta(pid);
    r.push({ id: 'gremio_' + a.id, aba: 'vila', texto: `Grêmio, ${a.nome}: ${P.nome} (${faltaTxt(Object.entries(f).map(([id, n]) => id === 'dinheiro' ? 'Cr$ ' + n : Itens.qtd(n, id)))})`,
      feito: Math.round(Gremio.progresso(pid) * 100), meta: 100, alvo: { mapa: 'vila', objeto: 'gremio' }, rotulo: 'Botão direito: a lista do povo' });
  }
  const b = typeof Bazar !== 'undefined' && Bazar.meta();
  if (b) r.push({ id: 'vila_bazar', aba: 'vila', texto: `Bazar do Salim: ${b.nome} (Cr$ ${b.preco})`, feito: Math.min(G.dinheiro, b.preco), meta: b.preco, alvo: { mapa: 'vila', objeto: 'balcao_bazar' } });
  if (typeof MUSEU !== 'undefined' && G.mina && G.mina.museu) { const tot = MUSEU.ANTIGOS.length + MUSEU.RAROS.length, d = G.mina.museu.doados.length;
    if (d < tot) r.push({ id: 'vila_museu', aba: 'vila', texto: `Museu da Vila: ${d} de ${tot} doados (cave as marcas no chão; os raros vêm da pedreira e da praia)`, feito: d, meta: tot, alvo: { mapa: 'vila', objeto: 'museu' } }); }
  return r;
});
// A pensão: a próxima estrela e a melhoria ao alcance.
CADERNETA.push(() => {
  const p = G.pensao; if (!p || p.estado !== 'aberta') return [];
  const r = [], prox = p.proximoDegrau && p.proximoDegrau();
  if (prox) { const f = prox.falta, partes = []; if (f.curtidas) partes.push(`${f.curtidas} curtidas`); if (f.sabor) partes.push(`sabor +${f.sabor}`); if (f.pesquisadas) partes.push(`${f.pesquisadas} receita(s) pesquisada(s)`);
    r.push({ id: 'pensao_degrau', aba: 'pensao', texto: `Próxima estrela (${prox.nome}): ${partes.length ? faltaTxt(partes) : 'falta pouco'}`, feito: Math.round(p.progresso() * 100), meta: 100, alvo: { mapa: 'vila', objeto: 'pensao' } }); }
  if (typeof MELHORIAS !== 'undefined') { const m = Object.entries(MELHORIAS).filter(([id, x]) => !p.melhorias.includes(id) && p.grau() >= x.grau && !x.premio).sort((a, b) => a[1].preco - b[1].preco)[0];
    if (m) r.push({ id: 'pensao_melhoria', aba: 'pensao', texto: `Melhoria do salão ao alcance: ${m[1].nome} (Cr$ ${m[1].preco})`, feito: Math.min(G.dinheiro, m[1].preco), meta: m[1].preco, alvo: { mapa: 'vila', objeto: 'pensao' } }); }
  return r;
});
// A tela: as 5 abas; cada linha com a barrinha e o Mostrar (a seta leva até lá; de novo, tira a seta).
function abrirCaderneta(aba = Caderneta.aba || 'hoje') {
  const caixa = el('div', { class: 'painel caderneta' });
  const desenha = () => {
    caixa.innerHTML = ''; Caderneta.aba = aba;
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Caderneta do Jocelino'),
      el('div', { class: 'abas' }, CADERNETA_ABAS.map(([id, nome]) => el('div', { class: 'aba' + (id === aba ? ' ativa' : ''), onclick: e => { e.stopPropagation(); aba = id; desenha(); } }, nome))));
    const ls = Caderneta.linhas().filter(l => l.aba === aba);
    caixa.append(el('div', { class: 'cad-lista' }, ...(ls.length ? ls.map(l => el('div', { class: 'cad-linha' },
      el('div', { class: 'cad-texto' }, l.texto),
      l.meta ? el('div', { class: 'cad-barra' }, el('div', { style: `width:${Math.round(100 * Math.min(1, (l.feito || 0) / l.meta))}%` })) : el('div'),
      l.alvo ? el('button', { class: 'botao' + (G.setaFixa === l.id ? ' forte' : ''), onclick: e => { e.stopPropagation(); G.setaFixa = G.setaFixa === l.id ? null : l.id; desenha(); hudSujo(); } }, G.setaFixa === l.id ? 'Tirar a seta' : 'Mostrar') : null))
      : [el('div', { class: 'rodape' }, 'Nada por aqui ainda.')])),
      el('div', { class: 'rodape' }, 'Mostrar: a seta leva até lá. A tecla J abre e fecha a caderneta.'));
  };
  desenha(); abrirModal(caixa); sons.tocar('abrir', 1, 0.03, -6); return true;
}
INICIADORES.push(() => { G.setaFixa = null; });
// As ideias (o "Agora" do cartão da família): as linhas da caderneta com lugar — primeiro o que só dá hoje,
// depois o que está mais perto de pronto; o sorteio do dia desempata (fixo durante o dia).
Caderneta.ideias = function (n = 3) {
  const f = mulberry(G.dia * 104729), ls = Caderneta.linhas().filter(l => l.alvo).map(l => ({ l, k: (l.hoje ? 2 : 0) + (l.meta ? Math.min(1, (l.feito || 0) / l.meta) : 0) + f() * 0.05 }));
  return ls.sort((a, b) => b.k - a.k).slice(0, n).map(x => x.l);
};
