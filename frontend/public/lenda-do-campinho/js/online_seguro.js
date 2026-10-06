/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🛡️ ONLINE SEGURO (v407 — Raio-X U1, U5, U6, I8; dono: "faça tudo menos I1")
   Para as crianças conviverem com segurança no mundo compartilhado:
   - U1 NOME DO TIME (v408): o jogador ESCREVE o nome (até 24 letras), com um FILTRO de palavrões igual ao do servidor
     (backend src/lenda/filtroNome.js); as listas da v407 viraram sugestões (🎲). Nome reprovado: o site mostra só "Time"
     e o jogo convida a escrever outro ao abrir o time.
   - U5 CONVITES SÓ DE AMIGOS (ligado por padrão): convite de caça em grupo só chega de amigos e colegas de guilda
     (guilda e torcida já eram só de amigos). Dá para liberar em ⚙️ › 🌐 Online.
   - U5 FICAR INVISÍVEL no mundo: você continua vendo os outros, mas ninguém vê você nem os seus emotes.
   - U5 🚩 DENUNCIAR (botão direito no jogador, ou no painel 💬): motivos PRONTOS (sem texto livre); manda o ID do jogador
     para a equipe do site (vira um aviso no painel do admin e um e-mail).
   - U6 APAGAR MEUS DADOS DO JOGO (⚙️ › 💾 Conta): apaga do servidor o save online, ranking, casa, guilda, feira e torcidas.
     O personagem deste aparelho continua.
   - I8 👥 JOGANDO AGORA: no painel 💬 (tecla Y) aparece quem está nas cidades de TODOS os lugares, com "🧭 Como chegar".
   Servidor: "lenda-prefs" e "mundo-quem" (socketMundo.js), POST /api/lenda/denunciar, DELETE /api/lenda/meus-dados.
   Prefixo osg*. Carregar DEPOIS de menu_jogador.js (usa mundo_online.js, menu_jogador.js e, na hora do clique, como_chegar.js).
   ============================================================ */

/* ---------- U1 (v408): nome do time DIGITADO, com filtro ----------
   Dono (v408): "Deixe o skalzinho escolher um nick, não uma lista". O nome do time volta a ser escrito pelo jogador (até 24
   letras), mas passa por um FILTRO (palavrões com leetspeak — p1k4, piiika, p.i.k.a —, símbolos, contato, nomes da equipe).
   O mesmo filtro está no servidor (backend src/lenda/filtroNome.js): o que não passa nunca aparece para os outros.
   As listas da v407 viraram SUGESTÕES (botão 🎲) e continuam valendo para quem já escolheu delas (s.time.partes).
   Vale também fora do site e na Steam (o filtro roda aqui no jogo). */
