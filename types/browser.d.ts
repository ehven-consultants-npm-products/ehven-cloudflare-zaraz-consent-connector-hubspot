import type {Connector, FormContext} from '@ehven/cloudflare-zaraz-consent-controller-core/browser';
export function hubspotBrowserConnector(options: {purpose: string; hostname: string}): Connector;
export function hubspotFormContext(options: {purpose: string; selector?: string}): FormContext;
