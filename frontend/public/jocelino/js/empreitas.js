// Jocelino — empreitas.js — as empreitas do Jocelino (a lavoura do Stardew; empreitadas.gd do Godot), as regras:
// - curtas (uma tarde): leva o material, usa a ferramenta certa N vezes no lugar e recebe na hora;
// - longas, o laço da lavoura: reservar no quadro (sem gastar), começar na plaquinha com o material (o plantar), cuidar
//   cada dia com a ferramenta da etapa (o regar: pá, colher, regador, machado), a noite avança o dia cuidado (a chuva
//   faz a cura; o concreto não pega e a pintura não seca na chuva), pronta se entrega com um clique e o cliente paga à
//   noite (a caixa de envio). Reserva não começada em 3 dias: o cliente desiste, sem multa (o Help Wanted do Stardew).
// O quadro de Serviços da Vila mostra 2 a 4 por dia, só o que a função libera.

// (16/10, o jogador: "lajota colorida, onde pego isso?" ... "só precisava me orientar no jogo que eu precisaria de uma betoneira
// para poder fazer e ela é comprada na ferraria") A lajota não se compra: sai da betoneira (o Seu Tonico faz na ferraria; ou presente
// do Grêmio) ou do Fabricar com Acabamento 4. O serviço continua no quadro; o aviso e a seta levam até a betoneira.
const ONDE_LAJOTA = 'A lajota colorida não se compra: sai da betoneira. O Seu Tonico faz uma na ferraria, na pedreira; coloque no quintal e, com cimento na mão e pigmento na mochila, ela faz a lajota em 1 dia.';
function podeFazerLajota() {
  return (typeof Fabricar !== 'undefined' && Fabricar.conhecida('lajota')) || !!(G.horta && G.horta.colocados && G.horta.colocados.some(c => c.id === 'betoneira'))
    || !!(G.mochila && G.mochila.total('lajota') >= 10);
}

const EMPREITAS_CURTAS = {
  consertar_banca: { nome: 'Consertar a banca do Lourival', cliente: 'lourival', mapa: 'praia', x: 10, y: 8, material: { madeira: 5 }, ferramenta: 'machado', vezes: 4 },
  tabua_pier: { nome: 'Tapar tábua solta do píer', cliente: 'lourival', mapa: 'praia', x: 29, y: 15, material: { madeira: 3 }, ferramenta: 'machado', vezes: 3 },
  limpar_trilha: { nome: 'Limpar a trilha da mata', cliente: 'juca', mapa: 'mata', x: 30, y: 11, material: {}, ferramenta: 'foice', vezes: 8 },
  escorar_ponte: { nome: 'Escorar a ponte da mata', cliente: 'juca', mapa: 'mata', x: 25, y: 15, material: { madeira: 4 }, ferramenta: 'machado', vezes: 4 },
  remendar_calcada: { nome: 'Remendar a calçada da rua', cliente: 'zelia', mapa: 'vila', x: 28, y: 11, material: { cimento: 2 }, ferramenta: 'pa', vezes: 4 },
  cerca_zelia: { nome: 'Consertar a cerca da Dona Zélia', cliente: 'zelia', mapa: 'vila', x: 35, y: 10, material: { madeira: 4 }, ferramenta: 'machado', vezes: 3 },
  telhas_juca: { nome: 'Trocar telhas do Tio Juca', cliente: 'juca', mapa: 'quintal', x: 9, y: 9, material: { telha: 6 }, ferramenta: 'carga', vezes: 1 },
  desentulhar_ananias: { nome: 'Desentulhar o terreno do Seu Ananias', cliente: 'ananias', mapa: 'vila', x: 11, y: 13, material: {}, ferramenta: 'pa', vezes: 6 },
  // (15/10, T6: "as missões diárias do quadro andam se repetindo muito") Os serviços novos dos primeiros dias, todos na Vila e com
  // o estrago à vista: o banco da praça, o buraco da rua de baixo, o carrinho do canteiro e as pedras da estrada (a 1ª picareta).
  // `fala`: o pedido na voz de quem pede, no cartão do quadro.
  banco_praca: { nome: 'Consertar o banco da praça', cliente: 'zelia', mapa: 'vila', x: 27, y: 20, material: { madeira: 3 }, ferramenta: 'machado', vezes: 3,
    fala: 'O banco da praça quebrou bem na sexta do samba. As senhoras ficam de pé, meu filho!' },
  buraco_rua: { nome: 'Tapar o buraco da rua de baixo', cliente: 'bira', mapa: 'vila', x: 30, y: 25, material: { pedra: 6 }, ferramenta: 'pa', vezes: 4,
    fala: 'O caminhão do cimento atolou no buraco da rua de baixo. Tapa com pedra e pá, rapaz.' },
  carrinho_ze: { nome: 'Arrumar o carrinho de mão do canteiro', cliente: 'ze', mapa: 'vila', material: { madeira: 2 }, ferramenta: 'machado', vezes: 3,
    fala: 'A roda do carrinho soltou e a tábua rachou. Sem carrinho, tijolo vai no braço!' },
  pedregulho_rua: { nome: 'Tirar as pedras da estrada', cliente: 'tonico', mapa: 'vila', x: 33, y: 13, material: {}, ferramenta: 'picareta', vezes: 3,
    fala: 'A carroça da Serra derrubou pedra na estrada. Picareta nelas, que ainda sobra pedra pra você.' },
};
ecoCampo(EMPREITAS_CURTAS, 'paga', ECO.empreitas.paga);   // o pagamento de cada uma mora no ECO
for (const id in EMPREITAS_CURTAS) Object.assign(EMPREITAS_CURTAS[id], { funcaoMin: 0, tipo: 'curta' });
// O lugar de verdade do serviço (teste de 12/10: "bater na plaquinha fica sem sentido"): o golpe vai na ponte, no píer, na
// banca, na cerca e na calçada, sem plaquinha. A limpeza (trilha, entulho) e a carga (telhas) seguem como antes.
// (14/10, relato do jogador: "não havia nenhum indício de onde eu teria que fazer o remendo... a cerca da Dona Zélia nem
// existe") O estrago aparece no mapa enquanto o serviço está aceito, como a ponte quebrada da praia do Stardew (arte pronta,
// do Higgsfield): `arte` é o estrago; `inteira`, o que fica no lugar quando não há serviço (a cerca existe sempre; a calçada
// remendada volta a ser chão). `trechos`: a cerca montada em trechos de 2 ladrilhos, com o portão aberto no meio (na frente da
// porta da casa): ela não fecha a passagem para a obra da casa. A calçada saiu da praça (a fileira de 1 ladrilho da rua de baixo
// não cabia 3x2) para a calçada larga da rua principal, na frente do quadro de serviços.
// (14/10, segunda etapa: "faça a mesma coisa com o píer, a bancada do Lourival e tudo que tem de ser arrumado no jogo") O jeito de
// mostrar cada estrago: `chao` troca a arte do chão do mapa (a ponte da mata); `objeto` troca a arte do objeto de sempre (a banca);
// `retalho` é o pedaço de chão por cima (o trecho do píer); `consertada`, o que fica depois do conserto (as tábuas novas do píer);
// `luz`, o retângulo da luz quando não é a própria área (em ladrilhos).
const LOCAL_CURTA = { escorar_ponte: { nome: 'na ponte', area: { x: 26, y: 17, w: 2, h: 2 }, chao: 'objetos/pier', arte: 'objetos/ponte_quebrada' },
  tabua_pier: { nome: 'no píer', area: { x: 30, y: 16, w: 2, h: 7 }, piso: true, retalho: { x: 30, y: 18, w: 2, h: 2 }, arte: 'objetos/pier_quebrado', consertada: 'objetos/pier_novo' },
  consertar_banca: { nome: 'na banca do Lourival', area: { x: 7, y: 7, w: 3, h: 1 }, objeto: 'banca_peixe', arte: 'objetos/banca_quebrada', luz: { x: 7, y: 5, w: 3, h: 3 } },
  cerca_zelia: { nome: 'na cerca da Dona Zélia', area: { x: 36, y: 9, w: 5, h: 1 }, arte: 'objetos/cerca_zelia_quebrada', inteira: 'objetos/cerca_zelia', trechos: [{ x: 36, w: 2 }, { x: 39, w: 2, espelho: true }] },
  remendar_calcada: { nome: 'na calçada da rua', area: { x: 27, y: 10, w: 3, h: 2 }, arte: 'objetos/calcada_rachada', piso: true },
  // (15/10, T6) O banco da praça (mapa_vila.js, sempre lá, ao lado da roda de samba): quebrado enquanto o serviço está aceito. O
  // buraco é chão, na rua de baixo (a arte tem a borda esfumada: vai por cima da rua, sem colisão).
  banco_praca: { nome: 'no banco da praça', area: { x: 27, y: 20, w: 2, h: 1 }, objeto: 'banco_praca', arte: 'objetos/banco_praca_quebrado', luz: { x: 26.9, y: 19.35, w: 2.2, h: 1.75 } },
  buraco_rua: { nome: 'no buraco da rua de baixo', area: { x: 30, y: 25, w: 2, h: 2 }, arte: 'objetos/buraco_rua', piso: true } };
