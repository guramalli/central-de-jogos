/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚽ ESTILO DE JOGO (v262) — não existe mais classe
   Pedido do dono: um personagem só, e cada um escolhe o jeito de jogar pelos PONTOS DE ATRIBUTO:
     💪 Força        → jogo de perto (drible e jogadas corpo a corpo), mais defesa e bloqueio
     🎯 Habilidade   → jogo de longe (chutes), chuta mais longe, mais crítico
     🧠 Inteligência → jogadas de craque (área e controle), mais foco, jogadas mais baratas
     💨 Fôlego       → resistência: mais fôlego, curas, recuperação, velocidade e o Caramelo
   Todas as jogadas são de todo mundo (aprende no nível); cada uma fica mais forte com o SEU atributo.
   O estilo (Paredão, Artilheiro, Cérebro, Motorzinho ou Craque Completo) é só um TÍTULO calculado
   pelos pontos — muda quando você redistribui. s.classe continua existindo (= o estilo) por causa
   do especial da tecla Shift, da posição no time e dos saves antigos.
   Carregar DEPOIS de classes_jogadas.js.
   ============================================================ */
const ESTILO_DO_ATRIBUTO = { defesa: 'paredao', habilidade: 'driblador', inteligencia: 'cerebro', folego: 'motorzinho' };
const ATR_DESEMPATE = ['habilidade', 'defesa', 'folego', 'inteligencia'];
const ESTILO_COMPLETO = { nome: 'Craque Completo', emoji: '⭐', cor: '#e0a82a' };
// quanto cada ponto do atributo aumenta o dano das jogadas dele
const ATR_K = { defesa: 0.005, habilidade: 0.0055, inteligencia: 0.012, folego: 0.016 };
// de qual atributo é cada jogada (as que não estão aqui seguem a regra: perto/área = Força, chute = Habilidade,
// lançamento de drible = Inteligência, cura = Fôlego)
const ATR_JOGADA_TAB = {
  pedalada: 'defesa', chapeu: 'defesa', elastico: 'defesa', caneta: 'defesa', tabela: 'defesa', relampago: 'defesa', carrinho: 'defesa', tranco: 'defesa', bote: 'defesa', lateral_area: 'defesa', chamar_marcacao: 'defesa',
  chute_colocado: 'habilidade', voleio: 'habilidade', bicicleta: 'habilidade', trivela: 'habilidade', chuva_bolas: 'habilidade', canhao: 'habilidade', folha_seca: 'habilidade', recuo: 'habilidade',
  lancamento: 'inteligencia', hipnose: 'inteligencia', toque_mestre: 'inteligencia', raiz: 'inteligencia', gramado_encharcado: 'inteligencia', cabeca_fria: 'inteligencia',
  respiro: 'folego', folego_campeao: 'folego', agua_gelada: 'folego', grito_torcida: 'folego', mascote_caramelo: 'folego', ponto_hidratacao: 'folego', arrancada: 'folego',
};
function atribDe(x) {
  const id = typeof x === 'string' ? x : Object.keys(DRIBLES).find(k => DRIBLES[k] === x);
  const dr = typeof x === 'string' ? DRIBLES[x] : x; if (!dr) return null;
  if (id && ATR_JOGADA_TAB[id]) return ATR_JOGADA_TAB[id];
  if (dr.atrib) return dr.atrib;
  if (dr.tipo === 'cura') return 'folego';
  if (dr.tipo === 'dist') return dr.skill === 'chute' ? 'habilidade' : 'inteligencia';
  if (dr.tipo === 'melee' || dr.tipo === 'area') return 'defesa';
  return null;
}
// todas as jogadas passam a ser de todo mundo (a classe de origem fica só como curiosidade)
for (const [id, dr] of Object.entries(DRIBLES)) { if (dr.classe) { dr.origem = dr.classe; delete dr.classe; } dr.atrib = atribDe(id); }

// ---------- o estilo vem dos pontos ----------
function estiloDe(s) {
  const a = (s && s.atr) || {}; const v = ATR_DESEMPATE.map(k => [k, a[k] || 0]);
  const max = Math.max(...v.map(x => x[1])), topo = v.find(x => x[1] === max)[0];
  const media = v.reduce((t, x) => t + x[1], 0) / 4;
  return { classe: ESTILO_DO_ATRIBUTO[topo], atributo: topo, completo: max <= media * 1.25 }; // nenhum atributo se destaca = Craque Completo
}
function infoEstilo(s) { const e = estiloDe(s); const c = CLASSES[e.classe]; return e.completo ? Object.assign({}, ESTILO_COMPLETO, e) : Object.assign({ nome: c.nome, emoji: c.emoji, cor: c.cor }, e); }
function nomeEstilo(s) { const i = infoEstilo(s); return `${i.emoji} ${i.nome}`; }
function sincronizaEstilo(s) {
  if (!s || !s.atr) return;
  const e = estiloDe(s); const antes = s.classe, antesCompleto = s.estiloCompleto;
  s.estiloCompleto = e.completo;
  if (s.classe !== e.classe) { s.classe = e.classe; if (s.posicao && typeof posicaoDaClasse === 'function') s.posicao = posicaoDaClasse(e.classe); }
  if ((antes !== s.classe || antesCompleto !== e.completo) && antes && G.save === s && G.rodando) {
    G.uiSujo = true; log(`⚽ Seu estilo agora: ${nomeEstilo(s)}${s.posicao && POSICOES[s.posicao] ? ` (joga de ${POSICOES[s.posicao].nome})` : ''}. O especial (tecla ${teclaEspecial()}) é ${CLASSES[s.classe].especial.nome}.`, 'l-info');
  }
}

