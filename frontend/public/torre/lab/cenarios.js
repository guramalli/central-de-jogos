// Central de testes da árvore: cenários prontos (mudanças de regra já montadas) e builds prontas (estilos do robô).
export const CENARIOS = [
  { id: 'hoje', n: 'Hoje (sem mudanças)', d: 'O jogo como está publicado.', m: {} },
  { id: 'logBarata', n: 'Logística mais barata', d: 'Magnético ×3 por nível (hoje ×4); Motor e Caçamba até o nível 12.', m: { up: { maglev: { k: 3 }, motor: { max: 12 }, cacamba: { max: 12 } } } },
  { id: 'semTeto', n: 'Motor e Caçamba sem teto', d: 'Os dois deixam de parar no nível 10.', m: { up: { motor: { max: null }, cacamba: { max: null } } } },
  { id: 'defForte', n: 'Defesas mais fortes', d: 'Cada nível de defesa tira 12% do dano (hoje 8%).', m: { risco: { defMul: 0.88 } } },
  { id: 'defFraca', n: 'Defesas mais fracas', d: 'Cada nível de defesa tira 5% do dano.', m: { risco: { defMul: 0.95 } } },
  { id: 'bravas', n: 'Intempéries mais bravas', d: 'Dano ×1,7 por ano (hoje ×1,5) e ameaças mais seguidas.', m: { risco: { anoK: 1.7, gapAno: 0.85 } } },
  { id: 'reforcoCheio', n: 'Reforço a preço cheio (como era)', d: 'Níveis do laudo a 100% do preço e parcelamento segurando 20–60% da renda.', m: { risco: { reforcoNiveis: 1, retencao: [0.2, 0.6] } } },
  { id: 'premiosFortes', n: 'Prêmios de defesa fortes (como era)', d: '−50% cada e até −90% por grupo.', m: { premios: { amortecedor: { defCorte: 0.5 }, fundProfunda: { defCorte: 0.5 }, blindagem: { defCorte: 0.5 } }, risco: { premioDefMax: 0.9 } } },
  { id: 'obraForte', n: 'Treino e Caminhão mais fortes', d: 'Treinamento +35% por nível (hoje +25%); Caminhão +40%.', m: { up: { treino: { add: 0.35 }, caminhao: { add: 0.4 } } } },
  { id: 'repForte', n: 'Reputação mais forte', d: '+4% em tudo por ponto (hoje +2,5%).', m: { viva: { 'prestige.rep': 0.04 } } },
  { id: 'ponte', n: 'Melhoria nova: Ponte aérea de carga', d: 'Logística, abre aos 2 km: ×1,3 no material subindo por nível, até 8.', m: { novas: { ponteAerea: { n: 'Ponte aérea de carga', b: 'log', st: 'tran', base: 5e6, k: 2.5, mul: 1.3, max: 8, reqAlt: 2000 } } } },
];
// builds prontas: quem joga e como (robô + estilo)
export const BUILDS_PRONTAS = [
  { id: 'excEq', n: 'Excelente equilibrado', robo: 'excelente', build: 'equilibrado' },
  { id: 'bom', n: 'Bom jogador', robo: 'bom', build: 'equilibrado' },
  { id: 'novato', n: 'Novato', robo: 'novato', build: 'equilibrado' },
  { id: 'excLog', n: 'Excelente com foco em Logística', robo: 'excelente', build: 'logistica' },
  { id: 'excMerc', n: 'Excelente com foco em Mercado', robo: 'excelente', build: 'mercado' },
  { id: 'excDef', n: 'Excelente defensivo', robo: 'excelente', build: 'defesas' },
  { id: 'parA', n: 'Excelente, sempre lado A dos pares', robo: 'excelente', build: 'parA' },
  { id: 'parB', n: 'Excelente, sempre lado B dos pares', robo: 'excelente', build: 'parB' },
  { id: 'premObra', n: 'Excelente com prêmios de obra', robo: 'excelente', build: 'premiosObra' },
];
