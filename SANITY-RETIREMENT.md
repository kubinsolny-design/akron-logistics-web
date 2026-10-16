# Sanity retirement audit — 15–16 October 2026

Scope: only legacy project `l802e097` and the two AKRON Vercel projects in HEHU. No project/account deletion has been performed. Production remains in preparing mode. No migration, import or content publication was run.

## Authenticated inventory and private backup

- Dataset enumeration returned only `production`, no `inquiries` dataset.
- Authenticated full query: 33 readable documents: six published pages, site settings, five image assets, nine preview-link secrets, eleven system groups and one retention document. No actual content drafts, release versions, inquiries, other file assets or unused images were found.
- Full standard export includes all five asset binaries and 16 non-asset documents. Companion raw export preserves 21 original document/asset records. A private full-query JSON also retains the 12 system records omitted by the standard dataset export.
- Both archives were read successfully; standard export was extracted and all five binaries matched original SHA-1 asset identifiers. Archive SHA-256 checksums and verification details are in the private backup manifest.
- Private backup is outside the repository in the owner's local `private-backups/akron-sanity-l802e097-2026-10-15` directory. Access is restricted to the owner, SYSTEM and Administrators. It contains secrets and must NOT be uploaded to GitHub/public Storage. This is a local backup, not a verified off-device disaster-recovery copy or full revision-history archive.
- No newer Supabase content or drafts were overwritten. Historical Sanity IDs/URLs in backups remain untouched.

## Retired connections

- Vercel resource `akron-logistics-cms` disconnected from `akron-logistics-web` without deleting the resource/project. All eight integration-managed Sanity variables were removed from Production and Preview. None existed in Development or the demo. Team shared-variable inventory was empty.
- Removed obsolete `CMS_PROVIDER` from the demo; current application has only the Supabase data path. Neither AKRON project had deploy hooks. Main uses default Next build, demo `pnpm run build`; neither imports Sanity.
- Revoked exactly the old Editor and Viewer tokens for Vercel; authenticated token list then returned zero. Sanity webhook list was already empty.
- Removed the 30 old AKRON/localhost CORS origins, preserving their list in the private backup; subsequent list returned no origins. This prevents historical authenticated browser Studios from using those origins. It does not delete historical deployments or make the formerly public dataset private.

## Verification and limits

- Main and demo were deployed successfully from `e2eb2d7` after disconnecting Sanity; subsequent code updates must be deployed from current main, never the old demo branch.
- Checked all six public paths, `/admin`, `/studio` and `/studio/obsah` on the production domain, main review alias and demo. Production/demo public pages stay preparing; main review renders the content. Studio paths redirect to `/admin`.
- All five owned media URLs returned 200. PNG/JPEG match original hashes; SVGs differ only in the file's trailing newline (no remote CDN dependency).
- Authenticated production admin loads content and media. A temporary draft title was saved, verified absent from the public review site, and restored exactly without publishing. A public test image was uploaded to own Supabase Storage; upload alone did not change public content.
- Enumerated 76 main and 40 demo historical deployments. Requests to their immutable `/studio` addresses were redirected by Vercel protection (302); their protected application bodies were therefore not verified or bypassed. Old integration tokens are revoked and allowed browser origins removed.
- Runtime source and rendered HTML checks found no active Sanity SDK, API/asset URLs or fallbacks. A complete browser network capture with Sanity domains actively blocked has not been performed; do not represent source/HTML checks as that test.
- No new inquiry email was sent. Earlier successful Supabase/Resend delivery evidence remains historical; it is not a new end-to-end mail test after this cleanup.

## Before irreversible deletion

Obtain the owner's separate final confirmation for deletion of project `l802e097` only. Preserve/download the complete private backup first. Do not uninstall/remove the Marketplace resource as a shortcut: provider resource deletion can destroy the Sanity project. Never delete the organization/account or other projects.
