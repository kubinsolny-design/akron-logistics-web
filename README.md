# AKRON Logistics

Firemní web pro vnitrostátní a mezinárodní silniční přepravu a spedici. Postavený v Next.js 16 a TypeScriptu.

## Spuštění

```bash
pnpm install
pnpm dev
```

## Produkční nastavení

Proměnné jsou popsané v `.env.example`. Pro ostré nasazení je nutné nastavit:

- `NEXT_PUBLIC_SITE_URL` na finální doménu;
- `ALLOW_INDEXING=true` mimo Vercel; Vercel produkční nasazení se indexuje automaticky a preview zůstává skryté;
- `RESEND_API_KEY`, `INQUIRY_TO_EMAIL` a ověřenou adresu `INQUIRY_FROM_EMAIL` pro doručování poptávek.

Telefon a veřejný e-mail nejsou v repozitáři uvedené, protože je klient zatím nedodal. Po jejich potvrzení je přidejte do hlavičky a patičky.
