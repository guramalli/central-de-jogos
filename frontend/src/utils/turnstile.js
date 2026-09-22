// Cloudflare Turnstile (zip 602) — verificação anti-robô. No modo
// "invisible", na imensa maioria das vezes NADA aparece na tela pra gente
// de verdade (só atrapalha automação); só mostra um desafio visível se o
// Cloudflare achar o pedido suspeito.
//
// DESLIGADO ATÉ TER A CHAVE: sem VITE_TURNSTILE_SITE_KEY configurada (no
// .env do frontend, na Vercel), essa função devolve null sem fazer nada —
// e o backend (src/turnstile.js), do mesmo jeito, deixa passar sem exigir
// token enquanto TURNSTILE_SECRET_KEY não estiver configurada lá. Os dois
// lados precisam estar configurados pra a verificação valer de verdade;
// nenhum dos dois quebra o cadastro/visitante enquanto isso não acontece.
//
// Pra pegar as chaves: dash.cloudflare.com (conta grátis) → Turnstile →
// Add site → tipo "Managed" → copia a Site Key (pro frontend) e a Secret
// Key (pro backend, NUNCA no frontend).
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

let carregandoScript = null;
function carregarScript() {
  if (window.turnstile) return Promise.resolve();
  if (carregandoScript) return carregandoScript;
  carregandoScript = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar o Turnstile"));
    document.head.appendChild(s);
  });
  return carregandoScript;
}

// Devolve um token pra mandar junto com o pedido de cadastro/visitante, ou
// `null` se o Turnstile não estiver configurado ou algo falhar — nesse
// caso o pedido segue igual, sem o campo; quem decide o que fazer com a
// ausência do token é o BACKEND (recusa só se a chave dele estiver ligada).
export async function obterTokenTurnstile() {
  if (!SITE_KEY) return null;
  try {
    await carregarScript();
  } catch {
    return null;
  }
  return new Promise((resolve) => {
    const div = document.createElement("div");
    // Fora da tela, não com display:none — alguns navegadores não rodam
    // conteúdo com display:none corretamente, e o widget precisa existir
    // de verdade no DOM pra funcionar.
    div.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;";
    document.body.appendChild(div);
    let resolvido = false;
    const terminar = (token) => {
      if (resolvido) return;
      resolvido = true;
      div.remove();
      resolve(token);
    };
    try {
      window.turnstile.render(div, {
        sitekey: SITE_KEY,
        size: "invisible",
        callback: (token) => terminar(token),
        "error-callback": () => terminar(null),
        "expired-callback": () => terminar(null),
      });
    } catch {
      terminar(null);
      return;
    }
    // Rede de segurança: se o Cloudflare nunca responder, não trava o
    // cadastro pra sempre — segue sem o token depois de um tempo curto.
    setTimeout(() => terminar(null), 8000);
  });
}
