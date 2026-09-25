/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — HISTÓRIA (prólogo + capítulos em cutscene)
   Cenas ilustradas com pan/zoom lento (Ken Burns), legenda de
   pergaminho com texto "máquina de escrever" e cartão final.

   API:
     mostraHistoria(nome, aoTerminar)      → prólogo (novo jogo)
     mostraCapitulo(id, aoTerminar, nome?) → qualquer capítulo de CAPITULOS
     abreMenuCapitulos()                   → menu da tela inicial (rever)
   Os capítulos disparam sozinhos durante o jogo (verificaCapitulos),
   uma única vez por save (flag G.save.flags['cena_' + id]).

   Clique / Espaço / Enter / → avançam (1º toque completa o texto),
   ← volta, Esc pula. Não depende do canvas do jogo.
   ============================================================ */

// helpers de nome: "você"/"Você" quando o jogador não tem nome (ex.: rever pelo menu sem save)
const _hn = n => n || 'você';
const _hN = n => n || 'Você';

const HISTORIA_CENAS = [
  { img: 'historia_1', kb: 'kb-a', cor: ['#f7b35a', '#3aa0c8'],
    txt: n => 'Numa vilinha à beira-mar, onde o dia começa com cheiro de pão de queijo e barulho de onda, fica a Vila do Campinho. E bem no meio dela... um campinho de terra batida.' },
  { img: 'historia_2', kb: 'kb-b', cor: ['#c89a5a', '#6a4a2a'],
    txt: n => 'Há muitos anos, o time da vila era o orgulho da região. Um moleque magrinho chamado Zé fazia chover naquele campinho!' },
  { img: 'historia_3', kb: 'kb-c', cor: ['#b07ac8', '#e88a4a'],
    txt: n => 'Mas o tempo passou. A molecada cresceu, foi embora... e o campinho ficou quietinho, tomado pelo mato e pelos pombos folgados.' },
  { img: 'historia_4', kb: 'kb-d', cor: ['#f0c060', '#5ab85a'],
    txt: n => `Até que um dia nasceu ali uma nova estrela: ${_hn(n)}! E a sua primeira bola de capotão já esperava no baú do quintal.` },
  { img: 'historia_5', kb: 'kb-a', cor: ['#ff9a5a', '#c8508a'],
    txt: n => `O velho Seu Zé, agora treinador, viu o brilho nos seus olhos e fez uma promessa: “Treina comigo${n ? ', ' + n : ''}, que esse campinho volta a ter vida. E quem sabe... um dia, até o grande Estádio!”` },
  { img: 'historia_6', kb: 'kb-e', cor: ['#5ac8ff', '#4fc26a'],
    txt: n => 'O caminho é longo: a Praia, a Cidade, o CT e o Estádio, onde mora O Paredão, o goleiro que nunca levou gol. Em cada canto, um rival vai te desafiar pra um duelo de drible. Quem perde só fica cansado!' },
  { img: 'historia_7', kb: 'kb-b', cor: ['#2b1b5e', '#f0a81a'],
    txt: n => 'E quando crescer, você vai fundar o seu próprio clube, subir da Várzea até a Série A... e rodar o mundo, do Cairo a Londres, rumo ao Mundial de Clubes!' },
];

const CAP_MAPAS_MUNDO = ['cairo', 'toquio', 'doha', 'miami'];
const CAP_MAPAS_EUROPA = ['lisboa', 'madri', 'milao', 'munique', 'londres'];

