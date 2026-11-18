import {canAccess} from './access-domain.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {fail,uuid,LIMITS,jpeg} from './diary-service.mjs';
export const DOCUMENT_LIMITS={fileBytes:20*1048576,boardBytes:64*1048576,chunkBytes:512*1024,files:100,folders:40,depth:5};
export const DOCUMENT_TYPES={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',pdf:'application/pdf',dwg:'application/octet-stream',dxf:'application/octet-stream',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',txt:'text/plain',csv:'text/csv',zip:'application/zip'};
const sha=b=>createHash('sha256').update(b).digest('hex');
const clean=(s,label,max,required=true)=>{fail(typeof s==='string'&&s.length<=max&&(!required||s.trim())&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s),`${label}: preencha até ${max} caracteres.`);return s.trim();};
export function uploadInput(d){
  const name=clean(d.name,'Nome do arquivo',180);fail(!/[\\/]/.test(name),'Nome do arquivo inválido.');const ext=name.split('.').at(-1).toLowerCase();fail(Object.hasOwn(DOCUMENT_TYPES,ext),'Formato não suportado. Use imagens, PDF, DWG, DXF, Office, TXT, CSV ou ZIP.');
  fail(Number.isInteger(d.size)&&d.size>0&&d.size<=DOCUMENT_LIMITS.fileBytes,'Cada arquivo pode ter de 1 byte a 20 MB.');fail(typeof d.sha256==='string'&&/^[a-f0-9]{64}$/.test(d.sha256),'Assinatura do arquivo inválida.');
  return {id:uuid(d.id),folderId:d.folderId?uuid(d.folderId):null,name,ext,mime:DOCUMENT_TYPES[ext],size:d.size,sha256:d.sha256,title:clean(d.title||name,'Título',180),note:clean(d.note||'','Descrição',1500,false),author:clean(d.author||'','Responsável informado',100,false)};
}
export function validSignature(bytes,ext){
  const head=bytes.subarray(0,1024),s=head.toString('latin1');let ok=false;
  if(['jpg','jpeg'].includes(ext))ok=bytes[0]===255&&bytes[1]===216&&bytes.at(-2)===255&&bytes.at(-1)===217;
  else if(ext==='png')ok=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  else if(ext==='webp')ok=s.startsWith('RIFF')&&s.slice(8,12)==='WEBP';
  else if(ext==='pdf')ok=s.includes('%PDF-');
  else if(ext==='dwg')ok=/^AC\d{4}/.test(s);
  else if(ext==='dxf')ok=s.startsWith('AutoCAD Binary DXF')||/^\s*0\s+SECTION\s/i.test(s);
  else if(['doc','xls','ppt'].includes(ext))ok=head.subarray(0,8).equals(Buffer.from('d0cf11e0a1b11ae1','hex'));
  else if(['zip','docx','xlsx','pptx'].includes(ext))ok=head[0]===80&&head[1]===75&&[3,5,7].includes(head[2]);
  else if(['txt','csv'].includes(ext))ok=!head.includes(0)&&!s.startsWith('MZ');
  fail(ok,'O conteúdo não corresponde ao formato informado. Confira o arquivo original.');
}
export const documentSchema=[
  'CREATE TABLE IF NOT EXISTS ss_diary_v1.doc_folders (id TEXT PRIMARY KEY,board_id TEXT NOT NULL REFERENCES ss_diary_v1.boards(id),parent_id TEXT REFERENCES ss_diary_v1.doc_folders(id),name TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0)',
  'CREATE INDEX IF NOT EXISTS doc_folders_board ON ss_diary_v1.doc_folders(board_id)',
  "CREATE TABLE IF NOT EXISTS ss_diary_v1.doc_files (id TEXT PRIMARY KEY,board_id TEXT NOT NULL REFERENCES ss_diary_v1.boards(id),folder_id TEXT REFERENCES ss_diary_v1.doc_folders(id),payload JSONB NOT NULL,request_hash TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'pending',shared BOOLEAN NOT NULL DEFAULT FALSE,archived BOOLEAN NOT NULL DEFAULT FALSE,revision INTEGER NOT NULL DEFAULT 0,created_at BIGINT NOT NULL,expires BIGINT NOT NULL)",
  'CREATE INDEX IF NOT EXISTS doc_files_board ON ss_diary_v1.doc_files(board_id)',
  'CREATE TABLE IF NOT EXISTS ss_diary_v1.doc_parts (file_id TEXT NOT NULL REFERENCES ss_diary_v1.doc_files(id),part INTEGER NOT NULL,content BYTEA NOT NULL,sha256 TEXT NOT NULL,PRIMARY KEY(file_id,part))',
  'CREATE TABLE IF NOT EXISTS ss_diary_v1.doc_covers (board_id TEXT PRIMARY KEY REFERENCES ss_diary_v1.boards(id),file_id TEXT NOT NULL REFERENCES ss_diary_v1.doc_files(id),content BYTEA NOT NULL,bytes INTEGER NOT NULL CHECK(bytes>0 AND bytes<=100000))'
];
const mapFile=f=>({id:f.id,folderId:f.folder_id,...f.payload,shared:f.shared,archived:f.archived,revision:f.revision,createdAt:Number(f.created_at)});
export async function readLibrary(db,id,role,actor=null){
  fail(!actor||canAccess(actor,'documents'),'Seu acesso não permite este módulo.',403);
  let folders=await db.$queryRaw`SELECT id,parent_id AS "parentId",name,revision FROM ss_diary_v1.doc_folders WHERE board_id=${id} ORDER BY lower(name)`;
  const all=await db.$queryRaw`SELECT * FROM ss_diary_v1.doc_files WHERE board_id=${id} AND state='ready' ORDER BY created_at DESC`;
  const files=all.filter(f=>role==='owner'||(!f.archived&&(role==='writer'||actor||f.shared))).map(mapFile);
  if(role==='reader'){const allowed=new Set();for(const f of files){let at=f.folderId;while(at&&!allowed.has(at)){allowed.add(at);at=folders.find(x=>x.id===at)?.parentId;}}folders=folders.filter(f=>allowed.has(f.id));}
  const [usage]=await db.$queryRaw`SELECT COALESCE(sum((payload->>'size')::bigint),0)::bigint AS bytes FROM ss_diary_v1.doc_files WHERE board_id=${id} AND state IN ('pending','ready')`;
  const [cover]=await db.$queryRaw`SELECT file_id,bytes FROM ss_diary_v1.doc_covers WHERE board_id=${id}`;
  const visibleCover=cover&&files.some(f=>f.id===cover.file_id&&!f.archived)?{fileId:cover.file_id}:null;
  return {folders,files,cover:visibleCover,limits:DOCUMENT_LIMITS,usage:role==='reader'?null:{bytes:Number(usage.bytes)+(cover?.bytes||0),files:all.length}};
}
export async function setProjectCover(service,id,token,d){return service.db.$transaction(async tx=>{
  const [quota]=await tx.$queryRaw`SELECT * FROM ss_diary_v1.quota WHERE id=1 FOR UPDATE`;
  const b=await service.board(tx,id,token,true,true,true,'documents');fail(d.revision===b.revision,'O empreendimento mudou. Atualize antes de escolher a foto.',409);
  const [old]=await tx.$queryRaw`SELECT bytes FROM ss_diary_v1.doc_covers WHERE board_id=${id}`;let bytes=0;
  if(d.fileId){uuid(d.fileId);const [f]=await tx.$queryRaw`SELECT payload FROM ss_diary_v1.doc_files WHERE board_id=${id} AND id=${d.fileId} AND state='ready' AND archived=FALSE`;
    fail(f&&['jpg','jpeg','png','webp'].includes(f.payload.ext),'Escolha uma imagem ativa deste empreendimento.',422);
    const thumb=jpeg(d.base64);fail(thumb.bytes<=100000&&thumb.width<=512&&thumb.height<=512,'A miniatura deve ter até 512 pixels e 100 KB.');bytes=thumb.bytes;
    fail(Number(quota.bytes)+bytes-(old?.bytes||0)<=LIMITS.totalBytes,'Armazenamento de testes cheio.',507);
    const [usage]=await tx.$queryRaw`SELECT COALESCE(sum((payload->>'size')::bigint),0)::bigint AS bytes FROM ss_diary_v1.doc_files WHERE board_id=${id} AND state IN ('pending','ready')`;
    fail(Number(usage.bytes)+bytes<=DOCUMENT_LIMITS.boardBytes,'Armazenamento do empreendimento cheio.',507);
    await tx.$executeRaw`INSERT INTO ss_diary_v1.doc_covers VALUES(${id},${d.fileId},${thumb.data},${bytes}) ON CONFLICT(board_id) DO UPDATE SET file_id=EXCLUDED.file_id,content=EXCLUDED.content,bytes=EXCLUDED.bytes`;
  }else{fail(d.fileId===null,'Escolha a foto ou remova a seleção.');await tx.$executeRaw`DELETE FROM ss_diary_v1.doc_covers WHERE board_id=${id}`;}
  await tx.$executeRaw`UPDATE ss_diary_v1.quota SET bytes=bytes+${BigInt(bytes-(old?.bytes||0))} WHERE id=1`;
  await changed(tx,id,b,d.fileId?'project-photo-set':'project-photo-clear',d.fileId||'');return {ok:true};
});}
export async function projectCover(service,id,token){const b=await service.board(service.db,id,token,false,false,false,'documents');const [cover]=await service.db.$queryRaw`SELECT c.content,f.shared FROM ss_diary_v1.doc_covers c JOIN ss_diary_v1.doc_files f ON f.id=c.file_id AND f.board_id=c.board_id WHERE c.board_id=${id} AND f.state='ready' AND f.archived=FALSE`;
  fail(cover&&(b.role!=='reader'||b.actor||cover.shared),'Foto do empreendimento indisponível.',404);return Buffer.from(cover.content);
}
async function changed(tx,id,board,action,subject){const now=BigInt(Date.now());await tx.$executeRaw`UPDATE ss_diary_v1.boards SET revision=revision+1,updated_at=${now} WHERE id=${id}`;await tx.$executeRaw`INSERT INTO ss_diary_v1.audit(id,board_id,action,actor_role,subject,created_at,actor_user_id) VALUES(${randomUUID()},${id},${action},${board.role},${subject},${now},${board.actor?.id||null})`;}
async function folderExists(tx,id,folderId){if(!folderId)return;const rows=await tx.$queryRaw`SELECT id FROM ss_diary_v1.doc_folders WHERE board_id=${id} AND id=${uuid(folderId)}`;fail(rows.length,'Pasta não encontrada neste empreendimento.',404);}
export async function changeFolder(service,id,token,d){return service.db.$transaction(async tx=>{
  const b=await service.board(tx,id,token,true,false,true,'documents'),name=clean(d.name,'Nome da pasta',80),fid=uuid(d.id),parent=d.parentId?uuid(d.parentId):null;
  const folders=await tx.$queryRaw`SELECT * FROM ss_diary_v1.doc_folders WHERE board_id=${id}`;const existing=folders.find(f=>f.id===fid);
  if(existing)fail(existing.revision===d.revision,'A pasta mudou. Atualize antes de renomear.',409);
  else{fail(folders.length<DOCUMENT_LIMITS.folders,'Limite de 40 pastas atingido.',507);let at=parent,depth=1;while(at){const f=folders.find(x=>x.id===at);fail(f,'Pasta de destino não encontrada.',404);at=f.parent_id;depth++;fail(depth<=DOCUMENT_LIMITS.depth,'Use até cinco níveis de pastas.');}}
  // Folder edits only rename; moving a whole subtree is deliberately not implicit.
  const destination=existing?existing.parent_id:parent;fail(!folders.some(f=>f.id!==fid&&f.parent_id===destination&&f.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')),'Já existe uma pasta com esse nome neste nível.',409);
  if(existing)await tx.$executeRaw`UPDATE ss_diary_v1.doc_folders SET name=${name},revision=revision+1 WHERE id=${fid}`;
  else await tx.$executeRaw`INSERT INTO ss_diary_v1.doc_folders(id,board_id,parent_id,name) VALUES(${fid},${id},${parent},${name})`;
  await changed(tx,id,b,'folder-save',fid);return {id:fid};
});}
export async function beginUpload(service,id,token,d){return service.db.$transaction(async tx=>{
  const [quota]=await tx.$queryRaw`SELECT * FROM ss_diary_v1.quota WHERE id=1 FOR UPDATE`;const b=await service.board(tx,id,token,true,false,true,'documents'),p=uploadInput(b.actor?{...d,author:''}:d);if(b.actor){p.author=clean(b.actor.name,'Responsável autenticado',150);p.authorUserId=b.actor.id;}const fingerprint=sha(JSON.stringify(p));
  // Reclaim only expired, never-published temporary uploads. Published originals are retained.
  const expired=await tx.$queryRaw`SELECT id,payload FROM ss_diary_v1.doc_files WHERE state='pending' AND expires<${BigInt(Date.now())} FOR UPDATE`;
  let released=0;for(const f of expired){released+=f.payload.size;await tx.$executeRaw`DELETE FROM ss_diary_v1.doc_parts WHERE file_id=${f.id}`;await tx.$executeRaw`UPDATE ss_diary_v1.doc_files SET state='cancelled' WHERE id=${f.id}`;}
  if(released)await tx.$executeRaw`UPDATE ss_diary_v1.quota SET bytes=bytes-${BigInt(released)} WHERE id=1`;
  const rows=await tx.$queryRaw`SELECT * FROM ss_diary_v1.doc_files WHERE id=${p.id}`;
  if(rows.length){const f=rows[0];fail(f.board_id===id&&f.request_hash===fingerprint,'Identificador de envio já utilizado.',409);fail(f.state!=='cancelled','Envio expirado. Feche a janela e envie novamente.',410);const parts=await tx.$queryRaw`SELECT part FROM ss_diary_v1.doc_parts WHERE file_id=${p.id}`;return {id:p.id,complete:f.state==='ready',received:parts.map(x=>x.part)};}
  await folderExists(tx,id,p.folderId);
  const [usage]=await tx.$queryRaw`SELECT count(*)::int AS count,COALESCE(sum((payload->>'size')::bigint),0)::bigint AS bytes FROM ss_diary_v1.doc_files WHERE board_id=${id} AND state IN ('pending','ready')`;
  const [cover]=await tx.$queryRaw`SELECT bytes FROM ss_diary_v1.doc_covers WHERE board_id=${id}`;
  fail(usage.count<DOCUMENT_LIMITS.files&&Number(usage.bytes)+p.size+(cover?.bytes||0)<=DOCUMENT_LIMITS.boardBytes,'Limite de testes: 100 arquivos / 64 MB por empreendimento, incluindo envios pendentes.',507);
  fail(Number(quota.bytes)-released+p.size<=LIMITS.totalBytes,'Armazenamento de testes cheio. Solicite ampliação.',507);
  const {id:fid,folderId,...payload}=p,now=Date.now();await tx.$executeRaw`INSERT INTO ss_diary_v1.doc_files(id,board_id,folder_id,payload,request_hash,created_at,expires) VALUES(${fid},${id},${folderId},${JSON.stringify(payload)}::jsonb,${fingerprint},${BigInt(now)},${BigInt(now+86400000)})`;
  await tx.$executeRaw`UPDATE ss_diary_v1.quota SET bytes=bytes+${BigInt(p.size)} WHERE id=1`;return {id:fid,complete:false,received:[]};
},{timeout:15000});}
export async function uploadPart(service,id,token,fileId,d){uuid(fileId);return service.db.$transaction(async tx=>{
  await service.board(tx,id,token,true,false,true,'documents');const [f]=await tx.$queryRaw`SELECT * FROM ss_diary_v1.doc_files WHERE board_id=${id} AND id=${fileId} FOR UPDATE`;
  fail(f&&f.state==='pending'&&Number(f.expires)>Date.now(),'Envio não disponível. Reabra a janela para tentar novamente.',409);
  const count=Math.ceil(f.payload.size/DOCUMENT_LIMITS.chunkBytes);fail(Number.isInteger(d.index)&&d.index>=0&&d.index<count,'Parte inválida.');
  fail(typeof d.base64==='string'&&d.base64.length<=Math.ceil(DOCUMENT_LIMITS.chunkBytes/3)*4&&/^[A-Za-z0-9+/]+={0,2}$/.test(d.base64),'Conteúdo inválido.');const bytes=Buffer.from(d.base64,'base64'),expected=Math.min(DOCUMENT_LIMITS.chunkBytes,f.payload.size-d.index*DOCUMENT_LIMITS.chunkBytes);
  fail(bytes.length===expected&&bytes.toString('base64')===d.base64,'Tamanho de parte inválido.');const hash=sha(bytes),[old]=await tx.$queryRaw`SELECT sha256 FROM ss_diary_v1.doc_parts WHERE file_id=${fileId} AND part=${d.index}`;
  if(old)fail(old.sha256===hash,'Parte recebida com conteúdo diferente.',409);else await tx.$executeRaw`INSERT INTO ss_diary_v1.doc_parts VALUES(${fileId},${d.index},${bytes},${hash})`;
  return {ok:true};
});}
export async function completeUpload(service,id,token,fileId){uuid(fileId);return service.db.$transaction(async tx=>{
  const b=await service.board(tx,id,token,true,false,true,'documents');const [f]=await tx.$queryRaw`SELECT * FROM ss_diary_v1.doc_files WHERE board_id=${id} AND id=${fileId} FOR UPDATE`;
  fail(f&&f.state!=='cancelled','Envio não encontrado.',404);if(f.state==='ready')return {id:fileId};fail(Number(f.expires)>Date.now(),'Envio expirado.',410);
  const parts=await tx.$queryRaw`SELECT part,content FROM ss_diary_v1.doc_parts WHERE file_id=${fileId} ORDER BY part`;
  fail(parts.length===Math.ceil(f.payload.size/DOCUMENT_LIMITS.chunkBytes)&&parts.every((p,i)=>p.part===i),'Arquivo incompleto. Tente enviar novamente.',409);
  const bytes=Buffer.concat(parts.map(p=>Buffer.from(p.content)));fail(bytes.length===f.payload.size&&sha(bytes)===f.payload.sha256,'Falha na integridade do arquivo. Envie novamente.',409);validSignature(bytes,f.payload.ext);
  await tx.$executeRaw`UPDATE ss_diary_v1.doc_files SET state='ready' WHERE id=${fileId}`;await changed(tx,id,b,'document-upload',fileId);return {id:fileId};
},{timeout:15000});}
export async function manageDocument(service,id,token,fileId,d){uuid(fileId);return service.db.$transaction(async tx=>{
  const b=await service.board(tx,id,token,true,['share','archive','restore'].includes(d.action),true,'documents');const [f]=await tx.$queryRaw`SELECT * FROM ss_diary_v1.doc_files WHERE board_id=${id} AND id=${fileId} AND state='ready'`;
  fail(f,'Arquivo não encontrado.',404);fail(f.revision===d.revision,'O arquivo mudou. Atualize antes de salvar.',409);
  if(d.action==='edit'){fail(!f.archived,'Restaure o arquivo antes de editar.');const folderId=d.folderId?uuid(d.folderId):null;await folderExists(tx,id,folderId);const payload={...f.payload,title:clean(d.title,'Título',180),note:clean(d.note||'','Descrição',1500,false)};await tx.$executeRaw`UPDATE ss_diary_v1.doc_files SET folder_id=${folderId},payload=${JSON.stringify(payload)}::jsonb WHERE id=${fileId}`;}
  else if(d.action==='share'){fail(typeof d.shared==='boolean','Permissão inválida.');await tx.$executeRaw`UPDATE ss_diary_v1.doc_files SET shared=${d.shared} WHERE id=${fileId}`;}
  else if(['archive','restore'].includes(d.action))await tx.$executeRaw`UPDATE ss_diary_v1.doc_files SET archived=${d.action==='archive'} WHERE id=${fileId}`;
  else fail(false,'Ação inválida.');
  await tx.$executeRaw`UPDATE ss_diary_v1.doc_files SET revision=revision+1 WHERE id=${fileId}`;await changed(tx,id,b,'document-'+d.action,fileId);return {ok:true};
});}
export async function downloadPart(service,id,token,fileId,index){uuid(fileId);const b=await service.board(service.db,id,token,false,false,false,'documents');const [f]=await service.db.$queryRaw`SELECT * FROM ss_diary_v1.doc_files WHERE board_id=${id} AND id=${fileId} AND state='ready' AND archived=FALSE`;
  fail(f&&(b.role!=='reader'||b.actor||f.shared),'Arquivo não disponível para este acesso.',404);fail(Number.isInteger(index)&&index>=0&&index<Math.ceil(f.payload.size/DOCUMENT_LIMITS.chunkBytes),'Parte inválida.');
  const [part]=await service.db.$queryRaw`SELECT content FROM ss_diary_v1.doc_parts WHERE file_id=${fileId} AND part=${index}`;fail(part,'Arquivo incompleto.',409);return Buffer.from(part.content);
}
