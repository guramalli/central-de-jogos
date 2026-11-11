// Gerador de texturas realistas na placa de vídeo (sem arquivos de imagem).
// Cada material é uma função GLSL  mat(uv) -> cor, aspereza, altura, oclusão ; o gerador tira o mapa de normais da altura.
import * as THREE from 'three';

const COMUM = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform int modo; uniform float px; uniform float forcaN;
uniform vec3 corA; uniform vec3 corB; uniform float p1;
float hash1(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
vec2 hash2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453123); }
float gn(vec2 p,float per){
  vec2 i=floor(p),f=fract(p); vec2 u=f*f*f*(f*(f*6.-15.)+10.);
  vec2 a=hash2(mod(i,per))*2.-1., b=hash2(mod(i+vec2(1,0),per))*2.-1., c=hash2(mod(i+vec2(0,1),per))*2.-1., d=hash2(mod(i+vec2(1,1),per))*2.-1.;
  return mix(mix(dot(a,f),dot(b,f-vec2(1,0)),u.x),mix(dot(c,f-vec2(0,1)),dot(d,f-vec2(1,1)),u.x),u.y);
}
// fbm periódico: devolve ~0..1
float fbm(vec2 uv,float per,int oit){
  float a=0.5,s=0.; vec2 p=uv*per;
  for(int k=0;k<9;k++){ if(k>=oit)break; s+=a*gn(p,per); p*=2.; per*=2.; a*=0.5; }
  return clamp(0.5+s*0.95,0.,1.);
}
// voronoi periódico com distância à borda: (borda, id, f1)
vec3 vor(vec2 x,vec2 per){
  vec2 n=floor(x),f=fract(x); vec2 mg=vec2(0.),mr=vec2(0.); float md=8.;
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){ vec2 g=vec2(float(i),float(j)); vec2 o=hash2(mod(n+g,per)); vec2 r=g+o-f; float d=dot(r,r); if(d<md){md=d;mr=r;mg=g;} }
  float me=8.;
  for(int j=-2;j<=2;j++)for(int i=-2;i<=2;i++){ vec2 g=mg+vec2(float(i),float(j)); vec2 o=hash2(mod(n+g,per)); vec2 r=g+o-f; if(dot(mr-r,mr-r)>0.00001) me=min(me,dot(0.5*(mr+r),normalize(r-mr))); }
  return vec3(me,hash1(mod(n+mg,per)+7.3),sqrt(md));
}
`;

const FIM = /* glsl */`
void main(){
  vec3 a; float r,h,ao; mat(vUv,a,r,h,ao);
  if(modo==0){ gl_FragColor=vec4(pow(max(a,0.),vec3(2.2)),r); }
  else if(modo==2){ gl_FragColor=vec4(a,r); }
  else { vec3 a2; float r2,hx,hy,ao2; mat(vUv+vec2(px,0.),a2,r2,hx,ao2); mat(vUv+vec2(0.,px),a2,r2,hy,ao2);
    vec3 n=normalize(vec3((h-hx)*forcaN,(h-hy)*forcaN,1.)); gl_FragColor=vec4(n*0.5+0.5,ao); }
}`;

// ---- os materiais ----
const MATS = {
  grama: { n: 3.0, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float g=fbm(uv,4.,6), d=fbm(uv+.37,24.,4), f=fbm(uv*vec2(1.,1.)+.11,96.,3);
  vec3 c1=vec3(0.115,0.175,0.050), c2=vec3(0.205,0.270,0.085), c3=vec3(0.300,0.300,0.120);
  alb=mix(c1,c2,smoothstep(.25,.75,d)); alb=mix(alb,c3,smoothstep(.62,.9,g)*.55);
  alb*=0.72+0.56*f; float t=fbm(uv+.5,10.,5); alb=mix(alb,vec3(0.20,0.15,0.09),smoothstep(.68,.86,t)*.45);
  h=d*.5+f*.5; rough=0.93; ao=0.75+0.25*f; }` },
  terra: { n: 3.0, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float g=fbm(uv,5.,6), f=fbm(uv+.3,64.,3); vec3 v=vor(uv*26.,vec2(26.)); vec3 v2=vor(uv*9.+3.,vec2(9.));
  alb=mix(vec3(0.30,0.225,0.150),vec3(0.46,0.37,0.265),g); alb*=0.8+0.4*f;
  float ped=step(v.y,.12)*smoothstep(.04,.16,v.x); vec3 cp=mix(vec3(0.36,0.33,0.29),vec3(0.50,0.46,0.40),fract(v.y*37.));
  alb=mix(alb,cp,ped*.75); float ped2=step(v2.y,.08)*smoothstep(.03,.2,v2.x); alb=mix(alb,cp*.85,ped2*.8);
  float sulco=smoothstep(.55,.75,fbm(uv*vec2(1.,.25)+.7,12.,4)); alb*=1.-.22*sulco;
  h=g*.35+f*.25+ped*.55*smoothstep(.04,.3,v.x)+ped2*.8*smoothstep(.03,.4,v2.x)-sulco*.2; rough=0.95-ped*.15; ao=0.8+0.2*f; }` },
  areia: { n: 1.6, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float g=fbm(uv,3.,5), f=fbm(uv+.2,128.,2); float w=fbm(uv+.6,6.,4);
  float rip=0.5+0.5*sin((uv.y*38.+w*7.+uv.x*5.)*6.2831853/6.2831853*6.2831853);
  alb=mix(vec3(0.66,0.56,0.40),vec3(0.80,0.71,0.54),g); alb*=0.9+0.2*f; alb*=0.94+0.10*rip;
  vec3 v=vor(uv*40.,vec2(40.)); float c=step(v.y,.05)*smoothstep(.05,.2,v.x); alb=mix(alb,vec3(0.86,0.83,0.78),c*.8);
  h=rip*.45+g*.3+f*.15+c*.5; rough=0.96; ao=0.9+0.1*rip; }` },
  rocha: { n: 4.5, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float g=fbm(uv,3.,7), f=fbm(uv+.4,48.,4); vec3 v=vor(uv*5.+fbm(uv,8.,3)*.8,vec2(5.));
  float estr=fbm(vec2(uv.x*.3,uv.y)+.1,14.,4);
  alb=mix(vec3(0.235,0.225,0.215),vec3(0.47,0.445,0.41),g*.6+estr*.4); alb*=0.75+0.5*f;
  float fenda=1.-smoothstep(0.,.045,v.x); alb*=1.-.6*fenda;
  float liq=smoothstep(.6,.8,fbm(uv+.9,7.,5)); alb=mix(alb,vec3(0.36,0.40,0.20),liq*.45);
  float liq2=smoothstep(.72,.85,fbm(uv+.23,11.,5)); alb=mix(alb,vec3(0.62,0.58,0.40),liq2*.35);
  h=g*.6+f*.25+estr*.2-fenda*.6+v.y*.25; rough=0.86; ao=1.-.5*fenda; }` },
  pavimento: { n: 2.2, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  vec2 q=uv*vec2(3.,6.); float row=floor(q.y); q.x+=0.5*mod(row,2.)+floor(hash1(vec2(row,3.))*3.)/3.*0.; vec2 id=vec2(mod(floor(q.x),3.),row); vec2 f=fract(q);
  float e=min(min(f.x,1.-f.x)/3.,min(f.y,1.-f.y)/6.); float junta=smoothstep(.0015,.0055,e);
  float hs=hash1(id+.5); float g=fbm(uv,6.,6), s=fbm(uv+.3,160.,2), m=fbm(uv+.7,20.,4);
  vec3 c=mix(vec3(0.50,0.47,0.42),vec3(0.67,0.63,0.56),hs); c=mix(c,vec3(0.58,0.50,0.41),step(.7,hash1(id+9.))*.6);
  c*=0.82+0.36*s; c*=0.85+0.3*g; c*=0.78+0.22*smoothstep(0.,.05,e);
  float gasto=smoothstep(.55,.8,m); c=mix(c,c*1.18,gasto*.5);
  vec3 cj=mix(vec3(0.27,0.24,0.20),vec3(0.24,0.29,0.14),smoothstep(.5,.75,fbm(uv+.5,9.,4)));
  alb=mix(cj,c,junta);
  float racha=1.-smoothstep(0.,.02,vor(uv*4.+hs,vec2(4.)).x); alb*=1.-.35*racha*step(.6,hash1(id+2.));
  h=junta*(.75+.1*hs+.12*g+.05*s)-racha*.1; rough=mix(0.95,0.62+0.2*s,junta)-gasto*.12; ao=0.55+0.45*smoothstep(0.,.03,e); }` },
  calcada: { n: 3.2, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  vec3 v=vor(uv*11.,vec2(11.)); float s=fbm(uv+.3,128.,2), g=fbm(uv,5.,5);
  float ped=smoothstep(.015,.11,v.x);
  vec3 c=mix(vec3(0.40,0.375,0.34),vec3(0.60,0.56,0.49),v.y); c=mix(c,vec3(0.52,0.43,0.35),step(.75,fract(v.y*13.))*.5);
  c*=0.8+0.4*s; c*=0.85+0.3*g;
  vec3 cj=mix(vec3(0.24,0.20,0.16),vec3(0.22,0.27,0.13),smoothstep(.55,.8,fbm(uv+.5,7.,4)));
  alb=mix(cj,c,ped);
  h=smoothstep(.0,.2,v.x)*(.7+.3*v.y)+s*.06; rough=mix(0.96,0.66+.2*s,ped); ao=0.5+0.5*smoothstep(0.,.1,v.x); }` },
  tijolo: { n: 2.6, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  vec2 q=uv*vec2(5.,12.); float row=floor(q.y); q.x+=0.5*mod(row,2.); vec2 id=vec2(mod(floor(q.x),5.),row); vec2 f=fract(q);
  float e=min(min(f.x,1.-f.x)/5.,min(f.y,1.-f.y)/12.); float junta=smoothstep(.003,.008,e);
  float hs=hash1(id+.5); float s=fbm(uv+.3,128.,3), g=fbm(uv,4.,6);
  vec3 c=mix(corA,corB,hs); c=mix(c,c*vec3(1.12,1.02,.9),step(.72,hash1(id+5.))*.7);
  c*=0.78+0.44*s; float esc=fbm(vec2(uv.x,uv.y*.12)+.6,22.,4); c*=0.8+0.3*esc; c*=0.85+0.3*g;
  float lasca=smoothstep(.62,.8,fbm(uv+hs,30.,3))*(1.-smoothstep(0.,.03,e));
  vec3 cj=vec3(0.50,0.48,0.43)*(0.8+0.3*s);
  alb=mix(cj,c,junta*(1.-lasca*.7));
  float musgo=smoothstep(.62,.82,fbm(uv+.21,6.,5)); alb=mix(alb,vec3(0.20,0.25,0.10),musgo*.35);
  h=junta*(.7+.15*hs+.1*s)-lasca*.3; rough=0.9; ao=0.6+0.4*smoothstep(0.,.02,e); }` },
  reboco: { n: 0.9, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float g=fbm(uv,4.,6), s=fbm(uv+.3,90.,3), m=fbm(vec2(uv.x,uv.y*.2)+.5,10.,5);
  alb=mix(corA,corB,g); alb*=0.9+0.2*s; alb*=0.86+0.2*m;
  vec3 v=vor(uv*3.+fbm(uv,6.,3),vec2(3.)); float r=1.-smoothstep(0.,.006,v.x); alb*=1.-.3*r*step(.5,v.y);
  float man=smoothstep(.66,.85,fbm(uv+.8,5.,5)); alb=mix(alb,alb*vec3(0.8,0.76,0.66),man*.6);
  h=g*.4+s*.35-r*.3; rough=0.92; ao=1.; }` },
  laca: { n: 0.8, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float g=fbm(vec2(uv.x*1.,uv.y*.08)+.2,40.,4), s=fbm(uv+.3,100.,3), m=fbm(uv,5.,5);
  alb=mix(corA,corB,g); alb*=0.86+0.28*m;
  float gasto=smoothstep(.70,.86,fbm(uv+.6,9.,5)); alb=mix(alb,vec3(0.17,0.10,0.07),gasto*.55);
  float po=smoothstep(.5,.9,fbm(uv+.9,3.,4)); alb=mix(alb,alb*.8+vec3(0.05,0.045,0.04),po*.3);
  h=g*.5+s*.2-gasto*.3; rough=mix(p1,0.85,gasto)+s*.08; ao=1.; }` },
  madeira: { n: 1.6, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float np=6.; float xi=floor(uv.x*np); float fx=fract(uv.x*np); float hs=hash1(vec2(xi,1.));
  vec2 u2=vec2(uv.x,uv.y+hs*3.);
  float w=fbm(vec2(u2.x*2.,u2.y*.5)+hs,6.,4); float veio=0.5+0.5*sin((u2.x*np*9.+w*14.)*6.2831853);
  float g=fbm(vec2(u2.x,u2.y*.06)+.2,70.,4), s=fbm(uv+.3,110.,2);
  vec3 c=mix(corA,corB,hs*.6+g*.4); c*=0.84+0.22*veio; c*=0.86+0.24*s;
  float e=min(fx,1.-fx)/np; float junta=smoothstep(.001,.006,e);
  float no=1.-smoothstep(.0,.05,length(vec2(fx-.5,fract(uv.y*2.+hs)-.5)*vec2(1.,.6))-.02); c=mix(c,c*.5,no*step(.6,hash1(vec2(xi,floor(uv.y*2.+hs)))));
  alb=c*mix(0.35,1.,junta);
  h=junta*(.6+.2*g+.12*veio); rough=0.82; ao=0.6+0.4*junta; }` },
  telha: { n: 5.0, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float nc=8., nr=5.; float ci=floor(uv.x*nc); float f=fract(uv.x*nc); float d=abs(f-.5);
  float capa=step(d,.24);
  float hc=capa*(0.62+0.38*sqrt(max(0.,1.-(d/.24)*(d/.24)))) + (1.-capa)*0.36*pow(clamp((.5-d)/.26,0.,1.),1.4);
  float vy=uv.y*nr+ (1.-capa)*.5; float ri=floor(vy); float gy=fract(vy);
  float sobre=gy*.16; float aresta=1.-smoothstep(0.,.06,gy);
  float hs=hash1(vec2(ci+capa*17.,mod(ri,nr))); float s=fbm(uv+.3,96.,3), g=fbm(uv,5.,6);
  vec3 c=mix(corA,corB,hs*.7+g*.3); c*=0.8+0.4*s; c*=0.9+0.25*capa;
  float liq=smoothstep(.6,.82,fbm(uv+.7,8.,5)); c=mix(c,vec3(0.26,0.30,0.16),liq*p1);
  float po=smoothstep(.5,.85,fbm(uv+.15,4.,4)); c=mix(c,c+vec3(0.08,0.07,0.05),po*.5*(1.-capa));
  alb=c*(1.-.55*aresta);
  h=hc+sobre-aresta*.12; rough=mix(0.9,0.55,p1<.25?1.:0.)*(.9+.2*s); if(p1<.25) rough=0.30+0.25*s;
  ao=mix(0.5,1.,capa)*(1.-.4*aresta); }` },
  casca: { n: 4.0, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  vec3 v=vor(uv*vec2(9.,2.5)+fbm(uv,6.,3)*.7,vec2(9.,2.5)); float s=fbm(uv+.3,64.,4), g=fbm(uv,4.,5);
  float sulco=1.-smoothstep(0.,.13,v.x);
  alb=mix(corA,corB,v.y*.5+g*.5); alb*=0.75+0.5*s; alb*=1.-.6*sulco;
  float liq=smoothstep(.66,.84,fbm(uv+.5,6.,5)); alb=mix(alb,vec3(0.30,0.36,0.20),liq*.4);
  h=smoothstep(0.,.2,v.x)*.8+s*.2; rough=0.95; ao=1.-.6*sulco; }` },
  trelica: { n: 2.4, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  vec2 q=uv*vec2(6.,8.); vec2 f=fract(q); float e=min(min(f.x,1.-f.x),min(f.y,1.-f.y));
  vec2 f2=fract(q*.5+.25); float d2=abs(abs(f2.x-.5)+abs(f2.y-.5)-.32);
  float ripa=max(1.-smoothstep(.07,.10,e), (1.-smoothstep(.03,.05,d2))*step(.5,hash1(floor(q*.5+.25))+.6));
  float mold=1.-smoothstep(.035,.05,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));
  ripa=max(ripa,mold); float s=fbm(uv+.3,90.,3);
  vec3 papel=mix(vec3(0.62,0.54,0.38),vec3(0.80,0.72,0.54),fbm(uv,7.,5)); vec3 mad=mix(corA,corB,s);
  alb=mix(papel*(0.75+.25*smoothstep(0.,.3,e)),mad,ripa);
  h=ripa*.9+s*.05; rough=mix(0.9,p1,ripa); ao=mix(0.6+.4*smoothstep(.0,.25,e),1.,ripa); }` },
  pintura: { n: 1.2, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float f=fract(uv.x*4.); float xi=floor(uv.x*4.); vec2 p=vec2((f-.5)*1.0,(uv.y-.5)*1.0)*vec2(1.,1.);
  vec3 az=vec3(0.07,0.20,0.42), ve=vec3(0.06,0.34,0.27), ou=vec3(0.80,0.60,0.20), vm=vec3(0.62,0.11,0.07), br=vec3(0.86,0.83,0.74);
  float onda=sin(f*6.2831853*2.)*.12; vec3 c=mix(az,ve,smoothstep(-.02,.02,p.y+onda));
  float l=abs(p.y+onda); c=mix(c,br,1.-smoothstep(.015,.03,l));
  float r=length(p*vec2(1.,1.)); c=mix(c,vm,1.-smoothstep(.20,.215,r)); c=mix(c,ou,1.-smoothstep(.012,.02,abs(r-.21)));
  float pet=0.5+0.5*cos(atan(p.y,p.x)*6.); c=mix(c,br,(1.-smoothstep(.10,.115,r/(.6+.4*pet)))*.9); c=mix(c,ou,1.-smoothstep(.04,.05,r));
  float faixa=1.-smoothstep(.04,.05,min(uv.y,1.-uv.y)); c=mix(c,ou,faixa); float faixa2=1.-smoothstep(.0,.012,abs(min(uv.y,1.-uv.y)-.09)); c=mix(c,vm,faixa2);
  float s=fbm(uv+.3,90.,3), g=fbm(uv,5.,5); c*=0.8+0.3*s; c=mix(c,c*.7+.04,smoothstep(.6,.9,g)*.5);
  alb=c; h=s*.2+faixa*.3; rough=0.6+.2*s; ao=1.; }` },
  tecido: { n: 1.2, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float tr=0.5+0.5*sin(uv.x*6.2831853*90.), ur=0.5+0.5*sin(uv.y*6.2831853*90.); float s=fbm(uv+.3,40.,4), g=fbm(uv,4.,5);
  alb=mix(corA,corB,g)*(0.86+.14*tr*ur)*(0.85+.3*s); float man=smoothstep(.65,.9,fbm(uv+.7,6.,4)); alb*=1.-.25*man;
  h=tr*.3+ur*.3+s*.3; rough=0.95; ao=1.; }` },
  metal: { n: 1.0, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float s=fbm(uv+.3,80.,4), g=fbm(uv,5.,6); alb=mix(corA,corB,g); alb*=0.8+.4*s;
  float ox=smoothstep(.6,.85,fbm(uv+.5,7.,5)); alb=mix(alb,vec3(0.16,0.30,0.24),ox*p1);
  h=s*.4+g*.3; rough=0.38+.3*s+ox*.3; ao=1.; }` },
  agua: { n: 2.2, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  float w=fbm(uv,4.,3); float a=fbm(uv+vec2(w*.12,0.),7.,5), b=fbm(uv.yx+.5+w*.1,13.,4);
  h=a*.65+b*.35; alb=vec3(h); rough=0.; ao=1.; }` },
  ruido: { n: 1.0, src: /* glsl */`
void mat(vec2 uv,out vec3 alb,out float rough,out float h,out float ao){
  alb=vec3(fbm(uv,4.,7),fbm(uv+.37,9.,6),fbm(uv+.71,24.,5)); rough=fbm(uv+.13,48.,4); h=alb.r; ao=1.; }` },
};

const VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;

export class TexGen {
  constructor(renderer) {
    this.r = renderer;
    this.cena = new THREE.Scene();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.cena.add(this.quad);
    this.aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  }
  // devolve { cor, normal }  (cor: sRGB com aspereza no alfa; normal: xyz + oclusão no alfa)
  fazer(nome, { tam = 1024, corA = [0.5, 0.5, 0.5], corB = [0.6, 0.6, 0.6], p1 = 0.5, forca = 1, soCor = false, soNormal = false, linear = false } = {}) {
    const def = MATS[nome];
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: COMUM + def.src + FIM, depthTest: false, depthWrite: false,
      uniforms: { modo: { value: 0 }, px: { value: 1 / tam }, forcaN: { value: def.n * forca * tam / 256 },
        corA: { value: new THREE.Vector3(...corA) }, corB: { value: new THREE.Vector3(...corB) }, p1: { value: p1 } },
    });
    this.quad.material = mat;
    const alvo = (srgb) => {
      const rt = new THREE.WebGLRenderTarget(tam, tam, { depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter,
        wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, colorSpace: srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace });
      rt.texture.anisotropy = this.aniso; rt.texture.wrapS = rt.texture.wrapT = THREE.RepeatWrapping;
      return rt;
    };
    const ant = this.r.getRenderTarget(); const tm = this.r.toneMapping; this.r.toneMapping = THREE.NoToneMapping;
    const saida = {};
    if (!soNormal) { const rt = alvo(!linear); mat.uniforms.modo.value = linear ? 2 : 0; this.r.setRenderTarget(rt); this.r.render(this.cena, this.cam); saida.cor = rt.texture; }
    if (!soCor) { const rt = alvo(false); mat.uniforms.modo.value = 1; this.r.setRenderTarget(rt); this.r.render(this.cena, this.cam); saida.normal = rt.texture; }
    this.r.setRenderTarget(ant); this.r.toneMapping = tm;
    mat.dispose();
    return saida;
  }
}

