-- 기존 글과 출처를 유지하면서 선택적인 출처 링크를 추가합니다.
BEGIN;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS source_url text;
NOTIFY pgrst, 'reload schema';
COMMIT;