// ---------- sem números de classe ----------
for (const v of Object.values(VOCACAO)) {
  Object.assign(v, { hp: 1, foco: 1, perto: 1, longe: 1, magia: 1, cura: 1, colado: 1 });
  // Habilidade: chuta mais longe (até +2 quadradinhos)
  Object.defineProperty(v, 'alcance', { configurable: true, get: () => { const s = G.save; return s && s.atr ? Math.max(0, Math.min(2, ((s.atr.habilidade || 0) - 7) / 60)) : 0; } });
}
// posição: igual para todos em fôlego/foco/dano (continua mudando como treina as habilidades e a posição no time)
for (const p of Object.values(POSICOES)) Object.assign(p, { hp: 13, foco: 10, dano: 1 });

// ---------- cada atributo fortalece o seu tipo de jogada ----------
let ATR_JOGADA = null;
function comAtributo(k, fn) { const a0 = ATR_JOGADA; ATR_JOGADA = k; try { return fn(); } finally { ATR_JOGADA = a0; } }
function bonusAtributo(k, st) { st = st || stats(); return k && st.atr ? (st.atr[k] || 0) * (ATR_K[k] || 0) : 0; }
function potenciaJogada(id) { const dr = DRIBLES[id]; return dr ? (dr.poder || 1) * (1 + bonusAtributo(dr.atrib)) : 0; }
{
  const _stE = stats;
  stats = function () {
    const s = G.save; if (s && s.atr) sincronizaEstilo(s);
    const st = _stE.apply(this, arguments);
    if (ATR_JOGADA && st.atr) st.danoMult *= 1 + (st.atr[ATR_JOGADA] || 0) * (ATR_K[ATR_JOGADA] || 0);
    return st;
  };
  const _udE = usarDrible;
  usarDrible = function (id) { const k = atribDe(id); const a = arguments; return k ? comAtributo(k, () => _udE.apply(this, a)) : _udE.apply(this, a); };
  const _dmE = danoMagia;
  danoMagia = function (dr, m) { const k = atribDe(dr); return k && !ATR_JOGADA ? comAtributo(k, () => _dmE(dr, m)) : _dmE(dr, m); };
  const _dmjE = danoMaxJogador;
  danoMaxJogador = function (modo) { return ATR_JOGADA ? _dmjE(modo) : comAtributo(modo === 'chute' ? 'habilidade' : 'defesa', () => _dmjE(modo)); }; // drible comum = Força, chute = Habilidade
}

// ---------- aprender: todas as jogadas chegam no nível ----------
aprendeMagiasDaVocacao = function () {
  const s = G.save; if (!s || !s.dribles) return;
  for (const [id, dr] of Object.entries(DRIBLES)) if (dr.origem && s.nivel >= (dr.lvl || 1) && !s.dribles.includes(id)) aprendeDrible(id);
};
{
  const _iniE = iniciarJogo;
  iniciarJogo = async function (save) {
    let novas = 0;
    if (save && save.atr) {
      sincronizaEstilo(save);
      if (Array.isArray(save.dribles)) for (const [id, dr] of Object.entries(DRIBLES)) if (dr.origem && (save.nivel || 1) >= (dr.lvl || 1) && !save.dribles.includes(id)) { save.dribles.push(id); novas++; } // saves antigos: sem 20 avisos seguidos
    }
    const r = await _iniE.apply(this, arguments);
    if (novas) setTimeout(() => log(`⚽ Novidade: não existe mais classe! Todas as jogadas agora são de todo mundo e você ganhou ${novas} jogadas novas (veja em Jogadas). O seu estilo vem de onde você põe os pontos de atributo: ${nomeEstilo(G.save)}.`, 'l-lvl'), 1800);
    return r;
  };
}
// escolher/trocar classe não existe mais: quem chamar vai para "Meu estilo"
modalEscolheClasse = function () { modalMinhaClasse(); };
modalTrocaClasse = function () { modalMinhaClasse(); };

