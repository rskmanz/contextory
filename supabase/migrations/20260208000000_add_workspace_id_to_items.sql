ALTER TABLE items ADD COLUMN IF NOT EXISTS workspace_id text REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_items_workspace ON items(workspace_id);
