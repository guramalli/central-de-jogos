// Modo com risco: prêmios de fim de ano (1 de 3, sorteados). Só lado bom, valem até a torre cair e se acumulam.
// st/mul: multiplica um estágio da obra (prod, tran, lay, rent, cost, regen, warn); repetidos somam (1 + Σ(mul − 1)).
// defGrupo/defCorte: tira uma parte do dano de um grupo de ameaças (vento, base, clima); repetidos somam, até RISCO.premioDefMax. efeito: o que acontece na hora.
// raro: sai menos no sorteio; unico: no máximo um por torre.
// Equilíbrio revisto com o usuário (21/10/2026): o robô pegando sempre o mesmo prêmio mostrou Contrato de aluguel e Plantão
// muito acima dos outros e Turma extra e Fornecedor exclusivo quase inúteis (no alto, quem segura a obra é a subida de
// material). Os dois viraram a Equipe completa (saves antigos trocam em migrarRisco). extraMax: integridade máxima a mais
// na hora (a integridade sobe junto). sts: várias etapas com o mesmo mul.
export const PREMIOS = {
  patrocinio: { n: 'Patrocínio', d: 'Uma empresa estampa a marca na torre: dinheiro na hora (cerca de 10 minutos da renda).', tipo: 'dinheiro', icon: 'publicidade', efeito: 'patrocinio' },
  aluguel2: { n: 'Contrato de aluguel', d: 'Inquilinos de peso: a renda aumenta 60%.', tipo: 'dinheiro', icon: 'aluguel', st: 'rent', mul: 1.6 },
  investidor: { n: 'Investidor anjo', d: 'Todas as compras 30% mais baratas.', tipo: 'dinheiro', icon: 'imobiliaria', st: 'cost', mul: 0.7 },
  nucleoAco: { n: 'Núcleo de aço', d: 'Integridade máxima +50, e a integridade também sobe 50 agora.', tipo: 'estrutura', icon: 'siderurgica', extraMax: 50 },
  amortecedor: { n: 'Amortecedor gigante', d: 'Dano de ventania, furacão e vento de altitude −40% (repetido soma, até −60%).', tipo: 'estrutura', icon: 'amortecedor', defGrupo: 'vento', defCorte: 0.4 },
  fundProfunda: { n: 'Fundação profunda', d: 'Fundação reforçada +1 nível agora (afasta a torre do limite) e dano de terremoto, recalque do solo e tsunami −35% (repetido soma, até −60%).', tipo: 'estrutura', icon: 'estacas', defGrupo: 'base', defCorte: 0.35, efeito: 'fundacao' },
  blindagem: { n: 'Blindagem climática', d: 'Dano de chuva, granizo, raios, gelo, nevasca, meteoros e tempestade solar −25% (repetido soma, até −60%).', tipo: 'estrutura', icon: 'pressurizada', defGrupo: 'clima', defCorte: 0.25 },
  equipe: { n: 'Equipe completa', d: '+50% nas três etapas da obra: material chegando, subindo e assentando.', tipo: 'obra', icon: 'pedreiro', sts: ['prod', 'tran', 'lay'], mul: 1.5 },
  elevadorAV: { n: 'Elevador de alta velocidade', d: '+60% de material subindo.', tipo: 'obra', icon: 'expresso', st: 'tran', mul: 1.6 },
  previsao: { n: 'Previsão do tempo', d: 'As ameaças são avisadas com o dobro de antecedência, e a integridade máxima sobe 40.', tipo: 'regra', icon: 'projeto', raro: true, unico: true, st: 'warn', mul: 2, extraMax: 40 },
  seguro: { n: 'Seguro de obra', d: 'A próxima ameaça que derrubaria a torre deixa ela de pé (uma vez por torre), e a integridade máxima sobe 25.', tipo: 'regra', icon: 'corretores', raro: true, unico: true, efeito: 'seguro', extraMax: 25 },
  fiscalAmigo: { n: 'Fiscal amigo', d: 'A fiscalização do Ministério do Trabalho nunca embarga a obra, e o aluguel aumenta 15%.', tipo: 'regra', icon: 'treino', raro: true, unico: true, st: 'rent', mul: 1.15 },
  plantao: { n: 'Equipe de plantão', d: 'A integridade se recupera sozinha 50% mais rápido.', tipo: 'regra', icon: 'mestre', raro: true, unico: true, st: 'regen', mul: 1.5 },
};
// prêmios retirados (21/10/2026) → o que o save ganha no lugar
export const PREMIO_TROCA = { turma: 'equipe', fornecedor: 'equipe' };
export const PREMIO_IDS = Object.keys(PREMIOS);
