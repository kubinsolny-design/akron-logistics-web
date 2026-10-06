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

### Pozvánky a role

V záložce „Uživatelé a přístupy“ admin načte členy a čekající pozvánky, připraví pozvánku podle e-mailu a mění role. Změny mají samostatný potvrzovací krok. Volba Uživatel s úpravami odpovídá nativní roli Editor; Admin roli Administrator. Viewer je pouze pro čtení. API používá přihlášenou relaci daného člověka, nikoli privilegovaný serverový token. Sanity vynucuje oprávnění i mimo editor. Vlastní roli není možné v tomto panelu měnit a posledního admina chrání také Sanity API. Skutečné odeslání pozvánky a změna cizí role nebyly během implementace provedeny.

**Oprava informace o Free:** Role Editor a privátní datasety vyžadují Growth nebo aktivní Growth Trial. Free nabízí jen Administrator/Viewer a veřejné datasety. Poptávky s osobními údaji se nikdy nesmějí převést do veřejného datasetu. Po skončení trialu je nutné zvolit odpovídající tarif nebo migrovat privátní úložiště a přístupy; placený plán nebyl automaticky zapnut.

Lokální testovací editor je na http://localhost:3333/studio/obsah a nevyžaduje ověřenou Resend doménu. Pozvánky odesílá Sanity nezávisle na Resendu. Dne 6. 10. 2026 byl se souhlasem vlastníka importován obsah: šest publikovaných stránek, nastavení firmy a pět obrázků (dvě loga, dvě fotografie, mapa). Testovat lze i vytvořením konceptu bez publikace. Publikace do CMS neaktualizuje starou produkční verzi, dokud se nenasadí nová CMS aplikace.

1. Povolit přesné CORS adresy s credentials pro web a testovací nasazení; nepoužívat wildcard. Localhost:3333 je již povolený.
2. Přihlásit vlastníka do Studia. GitHub přihlášení je propojené.
3. Import obsahu je dokončen. Před spuštěním formuláře samostatně vytvořit dataset inquiries s nastavením Private a ověřit oprávnění serverového write tokenu. Import veřejného obsahu dataset poptávek nevytváří.
4. Ověřit koncept, náhled, publikování, obrázky a privátní přístup. Před tím nepřepínat produkci na nový formulář.
5. Zákazníka přidat přes Sanity Members jeho vlastním účtem s nejnižším dostupným oprávněním. Nesdílet hesla ani klíče.

## Vercel

Integrace dodala NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_READ_TOKEN a SANITY_API_WRITE_TOKEN do Production a Preview. Ověřit přístup integračního write tokenu k novému privátnímu datasetu.

Resend používá RESEND_API_KEY a INQUIRY_FROM_EMAIL. Příjemce lze změnit v editoru. Ověření domény a reálné doručení jsou samostatný krok. Žádný skutečný testovací e-mail nebyl poslán.

## Ověření

TypeScript prošel. ESLint nemá chyby, jen dvě původní upozornění u generovaných obrázků. Lokální přihlášení a české menu Studia i veřejná úvodní stránka byly ověřeny v prohlížeči. Import potvrdil úspěch; editor zobrazuje šest publikovaných stránek a nahraný obrázek v první sekci. Veřejný místní náhled načítá texty a všech pět obrázků ze Sanity (ověřeno DOM zdroji obrázků a jejich úspěšným načtením), bez chyb v konzoli. Privátní poptávky, náhled konceptů a reálné doručení e-mailu ještě vyžadují ověření. Poslední preview e690dc2 na Vercelu je Error před sestavením: selhalo provisionování integrace resend-email-charcoal-garden. Ostrá verze zůstává na původním main 35ec238.

## Návod pro zákazníka

Otevřete /studio a přihlaste se vlastním účtem. V „Firma, kontakty a vzhled“ měníte společné údaje; v „Stránky webu“ konkrétní stránku. Sekce přetáhnete, přidáte nebo skryjete. Změny se ukládají jako koncept. Zkontrolujte „Náhled webu“ a poté použijte „Publikovat“. Historie je dostupná v editoru dokumentu.

Přepnutím pracovního prostoru na „AKRON — Poptávky“ otevřete přijaté poptávky. Údaje jsou pouze pro čtení; měníte stav a interní poznámky. Dodržujte firemní lhůty uchovávání osobních údajů. Údaje zákazníků nepatří do veřejných sekcí webu.
# Import obrázků a současného obsahu

## Dočasná ukázka pro kolegu

Projekt Vercel `akron-admin-demo` byl vytvořen odděleně od ostrého webu, bez Resendu a bez serverových klíčů. Sleduje větev `codex/akron-administrace`. Na adresu jirka.fusek@email.cz byla na výslovný souhlas vlastníka odeslána Sanity pozvánka s rolí Viewer; přijetí pozvánky zatím nebylo ověřeno. Přístup je určen k pozdějšímu odebrání vlastníkem, nemá automatickou expiraci. Před předáním odkazu zbývá povolit přesný origin pro přihlášení a ověřit nasazení. Tento projekt není určen k přijímání poptávek.

Nástroj „První spuštění a návod“ importuje aktuální stránky a nastavení a nahraje obě loga, fotografie a mapu do knihovny Sanity. Sekce používají skutečné odkazy na CMS obrázky, které lze následně v editoru vyměnit. Import vytváří jen chybějící dokumenty; u existujících doplňuje pouze chybějící obrázky a používá kontrolu revize, aby nepřepsal souběžné změny. Poptávkový dataset ani tarif při importu nemění. Samotné spuštění importu vyžaduje přihlášený účet s oprávněním zápisu.

