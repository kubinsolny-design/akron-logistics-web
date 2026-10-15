-- Apply after admin_workspace. Existing inquiries and memberships are untouched.
begin;
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
    or fields->>'phone' !~ '^\+?[0-9[:space:]().-]+$' then raise exception 'Invalid phone'; end if;
  if coalesce(fields->>'email','') <> '' and (length(fields->>'email') > 254
    or fields->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Invalid email'; end if;
  -- Atomic quota by trusted IP fingerprint, independent of mutable contact fields.
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
revoke all on function public.cms_accept_inquiry(jsonb,text) from public, anon, authenticated;
grant execute on function public.cms_accept_inquiry(jsonb,text) to service_role;
commit;
