import { useState } from "react";
import { AvatarImp, Cronometro, quem } from "./comum.jsx";

const MOTIVO_CANCELADA = {
  impostor_saiu: "O impostor saiu da partida. Ninguém pontua.",
  poucos_jogadores: "Ficaram menos de 3 jogadores. Partida encerrada, ninguém pontua.",
};

// REVELACAO, ULTIMA_CHANCE e FIM. A sequência cinematográfica entra na Fase 3;
// aqui cada parte já aparece com os dados certos.
export default function Revelacao({ estado, tempo, pedir, aoSair }) {
  const rev = estado.revelacao;
  const fim = estado.fase === "FIM" ? estado.resultado : null;
  const cancelada = fim?.vencedor === "cancelada";
  const impostorId = rev?.impostorId || fim?.impostorId;
  const souImpostor = impostorId === estado.euId;

  return (
    <div className="imp-revelacao">
      <h1 className="imp-titulo imp-verdade">A VERDADE</h1>

      {rev && <Acusado estado={estado} rev={rev} />}
      {rev && <Placar estado={estado} rev={rev} />}

      {estado.fase === "REVELACAO" && <Cronometro tempo={tempo} rotulo="próxima etapa em" />}

      {estado.fase === "ULTIMA_CHANCE" && (
        <UltimaChance estado={estado} tempo={tempo} pedir={pedir} souImpostor={souImpostor} impostorId={impostorId} />
      )}

      {fim && (
        <section className="imp-painel imp-resultado">
          {cancelada ? (
            <p className="imp-resultado-titulo">{MOTIVO_CANCELADA[fim.motivo] || "Partida encerrada."}</p>
          ) : (
            <p className="imp-resultado-titulo">{fim.vencedor === "impostor" ? "O IMPOSTOR VENCEU" : "OS TRIPULANTES VENCERAM"}</p>
          )}
          <p className="imp-sub">A palavra era <b className="imp-palavra-final">{fim.palavra}</b></p>
          {fim.chute != null && (
            <p className="imp-sub">
              {quem(estado, fim.impostorId).nickname} chutou “{fim.chute}” — {fim.adivinhou ? "acertou!" : "errou."}
            </p>
          )}
          {!cancelada && <Pontos estado={estado} fim={fim} />}
          <div className="imp-acoes">
            <button className="imp-botao contorno" onClick={aoSair}>Sair da sala</button>
            {estado.anfitriaoId === estado.euId ? (
              <button className="imp-botao" onClick={() => pedir("impostor-proxima")}>Próxima partida</button>
            ) : (
              <span className="imp-sub">Aguardando o anfitrião começar a próxima…</span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Acusado({ estado, rev }) {
  if (rev.empate) {
    const imp = quem(estado, rev.impostorId);
    return (
      <section className="imp-acusado">
        <p className="imp-acusado-veredito">EMPATE</p>
        <p className="imp-sub">Ninguém foi eliminado. O impostor era <b>{imp.nickname}</b>.</p>
      </section>
    );
  }
  const a = quem(estado, rev.acusadoId);
  return (
    <section className={`imp-acusado ${rev.descoberto ? "culpado" : "inocente"}`}>
      <AvatarImp nome={a.nickname} cor={a.cor} tamanho={96} />
      <p className="imp-acusado-nome">{a.nickname}</p>
      <p className="imp-acusado-veredito">{rev.descoberto ? "ERA O IMPOSTOR" : "ERA INOCENTE"}</p>
      {!rev.descoberto && <p className="imp-sub">O impostor era <b>{quem(estado, rev.impostorId).nickname}</b>.</p>}
    </section>
  );
}

function Placar({ estado, rev }) {
  const max = Math.max(1, ...rev.contagem.map((c) => c.votos));
  return (
    <section className="imp-painel imp-placar" aria-label="Votos">
      <h2 className="imp-rotulo">VOTOS</h2>
      <ul>
        {rev.contagem.map((c) => {
          const p = quem(estado, c.id);
          return (
            <li key={c.id} className={c.id === rev.acusadoId ? "acusado" : ""}>
              <span className="imp-placar-nome">{p.nickname}</span>
              <span className="imp-placar-trilho"><span style={{ width: `${(c.votos / max) * 100}%` }} /></span>
              <b>{c.votos}</b>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function UltimaChance({ estado, tempo, pedir, souImpostor, impostorId }) {
  const [chute, setChute] = useState("");
  const nome = quem(estado, impostorId).nickname;
  return (
    <section className="imp-painel imp-ultima">
      <Cronometro tempo={tempo} />
      {souImpostor ? (
        <form
          className="imp-dica-form"
          onSubmit={(e) => { e.preventDefault(); if (chute.trim()) pedir("impostor-chute", { palavra: chute.trim() }); }}
        >
          <label htmlFor="imp-chute" className="imp-rotulo">ÚLTIMA CHANCE — qual é a palavra?</label>
          <div className="imp-dica-linha">
            <input id="imp-chute" className="imp-campo" maxLength={40} autoFocus autoComplete="off" value={chute} onChange={(e) => setChute(e.target.value)} />
            <button className="imp-botao" type="submit" disabled={!chute.trim()}>Chutar</button>
          </div>
          <p className="imp-nota">Você só tem uma tentativa.</p>
        </form>
      ) : (
        <p className="imp-sub">Última chance: se {nome} adivinhar a palavra, rouba a vitória.</p>
      )}
    </section>
  );
}

function Pontos({ estado, fim }) {
  const meus = fim.pontos[estado.euId];
  const lista = Object.entries(fim.pontos).sort((a, b) => b[1] - a[1]);
  return (
    <>
      {meus != null && (
        <p className="imp-meus-pontos">
          <span>{meus > 0 ? "Conta para o ranking mensal" : "Sem pontos desta vez"}</span>
          <b>+{meus} PTS</b>
        </p>
      )}
      <ul className="imp-pontos-lista">
        {lista.map(([id, pts]) => (
          <li key={id}>
            <span>{quem(estado, id).nickname}{id === fim.impostorId ? " (impostor)" : ""}</span>
            <b>+{pts}</b>
          </li>
        ))}
      </ul>
    </>
  );
}
