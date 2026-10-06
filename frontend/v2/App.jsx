import { lazy, Suspense, useEffect, useState } from "react";
import { usuarioAtual } from "./api.js";
import Lobby from "./Lobby.jsx";
import SalaAcro from "./SalaAcro.jsx";
import Ranking from "./Ranking.jsx";
import Missoes from "./Missoes.jsx";
import Patentes from "./Patentes.jsx";
import Perfil from "./Perfil.jsx";
import Inicio from "./Inicio.jsx";
import Amigos from "./Amigos.jsx";
import Cla from "./Cla.jsx";
import Novidades from "./Novidades.jsx";
import Impostor from "./ImpostorSobDemanda.jsx";
import { Entrada, Entrar, Cadastro, EsqueciSenha, RedefinirSenha, Legal } from "./Publicas.jsx";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";
import ErroNaPagina from "./ErroNaPagina.jsx";

// Páginas pesadas ou pouco visitadas carregam sob demanda (mesma ideia do
// ImpostorSobDemanda): quem só abre o Início não baixa o painel admin nem as
// salas. Ficam de fora as que outro arquivo já importa direto (SalaAcro, via
// Lobby; Amigos, via o chat flutuante) — lá não adiantaria.
// Falha ao baixar (deploy no meio) cai no ErroNaPagina, que recarrega.
const Sala = lazy(() => import("./Sala.jsx"));
const SalaStop = lazy(() => import("./SalaStop.jsx"));
const MultiSala = lazy(() => import("./MultiSala.jsx"));
const Admin = lazy(() => import("./Admin.jsx"));
const Mentira = lazy(() => import("./Mentira.jsx"));
const Tribunal = lazy(() => import("./Tribunal.jsx"));
const EditarPerfil = lazy(() => import("./EditarPerfil.jsx"));
const SalasPrivadas = lazy(() => import("./SalasPrivadas.jsx"));
const HallFama = lazy(() => import("./HallFama.jsx"));
const Clas = lazy(() => import("./Clas.jsx"));

// Navegação por parâmetro (?sala=ID, ?pagina=ranking, ?pagina=jogador&id=X)
// em vez de rotas: /v2/ é sempre o mesmo arquivo, e recarregar nunca cai no
// site clássico por engano.
function lerLocal() {
  const p = new URLSearchParams(window.location.search);
  return { mesa: p.get("mesa"), token: p.get("token"), salaPrivada: p.get("privada"), sala: p.get("sala"), stop: p.get("stop"), acro: p.get("acro"), pagina: p.get("pagina"), id: p.get("id"), jogo: p.get("jogo") };
}

function navegar(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const url = q.toString() ? `/v2/?${q}` : "/v2/";
  window.history.pushState({}, "", url);
  window.dispatchEvent(new Event("popstate"));
  window.scrollTo(0, 0);
}

export const irPara = (sala) => navegar({ sala });
export const irParaStop = (stop) => navegar({ stop });
export const irParaAcro = (acro) => navegar({ acro });
// Saindo de uma sala, volta pra escolha de salas (e não pro Início).
export const voltarAoLobby = (jogo) => navegar({ pagina: "jogar", jogo });
export const irParaPagina = (pagina, extra = {}) => navegar({ pagina, ...extra });
export const linkDaPagina = (pagina, extra = {}) => {
  const q = new URLSearchParams({ pagina, ...extra });
  return `/v2/?${q}`;
};

