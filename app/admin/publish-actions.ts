'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { currentMember } from '../../supabase/server'
import { publicContentTag } from '../../supabase/content-cache'

export async function publishDocument(documentId: unknown, revision: unknown): Promise<{ ok: boolean; message: string }> {
  try {
    const member = await currentMember()
    if (!member || !['admin', 'editor'].includes(member.role)) return { ok: false, message: 'Publikovat může pouze přihlášený administrátor nebo uživatel s oprávněním upravovat obsah.' }
    if (typeof documentId !== 'string' || !/^[a-z0-9._-]{1,200}$/i.test(documentId) || typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 1) return { ok: false, message: 'Neplatná stránka nebo verze. Obnovte administraci.' }
    // Caller-bound RPC preserves database membership, handover and revision checks.
    const { error } = await member.client.rpc('cms_publish', { document_id: documentId, expected_revision: revision })
    if (error) return { ok: false, message: 'Zveřejnění se nezdařilo. Obnovte stránku a zkontrolujte aktuální verzi.' }
    updateTag(publicContentTag)
    revalidatePath('/', 'layout')
    return { ok: true, message: 'Změny jsou zveřejněné na webu.' }
  } catch { return { ok: false, message: 'Zveřejnění nebo obnovení webu se nepodařilo potvrdit. Obnovte stránku a zkontrolujte publikovanou verzi.' } }
}
