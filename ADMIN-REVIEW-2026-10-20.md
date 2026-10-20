# Kontrola administrace a zabezpečení — 20. října 2026

## Provedené úpravy

- Pole formulářů jsou zarovnaná nahoru. Delší nápověda už neposouvá sousední vstup a nezvětšuje jeho výšku.
- Pracovní prostor začíná nahoře; kratší obrazovky administrace se necentrují s velkou mezerou pod hlavičkou.
- Společná nastavení mají pořadí: firemní údaje, loga a vzhled, navigace a patička, formulář, cookies. Hodnoty ani publikovaný obsah se tím nepřepisují.
- Úvod zobrazuje správnou veřejnou adresu `/`, nikoli `/home`. Technické volby znovu neopakují editor téhož obrázku.
- Názvy voleb vozidel, vzhledu a písma jsou srozumitelné, uložené hodnoty zůstávají stejné.
- Mobilní filtry a akce mají vlastní řádky, vstupy nezpůsobují automatické přiblížení na iOS a ovládací prvky mají větší dotykovou plochu.
- Mobilní menu jde zavřít klávesou Escape nebo kliknutím mimo něj. Escape vrací fokus na tlačítko menu.
- Soubory lépe ošetřují nedostupné úložiště/koš a výpadek spojení. Po zmenšení seznamu nezůstává uživatel na neexistující stránce výsledků.
- Prázdné výsledky a počty v přehledech odpovídají skutečně načteným záznamům.
- Administrace odesílá `Referrer-Policy: no-referrer`; zachovává zákaz indexace a soukromou cache.

## Ověření

- 177 automatických testů, ESLint a produkční build: úspěch.
- Chrome, skutečně přihlášená administrace: všech osm pracovních částí při šířce 1440 px; mobilní rozložení a filtry při 390 px.
- Všech 21 sekcí šesti stránek zkontrolováno při 390 px. Všech šest editorů včetně rozbaleného SEO a právních dokumentů také při 320 px. Kontrolované části neměly vodorovné přetékání.
- Desktopový řádek „Adresa stránky / Titulek pro vyhledávače“ má po opravě přesně stejnou souřadnici začátku vstupů.
- Živý read-only bezpečnostní test prošel na `https://akronlogistics.cz` i `https://akron-logistics-web.vercel.app`.
- Anonymní čtení osmi soukromých tabulek nevrátilo soukromé záznamy; seznam členů a soukromý koš nejsou anonymně přístupné.
- Na kontrolním webu náhled odmítá cizí Origin (403), nepřihlášeného uživatele (401) a staré GET odkazy (410). Na hlavní doméně jej navíc uzavírá režim Připravujeme.
- Kontrola veřejného HTML a 14/15 přímo odkazovaných JS souborů nenašla kontrolované vzory soukromých Supabase/Resend/GitHub klíčů, privátních klíčů ani JWT s rolí `service_role`.
- Gitleaks 8.30.1 prošel 78 tehdejších commitů ze všech místních refů a následně pracovní diff; bez nálezu. Jde o kontrolu vzorů, nikoliv důkaz, že žádné tajemství nikdy neuniklo jinou cestou.
- Všechny migrace byly aplikovány do izolovaného lokálního PostgreSQL 17. Následně prošly testy anonymního/nečlenského přístupu, rolí, eskalace oprávnění, odebraných účtů, konfliktů revizí, auditních zápisů, koše, ochrany používaných obrázků a soukromého doručovacího nastavení.
- Skutečné databázové testy ověřily také limity poptávek a server-only obnovy hesla, minutový odstup a hodinovou kvótu. Testy neposílaly e-maily; izolovaná databáze byla po testu zastavena.
- Živá kontrola neposílala pozvánky ani poptávky a neměnila účty, oprávnění, koncepty nebo publikovaný obsah. Režim Připravujeme zůstává zapnutý.

## Známé upozornění v nástrojích pro vývoj

`pnpm audit --prod` k datu kontroly nehlásí známou zranitelnost. Úplný audit hlásí **GHSA-vfj7-8cjw-p6xm / CVE-2026-93687** v `braces@3.0.3`.

Podle [oficiálního advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) zatím není vydaná opravená verze. Jde o vyčerpání zásobníku hluboce vnořeným glob vzorem. V tomto projektu se balík nachází pouze v řetězci vývojového `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch`; `pnpm why braces` tento původ potvrdil a produkční serverové trace jej neobsahují. Nebyla nalezena cesta z formuláře nebo administrace, která by mu předávala návštěvnický vstup.

Upozornění není skryté v auditních výjimkách. Do vydání upstream opravy nespouštějte lint s nedůvěryhodnými glob argumenty a nepředávejte sestavovacím úlohám z neprověřených příspěvků produkční tajemství. Po vydání kompatibilní opravy aktualizovat lockfile a opakovat úplný audit. Toto upozornění se nesmí prezentovat jako „všechny závislosti bez nálezu“.

## Co ještě musí ověřit kolega s oprávněním vlastníka

Supabase MCP při pokusu o živý `get_advisors(type: security)` vrátil odmítnutí oprávnění. Proto nelze tímto reportem potvrdit kompletní aktuální konfiguraci živé databáze, neveřejných schémat ani nastavení Auth. Lokální test migrací a živý anonymní API test tuto kontrolu nenahrazují.

Kolega má provést:

1. Supabase Security Advisors, porovnání skutečně aplikovaných migrací s repozitářem a kontrolu grantů/RLS na všech vystavených tabulkách, views a RPC. Zvlášť prověřit případné objekty vytvořené mimo tyto migrace.
2. Nastavení Auth: vypnutá nechtěná veřejná registrace, pouze schválené přesměrovací adresy, přiměřená platnost relací a odkazů, limity přihlášení a dostupné ochrany hesel. MFA pro administrátory je vhodné následné posílení, nikoliv funkce, kterou tato úprava zapnula.
3. Ve Vercelu rozsah serverových tajemství a přístup k deploymentům; soukromé klíče nesmějí být pod `NEXT_PUBLIC_*`, v logu nebo veřejných artefaktech. Ověřit dostupné logování/chybový monitoring a zálohy s postupem obnovy. K Vercel účtu ani jeho runtime logům tato kontrola neměla přístup.

Jde o cílenou aplikační kontrolu a regresní testy, ne o nezávislý plný penetrační test nebo záruku absolutní bezpečnosti.

## Opakování kontrol

```sh
pnpm test
pnpm lint
pnpm build
pnpm audit --prod
pnpm audit
gitleaks git --redact --no-banner --log-opts=--all .
node scripts/check-security.mjs https://akronlogistics.cz
node scripts/check-security.mjs https://akron-logistics-web.vercel.app
```

SQL testy z `tests/*database*.sql` spouštět pouze v jednorázové lokální databázi s fixture, nikdy na produkci. Skript `check-security.mjs` nepoužívá přihlášenou relaci ani serverový secret a neprovádí obchodní zápisy.
