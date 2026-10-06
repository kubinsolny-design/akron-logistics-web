# Administrace AKRON Logistics

## Implementace (6. 10. 2026)

- Sanity projekt `l802e097`, veřejný obsah `production`.
- Editor `/studio/obsah`: stránky, řaditelné/skryvatelné sekce, texty, obrázky, služby, vozidla, FAQ, kontakty, menu, barvy, Poppins/Orbitron a SEO.
- Editor `/studio/poptavky`: privátní poptávky, stavy Nová / Řeší se / Hotová, interní poznámky, stav e-mailu.
- Studio vyžaduje přihlášení a členství v projektu. Klíče zůstávají na serveru.
- Náhled konceptů ověřuje Sanity preview secret. Formulář v náhledu neodesílá.
- Formulář před zápisem ověřuje soukromé nastavení datasetu inquiries. Při chybě ukládání nevrací úspěch. Resend upozornění následuje po uložení; jeho selhání je viditelné v editoru.
- Základní omezení: pět poptávek na kombinaci IP/e-mail za deset minut. Pro vyšší provoz doplnit atomické infrastrukturní omezení.
- Původní obsah zůstává jako fallback. Publikovaný obsah nemá serverovou cache.

## První spuštění

1. Povolit přesné CORS adresy s credentials pro web a testovací nasazení; nepoužívat wildcard. Localhost:3333 je již povolený.
2. Přihlásit vlastníka do Studia. GitHub přihlášení je propojené.
3. „První spuštění a návod“ → „Připravit současný obsah webu“ vytvoří privátní inquiries a vloží aktuální obsah pomocí createIfNotExists; existující dokumenty nepřepisuje.
4. Ověřit koncept, náhled, publikování, obrázky a privátní přístup. Před tím nepřepínat produkci na nový formulář.
5. Zákazníka přidat přes Sanity Members jeho vlastním účtem s nejnižším dostupným oprávněním. Nesdílet hesla ani klíče.

## Vercel

Integrace dodala NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_READ_TOKEN a SANITY_API_WRITE_TOKEN do Production a Preview. Ověřit přístup integračního write tokenu k novému privátnímu datasetu.

Resend používá RESEND_API_KEY a INQUIRY_FROM_EMAIL. Příjemce lze změnit v editoru. Ověření domény a reálné doručení jsou samostatný krok. Žádný skutečný testovací e-mail nebyl poslán.

## Ověření

TypeScript prošel. ESLint nemá chyby, jen dvě původní upozornění u generovaných obrázků. Lokální přihlášení a české menu Studia i veřejná úvodní stránka byly ověřeny v prohlížeči. Naplnění CMS, publikace, privátní poptávky a produkční nasazení dosud nejsou ověřené.

## Návod pro zákazníka

Otevřete /studio a přihlaste se vlastním účtem. V „Firma, kontakty a vzhled“ měníte společné údaje; v „Stránky webu“ konkrétní stránku. Sekce přetáhnete, přidáte nebo skryjete. Změny se ukládají jako koncept. Zkontrolujte „Náhled webu“ a poté použijte „Publikovat“. Historie je dostupná v editoru dokumentu.

Přepnutím pracovního prostoru na „AKRON — Poptávky“ otevřete přijaté poptávky. Údaje jsou pouze pro čtení; měníte stav a interní poznámky. Dodržujte firemní lhůty uchovávání osobních údajů. Údaje zákazníků nepatří do veřejných sekcí webu.
