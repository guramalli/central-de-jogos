import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Sala from "./Sala.jsx";
import SalaStop from "./SalaStop.jsx";
import { nomeDoTema } from "./temas.js";

// MULTI-SALA — até 4 partidas na mesma tela (Stop ou Quiz), igual ao
// clássico (src/pages/MultiSala.jsx):
//  - cada painel tem a SUA conexão (o servidor guarda uma sala por conexão);
//  - só o painel ATUAL puxa o cursor quando a rodada começa;
//  - Ctrl+←/→ passa de sala, Ctrl+↑/↓ pula de linha, Ctrl+número vai direto;
//  - com 2 salas dá pra empilhar (uma embaixo da outra).
const MAX_PAINEIS = 4;
// Campos de jogo que recebem o foco ao trocar de painel.
const CAMPOS = [".v2-stop-campo input:not([disabled])", ".v2-resposta input:not([disabled])"];

export default function MultiSala({ usuario, jogo }) {
  const ehStop = jogo !== "quiz";
  const [salas, setSalas] = useState([]);
  const [abertas, setAbertas] = useState([]);
  const [erro, setErro] = useState("");
  const [seletor, setSeletor] = useState(false);
  const [atual, setAtual] = useState(null);
  const atualRef = useRef(null);
  const paineisRef = useRef({});
  const [empilhado, setEmpilhado] = useState(() => localStorage.getItem("eg_multisala_empilhado") === "1");
  const [dicaVista, setDicaVista] = useState(() => localStorage.getItem("eg_dica_multisala") === "1");

  useEffect(() => {
    let vivo = true;
    const carregar = () => api.get(ehStop ? "/rooms" : "/quiz-rooms")
      .then(({ data }) => vivo && setSalas(Array.isArray(data) ? data : data.rooms || []))
      .catch(() => vivo && setErro("Não foi possível carregar as salas."));
    carregar();
    const t = setInterval(() => { if (!document.hidden) carregar(); }, 30000);
    return () => { vivo = false; clearInterval(t); };
  }, [ehStop]);

  function abrir(id) {
    setErro("");
    if (abertas.includes(id)) return;
    if (abertas.length >= MAX_PAINEIS) { setErro(`Dá pra abrir até ${MAX_PAINEIS} salas ao mesmo tempo.`); return; }
    setAbertas((a) => [...a, id]);
    if (!atualRef.current) { atualRef.current = id; setAtual(id); }
  }
  function fechar(id) {
    setAbertas((a) => a.filter((r) => r !== id));
    if (atualRef.current === id) { atualRef.current = null; setAtual(null); }
  }

  function focarPainel(id) {
    const painel = paineisRef.current[id];
    if (!painel) return;
    atualRef.current = id;
    setAtual(id);
    let focou = false;
    for (const sel of CAMPOS) {
      const campo = painel.querySelector(sel);
      if (campo) { campo.focus({ preventScroll: true }); focou = true; break; }
    }
    // Sem campo aberto (intervalo): tira o foco do painel anterior, senão o
    // teclado continuaria digitando lá.
    if (!focou) {
      const ant = document.activeElement;
      if (ant && ant !== document.body && !painel.contains(ant)) ant.blur?.();
    }
    painel.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function trocar(passo, vertical = false) {
    if (abertas.length < 2) return;
    const umaColuna = window.innerWidth <= 900 || (abertas.length === 2 && empilhado);
    const colunas = umaColuna ? 1 : 2;
    const total = abertas.length;
    const i = abertas.indexOf(atualRef.current);
    if (i === -1) { focarPainel(abertas[0]); return; }
    let destino;
    if (vertical) {
      const ultima = Math.floor((total - 1) / colunas);
      let linha = Math.floor(i / colunas) + passo;
      if (linha < 0) linha = ultima;
      if (linha > ultima) linha = 0;
      destino = Math.min(linha * colunas + (i % colunas), total - 1);
    } else {
      destino = (((i + passo) % total) + total) % total;
    }
    focarPainel(abertas[destino]);
  }

  useEffect(() => {
    if (!abertas.length) return;
    const tecla = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.key === "ArrowRight") { e.preventDefault(); trocar(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); trocar(-1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); trocar(1, true); }
      else if (e.key === "ArrowUp") { e.preventDefault(); trocar(-1, true); }
      else if (/^[1-9]$/.test(e.key)) { const alvo = abertas[Number(e.key) - 1]; if (alvo) { e.preventDefault(); focarPainel(alvo); } }
    };
    window.addEventListener("keydown", tecla, true);
    return () => window.removeEventListener("keydown", tecla, true);
  }, [abertas, empilhado]);

  const alternarEmpilhado = () => setEmpilhado((v) => { localStorage.setItem("eg_multisala_empilhado", v ? "0" : "1"); return !v; });
  const jogando = abertas.length > 0;
  const nomeSala = (id) => { const s = salas.find((x) => x.roomId === id); return s ? (ehStop ? s.label : nomeDoTema(s.label) + (s.tier === "avancado" ? " · Avançada" : s.tier ? " · Padrão" : "")) : id; };
  const Jogo = ehStop ? SalaStop : Sala;
  const voltar = (e) => { e.preventDefault(); irParaPagina("jogar", { jogo: ehStop ? "stop" : "quiz" }); };

  return (
    <div className={`v2-app v2-multi ${jogando ? "jogando" : ""}`}>
      {!jogando ? (
        <header className="v2-multi-cabeca">
          <div>
            <h1>{ehStop ? "Stop" : "Quiz"} — várias salas</h1>
            <p>Abra até {MAX_PAINEIS} salas na mesma tela. Cada painel é uma partida independente, com chat e placar próprios.</p>
            <p className="v2-multi-atalhos">Pra trocar de sala: <kbd>Ctrl</kbd> + <kbd>←</kbd> <kbd>→</kbd> passa de uma em uma, <kbd>Ctrl</kbd> + <kbd>↑</kbd> <kbd>↓</kbd> pula de linha, e <kbd>Ctrl</kbd> + o número vai direto. Clicar também funciona.</p>
          </div>
          <a className="v2-botao v2-botao-contorno" href={linkDaPagina("jogar", { jogo: ehStop ? "stop" : "quiz" })} onClick={voltar}>← Voltar às salas</a>
        </header>
      ) : (
        <div className="v2-multi-barra">
          <button className="v2-botao-pequeno" onClick={() => setSeletor((v) => !v)}>{seletor ? "Fechar lista" : "Escolher salas"}</button>
          {abertas.length > 1 && <button className="v2-botao-pequeno" onClick={() => trocar(1)} title="Ctrl + seta, ou Ctrl + número da sala">Próxima sala</button>}
          {abertas.length === 2 && <button className="v2-botao-pequeno" onClick={alternarEmpilhado}>{empilhado ? "Lado a lado" : "Empilhar"}</button>}
          <span className="v2-multi-contador">{abertas.length} de {MAX_PAINEIS} salas{abertas.length > 1 && <span className="v2-multi-dica-atalho"> · Ctrl + setas pra alternar</span>}</span>
          <a className="v2-botao-pequeno" href={linkDaPagina("jogar", { jogo: ehStop ? "stop" : "quiz" })} onClick={voltar}>← salas</a>
        </div>
      )}

      {erro && <div className="v2-faixa-aviso erro">{erro}</div>}

      {jogando && abertas.length > 1 && !dicaVista && (
        <div className="v2-multi-dica">
          <span>Várias salas abertas. Use <kbd>Ctrl</kbd> + <kbd>←</kbd> <kbd>→</kbd> pra passar de uma pra outra sem tirar a mão do teclado, ou <kbd>Ctrl</kbd> + o número da sala.</span>
          <button className="v2-botao-pequeno" onClick={() => { setDicaVista(true); localStorage.setItem("eg_dica_multisala", "1"); }}>Entendi</button>
        </div>
      )}

      {(!jogando || seletor) && <Seletor salas={salas} abertas={abertas} ehStop={ehStop} alternar={(id) => (abertas.includes(id) ? fechar(id) : abrir(id))} />}

      {!jogando ? (
        <p className="v2-multi-vazio">Escolha as salas acima pra começar. Elas aparecem lado a lado aqui embaixo.</p>
      ) : (
        <div className={`v2-multi-grade n${abertas.length} ${abertas.length === 2 && empilhado ? "empilhada" : ""}`}>
          {abertas.map((id, i) => (
            <div
              key={id}
              className={`v2-multi-painel ${atual === id ? "atual" : ""}`}
              ref={(el) => { if (el) paineisRef.current[id] = el; else delete paineisRef.current[id]; }}
              onMouseDown={() => { atualRef.current = id; setAtual(id); }}
              onFocusCapture={() => { if (atualRef.current !== id) { atualRef.current = id; setAtual(id); } }}
            >
              <div className="v2-multi-painel-topo">
                <span className="v2-multi-numero">{i + 1}</span>
                <span className="v2-multi-nome">{nomeSala(id)}</span>
                <button className="v2-multi-fechar" onClick={() => fechar(id)} aria-label={`Fechar ${nomeSala(id)}`} title="Fechar esta sala">×</button>
              </div>
              <div className="v2-multi-jogo">
                <Jogo key={id} roomId={id} usuario={usuario} compacto ativo={atual === id} aoFechar={() => fechar(id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Seletor({ salas, abertas, ehStop, alternar }) {
  const arenas = salas.filter((s) => s.arena);
  const grupos = [];
  for (const s of salas.filter((x) => !x.arena)) {
    const chave = ehStop ? "stop" : s.themeKey || s.roomId;
    let g = grupos.find((x) => x.chave === chave);
    if (!g) { g = { chave, nome: ehStop ? "Salas do Stop" : nomeDoTema(s.label), salas: [] }; grupos.push(g); }
    g.salas.push(s);
  }
  const nivel = (s) => {
    if (ehStop) return s.label;
    const partes = (s.label || "").split("—");
    if (partes.length > 1) return partes.slice(1).join("—").trim();
    if (s.arena) return s.label.replace(/⚡|Arena|Boca Livre|Relâmpago|—/gi, "").trim() || "Entrar";
    return "Entrar";
  };
  const Botao = ({ s }) => {
    const aberta = abertas.includes(s.roomId);
    const cls = ehStop ? (s.difficulty === "advanced" ? "avancada" : s.difficulty === "mid" ? "media" : "padrao") : s.arena ? "arena" : s.tier === "avancado" ? "avancada" : "padrao";
    return (
      <button className={`v2-multi-sala ${cls} ${aberta ? "aberta" : ""}`} onClick={() => alternar(s.roomId)} title={s.label} aria-pressed={aberta}>
        {aberta && <span aria-hidden="true">✓ </span>}{nivel(s)}
        {s.onlineCount > 0 && <em>{s.onlineCount}</em>}
      </button>
    );
  };
  return (
    <div className="v2-multi-seletor">
      {arenas.length > 0 && (
        <div className="v2-multi-grupo"><b>Arenas</b><div>{arenas.map((s) => <Botao key={s.roomId} s={s} />)}</div></div>
      )}
      {grupos.map((g) => (
        <div key={g.chave} className="v2-multi-grupo"><b>{g.nome}</b><div>{g.salas.map((s) => <Botao key={s.roomId} s={s} />)}</div></div>
      ))}
    </div>
  );
}
