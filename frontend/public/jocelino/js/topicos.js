// Família Santos — topicos.js — os tópicos de conversa, os "rumores" da Vila (T4 das conversas e histórias; spec
// docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seção 3.3; a ordem das falas é a do conversas.js, 3.2).
// Como é no Stardew (Conversation Topics): um acontecimento abre uma marca que vale N dias (o ônibus consertado, `cc_Bus`, 7 dias;
// a 1ª visita a um mapa; o casamento); enquanto ela vale, cada morador comenta o assunto UMA vez, com a fala dele; depois ela vence
// e a Vila volta ao de sempre. Não tem fofoca separada: a fofoca são esses comentários e as falas que entregam o gosto de outra
// pessoa (a partir de 1 coração com ela, a família e os amigos dão a dica; Friendship, na wiki).
// Aqui:
// - OS MARCOS: o que o jogo já mede (a pensão aberta, o degrau, a função na obra, as obras entregues, a casa da família, o Grêmio,
//   a matéria do Paladar, o concurso da Rádio, a festa encomendada que saiu, a serra aberta, a firma). Um marco é um número que só
//   sobe; quando sobe, o tópico dele abre (G.topicos[id] = o último dia em que vale) e o que interessa à fala (qual obra, qual
//   estrela, qual festa) fica em G.topicosInfo. Um só observador, em vez de um gancho em cada arquivo: o save de antes da T4
//   não dispara tudo de uma vez (os marcos que já tinha entram calados), e nada muda nas regras puras (Pensao, Obra, Gremio...),
//   que o simulador também roda. O observador olha de manhã, à noite (o degrau sobe na janta) e antes de cada conversa (a promoção
//   da tarde já é assunto do Zé na mesma tarde).
// - AS FALAS: cada pessoa comenta no tom dela (as linhas `{ quando: { topico } }` entram nas tabelas do falas.js). Quem é o assunto
//   não comenta de fora (a dona da festa já tem a fala dela, a `encomenda` 'depois').
// - A FOFOCA DOS GOSTOS: com 1 coração com alguém da Vila, quem é próximo dele solta a dica uma vez (a linha `descobre`, regra 5)
//   e o gosto fica descoberto (Conversas.descobrir; a aba Gente mostra).
// - Os tópicos que outros abrem: a cena de história abre `historia_<id>` por 4 dias (historias.js); Topicos.abrir(id, dias, info)
//   serve a quem quiser abrir um tópico na hora (uma carta, um evento). G.topicos vai no save pelo historias.js.
// Só temas leves (decisão 2 da seção 13); nenhuma fala manda fazer nada (vivência, não missões): comentam o que aconteceu.

const TOPICO_GUARDA = 28;   // um tópico vencido há mais de 28 dias sai do save (com as marcas de quem já comentou)

