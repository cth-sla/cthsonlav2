
-- SQL Schema for Supabase (PostgreSQL) - CTH SLA Platform
-- Project: cthsla (uhaqofhnfetdkciaswof)

-- 1. Table: Users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 4. Table: Endpoints (Điểm cầu)
CREATE TABLE IF NOT EXISTS public.endpoints (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'CONNECTING')),
    last_connected TEXT,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Table: Meetings (Cuộc họp)
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

-- 6. Table: Meeting Participants (Thành phần tham dự chi tiết)
CREATE TABLE IF NOT EXISTS public.meeting_participants (
    id BIGSERIAL PRIMARY KEY,
    meeting_id TEXT NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Table: Meeting Endpoints (Liên kết Điểm cầu cho từng Cuộc họp)
CREATE TABLE IF NOT EXISTS public.meeting_endpoints (
    meeting_id TEXT NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    endpoint_id TEXT NOT NULL REFERENCES public.endpoints(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (meeting_id, endpoint_id)
);

-- 8. Table: System Settings (Cấu hình hệ thống)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'current',
    system_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    logo_base_64 TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 10. Basic Policies (Select for all)
CREATE POLICY "Public read access users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public read access units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Public read access staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Public read access meetings" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Public read access endpoints" ON public.endpoints FOR SELECT USING (true);
CREATE POLICY "Public read access participants" ON public.meeting_participants FOR SELECT USING (true);
CREATE POLICY "Public read access meeting_endpoints" ON public.meeting_endpoints FOR SELECT USING (true);
CREATE POLICY "Public read access settings" ON public.system_settings FOR SELECT USING (true);

-- 11. Admin Policies (Full access)
CREATE POLICY "Admins manage participants" ON public.meeting_participants FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins manage meeting_endpoints" ON public.meeting_endpoints FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.system_settings FOR ALL TO authenticated USING (true);

-- 12. Default Admin Initialization
INSERT INTO public.users (username, password, full_name, role) 
VALUES ('admin', 'admin', 'System Administrator', 'ADMIN')
ON CONFLICT (username) DO NOTHING;
