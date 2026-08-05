import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Necessário para acessar o dev server através de túneis (ngrok, etc.) —
    // sem isso, o Vite bloqueia requisições vindas de domínios desconhecidos.
    allowedHosts: true,
  },
});