const OSG_TIME_PREF = ['Esporte Clube', 'Grêmio', 'Atlético', 'Unidos do', 'Sociedade Esportiva', 'Real', 'Independente', 'Juventude do', 'Estrela do', 'Operário', 'Ferroviário', 'Associação', 'Clube Atlético', 'União do'];
const OSG_TIME_LUGAR = ['Campinho', 'Poeirão', 'Morro Alto', 'Ladeira', 'Pombal', 'Coqueiral', 'Areia Branca', 'Serra Azul', 'Rio Seco', 'Pedra Lisa', 'Lagoa Verde', 'Cajueiro', 'Mangueiral', 'Ventania', 'Trovão', 'Beira-Mar', 'Vale Verde', 'Alto da Colina', 'Barro Vermelho', 'Pau-Brasil', 'Sol Nascente', 'Quebra-Canela', 'Boa Vista', 'Porto Alegre do Norte', 'Ribeirão Fundo', 'Chapadão', 'Maracujá', 'Bananal', 'Jatobá', 'Ipê Amarelo', 'Buriti', 'Cachoeirinha', 'Pedra Branca', 'Vila Nova', 'Canoas', 'Monte Verde', 'Três Coqueiros', 'Carnaubal', 'Sertãozinho', 'Mangue Seco', 'Arraial', 'Ponte Velha', 'Siriema', 'Tucano', 'Jabuticabal', 'Morro do Sabiá', 'Lajedo', 'Aroeira'];
function osgNomeTime(partes) {
  const m = /^(\d{1,3})\.(\d{1,3})$/.exec(String(partes || '')); if (!m) return null;
  const p = OSG_TIME_PREF[+m[1]], l = OSG_TIME_LUGAR[+m[2]];
  return p && l ? `${p} ${l}` : null;
}
// ---- o filtro (cópia EXATA do servidor; não edite só aqui: mude em backend src/lenda/filtroNome.js e copie) ----
/* FILTRO-NOME-INICIO */
const NF_VERSAO = 2; // (suba a cada mudança do filtro: o teste confere que o jogo publicado tem a mesma)
// palavras proibidas INTEIRAS (comparadas palavra por palavra: "cu" não barra "Cupim", "puta" não barra "Disputa")
const NF_PALAVRAS = ["pica", "pinto", "rola", "bunda", "peido", "piroca", "pau no", "xota", "xana", "teta", "tetas", "bct", "pnc", "crl", "fdm", "bosta", "mijo", "gay", "lesbica", "traveco", "chupa", "mama", "safado", "safada", "gostosa", "gostoso", "tesao", "transa", "sexo", "matar"];
// trechos proibidos em QUALQUER lugar (também com as palavras grudadas: "skalzinhopika")
const NF_TRECHOS = ["porra", "caralh", "karalh", "krlh", "buceta", "boceta", "bucet", "xoxot", "xerec", "piroc", "pirok", "pika", "punhet", "siriric",
  "putari", "foda", "foder", "fodid", "fudid", "fuder", "merda", "cacete", "arromb", "vagabund", "babaca", "otari", "retardad", "cuzao", "cusao",
  "cuzinh", "porno", "sexy", "nazi", "hitler", "xvideo", "pqp", "vsf", "fdp", "vtnc", "tnc", "viad", "boiola", "baitola", "punheta", "fodase",
  "pornô", "estupr", "drogad", "maconh", "cocain", "suicid", "assassin"];
// equipe do site (o apelido de conta também não pode): estes em qualquer lugar...
const NF_RESERVADOS = ["admin", "moderador", "moderator", "staff", "educacaogamer"];
// ...e estes só como palavra inteira (v408.2: "Ecossistema", "Suboficial", "Groot" são inocentes)
const NF_RESERVADOS_PALAVRA = ["administrador", "suporte", "support", "sistema", "system", "root", "equipe", "oficial", "official"];
// v408.2 (dono aprovou): palavras INOCENTES que contêm um trecho proibido. Só valem escritas certinho, como palavra
// inteira (sem leetspeak, sem letra repetida, sem estar grudada em outra): "Pikachu" passa, "p1kachu"/"pikachupika" não.
// Hífen, espaço, ponto ou nada entre as partes ("Pica-Pau", "Pica Pau", "Picapau"). Só acrescente palavra comum e inocente.
const NF_EXCECOES = ["pica pau", "pica paus", "pikachu", "pikachus", "picachu", "enviado", "enviados", "enviada", "enviadas", "reenviado",
  "desviado", "desviados", "desviada", "desviadas", "abreviado", "abreviada", "abreviados", "abreviadas", "abreviador", "abreviadores", "aviador", "aviadores", "aviadora", "aviadoras",
  "viaduto", "viadutos", "percussao", "percussoes", "repercussao", "discussao", "discussoes", "concussao", "notario", "notarios", "notaria",
  "protonotario", "lotaringia", "disputaria", "computaria", "reputaria", "internazionale", "internazionalle", "badminton",
  "matarazzo", "picaro", "picaros", "picara", "picaras", "chupa cabra", "chupa cabras"];
