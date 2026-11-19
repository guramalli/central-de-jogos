import express from 'express';
// Authentication, account-context and Origin checks are supplied by diaryRouter.
export function commercialRouter(service){
 const router=express.Router(),wrap=fn=>async(req,res,next)=>{try{res.json(await fn(req));}catch(error){next(error);}};
 router.get('/status',wrap(req=>service.status(req.accountActor)));
 router.post('/checkout',wrap(req=>service.checkout(req.accountActor)));
 router.post('/cancel',wrap(req=>service.cancel(req.accountActor)));
 router.get('/support',wrap(req=>service.supportList(req.accountActor)));
 router.post('/support',wrap(req=>service.createSupport(req.accountActor,req.body)));
 router.post('/support/reply',wrap(req=>service.replySupport(req.accountActor,req.body)));
 router.get('/platform',wrap(req=>service.platformOverview(req.accountActor)));
 router.get('/platform/tickets',wrap(req=>service.platformTickets(req.accountActor)));
 router.post('/platform/reply',wrap(req=>service.platformReply(req.accountActor,req.body)));
 router.post('/platform/license',wrap(req=>service.platformSetLicense(req.accountActor,req.body)));
 return router;
}
