// Família Santos — nuvem_save.js — o SAVE NA CONTA do Educação Gamer (14/10/2026).
// O jogo roda em educacaogamer.com.br/jocelino/: mesmo endereço do site = mesmo navegador, então o login do site
// (localStorage eg_token / eg_user) vale aqui, como no Lenda do Campinho (portal.js e nuvem.js de lá).
//  - Ao dormir: salvar() grava no navegador (como sempre) e, com login, sobe uma cópia para a conta (gzip + base64,
//    PUT /api/jocelino/save). Não trava o jogo; se falhar, tenta de novo depois (30 s, 1 min, 2 min, até 5 min).
//  - O save ganha `conta` (o id da conta): um save de uma conta NUNCA sobe para outra.
//  - Ao abrir (a capa e o "Continuar"): com login, consulta /save/meta; se a conta tem um save de dia maior ou mais novo
//    que o deste computador, pergunta qual usar.
//  - Nas opções (opcoes.js): "Salvo na conta: dia X, às HH:MM" e "Salvar na conta agora".
//  - Sem login, ou fora do site: tudo como antes.
// Rede: em ?test=1 (MODO_TESTE.leve) nada sai para a internet; com window.TESTE_API = { fetch, api } a suíte s46 põe um
// fetch de mentira no lugar (nunca o de verdade). Carregar DEPOIS de base.js, opcoes.js e jogo.js (embrulha salvar e mostrarCapa).

