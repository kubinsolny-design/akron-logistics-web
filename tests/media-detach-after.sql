-- Disposable local DB assertions. All test writes are rolled back.
begin;
do $$ begin
  if (select data->>'title' from public.cms_drafts where id='page-home')<>'Unpublished title stays private' then raise exception 'Draft was replaced'; end if;
  if (select data->>'title' from public.cms_published where id='page-home')<>'Public title stays public' then raise exception 'Draft was published'; end if;
  if (select data#>>'{image,url}' from public.cms_drafts where id='page-home')<>'/images/trucks-highway.png' then raise exception 'Asset mapping failed'; end if;
  if (select data#>>'{image,alt}' from public.cms_drafts where id='page-home')<>'Keep alt' then raise exception 'Alt lost'; end if;
  if (select data#>>'{nested,0,imagePath}' from public.cms_drafts where id='page-home')<>'/images/europe-map.svg' then raise exception 'URL mapping failed'; end if;
  if (select data#>>'{image,url}' from public.cms_published where id='page-home')<>'/images/akron-white.svg' then raise exception 'Replacement was overwritten'; end if;
  if not exists(select from public.cms_content_backups where documents->>'purpose'='before-legacy-media-detach-20261015') then raise exception 'Backup missing'; end if;
  if exists(select from pg_proc p join pg_namespace n on p.pronamespace=n.oid where n.nspname='akron_private' and proname='detach_legacy_media') then raise exception 'Temporary function left exposed'; end if;
end; $$;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$ declare revision bigint; begin
  if exists(select from public.cms_content_backups) then raise exception 'Editor can read backup'; end if;
  select d.revision into revision from public.cms_drafts d where id='page-home';
  begin
    perform public.cms_save_draft('page-home','page','{"image":{"asset":{"_ref":"image-stale-100x100-png"}}}',revision);
    raise exception 'Stale external asset accepted';
  exception when raise_exception then if sqlerrm not like 'External CMS media is retired%' then raise; end if; end;
  begin
    perform public.cms_save_draft('page-home','page','{"imagePath":"https://cdn.sanity.io/images/old.png"}',revision);
    raise exception 'External CDN accepted';
  exception when raise_exception then if sqlerrm not like 'External CMS media is retired%' then raise; end if; end;
  perform public.cms_save_draft('page-home','page','{"image":{"url":"/images/trucks-highway.png"}}',revision);
end; $$;
reset role;
insert into public.cms_media_trash(path) values('deleted.jpg');
do $$ begin
  begin
    update public.cms_drafts set data='{"image":{"url":"https://htgwzjcdxbknzvobwioa.supabase.co/storage/v1/object/public/site-media/deleted.jpg"}}' where id='page-home';
    raise exception 'Trash guard was lost';
  exception when raise_exception then if sqlerrm<>'Image is in trash; restore it before using it' then raise; end if; end;
end; $$;
rollback;
