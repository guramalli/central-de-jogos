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
const CARR_SAL_BASE = 240;           // salário-base do tier 1; cada tier ×1,266 (v233: 15 degraus, o topo paga o mesmo de antes)
const CARR_SAL_CRESCE = 1.266;
const CARR_CONTADORES = ['abates', 'abatesCidade', 'missoes', 'chefes', 'gols', 'partidas', 'vitorias', 'copas', 'exaustos', 'paz',
  'reunioes', 'metasCumpridas', 'metasFalhas', 'transferencias', 'dispensas', 'renovacoes', 'aumentos', 'recusas', 'ganhos'];

// grito = o que o jogador diz na manchete quando chega ao país
const CARR_PAISES = {
  brasil: { nome: 'Brazil', bandeira: '🇧🇷', de: 'from Brazil', em: 'in Brazil', grito: 'Let\'s go, Brazil!' },
  egito: { nome: 'Egypt', bandeira: '🇪🇬', de: 'from Egypt', em: 'in Egypt', grito: 'I\'m going to play in the shadow of the pyramids!' },
  japao: { nome: 'Japan', bandeira: '🇯🇵', de: 'from Japan', em: 'in Japan', grito: 'Arigato, fans! What a welcome!' },
  catar: { nome: 'Qatar', bandeira: '🇶🇦', de: 'from Qatar', em: 'in Qatar', grito: 'So much heat... from the fans!' },
  eua: { nome: 'United States', bandeira: '🇺🇸', de: 'from the United States', em: 'in the United States', grito: 'Soccer in the land of showbiz!' },
  portugal: { nome: 'Portugal', bandeira: '🇵🇹', de: 'from Portugal', em: 'in Portugal', grito: 'It\'s the European dream!' },
  espanha: { nome: 'Spain', bandeira: '🇪🇸', de: 'from Spain', em: 'in Spain', grito: 'It\'s the European dream!' },
  italia: { nome: 'Italy', bandeira: '🇮🇹', de: 'from Italy', em: 'in Italy', grito: 'Mamma mia, what a stadium!' },
  alemanha: { nome: 'Germany', bandeira: '🇩🇪', de: 'from Germany', em: 'in Germany', grito: 'I\'m going to learn how to say "Tor"!' },
  inglaterra: { nome: 'England', bandeira: '🇬🇧', de: 'from England', em: 'in England', grito: 'I made it to the land where soccer was born!' },
  argentina: { nome: 'Argentina', bandeira: '🇦🇷', de: 'from Argentina', em: 'in Argentina', grito: '¡Vamos! Soccer with heart and a tango beat!' },
  franca: { nome: 'France', bandeira: '🇫🇷', de: 'from France', em: 'in France', grito: 'Oh là là, what a stadium!' },
};
// v233: 15 degraus pela RELEVÂNCIA do futebol de cada país (o nível é o da cidade de cada liga):
// Brasil de base (1–3) → Egito, Catar, Japão, EUA → Argentina → elite do Brasil (Rio) → Portugal, França, Alemanha, Itália, Espanha, Inglaterra
const CARR_TIERS = {
  1: { liga: 'Promotion Division', nivel: 25, fama: 0 },
  2: { liga: 'National Second Division', nivel: 32, fama: 100 },
  3: { liga: 'National Série B', nivel: 40, fama: 220 },
  4: { liga: 'Nile League', nivel: 50, fama: 350 },
  5: { liga: 'Dunes League', nivel: 62, fama: 480 },
  6: { liga: 'Cherry Blossom League', nivel: 74, fama: 620 },
  7: { liga: 'Stars League', nivel: 86, fama: 780 },
  8: { liga: 'Tango League', nivel: 100, fama: 950 },
  9: { liga: 'National Elite', nivel: 112, fama: 1130 },
  10: { liga: 'Navigators League', nivel: 124, fama: 1330 },
  11: { liga: 'League of Lights', nivel: 136, fama: 1550 },
  12: { liga: 'Castles League', nivel: 148, fama: 1790 },
  13: { liga: 'Boot League', nivel: 156, fama: 2050 },
  14: { liga: 'Sun League', nivel: 162, fama: 2330 },
  15: { liga: 'Crown League', nivel: 176, fama: 2600 },
};
const CARR_TIER_MAX = 15;
const CARR_EUROPA_PAISES = ['portugal', 'franca', 'espanha', 'italia', 'alemanha', 'inglaterra'];
const CARR_CONVITE_TOPO = 2800;      // convite para amistoso em Londres (não existe tier 16)
// saves de antes da v233: degrau velho → degrau novo (Japão 5→6, Catar 6→5, Portugal 8→10, Espanha 9→14, Itália 10→13, Alemanha 11→12, Inglaterra 12→15)
const CARR_TIER_V232 = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 5, 7: 7, 8: 10, 9: 14, 10: 13, 11: 12, 12: 15 };
const CARR_BRASIL = ['vila', 'praia', 'cidade', 'ct', 'estadio'];
const CARR_CIDADE_PADRAO = { vila: 'Campinho Village', praia: 'Beach', cidade: 'City', ct: 'U-20 Training Center', estadio: 'Stadium', rio: 'Rio de Janeiro' };
// cidades fora do Brasil: nome e preposições ("ir ao Cairo", "jogar no Cairo", "voo para o Cairo").
// tier e convite (fama para amistoso = famaMin do tier SEGUINTE) são calculados depois da lista de clubes.
// (o Rio é Brasil: não precisa de convite, só do nível do voo)
const CARR_EXTERIOR = {
  cairo: { pais: 'egito', nome: 'Cairo', a: 'to Cairo', em: 'in Cairo', para: 'to Cairo' },
  doha: { pais: 'catar', nome: 'Doha' },
  toquio: { pais: 'japao', nome: 'Tokyo' },
  miami: { pais: 'eua', nome: 'Miami' },
  buenos: { pais: 'argentina', nome: 'Buenos Aires' },
  lisboa: { pais: 'portugal', nome: 'Lisbon' },
  paris: { pais: 'franca', nome: 'Paris' },
  munique: { pais: 'alemanha', nome: 'Munich' },
  milao: { pais: 'italia', nome: 'Milan' },
  madri: { pais: 'espanha', nome: 'Madrid' },
  londres: { pais: 'inglaterra', nome: 'London' },
};
const CARR_RANKS = [
  { min: 0, nome: 'Prospect', emoji: '🌱' },
  { min: 150, nome: 'Rising Star', emoji: '⭐' },
  { min: 350, nome: 'Starter', emoji: '👕' },
  { min: 650, nome: 'Idol', emoji: '🏅' },
  { min: 1000, nome: 'Continental Star', emoji: '🌎' },
  { min: 1500, nome: 'International Star', emoji: '🌍' },
  { min: 2100, nome: 'World Superstar', emoji: '🌟' },
  { min: 2700, nome: 'World Legend', emoji: '👑' },
];
const CARR_PERFIS = {
  exigente: { nome: 'Demanding', emoji: '🧐', desc: 'Wants results! Doesn\'t like being asked for a raise.' },
  paciente: { nome: 'Patient', emoji: '😌', desc: 'Gives players time and values respect.' },
  vaidoso: { nome: 'Vain', emoji: '😎', desc: 'Loves compliments about the club and being in the newspaper.' },
  estrategista: { nome: 'Strategist', emoji: '🧠', desc: 'Thinks about the future. Likes plans and bold targets.' },
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
  ['faraos', 'Nile Pharaohs FC', 'FDN', 'cairo', 4, '#d4a020', '#1a3a8a', 'faixa', 1.05, 0, 0, 'Mr. Ramses Sand', 'vaidoso', ['m', 'pele-morena', 'cabelo-curto', 'preto', 'rosto-escuros']],
  ['esfinge', 'Sphinx Football Club', 'ESF', 'cairo', 4, '#c8b07a', '#8a1010', 'metade', 1.0, 1, 20, 'Ms. Nefertari Lotus', 'estrategista', ['f', 'pele-morena', 'cabelo-liso-longo', 'preto', null]],
  ['oasis', 'Oasis Athletic', 'OAT', 'cairo', 4, '#2a9a6a', '#f0e0a0', 'listras', 0.94, 0, 0, 'Mr. Omar Papyrus', 'paciente', ['m', 'pele-media', 'cabelo-cacheado', 'grisalho', 'rosto-redondos']],
  // ---- Catar (Doha) ----
  ['falcoes', 'Desert Falcons', 'FDD', 'doha', 5, '#8a1a3a', '#ffffff', 'metade', 1.05, 0, 0, 'Mr. Karim Dune', 'vaidoso', ['m', 'pele-morena', 'cabelo-curto', 'preto', 'rosto-escuros']],
  ['perolas', 'Gulf Pearls', 'PDG', 'doha', 5, '#ffffff', '#1a8aa0', 'listras', 1.0, 0, 0, 'Ms. Layla Mirage', 'estrategista', ['f', 'pele-media', 'cabelo-liso-longo', 'castanho', 'rosto-redondos']],
  ['tempestade', 'Sandstorm SC', 'TDA', 'doha', 5, '#e0a040', '#5a3a1a', 'faixa', 1.08, 2, 30, 'Mr. Faisal Camel', 'exigente', ['m', 'pele-negra', 'cabelo-curto', 'grisalho', null]],
  // ---- Japão (Tóquio) ----
  ['samurais', 'Tokyo Samurai', 'SDT', 'toquio', 6, '#d42a2a', '#ffffff', 'horizontal', 1.05, 1, 20, 'Mr. Kenji Bonsai', 'exigente', ['m', 'pele-clara', 'cabelo-curto', 'preto', 'rosto-redondos']],
  ['cerejeiras', 'Cherry Blossoms FC', 'CFC', 'toquio', 6, '#ff8ac8', '#ffffff', 'listras', 0.95, 0, 0, 'Ms. Sakura Haiku', 'paciente', ['f', 'pele-clara', 'cabelo-coque', 'preto', null]],
  ['dragoes', 'Rising Sun Dragons', 'DSN', 'toquio', 6, '#1a1a2a', '#ffd23f', 'faixa', 1.0, 0, 0, 'Mr. Hiro Manga', 'vaidoso', ['m', 'pele-clara', 'cabelo-liso-longo', 'preto', 'rosto-escuros']],
  // ---- Estados Unidos (Miami) ----
  ['flamingos', 'Miami Flamingos', 'MFL', 'miami', 7, '#ff5ab0', '#1ac8c8', 'faixa', 1.05, 0, 0, 'Mr. Chuck Hollywood', 'vaidoso', ['m', 'pele-clara', 'cabelo-curto', 'loiro', 'rosto-escuros']],
  ['jacares', 'Swamp Gators FC', 'JDP', 'miami', 7, '#2a8a3a', '#ffd23f', 'listras', 0.96, 0, 0, 'Ms. Dolores Palmeira', 'paciente', ['f', 'pele-negra', 'cabelo-cacheado', 'preto', null]],
  ['ondas', 'Miami Waves FC', 'ODM', 'miami', 7, '#1a4ad9', '#ff8a1a', 'horizontal', 1.02, 1, 20, 'Mr. Bob Surf', 'estrategista', ['m', 'pele-morena', 'cabelo-liso-longo', 'loiro', 'rosto-redondos']],
  // ---- Argentina (Buenos Aires) — v233 ----
  ['tangueros', 'Tangueros de La Boca', 'TLB', 'buenos', 8, '#1a3ab9', '#f8d838', 'faixa', 1.03, 0, 0, 'Don Julio Bandoneón', 'vaidoso', ['m', 'pele-clara', 'cabelo-curto', 'grisalho', 'rosto-escuros']],
  ['pampas', 'Club Atlético Pampas', 'CAP', 'buenos', 8, '#6ab0e0', '#ffffff', 'listras', 0.96, 0, 0, 'Doña Graciela Mate', 'paciente', ['f', 'pele-media', 'cabelo-cacheado', 'castanho', null]],
  ['gauchos', 'Gaúchos del Plata', 'GDP', 'buenos', 8, '#d42a2a', '#ffffff', 'metade', 1.07, 2, 30, 'Don Ernesto Parrilla', 'exigente', ['m', 'pele-media', 'cabelo-curto', 'preto', null]],
  // ---- Brasil, a elite (Rio de Janeiro) — v233 ----
  ['cristo', 'Cristo Redentor FC', 'CRF', 'rio', 9, '#1a9a3a', '#f8d838', 'faixa', 1.04, 0, 0, 'Dona Iolanda Samba', 'vaidoso', ['f', 'pele-negra', 'cabelo-black-power', 'preto', 'rosto-escuros']],
  ['paoacucar', 'Pão de Açúcar EC', 'PAE', 'rio', 9, '#ffffff', '#1a4ad9', 'listras', 0.96, 0, 0, 'Seu Aloísio Bondinho', 'paciente', ['m', 'pele-morena', 'cabelo-curto', 'grisalho', 'rosto-redondos']],
  ['guanabara', 'Guanabara Futebol Clube', 'GFC', 'rio', 9, '#d42a2a', '#1a1a1a', 'horizontal', 1.08, 2, 40, 'Dr. Otávio Arquibancada', 'estrategista', ['m', 'pele-retinta', 'cabelo-curto', 'preto', null]],
  // ---- Portugal (Lisboa) ----
  ['navegadores', 'Os Navegadores FC', 'NAV', 'lisboa', 10, '#0a3a8a', '#f0c030', 'horizontal', 0.95, 0, 0, 'Senhor Joaquim Caravela', 'paciente', ['m', 'pele-clara', 'cabelo-curto', 'grisalho', 'rosto-redondos']],
  ['setecolinas', 'Académico Sete Colinas', 'ASC', 'lisboa', 10, '#1a8a4a', '#ffffff', 'listras', 1.0, 1, 20, 'Dona Amália Fado', 'vaidoso', ['f', 'pele-clara', 'cabelo-coque', 'castanho', null]],
  ['eletrico', 'Elétrico Futebol Clube', 'EFC', 'lisboa', 10, '#f0c030', '#d42a2a', 'faixa', 1.06, 3, 50, 'Engenheiro Duarte Bacalhau', 'estrategista', ['m', 'pele-media', 'cabelo-curto', 'castanho', 'rosto-redondos']],
  // ---- França (Paris) — v233 ----
  ['sena', 'Seine Saint-Denis FC', 'SSD', 'paris', 11, '#1a2a6a', '#d42a2a', 'faixa', 1.04, 0, 0, 'Monsieur Antoine Baguette', 'vaidoso', ['m', 'pele-clara', 'cabelo-curto', 'castanho', 'rosto-escuros']],
  ['louvre', 'Racing du Louvre', 'RDL', 'paris', 11, '#f4f4f8', '#1a4ad9', 'listras', 0.96, 0, 0, 'Madame Juliette Croissant', 'paciente', ['f', 'pele-clara', 'cabelo-coque', 'loiro', null]],
  ['montmartre', 'Étoile de Montmartre', 'EDM', 'paris', 11, '#7a2ad9', '#f0c030', 'metade', 1.07, 2, 40, 'Monsieur Pierre Paintbrush', 'exigente', ['m', 'pele-negra', 'cabelo-curto', 'preto', 'rosto-redondos']],
  // ---- Alemanha (Munique) ----
  ['alpinos', 'Bavarian Mountaineers', 'ADB', 'munique', 12, '#d42a2a', '#ffffff', 'horizontal', 1.05, 0, 0, 'Herr Klaus Mountain', 'estrategista', ['m', 'pele-clara', 'cabelo-curto', 'grisalho', 'rosto-escuros']],
  ['relojoeiros', 'Black Forest Clockmakers', 'RFN', 'munique', 12, '#1a1a2a', '#e04a3a', 'listras', 1.0, 1, 30, 'Frau Greta Clock', 'exigente', ['f', 'pele-clara', 'cabelo-liso-longo', 'loiro', 'rosto-redondos']],
  ['castelo', 'Enchanted Castle SV', 'CE', 'munique', 12, '#4a2ad9', '#ffffff', 'faixa', 0.95, 0, 0, 'Herr Otto Strudel', 'paciente', ['m', 'pele-clara', 'cabelo-curto', 'castanho', null]],
  // ---- Itália (Milão) ----
  ['dolomitas', 'Royal Dolomites', 'RDO', 'milao', 13, '#1a2a6a', '#ffffff', 'listras', 1.04, 0, 0, 'Don Vittorio Espresso', 'vaidoso', ['m', 'pele-clara', 'cabelo-curto', 'grisalho', 'rosto-escuros']],
  ['gondoleiros', 'United Gondoliers', 'GU', 'milao', 13, '#0a8a6a', '#f0c030', 'faixa', 0.96, 0, 0, 'Signora Giulia Pizzaiola', 'paciente', ['f', 'pele-media', 'cabelo-coque', 'castanho', null]],
  ['catedral', 'Cathedral Star', 'EDC', 'milao', 13, '#8a1010', '#1a1a2a', 'metade', 1.07, 2, 40, 'Signor Marco Risotto', 'exigente', ['m', 'pele-media', 'cabelo-cacheado', 'preto', null]],
  // ---- Espanha (Madri) ----
  ['castelhano', 'Real Castellano', 'RC', 'madri', 14, '#ffffff', '#6a2ad9', 'faixa', 1.03, 0, 0, 'Don Rodrigo del Castillo', 'vaidoso', ['m', 'pele-media', 'cabelo-liso-longo', 'preto', 'rosto-escuros']],
  ['moinhos', 'Windmills Athletic', 'AMV', 'madri', 14, '#d42a2a', '#1a2a6a', 'listras', 0.96, 0, 0, 'Doña Pilar Quixote', 'exigente', ['f', 'pele-morena', 'cabelo-cacheado', 'castanho', null]],
  ['soldeouro', 'Unión Sol de Oro', 'USO', 'madri', 14, '#f0a81a', '#1a1a2a', 'metade', 1.08, 3, 40, 'Don Paco Churros', 'paciente', ['m', 'pele-clara', 'cabelo-cacheado', 'grisalho', 'rosto-redondos']],
  // ---- Inglaterra (Londres) ----
  ['royalthames', 'Royal Thames FC', 'RTF', 'londres', 15, '#1a2a6a', '#d42a2a', 'horizontal', 1.03, 0, 0, 'Sir Arthur Teapot', 'estrategista', ['m', 'pele-clara', 'cabelo-curto', 'loiro', 'rosto-redondos']],
  ['bigben', 'Big Ben United', 'BBU', 'londres', 15, '#1a1a2a', '#f0c030', 'listras', 0.97, 0, 0, 'Lady Margaret Clockwork', 'exigente', ['f', 'pele-negra', 'cabelo-liso-longo', 'preto', null]],
  ['foghill', 'Fog Hill Rovers', 'FHR', 'londres', 15, '#6ab0e0', '#ffffff', 'metade', 1.1, 3, 60, 'Mr. Oliver Pudding', 'paciente', ['m', 'pele-retinta', 'cabelo-black-power', 'grisalho', null]],
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
    oi: ['Have a seat, {nome}. Let\'s get straight to the numbers.', 'My time is short. Let\'s look at your targets.', 'Here at {clube}, we expect results. Let\'s get to it.'],
    bom: ['That\'s the least I expect. But... good job.', 'Good numbers. Keep it up and we won\'t have any problems.'],
    ruim: ['I didn\'t like that. Targets are meant to be met!', 'I expected much more from you, {nome}.'],
    aumento: ['Hmm... you\'ve earned it. Raise approved, but I\'ll expect twice as much!', 'A raise? First show me what you can do on the field!'],
    promessa: ['I like ambitious people! Harder targets, bigger bonus. Deal.', 'Promises are easy. Let\'s see if you can hit the normal targets first.'],
    elogio: ['Thanks. But compliments don\'t win games, okay?', 'Less talking and more goals, {nome}.'],
    reclamar: ['You\'re right about one thing: I\'ll invest in the Training Center. But I want results!', 'Facilities? Some players trained on dirt fields and became stars!'],
    negociar: ['I won\'t keep anyone here by force. Your agent can look for offers.', 'You signed a contract! Nobody leaves halfway through here.'],
    renova: 'You\'ve earned it. I want you here for one more season.',
    naoRenova: 'Let\'s go our separate ways. Good luck with your career.',
    dispensa: 'I\'m sorry, {nome}. Your results weren\'t enough. We\'re letting you go.',
    espera: 'The meeting is on day {dia}. Until then, I want to see you hitting your targets.',
  },
  paciente: {
    oi: ['Great to see you, {nome}! Grab a juice and have a seat.', 'Let\'s have a calm chat about the season.', 'How are you feeling here at {clube}?'],
    bom: ['So proud! The fans are loving it.', 'You\'re growing so much. Keep it up!'],
    ruim: ['Not everything goes as planned. Let\'s fix it together.', 'It\'s okay to make mistakes, but we need to improve.'],
    aumento: ['You\'ve been great to the club. Let\'s reward that with a raise!', 'Money is tight right now. Let\'s talk again later, okay?'],
    promessa: ['I like your drive! I\'ll set tougher targets with a bigger bonus.', 'No need to promise anything. We\'ll go at your pace.'],
    elogio: ['How kind! This club is a family, and you\'re part of it.', 'Thanks... but I feel like you wanted to tell me something else.'],
    reclamar: ['You\'re right. I\'ll ask for new fields and more physical therapists.', 'I understand, but we can\'t change that right now. Hang in there.'],
    negociar: ['I\'m sad, but I understand. Your agent can listen to offers.', 'Stay a little longer, {nome}. We still have a lot to win together.'],
    renova: 'I\'d love for you to stay with us. Shall we renew?',
    naoRenova: 'It was good while it lasted. Our doors will always be open.',
    dispensa: 'We tried everything, {nome}, but it\'s not working out. We have to let you go. I wish you lots of luck.',
    espera: 'Our talk is set for day {dia}. Use the time to train!',
  },
  vaidoso: {
    oi: ['Did you see my photo in the newspaper today? It looks great! Anyway, have a seat.', 'Ah, {nome}! The star of MY club. Let\'s talk.', '{clube} is the classiest club in the country. And you have to live up to it.'],
    bom: ['Wonderful! The newspapers will talk about us!', 'That\'s what I like: great headlines for {clube}!'],
    ruim: ['How embarrassing! The reporters will talk...', 'Like this, {clube} will never make the front page!'],
    aumento: ['A star of MY club has to be paid well. Approved!', 'A raise? And who\'s paying for my statue at the stadium entrance?'],
    promessa: ['Bigger targets, bigger headlines! I love it.', 'Promises... reporters like goals.'],
    elogio: ['You have good taste! This really is the most beautiful club in the world.', 'Thank you, thank you. I know. But what about the targets?'],
    reclamar: ['Hmm... a new Training Center with my name on the door? I like that idea!', 'Complaining about MY club?! How rude!'],
    negociar: ['If you want to leave, I\'ll demand that the next club announces you with a party!', 'Leave? Nobody leaves the most famous club in town!'],
    renova: 'The fans love you. And I love the fans. We renew!',
    naoRenova: '{clube} needs stars that shine brighter. Bye!',
    dispensa: 'No more bad headlines. We\'re letting you go, {nome}.',
    espera: 'I\'ll see you on day {dia}. Dress nicely, there will be a photographer!',
  },
  estrategista: {
    oi: ['I brought spreadsheets. Lots of spreadsheets. Let\'s analyze.', 'I\'ve been studying your numbers, {nome}.', 'Every meeting is a play. Let\'s plan the next one.'],
    bom: ['Exactly as I calculated. Excellent.', 'Your numbers are above average. Great investment.'],
    ruim: ['Numbers don\'t lie: we need to adjust the strategy.', 'Below forecast. Let\'s review the plan.'],
    aumento: ['I\'ve analyzed the market. A raise now keeps another club from taking you. Approved.', 'The numbers don\'t justify a raise yet. Show me more data.'],
    promessa: ['Bold targets and a bigger bonus. It\'s a good plan!', 'Ambition without a plan doesn\'t work. Let\'s keep the normal targets.'],
    elogio: ['Compliments boost team morale by 12%. Thank you!', 'I appreciate it, but let\'s focus on the numbers.'],
    reclamar: ['Makes sense. Better facilities bring better results. I\'ll invest.', 'We\'ve already invested what we planned for this year. No room right now.'],
    negociar: ['A sale now could be good for both sides. Your agent can negotiate.', 'You\'re a key piece of my plan. You\'re not for sale.'],
    renova: 'Your renewal is part of the long-term plan. Shall we sign?',
    naoRenova: 'The club\'s plan has changed. We won\'t renew.',
    dispensa: 'The analysis is clear: it\'s not working. We\'re ending the contract, {nome}.',
    espera: 'According to the schedule, our meeting is on day {dia}.',
  },
};

