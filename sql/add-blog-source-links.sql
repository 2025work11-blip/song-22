-- 기존 단일 출처를 보존하고, 여러 출처를 저장할 컬럼을 추가합니다.
BEGIN;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS source_links jsonb
  CHECK (source_links IS NULL OR jsonb_typeof(source_links) = 'array');
NOTIFY pgrst, 'reload schema';
COMMIT;
