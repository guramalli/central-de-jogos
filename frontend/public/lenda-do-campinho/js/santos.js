/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👑 SANTOS E O REI (v234)
   - Os MENINOS DA VILA: os adversários de Santos, com desenho próprio (moicano, tatuagens, faixa).
   - "Nos Passos do Rei": 5 missões com a guia do Museu Pelé, cada uma um capítulo da vida de Pelé,
     que terminam no desafio ao ESQUADRÃO DE 1962 na Vila Belmiro (o capitão é o Rei, de coroa).
   - Capítulo "O Rei do Futebol" (cutscene) na primeira chegada a Santos.
   - A final da Copa (Rio) só abre depois da Vila Belmiro.
   Carregar DEPOIS de arquetipos.js e magias_adv.js (o último a mexer nos adversários e nos mapas).
   ============================================================ */

/* ---------- os Meninos da Vila ---------- */
const META_MENINOS = {"menino_vila_a":[{"cabeca":[40,32,159,137],"tronco":[82,137,118,203]},{"cabeca":[39,32,158,137],"tronco":[82,137,118,203]},{"cabeca":[43,32,161,137],"tronco":[82,137,118,203]},{"cabeca":[41,32,160,137],"tronco":[82,137,118,203]},{"cabeca":[48,39,156,141],"tronco":[82,141,118,205]},{"cabeca":[48,39,155,141],"tronco":[82,141,118,205]},{"cabeca":[49,39,156,141],"tronco":[82,141,118,205]},{"cabeca":[49,39,157,141],"tronco":[82,141,118,205]},{"cabeca":[42,29,159,136],"tronco":[82,136,118,202]},{"cabeca":[43,30,160,136],"tronco":[82,136,118,202]},{"cabeca":[42,29,159,136],"tronco":[82,136,118,202]},{"cabeca":[42,29,159,136],"tronco":[82,136,118,202]}],"menino_vila_b":[{"cabeca":[41,32,160,137],"tronco":[82,137,118,203]},{"cabeca":[40,30,159,136],"tronco":[82,136,118,202]},{"cabeca":[42,33,161,138],"tronco":[82,138,118,203]},{"cabeca":[40,30,160,136],"tronco":[82,136,118,202]},{"cabeca":[41,40,162,142],"tronco":[82,142,118,205]},{"cabeca":[40,38,161,141],"tronco":[82,141,118,205]},{"cabeca":[41,38,161,141],"tronco":[82,141,118,205]},{"cabeca":[42,39,163,141],"tronco":[82,141,118,205]},{"cabeca":[42,33,158,138],"tronco":[82,138,118,203]},{"cabeca":[43,33,160,138],"tronco":[82,138,118,203]},{"cabeca":[41,33,158,138],"tronco":[82,138,118,203]},{"cabeca":[41,33,158,138],"tronco":[82,138,118,203]}]};
Object.assign(META_BONECOS, META_MENINOS);
for (const f in META_MENINOS) CORPOS_MODO[f] = 'fixo';
if (typeof carregaFolhas === 'function') carregaFolhas();
for (const [id, folha] of [['santos_rapido', 'menino_vila_a'], ['santos_meia', 'menino_vila_b'], ['santos_zagueiro', 'menino_vila_b'], ['santos_chefe', 'menino_vila_a']]) {
  const d = MONSTROS[id]; if (!d) continue;
  d.look = Object.assign({}, d.look, { folha, corpo: 'm', grande: id === 'santos_chefe' }); delete d.look._kb;
  d.falas = id === 'santos_chefe' ? ['Aqui é a Vila!', 'Pedalada nele!', 'Ninguém segura os Meninos da Vila!'] : ['Olha a pedalada!', 'Chapéu!', 'Caneta!', 'Aqui é Menino da Vila!'];
}

