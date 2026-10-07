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
const _hn = n => n || 'you';
const _hN = n => n || 'You';

const HISTORIA_CENAS = [
  { img: 'historia_1', kb: 'kb-a', cor: ['#f7b35a', '#3aa0c8'],
    txt: n => 'In a little seaside village, where the day starts with the smell of cheese bread and the sound of waves, lies Campinho Village. And right in the middle of it... a little dirt pitch.' },
  { img: 'historia_2', kb: 'kb-b', cor: ['#c89a5a', '#6a4a2a'],
    txt: n => 'Many years ago, the village team was the pride of the region. A skinny kid named Zé used to work magic on that little pitch!' },
  { img: 'historia_3', kb: 'kb-c', cor: ['#b07ac8', '#e88a4a'],
    txt: n => 'But time went by. The kids grew up and moved away... and the little pitch went quiet, taken over by weeds and cheeky pigeons.' },
  { img: 'historia_4', kb: 'kb-d', cor: ['#f0c060', '#5ab85a'],
    txt: n => `Until one day a new star was born there: ${_hn(n)}! And your very first leather ball was already waiting in the chest in the yard.` },
  { img: 'historia_5', kb: 'kb-a', cor: ['#ff9a5a', '#c8508a'],
    txt: n => `Old Seu Zé, now a coach, saw the sparkle in your eyes and made a promise: “Train with me${n ? ', ' + n : ''}, and this little pitch will come back to life. And who knows... one day, even the big Stadium!”` },
  { img: 'historia_6', kb: 'kb-e', cor: ['#5ac8ff', '#4fc26a'],
    txt: n => 'The road is long: the Beach, the City, the Training Center and the Stadium, home of The Wall, the goalkeeper who never let in a goal. In every corner, a rival will challenge you to a dribbling duel. Whoever loses just gets tired!' },
  { img: 'historia_7', kb: 'kb-b', cor: ['#2b1b5e', '#f0a81a'],
    txt: n => 'And when you grow up, you’ll found your own club, climb from the Várzea (the sandlot league) all the way to Série A... and travel the world, from Cairo to London, on the road to the Club World Cup!' },
];

// v233: ordem do mundo pela relevância do futebol — Cairo, Doha, Tóquio, Miami, Buenos Aires, Rio → Europa → Copa no Rio
const CAP_MAPAS_MUNDO = ['cairo', 'toquio', 'doha', 'miami', 'buenos', 'rio'];
const CAP_MAPAS_EUROPA = ['lisboa', 'paris', 'madri', 'milao', 'munique', 'londres'];
const CAP_MAPAS_FINAL = ['arena_copa'];

