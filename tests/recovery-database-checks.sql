-- Disposable local fixture only, after admin-database-checks.sql. Never run on production.
begin;
set local role anon;
do $$ begin
  begin
    perform public.cms_request_password_recovery('admin@example.invalid',repeat('d',64),repeat('e',64));
    raise exception 'Anonymous recovery RPC allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$ begin
  if exists(select from public.cms_recovery_limits) then raise exception 'Recovery quota readable'; end if;
exception when insufficient_privilege then null;
end $$;
do $$ begin
  begin
    perform public.cms_request_password_recovery('admin@example.invalid',repeat('d',64),repeat('e',64));
    raise exception 'Authenticated recovery RPC allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
do $$ declare target uuid; begin
  target := public.cms_request_password_recovery('admin@example.invalid',repeat('d',64),repeat('e',64));
  if target is distinct from '00000000-0000-0000-0000-000000000001'::uuid then raise exception 'Active member recovery failed'; end if;
  if public.cms_request_password_recovery('admin@example.invalid',repeat('d',64),repeat('e',64)) is not null then raise exception 'Recovery cooldown bypass'; end if;
  for i in 1..2 loop
    update public.cms_recovery_limits set last_request=now()-interval '61 seconds' where key='email:'||repeat('d',64);
    if public.cms_request_password_recovery('admin@example.invalid',repeat('d',64),repeat('e',64)) is null then raise exception 'Expected recovery request denied'; end if;
  end loop;
  update public.cms_recovery_limits set last_request=now()-interval '61 seconds' where key='email:'||repeat('d',64);
  if public.cms_request_password_recovery('admin@example.invalid',repeat('d',64),repeat('e',64)) is not null then raise exception 'Hourly recovery limit bypass'; end if;
  if public.cms_request_password_recovery('unknown@example.invalid',repeat('f',64),repeat('e',64)) is not null then raise exception 'Unknown identity accepted'; end if;
end $$;
reset role;
update public.cms_members set revoked_at=now() where user_id='00000000-0000-0000-0000-000000000002';
set local role service_role;
do $$ begin
  if public.cms_request_password_recovery('editor@example.invalid',repeat('a',64),repeat('b',64)) is not null then raise exception 'Revoked identity accepted'; end if;
end $$;
rollback;
select 'Recovery database checks passed; no email sent' as result;
