// Família Santos — historias.js — o motor das histórias (as "cenas" no próprio mapa; T7 das conversas e histórias; spec
// docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seção 6 e a 1.3).
// Como é no Stardew (os eventos de coração; Modding:Event data): uma cena curta NO PRÓPRIO MAPA, escrita como uma lista de passos
// (andar, falar com o retrato e a emoção, balão, pausa, câmera, música, escolha). Ela dispara quando várias condições se somam
// (corações, o lugar, a hora, a chuva, o dia da semana, uma cena anterior) e por isso parece um ENCONTRO POR ACASO, e não um prêmio.
// Aqui é igual, do nosso jeito: nenhuma tela diz "história" nem "missão"; no máximo 1 cena por dia; nada tem prazo nem some (se o
// Jocelino não passa no lugar, a cena espera); a 1ª vez toca inteira e a já vista (rever) pode ser pulada.
//
// COMO SE ESCREVE UMA HISTÓRIA (T9–T15: historias/<pessoa>.js, carregado depois deste arquivo):
//   HISTORIAS.zelia_4 = {
//     quem: 'zelia', coracoes: 4, titulo: 'A novidade da Marisa',      // quem: a pessoa do arco (a aba Gente e as Lembranças)
//     clima: 'A Dona Zélia anda olhando muito o correio',               // (opcional) a frase de clima da aba Gente, nunca uma ordem
//     gatilho: { mapa: 'vila', hora: [8 * 60, 12 * 60], chuva: true, depois: 'zelia_2' },
//     elenco: { zelia: [37, 11, 'baixo'], jocelino: [36, 13, 'cima'] },   // onde cada um está quando a cena começa (ladrilhos do mapa)
//     musica: 'musica_dia_2',                                          // (opcional) a trilha da cena; sem ela, a do momento
//     nomes: { marisa: 'Marisa' },                                     // (opcional) o nome de quem não tem tabela em CONVERSAS
//     falaNoAlto: true,                                                // (opcional, T11) a fala no alto da tela: a gente da cena fica embaixo
//     passos: [ ...os passos abaixo... ],
//   };
// O GATILHO (tudo precisa casar; a checagem é ao entrar num mapa e a cada 10 minutos do relógio):
//   mapa: 'vila' | [...]           lugar: 'obra' | 'gremio' | ... (Conversas.lugar: o canteiro da vez, a frente do Grêmio)
//   hora: [de, até] (minutos; de ≤ agora < até)    chuva: true | false (a chuva de verdade do dia, sem sorteio)
//   semana: 'domingo' | 'Sex' | 0..6 | [...]       estacao: 'Inverno' | 0..3     dia: 1..28 (o dia da estação)    ano: 1 | 2
//   depois: 'zelia_2' | [...] (as cenas que já foram vistas)   coracoes: N (com o `quem`; só o povo da Vila; a família não tem)
//   se: () => bool (o estado do jogo: o degrau da pensão, a função na obra, a casa mudada, o Grêmio, o loteamento, a firma)
//   carta: 'id' (a carta já lida: a carta-convite, a única "lembrança" que vem do mundo)   resposta: (como no Conversas: 'marca',
//   '!marca', {id: valor})   festa: true | 'id' (a cena É da festa; sem isso, num dia de festa a cena espera)
//   As cenas da FAMÍLIA não usam `coracoes`: o gatilho delas é um marco da vida da casa (`se`, `depois`, os dias).
// OS PASSOS (cada um é uma lista; 'quem' é o id do morador no mapa, 'jocelino' é o Jocelino):
//   ['camera', quem] | ['camera', x, y]       leva a câmera devagar até a pessoa (e segue) ou até o ladrilho; espera chegar
//   ['anda', quem, x, y, 'junto'?]            anda até o ladrilho (primeiro na horizontal, depois na vertical; atravessa o que tiver no
//                                             meio: o roteiro escolhe o caminho); com 'junto' o passo seguinte começa sem esperar
//   ['vira', quem, 'baixo'|'cima'|'esquerda'|'direita'|outroQuem]
//   ['fala', quem, 'página', '@alegre página'...]   a conversa com o retrato e a emoção (@alegre, @triste, @bravo, @surpreso,
//                                             @pensativo; a Rosa também @emocionada e @amorosa); quem = null: a caixa sem ninguém
//                                             falando (o `message` do Stardew). A página pode ser uma função (ctx) => páginas
//   ['balao', quem, 'coracao'|'exclamacao'|'interrogacao'|'nota_musical'|'gota_suor'|'raiva'|'sono'|'reticencias'|'desgosto', 'junto'?]
//                                             o balão de emoção em cima da pessoa por 1,2 s (a arte a/fx/)
//   ['pausa', ms]
//   ['escolha', quem, 'texto (pode ter @emoção)', [opções], { id }?]   a pergunta com o retrato (perguntarCom). Cada opção:
//                                             { t, amizade?, resposta?: [páginas], marca?, valor?, ir?: 'rotulo' }. A amizade conta uma vez
//                                             (a pergunta ganha o id '<história>_escolhaN' se não tiver); nenhuma resposta honesta é
//                                             punida e a grosseria vale no máximo −20. Esc vale a ÚLTIMA opção: ponha a neutra por último
//   ['rotulo', 'nome']                        o ponto de salto        ['ir', 'nome']   pula para o rótulo
//   ['se', () => bool, 'rotulo']              pula para o rótulo se a condição valer (o final lê o que aconteceu: "se o B3 aconteceu")
//   ['musica', 'musica_dia_2' | '']           a trilha ('' = silêncio)   ['som', 'feito', dB?]   o efeito
//   ['aparece', quem, x, y, 'baixo'?]         põe alguém no mapa (a folha personagens/<quem>/andar)   ['some', quem]   tira
//   ['escurece', minutos?]                    a tela escurece (e o relógio anda N minutos: "mais tarde...")   ['clareia']
//   ['cena', 'id', { prato, nivel }?]         a cena de cinema com arte própria (CenaPrato.tocarEspecial; o momento grande)
//   ['fim', { ... }]                          a recompensa e o fim (sem ele, a cena acaba no último passo, sem recompensa a mais):
//       amizade: { zelia: 30 }   marca: 'x' | [...]   topico: 'id' | { id, dias } | [...]   item: { flor: 1 }   receita: 'id' | [...]
//       carta: 'id' | [...] (chega na manhã seguinte; a carta precisa existir em CARTAS)   depois: () => {...} (a mudança no mundo)
//   Toda cena vista abre o tópico 'historia_<id>' por 4 dias (a Vila comenta: a tabela 3.3).
// DURANTE A CENA: o relógio para (historiaTocando entra no menuAberto, ui.js); as faixas de cinema descem; o HUD some; ninguém passeia;
// o jogador não anda: Espaço, Enter ou clique passam as falas (e apressam a pausa). A cena já vista (rever) tem o "Pular ▸▸".
// DEPOIS: a cena fica em G.historias.vistas e não repete (Historias.rever(id): as Lembranças); quem estava no mapa volta para o lugar
// de antes (como o fim de um evento do Stardew); quem a cena trouxe (o elenco de fora e o 'aparece') sai. A mudança permanente no
// mundo é do `fim.depois` e do AO_MONTAR do arco (o mapa remonta ao carregar).
// AS 5 REGRAS DE CONVIVÊNCIA (6.2): 1) no máximo 1 cena por dia; 2) nunca na janta (o turno, ou depois das 17h com a janta por fazer),
// nunca com a 1ª vez do guia na tela (a dica do guia, a seta de uma 1ª vez, um aviso no canto), nunca num dia de festa que já tem
// cena própria (a não ser a cena da festa) nem no dia da inauguração da firma; 3) duas cenas no mesmo dia: vale a mais adiantada no
// arco (mais corações, mais cenas antes dela, a `prioridade`); a outra fica para outro dia; 4) nenhuma tem prazo nem some; 5) a
// carta-convite é o único lembrete (`fim.carta` de uma cena + `gatilho.carta` da seguinte).
// O SAVE: só G.historias ({ vistas: { id: dia }, dia, cartas }), G.respostas e G.topicos. Um save gravado no meio de uma cena volta
// para ANTES dela (as escolhas, a amizade, a hora e o lugar de antes): a cena toca de novo, inteira.
// TESTES: na bateria (window.TESTE_PULA_CENAS) as cenas não disparam sozinhas, a não ser com window.TESTE_HISTORIAS = true (a s60).

