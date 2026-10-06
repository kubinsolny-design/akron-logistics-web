-- Apply once to akron-admin-preview, not to the production website.
-- No existing Sanity data or Supabase Auth users are changed by this migration.
begin;

create schema if not exists akron_private;
revoke all on schema akron_private from public, anon;
grant usage on schema akron_private to authenticated;

create table public.cms_members (
  user_id uuid primary key references auth.users(id),
  role text not null check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now()
);
create table public.cms_drafts (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  kind text not null check (kind in ('page', 'settings')),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  check (kind <> 'settings' or id = 'site-settings')
);
create table public.cms_published (
  id text primary key references public.cms_drafts(id),
  kind text not null check (kind in ('page', 'settings')),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision bigint not null,
  published_at timestamptz not null default now()
);
create table public.cms_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  loading_place text not null,
  unloading_place text not null,
  requested_date text not null,
  cargo text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  status text not null default 'new' check (status in ('new', 'processing', 'done')),
  notes text not null default '',
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed')),
  spam_fingerprint text not null
);
create index cms_inquiries_created_at on public.cms_inquiries(created_at desc);
create index cms_inquiries_spam on public.cms_inquiries(spam_fingerprint, created_at desc);

alter table public.cms_members enable row level security;
alter table public.cms_drafts enable row level security;
alter table public.cms_published enable row level security;
alter table public.cms_inquiries enable row level security;
revoke all on public.cms_members, public.cms_drafts, public.cms_published,
  public.cms_inquiries from public, anon, authenticated;
grant select on public.cms_members, public.cms_drafts, public.cms_inquiries to authenticated;
grant select on public.cms_published to anon, authenticated;
grant all on public.cms_members, public.cms_drafts, public.cms_published,
  public.cms_inquiries to service_role;

-- Role is read from a protected table, never from editable user metadata.
create function akron_private.member_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.cms_members where user_id = (select auth.uid());
$$;
revoke all on function akron_private.member_role() from public, anon;
grant execute on function akron_private.member_role() to authenticated;

create policy members_read on public.cms_members for select to authenticated
  using (user_id = (select auth.uid()) or (select akron_private.member_role()) = 'admin');
create policy drafts_read on public.cms_drafts for select to authenticated
  using ((select akron_private.member_role()) in ('admin', 'editor', 'viewer'));
create policy published_read on public.cms_published for select to anon, authenticated
  using (true);
create policy inquiries_read on public.cms_inquiries for select to authenticated
  using ((select akron_private.member_role()) in ('admin', 'editor'));

-- Writes go through revision-checked functions, not unrestricted client updates.
create function public.cms_save_draft(
  document_id text, document_kind text, document_data jsonb, expected_revision bigint
) returns bigint language plpgsql security definer set search_path = '' as $$
declare current_revision bigint; next_revision bigint;
begin
  if coalesce(akron_private.member_role(), '') not in ('admin', 'editor') then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('akron-document:' || document_id, 0));
  select revision into current_revision from public.cms_drafts where id = document_id for update;
  if coalesce(current_revision, 0) <> expected_revision then
    raise exception 'Document changed; reload before saving' using errcode = '40001';
  end if;
  next_revision := coalesce(current_revision, 0) + 1;
  insert into public.cms_drafts(id, kind, data, revision, updated_by)
    values (document_id, document_kind, document_data, next_revision, auth.uid())
  on conflict (id) do update set kind = excluded.kind, data = excluded.data,
    revision = excluded.revision, updated_at = now(), updated_by = excluded.updated_by;
  return next_revision;
end;
$$;

create function public.cms_publish(document_id text, expected_revision bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare document public.cms_drafts;
begin
  if coalesce(akron_private.member_role(), '') not in ('admin', 'editor') then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('akron-document:' || document_id, 0));
  select * into document from public.cms_drafts where id = document_id for update;
  if not found or document.revision <> expected_revision then
    raise exception 'Document changed; reload before publishing' using errcode = '40001';
  end if;
  insert into public.cms_published(id, kind, data, revision)
    values (document.id, document.kind,
      case when document.kind = 'settings' then document.data - 'inquiryEmail' else document.data end,
      document.revision)
  on conflict (id) do update set kind = excluded.kind, data = excluded.data,
    revision = excluded.revision, published_at = now();
end;
$$;

-- Application members only; this does not grant access to the Supabase dashboard.
create function public.cms_set_member_role(target_user uuid, new_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  lock table public.cms_members in exclusive mode;
  if coalesce(akron_private.member_role(), '') <> 'admin' then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if target_user = auth.uid() then
    raise exception 'Cannot change your own access' using errcode = '42501';
  end if;
  if new_role is null or new_role not in ('admin', 'editor', 'viewer') then
    raise exception 'Invalid role' using errcode = '22023';
  end if;
  if exists(select 1 from public.cms_members where user_id = target_user and role = 'admin')
     and new_role <> 'admin'
     and (select count(*) from public.cms_members where role = 'admin') <= 1 then
    raise exception 'Cannot remove the last administrator' using errcode = '42501';
  end if;
  insert into public.cms_members(user_id, role) values(target_user, new_role)
    on conflict(user_id) do update set role = excluded.role;
end;
$$;

create function public.cms_update_inquiry(inquiry_id uuid, new_status text, new_notes text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(akron_private.member_role(), '') not in ('admin', 'editor') then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if new_notes is null or length(new_notes) > 10000 then
    raise exception 'Invalid notes' using errcode = '22023';
  end if;
  update public.cms_inquiries set status = new_status, notes = new_notes where id = inquiry_id;
end;
$$;

revoke all on function public.cms_save_draft(text, text, jsonb, bigint),
  public.cms_publish(text, bigint), public.cms_set_member_role(uuid, text),
  public.cms_update_inquiry(uuid, text, text) from public, anon;
grant execute on function public.cms_save_draft(text, text, jsonb, bigint),
  public.cms_publish(text, bigint), public.cms_set_member_role(uuid, text),
  public.cms_update_inquiry(uuid, text, text) to authenticated;

-- Public images only. No inquiry files or personal documents belong in this bucket.
-- SVG is deliberately not accepted from client uploads; existing trusted logos
-- can remain local assets until a separate sanitized migration is implemented.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp']);
create policy akron_media_read on storage.objects for select to authenticated
  using (bucket_id = 'site-media' and (select akron_private.member_role()) in ('admin', 'editor', 'viewer'));
create policy akron_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and (select akron_private.member_role()) in ('admin', 'editor'));
-- No client overwrite/delete policy: replacing an image creates a new object.

commit;
