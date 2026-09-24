import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { novoSocket, ehSessaoMorta } from "./api.js";
import Topo from "./Topo.jsx";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Entrada from "./impostor/Entrada.jsx";
import SalaEspera from "./impostor/SalaEspera.jsx";
import Rodada from "./impostor/Rodada.jsx";
import Votacao from "./impostor/Votacao.jsx";
import Revelacao from "./impostor/Revelacao.jsx";
import BotaoSom from "./impostor/BotaoSom.jsx";
import ChatImpostor from "./impostor/ChatImpostor.jsx";
import { carregarFontes } from "./impostor/fontes.js";
import { prepararSons } from "./impostor/sons.js";
import "./impostor/impostor.css";

// O IMPOSTOR — tela (EM CONSTRUÇÃO, sem link no site: /v2/?pagina=impostor).
// O motor fica em backend/src/impostor/. Esta tela só mostra o estado que o
// servidor manda e envia intenções (dica, voto, chute) — nunca decide nada.
//
// Mesmo modelo de conexão do Tribunal: o código da sala fica na URL
// (&mesa=KX7-42) e, se a conexão cair, entra de novo sozinho ao reconectar.

// Qual tela mostra cada fase. REVELACAO, ULTIMA_CHANCE e FIM são a MESMA
// tela: a sequência da revelação roda uma vez e o resto aparece embaixo.
const TELA = { LOBBY: "espera", CARTAS: "carta", DICAS: "dicas", VOTACAO: "votacao", REVELACAO: "revelacao", ULTIMA_CHANCE: "revelacao", FIM: "revelacao" };

