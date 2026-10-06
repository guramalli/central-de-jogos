// Conversões do Google Ads — DESLIGADAS em 06/10/2026 (ECA Digital, Lei 15.211/2025):
// o site é acessado por crianças, então não carregamos mais a tag do Google Ads nem
// avisamos cadastros a ela. A função continua existindo (é chamada no cadastro) e
// simplesmente não faz nada — o cadastro nunca depende de métrica.
export function registrarConversaoCadastro() {
  return Promise.resolve();
}
