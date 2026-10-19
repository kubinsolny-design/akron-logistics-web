-- Additive only: no existing users, roles, CMS content or inquiries are changed.
begin;
create table public.cms_recovery_limits (
  key text primary key,
  window_start timestamptz not null,
  last_request timestamptz not null,
  requests integer not null check (requests > 0)
);
alter table public.cms_recovery_limits enable row level security;
revoke all on public.cms_recovery_limits from public, anon, authenticated;
grant select, insert, update, delete on public.cms_recovery_limits to service_role;

create function public.cms_request_password_recovery(email_address text, email_fingerprint text, ip_fingerprint text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  moment timestamptz := clock_timestamp();
  scope text; duration interval; maximum integer; bucket record; target uuid;
begin
  if email_address is null or length(email_address) > 254
    or email_address !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    or email_fingerprint is null or email_fingerprint !~ '^[a-f0-9]{64}$'
    or ip_fingerprint is null or ip_fingerprint !~ '^[a-f0-9]{64}$' then return null; end if;
  -- One lock serializes all three quotas across every application instance.
  perform pg_advisory_xact_lock(hashtextextended('akron-password-recovery-quota', 0));
  foreach scope in array array['global', 'ip:' || ip_fingerprint, 'email:' || email_fingerprint] loop
    duration := case when scope like 'email:%' then interval '1 hour' else interval '15 minutes' end;
    maximum := case when scope = 'global' then 30 when scope like 'ip:%' then 10 else 3 end;
    select * into bucket from public.cms_recovery_limits where key = scope;
    if found and bucket.window_start > moment - duration and
      (bucket.requests >= maximum or (scope like 'email:%' and bucket.last_request > moment - interval '60 seconds')) then return null; end if;
  end loop;
  delete from public.cms_recovery_limits where last_request < moment - interval '2 days';
  foreach scope in array array['global', 'ip:' || ip_fingerprint, 'email:' || email_fingerprint] loop
    duration := case when scope like 'email:%' then interval '1 hour' else interval '15 minutes' end;
    insert into public.cms_recovery_limits(key, window_start, last_request, requests) values(scope, moment, moment, 1)
    on conflict (key) do update set
      requests = case when public.cms_recovery_limits.window_start <= moment - duration then 1 else public.cms_recovery_limits.requests + 1 end,
      window_start = case when public.cms_recovery_limits.window_start <= moment - duration then moment else public.cms_recovery_limits.window_start end,
      last_request = moment;
  end loop;
  -- Unknown and revoked identities consume quotas too, but receive no email.
  select u.id into target from auth.users u join public.cms_members m on m.user_id = u.id
    where lower(u.email) = lower(trim(email_address)) and m.revoked_at is null
      and m.role in ('admin', 'editor', 'viewer') limit 1;
  return target;
end;
$$;
revoke all on function public.cms_request_password_recovery(text,text,text) from public, anon, authenticated;
grant execute on function public.cms_request_password_recovery(text,text,text) to service_role;
commit;
