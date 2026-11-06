-- 관리자만 작성일과 학술정보 표시를 함께 수정합니다.
create or replace function public.set_blog_display(p_id bigint, p_enabled boolean, p_post_date date)
returns public.blog_posts
language plpgsql security invoker set search_path=pg_catalog as $$
declare post public.blog_posts;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then
  raise exception 'Admin required' using errcode='42501';
 end if;
 if p_post_date is null then raise exception 'Date required'; end if;
 post:=public.set_blog_academic(p_id,p_enabled);
 update public.blog_posts set post_date=p_post_date where id=p_id returning * into strict post;
 return post;
end $$;
revoke all on function public.set_blog_display(bigint,boolean,date) from public,anon;
grant execute on function public.set_blog_display(bigint,boolean,date) to authenticated;
notify pgrst,'reload schema';