// Ordem da história (e da checagem). cond(save, idDoMapa) → true quando o momento chegou.
// implica: capítulos anteriores que ficam "vistos" junto (ex.: quem chegou à Europa já viajou o mundo).
const CAPITULOS = {
  intro: {
    rotulo: 'Prólogo', titulo: 'A Vila do Campinho', semTag: true,
    cenas: HISTORIA_CENAS,
    final: { emoji: '⚽', titulo: 'Lenda do Campinho', sub: n => 'Toda lenda começa com o primeiro toque na bola.' + (n ? ` Bora, ${n}!` : ' Bora?'), botao: 'Bora jogar! ⚽' },
  },
  adulto: {
    rotulo: 'Capítulo 1', titulo: 'Gente Grande', emoji: '📝',
    cond: s => s.nivel >= (typeof NIVEL_TIME !== 'undefined' ? NIVEL_TIME : 25),
    cenas: [
      { img: 'cap_adulto_1', kb: 'kb-a', cor: ['#f0c060', '#7a4aff'],
        txt: n => 'O tempo voou! Aquele moleque do campinho virou gente grande. E um dia, o Empresário Rodrigues bateu na porta com uma ideia daquelas...' },
      { img: 'cap_adulto_1', kb: 'kb-zoom', foco: '70% 45%', cor: ['#f0c060', '#7a4aff'],
        txt: n => `“Que tal fundar o seu PRÓPRIO clube?” A Mãe quase caiu da cadeira de tanta alegria. E ${_hn(n)} assinou os papéis na hora!` },
      { img: 'cap_adulto_2', kb: 'kb-c', cor: ['#7a4aff', '#f0c030'],
        txt: n => 'Um time com o jeitinho da Vila: começando lá de baixo, na Várzea, e subindo divisão por divisão, sempre no jogo limpo. Rumo à Série A!' },
    ],
    final: { emoji: '📝', titulo: 'Gente Grande', sub: n => 'Fim do Capítulo 1. Abra “Meu Time” para fundar o seu clube!', botao: 'Continuar ⚽' },
  },
  paredao: {
    rotulo: 'Capítulo 2', titulo: 'O Campinho Renasce', emoji: '🧤',
    cond: s => !!(s.flags.venceu_paredao || s.flags.craque),
    cenas: [
      { img: 'cap_paredao_1', kb: 'kb-b', cor: ['#5ac8ff', '#7a2ad9'], som: 'gol',
        txt: n => `Lembra do Paredão, o goleiro que nunca tinha levado gol? Pois é... levou! ${_hN(n)} bateu no cantinho, e a bola beijou a rede.` },
      { img: 'cap_paredao_1', kb: 'kb-zoom', foco: '72% 45%', cor: ['#5ac8ff', '#7a2ad9'],
        txt: n => 'O gigante, cansado, abriu um sorrisão e bateu palmas: “Nunca vi nada igual. Você é um craque de verdade!”' },
      { img: 'cap_paredao_2', kb: 'kb-a', cor: ['#ff9a5a', '#4fc26a'],
        txt: n => `De volta à vila, uma surpresa: o campinho estava lotado de crianças de novo! Todo mundo queria jogar igualzinho a ${_hn(n)}.` },
      { img: 'cap_paredao_2', kb: 'kb-zoom', foco: '28% 45%', cor: ['#ff9a5a', '#4fc26a'],
        txt: n => 'Seu Zé enxugou uma lágrima: “Promessa cumprida, craque. O campinho voltou a ter vida!” Mas a sua história... estava só começando.' },
    ],
    final: { emoji: '🧤', titulo: 'O Campinho Renasce', sub: n => 'Fim do Capítulo 2. O Brasil ficou pequeno... e o mundo está chamando!', botao: 'Continuar ⚽' },
  },
  mundo: {
    rotulo: 'Capítulo 3', titulo: 'Asas pelo Mundo', emoji: '✈️',
    cond: (s, mapa) => CAP_MAPAS_MUNDO.includes(mapa),
    cenas: [
      { img: 'cap_mundo_1', kb: 'kb-a', cor: ['#5ac8ff', '#f0c060'],
        txt: n => `Chegou o dia de atravessar o oceano. No aeroporto, a Mãe segurou o choro, e o Seu Zé acenou com o boné: “Leva a Vila no coração${n ? ', ' + n : ''}!”` },
      { img: 'cap_mundo_1', kb: 'kb-zoom', foco: '72% 50%', cor: ['#5ac8ff', '#f0c060'],
        txt: n => 'Na mochila, junto com a chuteira, ia a velha bola de capotão. Afinal, ela também merecia conhecer o mundo!' },
      { img: 'cap_mundo_2', kb: 'kb-e', cor: ['#f7b35a', '#3aa0c8'],
        txt: n => 'Pirâmides, luzes de neon, dunas douradas e praias ensolaradas: cada cidade ama o futebol de um jeito. E em todas tem gente querendo jogar com você.' },
    ],
    final: { emoji: '✈️', titulo: 'Asas pelo Mundo', sub: n => 'Fim do Capítulo 3. Faça amigos, respeite os rivais e mostre o futebol da Vila!', botao: 'Continuar ⚽' },
  },
  europa: {
    rotulo: 'Capítulo 4', titulo: 'O Velho Continente', emoji: '🏰', implica: ['mundo'],
    cond: (s, mapa) => CAP_MAPAS_EUROPA.includes(mapa),
    cenas: [
      { img: 'cap_europa_1', kb: 'kb-c', cor: ['#e88a4a', '#5a3a8a'],
        txt: n => 'O Velho Continente! Ruas de pedra, bondinhos, cafés quentinhos... e estádios mais antigos que muitos castelos.' },
      { img: 'cap_europa_2', kb: 'kb-a', cor: ['#1a2a5a', '#7a4aff'],
        txt: n => `Aqui moram os rivais mais fortes que você já enfrentou. Mas ${_hn(n)} aprendeu lá no campinho: respeito, coragem e bola no chão.` },
      { img: 'historia_1', kb: 'kb-d', cor: ['#f7b35a', '#3aa0c8'],
        txt: n => 'Do outro lado do oceano, a Vila do Campinho inteira para pra ver seus jogos. E o Seu Zé sempre lembra: “Torcer é festa, não é briga!”' },
    ],
    final: { emoji: '🏰', titulo: 'O Velho Continente', sub: n => 'Fim do Capítulo 4. Lá no fim do caminho, o Mundial de Clubes te espera...', botao: 'Continuar ⚽' },
  },
  gloria: {
    rotulo: 'Epílogo', titulo: 'Glória Eterna', emoji: '👑', implica: ['adulto', 'paredao', 'mundo', 'europa'],
    cond: s => !!s.flags.campeao_pais_mundo,
    cenas: [
      { img: 'cap_gloria_1', kb: 'kb-b', cor: ['#1a1450', '#7a4aff'],
        txt: n => `A grande final do Mundial de Clubes. Um estádio gigante, o mundo inteiro assistindo... e a bola nos pés de ${_hn(n)}.` },
      { img: 'historia_7', kb: 'kb-a', cor: ['#2b1b5e', '#f0a81a'], som: 'gol',
        txt: n => 'GOOOOL! O clube que nasceu lá na Várzea agora é CAMPEÃO DO MUNDO! A taça dourada brilhou mais que os fogos.' },
      { img: 'cap_gloria_2', kb: 'kb-c', cor: ['#f7b35a', '#7a4aff'],
        txt: n => 'De volta à Vila do Campinho, a festa tomou conta das ruas. E quem chegou primeiro pro abraço? A Mãe, é claro.' },
      { img: 'cap_gloria_3', kb: 'kb-e', cor: ['#ff9a5a', '#4fc26a'],
        txt: n => 'O campinho ganhou grama nova, um mural colorido... e a estátua de uma criança com uma bola de capotão. Adivinha quem é?' },
      { img: 'cap_gloria_3', kb: 'kb-zoom', foco: '25% 70%', cor: ['#ff9a5a', '#4fc26a'],
        txt: n => 'No velho banco de madeira, o Seu Zé sorriu: “Eu prometi que esse campinho ia voltar a ter vida. Você fez muito mais: fez a vila inteira sonhar.”' },
      { img: 'cap_gloria_4', kb: 'kb-d', cor: ['#140a40', '#3a2780'],
        txt: n => `E numa noite estrelada, uma criança pega a bola, olha pro céu e sonha... igualzinho a ${_hn(n)}, lá no comecinho. Porque uma lenda nunca termina: ela inspira.` },
    ],
    final: { emoji: '👑', titulo: 'Glória Eterna', sub: n => `Parabéns${n ? ', ' + n : ''}! Do campinho de terra ao topo do mundo.`,
      creditos: ['Lenda do Campinho', 'Uma história de educacaogamer.com.br', 'Obrigado por jogar!'], botao: 'A lenda continua... ⚽' },
  },
};
const CAPITULOS_ORDEM = ['intro', 'adulto', 'paredao', 'mundo', 'europa', 'gloria'];

