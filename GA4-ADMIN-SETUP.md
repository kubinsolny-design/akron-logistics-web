# GA4 v administraci – dokončení propojení

## Ověřené cíle

- Google Cloud projekt: `akron-analytics` (číslo `421467289467`).
- GA4 služba: **akronlogistics.cz**, ID `559040702`.
- Měřicí ID veřejného webu: `G-D2XLJKJMNH`. Není to ID služby pro čtení statistik.
- Servisní účet: `akron-analytics-reader@akron-analytics.iam.gserviceaccount.com`.
- Dne 26. 10. 2026 vytvořen bez projektových rolí, přidán jako Viewer do této GA4 služby s omezeními No Cost Metrics / No Revenue Metrics. Data API zapnuto (ověřeno „API Enabled“). Soukromý klíč nebyl vytvořen.

## Co musí dokončit vlastník Vercelu

1. V Google Cloud otevřít výše uvedený servisní účet → **Keys → Add key → Create new key → JSON**. Klíč vytváří a stahuje vlastník osobně. JSON neposílat do chatu, necommitovat ani nevkládat do veřejných proměnných.
2. Ve Vercelu vybrat produkční projekt **akron-logistics-web** (nikoli staré admin demo), **Settings → Environment Variables**. Pouze pro **Production** nastavit:
   - `GA4_PROPERTY_ID` = `559040702` (Config).
   - `GA4_SERVICE_ACCOUNT_JSON` = **celý obsah staženého JSON**, nikoli cesta k souboru (Secret / Sensitive).
3. Znovu nasadit aktuální `main`. Samotné uložení proměnných nezmění již běžící deployment.
4. Přihlásit se administrátorským účtem na `https://akronlogistics.cz/admin` → **Analytika**. Vyzkoušet 7/28/90 dní a porovnat stejná data v GA4. Bez klíče se zobrazuje pravdivé upozornění, nikoli falešné nuly.
5. Stažený klíč uložit pouze do schváleného správce tajemství; odstranit nezabezpečené pracovní kopie. Při úniku klíč ihned zrušit v Google Cloud, vytvořit nový, aktualizovat Secret a redeployovat. Starý klíč odstranit po ověření nového.

## Oprávnění a provoz

- Povolit **Google Analytics Data API** v projektu `akron-analytics`.
- Servisní účet má mít v této jediné GA4 službě roli **Viewer / Čtenář**, bez přístupu k nákladovým a příjmovým metrikám. Není potřeba role Editor/Owner v Google Cloud, doménové delegování ani přístup do ostatních GA4 služeb.
- Pro čtení statistik není potřeba Measurement Protocol secret ani změna sběru cookies. Veřejné měření zůstává závislé na souhlasu a pouze na ostré doméně.
- Server znovu ověřuje aktivní administrátorskou roli před každým načtením i před použitím cache. Editoři, návštěvníci a odvolané účty statistiky nezískají.
- Přehled používá oficiální `google-auth-library`, scope `analytics.readonly`, pevný endpoint Google, čtyři agregované reporty v jednom batch požadavku a cache 5 minut. Nevrací tokeny, klíče ani surové odpovědi Google do prohlížeče/logů.
- Délka období je omezena na 7/28/90 dokončených dní. Datum se řídí časovým pásmem GA4 služby. Zahrnuje jen veřejné stránky na ostré doméně, nikoli admin, URL parametry, identifikátory návštěvníků či obsah poptávek.
- Google může finální data doplňovat 24–48 hodin. U nízkých počtů se může uplatnit práh ochrany soukromí; UI jej přiznává.
- Preview a starý admin demo projekt produkční klíč nedostávají. Pro případné preview testování použít samostatnou testovací GA4 službu a samostatný účet.

Oficiální návody: [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart), [Vercel proměnné](https://vercel.com/docs/environment-variables).
