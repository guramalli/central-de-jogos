// Commercial data is separate from each customer's construction finances.
export const commercialSchema = [
`CREATE TABLE IF NOT EXISTS ss_app_v1.commercial_migrations (id TEXT PRIMARY KEY, created_at BIGINT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS ss_app_v1.platform_operators (user_id TEXT PRIMARY KEY REFERENCES ss_app_v1.users(id), active BOOLEAN NOT NULL DEFAULT TRUE, created_at BIGINT NOT NULL, created_by TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS ss_app_v1.commercial_licenses (
 organization_id TEXT PRIMARY KEY REFERENCES ss_app_v1.organizations(id), mode TEXT NOT NULL CHECK(mode IN ('legacy','pending_setup','trial','subscription')),
 trial_started_at BIGINT, trial_ends_at BIGINT, paid_until BIGINT, manual_until BIGINT, suspended BOOLEAN NOT NULL DEFAULT FALSE,
 created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS ss_app_v1.commercial_subscriptions (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES ss_app_v1.organizations(id), reference TEXT NOT NULL UNIQUE,
 provider_id TEXT UNIQUE, status TEXT NOT NULL, checkout_url TEXT, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL)`,
`CREATE UNIQUE INDEX IF NOT EXISTS commercial_one_live_subscription ON ss_app_v1.commercial_subscriptions(organization_id) WHERE status IN ('creating','pending','authorized','paused')`,
`CREATE TABLE IF NOT EXISTS ss_app_v1.commercial_payments (
 provider_id TEXT PRIMARY KEY, subscription_id TEXT NOT NULL REFERENCES ss_app_v1.commercial_subscriptions(id), organization_id TEXT NOT NULL REFERENCES ss_app_v1.organizations(id),
 status TEXT NOT NULL, amount_cents INTEGER NOT NULL, currency TEXT NOT NULL, approved_at BIGINT, period_end BIGINT, provider_updated_at BIGINT NOT NULL, updated_at BIGINT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS ss_app_v1.commercial_events (id TEXT PRIMARY KEY, type TEXT NOT NULL, provider_id TEXT NOT NULL, status TEXT NOT NULL, received_at BIGINT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS ss_app_v1.commercial_audit (id TEXT PRIMARY KEY, organization_id TEXT REFERENCES ss_app_v1.organizations(id), actor_id TEXT REFERENCES ss_app_v1.users(id), action TEXT NOT NULL, reason TEXT NOT NULL, created_at BIGINT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS ss_app_v1.support_tickets (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES ss_app_v1.organizations(id), user_id TEXT NOT NULL REFERENCES ss_app_v1.users(id),
 title TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('bug','suggestion','question')), status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved')),
 created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS ss_app_v1.support_messages (
 id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL REFERENCES ss_app_v1.support_tickets(id), user_id TEXT NOT NULL REFERENCES ss_app_v1.users(id),
 body TEXT NOT NULL, from_operator BOOLEAN NOT NULL, created_at BIGINT NOT NULL)`,
`CREATE INDEX IF NOT EXISTS support_owner ON ss_app_v1.support_tickets(user_id,updated_at)`,
`CREATE INDEX IF NOT EXISTS commercial_payments_company ON ss_app_v1.commercial_payments(organization_id,status)`
];

// A durable marker and snapshot in ONE transaction: organizations created after the
// first installation can never become legacy merely because the server restarted.
export async function initializeCommercial(db, {now = Date.now} = {}) {
 for (const sql of commercialSchema) await db.$executeRawUnsafe(sql);
 await db.$transaction(async tx => {
  const stamp = BigInt(now());
  const inserted = await tx.$queryRaw`INSERT INTO ss_app_v1.commercial_migrations(id,created_at) VALUES ('legacy-snapshot-v1',${stamp}) ON CONFLICT DO NOTHING RETURNING id`;
  if (inserted.length) await tx.$executeRaw`INSERT INTO ss_app_v1.commercial_licenses(organization_id,mode,created_at,updated_at) SELECT id,'legacy',${stamp},${stamp} FROM ss_app_v1.organizations ON CONFLICT DO NOTHING`;
 });
}
