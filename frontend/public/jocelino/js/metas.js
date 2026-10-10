// Jocelino — metas.js — a Caderneta de Metas da Rosa (o "To Do" do Dave, do nosso jeito): sempre 3 metas ativas, as
// primeiras puxadas do que falta para o próximo degrau da fama (curtidas, sabor, receitas), as outras da noite (servir,
// bebida na medida, nota) e de investimento (caprichar, contratar, melhoria). Cada meta tem recompensa; cumpriu, paga
// uma vez e outra entra no lugar. Regras puras (testadas na s1); a tela e o quadro do HUD ficam no fim do arquivo.

const Metas = {
  _n: 0,
  // Nota da noite (1 a 5): média das estrelas de quem comeu.
  notaDaNoite(r) { return r && r.servidos ? clamp(Math.round(r.estrelas / r.servidos), 1, 5) : 1; },
  // As candidatas a meta agora (sem as que já estão ativas).
  _candidatas(p, rng) {
    const c = [], prox = p.proximoDegrau ? p.proximoDegrau() : null, ativas = p.metas.filter(m => !m.feita);
    const tem = (tipo, extra = {}) => ativas.some(m => m.tipo === tipo && Object.keys(extra).every(k => m[k] === extra[k]));
    if (prox && prox.falta.curtidas > 0 && !tem('curtidas')) c.push({ tipo: 'curtidas', alvo: prox.d.curtidas, texto: `Junte ${prox.d.curtidas} curtidas (para "${prox.nome}")`, prio: 3 });
    if (prox && prox.falta.sabor > 0) {
      const melhor = p.receitas.slice().sort((a, b) => p.nivel(b) - p.nivel(a))[0], alvo = Math.ceil(prox.d.sabor / Pensao.SABOR_POR_NIVEL);
      if (!tem('nivel_prato')) c.push({ tipo: 'nivel_prato', prato: melhor, alvo, texto: `Leve ${Pratos.PRATOS[melhor].nome} ao nível ${alvo} (caprichar no caderno)`, prio: 3 });
    }
    if (prox && prox.falta.pesquisadas > 0 && !tem('pesquisar')) c.push({ tipo: 'pesquisar', alvo: prox.d.pesquisadas, texto: `Tenha ${prox.d.pesquisadas} receitas pesquisadas no caderno`, prio: 3 });
    const cl = Math.max(3, Math.round((p.clientesDaNoite ? p.clientesDaNoite() : 6) * 0.7));
    if (!tem('servir_clientes')) c.push({ tipo: 'servir_clientes', alvo: cl, texto: `Sirva ${cl} pratos numa noite só`, prio: 1 });
    if (!tem('servir_bebida_medida')) c.push({ tipo: 'servir_bebida_medida', alvo: 3, texto: 'Sirva 3 bebidas na medida numa noite', prio: 1 });
    if (!tem('nota_noite')) c.push({ tipo: 'nota_noite', alvo: 4, texto: 'Feche uma noite com nota 4 ou mais', prio: 1 });
    if (!tem('caprichar')) { const soma = p.receitas.reduce((n, id) => n + p.nivel(id), 0); c.push({ tipo: 'caprichar', alvo: soma + 1, texto: 'Caprichar em qualquer prato (+1 nível)', prio: 1 }); }
    if (typeof Equipe !== 'undefined' && ['salao', 'cozinha', 'compras'].some(k => Equipe.vagasLivres(p, k) > 0) && !tem('contratar')) c.push({ tipo: 'contratar', alvo: p.equipe.length + 1, texto: 'Contrate um ajudante (tela Equipe)', prio: 2 });
    if (typeof MELHORIAS !== 'undefined' && !tem('melhoria')) {
      const m = Object.entries(MELHORIAS).filter(([id, x]) => !p.melhorias.includes(id) && p.grau() >= x.grau && !x.premio && !(id === 'banqueta_extra' && p.mesasDaNoite() >= p.maxMesas())).sort((a, b) => a[1].preco - b[1].preco)[0];
      if (m) c.push({ tipo: 'melhoria', melhoria: m[0], alvo: 1, texto: `Compre a melhoria "${m[1].nome}" (Cr$ ${m[1].preco})`, prio: 2 });
    }
    return c;
  },
  // Completa até ECO.metasAtivas metas ativas: primeiro as do degrau, depois sorteia entre as outras.
  gerar(p, dia, rng) {
    p.metas = (p.metas || []).filter(m => !m.feita || m.dia === dia).slice(-12);
    while (p.metas.filter(m => !m.feita).length < ECO.metasAtivas) {
      const cs = this._candidatas(p, rng);
      if (!cs.length) break;
      const top = Math.max(...cs.map(x => x.prio)), ops = cs.filter(x => x.prio === top);
      const m = ops[rng.randi() % ops.length];
      p.metas.push(Object.assign(m, { id: 'm' + dia + '_' + (++this._n), atual: 0, feita: false, premio: Object.assign({}, ECO.metas[m.tipo]) }));
      delete m.prio;
      if (!['servir_clientes', 'servir_bebida_medida', 'nota_noite'].includes(m.tipo)) m.atual = this._progresso(p, m, null);   // já nasce com o progresso de hoje
    }
    return p.metas;
  },
  // Progresso atual de uma meta. rel = o relatório da noite (para as metas de noite), ou null.
  _progresso(p, m, rel) {
    switch (m.tipo) {
      case 'curtidas': return p.curtidas;
      case 'nivel_prato': return p.nivel(m.prato);
      case 'pesquisar': return p.pesquisadas();
      case 'caprichar': return p.receitas.reduce((n, id) => n + p.nivel(id), 0);
      case 'contratar': return p.equipe.length;
      case 'melhoria': return p.melhorias.includes(m.melhoria) ? 1 : 0;
      case 'servir_clientes': return rel ? rel.servidos || 0 : m.atual;
      case 'servir_bebida_medida': return rel ? rel.medida || 0 : m.atual;
      case 'nota_noite': return rel && rel.servidos ? Metas.notaDaNoite(rel) : m.atual;
    }
    return m.atual;
  },
  // Confere as metas; devolve as que acabaram de ser cumpridas (cada uma só uma vez).
  conferir(p, rel) {
    const feitas = [];
    for (const m of p.metas || []) {
      if (m.feita) continue;
      m.atual = Math.max(m.atual || 0, this._progresso(p, m, rel));
      if (m.atual >= m.alvo) { m.feita = true; feitas.push(m); }
    }
    return feitas;
  },
  // Paga a recompensa de uma meta cumprida.
  pagar(p, m) {
    const r = m.premio || {};
    if (r.dinheiro) G.dinheiro += r.dinheiro;
    if (r.pitadas) p.pitadas += r.pitadas;
    if (r.curtidas) p.curtidas += r.curtidas;
  },
  textoPremio(m) { const r = m.premio || {}, t = []; if (r.dinheiro) t.push(`Cr$ ${r.dinheiro}`); if (r.pitadas) t.push(`${r.pitadas} pitada${r.pitadas > 1 ? 's' : ''}`); if (r.curtidas) t.push(`${r.curtidas} curtidas`); return t.join(' + ') || '—'; },
};