// ---------- os marcos: { id, topico, dias, valor() (um número que só sobe), abre(v, antes) (opcional), info(v) } ----------
const _pensaoT = () => G.pensao && typeof G.pensao === 'object' ? G.pensao : null;
const _grauT = () => { const p = _pensaoT(); return p && typeof p.grau === 'function' ? Math.max(p.grau(), p.grauMinimo || 1) : 1; };
const _obraFeitaT = id => () => {   // a obra do Bira entregue (o índice só passa dela quando ela fica pronta; o prédio, só de mestre)
  if (!G.obra || typeof OBRAS === 'undefined') return 0;
  const k = OBRAS.findIndex(o => o.id === id); if (k < 0) return 0;
  return G.obra.indice > k && (id !== 'predio' || G.obra.funcao >= 3) ? 1 : 0;   // (as reformas do pedreiro passam o índice do prédio: não conta)
};
const _festasFeitasT = () => ((_pensaoT() || {}).agenda || []).filter(e => e && e.tipo === 'encomenda' && e.fim === 'feita');
const TOPICOS_MARCOS = [
  { id: 'pensao_abriu', topico: 'pensao_abriu', dias: 7,   // a 1ª janta (a inauguração; ou a Rosa sozinha)
    valor: () => { const p = _pensaoT(); return p && p.estado === 'aberta' && p.ultimaJanta != null && p.ultimaJanta >= 0 ? 1 : 0; } },
  { id: 'pensao_estrela', topico: 'pensao_estrela', dias: 5,   // o degrau novo (as cartas fama_N): a 1ª estrela é o degrau 2
    valor: _grauT, abre: v => v >= 2, info: v => ({ estrelas: v - 1 }) },
  { id: 'promovido', topico: 'promovido', dias: 7,   // Obra.subir() (o Bira) e a proposta do Seu Moreira (o mestre)
    valor: () => G.obra ? G.obra.funcao || 0 : 0, info: v => ({ funcao: v }) },
  ...['casa_zelia', 'mercado', 'escola'].map(id => ({ id: 'obra_' + id, topico: 'obra_entregue', dias: 4, valor: _obraFeitaT(id), info: () => ({ obra: id }) })),
  { id: 'obra_predio', topico: 'predio_entregue', dias: 7, valor: _obraFeitaT('predio') },
  { id: 'casa_etapa', topico: 'casa_etapa', dias: 4,   // uma etapa da casa da família pronta (a última é a mudança: o tópico de baixo)
    valor: () => G.casa ? G.casa.etapa || 0 : 0, abre: v => !(G.casa && G.casa.mudou), info: v => ({ etapa: v }) },
  { id: 'casa_mudou', topico: 'casa_mudou', dias: 7, valor: () => G.casa && G.casa.mudou ? 1 : 0 },
  { id: 'gremio_ala', topico: 'gremio_ala', dias: 5,
    valor: () => G.gremio && G.gremio.alas ? Object.keys(G.gremio.alas).length : 0,
    info: () => { const a = G.gremio.alas, id = Object.keys(a).sort((x, y) => a[y] - a[x])[0]; return { ala: id }; } },
  { id: 'paladar_veio', topico: 'paladar_veio', dias: 4,   // a matéria da Gazeta (sai no dia seguinte ao da visita)
    valor: () => ((_pensaoT() || {}).paladarNotas || []).filter(n => n && n.dia < G.dia).length,
    info: () => { const l = (_pensaoT().paladarNotas || []).filter(n => n && n.dia < G.dia); return { garfos: (l[l.length - 1] || {}).nota || 0 }; } },
  { id: 'concurso_venceu', topico: 'concurso_venceu', dias: 5,
    valor: () => Object.values((_pensaoT() || {}).concursos || {}).filter(v => v === 'venceu').length },
  { id: 'festa_encomenda', topico: 'festa_encomenda', dias: 4,   // a festa de um morador que saiu na pensão (encomendas.js)
    valor: () => _festasFeitasT().reduce((m, e) => Math.max(m, e.dia || 0), 0),
    info: v => { const e = _festasFeitasT().find(x => x.dia === v) || {}; return { quem: e.quem, ocasiao: e.ocasiao }; } },
  { id: 'serra_aberta', topico: 'serra_aberta', dias: 7, valor: () => G.lugares && G.lugares.serra ? 1 : 0 },
  { id: 'firma_alvara', topico: 'firma_alvara', dias: 5, valor: () => G.firma && G.firma.capitalPago ? 1 : 0 },
  { id: 'firma_inaugurada', topico: 'firma_inaugurada', dias: 7, valor: () => G.firma && G.firma.feita ? 1 : 0 },
  // o arco do loteamento (mata-sitio 2.1; os passos andam quando a T9 da mata ligar o arco no jogo)
  { id: 'loteamento_anuncio', topico: 'loteamento_anuncio', dias: 5,
    valor: () => typeof Loteamento !== 'undefined' && G.loteamento && Loteamento.feito('anuncio') ? 1 : 0 },
  { id: 'loteamento_serra', topico: 'loteamento_serra', dias: 7,   // a audiência decidiu: a serra tombada, a capoeira com a família
    valor: () => typeof Loteamento !== 'undefined' && G.loteamento && Loteamento.feito('decisao') ? 1 : 0 },
];

const Topicos = {
  MARCOS: TOPICOS_MARCOS,
  // Abre (ou reabre) o tópico por `dias`, contando hoje (7 dias abertos na segunda valem até domingo); info vai para as falas (G.topicosInfo[id]).
  abrir(id, dias, info) {
    G.topicos = G.topicos || {}; G.topicosInfo = G.topicosInfo || {};
    G.topicos[id] = Math.max(G.topicos[id] || 0, (G.dia || 1) + (dias || 4) - 1);   // ("N dias" conta o dia em que abre: vale até hoje + N − 1)
    if (info) G.topicosInfo[id] = Object.assign({}, info); else delete G.topicosInfo[id];
    return G.topicos[id];
  },
  aberto(id) { return typeof Conversas !== 'undefined' ? Conversas.topicoAberto(id) : !!G.topicos && G.topicos[id] >= G.dia; },
  info(id) { return (G.topicosInfo || {})[id] || {}; },
  _valor(m) { try { const v = +m.valor(); return Number.isFinite(v) ? v : 0; } catch (e) { console.error(e); return 0; } },
  // Os marcos de agora, sem abrir nada (o save de antes da T4 e o jogo novo começam daqui).
  fotografar() { const r = {}; for (const m of TOPICOS_MARCOS) r[m.id] = Topicos._valor(m); return r; },
  // O observador: o marco que subiu abre o tópico dele. Devolve os tópicos abertos agora.
  conferir() {
    if (!G.marcosTopicos) { G.marcosTopicos = Topicos.fotografar(); return []; }
    const abertos = [];
    for (const m of TOPICOS_MARCOS) {
      const v = Topicos._valor(m), M = G.marcosTopicos;
      if (!(m.id in M)) { M[m.id] = v; continue; }   // (um marco novo num save de antes dele: entra calado)
      if (v <= M[m.id]) continue;                     // (o marco só sobe: o que desceu não abre de novo)
      const antes = M[m.id]; M[m.id] = v;
      if (m.abre && !m.abre(v, antes)) continue;
      let info = null; try { info = m.info ? m.info(v, antes) : null; } catch (e) { console.error(e); }
      Topicos.abrir(m.topico, m.dias, info); abertos.push(m.topico);
    }
    return abertos;
  },
  // De manhã: o vencido há mais de TOPICO_GUARDA dias sai do save, com as marcas de quem comentou os tópicos que já venceram.
  limpar() {
    const T = G.topicos || {};
    for (const id in T) if (T[id] < G.dia - TOPICO_GUARDA) { delete T[id]; if (G.topicosInfo) delete G.topicosInfo[id]; }
    const v = G.falasVistas || {};
    for (const k in v) { const m = /\|topico:(.+):(\d+)$/.exec(k); if (m && +m[2] < G.dia) delete v[k]; }
  },
  // As linhas de tópico escritas (para os testes e a aba Gente): [{ quem, topico, linha }].
  linhas() {
    const r = [];
    for (const quem in CONVERSAS) for (const l of CONVERSAS[quem].linhas || []) if (l.quando && 'topico' in l.quando) r.push({ quem, topico: l.quando.topico, linha: l });
    return r;
  },
};
INICIADORES.push(s => {
  G.topicosInfo = {}; for (const k in s.topicosInfo || {}) G.topicosInfo[k] = Object.assign({}, s.topicosInfo[k]);
  G.marcosTopicos = s.marcosTopicos ? Object.assign({}, s.marcosTopicos) : Topicos.fotografar();
});
COLETORES.push(s => {
  s.marcosTopicos = Object.assign({}, G.marcosTopicos || {});
  s.topicosInfo = {}; for (const k in G.topicosInfo || {}) s.topicosInfo[k] = Object.assign({}, G.topicosInfo[k]);
});
MANHA.push(() => { Topicos.limpar(); Topicos.conferir(); });
NOITE.push(() => { Topicos.conferir(); });
if (typeof ANTES_DE_CONVERSAR !== 'undefined') ANTES_DE_CONVERSAR.unshift(() => { try { Topicos.conferir(); } catch (e) { console.error(e); } return false; });