let HIST = null; // estado da cutscene aberta (só uma por vez)

function historiaCss() {
  if (document.getElementById('historia-css')) return;
  const st = document.createElement('style'); st.id = 'historia-css';
  st.textContent = `
.hist { position: fixed; inset: 0; z-index: 9000; background: #140a32; overflow: hidden; color: var(--tinta, #3b2410);
  font-family: 'Fredoka', 'Nunito', sans-serif; font-variant-ligatures: none; font-feature-settings: "liga" 0, "clig" 0;
  user-select: none; -webkit-user-select: none; cursor: pointer; opacity: 0; transition: opacity .6s ease; touch-action: manipulation; }
.hist.on { opacity: 1; }
.hist.saindo { opacity: 0; pointer-events: none; }
.hist * { box-sizing: border-box; }
.hist-palco { position: absolute; inset: 0; overflow: hidden; }
.hist-cena { position: absolute; inset: 0; opacity: 0; transition: opacity 1.1s ease; overflow: hidden; }
.hist-cena.on { opacity: 1; }
.hist-cena .h-fundo { display: none; }
.hist-cena .h-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; image-rendering: auto; will-change: transform;
  animation: 22s ease-in-out infinite alternate both; }
.hist-cena.sem-img .h-img { display: none; }
.hist-cena.sem-img { background: linear-gradient(160deg, var(--c1), var(--c2)); }
.hist-cena.sem-img::after { content: '⚽'; position: absolute; left: 50%; top: 38%; transform: translate(-50%, -50%); font-size: min(22vw, 140px); opacity: .25; }
@keyframes kb-a { from { transform: scale(1.04) translate(0, 0); } to { transform: scale(1.16) translate(-2.5%, -1.5%); } }
@keyframes kb-b { from { transform: scale(1.16) translate(2%, 1%); } to { transform: scale(1.05) translate(-1%, 0); } }
@keyframes kb-c { from { transform: scale(1.06) translate(2%, 0); } to { transform: scale(1.14) translate(-2%, 1%); } }
@keyframes kb-d { from { transform: scale(1.12) translate(-2%, 1.5%); } to { transform: scale(1.04) translate(1.5%, -1%); } }
@keyframes kb-e { from { transform: scale(1.1) translate(3.5%, 0); } to { transform: scale(1.1) translate(-3.5%, 0); } }
@keyframes kb-zoom { from { transform: scale(1.08); } to { transform: scale(1.32); } }
.hist-vinheta { position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(20,10,50,.55) 100%), linear-gradient(180deg, rgba(20,10,50,.35) 0, transparent 16%, transparent 58%, rgba(20,10,50,.7) 100%); }
.hist-pular { position: absolute; top: max(12px, env(safe-area-inset-top)); right: 16px; z-index: 5; font-size: 14px; padding: 6px 12px; opacity: .92; }
.hist-tag { position: absolute; top: max(14px, env(safe-area-inset-top)); left: 16px; z-index: 5; max-width: calc(100% - 200px); pointer-events: none;
  font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 15px; color: var(--texto, #fff6e0); text-shadow: 0 2px 0 rgba(0,0,0,.5), 0 0 12px rgba(0,0,0,.5);
  opacity: 0; transition: opacity 1s ease .4s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hist-tag b { color: var(--amarelo, #ffd23f); font-weight: 700; }
.hist.on .hist-tag { opacity: 1; }
.hist-legenda { position: absolute; left: 50%; bottom: max(16px, env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 4;
  width: min(860px, calc(100% - 32px)); padding: 14px 18px 10px; cursor: pointer;
  transition: opacity .35s ease, transform .35s ease; }
.hist-legenda.troca { opacity: .0; transform: translateX(-50%) translateY(6px); }
.hist-texto { margin: 0; min-height: 4.2em; font-family: Nunito, sans-serif; font-weight: 700; font-size: clamp(15px, 2.1vw, 20px); line-height: 1.42; color: var(--tinta, #3b2410); }
.hist-texto .cur { display: inline-block; width: .5em; animation: hist-pisca .7s steps(1) infinite; color: var(--madeira, #8a4b24); }
@keyframes hist-pisca { 50% { opacity: 0; } }
.hist-rodape { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; }
.hist-dots { display: flex; gap: 7px; flex-wrap: wrap; }
.hist-dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--papel2, #ecd09a); border: 2px solid var(--madeira3, #b8733a); transition: background .3s, transform .3s; }
.hist-dots i.ja { background: var(--madeira3, #b8733a); }
.hist-dots i.agora { background: var(--amarelo, #ffd23f); border-color: var(--madeira2, #5e2f14); transform: scale(1.25); }
.hist-dica { font-family: Nunito, sans-serif; font-weight: 800; font-size: 13px; color: var(--madeira, #8a4b24); opacity: 0; transition: opacity .3s; white-space: nowrap; }
.hist-dica.on { opacity: 1; animation: hist-bate 1.2s ease-in-out infinite; }
@keyframes hist-bate { 50% { transform: translateX(3px); } }
.hist-carregando { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; color: var(--texto, #fff6e0); font-weight: 600; z-index: 6; }
.hist-carregando .bola { font-size: 42px; animation: hist-quica .6s ease-in-out infinite alternate; }
@keyframes hist-quica { from { transform: translateY(-10px); } to { transform: translateY(8px); } }
.hist-final { position: absolute; inset: 0; z-index: 7; display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0; pointer-events: none; transition: opacity 1s ease;
  background: radial-gradient(circle at 50% 40%, rgba(58,39,128,.55), rgba(20,10,50,.92) 70%); }
.hist-final.on { opacity: 1; pointer-events: auto; }
.hist-final .caixa { text-align: center; padding: 22px 26px 20px; width: min(560px, 100%); transform: scale(.92); transition: transform 1s cubic-bezier(.2,1.4,.4,1); }
.hist-final.on .caixa { transform: scale(1); }
.hist-final h1 { font-family: 'Fredoka', sans-serif; font-size: clamp(34px, 8vw, 58px); margin: 0 0 6px; color: var(--madeira2, #5e2f14); text-shadow: 3px 3px 0 var(--amarelo, #ffd23f); letter-spacing: 1px; line-height: 1.05; }
.hist-final .rot { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; color: var(--madeira, #8a4b24); margin: 0 0 2px; }
.hist-final p.sub { font-family: Nunito, sans-serif; font-weight: 700; font-size: clamp(15px, 2.2vw, 18px); margin: 0 0 16px; }
.hist-final .creditos { margin: -4px 0 16px; padding: 10px 0 0; border-top: 2px dashed var(--madeira3, #b8733a); font-family: Nunito, sans-serif; font-weight: 700; font-size: 14px; line-height: 1.6; color: var(--madeira2, #5e2f14); }
.hist-final .creditos span { display: block; opacity: 0; animation: hist-sobe .8s ease forwards; }
@keyframes hist-sobe { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.hist-final .bola { font-size: 40px; display: block; margin-bottom: 4px; animation: hist-quica .7s ease-in-out infinite alternate; }
.hist.gloria .hist-final { background: radial-gradient(circle at 50% 35%, rgba(240,192,48,.35), rgba(20,10,50,.94) 70%); }
.cap-lista { display: flex; flex-direction: column; gap: 8px; margin: 10px 0 4px; }
.cap-item { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 10px 12px; border-radius: 8px; border: 2px solid var(--madeira3, #b8733a);
  background: #fffaf0; color: var(--tinta, #3b2410); font-family: Nunito, sans-serif; font-weight: 700; font-size: 15px; cursor: pointer; }
.cap-item:hover:not(:disabled) { background: #fff3c8; }
.cap-item .ce { font-size: 26px; width: 34px; text-align: center; flex: none; }
.cap-item small { display: block; font-weight: 700; font-size: 12px; color: var(--madeira, #8a4b24); letter-spacing: 1px; text-transform: uppercase; }
.cap-item small.dc { text-transform: none; letter-spacing: 0; font-weight: 600; opacity: .85; }
.cap-item b { font-family: 'Fredoka', sans-serif; font-size: 17px; font-weight: 600; }
.cap-item:disabled { cursor: not-allowed; opacity: .6; background: #ecd09a55; }
.cap-item .play { margin-left: auto; font-size: 18px; }
@media (max-aspect-ratio: 1/1) {
  .hist-cena .h-fundo { display: block; position: absolute; inset: -30px; width: calc(100% + 60px); height: calc(100% + 60px); object-fit: cover; filter: blur(16px) brightness(.55) saturate(1.2); }
  .hist-cena .h-img { inset: auto; left: 0; top: 56px; width: 100%; height: min(64vh, calc(100% - 300px)); min-height: 200px; object-fit: cover; object-position: 50% 50%;
    -webkit-mask-image: linear-gradient(180deg, #000 82%, transparent); mask-image: linear-gradient(180deg, #000 82%, transparent); }
  .hist-cena .h-img { animation-name: none !important; }
  .hist-cena.on .h-img { animation: hist-pan-cel 16s ease-in-out infinite alternate both !important; }
  .hist-cena.on .h-img.fixo { animation: none !important; }
  .hist-texto { min-height: 6.2em; }
  .hist-tag { font-size: 13px; }
}
@keyframes hist-pan-cel { from { object-position: 12% 50%; } to { object-position: 88% 50%; } }
@media (prefers-reduced-motion: reduce) {
  .hist-cena .h-img, .hist-cena.on .h-img { animation: none !important; }
  .hist-dica.on, .hist-final .bola, .hist-carregando .bola { animation: none; }
}
`;
  document.head.append(st);
}

