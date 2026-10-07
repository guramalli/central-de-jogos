/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   PROTEGE O PERSONAGEM (v149)
   Cada conta tem UM save na nuvem (o servidor só substitui). Criar outro
   jogador apagava o antigo sem aviso (num aparelho novo nem perguntava).
   - "Criar meu jogador" com login e personagem na nuvem: aviso com o nome
     dele; o botão principal é continuar com ele; para apagar, digitar o nome.
   - Antes do 1º envio de um personagem DIFERENTE do que está na nuvem, o
     antigo é guardado neste aparelho. O save local também é guardado ao
     clicar em "Nascer!" (vale para quem joga sem conta).
   - 💾 Backup › "Personagens anteriores" › Recuperar.
   Guarda até 3 (comprimidos) em localStorage rac_anteriores_v1.
   Carregar DEPOIS de backup.js, nuvem.js e contas.js.
   ============================================================ */
const PROT = { chave: 'rac_anteriores_v1', conferidoPara: null, liberado: false };

// ---------- os guardados ----------
function lerAnteriores() { try { return JSON.parse(localStorage.getItem(PROT.chave) || '[]'); } catch (e) { return []; } }
function gravaAnteriores(lista) {
  while (lista.length) { try { localStorage.setItem(PROT.chave, JSON.stringify(lista)); return true; } catch (e) { lista.pop(); } } // sem espaço: sai o mais velho
  try { localStorage.removeItem(PROT.chave); } catch (e) { } return false;
}
async function guardaAnterior(save, z) {
  if (!save || (save.nivel | 0) < 2) return; // nível 1: nada a perder
  let item;
  try { item = { nome: save.nome, nivel: save.nivel, criado: save.criado || 0, quando: Date.now(), z: z || (typeof comprime === 'function' ? await comprime(JSON.stringify(save)) : null) }; } catch (e) { item = null; }
  if (!item || !item.z) item = { nome: save.nome, nivel: save.nivel, criado: save.criado || 0, quando: Date.now(), json: JSON.stringify(save) };
  const lista = lerAnteriores().filter(a => !(a.criado && a.criado === item.criado && a.nivel > item.nivel)); // já tem uma mais avançada dele: fica a melhor
  if (lista.some(a => a.criado && a.criado === item.criado)) return;
  gravaAnteriores([item, ...lista.filter(a => !(a.criado && a.criado === item.criado))].slice(0, 3));
}
async function abreAnterior(a) { return a.json ? JSON.parse(a.json) : JSON.parse(await descomprime(a.z)); }

// ---------- o que está na nuvem agora ----------
async function pegaOnline(ms, fresco) {
  if (!fresco && NUVEM.online) return NUVEM.online;
  const prazo = new Promise(ok => setTimeout(() => ok({ falhou: true }), ms));
  const pede = (async () => {
    const r = await nuvemPede('GET', '/save');
    if (r.status === 404) return { save: null };
    if (!r.ok) return { falhou: true };
    return { save: JSON.parse(await descomprime(r.dados.dados)), z: r.dados.dados, quando: new Date(r.dados.atualizadoEm).getTime() };
  })().catch(() => ({ falhou: true }));
  const r = await Promise.race([pede, prazo]);
  if (!r.falhou) NUVEM.online = r;
  return r;
}

if (typeof NUVEM !== 'undefined' && NUVEM.ativa) {
  // antes do 1º envio deste personagem: se na nuvem há OUTRO, guarda ele aqui
  const _enviaSaveProt = enviaSave;
  enviaSave = async function (forcar) {
    if (G.save && G.rodando && !NUVEM.parada && PROT.conferidoPara !== G.save.criado && saveDaConta()) {
      const r = await pegaOnline(8000, PROT.conferidoPara !== null);
      if (r.falhou) return; // não deu para conferir: tenta de novo no próximo envio
      if (r.save && r.save.criado !== G.save.criado) await guardaAnterior(r.save, r.z);
      PROT.conferidoPara = G.save.criado;
    }
    return _enviaSaveProt.apply(this, arguments);
  };
  const _enviaPacoteProt = enviaPacoteAgora;
  enviaPacoteAgora = function () { if (G.save && PROT.conferidoPara !== G.save.criado) return; return _enviaPacoteProt.apply(this, arguments); };
}

