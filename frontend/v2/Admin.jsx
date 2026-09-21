import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";
import { ModalConversa } from "./Amigos.jsx";
import { nomeDoTema } from "./temas.js";
import { GlossarioStop, IndicePerguntas, RespostasRepetidas, PerguntasParecidas, CadastrosPorDia, Paginacao } from "./AdminFerramentas.jsx";

// PAINEL ADMIN da v2 — mesmas abas, rotas e regras do clássico
// (src/pages/Admin.jsx). Moderador vê tudo menos Jogadores e as
// ferramentas de admin; o servidor confere o cargo de novo em cada rota.

const MOTIVOS = { tema_errado: "Não é desse tema", resposta_errada: "Resposta errada", escrita: "Erro de escrita", outro: "Outro problema" };
// Nomes dos temas. Completa com o que vier das salas (/quiz-rooms), então
// tema novo aparece sozinho.
const TEMAS_BASE = {
  esportes: "Esportes", ciencias: "Ciências", historia: "História", cinema: "Cinema", letras: "Letras",
  geral: "Conhecimentos Gerais", musica: "Música", series: "Séries e Streaming", novelas: "Novelas",
  geografia: "Geografia", direito: "Direito", futebol: "Futebol", automobilismo: "Automobilismo",
  anime: "Anime e HQ", terceirao: "Terceirão", games: "Games", mitologia: "Mitologia e Religião",
  mpb: "MPB", rock: "Rock'n Roll",
};

