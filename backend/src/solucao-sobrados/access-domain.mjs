export const MODULES=[
{id:'overview',label:'Visão geral',group:'Início'},
{id:'project',label:'Empreendimento',group:'Obra'},
{id:'stages',label:'Etapas da obra',group:'Obra'},
{id:'diary',label:'Diário de obra · fotos',group:'Obra'},
{id:'documents',label:'Documentos e projetos',group:'Obra'},
{id:'reminders',label:'Agenda e lembretes',group:'Obra'},
{id:'costs',label:'Custos e pagamentos',group:'Financeiro'},
{id:'contractors',label:'Empreiteiro',group:'Financeiro'},
{id:'receipts',label:'Entradas / recebidos',group:'Financeiro'},
{id:'profit',label:'Viabilidade e lucro (totais financeiros)',group:'Financeiro'},
{id:'sales',label:'Vendas / contratos',group:'Comercial'},
{id:'market',label:'Mercado da região',group:'Comercial'},
{id:'maintenance',label:'Manutenção',group:'Gestão'},
{id:'history',label:'Histórico e comparativo de custos',group:'Gestão'}];
export const MODULE_IDS=MODULES.map(m=>m.id);
export function validateModuleSelection(value){if(value===null)return null;if(!Array.isArray(value)||value.some(id=>!MODULE_IDS.includes(id))||new Set(value).size!==value.length)throw Object.assign(new Error('Selecione módulos válidos, sem repetições.'),{status:422});return MODULE_IDS.filter(id=>value.includes(id));}
export function normalizeModules(value,role){if(role==='admin')return [...MODULE_IDS];if(value==null)return role==='manager'?[...MODULE_IDS]:role==='maintenance'?['maintenance']:[];return validateModuleSelection(value);}
export function canAccess(actor,moduleId){return Boolean(actor)&&(moduleId==='users'?actor.role==='admin':normalizeModules(actor.modules,actor.role).includes(moduleId));}
export const fullFinancialAccess=actor=>['costs','sales','receipts','profit','contractors'].every(id=>canAccess(actor,id));