// ---------- "Criar meu jogador" com personagem na conta ----------
function modalProtege(on, z) {
  const fase = typeof FASES !== 'undefined' ? ' · ' + FASES[faseIdx(on.nivel)].nome : '';
  const inp = el('input', { type: 'text', placeholder: `Type ${on.nome}`, autocomplete: 'off', style: 'width:100%;margin:6px 0' });
  const apaga = el('button', { class: 'btn', type: 'button', disabled: 'disabled', style: 'background:#c0392b;color:#fff', onclick: async () => {
    await guardaAnterior(on, z); fechaModal(); abrirCriacao();
  } }, '🗑️ Delete and create another');
  inp.addEventListener('input', () => { apaga.disabled = inp.value.trim().toLowerCase() !== String(on.nome).trim().toLowerCase(); });
  abreModal(el('h2', {}, '⚠️ Your account already has a player'),
    el('p', {}, 'Your account has ', el('b', {}, on.nome), `, level ${on.nivel}${fase}.`),
    el('p', {}, 'Each account has ONE player. If you create another one, ', el('b', {}, on.nome), ' will be replaced in the game, in the cloud and in the Ranking.'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', type: 'button', onclick: () => {
      const local = lerSave();
      if (local && local.criado !== on.criado) guardaAnterior(local);
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(on)); } catch (e) { }
      fechaModal(); iniciarJogo(on);
    } }, `▶ Continue with ${on.nome}`)),
    el('details', { class: 'prot-apagar' }, el('summary', {}, 'I really want to start over'),
      el('p', {}, `To confirm, type the player's name: `, el('b', {}, on.nome)), inp, el('div', { class: 'opcoes' }, apaga),
      el('p', { class: 'vazio' }, `A copy of ${on.nome} stays saved on this device (💾 Backup › Previous characters).`)));
}
document.addEventListener('click', async ev => {
  const b = ev.target && ev.target.closest && ev.target.closest('#btnNovo');
  if (!b || PROT.liberado || typeof CONTA === 'undefined' || !CONTA || G.rodando) return;
  ev.stopImmediatePropagation(); ev.preventDefault();
  const txt = b.textContent; b.textContent = '☁️ Checking your account...';
  const r = await pegaOnline(6000, true); b.textContent = txt;
  if (r.save && (r.save.nivel | 0) >= 2) return modalProtege(r.save, r.z);
  PROT.liberado = true; try { b.click(); } finally { PROT.liberado = false; } // nada na conta (ou sem conexão): segue normal
}, true);

// "Nascer!": o jogador deste aparelho fica guardado antes de ser trocado
document.addEventListener('click', ev => {
  if (!ev.target || !ev.target.closest || !ev.target.closest('#btnNascer')) return;
  const s = lerSave(); if (s) guardaAnterior(s);
}, true);

// ---------- 💾 Backup › Personagens anteriores ----------
if (typeof modalBackup === 'function') {
  const _modalBackupProt = modalBackup;
  modalBackup = function () {
    const r = _modalBackupProt.apply(this, arguments);
    const lista = lerAnteriores(), box = document.getElementById('modalConteudo');
    if (!lista.length || !box) return r;
    const data = t => new Date(t).toLocaleString('en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    box.append(el('h3', {}, '♻️ Previous characters'),
      el('p', { class: 'vazio' }, 'Saved on this device when another player was created.'),
      ...lista.map(a => el('div', { class: 'linha-item' },
        el('div', { class: 'nm' }, el('b', {}, `${a.nome} · level ${a.nivel}`), el('small', {}, `guardado em ${data(a.quando)}`)),
        el('button', { class: 'btn mini amarelo', type: 'button', onclick: () => recuperaAnterior(a) }, '♻️ Restore'))));
    return r;
  };
}
async function recuperaAnterior(a) {
  let s; try { s = await abreAnterior(a); } catch (e) { avisoJogo('Couldn\'t open this character.'); return; }
  if (G.rodando) { try { salvar(); } catch (e) { } }
  const atual = lerSave();
  if (!(await perguntaJogo(`Go back to playing as ${s.nome} (level ${s.nivel})?` + (atual && atual.criado !== s.criado ? `\n\n${atual.nome} (level ${atual.nivel}) will stay saved here too.` : ''), { sim: 'Play as ' + s.nome }))) return;
  if (atual && atual.criado !== s.criado) await guardaAnterior(atual);
  // o jogo salva o jogador em curso ao sair da página: ele passa a ser o recuperado (senão sobrescreveria)
  if (G.rodando) { G.rodando = false; G.save = s; }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); sessionStorage.setItem('rac_recuperado', String(s.criado || '')); } catch (e) { }
  location.reload();
}
// recuperado agora: o "Continuar" não pergunta de novo qual usar (o da nuvem é guardado antes do envio)
if (typeof escolheSave === 'function') {
  const _escolheSaveProt = escolheSave;
  escolheSave = function (local, nuvem, mesmo) {
    let rec = null; try { rec = sessionStorage.getItem('rac_recuperado'); } catch (e) { }
    if (rec && local && String(local.criado || '') === rec) { try { sessionStorage.removeItem('rac_recuperado'); } catch (e) { } return iniciarJogo(local); }
    return _escolheSaveProt.apply(this, arguments);
  };
}
