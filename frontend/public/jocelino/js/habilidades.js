// Jocelino — habilidades.js — as habilidades que sobem fazendo (as do Stardew; habilidades.gd do Godot): Fôlego,
// Alvenaria, Acabamento, Negócio e Roça (a horta), do nível 1 ao 10. Cada nível tira um pouco da energia gasta pela ferramenta ligada
// (Fôlego: machado, picareta, foice; Alvenaria: pá; Roça: regador) e o Negócio dá +1% no que se vende. Nos níveis
// 5 e 10 o jogador escolhe uma de duas vantagens (a do 10 sai do ramo escolhido no 5): 4 caminhos por habilidade.
// As vantagens da obra (diária, tijolos, aluguel...) ficam guardadas e passam a valer quando a obra chegar.

const NOMES_HAB = { folego: 'Fôlego', alvenaria: 'Alvenaria', acabamento: 'Acabamento', negocio: 'Negócio', roca: 'Roça', pesca: 'Pesca' };
const BONUS_NIVEL = { folego: 'machado, picareta e foice cansam menos', alvenaria: 'pá e alvenaria cansam menos', acabamento: 'lavar, rebocar e pintar cansam menos (na obra e nas empreitas de reforma e pintura); a empreita caprichada sai mais vezes (de Pedreiro em diante)', negocio: '+1% no que recebe e vende', roca: 'regador e horta cansam menos', pesca: 'a barra de pesca fica maior e lançar cansa menos' };
const OPCOES_5 = { folego: ['braco_forte', 'pe_ligeiro'], alvenaria: ['mao_firme', 'olho_de_prumo'], acabamento: ['capricho', 'limpinho'], negocio: ['fregues', 'pechincha'], roca: ['feirante', 'agronomo'], pesca: ['pescador', 'armadilheiro'] };
const OPCOES_10 = {
  braco_forte: ['incansavel', 'carregador'], pe_ligeiro: ['cafe_no_sangue', 'maratonista'], mao_firme: ['mestre_de_obras', 'empreiteiro'],
  olho_de_prumo: ['fama', 'prumo_de_ouro'], capricho: ['artista', 'pintor'], limpinho: ['organizado', 'faxineiro'], fregues: ['patrao', 'cliente_vip'], pechincha: ['labia', 'atravessador'],
  feirante: ['atacadista', 'tempero_da_roca'], agronomo: ['mao_verde', 'rega_de_mestre'],
  pescador: ['mestre_do_pier', 'cacador_de_tesouro'], armadilheiro: ['marinheiro', 'isqueiro'],
};
const VANTAGENS = {
  braco_forte: ['Braço forte', 'Carrega 10 tijolos de uma vez.'], pe_ligeiro: ['Pé ligeiro', 'Anda 10% mais rápido.'],
  incansavel: ['Incansável', 'Se apagar às 2h, acorda com energia cheia.'], carregador: ['Carregador', 'Carrega 15 tijolos e 8 entulhos de uma vez.'],
  cafe_no_sangue: ['Café no sangue', 'Comida rende o dobro de energia.'], maratonista: ['Maratonista', 'Anda mais 10% (20% no total).'],
  mao_firme: ['Mão firme', 'Valas e alicerce em 3 ladrilhos por golpe.'], olho_de_prumo: ['Olho de prumo', '+Cr$ 5 na diária.'],
  mestre_de_obras: ['Mestre de obras', 'As empreitas pedem 20% menos material.'], empreiteiro: ['Empreiteiro', 'Cavar e assentar não gastam energia.'],
  fama: ['Fama', 'Os extras pagam o dobro.'], prumo_de_ouro: ['Prumo de ouro', '+Cr$ 10 na diária (Cr$ 15 no total).'],
  capricho: ['Capricho', 'Na obra, lavar, rebocar e pintar contam 3 por vez.'], limpinho: ['Limpinho', 'Entulho dá ferro velho mais vezes.'],
  artista: ['Artista', 'Obra terminada dá Cr$ 50 de gorjeta.'], pintor: ['Pintor de mão cheia', 'Na obra, lavar, rebocar e pintar contam 5 por vez.'],
  organizado: ['Organizado', 'Carregar coisas na obra conta em dobro.'], faxineiro: ['Faxineiro', 'Limpar mato, galho e entulho dá experiência em dobro.'],
  fregues: ['Freguês', '10% de desconto no Ananias e no Tonico.'], pechincha: ['Pechincha', 'Vende 25% mais caro.'],
  patrao: ['Patrão', 'Aluguel rende 50% a mais.'], cliente_vip: ['Cliente VIP', 'Mais 10% de desconto (20% no total).'],
  labia: ['Lábia', 'Amizade sobe 50% mais rápido.'], atravessador: ['Atravessador', 'Vende 50% mais caro (em vez de 25%).'],
  feirante: ['Feirante', 'A colheita da horta vende 10% mais caro.'], agronomo: ['Agrônomo', 'As plantas ficam prontas em 10% menos dias.'],
  atacadista: ['Atacadista', 'A colheita vende 25% mais caro (em vez de 10%).'], tempero_da_roca: ['Tempero da roça', 'Prato da pensão com ingrediente da horta sai 10% mais caro.'],
  mao_verde: ['Mão verde', 'Colheita caprichada muito mais vezes (como se toda cova tivesse esterco).'], rega_de_mestre: ['Rega de mestre', 'O regador molha 3 covas em linha.'],
  pescador: ['Pescador', 'Peixe vende 25% mais caro.'], armadilheiro: ['Armadilheiro', 'O covo dá 2 coisas em 1 de cada 4 manhãs.'],
  mestre_do_pier: ['Mestre do píer', 'Peixe vende 50% mais caro (em vez de 25%).'], cacador_de_tesouro: ['Caçador de tesouro', 'O baú aparece o dobro de vezes na pesca.'],
  marinheiro: ['Marinheiro', 'O covo nunca dá lixo.'], isqueiro: ['Isqueiro', 'O covo funciona sem isca.'],
};
// As que já valem nesta etapa (as outras esperam a obra, a casa e os aluguéis).
const VALE_AGORA = ['pe_ligeiro', 'maratonista', 'incansavel', 'cafe_no_sangue', 'faxineiro', 'pechincha', 'atravessador', 'fregues', 'cliente_vip',
  'braco_forte', 'carregador', 'olho_de_prumo', 'prumo_de_ouro', 'fama', 'organizado', 'capricho', 'pintor', 'artista', 'limpinho',
  'mao_firme', 'empreiteiro', 'mestre_de_obras', 'labia', 'feirante', 'agronomo', 'atacadista', 'tempero_da_roca', 'mao_verde', 'rega_de_mestre',
  'pescador', 'armadilheiro', 'mestre_do_pier', 'cacador_de_tesouro', 'marinheiro', 'isqueiro'];
