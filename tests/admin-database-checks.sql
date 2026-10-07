\set ON_ERROR_STOP on
insert into auth.users(id,email) values
('00000000-0000-0000-0000-000000000001','admin@example.invalid'),
('00000000-0000-0000-0000-000000000002','editor@example.invalid'),
('00000000-0000-0000-0000-000000000003','viewer@example.invalid');
insert into public.cms_members(user_id,role) values
('00000000-0000-0000-0000-000000000001','admin'),
('00000000-0000-0000-0000-000000000002','editor'),
('00000000-0000-0000-0000-000000000003','viewer');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select public.cms_save_draft('page-home','page','{"title":"New content"}',0);
select public.cms_publish('page-home',1);
select public.cms_touch_member();
do $$ begin
  if (select count(*) from public.cms_activity)<>0 then raise exception 'Editor audit leak'; end if;
  begin perform public.cms_list_members(); raise exception 'Editor member list allowed'; exception when insufficient_privilege then null; end;
  begin perform public.cms_set_member_role('00000000-0000-0000-0000-000000000003','admin'); raise exception 'Editor escalation'; exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
do $$ begin
  begin perform public.cms_save_draft('page-home','page','{}',1); raise exception 'Viewer write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set role service_role;
select public.cms_accept_inquiry('{"pickup":"Praha","delivery":"Brno","date":"2026-10-10","cargo":"Paleta","name":"Test","email":"test@example.invalid","phone":"","frequency":"once"}',repeat('a',64));
do $$ begin
  for i in 1..4 loop
    perform public.cms_accept_inquiry('{"pickup":"A","delivery":"B","date":"Soon","cargo":"Cargo","name":"Test","email":"test@example.invalid","phone":""}',repeat('a',64));
  end loop;
  begin
    perform public.cms_accept_inquiry('{"pickup":"A","delivery":"B","date":"Soon","cargo":"Cargo","name":"Test","email":"test@example.invalid","phone":""}',repeat('a',64));
    raise exception 'Rate limit failed';
  exception when raise_exception then
    if sqlerrm not like 'Příliš mnoho%' then raise; end if;
  end;
end $$;
reset role;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
do $$ begin
  if (select count(*) from public.cms_inquiries)<>0 then raise exception 'Viewer inquiry leak'; end if;
  begin perform public.cms_accept_inquiry('{}',repeat('b',64)); raise exception 'Client inquiry insert allowed'; exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select * from public.cms_list_members();
select public.cms_update_inquiry((select id from public.cms_inquiries limit 1),'processing','Test note');
do $$ begin
  if (select count(*) from public.cms_activity where action='draft' and actor_email='editor@example.invalid')<>1 then raise exception 'Missing draft attribution'; end if;
  if (select count(*) from public.cms_activity where action='publish')<>1 then raise exception 'Missing publication'; end if;
  if (select count(*) from public.cms_activity where action='inquiry')<>1 then raise exception 'Missing inquiry audit'; end if;
  begin perform public.cms_set_member_role('00000000-0000-0000-0000-000000000001','viewer'); raise exception 'Self downgrade allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'Admin database checks passed' as result;
