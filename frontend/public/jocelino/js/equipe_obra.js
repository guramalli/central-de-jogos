// Jocelino — equipe_obra.js — a equipe do mestre de obras (a E7 do Godot, equipe.gd): o Zé, o Severino, o Cícero e o
// Damião trabalham nas frentes que o Jocelino escolhe na prancheta; rendem meta/7 por hora × (1 no ofício, 0,55 fora)
// × (0,4 + 0,08 × humor). O humor sobe com conversa (+1 por dia) e comida (+2 por dia; a marmita da pensão +3), com o
// dia redondo (+1); frente errada tira 1. Com humor ≤ 2, metade das vezes o peão falta. Eventos em 15% dos dias.

const PEOES = [
  { id: 'ze', nome: 'Zé', oficio: 'Pedreiro', oficios: ['massa', 'tijolos', 'molhar'], x: 35, y: 4 },
  { id: 'severino', nome: 'Severino', oficio: 'Pedreiro antigo', oficios: ['tijolos', 'pedras', 'massa'], x: 33, y: 7 },
  { id: 'cicero', nome: 'Cícero', oficio: 'Carpinteiro e armador', oficios: ['ripas', 'telhas', 'pedras'], x: 38, y: 4 },
  { id: 'damiao', nome: 'Damião', oficio: 'Servente', oficios: ['entulho', 'areia', 'capinar', 'telhas'], x: 41, y: 7 },
];
const peao = id => PEOES.find(p => p.id === id);
const BONUS_REDONDO = 20, EVENTO_OBRA = 0.15;

const EquipeObra = {
  iniciar(s) {
    const e = s.equipeObra || {};
    G.equipeObra = { humor: Object.assign({ ze: 6, severino: 6, cicero: 6, damiao: 6 }, e.humor || {}), frente: Object.assign({}, e.frente || {}),
      faltou: (e.faltou || []).slice(), conversou: Object.assign({}, e.conversou || {}), comeu: Object.assign({}, e.comeu || {}), frac: Object.assign({}, e.frac || {}), dia: e.dia || 0 };
  },
  salvar(s) { s.equipeObra = JSON.parse(JSON.stringify(G.equipeObra)); },
  fator(id, tarefa) { return (peao(id).oficios.includes(tarefa) ? 1 : 0.55) * (0.4 + 0.08 * G.equipeObra.humor[id]); },
  presentes() { return PEOES.map(p => p.id).filter(id => !G.equipeObra.faltou.includes(id)); },
  // A manhã: quem falta (humor ≤ 2, 50%) e as frentes sugeridas (cada peão no seu ofício, se a lista pede).
  bomDia(dia, rng, metas = {}) {
    const q = G.equipeObra; q.dia = dia; q.conversou = {}; q.comeu = {}; q.frac = {};
    q.faltou = PEOES.map(p => p.id).filter(id => q.humor[id] <= 2 && rng.randf() < 0.5);
    const tarefas = Object.keys(metas).filter(t => t !== 'buscar_cimento' && t !== 'buscar_pedra');
    for (const p of PEOES) q.frente[p.id] = tarefas.find(t => p.oficios.includes(t)) || tarefas[0] || p.oficios[0];
    return { faltou: q.faltou.slice(), frentes: Object.assign({}, q.frente) };
  },
  // Troca a frente do peão para a próxima tarefa da lista.
  trocar(id, metas) {
    const ts = Object.keys(metas || {}).filter(t => t !== 'buscar_cimento' && t !== 'buscar_pedra');
    if (!ts.length) return G.equipeObra.frente[id];
    const i = ts.indexOf(G.equipeObra.frente[id]);
    return (G.equipeObra.frente[id] = ts[(i + 1) % ts.length]);
  },
  // Uma hora de trabalho: quanto cada presente rende na frente dele.
  hora(metas) {
    const r = {};
    for (const id of EquipeObra.presentes()) { const t = G.equipeObra.frente[id]; if (metas[t]) r[id] = metas[t] / 7 * EquipeObra.fator(id, t); }
    return r;
  },
  // Comida: uma vez por dia; a marmita da pensão vale +3 (a sustância), o resto +2.
  comer(id, item) {
    const q = G.equipeObra;
    if (!q.comeu[id]) { q.comeu[id] = true; q.humor[id] = Math.min(10, q.humor[id] + (item === 'marmita' ? 3 : 2)); }
    return q.humor[id];
  },
  conversar(id) { const q = G.equipeObra; if (!q.conversou[id]) { q.conversou[id] = true; q.humor[id] = Math.min(10, q.humor[id] + 1); } return q.humor[id]; },
  // O fim do dia: redondo +1 a todos; frente fora do ofício −1.
  fimDoDia(redondo, metas = {}) {
    const q = G.equipeObra;
    for (const p of PEOES) {
      if (q.faltou.includes(p.id)) continue;
      if (redondo) q.humor[p.id] = Math.min(10, q.humor[p.id] + 1);
      if (metas[q.frente[p.id]] && !p.oficios.includes(q.frente[p.id])) q.humor[p.id] = Math.max(0, q.humor[p.id] - 1);
    }
  },
  evento(dia, rng) {
    if (rng.randf() >= EVENTO_OBRA) return null;
    const q = G.equipeObra, k = Math.floor(rng.randf() * 4), ids = PEOES.map(p => p.id), quem = ids[Math.floor(rng.randf() * 4)];
    if (k === 0) { q.humor.damiao = Math.min(10, q.humor.damiao + 1); return { tipo: 'ensinar', texto: 'O Zé passou a manhã ensinando o Damião a assentar tijolo. O Damião ficou todo prosa.' }; }
    if (k === 1) { if (G.dinheiro < 40) return null; for (const id of ids) q.humor[id] = Math.min(10, q.humor[id] + 1); return { tipo: 'capacetes', custo: 40, texto: 'Chegaram capacetes novos para a turma (Cr$ 40). Segurança em primeiro lugar!' }; }
    if (k === 2) { const outro = ids[(ids.indexOf(quem) + 1) % 4]; q.humor[quem] = Math.max(0, q.humor[quem] - 2); q.humor[outro] = Math.max(0, q.humor[outro] - 2); return { tipo: 'briga', texto: `O ${peao(quem).nome} e o ${peao(outro).nome} brigaram por causa de uma colher. O clima azedou.` }; }
    if (G.dinheiro < 20) return null;
    q.humor[quem] = Math.min(10, q.humor[quem] + 2);
    return { tipo: 'aniversario', custo: 20, texto: `Aniversário do ${peao(quem).nome}! Teve bolo na hora do café (Cr$ 20).` };
  },
};
INICIADORES.push(s => EquipeObra.iniciar(s));
COLETORES.push(s => EquipeObra.salvar(s));

