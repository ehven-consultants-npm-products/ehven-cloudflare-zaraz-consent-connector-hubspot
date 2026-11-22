import {readRequestCookie, readStoredChoices, submissionConsentGranted, expireCookiesAfterWithdrawal} from '@ehven/cloudflare-zaraz-consent-controller-core/server';
export {hubspotBrowserConnector, hubspotFormContext} from './browser.mjs';

export function hubspotTool({portalId, origin, purpose, triggers = ['Pageview']}) {
  if (typeof portalId !== 'string' || !/^[0-9]+$/.test(portalId)) throw new TypeError('A numeric public HubSpot portal ID is required.');
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) throw new TypeError('An exact HTTPS origin is required.');
  if (typeof purpose !== 'string' || !/^[A-Za-z0-9]{1,64}$/.test(purpose)) throw new TypeError('An explicit consent purpose is required.');
  if (!Array.isArray(triggers) || !triggers.length || triggers.some(id => typeof id !== 'string' || !/^[A-Za-z0-9]{1,64}$/.test(id))) throw new TypeError('Explicit trigger IDs are required.');
  return {type: 'component', component: 'hubspot', name: 'HubSpot visit history', enabled: true, defaultPurpose: purpose,
    blockingTriggers: [], defaultFields: {}, permissions: ['access_client_kv', 'client_network_requests', 'server_network_requests'],
    settings: {accountId: portalId, domainName: url.hostname},
    actions: {HubSpotPageview: {actionType: 'pageview', blockingTriggers: [], firingTriggers: [...triggers], data: {}}}};
}
export const journeyToken = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value) ? value : undefined;
export function readHubSpotVisitor(request, storage = {}, now = Date.now()) {
  const {format, namespace} = storage ?? {};
  const raw = readRequestCookie(request, 'cfz_hubspot');
  if (raw === undefined) return {state: 'missing'};
  if (format !== 'zaraz-packed-v1' || typeof namespace !== 'string' || !/^[A-Za-z0-9]{4}$/.test(namespace)) return {state: 'unsupported-config'};
  try {
    const packed = JSON.parse(decodeURIComponent(raw));
    const entry = packed?.[`${namespace}_hubspotutk`];
    if (!packed || typeof packed !== 'object' || Array.isArray(packed) || !entry || typeof entry !== 'object' || Array.isArray(entry)
      || !Object.keys(entry).every(key => ['v', 'e'].includes(key)) || !Number.isSafeInteger(entry.e) || !journeyToken(entry.v)) return {state: 'unsupported-format'};
    if (entry.e <= now || !Number.isFinite(now)) return {state: 'expired'};
    return {state: 'recognized', token: entry.v};
  } catch {return {state: 'unsupported-format'};}
}
export function submissionHubSpotContext(request, formData, options, {purpose, storage, consentField = 'analytics_consent', pageField = 'analytics_page'}, now = Date.now()) {
  if (!submissionConsentGranted(request, formData, options, {purpose, consentField, pageField})) return {};
  const visitor = readHubSpotVisitor(request, storage, now);
  return visitor.state === 'recognized' ? {hutk: visitor.token} : {};
}
export function hubspotResponse(request, response, options, {purpose}) {
  const hostname = new URL(options.origin).hostname;
  const cookies = ['cfz_hubspot', 'cfzs_hubspot'].flatMap(name => [
    {name, purpose, httpOnly: true}, {name, purpose, domain: hostname, httpOnly: true},
  ]);
  return expireCookiesAfterWithdrawal(request, response, options, cookies);
}
/** Boolean/state projection only; the native visitor token never enters diagnostics. */
export function hubspotDiagnostics(request, options, {purpose, storage}, now = Date.now()) {
  const visitor = readHubSpotVisitor(request, storage, now);
  return {providerCookieReceived: readRequestCookie(request, 'cfz_hubspot') !== undefined,
    storageState: visitor.state, storedJourneyConsent: readStoredChoices(request, options)[purpose] === true};
}
