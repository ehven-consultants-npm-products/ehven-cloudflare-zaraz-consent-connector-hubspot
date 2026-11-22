import type {BrowserOptions, NativeTool} from '@ehven/cloudflare-zaraz-consent-controller-core';
import type {Connector} from '@ehven/cloudflare-zaraz-consent-controller-core/browser';
export interface HubSpotStorage {format: 'zaraz-packed-v1'; namespace: string;}
export function hubspotTool(options: {portalId: string; origin: string; purpose: string; triggers?: string[]}): NativeTool;
export function journeyToken(value: unknown): string | undefined;
export function readHubSpotVisitor(request: Request, storage: HubSpotStorage, now?: number): {state: 'recognized'; token: string} | {state: 'missing' | 'unsupported-config' | 'unsupported-format' | 'expired'};
export function submissionHubSpotContext(request: Request, formData: FormData, options: BrowserOptions, connector: {purpose: string; storage: HubSpotStorage; consentField?: string; pageField?: string}, now?: number): {hutk?: string};
export function hubspotBrowserConnector(options: {purpose: string; hostname: string}): Connector;
export {hubspotFormContext} from './browser.js';
export function hubspotResponse(request: Request, response: Response, options: BrowserOptions, connector: {purpose: string}): Response;
export function hubspotDiagnostics(request: Request, options: BrowserOptions, connector: {purpose: string; storage: HubSpotStorage}, now?: number): {providerCookieReceived: boolean; storageState: string; storedJourneyConsent: boolean};
