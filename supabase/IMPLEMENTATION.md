# Historical Supabase implementation notes (6 October 2026)

> Archived progress log, not current deployment instructions. The current application uses Supabase only; the old import script and Sanity integrations have been removed. Follow the current README and its removal checklist instead. Keep this log solely as migration history.

Project: `akron-admin-preview` (`htgwzjcdxbknzvobwioa`), AKRON Logistics,
Free, Europe / Ireland (`eu-west-1`). Creation verified on 2026-10-06.

Development branch: `codex/akron-supabase`. The existing Sanity demo stays on
`codex/akron-administrace`; the real production website is unchanged.

## Current state

- Initial SQL migration applied to the preview project on 2026-10-06.
- Transactional SQL permission smoke tests passed in the preview database;
  fixture users, role changes, drafts and inquiries were rolled back.
- No Supabase application accounts or administrator membership created yet.
- No content/assets imported and no website provider switched.
- Supabase SSR login, invitation acceptance, role management, recursive content
  editor, media upload and published-content adapter implemented locally.
- Initial type check passed; browser/session/invitation verification and preview
  deployment remain pending. The UI is not ready for customer handoff yet.
- Import script prepared, read-only by default, create-if-missing when applied.
- Inquiry submission integration, automatic asset migration, friendly media
  selection and additional editor usability improvements still pending.
- Read-only import rehearsal found all six published pages and site settings.
- Default Supabase SMTP cannot invite people outside the project organization.
  Admin UI also supports generating a personal invitation link for direct
  handoff without email delivery. Do not grant organization membership as a
  workaround. Keep the invitation link private; it is a bearer credential.
- Type checking, targeted lint and the local build passed after the personal-link
  and direct image replacement changes. Runtime content fetching emitted existing
  CMS-unavailable warnings during that build; no authenticated browser or
  end-to-end verification is claimed. Read-only Sanity import rehearsal passed.
- No project keys or database passwords are committed here.
- After explicit approval, the existing Supabase server key was stored in
  Vercel project `akron-admin-demo` as **Secret**, scoped to that project's
  Production environment only. The original `akron-logistics-web` is unchanged.
- Preview-project configuration variables were also saved in that same scope:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `ADMIN_SITE_URL`, `NEXT_PUBLIC_ADMIN_PROVIDER`, `CMS_PROVIDER`, `ALLOW_INDEXING`.
  Their saved presence was verified in the Vercel dashboard. No redeployment
  has been requested, and no operational Supabase connection is claimed yet.
- After explicit approval, Supabase Auth Site URL was saved as
  `https://akron-admin-demo.vercel.app`; the only added redirect URL is
  `https://akron-admin-demo.vercel.app/admin/accept`. Both saved values verified
  on 2026-10-06. No other domain or wildcard was added.
- `build:admin-preview` is an explicitly selected deployment command for the
  isolated demo only. It seeds the empty preview database from the current
  published Sanity site before building. On later runs it only verifies the
  expected published documents and leaves all customer edits untouched.
  If a previous import is partial, it fails closed for manual recovery and
  never automatically publishes an existing draft. Default `build` is unchanged.

## Intended access

| Role | Published website | Drafts | Edit/publish/upload | Private inquiries | Invite/manage roles |
| --- | --- | --- | --- | --- | --- |
| Visitor | Read | No | No | No | No |
| Viewer | Read | Read | No | No | No |
| Editor | Read | Read | Yes | Read / status / notes | No |
| Admin | Read | Read | Yes | Read / status / notes | Yes |

Application membership does not grant Supabase dashboard access. Authorization
comes from the protected membership table, not user-editable Auth metadata.
The first admin must be bootstrapped explicitly after the corresponding **app
Auth user** exists. A Supabase dashboard account is not an app Auth user.

## Implementation safeguards / remaining work

1. Confirm and apply the prepared SQL to this preview project only. Run the
   transactional permission tests before integrating clients.
2. Disable public signup, configure preview-only Auth redirects and invite the
   first administrator with separately confirmed email delivery/access grant.
3. Add Supabase SSR session handling. Verify users on the server, check current
   membership on every protected operation and never cache authenticated pages.
4. Add friendly `/admin` editors for existing section/card/settings structures;
   do not expose a raw JSON editor as the customer's content-management UI.
5. Add administrator-only invitations using server-only service credentials and
   current caller authorization. Protect self-demotion and last-admin removal.
6. Migrate current published Sanity content, not just source-code defaults.
   Keep `inquiryEmail` out of public settings. Import assets under unique names;
   preserve trusted local SVG assets until safe SVG processing is implemented.
7. Store inquiries on the server only. Add atomic abuse/rate-limit protection
   before enabling submissions; service credentials never go to the browser.
8. Verify anonymous, non-member, viewer, editor and admin permissions against
   real database policies, including denied write paths and role escalation.
9. Deploy and verify the preview; switch providers only after successful checks.
   Keep Sanity available for rollback. Production migration needs separate sign-off.

Public `site-media` is for website graphics only: even draft uploads can be
downloaded by anyone knowing their URL. It must never contain private inquiries
or identity documents. Client uploads accept PNG/JPEG/WebP up to 10 MB and cannot
overwrite/delete existing objects. Replacing images creates new objects.

The migration intentionally grants no anonymous inquiry inserts and no direct
client writes to CMS tables. Draft saving and publishing use revision-checked
functions to avoid silently overwriting another editor's work.

Reference: [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
and [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
