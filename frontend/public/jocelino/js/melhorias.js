// Jocelino — melhorias.js — as melhorias do salão (o Interior e as reformas do Bancho, do nosso jeito): compradas com
// dinheiro, cada uma pede um degrau de fama, aparece no palco (arte a/salao/*) e muda a regra da janta: paciência,
// tempo de preparo, bocas do fogão, tamanho da farinheira, banquetas, clientes, gorjeta e a cerveja da geladeira.

const MELHORIAS = {
  toalha: { nome: 'Toalha xadrez no balcão', preco: 60, grau: 1, efeito: 'Charme: mais gorjeta.', arte: 'salao/toalha_balcao', gorjeta: 0.03 },
  flamula: { nome: 'Flâmula do Santos', preco: 40, grau: 1, efeito: 'Os peões torcem junto: um pouco mais de gorjeta.', arte: 'salao/flamula_santos', gorjeta: 0.02 },
  radio: { nome: 'Rádio tocando samba', preco: 90, grau: 1, efeito: 'Clima bom: mais gorjeta.', arte: 'salao/radio_tocando', gorjeta: 0.05 },
  farinheira_grande: { nome: 'Farinheira grande', preco: 150, grau: 2, efeito: 'Cabem 25 de farinha (repõe menos).', arte: 'salao/farinheira_grande', farinha: 10 },
  ventilador: { nome: 'Ventilador de teto', preco: 180, grau: 2, efeito: 'Ninguém derrete: a paciência dura 25% mais.', arte: 'salao/ventilador_teto', paciencia: 1.25 },
  banqueta_extra: { nome: 'Banqueta a mais', preco: 120, grau: 2, efeito: 'Mais um lugar no balcão.', arte: '', mesas: 1 },
  bandeirinhas: { nome: 'Bandeirinhas e balão', preco: 80, grau: 2, efeito: 'Clima de festa: 1 cliente a mais por noite.', arte: 'salao/bandeirinhas_festa', clientes: 1 },
  fogao_4bocas: { nome: 'Fogão de 4 bocas', preco: 300, grau: 3, efeito: 'A Rosa cozinha 3 pratos de uma vez e 25% mais rápido.', arte: 'salao/cozinha_melhor', bocas: 1, preparo: 0.75 },
  geladeira: { nome: 'Geladeira', preco: 400, grau: 3, efeito: 'Libera a cerveja gelada (bebida mais cara).', arte: 'salao/geladeira' },
  neon: { nome: 'Neon da panela', preco: 250, grau: 3, efeito: 'A pensão aparece de longe: 2 clientes a mais por noite.', arte: 'salao/neon_novo', clientes: 2 },
};
const Melhorias = {
  comprar(p, id, dinheiro) {
    const m = MELHORIAS[id];
    if (!m) return 'nao';
    if (p.melhorias.includes(id)) return 'ja_tem';
    if (p.grau() < m.grau) return 'degrau';
    if (id === 'banqueta_extra' && p.mesasDaNoite() >= TurnoJanta.MAX_MESAS) return 'max';
    if (dinheiro < m.preco) return 'dinheiro';
    p.melhorias.push(id);
    if (m.mesas) p.extraMesas = (p.extraMesas || 0) + m.mesas;
    return 'ok';
  },
};
const temMelhoria = id => !!(G.pensao && G.pensao.melhorias.includes(id));
// O efeito somado das melhorias da pensão.
function bonusMelhorias(p) {
  const b = { preparo: 1, bocas: 0, gorjeta: 0, paciencia: 1, farinha: 0, clientes: 0 };
  for (const id of p.melhorias || []) {
    const m = MELHORIAS[id];
    if (!m) continue;
    if (m.preparo) b.preparo *= m.preparo; if (m.bocas) b.bocas += m.bocas; if (m.gorjeta) b.gorjeta += m.gorjeta;
    if (m.paciencia) b.paciencia *= m.paciencia; if (m.farinha) b.farinha += m.farinha; if (m.clientes) b.clientes += m.clientes;
  }
  return b;
}
// As bebidas que a pensão serve (a cerveja só com a geladeira).
Pratos.BEBIDAS.cerveja = Pratos.BEBIDAS.cerveja || 'Cerveja gelada';
function bebidasDaPensao(p) { return Object.keys(Pratos.BEBIDAS).filter(b => b !== 'cerveja' || (p.melhorias || []).includes('geladeira')); }

