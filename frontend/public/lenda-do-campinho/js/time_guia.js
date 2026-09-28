/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📘 MEU TIME AUTO-EXPLICATIVO (v159)
   - botão "Como funciona" (abre sozinho na primeira vez);
   - caixa "Próximo passo": olha o time e diz o que fazer agora, com o botão que resolve;
   - energia em % em cada jogador e legenda dos números;
   - Mercado: mostra se o jogador é melhor que o seu titular da posição.
   Só explica: nenhuma regra do time mudou. Carregar DEPOIS de team.js.
   ============================================================ */
const ENERGIA_POR_MIN = 12;
function energiaMedia(lista) { const js = lista.filter(Boolean); return js.length ? Math.round(js.reduce((a, j) => a + clamp(j.energia, 0, 100), 0) / js.length) : 100; }
function minutosParaDescansar(lista, alvo = 70) { const t = G.save.time; const vel = ENERGIA_POR_MIN * (1 + 0.25 * ((t.estr && t.estr.med) || 0)); const falta = Math.max(0, ...lista.filter(Boolean).map(j => alvo - j.energia)); return Math.ceil(falta / vel); }

function modalComoFunciona(voltaPara) {
  const s = G.save, t = s.time; const d = DIVS[t.div];
  const sec = (tit, ...ps) => el('div', { class: 'guia-sec' }, el('h3', {}, tit), ...ps.map(p => el('p', {}, p)));
  abreModal.largo = true;
  abreModal(el('h2', {}, '📘 Como funciona o Meu Time'),
    sec('🎯 O objetivo', `Cada temporada tem ${t.liga.rodadas.length} rodadas contra os outros ${TIMES_LIGA - 1} times da divisão. No fim, os 2 PRIMEIROS sobem de divisão e os 2 ÚLTIMOS caem. Quem é campeão da divisão principal de um país recebe convite para jogar a liga do próximo país.`,
      `Durante a temporada ainda tem a Copa (mata-mata com prêmios maiores) e a meta do patrocinador (aba Clube).`),
    sec('⚽ Jogar uma partida', `Na aba "Jogar partida": "Apito inicial!" = você joga e decide os seus lances (ganha a XP inteira). "Simular resultado" = sai o placar na hora (ganha metade da XP). Vitória dá prêmio no caixa do clube e um "bicho" de 25% no SEU bolso.`,
      `A tela mostra a chance de vitória antes do jogo: se estiver baixa, melhore a escalação primeiro.`),
    sec('⚡ Energia (a barrinha colorida de cada jogador)', `Cada jogo gasta de 16 a 24 de energia de quem jogou. Verde = descansado, amarelo = cansando, VERMELHO = exausto. Jogador cansado rende até 38% menos.`,
      `A energia volta SOZINHA: ${ENERGIA_POR_MIN} pontos por minuto de verdade (mais rápido com o Departamento Médico). Então: tenha reservas, revezar é o segredo! O botão "Escalar automático" já escolhe quem está mais descansado.`),
    sec('📈 Como os jogadores evoluem', `Quem joga ganha experiência. O "Treinar elenco" (1 vez por dia do jogo) dá experiência a TODOS. A cada nível o jogador ganha +2 nos atributos, até o limite dele: é o "máx" que aparece no cartão (ex.: máx 46 = nenhum atributo passa de 46). Jovem com máx alto = promessa!`,
      `A partir dos 32 anos o físico cai um pouco, e aos 36 o jogador se aposenta. A Categoria de Base (aba Clube) revela jovens a cada temporada.`),
    sec('🔢 Os números do cartão', `ATQ = ataque · DEF = defesa · PAS = passe · FÍS = físico. O número GRANDE à direita é a força geral na posição dele. A força média da sua divisão agora é ~${d.base}: titular bem abaixo disso é ponto fraco.`,
      `"Fora de posição" = jogador numa posição que não é a dele: rende 15% menos (posição parecida) ou 32% menos (bem diferente). Goleiro improvisado rende só 40%.`),
    sec('🛒 Quando contratar', `Contrate quando: (1) um titular estiver bem mais fraco que a média da divisão; (2) faltar reserva para revezar os cansados; (3) o time subir de divisão (os rivais ficam mais fortes). No Mercado aparece "⬆ melhor que o seu titular" quando vale a pena.`,
      `Cuidado: cada jogador tem SALÁRIO por rodada. O olheiro traz jogadores novos a cada dia do jogo. Lendas (chefões que você venceu) também podem ser contratadas.`),
    sec('💰 O caixa do clube', `Entra: prêmios, bilheteria (jogos em casa), patrocínio e vendas. Sai: salários, treinos, contratações e obras. Caixa NEGATIVO atrasa salários e derruba o moral do time. Você pode depositar dinheiro do seu bolso (aba Clube).`),
    sec('🏗️ Obras (aba Clube)', `Departamento Médico = menos cansaço e energia volta mais rápido (ótimo primeiro investimento). Centro de Treinamento = jogadores evoluem mais rápido. Estádio = mais bilheteria. Olheiros = mercado melhor. Categoria de Base = mais promessas.`),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => abrirTime(voltaPara || 'elenco') }, 'Entendi, voltar ao time')));
}

