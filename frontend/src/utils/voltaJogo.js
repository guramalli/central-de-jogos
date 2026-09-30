// Volta para o jogo depois do login/cadastro. A página do jogo (Lenda do Campinho)
// manda quem não está logado — ou quem teve a sessão vencida — para /login ou
// /registrar com ?volta=/lenda-do-campinho/...; depois de entrar, a pessoa volta
// direto para o jogo em vez de cair na página inicial do site.
// Só aceita caminhos do próprio jogo (nada de mandar para outro site).
export function destinoVolta(params) {
  const v = params.get("volta");
  if (!v || v.includes("//") || v.includes("\\")) return null;
  return /^\/lenda-do-campinho(\/|\?|#|$)/.test(v) ? v : null;
}

export function irDepoisDoLogin(navigate, params) {
  const volta = destinoVolta(params);
  if (volta) window.location.assign(volta); // o jogo é uma página à parte (fora do React)
  else navigate("/");
}

// mantém o ?volta= ao trocar entre Entrar e Cadastrar
export function comVolta(caminho, params) {
  const volta = destinoVolta(params);
  return volta ? `${caminho}?volta=${encodeURIComponent(volta)}` : caminho;
}
