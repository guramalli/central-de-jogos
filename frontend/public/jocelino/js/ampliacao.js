// Jocelino — ampliacao.js — a ampliação da pensão (a reforma do restaurante do Dave, do jeito do Jocelino: é ele quem
// faz a obra). Cada etapa pede degrau, material na mochila, dinheiro e dias de trabalho: o Jocelino trabalha 1 dia por
// dia na fachada (gasta energia) e de manhã conta. A fachada na Vila mostra o andaime durante a obra.
//   salão maior: o balcão comprido, 8 banquetas;  varanda (com o alvará do Prefeito): +3 clientes, festas maiores;
//   sobrado: 2º andar com três quartos, hóspedes pagam toda manhã.

const AMPLIACOES = [
  { id: 'salao_maior', nome: 'Salão maior', grau: 3, material: { tijolo: 40, cimento: 10, madeira: 10 }, dinheiro: 400, dias: 3,
    efeito: 'O balcão comprido: 8 banquetas em vez de 6.' },
  { id: 'varanda', nome: 'Varanda coberta', grau: 4, alvara: true, material: { madeira: 30, telha: 20, tijolo: 20 }, dinheiro: 600, dias: 3,
    efeito: '3 clientes a mais por noite e festas com 2 convidados a mais.' },
  { id: 'sobrado', nome: 'Sobrado com quartos', grau: 5, antes: 'varanda', material: { tijolo: 80, cimento: 25, madeira: 30, telha: 30 }, dinheiro: 1500, dias: 5,
    efeito: 'Três quartos para hóspedes: eles pagam toda manhã.' },
];
const Ampliacao = {
  HOSPEDES: 3, DIARIA: 8, ENERGIA: 25,
  dados: id => AMPLIACOES.find(a => a.id === id),
  // O que impede a etapa (sem contar material e dinheiro): '' se pode.
  motivo(p, id) {
    const a = Ampliacao.dados(id);
    if (p.ampliacoes.includes(id)) return 'ja_tem';
    if (p.obra) return 'obra';
    if (p.grau() < a.grau) return 'degrau';
    if (a.alvara && !(p.premios || []).includes('varanda')) return 'alvara';
    if (a.antes && !p.ampliacoes.includes(a.antes)) return 'antes';
    return '';
  },
  // Começa a obra: 'ok' (gasta o material da mochila; o dinheiro o chamador desconta) ou o motivo.
  comecar(p, id, mochila, dinheiro) {
    const a = Ampliacao.dados(id);
    if (!a) return 'nao';
    const mot = Ampliacao.motivo(p, id);
    if (mot) return mot;
    for (const m in a.material) if (!mochila || mochila.total(m) < a.material[m]) return 'material';
    if (dinheiro < a.dinheiro) return 'dinheiro';
    for (const m in a.material) mochila.remover(m, a.material[m]);
    p.obra = { id, falta: a.dias, hoje: false };
    return 'ok';
  },
  // Um dia de trabalho na obra (no máximo um por dia).
  trabalhar(p) { if (!p.obra) return 'sem_obra'; if (p.obra.hoje) return 'ja_hoje'; p.obra.hoje = true; return 'ok'; },
  // De manhã: o dia trabalhado conta; terminou, a ampliação fica pronta (devolve o id).
  manha(p) {
    const o = p.obra;
    if (!o || !o.hoje) return '';
    o.hoje = false; o.falta--;
    if (o.falta > 0) return '';
    p.ampliacoes.push(o.id); p.obra = null;
    return o.id;
  },
  hospedes(p) { return p.ampliacoes.includes('sobrado') ? Ampliacao.HOSPEDES * Ampliacao.DIARIA : 0; },
};
const temAmpliacao = id => !!(G.pensao && (G.pensao.ampliacoes || []).includes(id));

// De manhã: a obra anda, a ampliação fica pronta, os hóspedes pagam.
MANHA.push(() => {
  const p = G.pensao;
  if (!p) return;
  const pronta = Ampliacao.manha(p);
  if (pronta) { G.feitosHoje.push(`A obra terminou: ${Ampliacao.dados(pronta).nome}! ${Ampliacao.dados(pronta).efeito}`); if (MAPAS.vila && typeof atualizarPensaoMundo === 'function') atualizarPensaoMundo(MAPAS.vila); }
  else if (p.obra) G.feitosHoje.push(`Obra da pensão: faltam ${p.obra.falta} ${p.obra.falta === 1 ? 'dia' : 'dias'} de trabalho (${Ampliacao.dados(p.obra.id).nome}).`);
  const h = Ampliacao.hospedes(p);
  if (h) { G.dinheiro += h; G.feitosHoje.push(`Os hóspedes do sobrado pagaram a diária: Cr$ ${h}.`); }
});
TAREFAS.push(() => {
  const p = G.pensao;
  return p && p.obra && !p.obra.hoje ? [{ texto: `Trabalhar na obra da pensão (${Ampliacao.dados(p.obra.id).nome}: faltam ${p.obra.falta} dias)` }] : [];
});

