// Planta do ELEVADOR do prédio: passagem obrigatória entre o apartamento (12º andar) e a garagem (G).
// elevador.html?descer=1 (saiu de casa) -> garagem ; elevador.html?subir=1 (chegou de carro) -> apartamento.
// A cena é automática: ele aparece, a porta fecha, o mostrador conta os andares e abre o quadrinho de opções
// (js/dialogos/elevador_acoes.js). Quando o elevador chega e o jogador fechou o quadrinho, ele sai.
(function (global) {
  "use strict";

  const PE_DIREITO = 2.6, CORTE_FRENTE = 0.35, ESP = 0.12;
  const URL_ATUAL = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams("");
  const SOBE = URL_ATUAL.has("subir");
  const ANDAR_CASA = 12;
  const VIAGEM_S = 6;   // tempo da viagem (o quadrinho fica aberto durante ela)

  const PLANTA = {
    id: "elevador",
    nome: "Elevador",
    largura: 2.4, profundidade: 2.2,
    peDireito: PE_DIREITO,
    texturaParede: "parede_elevador",
    inicio: { x: 1.2, y: 1.3, dir: "baixo" },

    comodos: [
      { nome: "Cabine", x0: 0, y0: 0, x1: 2.4, y1: 2.2, piso: "#3a3a40", piso2: "#424249", piso_arte: "piso_elevador" },
    ],
    caixas: [
      { nome: "", tipo: "parede", x0: -ESP, y0: -ESP, x1: 0, y1: 2.2, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 0, y0: -ESP, x1: 2.4, y1: 0, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 2.4, y0: -ESP, x1: 2.4 + ESP, y1: 2.2 + ESP, z1: CORTE_FRENTE },
      { nome: "", tipo: "parede", x0: -ESP, y0: 2.2, x1: 2.4, y1: 2.2 + ESP, z1: CORTE_FRENTE },
    ],
    naParede: [
      // porta da cabine (no fundo, à direita): só abre quando o elevador chega
      { nome: "Porta do elevador", tipo: "porta", plano: "y0", a: 0.55, b: 1.65, z0: 0, z1: 2.1, arte: "porta_cabine",
        saida: true, trancada: true,
        vai: SOBE ? { nome: "Apartamento", url: "apartamento.html?comodo=entrada" }
                  : { nome: "Garagem", url: "garagem.html?comodo=elevador" } },
      { nome: "Painel", tipo: "cardapio", plano: "y0", a: 1.8, b: 2.2, z0: 0.85, z1: 1.55, arte: "painel_elevador" },
      { nome: "Espelho", tipo: "espelho", plano: "x0", a: 0.45, b: 1.75, z0: 0.95, z1: 2.25 }, // desenhado pelo jogo
    ],
    pontos: [{ nome: "centro", x: 1.2, y: 1.3 }],
    roteiroDemo: ["centro"],

    // Mostrador acima da porta: andar atual e seta.
    viagem: { de: SOBE ? 0 : ANDAR_CASA, para: SOBE ? ANDAR_CASA : 0, inicio: null, segundos: VIAGEM_S },
    aoDesenhar(ctx, T, agora) {
      const v = PLANTA.viagem;
      const p = v.inicio == null ? 0 : Math.min(1, (agora - v.inicio) / (v.segundos * 1000));
      const andar = Math.round(v.de + (v.para - v.de) * p);
      const texto = (andar === 0 ? "G" : String(andar)) + (p > 0 && p < 1 ? (v.para > v.de ? " ▲" : " ▼") : "");
      const [x, y] = T(1.1, 0, 2.3);
      ctx.save();
      ctx.translate(x, y); ctx.transform(1, -0.5, 0, 1, 0, 0); // no plano da parede do fundo
      ctx.fillStyle = "#120a08"; ctx.fillRect(-34, -13, 68, 26);
      ctx.strokeStyle = "#6b6b70"; ctx.lineWidth = 2; ctx.strokeRect(-34, -13, 68, 26);
      ctx.fillStyle = "#ffb347"; ctx.shadowColor = "#ff8a1f"; ctx.shadowBlur = 8;
      ctx.font = "700 17px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(texto, 0, 1);
      ctx.restore();
    },

    // Roteiro da cena: espera ele aparecer, começa a viagem e abre o quadrinho; ao chegar (e com o quadrinho
    // fechado), destranca a porta e sai.
    aoIniciar(api, info) {
      const NSF = global.NSF;
      const porta = PLANTA.naParede[0];
      const comecar = () => {
        PLANTA.viagem.inicio = performance.now();
        const roteiro = NSF.DIALOGOS && NSF.DIALOGOS.elevador_acoes;
        let escolheu = !roteiro || !NSF.Ligacao, chegou = false;
        const talvezSair = () => {
          if (!escolheu || !chegou) return;
          porta.trancada = false;
          api.porta.aberta = true;
          setTimeout(() => api.sair(porta.vai), 500);
        };
        if (!escolheu) {
          const r = Object.assign({}, roteiro, { lugar: SOBE ? "subindo para o " + ANDAR_CASA + "º andar" : "descendo para a garagem" });
          setTimeout(() => NSF.Ligacao.atender(r, { aoTerminar: () => { escolheu = true; talvezSair(); } }), 600);
        }
        setTimeout(() => { chegou = true; talvezSair(); }, PLANTA.viagem.segundos * 1000);
      };
      // chegando pela porta: espera a cortina e o "clique" de aparecer (~2,4 s)
      setTimeout(comecar, info && info.chegando ? 2600 : 400);
    },
  };

  if (global.NSF) { global.NSF.PLANTA_ELEVADOR = PLANTA; global.NSF.PLANTA_ATUAL = PLANTA; }
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