const HISTORIAS = {};
const HISTORIA = {
  TOPICO_DIAS: 4,          // o tópico 'historia_<id>' (a Vila comenta por 4 dias)
  LIVRE_MS: 1200,          // o jogo livre (sem janela, aviso, cena) há 1,2 s antes de uma cena começar
  ENTRAR_MS: 600,          // depois de entrar num mapa, a checagem espera o mapa assentar
  BALAO_MS: 1200,
  CAMERA_MS: 2200,         // a câmera espera chegar, no máximo isto
  VEL: 125, VEL_JOCELINO: 150,   // px de mundo por segundo andando no roteiro
  FAIXA: 0.08,             // a altura de cada faixa de cinema (fração da tela), como as das cenas de prato
  ESCURO_MS: 600,
  // os balões que existem (a/fx/): os de antes e os 6 da T8
  BALOES: ['coracao', 'desgosto', 'exclamacao', 'balao', 'balao_pensamento', 'interrogacao', 'nota_musical', 'gota_suor', 'raiva', 'sono', 'reticencias'],
  DIRECOES: { baixo: 0, cima: 1, esquerda: 2, direita: 3 },
  GATILHO: ['mapa', 'lugar', 'hora', 'chuva', 'semana', 'estacao', 'dia', 'ano', 'depois', 'coracoes', 'se', 'carta', 'resposta', 'festa'],
  FIM: ['amizade', 'marca', 'topico', 'item', 'receita', 'carta', 'depois'],
  SITUACAO: ['mapa', 'lugar', 'hora', 'chuva', 'semana', 'estacao', 'dia', 'festa'],   // o "onde e quando" (o resto é o arco)
};
const _agoraH = () => (typeof performance !== 'undefined' ? performance.now() : 0);
const _copiaH = o => (o && typeof o === 'object' ? JSON.parse(JSON.stringify(o)) : o);

// ---------- o estado (no save): G.historias e G.topicos ----------
INICIADORES.push(s => {
  const h = s.historias || {};
  G.historias = { vistas: Object.assign({}, h.vistas || {}), dia: h.dia || 0, cartas: Array.isArray(h.cartas) ? h.cartas.slice() : [] };
  // (os tópicos da tabela 3.3 são da T4; a cena abre o 'historia_<id>' e o fim.topico, então o lugar deles no save fica garantido aqui)
  G.topicos = Object.assign({}, s.topicos || {});
  Historias._abortar();
  Historias._pendente = true; Historias._livreDesde = _agoraH();
});
COLETORES.push(s => {
  s.historias = _copiaH(G.historias || { vistas: {}, dia: 0, cartas: [] });
  s.topicos = Object.assign({}, G.topicos || {});
  // O save no meio de uma cena volta para antes dela (risco 6 da spec): as escolhas, a amizade, os tópicos, a hora e o lugar de antes.
  const h = Historias._h;
  if (h && h.revendo && h.volta) { s.mapa = h.volta.mapa; s.tile = [h.volta.tile.x, h.volta.tile.y]; }   // (rever em outro mapa: volta para onde estava)
  if (h && !h.revendo && h.antes) {
    const a = h.antes;
    s.historias = _copiaH(a.historias); s.respostas = _copiaH(a.respostas); s.amizade = _copiaH(a.amizade); s.topicos = _copiaH(a.topicos);
    s.minutos = a.minutos; s.mapa = a.mapa; s.tile = a.tile.slice();
    if (a.amizadeConversa) s.amizadeConversa = _copiaH(a.amizadeConversa);
  }
});
// A carta que uma cena manda (o fim.carta) chega na manhã seguinte.
MANHA.push(() => {
  const H = G.historias, c = G.correio; if (!H || !c || !H.cartas.length) return;
  for (const id of H.cartas) if (!c.caixa.includes(id) && !c.lidas.includes(id)) c.caixa.push(id);
  H.cartas = [];
});