export default function Admin({ usuario }) {
  const podeEntrar = usuario.role === "ADMIN" || usuario.role === "MODERATOR";
  const ehAdmin = usuario.role === "ADMIN";
  const [aba, setAba] = useState(() => { try { return sessionStorage.getItem("v2-admin-aba") || "visao"; } catch { return "visao"; } });
  const [temas, setTemas] = useState(TEMAS_BASE);
  const [conversa, setConversa] = useState(null);
  const [erro, setErro] = useState("");

  const [pendentesStop, setPendentesStop] = useState([]);
  // Ordem dos temas CONGELADA a cada carga do servidor (igual ao clássico):
  // aprovar/rejeitar não reordena os grupos — senão o grupo que encolhe
  // muda de lugar e o próximo clique cai na palavra errada.
  const [ordemTemasStop, setOrdemTemasStop] = useState([]);
  const [pendentesQuiz, setPendentesQuiz] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [plataformas, setPlataformas] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [suspeitos, setSuspeitos] = useState([]);
  const [online, setOnline] = useState(null);
  const [denuncias, setDenuncias] = useState([]);

  const trocarAba = (id) => { setAba(id); try { sessionStorage.setItem("v2-admin-aba", id); } catch {} };
  const falha = (e, padrao) => setErro(e?.response?.data?.error || padrao);

  const carregar = {
    stop: () => api.get("/admin/glossary/pending").then(({ data }) => {
      const lista = data || [];
      const contagem = {};
      for (const p of lista) contagem[p.theme.name] = (contagem[p.theme.name] || 0) + 1;
      setOrdemTemasStop(Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a] || a.localeCompare(b, "pt-BR")));
      setPendentesStop(lista);
    }).catch((e) => falha(e, "Erro ao carregar pendências.")),
    quiz: () => api.get("/admin/quiz-questions/pending").then(({ data }) => setPendentesQuiz(data || [])).catch((e) => falha(e, "Erro ao carregar pendências do quiz.")),
    usuarios: () => { if (!ehAdmin) return; api.get("/admin/users").then(({ data }) => setUsuarios(data || [])).catch(() => {}); api.get("/admin/plataformas").then(({ data }) => setPlataformas(data)).catch(() => {}); },
    feedbacks: () => api.get("/admin/feedback").then(({ data }) => setFeedbacks(data || [])).catch(() => {}),
    suspeitos: () => { if (ehAdmin) api.get("/admin/suspicious-activity").then(({ data }) => setSuspeitos(data || [])).catch(() => {}); },
    online: () => api.get("/admin/online").then(({ data }) => setOnline(data)).catch(() => {}),
    denuncias: () => api.get("/admin/question-reports").then(({ data }) => setDenuncias(data || [])).catch(() => {}),
  };

  useEffect(() => {
    if (!podeEntrar) return;
    Object.values(carregar).forEach((f) => f());
    api.get("/quiz-rooms").then(({ data }) => {
      const extra = {};
      for (const s of data || []) if (s.themeKey && !TEMAS_BASE[s.themeKey]) extra[s.themeKey] = nomeDoTema(s.label);
      if (Object.keys(extra).length) setTemas((t) => ({ ...t, ...extra }));
    }).catch(() => {});
    const t = setInterval(() => { if (!document.hidden) carregar.online(); }, 60000);
    return () => clearInterval(t);
  }, []);

  if (!podeEntrar) {
    return (
      <div className="v2-app v2-com-menu">
        <Topo usuario={usuario} ativo={null} />
        <main className="v2-pagina"><div className="v2-vazio-grande">Acesso restrito a moderadores e administradores.</div></main>
        <Rodape />
      </div>
    );
  }

  const ABAS = [
    { id: "visao", rotulo: "Visão geral", n: feedbacks.length },
    { id: "denuncias", rotulo: "Denúncias", n: denuncias.length },
    { id: "quiz", rotulo: "Quiz", n: pendentesQuiz.length },
    { id: "stop", rotulo: "Stop", n: pendentesStop.length },
    ...(ehAdmin ? [{ id: "jogadores", rotulo: "Jogadores", n: 0 }] : []),
  ];

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo="admin" />
      <main className="v2-pagina v2-admin">
        <div className="v2-pagina-cabeca">
          <h1>Painel Admin</h1>
          {/* Jogo em teste, sem link no site: o atalho mora só aqui. */}
          <a className="v2-botao-pequeno v2-atalho-teste" href="/v2/?pagina=mentira" onClick={(e) => { e.preventDefault(); irParaPagina("mentira"); }}>🎭 Mentira Sincera (teste)</a>
        </div>
        <div className="v2-admin-abas" role="tablist">
          {ABAS.map((a) => (
            <button key={a.id} role="tab" aria-selected={aba === a.id} className={aba === a.id ? "ativa" : ""} onClick={() => trocarAba(a.id)}>
              {a.rotulo}{a.n > 0 && <span className="v2-bolinha-contador">{a.n}</span>}
            </button>
          ))}
        </div>
        {erro && <div className="v2-faixa-aviso erro" onClick={() => setErro("")}>{erro}</div>}

        {aba === "visao" && <VisaoGeral online={online} recarregarOnline={carregar.online} feedbacks={feedbacks} recarregarFeedbacks={carregar.feedbacks} abrirConversa={setConversa} />}
        {aba === "denuncias" && <Denuncias denuncias={denuncias} recarregar={carregar.denuncias} temas={temas} falha={falha} />}
        {aba === "quiz" && (
          <>
            <PendentesQuiz lista={pendentesQuiz} recarregar={carregar.quiz} temas={temas} />
            <IndicePerguntas temas={temas} />
            {ehAdmin && <RespostasRepetidas temas={temas} />}
            {ehAdmin && <PerguntasParecidas />}
            {ehAdmin && <CadastrosPorDia />}
          </>
        )}
        {aba === "stop" && (
          <>
            <PendentesStop lista={pendentesStop} ordem={ordemTemasStop} setLista={setPendentesStop} recarregar={carregar.stop} />
            <GlossarioStop />
            {ehAdmin && <Suspeitos lista={suspeitos} recarregar={carregar.suspeitos} recarregarUsuarios={carregar.usuarios} falha={falha} />}
          </>
        )}
        {aba === "jogadores" && ehAdmin && <Jogadores usuarios={usuarios} plataformas={plataformas} recarregar={carregar.usuarios} recarregarSuspeitos={carregar.suspeitos} abrirConversa={setConversa} falha={falha} />}
      </main>
      <Rodape />
      {conversa && <ModalConversa amigo={conversa} usuario={usuario} aoFechar={() => setConversa(null)} />}
    </div>
  );
}

