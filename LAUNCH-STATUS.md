# AKRON — stav přípravy 15. 10. 2026

## Hotové změny v této přípravě

- Veřejný web zůstává v režimu Připravujeme, bez formuláře a s noindex. `/admin` a `/admin/accept` jsou dostupné. Publikovaný obsah, koncepty, role a databáze nebyly přepisovány ani migrovány.
- Supabase Auth má Site URL `https://akronlogistics.cz`. Přesný allowlist obsahuje `/admin/accept` na ostré doméně, hlavní Vercel adrese a dosavadním demu. Bez wildcard; žádné navýšení rolí. Změna byla výslovně odsouhlasená a ověřená po obnovení nastavení.
- Production ve Vercelu: `ADMIN_SITE_URL` a `NEXT_PUBLIC_SITE_URL` jsou `https://akronlogistics.cz`; `INQUIRY_TO_EMAIL` je `info@akronlogistics.cz`; `INQUIRY_FROM_EMAIL` je `AKRON Logistics <web@akronlogistics.cz>`. Proměnné nabývají účinku novým nasazením. Odesílání není tímto samo o sobě zprovozněné.
- Výslovný serverový příjemce má v kódu přednost před starou hodnotou v CMS. Osobní účet použitý k přihlášení do Resendu není příjemcem poptávek.
- Pozvánky ošetřují chybějící serverové připojení, chybnou adresu i výpadek služby bez pádu rozhraní. Adresa pozvánek pochází jen z důvěryhodné serverové konfigurace, nikoliv z Host hlavičky.
- `npm test` zahrnuje reálnou serverovou akci s izolovanou databází/transportem. Ověřuje pořadí uložení před e-mailem, selhání e-mailu bez ztráty uložené poptávky, idempotenci, HTML escaping, ochranu náhledu/Připravujeme, validaci a oprávnění pozvánek. Neodesílá skutečný e-mail ani nemění živé účty.
- `npm run check:launch-config` kontroluje pouze konfiguraci a vypisuje PASS/PENDING bez hodnot klíčů. Je nutné spustit jej v bezpečně nakonfigurovaném prostředí; samostatný Node skript automaticky nenačítá `.env.local`. Nenahrazuje ověření zálohy, migrace, DNS, RLS a doručení.

## Co je stále technicky zablokované na naší straně

1. Není ověřená databázová záloha ani připravené bezpečné lokální připojení. Na firemním počítači neobcházet omezení a nespouštět workspace migraci bez zálohy. Je potřeba jiné schválené prostředí nebo bezpečně připravený export. Zákazník nemusí být kvůli této naší infrastruktuře úkolovaný.
2. Po záloze ověřit skutečné schéma a historii, spustit pouze novou migraci `20261007121256_admin_workspace.sql`, ověřit RLS/RPC a publikovaný obsah. Základní migraci ani demo import znovu nespouštět.
3. Bezpečně doplnit serverový Supabase klíč a až po kontrole přepnout `CMS_PROVIDER=supabase`. Nyní zůstává Sanity; publikování na hlavním webu je blokované. Historie, poslední aktivita a správa členů potřebují novou migraci.
4. Po DNS ověření doplnit serverový Resend klíč. Není v Production přítomen; nevkládat jej do chatu, veřejných proměnných nebo repozitáře. Stávající účet ani další projekt není nutné zakládat.
5. Potom dokončit živé testy přihlášení/odhlášení, pozvánky, rolí, konceptu/publikování, uploadu, historie a poptávky. Živé doručení ani zápisy do Supabase nebyly nahrazené lokálními testy. Staré demo nemažeme, dokud přechod není ověřený a jeho odstranění potvrzené.

## Co potřebujeme od zákazníka

1. Doplnit tři DNS záznamy z předaného `AKRON-Resend-DNS.txt` u Webglobe. Záznamy Resendu jsou jen pro DKIM a subdoménu `send`; hlavní MX, Microsoft 365 ani nameservery neměnit. Při kontrole 15. 10. potřebné záznamy stále chyběly.
2. Potvrdit, že schránka `info@akronlogistics.cz` existuje, kdo ji obsluhuje a že na ni chtějí přijímat poptávky. Po technickém zprovoznění potvrdit přijetí výslovně označené testovací zprávy. Heslo k poště není potřeba předávat.
3. Schválit finální kontakty, texty, přepravní možnosti/směry, obrázky včetně práv k použití a právní informace. Právní texty zde nebyly automaticky přepisované.
4. Dodat seznam skutečných budoucích uživatelů a požadovaných rolí. Účty nezakládat ani role nezvyšovat bez výslovného zadání.
5. Rozhodnout, zda chtějí Google Analytics. Bez něj lze web spustit. Pro Search Console je třeba zajistit vlastnictví/správný přístup a po spuštění odeslat sitemapu; žádný účet ani vlastnictví zde nebyly automaticky vytvořené.
6. Po úspěšných testech dát výslovný souhlas se zveřejněním. Do té doby ponechat Připravujeme; přepnutí nesmí automaticky publikovat rozpracované změny.