export default function App() {
  const [local, setLocal] = useState(lerLocal());
  const usuario = usuarioAtual();

  useEffect(() => {
    const aoVoltar = () => setLocal(lerLocal());
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, []);

  // Erro numa página mostra a tela de erro SÓ nela (e não tela em branco no
  // site todo). A `key` muda quando troca de página e zera o erro — sem ela,
  // a tela de erro ficaria presa nas páginas seguintes. Só a página (não os
  // outros parâmetros, igual ao pathname do clássico), e vinda de `local`:
  // os jogos trocam a URL com replaceState ao entrar numa sala, e isso não
  // pode remontar a página.
  const qualPagina = local.sala ? `sala-${local.sala}` : local.stop ? `stop-${local.stop}` : local.acro ? `acro-${local.acro}` : local.pagina || "inicio";
  return (
    <ErroNaPagina key={qualPagina}>
      <Suspense fallback={<div className="v2-carregando">Carregando…</div>}>
        <Pagina local={local} usuario={usuario} />
      </Suspense>
    </ErroNaPagina>
  );
}

function Pagina({ local, usuario }) {
  // Páginas que qualquer um vê (logado ou não).
  if (local.pagina === "termos" || local.pagina === "privacidade") {
    const qual = local.pagina;
    if (!usuario) return <Legal key={qual} qual={qual} />;
    return <Legal key={qual} qual={qual} comTopo={(c) => (
      <div className="v2-app v2-com-menu"><Topo usuario={usuario} ativo={null} /><main className="v2-pagina v2-pagina-estreita">{c}</main><Rodape /></div>
    )} />;
  }
  if (local.pagina === "redefinir-senha") return <RedefinirSenha token={local.token} />;

  // SEM LOGIN: a entrada pública, ou as telas de conta. Quem abriu o link de
  // uma página da área logada vê a tela de entrar e, depois de entrar, cai
  // nela mesma (a tela recarrega no mesmo endereço).
  if (!usuario) {
    switch (local.pagina) {
      case "entrar": return <Entrar />;
      case "cadastro": return <Cadastro />;
      case "esqueci-senha": return <EsqueciSenha />;
      default:
        return local.pagina || local.sala || local.stop || local.acro ? <Entrar /> : <Entrada />;
    }
  }
  // Logado e caiu numa tela de conta (ex.: link antigo): vai pro Início.
  if (["entrar", "cadastro", "esqueci-senha"].includes(local.pagina)) return <Inicio usuario={usuario} />;

  if (local.sala) return <Sala key={local.sala} roomId={local.sala} usuario={usuario} />;
  if (local.stop) return <SalaStop key={local.stop} roomId={local.stop} usuario={usuario} />;
  if (local.acro) return <SalaAcro key={local.acro} roomId={local.acro} usuario={usuario} />;
  switch (local.pagina) {
    case "ranking": return <Ranking usuario={usuario} jogoInicial={local.jogo} />;
    case "missoes": return <Missoes usuario={usuario} />;
    case "patentes": return <Patentes key={local.jogo || "q"} usuario={usuario} jogoInicial={local.jogo} />;
    case "jogador": return <Perfil key={local.id} usuario={usuario} userId={local.id || usuario.id} />;
    case "jogar": return <Lobby key={local.jogo || "l"} usuario={usuario} jogoInicial={local.jogo} />;
    case "amigos": return <Amigos usuario={usuario} conversaInicial={local.id} />;
    case "clas": return <Clas usuario={usuario} />;
    case "cla": return <Cla key={local.id} usuario={usuario} claId={local.id} />;
    case "hall": return <HallFama usuario={usuario} />;
    case "novidades": return <Novidades usuario={usuario} />;
    case "editar-perfil": return <EditarPerfil usuario={usuario} />;
    case "admin": return <Admin usuario={usuario} />;
    case "privadas": return <SalasPrivadas key={local.jogo || "stop"} usuario={usuario} jogo={local.jogo === "acromania" ? "acromania" : "stop"} salaDoLink={local.salaPrivada} />;
    // Mentira Sincera — EM TESTE, sem link em lugar nenhum (só o atalho do painel admin).
    case "mentira": return <Mentira usuario={usuario} salaDoLink={local.mesa} />;
    // O Tribunal — EM TESTE (cards com selo "em testes").
    case "tribunal": return <Tribunal usuario={usuario} salaDoLink={local.mesa} />;
    // O Impostor — EM CONSTRUÇÃO, sem link no site.
    case "impostor": return <Impostor usuario={usuario} salaDoLink={local.mesa} />;
    case "varias": return <MultiSala key={local.jogo || "stop"} usuario={usuario} jogo={local.jogo === "quiz" ? "quiz" : "stop"} />;
    default: return <Inicio usuario={usuario} />;
  }
}
