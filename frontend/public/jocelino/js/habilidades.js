// Jocelino — habilidades.js — as habilidades que sobem fazendo (as do Stardew; habilidades.gd do Godot): Fôlego,
// Alvenaria, Acabamento e Negócio, do nível 1 ao 10. Cada nível tira um pouco da energia gasta pela ferramenta ligada
// (Fôlego: machado, picareta, foice; Alvenaria: pá; Acabamento: regador) e o Negócio dá +1% no que se vende. Nos níveis
// 5 e 10 o jogador escolhe uma de duas vantagens (a do 10 sai do ramo escolhido no 5): 4 caminhos por habilidade.
// As vantagens da obra (diária, tijolos, aluguel...) ficam guardadas e passam a valer quando a obra chegar.

const NOMES_HAB = { folego: 'Fôlego', alvenaria: 'Alvenaria', acabamento: 'Acabamento', negocio: 'Negócio' };
const BONUS_NIVEL = { folego: 'machado, picareta e foice cansam menos', alvenaria: 'pá e alvenaria cansam menos', acabamento: 'regador e acabamento cansam menos', negocio: '+1% no que recebe e vende' };
const OPCOES_5 = { folego: ['braco_forte', 'pe_ligeiro'], alvenaria: ['mao_firme', 'olho_de_prumo'], acabamento: ['capricho', 'limpinho'], negocio: ['fregues', 'pechincha'] };
const OPCOES_10 = {
  braco_forte: ['incansavel', 'carregador'], pe_ligeiro: ['cafe_no_sangue', 'maratonista'], mao_firme: ['mestre_de_obras', 'empreiteiro'],
  olho_de_prumo: ['fama', 'prumo_de_ouro'], capricho: ['artista', 'pintor'], limpinho: ['organizado', 'faxineiro'], fregues: ['patrao', 'cliente_vip'], pechincha: ['labia', 'atravessador'],
};
const VANTAGENS = {
  braco_forte: ['Braço forte', 'Carrega 10 tijolos de uma vez.'], pe_ligeiro: ['Pé ligeiro', 'Anda 10% mais rápido.'],
  incansavel: ['Incansável', 'Se apagar às 2h, acorda com energia cheia.'], carregador: ['Carregador', 'Carrega 15 tijolos e 8 entulhos de uma vez.'],
  cafe_no_sangue: ['Café no sangue', 'Comida rende o dobro de energia.'], maratonista: ['Maratonista', 'Anda mais 10% (20% no total).'],
  mao_firme: ['Mão firme', 'Valas e alicerce em 3 ladrilhos por golpe.'], olho_de_prumo: ['Olho de prumo', '+Cr$ 5 na diária.'],
  mestre_de_obras: ['Mestre de obras', 'A casa da família pede 20% menos material.'], empreiteiro: ['Empreiteiro', 'Cavar e assentar não gastam energia.'],
  fama: ['Fama', 'Os extras pagam o dobro.'], prumo_de_ouro: ['Prumo de ouro', '+Cr$ 10 na diária (Cr$ 15 no total).'],
  capricho: ['Capricho', 'Molhar e pintar 3 ladrilhos por vez.'], limpinho: ['Limpinho', 'Entulho dá ferro velho mais vezes.'],
  artista: ['Artista', 'Obra terminada dá Cr$ 50 de gorjeta.'], pintor: ['Pintor de mão cheia', 'Molhar e pintar 5 ladrilhos por vez.'],
  organizado: ['Organizado', 'Carregar coisas na obra conta em dobro.'], faxineiro: ['Faxineiro', 'Limpar mato, galho e entulho dá experiência em dobro.'],
  fregues: ['Freguês', '10% de desconto no Ananias e no Tonico.'], pechincha: ['Pechincha', 'Vende 25% mais caro.'],
  patrao: ['Patrão', 'Aluguel rende 50% a mais.'], cliente_vip: ['Cliente VIP', 'Mais 10% de desconto (20% no total).'],
  labia: ['Lábia', 'Amizade sobe 50% mais rápido.'], atravessador: ['Atravessador', 'Vende 50% mais caro (em vez de 25%).'],
};
// As que já valem nesta etapa (as outras esperam a obra, a casa e os aluguéis).
const VALE_AGORA = ['pe_ligeiro', 'maratonista', 'incansavel', 'cafe_no_sangue', 'faxineiro', 'pechincha', 'atravessador', 'fregues', 'cliente_vip'];
const FERRAMENTA_HAB = { machado: 'folego', picareta: 'folego', foice: 'folego', vara: 'folego', pa: 'alvenaria', colher: 'alvenaria', regador: 'acabamento' };

