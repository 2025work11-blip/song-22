-- 기존 글을 보존하며 서식과 출처, 사진 저장소를 추가합니다.
BEGIN;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS content_html text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS source text;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('blog-images', 'blog-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];
DROP POLICY IF EXISTS blog_images_public_read ON storage.objects;
CREATE POLICY blog_images_public_read ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'blog-images');
DROP POLICY IF EXISTS blog_images_admin_insert ON storage.objects;
CREATE POLICY blog_images_admin_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
DROP POLICY IF EXISTS blog_images_admin_delete ON storage.objects;
CREATE POLICY blog_images_admin_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
-- 다른 기존 정책이 블로그 사진 쓰기를 허용하더라도 관리자만 변경합니다.
DROP POLICY IF EXISTS blog_images_insert_guard ON storage.objects;
CREATE POLICY blog_images_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id <> 'blog-images' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
DROP POLICY IF EXISTS blog_images_update_guard ON storage.objects;
CREATE POLICY blog_images_update_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (bucket_id <> 'blog-images' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'))
  WITH CHECK (bucket_id <> 'blog-images' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
DROP POLICY IF EXISTS blog_images_delete_guard ON storage.objects;
CREATE POLICY blog_images_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated
  USING (bucket_id <> 'blog-images' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
NOTIFY pgrst, 'reload schema';
COMMIT;
