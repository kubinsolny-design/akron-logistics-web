import { publicHref } from '../public-links'
import { withPublicContact } from '../public-contact'
import { formTextDefaults, siteTextDefaults, cookieTextDefaults } from '../site-text'

/** Materialize existing presentation defaults in the CMS, not new marketing copy. */
export function editableDocument(input: Record<string, unknown>, kind: string, contactEmail?:string) {
  function walk(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(walk)
    if (!value || typeof value !== 'object') return typeof value === 'string' ? value.replace('telefon je volitelný', 'e-mail je volitelný').replace('e-mail, případně telefon', 'telefon, případně e-mail') : value
    return Object.fromEntries(Object.entries(value).filter(([key]) => !['_id','_rev','_createdAt','_updatedAt'].includes(key)).map(([key,item]) => [key, key === 'href' && typeof item === 'string' ? publicHref(item) : walk(item)]))
  }
  const data = walk(contactEmail ? withPublicContact(input,contactEmail) : input) as Record<string, unknown>
  if (kind === 'settings') {
    const nav = Array.isArray(data.navigation) ? data.navigation as Record<string, unknown>[] : []
    data.navigation = nav.map(link => ({ ...link, label: link.label === 'Spolupráce' ? 'Kontakt' : link.label }))
    delete data.inquiryEmail
    data.formText = { ...formTextDefaults, ...(data.formText as object || {}) }
    data.siteText = { ...siteTextDefaults, ...(data.siteText as object || {}) }
    data.cookieText = { ...cookieTextDefaults, ...(data.cookieText as object || {}) }
    return data
  }
  const slug = (data.slug as { current?: string })?.current
  if (slug === 'spoluprace' && /spolupráce/i.test(String(data.title))) data.title = 'Kontakt'
  if (Array.isArray(data.sections)) data.sections = (data.sections as Record<string, unknown>[]).map(section => {
    const next = { ...section }
    if (slug === 'home' && next.layout === 'hero' && Array.isArray(next.actions)) next.actions = next.actions.slice(0,1)
    if (slug === 'moznosti' && !next.image && !next.imagePath && (next.layout === 'hero' || (next.layout === 'text' && !next.anchor))) next.imagePath = next.layout === 'hero' ? '/images/trucks-highway.png' : '/images/logistics-coordination.jpg'
    return next
  })
  return data
}
