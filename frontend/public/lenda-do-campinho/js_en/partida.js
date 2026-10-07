/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📺 PARTIDA AO VIVO — estilo Elifoot/Brasfoot (v163)
   Você ASSISTE: relógio de 0' a 90', campo com os jogadores, narração,
   estatísticas. Mexa no time quando quiser: formação, tática e até 5
   substituições (o cansaço aparece ao vivo). Sem botões de "o que você faz":
   o seu craque decide sozinho pelos atributos dele.
   Substitui jogarPartida() de team.js (mesmo motor: setores/lance/concluiJogo).
   ============================================================ */
const PART_VELS = [{ rot: '1×', ms: 420 }, { rot: '2×', ms: 200 }, { rot: '4×', ms: 80 }];
const PART_SUBS = 5;
const PART_COL = { GOL: 0.06, ZAG: 0.2, LAT: 0.27, VOL: 0.36, MEI: 0.5, ATA: 0.68 };

function jogarPartida(pj, nos0, eles0) {
  const s = G.save, t = s.time;
  const titOrig = t.titulares.slice(), formOrig = t.formacao; // as trocas valem só para esta partida
  const escE = timeIA(pj.adv);
  let min = 0, gn = 0, ge = 0, fim = false, pausa = false, velI = 0, timer = null, raf = 0, subs = 0, sel = null;
  const est = { chN: 0, chE: 0, alvoN: 0, alvoE: 0, posN: 1, posE: 1 };
  const gastoTot = {}; // quanto cada jogador cansa na partida (por minuto)
  const energiaAgora = j => { if (!j) return 100; const g = gastoTot[j.id] || 0; return clamp((j.eu ? t.energiaEu : j.energia) - g, 0, 100); };
  const comEnergia = j => j && Object.assign({}, j, { energia: energiaAgora(j) });
  const minhaEsc = () => escalacaoAtual();
  const forcas = () => {
    const nos = setores(minhaEsc().map(x => ({ slot: x.slot, j: comEnergia(x.j) })), t.tatica, t.moral);
    const cans = 1 - 0.1 * min / 90; const eles = setores(escE, pj.adv.tatica); for (const k of ['atq', 'mei', 'def']) eles[k] *= cans;
    if (pj.casa) { nos.atq *= 1.04; nos.mei *= 1.04; nos.def *= 1.04; } else if (!(pj.tipo === 'copa' && pj.fase === 2)) { eles.atq *= 1.04; eles.mei *= 1.04; eles.def *= 1.04; }
    return { nos, eles };
  };

  /* ---------- tela ---------- */
  const esc = (c1, c2, n) => typeof escudo === 'function' ? escudo(c1, c2, n) : el('span');
  const pMin = el('span', { class: 'pt-min' }, "0'"), pPlac = el('b', { class: 'pt-plac' }, '0 × 0');
  const posseI = el('i'); const posse = el('div', { class: 'pt-posse', title: 'Ball possession' }, posseI);
  const cab = el('div', { class: 'pt-cab' }, el('div', { class: 'pt-time' }, esc(t.cor1, t.cor2, 26), el('span', {}, t.nome)), el('div', { class: 'pt-centro' }, pPlac, pMin), el('div', { class: 'pt-time dir' }, el('span', {}, pj.adv.nome), esc(pj.adv.cor1, pj.adv.cor2, 26)));
  const cv = el('canvas', { width: 640, height: 360, class: 'pt-campo' }); const cx = cv.getContext('2d');
  const narr = el('div', { class: 'pt-narr' });
  const estBox = el('div', { class: 'pt-est' });
  const painel = el('div', { class: 'pt-painel' });
  const bPausa = el('button', { class: 'btn mini', type: 'button' }, '⏸ Pause'), bVel = el('button', { class: 'btn mini', type: 'button' }, 'Speed 1×'), bFim = el('button', { class: 'btn mini', type: 'button' }, '⏩ Skip to the end');
  const ctl = el('div', { class: 'pt-ctl' }, bPausa, bVel, bFim);
  const final = el('div', { class: 'pt-final' });
  const diz = (txt, cls = '') => narr.prepend(el('div', { class: 'pt-lance ' + cls }, txt));

  /* ---------- painel do time (mexe a qualquer hora) ---------- */
  function montaPainel() {
    painel.innerHTML = '';
    const fSel = el('select', { class: 'sel' }, ...Object.keys(FORMACOES).map(f => el('option', { value: f, selected: f === t.formacao ? 'selected' : null }, f)));
    fSel.onchange = () => { t.formacao = fSel.value; // mantém os mesmos jogadores, reorganizados nas posições novas
      const jogando = t.titulares.filter(Boolean); autoEscalarCom(jogando); diz(`${min}' 📋 The coach switches to ${t.formacao}.`, 'pt-sis'); montaPainel(); };
    const tSel = el('select', { class: 'sel' }, ...Object.entries(TATICAS).map(([k, v]) => el('option', { value: k, selected: k === t.tatica ? 'selected' : null }, v.nome)));
    tSel.onchange = () => { t.tatica = tSel.value; diz(`${min}' 📋 Tactic: ${TATICAS[t.tatica].nome}.`, 'pt-sis'); montaPainel(); };
    painel.append(el('div', { class: 'pt-sels' }, el('label', {}, 'Formation ', fSel), el('label', {}, 'Tactic ', tSel)));
    painel.append(el('div', { class: 'pt-dica' }, sel ? `Now click who comes IN (from the bench) to replace ${jogadorPorId(sel).nome}.` : `Substitutions: ${subs}/${PART_SUBS}. Click who's coming OFF.`));
    const linha = (j, slot, emCampo) => {
      const e = Math.round(energiaAgora(j)); const cor = e > 60 ? '#3ad83a' : e > 30 ? '#e8d23a' : '#e83a3a';
      const bar = el('div', { class: 'pt-en' }, el('i', { style: `width:${e}%;background:${cor}` }));
      const b = el('button', { class: 'pt-jog' + (sel === j.id ? ' sel' : '') + (emCampo ? '' : ' banco'), type: 'button', disabled: fim || (!emCampo && !sel) || (emCampo && subs >= PART_SUBS && !sel) ? 'disabled' : null,
        onclick: () => {
          if (emCampo) { sel = sel === j.id ? null : j.id; montaPainel(); return; }
          if (!sel || subs >= PART_SUBS) return;
          const k = t.titulares.indexOf(sel); if (k < 0) return; const sai = jogadorPorId(sel);
          t.titulares[k] = j.id; subs++; sel = null;
          diz(`${min}' 🔁 Substitution: ${sai.nome} off, ${j.nome} on.`, 'pt-sis'); som('apito'); montaPainel();
        } },
        el('b', { class: 'pos-tag' }, slot || j.pos), el('span', { class: 'pt-nm' }, (j.eu ? '★ ' : '') + j.nome), el('span', { class: 'pt-ovr' }, ovr(j)), bar);
      return b;
    };
    const titulares = minhaEsc(); painel.append(el('div', { class: 'pt-grupo' }, 'On the field'));
    for (const x of titulares) if (x.j) painel.append(linha(x.j, x.slot, true));
    const banco = elencoCompleto().filter(j => !t.titulares.includes(j.id));
    painel.append(el('div', { class: 'pt-grupo' }, `Bench (${banco.length})`));
    if (!banco.length) painel.append(el('p', { class: 'vazio' }, 'No subs: sign players in the Market so you can swap out tired ones.'));
    for (const j of banco) painel.append(linha(j, null, false));
  }
  // reorganiza os mesmos jogadores numa formação nova (melhor encaixe de posição)
  function autoEscalarCom(ids) {
    const slots = FORMACOES[t.formacao]; const livres = ids.map(id => jogadorPorId(id)).filter(Boolean); const tit = [];
    slots.forEach(slot => { let best = -1, bv = -1; livres.forEach((j, k) => { const v = ovrNoSlot(j, slot); if (v > bv) { bv = v; best = k; } }); tit.push(best >= 0 ? livres.splice(best, 1)[0].id : null); });
    t.titulares = tit;
  }

  /* ---------- campo ---------- */
  const W = 640, H = 360, M = 16;
  const pos = new Map(); let bola = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2 }, ataca = 0; // ataca: 1 nós, -1 eles
  function alvosTime(escs, lado) { // lado 0 = nós (ataca para a direita), 1 = eles
    const porLinha = {}; escs.forEach((x, k) => { if (!x.j) return; (porLinha[x.slot] = porLinha[x.slot] || []).push(k); });
    const out = [];
    escs.forEach((x, k) => {
      if (!x.j) return; const grupo = porLinha[x.slot]; const i = grupo.indexOf(k), n = grupo.length;
      let fy = x.slot === 'LAT' ? (i % 2 ? 0.86 : 0.14) : (n === 1 ? 0.5 : 0.2 + 0.6 * i / (n - 1));
      let fx = PART_COL[x.slot] || 0.4; const emp = (lado === 0 ? ataca : -ataca) * (x.slot === 'GOL' ? 0.02 : 0.07);
      fx = clamp(fx + emp, 0.03, 0.8); if (lado === 1) fx = 1 - fx;
      out.push({ id: (lado ? 'E' : 'N') + k, j: x.j, x: M + fx * (W - 2 * M), y: M + fy * (H - 2 * M), lado });
    });
    return out;
  }
  function desenhaCampo() {
    const g = cx; g.clearRect(0, 0, W, H);
    for (let k = 0; k < 12; k++) { g.fillStyle = k % 2 ? '#3c9a45' : '#44a84e'; g.fillRect(k * W / 12, 0, W / 12 + 1, H); }
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2;
    g.strokeRect(M, M, W - 2 * M, H - 2 * M); g.beginPath(); g.moveTo(W / 2, M); g.lineTo(W / 2, H - M); g.stroke();
    g.beginPath(); g.arc(W / 2, H / 2, 42, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, H / 2, 3, 0, 7); g.fill();
    for (const lado of [0, 1]) { const x0 = lado ? W - M - 86 : M, x1 = lado ? W - M - 30 : M; g.strokeRect(x0, H / 2 - 88, 86, 176); g.strokeRect(lado ? W - M - 30 : M, H / 2 - 44, 30, 88); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(lado ? W - M : M - 6, H / 2 - 22, 6, 44); }
    const todos = [...alvosTime(minhaEsc(), 0), ...alvosTime(escE, 1)];
    for (const p of todos) { const q = pos.get(p.id) || { x: p.x, y: p.y }; q.x += (p.x + Math.sin(performance.now() / 700 + p.y) * 3 - q.x) * 0.06; q.y += (p.y + Math.cos(performance.now() / 800 + p.x) * 3 - q.y) * 0.06; pos.set(p.id, q); p.q = q; }
    for (const p of todos) {
      const nosT = p.lado === 0, gk = p.j && (p.j.pos === 'GOL') && ((nosT && minhaEsc().find(x => x.j === p.j)?.slot === 'GOL') || (!nosT));
      const c1 = nosT ? t.cor1 : pj.adv.cor1, c2 = nosT ? t.cor2 : pj.adv.cor2;
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(p.q.x, p.q.y + 9, 9, 3.5, 0, 0, 7); g.fill();
      g.fillStyle = c1; g.strokeStyle = c2; g.lineWidth = 3; g.beginPath(); g.arc(p.q.x, p.q.y, 9, 0, 7); g.fill(); g.stroke();
      if (p.j && p.j.eu) { g.fillStyle = '#ffe14a'; g.font = '900 13px sans-serif'; g.textAlign = 'center'; g.fillText('★', p.q.x, p.q.y - 12); }
    }
    bola.x += (bola.tx - bola.x) * 0.1; bola.y += (bola.ty - bola.y) * 0.1;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(bola.x, bola.y + 5, 5, 2, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 1.5; g.beginPath(); g.arc(bola.x, bola.y, 4.5, 0, 7); g.fill(); g.stroke();
    raf = requestAnimationFrame(desenhaCampo);
  }

  /* ---------- relógio e lances ---------- */
  const ATQ_P = { ATA: 3, MEI: 2, LAT: 1, VOL: 0.5, ZAG: 0.2, GOL: 0 };
  function atualizaCab() {
    pPlac.textContent = `${gn} × ${ge}`; pMin.textContent = fim ? 'FIM' : min <= 45 ? `${min}'` : `${min}' (2º)`;
    const pN = est.posN / (est.posN + est.posE); posseI.style.width = Math.round(pN * 100) + '%';
    estBox.innerHTML = ''; estBox.append(
      el('div', {}, el('b', {}, est.chN), el('span', {}, 'Shots'), el('b', {}, est.chE)),
      el('div', {}, el('b', {}, est.alvoN), el('span', {}, 'On target'), el('b', {}, est.alvoE)),
      el('div', {}, el('b', {}, Math.round(pN * 100) + '%'), el('span', {}, 'Possession'), el('b', {}, Math.round((1 - pN) * 100) + '%')));
  }
  function minuto() {
    if (pausa || fim) return;
    min++;
    for (const x of minhaEsc()) if (x.j) { const tt = TATICAS[t.tatica]; gastoTot[x.j.id] = (gastoTot[x.j.id] || 0) + 20 / 90 * tt.en * (1 - 0.05 * ((t.estr && t.estr.med) || 0)); }
    if (min === 46) diz("45' ⏱️ Half time. A good moment to change your team!", 'pt-sis');
    const { nos, eles } = forcas();
    const pa = Math.pow(nos.mei, 2) / (Math.pow(nos.mei, 2) + Math.pow(eles.mei, 2)); if (Math.random() < pa) est.posN++; else est.posE++;
    ataca += ((Math.random() < pa ? 1 : -1) - ataca) * 0.3;
    if (Math.random() < 0.19) lanceAoVivo(nos, eles);
    else { bola.tx = W / 2 + ataca * rndi(40, 180); bola.ty = rndi(60, H - 60); }
    atualizaCab(); if (min % 3 === 0) montaPainel();
    if (min >= 90) return terminar();
    timer = setTimeout(minuto, PART_VELS[velI].ms);
  }
  function lanceAoVivo(nos, eles) {
    const r = lance(nos, eles); const escN = minhaEsc();
    const X = r.atacaA ? escN : escE, Y = r.atacaA ? escE : escN; const nomeT = r.atacaA ? t.nome : pj.adv.nome;
    const atac = nomeLance(X, ATQ_P); const zag = nomeLance(Y, { ZAG: 3, VOL: 2, LAT: 1 }); const gk = Y.find(x => x.slot === 'GOL'); const gkN = gk && gk.j ? gk.j.nome : 'the goalkeeper';
    const eu = atac && atac.eu; const m = `${min}'`;
    bola.tx = r.atacaA ? rndi(W * 0.62, W - 60) : rndi(60, W * 0.38); bola.ty = rndi(70, H - 70);
    if (r.tipo !== 'desarme') { if (r.atacaA) est.chN++; else est.chE++; }
    if (r.tipo === 'desarme') diz(`${m} ${atac.nome} tries to get past, but ${zag.nome} wins the ball.`);
    else if (r.tipo === 'fora') diz(`${m} ${eu ? '⭐ ' : ''}${atac.nome} (${nomeT}) shoots... wide!`, eu ? 'pt-eu' : '');
    else if (r.tipo === 'defesa') { if (r.atacaA) est.alvoN++; else est.alvoE++; diz(`${m} 🧤 ${eu ? '⭐ ' : ''}${atac.nome} hits it hard and ${gkN} makes a great save!`, eu ? 'pt-eu' : 'pt-def'); }
    else {
      if (r.atacaA) { gn++; est.alvoN++; } else { ge++; est.alvoE++; }
      bola.tx = r.atacaA ? W - M : M; bola.ty = H / 2;
      diz(`${m} ⚽ GOOOAL for ${nomeT}! ${eu ? `⭐ ${s.nome.toUpperCase()} (YOU!)` : atac.nome} puts it in the net!`, r.atacaA ? 'pt-gol' : 'pt-golc'); som(r.atacaA ? 'gol' : 'ai');
      if (eu) treinaSkill('chute', 3);
    }
  }
  function terminar() {
    fim = true; clearTimeout(timer); atualizaCab();
    // quem entrou também joga: o cansaço vale para a escalação final (o motor antigo gasta a energia de quem terminou em campo)
    const escFinal = minhaEsc(); const { nos, eles } = forcas();
    const r = concluiJogo(pj, gn, ge, escFinal, false, nos, eles);
    t.titulares = titOrig; t.formacao = formOrig; salvar(); // volta a escalação de antes (as trocas eram só desta partida)
    diz(`Game over! ${r.txt}`, 'pt-sis'); som(r.venceu ? 'nivel' : 'apito');
    final.innerHTML = ''; final.append(el('div', { class: 'pt-res ' + (r.venceu ? 'v' : r.empate ? 'e' : 'd') }, r.venceu ? '🏆 VICTORY!' : r.empate ? '🤝 Tie' : '😔 Defeat'), el('p', {}, `Your pocket: +${fmt(r.bicho)} coins · +${fmt(r.xp)} XP`), el('div', { class: 'opcoes', style: 'justify-content:center' }, botaoContinuar()));
    ctl.innerHTML = ''; montaPainel();
    $('#modal .fechar').hidden = false;
  }
  bPausa.onclick = () => { pausa = !pausa; bPausa.textContent = pausa ? '▶ Continue' : '⏸ Pause'; if (!pausa && !fim) { clearTimeout(timer); timer = setTimeout(minuto, 150); } };
  bVel.onclick = () => { velI = (velI + 1) % PART_VELS.length; bVel.textContent = 'Speed ' + PART_VELS[velI].rot; };
  bFim.onclick = () => { if (fim) return; clearTimeout(timer); pausa = false; while (!fim) minutoRapido(); };
  function minutoRapido() { // o mesmo minuto, sem esperar
    min++; for (const x of minhaEsc()) if (x.j) gastoTot[x.j.id] = (gastoTot[x.j.id] || 0) + 20 / 90 * TATICAS[t.tatica].en;
    const { nos, eles } = forcas(); const pa = Math.pow(nos.mei, 2) / (Math.pow(nos.mei, 2) + Math.pow(eles.mei, 2)); if (Math.random() < pa) est.posN++; else est.posE++;
    if (Math.random() < 0.19) lanceAoVivo(nos, eles); if (min >= 90) terminar();
  }
  window.pararPartida = () => { if (!fim) { clearTimeout(timer); fim = true; t.titulares = titOrig; t.formacao = formOrig; } cancelAnimationFrame(raf); window.pararPartida = null; };

  abreModal.largo = true;
  abreModal(el('div', { class: 'pt-topo' }, el('small', {}, pj.tipo === 'copa' ? `${t.copa.nome} — ${FASES_COPA[pj.fase]}` : `${nomeDivisao(t.div)} — Round ${t.liga.rodada + 1}`), cab, posse),
    el('div', { class: 'pt-meio' }, el('div', { class: 'pt-esq' }, cv, estBox, ctl, final, narr), painel));
  $('#modal .fechar').hidden = true;
  montaPainel(); atualizaCab(); diz("0' 🟢 Kickoff!", 'pt-sis'); som('apito');
  raf = requestAnimationFrame(desenhaCampo);
  timer = setTimeout(minuto, 700);
}
{
  const st = document.createElement('style');
  st.textContent = `
  .pt-topo { text-align: center; margin-bottom: 6px; } .pt-topo small { opacity: .75; font-weight: 700; }
  .pt-cab { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; background: linear-gradient(#1c1433, #2b1d4d); color: #fff; border-radius: 12px; padding: 8px 12px; margin-top: 4px; }
  .pt-time { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 16px; } .pt-time.dir { justify-content: flex-end; }
  .pt-centro { display: flex; flex-direction: column; align-items: center; } .pt-plac { font-size: 30px; color: #ffe14a; letter-spacing: 2px; line-height: 1; } .pt-min { font-weight: 800; font-size: 13px; background: #3aa04a; border-radius: 8px; padding: 1px 8px; margin-top: 3px; }
  .pt-posse { height: 6px; background: #c84a4a; border-radius: 3px; margin-top: 5px; overflow: hidden; } .pt-posse i { display: block; height: 100%; background: #3a8ae0; transition: width .6s; }
  .pt-meio { display: grid; grid-template-columns: minmax(0, 1fr) 270px; gap: 10px; align-items: start; }
  .pt-campo { width: 100%; height: auto; border-radius: 10px; border: 3px solid #2a5a2e; display: block; }
  .pt-est { display: flex; justify-content: space-around; gap: 6px; margin: 6px 0; } .pt-est div { display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,.06); border-radius: 8px; padding: 3px 10px; font-size: 13px; } .pt-est b { font-size: 15px; }
  .pt-ctl { display: flex; gap: 6px; justify-content: center; margin: 4px 0; }
  .pt-narr { max-height: 170px; overflow: auto; background: rgba(255,255,255,.6); border-radius: 10px; padding: 4px 8px; }
  .pt-lance { padding: 3px 0; border-bottom: 1px dashed rgba(0,0,0,.12); font-size: 14px; } .pt-gol { color: #1a7a2a; font-weight: 800; } .pt-golc { color: #b0301a; font-weight: 800; } .pt-def { color: #2a5ab0; } .pt-eu { color: #8a5a00; font-weight: 800; background: rgba(255,225,74,.25); } .pt-sis { font-style: italic; opacity: .85; }
  .pt-painel { background: rgba(255,255,255,.55); border-radius: 10px; padding: 6px; max-height: 560px; overflow: auto; }
  .pt-sels { display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; } .pt-sels .sel { width: 100%; }
  .pt-dica { font-size: 12px; font-weight: 700; background: #fff6d8; border-radius: 6px; padding: 4px 6px; margin: 4px 0; }
  .pt-grupo { font-weight: 800; font-size: 12px; margin: 6px 0 2px; opacity: .8; text-transform: uppercase; }
  .pt-jog { display: grid; grid-template-columns: 34px 1fr 26px; grid-template-rows: auto 4px; gap: 1px 4px; width: 100%; text-align: left; background: #fffdf5; border: 1px solid rgba(0,0,0,.12); border-radius: 6px; padding: 3px 5px; margin: 2px 0; cursor: pointer; font: inherit; font-size: 12px; }
  .pt-jog.sel { outline: 3px solid #e8a020; } .pt-jog.banco { background: #f2f0ff; } .pt-jog:disabled { cursor: default; opacity: .75; }
  .pt-jog .pos-tag { font-size: 10px; } .pt-nm { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; } .pt-ovr { font-weight: 800; text-align: right; }
  .pt-en { grid-column: 1 / -1; background: rgba(0,0,0,.12); border-radius: 2px; overflow: hidden; } .pt-en i { display: block; height: 100%; transition: width .5s; }
  .pt-final { text-align: center; } .pt-res { font-size: 22px; font-weight: 900; margin: 6px 0 0; } .pt-res.v { color: #1a7a2a; } .pt-res.d { color: #b0301a; }
  @media (max-width: 760px) { .pt-meio { grid-template-columns: 1fr; } .pt-painel { max-height: none; } .pt-plac { font-size: 24px; } .pt-time { font-size: 13px; } }`;
  document.head.append(st);
}
