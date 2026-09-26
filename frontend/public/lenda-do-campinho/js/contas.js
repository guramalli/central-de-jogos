/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   CONTAS: o save do aparelho sabe DE QUAL CONTA ele é
   O save local é do navegador, não da conta. Antes, quem tinha jogado com
   a conta B no celular e depois entrava com a conta A abria (Continuar) o
   personagem da B — e o jogo mandava ele por cima do save online da A.
   Agora:
   - todo personagem aberto com login ganha a marca s.conta;
   - personagem de OUTRA conta nunca sobe (save, ranking, casa: saveDaConta);
   - trocou de conta no aparelho: o personagem da anterior fica guardado à
     parte (rac_save_conta_<id>) e volta quando ela entrar de novo;
   - "Continuar" confere com o save online: se for outro personagem, ou o
     online estiver mais avançado, a pessoa escolhe qual usar.
   Carregar DEPOIS de nuvem.js.
   ============================================================ */
const CONTA = typeof PORTAL !== 'undefined' && PORTAL.ativo && PORTAL.token ? PORTAL.contaId : null;
const chaveConta = id => 'rac_save_conta_' + String(id).replace(/[^\w-]/g, '').slice(0, 40);
let CONTA_SEM_CONFERIR = false; // não deu para ver o save online: joga, mas não manda nada desta vez

if (CONTA) {
  // 1) trocou de conta neste aparelho: guarda o personagem da outra e traz o desta
  try {
    const local = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (local && local.conta && local.conta !== CONTA) { localStorage.setItem(chaveConta(local.conta), JSON.stringify(local)); localStorage.removeItem(SAVE_KEY); }
    if (!localStorage.getItem(SAVE_KEY)) { const meu = localStorage.getItem(chaveConta(CONTA)); if (meu) { localStorage.setItem(SAVE_KEY, meu); localStorage.removeItem(chaveConta(CONTA)); } }
  } catch (e) { }

  // 2) todo personagem que entra com login passa a ser desta conta
  const _iniciarJogoCt = iniciarJogo;
  iniciarJogo = async function (s, ...resto) {
    if (s && typeof s === 'object' && !s.conta && !CONTA_SEM_CONFERIR) s.conta = CONTA;
    return _iniciarJogoCt.call(this, s, ...resto);
  };
  const _saveDaContaCt = saveDaConta;
  saveDaConta = function (s = G.save) { return !CONTA_SEM_CONFERIR && _saveDaContaCt(s); };

  // 3) "Continuar": confere com o save online antes de abrir
  document.addEventListener('DOMContentLoaded', () => {
    const bc = document.getElementById('btnContinuar'); const local = lerSave();
    if (bc && local) bc.onclick = () => confereContinuar(local);
  });
}

// pede o save online com prazo (o servidor pode estar acordando)
async function saveOnlineComPrazo(ms) {
  const prazo = new Promise(ok => setTimeout(() => ok({ falhou: true }), ms));
  const pede = (async () => {
    const r = await nuvemPede('GET', '/save');
    if (r.status === 404) return { nuvem: null };
    if (!r.ok) return { falhou: true };
    return { nuvem: JSON.parse(await descomprime(r.dados.dados)), quando: new Date(r.dados.atualizadoEm).getTime() };
  })().catch(() => ({ falhou: true }));
  return Promise.race([pede, prazo]);
}

async function confereContinuar(local) {
  const bc = document.getElementById('btnContinuar');
  if (bc.dataset.conferindo) return;
  bc.dataset.conferindo = '1'; const txt = bc.innerHTML; bc.textContent = '☁️ Conferindo seu save...';
  const r = await saveOnlineComPrazo(9000);
  delete bc.dataset.conferindo; bc.innerHTML = txt;
  if (r.falhou) {
    // já é desta conta: pode seguir normal. Sem marca: não dá pra saber de quem é, então não sobe nada
    if (!local.conta) { CONTA_SEM_CONFERIR = true; setTimeout(() => nuvemStatus('☁️ Não deu para conferir o save online: desta vez salvo só neste aparelho'), 3000); }
    return iniciarJogo(local);
  }
  const nuvem = r.nuvem;
  if (!nuvem) return iniciarJogo(local);
  const mesmo = nuvem.criado ? nuvem.criado === local.criado : nuvem.nome === local.nome;
  const onlineMaisNovo = mesmo && (nuvem.salvoEm || r.quando || 0) > (local.salvoEm || 0) + 60000 && (nuvem.xp || 0) > (local.xp || 0);
  if (mesmo && !onlineMaisNovo) return iniciarJogo(local);
  escolheSave(local, nuvem, mesmo);
}

function escolheSave(local, nuvem, mesmo) {
  const antiga = document.getElementById('contaEscolha'); if (antiga) antiga.remove();
  const desc = s => `${s.nome} · nível ${s.nivel}`;
  const usaOnline = () => {
    try {
      if (!mesmo) localStorage.setItem('rac_save_semconta_' + (local.criado || Date.now()), JSON.stringify(local)); // guardado, não se perde
      localStorage.setItem(SAVE_KEY, JSON.stringify(nuvem));
    } catch (e) { }
    iniciarJogo(nuvem);
  };
  const usaLocal = () => {
    if (!confirm(`O save online da sua conta (${desc(nuvem)}) vai ser SUBSTITUÍDO por ${desc(local)}. Continuar?`)) return;
    iniciarJogo(local);
  };
  const caixa = el('div', { class: 'nuvem-caixa', id: 'contaEscolha' },
    el('b', {}, mesmo ? '☁️ Seu save online está mais avançado' : '☁️ Qual personagem é seu?'),
    el('small', {}, mesmo
      ? ` Online: nível ${nuvem.nivel}. Neste aparelho: nível ${local.nivel} (mais antigo).`
      : ` Na sua conta: ${desc(nuvem)}. Neste aparelho: ${desc(local)} — pode ser de outra conta que já jogou aqui.`),
    el('div', { class: 'conta-bts' },
      el('button', { class: 'btn amarelo', type: 'button', onclick: usaOnline }, `☁️ Jogar com ${desc(nuvem)}`),
      el('button', { class: 'btn', type: 'button', onclick: usaLocal }, `📱 Jogar com ${desc(local)} (o deste aparelho)`)));
  document.getElementById('inicioMenu').prepend(caixa);
  caixa.scrollIntoView({ block: 'nearest' });
}

(function () {
  const st = document.createElement('style');
  st.textContent = '#contaEscolha{border:2px solid #f2c94c}#contaEscolha .conta-bts{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;justify-content:center}';
  document.head.append(st);
})();
