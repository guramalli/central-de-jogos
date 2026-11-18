import {canAccess} from './access-domain.mjs';
import {IdentityService,identitySchema} from './identity-service.mjs';
import {workspaceSchema} from './account-schema.mjs';
import {reminderSchema,readReminders} from './reminder-service.mjs';
import {documentSchema,readLibrary} from './document-service.mjs';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
export const LIMITS={photoBytes:450000,photoSide:1600,photosPerPost:6,photosPerBoard:80,boardBytes:24*1024*1024,totalBytes:256*1024*1024,boards:200,posts:300};
export function fail(ok,message,status=422){if(!ok){const e=new Error(message);e.status=status;throw e;}}
const hash=s=>createHash('sha256').update(s).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function tokenHash(token){fail(typeof token==='string'&&/^[A-Za-z0-9_-]{43}$/.test(token),'Link de acesso inválido.',401);return hash(token);}
export function roleFor(board,token){const h=tokenHash(token);if(equal(h,board.owner_hash))return 'owner';if(equal(h,board.writer_hash))return 'writer';if(equal(h,board.reader_hash))return 'reader';fail(false,'Link inválido ou revogado. Peça um novo link ao responsável.',401);}
export function uuid(s){fail(typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(s),'Identificador inválido.');return s;}
function text(s,label,max,required=true){fail(typeof s==='string'&&s.length<=max&&(!required||s.trim()),`${label}: preencha até ${max} caracteres.`);return s.trim();}
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function date(s){fail(typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s&&s<=today(),'Data da atualização inválida ou futura.');return s;}
export function metadata(d){
  const rows=(list,label,max)=>{fail(Array.isArray(list)&&list.length>0&&list.length<=max,`${label}: quantidade inválida.`);const ids=new Set();return list.map(x=>{const id=text(x.id,'Identificador',80);fail(!ids.has(id),'Identificador repetido.');ids.add(id);return {id,name:text(x.name,label,120)};});};
  return {name:text(d.name,'Empreendimento',150),location:text(d.location||'','Localização',220,false),stages:rows(d.stages,'Etapas',80),units:rows(d.units,'Unidades',100)};
}
export function jpeg(base64){
  fail(typeof base64==='string'&&base64.length<=Math.ceil(LIMITS.photoBytes/3)*4&&/^[A-Za-z0-9+/]+={0,2}$/.test(base64),'Imagem inválida ou maior que 450 KB.');
  const data=Buffer.from(base64,'base64');fail(data.toString('base64')===base64&&data.length>=20&&data.length<=LIMITS.photoBytes&&data[0]===255&&data[1]===216&&data.at(-2)===255&&data.at(-1)===217,'Envie uma fotografia JPEG válida.');
  let at=2,width=0,height=0,sos=false;while(at<data.length-2){fail(data[at]===255,'JPEG malformado.');while(data[at]===255)at++;const marker=data[at++];if(marker===0xd9)break;fail(at+2<=data.length,'JPEG incompleto.');const len=data.readUInt16BE(at);fail(len>=2&&at+len<=data.length-2,'JPEG incompleto.');
    // Canvas-generated images carry no EXIF/IPTC/comment metadata. Reject metadata-bearing originals.
    fail(![0xe1,0xed,0xfe].includes(marker),'A foto deve passar pela preparação de privacidade antes de enviar.');
    if([0xc0,0xc1,0xc2].includes(marker)){fail(len>=8,'JPEG sem dimensões.');height=data.readUInt16BE(at+3);width=data.readUInt16BE(at+5);}
    if(marker===0xda){sos=true;break;}at+=len;
  }
  fail(sos&&width>0&&height>0&&width<=LIMITS.photoSide&&height<=LIMITS.photoSide,'Dimensões inválidas. Prepare a foto novamente.');return {data,width,height,bytes:data.length};
}
export function entryInput(d,board){
  const m=board.metadata,st=m.stages.find(x=>x.id===d.stageId),unit=d.unitId?m.units.find(x=>x.id===d.unitId):null;fail(st&&(!d.unitId||unit),'Etapa ou unidade não pertence a este diário.');
  fail(['progress','done','attention'].includes(d.status),'Situação inválida.');fail(Number.isInteger(d.progress)&&d.progress>=0&&d.progress<=100,'Avanço deve ser de 0 a 100%.');
  fail(Array.isArray(d.photos)&&d.photos.length>0&&d.photos.length<=LIMITS.photosPerPost,'Selecione de 1 a 6 fotos.');
  const photos=d.photos.map(photo=>({...jpeg(photo.base64),caption:text(photo.caption||'','Legenda',240,false)}));
  return {id:uuid(d.id),payload:{date:date(d.date),stageId:st.id,stageName:st.name,unitId:unit?.id||'',unitName:unit?.name||'Áreas comuns / empreendimento',author:text(d.author,'Responsável informado',150),...(board.actor?{authorUserId:board.actor.id}:{}),note:text(d.note||'','Observações',3000,false),status:d.status,progress:d.progress},photos,requestHash:hash(JSON.stringify(d))};
}
export const schemaStatements=[
  'CREATE SCHEMA IF NOT EXISTS ss_diary_v1',
  'CREATE TABLE IF NOT EXISTS ss_diary_v1.quota (id INTEGER PRIMARY KEY CHECK(id=1), boards INTEGER NOT NULL DEFAULT 0, bytes BIGINT NOT NULL DEFAULT 0)',
  'INSERT INTO ss_diary_v1.quota (id) VALUES(1) ON CONFLICT DO NOTHING',
  'CREATE TABLE IF NOT EXISTS ss_diary_v1.boards (id TEXT PRIMARY KEY, metadata JSONB NOT NULL, owner_hash TEXT NOT NULL, writer_hash TEXT NOT NULL, reader_hash TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS ss_diary_v1.entries (id TEXT PRIMARY KEY, board_id TEXT NOT NULL REFERENCES ss_diary_v1.boards(id), payload JSONB NOT NULL, request_hash TEXT NOT NULL, archived BOOLEAN NOT NULL DEFAULT FALSE, reason TEXT NOT NULL DEFAULT \'\', created_at BIGINT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS diary_entries_board ON ss_diary_v1.entries(board_id,created_at DESC)',
  'CREATE TABLE IF NOT EXISTS ss_diary_v1.photos (id TEXT PRIMARY KEY, board_id TEXT NOT NULL REFERENCES ss_diary_v1.boards(id), entry_id TEXT NOT NULL REFERENCES ss_diary_v1.entries(id), content BYTEA NOT NULL, bytes INTEGER NOT NULL CHECK(bytes>0 AND bytes<=450000), width INTEGER NOT NULL, height INTEGER NOT NULL, caption TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS diary_photos_board ON ss_diary_v1.photos(board_id)',
  'CREATE TABLE IF NOT EXISTS ss_diary_v1.creation_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires BIGINT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS ss_diary_v1.audit (id TEXT PRIMARY KEY, board_id TEXT NOT NULL REFERENCES ss_diary_v1.boards(id), action TEXT NOT NULL, actor_role TEXT NOT NULL, subject TEXT NOT NULL, created_at BIGINT NOT NULL)',
  'ALTER TABLE ss_diary_v1.audit ADD COLUMN IF NOT EXISTS actor_user_id TEXT'
];
export async function migrate(db){for(const sql of [...schemaStatements,...reminderSchema,...documentSchema,...identitySchema,...workspaceSchema])await db.$executeRawUnsafe(sql);}
export class DiaryService{
  constructor(db){this.db=db;}
  async health(){await this.db.$queryRaw`SELECT id FROM ss_diary_v1.quota WHERE id=1`;return {ok:true,version:6,limits:LIMITS};}
  async board(db,id,token,write=false,owner=false,lock=false,requiredModule=null){uuid(id);const rows=lock?await db.$queryRaw`SELECT * FROM ss_diary_v1.boards WHERE id=${id} FOR UPDATE`:await db.$queryRaw`SELECT * FROM ss_diary_v1.boards WHERE id=${id}`;fail(rows.length,'Diário não encontrado ou acesso inválido.',404);const b=rows[0],links=await db.$queryRaw`SELECT organization_id,project_id FROM ss_app_v1.board_links WHERE board_id=${id}`;let role,actor;
 if(typeof token==='string'&&token.startsWith('session.')){actor=await new IdentityService(db).authenticate(token.slice(8));fail(links.length&&links[0].organization_id===actor.organizationId&&['admin','manager','maintenance'].includes(actor.role)&&['diary','documents','reminders'].some(moduleId=>canAccess(actor,moduleId)),'Seu acesso não permite consultar este acompanhamento.',403);fail(!requiredModule||canAccess(actor,requiredModule),'Seu acesso não permite este módulo.',403);role=actor.role==='admin'?'owner':actor.role==='manager'?'writer':'reader';}
 else{fail(!links.length,'Este diário agora exige login individual.',401);role=roleFor(b,token);}
 fail(!write||['owner','writer'].includes(role),'Este acesso permite somente consulta.',403);fail(!owner||role==='owner','Somente o administrador pode realizar esta ação.',403);return {...b,role,actor};}