const Historias = {
  _h: null,              // a cena tocando (abaixo, em tocar)
  _pendente: false,      // tem checagem a fazer (entrou num mapa, passaram 10 minutos)
  _checarApos: 0,        // ... mas só depois deste instante (o mapa assentando)
  _bloco: -1,            // o último bloco de 10 minutos visto
  _livreDesde: 0,        // desde quando o jogo está livre (sem janela, cena, aviso)
  _faixaSai: 0,          // o instante em que a cena acabou (as faixas sobem em 0,3 s)
  _ultimo: 0,

  // ---------- quem já viu o quê ----------
  viu(id) { return !!G.historias && id in G.historias.vistas; },
  vistaEm(id) { return G.historias && G.historias.vistas[id] || 0; },
  // As cenas já vistas, para rever (as Lembranças da aba Gente): [{ id, titulo, quem, dia }], na ordem em que aconteceram.
  lembrancas(quem) {
    const V = (G.historias || {}).vistas || {};
    return Object.keys(V).filter(id => HISTORIAS[id] && (!quem || HISTORIAS[id].quem === quem))
      .map(id => ({ id, titulo: HISTORIAS[id].titulo || id, quem: HISTORIAS[id].quem || '', dia: V[id] })).sort((a, b) => a.dia - b.dia);
  },

  // ---------- os gatilhos ----------
  _lista: v => [].concat(v),
  _coracoesDe(def) { const g = def.gatilho || {}; return g.coracoes != null ? g.coracoes : def.coracoes != null ? def.coracoes : null; },
  // Uma condição do gatilho: true se casa. k, v: a chave e o valor; def: a história.
  _casaUma(k, v, def) {
    const C = typeof Conversas !== 'undefined' ? Conversas : null;
    switch (k) {
      case 'mapa': return Historias._lista(v).includes(G.mapaId);
      case 'lugar': return !!C && Historias._lista(v).includes(C.lugar(G.jog));
      case 'hora': return Array.isArray(v) && G.minutos >= v[0] && G.minutos < v[1];
      case 'chuva': return !!v === (!!C && C.chove());
      case 'semana': return !!C && Historias._lista(v).some(s => C._semanaIdx(s) === C.semana());
      case 'estacao': return !!C && C._estacaoIdx(v) === C.estacao();
      case 'dia': return !!C && v === C.noEstacao();
      case 'ano': return !!C && (v >= 2 ? C.ano() >= 2 : C.ano() === v);
      case 'depois': return Historias._lista(v).every(id => Historias.viu(id));
      case 'coracoes': {
        if (!def.quem || typeof Amizade === 'undefined') return false;
        if (Amizade.familia(def.quem)) { console.warn(`historias: ${def.id || def.titulo} pede corações da família (a família não tem número: use se/depois)`); return false; }
        return Amizade.coracoes(def.quem) >= v; }
      case 'se': { try { return !!v(); } catch (e) { console.error(e); return false; } }
      case 'carta': return !!G.correio && Historias._lista(v).every(id => G.correio.lidas.includes(id));
      case 'resposta': return !!C && C.casaResposta(v);
      case 'festa': { const f = C ? C.festas() : []; return v === true ? f.length > 0 : Historias._lista(v).some(x => f.includes(x)); }
      default: console.warn(`historias: condição desconhecida "${k}" (${def.id || def.titulo})`); return false;
    }
  },
  // O gatilho inteiro (com os corações do topo). so: 'arco' só as condições do arco (sem o onde e o quando: a frase de clima),
  // 'situacao' só o onde e o quando. Devolve a 1ª condição que não casou ('' = casa tudo).
  falta(def, so = '') {
    const g = Object.assign({}, def.gatilho || {}), cor = Historias._coracoesDe(def);
    if (cor != null) g.coracoes = cor;
    for (const k in g) {
      const sit = HISTORIA.SITUACAO.includes(k);
      if ((so === 'arco' && sit) || (so === 'situacao' && !sit)) continue;
      if (!Historias._casaUma(k, g[k], def)) return k;
    }
    return '';
  },
  casa(def) { return !Historias.falta(def); },
  // A distância no arco: quantas cenas vêm antes desta (pelo `depois`).
  _fundo(id, vistos = new Set()) {
    const d = HISTORIAS[id]; if (!d || vistos.has(id)) return 0; vistos.add(id);
    const dep = d.gatilho && d.gatilho.depois; if (!dep) return 0;
    return 1 + Math.max(0, ...Historias._lista(dep).map(x => Historias._fundo(x, vistos)));
  },
  // O peso da regra 3: a mais adiantada no arco ganha.
  peso(id) { const d = HISTORIAS[id]; return (Historias._coracoesDe(d) || 0) * 100 + Historias._fundo(id) * 10 + (d.prioridade || 0); },
  // As cenas que podem tocar agora (não vistas, gatilho inteiro), da mais adiantada para a menos.
  candidatas() {
    const r = [];
    for (const id in HISTORIAS) { const d = HISTORIAS[id]; d.id = id; if (!Historias.viu(id) && Historias.casa(d)) r.push(id); }
    return r.sort((a, b) => Historias.peso(b) - Historias.peso(a));
  },
  // A cena de quem está "pronta" (o arco casa; falta só o lugar e a hora): a frase de clima da aba Gente (4.2). → { id, clima } ou null
  pronta(quem) {
    for (const id in HISTORIAS) { const d = HISTORIAS[id]; d.id = id;
      if (d.quem === quem && !Historias.viu(id) && !Historias.falta(d, 'arco')) return { id, clima: d.clima || '' }; }
    return null;
  },
  // Por que uma cena NÃO pode começar agora (as regras de convivência): '' = pode. (Não olha o 1-por-dia: isso é do disparo.)
  livre() {
    if (!G.comecou || !G.mapa || !G.jog) return 'jogo';
    if (Historias._h) return 'tocando';
    if (typeof menuAberto === 'function' && menuAberto()) return 'menu';
    if (typeof _dormindo !== 'undefined' && _dormindo) return 'dormindo';
    if (G.jog.deitado || G.jog.pescando || G.linha || G.copo) return 'ocupado';
    if (typeof _fade !== 'undefined' && _fade) return 'tela';   // (a tela ainda clareando depois de acordar: casa_dentro.js)
    if (G.turno) return 'janta';
    if (G.minutos >= 17 * 60 && typeof jantaPorFazer === 'function' && jantaPorFazer()) return 'janta';
    if (G.firma && (G.firma.inauguracaoDia === G.dia || (typeof Firma !== 'undefined' && Firma._tocando))) return 'inauguracao';
    if (typeof guiaPasso === 'function') { try { if (guiaPasso()) return 'guia'; } catch (e) { } }
    // (T15, rodada 2) a seta de uma 1ª vez segura o motor só quando aponta um alvo NESTE mapa: a seta de saída para a 1ª vez de outro
    // lugar (a carta da firma no quintal, o quadro da Prefeitura com o capital juntado, sem prazo) não prende as cenas daqui
    if (typeof setaAgora === 'function') { const s = setaAgora(); if (s && s.tipo === 'alvo' && /_vez$|^aula$|^tela_/.test(s.missao || '')) return 'guia'; }
    if (typeof document !== 'undefined' && document.getElementById) { const av = document.getElementById('avisos'); if (av && av.children && av.children.length) return 'aviso'; }
    return '';
  },
  // A checagem (ao entrar num mapa e a cada 10 minutos): a cena mais adiantada que casa, se o dia ainda não teve a dele.
  // Devolve o id da cena que começou, ou ''.
  checar() {
    Historias._pendente = false;
    if (!Historias.ligado()) return '';
    if (!G.historias || G.historias.dia === G.dia) return '';
    if (Historias.livre()) return '';
    const festa = typeof Conversas !== 'undefined' && Conversas.festas().length > 0;
    const c = Historias.candidatas().filter(id => !festa || (HISTORIAS[id].gatilho || {}).festa);
    return c.length && Historias.tocar(c[0]) ? c[0] : '';
  },
  // Na bateria de testes as cenas não disparam sozinhas (a s60 liga com TESTE_HISTORIAS).
  ligado() { return typeof window === 'undefined' || !window.TESTE_PULA_CENAS || !!window.TESTE_HISTORIAS; },

  // ---------- conferir a escrita (os testes e quem escreve) ----------
  // Os problemas de uma história: passo desconhecido, rótulo que não existe, balão sem arte, gente sem folha de andar.
  validar(def) {
    const P = [], passos = def.passos || [], rot = new Set(passos.filter(p => p[0] === 'rotulo').map(p => p[1]));
    const temArte = n => typeof ARTE_LISTA === 'undefined' || ARTE_LISTA.includes(n);
    const temSom = n => typeof SONS_LISTA === 'undefined' || SONS_LISTA.includes(n) || SONS_LISTA.some(x => x.startsWith(n + '_') && /^\d+$/.test(x.slice(n.length + 1)));
    const gente = q => q === 'jocelino' || temArte('personagens/' + q + '/andar');
    const lista = v => v == null ? [] : [].concat(v);
    // o gatilho e o fim: as chaves conhecidas e o que eles citam
    const g = def.gatilho || {};
    for (const k in g) if (!HISTORIA.GATILHO.includes(k)) P.push(`o gatilho tem a chave desconhecida "${k}"`);
    for (const id of lista(g.depois)) if (!HISTORIAS[id]) P.push(`o gatilho.depois cita "${id}", que não está em HISTORIAS`);
    for (const id of lista(g.carta)) if (typeof CARTAS !== 'undefined' && !CARTAS[id]) P.push(`o gatilho.carta cita a carta "${id}", que não existe`);
    if (def.musica && !temSom(def.musica)) P.push(`a música "${def.musica}" não existe`);
    // quem pode estar na cena: o Jocelino, o elenco, quem a cena faz aparecer e quem mora no mapa do gatilho
    const mapas = lista(g.mapa), quem = new Set(['jocelino', ...Object.keys(def.elenco || {}), ...passos.filter(p => p[0] === 'aparece').map(p => p[1])]);
    let conheceMapa = mapas.length > 0;
    for (const m of mapas) {
      if (typeof MAPAS_DEF !== 'undefined' && !MAPAS_DEF[m]) { P.push(`o mapa "${m}" não existe`); conheceMapa = false; continue; }
      try { for (const p of getMapa(m).moradores) { quem.add(p.id); if (typeof Amizade !== 'undefined' && Amizade.idDe) quem.add(Amizade.idDe(p)); } } catch (e) { conheceMapa = false; }
    }
    for (const q in def.elenco || {}) if (!gente(q)) P.push(`o elenco "${q}" não tem a folha de andar`);
    passos.forEach((p, i) => {
      const k = p[0], onde = `passo ${i + 1} (${k})`;
      if (!Historias.PASSOS[k]) { P.push(`${onde}: passo desconhecido`); return; }
      if (['fala', 'camera', 'anda', 'vira', 'balao', 'escolha'].includes(k) && typeof p[1] === 'string' && conheceMapa && !quem.has(p[1]))
        P.push(`${onde}: "${p[1]}" não está no elenco nem mora no mapa da cena`);
      if (k === 'ir' && !rot.has(p[1])) P.push(`${onde}: o rótulo "${p[1]}" não existe`);
      if (k === 'se' && !rot.has(p[2])) P.push(`${onde}: o rótulo "${p[2]}" não existe`);
      if (k === 'escolha') {
        if (!Array.isArray(p[3]) || !p[3].length) P.push(`${onde}: a escolha não tem opções`);
        for (const o of p[3] || []) if (o && o.ir && !rot.has(o.ir)) P.push(`${onde}: a opção "${o.t}" vai para o rótulo "${o.ir}", que não existe`);
      }
      if (k === 'balao' && (!HISTORIA.BALOES.includes(p[2]) || !temArte('fx/' + p[2]))) P.push(`${onde}: o balão "${p[2]}" não tem arte`);
      if (k === 'aparece' && !gente(p[1])) P.push(`${onde}: "${p[1]}" não tem a folha de andar`);
      if (k === 'cena' && typeof CENAS_ESPECIAIS !== 'undefined' && !CENAS_ESPECIAIS[p[1]]) P.push(`${onde}: a cena "${p[1]}" não existe`);
      if (k === 'musica' && p[1] && !temSom(p[1])) P.push(`${onde}: a música "${p[1]}" não existe`);
      if (k === 'som' && !temSom(p[1])) P.push(`${onde}: o som "${p[1]}" não existe`);
      if (k === 'fim') {
        const f = p[1] || {};
        for (const c in f) if (!HISTORIA.FIM.includes(c)) P.push(`${onde}: o fim tem a chave desconhecida "${c}"`);
        for (const c of lista(f.carta)) if (typeof CARTAS !== 'undefined' && !CARTAS[c]) P.push(`${onde}: a carta "${c}" não existe`);
        for (const r of lista(f.receita)) if (typeof Pratos !== 'undefined' && !Pratos.PRATOS[r]) P.push(`${onde}: a receita "${r}" não existe`);
        for (const it in f.item || {}) if (typeof Itens !== 'undefined' && !Itens.existe(it)) P.push(`${onde}: o item "${it}" não existe`);
      }
    });
    return P;
  },
  // Todas as cenas do jogo de uma vez (a s60 roda isto em toda bateria): { id: [problemas] }, só as que têm problema.
  validarTodas() { const r = {}; for (const id in HISTORIAS) { const P = Historias.validar(HISTORIAS[id]); if (P.length) r[id] = P; } return r; },

  // ---------- tocar ----------
  // Começa a cena id agora (no mapa de agora). opc: { revendo, aoAcabar }. Devolve true se começou.
  // A 1ª vez marca o dia (a regra 1); rever (as Lembranças) não conta, não dá nada e pode ser pulada.
  tocar(id, opc = {}) {
    const def = HISTORIAS[id];
    if (!def || Historias._h || !G.mapa || !G.jog) return false;
    def.id = id;
    const revendo = !!opc.revendo;
    const vez = (Historias._vez = (Historias._vez || 0) + 1);
    const conv = G.amizadeConversa;
    const h = Historias._h = { id, def, vez, revendo, podePular: revendo, i: 0, espera: null, aoAcabar: opc.aoAcabar || null,
      antes: revendo ? null : { historias: _copiaH(G.historias), respostas: _copiaH(G.respostas || {}), amizade: _copiaH(G.amizade || {}),
        topicos: _copiaH(G.topicos || {}), minutos: G.minutos, mapa: G.mapaId, tile: [Math.floor(G.jog.x / TILE), Math.floor((G.jog.y - 6) / TILE)],
        amizadeConversa: conv ? _copiaH(conv) : null },
      salvos: new Map(), novos: [], cam: null, camAlvo: 'jocelino', escuro: 0, escuroAlvo: 0, musica: null, nEscolha: 0,
      primeiraDeTodas: !Object.keys((G.historias || {}).vistas || {}).length, comecou: _agoraH(), volta: opc.volta || null };
    if (!revendo) G.historias.dia = G.dia;
    // o jogo para: as teclas soltas, o mouse solto, a pescaria recolhida; as faixas descem e o HUD some
    G.teclas.clear(); if (G.mouse) G.mouse.segura = false;
    if (typeof recolherLinha === 'function') recolherLinha();
    if (typeof document !== 'undefined' && document.body && document.body.classList) { document.body.classList.add('historia'); document.body.classList.toggle('historia-alto', !!def.falaNoAlto); }
    Historias._botaoPular();
    for (const p of G.mapa.moradores) p.andando = false;   // (quem passeava fica parado de pé, não no meio do passo)
    // o elenco no lugar
    for (const q in def.elenco || {}) { const [x, y, dir] = def.elenco[q]; Historias._poe(q, x, y, dir); }
    // a câmera parte de onde está
    const vw = G.larg / (G.zoom || 1), vh = G.alt / (G.zoom || 1);
    h.cam = { x: G.cam.x + vw / 2, y: G.cam.y + vh / 2 };
    if (def.musica != null) Historias._musica(def.musica);
    Historias._ultimo = _agoraH();
    Historias._seguir();
    return true;
  },
  // Rever uma cena já vista (as Lembranças): leva o Jocelino ao mapa da cena e, no fim, de volta. Devolve true se começou.
  // Devolve '' se começou, ou o motivo de não poder: 'nao_existe', 'nao_vista', 'tocando', 'jogo', 'menu', 'dormindo', 'ocupado',
  // 'tela', 'janta' (as mesmas do livre, sem as da 1ª vez: o rever é o jogador que pede) ou 'carga' (com carga nos braços não troca de
  // mapa: entrar na pensão larga o material, obra.js). No mapa da cena, rever ali mesmo.
  rever(id, aoAcabar) {
    const def = HISTORIAS[id]; if (!def) return 'nao_existe';
    if (!Historias.viu(id)) return 'nao_vista';
    const motivo = Historias._livreRever(); if (motivo) return motivo;
    const mapas = def.gatilho && def.gatilho.mapa ? Historias._lista(def.gatilho.mapa) : [G.mapaId];
    const mapa = mapas.includes(G.mapaId) ? G.mapaId : mapas[0];
    let volta = null;
    if (mapa !== G.mapaId && G.jog.carga && G.jog.carga.id) return 'carga';
    if (mapa !== G.mapaId && typeof entrarMapa === 'function') {
      volta = { mapa: G.mapaId, tile: { x: Math.floor(G.jog.x / TILE), y: Math.floor((G.jog.y - 6) / TILE) } };
      const j = (def.elenco || {}).jocelino, M = typeof getMapa === 'function' ? getMapa(mapa) : null;
      entrarMapa(mapa, j ? { x: j[0], y: j[1] } : (M && M.inicio) || { x: 2, y: 3 });
    }
    return Historias.tocar(id, { revendo: true, aoAcabar, volta }) ? '' : 'tocando';
  },
  _livreRever() {
    if (!G.comecou || !G.mapa || !G.jog) return 'jogo';
    if (Historias._h) return 'tocando';
    const l = Historias.livre();
    return ['menu', 'dormindo', 'ocupado', 'tela', 'janta'].includes(l) ? l : '';
  },
  tocando() { return Historias._h ? Historias._h.id : ''; },

  // ---------- os passos ----------
  // Cada passo: (h, p) => nada (passa direto) ou h.espera = { ... } (o motor espera). A lista é a referência do validar.
  PASSOS: {
    camera(h, p) {
      h.camAlvo = typeof p[1] === 'number' ? { x: (p[1] + 0.5) * TILE, y: (p[2] + 0.5) * TILE } : p[1];
      if (!p.includes('junto')) h.espera = { tipo: 'camera', ate: _agoraH() + HISTORIA.CAMERA_MS };
    },
    anda(h, p) {
      const a = Historias._ator(p[1]); if (!a) return;
      Historias._guarda(a);
      const x = (p[2] + 0.5) * TILE, y = p[3] * TILE + (a === G.jog ? 36 : 42);
      a._rota = [{ x, y: a.y }, { x, y }]; a._alvo = null;
      if (p[4] !== 'junto') h.espera = { tipo: 'anda', ator: a };
    },
    vira(h, p) {
      const a = Historias._ator(p[1]); if (!a) return;
      Historias._guarda(a);
      if (p[2] in HISTORIA.DIRECOES) a.dir = HISTORIA.DIRECOES[p[2]];
      else { const o = Historias._ator(p[2]); if (o) a.virarPara(o.x, o.y); }
    },
    fala(h, p) {
      const quem = p[1], pgs = Historias._paginas(quem, p.slice(2));
      if (!pgs.length) return;
      h.espera = { tipo: 'janela' };
      const segue = Historias._continua(h);
      if (!quem) abrirPlaca(pgs, { depois: segue });
      else abrirConversa(Historias._nome(quem), Historias._retrato(quem), pgs, segue);
    },
    balao(h, p) {
      const a = Historias._ator(p[1]); if (!a) return;
      if (!HISTORIA.BALOES.includes(p[2])) { console.warn(`historias: o balão "${p[2]}" não existe`); return; }
      a._balaoH = { nome: p[2], de: _agoraH(), ate: _agoraH() + HISTORIA.BALAO_MS };
      if (p[3] !== 'junto') h.espera = { tipo: 'tempo', ate: _agoraH() + HISTORIA.BALAO_MS };
    },
    pausa(h, p) { h.espera = { tipo: 'tempo', ate: _agoraH() + (+p[1] || 0) }; },
    escolha(h, p) {
      const quem = p[1], ops = (p[3] || []).map(o => typeof o === 'string' ? { t: o } : o), extra = p[4] || {};
      h.nEscolha++;
      const pergunta = { id: extra.id || `${h.id}_escolha${h.nEscolha}`, texto: p[2] || '', opcoes: ops };
      h.espera = { tipo: 'janela' };
      const segue = Historias._continua(h);
      const vai = (i, o) => { if (o && o.ir) Historias._pula(h, o.ir); segue(); };
      if (h.revendo || typeof Conversas === 'undefined') {
        // rever: a mesma pergunta, sem gravar nada (nem amizade, nem marca)
        const nome = Historias._nome(quem), ret = Historias._retrato(quem);
        perguntarCom(nome, ret, pergunta.texto, ops, i => {
          const o = ops[i], pg = typeof Conversas !== 'undefined' ? Conversas._paginas(o.resposta, Conversas.contexto(Historias._idConversa(quem))) : [];
          if (pg.length) abrirConversa(nome, ret, pg, () => vai(i, o)); else vai(i, o);
        });
        return;
      }
      Conversas.perguntar(Historias._pessoa(quem), pergunta, { nome: Historias._nome(quem), retrato: Historias._retrato(quem), depois: vai });
    },
    rotulo() { },
    ir(h, p) { Historias._pula(h, p[1]); },
    se(h, p) { let ok = false; try { ok = !!p[1](); } catch (e) { console.error(e); } if (ok) Historias._pula(h, p[2]); },
    musica(h, p) { Historias._musica(p[1] || ''); },
    som(h, p) { if (typeof sons !== 'undefined' && sons.tocar) sons.tocar(p[1], 1, 0.03, p[2] != null ? p[2] : -6); },
    aparece(h, p) {
      let a = Historias._ator(p[1]);
      if (a) { Historias._guarda(a); a.visivel = true; } else a = Historias._novo(p[1]);
      a.x = (p[2] + 0.5) * TILE; a.y = p[3] * TILE + (a === G.jog ? 36 : 42); a._rota = null; a.andando = false;
      if (p[4] in HISTORIA.DIRECOES) a.dir = HISTORIA.DIRECOES[p[4]];
    },
    some(h, p) {
      const a = Historias._ator(p[1]); if (!a || a === G.jog) return;
      const k = h.novos.indexOf(a);
      if (k >= 0) { h.novos.splice(k, 1); G.mapa.moradores = G.mapa.moradores.filter(x => x !== a); }
      else { Historias._guarda(a); a.visivel = false; }
    },
    escurece(h, p) {
      h.escuroAlvo = 1; h.espera = { tipo: 'escuro', ate: _agoraH() + HISTORIA.ESCURO_MS };
      const min = +p[1] || 0;
      if (min > 0 && !h.revendo) G.minutos = Math.min(relogio.FIM - 10, G.minutos + min);
    },
    clareia(h) { h.escuroAlvo = 0; h.espera = { tipo: 'escuro', ate: _agoraH() + HISTORIA.ESCURO_MS }; },
    cena(h, p) {
      if (typeof CenaPrato === 'undefined') return;
      h.espera = { tipo: 'cena' };
      CenaPrato.tocarEspecial(p[1], Historias._continua(h), p[2] || {});
    },
    fim(h, p) { h.recompensa = p[1] || {}; h.i = (h.def.passos || []).length; },
  },

  // ---------- o motor ----------
  // Anda pelos passos até um que espera (ou até o fim).
  _seguir() {
    const h = Historias._h; if (!h) return;
    const passos = h.def.passos || [];
    let guarda = 0;
    while (Historias._h === h && !h.espera) {
      if (h.i >= passos.length) { Historias._terminar(); return; }
      if (++guarda > 500) { console.warn('historias: passos demais sem esperar (laço de rótulos?)'); Historias._terminar(); return; }
      const p = passos[h.i++], f = Historias.PASSOS[p[0]];
      if (!f) { console.warn(`historias: passo desconhecido "${p[0]}" (${h.id})`); continue; }
      try { f(h, p); } catch (e) { console.warn(`historias: o passo ${p[0]} de ${h.id} deu erro:`, e && e.message); h.espera = null; }
    }
  },
  // O fim de uma espera por janela (a fala, a pergunta, a cena de cinema): só vale para a cena que a abriu.
  _continua(h) {
    let feito = false;
    return () => { if (feito || Historias._h !== h) return; feito = true; h.espera = null; Historias._seguir(); };
  },
  _pula(h, rotulo) {
    const k = (h.def.passos || []).findIndex(p => p[0] === 'rotulo' && p[1] === rotulo);
    if (k < 0) console.warn(`historias: o rótulo "${rotulo}" não existe (${h.id})`); else h.i = k + 1;
  },
  // A cada quadro (com o jogo pausado): a gente andando, o balão, a câmera, a espera e o escuro.
  _quadro() {
    const h = Historias._h, agora = _agoraH(), dt = Math.min(0.05, Math.max(0, (agora - (Historias._ultimo || agora)) / 1000));
    Historias._ultimo = agora;
    if (!h) return;
    const pressa = h.pressa ? 3 : 1;
    // quem anda pelo roteiro (o jogo está pausado: o motor move e anima)
    for (const a of Historias._atores()) {
      if (a._balaoH && agora > a._balaoH.ate) a._balaoH = null;
      if (!a._rota || !a._rota.length) continue;
      const alvo = a._rota[0], dx = alvo.x - a.x, dy = alvo.y - a.y, d = Math.hypot(dx, dy);
      const v = (a === G.jog ? HISTORIA.VEL_JOCELINO : HISTORIA.VEL) * pressa * dt;
      if (d <= v || d < 0.5) { a.x = alvo.x; a.y = alvo.y; a._rota.shift(); if (!a._rota.length) { a._rota = null; a.andando = false; } continue; }
      a.x += dx / d * v; a.y += dy / d * v; a.andando = true; a.t = (a.t || 0) + dt;
      a.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? DIR.ESQUERDA : DIR.DIREITA) : (dy < 0 ? DIR.CIMA : DIR.BAIXO);
    }
    // a câmera devagar (vai até o alvo e segue quem anda)
    const c = Historias._alvoCam(h);
    if (c && h.cam) { const k = 1 - Math.exp(-dt * 2.6 * pressa); h.cam.x += (c.x - h.cam.x) * k; h.cam.y += (c.y - h.cam.y) * k; }
    // o escuro (escurece / clareia)
    const passo = dt * 1000 / HISTORIA.ESCURO_MS;
    h.escuro = h.escuroAlvo > h.escuro ? Math.min(h.escuroAlvo, h.escuro + passo) : Math.max(h.escuroAlvo, h.escuro - passo);
    // a espera
    const e = h.espera;
    if (e) {
      let ok = false;
      if (e.tipo === 'tempo') ok = agora >= e.ate || h.pressa;
      else if (e.tipo === 'anda') ok = !e.ator._rota;
      else if (e.tipo === 'camera') { const cc = Historias._alvoCam(h); ok = agora >= e.ate || !cc || Math.hypot(cc.x - h.cam.x, cc.y - h.cam.y) < 6 || h.pressa; }
      else if (e.tipo === 'escuro') ok = agora >= e.ate && h.escuro === h.escuroAlvo;
      if (ok) { h.espera = null; h.pressa = false; Historias._seguir(); }
    }
  },
  _alvoCam(h) {
    const a = h.camAlvo;
    if (!a) return null;
    if (typeof a === 'object') return a;
    const p = Historias._ator(a); return p ? { x: p.x, y: p.y - 40 } : null;
  },
  // O fim: a recompensa (só na 1ª vez), quem estava volta ao lugar, quem veio sai, as faixas sobem e o jogo segue.
  _terminar() {
    const h = Historias._h; if (!h) return;
    // quem ainda andava chega
    for (const a of Historias._atores()) if (a._rota) { const u = a._rota[a._rota.length - 1]; a.x = u.x; a.y = u.y; a._rota = null; a.andando = false; }
    Historias._limpa(h);
    let avisos = [];
    if (!h.revendo) {
      G.historias.vistas[h.id] = G.dia;
      avisos = Historias._recompensa(h.id, h.recompensa || {});
    }
    if (h.volta && typeof entrarMapa === 'function') entrarMapa(h.volta.mapa, h.volta.tile);
    for (const t of avisos) avisar(t);
    if (h.aoAcabar) try { h.aoAcabar(h.id); } catch (e) { console.warn('historias: o fim da cena deu erro:', e && e.message); }
  },
  // Para tudo sem recompensa (o carregar de um save, um erro): ninguém fica pausado para sempre.
  _abortar() { const h = Historias._h; if (h) Historias._limpa(h); },
  _limpa(h) {
    for (const [a, s] of h.salvos) Object.assign(a, s, { _rota: null, _balaoH: null, andando: false });
    if (G.mapa && h.novos.length) G.mapa.moradores = G.mapa.moradores.filter(x => !h.novos.includes(x));
    if (G.jog) { G.jog._rota = null; G.jog._balaoH = null; G.jog.andando = false; if (G.mapa && typeof bate === 'function' && bate(G.jog.caixa())) G.jog.desencalhar(); }
    Historias._h = null; Historias._faixaSai = _agoraH();
    if (typeof document !== 'undefined' && document.body && document.body.classList) document.body.classList.remove('historia', 'historia-alto');
    Historias._botaoPular();
    if (G.teclas) G.teclas.clear();
    G._camPronta = true;
    if (typeof hudSujo === 'function') hudSujo();
    Historias._livreDesde = _agoraH();
  },
  // A recompensa do fim (6.3). Devolve os avisos do que entrou na mochila e no caderno.
  _recompensa(id, r) {
    const av = [], lista = v => v == null ? [] : [].concat(v);
    for (const k in r.amizade || {}) if (typeof Amizade !== 'undefined') {
      let n = +r.amizade[k] || 0; if (n < -20) { console.warn(`historias: ${id} tira ${n} de amizade (o máximo é −20)`); n = -20; }
      Amizade.ganhar(Amizade.id(k), n, 'historia');
    }
    const R = G.respostas || (G.respostas = {});
    for (const m of lista(r.marca)) R[m] = G.dia;
    G.topicos = G.topicos || {};
    G.topicos['historia_' + id] = G.dia + HISTORIA.TOPICO_DIAS - 1;   // (N dias contando hoje: o último dia em que vale; T4)
    for (const t of lista(r.topico)) { const o = typeof t === 'string' ? { id: t } : t; G.topicos[o.id] = G.dia + (o.dias || HISTORIA.TOPICO_DIAS) - 1; }
    for (const it in r.item || {}) if (G.mochila) {
      const n = r.item[it], sobra = G.mochila.adicionar(it, n);
      if (sobra && typeof soltar === 'function' && G.jog) soltar(it, sobra, G.jog.x, G.jog.y);
      av.push('+ ' + (typeof Itens !== 'undefined' ? Itens.qtd(n, it) : n + ' ' + it));
    }
    for (const rc of lista(r.receita)) if (G.pensao && G.pensao.liberarReceita && G.pensao.liberarReceita(rc)) av.push('Receita nova no caderno da Rosa: ' + (typeof Pratos !== 'undefined' && Pratos.PRATOS[rc] ? Pratos.PRATOS[rc].nome : rc) + '.');
    for (const c of lista(r.carta)) if (!G.historias.cartas.includes(c)) G.historias.cartas.push(c);
    if (typeof r.depois === 'function') try { r.depois(); } catch (e) { console.error(e); }
    if (av.length && typeof hudSujo === 'function') hudSujo();
    return av;
  },

  // ---------- a gente da cena ----------
  _atores() { const h = Historias._h; const r = G.mapa ? G.mapa.moradores.slice() : []; if (G.jog) r.push(G.jog); return h ? r : []; },
  _ator(q) {
    if (q === 'jocelino') return G.jog;
    if (!G.mapa) return null;
    const ms = G.mapa.moradores;
    return ms.find(p => p.id === q) || ms.find(p => typeof Amizade !== 'undefined' && Amizade.idDe && Amizade.idDe(p) === q) || null;
  },
  // Guarda o estado de quem a cena mexe (para devolver no fim).
  _guarda(a) {
    const h = Historias._h; if (!h || a === G.jog || h.novos.includes(a) || h.salvos.has(a)) return;
    h.salvos.set(a, { x: a.x, y: a.y, dir: a.dir, visivel: a.visivel, _alvo: null, _espera: 1 });
  },
  _novo(q) {
    const def = Historias._h && Historias._h.def, nome = Historias._nome(q, def);
    const a = new Personagem(q, nome, 0, 0); a._daHistoria = true;
    G.mapa.moradores.push(a); Historias._h.novos.push(a);
    return a;
  },
  _poe(q, x, y, dir) {
    let a = Historias._ator(q);
    if (a) Historias._guarda(a); else a = Historias._novo(q);
    a.x = (x + 0.5) * TILE; a.y = y * TILE + (a === G.jog ? 36 : 42); a._rota = null; a._alvo = null; a.andando = false; a.visivel = true;
    if (dir in HISTORIA.DIRECOES) a.dir = HISTORIA.DIRECOES[dir];
  },
  _idConversa(q) { return typeof Conversas !== 'undefined' ? Conversas.idDe({ id: q }) : q; },
  _pessoa(q) { const a = Historias._ator(q); return a && a !== G.jog ? a : { id: q }; },
  _nome(q, def = Historias._h && Historias._h.def) {
    if (q === 'jocelino') return 'Jocelino';
    if (def && def.nomes && def.nomes[q]) return def.nomes[q];
    return typeof Conversas !== 'undefined' ? Conversas.nomeDe({ id: q }) : q;
  },
  _retrato(q) {
    if (typeof Conversas === 'undefined') return null;
    const id = q === 'jocelino' ? 'jocelino' : Historias._idConversa(q);
    return Conversas.temArte('retratos/' + id + '_normal') || Conversas.temArte('retratos/' + q + '_normal') ? Conversas.retratoDe({ id: q }) : null;
  },
  _paginas(q, lista) {
    const C = typeof Conversas !== 'undefined' ? Conversas : null, r = [];
    for (const f of lista) r.push(...(C ? C._paginas(f, C.contexto(q ? Historias._idConversa(q) : '')) : [].concat(f)));
    return r;
  },
  _musica(nome) {
    const h = Historias._h; if (!h) return;
    h.musica = nome;
    if (typeof MUSICAS !== 'undefined') MUSICAS.historia = nome ? [nome] : [];
  },

  // ---------- pular (só a cena já vista) e apressar ----------
  pular() {
    const h = Historias._h; if (!h || !h.podePular) return false;
    if (typeof CenaPrato !== 'undefined' && CenaPrato._cena) CenaPrato.parar();
    if (typeof document !== 'undefined' && !$('#modal').hidden) { _aoFecharModal = null; fecharModal(); }
    h.recompensa = null;
    Historias._terminar();
    return true;
  },
  apressar() { const h = Historias._h; if (h && h.espera && h.espera.tipo !== 'janela' && h.espera.tipo !== 'cena') h.pressa = true; },
  _botaoPular() {
    if (typeof document === 'undefined' || !document.body || !document.getElementById) return;
    let b = document.getElementById('historia-pular');
    const h = Historias._h, mostra = !!(h && h.podePular);
    if (!b && !mostra) return;
    if (!b) { b = el('button', { id: 'historia-pular', class: 'botao', onclick: e => { e.stopPropagation(); Historias.pular(); } }, 'Pular ▸▸'); document.body.append(b); }
    b.hidden = !mostra;
  },
  // As faixas de cinema (o corte de tela, como as das cenas de prato), o escuro e a frase da 1ª vez.
  _desenha(ctx) {
    const h = Historias._h, agora = _agoraH(), W = G.larg, A = G.alt, B = Math.round(A * HISTORIA.FAIXA);
    let k = 0;
    if (h) k = _suaveH(clamp((agora - h.comecou) / 300, 0, 1));
    else if (agora - Historias._faixaSai < 300) k = 1 - clamp((agora - Historias._faixaSai) / 300, 0, 1);
    if (h && h.escuro > 0) { ctx.save(); ctx.globalAlpha = h.escuro; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, A); ctx.restore(); }
    if (k <= 0) return;
    ctx.save(); ctx.fillStyle = '#000';
    ctx.fillRect(0, -B + B * k, W, B); ctx.fillRect(0, A - B * k, W, B);
    // a 1ª cena de todas: a frase no lugar (como toda 1ª vez do jogo), na faixa de baixo
    const pergunta = typeof document !== 'undefined' && !!document.querySelector && !!document.querySelector('#modal:not([hidden]) .opcoes');
    if (h && h.primeiraDeTodas && !h.revendo && !pergunta && typeof texto === 'function') { ctx.globalAlpha = 0.8 * k; texto(ctx, 'Espaço ou clique: continua', W / 2, A - B / 2 + 6, Math.round(clamp(B * 0.32, 13, 20)), '#fff4cf', '800'); }
    ctx.restore();
  },
};
const _suaveH = u => 1 - Math.pow(1 - u, 3);   // sai rápido e chega devagar (o _eo das cenas de prato)
// A cena pausa o jogo como um menu aberto (ui.js: menuAberto).
function historiaTocando() { return !!Historias._h; }
// A câmera da cena (jogo.js: alvoCamera): o canto de cima da vista, com o ponto da cena no meio (presa ao mapa).
function cameraDaHistoria() {
  const h = Historias._h; if (!h || !h.cam || typeof _prendeCamera !== 'function') return null;
  const vw = G.larg / G.zoom, vh = G.alt / G.zoom;
  return _prendeCamera(h.cam.x - vw / 2, h.cam.y - vh / 2);
}

