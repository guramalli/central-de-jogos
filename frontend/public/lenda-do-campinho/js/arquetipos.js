/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧩 ARQUÉTIPOS DE ADVERSÁRIO (v231, pedido do dono: "de uma vez por todas diferenciar")
   Antes: 187 adversários saíam de meia dúzia de corpos com cor/cabelo sorteados — todos parecidos.
   Agora cada TIPO tem um desenho próprio (folhas a/boneco_arq_*.webp, roupas detalhadas) e é SEMPRE
   igual (sem sorteio); de uma cidade para outra muda só a cor do uniforme (o time).
   E cada tipo luta de um jeito, como as criaturas do Tibia:
     🛡️ Zagueiro   — carrinho: às vezes te deixa tonto(a) um instante
     🔨 Volante    — marcação: cada falta rouba um pouco do seu foco
     ⚽ Centroavante — chute forte de longe de vez em quando
     🎩 Meia       — passe: recupera o fôlego do colega mais cansado
     🏃 Ponta      — ginga: às vezes escapa do seu drible colado
     🧤 Goleiro    — defende parte dos chutes de longe
     📣 Torcedor   — grito: os colegas em volta batem mais forte por uns segundos
     🟨 Árbitro    — cartão amarelo: você fica mais lento(a) por 3 s
   Carregar DEPOIS de corpos.js e variedade.js.
   ============================================================ */
const ARQ_POS = { GOL: 'goleiro', ZAG: 'zagueiro', LAT: 'ponta', VOL: 'volante', MEI: 'meia', ATA: 'centroavante' };
function arquetipoDe(id, d) {
  const nm = ((d.nome || '') + ' ' + id).toLowerCase();
  if (d.posicao && ARQ_POS[d.posicao]) return ARQ_POS[d.posicao];
  if (/goleir|arqueiro|portero|keeper/.test(nm)) return 'goleiro';
  if (/[aá]rbitr|juiz|bandeirinh/.test(nm)) return 'arbitro';
  if (/fan[aá]tic|ultra|hincha|torcedor|claque|organizad|barra/.test(nm)) return 'torcedor';
  if (/zagueir|central|xerife|l[ií]bero|beque|defens|stopper|muralha/.test(nm)) return 'zagueiro';
  if (/volante|carrinho|pivote|box-to-box|marcador|cabe[cç]a de [aá]rea/.test(nm)) return 'volante';
  if (/meia|m[eé]dio|regista|maestro|armador|trequartista|camisa 10|enganche/.test(nm)) return 'meia';
  if (/ponta|extremo|ala\b|ala |winger|veloz|rel[aâ]mpago|lateral|maratonista/.test(nm)) return 'ponta';
  if (/centroavante|atacante|artilheir|goleador|tanque|piv[oô]|matador|nove|delantero|striker|avante/.test(nm)) return 'centroavante';
  return null;
}
// o jeito FIXO de cada tipo (pele, cor do cabelo e altura fazem parte da identidade)
const ARQ_LOOK = {
  zagueiro: { m: { pele: 'pele-negra', corCabelo: 'preto', alt: 1.8 } },
  volante: { m: { pele: 'pele-morena', corCabelo: 'preto', alt: 1.5 } },
  centroavante: { m: { pele: 'pele-retinta', corCabelo: 'preto', alt: 1.82 } },
  meia: { m: { pele: 'pele-media', corCabelo: 'castanho', alt: 1.64 }, f: { pele: 'pele-clara', corCabelo: 'ruivo', alt: 1.6 } },
  ponta: { m: { pele: 'pele-morena', corCabelo: 'loiro', alt: 1.68 }, f: { pele: 'pele-media', corCabelo: 'preto', alt: 1.62 } },
  goleiro: { m: { pele: 'pele-clara', corCabelo: 'castanho', alt: 1.84 } },
  torcedor: { m: { pele: 'pele-media', corCabelo: 'preto', alt: 1.64 } },
  arbitro: { m: { pele: 'pele-clara', corCabelo: 'grisalho', alt: 1.72, corRoupa: '#1f1f26', corBaixo: '#1f1f26' } },
};
const ARQ_NOMES_FEM = { buenos_meia: 'Enganche Portenha' }; // nome combinando com o sexo
const ARQ_SEM_ACESS = ['chapeu', 'rosto', 'pescoco', 'costas', 'mao'];
{
  let n = 0;
  for (const [id, d] of Object.entries(MONSTROS)) {
    const L = d.look; if (!L || L.tipo !== 'humano' || d.chefe || d.treino || /^(cap_|ch_)/.test(L.folha || '')) continue;
    const a = arquetipoDe(id, d); if (!a) continue;
    const g = L.corpo === 'f' && ARQ_LOOK[a].f ? 'f' : 'm';
    const folha = 'arq_' + a + (g === 'f' ? '_f' : '');
    if (!META_BONECOS[folha]) continue;
    const novo = Object.assign({}, L, ARQ_LOOK[a][g], { folha, corpo: g === 'f' ? 'f' : 'm', grande: false, _arq: a });
    for (const k of ARQ_SEM_ACESS) delete novo[k];
    delete novo._kb; d.look = novo; d._arq = a; n++;
    if (ARQ_NOMES_FEM[id]) d.nome = ARQ_NOMES_FEM[id];
    if (typeof CORPO_TIPO !== 'undefined') delete CORPO_TIPO[id];
  }
  window.ARQ_TOTAL = n;
  // sem sorteio de jeito nem padrão de uniforme por cima (o desenho já tem o dele): todo mundo do tipo é igual
  // v231: ROUPA TÍPICA DA REGIÃO — no mundo, o mesmo tipo ganha os trajes do lugar onde aparece
  // (folhas a/boneco_arq_<tipo>[_f]_<cidade>.webp). No Brasil fica a folha base.
  const cidadeDoMapa = id => { if (!id) return null; if (typeof CACA_POR_ID !== 'undefined' && CACA_POR_ID[id]) return CACA_POR_ID[id].host; if (/^est_/.test(id)) return id.slice(4); return id; };
  const _lookArq = lookDoMonstro;
  lookDoMonstro = function (m, mapa) {
    if (!m || !m.d || !m.d._arq) return _lookArq.apply(this, arguments);
    const L = m.d.look, c = cidadeDoMapa(mapa || (G.mapa && G.mapa.id)), reg = c && `${L.folha}_${c}`;
    if (!reg || typeof META_REG === 'undefined' || !META_REG[reg]) return null;   // sem traje regional: todo mundo do tipo igual
    const novo = Object.assign({}, L, { folha: reg }); delete novo._kb;
    if (folhaReg(reg)) return novo;
    m._regPend = novo; return null;                     // ainda baixando: usa a base e troca assim que chegar
  };
  const _atuArqReg = atualizaMonstro;
  atualizaMonstro = function (m) {
    if (m && m._regPend && FOLHAS[m._regPend.folha] && FOLHAS[m._regPend.folha].ok) { m._dV = Object.assign({}, m.d, { look: m._regPend }); m._regPend = null; }
    return _atuArqReg.apply(this, arguments);
  };
}