// Ordem da história (e da checagem). cond(save, idDoMapa) → true quando o momento chegou.
// implica: capítulos anteriores que ficam "vistos" junto (ex.: quem chegou à Europa já viajou o mundo).
const CAPITULOS = {
  intro: {
    rotulo: 'Prologue', titulo: 'Campinho Village', semTag: true,
    cenas: HISTORIA_CENAS,
    final: { emoji: '⚽', titulo: 'Lenda do Campinho', sub: n => 'Every legend starts with the first touch of the ball.' + (n ? ` Let's go, ${n}!` : ' Ready to go?'), botao: 'Let\'s play! ⚽' },
  },
  adulto: {
    rotulo: 'Chapter 1', titulo: 'All Grown Up', emoji: '📝',
    cond: s => s.nivel >= (typeof NIVEL_TIME !== 'undefined' ? NIVEL_TIME : 25),
    cenas: [
      { img: 'cap_adulto_1', kb: 'kb-a', cor: ['#f0c060', '#7a4aff'],
        txt: n => 'Time flew by! That kid from the little pitch is all grown up. And one day, Rodrigues the Agent knocked on the door with a big idea...' },
      { img: 'cap_adulto_1', kb: 'kb-zoom', foco: '70% 45%', cor: ['#f0c060', '#7a4aff'],
        txt: n => `“How about starting your OWN club?” Mom almost fell off her chair with joy. And ${_hn(n)} signed the papers right away!` },
      { img: 'cap_adulto_2', kb: 'kb-c', cor: ['#7a4aff', '#f0c030'],
        txt: n => 'A team with that Vila spirit: starting way down in the Várzea and climbing division by division, always playing fair. On to Série A!' },
    ],
    final: { emoji: '📝', titulo: 'All Grown Up', sub: n => 'End of Chapter 1. Open “My Team” to start your club!', botao: 'Continue ⚽' },
  },
  paredao: {
    rotulo: 'Chapter 2', titulo: 'The Little Pitch Is Reborn', emoji: '🧤',
    cond: s => !!(s.flags.venceu_paredao || s.flags.craque),
    cenas: [
      { img: 'cap_paredao_1', kb: 'kb-b', cor: ['#5ac8ff', '#7a2ad9'], som: 'gol',
        txt: n => `Remember The Wall, the goalkeeper who had never let in a goal? Well... now he has! ${_hN(n)} shot into the corner, and the ball kissed the net.` },
      { img: 'cap_paredao_1', kb: 'kb-zoom', foco: '72% 45%', cor: ['#5ac8ff', '#7a2ad9'],
        txt: n => 'The tired giant broke into a huge smile and clapped: “I\'ve never seen anything like it. You\'re a real star!”' },
      { img: 'cap_paredao_2', kb: 'kb-a', cor: ['#ff9a5a', '#4fc26a'],
        txt: n => `Back in the village, a surprise: the little pitch was packed with kids again! Everyone wanted to play just like ${_hn(n)}.` },
      { img: 'cap_paredao_2', kb: 'kb-zoom', foco: '28% 45%', cor: ['#ff9a5a', '#4fc26a'],
        txt: n => 'Seu Zé wiped away a tear: “Promise kept, champ. The little pitch is alive again!” But your story... was only just beginning.' },
    ],
    final: { emoji: '🧤', titulo: 'The Little Pitch Is Reborn', sub: n => 'End of Chapter 2. Brazil got too small... and the world is calling!', botao: 'Continue ⚽' },
  },
  mundo: {
    rotulo: 'Chapter 3', titulo: 'Wings Around the World', emoji: '✈️',
    cond: (s, mapa) => CAP_MAPAS_MUNDO.includes(mapa),
    cenas: [
      { img: 'cap_mundo_1', kb: 'kb-a', cor: ['#5ac8ff', '#f0c060'],
        txt: n => `The day came to cross the ocean. At the airport, Mom held back her tears, and Seu Zé waved his cap: “Keep the Village in your heart${n ? ', ' + n : ''}!”` },
      { img: 'cap_mundo_1', kb: 'kb-zoom', foco: '72% 50%', cor: ['#5ac8ff', '#f0c060'],
        txt: n => 'In the backpack, next to the cleats, went the old leather ball. After all, it deserved to see the world too!' },
      { img: 'cap_mundo_2', kb: 'kb-e', cor: ['#f7b35a', '#3aa0c8'],
        txt: n => 'Pyramids, golden dunes, neon lights, sunny beaches, the tango of Buenos Aires and the samba of Rio: every city loves soccer in its own way. And in every one of them, there are people who want to play with you.' },
    ],
    final: { emoji: '✈️', titulo: 'Wings Around the World', sub: n => 'End of Chapter 3. Make friends, respect your rivals and show the world how the Village plays!', botao: 'Continue ⚽' },
  },
  europa: {
    rotulo: 'Chapter 4', titulo: 'The Old Continent', emoji: '🏰', implica: ['mundo'],
    cond: (s, mapa) => CAP_MAPAS_EUROPA.includes(mapa),
    cenas: [
      { img: 'cap_europa_1', kb: 'kb-c', cor: ['#e88a4a', '#5a3a8a'],
        txt: n => 'The Old Continent! Cobblestone streets, little trams, cozy cafés... and stadiums older than many castles.' },
      { img: 'cap_europa_2', kb: 'kb-a', cor: ['#1a2a5a', '#7a4aff'],
        txt: n => `This is home to the strongest rivals you've ever faced. But ${_hn(n)} learned it back on the little pitch: respect, courage and keep the ball on the ground.` },
      { img: 'historia_1', kb: 'kb-d', cor: ['#f7b35a', '#3aa0c8'],
        txt: n => 'On the other side of the ocean, all of Campinho Village stops to watch your games. And Seu Zé always reminds everyone: “Cheering is a party, not a fight!”' },
    ],
    final: { emoji: '🏰', titulo: 'The Old Continent', sub: n => 'End of Chapter 4. At the end of the road, the Club World Cup is waiting for you...', botao: 'Continue ⚽' },
  },
  retorno: {
    rotulo: 'Chapter 5', titulo: 'On the Way to the Cup', emoji: '🌎', implica: ['mundo', 'europa'],
    cond: (s, mapa) => CAP_MAPAS_FINAL.includes(mapa) || (mapa === 'rio' && (!!s.flags.lenda_mundial || (s.nivel || 1) >= 186)),
    cenas: [
      { img: 'cap_copa_1', kb: 'kb-a', cor: ['#f7b35a', '#1a9a3a'],
        txt: n => `The news spread around the planet: the next World Cup will be in South America! And ${_hn(n)} got called up to the national team.` },
      { img: 'cap_copa_1', kb: 'kb-zoom', foco: '40% 60%', cor: ['#f7b35a', '#1a9a3a'],
        txt: n => 'After traveling the whole world, it\'s time to go back home. The big final will be in Rio de Janeiro, and the strongest stars on the planet are arriving.' },
      { img: 'historia_1', kb: 'kb-d', cor: ['#f7b35a', '#3aa0c8'],
        txt: n => 'Back in Campinho Village, the kids painted the wall green and yellow. Seu Zé fixed his cap: “Go out there and play like you do on the little pitch. With joy!”' },
    ],
    final: { emoji: '🌎', titulo: 'On the Way to the Cup', sub: n => 'End of Chapter 5. At level 190, the Cup Arena in Rio opens its doors for the big final.', botao: 'Continue ⚽' },
  },
  copa: {
    rotulo: 'Chapter 6', titulo: 'The World Cup', emoji: '🏆', implica: ['mundo', 'europa', 'retorno'],
    cond: s => !!s.flags.campeao_copa,
    cenas: [
      { img: 'cap_copa_2', kb: 'kb-b', cor: ['#140a40', '#2ad96a'],
        txt: n => 'The big World Cup final. A giant stadium, fireworks in the sky, and the whole world holding its breath.' },
      { img: 'cap_copa_3', kb: 'kb-e', cor: ['#1a1450', '#f8d838'], som: 'gol',
        txt: n => `Last minute. The ball goes up, a bicycle kick from ${_hn(n)}... and GOOOOAL! The stadium explodes with joy!` },
      { img: 'cap_copa_4', kb: 'kb-c', cor: ['#f8d838', '#1a9a3a'],
        txt: n => `In the stands, Mom and Seu Zé were hugging and crying. The kid from the little dirt pitch lifted the most famous trophy on the planet.` },
      { img: 'cap_gloria_4', kb: 'kb-d', cor: ['#140a40', '#3a2780'],
        txt: n => 'And back in the Village, a child picks up a leather ball, looks up at the starry sky and dreams. Because every legend starts on a little pitch.' },
      { img: 'cap_gloria_4', kb: 'kb-zoom', foco: '50% 25%', cor: ['#140a40', '#3a2780'],
        txt: n => 'But Seu Zé has a strange story to tell: they say there are fields at the bottom of the sea, up above the clouds... and even on the Moon. Could it be true?' },
    ],
    // v244: o jogo NÃO acaba aqui (antes dizia "novos mundos nas próximas atualizações" e mostrava créditos) — já existem Atlântida e o Espaço
    final: { emoji: '🏆', titulo: 'World Champion!', sub: n => `Congratulations${n ? ', ' + n : ''}! You won the World Cup. But the story goes on: Captain Iara is waiting with the submarine on the beach in Rio (from level ${typeof ATL_NIVEL !== 'undefined' ? ATL_NIVEL : 195}) to take you to ATLANTIS. And after that... outer space!`,
      botao: 'On to Atlantis! 🌊' },
  },
  gloria: {
    rotulo: 'Bonus chapter', titulo: 'The Champion Club', emoji: '👑', implica: ['adulto', 'paredao', 'mundo', 'europa'], // v407 (Raio-X R12): era 'Epílogo · Glória Eterna' e aparecia antes de Atlântida
    cond: s => !!s.flags.campeao_pais_mundo,
    cenas: [
      { img: 'cap_gloria_1', kb: 'kb-b', cor: ['#1a1450', '#7a4aff'],
        txt: n => `The big Club World Cup final. A giant stadium, the whole world watching... and the ball at the feet of ${_hn(n)}.` },
      { img: 'historia_7', kb: 'kb-a', cor: ['#2b1b5e', '#f0a81a'], som: 'gol',
        txt: n => 'GOOOOAL! The club that was born in the Sandlot League is now WORLD CHAMPION! The golden trophy shone brighter than the fireworks.' },
      { img: 'cap_gloria_2', kb: 'kb-c', cor: ['#f7b35a', '#7a4aff'],
        txt: n => 'Back in Campinho Village, the party filled the streets. And who got there first for a hug? Mom, of course.' },
      { img: 'cap_gloria_3', kb: 'kb-e', cor: ['#ff9a5a', '#4fc26a'],
        txt: n => 'The little pitch got new grass, a colorful mural... and a statue of a kid with a leather ball. Guess who it is?' },
      { img: 'cap_gloria_3', kb: 'kb-zoom', foco: '25% 70%', cor: ['#ff9a5a', '#4fc26a'],
        txt: n => 'On the old wooden bench, Seu Zé smiled: “I promised this little pitch would come back to life. You did so much more: you made the whole village dream.”' },
      { img: 'cap_gloria_4', kb: 'kb-d', cor: ['#140a40', '#3a2780'],
        txt: n => `And on a starry night, a child picks up the ball, looks at the sky and dreams... just like ${_hn(n)}, back at the very beginning. Because a legend never ends: it inspires.` },
    ],
    final: { emoji: '👑', titulo: 'Eternal Glory', sub: n => `Congratulations${n ? ', ' + n : ''}! From the little dirt pitch to the top of the world.`,
      creditos: ['Lenda do Campinho', 'A story by educacaogamer.com.br', 'Thanks for playing!'], botao: 'The legend continues... ⚽' },
  },
};
const CAPITULOS_ORDEM = ['intro', 'adulto', 'paredao', 'mundo', 'europa', 'retorno', 'copa', 'gloria'];

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
    <div class="hist-carregando"><span class="bola">⚽</span><span>Loading the story...</span></div>
    <button type="button" class="btn mini hist-pular" title="Skip (Esc)">Skip story ⏭</button>
    <div class="hist-legenda madeira" hidden>
      <p class="hist-texto" aria-live="polite"></p>
      <div class="hist-rodape"><div class="hist-dots"></div><span class="hist-dica">Tap or Space ▸</span></div>
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
  q('.hist-bora').textContent = fin.botao || 'Continue ⚽';
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
    if (!livre) meio.append(mk('small', 'dc', 'Keep playing to unlock'));
    b.append(mk('span', 'ce', livre ? (c.emoji || (c.final && c.final.emoji) || '⚽') : '🔒'), meio);
    if (livre) b.append(mk('span', 'play', '▶'));
    b.disabled = !livre;
    b.onclick = () => { if (typeof fechaModal === 'function') fechaModal(); mostraCapitulo(id, () => { }, nome); };
    lista.append(b);
  });
  const tit = mk('h2', null, '📖 Story and chapters');
  const txt = mk('p', null, s ? `Look back at the moments of ${s.nome}'s journey. New chapters appear as you progress in the game.` : 'Start a game to unlock new chapters of the story!');
  if (typeof abreModal === 'function') abreModal(tit, txt, lista);
  else mostraHistoria(nome, () => { });
}
