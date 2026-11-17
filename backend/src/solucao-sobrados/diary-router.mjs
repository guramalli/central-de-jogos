import {changeReminder} from './reminder-service.mjs';
import {changeFolder,beginUpload,uploadPart,completeUpload,manageDocument,downloadPart} from './document-service.mjs';
import express from 'express';
import rateLimit from 'express-rate-limit';
import {DiaryService,fail,migrate} from './diary-service.mjs';
export function diaryRouter(db,{origins=['https://www.educacaogamer.com.br','https://educacaogamer.com.br']}={}){
  const router=express.Router(),service=new DiaryService(db);
  router.use((req,res,next)=>{res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});next();});
  router.use(rateLimit({windowMs:60000,max:180,standardHeaders:true,legacyHeaders:false,message:{error:'Muitas requisições. Aguarde um minuto.'}}));
  router.use((req,res,next)=>{if(req.method==='POST'&&!origins.includes(req.headers.origin))return res.status(403).json({error:'Origem não autorizada.'});next();});
  router.use(express.json({limit:'4mb'}));
  // Bootstrap only this product's isolated schema in the deployed database.
  // A failed initialization is retried by the next request, without stopping other apps.
  let ready;
  router.use(async(req,res,next)=>{try{if(!ready)ready=migrate(db).catch(error=>{ready=null;throw error;});await ready;next();}catch(error){next(error);}});
  const token=req=>{const a=req.headers.authorization;fail(typeof a==='string'&&a.startsWith('Bearer '),'Abra o link de acesso deste diário.',401);return a.slice(7);};
  const wrap=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){next(e);}};
  router.get('/health',wrap(async(req,res)=>res.json(await service.health())));
  router.post('/boards',wrap(async(req,res)=>res.status(201).json(await service.create(req.body,req.ip||req.socket.remoteAddress))));
  router.get('/boards/:id',wrap(async(req,res)=>res.json(await service.read(req.params.id,token(req)))));
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
