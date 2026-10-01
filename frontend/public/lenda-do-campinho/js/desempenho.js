/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🚀 DESEMPENHO (v305): medido numa hunt cheia (22 adversários em volta, 46 no mapa, magias e poções):
   mais da metade de cada quadro ia em segLivre — a "linha livre" entre cada adversário e você, refeita
   do zero em TODO quadro, testando a colisão a cada 0,2 quadrado (≈ 2.900 testes por quadro).
   Agora a resposta fica guardada por um instante (150 ms) para o mesmo trecho (arredondado em 1/4 de
   quadrado); quando o adversário ou você andam de verdade, o trecho muda e a conta é refeita.
   O movimento continua testando a parede na hora (mover/colide), então ninguém atravessa nada.
   ENGASGOS: a 1ª vez que uma folha de bonecos (800×870) era desenhada, o navegador a decodificava na hora
   (8 a 35 ms num quadro só). Agora a folha é decodificada em segundo plano (img.decode) e só passa a ser
   usada depois disso — até lá aparece o boneco de reserva, como já acontecia enquanto a imagem baixava.
   A tela de trabalho que lê os pixels da folha (rotulaCelula, boneco.js) é "willReadFrequently" (sem cópia da GPU).
   PAINÉIS: a mochila/equipamento/habilidades eram refeitos a cada evento da hunt (derrotar, pegar item, XP),
   ~3–4 ms cada. Durante o jogo agora é no máximo 1 vez a cada 250 ms (clique seu continua na hora).
   Carregar NO FIM.
   ============================================================ */
{
  const _segLivre = segLivre, memo = new Map(); let memoMapa = null, memoDesde = 0;
  segLivre = function (ax, ay, bx, by, r = R_ENT) {
    const ag = G.agora || 0;
    if (G.mapa !== memoMapa || ag - memoDesde > 150 || ag < memoDesde || memo.size > 4000) { memo.clear(); memoMapa = G.mapa; memoDesde = ag; }
    const k = ((ax * 4) | 0) + ',' + ((ay * 4) | 0) + ',' + ((bx * 4) | 0) + ',' + ((by * 4) | 0) + ',' + r;
    let v = memo.get(k); if (v === undefined) { v = _segLivre(ax, ay, bx, by, r); memo.set(k, v); }
    return v;
  };

  // folhas de bonecos: decodifica fora do quadro antes de usar
  const _carregaDec = carregaFolhas;
  carregaFolhas = function () {
    const r = _carregaDec.apply(this, arguments);
    try {
      for (const n in FOLHAS) {
        const f = FOLHAS[n]; if (!f || f._dec) continue; f._dec = true; const im = f.im;
        const pronto = () => { f.ok = true; };
        // v315: com tempo-limite (no Safari do iPhone o decode() pode não responder): a folha é usada assim mesmo
        const decodifica = () => { setTimeout(pronto, 2500); (im.decode ? im.decode() : Promise.resolve()).then(pronto, pronto); };
        if (im.complete && im.naturalWidth) { if (!f.ok) decodifica(); else if (im.decode) im.decode().catch(() => { }); }
        else im.onload = decodifica;
      }
    } catch (e) { }
    return r;
  };
  try { carregaFolhas(); } catch (e) { }

  // painéis: no laço do jogo, no máximo 1 reconstrução a cada 250 ms
  let noLaco = false, ultPaineis = 0;
  const _atualizaDes = atualiza;
  atualiza = function () { noLaco = true; try { return _atualizaDes.apply(this, arguments); } finally { noLaco = false; } };
  const _paineisDes = atualizaPaineis;
  atualizaPaineis = function () {
    const ag = performance.now();
    if (noLaco && ag - ultPaineis < 250) { G.uiSujo = true; return; } // fica para daqui a pouco
    ultPaineis = ag; return _paineisDes.apply(this, arguments);
  };

  // v315: leitura da folha que voltou VAZIA (aconteceu no iPhone: o retrato mostrava só óculos/faixa/apito, sem o boneco)
  // não fica guardada: a célula é refeita logo depois, e o boneco usa o desenho de reserva enquanto isso
  const _rotulaVazia = rotulaCelula;
  rotulaCelula = function (f, idx) {
    const r = _rotulaVazia.apply(this, arguments);
    try {
      const d = r && r.d; let opaco = 0; if (d) for (let i = 3; i < d.length && !opaco; i += 4 * 23) if (d[i] > 20) opaco = 1;
      if (d && !opaco && f && f.ok) {
        if (f.rot) delete f.rot[idx]; f.ok = false;
        setTimeout(() => { f.ok = true; try { SPR_CACHE.clear(); } catch (e) { } }, 500);
      }
    } catch (e) { }
    return r;
  };
}
