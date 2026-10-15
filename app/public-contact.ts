/** Keep legacy company contact mentions in published CMS text in sync with the
 * dedicated live contact setting. Other addresses and stored drafts stay intact. */
export function withPublicContact<T>(value: T, email: string): T {
  if (typeof value === 'string') return value.replace(/(?:info|adam[.]bartusek)@akronlogistics[.]cz/gi, () => email) as T
  if (Array.isArray(value)) return value.map(item => withPublicContact(item, email)) as T
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, withPublicContact(item, email)])) as T
  return value
}
