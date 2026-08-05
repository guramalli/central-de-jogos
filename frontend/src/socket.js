import { io } from "socket.io-client";
import { API_URL } from "./api/client.js";

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("eg_token");
  if (!socket) {
    socket = io(API_URL, { auth: { token }, autoConnect: false });
  }
  socket.auth = { token };
  return socket;
}
