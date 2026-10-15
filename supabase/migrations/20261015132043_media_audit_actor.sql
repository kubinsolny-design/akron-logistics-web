-- Storage may write through its service connection without auth.uid(). Its
-- server-maintained owner_id still identifies the authenticated uploader.
begin;
create or replace function akron_private.record_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare old_data jsonb; new_data jsonb; entity text; operation text; actor uuid := auth.uid();
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
    if actor is null then
      select user_id into actor from public.cms_members
      where user_id::text = coalesce(new_data->>'owner_id',new_data->>'owner') and revoked_at is null;
    end if;
    operation := 'media'; entity := new.name;
    old_data := null; new_data := jsonb_build_object('file',new.name);
  else
    operation := case tg_table_name when 'cms_drafts' then 'draft' else 'publish' end;
    entity := coalesce(new_data,old_data)->>'id';
    old_data := old_data->'data'; new_data := new_data->'data';
    if old_data is not distinct from new_data then return new; end if;
  end if;
  insert into public.cms_activity(actor_id,actor_email,action,entity_id,before_data,after_data)
  values(actor,(select email from auth.users where id=actor),operation,entity,old_data,new_data);
  return coalesce(new,old);
end; $$;
revoke all on function akron_private.record_activity() from public,anon,authenticated;
commit;
