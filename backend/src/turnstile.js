// Verifica o token do Cloudflare Turnstile (zip 602) — o lado do servidor
// da verificação anti-robô que o frontend (src/utils/turnstile.js) gera.
//
// DESLIGADO ATÉ TER A CHAVE: sem TURNSTILE_SECRET_KEY nas variáveis de
// ambiente (no Render), `turnstileConfigurado()` é falso e `verificarTurnstile`
// sempre deixa passar — o cadastro e a entrada de visitante continuam
// funcionando exatamente como hoje. Só passa a EXIGIR e recusar token ruim
// depois que a chave for configurada dos dois lados (frontend e backend).
//
// Pra pegar a chave: dash.cloudflare.com (conta grátis, não precisa
// migrar domínio nem nada) → Turnstile → Add site → tipo "Managed" →
// copia a Secret Key aqui, e a Site Key no VITE_TURNSTILE_SITE_KEY do
// frontend (Vercel).
const SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";

export function turnstileConfigurado() {
  return !!SECRET_KEY;
}

// Devolve true se o token for válido (ou se a verificação ainda não
// estiver configurada — nesse caso nem tenta, deixa passar). Nunca lança
// erro: uma falha de rede pra falar com o Cloudflare não pode derrubar o
// cadastro do site inteiro — nesse caso específico, deixa passar também
// (mais seguro travar um bot ocasional do que travar cadastro de gente
// real por causa de uma instabilidade de terceiro).
export async function verificarTurnstile(token, ip) {
  if (!SECRET_KEY) return true;
  if (!token) return false;
  try {
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: SECRET_KEY, response: token, remoteip: ip || "" }),
    });
    const dados = await resp.json();
    return !!dados.success;
  } catch (e) {
    console.error("Falha ao verificar Turnstile (deixando passar):", e.message);
    return true;
  }
}
