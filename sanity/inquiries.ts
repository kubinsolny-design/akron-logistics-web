import 'server-only'
import { createClient } from '@sanity/client'
import { randomUUID } from 'node:crypto'
import { headers } from 'next/headers'
import { requestFingerprint } from '../app/request-fingerprint'

function privateClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) return null
  return createClient({ projectId: process.env.SANITY_PROJECT_ID || 'l802e097', dataset: 'inquiries', apiVersion: '2026-10-01', token, useCdn: false, timeout: 10000 })
}

export async function storeInquiry(fields: Record<string, string>) {
  const client = privateClient()
  if (!client) return null
  // Fail closed if someone changes the inquiry dataset to public.
  const datasets = await client.datasets.list()
  if (datasets.find(d => d.name === 'inquiries')?.aclMode !== 'private') throw new Error('Private inquiry dataset is not ready.')
  const requestHeaders = await headers()
  const senderHash = requestFingerprint(requestHeaders, process.env.SANITY_API_WRITE_TOKEN!, process.env.VERCEL === '1')
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const recent = await client.fetch<number>('count(*[_type == "inquiry" && senderHash == $hash && createdAt > $since])', { hash: senderHash, since })
  if (recent >= 5) throw new Error('Příliš mnoho poptávek. Počkejte prosím několik minut.')
  const id = `inquiry-${randomUUID()}`
  await client.create({ _id: id, _type: 'inquiry', ...fields, status: 'new', emailDelivery: 'pending', createdAt: new Date().toISOString(), senderHash })
  return id
}
export async function markInquiryEmail(id: string | null, state: 'sent' | 'failed') {
  if (!id) return
  try { await privateClient()?.patch(id).set({ emailDelivery: state }).commit() }
  catch { console.error('Could not update inquiry delivery status.') }
}
