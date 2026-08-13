import Seo from "../components/Seo.jsx";

// Página base de privacidade. Cobre o essencial da LGPD com o que a
// plataforma realmente coleta hoje — não é um documento jurídico revisado
// por advogado, e deve ser ampliado quando o site crescer (especialmente
// se entrar publicidade personalizada ou pagamento).
export default function Privacidade() {
  return (
    <div className="legal-page">
      <Seo
        title="Política de Privacidade"
        description="Como a Educação Gamer coleta, usa e protege seus dados: cadastro, jogos, chat e cookies. Seus direitos pela LGPD."
      />
      <h1>Política de Privacidade</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
        Última atualização: {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
      </p>

      <div className="card legal-card">
        <p>
          Esta política explica quais dados a <strong>Educação Gamer</strong> coleta, por que
          coleta e o que você pode fazer a respeito. Escrevemos em linguagem simples de propósito:
          você tem direito de entender o que acontece com suas informações.
        </p>

        <h2>1. Quem somos</h2>
        <p>
          A Educação Gamer é uma plataforma brasileira e independente de jogos multiplayer online
          (Stop, Quiz e Acromania), acessível em educacaogamer.com.br. O site está em fase de
          testes e é mantido por uma equipe pequena.
        </p>

        <h2>2. Dados que coletamos</h2>

        <h3>Quando você cria uma conta</h3>
        <ul>
          <li><strong>Obrigatórios:</strong> apelido (nickname), e-mail e senha.</li>
          <li>
            <strong>Opcionais:</strong> cidade, estado e data de nascimento — usados apenas para
            funcionalidades da plataforma, como o aviso de aniversário nas salas.
          </li>
          <li><strong>Foto de perfil:</strong> só se você enviar uma.</li>
        </ul>
        <p>
          Sua senha é guardada de forma <strong>criptografada</strong> (hash). Nem nós conseguimos
          lê-la.
        </p>

        <h3>Se você entrar com o Google</h3>
        <p>
          Recebemos do Google apenas seu nome, e-mail e foto de perfil, para criar ou acessar sua
          conta. Não temos acesso à sua senha do Google nem a qualquer outro dado da sua conta lá.
        </p>

        <h3>Enquanto você joga</h3>
        <ul>
          <li>Pontuações, patentes, conquistas e histórico de partidas;</li>
          <li>Mensagens enviadas no chat da praça e nas salas;</li>
          <li>Palavras e perguntas que você sugerir para o glossário;</li>
          <li>
            Se você acessa pelo celular ou pelo computador, e a data do último acesso — usamos
            isso apenas de forma agregada, para decidir onde investir melhorias.
          </li>
        </ul>

        <h3>Se você jogar como visitante</h3>
        <p>
          Guardamos apenas o apelido escolhido e os dados da sessão de jogo. Contas de visitante
          não pontuam no ranking e não exigem e-mail.
        </p>

        <h2>3. Por que usamos esses dados</h2>
        <ul>
          <li><strong>Fazer o jogo funcionar:</strong> identificar você nas salas, salvar pontuação, montar rankings e clãs.</li>
          <li><strong>Segurança:</strong> impedir trapaça, contas duplicadas e comportamento abusivo.</li>
          <li><strong>Comunicação:</strong> recuperação de senha e avisos importantes sobre a plataforma.</li>
          <li><strong>Melhorias:</strong> entender de forma agregada como as pessoas usam o site.</li>
        </ul>
        <p>
          <strong>Não vendemos seus dados</strong> e não compartilhamos suas informações pessoais
          com terceiros para fins de marketing.
        </p>

        <h2>4. Cookies e tecnologias parecidas</h2>
        <p>
          Usamos armazenamento local do navegador para manter você conectado entre visitas e
          lembrar preferências como o tema claro/escuro. Sem isso, você precisaria fazer login a
          cada página.
        </p>
        <p>
          Também utilizamos o <strong>Google Ads</strong> para medir a eficácia de nossos anúncios
          (por exemplo, saber quantas pessoas criaram conta depois de ver um anúncio). Essa
          medição segue as políticas de privacidade do Google.
        </p>

        <h2>5. Com quem compartilhamos</h2>
        <p>Apenas com os serviços necessários para o site funcionar:</p>
        <ul>
          <li><strong>Provedores de hospedagem e banco de dados</strong>, que armazenam os dados da plataforma;</li>
          <li><strong>Google</strong>, para login com conta Google e medição de anúncios;</li>
          <li><strong>Autoridades</strong>, se formos legalmente obrigados.</li>
        </ul>

        <h2>6. O que fica visível para outros jogadores</h2>
        <p>
          Seu <strong>apelido, foto de perfil, patente, pontuação, clã e conquistas</strong> são
          públicos dentro da plataforma — aparecem em rankings, salas e no seu perfil de jogador.
          Suas mensagens de chat são vistas por quem está na mesma sala.
        </p>
        <p>
          Seu <strong>e-mail, senha e data de nascimento nunca são exibidos</strong> a outros
          jogadores.
        </p>

        <h2>7. Por quanto tempo guardamos</h2>
        <p>
          Mantemos seus dados enquanto sua conta existir. Mensagens do chat das salas são
          temporárias e somem quando a partida termina. Se você pedir a exclusão da conta,
          removemos seus dados pessoais, podendo manter registros anônimos de pontuação para
          preservar a integridade dos rankings.
        </p>

        <h2>8. Seus direitos</h2>
        <p>
          Pela Lei Geral de Proteção de Dados (LGPD), você pode a qualquer momento:
        </p>
        <ul>
          <li>Saber quais dados temos sobre você;</li>
          <li>Corrigir informações incorretas;</li>
          <li>Pedir a exclusão da sua conta e dos seus dados;</li>
          <li>Revogar consentimentos dados anteriormente.</li>
        </ul>
        <p>
          Para exercer qualquer um desses direitos, use o botão <strong>Suporte</strong> no rodapé
          do site. Respondemos o mais rápido possível.
        </p>

        <h2>9. Menores de idade</h2>
        <p>
          A plataforma é voltada ao público geral e pode ser usada por adolescentes. Se você tem
          menos de 16 anos, o cadastro deve ser feito com consentimento de um responsável. Se
          identificarmos cadastro de criança sem consentimento, a conta poderá ser removida.
        </p>

        <h2>10. Segurança</h2>
        <p>
          Adotamos medidas técnicas para proteger seus dados, como criptografia de senhas e
          conexão segura (HTTPS). Ainda assim, nenhum sistema é 100% imune — por isso recomendamos
          usar uma senha exclusiva para o site.
        </p>

        <h2>11. Mudanças nesta política</h2>
        <p>
          Podemos atualizar este documento conforme a plataforma evolui. A data no topo indica a
          última alteração. Mudanças relevantes serão avisadas no site.
        </p>

        <h2>12. Contato</h2>
        <p>
          Dúvidas sobre privacidade? Fale com a gente pelo botão <strong>Suporte</strong> no
          rodapé.
        </p>
      </div>
    </div>
  );
}
