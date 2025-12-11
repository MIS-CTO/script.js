-- ============================================
-- TO-DO SYSTEM MIGRATION
-- Führe diese Befehle in Supabase SQL Editor aus
-- ============================================

-- ============================================
-- 1. TASK_PROJECTS TABELLE - Deadline hinzufügen
-- ============================================

-- Prüfe ob deadline Spalte existiert, wenn nicht, füge sie hinzu
ALTER TABLE task_projects
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ DEFAULT NULL;

-- ============================================
-- 2. PROJECT_TASKS TABELLE - Erstellen/Aktualisieren
-- ============================================

-- Erstelle project_tasks Tabelle falls nicht existiert
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES task_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ DEFAULT NULL,
    completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Falls Tabelle existiert aber Spalten fehlen:
ALTER TABLE project_tasks
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE project_tasks
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

ALTER TABLE project_tasks
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE project_tasks
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index für schnellere Queries
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);

-- ============================================
-- 3. PROJECT_COLLABORATORS TABELLE - Erstellen
-- ============================================

-- Erstelle project_collaborators Tabelle falls nicht existiert
CREATE TABLE IF NOT EXISTS project_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES task_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Index für schnellere Queries
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);

-- ============================================
-- 4. RLS POLICIES für project_tasks
-- ============================================

-- Aktiviere RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Alle authentifizierten User können Tasks lesen
DROP POLICY IF EXISTS "Users can view project tasks" ON project_tasks;
CREATE POLICY "Users can view project tasks" ON project_tasks
    FOR SELECT USING (true);

-- Policy: Alle authentifizierten User können Tasks erstellen
DROP POLICY IF EXISTS "Users can create project tasks" ON project_tasks;
CREATE POLICY "Users can create project tasks" ON project_tasks
    FOR INSERT WITH CHECK (true);

-- Policy: Alle authentifizierten User können Tasks aktualisieren
DROP POLICY IF EXISTS "Users can update project tasks" ON project_tasks;
CREATE POLICY "Users can update project tasks" ON project_tasks
    FOR UPDATE USING (true);

-- Policy: Alle authentifizierten User können Tasks löschen
DROP POLICY IF EXISTS "Users can delete project tasks" ON project_tasks;
CREATE POLICY "Users can delete project tasks" ON project_tasks
    FOR DELETE USING (true);

-- ============================================
-- 5. RLS POLICIES für project_collaborators
-- ============================================

-- Aktiviere RLS
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Policy: Alle authentifizierten User können Collaborators sehen
DROP POLICY IF EXISTS "Users can view project collaborators" ON project_collaborators;
CREATE POLICY "Users can view project collaborators" ON project_collaborators
    FOR SELECT USING (true);

-- Policy: Alle authentifizierten User können Collaborators hinzufügen
DROP POLICY IF EXISTS "Users can create project collaborators" ON project_collaborators;
CREATE POLICY "Users can create project collaborators" ON project_collaborators
    FOR INSERT WITH CHECK (true);

-- Policy: Alle authentifizierten User können Collaborators aktualisieren
DROP POLICY IF EXISTS "Users can update project collaborators" ON project_collaborators;
CREATE POLICY "Users can update project collaborators" ON project_collaborators
    FOR UPDATE USING (true);

-- Policy: Alle authentifizierten User können Collaborators entfernen
DROP POLICY IF EXISTS "Users can delete project collaborators" ON project_collaborators;
CREATE POLICY "Users can delete project collaborators" ON project_collaborators
    FOR DELETE USING (true);

-- ============================================
-- 6. MIGRATION: Daten von project_members zu project_collaborators
-- (Falls project_members existiert und Daten hat)
-- ============================================

-- Optional: Migriere existierende Daten
-- INSERT INTO project_collaborators (project_id, user_id, role, created_at)
-- SELECT project_id, user_id,
--        CASE WHEN status = 'owner' THEN 'owner' ELSE 'member' END,
--        COALESCE(invited_at, NOW())
-- FROM project_members
-- WHERE status IN ('owner', 'accepted')
-- ON CONFLICT (project_id, user_id) DO NOTHING;

-- ============================================
-- FERTIG! Führe diese Migration aus bevor du das Frontend nutzt.
-- ============================================
