import { Fragment, useEffect, useRef, useState } from "react";
import { api } from "./api.js";

// Ferramentas de conteúdo do painel admin — mesmas rotas e mesmo
// comportamento dos componentes do clássico (src/components/Admin*.jsx).

export function Paginacao({ pagina, total, aoMudar }) {
  if (total <= 1) return null;
  return (
    <div className="v2-paginacao">
      <button className="v2-botao-pequeno" disabled={pagina <= 1} onClick={() => aoMudar(pagina - 1)}>← anterior</button>
      <span>página {pagina} de {total}</span>
      <button className="v2-botao-pequeno" disabled={pagina >= total} onClick={() => aoMudar(pagina + 1)}>próxima →</button>
    </div>
  );
}

// ---------- Stop: índice de palavras por tema ----------
const LETRAS = "ABCDEFGHIJLMNOPQRSTUVXZ".split("");
export function GlossarioStop() {
  const [temas, setTemas] = useState([]);
  const [tema, setTema] = useState("");
  const [palavras, setPalavras] = useState([]);
  const [rascunhos, setRascunhos] = useState({});
  const [salvando, setSalvando] = useState(null);
  const [erro, setErro] = useState("");
  const refs = useRef({});

  useEffect(() => {
    api.get("/glossary/themes").then(({ data }) => { setTemas(data || []); if (data?.length) setTema(data[0].key); }).catch(() => {});
  }, []);
  const carregar = () => api.get("/admin/glossary/words", { params: { themeKey: tema } }).then(({ data }) => setPalavras(data || [])).catch(() => {});
  useEffect(() => { if (tema) carregar(); }, [tema]);

  async function salvar(letra, idx) {
    const word = (rascunhos[letra] || "").trim();
    if (!word) return;
    setSalvando(letra); setErro("");
    try {
      await api.post("/admin/glossary/words", { themeKey: tema, letter: letra, word });
      setRascunhos((d) => ({ ...d, [letra]: "" }));
      await carregar();
      refs.current[LETRAS[idx + 1]]?.focus();
    } catch (e) { setErro(e.response?.data?.error || "Erro ao salvar palavra."); }
    finally { setSalvando(null); }
  }
  const porLetra = {};
  for (const w of palavras) (porLetra[w.letter] ||= []).push(w);

  return (
    <details className="v2-cartao v2-recolhivel">
      <summary>Índice de palavras e temas (Stop)</summary>
      {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
      <label className="v2-admin-campo">Tema
        <select value={tema} onChange={(e) => setTema(e.target.value)}>{temas.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}</select>
      </label>
      <p className="v2-cartao-nota">Digite uma palavra e aperte <b>Enter</b>: ela entra já aprovada e o cursor pula pra próxima letra.</p>
      <div className="v2-glossario-grade">
        {LETRAS.map((l, i) => (
          <label key={l} className="v2-glossario-celula">
            <b>{l}</b>
            <input ref={(el) => (refs.current[l] = el)} value={rascunhos[l] || ""} disabled={salvando === l} placeholder={`Palavra com ${l}…`}
              onChange={(e) => setRascunhos((d) => ({ ...d, [l]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); salvar(l, i); } }} />
          </label>
        ))}
      </div>
      <div className="v2-bloco-titulo">Palavras cadastradas neste tema</div>
      {palavras.length === 0 && <div className="v2-vazio">Nenhuma palavra cadastrada ainda neste tema.</div>}
      <div className="v2-glossario-palavras">
        {LETRAS.filter((l) => porLetra[l]?.length).map((l) => (
          <div key={l} className="v2-glossario-grupo">
            <b>{l}</b>
            {porLetra[l].map((w) => (
              <span key={w.id} className={`v2-etiqueta-palavra ${w.status !== "approved" ? "apagada" : ""}`}>
                {w.word}{w.status !== "approved" && ` (${w.status === "pending" ? "pendente" : "rejeitada"})`}
                <button aria-label={`Remover ${w.word}`} onClick={async () => { await api.delete(`/admin/glossary/words/${w.id}`); carregar(); }}>×</button>
              </span>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}

// ---------- Quiz: índice de perguntas ----------
const DIF = { facil: "Fácil", medio: "Médio", dificil: "Difícil" };
const NIVEIS = { facil: "Fáceis", medio: "Médias", dificil: "Difíceis" };
const STATUS = { approved: "Aprovada", pending: "Pendente", rejected: "Rejeitada" };
export function IndicePerguntas({ temas }) {
  const chaves = Object.keys(temas);
  const [tema, setTema] = useState(chaves[0] || "");
  const [perguntas, setPerguntas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [nivel, setNivel] = useState("todos");
  const [nova, setNova] = useState({ question: "", answer: "", difficulty: "medio" });
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState(null);
  const [editando, setEditando] = useState(null);

  useEffect(() => { if (!tema && chaves[0]) setTema(chaves[0]); }, [chaves.join()]);
  const carregar = () => tema && api.get("/admin/quiz-questions", { params: { themeKey: tema } }).then(({ data }) => setPerguntas(data || [])).catch(() => {});
  useEffect(() => { carregar(); setPagina(1); }, [tema]);

  async function buscar(e) {
    e?.preventDefault();
    if (!busca.trim()) { setResultados(null); return; }
    try { const { data } = await api.get("/admin/quiz-questions/search", { params: { q: busca.trim() } }); setResultados(data || []); }
    catch { setErro("Erro ao buscar perguntas."); }
  }
  async function adicionar(e) {
    e.preventDefault();
    if (!nova.question.trim() || !nova.answer.trim()) return;
    try { await api.post("/admin/quiz-questions", { themeKey: tema, ...nova }); setNova((n) => ({ ...n, question: "", answer: "" })); carregar(); }
    catch (err) { setErro(err.response?.data?.error || "Erro ao salvar pergunta."); }
  }
  async function apagar(id) {
    if (!confirm("Apagar essa pergunta de vez?")) return;
    await api.delete(`/admin/quiz-questions/${id}`);
    carregar(); if (resultados) buscar();
  }
  async function salvar() {
    if (!editando.question.trim() || !editando.answer.trim()) return;
    try {
      await api.patch(`/admin/quiz-questions/${editando.id}`, { question: editando.question, answer: editando.answer, difficulty: editando.difficulty });
      setEditando(null); carregar(); if (resultados) buscar();
    } catch (err) { setErro(err.response?.data?.error || "Erro ao salvar edição."); }
  }

  const linha = (q, comTema) => editando?.id === q.id ? (
    <tr key={q.id} className="editando">
      {comTema && <td>{temas[q.themeKey] || q.themeKey}</td>}
      <td><textarea rows={2} maxLength={300} value={editando.question} onChange={(e) => setEditando({ ...editando, question: e.target.value })} /></td>
      <td><input maxLength={60} value={editando.answer} onChange={(e) => setEditando({ ...editando, answer: e.target.value })} /></td>
      <td><select value={editando.difficulty} onChange={(e) => setEditando({ ...editando, difficulty: e.target.value })}>{Object.entries(DIF).map(([k, r]) => <option key={k} value={k}>{r}</option>)}</select></td>
      {!comTema && <td />}
      <td className="v2-admin-acoes"><button className="v2-botao-pequeno ok" onClick={salvar}>Salvar</button><button className="v2-botao-pequeno" onClick={() => setEditando(null)}>Cancelar</button></td>
    </tr>
  ) : (
    <tr key={q.id}>
      {comTema && <td>{temas[q.themeKey] || q.themeKey}</td>}
      <td>{q.question}</td>
      <td><b>{q.answer}</b></td>
      <td><span className={`v2-dif ${q.difficulty}`}>{DIF[q.difficulty] || q.difficulty}</span></td>
      {!comTema && <td className={q.status !== "approved" ? "v2-admin-apagado" : ""}>{STATUS[q.status] || q.status}</td>}
      <td className="v2-admin-acoes"><button className="v2-botao-pequeno" onClick={() => setEditando({ id: q.id, question: q.question, answer: q.answer, difficulty: q.difficulty || "medio" })}>Editar</button><button className="v2-botao-pequeno perigo" onClick={() => apagar(q.id)} aria-label="Apagar">×</button></td>
    </tr>
  );

  const visiveis = nivel === "todos" ? perguntas : perguntas.filter((q) => q.difficulty === nivel);
  const totalPag = Math.max(1, Math.ceil(visiveis.length / 20));
  const itens = visiveis.slice((pagina - 1) * 20, pagina * 20);
  const conta = (d) => perguntas.filter((q) => q.difficulty === d).length;

  return (
    <details className="v2-cartao v2-recolhivel">
      <summary>Índice de perguntas do Quiz</summary>
      {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
      <form className="v2-linha-form" onSubmit={buscar}>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar em todos os temas: parte da pergunta ou resposta…" />
        <button className="v2-botao v2-botao-amarelo" type="submit">Buscar</button>
      </form>
      {resultados !== null && (
        <div className="v2-tabela-rolagem"><table className="v2-tabela-admin">
          <thead><tr><th>Tema</th><th>Pergunta</th><th>Resposta</th><th>Dificuldade</th><th>Ações</th></tr></thead>
          <tbody>{resultados.map((q) => linha(q, true))}{resultados.length === 0 && <tr><td colSpan={5} className="v2-admin-apagado">Nenhuma pergunta encontrada com esse termo.</td></tr>}</tbody>
        </table></div>
      )}
      <hr className="v2-admin-divisor" />
      <label className="v2-admin-campo">Tema
        <select value={tema} onChange={(e) => setTema(e.target.value)}>{Object.entries(temas).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
      </label>
      <form className="v2-admin-nova" onSubmit={adicionar}>
        <textarea rows={2} maxLength={300} placeholder="Nova pergunta…" value={nova.question} onChange={(e) => setNova({ ...nova, question: e.target.value })} />
        <div className="v2-linha-form">
          <input maxLength={60} placeholder="Resposta certa" value={nova.answer} onChange={(e) => setNova({ ...nova, answer: e.target.value })} />
          <select value={nova.difficulty} onChange={(e) => setNova({ ...nova, difficulty: e.target.value })}>{Object.entries(DIF).map(([k, r]) => <option key={k} value={k}>{r}</option>)}</select>
          <button className="v2-botao v2-botao-amarelo" type="submit">Adicionar (já aprovada)</button>
        </div>
      </form>
      <div className="v2-bloco-titulo">Perguntas neste tema <span>{perguntas.length}</span></div>
      <div className="v2-admin-filtros">
        {[["todos", `Todas (${perguntas.length})`], ["facil", `Fáceis (${conta("facil")})`], ["medio", `Médias (${conta("medio")})`], ["dificil", `Difíceis (${conta("dificil")})`]].map(([k, r]) => (
          <button key={k} className={nivel === k ? "ativo" : ""} onClick={() => { setNivel(k); setPagina(1); }}>{r}</button>
        ))}
      </div>
      <div className="v2-tabela-rolagem"><table className="v2-tabela-admin">
        <thead><tr><th>Pergunta</th><th>Resposta</th><th>Dificuldade</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>
          {itens.map((q, i) => (
            <Fragment key={q.id}>
              {nivel === "todos" && (i === 0 || itens[i - 1].difficulty !== q.difficulty) && <tr className="v2-admin-grupo"><td colSpan={5}>{NIVEIS[q.difficulty] || q.difficulty}</td></tr>}
              {linha(q, false)}
            </Fragment>
          ))}
          {visiveis.length === 0 && <tr><td colSpan={5} className="v2-admin-apagado">{nivel === "todos" ? "Nenhuma pergunta neste tema." : `Nenhuma pergunta ${NIVEIS[nivel].toLowerCase()} neste tema — vale escrever algumas.`}</td></tr>}
        </tbody>
      </table></div>
      <Paginacao pagina={pagina} total={totalPag} aoMudar={setPagina} />
    </details>
  );
}

// ---------- Quiz: perguntas com a mesma resposta ----------
export function RespostasRepetidas({ temas }) {
  const [tema, setTema] = useState("");
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [ocupado, setOcupado] = useState(null);

  useEffect(() => {
    if (!tema) return;
    setCarregando(true); setDados(null);
    api.get(`/admin/quiz-respostas-repetidas?tema=${encodeURIComponent(tema)}`)
      .then(({ data }) => setDados(data)).catch((e) => alert(e.response?.data?.error || "Erro ao carregar."))
      .finally(() => setCarregando(false));
  }, [tema]);

  async function apagar(id, texto) {
    if (!confirm(`Apagar esta pergunta?\n\n"${texto}"\n\nIsso não pode ser desfeito.`)) return;
    setOcupado(id);
    try {
      await api.delete(`/admin/quiz-questions/${id}`);
      setDados((d) => ({ ...d, grupos: d.grupos.map((g) => { const ps = g.perguntas.filter((p) => p.id !== id); return { ...g, perguntas: ps, total: ps.length }; }).filter((g) => g.total > 1) }));
    } catch (e) { alert(e.response?.data?.error || "Erro ao apagar."); }
    finally { setOcupado(null); }
  }
  async function estaOk(g) {
    setOcupado(g.answer);
    try {
      await api.post("/admin/quiz-respostas-repetidas/aprovar", { themeKey: g.themeKey, answer: g.answer, quantidade: g.total });
      setDados((d) => ({ ...d, grupos: d.grupos.filter((x) => x.answer !== g.answer), ocultos: (d.ocultos || 0) + 1 }));
    } catch (e) { alert(e.response?.data?.error || "Erro ao aprovar."); }
    finally { setOcupado(null); }
  }
  const variedade = dados?.total > 0 ? Math.round((dados.distintas / dados.total) * 100) : null;

  return (
    <section className="v2-cartao">
      <h2>Perguntas com a mesma resposta</h2>
      <p className="v2-cartao-nota">Perguntas diferentes que levam ao mesmo destino — não é erro. Apague as redundantes e marque como <b>está ok</b> as que devem conviver: o grupo some e só volta se entrarem perguntas novas com a mesma resposta.</p>
      <label className="v2-admin-campo">Tema
        <select value={tema} onChange={(e) => setTema(e.target.value)}><option value="">Escolha um tema…</option>{Object.entries(temas).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
      </label>
      {carregando && <div className="v2-carregando">Carregando…</div>}
      {dados && (
        <>
          <div className="v2-admin-numeros">
            <div><b>{dados.total}</b><span>perguntas</span></div>
            <div><b>{dados.distintas}</b><span>respostas distintas</span></div>
            <div><b>{dados.envolvidas}</b><span>em repetição</span></div>
            <div className={variedade < 75 ? "alerta" : ""}><b>{variedade}%</b><span>variedade real</span></div>
            {dados.ocultos > 0 && <div><b>{dados.ocultos}</b><span>já revisados</span></div>}
          </div>
          {dados.grupos.length === 0 && <div className="v2-vazio">{dados.ocultos > 0 ? `Nada pendente — os ${dados.ocultos} grupos deste tema já foram revisados.` : "Nenhuma resposta repetida neste tema."}</div>}
          {dados.grupos.map((g) => (
            <div key={g.answer + g.themeKey} className="v2-repetidas-grupo">
              <div className="v2-repetidas-topo">
                <b>{g.answer}</b><span>{g.total} perguntas</span>
                <button className="v2-botao-pequeno ok" disabled={ocupado === g.answer} onClick={() => estaOk(g)}>{ocupado === g.answer ? "…" : "Está ok"}</button>
              </div>
              {g.perguntas.map((p) => (
                <div key={p.id} className={`v2-repetidas-item ${p.difficulty === "dificil" ? "dificil" : "facil"}`}>
                  <span className="v2-dif-mini">{p.difficulty}</span>
                  <span className="v2-repetidas-texto">{p.question}</span>
                  <button className="v2-botao-pequeno perigo" disabled={ocupado === p.id} onClick={() => apagar(p.id, p.question)}>{ocupado === p.id ? "…" : "Apagar"}</button>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </section>
  );
}

// ---------- Quiz: perguntas parecidas ----------
export function PerguntasParecidas() {
  const [dados, setDados] = useState(null);
  const [limite, setLimite] = useState(60);
  const [erro, setErro] = useState("");
  const [resolvidos, setResolvidos] = useState(() => new Set());
  const [apagadas, setApagadas] = useState(() => new Set());
  const [editando, setEditando] = useState(null);
  const chave = (p) => [p.a.id, p.b.id].sort().join("|");

  const carregar = (lim = limite) => {
    setErro("");
    api.get(`/admin/quiz-parecidas?limite=${lim}`).then(({ data }) => setDados(data)).catch((e) => {
      const st = e.response?.status;
      setErro(st === 403 ? "Acesso negado (403). Saia e entre de novo — o cargo guardado no navegador pode estar desatualizado."
        : st === 404 ? "Rota não encontrada (404). O deploy do backend provavelmente ainda não subiu esta versão."
        : `Erro ao carregar${st ? ` (${st})` : ""}: ${e.response?.data?.error || e.message}`);
    });
  };
  useEffect(() => { carregar(limite); }, [limite]);

  async function diferentes(par) {
    try { await api.post("/admin/quiz-parecidas/aprovar", { idA: par.a.id, idB: par.b.id }); setResolvidos((s) => new Set(s).add(chave(par))); }
    catch (e) { alert(e.response?.data?.error || "Erro ao salvar."); }
  }
  async function grupoTodo(grupo) {
    try {
      await api.post("/admin/quiz-parecidas/aprovar", { pares: grupo.map((g) => ({ idA: g.a.id, idB: g.b.id })) });
      setResolvidos((s) => { const n = new Set(s); for (const g of grupo) n.add(chave(g)); return n; });
    } catch (e) { alert(e.response?.data?.error || "Erro ao salvar."); }
  }
  async function apagar(id, texto) {
    if (!confirm(`Apagar esta pergunta?\n\n"${texto}"`)) return;
    try { await api.delete(`/admin/quiz-questions/${id}`); setApagadas((s) => new Set(s).add(id)); }
    catch (e) { alert(e.response?.data?.error || "Erro ao apagar."); }
  }
  async function salvar() {
    if (!editando.question.trim() || !editando.answer.trim()) { alert("Pergunta e resposta não podem ficar vazias."); return; }
    try { await api.patch(`/admin/quiz-questions/${editando.id}`, { question: editando.question, answer: editando.answer }); setEditando(null); carregar(); }
    catch (e) { alert(e.response?.data?.error || "Erro ao salvar."); }
  }

  if (erro) return <section className="v2-cartao"><h2>Perguntas parecidas</h2><div className="v2-faixa-aviso erro">{erro}</div></section>;
  if (!dados) return <section className="v2-cartao"><div className="v2-carregando">Procurando perguntas parecidas…</div></section>;

  const pares = dados.pares.filter((p) => !resolvidos.has(chave(p)) && !apagadas.has(p.a.id) && !apagadas.has(p.b.id));
  const cachos = new Map();
  for (const p of pares) { const k = `${p.sala}|${(p.a.answer || "").toLowerCase().trim()}`; (cachos.get(k) || cachos.set(k, []).get(k)).push(p); }
  const cachoDe = (p) => cachos.get(`${p.sala}|${(p.a.answer || "").toLowerCase().trim()}`) || [p];

  const cartao = (q) => editando?.id === q.id ? (
    <div className="v2-parecida">
      <textarea rows={3} value={editando.question} onChange={(e) => setEditando({ ...editando, question: e.target.value })} />
      <input value={editando.answer} onChange={(e) => setEditando({ ...editando, answer: e.target.value })} placeholder="Resposta" />
      <div className="v2-admin-acoes"><button className="v2-botao-pequeno ok" onClick={salvar}>Salvar</button><button className="v2-botao-pequeno" onClick={() => setEditando(null)}>Cancelar</button></div>
    </div>
  ) : (
    <div className="v2-parecida">
      <p>{q.question}</p>
      <b>→ {q.answer}</b>
      <div className="v2-admin-acoes"><button className="v2-botao-pequeno" onClick={() => setEditando({ id: q.id, question: q.question, answer: q.answer })}>Editar</button><button className="v2-botao-pequeno perigo" onClick={() => apagar(q.id, q.question)}>Apagar</button></div>
    </div>
  );

  return (
    <section className="v2-cartao">
      <div className="v2-cartao-cabeca">
        <h2>Perguntas parecidas ({pares.length})</h2>
        <label className="v2-admin-campo em-linha">Semelhança mínima
          <select value={limite} onChange={(e) => setLimite(Number(e.target.value))}>{[50, 60, 70, 80, 90].map((n) => <option key={n} value={n}>{n}%</option>)}</select>
        </label>
      </div>
      <p className="v2-cartao-nota">Só aparecem pares da <b>mesma sala</b> (tema + dificuldade) e com a <b>mesma resposta</b>. Nem todo par é duplicata: perguntas sobre anos diferentes podem parecer iguais no texto.</p>
      {pares.length === 0 && <div className="v2-vazio">Nenhum par acima de {limite}% de semelhança.</div>}
      {pares.map((p) => (
        <div key={`${p.a.id}-${p.b.id}`} className="v2-par">
          <div className="v2-par-topo">
            <span className="v2-par-sala">{p.sala}</span>
            <span className="v2-par-pct">{p.semelhanca}% parecidas</span>
            <button className="v2-botao-pequeno" onClick={() => diferentes(p)}>São diferentes</button>
            {cachoDe(p).length >= 2 && <button className="v2-botao-pequeno" onClick={() => grupoTodo(cachoDe(p))}>Grupo todo ({cachoDe(p).length} pares)</button>}
          </div>
          <div className="v2-par-grade">{cartao(p.a)}{cartao(p.b)}</div>
        </div>
      ))}
    </section>
  );
}

// ---------- Cadastros por dia ----------
export function CadastrosPorDia() {
  const [dados, setDados] = useState(null);
  const [dias, setDias] = useState(30);
  const [erro, setErro] = useState("");
  useEffect(() => {
    let vivo = true;
    setDados(null);
    api.get(`/admin/cadastros-por-dia?dias=${dias}`).then(({ data }) => vivo && setDados(data)).catch((e) => vivo && setErro(e.response?.data?.error || "Erro ao carregar."));
    return () => { vivo = false; };
  }, [dias]);
  const rotulo = (iso) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
  const maximo = dados ? Math.max(1, ...dados.serie.map((d) => d.total)) : 1;
  const passo = dados?.serie.length ? 100 / dados.serie.length : 1;

  return (
    <section className="v2-cartao">
      <div className="v2-cartao-cabeca">
        <h2>Cadastros por dia</h2>
        <div className="v2-admin-filtros">{[7, 30, 90, 365].map((n) => <button key={n} className={dias === n ? "ativo" : ""} onClick={() => setDias(n)}>{n === 365 ? "1 ano" : `${n}d`}</button>)}</div>
      </div>
      {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
      {!dados && !erro && <div className="v2-carregando">Carregando cadastros…</div>}
      {dados && (
        <>
          <div className="v2-admin-numeros">
            <div><b>{dados.total}</b><span>no período</span></div>
            <div><b>{dados.mediaPorDia}</b><span>por dia (média)</span></div>
            {dados.melhorDia?.total > 0 && <div><b>{dados.melhorDia.total}</b><span>melhor dia ({rotulo(dados.melhorDia.data)})</span></div>}
          </div>
          <svg viewBox="0 0 100 180" preserveAspectRatio="none" className="v2-grafico-cadastros" role="img" aria-label={`Cadastros por dia nos últimos ${dias} dias`}>
            {dados.serie.map((d, i) => {
              const h = (d.total / maximo) * 160;
              return <rect key={d.data} x={i * passo + passo * 0.15} y={180 - h} width={passo * 0.7} height={h} rx={passo * 0.2} fill={d.total === maximo && d.total > 0 ? "#ffd60a" : "#7a5cd6"}><title>{`${rotulo(d.data)}: ${d.total} cadastro(s)`}</title></rect>;
            })}
          </svg>
          <div className="v2-grafico-eixo"><span>{dados.serie.length ? rotulo(dados.serie[0].data) : ""}</span><span>{dados.serie.length ? rotulo(dados.serie.at(-1).data) : "hoje"}</span></div>
          <p className="v2-cartao-nota">Passe o mouse numa barra pra ver o dia. Visitantes não entram na conta.</p>
        </>
      )}
    </section>
  );
}

// Lenda do Campinho: quem está jogando agora e o histórico de sessões (só
// quem joga LOGADO — o jogo sem conta não fala com o servidor). Horários em
// Brasília. Atualiza sozinho a cada 2 minutos.
const horaBR = (iso) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const soHoraBR = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const duracao = (min) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`);
const niveis = (s) => (s.nivelInicio == null ? "—" : s.nivelFim > s.nivelInicio ? `${s.nivelInicio} → ${s.nivelFim}` : String(s.nivelInicio));

export function LendaSessoes() {
  const [dados, setDados] = useState(null);
  const [dias, setDias] = useState(7);
  const [jogador, setJogador] = useState("");
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");
  useEffect(() => {
    let vivo = true;
    const carregar = () => api.get("/lenda/admin/sessoes", { params: { dias, jogador: busca } })
      .then(({ data }) => { if (vivo) { setDados(data); setErro(""); } })
      .catch((e) => vivo && setErro(e.response?.data?.error || "Erro ao carregar as sessões."));
    setDados(null);
    carregar();
    const t = setInterval(() => { if (!document.hidden) carregar(); }, 120000);
    return () => { vivo = false; clearInterval(t); };
  }, [dias, busca]);

  return (
    <>
      <section className="v2-cartao">
        <div className="v2-cartao-cabeca">
          <h2>Lenda do Campinho — jogando agora</h2>
          {dados && <span className="v2-cartao-nota">{dados.jogandoAgora.length} {dados.jogandoAgora.length === 1 ? "pessoa" : "pessoas"}</span>}
        </div>
        {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
        {!dados && !erro && <div className="v2-carregando">Carregando…</div>}
        {dados && dados.jogandoAgora.length === 0 && <div className="v2-vazio">Ninguém jogando logado neste momento.</div>}
        {dados && dados.jogandoAgora.length > 0 && (
          <ul className="v2-admin-lista-simples">
            {dados.jogandoAgora.map((s) => (
              <li key={s.id}><b>{s.apelido}</b> · desde {soHoraBR(s.inicio)} ({duracao(s.minutos)}) · nível {niveis(s)}{s.plataforma ? ` · ${s.plataforma}` : ""}</li>
            ))}
          </ul>
        )}
        <p className="v2-cartao-nota">Conta quem está logado no site (sinal nos últimos 5 min). Quem joga sem conta não aparece.</p>
      </section>

      <section className="v2-cartao">
        <div className="v2-cartao-cabeca">
          <h2>Histórico de sessões</h2>
          <div className="v2-admin-filtros">{[1, 7, 30, 90].map((n) => <button key={n} className={dias === n ? "ativo" : ""} onClick={() => setDias(n)}>{n === 1 ? "24h" : `${n}d`}</button>)}</div>
        </div>
        <form className="v2-admin-busca" onSubmit={(e) => { e.preventDefault(); setBusca(jogador.trim()); }}>
          <input className="v2-campo" placeholder="Filtrar por jogador (apelido)" value={jogador} onChange={(e) => setJogador(e.target.value)} maxLength={30} />
          <button className="v2-botao-pequeno" type="submit">Filtrar</button>
          {busca && <button className="v2-botao-pequeno" type="button" onClick={() => { setJogador(""); setBusca(""); }}>Limpar</button>}
        </form>
        {dados && (
          <>
            <div className="v2-admin-numeros">
              <div><b>{dados.resumo.sessoes}</b><span>sessões</span></div>
              <div><b>{dados.resumo.jogadores}</b><span>jogadores</span></div>
              <div><b>{duracao(dados.resumo.minutos)}</b><span>tempo somado</span></div>
            </div>
            {dados.sessoes.length === 0 ? <div className="v2-vazio">Nenhuma sessão no período.</div> : (
              <div className="v2-tabela-rolagem">
                <table className="v2-tabela-admin">
                  <thead><tr><th>Jogador</th><th>Entrou</th><th>Último sinal</th><th>Tempo</th><th>Nível</th><th>Aparelho</th></tr></thead>
                  <tbody>
                    {dados.sessoes.map((s) => (
                      <tr key={s.id}>
                        <td>{s.apelido}{s.jogandoAgora && " 🟢"}</td>
                        <td>{horaBR(s.inicio)}</td>
                        <td>{s.jogandoAgora ? "jogando agora" : horaBR(s.ultimoSinal)}</td>
                        <td>{duracao(s.minutos)}</td>
                        <td>{niveis(s)}</td>
                        <td>{s.plataforma || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="v2-cartao-nota">Horários de Brasília. Uma sessão termina depois de 30 min sem sinal do jogo (jogo minimizado continua na mesma sessão). Guardado por 90 dias (mostra até 500 sessões).</p>
          </>
        )}
      </section>
    </>
  );
}

// Estatísticas ANÔNIMAS do Lenda (só contagens por dia — ninguém é identificado).
// v407 (Raio-X I7): o funil principal é abriu → tutorial → nível 5 → 10 → 20 → voltou no dia seguinte (D1) → em 7 dias (D7).
// Número com menos de 5 pessoas não vem do servidor (aparece "menos de 5"): com tão pouca gente daria para saber quem é.
const FUNIL = [
  ["abriu:novo", "Abriram o jogo pela 1ª vez"], ["tutorial:fim", "Terminaram o tutorial"],
  ["nivel:5", "Nível 5"], ["nivel:10", "Nível 10"], ["nivel:20", "Nível 20"],
  ["retorno:d1", "Voltaram no dia seguinte (D1)"], ["retorno:d7", "Voltaram depois de 7 dias (D7)"],
];
const FUNIL_MAIS = [
  ["personagem", "Criaram personagem"], ["desistiu:criacao", "Fecharam na tela de criar personagem"],
  ["primeira:caca", "Entraram na 1ª área de caça"], ["primeira:chefe", "Venceram o 1º chefão"],
  ["nivel:50", "Nível 50"], ["nivel:100", "Nível 100"], ["nivel:200", "Nível 200"], ["nivel:300", "Nível 300"], ["nivel:400", "Nível 400"], ["nivel:500", "Nível 500"],
];
const RETORNO = [["retorno:d30", "Voltaram depois de 30 dias"]];
const SESSAO = [["sessao:m0_5", "até 5 min"], ["sessao:m5_15", "5–15 min"], ["sessao:m15_30", "15–30 min"], ["sessao:m30_60", "30–60 min"], ["sessao:m60", "mais de 1 h"]];

export function LendaEstatisticas() {
  const [dados, setDados] = useState(null);
  const [dias, setDias] = useState(30);
  const [erro, setErro] = useState("");
  useEffect(() => {
    let vivo = true;
    setDados(null);
    api.get("/lenda/admin/contagens", { params: { dias } })
      .then(({ data }) => vivo && (setDados(data), setErro("")))
      .catch((e) => vivo && setErro(e.response?.data?.error || "Erro ao carregar as estatísticas."));
    return () => { vivo = false; };
  }, [dias]);
  const t = dados?.total || {};
  const poucos = new Set(dados?.poucos || []);
  const soma = (pref) => Object.entries(t).filter(([k]) => k === pref || k.startsWith(pref + ":")).reduce((a, [, n]) => a + n, 0);
  const base = t["abriu:novo"] || 0;
  const mapas = Object.entries(t).filter(([k]) => k.startsWith("mapa:")).sort((a, b) => b[1] - a[1]).slice(0, 25);
  const missoes = Object.entries(t).filter(([k]) => k.startsWith("missao:")).sort((a, b) => b[1] - a[1]).slice(0, 40);
  const linha = ([k, nome], ref) => {
    const n = k.includes(":") ? t[k] || 0 : soma(k);
    if (!n && poucos.has(k)) return <tr key={k}><td>{nome}</td><td>menos de 5</td><td>—</td></tr>;
    return <tr key={k}><td>{nome}</td><td>{n}</td><td>{ref ? `${Math.round((n / ref) * 100)}%` : "—"}</td></tr>;
  };
  return (
    <section className="v2-cartao">
      <div className="v2-cartao-cabeca">
        <h2>Lenda do Campinho — funil do jogo (anônimo)</h2>
        <div className="v2-admin-filtros">{[7, 30, 90, 365].map((n) => <button key={n} className={dias === n ? "ativo" : ""} onClick={() => setDias(n)}>{`${n}d`}</button>)}</div>
      </div>
      {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
      {!dados && !erro && <div className="v2-carregando">Carregando…</div>}
      {dados && (
        <>
          <div className="v2-admin-numeros">
            <div><b>{soma("jogou")}</b><span>partidas abertas</span></div>
            <div><b>{base}</b><span>jogadores novos</span></div>
            <div><b>{soma("derrota")}</b><span>1ª derrota</span></div>
          </div>
          <div className="v2-tabela-rolagem">
            <table className="v2-tabela-admin">
              <thead><tr><th>Marco</th><th>Quantos</th><th>dos novos</th></tr></thead>
              <tbody>{FUNIL.map((l) => linha(l, base))}</tbody>
            </table>
          </div>
          <div className="v2-tabela-rolagem">
            <table className="v2-tabela-admin">
              <thead><tr><th>Outros marcos</th><th>Quantos</th><th>dos novos</th></tr></thead>
              <tbody>{FUNIL_MAIS.map((l) => linha(l, base))}{RETORNO.map((l) => linha(l, base))}</tbody>
            </table>
          </div>
          {missoes.length > 0 && (
            <div className="v2-tabela-rolagem">
              <table className="v2-tabela-admin">
                <thead><tr><th>Missão concluída (ID)</th><th>Quantos</th><th></th></tr></thead>
                <tbody>{missoes.map(([k, n]) => <tr key={k}><td>{k.slice(7)}</td><td>{n}</td><td></td></tr>)}</tbody>
              </table>
            </div>
          )}
          <div className="v2-tabela-rolagem">
            <table className="v2-tabela-admin">
              <thead><tr><th>Tempo de jogo por vez</th><th>Vezes</th><th></th></tr></thead>
              <tbody>{SESSAO.map((l) => linha(l, soma("sessao")))}</tbody>
            </table>
          </div>
          {mapas.length > 0 && (
            <div className="v2-tabela-rolagem">
              <table className="v2-tabela-admin">
                <thead><tr><th>Lugar (1ª visita de cada personagem)</th><th>Quantos</th><th></th></tr></thead>
                <tbody>{mapas.map(([k, n]) => <tr key={k}><td>{k.slice(5)}</td><td>{n}</td><td></td></tr>)}</tbody>
              </table>
            </div>
          )}
          <p className="v2-cartao-nota">Números com menos de 5 pessoas ficam escondidos ("menos de 5"). Só contagens somadas por dia: não existe registro de quem fez o quê (sem conta, sem aparelho, sem IP). Conta quem joga com ou sem conta, no site (a Steam não envia). Quem desligou em ☰ Mais › 📊 ou usa "Não rastrear" não entra.</p>
        </>
      )}
    </section>
  );
}

// v407 (Raio-X U7): Lenda do Campinho — SUSPEITOS do ranking (envio reprovado: XP fora da curva, rápido demais,
// nível que pulou) e PARES da feira que se repetem (vendedor ↔ comprador, possível troca entre contas do mesmo dono).
// Suspeito fica fora dos rankings e não vende na feira até "Descartar" (alarme falso). Nada aqui bane ninguém.
const MOTIVO_LENDA = { lenda_xp_fora_da_curva: "XP não bate com o nível", lenda_xp_rapido_demais: "Ganhou XP rápido demais", lenda_nivel_pulou: "Nível pulou de uma vez" };
export function LendaSuspeitos() {
  const [sus, setSus] = useState(null);
  const [pares, setPares] = useState(null);
  const [erro, setErro] = useState("");
  const carregar = () => {
    api.get("/lenda/admin/suspeitos").then(({ data }) => setSus(data.suspeitos || [])).catch((e) => setErro(e.response?.data?.error || "Erro ao carregar os suspeitos."));
    api.get("/lenda/mercado/admin/pares", { params: { dias: 30, minimo: 3 } }).then(({ data }) => setPares(data.pares || [])).catch(() => setPares([]));
  };
  useEffect(carregar, []);
  const descartar = async (s) => {
    if (!window.confirm(`Tirar ${s.apelido} da lista de suspeitos? A conta volta aos rankings e à feira.`)) return;
    try { await api.delete(`/lenda/admin/suspeitos/${s.userId}`); carregar(); } catch { setErro("Não deu para descartar agora."); }
  };
  return (
    <section className="v2-cartao">
      <div className="v2-cartao-cabeca">
        <h2>Lenda do Campinho — suspeitos e feira</h2>
        <button className="v2-botao-pequeno" onClick={carregar}>Atualizar</button>
      </div>
      {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
      <h3>Ranking: envios reprovados ({sus ? sus.length : "…"})</h3>
      {sus && sus.length === 0 && <div className="v2-vazio">Ninguém na lista.</div>}
      {sus && sus.length > 0 && (
        <div className="v2-tabela-rolagem">
          <table className="v2-tabela-admin">
            <thead><tr><th>Jogador</th><th>Conta desde</th><th>Ranking agora</th><th>O que aconteceu</th><th></th></tr></thead>
            <tbody>
              {sus.map((s) => (
                <tr key={s.userId}>
                  <td>{s.apelido}{s.visitante ? " (visitante)" : ""}{s.banido ? " 🚫" : ""}</td>
                  <td>{s.contaDesde ? new Date(s.contaDesde).toLocaleDateString("pt-BR") : "—"}</td>
                  <td>{s.ranking ? `nível ${s.ranking.nivel}` : "—"}</td>
                  <td>{s.registros.map((r, i) => <div key={i}><b>{MOTIVO_LENDA[r.motivo] || r.motivo}</b> — {r.detalhe} <small>({horaBR(r.quando)})</small></div>)}</td>
                  <td><button className="v2-botao-pequeno" onClick={() => descartar(s)}>Descartar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h3>Feira: pares que se repetem (30 dias, 3+ vendas)</h3>
      {pares && pares.length === 0 && <div className="v2-vazio">Nenhum par repetido.</div>}
      {pares && pares.length > 0 && (
        <div className="v2-tabela-rolagem">
          <table className="v2-tabela-admin">
            <thead><tr><th>Vendedor</th><th>Comprador</th><th>Vendas</th><th>Tostões</th><th>Última</th></tr></thead>
            <tbody>
              {pares.map((p) => (
                <tr key={p.vendedorId + p.compradorId}><td>{p.vendedor}</td><td>{p.comprador}</td><td>{p.vendas}</td><td>{Math.round(p.tostoes).toLocaleString("pt-BR")}</td><td>{p.ultima ? horaBR(p.ultima) : "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="v2-cartao-nota">Suspeito: some dos rankings e não vende na feira até você descartar; continua jogando normalmente. Pares repetidos só mostram o padrão (pode ser irmão comprando do irmão) — nada é bloqueado.</p>
    </section>
  );
}
