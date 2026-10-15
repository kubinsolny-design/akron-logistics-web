-- Run only against the disposable local fixture database.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$ begin
  if exists(select from public.cms_inquiry_settings) then raise exception 'Editor routing leak'; end if;
  begin perform public.cms_update_inquiry_settings('a@example.com','b@example.com',1);
    raise exception 'Editor routing write'; exception when insufficient_privilege then null; end;
end; $$;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
do $$ begin
  if exists(select from public.cms_inquiry_settings) then raise exception 'Viewer routing leak'; end if;
  begin perform public.cms_update_inquiry_settings('a@example.com','b@example.com',1);
    raise exception 'Viewer routing write'; exception when insufficient_privilege then null; end;
end; $$;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.cms_update_inquiry_settings('contact@example.com','dispatch@example.com',1);
do $$ begin
  if not exists(select from public.cms_inquiry_settings where public_email='contact@example.com' and recipient_email='dispatch@example.com' and revision=2) then raise exception 'Admin save failed'; end if;
  if not exists(select from public.cms_activity where action='inquiry_settings' and actor_id=auth.uid()) then raise exception 'Missing audit'; end if;
  begin perform public.cms_update_inquiry_settings('other@example.com','dispatch@example.com',1);
    raise exception 'Lost update'; exception when raise_exception then if sqlerrm <> 'Settings changed' then raise; end if; end;
  begin perform public.cms_update_inquiry_settings('invalid','dispatch@example.com',2);
    raise exception 'Invalid address accepted'; exception when check_violation then null; end;
end; $$;
reset role;
set local role anon;
do $$ begin
  begin perform * from public.cms_inquiry_settings;
    raise exception 'Anonymous routing leak'; exception when insufficient_privilege then null; end;
  begin perform public.cms_update_inquiry_settings('a@example.com','b@example.com',1);
    raise exception 'Anonymous routing write'; exception when insufficient_privilege then null; end;
end; $$;
reset role;
set local role service_role;
do $$ begin
  if not exists(select from public.cms_inquiry_settings) then raise exception 'Service read failed'; end if;
  begin update public.cms_inquiry_settings set recipient_email='unapproved@example.com';
    raise exception 'Service routing write'; exception when insufficient_privilege then null; end;
  begin perform public.cms_accept_inquiry('{}',repeat('0',64));
    raise exception 'Bad readiness probe'; exception when raise_exception then if sqlerrm <> 'Missing fields' then raise; end if; end;
end; $$;
rollback;
