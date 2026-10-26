// Public launch approved by the owner on 26 October 2026.
// Set to true and redeploy to restore the temporary launch gate if needed.
// This does not modify any published content, accounts, or database records.
export const preparing = false

// Only the explicitly approved review address may show the unfinished website.
// Unknown deployment hosts remain closed; neither query strings nor forwarded
// host headers are used as an override.
export function showPreparingPage(path: string, hostname: string) {
  return preparing && hostname.toLowerCase() !== 'akron-logistics-web.vercel.app' && hidePublicPage(path)
}

export function hidePublicPage(path: string) {
  const operational = ['/admin', '/api/admin', '/studio', '/_next', '/images']
  if (operational.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) return false
  return !['/robots.txt', '/sitemap.xml', '/favicon.png', '/favicon.ico', '/icon.svg', '/apple-icon'].includes(path)
}

export const preparingHtml = `<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Připravujeme | AKRON Logistics</title>
<meta name="description" content="Nový web AKRON Logistics připravujeme.">
<meta name="robots" content="noindex, nofollow"><meta name="theme-color" content="#152236">
<link rel="icon" href="/favicon.png" type="image/png">
<style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#152236;color:#f2f2f2}
body{font-family:Arial,sans-serif;min-height:100svh;display:grid;place-items:center;padding:32px 20px;border-bottom:8px solid #ff5a00}
main{text-align:center;width:100%;max-width:800px;padding:48px 0}
img{display:block;width:230px;max-width:65vw;height:auto;margin:0 auto 64px}
.line{width:48px;height:4px;background:#ff5a00;margin:0 auto 28px}
h1{font-size:clamp(40px,9vw,88px);letter-spacing:-.045em;line-height:1.1;margin:0;font-weight:700}
@media(max-width:480px){img{margin-bottom:48px}}
</style></head><body><main><img src="/images/akron-white.svg" alt="AKRON Logistics"><div class="line" aria-hidden="true"></div><h1>Připravujeme</h1></main></body></html>`
