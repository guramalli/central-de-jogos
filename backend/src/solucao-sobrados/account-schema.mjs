export const workspaceSchema=[
'CREATE TABLE IF NOT EXISTS ss_app_v1.workspaces (organization_id TEXT PRIMARY KEY REFERENCES ss_app_v1.organizations(id), financial JSONB NOT NULL, maintenance JSONB NOT NULL, updated_at BIGINT NOT NULL)',
'CREATE TABLE IF NOT EXISTS ss_app_v1.board_links (board_id TEXT PRIMARY KEY REFERENCES ss_diary_v1.boards(id), organization_id TEXT NOT NULL REFERENCES ss_app_v1.organizations(id), project_id TEXT NOT NULL, UNIQUE(organization_id,project_id))',
'CREATE TABLE IF NOT EXISTS ss_app_v1.workspace_audit (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, user_id TEXT NOT NULL, action TEXT NOT NULL, subject TEXT NOT NULL, created_at BIGINT NOT NULL)'];
