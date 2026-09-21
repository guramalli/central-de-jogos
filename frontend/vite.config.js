import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  build: {
    // Duas páginas no mesmo build: o site clássico (index.html) e a v2 em
    // teste (v2/index.html). Cada uma gera o seu próprio JS e CSS — a v2 não
    // carrega nada do clássico e vice-versa.
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        v2: fileURLToPath(new URL("./v2/index.html", import.meta.url)),
      },
    },
  },
  server: {
    port: 5173,
    // Necessário para acessar o dev server através de túneis (ngrok, etc.) —
    // sem isso, o Vite bloqueia requisições vindas de domínios desconhecidos.
    allowedHosts: true,
  },
});