// o que fazer agora (no máximo 3 dicas, a mais importante primeiro)
function proximosPassos() {
  const s = G.save, t = s.time; const esc = escalacaoAtual(); const tit = esc.map(x => x.j).filter(Boolean);
  const reservas = elencoCompleto().filter(j => !t.titulares.includes(j.id)); const dicas = [];
  const faltam = esc.filter(x => !x.j).length;
  if (faltam) dicas.push({ nivel: 3, txt: `Faltam ${faltam} titulares na escalação. Aperte "Escalar automático" ou contrate no Mercado.`, bt: ['Escalar automático', () => { autoEscalar(); abrirTime('elenco'); }] });
  if (t.caixa < 0) dicas.push({ nivel: 3, txt: 'O caixa está NEGATIVO: os salários atrasam e o moral cai. Venda um reserva ou deposite do seu bolso (aba Clube).', bt: ['Ir para o Clube', () => abrirTime('clube')] });
  const em = energiaMedia(tit);
  if (em < 45) {
    const descansados = reservas.filter(j => !j.eu && j.energia >= 60).length;
    const min = minutosParaDescansar(tit);
    dicas.push({ nivel: 3, txt: `Seu time está CANSADO (energia média ${em}%): assim ele rende bem menos. ${descansados ? `Você tem ${descansados} reserva(s) descansado(s): o "Escalar automático" coloca eles.` : 'Não há reservas descansados.'} Ou espere uns ${min} min: a energia volta sozinha.`, bt: descansados ? ['Escalar automático', () => { autoEscalar(); abrirTime('elenco'); }] : ['Ver o Mercado', () => abrirTime('mercado')] });
  }
  if (reservas.filter(j => !j.eu).length < 5) dicas.push({ nivel: 2, txt: `Você só tem ${reservas.filter(j => !j.eu).length} reserva(s). Com mais reservas dá para revezar quem cansa. Contrate no Mercado (olhe o salário!).`, bt: ['Ver o Mercado', () => abrirTime('mercado')] });
  const fora = esc.filter(x => x.j && !x.j.eu && x.j.pos !== x.slot);
  if (fora.length) dicas.push({ nivel: 1, txt: `${fora.map(x => x.j.nome).join(', ')} ${fora.length > 1 ? 'estão' : 'está'} fora de posição e rende${fora.length > 1 ? 'm' : ''} menos. O ideal é ter jogador de cada posição.` });
  const fracos = esc.filter(x => x.j && !x.j.eu && ovr(x.j) < DIVS[t.div].base - 3);
  if (fracos.length) dicas.push({ nivel: 1, txt: `Ponto fraco: ${fracos.map(x => `${x.j.nome} (${ovr(x.j)})`).join(', ')} abaixo da média da divisão (~${DIVS[t.div].base}). Procure um reforço no Mercado.`, bt: ['Ver o Mercado', () => abrirTime('mercado')] });
  if (t.diaTreino !== s.dia && t.caixa >= custoTreino()) dicas.push({ nivel: 1, txt: `O treino de hoje está disponível: todos os jogadores ganham experiência (${fmt(custoTreino())} do caixa).` });
  if (!dicas.length) dicas.push({ nivel: 0, txt: 'Tudo pronto! Time descansado e escalado. Vá em "Jogar partida".', bt: ['Jogar partida', () => abrirTime('jogar')] });
  return dicas.sort((a, b) => b.nivel - a.nivel).slice(0, 3);
}
function caixaProximoPasso() {
  const box = el('div', { class: 'guia-passo' }, el('b', {}, '💡 Próximo passo'));
  for (const d of proximosPassos()) box.append(el('div', { class: 'guia-dica n' + d.nivel }, el('span', {}, d.txt), d.bt ? el('button', { class: 'btn mini amarelo', type: 'button', onclick: d.bt[1] }, d.bt[0]) : null));
  return box;
}

