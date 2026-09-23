// v2 — a versão nova (principal) do site. Tem seu próprio CSS; de src/
// só reaproveita dados e textos (novidades, termos, privacidade), nunca
// estilo — então nada de um vaza pro outro. Usa o mesmo login (localStorage do mesmo
// domínio) e o mesmo backend.
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import AvisoFila from "./AvisoFila.jsx";
import ErroNaPagina, { recarregarUmaVez } from "./ErroNaPagina.jsx";
import "./v2.css";

// Aba aberta durante um deploy: o Vite avisa quando não consegue baixar um
// arquivo de uma página carregada sob demanda (o antigo sumiu). Recarrega uma
// vez pra pegar a versão nova; se já recarregou há pouco, deixa o erro seguir
// pra tela de erro (ErroNaPagina) em vez de entrar em laço.
window.addEventListener("vite:preloadError", (e) => {
  if (recarregarUmaVez()) e.preventDefault();
});

// Login com Google (mesmo client ID do clássico).
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
createRoot(document.getElementById("root")).render(
  <>
    {GOOGLE_CLIENT_ID ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}><App /></GoogleOAuthProvider> : <App />}
    {/* Fila de espera: "Partida encontrada!" por cima de qualquer página. */}
    <ErroNaPagina silencioso><AvisoFila /></ErroNaPagina>
  </>
);
