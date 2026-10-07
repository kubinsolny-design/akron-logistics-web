-- Keep existing memberships and roles unchanged.
begin;
alter table public.cms_members add column if not exists last_seen_at timestamptz;
alter table public.cms_inquiries add column if not exists frequency text not null default 'unknown';
create table public.cms_activity (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity_id text not null,
  before_data jsonb,
  after_data jsonb
);
create index cms_activity_created on public.cms_activity(created_at desc, id desc);
alter table public.cms_activity enable row level security;
revoke all on public.cms_activity from anon, authenticated;
grant select on public.cms_activity to authenticated;
grant all on public.cms_activity to service_role;
grant usage, select on sequence public.cms_activity_id_seq to service_role;
create policy activity_admin on public.cms_activity for select to authenticated
using ((select akron_private.member_role()) = 'admin');

create function akron_private.record_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare old_data jsonb; new_data jsonb; entity text; operation text;
begin
  old_data := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  new_data := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  if tg_table_name = 'cms_members' then
    if tg_op = 'UPDATE' and old.role = new.role then return new; end if;
    operation := 'member'; entity := coalesce(new_data, old_data)->>'user_id';
    old_data := old_data - 'last_seen_at'; new_data := new_data - 'last_seen_at';
  elsif tg_table_name = 'cms_inquiries' then
    if old.status = new.status and old.notes is not distinct from new.notes then return new; end if;
    operation := 'inquiry'; entity := new.id::text;
    old_data := jsonb_build_object('status', old.status, 'notes', old.notes);
    new_data := jsonb_build_object('status', new.status, 'notes', new.notes);
  elsif tg_table_name = 'objects' then
    if new.bucket_id <> 'site-media' then return new; end if;
    operation := 'media'; entity := new.name;
    old_data := null; new_data := jsonb_build_object('file',new.name);
  else
    operation := case tg_table_name when 'cms_drafts' then 'draft' else 'publish' end;
    entity := coalesce(new_data,old_data)->>'id';
    old_data := old_data->'data'; new_data := new_data->'data';
    if old_data is not distinct from new_data then return new; end if;
  end if;
  insert into public.cms_activity(actor_id,actor_email,action,entity_id,before_data,after_data)
  values(auth.uid(), (select email from auth.users where id = auth.uid()),operation,entity,old_data,new_data);
  return coalesce(new,old);
end; $$;
revoke all on function akron_private.record_activity() from public, anon, authenticated;
create trigger cms_draft_audit after insert or update on public.cms_drafts for each row execute function akron_private.record_activity();
create trigger cms_publish_audit after insert or update on public.cms_published for each row execute function akron_private.record_activity();
create trigger cms_member_audit after insert or update or delete on public.cms_members for each row execute function akron_private.record_activity();
create trigger cms_inquiry_audit after update on public.cms_inquiries for each row execute function akron_private.record_activity();
create trigger cms_media_audit after insert on storage.objects for each row execute function akron_private.record_activity();

create function public.cms_touch_member() returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.cms_members set last_seen_at = now() where user_id = auth.uid()
    and (last_seen_at is null or last_seen_at < now() - interval '1 minute');
end; $$;
create function public.cms_list_members()
returns table(user_id uuid, role text, email text, last_seen_at timestamptz, last_sign_in_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if akron_private.member_role() is distinct from 'admin' then raise exception 'Not authorized' using errcode='42501'; end if;
  return query select m.user_id,m.role,u.email::text,m.last_seen_at,u.last_sign_in_at
    from public.cms_members m join auth.users u on u.id=m.user_id order by u.email;
end; $$;
revoke all on function public.cms_touch_member(), public.cms_list_members() from public, anon;
grant execute on function public.cms_touch_member(), public.cms_list_members() to authenticated;

-- Only the server service role may accept public submissions. Serialized rate limit.
create function public.cms_accept_inquiry(fields jsonb, fingerprint text) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare inquiry_id uuid;
begin
  if fingerprint is null or length(fingerprint) <> 64 then raise exception 'Invalid fingerprint'; end if;
  if jsonb_typeof(fields) <> 'object' or exists (
    select 1 from jsonb_each_text(fields) where length(value)>3000
  ) then raise exception 'Invalid submission'; end if;
  if exists (select 1 from unnest(array['pickup','delivery','date','cargo','name','email']) k
    where coalesce(trim(fields->>k),'')='') then raise exception 'Missing fields'; end if;
  perform pg_advisory_xact_lock(hashtextextended(fingerprint,0));
  if (select count(*) from public.cms_inquiries where spam_fingerprint=fingerprint
    and created_at>now()-interval '10 minutes')>=5 then
    raise exception 'Příliš mnoho poptávek. Počkejte prosím několik minut.';
  end if;
  insert into public.cms_inquiries(loading_place,unloading_place,requested_date,frequency,cargo,contact_name,email,phone,spam_fingerprint)
    values(fields->>'pickup',fields->>'delivery',fields->>'date',coalesce(fields->>'frequency','unknown'),fields->>'cargo',fields->>'name',fields->>'email',fields->>'phone',fingerprint)
    returning id into inquiry_id;
  return inquiry_id;
end; $$;
revoke all on function public.cms_accept_inquiry(jsonb,text) from public, anon, authenticated;
grant execute on function public.cms_accept_inquiry(jsonb,text) to service_role;
commit;
