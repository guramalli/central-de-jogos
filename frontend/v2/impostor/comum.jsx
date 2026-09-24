import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { tocar } from "./sons.js";

// Peças usadas por várias telas do Impostor.

// Curva da spec pra carta e entradas de tela.
export const CURVA = [0.2, 0.8, 0.2, 1];

// Tempo restante em segundos. O servidor manda o restante (a cada segundo e
// a cada troca de fase); aqui só descontamos o que passou desde o último
// aviso, pra o número não "pular" entre um aviso e outro.
export function useSegundos(tempo) {
  const [, setTique] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTique((n) => n + 1), 250);
    return () => clearInterval(t);
  }, []);
  if (tempo?.ms == null) return null;
  return Math.max(0, Math.ceil((tempo.ms - (Date.now() - tempo.em)) / 1000));
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Cronômetro: pulsa a cada segundo; nos últimos 5s fica vermelho e faz o
// tique. Variantes: "pilula" (0:45, rodada/carta), "circulo" (votação) e
// "anel" (última chance).
export function Cronometro({ tempo, variante = "pilula", comSom = true }) {
  const s = useSegundos(tempo);
  const ultimo = useRef(null);
  useEffect(() => {
    if (s == null || s === ultimo.current) return;
    ultimo.current = s;
    if (comSom && s > 0 && s <= 5) tocar("tique");
  }, [s, comSom]);
  if (s == null) return null;
  const urgente = s <= 5;
  return (
    <motion.div
      key={s}
      className={`imp-cronometro ${variante} ${urgente ? "urgente" : ""}`}
      role="timer"
      aria-label={`${s} segundos`}
      initial={{ scale: 1.08 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {variante === "pilula" && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" />
        </svg>
      )}
      {variante === "pilula" ? mmss(s) : s}
    </motion.div>
  );
}

export function AvatarImp({ nome, cor, tamanho = 44, className = "" }) {
  return (
    <span
      className={`imp-avatar ${className}`}
      style={{ background: cor, width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.46) }}
      aria-hidden="true"
    >
      {String(nome || "?").charAt(0).toUpperCase()}
    </span>
  );
}

// Nome e cor de um jogador: da lista da sala, ou (se já saiu) do registro
// guardado na largada da partida.
export function quem(estado, id) {
  const j = estado.jogadores.find((x) => x.id === id);
  if (j) return { nickname: j.nickname, cor: j.cor };
  return estado.nomes?.[id] || { nickname: "?", cor: "#7C8090" };
}

export function dicasDe(estado, id) {
  return (estado.dicas || []).filter((d) => d.jogadorId === id);
}

// ---------------- modos ----------------
// palavra | situacao | pergunta | historia. O servidor manda `estado.modo`
// sempre; estes textos só dão nome às coisas em cada modo.
export const NOME_MODO = { palavra: "Palavra", situacao: "Situação", pergunta: "Pergunta", historia: "História" };

export const modoDe = (estado) => estado?.modo || "palavra";

// "A palavra era X" / "A situação era X"… — o segredo, no fim da partida.
export const SEGREDO_ERA = {
  palavra: "A palavra era",
  situacao: "A situação era",
  pergunta: "A pergunta era",
  historia: "O tema da história era",
};

// Rótulo curto do topo (votação etc.): no Palavra, a categoria; nos outros,
// o nome do modo (o `tema` deles é só "Situação"/"Pergunta"/"História").
export function rotuloTema(estado) {
  const modo = modoDe(estado);
  return modo === "palavra" ? `TEMA ${String(estado.tema || "").toUpperCase()}` : `MODO ${NOME_MODO[modo].toUpperCase()}`;
}

// O que cada jogador "disse" na partida, pra mostrar nos suspeitos:
// dicas (palavra/situação), frases (história) ou a resposta (pergunta).
export function falasDe(estado, id) {
  if (modoDe(estado) === "pergunta") {
    const r = (estado.respostas || []).find((x) => x.jogadorId === id);
    return r ? [{ chave: "resposta", texto: r.texto, titulo: "Resposta" }] : [];
  }
  return dicasDe(estado, id).map((d) => ({ chave: d.rodada, texto: d.texto, titulo: `Rodada ${d.rodada}` }));
}

// Contador de caracteres / palavras de um campo (dica, frase, resposta).
export function contarPalavras(texto) {
  const t = String(texto || "").trim();
  return t ? t.split(/\s+/).length : 0;
}

export function PontoPiscando({ cor = "verde" }) {
  return <span className={`imp-ponto ${cor}`} aria-hidden="true" />;
}
