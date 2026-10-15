/** Only trusted server configuration may determine invite destinations. */
export function adminOrigin(value: string | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null
    return url.origin
  } catch { return null }
}
