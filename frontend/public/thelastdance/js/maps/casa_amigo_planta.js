// Planta da CASA DO AMIGO: quintal do churrasco (área gourmet com churrasqueira, bancada e cervejeira; mesa grande;
// piscina com espreguiçadeiras). Chega de carro pelo portão. Base em blocos com os nomes das artes do kit do ChatGPT
// (kit_chatgpt/casa_amigo): enquanto a arte não chega, aparece em blocos.
// Unidade: metro. Muros do fundo: x = 0 (esquerda da tela, com o portão) e y = 0 (direita, a área gourmet).
(function (global) {
  "use strict";

  const LARG = 16, PROF = 12;
  const MURO = 2.4, CORTE_FRENTE = 0.35, ESP = 0.15;

  // banco comprido de madeira
  const banco = (x0, y0) => ({ nome: "Banco", tipo: "cadeira", x0, y0, x1: x0 + 3.0, y1: y0 + 0.35, z1: 0.45, arte: "banco_madeira" });
  const cadeira = (x0, y0, arte) => ({ nome: "Cadeira de plástico", tipo: "cadeira", x0, y0, x1: x0 + 0.45, y1: y0 + 0.45, z1: 0.9, arte });

  const PLANTA = {
    id: "casa_amigo",
    nome: "Casa do amigo",
    musica: "padaria",           // por enquanto a bossa; dá para ter um pagode próprio depois
    largura: LARG, profundidade: PROF,
    peDireito: MURO,
    texturaParede: "muro",
    inicio: { x: 0.9, y: 4.25, dir: "direita" },
    inicios: { portao: { x: 0.9, y: 4.25 } },
    inicioPadrao: "portao",
    roteiroDemo: ["churrasqueira", "cervejeira", "mesa", "piscina", "portão"],

    comodos: [
      { nome: "Gramado", x0: 0, y0: 4.6, x1: LARG, y1: PROF, piso: "#3f6b34", piso2: "#46753a", piso_arte: "grama" },
      { nome: "Área gourmet", x0: 4, y0: 0, x1: LARG, y1: 4.6, piso: "#8a6f58", piso2: "#94785f", piso_arte: "piso_gourmet" },
      { nome: "Entrada", x0: 0, y0: 0, x1: 4, y1: 4.6, piso: "#7d7d7d", piso2: "#868686", piso_arte: "piso_gourmet" },
    ],

    caixas: [
      // muros
      { nome: "", tipo: "parede", x0: -ESP, y0: -ESP, x1: 0, y1: PROF, z1: MURO, fundo: true },
      { nome: "", tipo: "parede", x0: 0, y0: -ESP, x1: LARG, y1: 0, z1: MURO, fundo: true },
      { nome: "", tipo: "parede", x0: LARG, y0: -ESP, x1: LARG + ESP, y1: PROF + ESP, z1: CORTE_FRENTE },
      { nome: "", tipo: "parede", x0: -ESP, y0: PROF, x1: LARG, y1: PROF + ESP, z1: CORTE_FRENTE },

      // área gourmet, encostada no muro do fundo
      { nome: "Churrasqueira", tipo: "movel", x0: 6.0, y0: 0, x1: 8.0, y1: 0.9, z1: 2.4, arte: "churrasqueira" },
      { nome: "Bancada com pia", tipo: "mesa", x0: 8.4, y0: 0, x1: 10.7, y1: 0.7, z1: 0.95, arte: "bancada_pia" },
      { nome: "Cervejeira", tipo: "armario", x0: 11.1, y0: 0, x1: 11.8, y1: 0.7, z1: 1.6, arte: "cervejeira" },
      { nome: "Caixa térmica", tipo: "baixo", x0: 12.3, y0: 0.15, x1: 12.9, y1: 0.55, z1: 0.45, arte: "caixa_termica" },

      // mesa grande com bancos dos dois lados
      { nome: "Mesa de madeira", tipo: "mesa", x0: 7.0, y0: 2.4, x1: 10.0, y1: 3.6, z1: 0.78, arte: "mesa_madeira" },
      banco(7.0, 1.85),
      banco(7.0, 4.15),

      // piscina e o deck dela
      { nome: "Piscina", tipo: "vidro", x0: 2.0, y0: 6.5, x1: 7.0, y1: 10.5, z1: 0.12, arte: "piscina" },
      { nome: "Espreguiçadeira", tipo: "sofa", x0: 7.8, y0: 6.6, x1: 8.45, y1: 8.4, z1: 0.8, arte: "espreguicadeira" },
      { nome: "Espreguiçadeira", tipo: "sofa", x0: 7.8, y0: 8.8, x1: 8.45, y1: 10.6, z1: 0.8, arte: "espreguicadeira" },
      { nome: "Guarda-sol", tipo: "luz", x0: 8.9, y0: 8.0, x1: 9.3, y1: 8.4, z1: 2.4, arte: "guarda_sol" },

      // mesinha de plástico perto do gramado
      { nome: "Mesa de plástico", tipo: "mesa", x0: 12.0, y0: 7.0, x1: 12.8, y1: 7.8, z1: 0.72, arte: "mesa_plastico" },
      cadeira(12.18, 6.45, "cadeira_plastico"),
      cadeira(11.45, 7.18, "cadeira_plastico_lado"),

      // árvore no canto do muro da esquerda
      { nome: "Árvore", tipo: "planta", x0: 0.3, y0: 10.6, x1: 1.3, y1: 11.6, z1: 3.2, arte: "arvore" }, // canto do muro: não tapa a vista
      { nome: "Vaso de planta", tipo: "planta", x0: 0.15, y0: 0.15, x1: 0.6, y1: 0.6, z1: 1.2, arte: "planta" },
    ],

    naParede: [
      // muro da esquerda (x = 0): o portão de saída
      { nome: "Portão", tipo: "porta", plano: "x0", a: 3.6, b: 4.9, z0: 0, z1: 2.2, saida: true, arte: "portao" },
      // muro do fundo (y = 0): varal de luzinhas sobre a área gourmet e a placa
      { nome: "Varal de luzes", tipo: "neon", plano: "y0", a: 5.5, b: 13.5, z0: 1.9, z1: 2.3, arte: "varal_luzes", texto: ["", ""] },
      { nome: "Placa", tipo: "quadro", plano: "y0", a: 1.0, b: 3.2, z0: 1.2, z1: 2.0, arte: "placa_churras" },
    ],

    // O portão leva para: (o churrasco é longe, então volta de carro para a garagem)
    destinos: [
      { nome: "Casa", descricao: "Voltar de carro para o prédio", url: "garagem.html?comodo=carro", ativo: true },
      { nome: "Padaria", descricao: "Café, pão na chapa e energia para mais uma noite", url: "padaria.html", ativo: true },
      { nome: "Balada", descricao: "Em breve", ativo: false },
    ],

    pontos: [
      { nome: "portão", x: 0.6, y: 4.25 },
      { nome: "churrasqueira", x: 7.0, y: 1.4 },
      { nome: "cervejeira", x: 11.45, y: 1.2 },
      { nome: "mesa", x: 8.5, y: 5.0 },
      { nome: "piscina", x: 7.5, y: 6.0 },
      { nome: "gramado", x: 12.4, y: 9.5 },
    ],
  };

  if (global.NSF) { global.NSF.PLANTA_CASA_AMIGO = PLANTA; global.NSF.PLANTA_ATUAL = PLANTA; }
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
