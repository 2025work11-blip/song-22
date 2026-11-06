alter table public.blog_posts add column if not exists is_academic boolean not null default false;
create or replace function public.publish_blog_content(p_id uuid,p_expected_revision integer) returns bigint
 language plpgsql security invoker set search_path=pg_catalog as $$
declare d public.blog_content_drafts; c jsonb; links jsonb; body text; public_data jsonb; post_id bigint; old_slug text; first_published timestamptz; expected_hash text;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin required' using errcode='42501'; end if;
 select * into strict d from public.blog_content_drafts where id=p_id for update;
 if d.revision<>p_expected_revision then raise exception 'Draft revision conflict' using errcode='40001'; end if;
 if d.payload->>'mock' is distinct from 'false' then raise exception 'Sample content cannot be published'; end if;
 if d.content_hash is distinct from encode(sha256(convert_to(public.blog_canonical_jsonb(d.payload->'content'),'UTF8')),'hex') then raise exception 'Content hash mismatch'; end if;
 c:=d.payload->'content';
 if coalesce(trim(c->>'title'),'')='' or coalesce(trim(c->>'seo_title'),'')='' or coalesce(trim(c->>'meta_description'),'')='' or coalesce(c->>'slug','')!~'^[a-z0-9가-힣]+(-[a-z0-9가-힣]+)*$' or length(c->>'slug')>100 or c->>'slug' in ('admin','api','settings','preview','signin') then raise exception 'Title and valid search metadata required'; end if;
 if jsonb_typeof(c->'content_blocks') is distinct from 'array' or jsonb_array_length(c->'content_blocks')=0 or jsonb_typeof(c->'sources') is distinct from 'array' or jsonb_array_length(c->'sources')=0 then raise exception 'Content and sources required'; end if;
 if exists(select 1 from jsonb_array_elements(c->'content_blocks') b where coalesce(b->>'text','')='' or jsonb_typeof(b->'source_ids') is distinct from 'array' or jsonb_array_length(b->'source_ids')=0 or exists(select 1 from jsonb_array_elements_text(b->'source_ids') claim where not exists(select 1 from jsonb_array_elements(c->'sources') s where s->>'id'=claim))) then raise exception 'Content and source links required'; end if;
 if exists(select 1 from jsonb_array_elements(c->'sources') s where coalesce(s->>'id','')='' or coalesce(s->>'title','')='' or coalesce(s->>'publisher','')='' or coalesce(s->>'url','')!~'^https://[^/@[:space:]]+/') then raise exception 'Valid source required'; end if;
 select string_agg((value->>'heading')||E'\n'||(value->>'text'),E'\n\n' order by ord) into body from jsonb_array_elements(c->'content_blocks') with ordinality a(value,ord);
 body:=coalesce(c->>'answer_summary','')||E'\n\n'||coalesce(body,'');
 if jsonb_array_length(coalesce(c->'faq','[]'))>0 then select body||E'\n\n'||string_agg((value->>'question')||E'\n'||(value->>'answer'),E'\n\n' order by ord) into body from jsonb_array_elements(c->'faq') with ordinality a(value,ord); end if;
 if coalesce(c->>'medical_commentary','')<>'' then body:=body||E'\n\n'||(c->>'medical_commentary'); end if;
 select jsonb_agg(jsonb_build_object('text',(value->>'publisher')||' · '||(value->>'title'),'url',value->>'url')) into links from jsonb_array_elements(c->'sources');
 -- Public metadata excludes raw abstracts, prompts, job logs and private checks.
 public_data:=jsonb_build_object('primary_question',c->'primary_question','answer_summary',c->'answer_summary','blocks',c->'content_blocks','faq',c->'faq','medical_commentary',c->'medical_commentary','author',d.author_profile,'reviewer',d.reviewer_profile,'reviewed_at',d.reviewed_at,'source_links',links,'suggested_internal_links',c->'suggested_internal_links','assets',(select coalesce(jsonb_agg(jsonb_build_object('block_id',a->'block_id','public_url',a->'public_url','alt',a->'alt_text_ko','caption',a->'caption_ko')),'[]'::jsonb) from jsonb_array_elements(coalesce(c->'assets','[]')) a));
 select id,slug,published_at into post_id,old_slug,first_published from public.blog_posts where source_post_id=d.source_post_id for update;
 if post_id is not null and exists(select 1 from public.blog_posts where id=post_id and title=c->>'title' and content=body and slug=c->>'slug' and seo_title=c->>'seo_title' and meta_description=c->>'meta_description' and seo_payload=public_data and is_academic=(c->'is_academic' is not distinct from 'true'::jsonb)) then return post_id; end if;
 first_published:=coalesce(first_published,now());
 if post_id is null then
  insert into public.blog_posts(post_date,title,content,source,source_url,source_links,slug,source_post_id,seo_title,meta_description,seo_payload,published_at,content_modified_at,is_academic) values((now() at time zone 'Asia/Seoul')::date,c->>'title',body,links->0->>'text',links->0->>'url',links,c->>'slug',d.source_post_id,c->>'seo_title',c->>'meta_description',public_data,first_published,now(),c->'is_academic' is not distinct from 'true'::jsonb) returning id into post_id;
 else
  if old_slug is distinct from c->>'slug' then
   if exists(select 1 from public.blog_slug_redirects where old_slug=c->>'slug') then raise exception 'Slug was already used'; end if;
   update public.blog_slug_redirects set new_slug=c->>'slug' where new_slug=old_slug;
   insert into public.blog_slug_redirects values(old_slug,c->>'slug') on conflict(old_slug) do update set new_slug=excluded.new_slug;
  end if;
  update public.blog_posts set title=c->>'title',content=body,content_html=null,source=links->0->>'text',source_url=links->0->>'url',source_links=links,slug=c->>'slug',seo_title=c->>'seo_title',meta_description=c->>'meta_description',seo_payload=public_data,is_academic=(c->'is_academic' is not distinct from 'true'::jsonb),content_modified_at=now() where id=post_id;
 end if;
 update public.blog_content_drafts set destination_post_id=post_id where id=d.id;
 return post_id;
end $$;
revoke all on function public.publish_blog_content(uuid,integer) from public,anon;
grant execute on function public.publish_blog_content(uuid,integer) to authenticated;

-- One transaction: an invalid post never leaves a partially imported draft.
create or replace function public.import_and_publish_blog_content(p_payload jsonb,p_expected_revision integer default null) returns bigint
 language plpgsql security invoker set search_path=pg_catalog as $$
declare draft public.blog_content_drafts;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin required' using errcode='42501'; end if;
 select * into draft from public.import_blog_content(p_payload,p_expected_revision);
 return public.publish_blog_content(draft.id,draft.revision);
end $$;
revoke all on function public.import_and_publish_blog_content(jsonb,integer) from public,anon;
grant execute on function public.import_and_publish_blog_content(jsonb,integer) to authenticated;
notify pgrst,'reload schema';
