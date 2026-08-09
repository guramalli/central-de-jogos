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

export function registrarConversaoCadastro() {
  try {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", "conversion", {
      send_to: CONVERSAO_CADASTRO,
      value: 1.0,
      currency: "BRL",
    });
  } catch {
    // Métrica nunca deve atrapalhar o uso do site — falha em silêncio.
  }
}
