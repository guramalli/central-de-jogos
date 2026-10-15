// Jocelino — mina.js — a pedreira funda (a mina do Stardew; pedreira.gd e forja.gd do Godot), as regras: 30 bancadas
// sorteadas pelo dia e pela profundidade, a escada escondida nas rochas, o elevador de 5 em 5, os perigos leves, os baús
// das bancadas 10, 20 e 30; e, nas entregas seguintes, a forja, a betoneira, o museu, as marcas e as encomendas.

const MINA = { FUNDO: 30, PEDRA_SOLTA: 0.03, ESCURO: 10, AR_RUIM: 20 };
const BAUS_MINA = ECO.mina.baus;
// O que as rochas fundas soltam (a rocha comum e a de ferro já soltam pedra e ferro velho); a 2ª unidade é sorteada no jogo.
Object.assign(DETRITOS.aco, { solta: { sucata_aco: 1 } }); Object.assign(DETRITOS.bronze, { solta: { bronze_velho: 1 } });
Object.assign(DETRITOS.pigmento, { solta: { pigmento: 1 } });
ITENS.pedra_pigmento = ITENS.pedra_pigmento || { nome: 'Pedra de pigmento', pilha: 99, ferramenta: false, descricao: 'Pedra colorida e rara das bancadas. O Museu da Vila gosta.' }; Object.assign(DETRITOS.cristal, { solta: { cristal: 1 } });

Object.assign(ITENS, { lampiao: { nome: 'Lampião', pilha: 1, ferramenta: false, descricao: 'Do Seu Tonico. Na mochila, clareia as bancadas escuras da pedreira.' } });
ITENS.irrigador_bom = { nome: 'Irrigador bom', pilha: 9, ferramenta: false, colocavel: true, descricao: 'Do Seu Tonico. No quintal, rega as 8 covas em volta toda manhã.' };