/* ---------------- opções de diálogo na reunião ---------------- */
// base = chance base; mod = ajuste pelo perfil do dirigente
const CARR_OPCOES = {
  aumento: { emoji: '💰', txt: 'Ask for a raise', base: 0.45, mod: { exigente: -0.2, paciente: 0, vaidoso: 0.05, estrategista: 0 } },
  promessa: { emoji: '⚽', txt: 'Promise more goals (harder targets, bigger bonus)', base: 0.72, mod: { exigente: 0.15, paciente: 0, vaidoso: 0.05, estrategista: 0.15 } },
  elogio: { emoji: '👏', txt: 'Praise the fans and the club', base: 0.6, mod: { exigente: -0.15, paciente: 0.15, vaidoso: 0.3, estrategista: 0 } },
  reclamar: { emoji: '🏗️', txt: 'Complain (politely) about the lack of facilities', base: 0.35, mod: { exigente: -0.1, paciente: 0.1, vaidoso: -0.25, estrategista: 0.2 } },
  negociar: { emoji: '✈️', txt: 'Ask to be transferred', base: 0.4, mod: { exigente: -0.1, paciente: 0.05, vaidoso: -0.1, estrategista: 0.2 } },
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
function carrNome() { return (G.save && G.save.nome) || 'Star'; }
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
function carrHumor(v) { return v >= 80 ? 'Very happy' : v >= 60 ? 'Pleased' : v >= 40 ? 'Okay' : v >= 20 ? 'Worried' : 'Very angry'; }
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
  // saves antigos: o contrato guarda tier/país da tabela velha (v233: a escada foi reordenada pela relevância)
  if (c.clube && c.clube.v !== 3) {
    const def = carrClube(c.clube.id);
    if (def) Object.assign(c.clube, { tier: def.tier, pais: def.pais, cidade: def.cidade, cidadeNome: def.cidadeNome });
    c.clube.v = 3;
  }
  if (c.escadaV !== 3) { if (c.ultimoTier) c.ultimoTier = CARR_TIER_V232[c.ultimoTier] || c.ultimoTier; c.escadaV = 3; }
  return c;
}
function carrHist(txt) {
  const c = carrDados(); c.historico.unshift(`Day ${carrDia()} — ${txt}`);
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
    carrBanner(`${rd.emoji} ${rd.nome}!`, 'Your fame grew'); carrLog(`Your fame grew! Your new title is ${rd.nome} ${rd.emoji}.`, 'l-lvl'); carrSom('nivel');
    carrHist(`The newspapers are already calling ${carrNome()} "${rd.nome}"!`);
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
    case 'abates': return `Beat ${n} opponents in ${carrCidadeNome(m.alvo)}`;
    case 'missoes': return n === 1 ? 'Complete 1 mission' : `Complete ${n} missions`;
    case 'chefe': return n === 1 ? 'Beat a boss' : `Beat ${n} bosses`;
    case 'gols': return `Score ${n} penalty goals`;
    case 'partidas': return n === 1 ? 'Win 1 match with your team' : `Win ${n} matches with your team`;
    case 'copa': return 'Play 1 Dream Cup';
    case 'disciplina': return n === 0 ? `Don't get ${carrG('exausto', 'exausta')} even once` : `Don't get ${carrG('exausto', 'exausta')} more than ${n} ${n === 1 ? 'vez' : 'vezes'}`;
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
      if (antes && !carrMetaOk(m)) carrLog(`Target missed: "${m.desc}". The club president won't like this...`, 'l-dano');
    } else if (!antes && carrMetaOk(m)) { carrLog(`✅ Career target met: ${m.desc}!`, 'l-xp'); carrSom('moeda'); }
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
  const k = { v: 3, id: def.id, nome: def.nome, pais: def.pais, cidade: def.cidade, cidadeNome: def.cidadeNome, tier: def.tier, salario,
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
  // o mercado anda um degrau por vez: Brasil → Cairo → Doha → Tóquio → Miami → Buenos Aires → Rio → Lisboa → Paris → Munique → Milão → Madri → Londres
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
  if (cx && def.pais !== paisAntigo) manchete = `${nm} is going to play ${cx.em}! Rodrigues closes a deal with ${def.nome} for ${carrFmt(oferta.salario)} coins/day: "${CARR_PAISES[def.pais].grito}"`;
  else if (antigo) manchete = `Big news! ${nm} swaps ${antigo} for ${def.nome}! Rodrigues closes the deal for ${carrFmt(oferta.salario)} coins/day.`;
  else manchete = `Rodrigues closes a deal with ${def.nome} for ${carrFmt(oferta.salario)} coins/day!`;
  carrHist(manchete);
  carrLog(`✍️ Contract signed with ${def.nome}! Salary: ${carrFmt(carrLiquido(oferta.salario))} coins/day (after Rodrigues's 10%). Signing bonus: +${carrFmt(carrLiquido(oferta.luvas))}.`, 'l-loot');
  carrBanner(def.nome, 'Contract signed!'); carrSom('moeda');
  const europa = def.pais !== 'brasil';
  if (europa) carrLog(`✈️ Flight ${cx ? cx.para : 'para ' + carrCidadeCurta(def.cidade)} (${CARR_PAISES[def.pais].nome}) unlocked! Your new club plays there.`, 'l-lvl');
  carrSujo(); carrSalvar();
  return { manchete, europa, def, antigo, ef, oferta };
}
function carrPedirMelhores() {
  const c = carrDados(); const d = carrDia();
  if (c.pedidosDia !== d) { c.pedidosDia = d; c.pedidos = 0; }
  if (c.pedidos >= 2) return { ok: false, cansado: true, fala: 'Easy, easy! I\'ve already called everyone today. Let me work and we\'ll see tomorrow.' };
  c.pedidos++; c.contadores.recusas++;
  const ef = carrAplica({ emp: -8 });
  const chance = 0.3 + c.satEmp / 200;
  if (Math.random() < chance) {
    c.ofertas = carrGeraOfertas({ melhor: true });
    return { ok: true, ef, fala: 'I called some important contacts... and look what showed up! Better offers!' };
  }
  const novas = carrGeraOfertas({});
  if (novas.length > 1) novas.pop();
  c.ofertas = novas;
  return { ok: false, ef, fala: 'The market is slow... This is all I could get. Next time, think hard before saying no!' };
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
  const manchete = `${nome} releases ${carrNome()}${motivo === 'ausencia' ? ' after missing the meetings' : ''}. Rodrigues promises: "We'll bounce back!"`;
  carrLivre(manchete, Math.max(0, k.tier - 1));
  carrLog(`📰 ${nome} released you. Talk to Rodrigues to find a new club (U key).`, 'l-dano');
  carrBanner('Released...', `${nome} ended your contract`); carrSom('erro');
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
  if (k.metas.length && ok === k.metas.length) { soma({ dir: 5 }); extras.push('All targets met: +5 President'); }
  if (k.metas.length && !ok) { soma({ dir: -5 }); extras.push('No targets met: −5 President'); }
  const aplicado = carrAplica(tot);
  k.cumpridas += ok; k.totalMetas += k.metas.length;
  c.contadores.metasCumpridas += ok; c.contadores.metasFalhas += k.metas.length - ok; c.contadores.reunioes++;
  if (k.metas.length && ok === k.metas.length) carrHist(`${carrNome()} hits every target at ${k.nome}! The president smiles at the press conference.`);
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
function carrOpTxt(op) { return CARR_OPCOES[op].txt.replace('transferred', carrG('negociado', 'negociada')); }
function carrChanceTxt(p) { return p >= 0.65 ? 'boa' : p >= 0.4 ? 'medium' : 'baixa'; }
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
      carrHist(`${nm} gets a ${pct}% raise at ${k.nome}! Now it's ${carrFmt(novo)} coins/day.`);
    } else ef = { dir: -8, emp: -2 };
  } else if (op === 'promessa') {
    if (ok) { ef = { dir: 6, fama: 5 }; k.promessa = true; extra = 'Harder targets next period — and a double bonus!'; }
    else ef = { dir: 1 };
  } else if (op === 'elogio') {
    ef = ok ? { dir: 10, tor: 8, fama: 4 } : { dir: -3 };
  } else if (op === 'reclamar') {
    if (ok) { ef = { dir: -2, tor: 5 }; k.estrutura = true; extra = 'The club will invest in facilities: target bonus +50% next period!'; carrHist(`${k.nome} announces Training Center upgrades after a talk with ${nm}.`); }
    else ef = { dir: -12, tor: -4 };
  } else if (op === 'negociar') {
    if (ok) { ef = { dir: -6, emp: 5 }; c.liberado = true; extra = 'You\'re free to negotiate! Rodrigues can now look for offers.'; carrHist(`${k.nome} puts ${nm} on the transfer list. Rodrigues is already answering the phone.`); }
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
    carrHist(`${nomeClube} renews with ${nm} until day ${k.fimDia}: ${carrFmt(k.salario)} coins/day.`);
    carrLog(`✍️ Contract renewed with ${nomeClube} until day ${k.fimDia}!`, 'l-loot'); carrSom('moeda');
    carrSujo(); carrSalvar();
    return { renovou: true, ef, manchete: c.historico[0] };
  }
  const ef = rv.aceita ? carrAplica({ emp: -2 }) : carrAplica({ fama: -8, emp: -5 });
  const manchete = rv.aceita ? `${nm} turns down the renewal and leaves ${nomeClube}. "I want new challenges!"` : `${nomeClube} doesn't renew with ${nm}. The player is now a free agent.`;
  carrLivre(manchete);
  carrLog(`📰 Your contract with ${nomeClube} has ended. Talk to Rodrigues (U key).`, 'l-info');
  carrSujo(); carrSalvar();
  return { renovou: false, ef, manchete };
}
function carrComecar() {
  const c = carrDados(); const s = G.save;
  if (c.ativa || (s.nivel || 1) < CARR_NIVEL_MIN) return false;
  c.ativa = true; c.ultimoPagamento = carrDia();
  carrHist(`Agent Rodrigues takes over ${carrNome()}'s career: "${carrG('This boy', 'This girl')} is going far!"`);
  c.ofertas = carrGeraOfertas({ inicial: true });
  carrLog('💼 Your pro career has begun! Rodrigues brought the first offers.', 'l-lvl'); carrSom('nivel');
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
      if (dados.chefe) { ct.chefes++; carrProgMeta('chefe'); carrAplica({ fama: 18, tor: 3 }); carrLog('⭐ Boss defeated! +18 career fame.', 'l-xp'); }
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
      if (k) for (const m of k.metas) if (m.tipo === 'copa' && m.prog < m.n) { m.prog = m.n; carrLog(`✅ Career target met: ${m.desc}!`, 'l-xp'); }
      carrAplica({ fama: 30, tor: 10 }); carrHist(`${carrNome()} is the Dream Cup ${carrG('champion', 'champion')}! The fans celebrate.`);
      break;
    case 'partida':
      ct.partidas++;
      if (dados.vitoria) { ct.vitorias++; carrProgMeta('partidas'); carrAplica({ fama: 4, tor: 4 }); }
      break;
    case 'exausto': ct.exaustos++; carrProgMeta('disciplina'); carrAplica({ tor: -2 }); break;
    case 'paz': {
      ct.paz++;
      const cid = carrCidadeCurta(dados.cidade) || 'in the city';
      const ef = carrAplica({ tor: 20, fama: 35, dir: k ? 3 : 0 });
      carrHist(`${carrNome()} calms the rival fans in ${cid}: "Soccer is a party, not a fight!"`);
      carrLog(`🕊️ Peace mission in ${cid}! Fans +${ef.tor || 0}, fame +${ef.fama || 0}.`, 'l-xp');
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
      carrBanner('Career offer!', 'Agent Rodrigues wants to talk to you (U key)');
      carrLog('💼 Agent Rodrigues wants to start your PRO CAREER! Press U.', 'l-xp'); carrSom('apito');
      try { if (typeof dica === 'function') dica('carreira_inicio', 'You reached level 25! Click the ⭐ Career button that is BLINKING (or press U): sign with a club, hit your targets and go to the meetings with the club president.', '[data-abre="carreira"]'); } catch (e) { /* sem dica */ }
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
      carrLog(`💰 Salary from ${k.nome}: +${carrFmt(liq)} coins${dias > 1 ? ` (${dias} days)` : ''}. Rodrigues kept ${carrFmt(bruto - liq)} (10%).`, 'l-loot');
      carrSom('moeda');
    } else {
      if (!c.ofertas.length) c.ofertas = carrGeraOfertas();
      carrLog('📞 Rodrigues: "You don\'t have a club, but I have offers! Stop by my office." (U key)', 'l-info');
    }
    // a torcida esquece aos poucos (volta para 50)
    for (let i = 0; i < dias; i++) c.satTorcida = c.satTorcida > 50 ? Math.max(50, c.satTorcida - 3) : Math.min(50, c.satTorcida + 1);
    carrSujo();
  }
  const k = c.clube; if (!k) return;
  if (!c.reuniaoPendente && d >= k.proxReuniao) {
    c.reuniaoPendente = true;
    const def = carrClube(k.id);
    carrBanner('Meeting scheduled!', `${def.dirigente.nome} wants to talk to you (U key)`);
    carrLog(`📅 Meeting scheduled! ${def.dirigente.nome}, from ${k.nome}, wants to talk to you. Press U.`, 'l-xp');
    carrSom('apito'); carrSujo();
  }
  // reunião esquecida por mais de 1 dia: todo mundo fica chateado
  if (c.reuniaoPendente && d - k.proxReuniao > 1 && c.ultimaMulta !== d) {
    c.ultimaMulta = d;
    carrAplica({ dir: -8, emp: -4 });
    const def = carrClube(k.id);
    carrLog(`😠 You missed the meeting with ${def.dirigente.nome}! President −8, Agent −4. Press U and go to the meeting.`, 'l-dano');
    if (c.satDir < CARR_DISPENSA) carrDispensa('ausencia');
    carrSujo(); carrSalvar();
  }
}