// ---------- as falas ----------
// _T(quem, topico, fala, se?): a linha `{ quando: { topico[, se] }, fala }` na tabela da pessoa. A fala pode ser uma função (lê o
// G.topicosInfo do tópico pelo Topicos.info); sem tabela, não entra (o povo do FALAS antigo não comenta).
// Quem tem a festa dele na pensão (marcada: o convite; ou que acabou de sair: o "depois") fala da festa, que é o assunto dele, e
// deixa o comentário da Vila para outra conversa (o tópico continua aberto). Sem isso a regra 2 calaria o convite (a 4). A festa que
// NÃO saiu (o "deixa") não passa na frente: a pessoa volta aos assuntos da Vila (a frase "deixa" sai quando não houver tópico).
const _festaPropria = quem => typeof Conversas !== 'undefined' && typeof OCASIOES !== 'undefined' && !!OCASIOES[quem]
  && !!(Conversas.encomenda(quem, true) || Conversas.encomenda(quem, 'depois'));
const _T = (quem, topico, fala, se) => { const C = CONVERSAS[quem]; if (!C) return;
  C.linhas.push({ quando: { topico, se: ctx => !_festaPropria(quem) && (!se || se(ctx)) }, fala }); };
const _cap = s => s[0].toUpperCase() + s.slice(1);
const _estrelasT = () => Topicos.info('pensao_estrela').estrelas || 1;
const _nEstrelas = n => ['', 'Uma estrela', 'Duas estrelas', 'Três estrelas', 'Quatro estrelas', 'Cinco estrelas'][n] || `${n} estrelas`;
const _funcaoT = () => Topicos.info('promovido').funcao || 1;
const _nomeFuncao = () => (typeof FUNCOES !== 'undefined' && FUNCOES[_funcaoT()]) || 'Meio-oficial';
const _obraT = () => Topicos.info('obra_entregue').obra || 'casa_zelia';
const OBRA_NA_BOCA = { casa_zelia: 'a casa da Dona Zélia', mercado: 'o Mercado reformado', escola: 'a Escola da Vila' };
const _etapaT = () => Topicos.info('casa_etapa').etapa || 1;
const CASA_NA_BOCA = ['', 'a fundação da casa de vocês tá feita', 'as paredes da casa de vocês já estão de pé', 'a casa de vocês já tem telhado',
  'a cozinha da casa nova tá pronta', 'o quarto do casal já tá pronto'];
const _casaT = () => CASA_NA_BOCA[_etapaT()] || 'a casa de vocês tá subindo';
const _alaT = () => (typeof Gremio !== 'undefined' && Gremio.ala(Topicos.info('gremio_ala').ala)) || { de: 'nova', id: '' };
const _garfosT = () => Topicos.info('paladar_veio').garfos || 0;
const _festaT = () => Topicos.info('festa_encomenda');
const _festaDe = quem => !!_festaT().quem && _festaT().quem !== quem;   // quem deu a festa não comenta de fora (tem a fala dela)
const _festaFrase = () => { const f = _festaT(), e = { quem: f.quem, ocasiao: f.ocasiao };
  if (typeof AvisoFesta === 'undefined' || !f.quem) return 'a festa na pensão';
  return `${AvisoFesta.ocasiao(e)} ${AvisoFesta.da(e)}`; };

