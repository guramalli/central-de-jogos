/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👑 CHEFÕES COM PRESENÇA (v353 — dono: "os chefões estão pouco animados... talvez um som, algo brilhando")
   Vale para TODO chefão (MONSTROS[..].chefe), em qualquer mapa:
   - AURA: brilho pulsando no chão + anel de runas girando + brasinhas subindo (cor própria de cada chefão).
   - ENTRADA: na primeira vez que você chega perto, ele RUGE (som), a tela treme e aparece a BARRA DO CHEFÃO no alto.
   - FÚRIA: abaixo de 50% de vida a aura fica vermelha e pulsa mais rápido (som + tremida). Só visual fora da Torre
     — na Torre ele também fica mais forte (torre_desafio.js).
   - QUEDA: som de vitória + explosão de estrelas + tremida.
   Carregar DEPOIS de game.js/audio.js (embrulha desenhaEnt, desenha, matar).
   ============================================================ */
const CV_CHEFE = { treme: 0, forca: 0, barra: null };
const MENOS_MOVIMENTO = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })(); // acessibilidade: sem tremida
function tremeTela(ms, forca) { if (MENOS_MOVIMENTO) return; CV_CHEFE.treme = Math.max(CV_CHEFE.treme, G.agora + ms); CV_CHEFE.forca = Math.max(CV_CHEFE.treme > G.agora ? CV_CHEFE.forca : 0, forca); }
function corChefe(m) {
  if (m._cv && m._cv.furia) return [255, 50, 40];
  if (/_g$/.test(m.tipo || '')) return [255, 40, 70];
  let h = 0; for (const c of String(m.tipo || m.d.nome)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return [[255, 150, 40], [190, 70, 255], [60, 200, 255], [255, 70, 150], [120, 255, 120], [255, 220, 60]][h % 6];
}
// ---- aura (desenhada ATRÁS do chefão) ----
{
  const _entCV = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    if (e && e !== G.p && e.d && e.d.chefe && !e.d.treino && e.hp > 0) try { auraChefe(ctx, e); } catch (er) { }
    return _entCV.apply(this, arguments);
  };
}
function auraChefe(ctx, m) {
  const cv = m._cv || (m._cv = { brasas: [], visto: false, furia: false, ult: G.agora });
  const [r, g, b] = corChefe(m), t = G.agora, rap = cv.furia ? 160 : 380, pul = 0.7 + 0.3 * Math.sin(t / rap);
  const x = m.x * T, y = m.y * T, alt = (typeof alturaEnt === 'function' ? alturaEnt(m) : 1.6) * T, R = Math.max(1.1 * T, alt * 0.55);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  // brilho no chão
  let gr = ctx.createRadialGradient(x, y, 4, x, y, R * 1.25);
  gr.addColorStop(0, `rgba(${r},${g},${b},${0.42 * pul})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, R * 1.25, R * 0.55, 0, 0, 7); ctx.fill();
  // coluna de luz atrás do corpo
  gr = ctx.createRadialGradient(x, y - alt * 0.5, 4, x, y - alt * 0.5, alt * 0.75);
  gr.addColorStop(0, `rgba(${r},${g},${b},${0.22 * pul})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gr; ctx.fillRect(x - alt, y - alt * 1.3, alt * 2, alt * 1.4);
  // anel de runas girando (dois arcos em sentidos opostos)
  ctx.lineWidth = 3; ctx.strokeStyle = `rgba(${r},${g},${b},${0.75 * pul})`; ctx.setLineDash([10, 9]);
  ctx.lineDashOffset = -t / 25; ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.42, 0, 0, 7); ctx.stroke();
  ctx.lineWidth = 2; ctx.setLineDash([4, 14]); ctx.lineDashOffset = t / 18; ctx.beginPath(); ctx.ellipse(x, y, R * 0.78, R * 0.33, 0, 0, 7); ctx.stroke();
  ctx.setLineDash([]);
  // brasinhas subindo
  const dt = Math.min(100, t - cv.ult); cv.ult = t;
  if (cv.brasas.length < (cv.furia ? 22 : 14) && Math.random() < (cv.furia ? 0.6 : 0.35)) cv.brasas.push({ dx: (Math.random() - 0.5) * R * 1.6, dy: 0, v: 0.04 + Math.random() * 0.05, vida: 1, s: 2 + Math.random() * 2.5 });
  for (let i = cv.brasas.length - 1; i >= 0; i--) {
    const p = cv.brasas[i]; p.dy -= p.v * dt; p.vida -= dt / 1400; p.dx += Math.sin((t + i * 300) / 300) * 0.3;
    if (p.vida <= 0) { cv.brasas.splice(i, 1); continue; }
    ctx.fillStyle = `rgba(${r},${g},${b},${p.vida})`; ctx.beginPath(); ctx.arc(x + p.dx, y + p.dy * 0.9, p.s, 0, 7); ctx.fill();
    ctx.fillStyle = `rgba(255,255,230,${p.vida * 0.8})`; ctx.beginPath(); ctx.arc(x + p.dx, y + p.dy * 0.9, p.s * 0.4, 0, 7); ctx.fill();
  }
  ctx.restore();
}
// ---- entrada, fúria e barra do chefão ----
{
  const _atuCV = atualiza;
  atualiza = function (dt) { const r = _atuCV.apply(this, arguments); try { passoChefes(); } catch (e) { } return r; };
}
function passoChefes() {
  if (!G.p || !G.mons) return;
  let perto = null, dPerto = 11;
  for (const m of G.mons) {
    if (!m.d.chefe || m.d.treino || !(m.hp > 0)) continue;
    const d = Math.hypot(m.x - G.p.x, m.y - G.p.y), cv = m._cv || (m._cv = { brasas: [], visto: false, furia: false, ult: G.agora });
    if (d < dPerto) { dPerto = d; perto = m; }
    if (!cv.visto && d < 9) {
      cv.visto = true; som('chefe_rugido'); tremeTela(650, 7); efeito('area', m.x, m.y, `rgb(${corChefe(m)})`, 3);
      if (typeof texto === 'function') texto(m, '👑 ' + (m.d.falas && m.d.falas[0] || 'GRRR!'), '#ffd27a', 1400, -0.9);
      CV_CHEFE.entrou = G.agora;
    }
    if (!cv.furia && m.hp < m.d.hp * 0.5) {
      cv.furia = true; som('chefe_furia'); tremeTela(450, 5); efeito('aura', m.x, m.y, '#ff2a2a');
      if (!(G.mapa && G.mapa.torre) && typeof texto === 'function') texto(m, '😡 FÚRIA!', '#ff5a4a', 1200, -0.9);
    }
  }
  barraChefe(perto);
}
function barraChefe(m) {
  let b = document.getElementById('chefeBarra');
  if (!m) { if (b) b.classList.remove('on'); CV_CHEFE.barra = null; return; }
  if (!b) {
    b = el('div', { id: 'chefeBarra' }); b.innerHTML = /*pt-en*/'<div class="cb-nome"></div><div class="cb-fundo"><div class="cb-atras"></div><div class="cb-vida"></div><div class="cb-txt"></div></div>';
    document.body.append(b);
  }
  if (CV_CHEFE.barra !== m) { CV_CHEFE.barra = m; b.classList.remove('entra'); void b.offsetWidth; b.classList.add('entra'); m._cvAtras = m.hp / m.d.hp; }
  b.classList.add('on');
  const k = Math.max(0, m.hp / m.d.hp), [r, g, bl] = corChefe(m);
  m._cvAtras = Math.max(k, (m._cvAtras || k) - 0.004);
  const nome = `👑 ${m.d.nome}` + (m._cv && m._cv.furia ? ' · 😡 FÚRIA' : '');
  const qn = b.querySelector('.cb-nome'); if (qn.textContent !== nome) qn.textContent = nome;
  b.querySelector('.cb-vida').style.cssText = `width:${k * 100}%;background:linear-gradient(180deg,rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, bl + 60)}),rgb(${r},${g},${bl}))`;
  b.querySelector('.cb-atras').style.width = m._cvAtras * 100 + '%';
  const pc = `${Math.ceil(k * 100)}%`, qt = b.querySelector('.cb-txt'); if (qt.textContent !== pc) qt.textContent = pc;
  b.classList.toggle('furia', !!(m._cv && m._cv.furia));
}
// ---- tremida de tela (só a câmera; o jogo não muda) ----
{
  const _desCV = desenha;
  desenha = function () {
    if (CV_CHEFE.treme > G.agora && G.cam) {
      const f = CV_CHEFE.forca * Math.min(1, (CV_CHEFE.treme - G.agora) / 300), ox = (Math.random() - 0.5) * f * 2, oy = (Math.random() - 0.5) * f * 2;
      G.cam.x += ox; G.cam.y += oy; const r = _desCV.apply(this, arguments); G.cam.x -= ox; G.cam.y -= oy; return r;
    }
    return _desCV.apply(this, arguments);
  };
}
// ---- queda do chefão ----
{
  const _matCV = matar;
  matar = function (m) {
    const chefe = m && m.d && m.d.chefe && !m.d.treino;
    const r = _matCV.apply(this, arguments);
    if (chefe) { try { som('chefe_queda'); tremeTela(700, 8); efeito('explosao', m.x, m.y, `rgb(${corChefe(m)})`); efeito('estrelas', m.x, m.y, '#ffe14a'); efeito('nivel', m.x, m.y); } catch (e) { } }
    return r;
  };
}
{
  const css = document.createElement('style');
  css.textContent = `#chefeBarra { position: fixed; top: 96px; left: 50%; width: min(460px, 86vw); transform: translate(-50%, -12px); opacity: 0; z-index: 59; pointer-events: none; transition: opacity .3s, transform .3s; text-align: center; }
  #chefeBarra.on { opacity: 1; transform: translate(-50%, 0); }
  #chefeBarra.entra .cb-nome { animation: cbEntra .7s cubic-bezier(.2,1.6,.4,1); }
  #chefeBarra .cb-nome { font: 900 16px Fredoka, Nunito, sans-serif; color: #ffe3b0; text-shadow: 0 2px 0 #000, 0 0 10px rgba(255,120,40,.8); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #chefeBarra .cb-fundo { position: relative; height: 16px; border-radius: 9px; background: rgba(20,4,10,.85); border: 2px solid #ffcf6a; box-shadow: 0 0 12px rgba(255,140,40,.55), 0 3px 8px rgba(0,0,0,.5); overflow: hidden; }
  #chefeBarra .cb-atras { position: absolute; inset: 0 auto 0 0; background: rgba(255,255,255,.75); }
  #chefeBarra .cb-vida { position: absolute; inset: 0 auto 0 0; transition: width .12s; }
  #chefeBarra .cb-txt { position: absolute; inset: 0; font: 800 11px Nunito, sans-serif; color: #fff; line-height: 13px; text-shadow: 0 1px 2px #000; }
  #chefeBarra.furia .cb-fundo { border-color: #ff4a3a; animation: cbFuria .45s ease-in-out infinite alternate; }
  @keyframes cbEntra { 0% { transform: scale(2.2); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { #chefeBarra.entra .cb-nome, #chefeBarra.furia .cb-fundo { animation: none; } }
  @keyframes cbFuria { from { box-shadow: 0 0 8px rgba(255,40,40,.6); } to { box-shadow: 0 0 22px rgba(255,40,40,1); } }`;
  document.head.append(css);
}
