import { ligarAvisoChat } from "./utils/avisoChat.js";
import { io } from "socket.io-client";
import { API_URL } from "./api/client.js";
import { detectarPlataforma } from "./utils/useIsMobile.js";

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("eg_token");
  // A plataforma vai junto da autenticação: o servidor registra no perfil
  // pra dar visibilidade de quantos jogam no celular e quantos no
  // computador — informação que orienta onde investir na interface.
  const auth = { token, plataforma: detectarPlataforma(), versao: "classico" }; // versão: identificador no painel admin
  if (!socket) {
    socket = ligarAvisoChat(io(API_URL, { auth, autoConnect: false }));
  }
  socket.auth = auth;
  return socket;
}

// CONEXÃO DEDICADA, uma por sala aberta.
//
// O getSocket() acima devolve sempre a MESMA conexão, e o backend guarda uma
// sala por conexão (socket.currentRoom). Isso é o certo pro uso normal: chat
// geral, mensagens privadas e uma sala de jogo por vez.
//
// O modo multi-sala precisa do contrário: cada painel aberto é uma partida
// independente, com sala, estado e eventos próprios. Uma conexão por painel
// dá isso de graça — o backend não muda em nada, porque cada conexão
// continua tendo a sua única sala.
//
// Quem chama é responsável por desconectar ao fechar o painel. Conexão
// esquecida é jogador fantasma na sala.
export function criarSocketDedicado() {
  const token = localStorage.getItem("eg_token");
  const auth = { token, plataforma: detectarPlataforma(), versao: "classico" }; // versão: identificador no painel admin
  return ligarAvisoChat(io(API_URL, { auth, autoConnect: false }));
}
