// Jocelino — gremio.js — a Obra do Povo: o Grêmio Recreativo Vila Maré (o Community Center do Stardew, do nosso jeito).
// O clube dos bailes da Vila, fechado e caindo; o povo quer ele de volta. 6 alas com pacotes (cada um pede coisas de um
// sistema do jogo), entregues aos poucos; as alas abrem pela contagem de pacotes prontos (como as salas do Stardew); cada
// ala pronta muda a Vila a partir da manhã seguinte. Regras puras e save; o prédio, a lista e a marquinha: gremio_tela.js.
const GREMIO_ALAS = [
  { id: 'cozinha', nome: 'Cozinha', pacotes: ['verduras_outono', 'roca', 'tempo_quente'], efeito: 'Horta coberta: o canteiro do Tio Juca aceita semente fora da estação.' },
  { id: 'varanda', nome: 'Varanda', pacotes: ['frutas_mata', 'chao_mata', 'beira_mar'], efeito: 'A mata e a praia dão o dobro de achados por dia.' },
  { id: 'aquario', nome: 'Aquário', pacotes: ['mar_dia', 'rio_mata', 'graudo'], efeito: 'Um covo de presente e a vara boa pela metade do preço na banca.' },
  { id: 'deposito', nome: 'Depósito', pacotes: ['fundacao', 'paredes', 'acabamento'], efeito: 'Uma betoneira de presente e 10% de desconto no depósito do Ananias.' },
  { id: 'oficina', nome: 'Oficina', pacotes: ['ferro', 'pedreira_funda', 'pedra_boa'], efeito: 'O Seu Tonico entrega a ferramenta em 1 dia e funde as barras pela metade do preço.' },
  { id: 'cofre', nome: 'Cofre do baile', pacotes: ['parcela_1', 'parcela_2', 'parcela_3', 'parcela_4'], efeito: 'O baile de reinauguração e +2 clientes na pensão aos sábados.' },
];
const _soltaSobra = (id, sobra) => { if (sobra && typeof soltar === 'function' && G.jog && G.mapa) soltar(id, sobra, G.jog.x, G.jog.y); };
const Gremio = {
  iniciar(s) { const g = s.gremio || {}; G.gremio = { entregue: JSON.parse(JSON.stringify(g.entregue || {})), prontos: (g.prontos || []).slice(), alas: Object.assign({}, g.alas || {}) }; },
  salvar(s) { s.gremio = JSON.parse(JSON.stringify(G.gremio)); },
  // (com a missão do guia, Task 4, o Guia.liberado é quem manda; antes dela, vale o dia)
  aberto() { return G.dia >= ECO.guia.dias.gremio && (typeof Guia === 'undefined' || Guia.liberado('gremio')); },
  ala(aid) { return GREMIO_ALAS.find(a => a.id === aid) || null; },
  alaDoPacote(pid) { return GREMIO_ALAS.find(a => a.pacotes.includes(pid)) || null; },
  pacote(pid) { return ECO.gremio.pacotes[pid] || null; },
  pronto(pid) { return G.gremio.prontos.includes(pid); },
  alaAberta(aid) { return Gremio.aberto() && G.gremio.prontos.length >= ECO.gremio.abre[aid]; },
  alaPronta(aid) { return aid in G.gremio.alas; },
  ativo(aid) { return Gremio.alaPronta(aid) && G.dia > G.gremio.alas[aid]; },
  falta(pid) {
    const P = Gremio.pacote(pid), e = G.gremio.entregue[pid] || {}, r = {};
    if (P.dinheiro) { const n = P.dinheiro - (e.dinheiro || 0); if (n > 0) r.dinheiro = n; return r; }
    for (const id in P.itens) { const n = P.itens[id] - (e[id] || 0); if (n > 0) r[id] = n; }
    return r;
  },
  progresso(pid) {
    const P = Gremio.pacote(pid), pede = P.dinheiro ? { dinheiro: P.dinheiro } : P.itens, f = Gremio.falta(pid);
    const total = Object.values(pede).reduce((a, n) => a + n, 0), falta = Object.values(f).reduce((a, n) => a + n, 0);
    return total ? (total - falta) / total : 1;
  },
  abertos() { return GREMIO_ALAS.filter(a => Gremio.alaAberta(a.id)).flatMap(a => a.pacotes).filter(p => !Gremio.pronto(p)); },
  // A ala que pede o item agora (pacote aberto e ainda faltando): a marquinha da mochila.
  serve(item) { for (const pid of Gremio.abertos()) if (Gremio.falta(pid)[item]) return Gremio.alaDoPacote(pid); return null; },
  // Entrega o que tiver (aos poucos): os itens da mochila; no cofre, o dinheiro.
  entregar(pid, mochila) {
    const ala = Gremio.alaDoPacote(pid);
    if (!ala || !Gremio.pacote(pid)) return { r: 'nao' };
    if (!Gremio.alaAberta(ala.id)) return { r: 'fechada' };
    if (Gremio.pronto(pid)) return { r: 'ja' };
    const f = Gremio.falta(pid), e = G.gremio.entregue[pid] = G.gremio.entregue[pid] || {}, deu = {};
    for (const id in f) {
      const tem = id === 'dinheiro' ? G.dinheiro : mochila.total(id), n = Math.min(tem, f[id]); if (n <= 0) continue;
      if (id === 'dinheiro') { G.dinheiro -= n; G.gastoHoje = (G.gastoHoje || 0) + n; } else mochila.remover(id, n);
      e[id] = (e[id] || 0) + n; deu[id] = n;
    }
    if (!Object.keys(deu).length) return { r: 'nada' };
    if (Object.keys(Gremio.falta(pid)).length) return { r: 'ok', deu };
    G.gremio.prontos.push(pid);
    const premio = Gremio.pacote(pid).premio || {};
    for (const id in premio) _soltaSobra(id, mochila.adicionar(id, premio[id]));
    if (!ala.pacotes.every(p => Gremio.pronto(p))) return { r: 'pronto', deu, premio };
    G.gremio.alas[ala.id] = G.dia;
    const pres = (ECO.gremio.presentes || {})[ala.id] || {};
    for (const id in pres) _soltaSobra(id, mochila.adicionar(id, pres[id]));
    return { r: 'ala', deu, premio, ala: ala.id };
  },
  // Os efeitos das alas prontas (valem da manhã seguinte), lidos pelos sistemas.
  fatorAchados(mapaId) { return Gremio.ativo('varanda') && (mapaId === 'mata' || mapaId === 'praia') ? ECO.gremio.efeitos.achados : 1; },
  descontoDeposito() { return Gremio.ativo('deposito') ? ECO.gremio.efeitos.deposito : 1; },
  diasTonico(padrao) { return Gremio.ativo('oficina') ? ECO.gremio.efeitos.diasTonico : padrao; },
  fatorFundir() { return Gremio.ativo('oficina') ? ECO.gremio.efeitos.fundir : 1; },
  fatorVaraBoa() { return Gremio.ativo('aquario') ? ECO.gremio.efeitos.varaBoa : 1; },
  clientesExtra(dia) { return Gremio.ativo('cofre') && (dia - 1) % 7 === 5 ? ECO.gremio.efeitos.clientesSabado : 0; },
  hortaCoberta() { return Gremio.ativo('cozinha'); },
};
INICIADORES.push(s => Gremio.iniciar(s));
COLETORES.push(s => Gremio.salvar(s));
// A carta da Dona Zélia (aqui, antes do guia.js: é o guia que a entrega ao abrir a missão do Grêmio na volta da manhã).
CARTAS.zelia_gremio = { de: 'Dona Zélia', dia: ECO.guia.dias.gremio,
  texto: 'Seu Jocelino, lembra do Grêmio Recreativo, o clube dos bailes, ali perto da praça? Fechou faz anos e está caindo. O povo quer ele de volta! A gente fez uma lista do que precisa — verdura da horta, fruta da mata, peixe, material de obra — e pregou na porta. Cada um ajuda com o que pode. Você, que é do ramo, dá uma olhada?' };
// O save antigo (o Grêmio liberado sem a missão do guia): a carta chega na manhã seguinte, uma vez.
MANHA.push(() => { if (G.correio && Gremio.aberto() && !G.correio.caixa.includes('zelia_gremio') && !G.correio.lidas.includes('zelia_gremio')) G.correio.caixa.push('zelia_gremio'); });