const FERRAMENTA_HAB = { machado: 'folego', picareta: 'folego', foice: 'folego', vara: 'pesca', vara_boa: 'pesca', molinete: 'pesca', pa: 'alvenaria', colher: 'alvenaria', regador: 'roca',
  mangueira: 'acabamento', rolo: 'acabamento' };   // (15/10: a mangueira lava e o rolo pinta a obra; só servem no acabamento)
// (15/10, T2) O trabalho de acabamento cansa menos com o Acabamento: lavar (mangueira), pintar (rolo) e rebocar na obra do Bira e o
// regador e a colher no lote de uma empreita longa de reforma ou pintura usam o MAIOR entre o nível da habilidade da ferramenta e o
// de Acabamento (ninguém perde).
function golpeDeAcabamento(id, alvo) {
  if (id === 'mangueira' || id === 'rolo') return true;
  if ((id !== 'regador' && id !== 'colher') || !alvo || !G.mapa || !G.mapa.ocupado || typeof chaveT !== 'function') return false;
  const o = G.mapa.ocupado.get(chaveT(alvo.x, alvo.y)); if (!o) return false;
  if (o.obraId && typeof obraDaVez === 'function' && obraDaVez(o)) {
    if (id === 'regador') return false;   // (15/10) a obra não se molha mais: o regador ali não é trabalho
    const l = typeof listaDeHoje === 'function' ? listaDeHoje() : null;   // a colher assenta tijolo (Alvenaria) enquanto a lista pede
    return !(l && l.metas && l.metas.assentar && (l.feito.assentar || 0) < l.metas.assentar);
  }
  const E = typeof dadosEmpreita === 'function' && (o.empreita || o.placaDe) ? dadosEmpreita(o.empreita || o.placaDe) : null;
  return !!(E && E.tipo === 'longa' && (E.reforma || E.pintura));
}

