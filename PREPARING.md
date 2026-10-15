# Režim Připravujeme

Zapnut na přání vlastníka před finální kontrolou webu. Ostrá doména `akronlogistics.cz` (a neznámé deployment adresy) ukazuje pouze logo a „Připravujeme“, bez navigace a formuláře. Přesná kontrolní adresa `akron-logistics-web.vercel.app` od 15. 10. 2026 zobrazuje celý web. Rozhoduje hostname požadavku, nikoli query parametr. Odpověď „Připravujeme“ má noindex/nofollow a no-store. Indexace zůstává vypnutá i pro kontrolní web; robots zakazuje procházení a sitemap je prázdná. Nejde o okamžité odstranění případných dříve indexovaných URL z vyhledávače.

Administrace `/admin`, přijetí pozvánky `/admin/accept`, admin API a původní Studio zůstávají dostupné se stávajícím ověřováním. Žádná uživatelská oprávnění ani data se nemění. Poptávková serverová akce je také zablokovaná, aby ji nešlo vyvolat ze starého otevřeného webu.

Po schválení ostrého spuštění změnit `preparing` v `app/preparing.ts` na `false` a provést nové produkční nasazení. Současně ověřit nastavení indexace, sitemapu a všechny body v `supabase/ADMIN-LAUNCH.md`. Vypnutí režimu nepublikuje koncepty ani nemigruje databázi.

HTTP kontrola: `node scripts/check-preparing.mjs <adresa-webu>`.
