# Zadání pro kolegův Codex: zálohy a monitoring AKRON

Pracuj s aktuálním `main` repozitáře `kubinsolny-design/akron-logistics-web`, produkčním Vercel projektem `akron-logistics-web`, doménou `https://akronlogistics.cz` a Supabase projektem `htgwzjcdxbknzvobwioa`. Nejprve ověř identitu projektů a jejich skutečné nastavení. Staré admin demo ani Sanity znovu nezapojuj. Web je veřejně spuštěný; neměň režim na „Připravujeme“.

## 1. Zálohy

- Zjisti aktuální tarif, automatické zálohy, retenci a dostupnost obnovy/PITR. Nezaměňuj existující možnost v nabídce za skutečně zapnutou ochranu. Placené změny nejprve předlož vlastníkovi.
- Zajisti automatickou denní zálohu databáze do soukromého šifrovaného úložiště mimo tento produkční projekt. Zahrň aplikační obsah, poptávky, členství, oprávnění a audit. Ověř také postup obnovy Auth, RLS, funkcí a konfigurace; neukládej hesla či klíče do GitHubu, chatu ani veřejného bucketu.
- Samostatně zálohuj skutečné soubory Supabase Storage `site-media`, jejich cesty a metadata. Databázová záloha sama soubory Storage neobnoví. Chraň i exporty obsahující osobní údaje, stanov přístup a dobu uchování s vlastníkem.
- Proveď zkušební obnovu do izolovaného neveřejného prostředí. Nikdy nepřepisuj produkci. Ověř dokumenty, fotografie, role, přihlášení a čtení poptávek. V testovacím prostředí zablokuj skutečné e-maily, GA a indexování.
- Dolož čas poslední úspěšné zálohy, její kontrolu integrity a skutečný výsledek obnovy; napiš dosažené RPO/RTO a přesný postup obnovy. Nastav upozornění i na selhání samotného zálohování a kontrolu stáří zálohy.

## 2. Monitoring

- Nastav kontrolu dostupnosti veřejné domény, očekávaného obsahu a platnosti TLS, nikoli pouze HTTP 200. Sleduj také chyby Vercel Functions, neúspěšné deploymenty a nedostupnost Supabase. Frekvenci a případné placené služby dohodni s vlastníkem.
- Odděl provozní alerty od analytiky: GA4 závisí na souhlasu a není monitoring dostupnosti. Žádné monitorovací tokeny do klientského JavaScriptu.
- Sleduj neodstraněné `cms_inquiries` se `email_status = 'failed'` a `pending` starší než dvě minuty. Alert má obsahovat pouze bezpečný interní odkaz/ID, ne celý obsah poptávky ani kontaktní údaje. Zabráň opakovanému zahlcení stejným incidentem, oznam i jeho vyřešení.
- Současná aplikace uloží poptávku před e-mailem, transientní chyby odesílání zkusí nejvýše třikrát v jednom požadavku. Admin může zopakovat neúspěšné upozornění do 23 hodin se stejným idempotency klíčem. Není to trvalá fronta s workerem; při pádu procesu musí na čekající záznam upozornit monitoring. U starších/pending záznamů nejprve porovnej stav v Resendu, neposílej je naslepo znovu.
- Ověř Resend doménu, SPF/DKIM/DMARC, chyby, bounces a případný podpis webhooků. Stav „sent“ v naší DB znamená přijetí poskytovatelem, ne doručení do schránky. DNS změny koordinuj s vlastníkem domény. Nespouštěj hromadně staré testovací poptávky.
- Pokud navrhneš trvalou odchozí frontu, připrav zvlášť migraci/worker: atomické zamykání a lease, omezené pokusy s backoff, stabilní uložený payload a klíč, respektování 24hodinové idempotence Resendu, ruční řešení nejasných starších pokusů. Nevytvářej cron endpoint bez ověření tajemství ani veřejnou možnost přeposílat e-maily. Tento rozšířený provozní mechanismus není součástí současných okamžitých retry.

## 3. Klíče, ověření a předání

- Klíče používej pouze serverově přes produkční Sensitive proměnné Vercelu. Nezobrazuj je v odpovědi, logu ani commitu. Preview nesmí automaticky získat produkční přístupy ani odesílat skutečné notifikace.
- Příjemce provozních alertů a jejich náhradní kanál nech určit vlastníkem. Nespoléhej jen na stejnou e-mailovou službu, jejíž výpadek hlídáme. Bez souhlasu neposílej provozní údaje do nových externích služeb.
- Bezpečně vyzkoušej alert v izolovaném prostředí, jeho vyřešení a obnovu zálohy. Nevyvolávej skutečný výpadek produkce a neměň Resend klíč jen kvůli testu.
- Na konci vrať stručný protokol: co je zapnuté, kde je záloha a kdo ji smí obnovit, retence, poslední test obnovy, seznam monitorů a příjemců, odkazy na dashboardy a co zůstává neověřené. Úspěšný build není doklad fungující zálohy či doručení e-mailu.

Referenční dokumentace: [Supabase zálohy a jejich omezení](https://supabase.com/docs/guides/platform/backups), [Resend idempotence](https://resend.com/docs/dashboard/emails/idempotency-keys).