  async create(d,ip){
    const id=uuid(d.id),m=metadata(d.metadata),owner=tokenHash(d.ownerToken),writer=tokenHash(d.writerToken),reader=tokenHash(d.readerToken);fail(new Set([owner,writer,reader]).size===3,'Os acessos devem ser diferentes.');
    return this.db.$transaction(async tx=>{const [quota]=await tx.$queryRaw`SELECT * FROM ss_diary_v1.quota WHERE id=1 FOR UPDATE`;const exists=await tx.$queryRaw`SELECT owner_hash FROM ss_diary_v1.boards WHERE id=${id}`;if(exists.length){fail(equal(exists[0].owner_hash,owner),'Identificador já utilizado.',409);return {id};}
      fail(quota.boards<LIMITS.boards,'Limite do ambiente de testes atingido. Solicite ampliação ao administrador.',507);
      const now=Date.now(),key=hash('diary-create:'+ip+':'+Math.floor(now/86400000));await tx.$executeRaw`DELETE FROM ss_diary_v1.creation_limits WHERE expires<${BigInt(now)}`;
      const rows=await tx.$queryRaw`SELECT count FROM ss_diary_v1.creation_limits WHERE key=${key}`;fail(!rows.length||rows[0].count<20,'Limite de criação por rede atingido hoje. Continue nos diários existentes.',429);
      await tx.$executeRaw`INSERT INTO ss_diary_v1.creation_limits VALUES(${key},1,${BigInt(now+86400000)}) ON CONFLICT(key) DO UPDATE SET count=ss_diary_v1.creation_limits.count+1`;
      await tx.$executeRaw`INSERT INTO ss_diary_v1.boards(id,metadata,owner_hash,writer_hash,reader_hash,created_at,updated_at) VALUES(${id},${JSON.stringify(m)}::jsonb,${owner},${writer},${reader},${BigInt(now)},${BigInt(now)})`;
      await tx.$executeRaw`UPDATE ss_diary_v1.quota SET boards=boards+1 WHERE id=1`;return {id};
    });
  }
  async read(id,token){const b=await this.board(this.db,id,token),allowed=moduleId=>!b.actor||canAccess(b.actor,moduleId);
    const result={id,metadata:metadata(b.metadata),role:b.role,...(b.actor?{modules:b.actor.modules}:{}),revision:b.revision,createdAt:Number(b.created_at),updatedAt:Number(b.updated_at)};
    if(allowed('diary')){
      const entries=await this.db.$queryRaw`SELECT id,payload,archived,reason,created_at FROM ss_diary_v1.entries WHERE board_id=${id} ORDER BY created_at DESC`;
      const photos=await this.db.$queryRaw`SELECT id,entry_id,bytes,width,height,caption FROM ss_diary_v1.photos WHERE board_id=${id}`;
      result.limits=LIMITS;result.usage={photos:photos.length,bytes:photos.reduce((n,p)=>n+p.bytes,0)};
      result.entries=entries.filter(e=>!e.archived||b.role==='owner').map(e=>({id:e.id,...e.payload,archived:e.archived,reason:e.reason,createdAt:Number(e.created_at),photos:photos.filter(p=>p.entry_id===e.id).map(({entry_id,...p})=>p)}));
    }
    if(allowed('documents'))result.library=await readLibrary(this.db,id,b.role,b.actor);
    if(allowed('reminders'))result.reminders=await readReminders(this.db,id,b.actor);
    return result;
  }
  async photo(id,photoId,token){await this.board(this.db,id,token,false,false,false,'diary');uuid(photoId);const rows=await this.db.$queryRaw`SELECT p.content FROM ss_diary_v1.photos p JOIN ss_diary_v1.entries e ON e.id=p.entry_id WHERE p.board_id=${id} AND p.id=${photoId} AND e.archived=FALSE`;fail(rows.length,'Foto não disponível.',404);return Buffer.from(rows[0].content);}
  async publish(id,token,d){const initial=await this.board(this.db,id,token,true,false,false,'diary'),parsed=entryInput(initial.actor?{...d,author:initial.actor.name,authorUserId:initial.actor.id}:d,initial),bytes=parsed.photos.reduce((n,p)=>n+p.bytes,0);
    return this.db.$transaction(async tx=>{
      const [quota]=await tx.$queryRaw`SELECT * FROM ss_diary_v1.quota WHERE id=1 FOR UPDATE`;const b=await this.board(tx,id,token,true,false,true,'diary');const existing=await tx.$queryRaw`SELECT board_id,request_hash FROM ss_diary_v1.entries WHERE id=${parsed.id}`;
      if(existing.length){fail(existing[0].board_id===id&&existing[0].request_hash===parsed.requestHash,'Esta atualização já foi enviada com conteúdo diferente.',409);return {id:parsed.id,repeated:true};}
      const [stats]=await tx.$queryRaw`SELECT count(*)::int AS count,COALESCE(sum(bytes),0)::bigint AS bytes FROM ss_diary_v1.photos WHERE board_id=${id}`;
      const [posts]=await tx.$queryRaw`SELECT count(*)::int AS count FROM ss_diary_v1.entries WHERE board_id=${id}`;
      fail(stats.count+parsed.photos.length<=LIMITS.photosPerBoard&&Number(stats.bytes)+bytes<=LIMITS.boardBytes&&posts.count<LIMITS.posts,'Este diário atingiu o limite de testes (80 fotos / 24 MB). Solicite ampliação.',507);fail(Number(quota.bytes)+bytes<=LIMITS.totalBytes,'Armazenamento de testes cheio. Nenhuma foto foi publicada.',507);
      const now=Date.now();await tx.$executeRaw`INSERT INTO ss_diary_v1.entries(id,board_id,payload,request_hash,created_at) VALUES(${parsed.id},${id},${JSON.stringify(parsed.payload)}::jsonb,${parsed.requestHash},${BigInt(now)})`;
      for(const p of parsed.photos)await tx.$executeRaw`INSERT INTO ss_diary_v1.photos(id,board_id,entry_id,content,bytes,width,height,caption) VALUES(${randomUUID()},${id},${parsed.id},${p.data},${p.bytes},${p.width},${p.height},${p.caption})`;
      await tx.$executeRaw`UPDATE ss_diary_v1.boards SET revision=revision+1,updated_at=${BigInt(now)} WHERE id=${id}`;await tx.$executeRaw`UPDATE ss_diary_v1.quota SET bytes=bytes+${BigInt(bytes)} WHERE id=1`;await tx.$executeRaw`INSERT INTO ss_diary_v1.audit(id,board_id,action,actor_role,subject,created_at,actor_user_id) VALUES(${randomUUID()},${id},'publish',${b.role},${parsed.id},${BigInt(now)},${b.actor?.id||null})`;return {id:parsed.id};
    },{timeout:15000});
  }
  async manage(id,token,d){return this.db.$transaction(async tx=>{const b=await this.board(tx,id,token,true,true,true,'diary');fail(Number.isInteger(d.revision)&&d.revision===b.revision,'O diário mudou. Atualize e tente novamente.',409);const now=Date.now();let result={ok:true};
    if(d.action==='archive'||d.action==='restore'){uuid(d.entryId);const reason=text(d.reason,'Justificativa',500);const changed=await tx.$executeRaw`UPDATE ss_diary_v1.entries SET archived=${d.action==='archive'},reason=${reason} WHERE id=${d.entryId} AND board_id=${id}`;fail(changed===1,'Atualização não encontrada.',404);}
    else if(d.action==='rotate'){const writer=tokenHash(d.writerToken),reader=tokenHash(d.readerToken);fail(writer!==reader&&writer!==b.owner_hash&&reader!==b.owner_hash,'Acessos devem ser diferentes.');await tx.$executeRaw`UPDATE ss_diary_v1.boards SET writer_hash=${writer},reader_hash=${reader} WHERE id=${id}`;}
    else if(d.action==='sync'){const m=metadata(d.metadata);for(const name of ['stages','units'])m[name]=[...m[name],...b.metadata[name].filter(x=>!m[name].some(y=>x.id===y.id))];metadata(m);await tx.$executeRaw`UPDATE ss_diary_v1.boards SET metadata=${JSON.stringify(m)}::jsonb WHERE id=${id}`;}
    else fail(false,'Ação inválida.');
    await tx.$executeRaw`UPDATE ss_diary_v1.boards SET revision=revision+1,updated_at=${BigInt(now)} WHERE id=${id}`;await tx.$executeRaw`INSERT INTO ss_diary_v1.audit(id,board_id,action,actor_role,subject,created_at,actor_user_id) VALUES(${randomUUID()},${id},${d.action},${b.role},${d.entryId||''},${BigInt(now)},${b.actor?.id||null})`;return result;
  });}
}
