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
      // three.js (só os mascotes 3D usam — agente do Impostor e juiz do
      // Tribunal —, via import dinâmico) em dois pedaços:
      // o núcleo e o renderizador WebGL. Sozinho passaria de 500 kB.
      // Continua sob demanda: só o Agente3D importa esses pedaços.
      output: {
        manualChunks(id) {
          const n = id.replace(/\\/g, "/");
          if (n.includes("/node_modules/three/build/three.core")) return "three-nucleo";
          if (n.includes("/node_modules/three/")) return "three-webgl";
          return undefined;
        },
      },
    },
  },
  // three.js só entra por import dinâmico (mascote do Impostor). Sem isto,
  // no dev o Vite só "descobre" o pacote quando o boneco aparece, otimiza de
  // novo e recarrega a página no meio da partida (e a aba aberta fica com
  // duas cópias do React: "Invalid hook call").
  optimizeDeps: {
    include: [
      "three",
      "three/examples/jsm/loaders/GLTFLoader.js",
      "three/examples/jsm/libs/meshopt_decoder.module.js",
      // juiz do Tribunal (modelo com esqueleto: o clone precisa religar os ossos)
      "three/examples/jsm/utils/SkeletonUtils.js",
    ],
  },
  server: {
    port: 5173,
    // Necessário para acessar o dev server através de túneis (ngrok, etc.) —
    // sem isso, o Vite bloqueia requisições vindas de domínios desconhecidos.
    allowedHosts: true,
  },
});
