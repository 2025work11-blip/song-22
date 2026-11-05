-- Additive migration. Existing blog_posts and their public read policies remain.
-- Incoming drafts are stored in a separate, admin-only table.
create table if not exists public.blog_content_drafts (
 id uuid primary key default gen_random_uuid(),source_post_id text not null unique,
 source_revision integer not null check(source_revision>0),revision integer not null default 1,
 content_hash text not null check(content_hash ~ '^[a-f0-9]{64}$'),payload jsonb not null,
 status text not null default 'draft' check(status in ('draft','approved')),
 approved_revision integer,approved_hash text,approved_by uuid,reviewed_at timestamptz,
 reviewer_profile jsonb,author_profile jsonb,source_checks jsonb,
 destination_post_id bigint references public.blog_posts(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.blog_content_drafts enable row level security;
revoke all on public.blog_content_drafts from public,anon,authenticated;
grant select,insert,update on public.blog_content_drafts to authenticated;
create policy blog_content_admin on public.blog_content_drafts for all to authenticated
 using(exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin'))
 with check(exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin'));
create table if not exists public.blog_content_versions(id bigint generated always as identity primary key,draft_id uuid not null references public.blog_content_drafts(id),revision integer not null,snapshot jsonb not null,created_at timestamptz not null default now(),unique(draft_id,revision));
alter table public.blog_content_versions enable row level security;
revoke all on public.blog_content_versions from public,anon,authenticated;
grant select,insert on public.blog_content_versions to authenticated;
grant usage on sequence public.blog_content_versions_id_seq to authenticated;
create policy blog_versions_admin on public.blog_content_versions for all to authenticated using(exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin')) with check(exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin'));

alter table public.blog_posts add column if not exists slug text;
alter table public.blog_posts add column if not exists source_post_id text;
alter table public.blog_posts add column if not exists seo_title text;
alter table public.blog_posts add column if not exists meta_description text;
alter table public.blog_posts add column if not exists seo_payload jsonb;
alter table public.blog_posts add column if not exists published_at timestamptz;
alter table public.blog_posts add column if not exists content_modified_at timestamptz;
create unique index if not exists blog_posts_slug_unique on public.blog_posts(slug) where slug is not null;
create unique index if not exists blog_posts_source_unique on public.blog_posts(source_post_id) where source_post_id is not null;

create table if not exists public.blog_slug_redirects(old_slug text primary key,new_slug text not null,check(old_slug<>new_slug));
alter table public.blog_slug_redirects enable row level security;
revoke all on public.blog_slug_redirects from public,anon,authenticated;
grant select on public.blog_slug_redirects to anon,authenticated;
grant insert,update on public.blog_slug_redirects to authenticated;
create policy blog_redirect_public on public.blog_slug_redirects for select to anon,authenticated using(true);
create policy blog_redirect_admin on public.blog_slug_redirects for all to authenticated
 using(exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin'))
 with check(exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin'));

create or replace function public.blog_canonical_jsonb(p_value jsonb) returns text
 language plpgsql immutable security invoker set search_path=pg_catalog as $$
declare result text;
begin
 case jsonb_typeof(p_value)
 when 'object' then select '{'||coalesce(string_agg(to_jsonb(key)::text||':'||public.blog_canonical_jsonb(value),',' order by key collate "C"),'')||'}' into result from jsonb_each(p_value);
 when 'array' then select '['||coalesce(string_agg(public.blog_canonical_jsonb(value),',' order by ord),'')||']' into result from jsonb_array_elements(p_value) with ordinality a(value,ord);
 else result:=p_value::text;
 end case;
 return result;
end $$;
revoke all on function public.blog_canonical_jsonb(jsonb) from public,anon;
grant execute on function public.blog_canonical_jsonb(jsonb) to authenticated;

create or replace function public.import_blog_content(p_payload jsonb,p_expected_revision integer default null) returns public.blog_content_drafts
 language plpgsql security invoker set search_path=pg_catalog as $$
declare d public.blog_content_drafts; source_id text; digest text; src_revision integer;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin required' using errcode='42501'; end if;
 if octet_length(p_payload::text)>1000000 or p_payload->>'schema_version' is distinct from '2.0' or jsonb_typeof(p_payload->'content') is distinct from 'object' then raise exception 'Invalid transfer'; end if;
 source_id:=p_payload->>'source_post_id';src_revision:=(p_payload->>'revision')::integer;
 if source_id !~ '^[a-zA-Z0-9-]{1,80}$' or src_revision<1 then raise exception 'Invalid source id/revision'; end if;
 digest:=encode(sha256(convert_to(public.blog_canonical_jsonb(p_payload->'content'),'UTF8')),'hex');
 if digest is distinct from p_payload->>'content_hash' or p_payload->>'request_id' is distinct from source_id||':'||src_revision||':'||digest then raise exception 'Content hash mismatch'; end if;
 perform pg_advisory_xact_lock(hashtextextended('blog-import:'||source_id,0));
 select * into d from public.blog_content_drafts where source_post_id=source_id for update;
 if found then
  if d.content_hash=digest and d.source_revision=src_revision then return d; end if;
  if p_expected_revision is distinct from d.revision or src_revision<=d.source_revision then raise exception 'Draft revision conflict' using errcode='40001'; end if;
  insert into public.blog_content_versions(draft_id,revision,snapshot) values(d.id,d.revision,to_jsonb(d)) on conflict do nothing;
  update public.blog_content_drafts set payload=p_payload,source_revision=src_revision,content_hash=digest,revision=revision+1,status='draft',approved_revision=null,approved_hash=null,approved_by=null,reviewed_at=null,reviewer_profile=null,author_profile=null,source_checks=null,updated_at=now() where id=d.id returning * into d;
 else
  if p_expected_revision is not null then raise exception 'Draft revision conflict' using errcode='40001'; end if;
  insert into public.blog_content_drafts(source_post_id,source_revision,content_hash,payload) values(source_id,src_revision,digest,p_payload) returning * into d;
 end if;
 return d;
end $$;
revoke all on function public.import_blog_content(jsonb,integer) from public,anon;
grant execute on function public.import_blog_content(jsonb,integer) to authenticated;

create or replace function public.edit_blog_content(p_id uuid,p_expected_revision integer,p_content jsonb) returns public.blog_content_drafts
 language plpgsql security invoker set search_path=pg_catalog as $$
declare d public.blog_content_drafts; digest text;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin required' using errcode='42501'; end if;
 select * into strict d from public.blog_content_drafts where id=p_id for update;
 if d.revision<>p_expected_revision then raise exception 'Draft revision conflict' using errcode='40001'; end if;
 if jsonb_typeof(p_content) is distinct from 'object' or octet_length(p_content::text)>1000000 then raise exception 'Invalid content'; end if;
 digest:=encode(sha256(convert_to(public.blog_canonical_jsonb(p_content),'UTF8')),'hex');
 if digest=d.content_hash then return d; end if;
 insert into public.blog_content_versions(draft_id,revision,snapshot) values(d.id,d.revision,to_jsonb(d)) on conflict do nothing;
 update public.blog_content_drafts set payload=jsonb_set(jsonb_set(jsonb_set(payload,'{content}',p_content),'{content_hash}',to_jsonb(digest)),'{request_id}',to_jsonb(source_post_id||':'||source_revision||':'||digest)),content_hash=digest,revision=revision+1,status='draft',approved_revision=null,approved_hash=null,approved_by=null,reviewed_at=null,reviewer_profile=null,author_profile=null,source_checks=null,updated_at=now() where id=d.id returning * into d;
 return d;
end $$;
revoke all on function public.edit_blog_content(uuid,integer,jsonb) from public,anon;
grant execute on function public.edit_blog_content(uuid,integer,jsonb) to authenticated;

create or replace function public.approve_blog_content(p_id uuid,p_expected_revision integer,p_reviewer jsonb,p_author jsonb,p_checks boolean[],p_sources jsonb) returns public.blog_content_drafts
 language plpgsql security invoker set search_path=pg_catalog as $$
declare d public.blog_content_drafts; s jsonb; matched jsonb; stamped jsonb:='[]'::jsonb; content jsonb; approval text;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin required' using errcode='42501'; end if;
 select * into strict d from public.blog_content_drafts where id=p_id for update;
 if d.revision<>p_expected_revision then raise exception 'Draft revision conflict' using errcode='40001'; end if;
 content:=d.payload->'content';
 if d.payload->>'mock' is distinct from 'false' or cardinality(p_checks) is distinct from 7 or array_position(p_checks,false) is not null or array_position(p_checks,null) is not null then raise exception 'Real content and all review confirmations required'; end if;
 if coalesce(p_reviewer->>'name','')='' or coalesce(p_reviewer->>'role','')='' or coalesce(p_reviewer->>'specialty','')='' or coalesce(p_reviewer->>'profile_url','')!~'^https://[^/@[:space:]]+/' or coalesce(p_author->>'name','')='' or coalesce(p_author->>'profile_url','')!~'^https://[^/@[:space:]]+/' or coalesce(p_author->>'type','') not in ('Person','Organization') then raise exception 'Verified editorial profiles required'; end if;
 if coalesce(content->>'primary_question','')='' or coalesce(content->>'seo_title','')='' or coalesce(content->>'meta_description','')='' or coalesce(content->>'slug','')!~'^[a-z0-9가-힣]+(-[a-z0-9가-힣]+)*$' or content->>'slug' in ('admin','api','settings','preview','signin') then raise exception 'Question and search metadata required'; end if;
 if jsonb_typeof(content->'sources') is distinct from 'array' or jsonb_array_length(content->'sources')<1 or jsonb_typeof(content->'content_blocks') is distinct from 'array' or jsonb_array_length(content->'content_blocks')<1 then raise exception 'Sources and paragraphs required'; end if;
 for s in select value from jsonb_array_elements(content->'sources') loop
  if coalesce(s->>'title','')='' or coalesce(s->>'publisher','')='' or coalesce(s->>'source_type','') not in ('peer_reviewed_article','clinical_guideline','society_expert_review') or coalesce(s->>'url','')!~'^https://[^/@[:space:]]+/' then raise exception 'Invalid academic source'; end if;
  if coalesce(s->>'url','')!~'^https://(pubmed\.ncbi\.nlm\.nih\.gov|pmc\.ncbi\.nlm\.nih\.gov|ekjo\.org|www\.ekjo\.org|jkos\.org|www\.jkos\.org|ejkgs\.org|www\.ejkgs\.org|aaojournal\.org|www\.aaojournal\.org|ajo\.com|www\.ajo\.com|jamanetwork\.com|bjo\.bmj\.com|nature\.com|www\.nature\.com|aao\.org|www\.aao\.org)/' then raise exception 'Academic source domain required'; end if;
  select value into matched from jsonb_array_elements(p_sources) where value->>'id'=s->>'id' and value->>'basis' in ('abstract','full_text','guideline') and value->>'confirmed'='true' limit 1;
  if matched is null then raise exception 'Each source must be reviewed'; end if;
  stamped:=stamped||jsonb_build_array(jsonb_build_object('id',s->>'id','basis',matched->>'basis','verified_by',p_reviewer->>'name','verified_at',now()));
 end loop;
 if exists(select 1 from jsonb_array_elements(content->'content_blocks') b where jsonb_typeof(b->'source_ids') is distinct from 'array' or jsonb_array_length(b->'source_ids')=0 or exists(select 1 from jsonb_array_elements_text(b->'source_ids') claim where not exists(select 1 from jsonb_array_elements(content->'sources') sref where sref->>'id'=claim))) then raise exception 'Paragraph source mismatch'; end if;
 if exists(select 1 from jsonb_array_elements(coalesce(content->'assets','[]')) a where coalesce(a->>'public_url','')!~'^https://[^/@[:space:]]+/' or coalesce(a->>'alt_text_ko','')='' or coalesce(a->>'caption_ko','')='' or a->>'review_status' is distinct from 'verified') then raise exception 'Public reviewed image metadata required'; end if;
 approval:=encode(sha256(convert_to(public.blog_canonical_jsonb(jsonb_build_object('content_hash',d.content_hash,'reviewer',p_reviewer,'author',p_author,'sources',stamped)),'UTF8')),'hex');
 update public.blog_content_drafts set status='approved',approved_revision=revision,approved_hash=approval,approved_by=auth.uid(),reviewed_at=now(),reviewer_profile=p_reviewer,author_profile=p_author,source_checks=stamped,updated_at=now() where id=d.id returning * into d;
 return d;
end $$;
revoke all on function public.approve_blog_content(uuid,integer,jsonb,jsonb,boolean[],jsonb) from public,anon;
grant execute on function public.approve_blog_content(uuid,integer,jsonb,jsonb,boolean[],jsonb) to authenticated;

create or replace function public.publish_blog_content(p_id uuid,p_expected_revision integer) returns bigint
 language plpgsql security invoker set search_path=pg_catalog as $$
declare d public.blog_content_drafts; c jsonb; links jsonb; body text; public_data jsonb; post_id bigint; old_slug text; first_published timestamptz; expected_hash text;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin required' using errcode='42501'; end if;
 select * into strict d from public.blog_content_drafts where id=p_id for update;
 if d.revision<>p_expected_revision or d.status<>'approved' or d.approved_revision is distinct from d.revision then raise exception 'Approved revision required'; end if;
 expected_hash:=encode(sha256(convert_to(public.blog_canonical_jsonb(jsonb_build_object('content_hash',d.content_hash,'reviewer',d.reviewer_profile,'author',d.author_profile,'sources',d.source_checks)),'UTF8')),'hex');
 if d.approved_hash is distinct from expected_hash or d.content_hash is distinct from encode(sha256(convert_to(public.blog_canonical_jsonb(d.payload->'content'),'UTF8')),'hex') then raise exception 'Approved content changed'; end if;
 c:=d.payload->'content';
 select string_agg((value->>'heading')||E'\n'||(value->>'text'),E'\n\n' order by ord) into body from jsonb_array_elements(c->'content_blocks') with ordinality a(value,ord);
 body:=coalesce(c->>'answer_summary','')||E'\n\n'||coalesce(body,'');
 if jsonb_array_length(coalesce(c->'faq','[]'))>0 then select body||E'\n\n'||string_agg((value->>'question')||E'\n'||(value->>'answer'),E'\n\n' order by ord) into body from jsonb_array_elements(c->'faq') with ordinality a(value,ord); end if;
 if coalesce(c->>'medical_commentary','')<>'' then body:=body||E'\n\n'||(c->>'medical_commentary'); end if;
 select jsonb_agg(jsonb_build_object('text',(value->>'publisher')||' · '||(value->>'title'),'url',value->>'url')) into links from jsonb_array_elements(c->'sources');
 -- Public metadata excludes raw abstracts, prompts, job logs and private checks.
 public_data:=jsonb_build_object('primary_question',c->'primary_question','answer_summary',c->'answer_summary','blocks',c->'content_blocks','faq',c->'faq','author',d.author_profile,'reviewer',d.reviewer_profile,'reviewed_at',d.reviewed_at,'source_links',links,'suggested_internal_links',c->'suggested_internal_links','assets',(select coalesce(jsonb_agg(jsonb_build_object('block_id',a->'block_id','public_url',a->'public_url','alt',a->'alt_text_ko','caption',a->'caption_ko')),'[]'::jsonb) from jsonb_array_elements(coalesce(c->'assets','[]')) a));
 select id,slug,published_at into post_id,old_slug,first_published from public.blog_posts where source_post_id=d.source_post_id for update;
 if post_id is not null and exists(select 1 from public.blog_posts where id=post_id and title=c->>'title' and content=body and slug=c->>'slug' and seo_title=c->>'seo_title' and meta_description=c->>'meta_description' and seo_payload=public_data) then return post_id; end if;
 first_published:=coalesce(first_published,now());
 if post_id is null then
  insert into public.blog_posts(post_date,title,content,source,source_url,source_links,slug,source_post_id,seo_title,meta_description,seo_payload,published_at,content_modified_at) values((now() at time zone 'Asia/Seoul')::date,c->>'title',body,links->0->>'text',links->0->>'url',links,c->>'slug',d.source_post_id,c->>'seo_title',c->>'meta_description',public_data,first_published,now()) returning id into post_id;
 else
  if old_slug is distinct from c->>'slug' then
   if exists(select 1 from public.blog_slug_redirects where old_slug=c->>'slug') then raise exception 'Slug was already used'; end if;
   update public.blog_slug_redirects set new_slug=c->>'slug' where new_slug=old_slug;
   insert into public.blog_slug_redirects values(old_slug,c->>'slug') on conflict(old_slug) do update set new_slug=excluded.new_slug;
  end if;
  update public.blog_posts set title=c->>'title',content=body,content_html=null,source=links->0->>'text',source_url=links->0->>'url',source_links=links,slug=c->>'slug',seo_title=c->>'seo_title',meta_description=c->>'meta_description',seo_payload=public_data,content_modified_at=now() where id=post_id;
 end if;
 update public.blog_content_drafts set destination_post_id=post_id where id=d.id;
 return post_id;
end $$;
revoke all on function public.publish_blog_content(uuid,integer) from public,anon;
grant execute on function public.publish_blog_content(uuid,integer) to authenticated;
notify pgrst,'reload schema';
