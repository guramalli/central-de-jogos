// Planta do APARTAMENTO do protagonista (FASE 4, esquema em blocos — ainda sem arte).
// Unidade: metro. Eixo x vai para baixo-direita na tela, y para baixo-esquerda; z para cima.
// As paredes do fundo ficam em x = 0 (esquerda da tela) e y = 0 (direita); as da frente são cortadas baixas.
// Fontes: sala = vídeo do cômodo (descrição em docs/inventario_assets.md, seção 7); quarto = painel
// "Apartamento" do moodboard. Medidas são PROPORÇÕES de jogo, não medidas reais (o vídeo não permite medir).
(function (global) {
  "use strict";

  const PE_DIREITO = 2.7;     // altura das paredes do fundo
  const CORTE_FRENTE = 0.35;  // paredes da frente, cortadas baixas para ver o interior
  const CORTE_MEIO = 1.0;     // parede entre sala e quarto, cortada (vira transparente na FASE 5)
  const ESP = 0.15;           // espessura das paredes

  const PLANTA = {
    nome: "Apartamento",
    largura: 10, profundidade: 7,      // x: 0..10, y: 0..7
    peDireito: PE_DIREITO,
    inicio: { x: 4.5, y: 1.0, dir: "baixo" }, // logo depois de entrar pela porta

    comodos: [
      { nome: "Sala", x0: 0, y0: 0, x1: 6, y1: 7, piso: "#3b3640", piso2: "#433d49", piso_arte: "piso_sala" },
      { nome: "Quarto", x0: 6, y0: 0, x1: 10, y1: 7, piso: "#4a3a33", piso2: "#523f37", piso_arte: "piso_madeira" },
    ],

    // Caixas sólidas (colisão + desenho). tipo define a cor do bloco.
    caixas: [
      // paredes do fundo (altas) e da frente (cortadas)
      { nome: "", tipo: "parede", x0: -ESP, y0: -ESP, x1: 0, y1: 7, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 0, y0: -ESP, x1: 4.0, y1: 0, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 5.0, y0: -ESP, x1: 10, y1: 0, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 10, y0: -ESP, x1: 10 + ESP, y1: 7 + ESP, z1: CORTE_FRENTE },
      { nome: "", tipo: "parede", x0: -ESP, y0: 7, x1: 10, y1: 7 + ESP, z1: CORTE_FRENTE },
      // parede entre sala e quarto, com vão de porta em y 2.6..3.6
      { nome: "", tipo: "parede", x0: 6, y0: 0, x1: 6 + ESP, y1: 2.6, z1: CORTE_MEIO },
      { nome: "", tipo: "parede", x0: 6, y0: 3.6, x1: 6 + ESP, y1: 7, z1: CORTE_MEIO },

      // SALA (do vídeo)
      { nome: "Rack + TV", tipo: "movel", x0: 0, y0: 1.2, x1: 0.45, y1: 3.4, z1: 0.5, arte: "rack" },
      { nome: "Sofá cinza", tipo: "sofa", x0: 2.4, y0: 1.0, x1: 3.3, y1: 3.6, z1: 0.8, arte: "sofa" },
      { nome: "Mesa lateral", tipo: "movel", x0: 2.45, y0: 0.45, x1: 2.95, y1: 0.95, z1: 0.5, arte: "mesa_lateral" },
      { nome: "Mesa redonda", tipo: "mesa", x0: 3.6, y0: 4.6, x1: 4.7, y1: 5.7, z1: 0.75, redonda: true, arte: "mesa_redonda" },
      { nome: "Cadeira", tipo: "cadeira", x0: 3.0, y0: 4.85, x1: 3.5, y1: 5.45, z1: 0.9, arte: "poltrona" },
      { nome: "Cadeira", tipo: "cadeira", x0: 4.85, y0: 4.85, x1: 5.35, y1: 5.45, z1: 0.9, arte: "poltrona" },
      { nome: "Cadeira", tipo: "cadeira", x0: 3.85, y0: 5.85, x1: 4.45, y1: 6.35, z1: 0.9, arte: "poltrona" },
      { nome: "Aparador", tipo: "movel", x0: 0.5, y0: 0, x1: 2.0, y1: 0.45, z1: 0.85, arte: "aparador" },
      { nome: "Luminária", tipo: "luz", x0: 0.3, y0: 3.75, x1: 0.6, y1: 4.05, z1: 1.6, arte: "luminaria" },
      { nome: "Planta", tipo: "planta", x0: 5.3, y0: 0.2, x1: 5.8, y1: 0.7, z1: 1.5, arte: "planta" },

      // QUARTO (do moodboard)
      // armário no fundo: alto na frente da câmera taparia a sala
      { nome: "Armário", tipo: "armario", x0: 6.15, y0: 0, x1: 7.05, y1: 0.6, z1: 2.1, arte: "armario" },
      { nome: "Cama", tipo: "cama", x0: 7.35, y0: 0, x1: 9.25, y1: 2.1, z1: 0.55, arte: "cama" },
      { nome: "Criado-mudo", tipo: "movel", x0: 9.35, y0: 0, x1: 9.85, y1: 0.45, z1: 0.55, arte: "criado_mudo" },
      { nome: "Mesa + computador", tipo: "mesa", x0: 9.3, y0: 3.6, x1: 10, y1: 5.2, z1: 0.75, arte: "mesa_computador" },
      { nome: "Cadeira", tipo: "cadeira", x0: 8.6, y0: 4.15, x1: 9.1, y1: 4.65, z1: 0.9, arte: "cadeira" },
      { nome: "Roupas no chão", tipo: "baixo", x0: 7.6, y0: 3.0, x1: 8.4, y1: 3.6, z1: 0.08, passavel: true, arte: "roupas_chao" },
      { nome: "Planta", tipo: "planta", x0: 9.4, y0: 6.3, x1: 9.85, y1: 6.75, z1: 1.2, arte: "planta" },
    ],

    // Coisas na parede (sem colisão): plano "x0" = parede da esquerda (x = 0), "y0" = da direita (y = 0).
    // a..b = trecho ao longo da parede; z0..z1 = altura.
    naParede: [
      { nome: "Ripado de madeira", tipo: "ripado", plano: "x0", a: 1.0, b: 3.6, z0: 0, z1: 2.7, arte: "ripado" },
      { nome: "TV", tipo: "tv", plano: "x0", a: 1.5, b: 3.1, z0: 1.0, z1: 1.92, arte: "tv" },
      { nome: "Porta de vidro (varanda)", tipo: "vidro", plano: "x0", a: 4.4, b: 6.6, z0: 0, z1: 2.3, arte: "porta_vidro" },
      { nome: "Parede cimentícia", tipo: "cimento", plano: "y0", a: 0, b: 2.8, z0: 0, z1: 2.7, arte: "cimento" },
      { nome: "Fita de LED", tipo: "led", plano: "y0", a: 2.35, b: 2.45, z0: 0.2, z1: 2.5 },
      { nome: "Parede vermelha", tipo: "vermelha", plano: "y0", a: 2.8, b: 6.0, z0: 0, z1: 2.7, arte: "parede_vermelha" },
      { nome: "Porta de entrada", tipo: "porta", plano: "y0", a: 4.0, b: 5.0, z0: 0, z1: 2.15, saida: true, arte: "porta_entrada" },
      { nome: "Quadro pop-art", tipo: "quadro", plano: "y0", a: 3.05, b: 3.65, z0: 1.15, z1: 2.03, arte: "quadro_popart" },
      { nome: "Neon \"Mais uma noite?\"", tipo: "neon", plano: "y0", a: 7.5, b: 9.1, z0: 1.4, z1: 2.2, arte: "neon" },
      { nome: "Janela", tipo: "vidro", plano: "y0", a: 9.3, b: 9.95, z0: 0.95, z1: 2.25, arte: "janela" },
    ],

    // Pontos de interesse (FASE 6 vai usar para interação); aqui servem para testar se tudo é alcançável.
    pontos: [
      { nome: "porta de entrada", x: 4.5, y: 0.5 },
      { nome: "frente do sofá", x: 1.6, y: 2.3 },
      { nome: "mesa redonda", x: 4.2, y: 4.2 },
      { nome: "varanda (porta de vidro)", x: 0.5, y: 5.5 },
      { nome: "aparador", x: 1.2, y: 0.8 },
      { nome: "lado da cama", x: 8.0, y: 2.6 },
      { nome: "mesa do computador", x: 8.9, y: 5.0 },
      { nome: "armário", x: 6.6, y: 1.1 },
    ],
  };

  if (global.NSF) global.NSF.PLANTA_APARTAMENTO = PLANTA;
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
