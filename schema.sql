
-- 1. Bảng users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'VIEWER',
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'OPERATOR', 'VIEWER'))
);

-- 2. Bảng units (Đơn vị)
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Bảng staff (Cán bộ)
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    unit_id TEXT REFERENCES public.units(id) ON DELETE SET NULL,
    position TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bảng meetings (Cuộc họp) - Quan trọng: status hỗ trợ POSTPONED
CREATE TABLE IF NOT EXISTS public.meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    host_unit_name TEXT,
    chair_person_name TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    participants JSONB DEFAULT '[]',
    endpoints JSONB DEFAULT '[]',
    description TEXT,
    notes TEXT,
    endpoint_checks JSONB DEFAULT '{}',
    status TEXT DEFAULT 'SCHEDULED',
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT meetings_status_check CHECK (status IN ('SCHEDULED', 'CANCELLED', 'POSTPONED'))
);

-- 5. Bảng endpoints (Điểm cầu)
CREATE TABLE IF NOT EXISTS public.endpoints (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'DISCONNECTED',
    last_connected TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Bảng system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    system_name TEXT,
    short_name TEXT,
    logo_base_64 TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    CONSTRAINT one_row_only CHECK (id = 1)
);

-- Bật RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Chính sách truy cập công khai (cho mục đích nội bộ)
CREATE POLICY "Allow public access" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.endpoints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
