// Id curto e único pra cada mensagem de chat de sala.
//
// O chat de dentro das salas não é gravado no banco (é passageiro, some
// quando a pessoa sai), então ele não tem id do Prisma. Mesmo assim cada
// mensagem precisa de uma identidade pra que um moderador possa apontar
// "apaga ESSA" — é o que este contador gera.
let contador = 0;

export function novoIdMensagem() {
  contador += 1;
  return `m${Date.now().toString(36)}${contador.toString(36)}`;
}
