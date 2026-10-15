-- No network calls. Source assets are now versioned static files in our deployment.
-- Archive current drafts and publications separately; never publish draft content.
begin;
set local lock_timeout='10s';
set local statement_timeout='60s';

create function akron_private.detach_legacy_media(value jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare
  result jsonb; item record; reference text; target text; source text;
  manifest constant jsonb := '{
    "image-06d7edd50ef549a74240ff63181648635e3b6487-875x280-svg":"/images/akron-black.svg",
    "image-6f85a8b43ac5b7d0aef16cb4dc042eab35a56f1b-875x280-svg":"/images/akron-white.svg",
    "image-7e2bac914f3b0268283f7854464c7916b6b5e0e7-1672x941-jpg":"/images/logistics-coordination.jpg",
    "image-96e4c65adab784362c4b490194aa0c7c5eda9cf0-2055x765-png":"/images/trucks-highway.png",
    "image-bc5eecffd2efc0c981063a12a94f04e79420042d-800x760-svg":"/images/europe-map.svg"
  }';
begin
  if jsonb_typeof(value)='array' then
    select coalesce(jsonb_agg(akron_private.detach_legacy_media(v) order by n),'[]'::jsonb)
      into result from jsonb_array_elements(value) with ordinality e(v,n);
    return result;
  elsif jsonb_typeof(value)='object' then
    result:=value;
    reference:=value#>>'{asset,_ref}';
    if reference is not null then
      target:=manifest->>reference;
      if target is null then raise exception 'Unmapped legacy asset: %',reference; end if;
      -- An already chosen replacement has priority over the old imported reference.
      if coalesce(value->>'url','')<>'' then target:=akron_private.detach_legacy_media(value->'url')#>>'{}'; end if;
      result:=(value-'asset')||jsonb_build_object('url',target);
    end if;
    for item in select key,val from jsonb_each(result) e(key,val) loop
      result:=jsonb_set(result,array[item.key],akron_private.detach_legacy_media(item.val));
    end loop;
    return result;
  elsif jsonb_typeof(value)='string' then
    source:=value#>>'{}';
    if source ~* 'sanity[.]io' then
      for item in select key,val from jsonb_each_text(manifest) e(key,val) loop
        reference:=regexp_replace(substring(item.key from 7),'-([a-z0-9]+)$','.\1');
        if split_part(source,'?',1)='https://cdn.sanity.io/images/l802e097/production/'||reference then return to_jsonb(item.val); end if;
      end loop;
      raise exception 'Unmapped legacy URL; migration stopped without changing content';
    end if;
  end if;
  return value;
end; $$;
revoke all on function akron_private.detach_legacy_media(jsonb) from public,anon,authenticated;

-- Same lock order as save/publish: per-document first, shared media lock second.
do $$ declare entry record; begin
  for entry in select id from public.cms_drafts order by id loop
    perform pg_advisory_xact_lock(hashtextextended('akron-document:'||entry.id,0));
  end loop;
  perform pg_advisory_xact_lock(hashtextextended('akron-content-media',0));
end; $$;

insert into public.cms_content_backups(actor_id,documents) values(auth.uid(),jsonb_build_object(
  'purpose','before-legacy-media-detach-20261015',
  'drafts',(select jsonb_agg(to_jsonb(d) order by id) from public.cms_drafts d),
  'published',(select jsonb_agg(to_jsonb(p) order by id) from public.cms_published p)));

update public.cms_drafts set data=akron_private.detach_legacy_media(data),revision=revision+1,updated_at=now()
  where data is distinct from akron_private.detach_legacy_media(data);
update public.cms_published set data=akron_private.detach_legacy_media(data),revision=revision+1,published_at=now()
  where data is distinct from akron_private.detach_legacy_media(data);

-- A stale editor tab cannot reintroduce removed CDN references after migration.
create or replace function akron_private.guard_media_references() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('akron-content-media',0));
  if new.data::text ~* 'sanity[.]io' or jsonb_path_exists(new.data,'strict $.**.asset._ref') then
    raise exception 'External CMS media is retired; reload the editor and use local or Storage media';
  end if;
  if exists(select from public.cms_media_trash t where t.state in ('pending','trashed')
    and strpos(new.data::text,'/storage/v1/object/public/site-media/'||t.path)>0) then
    raise exception 'Image is in trash; restore it before using it';
  end if;
  return new;
end; $$;
revoke all on function akron_private.guard_media_references() from public,anon,authenticated;

-- Confirm all live documents converted. An unknown legacy reference aborts the transaction.
do $$ begin
  if exists(select from public.cms_drafts where data::text ~* 'sanity[.]io' or jsonb_path_exists(data,'strict $.**.asset._ref'))
    or exists(select from public.cms_published where data::text ~* 'sanity[.]io' or jsonb_path_exists(data,'strict $.**.asset._ref')) then
    raise exception 'Legacy references remain';
  end if;
end; $$;
insert into public.cms_activity(actor_id,actor_email,action,entity_id,after_data)
values(auth.uid(),'database migration','legacy_media_detach','website',jsonb_build_object('assets',5,'drafts_preserved',true));

-- The one-off conversion helper is not a permanent API.
drop function akron_private.detach_legacy_media(jsonb);
commit;