// ---------- os ganchos ----------
// Entrou num mapa: checa daqui a pouco (o mapa assenta). A cada 10 minutos do relógio: checa de novo.
AO_ENTRAR_MAPA.push(() => { Historias._pendente = true; Historias._checarApos = _agoraH() + HISTORIA.ENTRAR_MS; });
ATUALIZADORES.push(() => {
  const b = G.dia * 1000 + Math.floor(G.minutos / 10);
  if (b !== Historias._bloco) { Historias._bloco = b; Historias._pendente = true; }
  if (!Historias._pendente || !HISTORIAS_TEM()) return;
  const agora = _agoraH();
  if (Historias.livre()) { Historias._livreDesde = agora; return; }
  if (agora < Historias._checarApos || agora - Historias._livreDesde < HISTORIA.LIVRE_MS) return;
  Historias.checar();
});
const HISTORIAS_TEM = () => { for (const k in HISTORIAS) return true; return false; };
// O quadro da cena anda junto com o desenho (o jogo fica pausado); com janela aberta, o "livre" recomeça a contar.
DESENHOS_TELA.push(ctx => {
  if (typeof menuAberto === 'function' && menuAberto() && !Historias._h) Historias._livreDesde = _agoraH();
  try { Historias._quadro(); } catch (e) { console.warn('historias: a cena parou por erro:', e && e.message); Historias._abortar(); }
  Historias._desenha(ctx);
});
// A música da cena: o rodízio (sons.js) toca a trilha da cena enquanto ela dura e volta para a do momento no fim.
if (typeof momentoMusica === 'function') { const _mm = momentoMusica; momentoMusica = function () { const h = Historias._h; return h && h.musica != null ? 'historia' : _mm(); }; }
// O teclado é da cena enquanto ela toca e não há janela aberta: Espaço, Enter, E e X apressam a pausa; Esc pula a já vista; nenhuma
// tecla chega ao jogo (nem a mochila nem a Caderneta). Com a fala aberta, as teclas são dela (ui.js: teclaNoModal).
if (typeof addEventListener === 'function') {
  addEventListener('keydown', e => {
    if (!Historias._h || (typeof CenaPrato !== 'undefined' && CenaPrato._cena)) return;
    if (e.ctrlKey || e.metaKey || e.altKey || /^F\d{1,2}$/.test(e.code)) return;   // (os atalhos do navegador e do sistema passam)
    if (!$('#modal').hidden) {
      if (e.code !== 'Escape' || e.repeat || (typeof travaFantasma === 'function' && travaFantasma(e))) return;
      if (Historias._h.podePular) { e.preventDefault(); e.stopImmediatePropagation(); Historias.pular(); return; }
      // (a 1ª vez toca inteira: o Esc numa fala passa a página, em vez de fechar a fala no meio; na pergunta, vale a última opção)
      const pl = $('#modal .placa'); if (pl && pl._avancar && !$('#modal .opcoes')) { e.preventDefault(); e.stopImmediatePropagation(); pl._avancar(); }
      return;
    }
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat) return;
    if (e.code === 'Escape') { if (!Historias.pular()) Historias.apressar(); }
    else if (['Space', 'Enter', 'NumpadEnter', 'KeyE', 'KeyX'].includes(e.code)) Historias.apressar();
  }, true);
  // O clique fora da caixa (no fundo do #modal) fecharia a fala no meio (ui.js: m.onclick → fecharModal) e, na pergunta, responderia a
  // última opção: na 1ª vez, ele passa a página da fala e não faz nada na pergunta. (Na cena já vista, fecha como sempre.)
  { const m = typeof document !== 'undefined' && document.getElementById ? document.getElementById('modal') : null;
    if (m && m.addEventListener) m.addEventListener('click', e => {
      const h = Historias._h; if (!h || h.podePular || e.target !== m) return;
      e.stopImmediatePropagation(); e.preventDefault();
      if (typeof travaFantasma === 'function' && travaFantasma(e)) return;
      const pl = m.querySelector('.placa'); if (pl && pl._avancar && !m.querySelector('.opcoes')) pl._avancar();
    }, true); }
  addEventListener('mousedown', e => {
    if (!Historias._h || !e.target || e.target.id !== 'tela') return;
    e.preventDefault(); e.stopImmediatePropagation(); Historias.apressar();
  }, true);
}

