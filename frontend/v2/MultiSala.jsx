import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Sala from "./Sala.jsx";
import SalaStop from "./SalaStop.jsx";
import BotoesSom from "./BotoesSom.jsx";
import { nomeDoTema } from "./temas.js";

// MULTI-SALA — até 4 partidas na mesma tela (Stop ou Quiz), igual ao
// clássico (src/pages/MultiSala.jsx):
//  - cada painel tem a SUA conexão (o servidor guarda uma sala por conexão);
//  - só o painel ATUAL puxa o cursor quando a rodada começa;
//  - Ctrl+←/→ passa de sala, Ctrl+↑/↓ pula de linha, Ctrl+número vai direto;
//  - com 2 salas dá pra empilhar (uma embaixo da outra);
//  - as salas são ESCOLHIDAS primeiro na lista (marca/desmarca) e abrem todas
//    juntas no "Abrir" — antes cada clique já abria uma sala e a tela virava
//    jogo, e as outras só dava pra escolher depois, pelo botão lá em cima.
const MAX_PAINEIS = 4;
// Campos de jogo que recebem o foco ao trocar de painel.
const CAMPOS = [".v2-stop-campo input:not([disabled])", ".v2-resposta input:not([disabled])"];

export default function MultiSala({ usuario, jogo }) {
  const ehStop = jogo !== "quiz";
  const [salas, setSalas] = useState([]);
  const [abertas, setAbertas] = useState([]);
  const [erro, setErro] = useState("");
  const [seletor, setSeletor] = useState(false);
  // Marcadas na lista, ainda não abertas (vira `abertas` no confirmar).
  const [escolhidas, setEscolhidas] = useState([]);
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

  function marcar(id) {
    setErro("");
    if (escolhidas.includes(id)) { setEscolhidas((e) => e.filter((x) => x !== id)); return; }
    if (escolhidas.length >= MAX_PAINEIS) { setErro(`Dá pra abrir até ${MAX_PAINEIS} salas ao mesmo tempo.`); return; }
    setEscolhidas((e) => [...e, id]);
  }

  // Confirma a lista: as que já estavam abertas e continuam marcadas ficam no
  // mesmo lugar (a partida delas não reinicia); as novas entram no fim.
  function confirmar() {
    if (!escolhidas.length) return;
    setErro("");
    const ficam = abertas.filter((id) => escolhidas.includes(id));
    const novas = escolhidas.filter((id) => !abertas.includes(id));
    const final = [...ficam, ...novas];
    setAbertas(final);
    setSeletor(false);
    if (!final.includes(atualRef.current)) { atualRef.current = final[0]; setAtual(final[0]); }
  }

  function abrirSeletor() {
    if (seletor) { setSeletor(false); return; }
    setEscolhidas(abertas); // começa do que já está na tela
    setErro("");
    setSeletor(true);
  }

  function fechar(id) {
    setEscolhidas((e) => e.filter((r) => r !== id));
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
          <button className="v2-botao-pequeno" onClick={abrirSeletor}>{seletor ? "Fechar lista" : "Escolher salas"}</button>
          {abertas.length > 1 && <button className="v2-botao-pequeno" onClick={() => trocar(1)} title="Ctrl + seta, ou Ctrl + número da sala">Próxima sala</button>}
          {abertas.length === 2 && <button className="v2-botao-pequeno" onClick={alternarEmpilhado}>{empilhado ? "Lado a lado" : "Empilhar"}</button>}
          <span className="v2-multi-contador">{abertas.length} de {MAX_PAINEIS} salas{abertas.length > 1 && <span className="v2-multi-dica-atalho"> · Ctrl + setas pra alternar</span>}</span>
          {/* Os painéis compactos escondem o topo de cada sala (onde ficam
              som e confete): os dois botões vêm pra cá e valem pra todas. */}
          <div className="v2-multi-som"><BotoesSom /></div>
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

      {(!jogando || seletor) && (
        <>
          <Seletor salas={salas} escolhidas={escolhidas} ehStop={ehStop} alternar={marcar} />
          <Confirmar
            escolhidas={escolhidas}
            abertas={abertas}
            jogando={jogando}
            nomeSala={nomeSala}
            confirmar={confirmar}
            limpar={() => setEscolhidas(jogando ? abertas : [])}
          />
        </>
      )}

      {!jogando ? (
        <p className="v2-multi-vazio">Marque até {MAX_PAINEIS} salas na lista e toque em <b>Abrir</b>: elas abrem todas juntas, lado a lado.</p>
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

// Barra de confirmação da escolha: mostra o que foi marcado e abre tudo
// de uma vez. Com jogo já rolando, "Aplicar" também fecha as desmarcadas.
function Confirmar({ escolhidas, abertas, jogando, nomeSala, confirmar, limpar }) {
  const mudou = escolhidas.length !== abertas.length || escolhidas.some((id) => !abertas.includes(id));
  const fecham = abertas.filter((id) => !escolhidas.includes(id)).length;
  const n = escolhidas.length;
  let rotulo = n === 0 ? "Abrir salas" : n === 1 ? "Abrir 1 sala" : `Abrir ${n} salas`;
  if (jogando) rotulo = "Aplicar";
  return (
    <div className="v2-multi-confirmar" role="region" aria-label="Salas escolhidas">
      <div className="v2-multi-confirmar-texto">
        {n === 0
          ? <span>Nenhuma sala marcada ainda.</span>
          : <span><b>{n} de {MAX_PAINEIS}</b> · {escolhidas.map(nomeSala).join(", ")}</span>}
        {jogando && fecham > 0 && <span className="v2-multi-confirmar-aviso">{fecham === 1 ? "1 sala aberta vai fechar." : `${fecham} salas abertas vão fechar.`}</span>}
      </div>
      {n > 0 && mudou && <button type="button" className="v2-botao-pequeno" onClick={limpar}>{jogando ? "Desfazer" : "Limpar"}</button>}
      <button type="button" className="v2-botao v2-botao-amarelo" disabled={n === 0 || (jogando && !mudou)} onClick={confirmar}>{rotulo}</button>
    </div>
  );
}

function Seletor({ salas, escolhidas, ehStop, alternar }) {
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
    const aberta = escolhidas.includes(s.roomId);
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
