// Família Santos — loteamento.js — as REGRAS PURAS do arco do loteamento (spec docs/superpowers/specs/2026-10-15-mata-sitio-design.md,
// seção 2.1; tarefa T1). O Seu Moreira quer lotear a capoeira e a Mata da Serra ("Jardim da Serra", pressionado pelo Dr. Valadares,
// o loteador da capital, que só existe em cartas); o Tio Juca tem a posse da roça velha; a Vila assina a lista com o que o Jocelino
// já fez; a audiência de domingo no Grêmio decide sempre do mesmo jeito (a capoeira fica com a família, com licença e replantio, e a
// serra é tombada); o jogador escolhe como fica com o Moreira (acordo ou firme). Não existe derrota e a carreira nunca trava: a
// escolha só muda falas e ganchos, nunca diária nem degrau.
// Aqui ficam só o estado, a ordem dos passos, o calendário e o save. As cenas, as cartas, a lista no balcão, as estacas no mapa e
// as falas são da T9, que chama Loteamento.fazer / Loteamento.escolher na hora de cada coisa.

// Os passos, em ordem. quando: 'dia' (no dia seguinte ao passo anterior, ou depois), 'canteiro' (idem, mas só em dia de obra:
// nunca no domingo), 'audiencia' (o domingo marcado), 'mesmo_dia' (logo depois do anterior, no mesmo dia).
const LOTEAMENTO_PASSOS = [
  { id: 'anuncio', quando: 'canteiro', nome: 'O anúncio do "Jardim da Serra"' },
  { id: 'posse', quando: 'dia', nome: 'A roça é nossa' },
  { id: 'mateiro', quando: 'dia', nome: 'O mateiro e a juçara derrubada' },
  { id: 'carta_prefeitura', quando: 'dia', nome: 'A carta da Prefeitura' },
  { id: 'valadares', quando: 'canteiro', nome: 'A carta do Dr. Valadares' },
  { id: 'audiencia', quando: 'audiencia', nome: 'A audiência no Grêmio' },
  { id: 'decisao', quando: 'mesmo_dia', nome: 'A conversa na porta do Grêmio' },
  { id: 'licenca', quando: 'dia', nome: 'A licença da Prefeitura' },
];
// O calendário e o tom (não é dinheiro: o dinheiro do arco mora em ECO.loteamento).
const LOTEAMENTO = {
  diasAteAudiencia: 3,   // a audiência é no 1º domingo pelo menos 3 dias depois da carta (a lista fica 3 jantas no balcão)
  muitas: 15,            // assinaturas a partir das quais o Paulo diz "a Vila inteira está aqui"
  semanasMax: 8,         // domingos procurados para a audiência (todos ocupados: fica o 1º)
};
// Quem assina (a T9 registra leitores do que JÁ foi feito: empreitas entregues, casas do Bairro, pacotes do Grêmio, clientes
// semanais; cada um devolve um número). O Nhô Quim assina sempre, com o polegar.
const LOTEAMENTO_ASSINAM = [() => 1];
// Os domingos que não servem (a festa e a missa do Bairro, o calendário da pensão: a T9 registra; cada um devolve true se o dia
// está ocupado). Domingo ocupado: a audiência passa para o seguinte.
const LOTEAMENTO_DOMINGO_OCUPADO = [];
const _domingo = d => (d - 1) % 7 === 6;
const Loteamento = {
  PASSOS: LOTEAMENTO_PASSOS,
  iniciar(s) {
    const v = s && s.loteamento, l = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    const n = (x, p = 0) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.trunc(x)) : p);
    G.loteamento = { passo: clamp(n(l.passo), 0, LOTEAMENTO_PASSOS.length), diaPasso: n(l.diaPasso), assinaturas: n(l.assinaturas),
      escolha: l.escolha === 'acordo' || l.escolha === 'firme' ? l.escolha : '', diaAudiencia: n(l.diaAudiencia) };
  },
  salvar(s) { s.loteamento = Object.assign({}, G.loteamento); },
  // O gatilho (seção 2.2): o Jocelino é pedreiro e a família já mudou para a casa nova (vale o que vier por último).
  gatilho() { return !!(G.obra && G.obra.funcao >= 2 && G.casa && G.casa.mudou); },
  comecou() { return G.loteamento.passo > 0; },
  acabou() { return G.loteamento.passo >= LOTEAMENTO_PASSOS.length; },
  feito(id) { const i = LOTEAMENTO_PASSOS.findIndex(p => p.id === id); return i >= 0 && G.loteamento.passo > i; },
  // O próximo passo (o objeto), ou null com o arco acabado.
  proximo() { return LOTEAMENTO_PASSOS[G.loteamento.passo] || null; },
  // O domingo da audiência a partir do dia da carta: o 1º domingo livre pelo menos diasAteAudiencia dias depois. Procura no
  // máximo LOTEAMENTO.semanasMax domingos; se todos estiverem ocupados, fica o 1º (a audiência nunca some). Dia inválido: hoje.
  marcarAudiencia(diaCarta) {
    const base = (typeof diaCarta === 'number' && Number.isFinite(diaCarta) && diaCarta > 0 ? Math.trunc(diaCarta) : (G.dia || 1)) + LOTEAMENTO.diasAteAudiencia;
    let d = base; while (!_domingo(d)) d++;
    const primeiro = d;
    for (let k = 0; k < LOTEAMENTO.semanasMax; k++, d += 7) {
      let ocupado = false; for (const f of LOTEAMENTO_DOMINGO_OCUPADO) { try { if (f(d)) ocupado = true; } catch (e) { console.error(e); } }
      if (!ocupado) return d;
    }
    return primeiro;
  },
  // O próximo passo pode acontecer neste dia?
  pronto(dia = G.dia) {
    const L = G.loteamento, P = Loteamento.proximo(); if (!P) return false;
    if (P.id === 'anuncio') return Loteamento.gatilho() && !_domingo(dia);
    if (P.quando === 'canteiro') return dia > L.diaPasso && !_domingo(dia);
    if (P.quando === 'audiencia') return dia >= L.diaAudiencia && _domingo(dia);
    if (P.quando === 'mesmo_dia') return dia >= L.diaPasso;
    return dia > L.diaPasso;
  },
  // O id do passo que cabe hoje (a T9 pergunta de manhã e na hora de cada lugar), ou null.
  devido(dia = G.dia) { return Loteamento.pronto(dia) ? Loteamento.proximo().id : null; },
  // Faz o passo id, se for o da vez e couber no dia. Devolve false se não andou; se andou, { dar }: o que o passo põe na mão do
  // jogador (só a licença: as mudas ainda não entregues, { muda: 10 }; quem entrega, uma vez só, é Sitio.entregarMudasDaLicenca,
  // com a flag no save). A decisão só anda por Loteamento.escolher.
  // Os efeitos das regras: a carta marca o domingo; a audiência tomba a serra (começa "A Mata em Pé"); a licença abre o desmatamento.
  fazer(id, dia = G.dia) {
    if (typeof dia !== 'number' || !Number.isFinite(dia)) return false;
    const P = Loteamento.proximo(); if (!P || P.id !== id || id === 'decisao' || !Loteamento.pronto(dia)) return false;
    const L = G.loteamento; let dar = {};
    if (id === 'carta_prefeitura') L.diaAudiencia = Loteamento.marcarAudiencia(dia);
    if (id === 'audiencia') { Loteamento.lerAssinaturas(); MataEmPe.comecar(dia); }
    if (id === 'licenca') dar = Sitio.darLicenca(dia);
    L.passo++; L.diaPasso = dia;
    return { dar };
  },
  // A decisão na porta do Grêmio: 'acordo' (o Moreira vira aliado e manda o presente) ou 'firme' (ele guarda rancor; nada se
  // perde). Devolve { ok, presente } (o presente vai para a mochila na T9).
  escolher(escolha, dia = G.dia) {
    if ((escolha !== 'acordo' && escolha !== 'firme') || !Loteamento.proximo() || Loteamento.proximo().id !== 'decisao' || !Loteamento.pronto(dia)) return { ok: false, presente: {} };
    const L = G.loteamento; L.escolha = escolha; L.passo++; L.diaPasso = dia;
    return { ok: true, presente: escolha === 'acordo' ? Object.assign({}, ECO.loteamento.presenteAcordo) : {} };
  },
  // A lista do povo: aberta da carta da Prefeitura até a audiência. As assinaturas só leem o que já foi feito (nunca descem).
  listaAberta() { return Loteamento.feito('carta_prefeitura') && !Loteamento.feito('audiencia'); },
  lerAssinaturas() {
    if (!Loteamento.listaAberta()) return G.loteamento.assinaturas;
    let n = 0; for (const f of LOTEAMENTO_ASSINAM) { try { n += Math.max(0, f() | 0); } catch (e) { console.error(e); } }
    G.loteamento.assinaturas = Math.max(G.loteamento.assinaturas, n);
    return G.loteamento.assinaturas;
  },
  // O tom da audiência: mais assinaturas não mudam o resultado, só o que o Paulo diz.
  tom() { return G.loteamento.assinaturas >= LOTEAMENTO.muitas ? 'muitas' : 'poucas'; },
  // Como o Moreira fala depois: 'neutro' (antes da decisão), 'aliado' (acordo) ou 'frio' (firme). Só falas: nunca diária nem degrau.
  moreira() { return G.loteamento.escolha === 'acordo' ? 'aliado' : G.loteamento.escolha === 'firme' ? 'frio' : 'neutro'; },
  serraTombada() { return Loteamento.feito('audiencia'); },
};
INICIADORES.push(s => Loteamento.iniciar(s));
COLETORES.push(s => Loteamento.salvar(s));
