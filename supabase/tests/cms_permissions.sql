-- Run after the migration. All fixtures and mutations are rolled back.
-- Stop on the first exception. This is a SQL Editor-compatible smoke test,
-- not a replacement for API/session/invitation end-to-end tests.
begin;

create function pg_temp.expect_denied(statement text) returns void
language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege then return;
  end;
  raise exception 'Expected permission denial: %', statement;
end;
$$;
create function pg_temp.expect_conflict(statement text) returns void
language plpgsql as $$
begin
  begin
    execute statement;
  exception when serialization_failure then return;
  end;
  raise exception 'Expected revision conflict: %', statement;
end;
$$;

insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-000000000101', 'akron-test-admin@example.com'),
  ('00000000-0000-0000-0000-000000000102', 'akron-test-editor@example.com'),
  ('00000000-0000-0000-0000-000000000103', 'akron-test-viewer@example.com'),
  ('00000000-0000-0000-0000-000000000104', 'akron-test-nonmember@example.com');
insert into public.cms_members(user_id, role) values
  ('00000000-0000-0000-0000-000000000101', 'admin'),
  ('00000000-0000-0000-0000-000000000102', 'editor'),
  ('00000000-0000-0000-0000-000000000103', 'viewer');
insert into public.cms_drafts(id, kind, data) values
  ('test-page', 'page', '{"title":"Draft secret"}');
insert into public.cms_published(id, kind, data, revision) values
  ('test-page', 'page', '{"title":"Public title"}', 1);
insert into public.cms_inquiries(loading_place, unloading_place, requested_date,
  cargo, contact_name, email, phone, spam_fingerprint)
values ('A', 'B', 'test', 'test', 'Test', 'test@example.com', 'test', 'test');

do $$ begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in
      ('cms_members', 'cms_drafts', 'cms_published', 'cms_inquiries') and not c.relrowsecurity
  ) then raise exception 'CMS table without RLS'; end if;
  if has_table_privilege('anon', 'public.cms_inquiries', 'SELECT')
    or has_table_privilege('authenticated', 'public.cms_members', 'INSERT')
    or has_table_privilege('authenticated', 'public.cms_drafts', 'UPDATE')
    or has_table_privilege('authenticated', 'public.cms_published', 'DELETE')
  then raise exception 'Unexpected table grant'; end if;
end $$;

set local role anon;
select pg_temp.expect_denied('select * from public.cms_drafts');
select pg_temp.expect_denied('select * from public.cms_members');
select pg_temp.expect_denied('select * from public.cms_inquiries');
select pg_temp.expect_denied('delete from public.cms_published');
select pg_temp.expect_denied($q$select public.cms_publish('test-page', 1)$q$);
do $$ begin
  if (select data->>'title' from public.cms_published where id = 'test-page') <> 'Public title'
  then raise exception 'Anonymous published read failed'; end if;
end $$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000104', true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.cms_drafts) or exists(select 1 from public.cms_inquiries)
    or exists(select 1 from public.cms_members)
  then raise exception 'Nonmember can read protected data'; end if;
end $$;
select pg_temp.expect_denied($q$select public.cms_save_draft('test-page', 'page', '{}', 1)$q$);
select pg_temp.expect_denied($q$select public.cms_set_member_role('00000000-0000-0000-0000-000000000104', 'admin')$q$);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
set local role authenticated;
do $$ begin
  if not exists(select 1 from public.cms_drafts where id = 'test-page')
    or exists(select 1 from public.cms_inquiries)
    or (select count(*) from public.cms_members) <> 1
  then raise exception 'Viewer access incorrect'; end if;
end $$;
select pg_temp.expect_denied($q$select public.cms_save_draft('test-page', 'page', '{}', 1)$q$);
select pg_temp.expect_denied($q$select public.cms_publish('test-page', 1)$q$);
select pg_temp.expect_denied($q$select public.cms_update_inquiry(gen_random_uuid(), 'done', '')$q$);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
set local role authenticated;
select public.cms_save_draft('test-page', 'page', '{"title":"Edited"}', 1);
select pg_temp.expect_conflict($q$select public.cms_save_draft('test-page', 'page', '{}', 1)$q$);
select pg_temp.expect_conflict($q$select public.cms_publish('test-page', 1)$q$);
select public.cms_publish('test-page', 2);
select pg_temp.expect_denied($q$select public.cms_set_member_role('00000000-0000-0000-0000-000000000103', 'admin')$q$);
select pg_temp.expect_denied($q$update public.cms_members set role = 'admin'$q$);
do $$ begin
  if (select data->>'title' from public.cms_published where id = 'test-page') <> 'Edited'
    or not exists(select 1 from public.cms_inquiries where spam_fingerprint = 'test')
  then raise exception 'Editor access incorrect'; end if;
end $$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
set local role authenticated;
select pg_temp.expect_denied($q$select public.cms_set_member_role('00000000-0000-0000-0000-000000000101', 'viewer')$q$);
select public.cms_set_member_role('00000000-0000-0000-0000-000000000103', 'editor');
do $$ begin
  if (select role from public.cms_members where user_id = '00000000-0000-0000-0000-000000000103') <> 'editor'
  then raise exception 'Admin role update failed'; end if;
end $$;

reset role;
rollback;
select 'CMS permission smoke tests passed; all fixtures rolled back' as result;
