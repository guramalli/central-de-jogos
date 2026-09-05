import { Component } from "react";

// REDE DE SEGURANÇA DA INTERFACE
//
// O PROBLEMA QUE ISTO RESOLVE:
// As páginas são carregadas sob demanda (`lazy` no App.jsx) e cada uma vira
// um arquivo com hash no nome — Missoes-BacTFhlS.js. Quando sai um deploy, o
// Vite gera hashes NOVOS. Quem estava com a aba aberta continua rodando o
// código antigo e, ao navegar, pede um arquivo que não existe mais. O import
// falha, o React não tem o que renderizar, e sem um boundary a árvore INTEIRA
// desmonta: tela preta, e só o refresh resolve.
//
// Duas camadas aqui:
//   1. Falha de carregamento de arquivo -> recarrega sozinho (uma vez só).
//   2. Qualquer outro erro -> tela explicando, em vez de preto.
//
// Por que classe e não hook: capturar erro de renderização só existe em
// componente de classe. Não há equivalente em função.

// Marca no sessionStorage pra NUNCA entrar em laço de recarregamento. Se o
// reload não resolver (arquivo realmente quebrado, e não só desatualizado),
// a segunda falha mostra a tela de erro em vez de recarregar de novo.
const CHAVE_RELOAD = "eg-recarregou-por-chunk";

function ehFalhaDeArquivo(erro) {
  const texto = `${erro?.name || ""} ${erro?.message || ""}`;
  return (
    /ChunkLoadError/i.test(texto) ||
    /Loading chunk/i.test(texto) ||
    /Failed to fetch dynamically imported module/i.test(texto) ||
    /Importing a module script failed/i.test(texto)
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro) {
    if (!ehFalhaDeArquivo(erro)) return;

    let jaRecarregou = false;
    try {
      jaRecarregou = sessionStorage.getItem(CHAVE_RELOAD) === "1";
      if (!jaRecarregou) sessionStorage.setItem(CHAVE_RELOAD, "1");
    } catch {
      // Navegador com storage bloqueado: segue sem a proteção de laço, mas
      // aí o pior caso é a tela de erro aparecer — nunca um loop, porque
      // sem storage o reload abaixo não acontece.
      return;
    }

    if (!jaRecarregou) window.location.reload();
  }

  componentDidMount() {
    // Chegou até aqui inteiro: a versão em execução está boa, então libera
    // a próxima recuperação automática.
    try {
      sessionStorage.removeItem(CHAVE_RELOAD);
    } catch {
      // sem storage, nada a limpar
    }
  }

  render() {
    if (!this.state.erro) return this.props.children;

    const deArquivo = ehFalhaDeArquivo(this.state.erro);

    return (
      <div className="erro-boundary">
        <h2>{deArquivo ? "O site foi atualizado" : "Algo deu errado"}</h2>
        <p>
          {deArquivo
            ? "Saiu uma versão nova enquanto esta aba estava aberta. Recarregue pra continuar."
            : "Não foi possível carregar esta página. Recarregar costuma resolver."}
        </p>
        <button className="btn" onClick={() => window.location.reload()}>
          Recarregar
        </button>
      </div>
    );
  }
}
