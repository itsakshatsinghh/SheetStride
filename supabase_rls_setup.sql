-- ====================================================================
-- SheetStride Security Remediation: Row-Level Security (RLS) Configuration
-- Execute this script in your Supabase SQL Editor to secure database tables.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. SECURE THE user_progress TABLE
-- --------------------------------------------------------------------

-- Enable Row-Level Security on user_progress table
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplication errors
DROP POLICY IF EXISTS "Users can view their own progress records" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress records" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update their own progress records" ON public.user_progress;
DROP POLICY IF EXISTS "Users can delete their own progress records" ON public.user_progress;

-- SELECT policy: Users can only read progress logs belonging to their account
CREATE POLICY "Users can view their own progress records"
ON public.user_progress
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT policy: Users can only write completion logs for their authenticated ID
CREATE POLICY "Users can insert their own progress records"
ON public.user_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can only update their own progress logs (if needed)
CREATE POLICY "Users can update their own progress records"
ON public.user_progress
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can only delete (uncheck) progress logs for their own ID
CREATE POLICY "Users can delete their own progress records"
ON public.user_progress
FOR DELETE
USING (auth.uid() = user_id);


-- --------------------------------------------------------------------
-- 2. SECURE THE profiles TABLE (Extra Protection)
-- --------------------------------------------------------------------

-- Enable Row-Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- SELECT policy: Allow reading profiles publicly or for authenticated users
CREATE POLICY "Users can view any profile"
ON public.profiles
FOR SELECT
USING (true);

-- INSERT policy: Allow users to insert their own profile matching auth.uid()
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE policy: Allow users to update only their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- --------------------------------------------------------------------
-- 3. SECURE AND ENABLE PUBLIC READ ACCESS ON READ-ONLY MASTER TABLES
-- --------------------------------------------------------------------

-- Enable Row-Level Security on master tables
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_metadata ENABLE ROW LEVEL SECURITY;

-- Allow SELECT to everyone (public role covers both anon and authenticated)
DROP POLICY IF EXISTS "Allow select for all users" ON public.questions;
CREATE POLICY "Allow select for all users"
ON public.questions
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow select for all users" ON public.companies;
CREATE POLICY "Allow select for all users"
ON public.companies
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow select for all users" ON public.company_questions;
CREATE POLICY "Allow select for all users"
ON public.company_questions
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow select for all users" ON public.sheet_questions;
CREATE POLICY "Allow select for all users"
ON public.sheet_questions
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow select for all users" ON public.pattern_metadata;
CREATE POLICY "Allow select for all users"
ON public.pattern_metadata
FOR SELECT
TO public
USING (true);


-- ====================================================================
-- RLS verification: Run 'SELECT * FROM pg_policies;' to check active policies.
-- ====================================================================

-- ====================================================================
-- TRAINING GROUND MIGRATIONS (XP and Drill History Logs)
-- ====================================================================

-- 1. Add XP tracking column to user profile metadata
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 CHECK (xp >= 0);

-- 2. Drill History table for confusion matrices and progress tracking
CREATE TABLE IF NOT EXISTS public.drill_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES public.questions("ID") ON DELETE CASCADE,
    selected_pattern VARCHAR(100) NOT NULL,
    correct_pattern VARCHAR(100) NOT NULL,
    selected_signal VARCHAR(255) NOT NULL,
    reflection_chip VARCHAR(100),
    reflection_text TEXT,
    is_correct BOOLEAN GENERATED ALWAYS AS (selected_pattern = correct_pattern) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.drill_history ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own drill history
DROP POLICY IF EXISTS "Users can manage their own drill history" ON public.drill_history;
CREATE POLICY "Users can manage their own drill history" 
ON public.drill_history FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

