import { test } from 'node:test'
import assert from 'node:assert/strict'
import { launchConfigChecks } from '../scripts/launch-config.mjs'

const env = {
  NEXT_PUBLIC_SITE_URL: 'https://akronlogistics.cz', ADMIN_SITE_URL: 'https://akronlogistics.cz',
  NEXT_PUBLIC_ADMIN_PROVIDER: 'supabase', CMS_PROVIDER: 'supabase',
  NEXT_PUBLIC_SUPABASE_URL: 'https://htgwzjcdxbknzvobwioa.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'example-publishable', SUPABASE_SECRET_KEY: 'example-server',
  RESEND_API_KEY: 'example-resend', INQUIRY_TO_EMAIL: 'info@akronlogistics.cz',
  INQUIRY_FROM_EMAIL: 'AKRON Logistics <web@akronlogistics.cz>',
}
test('configuration audit reports booleans, never credential values', () => {
  const checks = launchConfigChecks(env)
  assert.ok(checks.every(check => check.ok))
  assert.doesNotMatch(JSON.stringify(checks), /example-server|example-resend|example-publishable/)
})
test('an old recipient, demo origin, incomplete migration switch and public secrets do not pass', () => {
  const checks = launchConfigChecks({ ...env, ADMIN_SITE_URL: 'https://akron-admin-demo.vercel.app', INQUIRY_TO_EMAIL: 'old@example.com', CMS_PROVIDER: 'sanity', NEXT_PUBLIC_SUPABASE_SECRET_KEY: 'example-not-a-real-secret' })
  assert.equal(checks.filter(check => !check.ok).length, 3)
})
test('empty and placeholder configuration is not a ready launch', () => {
  assert.ok(launchConfigChecks({}).some(check => !check.ok))
  assert.equal(launchConfigChecks({ ...env, RESEND_API_KEY: 're_xxxxxxxxx' }).find(check => check.check === 'Server-only Resend key configured').ok, false)
})
