-- Disposable local fixture only. All test mutations roll back.
begin;
set local request.jwt.claim.sub='';
insert into storage.objects(bucket_id,name,owner_id) values('site-media','audit-owner-test.jpg','00000000-0000-0000-0000-000000000001');
do $$ begin
  if not exists(select from public.cms_activity where entity_id='audit-owner-test.jpg' and actor_id='00000000-0000-0000-0000-000000000001') then raise exception 'Missing storage uploader attribution'; end if;
end; $$;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$ begin
  begin perform public.cms_admin_manage('member','00000000-0000-0000-0000-000000000003',false); raise exception 'Editor revoked member'; exception when insufficient_privilege then null; end;
  begin perform public.cms_handover_content('[]'); raise exception 'Editor activated content'; exception when insufficient_privilege then null; end;
end; $$;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.cms_admin_manage('member','00000000-0000-0000-0000-000000000002',false);
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$ begin
  if akron_private.member_role() is not null then raise exception 'Revoked role still active'; end if;
  if exists(select from public.cms_drafts) then raise exception 'Revoked draft access'; end if;
  begin perform public.cms_save_draft('page-test','page','{}',0); raise exception 'Revoked user wrote'; exception when insufficient_privilege then null; end;
end; $$;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.cms_admin_manage('member','00000000-0000-0000-0000-000000000002',true);
do $$ begin
  begin perform public.cms_admin_manage('member',auth.uid()::text,false); raise exception 'Self removal allowed'; exception when raise_exception then if sqlerrm<>'Cannot remove your own access' then raise; end if; end;
end; $$;
select public.cms_admin_manage('inquiry',(select id::text from public.cms_inquiries limit 1),false);
do $$ begin if not exists(select from public.cms_inquiries where deleted_at is not null) then raise exception 'Trash failed'; end if; end; $$;
select public.cms_admin_manage('inquiry',(select id::text from public.cms_inquiries where deleted_at is not null limit 1),true);
reset role;
insert into storage.objects(bucket_id,name) values('site-media','fixture.jpg');
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.cms_save_draft('page-used','page','{"image":{"url":"https://example.supabase.co/storage/v1/object/public/site-media/fixture.jpg"}}',0);
do $$ begin
  begin perform public.cms_admin_manage('media_prepare','fixture.jpg',false); raise exception 'Referenced media removed'; exception when raise_exception then if sqlerrm<>'Media is referenced' then raise; end if; end;
end; $$;
select public.cms_save_draft('page-used','page','{"image":{"url":""}}',1);
select public.cms_admin_manage('media_prepare','fixture.jpg',false);
do $$ begin
  begin perform public.cms_save_draft('page-used','page','{"image":{"url":"https://example.supabase.co/storage/v1/object/public/site-media/fixture.jpg"}}',2);
    raise exception 'Trashed media referenced'; exception when raise_exception then if sqlerrm<>'Image is in trash; restore it before using it' then raise; end if; end;
end; $$;
select public.cms_admin_manage('media_cancel',(select id::text from public.cms_media_trash where path='fixture.jpg'),false);
select public.cms_save_draft('page-home','page','{"title":"Unpublished customer concept"}',(select revision from public.cms_drafts where id='page-home'));
select public.cms_handover_content('[{"id":"site-settings","kind":"settings","data":{"name":"Test"}},{"id":"page-a","kind":"page","data":{"title":"A"}},{"id":"page-b","kind":"page","data":{"title":"B"}},{"id":"page-c","kind":"page","data":{"title":"C"}},{"id":"page-d","kind":"page","data":{"title":"D"}},{"id":"page-e","kind":"page","data":{"title":"E"}},{"id":"page-home","kind":"page","data":{"title":"Published from authoritative source"}}]');
do $$ begin
  if not (select enabled from public.cms_site_state) then raise exception 'Not activated'; end if;
  if not exists(select from public.cms_content_backups) then raise exception 'Missing backup'; end if;
  if (select data->>'title' from public.cms_published where id='page-home') <> 'Published from authoritative source' then raise exception 'Wrong published content'; end if;
  if (select data->>'title' from public.cms_drafts where id='page-home') <> 'Unpublished customer concept' then raise exception 'Customer draft overwritten'; end if;
  begin perform public.cms_handover_content('[]'); raise exception 'Second activation allowed'; exception when raise_exception then if sqlerrm not in ('Invalid content','Handover already completed') then raise; end if; end;
end; $$;
reset role;
set local role anon;
select enabled from public.cms_site_state;
do $$ begin
  begin perform public.cms_admin_manage('member','00000000-0000-0000-0000-000000000002',false); raise exception 'Anon mutation'; exception when insufficient_privilege then null; end;
end; $$;
rollback;
