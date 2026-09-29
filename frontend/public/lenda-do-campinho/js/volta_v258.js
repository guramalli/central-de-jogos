/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   v264: o jogo VOLTOU para a v258 (o dono desfez as mudanças de classes/estilo das v259–v263).
   Quem jogou naquelas versões pode ter no save jogadas de OUTRAS classes (a v262 dava todas para
   todo mundo) e a posição "Volante" (não existe na v258). Aqui só limpamos isso ao carregar.
   (Jogadas que não existem mais já são tiradas pelo próprio jogo.)
   ============================================================ */
{
  const _iniVolta = iniciarJogo;
  iniciarJogo = async function (save) {
    try {
      if (save && save.classe && Array.isArray(save.dribles)) {
        const outra = id => DRIBLES[id] && DRIBLES[id].classe && DRIBLES[id].classe !== save.classe;
        save.dribles = save.dribles.filter(id => !outra(id));
        if (Array.isArray(save.hotbar)) save.hotbar = save.hotbar.map(h => h && h.t === 'd' && outra(h.id) ? null : h);
      }
      if (save && save.posicao && !POSICOES[save.posicao]) save.posicao = typeof posicaoDaClasse === 'function' ? posicaoDaClasse(save.classe) : 'meia';
      if (save) delete save.estiloCompleto;
    } catch (e) { }
    return _iniVolta.apply(this, arguments);
  };
}

/* ---------- v266: "a sua classe está certa?" ----------
   Na v262 a classe mudava SOZINHA conforme os pontos de atributo (quem pôs mais em Inteligência virou Cérebro...).
   Ao voltar para a v258, a classe ficou a última calculada — e o save não guarda qual era a original.
   Então quem jogou naqueles dias recebe UMA pergunta: mantém a classe ou escolhe a certa (de graça, em qualquer
   nível; os pontos de atributo voltam para distribuir). Depois de responder, não pergunta mais. */
// V266_FEITA = quando a v265 (de volta à escolha de classe na criação) entrou no ar: quem criou o personagem depois disso já escolheu a classe
// (v270: era 30/09 02:00 e a pergunta aparecia também para jogador NOVO, por cima do tutorial)
const V262_NO_AR = Date.parse('2026-09-29T15:00:00-03:00'), V266_FEITA = Date.parse('2026-09-29T17:00:00-03:00');
function trocaClasseGratisV266(esc) {
  const s = G.save; const velha = CLASSES[s.classe] ? CLASSES[s.classe].nome : '—';
  s.classe = esc; const lv = s.nivel - 1; s.atr = Object.assign({}, CLASSES[esc].base); s.atr[CLASSES[esc].principal] += lv; s.pontos = lv * PONTOS_POR_NIVEL;
  if (s.posicao && typeof posicaoDaClasse === 'function') s.posicao = posicaoDaClasse(esc);
  s.dribles = s.dribles.filter(id => !(DRIBLES[id] && DRIBLES[id].classe && DRIBLES[id].classe !== esc));
  s.hotbar = s.hotbar.map(h => h && h.t === 'd' && !s.dribles.includes(h.id) ? null : h);
  if (typeof aprendeMagiasDaVocacao === 'function') aprendeMagiasDaVocacao();
  G.cds.classe = 0; const st = stats(); s.hp = Math.min(s.hp, st.maxHp); s.foco = Math.min(s.foco, st.maxFoco);
  log(`🎭 Classe corrigida: de ${velha} para ${CLASSES[esc].nome}! Seus ${s.pontos} pontos de atributo voltaram: aperte C para distribuir (dá para digitar o número).`, 'l-lvl');
  banner(CLASSES[esc].nome.toUpperCase(), 'Classe de volta'); som('nivel');
  if (typeof atualizaRetrato === 'function') atualizaRetrato(); G.uiSujo = true;
}
function conferirClasseV266() {
  const s = G.save; if (!s || !CLASSES[s.classe]) return;
  let esc = s.classe; const grade = el('div', { class: 'grade-classes' });
  const bt = el('button', { class: 'btn amarelo grande', type: 'button' });
  const render = () => { grade.innerHTML = ''; Object.keys(CLASSES).forEach(id => grade.append(cartaClasse(id, id === esc, () => { esc = id; render(); }))); bt.textContent = esc === s.classe ? `Está certa: continuar ${CLASSES[esc].nome}` : `Voltar a ser ${CLASSES[esc].nome}`; };
  bt.onclick = () => { s.flags.classe_conferida_v266 = true; if (esc !== s.classe) { trocaClasseGratisV266(esc); fechaModal(); if (typeof abreFicha === 'function') setTimeout(abreFicha, 300); } else fechaModal(); salvar(); };
  render(); abreModal.largo = true;
  abreModal(el('h2', {}, '🎭 A sua classe está certa?'),
    el('p', {}, `Nos últimos dias, uma versão do jogo trocava a classe sozinha conforme os pontos de atributo — isso foi desfeito. Hoje você é ${CLASSES[s.classe].emoji} ${CLASSES[s.classe].nome}. Se não era essa a sua classe, escolha a certa abaixo: é de graça e os seus pontos de atributo voltam para você distribuir de novo.`),
    grade, el('div', { class: 'opcoes' }, bt));
}
{
  const _iniConf = iniciarJogo;
  iniciarJogo = async function (save) {
    const precisa = save && save.classe && !(save.flags && save.flags.classe_conferida_v266) && (save.criado || 0) < V266_FEITA && (!save.salvoEm || save.salvoEm >= V262_NO_AR) && (save.nivel || 1) >= 2 && (save.tut || 0) >= 5; // nunca para quem está no começo/tutorial
    const r = await _iniConf.apply(this, arguments);
    if (precisa) { let t = 0; const tenta = () => { if (G.save !== save) return; const livre = $('#modal').hidden && !document.querySelector('.cj-caixa') && !document.querySelector('.hist-pular'); if (livre) conferirClasseV266(); else if ((t += 1) < 60) setTimeout(tenta, 2000); }; setTimeout(tenta, 3000); }
    return r;
  };
}
