// Interruptor do Acromania por variável de ambiente.
//
// PARA QUE SERVE:
// Desligar o jogo SEM deploy, SEM git e SEM build — mexendo só numa variável
// no painel do Render, o que dá pra fazer do celular em menos de um minuto.
//
// Pensado pra quando o Gustavinho estiver viajando: se o Acromania (que é o
// jogo mais novo e o único que nunca rodou com gente real) causar problema,
// ele desliga de onde estiver, sem depender de computador.
//
// COMO USAR NO CELULAR:
//   1. dashboard.render.com  ->  serviço do backend  ->  Environment
//   2. ACROMANIA_ATIVO = false
//   3. Save (o Render reinicia sozinho em ~1 min)
//
// Pra religar, troque pra true ou apague a variável.
//
// PADRÃO: ligado. Só desliga com o valor exatamente "false" — assim um erro
// de digitação ("False", "0", vazio) nunca derruba o jogo por engano.
export function acromaniaAtivo() {
  return String(process.env.ACROMANIA_ATIVO ?? "true").toLowerCase() !== "false";
}
