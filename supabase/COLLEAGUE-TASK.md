# Zadání pro Codex kolegy — AKRON

Pracuj s aktuálním `main` repozitáře `kubinsolny-design/akron-logistics-web`. Nové přihlašovací rozhraní a administrace jsou již v kódu. Zachovej jejich vzhled; nevytvářej druhou administraci ani další Vercel projekt.

## Cíl

Veřejný web a administrace musí běžet ve stejném Vercel projektu `akron-logistics-web`:

- nyní `https://akron-logistics-web.vercel.app/admin`;
- po připojení ostré domény stejná doména a cesta `/admin`;
- přijetí pozvánky `/admin/accept` na téže doméně.

`akron-admin-demo.vercel.app` byl pouze oddělené vývojové nasazení, ne cílová adresa pro klienta. Žádné automatické přesměrování klienta na demo ani `/studio`.

## Kroky

1. Nejdříve načti `supabase/ADMIN-LAUNCH.md` a současný GitHub/Vercel stav. Po commitu `8d7ef9d` Vercel hlásil chybu buildu u hlavního webu i dema. Otevři skutečné build logy a oprav doloženou příčinu. Lokální `next build`, lint i TypeScript prošly; příčina chyby Vercelu nebyla z účtu druhého vývojáře dostupná. Ověř instalační a build příkaz, lockfile, podporované verze Node a pnpm a proměnné. Hlavní web nemá používat `build:admin-preview`, protože tento příkaz obsahuje import do izolovaného dema.
2. Použij již existující Supabase projekt `akron-admin-preview`, ID `htgwzjcdxbknzvobwioa`, ke kterému máš oprávnění. Nevytvářej jiný projekt. Ověř zálohu, existující schéma a migrační historii.
3. Aplikuj připravenou novou migraci `supabase/migrations/20261007121256_admin_workspace.sql`. Základní migraci z 6. října nespouštěj znovu nad existujícími tabulkami. Zachovej obsah, účty a jejich role. Nepřiděluj nové nebo vyšší přístupy bez souhlasu vlastníka. Zkontroluj RLS, oprávnění RPC a bezpečnostní advisories.
4. Ověř šest publikovaných stránek a nastavení v `cms_published`. Nepřepiš klientské úpravy výchozími texty a nepublikuj automaticky existující rozpracované změny. Zachovej fotky, loga, Poppins, aktuální texty i kontakty.
5. Nastav produkční proměnné ve Vercel projektu `akron-logistics-web` podle `ADMIN-LAUNCH.md`. Provider přepni na Supabase až po kontrole databáze a publikovaného obsahu. Tajné klíče patří pouze do serverových Secret proměnných, ne do GitHubu, chatu ani klientského bundlu.
6. Nastav Supabase Auth Site URL na hlavní doménu webu a přidej přesný redirect pro `/admin/accept`. Existující funkční adresy dema zatím zachovej, dokud nebude přechod ověřen. Po připojení ostré domény uprav Site URL, redirect a `ADMIN_SITE_URL`; administrace dál zůstává na `/admin`. Nevytvářej wildcard redirect ani veřejnou registraci.
7. Poptávky musí být uložené v `cms_inquiries` a zároveň odesílané na `info@akronlogistics.cz`. Zkontroluj serverový adapter `supabase/inquiries.ts`, atomický rate limit a Resend konfiguraci. Ověřená odesílací doména je nutná pro odesílání; bez přístupu k DNS to označ jako blokaci, nepředstírej doručení. Chyba e-mailu nesmí smazat uloženou poptávku.
8. Po nasazení ověř celý tok v živém projektu: přihlášení, odhlášení, stávající oprávnění, uložení konceptu versus publikování, nahrání obrázku, historie změn, poslední aktivita, testovací poptávka v administraci i v cílové schránce. Náhled nesmí zapisovat ani číst poptávky; uživatel nesmí měnit role ani číst audit. Ověř také nepřihlášený přístup a konflikt dvou editorů. Neprováděj neodsouhlasené role changes pro účely testu.
9. Zkontroluj desktop a mobil. Zachovej responzivní boční navigaci, rozbalovací sekce editoru, náhledy obrázků, potvrzení publikování, upozornění na neuložené změny, vyhledávání a stránkování. Administrace nesmí být indexovaná vyhledávači.

## Předání

Commitni bezpečné opravy do `main`. Vrať commit, adresu funkčního `/admin`, stav produkčního nasazení a seznam skutečně ověřených toků. Odděl hotové věci od blokací (zejména DNS/Resend). Nevracej klíče, hesla, pozvánkové tokeny ani osobní údaje z poptávek. Původní demo nemaž, dokud přechod nepotvrdí vlastník.
