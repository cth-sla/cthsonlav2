
-- 1. Đảm bảo cột role chấp nhận giá trị 'OPERATOR'
-- Nếu bạn đã tạo bảng users trước đó, hãy chạy lệnh này để cập nhật ràng buộc
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'OPERATOR', 'VIEWER'));

-- 2. Đảm bảo bảng users tồn tại với cấu trúc đúng
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'VIEWER',
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'OPERATOR', 'VIEWER'))
);

-- 3. Cập nhật RLS (Row Level Security) cho bảng users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public users access" ON public.users;
CREATE POLICY "Public users access" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 4. Đảm bảo cột endpoint_checks trong bảng meetings
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='meetings' AND column_name='endpoint_checks') THEN
        ALTER TABLE public.meetings ADD COLUMN endpoint_checks JSONB DEFAULT '{}';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