const NF_LEET = { 0: "o", 1: "i", 2: "z", 3: "e", 4: "a", 5: "s", 6: "g", 7: "t", 8: "b", 9: "g", "@": "a", $: "s", "!": "i", "|": "i", "€": "e" };
const nfBase = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ç/g, "c"); // minúsculas, sem acento
function nfSimples(s) { return nfBase(s).replace(/[0-9@$!|€]/g, (c) => NF_LEET[c] || c); } // + leetspeak trocado
// "pika" → /p+i+k+a+/ (letras repetidas não escapam); "porra" → /p+o+r+r+a+/; "puta" → /p+[uv]+t+a+/ ("pvta")
const nfRx = (w, inteira) => new RegExp((inteira ? "^" : "") + [...nfSimples(w).replace(/[^a-z ]/g, "")].map((c) => (c === " " ? "" : c === "u" ? "[uv]+" : c + "+")).join("") + (inteira ? "s*$" : ""));
let NF_RX = null;
function nfRegras(extras) {
  if (NF_RX) return NF_RX;
  const palavras = [...new Set([...NF_PALAVRAS.filter((p) => !p.includes(" ")), ...(extras || [])])];
  NF_RX = {
    palavras: palavras.map((w) => nfRx(w, true)),
    trechos: NF_TRECHOS.map((w) => nfRx(w, false)),
    pares: NF_PALAVRAS.filter((p) => p.includes(" ")).map((p) => nfRx(p, false)), // ("pau no", "coco de"...: grudadas)
    reservados: NF_RESERVADOS.map((w) => nfRx(w, false)),
    reservadosPalavra: NF_RESERVADOS_PALAVRA.map((w) => nfRx(w, true)),
    excecoes: new RegExp("(^|[^a-z0-9])(" + NF_EXCECOES.map((w) => w.split(" ").join("[ _.'-]?")).join("|") + ")(?=$|[^a-z0-9])", "g"),
  };
  return NF_RX;
}
// confere um nome digitado. Devolve { ok: true, nome } (já limpo) ou { ok: false, motivo }
function nfConfere(texto, extras) {
  const nome = String(texto == null ? "" : texto).replace(/\s+/g, " ").trim();
  if (nome.length < 3) return { ok: false, motivo: "curto" };
  if (nome.length > 24) return { ok: false, motivo: "longo" };
  if (!/^[\p{L}\p{N} _'.-]+$/u.test(nome)) return { ok: false, motivo: "simbolo" };
  if ((nome.match(/\p{L}/gu) || []).length < 2) return { ok: false, motivo: "letras" };
  if ((nome.match(/\d/g) || []).length >= 6 || /(www|http|\.com|\.br|insta|zap|whats|tiktok|discord|telegram|facebook)/i.test(nome)) return { ok: false, motivo: "contato" };
  const R = nfRegras(extras);
  // tira as palavras inocentes da lista de exceções (escritas certinho) antes de procurar os trechos proibidos
  const s = nfSimples(nfBase(nome).replace(R.excecoes, "$1 "));
  const junto = s.replace(/[^a-z]/g, "");
  const pedacos = s.split(/[^a-z]+/).filter(Boolean);
  // letras soltas seguidas viram uma palavra só ("C U", "p u t a")
  for (let i = 0; i < pedacos.length; i++) if (pedacos[i].length === 1) { let j = i, w = ""; while (j < pedacos.length && pedacos[j].length === 1) w += pedacos[j++]; if (j - i > 1) pedacos.push(w); i = j - 1; }
  if (R.reservados.some((rx) => rx.test(junto)) || pedacos.some((p) => R.reservadosPalavra.some((rx) => rx.test(p)))) return { ok: false, motivo: "reservado" };
  if (R.trechos.some((rx) => rx.test(junto)) || R.pares.some((rx) => rx.test(junto))) return { ok: false, motivo: "palavrao" };
  if (pedacos.some((p) => R.palavras.some((rx) => rx.test(p)))) return { ok: false, motivo: "palavrao" };
  return { ok: true, nome };
}
/* FILTRO-NOME-FIM */
// palavrões do site (a lista do Impostor, backend src/impostor/filtroPalavroes.js), como palavras inteiras
const NF_SITE = ["porra","caralho","cacete","buceta","boceta","xoxota","piroca","cu","cuzao","foda","fodase","foder","fodido","merda","puta","puto","putaria","vadia","vagabunda","vagabundo","arrombado","arrombada","viado","bicha","sapatao","otario","otaria","babaca","corno","punheta","siririca","prr","krl","vsf","pqp","fdp","tnc","vtnc","retardado"];
function osgConfereNome(texto) { return nfConfere(texto, NF_SITE); }
const OSG_NOME_RUIM = { curto: 'Use pelo menos 3 letras. 🙂', longo: 'Use no máximo 24 letras. 🙂', simbolo: 'Use só letras, números e espaço. 🙂', letras: 'Use pelo menos 2 letras. 🙂' };
const osgMsgNome = r => OSG_NOME_RUIM[r.motivo] || 'Esse nome não pode. Escolha outro! 🙂';
// uma sugestão das listas que cabe e passa no filtro: { nome, partes }
function osgSugereTime() {
  for (let k = 0; k < 60; k++) {
    const p = Math.floor(Math.random() * OSG_TIME_PREF.length), l = Math.floor(Math.random() * OSG_TIME_LUGAR.length), nome = osgNomeTime(p + '.' + l);
    if (nome && nome.length <= 24 && osgConfereNome(nome).ok) return { nome, partes: p + '.' + l };
  }
  return { nome: 'Esporte Clube Campinho', partes: '0.0' };
}
// o campo do nome (texto livre + 🎲 Sugerir + aviso gentil na hora): { el, nome(), partes(), confere() }
function osgSeletorTime(nomeIni) {
  let sug = null;
  const inp = el('input', { class: 'osg-inp', maxlength: 24, placeholder: 'Ex.: Leões da Vila', value: nomeIni || '' });
  const aviso = el('small', { class: 'osg-aviso' });
  const confere = () => osgConfereNome(inp.value);
  const mostra = () => { const v = inp.value.trim(), r = confere(); aviso.textContent = !v || r.ok ? '' : osgMsgNome(r); };
  inp.addEventListener('keydown', e => e.stopPropagation()); inp.addEventListener('input', mostra);
  const dado = el('button', { class: 'btn mini', type: 'button', title: 'Sugerir um nome' }, '🎲 Sugerir');
  dado.onclick = () => { sug = osgSugereTime(); inp.value = sug.nome; mostra(); };
  if (!inp.value || !confere().ok) { sug = osgSugereTime(); inp.value = sug.nome; } // (começa com algo que passa)
  return {
    el: el('span', { class: 'osg-seletor' }, inp, dado, aviso),
    confere, nome: () => { const r = confere(); return r.ok ? r.nome : null; },
    partes: () => (sug && inp.value.trim() === sug.nome ? sug.partes : null),
    erro: () => { const r = confere(); return r.ok ? '' : osgMsgNome(r); },
  };
}
// escrever um nome novo para o time (também para quem tem um nome que não passa no filtro)
function osgModalNomeTime(motivo) {
  const t = G.save && G.save.time; if (!t) return;
  const ok0 = osgConfereNome(t.nome).ok, campo = osgSeletorTime(ok0 ? t.nome : '');
  const salva = () => {
    const n = campo.nome(); if (!n) return avisoJogo(campo.erro());
    t.nome = n; const p = campo.partes(); if (p) t.partes = p; else delete t.partes;
    salvar(); fechaModal(); log(`⚽ Seu time agora se chama ${t.nome}!`, 'l-xp'); if (typeof abrirTime === 'function') abrirTime();
  };
  abreModal(el('h2', {}, '⚽ Nome do seu time'),
    el('p', {}, motivo || 'Escreva o nome do seu time (até 24 letras). Ele aparece no ranking e na sua ficha do site.'),
    campo.el,
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: salva }, 'Usar este nome'),
      el('button', { class: 'btn', type: 'button', onclick: () => { fechaModal(); if (typeof abrirTime === 'function') abrirTime(); } }, 'Agora não')));
}
if (typeof abrirTime === 'function') {
  const _abrirTimeOsg = abrirTime; let perguntou = false;
  abrirTime = function () {
    const r = _abrirTimeOsg.apply(this, arguments);
    try {
      const t = G.save && G.save.time; if (!t) return r;
      // ✏️ ao lado do nome do time, para trocar quando quiser
      const h = document.querySelector('#modalConteudo .time-cab h2');
      if (h && !h.querySelector('.osg-renomeia')) { const b = el('button', { class: 'btn mini osg-renomeia', type: 'button', title: 'Mudar o nome do time' }, '✏️'); b.onclick = () => osgModalNomeTime(); h.append(' ', b); }
      // nome que não passa no filtro (ex.: de antes da v408): convite para escrever outro (uma vez por vez que abre o jogo)
      if (!perguntou && t.nome && !osgConfereNome(t.nome).ok) { perguntou = true; setTimeout(() => perguntaJogo('O nome do seu time não pode aparecer para os outros jogadores. Quer escrever um nome novo?', { sim: 'Escrever', nao: 'Depois' }).then(ok => { if (ok) osgModalNomeTime('Esse nome não pode. Escolha outro! 🙂 Escreva um nome novo (até 24 letras):'); }), 300); }
    } catch (e) { }
    return r;
  };
}