// A pensão abriu (7 dias). "Vi a fila na porta da Rosa! Fila! Na Vila Maré!"
_T('ananias', 'pensao_abriu', ['@alegre Vi a fila na porta da Rosa, freguês! Fila! Na Vila Maré!', 'Já separei mais um saco de feijão: do jeito que vai, ela volta amanhã.']);
_T('zelia', 'pensao_abriu', ['@alegre A pensão abriu, meu filho! A Vila tava precisando de um fogão aceso de noite.', 'Agora só falta um caldo verde no quadro de giz, viu?']);
_T('ze', 'pensao_abriu', ['@alegre A peãozada só fala da janta da Rosa. O Severino jura que repetiu três vezes.']);
_T('tonico', 'pensao_abriu', ['Pensão aberta na Vila de novo. Desde a Dona Cotinha que eu não jantava fora.']);
_T('lourival', 'pensao_abriu', ['@alegre Abriu a pensão, compadre? Então peixe fresco tem freguês certo.']);
_T('bira', 'pensao_abriu', ['@alegre Viu só, rapaz? Eu disse que a peãozada ia jantar na sua patroa. Foi metade da turma!']);
_T('juca', 'pensao_abriu', ['@alegre A Rosa nem dormiu de tão contente. A luz da cozinha ficou acesa até tarde.']);
_T('rosa', 'pensao_abriu', ['@emocionada Jocelino... a gente abriu. A pensão abriu de verdade.', '@alegre Desde Aracaju eu sonho com isso, e agora o fogão é meu.']);
_T('ritinha', 'pensao_abriu', ['@alegre Pai, eu contei: a mãe serviu prato pra gente que eu nem conhecia!']);
_T('zezinho', 'pensao_abriu', ['@alegre Pai, eu falei pra escola inteira que a mãe tem um restaurante!']);

// A estrela nova da pensão (5 dias; reabre a cada degrau).
_T('tonico', 'pensao_estrela', () => _estrelasT() >= 3 ? ['Dizem que já tem até gente de Santos jantando na sua patroa. Estrela não vem à toa.']
  : ['Estrela nova na pensão, hein? Serviço bem feito a gente reconhece de longe.']);
_T('ananias', 'pensao_estrela', () => _estrelasT() >= 5 ? ['@alegre Patrimônio da Vila, freguês! Placa de bronze e tudo. Vou contar pros netos que eu vendi o primeiro feijão.']
  : ['@alegre Estrela nova na pensão! A Rosa leva tanto feijão que eu já peço o dobro pro caminhão.']);
_T('zelia', 'pensao_estrela', () => [`@alegre ${_nEstrelas(_estrelasT())}, meu filho! Eu falo pra todo mundo que eu conheço a cozinheira.`]);
_T('lourival', 'pensao_estrela', ['Pensão de estrela pede peixe de estrela, compadre. O mar tá ajudando.']);
_T('ze', 'pensao_estrela', ['@alegre Mais uma estrela pra Rosa! Daqui a pouco a peãozada não acha banqueta.']);
_T('juca', 'pensao_estrela', () => _estrelasT() >= 5 ? ['@alegre Cinco estrelas, rapaz. Escrevi pro compadre de Sergipe: a Rosa é a cozinheira mais falada do litoral.']
  : ['@alegre Mais uma estrela pra Rosa. Panela boa e mão boa, rapaz: não tem segredo.']);
_T('rosa', 'pensao_estrela', () => _estrelasT() >= 5 ? ['@emocionada Cinco estrelas, amor. A placa de bronze na porta da Dona Cotinha...', 'Amanhã eu escrevo pra Vó Ia contando. Ela vai mostrar a carta pra Itabaiana inteira.']
  : ['@emocionada Mais uma estrela, amor. Às vezes eu olho o quadro de giz e nem acredito.']);
_T('ritinha', 'pensao_estrela', () => _estrelasT() >= 5 ? ['@alegre Cinco de cinco, pai! Não tem mais conta pra fazer!']
  : [`@alegre ${_nEstrelas(_estrelasT())}, pai! Faltam ${5 - _estrelasT()} pra cinco. Eu fiz a conta.`]);
_T('zezinho', 'pensao_estrela', ['@alegre Pai, a mãe é famosa? O menino da escola disse que a mãe é famosa!']);

// A promoção (7 dias): meio-oficial, pedreiro, mestre de obras.
_T('ze', 'promovido', () => _funcaoT() >= 3 ? ['@alegre Mestre Jocelino! Pode mandar, chefe... mas manda com jeito, que eu sou sensível.']
  : _funcaoT() === 2 ? ['@alegre Pedreiro, Jocelino! Daqui a pouco é você que me dá ordem.'] : ['@alegre Meio-oficial, Jocelino! Agora o guaraná é por sua conta.']);
_T('bira', 'promovido', () => _funcaoT() >= 3 ? ['@alegre Mestre de obras, rapaz. O Seu Moreira não erra na escolha. Eu sabia desde o primeiro balde de massa.']
  : ['Ofício se pega fazendo, rapaz. E você faz direito.']);
_T('zelia', 'promovido', () => [`@alegre ${_nomeFuncao()}! Eu sempre soube, meu filho. Quem capricha na casa dos outros sobe.`]);
_T('juca', 'promovido', () => _funcaoT() >= 3 ? ['@alegre De servente a mestre de obras, Jocelino. Devagar e sempre, como eu disse.']
  : _funcaoT() === 2 ? ['@alegre Pedreiro na família! Parede no prumo é coisa que dá orgulho, rapaz.']
  : ['@alegre Meio-oficial! Agora sim: o terreno das bandeirinhas tá esperando vocês.']);
