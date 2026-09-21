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
