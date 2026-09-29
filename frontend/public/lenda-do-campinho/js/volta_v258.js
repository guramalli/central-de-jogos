/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   v264: o jogo VOLTOU para a v258 (o dono desfez as mudanças de classes/estilo das v259–v263).
   Quem jogou naquelas versões pode ter no save jogadas de OUTRAS classes (a v262 dava todas para
   todo mundo) e a posição "Volante" (não existe na v258). Aqui só limpamos isso ao carregar.
   (Jogadas que não existem mais já são tiradas pelo próprio jogo.)
   ============================================================ */
{
  const _iniVolta = iniciarJogo;
  iniciarJogo = async function (save) {
    try {
      if (save && save.classe && Array.isArray(save.dribles)) {
        const outra = id => DRIBLES[id] && DRIBLES[id].classe && DRIBLES[id].classe !== save.classe;
        save.dribles = save.dribles.filter(id => !outra(id));
        if (Array.isArray(save.hotbar)) save.hotbar = save.hotbar.map(h => h && h.t === 'd' && outra(h.id) ? null : h);
      }
      if (save && save.posicao && !POSICOES[save.posicao]) save.posicao = typeof posicaoDaClasse === 'function' ? posicaoDaClasse(save.classe) : 'meia';
      if (save) delete save.estiloCompleto;
    } catch (e) { }
    return _iniVolta.apply(this, arguments);
  };
}