const Mina = {
  iniciar(s) {
    const m = s.mina || {}, c = x => JSON.parse(JSON.stringify(x));
    G.mina = { aberta: !!m.aberta, elevador: m.elevador || 0, maisFunda: m.maisFunda || 0, baus: (m.baus || []).slice(),
      forjas: c(m.forjas || {}), betoneiras: c(m.betoneiras || {}), marcas: c(m.marcas || { dia: 0, pos: {}, cavadas: [] }),
      museu: { doados: ((m.museu || {}).doados || []).slice(), marcos: ((m.museu || {}).marcos || []).slice() }, encomendas: c(m.encomendas || []), bancada: 0 };
  },
  salvar(s) { s.mina = JSON.parse(JSON.stringify(G.mina)); delete s.mina.bancada; },
  tabela(n) { const t = [['ferro', 0.10], ['pigmento', 0.05], ['cristal', 0.01]]; if (n >= 10) t.push(['aco', 0.08]); if (n >= 20) t.push(['bronze', 0.07]); return t; },
  gerar(n, dia) {
    const f = mulberry(n * 7919 + dia * 104729), quantas = 18 + Math.floor(f() * 14), usados = new Set(), r = [];
    for (let k = 0; k < 400 && r.length < quantas; k++) {
      const x = 2 + Math.floor(f() * 18), y = 3 + Math.floor(f() * 10), chave = x + ',' + y;
      if (usados.has(chave) || (x <= 4 && y <= 4)) continue;
      usados.add(chave);
      let tipo = 'rocha', s = f();
      for (const [t, p] of Mina.tabela(n)) { if (s < p) { tipo = t; break; } s -= p; }
      r.push({ x, y, tipo });
    }
    return r;
  },
  // (15/10, T4) o Olho de pedreira (Fôlego 6): a escada escondida aparece 50% mais
  chanceEscada(restantes) { return Math.min(1, (0.02 + 1 / Math.max(1, restantes)) * (typeof Habilidades !== 'undefined' && Habilidades.ganho('olho_de_pedreira') ? ECO.niveis.olhoDePedreira : 1)); },
  chegou(n) { G.mina.maisFunda = Math.max(G.mina.maisFunda, n); if (n % 5 === 0) G.mina.elevador = Math.max(G.mina.elevador, n); },
  bau(n) { return BAUS_MINA[n] && !G.mina.baus.includes(n) ? BAUS_MINA[n] : null; },
  abrirBau(n) { const p = Mina.bau(n); if (p) G.mina.baus.push(n); return p; },
  // (15/10, T4) o Pulmão de pedreira (Fôlego 9): o ar pesado não cansa mais que o normal
  fatorAr(n) { return n >= MINA.AR_RUIM && !(typeof Habilidades !== 'undefined' && Habilidades.ganho('pulmao_de_pedreira')) ? 1.5 : 1; },
};
INICIADORES.push(s => Mina.iniciar(s));
COLETORES.push(s => Mina.salvar(s));
const FORJA_BARRAS = { ferro_velho: 'barra_ferro', sucata_aco: 'barra_aco', bronze_velho: 'barra_bronze' };
Object.assign(Mina, {
  agora() { return G.dia * 1440 + G.minutos; },
  // A forja do quintal (a fornalha do Stardew): 5 sucatas + 1 madeira → 1 barra em 30 minutos de jogo.
  forjar(chave, minerio, mochila) {
    if (!FORJA_BARRAS[minerio]) return 'nao';
    if (G.mina.forjas[chave]) return 'ocupada';
    if (mochila.total(minerio) < 5 || mochila.total('madeira') < 1) return 'falta';
    mochila.remover(minerio, 5); mochila.remover('madeira', 1);
    G.mina.forjas[chave] = { barra: FORJA_BARRAS[minerio], pronta: Mina.agora() + 30 }; return 'ok';
  },
  tirarBarra(chave, mochila) {
    const f = G.mina.forjas[chave]; if (!f) return '';
    if (Mina.agora() < f.pronta) return 'trabalhando';
    if (!mochila.cabe(f.barra)) return 'cheia';
    mochila.adicionar(f.barra, 1); delete G.mina.forjas[chave]; return f.barra;
  },
});
Object.assign(Mina, {
  // A betoneira: 2 cimentos + 1 vergalhão → manilha (2 dias); 1 cimento + 1 pigmento → lajota (1 dia); 1 cimento → bloco (1 dia).
  betonar(chave, mochila) {
    if (G.mina.betoneiras[chave]) return 'ocupada';
    let p;
    if (mochila.total('cimento') >= 2 && mochila.total('vergalhao') >= 1) { mochila.remover('cimento', 2); mochila.remover('vergalhao', 1); p = { produto: 'manilha', dias: 2 }; }
    else if (mochila.total('cimento') >= 1 && mochila.total('pigmento') >= 1) { mochila.remover('cimento', 1); mochila.remover('pigmento', 1); p = { produto: 'lajota', dias: 1 }; }
    else if (mochila.total('cimento') >= 1) { mochila.remover('cimento', 1); p = { produto: 'bloco_concreto', dias: 1 }; }
    else return 'falta';
    G.mina.betoneiras[chave] = { produto: p.produto, pronta: G.dia + p.dias }; return p;
  },
  tirarProduto(chave, mochila) {
    const b = G.mina.betoneiras[chave]; if (!b) return '';
    if (G.dia < b.pronta) return 'trabalhando';
    if (!mochila.cabe(b.produto)) return 'cheia';
    mochila.adicionar(b.produto, 1); delete G.mina.betoneiras[chave]; return b.produto;
  },
});
// O Museu da Vila (o do Gunther; museu.gd do Godot): um de cada antigo e raro; os marcos pagam prêmios.
const MUSEU = {
  ANTIGOS: ['moeda_antiga', 'garrafa_antiga', 'ferradura', 'azulejo_antigo', 'cachimbo', 'boneca_pano', 'lamparina', 'chave_antiga', 'carranca'],
  RAROS: ['cristal', 'pedra_bonita', 'concha', 'pedra_pigmento', 'bronze_velho'],
  PESO: { moeda_antiga: 4, garrafa_antiga: 5, ferradura: 5, azulejo_antigo: 3, cachimbo: 3, boneca_pano: 2, lamparina: 3, chave_antiga: 2, carranca: 1 },
  MARCOS: ECO.mina.marcos,
  DESCRICAO: { moeda_antiga: 'Moeda de cobre do tempo do Império. Quem perdeu isso aqui?', garrafa_antiga: 'Garrafa de refrigerante de vidro grosso, dos anos 40.',
    ferradura: 'Ferradura de burro de carga, do tempo em que a estrada era de barro.', azulejo_antigo: 'Azulejo português azul e branco. Deve ter sido de um casarão.',
    cachimbo: 'Cachimbo de madeira entalhada. Ainda tem cheiro de fumo de rolo.', boneca_pano: 'Boneca de pano de alguma menina da Vila, muito tempo atrás.',
    lamparina: 'Lamparina de querosene. Antes da luz elétrica chegar à Vila.', chave_antiga: 'Chave de ferro enorme. Que porta ela abria?',
    carranca: 'Carranca de barco, igual às do rio São Francisco. Como veio parar aqui?' },
};
Object.assign(Mina, {
  doar(id, mochila) {
    if (!MUSEU.ANTIGOS.includes(id) && !MUSEU.RAROS.includes(id)) return 'nao';
    if (G.mina.museu.doados.includes(id)) return 'ja';
    if (mochila.total(id) < 1) return 'falta';
    mochila.remover(id, 1); G.mina.museu.doados.push(id);
    const n = G.mina.museu.doados.length, m = MUSEU.MARCOS.find(([k]) => k === n);
    if (m && !G.mina.museu.marcos.includes(n)) { G.mina.museu.marcos.push(n); const p = m[1];
      if (p.dinheiro) { G.dinheiro += p.dinheiro; G.ganhoHoje = (G.ganhoHoje || 0) + p.dinheiro; }
      for (const it in p.itens || {}) { const s = mochila.adicionar(it, p.itens[it]); if (s && typeof soltar === 'function' && G.jog) soltar(it, s, G.jog.x, G.jog.y); }
      G.mina.museu.ultimoPremio = p; }
    return 'ok';
  },
  cavarMarca(rng = Math.random) { const ids = Object.keys(MUSEU.PESO); let x = rng() * ids.reduce((s, k) => s + MUSEU.PESO[k], 0); for (const id of ids) { x -= MUSEU.PESO[id]; if (x <= 0) return id; } return ids[0]; },
});
// As encomendas de material (o "Help Wanted" do Stardew): 1 por dia, até 3 abertas, prazo de 3 dias.
const ENCOMENDAS = [
  { item: 'barra_ferro', qtd: 3, paga: 90 }, { item: 'cristal', qtd: 2, paga: 60 }, { item: 'pigmento', qtd: 5, paga: 40 },
  { item: 'barra_aco', qtd: 2, paga: 120, pede: () => G.mina.maisFunda >= 10 }, { item: 'barra_bronze', qtd: 2, paga: 200, pede: () => G.mina.maisFunda >= 20 },
  { item: 'bloco_concreto', qtd: 5, paga: 80, pede: () => G.horta && G.horta.colocados.some(c => c.id === 'betoneira') },
  { item: 'lajota', qtd: 4, paga: 90, pede: () => G.horta && G.horta.colocados.some(c => c.id === 'betoneira') },
];
const QUEM_ENCOMENDA = ['ananias', 'tonico', 'rosa', 'zelia'];
Object.assign(Mina, {
  novaEncomenda(dia) {
    G.mina.encomendas = G.mina.encomendas.filter(e => e.ate >= dia);
    if (!G.mina.aberta) return null;   // cristal e pigmento só existem nas bancadas
    if (G.mina.encomendas.length >= 3) return null;
    const f = mulberry(dia * 977 + 31), ok = ENCOMENDAS.filter(e => !e.pede || e.pede());
    const e = ok[Math.floor(f() * ok.length)], nova = { item: e.item, qtd: e.qtd, paga: e.paga, quem: QUEM_ENCOMENDA[Math.floor(f() * QUEM_ENCOMENDA.length)], ate: dia + 3 };
    G.mina.encomendas.push(nova); return nova;
  },
  entregar(i, mochila, dia = G.dia) {
    const e = G.mina.encomendas[i]; if (!e) return 'falta';
    if (e.ate < dia) return 'vencida';
    if (mochila.total(e.item) < e.qtd) return 'falta';
    mochila.remover(e.item, e.qtd); G.dinheiro += e.paga; G.ganhoHoje = (G.ganhoHoje || 0) + e.paga;
    if (G.empreitas) G.empreitas.reputacao[e.quem] = (G.empreitas.reputacao[e.quem] || 0) + 1;
    G.mina.encomendas.splice(i, 1); return 'ok';
  },
});
