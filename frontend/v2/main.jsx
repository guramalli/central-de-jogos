// v2 — experimento de visual novo. Página separada do site clássico:
// tem seu próprio CSS e não importa nada de src/, então nada daqui vaza
// pro site atual (e vice-versa). Usa o mesmo login (localStorage do mesmo
// domínio) e o mesmo backend.
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./v2.css";

createRoot(document.getElementById("root")).render(<App />);
