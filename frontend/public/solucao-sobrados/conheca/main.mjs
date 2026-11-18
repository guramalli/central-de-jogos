import {mountContact} from './contact.mjs?v=20261118-hotsite1';
mountContact(document);
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const nav=document.querySelector('#site-nav'),toggle=document.querySelector('.nav-toggle');
function closeNav(){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
nav.addEventListener('click',event=>{if(event.target.closest('a'))closeNav();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){closeNav();toggle.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeNav();});
window.matchMedia('(min-width:1051px)').addEventListener('change',event=>{if(event.matches)closeNav();});
const tabs=[...document.querySelectorAll('[role=tab]')];
function selectTab(tab,focus=false){tabs.forEach(item=>{const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!active;});if(focus)tab.focus();}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();selectTab(tabs[next],true);});});
const hero=document.querySelector('#hero-video'),motion=document.querySelector('#motion-toggle');let manualPause=false,loaded=false;
function loadHero(){if(loaded)return;hero.querySelectorAll('source[data-src]').forEach(source=>{source.src=source.dataset.src;delete source.dataset.src;});hero.load();loaded=true;}
async function playHero(){loadHero();try{await hero.play();}catch{motion.textContent='Reproduzir prévia';}}
motion.hidden=false;motion.addEventListener('click',()=>{if(hero.paused){manualPause=false;playHero();}else{manualPause=true;hero.pause();}});
hero.addEventListener('play',()=>{motion.textContent='Pausar prévia';motion.setAttribute('aria-label','Pausar prévia animada');});
hero.addEventListener('pause',()=>{motion.textContent='Reproduzir prévia';motion.setAttribute('aria-label','Reproduzir prévia animada');});
const savingData=Boolean(navigator.connection?.saveData);
if('IntersectionObserver' in window){const videoObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting&&!reduced.matches&&!savingData&&!manualPause)playHero();else if(!entry.isIntersecting)hero.pause();}},{threshold:.25});videoObserver.observe(hero);}
reduced.addEventListener('change',event=>{if(event.matches)hero.pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)hero.pause();});
if('IntersectionObserver' in window&&!reduced.matches){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('reveal-visible');observer.unobserve(entry.target);}});},{threshold:.06});document.querySelectorAll('.section-heading,.continuity-grid,.access-grid,.start-steps,.contact-copy').forEach(el=>{el.classList.add('reveal-pending');observer.observe(el);});}
