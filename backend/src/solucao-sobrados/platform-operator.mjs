#!/usr/bin/env node
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const valid = (condition, message) => {
  if (!condition) throw new Error(message);
};
function validatedOptions({userId, expectedEmail, action, operatorLabel} = {}) {
  valid(typeof userId === 'string' && UUID.test(userId), 'ID de usuário inválido.');
  valid(typeof expectedEmail === 'string' && expectedEmail.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(expectedEmail.trim()) &&
    !/[\u0000-\u001f\u007f]/.test(expectedEmail), 'E-mail esperado inválido.');
  valid(action === 'grant' || action === 'revoke', 'Ação inválida.');
  valid(typeof operatorLabel === 'string' && operatorLabel.trim().length >= 3 &&
    operatorLabel.length <= 1000 && !/[\u0000-\u001f\u007f]/.test(operatorLabel), 'Informe o motivo e o responsável pela operação.');
  return {userId, expectedEmail:expectedEmail.trim().toLowerCase(), action, operatorLabel:operatorLabel.trim()};
}

/**
 * Operator-only utility; never expose as an HTTP route.
 * Requires the existing commercial schema and a previously verified account ID.
 * Email is a second check, never an identity lookup or bootstrap mechanism.
 */
export async function provisionPlatformOperator(db, options) {
  const {userId, expectedEmail, action, operatorLabel} = validatedOptions(options);
  return db.$transaction(async tx => {
    // SQL text is constant; every value is bound as a parameter, never interpolated.
    const [user] = await tx.$queryRawUnsafe(
      'SELECT id,organization_id,email,active FROM ss_app_v1.users WHERE id=$1 FOR UPDATE', userId);
    valid(user?.active === true && user.email === expectedEmail,
      'Usuário existente, ativo e e-mail esperado não conferem. Nenhuma permissão foi alterada.');
    const [prior] = await tx.$queryRawUnsafe(
      'SELECT active FROM ss_app_v1.platform_operators WHERE user_id=$1', userId);
    const active = action === 'grant';
    const stamp = BigInt(Date.now());
    await tx.$executeRawUnsafe(
      'INSERT INTO ss_app_v1.platform_operators(user_id,active,created_at,created_by) VALUES ($1,$2,$3,$4) ON CONFLICT(user_id) DO UPDATE SET active=EXCLUDED.active,created_at=EXCLUDED.created_at,created_by=EXCLUDED.created_by',
      userId, active, stamp, operatorLabel);
    const reason = JSON.stringify({userId, expectedEmail, operatorLabel, previousActive:prior?.active ?? null, active});
    // External operator has no app session: never falsely attribute this to the target.
    await tx.$executeRawUnsafe(
      'INSERT INTO ss_app_v1.commercial_audit(id,organization_id,actor_id,action,reason,created_at) VALUES ($1,$2,NULL,$3,$4,$5)',
      randomUUID(), user.organization_id, 'platform_operator_' + action, reason, stamp);
    return {userId, action, active};
  });
}

const HELP = [
  'Administração da plataforma — executar somente no servidor autorizado.',
  '',
  'node scripts/platform-operator.mjs --user-id UUID --email EMAIL --action grant|revoke --reason "Responsável e motivo"',
  '',
  'Confira previamente o ID da conta existente e seu e-mail. O comando não cria usuários.',
  'Conceder/revogar altera apenas a administração global; não muda cargo, licença ou dados da empresa.',
  'A revisão comercial e suas tabelas devem estar instaladas antes da execução.',
  'Uma revogação explícita na tabela prevalece sobre a lista de administradores do ambiente.',
  '',
  'Banco: SS_DIARY_DATABASE_URL ou DATABASE_URL, já configurado no ambiente do provedor.',
  'Dependências opcionais: SS_DIARY_DEPENDENCIES = diretório com package.json e @prisma/client.',
  'Use o cliente Prisma já instalado no servidor. Não passe credenciais na linha de comando.',
  '--help mostra estas instruções sem carregar o cliente nem conectar ao banco.'
].join('\n');

function parseArgs(args) {
  const names = new Set(['--user-id', '--email', '--action', '--reason']);
  const values = Object.create(null);
  valid(args.length === 8, 'Argumentos incompletos.');
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i], value = args[i + 1];
    valid(names.has(key) && values[key] === undefined && typeof value === 'string' && !value.startsWith('--'),
      'Argumentos inválidos.');
    values[key] = value;
  }
  return validatedOptions({
    userId:values['--user-id'], expectedEmail:values['--email'],
    action:values['--action'], operatorLabel:values['--reason']
  });
}
async function main(args) {
  if (args.length === 1 && args[0] === '--help') {
    process.stdout.write(HELP + '\n');
    return;
  }
  let client;
  try {
    const options = parseArgs(args);
    const databaseUrl = process.env.SS_DIARY_DATABASE_URL || process.env.DATABASE_URL;
    valid(typeof databaseUrl === 'string' && /^postgres(?:ql)?:\/\//.test(databaseUrl),
      'Banco não configurado no ambiente.');
    const require = createRequire(process.env.SS_DIARY_DEPENDENCIES ?
      join(resolve(process.env.SS_DIARY_DEPENDENCIES), 'package.json') : import.meta.url);
    const {PrismaClient} = require('@prisma/client');
    client = new PrismaClient({datasources:{db:{url:databaseUrl}}, log:[], errorFormat:'minimal'});
    const result = await provisionPlatformOperator(client, options);
    process.stdout.write((result.active ? 'Administração da plataforma concedida' : 'Administração da plataforma revogada') + ' para o usuário ' + result.userId + '.\n');
  } catch {
    // Prisma errors can embed DSNs, credentials, SQL and personal data.
    // Never print the original error, stack, connection URL or environment.
    process.stderr.write('Operação não confirmada. Confira os argumentos, a conta existente e a configuração do servidor. Use --help.\n');
    process.exitCode = 1;
  } finally {
    if (client) {
      try { await client.$disconnect(); } catch {}
    }
  }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main(process.argv.slice(2));
}