_T('rosa', 'promovido', () => [`@alegre Meu marido é ${_nomeFuncao().toLowerCase()}! Hoje a janta da família tem sobremesa.`]);
_T('tonico', 'promovido', () => [`${_nomeFuncao()}? Função nova merece ferramenta à altura. Ferro bom não deixa o serviço na mão.`]);
_T('ananias', 'promovido', ['@alegre Soube que subiu de função, freguês! Desconto não dou, mas dou os parabéns.']);
_T('lourival', 'promovido', () => [`${_nomeFuncao()}, compadre? No mar a gente diz: quem segura firme a rede chega na proa.`]);
_T('ritinha', 'promovido', () => typeof DIARIAS !== 'undefined' && DIARIAS[_funcaoT()]
  ? [`@alegre Pai, a diária agora é Cr$ ${DIARIAS[_funcaoT()]}! Seis dias de obra dá Cr$ ${DIARIAS[_funcaoT()] * 6}. Eu fiz a conta.`] : ['@alegre Pai, subiu a diária! Eu fiz a conta.']);
_T('zezinho', 'promovido', ['@alegre Pai, agora o senhor é chefe? Posso contar pra todo mundo?']);

// A obra do Bira entregue (4 dias): a casa da Zélia, o Mercado, a Escola.
_T('zelia', 'obra_entregue', () => _obraT() === 'casa_zelia' ? ['@alegre A casa ficou um brinco, meu filho. A Marisa vai chorar quando vir.']
  : [`${_cap(OBRA_NA_BOCA[_obraT()])} ficou ${_obraT() === 'escola' ? 'bonita' : 'bonito'} que só. A Vila tá mudando de cara.`]);
_T('ananias', 'obra_entregue', () => _obraT() === 'mercado' ? ['@alegre O Mercado reformado! Agora vem gente de longe, e no caminho passa no meu depósito.']
  : ['Mais uma obra entregue! O cimento saiu daqui, viu? Faço questão de contar.']);
_T('ze', 'obra_entregue', ['@alegre Mais uma de pé, Jocelino! Cumeeira com rojão e tudo.']);
_T('juca', 'obra_entregue', () => [`Passei na frente: ${OBRA_NA_BOCA[_obraT()]}. Parede no prumo, reboco liso. Coisa de quem aprendeu direito.`]);
_T('tonico', 'obra_entregue', ['Obra entregue, ferramenta gasta. Colher que trabalhou merece um trato de lima.']);
_T('lourival', 'obra_entregue', () => [`Do píer dá pra ver ${OBRA_NA_BOCA[_obraT()]}, compadre. De longe parece cartão-postal.`]);
_T('zezinho', 'obra_entregue', () => _obraT() === 'escola' ? ['@alegre Pai, eu vou estudar na escola que o senhor fez!']
  : ['@alegre Pai, o senhor fez aquilo tudo? Com a mão?']);

// O Edifício Maré pronto (7 dias). "Prédio de quatro andares na Vila Maré. Quem diria."
_T('ananias', 'predio_entregue', ['Prédio de quatro andares na Vila Maré. Quem diria.', '@alegre E o cimento todo passou por este balcão, freguês!']);
_T('zelia', 'predio_entregue', ['@surpreso Quatro andares, meu filho! Da minha janela eu vejo o prédio inteiro.']);
_T('lourival', 'predio_entregue', ['@alegre Do mar dá pra ver o Edifício Maré, compadre. Virou ponto de referência: rema até o prédio e vira pra esquerda.']);
_T('bira', 'predio_entregue', ['@alegre O Edifício Maré de pé, rapaz. Trinta anos de obra e eu nunca vi mestre tão moço.']);
_T('ze', 'predio_entregue', ['@alegre Subi na cobertura só pra olhar, Jocelino. Lá de cima dá pra ver Santos!']);
_T('tonico', 'predio_entregue', ['Prédio daquele tamanho e nenhuma ferramenta quebrada na obra. Isso eu chamo de mestre.']);
_T('juca', 'predio_entregue', ['@alegre Meu sobrinho levantou um prédio. Vou pendurar uma foto dele na varanda.']);
_T('rosa', 'predio_entregue', ['@alegre Um prédio inteiro, amor! E a janta de hoje é por conta da casa: pra família toda.']);
_T('zezinho', 'predio_entregue', ['@alegre Pai, o prédio é o maior do mundo?', '...O maior da Vila? Tá bom, serve.']);

// A casa da família: cada etapa (4 dias) e a mudança (7 dias).
_T('juca', 'casa_etapa', () => [`@alegre Do meu quintal eu vejo: ${_casaT()}. Tô contando os dias, rapaz.`]);
_T('zelia', 'casa_etapa', () => [`Soube que ${_casaT()}. Casa própria é outra coisa, meu filho.`]);
_T('rosa', 'casa_etapa', () => [`@alegre Amor, ${_casaT()}! Toda noite eu passo na frente só pra olhar.`]);
_T('ritinha', 'casa_etapa', () => { const L = typeof ECO !== 'undefined' && ECO.casa ? ECO.casa.etapas.length : 6;
  return [`@alegre Pai, já foram ${_etapaT()} de ${L} etapas da casa. Falta${L - _etapaT() > 1 ? 'm' : ''} ${L - _etapaT()}. Eu fiz a conta.`]; });
