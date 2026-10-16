// Planta da GARAGEM do prédio (subsolo). Sair de casa: apartamento -> elevador -> garagem -> anda até o carro ->
// toca no carro -> menu "Para onde você vai?". Voltar: destino -> garagem (ao lado do carro) -> porta do elevador.
// Base em blocos com os nomes das artes do kit do ChatGPT (kit_chatgpt/garagem): sem arte, aparece em blocos.
// Unidade: metro. Paredes do fundo: x = 0 (esquerda da tela, com o elevador) e y = 0 (direita, as vagas).
(function (global) {
  "use strict";

  const LARG = 16, PROF = 12;
  const PE_DIREITO = 3.0, CORTE_FRENTE = 0.35, ESP = 0.15;
  const BRANCO = "rgba(232,232,222,0.8)", AMARELO = "rgba(240,196,40,0.85)";

  // Faixas pintadas no chão: divisórias das vagas, linha tracejada da pista e a zebra na frente do elevador.
  const faixas = [];
  for (const x of [1.5, 3.9, 6.3, 8.7, 11.1, 13.5]) faixas.push({ x0: x - 0.05, y0: 0, x1: x + 0.05, y1: 5.3, cor: BRANCO });
  for (let x = 2.0; x < 15.5; x += 1.8) faixas.push({ x0: x, y0: 7.95, x1: x + 1.0, y1: 8.08, cor: AMARELO });
  for (let k = 0; k < 5; k++) faixas.push({ x0: 0.35 + k * 0.36, y0: 6.3, x1: 0.53 + k * 0.36, y1: 7.9, cor: BRANCO });

  const PLANTA = {
    id: "garagem",
    nome: "Garagem",
    musica: "garagem",
    largura: LARG, profundidade: PROF,
    peDireito: PE_DIREITO,
    texturaParede: "parede_garagem",
    inicio: { x: 1.1, y: 7.1, dir: "baixo" },
    inicios: { elevador: { x: 1.1, y: 7.1 }, carro: { x: 7.0, y: 5.5 } },  // carro: chegou de carro, na frente dele
    inicioPadrao: "elevador",
    roteiroDemo: ["carro", "pilar", "saída", "elevador"],
    faixas,

    comodos: [
      { nome: "Garagem", x0: 0, y0: 0, x1: LARG, y1: PROF, piso: "#3d3d42", piso2: "#45454a", piso_arte: "piso_garagem" },
    ],

    caixas: [
      // paredes
      { nome: "", tipo: "parede", x0: -ESP, y0: -ESP, x1: 0, y1: PROF, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 0, y0: -ESP, x1: LARG, y1: 0, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: LARG, y0: -ESP, x1: LARG + ESP, y1: PROF + ESP, z1: CORTE_FRENTE },
      { nome: "", tipo: "parede", x0: -ESP, y0: PROF, x1: LARG, y1: PROF + ESP, z1: CORTE_FRENTE },

      // carros estacionados de ré (frente para +y). O dele abre o menu de destinos.
      { nome: "Hatch vermelho", tipo: "sofa", x0: 1.9, y0: 0.4, x1: 3.65, y1: 4.4, z1: 1.5, arte: "carro_hatch" },
      { nome: "Carro dele (cinza)", tipo: "movel", x0: 6.55, y0: 0.3, x1: 8.4, y1: 4.8, z1: 1.6, arte: "carro_x1",
        destinos: true, falarDe: { x: 7.3, y: 5.35 } },   // na frente do carro (o lado do motorista fica escondido na câmera)
      { nome: "Sedã preto", tipo: "mesa", x0: 9.05, y0: 0.3, x1: 10.9, y1: 5.1, z1: 1.45, arte: "carro_sedan" },

      // pilares
      { nome: "Pilar", tipo: "parede", x0: 3.6, y0: 5.4, x1: 4.2, y1: 6.0, z1: 2.6, arte: "pilar" },
      { nome: "Pilar", tipo: "parede", x0: 11.0, y0: 5.5, x1: 11.6, y1: 6.1, z1: 2.6, arte: "pilar" }, // longe da frente do carro dele
      { nome: "Pilar", tipo: "parede", x0: 13.2, y0: 5.4, x1: 13.8, y1: 6.0, z1: 2.6, arte: "pilar" },
    ],

    naParede: [
      // elevador na parede da esquerda (x = 0): leva de volta para casa
      { nome: "Elevador", tipo: "porta", plano: "x0", a: 6.4, b: 7.8, z0: 0, z1: 2.3, arte: "porta_elevador_garagem",
        saida: true, vai: { nome: "Elevador", url: "elevador.html?subir=1" } },
      { nome: "Extintor", tipo: "quadro", plano: "x0", a: 4.6, b: 5.0, z0: 0.8, z1: 1.6, arte: "extintor" },
      // placa de saída para a rampa (fundo, à direita)
      { nome: "Placa SAÍDA", tipo: "neon", plano: "y0", a: 14.0, b: 15.4, z0: 2.0, z1: 2.5, arte: "placa_saida", texto: ["SAÍDA", ""] },
    ],

    // O carro leva para: (mesmos lugares de antes; a padaria volta para cá)
    destinos: [
      { nome: "Padaria", descricao: "Café, pão na chapa e energia para mais uma noite", url: "padaria.html", ativo: true },
      { nome: "Balada", descricao: "Em breve", ativo: false },
      { nome: "Casa do amigo", descricao: "Churrasco, cerveja gelada e piscina", url: "casa_amigo.html", ativo: true },
    ],

    pontos: [
      { nome: "elevador", x: 0.6, y: 7.1 },
      { nome: "carro", x: 7.3, y: 5.35 },
      { nome: "pilar", x: 9.6, y: 6.6 },
      { nome: "saída", x: 14.7, y: 7.5 },
    ],
  };

  if (global.NSF) { global.NSF.PLANTA_GARAGEM = PLANTA; global.NSF.PLANTA_ATUAL = PLANTA; }
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
