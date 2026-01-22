
-- SQL Schema for Supabase (PostgreSQL) - CTH SLA Platform
-- Project: cthsla (uhaqofhnfetdkciaswof)

-- 1. Table: Users
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('ADMIN', 'VIEWER')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Table: Units (Đơn vị)
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Table: Staff (Cán bộ)
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    unit_id TEXT REFERENCES public.units(id) ON DELETE SET NULL,
    position TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Table: Participant Groups (Nhóm thành phần)
CREATE TABLE IF NOT EXISTS public.participant_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Table: Endpoints (Điểm cầu)
CREATE TABLE IF NOT EXISTS public.endpoints (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'CONNECTING')),
    last_connected TEXT,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Table: Meetings (Cuộc họp)
CREATE TABLE IF NOT EXISTS public.meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    host_unit_name TEXT,
    chair_person_name TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    description TEXT,
    participants JSONB DEFAULT '[]',
    endpoints JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Table: System Settings (Cấu hình hệ thống)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'current',
    system_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    logo_base_64 TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 9. Simplified Policies for demo purposes (Allows anon access)
-- Xóa các policy cũ để tránh xung đột
DROP POLICY IF EXISTS "Enable all for anon" ON public.users;
DROP POLICY IF EXISTS "Enable all for anon" ON public.units;
DROP POLICY IF EXISTS "Enable all for anon" ON public.staff;
DROP POLICY IF EXISTS "Enable all for anon" ON public.participant_groups;
DROP POLICY IF EXISTS "Enable all for anon" ON public.meetings;
DROP POLICY IF EXISTS "Enable all for anon" ON public.endpoints;
DROP POLICY IF EXISTS "Enable all for anon" ON public.system_settings;

-- Tạo policy mới cho phép tất cả các thao tác
CREATE POLICY "Enable all for anon" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON public.units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON public.staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON public.participant_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON public.meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON public.endpoints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- 10. Default Data
INSERT INTO public.system_settings (id, system_name, short_name, primary_color)
VALUES ('current', 'ỦY BAN NHÂN DÂN TỈNH SƠN LA', 'HỘI NGHỊ TRỰC TUYẾN SƠN LA', '#3B82F6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, username, password, full_name, role) 
VALUES ('user-admin', 'admin', 'admin', 'System Administrator', 'ADMIN')
ON CONFLICT (username) DO NOTHING;
