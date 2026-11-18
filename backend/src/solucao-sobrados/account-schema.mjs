export const workspaceSchema=[
'CREATE TABLE IF NOT EXISTS ss_app_v1.maintenance_photos (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES ss_app_v1.organizations(id), ticket_id TEXT NOT NULL, data BYTEA NOT NULL, bytes INTEGER NOT NULL CHECK(bytes>0), created_at BIGINT NOT NULL)',
'CREATE INDEX IF NOT EXISTS maintenance_photos_organization ON ss_app_v1.maintenance_photos(organization_id)',
'CREATE TABLE IF NOT EXISTS ss_app_v1.maintenance_photo_quota (id INTEGER PRIMARY KEY CHECK(id=1), bytes BIGINT NOT NULL DEFAULT 0 CHECK(bytes>=0))',
'INSERT INTO ss_app_v1.maintenance_photo_quota(id,bytes) VALUES(1,0) ON CONFLICT DO NOTHING',
'CREATE TABLE IF NOT EXISTS ss_app_v1.workspaces (organization_id TEXT PRIMARY KEY REFERENCES ss_app_v1.organizations(id), financial JSONB NOT NULL, maintenance JSONB NOT NULL, updated_at BIGINT NOT NULL)',
'CREATE TABLE IF NOT EXISTS ss_app_v1.board_links (board_id TEXT PRIMARY KEY REFERENCES ss_diary_v1.boards(id), organization_id TEXT NOT NULL REFERENCES ss_app_v1.organizations(id), project_id TEXT NOT NULL, UNIQUE(organization_id,project_id))',
'CREATE TABLE IF NOT EXISTS ss_app_v1.workspace_audit (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, user_id TEXT NOT NULL, action TEXT NOT NULL, subject TEXT NOT NULL, created_at BIGINT NOT NULL)'];

