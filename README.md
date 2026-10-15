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

Administrace je na `/admin` stejného webu. Veřejný obsah i koncepty čte pouze Supabase; při výpadku neexistuje záložní připojení k jinému CMS. Texty a obrázky se upravují v Obsahu stránek, společné prvky v Nastavení webu. Uložit koncept nezmění veřejný web, Publikovat na web ano. Kontaktní e-mail a doručování mají samostatné okamžité uložení.

Admin spravuje role a pozvánky, odebrané přístupy a koš poptávek/souborů. Uživatel upravuje obsah a vyřizuje poptávky; náhled nezapisuje ani nečte poptávky. Mazání je obnovitelné, bez trvalého purgování. Použité nahrané soubory nelze přesunout do koše; statické obrázky se nahrazují v editoru. Stav nasazení a bezpečnostní omezení: `supabase/ADMIN-LAUNCH.md`.

### Odpojení původního Sanity (15. 10. 2026)

- Obsah, přihlášení, poptávky a nově nahraná média: vlastní projekt Supabase. E-maily: Resend. Pět původních obrázků: verzované vlastní soubory `public/images/` na Vercelu; jejich vizuální shoda byla ověřena. SVG neotevírají další síťové zdroje.
- Migrace `20261015135819_detach_legacy_cms_media.sql` nejprve zálohuje koncepty i publikované dokumenty do admin-only `cms_content_backups`, pak přepíše pouze média. Nezveřejňuje koncepty, nemění texty ani režim Připravujeme. Neznámý starý obrázek znamená rollback, ne tiché zahození. Staré otevřené editory musejí po převodu obnovit stránku.
- Sanity SDK, konfigurace, import při buildu, ukládání poptávek a Visual Editing byly odstraněny. `/studio` jen přesměruje na `/admin`. GET odkaz původního CMS již nezapíná náhled; nový POST ověřuje původ požadavku a aktuální přihlášené členství.
- Portable Text je pouze lokální formát stávajících právních textů a jeho React renderer, nikoli externí CMS připojení. Původní identifikátory v offline manifestu a soukromých historických zálohách nejsou síťové vazby.

Před definitivním zrušením služby musí kolega s přístupem:

1. V původním Sanity projektu `l802e097` vypsat **všechny datasety**, exportovat případné neveřejné koncepty a privátní poptávky (zejména dataset `inquiries`) včetně souborů. Veřejný audit nalezl 6 stránek, nastavení a 5 obrázků; neprokazuje nepřítomnost soukromých dat. Tuto kontrolu převzal kolega.
2. Ve všech relevantních Vercel projektech a prostředích odstranit integraci Sanity, její webhooky a proměnné `NEXT_PUBLIC_SANITY_*`, `SANITY_*`; zrušit zastaralé `CMS_PROVIDER` (nebo ponechat `supabase`) a ověřit `INQUIRY_PROVIDER=supabase`. Klíče nevypisovat do logů. Znovu nasadit z aktuálního `main`, včetně starého demo projektu, pokud zůstává dostupný.
3. Ověřit aktuální publikovaný web i `/admin` a obrázky bez požadavků na `*.sanity.io`; až poté zneplatnit staré Sanity tokeny a zrušit projekt/službu. Nepouštět znovu základní import ani staré migrace. Starší migrační historie má známé rozdíly timestampů — žádný slepý `db push`.

## SEO a spuštění na doméně

Každá stránka má vlastní titulek, popis, canonical URL a Open Graph / Twitter metadata. Web obsahuje strukturovaná data Organization a WebSite, SVG a PNG faviconu, Apple touch ikonu, `robots.txt` a `sitemap.xml`. Kontrolní skript: `node scripts/check-seo.mjs https://akron-logistics-web.vercel.app`.

Při připojení finální domény nastavte `NEXT_PUBLIC_SITE_URL` na její HTTPS adresu a znovu nasaďte web. Přesměrování z alternativních domén nastavte ve Vercelu na hlavní doménu, aby se netvořily duplicitní verze. V Google Search Console ověřte doménu a odešlete `/sitemap.xml`; k ověření je potřeba přístup majitele k účtu nebo DNS. Technická připravenost nezaručuje indexaci ani pozice ve vyhledávání.
