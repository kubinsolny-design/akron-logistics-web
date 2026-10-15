import { launchConfigChecks } from './launch-config.mjs'

const checks = launchConfigChecks(process.env)
for (const { check, ok } of checks) console.log(`${ok ? 'PASS' : 'PENDING'} ${check}`)
console.log('Configuration only: backup, migration, Auth redirects, DNS, permissions and actual delivery require separate verification. No secret values printed.')
if (checks.some(check => !check.ok)) process.exitCode = 1
