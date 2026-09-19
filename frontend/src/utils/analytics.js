// Disparo de conversões do Google Ads.
//
// A tag base (gtag.js) é carregada no index.html. Aqui ficam os eventos
// específicos que avisam ao Google quando algo importante aconteceu — no
// caso, quando alguém cria uma conta de verdade.
//
// Tudo é protegido: se o gtag não tiver carregado (bloqueador de anúncios,
// internet ruim, ambiente de desenvolvimento), a função simplesmente não
// faz nada. O cadastro do usuário nunca pode quebrar por causa de métrica.

const CONVERSAO_CADASTRO = "AW-18380180212/s_RxCL3m1d4cEPSVrbxE";

// Devolve uma Promise que termina quando o Google CONFIRMA o envio (ou em
// 1,2s, pra ninguém ficar preso se o gtag não responder). Quem vai trocar
// de página logo depois — recarregar, ou o clássico levando pra versão
// nova — precisa esperar: sair da página na hora pode descartar o envio e
// a conversão some das métricas do Google Ads.
export function registrarConversaoCadastro() {
  return new Promise((resolve) => {
    try {
      if (typeof window === "undefined" || typeof window.gtag !== "function") return resolve();
      const limite = setTimeout(resolve, 1200);
      window.gtag("event", "conversion", {
        send_to: CONVERSAO_CADASTRO,
        value: 1.0,
        currency: "BRL",
        event_callback: () => { clearTimeout(limite); resolve(); },
      });
    } catch {
      // Métrica nunca deve atrapalhar o uso do site — falha em silêncio.
      resolve();
    }
  });
}
