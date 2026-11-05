-- Supabase SQL Editor에서 실행합니다. 기존 profiles.role을 관리자 판별에 사용합니다.
BEGIN;
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_date date NOT NULL,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  content text NOT NULL CHECK (length(btrim(content)) > 0)
);
CREATE INDEX IF NOT EXISTS blog_posts_post_date_id_idx ON public.blog_posts (post_date DESC, id DESC);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.blog_posts FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.blog_posts TO authenticated;
GRANT USAGE ON SEQUENCE public.blog_posts_id_seq TO authenticated;
DROP POLICY IF EXISTS blog_public_read ON public.blog_posts;
CREATE POLICY blog_public_read ON public.blog_posts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS blog_admin_write ON public.blog_posts;
CREATE POLICY blog_admin_write ON public.blog_posts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
-- 다른 허용 정책이 있더라도 일반 사용자가 쓰지 못하게 제한합니다.
DROP POLICY IF EXISTS blog_admin_insert_guard ON public.blog_posts;
CREATE POLICY blog_admin_insert_guard ON public.blog_posts AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
DROP POLICY IF EXISTS blog_admin_update_guard ON public.blog_posts;
CREATE POLICY blog_admin_update_guard ON public.blog_posts AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
DROP POLICY IF EXISTS blog_admin_delete_guard ON public.blog_posts;
CREATE POLICY blog_admin_delete_guard ON public.blog_posts AS RESTRICTIVE FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
NOTIFY pgrst, 'reload schema';
COMMIT;