const Habilidades = {
  LISTA: ['folego', 'alvenaria', 'acabamento', 'negocio'],
  NIVEIS: [100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000],
  iniciar(s) {
    const h = s.hab || {};
    G.hab = { xp: Object.assign({ folego: 0, alvenaria: 0, acabamento: 0, negocio: 0 }, h.xp || {}), vantagens: (h.vantagens || []).slice(),
      pendentes: (h.pendentes || []).map(p => p.slice()), subiuHoje: [] };
  },
  nivel(h) { const x = (G.hab && G.hab.xp[h]) || 0; let n = 0; while (n < 10 && x >= Habilidades.NIVEIS[n]) n++; return n; },
  // Fração do caminho até o próximo nível (0 a 1).
  progresso(h) { const n = Habilidades.nivel(h); if (n >= 10) return 1; const ini = n ? Habilidades.NIVEIS[n - 1] : 0; return (G.hab.xp[h] - ini) / (Habilidades.NIVEIS[n] - ini); },
  // Soma experiência; devolve o nível novo (ou 0 se não subiu). Os níveis 5 e 10 deixam a escolha da vantagem pendente.
  ganhar(h, xp) {
    if (!G.hab || !(h in G.hab.xp) || xp <= 0) return 0;
    const n0 = Habilidades.nivel(h);
    G.hab.xp[h] += xp;
    const n1 = Habilidades.nivel(h);
    for (let n = n0 + 1; n <= n1; n++) { G.hab.subiuHoje.push([h, n]); if (n === 5 || n === 10) G.hab.pendentes.push([h, n]); }
    if (n1 > n0 && G.comecou) { avisar(`${NOMES_HAB[h]} subiu para o nível ${n1}!`); sons.tocar('fanfarra', 1.2, 0, -8); }
    return n1 > n0 ? n1 : 0;
  },
  // Energia do golpe: cada nível da habilidade da ferramenta tira 0,1 × base/2 (custo 2 vira 1 no nível 10).
  custo(ferr) { const h = FERRAMENTA_HAB[ferr]; return h ? Math.max(0.5, CUSTO_GOLPE - 0.1 * Habilidades.nivel(h) * CUSTO_GOLPE / 2) : CUSTO_GOLPE; },
  bonusVenda() { return (1 + 0.01 * Habilidades.nivel('negocio')) * (Habilidades.tem('atravessador') ? 1.5 : Habilidades.tem('pechincha') ? 1.25 : 1); },
  desconto() { return Habilidades.tem('cliente_vip') ? 0.8 : Habilidades.tem('fregues') ? 0.9 : 1; },
  velocidade() { return Habilidades.tem('maratonista') ? 1.2 : Habilidades.tem('pe_ligeiro') ? 1.1 : 1; },
  tem(v) { return !!G.hab && G.hab.vantagens.includes(v); },
  opcoes() {
    return G.hab.pendentes.map(([h, n]) => ({ h, nivel: n,
      ids: n === 5 ? OPCOES_5[h] : OPCOES_10[OPCOES_5[h].find(v => Habilidades.tem(v)) || OPCOES_5[h][0]] }));
  },
  escolher(h, n, id) {
    const o = Habilidades.opcoes().find(x => x.h === h && x.nivel === n);
    if (!o || !o.ids.includes(id)) return false;
    G.hab.vantagens.push(id);
    G.hab.pendentes = G.hab.pendentes.filter(p => !(p[0] === h && p[1] === n));
    return true;
  },
};
INICIADORES.push(s => Habilidades.iniciar(s));
COLETORES.push(s => { s.hab = { xp: Object.assign({}, G.hab.xp), vantagens: G.hab.vantagens.slice(), pendentes: G.hab.pendentes.map(p => p.slice()) }; });
NOITE.push(linhas => { for (const [h, n] of G.hab.subiuHoje) linhas.push(`${NOMES_HAB[h]} subiu para o nível ${n}.`); G.hab.subiuHoje = []; });

// Depois do resumo da noite (dormindo ou desmaiado): as vantagens pendentes, uma por vez.
function escolherVantagens() {
  const o = Habilidades.opcoes()[0];
  if (!o) return;
  perguntar(`Nível ${o.nivel} de ${NOMES_HAB[o.h]}! Escolha uma vantagem:`, o.ids.map(id => `${VANTAGENS[id][0]}: ${VANTAGENS[id][1]}`), i => {
    Habilidades.escolher(o.h, o.nivel, o.ids[i]);
    avisar(`Vantagem nova: ${VANTAGENS[o.ids[i]][0]}.`);
    setTimeout(escolherVantagens, 50);
  });
}

// ---------- a tela das habilidades (H) ----------
function abrirHabilidades() {
  const caixa = el('div', { class: 'painel habilidades' }, el('div', { class: 'titulo', style: 'font-size:28px' }, 'Habilidades do Jocelino'));
  for (const h of Habilidades.LISTA) {
    const n = Habilidades.nivel(h), van = G.hab.vantagens.filter(v => OPCOES_5[h].includes(v) || OPCOES_5[h].some(p => (OPCOES_10[p] || []).includes(v)));
    caixa.append(el('div', { class: 'hab-linha' }, el('img', { src: urlItem('hab_' + h) }),
      el('div', {}, el('b', {}, `${NOMES_HAB[h]} · nível ${n}`),
        el('div', { class: 'hab-barra' }, el('div', { style: `width:${Math.round(Habilidades.progresso(h) * 100)}%` })),
        el('div', { class: 'eq-hab' }, `Cada nível: ${BONUS_NIVEL[h]}.`),
        ...van.map(v => el('div', { class: 'eq-hab' }, `★ ${VANTAGENS[v][0]}: ${VANTAGENS[v][1]}${VALE_AGORA.includes(v) ? '' : ' (vale quando a obra chegar)'}`)))));
  }
  caixa.append(el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  abrirModal(caixa);
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}
