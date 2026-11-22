import test from 'node:test';
import assert from 'node:assert/strict';
import {defineConfig, browserOptions, buildZarazConfiguration} from '@ehven/cloudflare-zaraz-consent-controller-core';
import {hubspotTool, readHubSpotVisitor, submissionHubSpotContext, hubspotResponse, hubspotDiagnostics} from '../src/index.mjs';
const config = defineConfig({enabled: true, origin: 'https://sample.example', paths: ['/'], purposes: {journey: {name: 'Journey', description: 'Optional public visits.'}},
  tools: {HubSpot: hubspotTool({portalId: '123', origin: 'https://sample.example', purpose: 'journey'})}});
const options = browserOptions(config), storage = {format: 'zaraz-packed-v1', namespace: 'Ab12'}, now = 1700000000000;
const token = 'a'.repeat(32);
function request({entry = {v: token, e: now + 1}, choices = true, headers = {}, extra = ''} = {}) {
  return new Request(options.origin + '/api/contact', {method: 'POST', headers: {Origin: options.origin,
    Cookie: `cf_consent=${encodeURIComponent(JSON.stringify({journey: choices}))}; cfz_hubspot=${encodeURIComponent(JSON.stringify({Ab12_hubspotutk: entry}))}; cfzs_hubspot=session; CF_Authorization=preserve${extra}`, ...headers}});
}
function form() {const data = new FormData(); data.set('analytics_consent', 'granted'); data.set('analytics_page', options.origin + '/'); data.set('analytics_hutk', 'b'.repeat(32)); return data;}
test('native provider recipe composes with core rather than owning shared policy', () => {
  const plan = buildZarazConfiguration({}, config);
  assert.equal(plan.tools.HubSpot.component, 'hubspot'); assert.equal(plan.tools.HubSpot.defaultPurpose, 'journey');
  assert.equal(plan.tools.HubSpot.settings.accountId, '123'); assert.equal(plan.settings.autoInjectScript, false);
});
test('server uses validated native HttpOnly context and ignores browser token fields', () => {
  assert.deepEqual(readHubSpotVisitor(request(), storage, now), {state: 'recognized', token});
  assert.deepEqual(submissionHubSpotContext(request(), form(), options, {purpose: 'journey', storage}, now), {hutk: token});
  const denied = [{choices: false}, {headers: {DNT: '1'}}, {headers: {'Sec-GPC': '1'}}, {headers: {Origin: 'https://outside.example'}}, {entry: {v: token, e: now}}, {entry: {v: 'private@example.test', e: now + 1}}, {entry: {v: token, e: now + 1, unknown: true}}, {extra: '; cfz_hubspot=duplicate'}];
  for (const values of denied) assert.deepEqual(submissionHubSpotContext(request(values), form(), options, {purpose: 'journey', storage}, now), {});
  assert.equal(readHubSpotVisitor(request(), {format: 'future'}, now).state, 'unsupported-config');
});
test('withdrawal expires native cookies while preserving response and authentication state', () => {
  const source = request({choices: false});
  const eligible = new Request(options.origin + '/', {headers: source.headers});
  const result = hubspotResponse(eligible, new Response('page', {headers: {'Set-Cookie': 'other=preserve'}}), options, {purpose: 'journey'});
  const cookies = result.headers.getSetCookie(); assert.equal(cookies.length, 5);
  assert.equal(cookies[0], 'other=preserve'); assert.equal(cookies.slice(1).every(value => /^cfzs?_hubspot=/.test(value)), true);
  assert.equal(cookies.some(value => /CF_Authorization|cf_consent/.test(value)), false);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
});
test('provider diagnostics have only fixed booleans/state and never tokens', () => {
  const result = hubspotDiagnostics(request(), options, {purpose: 'journey', storage}, now);
  assert.deepEqual(result, {providerCookieReceived: true, storageState: 'recognized', storedJourneyConsent: true});
  assert.equal(JSON.stringify(result).includes(token), false);
});
