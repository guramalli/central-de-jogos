// Planta da PADARIA (base em blocos, para aprovação — mesma etapa que o apartamento teve antes da arte).
// Referência: painel "Padaria pós-balada" do moodboard (reference/kit_v1.0/02_mapas/moodboard_locais.png):
// balcão com vitrine, chapa, máquina de café, caixa, mesinhas, banheiro, letreiro neon "PADARIA".
// Maior que o apartamento: o salão tem gente (garçom, mesa das meninas, mesa dos homens) para as interações.
// Unidade: metro. Paredes do fundo: x = 0 (esquerda da tela) e y = 0 (direita); as da frente são cortadas baixas.
(function (global) {
  "use strict";

  const LARG = 14, PROF = 10;
  const PE_DIREITO = 3.0;
  const CORTE_FRENTE = 0.35;
  const ESP = 0.15;

  // Mesa com cadeiras em volta: lados "n"/"n1" (fundo: quem senta olha para a câmera), "o" (esquerda), "l" (direita).
  // Arte: mesa_bistro (0,7 × 0,7) ou mesa_grande; a cadeira de cada lado olha para a mesa.
  const ARTE_CADEIRA = { n: "cadeira_bistro", n1: "cadeira_bistro", o: "cadeira_bistro_lado", l: "cadeira_bistro_costas" };
  function mesa(nome, x0, y0, x1, y1, lados) {
    const out = [{ nome, tipo: "mesa", x0, y0, x1, y1, z1: 0.75, arte: x1 - x0 > 0.8 ? "mesa_grande" : "mesa_bistro" }];
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, L = 0.45, G = 0.1;
    for (const l of lados) {
      const cad = (a, b, c, d) => ({ nome: "Cadeira", tipo: "cadeira", x0: a, y0: b, x1: c, y1: d, z1: 0.9, arte: ARTE_CADEIRA[l] });
      if (l === "n") out.push(cad(x0 + 0.05, y0 - G - L, x0 + 0.05 + L, y0 - G), cad(x1 - 0.05 - L, y0 - G - L, x1 - 0.05, y0 - G));
      if (l === "n1") out.push(cad(cx - L / 2, y0 - G - L, cx + L / 2, y0 - G));
      if (l === "o") out.push(cad(x0 - G - L, cy - L / 2, x0 - G, cy + L / 2));
      if (l === "l") out.push(cad(x1 + G, cy - L / 2, x1 + G + L, cy + L / 2));
    }
    return out;
  }

  const PLANTA = {
    id: "padaria",
    nome: "Padaria",
    largura: LARG, profundidade: PROF,
    peDireito: PE_DIREITO,
    texturaParede: "parede_padaria",     // azulejo embaixo, pintura em cima (enquanto não existe: paredes em bloco)
    inicio: { x: 0.9, y: 8.2, dir: "baixo" },
    inicios: { entrada: { x: 0.9, y: 8.2 } },
    roteiroDemo: ["frente do balcão", "garçom", "mesa das meninas", "mesa dos homens", "banheiro", "porta da rua"],

    comodos: [
      { nome: "Salão", x0: 0, y0: 1.6, x1: LARG, y1: PROF, piso: "#7b6a58", piso2: "#857261", piso_arte: "piso_padaria" },
      { nome: "Atrás do balcão", x0: 0, y0: 0, x1: 11, y1: 1.6, piso: "#5d5048", piso2: "#665850", piso_arte: "piso_padaria" },
      { nome: "Corredor do banheiro", x0: 11, y0: 0, x1: LARG, y1: 1.6, piso: "#7b6a58", piso2: "#857261", piso_arte: "piso_padaria" },
    ],

    caixas: [
      // paredes
      { nome: "", tipo: "parede", x0: -ESP, y0: -ESP, x1: 0, y1: PROF, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 0, y0: -ESP, x1: LARG, y1: 0, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: LARG, y0: -ESP, x1: LARG + ESP, y1: PROF + ESP, z1: CORTE_FRENTE },
      { nome: "", tipo: "parede", x0: -ESP, y0: PROF, x1: LARG, y1: PROF + ESP, z1: CORTE_FRENTE },

      // atrás do balcão (área dos funcionários)
      { nome: "Máquina de café", tipo: "movel", x0: 1.0, y0: 0, x1: 1.9, y1: 0.55, z1: 1.45, arte: "maquina_cafe" },
      { nome: "Chapa", tipo: "mesa", x0: 3.6, y0: 0, x1: 5.0, y1: 0.6, z1: 0.95, arte: "chapa" },
      { nome: "Estufa de salgados", tipo: "luz", x0: 5.75, y0: 0, x1: 6.65, y1: 0.55, z1: 1.3, arte: "estufa_salgados" },
      { nome: "Forno de pão", tipo: "armario", x0: 7.4, y0: 0, x1: 8.6, y1: 0.7, z1: 1.7, arte: "forno_pao" },

      // balcão com vitrine + banquetas; passagem do garçom entre a vitrine e o caixa.
      // Balcão e vitrine em módulos de 1,3 m: a mesma arte repetida lado a lado.
      ...[0.8, 2.1, 3.4, 4.7].map((x) => ({ nome: "Balcão", tipo: "movel", x0: x, y0: 1.6, x1: x + 1.3, y1: 2.2, z1: 1.05, arte: "balcao_modulo" })),
      ...[6.0, 7.3].map((x) => ({ nome: "Vitrine de doces", tipo: "vidro", x0: x, y0: 1.6, x1: x + 1.3, y1: 2.2, z1: 1.3, arte: "vitrine_doces" })),
      ...[1.3, 2.4, 3.5, 4.6].map((x) => ({ nome: "Banqueta", tipo: "cadeira", x0: x, y0: 2.5, x1: x + 0.4, y1: 2.9, z1: 0.75, arte: "banqueta" })),
      { nome: "Caixa", tipo: "mesa", x0: 9.4, y0: 1.6, x1: 10.8, y1: 2.3, z1: 1.05, arte: "caixa_registradora" },

      // geladeira de bebidas na parede da esquerda
      { nome: "Geladeira de bebidas", tipo: "armario", x0: 0, y0: 3.0, x1: 0.7, y1: 4.4, z1: 2.0, arte: "geladeira_bebidas" },

      // mesas do salão
      ...mesa("Mesa das meninas", 5.2, 4.6, 6.4, 5.6, ["n", "o", "l"]),
      ...mesa("Mesa dos homens", 9.6, 5.6, 10.8, 6.6, ["n", "o", "l"]),
      ...mesa("Mesa", 2.4, 6.0, 3.1, 6.7, ["o", "l"]),
      ...mesa("Mesa", 6.4, 8.0, 7.1, 8.7, ["o", "l"]),
      ...mesa("Mesa do canto", 12.2, 8.2, 12.9, 8.9, ["n1", "o"]),

      // detalhes
      { nome: "Lixeira", tipo: "baixo", x0: 0.15, y0: 2.4, x1: 0.5, y1: 2.75, z1: 0.6, arte: "lixeira" },
      { nome: "Vaso de planta", tipo: "planta", x0: 13.4, y0: 2.0, x1: 13.85, y1: 2.45, z1: 1.2, arte: "planta" },   // mesma arte do apartamento
      { nome: "Vaso de planta", tipo: "planta", x0: 13.4, y0: 9.4, x1: 13.85, y1: 9.85, z1: 1.2, arte: "planta" },
    ],

    naParede: [
      // parede do fundo (y = 0): azulejo atrás do balcão, prateleira de pães, cardápio, letreiro, banheiro
      { nome: "Azulejo", tipo: "azulejo", plano: "y0", a: 0, b: 11, z0: 0, z1: 1.4, soSemTextura: true }, // a textura da parede já tem azulejo
      { nome: "Prateleira de pães", tipo: "prateleira", plano: "y0", a: 2.1, b: 3.5, z0: 1.6, z1: 2.4, arte: "prateleira_paes" },
      { nome: "Cardápio", tipo: "cardapio", plano: "y0", a: 4.0, b: 5.4, z0: 1.7, z1: 2.6, arte: "cardapio_padaria" },
      { nome: "Letreiro \"PADARIA\"", tipo: "neon", plano: "y0", a: 7.6, b: 9.6, z0: 2.0, z1: 2.7, texto: ["PADARIA", "24H"], arte: "neon_padaria" },
      { nome: "Banheiro", tipo: "porta", plano: "y0", a: 12.1, b: 13.4, z0: 0, z1: 2.2, arte: "porta_banheiro" }, // largura perto da proporção da arte
      // parede da esquerda (x = 0): vitrine para a rua e a porta de saída
      { nome: "Vitrine para a rua", tipo: "vidro", plano: "x0", a: 5.2, b: 7.0, z0: 0.9, z1: 2.4, arte: "vitrine_rua" },
      { nome: "Porta da rua", tipo: "porta", plano: "x0", a: 7.6, b: 8.8, z0: 0, z1: 2.3, saida: true, arte: "porta_rua" },
    ],

    // Gente na padaria (bonecos provisórios até a arte). sentado: (x, y) é o centro da cadeira.
    // dir: para onde olha na tela (baixo = para a câmera). falarDe: onde o protagonista fica para conversar.
    // dialogo: roteiro em js/dialogos/ (toque abre a conversa);
    // sem dialogo, o toque mostra "fala" num balão. visual: cores e cabelo do boneco provisório.
    npcs: [
      { id: "garcom", nome: "Seu Zé, o garçom", postura: "em_pe", x: 9.0, y: 3.3, dir: "baixo", falarDe: { x: 9.5, y: 4.0 }, dialogo: "garcom_padaria",
        visual: { pele: "#b9825a", roupa: "#f1f1ee", calca: "#1d1d22", cabelo: "#cfcfcf", estilo: "curto", avental: "#7a1f2e" } },

      // mesa das meninas: duas no fundo (de frente para a câmera), uma na ponta; uma cadeira vazia
      { id: "menina_vestido", nome: "Menina de vestido vermelho", postura: "sentado", x: 5.475, y: 4.275, dir: "baixo", falarDe: { x: 5.8, y: 6.05 },
        dialogo: "menina_padaria",
        visual: { pele: "#e2b08a", roupa: "#c8233d", calca: "#c8233d", cabelo: "#2b1a12", estilo: "longo" } },
      { id: "menina_loira", nome: "Menina loira", postura: "sentado", x: 6.125, y: 4.275, dir: "baixo", falarDe: { x: 6.2, y: 6.05 },
        fala: "Ela ri de alguma coisa no celular e nem te nota.",
        visual: { pele: "#f0c8a6", roupa: "#f3d3e6", calca: "#3b4a8a", cabelo: "#e6c46a", estilo: "longo" } },
      { id: "menina_cacheada", nome: "Menina de cabelo cacheado", postura: "sentado", x: 4.875, y: 5.1, dir: "direita", falarDe: { x: 4.9, y: 5.9 },
        fala: "\"Amiga, olha quem chegou...\"",
        visual: { pele: "#8d5a3b", roupa: "#2c2c34", calca: "#2c2c34", cabelo: "#1c120c", estilo: "volume" } },

      // mesa dos homens
      { id: "homem_bone", nome: "Cara de boné", postura: "sentado", x: 9.875, y: 5.275, dir: "baixo", falarDe: { x: 10.0, y: 7.05 },
        fala: "\"Aí, esse aí não é o da balada de ontem?\"",
        visual: { pele: "#c48d63", roupa: "#2f6b3a", calca: "#2a2f3a", cabelo: "#111", estilo: "bone" } },
      { id: "homem_camisa", nome: "Cara de camisa social", postura: "sentado", x: 10.525, y: 5.275, dir: "baixo", falarDe: { x: 10.5, y: 7.05 },
        fala: "Ele finge que não te viu.",
        visual: { pele: "#e0b48e", roupa: "#9fb7d8", calca: "#2a2f3a", cabelo: "#5a3a22", estilo: "curto" } },
      { id: "homem_barba", nome: "Barbudo", postura: "sentado", x: 11.125, y: 6.1, dir: "esquerda", falarDe: { x: 11.2, y: 6.85 },
        fala: "\"Fala, parceiro. Noite boa?\"",
        visual: { pele: "#a86f4a", roupa: "#444", calca: "#2a2f3a", cabelo: "#2a1a10", estilo: "careca_barba" } },

      // mesa do canto
      { id: "senhor_jornal", nome: "Senhor do jornal", postura: "sentado", x: 12.55, y: 7.875, dir: "baixo", falarDe: { x: 12.55, y: 9.4 },
        fala: "\"Na minha época, a gente dormia de noite.\"",
        visual: { pele: "#d2a07c", roupa: "#7d6a4f", calca: "#3a3328", cabelo: "#e8e8e8", estilo: "curto" } },
    ],

    // Para onde a porta da rua leva (menu ao sair).
    destinos: [
      { nome: "Casa", descricao: "Voltar para o apartamento", url: "apartamento.html?comodo=entrada", ativo: true },
      { nome: "Balada", descricao: "Em breve", ativo: false },
    ],

    pontos: [
      { nome: "porta da rua", x: 0.6, y: 8.2 },
      { nome: "frente do balcão", x: 3.0, y: 3.4 },
      { nome: "caixa", x: 10.1, y: 2.8 },
      { nome: "garçom", x: 8.2, y: 3.6 },
      { nome: "mesa das meninas", x: 5.8, y: 6.1 },
      { nome: "mesa dos homens", x: 10.2, y: 7.1 },
      { nome: "mesa do canto", x: 12.5, y: 9.4 },
      { nome: "geladeira", x: 1.1, y: 3.7 },
      { nome: "banheiro", x: 12.8, y: 0.6 },
    ],
  };

  // Quem está de pé também ocupa lugar no chão (colisão), sem desenho de caixa.
  for (const n of PLANTA.npcs) {
    if (n.postura === "em_pe") {
      PLANTA.caixas.push({ nome: n.nome, tipo: "npc", oculto: true, x0: n.x - 0.2, y0: n.y - 0.2, x1: n.x + 0.2, y1: n.y + 0.2, z1: 1.7 });
    }
  }

  if (global.NSF) { global.NSF.PLANTA_PADARIA = PLANTA; global.NSF.PLANTA_ATUAL = PLANTA; }
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
