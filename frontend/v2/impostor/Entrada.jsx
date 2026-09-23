import { useState } from "react";

// Antes de estar numa sala: criar uma ou entrar com o código.
export default function Entrada({ aoCriar, aoEntrar, entrando }) {
  const [codigo, setCodigo] = useState("");
  return (
    <section className="imp-painel imp-entrada">
      <h1 className="imp-titulo">O IMPOSTOR</h1>
      <p className="imp-sub">Um de vocês não sabe a palavra. Dê dicas, desconfie de todo mundo e vote em quem está blefando.</p>
      {entrando ? (
        <p className="imp-sub">Entrando na sala…</p>
      ) : (
        <>
          <button className="imp-botao" onClick={aoCriar}>Criar sala</button>
          <form
            className="imp-codigo-form"
            onSubmit={(e) => { e.preventDefault(); if (codigo.trim()) aoEntrar(codigo.trim()); }}
          >
            <label htmlFor="imp-codigo" className="v2-oculto">Código da sala</label>
            <input
              id="imp-codigo"
              className="imp-campo"
              placeholder="Código (ex.: KX7-42)"
              maxLength={7}
              autoCapitalize="characters"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            />
            <button className="imp-botao contorno" type="submit">Entrar</button>
          </form>
        </>
      )}
    </section>
  );
}
