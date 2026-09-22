import { useState } from "react";

// DICAS CONTEXTUAIS (zip 591) — um pontinho pulsando ao lado de uma função
// pouco óbvia, que vira um balão explicando quando tocado. Cada dica aparece
// só até a pessoa dispensar UMA vez (ela mesma, ou automaticamente, se
// `aoUsarChave` disparar antes) — depois some pra sempre, guardado no
// aparelho. Nada disso bloqueia a tela: quem nunca reparar no pontinho
// simplesmente nunca vê a dica, e não atrapalha em nada.
const CHAVE_LS = "eg_v2_dicas_vistas";

function lerVistas() {
  try { return JSON.parse(localStorage.getItem(CHAVE_LS) || "{}"); } catch { return {}; }
}

export function dicaFoiVista(chave) {
  return !!lerVistas()[chave];
}

export function marcarDicaVista(chave) {
  const v = lerVistas();
  if (v[chave]) return;
  v[chave] = Date.now();
  try { localStorage.setItem(CHAVE_LS, JSON.stringify(v)); } catch {}
  // avisa quem estiver com o componente montado em outra parte da tela
  window.dispatchEvent(new CustomEvent("v2-dica-vista", { detail: chave }));
}

// Pontinho + balão. `lado`: onde o balão abre em relação ao pontinho
// ("baixo-esquerda" é o padrão — cabe bem perto das bordas da tela).
export default function DicaNova({ chave, texto, lado = "baixo-esquerda", className = "" }) {
  const [vista, setVista] = useState(() => dicaFoiVista(chave));
  const [aberta, setAberta] = useState(false);

  if (vista) return null;

  function dispensar() {
    marcarDicaVista(chave);
    setVista(true);
  }

  return (
    <span className={`v2-dica-nova ${className}`}>
      <button
        type="button"
        className="v2-dica-ponto"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAberta((a) => !a); }}
        aria-label="Dica: toque para saber mais"
      >
        <span className="v2-dica-ponto-aro" aria-hidden="true" />
      </button>
      {aberta && (
        <span className={`v2-dica-balao v2-dica-balao-${lado}`} role="status">
          {texto}
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); dispensar(); }}>Entendi</button>
        </span>
      )}
    </span>
  );
}