// ---------- no palco: a arte das melhorias compradas ----------
function camadasMelhorias() {
  const P = PALCO, cam = (y, f) => ({ tipo: 'camada', y, desenha: f }), img = n => spr(n);
  const r = [];
  if (temMelhoria('bandeirinhas') || (G.turno && G.turno.festa)) r.push(cam(2, ctx => { const a = img('salao/bandeirinhas_festa'), b = img('salao/balao_junino'); if (a) ctx.drawImage(a, 0, 185); if (b) { ctx.drawImage(b, 679, 262 + Math.sin(G.agora * 1.3) * 3); ctx.drawImage(b, 1440, 262 + Math.sin(G.agora * 1.1 + 1) * 3); } }));
  if (temMelhoria('neon')) r.push(cam(3, ctx => { const a = img('salao/neon_novo'); if (!a) return; const pisca = (G.agora % 7) < 0.08 ? 0.3 : 0.88 + Math.sin(G.agora * 9) * 0.06; ctx.save(); ctx.globalAlpha = pisca; ctx.drawImage(a, 463, 296); ctx.restore(); }));
  if (temMelhoria('flamula')) r.push(cam(4, ctx => { const a = img('salao/flamula_santos'); if (a) ctx.drawImage(a, 1206, 392, a.naturalWidth * 0.8, a.naturalHeight * 0.8); }));
  if (temMelhoria('radio')) r.push(cam(5, ctx => { const a = img('salao/radio_tocando'); if (!a) return; const q = Math.floor(G.agora * 3) % 2; ctx.drawImage(a, q * 96, 0, 96, 96, 700, 343, 96, 96); }));
  if (temMelhoria('ventilador')) r.push(cam(6, ctx => { const a = img('salao/ventilador_teto'); if (!a) return; const q = Math.floor(G.agora * 12) % 4; ctx.drawImage(a, q * 151, 0, 151, 104, 1175, 298, 151, 104); }));
  if (temMelhoria('geladeira')) r.push(cam(690, ctx => { const a = img('salao/geladeira'); if (a) ctx.drawImage(a, 290, 585); }));
  if (temMelhoria('toalha')) r.push(cam(P.TAMPO_Y + 80.5, ctx => { const a = img('salao/toalha_balcao'); if (a) ctx.drawImage(a, 282, 790); }));
  return r;
}

// ---------- a loja de melhorias (botão "Melhorias" do rodapé) ----------
function abrirMelhorias() {
  const p = G.pensao;
  const caixa = el('div', { class: 'painel melhorias' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:28px' }, 'Melhorias da Pensão'), el('div', { class: 'eq-vagas' }, `Cr$ ${G.dinheiro} · degrau: ${p.nomeGrau(p.grau())}`));
    const g = el('div', { class: 'mel-grade' });
    for (const [id, m] of Object.entries(MELHORIAS)) {
      const tem = p.melhorias.includes(id), tranca = p.grau() < m.grau;
      const ic = m.arte && spr(m.arte) ? el('div', { class: 'mel-arte', style: `background-image:url(a/${m.arte}.webp)` }) : el('div', { class: 'mel-arte vazio' }, '+1');
      g.append(el('div', { class: 'mel-item' + (tem ? ' tem' : tranca ? ' trancado' : '') }, ic,
        el('div', {}, el('b', {}, m.nome), el('div', { class: 'eq-at' }, m.efeito), el('div', { class: 'eq-hab' }, tem ? '✓ Na pensão' : tranca ? `🔒 Pede "${p.nomeGrau(m.grau)}"` : `Cr$ ${m.preco}`)),
        tem || tranca ? null : el('button', { class: 'botao forte' + (G.dinheiro >= m.preco ? '' : ' desligado'), onclick: e => { e.stopPropagation();
          const r = Melhorias.comprar(p, id, G.dinheiro);
          if (r === 'ok') { G.dinheiro -= m.preco; sons.tocar('carimbo', 0.9, 0.05, -4); sons.tocar('rosa_animada', 1, 0.05, -6); avisar(`${m.nome}: instalado!`); hudSujo(); desenha(); }
          else avisar(r === 'dinheiro' ? `Custa Cr$ ${m.preco}.` : r === 'max' ? 'O balcão já está com todas as banquetas que cabem.' : 'Ainda não dá.'); } }, 'Comprar')));
    }
    caixa.append(g, el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}
