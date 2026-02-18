
-- 1. Bảng Cấu hình hệ thống (Đảm bảo chỉ có 1 dòng duy nhất)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    system_name TEXT NOT NULL DEFAULT 'HỆ THỐNG GIÁM SÁT HỘP TRỰC TUYẾN',
    short_name TEXT NOT NULL DEFAULT 'E-MEETING SLA',
    logo_base_64 TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT one_row_only CHECK (id = 1)
);

-- 2. Bảng Danh mục Đơn vị
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Bảng Danh mục Cán bộ
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    unit_id TEXT REFERENCES public.units(id) ON DELETE SET NULL,
    position TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bảng Danh mục Điểm cầu
CREATE TABLE IF NOT EXISTS public.endpoints (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'DISCONNECTED',
    last_connected TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Bảng Nhóm thành phần tham gia
CREATE TABLE IF NOT EXISTS public.participant_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Bảng Quản lý Cuộc họp (Đầy đủ các thông số trạng thái và KPI)
CREATE TABLE IF NOT EXISTS public.meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    host_unit_name TEXT,
    host_unit_id TEXT, -- Thêm cột ID đơn vị
    chair_person_name TEXT,
    chair_person_id TEXT, -- Thêm cột ID cán bộ
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    participants JSONB DEFAULT '[]',
    endpoints JSONB DEFAULT '[]',
    description TEXT,
    notes TEXT,
    endpoint_checks JSONB DEFAULT '{}',
    status TEXT DEFAULT 'SCHEDULED',
    cancel_reason TEXT,
    invitation_link TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT meetings_status_check CHECK (status IN ('SCHEDULED', 'CANCELLED', 'POSTPONED'))
);

-- 7. Bảng Quản lý Tài khoản
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'VIEWER',
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'OPERATOR', 'VIEWER'))
);

-- 8. TỐI ƯU HÓA: Index để Dashboard load cực nhanh khi dữ liệu lớn
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON public.meetings (start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings (status);
CREATE INDEX IF NOT EXISTS idx_meetings_host_unit ON public.meetings (host_unit_name);
CREATE INDEX IF NOT EXISTS idx_staff_unit ON public.staff (unit_id);

-- 9. Cấu hình bảo mật Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho phép truy cập công khai (Dành cho demo/triển khai nhanh)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Access All" ON public.users;
    CREATE POLICY "Public Access All" ON public.users FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public Access All" ON public.units;
    CREATE POLICY "Public Access All" ON public.units FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public Access All" ON public.staff;
    CREATE POLICY "Public Access All" ON public.staff FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public Access All" ON public.meetings;
    CREATE POLICY "Public Access All" ON public.meetings FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public Access All" ON public.endpoints;
    CREATE POLICY "Public Access All" ON public.endpoints FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public Access All" ON public.participant_groups;
    CREATE POLICY "Public Access All" ON public.participant_groups FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public Access All" ON public.system_settings;
    CREATE POLICY "Public Access All" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 10. Dữ liệu cấu hình mặc định ban đầu
INSERT INTO public.system_settings (id, system_name, short_name, primary_color)
VALUES (1, 'ỦY BAN NHÂN DÂN TỈNH SƠN LA', 'HỘI NGHỊ TRỰC TUYẾN SƠN LA', '#3B82F6')
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
