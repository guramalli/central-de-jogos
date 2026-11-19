// Public static help. Never include customer data. Navigation must recheck permissions.
export const TUTORIAL_GROUPS = [
 {id:'inicio',label:'Começar e navegar'}, {id:'obra',label:'Obra e acompanhamento'},
 {id:'financeiro',label:'Custos e resultados'}, {id:'comercial',label:'Vendas e recebimentos'},
 {id:'gestao',label:'Equipe e manutenção'}, {id:'conta',label:'Conta e atendimento'}
];
export const TUTORIALS = [
{
 id:'primeiros-passos',title:'Primeiros passos no Solução Sobrados',group:'inicio',moduleId:null,
 summary:'Conheça a sequência de cadastro e encontre os dados da sua empresa.',
 steps:[
 {title:'Entre com seu acesso individual',text:'Use o login da sua empresa. O Diretor define quais módulos cada pessoa pode ver; o cargo define as ações permitidas. Se uma área não aparecer, confira a liberação com o Diretor.'},
 {title:'Confira a base e a obra',text:'No topo, veja o empreendimento selecionado e a indicação CONTA ONLINE. Ver exemplos abre uma base fictícia separada. Use Voltar à minha conta antes de registrar dados reais.'},
 {title:'Cadastre o empreendimento',text:'Use Novo empreendimento. Confira cada unidade, sua metragem e venda estimada antes de salvar. Esses dados ajudam nas análises por casa e nos próximos rateios.'},
 {title:'Organize sua rotina',text:'Atualize Etapas da obra, registre Custos e pagamentos e acompanhe negociações em Vendas / contratos. Confirme o dinheiro que entrou em Entradas / recebidos.'},
 {title:'Navegue e confira',text:'No celular, abra Menu para trocar de módulo. Use Voltar para retornar ao destino indicado. Depois de salvar, confira o registro na tela.'}
 ],
 tips:['Mantenha internet para consultar e salvar os dados da conta.','Contratar, pagar e consumir um material são fatos diferentes.','Os tutoriais podem ser consultados mesmo sem um empreendimento cadastrado.'],
 example:'Exemplo fictício: cadastre o Residencial Horizonte, confira suas casas de 60 m² e só depois lance os gastos dessa obra.',
 related:['empreendimento','equipe-acessos','custos-pagamentos','celular']
},
{
 id:'visao-geral',title:'Entender a Visão geral',group:'inicio',moduleId:'overview',
 summary:'Acompanhe o avanço físico, as casas e os indicadores disponíveis para seu acesso.',
 steps:[
 {title:'Escolha a obra',text:'Selecione o empreendimento no topo. Os cartões e atalhos passam a representar essa obra.'},
 {title:'Leia os indicadores',text:'Compare custos contratados e pagamentos. Um contrato ainda não quitado já compõe o contratado; somente os pagamentos confirmados entram no valor pago.'},
 {title:'Confira as casas e o avanço',text:'Em Cada casa, uma negociação, veja Disponível ou Vendida. O avanço físico vem dos percentuais das etapas aplicáveis e deve ser atualizado em Etapas da obra.'},
 {title:'Abra os detalhes',text:'Use Ver viabilidade, Ver vendas ou Ver custo por casa para investigar os números. Para um gasto simples, use Registrar um gasto e confira a situação do pagamento.'}
 ],
 tips:['Os cartões respeitam os módulos liberados para sua conta.','Observe os avisos de projeção parcial: orçamento ausente pode tornar o lucro previsto incompleto.','Uma venda contratada não significa que todo o dinheiro já foi recebido.'],
 related:['etapas-obra','custos-pagamentos','viabilidade-lucro','vendas-contratos']
},
{
 id:'empreendimento',title:'Cadastrar o empreendimento e suas casas',group:'obra',moduleId:'project',
 summary:'Defina unidades, metragens e premissas para organizar custos e vendas.',
 steps:[
 {title:'Crie ou edite a obra',text:'Em Empreendimento, use Novo empreendimento ou Editar empreendimento. Informe identificação, localização, início e as premissas solicitadas.'},
 {title:'Ajuste as unidades iniciais',text:'Informe a quantidade e use Ajustar quantidade de unidades. Área e venda sugeridas preenchem novas linhas; confira cada casa antes de salvar.'},
 {title:'Diferencie cada casa',text:'Preencha nome, área, dormitórios e venda estimada. Depois, use Adicionar unidade ou Editar unidade para manter os dados corretos.'},
 {title:'Confira o rateio',text:'Escolha o critério padrão e confira o destino em cada gasto. Alterar a área de uma casa não redistribui custos antigos: cada lançamento mantém o rateio salvo.'},
 {title:'Revise antes de encerrar',text:'Use Encerrar obra e conferir custos depois da revisão. Uma obra encerrada restringe alterações financeiras; a reabertura exige justificativa.'},
 {title:'Corrija um cadastro feito por engano',text:'Quando autorizado, use Excluir empreendimento e confira a confirmação. Ele vai para a Lixeira, preservando unidades, custos e pagamentos. Em Ações, abra Lixeira e use Restaurar empreendimento se precisar recuperá-lo.'}
 ],
 tips:['Venda estimada é uma premissa; o contrato efetivo fica em Vendas / contratos.','A zona informada pela equipe não valida regras urbanísticas.','Alterar a metragem pode mudar análises por área sem modificar rateios históricos.'],
 example:'Exemplo fictício: Casa 1 de 55 m² e Casa 2 de 65 m² devem manter áreas próprias, mesmo que criadas com a mesma sugestão inicial.',
 related:['custos-pagamentos','construcao-metragem','vendas-contratos','backup-financeiro']
},
{
 id:'etapas-obra',title:'Atualizar o percentual das etapas',group:'obra',moduleId:'stages',
 summary:'Informe o andamento de cada fase e acompanhe a média de avanço físico da obra.',
 steps:[
 {title:'Abra a fase',text:'Em Etapas da obra, use Atualizar percentual. Cadastre uma Etapa personalizada quando precisar de uma fase específica.'},
 {title:'Informe o percentual',text:'Arraste a barra ou digite um inteiro entre 0 e 100 em Percentual concluído (%). Zero significa não iniciada; 100 significa concluída.'},
 {title:'Defina o que entra na média',text:'Marque Esta etapa se aplica à obra e entra no avanço total apenas nas fases pertinentes. Desmarque as que não se aplicam.'},
 {title:'Salve e confira',text:'Use Salvar etapa. O avanço total é a média simples das etapas aplicáveis e aparece também no resumo da obra.'}
 ],
 tips:['O percentual é declarado pela equipe, não calculado pelo dinheiro gasto.','Todas as etapas têm o mesmo peso nessa média.','O orçamento financeiro da etapa não altera seu avanço físico.'],
 example:'Exemplo fictício: duas etapas aplicáveis em 100% e 40% resultam em avanço médio de 70%.',
 related:['visao-geral','diario-fotos','agenda-lembretes','viabilidade-lucro']
},
{
 id:'diario-fotos',title:'Registrar a evolução com fotos',group:'obra',moduleId:'diary',
 summary:'Organize registros fotográficos por etapa e unidade para acompanhar a execução.',
 steps:[
 {title:'Abra o acompanhamento',text:'Selecione a obra e entre em Diário de obra · fotos. Se ainda não estiver configurado, siga a orientação da tela: Diretor ou gestor precisa ativar o acompanhamento.'},
 {title:'Prepare a atualização',text:'No formulário de atualização, escolha etapa, unidade e Data do registro. Informe o que foi feito, as observações e a situação da atividade.'},
 {title:'Escolha as fotos',text:'Use Selecionar fotos ou Tirar foto. São até seis fotos por atualização. Confira as prévias antes de concluir o envio.'},
 {title:'Consulte a linha do tempo',text:'Depois de salvar, confira a Linha do tempo da obra. Use os filtros para localizar registros de uma etapa ou unidade.'}
 ],
 tips:['A autoria fica vinculada ao login utilizado.','A fotografia documenta o registro enviado; o avanço físico é declarado pela equipe.','As fotos viram JPG com até 1.600 px no maior lado e aproximadamente 450 KB no máximo, sem os metadados originais. Guarde os originais separadamente.'],
 example:'Exemplo fictício: publique a instalação hidráulica da Casa 2 e descreva quais pontos foram concluídos.',
 related:['etapas-obra','documentos-projetos','manutencao','equipe-acessos']
},
{
 id:'documentos-projetos',title:'Organizar documentos e projetos',group:'obra',moduleId:'documents',
 summary:'Guarde arquivos originais online e organize plantas, aprovações e imagens em pastas.',
 steps:[
 {title:'Crie as pastas',text:'Use Nova pasta em Documentos e projetos. Organize por disciplina, fase ou unidade, como Arquitetônico e Elétrica e hidráulica.'},
 {title:'Adicione o arquivo',text:'Use Adicionar arquivo, confira a pasta de destino e preencha título e descrição ou revisão para identificar o documento.'},
 {title:'Localize e baixe',text:'Abra as pastas ou pesquise em todas elas. Use Ver imagem quando disponível e Baixar original para obter o arquivo enviado.'},
 {title:'Mantenha a organização',text:'Use Editar / mover para ajustar identificação ou pasta. Arquivar, restaurar e definir uma imagem como foto do empreendimento aparecem conforme sua permissão.'}
 ],
 tips:['O limite é 20 MB por arquivo, sujeito ao espaço disponível indicado na tela.','DWG e DXF são baixados para abrir em um programa compatível.','O Backup financeiro não inclui esta biblioteca; baixe separadamente os arquivos que deseja guardar.'],
 example:'Exemplo fictício: salve planta-revisao-02.pdf em Arquitetônico e descreva qual revisão ela substitui.',
 related:['diario-fotos','empreendimento','backup-financeiro','equipe-acessos']
},
{
 id:'agenda-lembretes',title:'Planejar providências e lembretes',group:'obra',moduleId:'reminders',
 summary:'Organize compras, contratações e tarefas com data, responsável e antecedência.',
 steps:[
 {title:'Cadastre a providência',text:'Em Agenda e lembretes, use Novo lembrete. Informe O que precisa ser feito?, tipo e prioridade.'},
 {title:'Defina prazo e contexto',text:'Escolha etapa e unidade, se necessário. Informe Data para resolver, Horário de Brasília, antecedência e responsável.'},
 {title:'Acompanhe as pendências',text:'Depois de Salvar lembrete, confira Atrasados, Providenciar agora e Pendentes. Filtre por situação, etapa ou texto.'},
 {title:'Exporte para sua agenda',text:'Para um aviso com o aplicativo fechado, use Adicionar à agenda ou Exportar pendentes para agenda. Importe o arquivo e confira se o alerta ficou ativado.'},
 {title:'Conclua ou reprograme',text:'Use Concluir quando resolver, ou Editar / adiar para mudar o prazo. Cancelados e concluídos permanecem no histórico.'}
 ],
 tips:['Informar um responsável não envia e-mail ou WhatsApp.','Mudanças no aplicativo não atualizam automaticamente a agenda externa.','Concluir um lembrete não encerra uma etapa nem cria um custo.'],
 example:'Exemplo fictício: lembrete Fechar esquadrias, três dias de antecedência e detalhes das medidas a conferir.',
 related:['etapas-obra','custos-pagamentos','celular']
},
{
 id:'custos-pagamentos',title:'Registrar custos e seus pagamentos',group:'financeiro',moduleId:'costs',
 summary:'Separe o compromisso contratado do dinheiro pago e acompanhe o saldo.',
 steps:[
 {title:'Escolha a forma de lançamento',text:'Use Gasto rápido para um valor total. Use Lançamento detalhado para quantidade física, unidade de medida e preço unitário.'},
 {title:'Classifique e distribua',text:'Descreva a compra ou serviço e escolha Onde aplicar o gasto?. Etapa da obra pode ficar em Não informar. Confira categoria, fornecedor e outros detalhes quando necessários.'},
 {title:'Informe a situação real',text:'No gasto rápido, Já paguei registra o pagamento junto do custo. Para um compromisso ainda não quitado, registre os pagamentos depois no mesmo lançamento.'},
 {title:'Registre pagamentos parciais',text:'Abra o custo e use Registrar pagamento. Informe valor, data, forma e etapa de referência, se necessário. O registro abate o saldo, sem criar outro custo.'},
 {title:'Pesquise e confira',text:'Os filtros de busca, etapa, natureza e destino são combinados. Se não encontrar um gasto, amplie os critérios e confira sua classificação. Use Relatório de pagamentos para revisar saídas.'}
 ],
 tips:['Não repita uma comissão gerada por venda ou contrato já cadastrado em Empreiteiro.','Para controlar consumo de material lançado só por valor, detalhe o mesmo gasto com quantidade e medida; não crie outra compra.','Registrar uso de material não duplica o custo e não é pagamento.','Nenhuma transferência bancária é realizada pelo registro.','Um gasto importado pode estar em Histórico importado. Para localizar o terreno, tente Todas as etapas e confira natureza, descrição e classificação.'],
 example:'Exemplo fictício: serviço de R$ 5.000 com dois pagamentos de R$ 1.000 tem R$ 5.000 contratados, R$ 2.000 pagos e R$ 3.000 a pagar.',
 related:['empreiteiro','construcao-metragem','relatorios','vendas-contratos']
},
{
 id:'construcao-metragem',title:'Entender construção por casa e por m²',group:'financeiro',moduleId:'costs',
 summary:'Veja quanto da construção já foi pago e distribua esse valor pela metragem das casas.',
 steps:[
 {title:'Abra o quadro de construção',text:'Em Custos e pagamentos, localize Quanto custou construir cada casa?. O quadro considera toda a obra, independentemente dos filtros da lista.'},
 {title:'Confira a base paga',text:'Construção já paga soma pagamentos confirmados dos gastos incluídos. Terreno, comissões e impostos são excluídos automaticamente pela classificação; revise os grupos exibidos.'},
 {title:'Revise uma classificação',text:'Use Classificar se um lançamento estiver no grupo errado. Isso altera apenas sua participação neste cálculo por m²; mantém valor, pagamentos e rateio original.'},
 {title:'Leia o resultado por casa',text:'Construção por m² é a construção paga dividida pela área privativa total. O valor analítico de cada casa é esse custo por m² multiplicado pela área atual da unidade.'},
 {title:'Compare o indicador correto',text:'O quadro não inclui orçamento futuro nem reserva. Consulte Empreendimento para o custo direto e a participação nos gastos comuns conforme os rateios dos lançamentos.'}
 ],
 tips:['A distribuição analítica por área não modifica os rateios registrados.','Confira a metragem antes de interpretar o custo por m².','Construção contratada e construção já paga podem ter valores diferentes.'],
 example:'Exemplo fictício: R$ 800.000 de construção paga ÷ 400 m² = R$ 2.000/m². Uma casa de 60 m² recebe R$ 120.000 nessa distribuição.',
 related:['custos-pagamentos','empreendimento','viabilidade-lucro']
},
{
 id:'empreiteiro',title:'Controlar o contrato e os vales do empreiteiro',group:'financeiro',moduleId:'contractors',
 summary:'Registre escopo, preço por m² ou valor fechado e pagamentos que reduzem o saldo.',
 steps:[
 {title:'Evite duplicar o contrato',text:'Se o serviço já estiver em Custos e pagamentos, use Aproveitar custo já lançado. Escolha o próprio compromisso para preservar seu valor e pagamentos.'},
 {title:'Preencha a contratação',text:'Informe Nome do empreiteiro e Identificação do serviço. Escolha Por metro quadrado ou Valor fechado. Na primeira opção, preencha Metragem contratada e Mão de obra por m².'},
 {title:'Detalhe o escopo',text:'Em O que o empreiteiro vai fazer?, descreva o que está incluído e o que ficou fora. Informe data, condições e prazos; a etapa do contrato é opcional.'},
 {title:'Anexe e salve',text:'Se necessário, anexe PDF, JPG ou PNG de até 1 MB. Confira Total do serviço e use Salvar contrato. O valor entra nos custos da obra uma única vez.'},
 {title:'Registre cada vale',text:'Use Registrar vale / pagamento, informe valor e data e selecione Referente à etapa quando aplicável. Confira total contratado, pago e a pagar.'}
 ],
 tips:['Alterar a área das casas depois não modifica a metragem registrada no contrato.','Um vale é pagamento do custo existente, não outra contratação.','A etapa indicada no pagamento não atualiza o avanço físico automaticamente.'],
 example:'Exemplo fictício: 300 m² × R$ 750/m² = R$ 225.000 contratados. Um vale de R$ 10.000 reduz o saldo para R$ 215.000.',
 related:['custos-pagamentos','etapas-obra','relatorios','backup-financeiro']
},
{
 id:'viabilidade-lucro',title:'Interpretar viabilidade e lucro previsto',group:'financeiro',moduleId:'profit',
 summary:'Compare receitas estimadas ou contratadas com custos previstos para avaliar a margem.',
 steps:[
 {title:'Confira as premissas',text:'Em Viabilidade e lucro, use Ajustar premissas para revisar as hipóteses da obra. Confira venda, área, reserva e os parâmetros apresentados.'},
 {title:'Revise os orçamentos',text:'Em Custos e pagamentos, abra Orçamentos por etapa e use Ajustar orçamento e informe o custo final esperado, incluindo o já contratado. A previsão considera o maior valor entre orçamento e contratado por etapa, mais a reserva.'},
 {title:'Observe os avisos',text:'Etapas sem orçamento e sem custos deixam a projeção parcial. Preencha o que falta antes de usar a margem para decidir um preço de venda.'},
 {title:'Compare os resultados',text:'Observe custo final previsto, lucro previsto, margem e custo completo por m². Os cenários dependem dos dados informados e ajudam a avaliar efeitos do preço de venda.'},
 {title:'Gere uma conferência',text:'Use Relatório completo para conferir a prévia e baixar o documento. Revise os valores previstos e registrados antes de compartilhar.'}
 ],
 tips:['Lucro previsto não é dinheiro disponível em caixa.','Custo completo por m² é diferente de construção já paga por m², que exclui terreno, comissões e impostos.','Concluir uma fase fisicamente não quita seus custos nem completa seu orçamento.'],
 related:['custos-pagamentos','construcao-metragem','entradas-recebidos','relatorios']
},
{
 id:'vendas-contratos',title:'Registrar uma venda e seus documentos',group:'comercial',moduleId:'sales',
 summary:'Acompanhe disponibilidade, negociação, comissão, laudo e documentos por casa.',
 steps:[
 {title:'Escolha a casa',text:'Em Vendas / contratos, cada unidade aparece separada. Sem uma venda ativa, fica Disponível. Use Registrar venda na casa correta.'},
 {title:'Informe a negociação',text:'Preencha valor, data, comprador e quem vendeu, quando necessário. Escolha Como foi a venda? e descreva as condições. Na entrada parcelada, confira valor, número de parcelas e primeiro vencimento.'},
 {title:'Confira a comissão',text:'Informe Valor da comissão e sua situação. Ela gera automaticamente um custo vinculado nos custos gerais. Não cadastre uma segunda despesa para o mesmo compromisso.'},
 {title:'Separe venda de caixa',text:'Em Valor já recebido nesta venda, informe apenas dinheiro confirmado. Deixe zero se ainda não recebeu. As parcelas restantes ficam em A receber.'},
 {title:'Organize os documentos',text:'Em Laudo / documentos, informe se há laudo e seu valor. Anexe proposta, contrato de entrada, contrato assinado, recibo de comissão, entrega de chaves ou laudo. Confira a negociação em Ver venda e parcelas.'}
 ],
 tips:['A comissão entra no custo geral, mas fica fora da construção por m².','Anexos comerciais aceitam PDF, JPG ou PNG de até 1 MB cada.','Com histórico de recebimentos, valores e parcelas ficam protegidos; confira as orientações de estorno e cancelamento antes de refazer o contrato.'],
 example:'Exemplo fictício: venda de R$ 400.000, com entrada de R$ 40.000 parcelada e saldo de R$ 360.000. O contratado é R$ 400.000; o caixa só aumenta com recebimentos confirmados.',
 related:['entradas-recebidos','custos-pagamentos','relatorios','mercado-regiao']
},
{
 id:'entradas-recebidos',title:'Confirmar entradas e recebimentos',group:'comercial',moduleId:'receipts',
 summary:'Separe valor vendido, dinheiro recebido e parcelas ainda pendentes.',
 steps:[
 {title:'Confira os contratos',text:'Em Entradas / recebidos, o resumo separa Valor vendido, Já recebido e A receber. As parcelas ficam organizadas por casa.'},
 {title:'Escolha a parcela',text:'Confira vencimento, valor, recebido e saldo. Use Registrar recebimento na parcela correspondente ao dinheiro que entrou.'},
 {title:'Registre o valor confirmado',text:'Informe valor, data, forma e, se necessário, referência e observações. Use Confirmar recebimento depois de conferir a entrada.'},
 {title:'Revise o histórico',text:'Abra Histórico de recebimentos. Para um registro incorreto, use Estornar quando permitido e informe a justificativa solicitada; o histórico permanece.'},
 {title:'Gere a conferência',text:'Use Relatório de recebimentos ou Exportar recebimentos CSV. Abra Ver contrato para conferir as condições da negociação.'}
 ],
 tips:['O sistema não consulta o extrato bancário automaticamente.','Um recebimento parcial reduz o saldo; não exige outra venda.','A comissão é uma saída de custo, separada do recebimento do comprador.'],
 example:'Exemplo fictício: uma parcela de R$ 10.000 com R$ 6.000 recebidos fica com saldo de R$ 4.000.',
 related:['vendas-contratos','relatorios','viabilidade-lucro']
},
{
 id:'mercado-regiao',title:'Pesquisar referências de mercado',group:'comercial',moduleId:'market',
 summary:'Compare anúncios cadastrados de imóveis semelhantes para contextualizar o preço.',
 steps:[
 {title:'Escolha a unidade',text:'Em Mercado da região, selecione Unidade de referência. Confira bairro, zona e tipo de empreendimento utilizados no recorte.'},
 {title:'Ajuste os critérios',text:'Escolha Dormitórios, Área mínima, Área máxima e Condição do imóvel. A comparação e Buscar anúncios acompanham essas mudanças.'},
 {title:'Confira e cadastre anúncios',text:'Buscar anúncios abre a pesquisa na web. Confira cada imóvel e use Registrar referência, incluindo link e data, para alimentar a comparação.'},
 {title:'Leia a amostra',text:'Confira Referências compatíveis, Mediana por m² e indicação para a área selecionada. A mediana exige pelo menos três referências compatíveis.'}
 ],
 tips:['O aplicativo não coleta nem atualiza portais automaticamente.','Preço anunciado não é preço de venda confirmado nem laudo de avaliação.','Confira duplicidades de um mesmo imóvel anunciado por várias imobiliárias.','Incluir zona não informada amplia a amostra, mas exige conferir a localização.'],
 related:['empreendimento','vendas-contratos','viabilidade-lucro']
},
{
 id:'manutencao',title:'Abrir, agendar e concluir uma manutenção',group:'gestao',moduleId:'maintenance',
 summary:'Organize assistência e serviços em imóveis em uso, com cliente, responsável, horários e fotos.',
 steps:[
 {title:'Prepare o local',text:'Use uma casa cadastrada ou um imóvel em uso. A gestão pode Cadastrar imóvel em uso; a equipe escolhe um local existente.'},
 {title:'Abra o chamado',text:'Use Abrir chamado e informe título, tipo, prioridade, local e descrição. A gestão pode escolher o responsável; quando a equipe cria um chamado, ela própria fica responsável.'},
 {title:'Registre cliente e agendamento',text:'Nome do cliente e Telefone do cliente são opcionais. Para informar Horário agendado, escolha também a Data agendada. Os horários seguem Brasília.'},
 {title:'Atualize a execução',text:'Abra o chamado e use Atualizar andamento. O responsável pode concluir antes da data agendada. Ao salvar Concluído, o sistema registra automaticamente data, horário e autoria da conclusão.'},
 {title:'Envie as fotos',text:'Em Fotos do serviço, use Adicionar fotos. Selecione, aguarde a preparação, confira prévias e legendas e toque em Salvar fotos. Também é possível anexar depois de concluir.'},
 {title:'Preserve o histórico',text:'Use Adicionar comentário para registrar verificações. Cancelar, reabrir, alterar dados e reatribuir ficam com a gestão; cancelamento e reabertura exigem justificativa.'}
 ],
 tips:['Até seis fotos por envio e vinte por chamado, dentro do espaço disponível.','As fotos viram JPG com até 1.600 px no maior lado e aproximadamente 450 KB no máximo, sem os metadados originais. Guarde os originais separadamente.','Chamados cancelados não recebem novas fotos.','Manutenção não cria custo ou pagamento automaticamente.'],
 example:'Exemplo fictício: um reparo agendado para sexta pode terminar na quinta; o histórico guarda quando a conclusão foi registrada.',
 related:['equipe-acessos','agenda-lembretes','custos-pagamentos','atendimento']
},
{
 id:'historico-comparativo',title:'Comparar custos entre anos e obras',group:'financeiro',moduleId:'history',
 summary:'Use especificações consistentes para comparar preços médios e resultados registrados.',
 steps:[
 {title:'Escolha os anos',text:'Em Histórico e comparativo de custos, selecione Ano de referência e Ano de comparação e toque em Comparar.'},
 {title:'Confira a equivalência',text:'O comparativo agrupa descrição, natureza e unidade de medida iguais. Confira se representam materiais ou serviços equivalentes.'},
 {title:'Leia os preços',text:'O preço médio é ponderado pela quantidade contratada. A variação é nominal, sem correção automática pela inflação.'},
 {title:'Compare empreendimentos',text:'Confira área, custo completo, custo por m², mão de obra e lucro estimado. Obras abertas mostram previsão; encerradas usam os custos registrados.'}
 ],
 tips:['Terreno, taxas e valores globais em verba, lote ou contrato não entram na comparação unitária.','Use descrições diferentes quando qualidade ou escopo forem diferentes.','Venda e lucro consideram contratos e estimativas; recebimentos são acompanhados separadamente.'],
 related:['custos-pagamentos','empreendimento','viabilidade-lucro','relatorios']
},
{
 id:'equipe-acessos',title:'Definir cargos e acesso aos módulos',group:'gestao',moduleId:'users',
 summary:'O Diretor administra os acessos individuais e os módulos disponíveis para cada pessoa.',
 steps:[
 {title:'Entre como Diretor',text:'Abra Equipe e acessos com uma conta de Diretor. Gestor e equipe de manutenção não administram os acessos da empresa.'},
 {title:'Crie o acesso individual',text:'Abra Convidar uma pessoa, informe e-mail, cargo e módulos e use Gerar convite. Copie e envie o link à pessoa. Ela criará o próprio acesso; o aplicativo não envia a mensagem automaticamente.'},
 {title:'Escolha o cargo',text:'Diretor administra a empresa. Gestor trabalha nos módulos liberados. Equipe de manutenção executa seus chamados e consulta outros módulos explicitamente liberados.'},
 {title:'Selecione os módulos',text:'Abra a pessoa, marque os módulos necessários e use Salvar permissões. Seleção vazia significa nenhum módulo. O Diretor conserva acesso aos módulos da empresa.'},
 {title:'Revise mudanças na equipe',text:'Alterar cargo, módulos ou suspender acesso revoga as sessões da pessoa. Ela precisará entrar novamente para usar as permissões atualizadas.'}
 ],
 tips:['Liberar um módulo à equipe de manutenção não concede gravação financeira; o cargo continua limitando as ações.','Diretor de uma empresa é diferente de administrador da plataforma.','Convites expiram em 72 horas e podem ser usados uma vez. Compartilhe apenas com a pessoa convidada; não compartilhe senhas.'],
 related:['primeiros-passos','manutencao','assinatura','administracao-plataforma']
},
{
 id:'relatorios',title:'Gerar relatórios e tabelas para compartilhar',group:'financeiro',moduleId:'reports',
 summary:'Prepare pagamentos, recebimentos, tabela de vendas e resumo da obra em PDF ou CSV.',
 steps:[
 {title:'Abra o tipo adequado',text:'Use Relatório de pagamentos em Custos e pagamentos, Tabela de vendas em Vendas / contratos, Relatório de recebimentos em Entradas / recebidos ou Relatório completo na análise da obra.'},
 {title:'Defina os filtros',text:'Em Gerar relatórios, selecione um tipo disponível para seu acesso. Em pagamentos e recebimentos, De e Até filtram a data do movimento, não a contratação. Confira situação e casa quando disponíveis.'},
 {title:'Escolha a versão da tabela',text:'Uso interno reúne os detalhes autorizados da negociação. Para compartilhar mostra casas e valores previstos das disponíveis, sem compradores, comissões ou recebimentos.'},
 {title:'Revise a prévia',text:'Use Gerar prévia e confira empreendimento, período, filtros, linhas e totais. Confirmados e estornados aparecem identificados separadamente. Revise os filtros se a lista vier vazia.'},
 {title:'Baixe o arquivo',text:'Use Baixar PDF para o documento paginado com cabeçalhos e totais, ou Exportar planilha CSV para abrir os dados em uma planilha. O PDF pode ser impresso pelo leitor de PDF.'}
 ],
 tips:['O relatório representa aquela consulta; gere nova prévia depois de alterações.','Confira versão e conteúdo do arquivo antes de enviar a terceiros.','Tipos e detalhes disponíveis respeitam o cargo e os módulos liberados.'],
 example:'Exemplo fictício: para enviar disponibilidade a um corretor, use Tabela de vendas e Para compartilhar. Para conciliar saídas mensais, use Pagamentos e as datas pagas.',
 related:['custos-pagamentos','vendas-contratos','entradas-recebidos','viabilidade-lucro']
},
{
 id:'assinatura',title:'Consultar o plano e a assinatura',group:'conta',moduleId:'billing',
 summary:'Entenda a situação de acesso e a contratação quando estiver disponível.',
 steps:[
 {title:'Abra Minha assinatura',text:'Em Ações, abra Minha assinatura. Confira acesso, renovação, fim da avaliação e Acesso pago até.'},
 {title:'Confira oferta e disponibilidade',text:'O plano informado é R$ 350 por mês por empresa, com sete dias de avaliação para novas empresas elegíveis. Configuração pendente indica que a integração ainda não iniciou a contratação automática por essa tela.'},
 {title:'Contrate quando habilitado',text:'O Diretor pode usar Assinar quando o botão estiver disponível. O pagamento acontece no Mercado Pago e o aplicativo aguarda a confirmação verificada pelo servidor.'},
 {title:'Acompanhe a liberação',text:'O acesso fica vinculado à empresa e aos logins individuais, sem distribuir uma chave manual a cada integrante. Renovação autorizada e pagamento confirmado são situações diferentes.'},
 {title:'Gerencie a renovação',text:'Quando disponível, o Diretor pode usar Cancelar renovação e confirmar. Isso interrompe próximas cobranças; não solicita reembolso nem apaga dados. O período já pago segue a data confirmada pelo servidor.'}
 ],
 tips:['Não informe cartão ou senha no Atendimento; os dados de pagamento pertencem ao checkout do provedor.','Empresas com acesso existente podem ter situação diferente da avaliação de novas contas.','Se a contratação ficar pendente ou o acesso não atualizar após pagar, solicite conferência pelo Atendimento.'],
 related:['atendimento','equipe-acessos','primeiros-passos']
},
{
 id:'atendimento',title:'Enviar dúvidas, sugestões e problemas',group:'conta',moduleId:'support',
 summary:'Converse com o atendimento e acompanhe as respostas pela sua conta.',
 steps:[
 {title:'Abra Atendimento / SAC',text:'Use Atendimento / SAC no menu Ações. A área segue disponível para a conta autenticada mesmo quando o acesso aos módulos está indisponível.'},
 {title:'Classifique a solicitação',text:'Em Tipo de mensagem, escolha Relatar um problema, Enviar uma sugestão ou Tirar uma dúvida. Preencha um Assunto claro.'},
 {title:'Explique o que aconteceu',text:'Informe módulo, objetivo, passos e resultado observado. Para um problema no celular, aparelho e navegador ajudam na investigação.'},
 {title:'Envie e acompanhe',text:'Use Enviar ao atendimento. Em Minhas mensagens, abra Ver conversa para ler situação e respostas. Use Sua mensagem para complementar a mesma conversa.'}
 ],
 tips:['A conversa pertence à pessoa que abriu a solicitação; não é uma caixa compartilhada por toda a empresa.','Esta versão recebe texto e não oferece anexos no Atendimento.','Não envie senhas, dados de cartão ou informações pessoais desnecessárias.'],
 example:'Exemplo fictício: “Em Manutenção, escolhi duas fotos no Safari do iPhone. A prévia apareceu, mas Salvar fotos mostrou esta mensagem: …”.',
 related:['manutencao','assinatura','celular']
},
{
 id:'celular',title:'Adicionar ao iPhone e usar no celular',group:'inicio',moduleId:null,
 summary:'Crie um ícone na tela inicial e entenda quais funções precisam de internet.',
 steps:[
 {title:'Abra no Safari',text:'Acesse o aplicativo no Safari do iPhone. Se estiver no navegador interno de outro aplicativo, abra a página no Safari para seguir a instalação.'},
 {title:'Adicione o ícone',text:'Use Compartilhar, Adicionar à Tela de Início e, quando aparecer, Abrir como App. Confirme em Adicionar.'},
 {title:'Entre pela tela inicial',text:'Toque no ícone criado e faça login quando solicitado. O aplicativo continua sendo web e utiliza a mesma conta online.'},
 {title:'Navegue e salve',text:'Use Menu para os módulos, Ações para opções da conta e Voltar dentro das áreas. Confira a obra selecionada e mantenha internet ao salvar.'},
 {title:'Entenda o cache',text:'A interface pública pode ser guardada em cache, mas login, dados, fotos, documentos e salvamentos precisam de conexão. Se ficar offline, aguarde a rede antes de registrar informações.'}
 ],
 tips:['O ícone não baixa uma cópia completa dos dados da empresa.','O celular pode liberar espaço de cache; ele não é uma cópia permanente.','Não há fila de gravações offline nem sincronização de alterações feitas sem internet.'],
 related:['primeiros-passos','backup-financeiro','atendimento']
},
{
 id:'backup-financeiro',title:'Baixar backup e entender a restauração',group:'conta',moduleId:null,
 summary:'Guarde uma cópia financeira e confira o que fica fora dela antes de restaurar.',
 steps:[
 {title:'Confira a conta',text:'Verifique a empresa e a base exibidas. As opções disponíveis dependem de cargo e acesso financeiro; a restauração é exclusiva do Diretor.'},
 {title:'Baixe a cópia',text:'Em Ações, use Backup financeiro quando disponível. Guarde o arquivo em local confiável e identifique sua data para distinguir versões.'},
 {title:'Confira o conteúdo',text:'A cópia inclui a base e os anexos financeiros. Não inclui usuários, convites, sessões, manutenção, fotos, agenda ou arquivos de Documentos e projetos.'},
 {title:'Prepare a restauração',text:'Para substituir a base financeira, use Restaurar como Diretor. Baixe antes o backup atual, confira o arquivo e leia as consequências antes de confirmar RESTAURAR.'},
 {title:'Revise o resultado',text:'Confira empreendimentos, casas e totais depois. Para transferir uma base antiga do navegador, use Conferir transferência quando essa opção aparecer, com backup prévio e confirmação TRANSFERIR.'}
 ],
 tips:['Backup financeiro não é backup completo da empresa.','Restaurar substitui a base; não soma lançamentos a uma base existente.','A base aceita até 12 MB; anexos financeiros individuais têm limite de 1 MB.','Guarde separadamente os originais das fotos e os arquivos da biblioteca.'],
 related:['documentos-projetos','custos-pagamentos','equipe-acessos','celular']
},
{
 id:'administracao-plataforma',title:'Administrar assinaturas e atendimento',group:'conta',moduleId:'platform',visibility:'platform',
 summary:'Guia do operador autorizado da plataforma, separado do Diretor de cada empresa.',
 steps:[
 {title:'Abra a administração',text:'Use Administração da plataforma com uma conta de operador autorizada. Ser Diretor de uma empresa, por si só, não concede esse acesso.'},
 {title:'Confira os indicadores',text:'Veja empresas, avaliações, acessos expirados, assinaturas ativas e pagamentos confirmados. Recebido em assinaturas refere-se ao aplicativo, não às finanças das obras dos clientes.'},
 {title:'Responda ao cliente',text:'Em Atendimento da plataforma, abra Ver conversa. Escreva a resposta e escolha Aberto, Em atendimento ou Resolvido.'},
 {title:'Gerencie um acesso',text:'Em Empresas e acesso, use Gerenciar acesso. Escolha liberação temporária, suspensão ou remoção da suspensão e preencha a justificativa registrada.'},
 {title:'Separe acesso de cobrança',text:'Ajustar licença não registra pagamento, cancela cobrança nem gera reembolso. Uma liberação temporária não significa assinatura paga.'}
 ],
 tips:['Mensagens de suporte são diferentes dos chamados de manutenção de cada empresa.','Acesso expirado também pode ser uma avaliação encerrada; não significa necessariamente dívida.','O painel não oferece saque; a movimentação dos recebimentos pertence à conta do provedor.'],
 related:['assinatura','atendimento','equipe-acessos']
}
];
