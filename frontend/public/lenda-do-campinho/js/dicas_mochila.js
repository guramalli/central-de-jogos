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
    ? 'Tudo o que você ganha vai para a sua 🎒 Mochila. Toque no botão 🎒 para ver o que tem lá.'
    : 'Tudo o que você ganha vai para a sua 🎒 Mochila (o quadro "Mochilas"; a tecla I mostra ela).',
  bolsa: () => dmcCel()
    ? 'Você ganhou uma bolsa! Toque nela e escolha "📂 Abrir" para ver o que tem dentro. Quando a mochila das costas enche, os itens novos entram sozinhos na bolsa.'
    : 'Você ganhou uma bolsa! Clique com o botão DIREITO nela para abrir. Para guardar coisas dentro, arraste os itens para cima da bolsa.',
  peso: () => `Sua mochila está ficando pesada! O ⚖️ Cap é quanto peso você aguenta. Se passar, você não consegue pegar mais nada. Venda o loot nas lojas (💰 Vender todo o loot), guarde coisas no armazém ou use uma mochila maior.`,
  cheia: () => 'Sua mochila das costas encheu! Ponha uma bolsa dentro dela: o que não couber vai para a bolsa. Ou venda o loot nas lojas (💰 Vender todo o loot).',
  abertas: () => dmcCel()
    ? 'As bolsas abertas aparecem uma embaixo da outra, dentro da 🎒 Mochila. Toque em ✕ para fechar uma bolsa.'
    : 'Suas bolsas abertas ficam no quadro "🎒 Bolsas abertas". Use – para minimizar, ✕ para fechar e arraste o título para mudar a ordem.',
  olhar: () => dmcCel()
    ? 'Quer saber o que um item faz? Toque nele na mochila: a janela do item explica tudo.'
    : 'Quer saber o que um item faz? Segure SHIFT e clique nele: a descrição aparece no chat. Um clique normal abre a janela do item.',
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
