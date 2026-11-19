import {canAccess} from './access-domain.mjs';
import {randomUUID} from 'node:crypto';
import {reminderInput} from './reminder-domain.mjs';
export const reminderSchema=[
  'CREATE TABLE IF NOT EXISTS ss_diary_v1.reminders (id TEXT PRIMARY KEY, board_id TEXT NOT NULL REFERENCES ss_diary_v1.boards(id), payload JSONB NOT NULL, revision INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS diary_reminders_board ON ss_diary_v1.reminders(board_id)'
];
const reject=(ok,msg,status=422)=>{if(!ok){const e=new Error(msg);e.status=status;throw e;}};
export async function readReminders(db,boardId,actor=null){reject(!actor||canAccess(actor,'reminders'),'Seu acesso não permite este módulo.',403);const rows=await db.$queryRaw`SELECT id,payload,revision,created_at,updated_at FROM ss_diary_v1.reminders WHERE board_id=${boardId} ORDER BY created_at`;return rows.map(r=>({id:r.id,...r.payload,revision:r.revision,createdAt:Number(r.created_at),updatedAt:Number(r.updated_at)}));}
export async function changeReminder(service,boardId,token,d){
  reject(d&&typeof d==='object'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(d.id),'Identificador inválido.');
  return service.db.$transaction(async tx=>{
    const b=await service.board(tx,boardId,token,true,false,true,'reminders');
    const [old]=await tx.$queryRaw`SELECT * FROM ss_diary_v1.reminders WHERE id=${d.id}`;
    reject(!old||old.board_id===boardId,'Lembrete não encontrado.',404);
    const now=BigInt(Date.now());let payload;
    if(d.action==='save'){
      payload={...reminderInput(d,b.metadata),status:old?.payload.status||'pending'};
      if(!old){
        reject(d.revision===null,'Lembrete não encontrado.',404);
        const [count]=await tx.$queryRaw`SELECT count(*)::int AS n FROM ss_diary_v1.reminders WHERE board_id=${boardId}`;reject(count.n<200,'Este empreendimento atingiu o limite de 200 lembretes.',507);
        await tx.$executeRaw`INSERT INTO ss_diary_v1.reminders(id,board_id,payload,created_at,updated_at) VALUES(${d.id},${boardId},${JSON.stringify(payload)}::jsonb,${now},${now})`;
      }else{
        // A repeated creation with the same ID and normalized values is harmless.
        if(d.revision===null){reject(JSON.stringify(reminderInput(old.payload,b.metadata))===JSON.stringify(reminderInput(d,b.metadata)),'Este lembrete já existe. Atualize antes de editar.',409);return {id:d.id,repeated:true};}
        reject(d.revision===old.revision,'O lembrete foi alterado por outra pessoa. Atualize antes de salvar.',409);
        await tx.$executeRaw`UPDATE ss_diary_v1.reminders SET payload=${JSON.stringify(payload)}::jsonb,revision=revision+1,updated_at=${now} WHERE id=${d.id}`;
      }
    }else if(d.action==='status'){
      reject(old,'Lembrete não encontrado.',404);reject(['pending','done','cancelled'].includes(d.status),'Situação inválida.');
      if(d.status===old.payload.status)return {id:d.id,repeated:true};
      reject(d.revision===old.revision,'O lembrete mudou. Atualize e tente novamente.',409);
      payload={...old.payload,status:d.status};await tx.$executeRaw`UPDATE ss_diary_v1.reminders SET payload=${JSON.stringify(payload)}::jsonb,revision=revision+1,updated_at=${now} WHERE id=${d.id}`;
    }else reject(false,'Ação inválida.');
    await tx.$executeRaw`UPDATE ss_diary_v1.boards SET revision=revision+1,updated_at=${now} WHERE id=${boardId}`;
    await tx.$executeRaw`INSERT INTO ss_diary_v1.audit(id,board_id,action,actor_role,subject,created_at,actor_user_id) VALUES(${randomUUID()},${boardId},${'reminder.'+d.action},${b.role},${d.id},${now},${b.actor?.id||null})`;
    return {id:d.id};
  },{timeout:15000});
}