// (15/10, T3) O que cada nível dá (a tabela da spec docs/superpowers/specs/2026-10-15-niveis-recompensa.md, seção 2.2), num lugar só.
// Cada linha: { nome, frase, icone (ícone de itens/) } e o tipo:
//  - receita / melhoria: o ganho novo da tabela; `t4: true` = o efeito ainda não está no jogo (a T4 liga e tira o t4). Até lá a
//    tela não mostra a linha: nada de prometer o que o jogo não faz. O `id` é por onde o jogo pergunta (o nível MORA aqui): a receita
//    de Fabricar com esse id (Habilidades.nivelDaReceita) e a melhoria (Habilidades.ganho(id), falso enquanto a linha tiver t4);
//  - empreita (id): a empreita que o nível já libera no quadro; receitaExiste (id): a receita de Fabricar que já existe;
//    degrau (função da obra): o requisito de Alvenaria que já existe; loja: o que já passa a ser vendido; vantagem: a escolha do 5 e do 10.
const _V = { tipo: 'vantagem' };
const NIVEIS_RECOMPENSA = {
  folego: {
    1: [{ tipo: 'receita', id: 'bau', nome: 'Baú', frase: 'Faça o baú onde estiver, sem ir ao Tio Juca. Guarda 36 coisas.', icone: 'bau' }],
    2: [{ tipo: 'receita', id: 'escada_corda', nome: 'Escada de corda', frase: 'Na pedreira funda, desce uma bancada na hora.', icone: 'escada_corda' }],
    3: [{ tipo: 'melhoria', id: 'pedra_de_sobra', nome: 'Pedra de sobra', frase: 'Pedra e pedregulho dão 1 pedra a mais 1 vez em cada 4.' }],
    4: [{ tipo: 'melhoria', id: 'faro_de_catador', nome: 'Faro de catador', frase: 'Mais 1 achado por dia na praia, na mata e na serra.' }],
    5: [_V],
    6: [{ tipo: 'melhoria', id: 'olho_de_pedreira', nome: 'Olho de pedreira', frase: 'A escada escondida aparece 50% mais nas rochas.' }],
    7: [{ tipo: 'receita', id: 'tronco_cogumelo', nome: 'Tronco de cogumelo', frase: 'No quintal, dá 1 cogumelo a cada 3 dias. Até 4 troncos.', icone: 'tronco_cogumelo' }],
    8: [{ tipo: 'melhoria', id: 'lenha_boa', nome: 'Lenha boa', frase: 'Árvore derrubada dá 1 madeira a mais.' }],
    9: [{ tipo: 'melhoria', id: 'pulmao_de_pedreira', nome: 'Pulmão de pedreira', frase: 'O ar pesado das bancadas 20+ não cansa mais que o normal.' }],
    10: [_V],
  },
  alvenaria: {
    1: [{ tipo: 'receita', id: 'caminho_pedra', nome: 'Caminho de pedra', frase: 'No quintal, faz caminho. Mato e galho não nascem em cima.', icone: 'caminho_pedra' }],
    2: [{ tipo: 'degrau', funcao: 1 }, { tipo: 'melhoria', id: 'peneira_ligeira', nome: 'Peneira ligeira', frase: 'Peneirar areia na obra conta em dobro.' }],
    3: [{ tipo: 'melhoria', id: 'ombro_de_pedreiro', nome: 'Ombro de pedreiro', frase: 'Na obra, levar pedras e subir telhas contam em dobro.' }],
    4: [{ tipo: 'degrau', funcao: 2 }, { tipo: 'melhoria', id: 'pa_firme', nome: 'Pá firme', frase: 'Nas empreitas, o dia de pá sai com 2 golpes em vez de 3.' }],
    5: [_V, { tipo: 'empreita', id: 'ponte_pedra' }],
    6: [{ tipo: 'degrau', funcao: 3 }],
    7: [{ tipo: 'receita', id: 'manta_boa', nome: 'Manta de cura boa', frase: 'Na plaquinha do lote: faz sozinha os dias de regador e de pá da empreita.', icone: 'manta_boa' }],
    8: [{ tipo: 'empreita', id: 'radier' }],
    9: [{ tipo: 'melhoria', id: 'colher_ligeira', nome: 'Colher ligeira', frase: 'Assentar tijolo na obra conta em dobro.' }],
    10: [_V],
  },
  acabamento: {
    1: [{ tipo: 'receita', id: 'tinta', nome: 'Tinta de cal', frase: 'Uma lata de tinta feita em casa, para muro e parede.', icone: 'tinta' }],
    2: [{ tipo: 'receitaExiste', id: 'cal', frase: 'Cal feita em casa, para o reboco e o aditivo.' }],
    3: [{ tipo: 'empreita', id: 'muro_chapiscado' }, { tipo: 'receita', id: 'manta', nome: 'Manta de cura', frase: 'Na plaquinha do lote: faz sozinha os dias de regador (a cura).', icone: 'manta' }],
    4: [{ tipo: 'empreita', id: 'cimentado_queimado' }, { tipo: 'receita', id: 'lajota', nome: 'Lajota colorida', frase: 'Lajota feita à mão, sem esperar a betoneira.', icone: 'lajota' }],
    5: [_V, { tipo: 'receitaExiste', id: 'impermeabilizante', frase: 'Aditivo forte: muito mais chance de acabamento caprichado.' }],
    6: [{ tipo: 'empreita', id: 'muro_rebocado' }, { tipo: 'receita', id: 'lona', nome: 'Lona encerada', frase: 'Na plaquinha do lote: a chuva não para o concreto nem a pintura (1 por empreita).', icone: 'lona' }],
    7: [{ tipo: 'melhoria', id: 'colher_leve', nome: 'Colher leve', frase: 'Nas empreitas, o dia de colher sai com 2 golpes em vez de 3.' }],
    8: [{ tipo: 'receitaExiste', id: 'acelerador', frase: 'Acelerador de pega: a obra fica pronta em 25% menos dias.' }, { tipo: 'empreita', id: 'ladrilho' }],
    9: [{ tipo: 'melhoria', id: 'impecavel', nome: 'Impecável', frase: 'Com impermeabilizante, o acabamento impecável sai 50% mais vezes.' }],
    10: [_V],
  },
  negocio: {
    1: [{ tipo: 'melhoria', id: 'olho_de_comerciante', nome: 'Olho de comerciante', frase: 'A dica de cada item mostra quanto ele vale na caixa.' }],
    2: [{ tipo: 'melhoria', id: 'prazo_de_amigo', nome: 'Prazo de amigo', frase: 'Os recados do povo têm 1 dia a mais de prazo.' }],
    3: [{ tipo: 'receita', id: 'placa_propaganda', nome: 'Placa de propaganda', frase: 'No quintal: os recados do povo pagam 10% a mais.', icone: 'placa_propaganda' }],
    4: [{ tipo: 'melhoria', id: 'revenda', nome: 'Revenda', frase: 'O Ananias compra de volta cimento, vergalhão, telha, tinta e cal pela metade.' }],
    5: [_V],
    6: [{ tipo: 'melhoria', id: 'fiado', nome: 'Fiado', frase: 'Compra no depósito até Cr$ 300 fiado; paga no domingo à noite.' }],
    7: [{ tipo: 'melhoria', id: 'cartaz_padaria', nome: 'Cartaz na padaria', frase: 'Os serviços do quadro pagam 10% a mais.' }],
    8: [{ tipo: 'melhoria', id: 'freguesia_fiel', nome: 'Freguesia fiel', frase: 'Os recados do povo pagam mais 10% (20% no total com a placa).' }],
    9: [{ tipo: 'melhoria', id: 'fiado_maior', nome: 'Fiado maior', frase: 'O fiado no Ananias vai até Cr$ 1.000.' }],
    10: [_V],
  },
  roca: {
    1: [{ tipo: 'receita', id: 'esterco', nome: 'Esterco curtido', frase: 'Adubo feito com mato seco: mais colheita boa.', icone: 'esterco' }],
    2: [{ tipo: 'receita', id: 'espantalho', nome: 'Espantalho', frase: 'No quintal: as galinhas não bicam as covas a até 4 passos dele.', icone: 'espantalho' }],
    3: [{ tipo: 'melhoria', id: 'regador_maior', nome: 'Regador maior', frase: 'O regador leva 10 de água a mais.' }],
    4: [{ tipo: 'receita', id: 'adubo_peixe', nome: 'Adubo de peixe', frase: 'Conta como esterco e a planta fica pronta 1 dia antes.', icone: 'adubo_peixe' }],
    5: [_V],
    6: [{ tipo: 'melhoria', id: 'colheita_farta', nome: 'Colheita farta', frase: 'A colheita caprichada rende 3 a mais (eram 2).' }],
    7: [{ tipo: 'receita', id: 'sementes_colheita', nome: 'Sementes da colheita', frase: 'Replanta sem ir ao Ananias, até a semente que ele não vende na estação.', icone: 'semente_alface' }],
    8: [{ tipo: 'melhoria', id: 'cova_funda', nome: 'Cova funda', frase: 'O adubo da cova vale também para a plantação seguinte.' }],
    9: [{ tipo: 'receita', id: 'adubo_bom', nome: 'Adubo bom', frase: 'Conta como 2 estercos: muito mais colheita caprichada.', icone: 'adubo_bom' }],
    10: [_V],
  },
  pesca: {
    1: [{ tipo: 'receita', id: 'covo', nome: 'Covo de siri', frase: 'Na água da margem, com isca: de manhã tem siri, caranguejo ou camarão.', icone: 'covo' }],
    2: [{ tipo: 'loja', nome: 'Vara boa na banca', frase: 'A banca do Seu Lourival passa a vender a vara boa.', icone: 'vara_boa' },
      { tipo: 'receita', id: 'isca', nome: 'Isca', frase: 'Uma sardinha vira 4 iscas para a vara boa e o covo.', icone: 'isca' }],
    3: [{ tipo: 'melhoria', id: 'minhoqueiro', nome: 'Minhoqueiro', frase: 'Cavar a grama dá minhoca o dobro de vezes.' }],
    4: [{ tipo: 'melhoria', id: 'mordida_ligeira', nome: 'Mordida ligeira', frase: 'O peixe morde 15% mais rápido.' }],
    5: [_V],
    6: [{ tipo: 'loja', nome: 'Molinete no Seu Tonico', frase: 'O Seu Tonico já faz o molinete: barra maior e aceita isca.', icone: 'molinete' }],
    7: [{ tipo: 'melhoria', id: 'linha_firme', nome: 'Linha firme', frase: 'Com o peixe fora da faixa, o medidor esvazia 15% mais devagar.' }],
    8: [{ tipo: 'receita', id: 'isca_boa', nome: 'Isca boa', frase: 'Na vara boa ou no molinete: o peixe raro aparece ainda mais e morde na hora.', icone: 'isca_boa' }],
    9: [{ tipo: 'melhoria', id: 'oleo_por_conta', nome: 'Óleo por conta', frase: 'O Lourival não cobra mais os Cr$ 20 de óleo do alto-mar.' }],
    10: [_V],
  },
};
// Número com vírgula (1,8) e porcentagem sem casas quando é inteira.
const _num = (x, c = 1) => x.toFixed(c).replace('.', ',');
const _pct = x => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : _num(x));