// O efeito de caprichar, antes e depois (para o caderno e as metas).
function efeitoCaprichar(p, prato) {
  const n = p.nivel(prato), antes = { preco: p.preco(prato, 1), sabor: p.sabor(prato) };
  p.niveis[prato] = n + 1;
  const depois = { preco: p.preco(prato, 1), sabor: p.sabor(prato) };
  if (n === 1) delete p.niveis[prato]; else p.niveis[prato] = n;
  return { preco: [antes.preco, depois.preco], sabor: [antes.sabor, depois.sabor] };
}

// ---------- no jogo: gerar de manhã e quando faltar, conferir sempre, pagar com aviso ----------
function metasPagas(feitas) {
  for (const m of feitas) { Metas.pagar(G.pensao, m); avisar(`Meta cumprida: ${m.texto}! Ganhou ${Metas.textoPremio(m)}.`); sons.tocar('carimbo', 1.1, 0.05, -4); }
  if (feitas.length) { hudSujo(); const f = mulberry(G.dia * 97 + G.minutos), rng = { randf: f, randi: () => Math.floor(f() * 4294967296) }; Metas.gerar(G.pensao, G.dia, rng); }
}
MANHA.push(() => {
  const p = G.pensao;
  if (!p || p.estado !== 'aberta') return;
  const f = mulberry(G.dia * 131), rng = { randf: f, randi: () => Math.floor(f() * 4294967296) };
  Metas.gerar(p, G.dia, rng);
});
let _metasT = 0;
ATUALIZADORES.push(dt => {
  const p = G.pensao;
  if (!p || p.estado !== 'aberta') return;
  _metasT -= dt;
  if (_metasT > 0) return;
  _metasT = 0.7;
  if (!p.metas.filter(m => !m.feita).length) { const f = mulberry(G.dia * 131 + 7), rng = { randf: f, randi: () => Math.floor(f() * 4294967296) }; Metas.gerar(p, G.dia, rng); hudSujo(); }
  // As metas de estado (curtidas, nível, receitas, equipe, melhoria) conferem a qualquer hora; as de noite, no fechamento.
  const so = p.metas.filter(m => !m.feita && !['servir_clientes', 'servir_bebida_medida', 'nota_noite'].includes(m.tipo));
  if (!so.length) return;
  const feitas = []; for (const m of so) { m.atual = Math.max(m.atual || 0, Metas._progresso(p, m, null)); if (m.atual >= m.alvo) { m.feita = true; feitas.push(m); } }
  metasPagas(feitas);
});
TAREFAS.push(() => {
  const p = G.pensao;
  if (!p || p.estado !== 'aberta' || !p.metas) return [];
  return p.metas.filter(m => !m.feita).map(m => ({ texto: '★ ' + m.texto, feito: Math.min(m.atual || 0, m.alvo), meta: m.alvo }));
});
// A tela da Caderneta de Metas.
function abrirMetas() {
  const p = G.pensao;
  const caixa = el('div', { class: 'painel metas' }, el('div', { class: 'titulo', style: 'font-size:28px' }, 'Caderneta de Metas da Rosa'),
    el('div', { class: 'eq-vagas' }, 'Cumpra as metas para ganhar prêmios e subir a pensão. Quando uma termina, outra entra no lugar.'));
  for (const m of (p.metas || []).filter(x => !x.feita)) {
    const f = clamp((m.atual || 0) / m.alvo, 0, 1);
    caixa.append(el('div', { class: 'meta' }, el('div', { class: 'meta-texto' }, m.texto),
      el('div', { class: 'meta-barra' }, el('div', { style: `width:${f * 100}%` })),
      el('div', { class: 'meta-pe' }, `${Math.min(m.atual || 0, m.alvo)} / ${m.alvo}`, el('span', {}, 'Prêmio: ' + Metas.textoPremio(m)))));
  }
  const feitas = (p.metas || []).filter(x => x.feita).slice(-4);
  if (feitas.length) caixa.append(el('div', { class: 'cad-sub' }, 'Cumpridas'), ...feitas.map(m => el('div', { class: 'meta feita' }, '✓ ' + m.texto)));
  caixa.append(el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  abrirModal(caixa);
  sons.tocar('pagina', 1, 0.05, -6);
  return true;
}