// ---------- janela "Meu estilo" (no lugar de "Minha classe") ----------
const ESTILO_TEXTO = {
  defesa: { titulo: 'Jogo de perto', jeito: 'Modo Drible (colado). Você aguenta o tranco e resolve no corpo a corpo.' },
  habilidade: { titulo: 'Jogo de longe', jeito: 'Modo Chute (de longe). Mantenha distância e use o Recuo quando grudarem.' },
  inteligencia: { titulo: 'Jogadas de craque', jeito: 'Jogadas em área e de controle. Muito foco: deixe a Cabeça Fria ligada e prenda os grupos.' },
  folego: { titulo: 'Resistência', jeito: 'Aguente as lutas longas: cure-se, chame o Caramelo e lute dentro do Ponto de Hidratação.' },
};
modalMinhaClasse = function () {
  const s = G.save; if (!s) return; sincronizaEstilo(s);
  const st = stats(), inf = infoEstilo(s), esp = CLASSES[s.classe].especial;
  const pct = x => Math.round(x * 100) + '%';
  const bloco = k => {
    const a = ATRIBUTOS[k], t = ESTILO_TEXTO[k], val = st.atr[k] || 0, meu = !inf.completo && inf.atributo === k;
    const jog = Object.keys(DRIBLES).filter(id => DRIBLES[id].atrib === k && (DRIBLES[id].poder || DRIBLES[id].efeitoMagia || DRIBLES[id].tipo === 'cura')).sort((x, y) => DRIBLES[x].lvl - DRIBLES[y].lvl);
    return el('div', { class: 'est-bloco' + (meu ? ' meu' : ''), style: `--cor:${a.cor}` },
      el('div', { class: 'est-topo' }, el('span', { class: 'mc-ic' }, a.icone), el('div', {}, el('b', {}, `${a.nome}: ${t.titulo}`), el('small', {}, a.desc)), el('b', { class: 'mc-val' }, val)),
      el('p', { class: 'est-bonus' }, `Suas jogadas de ${a.nome}: +${pct(bonusAtributo(k, st))} de força`),
      el('div', { class: 'est-jog' }, jog.map(id => { const dr = DRIBLES[id], tem = s.dribles.includes(id);
        return el('span', { class: 'est-j' + (tem ? '' : ' bloq'), title: `${dr.nome} (nível ${dr.lvl}): ${dr.desc || ''}` }, iconeClone(iconeDrible(id)), el('small', {}, tem ? dr.nome : `nv ${dr.lvl}`)); })));
  };
  abreModal.largo = true;
  abreModal(el('h2', {}, `${inf.emoji} Meu estilo: ${inf.nome}`),
    el('div', { class: 'mc-topo', style: `--cor:${inf.cor}` },
      el('p', {}, 'Aqui não tem classe: o seu jeito de jogar vem de onde você coloca os ', el('b', {}, 'pontos de atributo'), ` (${PONTOS_POR_NIVEL} por nível). Todas as jogadas são de todo mundo, e cada uma fica mais forte com o atributo dela. Mais Força = Paredão, mais Habilidade = Artilheiro, mais Inteligência = Cérebro, mais Fôlego = Motorzinho. Tudo parecido = Craque Completo.`),
      el('p', { class: 'mc-jeito' }, el('b', {}, '🎮 Como jogar: '), inf.completo ? 'Você faz de tudo um pouco: use o melhor de cada jogada conforme a luta.' : ESTILO_TEXTO[inf.atributo].jeito,
        el('br'), el('small', {}, `Especial (tecla ${teclaEspecial()}): ${esp.nome}: ${esp.desc}`)),
      s.pontos ? el('p', { class: 'mc-pts' }, `Você tem ${s.pontos} ponto(s) para distribuir! `, el('button', { class: 'btn verde mini', type: 'button', onclick: () => { fechaModal(); abreFicha(); } }, 'Distribuir agora')) : null),
    el('div', { class: 'est-grade' }, ['defesa', 'habilidade', 'inteligencia', 'folego'].map(bloco)),
    el('p', { class: 'vazio' }, 'Quer mudar de estilo? O Seu Zé (na Vila) devolve os seus pontos para distribuir de novo.'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn verde', type: 'button', onclick: () => { fechaModal(); abreFicha(); } }, '📋 Ficha e pontos'),
      typeof modalJogadas === 'function' ? el('button', { class: 'btn roxo', type: 'button', onclick: modalJogadas }, '📖 Todas as jogadas') : null,
      el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
};
{
  const st = document.createElement('style');
  st.textContent = `.est-grade { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0; }
  .est-bloco { border-radius: 10px; padding: 7px 9px; background: rgba(0,0,0,.05); border-left: 5px solid var(--cor); }
  .est-bloco.meu { background: rgba(255,210,63,.22); box-shadow: 0 0 0 2px rgba(255,190,40,.6) inset; }
  .est-topo { display: grid; grid-template-columns: 30px 1fr 40px; gap: 6px; align-items: center; } .est-topo small { display: block; opacity: .85; }
  .est-bonus { margin: 4px 0; font-weight: 800; font-size: 12.5px; color: #2a5a1a; }
  .est-jog { display: flex; flex-wrap: wrap; gap: 4px; } .est-j { display: flex; flex-direction: column; align-items: center; width: 58px; text-align: center; }
  .est-j canvas { width: 30px; height: 30px; } .est-j small { font-size: 10px; line-height: 1.1; } .est-j.bloq { opacity: .45; }
  @media (max-width: 600px) { .est-grade { grid-template-columns: 1fr; } }`;
  document.head.append(st);
}
