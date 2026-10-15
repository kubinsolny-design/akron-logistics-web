/** Keep old CMS documents and inbound URLs working after renaming Contact. */
export function publicHref(value: string) {
  return value.replace(/^\/spoluprace(?=[/#?]|$)/, '/kontakt')
}

export function safePublicHref(value?: string) {
  if (!value || /[\u0000-\u001f\u007f\\]/.test(value)) return '#'
  return /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value) ? publicHref(value) : '#'
}

export function publicNavigationLabel(label: string, href: string) {
  return /^\/(?:spoluprace|kontakt)(?:[?#]|$)/.test(href) ? 'Kontakt' : label
}