for (const id in LOCAL_CURTA) EMPREITAS_CURTAS[id].local = LOCAL_CURTA[id];
// (15/10, T6) O carrinho de mão é o do canteiro da obra da vez (o canteiro segue a obra; mapa_vila.js): o lugar do serviço segue o
// carrinho. Sem carrinho no canteiro da vez (o do Mercado não tem: o lote ao lado é pequeno), o serviço não sai no quadro (`precisa`).
// Fica fora do LOCAL_CURTA (que reserva o chão para as coisas do canteiro não caírem em cima): aqui o lugar é a própria coisa do canteiro.
const carrinhoDaVez = () => { const C = typeof canteiroDaVez === 'function' ? canteiroDaVez() : null; return C && C.pecas.carrinho ? C.pecas.carrinho : null; };
EMPREITAS_CURTAS.carrinho_ze.precisa = () => !!carrinhoDaVez();
EMPREITAS_CURTAS.carrinho_ze.local = { nome: 'no carrinho do canteiro', objeto: 'carrinho_obra', arte: 'objetos/carrinho_quebrado',
  get area() { const p = carrinhoDaVez() || [-9, -9]; return { x: p[0], y: p[1] - 1, w: 1, h: 2 }; },   // (o pé e o alto da arte, de 1 ladrilho e meio)
  get luz() { const p = carrinhoDaVez() || [-9, -9]; return { x: p[0] - 0.15, y: p[1] - 0.6, w: 1.3, h: 1.65 }; } };
