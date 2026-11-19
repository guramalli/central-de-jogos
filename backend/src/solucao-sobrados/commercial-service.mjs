import {randomUUID, createHash} from 'node:crypto';
import {createMercadoPagoProvider} from './mercadopago-provider.mjs';
export {commercialSchema, initializeCommercial} from './commercial-schema.mjs';

const DAY = 86400000;
export const COMMERCIAL_PLAN = Object.freeze({amountCents:35000,currency:'BRL',trialDays:7});
export class CommercialError extends Error { constructor(message,status=422){super(message);this.name='CommercialError';this.status=status;} }
const need=(value,message,status)=>{if(!value)throw new CommercialError(message,status);};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const iso=value=>value==null?null:new Date(Number(value)).toISOString();
const instant=value=>{const parsed=Date.parse(value);return Number.isFinite(parsed)?parsed:null;};
const input=(value,label,max)=>{need(typeof value==='string'&&value.trim()&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),`${label}: preencha até ${max} caracteres.`);return value.trim();};
const optionsOf=(options={})=>({now:options.now||Date.now,enabled:options.enabled??process.env.SS_COMMERCE_ENABLED==='true',configured:options.configured??options.provider?.configured??createMercadoPagoProvider().configured,operatorIds:options.operatorIds});
async function actorFresh(db,actor){
 need(uuid.test(actor?.id||'')&&uuid.test(actor?.organizationId||''),'Entre novamente.',401);
 const [user]=await db.$queryRaw`SELECT id,organization_id,name,email,role,active FROM ss_app_v1.users WHERE id=${actor.id} AND organization_id=${actor.organizationId}`;
 need(user?.active,'Acesso indisponível.',403);return user;
}
async function operator(db,user,options={}){
 const allow=options.operatorIds??(process.env.SS_PLATFORM_ADMIN_USER_IDS||'').split(',').map(s=>s.trim());
 const [grant]=await db.$queryRaw`SELECT active FROM ss_app_v1.platform_operators WHERE user_id=${user.id}`;
 if(grant)return grant.active===true;
 return allow.some(id=>uuid.test(id)&&id===user.id);
}
async function requireOperator(db,actor,options){const user=await actorFresh(db,actor);need(await operator(db,user,options),'Acesso exclusivo à administração da plataforma.',403);return user;}
export async function ensureCommercialLicense(db,organizationId,options={}){
 const o=optionsOf(options),stamp=o.now(),ready=o.enabled&&o.configured;
 const mode=ready?'trial':'pending_setup',start=ready?BigInt(stamp):null,end=ready?BigInt(stamp+7*DAY):null;
 await db.$executeRaw`INSERT INTO ss_app_v1.commercial_licenses(organization_id,mode,trial_started_at,trial_ends_at,created_at,updated_at) VALUES (${organizationId},${mode},${start},${end},${BigInt(stamp)},${BigInt(stamp)}) ON CONFLICT DO NOTHING`;
 if(ready)await db.$executeRaw`UPDATE ss_app_v1.commercial_licenses SET mode='trial',trial_started_at=${start},trial_ends_at=${end},updated_at=${BigInt(stamp)} WHERE organization_id=${organizationId} AND mode='pending_setup'`;
 const [row]=await db.$queryRaw`SELECT * FROM ss_app_v1.commercial_licenses WHERE organization_id=${organizationId}`;
 return row;
}
function licenseDto(row,now){
 const paid=Number(row.paid_until||0)>now,manual=Number(row.manual_until||0)>now,trial=Number(row.trial_ends_at||0)>now;
 const status=row.suspended?'suspended':row.mode==='legacy'?'legacy':paid||manual?'active':row.mode==='pending_setup'?'pending_setup':trial?'trial':'expired';
 return {status,accessAllowed:status!=='expired'&&status!=='suspended',trialEndsAt:iso(row.trial_ends_at),trialStartedAt:iso(row.trial_started_at),paidUntil:iso(row.paid_until),manualUntil:iso(row.manual_until)};
}
export async function commercialStatus(db,actor,options={}){
 const o=optionsOf(options),user=await actorFresh(db,actor),row=await ensureCommercialLicense(db,user.organization_id,o);
 const [sub]=await db.$queryRaw`SELECT status,checkout_url FROM ss_app_v1.commercial_subscriptions WHERE organization_id=${user.organization_id} ORDER BY CASE WHEN status IN ('creating','pending','authorized','paused') THEN 0 ELSE 1 END,created_at DESC,id DESC LIMIT 1`;
 const live=['creating','pending','authorized','paused'].includes(sub?.status);
 return {billingConfigured:Boolean(o.enabled&&o.configured),platformAdmin:await operator(db,user,o),plan:COMMERCIAL_PLAN,license:licenseDto(row,o.now()),subscriptionStatus:sub?.status||null,checkoutEnabled:Boolean(o.enabled&&o.configured&&user.role==='admin'&&(!live||sub?.status==='pending'&&Boolean(sub.checkout_url))&&!row.suspended),recoveryEnabled:Boolean(o.enabled&&o.configured&&user.role==='admin'&&!row.suspended&&(sub?.status==='creating'||sub?.status==='pending'&&!sub.checkout_url)),canCancel:Boolean(o.enabled&&o.configured&&user.role==='admin'&&live&&sub.status!=='creating')};
}
export async function assertCommercialAccess(db,actor,options={}){
 const status=await commercialStatus(db,actor,options);
 need(status.license.accessAllowed,status.license.status==='suspended'?'Acesso da empresa suspenso. Entre em contato pelo suporte.':'O período de acesso terminou. Consulte sua assinatura ou fale com o suporte.',402);
 return status;
}
async function audit(db,organizationId,actorId,action,reason,now){await db.$executeRaw`INSERT INTO ss_app_v1.commercial_audit(id,organization_id,actor_id,action,reason,created_at) VALUES (${randomUUID()},${organizationId},${actorId},${action},${reason},${BigInt(now)})`;}
function addMonth(value){const source=new Date(value),result=new Date(value);result.setUTCDate(1);result.setUTCMonth(result.getUTCMonth()+1);const last=new Date(Date.UTC(result.getUTCFullYear(),result.getUTCMonth()+1,0)).getUTCDate();result.setUTCDate(Math.min(source.getUTCDate(),last));return result.getTime();}
export class CommercialService {
 constructor(db,options={}){this.db=db;this.provider=options.provider;this.options=options;this.now=options.now||Date.now;}
 status(actor){return commercialStatus(this.db,actor,this.options);}
 async checkout(actor){
  // The organization lock serializes local reservations, never the remote call.
  const reservation=await this.db.$transaction(async tx=>{
   const user=await actorFresh(tx,actor);need(user.role==='admin','Somente o diretor pode contratar.',403);
   await tx.$queryRaw`SELECT id FROM ss_app_v1.organizations WHERE id=${user.organization_id} FOR UPDATE`;
   const state=await commercialStatus(tx,actor,this.options);need(state.checkoutEnabled,'A contratação não está disponível para esta conta agora.',409);
   const [pending]=await tx.$queryRaw`SELECT checkout_url FROM ss_app_v1.commercial_subscriptions WHERE organization_id=${user.organization_id} AND status='pending'`;
   if(pending?.checkout_url)return {existing:pending.checkout_url,user};
   const [previous]=await tx.$queryRaw`SELECT MAX(created_at) AS latest FROM ss_app_v1.commercial_subscriptions WHERE organization_id=${user.organization_id}`;
   const id=randomUUID(),reference=randomUUID(),stamp=BigInt(Math.max(this.now(),Number(previous.latest||0)+1));
   await tx.$executeRaw`INSERT INTO ss_app_v1.commercial_subscriptions(id,organization_id,reference,payer_email,status,created_at,updated_at) VALUES (${id},${user.organization_id},${reference},${user.email},'creating',${stamp},${stamp})`;
   return {id,reference,user};
  });
  if(reservation.existing)return {checkoutUrl:reservation.existing};
  const {id,reference,user}=reservation;
  let created;
  try {created=await this.provider.createSubscription({reference,email:user.email});}
  catch(error){
   // Only a provider-proven rejection can release the reservation. Network errors,
   // malformed replies and lost database writes require read-only reconciliation.
   if(this.provider.isDefinitiveCreateRejection?.(error))await this.db.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM ss_app_v1.organizations WHERE id=${user.organization_id} FOR UPDATE`;
    const changed=await tx.$queryRaw`UPDATE ss_app_v1.commercial_subscriptions s SET status='failed',updated_at=${BigInt(this.now())} WHERE id=${id} AND status='creating' AND provider_id IS NULL AND NOT EXISTS (SELECT 1 FROM ss_app_v1.commercial_payments p WHERE p.subscription_id=s.id) RETURNING id`;
    if(changed.length)await audit(tx,user.organization_id,user.id,'subscription_rejected','Criação rejeitada pelo provedor; uma nova tentativa explícita está permitida.',this.now());
   });
   throw error;
  }
  need(created?.id&&created?.init_point&&created.external_reference===reference&&created.status==='pending','O provedor não retornou o acesso ao pagamento.',502);
  const saved=await this.saveSubscriptionRecord({id,organization_id:user.organization_id,reference},created,{checkout:true,action:'subscription_created',actorId:user.id});
  return this.db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM ss_app_v1.organizations WHERE id=${user.organization_id} FOR UPDATE`;
   const fresh=await actorFresh(tx,actor);need(fresh.role==='admin','Somente o diretor pode contratar.',403);
   const state=await commercialStatus(tx,actor,this.options);
   const [current]=await tx.$queryRaw`SELECT * FROM ss_app_v1.commercial_subscriptions WHERE id=${id} AND organization_id=${user.organization_id}`;
   need(state.checkoutEnabled&&current?.status==='pending'&&current.provider_id===saved.provider_id&&current.checkout_url,'A situação da assinatura mudou. Atualize a página para conferir.',409);
   return {checkoutUrl:current.checkout_url};
  });
 }
 async saveSubscriptionRecord(known,record,{checkout=false,actor=null,action=null,actorId=null}={}){
  return this.db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM ss_app_v1.organizations WHERE id=${known.organization_id} FOR UPDATE`;
   if(actor){const user=await actorFresh(tx,actor);need(user.role==='admin'&&user.organization_id===known.organization_id,'Somente o diretor pode consultar a contratação.',403);const state=await commercialStatus(tx,actor,this.options);need(state.billingConfigured&&state.license.status!=='suspended','A consulta da contratação não está disponível.',409);}
   const [sub]=await tx.$queryRaw`SELECT * FROM ss_app_v1.commercial_subscriptions WHERE id=${known.id} AND organization_id=${known.organization_id} FOR UPDATE`;
   need(sub&&record.external_reference===sub.reference&&record.id&&(!sub.provider_id||sub.provider_id===String(record.id)),'Assinatura divergente.',422);
   need(['pending','authorized','paused','cancelled'].includes(record.status),'Situação desconhecida.',422);
   // Never let a delayed create/search response undo authorization or cancellation.
   const status=sub.status==='cancelled'?'cancelled':record.status==='pending'&&['authorized','paused'].includes(sub.status)?sub.status:record.status;
   const checkoutUrl=status==='pending'?(checkout?record.init_point||sub.checkout_url:sub.checkout_url):null;
   await tx.$executeRaw`UPDATE ss_app_v1.commercial_subscriptions SET provider_id=${String(record.id)},status=${status},checkout_url=${checkoutUrl},updated_at=${BigInt(this.now())} WHERE id=${sub.id}`;
   if(action)await audit(tx,sub.organization_id,actor?.id||actorId,action,action==='subscription_created'?'Checkout solicitado pelo diretor.':'Tentativa anterior consultada e vinculada ao registro confirmado pelo provedor.',this.now());
   return {...sub,status,provider_id:String(record.id),checkout_url:checkoutUrl};
  });
 }
 async reconcile(actor){
  const user=await actorFresh(this.db,actor);need(user.role==='admin','Somente o diretor pode consultar a contratação.',403);
  const state=await this.status(actor);need(state.billingConfigured&&state.license.status!=='suspended','A consulta da contratação não está disponível.',409);
  const [sub]=await this.db.$queryRaw`SELECT * FROM ss_app_v1.commercial_subscriptions WHERE organization_id=${user.organization_id} AND status IN ('creating','pending') ORDER BY created_at DESC,id DESC LIMIT 1`;
  if(!sub||sub.status==='pending'&&sub.checkout_url)return {...state,recovery:'resolved'};
  const record=sub.provider_id?await this.provider.fetchSubscription(sub.provider_id,{reference:sub.reference,requireCheckout:true}):await this.provider.findSubscriptionByReference(sub.reference,{email:sub.payer_email||undefined});
  if(record)await this.saveSubscriptionRecord(sub,record,{checkout:true,actor,action:'subscription_recovered'});
  const fresh=await actorFresh(this.db,actor);need(fresh.role==='admin','Somente o diretor pode consultar a contratação.',403);
  // A missing search result is not proof that the remote creation never happened.
  const result=await this.status(actor);return {...result,recovery:result.recoveryEnabled?'pending':record?'recovered':'resolved'};
 }
 async cancel(actor){
  const user=await actorFresh(this.db,actor);need(user.role==='admin','Somente o diretor pode cancelar a assinatura.',403);
  const state=await this.status(actor);need(state.canCancel,'Não há assinatura disponível para cancelamento.',409);
  const [sub]=await this.db.$queryRaw`SELECT * FROM ss_app_v1.commercial_subscriptions WHERE organization_id=${user.organization_id} AND status IN ('pending','authorized','paused') ORDER BY created_at DESC LIMIT 1`;
  need(sub?.provider_id,'Assinatura indisponível.',409);await this.provider.cancelSubscription(sub.provider_id,{reference:sub.reference});
  await this.db.$executeRaw`UPDATE ss_app_v1.commercial_subscriptions SET status='cancelled',updated_at=${BigInt(this.now())} WHERE id=${sub.id}`;
  await audit(this.db,user.organization_id,user.id,'subscription_cancelled','Cancelamento solicitado pelo diretor; período pago preservado.',this.now());
  return {...await this.status(actor),status:'cancelled'};
 }
 async supportList(actor){const user=await actorFresh(this.db,actor);return {tickets:await this.tickets(user.id)};}
 async tickets(userId=null){
  const rows=userId?await this.db.$queryRaw`SELECT t.*,o.name AS organization_name FROM ss_app_v1.support_tickets t JOIN ss_app_v1.organizations o ON o.id=t.organization_id WHERE t.user_id=${userId} ORDER BY t.updated_at DESC LIMIT 100`:await this.db.$queryRaw`SELECT t.*,o.name AS organization_name FROM ss_app_v1.support_tickets t JOIN ss_app_v1.organizations o ON o.id=t.organization_id ORDER BY t.updated_at DESC LIMIT 200`;
  const result=[];
  for(const row of rows){const messages=await this.db.$queryRaw`SELECT m.*,u.name AS author_name FROM ss_app_v1.support_messages m JOIN ss_app_v1.users u ON u.id=m.user_id WHERE m.ticket_id=${row.id} ORDER BY m.created_at,m.id LIMIT 200`;result.push({id:row.id,title:row.title,category:row.category,status:row.status,organizationName:row.organization_name,createdAt:iso(row.created_at),updatedAt:iso(row.updated_at),messages:messages.map(m=>({id:m.id,body:m.body,authorName:m.author_name,fromOperator:m.from_operator,createdAt:iso(m.created_at)}))});}
  return result;
 }
 async createSupport(actor,data={}){
  const user=await actorFresh(this.db,actor),title=input(data.title,'Assunto',160),body=input(data.message,'Mensagem',6000);
  need(['bug','suggestion','question'].includes(data.category),'Categoria inválida.');
  const id=randomUUID(),stamp=BigInt(this.now());
  await this.db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM ss_app_v1.users WHERE id=${user.id} FOR UPDATE`;
   const [count]=await tx.$queryRaw`SELECT COUNT(*) AS total FROM ss_app_v1.support_tickets WHERE user_id=${user.id} AND created_at>${BigInt(this.now()-DAY)}`;
   need(Number(count.total)<20,'Limite diário de solicitações atingido.',429);
   await tx.$executeRaw`INSERT INTO ss_app_v1.support_tickets(id,organization_id,user_id,title,category,created_at,updated_at) VALUES (${id},${user.organization_id},${user.id},${title},${data.category},${stamp},${stamp})`;
   await tx.$executeRaw`INSERT INTO ss_app_v1.support_messages(id,ticket_id,user_id,body,from_operator,created_at) VALUES (${randomUUID()},${id},${user.id},${body},FALSE,${stamp})`;
  });return {id,...await this.supportList(actor)};
 }
 async replySupport(actor,data={}){return this.reply(actor,data,false);}
 async platformReply(actor,data={}){return this.reply(actor,data,true);}
 async reply(actor,data,fromOperator){
  const user=fromOperator?await requireOperator(this.db,actor,this.options):await actorFresh(this.db,actor),body=input(data.message,'Mensagem',6000);
  need(uuid.test(data.id||''),'Solicitação inválida.');
  const status=fromOperator?(data.status||'in_progress'):'open';need(['open','in_progress','resolved'].includes(status),'Situação inválida.');
  await this.db.$transaction(async tx=>{
   const [ticket]=await tx.$queryRaw`SELECT * FROM ss_app_v1.support_tickets WHERE id=${data.id} FOR UPDATE`;
   need(ticket&&(fromOperator||ticket.user_id===user.id&&ticket.organization_id===user.organization_id),'Solicitação não encontrada.',404);
   const [count]=await tx.$queryRaw`SELECT COUNT(*) AS total FROM ss_app_v1.support_messages WHERE ticket_id=${data.id}`;
   need(Number(count.total)<200,'Esta solicitação atingiu o limite de mensagens. Abra outra solicitação.',422);
   const stamp=BigInt(this.now());await tx.$executeRaw`INSERT INTO ss_app_v1.support_messages(id,ticket_id,user_id,body,from_operator,created_at) VALUES (${randomUUID()},${data.id},${user.id},${body},${fromOperator},${stamp})`;
   await tx.$executeRaw`UPDATE ss_app_v1.support_tickets SET status=${status},updated_at=${stamp} WHERE id=${data.id}`;
  });return fromOperator?this.platformTickets(actor):this.supportList(actor);
 }
 async platformTickets(actor){await requireOperator(this.db,actor,this.options);return {tickets:await this.tickets()};}
 async platformOverview(actor){
  await requireOperator(this.db,actor,this.options);
  const rows=await this.db.$queryRaw`SELECT o.id,o.name,o.created_at,l.*, (SELECT email FROM ss_app_v1.users WHERE organization_id=o.id AND role='admin' ORDER BY created_at LIMIT 1) AS owner_email,(SELECT status FROM ss_app_v1.commercial_subscriptions WHERE organization_id=o.id ORDER BY created_at DESC LIMIT 1) AS subscription_status FROM ss_app_v1.organizations o LEFT JOIN ss_app_v1.commercial_licenses l ON l.organization_id=o.id ORDER BY o.created_at DESC LIMIT 1000`;
  const customers=[];for(const row of rows){const license=row.mode?row:await ensureCommercialLicense(this.db,row.id,this.options);customers.push({organizationId:row.id,name:row.name,ownerEmail:row.owner_email,createdAt:iso(row.created_at),license:licenseDto(license,this.now()),subscriptionStatus:row.subscription_status||null});}
  const stamp=BigInt(this.now());
  const [totals]=await this.db.$queryRaw`SELECT COUNT(*) AS total,COUNT(*) FILTER (WHERE l.mode NOT IN ('legacy','pending_setup') AND NOT l.suspended AND COALESCE(l.paid_until,0)<=${stamp} AND COALESCE(l.manual_until,0)<=${stamp} AND l.trial_ends_at>${stamp}) AS trials,COUNT(*) FILTER (WHERE l.mode NOT IN ('legacy','pending_setup') AND NOT l.suspended AND COALESCE(l.paid_until,0)<=${stamp} AND COALESCE(l.manual_until,0)<=${stamp} AND COALESCE(l.trial_ends_at,0)<=${stamp}) AS expired,COUNT(*) FILTER (WHERE l.paid_until>${stamp} AND EXISTS (SELECT 1 FROM ss_app_v1.commercial_subscriptions s WHERE s.organization_id=o.id AND s.status='authorized')) AS active FROM ss_app_v1.organizations o LEFT JOIN ss_app_v1.commercial_licenses l ON l.organization_id=o.id`;
  const [payment]=await this.db.$queryRaw`SELECT COUNT(*) AS total,COALESCE(SUM(amount_cents),0) AS cents FROM ss_app_v1.commercial_payments WHERE status='approved'`;
  const [ticket]=await this.db.$queryRaw`SELECT COUNT(*) AS total FROM ss_app_v1.support_tickets WHERE status<>'resolved'`;
  return {metrics:{customers:Number(totals.total),activeSubscriptions:Number(totals.active),trialCustomers:Number(totals.trials),overdueCustomers:Number(totals.expired),paidCount:Number(payment.total),paidCents:Number(payment.cents),openTickets:Number(ticket.total)},customers,tickets:await this.tickets()};
 }
 async platformSetLicense(actor,data={}){
  const user=await requireOperator(this.db,actor,this.options),reason=input(data.reason,'Motivo',1000);
  need(uuid.test(data.organizationId||''),'Empresa inválida.');need(['extend','suspend','restore'].includes(data.action),'Ação inválida.');
  if(data.action==='extend')need(Number.isInteger(data.days)&&data.days>=1&&data.days<=365,'Informe de 1 a 365 dias.');
  await this.db.$transaction(async tx=>{
   const [org]=await tx.$queryRaw`SELECT id FROM ss_app_v1.organizations WHERE id=${data.organizationId} FOR UPDATE`;need(org,'Empresa não encontrada.',404);
   const row=await ensureCommercialLicense(tx,org.id,this.options),stamp=BigInt(this.now());
   if(data.action==='extend'){const end=BigInt(Math.max(this.now(),Number(row.manual_until||0),Number(row.paid_until||0),Number(row.trial_ends_at||0))+data.days*DAY);await tx.$executeRaw`UPDATE ss_app_v1.commercial_licenses SET manual_until=${end},updated_at=${stamp} WHERE organization_id=${org.id}`;}
   else await tx.$executeRaw`UPDATE ss_app_v1.commercial_licenses SET suspended=${data.action==='suspend'},updated_at=${stamp} WHERE organization_id=${org.id}`;
   await audit(tx,org.id,user.id,`license_${data.action}`,reason,this.now());
  });return this.platformOverview(actor);
 }
 async processNotification(notice){
  need(this.provider?.configured&&this.provider.isVerifiedNotification?.(notice),'Notificação não verificada.',401);
  let sub,payment;
  if(notice.type==='subscription_preapproval'){
   const record=await this.provider.fetchSubscription(String(notice.id));
   need(['pending','authorized','paused','cancelled'].includes(record.status),'Situação desconhecida.');
   // Recover an ambiguous POST only by its reserved, provider-verified reference.
   const [known]=await this.db.$queryRaw`SELECT * FROM ss_app_v1.commercial_subscriptions WHERE reference=${String(record.external_reference)}`;
   if(!known)return {ignored:true};sub=known;
   await this.saveSubscriptionRecord(sub,record);
   // Authorization is a mandate, never a confirmed payment or entitlement.
   return {processed:true};
  }
  if(notice.type==='subscription_authorized_payment'){
   const invoice=await this.provider.fetchAuthorizedPayment(String(notice.id));
   const [known]=await this.db.$queryRaw`SELECT * FROM ss_app_v1.commercial_subscriptions WHERE reference=${String(invoice.external_reference)}`;
   if(!known)return {ignored:true};sub=known;
   need(invoice.external_reference===sub.reference&&(!sub.provider_id||sub.provider_id===String(invoice.preapproval_id)),'Referência divergente.',422);
   await this.saveSubscriptionRecord(sub,{id:invoice.preapproval_id,external_reference:sub.reference,status:'pending'});
   if(!invoice.payment?.id)return {ignored:true};
   payment=await this.provider.fetchPayment(String(invoice.payment.id),{reference:sub.reference,allowMissingReference:true});
  }else if(notice.type==='payment'){
   const [previous]=await this.db.$queryRaw`SELECT s.reference FROM ss_app_v1.commercial_payments p JOIN ss_app_v1.commercial_subscriptions s ON s.id=p.subscription_id WHERE p.provider_id=${String(notice.id)}`;
   payment=await this.provider.fetchPayment(String(notice.id),previous?{reference:previous.reference,allowMissingReference:true}:undefined);
   if(!payment.external_reference&&previous)payment={...payment,external_reference:previous.reference};
   const [known]=await this.db.$queryRaw`SELECT * FROM ss_app_v1.commercial_subscriptions WHERE reference=${String(payment.external_reference)}`;
   if(!known)return {ignored:true};sub=known;
  }else return {ignored:true};
  need(payment?.live_mode===true,'Pagamento de teste não libera acesso comercial.',422);
  need(payment&&String(payment.id)&&payment.currency_id==='BRL'&&Math.round(Number(payment.transaction_amount)*100)===35000,'Pagamento incompatível com o plano.',422);
  need(!payment.external_reference||payment.external_reference===sub.reference,'Referência divergente.',422);
  if(Number(payment.transaction_amount_refunded)>0)payment={...payment,status:'refunded'};
  const approved=instant(payment.date_approved),updated=instant(payment.date_last_updated);
  need(updated,'Pagamento sem data de atualização verificável.',422);
  need(payment.status!=='approved'||approved,'Pagamento sem confirmação de data.',422);
  const end=approved?addMonth(approved):null;
  const eventId=createHash('sha256').update(`${payment.id}:${payment.status}:${updated}`).digest('hex');
  return this.db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM ss_app_v1.organizations WHERE id=${sub.organization_id} FOR UPDATE`;
   const [prior]=await tx.$queryRaw`SELECT * FROM ss_app_v1.commercial_payments WHERE provider_id=${String(payment.id)}`;
   need(!prior||prior.subscription_id===sub.id,'Pagamento já vinculado a outra assinatura.',422);
   if(prior&&(Number(prior.provider_updated_at)>updated||['refunded','charged_back'].includes(prior.status)&&payment.status==='approved'))return {ignored:true};
   const inserted=await tx.$queryRaw`INSERT INTO ss_app_v1.commercial_events(id,type,provider_id,status,received_at) VALUES (${eventId},${notice.type},${String(payment.id)},${payment.status},${BigInt(this.now())}) ON CONFLICT DO NOTHING RETURNING id`;
   if(!inserted.length)return {duplicate:true};
   await tx.$executeRaw`INSERT INTO ss_app_v1.commercial_payments(provider_id,subscription_id,organization_id,status,amount_cents,currency,approved_at,period_end,provider_updated_at,updated_at) VALUES (${String(payment.id)},${sub.id},${sub.organization_id},${payment.status},35000,'BRL',${approved?BigInt(approved):null},${end?BigInt(end):null},${BigInt(updated)},${BigInt(this.now())}) ON CONFLICT(provider_id) DO UPDATE SET status=EXCLUDED.status,approved_at=COALESCE(EXCLUDED.approved_at,ss_app_v1.commercial_payments.approved_at),period_end=COALESCE(EXCLUDED.period_end,ss_app_v1.commercial_payments.period_end),provider_updated_at=EXCLUDED.provider_updated_at,updated_at=EXCLUDED.updated_at`;
   await ensureCommercialLicense(tx,sub.organization_id,this.options);
   const [coverage]=await tx.$queryRaw`SELECT MAX(period_end) AS paid_until FROM ss_app_v1.commercial_payments WHERE organization_id=${sub.organization_id} AND status='approved'`;
   await tx.$executeRaw`UPDATE ss_app_v1.commercial_licenses SET paid_until=${coverage.paid_until},mode=CASE WHEN mode='legacy' THEN mode ELSE 'subscription' END,updated_at=${BigInt(this.now())} WHERE organization_id=${sub.organization_id}`;
   return {processed:true};
  });
 }
}
