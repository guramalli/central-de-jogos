// Família Santos — sitio.js — as REGRAS PURAS do Sítio da família e da meta "A Mata em Pé" (spec
// docs/superpowers/specs/2026-10-15-mata-sitio-design.md, seções 2.3, 2.4, 3 e 4.5; tarefa T1). Só o estado, as contas e o save:
// o mapa do sítio, as plaquinhas, os bichos andando, as telas e os ganchos de MANHA/NOITE são das tarefas T8 a T16, que chamam
// as funções daqui. Os números moram em ECO.sitio e ECO.serra (economia.js).
//  - O desmatamento: 6 etapas em ordem (3 empreitas longas da família e 3 talhões de limpeza de verdade). A licença da Prefeitura
//    (fim do arco do loteamento) abre a 1ª; cada árvore derrubada no sítio deve 1 muda; o fundo (talhão 3) só fecha com as mudas
//    plantadas, e aí "a licença fecha".
//  - As mudas: plantadas no sítio (faixa do córrego) ou na serra (clareiras feridas); viram arvoreta em 7 dias e árvore em 28.
//  - As construções: na ordem fixa; só a próxima pode subir (com o que ela pede: talhão limpo, licença, nível de Alvenaria).
//  - Os bichos (galinha e vaca): comida (um cocho alimenta todos da casa), água, carinho (uma vez por dia), pasto; o afeto
//    (0 a 1.000, 200 = 1 coração) e a produção da manhã (sem comida, nada; com humor bom, o graúdo e o "da casa").
//  - "A Mata em Pé": começa no tombamento da serra e conta as mudas que viraram árvore; os marcos de 10, 25 e 50.

