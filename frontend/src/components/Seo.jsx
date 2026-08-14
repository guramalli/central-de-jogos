import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE = "https://www.educacaogamer.com.br";

// Componente reutilizável pra definir título e descrição de cada página —
// sem isso, toda página do site mostrava o mesmo título genérico, tanto na
// aba do navegador quanto (o que importa mais) nos resultados de busca.
export default function Seo({ title, description, noindex = false }) {
  const { pathname } = useLocation();
  const fullTitle = title ? `${title} — Educação Gamer` : "Educação Gamer";
  // Canônico evita que o Google trate www/sem-www, com/sem barra final e
  // variações com parâmetros como páginas diferentes — o que dividiria a
  // força do site entre endereços duplicados.
  const canonical = `${SITE}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {/* Páginas de conta e área logada não devem aparecer na busca. */}
      {noindex && <meta name="robots" content="noindex, follow" />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${SITE}/educacao-gamer-logo.png`} />
      <meta property="og:locale" content="pt_BR" />
    </Helmet>
  );
}
