-- ============================================
-- FIX: Add auth_user_id mapping to profiles table
-- This links Supabase Auth users with profile records
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add auth_user_id column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);

-- Step 3: Create a function to get profile_id from auth.uid()
CREATE OR REPLACE FUNCTION get_profile_id_from_auth()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM profiles
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATED RLS POLICIES FOR project_tasks
-- These policies use the new auth_user_id mapping
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can create project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can update project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete project tasks" ON project_tasks;

-- Enable RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: Allow all authenticated users to view project tasks
CREATE POLICY "Users can view project tasks" ON project_tasks
    FOR SELECT USING (
        -- Check if user is a collaborator (via auth_user_id mapping)
        EXISTS (
            SELECT 1 FROM project_collaborators pc
            JOIN profiles p ON pc.user_id = p.id
            WHERE pc.project_id = project_tasks.project_id
            AND p.auth_user_id = auth.uid()
        )
        OR
        -- Check if user is the project creator (via auth_user_id mapping)
        EXISTS (
            SELECT 1 FROM task_projects tp
            JOIN profiles p ON tp.created_by = p.id
            WHERE tp.id = project_tasks.project_id
            AND p.auth_user_id = auth.uid()
        )
        OR
        -- Fallback: Allow all authenticated users (for development)
        auth.uid() IS NOT NULL
    );

-- INSERT: Allow authenticated users to create tasks
CREATE POLICY "Users can create project tasks" ON project_tasks
    FOR INSERT WITH CHECK (
        -- Check if user is a collaborator
        EXISTS (
            SELECT 1 FROM project_collaborators pc
            JOIN profiles p ON pc.user_id = p.id
            WHERE pc.project_id = project_tasks.project_id
            AND p.auth_user_id = auth.uid()
        )
        OR
        -- Check if user is the project creator
        EXISTS (
            SELECT 1 FROM task_projects tp
            JOIN profiles p ON tp.created_by = p.id
            WHERE tp.id = project_tasks.project_id
            AND p.auth_user_id = auth.uid()
        )
        OR
        -- Fallback: Allow all authenticated users (for development)
        auth.uid() IS NOT NULL
    );

-- UPDATE: Allow authenticated users to update tasks
CREATE POLICY "Users can update project tasks" ON project_tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM project_collaborators pc
            JOIN profiles p ON pc.user_id = p.id
            WHERE pc.project_id = project_tasks.project_id
            AND p.auth_user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM task_projects tp
            JOIN profiles p ON tp.created_by = p.id
            WHERE tp.id = project_tasks.project_id
            AND p.auth_user_id = auth.uid()
        )
        OR
        auth.uid() IS NOT NULL
    );

-- DELETE: Allow authenticated users to delete tasks
CREATE POLICY "Users can delete project tasks" ON project_tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM project_collaborators pc
            JOIN profiles p ON pc.user_id = p.id
            WHERE pc.project_id = project_tasks.project_id
            AND p.auth_user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM task_projects tp
            JOIN profiles p ON tp.created_by = p.id
            WHERE tp.id = project_tasks.project_id
            AND p.auth_user_id = auth.uid()
        )
        OR
        auth.uid() IS NOT NULL
    );

-- ============================================
-- RLS POLICIES FOR project_collaborators
-- ============================================

DROP POLICY IF EXISTS "Users can view collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Users can add collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Users can remove collaborators" ON project_collaborators;

ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view, add, and remove collaborators
CREATE POLICY "Users can view collaborators" ON project_collaborators
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can add collaborators" ON project_collaborators
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can remove collaborators" ON project_collaborators
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- RLS POLICIES FOR task_projects
-- ============================================

DROP POLICY IF EXISTS "Users can view projects" ON task_projects;
DROP POLICY IF EXISTS "Users can create projects" ON task_projects;
DROP POLICY IF EXISTS "Users can update projects" ON task_projects;
DROP POLICY IF EXISTS "Users can delete projects" ON task_projects;

ALTER TABLE task_projects ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users
CREATE POLICY "Users can view projects" ON task_projects
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create projects" ON task_projects
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update projects" ON task_projects
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete projects" ON task_projects
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- VERIFICATION: Check the new column
-- ============================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'auth_user_id';
