// Detecta se um erro de conexão do socket é falha de AUTENTICAÇÃO — e não
// um problema passageiro de rede.
//
// POR QUE ISSO PRECISA SER TÃO ESPECÍFICO:
// O evento "connect_error" dispara em várias situações completamente
// diferentes entre si:
//
//   - o token expirou (dura 7 dias)        → precisa deslogar
//   - a conta foi banida ou apagada        → precisa deslogar
//   - o servidor está reiniciando (DEPLOY) → NÃO pode deslogar
//   - a pessoa entrou no elevador          → NÃO pode deslogar
//   - o wi-fi caiu por dois segundos       → NÃO pode deslogar
//
// Se tratássemos "connect_error" de forma genérica, todo push que você
// fizesse jogaria TODOS os jogadores pra tela de login no meio da partida —
// muito pior que o problema original. Por isso a lista abaixo é fechada:
// só estas duas mensagens, que são exatamente as que o nosso servidor
// emite em backend/src/socket/index.js, deslogam alguém. Qualquer outra
// coisa é tratada como queda temporária e a reconexão automática do
// Socket.IO resolve sozinha, como já resolvia antes.
const MENSAGENS_DE_SESSAO_MORTA = [
  "SESSAO_INVALIDA", // usuário banido ou que não existe mais no banco
  "Autenticação inválida.", // token expirado, corrompido ou ausente
];

export function ehFalhaDeAutenticacao(err) {
  return MENSAGENS_DE_SESSAO_MORTA.includes(err?.message);
}

// Para onde mandar a pessoa quando a sessão morre. O parâmetro na URL faz
// a tela de login explicar o que aconteceu, em vez de ela achar que o site
// simplesmente a expulsou do nada.
export const ROTA_SESSAO_EXPIRADA = "/login?sessao=expirada";
