// Keep provider token parsing and server transport out of browser bundles.
export function hubspotBrowserConnector({purpose, hostname}) {
  const cookies = ['hubspotutk', 'hstc', 'hssc', 'hssrc', '__hstc', '__hssc', '__hssrc'].flatMap(name => [
    {name, purpose}, {name, purpose, domain: hostname},
  ]);
  return {id: 'HubSpot', purpose, cookies};
}
export function hubspotFormContext({purpose, selector = 'form[data-analytics-association]'}) {
  return {purpose, selector, consentField: 'analytics_consent', pageField: 'analytics_page', marker: 'data-analytics-context'};
}