/* ---------- o Rei na Vila Belmiro ---------- */
{
  const e = typeof EST_POR_ID !== 'undefined' && EST_POR_ID.est_santos;
  const cap = e && e.jog.find(j => j.cap);
  if (cap && MONSTROS[cap.id]) {
    const d = MONSTROS[cap.id];
    d.nome = 'O Rei Pelé'; d.falas = ['Vem jogar comigo, craque!', 'Futebol é alegria!', 'Tabelinha, Coutinho!', 'Mostra a sua ginga!'];
    if (META_BONECOS.cap_santos) { d.look = Object.assign({}, d.look, { folha: 'cap_santos' }); delete d.look._kb; }
  }
}
{ const q = typeof CONQUISTAS !== 'undefined' && CONQUISTAS.find(c => c.id === 'c_estadios_todos');
  if (q) { const n = ESTADIOS.length; q.desc = `Venceu os ${n} times, em todos os estádios do mundo.`; q.dica = `Vença o time de cada um dos ${n} estádios.`; } }

/* ---------- missões da cidade (textos com os Meninos da Vila) ---------- */
{
  const tx = { santos_m1: 'Os Meninos da Vila correm pela orla inteira com pedaladas e chapéus. Mostre o futebol da Vila do Campinho: passe por 30 Moleques da Vila.',
    santos_m2: 'Os Xerifes da Vila Belmiro são a defesa mais habilidosa daqui: eles saem driblando! Vença 30.',
    santos_m3: 'Os Camisas 10 da Baixada leem o jogo como ninguém. Vença 30 para aprender com eles.',
    santos_m4: 'O CAPITÃO DOS MENINOS DA VILA manda na Ponta da Praia. Vença e toda a Vila Belmiro vai falar de você!' };
  for (const [id, t] of Object.entries(tx)) { const q = MISSOES.find(x => x.id === id); if (q) q.texto = t; }
  const m4 = MISSOES.find(x => x.id === 'santos_m4'); if (m4) m4.fim = 'Os Meninos da Vila te aplaudiram! Agora vá ao Museu Pelé: a guia tem uma história para te contar.';
}