// Nick que abre o perfil (na v2) em aba nova, pra não perder o painel.
function Nick({ id, nick, visitante }) {
  if (!nick) return <span className="v2-admin-apagado">—</span>;
  if (!id || visitante) return <span>{nick}</span>;
  return <a className="v2-admin-nick" href={linkDaPagina("jogador", { id })} target="_blank" rel="noreferrer">{nick}</a>;
}

function VisaoGeral({ online, recarregarOnline, feedbacks, recarregarFeedbacks, abrirConversa }) {
  const [texto, setTexto] = useState("");
  const [jogo, setJogo] = useState("todos");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState("");

  async function avisar() {
    const t = texto.trim();
    if (!t) return;
    if (!confirm(`Enviar este aviso em ${jogo === "todos" ? "TODOS os jogos" : jogo}?\n\n"${t}"`)) return;
    setEnviando(true); setResultado("");
    try {
      const { data } = await api.post("/admin/broadcast", { mensagem: t, jogo });
      setResultado(data.salas === 0 ? "Nenhuma sala com gente agora — ninguém recebeu." : `Enviado em ${data.salas} sala(s) com jogadores.`);
      setTexto("");
    } catch (e) { setResultado(e.response?.data?.error || "Erro ao enviar o aviso."); }
    finally { setEnviando(false); }
  }

  return (
    <>
      <section className="v2-cartao">
        <h2>Avisar quem está jogando</h2>
        <p className="v2-cartao-nota">Aparece no chat das salas <b>com jogadores</b>, na hora. Serve pra avisar manutenção antes de um deploy — reiniciar o servidor derruba as partidas.</p>
        <textarea className="v2-admin-texto" rows={2} maxLength={300} placeholder="Ex.: manutenção rápida em 5 minutos, a sala vai reiniciar." value={texto} onChange={(e) => setTexto(e.target.value)} />
        <div className="v2-linha-form v2-linha-form-solta">
          <select value={jogo} onChange={(e) => setJogo(e.target.value)}>
            <option value="todos">Todos os jogos</option><option value="stop">Só Stop</option><option value="quiz">Só Quiz</option><option value="acromania">Só Acromania</option>
          </select>
          <button className="v2-botao v2-botao-amarelo" onClick={avisar} disabled={enviando || !texto.trim()}>{enviando ? "Enviando…" : "Enviar aviso"}</button>
          {resultado && <span className="v2-cartao-nota">{resultado}</span>}
        </div>
      </section>

      <section className="v2-cartao">
        <div className="v2-cartao-cabeca">
          <h2>Online agora</h2>
          <button className="v2-botao-pequeno" onClick={recarregarOnline}>Atualizar</button>
        </div>
        {!online ? <div className="v2-carregando">Carregando…</div> : (
          <>
            <div className="v2-admin-numeros">
              <div><b>{online.total}</b><span>no site</span></div>
              <div><b>{online.jogando}</b><span>em partida</span></div>
              <div><b>{online.registrados}</b><span>com conta</span></div>
              <div><b>{online.visitantes}</b><span>visitantes</span></div>
            </div>
            {/* Versão do site: contado das conexões abertas (quem tem uma aba
                de cada conta nos dois). Sem marcação = site antigo em cache. */}
            {(() => {
              const conta = (v) => online.jogadores.filter((p) => (p.versoes || []).includes(v)).length;
              const sem = online.jogadores.filter((p) => !(p.versoes || []).length).length;
              return (
                <div className="v2-admin-versoes">
                  <span><em className="v2-tag-versao v2">v2</em> <b>{conta("v2")}</b></span>
                  <span><em className="v2-tag-versao classico">clássico</em> <b>{conta("classico")}</b></span>
                  {sem > 0 && <span className="v2-admin-apagado" title="Conexões sem a marcação — geralmente o site antigo ainda em cache no navegador">sem identificação: {sem}</span>}
                </div>
              );
            })()}
            {online.jogadores.length === 0 && <div className="v2-vazio">Ninguém online no momento.</div>}
            <div className="v2-admin-online">
              {online.jogadores.map((p) => {
                const porJogo = (p.locais || []).reduce((acc, l) => { (acc[l.jogo] ||= []).push(l.sala); return acc; }, {});
                return (
                  <div key={p.userId} className="v2-admin-online-linha">
                    <span className="v2-admin-online-nick">
                      <Nick id={p.userId} nick={p.nickname} visitante={p.isGuest} />
                      {p.isGuest && <em className="v2-tag-cinza">visitante</em>}
                      {p.plataforma && <em className="v2-tag-cinza" title={p.plataforma === "mobile" ? "Jogando no celular" : "Jogando no computador"}>{p.plataforma === "mobile" ? "celular" : "computador"}</em>}
                      {(p.versoes || []).map((v) => (
                        <em key={v} className={`v2-tag-versao ${v}`} title={v === "v2" ? "Usando a versão nova do site" : "Usando a versão clássica do site"}>{v === "v2" ? "v2" : "clássico"}</em>
                      ))}
                    </span>
                    <span className="v2-admin-online-onde">
                      {p.locais?.length > 0
                        ? Object.entries(porJogo).map(([j, salas]) => (
                            <span key={j} className="v2-admin-jogo"><b>{j}</b>{salas.map((s, i) => <em key={i}>{s}</em>)}</span>
                          ))
                        : <span className="v2-cartao-nota">{p.local}</span>}
                    </span>
                    {!p.isGuest && <button className="v2-botao-pequeno" onClick={() => abrirConversa({ userId: p.userId, nickname: p.nickname, online: true })}>Mensagem</button>}
                  </div>
                );
              })}
            </div>
            {online.ocultos > 0 && <p className="v2-cartao-nota">Mostrando os {online.jogadores.length} primeiros · mais {online.ocultos} online</p>}
            <p className="v2-cartao-nota">Atualiza sozinho a cada minuto.</p>
          </>
        )}
      </section>

      <section className="v2-cartao">
        <h2>Feedback dos jogadores ({feedbacks.length})</h2>
        {feedbacks.length === 0 && <div className="v2-vazio">Nenhum feedback enviado ainda.</div>}
        <div className="v2-admin-feedbacks">
          {feedbacks.map((f) => (
            <div key={f.id} className="v2-admin-feedback">
              <span className={`v2-tipo-feedback ${f.type}`}>{f.type === "bug" ? "Bug" : f.type === "ideia" ? "Ideia" : "Outro"}</span>
              <div className="v2-admin-feedback-texto">
                <p>{f.message}</p>
                <small><Nick id={f.user?.id} nick={f.user?.nickname} /> {f.user?.email && `(${f.user.email})`} · {new Date(f.createdAt).toLocaleDateString("pt-BR")}</small>
              </div>
              <button className="v2-botao-pequeno perigo" aria-label="Apagar feedback" onClick={async () => { await api.delete(`/admin/feedback/${f.id}`); recarregarFeedbacks(); }}>×</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Denuncias({ denuncias, recarregar, temas, falha }) {
  const [editando, setEditando] = useState(null);
  const [rascunho, setRascunho] = useState({});
  const [aviso, setAviso] = useState("");

  async function resolver(id) {
    try { await api.post(`/admin/question-reports/${id}/resolve`); recarregar(); }
    catch (e) { falha(e, "Erro ao marcar como resolvido."); }
  }
  async function salvar(id) {
    if (!rascunho.question.trim() || !rascunho.answer.trim()) { alert("Pergunta e resposta não podem ficar vazias."); return; }
    try {
      await api.patch(`/admin/quiz-questions/${id}`, { question: rascunho.question.trim(), answer: rascunho.answer.trim(), themeKey: rascunho.themeKey, difficulty: rascunho.difficulty });
      await api.post(`/admin/question-reports/${id}/resolve`);
      setEditando(null); await recarregar();
      setAviso("Pergunta corrigida e denúncia resolvida."); setTimeout(() => setAviso(""), 4000);
    } catch (e) { alert(e.response?.data?.error || "Erro ao salvar."); }
  }
  async function apagar(id, texto) {
    if (!confirm(`Apagar esta pergunta de vez?\n\n"${texto}"\n\nIsso não pode ser desfeito.`)) return;
    try { await api.delete(`/admin/quiz-questions/${id}`); await api.post(`/admin/question-reports/${id}/resolve`).catch(() => {}); setEditando(null); recarregar(); }
    catch (e) { alert(e.response?.data?.error || "Erro ao apagar."); }
  }

  return (
    <section className="v2-cartao">
      <h2>Perguntas reportadas ({denuncias.length})</h2>
      <p className="v2-cartao-nota">A com mais denúncias aparece primeiro. Dá pra corrigir, trocar de tema ou apagar aqui mesmo — corrigir já marca como resolvida.</p>
      {aviso && <div className="v2-faixa-aviso ok">{aviso}</div>}
      {denuncias.length === 0 && <div className="v2-vazio">Nenhuma pergunta reportada no momento.</div>}
      {denuncias.map((g) => (
        <div key={g.questionId} className="v2-denuncia">
          <div className="v2-denuncia-topo">
            <div>
              <b>{g.question.question}</b>
              <small>Resposta: <b>{g.question.answer}</b> · Tema: {temas[g.question.themeKey] || g.question.themeKey} · <em>{g.count} denúncia(s)</em></small>
            </div>
            {/* Com a edição aberta os botões somem (evita "Resolvida" jogar
                a correção fora sem aviso — mesma regra do clássico). */}
            {editando !== g.questionId && (
              <div className="v2-admin-acoes">
                <button className="v2-botao-pequeno" onClick={() => { setEditando(g.questionId); setRascunho({ question: g.question.question, answer: g.question.answer, themeKey: g.question.themeKey || "", difficulty: g.question.difficulty || "medio" }); }}>Corrigir</button>
                <button className="v2-botao-pequeno ok" onClick={() => resolver(g.questionId)}>Resolvida</button>
                <button className="v2-botao-pequeno perigo" onClick={() => apagar(g.questionId, g.question.question)}>Apagar</button>
              </div>
            )}
          </div>
          {editando === g.questionId && (
            <div className="v2-denuncia-edicao">
              <p className="v2-cartao-nota">Editando — as mudanças só valem ao clicar em <b>Salvar e resolver</b>.</p>
              <label className="v2-admin-campo">Pergunta<textarea rows={2} value={rascunho.question} onChange={(e) => setRascunho({ ...rascunho, question: e.target.value })} /></label>
              <label className="v2-admin-campo">Resposta<input value={rascunho.answer} onChange={(e) => setRascunho({ ...rascunho, answer: e.target.value })} /></label>
              <div className="v2-linha-form v2-linha-form-solta">
                <label className="v2-admin-campo">Tema<select value={rascunho.themeKey} onChange={(e) => setRascunho({ ...rascunho, themeKey: e.target.value })}>{Object.entries(temas).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
                <label className="v2-admin-campo">Dificuldade<select value={rascunho.difficulty} onChange={(e) => setRascunho({ ...rascunho, difficulty: e.target.value })}><option value="facil">Fácil (sala Padrão)</option><option value="medio">Médio (sala Padrão)</option><option value="dificil">Difícil (sala Avançada)</option></select></label>
              </div>
              <div className="v2-admin-acoes"><button className="v2-botao v2-botao-amarelo" onClick={() => salvar(g.questionId)}>Salvar e resolver</button><button className="v2-botao v2-botao-contorno" onClick={() => setEditando(null)}>Cancelar</button></div>
            </div>
          )}
          <ul className="v2-denuncia-lista">
            {g.reports.map((r) => (
              <li key={r.id}><b><Nick id={r.userId} nick={r.nickname} /></b>: {MOTIVOS[r.reason] || r.reason}{r.comment && <span className="v2-admin-apagado"> — "{r.comment}"</span>}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function PendentesQuiz({ lista, recarregar, temas }) {
  const [editando, setEditando] = useState(null);
  const [rascunho, setRascunho] = useState({ question: "", answer: "" });
  async function aprovar(id) {
    try { const { data } = await api.post(`/admin/quiz-questions/${id}/approve`); if (data?.aviso) alert(data.aviso); }
    catch (e) { alert(e.response?.data?.error || "Erro ao aprovar."); }
    recarregar();
  }
  async function salvar(id, aprovarDepois) {
    if (!rascunho.question.trim() || !rascunho.answer.trim()) { alert("Pergunta e resposta não podem ficar vazias."); return; }
    try {
      await api.patch(`/admin/quiz-questions/${id}`, { question: rascunho.question.trim(), answer: rascunho.answer.trim() });
      if (aprovarDepois) await api.post(`/admin/quiz-questions/${id}/approve`);
      setEditando(null); recarregar();
    } catch (e) { alert(e.response?.data?.error || "Erro ao salvar."); }
  }
  return (
    <section className="v2-cartao">
      <h2>Perguntas pendentes de aprovação ({lista.length})</h2>
      <div className="v2-tabela-rolagem"><table className="v2-tabela-admin">
        <thead><tr><th>Tema</th><th>Pergunta</th><th>Resposta</th><th>Origem / motivo</th><th>Ações</th></tr></thead>
        <tbody>
          {lista.map((q) => {
            const ed = editando === q.id;
            return (
              <tr key={q.id} className={ed ? "editando" : ""}>
                <td>{temas[q.themeKey] || q.themeKey}</td>
                <td>{ed ? <textarea rows={2} autoFocus value={rascunho.question} onChange={(e) => setRascunho((r) => ({ ...r, question: e.target.value }))} /> : q.question}</td>
                <td>{ed ? <input value={rascunho.answer} onChange={(e) => setRascunho((r) => ({ ...r, answer: e.target.value }))} /> : <b>{q.answer}</b>}</td>
                <td>{q.validationNote ? <span className="v2-admin-robo">Robô: {q.validationNote}</span> : <Nick id={q.suggestedBy?.id} nick={q.suggestedBy?.nickname} />}</td>
                <td className="v2-admin-acoes">
                  {ed ? (
                    <><button className="v2-botao-pequeno ok" onClick={() => salvar(q.id, true)}>Salvar e aprovar</button><button className="v2-botao-pequeno" onClick={() => salvar(q.id, false)}>Só salvar</button><button className="v2-botao-pequeno" onClick={() => setEditando(null)}>Cancelar</button></>
                  ) : (
                    <><button className="v2-botao-pequeno ok" onClick={() => aprovar(q.id)}>Aprovar</button><button className="v2-botao-pequeno" onClick={() => { setEditando(q.id); setRascunho({ question: q.question, answer: q.answer }); }}>Editar</button><button className="v2-botao-pequeno perigo" onClick={async () => { await api.post(`/admin/quiz-questions/${q.id}/reject`); recarregar(); }}>Rejeitar</button></>
                  )}
                </td>
              </tr>
            );
          })}
          {lista.length === 0 && <tr><td colSpan={5} className="v2-admin-apagado">Nenhuma pendência.</td></tr>}
        </tbody>
      </table></div>
    </section>
  );
}

function PendentesStop({ lista, ordem = [], setLista, recarregar }) {
  // Agrupado por tema (mais pendências primeiro), letra e palavra dentro —
  // julgar dez frutas seguidas é mais rápido que pular de tema a cada linha.
  const grupos = useMemo(() => {
    const por = {};
    for (const p of lista) (por[p.theme.name] ||= []).push(p);
    const temas = [...ordem.filter((t) => por[t]), ...Object.keys(por).filter((t) => !ordem.includes(t))];
    return temas.map((tema) => [tema, [...por[tema]].sort((a, b) => a.letter.localeCompare(b.letter) || a.word.localeCompare(b.word, "pt-BR"))]);
  }, [lista, ordem]);
  const acao = async (id, tipo) => {
    setLista((l) => l.filter((p) => p.id !== id)); // sai da lista na hora
    try { await api.post(`/admin/glossary/${id}/${tipo}`); } catch { recarregar(); }
  };
  return (
    <section className="v2-cartao">
      <h2>Palavras pendentes de aprovação ({lista.length})</h2>
      {lista.length === 0 && <div className="v2-vazio">Nenhuma pendência.</div>}
      {grupos.map(([tema, itens]) => (
        <div key={tema} className="v2-pendentes-grupo">
          <div className="v2-bloco-titulo">{tema} <span>{itens.length}</span></div>
          {itens.map((p) => (
            <div key={p.id} className="v2-pendente">
              <span className="v2-pendente-letra">{p.letter}</span>
              <b className="v2-pendente-palavra">{p.word}</b>
              <span className="v2-cartao-nota">por <Nick id={p.suggestedBy?.id} nick={p.suggestedBy?.nickname} /></span>
              <button className="v2-botao-pequeno ok" onClick={() => acao(p.id, "approve")}>Aprovar</button>
              <button className="v2-botao-pequeno perigo" onClick={() => acao(p.id, "reject")}>Rejeitar</button>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

function Suspeitos({ lista, recarregar, recarregarUsuarios, falha }) {
  async function banir(u) {
    if (!confirm(`Tem certeza que quer ${u.banned ? "desbanir" : "banir"} "${u.nickname}"?`)) return;
    try { await api.post(`/admin/users/${u.id}/ban`, { banned: !u.banned }); recarregar(); recarregarUsuarios(); }
    catch (e) { falha(e, "Erro ao alterar banimento."); }
  }
  async function ignorar(u) {
    if (!confirm(`Descartar os alertas de atividade suspeita de "${u.nickname}"?\n\nOs registros serão apagados e a pessoa some desta lista. A conta dela NÃO é afetada.`)) return;
    try { await api.delete(`/admin/suspicious-activity/${u.id}`); recarregar(); }
    catch (e) { falha(e, "Erro ao descartar os alertas."); }
  }
  return (
    <section className="v2-cartao">
      <h2>Atividade suspeita (Stop)</h2>
      <p className="v2-cartao-nota">Sinais de possível uso de ferramentas externas (colar resposta, ou acertar tudo sem nenhuma correção com tempo sobrando). <b>Nada aqui é bloqueado automaticamente</b> — é só pra revisar e decidir.</p>
      <div className="v2-tabela-rolagem"><table className="v2-tabela-admin">
        <thead><tr><th>Jogador</th><th>Colou texto</th><th>"Bom demais"</th><th>Total</th><th>Última vez</th><th>Ações</th></tr></thead>
        <tbody>
          {lista.map((g) => (
            <tr key={g.user.id}>
              <td><Nick id={g.user.id} nick={g.user.nickname} /> {g.user.banned && <em className="v2-tag-perigo">banido</em>}</td>
              <td>{g.pasteCount}</td><td>{g.tooPerfectCount}</td><td><b>{g.count}</b></td>
              <td className="v2-admin-apagado">{new Date(g.latest).toLocaleString("pt-BR")}</td>
              <td className="v2-admin-acoes"><button className="v2-botao-pequeno perigo" onClick={() => banir(g.user)}>{g.user.banned ? "Desbanir" : "Banir"}</button><button className="v2-botao-pequeno" onClick={() => ignorar(g.user)}>Ignorar</button></td>
            </tr>
          ))}
          {lista.length === 0 && <tr><td colSpan={6} className="v2-admin-apagado">Nenhum sinal registrado ainda.</td></tr>}
        </tbody>
      </table></div>
    </section>
  );
}

function Jogadores({ usuarios, plataformas, recarregar, recarregarSuspeitos, abrirConversa, falha }) {
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const filtrados = busca.trim()
    ? usuarios.filter((u) => `${u.nickname} ${u.email || ""}`.toLowerCase().includes(busca.trim().toLowerCase()))
    : usuarios;
  const totalPag = Math.max(1, Math.ceil(filtrados.length / 20));
  const itens = filtrados.slice((pagina - 1) * 20, pagina * 20);

  async function banir(u) {
    if (!confirm(`Tem certeza que quer ${u.banned ? "desbanir" : "banir"} "${u.nickname}"?`)) return;
    try { await api.post(`/admin/users/${u.id}/ban`, { banned: !u.banned }); recarregar(); recarregarSuspeitos(); }
    catch (e) { falha(e, "Erro ao alterar banimento."); }
  }
  async function apagar(u) {
    const t = prompt(`Isso vai apagar PERMANENTEMENTE a conta "${u.nickname}" e todo o histórico dela (pontos, mensagens, sugestões). Não tem como desfazer.\n\nDigite o nickname "${u.nickname}" pra confirmar:`);
    if (t !== u.nickname) { if (t !== null) alert("Nickname não confere — nada foi apagado."); return; }
    try { await api.delete(`/admin/users/${u.id}`); recarregar(); }
    catch (e) { falha(e, "Erro ao apagar usuário."); }
  }

  return (
    <section className="v2-cartao">
      <h2>Usuários ({usuarios.length})</h2>
      {plataformas && (
        <div className="v2-admin-numeros">
          <div><b>{plataformas.total.mobile}</b><span>celular{plataformas.ultimos30.mobile > 0 ? ` · ${plataformas.ultimos30.mobile} nos últimos 30 dias` : ""}</span></div>
          <div><b>{plataformas.total.desktop}</b><span>computador{plataformas.ultimos30.desktop > 0 ? ` · ${plataformas.ultimos30.desktop} nos últimos 30 dias` : ""}</span></div>
          <div className="apagado"><b>{plataformas.total.desconhecido}</b><span>sem registro · nunca entraram num jogo</span></div>
        </div>
      )}
      <input className="v2-campo" value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Filtrar por nick ou e-mail…" aria-label="Filtrar usuários" />
      <div className="v2-tabela-rolagem"><table className="v2-tabela-admin">
        <thead><tr><th>Nickname</th><th>E-mail</th><th>Cadastro</th><th>Onde joga</th><th>Cargo</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>
          {itens.map((u) => (
            <tr key={u.id}>
              <td><Nick id={u.id} nick={u.nickname} visitante={u.isGuest} /></td>
              <td className="v2-admin-email">{u.email}</td>
              <td>{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
              <td title={u.ultimoAcesso ? `Último acesso: ${new Date(u.ultimoAcesso).toLocaleString("pt-BR")}` : "Nunca conectou pelo jogo"}>{u.ultimaPlataforma === "mobile" ? "Celular" : u.ultimaPlataforma === "desktop" ? "Computador" : <span className="v2-admin-apagado">—</span>}</td>
              <td>
                <select value={u.role} aria-label={`Cargo de ${u.nickname}`} onChange={async (e) => { await api.post(`/admin/users/${u.id}/role`, { role: e.target.value }); recarregar(); }}>
                  <option value="PLAYER">PLAYER</option><option value="MODERATOR">MODERATOR</option><option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td>{u.banned ? <em className="v2-tag-perigo">banido</em> : <em className="v2-tag-ok">ativo</em>}</td>
              <td className="v2-admin-acoes">
                <button className="v2-botao-pequeno" onClick={() => abrirConversa({ userId: u.id, nickname: u.nickname })}>Mensagem</button>
                {u.role !== "ADMIN" && (<><button className="v2-botao-pequeno perigo" onClick={() => banir(u)}>{u.banned ? "Desbanir" : "Banir"}</button><button className="v2-botao-pequeno perigo" aria-label="Apagar permanentemente" onClick={() => apagar(u)}>×</button></>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <Paginacao pagina={pagina} total={totalPag} aoMudar={setPagina} />
    </section>
  );
}