// As etapas do desmatamento (a ordem da seção 2.3). tipo 'empreita': a obra longa da família (o laço das empreitas, T10);
// tipo 'talhao': fecha quando o talhão fica sem detrito (a conta do CANTEIRO, T10); 'mudas': só fecha com as mudas devidas plantadas.
const DESMATE_ETAPAS = [
  { id: 'picada', nome: 'A picada', tipo: 'empreita' },
  { id: 'frente', nome: 'Derrubada da frente', tipo: 'talhao', talhao: 0 },
  { id: 'destoca', nome: 'Destoca do meio', tipo: 'talhao', talhao: 1 },
  { id: 'terraplenar', nome: 'Terraplenar', tipo: 'empreita' },
  { id: 'fundo', nome: 'Fundo e replantio', tipo: 'talhao', talhao: 2, mudas: true },
  { id: 'cerca', nome: 'A cerca do sítio', tipo: 'empreita' },
];
// As construções, na ordem fixa (seção 3.2): o nome, o porquê na pensão (a frase da Caderneta) e o que cada uma pede além de ser
// a próxima. pede: 'talhao1' (a frente limpa), 'terraplenar' e 'cerca' (as etapas do desmate), 'licenca' (a licença fechada) ou
// o id de outra construção. O nível de Alvenaria das ampliações mora em ECO.sitio.construcoes[id].alvenaria.
const SITIO_CONSTRUCOES = [
  { id: 'poco', nome: 'Poço com sarilho', porque: 'água para os bichos e para a horta grande', pede: ['talhao1'] },
  { id: 'galinheiro', nome: 'Galinheiro', porque: 'ovo nosso, a Rosa não compra mais', pede: ['poco'] },
  { id: 'paiol', nome: 'Paiol', porque: 'o capim cortado vira feno para o inverno', pede: ['galinheiro'] },
  { id: 'curral', nome: 'Curral com estábulo', porque: 'leite para o queijo coalho de Aracaju', pede: ['terraplenar', 'cerca'] },
  { id: 'pomar', nome: 'Pomar', porque: 'fruta para o doce e o suco', pede: ['licenca'] },
  { id: 'horta_grande', nome: 'Horta grande', porque: 'o dobro do canteiro do Tio Juca', pede: ['poco'] },
  { id: 'galinheiro_grande', nome: 'Ampliação do galinheiro', porque: 'mais galinhas, e a tulha enche o cocho sozinha', pede: ['galinheiro'] },
  { id: 'curral_grande', nome: 'Ampliação do curral', porque: 'mais vacas, e o bebedouro encanado enche sozinho', pede: ['curral'] },
];
// Os nomes que os bichos ganham se o jogador não der outro (na ordem de chegada).
const NOMES_BICHO = { galinha: ['Pintada', 'Carijó', 'Garnisé', 'Ruiva', 'Branquinha', 'Pedrês', 'Cocota', 'Sura'], vaca: ['Mimosa', 'Estrela', 'Malhada', 'Bonina'] };
// Quem troca o produto pelo "da casa" (o ovo caipira SUBSTITUI o ovo comum: no dia dele, sai 1 caipira e nada mais, nem o
// graúdo; decisão da revisão da T1). A vaca não troca: a manteiga de garrafa é um pote além do leite (spec 3.3).
const DA_CASA_SUBSTITUI = { galinha: true, vaca: false };
const _novoSitio = () => ({
  desmate: { licenca: 0, etapa: 0, talhoes: [false, false, false], derrubadas: 0, mudasDevidas: 0, mudasPlantadas: 0, mudasEntregues: false },
  mudas: [], construcoes: {}, bichos: [], cesto: {}, paiol: { feno: 0, quirera: 0 }, seq: 0,
});
// Leitura segura do save (save corrompido ou de outra versão nunca quebra nem injeta chave estranha).
const _int = (v, p = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : p);
const _obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const _tem = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const _tipoBicho = t => typeof t === 'string' && _tem(ECO.sitio.animais, t);
// Um { item: qtd } só com quantidades inteiras positivas.
const _contagem = v => { const o = _obj(v), r = {}; for (const k of Object.keys(o)) { const q = _int(o[k]); if (q > 0) r[k] = q; } return r; };
const Sitio = {
  ETAPAS: DESMATE_ETAPAS, CONSTRUCOES: SITIO_CONSTRUCOES,
  // ---------- save (save antigo: tudo no padrão; campo a campo, para um save do meio do caminho também abrir)
  iniciar(s) {
    const n = _novoSitio(), v = _obj(s && s.sitio), d = _obj(v.desmate), t = Array.isArray(d.talhoes) ? d.talhoes : [];
    n.desmate = { licenca: Math.max(0, _int(d.licenca)), etapa: clamp(_int(d.etapa), 0, DESMATE_ETAPAS.length), talhoes: [0, 1, 2].map(i => t[i] === true),
      derrubadas: Math.max(0, _int(d.derrubadas)), mudasDevidas: Math.max(0, _int(d.mudasDevidas)), mudasPlantadas: Math.max(0, _int(d.mudasPlantadas)),
      mudasEntregues: d.mudasEntregues === true };
    const vistas = new Set();
    for (const m of Array.isArray(v.mudas) ? v.mudas : []) {
      if (!m || typeof m !== 'object' || (m.lugar !== 'sitio' && m.lugar !== 'serra')) continue;
      const k = m.lugar + '|' + _int(m.x) + ',' + _int(m.y); if (vistas.has(k)) continue; vistas.add(k);
      n.mudas.push({ lugar: m.lugar, x: _int(m.x), y: _int(m.y), dia: _int(m.dia), contada: m.contada === true });
    }
    const cs = _obj(v.construcoes);
    for (const c of SITIO_CONSTRUCOES) if (_tem(cs, c.id) && _int(cs[c.id]) > 0) n.construcoes[c.id] = _int(cs[c.id]);
    n.seq = Math.max(0, _int(v.seq));
    const ids = new Set();
    for (const b of Array.isArray(v.bichos) ? v.bichos : []) {
      if (!b || typeof b !== 'object' || !_tipoBicho(b.tipo)) continue;
      let id = typeof b.id === 'string' && b.id ? b.id : ''; if (!id || ids.has(id)) id = b.tipo + '_' + (++n.seq);
      ids.add(id);
      n.bichos.push(Object.assign(Sitio._bichoNovo(b.tipo, typeof b.nome === 'string' ? b.nome : '', id, _int(b.dia)), {
        afeto: clamp(_int(b.afeto), 0, ECO.sitio.afeto.max), comeu: b.comeu === true, bebeu: b.bebeu === true, carinho: b.carinho === true,
        pastou: b.pastou === true, novo: b.novo === true, ordenha: b.tipo === 'vaca' ? _contagem(b.ordenha) : {} }));
    }
    n.cesto = _contagem(v.cesto);
    const p = _obj(v.paiol);
    n.paiol = { feno: clamp(_int(p.feno), 0, ECO.sitio.construcoes.paiol.feno), quirera: Math.max(0, _int(p.quirera)) };
    n.seq = Math.max(n.seq, n.bichos.length);
    G.sitio = n;
  },
  salvar(s) { s.sitio = JSON.parse(JSON.stringify(G.sitio)); },

  // ---------- o desmatamento
  // A licença da Prefeitura (a segunda-feira depois da audiência): abre a 1ª etapa (uma vez) e devolve as mudas da licença que
  // ainda não foram entregues ({ muda: 10 } ou {}). Devolver não entrega: quem entrega é Sitio.entregarMudasDaLicenca.
  darLicenca(dia = G.dia) {
    const D = G.sitio.desmate; if (!D.licenca) D.licenca = _int(dia, 1) || 1;
    return Sitio.mudasDaLicenca();
  },
  temLicenca() { return !!G.sitio.desmate.licenca; },
  // As mudas da licença que ainda faltam entregar (a flag mudasEntregues fica no save).
  mudasDaLicenca() { const D = G.sitio.desmate; return D.licenca && !D.mudasEntregues ? { muda: ECO.sitio.desmate.licencaMudas } : {}; },
  // Entrega as mudas da licença na mochila, uma vez só (idempotente: a 2ª chamada não dá nada). Devolve { deu, sobra }: a
  // sobra (mochila cheia) quem chama solta no chão; a entrega conta como feita.
  entregarMudasDaLicenca(mochila) {
    const dar = Sitio.mudasDaLicenca(), deu = {}, sobra = {};
    if (!dar.muda || !mochila) return { deu, sobra };
    G.sitio.desmate.mudasEntregues = true;
    const s = mochila.adicionar('muda', dar.muda) | 0; deu.muda = dar.muda - s; if (s > 0) sobra.muda = s;
    return { deu, sobra };
  },
  // A etapa da vez (o objeto de DESMATE_ETAPAS), ou null antes da licença e depois da última.
  etapa() { const D = G.sitio.desmate; return D.licenca && D.etapa < DESMATE_ETAPAS.length ? DESMATE_ETAPAS[D.etapa] : null; },
  etapaPronta(id) { const i = DESMATE_ETAPAS.findIndex(e => e.id === id); return i >= 0 && G.sitio.desmate.etapa > i; },
  desmateAcabou() { return G.sitio.desmate.etapa >= DESMATE_ETAPAS.length; },
  // "A licença fecha" quando o fundo (com o replantio) fica pronto: abre o pomar.
  licencaFechada() { return Sitio.etapaPronta('fundo'); },
  mudasFaltando() { const D = G.sitio.desmate; return Math.max(0, D.mudasDevidas - D.mudasPlantadas); },
  // A linha da Caderneta (seção 2.4).
  textoLicenca() { const D = G.sitio.desmate; return `Licença da Prefeitura: plante 1 muda para cada árvore derrubada (${D.mudasPlantadas} de ${D.mudasDevidas}).`; },
  // Fecha as etapas de talhão que já estão cumpridas (a de agora e as seguintes, em cadeia). Devolve os ids que fecharam.
  _avanca() {
    const D = G.sitio.desmate, fechou = [];
    for (let E = Sitio.etapa(); E && E.tipo === 'talhao' && D.talhoes[E.talhao] && (!E.mudas || D.mudasPlantadas >= D.mudasDevidas); E = Sitio.etapa()) { D.etapa++; fechou.push(E.id); }
    return fechou;
  },
  // O talhão i (0 a 2) ficou sem detrito (a T10 confere o retângulo). Marca (só com a licença) e fecha a etapa dele se for a vez. Devolve os ids que fecharam.
  limpouTalhao(i) { if (!(i >= 0 && i < 3) || !Sitio.temLicenca()) return []; G.sitio.desmate.talhoes[i] = true; return Sitio._avanca(); },
  // A empreita longa da etapa (picada, terraplenar, cerca) foi entregue: fecha se for a vez. Devolve os ids que fecharam.
  entregouEtapa(id) {
    const E = Sitio.etapa(); if (!E || E.id !== id || E.tipo !== 'empreita') return [];
    G.sitio.desmate.etapa++; return [id].concat(Sitio._avanca());
  },
  // Um detrito derrubado no sítio: só a árvore deve muda (o toco de lei, o mato, o galho e a pedra são resto de roça velha).
  derrubou(tipo) {
    if (tipo !== 'arvore') return 0;
    const D = G.sitio.desmate, n = ECO.sitio.desmate.mudaPorArvore;
    D.derrubadas++; D.mudasDevidas += n; return n;
  },

  // ---------- as mudas (sítio e serra)
  // Planta uma muda (a T10 confere a pá, a muda na mão e o lugar). lugar: 'sitio' ou 'serra'. Conta para a licença e, quando
  // pegar (28 dias), para "A Mata em Pé". Devolve a muda, ou null se o ladrilho já tem uma.
  plantarMuda(lugar, x, y, dia = G.dia) {
    if (lugar !== 'sitio' && lugar !== 'serra') return null;
    if (Sitio.mudaEm(lugar, x, y)) return null;
    const m = { lugar, x: x | 0, y: y | 0, dia: dia | 0, contada: false };
    G.sitio.mudas.push(m); G.sitio.desmate.mudasPlantadas++;
    Sitio._avanca();
    return m;
  },
  mudaEm(lugar, x, y) { return G.sitio.mudas.find(m => m.lugar === lugar && m.x === (x | 0) && m.y === (y | 0)) || null; },
  // 'muda' (até 6 dias), 'arvoreta' (7 a 27) ou 'arvore' (28 em diante: de enfeite, não se corta).
  estadoMuda(m, dia = G.dia) {
    const k = dia - m.dia, D = ECO.sitio.desmate;
    return k >= D.arvore ? 'arvore' : k >= D.arvoreta ? 'arvoreta' : 'muda';
  },
  // Arrancar a muda (ou a arvoreta) devolve a dívida da licença e nunca conta para a Mata em Pé; a árvore não sai.
  arrancarMuda(lugar, x, y, dia = G.dia) {
    const m = Sitio.mudaEm(lugar, x, y); if (!m || Sitio.estadoMuda(m, dia) === 'arvore') return false;
    G.sitio.mudas.splice(G.sitio.mudas.indexOf(m), 1);
    G.sitio.desmate.mudasPlantadas = Math.max(0, G.sitio.desmate.mudasPlantadas - 1);
    return true;
  },
  mudasEm(lugar) { return G.sitio.mudas.filter(m => m.lugar === lugar).length; },

  // ---------- as construções (ordem fixa)
  tem(id) { return !!G.sitio.construcoes[id]; },
  // A próxima construção da ordem (o objeto de SITIO_CONSTRUCOES), ou null com tudo pronto.
  proxima() { return SITIO_CONSTRUCOES.find(c => !Sitio.tem(c.id)) || null; },
  // Pode subir agora? { ok, falta }: falta diz o que segura (o texto da plaquinha / Caderneta).
  podeConstruir(id) {
    const c = SITIO_CONSTRUCOES.find(k => k.id === id);
    if (!c) return { ok: false, falta: 'construção desconhecida' };
    if (Sitio.tem(id)) return { ok: false, falta: 'já está pronta' };
    const p = Sitio.proxima(); if (!p || p.id !== id) return { ok: false, falta: `primeiro: ${p ? p.nome : '—'}` };
    for (const r of c.pede) {
      if (r === 'talhao1' && !Sitio.etapaPronta('frente')) return { ok: false, falta: 'a derrubada da frente' };
      if ((r === 'terraplenar' || r === 'cerca') && !Sitio.etapaPronta(r)) return { ok: false, falta: r === 'cerca' ? 'a cerca do sítio' : 'terraplenar o chão do curral' };
      if (r === 'licenca' && !Sitio.licencaFechada()) return { ok: false, falta: 'a licença fechada (as mudas devidas plantadas)' };
      if (SITIO_CONSTRUCOES.some(k => k.id === r) && !Sitio.tem(r)) return { ok: false, falta: SITIO_CONSTRUCOES.find(k => k.id === r).nome };
    }
    const nv = ECO.sitio.construcoes[id].alvenaria || 0;
    if (nv && !(typeof Habilidades !== 'undefined' && G.hab && Habilidades.nivel('alvenaria') >= nv)) return { ok: false, falta: `Alvenaria ${nv}` };
    return { ok: true, falta: '' };
  },
  // A empreita da construção foi entregue (a T11 chama): marca o dia. Só a que pode subir.
  construiu(id, dia = G.dia) { if (!Sitio.podeConstruir(id).ok) return false; G.sitio.construcoes[id] = dia || 1; return true; },

  // ---------- os bichos
  _bichoNovo(tipo, nome, id, dia) {
    return { id: id || '', tipo, nome: nome || '', dia: dia | 0, afeto: 0, comeu: false, bebeu: false, carinho: false, pastou: false, novo: true, ordenha: {} };
  },
  // Quantos bichos do tipo cabem (pela construção: o galinheiro 4, ampliado 8; o curral 2, ampliado 4).
  vagas(tipo) {
    const C = ECO.sitio.construcoes;
    if (tipo === 'galinha') return Sitio.tem('galinheiro_grande') ? C.galinheiro_grande.vagas : Sitio.tem('galinheiro') ? C.galinheiro.vagas : 0;
    if (tipo === 'vaca') return Sitio.tem('curral_grande') ? C.curral_grande.vagas : Sitio.tem('curral') ? C.curral.vagas : 0;
    return 0;
  },
  bichos(tipo) { return G.sitio.bichos.filter(b => !tipo || b.tipo === tipo); },
  bicho(id) { return G.sitio.bichos.find(b => b.id === id) || null; },
  cabe(tipo) { return Sitio.bichos(tipo).length < Sitio.vagas(tipo); },
  // Um bicho chega (sem cobrar: a vaca da carta chega na manhã seguinte, já paga). Devolve o bicho, ou null sem vaga.
  adicionarBicho(tipo, nome, dia = G.dia) {
    if (!_tipoBicho(tipo) || !Sitio.cabe(tipo)) return null;
    const S = G.sitio, lista = NOMES_BICHO[tipo] || [];
    const padrao = lista.find(n => !S.bichos.some(b => b.nome === n)) || (lista[0] || tipo) + ' ' + (Sitio.bichos(tipo).length + 1);
    const b = Sitio._bichoNovo(tipo, nome || padrao, tipo + '_' + (++S.seq), dia);
    S.bichos.push(b); return b;
  },
  // Comprar: confere a vaga e o dinheiro, cobra e põe o bicho. { r: 'ok', bicho } | { r: 'sem_vaga' } | { r: 'sem_dinheiro' }.
  comprar(tipo, nome) {
    if (!_tipoBicho(tipo)) return { r: 'nao' };
    const A = ECO.sitio.animais[tipo];
    if (!Sitio.cabe(tipo)) return { r: 'sem_vaga' };
    if (G.dinheiro < A.preco) return { r: 'sem_dinheiro' };
    G.dinheiro -= A.preco; G.gastoHoje = (G.gastoHoje || 0) + A.preco;
    return { r: 'ok', bicho: Sitio.adicionarBicho(tipo, nome) };
  },
  coracoes(b) { return clamp(Math.floor(b.afeto / ECO.sitio.afeto.coracao), 0, 5); },
  _afeto(b, d) { b.afeto = clamp(b.afeto + d, 0, ECO.sitio.afeto.max); },
  // O humor do dia: 'bom' (comeu, bebeu e ganhou carinho), 'ok' (2 das 3) ou 'ruim'.
  humor(b) { const n = (b.comeu ? 1 : 0) + (b.bebeu ? 1 : 0) + (b.carinho ? 1 : 0); return n === 3 ? 'bom' : n === 2 ? 'ok' : 'ruim'; },
  // O cocho (um clique com a comida na mão): alimenta todos os que ainda não comeram na casa ('galinheiro' ou 'curral'), 1
  // unidade por bicho, tirando da mochila. Devolve quantos comeram.
  alimentar(casa, item, mochila) {
    const fome = G.sitio.bichos.filter(b => ECO.sitio.animais[b.tipo].mora === casa && ECO.sitio.animais[b.tipo].come.includes(item) && !b.comeu);
    const n = Math.min(fome.length, mochila ? mochila.total(item) : 0); if (n <= 0) return 0;
    mochila.remover(item, n);
    for (let k = 0; k < n; k++) fome[k].comeu = true;
    return n;
  },
  // O bebedouro (um clique com o balde cheio): todos da casa beberam. Devolve quantos.
  darAgua(casa) { let n = 0; for (const b of G.sitio.bichos) if (ECO.sitio.animais[b.tipo].mora === casa && !b.bebeu) { b.bebeu = true; n++; } return n; },
  // O carinho (botão direito no bicho): uma vez por dia. quem: 'jocelino' (+15) ou 'filhos' (+8). Devolve o afeto ganho (0 se já teve).
  carinho(id, quem = 'jocelino') {
    const b = Sitio.bicho(id); if (!b || b.carinho) return 0;
    const g = quem === 'filhos' ? ECO.sitio.afeto.carinhoFilhos : ECO.sitio.afeto.carinho;
    b.carinho = true; Sitio._afeto(b, g); return g;
  },
  // Soltos de dia: em dia seco, quem pasta nesta estação (a galinha cisca o ano todo; a vaca, na primavera e no verão, com o
  // pasto cercado) come de graça e ganha +8, uma vez por dia. Devolve quantos pastaram.
  soltar(chove = false, estacao = relogio.estacao()) {
    if (chove) return 0;
    let n = 0;
    for (const b of G.sitio.bichos) {
      const A = ECO.sitio.animais[b.tipo];
      if (b.pastou || !A.pasta.includes(estacao) || (b.tipo === 'vaca' && !Sitio.etapaPronta('cerca'))) continue;
      b.pastou = true; b.comeu = true; Sitio._afeto(b, ECO.sitio.afeto.pasto); n++;
    }
    return n;
  },
  // O paiol: o feno guardado (até ECO.sitio.construcoes.paiol.feno) e a quirera. Devolve a sobra que não coube.
  // Quantidade inválida ou negativa não mexe no estoque (devolve 0).
  guardar(item, n) {
    n = _int(n); if (n <= 0) return 0;
    if (!Sitio.tem('paiol') || (item !== 'feno' && item !== 'quirera')) return n;
    const P = G.sitio.paiol, cabe = item === 'feno' ? Math.max(0, ECO.sitio.construcoes.paiol.feno - P.feno) : n, q = Math.max(0, Math.min(cabe, n));
    P[item] += q; return n - q;
  },
  // O cesto da porta do galinheiro: um clique pega todos os ovos. Devolve { item: qtd } e esvazia.
  recolherCesto() { const c = G.sitio.cesto; G.sitio.cesto = {}; return c; },
  // A ordenha (botão direito com o balde, vaca a vaca): o leite (e a manteiga de garrafa) da manhã, +5 de afeto. Devolve { item: qtd } ou {}.
  ordenhar(id) {
    const b = Sitio.bicho(id); if (!b || b.tipo !== 'vaca' || !Object.keys(b.ordenha).length) return {};
    const r = b.ordenha; b.ordenha = {}; Sitio._afeto(b, ECO.sitio.afeto.ordenha); return r;
  },
  // A MANHÃ (a T13 chama no MANHA, depois de virar o dia): fecha o dia de ontem de cada bicho e produz.
  //  - sem comida: −20 e não produz; sem carinho: −10 (o bicho que chegou ontem não perde nada);
  //  - comeu: 1 produto; com humor bom, o graúdo (+1) com chance 0,1 + 0,5 × afeto/1000; com 3 corações ou mais e humor bom, o
  //    "da casa" com chance 0,3. A galinha sorteia o da casa primeiro e, se sair, põe 1 ovo caipira NO LUGAR do ovo (sem graúdo:
  //    DA_CASA_SUBSTITUI); a vaca dá a manteiga de garrafa além do leite (e do graúdo);
  //  - a galinha põe no cesto; a vaca guarda para a ordenha (o leite de ontem não ordenhado se perde);
  //  - depois, o dia novo: tudo zerado; com a ampliação, os filhos fazem o carinho (+8) que faltou ontem e a tulha (galinheiro
  //    grande) enche o cocho do paiol; o bebedouro encanado (curral grande) dá água às vacas.
  // rng: o sorteio (os testes passam um com semente). Devolve { linhas, produziu: { item: qtd } }.
  manha(rng = Math.random) {
    const S = G.sitio, F = ECO.sitio.afeto, P = ECO.sitio.producao, linhas = [], produziu = {};
    const soma = (o, id, q) => { if (q > 0) o[id] = (o[id] || 0) + q; };
    for (const b of S.bichos) {
      const A = ECO.sitio.animais[b.tipo];
      const ampliado = b.tipo === 'galinha' ? Sitio.tem('galinheiro_grande') : Sitio.tem('curral_grande');
      if (!b.carinho && ampliado && !b.novo) { b.carinho = true; Sitio._afeto(b, F.carinhoFilhos); }
      const humor = Sitio.humor(b);
      if (!b.novo) { if (!b.comeu) Sitio._afeto(b, F.semComida); if (!b.carinho) Sitio._afeto(b, F.semCarinho); }
      if (b.tipo === 'vaca') b.ordenha = {};
      if (b.comeu) {
        const r = {}, bom = humor === 'bom', podeCasa = bom && Sitio.coracoes(b) >= P.daCasaCoracoes;
        const graudo = () => bom && rng() < P.graudoBase + P.graudoAfeto * b.afeto / F.max;
        if (DA_CASA_SUBSTITUI[b.tipo]) {
          if (podeCasa && rng() < P.daCasaChance) soma(r, A.daCasa, 1);
          else soma(r, A.produto, graudo() ? 2 : 1);
        } else {
          soma(r, A.produto, graudo() ? 2 : 1);
          if (podeCasa && rng() < P.daCasaChance) soma(r, A.daCasa, 1);
        }
        for (const id in r) { soma(produziu, id, r[id]); if (b.tipo === 'galinha') soma(S.cesto, id, r[id]); else soma(b.ordenha, id, r[id]); }
      } else if (!b.novo) linhas.push(`${b.nome} ficou sem comida ontem e não produziu.`);
      Object.assign(b, { comeu: false, bebeu: false, carinho: false, pastou: false, novo: false });
    }
    // O dia novo: a tulha e o bebedouro encanado.
    if (Sitio.tem('galinheiro_grande')) {
      const fome = S.bichos.filter(b => b.tipo === 'galinha'), n = Math.max(0, Math.min(fome.length, S.paiol.quirera));
      S.paiol.quirera -= n; for (let k = 0; k < n; k++) fome[k].comeu = true;
    }
    if (Sitio.tem('curral_grande')) for (const b of S.bichos) if (b.tipo === 'vaca') b.bebeu = true;
    return { linhas, produziu };
  },
};
INICIADORES.push(s => Sitio.iniciar(s));
COLETORES.push(s => Sitio.salvar(s));

