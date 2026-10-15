-- Additive live contact/delivery settings. Does not publish drafts or change roles.
begin;
create table public.cms_inquiry_settings (
  id boolean primary key default true check (id),
  public_email text not null check (length(public_email) <= 254 and public_email ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?([.][a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$'),
  recipient_email text not null check (length(recipient_email) <= 254 and recipient_email ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?([.][a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$'),
  revision integer not null default 1 check (revision > 0)
);
alter table public.cms_inquiry_settings enable row level security;
revoke all on public.cms_inquiry_settings from public, anon, authenticated, service_role;
grant select, update on public.cms_inquiry_settings to authenticated;
grant select on public.cms_inquiry_settings to service_role;
create policy inquiry_settings_admin_read on public.cms_inquiry_settings for select to authenticated
  using ((select akron_private.member_role()) = 'admin');
create policy inquiry_settings_admin_update on public.cms_inquiry_settings for update to authenticated
  using ((select akron_private.member_role()) = 'admin') with check ((select akron_private.member_role()) = 'admin');
insert into public.cms_inquiry_settings(public_email, recipient_email)
values ('adam.bartusek@akronlogistics.cz', 'adam.bartusek@akronlogistics.cz');

create function akron_private.audit_inquiry_settings() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.public_email = new.public_email and old.recipient_email = new.recipient_email then
    new.revision := old.revision; return new;
  end if;
  new.revision := old.revision + 1;
  insert into public.cms_activity(actor_id,actor_email,action,entity_id,before_data,after_data)
  values(auth.uid(),(select email from auth.users where id=auth.uid()),'inquiry_settings','email-settings',
    jsonb_build_object('public_email',old.public_email,'recipient_email',old.recipient_email),
    jsonb_build_object('public_email',new.public_email,'recipient_email',new.recipient_email));
  return new;
end; $$;
revoke all on function akron_private.audit_inquiry_settings() from public,anon,authenticated;
create trigger inquiry_settings_audit before update on public.cms_inquiry_settings
for each row execute function akron_private.audit_inquiry_settings();

create function public.cms_update_inquiry_settings(contact_email text, delivery_email text, expected_revision integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare saved_revision integer;
begin
  if akron_private.member_role() is distinct from 'admin' then raise exception 'Not authorized' using errcode='42501'; end if;
  update public.cms_inquiry_settings set public_email=lower(trim(contact_email)), recipient_email=lower(trim(delivery_email))
  where id=true and revision=expected_revision returning revision into saved_revision;
  if saved_revision is null then raise exception 'Settings changed'; end if;
  return saved_revision;
end; $$;
revoke all on function public.cms_update_inquiry_settings(text,text,integer) from public,anon;
grant execute on function public.cms_update_inquiry_settings(text,text,integer) to authenticated;

-- Avoid ambiguous backslash escaping in remote SQL tools; retain all validation/quota rules.
create or replace function public.cms_accept_inquiry(fields jsonb, fingerprint text) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare inquiry_id uuid; phone_digits text;
begin
  if fingerprint is null or fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'Invalid fingerprint'; end if;
  if fields is null or jsonb_typeof(fields) <> 'object' then raise exception 'Invalid submission'; end if;
  if exists (select 1 from jsonb_each(fields) where jsonb_typeof(value) <> 'string' or length(value #>> '{}') > 3000)
    then raise exception 'Invalid submission'; end if;
  if exists (select 1 from unnest(array['pickup','delivery','date','cargo','name','phone']) k
    where coalesce(trim(fields->>k),'')='') then raise exception 'Missing fields'; end if;
  phone_digits := regexp_replace(fields->>'phone','[^0-9]','','g');
  if length(fields->>'phone') > 40 or length(phone_digits) not between 7 and 15
    or fields->>'phone' !~ '^[+]?[0-9[:space:]().-]+$' then raise exception 'Invalid phone'; end if;
  if coalesce(fields->>'email','') <> '' and (length(fields->>'email') > 254
    or fields->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then raise exception 'Invalid email'; end if;
  perform pg_advisory_xact_lock(hashtextextended(fingerprint,0));
  if (select count(*) from public.cms_inquiries where spam_fingerprint=fingerprint
    and created_at>now()-interval '10 minutes')>=5 then
    raise exception 'Příliš mnoho poptávek. Počkejte prosím několik minut.';
  end if;
  insert into public.cms_inquiries(loading_place,unloading_place,requested_date,frequency,cargo,contact_name,email,phone,spam_fingerprint)
    values(fields->>'pickup',fields->>'delivery',fields->>'date',coalesce(fields->>'frequency','unknown'),fields->>'cargo',fields->>'name',coalesce(fields->>'email',''),fields->>'phone',fingerprint)
    returning id into inquiry_id;
  return inquiry_id;
end; $$;
revoke all on function public.cms_accept_inquiry(jsonb,text) from public,anon,authenticated;
grant execute on function public.cms_accept_inquiry(jsonb,text) to service_role;
commit;