function podeViajar(cidade) {
  // cidades do Brasil (e prédios/interiores): sempre liberadas
  const x = CARR_EXTERIOR[cidade];
  if (CARR_BRASIL.includes(cidade) || !x) return { ok: true, motivo: '' };
  const P = CARR_PAISES[x.pais];
  if (typeof G === 'undefined' || !G || !G.save) return { ok: false, motivo: `To go ${x.a} you need to be a pro player.` };
  const c = G.save.carreira;
  const ativa = !!(c && c.ativa); const fama = ativa ? c.fama || 0 : 0;
  if (ativa && c.clube && c.clube.pais === x.pais) return { ok: true, motivo: `Your club, ${c.clube.nome}, plays ${P.em}. Have a good trip ${x.para}!` };
  if (ativa && fama >= x.convite) return { ok: true, motivo: `Friendly match invite ${x.em}! Your fame caught the eye of clubs ${P.de}.` };
  if (!ativa) return { ok: false, motivo: `To go ${x.a} you need to be a ${carrG('jogador profissional', 'jogadora profissional')}. Your career starts at level ${CARR_NIVEL_MIN} with Agent Rodrigues (U key).` };
  return { ok: false, motivo: `To go ${x.a} you need to play for a club ${P.de} (from level ${CARR_TIERS[x.tier].nivel}) or have ${carrFmt(x.convite)} fame to get a friendly match invite. Your fame: ${carrFmt(fama)}.` };
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
const CARR_EF_ROT = { dir: '👔 President', emp: '🤝 Agent', tor: '📣 Fans', fama: '⭐ Fame', ouro: '🪙 coins', sal: '💰 salary/day' };
function carrChips(ef) {
  const out = [];
  for (const k of ['dir', 'emp', 'tor', 'fama', 'sal', 'ouro']) {
    const v = ef && ef[k]; if (!v) continue;
    out.push(el('span', { class: 'ef ' + (v > 0 ? 'pos' : 'neg') }, `${v > 0 ? '+' : '−'}${carrFmt(Math.abs(v))} ${CARR_EF_ROT[k]}`));
  }
  return el('div', { class: 'efeitos' }, out.length ? out : el('span', { class: 'ef' }, 'no changes'));
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
    el('small', {}, ativo ? `${v}/100 · ${carrHumor(v)}` : 'no club'));
}
function carrSalarioTxt(sal) {
  return el('span', {}, el('b', {}, typeof precoTag === 'function' ? precoTag(carrLiquido(sal)) : carrFmt(carrLiquido(sal))), ' por dia ', el('small', {}, `(gross ${carrFmt(sal)}, 10% goes to Rodrigues)`));
}
function carrFechar() { return el('button', { class: 'btn', onclick: () => fechaModal() }, 'Close'); }
function carrVoltar() { return el('button', { class: 'btn', onclick: () => abrirCarreira() }, '◀ Back to career'); }

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
      el('small', {}, `Fame ${carrFmt(c.fama)}/${carrFmt(CARR_FAMA_MAX)}`, r.prox ? ` · ${faltam} to go until ${r.prox.emoji} ${r.prox.nome}` : ' · top of the world!')),
    el('div', { style: 'text-align:right' }, el('small', {}, 'Next title'), carrBarra(pFama), el('small', {}, `${Math.round(pFama * 100)}%`)));
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
          el('p', {}, '💰 Salary: ', carrSalarioTxt(k.salario)),
          el('p', {}, `📄 Contract until day ${k.fimDia}`, el('small', {}, k.fimDia - d > 0 ? ` (${k.fimDia - d} days left)` : ' (ending!)')),
          el('p', {}, `👔 President: ${def.dirigente.nome} `, el('span', { class: 'pill', title: pf.desc }, `${pf.emoji} ${pf.nome}`)),
          el('p', {}, pend ? el('span', { class: 'pill alerta' }, `📅 MEETING SCHEDULED! Go now (since day ${k.proxReuniao})`) : el('span', { class: 'pill' }, `📅 Next meeting: day ${k.proxReuniao}`),
            c.liberado ? el('span', { class: 'pill verde' }, '✈️ Free to negotiate') : null,
            k.promessa ? el('span', { class: 'pill roxo' }, '⚽ Boosted targets: bonus ×2') : null,
            k.estrutura ? el('span', { class: 'pill verde' }, '🏗️ New facilities: bonus +50%') : null))),
      el('h3', {}, '🎯 Targets until the next meeting'),
      el('div', { class: 'metas' }, k.metas.length ? k.metas.map(carrMetaLinha) : el('p', { class: 'vazio' }, 'No targets this period.')), typeof carrBotaoMetas === 'function' ? carrBotaoMetas(k) : null);
  } else {
    clube = el('div', { class: 'clube-card', style: '--c1:#aaa;--c2:#ddd' }, el('span', { style: 'font-size:48px' }, '🎒'),
      el('div', {}, el('div', { class: 'nm' }, `No club — ${carrG('jogador livre', 'jogadora livre')}`),
        el('p', {}, 'You don\'t get a salary while you have no club. Rodrigues has offers on the table!'),
        el('button', { class: 'btn amarelo', onclick: () => reuniaoEmpresario() }, '🤝 See offers')));
  }
  // medidores
  const b = bonusCarreira(); const pct = Math.round((b.xp - 1) * 100);
  const medidores = el('div', {},
    el('h3', { style: 'margin-top:0' }, '😃 Satisfaction'),
    el('div', { class: 'medidores' },
      carrMedidor('President', c.satDir, 'Hit your targets and choose your words wisely in meetings. Below 15 = released!', !!k),
      carrMedidor('Agent', c.satEmp, 'Rodrigues likes it when you sign contracts and hit your targets. Turning down too many offers upsets him.'),
      carrMedidor('Fans', c.satTorcida, 'Wins, goals, bosses and peace missions make the fans happy. Happy fans give extra XP!')),
    el('p', { class: 'dica' }, `📣 Fan bonus${c.fama >= CARR_FAMA_BONUS_XP ? ' + fame' : ''}: `, el('b', {}, `${pct >= 0 ? '+' : '−'}${Math.abs(pct)}% XP`), c.fama < CARR_FAMA_BONUS_XP ? ` (with ${carrFmt(CARR_FAMA_BONUS_XP)} fame: +5% extra)` : ''),
    el('h3', {}, '✈️ International trips'),
    el('div', { class: 'europa' }, Object.keys(CARR_EXTERIOR).map(cid => {
      const pv = podeViajar(cid);
      return el('span', { class: 'pill ' + (pv.ok ? 'verde' : 'cinza'), title: pv.motivo }, `${pv.ok ? '🔓' : '🔒'} ${CARR_PAISES[CARR_EXTERIOR[cid].pais].bandeira} ${CARR_EXTERIOR[cid].nome} (${carrFmt(CARR_EXTERIOR[cid].convite)}⭐)`);
    })),
    c.paises.length ? el('p', { class: 'dica' }, 'Countries you\'ve played in: ', c.paises.map(p => `${CARR_PAISES[p].bandeira} ${CARR_PAISES[p].nome}`).join(' · ')) : null,
    el('p', { class: 'dica' }, `Targets met: ${c.contadores.metasCumpridas} · Transfers: ${c.contadores.transferencias} · Cup titles: ${c.titulos.copa}`));
  // botões
  const podeReuniao = !!(k && c.reuniaoPendente);
  const ops = el('div', { class: 'opcoes' },
    el('button', { class: 'btn ' + (podeReuniao ? 'amarelo grande' : ''), disabled: podeReuniao ? null : 'disabled', title: podeReuniao ? 'The club president is waiting!' : (k ? `The next meeting is on day ${k.proxReuniao}` : 'You don\'t have a club'), onclick: () => reuniaoDirigente() }, podeReuniao ? '📋 Go to the meeting (R)' : '📋 Go to the meeting'),
    el('button', { class: 'btn ' + (!k ? 'amarelo grande' : 'verde'), onclick: () => reuniaoEmpresario() }, '🤝 Talk to the agent (E)'),
    carrFechar());
  // histórico
  const hist = el('div', { class: 'hist' }, el('div', { class: 'jn' }, '📰 STAR GAZETTE'),
    c.historico.length ? c.historico.slice(0, 30).map(h => el('div', { class: 'm' }, h)) : el('div', { class: 'm' }, 'No news yet.'));
  const at = { e: () => reuniaoEmpresario() };
  if (podeReuniao) { at.r = () => reuniaoDirigente(); at.Enter = at.r; }
  carrMostra(at,
    el('h2', {}, '💼 My Career'),
    fama,
    el('div', { class: 'grade2' }, clube, medidores),
    ops,
    el('h3', {}, '🗞️ History'),
    hist);
}
function carrTelaInativa() {
  const s = G.save; const pode = (s.nivel || 1) >= CARR_NIVEL_MIN;
  const fala = pode
    ? `Hey there, star! I'm Rodrigues, soccer agent. I saw you play and I'm sure of it: you're ${carrG('pronto', 'pronta')} to go ${carrG('profissional', 'profissional')}! Shall we sign your first contract?`
    : `Whoa! It's still too early. When you reach level ${CARR_NIVEL_MIN}, I'll make you a ${carrG('jogador profissional', 'jogadora profissional')}. Keep training!`;
  const at = {}; if (pode) { at.Enter = () => { if (carrComecar()) reuniaoEmpresario(); }; }
  carrMostra(at,
    el('h2', {}, '💼 Pro Career'),
    carrTopo(CARR_LOOK_RODRIGUES, 'Agent Rodrigues', fala),
    el('ul', { class: 'regras' },
      el('li', {}, 'Start in Brazil 🇧🇷 and travel the world: Cairo 🇪🇬, Tokyo 🇯🇵, Doha 🇶🇦, Miami 🇺🇸 and, in Europe, Lisbon 🇵🇹, Madrid 🇪🇸, Milan 🇮🇹, Munich 🇩🇪 and London 🇬🇧!'),
      el('li', {}, `Every ${CARR_PERIODO} game days there's a meeting with the club president, who reviews your targets.`),
      el('li', {}, 'In meetings, your choices decide raises, renewals, transfers... and even getting released!'),
      el('li', {}, 'Keep the president, the agent and the fans happy. Happy fans = up to +10% XP!'),
      el('li', {}, 'Earn fame to get better offers and invites to play abroad.')),
    pode ? null : el('div', { class: 'caixa' }, el('b', {}, `Level ${s.nivel || 1} of ${CARR_NIVEL_MIN}`), carrBarra((s.nivel || 1) / CARR_NIVEL_MIN)),
    el('div', { class: 'opcoes' },
      pode ? el('button', { class: 'btn amarelo grande', onclick: () => { if (carrComecar()) reuniaoEmpresario(); } }, '⚽ Start career') : el('button', { class: 'btn', disabled: 'disabled' }, `🔒 Start career (level ${CARR_NIVEL_MIN})`),
      carrFechar()));
}

