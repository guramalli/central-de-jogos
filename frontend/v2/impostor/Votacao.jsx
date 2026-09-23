import { useState } from "react";
import { motion } from "motion/react";
import { AvatarImp, Cronometro, dicasDe } from "./comum.jsx";
import { tocar } from "./sons.js";

// Votação simultânea. O servidor só conta quantos já votaram; em quem cada
// um votou nunca aparece (só o seu próprio voto, pra você).
// Computador: cartões lado a lado. Celular: uma linha por suspeito.
export default function Votacao({ estado, tempo, pedir }) {
  const [escolhido, setEscolhido] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const jaVotei = estado.meuVoto != null;
  const marcado = jaVotei ? estado.meuVoto : escolhido;
  const suspeitos = estado.jogadores.filter((j) => j.naPartida && j.id !== estado.euId);
  const nomeEscolhido = suspeitos.find((s) => s.id === marcado)?.nickname;

  let rotulo = "Escolha um suspeito";
  if (jaVotei) rotulo = "Voto confirmado ✓";
  else if (nomeEscolhido) rotulo = `Confirmar voto em ${nomeEscolhido}`;

  async function confirmar() {
    setEnviando(true);
    const r = await pedir("impostor-votar", { alvoId: marcado });
    setEnviando(false);
    if (r.ok) tocar("votoConfirmado");
  }

  return (
    <div className="imp-votacao">
      <header className="imp-votacao-topo">
        <div>
          <span className="imp-rotulo">
            HORA DO VOTO<span className="imp-so-computador"> · TEMA {String(estado.tema).toUpperCase()}</span>
          </span>
          <h1 className="imp-titulo-voto">QUEM É O <br className="imp-so-celular" />IMPOSTOR?</h1>
        </div>
        <Cronometro tempo={tempo} variante="circulo" />
      </header>
      <p className="imp-sub imp-so-celular">Tema: <b>{estado.tema}</b> · Releia as dicas e escolha um suspeito.</p>

      <ul className={`imp-suspeitos ${suspeitos.length > 4 ? "muitos" : ""}`} role="radiogroup" aria-label="Suspeitos">
        {suspeitos.map((s) => {
          const sel = marcado === s.id;
          const dicas = dicasDe(estado, s.id);
          return (
            <li key={s.id}>
              <motion.button
                role="radio"
                aria-checked={sel}
                className={`imp-suspeito ${sel ? "selecionado" : ""}`}
                disabled={!estado.participo || jaVotei}
                onClick={() => setEscolhido(s.id)}
                animate={{ y: sel ? -6 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <AvatarImp nome={s.nickname} cor={s.cor} tamanho={96} className="imp-suspeito-avatar" />
                <span className="imp-suspeito-info">
                  <span className="imp-suspeito-nome">{s.nickname}</span>
                  <span className="imp-suspeito-disse imp-so-celular">
                    disse {dicas.length === 0 ? "nada" : dicas.map((d, i) => (
                      <b key={d.rodada}>{i > 0 && ", "}“{d.texto || "…"}”</b>
                    ))}
                  </span>
                </span>
                <span className="imp-suspeito-dicas imp-so-computador">
                  <span className="imp-rotulo">DICAS</span>
                  {dicas.map((d) => (
                    <b key={d.rodada} className={d.texto ? "" : "imp-branco"}>{d.texto || "(em branco)"}</b>
                  ))}
                </span>
                <span className={`imp-selo ${sel ? "ativo" : ""}`}>{sel ? "SEU VOTO" : "Votar"}</span>
              </motion.button>
            </li>
          );
        })}
      </ul>

      <div className="imp-votacao-pe">
        <span className="imp-sub"><b>{estado.votaram} de {estado.totalVotantes}</b> já votaram<span className="imp-so-computador"> · os votos aparecem juntos no final</span></span>
        {estado.participo && (
          <button className="imp-botao principal" disabled={jaVotei || !marcado || enviando} onClick={confirmar}>{rotulo}</button>
        )}
      </div>
    </div>
  );
}
