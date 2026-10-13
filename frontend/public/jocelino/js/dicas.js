// Jocelino — dicas.js — a dica chega quando o problema aparece (13/10, o princípio do Stardew: a carta da Evelyn avisa da
// virada da estação 13 dias antes, a TV fala da mochila quando ela começa a apertar, a chuva ensina sozinha). Cada dica uma
// vez só, na hora: a energia baixa, a primeira chuva, a mochila cheia e, três dias antes da primeira virada, a carta do Tio Juca.
CARTAS.juca_estacao = { de: 'Tio Juca', dia: 1e9,
  texto: 'Jocelino, daqui a três dias a estação vira. O que tá plantado e não é da estação nova seca de uma noite pra outra: colhe antes o que der. Semente da estação nova o Ananias já tem na aba Sementes. Seu tio, Juca.' };
INICIADORES.push(s => { G.dicasDadas = (s.dicasDadas || []).slice(); });
COLETORES.push(s => { s.dicasDadas = G.dicasDadas.slice(); });
const _dica = id => { if (!G.dicasDadas || G.dicasDadas.includes(id)) return false; G.dicasDadas.push(id); return true; };
const _temComida = () => G.mochila && G.mochila.slots.some(s => s && Itens.energia(s.id) > 0);
let _dicaT = 0;
ATUALIZADORES.push(dt => {
  if (!G.comecou || !G.mochila || !G.dicasDadas) return;
  _dicaT += dt || 0; if (_dicaT < 0.1) return; _dicaT = 0;
  if (G.energia < G.energiaMax * 0.25 && _dica('energia'))
    avisar(_temComida() ? 'A Rosa grita da janela: "Come alguma coisa, homem!" (botão direito na comida da barra: a marmita dá energia)' : 'O corpo pediu arrego: hoje dorme cedo, que amanhã a energia volta cheia.');
  if (typeof Clima !== 'undefined' && Clima.chove(G.dia) && _dica('chuva'))
    avisar('Chuva! A horta já amanhece regada e a obra do Bira não abre. Bom dia para pescar (peixe raro com chuva) ou visitar a Vila.');
  if (G.mochila.slots.length && G.mochila.slots.every(Boolean) && _dica('mochila'))
    avisar('Mochila cheia! O que sobra vai para a caixa de venda do quintal (o carroceiro leva de madrugada) ou para um baú.');
});
// Três dias antes da primeira virada da estação: a carta do Tio Juca (como a da Evelyn no Stardew).
MANHA.push(() => { if (G.correio && (G.dia - 1) % 28 === 24 && _dica('estacao')) G.correio.caixa.push('juca_estacao'); });
