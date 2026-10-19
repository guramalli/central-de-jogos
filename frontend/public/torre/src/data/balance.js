// Números da economia num lugar só, para balancear sem caçar constantes no código.
export const BAL = {
  startMoney: 30,

  // Aluguel-base de um andar no índice i: base × (1 + i/scale)^pow  (R$/s)
  rent: { base: 0.5, scale: 100, pow: 0.6 },
  // Preço de venda = aluguel-base × saleSecs × multiplicador do tipo
  saleSecs: 1200,

  // Material por andar: BRICKS × (1 + i/scale)^pow × eraMult^era
  // Acima de wallStart (m) o custo dobra a cada wallDouble (m): parede suave depois da última era.
  floorCost: { scale: 40, pow: 0.8, eraMult: 1.4, wallStart: 400000, wallDouble: 100000 },
  floorCostPrefab: { pow: 0.45, eraMult: 1.15 }, // nó-chave "Pré-fabricação total"

  // Turismo
  tourism: {
    demand: 0.05, demandPow: 0.55,  // visitantes/s = demand × altura(m)^demandPow
    ticket: 2, ticketPow: 0.5,      // ingresso = ticket × (altura/10)^ticketPow
    capPanoramic: 0.3, capHeli: 1,  // capacidade por nível
    spaceDemand: 0.002, spaceCap: 0.05, spaceTicketMult: 40,
  },

  // Banco: lim multiplica o limite de crédito, rate é juros por minuto
  bank: {
    tiers: [
      { n: 'Banco do bairro', lim: 1, rate: 0.04 },
      { n: 'Banco regional', lim: 2, rate: 0.025 },
      { n: 'Banco nacional', lim: 4, rate: 0.012 },
      { n: 'Mercado de títulos', lim: 8, rate: 0.005 },
    ],
    limitBase: 300, limitIncomeSecs: 300, // limite = lim × (limitBase + limitIncomeSecs × renda/s)
    payShare: 0.2,       // parcela automática: fração da renda que vai para a dívida
    defaultAt: 1.2,      // entra em renegociação quando dívida > limite × defaultAt; sai ao voltar ao limite
    renegRate: 0.5,      // renegociação: juros multiplicados por isto
    renegMinShare: 0.4,  // renegociação: retém pelo menos isto da renda…
    renegMaxShare: 0.6,  // …e nunca mais que isto
    renegMargin: 0.15,   // retenção ≥ juros + esta fração da renda (a dívida sempre cai)
  },

  // Pontos de Engenharia ganhos pela altura recorde: floor(mult × metros^pow)
  pe: { mult: 3, pow: 0.42 },
};
