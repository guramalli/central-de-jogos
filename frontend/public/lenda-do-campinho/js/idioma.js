/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌐 IDIOMA DO SITE (06/10/2026 — dono: "Inglês no site para todos")
   O jogo do site tem duas páginas: index.html (português) e index_en.html (inglês, gerada pelo pipeline i18n da frente
   Steam: lenda-steam/ferramentas/i18n_textos.mjs com LENDA_JOGO=<esta pasta> → js_en/ + index_en.html). O SAVE é o
   mesmo nas duas (mesmo site, mesmo localStorage e a mesma conta).
   - Escolha guardada em localStorage.rac_idioma ('pt' ou 'en'). Primeira visita sem escolha: navegador em português
     (navigator.language "pt...") → português; qualquer outro → inglês. Só redireciona no site de verdade
     (educacaogamer.com.br) ou num teste local com localStorage.lenda_idioma_teste = '1' — nunca na bateria de testes,
     no app do Windows nem na Steam (que tem o seu botão 🌐 no steam.js).
   - Botões "Português / English" (bandeiras desenhadas do bandeiras.js) na tela inicial e em ⚙️ Configurações › Interface.
   - No inglês, as mensagens que o SERVIDOR manda em português (feira, guilda, grupo, amigos, torcida, denúncia...) são
     trocadas pelo inglês usando js/idioma_servidor_en.json (pares PT → EN). Mensagem nova no servidor: acrescente lá.
   Carregar no <head>, ANTES de vitrine_entrada.js (que não redireciona se este já estiver saindo da página).
   Prefixo: idi / IDI.
   ============================================================ */