// ---------- "A Mata em Pé" (seção 4.5): G.mataEmPe = { desde, arvores, marcos }
//  desde: o dia do tombamento da serra (0 = a meta ainda não começou); arvores: as mudas que viraram árvore depois disso
//  (no sítio e na serra); marcos: os marcos já alcançados (10, 25, 50), para o ganho valer uma vez.
const MataEmPe = {
  iniciar(s) { const m = _obj(s && s.mataEmPe), validos = MataEmPe.MARCOS();
    G.mataEmPe = { desde: Math.max(0, _int(m.desde)), arvores: Math.max(0, _int(m.arvores)),
      marcos: (Array.isArray(m.marcos) ? m.marcos : []).filter((n, i, a) => validos.includes(n) && a.indexOf(n) === i) }; },
  salvar(s) { s.mataEmPe = { desde: G.mataEmPe.desde, arvores: G.mataEmPe.arvores, marcos: G.mataEmPe.marcos.slice() }; },
  comecou() { return G.mataEmPe.desde > 0; },
  // O tombamento (o fim da audiência, loteamento.js): a meta começa. Uma vez.
  comecar(dia = G.dia) { if (!G.mataEmPe.desde) G.mataEmPe.desde = dia || 1; },
  MARCOS() { return Object.keys(ECO.serra.mataEmPe.marcos).map(Number).sort((a, b) => a - b); },
  // A conta da manhã (a T16 chama no MANHA): cada muda que virou árvore conta uma vez, só com a meta começada. Devolve os
  // marcos novos alcançados (para a placa "Guardião da Mata" e o aviso).
  contar(dia = G.dia) {
    if (!MataEmPe.comecou()) return [];
    for (const m of G.sitio.mudas) if (!m.contada && Sitio.estadoMuda(m, dia) === 'arvore') { m.contada = true; G.mataEmPe.arvores++; }
    const novos = MataEmPe.MARCOS().filter(n => G.mataEmPe.arvores >= n && !G.mataEmPe.marcos.includes(n));
    G.mataEmPe.marcos.push(...novos);
    return novos;
  },
  alcancou(n) { return G.mataEmPe.marcos.includes(n); },
  // Os ganhos lidos pelos sistemas (a reposição da mata e os achados da serra, T16): o padrão sem o marco.
  _ganho(campo, padrao) { let v = padrao; for (const n of MataEmPe.MARCOS()) { const g = ECO.serra.mataEmPe.marcos[n]; if (MataEmPe.alcancou(n) && campo in g) v = g[campo]; } return v; },
  repoeArvores() { return MataEmPe._ganho('repoeArvores', ECO.mata.repoe.arvores); },
  maximoArvores() { return MataEmPe._ganho('maximoArvores', ECO.mata.repoe.maximo.arvores); },
  achadosSerra() { return ECO.serra.achados + MataEmPe._ganho('achados', 0); },
};
INICIADORES.push(s => MataEmPe.iniciar(s));
COLETORES.push(s => MataEmPe.salvar(s));
