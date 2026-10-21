// Modo com risco: prêmios de fim de ano (1 de 3, sorteados). Só lado bom, valem até a torre cair e se acumulam.
// st/mul: multiplica um estágio da obra (prod, tran, lay, rent, cost, regen, warn); repetidos somam (1 + Σ(mul − 1)).
// defGrupo/defCorte: tira uma parte do dano de um grupo de ameaças (vento, base, clima); repetidos somam, até RISCO.premioDefMax. efeito: o que acontece na hora.
// raro: sai menos no sorteio; unico: no máximo um por torre.
export const PREMIOS = {
  patrocinio: { n: 'Patrocínio', d: 'Uma empresa estampa a marca na torre: dinheiro na hora (cerca de 3 minutos da renda).', tipo: 'dinheiro', icon: 'publicidade', efeito: 'patrocinio' },
  aluguel2: { n: 'Contrato de aluguel', d: 'Inquilinos de peso: a renda dobra.', tipo: 'dinheiro', icon: 'aluguel', st: 'rent', mul: 2 },
  investidor: { n: 'Investidor anjo', d: 'Todas as compras 30% mais baratas.', tipo: 'dinheiro', icon: 'imobiliaria', st: 'cost', mul: 0.7 },
  nucleoAco: { n: 'Núcleo de aço', d: 'Integridade máxima +50 e a torre volta inteira.', tipo: 'estrutura', icon: 'siderurgica', efeito: 'nucleo' },
  amortecedor: { n: 'Amortecedor gigante', d: 'Dano de ventania, furacão e vento de altitude −25% (repetido soma, até −60%).', tipo: 'estrutura', icon: 'amortecedor', defGrupo: 'vento', defCorte: 0.25 },
  fundProfunda: { n: 'Fundação profunda', d: 'Dano de terremoto, recalque do solo e tsunami −25% (repetido soma, até −60%).', tipo: 'estrutura', icon: 'estacas', defGrupo: 'base', defCorte: 0.25 },
  blindagem: { n: 'Blindagem climática', d: 'Dano de chuva, granizo, raios, gelo, nevasca, meteoros e tempestade solar −25% (repetido soma, até −60%).', tipo: 'estrutura', icon: 'pressurizada', defGrupo: 'clima', defCorte: 0.25 },
  turma: { n: 'Turma extra', d: 'Os pedreiros assentam o dobro.', tipo: 'obra', icon: 'pedreiro', st: 'lay', mul: 2 },
  elevadorAV: { n: 'Elevador de alta velocidade', d: 'O dobro de material subindo.', tipo: 'obra', icon: 'expresso', st: 'tran', mul: 2 },
  fornecedor: { n: 'Fornecedor exclusivo', d: 'O dobro de material chegando.', tipo: 'obra', icon: 'fornec', st: 'prod', mul: 2 },
  previsao: { n: 'Previsão do tempo', d: 'As ameaças são avisadas com o dobro de antecedência.', tipo: 'regra', icon: 'projeto', raro: true, unico: true, st: 'warn', mul: 2 },
  seguro: { n: 'Seguro de obra', d: 'A próxima ameaça que derrubaria a torre deixa ela de pé (uma vez por torre).', tipo: 'regra', icon: 'corretores', raro: true, unico: true, efeito: 'seguro' },
  fiscalAmigo: { n: 'Fiscal amigo', d: 'A fiscalização do Ministério do Trabalho nunca embarga a obra.', tipo: 'regra', icon: 'treino', raro: true, unico: true },
  plantao: { n: 'Equipe de plantão', d: 'A integridade se recupera sozinha 3× mais rápido.', tipo: 'regra', icon: 'mestre', raro: true, unico: true, st: 'regen', mul: 3 },
};
export const PREMIO_IDS = Object.keys(PREMIOS);
