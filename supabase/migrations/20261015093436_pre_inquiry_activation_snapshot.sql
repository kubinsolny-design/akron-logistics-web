-- One-time, database-owner-only snapshot. No public/API or application access.
-- Do not rerun or overwrite this point-in-time backup.
begin;
create schema akron_backup_20261015_inquiry;
revoke all on schema akron_backup_20261015_inquiry from public, anon, authenticated, service_role;
create table akron_backup_20261015_inquiry.cms_members as table public.cms_members;
create table akron_backup_20261015_inquiry.cms_drafts as table public.cms_drafts;
create table akron_backup_20261015_inquiry.cms_published as table public.cms_published;
create table akron_backup_20261015_inquiry.cms_inquiries as table public.cms_inquiries;
revoke all on all tables in schema akron_backup_20261015_inquiry from public, anon, authenticated, service_role;
alter table akron_backup_20261015_inquiry.cms_members enable row level security;
alter table akron_backup_20261015_inquiry.cms_drafts enable row level security;
alter table akron_backup_20261015_inquiry.cms_published enable row level security;
alter table akron_backup_20261015_inquiry.cms_inquiries enable row level security;
comment on schema akron_backup_20261015_inquiry is 'Private pre-inquiry-activation snapshot, 2026-10-15. Owner only; review retention after external backup and handover.';
-- Event-trigger helper is not an application RPC. The DDL trigger remains active.
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;
commit;
