-- Contextory - Supabase Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. User Profiles (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  ai_provider text DEFAULT 'openai',
  ai_model text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. Core Tables
-- ============================================

CREATE TABLE projects (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '',
  gradient text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE workspaces (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_item_id text,
  category text,
  category_icon text,
  type text,
  resources jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE contexts (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '',
  type text CHECK (type IN ('tree', 'board', 'canvas')),
  view_style text NOT NULL DEFAULT 'list',
  scope text NOT NULL DEFAULT 'local',
  project_id text REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id text REFERENCES workspaces(id) ON DELETE CASCADE,
  object_ids text[] DEFAULT '{}',
  markdown_id text,
  data jsonb DEFAULT '{"nodes":[],"edges":[]}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE objects (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '',
  type text,
  category text,
  built_in boolean DEFAULT false,
  available_global boolean DEFAULT false,
  available_in_projects text[] DEFAULT '{}',
  available_in_workspaces text[] DEFAULT '{}',
  fields jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE items (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  object_id text REFERENCES objects(id) ON DELETE CASCADE,
  context_id text REFERENCES contexts(id) ON DELETE SET NULL,
  project_id text REFERENCES projects(id) ON DELETE SET NULL,
  workspace_id text REFERENCES projects(id) ON DELETE SET NULL,
  name text NOT NULL,
  markdown_id text,
  view_layout text DEFAULT 'visualization',
  context_data jsonb,
  field_values jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE markdown_content (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('items', 'contexts')),
  content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE pinned_object_tabs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  object_id text NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  position integer NOT NULL,
  PRIMARY KEY (user_id, object_id)
);

CREATE TABLE connections (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  url text,
  config jsonb DEFAULT '{}',
  icon text,
  scope text NOT NULL DEFAULT 'global',
  workspace_id text REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id text REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. Row Level Security
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE markdown_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_object_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_data" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON workspaces FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON contexts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON objects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON markdown_content FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON pinned_object_tabs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON connections FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. Indexes
-- ============================================

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_workspaces_project ON workspaces(project_id);
CREATE INDEX idx_workspaces_user ON workspaces(user_id);
CREATE INDEX idx_contexts_workspace ON contexts(workspace_id);
CREATE INDEX idx_contexts_user ON contexts(user_id);
CREATE INDEX idx_items_object ON items(object_id);
CREATE INDEX idx_items_project ON items(project_id);
CREATE INDEX idx_items_workspace ON items(workspace_id);
CREATE INDEX idx_items_user ON items(user_id);
CREATE INDEX idx_objects_user ON objects(user_id);
CREATE INDEX idx_markdown_user ON markdown_content(user_id);
CREATE INDEX idx_connections_user ON connections(user_id);
CREATE INDEX idx_connections_scope ON connections(scope);
