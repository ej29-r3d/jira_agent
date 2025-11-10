/**
 * Quick test to verify URL parsing and cleaning logic
 */

const ApiPortalScraper = require('./api-scraper');

// Test URLs
const testUrls = [
  'https://acme.atlassian.net/servicedesk/customer/portal/1',
  'https://acme.atlassian.net/servicedesk/customer/portal/1?q=test',
  'https://example.atlassian.net/jira/servicedesk/projects/SUP',
  'https://test.atlassian.net/servicemanagement/view/portal',
  'https://company.atlassian.net/servicedesk/customer/portals',
  'https://notatlassian.com/servicedesk', // Should be filtered
  'https://broken-url', // Should be filtered
];

console.log('Testing URL parsing and validation...\n');

const scraper = new ApiPortalScraper({ apiType: 'serpapi', apiKey: 'test' });

testUrls.forEach((url, i) => {
  console.log(`Test ${i + 1}: ${url}`);
  const cleaned = scraper.cleanPortalUrl(url);

  if (cleaned) {
    console.log(`  ✓ Valid`);
    console.log(`    Subdomain: ${cleaned.subdomain}`);
    console.log(`    Type: ${cleaned.type}`);
    console.log(`    Clean URL: ${cleaned.url}`);
  } else {
    console.log(`  ✗ Filtered (invalid or non-Atlassian)`);
  }
  console.log();
});

// Test deduplication
console.log('Testing deduplication...\n');
const duplicateUrls = [
  'https://acme.atlassian.net/servicedesk/customer/portal/1',
  'https://acme.atlassian.net/servicedesk/customer/portal/1?query=test',
  'https://acme.atlassian.net/servicedesk/customer/portal/2',
  'https://beta.atlassian.net/servicedesk/customer/portal/1',
];

const mockResults = duplicateUrls.map(url => ({
  url: url,
  title: 'Test Portal',
  snippet: 'Test snippet'
}));

scraper.processResults(mockResults, 'test-query');

console.log(`Input URLs: ${duplicateUrls.length}`);
console.log(`Unique portals: ${scraper.portals.size}`);
console.log(`\nUnique portal hostnames:`);
Array.from(scraper.portals.keys()).forEach(key => {
  console.log(`  - ${key}`);
});

console.log('\n✓ All tests completed');