const Habilidades = {
  LISTA: ['folego', 'alvenaria', 'acabamento', 'negocio', 'roca', 'pesca'],
  NIVEIS: [100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000],
  iniciar(s) {
    const h = s.hab || {};
    // (15/10, T3) dormido: o nível de cada habilidade que subiu hoje e ainda não valeu (o nível novo vale ao dormir, como no Stardew);
    // telas: as telas "Subiu de nível!" que o jogador ainda não viu (guardadas no save). Save antigo: sem dormido, o nível é o do XP.
    G.hab = { xp: Object.assign({ folego: 0, alvenaria: 0, acabamento: 0, negocio: 0, roca: 0, pesca: 0 }, h.xp || {}), vantagens: (h.vantagens || []).slice(),
      pendentes: (h.pendentes || []).map(p => p.slice()), subiuHoje: [], dormido: Object.assign({}, h.dormido || {}), telas: (h.telas || []).map(p => p.slice()) };
  },
  // O nível pelo XP (o que vale depois de dormir).
  nivelXp(h) { const x = (G.hab && G.hab.xp && G.hab.xp[h]) || 0; let n = 0; while (n < 10 && x >= Habilidades.NIVEIS[n]) n++; return n; },
  // O nível que vale agora: o "dormido" da habilidade que subiu hoje; sem ele (save antigo, o simulador, o numeros.js), o do XP.
  nivel(h) { const n = Habilidades.nivelXp(h), d = G.hab && G.hab.dormido; return d && h in d ? Math.min(d[h], n) : n; },
  // O XP já passou do nível de agora: o nível novo vale ao dormir.
  novoAoDormir(h) { return Habilidades.nivelXp(h) > Habilidades.nivel(h); },
  // Fração do caminho até o próximo nível (0 a 1; cheia quando o nível novo espera a noite).
  progresso(h) { const n = Habilidades.nivel(h); if (n >= 10) return 1; const ini = n ? Habilidades.NIVEIS[n - 1] : 0; return Math.min(1, (G.hab.xp[h] - ini) / (Habilidades.NIVEIS[n] - ini)); },
  // Soma experiência; devolve o nível novo pelo XP (ou 0 se não subiu). O nível novo só vale ao dormir (Habilidades.dormir).
  ganhar(h, xp) {
    if (!G.hab || !(h in G.hab.xp) || xp <= 0) return 0;
    const n0 = Habilidades.nivelXp(h);
    G.hab.xp[h] += xp;
    const n1 = Habilidades.nivelXp(h);
    if (n1 > n0) {
      const d = G.hab.dormido = G.hab.dormido || {};
      if (!(h in d)) d[h] = n0;   // o nível de hoje fica até dormir
      const s = G.hab.subiuHoje = G.hab.subiuHoje || [];
      for (let n = n0 + 1; n <= n1; n++) s.push([h, n]);
      // (a frase do Stardew: "ideias novas para dormir em cima"; a fanfarra toca na tela da noite)
      if (G.comecou) { avisar(`${NOMES_HAB[h]} chegou no nível ${n1}! Vale depois de dormir.`); sons.tocar('feito', 1.2, 0.03, -10); }
    }
    return n1 > n0 ? n1 : 0;
  },
  // A noite (dia.js, depois do NOITE): os níveis ganhos passam a valer, na ordem em que subiram. Cada um vira uma tela "Subiu de
  // nível!" (G.hab.telas) e os níveis 5 e 10 deixam a escolha da vantagem pendente. Devolve os [hab, nível] novos.
  dormir(linhas) {
    if (!G.hab) return [];
    const d = G.hab.dormido || {}, novos = [], tem = (h, n) => novos.some(p => p[0] === h && p[1] === n);
    for (const [h, n] of G.hab.subiuHoje || []) if (n > (h in d ? d[h] : 0) && n <= Habilidades.nivelXp(h) && !tem(h, n)) novos.push([h, n]);
    for (const h in d) for (let n = d[h] + 1; n <= Habilidades.nivelXp(h); n++) if (!tem(h, n)) novos.push([h, n]);
    G.hab.dormido = {}; G.hab.subiuHoje = [];
    G.hab.telas = (G.hab.telas || []).concat(novos.map(p => p.slice()));
    G.hab.pendentes = G.hab.pendentes || [];
    for (const [h, n] of novos) {
      if ((n === 5 || n === 10) && !G.hab.pendentes.some(p => p[0] === h && p[1] === n)) G.hab.pendentes.push([h, n]);
      if (linhas) linhas.push(`${NOMES_HAB[h]} subiu para o nível ${n}.`);
    }
    return novos;
  },
  // (15/10, T4) Onde mora cada ganho da tabela: id → { h, n, g } (a receita e a melhoria; montado na primeira pergunta).
  _onde: null,
  onde(id) {
    if (!Habilidades._onde) { Habilidades._onde = {}; for (const h in NIVEIS_RECOMPENSA) for (const n in NIVEIS_RECOMPENSA[h]) for (const g of NIVEIS_RECOMPENSA[h][n]) if (g.id && (g.tipo === 'receita' || g.tipo === 'receitaExiste' || g.tipo === 'melhoria')) Habilidades._onde[g.id] = { h, n: +n, g }; }
    return Habilidades._onde[id] || null;
  },
  // A habilidade e o nível que liberam a receita de Fabricar `id` (null: nenhum nível dá; ela vem de outro lugar).
  nivelDaReceita(id) { const o = Habilidades.onde(id); return o && o.g.tipo !== 'melhoria' ? { hab: o.h, nivel: o.n } : null; },
  // A melhoria `id` da tabela já vale (o nível dormido chegou lá). Linha ainda com t4 nunca vale: o efeito não existe.
  ganho(id) { const o = Habilidades.onde(id); return !!o && o.g.tipo === 'melhoria' && !o.g.t4 && !!G.hab && Habilidades.nivel(o.h) >= o.n; },
  // (15/10, T4) O que sai a mais ao quebrar um detrito (ferramentas.js): a Pedra de sobra (Fôlego 3: 1 pedra em 1 de cada 4 na pedra
  // e no pedregulho) e a Lenha boa (Fôlego 8: 1 madeira a mais na árvore derrubada). { item: qtd }.
  sobraAoQuebrar(det, rng = Math.random) {
    const r = {};
    if ((det === 'pedra' || det === 'pedregulho') && Habilidades.ganho('pedra_de_sobra') && rng() < ECO.niveis.pedraDeSobra) r.pedra = 1;
    if (det === 'arvore' && Habilidades.ganho('lenha_boa')) r.madeira = ECO.niveis.lenhaBoa;
    return r;
  },
  // Energia do golpe de um nível: cada nível tira 0,1 × base/2 (custo 2 vira 1 no nível 10).
  custoNivel(n) { return Math.max(0.5, CUSTO_GOLPE - 0.1 * n * CUSTO_GOLPE / 2); },
  // Energia do golpe: o nível da habilidade da ferramenta; no trabalho de acabamento (acab), o maior entre ele e o de Acabamento.
  custo(ferr, acab = false) { const h = FERRAMENTA_HAB[ferr]; if (!h) return CUSTO_GOLPE; const n = Habilidades.nivel(h); return Habilidades.custoNivel(acab ? Math.max(n, Habilidades.nivel('acabamento')) : n); },
  // O que o nível n dá e já está no jogo (a tabela NIVEIS_RECOMPENSA sem as linhas da T4): [{ icone (URL ou ''), titulo, frase }].
  ganhosDoNivel(h, n) {
    const r = [], minu = t => t.charAt(0).toLowerCase() + t.slice(1), semPonto = t => t.replace(/\.$/, '');
    for (const g of (NIVEIS_RECOMPENSA[h] || {})[n] || []) {
      if (g.t4) continue;
      if (g.tipo === 'vantagem') {
        // (15/10, T4) A tela do 5/10 que ficou para outra noite não promete de novo uma escolha já feita: mostra a escolhida.
        const pendente = G.hab && (G.hab.pendentes || []).some(p => p[0] === h && p[1] === n), v5 = G.hab ? OPCOES_5[h].find(v => Habilidades.tem(v)) : null;
        const esc = pendente ? null : n === 5 ? v5 : v5 ? (OPCOES_10[v5] || []).find(v => Habilidades.tem(v)) : null;
        if (esc) r.push({ icone: urlItem('hab_' + h), titulo: `Vantagem escolhida: ${VANTAGENS[esc][0]}`, frase: VANTAGENS[esc][1], curto: `a vantagem ${VANTAGENS[esc][0]}` });
        else r.push({ icone: urlItem('hab_' + h), titulo: 'Uma vantagem para sempre', frase: 'Você escolhe uma de duas logo depois desta tela (no "Beleza!").', curto: 'uma vantagem para sempre (você escolhe uma de duas)' });
      } else if (g.tipo === 'empreita') {
        const E = typeof dadosEmpreita === 'function' ? dadosEmpreita(g.id) : null; if (!E) continue;
        const pede = E.funcaoMin && typeof G !== 'undefined' && G.obra && G.obra.funcao < E.funcaoMin && typeof FUNCOES !== 'undefined' ? ` Vale de ${FUNCOES[E.funcaoMin]} em diante.` : '';
        r.push({ icone: urlArte('objetos/plaquinha'), titulo: `Empreita nova no quadro: ${E.nome}`, frase: `Paga Cr$ ${Empreitas.pagaBase(g.id)}.${pede}`, curto: `a empreita ${E.nome} (Cr$ ${Empreitas.pagaBase(g.id)})` });
      } else if (g.tipo === 'receitaExiste' || g.tipo === 'receita') {
        // a receita só aparece se o Fabricar tem a receita (nada de prometer o que não se faz)
        const R = typeof RECEITAS_FABRICAR !== 'undefined' && RECEITAS_FABRICAR[g.id]; if (!R) continue;
        const nome = g.nome || Itens.nome(g.id);
        r.push({ icone: urlItem(g.icone || g.id), titulo: `Receita nova: ${nome}`, frase: `${Fabricar.textoCusto(g.id)}. ${g.frase} (Fabricar)`, curto: `a receita de ${nome}` });
      } else if (g.tipo === 'degrau') {
        if (typeof FUNCOES === 'undefined' || (G.obra && G.obra.funcao >= g.funcao)) continue;
        // (15/10, T4) só o requisito de Alvenaria está cumprido: a função ainda pode pedir obras e empreitas
        r.push({ icone: urlItem('colher'), titulo: `Alvenaria pronta para ${FUNCOES[g.funcao]}`, frase: 'O nível de Alvenaria que o Mestre Bira pede para essa função já está bom. O que mais falta (obras e empreitas) está na tela H.', curto: `o nível de Alvenaria que a função de ${FUNCOES[g.funcao]} pede` });
      } else r.push({ icone: g.icone ? urlItem(g.icone) : '', titulo: g.nome, frase: g.frase, curto: g.tipo === 'melhoria' ? `${g.nome} (${minu(semPonto(g.frase))})` : minu(g.nome) });
    }
    return r;
  },
  // O que todo nível melhora no ofício (as fórmulas que já existem), do nível n−1 para o n.
  formulaDoNivel(h, n) {
    const e = (a, b) => `${_num(Habilidades.custoNivel(a))} → ${_num(Habilidades.custoNivel(b))} de energia por golpe`;
    const cap = L => 0.2 * (L / 10) * 100 + 1, a = n - 1;
    if (h === 'folego') return [`Machado, picareta e foice: ${e(a, n)}.`];
    if (h === 'alvenaria') return [`Pá e colher: ${e(a, n)}.`];
    if (h === 'acabamento') return [`Molhar e rebocar (obra e empreitas de reforma e pintura): ${e(a, n)}.`, `Empreita caprichada: ${_pct(cap(a))}% → ${_pct(cap(n))}% das vezes (de Pedreiro em diante).`];
    if (h === 'negocio') return [`Tudo que vende: +${a}% → +${n}%.`];
    if (h === 'roca') return [`Regador: ${e(a, n)}.`, `Colheita caprichada: ${_pct(cap(a))}% → ${_pct(cap(n))}%; boa: ${_pct(Math.min(75, 2 * cap(a)))}% → ${_pct(Math.min(75, 2 * cap(n)))}%.`];
    if (h === 'pesca') { const f = L => (typeof Pesca !== 'undefined' ? Pesca.faixa(L, false) : 0.17 + 0.014 * L) * 100; return [`Barra verde: ${_num(f(a))}% → ${_num(f(n))}% da altura.`, `Lançar: ${e(a, n)}.`]; }
    return [];
  },
  // O próximo ganho que já está no jogo (frase curta) depois do nível n, ou ''.
  proximoGanho(h, n) { const t = Habilidades.ganhoCurto(h, n + 1); return t ? `No nível ${n + 1}: ${t}.` : ''; },
  // O que o nível m dá, numa frase curta sem título (a tela H e a Caderneta): "a receita de Baú e Pedra de sobra (…)".
  ganhoCurto(h, m) {
    if (m > 10) return '';
    const a = Habilidades.ganhosDoNivel(h, m).map(g => g.curto).filter(Boolean);
    return a.length > 1 ? a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1] : a[0] || '';
  },
  bonusVenda() { return (1 + 0.01 * Habilidades.nivel('negocio')) * (Habilidades.tem('atravessador') ? 1.5 : Habilidades.tem('pechincha') ? 1.25 : 1); },
  desconto() { return Habilidades.tem('cliente_vip') ? 0.8 : Habilidades.tem('fregues') ? 0.9 : 1; },
  velocidade() { return Habilidades.tem('maratonista') ? 1.2 : Habilidades.tem('pe_ligeiro') ? 1.1 : 1; },
  tem(v) { return !!G.hab && G.hab.vantagens.includes(v); },
  opcoes() {
    return G.hab.pendentes.map(([h, n]) => ({ h, nivel: n,
      ids: n === 5 ? OPCOES_5[h] : OPCOES_10[OPCOES_5[h].find(v => Habilidades.tem(v)) || OPCOES_5[h][0]] }));
  },
  escolher(h, n, id) {
    const o = Habilidades.opcoes().find(x => x.h === h && x.nivel === n);
    if (!o || !o.ids.includes(id)) return false;
    G.hab.vantagens.push(id);
    G.hab.pendentes = G.hab.pendentes.filter(p => !(p[0] === h && p[1] === n));
    return true;
  },
};
INICIADORES.push(s => Habilidades.iniciar(s));
COLETORES.push(s => { s.hab = { xp: Object.assign({}, G.hab.xp), vantagens: G.hab.vantagens.slice(), pendentes: G.hab.pendentes.map(p => p.slice()),
  dormido: Object.assign({}, G.hab.dormido || {}), telas: (G.hab.telas || []).map(p => p.slice()) }; });
