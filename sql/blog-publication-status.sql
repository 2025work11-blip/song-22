-- 기존 글은 모두 게시 상태로 유지합니다.
alter table public.blog_posts add column if not exists is_published boolean not null default true;

-- 중지한 글은 관리자만 조회할 수 있습니다.
drop policy if exists blog_publication_visibility on public.blog_posts;
drop policy if exists blog_publication_visibility_anon on public.blog_posts;
drop policy if exists blog_publication_visibility_authenticated on public.blog_posts;
create policy blog_publication_visibility_anon on public.blog_posts as restrictive
 for select to anon using (is_published);
create policy blog_publication_visibility_authenticated on public.blog_posts as restrictive
 for select to authenticated
 using (is_published or exists (select 1 from public.profiles where id=(select auth.uid()) and role='admin'));
notify pgrst, 'reload schema';
