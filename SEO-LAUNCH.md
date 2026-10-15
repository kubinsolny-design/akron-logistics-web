# SEO a ostré spuštění AKRON Logistics

## Implementace 8. října 2026

- Šest standardních veřejných stránek má unikátní výchozí titulek, popis, canonical, Open Graph a Twitter metadata. Publikované SEO hodnoty a vlastní sdílecí obrázky z CMS mají nadále přednost; databáze nebyla přepisována.
- Sdílecí PNG 1200 × 630 pro každou stránku: `/og/home`, `/og/preprava`, `/og/moznosti`, `/og/spoluprace`, `/og/ochrana-osobnich-udaju`, `/og/cookies`. Nové publikované vlastní stránky mají vlastní `/og/<slug>` a popis odvozený z obsahu, pokud autor SEO pole nevyplní. Původní `/opengraph-image` zůstává dostupné.
- JSON-LD: Organization a WebSite, každá veřejná stránka WebPage, podstránky BreadcrumbList a přepravní služby Service. Bez smyšlených recenzí, cen a tvrzení o vlastním vozovém parku.
- Sitemap používá publikované slugy, odstraňuje duplicity a rezervované neveřejné adresy. Nevytváří nepravdivá data poslední aktualizace.
- `/admin`, `/studio` a `/api` mají X-Robots-Tag noindex/nofollow. Administrace má také noindex metadata. Nejde o náhradu přístupových oprávnění. Náhled rozpracovaného obsahu má noindex; prostředí Preview zachovává zákaz indexace.
- Byla odstraněna požadovaná informační hláška z bočního menu. Role a oprávnění se nemění.

## Opakovatelná kontrola

Spustit `node scripts/check-seo.mjs <adresa-webu>`. Pokud se kontroluje Vercel adresa s canonical na vlastní doméně, nastavit `SEO_CANONICAL_ORIGIN=https://akronlogistics.cz`. Pro lokální/preview kontrolu nastavit také `SEO_EXPECT_INDEX=false` a skutečný canonical origin.

Kontrola prochází všechny stránky ze sitemapy, titulky a popisy, sdílecí obrázky (včetně rozměrů generovaných PNG), H1, jazyk, strukturovaná data, interní odkazy, robots, ikony, soukromé adresy a HTTP 404. Nenahrazuje ověření Search Console, výkonu mobilního zařízení ani skutečné indexace Google.

## Nutné před ostrým předáním

1. Zprovoznit doménu a HTTPS na Vercelu. Při této kontrole měla `akronlogistics.cz` chybu `ERR_CERT_COMMON_NAME_INVALID`; bezpečnostní upozornění nebylo obcházeno. Vybrat hlavní variantu domény a přesměrovat ostatní varianty. Poté ověřit canonical, sitemap a robots přímo na ostré doméně. DNS, certifikát a nastavení indexace nebyly v této úpravě změněny.
2. Na neblokovaném počítači pořídit a ověřit databázovou zálohu. Následně ověřit skutečné schéma/historii a aplikovat pouze novou workspace migraci. Základní migraci znovu nespouštět. Zachovat publikovaný obsah, koncepty, uživatele a role.
3. Po kontrole obsahu bezpečně dokončit `CMS_PROVIDER=supabase` a serverový klíč v hlavním Vercel projektu. Tajný klíč nesmí být veřejný ani v repozitáři. Zatím není veřejný web přepnutý na Supabase a publikování z administrace je zablokované. Pokyny jsou v `supabase/ADMIN-LAUNCH.md`.
4. Nastavit Supabase Auth Site URL a přesný redirect `/admin/accept` na konečné doméně. Ověřit přihlášení, odhlášení a přijetí pozvánky bez navýšení cizích oprávnění.
5. Ověřit platný serverový Supabase klíč a doručení přes Resend. Aktuální příjemce je `adam.bartusek@akronlogistics.cz`, upravitelný administrátorem v Nastavení webu → Kontaktní e-mail a doručování. Odesílatel `web@akronlogistics.cz`. Ověřit uložení poptávky před odesláním e-mailu, chování při selhání odeslání a skutečné doručení. Pouhé přijetí zprávy Resendem není důkaz doručení. Aktuální provozní blokace viz `supabase/ADMIN-LAUNCH.md`.
6. Ověřit na živém prostředí koncept/publikování, nahrání souboru, audit, poslední aktivitu, poptávky a omezení rolí admin/uživatel/náhled. Projít desktop i mobil. Vlastník schválí firemní kontakty, obsah, práva k obrázkům a finální právní texty.
7. Po funkční ostré doméně ověřit vlastnictví v Google Search Console a odeslat sitemapu. Google Analytics případně zapojit spolu s odpovídajícím souhlasem; zatím se v administraci nezobrazují fiktivní statistiky. Před veřejnou indexací musí být ostré spuštění odsouhlasené.
8. Starý demo projekt odstranit až po ověřeném přechodu a výslovném potvrzení odstranění. V této úpravě nebyl smazán.