function historiaCarrega(src, ms) {
  return new Promise(res => {
    const im = new Image(); let feito = false;
    const fim = ok => { if (feito) return; feito = true; res(ok ? im : null); };
    im.onload = () => fim(true); im.onerror = () => fim(false);
    setTimeout(() => fim(im.complete && im.naturalWidth > 0), ms);
    im.src = src;
  });
}

// Toca uma sequência de cenas (def = um item de CAPITULOS). Motor comum a prólogo e capítulos.
function tocaCenas(def, nome, aoTerminar, idCap) {
  if (HIST) return false; // já há uma cutscene aberta
  historiaCss();
  nome = (nome || '').toString().replace(/[<>]/g, '').trim() || null;
  const cenas = def.cenas, fin = def.final || {};
  const dir = (typeof ASSET_DIR !== 'undefined' ? ASSET_DIR : 'a/');
  const semMov = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tocar = t => { try { if (typeof som === 'function' && (typeof G === 'undefined' || G.somOn)) som(t); } catch { } };

  const raiz = document.createElement('div');
  raiz.className = 'hist' + (idCap ? ' ' + idCap : ''); raiz.id = 'historia';
  raiz.setAttribute('role', 'dialog'); raiz.setAttribute('aria-modal', 'true'); raiz.setAttribute('aria-label', `${def.rotulo}: ${def.titulo}`);
  raiz.innerHTML = `
    <div class="hist-palco"></div>
    <div class="hist-vinheta"></div>
    <div class="hist-tag"></div>
    <div class="hist-carregando"><span class="bola">⚽</span><span>Carregando a história...</span></div>
    <button type="button" class="btn mini hist-pular" title="Pular (Esc)">Pular história ⏭</button>
    <div class="hist-legenda madeira" hidden>
      <p class="hist-texto" aria-live="polite"></p>
      <div class="hist-rodape"><div class="hist-dots"></div><span class="hist-dica">Toque ou Espaço ▸</span></div>
    </div>
    <div class="hist-final"><div class="caixa madeira">
      <span class="bola"></span><p class="rot"></p><h1></h1><p class="sub"></p><div class="creditos" hidden></div>
      <button type="button" class="btn amarelo grande hist-bora"></button>
    </div></div>`;
  const q = s => raiz.querySelector(s);
  const palco = q('.hist-palco'), legenda = q('.hist-legenda'), texto = q('.hist-texto'), dots = q('.hist-dots'), dica = q('.hist-dica'), final = q('.hist-final');
  if (def.semTag) q('.hist-tag').remove();
  else { const tg = q('.hist-tag'); const b = document.createElement('b'); b.textContent = def.rotulo; tg.append(b, ' · ' + def.titulo); }
  q('.hist-final .bola').textContent = fin.emoji || '⚽';
  if (def.semTag) q('.hist-final .rot').remove(); else q('.hist-final .rot').textContent = def.rotulo;
  q('.hist-final h1').textContent = fin.titulo || def.titulo;
  q('.hist-final p.sub').textContent = fin.sub ? fin.sub(nome) : '';
  q('.hist-bora').textContent = fin.botao || 'Continuar ⚽';
  if (fin.creditos && fin.creditos.length) {
    const cr = q('.creditos'); cr.hidden = false;
    fin.creditos.forEach((t, k) => { const sp = document.createElement('span'); sp.textContent = t; sp.style.animationDelay = (0.8 + k * 0.7) + 's'; cr.append(sp); });
  }
  cenas.forEach(() => dots.append(document.createElement('i')));

  const st = HIST = { id: idCap || 'intro', i: -1, digitando: false, trocando: false, timer: null, pronta: false, noFinal: false, fechou: false, camadas: [] };

  function limpaTimer() { if (st.timer) { clearInterval(st.timer); st.timer = null; } }

  function escreve(s) {
    limpaTimer(); texto.textContent = ''; dica.classList.remove('on'); st.alvo = s;
    if (semMov) { texto.textContent = s; st.digitando = false; dica.classList.add('on'); return; }
    const txt = document.createTextNode(''); const cur = document.createElement('span'); cur.className = 'cur'; cur.textContent = '▌';
    texto.append(txt, cur);
    let k = 0; st.digitando = true;
    st.timer = setInterval(() => {
      k += (s[k] === ' ' ? 2 : 1);
      txt.data = s.slice(0, k);
      if (k >= s.length) completa();
    }, 30);
  }
  function completa() {
    limpaTimer(); st.digitando = false;
    if (st.alvo != null) texto.textContent = st.alvo;
    dica.classList.add('on');
  }

  function cena(i) {
    const c = cenas[i]; const antes = st.camadas.slice();
    const lay = document.createElement('div'); lay.className = 'hist-cena';
    lay.style.setProperty('--c1', c.cor[0]); lay.style.setProperty('--c2', c.cor[1]);
    const ok = st.imgs && st.imgs[i];
    if (ok) {
      const f = document.createElement('img'); f.className = 'h-fundo'; f.alt = ''; f.src = ok.src; f.setAttribute('aria-hidden', 'true');
      const im = document.createElement('img'); im.className = 'h-img'; im.alt = ''; im.src = ok.src; im.draggable = false;
      im.style.animationName = semMov ? 'none' : c.kb;
      if (c.foco) { im.style.transformOrigin = c.foco; im.style.objectPosition = c.foco; im.classList.add('fixo'); }
      im.onerror = () => lay.classList.add('sem-img');
      lay.append(f, im);
    } else lay.classList.add('sem-img');
    palco.append(lay); st.camadas.push(lay);
    // força o reflow para a transição de opacidade acontecer (cross-fade)
    void lay.offsetWidth; lay.classList.add('on');
    setTimeout(() => { antes.forEach(a => { a.classList.remove('on'); setTimeout(() => { a.remove(); st.camadas = st.camadas.filter(x => x !== a); }, 1200); }); }, 150);
  }

  function vai(i) {
    if (st.fechou) return;
    if (i >= cenas.length) return mostraFinal();
    if (i < 0) return;
    st.i = i;
    [...dots.children].forEach((d, k) => { d.className = k < i ? 'ja' : k === i ? 'agora' : ''; });
    cena(i);
    legenda.classList.add('troca'); limpaTimer(); st.trocando = true; st.digitando = false;
    setTimeout(() => { if (st.fechou || st.i !== i) return; st.trocando = false; legenda.classList.remove('troca'); escreve(cenas[i].txt(nome)); }, i === 0 ? 50 : 380);
    if (cenas[i].som) tocar(cenas[i].som); else if (i > 0) tocar('porta');
  }

  function mostraFinal() {
    if (st.noFinal) return;
    st.noFinal = true; limpaTimer(); legenda.hidden = true;
    final.classList.add('on'); tocar('nivel');
    setTimeout(() => { const b = q('.hist-bora'); if (b && !st.fechou) try { b.focus({ preventScroll: true }); } catch { } }, 300);
  }

  function avanca() {
    if (!st.pronta || st.fechou) return;
    if (st.noFinal) return fecha();
    if (st.trocando) return; // legenda ainda entrando: não pula a cena sem ler
    if (st.digitando) return completa();
    vai(st.i + 1);
  }
  function volta() {
    if (!st.pronta || st.fechou || st.noFinal || st.trocando || st.i <= 0) return;
    vai(st.i - 1);
  }

  function fecha() {
    if (st.fechou) return;
    st.fechou = true; limpaTimer();
    window.removeEventListener('keydown', tecla, true);
    raiz.classList.add('saindo');
    setTimeout(() => raiz.remove(), 600);
    HIST = null;
    try { if (typeof aoTerminar === 'function') aoTerminar(); } catch (e) { console.error(e); }
  }
  st.fecha = fecha;

  function tecla(ev) {
    if (st.fechou) return;
    const k = ev.key;
    if (k === 'Escape') { ev.preventDefault(); ev.stopPropagation(); fecha(); return; }
    if (k === ' ' || k === 'Spacebar' || k === 'Enter' || k === 'ArrowRight' || k === 'PageDown') {
      // Enter/Espaço sobre o botão "Pular" deixam o próprio botão agir
      if (ev.target && ev.target.classList && ev.target.classList.contains('hist-pular')) return;
      ev.preventDefault(); ev.stopPropagation(); if (!ev.repeat) avanca(); return;
    }
    if (k === 'ArrowLeft' || k === 'PageUp') { ev.preventDefault(); ev.stopPropagation(); volta(); return; }
    // não deixa as teclas vazarem para o jogo enquanto a história está aberta
    ev.stopPropagation();
  }

  q('.hist-pular').addEventListener('click', ev => { ev.stopPropagation(); fecha(); });
  q('.hist-bora').addEventListener('click', ev => { ev.stopPropagation(); fecha(); });
  raiz.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('.hist-final .caixa') && !ev.target.closest('.hist-bora')) return; avanca(); });
  window.addEventListener('keydown', tecla, true);

  document.body.append(raiz);
  requestAnimationFrame(() => raiz.classList.add('on'));

  // pré-carrega todas as imagens antes de começar (com limite de tempo)
  const unicas = [...new Set(cenas.map(c => c.img))];
  Promise.all(unicas.map(n => historiaCarrega(dir + n + '.webp', 8000))).then(res => {
    if (st.fechou) return;
    const mapa = {}; unicas.forEach((n, k) => mapa[n] = res[k]);
    st.imgs = cenas.map(c => mapa[c.img]); st.pronta = true;
    const car = q('.hist-carregando'); if (car) car.remove();
    legenda.hidden = false;
    vai(0);
  });
  return true;
}

