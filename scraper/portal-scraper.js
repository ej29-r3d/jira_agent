const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Service Portal Scraper
 * Collects Atlassian service portal URLs from search results
 */

class PortalScraper {
  constructor(options = {}) {
    this.outputFile = options.outputFile || './data/service-portals.json';
    this.delay = options.delay || 2000; // Delay between requests (ms)
    this.maxResults = options.maxResults || 200;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.portals = new Set();
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract URLs from Google search results page
   */
  extractUrlsFromHTML(html) {
    const urls = [];

    // Pattern to match Atlassian URLs in search results
    // Google wraps URLs in various ways, we need to extract the actual destination
    const urlPatterns = [
      /https?:\/\/[a-zA-Z0-9-]+\.atlassian\.net\/servicedesk\/[^\s"<>]*/g,
      /https?:\/\/[a-zA-Z0-9-]+\.atlassian\.net\/jira\/servicedesk\/[^\s"<>]*/g,
      /https?:\/\/[a-zA-Z0-9-]+\.atlassian\.net\/servicemanagement\/[^\s"<>]*/g,
    ];

    for (const pattern of urlPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        urls.push(...matches);
      }
    }

    // Also look for URLs in href attributes
    const hrefPattern = /href="(https?:\/\/[a-zA-Z0-9-]+\.atlassian\.net\/(?:servicedesk|jira\/servicedesk|servicemanagement)\/[^"]*)"/g;
    let match;
    while ((match = hrefPattern.exec(html)) !== null) {
      urls.push(match[1]);
    }

    return [...new Set(urls)]; // Remove duplicates
  }

  /**
   * Clean and validate portal URL
   */
  cleanPortalUrl(url) {
    try {
      // Remove query parameters and fragments, keep just the base portal URL
      const urlObj = new URL(url);

      // Extract the subdomain (organization name)
      const subdomain = urlObj.hostname.split('.')[0];

      // Build a clean portal URL
      let cleanUrl = `${urlObj.protocol}//${urlObj.hostname}`;

      // Keep the path if it's a service desk path
      if (urlObj.pathname.includes('/servicedesk') ||
          urlObj.pathname.includes('/servicemanagement')) {
        cleanUrl += urlObj.pathname.split('?')[0];
      }

      return {
        url: cleanUrl,
        subdomain: subdomain,
        hostname: urlObj.hostname,
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
    if (url.includes('/servicedesk/customer')) return 'customer-portal';
    if (url.includes('/servicemanagement')) return 'service-management';
    if (url.includes('/servicedesk')) return 'service-desk';
    return 'unknown';
  }

  /**
   * Search Google using a custom query
   */
  async searchGoogle(query, startIndex = 0) {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.google.com/search?q=${encodedQuery}&start=${startIndex}&num=10`;

    try {
      console.log(`Searching: ${query} (start: ${startIndex})`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error(`Error searching Google: ${error.message}`);
      return null;
    }
  }

  /**
   * Search using DuckDuckGo HTML interface
   */
  async searchDuckDuckGo(query) {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    try {
      console.log(`Searching DuckDuckGo: ${query}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: 10000
      });

      return this.extractUrlsFromHTML(response.data);
    } catch (error) {
      console.error(`Error searching DuckDuckGo: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape portals using multiple search queries
   */
  async scrapePortals(queries = []) {
    const defaultQueries = [
      'site:atlassian.net "customer portal"',
      'site:atlassian.net "service desk"',
      'site:atlassian.net inurl:servicedesk',
      'site:atlassian.net "request help"',
      'site:atlassian.net "submit a request"',
    ];

    const searchQueries = queries.length > 0 ? queries : defaultQueries;

    console.log(`Starting scraper with ${searchQueries.length} queries...`);
    console.log(`Target: ${this.maxResults} portals\n`);

    for (const query of searchQueries) {
      if (this.portals.size >= this.maxResults) {
        console.log(`Reached target of ${this.maxResults} portals`);
        break;
      }

      // Try multiple pages for each query
      for (let page = 0; page < 10 && this.portals.size < this.maxResults; page++) {
        const html = await this.searchGoogle(query, page * 10);

        if (!html) {
          console.log(`Skipping to next query due to error`);
          break;
        }

        const urls = this.extractUrlsFromHTML(html);
        console.log(`Found ${urls.length} URLs in this page`);

        for (const url of urls) {
          const cleaned = this.cleanPortalUrl(url);
          if (cleaned) {
            const key = cleaned.hostname + cleaned.url.split(cleaned.hostname)[1];
            if (!this.portals.has(key)) {
              this.portals.add(key);
              console.log(`  ✓ Added: ${cleaned.subdomain} (${cleaned.type}) - Total: ${this.portals.size}`);
            }
          }
        }

        // Save intermediate results
        if (this.portals.size % 20 === 0) {
          await this.saveResults();
        }

        // Be polite - wait between requests
        if (page < 9 && this.portals.size < this.maxResults) {
          console.log(`Waiting ${this.delay/1000}s before next request...`);
          await this.sleep(this.delay);
        }
      }

      // Longer wait between different queries
      if (this.portals.size < this.maxResults) {
        console.log(`\nCompleted query. Waiting ${this.delay*2/1000}s before next query...\n`);
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
    return Array.from(this.portals).map(key => {
      const url = key.includes('://') ? key : 'https://' + key;
      const cleaned = this.cleanPortalUrl(url);
      return cleaned;
    });
  }

  /**
   * Save results to JSON file
   */
  async saveResults() {
    const results = this.getResults();
    const outputDir = path.dirname(this.outputFile);

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const data = {
      scraped_at: new Date().toISOString(),
      total_portals: results.length,
      portals: results
    };

    fs.writeFileSync(this.outputFile, JSON.stringify(data, null, 2));
    console.log(`\n✓ Saved ${results.length} portals to ${this.outputFile}`);
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
            const key = portal.hostname + (portal.url.split(portal.hostname)[1] || '');
            this.portals.add(key);
          });
          console.log(`Loaded ${this.portals.size} existing portals from ${this.outputFile}`);
        }
      } catch (e) {
        console.error(`Error loading existing results: ${e.message}`);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  const options = {
    outputFile: './data/service-portals.json',
    delay: 3000, // 3 seconds between requests
    maxResults: 200
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      options.outputFile = args[i + 1];
      i++;
    } else if (args[i] === '--delay' && args[i + 1]) {
      options.delay = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--max' && args[i + 1]) {
      options.maxResults = parseInt(args[i + 1]);
      i++;
    }
  }

  const scraper = new PortalScraper(options);

  // Load existing results to avoid duplicates
  scraper.loadExisting();

  scraper.scrapePortals()
    .then(() => {
      console.log('\n✓ Scraping completed!');
      console.log(`Total portals collected: ${scraper.portals.size}`);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = PortalScraper;
