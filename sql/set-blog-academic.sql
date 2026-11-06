-- 공개 글과 연결된 자동생성 원고의 학술정보 표시를 함께 갱신합니다.
create or replace function public.set_blog_academic(p_id bigint, p_enabled boolean)
returns public.blog_posts
language plpgsql security invoker set search_path=pg_catalog as $$
declare post public.blog_posts; draft public.blog_content_drafts; changed public.blog_content_drafts;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then
  raise exception 'Admin required' using errcode='42501';
 end if;
 if p_enabled is null then raise exception 'Academic flag required'; end if;
 select * into strict post from public.blog_posts where id=p_id;
 if post.source_post_id is not null then
  select * into draft from public.blog_content_drafts where source_post_id=post.source_post_id for update;
  if found and (draft.payload->'content'->'is_academic') is distinct from to_jsonb(p_enabled) then
   changed:=public.edit_blog_content(draft.id,draft.revision,jsonb_set(draft.payload->'content','{is_academic}',to_jsonb(p_enabled),true));
   -- 기존에 기록된 작성자·검토자 정보는 표시 변경만으로 지우지 않습니다.
   update public.blog_content_drafts set author_profile=draft.author_profile,reviewer_profile=draft.reviewer_profile,source_checks=draft.source_checks
    where id=changed.id;
  end if;
 end if;
 update public.blog_posts set is_academic=p_enabled where id=p_id and source_post_id is not distinct from post.source_post_id returning * into post;
 if not found then raise exception 'Post changed' using errcode='40001'; end if;
 return post;
end $$;
revoke all on function public.set_blog_academic(bigint,boolean) from public,anon;
grant execute on function public.set_blog_academic(bigint,boolean) to authenticated;
notify pgrst,'reload schema';
