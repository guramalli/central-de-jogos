// Planta da CASA DO AMIGO: varanda gourmet de apartamento (baseada nas fotos de uma varanda real): ilha de mármore
// com banquetas, bancada da pia, torre da churrasqueira, nicho com cervejeira e geladeira, mesa redonda de madeira
// com cadeiras de corda azul, vasos grandes, parede de azulejo com arandelas, guarda-corpo de vidro com a cidade e
// as portas de vidro para a sala (saída). A caixa de som liga e desliga a música.
// Base em blocos com os nomes das artes do kit do ChatGPT (kit_chatgpt/casa_amigo).
// Unidade: metro. Paredes do fundo: x = 0 (esquerda da tela, o vidro com a cidade) e y = 0 (direita, a cozinha).
(function (global) {
  "use strict";

  const LARG = 12, PROF = 9;
  const PE_DIREITO = 2.7, CORTE_FRENTE = 0.35, ESP = 0.15;
  const cadeira = (x0, y0, arte) => ({ nome: "Cadeira de corda", tipo: "cadeira", x0, y0, x1: x0 + 0.6, y1: y0 + 0.6, z1: 0.85, arte });
  const banqueta = (x0) => ({ nome: "Banqueta", tipo: "cadeira", x0, y0: 3.05, x1: x0 + 0.45, y1: 3.5, z1: 1.0, arte: "banqueta_corda" });
  const vaso = (x0, y0) => ({ nome: "Vaso com planta", tipo: "planta", x0, y0, x1: x0 + 0.6, y1: y0 + 0.6, z1: 1.8, arte: "vaso_planta_grande" });

  const PLANTA = {
    id: "casa_amigo",
    nome: "Casa do amigo",
    musica: "padaria",
    largura: LARG, profundidade: PROF,
    peDireito: PE_DIREITO,
    texturaParede: "parede_varanda",
    inicio: { x: 8.8, y: 1.0, dir: "baixo" },
    inicios: { entrada: { x: 8.8, y: 1.0 } },
    inicioPadrao: "entrada",
    roteiroDemo: ["churrasqueira", "geladeiras", "mesa", "caixa de som", "vidro", "porta"],

    comodos: [
      { nome: "Varanda gourmet", x0: 0, y0: 0, x1: LARG, y1: PROF, piso: "#b9b5ad", piso2: "#c2beb6", piso_arte: "piso_porcelanato" },
    ],

    caixas: [
      // paredes
      { nome: "", tipo: "parede", x0: -ESP, y0: -ESP, x1: 0, y1: PROF, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 0, y0: -ESP, x1: LARG, y1: 0, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: LARG, y0: -ESP, x1: LARG + ESP, y1: PROF + ESP, z1: CORTE_FRENTE },
      { nome: "", tipo: "parede", x0: -ESP, y0: PROF, x1: LARG, y1: PROF + ESP, z1: CORTE_FRENTE },

      // cozinha na parede do fundo
      { nome: "Bancada da pia", tipo: "mesa", x0: 0.3, y0: 0, x1: 2.9, y1: 0.65, z1: 0.95, arte: "bancada_cozinha" },
      { nome: "Churrasqueira", tipo: "movel", x0: 3.0, y0: 0, x1: 4.5, y1: 0.8, z1: 2.4, arte: "churrasqueira_marmore" },
      { nome: "Cervejeira e geladeira", tipo: "armario", x0: 4.6, y0: 0, x1: 6.4, y1: 0.75, z1: 2.3, arte: "nicho_geladeiras" },
      vaso(11.1, 0.2),

      // ilha de mármore com as banquetas
      { nome: "Ilha", tipo: "movel", x0: 1.0, y0: 2.0, x1: 4.0, y1: 2.9, z1: 1.12, arte: "ilha_marmore" },
      banqueta(1.35), banqueta(2.3), banqueta(3.25),

      // mesa redonda com 6 cadeiras (cada lado com a cadeira virada para a mesa)
      { nome: "Mesa redonda", tipo: "mesa", x0: 6.5, y0: 4.2, x1: 8.1, y1: 5.8, z1: 0.76, redonda: true, arte: "mesa_redonda_madeira" },
      cadeira(6.6, 3.5, "cadeira_corda"), cadeira(7.4, 3.5, "cadeira_corda"),
      cadeira(6.6, 5.9, "cadeira_corda_sul"), cadeira(7.4, 5.9, "cadeira_corda_sul"),
      cadeira(5.8, 4.7, "cadeira_corda_lado"), cadeira(8.2, 4.7, "cadeira_corda_costas"),

      // caixa de som (toque: liga/desliga a música)
      { nome: "Caixa de som", tipo: "baixo", x0: 9.6, y0: 2.2, x1: 10.02, y1: 2.56, z1: 0.8, arte: "caixa_som",
        interacao: "caixa_som", falarDe: { x: 9.8, y: 3.05 } },

      // vasos na frente da parede de azulejo
      vaso(0.15, 6.0), vaso(0.15, 7.0), vaso(0.15, 8.1),
    ],

    naParede: [
      // parede do fundo (y = 0): portas de vidro para a sala (saída) e a TV
      { nome: "Portas de vidro", tipo: "vidro", plano: "y0", a: 7.0, b: 10.6, z0: 0, z1: 2.4, saida: true, arte: "porta_vidro_sala" },
      { nome: "TV", tipo: "tv", plano: "y0", a: 8.0, b: 9.6, z0: 1.5, z1: 2.4, arte: "tv_parede" },
      // parede da esquerda (x = 0): guarda-corpo de vidro com a cidade e a parede de azulejo com arandelas
      { nome: "Guarda-corpo de vidro", tipo: "vidro", plano: "x0", a: 0.4, b: 5.6, z0: 0, z1: 2.4, arte: "vidro_cidade" },
      { nome: "Parede de azulejo", tipo: "cimento", plano: "x0", a: 5.8, b: 8.9, z0: 0, z1: 2.4, arte: "parede_azulejo_luzes" },
    ],

    // A turma do churrasco. "personagem" = a arte modular (fica só na máquina por enquanto: rosto de pessoa real);
    // sem ela (no site), aparece o boneco provisório com as cores de "visual".
    npcs: [
      { id: "vibola", nome: "Vibola", personagem: "vibola", postura: "em_pe", x: 3.75, y: 1.15, dir: "baixo",
        falarDe: { x: 3.75, y: 1.75 }, fala: "\"Picanha no ponto! Ninguém encosta na minha grelha.\"",
        visual: { pele: "#b9825a", roupa: "#1a1a1a", calca: "#ececec", cabelo: "#2a1a10", estilo: "curto" } },
      { id: "gustavinho", nome: "Gustavinho", personagem: "gustavinho", postura: "em_pe", x: 2.75, y: 3.95, dir: "baixo",
        falarDe: { x: 2.75, y: 4.6 }, fala: "\"Fala, parceiro! Hoje a noite promete.\"",
        visual: { pele: "#c48d63", roupa: "#111111", calca: "#2f5fb0", cabelo: "#2a1a10", estilo: "curto" } },
      { id: "juan", nome: "Juan", personagem: "juan", postura: "sentado", x: 6.9, y: 3.8, dir: "baixo",
        falarDe: { x: 6.9, y: 3.05 }, fala: "\"Chegou o atrasado! Pega uma gelada aí na cervejeira.\"",
        visual: { pele: "#d29a6e", roupa: "#4f6b2a", calca: "#22304a", cabelo: "#5a3a22", estilo: "curto" } },
      { id: "vini", nome: "Vini", personagem: "vini", postura: "sentado", x: 8.5, y: 5.0, dir: "esquerda",
        falarDe: { x: 9.2, y: 5.0 }, fala: "\"Bota um pagode nessa caixa de som!\"",
        visual: { pele: "#c98f63", roupa: "#2b2b2b", calca: "#e79b8c", cabelo: "#2a1a10", estilo: "volume" } },
    ],

    // As portas de vidro levam para: (de volta ao carro, ou outro lugar)
    destinos: [
      { nome: "Casa", descricao: "Voltar de carro para o prédio", url: "garagem.html?comodo=carro", ativo: true },
      { nome: "Padaria", descricao: "Café, pão na chapa e energia para mais uma noite", url: "padaria.html", ativo: true },
      { nome: "Balada", descricao: "Em breve", ativo: false },
    ],

    pontos: [
      { nome: "porta", x: 8.8, y: 0.6 },
      { nome: "churrasqueira", x: 3.75, y: 1.75 },
      { nome: "geladeiras", x: 5.5, y: 1.3 },
      { nome: "mesa", x: 9.2, y: 6.9 },
      { nome: "caixa de som", x: 9.8, y: 3.05 },
      { nome: "vidro", x: 0.7, y: 4.2 },
    ],
  };

  if (global.NSF) { global.NSF.PLANTA_CASA_AMIGO = PLANTA; global.NSF.PLANTA_ATUAL = PLANTA; }
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
