/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — CARREIRA PROFISSIONAL
   A partir do nível 25 o Empresário Rodrigues começa a carreira
   do jogador: contratos com clubes FICTÍCIOS do Brasil e da
   Europa, metas por período, reuniões com o dirigente (escolhas
   de diálogo), satisfação do dirigente, do empresário e da
   torcida, aumentos, renovações, transferências e dispensas.

   Exporta: carreiraEvento(), checaCarreira(), abrirCarreira(),
            reuniaoDirigente(), reuniaoEmpresario(), podeViajar(),
            bonusCarreira(), CARREIRA_CLUBES.
   Estado:  G.save.carreira (criado no primeiro uso).
   ============================================================ */

/* ---------------- constantes ---------------- */
const CARR_NIVEL_MIN = 25;
const CARR_PERIODO = 2;              // dias de jogo entre uma reunião e outra
const CARR_PERIODOS_CONTRATO = 3;    // reuniões por contrato (contrato = 6 dias)
const CARR_COMISSAO = 0.10;          // 10% do salário vai para o Rodrigues
const CARR_DISPENSA = 15;            // satisfação do dirigente abaixo disso = dispensa
const CARR_RENOVA_MIN = 35;          // satisfação mínima do dirigente para renovar
const CARR_HIST_MAX = 60;
const CARR_FAMA_MAX = 3000;
const CARR_FAMA_BONUS_XP = 2100;     // fama que dá +5% de XP extra (título "Astro Mundial")
const CARR_FAMA_FREIO = 0.35;        // ganho de fama quando ela já passou 2 degraus à frente do clube
const CARR_SAL_BASE = 240;           // salário-base do tier 1; cada tier ×1,35
const CARR_SAL_CRESCE = 1.35;
const CARR_CONTADORES = ['abates', 'abatesCidade', 'missoes', 'chefes', 'gols', 'partidas', 'vitorias', 'copas', 'exaustos', 'paz',
  'reunioes', 'metasCumpridas', 'metasFalhas', 'transferencias', 'dispensas', 'renovacoes', 'aumentos', 'recusas', 'ganhos'];

// grito = o que o jogador diz na manchete quando chega ao país
const CARR_PAISES = {
  brasil: { nome: 'Brasil', bandeira: '🇧🇷', de: 'do Brasil', em: 'no Brasil', grito: 'Bora, Brasil!' },
  egito: { nome: 'Egito', bandeira: '🇪🇬', de: 'do Egito', em: 'no Egito', grito: 'Vou jogar à sombra das pirâmides!' },
  japao: { nome: 'Japão', bandeira: '🇯🇵', de: 'do Japão', em: 'no Japão', grito: 'Arigatô, torcida! Que recepção!' },
  catar: { nome: 'Catar', bandeira: '🇶🇦', de: 'do Catar', em: 'no Catar', grito: 'Que calor... de torcida!' },
  eua: { nome: 'Estados Unidos', bandeira: '🇺🇸', de: 'dos Estados Unidos', em: 'nos Estados Unidos', grito: 'Futebol na terra do show!' },
  portugal: { nome: 'Portugal', bandeira: '🇵🇹', de: 'de Portugal', em: 'em Portugal', grito: 'É o sonho europeu!' },
  espanha: { nome: 'Espanha', bandeira: '🇪🇸', de: 'da Espanha', em: 'na Espanha', grito: 'É o sonho europeu!' },
  italia: { nome: 'Itália', bandeira: '🇮🇹', de: 'da Itália', em: 'na Itália', grito: 'Mamma mia, que estádio!' },
  alemanha: { nome: 'Alemanha', bandeira: '🇩🇪', de: 'da Alemanha', em: 'na Alemanha', grito: 'Vou aprender a falar "Tor"!' },
  inglaterra: { nome: 'Inglaterra', bandeira: '🇬🇧', de: 'da Inglaterra', em: 'na Inglaterra', grito: 'Cheguei à terra onde o futebol nasceu!' },
};
// 12 degraus: Brasil (1–3) → meio do mundo (4–7) → Europa (8–12)
const CARR_TIERS = {
  1: { liga: 'Divisão de Acesso', nivel: 25, fama: 0 },
  2: { liga: 'Segundona Nacional', nivel: 32, fama: 100 },
  3: { liga: 'Elite Nacional', nivel: 40, fama: 220 },
  4: { liga: 'Liga do Nilo', nivel: 50, fama: 350 },
  5: { liga: 'Liga das Cerejeiras', nivel: 62, fama: 500 },
  6: { liga: 'Liga das Dunas', nivel: 74, fama: 680 },
  7: { liga: 'Liga das Estrelas', nivel: 86, fama: 880 },
  8: { liga: 'Liga dos Navegadores', nivel: 100, fama: 1100 },
  9: { liga: 'Liga do Sol', nivel: 112, fama: 1350 },
  10: { liga: 'Liga da Bota', nivel: 124, fama: 1650 },
  11: { liga: 'Liga dos Castelos', nivel: 136, fama: 2000 },
  12: { liga: 'Liga da Coroa', nivel: 148, fama: 2400 },
};
const CARR_TIER_MAX = 12;
const CARR_EUROPA_PAISES = ['portugal', 'espanha', 'italia', 'alemanha', 'inglaterra'];
const CARR_CONVITE_TOPO = 2800;      // convite para amistoso em Londres (não existe tier 13)
const CARR_BRASIL = ['vila', 'praia', 'cidade', 'ct', 'estadio'];
const CARR_CIDADE_PADRAO = { vila: 'Vila do Campinho', praia: 'Praia', cidade: 'Cidade', ct: 'CT Sub-20', estadio: 'Estádio' };
// cidades fora do Brasil: nome e preposições ("ir ao Cairo", "jogar no Cairo", "voo para o Cairo").
// tier e convite (fama para amistoso = famaMin do tier SEGUINTE) são calculados depois da lista de clubes.
const CARR_EXTERIOR = {
  cairo: { pais: 'egito', nome: 'Cairo', a: 'ao Cairo', em: 'no Cairo', para: 'para o Cairo' },
  toquio: { pais: 'japao', nome: 'Tóquio' },
  doha: { pais: 'catar', nome: 'Doha' },
  miami: { pais: 'eua', nome: 'Miami' },
  lisboa: { pais: 'portugal', nome: 'Lisboa' },
  madri: { pais: 'espanha', nome: 'Madri' },
  milao: { pais: 'italia', nome: 'Milão' },
  munique: { pais: 'alemanha', nome: 'Munique' },
  londres: { pais: 'inglaterra', nome: 'Londres' },
};
const CARR_RANKS = [
  { min: 0, nome: 'Promessa', emoji: '🌱' },
  { min: 150, nome: 'Revelação', emoji: '⭐' },
  { min: 350, nome: 'Titular', emoji: '👕' },
  { min: 650, nome: 'Ídolo', emoji: '🏅' },
  { min: 1000, nome: 'Craque Continental', emoji: '🌎' },
  { min: 1500, nome: 'Craque Internacional', emoji: '🌍' },
  { min: 2100, nome: 'Astro Mundial', emoji: '🌟' },
  { min: 2700, nome: 'Lenda Mundial', emoji: '👑' },
];
const CARR_PERFIS = {
  exigente: { nome: 'Exigente', emoji: '🧐', desc: 'Quer resultado! Não gosta de pedido de aumento.' },
  paciente: { nome: 'Paciente', emoji: '😌', desc: 'Dá tempo ao jogador e valoriza o respeito.' },
  vaidoso: { nome: 'Vaidoso', emoji: '😎', desc: 'Adora elogios ao clube e aparecer no jornal.' },
  estrategista: { nome: 'Estrategista', emoji: '🧠', desc: 'Pensa no futuro. Gosta de planos e metas ousadas.' },
};