// (as linhas "subiu para o nível" do resumo vêm de Habilidades.dormir, chamado pelo dia.js depois de todo o NOITE: o XP da caixa
// de venda, que entra à noite, também conta para o nível da manhã, como no Stardew)

// (15/10, T3) Depois do resumo da noite: uma tela "Subiu de nível!" por nível ganho (como a do Stardew ao dormir), depois as
// vantagens. Usa o painel de sempre (o da escolha da vantagem) e os ícones que já existem. "Beleza!" (ou Espaço/Enter/E) tira a tela
// da fila; fechar de outro jeito (Esc, o ✕, fora da caixa) deixa a tela para a próxima noite, como a vantagem. (C5, 16/10; o teste
// crítico: 3 telas seguidas de manhã com o "Beleza!" travado meio segundo cada) Sem trava própria: o clique e a tecla que fecharam o
// resumo não vazam pela trava do clique-fantasma de toda janela (ui.js, 300 ms depois de outra fechar).
// (C13, 16/10; o teste crítico B, dia 5: "3 telas de nível seguidas de manhã, é muita leitura antes de jogar") Os níveis da noite saem
// NUMA TELA SÓ: uma coluna por habilidade (na ordem em que subiram), cada coluna com os níveis dela, e um "Beleza!" que tira todos da
// fila. Divergência pequena do Stardew (lá é uma tela por nível, em fila): o que se ganhou continua todo à vista, sem a fila de telas.
// O rodapé com o "Beleza!" fica fixo (.com-pe): só o miolo rola, na 960x540 também.
function telasDeNivel() {
  const fila = (G.hab && G.hab.telas) || [];
  if (!fila.length) { escolherVantagens(); return; }
  const mostradas = fila.slice(), colunas = [];
  for (const [h, n] of mostradas) { let c = colunas.find(x => x.h === h); if (!c) colunas.push(c = { h, niveis: [] }); if (!c.niveis.includes(n)) c.niveis.push(n); }
  let viu = false;
  const beleza = () => { if (viu) return; viu = true; for (const t of mostradas) { const k = fila.indexOf(t); if (k >= 0) fila.splice(k, 1); } fecharModal(); };
  const secao = txt => el('div', { class: 'nivel-secao' }, txt);
  const coluna = ({ h, niveis }) => {
    niveis.sort((a, b) => a - b);
    const nMax = niveis[niveis.length - 1], prox = Habilidades.proximoGanho(h, nMax);
    return el('div', { class: 'nivel-coluna' },
      el('div', { class: 'nivel-topo' }, el('img', { src: urlItem('hab_' + h) }), el('div', { class: 'titulo nivel-nome' }, `${NOMES_HAB[h]} subiu para o nível ${nMax}!`)),
      ...niveis.flatMap(n => {
        const ganhos = Habilidades.ganhosDoNivel(h, n), formula = Habilidades.formulaDoNivel(h, n);
        return [niveis.length > 1 ? el('div', { class: 'nivel-degrau' }, `Nível ${n}`) : null,
          ganhos.length ? secao('O que você ganhou') : null,
          ...ganhos.map(g => el('div', { class: 'nivel-ganho' }, g.icone ? el('img', { src: g.icone }) : el('span'), el('div', {}, el('b', {}, g.titulo), el('div', {}, g.frase)))),
          secao(ganhos.length ? 'E todo nível também' : 'O que melhorou'),
          ...formula.map(f => el('div', { class: 'nivel-formula' }, '• ' + f))];
      }),
      prox ? el('div', { class: 'rodape nivel-prox' }, prox) : null);
  };
  const caixa = el('div', { class: 'painel vantagem nivel-novo com-pe' + (colunas.length > 1 ? ' varias' : '') },
    colunas.length > 1 ? el('div', { class: 'titulo', style: 'font-size:28px;text-align:center' }, 'Esta noite, o Jocelino subiu de nível!') : null,
    el('div', { class: 'miolo nivel-colunas', style: `--colunas:${Math.min(3, colunas.length)}` }, ...colunas.map(coluna)),
    el('div', { class: 'pe', style: 'text-align:right' }, el('button', { class: 'botao forte nivel-beleza', onclick: e => { e.stopPropagation(); beleza(); } }, 'Beleza!')));
  caixa._tecla = e => { if (e.code === 'Escape') fecharModal(); else if (['Space', 'Enter', 'NumpadEnter', 'KeyE', 'KeyX'].includes(e.code)) beleza(); };
  abrirModal(caixa, () => setTimeout(escolherVantagens, 50));
  sons.tocar('fanfarra', 1.2, 0, -8);
}

