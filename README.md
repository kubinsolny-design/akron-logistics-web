# AKRON Logistics

Firemní web pro vnitrostátní a mezinárodní silniční přepravu a spedici. Postavený v Next.js 16 a TypeScriptu.

## Spuštění

```bash
pnpm install
pnpm dev
```

## Produkční nastavení

Proměnné jsou popsané v `.env.example`. Pro ostré nasazení je nutné nastavit:

- `NEXT_PUBLIC_SITE_URL` na finální doménu;
- `ALLOW_INDEXING=true` mimo Vercel; Vercel produkční nasazení se indexuje automaticky, pokud není nastaveno `ALLOW_INDEXING=false`. Preview se neindexuje ani při `ALLOW_INDEXING=true`;
- `RESEND_API_KEY`, `INQUIRY_TO_EMAIL` a ověřenou adresu `INQUIRY_FROM_EMAIL` pro doručování poptávek.

Telefon, e-mail a údaje firmy jsou centrálně v `app/site.ts`.

## SEO a spuštění na doméně

Každá stránka má vlastní titulek, popis, canonical URL a Open Graph / Twitter metadata. Web obsahuje strukturovaná data Organization a WebSite, SVG a PNG faviconu, Apple touch ikonu, `robots.txt` a `sitemap.xml`. Kontrolní skript: `node scripts/check-seo.mjs https://akron-logistics-web.vercel.app`.

Při připojení finální domény nastavte `NEXT_PUBLIC_SITE_URL` na její HTTPS adresu a znovu nasaďte web. Přesměrování z alternativních domén nastavte ve Vercelu na hlavní doménu, aby se netvořily duplicitní verze. V Google Search Console ověřte doménu a odešlete `/sitemap.xml`; k ověření je potřeba přístup majitele k účtu nebo DNS. Technická připravenost nezaručuje indexaci ani pozice ve vyhledávání.