/* ---------------- aparências (peças de avatar) ---------------- */
function carrLook(corpo, pele, cabelo, corCabelo, rosto) {
  return { tipo: 'humano', corpo, pele, cabelo, corCabelo, roupa: 'roupa-terno', baixo: 'baixo-jeans', pescoco: 'pescoco-gravata', rosto: rosto || null };
}
const CARR_LOOK_RODRIGUES = { tipo: 'humano', corpo: 'm', pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-terno', baixo: 'baixo-jeans', pescoco: 'pescoco-gravata', rosto: 'rosto-escuros' };

/* ---------------- clubes fictícios ----------------
   Forma curta: [id, nome, sigla, cidade, tier, cor1, cor2, estilo, multSalário, +nível, +fama, dirigente, perfil, [corpo, pele, cabelo, corCabelo, rosto]]
   estilo do escudo: 'listras' | 'faixa' | 'metade' | 'horizontal'
   nivelMin/famaMin = mínimo do tier + ajuste do clube; salário = 240 × 1,35^(tier−1) × mult                 */
const CARR_CLUBES_BRUTO = [
  // ---- Brasil ----
  ['beiramar', 'Atlético Beira-Mar', 'ABM', 'praia', 1, '#1a6ad9', '#ffffff', 'listras', 1.0, 0, 0, 'Seu Valdemar Maré', 'paciente', ['m', 'pele-media', 'cabelo-curto', 'grisalho', 'rosto-redondos']],
  ['campinhoverde', 'Recreativo Campinho Verde', 'RCV', 'vila', 1, '#2a9a3a', '#ffd23f', 'faixa', 0.92, 0, 0, 'Dona Cotinha Brandão', 'vaidoso', ['f', 'pele-clara', 'cabelo-coque', 'grisalho', 'rosto-redondos']],
  ['operario', 'Operário do Asfalto', 'ODA', 'cidade', 1, '#4a4a58', '#ff8a1a', 'metade', 1.1, 2, 20, 'Seu Juvenal Prego', 'exigente', ['m', 'pele-negra', 'cabelo-curto', 'preto', null]],
  ['serraazul', 'Real Serra Azul', 'RSA', 'cidade', 2, '#3aa0e0', '#1a2a6a', 'faixa', 1.0, 0, 0, 'Dr. Heitor Albuquerque', 'estrategista', ['m', 'pele-clara', 'cabelo-curto', 'castanho', 'rosto-redondos']],
  ['capital', 'Esporte Clube Capital', 'ECC', 'estadio', 2, '#d42a2a', '#ffffff', 'metade', 1.06, 1, 10, 'Dona Marlene Fontes', 'exigente', ['f', 'pele-negra', 'cabelo-black-power', 'preto', null]],
  ['tubaroes', 'Tubarões do Litoral FC', 'TLF', 'praia', 2, '#0a7a8a', '#e0f4ff', 'listras', 0.95, 0, 0, 'Seu Nonato Jangada', 'paciente', ['m', 'pele-morena', 'cabelo-cacheado', 'preto', 'rosto-escuros']],
  ['imperial', 'Imperial do Planalto', 'IDP', 'estadio', 3, '#6a2ad9', '#ffd23f', 'faixa', 1.0, 0, 0, 'Dona Vitória Imperatriz', 'vaidoso', ['f', 'pele-media', 'cabelo-liso-longo', 'castanho', 'rosto-escuros']],
  ['estrelasul', 'União Estrela do Sul', 'UES', 'ct', 3, '#1a1a2a', '#e8e8f0', 'listras', 0.95, 0, 0, 'Prof. Anselmo Taticão', 'estrategista', ['m', 'pele-retinta', 'cabelo-curto', 'grisalho', 'rosto-redondos']],
  ['locomotiva', 'Locomotiva do Cerrado', 'LDC', 'cidade', 3, '#8a1010', '#f0c030', 'horizontal', 1.08, 2, 30, 'Seu Galdino Trilho', 'exigente', ['m', 'pele-clara', 'cabelo-curto', 'preto', 'rosto-escuros']],
  // ---- Egito (Cairo) ----
  ['faraos', 'Faraós do Nilo FC', 'FDN', 'cairo', 4, '#d4a020', '#1a3a8a', 'faixa', 1.05, 0, 0, 'Sr. Ramsés Areia', 'vaidoso', ['m', 'pele-morena', 'cabelo-curto', 'preto', 'rosto-escuros']],
  ['esfinge', 'Esfinge Futebol Clube', 'ESF', 'cairo', 4, '#c8b07a', '#8a1010', 'metade', 1.0, 1, 20, 'Dona Nefertari Lótus', 'estrategista', ['f', 'pele-morena', 'cabelo-liso-longo', 'preto', null]],
  ['oasis', 'Oásis Atlético', 'OAT', 'cairo', 4, '#2a9a6a', '#f0e0a0', 'listras', 0.94, 0, 0, 'Sr. Omar Papiro', 'paciente', ['m', 'pele-media', 'cabelo-cacheado', 'grisalho', 'rosto-redondos']],
  // ---- Japão (Tóquio) ----
  ['samurais', 'Samurais de Tóquio', 'SDT', 'toquio', 5, '#d42a2a', '#ffffff', 'horizontal', 1.05, 1, 20, 'Sr. Kenji Bonsai', 'exigente', ['m', 'pele-clara', 'cabelo-curto', 'preto', 'rosto-redondos']],
  ['cerejeiras', 'Cerejeiras FC', 'CFC', 'toquio', 5, '#ff8ac8', '#ffffff', 'listras', 0.95, 0, 0, 'Dona Sakura Haikai', 'paciente', ['f', 'pele-clara', 'cabelo-coque', 'preto', null]],
  ['dragoes', 'Dragões do Sol Nascente', 'DSN', 'toquio', 5, '#1a1a2a', '#ffd23f', 'faixa', 1.0, 0, 0, 'Sr. Hiro Mangá', 'vaidoso', ['m', 'pele-clara', 'cabelo-liso-longo', 'preto', 'rosto-escuros']],
  // ---- Catar (Doha) ----
  ['falcoes', 'Falcões do Deserto', 'FDD', 'doha', 6, '#8a1a3a', '#ffffff', 'metade', 1.05, 0, 0, 'Sr. Karim Duna', 'vaidoso', ['m', 'pele-morena', 'cabelo-curto', 'preto', 'rosto-escuros']],
  ['perolas', 'Pérolas do Golfo', 'PDG', 'doha', 6, '#ffffff', '#1a8aa0', 'listras', 1.0, 0, 0, 'Dona Layla Miragem', 'estrategista', ['f', 'pele-media', 'cabelo-liso-longo', 'castanho', 'rosto-redondos']],
  ['tempestade', 'Tempestade de Areia SC', 'TDA', 'doha', 6, '#e0a040', '#5a3a1a', 'faixa', 1.08, 2, 30, 'Sr. Faisal Camelo', 'exigente', ['m', 'pele-negra', 'cabelo-curto', 'grisalho', null]],
  // ---- Estados Unidos (Miami) ----
  ['flamingos', 'Miami Flamingos', 'MFL', 'miami', 7, '#ff5ab0', '#1ac8c8', 'faixa', 1.05, 0, 0, 'Mr. Chuck Hollywood', 'vaidoso', ['m', 'pele-clara', 'cabelo-curto', 'loiro', 'rosto-escuros']],
  ['jacares', 'Jacarés do Pântano FC', 'JDP', 'miami', 7, '#2a8a3a', '#ffd23f', 'listras', 0.96, 0, 0, 'Ms. Dolores Palmeira', 'paciente', ['f', 'pele-negra', 'cabelo-cacheado', 'preto', null]],
  ['ondas', 'Ondas de Miami FC', 'ODM', 'miami', 7, '#1a4ad9', '#ff8a1a', 'horizontal', 1.02, 1, 20, 'Mr. Bob Surf', 'estrategista', ['m', 'pele-morena', 'cabelo-liso-longo', 'loiro', 'rosto-redondos']],
  // ---- Portugal (Lisboa) ----
  ['navegadores', 'Os Navegadores FC', 'NAV', 'lisboa', 8, '#0a3a8a', '#f0c030', 'horizontal', 0.95, 0, 0, 'Senhor Joaquim Caravela', 'paciente', ['m', 'pele-clara', 'cabelo-curto', 'grisalho', 'rosto-redondos']],
  ['setecolinas', 'Académico Sete Colinas', 'ASC', 'lisboa', 8, '#1a8a4a', '#ffffff', 'listras', 1.0, 1, 20, 'Dona Amália Fado', 'vaidoso', ['f', 'pele-clara', 'cabelo-coque', 'castanho', null]],
  ['eletrico', 'Elétrico Futebol Clube', 'EFC', 'lisboa', 8, '#f0c030', '#d42a2a', 'faixa', 1.06, 3, 50, 'Engenheiro Duarte Bacalhau', 'estrategista', ['m', 'pele-media', 'cabelo-curto', 'castanho', 'rosto-redondos']],
  // ---- Espanha (Madri) ----
  ['castelhano', 'Real Castelhano', 'RC', 'madri', 9, '#ffffff', '#6a2ad9', 'faixa', 1.03, 0, 0, 'Don Rodrigo del Castillo', 'vaidoso', ['m', 'pele-media', 'cabelo-liso-longo', 'preto', 'rosto-escuros']],
  ['moinhos', 'Atlético Moinhos de Vento', 'AMV', 'madri', 9, '#d42a2a', '#1a2a6a', 'listras', 0.96, 0, 0, 'Doña Pilar Quixote', 'exigente', ['f', 'pele-morena', 'cabelo-cacheado', 'castanho', null]],
  ['soldeouro', 'Unión Sol de Oro', 'USO', 'madri', 9, '#f0a81a', '#1a1a2a', 'metade', 1.08, 3, 40, 'Don Paco Churros', 'paciente', ['m', 'pele-clara', 'cabelo-cacheado', 'grisalho', 'rosto-redondos']],
  // ---- Itália (Milão) ----
  ['dolomitas', 'Real Dolomitas', 'RDO', 'milao', 10, '#1a2a6a', '#ffffff', 'listras', 1.04, 0, 0, 'Dom Vittorio Espresso', 'vaidoso', ['m', 'pele-clara', 'cabelo-curto', 'grisalho', 'rosto-escuros']],
  ['gondoleiros', 'Gondoleiros Unidos', 'GU', 'milao', 10, '#0a8a6a', '#f0c030', 'faixa', 0.96, 0, 0, 'Dona Giulia Pizzaiola', 'paciente', ['f', 'pele-media', 'cabelo-coque', 'castanho', null]],
  ['catedral', 'Estrela da Catedral', 'EDC', 'milao', 10, '#8a1010', '#1a1a2a', 'metade', 1.07, 2, 40, 'Sr. Marco Risoto', 'exigente', ['m', 'pele-media', 'cabelo-cacheado', 'preto', null]],
  // ---- Alemanha (Munique) ----
  ['alpinos', 'Alpinos da Baviera', 'ADB', 'munique', 11, '#d42a2a', '#ffffff', 'horizontal', 1.05, 0, 0, 'Herr Klaus Montanha', 'estrategista', ['m', 'pele-clara', 'cabelo-curto', 'grisalho', 'rosto-escuros']],
  ['relojoeiros', 'Relojoeiros da Floresta Negra', 'RFN', 'munique', 11, '#1a1a2a', '#e04a3a', 'listras', 1.0, 1, 30, 'Frau Greta Relógio', 'exigente', ['f', 'pele-clara', 'cabelo-liso-longo', 'loiro', 'rosto-redondos']],
  ['castelo', 'Castelo Encantado SV', 'CE', 'munique', 11, '#4a2ad9', '#ffffff', 'faixa', 0.95, 0, 0, 'Herr Otto Strudel', 'paciente', ['m', 'pele-clara', 'cabelo-curto', 'castanho', null]],
  // ---- Inglaterra (Londres) ----
  ['royalthames', 'Royal Thames FC', 'RTF', 'londres', 12, '#1a2a6a', '#d42a2a', 'horizontal', 1.03, 0, 0, 'Sir Arthur Teapot', 'estrategista', ['m', 'pele-clara', 'cabelo-curto', 'loiro', 'rosto-redondos']],
  ['bigben', 'Big Ben United', 'BBU', 'londres', 12, '#1a1a2a', '#f0c030', 'listras', 0.97, 0, 0, 'Lady Margaret Clockwork', 'exigente', ['f', 'pele-negra', 'cabelo-liso-longo', 'preto', null]],
  ['foghill', 'Fog Hill Rovers', 'FHR', 'londres', 12, '#6ab0e0', '#ffffff', 'metade', 1.1, 3, 60, 'Mr. Oliver Pudding', 'paciente', ['m', 'pele-retinta', 'cabelo-black-power', 'grisalho', null]],
];
function carrSalTier(tier, mult = 1) { return Math.round(CARR_SAL_BASE * Math.pow(CARR_SAL_CRESCE, tier - 1) * mult / 10) * 10; }
function carrPaisPorCidade(cid) { return CARR_EXTERIOR[cid] ? CARR_EXTERIOR[cid].pais : 'brasil'; }
const CARREIRA_CLUBES = CARR_CLUBES_BRUTO.map(([id, nome, sigla, cidade, tier, cor1, cor2, estilo, mult, dNivel, dFama, dNome, perfil, lk]) => ({
  id, nome, sigla, pais: carrPaisPorCidade(cidade), cidade,
  cidadeNome: CARR_EXTERIOR[cidade] ? CARR_EXTERIOR[cidade].nome : CARR_CIDADE_PADRAO[cidade] || cidade,
  tier, cor1, cor2, estilo, salarioBase: carrSalTier(tier, mult),
  nivelMin: CARR_TIERS[tier].nivel + dNivel, famaMin: CARR_TIERS[tier].fama + dFama,
  dirigente: { nome: dNome, perfil, look: carrLook(...lk) },
}));
// completa as cidades do exterior: tier, convite para amistoso e preposições
for (const id in CARR_EXTERIOR) {
  const x = CARR_EXTERIOR[id];
  x.tier = Math.min(...CARREIRA_CLUBES.filter(k => k.cidade === id).map(k => k.tier));
  x.convite = CARR_TIERS[x.tier + 1] ? CARR_TIERS[x.tier + 1].fama : CARR_CONVITE_TOPO;
  x.a = x.a || 'a ' + x.nome; x.em = x.em || 'em ' + x.nome; x.para = x.para || 'para ' + x.nome;
}

/* ---------------- falas dos dirigentes (por perfil) ----------------
   {nome} = nome do jogador, {clube} = nome do clube                   */
const CARR_FALAS = {
  exigente: {
    oi: ['Sente-se, {nome}. Vamos direto aos números.', 'Meu tempo é curto. Vamos ver suas metas.', 'Aqui no {clube} a gente cobra resultado. Vamos lá.'],
    bom: ['Isso é o mínimo que eu espero. Mas... bom trabalho.', 'Números bons. Continue assim e não teremos problemas.'],
    ruim: ['Não gostei. Meta é para ser cumprida!', 'Esperava muito mais de você, {nome}.'],
    aumento: ['Hmm... você merece. Aumento aprovado, mas vou cobrar em dobro!', 'Aumento? Primeiro mostre serviço em campo!'],
    promessa: ['Gosto de gente ambiciosa! Metas mais difíceis, bônus maior. Combinado.', 'Promessa é fácil. Vamos ver se você cumpre as metas normais primeiro.'],
    elogio: ['Obrigado. Mas elogio não ganha jogo, hein?', 'Menos conversa e mais gols, {nome}.'],
    reclamar: ['Num ponto você tem razão: vou investir no CT. Mas quero retorno!', 'Estrutura? Tem jogador que treinava em campo de terra e virou craque!'],
    negociar: ['Não vou segurar ninguém à força. Seu empresário pode buscar propostas.', 'Você tem contrato assinado! Aqui ninguém sai no meio do caminho.'],
    renova: 'Fez por merecer. Quero você aqui por mais uma temporada.',
    naoRenova: 'Vamos seguir caminhos diferentes. Boa sorte na carreira.',
    dispensa: 'Sinto muito, {nome}. Seus resultados não bastaram. Estamos te liberando.',
    espera: 'A reunião é no dia {dia}. Até lá, quero ver você cumprindo as metas.',
  },
  paciente: {
    oi: ['Que bom te ver, {nome}! Pegue um suco e sente-se.', 'Vamos conversar com calma sobre a temporada.', 'Como você está se sentindo aqui no {clube}?'],
    bom: ['Que orgulho! A torcida está adorando.', 'Você está crescendo muito. Continue assim!'],
    ruim: ['Nem tudo sai como planejado. Vamos corrigir juntos.', 'Tudo bem errar, mas precisamos melhorar.'],
    aumento: ['Você tem sido correto com o clube. Vamos reconhecer isso com um aumento!', 'Agora o caixa está apertado. Vamos conversar de novo mais pra frente, tá bom?'],
    promessa: ['Gosto da sua vontade! Vou colocar metas mais puxadas, com bônus maior.', 'Não precisa prometer nada. Vamos no seu ritmo.'],
    elogio: ['Que gentileza! Este clube é uma família, e você faz parte dela.', 'Obrigado... mas sinto que você queria me dizer outra coisa.'],
    reclamar: ['Você tem razão. Vou pedir campos novos e mais fisioterapeutas.', 'Entendo, mas agora não temos como mudar isso. Paciência.'],
    negociar: ['Fico triste, mas entendo. Seu empresário pode ouvir propostas.', 'Fique mais um pouco, {nome}. Ainda temos muito a conquistar juntos.'],
    renova: 'Adoraria que você continuasse com a gente. Vamos renovar?',
    naoRenova: 'Foi bom enquanto durou. As portas estarão sempre abertas.',
    dispensa: 'Tentamos de tudo, {nome}, mas não está dando certo. Precisamos te liberar. Desejo muita sorte.',
    espera: 'Nossa conversa está marcada para o dia {dia}. Aproveite para treinar!',
  },
  vaidoso: {
    oi: ['Viu minha foto no jornal hoje? Ficou ótima! Enfim, sente-se.', 'Ah, {nome}! A estrela do MEU clube. Vamos conversar.', 'O {clube} é o clube mais elegante do país. E você precisa estar à altura.'],
    bom: ['Maravilha! Os jornais vão falar de nós!', 'É disso que eu gosto: manchete boa para o {clube}!'],
    ruim: ['Que vergonha! Os jornalistas vão comentar...', 'Assim o {clube} não sai na capa do jornal!'],
    aumento: ['Um craque do MEU clube tem que ganhar bem. Aprovado!', 'Aumento? E a minha estátua na entrada do estádio, quem paga?'],
    promessa: ['Metas maiores, manchetes maiores! Adorei.', 'Promessas... jornalista gosta é de gol.'],
    elogio: ['Você tem bom gosto! Este é mesmo o clube mais lindo do mundo.', 'Obrigado, obrigado. Eu sei. Mas e as metas?'],
    reclamar: ['Hmm... um CT novo com o meu nome na porta? Gostei da ideia!', 'Reclamar do MEU clube?! Que falta de educação!'],
    negociar: ['Se você quer sair, vou exigir que o próximo clube te anuncie com festa!', 'Sair? Ninguém sai do clube mais famoso da cidade!'],
    renova: 'O público te adora. E eu adoro o público. Renovamos!',
    naoRenova: 'O {clube} precisa de estrelas que brilhem mais. Tchau!',
    dispensa: 'Chega de manchete ruim. Estamos te liberando, {nome}.',
    espera: 'Dia {dia} eu te recebo. Venha bem arrumado(a), vai ter fotógrafo!',
  },
  estrategista: {
    oi: ['Trouxe planilhas. Muitas planilhas. Vamos analisar.', 'Estive estudando seus números, {nome}.', 'Cada reunião é uma jogada. Vamos planejar a próxima.'],
    bom: ['Exatamente como eu calculei. Excelente.', 'Seus números estão acima da média. Ótimo investimento.'],
    ruim: ['Os números não mentem: precisamos ajustar a estratégia.', 'Abaixo do previsto. Vamos rever o plano.'],
    aumento: ['Analisei o mercado. Um aumento agora evita que outro clube te leve. Aprovado.', 'Os números ainda não justificam um aumento. Me mostre mais dados.'],
    promessa: ['Metas ousadas e um bônus maior. É um bom plano!', 'Ambição sem plano não funciona. Vamos manter as metas normais.'],
    elogio: ['Elogios aumentam a moral da equipe em 12%. Obrigado!', 'Agradeço, mas vamos focar nos números.'],
    reclamar: ['Faz sentido. Estrutura melhor gera resultado melhor. Vou investir.', 'Já investimos o planejado para este ano. Sem margem agora.'],
    negociar: ['Uma venda agora pode ser boa para os dois lados. Seu empresário pode negociar.', 'Você é peça-chave do meu plano. Não está à venda.'],
    renova: 'Sua renovação faz parte do plano de longo prazo. Vamos assinar?',
    naoRenova: 'O plano do clube mudou. Não vamos renovar.',
    dispensa: 'A análise é clara: não está funcionando. Vamos encerrar o contrato, {nome}.',
    espera: 'Pelo cronograma, nossa reunião é no dia {dia}.',
  },
};

/* ---------------- opções de diálogo na reunião ---------------- */
// base = chance base; mod = ajuste pelo perfil do dirigente
const CARR_OPCOES = {
  aumento: { emoji: '💰', txt: 'Pedir aumento', base: 0.45, mod: { exigente: -0.2, paciente: 0, vaidoso: 0.05, estrategista: 0 } },
  promessa: { emoji: '⚽', txt: 'Prometer mais gols (metas mais difíceis, bônus maior)', base: 0.72, mod: { exigente: 0.15, paciente: 0, vaidoso: 0.05, estrategista: 0.15 } },
  elogio: { emoji: '👏', txt: 'Elogiar a torcida e o clube', base: 0.6, mod: { exigente: -0.15, paciente: 0.15, vaidoso: 0.3, estrategista: 0 } },
  reclamar: { emoji: '🏗️', txt: 'Reclamar (com educação) da falta de estrutura', base: 0.35, mod: { exigente: -0.1, paciente: 0.1, vaidoso: -0.25, estrategista: 0.2 } },
  negociar: { emoji: '✈️', txt: 'Pedir para ser negociado(a)', base: 0.4, mod: { exigente: -0.1, paciente: 0.05, vaidoso: -0.1, estrategista: 0.2 } },
};

/* ============================================================
   UTILIDADES
   ============================================================ */
const carrCl = (v, a, b) => Math.max(a, Math.min(b, v));
const carrR10 = v => Math.max(10, Math.round(v / 10) * 10);
const carrPick = arr => arr[Math.floor(Math.random() * arr.length)];
const carrFmt = n => (typeof fmt === 'function' ? fmt(n) : String(Math.floor(n)));
function carrLog(m, c) { try { if (typeof log === 'function') log(m, c); } catch (e) { /* sem log */ } }
function carrBanner(a, b) { try { if (typeof banner === 'function') banner(a, b); } catch (e) { /* sem banner */ } }
function carrSom(t) { try { if (typeof som === 'function') som(t); } catch (e) { /* sem som */ } }
function carrSalvar() { try { if (typeof salvar === 'function') salvar(); } catch (e) { /* sem save */ } }
function carrSujo() { if (typeof G !== 'undefined' && G) G.uiSujo = true; }
function carrDia() { return (G.save && G.save.dia) || 1; }
function carrG(m, f) { return G.save && G.save.corpo === 'f' ? f : m; }
function carrNome() { return (G.save && G.save.nome) || 'Craque'; }
function carrClube(id) { return CARREIRA_CLUBES.find(k => k.id === id) || null; }
function carrTexto(t, extra = {}) {
  const c = G.save && G.save.carreira; const k = c && c.clube;
  return String(t).replace(/\{nome\}/g, carrNome()).replace(/\{clube\}/g, extra.clube || (k ? k.nome : 'clube')).replace(/\{dia\}/g, extra.dia != null ? extra.dia : (k ? k.proxReuniao : ''));
}
const CARR_NOMES_CIDADE = {};
// nome guardado (no contrato atual ou na lista de clubes) — usado quando o mapa ainda não existe
function carrCidadeGuardada(id) {
  const k = G && G.save && G.save.carreira && G.save.carreira.clube;
  if (k && k.cidade === id && k.cidadeNome) return k.cidadeNome;
  if (CARR_EXTERIOR[id]) return CARR_EXTERIOR[id].nome;
  if (CARR_CIDADE_PADRAO[id]) return CARR_CIDADE_PADRAO[id];
  const def = CARREIRA_CLUBES.find(x => x.cidade === id);
  return def ? def.cidadeNome : null;
}
// nome curto (só a cidade): para manchetes, voos e viagens
function carrCidadeCurta(id) { return CARR_EXTERIOR[id] ? CARR_EXTERIOR[id].nome : String(carrCidadeNome(id)).split(/ [—–-] /)[0]; }
// nome completo do mapa (ex.: "Lisboa — Bairro Alto"): para a meta de adversários
function carrCidadeNome(id) {
  if (!id) return '';
  if (CARR_NOMES_CIDADE[id]) return CARR_NOMES_CIDADE[id];
  let n = null;
  try { if (typeof getMapa === 'function') { const m = getMapa(id); if (m && m.nome) n = m.nome; } } catch (e) { n = null; }
  if (n) { CARR_NOMES_CIDADE[id] = n; return n; } // só guarda no cache quando o mapa existe
  return carrCidadeGuardada(id) || id;
}
function carrRank(fama) {
  let i = 0; CARR_RANKS.forEach((r, k) => { if (fama >= r.min) i = k; });
  return Object.assign({ i, prox: CARR_RANKS[i + 1] || null }, CARR_RANKS[i]);
}
function carrCara(v) { return v >= 80 ? '😄' : v >= 60 ? '🙂' : v >= 40 ? '😐' : v >= 20 ? '😟' : '😠'; }
function carrHumor(v) { return v >= 80 ? 'Muito feliz' : v >= 60 ? 'Contente' : v >= 40 ? 'Normal' : v >= 20 ? 'Preocupado' : 'Muito bravo'; }
function carrLiquido(sal) { return Math.round(sal * (1 - CARR_COMISSAO)); }

/* ---------------- estado ---------------- */
function carrDados() {
  const s = G.save;
  if (!s.carreira) {
    s.carreira = { ativa: false, fama: 0, satEmp: 60, satDir: 50, satTorcida: 50, clube: null, ofertas: [], historico: [], ultimoPagamento: s.dia || 1,
      reuniaoPendente: false, contadores: {}, titulos: {} };
  }
  const c = s.carreira;
  if (!c.contadores) c.contadores = {};
  for (const k of CARR_CONTADORES) if (c.contadores[k] == null) c.contadores[k] = 0;
  if (!c.titulos) c.titulos = {};
  if (c.titulos.copa == null) c.titulos.copa = 0;
  if (!Array.isArray(c.historico)) c.historico = [];
  if (!Array.isArray(c.ofertas)) c.ofertas = [];
  if (!Array.isArray(c.paises)) c.paises = [];
  for (const k of ['fama', 'satEmp', 'satDir', 'satTorcida']) if (typeof c[k] !== 'number' || isNaN(c[k])) c[k] = k === 'fama' ? 0 : k === 'satEmp' ? 60 : 50;
  if (c.ultimoPagamento == null) c.ultimoPagamento = carrDia();
  c.fama = carrCl(c.fama, 0, CARR_FAMA_MAX);
  // saves antigos: o contrato guarda tier/país da tabela velha (Portugal era 4, Espanha 5, Inglaterra 6)
  if (c.clube && c.clube.v !== 2) {
    const def = carrClube(c.clube.id);
    if (def) Object.assign(c.clube, { tier: def.tier, pais: def.pais, cidade: def.cidade, cidadeNome: def.cidadeNome });
    c.clube.v = 2;
  }
  return c;
}
function carrHist(txt) {
  const c = carrDados(); c.historico.unshift(`Dia ${carrDia()} — ${txt}`);
  if (c.historico.length > CARR_HIST_MAX) c.historico.length = CARR_HIST_MAX;
}
// aplica {dir, emp, tor, fama, ouro} com limites; devolve o que realmente mudou
function carrAplica(ef) {
  const c = carrDados(); const out = {};
  const mexe = (campo, k) => { if (!ef[k]) return; const a = c[campo]; c[campo] = carrCl(Math.round(a + ef[k]), 0, 100); if (c[campo] !== a) out[k] = c[campo] - a; };
  mexe('satDir', 'dir'); mexe('satEmp', 'emp'); mexe('satTorcida', 'tor');
  if (ef.fama) { const d = carrFama(ef.fama); if (d) out.fama = d; }
  if (ef.ouro) { G.save.ouro = (G.save.ouro || 0) + Math.round(ef.ouro); out.ouro = Math.round(ef.ouro); }
  if (ef.sal) out.sal = ef.sal;
  return out;
}
function carrFama(n) {
  const c = carrDados(); const antes = c.fama; const ra = carrRank(antes);
  // freio suave: acima da fama de 2 degraus acima do seu, a fama cresce só 35% (ela acompanha a carreira)
  if (n > 0) {
    const tierRef = Math.min(CARR_TIER_MAX, (c.clube ? c.clube.tier : c.ultimoTier || 1) + 2);
    if (antes >= CARR_TIERS[tierRef].fama) n = Math.max(1, Math.round(n * CARR_FAMA_FREIO));
  }
  c.fama = carrCl(Math.round(antes + n), 0, CARR_FAMA_MAX);
  const rd = carrRank(c.fama);
  if (rd.i > ra.i && c.ativa) {
    carrBanner(`${rd.emoji} ${rd.nome}!`, 'Sua fama cresceu'); carrLog(`Sua fama cresceu! Agora você é ${rd.nome} ${rd.emoji}.`, 'l-lvl'); carrSom('nivel');
    carrHist(`Os jornais já chamam ${carrNome()} de "${rd.nome}"!`);
  }
  return c.fama - antes;
}

/* ============================================================
   METAS
   ============================================================ */
function carrMissoesDisponiveis() {
  try {
    if (typeof MISSOES === 'undefined' || typeof statusMissao !== 'function') return 0;
    return MISSOES.filter(q => ['disponivel', 'ativa', 'pronta'].includes(statusMissao(q))).length;
  } catch (e) { return 0; }
}
function carrDescMeta(m) {
  const n = m.n;
  switch (m.tipo) {
    case 'abates': return `Vença ${n} adversários em ${carrCidadeNome(m.alvo)}`;
    case 'missoes': return n === 1 ? 'Conclua 1 missão' : `Conclua ${n} missões`;
    case 'chefe': return n === 1 ? 'Vença um chefão' : `Vença ${n} chefões`;
    case 'gols': return `Marque ${n} gols de pênalti`;
    case 'partidas': return n === 1 ? 'Vença 1 partida com o seu time' : `Vença ${n} partidas com o seu time`;
    case 'copa': return 'Jogue 1 Copa dos Sonhos';
    case 'disciplina': return n === 0 ? `Não fique ${carrG('exausto', 'exausta')} nenhuma vez` : `Não fique ${carrG('exausto', 'exausta')} mais de ${n} ${n === 1 ? 'vez' : 'vezes'}`;
  }
  return m.tipo;
}
const CARR_META_EMOJI = { abates: '⚔️', missoes: '📜', chefe: '👑', gols: '🥅', partidas: '🏟️', copa: '🏆', disciplina: '💪' };
function carrMetaOk(m) { return m.tipo === 'disciplina' ? m.prog <= m.n : m.prog >= m.n; }
function carrGeraMetas(k) {
  const s = G.save; const t = k.tier; const nv = s.nivel || 1; const dif = k.promessa ? 1.5 : 1;
  const missoes = carrMissoesDisponiveis();
  const cand = [
    // tier 1 / nível 25 ≈ 22 adversários; tier 12 / nível 148 ≈ 69 (×1,5 com promessa)
    { tipo: 'abates', w: 3, n: () => Math.round((15 + nv * 0.2 + t * 2) * dif), alvo: k.cidade },
    { tipo: 'gols', w: 2, n: () => Math.round((2 + Math.ceil(t / 3)) * dif) },
    { tipo: 'chefe', w: 2, n: () => (k.promessa ? 2 : 1) },
    { tipo: 'copa', w: 1.5, n: () => 1 },
    { tipo: 'disciplina', w: 1.5, n: () => Math.max(k.promessa ? 0 : 1, 4 - Math.floor(t / 3) - (k.promessa ? 1 : 0)) },
  ];
  if (missoes > 0) cand.push({ tipo: 'missoes', w: 2, n: () => Math.min(missoes, 1 + (t >= 4 ? 1 : 0) + (t >= 8 ? 1 : 0) + (k.promessa ? 1 : 0)) });
  if (s.time) cand.push({ tipo: 'partidas', w: 2, n: () => Math.round((1 + Math.floor(t / 4)) * dif) });
  const qtd = t >= 3 || k.promessa ? 3 : (Math.random() < 0.5 ? 2 : 3);
  const metas = [];
  while (metas.length < qtd && cand.length) {
    const tot = cand.reduce((a, x) => a + x.w, 0); let r = Math.random() * tot; let i = 0;
    for (; i < cand.length - 1; i++) { r -= cand[i].w; if (r <= 0) break; }
    const c = cand.splice(i, 1)[0];
    const m = { tipo: c.tipo, alvo: c.alvo || null, n: Math.max(0, c.n()), desc: '', prog: 0 };
    m.desc = carrDescMeta(m); metas.push(m);
  }
  return metas;
}
function carrProgMeta(tipo, qtd = 1, filtro) {
  const c = carrDados(); const k = c.clube; if (!k || !k.metas) return;
  for (const m of k.metas) {
    if (m.tipo !== tipo) continue;
    if (filtro && !filtro(m)) continue;
    const antes = carrMetaOk(m);
    m.prog += qtd;
    if (m.tipo === 'disciplina') {
      if (antes && !carrMetaOk(m)) carrLog(`Meta perdida: "${m.desc}". O dirigente não vai gostar...`, 'l-dano');
    } else if (!antes && carrMetaOk(m)) { carrLog(`✅ Meta da carreira cumprida: ${m.desc}!`, 'l-xp'); carrSom('moeda'); }
  }
}

/* ============================================================
   CONTRATOS, OFERTAS, TRANSFERÊNCIAS
   ============================================================ */
function carrElegivel(k, folga) {
  const s = G.save; const c = carrDados(); const f = folga || { nivel: 0, fama: 0 };
  return (s.nivel || 1) >= k.nivelMin - f.nivel && c.fama >= k.famaMin - f.fama;
}
function carrNovoContrato(def, salario) {
  const d = carrDia();
  const k = { v: 2, id: def.id, nome: def.nome, pais: def.pais, cidade: def.cidade, cidadeNome: def.cidadeNome, tier: def.tier, salario,
    inicioDia: d, fimDia: d + CARR_PERIODO * CARR_PERIODOS_CONTRATO, metas: [], periodoDias: CARR_PERIODO, proxReuniao: d + CARR_PERIODO,
    promessa: false, estrutura: false, cumpridas: 0, totalMetas: 0 };
  k.metas = carrGeraMetas(k);
  return k;
}
// opts: { inicial, melhor }
function carrGeraOfertas(opts = {}) {
  const c = carrDados(); const s = G.save;
  // sem clube, o mercado lembra do último degrau (quem foi dispensado em Miami não volta para a várzea)
  const atual = c.clube ? c.clube.tier : (c.ultimoTier || 0); const idAtual = c.clube ? c.clube.id : null;
  let pool;
  if (opts.inicial) pool = CARREIRA_CLUBES.filter(k => k.pais === 'brasil' && k.tier <= 2 && (s.nivel || 1) >= k.nivelMin);
  else pool = CARREIRA_CLUBES.filter(k => k.id !== idAtual && carrElegivel(k));
  if (!pool.length) pool = CARREIRA_CLUBES.filter(k => k.tier === 1 && k.id !== idAtual);
  const maxTier = Math.max(...pool.map(k => k.tier));
  const temProximo = pool.some(k => k.tier === atual + 1);
  let n = opts.inicial ? 3 : c.satEmp < 25 ? 2 : c.satEmp >= 70 ? 4 : 3;
  // o mercado anda um degrau por vez: Brasil → Cairo → Tóquio → Doha → Miami → Lisboa → Madri → Milão → Munique → Londres
  const peso = k => {
    let w;
    if (k.tier === atual + 1) w = 6;
    else if (!temProximo && k.tier === maxTier) w = 4;       // sem clube do próximo degrau: o melhor que houver
    else if (k.tier === atual) w = 2;
    else if (k.tier === atual + 2) w = 0.4;
    else if (k.tier > atual) w = 0.02;                          // pular vários degraus é raríssimo
    else w = k.tier === atual - 1 ? 0.6 : 0.05;
    if (opts.melhor && k.tier > atual) w *= 2;
    if (c.satEmp < 25 && k.tier > atual) w *= 0.4;
    return w;
  };
  const lista = pool.slice(); const escolhidos = [];
  while (escolhidos.length < n && lista.length) {
    const tot = lista.reduce((a, k) => a + peso(k), 0); let r = Math.random() * tot; let i = 0;
    for (; i < lista.length - 1; i++) { r -= peso(lista[i]); if (r <= 0) break; }
    escolhidos.push({ def: lista.splice(i, 1)[0], sonho: false });
  }
  // proposta dos sonhos: um clube um pouco acima dos requisitos (empresário feliz)
  if (!opts.inicial && c.satEmp >= 60) {
    const sonhos = CARREIRA_CLUBES.filter(k => k.id !== idAtual && k.tier <= Math.max(atual, maxTier) + 1 && !carrElegivel(k)
      && carrElegivel(k, { nivel: 5, fama: Math.max(60, Math.round(k.famaMin * 0.08)) }) && !escolhidos.some(e => e.def.id === k.id));
    if (sonhos.length) {
      const d = sonhos.sort((a, b) => a.tier - b.tier)[0];
      if (escolhidos.length >= n) escolhidos.pop();
      escolhidos.push({ def: d, sonho: true });
    }
  }
  const mult = (c.satEmp < 25 ? 0.85 : 1) * (opts.melhor ? 1.12 : 1);
  const ofertas = escolhidos.map(({ def, sonho }) => {
    const bonusFama = carrCl((c.fama - def.famaMin) / 3000, 0, 0.3);
    const sal = carrR10(def.salarioBase * (1 + bonusFama) * (0.92 + Math.random() * 0.2) * mult * (sonho ? 0.95 : 1));
    return { id: def.id, salario: sal, luvas: carrR10(sal * (sonho ? 3 : 2)), dias: CARR_PERIODO * CARR_PERIODOS_CONTRATO, sonho };
  });
  ofertas.sort((a, b) => carrClube(b.id).tier - carrClube(a.id).tier || b.salario - a.salario);
  c.ofertasDia = carrDia();
  return ofertas;
}
function carrPodeAssinar() {
  const c = carrDados(); const k = c.clube;
  return !k || !!c.liberado || carrDia() >= k.fimDia - CARR_PERIODO;
}
// assina uma oferta: devolve { manchete, europa, def, antigo }
function carrAssinar(oferta) {
  const c = carrDados(); const s = G.save; const def = carrClube(oferta.id); if (!def) return null;
  const antigo = c.clube ? c.clube.nome : null; const paisAntigo = c.clube ? c.clube.pais : null;
  c.clube = carrNovoContrato(def, oferta.salario);
  c.satDir = oferta.sonho ? 50 : 55; c.satTorcida = 55; c.liberado = false; c.ofertas = []; c.reuniaoPendente = false; c.reuniaoAtual = null; c.ultimaMulta = null;
  const ef = carrAplica({ emp: 10, fama: 10 + def.tier * 6, ouro: carrLiquido(oferta.luvas) });
  if (antigo) c.contadores.transferencias++;
  if (!c.paises.includes(def.pais)) c.paises.push(def.pais);
  let manchete;
  const nm = carrNome();
  const cx = CARR_EXTERIOR[def.cidade];
  if (cx && def.pais !== paisAntigo) manchete = `${nm} vai jogar ${cx.em}! Rodrigues fecha com o ${def.nome} por ${carrFmt(oferta.salario)} tostões/dia: "${CARR_PAISES[def.pais].grito}"`;
  else if (antigo) manchete = `Bomba! ${nm} troca o ${antigo} pelo ${def.nome}! Rodrigues fecha por ${carrFmt(oferta.salario)} tostões/dia.`;
  else manchete = `Rodrigues fecha com o ${def.nome} por ${carrFmt(oferta.salario)} tostões/dia!`;
  carrHist(manchete);
  carrLog(`✍️ Contrato assinado com o ${def.nome}! Salário: ${carrFmt(carrLiquido(oferta.salario))} tostões/dia (já sem os 10% do Rodrigues). Luvas: +${carrFmt(carrLiquido(oferta.luvas))}.`, 'l-loot');
  carrBanner(def.nome, 'Contrato assinado!'); carrSom('moeda');
  const europa = def.pais !== 'brasil';
  if (europa) carrLog(`✈️ Voo ${cx ? cx.para : 'para ' + carrCidadeCurta(def.cidade)} (${CARR_PAISES[def.pais].nome}) liberado! Seu novo clube joga lá.`, 'l-lvl');
  carrSujo(); carrSalvar();
  return { manchete, europa, def, antigo, ef, oferta };
}
function carrPedirMelhores() {
  const c = carrDados(); const d = carrDia();
  if (c.pedidosDia !== d) { c.pedidosDia = d; c.pedidos = 0; }
  if (c.pedidos >= 2) return { ok: false, cansado: true, fala: 'Calma, calma! Já liguei pra todo mundo hoje. Deixa eu trabalhar e amanhã a gente vê.' };
  c.pedidos++; c.contadores.recusas++;
  const ef = carrAplica({ emp: -8 });
  const chance = 0.3 + c.satEmp / 200;
  if (Math.random() < chance) {
    c.ofertas = carrGeraOfertas({ melhor: true });
    return { ok: true, ef, fala: 'Liguei para uns contatos importantes... e olha só o que apareceu! Propostas melhores!' };
  }
  const novas = carrGeraOfertas({});
  if (novas.length > 1) novas.pop();
  c.ofertas = novas;
  return { ok: false, ef, fala: 'O mercado está parado... Consegui só isso aqui. Da próxima vez, pense bem antes de recusar!' };
}
function carrRecusar() {
  const c = carrDados(); let ef = {};
  if (c.ofertas.length) { c.contadores.recusas++; ef = carrAplica({ emp: -4 }); }
  c.ofertas = [];
  return ef;
}
// ultimoTier: referência do mercado enquanto está sem clube (dispensa = um degrau abaixo)
function carrLivre(txt, ultimoTier) {
  const c = carrDados();
  c.ultimoTier = ultimoTier != null ? ultimoTier : (c.clube ? c.clube.tier : c.ultimoTier || 0);
  c.clube = null; c.reuniaoPendente = false; c.reuniaoAtual = null; c.liberado = false; c.ultimaMulta = null;
  if (txt) carrHist(txt);
  c.ofertas = carrGeraOfertas();
}
function carrDispensa(motivo) {
  const c = carrDados(); const k = c.clube; if (!k) return null;
  const def = carrClube(k.id);
  const nome = k.nome;
  c.contadores.dispensas++;
  const ef = carrAplica({ fama: -50, emp: -15 });
  c.satDir = 50; c.satTorcida = 45;
  const manchete = `${nome} dispensa ${carrNome()}${motivo === 'ausencia' ? ' depois de faltar às reuniões' : ''}. Rodrigues promete: "Vamos dar a volta por cima!"`;
  carrLivre(manchete, Math.max(0, k.tier - 1));
  carrLog(`📰 O ${nome} te dispensou. Fale com o Rodrigues para achar um novo clube (tecla U).`, 'l-dano');
  carrBanner('Dispensado(a)...', `O ${nome} encerrou seu contrato`); carrSom('erro');
  carrSujo(); carrSalvar();
  return { def, nome, ef, manchete, fala: carrTexto(CARR_FALAS[def.dirigente.perfil].dispensa, { clube: nome }) };
}

/* ============================================================
   REUNIÃO COM O DIRIGENTE (lógica)
   ============================================================ */
function carrSorteiaOpcoes() {
  const c = carrDados();
  const quarta = c.liberado ? 'reclamar' : (Math.random() < 0.5 ? 'reclamar' : 'negociar');
  return ['aumento', 'promessa', 'elogio', quarta];
}
function carrIniciaReuniao() {
  const c = carrDados(); const k = c.clube; if (!k) return null;
  if (c.reuniaoAtual && c.reuniaoAtual.clubeId === k.id) return c.reuniaoAtual;
  const def = carrClube(k.id); const F = CARR_FALAS[def.dirigente.perfil];
  const mult = (k.promessa ? 2 : 1) * (k.estrutura ? 1.5 : 1);
  const res = []; const tot = {}; let ok = 0;
  const soma = ef => { for (const x in ef) tot[x] = (tot[x] || 0) + ef[x]; };
  for (const m of k.metas) {
    const cumpriu = carrMetaOk(m);
    const ef = cumpriu ? { dir: 7, emp: 2, tor: 3, fama: Math.round((k.promessa ? 7 : 5) * (1 + k.tier * 0.06)), ouro: carrR10(k.salario * 0.6 * mult) } : { dir: -9, fama: -8, tor: -3 };
    if (cumpriu) ok++;
    res.push({ desc: m.desc, tipo: m.tipo, ok: cumpriu, prog: m.prog, n: m.n, ef });
    soma(ef);
  }
  const extras = [];
  if (k.metas.length && ok === k.metas.length) { soma({ dir: 5 }); extras.push('Todas as metas cumpridas: +5 Dirigente'); }
  if (k.metas.length && !ok) { soma({ dir: -5 }); extras.push('Nenhuma meta cumprida: −5 Dirigente'); }
  const aplicado = carrAplica(tot);
  k.cumpridas += ok; k.totalMetas += k.metas.length;
  c.contadores.metasCumpridas += ok; c.contadores.metasFalhas += k.metas.length - ok; c.contadores.reunioes++;
  if (k.metas.length && ok === k.metas.length) carrHist(`${carrNome()} bate todas as metas no ${k.nome}! Dirigente sorri na coletiva.`);
  const bom = ok * 2 >= k.metas.length;
  c.reuniaoAtual = { clubeId: k.id, dia: carrDia(), res, extras, tot: aplicado, ok, total: k.metas.length, renovacao: k.proxReuniao >= k.fimDia,
    opcoes: carrSorteiaOpcoes(), fala: carrTexto(carrPick(F.oi)), avaliacao: carrTexto(carrPick(bom ? F.bom : F.ruim)), etapa: 'avaliacao' };
  carrSujo(); carrSalvar();
  return c.reuniaoAtual;
}
// depois da avaliação: 'dispensa' | 'renovacao' | 'escolha'
function carrPosAvaliacao() {
  const c = carrDados(); const ra = c.reuniaoAtual; if (!ra || !c.clube) return { etapa: 'fim' };
  if (c.satDir < CARR_DISPENSA) return { etapa: 'dispensa', info: carrDispensa('metas') };
  ra.etapa = ra.renovacao ? 'renovacao' : 'escolha';
  return { etapa: ra.etapa };
}
function carrChance(op) {
  const c = carrDados(); const k = c.clube; if (!k) return 0;
  const def = carrClube(k.id); const o = CARR_OPCOES[op]; const ra = c.reuniaoAtual;
  let p = o.base + (o.mod[def.dirigente.perfil] || 0) + (c.satDir - 50) / 150 + carrCl((c.fama - def.famaMin) / 1600, 0, 0.25);
  if (op === 'aumento' && ra && ra.total) p += (ra.ok / ra.total - 0.5) * 0.3;
  return carrCl(p, 0.05, 0.95);
}
function carrOpTxt(op) { return CARR_OPCOES[op].txt.replace('negociado(a)', carrG('negociado', 'negociada')); }
function carrChanceTxt(p) { return p >= 0.65 ? 'boa' : p >= 0.4 ? 'média' : 'baixa'; }
function carrProxReuniao(k) {
  const d = carrDia();
  k.proxReuniao = Math.min(k.fimDia, Math.max(k.proxReuniao + CARR_PERIODO, d + 1));
  if (k.proxReuniao < d) k.proxReuniao = d; // contrato já vencido: a renovação é hoje (não multa por uma data no passado)
}
function carrEscolhe(op) {
  const c = carrDados(); const k = c.clube; const ra = c.reuniaoAtual; if (!k || !ra || !CARR_OPCOES[op]) return null;
  const def = carrClube(k.id); const F = CARR_FALAS[def.dirigente.perfil];
  const p = carrChance(op); const ok = Math.random() < p;
  k.promessa = false; k.estrutura = false;
  let ef = {}; let extra = null; const nm = carrNome();
  if (op === 'aumento') {
    if (ok) {
      const pct = 12 + Math.floor(Math.random() * 11); const novo = carrR10(k.salario * (1 + pct / 100));
      ef = { dir: -2, emp: 6, sal: novo - k.salario }; k.salario = novo; c.contadores.aumentos++;
      carrHist(`${nm} ganha aumento de ${pct}% no ${k.nome}! Agora são ${carrFmt(novo)} tostões/dia.`);
    } else ef = { dir: -8, emp: -2 };
  } else if (op === 'promessa') {
    if (ok) { ef = { dir: 6, fama: 5 }; k.promessa = true; extra = 'Metas mais difíceis no próximo período — e bônus em dobro!'; }
    else ef = { dir: 1 };
  } else if (op === 'elogio') {
    ef = ok ? { dir: 10, tor: 8, fama: 4 } : { dir: -3 };
  } else if (op === 'reclamar') {
    if (ok) { ef = { dir: -2, tor: 5 }; k.estrutura = true; extra = 'O clube vai investir na estrutura: bônus das metas +50% no próximo período!'; carrHist(`${k.nome} anuncia reforma no CT depois de conversa com ${nm}.`); }
    else ef = { dir: -12, tor: -4 };
  } else if (op === 'negociar') {
    if (ok) { ef = { dir: -6, emp: 5 }; c.liberado = true; extra = 'Você está liberado(a) para negociar! O Rodrigues já pode buscar propostas.'; carrHist(`${k.nome} coloca ${nm} na lista de negociáveis. Rodrigues já atende o telefone.`); }
    else ef = { dir: -10, emp: -2 };
  }
  const aplicado = carrAplica(ef);
  const r = { op, ok, chance: p, fala: carrTexto(F[op][ok ? 0 : 1]), ef: aplicado, extra, dispensa: null, liberado: !!c.liberado };
  // fecha o período: novas metas e próxima reunião
  c.reuniaoPendente = false; c.reuniaoAtual = null; c.ultimaMulta = null;
  if (c.satDir < CARR_DISPENSA) { r.dispensa = carrDispensa('metas'); carrSalvar(); return r; }
  carrProxReuniao(k); k.metas = carrGeraMetas(k);
  r.proxReuniao = k.proxReuniao; r.metas = k.metas;
  carrSujo(); carrSalvar();
  return r;
}
function carrPropostaRenovacao() {
  const c = carrDados(); const k = c.clube; const ra = c.reuniaoAtual; if (!k) return null;
  if (ra && ra.renov) return ra.renov;
  const def = carrClube(k.id); const F = CARR_FALAS[def.dirigente.perfil];
  const perf = k.totalMetas ? k.cumpridas / k.totalMetas : 0.5;
  const aceita = c.satDir >= CARR_RENOVA_MIN;
  const salario = carrR10(k.salario * carrCl(0.9 + perf * 0.35 + (c.satDir - 50) / 250, 0.85, 1.4));
  const renov = { aceita, salario, perf, fala: carrTexto(aceita ? F.renova : F.naoRenova) };
  if (ra) ra.renov = renov;
  return renov;
}
// aceitar = true (renovar) | false (sair livre)
function carrDecideRenovacao(aceitar) {
  const c = carrDados(); const k = c.clube; if (!k) return null;
  const rv = carrPropostaRenovacao(); const nm = carrNome(); const nomeClube = k.nome;
  c.reuniaoPendente = false; c.reuniaoAtual = null; c.ultimaMulta = null;
  if (rv.aceita && aceitar) {
    const d = carrDia();
    k.salario = rv.salario; k.inicioDia = d; k.fimDia = d + CARR_PERIODO * CARR_PERIODOS_CONTRATO; k.proxReuniao = d + CARR_PERIODO;
    k.promessa = false; k.estrutura = false; k.cumpridas = 0; k.totalMetas = 0; k.metas = carrGeraMetas(k);
    c.liberado = false; c.contadores.renovacoes++;
    const ef = carrAplica({ dir: 5, emp: 3, tor: 4, fama: 10 });
    carrHist(`${nomeClube} renova com ${nm} até o dia ${k.fimDia}: ${carrFmt(k.salario)} tostões/dia.`);
    carrLog(`✍️ Contrato renovado com o ${nomeClube} até o dia ${k.fimDia}!`, 'l-loot'); carrSom('moeda');
    carrSujo(); carrSalvar();
    return { renovou: true, ef, manchete: c.historico[0] };
  }
  const ef = rv.aceita ? carrAplica({ emp: -2 }) : carrAplica({ fama: -8, emp: -5 });
  const manchete = rv.aceita ? `${nm} recusa renovação e deixa o ${nomeClube}. "Quero novos desafios!"` : `${nomeClube} não renova com ${nm}. Jogador(a) está livre no mercado.`;
  carrLivre(manchete);
  carrLog(`📰 Seu contrato com o ${nomeClube} terminou. Fale com o Rodrigues (tecla U).`, 'l-info');
  carrSujo(); carrSalvar();
  return { renovou: false, ef, manchete };
}
function carrComecar() {
  const c = carrDados(); const s = G.save;
  if (c.ativa || (s.nivel || 1) < CARR_NIVEL_MIN) return false;
  c.ativa = true; c.ultimoPagamento = carrDia();
  carrHist(`Empresário Rodrigues assume a carreira de ${carrNome()}: "${carrG('Esse garoto', 'Essa garota')} vai longe!"`);
  c.ofertas = carrGeraOfertas({ inicial: true });
  carrLog('💼 Sua carreira profissional começou! O Rodrigues trouxe as primeiras propostas.', 'l-lvl'); carrSom('nivel');
  carrSujo(); carrSalvar();
  return true;
}

/* ============================================================
   API PARA O MOTOR
   ============================================================ */
function carreiraEvento(tipo, dados) {
  if (typeof G === 'undefined' || !G || !G.save || !G.save.carreira || !G.save.carreira.ativa) return;
  const c = carrDados(); const k = c.clube; dados = dados || {}; const ct = c.contadores;
  switch (tipo) {
    case 'abate':
      ct.abates++;
      if (dados.chefe) { ct.chefes++; carrProgMeta('chefe'); carrAplica({ fama: 18, tor: 3 }); carrLog('⭐ Chefão vencido! +18 de fama na carreira.', 'l-xp'); }
      if (k && dados.mapa === k.cidade) {
        ct.abatesCidade++; carrProgMeta('abates', 1, m => m.alvo === dados.mapa);
        if (ct.abatesCidade % 10 === 0) carrAplica({ fama: 1, tor: 1 });
      }
      break;
    case 'missao': ct.missoes++; carrProgMeta('missoes'); carrAplica({ fama: 6, tor: 1 }); break;
    case 'gol': ct.gols++; carrProgMeta('gols'); carrAplica({ fama: 2, tor: 1 }); break;
    case 'copa': ct.copas++; carrProgMeta('copa'); carrAplica({ fama: 5 }); break;
    case 'copaTitulo':
      c.titulos.copa++;
      if (k) for (const m of k.metas) if (m.tipo === 'copa' && m.prog < m.n) { m.prog = m.n; carrLog(`✅ Meta da carreira cumprida: ${m.desc}!`, 'l-xp'); }
      carrAplica({ fama: 30, tor: 10 }); carrHist(`${carrNome()} é ${carrG('campeão', 'campeã')} da Copa dos Sonhos! Torcida faz festa.`);
      break;
    case 'partida':
      ct.partidas++;
      if (dados.vitoria) { ct.vitorias++; carrProgMeta('partidas'); carrAplica({ fama: 4, tor: 4 }); }
      break;
    case 'exausto': ct.exaustos++; carrProgMeta('disciplina'); carrAplica({ tor: -2 }); break;
    case 'paz': {
      ct.paz++;
      const cid = carrCidadeCurta(dados.cidade) || 'na cidade';
      const ef = carrAplica({ tor: 20, fama: 35, dir: k ? 3 : 0 });
      carrHist(`${carrNome()} acalma as torcidas rivais em ${cid}: "Futebol é festa, não briga!"`);
      carrLog(`🕊️ Missão de paz em ${cid}! Torcida +${ef.tor || 0}, fama +${ef.fama || 0}.`, 'l-xp');
      break;
    }
    default: return;
  }
  carrSujo();
}

function checaCarreira() {
  if (typeof G === 'undefined' || !G || !G.save) return;
  const s = G.save;
  if (!s.carreira && (s.nivel || 1) < CARR_NIVEL_MIN) return;
  const c = carrDados(); const d = carrDia();
  if (!c.ativa) {
    if ((s.nivel || 1) >= CARR_NIVEL_MIN && !c.avisoInicio) {
      c.avisoInicio = true;
      carrBanner('Proposta de carreira!', 'O Empresário Rodrigues quer falar com você (tecla U)');
      carrLog('💼 O Empresário Rodrigues quer começar sua CARREIRA PROFISSIONAL! Aperte U.', 'l-xp'); carrSom('apito');
      try { if (typeof dica === 'function') dica('carreira_inicio', 'Você chegou ao nível 25! Aperte U para abrir a Carreira: assine com um clube, cumpra metas e vá às reuniões com o dirigente.'); } catch (e) { /* sem dica */ }
    }
    c.ultimoPagamento = d;
    return;
  }
  // virada de dia: salário, humor da torcida, lembretes
  if (d > c.ultimoPagamento) {
    const dias = Math.min(d - c.ultimoPagamento, 30);
    c.ultimoPagamento = d;
    const k = c.clube;
    if (k) {
      const bruto = k.salario * dias; const liq = carrLiquido(bruto);
      s.ouro = (s.ouro || 0) + liq; c.contadores.ganhos += liq;
      carrLog(`💰 Salário do ${k.nome}: +${carrFmt(liq)} tostões${dias > 1 ? ` (${dias} dias)` : ''}. O Rodrigues ficou com ${carrFmt(bruto - liq)} (10%).`, 'l-loot');
      carrSom('moeda');
    } else {
      if (!c.ofertas.length) c.ofertas = carrGeraOfertas();
      carrLog('📞 Rodrigues: "Você está sem clube, mas eu tenho propostas! Passa no meu escritório." (tecla U)', 'l-info');
    }
    // a torcida esquece aos poucos (volta para 50)
    for (let i = 0; i < dias; i++) c.satTorcida = c.satTorcida > 50 ? Math.max(50, c.satTorcida - 3) : Math.min(50, c.satTorcida + 1);
    carrSujo();
  }
  const k = c.clube; if (!k) return;
  if (!c.reuniaoPendente && d >= k.proxReuniao) {
    c.reuniaoPendente = true;
    const def = carrClube(k.id);
    carrBanner('Reunião marcada!', `${def.dirigente.nome} quer falar com você (tecla U)`);
    carrLog(`📅 Reunião marcada! ${def.dirigente.nome}, do ${k.nome}, quer falar com você. Aperte U.`, 'l-xp');
    carrSom('apito'); carrSujo();
  }
  // reunião esquecida por mais de 1 dia: todo mundo fica chateado
  if (c.reuniaoPendente && d - k.proxReuniao > 1 && c.ultimaMulta !== d) {
    c.ultimaMulta = d;
    carrAplica({ dir: -8, emp: -4 });
    const def = carrClube(k.id);
    carrLog(`😠 Você faltou à reunião com ${def.dirigente.nome}! Dirigente −8, Empresário −4. Aperte U e vá à reunião.`, 'l-dano');
    if (c.satDir < CARR_DISPENSA) carrDispensa('ausencia');
    carrSujo(); carrSalvar();
  }
}

function podeViajar(cidade) {
  // cidades do Brasil (e prédios/interiores): sempre liberadas
  const x = CARR_EXTERIOR[cidade];
  if (CARR_BRASIL.includes(cidade) || !x) return { ok: true, motivo: '' };
  const P = CARR_PAISES[x.pais];
  if (typeof G === 'undefined' || !G || !G.save) return { ok: false, motivo: `Para ir ${x.a} você precisa ser jogador(a) profissional.` };
  const c = G.save.carreira;
  const ativa = !!(c && c.ativa); const fama = ativa ? c.fama || 0 : 0;
  if (ativa && c.clube && c.clube.pais === x.pais) return { ok: true, motivo: `Seu clube, o ${c.clube.nome}, joga ${P.em}. Boa viagem ${x.para}!` };
  if (ativa && fama >= x.convite) return { ok: true, motivo: `Convite para amistoso ${x.em}! Sua fama abriu as portas ${P.de}.` };
  if (!ativa) return { ok: false, motivo: `Para ir ${x.a} você precisa ser ${carrG('jogador profissional', 'jogadora profissional')}. A carreira começa no nível ${CARR_NIVEL_MIN} com o Empresário Rodrigues (tecla U).` };
  return { ok: false, motivo: `Para ir ${x.a} você precisa jogar num clube ${P.de} (a partir do nível ${CARR_TIERS[x.tier].nivel}) ou ter ${carrFmt(x.convite)} de fama para ganhar um convite de amistoso. Sua fama: ${carrFmt(fama)}.` };
}

function bonusCarreira() {
  if (typeof G === 'undefined' || !G || !G.save) return { xp: 1 };
  const c = G.save.carreira; if (!c || !c.ativa) return { xp: 1 };
  let xp = 1 + (carrCl(c.satTorcida, 0, 100) - 50) / 500;
  if ((c.fama || 0) >= CARR_FAMA_BONUS_XP) xp += 0.05;
  return { xp: Math.round(xp * 1000) / 1000 };
}

/* ============================================================
   INTERFACE
   ============================================================ */
let CARR_UI = { atalhos: {} };

function carrCss() {
  if (typeof document === 'undefined' || document.getElementById('carreira-css')) return;
  const st = document.createElement('style'); st.id = 'carreira-css';
  st.textContent = `
.carreira { font-family: Nunito, sans-serif; color: var(--tinta, #3b2410); }
.carreira h2, .carreira h3, .carreira .tit { font-family: 'Fredoka', sans-serif; }
.carreira h2 { margin: 0 36px 8px 0; }
.carreira h3 { margin: 12px 0 6px; font-size: 18px; color: var(--madeira2, #5e2f14); }
.carreira .caixa { background: #fffaf0; border: 2px solid var(--papel2, #ecd09a); border-radius: 10px; padding: 8px 12px; }
.carreira .barra { height: 12px; background: #c8b088; border-radius: 6px; overflow: hidden; margin: 4px 0; }
.carreira .barra i { display: block; height: 100%; background: linear-gradient(#8ae05a, #3a9a2a); transition: width .4s; }
.carreira .barra.ouro i { background: linear-gradient(#ffe070, #f0a81a); }
.carreira .barra.b-med i { background: linear-gradient(#ffe070, #e0b020); }
.carreira .barra.b-ruim i { background: linear-gradient(#ff9a8a, #d03a3a); }
.carreira .topo-fama { display: flex; gap: 12px; align-items: center; }
.carreira .topo-fama .em { font-size: 40px; line-height: 1; }
.carreira .topo-fama .info { flex: 1; min-width: 0; }
.carreira .topo-fama .rank { font-family: 'Fredoka', sans-serif; font-size: 22px; color: var(--roxo2, #3a2780); }
.carreira .topo-fama small { font-weight: 700; opacity: .8; }
.carreira .grade2 { display: grid; grid-template-columns: 1.25fr 1fr; gap: 12px; margin-top: 10px; align-items: start; }
.carreira .clube-card { display: flex; gap: 12px; align-items: flex-start; border: 3px solid var(--madeira3, #b8733a); border-radius: 12px; padding: 10px; background: #fffaf0; position: relative; overflow: hidden; }
.carreira .clube-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 7px; background: linear-gradient(var(--c1, #888) 50%, var(--c2, #ccc) 50%); }
.carreira .clube-card .nm { font-family: 'Fredoka', sans-serif; font-size: 21px; line-height: 1.1; color: var(--madeira2, #5e2f14); }
.carreira .clube-card .sub { font-weight: 700; font-size: 13px; opacity: .85; margin: 2px 0 6px; }
.carreira .clube-card p { margin: 3px 0 !important; font-size: 14px; }
.carreira .escudo { flex-shrink: 0; filter: drop-shadow(0 2px 0 rgba(0,0,0,.3)); }
.carreira .pill { display: inline-block; background: #fffaf0; border: 2px solid var(--papel2, #ecd09a); border-radius: 999px; padding: 1px 9px; font-weight: 800; font-size: 12px; white-space: nowrap; margin: 2px 2px 2px 0; }
.carreira .pill.roxo { background: var(--roxo2, #3a2780); color: #fff; border-color: #24125e; }
.carreira .pill.alerta { background: #ffe070; border-color: #b08a0a; animation: carrPulso 1.2s infinite; }
.carreira .pill.verde { background: #d8f5d0; border-color: #6ac85a; }
.carreira .pill.cinza { opacity: .6; }
.carreira .metas { display: flex; flex-direction: column; gap: 6px; }
.carreira .meta { display: grid; grid-template-columns: 26px 1fr auto; gap: 4px 8px; align-items: center; background: #fffaf0; border: 2px solid var(--papel2, #ecd09a); border-radius: 8px; padding: 5px 8px; }
.carreira .meta .ic { font-size: 18px; text-align: center; }
.carreira .meta .ds { font-weight: 800; font-size: 14px; }
.carreira .meta .nn { font-weight: 800; font-size: 13px; white-space: nowrap; }
.carreira .meta .barra { grid-column: 2 / 4; margin: 0; height: 8px; }
.carreira .meta.ok { background: #e8f8e0; border-color: #6ac85a; }
.carreira .meta.falhou { background: #fbe4e0; border-color: #e07a6a; }
.carreira .medidores { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.carreira .medidor { background: #fffaf0; border: 2px solid var(--papel2, #ecd09a); border-radius: 10px; padding: 6px 8px; text-align: center; }
.carreira .medidor .cara { font-size: 32px; line-height: 1.1; display: block; }
.carreira .medidor b { font-family: 'Fredoka', sans-serif; font-size: 15px; display: block; }
.carreira .medidor small { font-weight: 700; font-size: 12px; opacity: .8; }
.carreira .hist { max-height: 190px; overflow-y: auto; background: #f6f0e0; border: 2px solid #3b2410; border-radius: 4px; padding: 4px 10px; box-shadow: 3px 3px 0 rgba(0,0,0,.2); }
.carreira .hist .jn { font-family: Georgia, 'Times New Roman', serif; font-weight: 900; text-align: center; border-bottom: 3px double #3b2410; letter-spacing: 1px; padding: 2px 0 4px; font-size: 15px; }
.carreira .hist div.m { font-family: Georgia, 'Times New Roman', serif; font-size: 14px; padding: 4px 0; border-bottom: 1px dashed #b8a888; }
.carreira .hist div.m:first-of-type { font-weight: 700; font-size: 15px; }
.carreira .reuniao-topo { display: flex; gap: 14px; align-items: flex-end; margin: 4px 0 10px; }
.carreira .retrato-carr { width: 130px; height: 162px; flex-shrink: 0; border: 3px solid var(--madeira3, #b8733a); border-radius: 10px; background: radial-gradient(circle at 50% 35%, #fff6d8, #e8cf98); }
.carreira .balao { position: relative; flex: 1; background: #fff; border: 3px solid var(--madeira2, #5e2f14); border-radius: 14px; padding: 10px 14px; font-weight: 700; font-size: 16px; line-height: 1.4; margin-bottom: 14px; }
.carreira .balao::before { content: ''; position: absolute; left: -17px; bottom: 16px; border: 9px solid transparent; border-right: 15px solid var(--madeira2, #5e2f14); border-left: 0; }
.carreira .balao::after { content: ''; position: absolute; left: -11px; bottom: 19px; border: 6px solid transparent; border-right: 11px solid #fff; border-left: 0; }
.carreira .balao .quem { display: block; font-family: 'Fredoka', sans-serif; font-size: 13px; color: var(--roxo2, #3a2780); margin-bottom: 2px; }
.carreira .passo { background: #fff6c0; border: 2px dashed #e0b030; border-radius: 8px; padding: 6px 12px; font-weight: 800; margin: 6px 0 8px; }
.carreira .res { display: flex; flex-direction: column; gap: 5px; }
.carreira .res .linha { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; background: #fffaf0; border: 2px solid var(--papel2, #ecd09a); border-radius: 8px; padding: 5px 8px; animation: carrEntra .3s ease-out both; }
.carreira .res .linha.ok { border-color: #6ac85a; background: #eefbe8; }
.carreira .res .linha.nao { border-color: #e07a6a; background: #fdeeea; }
.carreira .res .linha .ds { flex: 1; min-width: 180px; font-weight: 800; }
.carreira .efeitos { display: flex; flex-wrap: wrap; gap: 5px; }
.carreira .ef { border-radius: 999px; padding: 1px 9px; font-weight: 800; font-size: 12px; white-space: nowrap; }
.carreira .ef.pos { background: #d8f5d0; color: #1a6a1a; }
.carreira .ef.neg { background: #fbd8d4; color: #a01a1a; }
.carreira .escolhas { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.carreira .escolha { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; text-align: left; background: #fffaf0; border: 3px solid var(--madeira3, #b8733a); border-radius: 12px; padding: 10px 12px; font-family: Nunito, sans-serif; color: var(--tinta, #3b2410); cursor: pointer; }
.carreira .escolha:hover, .carreira .escolha:focus-visible { border-color: var(--amarelo2, #f0a81a); background: #fff2c0; transform: translateY(-2px); }
.carreira .escolha .t { font-weight: 800; font-size: 15px; }
.carreira .escolha .em { font-size: 24px; }
.carreira .escolha small { font-weight: 700; font-size: 12px; opacity: .8; }
.carreira .escolha .k { font-size: 11px; background: #fff; border: 1px solid #aaa; border-bottom-width: 3px; border-radius: 4px; padding: 0 5px; }
.carreira .veredito { font-family: 'Fredoka', sans-serif; font-size: 26px; text-align: center; margin: 4px 0 8px; animation: carrPop .5s ease-out; }
.carreira .veredito.sim { color: #1a8a2a; } .carreira .veredito.nao { color: #c02a2a; }
.carreira .ofertas { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; }
.carreira .oferta { background: #fffaf0; border: 3px solid var(--madeira3, #b8733a); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 4px; position: relative; animation: carrEntra .35s ease-out both; }
.carreira .oferta .cab { display: flex; gap: 8px; align-items: center; }
.carreira .oferta .nm { font-family: 'Fredoka', sans-serif; font-size: 18px; line-height: 1.1; color: var(--madeira2, #5e2f14); }
.carreira .oferta p { margin: 1px 0 !important; font-size: 13px; font-weight: 700; line-height: 1.3 !important; }
.carreira .oferta .sal { font-size: 16px; font-weight: 900; color: #1a6a1a; }
.carreira .oferta .btn { margin-top: auto; }
.carreira .oferta.sonho { border-color: #b08a0a; background: linear-gradient(#fff4c0, #fffaf0 60%); box-shadow: 0 0 0 3px #ffe070; }
.carreira .oferta.europa { border-color: var(--roxo2, #3a2780); }
.carreira .tag-sonho { position: absolute; top: -11px; right: 10px; background: linear-gradient(#ffe070, #f0a81a); border: 2px solid #9a5a0a; border-radius: 999px; font-size: 11px; font-weight: 900; padding: 0 8px; }
.carreira .aviso { background: #fde4e0; border: 2px solid #d03a3a; border-radius: 8px; padding: 6px 10px; font-weight: 800; margin: 6px 0; }
.carreira .jornal { font-family: Georgia, 'Times New Roman', serif; background: #f6f0e0; border: 3px solid #3b2410; padding: 10px 14px; margin: 8px 0; box-shadow: 4px 4px 0 rgba(0,0,0,.25); animation: carrPop .5s ease-out; }
.carreira .jornal .jn { font-weight: 900; font-size: 13px; letter-spacing: 2px; border-bottom: 3px double #3b2410; margin-bottom: 6px; text-align: center; }
.carreira .jornal .mc { font-size: 20px; font-weight: 900; line-height: 1.25; }
.carreira .europa { display: flex; gap: 6px; flex-wrap: wrap; }
.carreira .dica { font-size: 12px; font-weight: 700; opacity: .85; margin: 6px 0 0; }
.carreira .regras { margin: 6px 0; padding-left: 20px; font-weight: 700; line-height: 1.5; }
@keyframes carrPop { 0% { transform: scale(.7); opacity: .3; } 60% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
@keyframes carrEntra { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes carrPulso { 50% { box-shadow: 0 0 0 4px rgba(240,168,26,.4); } }
@media (max-width: 760px) {
  .carreira .grade2 { grid-template-columns: 1fr; }
  .carreira .escolhas { grid-template-columns: 1fr; }
  .carreira .retrato-carr { width: 92px; height: 115px; }
  .carreira .balao { font-size: 14px; }
  .carreira .medidor .cara { font-size: 26px; }
}`;
  document.head.appendChild(st);
}

/* ---------- utilidades de UI ---------- */
function carrTecla(ev) {
  const at = CARR_UI && CARR_UI.atalhos; if (!at) return;
  const tag = (ev.target && ev.target.tagName || '').toLowerCase();
  if ((ev.key === 'Enter' || ev.key === ' ') && (tag === 'button' || tag === 'a')) return;
  const k = ev.key && ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  const fn = at[k]; if (fn) { ev.preventDefault(); fn(); }
}
function carrMostra(atalhos, ...nodes) {
  carrCss();
  CARR_UI = { atalhos: atalhos || {} };
  abreModal.largo = true;
  abreModal(el('div', { class: 'carreira' }, ...nodes));
  if (typeof window !== 'undefined') window.teclaModal = carrTecla;
}
function carrBarra(p, cls) { return el('div', { class: 'barra' + (cls ? ' ' + cls : '') }, el('i', { style: `width:${carrCl(p * 100, 0, 100).toFixed(1)}%` })); }
function carrBarraSat(v) { return carrBarra(v / 100, v >= 60 ? '' : v >= 30 ? 'b-med' : 'b-ruim'); }
function carrRetrato(look) {
  const cv = mkCanvas(180, 225); cv.className = 'retrato-carr';
  try { pintaAparencia(cv, look); } catch (e) { /* sem retrato */ }
  return cv;
}
function carrTopo(look, quem, ...fala) {
  return el('div', { class: 'reuniao-topo' }, carrRetrato(look), el('div', { class: 'balao' }, el('span', { class: 'quem' }, quem), ...fala));
}
function carrEscudo(def, tam = 56) {
  const W = 64, H = 74; const cv = mkCanvas(W, H); cv.className = 'escudo';
  try {
    const x = cv.getContext('2d');
    const forma = () => { x.beginPath(); x.moveTo(6, 5); x.lineTo(58, 5); x.lineTo(58, 36); x.quadraticCurveTo(58, 60, 32, 70); x.quadraticCurveTo(6, 60, 6, 36); x.closePath(); };
    forma(); x.fillStyle = def.cor1; x.fill();
    x.save(); forma(); x.clip(); x.fillStyle = def.cor2;
    if (def.estilo === 'listras') for (let i = 14; i < 58; i += 13) x.fillRect(i, 0, 6, H);
    else if (def.estilo === 'faixa') { x.translate(32, 38); x.rotate(-0.7); x.fillRect(-60, -7, 120, 14); }
    else if (def.estilo === 'metade') x.fillRect(32, 0, 32, H);
    else x.fillRect(0, 22, W, 12);
    x.restore();
    x.beginPath(); x.arc(32, 38, 15, 0, Math.PI * 2); x.fillStyle = '#fffaf0'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = '#2a1a10'; x.stroke();
    x.fillStyle = '#2a1a10'; x.font = `800 ${def.sigla.length > 2 ? 11 : 13}px Fredoka, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(def.sigla, 32, 39);
    // estrelinhas do nível da liga
    x.fillStyle = '#ffd23f'; x.strokeStyle = '#2a1a10'; x.lineWidth = 1;
    const n = def.tier;
    if (n <= 5) { const ini = 32 - (n - 1) * 4.5; x.font = '9px sans-serif'; for (let i = 0; i < n; i++) x.fillText('★', ini + i * 9, 14); }
    else { x.font = '800 10px Fredoka, sans-serif'; x.fillText(`★ ${n}`, 32, 14); }
    forma(); x.lineWidth = 3.5; x.strokeStyle = '#2a1a10'; x.stroke();
  } catch (e) { /* canvas indisponível */ }
  if (cv.style) { cv.style.width = tam + 'px'; cv.style.height = Math.round(tam * H / W) + 'px'; }
  return cv;
}
const CARR_EF_ROT = { dir: '👔 Dirigente', emp: '🤝 Empresário', tor: '📣 Torcida', fama: '⭐ Fama', ouro: '🪙 tostões', sal: '💰 salário/dia' };
function carrChips(ef) {
  const out = [];
  for (const k of ['dir', 'emp', 'tor', 'fama', 'sal', 'ouro']) {
    const v = ef && ef[k]; if (!v) continue;
    out.push(el('span', { class: 'ef ' + (v > 0 ? 'pos' : 'neg') }, `${v > 0 ? '+' : '−'}${carrFmt(Math.abs(v))} ${CARR_EF_ROT[k]}`));
  }
  return el('div', { class: 'efeitos' }, out.length ? out : el('span', { class: 'ef' }, 'sem mudanças'));
}
function carrMetaLinha(m) {
  const ok = carrMetaOk(m); const disc = m.tipo === 'disciplina';
  const falhou = disc && !ok;
  const p = disc ? (m.n ? (m.n - Math.min(m.prog, m.n)) / m.n : (m.prog ? 0 : 1)) : (m.n ? m.prog / m.n : 1);
  const txt = disc ? `${m.prog}/${m.n} ${falhou ? '❌' : '👍'}` : `${Math.min(m.prog, m.n)}/${m.n}${ok ? ' ✅' : ''}`;
  return el('div', { class: 'meta' + (disc ? (falhou ? ' falhou' : '') : (ok ? ' ok' : '')) },
    el('span', { class: 'ic' }, CARR_META_EMOJI[m.tipo] || '🎯'), el('span', { class: 'ds' }, m.desc), el('span', { class: 'nn' }, txt),
    carrBarra(p, disc ? (falhou ? 'b-ruim' : 'b-med') : ''));
}
function carrMedidor(nome, v, dica, ativo = true) {
  return el('div', { class: 'medidor', title: dica },
    el('span', { class: 'cara' }, ativo ? carrCara(v) : '💤'), el('b', {}, nome), carrBarraSat(ativo ? v : 0),
    el('small', {}, ativo ? `${v}/100 · ${carrHumor(v)}` : 'sem clube'));
}
function carrSalarioTxt(sal) {
  return el('span', {}, el('b', {}, typeof precoTag === 'function' ? precoTag(carrLiquido(sal)) : carrFmt(carrLiquido(sal))), ' por dia ', el('small', {}, `(bruto ${carrFmt(sal)}, 10% vai pro Rodrigues)`));
}
function carrFechar() { return el('button', { class: 'btn', onclick: () => fechaModal() }, 'Fechar'); }
function carrVoltar() { return el('button', { class: 'btn', onclick: () => abrirCarreira() }, '◀ Voltar para a carreira'); }

/* ---------- painel principal ---------- */
function abrirCarreira() {
  if (typeof G === 'undefined' || !G || !G.save) return;
  const c = carrDados(); const s = G.save;
  if (!c.ativa) return carrTelaInativa();
  const r = carrRank(c.fama); const k = c.clube; const d = carrDia();
  // fama
  const faltam = r.prox ? r.prox.min - c.fama : 0;
  const pFama = r.prox ? (c.fama - r.min) / (r.prox.min - r.min) : 1;
  const fama = el('div', { class: 'caixa topo-fama' }, el('span', { class: 'em' }, r.emoji),
    el('div', { class: 'info' }, el('div', { class: 'rank' }, r.nome), carrBarra(c.fama / CARR_FAMA_MAX, 'ouro'),
      el('small', {}, `Fama ${carrFmt(c.fama)}/${carrFmt(CARR_FAMA_MAX)}`, r.prox ? ` · faltam ${faltam} para ${r.prox.emoji} ${r.prox.nome}` : ' · o topo do mundo!')),
    el('div', { style: 'text-align:right' }, el('small', {}, 'Próximo título'), carrBarra(pFama), el('small', {}, `${Math.round(pFama * 100)}%`)));
  // clube
  let clube;
  if (k) {
    const def = carrClube(k.id); const pf = CARR_PERFIS[def.dirigente.perfil];
    const pend = c.reuniaoPendente;
    clube = el('div', {},
      el('div', { class: 'clube-card', style: `--c1:${def.cor1};--c2:${def.cor2}` }, carrEscudo(def, 60),
        el('div', { style: 'flex:1;min-width:0' },
          el('div', { class: 'nm' }, def.nome),
          el('div', { class: 'sub' }, `${CARR_PAISES[def.pais].bandeira} ${CARR_PAISES[def.pais].nome} · ${carrCidadeNome(def.cidade)} · ${CARR_TIERS[def.tier].liga}`),
          el('p', {}, '💰 Salário: ', carrSalarioTxt(k.salario)),
          el('p', {}, `📄 Contrato até o dia ${k.fimDia}`, el('small', {}, k.fimDia - d > 0 ? ` (faltam ${k.fimDia - d} dias)` : ' (terminando!)')),
          el('p', {}, `👔 Dirigente: ${def.dirigente.nome} `, el('span', { class: 'pill', title: pf.desc }, `${pf.emoji} ${pf.nome}`)),
          el('p', {}, pend ? el('span', { class: 'pill alerta' }, `📅 REUNIÃO MARCADA! Vá agora (desde o dia ${k.proxReuniao})`) : el('span', { class: 'pill' }, `📅 Próxima reunião: dia ${k.proxReuniao}`),
            c.liberado ? el('span', { class: 'pill verde' }, '✈️ Liberado(a) para negociar') : null,
            k.promessa ? el('span', { class: 'pill roxo' }, '⚽ Metas turbinadas: bônus ×2') : null,
            k.estrutura ? el('span', { class: 'pill verde' }, '🏗️ Estrutura nova: bônus +50%') : null))),
      el('h3', {}, '🎯 Metas até a próxima reunião'),
      el('div', { class: 'metas' }, k.metas.length ? k.metas.map(carrMetaLinha) : el('p', { class: 'vazio' }, 'Sem metas neste período.')));
  } else {
    clube = el('div', { class: 'clube-card', style: '--c1:#aaa;--c2:#ddd' }, el('span', { style: 'font-size:48px' }, '🎒'),
      el('div', {}, el('div', { class: 'nm' }, `Sem clube — ${carrG('jogador livre', 'jogadora livre')}`),
        el('p', {}, 'Você não recebe salário enquanto estiver sem clube. O Rodrigues está com propostas na mesa!'),
        el('button', { class: 'btn amarelo', onclick: () => reuniaoEmpresario() }, '🤝 Ver propostas')));
  }
  // medidores
  const b = bonusCarreira(); const pct = Math.round((b.xp - 1) * 100);
  const medidores = el('div', {},
    el('h3', { style: 'margin-top:0' }, '😃 Satisfação'),
    el('div', { class: 'medidores' },
      carrMedidor('Dirigente', c.satDir, 'Cumpra as metas e escolha bem o que falar nas reuniões. Abaixo de 15 = dispensa!', !!k),
      carrMedidor('Empresário', c.satEmp, 'O Rodrigues gosta quando você assina contratos e cumpre metas. Recusar demais o deixa chateado.'),
      carrMedidor('Torcida', c.satTorcida, 'Vitórias, gols, chefões e missões de paz deixam a torcida feliz. Torcida feliz dá XP extra!')),
    el('p', { class: 'dica' }, `📣 Bônus da torcida${c.fama >= CARR_FAMA_BONUS_XP ? ' + fama' : ''}: `, el('b', {}, `${pct >= 0 ? '+' : '−'}${Math.abs(pct)}% de XP`), c.fama < CARR_FAMA_BONUS_XP ? ` (com ${carrFmt(CARR_FAMA_BONUS_XP)} de fama: +5% extra)` : ''),
    el('h3', {}, '✈️ Viagens internacionais'),
    el('div', { class: 'europa' }, Object.keys(CARR_EXTERIOR).map(cid => {
      const pv = podeViajar(cid);
      return el('span', { class: 'pill ' + (pv.ok ? 'verde' : 'cinza'), title: pv.motivo }, `${pv.ok ? '🔓' : '🔒'} ${CARR_PAISES[CARR_EXTERIOR[cid].pais].bandeira} ${CARR_EXTERIOR[cid].nome} (${carrFmt(CARR_EXTERIOR[cid].convite)}⭐)`);
    })),
    c.paises.length ? el('p', { class: 'dica' }, 'Países em que já jogou: ', c.paises.map(p => `${CARR_PAISES[p].bandeira} ${CARR_PAISES[p].nome}`).join(' · ')) : null,
    el('p', { class: 'dica' }, `Metas cumpridas: ${c.contadores.metasCumpridas} · Transferências: ${c.contadores.transferencias} · Títulos da Copa: ${c.titulos.copa}`));
  // botões
  const podeReuniao = !!(k && c.reuniaoPendente);
  const ops = el('div', { class: 'opcoes' },
    el('button', { class: 'btn ' + (podeReuniao ? 'amarelo grande' : ''), disabled: podeReuniao ? null : 'disabled', title: podeReuniao ? 'O dirigente está esperando!' : (k ? `A próxima reunião é no dia ${k.proxReuniao}` : 'Você está sem clube'), onclick: () => reuniaoDirigente() }, podeReuniao ? '📋 Ir para a reunião (R)' : '📋 Ir para a reunião'),
    el('button', { class: 'btn ' + (!k ? 'amarelo grande' : 'verde'), onclick: () => reuniaoEmpresario() }, '🤝 Falar com o empresário (E)'),
    carrFechar());
  // histórico
  const hist = el('div', { class: 'hist' }, el('div', { class: 'jn' }, '📰 GAZETA DO CRAQUE'),
    c.historico.length ? c.historico.slice(0, 30).map(h => el('div', { class: 'm' }, h)) : el('div', { class: 'm' }, 'Nenhuma notícia ainda.'));
  const at = { e: () => reuniaoEmpresario() };
  if (podeReuniao) { at.r = () => reuniaoDirigente(); at.Enter = at.r; }
  carrMostra(at,
    el('h2', {}, '💼 Minha Carreira'),
    fama,
    el('div', { class: 'grade2' }, clube, medidores),
    ops,
    el('h3', {}, '🗞️ Histórico'),
    hist);
}
function carrTelaInativa() {
  const s = G.save; const pode = (s.nivel || 1) >= CARR_NIVEL_MIN;
  const fala = pode
    ? `E aí, craque! Sou o Rodrigues, empresário de futebol. Vi você jogando e tenho certeza: você está ${carrG('pronto', 'pronta')} para virar ${carrG('profissional', 'profissional')}! Vamos assinar seu primeiro contrato?`
    : `Opa! Ainda é cedo. Quando você chegar ao nível ${CARR_NIVEL_MIN}, eu te transformo em ${carrG('jogador profissional', 'jogadora profissional')}. Continue treinando!`;
  const at = {}; if (pode) { at.Enter = () => { if (carrComecar()) reuniaoEmpresario(); }; }
  carrMostra(at,
    el('h2', {}, '💼 Carreira Profissional'),
    carrTopo(CARR_LOOK_RODRIGUES, 'Empresário Rodrigues', fala),
    el('ul', { class: 'regras' },
      el('li', {}, 'Comece no Brasil 🇧🇷 e rode o mundo: Cairo 🇪🇬, Tóquio 🇯🇵, Doha 🇶🇦, Miami 🇺🇸 e, na Europa, Lisboa 🇵🇹, Madri 🇪🇸, Milão 🇮🇹, Munique 🇩🇪 e Londres 🇬🇧!'),
      el('li', {}, `A cada ${CARR_PERIODO} dias de jogo tem reunião com o dirigente: ele avalia suas metas.`),
      el('li', {}, 'Nas reuniões, suas escolhas decidem aumentos, renovações, transferências... e até dispensas!'),
      el('li', {}, 'Deixe o dirigente, o empresário e a torcida felizes. Torcida feliz = até +10% de XP!'),
      el('li', {}, 'Ganhe fama para receber propostas melhores e convites para jogar fora do país.')),
    pode ? null : el('div', { class: 'caixa' }, el('b', {}, `Nível ${s.nivel || 1} de ${CARR_NIVEL_MIN}`), carrBarra((s.nivel || 1) / CARR_NIVEL_MIN)),
    el('div', { class: 'opcoes' },
      pode ? el('button', { class: 'btn amarelo grande', onclick: () => { if (carrComecar()) reuniaoEmpresario(); } }, '⚽ Começar carreira') : el('button', { class: 'btn', disabled: 'disabled' }, `🔒 Começar carreira (nível ${CARR_NIVEL_MIN})`),
      carrFechar()));
}

/* ---------- reunião com o dirigente ---------- */
function reuniaoDirigente() {
  if (typeof G === 'undefined' || !G || !G.save) return;
  const c = carrDados();
  if (!c.ativa) return abrirCarreira();
  const k = c.clube;
  if (!k) {
    return carrMostra({}, el('h2', {}, '📋 Reunião'),
      el('p', {}, 'Você está sem clube, então não tem reunião com dirigente. O Rodrigues pode te arrumar um time!'),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => reuniaoEmpresario() }, '🤝 Falar com o Rodrigues'), carrVoltar(), carrFechar()));
  }
  const def = carrClube(k.id); const F = CARR_FALAS[def.dirigente.perfil];
  if (!c.reuniaoPendente) {
    return carrMostra({}, el('h2', {}, `📋 ${def.nome}`),
      carrTopo(def.dirigente.look, def.dirigente.nome, carrTexto(F.espera, { dia: k.proxReuniao })),
      el('h3', {}, '🎯 Suas metas'), el('div', { class: 'metas' }, k.metas.map(carrMetaLinha)),
      el('div', { class: 'opcoes' }, carrVoltar(), carrFechar()));
  }
  const ra = carrIniciaReuniao();
  if (ra.etapa === 'escolha') return carrTelaEscolha(ra);
  if (ra.etapa === 'renovacao') return carrTelaRenovacao(ra);
  return carrTelaAvaliacao(ra);
}
function carrTelaAvaliacao(ra) {
  const c = carrDados(); const k = c.clube; const def = carrClube(k.id);
  const seguir = () => {
    const r = carrPosAvaliacao();
    if (r.etapa === 'dispensa') return carrTelaDispensa(r.info);
    if (r.etapa === 'renovacao') return carrTelaRenovacao(c.reuniaoAtual);
    if (r.etapa === 'escolha') return carrTelaEscolha(c.reuniaoAtual);
    return abrirCarreira();
  };
  carrMostra({ Enter: seguir, c: seguir },
    el('h2', {}, `📋 Reunião no ${def.nome}`),
    carrTopo(def.dirigente.look, `${def.dirigente.nome} · ${CARR_PERFIS[def.dirigente.perfil].emoji} ${CARR_PERFIS[def.dirigente.perfil].nome}`, ra.fala, ' ', ra.avaliacao),
    el('div', { class: 'passo' }, `1️⃣ Avaliação das metas: ${ra.ok} de ${ra.total} cumprida${ra.total === 1 ? '' : 's'}`),
    el('div', { class: 'res' }, ra.res.map((x, i) => {
      const ln = el('div', { class: 'linha ' + (x.ok ? 'ok' : 'nao'), style: `animation-delay:${i * 0.15}s` },
        el('span', {}, x.ok ? '✅' : '❌'), el('span', { class: 'ds' }, `${x.desc} (${x.prog}/${x.n})`), carrChips(x.ef));
      return ln;
    })),
    ra.extras && ra.extras.length ? el('p', { class: 'dica' }, ra.extras.join(' · ')) : null,
    el('h3', {}, 'Resultado da avaliação'), carrChips(ra.tot),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: seguir }, 'Continuar ▶'), carrFechar()));
}
function carrTelaEscolha(ra) {
  const c = carrDados(); const k = c.clube; const def = carrClube(k.id);
  const at = {};
  const botoes = ra.opcoes.map((op, i) => {
    const o = CARR_OPCOES[op]; const p = carrChance(op);
    const fn = () => carrTelaResposta(carrEscolhe(op), def);
    at[String(i + 1)] = fn;
    return el('button', { class: 'escolha', onclick: fn },
      el('span', { class: 'em' }, o.emoji), el('span', { class: 't' }, carrOpTxt(op)),
      el('small', {}, el('span', { class: 'k' }, i + 1), ` 🎲 chance ${carrChanceTxt(p)}`));
  });
  carrMostra(at,
    el('h2', {}, `📋 Reunião no ${def.nome}`),
    carrTopo(def.dirigente.look, def.dirigente.nome, carrTexto('E então, {nome}? O que você quer me dizer?')),
    el('div', { class: 'passo' }, '2️⃣ Sua vez de falar: escolha UMA opção (teclas 1 a 4)'),
    el('div', { class: 'escolhas' }, botoes),
    el('p', { class: 'dica' }, `${CARR_PERFIS[def.dirigente.perfil].emoji} ${def.dirigente.nome} é ${CARR_PERFIS[def.dirigente.perfil].nome.toLowerCase()}: ${CARR_PERFIS[def.dirigente.perfil].desc} Dirigente satisfeito e muita fama aumentam suas chances.`));
}
function carrTelaResposta(r, def) {
  if (!r) return abrirCarreira();
  const o = CARR_OPCOES[r.op];
  const ops = el('div', { class: 'opcoes' });
  const at = {};
  if (r.dispensa) {
    const fn = () => carrTelaDispensa(r.dispensa); at.Enter = fn;
    ops.append(el('button', { class: 'btn amarelo grande', onclick: fn }, 'Continuar ▶'));
  } else {
    if (r.op === 'negociar' && r.ok) { const fn = () => reuniaoEmpresario(); at.Enter = fn; ops.append(el('button', { class: 'btn amarelo grande', onclick: fn }, '🤝 Ver propostas com o Rodrigues')); }
    else at.Enter = () => abrirCarreira();
    ops.append(carrVoltar(), carrFechar());
  }
  const k = carrDados().clube;
  carrMostra(at,
    el('h2', {}, `📋 Reunião no ${def.nome}`),
    el('p', { class: 'dica' }, `Você disse: ${o.emoji} ${carrOpTxt(r.op)}`),
    carrTopo(def.dirigente.look, def.dirigente.nome, r.fala),
    el('div', { class: 'veredito ' + (r.ok ? 'sim' : 'nao') }, r.ok ? '👍 Deu certo!' : '👎 Não rolou...'),
    carrChips(r.ef),
    r.extra ? el('p', { class: 'dica' }, r.extra) : null,
    !r.dispensa && k ? el('div', {}, el('h3', {}, `🎯 Novas metas até o dia ${k.proxReuniao}`), el('div', { class: 'metas' }, k.metas.map(carrMetaLinha))) : null,
    ops);
}
function carrTelaRenovacao(ra) {
  const c = carrDados(); const k = c.clube; const def = carrClube(k.id);
  const rv = carrPropostaRenovacao();
  const fim = res => carrTelaFimContrato(res, def);
  const ops = el('div', { class: 'opcoes' });
  const at = {};
  if (rv.aceita) {
    const sim = () => fim(carrDecideRenovacao(true)); const nao = () => fim(carrDecideRenovacao(false));
    at.s = sim; at.n = nao;
    ops.append(el('button', { class: 'btn verde grande', onclick: sim }, `✍️ Renovar por ${carrFmt(carrLiquido(rv.salario))}/dia (S)`),
      el('button', { class: 'btn', onclick: nao }, '🚪 Não renovar e ouvir o mercado (N)'));
  } else {
    const ok = () => fim(carrDecideRenovacao(false)); at.Enter = ok;
    ops.append(el('button', { class: 'btn amarelo grande', onclick: ok }, 'Entendi ▶'));
  }
  const dif = rv.salario - k.salario;
  carrMostra(at,
    el('h2', {}, `📄 Fim de contrato no ${def.nome}`),
    carrTopo(def.dirigente.look, def.dirigente.nome, rv.fala),
    el('div', { class: 'passo' }, `2️⃣ Renovação — você cumpriu ${Math.round(rv.perf * 100)}% das metas neste contrato`),
    rv.aceita ? el('div', { class: 'caixa' },
      el('p', {}, '💰 Novo salário: ', carrSalarioTxt(rv.salario)),
      el('p', {}, dif >= 0 ? `📈 ${carrFmt(dif)} a mais que o atual (bruto).` : `📉 ${carrFmt(-dif)} a menos que o atual: o dirigente achou que você podia render mais.`),
      el('p', {}, `📄 Mais ${CARR_PERIODO * CARR_PERIODOS_CONTRATO} dias de contrato, com reunião a cada ${CARR_PERIODO} dias.`))
      : el('div', { class: 'aviso' }, 'O dirigente não quer renovar. Você vai ficar livre no mercado — o Rodrigues vai atrás de um clube novo.'),
    ops);
}
function carrTelaFimContrato(res, def) {
  if (!res) return abrirCarreira();
  const ops = el('div', { class: 'opcoes' });
  if (res.renovou) ops.append(el('button', { class: 'btn amarelo', onclick: () => abrirCarreira() }, 'Ver minha carreira ▶'), carrFechar());
  else ops.append(el('button', { class: 'btn amarelo grande', onclick: () => reuniaoEmpresario() }, '🤝 Falar com o Rodrigues ▶'), carrVoltar());
  carrMostra({ Enter: res.renovou ? () => abrirCarreira() : () => reuniaoEmpresario() },
    el('h2', {}, res.renovou ? '✍️ Contrato renovado!' : '🚪 Fim de contrato'),
    el('div', { class: 'jornal' }, el('div', { class: 'jn' }, 'GAZETA DO CRAQUE'), el('div', { class: 'mc' }, res.manchete)),
    carrChips(res.ef), ops);
}
function carrTelaDispensa(info) {
  if (!info) return abrirCarreira();
  carrMostra({ Enter: () => reuniaoEmpresario() },
    el('h2', {}, '📰 Dispensa'),
    carrTopo(info.def.dirigente.look, info.def.dirigente.nome, info.fala),
    el('div', { class: 'jornal' }, el('div', { class: 'jn' }, 'GAZETA DO CRAQUE'), el('div', { class: 'mc' }, info.manchete)),
    carrChips(info.ef),
    el('p', {}, 'Todo craque já passou por uma fase ruim. Cumpra as metas no próximo clube e vá sempre às reuniões!'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: () => reuniaoEmpresario() }, '🤝 Falar com o Rodrigues ▶'), carrVoltar()));
}

/* ---------- escritório do empresário ---------- */
function reuniaoEmpresario(fala) {
  if (typeof G === 'undefined' || !G || !G.save) return;
  const c = carrDados();
  if (!c.ativa) return abrirCarreira();
  const k = c.clube; const d = carrDia();
  const quem = `Empresário Rodrigues · ${carrCara(c.satEmp)} ${carrHumor(c.satEmp)}`;
  if (!carrPodeAssinar()) {
    const dicas = [];
    if (c.satDir < 35) dicas.push('⚠️ Seu dirigente está insatisfeito. Cumpra as metas antes da próxima reunião!');
    if (c.satTorcida < 35) dicas.push('📣 A torcida anda chateada. Vitórias, gols, chefões e missões de paz ajudam!');
    if (c.satEmp < 25) dicas.push('😠 Eu (Rodrigues) estou chateado: recusar propostas demais me deixa sem moral no mercado.');
    if (!dicas.length) dicas.push('👍 Tudo certo por aqui. Continue cumprindo as metas que as propostas vão aparecer!');
    return carrMostra({},
      el('h2', {}, '🤝 Escritório do Rodrigues'),
      carrTopo(CARR_LOOK_RODRIGUES, quem, fala || `Você tem contrato com o ${k.nome} até o dia ${k.fimDia}. Para sair antes, peça ao dirigente para ser ${carrG('negociado', 'negociada')} numa reunião. A janela de transferências abre no dia ${k.fimDia - CARR_PERIODO}.`),
      el('div', { class: 'caixa' }, dicas.map(t => el('p', { style: 'margin:3px 0;font-weight:700' }, t))),
      el('div', { class: 'opcoes' }, carrVoltar(), carrFechar()));
  }
  if (c.ofertasDia !== d) c.ofertas = carrGeraOfertas(c.historico.length <= 1 && !k ? { inicial: true } : {}); // recusou hoje: propostas novas só amanhã (senão dava para pescar a dos sonhos)
  const temEuropa = c.ofertas.some(o => carrClube(o.id).pais !== 'brasil');
  let txt = fala;
  if (!txt) {
    if (c.historico.length <= 1 && !k) txt = 'Chegou a hora! Estes clubes querem você. Escolha com carinho: cada dirigente tem seu jeito.';
    else if (!k && c.contadores.dispensas && c.historico[0] && c.historico[0].includes('dispensa')) txt = 'Cabeça erguida! Todo craque já passou por isso. Olha quem quer você:';
    else if (c.liberado) txt = 'O clube topou te negociar! Olha as propostas que chegaram:';
    else if (k) txt = 'Seu contrato está acabando. Hora de ouvir o mercado!';
    else if (c.satEmp >= 70) txt = 'Meu cliente favorito! Olha só o que eu consegui pra você:';
    else if (c.satEmp >= 40) txt = 'Trabalhei muito nessas propostas. Dá uma olhada:';
    else if (c.satEmp >= 25) txt = 'Olha... não foi fácil, mas consegui isto aqui:';
    else txt = 'Sinceramente? Você anda me dando trabalho. Só consegui estas:';
    if (!c.ofertas.length) txt = 'Você recusou as propostas de hoje. Volte amanhã que eu consigo outras!';
    else if (temEuropa) txt = txt.replace(/:$/, '!') + (c.ofertas.some(o => CARR_EUROPA_PAISES.includes(carrClube(o.id).pais)) ? ' E tem proposta da EUROPA, hein!' : ' E tem proposta do EXTERIOR, hein!');
  }
  const at = {};
  const cards = c.ofertas.map((o, i) => {
    const def = carrClube(o.id); const pf = CARR_PERFIS[def.dirigente.perfil];
    const assinar = () => carrTelaAssinou(carrAssinar(o));
    at[String(i + 1)] = assinar;
    const eur = def.pais !== 'brasil';
    return el('div', { class: 'oferta' + (o.sonho ? ' sonho' : '') + (eur ? ' europa' : ''), style: `animation-delay:${i * 0.1}s` },
      o.sonho ? el('span', { class: 'tag-sonho' }, '⭐ PROPOSTA DOS SONHOS') : null,
      el('div', { class: 'cab' }, carrEscudo(def, 44), el('div', {}, el('div', { class: 'nm' }, def.nome), el('small', {}, `${CARR_PAISES[def.pais].bandeira} ${CARR_PAISES[def.pais].nome} · ${carrCidadeNome(def.cidade)}`))),
      el('p', {}, `🏆 ${CARR_TIERS[def.tier].liga} (${def.tier <= 5 ? '★'.repeat(def.tier) : '★ ' + def.tier}/${CARR_TIER_MAX})`),
      el('p', { class: 'sal' }, `💰 ${carrFmt(carrLiquido(o.salario))} por dia`),
      el('p', {}, el('small', {}, `bruto ${carrFmt(o.salario)} · luvas na assinatura: +${carrFmt(carrLiquido(o.luvas))}`)),
      el('p', {}, `📄 Contrato de ${o.dias} dias`),
      el('p', { title: pf.desc }, `👔 ${def.dirigente.nome}: ${pf.emoji} ${pf.nome}`),
      eur ? el('p', {}, `✈️ Libera o voo ${CARR_EXTERIOR[def.cidade] ? CARR_EXTERIOR[def.cidade].para : 'para ' + carrCidadeCurta(def.cidade)}`) : null,
      el('button', { class: 'btn ' + (o.sonho ? 'amarelo' : 'verde'), onclick: assinar }, `✍️ Assinar (${i + 1})`));
  });
  const d2 = carrDia(); const pedidos = c.pedidosDia === d2 ? c.pedidos || 0 : 0;
  const melhor = () => { const r = carrPedirMelhores(); reuniaoEmpresario(r.fala); };
  const ficar = () => { carrRecusar(); if (k) abrirCarreira(); else fechaModal(); };
  at.m = melhor;
  carrMostra(at,
    el('h2', {}, '🤝 Escritório do Rodrigues'),
    carrTopo(CARR_LOOK_RODRIGUES, quem, txt),
    c.satEmp < 25 ? el('div', { class: 'aviso' }, '⚠️ O Rodrigues está chateado com você: vêm menos propostas e salários menores. Assine um contrato e cumpra metas para ele voltar a se animar!') : null,
    el('div', { class: 'ofertas' }, cards.length ? cards : el('p', { class: 'vazio' }, 'Nenhuma proposta agora.')),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn roxo', disabled: pedidos >= 2 ? 'disabled' : null, onclick: melhor }, `🔎 Pedir propostas melhores (−8 Empresário) (M)`),
      el('button', { class: 'btn', onclick: ficar }, k ? '🏠 Ficar onde estou' : '⏳ Agora não'),
      carrVoltar()),
    el('p', { class: 'dica' }, 'Recusar propostas deixa o Rodrigues chateado (−4). Assinar contrato deixa ele feliz (+10). Metas cumpridas também ajudam.'));
}
function carrTelaAssinou(r) {
  if (!r) return abrirCarreira();
  const def = r.def;
  carrMostra({ Enter: () => abrirCarreira() },
    el('h2', {}, '✍️ Contrato assinado!'),
    carrTopo(CARR_LOOK_RODRIGUES, 'Empresário Rodrigues', r.europa ? `Arruma a mala, craque! Você vai jogar ${CARR_EXTERIOR[def.cidade] ? CARR_EXTERIOR[def.cidade].em : 'em ' + carrCidadeCurta(def.cidade)}! Isso é só o começo.` : `Fechado! O ${def.nome} é um ótimo lugar para crescer. Agora é com você: cumpra as metas!`),
    el('div', { class: 'jornal' }, el('div', { class: 'jn' }, 'GAZETA DO CRAQUE — EDIÇÃO EXTRA'), el('div', { class: 'mc' }, r.manchete)),
    carrChips(r.ef),
    r.europa ? el('p', { class: 'aviso', style: 'background:#e8e0ff;border-color:#3a2780' }, `✈️ O voo ${CARR_EXTERIOR[def.cidade] ? CARR_EXTERIOR[def.cidade].para : 'para ' + carrCidadeCurta(def.cidade)} (${CARR_PAISES[def.pais].nome}) está liberado!`) : null,
    el('div', { class: 'caixa', style: 'margin-top:8px' },
      el('p', {}, `👔 Seu dirigente: ${def.dirigente.nome} (${CARR_PERFIS[def.dirigente.perfil].emoji} ${CARR_PERFIS[def.dirigente.perfil].nome}) — ${CARR_PERFIS[def.dirigente.perfil].desc}`),
      el('p', {}, `📅 Primeira reunião: dia ${carrDados().clube.proxReuniao}. Não falte!`)),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: () => abrirCarreira() }, 'Ver minha carreira ▶'), carrFechar()));
}

/* ---------------- clubes conhecidos (com uma mudança criativa no nome) ----------------
   Mantém os ids; troca nome, sigla e cores. Contratos salvos com o nome antigo são atualizados. */
const CARR_NOMES_REAIS = {
  beiramar: ['Náutyco', 'NAU', '#d42a2a', '#ffffff'], campinhoverde: ['Guaranim', 'GUA', '#1a8a3a', '#ffffff'], operario: ['Ponte Pretinha', 'PPR', '#1a1a1a', '#ffffff'],
  serraazul: ['Cruzeyro', 'CRU', '#1a4ad9', '#ffffff'], capital: ['Internacionau', 'INT', '#d42a2a', '#ffffff'], tubaroes: ['Sanctos', 'SAN', '#ffffff', '#1a1a1a'],
  imperial: ['Palmeiral', 'PAL', '#1a8a3a', '#ffffff'], estrelasul: ['Botafofo', 'BOT', '#1a1a1a', '#ffffff'], locomotiva: ['Framengo', 'FLA', '#d42a2a', '#1a1a1a'],
  faraos: ['Al Ahlyy', 'AHL', '#d42a2a', '#ffffff'], esfinge: ['Zamaleque', 'ZAM', '#ffffff', '#d42a2a'], oasis: ['Piramidões FC', 'PIR', '#1a2a6a', '#ffffff'],
  samurais: ['FC Tokyu', 'TOK', '#1a4ad9', '#d42a2a'], cerejeiras: ['Tokyo Verdinho', 'VER', '#1a8a3a', '#ffffff'], dragoes: ['Kawasaki Frontalle', 'KAW', '#3aa0e0', '#1a1a1a'],
  falcoes: ['Al Sadi', 'SAD', '#ffffff', '#1a1a1a'], perolas: ['Al Garrafa', 'GAR', '#1a4ad9', '#f0c030'], tempestade: ['Al Duhaiu', 'DUH', '#d42a2a', '#ffffff'],
  flamingos: ['Inter Miamy', 'MIA', '#ff5ab0', '#1a1a1a'], jacares: ['Orlando Citty', 'ORL', '#7a2ad9', '#ffffff'], ondas: ['Miami Fuzão', 'FUZ', '#1a4ad9', '#ff8a1a'],
  navegadores: ['Belenensses', 'BEL', '#1a4ad9', '#ffffff'], setecolinas: ['Sportingue', 'SCP', '#1a8a3a', '#ffffff'], eletrico: ['Benfika', 'SLB', '#d42a2a', '#ffffff'],
  castelhano: ['Real Madrís', 'RMA', '#ffffff', '#7a2ad9'], moinhos: ['Atlético de Madrís', 'ATM', '#d42a2a', '#ffffff'], soldeouro: ['Raio Vallecano', 'RAY', '#ffffff', '#d42a2a'],
  dolomitas: ['Internazionalle', 'INT', '#1a2a6a', '#1a1a1a'], gondoleiros: ['Monzza', 'MON', '#d42a2a', '#ffffff'], catedral: ['AC Mylan', 'MIL', '#d42a2a', '#1a1a1a'],
  alpinos: ['Bayernn München', 'FCB', '#d42a2a', '#ffffff'], relojoeiros: ['TSV 1861 München', 'TSV', '#6ab0e0', '#ffffff'], castelo: ['Augsburgo', 'AUG', '#d42a2a', '#1a8a3a'],
  royalthames: ['Totenhamm', 'TOT', '#ffffff', '#1a2a6a'], bigben: ['Chelsi', 'CHE', '#1a4ad9', '#ffffff'], foghill: ['Arsenau', 'ARS', '#d42a2a', '#ffffff'],
};
for (const k of CARREIRA_CLUBES) { const r = CARR_NOMES_REAIS[k.id]; if (r) [k.nome, k.sigla, k.cor1, k.cor2] = r; }
const _checaCarreiraBase = checaCarreira;
checaCarreira = function () {
  const c = G.save && G.save.carreira;
  if (c && c.clube && CARR_NOMES_REAIS[c.clube.id] && c.clube.nome !== CARR_NOMES_REAIS[c.clube.id][0]) c.clube.nome = CARR_NOMES_REAIS[c.clube.id][0];
  return _checaCarreiraBase.apply(this, arguments);
};
