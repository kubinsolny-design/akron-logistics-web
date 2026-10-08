# Administrace AKRON — dokončení nasazení

## Stav pracovního prostoru po úpravách 8. října

Vlastník odložil plnou databázovou migraci a přepnutí veřejného obsahu do doby předání. Hlavní projekt má aktivní přihlášení ke stávajícímu Supabase přes veřejnou konfiguraci, ale `CMS_PROVIDER` není přepnutý a serverový tajný klíč nebyl do hlavního projektu doplněn. Editor proto umožňuje koncepty; tlačítko publikování je na hlavním webu zablokované, dokud není propojení skutečně dokončené. Připravené položky Aktivita a Administrace potřebují novou migraci; pozvánky navíc serverové připojení a povolený Auth redirect. Tyto blokace nepovažovat za dokončené funkce.

Menu obsahuje Obsah stránek, Poptávky, Soubory, Analytika, Nastavení webu a pro admina také Aktivita a Administrace. Přehled zůstává rezervovaný pro pozdější obsah. Analytika nemá napojené Google Analytics ani ukázkové hodnoty.

Soubory načítají všechny složky a stránky seznamu `site-media` a navíc podklady odkazované v konceptech (včetně původních Sanity obrázků). Nejde o úplný inventář nepoužívaných assetů původního CMS nebo všech statických souborů repozitáře. Odkaz se kopíruje pro ruční vložení do editoru. Nové uploady nepřepisují existující objekty, SVG/HTML nejsou přijímány. V existujícím veřejném bucketu byl pouze rozšířen seznam MIME typů o `application/pdf`; zůstal limit 10 MB a stávající RLS i veřejnost. Základní migrace se znovu nespouštěla. Novou workspace migraci neaplikovat bez zálohy. Výslovně odsouhlasený účet kolegy byl změněn z viewer na admin; ostatní členové nebyli měněni.

Kód administrace je připraven pro hlavní web. Živá databáze není v této změně migrovaná: připojený Supabase účet odmítl přístup k projektu `htgwzjcdxbknzvobwioa`. Existující uživatelé a jejich oprávnění nebyli měněni.

## Co musí udělat vlastník projektu

1. V projektu `akron-admin-preview` ověřit existenci tabulek `cms_members`, `cms_drafts`, `cms_published`, `cms_inquiries` a bucketu `site-media`. Základní migraci `20261006130000_cms.sql` znovu nespouštět, pokud tabulky již existují.
2. Po záloze spustit celou novou transakční migraci `20261007121256_admin_workspace.sql`. Přidává historii změn, poslední aktivitu a serverové přijímání poptávek. Nemění existující role ani účty. U migrační historie používané CLI nejdříve srovnat skutečný stav projektu s již aplikovanou základní migrací; nepoužívat naslepo `db push`.
3. Ověřit současný publikovaný obsah všech šesti stránek a nastavení. Importovací skript je určen pro oddělené demo a prázdný projekt; neprovádět nový import ani automaticky nepublikovat rozpracované klientské změny.
4. Ve Vercel projektu **akron-logistics-web**, v prostředí Production, nastavit `NEXT_PUBLIC_ADMIN_PROVIDER=supabase`, `CMS_PROVIDER=supabase`, `NEXT_PUBLIC_SUPABASE_URL=https://htgwzjcdxbknzvobwioa.supabase.co` a příslušný publishable key. Serverový `SUPABASE_SECRET_KEY` nastavit jako tajnou proměnnou, nikdy `NEXT_PUBLIC_*`. Hodnoty klíčů se nevkládají do GitHubu ani chatu.
5. `ADMIN_SITE_URL` nastavit na skutečnou produkční adresu (zatím `https://akron-logistics-web.vercel.app`). Do povolených Supabase Auth redirect URL přidat přesnou adresu `/admin/accept` této domény; zachovat používanou adresu dema. Po přechodu na vlastní doménu obojí aktualizovat.
6. Pro e-mail nastavit `RESEND_API_KEY`, `INQUIRY_TO_EMAIL=info@akronlogistics.cz` a `INQUIRY_FROM_EMAIL` s ověřenou odesílací doménou. Bez konfigurace e-mailu se při aktivním Supabase poptávka uloží, ale e-mail neodejde a v administraci bude označené selhání odeslání. `sent` znamená přijetí poskytovatelem, nikoliv potvrzené doručení do schránky.
7. Vytvořit nové nasazení po změně proměnných. Nezapínat provider před migrací a kontrolou obsahu. Běžný produkční build je `next build`, nikoliv demo importovací `build:admin-preview`.

## Kontrola před předáním klientovi

- Přihlášení přes `/admin`, odhlášení, přijetí pozvánky na správné doméně.
- Admin vidí uživatele a audit; uživatel upravuje obsah a poptávky; náhled nemůže zapisovat ani číst poptávky. Ověřit na existujících účtech bez neodsouhlaseného navýšení práv.
- Upravit text a obrázek v rozpracované verzi: veřejný web se nesmí změnit před publikováním. Potom publikovat odsouhlasenou testovací změnu a ověřit veřejnou stránku; obnovit původní obsah. Zkontrolovat konflikt dvou současně otevřených editorů.
- Odeslat výslovně označenou testovací poptávku. Zkontrolovat záznam v administraci, četnost, stav e-mailu i zprávu v cílové schránce. E-mailové doručení zatím nebylo ověřeno.
- Změnit stav poptávky a interní poznámku, ověřit autora v historii; ověřit poslední aktivitu po otevření administrace.
- Desktop a mobil: výběr stránky, rozbalení sekce, nahrání obrázku, uložení/publikování, vyhledávání a stránkování záznamů.

## Provedené lokální kontroly

Produkční build a TypeScript prošly. Editor byl vizuálně zkontrolován na šířkách 1440 a 390 px s lokálními testovacími daty; bez vodorovného přesahu. Mobilní menu se po výběru zavírá.

Na izolovaném lokálním PostgreSQL byly aplikovány obě migrace a spuštěny `tests/admin-database-checks.sql`: blokování zápisu náhledu, ochrana poptávek, blokování změny rolí běžným uživatelem, audit autora/publikování/poptávky, ochrana vlastní role a limit pěti poptávek za deset minut. Testovací schéma `tests/admin-database-fixture.sql` je pouze pro prázdnou lokální databázi; **nikdy jej nespouštět v živém Supabase**. Lokální testy nenahrazují kontrolu Auth/Storage/Resend v živém projektu.
