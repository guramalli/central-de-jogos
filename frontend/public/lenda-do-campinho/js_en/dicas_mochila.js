/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎒 DICAS DA MOCHILA (v407, Raio-X — no lugar do D1 "modo simples"; decisão do dono: a mochila continua no estilo
   clássico para todos, e o jogo ENSINA a mochila com dicas, cada uma UMA vez, na hora em que a situação acontece):
   1. primeiro item ganho → onde ficam os itens;   2. primeira bolsa → abrir e guardar coisas dentro;
   3. peso passou de 80% do Cap → o que é o peso e o que fazer;   4. mochila das costas cheia → bolsa de dentro / vender;
   5. duas ou mais bolsas abertas → o quadro "Bolsas abertas";   6. já tem alguns itens → ver o que um item é.
   Texto de celular (toque) e de computador (clique/teclas). Entram pela fila de dicas do revela_nivel.js (no máximo
   1 a cada ~30 s, nunca junto de faixa). Ficam marcadas em save.dicas como as outras dicas.
   Só para quem está aprendendo: personagem novo (rvNovato) ou abaixo do nível 20 — os veteranos não recebem.
   Prefixo: dmc. Carregar DEPOIS de revela_nivel.js e mochila_tibia.js.
   ============================================================ */
const dmcCel = () => (typeof CEL !== 'undefined' && CEL) || document.body.classList.contains('modo-celular');
const dmcOnde = () => dmcCel() ? '#chMochila' : '[data-painel="bolsas"], [data-aba=mochila]';
const dmcAprendendo = (s = G.save) => !!s && (!!s.rvNovato || (s.nivel || 1) < 20);
const DMC_DICAS = {
  item: () => dmcCel()
    ? 'Everything you get goes into your 🎒 Backpack. Tap the 🎒 button to see what\'s inside.'
    : 'Everything you get goes into your 🎒 Backpack (the "Backpacks" panel; the I key shows it).',
  bolsa: () => dmcCel()
    ? 'You got a bag! Tap it and choose "📂 Open" to see what\'s inside. When the backpack on your back is full, new items go into the bag on their own.'
    : 'You got a bag! RIGHT-click it to open it. To put things inside, drag items onto the bag.',
  peso: () => `Your backpack is getting heavy! ⚖️ Cap is how much weight you can carry. If you go over it, you can't pick up anything else. Sell your loot at the shops (💰 Sell all loot), put things in storage or use a bigger backpack.`,
  cheia: () => 'The backpack on your back is full! Put a bag inside it: whatever doesn\'t fit goes into the bag. Or sell your loot at the shops (💰 Sell all loot).',
  abertas: () => dmcCel()
    ? 'Open bags show up one below the other, inside the 🎒 Backpack. Tap ✕ to close a bag.'
    : 'Your open bags are in the "🎒 Open bags" panel. Use – to minimize, ✕ to close, and drag the title to change the order.',
  olhar: () => dmcCel()
    ? 'Want to know what an item does? Tap it in your backpack: the item window explains everything.'
    : 'Want to know what an item does? Hold SHIFT and click it: the description shows up in the chat. A normal click opens the item window.',
};
function dmcConfere() {
  const s = G.save; if (!s || !G.rodando || !Array.isArray(s.mochila) || !dmcAprendendo(s)) return;
  const d = s.dicas || {}, dica1 = (k, destaque) => { if (!d['mch_' + k]) dica('mch_' + k, DMC_DICAS[k](), destaque); };
  const M = s.mochila;
  // 1. primeiro item (além das águas do começo)
  if (M.some(e => e && e.id !== 'agua')) dica1('item', dmcOnde());
  // 2. primeira bolsa (sem contar a mochila das costas)
  if (typeof ehBolsa === 'function' && M.some(e => e && ehBolsa(e.id))) dica1('bolsa', dmcOnde());
  // 3. peso acima de 80% do Cap
  try { if (pesoMochila(s) > capPeso(s) * 0.8) dica1('peso', '#mtStatus'); } catch (e) { }
  // 4. mochila das costas cheia
  try { if (typeof espacosLivres === 'function' && espacosLivres(null, s) <= 0) dica1('cheia', dmcOnde()); } catch (e) { }
  // 5. duas ou mais bolsas abertas
  if ((s.bolsasAbertas || []).filter(u => M.some(e => e.u === u)).length >= 2) dica1('abertas', dmcCel() ? '#chMochila' : '[data-painel="bolsas"]');
  // 6. já tem alguns itens diferentes: como ver o que um item é
  if (new Set(M.map(e => e && e.id)).size >= 4) dica1('olhar', dmcOnde());
}
setInterval(() => { try { dmcConfere(); } catch (e) { } }, 1500);