/* ---------- reunião com o dirigente ---------- */
function reuniaoDirigente() {
  if (typeof G === 'undefined' || !G || !G.save) return;
  const c = carrDados();
  if (!c.ativa) return abrirCarreira();
  const k = c.clube;
  if (!k) {
    return carrMostra({}, el('h2', {}, '📋 Meeting'),
      el('p', {}, 'You don\'t have a club, so there\'s no meeting with a club president. Rodrigues can find you a team!'),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => reuniaoEmpresario() }, '🤝 Talk to Rodrigues'), carrVoltar(), carrFechar()));
  }
  const def = carrClube(k.id); const F = CARR_FALAS[def.dirigente.perfil];
  if (!c.reuniaoPendente) {
    return carrMostra({}, el('h2', {}, `📋 ${def.nome}`),
      carrTopo(def.dirigente.look, def.dirigente.nome, carrTexto(F.espera, { dia: k.proxReuniao })),
      el('h3', {}, '🎯 Your targets'), el('div', { class: 'metas' }, k.metas.map(carrMetaLinha)), typeof carrBotaoMetas === 'function' ? carrBotaoMetas(k) : null,
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
    el('h2', {}, `📋 Meeting at ${def.nome}`),
    carrTopo(def.dirigente.look, `${def.dirigente.nome} · ${CARR_PERFIS[def.dirigente.perfil].emoji} ${CARR_PERFIS[def.dirigente.perfil].nome}`, ra.fala, ' ', ra.avaliacao),
    el('div', { class: 'passo' }, `1️⃣ Target review: ${ra.ok} of ${ra.total} target${ra.total === 1 ? '' : 's'} met`),
    el('div', { class: 'res' }, ra.res.map((x, i) => {
      const ln = el('div', { class: 'linha ' + (x.ok ? 'ok' : 'nao'), style: `animation-delay:${i * 0.15}s` },
        el('span', {}, x.ok ? '✅' : '❌'), el('span', { class: 'ds' }, `${x.desc} (${x.prog}/${x.n})`), carrChips(x.ef));
      return ln;
    })),
    ra.extras && ra.extras.length ? el('p', { class: 'dica' }, ra.extras.join(' · ')) : null,
    el('h3', {}, 'Review result'), carrChips(ra.tot),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: seguir }, 'Continue ▶'), carrFechar()));
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
      el('small', {}, el('span', { class: 'k' }, i + 1), ` 🎲 ${carrChanceTxt(p)} chance`));
  });
  carrMostra(at,
    el('h2', {}, `📋 Meeting at ${def.nome}`),
    carrTopo(def.dirigente.look, def.dirigente.nome, carrTexto('So, {nome}? What do you want to tell me?')),
    el('div', { class: 'passo' }, '2️⃣ Your turn to talk: pick ONE option (keys 1 to 4)'),
    el('div', { class: 'escolhas' }, botoes),
    el('p', { class: 'dica' }, `${CARR_PERFIS[def.dirigente.perfil].emoji} ${def.dirigente.nome} is ${CARR_PERFIS[def.dirigente.perfil].nome.toLowerCase()}: ${CARR_PERFIS[def.dirigente.perfil].desc} A happy club president and lots of fame improve your chances.`));
}
function carrTelaResposta(r, def) {
  if (!r) return abrirCarreira();
  const o = CARR_OPCOES[r.op];
  const ops = el('div', { class: 'opcoes' });
  const at = {};
  if (r.dispensa) {
    const fn = () => carrTelaDispensa(r.dispensa); at.Enter = fn;
    ops.append(el('button', { class: 'btn amarelo grande', onclick: fn }, 'Continue ▶'));
  } else {
    if (r.op === 'negociar' && r.ok) { const fn = () => reuniaoEmpresario(); at.Enter = fn; ops.append(el('button', { class: 'btn amarelo grande', onclick: fn }, '🤝 See offers with Rodrigues')); }
    else at.Enter = () => abrirCarreira();
    ops.append(carrVoltar(), carrFechar());
  }
  const k = carrDados().clube;
  carrMostra(at,
    el('h2', {}, `📋 Meeting at ${def.nome}`),
    el('p', { class: 'dica' }, `You said: ${o.emoji} ${carrOpTxt(r.op)}`),
    carrTopo(def.dirigente.look, def.dirigente.nome, r.fala),
    el('div', { class: 'veredito ' + (r.ok ? 'sim' : 'nao') }, r.ok ? '👍 It worked!' : '👎 No luck...'),
    carrChips(r.ef),
    r.extra ? el('p', { class: 'dica' }, r.extra) : null,
    !r.dispensa && k ? el('div', {}, el('h3', {}, `🎯 New targets until day ${k.proxReuniao}`), el('div', { class: 'metas' }, k.metas.map(carrMetaLinha)), typeof carrBotaoMetas === 'function' ? carrBotaoMetas(k) : null) : null,
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
    ops.append(el('button', { class: 'btn verde grande', onclick: sim }, `✍️ Renew for ${carrFmt(carrLiquido(rv.salario))}/day (S)`),
      el('button', { class: 'btn', onclick: nao }, '🚪 Don\'t renew and test the market (N)'));
  } else {
    const ok = () => fim(carrDecideRenovacao(false)); at.Enter = ok;
    ops.append(el('button', { class: 'btn amarelo grande', onclick: ok }, 'Got it ▶'));
  }
  const dif = rv.salario - k.salario;
  carrMostra(at,
    el('h2', {}, `📄 End of contract at ${def.nome}`),
    carrTopo(def.dirigente.look, def.dirigente.nome, rv.fala),
    el('div', { class: 'passo' }, `2️⃣ Renewal — you met ${Math.round(rv.perf * 100)}% of the targets in this contract`),
    rv.aceita ? el('div', { class: 'caixa' },
      el('p', {}, '💰 New salary: ', carrSalarioTxt(rv.salario)),
      el('p', {}, dif >= 0 ? `📈 ${carrFmt(dif)} more than your current salary (gross).` : `📉 ${carrFmt(-dif)} less than your current salary: the club president thought you could do better.`),
      el('p', {}, `📄 ${CARR_PERIODO * CARR_PERIODOS_CONTRATO} more days of contract, with a meeting every ${CARR_PERIODO} days.`))
      : el('div', { class: 'aviso' }, 'The club president doesn\'t want to renew. You\'ll be a free agent — Rodrigues will look for a new club.'),
    ops);
}
function carrTelaFimContrato(res, def) {
  if (!res) return abrirCarreira();
  const ops = el('div', { class: 'opcoes' });
  if (res.renovou) ops.append(el('button', { class: 'btn amarelo', onclick: () => abrirCarreira() }, 'See my career ▶'), carrFechar());
  else ops.append(el('button', { class: 'btn amarelo grande', onclick: () => reuniaoEmpresario() }, '🤝 Talk to Rodrigues ▶'), carrVoltar());
  carrMostra({ Enter: res.renovou ? () => abrirCarreira() : () => reuniaoEmpresario() },
    el('h2', {}, res.renovou ? '✍️ Contract renewed!' : '🚪 End of contract'),
    el('div', { class: 'jornal' }, el('div', { class: 'jn' }, 'STAR GAZETTE'), el('div', { class: 'mc' }, res.manchete)),
    carrChips(res.ef), ops);
}
function carrTelaDispensa(info) {
  if (!info) return abrirCarreira();
  carrMostra({ Enter: () => reuniaoEmpresario() },
    el('h2', {}, '📰 Released'),
    carrTopo(info.def.dirigente.look, info.def.dirigente.nome, info.fala),
    el('div', { class: 'jornal' }, el('div', { class: 'jn' }, 'STAR GAZETTE'), el('div', { class: 'mc' }, info.manchete)),
    carrChips(info.ef),
    el('p', {}, 'Every star goes through a rough patch. Hit your targets at the next club and always go to the meetings!'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: () => reuniaoEmpresario() }, '🤝 Talk to Rodrigues ▶'), carrVoltar()));
}

