import { useEffect, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";
import Avatar from "./Avatar.jsx";

// MEUS DUELOS — quiz por turnos. "É a sua vez" em destaque, depois os que
// esperam o adversário e os encerrados. Novo duelo: contra um amigo, contra
// o robô (joga na hora) ou por link de convite (WhatsApp).

const tempoRestante = (quando) => {
  if (!quando) return "";
  const ms = new Date(quando).getTime() - Date.now();
  if (ms <= 0) return "prazo acabando";
  const h = Math.floor(ms / 3600000);
  if (h >= 1) return `${h}h pra jogar`;
  return `${Math.max(1, Math.floor(ms / 60000))}min pra jogar`;
};

export function linkDoDuelo(id) {
  return `${window.location.origin}/v2/?pagina=duelo&id=${id}`;
}

export default function Duelos({ usuario }) {
  const [lista, setLista] = useState(null);
  const [stats, setStats] = useState(null);
  const [novo, setNovo] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = () => api.get("/duelos").then(({ data }) => setLista(data || [])).catch(() => setLista((l) => l || []));
  useEffect(() => {
    carregar();
    api.get(`/duelos/estatisticas/${usuario.id}`).then(({ data }) => setStats(data)).catch(() => {});
    const t = setInterval(() => { if (!document.hidden) carregar(); }, 20000);
    return () => clearInterval(t);
  }, [usuario.id]);

  const sua = (lista || []).filter((d) => d.minhaVez);
  const esperando = (lista || []).filter((d) => !d.minhaVez && (d.status === "andamento" || d.status === "aguardando"));
  const encerrados = (lista || []).filter((d) => ["encerrado", "recusado"].includes(d.status)).slice(0, 15);
  const abrir = (id) => irParaPagina("duelo", { id });

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo="duelos" />
      <main className="v2-pagina v2-duelos">
        <section className="v2-duelos-hero">
          <div>
            <span className="v2-duelos-selo">novo</span>
            <h1>Duelo</h1>
            <p>Quiz 1×1 por turnos: jogue na sua vez, quando puder. Gire a roleta, acerte e conquiste as <b>6 medalhas</b> antes do adversário.</p>
            {stats && stats.total > 0 && (
              <div className="v2-duelos-stats">
                <span><b>{stats.vitorias}</b> vitórias</span>
                <span><b>{stats.derrotas}</b> derrotas</span>
                {stats.empates > 0 && <span><b>{stats.empates}</b> empates</span>}
              </div>
            )}
          </div>
          <button className="v2-botao v2-botao-amarelo v2-duelos-novo" onClick={() => { setNovo(true); setErro(""); }}>+ Novo duelo</button>
        </section>

        {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}
        {lista === null && <div className="v2-carregando">Carregando…</div>}
        {lista && lista.length === 0 && (
          <div className="v2-vazio-grande">
            Nenhum duelo ainda.
            <button className="v2-botao v2-botao-amarelo v2-bloco-centro" onClick={() => setNovo(true)}>Começar o primeiro</button>
          </div>
        )}

        {sua.length > 0 && <Grupo titulo="É a sua vez" destaque itens={sua} abrir={abrir} />}
        {esperando.length > 0 && <Grupo titulo="Vez do adversário" itens={esperando} abrir={abrir} />}
        {encerrados.length > 0 && <Grupo titulo="Encerrados" itens={encerrados} abrir={abrir} meuId={usuario.id} />}
      </main>
      <Rodape />
      {novo && <NovoDuelo usuario={usuario} aoFechar={() => setNovo(false)} aoErro={setErro} />}
    </div>
  );
}

