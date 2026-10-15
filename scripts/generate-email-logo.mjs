import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const nextRequire = createRequire(require.resolve('next/package.json'))
const sharp = nextRequire('sharp')
// Convert the supplied vector logo without changing its colours or proportions.
await sharp(new URL('../public/images/akron-black.svg',import.meta.url).pathname)
  .resize({width:440}).png().toFile(new URL('../public/images/akron-email-logo.png',import.meta.url).pathname)