Object.defineProperties(EMPREITAS_CURTAS.carrinho_ze, { x: { get: () => (carrinhoDaVez() || [40, 3])[0], enumerable: true }, y: { get: () => (carrinhoDaVez() || [40, 3])[1], enumerable: true } });
// As telhas do Tio Juca (14/10, foto do jogador: "a seta nessa missão está apontando pro nada": a plaquinha caía na grama, longe
// da casa) são entregues na própria casa, com o botão direito nela (ou na porta), sem plaquinha; o telhado mostra as telhas
// quebradas enquanto o serviço está aberto.
EMPREITAS_CURTAS.telhas_juca.estrago = { objeto: 'casa_juca', noObjeto: true, arte: 'objetos/casa_juca_telhado', luz: { x: 5, y: 4.5, w: 5, h: 2.5 } };
Object.assign(EMPREITAS_CURTAS.telhas_juca, { x: 7, y: 8 });
// O desentulho é no terreno do Seu Ananias, ao lado do depósito (a plaquinha caía no meio da rua principal).
Object.assign(EMPREITAS_CURTAS.desentulhar_ananias, { x: 11, y: 8, junto: 'deposito' });
// As longas: `etapas` é a ferramenta de cada dia (empreitadas.gd); `concreto`: a pá e a colher não pegam na chuva;
// `pintura`: o último dia é pintar (não se faz na chuva); `reforma`: acabamento (pedido no fim de ano).
const EMPREITAS_LONGAS = {
  calcada_cimento: { nome: 'Calçada da ferraria', piso: true, area: { w: 4, h: 1, textura: 'texturas/calcada' }, cliente: 'tonico', mapa: 'vila', x: 11, y: 23, junto: 'oficina', material: { cimento: 3, pedra: 6 }, etapas: ['pa', 'regador'], funcaoMin: 1, concreto: true, artes: ['objetos/vala', 'objetos/alicerce'] },
  cerca_madeira: { nome: 'Cerca do galinheiro do Tio Juca', cliente: 'juca', mapa: 'quintal', x: 28, y: 22, material: { madeira: 10 }, etapas: ['pa', 'machado'], funcaoMin: 1, artes: ['objetos/vala', 'objetos/cerca'] },
  // (15/10) o muro da divisa fica à direita da casa da Dona Zélia: à esquerda (33,9) ele tapava a frente da Escola nova.
  muro_baixo: { nome: 'Muro da divisa da casa da Dona Zélia', cliente: 'zelia', mapa: 'vila', x: 42, y: 9, junto: 'casa_zelia', material: { tijolo: 30, cimento: 2 }, etapas: ['pa', 'colher', 'colher'], funcaoMin: 1, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/muro'] },
  baldrame: { nome: 'Baldrame do puxadinho do Mercado', fundacao: true, cliente: 'bento', mapa: 'vila', x: 44, y: 18, junto: 'mercado', material: { tijolo: 20, cimento: 2 }, etapas: ['pa', 'colher', 'regador'], funcaoMin: 2, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/alicerce'] },
  muro_chapiscado: { nome: 'Muro chapiscado dos fundos do depósito', cliente: 'ananias', mapa: 'vila', x: 5, y: 3, junto: 'deposito', material: { tijolo: 50, cimento: 4, cal: 2 }, etapas: ['pa', 'colher', 'colher', 'colher', 'regador'], funcaoMin: 2, hab: { h: 'acabamento', n: 3 }, reforma: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/muro'] },
  quiosque_praia: { nome: 'Quiosque na praia', cliente: 'lourival', mapa: 'praia', x: 27, y: 6, material: { madeira: 20, telha: 10, cimento: 2 }, etapas: ['pa', 'colher', 'machado', 'machado'], funcaoMin: 2, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/muro', 'objetos/quiosque_praia'] },
  ponte_pedra: { nome: 'Ponte de pedra', cliente: 'juca', mapa: 'mata', x: 12, y: 16, material: { pedra: 30, cimento: 4 }, etapas: ['pa', 'colher', 'colher', 'regador', 'regador'], funcaoMin: 2, hab: { h: 'alvenaria', n: 5 }, artes: ['objetos/monte_pedras', 'objetos/alicerce', 'objetos/ponte_pedra'] },
  calcada_colorida: { nome: 'Calçada colorida da praça', piso: true, area: { w: 3, h: 2, textura: 'texturas/piso_ladrilho' }, cliente: 'zelia', mapa: 'vila', x: 27, y: 17, junto: 'roda_samba', material: { lajota: 10, cimento: 2 }, etapas: ['pa', 'colher', 'regador'], funcaoMin: 2, concreto: true, reforma: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/alicerce'] },
  // Os serviços melhores (as sementes melhores do Stardew; empreitadas.gd), liberados por Alvenaria e Acabamento.
  baldrame_concreto: { nome: 'Baldrame da casa nova do Seu Lourival', fundacao: true, cliente: 'lourival', mapa: 'praia', x: 12, y: 7, junto: 'banca_peixe', material: { cimento: 4, pedra: 10, vergalhao: 4 }, etapas: ['pa', 'colher', 'regador', 'regador'], funcaoMin: 2, hab: { h: 'alvenaria', n: 2 }, concreto: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/alicerce'] },
  cimentado_queimado: { nome: 'Cimentado queimado na porta do depósito', piso: true, area: { w: 3, h: 1, textura: 'texturas/piso_cimento' }, cliente: 'ananias', mapa: 'vila', x: 6, y: 9, junto: 'deposito', material: { cimento: 6, pigmento: 2 }, etapas: ['pa', 'colher', 'regador', 'regador'], funcaoMin: 2, hab: { h: 'acabamento', n: 4 }, concreto: true, reforma: true, artes: ['objetos/vala', 'objetos/alicerce'] },
  sapata_corrida: { nome: 'Sapata corrida do galpão do Tio Juca', fundacao: true, cliente: 'juca', mapa: 'quintal', x: 30, y: 20, material: { cimento: 8, pedra: 20, vergalhao: 8 }, etapas: ['pa', 'pa', 'colher', 'regador', 'regador', 'regador'], funcaoMin: 2, hab: { h: 'alvenaria', n: 5 }, concreto: true, artes: ['objetos/vala', 'objetos/vala', 'objetos/alicerce'] },
  muro_rebocado: { nome: 'Muro rebocado e pintado do quintal da Dona Zélia', cliente: 'zelia', mapa: 'vila', x: 42, y: 6, junto: 'casa_zelia', material: { tijolo: 60, cimento: 6, tinta: 2 }, etapas: ['pa', 'colher', 'colher', 'colher', 'regador', 'regador', 'colher'], funcaoMin: 2, hab: { h: 'acabamento', n: 6 }, pintura: true, reforma: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/muro'] },
  ladrilho: { nome: 'Piso de ladrilho na porta do Mercado', piso: true, area: { w: 3, h: 1, textura: 'texturas/piso_ladrilho' }, cliente: 'bento', mapa: 'vila', x: 39, y: 23, junto: 'mercado', material: { cimento: 4, ladrilho: 30 }, etapas: ['pa', 'colher', 'colher', 'regador', 'regador', 'colher'], funcaoMin: 2, hab: { h: 'acabamento', n: 8 }, reforma: true, artes: ['objetos/vala', 'objetos/alicerce'] },
  radier: { nome: 'Radier do galpão do Tio Juca', piso: true, area: { w: 3, h: 3, textura: 'texturas/piso_cimento' }, cliente: 'juca', mapa: 'quintal', x: 34, y: 20, material: { cimento: 15, pedra: 30, vergalhao: 15 }, etapas: ['pa', 'pa', 'colher', 'colher', 'regador', 'regador', 'regador', 'regador'], funcaoMin: 2, hab: { h: 'alvenaria', n: 8 }, concreto: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/alicerce'] },
};
ecoCampo(EMPREITAS_LONGAS, 'paga', ECO.empreitas.paga);   // o pagamento de cada uma mora no ECO
for (const id in EMPREITAS_LONGAS) { const E = EMPREITAS_LONGAS[id]; Object.assign(E, { tipo: 'longa', dias: E.etapas.length, vezesDia: 3, ferramenta: E.etapas[0] }); }
// A largura do lote em ladrilhos (a arte da última etapa: muro e quiosque ocupam 3).
const larguraLote = E => { if (E.area) return E.area.w; const a = E.artes[E.artes.length - 1]; return a === 'objetos/muro' || a.endsWith('_praia') ? 3 : 2; };
// Os ladrilhos do lote: a plaquinha à esquerda e a obra (o piso tem área: largura × altura, para baixo).
const tilesDoLote = E => { const r = [{ x: E.x - 1, y: E.y }], h = E.area ? E.area.h : 1; for (let j = 0; j < h; j++) for (let i = 0; i < larguraLote(E); i++) r.push({ x: E.x + i, y: E.y + j }); return r; };
// As que não saem do quadro de Serviços (a capina, as obras da Prefeitura): registradas pelos outros scripts.
const EMPREITAS_EXTRAS = {};
// As fundações avulsas saíram do quadro (o Bairro Novo: fundação só onde vira casa); ficam aqui para o save antigo terminar.
for (const id of ['baldrame', 'baldrame_concreto', 'sapata_corrida']) { EMPREITAS_EXTRAS[id] = Object.assign(EMPREITAS_LONGAS[id], { antiga: true }); delete EMPREITAS_LONGAS[id]; }
const dadosEmpreita = id => EMPREITAS_CURTAS[id] || EMPREITAS_LONGAS[id] || EMPREITAS_EXTRAS[id] || null;
const CLIENTE_NOME = { lourival: 'Seu Lourival', juca: 'Tio Juca', zelia: 'Dona Zélia', ananias: 'Seu Ananias', tonico: 'Seu Tonico', cida: 'Dona Cida', rosa: 'Rosa', bento: 'Seu Bento do Mercado', ze: 'Zé', bira: 'Mestre Bira' };
const NOME_DIA = { pa: 'pá', colher: 'colher', regador: 'regador', machado: 'machado', foice: 'foice' };
// Ganchos de quem quer saber da entrega (a Prefeitura dá o prêmio): (id, qualidade) → texto para o resumo ou ''.
const AO_ENTREGAR = [];
// Ganchos que completam G.empreitas ao iniciar (a Prefeitura, as cartas, o Tião): (save) → nada.
const AO_INICIAR_EMPREITAS = [];

const Empreitas = {
  RESERVA: 3,
  iniciar(s) {
    const e = s.empreitas || {};
    G.empreitas = { feitas: Object.assign({}, e.feitas || {}), dia: e.dia || 0, quadro: (e.quadro || []).slice(), aceitas: JSON.parse(JSON.stringify(e.aceitas || {})), entregues: e.entregues || 0, reputacao: Object.assign({}, e.reputacao || {}), capina: e.capina ? JSON.parse(JSON.stringify(e.capina)) : null, caprichados: e.caprichados || 0, labia: e.labia || 0, receitasExtras: (e.receitasExtras || []).slice(),
      semana: Object.assign({}, e.semana || {}), vistos: Object.assign({}, e.vistos || {}), consertados: Object.assign({}, e.consertados || {}),   // (consertados: o dia do último conserto de cada serviço curto: as tábuas novas do píer)   // (dia cheio: o dia em que cada serviço foi aceito e apareceu no quadro)
      // (15/10, T2) O último dia em que cada pedido apareceu no quadro (o peso do sorteio) e o dia anterior a esse (para o sorteio
      // do mesmo dia dar igual se o quadro for refeito). O save antigo começa com o `vistos` (o que se sabe da semana).
      ultimaVez: Object.assign({}, e.ultimaVez || e.vistos || {}), penultima: Object.assign({}, e.penultima || {}) };
    // Save antigo (etapas 2 a 5): a longa aceita já tinha gastado o material, então segue em obra (ou pronta) de onde parou.
    for (const id in G.empreitas.aceitas) {
      const a = G.empreitas.aceitas[id], E = dadosEmpreita(id) && dadosEmpreita(id).tipo === 'longa' ? dadosEmpreita(id) : null;
      if (!E || a.estado) continue;
      Object.assign(a, { estado: a.dias >= E.dias ? 'pronta' : 'obra', aditivo: '', porTiao: 0, carta: false, prefeitura: false, lista: E.etapas.slice() });
    }
    for (const f of AO_INICIAR_EMPREITAS) f(s);
  },
  salvar(s) { s.empreitas = JSON.parse(JSON.stringify(G.empreitas)); },
  funcao() { return G.obra ? G.obra.funcao : 0; },
  limite() { return Empreitas.funcao() >= 3 ? 2 : 1; },
  // As longas aceitas (do quadro, das cartas, do bairro) contam no limite; a Prefeitura e a capina não.
  longasContadas() { return Object.keys(G.empreitas.aceitas).filter(k => { const E = dadosEmpreita(k), a = G.empreitas.aceitas[k]; return E && E.tipo === 'longa' && !a.prefeitura && !E.familia; }).length; },
  libera(id) {
    const E = dadosEmpreita(id);
    if (!E || Empreitas.funcao() < E.funcaoMin) return false;
    if (E.precisa && !E.precisa()) return false;   // (o carrinho do Zé: só com carrinho no canteiro da vez)
    return !E.hab || typeof Habilidades === 'undefined' || Habilidades.nivel(E.hab.h) >= E.hab.n;
  },
  // 2 a 4 pedidos (mais com a reputação), fixos pelo dia; pelo menos uma longa quando a função já libera.
  quadroDoDia(dia) {
    if (typeof Guia !== 'undefined' && !Guia.liberado('quadro')) return [];   // o quadro de serviços chega com o guia (Frente 4)
    const f = mulberry(dia * 6151 + 11), n = Empreitas.faixa().pedidos;
    // (dia cheio, Frente A: "no terceiro dia as tarefas do quadro já se repetiram") Como o Help Wanted do Stardew (um pedido de cada
    // vez, sem repetir): o serviço aceito nesta semana não volta ao quadro na mesma semana; e o que já apareceu nesta semana só volta
    // quando não há nenhum outro liberado (o pedido ainda de pé). Tudo feito: o quadro fica vazio até a semana que vem.
    const sem = d => Math.floor((d - 1) / 7), hist = G.empreitas.semana || {}, vistos = G.empreitas.vistos || {};
    const naSemana = (h, id) => !!h[id] && h[id] < dia && sem(h[id]) === sem(dia);
    const livre = id => Empreitas.libera(id) && !G.empreitas.aceitas[id] && !naSemana(hist, id) && (typeof Mundo === 'undefined' || Mundo.aberto(dadosEmpreita(id).mapa));   // só lugar já aberto (teste de 12/10)
    const curtas = Object.keys(EMPREITAS_CURTAS).filter(livre), longas = Object.keys(EMPREITAS_LONGAS).filter(livre);
    if (!G.empreitas.capina && Empreitas.libera('capina_ananias')) curtas.push('capina_ananias');
    // (15/10, T2: "as missões diárias do quadro andam se repetindo muito") O sorteio variado:
    // - peso pelo tempo sem aparecer: 1 + min(14, dias desde a última vez); quem nunca apareceu vale 15 (o mais antigo volta primeiro);
    // - no máximo 1 cartão por cliente no dia, contando o recado do dia já guardado (só lê G.recados: o recado é que pergunta ao quadro);
    // - ferramentas variadas: o 2º evita a ferramenta do 1º (pá, machado, picareta, foice, carga);
    // - o que apareceu ontem ou anteontem fica para depois (na virada da semana, o "já visto" zera e o de ontem voltava);
    // - sem opção, a regra cede (primeiro a da ferramenta, depois a do cliente, por último a de ontem) para o quadro não ficar
    //   vazio à toa.
    // Fim de ano: as reformas pesam em dobro.
    const fim = Empreitas.emFimDeAno(dia), peso = id => { const u = Empreitas.ultimaAntes(id, dia), E = EMPREITAS_LONGAS[id];
      return (u ? 1 + Math.min(14, dia - u) : 15) * (fim && E && E.reforma ? 2 : 1); };
    const cli = id => dadosEmpreita(id).cliente, fer = id => dadosEmpreita(id).ferramenta;
    const rec = G.recados && G.recados.dia === dia && G.recados.doDia && typeof PEDIDOS_VILA !== 'undefined' ? PEDIDOS_VILA[G.recados.doDia] : null;
    const sorteia = (cs, ls) => { const r = [], clientes = new Set(rec ? [rec.cliente] : []), ferramentas = new Set();
      // as regras, da mais forte à mais fraca: as 8 combinações de (não é de ontem, cliente novo, ferramenta nova), cedendo de trás para a frente
      const ok = [id => { const u = Empreitas.ultimaAntes(id, dia); return !u || u < dia - 2; },id => !clientes.has(cli(id)), id => !ferramentas.has(fer(id))];
      const regras = [7, 6, 5, 4, 3, 2, 1, 0].map(m => id => ok.every((t, i) => !(m & (4 >> i)) || t(id)));
      const tira = pool => { const op = pool.filter(regras.find(regra => pool.some(regra))), soma = op.reduce((t, id) => t + peso(id), 0);
        let v = f() * soma, id = op[op.length - 1]; for (const k of op) { v -= peso(k); if (v < 0) { id = k; break; } }
        pool.splice(pool.indexOf(id), 1); r.push(id); clientes.add(cli(id)); ferramentas.add(fer(id)); };
      if (ls.length) tira(ls);   // a longa continua garantida quando a função já libera
      const pool = cs.concat(ls);
      while (r.length < n && pool.length) tira(pool);
      return r; };
    const novo = id => !naSemana(vistos, id), novas = sorteia(curtas.filter(novo), longas.filter(novo));
    return novas.length ? novas : sorteia(curtas, longas);
  },
  // O último dia ANTES de `dia` em que o pedido apareceu no quadro (0: nunca). O quadro refeito no mesmo dia lê o anterior.
  ultimaAntes(id, dia) {
    const u = (G.empreitas.ultimaVez || {})[id], p = (G.empreitas.penultima || {})[id];
    return u && u < dia ? u : p && p < dia ? p : 0;
  },
  // O quadro de hoje no save, anotando o dia em que cada pedido apareceu pela primeira vez na semana (o "já visto" do quadroDoDia)
  // e o último dia em que apareceu (o peso do sorteio).
  poeQuadro(dia) {
    G.empreitas.dia = dia; G.empreitas.quadro = Empreitas.quadroDoDia(dia);
    const v = G.empreitas.vistos || (G.empreitas.vistos = {});
    for (const id of G.empreitas.quadro) if (!v[id] || Math.floor((v[id] - 1) / 7) !== Math.floor((dia - 1) / 7)) v[id] = dia;
    const u = G.empreitas.ultimaVez || (G.empreitas.ultimaVez = {}), p = G.empreitas.penultima || (G.empreitas.penultima = {});
    for (const id of G.empreitas.quadro) if (u[id] !== dia) { if (u[id] && u[id] < dia) p[id] = u[id]; u[id] = dia; }
  },
  // Mestre de obras: as empreitas pedem 20% menos material (arredondando para cima).
  material(id) { const E = dadosEmpreita(id), f = typeof Habilidades !== 'undefined' && Habilidades.tem('mestre_de_obras') ? 0.8 : 1, r = {}; for (const m in E.material) r[m] = Math.ceil(E.material[m] * f); return r; },
  // Aceitar: a curta começa; a longa fica reservada (não gasta nada).
  aceitar(id, mochila, dinheiro, opc = {}) {
    const E = dadosEmpreita(id);
    if (!E) return 'nao';
    if (G.empreitas.aceitas[id]) return 'ja';
    if (!opc.prefeitura && !opc.familia && !Empreitas.libera(id)) return 'funcao';
    if (E.tipo === 'capina') { if (G.empreitas.capina) return 'ja'; G.empreitas.capina = { dia: G.dia, estacao: Math.floor((G.dia - 1) / 28) % 4, pos: [], limpo: false, nasceu: 0 }; G.empreitas.quadro = G.empreitas.quadro.filter(x => x !== id); return 'ok'; }
    if (E.tipo === 'longa') {
      if (!opc.prefeitura && !opc.familia && Empreitas.longasContadas() >= Empreitas.limite()) return 'limite';
      G.empreitas.aceitas[id] = { tipo: 'longa', estado: 'reservada', dia: G.dia, dias: 0, feitoHoje: 0, trabalhou: false, aditivo: '', porTiao: 0, carta: !!opc.carta, prefeitura: !!opc.prefeitura, lista: [] };
    } else G.empreitas.aceitas[id] = { tipo: 'curta', dia: G.dia, vezes: 0 };
    G.empreitas.quadro = G.empreitas.quadro.filter(x => x !== id);
    (G.empreitas.semana || (G.empreitas.semana = {}))[id] = G.dia;   // (não volta ao quadro nesta semana)
    return 'ok';
  },
  // As ferramentas dos dias; o acelerador (o Speed-Gro) tira 25%, começando pelos de regador (fica pelo menos 1).
  listaDias(id, aditivo = '') {
    const l = dadosEmpreita(id).etapas.slice();
    if (aditivo !== 'acelerador') return l;
    for (let k = Math.floor(l.length * 0.25); k > 0 && l.length > 1; k--) {
      const i = l.filter(x => x === 'regador').length > 1 ? l.lastIndexOf('regador') : l.length - 1;
      l.splice(i, 1);
    }
    return l;
  },
  // Começar (o plantar): o material sai da mochila e a obra começa no dia 0.
  comecar(id, mochila) {
    const a = G.empreitas.aceitas[id];
    if (!a || a.estado !== 'reservada') return 'estado';
    const mat = Empreitas.material(id);
    for (const m in mat) if (mochila.total(m) < mat[m]) return 'material';
    const custo = dadosEmpreita(id).custo || 0;   // a casa da família e os aluguéis custam dinheiro (não pagam)
    if (custo && G.dinheiro < custo) return 'dinheiro';
    for (const m in mat) mochila.remover(m, mat[m]);
    if (custo) { G.dinheiro -= custo; G.gastoHoje = (G.gastoHoje || 0) + custo; }
    Object.assign(a, { estado: 'obra', dias: 0, feitoHoje: 0, trabalhou: false, lista: Empreitas.listaDias(id, a.aditivo) });
    return 'ok';
  },
  ferramentaHoje(id) { const a = G.empreitas.aceitas[id]; return a && a.estado === 'obra' ? a.lista[a.dias] || '' : ''; },
  // Na chuva: o concreto não pega (pá e colher) e o dia de pintar espera. (15/10, T4) A lona encerada na plaquinha segura os dois.
  impedeHoje(id, chove) {
    if (!chove) return '';
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id], f = Empreitas.ferramentaHoje(id);
    if (a && a.lona) return '';
    if (E.concreto && (f === 'pa' || f === 'colher')) return 'concreto';
    if (E.pintura && a && a.estado === 'obra' && a.dias === a.lista.length - 1) return 'pintura';
    return '';
  },
  // Mão firme: o dia de pá ou de colher sai com 1 golpe. (15/10, T4) A Pá firme (Alvenaria) e a Colher leve (Acabamento): com 2.
  golpesDoDia(id) {
    const f = Empreitas.ferramentaHoje(id), H = typeof Habilidades !== 'undefined' ? Habilidades : null;
    if (!H || (f !== 'pa' && f !== 'colher')) return 3;
    if (H.tem('mao_firme')) return 1;
    return (f === 'pa' && H.ganho('pa_firme')) || (f === 'colher' && H.ganho('colher_leve')) ? ECO.niveis.golpesLeves : 3;
  },
  // (15/10, T4) O dia que a manta de cura faz sozinha (o aspersor do Stardew): a manta, os de regador; a manta boa, os de regador e de pá.
  // Na chuva, a manta não faz o concreto pegar (nem a pintura secar): esse dia só anda com a LONA (impedeHoje).
  autoHoje(id, chove = typeof Clima !== 'undefined' && Clima.chove(G.dia)) { const a = G.empreitas.aceitas[id], f = Empreitas.ferramentaHoje(id); return !!a && !!a.cura && (CUIDADOS[a.cura] || []).includes(f) && !Empreitas.impedeHoje(id, chove); },
  trabalhar(id, ferr) {
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
    if (!E || !a) return 'nao';
    if (E.tipo === 'longa') {
      if (a.estado !== 'obra') return 'estado';
      if (a.trabalhou) return 'feito_hoje';
      const chuva = Empreitas.impedeHoje(id, typeof Clima !== 'undefined' && Clima.chove(G.dia));
      if (chuva) return chuva;
      const hoje = Empreitas.ferramentaHoje(id);
      if (Empreitas.autoHoje(id)) return 'manta';   // (a manta cuida: à noite o dia avança sozinho)
      if (ferr !== hoje) return 'ferramenta';
      a.feitoHoje++;
      if (a.feitoHoje >= Empreitas.golpesDoDia(id)) a.trabalhou = true;
      // (15/10, T2) O dia de regador (a cura) e o de colher numa reforma ou pintura são acabamento, como o lavar e o pintar da obra.
      const acab = hoje === 'regador' || (hoje === 'colher' && (E.reforma || E.pintura));
      if (typeof Habilidades !== 'undefined') Habilidades.ganhar(acab ? 'acabamento' : hoje === 'colher' || hoje === 'pa' ? 'alvenaria' : 'folego', a.trabalhou ? 5 : 1);
      return 'ok';
    }
    if (ferr !== E.ferramenta) return 'ferramenta';
    for (const m in E.material) if (G.mochila.total(m) < E.material[m]) return 'material';
    a.vezes++;
    if (typeof Habilidades !== 'undefined') Habilidades.ganhar(E.ferramenta === 'pa' ? 'alvenaria' : 'folego', 2);
    if (a.vezes < E.vezes) return 'ok';
    for (const m in E.material) G.mochila.remover(m, E.material[m]);
    const v = Empreitas.pagaBase(id); G.dinheiro += v; G.ganhoHoje = (G.ganhoHoje || 0) + v;
    Empreitas._entregou(id);
    return 'pronta';
  },
  // Entregar (o colher): o cliente paga à noite.
  entregar(id) { const a = G.empreitas.aceitas[id]; if (!a || a.estado !== 'pronta') return 'estado'; a.estado = 'entregue'; return 'ok'; },
  textoEstado(id) {
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
    if (!E || !a) return '';
    if (E.tipo !== 'longa') return 'em andamento';
    const prazo = a.prefeitura && a.estado !== 'entregue' ? ` · entregar até ${DIAS[(a.dia + 5) % 7]}` : '';
    if (a.estado === 'reservada') return (E.familia ? `começar com o material e Cr$ ${E.custo}` + (G.dinheiro < E.custo ? ` (você tem Cr$ ${Math.floor(G.dinheiro)})` : '') : a.prefeitura ? 'aceita: começar com o material' : `reservada: começar até ${DIAS[(a.dia + Empreitas.RESERVA - 2) % 7]}`) + prazo;
    if (a.estado === 'obra') { const f = Empreitas.ferramentaHoje(id); return `dia ${a.dias + 1}/${a.lista.length}: ${a.trabalhou ? 'hoje feito' : Empreitas.autoHoje(id) ? `hoje a ${Itens.nome(a.cura).toLowerCase()} cuida sozinha` : 'hoje é dia de ' + (NOME_DIA[f] || f)}` + prazo; }
    if (a.estado === 'pronta') return 'pronta: entregar na plaquinha' + prazo;
    return E.familia ? 'terminada: à noite a família vê a obra nova' : 'entregue: paga à noite';
  },
  _entregou(id, q = 1) {
    const E = dadosEmpreita(id);
    delete G.empreitas.aceitas[id];
    if (E.tipo === 'curta') (G.empreitas.consertados || (G.empreitas.consertados = {}))[id] = G.dia;
    // A obra fica no mapa (muros, pisos, cerca, quiosque, ponte); a fundação sozinha não (ela é o começo de uma casa).
    // As obras da família (a casa e os aluguéis) não contam como serviço: nem feitas, nem entregues, nem reputação.
    if (!E.familia) {
      if (E.tipo === 'longa' && !E.fundacao && !E.bairro) G.empreitas.feitas[id] = q;
      G.empreitas.entregues++;
      if (q >= 1.5) G.empreitas.caprichados = (G.empreitas.caprichados || 0) + 1;
      G.empreitas.reputacao[E.cliente] = (G.empreitas.reputacao[E.cliente] || 0) + 1;
      // +50 de amizade com o cliente (a família não tem número; a Lábia, 50% a mais, vale dentro do Amizade.ganhar)
      if (typeof Amizade !== 'undefined') Amizade.ganhar(E.cliente, 'servico', 'servico');
    }
    return AO_ENTREGAR.map(f => f(id, q)).filter(Boolean);
  },
  // A noite: a reserva vence; o dia cuidado (ou o de regador na chuva) avança; a entregue paga.
  noite(chove) {
    const r = [];
    for (const id of Object.keys(G.empreitas.aceitas)) {
      const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
      if (!E || E.tipo !== 'longa') continue;
      if (a.estado === 'reservada') {
        if (!a.prefeitura && !E.familia && G.dia >= a.dia + Empreitas.RESERVA - 1) {   // a obra da família espera o tempo que precisar
          delete G.empreitas.aceitas[id]; r.push({ id, desistiu: true }); }
        continue;
      }
      if (a.estado === 'obra') {
        if (a.trabalhou || (chove && Empreitas.ferramentaHoje(id) === 'regador') || Empreitas.autoHoje(id, chove)) a.dias++;
        a.feitoHoje = 0; a.trabalhou = false;
        if (a.dias >= a.lista.length) a.estado = 'pronta';
        r.push({ id, entregue: false, dias: a.dias, pronta: a.estado === 'pronta' });
        continue;
      }
      if (a.estado === 'entregue') {
        const q = Empreitas.qualidade(mulberry(G.dia * 977 + id.length), ADITIVOS[a.aditivo] || 0, a.porTiao * 2 > a.lista.length), valor = Empreitas.pagamento(id, a, q);
        G.dinheiro += valor;
        r.push({ id, entregue: true, valor, qualidade: q, extra: Empreitas._entregou(id, q) });
      }
    }
    return r;
  },
};
// A capina do terreno do Seu Ananias (a cultura que rebrota do Stardew): aceita uma vez; a cada 3 dias 6 matos nascem
// no terreno; limpo, paga à noite (o valor do ECO); acaba na troca de estação. Não conta no limite de longas.
EMPREITAS_EXTRAS.capina_ananias = { nome: 'Capina do terreno do Seu Ananias', cliente: 'ananias', mapa: 'vila', x: 11, y: 3, junto: 'deposito', material: {}, ferramenta: 'foice', paga: ECO.empreitas.paga.capina_ananias, funcaoMin: 0, tipo: 'capina', matos: 6, cada: 3 };
Object.assign(Empreitas, {
  // O fim de ano: a última semana da Primavera e as duas primeiras do Verão (reformas antes do Natal).
  emFimDeAno(dia) { const est = Math.floor((dia - 1) / 28) % 4, d = (dia - 1) % 28 + 1; return (est === 2 && d >= 22) || (est === 3 && d <= 14); },
  fatorEpoca(id, dia = G.dia) { const E = dadosEmpreita(id); return E && E.reforma && Empreitas.emFimDeAno(dia) ? 1.2 : 1; },
  capinaNasce(dia) { const c = G.empreitas.capina; return !!c && (dia - c.dia) % EMPREITAS_EXTRAS.capina_ananias.cada === 0; },
  capinaNoite() {
    const c = G.empreitas.capina; if (!c || !c.limpo) return 0;
    c.limpo = false; const v = Empreitas.pagaBase('capina_ananias'); G.dinheiro += v; Empreitas._entregou('capina_ananias', 1); return v;
  },
});
// Os aditivos (o adubo do Stardew): cal e impermeabilizante melhoram a qualidade (nível 1 e 2); o acelerador (o Speed-Gro)
// encurta a obra. Um por obra, antes de começar ou no dia 0 sem golpe.
const ADITIVOS = { cal: 1, impermeabilizante: 2, acelerador: 0 };
// (15/10, T4) Os cuidados do lote (receitas dos níveis), na plaquinha como o aditivo, mas à parte dele e a qualquer hora antes de
// ficar pronta: a manta de cura (Acabamento 3) e a manta boa (Alvenaria 7) fazem sozinhas os dias de CUIDADOS; a lona encerada
// (Acabamento 6) deixa trabalhar na chuva. Uma de cada por empreita (gasta o item).
const CUIDADOS = { manta: ['regador'], manta_boa: ['regador', 'pa'] };
const NOME_QUALIDADE = { 1: 'normal', 1.25: 'bom', 1.5: 'caprichado', 2: 'impecável' };
// A Fala da Vila (as faixas de reputação): mais pedidos e pagamento melhor.
const FAIXAS_VILA = [
  { nome: 'Biscateiro', entregues: 0, caprichados: 0, pedidos: 2, fator: ECO.empreitas.faixas[0] },
  { nome: 'Pedreiro de confiança', entregues: 8, caprichados: 0, pedidos: 3, fator: ECO.empreitas.faixas[1] },
  { nome: 'Mestre da Vila', entregues: 20, caprichados: 5, pedidos: 4, fator: ECO.empreitas.faixas[2] },
];
Object.assign(Empreitas, {
  aplicarAditivo(id, aditivo, mochila) {
    const a = G.empreitas.aceitas[id];
    if (!a || a.tipo !== 'longa' || !(aditivo in ADITIVOS)) return 'nao';
    if (a.aditivo) return 'ja';
    if (!(a.estado === 'reservada' || (a.estado === 'obra' && a.dias === 0 && a.feitoHoje === 0 && !a.trabalhou))) return 'tarde';
    if (aditivo === 'acelerador' && Empreitas.listaDias(id, 'acelerador').length === dadosEmpreita(id).etapas.length) return 'curta';
    if (mochila.total(aditivo) < 1) return 'falta';
    mochila.remover(aditivo, 1); a.aditivo = aditivo;
    if (a.estado === 'obra') a.lista = Empreitas.listaDias(id, aditivo);
    return 'ok';
  },
  aplicarCuidado(id, item, mochila) {
    const a = G.empreitas.aceitas[id];
    if (!a || a.tipo !== 'longa' || !(item in CUIDADOS || item === 'lona')) return 'nao';
    if (!(a.estado === 'reservada' || a.estado === 'obra')) return 'tarde';
    if (item === 'lona' ? a.lona : a.cura) return 'ja';
    if (mochila.total(item) < 1) return 'falta';
    mochila.remover(item, 1);
    if (item === 'lona') a.lona = true; else a.cura = item;
    return 'ok';
  },
  // A fórmula do Stardew para o ouro, com Acabamento no lugar de Farming e o aditivo no lugar do adubo (empreitadas.gd);
  // o impecável (o irídio) só com o impermeabilizante, a metade da chance (com o Impecável do Acabamento 9, 0,75).
  qualidade(rng = Math.random, F = 0, semImpecavel = false) {
    if (Empreitas.funcao() < 2) return 1;
    const A = typeof Habilidades !== 'undefined' ? Habilidades.nivel('acabamento') : 0, ouro = 0.2 * (A / 10) + 0.2 * F * ((A + 2) / 12) + 0.01, r = rng();
    if (F >= 2 && r < ouro * (typeof Habilidades !== 'undefined' && Habilidades.ganho('impecavel') ? ECO.niveis.impecavel : 0.5)) return semImpecavel ? 1.5 : 2;
    if (r < ouro) return 1.5;
    return rng() < Math.min(0.75, ouro * 2) ? 1.25 : 1;
  },
  faixa() {
    let i = 0;
    for (let k = 1; k < FAIXAS_VILA.length; k++) if (G.empreitas.entregues >= FAIXAS_VILA[k].entregues && (G.empreitas.caprichados || 0) >= FAIXAS_VILA[k].caprichados) i = k;
    return Object.assign({ i }, FAIXAS_VILA[i]);
  },
  pagamento(id, a, q, dia = G.dia) {
    const E = dadosEmpreita(id);
    if (E.familia) return 0;   // as obras da família não são pagas (nem a gorjeta do Artista)
    return Math.round(E.paga * q * Empreitas.fatorEpoca(id, dia) * Empreitas.faixa().fator * Empreitas.fatorServico(id) * (a && a.carta ? ECO.empreitas.carta : 1)) + (q > 1 && typeof Habilidades !== 'undefined' && Habilidades.tem('artista') ? 50 : 0);
  },
  // (T4b, Negócio 7) O cartaz na padaria: os serviços do quadro (não a obra da família nem o pedido da Prefeitura) pagam 10% a mais.
  fatorServico(id) { const E = dadosEmpreita(id); return E && !E.familia && E.cliente !== 'prefeitura' && typeof Habilidades !== 'undefined' && Habilidades.ganho('cartaz_padaria') ? 1 + ECO.niveis.servicos : 1; },
  // O que o quadro mostra e a curta e a capina pagam: o valor do ECO com o cartaz.
  pagaBase(id) { return Math.round(dadosEmpreita(id).paga * Empreitas.fatorServico(id)); },
});
INICIADORES.push(s => Empreitas.iniciar(s));
COLETORES.push(s => Empreitas.salvar(s));
