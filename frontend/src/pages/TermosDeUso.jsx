export default function TermosDeUso() {
  return (
    <div className="legal-page">
      <h1>Termos de Uso</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
        Última atualização: {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
      </p>

      <div className="card legal-card">
        <p>
          Bem-vindo(a) à <strong>Educação Gamer</strong>! Estes Termos de Uso regulam o acesso e uso
          da plataforma, incluindo os jogos Stop e Quiz, sistema de ranking, clãs, chat e demais
          funcionalidades. Ao criar uma conta ou usar o site, você concorda com o que está descrito
          aqui. Se não concordar, pedimos que não utilize a plataforma.
        </p>

        <h2>1. O que é a Educação Gamer</h2>
        <p>
          A Educação Gamer é uma plataforma gratuita de jogos multiplayer online, atualmente em{" "}
          <strong>fase de testes (Beta)</strong>. Isso significa que o site pode passar por
          instabilidades, mudanças frequentes e eventuais bugs enquanto evoluímos a experiência com
          base no feedback dos jogadores.
        </p>

        <h2>2. Cadastro e conta</h2>
        <ul>
          <li>Você precisa fornecer um nickname, e-mail e senha válidos para se cadastrar.</li>
          <li>Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas na sua conta.</li>
          <li>Cada pessoa pode manter apenas uma conta. Contas duplicadas criadas para burlar regras (como limites de sala ou rankings) podem ser suspensas.</li>
          <li>Informações como cidade, estado e data de nascimento são opcionais e usadas apenas para funcionalidades específicas da plataforma (como o aviso de aniversário nas salas).</li>
        </ul>

        <h2>3. Conduta esperada</h2>
        <p>Ao usar o chat, sugerir palavras/perguntas ou interagir com outros jogadores, você concorda em não:</p>
        <ul>
          <li>Usar linguagem ofensiva, discriminatória, ameaçadora ou de assédio contra outros jogadores;</li>
          <li>Enviar spam, propaganda não autorizada ou conteúdo ilegal;</li>
          <li>Tentar burlar, explorar falhas ou automatizar (bots) o funcionamento dos jogos de forma desleal;</li>
          <li>Se passar por outra pessoa ou pela equipe administrativa da plataforma;</li>
          <li>Compartilhar dados pessoais de terceiros sem consentimento.</li>
        </ul>
        <p>
          O descumprimento dessas regras pode levar a advertências, banimento temporário ou
          permanente da conta, a critério da moderação.
        </p>

        <h2>4. Conteúdo enviado por jogadores</h2>
        <p>
          Algumas funcionalidades permitem enviar conteúdo, como sugestões de palavras (Stop),
          sugestões de perguntas (Quiz), mensagens de chat e frases de comemoração personalizadas.
          Esse conteúdo passa por moderação antes de ficar visível publicamente (quando aplicável), e
          pode ser removido a qualquer momento se violar estes Termos. Ao enviar conteúdo, você
          garante que tem o direito de compartilhá-lo e concede à plataforma permissão para exibi-lo
          dentro do site.
        </p>

        <h2>5. Pontuação, patentes e rankings</h2>
        <p>
          Pontos, patentes, posições no ranking e premiações mensais são <strong>elementos de jogo
          sem qualquer valor monetário ou financeiro</strong>. Eles não podem ser comprados, vendidos
          ou transferidos entre contas, e servem apenas para fins de entretenimento e progressão
          dentro da plataforma. A Educação Gamer não constitui, e não deve ser interpretada como,
          jogo de azar ou aposta.
        </p>

        <h2>6. Disponibilidade do serviço</h2>
        <p>
          Por estarmos em fase Beta, o serviço pode ficar temporariamente indisponível para
          manutenções, atualizações ou por questões técnicas. Não garantimos disponibilidade
          contínua e ininterrupta. Funcionalidades, regras de jogo, sistema de pontos e patentes
          podem ser alteradas a qualquer momento conforme a plataforma evolui.
        </p>

        <h2>7. Privacidade e dados pessoais</h2>
        <p>
          O tratamento dos seus dados pessoais (como e-mail, nickname e informações de perfil) segue
          a Lei Geral de Proteção de Dados (LGPD). Usamos essas informações apenas para viabilizar o
          funcionamento da plataforma (login, ranking, comunicação sobre a conta) e não
          compartilhamos seus dados com terceiros para fins comerciais.
        </p>

        <h2>8. Propriedade intelectual</h2>
        <p>
          O nome, a marca, o design visual e o código da Educação Gamer pertencem aos seus
          desenvolvedores. Você não pode copiar, redistribuir ou criar produtos derivados da
          plataforma sem autorização prévia.
        </p>

        <h2>9. Limitação de responsabilidade</h2>
        <p>
          A plataforma é oferecida "como está", sem garantias de que estará livre de erros. Não nos
          responsabilizamos por eventuais perdas de dados, pontuação ou indisponibilidade temporária
          decorrentes da fase de testes em que o serviço se encontra.
        </p>

        <h2>10. Banimento e encerramento de conta</h2>
        <p>
          Podemos suspender ou encerrar contas que violem estes Termos, a nosso critério, com ou sem
          aviso prévio, especialmente em casos de comportamento abusivo, tentativa de fraude no
          sistema de pontuação, ou uso indevido da plataforma.
        </p>

        <h2>11. Alterações nestes Termos</h2>
        <p>
          Podemos atualizar estes Termos de tempos em tempos, principalmente durante a fase Beta. A
          data da última atualização sempre estará indicada no topo desta página. O uso continuado da
          plataforma após alterações implica concordância com os novos termos.
        </p>

        <h2>12. Contato</h2>
        <p>
          Dúvidas, sugestões ou problemas? Use o botão{" "}
          <strong>💬 Enviar feedback</strong> disponível na página inicial — é o canal mais rápido
          para falar com quem cuida da plataforma.
        </p>
      </div>
    </div>
  );
}