/* ---------- "Nos Passos do Rei": a guia do Museu Pelé ---------- */
NPCS.guia_rei = { nome: 'Dona Celeste, guia do Museu Pelé', ola: 'Bem-vindo(a) ao Museu Pelé! Aqui a gente conta a história do Rei do Futebol. Cada missão é um capítulo da vida dele. Vamos juntos?',
  look: { tipo: 'humano', corpo: 'f', alt: 1.7, pele: 'pele-negra', cabelo: 'cabelo-cacheado', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: '#1a1a1a', baixo: 'baixo-saia', pescoco: 'pescoco-cachecol' } };
{
  const L = 188, xpN = x => xpPara(x + 1) - xpPara(x);
  MISSOES.push(
    { id: 'santos_rei1', npc: 'guia_rei', titulo: 'O Rei (1): A Bola de Meia', lvl: 182,
      texto: 'Edson Arantes do Nascimento nasceu em 1940, em Três Corações (MG), e cresceu em Bauru (SP). A família era humilde: ele engraxava sapatos para ajudar em casa e jogava na rua com uma BOLA DE MEIA, feita de meias velhas amarradas. O apelido "Pelé" veio de uma brincadeira dos amigos! Mostre a sua ginga como ele: passe por 40 Pontas Meninos da Vila.',
      req: { kill: 'santos_rapido', n: 40 }, rec: { xp: Math.round(xpN(L) * 1.2), ouro: L * 150, itens: [['pastel_caldo', 5]] }, fim: 'Com uma bola de meia e muita alegria, nasceu um craque!' },
    { id: 'santos_rei2', npc: 'guia_rei', titulo: 'O Rei (2): A Promessa de 1950', lvl: 183, pre: 'santos_rei1',
      texto: 'Em 1950, o Brasil perdeu a final da Copa do Mundo no Maracanã. O pai do menino, o Dondinho, que também era jogador, chorou ouvindo o jogo no rádio. O pequeno Edson o abraçou e prometeu: "Não chora, pai. Um dia eu vou ganhar uma Copa do Mundo para o senhor!" Mostre a mesma garra: passe por 40 Meias Meninos da Vila.',
      req: { kill: 'santos_meia', n: 40 }, rec: { xp: Math.round(xpN(L) * 1.3), ouro: L * 170 }, fim: 'E ele cumpriu a promessa... três vezes!' },
    { id: 'santos_rei3', npc: 'guia_rei', titulo: 'O Rei (3): Aos 15 Anos, na Vila', lvl: 184, pre: 'santos_rei2',
      texto: 'Em 1956, com só 15 anos, ele chegou ao Santos e logo virou titular. Aos 17, foi convocado para a Copa de 1958, na Suécia: fez gols na final, chorou de alegria e o Brasil foi campeão do mundo pela primeira vez! Os zagueiros tentavam de tudo para pará-lo. Passe por 40 Zagueiros Meninos da Vila.',
      req: { kill: 'santos_zagueiro', n: 40 }, rec: { xp: Math.round(xpN(L) * 1.4), ouro: L * 190 }, fim: 'Aos 17 anos, campeão do mundo. A promessa estava cumprida!' },
    { id: 'santos_rei4', npc: 'guia_rei', titulo: 'O Rei (4): O Gol de Placa', lvl: 186, pre: 'santos_rei3',
      texto: 'Em 1961, no Maracanã, ele driblou meio time do Fluminense e fez um gol tão bonito que ganhou uma PLACA no estádio: foi daí que nasceu a expressão "gol de placa"! Em 1969 ele fez o seu gol número MIL e o dedicou às crianças. Faça a sua jogada de placa: vença o Capitão dos Meninos da Vila na Ponta da Praia.',
      req: { kill: 'santos_chefe', n: 1 }, rec: { xp: Math.round(xpN(L) * 2), ouro: L * 300 }, fim: 'Isso sim foi um gol de placa!' },
    { id: 'santos_rei5', npc: 'guia_rei', titulo: 'O Rei (5): O Esquadrão de 1962', lvl: 188, pre: 'santos_rei4',
      texto: 'Em 1962, o Santos de Pelé, Coutinho, Pepe, Zito e Gilmar foi campeão da Libertadores e do Mundial de Clubes: muita gente diz que foi o maior time que já existiu na Terra! E em 1970, no México, Pelé ganhou a sua TERCEIRA Copa: é o único jogador tricampeão do mundo. Hoje o Esquadrão de 1962 volta a campo na VILA BELMIRO, só para você. Fale com o técnico no estádio e vença o time do Rei!',
      req: { flag: 'venceu_est_santos', desc: 'Vença o Santos de 1962 na Vila Belmiro' }, rec: { xp: Math.round(xpN(L) * 4), ouro: L * 500, flag: 'bencao_rei', itens: [['estatueta_rei', 1]] },
      fim: 'Depois do apito final, o Rei tirou a coroa, sorriu e disse: "Você joga com alegria, como um menino da vila. Agora vá até o Rio e traga a Copa para casa!"' },
  );
  // a final da Copa (Rio) vem DEPOIS da Vila Belmiro
  const copa = MISSOES.find(q => q.id === 'rio_m5');
  if (copa) { copa.pre = 'santos_rei5'; copa.texto = 'O Rei te abençoou na Vila Belmiro. Chegou a hora: a ARENA DA COPA DO MUNDO abriu as portas aqui no Rio, e A LENDA DA COPA espera por você no gramado. Vença a final e traga a taça para casa!'; }
}
// a guia fica na frente do Museu Pelé (o museu é posto no mapa pelos monumentos)
{
  const base = MAPAS_DEF.santos;
  if (base) MAPAS_DEF.santos = function () {
    const m = base();
    try {
      const livre = (x, y) => x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1 && !m.obj[y * m.w + x] && CH_ANDA(m.chao[y * m.w + x])
        && !m.npcs.some(n => n.x === x && n.y === y) && !m.saidas.some(s => s.x === x && s.y === y) && !m.placas.some(p => p.x === x && p.y === y);
      const p = m.predios.find(q => q.spr === 'mon_museu_pele'); let pos = null;
      if (p) for (let dy = 0; dy < 3 && !pos; dy++) for (let dx = p.w - 1; dx >= 0 && !pos; dx--) { const x = p.x + dx, y = p.y + p.h + dy; if (livre(x, y)) pos = { x, y }; }
      if (!pos) for (let r = 0; r < 8 && !pos; r++) for (let dx = -r; dx <= r && !pos; dx++) if (livre(10 + dx, 22)) pos = { x: 10 + dx, y: 22 };
      if (pos) m.npcs.push({ id: 'guia_rei', x: pos.x, y: pos.y });
      // a praça da estátua do Rei com o mosaico da orla (não a pedra cinza das outras praças)
      const e = m.predios.find(q => q.spr === 'mon_pele');
      if (e && CH.CALCADA_SANTOS != null) for (let y = e.y - 1; y <= e.y + e.h + 1; y++) for (let x = e.x - 2; x <= e.x + e.w + 1; x++) { const k = y * m.w + x; if (m.chao[k] === CH.PEDRA) m.chao[k] = CH.CALCADA_SANTOS; }
    } catch (e) { console.error('guia do museu', e); }
    return m;
  };
}

