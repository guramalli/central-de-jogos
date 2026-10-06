// Abas de página (Competir, Social). Cada aba é um link de verdade
// (?pagina=…): abre em nova aba, e o "voltar" do navegador funciona.
export default function Abas({ abas, ativa, rotulo }) {
  return (
    <nav className="v2-abas" aria-label={rotulo}>
      {abas.map((a) => (
        <a key={a.chave} href={a.href} onClick={a.aoClicar} className={a.chave === ativa ? "ativa" : ""} aria-current={a.chave === ativa ? "page" : undefined}>
          {a.rotulo}
        </a>
      ))}
    </nav>
  );
}

// Monta uma aba que leva a ?pagina=<pagina> (com os parâmetros extras).
export function abaDaPagina(chave, rotulo, pagina, extra, irParaPagina, linkDaPagina) {
  return { chave, rotulo, href: linkDaPagina(pagina, extra), aoClicar: (e) => { e.preventDefault(); irParaPagina(pagina, extra); } };
}
