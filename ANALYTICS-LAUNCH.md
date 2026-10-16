# Google Analytics 4

Measurement ID: `G-D2XLJKJMNH` (existing stream supplied by the owner; no new Google property was created).

- Basic opt-in only: no Google tag or request before consent. Existing essential-only choices remain refusals, malformed/expired choices never grant access.
- Disabled while `preparing=true`, in draft mode, on localhost, Vercel/review/demo hosts and non-public paths including `/admin` and `/studio`.
- On launch, only the exact production domains and six public page paths are measured. No custom form, inquiry or user events are sent. Page URLs exclude query strings and fragments. Advertising consent is denied, Google signals and advertising personalization are disabled.
- Consent can be withdrawn in the footer. This disables the tag, removes first-party GA cookies and reloads the page. Consent and configured GA cookies expire after 180 days.
- Admin shows the ID and an external Analytics link, not fabricated statistics. Embedded reports require separately authorized Google Analytics Data API access.

Before enabling the public site:
1. The property owner must confirm that this stream belongs to AKRON and the correct account, disable enhanced measurement (especially forms and history-change page views) to avoid duplicate or unsolicited automatic events, review retention and Google data-sharing settings.
2. Review/update the actual published `/cookies` and privacy texts for Google Analytics, provider, purpose, optional consent and retention. Current CMS drafts/publications were deliberately not overwritten. Existing texts describing only essential technologies remain correct while preparing mode blocks analytics.
3. Only after launch approval disable preparing mode. In a clean browser verify: no Google requests before choice or after refusal; one page view after opt-in; navigation; consent revocation; no admin or review traffic. Confirm receipt in the owner's GA Realtime/DebugView. Code deployment alone is not proof of received GA data.

References: https://developers.google.com/tag-platform/security/concepts/consent-mode and https://developers.google.com/analytics/devguides/collection/ga4/views
