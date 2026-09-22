// Cloudflare Turnstile (zip 602/604) — verificação anti-robô, no modo
// "Managed" (o recomendado pelo próprio Cloudflare): pra gente de verdade,
// normalmente não aparece nada; só mostra um desafio pra quem o Cloudflare
// achar arriscado — mais forte contra alguém insistente do que o modo
// puramente invisível.
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
    // Canto da tela, DENTRO da área visível — não escondido fora da tela.
    // No modo "Managed" (o escolhido no painel), o normal é não aparecer
    // nada; mas se o Cloudflare achar um pedido arriscado, ele pode
    // mostrar um desafio pra resolver — e quem precisar dele só consegue
    // ver e responder se o widget estiver de verdade na tela.
    div.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:9999;";
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
        callback: (token) => terminar(token),
        "error-callback": () => terminar(null),
        "expired-callback": () => terminar(null),
      });
    } catch {
      terminar(null);
      return;
    }
    // Rede de segurança: dá tempo de verdade pra alguém resolver um
    // desafio que tenha aparecido (1 minuto), mas não trava o cadastro
    // pra sempre se o Cloudflare nunca responder.
    setTimeout(() => terminar(null), 60000);
  });
}