// ---------- no jogo (só para o mestre de obras) ----------
const ehMestre = () => G.obra && G.obra.funcao >= 3;
// De manhã o mestre já recebe a lista da etapa; a turma chega (ou falta) e vai para as frentes; às vezes um evento.
MANHA.push(() => {
  if (!ehMestre() || Obra.aberta(G.dia, 8 * 60) === 'domingo' || Obra.aberta(G.dia, 8 * 60) === 'chuva') return;
  G.obra.lista = Object.assign({ dia: G.dia, feito: {}, paga: false }, Obra.sortear(G.dia));
  const f = mulberry(G.dia * 613 + 9), rng = { randf: f }, r = EquipeObra.bomDia(G.dia, rng, G.obra.lista.metas);
  if (r.faltou.length) G.feitosHoje.push(`Faltou na obra: ${r.faltou.map(id => peao(id).nome).join(', ')} (andam de mau humor).`);
  const ev = EquipeObra.evento(G.dia, rng);
  if (ev) { if (ev.custo) { G.dinheiro -= ev.custo; G.gastoHoje += ev.custo; } G.feitosHoje.push(ev.texto); }
  if (MAPAS.vila) poePeoes(MAPAS.vila);
});
// De hora em hora (7h ao meio-dia): a turma rende na lista.
let _horaEquipe = -1;
ATUALIZADORES.push(() => {
  if (!ehMestre()) return;
  const l = G.obra.lista, h = Math.floor(G.minutos / 60);
  if (h === _horaEquipe) return;
  _horaEquipe = h;
  if (!l || l.dia !== G.dia || l.paga || l.fechado || h < 8 || h > 12 || Obra.aberta(G.dia, G.minutos - 1)) return;
  const q = G.equipeObra;
  for (const [id, n] of Object.entries(EquipeObra.hora(l.metas))) {
    const t = q.frente[id]; q.frac[t] = (q.frac[t] || 0) + n;
    const inteiro = Math.floor(q.frac[t]); if (inteiro > 0) { q.frac[t] -= inteiro; Obra.trabalho(t, inteiro); }
  }
});
NOITE.push(() => { if (ehMestre() && G.obra.lista && G.obra.lista.dia === G.dia) EquipeObra.fimDoDia(Obra.completa(), G.obra.lista.metas); });

