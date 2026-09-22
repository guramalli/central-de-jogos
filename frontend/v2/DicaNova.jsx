import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// DICAS CONTEXTUAIS (zip 594) — quando uma dica aparece, o SITE INTEIRO
// escurece (igual aos modais) e só a dica (e o que ela explica) continua
// colorida — pra ficar impossível não notar. Aparece sozinha, sem precisar
// de clique, fica alguns segundos e some — já marcada como vista, mesmo
// sem a pessoa fazer nada. Cada dica aparece UMA vez só, nunca mais volta,
// em nenhum jogo, guardado no aparelho.
//
// Histórico: v591 era um pontinho pulsando (parecia erro); v592/593 virou
// um balão automático, mas sem destacar o que ele explica; v594 escurece o
// resto da tela e recorta um "furo" de luz em volta do alvo — e, como duas
// telas às vezes têm mais de uma dica pendente (o perfil no topo + as
// patentes, por exemplo), elas entram numa FILA: só uma escurece a tela
// por vez, a próxima só começa quando a de cima sumir.
const CHAVE_LS = "eg_v2_dicas_vistas";
const DURACAO_MS = 7000;
const ATRASO_MS = 500; // pequena espera antes de aparecer, pra não piscar durante o carregamento da tela
const LARGURA_BALAO = 240;
const MARGEM = 12;

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
}

// Fila global (fora do componente, vale pro app inteiro): só uma dica
// segura a "vez" de escurecer a tela. As outras ficam esperando o evento
// de liberação antes de tentar de novo.
let vezDe = null;
const ouvintesDeLiberacao = new Set();
function pedirVez(chave) {
  if (vezDe === null) { vezDe = chave; return true; }
  return vezDe === chave;
}
function largarVez(chave) {
  if (vezDe !== chave) return;
  vezDe = null;
  ouvintesDeLiberacao.forEach((fn) => fn());
}
function aoLiberarVez(fn) {
  ouvintesDeLiberacao.add(fn);
  return () => ouvintesDeLiberacao.delete(fn);
}

// `alvoSeletor`: seletor CSS (usado com .closest()) do elemento que deve
// ficar destacado/colorido no meio do escurecido. Sem isso, usa o elemento
// pai de onde o <DicaNova> foi colocado — funciona bem quando ele é posto
// logo dentro do próprio elemento que quer destacar (um h2, um link, etc.).
export default function DicaNova({ chave, texto, lado = "baixo-esquerda", alvoSeletor = null }) {
  const [vista, setVista] = useState(() => dicaFoiVista(chave));
  const [visivel, setVisivel] = useState(false);
  const [rect, setRect] = useState(null);
  const marcaRef = useRef(null);
  const seguraVezRef = useRef(false);

  // Entra na fila: só liga o temporizador de aparecer quando for a vez
  // dela; se outra dica estiver na tela, espera a liberação.
  useEffect(() => {
    if (vista) return;
    let ativo = true;
    let timerAtraso = null;
    function tentar() {
      if (!ativo) return;
      if (!pedirVez(chave)) return;
      seguraVezRef.current = true;
      timerAtraso = setTimeout(() => { if (ativo) setVisivel(true); }, ATRASO_MS);
    }
    tentar();
    const remover = aoLiberarVez(tentar);
    return () => {
      ativo = false;
      clearTimeout(timerAtraso);
      remover();
      if (seguraVezRef.current) { seguraVezRef.current = false; largarVez(chave); }
    };
  }, [vista, chave]);

  useEffect(() => {
    if (!visivel) return;
    // some sozinha depois de um tempo, e já fica marcada como vista — não
    // precisa de clique nenhum pra "contar" que a pessoa viu.
    const t = setTimeout(dispensar, DURACAO_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visivel]);

  // Mede o elemento-alvo (pra recortar o furo de luz) e acompanha
  // rolagem/redimensionamento enquanto a dica estiver na tela. Se o alvo
  // estiver fora da parte visível (abaixo da dobra, por exemplo), rola
  // suavemente até ele primeiro — senão o destaque cai fora da tela e
  // ninguém vê nada.
  useEffect(() => {
    if (!visivel) { setRect(null); return; }
    const alvo = alvoSeletor ? marcaRef.current?.closest(alvoSeletor) : marcaRef.current?.parentElement;
    if (!alvo) return;
    const medir = () => setRect(alvo.getBoundingClientRect());
    const r0 = alvo.getBoundingClientRect();
    const dentroDaTela = r0.top >= 0 && r0.bottom <= window.innerHeight;
    let esperaRolagem = null;
    if (!dentroDaTela) {
      alvo.scrollIntoView({ behavior: "smooth", block: "center" });
      esperaRolagem = setTimeout(medir, 400);
    } else {
      medir();
    }
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      clearTimeout(esperaRolagem);
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [visivel, alvoSeletor]);

  function dispensar() {
    marcarDicaVista(chave);
    setVisivel(false);
    setVista(true);
    seguraVezRef.current = false;
    largarVez(chave);
  }

  if (vista) return null;

  // Posição do balão: perto do alvo, sem sair da tela.
  let estiloBalao = null;
  if (rect) {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    let esquerda = lado === "baixo-direita" ? rect.right - LARGURA_BALAO : rect.left;
    esquerda = Math.min(Math.max(esquerda, MARGEM), vw - LARGURA_BALAO - MARGEM);
    const cabeAbaixo = rect.bottom + 140 < vh;
    estiloBalao = cabeAbaixo
      ? { top: rect.bottom + 14, left: esquerda }
      : { bottom: vh - rect.top + 14, left: esquerda };
    estiloBalao.setaEm = Math.min(Math.max(rect.left + rect.width / 2 - esquerda, 18), LARGURA_BALAO - 18);
    estiloBalao.cabeAbaixo = cabeAbaixo;
  }

  return (
    <>
      <span ref={marcaRef} />
      {visivel && rect && createPortal(
        <div className="v2-dica-fundo">
          <div className="v2-dica-destaque" style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }} />
          <div
            className={`v2-dica-balao ${estiloBalao.cabeAbaixo ? "v2-dica-abaixo" : "v2-dica-acima"}`}
            style={{ top: estiloBalao.top, bottom: estiloBalao.bottom, left: estiloBalao.left, "--seta-em": `${estiloBalao.setaEm}px` }}
            role="status"
            onClick={(e) => e.stopPropagation()}
          >
            {texto}
            <button type="button" onClick={dispensar}>Entendi</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