_T('zezinho', 'casa_etapa', ['@alegre Pai, qual vai ser o meu quarto? Eu quero o da janela!']);
_T('ze', 'casa_etapa', ['Casa de pedreiro sai torta? Que nada. A sua tá no prumo, eu passei lá e conferi.']);
_T('juca', 'casa_mudou', ['Casa vazia é casa sossegada.', '@pensativo Mas eu já tô com saudade do Zezinho chutando a cama.']);
_T('zelia', 'casa_mudou', ['@alegre Casa nova, vida nova! Uma muda de flor na porta dá sorte, meu filho.']);
_T('ananias', 'casa_mudou', ['Mudaram, freguês? Prego, gancho de rede, cortina: casa nova sempre pede uma coisinha.']);
_T('lourival', 'casa_mudou', ['@alegre Casa nova, compadre! Pescador diz que casa é igual canoa: a gente só sente que é nossa depois da primeira chuva.']);
_T('ze', 'casa_mudou', ['@alegre Quando tiver o churrasco da casa nova, eu levo o pandeiro, Jocelino.']);
_T('tonico', 'casa_mudou', ['Casa nova pede tranca boa na porta. Coisa de ferreiro, não liga.']);
_T('ritinha', 'casa_mudou', ['@alegre Pai, eu tenho uma gaveta só minha! Já arrumei os cadernos.']);
_T('zezinho', 'casa_mudou', ['@alegre Pai, o meu quarto tem janela! Dá pra ver o Caramelo dormindo!']);

// A matéria do Doutor Paladar na Gazeta (4 dias). "Saiu no jornal! Recortei e colei na prancheta."
_T('bira', 'paladar_veio', ['@alegre Saiu no jornal, rapaz! Recortei e colei na prancheta.']);
_T('ananias', 'paladar_veio', ['A Gazeta falou da pensão! Comprei três jornais: um pra mim, um pra vitrine e um pra minha irmã.']);
_T('zelia', 'paladar_veio', ['@surpreso Li a Gazeta, meu filho. O tal Doutor Paladar... eu bem que achei aquele chapéu-coco esquisito.']);
_T('tonico', 'paladar_veio', () => [`${_garfosT() || 'Uns'} garfo${_garfosT() === 1 ? '' : 's'} na Gazeta! Garfo eu sei forjar, mas esse aí é de outro tipo.`]);
_T('juca', 'paladar_veio', ['@alegre A Rosa no jornal de Santos, rapaz! Guardei a página na gaveta, junto com o papel da roça.']);
_T('rosa', 'paladar_veio', () => _garfosT() >= 4 ? ['@emocionada Saiu no jornal, amor. A Gazeta de Santos! Eu li três vezes.']
  : ['@pensativo O Doutor Paladar escreveu, amor... Da próxima vez ele vai ver o meu melhor prato.']);
_T('ritinha', 'paladar_veio', ['@alegre Pai, eu recortei a matéria da mãe e levei pra escola!']);

// O Concurso da Rádio ganho (5 dias).
_T('tonico', 'concurso_venceu', ['@alegre Ouvi no rádio da ferraria: a Pensão da Rosa ganhou o concurso! Bati o martelo de alegria.']);
_T('lourival', 'concurso_venceu', ['@alegre Ganhou da Rádio, compadre! A gente ouviu tudo no barco, e o peixe nem mordeu de tanto que eu gritei.']);
_T('zelia', 'concurso_venceu', ['@alegre O troféu na parede da pensão! Eu fui ver de pertinho, meu filho.']);
_T('ananias', 'concurso_venceu', ['@alegre Campeã da Rádio! Daqui a pouco o povo pede o feijão "da marca da Rosa".']);
_T('ze', 'concurso_venceu', ['@alegre A Rosa ganhou da Rádio! Vou fazer um samba pra ela, já tenho até o refrão.']);
_T('rosa', 'concurso_venceu', ['@emocionada O troféu, amor! Eu tremia tanto que quase derrubei a panela na frente do jurado.']);
_T('zezinho', 'concurso_venceu', ['@alegre Pai, a mãe ganhou um troféu! Posso segurar? Só um pouquinho?']);

// A festa encomendada que saiu na pensão (4 dias): o batizado do neto da Dona Zélia, a laje batida da turma do Bira...
// (quem deu a festa não comenta de fora: tem a fala `encomenda` 'depois', falas.js)
_T('zelia', 'festa_encomenda', () => [`Me contaram que ${_festaFrase()} foi na pensão. Dizem que não sobrou nem farelo, meu filho.`], () => _festaDe('zelia'));
_T('ananias', 'festa_encomenda', () => [`${_cap(_festaFrase())} foi na pensão da Rosa! O povo veio comprar guardanapo aqui no dia.`], () => _festaDe('ananias'));
_T('tonico', 'festa_encomenda', () => [`Soube que ${_festaFrase()} foi na pensão. Festa assim, na Vila, é coisa rara. E boa.`], () => _festaDe('tonico'));
_T('lourival', 'festa_encomenda', () => [`@alegre ${_cap(_festaFrase())} foi na pensão, compadre! Até no píer chegou o cheiro.`], () => _festaDe('lourival'));
_T('ze', 'festa_encomenda', () => [`@alegre Viu só, Jocelino? ${_cap(_festaFrase())} foi na pensão! A Rosa é festa que não acaba.`], () => _festaDe('ze'));
_T('juca', 'festa_encomenda', () => [`${_cap(_festaFrase())} foi na pensão. Quando eu era moço, festa assim era no quintal, com lampião.`], () => _festaDe('juca'));
_T('ritinha', 'festa_encomenda', () => [`@alegre Pai, ${_festaFrase()} foi na pensão da mãe! Eu ajudei a pôr os talheres.`], () => _festaDe('ritinha'));

