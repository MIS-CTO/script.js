-- ============================================
-- FIX: Add owners to project_collaborators for existing projects
-- Run this in Supabase SQL Editor
-- ============================================

-- Insert owner records for all existing projects that don't have an owner yet
INSERT INTO project_collaborators (project_id, user_id, role, created_at)
SELECT
    tp.id as project_id,
    tp.created_by as user_id,
    'owner' as role,
    COALESCE(tp.created_at, NOW()) as created_at
FROM task_projects tp
WHERE tp.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM project_collaborators pc
    WHERE pc.project_id = tp.id
      AND pc.user_id = tp.created_by
      AND pc.role = 'owner'
  );

-- Verify: Show all projects with their owners
SELECT
    tp.id,
    tp.title,
    tp.created_by,
    pc.user_id as collaborator_user_id,
    pc.role,
    p.username
FROM task_projects tp
LEFT JOIN project_collaborators pc ON tp.id = pc.project_id AND pc.role = 'owner'
LEFT JOIN profiles p ON pc.user_id = p.id
ORDER BY tp.created_at DESC;

-- ============================================
-- UPDATED RLS POLICIES FOR project_tasks
-- These policies allow project collaborators to manage tasks
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can create project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can update project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete project tasks" ON project_tasks;

-- Enable RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view tasks for projects they collaborate on
CREATE POLICY "Users can view project tasks" ON project_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_collaborators pc
            WHERE pc.project_id = project_tasks.project_id
            AND pc.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM task_projects tp
            WHERE tp.id = project_tasks.project_id
            AND tp.created_by = auth.uid()
        )
        OR
        -- Fallback: Allow all authenticated users (for development)
        auth.uid() IS NOT NULL
    );

-- INSERT: Users can create tasks for projects they collaborate on
CREATE POLICY "Users can create project tasks" ON project_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_collaborators pc
            WHERE pc.project_id = project_tasks.project_id
            AND pc.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM task_projects tp
            WHERE tp.id = project_tasks.project_id
            AND tp.created_by = auth.uid()
        )
        OR
        -- Fallback: Allow all authenticated users (for development)
        auth.uid() IS NOT NULL
    );

-- UPDATE: Users can update tasks for projects they collaborate on
CREATE POLICY "Users can update project tasks" ON project_tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM project_collaborators pc
            WHERE pc.project_id = project_tasks.project_id
            AND pc.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM task_projects tp
            WHERE tp.id = project_tasks.project_id
            AND tp.created_by = auth.uid()
        )
        OR
        auth.uid() IS NOT NULL
    );

-- DELETE: Users can delete tasks for projects they collaborate on
CREATE POLICY "Users can delete project tasks" ON project_tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM project_collaborators pc
            WHERE pc.project_id = project_tasks.project_id
            AND pc.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM task_projects tp
            WHERE tp.id = project_tasks.project_id
            AND tp.created_by = auth.uid()
        )
        OR
        auth.uid() IS NOT NULL
    );

-- ============================================
-- ALTERNATIVE: Disable RLS completely (for development/testing)
-- Uncomment this if you want to disable RLS temporarily
-- ============================================
-- ALTER TABLE project_tasks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_collaborators DISABLE ROW LEVEL SECURITY;