export default function Impostor({ usuario, salaDoLink }) {
  const [estado, setEstado] = useState(null);
  const [carta, setCarta] = useState(null);
  const [tempo, setTempo] = useState({ ms: null, em: 0 });
  const [erro, setErro] = useState("");
  const [caiu, setCaiu] = useState(false);
  const [chat, setChat] = useState([]);
  const socketRef = useRef(null);
  const codigoRef = useRef(salaDoLink || null);

  useEffect(() => { carregarFontes(); prepararSons(); }, []);

  useEffect(() => {
    const s = novoSocket();
    socketRef.current = s;
    let fase = "";
    s.on("impostor-estado", (e) => {
      if (e.fase !== fase) { fase = e.fase; setErro(""); }
      if (e.fase === "LOBBY") setCarta(null);
      codigoRef.current = e.codigo;
      setTempo({ ms: e.restanteMs, em: Date.now() });
      setEstado(e);
    });
    s.on("impostor-carta", setCarta);
    s.on("impostor-tempo", (t) => setTempo({ ms: t.restanteMs, em: Date.now() }));
    // Chat: o histórico chega a cada entrada (substitui a lista); depois, uma
    // mensagem por evento. O corte em 150 só segura a memória numa sala longa.
    s.on("impostor-chat-historico", (d) => setChat(Array.isArray(d?.mensagens) ? d.mensagens : []));
    s.on("impostor-chat", (m) => setChat((lista) => (lista.some((x) => x.id === m.id) ? lista : [...lista, m].slice(-150))));
    s.on("connect", () => {
      setCaiu(false);
      setErro("");
      if (codigoRef.current) {
        s.emit("impostor-entrar", { codigo: codigoRef.current }, (r) => {
          if (r?.erro) { setErro(r.erro); codigoRef.current = null; window.history.replaceState(null, "", "/v2/?pagina=impostor"); }
        });
      }
    });
    s.on("disconnect", () => setCaiu(true));
    // Conexão recusada (login que não vale neste servidor, servidor fora do
    // ar): sem isto, os botões não faziam nada e não aparecia aviso nenhum.
    s.on("connect_error", (err) => {
      setErro(ehSessaoMorta(err)
        ? "Seu login não vale mais neste servidor. Saia da conta (botão no topo) e entre de novo."
        : "Não foi possível conectar ao servidor do jogo. Tentando de novo…");
    });
    s.connect();
    // Sair da página só desconecta: o servidor segura a vaga (queda de rede,
    // recarregar). Sair DE VEZ é o botão "Sair da sala".
    return () => s.disconnect();
  }, [salaDoLink]);

  // Sem resposta em 8s (conexão caída ou recusada), avisa em vez de ficar
  // esperando pra sempre. `avisoNoTopo: false`: a tela mostra o erro ela
  // mesma, perto do campo (ex.: dica recusada).
  const pedir = (evento, dados = {}, { avisoNoTopo = true } = {}) =>
    new Promise((ok) => {
      const s = socketRef.current;
      if (!s) return ok({});
      s.timeout(8000).emit(evento, dados, (falhou, r) => {
        if (falhou) { setErro("O servidor não respondeu. Confira sua conexão e tente de novo."); return ok({}); }
        if (r?.erro && avisoNoTopo) setErro(r.erro);
        else setErro("");
        ok(r || {});
      });
    });

  function irParaSala(codigo) {
    codigoRef.current = codigo;
    window.history.replaceState(null, "", `/v2/?pagina=impostor&mesa=${encodeURIComponent(codigo)}`);
  }
  async function criar() {
    const r = await pedir("impostor-criar");
    if (r.codigo) irParaSala(r.codigo);
  }
  async function entrar(codigo) {
    const r = await pedir("impostor-entrar", { codigo });
    if (r.codigo) irParaSala(r.codigo);
  }
  function sairDaSala() {
    socketRef.current?.emit("impostor-sair");
    codigoRef.current = null;
    setEstado(null);
    setCarta(null);
    setChat([]);
    window.history.replaceState(null, "", "/v2/?pagina=impostor");
  }

  const props = { estado, carta, tempo, pedir, aoSair: sairDaSala };
  const qual = estado ? TELA[estado.fase] : "entrada";
  // Tela nova começa do topo (no celular, a rolagem da tela anterior
  // escondia o cabeçalho com a rodada e o cronômetro).
  useEffect(() => { window.scrollTo(0, 0); }, [qual]);
  let tela;
  if (qual === "entrada") tela = <Entrada aoCriar={criar} aoEntrar={entrar} entrando={!!salaDoLink && !erro} />;
  else if (qual === "espera") tela = <SalaEspera {...props} />;
  else if (qual === "carta" || qual === "dicas") tela = <Rodada {...props} />;
  else if (qual === "votacao") tela = <Votacao {...props} />;
  else tela = <Revelacao {...props} />;

  return (
    // reducedMotion="user": com "reduzir movimento" ligado no aparelho, o
    // motion corta deslocamentos e escalas e deixa só os fades.
    <MotionConfig reducedMotion="user">
      <div className="v2-app v2-com-menu imp-app">
        <Topo usuario={usuario} ativo={null} />
        <main className={estado ? "imp com-chat" : "imp"}>
          <div className="imp-barra">
            {/* Tela inicial: um jeito claro de desistir e voltar pro lobby.
                Dentro da sala quem cuida disso é o "Sair" da própria tela. */}
            {qual === "entrada" && (
              <a
                className="imp-voltar"
                href={linkDaPagina("inicio")}
                onClick={(e) => { e.preventDefault(); irParaPagina("inicio"); }}
              >
                ← Voltar ao lobby
              </a>
            )}
            {estado && <span className="imp-barra-sala">Sala {estado.codigo}</span>}
            <BotaoSom />
          </div>
          {caiu && <div className="imp-aviso" role="status">Conexão caiu — reconectando…</div>}
          {erro && <div className="imp-aviso erro" role="alert">{erro}</div>}
          {estado && !estado.participo && estado.fase !== "LOBBY" && (
            <div className="imp-aviso" role="status">Partida em andamento. Você está assistindo e joga a próxima.</div>
          )}
          {/* Com sala: jogo + chat (ao lado no computador largo, embaixo no
              resto). O chat fica FORA da animação de troca de tela, pra não
              piscar nem perder a rolagem quando a fase muda. */}
          <div className="imp-corpo">
            <div className="imp-corpo-jogo">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={qual}
                  className="imp-tela"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {tela}
                </motion.div>
              </AnimatePresence>
            </div>
            {estado && <ChatImpostor mensagens={chat} estado={estado} pedir={pedir} />}
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}
