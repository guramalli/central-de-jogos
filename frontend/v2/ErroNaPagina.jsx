import { Component } from "react";

// REDE DE SEGURANÇA DA v2 — mesma ideia do src/components/ErrorBoundary.jsx
// do clássico (que usa o CSS de lá, por isso não é reaproveitado aqui).
//
// Sem isto, qualquer erro de renderização numa página desmontava o site
// inteiro: tela em branco, e só o refresh resolvia. Duas camadas:
//   1. Falha ao baixar arquivo (aba aberta durante um deploy: o arquivo com
//      hash antigo, ex. o do Impostor, não existe mais) -> recarrega sozinho,
//      uma vez só.
//   2. Qualquer outro erro -> tela explicando, com "Tentar de novo".
//
// Classe e não hook: capturar erro de renderização só existe em classe.

// Guarda QUANDO foi o último recarregamento automático. Se falhar de novo
// logo depois, o arquivo está quebrado de verdade (não só desatualizado):
// mostra a tela de erro em vez de recarregar em laço.
const CHAVE_RELOAD = "eg-v2-recarregou-por-arquivo";
const JANELA_MS = 60_000;

export function ehFalhaDeArquivo(erro) {
  const texto = `${erro?.name || ""} ${erro?.message || ""}`;
  return (
    /ChunkLoadError/i.test(texto) ||
    /Loading chunk/i.test(texto) ||
    /Failed to fetch dynamically imported module/i.test(texto) ||
    /Importing a module script failed/i.test(texto) ||
    /error loading dynamically imported module/i.test(texto) // Firefox
  );
}

// Recarrega a página se não recarregou por isso há pouco. Devolve true se
// recarregou. Storage bloqueado: não recarrega (sem a marca, não dá pra
// garantir que não vira laço) — aí aparece a tela de erro.
export function recarregarUmaVez() {
  try {
    const ultimo = Number(sessionStorage.getItem(CHAVE_RELOAD)) || 0;
    if (Date.now() - ultimo < JANELA_MS) return false;
    sessionStorage.setItem(CHAVE_RELOAD, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export default class ErroNaPagina extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null, recarregando: false };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro) {
    if (ehFalhaDeArquivo(erro) && recarregarUmaVez()) this.setState({ recarregando: true });
  }

  render() {
    const { erro, recarregando } = this.state;
    if (!erro) return this.props.children;
    // `silencioso`: peças soltas (ex.: o aviso da fila) só somem, sem tela.
    if (this.props.silencioso) return null;
    if (recarregando) return <div className="v2-app"><div className="v2-carregando">Atualizando o site…</div></div>;

    const deArquivo = ehFalhaDeArquivo(erro);
    return (
      <div className="v2-app">
        <main className="v2-pagina v2-pagina-estreita">
          <section className="v2-cartao" role="alert">
            <h2>{deArquivo ? "O site foi atualizado" : "Algo deu errado"}</h2>
            <p className="v2-cartao-nota">
              {deArquivo
                ? "Saiu uma versão nova enquanto esta aba estava aberta. Recarregue pra continuar."
                : "Esta página deu um erro inesperado. Tentar de novo costuma resolver."}
            </p>
            <button className="v2-botao v2-botao-amarelo" onClick={() => window.location.reload()}>Tentar de novo</button>
            <a className="v2-link v2-link-bloco" href="/v2/">Voltar pro início</a>
          </section>
        </main>
      </div>
    );
  }
}
