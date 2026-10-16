/** Fragment credentials stay out of HTTP requests, access logs and referrers. */
export function recoveryLink(origin: string, tokenHash: string) {
  if (!/^[a-f0-9]{56}$/i.test(tokenHash)) throw new Error('Invalid recovery token')
  const url = new URL('/admin/accept', origin)
  url.hash = new URLSearchParams({ token_hash: tokenHash, type: 'recovery' }).toString()
  return url.href
}

export function isRecoveryLink(href: string) {
  const hash = new URLSearchParams(new URL(href).hash.slice(1))
  return hash.has('token_hash') && hash.get('type') === 'recovery'
}
