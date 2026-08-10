import { io } from "socket.io-client";
import { API_URL } from "./api/client.js";
import { detectarPlataforma } from "./utils/useIsMobile.js";

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("eg_token");
  // A plataforma vai junto da autenticação: o servidor registra no perfil
  // pra dar visibilidade de quantos jogam no celular e quantos no
  // computador — informação que orienta onde investir na interface.
  const auth = { token, plataforma: detectarPlataforma() };
  if (!socket) {
    socket = io(API_URL, { auth, autoConnect: false });
  }
  socket.auth = auth;
  return socket;
}
