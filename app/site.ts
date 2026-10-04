export const company = {
  name: 'AKRON Logistics s.r.o.',
  contactName: 'Adam Bartusek',
  email: 'info@akronlogistics.cz',
  phone: '+420 606 187 648',
  phoneHref: 'tel:+420606187648',
  registrationNumber: '29858895',
  street: 'Soukenická 877/9',
  city: '702 00 Ostrava – Moravská Ostrava',
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const rawUrl = configuredUrl ?? (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000')

  return rawUrl.replace(/\/$/, '')
}
