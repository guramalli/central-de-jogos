import {commercialStatus,assertCommercialAccess} from './commercial-service.mjs';
import {canAccess,normalizeModules} from './access-domain.mjs';
import {requireModule,workspaceView,authorizeCommand} from './access-policy.mjs';
import {randomUUID,randomBytes} from 'node:crypto';
import {empty,validate,command} from './workspace-domain.mjs';
import {maintenanceEmpty,maintenanceCommand,maintenanceView,MAINTENANCE_PHOTO_LIMITS} from './maintenance-domain.mjs';
import {DiaryService,roleFor,metadata,jpeg,uuid} from './diary-service.mjs';
export {workspaceSchema} from './account-schema.mjs';
const reject=(ok,message,status=422)=>{if(!ok)throw Object.assign(new Error(message),{status});};
export async function freshActor(db,actor,roles=['admin','manager','maintenance'],requireLicense=true){reject(actor?.id&&actor?.organizationId,'Entre na sua conta.',401);const [user]=await db.$queryRaw`SELECT id,organization_id,name,role,active,module_access FROM ss_app_v1.users WHERE id=${actor.id} AND organization_id=${actor.organizationId} FOR SHARE`;reject(user?.active&&roles.includes(user.role),'Seu acesso não permite esta operação.',403);const fresh={id:user.id,organizationId:user.organization_id,name:user.name,role:user.role,modules:normalizeModules(user.module_access,user.role)};if(requireLicense)await assertCommercialAccess(db,fresh);return fresh;}
const validated=fn=>{try{return fn();}catch(error){if(!error.status)error.status=422;throw error;}};
const managers=actor=>reject(['admin','manager'].includes(actor.role),'Acesso restrito à gestão.',403);
const safeProjects=state=>state.projects.filter(p=>!p.trashedAt).map(p=>({id:p.id,name:p.name,units:p.units.map(u=>({id:u.id,name:u.name}))}));
export class WorkspaceService{
 constructor(db){this.db=db;}
 async row(tx,actor){await tx.$executeRaw`INSERT INTO ss_app_v1.workspaces(organization_id,financial,maintenance,updated_at) VALUES(${actor.organizationId},${JSON.stringify(empty())}::jsonb,${JSON.stringify(maintenanceEmpty())}::jsonb,${BigInt(Date.now())}) ON CONFLICT DO NOTHING`;const [row]=await tx.$queryRaw`SELECT * FROM ss_app_v1.workspaces WHERE organization_id=${actor.organizationId} FOR UPDATE`;return row;}
 async audit(tx,actor,action,subject=''){await tx.$executeRaw`INSERT INTO ss_app_v1.workspace_audit VALUES(${randomUUID()},${actor.organizationId},${actor.id},${action},${String(subject).slice(0,100)},${BigInt(Date.now())})`;}
 async read(actor){return this.db.$transaction(async tx=>{
  actor=await freshActor(tx,actor,undefined,false);
  const commercial=await commercialStatus(tx,actor),[org]=await tx.$queryRaw`SELECT name FROM ss_app_v1.organizations WHERE id=${actor.organizationId}`;
  if(!commercial.license.accessAllowed)return {actor,organizationName:org.name,commercial,financial:null,boardLinks:[]};
  const row=await this.row(tx,actor),links=await tx.$queryRaw`SELECT board_id,project_id FROM ss_app_v1.board_links WHERE organization_id=${actor.organizationId}`;
  return {actor,organizationName:org.name,commercial,financial:workspaceView(row.financial,actor),boardLinks:links.filter(()=>['diary','documents','reminders'].some(id=>canAccess(actor,id))).map(x=>({id:x.board_id,projectId:x.project_id,account:true}))};
 });}
 async execute(actor,d){return this.db.$transaction(async tx=>{actor=await freshActor(tx,actor,['admin','manager']);managers(actor);const row=await this.row(tx,actor);reject(d?.revision===row.financial.revision,'Os dados mudaram. Atualize antes de salvar.',409);reject(typeof d.type==='string'&&d.payload&&typeof d.payload==='object','Comando inválido.');const payload=authorizeCommand(actor,row.financial,d.type,d.payload);const out=validated(()=>command(row.financial,d.type,payload));reject(Buffer.byteLength(JSON.stringify(out.state))<=12*1024*1024,'Limite de 12 MB da base atingido.',507);await tx.$executeRaw`UPDATE ss_app_v1.workspaces SET financial=${JSON.stringify(out.state)}::jsonb,updated_at=${BigInt(Date.now())} WHERE organization_id=${actor.organizationId}`;await this.audit(tx,actor,d.type,d.payload.projectId||out.result?.id);return {state:workspaceView(out.state,actor),result:out.result?{id:out.result.id}:null};});}
 async restore(actor,d){return this.db.$transaction(async tx=>{actor=await freshActor(tx,actor,['admin']);const row=await this.row(tx,actor);reject(d?.revision===row.financial.revision,'A base mudou. Atualize antes de importar.',409);const financial=validated(()=>validate(structuredClone(d.financial)));reject(Buffer.byteLength(JSON.stringify(financial))<=12*1024*1024,'Backup maior que o limite de 12 MB.');for(const p of financial.projects)if(!p.diaryKey)p.diaryKey=randomUUID();const links=await tx.$queryRaw`SELECT project_id FROM ss_app_v1.board_links WHERE organization_id=${actor.organizationId}`;const bound=new Set([...links.map(x=>x.project_id),...(row.maintenance.tickets||[]).map(t=>t.projectId).filter(Boolean)]);for(const id of bound){const before=row.financial.projects.find(p=>p.id===id),after=financial.projects.find(p=>p.id===id);reject(before&&after&&before.diaryKey===after.diaryKey,'O backup troca a identidade de um empreendimento vinculado.');}for(const t of row.maintenance.tickets||[])if(t.projectId)reject(financial.projects.some(p=>p.id===t.projectId&&(!t.unitId||p.units.some(u=>u.id===t.unitId))),'O backup remove um imóvel usado em manutenção.');financial.revision=row.financial.revision+1;await tx.$executeRaw`UPDATE ss_app_v1.workspaces SET financial=${JSON.stringify(financial)}::jsonb,updated_at=${BigInt(Date.now())} WHERE organization_id=${actor.organizationId}`;await this.audit(tx,actor,'workspace.restore');return {financial};});}
 async maintenance(actor,d=null){return this.db.$transaction(async tx=>{actor=await freshActor(tx,actor);requireModule(actor,'maintenance');const row=await this.row(tx,actor),users=await tx.$queryRaw`SELECT id,name,role,active,module_access FROM ss_app_v1.users WHERE organization_id=${actor.organizationId} AND active=TRUE`,projects=safeProjects(row.financial);for(let i=users.length-1;i>=0;i--){users[i].modules=normalizeModules(users[i].module_access,users[i].role);delete users[i].module_access;if(!canAccess(users[i],'maintenance'))users.splice(i,1);}let state=row.maintenance;if(d){reject(d.type!=='ticket-photos','Use o envio de fotos do chamado.');state=maintenanceCommand(state,d,{actor,projects,users,now:new Date().toISOString()});reject(Buffer.byteLength(JSON.stringify(state))<=4*1024*1024,'Limite do histórico de manutenção atingido.',507);await tx.$executeRaw`UPDATE ss_app_v1.workspaces SET maintenance=${JSON.stringify(state)}::jsonb,updated_at=${BigInt(Date.now())} WHERE organization_id=${actor.organizationId}`;await this.audit(tx,actor,'maintenance.'+d.type,d.payload?.id);}
 const visible=maintenanceView(state,actor);return {state:visible,actor,projects:projects.map(p=>({id:p.id,name:p.name,units:p.units.map(u=>({id:u.id,name:u.name}))})),users:actor.role==='maintenance'?users.filter(u=>u.id===actor.id):users};});}
 async uploadMaintenancePhotos(actor,d){
  await this.db.$transaction(async tx=>{
   actor=await freshActor(tx,actor);requireModule(actor,'maintenance');
   reject(d&&typeof d==='object'&&!Array.isArray(d)&&Object.keys(d).every(k=>['id','revision','photos'].includes(k)),'Envio de fotos inválido.');
   const row=await this.row(tx,actor),ticket=row.maintenance.tickets.find(t=>t.id===d.id);
   reject(ticket&&(actor.role!=='maintenance'||ticket.assigneeId===actor.id),'Chamado não encontrado.',404);
   reject(ticket.status!=='cancelled','Reabra o chamado cancelado antes de enviar fotos.');
   reject(d.revision===row.maintenance.revision,'A manutenção foi atualizada. Atualize antes de enviar fotos.',409);
   reject(Array.isArray(d.photos)&&d.photos.length>0&&d.photos.length<=MAINTENANCE_PHOTO_LIMITS.perUpload,'Selecione de 1 a 6 fotos.');
   reject((ticket.photos||[]).length+d.photos.length<=MAINTENANCE_PHOTO_LIMITS.perTicket,'O chamado aceita até 20 fotos.',413);
   const images=d.photos.map(p=>{reject(p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).every(k=>['base64','caption'].includes(k)),'Foto inválida.');return {...jpeg(p.base64),id:randomUUID(),caption:p.caption??''};});
   const bytes=images.reduce((n,p)=>n+p.bytes,0),[quota]=await tx.$queryRaw`SELECT bytes FROM ss_app_v1.maintenance_photo_quota WHERE id=1 FOR UPDATE`;
   const [organization]=await tx.$queryRaw`SELECT COALESCE(SUM(bytes),0) AS bytes FROM ss_app_v1.maintenance_photos WHERE organization_id=${actor.organizationId}`;
   reject(Number(organization.bytes)+bytes<=MAINTENANCE_PHOTO_LIMITS.organizationBytes,'Limite de armazenamento de fotos de manutenção da empresa atingido.',507);
   reject(Number(quota.bytes)+bytes<=MAINTENANCE_PHOTO_LIMITS.totalBytes,'Armazenamento de fotos de manutenção indisponível no momento.',507);
   const state=maintenanceCommand(row.maintenance,{type:'ticket-photos',revision:d.revision,payload:{id:ticket.id,photos:images.map(({id,width,height,bytes,caption})=>({id,width,height,bytes,caption}))}},{actor,now:new Date().toISOString()});
   reject(Buffer.byteLength(JSON.stringify(state))<=4*1024*1024,'Limite do histórico de manutenção atingido.',507);
   for(const photo of images)await tx.$executeRaw`INSERT INTO ss_app_v1.maintenance_photos(id,organization_id,ticket_id,data,bytes,created_at) VALUES(${photo.id},${actor.organizationId},${ticket.id},${photo.data},${photo.bytes},${BigInt(Date.now())})`;
   await tx.$executeRaw`UPDATE ss_app_v1.maintenance_photo_quota SET bytes=bytes+${BigInt(bytes)} WHERE id=1`;
   await tx.$executeRaw`UPDATE ss_app_v1.workspaces SET maintenance=${JSON.stringify(state)}::jsonb,updated_at=${BigInt(Date.now())} WHERE organization_id=${actor.organizationId}`;
   await this.audit(tx,actor,'maintenance.ticket-photos',ticket.id);
  });return this.maintenance(actor);
 }
 async maintenancePhoto(actor,id){return this.db.$transaction(async tx=>{
  actor=await freshActor(tx,actor);requireModule(actor,'maintenance');uuid(id);
  const row=await this.row(tx,actor),ticket=row.maintenance.tickets.find(t=>(t.photos||[]).some(p=>p.id===id));
  reject(ticket&&(actor.role!=='maintenance'||ticket.assigneeId===actor.id),'Foto não encontrada.',404);
  const [photo]=await tx.$queryRaw`SELECT data FROM ss_app_v1.maintenance_photos WHERE id=${id} AND organization_id=${actor.organizationId} AND ticket_id=${ticket.id}`;
  reject(photo,'Foto não encontrada.',404);return Buffer.from(photo.data);
 });}
 async connectBoard(actor,d){return this.db.$transaction(async tx=>{actor=await freshActor(tx,actor,d.legacy?['admin']:['admin','manager']);reject(['diary','documents','reminders'].some(id=>canAccess(actor,id)),'O Diretor não liberou o acompanhamento online.',403);const row=await this.row(tx,actor),project=row.financial.projects.find(p=>p.id===d.projectId&&!p.trashedAt);reject(project,'Empreendimento não encontrado.',404);const [existing]=await tx.$queryRaw`SELECT * FROM ss_app_v1.board_links WHERE organization_id=${actor.organizationId} AND project_id=${project.id}`;if(existing)return {id:existing.board_id,projectId:project.id,account:true};let boardId;
 if(d.legacy){const [board]=await tx.$queryRaw`SELECT * FROM ss_diary_v1.boards WHERE id=${d.legacy.id} FOR UPDATE`;reject(board&&roleFor(board,d.legacy.ownerToken)==='owner','Comprove o acesso de gestor do diário antigo.',403);boardId=board.id;const [claimed]=await tx.$queryRaw`SELECT organization_id FROM ss_app_v1.board_links WHERE board_id=${boardId}`;reject(!claimed,'Diário já vinculado a uma conta.',409);}
 else{const token=()=>randomBytes(32).toString('base64url');boardId=randomUUID();await new DiaryService({$transaction:fn=>fn(tx)}).create({id:boardId,metadata:metadata({name:project.name,location:[project.neighborhood,project.zone].join(' · '),units:project.units,stages:project.stages}),ownerToken:token(),writerToken:token(),readerToken:token()},'account-'+actor.organizationId);}
 await tx.$executeRaw`INSERT INTO ss_app_v1.board_links VALUES(${boardId},${actor.organizationId},${project.id})`;await this.audit(tx,actor,'board.claim',boardId);return {id:boardId,projectId:project.id,account:true};});}
}