(function (w) {
  'use strict';
  var IDI_KEY = 'rac_idioma', l = w.location;
  var emEn = /index_en\.html$/i.test(l.pathname);
  w.LENDA_IDIOMA = emEn ? 'en' : 'pt';
  var pasta = function () { return l.pathname.replace(/[^\/]*$/, ''); };
  var pagina = function (lang) { return pasta() + (lang === 'en' ? 'index_en.html' : 'index.html') + l.search + l.hash; };
  // ---------- 1ª visita / escolha guardada: vai para a página certa ----------
  try {
    if (!w.LENDA_APP && /^https?:$/.test(l.protocol)) {
      var ls = w.localStorage;
      var site = /^(www\.)?educacaogamer\.com\.br$/.test(l.hostname);
      var teste = /^(localhost|127\.0\.0\.1)$/.test(l.hostname) && ls.getItem('lenda_idioma_teste') === '1';
      if (site || teste) {
        var esc = ls.getItem(IDI_KEY);
        if (esc !== 'pt' && esc !== 'en') esc = /^pt/i.test(navigator.language || '') ? 'pt' : 'en';
        if (esc !== w.LENDA_IDIOMA) { w.LENDA_IDIOMA_SAINDO = true; l.replace(pagina(esc)); return; }
      }
    }
  } catch (e) { /* armazenamento bloqueado: fica nesta página */ }

  // ---------- trocar de idioma (botões) ----------
  w.idiomaTroca = function (lang) {
    try { w.localStorage.setItem(IDI_KEY, lang); } catch (e) { }
    if (lang === w.LENDA_IDIOMA) return;
    try { if (w.G && G.save && typeof salvar === 'function') salvar(); } catch (e) { }
    setTimeout(function () { l.href = pagina(lang); }, 150);
  };
  var bandeira = function (cod, emo) { try { if (typeof bandeiraImg === 'function') { var i = bandeiraImg(cod, ''); if (i && i.tagName === 'IMG') return i; } } catch (e) { } return document.createTextNode(emo); };
  function idiBotoes(classe) {
    var box = document.createElement('div'); box.className = 'idi-botoes ' + (classe || '');
    [['pt', 'BR', '🇧🇷', /*pt-en*/'Português'], ['en', 'GB', '🇬🇧', /*pt-en*/'English']].forEach(function (o) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn mini idi-bt' + (o[0] === w.LENDA_IDIOMA ? ' amarelo on' : '');
      b.setAttribute('data-idioma', o[0]); b.title = o[3];
      b.append(bandeira(o[1], o[2]), document.createTextNode(' ' + o[3]));
      b.onclick = function (ev) { ev.stopPropagation(); w.idiomaTroca(o[0]); };
      box.append(b);
    });
    return box;
  }
  w.idiBotoes = idiBotoes;
  function idiPoe() {
    if (w.LENDA_STEAM) return; // a Steam tem o botão 🌐 dela
    var ini = document.getElementById('inicio');
    if (ini && !document.getElementById('idiInicio')) {
      var b = idiBotoes('idi-inicio'); b.id = 'idiInicio'; ini.append(b);
    }
    // ⚙️ Configurações › Interface: a primeira linha é o idioma
    if (typeof w.opcConteudo === 'function' && !w.opcConteudo._idi) {
      var _oc = w.opcConteudo;
      w.opcConteudo = function (aba) {
        var c = _oc.apply(this, arguments);
        try { if (aba === 'interface' && typeof opcLinha === 'function') c.prepend(opcLinha('🌐 Idioma', 'O jogo em português ou em inglês. O seu progresso é o mesmo nos dois.', idiBotoes('idi-opc'))); } catch (e) { }
        return c;
      };
      w.opcConteudo._idi = true;
    }
  }
  var css = '.idi-botoes { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }' +
    '.idi-inicio { position: absolute; top: 10px; right: 12px; z-index: 5; }' +
    '.idi-bt { display: inline-flex; align-items: center; gap: 4px; } .idi-bt img { width: 20px; height: 13px; border-radius: 2px; vertical-align: middle; }' +
    '.idi-bt.on { pointer-events: none; }';
  function idiCss() { if (document.getElementById('idi-css')) return; var st = document.createElement('style'); st.id = 'idi-css'; st.textContent = css; document.head.append(st); }

  // ---------- inglês: mensagens do servidor (em português) → inglês ----------
  var PARES = null;
  function idiCarrega() {
    if (w.LENDA_IDIOMA !== 'en' || PARES) return;
    PARES = [];
    try {
      fetch('js/idioma_servidor_en.json?v=410').then(function (r) { return r.json(); }).then(function (j) {
        PARES = (j.pares || []).map(function (p) {
          var esc = p[0].split('{}').map(function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('(.+?)');
          var k = 0; var en = p[1].replace(/\{\}/g, function () { k++; return '$' + k; });
          return [new RegExp(esc, 'g'), en, p[0].indexOf('{}') < 0 ? p[0] : null];
        }).sort(function (a, b) { return String(b[0].source).length - String(a[0].source).length; });
      }).catch(function () { });
    } catch (e) { }
  }
  function idiTraduz(t) {
    if (typeof t !== 'string' || !PARES || !PARES.length || !/[ãõçáéíóúâêà]|\b(não|você|para|de|do|da)\b/i.test(t)) return t;
    for (var i = 0; i < PARES.length; i++) { var p = PARES[i]; if (p[2] ? t.indexOf(p[2]) >= 0 : p[0].test(t)) { p[0].lastIndex = 0; t = t.replace(p[0], p[1]); } p[0].lastIndex = 0; }
    return t;
  }
  w.idiTraduzServidor = idiTraduz;
  function idiEmbrulha() {
    if (w.LENDA_IDIOMA !== 'en' || w.idiEmbrulhado) return; w.idiEmbrulhado = true;
    ['avisoJogo', 'log', 'banner'].forEach(function (nome) {
      if (typeof w[nome] !== 'function') return;
      var f = w[nome];
      w[nome] = function () { var a = Array.prototype.slice.call(arguments); for (var i = 0; i < Math.min(2, a.length); i++) a[i] = idiTraduz(a[i]); return f.apply(this, a); };
    });
    if (typeof w.perguntaJogo === 'function') { var _pj = w.perguntaJogo; w.perguntaJogo = function (t) { var a = Array.prototype.slice.call(arguments); a[0] = idiTraduz(a[0]); return _pj.apply(this, a); }; }
    // respostas da API do site com { error | erro | message } em português
    if (typeof w.fetch === 'function') {
      var _f = w.fetch;
      w.fetch = function (url) {
        return _f.apply(this, arguments).then(function (r) {
          try {
            var u = String((url && url.url) || url || '');
            if (!/\/api\//.test(u) || !/json/i.test(r.headers.get('content-type') || '')) return r;
            return r.clone().json().then(function (j) {
              var mudou = false;
              ['error', 'erro', 'message', 'msg'].forEach(function (k) { if (j && typeof j[k] === 'string') { var n = idiTraduz(j[k]); if (n !== j[k]) { j[k] = n; mudou = true; } } });
              return mudou ? new Response(JSON.stringify(j), { status: r.status, statusText: r.statusText, headers: r.headers }) : r;
            }).catch(function () { return r; });
          } catch (e) { return r; }
        });
      };
    }
  }
  function idiLiga() { idiCss(); idiCarrega(); idiEmbrulha(); idiPoe(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', idiLiga); else idiLiga();
  w.addEventListener('load', function () { setTimeout(idiPoe, 500); setTimeout(idiPoe, 2500); });
})(window);