/* ---------- escritório do empresário ---------- */
function reuniaoEmpresario(fala) {
  if (typeof G === 'undefined' || !G || !G.save) return;
  const c = carrDados();
  if (!c.ativa) return abrirCarreira();
  const k = c.clube; const d = carrDia();
  const quem = `Agent Rodrigues · ${carrCara(c.satEmp)} ${carrHumor(c.satEmp)}`;
  if (!carrPodeAssinar()) {
    const dicas = [];
    if (c.satDir < 35) dicas.push('⚠️ Your club president is unhappy. Hit your targets before the next meeting!');
    if (c.satTorcida < 35) dicas.push('📣 The fans are upset. Wins, goals, bosses and peace missions help!');
    if (c.satEmp < 25) dicas.push('😠 I (Rodrigues) am upset: turning down too many offers makes me look bad in the market.');
    if (!dicas.length) dicas.push('👍 All good here. Keep hitting your targets and the offers will come!');
    return carrMostra({},
      el('h2', {}, '🤝 Rodrigues\'s Office'),
      carrTopo(CARR_LOOK_RODRIGUES, quem, fala || `You have a contract with ${k.nome} until day ${k.fimDia}. To leave early, ask the club president to be ${carrG('negociado', 'negociada')} at a meeting. The transfer window opens on day ${k.fimDia - CARR_PERIODO}.`),
      el('div', { class: 'caixa' }, dicas.map(t => el('p', { style: 'margin:3px 0;font-weight:700' }, t))),
      el('div', { class: 'opcoes' }, carrVoltar(), carrFechar()));
  }
  if (c.ofertasDia !== d) c.ofertas = carrGeraOfertas(c.historico.length <= 1 && !k ? { inicial: true } : {}); // recusou hoje: propostas novas só amanhã (senão dava para pescar a dos sonhos)
  const temEuropa = c.ofertas.some(o => carrClube(o.id).pais !== 'brasil');
  let txt = fala;
  if (!txt) {
    if (c.historico.length <= 1 && !k) txt = 'The time has come! These clubs want you. Choose carefully: every club president has their own style.';
    else if (!k && c.contadores.dispensas && c.historico[0] && c.historico[0].includes('dispensa')) txt = 'Head up! Every star has been through this. Look who wants you:';
    else if (c.liberado) txt = 'The club agreed to transfer you! Look at the offers that came in:';
    else if (k) txt = 'Your contract is ending. Time to test the market!';
    else if (c.satEmp >= 70) txt = 'My favorite client! Look what I got for you:';
    else if (c.satEmp >= 40) txt = 'I worked hard on these offers. Take a look:';
    else if (c.satEmp >= 25) txt = 'Well... it wasn\'t easy, but I got this:';
    else txt = 'Honestly? You\'ve been giving me a hard time. These are all I could get:';
    if (!c.ofertas.length) txt = 'You turned down today\'s offers. Come back tomorrow and I\'ll get you new ones!';
    else if (temEuropa) txt = txt.replace(/:$/, '!') + (c.ofertas.some(o => CARR_EUROPA_PAISES.includes(carrClube(o.id).pais)) ? ' And there\'s an offer from EUROPE, wow!' : ' And there\'s an offer from ABROAD, wow!');
  }
  const at = {};
  const cards = c.ofertas.map((o, i) => {
    const def = carrClube(o.id); const pf = CARR_PERFIS[def.dirigente.perfil];
    const assinar = () => carrTelaAssinou(carrAssinar(o));
    at[String(i + 1)] = assinar;
    const eur = def.pais !== 'brasil';
    return el('div', { class: 'oferta' + (o.sonho ? ' sonho' : '') + (eur ? ' europa' : ''), style: `animation-delay:${i * 0.1}s` },
      o.sonho ? el('span', { class: 'tag-sonho' }, '⭐ DREAM OFFER') : null,
      el('div', { class: 'cab' }, carrEscudo(def, 44), el('div', {}, el('div', { class: 'nm' }, def.nome), el('small', {}, `${CARR_PAISES[def.pais].bandeira} ${CARR_PAISES[def.pais].nome} · ${carrCidadeNome(def.cidade)}`))),
      el('p', {}, `🏆 ${CARR_TIERS[def.tier].liga} (${def.tier <= 5 ? '★'.repeat(def.tier) : '★ ' + def.tier}/${CARR_TIER_MAX})`),
      el('p', { class: 'sal' }, `💰 ${carrFmt(carrLiquido(o.salario))} per day`),
      el('p', {}, el('small', {}, `gross ${carrFmt(o.salario)} · signing bonus: +${carrFmt(carrLiquido(o.luvas))}`)),
      el('p', {}, `📄 ${o.dias}-day contract`),
      el('p', { title: pf.desc }, `👔 ${def.dirigente.nome}: ${pf.emoji} ${pf.nome}`),
      eur ? el('p', {}, `✈️ Unlocks the flight ${CARR_EXTERIOR[def.cidade] ? CARR_EXTERIOR[def.cidade].para : 'para ' + carrCidadeCurta(def.cidade)}`) : null,
      el('button', { class: 'btn ' + (o.sonho ? 'amarelo' : 'verde'), onclick: assinar }, `✍️ Sign (${i + 1})`));
  });
  const d2 = carrDia(); const pedidos = c.pedidosDia === d2 ? c.pedidos || 0 : 0;
  const melhor = () => { const r = carrPedirMelhores(); reuniaoEmpresario(r.fala); };
  const ficar = () => { carrRecusar(); if (k) abrirCarreira(); else fechaModal(); };
  at.m = melhor;
  carrMostra(at,
    el('h2', {}, '🤝 Rodrigues\'s Office'),
    carrTopo(CARR_LOOK_RODRIGUES, quem, txt),
    c.satEmp < 25 ? el('div', { class: 'aviso' }, '⚠️ Rodrigues is upset with you: fewer offers and lower salaries are coming. Sign a contract and hit your goals to cheer him up again!') : null,
    el('div', { class: 'ofertas' }, cards.length ? cards : el('p', { class: 'vazio' }, 'No offers right now.')),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn roxo', disabled: pedidos >= 2 ? 'disabled' : null, onclick: melhor }, `🔎 Ask for better offers (−8 Agent) (M)`),
      el('button', { class: 'btn', onclick: ficar }, k ? '🏠 Stay where I am' : '⏳ Not now'),
      carrVoltar()),
    el('p', { class: 'dica' }, 'Turning down offers makes Rodrigues upset (−4). Signing a contract makes him happy (+10). Hitting your goals helps too.'));
}
function carrTelaAssinou(r) {
  if (!r) return abrirCarreira();
  const def = r.def;
  carrMostra({ Enter: () => abrirCarreira() },
    el('h2', {}, '✍️ Contract signed!'),
    carrTopo(CARR_LOOK_RODRIGUES, 'Agent Rodrigues', r.europa ? `Pack your bags, star! You're going to play ${CARR_EXTERIOR[def.cidade] ? CARR_EXTERIOR[def.cidade].em : 'em ' + carrCidadeCurta(def.cidade)}! This is just the beginning.` : `Deal! ${def.nome} is a great place to grow. Now it's up to you: hit your goals!`),
    el('div', { class: 'jornal' }, el('div', { class: 'jn' }, 'THE STAR GAZETTE — SPECIAL EDITION'), el('div', { class: 'mc' }, r.manchete)),
    carrChips(r.ef),
    r.europa ? el('p', { class: 'aviso', style: 'background:#e8e0ff;border-color:#3a2780' }, `✈️ The flight ${CARR_EXTERIOR[def.cidade] ? CARR_EXTERIOR[def.cidade].para : 'para ' + carrCidadeCurta(def.cidade)} (${CARR_PAISES[def.pais].nome}) is unlocked!`) : null,
    el('div', { class: 'caixa', style: 'margin-top:8px' },
      el('p', {}, `👔 Your club director: ${def.dirigente.nome} (${CARR_PERFIS[def.dirigente.perfil].emoji} ${CARR_PERFIS[def.dirigente.perfil].nome}) — ${CARR_PERFIS[def.dirigente.perfil].desc}`),
      el('p', {}, `📅 First meeting: day ${carrDados().clube.proxReuniao}. Don't miss it!`)),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: () => abrirCarreira() }, 'See my career ▶'), carrFechar()));
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
  alpinos: ['Bayernn München', 'FCB', '#d42a2a', '#ffffff'], relojoeiros: ['TSV 1861 München', 'TSV', '#6ab0e0', '#ffffff'], castelo: ['Augsburg', 'AUG', '#d42a2a', '#1a8a3a'],
  royalthames: ['Totenhamm', 'TOT', '#ffffff', '#1a2a6a'], bigben: ['Chelsi', 'CHE', '#1a4ad9', '#ffffff'], foghill: ['Arsenau', 'ARS', '#d42a2a', '#ffffff'],
};
for (const k of CARREIRA_CLUBES) { const r = CARR_NOMES_REAIS[k.id]; if (r) [k.nome, k.sigla, k.cor1, k.cor2] = r; }
const _checaCarreiraBase = checaCarreira;
checaCarreira = function () {
  const c = G.save && G.save.carreira;
  if (c && c.clube && CARR_NOMES_REAIS[c.clube.id] && c.clube.nome !== CARR_NOMES_REAIS[c.clube.id][0]) c.clube.nome = CARR_NOMES_REAIS[c.clube.id][0];
  return _checaCarreiraBase.apply(this, arguments);
};