/* ---------- U5: preferências (convites e invisível) ---------- */
const osgOnline = () => typeof PORTAL !== 'undefined' && PORTAL.ativo && !!PORTAL.token && !window.LENDA_STEAM;
const OSG_PREFS_KEY = 'rac_online_prefs';
let OSG_PREFS = Object.assign({ convitesTodos: false, invisivel: false }, (() => { try { return JSON.parse(localStorage.getItem(OSG_PREFS_KEY) || '{}') || {}; } catch (e) { return {}; } })());
OSG_PREFS.invisivel = false; // v408.4 (dono: "retire isso"): a opção de ficar invisível saiu; quem tinha ligado volta a aparecer
const osgInvisivel = () => false;
function osgMandaPrefs() { const s = window.LENDA_SOCK; if (s && s.connected) s.emit('lenda-prefs', { convitesTodos: !!OSG_PREFS.convitesTodos, invisivel: !!OSG_PREFS.invisivel }, () => { }); }
function osgMudaPref(k, v) {
  OSG_PREFS[k] = !!v; try { localStorage.setItem(OSG_PREFS_KEY, JSON.stringify(OSG_PREFS)); } catch (e) { }
  osgMandaPrefs();
  if (k === 'invisivel') log(v ? '🙈 Você está invisível no mundo: vê os outros, mas ninguém vê você.' : '👀 Você voltou a aparecer para os outros jogadores.', 'l-sis');
}
// a conexão compartilhada (torre_coop.js, lendaSock) manda as preferências sempre que (re)conecta
// e, com a conexão aberta (ex.: entrou numa cidade), a caça em grupo e a Torre já escutam nela — o convite de um amigo
// chega mesmo sem ter aberto a janela do grupo antes
setInterval(() => {
  const s = window.LENDA_SOCK; if (!s || s._osg) return; s._osg = true;
  s.on('connect', osgMandaPrefs); if (s.connected) osgMandaPrefs();
  try { if (typeof CG !== 'undefined' && !CG.sock && typeof cgEscuta === 'function' && s._api === (typeof cgApi === 'function' ? cgApi() : '')) { CG.sock = s; cgEscuta(s); } } catch (e) { }
  try { if (typeof CO !== 'undefined' && !CO.sock && typeof coEscuta === 'function' && s._api === PORTAL.api) { CO.sock = s; coEscuta(s); } } catch (e) { }
}, 1000);

