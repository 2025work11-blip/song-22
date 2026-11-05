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
NOTIFY pgrst, 'reload schema';
COMMIT;
