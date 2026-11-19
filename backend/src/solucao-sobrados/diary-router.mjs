import {commercialRouter} from './commercial-router.mjs';
import {CommercialService,assertCommercialAccess} from './commercial-service.mjs';
import {createMercadoPagoProvider} from './mercadopago-provider.mjs';
import {workspaceRouter,sessionToken} from './workspace-router.mjs';
import {IdentityService} from './identity-service.mjs';
import {changeReminder} from './reminder-service.mjs';
import {changeFolder,beginUpload,uploadPart,completeUpload,manageDocument,downloadPart,setProjectCover,projectCover} from './document-service.mjs';
import express from 'express';
import rateLimit from 'express-rate-limit';
import {DiaryService,fail,migrate} from './diary-service.mjs';
export function diaryRouter(db,{origins=['https://www.educacaogamer.com.br','https://educacaogamer.com.br'],secureCookies=true,recoveryMailer,registrationVerification}={}){
  const router=express.Router(),service=new DiaryService(db),provider=createMercadoPagoProvider(),commercial=new CommercialService(db,{provider});
  let ready;
  const ensureReady=()=>ready||(ready=migrate(db).catch(error=>{ready=null;throw error;}));
  router.use((req,res,next)=>{res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});next();});
  router.use(rateLimit({windowMs:60000,max:180,standardHeaders:true,legacyHeaders:false,message:{error:'Muitas requisições. Aguarde um minuto.'}}));
  // Provider callbacks have no browser session or Origin. Signature and remote
  // payment verification are mandatory; never exempt other write routes.
  router.post('/commercial/webhook',express.json({limit:'32kb'}),async(req,res,next)=>{
   try{const notification=await provider.verifyWebhook({headers:req.headers,query:req.query,body:req.body});await ensureReady();await commercial.processNotification(notification);res.json({ok:true});}catch(error){next(error);}
  });
  router.use((req,res,next)=>{if(req.method==='POST'&&!origins.includes(req.headers.origin))return res.status(403).json({error:'Origem não autorizada.'});next();});
  router.use(express.json({limit:'16mb'}));
  // Bootstrap only this product's isolated schema in the deployed database.
  // A failed initialization is retried by the next request, without stopping other apps.
  router.use(async(req,res,next)=>{try{await ensureReady();next();}catch(error){next(error);}});
  router.use(async(req,res,next)=>{if(['/health','/workspace/login','/workspace/register','/workspace/accept-invite','/workspace/me','/workspace/recovery-status','/workspace/forgot-password','/workspace/reset-password','/workspace/registration-status','/workspace/verify-registration'].includes(req.path))return next();try{const actor=await new IdentityService(db).authenticate(sessionToken(req));if(req.method==='POST'||req.headers['x-ss-user']||req.headers['x-ss-organization'])fail(req.headers['x-ss-user']===actor.id&&req.headers['x-ss-organization']===actor.organizationId,'A conta mudou em outra aba. Atualize antes de continuar.',409);req.accountActor=actor;next();}catch(error){next(error);}});
  router.use('/workspace/commercial',commercialRouter(commercial));
  router.use(async(req,res,next)=>{try{
   if(req.accountActor&&!['/workspace/logout','/health'].includes(req.path))await assertCommercialAccess(db,req.accountActor);
   next();
  }catch(error){next(error);}});
  router.use('/workspace',workspaceRouter(db,{secureCookies,recoveryMailer,registrationVerification}));
  const token=req=>{const session=sessionToken(req);fail(session,'Entre na sua conta para acessar este conteúdo.',401);return 'session.'+session;};
  const wrap=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){next(e);}};
  router.get('/health',wrap(async(req,res)=>res.json(await service.health())));
  router.post('/boards',wrap(async(req,res)=>{const actor=await new IdentityService(db).authenticate(sessionToken(req));fail(['admin','manager'].includes(actor.role),'Seu cargo não permite criar diários.',403);res.status(409).json({error:'Crie o diário pelo empreendimento da conta.'});}));
  router.get('/boards/:id',wrap(async(req,res)=>res.json(await service.read(req.params.id,token(req)))));
  router.post('/boards/:id/cover',wrap(async(req,res)=>res.json(await setProjectCover(service,req.params.id,token(req),req.body))));
  router.get('/boards/:id/cover',wrap(async(req,res)=>{res.set({'Content-Type':'image/jpeg','Content-Security-Policy':"default-src 'none'; sandbox"}).send(await projectCover(service,req.params.id,token(req)));}));
  router.post('/boards/:id/folders',wrap(async(req,res)=>res.json(await changeFolder(service,req.params.id,token(req),req.body))));
  router.post('/boards/:id/documents',wrap(async(req,res)=>res.json(await beginUpload(service,req.params.id,token(req),req.body))));
  router.post('/boards/:id/documents/:fileId/parts',wrap(async(req,res)=>res.json(await uploadPart(service,req.params.id,token(req),req.params.fileId,req.body))));
  router.post('/boards/:id/documents/:fileId/complete',wrap(async(req,res)=>res.json(await completeUpload(service,req.params.id,token(req),req.params.fileId))));
  router.post('/boards/:id/documents/:fileId/manage',wrap(async(req,res)=>res.json(await manageDocument(service,req.params.id,token(req),req.params.fileId,req.body))));
  router.get('/boards/:id/documents/:fileId/parts/:index',wrap(async(req,res)=>{const part=await downloadPart(service,req.params.id,token(req),req.params.fileId,Number(req.params.index));res.set({'Content-Type':'application/octet-stream','Content-Security-Policy':"default-src 'none'; sandbox"}).send(part);}));
  router.post('/boards/:id/reminders',wrap(async(req,res)=>res.json(await changeReminder(service,req.params.id,token(req),req.body))));
  router.post('/boards/:id/entries',wrap(async(req,res)=>res.status(201).json(await service.publish(req.params.id,token(req),req.body))));
  router.post('/boards/:id/manage',wrap(async(req,res)=>res.json(await service.manage(req.params.id,token(req),req.body))));
  router.get('/boards/:id/photos/:photoId',wrap(async(req,res)=>{const photo=await service.photo(req.params.id,req.params.photoId,token(req));res.set({'Content-Type':'image/jpeg','Content-Security-Policy':"default-src 'none'; sandbox",'Cross-Origin-Resource-Policy':'same-origin'}).send(photo);}));
  router.use((error,req,res,next)=>{if(res.headersSent)return next(error);const status=error.status||500;res.status(status).json({error:status===500?'Diário indisponível no momento. Nenhuma nova publicação foi confirmada.':status===413?'Fotos muito grandes. Envie até seis fotos preparadas por vez.':error.message});});
  return router;
}