/* ---------- U5: 🚩 denunciar (motivos prontos) ---------- */
const OSG_MOTIVOS = ['Nome ou apelido feio', 'Está me incomodando ou me seguindo', 'Pediu dados pessoais (telefone, endereço, foto, rede social)', 'Está trapaceando', 'Outro problema']; // (mesma ordem do servidor: lenda/limites.js)
function osgDenuncia(alvo) {
  if (!osgOnline() || !alvo || !alvo.id) return avisoJogo('🚩 Para avisar a equipe, entre na sua conta do site.');
  abreModal(el('h2', {}, `🚩 Denunciar ${alvo.apelido || 'jogador'}`),
    el('p', {}, 'A equipe do Educação Gamer vai olhar. Escolha o que aconteceu:'),
    el('div', { class: 'osg-motivos' }, ...OSG_MOTIVOS.map((m, i) => el('button', { class: 'btn', type: 'button', onclick: () => osgMandaDenuncia(alvo, i) }, m))),
    el('p', { class: 'dica' }, '💡 Se alguém pedir seus dados ou deixar você com medo, conte para um adulto. Você também pode 🔇 silenciar a pessoa (só você deixa de ver).'));
}
async function osgMandaDenuncia(alvo, i) {
  const cab = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token };
  let r = null;
  try {
    r = await fetch(PORTAL.api + '/api/lenda/denunciar', { method: 'POST', headers: cab, body: JSON.stringify({ alvoId: alvo.id, motivo: i, onde: G.mapa && G.mapa.id }) });
    if (r.status === 404 && !(await r.clone().json().catch(() => ({}))).error) // servidor antigo (sem a rota): vai como feedback
      r = await fetch(PORTAL.api + '/api/feedback', { method: 'POST', headers: cab, body: JSON.stringify({ type: 'outro', message: `🚩 DENÚNCIA no Lenda do Campinho\nJogador denunciado: ${alvo.apelido || '?'} (id ${alvo.id})\nMotivo: ${OSG_MOTIVOS[i]}` }) });
  } catch (e) { r = null; }
  fechaModal();
  if (r && r.ok) return avisoJogo('🚩 Obrigado! A equipe do site recebeu o aviso. Se quiser, silencie a pessoa: botão direito nela › 🔇 Silenciar.');
  let msg = ''; try { msg = (await r.json()).error || ''; } catch (e) { }
  avisoJogo('🚩 ' + (msg || 'Não deu para mandar agora. Tente de novo daqui a pouco.'));
}
// no menu do botão direito em cima de um jogador (menu_jogador.js)
if (typeof mjAbre === 'function') {
  const _mjAbreOsg = mjAbre;
  mjAbre = function (a) {
    const r = _mjAbreOsg.apply(this, arguments);
    try {
      const m = document.getElementById('mjMenu');
      if (m && a && !m.querySelector('.osg-den')) { const b = el('button', { class: 'btn mini osg-den', type: 'button', title: 'Avisar a equipe do site' }, '🚩 Denunciar'); b.onclick = () => { mjFecha(); osgDenuncia({ id: a.id, apelido: a.apelido }); }; m.append(b); }
    } catch (e) { }
    return r;
  };
}

