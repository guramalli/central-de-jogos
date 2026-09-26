/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   CORPOS, ROUPAS, CHEFÕES E SKINS (folhas novas do Higgsfield)
   Três tipos de folha (a/boneco_<nome>.webp, caixas em bonecos_meta2.js):
   - "chave": corpos e roupas com as cores-chave de sempre (cabelo magenta,
     parte de cima verde, de baixo azul): cada um pinta com as suas cores —
     o uniforme do time continua valendo;
   - "fixo": chefões, desenhados com as próprias cores (nada é trocado);
   - "skin": fantasias do jogador; só o cabelo e a pele seguem os dele.
   look.folha escolhe a folha. Adversários e NPCs ganham corpo/roupa pelo
   tipo (zagueiro = grandão, goleiro de luvas, torcedor de moletom...) e
   cada um varia dentro do grupo. Carregar DEPOIS de variedade.js.
   ============================================================ */
const MODO_FOLHA = typeof CORPOS_MODO !== 'undefined' ? CORPOS_MODO : {};
// folhas que já têm chapéu/boné/capuz desenhado: o acessório vetorial não entra por cima
const FOLHA_COM_CHAPEU = new Set(['bone_reta', 'bone_f', 'boina_m', 'touca_m', 'panama_m', 'chef', 'capuz_f', 'colete_m']);

/* ---------- carregar as folhas novas (com versão no endereço: imagem nova nunca fica presa no cache) ---------- */
const VERSAO_FOLHAS = ((document.querySelector('script[src*="corpos.js"]') || {}).src || '').split('v=')[1] || '1';
for (const nome of Object.keys(MODO_FOLHA)) if (!FOLHAS[nome]) {
  const im = new Image(); const f = FOLHAS[nome] = { im, ok: false, rot: null };
  im.onload = () => { f.ok = true; }; im.src = `a/boneco_${nome}.webp?v=${VERSAO_FOLHAS}`;
}

