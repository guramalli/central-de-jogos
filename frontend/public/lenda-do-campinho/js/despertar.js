/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌟 DESPERTAR DAS RELÍQUIAS (v378, dono: "vamos fazer... por ser tão difícil, no final dar alguns bônus, e entre esses
   bônus você escolhe um para fixar ao seu boneco").
   Com a Mestra Altina (Torre Infinita, no Estádio do Multiverso), cada uma das 6 relíquias pode DESPERTAR:
     1. PROVA DE USO — 10.000 vitórias usando a relíquia (só adversários de até 30 níveis abaixo do seu).
     2. OFERENDA — 40 Fragmentos do Despertar (caem de chefões de nível 400+: 12%; cada Eco da semana vencido: +3).
     3. GUARDIÃO DESPERTO — luta única na Arena dos Ecos (8 min), mais forte que os Ecos, com um poder próprio.
     4. A ESCOLHA — 3 bônus; você FIXA UM no seu boneco, para sempre (soma com os das outras relíquias).
   A relíquia desperta ganha a versão desperta da marca no boneco (brilho_refino.js) e o título "Desperta".
   Só se ganha jogando (Steam: nada à venda). Carregar DEPOIS de cacada_epica.js, torre_infinita.js e brilho_refino.js.
   ============================================================ */
const DESP_KILLS = 10000, DESP_FRAG = 40, DESP_TEMPO = 480000;
const DESP = {
  chuteira_deuses: { base: 'guard_dragao', afixo: 'teleporte', bonus: [['vel', 0.05, '+5% de velocidade'], ['dano', 0.05, '+5% de dano'], ['crit', 0.03, '+3% de chance de golpe crítico']] },
  caneleira_infinito: { base: 'mv_chefe_golem_rei', afixo: 'fogo', bonus: [['def', 0.08, '+8% de defesa'], ['hp', 0.06, '+6% de fôlego'], ['bloqueio', 0.03, '+3% de chance de bloquear']] },
  camisa_multiverso: { base: 'ch_imperador_nebular', afixo: 'meteoros', bonus: [['hp', 0.08, '+8% de fôlego'], ['regenHp', 0.15, '+15% de recuperação de fôlego'], ['def', 0.05, '+5% de defesa']] },
  calcao_cosmico: { base: 'ch_rainha_aneis', afixo: 'furia', bonus: [['vel', 0.04, '+4% de velocidade'], ['regenFoco', 0.15, '+15% de recuperação de foco'], ['dano', 0.04, '+4% de dano']] },
  amuleto_lenda: { base: 'ch_supremo', afixo: 'meteoros', bonus: [['foco', 0.1, '+10% de foco'], ['custoFoco', -0.08, '−8% de foco gasto nas jogadas'], ['cura', 0.1, '+10% de cura']] },
  coroa_eterna: { base: 'jur_rex', afixo: 'escudo', bonus: [['xp', 0.08, '+8% de XP'], ['ouro', 0.1, '+10% de tostões'], ['dano', 0.05, '+5% de dano']] },
};
Object.assign(ITENS, {
  fragmento_desperto: { nome: 'Fragmento do Despertar', tipo: 'loot', venda: 1, desc: 'Um cristal que guarda a força das lendas. A Mestra Altina (Torre Infinita) usa 40 deles para despertar uma relíquia. Cai de chefões de nível 400+ e dos Ecos do Multiverso.' },
});
if (typeof ASSET_SET !== 'undefined' && !ASSET_SET.has('i_fragmento_desperto')) { ASSETS.push('i_fragmento_desperto'); ASSET_SET.add('i_fragmento_desperto'); }
const despNome = id => (ITENS[id] && ITENS[id].nome) || id;
const despSlot = id => { const r = RELIQUIAS.find(x => x[0] === id); return r ? r[2] : null; };
const despNivel = id => { const r = RELIQUIAS.find(x => x[0] === id); return r ? r[3] : 9999; };
function despDados(id) {
  const s = G.save; if (!s) return null; if (!s.despertar || typeof s.despertar !== 'object') s.despertar = {};
  if (!id) return s.despertar;
  return s.despertar[id] || (s.despertar[id] = { kills: 0, ofertado: false, desperta: false, bonus: null, escolher: false });
}
const despTem = id => { const s = G.save; if (!s) return false; return s.equip[despSlot(id)] === id || contaItem(id) > 0 || !!(s.quests['rel_' + id + '_2'] && s.quests['rel_' + id + '_2'].s === 'feita'); };
const despDesperta = id => { try { const d = G.save && G.save.despertar && G.save.despertar[id]; return !!(d && d.desperta); } catch (e) { return false; } };
window.despDesperta = despDesperta;
// os bônus fixados (somados)
function despBonus(tipo) {
  const s = G.save; if (!s || !s.despertar) return 0; let t = 0;
  for (const [id, cfg] of Object.entries(DESP)) { const d = s.despertar[id]; if (d && d.desperta && d.bonus) { const b = cfg.bonus.find(x => x[0] === d.bonus); if (b && b[0] === tipo) t += b[1]; } }
  return t;
}

/* ---------- 1) prova de uso e 2) fragmentos ---------- */
{
  const _mtD = matar;
  matar = function (m) {
    const s = G.save, d = m && m.d, ecosAntes = (s && s.cacEpica && s.cacEpica.feitos) ? s.cacEpica.feitos.length : 0;
    const r = _mtD.apply(this, arguments);
    try {
      if (!s || !d || d.treino || d.pedra || !(d.xp > 0)) return r;
      const nvM = nivelMonstro(d);
      // prova de uso: cada relíquia equipada (que ainda não despertou) conta a vitória
      if (nvM >= s.nivel - 30) for (const id of Object.keys(DESP)) {
        if (s.equip[despSlot(id)] !== id || s.nivel < despNivel(id)) continue;
        const dd = despDados(id); if (dd.desperta || dd.kills >= DESP_KILLS) continue;
        dd.kills++; if (dd.kills === DESP_KILLS) { log(`🌟 PROVA DE USO completa: ${despNome(id)}! Fale com a Mestra Altina (Torre Infinita) para o Despertar.`, 'l-lvl'); banner('🌟 Prova de uso completa!', despNome(id)); }
      }
      // fragmentos: chefões de nível 400+ (12%, 1–2) e +3 por Eco da semana vencido pela 1ª vez
      if (d.chefe && !d.ceEco && nvM >= 400 && Math.random() < 0.12) { const q = Math.random() < 0.3 ? 2 : 1; recebeItem('fragmento_desperto', q); log(`🌟 ${q}x Fragmento do Despertar!`, 'l-raro'); }
      if (d.ceEco && s.cacEpica && s.cacEpica.feitos && s.cacEpica.feitos.length > ecosAntes) { recebeItem('fragmento_desperto', 3); log('🌟 O Eco deixou 3 Fragmentos do Despertar!', 'l-raro'); }
    } catch (e) { }
    return r;
  };
}

/* ---------- 3) o Guardião Desperto (luta especial na Arena dos Ecos) ---------- */
function despEspecial(id) {
  const cfg = DESP[id]; if (!cfg || !MONSTROS[cfg.base]) return null;
  const L = Math.min(1015, Math.max((G.save && G.save.nivel) || 0, despNivel(id)) + 15);
  return {
    id, base: cfg.base, afixo: cfg.afixo, L, tempo: DESP_TEMPO, titulo: `Guardião Desperto (${despNome(id).split(' ')[0]})`,
    ajusta: md => { md.hp = Math.round(md.hp * 1.5); md.atk = Math.round(md.atk * 1.1); md.xp = Math.round(md.xp * 2); md.nome = `${String(MONSTROS[cfg.base].nome).split(',')[0]}, Guardião Desperto`; md.despertar = id; },
    aoVencer: () => despVenceu(id),
  };
}
window.ceEspecial = () => { const s = G.save; const id = s && s.despertar && s.despertar.lutando; return id ? despEspecial(id) : null; };
window.ceEspecialFim = () => { const s = G.save; if (s && s.despertar && s.despertar.lutando && !(G.mapa && G.mapa.ecos)) { s.despertar.lutando = null; } };
function despLuta(id) {
  const s = G.save, dd = despDados(id); if (!dd.ofertado) return;
  if (typeof mvPodeIr === 'function' && mvPodeIr()) { log(mvPodeIr(), 'l-sis'); return; }
  despDados().lutando = id; fechaModal();
  trocaMapa('arena_ecos', 17.5, 24.5);
  const esp = despEspecial(id); banner(`🌟 ${esp.titulo}`, `${CE_AFIXOS[esp.afixo].nome} — ${CE_AFIXOS[esp.afixo].dica}`);
}
function despVenceu(id) {
  const s = G.save, dd = despDados(id), L = despNivel(id), xpNivel = x => Math.max(1, xpPara(x + 1) - xpPara(x));
  dd.desperta = true; dd.escolher = true; despDados().lutando = null;
  const xp = Math.round(xpNivel(Math.max(s.nivel, L)) * 2); ganhaXp(xp);
  log(`🌟 ${despNome(id)} DESPERTOU! +${fmt(xp)} XP. Escolha o bônus que vai ficar no seu boneco.`, 'l-lvl'); som('nivel');
  banner('🌟 RELÍQUIA DESPERTA!', despNome(id)); salvar(); G.uiSujo = true;
  setTimeout(() => despEscolha(id), 1200);
}
// 4) a escolha: um dos 3 bônus fica no boneco para sempre
function despEscolha(id) {
  const dd = despDados(id), cfg = DESP[id]; if (!dd || !dd.escolher) return;
  abreModal(el('h2', {}, `🌟 ${despNome(id)} — Desperta!`),
    el('p', {}, 'A relíquia despertou. Escolha UM destes bônus para fixar no seu boneco, para sempre (ele soma com os bônus das outras relíquias despertas):'),
    el('div', { class: 'opcoes desp-escolha' }, ...cfg.bonus.map(([k, v, txt]) => el('button', { class: 'btn amarelo', type: 'button', onclick: () => {
      dd.bonus = k; dd.escolher = false; salvar(); G.uiSujo = true; fechaModal();
      log(`🌟 Bônus fixado no seu boneco: ${txt} (${despNome(id)} Desperta).`, 'l-lvl'); banner('🌟 Bônus fixado!', txt);
      if (G.mapa && G.mapa.ecos) setTimeout(() => { if (G.mapa && G.mapa.ecos) ceVoltaHub(); }, 900);
    } }, txt))),
    el('p', { class: 'dica' }, 'Pense bem: a escolha não muda depois.'));
  // sem escolher, a janela volta (a escolha fica guardada até você decidir)
  const md = $('#modal .fechar'); if (md) md.hidden = true;
}

/* ---------- os bônus no boneco ---------- */
{
  const _stD = stats;
  stats = function () {
    const st = _stD.apply(this, arguments);
    try {
      if (!G.save || !G.save.despertar) return st;
      const b = t => despBonus(t);
      if (b('hp')) st.maxHp = Math.round(st.maxHp * (1 + b('hp')));
      if (b('foco')) st.maxFoco = Math.round(st.maxFoco * (1 + b('foco')));
      if (b('def')) st.def = st.def * (1 + b('def'));
      if (b('dano')) st.danoMult = (st.danoMult || 1) * (1 + b('dano'));
      if (b('vel')) st.vel = st.vel * (1 + b('vel'));
      if (b('crit')) st.crit = (st.crit || 0) + b('crit');
      if (b('bloqueio')) st.bloqueio = (st.bloqueio || 0) + b('bloqueio');
      if (b('regenHp')) st.regenHp = st.regenHp * (1 + b('regenHp'));
      if (b('regenFoco')) st.regenFoco = st.regenFoco * (1 + b('regenFoco'));
      if (b('custoFoco')) st.custoFoco = (st.custoFoco || 1) * (1 + b('custoFoco'));
      if (b('cura')) st.curaMult = (st.curaMult || 1) * (1 + b('cura'));
    } catch (e) { }
    return st;
  };
  const _gxD = ganhaXp;
  ganhaXp = function (n) { try { const b = despBonus('xp'); if (b && n > 0) arguments[0] = Math.round(n * (1 + b)); } catch (e) { } return _gxD.apply(this, arguments); };
  const _mtO = matar;
  matar = function (m) { const r = _mtO.apply(this, arguments); try { const b = despBonus('ouro'), d = m && m.d; if (b && d && d.ouro && d.ouro[1] > 0 && !d.treino) { G.save.ouro += Math.max(1, Math.round((d.ouro[0] + d.ouro[1]) / 2 * b)); G.uiSujo = true; } } catch (e) { } return r; };
  // a dica do item conta que ela é Desperta
  if (typeof statsItemTxt === 'function') {
    const _sitD = statsItemTxt;
    statsItemTxt = function (id) { const t = _sitD.apply(this, arguments); if (!DESP[id] || !despDesperta(id)) return t; const dd = despDados(id), b = DESP[id].bonus.find(x => x[0] === dd.bonus), e = `🌟 DESPERTA${b ? ' — bônus fixado: ' + b[2] : ''}`; return Array.isArray(t) ? [...t, e] : typeof t === 'string' ? t + ' · ' + e : t; };
  }
}

/* ---------- a janela do Despertar (Mestra Altina) ---------- */
function modalDespertar() {
  const s = G.save; if (!s) return; const frag = contaItem('fragmento_desperto');
  const cards = RELIQUIAS.map(([id, nome, slot, L]) => {
    const dd = despDados(id), tem = despTem(id), barra = (v, max) => el('div', { class: 'tar-bar' }, el('i', { style: `width:${Math.round(Math.min(v, max) / max * 100)}%` }));
    const b = dd.bonus && DESP[id].bonus.find(x => x[0] === dd.bonus);
    let corpo;
    if (dd.desperta) corpo = [el('div', { class: 'desp-ok' }, `🌟 DESPERTA${b ? ' — ' + b[2] : ''}`), dd.escolher ? el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => despEscolha(id) }, 'Escolher o bônus') : ''];
    else if (!tem) corpo = [el('small', {}, `🔒 Conquiste a relíquia primeiro (Guardião da Torre, nível ${L}).`)];
    else if (s.nivel < L) corpo = [el('small', {}, `🔒 A partir do nível ${L}.`)];
    else {
      const k = Math.min(dd.kills, DESP_KILLS), pronto = k >= DESP_KILLS;
      corpo = [el('small', {}, `1. Prova de uso: ${fmt(k)}/${fmt(DESP_KILLS)} vitórias usando a relíquia`), barra(k, DESP_KILLS),
        el('small', {}, `2. Oferenda: ${dd.ofertado ? 'feita ✔' : `${Math.min(frag, DESP_FRAG)}/${DESP_FRAG} Fragmentos do Despertar`}`), dd.ofertado ? '' : barra(frag, DESP_FRAG),
        el('small', {}, `3. Guardião Desperto: ${CE_AFIXOS[DESP[id].afixo].nome}`),
        dd.ofertado ? el('button', { class: 'btn verde mini', type: 'button', onclick: () => despLuta(id) }, '⚔️ Enfrentar o Guardião Desperto')
          : el('button', { class: 'btn amarelo mini', type: 'button', disabled: pronto && frag >= DESP_FRAG ? null : 'disabled', onclick: () => { if (!removeItem('fragmento_desperto', DESP_FRAG)) return; dd.ofertado = true; salvar(); log(`🌟 Oferenda feita: ${DESP_FRAG} Fragmentos do Despertar. O Guardião Desperto de ${nome} espera por você!`, 'l-lvl'); modalDespertar(); } }, `Oferecer ${DESP_FRAG} fragmentos`)];
    }
    return el('div', { class: 'tar-card ativa desp-card' + (dd.desperta ? ' desperta' : '') }, el('b', {}, nome), el('div', { class: 'desp-bonus' }, 'Bônus para escolher: ' + DESP[id].bonus.map(x => x[2]).join(' · ')), ...corpo);
  });
  abreModal.largo = true;
  abreModal(el('h2', {}, '🌟 O Despertar das Relíquias'),
    el('p', {}, 'Toda relíquia guarda uma força adormecida. Para despertá-la: use-a em 10.000 vitórias, ofereça 40 Fragmentos do Despertar e vença o Guardião Desperto. No fim, você escolhe UM bônus para fixar no seu boneco, para sempre.'),
    el('p', { class: 'dica' }, `Você tem ${frag} Fragmento(s) do Despertar. Eles caem de chefões de nível 400+ e dos Ecos do Multiverso (+3 por Eco vencido na semana).`),
    el('div', { class: 'tar-corpo' }, ...cards),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
}
// o botão na Mestra Altina (janela da Torre) e a escolha pendente
{
  const _mt = modalTorre;
  modalTorre = function (npc) {
    const r = _mt.apply(this, arguments);
    try {
      if (npc && npc.d && npc.d.torre === 'mestre') {
        const ops = document.querySelector('#modalConteudo .opcoes') || document.querySelector('#modal .opcoes');
        if (ops && !document.querySelector('.btn-despertar')) ops.before(el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo btn-despertar', type: 'button', onclick: () => modalDespertar() }, '🌟 O Despertar das Relíquias')));
      }
    } catch (e) { }
    return r;
  };
  // se a escolha ficou pendente (recarregou o jogo), ela volta quando o jogo abre
  const _iniD = iniciarJogo;
  iniciarJogo = async function () { const r = await _iniD.apply(this, arguments); try { const dd = G.save && G.save.despertar; if (dd) { if (dd.lutando) dd.lutando = null; const id = Object.keys(DESP).find(k => dd[k] && dd[k].escolher); if (id) setTimeout(() => despEscolha(id), 2500); } } catch (e) { } return r; };
  const css = document.createElement('style');
  css.textContent = `.desp-card small { display: block; margin-top: 3px; } .desp-card .desp-bonus { font-size: 12px; opacity: .8; }
  .desp-card.desperta { background: linear-gradient(90deg, rgba(255,215,80,.35), rgba(255,240,180,.25)); } .desp-ok { font-weight: 800; color: #8a5a00; margin-top: 3px; }
  .desp-escolha { flex-direction: column; align-items: stretch; } .desp-escolha .btn { font-size: 15px; }`;
  document.head.append(css);
}
window.DESPERTAR = { DESP, despDados, despBonus, despVenceu, despEscolha, despEspecial, modalDespertar, DESP_KILLS, DESP_FRAG };
