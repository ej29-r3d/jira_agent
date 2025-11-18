/**
 * Pre-defined search strategies for finding Atlassian user portals
 *
 * These are common patterns used to find companies using Atlassian products.
 * Update based on the how-to-sell document guidance.
 */

const SEARCH_STRATEGIES = {
  /**
   * Strategy 1: Find all Atlassian-hosted sites
   * Finds companies with *.atlassian.net domains
   */
  atlassianHosted: {
    name: 'Atlassian Hosted Sites',
    query: 'site:atlassian.net',
    description: 'Finds all sites hosted on Atlassian cloud (*.atlassian.net)',
    expectedResults: 'High - includes all Atlassian cloud instances'
  },

  /**
   * Strategy 2: Find JIRA Service Desks
   * Focuses on public-facing service desk portals
   */
  serviceDesks: {
    name: 'JIRA Service Desks',
    query: 'site:atlassian.net ("service desk" OR "support portal" OR "help desk")',
    description: 'Finds public JIRA service desk portals',
    expectedResults: 'Medium - public support portals'
  },

  /**
   * Strategy 3: Find companies with Atlassian in URL
   * Catches both hosted and self-hosted instances
   */
  urlPattern: {
    name: 'Atlassian URL Pattern',
    query: 'inurl:atlassian.net OR inurl:/jira/ OR inurl:/servicedesk/ OR inurl:/wiki/',
    description: 'Finds sites with Atlassian-related URL patterns',
    expectedResults: 'High - includes various Atlassian products'
  },

  /**
   * Strategy 4: Find sites powered by Atlassian
   * Looks for branding/footer text
   */
  poweredBy: {
    name: 'Powered by Atlassian',
    query: '"powered by atlassian" OR "powered by jira" OR "powered by confluence"',
    description: 'Finds sites that mention being powered by Atlassian',
    expectedResults: 'Low - depends on visible branding'
  },

  /**
   * Strategy 5: Find customer portals
   * Specifically targets customer-facing portals
   */
  customerPortals: {
    name: 'Customer Portals',
    query: 'site:atlassian.net ("customer portal" OR "client portal" OR "partner portal")',
    description: 'Finds customer/client facing Atlassian portals',
    expectedResults: 'Low-Medium - specific use case'
  },

  /**
   * Strategy 6: Find IT service management portals
   * Focuses on ITSM use cases
   */
  itsm: {
    name: 'IT Service Management',
    query: 'site:atlassian.net ("IT support" OR "ITSM" OR "ticketing" OR "incidents")',
    description: 'Finds IT service management portals',
    expectedResults: 'Medium - common enterprise use case'
  },

  /**
   * Strategy 7: Find project management portals
   * Software development and project tracking
   */
  projectManagement: {
    name: 'Project Management',
    query: 'site:atlassian.net ("project" OR "sprint" OR "backlog" OR "kanban" OR "scrum")',
    description: 'Finds project management and agile portals',
    expectedResults: 'High - very common use case'
  },

  /**
   * Strategy 8: Find specific industries
   * Can be customized for target industries
   */
  industries: {
    name: 'Industry-Specific',
    query: 'site:atlassian.net ("software development" OR "engineering" OR "DevOps")',
    description: 'Finds portals in specific industries',
    expectedResults: 'Medium - depends on industry'
  },

  /**
   * Strategy 9: Comprehensive search
   * Combines multiple patterns for broad coverage
   */
  comprehensive: {
    name: 'Comprehensive Search',
    query: '(site:atlassian.net OR inurl:atlassian.net) AND ("jira" OR "confluence" OR "service desk" OR "support")',
    description: 'Broad search combining multiple patterns',
    expectedResults: 'Very High - broadest coverage'
  },

  /**
   * Strategy 10: Public portals only
   * Attempts to find only publicly accessible portals
   */
  publicOnly: {
    name: 'Public Portals',
    query: 'site:atlassian.net ("sign up" OR "create account" OR "register" OR "get started")',
    description: 'Finds portals with public signup options',
    expectedResults: 'Low-Medium - limited to public access'
  },

  /**
   * Strategy 11: Enterprise portals
   * Targets larger organizations
   */
  enterprise: {
    name: 'Enterprise Portals',
    query: 'site:atlassian.net ("enterprise" OR "organization" OR "team" OR "workspace")',
    description: 'Finds enterprise-level Atlassian deployments',
    expectedResults: 'High - common terminology'
  },

  /**
   * Strategy 12: Find portals by company name patterns
   * Uses common company domain patterns
   */
  companyPatterns: {
    name: 'Company Domain Patterns',
    query: 'site:atlassian.net (inurl:"-" OR inurl:"_") -site:support.atlassian.net -site:community.atlassian.net',
    description: 'Finds company subdomains, excludes official Atlassian sites',
    expectedResults: 'Very High - most company domains'
  }
};