/* ---------- escolher e pintar a folha ---------- */
const _folhaDoLookCp = folhaDoLook;
folhaDoLook = function (sp, look) { const f = look && look.folha; return f && META_BONECOS[f] ? f : _folhaDoLookCp(sp, look); };
let MODO_AGORA = null;
const SEM_ACESS = { chapeu: null, rosto: null, pescoco: null, costas: null, mao: null };
const _spriteBonecoCp = spriteBoneco;
spriteBoneco = function (look, ...r) {
  const f = look && look.folha && META_BONECOS[look.folha] ? look.folha : null;
  MODO_AGORA = f ? MODO_FOLHA[f] || 'chave' : null;
  try {
    if (f && MODO_FOLHA[f]) {
      // chefão/skin: tudo já está no desenho; corpos/roupas novos: o chapéu é o do desenho (o vetorial não assenta nessas cabeças)
      const tira = MODO_AGORA === 'chave' ? (FOLHA_COM_CHAPEU.has(f) ? { chapeu: null, rosto: null } : { chapeu: null }) : SEM_ACESS;
      look = look._semAc && look._semAcDe === look._kb ? look._semAc : (look._semAc = Object.assign({}, look, tira, { _kb: undefined, _semAc: undefined }));
      look._semAcDe = look._kb;
    }
    return _spriteBonecoCp.call(this, look, ...r);
  } finally { MODO_AGORA = null; }
};
// skin: a pele é só a cor da pele do rosto desenhado (não confunde dourado/vermelho da roupa com pele)
function peleExata(base) {
  if (base._peleOk) return; base._peleOk = true;
  const { d, rot } = base; const W = FOLHA_CW; const hs = [], ss = [];
  const hsv = i => { const r = d[i * 4] / 255, g = d[i * 4 + 1] / 255, b = d[i * 4 + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn + 1e-6; let h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h *= 60; if (h < 0) h += 360; return [h, mx ? (mx - mn) / mx : 0]; };
  const n = rot.length, alto = n * 0.45; // o rosto fica na metade de cima
  for (let i = 0; i < alto; i += 2) if (rot[i] === 4) { const [h, s] = hsv(i); hs.push(h); ss.push(s); }
  if (hs.length < 30) return;
  hs.sort((a, b) => a - b); ss.sort((a, b) => a - b); const h0 = hs[hs.length >> 1], s0 = ss[ss.length >> 1];
  for (let i = 0; i < n; i++) if (rot[i] === 4) { const [h, s] = hsv(i); if (Math.abs(h - h0) > 9 || Math.abs(s - s0) > 0.2) rot[i] = 0; }
}
const _tingeCelulaCp = tingeCelula;
tingeCelula = function (base, cores) {
  if (MODO_AGORA === 'fixo') return base.c;
  if (MODO_AGORA === 'skin') { peleExata(base); return _tingeCelulaCp.call(this, base, [null, cores[1], null, null, cores[4]]); }
  return _tingeCelulaCp.apply(this, arguments);
};

/* ---------- chefões: cada um com o seu desenho ---------- */
const FOLHA_CHEFE = {
  tonhao: 'ch_tonhao', rei_areia: 'ch_rei_areia', rei_quadra: 'ch_rei_quadra', capitao_sub20: 'ch_capitao_sub20', paredao: 'ch_paredao', capitao_tejo: 'ch_capitao_tejo',
  galactico: 'ch_galactico', lorde: 'ch_lorde', cairo_chefe: 'ch_farao', toquio_chefe: 'ch_sensei', doha_chefe: 'ch_falcao', miami_chefe: 'ch_showman', milao_chefe: 'ch_maestro',
  munique_chefe: 'ch_general', ch_trovao: 'ch_trovao', ch_rainha_ondas: 'ch_rainha_ondas', ch_esfinge: 'ch_esfinge', ch_ronin: 'ch_ronin', ch_nevasca: 'ch_nevasca', ch_imortal: 'ch_imortal',
};
for (const [id, f] of Object.entries(FOLHA_CHEFE)) if (MONSTROS[id] && MONSTROS[id].look && META_BONECOS[f]) { MONSTROS[id].look = Object.assign({}, MONSTROS[id].look, { folha: f }); delete MONSTROS[id].look._kb; }

/* ---------- adversários: corpo pelo tipo, e cada um varia no grupo ---------- */
const GRUPOS_CORPO = {
  goleiro: { m: ['goleiro'], f: ['goleiro'] },
  grande: { m: ['grandao', 'grandao', 'barbudo', 'careca', 'gordinho', 'adulto'], f: ['adulta', 'gordinha', 'trancas'] },
  torcida: { m: ['moletom_m', 'jaqueta_m', 'bone_reta', 'touca_m', 'barbudo', 'gordinho'], f: ['capuz_f', 'bone_f', 'jaqueta_f', 'gordinha'] },
  arbitro: { m: ['careca', 'adulto', 'barbudo', 'social_m'], f: ['adulta', 'golalta_f'] },
  praia: { m: ['regata_m', 'grandao', 'adulto', 'magrelo', 'colete_m'], f: ['adulta', 'bone_f', 'trancas', 'vestido_f'] },
  rua: { m: ['jaqueta_m', 'bone_reta', 'moletom_m', 'magrelo'], f: ['capuz_f', 'bone_f', 'jaqueta_f', 'trancas'] },
  jogador: { m: ['adulto', 'magrelo', 'barbudo', 'careca', 'adulto', 'grandao'], f: ['adulta', 'trancas', 'gordinha', 'adulta', 'bone_f'] },
};
function grupoDoTipo(id, d) {
  const L = d.look || {}, nm = (d.nome || '') + ' ' + id;
  if (/moleque|boneco/.test(id)) return null; // as crianças da Vila continuam crianças
  if (/goleiro/i.test(nm) && !/paredao/.test(id)) return 'goleiro';
  if (/fan[aá]tico|ultra/i.test(nm)) return 'torcida';
  if (/arbitro|árbitro/i.test(nm)) return 'arbitro';
  if (/futevol|salva|surfista|gd_ondas/i.test(nm)) return 'praia';
  if (/skatista|zagueiro_rua/.test(id)) return 'rua';
  if (L.grande || /zagueiro|central|xerife|centroavante|l[ií]bero|muralha|sum[oô]|fisiculturista|guardi/i.test(nm)) return 'grande';
  if (L.roupa === 'roupa-futebol') return 'jogador';
  return null;
}
const CORPO_TIPO = {}; // o corpo "oficial" de cada tipo (o da wiki): o 1º do grupo que combina
for (const [id, d] of Object.entries(MONSTROS)) {
  const L = d.look; if (!L || (L.tipo && L.tipo !== 'humano') || d.chefe || FOLHA_CHEFE[id]) continue;
  const g = grupoDoTipo(id, d); if (!g) continue;
  const lista = GRUPOS_CORPO[g][L.corpo === 'f' ? 'f' : 'm'].filter(f => META_BONECOS[f]); if (!lista.length) continue;
  CORPO_TIPO[id] = { g, lista };
  const oficial = lista[hashTxt(id) % Math.min(2, lista.length)];
  d.look = Object.assign({}, L, { folha: oficial }); delete d.look._kb;
}
const _lookDoMonstroCp = lookDoMonstro;
lookDoMonstro = function (m, mapa) {
  const L = _lookDoMonstroCp(m, mapa); const ct = CORPO_TIPO[m.tipo]; const v = (m.uid || 0) % VAR_N;
  if (!ct || !v) return L;
  const novo = L || Object.assign({}, m.d.look); delete novo._kb;
  novo.folha = ct.lista[(hashTxt(m.tipo) + v * 3) % ct.lista.length];
  return novo;
};

/* ---------- NPCs: roupa e corpo pelo papel de cada um ---------- */
(function () {
  const FRIO = /londres|munique|nevasca|klaus/, PRAIA = /praia|marinho|iara|surf|coco|quiosque/, LOJA = /^loja|lojista|padeir|cozinh|sorvet|feirant|barraca|quiosque|pastel|lanch/;
  const pega = (id, lista) => lista.filter(f => META_BONECOS[f])[hashTxt(id) % lista.filter(f => META_BONECOS[f]).length];
  // cada NPC com a roupa do seu papel (quem não está aqui cai nas regras gerais abaixo)
  const PAPEL = {
    ze: 'vovo', lucia: 'golalta_f', cida: 'vova', juca: 'colete_m', motorista: 'social_m', tata: 'anciao', marinho: 'regata_m', bene: 'avental',
    ginga: 'barbudo', neide: 'gordinha', aurelio: 'boina_m', bia: 'adulta', dada: 'panama_m', remendo: 'avental', zuzu: 'gordinha',
    lojista_lisboa: 'vestido_f', lojista_madri: 'chef', lojista_londres: 'avental', lider_lisboa: 'ancia', lider_madri: 'jaqueta_f', lider_londres: 'sobretudo_m',
    loja_cairo: 'vovo', lider_cairo: 'adulta', loja_toquio: 'golalta_f', lider_toquio: 'anciao', loja_doha: 'social_m', lider_doha: 'bone_f',
    loja_miami: 'bone_reta', lider_miami: 'jaqueta_f', loja_milao: 'vova', lider_milao: 'sobretudo_m', loja_munique: 'gordinha', lider_munique: 'touca_m',
    almanaque: 'vovo', pedal: 'jaqueta_m', rita: 'jaqueta_f', johnny: 'social_m', vera: 'golalta_f', tonico: 'barbudo',
  };
  const IDOSO = new Set(['vovo', 'vova', 'anciao', 'ancia']);
  for (const [id, fo] of Object.entries(PAPEL)) { const n = NPCS[id]; if (n && n.look && META_BONECOS[fo]) { n.look = Object.assign({}, n.look, { folha: fo }, IDOSO.has(fo) ? { corCabelo: 'grisalho' } : {}); delete n.look._kb; } }
  for (const [id, n] of Object.entries(NPCS)) {
    const L = n.look; if (!L || (L.tipo && L.tipo !== 'humano') || L.folha) continue;
    if (/^port_/.test(id)) continue; // porteiros das arenas: de terno, é o uniforme deles
    const f = L.corpo === 'f', nm = (id + ' ' + (n.nome || '')).toLowerCase();
    if ((L.alt || 1.5) < 1.58) continue;                                   // crianças continuam crianças
    if (/terno|smoking/.test(L.roupa || '')) continue;                    // de terno: a folha do terno já é própria
    let lista;
    if (/grisalho/.test(L.corCabelo || '') || /\bvov|nonna/.test(nm)) lista = f ? ['vova', 'golalta_f'] : ['vovo', 'panama_m', 'boina_m', 'social_m'];
    else if (LOJA.test(id) || LOJA.test(nm)) lista = f ? ['golalta_f', 'vestido_f'] : ['avental', 'chef', 'avental'];
    else if (PRAIA.test(nm)) lista = f ? ['vestido_f', 'bone_f', 'adulta'] : ['regata_m', 'colete_m'];
    else if (FRIO.test(nm)) lista = f ? ['jaqueta_f', 'golalta_f', 'capuz_f'] : ['sobretudo_m', 'touca_m', 'jaqueta_m'];
    else if (L.baixo === 'baixo-saia') lista = ['vestido_f', 'golalta_f', 'saia'];
    else lista = f ? ['adulta', 'gordinha', 'trancas', 'vestido_f', 'jaqueta_f', 'golalta_f'] : ['adulto', 'barbudo', 'careca', 'gordinho', 'magrelo', 'jaqueta_m', 'social_m', 'sobretudo_m'];
    const esc = pega(id, lista); if (!esc) continue;
    n.look = Object.assign({}, L, { folha: esc }); delete n.look._kb;
  }
})();

/* ---------- skins do jogador: fantasias desenhadas ---------- */
(function () {
  const FOLHA_SKIN = { camuflado: 'sk_camuflado', ouro: 'sk_ouro', farao: 'sk_farao', neon: 'sk_neon', gelo: 'sk_gelo', lenda: 'sk_lenda' };
  for (const [id, f] of Object.entries(FOLHA_SKIN)) if (SKINS[id] && META_BONECOS[f]) SKINS[id].look = Object.assign({}, SKINS[id].look, { folha: f });
  const NOVAS = [
    ['dino', 'Fantasia de Dinossauro', 8, 'sk_dino', 'folhas', '#5ac83a', 'Um T-rex fofo com rabo e tudo!', 'Vou costurar uma fantasia de DINOSSAURO! Preciso de umas coisinhas da Vila e da praia.', [['pena', 20], ['concha', 15]], 400],
    ['heroi', 'Super-Craque', 15, 'sk_heroi', 'brilho', '#ff3a3a', 'Capa ao vento e raio no peito: herói do campinho!', 'Todo craque é um herói! Me traga material para a capa e o uniforme.', [['bola_praia', 20], ['roda_skate', 15]], 1500],
    ['pirata', 'Pirata da Pelada', 25, 'sk_pirata', 'areia', '#e8c048', 'Chapéu de pirata, tapa-olho e tesouro no pé.', 'Arrr! Uma fantasia de PIRATA de verdade. Quero tesouros!', [['concha', 40], ['oculos_sol', 20], ['cone', 15]], 4000],
    ['astronauta', 'Astronauta da Bola', 35, 'sk_astronauta', 'neve', '#bfe8ff', 'Direto do espaço para o campinho!', 'Minha coleção espacial! Preciso de peças bem difíceis.', [['cronometro', 12], ['luva', 12], ['couro', 10]], 12000],
  ];
  for (const [id, nome, lvl, folha, efeito, cor, desc, texto, itens, ouro] of NOVAS) {
    if (!META_BONECOS[folha] || SKINS[id]) continue;
    const req = { itens: itens.filter(([i]) => ITENS[i]) };
    if (!req.itens.length) continue;
    SKINS[id] = { nome, lvl, efeito, cor, look: { folha }, desc };
    const q = { id: 'sk_' + id, npc: 'vera', titulo: 'Fantasia: ' + nome, lvl, texto, req: Object.assign(req, { ouro }), rec: { xp: Math.round(lvl * lvl * 40), skin: id }, fim: 'Ficou demais! Vista no botão ✨ Visual.' };
    MISSOES_MONT.push(q); MISSOES.push(q);
  }
})();