/* ---------- I8: 👥 jogando agora (todas as cidades) e 🧭 como chegar ---------- */
async function osgQuem() {
  try { if (typeof moConecta === 'function') await moConecta(); } catch (e) { return null; }
  const s = window.LENDA_SOCK || (typeof MO !== 'undefined' && MO.sock); if (!s || !s.connected) return null;
  return new Promise(ok => { const t = setTimeout(() => ok(null), 6000); s.emit('mundo-quem', null, r => { clearTimeout(t); ok(r && r.ok ? r : null); }); });
}
const osgLugar = id => { try { return typeof ccNome === 'function' ? ccNome(id) : (typeof nomeLugarPers === 'function' ? nomeLugarPers(id) : id); } catch (e) { return id; } };
function osgComoChegar(mapa) {
  if (G.mapa && G.mapa.id === mapa) return avisoJogo(`📍 Você já está em ${osgLugar(mapa)}!`);
  let rota = null; try { rota = typeof ccRota === 'function' ? ccRota(mapa) : null; } catch (e) { }
  const linhas = [];
  if (rota && rota.viagem) linhas.push('🧭 Viagem: ' + rota.viagem);
  const cam = rota && typeof ccCaminhoTxt === 'function' ? ccCaminhoTxt(rota) : '';
  if (cam) linhas.push('🚶 Caminho ' + cam);
  avisoJogo(linhas.length ? linhas.join(' · ') : `📍 Fica em ${osgLugar(mapa)}. Procure no 🗺️ mapa do jogo!`, { titulo: `Como chegar: ${osgLugar(mapa)}` });
}
// a janela "👥 jogando agora" (de qualquer lugar: ☰ Menu › Social, ou o painel 💬 fora das cidades)
async function osgModalQuem() {
  if (!osgOnline()) return avisoJogo('👥 Entre na sua conta do site para ver quem está jogando.');
  const r = await osgQuem();
  if (!r) return avisoJogo('👥 Não deu para ver quem está jogando agora. Tente de novo daqui a pouco.');
  abreModal(el('h2', {}, `👥 ${r.total} jogando agora nas cidades`),
    el('p', { class: 'dica' }, '🌐 Os outros jogadores aparecem nas cidades e nos centros (não nas caças, casas e arenas). Sem chat livre: lá dá para mandar emotes e frases prontas (💬 ou tecla Y).'),
    osgInvisivel() ? el('p', { class: 'dica osg-inv' }, '🙈 Você está invisível: ninguém vê você (⚙️ › 🌐 Online).') : '',
    osgListaQuem(r));
}
// no ☰ Menu (grupo Social)
(function osgPoeBotao(t = 0) {
  if (window.LENDA_STEAM || typeof PORTAL === 'undefined' || !PORTAL.ativo) return;
  const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => osgPoeBotao(t + 1), 500); return; }
  if (document.getElementById('btnJogandoAgora')) return;
  const b = el('button', { class: 'btn', id: 'btnJogandoAgora', type: 'button', role: 'menuitem' }, '👥 Jogando agora'); b.onclick = osgModalQuem;
  lista.append(b);
})();
function osgListaQuem(r) {
  const amigos = (typeof MO !== 'undefined' && MO.amigos && MO.amigos.ids) || new Set();
  const lista = (r.lista || []).map(x => el('div', { class: 'mo-pessoa' },
    el('span', {}, `${amigos.has(String(x.id)) ? '🤝 ' : ''}${x.apelido} · Nv ${x.nivel} · ${osgLugar(x.mapa)}`),
    el('button', { class: 'btn mini', type: 'button', onclick: () => osgComoChegar(x.mapa) }, '🧭 Como chegar')));
  return lista.length ? el('div', { class: 'mo-lista' }, ...lista) : el('p', { class: 'vazio' }, 'Ninguém nas cidades agora. Chame um amigo!');
}
if (typeof moPainel === 'function') {
  const _moPainelOsg = moPainel;
  moPainel = async function () {
    if (!osgOnline()) return _moPainelOsg.apply(this, arguments);
    // fora das cidades (caça, casa, arena): em vez do aviso, mostra quem está jogando nas cidades
    if (typeof MO !== 'undefined' && !MO.mapa) return osgModalQuem();
    const res = await _moPainelOsg.apply(this, arguments);
    try {
      const C = document.getElementById('modalConteudo'); if (!C) return res;
      if (osgInvisivel()) C.insertBefore(el('p', { class: 'dica osg-inv' }, '🙈 Você está invisível: ninguém vê você nem os seus emotes (⚙️ › 🌐 Online).'), C.children[1] || null);
      const caixa = el('details', { class: 'osg-quem' }, el('summary', {}, '👥 Jogando agora em todas as cidades…'));
      C.append(caixa);
      osgQuem().then(r => { if (!r || !document.body.contains(caixa)) return; caixa.querySelector('summary').textContent = `👥 ${r.total} jogando agora em todas as cidades`; caixa.append(osgListaQuem(r)); });
    } catch (e) { }
    return res;
  };
}