// cartão do jogador: energia em % ao lado da barrinha
{
  const _cartaJogadorG = cartaJogador;
  cartaJogador = function (j) {
    const c = _cartaJogadorG.apply(this, arguments);
    const bar = c.querySelector('.bl-hp'); const e = Math.round(clamp(j.energia, 0, 100));
    if (bar) { bar.title = `Energia ${e}%`; bar.after(el('small', { class: 'guia-en', style: `color:${e > 60 ? '#2a8a2a' : e > 30 ? '#a08a10' : '#c0301a'}` }, `⚡ energia ${e}%${e <= 30 ? ' (exausto)' : e <= 60 ? ' (cansando)' : ''}`)); }
    return c;
  };
}
// abrirTime: botão "Como funciona", legenda, "Próximo passo" e o comparativo do Mercado
{
  const _abrirTimeG = abrirTime;
  abrirTime = function (aba = 'elenco') {
    const r = _abrirTimeG.apply(this, arguments);
    const s = G.save; if (!s || !s.time) return r;
    const box = document.getElementById('modalConteudo'); const tabs = box && box.querySelector('.tabs-modal'); if (!tabs) return r;
    tabs.append(el('button', { class: 'btn verde', type: 'button', onclick: () => modalComoFunciona(aba) }, '📘 Como funciona'));
    if (aba === 'elenco' || aba === 'jogar') tabs.after(caixaProximoPasso());
    if (aba === 'elenco') {
      const h = [...box.querySelectorAll('h3')].find(x => /^Titulares/.test(x.textContent));
      if (h) h.after(el('p', { class: 'guia-legenda' }, 'ATQ ataque · DEF defesa · PAS passe · FÍS físico · número grande = força · ⚡ = energia (volta sozinha com o tempo) · máx = até onde os atributos podem crescer'));
    }
    if (aba === 'mercado') {
      const t = s.time; const esc = escalacaoAtual();
      const titularDa = pos => esc.filter(x => x.slot === pos && x.j).map(x => ovrNoSlot(x.j, pos)).sort((a, b) => a - b)[0]; // o mais fraco da posição
      for (const card of box.querySelectorAll('.lista .linha-item')) {
        const nome = (card.querySelector('.nm b') || {}).textContent; const j = (t.mercado || []).find(x => x.nome === nome && card.textContent.includes(POS_NOME[x.pos])); if (!j) continue;
        const ref = titularDa(j.pos); const dif = ref == null ? null : ovr(j) - Math.round(ref);
        const tag = ref == null ? el('small', { class: 'guia-cmp bom' }, `⬆ você não tem titular ${POS_NOME[j.pos].toLowerCase()}`) : dif > 0 ? el('small', { class: 'guia-cmp bom' }, `⬆ +${dif} sobre o seu titular ${POS_NOME[j.pos].toLowerCase()}`) : el('small', { class: 'guia-cmp' }, dif === 0 ? '= igual ao seu titular' : `${dif} abaixo do seu titular (serve de reserva)`);
        const nm = card.querySelector('.nm'); if (nm) nm.append(tag, el('small', { class: 'guia-cmp' }, ` · salário ${fmt(salario(j))}/rodada`));
      }
      const p = box.querySelector('p'); if (p) p.after(el('p', { class: 'guia-legenda' }, 'Vale contratar quando aparece "⬆ sobre o seu titular" ou quando faltam reservas para revezar os cansados. Lembre do salário por rodada!'));
    }
    // primeira vez: o guia abre sozinho
    if (!s.flags.guia_time_visto) { s.flags.guia_time_visto = true; setTimeout(() => modalComoFunciona(aba), 50); }
    return r;
  };
}
{
  const st = document.createElement('style');
  st.textContent = `.guia-passo { margin: 8px 0; padding: 8px 10px; border-radius: 10px; background: #fff6d8; border: 2px solid #e8c040; }
  .guia-dica { display: flex; gap: 8px; align-items: center; justify-content: space-between; margin-top: 5px; font-size: 14px; line-height: 1.3; }
  .guia-dica.n3 { color: #a02010; font-weight: 700; } .guia-dica button { flex: none; }
  .guia-legenda { font-size: 12px; opacity: .85; margin: 2px 0 6px; } .guia-en { display: block; font-size: 11px; font-weight: 700; }
  .guia-cmp { display: block; font-size: 12px; font-weight: 700; color: #6a5a40; } .guia-cmp.bom { color: #1a8a2a; }
  .guia-sec h3 { margin: 12px 0 4px; } .guia-sec p { margin: 4px 0; line-height: 1.4; }`;
  document.head.append(st);
}
