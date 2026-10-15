'use server'
import { currentMember } from '../../supabase/server'
import { client } from '../../sanity/client'
import { editableDocument } from './handover-content'
import { revalidatePath } from 'next/cache'
import { publicContactEmail } from '../../supabase/inquiry-settings'

export async function activateContentHandover() {
  try {
    const member = await currentMember()
    if (!member || member.role !== 'admin') return { ok:false, message:'Převod může provést jen administrátor.' }
    // Authoritative published source only. Never accept document content from the browser.
    const source = await client.withConfig({ perspective:'published', token:undefined }).fetch<Record<string,unknown>[]>('*[(_type == "page" || _id == "siteSettings") && !(_id in path("drafts.**"))]', {}, { cache:'no-store', signal:AbortSignal.timeout(10_000) })
    if (!source.some(row => row._id === 'siteSettings') || source.filter(row=>row._type==='page').length < 6) return { ok:false,message:'Zdrojový obsah není kompletní. Nic se nezměnilo.' }
    const email=await publicContactEmail()
    const documents = source.map(row => {
      const settings = row._id === 'siteSettings', slug = (row.slug as {current?:string})?.current
      if (!settings && (!slug || !/^[a-z0-9][a-z0-9-]{0,74}$/.test(slug))) throw new Error('Invalid slug')
      return {id:settings?'site-settings':`page-${slug}`,kind:settings?'settings':'page',data:editableDocument(row,settings?'settings':'page',email)}
    })
    const {data,error} = await member.client.rpc('cms_handover_content',{documents})
    if (error) return {ok:false,message:error.message==='Handover already completed'?'Převod už je dokončený. Obnovte stránku.':'Převod se nezdařil. Ověřte migraci; změny transakce se neprovedly.'}
    revalidatePath('/','layout')
    return {ok:true,message:`Propojeno ${data.documents} dokumentů. Záloha je uložená; odlišné rozpracované koncepty zůstaly zachované (${data.preservedDrafts}). Obnovte administraci.`}
  } catch {return {ok:false,message:'Zdroj nebo databáze nejsou dostupné. Nic automaticky nepublikujeme.'}}
}
