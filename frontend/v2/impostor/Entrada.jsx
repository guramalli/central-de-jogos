import { useState } from "react";
import FilaNoCard from "../FilaNoCard.jsx";

// Antes de estar numa sala: criar uma ou entrar com o código.
export default function Entrada({ aoCriar, aoEntrar, entrando }) {
  const [codigo, setCodigo] = useState("");
  return (
    <section className="imp-entrada">
      <h1 className="imp-logo-titulo">
        <img src="/impostor-logo.png" alt="O Impostor" className="imp-logo" />
      </h1>
      <p className="imp-sub">Um de vocês não sabe a palavra. Dê dicas, desconfie de todo mundo e vote em quem está blefando.</p>
      {entrando ? (
        <p className="imp-sub">Entrando na sala…</p>
      ) : (
        <div className="imp-painel imp-entrada-painel">
          <span className="imp-rotulo">📝 FILA DE ESPERA — DEIXE SEU NOME E A GENTE TE CHAMA</span>
          <FilaNoCard jogo="impostor" />
          <button className="imp-botao principal" onClick={aoCriar}>Criar sala com amigos</button>
          <form
            className="imp-codigo-form"
            onSubmit={(e) => { e.preventDefault(); if (codigo.trim()) aoEntrar(codigo.trim()); }}
          >
            <label htmlFor="imp-codigo" className="imp-rotulo">TEM UM CÓDIGO?</label>
            <div className="imp-dica-linha">
              <input
                id="imp-codigo"
                className="imp-campo imp-campo-codigo"
                placeholder="KX7-42"
                maxLength={7}
                autoCapitalize="characters"
                autoComplete="off"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              />
              <button className="imp-botao secundario compacto" type="submit">Entrar</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