/* ---------- capítulo: O Rei do Futebol ---------- */
if (typeof CAPITULOS !== 'undefined') {
  CAPITULOS.rei = {
    rotulo: 'Capítulo 5', titulo: 'O Rei do Futebol', emoji: '👑', implica: ['mundo', 'europa'],
    cond: (s, mapa) => mapa === 'santos',
    cenas: [
      { img: 'cap_rei_1', kb: 'kb-a', cor: ['#f7b35a', '#c8623e'],
        txt: n => 'Muito antes de você nascer, um menino de Bauru jogava bola na rua com uma bola feita de meias velhas. O nome dele era Edson... mas o mundo inteiro ia conhecê-lo como PELÉ.' },
      { img: 'cap_rei_2', kb: 'kb-b', cor: ['#3a2a5a', '#f0a040'],
        txt: n => 'Em 1950, o Brasil perdeu a Copa no Maracanã, e o pai dele chorou ao lado do rádio. O menino o abraçou e prometeu: “Um dia eu vou ganhar uma Copa do Mundo para o senhor!”' },
      { img: 'cap_rei_3', kb: 'kb-c', cor: ['#f8d838', '#1a9a3a'], som: 'gol',
        txt: n => 'Oito anos depois, na Suécia, aquele menino tinha 17 anos. Fez gols na final, chorou de alegria e levantou a taça. Promessa cumprida! Depois vieram 1962 e 1970: três Copas do Mundo.' },
      { img: 'cap_rei_4', kb: 'kb-e', cor: ['#f4f4f8', '#1a1a1a'],
        txt: n => 'No Santos, ao lado de Coutinho, ele inventou tabelinhas mágicas, fez mais de mil gols e ganhou um apelido que ninguém nunca mais ganhou: o REI DO FUTEBOL.' },
      { img: 'cap_rei_5', kb: 'kb-zoom', foco: '62% 35%', cor: ['#f7b35a', '#7a4aff'],
        txt: n => `Hoje uma estátua dourada, de coroa, lembra o Rei aqui na orla de Santos. E dizem que, na Vila Belmiro, o Esquadrão de 1962 ainda espera um craque de coração alegre. Será ${_hn(n)}?` },
    ],
    final: { emoji: '👑', titulo: 'O Rei do Futebol', sub: n => 'Fim do Capítulo 5. Visite o Museu Pelé, siga os passos do Rei e desafie o Esquadrão de 1962 na Vila Belmiro!', botao: 'Continuar ⚽' },
  };
  const i = CAPITULOS_ORDEM.indexOf('europa'); if (i >= 0 && !CAPITULOS_ORDEM.includes('rei')) CAPITULOS_ORDEM.splice(i + 1, 0, 'rei');
  // os capítulos seguintes andam uma casa
  const num = { retorno: 6, copa: 7, atlantida: 8, espaco: 9, galaxia: 10 };
  for (const [id, k] of Object.entries(num)) if (CAPITULOS[id]) { CAPITULOS[id].rotulo = 'Capítulo ' + k; if (CAPITULOS[id].final && typeof CAPITULOS[id].final.sub === 'function') { const f = CAPITULOS[id].final.sub; CAPITULOS[id].final.sub = n => String(f(n)).replace(/Capítulo \d+/, 'Capítulo ' + k); /* v244: também 'Capítulo N começou!' */ } }
  // "Rumo à Copa": depois da bênção do Rei, de volta ao Rio (ou direto na Arena da Copa)
  if (CAPITULOS.retorno) { CAPITULOS.retorno.cond = (s, mapa) => CAP_MAPAS_FINAL.includes(mapa) || (mapa === 'rio' && !!s.flags.bencao_rei); CAPITULOS.retorno.implica = ['mundo', 'europa', 'rei']; }
  for (const id of ['copa', 'atlantida', 'espaco', 'galaxia']) if (CAPITULOS[id] && Array.isArray(CAPITULOS[id].implica) && !CAPITULOS[id].implica.includes('rei')) CAPITULOS[id].implica.push('rei');
}

