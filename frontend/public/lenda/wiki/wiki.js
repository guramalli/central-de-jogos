/* Wiki do Lenda do Campinho — © 2026 Educação Gamer. Busca (índice pequeno em busca.json) e filtros das listas. Sem dependências. */
(function () {
  'use strict';
  var raiz = document.body.getAttribute('data-raiz') || '';
  var sem = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

  /* ---------- busca ---------- */
  var campo = document.getElementById('busca'), caixa = document.getElementById('resultados');
  var indice = null, pedindo = null, ativo = -1;
  function carrega() {
    if (indice || pedindo) return pedindo;
    pedindo = fetch(raiz + 'busca.json').then(function (r) { return r.json(); }).then(function (j) { j.l.forEach(function (e) { e[4] = sem(e[0]); }); indice = j; return j; }).catch(function () { pedindo = null; });
    return pedindo;
  }
  function procura(q) {
    var ps = sem(q).split(/\s+/).filter(Boolean); if (!ps.length || !indice) return [];
    var res = [];
    for (var i = 0; i < indice.l.length; i++) {
      var e = indice.l[i], nm = e[4], ok = true;
      for (var k = 0; k < ps.length; k++) if (nm.indexOf(ps[k]) < 0) { ok = false; break; }
      if (!ok) continue;
      var nota = nm === ps.join(' ') ? 0 : nm.indexOf(ps[0]) === 0 ? 1 : 2;
      res.push([nota, nm.length, e]);
    }
    res.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    return res.slice(0, 40).map(function (r) { return r[2]; });
  }
  function mostra() {
    var q = campo.value.trim();
    if (!q) { caixa.hidden = true; return; }
    if (!indice) { carrega().then(mostra); return; }
    var l = procura(q); ativo = -1;
    caixa.innerHTML = l.length ? l.map(function (e) { return '<a href="' + esc(raiz + e[1]) + '"><i>' + esc(indice.tipos[e[2]] || '') + '</i><span>' + esc(e[0]) + '</span><small>' + esc(e[3]) + '</small></a>'; }).join('')
      : '<p>' + esc(document.body.getAttribute('data-vazio') || '') + '</p>';
    caixa.hidden = false;
  }
  if (campo && caixa) {
    campo.addEventListener('focus', carrega);
    campo.addEventListener('input', mostra);
    campo.addEventListener('keydown', function (ev) {
      var as = caixa.querySelectorAll('a');
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { if (!as.length) return; ev.preventDefault(); ativo = (ativo + (ev.key === 'ArrowDown' ? 1 : -1) + as.length) % as.length; as.forEach(function (a, i) { a.classList.toggle('ativo', i === ativo); }); as[ativo].scrollIntoView({ block: 'nearest' }); }
      else if (ev.key === 'Enter') { var a = as[ativo >= 0 ? ativo : 0]; if (a) { ev.preventDefault(); location.href = a.href; } }
      else if (ev.key === 'Escape') { caixa.hidden = true; campo.blur(); }
    });
    document.addEventListener('click', function (ev) { if (!caixa.contains(ev.target) && ev.target !== campo) caixa.hidden = true; });
    document.addEventListener('keydown', function (ev) { if (ev.key === '/' && document.activeElement !== campo && !/input|select|textarea/i.test((document.activeElement || {}).tagName || '')) { ev.preventDefault(); campo.focus(); } });
  }

  /* ---------- filtros das listas ---------- */
  document.querySelectorAll('.filtros[data-lista]').forEach(function (f) {
    var alvo = document.getElementById(f.getAttribute('data-lista')); if (!alvo) return;
    var tx = f.querySelector('.f-texto'), rg = f.querySelector('.f-reg'), tp = f.querySelector('.f-tipo'), mn = f.querySelector('.f-min'), mx = f.querySelector('.f-max'), conta = f.querySelector('.f-conta');
    var linhas = Array.prototype.slice.call(alvo.querySelectorAll('[data-t]'));
    var grupos = Array.prototype.slice.call(alvo.querySelectorAll('.grupo'));
    function aplica() {
      var ps = sem(tx && tx.value).split(/\s+/).filter(Boolean), r = rg ? rg.value : '', k = tp ? tp.value : '';
      var a = mn && mn.value !== '' ? Number(mn.value) : -Infinity, b = mx && mx.value !== '' ? Number(mx.value) : Infinity, vis = 0;
      linhas.forEach(function (l) {
        var t = l.getAttribute('data-t'), ok = true;
        for (var i = 0; i < ps.length; i++) if (t.indexOf(ps[i]) < 0) { ok = false; break; }
        if (ok && r && l.getAttribute('data-r') !== r) ok = false;
        if (ok && k && l.getAttribute('data-k') !== k) ok = false;
        var nv = Number(l.getAttribute('data-n') || 0); if (ok && (nv < a || nv > b)) ok = false;
        l.hidden = !ok; if (ok) vis++;
      });
      grupos.forEach(function (g) { g.hidden = !g.querySelector('[data-t]:not([hidden])'); });
      if (conta) conta.textContent = (conta.getAttribute('data-txt') || '').replace('{n}', vis).replace('{t}', linhas.length);
    }
    [tx, rg, tp, mn, mx].forEach(function (e) { if (e) { e.addEventListener('input', aplica); e.addEventListener('change', aplica); } });
    // ?q=... no endereço já filtra (links de fora)
    try { var q = new URLSearchParams(location.search).get('q'); if (q && tx) tx.value = q; } catch (e) { }
    aplica();
  });
})();
