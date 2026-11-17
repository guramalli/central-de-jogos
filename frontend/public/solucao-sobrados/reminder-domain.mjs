export const REMINDER_KINDS={material:'Comprar material',contract:'Fechar contratação',stage:'Concluir etapa',visit:'Visita / medição',other:'Outra necessidade'};
export const PRIORITIES={high:'Alta',normal:'Normal',low:'Baixa'};
const need=(ok,message)=>{if(!ok){const e=new Error(message);e.status=422;throw e;}};
const text=(s,label,max,required=false)=>{need(typeof s==='string'&&s.length<=max&&(!required||s.trim()),`${label}: preencha até ${max} caracteres.`);return s.trim();};
export function reminderInput(d,meta){
  need(d&&typeof d==='object','Lembrete inválido.');
  const out={title:text(d.title,'Necessidade',180,true),kind:d.kind,stageId:d.stageId||'',unitId:d.unitId||'',dueDate:d.dueDate,dueTime:d.dueTime,leadDays:d.leadDays,assignee:text(d.assignee||'','Responsável',100),priority:d.priority,note:text(d.note||'','Observações',1500)};
  need(Object.hasOwn(REMINDER_KINDS,out.kind)&&Object.hasOwn(PRIORITIES,out.priority),'Tipo ou prioridade inválido.');
  need(typeof out.dueDate==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(out.dueDate)&&Number.isFinite(Date.parse(out.dueDate))&&new Date(out.dueDate).toISOString().slice(0,10)===out.dueDate,'Data inválida.');
  need(typeof out.dueTime==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(out.dueTime),'Horário inválido.');
  need(Number.isInteger(out.leadDays)&&out.leadDays>=0&&out.leadDays<=365,'Antecedência deve ser de 0 a 365 dias.');
  need(!out.stageId||meta.stages.some(x=>x.id===out.stageId),'Etapa não pertence a este empreendimento.');
  need(!out.unitId||meta.units.some(x=>x.id===out.unitId),'Unidade não pertence a este empreendimento.');return out;
}
export const dueAt=r=>Date.parse(`${r.dueDate}T${r.dueTime}:00-03:00`);
export const alertAt=r=>dueAt(r)-r.leadDays*86400000;
export const saoPauloDate=(now=Date.now())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
export function reminderState(r,now=Date.now()){
  if(r.status==='done')return 'done';if(r.status==='cancelled')return 'cancelled';
  if(now>dueAt(r))return 'overdue';if(r.dueDate===saoPauloDate(now))return 'today';if(now>=alertAt(r))return 'alert';return 'scheduled';
}
export const STATE_LABELS={overdue:'Atrasado',today:'Hoje',alert:'Hora de providenciar',scheduled:'Agendado',done:'Concluído',cancelled:'Cancelado'};
export function orderedReminders(rows){return [...rows].sort((a,b)=>dueAt(a)-dueAt(b)||a.title.localeCompare(b.title,'pt-BR'));}
const escapeICS=s=>String(s).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const stamp=n=>new Date(n).toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
function fold(line){let out='',part='',bytes=0;for(const c of line){const size=new TextEncoder().encode(c).length;if(bytes+size>75){out+=part+'\r\n';part=' ';bytes=1;}part+=c;bytes+=size;}return out+part;}
export function remindersICS(board,rows,now=Date.now()){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Solucao Sobrados//Agenda de obra//PT-BR','CALSCALE:GREGORIAN'];
  for(const r of rows.filter(r=>r.status==='pending')){
    const stage=board.metadata.stages.find(s=>s.id===r.stageId)?.name||'Empreendimento',unit=board.metadata.units.find(u=>u.id===r.unitId)?.name||'Todas / áreas comuns';
    const desc=[board.metadata.name,stage,unit,REMINDER_KINDS[r.kind],r.assignee?'Responsável: '+r.assignee:'',r.note,'Alterações no Solução Sobrados não atualizam automaticamente este evento.'].filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT',`UID:${r.id}@solucao-sobrados.educacaogamer.com.br`,`DTSTAMP:${stamp(now)}`,`SEQUENCE:${r.revision||0}`,`DTSTART:${stamp(dueAt(r))}`,`DTEND:${stamp(dueAt(r)+1800000)}`,`SUMMARY:${escapeICS(r.title)}`,`DESCRIPTION:${escapeICS(desc)}`,'STATUS:CONFIRMED','BEGIN:VALARM',r.leadDays?`TRIGGER:-P${r.leadDays}D`:'TRIGGER:PT0S','ACTION:DISPLAY',`DESCRIPTION:${escapeICS(r.title)}`,'END:VALARM','END:VEVENT');
  }lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
}