// Depois do resumo da noite (dormindo ou desmaiado): as vantagens pendentes, uma por vez.
// A escolha é para sempre: janela própria, sem opção destacada (Espaço/Enter não escolhem), os botões só respondem
// depois de meio segundo (o clique que fechou o resumo não cai neles) e fechar sem escolher deixa a vantagem pendente
// (ela volta na próxima noite).
function escolherVantagens() {
  const o = Habilidades.opcoes()[0];
  if (!o) return;
  const t0 = performance.now();
  const caixa = el('div', { class: 'painel vantagem' },
    el('div', { class: 'titulo', style: 'font-size:26px' }, `Nível ${o.nivel} de ${NOMES_HAB[o.h]}!`),
    el('div', { class: 'rodape', style: 'text-align:left;margin-bottom:10px' }, 'Escolha uma vantagem (é para sempre). Se fechar sem escolher, ela espera a próxima noite.'),
    ...o.ids.map(id => el('button', { class: 'botao vantagem-op', onclick: e => { e.stopPropagation();
      if (performance.now() - t0 < 500) return;
      Habilidades.escolher(o.h, o.nivel, id); avisar(`Vantagem nova: ${VANTAGENS[id][0]}.`); sons.tocar('fanfarra', 1.1, 0, -6);
      fecharModal(); setTimeout(escolherVantagens, 50); } }, el('b', {}, VANTAGENS[id][0]), el('div', {}, VANTAGENS[id][1]))));
  abrirModal(caixa);
}