// Prólogo (novo jogo). Mantida com a mesma assinatura de antes.
function mostraHistoria(nome, aoTerminar) {
  return tocaCenas(CAPITULOS.intro, nome, aoTerminar, null);
}

function capLerSave() {
  try { if (typeof lerSave === 'function') return lerSave(); } catch { }
  try { return JSON.parse(localStorage.getItem(typeof SAVE_KEY !== 'undefined' ? SAVE_KEY : 'rac_save_v2') || 'null'); } catch { return null; }
}

function mostraCapitulo(id, aoTerminar, nome) {
  const def = CAPITULOS[id]; if (!def) { if (typeof aoTerminar === 'function') aoTerminar(); return false; }
  if (nome === undefined) { const s = (typeof G !== 'undefined' && G.save) || capLerSave(); nome = s ? s.nome : null; }
  return tocaCenas(def, nome, aoTerminar, id === 'intro' ? null : id);
}

/* ---------- gatilhos durante o jogo ---------- */
let CAP_T0 = 0;
function verificaCapitulos() {
  if (typeof G === 'undefined') return;
  // enquanto um capítulo toca por cima do jogo, mantém o jogo pausado (mesmo que algum modal feche por baixo)
  if (HIST) { if (HIST.noJogo) G.pausado = true; return; }
  if (!G.rodando || !G.save || !G.mapa) { CAP_T0 = 0; return; }
  if (!CAP_T0) { CAP_T0 = Date.now(); return; }
  if (Date.now() - CAP_T0 < 2500) return; // deixa o mapa carregar e o banner de boas-vindas aparecer
  if (G.pausado) return;
  const modal = document.getElementById('modal'); if (modal && !modal.hidden) return;
  const app = document.getElementById('app'); if (app && app.hidden) return;
  const s = G.save; s.flags = s.flags || {};
  const ids = CAPITULOS_ORDEM.filter(id => CAPITULOS[id].cond);
  const vale = id => { try { return !!CAPITULOS[id].cond(s, G.mapa.id); } catch { return false; } };
  // escolhe o capítulo MAIS AVANÇADO que já vale e ainda não foi visto (nunca mais de um por vez)
  let esc = null;
  ids.forEach(id => { if (!s.flags['cena_' + id] && vale(id)) esc = id; });
  if (!esc) return;
  // os anteriores que também já valem (ou que o escolhido implica) ficam marcados em silêncio
  const idx = ids.indexOf(esc); const impl = CAPITULOS[esc].implica || [];
  ids.forEach((id, k) => { if (k < idx && !s.flags['cena_' + id] && (vale(id) || impl.includes(id))) s.flags['cena_' + id] = true; });
  s.flags['cena_' + esc] = true;
  try { if (typeof salvar === 'function') salvar(); } catch { }
  G.pausado = true; if (G.teclas && G.teclas.clear) G.teclas.clear();
  const ok = mostraCapitulo(esc, () => {
    const m = document.getElementById('modal');
    if (!m || m.hidden) G.pausado = false;
    if (G.teclas && G.teclas.clear) G.teclas.clear(); G.uiSujo = true;
  }, s.nome);
  if (ok && HIST) HIST.noJogo = true; else if (!ok) G.pausado = false;
}
if (typeof window !== 'undefined') setInterval(verificaCapitulos, 1500);

