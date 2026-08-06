// Paginação simples e reutilizável (client-side) — usada nas listas do
// Painel Admin que podem crescer bastante (usuários, perguntas por tema).
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <button className="btn secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Anterior
      </button>
      <span>Página {page} de {totalPages}</span>
      <button className="btn secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Próxima →
      </button>
    </div>
  );
}
