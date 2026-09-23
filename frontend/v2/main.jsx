// v2 — a versão nova (principal) do site. Tem seu próprio CSS; de src/
// só reaproveita dados e textos (novidades, termos, privacidade), nunca
// estilo — então nada de um vaza pro outro. Usa o mesmo login (localStorage do mesmo
// domínio) e o mesmo backend.
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import AvisoFila from "./AvisoFila.jsx";
import "./v2.css";

// Login com Google (mesmo client ID do clássico).
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
createRoot(document.getElementById("root")).render(
  <>
    {GOOGLE_CLIENT_ID ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}><App /></GoogleOAuthProvider> : <App />}
    {/* Fila de espera: "Partida encontrada!" por cima de qualquer página. */}
    <AvisoFila />
  </>
);
