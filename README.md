# HubSpot consent connector

Development candidate for `@ehven/cloudflare-zaraz-consent-connector-hubspot`.
Works with the separate Zaraz consent controller core. Supplies a native HubSpot
tool recipe, exact declared cookie cleanup and optional server-side visitor
association. Installing it makes no requests or submissions.

`hubspotTool({portalId, origin, purpose})` creates a purpose-owned native tool.
The native managed component can make browser requests; this is not fully
server-side analytics. Use the `/browser` export for `hubspotBrowserConnector` so
provider token parsing stays out of browser bundles. Core handles lifecycle.

`hubspotFormContext({purpose, selector?})` supplies a declarative form binding for
the core's shared `formContexts` machinery. Its default selector is
`form[data-analytics-association]`; only `analytics_consent` and `analytics_page`
metadata are added. No form message, identity or visitor token enters an event layer.

`submissionHubSpotContext(request, formData, publicOptions, {purpose, storage})`
returns `{hutk}` only after the core's origin, privacy, page and consent checks plus
recognized native storage. Otherwise it returns `{}`. Browser-supplied visitor
tokens are never trusted. Essential message delivery must continue without optional
association. Forms API transport, validation, abuse prevention and acknowledgments
belong to the host/messaging integration.

`storage` explicitly selects `{format: 'zaraz-packed-v1', namespace: 'Ab12'}`.
The namespace and `{v,e}` native storage format are a compatibility boundary, not
a guaranteed public cookie API. Confirm them in the intended native deployment.
Unknown/ambiguous/expired values fail closed. Cookie values and visitor tokens
must never be logged, serialized to HTML, or included in public diagnostics.

`hubspotResponse(request, response, publicOptions, {purpose})` expires only native
HubSpot cookies on eligible responses after withdrawal. Authentication and consent
storage remain untouched. It does not erase past CRM records. `hubspotDiagnostics`
returns only fixed booleans/storage state; host authorization must precede any
diagnostics endpoint. Native ingestion, reporting, association and withdrawal
need acceptance in the intended account. No support for automatic form scraping,
advertising, chat, account enrichment configuration or general HubSpot API control
is implied. Core is a peer dependency; there are no other runtime dependencies.

Support continued development through [Ehven Consultants](https://ehven.com/contact/).
