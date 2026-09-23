import { ligarAvisoChat } from "../src/utils/avisoChat.js";
import axios from "axios";
import { io } from "socket.io-client";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({ baseURL: API_URL + "/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("eg_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Mesmas chaves do site clássico: quem já está logado lá entra direto aqui.
export function usuarioAtual() {
  try {
    const raw = localStorage.getItem("eg_user");
    return raw && localStorage.getItem("eg_token") ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ENTRAR / CADASTRAR — mesmas rotas e mesmo jeito de guardar a sessão do
// clássico (src/context/AuthContext.jsx), então a conta vale nos dois sites.
import { registrarConversaoCadastro } from "../src/utils/analytics.js";

function guardarSessao(data) {
  localStorage.setItem("eg_token", data.token);
  localStorage.setItem("eg_user", JSON.stringify(data.user));
}
export async function entrarComEmail(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  guardarSessao(data);
}
export async function cadastrar(nickname, email, password, extra = {}) {
  const { data } = await api.post("/auth/register", { nickname, email, password, ...extra });
  guardarSessao(data);
  await registrarConversaoCadastro(); // conversão do Google Ads (espera o envio)
}
export async function entrarComGoogle(credential) {
  const { data } = await api.post("/auth/google", { credential });
  guardarSessao(data);
  if (data.contaNova) await registrarConversaoCadastro();
}
export async function entrarComoVisitante(nickname, turnstileToken) {
  const { data } = await api.post("/auth/guest", { nickname, turnstileToken });
  guardarSessao(data);
}

export function sair() {
  localStorage.removeItem("eg_token");
  localStorage.removeItem("eg_user");
}

// Conexão própria da v2, uma por sala. Quem abre fecha (senão vira jogador
// fantasma).
function authDaV2() {
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  // `versao`: o painel admin mostra se a pessoa está na v2 ou no clássico.
  return { token: localStorage.getItem("eg_token"), plataforma: mobile ? "mobile" : "desktop", versao: "v2" };
}

export function novoSocket() {
  return ligarAvisoChat(io(API_URL, { auth: authDaV2(), autoConnect: false }));
}

// CONEXÃO DO PORTAL — UMA por aba, que NÃO fecha ao trocar de página. É ela
// que mantém a pessoa online pros amigos, recebe convite de sala (o servidor
// manda pra "user:<id>", onde toda conexão entra) e carrega a fila de espera
// (fila.js). Antes o Topo abria uma conexão por página: a cada troca a pessoa
// piscava offline e um convite podia cair no vão.
// Quem usa só liga/desliga os próprios ouvintes (`on`/`off`) — nunca desconecta.
// Jogos, Praça e conversa privada seguem com conexão própria (lá, sair da
// sala = desconectar).
let portal = null;
let tokenDoPortal = null;
export function socketDoPortal() {
  const token = localStorage.getItem("eg_token");
  if (!token) return null;
  if (!portal) {
    // `auth` como função: é lida de novo a cada (re)conexão, então vai sempre
    // o login atual.
    portal = ligarAvisoChat(io(API_URL, { auth: (cb) => cb(authDaV2()), autoConnect: false }));
  } else if (token !== tokenDoPortal) {
    portal.disconnect(); // login trocou: reconecta abaixo com o token novo
  }
  tokenDoPortal = token;
  // Parada de vez (servidor derrubou, ou recusou na entrada): tenta de novo
  // quando alguma tela pede a conexão — como acontecia a cada página antes.
  if (!portal.active) portal.connect();
  return portal;
}

// Só estas duas mensagens deslogam — queda de rede e deploy NÃO (mesma regra
// do site clássico, em src/utils/sessaoSocket.js).
export function ehSessaoMorta(err) {
  return ["SESSAO_INVALIDA", "Autenticação inválida."].includes(err?.message);
}
