import { useEffect, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Avatar from "./Avatar.jsx";

const irCla = (e, id) => { e.preventDefault(); irParaPagina("cla", { id }); };
const irJogador = (e, id) => { e.preventDefault(); irParaPagina("jogador", { id }); };

export default function Clas({ usuario }) {
  const [meu, setMeu] = useState(null);
  const [convites, setConvites] = useState([]);
  const [todos, setTodos] = useState([]);
  const [minhasSolicitacoes, setMinhasSolicitacoes] = useState([]);
  const [recebidas, setRecebidas] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [nome, setNome] = useState("");
  const [tag, setTag] = useState("");

  async function carregar() {
    try {
      const [m, i, t, sm, sr] = await Promise.all([
        api.get("/clans/mine"),
        api.get("/clans/invites/mine"),
        api.get("/clans/todos"),
        api.get("/clans/solicitacoes/minhas").catch(() => ({ data: [] })),
        api.get("/clans/solicitacoes/recebidas").catch(() => ({ data: [] })),
      ]);
      setMeu(m.data); setConvites(i.data || []); setTodos(t.data || []);
      setMinhasSolicitacoes(sm.data || []); setRecebidas(sr.data || []);
    } catch {
      setMeu((x) => x || { clan: null });
    }
  }
  useEffect(() => { carregar(); }, []);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  const acao = async (fn, ok) => {
    try { await fn(); if (ok) setAviso({ ok: true, texto: ok }); carregar(); }
    catch (err) { setAviso({ ok: false, texto: err.response?.data?.error || "Não foi possível fazer isso agora." }); }
  };

  const cla = meu?.clan;

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo="clas" />
      <main className="v2-pagina">
        <div className="v2-pagina-cabeca"><h1>Clãs</h1></div>
        <p className="v2-pagina-nota">Junte a galera num clã: os pontos do mês de todos os membros somam no ranking de clãs.</p>
        {aviso && <div className={`v2-faixa-aviso ${aviso.ok ? "ok" : "erro"}`} role="status">{aviso.texto}</div>}
        {!meu && <div className="v2-carregando">Carregando…</div>}

        {convites.length > 0 && (
          <section className="v2-cartao">
            <h2>Convites pra você</h2>
            {convites.map((c) => (
              <div key={c.id} className="v2-pedido">
                <b>[{c.clan.tag}] {c.clan.name}</b>
                <span className="v2-cartao-nota">te convidou</span>
                <button className="v2-botao-pequeno ok" onClick={() => acao(() => api.post(`/clans/invites/${c.id}/accept`), "Bem-vindo ao clã!")}>Aceitar</button>
                <button className="v2-botao-pequeno" onClick={() => acao(() => api.post(`/clans/invites/${c.id}/decline`))}>Recusar</button>
              </div>
            ))}
          </section>
        )}

        {cla && (
          <section className="v2-cartao v2-meu-cla">
            <div className="v2-cartao-cabeca">
              <div>
                <h2>[{cla.tag}] {cla.name}</h2>
                <p>{cla.members.length}/{cla.maxMembers} membros{cla.isOwner ? " · você é o dono" : ""}</p>
              </div>
              <a className="v2-botao-pequeno" href={linkDaPagina("cla", { id: cla.id })} onClick={(e) => irCla(e, cla.id)}>Ver perfil do clã</a>
            </div>
            <div className="v2-membros">
              {cla.members.map((m) => (
                <div key={m.id} className="v2-membro">
                  <Avatar userId={m.id} nickname={m.nickname} tamanho={36} />
                  <a href={linkDaPagina("jogador", { id: m.id })} onClick={(e) => irJogador(e, m.id)}>{m.nickname}</a>
                  <span className={`v2-membro-papel ${m.id === cla.ownerId ? "dono" : ""}`}>{m.id === cla.ownerId ? "Dono" : "Membro"}</span>
                  {cla.isOwner && m.id !== cla.ownerId && (
                    <button className="v2-botao-pequeno" onClick={() => confirm(`Remover ${m.nickname} do clã?`) && acao(() => api.delete(`/clans/members/${m.id}`), `${m.nickname} saiu do clã.`)}>Remover</button>
                  )}
                </div>
              ))}
            </div>
            {cla.isOwner && recebidas.length > 0 && (
              <div className="v2-pedidos">
                <div className="v2-bloco-titulo">Pedidos pra entrar <span>{recebidas.length}</span></div>
                {recebidas.map((p) => (
                  <div key={p.id} className="v2-pedido">
                    <Avatar userId={p.user.id} nickname={p.user.nickname} tamanho={30} />
                    <a href={linkDaPagina("jogador", { id: p.user.id })} onClick={(e) => irJogador(e, p.user.id)}>{p.user.nickname}</a>
                    <button className="v2-botao-pequeno ok" onClick={() => acao(() => api.post(`/clans/solicitacoes/${p.id}/aceitar`), `${p.user.nickname} entrou no clã!`)}>Aceitar</button>
                    <button className="v2-botao-pequeno" onClick={() => acao(() => api.post(`/clans/solicitacoes/${p.id}/recusar`))}>Recusar</button>
                  </div>
                ))}
              </div>
            )}
            {cla.isOwner && (
              <div className="v2-pedidos">
                <div className="v2-bloco-titulo">Convites enviados</div>
                {cla.pendingInvites.length === 0
                  ? <div className="v2-vazio">Nenhum convite pendente. Convide pelo hover do nick de alguém numa sala ou pelo perfil.</div>
                  : cla.pendingInvites.map((i) => <div key={i.id} className="v2-cartao-nota">{i.invited.nickname} — aguardando resposta</div>)}
              </div>
            )}
            {!cla.isOwner && (
              <button className="v2-botao v2-botao-contorno v2-sair-cla" onClick={() => confirm("Sair do clã?") && acao(() => api.delete(`/clans/members/${usuario.id}`), "Você saiu do clã.")}>Sair do clã</button>
            )}
          </section>
        )}

        {meu && !cla && (
          <section className="v2-cartao">
            <h2>Criar um clã</h2>
            {meu.canCreate ? (
              <form className="v2-form-cla" onSubmit={(e) => { e.preventDefault(); acao(() => api.post("/clans", { name: nome, tag }), "Clã criado!"); }}>
                <label>Nome do clã<input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={30} required /></label>
                <label>Tag (curta)<input value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} maxLength={5} required /></label>
                <button className="v2-botao v2-botao-amarelo" type="submit">Criar clã</button>
              </form>
            ) : (
              <p className="v2-cartao-nota">Pra criar um clã você precisa de {Number(meu.requiredPoints || 0).toLocaleString("pt-BR")} pontos vitalícios — você tem {Number(meu.myPoints || 0).toLocaleString("pt-BR")}. Enquanto isso, dá pra pedir pra entrar num clã abaixo.</p>
            )}
          </section>
        )}

        <section className="v2-cartao">
          <h2>Todos os clãs</h2>
          <p className="v2-cartao-nota">Ordenados pelos pontos do mês somados dos membros.</p>
          {todos.length === 0 && meu && <div className="v2-vazio">Nenhum clã criado ainda.</div>}
          <div className="v2-diretorio">
            {todos.map((c, i) => {
              const pedi = minhasSolicitacoes.includes(c.id);
              return (
                <div key={c.id} className="v2-cla-card">
                  <span className="v2-linha-pos">{i + 1}</span>
                  <div className="v2-cla-card-texto">
                    <a href={linkDaPagina("cla", { id: c.id })} onClick={(e) => irCla(e, c.id)}><b>[{c.tag}] {c.name}</b></a>
                    <span>{c.memberCount} membros · dono {c.owner?.nickname}</span>
                  </div>
                  <div className="v2-cla-card-rostos">
                    {c.members.slice(0, 4).map((m) => <Avatar key={m.id} userId={m.id} nickname={m.nickname} tamanho={26} />)}
                  </div>
                  <b className="v2-linha-pts">{c.monthlyPoints.toLocaleString("pt-BR")}</b>
                  {!cla && (pedi
                    ? <span className="v2-cartao-nota">pedido enviado</span>
                    : <button className="v2-botao-pequeno" onClick={() => acao(() => api.post(`/clans/${c.id}/solicitar`), `Pedido enviado pro [${c.tag}]!`)}>Pedir pra entrar</button>)}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
