import {commercialSchema} from './commercial-schema.mjs';
import {initializeCommercial,assertCommercialAccess} from './commercial-service.mjs';
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
  const data=Buffer.from(base64,'base64');
  fail(data.toString('base64')===base64&&data.length>=20&&data.length<=LIMITS.photoBytes&&data[0]===0xff&&data[1]===0xd8,'Envie uma fotografia JPEG válida.');
  const valid=condition=>fail(condition,'JPEG malformado ou incompleto. Prepare a foto novamente.');
  const frames=new Set([0xc0,0xc1,0xc2]),components=new Set();
  let at=2,width=0,height=0,frame=0,scans=0,ended=false;
  // Structural framing only, not pixel/Huffman decoding. Traverse every scan so metadata
  // cannot evade the privacy policy by appearing after the first SOS.
  while(at<data.length){
    valid(data[at++]===0xff);
    while(at<data.length&&data[at]===0xff)at++;
    valid(at<data.length);
    const marker=data[at++];
    if(marker===0xd9){valid(frame&&scans&&at===data.length);ended=true;break;}
    valid(frames.has(marker)||[0xc4,0xdb,0xdd,0xda].includes(marker)||marker>=0xe0&&marker<=0xef||marker===0xfe);
    valid(at+2<=data.length);
    const length=data.readUInt16BE(at),end=at+length;
    valid(length>=2&&end<=data.length);
    // Reject EXIF/XMP, IPTC/Photoshop and comments wherever their segments occur.
    fail(![0xe1,0xed,0xfe].includes(marker),'A foto deve passar pela preparação de privacidade antes de enviar.');
    if(frames.has(marker)){
      valid(!frame&&!scans&&length>=11);
      const count=data[at+7];height=data.readUInt16BE(at+3);width=data.readUInt16BE(at+5);
      valid(data[at+2]===8&&count>=1&&count<=4&&length===8+3*count);
      fail(width>0&&height>0&&width<=LIMITS.photoSide&&height<=LIMITS.photoSide,'Dimensões inválidas. Prepare a foto novamente.');
      for(let index=0;index<count;index++){
        const offset=at+8+3*index,id=data[offset],sampling=data[offset+1];
        valid(!components.has(id)&&(sampling>>4)>=1&&(sampling>>4)<=4&&(sampling&15)>=1&&(sampling&15)<=4&&data[offset+2]<=3);
        components.add(id);
      }
      frame=marker;
    }
    if(marker===0xdb){
      let cursor=at+2;valid(cursor<end);
      while(cursor<end){
        const table=data[cursor++],precision=table>>4;valid(precision<=1&&(table&15)<=3);
        cursor+=64*(precision+1);valid(cursor<=end);
      }
    }
    if(marker===0xc4){
      let cursor=at+2;valid(cursor<end);
      while(cursor<end){
        const table=data[cursor++];valid((table>>4)<=1&&(table&15)<=3&&cursor+16<=end);
        let symbols=0,slots=1;
        for(let index=0;index<16;index++){const count=data[cursor++];symbols+=count;slots=slots*2-count;valid(slots>=0);}
        valid(symbols>0&&symbols<=256&&cursor+symbols<=end);cursor+=symbols;
      }
    }
    if(marker===0xdd)valid(length===4);
    if(marker===0xda){
      const count=data[at+2];valid(frame&&count>=1&&count<=components.size&&length===6+2*count);
      const selected=new Set();
      for(let index=0;index<count;index++){
        const id=data[at+3+2*index],tables=data[at+4+2*index];
        valid(components.has(id)&&!selected.has(id)&&(tables>>4)<=3&&(tables&15)<=3);selected.add(id);
      }
      const start=data[end-3],finish=data[end-2],approximation=data[end-1],high=approximation>>4,low=approximation&15;
      valid(start<=finish&&finish<=63);
      if(frame===0xc2)valid((start===0?finish===0:count===1)&&high<=13&&low<=13&&(high===0||high===low+1));
      else valid(start===0&&finish===63&&approximation===0);
    }
    at=end;if(marker!==0xda)continue;
    scans++;let entropy=false;
    while(at<data.length){
      if(data[at]!==0xff){entropy=true;at++;continue;}
      const candidate=at++;
      while(at<data.length&&data[at]===0xff)at++;
      valid(at<data.length);
      const code=data[at];
      if(code===0x00){valid(at===candidate+1);entropy=true;at++;continue;}
      if(code>=0xd0&&code<=0xd7){at++;continue;}
      at=candidate;break;
    }
    valid(entropy&&at<data.length);
  }
  valid(ended);
  return {data,width,height,bytes:data.length};
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
export async function migrate(db){for(const sql of [...schemaStatements,...reminderSchema,...documentSchema,...identitySchema,...workspaceSchema,...commercialSchema])await db.$executeRawUnsafe(sql);await initializeCommercial(db);}
export class DiaryService{
  constructor(db){this.db=db;}
  async health(){await this.db.$queryRaw`SELECT id FROM ss_diary_v1.quota WHERE id=1`;return {ok:true,version:15,limits:LIMITS};}
  async board(db,id,token,write=false,owner=false,lock=false,requiredModule=null){uuid(id);const rows=lock?await db.$queryRaw`SELECT * FROM ss_diary_v1.boards WHERE id=${id} FOR UPDATE`:await db.$queryRaw`SELECT * FROM ss_diary_v1.boards WHERE id=${id}`;fail(rows.length,'Diário não encontrado ou acesso inválido.',404);const b=rows[0],links=await db.$queryRaw`SELECT organization_id,project_id FROM ss_app_v1.board_links WHERE board_id=${id}`;let role,actor;
 if(typeof token==='string'&&token.startsWith('session.')){actor=await new IdentityService(db).authenticate(token.slice(8));await assertCommercialAccess(db,actor);fail(links.length&&links[0].organization_id===actor.organizationId&&['admin','manager','maintenance'].includes(actor.role)&&['diary','documents','reminders'].some(moduleId=>canAccess(actor,moduleId)),'Seu acesso não permite consultar este acompanhamento.',403);fail(!requiredModule||canAccess(actor,requiredModule),'Seu acesso não permite este módulo.',403);role=actor.role==='admin'?'owner':actor.role==='manager'?'writer':'reader';}
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
