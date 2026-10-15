begin;
alter table public.cms_members add column revoked_at timestamptz;
alter table public.cms_inquiries add column deleted_at timestamptz;
drop policy inquiries_read on public.cms_inquiries;
create policy inquiries_read on public.cms_inquiries for select to authenticated
using ((select akron_private.member_role())='admin' or (deleted_at is null and (select akron_private.member_role())='editor'));
create or replace function akron_private.member_role() returns text
language sql stable security definer set search_path='' as $$
  select role from public.cms_members where user_id=auth.uid() and revoked_at is null;
$$;

create table public.cms_content_backups (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  actor_id uuid, documents jsonb not null
);
alter table public.cms_content_backups enable row level security;
revoke all on public.cms_content_backups from public,anon,authenticated;
grant select on public.cms_content_backups to authenticated;
create policy backups_admin on public.cms_content_backups for select to authenticated using ((select akron_private.member_role())='admin');
create table public.cms_site_state(id boolean primary key default true check(id), enabled boolean not null default false);
alter table public.cms_site_state enable row level security;
revoke all on public.cms_site_state from public,anon,authenticated;
grant select on public.cms_site_state to anon,authenticated;
create policy state_public on public.cms_site_state for select to anon,authenticated using(true);
insert into public.cms_site_state values(true,false);

create table public.cms_media_trash (
  id uuid primary key default gen_random_uuid(), path text not null,
  state text not null default 'pending' check(state in ('pending','trashed','restored','cancelled')),
  created_at timestamptz not null default now(), actor_id uuid
);
create unique index media_trash_active on public.cms_media_trash(path) where state in ('pending','trashed');
alter table public.cms_media_trash enable row level security;
revoke all on public.cms_media_trash from public,anon,authenticated;
grant select on public.cms_media_trash to authenticated,service_role;
create policy media_trash_admin on public.cms_media_trash for select to authenticated using ((select akron_private.member_role())='admin');
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-media-trash','site-media-trash',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']);

create function akron_private.guard_media_references() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('akron-content-media',0));
  if exists(select from public.cms_media_trash t where t.state in ('pending','trashed')
    and strpos(new.data::text,'/storage/v1/object/public/site-media/'||t.path)>0) then
    raise exception 'Image is in trash; restore it before using it';
  end if;
  return new;
end; $$;
revoke all on function akron_private.guard_media_references() from public,anon,authenticated;
create trigger guard_draft_media before insert or update on public.cms_drafts for each row execute function akron_private.guard_media_references();
create trigger guard_published_media before insert or update on public.cms_published for each row execute function akron_private.guard_media_references();