function Grupo({ titulo, itens, abrir, destaque, meuId }) {
  return (
    <section className={`v2-duelos-grupo ${destaque ? "destaque" : ""}`}>
      <div className="v2-bloco-titulo">{titulo} <span>{itens.length}</span></div>
      {itens.map((d) => {
        const nome = d.adversario?.nickname || "aguardando alguém aceitar";
        const fim = d.status === "encerrado" || d.status === "recusado";
        const resultado = d.status === "recusado" ? "recusado" : !d.vencedorId ? "empate" : d.vencedorId === meuId ? "vitória" : "derrota";
        return (
          <button key={d.id} className={`v2-duelo-linha ${d.minhaVez ? "sua-vez" : ""} ${fim ? `fim ${resultado === "vitória" ? "venceu" : resultado === "derrota" ? "perdeu" : ""}` : ""}`} onClick={() => abrir(d.id)}>
            {d.adversario ? <Avatar userId={d.adversario.id} nickname={d.adversario.nickname} tamanho={42} /> : <span className="v2-duelo-sem-adv">?</span>}
            <span className="v2-duelo-linha-texto">
              <b>{d.contraBot ? "Robô Duelista" : nome}</b>
              <span>
                {fim ? resultado : d.minhaVez ? tempoRestante(d.prazoEm) : d.status === "aguardando" ? "convite enviado" : "esperando a jogada dele"}
              </span>
            </span>
            <span className="v2-duelo-placar" aria-label={`${d.minhasMedalhas} a ${d.medalhasDele} em medalhas`}>
              <b>{d.minhasMedalhas}</b><i>×</i><b>{d.medalhasDele}</b>
            </span>
            {d.minhaVez && <span className="v2-duelo-jogar">Jogar</span>}
          </button>
        );
      })}
    </section>
  );
}

function NovoDuelo({ usuario, aoFechar, aoErro }) {
  const [amigos, setAmigos] = useState(null);
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    api.get("/friends").then(({ data }) => setAmigos(data?.friends || [])).catch(() => setAmigos([]));
  }, []);

  async function criar(corpo) {
    setCriando(true);
    try {
      const { data } = await api.post("/duelos", corpo);
      irParaPagina("duelo", { id: data.id, ...(corpo.link ? { convite: "1" } : {}) });
    } catch (e) {
      aoErro(e.response?.data?.error || "Não foi possível criar o duelo.");
      aoFechar();
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="v2-modal-fundo" onClick={aoFechar}>
      <div className="v2-modal v2-novo-duelo" role="dialog" aria-label="Novo duelo" onClick={(e) => e.stopPropagation()}>
        <button className="v2-modal-fechar" aria-label="Fechar" onClick={aoFechar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <h3>Novo duelo</h3>
        <p className="v2-modal-citacao">Você joga o primeiro turno agora. O adversário joga quando puder.</p>

        <button className="v2-novo-opcao" disabled={criando} onClick={() => criar({ bot: true })}>
          <span className="v2-novo-icone">🤖</span>
          <span><b>Contra o Robô Duelista</b><small>Começa na hora — bom pra aprender</small></span>
        </button>
        <button className="v2-novo-opcao" disabled={criando} onClick={() => criar({ link: true })}>
          <span className="v2-novo-icone">🔗</span>
          <span><b>Convidar por link</b><small>Manda no WhatsApp — quem abrir, aceita</small></span>
        </button>

        <div className="v2-bloco-titulo">Desafiar um amigo</div>
        {amigos === null && <div className="v2-carregando">Carregando…</div>}
        {amigos?.length === 0 && (
          <p className="v2-modal-citacao">Você ainda não tem amigos adicionados. Use o link de convite — ou adicione alguém em <a className="v2-link" href={linkDaPagina("amigos")} onClick={(e) => { e.preventDefault(); irParaPagina("amigos"); }}>Amigos</a>.</p>
        )}
        <div className="v2-novo-amigos">
          {(amigos || []).map((a) => (
            <button key={a.userId} className="v2-novo-amigo" disabled={criando} onClick={() => criar({ adversarioId: a.userId })}>
              <Avatar userId={a.userId} nickname={a.nickname} tamanho={34} />
              <span>{a.nickname}</span>
              {a.online && <i className="on" aria-label="online" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
