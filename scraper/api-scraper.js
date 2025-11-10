const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * API-based Portal Scraper
 * Uses search APIs for more reliable and scalable scraping
 * Supports: Google Custom Search API, SerpAPI, Bing Search API
 */

class ApiPortalScraper {
  constructor(options = {}) {
    this.outputFile = options.outputFile || './data/service-portals.json';
    this.apiType = options.apiType || 'serpapi'; // serpapi, google-custom, bing
    this.apiKey = options.apiKey || process.env.SEARCH_API_KEY;
    this.searchEngineId = options.searchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID;
    this.maxResults = options.maxResults || 200;
    this.delay = options.delay || 1000;
    this.portals = new Map(); // Use Map to store portal objects
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Search using SerpAPI (supports Google, Bing, etc.)
   * Get free API key at: https://serpapi.com/
   */
  async searchSerpAPI(query, start = 0) {
    if (!this.apiKey) {
      throw new Error('SerpAPI key required. Set SEARCH_API_KEY env variable or pass apiKey option.');
    }

    const url = 'https://serpapi.com/search';
    const params = {
      q: query,
      api_key: this.apiKey,
      engine: 'google',
      start: start,
      num: 10
    };

    try {
      console.log(`SerpAPI search: "${query}" (start: ${start})`);
      const response = await axios.get(url, { params, timeout: 15000 });

      if (response.data.organic_results) {
        return response.data.organic_results.map(result => ({
          url: result.link,
          title: result.title,
          snippet: result.snippet
        }));
      }

      return [];
    } catch (error) {
      console.error(`SerpAPI error: ${error.message}`);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      return [];
    }
  }

  /**
   * Search using Google Custom Search API
   * Setup: https://developers.google.com/custom-search/v1/overview
   */
  async searchGoogleCustom(query, start = 1) {
    if (!this.apiKey || !this.searchEngineId) {
      throw new Error('Google Custom Search requires API key and Search Engine ID');
    }

    const url = 'https://www.googleapis.com/customsearch/v1';
    const params = {
      key: this.apiKey,
      cx: this.searchEngineId,
      q: query,
      start: start,
      num: 10
    };

    try {
      console.log(`Google Custom Search: "${query}" (start: ${start})`);
      const response = await axios.get(url, { params, timeout: 15000 });

      if (response.data.items) {
        return response.data.items.map(item => ({
          url: item.link,
          title: item.title,
          snippet: item.snippet
        }));
      }

      return [];
    } catch (error) {
      console.error(`Google Custom Search error: ${error.message}`);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      return [];
    }
  }

  /**
   * Search using Bing Search API
   * Get API key: https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
   */
  async searchBing(query, offset = 0) {
    if (!this.apiKey) {
      throw new Error('Bing Search API key required');
    }

    const url = 'https://api.bing.microsoft.com/v7.0/search';
    const params = {
      q: query,
      count: 50,
      offset: offset
    };

    try {
      console.log(`Bing Search: "${query}" (offset: ${offset})`);
      const response = await axios.get(url, {
        params,
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey
        },
        timeout: 15000
      });

      if (response.data.webPages?.value) {
        return response.data.webPages.value.map(result => ({
          url: result.url,
          title: result.name,
          snippet: result.snippet
        }));
      }

      return [];
    } catch (error) {
      console.error(`Bing Search error: ${error.message}`);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      return [];
    }
  }

  /**
   * Generic search method that routes to the appropriate API
   */
  async search(query, page = 0) {
    switch (this.apiType) {
      case 'serpapi':
        return await this.searchSerpAPI(query, page * 10);

      case 'google-custom':
        return await this.searchGoogleCustom(query, page * 10 + 1);

      case 'bing':
        return await this.searchBing(query, page * 50);

      default:
        throw new Error(`Unknown API type: ${this.apiType}`);
    }
  }

