
-- Chạy lệnh này trong SQL Editor của Supabase để sửa lỗi thiếu cột
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='meetings' AND column_name='endpoint_checks') THEN
        ALTER TABLE public.meetings ADD COLUMN endpoint_checks JSONB DEFAULT '{}';
    END IF;
END $$;

-- Đảm bảo quyền truy cập (nếu cần)
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON public.meetings;
CREATE POLICY "Enable all for anon" ON public.meetings FOR ALL USING (true) WITH CHECK (true);

-- Thông báo cho PostgREST làm mới cache (Thực tế thực hiện bằng cách chạy lệnh SQL hoặc chờ vài phút)
NOTIFY pgrst, 'reload schema';
