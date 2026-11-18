import {createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';

const scrypt = promisify(scryptCallback);
const ROLES = new Set(['admin', 'manager', 'maintenance']);
const SESSION_MS = 7 * 86400000, INVITATION_MS = 3 * 86400000;
const SCRYPT = {N:16384, r:8, p:1, maxmem:32 * 1024 * 1024};
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export class IdentityError extends Error {
  constructor(message, status = 422) { super(message); this.name = 'IdentityError'; this.status = status; }
}
const requireThat = (condition, message, status) => { if (!condition) throw new IdentityError(message, status); };
const digest = value => createHash('sha256').update(value).digest('hex');
const clean = (value, label, max = 150) => {
  requireThat(typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value), `${label}: preencha até ${max} caracteres.`);
  return value.trim();
};
const emailAddress = value => {
  const email = clean(value, 'E-mail', 254).toLowerCase();
  requireThat(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Informe um e-mail válido.');
  return email;
};
const passwordInput = value => {
  requireThat(typeof value === 'string' && value.length >= 12 && value.length <= 128 && Buffer.byteLength(value, 'utf8') <= 512, 'A senha deve ter entre 12 e 128 caracteres.');
  return value;
};
const tokenDigest = token => {
  requireThat(typeof token === 'string' && TOKEN.test(token), 'Acesso inválido ou expirado.', 401);
  return digest(token);
};
const publicUser = user => ({id:user.id, organizationId:user.organization_id, name:user.name, email:user.email, role:user.role, active:user.active, revision:Number(user.revision)});
const uniqueViolation = error => error?.code === '23505' || error?.code === 'P2002' || error?.meta?.code === '23505' || error?.cause?.code === '23505';

// Bound CPU/memory work as well as persistent request limits. This queue is not an authentication throttle.
let activeHashes = 0;
const hashWaiters = [];
async function derive(password, salt) {
  if (activeHashes >= 4) {
    requireThat(hashWaiters.length < 24, 'Acesso ocupado. Tente novamente em instantes.', 503);
    await new Promise(resolve => hashWaiters.push(resolve));
  } else activeHashes++;
  try { return await scrypt(password, salt, 64, SCRYPT); }
  finally { const next = hashWaiters.shift(); if (next) next(); else activeHashes--; }
}
export async function hashPassword(password) {
  passwordInput(password);
  const salt = randomBytes(16), key = await derive(password, salt);
  return `scrypt$16384$8$1$${salt.toString('hex')}$${key.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  passwordInput(password);
  const match = typeof encoded === 'string' && /^scrypt\$16384\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(encoded);
  // Missing users and unsupported hashes still perform the same bounded password derivation.
  const key = await derive(password, match ? Buffer.from(match[1], 'hex') : Buffer.alloc(16));
  return Boolean(match) && timingSafeEqual(key, Buffer.from(match[2], 'hex'));
}

export const identitySchema = [
  'CREATE SCHEMA IF NOT EXISTS ss_app_v1',
  'CREATE TABLE IF NOT EXISTS ss_app_v1.organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at BIGINT NOT NULL)',
  "CREATE TABLE IF NOT EXISTS ss_app_v1.users (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES ss_app_v1.organizations(id), name TEXT NOT NULL, email TEXT NOT NULL UNIQUE CHECK(email=lower(btrim(email))), password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','manager','maintenance')), active BOOLEAN NOT NULL DEFAULT TRUE, revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0), created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL)",
  'CREATE INDEX IF NOT EXISTS identity_users_org ON ss_app_v1.users(organization_id)',
  'CREATE TABLE IF NOT EXISTS ss_app_v1.sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES ss_app_v1.users(id), token_hash TEXT NOT NULL UNIQUE, created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL, revoked_at BIGINT)',
  'CREATE INDEX IF NOT EXISTS identity_sessions_user ON ss_app_v1.sessions(user_id)',
  "CREATE TABLE IF NOT EXISTS ss_app_v1.invitations (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES ss_app_v1.organizations(id), token_hash TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK(role IN ('manager','maintenance')), email TEXT, name TEXT NOT NULL DEFAULT '', invited_by TEXT NOT NULL REFERENCES ss_app_v1.users(id), created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL, accepted_at BIGINT, accepted_user_id TEXT REFERENCES ss_app_v1.users(id), revoked_at BIGINT)",
  'CREATE INDEX IF NOT EXISTS identity_invitations_org ON ss_app_v1.invitations(organization_id)',
  'CREATE TABLE IF NOT EXISTS ss_app_v1.identity_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL CHECK(hits>0), expires_at BIGINT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS identity_limits_expiry ON ss_app_v1.identity_limits(expires_at)',
  "CREATE TABLE IF NOT EXISTS ss_app_v1.identity_audit (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES ss_app_v1.organizations(id), actor_user_id TEXT NOT NULL REFERENCES ss_app_v1.users(id), action TEXT NOT NULL, subject TEXT NOT NULL, details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at BIGINT NOT NULL)"
];
export async function migrateIdentity(db) { for (const sql of identitySchema) await db.$executeRawUnsafe(sql); }

// Call with the authenticated server actor, never an actor supplied in a request body.
export async function revalidateActor(db, actor, roles = []) {
  requireThat(actor && ID.test(actor.id || '') && ID.test(actor.organizationId || ''), 'Entre novamente para continuar.', 401);
  const [user] = await db.$queryRaw`SELECT id,organization_id,name,email,role,active,revision FROM ss_app_v1.users WHERE id=${actor.id} AND organization_id=${actor.organizationId}`;
  requireThat(user?.active === true && ROLES.has(user.role), 'Acesso revogado. Entre novamente.', 401);
  requireThat(!roles.length || roles.includes(user.role), 'Seu cargo não permite esta ação.', 403);
  return publicUser(user);
}

export class IdentityService {
  constructor(db, {now = Date.now} = {}) { this.db = db; this.now = now; }
  async audit(tx, user, action, subject, details = {}) {
    await tx.$executeRaw`INSERT INTO ss_app_v1.identity_audit(id,organization_id,actor_user_id,action,subject,details,created_at) VALUES(${randomUUID()},${user.organizationId},${user.id},${action},${subject},${JSON.stringify(details)}::jsonb,${BigInt(this.now())})`;
  }
  async throttle(kind, principal, limit, windowMs) {
    const now = this.now(), bucket = Math.floor(now / windowMs), key = digest(`${kind}:${principal}:${bucket}`);
    // Expired buckets are reclaimed in small bounded batches; failed attempts still consume capacity.
    await this.db.$executeRaw`DELETE FROM ss_app_v1.identity_limits WHERE key IN (SELECT key FROM ss_app_v1.identity_limits WHERE expires_at<=${BigInt(now)} ORDER BY expires_at LIMIT 100)`;
    const rows = await this.db.$queryRaw`INSERT INTO ss_app_v1.identity_limits(key,hits,expires_at) VALUES(${key},1,${BigInt((bucket + 1) * windowMs)}) ON CONFLICT(key) DO UPDATE SET hits=ss_app_v1.identity_limits.hits+1 WHERE ss_app_v1.identity_limits.hits<${limit} RETURNING hits`;
    requireThat(rows.length > 0, 'Muitas tentativas. Aguarde antes de tentar novamente.', 429);
  }
  ipKey(ip) { return typeof ip === 'string' ? ip.slice(0, 200) : 'unknown'; }
  async session(tx, row) {
    const user = publicUser(row), token = randomBytes(32).toString('base64url'), id = randomUUID(), now = this.now();
    await tx.$executeRaw`INSERT INTO ss_app_v1.sessions(id,user_id,token_hash,created_at,expires_at) VALUES(${id},${user.id},${digest(token)},${BigInt(now)},${BigInt(now + SESSION_MS)})`;
    return {id, token, user};
  }
  async register(input, ip) {
    requireThat(input && typeof input === 'object', 'Dados de cadastro inválidos.');
    const name = clean(input.name, 'Nome'), email = emailAddress(input.email), password = passwordInput(input.password), organizationName = clean(input.organizationName, 'Empresa');
    await this.throttle('registration-ip', this.ipKey(ip), 5, 86400000);
    const passwordHash = await hashPassword(password);
    try {
      return await this.db.$transaction(async tx => {
        const organizationId = randomUUID(), userId = randomUUID(), now = BigInt(this.now());
        await tx.$executeRaw`INSERT INTO ss_app_v1.organizations(id,name,created_at) VALUES(${organizationId},${organizationName},${now})`;
        const [row] = await tx.$queryRaw`INSERT INTO ss_app_v1.users(id,organization_id,name,email,password_hash,role,created_at,updated_at) VALUES(${userId},${organizationId},${name},${email},${passwordHash},'admin',${now},${now}) RETURNING *`;
        const {token, user} = await this.session(tx, row);
        await this.audit(tx, user, 'identity.register', user.id);
        return {token, user};
      });
    } catch (error) {
      if (uniqueViolation(error)) throw new IdentityError('Não foi possível cadastrar este e-mail. Use o acesso existente ou outro e-mail.', 409);
      throw error;
    }
  }
  async login(input, ip) {
    requireThat(input && typeof input === 'object', 'Dados de acesso inválidos.');
    const email = emailAddress(input.email), password = passwordInput(input.password);
    await this.throttle('login-ip', this.ipKey(ip), 60, 900000);
    await this.throttle('login-email', email, 12, 900000);
    const [known] = await this.db.$queryRaw`SELECT * FROM ss_app_v1.users WHERE email=${email}`;
    const valid = await verifyPassword(password, known?.password_hash);
    requireThat(valid && known?.active === true && ROLES.has(known.role), 'E-mail ou senha inválidos.', 401);
    return this.db.$transaction(async tx => {
      const [current] = await tx.$queryRaw`SELECT * FROM ss_app_v1.users WHERE id=${known.id} FOR UPDATE`;
      requireThat(current?.active === true && current.password_hash === known.password_hash && ROLES.has(current.role), 'E-mail ou senha inválidos.', 401);
      const {id, token, user} = await this.session(tx, current);
      await this.audit(tx, user, 'identity.login', id);
      return {token, user};
    });
  }
  async authenticate(token) {
    const hash = tokenDigest(token);
    const [row] = await this.db.$queryRaw`SELECT u.*,s.expires_at AS session_expires_at,s.revoked_at AS session_revoked_at FROM ss_app_v1.sessions s JOIN ss_app_v1.users u ON u.id=s.user_id WHERE s.token_hash=${hash}`;
    requireThat(row?.active === true && ROLES.has(row.role) && row.session_revoked_at === null && Number(row.session_expires_at) > this.now(), 'Acesso inválido ou expirado. Entre novamente.', 401);
    return publicUser(row);
  }
  async logout(token) {
    const hash = tokenDigest(token);
    return this.db.$transaction(async tx => {
      const [row] = await tx.$queryRaw`SELECT u.*,s.id AS session_id FROM ss_app_v1.sessions s JOIN ss_app_v1.users u ON u.id=s.user_id WHERE s.token_hash=${hash} AND s.revoked_at IS NULL`;
      if (row) {
        const changed = await tx.$executeRaw`UPDATE ss_app_v1.sessions SET revoked_at=${BigInt(this.now())} WHERE id=${row.session_id} AND revoked_at IS NULL`;
        if (changed) await this.audit(tx, publicUser(row), 'identity.logout', row.session_id);
      }
      return {ok:true};
    });
  }
  async admin(tx, actor) {
    requireThat(actor && ID.test(actor.organizationId || ''), 'Entre novamente para continuar.', 401);
    // Serialize organization membership changes, including concurrent last-administrator changes.
    const rows = await tx.$queryRaw`SELECT id FROM ss_app_v1.organizations WHERE id=${actor.organizationId} FOR UPDATE`;
    requireThat(rows.length > 0, 'Entre novamente para continuar.', 401);
    return revalidateActor(tx, actor, ['admin']);
  }
  async listUsers(actor) {
    const admin = await revalidateActor(this.db, actor, ['admin']);
    const rows = await this.db.$queryRaw`SELECT id,organization_id,name,email,role,active,revision FROM ss_app_v1.users WHERE organization_id=${admin.organizationId} ORDER BY lower(name),id`;
    return rows.map(publicUser);
  }
  async invite(actor, input) {
    requireThat(input && typeof input === 'object' && ['manager', 'maintenance'].includes(input.role), 'Escolha Gestor ou Equipe de manutenção.');
    const email = input.email ? emailAddress(input.email) : null, name = input.name ? clean(input.name, 'Nome') : '';
    return this.db.$transaction(async tx => {
      const admin = await this.admin(tx, actor), now = this.now();
      const [count] = await tx.$queryRaw`SELECT count(*)::int AS n FROM ss_app_v1.invitations WHERE organization_id=${admin.organizationId} AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>${BigInt(now)}`;
      requireThat(count.n < 100, 'Há 100 convites pendentes. Aguarde o aceite ou a expiração.', 429);
      const token = randomBytes(32).toString('base64url'), id = randomUUID(), expiresAt = now + INVITATION_MS;
      await tx.$executeRaw`INSERT INTO ss_app_v1.invitations(id,organization_id,token_hash,role,email,name,invited_by,created_at,expires_at) VALUES(${id},${admin.organizationId},${digest(token)},${input.role},${email},${name},${admin.id},${BigInt(now)},${BigInt(expiresAt)})`;
      await this.audit(tx, admin, 'identity.invite', id, {role:input.role});
      return {token, expiresAt};
    });
  }
  async acceptInvite(input, ip) {
    requireThat(input && typeof input === 'object', 'Dados do convite inválidos.');
    const hash = tokenDigest(input.token), name = clean(input.name, 'Nome'), email = emailAddress(input.email), password = passwordInput(input.password);
    await this.throttle('invite-ip', this.ipKey(ip), 20, 3600000);
    // Reject invalid links before expensive hashing, then recheck atomically before consuming.
    const [candidate] = await this.db.$queryRaw`SELECT * FROM ss_app_v1.invitations WHERE token_hash=${hash}`;
    this.validInvitation(candidate, email);
    const passwordHash = await hashPassword(password);
    try {
      return await this.db.$transaction(async tx => {
        // Use the same organization-first lock order as administrator changes.
        await tx.$queryRaw`SELECT id FROM ss_app_v1.organizations WHERE id=${candidate.organization_id} FOR UPDATE`;
        const [invitation] = await tx.$queryRaw`SELECT * FROM ss_app_v1.invitations WHERE token_hash=${hash} FOR UPDATE`;
        this.validInvitation(invitation, email);
        const [issuer] = await tx.$queryRaw`SELECT active,role FROM ss_app_v1.users WHERE id=${invitation.invited_by} AND organization_id=${invitation.organization_id}`;
        requireThat(issuer?.active === true && issuer.role === 'admin', 'Convite inválido ou expirado. Solicite um novo convite.', 401);
        const id = randomUUID(), now = BigInt(this.now());
        const [row] = await tx.$queryRaw`INSERT INTO ss_app_v1.users(id,organization_id,name,email,password_hash,role,created_at,updated_at) VALUES(${id},${invitation.organization_id},${name},${email},${passwordHash},${invitation.role},${now},${now}) RETURNING *`;
        await tx.$executeRaw`UPDATE ss_app_v1.invitations SET accepted_at=${now},accepted_user_id=${id} WHERE id=${invitation.id}`;
        const {token, user} = await this.session(tx, row);
        await this.audit(tx, user, 'identity.accept-invite', invitation.id);
        return {token, user};
      });
    } catch (error) {
      if (uniqueViolation(error)) throw new IdentityError('Não foi possível cadastrar este e-mail. Use o acesso existente ou outro e-mail.', 409);
      throw error;
    }
  }
  validInvitation(invitation, email) {
    requireThat(invitation && invitation.accepted_at === null && invitation.revoked_at === null && Number(invitation.expires_at) > this.now() && ['manager', 'maintenance'].includes(invitation.role), 'Convite inválido ou expirado. Solicite um novo convite.', 401);
    requireThat(!invitation.email || invitation.email === email, 'O convite foi destinado a outro e-mail.', 403);
  }
  async updateUser(actor, input) {
    requireThat(input && ID.test(input.id || '') && ROLES.has(input.role) && typeof input.active === 'boolean' && Number.isSafeInteger(input.revision) && input.revision >= 0, 'Dados do usuário inválidos.');
    return this.db.$transaction(async tx => {
      const admin = await this.admin(tx, actor);
      const [target] = await tx.$queryRaw`SELECT * FROM ss_app_v1.users WHERE id=${input.id} AND organization_id=${admin.organizationId} FOR UPDATE`;
      requireThat(target, 'Usuário não encontrado nesta empresa.', 404);
      requireThat(target.revision === input.revision, 'O usuário foi alterado. Atualize antes de salvar.', 409);
      if (target.role === input.role && target.active === input.active) return publicUser(target);
      if (target.role === 'admin' && target.active && (input.role !== 'admin' || !input.active)) {
        const [count] = await tx.$queryRaw`SELECT count(*)::int AS n FROM ss_app_v1.users WHERE organization_id=${admin.organizationId} AND active=TRUE AND role='admin'`;
        requireThat(count.n > 1, 'Mantenha pelo menos um administrador ativo na empresa.', 409);
      }
      const now = BigInt(this.now());
      const [row] = await tx.$queryRaw`UPDATE ss_app_v1.users SET role=${input.role},active=${input.active},revision=revision+1,updated_at=${now} WHERE id=${target.id} AND organization_id=${admin.organizationId} RETURNING *`;
      await tx.$executeRaw`UPDATE ss_app_v1.sessions SET revoked_at=${now} WHERE user_id=${target.id} AND revoked_at IS NULL`;
      // Invitations issued under old administrator authority must not revive after a later promotion.
      if (target.role === 'admin' && (input.role !== 'admin' || !input.active)) await tx.$executeRaw`UPDATE ss_app_v1.invitations SET revoked_at=${now} WHERE invited_by=${target.id} AND accepted_at IS NULL AND revoked_at IS NULL`;
      await this.audit(tx, admin, 'identity.update-user', target.id, {before:{role:target.role,active:target.active},after:{role:row.role,active:row.active},revision:row.revision});
      return publicUser(row);
    });
  }
}
