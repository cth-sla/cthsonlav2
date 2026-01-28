
-- 1. Đảm bảo các bảng cơ bản tồn tại
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'VIEWER',
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'OPERATOR', 'VIEWER'))
);

CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    unit_id TEXT REFERENCES public.units(id) ON DELETE SET NULL,
    position TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

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
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.endpoints (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'DISCONNECTED',
    last_connected TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    system_name TEXT,
    short_name TEXT,
    logo_base_64 TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    CONSTRAINT one_row_only CHECK (id = 1)
);

-- 2. CƯỠNG CHẾ BỔ SUNG CỘT (Nếu bảng đã tồn tại từ phiên bản cũ)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='status') THEN
        ALTER TABLE public.meetings ADD COLUMN status TEXT DEFAULT 'SCHEDULED';
        ALTER TABLE public.meetings ADD CONSTRAINT meetings_status_check CHECK (status IN ('SCHEDULED', 'CANCELLED', 'POSTPONED'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='cancel_reason') THEN
        ALTER TABLE public.meetings ADD COLUMN cancel_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='endpoint_checks') THEN
        ALTER TABLE public.meetings ADD COLUMN endpoint_checks JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='notes') THEN
        ALTER TABLE public.meetings ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='invitation_link') THEN
        ALTER TABLE public.meetings ADD COLUMN invitation_link TEXT;
    END IF;
END $$;

-- 3. Cấu hình RLS và Xử lý Policy (Sửa lỗi policy already exists)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Xóa và tạo mới chính sách để đảm bảo tính cập nhật
DROP POLICY IF EXISTS "Allow public access" ON public.users;
CREATE POLICY "Allow public access" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access" ON public.units;
CREATE POLICY "Allow public access" ON public.units FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access" ON public.staff;
CREATE POLICY "Allow public access" ON public.staff FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access" ON public.meetings;
CREATE POLICY "Allow public access" ON public.meetings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access" ON public.endpoints;
CREATE POLICY "Allow public access" ON public.endpoints FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access" ON public.system_settings;
CREATE POLICY "Allow public access" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