/* ---------- criaturas das profundezas e extraterrestres (v231) ----------
   Já têm desenho próprio. Duas melhorias: (1) as pequenas demais para o nível 200+ ficam maiores
   (liam como bichinhos inofensivos); (2) o nome já diz o papel ("Aranha Goleira", "Múmia Zagueira",
   "Escorpião Artilheiro"...): elas ganham o mesmo jeito de lutar do arquétipo. */
{
  const papelBicho = nm => /goleir/.test(nm) ? 'goleiro' : /zagueir/.test(nm) ? 'zagueiro' : /artilheir/.test(nm) ? 'centroavante'
    : /torcedor/.test(nm) ? 'torcedor' : /driblador|brincalh/.test(nm) ? 'ponta' : /malabarist/.test(nm) ? 'meia' : /bravo/.test(nm) ? 'volante' : null;
  for (const [id, d] of Object.entries(MONSTROS)) {
    const L = d.look; if (!L || !L.tipo || L.tipo === 'humano' || d.chefe || d.treino || /^pedra/.test(L.tipo)) continue;
    const nv = typeof nivelMonstro === 'function' ? nivelMonstro(d) : 0; if (nv < 200) continue;
    const alt = ALTURA_BICHO[L.tipo]; if (alt && alt < 1) ALTURA_BICHO[L.tipo] = +Math.min(1.1, Math.max(1, alt * 1.35)).toFixed(2);
    const a = papelBicho((d.nome || '').toLowerCase()); if (a) d._arq = a;
  }
}

