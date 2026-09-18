// Presença global: quem está com o site aberto AGORA, em qualquer página.
//
// Diferente do chat geral (que só registra quem está na página inicial com
// o widget da praça montado), aqui a presença é registrada na PRÓPRIA
// conexão do socket — então quem está no painel admin, no ranking, no
// perfil ou em qualquer outra página também conta como online. Foi um bug
// real: um admin logado no celular, parado no painel, não aparecia na
// lista de quem estava no site.
const connected = new Map(); // socketId -> { userId, nickname }

export function addConnection(socket, userId, nickname) {
  // Guarda o próprio socket: a lista confere se ele ainda está conectado.
  connected.set(socket.id, { userId, nickname, socket });
}

export function removeConnection(socketId) {
  connected.delete(socketId);
}

// Lista sem repetição: a mesma pessoa pode ter duas abas (ou celular +
// computador) abertas ao mesmo tempo — conta uma vez só.
export function getOnlineList() {
  const seen = new Map();
  for (const [socketId, p] of connected.entries()) {
    // Rede de segurança: conexão morta que escapou do disconnect sai aqui,
    // em vez de deixar a pessoa "online" até o próximo deploy.
    if (!p.socket?.connected) {
      connected.delete(socketId);
      continue;
    }
    seen.set(p.userId, p.nickname);
  }
  return [...seen.entries()].map(([userId, nickname]) => ({ userId, nickname }));
}
