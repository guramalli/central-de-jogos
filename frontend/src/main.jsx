import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./styles.css";

// Se a variável não estiver configurada ainda, passamos string vazia — o
// botão do Google simplesmente não aparece funcional até isso ser
// configurado (não trava o resto do site).
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// FONTE DE ÍCONES
//
// Marca no <html> quando a Material Symbols estiver pronta. Até lá o CSS
// esconde os ícones, em vez de deixar aparecer o nome da ligadura ("logout",
// "dashboard") escrito por extenso — que era o que acontecia no celular.
//
// O tempo limite existe pra nunca deixar a interface sem ícone nenhum: se a
// fonte não carregar em 3 segundos (rede ruim, Google bloqueado), libera
// assim mesmo. Pior um nome cru que um botão invisível.
function liberarIcones() {
  document.documentElement.classList.add("fonte-icones-ok");
}

if (document.fonts?.load) {
  document.fonts
    .load('24px "Material Symbols Outlined"')
    .then(liberarIcones)
    .catch(liberarIcones);
  // Rede muito ruim ou Google bloqueado: libera assim mesmo. Com
  // display=block o navegador já segura o texto por ~3s por conta própria,
  // então este limite é a última rede de proteção, não o mecanismo principal.
  setTimeout(liberarIcones, 5000);
} else {
  // Navegador sem a API de fontes: não dá pra saber, então mostra logo.
  liberarIcones();
}
