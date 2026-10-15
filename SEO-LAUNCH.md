# SEO a ostré spuštění AKRON Logistics

## Finální technická kontrola — 15. října 2026

Autoritativní zdroj je aktuální main. Veřejný web stále úmyslně zůstává v režimu **Připravujeme**; tento SEO zásah jej nespouští a nemění publikovaný obsah ani koncepty v Supabase.

### Připraveno

- Šest veřejných adres: `/`, `/preprava`, `/moznosti`, `/kontakt`, `/ochrana-osobnich-udaju`, `/cookies`. Vlastní titulky, popisy, canonical URL, Open Graph a Twitter metadata. Hodnoty schválené v CMS mají přednost.
- OG náhledy `/og/home`, `/og/preprava`, `/og/moznosti`, `/og/kontakt`, `/og/ochrana-osobnich-udaju`, `/og/cookies`: PNG 1200 × 630, vlastní dodané logo, Poppins s diakritikou a stávající fotografie webu. Žádné externí obrázkové služby. Původní OG aliasy zůstávají dostupné.
- SVG/PDF nastavené jako vlastní sdílecí obrázek nenahrazují kompatibilní PNG fallback. Běžné rastrové obrázky z vlastního hostingu zůstávají upravitelné přes CMS.
- JSON-LD: Organization, WebSite a WebPage; podstránky mají BreadcrumbList, přepravní služby také Service. Kontakt používá existující CMS dokument `spoluprace`, ale canonical i strukturované adresy mají výhradně `/kontakt`.
- `/spoluprace` má permanentní 308 přesměrování na `/kontakt`. HTTP a www varianta domény byly ověřeny s 308 na `https://akronlogistics.cz/`.
- Sitemap po spuštění obsahuje standardní veřejné adresy a platné publikované vlastní stránky bez duplicit, staré kontaktní URL, konceptů, administrace či API. Nevymýšlí data poslední změny. Pro tento malý web stačí jeden `sitemap.xml`; index sitemap není potřeba.
- Robots po spuštění dovolí veřejný web, ne administraci/API/Studio. Privátní stránky mají navíc noindex metadata a HTTP hlavičky. Oprávnění k administraci se tím nemění.
- Vercel review/demo adresy mají samostatné `X-Robots-Tag: noindex, nofollow` i po pozdějším spuštění hlavní domény.
- Generování náhledů vlastních stránek čte jen publikované dokumenty, nikdy přihlášený koncept; nepublikovaná stránka vrací 404.
- Jazyk stránky `cs`, favicon A, Apple touch ikona, jeden H1 na každé standardní stránce, interní odkazy a skutečná 404 pro neexistující stránku.

## Kontrola před spuštěním

Na schválené kontrolní adrese, která zobrazuje celý obsah:

```bash
SEO_CANONICAL_ORIGIN=https://akronlogistics.cz node scripts/check-seo.mjs https://akron-logistics-web.vercel.app --prelaunch
```

Kontroluje všech šest stránek i bez veřejné sitemapy, metadata pro sociálního robota v serverové odpovědi, canonical, PNG a rozměry, H1, JSON-LD, interní odkazy, ikony, privátní noindex, přesměrování a 404. Na hlavní doméně musí stále potvrdit Připravujeme. Produkční OG adresy jsou do vypnutí brány stejně jako ostatní veřejný obsah záměrně zakryté; předstartovní test obrázků běží na kontrolním hostu.

Lokální regresní testy také ověřují budoucí stav po vypnutí brány: sitemap, povolenou indexaci pouze v odpovídajícím prostředí a zachování zákazu pro Preview. Živý produkční stav po spuštění se musí znovu ověřit; tyto testy jej nepředstírají.

## Při odsouhlaseném ostrém spuštění

1. Teprve po souhlasu vlastníka nastavit `preparing = false` v `app/preparing.ts`.
2. V Production zachovat `NEXT_PUBLIC_SITE_URL=https://akronlogistics.cz` a povolit `ALLOW_INDEXING=true` (výslovné `false` by indexaci dál blokovalo). Preview neodblokovávat. Provést nové nasazení.
3. Testy, které záměrně kontrolují uzavřenou bránu v `tests/preparing.test.mjs`, při spuštění upravit na nový schválený stav; nemažte jejich bezpečnostní kontroly oprávnění.
4. Po nasazení spustit:

```bash
node scripts/check-seo.mjs https://akronlogistics.cz
```

5. Ručně potvrdit veřejný obsah na doméně, `robots.txt` s `Allow: /`, neprázdnou sitemapu s canonical adresami a nepřítomnost noindex na veřejných stránkách. Administrace a Vercel aliasy musejí zůstat noindex.
6. Teprve potom ověřit doménu v Google Search Console a odeslat `https://akronlogistics.cz/sitemap.xml`. Ověřovací token není předem vymyšlený; doplní jej vlastník účtu.
7. GA4 připojit samostatně. Současné texty a cookie rozhraní říkají, že analytika neběží; při zapojení GA4 se musejí současně upravit deklarace a odpovídající řízení souhlasu. Nespouštět měření v rozporu s aktuální volbou návštěvníka.

Technická kontrola nezaručuje okamžitou indexaci ani konkrétní pozice ve vyhledávání. Zpracování a případné chyby po spuštění sleduje vlastník v Search Console. Tento zásah neprovádí připojení GA4, změny DNS, přístupů ani zrušení Sanity.