/* ---------- cada tipo luta de um jeito ---------- */
const ARQ_TXT = { zagueiro: 'CARRINHO!', volante: 'MARCAÇÃO!', centroavante: 'CHUTE FORTE!', meia: 'PASSE!', ponta: 'GINGOU!', goleiro: 'DEFENDEU!', torcedor: '📣 VAMO!', arbitro: '🟨 CARTÃO!' };
{
  const agora = () => G.agora;
  // você tonto(a) (carrinho) não anda; com cartão amarelo anda mais devagar
  const _moverArq = mover;
  mover = function (e) { if (e === G.p && (G.p.tontoAte || 0) > agora()) return 0; return _moverArq.apply(this, arguments); };
  const _velArq = velJogador;
  velJogador = function () { const v = _velArq.apply(this, arguments); return (G.p && (G.p.lentoAte || 0) > agora()) ? v * 0.7 : v; };
  // dano que VOCÊ recebe: volante rouba foco; quem ouviu o grito da torcida bate +20%
  const _recebeArq = recebeDano;
  recebeDano = function (dano, m) {
    if (m && (m._gritoAte || 0) > agora()) dano = Math.round(dano * 1.1); // v237: era +20%
    const r = _recebeArq.call(this, dano, m);
    if (m && m.d && m.d._arq === 'volante' && G.save) { const tira = Math.min(G.save.foco, Math.max(2, Math.round(stats().maxFoco * 0.03))); if (tira > 0) { G.save.foco -= tira; texto(G.p, '-' + tira + ' foco', '#6ab8ff', 800, -0.3); } }
    return r;
  };
  // dano que você dá: o ponta às vezes escapa colado; o goleiro defende parte dos chutes de longe
  const _aplicaArq = aplicaDano;
  aplicaDano = function (m, dano) {
    const a = m && m.d && m.d._arq;
    if (a && dano > 0 && G.p) {
      const d = dist(m, G.p);
      if (a === 'ponta' && d <= 1.6 && Math.random() < 0.18) { m.bravo = true; texto(m, ARQ_TXT.ponta, '#ffe14a', 800); efeito('puff', m.x, m.y); return; }
      if (a === 'goleiro' && d > 1.6 && Math.random() < 0.3) { m.bravo = true; texto(m, ARQ_TXT.goleiro, '#9fe8ff', 800); efeito('puff', m.x, m.y); return; }
    }
    return _aplicaArq.apply(this, arguments);
  };
  // habilidades que cada um usa sozinho durante a briga
  const _atualizaMonstroArq = atualizaMonstro;
  atualizaMonstro = function (m) {
    const r = _atualizaMonstroArq.apply(this, arguments);
    const a = m.d && m.d._arq; if (!a || !m.bravo || G.save.hp <= 0 || !G.p) return r;
    const t = agora(); if (t < (m._cdArq || 0)) return r;
    const d = dist(m, G.p);
    if (a === 'zagueiro' && d <= 1.6) { m._cdArq = t + 7500 + Math.random() * 2000; if (Math.random() < 0.4) { G.p.tontoAte = t + 700; m.golpe = t; texto(m, ARQ_TXT.zagueiro, '#ff9a5a', 900); efeito('impacto', G.p.x, G.p.y, '#ff9a5a'); som('chute'); } }
    else if (a === 'centroavante' && d > 1.6 && d <= 5.5 && (typeof linhaVisao !== 'function' || linhaVisao(m, G.p))) {
      m._cdArq = t + 12000 + Math.random() * 3000; m.golpe = t; m.flip = G.p.x < m.x; texto(m, ARQ_TXT.centroavante, '#ffcf4a', 900);
      projetil(m, G.p, 'bolaforte', () => { const s = stats(); const dano = Math.max(1, Math.round(m.d.atk * (0.5 + 0.3 * Math.random()) - s.def * 0.6)); /* v237: era atk×(0,9–1,3) */ recebeDano(dano, m); });
    }
    else if (a === 'meia') {
      const ferido = G.mons.filter(o => o !== m && !o.d.treino && o.hp < o.d.hp * 0.7 && dist(o, m) <= 4).sort((x, y) => x.hp / x.d.hp - y.hp / y.d.hp)[0];
      m._cdArq = t + (ferido ? 6500 : 1500);
      if (ferido) { const cura = Math.round(ferido.d.hp * 0.12); ferido.hp = Math.min(ferido.d.hp, ferido.hp + cura); projetil(m, ferido, 'bola', () => {}); texto(ferido, '+' + cura, '#6aff9a', 900); texto(m, ARQ_TXT.meia, '#b0ffb0', 800); }
    }
    else if (a === 'torcedor' && d <= 6) {
      m._cdArq = t + 10000 + Math.random() * 2000; const colegas = G.mons.filter(o => o !== m && !o.d.treino && dist(o, m) <= 4);
      if (colegas.length) { colegas.forEach(o => { o._gritoAte = t + 5000; }); texto(m, ARQ_TXT.torcedor, '#ffd23f', 1000); if (typeof fala === 'function' && Math.random() < 0.5) fala(m, 'VAMO, TIME!'); }
    }
    else if (a === 'arbitro' && d <= 4) { m._cdArq = t + 10000 + Math.random() * 3000; G.p.lentoAte = t + 3000; m.golpe = t; texto(m, ARQ_TXT.arbitro, '#ffe14a', 1000); texto(G.p, 'mais lento', '#ffe14a', 900, -0.3); som('apito'); }
    return r;
  };
  // quem ouviu o grito ganha um brilho no nome (📣) enquanto dura
}
// no mapa grande e ao passar o mouse: o que cada tipo faz
function arqDica(d) {
  return ({ zagueiro: 'dá carrinho (te deixa tonto)', volante: 'marca colado (rouba foco)', centroavante: 'chuta forte de longe', meia: 'dá passe (cura os colegas)', ponta: 'ginga (escapa do drible colado)', goleiro: 'defende chutes de longe', torcedor: 'grita (colegas batem mais forte)', arbitro: 'dá cartão amarelo (te deixa lento)' })[d && d._arq] || '';
}