const NuvemSave = (() => {
  const API_SITE = 'https://api.educacaogamer.com.br', API_LOCAL = 'http://localhost:4000';
  const CHAVE = 'jocelino_nuvem_v1';            // { pendente, sync: { [conta]: { atualizadoEm, dia } } } — separado do save
  const MAX = 90000;                            // o servidor recusa save maior (os mesmos limites do Lenda)
  const ESPERAS = [30e3, 60e3, 120e3, 300e3];   // nova tentativa depois de uma falha
  const N = {
    enviando: false, denovo: false, timer: null, falhas: 0, avisos: {}, decidiu: false, meta: undefined, pedidoMeta: null,
    marca: 0, sessao: Date.now().toString(36) + Math.random().toString(36).slice(2, 10), ultimo: null,
  };
  const espera = ms => new Promise(ok => setTimeout(ok, ms));

  // ---------- onde estou, quem sou ----------
  function teste() { return typeof window !== 'undefined' && window.TESTE_API ? window.TESTE_API : null; }
  function noSite() {
    const h = location.hostname;
    if (/(^|\.)educacaogamer\.com\.br$/.test(h)) return 'site';
    if ((h === 'localhost' || h === '127.0.0.1') && location.pathname.startsWith('/jocelino')) return 'local';   // o site rodando no PC
    return null;
  }
  // a função de rede: só o fetch de mentira da suíte (TESTE_API), nada em ?test=1, o fetch de verdade no site
  function rede() {
    const t = teste();
    if (t) return typeof t.fetch === 'function' ? t.fetch : null;
    if (MODO_TESTE.leve || !noSite() || typeof fetch !== 'function') return null;
    return fetch.bind(window);
  }
  function api() { const t = teste(); return t ? (t.api || 'https://api.teste.invalid') : noSite() === 'site' ? API_SITE : API_LOCAL; }
  function lerToken(t) { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return null; } }
  // { token, id, nick, vencida } ou null (sem login)
  function conta() {
    let token = null, user = null;
    try { token = localStorage.getItem('eg_token'); user = JSON.parse(localStorage.getItem('eg_user') || 'null'); } catch (e) { }
    if (!token) return null;
    const p = lerToken(token);
    const id = user && user.id ? String(user.id) : p && p.id ? String(p.id) : null;
    if (!id) return null;
    return { token, id, nick: user && user.nickname || '', vencida: !!(p && p.exp && p.exp * 1000 <= Date.now()) };
  }
  // 'fora' (sem rede ou fora do site) | 'sem-conta' | 'vencida' | 'ok'
  function estado() {
    if (!rede() || typeof CompressionStream !== 'function') return 'fora';
    const c = conta();
    return !c ? 'sem-conta' : c.vencida ? 'vencida' : 'ok';
  }
  const ativa = () => estado() === 'ok';

  // ---------- memória deste computador (separada do save) ----------
  function memoria() { try { const m = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if (m && typeof m === 'object') { m.sync = m.sync || {}; return m; } } catch (e) { } return { pendente: false, sync: {} }; }
  function guardaMemoria(m) { try { localStorage.setItem(CHAVE, JSON.stringify(m)); } catch (e) { } }
  function marcaSync(id, atualizadoEm, dia) { const m = memoria(); m.sync[id] = { atualizadoEm, dia }; m.pendente = false; guardaMemoria(m); }
  function saveLocal() { try { const t = localStorage.getItem(CHAVE_SAVE); return t ? { texto: t, s: JSON.parse(t) } : null; } catch (e) { return null; } }

  // ---------- avisos (curtos, uma vez por assunto) ----------
  function aviso(txt, chave) {
    if (chave) { if (N.avisos[chave]) return; N.avisos[chave] = true; }
    if (typeof avisar === 'function') try { avisar(txt); } catch (e) { }
  }
  const quando = ms => { const d = new Date(ms), p = n => String(n).padStart(2, '0'); return { data: p(d.getDate()) + '/' + p(d.getMonth() + 1), hora: p(d.getHours()) + ':' + p(d.getMinutes()) }; };

  // ---------- gzip + base64 (igual ao nuvem.js do Lenda) ----------
  async function comprime(txt) {
    const s = new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = new Uint8Array(await new Response(s).arrayBuffer());
    let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  async function descomprime(b64) {
    const bin = atob(b64); const buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const s = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(s).text();
  }

  // ---------- login que se renova (como o portal.js do Lenda) ----------
  // Troca o login ainda válido por um novo (POST /api/auth/renovar) — ao abrir, se ele já tem mais de 12 h, ou depois de um 401.
  async function renova(forcar) {
    const f = rede(), c = conta(); if (!f || !c || c.vencida) return false;
    const p = lerToken(c.token);
    if (!forcar && (!p || !p.iat || Date.now() - p.iat * 1000 < 12 * 3600e3)) return false;
    try {
      const r = await f(api() + '/api/auth/renovar', { method: 'POST', headers: { Authorization: 'Bearer ' + c.token } });
      if (!r.ok) return false;
      const j = await r.json(); if (!j || !j.token) return false;
      try { if (localStorage.getItem('eg_token') !== c.token) return false; localStorage.setItem('eg_token', j.token); if (j.user) localStorage.setItem('eg_user', JSON.stringify(j.user)); } catch (e) { return false; }
      return true;
    } catch (e) { return false; }
  }
  async function pede(metodo, caminho, corpo, jaRenovou) {
    const f = rede(), c = conta(); if (!f || !c) throw new Error('sem rede');
    const r = await f(api() + '/api/jocelino' + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + c.token }, body: corpo ? JSON.stringify(corpo) : undefined });
    if (r.status === 401 && !jaRenovou && await renova(true)) return pede(metodo, caminho, corpo, true);
    if (r.status === 401) aviso('Sua sessão do Educação Gamer venceu: entre de novo no site para salvar na conta.', 'sessao');
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, dados: j || {} };
  }

  // ---------- o que a conta tem (sem baixar o save) ----------
  // undefined = não deu para saber; null = a conta não tem save; { dia, atualizadoEm (ms) }
  function buscarMeta(forcar) {
    if (!ativa()) return Promise.resolve(undefined);
    if (N.pedidoMeta && !forcar) return N.pedidoMeta;
    N.pedidoMeta = (async () => {
      try {
        const r = await pede('GET', '/save/meta');
        if (r.status === 404) return (N.meta = null);
        if (!r.ok) { N.pedidoMeta = null; return undefined; }
        const t = new Date(r.dados.atualizadoEm).getTime();
        return (N.meta = { dia: r.dados.dia | 0, atualizadoEm: t });
      } catch (e) { N.pedidoMeta = null; return undefined; }
    })();
    return N.pedidoMeta;
  }
  // A conta tem algo melhor que este computador? (dia maior, ou salvo depois do save daqui — o que já veio daqui não conta)
  function contaNaFrente(meta) {
    if (!meta) return false;
    const c = conta(); if (!c) return false;
    const sync = memoria().sync[c.id];
    if (sync && meta.atualizadoEm <= sync.atualizadoEm) return false;        // é a mesma cópia que este computador mandou/baixou
    const l = saveLocal();
    if (!l || !l.s) return true;
    if (l.s.conta && l.s.conta !== c.id) return true;                       // o save daqui é de outra conta
    if (meta.dia > (l.s.dia | 0)) return true;
    return meta.atualizadoEm > (l.s.salvoEm || 0) + 60e3;                   // (folga de 1 min para o relógio do PC)
  }

  // ---------- subir ----------
  function agenda(ms) { if (N.timer) return; N.timer = setTimeout(() => { N.timer = null; subir({ calado: true }); }, ms); }
  // Sobe o save GRAVADO no navegador (o do último dormir). { calado } = sem aviso de sucesso.
  async function subir(opc = {}) {
    const est = estado();
    if (est === 'vencida') { aviso('Sua sessão do Educação Gamer venceu: entre de novo no site para salvar na conta.', 'sessao'); return { ok: false, motivo: 'vencida' }; }
    if (est !== 'ok') return { ok: false, motivo: est };
    if (N.enviando) { N.denovo = true; return { ok: false, motivo: 'na fila' }; }
    const l = saveLocal();
    if (!l || !l.s || typeof l.s !== 'object') return { ok: false, motivo: 'sem save' };
    if (l.s.soTeste) return { ok: false, motivo: 'save de teste' };
    const c = conta();
    if (l.s.conta && l.s.conta !== c.id) { aviso('Este save é de outra conta do Educação Gamer: ele não sobe para a sua.', 'outra'); return { ok: false, motivo: 'outra conta' }; }
    let texto = l.texto;
    if (!l.s.conta) {   // save sem dono ainda: passa a ser desta conta
      l.s.conta = c.id; texto = JSON.stringify(l.s);
      try { localStorage.setItem(CHAVE_SAVE, texto); } catch (e) { }
      if (G.save && !G.save.conta && !G.save.soTeste) G.save.conta = c.id;
    }
    N.enviando = true;
    let res = { ok: false, motivo: 'falhou' }, tentarDeNovo = false;
    try {
      const dados = await comprime(texto);
      if (dados.length > MAX) { aviso('O save ficou grande demais para a conta: ele continua salvo neste computador.', 'grande'); res = { ok: false, motivo: 'grande' }; }
      else {
        const dia = Math.max(1, Math.min(100000, Math.floor(Number(l.s.dia) || 1)));
        N.marca = Math.max(Date.now(), N.marca + 1);
        const r = await pede('PUT', '/save', { dados, dia, salvoEm: N.marca, sessao: N.sessao, fechando: false });
        if (r.ok || (r.status === 409 && r.dados.velho)) {
          const t = r.dados.atualizadoEm ? new Date(r.dados.atualizadoEm).getTime() : Date.now();
          if (r.ok) { N.meta = { dia, atualizadoEm: t }; N.pedidoMeta = Promise.resolve(N.meta); marcaSync(c.id, t, dia); }
          N.falhas = 0; N.ultimo = { dia, atualizadoEm: t };
          res = { ok: true, dia, atualizadoEm: t };
          if (!opc.calado) aviso('Salvo na conta');
        } else if (r.status === 429) { tentarDeNovo = true; res = { ok: false, motivo: 'rápido demais', espera: 11e3 }; }
        else if (r.status === 401) res = { ok: false, motivo: 'sessão' };
        else if (r.status === 400) { aviso('A conta recusou este save: ' + (r.dados.error || 'formato estranho') + ' Ele continua salvo neste computador.', 'recusou'); res = { ok: false, motivo: 'recusado' }; }
        else { tentarDeNovo = true; res = { ok: false, motivo: 'servidor ' + r.status }; }
      }
    } catch (e) { tentarDeNovo = true; res = { ok: false, motivo: 'sem conexão' }; }
    N.enviando = false;
    if (tentarDeNovo) {
      const m = memoria(); m.pendente = true; guardaMemoria(m);
      if (res.espera) agenda(res.espera);
      else { agenda(ESPERAS[Math.min(N.falhas, ESPERAS.length - 1)]); N.falhas++; if (!opc.calado || opc.manual) aviso('Não deu para salvar na conta agora: tento de novo daqui a pouco.', opc.manual ? null : 'falha'); }
    }
    if (N.denovo) { N.denovo = false; agenda(1500); }
    return res;
  }

  // ---------- baixar ("Usar o da conta") ----------
  async function usarDaConta() {
    const c = conta(); if (!ativa() || !c) return false;
    try {
      const r = await pede('GET', '/save');
      if (!r.ok || !r.dados.dados) return false;
      let s = JSON.parse(await descomprime(r.dados.dados));
      if (!s || typeof s !== 'object' || typeof s.dia !== 'number') return false;
      s = migraSave(s); delete s.soTeste; s.conta = c.id;
      // o save deste computador não some: fica uma cópia em 'jocelino_save_antes_da_conta' (a última troca)
      try { const antes = localStorage.getItem(CHAVE_SAVE); if (antes) localStorage.setItem('jocelino_save_antes_da_conta', antes); } catch (e) { }
      localStorage.setItem(CHAVE_SAVE, JSON.stringify(s));
      const t = new Date(r.dados.atualizadoEm).getTime();
      marcaSync(c.id, t, r.dados.dia | 0); N.meta = { dia: r.dados.dia | 0, atualizadoEm: t }; N.pedidoMeta = Promise.resolve(N.meta);
      N.decidiu = true;
      iniciarJogo(lerSave());
      return true;
    } catch (e) { return false; }
  }

  // ---------- a pergunta (dentro da capa: a capa fica por cima do #modal) ----------
  function pergunta(meta, doContinuar) {
    const capa = document.getElementById('capa'); if (!capa) return;
    const q = quando(meta.atualizadoEm), temLocal = !!saveLocal();
    const msg = el('div', { class: 'rodape nuvem-msg', style: 'min-height:1.4em;margin-top:8px' });
    const caixa = el('div', { class: 'painel placa nuvem-pergunta' },
      el('div', { class: 'texto' }, `Você tem um save na conta Educação Gamer (dia ${meta.dia}, salvo em ${q.data} ${q.hora}). Usar ele?`),
      el('div', { class: 'opcoes' },
        el('button', { class: 'botao forte', onclick: async e => {
          e.stopPropagation(); const b = e.currentTarget; b.disabled = true; msg.textContent = 'Baixando o save da conta...';
          if (!(await usarDaConta())) { b.disabled = false; msg.textContent = 'Não deu para baixar o save da conta agora. Tente de novo ou continue o deste computador.'; }
        } }, 'Usar o da conta'),
        el('button', { class: 'botao', onclick: e => {
          e.stopPropagation(); N.decidiu = true;
          if (doContinuar && temLocal) iniciarJogo(lerSave()); else mostrarCapa();
        } }, temLocal ? 'Continuar o deste computador' : 'Agora não')),
      msg);
    capa.innerHTML = ''; capa.append(caixa); capa.hidden = false;
  }
  // A capa abriu: troca o "Continuar" (pergunta antes, se a conta estiver na frente) e consulta a conta.
  function naCapa() {
    if (!ativa()) return;
    const capa = document.getElementById('capa'); if (!capa) return;
    const b = [...capa.querySelectorAll('button')].find(x => x.textContent.trim() === 'Continuar');
    if (b) {
      const b2 = b.cloneNode(true); b.replaceWith(b2);   // (o clone vem sem o clique antigo)
      b2.addEventListener('click', async e => {
        e.stopPropagation();
        if (!N.decidiu && ativa()) {
          b2.disabled = true;
          const m = await Promise.race([buscarMeta(), espera(4000).then(() => undefined)]);
          b2.disabled = false;
          if (!N.decidiu && contaNaFrente(m)) { pergunta(m, true); return; }
        }
        iniciarJogo(lerSave());
      });
    }
    if (N.decidiu) return;
    buscarMeta().then(m => {
      if (N.decidiu || capa.hidden || !capa.querySelector('.titulo')) return;   // (a capa ainda é a de título)
      if (contaNaFrente(m)) pergunta(m, false);
    });
  }

  // ---------- as opções (opcoes.js chama) ----------
  function linhaOpcoes(linha, redesenha, caixa) {
    const est = estado();
    if (est === 'fora') return null;
    if (est === 'sem-conta') return linha('Entre na sua conta do Educação Gamer para salvar na nuvem');
    if (est === 'vencida') return linha('Sua sessão do Educação Gamer venceu: entre de novo no site para salvar na conta');
    let txt;
    if (N.meta === undefined) { txt = 'Salvo na conta: conferindo...'; buscarMeta().then(() => { if (caixa && caixa.isConnected) redesenha(); }); }
    else if (N.meta === null) txt = 'Salvo na conta: ainda nada';
    else txt = `Salvo na conta: dia ${N.meta.dia}, às ${quando(N.meta.atualizadoEm).hora}`;
    const bt = el('button', { class: 'botao', onclick: async e => {
      e.stopPropagation();
      if (!saveLocal()) { aviso('Ainda não tem save: o jogo salva quando o Jocelino dorme.'); return; }
      bt.disabled = true; bt.textContent = 'Salvando...';
      const r = await subir({ manual: true });
      if (!r.ok && r.motivo === 'rápido demais') aviso('Espere uns segundos e tente de novo.');
      if (caixa && caixa.isConnected) redesenha();
    } }, 'Salvar na conta agora');
    if (N.enviando) { bt.disabled = true; bt.textContent = 'Salvando...'; }
    return linha(txt, bt);
  }

  // ---------- ganchos no jogo ----------
  // salvar() (ao dormir): marca a hora e o dono no save ANTES de gravar; depois de gravar, sobe para a conta.
  // (só embrulha o que existe: o simulador do balanço carrega o jogo no Node sem jogo.js — ferramentas_balanco/carrega_jogo.js)
  const _salvar = typeof salvar === 'function' ? salvar : null;
  if (_salvar) salvar = function () {
    if (G.save && !G.save.soTeste) {
      G.save.salvoEm = Date.now();
      const c = ativa() ? conta() : null;
      if (c && !G.save.conta) G.save.conta = c.id;
    }
    const ok = _salvar.apply(this, arguments);
    if (ok && G.save && !G.save.soTeste) {
      const m = memoria(); m.pendente = true; guardaMemoria(m);
      const est = estado();
      if (est === 'ok' || est === 'vencida') subir();   // (vencida: só o aviso curto, sem rede)
    }
    return ok;
  };
  const _mostrarCapa = typeof mostrarCapa === 'function' ? mostrarCapa : null;
  if (_mostrarCapa) mostrarCapa = function () { const r = _mostrarCapa.apply(this, arguments); try { naCapa(); } catch (e) { console.error(e); } return r; };
  // Ao abrir: renova o login antigo e, se o último save deste computador não chegou à conta (fechou durante o envio, sem
  // internet), manda agora, quieto.
  function aoAbrir() {
    if (!ativa()) return;
    setTimeout(() => { renova(false); }, 4000);
    if (memoria().pendente) setTimeout(() => { if (ativa()) subir({ calado: true }); }, 6000);
  }
  if (!teste()) aoAbrir();
  if (typeof addEventListener === 'function') addEventListener('online', () => { if (memoria().pendente && ativa()) agenda(2000); });

  return { estado, conta, ativa, subir, buscarMeta, contaNaFrente, usarDaConta, naCapa, pergunta, linhaOpcoes, aoAbrir, comprime, descomprime, renova, N, CHAVE };
})();
