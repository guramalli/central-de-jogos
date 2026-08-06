import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";

// Mesmo conjunto de letras sorteáveis no jogo (sem K, W, X, Y, Z).
const LETTERS = "ABCDEFGHIJLMNOPQRSTUV".split("");

// Índice de palavras e temas do painel admin: escolhe um tema, preenche uma
// palavra por letra numa grade (Enter salva e já pula pro campo da letra
// seguinte), e vê/apaga as palavras já cadastradas logo abaixo.
export default function AdminGlossary() {
  const [themes, setThemes] = useState([]);
  const [themeKey, setThemeKey] = useState("");
  const [words, setWords] = useState([]);
  const [drafts, setDrafts] = useState({}); // letter -> texto sendo digitado
  const [savingLetter, setSavingLetter] = useState(null);
  const [error, setError] = useState("");
  const inputRefs = useRef({});

  useEffect(() => {
    api.get("/glossary/themes").then(({ data }) => {
      setThemes(data);
      if (data.length > 0) setThemeKey(data[0].key);
    });
  }, []);

  useEffect(() => {
    if (themeKey) loadWords();
  }, [themeKey]);

  async function loadWords() {
    const { data } = await api.get("/admin/glossary/words", { params: { themeKey } });
    setWords(data);
  }

  async function saveWord(letter) {
    const word = (drafts[letter] || "").trim();
    if (!word) return;
    setSavingLetter(letter);
    setError("");
    try {
      await api.post("/admin/glossary/words", { themeKey, letter, word });
      setDrafts((d) => ({ ...d, [letter]: "" }));
      await loadWords();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao salvar palavra.");
    } finally {
      setSavingLetter(null);
    }
  }

  function focusNextLetter(currentIdx) {
    const nextLetter = LETTERS[currentIdx + 1];
    if (nextLetter) inputRefs.current[nextLetter]?.focus();
  }

  async function handleKeyDown(e, letter, idx) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    await saveWord(letter);
    focusNextLetter(idx);
  }

  async function handleDelete(id) {
    await api.delete(`/admin/glossary/words/${id}`);
    loadWords();
  }

  const wordsByLetter = {};
  for (const w of words) {
    if (!wordsByLetter[w.letter]) wordsByLetter[w.letter] = [];
    wordsByLetter[w.letter].push(w);
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2>Índice de palavras e temas</h2>
      {error && <div className="error-msg">{error}</div>}

      <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Tema</label>
      <select value={themeKey} onChange={(e) => setThemeKey(e.target.value)}>
        {themes.map((t) => (
          <option key={t.key} value={t.key}>{t.name}</option>
        ))}
      </select>

      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>
        Digite uma palavra em cada campo e aperte <strong>Enter</strong> — ela é salva
        (já aprovada) e o cursor pula direto pro campo da próxima letra.
      </p>

      <div className="admin-glossary-grid">
        {LETTERS.map((letter, idx) => (
          <div key={letter} className="admin-glossary-cell">
            <label>{letter}</label>
            <input
              ref={(el) => (inputRefs.current[letter] = el)}
              value={drafts[letter] || ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [letter]: e.target.value }))}
              onKeyDown={(e) => handleKeyDown(e, letter, idx)}
              disabled={savingLetter === letter}
              placeholder={`Palavra com ${letter}...`}
            />
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 20 }}>Palavras cadastradas neste tema</h3>
      <div className="admin-glossary-words">
        {LETTERS.filter((l) => wordsByLetter[l]?.length).map((letter) => (
          <div key={letter} className="admin-glossary-words-group">
            <strong>{letter}</strong>
            <ul>
              {wordsByLetter[letter].map((w) => (
                <li key={w.id}>
                  <span className={w.status !== "approved" ? "word-text-blank" : ""}>
                    {w.word} {w.status !== "approved" && `(${w.status === "pending" ? "pendente" : "rejeitada"})`}
                  </span>
                  <button className="btn secondary admin-word-del" onClick={() => handleDelete(w.id)} title="Remover">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {words.length === 0 && <p style={{ color: "var(--text-dim)" }}>Nenhuma palavra cadastrada ainda neste tema.</p>}
      </div>
    </div>
  );
}
