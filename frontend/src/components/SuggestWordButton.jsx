import { useState } from "react";
import { api } from "../api/client.js";

// Botão que aparece embaixo de uma palavra errada (só na sua própria linha),
// permitindo sugerir a inclusão dela no glossário.
export default function SuggestWordButton({ themeKey, letter, word }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  async function handleClick() {
    setStatus("sending");
    try {
      await api.post("/glossary/suggest", { themeKey, letter, word });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") return <div className="suggest-hint suggest-ok">✓ Sugerida</div>;
  if (status === "error") {
    return (
      <div className="suggest-hint suggest-error" onClick={handleClick} title="Tentar de novo">
        Erro — tentar de novo
      </div>
    );
  }
  return (
    <button className="suggest-btn" onClick={handleClick} disabled={status === "sending"}>
      {status === "sending" ? "Enviando..." : "+ Sugerir"}
    </button>
  );
}
