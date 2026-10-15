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
- `RESEND_API_KEY` a ověřeného odesílatele `AKRON Logistics <web@akronlogistics.cz>`. Veřejný kontakt i příjemce poptávek se mění ihned v `/admin` → Nastavení webu → Kontaktní e-mail a doručování. Výchozí je `adam.bartusek@akronlogistics.cz`. Staré `INQUIRY_TO_EMAIL` a CMS `inquiryEmail` se záměrně nepoužívají. Vyžaduje migraci `editable_inquiry_delivery` a funkční serverový Supabase klíč.

Bez přístupu k DNS nelze ověřit odesílací doménu. Dokud není odesílání nastavené, formulář nehlásí přijetí poptávky a nabídne přímý e-mail a telefon. Test serverové akce bez skutečného odesílání: `node scripts/check-inquiry.mjs`.

Telefon, e-mail a údaje firmy jsou centrálně v `app/site.ts`.

## Správa obsahu

Administrace je na `/admin` stejného webu. Aktuální veřejný obsah již čte Supabase (aktivační marker `cms_site_state`); původní Sanity zůstává zachované jako historický zdroj. Texty a obrázky se upravují v Obsahu stránek, společné prvky v Nastavení webu. Uložit koncept nezmění veřejný web, Publikovat na web ano. Kontaktní e-mail a doručování mají samostatné okamžité uložení.

Admin spravuje role a pozvánky, odebrané přístupy a koš poptávek/souborů. Uživatel upravuje obsah a vyřizuje poptávky; náhled nezapisuje ani nečte poptávky. Mazání je obnovitelné, bez trvalého purgování. Použité nahrané soubory nelze přesunout do koše; původní statické/CDN obrázky se nahrazují v editoru. Stav nasazení a bezpečnostní omezení: `supabase/ADMIN-LAUNCH.md`.

## SEO a spuštění na doméně

Každá stránka má vlastní titulek, popis, canonical URL a Open Graph / Twitter metadata. Web obsahuje strukturovaná data Organization a WebSite, SVG a PNG faviconu, Apple touch ikonu, `robots.txt` a `sitemap.xml`. Kontrolní skript: `node scripts/check-seo.mjs https://akron-logistics-web.vercel.app`.

Při připojení finální domény nastavte `NEXT_PUBLIC_SITE_URL` na její HTTPS adresu a znovu nasaďte web. Přesměrování z alternativních domén nastavte ve Vercelu na hlavní doménu, aby se netvořily duplicitní verze. V Google Search Console ověřte doménu a odešlete `/sitemap.xml`; k ověření je potřeba přístup majitele k účtu nebo DNS. Technická připravenost nezaručuje indexaci ani pozice ve vyhledávání.
