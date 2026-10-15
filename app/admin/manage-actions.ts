'use server'
import { currentMember, serviceClient } from '../../supabase/server'

export async function trashRecord(kind: 'member'|'inquiry', id: string, restore=false) {
  try {
    const member=await currentMember()
    if (!member || member.role!=='admin' || !['member','inquiry'].includes(kind) || !/^[0-9a-f-]{36}$/i.test(id) || typeof restore!=='boolean') return {ok:false,message:'Operaci může provést pouze administrátor.'}
    const {error}=await member.client.rpc('cms_admin_manage',{operation:kind,target:id,restore})
    if (error) return {ok:false,message:'Operace nebyla provedena. Nelze odebrat vlastní ani poslední administrátorský přístup.'}
    return {ok:true,message:restore?'Záznam byl obnoven.':kind==='member'?'Přístup byl odebrán. Účet už nemůže používat administraci; přístup lze obnovit.':'Poptávka byla přesunuta do koše a lze ji obnovit.'}
  } catch {return {ok:false,message:'Operace se nezdařila. Ověřte přihlášení a propojení databáze.'}}
}

export async function trashMedia(path: string) {
  try {
    const member=await currentMember()
    if (!member || member.role!=='admin' || typeof path!=='string' || path.length>512 || !/^[a-z0-9_/-]+\.[a-z0-9]+$/i.test(path) || path.includes('..') || path.startsWith('/')) return {ok:false,message:'Neplatný soubor nebo nedostatečný přístup.'}
    const {data,error}=await member.client.rpc('cms_admin_manage',{operation:'media_prepare',target:path})
    if (error) return {ok:false,message:error.message==='Media is referenced'?'Soubor používá publikovaná stránka nebo koncept. Nejdříve jej nahraďte či odeberte ze všech míst a uložte/publikujte změny.':'Soubor nelze přesunout do koše.'}
    const {error:moveError}=await serviceClient().storage.from('site-media').move(path,data.id,{destinationBucket:'site-media-trash'})
    if (moveError) {await member.client.rpc('cms_admin_manage',{operation:'media_cancel',target:data.id});return {ok:false,message:'Přesun souboru se nezdařil. Původní soubor nebyl odstraněn.'}}
    const {error:finishError}=await member.client.rpc('cms_admin_manage',{operation:'media_complete',target:data.id})
    if (finishError) return {ok:false,message:'Soubor je v soukromém koši, ale dokončení zápisu vyžaduje kontrolu správce. Nemažte jej ručně.'}
    return {ok:true,message:'Soubor byl přesunut do soukromého koše. Z webu již není veřejně dostupný a lze jej obnovit.'}
  } catch {return {ok:false,message:'Přesun se nepodařilo dokončit. Ověřte propojení úložiště.'}}
}
export async function restoreMedia(id: string) {
  try {
    const member=await currentMember()
    if (!member || member.role!=='admin' || !/^[0-9a-f-]{36}$/i.test(id)) return {ok:false,message:'Nedostatečný přístup.'}
    const {data,error}=await member.client.from('cms_media_trash').select('id,path,state').eq('id',id).single()
    if (error || !data || data.state!=='trashed') return {ok:false,message:'Soubor není v koši.'}
    const {error:moveError}=await serviceClient().storage.from('site-media-trash').move(id,data.path,{destinationBucket:'site-media'})
    if (moveError) return {ok:false,message:'Obnovení se nezdařilo. Na původní cestě může být jiný soubor; nic se nepřepisuje.'}
    const {error:finishError}=await member.client.rpc('cms_admin_manage',{operation:'media_restore',target:id})
    return finishError?{ok:false,message:'Soubor byl přesunut zpět; dokončení zápisu vyžaduje kontrolu správce.'}:{ok:true,message:'Soubor byl obnoven na původní adresu.'}
  } catch {return {ok:false,message:'Obnovení se nezdařilo.'}}
}
