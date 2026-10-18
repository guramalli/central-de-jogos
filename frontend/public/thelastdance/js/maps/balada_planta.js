// Planta da BALADA (base em blocos, para aprovação — mesma etapa que a padaria teve antes da arte).
// Referência: reference/kit_v1.0/02_mapas/balada_isometrica_referencia.png — entrada com fila e tapete vermelho,
// guarda-volumes, camarote VIP, pista de dança com o palco do DJ, bar comprido, banheiros e lounge com sofás.
// É grande (26 × 18 m, quase o dobro da padaria): a câmera fica um pouco mais afastada (zoom 0,75).
// Unidade: metro. Paredes do fundo: x = 0 (esquerda da tela) e y = 0 (direita); as da frente são cortadas baixas.
(function (global) {
  "use strict";

  const LARG = 26, PROF = 18;
  const PE_DIREITO = 3.4;
  const CORTE_FRENTE = 0.35;
  const ESP = 0.15;

  // cores dos blocos: [topo, face esquerda, face direita]
  const COR = {
    parede: ["#2a2433", "#211c29", "#302838"],
    preto: ["#22202a", "#17151d", "#2a2733"],
    couro: ["#2e2b36", "#201e27", "#383442"],
    vermelho: ["#a3203c", "#7c1830", "#b8284a"],
    ouro: ["#d9a640", "#a87d2c", "#e8bb55"],
    balcao: ["#3a1420", "#2a0e16", "#4a1a28"],
    madeira: ["#5b3a26", "#45291a", "#6b4630"],
    floreira: ["#2f5a3a", "#24452c", "#3a6c46"],
    rosa: ["#d63c9e", "#a82e7c", "#e85cb3"],
  };
  // arte: nome da peça (kit_chatgpt/balada); sem a arte ainda, o bloco aparece na cor indicada
  const bloco = (nome, tipo, x0, y0, x1, y1, z1, cor, arte, extra) => Object.assign({ nome, tipo, x0, y0, x1, y1, z1, cor: COR[cor], arte }, extra);
  // módulos iguais lado a lado (balcão, borda do palco, guarda-corpo...): n peças de "passo" metros a partir de a
  const modulos = (n, a, passo, f) => Array.from({ length: n }, (_, k) => f(a + k * passo, a + (k + 1) * passo));
  // mesa alta redonda (barril) com banquetas dos lados indicados (o: esquerda, l: direita, s: atrás, n: frente)
  function mesaAlta(x, y, lados) {
    const out = [bloco("Mesa alta", "mesa", x, y, x + 0.6, y + 0.6, 1.05, "madeira", "mesa_alta")];
    const b = (a, c) => bloco("Banqueta", "cadeira", a, c, a + 0.4, c + 0.4, 0.75, "vermelho", "banqueta"); // a mesma da padaria
    for (const l of lados) {
      if (l === "o") out.push(b(x - 0.5, y + 0.12));
      if (l === "l") out.push(b(x + 0.75, y + 0.12));
      if (l === "s") out.push(b(x + 0.12, y - 0.5));
      if (l === "n") out.push(b(x + 0.12, y + 0.75));
    }
    return out;
  }

  const PLANTA = {
    id: "balada",
    nome: "Balada",
    musica: "balada",
    zoom: 0.75,                       // vista um pouco mais distante que nos outros lugares: a balada é grande
    largura: LARG, profundidade: PROF,
    peDireito: PE_DIREITO,
    texturaParede: "parede_balada",   // sem a arte ainda: paredes em bloco escuro
    inicio: { x: 1.3, y: 14.9, dir: "direita" },
    inicios: { entrada: { x: 1.3, y: 14.9 } },
    roteiroDemo: ["entrada", "guarda-volumes", "camarote VIP", "pista", "palco do DJ", "bar", "banheiros", "lounge", "cabine de fotos"],

    comodos: [
      { nome: "Salão", x0: 0, y0: 0, x1: LARG, y1: PROF, piso: "#24202c", piso2: "#2a2533", piso_arte: "piso_balada" },
      { nome: "Camarote VIP", x0: 0, y0: 0, x1: 6.15, y1: 7.4, piso: "#4a1622", piso2: "#541a28", piso_arte: "piso_vip" },
      { nome: "Pista de dança", x0: 7, y0: 2.4, x1: 15, y1: 10.4, piso: "#2c1846", piso2: "#351c55", piso_arte: "piso_pista" },
      { nome: "Palco", x0: 7.5, y0: 0, x1: 14.5, y1: 1.6, piso: "#18151e", piso2: "#1d1a24" },
      { nome: "Bar", x0: 15.6, y0: 0, x1: 23.2, y1: 4.6, piso: "#2e2228", piso2: "#35282f" },
      { nome: "Banheiros", x0: 23.35, y0: 0, x1: LARG, y1: 3.6, piso: "#3b4652", piso2: "#44505d" },
      { nome: "Guarda-volumes", x0: 0, y0: 7.6, x1: 3.0, y1: 11.7, piso: "#2a2633", piso2: "#312c3b" },
      { nome: "Lounge", x0: 5, y0: 12.5, x1: 15, y1: PROF, piso: "#2b241f", piso2: "#322a24" },
    ],
    // tinta/LED no chão
    faixas: [
      { x0: 0, y0: 14.1, x1: 4.8, y1: 15.7, cor: "rgba(165,18,40,0.9)" },        // tapete vermelho da entrada
      { x0: 7.5, y0: 2.2, x1: 14.5, y1: 2.32, cor: "rgba(200,80,255,0.9)" },     // LED na frente do palco
      { x0: 15.9, y0: 2.72, x1: 23.0, y1: 2.82, cor: "rgba(255,60,95,0.9)" },    // LED no pé do balcão do bar
    ],

    caixas: [
      // paredes
      { nome: "", tipo: "parede", x0: -ESP, y0: -ESP, x1: 0, y1: PROF, z1: PE_DIREITO, fundo: true, cor: COR.parede },
      { nome: "", tipo: "parede", x0: 0, y0: -ESP, x1: LARG, y1: 0, z1: PE_DIREITO, fundo: true, cor: COR.parede },
      { nome: "", tipo: "parede", x0: LARG, y0: -ESP, x1: LARG + ESP, y1: PROF + ESP, z1: CORTE_FRENTE, cor: COR.parede },
      { nome: "", tipo: "parede", x0: -ESP, y0: PROF, x1: LARG, y1: PROF + ESP, z1: CORTE_FRENTE, cor: COR.parede },

      // ---- camarote VIP (canto do fundo): sofás vermelhos, mesinhas, guarda-corpo dourado com passagem vigiada
      bloco("Sofá do camarote", "sofa", 0, 0.8, 0.8, 3.2, 0.85, "vermelho", "sofa_vip_lado"),
      bloco("Sofá do camarote", "sofa", 0, 3.8, 0.8, 6.2, 0.85, "vermelho", "sofa_vip_lado"),
      bloco("Sofá do camarote", "sofa", 1.4, 0, 3.8, 0.8, 0.85, "vermelho", "sofa_vip"),
      bloco("Mesinha do camarote", "mesa", 1.4, 1.7, 2.0, 2.3, 0.5, "preto", "mesinha_vip"),
      bloco("Mesinha do camarote", "mesa", 1.4, 4.7, 2.0, 5.3, 0.5, "preto", "mesinha_vip"),
      bloco("Mesinha do camarote", "mesa", 2.4, 1.3, 3.0, 1.9, 0.5, "preto", "mesinha_vip"),
      // guarda-corpo em módulos de 1 m; a passagem (vigiada) fica entre y = 5 e 6,4
      ...modulos(5, 0, 1, (a, b) => bloco("Guarda-corpo do VIP", "baixo", 6.0, a, 6.15, b, 1.0, "ouro", "guarda_corpo_lado")),
      bloco("Guarda-corpo do VIP", "baixo", 6.0, 6.4, 6.15, 7.4, 1.0, "ouro", "guarda_corpo_lado"),
      ...modulos(6, 0, 1, (a, b) => bloco("Guarda-corpo do VIP", "baixo", a, 7.25, b, 7.4, 1.0, "ouro", "guarda_corpo")),

      // ---- palco do DJ (meio da parede do fundo): borda do palco em módulos, cabine e caixas de som
      ...modulos(5, 7.5, 1.4, (a, b) => bloco("Palco", "baixo", a, 1.6, b, 2.2, 0.45, "preto", "palco_borda")),
      bloco("Cabine do DJ", "mesa", 10.0, 0.7, 12.0, 1.4, 1.2, "preto", "cabine_dj"),
      bloco("Caixa de som", "armario", 7.8, 0.2, 8.6, 1.0, 1.9, "preto", "caixa_som_palco"),
      bloco("Caixa de som", "armario", 13.4, 0.2, 14.2, 1.0, 1.9, "preto", "caixa_som_palco"),

      // ---- bar: geladeiras atrás e balcão comprido, em módulos de 1,3 m; banquetas vermelhas (as da padaria)
      ...modulos(5, 15.9, 1.3, (a, b) => bloco("Geladeiras do bar", "armario", a, 0, b, 0.6, 1.0, "preto", "bar_fundo")),
      ...modulos(5, 15.9, 1.3, (a, b) => bloco("Balcão do bar", "movel", a, 2.0, b, 2.7, 1.1, "balcao", "balcao_bar")),
      ...[16.3, 17.4, 18.5, 19.6, 20.7, 21.8].map((x) => bloco("Banqueta do bar", "cadeira", x, 3.05, x + 0.4, 3.45, 0.75, "vermelho", "banqueta")),

      // ---- banheiros: parede separando do bar
      { nome: "", tipo: "parede", x0: 23.2, y0: 0, x1: 23.35, y1: 3.0, z1: 2.6, cor: COR.parede },

      // ---- pilares (com fita de LED na arte)
      bloco("Pilar", "parede", 6.2, 10.0, 6.8, 10.6, PE_DIREITO, "parede", "pilar_balada"),
      bloco("Pilar", "parede", 15.2, 10.0, 15.8, 10.6, PE_DIREITO, "parede", "pilar_balada"),
      bloco("Pilar", "parede", 15.2, 4.0, 15.8, 4.6, PE_DIREITO, "parede", "pilar_balada"),

      // ---- mesas altas em volta da pista
      ...mesaAlta(16.6, 6.0, ["o", "l"]),
      ...mesaAlta(19.6, 7.4, ["o", "n"]),
      ...mesaAlta(17.4, 9.6, ["l", "n"]),
      ...mesaAlta(21.6, 10.4, ["o", "l"]),
      ...mesaAlta(8.0, 11.0, ["o", "l"]),
      ...mesaAlta(12.8, 11.0, ["o", "l"]),

      // ---- guarda-volumes: balcão de atendimento (as prateleiras ficam na parede)
      bloco("Balcão do guarda-volumes", "movel", 2.2, 8.2, 2.8, 11.2, 1.05, "madeira", "balcao_guarda_volumes"),
      { nome: "", tipo: "parede", x0: 0, y0: 11.7, x1: 2.9, y1: 11.85, z1: 2.4, cor: COR.parede },

      // ---- entrada: cordão da fila em trechos de 1,2 m (postes nas pontas), púlpito da hostess
      ...[13.75, 15.9].flatMap((y) => modulos(3, 1.0, 1.2, (a, b) => bloco("Cordão da fila", "baixo", a, y, b, y + 0.15, 1.0, "ouro", "cordao_fila"))),
      bloco("Púlpito da hostess", "movel", 3.6, 12.4, 4.2, 13.0, 1.1, "preto", "pulpito_hostess"),

      // ---- lounge: floreira separando da pista (com passagem no meio), sofás de couro e mesinhas
      ...modulos(3, 5.0, 1.4, (a, b) => bloco("Floreira", "planta", a, 12.2, b, 12.5, 0.9, "floreira", "floreira")),
      ...modulos(3, 10.8, 1.4, (a, b) => bloco("Floreira", "planta", a, 12.2, b, 12.5, 0.9, "floreira", "floreira")),
      bloco("Sofá do lounge", "sofa", 5.4, 13.2, 6.2, 15.6, 0.85, "couro", "sofa_lounge_lado"),
      bloco("Mesinha do lounge", "mesa", 6.7, 14.0, 7.5, 14.8, 0.45, "madeira", "mesinha_lounge"),
      bloco("Sofá do lounge", "sofa", 6.6, 16.4, 9.0, 17.2, 0.85, "couro", "sofa_lounge_costas"),
      bloco("Sofá do lounge", "sofa", 10.4, 13.0, 12.8, 13.8, 0.85, "couro", "sofa_lounge"),
      bloco("Mesinha do lounge", "mesa", 11.2, 14.3, 12.0, 15.1, 0.45, "madeira", "mesinha_lounge"),
      bloco("Sofá do lounge", "sofa", 10.4, 15.6, 12.8, 16.4, 0.85, "couro", "sofa_lounge_costas"),
      { nome: "Vaso de planta", tipo: "planta", x0: 14.0, y0: 16.9, x1: 14.45, y1: 17.35, z1: 1.2, arte: "planta" },
      { nome: "Vaso de planta", tipo: "planta", x0: 5.1, y0: 17.1, x1: 5.55, y1: 17.55, z1: 1.2, arte: "planta" },

      // ---- canto da frente à direita: mesas altas, cabine de fotos e plantas
      ...mesaAlta(17.6, 13.4, ["o", "l"]),
      ...mesaAlta(20.6, 14.2, ["o", "n"]),
      ...mesaAlta(17.9, 16.4, ["l"]),
      ...mesaAlta(21.8, 16.6, ["o", "l"]),
      bloco("Cabine de fotos", "armario", 24.2, 12.6, 25.7, 14.0, 2.2, "rosa", "cabine_fotos"),
      { nome: "Vaso de planta", tipo: "planta", x0: 25.3, y0: 16.8, x1: 25.75, y1: 17.25, z1: 1.2, arte: "planta" },
      { nome: "Vaso de planta", tipo: "planta", x0: 22.6, y0: 4.9, x1: 23.05, y1: 5.35, z1: 1.2, arte: "planta" },
    ],

    naParede: [
      // parede da esquerda (x = 0): camarote, guarda-volumes, porta da rua e o letreiro do clube
      { nome: "Letreiro \"VIP\"", tipo: "neon", plano: "x0", a: 1.6, b: 3.6, z0: 1.7, z1: 2.6, texto: ["VIP", "CAMAROTE"], arte: "neon_vip" },
      { nome: "Prateleiras do guarda-volumes", tipo: "prateleira", plano: "x0", a: 8.4, b: 11.2, z0: 0.3, z1: 2.1, arte: "prateleiras_gv" },
      { nome: "Letreiro \"GUARDA-VOLUMES\"", tipo: "neon", plano: "x0", a: 8.5, b: 11.1, z0: 2.25, z1: 2.9, texto: ["GUARDA-", "VOLUMES"], arte: "neon_guarda_volumes" },
      { nome: "Porta da rua", tipo: "porta", plano: "x0", a: 14.2, b: 15.6, z0: 0, z1: 2.5, saida: true, arte: "porta_balada" },
      { nome: "Letreiro \"CLUB\"", tipo: "neon", plano: "x0", a: 16.2, b: 17.8, z0: 1.2, z1: 2.5, texto: ["CLUB", "♛"], arte: "neon_club" },
      // parede do fundo (y = 0): palco do DJ, bar e banheiros
      { nome: "Telão do palco", tipo: "led", plano: "y0", a: 8.8, b: 13.2, z0: 1.4, z1: 3.1, arte: "telao_palco" },
      { nome: "Letreiro do DJ", tipo: "neon", plano: "y0", a: 10.0, b: 12.0, z0: 1.9, z1: 2.8, texto: ["♛", "DJ"], arte: "neon_dj" },
      { nome: "Prateleira de bebidas", tipo: "prateleira", plano: "y0", a: 16.2, b: 22.8, z0: 1.1, z1: 2.3, arte: "prateleira_bebidas" },
      { nome: "Letreiro \"BAR\"", tipo: "neon", plano: "y0", a: 18.6, b: 20.6, z0: 2.4, z1: 3.1, texto: ["BAR", ""], arte: "neon_bar" },
      { nome: "Banheiro masculino", tipo: "porta", plano: "y0", a: 23.6, b: 24.6, z0: 0, z1: 2.2, arte: "porta_banheiro_masc" },
      { nome: "Banheiro feminino", tipo: "porta", plano: "y0", a: 24.9, b: 25.9, z0: 0, z1: 2.2, arte: "porta_banheiro_fem" },
      { nome: "Letreiro \"BANHEIROS\"", tipo: "neon", plano: "y0", a: 23.6, b: 25.9, z0: 2.4, z1: 3.0, texto: ["BANHEIROS", ""], arte: "neon_banheiros" },
    ],

    // Gente vem depois que o layout for aprovado (DJ, bartender, segurança do VIP, hostess, meninas na pista...)
    // na pista: três meninas dançando (personagens 3D do Tripo em pixel art, só a tira "dancar" de frente)
    npcs: [
      { id: "bia", nome: "Bia", personagem: "balada_ruiva", personagem3d: true, so3d: true, paquera: "balada_ruiva", postura: "em_pe", x: 9.2, y: 5.3, dir: "baixo",
        falarDe: { x: 9.2, y: 6.1 }, fala: ["\"Essa música é muito boa!\"", "\"Vai ficar só olhando ou vai dançar?\""] },
      { id: "carol", nome: "Carol", personagem: "balada_loira", personagem3d: true, so3d: true, paquera: "balada_loira", postura: "em_pe", x: 9.9, y: 7.9, dir: "baixo",
        falarDe: { x: 9.9, y: 8.7 }, fala: ["\"Hoje eu vim pra dançar, hein!\"", "\"O DJ tá on fire!\""] },
      { id: "duda", nome: "Duda", personagem: "balada_morena", personagem3d: true, so3d: true, paquera: "balada_morena", postura: "em_pe", x: 13.4, y: 4.9, dir: "baixo",
        falarDe: { x: 13.4, y: 5.7 }, fala: ["\"Adoro essa pista!\"", "\"Bora pro bar depois?\""] },

      // na mesinha alta da direita, perto do banheiro: a Bruna, de drink na mão (às vezes dá um gole, às vezes dança)
      { id: "bruna", nome: "Bruna", personagem: "balada_rosa", personagem3d: true, so3d: true, paquera: "balada_rosa",
        postura: "em_pe", x: 20.55, y: 7.75, dir: "baixo",
        ciclo3d: [["parado", 4], ["beber", 2.6], ["parado", 3], ["dancar", 6], ["parado", 2.5], ["beber", 2.6]],
        falarDe: { x: 20.55, y: 8.5 }, fala: ["\"Esse drink tá perfeito! 🍹\""] },
      // no lounge: a Clarissa, sentada no sofá de vestido vermelho (pode nem dar bola; se der, levanta para o beijo ou o tapa)
      { id: "clarissa", nome: "Clarissa", personagem: "balada_vestido", personagem3d: true, so3d: true, paquera: "balada_vestido",
        postura: "sentado", assento: 0.45, x: 11.0, y: 13.4, dir: "baixo",
        falarDe: { x: 10.2, y: 14.55 }, fala: ["\"Hm?\""] },

      // ---- a turma (rosto real: arte só com a senha; sem ela, o boneco provisório com as cores de "visual")
      // no bar, pegando bebida (de costas, virados para o balcão)
      { id: "pabo", nome: "Pablo", personagem: "pabo", postura: "em_pe", x: 17.15, y: 3.1, dir: "cima",
        falarDe: { x: 17.15, y: 3.85 }, fala: ["\"Barman, me vê uma água com gás. Amanhã tem treino.\"", "\"Proteína em forma de caipirinha existe?\""],
        visual: { pele: "#d29a6e", roupa: "#1f6fb2", calca: "#22304a", cabelo: "#2a1a10", estilo: "curto" } },
      { id: "borrinha", nome: "Borrinha", personagem: "borrinha", postura: "em_pe", x: 20.35, y: 3.1, dir: "cima",
        falarDe: { x: 20.35, y: 3.85 }, fala: ["\"Ronaldo, brilha muito no Curintia! 🎶⚫⚪\"", "\"Desce mais uma rodada aqui pro torcedor!\"",
          "\"Bota na conta do aniversariante. Quem é o aniversariante?\""],
        visual: { pele: "#e0b48e", roupa: "#f2d21b", calca: "#1a1a1a", cabelo: "#111", estilo: "bone" } },
      // no camarote VIP: três sentados nos sofás, três em pé conversando
      // o Juan em 3D (trancado com a senha): anda de um lado para o outro no camarote, sempre no telefone; chegou perto, ele avisa
      { id: "juan", nome: "Juan", personagem: "juan", personagem3d: true, so3d: true, postura: "em_pe", x: 2.4, y: 3.9, dir: "baixo",
        vaiVem: { ate: { x: 5.4, y: 3.9 }, vel: 0.75, pausa: 2.2, ida: "andar_d", volta: "andar_e" },
        reage: { raio: 1.7, fala: "Peraí, peraí... tô fechando um terreno aqui! 📱" },
        falarDe: { x: 2.4, y: 4.65 }, fala: ["\"Peraí, peraí... tô fechando um terreno aqui! 📱\""],
        visual: { pele: "#d29a6e", roupa: "#4f6b2a", calca: "#22304a", cabelo: "#5a3a22", estilo: "curto" } },
      // o Jamil em 3D (trancado com a senha), em pé no VIP olhando o movimento (animação do modelo)
      { id: "jamil", nome: "Jamil", personagem: "jamil", personagem3d: true, pose3d: "olhar", postura: "em_pe", x: 2.5, y: 3.0, dir: "baixo",
        falarDe: { x: 2.5, y: 3.75 }, fala: ["\"Paz do Senhor.\""],
        visual: { pele: "#d6a27a", roupa: "#d9cfbd", calca: "#d9cfbd", cabelo: "#4a4a4a", estilo: "curto" } },
      // o Elcio de barman: atrás do balcão de bebidas
      { id: "elcio", nome: "Elcio", personagem: "elcio", postura: "em_pe", x: 19.1, y: 1.35, dir: "baixo",
        falarDe: { x: 19.15, y: 3.25 }, fala: ["\"O que vai ser hoje? A da casa é por minha conta... brincadeira, paga aí. 🍸\"", "\"Óculos escuros no bar? É o brilho das garrafas, irmão.\""],
        visual: { pele: "#c48d63", roupa: "#c48d63", calca: "#e0404a", cabelo: "#1c120c", estilo: "curto" } },
      { id: "gustavinho", nome: "Gustavinho", personagem: "gustavinho", personagem3d: true, postura: "em_pe", x: 3.6, y: 3.0, dir: "baixo",
        falarDe: { x: 3.6, y: 3.75 }, fala: ["\"She is the one?\""],
        visual: { pele: "#c48d63", roupa: "#111111", calca: "#2f5fb0", cabelo: "#2a1a10", estilo: "curto" } },
      // o Vibola em 3D (pixel art, trancado com a senha), fumando: fica parado e de vez em quando dá um trago
      { id: "vibola", nome: "Vibola", personagem: "vibola", personagem3d: true, postura: "em_pe", x: 4.6, y: 2.4, dir: "baixo",
        ciclo3d: [["parado", 4.5], ["fumar", 3.2]],
        falarDe: { x: 4.6, y: 3.2 }, fala: ["\"Tem alguma velha bolada por aí?\""],
        visual: { pele: "#b9825a", roupa: "#1a1a1a", calca: "#ececec", cabelo: "#2a1a10", estilo: "curto" } },
      // o Vini em 3D (trancado com a senha), dançando na pista com as meninas
      { id: "vini", nome: "Vini", personagem: "vini", personagem3d: true, pose3d: "dancar", postura: "em_pe", x: 11.6, y: 6.3, dir: "baixo",
        falarDe: { x: 11.6, y: 7.05 }, fala: ["\"Já mostrou o insta pra alguma gata? Mostra pra mim de novo.\"", "\"Aumenta esse som!\""],
        visual: { pele: "#c98f63", roupa: "#2b2b2b", calca: "#e79b8c", cabelo: "#2a1a10", estilo: "volume" } },
      // o Miltinho em 3D (trancado com a senha), de quimono rosa na pista: dança, treina boxe e solta um chute
      { id: "miltinho", nome: "Miltinho", personagem: "miltinho", personagem3d: true, so3d: true, postura: "em_pe", x: 14.1, y: 7.0, dir: "baixo",
        ciclo3d: [["parado", 3], ["dancar", 6], ["boxe", 4.4], ["parado", 2], ["chute", 2.5], ["dancar", 5]],
        falarDe: { x: 14.1, y: 7.75 }, fala: ["\"Quimono rosa, parceiro. Só quem pode, pode.\"", "\"Chega mais não, que eu tô aquecendo! 🥋\""] },
      // o Kaleb em 3D (trancado com a senha), de mochila no lounge perto da Clarissa: quando você chega perto, solta uns socos no ar
      { id: "kaleb", nome: "Kaleb", personagem: "kaleb", personagem3d: true, so3d: true, postura: "em_pe", x: 13.3, y: 14.2, dir: "baixo",
        reage: { raio: 2.2, pose: "soco", fala: "Ó SE EU QUISESSE!" },
        falarDe: { x: 13.3, y: 14.9 }, fala: ["\"Ó se eu quisesse...\"", "\"Tô só esperando o pessoal chegar.\""] },
      // o Thiago Mourão em 3D (trancado com a senha), dançando no camarote
      { id: "thiago", nome: "Thiago Mourão", personagem: "thiago", personagem3d: true, so3d: true, pose3d: "dancar", postura: "em_pe", x: 3.8, y: 5.3, dir: "baixo",
        reage: { raio: 1.8, fala: "Pode parecer que não, mas eu sou o rei daqui." },
        falarDe: { x: 3.8, y: 6.05 }, fala: ["\"Camarote é isso aqui, ó: só alegria!\"", "\"Solta o som, DJ!\""] },
      // o DJ em 3D (trancado com a senha), atrás da cabine: mãos nos pratos, cabeça no beat e, de vez em quando, a mão para o alto
      { id: "dj", nome: "DJ", personagem: "dj", personagem3d: true, so3d: true, postura: "em_pe", x: 11.0, y: 0.6, dir: "baixo",
        ciclo3d: [["parado", 8], ["hype", 2.4]],
        falarDe: { x: 11.0, y: 2.56 }, fala: ["\"Essa próxima é pra você! 🎧\"", "\"Mãozinha pro alto, pista!\""] },
      // o Mogli em 3D (trancado com a senha), dançando do lado da Bruna (a menina de rosa)
      { id: "mogli", nome: "Mogli", personagem: "mogli", personagem3d: true, so3d: true, pose3d: "dancar", postura: "em_pe", x: 21.5, y: 7.3, dir: "baixo",
        falarDe: { x: 21.5, y: 8.05 }, fala: ["\"Blazer na balada, parceiro. Classe não se perde.\"", "\"Já chamei a de rosa pra dançar, segura aí!\""] },
      // o Genival em 3D (trancado com a senha), dançando na pista
      { id: "genival", nome: "Genival", personagem: "genival", personagem3d: true, so3d: true, pose3d: "dancar", postura: "em_pe", x: 11.0, y: 9.6, dir: "baixo",
        voz: "assets/audio/amigos/genival_balada.mp3", // áudio dele (trancado), ao interagir
        falarDe: { x: 11.0, y: 10.3 }, fala: ["\"Essa é a minha música!\"", "\"Hoje eu só saio daqui quando acender a luz!\""] },
      // o Sapata em 3D (trancado com a senha), dançando na pista do lado do Genival
      { id: "sapata", nome: "Sapata", personagem: "sapata", personagem3d: true, so3d: true, pose3d: "dancar", postura: "em_pe", x: 12.5, y: 9.75, dir: "baixo",
        falarDe: { x: 12.5, y: 10.4 }, fala: ["\"Treino de perna hoje foi aqui na pista!\"", "\"Bora, Genival, mostra o passinho!\""] },
    ],

    destinos: [
      { nome: "Casa", descricao: "Voltar de carro para o prédio", url: "garagem.html?comodo=carro", ativo: true },
      { nome: "Padaria", descricao: "Café, pão na chapa e energia para mais uma noite", url: "padaria.html", ativo: true },
      { nome: "Casa do amigo", descricao: "Churrasco, cerveja gelada e piscina", url: "casa_amigo.html", ativo: true },
    ],

    pontos: [
      { nome: "entrada", x: 1.3, y: 14.9 },
      { nome: "guarda-volumes", x: 3.4, y: 9.7 },
      { nome: "camarote VIP", x: 3.5, y: 4.0 },
      { nome: "pista", x: 11.0, y: 6.0 },
      { nome: "palco do DJ", x: 11.0, y: 2.8 },
      { nome: "bar", x: 19.0, y: 4.0 },
      { nome: "banheiros", x: 24.7, y: 1.5 },
      { nome: "lounge", x: 9.8, y: 15.0 },
      { nome: "cabine de fotos", x: 24.9, y: 14.7 },
    ],
  };

  // ---- luzes da balada (só desenho; some no modo de teste)
  const efeitos = () => !(global.NSF && global.NSF.estado && global.NSF.estado.efeitos === false);
  // pista: quadrados de luz que mudam de cor no ritmo (124 bpm)
  PLANTA.aoDesenharPiso = (ctx, T, agora) => {
    if (!efeitos()) return;
    const batida = agora / (60000 / 124);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let x = 7; x < 15; x += 1) {
      for (let y = 2.4; y < 10.4; y += 1) {
        const k = Math.sin(x * 1.7 + y * 2.3 + Math.floor(batida) * 1.3);
        if (k < 0.35) continue;
        const hue = (Math.floor(batida / 4) * 70 + x * 25 + y * 40) % 360;
        ctx.fillStyle = `hsla(${hue}, 90%, 55%, ${0.25 * k})`;
        const p = [T(x + 0.05, y + 0.05, 0), T(x + 0.95, y + 0.05, 0), T(x + 0.95, y + 0.95, 0), T(x + 0.05, y + 0.95, 0)];
        ctx.beginPath(); p.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.fill();
      }
    }
    ctx.restore();
  };
  // DOR DE BARRIGA: no meio da balada (uma vez por noite, depois de um tempo andando por lá) ele reclama,
  // corre para o banheiro masculino, some lá dentro, toca a diarreia uns segundos e ele volta saindo pela porta.
  const PORTA_BANHEIRO = { x: 24.1, y: 0.55 };
  // "Enquanto isso, no banheiro...": quadro na tela com ele na privada fazendo força (3D em pixel art, 6 quadros)
  const PRIVADA = { folha: "assets/characters/personagem_v2/pixel/cenas/privada.webp", larg: 190, alt: 312, quadros: 6 };
  function quadroPrivada(ms) {
    if (typeof document === "undefined") return;
    if (!document.getElementById("privada-css")) {
      const st = document.createElement("style"); st.id = "privada-css";
      st.textContent = `
      .privada { position: fixed; left: 50%; top: 46%; z-index: 40; transform: translate(-50%, -50%) scale(.6); opacity: 0;
        width: min(340px, 78vw); padding: 10px 10px 8px; background: #12081d; border: 4px solid #ffd36b; border-radius: 10px;
        box-shadow: 0 0 0 3px #12081d, 0 0 0 6px #b0279a, 0 18px 40px rgba(0,0,0,.7); transition: transform .25s cubic-bezier(.2,1.5,.4,1), opacity .2s; }
      .privada.aberto { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      .privada canvas { display: block; width: 100%; image-rendering: pixelated; border-radius: 4px; }
      .privada p { margin: 6px 0 0; text-align: center; color: #ffe7a8; font: italic 700 15px system-ui, sans-serif; }
      .privada.treme canvas { animation: privada-treme .12s linear infinite; }
      @keyframes privada-treme { 25% { translate: -2px 1px; } 50% { translate: 2px -1px; } 75% { translate: -1px -1px; } }
      @media (prefers-reduced-motion: reduce) { .privada.treme canvas { animation: none; } }`;
      document.head.appendChild(st);
    }
    const caixa = document.createElement("div"); caixa.className = "privada treme"; caixa.setAttribute("role", "img");
    caixa.setAttribute("aria-label", "Ele no banheiro, na privada, fazendo força");
    const cv = document.createElement("canvas"); cv.width = 240; cv.height = 200;
    const leg = document.createElement("p"); leg.textContent = "Enquanto isso, no banheiro... 💩";
    caixa.append(cv, leg); document.body.appendChild(caixa);
    requestAnimationFrame(() => caixa.classList.add("aberto"));
    const g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
    const im = new Image(); im.src = PRIVADA.folha;
    const t0 = performance.now(), gotas = [];
    let vivo = true;
    function desenhar(agora) {
      if (!vivo) return;
      const t = (agora - t0) / 1000;
      // cabine: azulejo, rodapé e a divisória
      g.fillStyle = "#5d8fa8"; g.fillRect(0, 0, 240, 200);
      for (let y = 0; y < 150; y += 16) for (let x = (y / 16) % 2 ? -8 : 0; x < 240; x += 16) {
        g.fillStyle = (x + y) % 32 ? "#6fa3bb" : "#679bb3"; g.fillRect(x + 1, y + 1, 14, 14);
      }
      g.fillStyle = "#3d4b55"; g.fillRect(0, 150, 240, 50); g.fillStyle = "#4a5a66";
      for (let x = 0; x < 240; x += 24) g.fillRect(x, 150, 22, 50);
      g.fillStyle = "#8a6a4a"; g.fillRect(0, 0, 18, 200); g.fillRect(222, 0, 18, 200);
      g.fillStyle = "#e8e3d6"; g.fillRect(196, 70, 18, 22); g.fillStyle = "#cfc8b6"; g.fillRect(196, 88, 18, 4); // papel
      if (im.complete && im.naturalWidth) {
        const q = Math.floor(t * 8) % PRIVADA.quadros, e = 175 / PRIVADA.alt, w = PRIVADA.larg * e;
        g.drawImage(im, q * PRIVADA.larg, 0, PRIVADA.larg, PRIVADA.alt, 120 - w / 2 - 6, 196 - 175, w, 175);
      }
      // suor e linhas de "fedor"
      if (Math.random() < 0.08) gotas.push({ x: 92 + Math.random() * 40, y: 46, vy: 10 });
      g.fillStyle = "#bfefff";
      for (const d of gotas) { d.y += d.vy * 0.016; d.vy += 2.5; g.fillRect(d.x, d.y, 3, 4); }
      while (gotas.length && gotas[0].y > 120) gotas.shift();
      g.strokeStyle = "rgba(140,190,60,.85)"; g.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        const bx = 150 + k * 18, fase = t * 4 + k;
        g.beginPath();
        for (let y = 0; y <= 50; y += 5) g.lineTo(bx + Math.sin(fase + y / 9) * 5, 150 - y - ((t * 30 + k * 12) % 20));
        g.stroke();
      }
      requestAnimationFrame(desenhar);
    }
    requestAnimationFrame(desenhar);
    setTimeout(() => { caixa.classList.remove("aberto"); setTimeout(() => { vivo = false; caixa.remove(); }, 260); }, ms);
  }
  let barrigaFeita = false;
  function dorDeBarriga(api) {
    if (barrigaFeita || !api || !api.irPara) return;
    barrigaFeita = true;
    try { sessionStorage.setItem("nsf_balada_barriga", "1"); } catch (e) { /* ok */ }
    const j = api.jog, A = NSF.Audio;
    if (j.dancando) dancar(api, false);
    if (A && A.peido) A.peido();
    api.pensar("Ai... minha barriga... 😰 Aquele pão com ovo da padaria...", 2600);
    setTimeout(() => {
      api.falar("BANHEIRO! SAI DA FRENTE! 🏃💨", 3000);
      j.correndo = 2.5;
      api.irPara(PORTA_BANHEIRO.x, PORTA_BANHEIRO.y + 0.4, () => {
        j.correndo = 1;
        api.efeito.tipo = null;
        j.dir = "cima";
        j.oculto = true;            // entrou no banheiro
        if (A && A.diarreia) A.diarreia(5);
        quadroPrivada(5300);
        setTimeout(() => {
          j.oculto = false; j.dir = "baixo";
          j.x = PORTA_BANHEIRO.x; j.y = PORTA_BANHEIRO.y + 0.5;
          api.falar("Ufa... nem pergunta. 😅", 2600);
        }, 5600);
      });
    }, 2700);
  }
  // botão DANÇAR: ele dança onde estiver (a tira "dancar" do personagem 3D); andar ou sentar para a dança
  let bDancar = null;
  function dancar(api, sim) {
    const j = api && api.jog;
    if (!j) return;
    j.dancando = sim;
    if (sim) { j.pose = "dancar"; j.dir = "baixo"; } else if (j.pose === "dancar") j.pose = null;
    if (bDancar) { bDancar.textContent = sim ? "⏹ Parar" : "💃 Dançar"; bDancar.setAttribute("aria-pressed", String(sim)); }
  }
  PLANTA.aoIniciar = (api) => {
    if (bDancar || typeof document === "undefined") return;
    // a dor de barriga vem uma vez por noite, entre 1,5 e 3 minutos de balada (só quando ele não está fazendo nada)
    try { barrigaFeita = sessionStorage.getItem("nsf_balada_barriga") === "1"; } catch (e) { /* ok */ }
    const params = new URLSearchParams(location.search);
    const espera = params.has("barriga") ? 3000 : 90000 + Math.random() * 90000;
    const tentar = () => {
      if (barrigaFeita) return;
      const ocupado = (api.ocupado && api.ocupado()) || api.jog.oculto || (NSF.Paquera && NSF.Paquera.aberta()) || api.npcs.some((n) => n.cena);
      if (ocupado) { setTimeout(tentar, 5000); return; }
      dorDeBarriga(api);
    };
    if (!barrigaFeita || params.has("barriga")) { barrigaFeita = false; setTimeout(tentar, espera); }
    bDancar = document.createElement("button");
    bDancar.type = "button"; bDancar.id = "dancar";
    bDancar.addEventListener("click", (e) => { e.stopPropagation(); dancar(api, !api.jog.dancando); bDancar.blur(); });
    document.body.appendChild(bDancar);
    dancar(api, false);
  };
  // fachos de luz saindo do palco e varrendo a pista; globo espelhado no meio
  PLANTA.aoDesenhar = (ctx, T, agora) => {
    const api = typeof window !== "undefined" && window.NSF_APTO;
    if (api && api.jog && api.jog.dancando && (api.jog.andando || api.jog.sentado || api.jog.pose !== "dancar")) dancar(api, false);
    if (!efeitos()) return;
    const t = agora / 1000;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const fachos = [[8.4, "rgba(80,120,255,0.13)", 0], [10.2, "rgba(255,60,200,0.13)", 1.7], [11.8, "rgba(170,80,255,0.13)", 3.1], [13.6, "rgba(60,200,255,0.13)", 4.4]];
    for (const [x, cor, fase] of fachos) {
      const [ox, oy] = T(x, 0.3, PE_DIREITO - 0.1);
      const alvoX = 11 + Math.sin(t * 0.7 + fase) * 4, alvoY = 6 + Math.cos(t * 0.9 + fase) * 3.2;
      const [a1, b1] = T(alvoX - 0.6, alvoY, 0), [a2, b2] = T(alvoX + 0.6, alvoY, 0);
      ctx.fillStyle = cor;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(a1, b1); ctx.lineTo(a2, b2); ctx.closePath(); ctx.fill();
    }
    // globo
    const [gx, gy] = T(11, 6, PE_DIREITO - 0.3);
    const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, 22);
    g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(0.5, "rgba(190,200,255,0.6)"); g.addColorStop(1, "rgba(120,120,200,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, 22, 0, 7); ctx.fill();
    ctx.restore();
  };

  if (global.NSF) { global.NSF.PLANTA_BALADA = PLANTA; global.NSF.PLANTA_ATUAL = PLANTA; }
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