// Uma ala do Grêmio pronta (5 dias).
_T('zelia', 'gremio_ala', () => [`@alegre A ala ${_alaT().de} do Grêmio tá pronta! Vou estrear vestido no baile, meu filho.`]);
_T('ze', 'gremio_ala', ['@alegre O Grêmio tá voltando, Jocelino! Grêmio de pé é samba de volta.']);
_T('tonico', 'gremio_ala', () => _alaT().id === 'oficina' ? ['@alegre A Oficina do Grêmio pronta! Agora a ferramenta sai em um dia, palavra de ferreiro.']
  : [`A ala ${_alaT().de} do Grêmio ficou pronta. O clube de novo de pé, quem diria.`]);
_T('ananias', 'gremio_ala', () => _alaT().id === 'deposito' ? ['@alegre O Depósito do Grêmio pronto! Freguês de Grêmio tem os seus dez por cento aqui.']
  : [`A ala ${_alaT().de} do Grêmio tá pronta. A Vila inteira passa na frente pra olhar.`]);
_T('lourival', 'gremio_ala', () => _alaT().id === 'aquario' ? ['@alegre O Aquário do Grêmio! Tem peixe lá que eu mesmo pesquei, compadre.']
  : [`@alegre A ala ${_alaT().de} do Grêmio tá pronta, compadre. No meu tempo o baile ia até o sol nascer.`]);
_T('juca', 'gremio_ala', ['@alegre Eu dancei no Grêmio quando era moço, sabia? Ver ele de pé de novo me dá vontade de pegar a viola.']);

// A serra aberta (7 dias): a ponte da mata escorada. Como a 1ª visita a um mapa novo no Stardew.
_T('lourival', 'serra_aberta', ['@alegre Ponte firme, compadre: a serra tá aberta. Lá em cima mora o Nhô Quim, gente boa, conhece cada pé de juçara.']);
_T('juca', 'serra_aberta', ['@pensativo A serra... Quando eu era moço, a gente subia a trilha pra ver a cachoeira. O Nhô Quim ainda mora lá em cima.']);
_T('zelia', 'serra_aberta', ['A serra, meu filho? Cuidado com cobra. E se achar uma flor bonita por lá, lembra de mim.']);
_T('tonico', 'serra_aberta', ['Dizem que a ponte da mata tá firme de novo. Escora boa, aquilo é serviço de quem sabe.']);
_T('zezinho', 'serra_aberta', ['@alegre Pai, na serra tem onça? O menino da escola disse que tem onça! Tem?']);

// A firma: o alvará pago (5 dias) e a inauguração da Construtora Santos (7 dias).
_T('lourival', 'firma_alvara', ['@alegre Construtora Santos! Vou pintar o nome na minha canoa, compadre.']);
_T('ananias', 'firma_alvara', ['@alegre Construtora Santos, hein? Vou separar uma prateleira do depósito só pra firma.']);
_T('bira', 'firma_alvara', ['Firma no papel, rapaz. A turma já tá falando em trabalhar pra você.']);
_T('ze', 'firma_alvara', ['@alegre Construtora Santos! Já ensaiei a marchinha da inauguração.']);
_T('zelia', 'firma_alvara', ['@alegre Uma construtora com o nome da família, meu filho! A Zefa vai ficar boba.']);
_T('tonico', 'firma_alvara', ['Firma nova pede ferramenta com o nome gravado. Deixa comigo.']);
_T('juca', 'firma_alvara', ['@alegre A sala da frente da minha casa vai virar escritório. Vou tirar a poeira da escrivaninha.']);
_T('ananias', 'firma_inaugurada', ['@alegre Que festa, freguês! A Vila não vê uma coisa daquelas desde o tempo do Grêmio cheio.']);
_T('zelia', 'firma_inaugurada', ['@alegre A Dona Zefa é um amor de pessoa, meu filho. Disse que volta no Natal!']);
_T('lourival', 'firma_inaugurada', ['@alegre Dancei até o pé doer, compadre. Hoje nem o mar me tira da rede.']);
_T('bira', 'firma_inaugurada', ['@alegre A placa na porta do Juca ficou bonita, rapaz. Construtora Santos. Eu passo na frente devagar só pra ler.']);
_T('ze', 'firma_inaugurada', ['@alegre O samba da festa ainda tá na minha cabeça, Jocelino! E a Rosa dançando, você viu?']);
_T('tonico', 'firma_inaugurada', ['Do servente que chegou de Aracaju ao dono de construtora. Ferro bom é assim: quanto mais apanha, mais firme fica.']);
_T('juca', 'firma_inaugurada', ['@alegre Construtora Santos.', 'Quando você chegou com a mala, eu sabia que ia dar certo. Só não sabia que ia dar tão certo.']);
_T('rosa', 'firma_inaugurada', ['@emocionada Amor... a pensão de cinco estrelas e a firma com o nosso nome. A gente conseguiu.']);
_T('ritinha', 'firma_inaugurada', ['@alegre Pai, eu posso ser a contadora da firma? Eu já sei a tabuada inteira!']);
_T('zezinho', 'firma_inaugurada', ['@alegre Pai, quando eu crescer eu vou ser mestre de obras na Construtora Santos!']);

