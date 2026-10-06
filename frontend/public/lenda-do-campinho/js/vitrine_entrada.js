/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ENTRADA — quem abre o jogo pela primeira vez (sem jogador salvo, sem
   login no site e sem ter visto a vitrine) vai pra vitrine (/lenda/), que
   mostra o jogo antes. Quem já joga entra direto, como sempre.
   Carregado no <head>, antes de tudo (não pisca a tela do jogo).
   Nunca redireciona fora do site (versão Steam, arquivo local) nem com
   parâmetros na URL (?jogar vem da vitrine; os outros, de dentro do site).
   Qualquer erro (armazenamento bloqueado...) = fica no jogo.
   ============================================================ */
(function (w) {
  'use strict';
  try {
    var l = w.location;
    var naWeb = /^https?:$/.test(l.protocol) && /^(www\.)?educacaogamer\.com\.br$|^localhost$|^127\.0\.0\.1$/.test(l.hostname);
    if (!naWeb) return;
    var ls = w.localStorage;
    if (l.search) {
      if (/[?&]jogar(=|&|$)/.test(l.search)) ls.setItem('lenda_vitrine_vista', '1');
      return;
    }
    if (ls.getItem('lenda_vitrine_vista') || ls.getItem('eg_token') || ls.getItem('rac_save_v2') || ls.getItem('rac_save_v1')) return;
    for (var i = 0; i < ls.length; i++) {
      var k = ls.key(i);
      if (k && k.indexOf('rac_save_conta_') === 0) return;
    }
    l.replace('/lenda/');
  } catch (e) { /* fica no jogo */ }
})(window);
