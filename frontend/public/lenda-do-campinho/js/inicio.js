/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   TELA INICIAL (padrão da vitrine /lenda/, 2026-10): capa viva ao fundo
   (js/capa_viva.js), logo grande à esquerda e um painel de vidro à direita:
   - avisos (conta, save na nuvem, qual personagem usar);
   - cartão do jogador (retrato, nome, nível, onde parou) + Continuar;
   - atalhos em blocos (História, Ranking, Como jogar, Wiki...).
   Não cria botões do jogo: REORGANIZA os que o jogo e os outros arquivos
   já colocam em #inicioMenu (e continua arrumando os que chegarem depois).
   O único botão novo é "Conheça o jogo" (vitrine), e só no site.
   Carregar por ÚLTIMO (depois de todos que mexem na tela inicial).
   ============================================================ */
(function () {
  const ini = document.getElementById('inicio'); const caixa = ini && ini.querySelector('.inicio-caixa');
  const menu = document.getElementById('inicioMenu'); const criacao = document.getElementById('criacao');
  if (!caixa || !menu) return;
  ini.classList.add('ini-v2');
  // Capa viva ao fundo (a mesma da vitrine): arte animada no lugar da imagem
  // parada. Para sozinha quando #inicio some (o jogo começou).
  const capa = el('div', { class: 'ini-capa' }); ini.prepend(capa);
  if (window.CapaViva) CapaViva.monta(capa, {
    horizontal: { src: 'a/capa.webp', bola: [76, 19], sol: [45, 77] },
    vertical: { src: 'a/capa_vertical.webp', bola: [70, 40.5], sol: [50, 70] },
  });
  // Botões de criação no estilo novo (dourado = ação principal).
  for (const [id, estilo] of [['btnNascer', 'lc-btn-ouro'], ['btnVoltar', 'lc-btn-vidro']]) {
    const b = document.getElementById(id); if (b) { b.classList.remove('amarelo', 'grande'); b.classList.add('lc-btn', estilo); }
  }

  const avisos = el('div', { class: 'ini-avisos' });
  const cartao = el('div', { class: 'ini-cartao' });
  const titTiles = el('p', { class: 'ini-titulo' }, 'Explore');
  const tiles = el('div', { class: 'ini-tiles' });
  const barra = el('div', { class: 'ini-barra' });
  menu.prepend(avisos, cartao, titTiles, tiles);
  caixa.prepend(barra);

  // blocos: ícone, nome e uma linha de explicação
  const TILE = [
    ['#btnHistoria', '📖', 'História', 'capítulos da sua lenda'],
    ['[data-abre="ranking"]', '🏆', 'Ranking', 'os melhores do site'],
    ['[data-abre="ajuda"]', '❓', 'Como jogar', 'teclas e dicas'],
    ['#btnWikiInicio', '📚', 'Wiki', 'adversários e drops'],
    ['#btnPersInicio', '📜', 'Personagens', 'fichas dos jogadores'],
    ['#btnBackupInicio', '💾', 'Backup', 'exportar / importar'],
    ['#btnBugInicio', '🐞', 'Informar bug', 'achou um erro?'],
    ['#btnAppWin', '💻', 'Jogar no Windows', 'baixe o aplicativo'],
    ['#btnConhecaJogo', '🌟', 'Conheça o jogo', 'trailer e galeria'],
  ];
  const fazTile = (b) => {
    if (b.classList.contains('ini-tile')) return;
    const t = TILE.find(([sel]) => b.matches(sel));
    const txt = (b.textContent || '').trim(); const m = txt.match(/^(\p{Extended_Pictographic}️?)\s*(.*)$/u);
    const ic = t ? t[1] : (m ? m[1] : '⭐'), nome = t ? t[2] : (m ? m[2] : txt), sub = t ? t[3] : '';
    b.classList.remove('grande', 'amarelo'); b.classList.add('ini-tile');
    b.textContent = ''; b.append(el('span', { class: 'ini-ic' }, ic), el('b', {}, nome), ...(sub ? [el('small', {}, sub)] : []));
  };

  // cartão do jogador
  const cont = document.getElementById('btnContinuar'), novo = document.getElementById('btnNovo'), resumo = document.getElementById('resumoSave');
  const ret = el('div', { class: 'ini-retrato' }); const info = el('div', { class: 'ini-info' });
  cartao.append(el('div', { class: 'ini-cartao-topo' }, ret, info));
  if (cont) cartao.append(cont); if (novo) cartao.append(novo); if (resumo) resumo.hidden = true;
  const desenhaRetrato = (save) => {
    ret.innerHTML = ''; const c = mkCanvas(300, 400); c.className = 'retrato-cv'; ret.append(c);
    const G0 = G.save;
    try { G.save = save; const look = lookJogador(true); G.save = G0; [0, 400, 1500, 3500].forEach(ms => setTimeout(() => { try { pintaAparencia(c, look, { inteiro: true }); } catch (e) { } }, ms)); }
    catch (e) { G.save = G0; ret.textContent = '⚽'; }
  };
  let ultimo = '';
  const atualizaCartao = () => {
    let save = null; try { save = lerSave(); } catch (e) { }
    const tem = !!(save && cont && !cont.hidden);
    const chave = tem ? `${save.nome}|${save.nivel}|${save.mapa}` : 'novo';
    cartao.classList.toggle('tem-save', tem);
    // Continuar sempre dourado; "Criar" dourado só pra quem ainda não tem jogador.
    if (cont) { cont.classList.remove('amarelo', 'grande'); cont.classList.add('lc-btn', 'lc-btn-ouro'); }
    if (novo) { novo.classList.remove('amarelo', 'grande'); novo.classList.add('lc-btn'); novo.classList.toggle('lc-btn-ouro', !tem); novo.classList.toggle('lc-btn-vidro', tem); }
    if (chave === ultimo) return; ultimo = chave;
    info.innerHTML = '';
    if (tem) {
      const fase = FASES[faseIdx(save.nivel)].nome; let lugar = ''; try { lugar = MAPAS_DEF[save.mapa] ? getMapa(save.mapa).nome : ''; } catch (e) { }
      info.append(el('small', {}, 'Seu jogador'), el('b', { class: 'ini-nome' }, save.nome || 'Jogador'),
        el('span', { class: 'ini-nivel' }, `Nível ${save.nivel} · ${fase}`),
        ...(save.posicao && typeof POSICOES !== 'undefined' && POSICOES[save.posicao] ? [el('span', {}, `⚽ ${POSICOES[save.posicao].nome}`)] : []),
        ...(lugar ? [el('span', {}, `📍 ${String(lugar).replace(/^🎯\s*/, '')}`)] : []));
      cont.textContent = '▶ Continuar'; novo.textContent = 'Criar outro jogador';
      desenhaRetrato(save);
    } else {
      ret.innerHTML = ''; ret.append(el('span', { class: 'ini-bola' }, '⚽'));
      info.append(el('small', {}, 'Bem-vindo(a)!'), el('b', { class: 'ini-nome' }, 'Comece sua lenda'), el('span', {}, 'Crie seu jogador e comece no campinho de terra da Vila.'));
      novo.textContent = '⚽ Criar meu jogador';
    }
  };

  // arruma tudo que estiver (ou chegar depois) no menu
  const arruma = () => {
    if (!menu.contains(cartao)) return; // tela de "carregando o mundo" limpou o menu: não mexe
    for (const c of [...menu.children]) {
      if (c === avisos || c === cartao || c === tiles || c === titTiles) continue;
      if (c.matches('#contaEscolha')) { // "qual save usar?": aparece no lugar do Continuar (antes ficava lá embaixo e parecia que nada acontecia)
        cartao.append(c); cartao.classList.add('escolhendo'); menu.classList.add('escolhendo');
        setTimeout(() => { try { c.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { } }, 60);
      }
      else if (c.matches('.cad-cartao, .nuvem-caixa')) avisos.append(c);
      else if (c === cont || c === novo) cartao.append(c);
      else if (c === resumo) c.hidden = true;
      else if (c.tagName === 'BUTTON') { fazTile(c); c.style.setProperty('--i', String(tiles.children.length)); tiles.append(c); }
    }
    const pb = caixa.querySelector('.inicio-topo .portal-barra'); if (pb) barra.append(pb);
    avisos.hidden = !avisos.children.length;
    atualizaCartao();
  };
  // "Conheça o jogo" → vitrine (/lenda/). Só no site de verdade: a versão Steam
  // e o app do Windows (window.LENDA_APP) não têm essa página, e os servidores
  // locais (bateria de testes, gravador de trailer) servem só a pasta do jogo.
  // Pra ver localmente: localStorage.lenda_vitrine_teste = '1'.
  let testeLocal = false; try { testeLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && localStorage.getItem('lenda_vitrine_teste') === '1'; } catch (e) { }
  const naWeb = !window.LENDA_APP && /^https?:$/.test(location.protocol) && (/^(www\.)?educacaogamer\.com\.br$/.test(location.hostname) || testeLocal);
  if (naWeb && !document.getElementById('btnConhecaJogo')) menu.append(el('button', { class: 'btn', id: 'btnConhecaJogo', type: 'button', onclick: () => { location.href = '/lenda/'; } }, '🌟 Conheça o jogo'));
  // Blocos que inclinam seguindo o mouse (só com mouse e sem "reduzir movimento").
  if (matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tiles.addEventListener('pointermove', (e) => {
      const t = e.target.closest('.ini-tile'); if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -10).toFixed(1) + 'deg');
      t.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1) + 'deg');
    });
    tiles.addEventListener('pointerout', (e) => {
      const t = e.target.closest('.ini-tile');
      if (t && !t.contains(e.relatedTarget)) { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); }
    });
  }
  new MutationObserver(arruma).observe(menu, { childList: true });
  if (cont) new MutationObserver(atualizaCartao).observe(cont, { attributes: true, attributeFilter: ['hidden'] });
  if (criacao) new MutationObserver(() => ini.classList.toggle('modo-criacao', !criacao.hidden)).observe(criacao, { attributes: true, attributeFilter: ['hidden'] });
  const vai = () => { arruma(); ini.classList.toggle('modo-criacao', !!criacao && !criacao.hidden); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(vai, 0)); else setTimeout(vai, 0);
  [300, 1200, 3000].forEach(ms => setTimeout(arruma, ms));
})();
