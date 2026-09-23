import { lazy, Suspense } from "react";

// O Impostor carrega sob demanda: motion e howler (e o próprio jogo) só são
// baixados por quem abre /v2/?pagina=impostor — o resto da v2 não paga o peso.
const Impostor = lazy(() => import("./Impostor.jsx"));

export default function ImpostorSobDemanda(props) {
  return (
    <Suspense fallback={<div className="v2-carregando">Carregando o Impostor…</div>}>
      <Impostor {...props} />
    </Suspense>
  );
}