// Os peões no canteiro (quem veio), cada um na frente dele; conversar +1 de humor; botão direito com comida dá a comida.
function poePeoes(b) {
  b.moradores = b.moradores.filter(m => !m.peao);
  if (!ehMestre()) return;
  const ze = b.moradores.find(m => m.id === 'ze');
  for (const p of PEOES) {
    if (G.equipeObra.faltou.includes(p.id)) { if (p.id === 'ze' && ze) ze.visivel = false; continue; }
    const m = p.id === 'ze' && ze ? ze : Object.assign(b.morador(p.id, p.nome, p.x, p.y, DIR.BAIXO), { peao: true });
    m.visivel = true;
    m.aoConversar = () => conversarPeao(p.id);
  }
}
function conversarPeao(id) {
  if (id === 'ze' && G.jog.carga && G.jog.carga.id === 'massa') return conversarZe();
  const comida = itemDaMao(), e = comida && Itens.energia(comida);
  if (e) { G.mochila.remover(comida, 1); EquipeObra.comer(id, comida); hudSujo(); sons.tocar('pegar', 0.8, 0.05, -6); avisar(`${peao(id).nome} comeu ${Itens.nome(comida).toLowerCase()}${comida === 'marmita' ? ' (a marmita da Rosa dá sustância!)' : ''}.`); return true; }
  const h = EquipeObra.conversar(id), p = peao(id);
  const fala = h >= 8 ? 'Hoje a obra rende, mestre!' : h >= 5 ? 'Tô firme, mestre. Bora.' : h >= 3 ? 'Tá puxado, mestre... um café cairia bem.' : 'Não tô bem não, mestre. Se continuar assim, amanhã nem venho.';
  abrirConversa(p.nome, urlArte('retratos/' + id + '_normal'), [`${fala} (frente: ${TAREFAS_OBRA[G.equipeObra.frente[id]] ? TAREFAS_OBRA[G.equipeObra.frente[id]].texto.toLowerCase() : '—'})`]);
  return true;
}
// A prancheta: cada peão com a frente, o humor e a barra da tarefa; clicar troca a frente.
function abrirPrancheta() {
  if (!ehMestre()) { abrirPlaca('A prancheta do Mestre Bira com a lista do dia.'); return true; }
  const caixa = el('div', { class: 'painel orelhao' });
  const desenha = () => {
    caixa.innerHTML = '';
    const l = G.obra.lista && G.obra.lista.dia === G.dia ? G.obra.lista : null;
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Prancheta do mestre'),
      el('div', { class: 'rodape', style: 'text-align:left;margin-bottom:8px' }, l ? `${Obra.obra().nome} — ${Obra.obra().etapas[G.obra.etapa].nome}. Clique num peão para trocar a frente dele. No ofício ele rende mais; de bom humor, mais ainda.` : 'Hoje não tem obra (domingo ou chuva).'));
    const grade = el('div', { class: 'orel-grade' });
    for (const p of PEOES) {
      const falta = G.equipeObra.faltou.includes(p.id), t = G.equipeObra.frente[p.id], h = G.equipeObra.humor[p.id];
      const prog = l && l.metas[t] ? `${Math.min(l.metas[t], l.feito[t] || 0)}/${l.metas[t]}` : '';
      grade.append(el('div', { class: 'orel-item' + (falta ? ' trancado' : ''), style: 'cursor:pointer', onclick: e => { e.stopPropagation(); if (falta || !l) return; EquipeObra.trocar(p.id, l.metas); sons.tocar('pagina', 1, 0.05, -8); desenha(); } },
        el('img', { src: urlArte('retratos/' + p.id + '_normal') }),
        el('div', {}, el('b', {}, `${p.nome} — ${p.oficio}`), el('div', { class: 'orel-preco' }, falta ? 'Faltou hoje.' : `Frente: ${TAREFAS_OBRA[t] ? TAREFAS_OBRA[t].texto : t}${p.oficios.includes(t) ? ' (do ofício)' : ''} ${prog}`),
          el('div', { class: 'orel-preco' }, 'Humor: ' + '●'.repeat(h) + '○'.repeat(10 - h)))));
    }
    caixa.append(grade, el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('pagina', 1, 0.05, -4);
  return true;
}
AO_MONTAR.push(b => { if (b.id === 'vila') { poePeoes(b); const pr = b.objs.find(o => o.id === 'prancheta_obra'); if (pr) pr.acao = () => abrirPrancheta(); } });
AO_ENTRAR_MAPA.push(id => { if (id === 'vila') poePeoes(G.mapa); });
