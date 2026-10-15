import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

// Vercel overwrites this header. Never combine the limit with attacker-controlled
// phone/email, otherwise changing those values would reset the submission quota.
export function requestFingerprint(headers: { get(name: string): string | null }, secret: string, vercel: boolean) {
  const candidate = vercel ? (headers.get('x-vercel-forwarded-for') || headers.get('x-forwarded-for') || '').split(',')[0].trim() : ''
  const ip = isIP(candidate) ? candidate : 'unknown'
  return createHmac('sha256', secret).update(`inquiry-ip:${ip}`).digest('hex')
}