// ---------- a tela "Ampliar a pensão" (sai da tela A Pensão) ----------
function abrirAmpliacao() {
  const p = G.pensao, caixa = el('div', { class: 'painel ampliacao' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:28px' }, 'Ampliar a pensão'),
      el('div', { class: 'rodape', style: 'text-align:left;margin-bottom:8px' }, 'O Jocelino faz a obra: leve o material na mochila, pague a mão de obra e trabalhe um dia por dia na fachada (clique na pensão).'));
    if (p.obra) caixa.append(el('div', { class: 'amp-obra' }, `Obra em andamento: ${Ampliacao.dados(p.obra.id).nome}, faltam ${p.obra.falta} ${p.obra.falta === 1 ? 'dia' : 'dias'}${p.obra.hoje ? ' (hoje já trabalhou)' : ''}.`));
    for (const a of AMPLIACOES) {
      const tem = p.ampliacoes.includes(a.id), mat = Object.entries(a.material).map(([m, q]) => {
        const t = G.mochila ? G.mochila.total(m) : 0;
        return el('span', { class: 'amp-mat' + (t >= q ? '' : ' falta') }, el('img', { src: urlItem(m) }), `${t}/${q}`);
      });
      const motivo = tem ? '' : { degrau: `Precisa do degrau ${a.grau} ("${p.nomeGrau(a.grau)}").`, alvara: 'Precisa do alvará da varanda (presente do Seu Orlando, o Prefeito, quando for bem servido).',
        antes: a.antes ? `Primeiro a ${Ampliacao.dados(a.antes).nome.toLowerCase()}.` : '', obra: 'Uma obra por vez.' }[Ampliacao.motivo(p, a.id)] || '';
      caixa.append(el('div', { class: 'amp-item' + (tem ? ' tem' : '') },
        el('div', {}, el('b', {}, a.nome + (tem ? ' ✓' : '')), el('div', {}, a.efeito), tem ? null : el('div', { class: 'amp-custo' }, ...mat, el('span', {}, `Cr$ ${a.dinheiro} · ${a.dias} dias de obra`)),
          motivo ? el('div', { class: 'amp-motivo' }, motivo) : null),
        tem ? null : el('button', { class: 'botao forte' + (motivo ? ' desligado' : ''), onclick: e => { e.stopPropagation();
          const r = Ampliacao.comecar(p, a.id, G.mochila, G.dinheiro);
          if (r === 'ok') { G.dinheiro -= a.dinheiro; hudSujo(); sons.tocar('moedas', 1, 0.05, -4); avisar(`Obra começada: ${a.nome}! Trabalhe na fachada da pensão um dia por dia.`); if (MAPAS.vila) atualizarPensaoMundo(MAPAS.vila); desenha(); }
          else avisar({ material: 'Falta material na mochila.', dinheiro: 'Falta dinheiro.', degrau: 'A pensão ainda é pequena para isso.', alvara: 'Falta o alvará da varanda.', antes: 'Falta a etapa anterior.', obra: 'Já tem uma obra em andamento.' }[r] || 'Não deu.'); } }, 'Começar a obra')));
    }
    caixa.append(el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}
// Clique na fachada durante a obra: trabalhar (gasta energia) ou entrar.
function trabalharNaObra() {
  const p = G.pensao, r = Ampliacao.trabalhar(p);
  if (r === 'ja_hoje') { avisar('Hoje você já trabalhou na obra. Amanhã tem mais.'); return true; }
  if (r !== 'ok') return false;
  if (G.energia < Ampliacao.ENERGIA) { p.obra.hoje = false; avisar('Sem energia para a obra hoje. Descanse!'); return true; }
  G.energia -= Ampliacao.ENERGIA; G.minutos = Math.min(G.minutos + 120, 26 * 60); hudSujo();
  sons.tocar('pedra', 1, 0.05, -4);
  avisar(`Um dia de obra na pensão! Faltam ${p.obra.falta - 1 <= 0 ? 'só a manhã de amanhã' : (p.obra.falta - 1) + ' dias'} (${Ampliacao.dados(p.obra.id).nome}).`);
  return true;
}
