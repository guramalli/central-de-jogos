/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ENTRADA — quem abre o jogo pela primeira vez (sem jogador salvo, sem
   login no site e sem ter visto a vitrine) vai pra vitrine (/lenda/), que
   mostra o jogo antes. Quem já joga entra direto, como sempre.
   Carregado no <head>, antes de tudo (não pisca a tela do jogo).
   Nunca redireciona fora do site (versão Steam, app do Windows, servidores
   locais da bateria de testes e do gravador de trailer, que servem só a pasta
   do jogo) nem com parâmetros na URL (?jogar vem da vitrine; os outros, de
   dentro do site). Pra testar localmente: localStorage.lenda_vitrine_teste = '1'.
   Qualquer erro (armazenamento bloqueado...) = fica no jogo.
   ============================================================ */
(function (w) {
  'use strict';
  try {
    if (w.LENDA_APP) return; // app do Windows: quem abriu já tem o jogo
    if (w.LENDA_IDIOMA_SAINDO) return; // 06/10/2026: js/idioma.js já está mandando para a página do outro idioma
    var l = w.location;
    if (!/^https?:$/.test(l.protocol)) return;
    var ls = w.localStorage;
    var site = /^(www\.)?educacaogamer\.com\.br$/.test(l.hostname);
    var testeLocal = /^(localhost|127\.0\.0\.1)$/.test(l.hostname) && ls.getItem('lenda_vitrine_teste') === '1';
    if (!site && !testeLocal) return;
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