/**
 * Get all search strategies
 */
function getAllStrategies() {
  return SEARCH_STRATEGIES;
}

/**
 * Get a specific strategy by key
 */
function getStrategy(strategyKey) {
  return SEARCH_STRATEGIES[strategyKey] || null;
}

/**
 * Get strategy names
 */
function getStrategyNames() {
  return Object.keys(SEARCH_STRATEGIES);
}

/**
 * Print all strategies
 */
function printStrategies() {
  console.log('\n=== Available Search Strategies ===\n');

  Object.entries(SEARCH_STRATEGIES).forEach(([key, strategy], index) => {
    console.log(`${index + 1}. ${strategy.name} (${key})`);
    console.log(`   Query: ${strategy.query}`);
    console.log(`   Description: ${strategy.description}`);
    console.log(`   Expected Results: ${strategy.expectedResults}`);
    console.log('');
  });
}

/**
 * Combine multiple strategies
 */
function combineStrategies(strategyKeys) {
  const queries = strategyKeys
    .map(key => getStrategy(key))
    .filter(s => s !== null)
    .map(s => `(${s.query})`);

  return queries.join(' OR ');
}

/**
 * Create a custom search query based on parameters
 */
function createCustomQuery(params) {
  const {
    includeHosted = true,      // Include site:atlassian.net
    includeServiceDesk = true,  // Include service desk terms
    includeJira = true,         // Include JIRA terms
    includeConfluence = false,  // Include Confluence terms
    industry = null,            // Specific industry terms
    excludeOfficial = true,     // Exclude official Atlassian sites
    additionalTerms = []        // Additional search terms
  } = params;

  const parts = [];

  // Base domain
  if (includeHosted) {
    parts.push('site:atlassian.net');
  }

  // Product-specific terms
  const products = [];
  if (includeJira) products.push('"jira"');
  if (includeConfluence) products.push('"confluence"');
  if (includeServiceDesk) products.push('"service desk"');

  if (products.length > 0) {
    parts.push(`(${products.join(' OR ')})`);
  }

  // Industry-specific terms
  if (industry) {
    parts.push(`"${industry}"`);
  }

  // Additional terms
  if (additionalTerms.length > 0) {
    parts.push(`(${additionalTerms.map(t => `"${t}"`).join(' OR ')})`);
  }

  let query = parts.join(' AND ');

  // Exclusions
  if (excludeOfficial) {
    query += ' -site:support.atlassian.net -site:community.atlassian.net -site:developer.atlassian.net -site:marketplace.atlassian.net';
  }

  return query;
}

module.exports = {
  SEARCH_STRATEGIES,
  getAllStrategies,
  getStrategy,
  getStrategyNames,
  printStrategies,
  combineStrategies,
  createCustomQuery
};

// If run directly, print strategies
if (require.main === module) {
  printStrategies();
  console.log('\n=== Custom Query Examples ===\n');

  console.log('1. JIRA only, no Confluence:');
  console.log(createCustomQuery({
    includeJira: true,
    includeConfluence: false,
    includeServiceDesk: false
  }));
  console.log('');

  console.log('2. Service Desks in Healthcare:');
  console.log(createCustomQuery({
    includeServiceDesk: true,
    includeJira: false,
    industry: 'healthcare'
  }));
  console.log('');

  console.log('3. Software companies with JIRA:');
  console.log(createCustomQuery({
    includeJira: true,
    additionalTerms: ['software', 'development', 'engineering']
  }));
  console.log('');
}