// ---------- a tela das habilidades (H) ----------
function abrirHabilidades() {
  const caixa = el('div', { class: 'painel habilidades' }, el('div', { class: 'titulo', style: 'font-size:28px' }, 'Habilidades do Jocelino'));
  if (typeof Obra !== 'undefined' && G.obra) caixa.append(el('div', { class: 'amp-obra' }, `Função: ${FUNCOES[G.obra.funcao]}` + (G.obra.funcao < 3 ? ` · Próximo degrau: ${FUNCOES[G.obra.funcao + 1]} — ${Obra.textoFalta()}` : ' · o topo da obra (a construtora vem mais para a frente)')));
  for (const h of Habilidades.LISTA) {
    const n = Habilidades.nivel(h), van = G.hab.vantagens.filter(v => OPCOES_5[h].includes(v) || OPCOES_5[h].some(p => (OPCOES_10[p] || []).includes(v)));
    caixa.append(el('div', { class: 'hab-linha' }, el('img', { src: urlItem('hab_' + h) }),
      el('div', {}, el('b', {}, `${NOMES_HAB[h]} · nível ${n}`), Habilidades.novoAoDormir(h) ? el('span', { class: 'hab-selo' }, `nível ${Habilidades.nivelXp(h)} ao dormir!`) : null,
        el('div', { class: 'hab-barra' }, el('div', { style: `width:${Math.round(Habilidades.progresso(h) * 100)}%` })),
        el('div', { class: 'eq-hab' }, `Cada nível: ${BONUS_NIVEL[h]}.`),
        // (15/10, T4) o próximo ganho do nível que vem (o nível novo que espera a noite já conta como ganho: mostra o seguinte)
        (p => p ? el('div', { class: 'eq-hab hab-prox' }, p) : null)(Habilidades.proximoGanho(h, Habilidades.nivelXp(h))),
        ...van.map(v => el('div', { class: 'eq-hab' }, `★ ${VANTAGENS[v][0]}: ${VANTAGENS[v][1]}${VALE_AGORA.includes(v) ? '' : ' (vale mais para a frente)'}`)))));
  }
  caixa.append(el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  abrirModal(caixa);
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}