create function akron_private.admin_manage(operation text, target text, restore boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare row_id uuid; old_row jsonb; new_row jsonb; entry public.cms_media_trash;
begin
  if akron_private.member_role() is distinct from 'admin' then raise exception 'Not authorized' using errcode='42501'; end if;
  if operation='member' then
    lock table public.cms_members in exclusive mode;
    if akron_private.member_role() is distinct from 'admin' then raise exception 'Not authorized' using errcode='42501'; end if;
    row_id:=target::uuid;
    if row_id=auth.uid() then raise exception 'Cannot remove your own access'; end if;
    select to_jsonb(m) into old_row from public.cms_members m where user_id=row_id for update;
    if old_row is null then raise exception 'Member not found'; end if;
    if not restore and old_row->>'role'='admin' and old_row->>'revoked_at' is null
      and (select count(*) from public.cms_members where role='admin' and revoked_at is null)<=1 then raise exception 'Cannot remove last admin'; end if;
    update public.cms_members set revoked_at=case when restore then null else now() end where user_id=row_id returning to_jsonb(cms_members) into new_row;
  elsif operation='inquiry' then
    row_id:=target::uuid;
    select jsonb_build_object('deleted_at',deleted_at) into old_row from public.cms_inquiries where id=row_id for update;
    if old_row is null then raise exception 'Inquiry not found'; end if;
    update public.cms_inquiries set deleted_at=case when restore then null else now() end where id=row_id
      returning jsonb_build_object('deleted_at',deleted_at) into new_row;
  elsif operation='media_prepare' then
    if target is null or length(target)>512 or target !~ '^[a-zA-Z0-9_/-]+[.][a-zA-Z0-9]+$' or strpos(target,'..')>0 or left(target,1)='/' then raise exception 'Invalid media path'; end if;
    perform pg_advisory_xact_lock(hashtextextended('akron-content-media',0));
    if exists(select from public.cms_drafts where strpos(data::text,'/storage/v1/object/public/site-media/'||target)>0)
      or exists(select from public.cms_published where strpos(data::text,'/storage/v1/object/public/site-media/'||target)>0) then raise exception 'Media is referenced'; end if;
    if not exists(select from storage.objects where bucket_id='site-media' and name=target) then raise exception 'Media not found'; end if;
    insert into public.cms_media_trash(path,actor_id) values(target,auth.uid()) returning id into row_id;
    new_row:=jsonb_build_object('path',target,'state','pending');
  elsif operation in ('media_complete','media_cancel','media_restore') then
    row_id:=target::uuid;
    select * into entry from public.cms_media_trash where id=row_id for update;
    if not found then raise exception 'Media not found'; end if;
    if operation='media_complete' and (entry.state<>'pending' or not exists(select from storage.objects where bucket_id='site-media-trash' and name=entry.id::text)) then raise exception 'Move not completed'; end if;
    if operation='media_restore' and (entry.state<>'trashed' or not exists(select from storage.objects where bucket_id='site-media' and name=entry.path)) then raise exception 'Restore not completed'; end if;
    if operation='media_cancel' and entry.state<>'pending' then raise exception 'Invalid media state'; end if;
    old_row:=jsonb_build_object('path',entry.path,'state',entry.state);
    update public.cms_media_trash set state=case operation when 'media_complete' then 'trashed' when 'media_restore' then 'restored' else 'cancelled' end where id=row_id
      returning jsonb_build_object('path',path,'state',state) into new_row;
  else raise exception 'Invalid operation';
  end if;
  insert into public.cms_activity(actor_id,actor_email,action,entity_id,before_data,after_data)
  values(auth.uid(),(select email from auth.users where id=auth.uid()),operation||case when restore then '_restore' else '_trash' end,coalesce(row_id::text,target),old_row,new_row);
  return jsonb_build_object('id',row_id,'ok',true);
end; $$;
revoke all on function akron_private.admin_manage(text,text,boolean) from public,anon;
grant execute on function akron_private.admin_manage(text,text,boolean) to authenticated;
create function public.cms_admin_manage(operation text,target text,restore boolean default false) returns jsonb
language sql security invoker set search_path='' as $$ select akron_private.admin_manage(operation,target,restore); $$;
revoke all on function public.cms_admin_manage(text,text,boolean) from public,anon;
grant execute on function public.cms_admin_manage(text,text,boolean) to authenticated;

drop function public.cms_list_members();
create function public.cms_list_members() returns table(user_id uuid,role text,email text,last_seen_at timestamptz,last_sign_in_at timestamptz,revoked_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
  if akron_private.member_role() is distinct from 'admin' then raise exception 'Not authorized' using errcode='42501'; end if;
  return query select m.user_id,m.role,u.email::text,m.last_seen_at,u.last_sign_in_at,m.revoked_at from public.cms_members m join auth.users u on u.id=m.user_id order by u.email;
end; $$;
revoke all on function public.cms_list_members() from public,anon;
grant execute on function public.cms_list_members() to authenticated;

create function akron_private.handover_content(documents jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item jsonb; old_published jsonb; draft public.cms_drafts; preserved integer:=0; total integer:=0;
begin
  if akron_private.member_role() is distinct from 'admin' then raise exception 'Not authorized' using errcode='42501'; end if;
  if jsonb_typeof(documents)<>'array' or jsonb_array_length(documents)<7 or jsonb_array_length(documents)>100 then raise exception 'Invalid content'; end if;
  perform pg_advisory_xact_lock(hashtextextended('akron-content-media',0));
  if (select enabled from public.cms_site_state where id=true) then raise exception 'Handover already completed'; end if;
  if not exists(select from jsonb_array_elements(documents) d where d->>'id'='site-settings' and d->>'kind'='settings') then raise exception 'Settings missing'; end if;
  insert into public.cms_content_backups(actor_id,documents) values(auth.uid(),jsonb_build_object(
    'drafts',(select jsonb_agg(to_jsonb(d)) from public.cms_drafts d),'published',(select jsonb_agg(to_jsonb(p)) from public.cms_published p)));
  for item in select value from jsonb_array_elements(documents) loop
    if item->>'id' !~ '^[a-z0-9][a-z0-9-]{0,79}$' or item->>'kind' not in ('settings','page') or jsonb_typeof(item->'data')<>'object' then raise exception 'Invalid document'; end if;
    select data into old_published from public.cms_published where id=item->>'id';
    select * into draft from public.cms_drafts where id=item->>'id' for update;
    if not found then
      insert into public.cms_drafts(id,kind,data,updated_by) values(item->>'id',item->>'kind',item->'data',auth.uid());
    elsif (draft.data - 'inquiryEmail') is not distinct from (old_published - 'inquiryEmail') then
      update public.cms_drafts set data=item->'data',revision=revision+1,updated_at=now(),updated_by=auth.uid() where id=item->>'id';
    else preserved:=preserved+1;
    end if;
    insert into public.cms_published(id,kind,data,revision) values(item->>'id',item->>'kind',item->'data',(select revision from public.cms_drafts where id=item->>'id'))
      on conflict(id) do update set data=excluded.data,revision=excluded.revision,published_at=now();
    total:=total+1;
  end loop;
  update public.cms_site_state set enabled=true where id=true;
  insert into public.cms_activity(actor_id,actor_email,action,entity_id,after_data) values(auth.uid(),(select email from auth.users where id=auth.uid()),'content_handover','website',jsonb_build_object('documents',total,'preserved_drafts',preserved));
  return jsonb_build_object('documents',total,'preservedDrafts',preserved);
end; $$;
revoke all on function akron_private.handover_content(jsonb) from public,anon;
grant execute on function akron_private.handover_content(jsonb) to authenticated;
create function public.cms_handover_content(documents jsonb) returns jsonb language sql security invoker set search_path='' as $$ select akron_private.handover_content(documents); $$;
revoke all on function public.cms_handover_content(jsonb) from public,anon;
grant execute on function public.cms_handover_content(jsonb) to authenticated;

-- Revoked accounts cannot regain access through a role change by a non-admin.
create or replace function public.cms_set_member_role(target_user uuid,new_role text) returns void
language plpgsql security definer set search_path='' as $$
begin
  lock table public.cms_members in exclusive mode;
  if akron_private.member_role() is distinct from 'admin' then raise exception 'Access denied' using errcode='42501'; end if;
  if target_user=auth.uid() then raise exception 'Cannot change your own access' using errcode='42501'; end if;
  if new_role is null or new_role not in ('admin','editor','viewer') then raise exception 'Invalid role'; end if;
  if exists(select from public.cms_members where user_id=target_user and role='admin' and revoked_at is null) and new_role<>'admin'
    and (select count(*) from public.cms_members where role='admin' and revoked_at is null)<=1 then raise exception 'Cannot remove last admin'; end if;
  insert into public.cms_members(user_id,role) values(target_user,new_role) on conflict(user_id) do update set role=excluded.role;
end; $$;
commit;
