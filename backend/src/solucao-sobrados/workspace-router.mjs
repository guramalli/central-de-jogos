import express from 'express';
import {IdentityService} from './identity-service.mjs';
import {WorkspaceService} from './workspace-service.mjs';
export const COOKIE='ss_account';
export function sessionToken(req){const value=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);return /^[A-Za-z0-9_-]{43}$/.test(value||'')?value:null;}
export function workspaceRouter(db,{secureCookies=true}={}){const router=express.Router(),identity=new IdentityService(db),workspaces=new WorkspaceService(db),wrap=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){next(e);}},user=req=>identity.authenticate(sessionToken(req));
 const cookie=(res,token)=>res.set('Set-Cookie',`${COOKIE}=${token||''}; Path=/api/solucao-sobrados/diary; HttpOnly; SameSite=Strict; Max-Age=${token?604800:0}${secureCookies?'; Secure':''}`);
 const signed=(res,out)=>{cookie(res,out.token);res.json({user:out.user});};
 router.post('/register',wrap(async(req,res)=>signed(res,await identity.register(req.body,req.ip||req.socket.remoteAddress))));
 router.post('/login',wrap(async(req,res)=>signed(res,await identity.login(req.body,req.ip||req.socket.remoteAddress))));
 router.post('/accept-invite',wrap(async(req,res)=>signed(res,await identity.acceptInvite(req.body,req.ip||req.socket.remoteAddress))));
 router.post('/logout',wrap(async(req,res)=>{const token=sessionToken(req);if(token)await identity.logout(token);cookie(res,'');res.json({ok:true});}));
 router.get('/me',wrap(async(req,res)=>res.json(await workspaces.read(await user(req)))));
 router.post('/command',wrap(async(req,res)=>res.json(await workspaces.execute(await user(req),req.body))));
 router.post('/restore',wrap(async(req,res)=>res.json(await workspaces.restore(await user(req),req.body))));
 router.get('/users',wrap(async(req,res)=>res.json({users:await identity.listUsers(await user(req))})));
 router.post('/users',wrap(async(req,res)=>res.json({user:await identity.updateUser(await user(req),req.body)})));
 router.post('/invite',wrap(async(req,res)=>res.json(await identity.invite(await user(req),req.body))));
 router.get('/maintenance',wrap(async(req,res)=>res.json(await workspaces.maintenance(await user(req)))));
 router.post('/maintenance',wrap(async(req,res)=>res.json(await workspaces.maintenance(await user(req),req.body))));
 router.post('/boards',wrap(async(req,res)=>res.json(await workspaces.connectBoard(await user(req),req.body))));
 return router;
}