// o "buraco" em volta do herói: o que estiver entre a câmera e ele fica vazado, para ele nunca sumir atrás de um muro ou de uma copa
export const RECORTE = { uRec: { value: new THREE.Vector4(0, 0, 0, 0) } };
export function recorte(m) {
  const ant = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    if (ant) ant(sh, r); sh.uniforms.uRec = RECORTE.uRec;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec4 uRec;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      if(uRec.z>0.){ vec2 dd=(gl_FragCoord.xy-uRec.xy)/vec2(uRec.z,uRec.z*1.2); float rr=length(dd); float n=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
        if(rr<1. && vViewPosition.z<uRec.w-1.2){ if(n>smoothstep(.5,1.,rr)) discard; }
        if(vViewPosition.z<uRec.w*.3 && n>smoothstep(uRec.w*.22,uRec.w*.3,vViewPosition.z)) discard; }`);
  };
  const k = m.customProgramCacheKey ? m.customProgramCacheKey() : ''; m.customProgramCacheKey = () => k + '_rec';
  return m;
}

// material PBR pronto a partir de um par gerado
export const MACRO = { tRuidoM: { value: null }, uChao: { value: 1.2 }, uMolhado: { value: 0 } };
export function pbr(par, { rep = 1, cor = 0xffffff, metal = 0, rough = 1, normalEsc = 1, env = 1, lados = THREE.FrontSide, sujo = 0, poca = 0 } = {}) {
  const m = new THREE.MeshStandardMaterial({ map: par.cor, normalMap: par.normal, color: cor, metalness: metal, roughness: rough, envMapIntensity: env, side: lados });
  m.normalScale.set(normalEsc, normalEsc);
  // a aspereza vem do alfa da cor; a oclusão vem do alfa do mapa de normais
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tRuidoM = MACRO.tRuidoM; sh.uniforms.uChao = MACRO.uChao; sh.uniforms.uMolhado = MACRO.uMolhado;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRuidoM; uniform float uChao, uMolhado; varying vec3 vWP; float gMolh, gPoca;')
      .replace('#include <map_fragment>', `#include <map_fragment>
      { vec3 mr=texture2D(tRuidoM,(vWP.xz+vWP.y*.37)/23.).rgb; vec3 mr2=texture2D(tRuidoM,(vWP.xz+vWP.y*.61)/71.).rgb; diffuseColor.rgb*=(.80+.40*mr.g)*(.86+.28*mr2.r);
        float pe=smoothstep(uChao+1.5,uChao-.1,vWP.y)*${sujo.toFixed(2)}; diffuseColor.rgb*=1.-pe*(.35+.4*mr.b); diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.86,1.,.72),pe*smoothstep(.45,.75,mr2.b));
        vec3 nW=normalize((vec4(normalize(vNormal),0.)*viewMatrix).xyz); gMolh=uMolhado*smoothstep(-.25,.4,nW.y);
        gPoca=uMolhado*smoothstep(.56,.66,mr2.g*.62+mr.r*.5)*smoothstep(.94,.99,nW.y)*${poca.toFixed(1)}; diffuseColor.rgb*=1.-.30*gMolh-.32*gPoca; }`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * texture2D( map, vMapUv ).a; roughnessFactor = mix(roughnessFactor, .30, gMolh*.6); roughnessFactor = mix(roughnessFactor, .025, gPoca);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = normalize(mix(normal, nonPerturbedNormal, gPoca));')
      .replace('#include <aomap_fragment>', 'float ambientOcclusion = texture2D( normalMap, vNormalMapUv ).a; reflectedLight.indirectDiffuse *= ambientOcclusion; reflectedLight.indirectSpecular *= ambientOcclusion;');
  };
  m.customProgramCacheKey = () => 'pbrgen' + sujo + '_' + poca;
  return m;
}
