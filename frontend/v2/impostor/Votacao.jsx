import { useState } from "react";
import { AvatarImp, Cronometro, dicasDe } from "./comum.jsx";

// Votação simultânea. O servidor só conta quantos já votaram; em quem cada
// um votou nunca aparece (só o seu próprio voto, pra você).
export default function Votacao({ estado, tempo, pedir }) {
  const [escolhido, setEscolhido] = useState(null);
  const jaVotei = estado.meuVoto != null;
  const marcado = jaVotei ? estado.meuVoto : escolhido;
  const suspeitos = estado.jogadores.filter((j) => j.naPartida && j.id !== estado.euId);
  const nomeEscolhido = suspeitos.find((s) => s.id === marcado)?.nickname;

  let rotulo = "Escolha um suspeito";
  if (jaVotei) rotulo = "Voto confirmado";
  else if (nomeEscolhido) rotulo = `Votar em ${nomeEscolhido}`;

  return (
    <div className="imp-votacao">
      <header className="imp-cabecalho">
        <div>
          <span className="imp-rotulo">HORA DO VOTO · TEMA {String(estado.tema).toUpperCase()}</span>
          <h1 className="imp-titulo">QUEM É O IMPOSTOR?</h1>
        </div>
        <Cronometro tempo={tempo} />
      </header>

      <ul className="imp-suspeitos" role="radiogroup" aria-label="Suspeitos">
        {suspeitos.map((s) => {
          const sel = marcado === s.id;
          const dicas = dicasDe(estado, s.id);
          return (
            <li key={s.id}>
              <button
                role="radio"
                aria-checked={sel}
                className={`imp-suspeito ${sel ? "selecionado" : ""}`}
                disabled={!estado.participo || jaVotei}
                onClick={() => setEscolhido(s.id)}
              >
                <AvatarImp nome={s.nickname} cor={s.cor} tamanho={48} />
                <span className="imp-suspeito-nome">{s.nickname}</span>
                <span className="imp-suspeito-dicas">
                  {dicas.length === 0 ? <i>sem dicas</i> : dicas.map((d) => (
                    <b key={d.rodada} className={d.texto ? "" : "imp-branco"}>{d.texto || "(em branco)"}</b>
                  ))}
                </span>
                {sel && <span className="imp-selo">SEU VOTO</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="imp-acoes">
        <span className="imp-sub">{estado.votaram} de {estado.totalVotantes} já votaram · os votos aparecem juntos no final</span>
        {estado.participo && (
          <button
            className="imp-botao"
            disabled={jaVotei || !marcado}
            onClick={() => pedir("impostor-votar", { alvoId: marcado })}
          >
            {rotulo}
          </button>
        )}
      </div>
    </div>
  );
}