/* ---------- os Turistas Branquelos (praia, gol caixote): dois jeitos misturados na areia ---------- */
{
  const META_TUR = {"turista_a":[{"cabeca":[37,48,161,147],"tronco":[82,147,118,208]},{"cabeca":[37,48,161,147],"tronco":[82,147,118,208]},{"cabeca":[42,48,165,147],"tronco":[82,147,118,208]},{"cabeca":[39,48,163,147],"tronco":[82,147,118,208]},{"cabeca":[44,61,161,154],"tronco":[82,154,118,212]},{"cabeca":[42,61,159,154],"tronco":[82,154,118,212]},{"cabeca":[43,61,160,154],"tronco":[82,154,118,212]},{"cabeca":[44,60,161,154],"tronco":[82,154,118,212]},{"cabeca":[39,54,161,150],"tronco":[82,150,118,210]},{"cabeca":[41,54,163,150],"tronco":[82,150,118,210]},{"cabeca":[39,54,161,150],"tronco":[82,150,118,210]},{"cabeca":[42,54,164,150],"tronco":[82,150,118,210]}],"turista_b":[{"cabeca":[32,48,169,147],"tronco":[82,147,118,208]},{"cabeca":[32,46,168,145],"tronco":[82,145,118,207]},{"cabeca":[35,46,171,145],"tronco":[82,145,118,207]},{"cabeca":[34,48,170,147],"tronco":[82,147,118,208]},{"cabeca":[45,55,166,151],"tronco":[82,151,118,210]},{"cabeca":[46,55,166,151],"tronco":[82,151,118,210]},{"cabeca":[46,55,167,151],"tronco":[82,151,118,210]},{"cabeca":[47,55,167,151],"tronco":[82,151,118,210]},{"cabeca":[37,48,163,147],"tronco":[82,147,118,208]},{"cabeca":[39,48,165,147],"tronco":[82,147,118,208]},{"cabeca":[36,48,162,147],"tronco":[82,147,118,208]},{"cabeca":[38,48,164,147],"tronco":[82,147,118,208]}]};
  Object.assign(META_BONECOS, META_TUR); for (const f in META_TUR) CORPOS_MODO[f] = 'fixo';
  if (typeof carregaFolhas === 'function') carregaFolhas();
  const d = MONSTROS.santos_turista;
  if (d) { d.look = Object.assign({}, d.look, { folha: 'turista_a', corpo: 'm', grande: false }); delete d.look._kb; }
  const _lookTur = lookDoMonstro;
  lookDoMonstro = function (m, mapa) {
    if (!m || m.tipo !== 'santos_turista' || !m.d || !m.d.look) return _lookTur.apply(this, arguments);
    const L = Object.assign({}, m.d.look, { folha: (m.uid || 0) % 2 ? 'turista_b' : 'turista_a' }); delete L._kb; return L;
  };
}
