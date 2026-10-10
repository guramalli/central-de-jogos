// Jocelino — mina.js — a pedreira funda (a mina do Stardew; pedreira.gd e forja.gd do Godot), as regras: 30 bancadas
// sorteadas pelo dia e pela profundidade, a escada escondida nas rochas, o elevador de 5 em 5, os perigos leves, os baús
// das bancadas 10, 20 e 30; e, nas entregas seguintes, a forja, a betoneira, o museu, as marcas e as encomendas.

const MINA = { FUNDO: 30, PEDRA_SOLTA: 0.03, ESCURO: 10, AR_RUIM: 20 };
const BAUS_MINA = { 10: { dinheiro: 200, itens: { barra_ferro: 3 } }, 20: { itens: { barra_aco: 3, cristal: 2 } }, 30: { itens: { barra_bronze: 3, carranca: 1 } } };
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
  chanceEscada(restantes) { return Math.min(1, 0.02 + 1 / Math.max(1, restantes)); },
  chegou(n) { G.mina.maisFunda = Math.max(G.mina.maisFunda, n); if (n % 5 === 0) G.mina.elevador = Math.max(G.mina.elevador, n); },
  bau(n) { return BAUS_MINA[n] && !G.mina.baus.includes(n) ? BAUS_MINA[n] : null; },
  abrirBau(n) { const p = Mina.bau(n); if (p) G.mina.baus.push(n); return p; },
  fatorAr(n) { return n >= MINA.AR_RUIM ? 1.5 : 1; },
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