  /**
   * Clean and validate portal URL
   */
  cleanPortalUrl(url) {
    try {
      const urlObj = new URL(url);

      // Must be atlassian.net domain
      if (!urlObj.hostname.endsWith('.atlassian.net')) {
        return null;
      }

      // Extract subdomain (organization name)
      const subdomain = urlObj.hostname.split('.')[0];

      // Build clean portal URL
      let cleanPath = urlObj.pathname.split('?')[0];

      return {
        url: `${urlObj.protocol}//${urlObj.hostname}${cleanPath}`,
        baseUrl: `${urlObj.protocol}//${urlObj.hostname}`,
        subdomain: subdomain,
        hostname: urlObj.hostname,
        path: cleanPath,
        type: this.detectPortalType(url)
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Detect the type of portal
   */
  detectPortalType(url) {
    const lower = url.toLowerCase();
    if (lower.includes('/servicedesk/customer/portal')) return 'customer-portal';
    if (lower.includes('/servicedesk/customer')) return 'customer-service-desk';
    if (lower.includes('/servicemanagement')) return 'service-management';
    if (lower.includes('/servicedesk')) return 'service-desk';
    if (lower.includes('/jira/servicedesk')) return 'jira-service-desk';
    return 'atlassian-site';
  }

  /**
   * Process search results and extract portal URLs
   */
  processResults(results, sourceQuery) {
    let newPortals = 0;

    for (const result of results) {
      const cleaned = this.cleanPortalUrl(result.url);

      if (cleaned) {
        // Use hostname as unique key to avoid duplicates
        if (!this.portals.has(cleaned.hostname)) {
          this.portals.set(cleaned.hostname, {
            ...cleaned,
            title: result.title,
            snippet: result.snippet,
            foundBy: sourceQuery,
            discoveredAt: new Date().toISOString()
          });
          newPortals++;
          console.log(`  ✓ New: ${cleaned.subdomain} (${cleaned.type}) - Total: ${this.portals.size}`);
        }
      }
    }

    return newPortals;
  }

  /**
   * Main scraping method
   */
  async scrapePortals(customQueries = []) {
    const defaultQueries = [
      'site:atlassian.net "customer portal"',
      'site:atlassian.net "service desk"',
      'site:atlassian.net inurl:servicedesk/customer',
      'site:atlassian.net "submit a request"',
      'site:atlassian.net "help center"',
      'site:atlassian.net "request help"',
      'site:atlassian.net inurl:/servicedesk/customer/portal',
    ];

    const queries = customQueries.length > 0 ? customQueries : defaultQueries;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`API Portal Scraper`);
    console.log(`API Type: ${this.apiType}`);
    console.log(`Target: ${this.maxResults} portals`);
    console.log(`Queries: ${queries.length}`);
    console.log(`${'='.repeat(60)}\n`);

    for (const query of queries) {
      if (this.portals.size >= this.maxResults) {
        console.log(`\n✓ Reached target of ${this.maxResults} portals`);
        break;
      }

      console.log(`\nQuery: "${query}"`);

      // Search multiple pages for each query
      const maxPages = this.apiType === 'bing' ? 4 : 10; // Bing returns more results per page

      for (let page = 0; page < maxPages && this.portals.size < this.maxResults; page++) {
        const results = await this.search(query, page);

        if (!results || results.length === 0) {
          console.log(`  No more results found, moving to next query`);
          break;
        }

        console.log(`  Page ${page + 1}: ${results.length} results`);
        const newPortals = this.processResults(results, query);

        if (newPortals === 0 && page > 2) {
          console.log(`  No new portals found, moving to next query`);
          break;
        }

        // Save intermediate results every 25 portals
        if (this.portals.size % 25 === 0 && this.portals.size > 0) {
          await this.saveResults();
        }

        // Rate limiting
        if (page < maxPages - 1 && this.portals.size < this.maxResults) {
          await this.sleep(this.delay);
        }
      }

      // Longer delay between queries
      if (this.portals.size < this.maxResults && queries.indexOf(query) < queries.length - 1) {
        console.log(`  Waiting before next query...`);
        await this.sleep(this.delay * 2);
      }
    }

    await this.saveResults();
    return this.getResults();
  }

  /**
   * Get results as array
   */
  getResults() {
    return Array.from(this.portals.values());
  }

  /**
   * Save results to JSON file
   */
  async saveResults() {
    const results = this.getResults();
    const outputDir = path.dirname(this.outputFile);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const data = {
      scraped_at: new Date().toISOString(),
      api_type: this.apiType,
      total_portals: results.length,
      portals: results,
      statistics: this.getStatistics(results)
    };

    fs.writeFileSync(this.outputFile, JSON.stringify(data, null, 2));
    console.log(`\n✓ Saved ${results.length} portals to ${this.outputFile}`);
  }

  /**
   * Get statistics about collected portals
   */
  getStatistics(portals) {
    const stats = {
      by_type: {},
      total: portals.length
    };

    portals.forEach(portal => {
      stats.by_type[portal.type] = (stats.by_type[portal.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Load existing results
   */
  loadExisting() {
    if (fs.existsSync(this.outputFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.outputFile, 'utf8'));
        if (data.portals && Array.isArray(data.portals)) {
          data.portals.forEach(portal => {
            this.portals.set(portal.hostname, portal);
          });
          console.log(`Loaded ${this.portals.size} existing portals from ${this.outputFile}\n`);
        }
      } catch (e) {
        console.error(`Error loading existing results: ${e.message}`);
      }
    }
  }

  /**
   * Export to CSV format
   */
  exportToCSV(filename) {
    const results = this.getResults();
    const csvPath = filename || this.outputFile.replace('.json', '.csv');

    const headers = ['subdomain', 'hostname', 'url', 'type', 'title', 'foundBy'];
    const rows = results.map(p => [
      p.subdomain,
      p.hostname,
      p.url,
      p.type,
      (p.title || '').replace(/"/g, '""'),
      p.foundBy
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    fs.writeFileSync(csvPath, csv);
    console.log(`✓ Exported to CSV: ${csvPath}`);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
API Portal Scraper - Collect Atlassian Service Portal URLs

Usage: node api-scraper.js [options]

Options:
  --api <type>          API type: serpapi, google-custom, bing (default: serpapi)
  --key <api-key>       API key (or set SEARCH_API_KEY env variable)
  --engine-id <id>      Google Custom Search Engine ID (for google-custom)
  --output <file>       Output JSON file (default: ./data/service-portals.json)
  --max <number>        Maximum portals to collect (default: 200)
  --delay <ms>          Delay between requests in ms (default: 1000)
  --csv                 Also export to CSV format
  --resume              Resume from existing results file

API Setup:
  SerpAPI:       https://serpapi.com/ (100 free searches/month)
  Google Custom: https://developers.google.com/custom-search/v1/overview
  Bing:          https://www.microsoft.com/en-us/bing/apis/bing-web-search-api

Examples:
  node api-scraper.js --api serpapi --key YOUR_KEY --max 300
  node api-scraper.js --api bing --key YOUR_KEY --output portals.json --csv
  node api-scraper.js --resume --max 500
    `);
    process.exit(0);
  }

  const options = {
    apiType: 'serpapi',
    outputFile: './data/service-portals.json',
    delay: 1000,
    maxResults: 200
  };

  let exportCSV = false;
  let resume = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--api' && args[i + 1]) {
      options.apiType = args[i + 1];
      i++;
    } else if (args[i] === '--key' && args[i + 1]) {
      options.apiKey = args[i + 1];
      i++;
    } else if (args[i] === '--engine-id' && args[i + 1]) {
      options.searchEngineId = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.outputFile = args[i + 1];
      i++;
    } else if (args[i] === '--max' && args[i + 1]) {
      options.maxResults = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--delay' && args[i + 1]) {
      options.delay = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--csv') {
      exportCSV = true;
    } else if (args[i] === '--resume') {
      resume = true;
    }
  }

  const scraper = new ApiPortalScraper(options);

  if (resume) {
    scraper.loadExisting();
  }

  scraper.scrapePortals()
    .then(() => {
      console.log(`\n${'='.repeat(60)}`);
      console.log('✓ Scraping completed!');
      console.log(`Total portals: ${scraper.portals.size}`);

      const stats = scraper.getStatistics(scraper.getResults());
      console.log('\nPortal Types:');
      Object.entries(stats.by_type).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      console.log(`${'='.repeat(60)}\n`);

      if (exportCSV) {
        scraper.exportToCSV();
      }
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}

module.exports = ApiPortalScraper;