// O loteamento (o arco da mata-sitio 2.1): o anúncio do "Jardim da Serra" e a serra tombada.
_T('tonico', 'loteamento_anuncio', ['Estaca na mata? Esse Moreira não sossega.']);
_T('lourival', 'loteamento_anuncio', ['@pensativo Loteamento na serra, compadre? A nascente que enche o rio vem de lá de cima.']);
_T('zelia', 'loteamento_anuncio', ['@pensativo "Jardim da Serra"... Bonito no papel, meu filho. Mas jardim mesmo é a mata.']);
_T('juca', 'loteamento_anuncio', ['@pensativo A roça velha é nossa, rapaz. O papel da posse tá na gaveta, eu guardo desde moço.']);
_T('lourival', 'loteamento_serra', ['@alegre A serra tombada, compadre! A nascente tá a salvo, e o rio também.']);
_T('zelia', 'loteamento_serra', ['@alegre A Vila inteira assinou a lista, meu filho. Eu assinei com caneta de festa.']);
_T('tonico', 'loteamento_serra', ['A audiência acabou bem. Bom senso também se forja, rapaz.']);
_T('juca', 'loteamento_serra', ['@alegre A capoeira continua da família. A mangueira do meu pai agradece.']);

// ---------- a fofoca dos gostos (spec 3.3): com 1 coração com a pessoa, quem é próximo dela dá a dica, uma vez ----------
// Vale como estado (regra 5: abaixo do tópico e da festa). A dica que o presente já descobriu não sai mais (Conversas.descobriu).
// A FOFOCA PASSA A VEZ À PENDÊNCIA: no empate da regra 5, a dica não tapa a linha que guia o jogador. Quem fala tem pendência quando
// uma linha de estado dele casa agora e é de guia: as da Rosa todas (o sonho e a lojinha, a limpeza, cada etapa da reforma, a pensão
// pronta, a festa marcada e a despensa) e as marcadas com `pendencia: true` (as que vierem: a casa, os arcos). O sabor que vale sempre
// (o Tio Juca com a pensão aberta) não segura a dica: os dois se revezam pelo dia.
const FOFOCA_CORACOES = 1;
const FOFOCA_CEDE_SEMPRE = ['rosa'];
const _pendente = (quem, ctx) => ((CONVERSAS[quem] || {}).linhas || []).some(l => !l.descobre && l.quando && Conversas.regraDe(l.quando) === 5
  && (l.pendencia || FOFOCA_CEDE_SEMPRE.includes(quem)) && Conversas.casa(l.quando, ctx));
const _fofoca = (quem, alvo, itens, fala) => {
  const C = CONVERSAS[quem]; if (!C) return;
  const its = [].concat(itens);
  C.linhas.push({ quando: { se: ctx => typeof Amizade !== 'undefined' && Amizade.coracoes(alvo) >= FOFOCA_CORACOES && its.some(i => !Conversas.descobriu(alvo, i)) && !_pendente(quem, ctx) },
    uma: true, id: `fofoca:${quem}:${alvo}:${its.join(',')}`, descobre: { [alvo]: its }, fala });
};
// a Dona Zélia
_fofoca('juca', 'zelia', 'flor', ['A Zélia é doida por flor do mato. Leva uma que ela te adota.']);
_fofoca('rosa', 'zelia', 'cocada', ['A Dona Zélia adora uma cocada, amor. Ela me contou que a mãe dela fazia no tacho.']);
_fofoca('ananias', 'zelia', 'goiaba', ['A Dona Zélia compra goiaba aqui toda semana. Diz que é pro doce, mas come no caminho.']);
_fofoca('tonico', 'zelia', 'ferro_velho', ['Ferro velho pra Dona Zélia? Nem pensar. Ela diz que ferrugem estraga até o humor.']);
// o Mestre Bira
_fofoca('ze', 'bira', 'cafe', ['O Mestre Bira? Café, Jocelino. Sem um cafezinho ele não risca nem parede.']);
_fofoca('rosa', 'bira', 'marmita', ['@alegre O Bira raspa a marmita até brilhar. Marmita minha ele não recusa nunca.']);
_fofoca('ze', 'bira', 'cocada', ['Doce pro Bira não, hein! Cocada ele diz que gruda no dente, e dente de mestre é ferramenta.']);
_fofoca('ritinha', 'bira', 'lapis', ['@alegre O Mestre Bira me pediu um lápis de cor emprestado. Ele adora lápis! Acho que ele desenha escondido.']);
// o Zé
_fofoca('bira', 'ze', ['quentao', 'pamonha'], ['O Zé? Quentão e pamonha, rapaz. Dá isso que ele canta o dia inteiro.']);
_fofoca('juca', 'ze', 'milho', ['O Zé do samba vive pedindo milho verde da horta. Diz que dá inspiração.']);
_fofoca('lourival', 'ze', 'pedra', ['Pedra pro Zé não, compadre. Ele diz que já carrega o dia todo.']);
// o Seu Lourival
_fofoca('tonico', 'lourival', 'cachimbo', ['O Lourival perdeu o cachimbo dele no mar e nunca achou outro igual. Cachimbo entalhado, ele ama.']);
_fofoca('rosa', 'lourival', 'peixe_frito', ['Peixe frito pro Lourival não, amor. Ele diz que peixe frito ele frita o dele.']);
_fofoca('zezinho', 'lourival', 'caranguejo', ['@alegre Pai, o Seu Lourival me mostrou um caranguejo! Ele disse que é o bicho que ele mais gosta no mundo.']);
_fofoca('ananias', 'lourival', 'farinha', ['O Lourival leva farinha toda semana. Peixe sem farinha, ele diz, é peixe triste.']);
