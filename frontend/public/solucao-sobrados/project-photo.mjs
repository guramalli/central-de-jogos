import {accountHeaders} from './account-ui.mjs?v=20261118-access8';
// Authenticated thumbnail only; originals stay in Documentos e projetos.
export function mountProjectPhoto({container,access,api='/api/solucao-sobrados/diary'}){
  if(!container||!access)return ()=>{};
  const connection=()=>typeof access==='function'?access():access;
  const abort=new AbortController();let stopped=false,busy=false,url=null,shown=null;
  function clear(){container.textContent='⌂';container.title='Empreendimento sem foto definida';if(url)URL.revokeObjectURL(url);url=null;shown=null;}
  async function check(){if(stopped||busy)return;busy=true;try{
    const c=connection();if(!c||c.pending){clear();return;}const headers=c.account?accountHeaders():{Authorization:'Bearer '+(c.token||c.ownerToken)};
    const r=await fetch(`${api}/boards/${c.id}`,{headers,credentials:'same-origin',cache:'no-store',signal:abort.signal});if(!r.ok)throw Error();const board=await r.json();
    if(stopped)return;if(!board.library?.cover){clear();return;}
    const key=board.library.cover.fileId+':'+board.revision;if(key===shown)return;
    const result=await fetch(`${api}/boards/${c.id}/cover`,{headers,credentials:'same-origin',cache:'no-store',signal:abort.signal});if(!result.ok)throw Error();const blob=await result.blob();if(stopped)return;
    clear();url=URL.createObjectURL(blob);shown=key;const img=document.createElement('img');img.src=url;img.alt='Foto do empreendimento '+board.metadata.name;container.replaceChildren(img);container.title=img.alt;
  }catch{if(!stopped)clear();}finally{busy=false;}}
  const changed=e=>{if(e.detail?.id===connection()?.id)check();};window.addEventListener('ss-project-photo-changed',changed);
  check();const timer=setInterval(()=>{if(!document.hidden)check();},30000);
  return ()=>{stopped=true;abort.abort();clearInterval(timer);window.removeEventListener('ss-project-photo-changed',changed);if(url)URL.revokeObjectURL(url);};
}