// ---------- a história de exemplo (o formato inteiro; a s60 registra e toca) ----------
// Não está em HISTORIAS: nunca toca no jogo. Uma visita leve da Dona Zélia ao quintal numa manhã de chuva, com todos os passos.
const HISTORIA_EXEMPLO = {
  quem: 'zelia', titulo: 'A muda da Dona Zélia', clima: 'A Dona Zélia anda separando mudas de flor',
  gatilho: { mapa: 'quintal', hora: [8 * 60, 12 * 60], chuva: true },
  elenco: { zelia: [21, 13, 'esquerda'], jocelino: [12, 13, 'direita'] },
  musica: 'musica_dia_2',
  nomes: { tiaguinho: 'Tiaguinho' },
  passos: [
    ['camera', 'zelia'],
    ['anda', 'jocelino', 18, 13],
    ['vira', 'zelia', 'jocelino'],
    ['balao', 'zelia', 'exclamacao'],
    ['fala', 'zelia', '@surpreso Ô de casa! Debaixo dessa chuva e você já de pé?', '@alegre Trouxe uma muda de flor pra Rosa. Pegou do meu canteiro.'],
    ['vira', 'juca', 'zelia'],
    ['fala', 'juca', '@alegre Dona Zélia! Entra, que o café tá passado.'],
    ['aparece', 'tiaguinho', 20, 17, 'cima'],
    ['anda', 'tiaguinho', 20, 14, 'junto'],
    ['balao', 'tiaguinho', 'nota_musical'],
    ['pausa', 500],
    ['som', 'feito'],
    ['escolha', 'zelia', '@pensativo Onde a gente planta a muda?', [
      { t: 'Perto da janela da Rosa', amizade: 20, marca: 'exemplo_muda_janela', ir: 'janela', resposta: ['@alegre Na janela! Assim ela vê a flor toda manhã.'] },
      { t: 'Junto da horta, que pega sol', amizade: 10, marca: 'exemplo_muda_horta', ir: 'horta' }]],
    ['rotulo', 'janela'],
    ['balao', 'zelia', 'coracao'],
    ['ir', 'depois'],
    ['rotulo', 'horta'],
    ['fala', 'zelia', 'Na horta, então. Flor perto de couve dá sorte, dizia minha mãe.'],
    ['rotulo', 'depois'],
    ['some', 'tiaguinho'],
    ['musica', 'musica_dia'],
    ['escurece', 30],
    ['clareia'],
    ['camera', 18, 12],
    ['se', () => Conversas.respondeu('exemplo_muda_janela'), 'fim'],
    ['fala', null, 'A muda ficou do lado da couve.'],
    ['rotulo', 'fim'],
    ['cena', 'pesquisa'],
    ['fala', 'jocelino', '@alegre Tá plantada. Obrigado, Dona Zélia!'],
    ['fim', { amizade: { zelia: 10 }, item: { flor: 1 }, topico: { id: 'muda_zelia', dias: 3 } }],
  ],
};