/* ---------- menu "História e capítulos" (tela inicial) ---------- */
function abreMenuCapitulos() {
  const s = capLerSave(); const fl = (s && s.flags) || {}; const nome = s ? s.nome : null;
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  historiaCss();
  const lista = mk('div', 'cap-lista');
  CAPITULOS_ORDEM.forEach(id => {
    const c = CAPITULOS[id]; const livre = id === 'intro' || !!fl['cena_' + id];
    const b = mk('button', 'cap-item'); b.type = 'button';
    const meio = mk('div');
    meio.append(mk('small', null, c.rotulo), mk('b', null, livre ? c.titulo : '???'));
    if (!livre) meio.append(mk('small', 'dc', 'Continue jogando para desbloquear'));
    b.append(mk('span', 'ce', livre ? (c.emoji || (c.final && c.final.emoji) || '⚽') : '🔒'), meio);
    if (livre) b.append(mk('span', 'play', '▶'));
    b.disabled = !livre;
    b.onclick = () => { if (typeof fechaModal === 'function') fechaModal(); mostraCapitulo(id, () => { }, nome); };
    lista.append(b);
  });
  const tit = mk('h2', null, '📖 História e capítulos');
  const txt = mk('p', null, s ? `Reveja os momentos da jornada de ${s.nome}. Novos capítulos aparecem conforme você avança no jogo.` : 'Comece um jogo para desbloquear novos capítulos da história!');
  if (typeof abreModal === 'function') abreModal(tit, txt, lista);
  else mostraHistoria(nome, () => { });
}
