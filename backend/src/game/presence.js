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
  connected.set(socket.id, { userId, nickname });
}

export function removeConnection(socketId) {
  connected.delete(socketId);
}

// Lista sem repetição: a mesma pessoa pode ter duas abas (ou celular +
// computador) abertas ao mesmo tempo — conta uma vez só.
export function getOnlineList() {
  const seen = new Map();
  for (const p of connected.values()) seen.set(p.userId, p.nickname);
  return [...seen.entries()].map(([userId, nickname]) => ({ userId, nickname }));
}
