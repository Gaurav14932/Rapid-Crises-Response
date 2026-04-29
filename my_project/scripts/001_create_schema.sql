-- CrisisLink AI Database Schema
-- Emergency Response Coordination Platform

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- PROFILES TABLE (linked to auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'responder', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(new.raw_user_meta_data ->> 'role', 'citizen')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RESPONDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.responders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('police', 'ambulance', 'fire', 'volunteer')),
  phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'offline')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.responders ENABLE ROW LEVEL SECURITY;

-- Anyone can view responders (needed for map display)
CREATE POLICY "responders_select_all" ON public.responders FOR SELECT TO authenticated USING (true);
-- Only admins can insert/update/delete responders
CREATE POLICY "responders_insert_admin" ON public.responders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "responders_update_admin" ON public.responders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "responders_delete_admin" ON public.responders FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- EMERGENCY CASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.emergency_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('fire', 'medical', 'accident', 'crime', 'flood', 'women_safety', 'other')),
  description TEXT,
  severity INTEGER DEFAULT 3 CHECK (severity >= 1 AND severity <= 5),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'assigned', 'en_route', 'on_scene', 'resolved', 'cancelled')),
  media_url TEXT,
  reporter_name TEXT,
  reporter_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.emergency_cases ENABLE ROW LEVEL SECURITY;

-- Users can view their own cases
CREATE POLICY "cases_select_own" ON public.emergency_cases FOR SELECT USING (auth.uid() = user_id);
-- Admins and responders can view all cases
CREATE POLICY "cases_select_staff" ON public.emergency_cases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'responder'))
);
-- Anyone authenticated can create a case
CREATE POLICY "cases_insert_auth" ON public.emergency_cases FOR INSERT TO authenticated WITH CHECK (true);
-- Users can update their own cases
CREATE POLICY "cases_update_own" ON public.emergency_cases FOR UPDATE USING (auth.uid() = user_id);
-- Admins can update any case
CREATE POLICY "cases_update_admin" ON public.emergency_cases FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.emergency_cases(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES public.responders(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  eta_minutes INTEGER,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'en_route', 'arrived', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Staff can view all assignments
CREATE POLICY "assignments_select_staff" ON public.assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'responder'))
);
-- Users can view assignments for their cases
CREATE POLICY "assignments_select_own" ON public.assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.emergency_cases WHERE id = case_id AND user_id = auth.uid())
);
-- Admins can manage assignments
CREATE POLICY "assignments_insert_admin" ON public.assignments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "assignments_update_admin" ON public.assignments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'alert', 'success')),
  read BOOLEAN DEFAULT FALSE,
  case_id UUID REFERENCES public.emergency_cases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_system" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_emergency_cases_status ON public.emergency_cases(status);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_type ON public.emergency_cases(type);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_severity ON public.emergency_cases(severity);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_user_id ON public.emergency_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_responders_availability ON public.responders(availability);
CREATE INDEX IF NOT EXISTS idx_responders_unit_type ON public.responders(unit_type);
CREATE INDEX IF NOT EXISTS idx_assignments_case_id ON public.assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_assignments_responder_id ON public.assignments(responder_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
