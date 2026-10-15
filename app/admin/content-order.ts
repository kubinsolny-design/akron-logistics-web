type Page = { id: string; kind: string; data: { title?: unknown; slug?: unknown } }

export function pageSlug(page: Page) {
  const slug = page.data.slug
  return slug && typeof slug === 'object' && 'current' in slug ? String(slug.current || '') : page.id.replace(/^page-/, '')
}

export function isLegalPage(page: Page) {
  return ['ochrana-osobnich-udaju', 'cookies'].includes(pageSlug(page))
}

export function sortContentPages<T extends Page>(pages: T[]): T[] {
  const priority: Record<string, number> = { home: 0, preprava: 1, moznosti: 2, spoluprace: 3, kontakt: 3, 'ochrana-osobnich-udaju': 100, cookies: 101 }
  return [...pages].sort((a, b) => (priority[pageSlug(a)] ?? 50) - (priority[pageSlug(b)] ?? 50)
    || String(a.data.title || a.id).localeCompare(String(b.data.title || b.id), 'cs'))
}