/* ---------- U6: apagar meus dados do jogo (no servidor) ---------- */
async function osgApagaDados() {
  if (!osgOnline()) return avisoJogo('Entre na sua conta do site para apagar os dados do jogo guardados lá.');
  if (!(await perguntaJogo('Apagar do site TODOS os seus dados do Lenda do Campinho? (save online, ranking, casa publicada, guilda, anúncios da feira e torcidas). A sua conta do site continua. Não dá para desfazer.', { sim: 'Apagar', nao: 'Cancelar', perigo: true }))) return;
  if (!(await perguntaJogo('Tem certeza? Peça para um adulto confirmar com você.', { sim: 'Sim, apagar', nao: 'Não', perigo: true }))) return;
  let r = null; try { r = await fetch(PORTAL.api + '/api/lenda/meus-dados', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: JSON.stringify({ confirmar: 'APAGAR' }) }); } catch (e) { }
  if (!r || !r.ok) { let msg = ''; try { msg = (await r.json()).error || ''; } catch (e) { } return avisoJogo(msg || 'Não deu para apagar agora. Tente de novo daqui a pouco.'); }
  // até recarregar a página, o jogo não manda mais nada ao site (senão o save voltaria na hora)
  try { if (typeof NUVEM !== 'undefined') NUVEM.parada = true; PORTAL.ativo = false; } catch (e) { }
  avisoJogo('🗑️ Pronto: seus dados do jogo foram apagados do site. O personagem DESTE aparelho continua aqui. Se você jogar de novo com a conta do site, o jogo volta a salvar online.');
}

{
  const css = document.createElement('style');
  css.textContent = `.osg-seletor { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 4px 0 8px; } .osg-sel { font: inherit; padding: 4px 6px; border-radius: 8px; max-width: 100%; }
  .osg-nome-time { color: #2a6a1a; } .osg-inp { font: inherit; padding: 4px 8px; border-radius: 8px; min-width: 0; flex: 1 1 160px; } .osg-aviso { flex-basis: 100%; color: #c0392b; font-weight: 700; min-height: 1em; } .osg-motivos { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; } .osg-motivos .btn { text-align: left; justify-content: flex-start; }
  .osg-quem { margin-top: 8px; } .osg-quem summary { cursor: pointer; font-weight: 800; } .osg-inv { background: rgba(120,80,200,.12); border-radius: 8px; padding: 4px 8px; }`;
  document.head.append(css);
}
window.ONLINE_SEGURO = { osgNomeTime, osgSeletorTime, osgDenuncia, osgQuem, osgModalQuem, osgApagaDados, osgMudaPref, OSG_PREFS: () => OSG_PREFS };
