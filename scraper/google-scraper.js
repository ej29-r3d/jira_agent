/**
 * Google Search Scraper for Atlassian User Portals
 *
 * This script scrapes Google search results to find Atlassian user portal pages.
 * It supports multiple scraping methods and can collect up to 1000 results.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  // Default search query - UPDATE THIS based on how-to-sell document
  searchQuery: 'site:atlassian.net OR inurl:atlassian.net OR "powered by atlassian"',

  // Number of results to scrape
  targetResults: 1000,

  // Results per page (Google typically shows 10)
  resultsPerPage: 10,

  // Delay between requests (milliseconds) to avoid rate limiting
  requestDelay: 2000,

  // Output file
  outputFile: path.join(__dirname, 'atlassian_portals.json'),

  // User agent to mimic a real browser
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // Method to use: 'direct' or 'api'
  method: 'direct', // Change to 'api' if using Google Custom Search API

  // Google Custom Search API credentials (if using API method)
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID || '',
};

/**
 * Sleep function for delays between requests
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scrape Google search results directly (may violate Google's ToS)
 */
async function scrapeGoogleDirect(query, startIndex) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${startIndex}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Parse search results
    // Google's HTML structure can change, so this may need updates
    $('div.g').each((i, element) => {
      const titleElement = $(element).find('h3').first();
      const linkElement = $(element).find('a').first();
      const snippetElement = $(element).find('div.VwiC3b').first();

      const title = titleElement.text().trim();
      const link = linkElement.attr('href');
      const snippet = snippetElement.text().trim();

      if (title && link && link.startsWith('http')) {
        results.push({
          title,
          url: link,
          snippet,
          scrapedAt: new Date().toISOString()
        });
      }
    });

    return results;
  } catch (error) {
    console.error(`Error scraping page at index ${startIndex}:`, error.message);
    return [];
  }
}

/**
 * Use Google Custom Search API (requires API key)
 */
async function scrapeGoogleAPI(query, startIndex) {
  try {
    if (!CONFIG.googleApiKey || !CONFIG.googleSearchEngineId) {
      throw new Error('Google API credentials not configured');
    }

    const url = 'https://www.googleapis.com/customsearch/v1';
    const params = {
      key: CONFIG.googleApiKey,
      cx: CONFIG.googleSearchEngineId,
      q: query,
      start: startIndex,
      num: 10 // Max 10 results per request
    };

    const response = await axios.get(url, { params });
    const results = response.data.items || [];

    return results.map(item => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      scrapedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Error using Google API at index ${startIndex}:`, error.message);
    return [];
  }
}

/**
 * Main scraping function
 */
async function scrapeAtlassianPortals() {
  console.log('Starting Atlassian Portal Scraper...');
  console.log(`Search Query: ${CONFIG.searchQuery}`);
  console.log(`Target Results: ${CONFIG.targetResults}`);
  console.log(`Method: ${CONFIG.method}`);
  console.log('---');

  const allResults = [];
  const totalPages = Math.ceil(CONFIG.targetResults / CONFIG.resultsPerPage);
  let consecutiveEmptyPages = 0;

  for (let page = 0; page < totalPages; page++) {
    const startIndex = page * CONFIG.resultsPerPage;
    console.log(`Scraping page ${page + 1}/${totalPages} (results ${startIndex + 1}-${startIndex + CONFIG.resultsPerPage})...`);

    let results = [];

    if (CONFIG.method === 'api') {
      results = await scrapeGoogleAPI(CONFIG.searchQuery, startIndex);
    } else {
      results = await scrapeGoogleDirect(CONFIG.searchQuery, startIndex);
    }

    if (results.length === 0) {
      consecutiveEmptyPages++;
      console.log(`  No results found on this page (${consecutiveEmptyPages} consecutive empty pages)`);

      // Stop if we get 3 consecutive empty pages
      if (consecutiveEmptyPages >= 3) {
        console.log('  Stopping: Too many consecutive empty pages');
        break;
      }
    } else {
      consecutiveEmptyPages = 0;
      console.log(`  Found ${results.length} results`);
      allResults.push(...results);
    }

    // Stop if we've reached our target
    if (allResults.length >= CONFIG.targetResults) {
      console.log(`\nReached target of ${CONFIG.targetResults} results!`);
      break;
    }

    // Delay before next request to avoid rate limiting
    if (page < totalPages - 1) {
      console.log(`  Waiting ${CONFIG.requestDelay / 1000} seconds before next request...`);
      await sleep(CONFIG.requestDelay);
    }
  }

  // Remove duplicates based on URL
  const uniqueResults = Array.from(
    new Map(allResults.map(item => [item.url, item])).values()
  );

  console.log('\n---');
  console.log(`Total results scraped: ${allResults.length}`);
  console.log(`Unique results: ${uniqueResults.length}`);

  // Save results
  await saveResults(uniqueResults);

  return uniqueResults;
}

/**
 * Save results to JSON file
 */
async function saveResults(results) {
  try {
    const output = {
      metadata: {
        searchQuery: CONFIG.searchQuery,
        totalResults: results.length,
        scrapedAt: new Date().toISOString(),
        method: CONFIG.method
      },
      results: results
    };

    await fs.writeFile(
      CONFIG.outputFile,
      JSON.stringify(output, null, 2),
      'utf8'
    );

    console.log(`\nResults saved to: ${CONFIG.outputFile}`);

    // Also save a CSV version for easy viewing
    await saveResultsAsCSV(results);
  } catch (error) {
    console.error('Error saving results:', error.message);
  }
}

/**
 * Save results as CSV
 */
async function saveResultsAsCSV(results) {
  try {
    const csvFile = CONFIG.outputFile.replace('.json', '.csv');
    const header = 'Title,URL,Snippet,Scraped At\n';
    const rows = results.map(r =>
      `"${r.title.replace(/"/g, '""')}","${r.url}","${r.snippet.replace(/"/g, '""')}","${r.scrapedAt}"`
    ).join('\n');

    await fs.writeFile(csvFile, header + rows, 'utf8');
    console.log(`CSV saved to: ${csvFile}`);
  } catch (error) {
    console.error('Error saving CSV:', error.message);
  }
}

/**
 * Analyze results to extract Atlassian portal information
 */
async function analyzeResults(results) {
  console.log('\n=== Analysis ===');

  // Extract domain patterns
  const domains = new Map();
  results.forEach(result => {
    try {
      const url = new URL(result.url);
      const domain = url.hostname;
      domains.set(domain, (domains.get(domain) || 0) + 1);
    } catch (e) {
      // Invalid URL
    }
  });

  console.log('\nTop domains found:');
  const sortedDomains = Array.from(domains.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  sortedDomains.forEach(([domain, count]) => {
    console.log(`  ${domain}: ${count} pages`);
  });

  // Find Atlassian-specific portals
  const atlassianPortals = results.filter(r =>
    r.url.includes('.atlassian.net')
  );

  console.log(`\nAtlassian.net portals found: ${atlassianPortals.length}`);

  // Save analysis
  const analysisFile = CONFIG.outputFile.replace('.json', '_analysis.json');
  await fs.writeFile(
    analysisFile,
    JSON.stringify({
      totalResults: results.length,
      uniqueDomains: domains.size,
      topDomains: sortedDomains,
      atlassianPortals: atlassianPortals.length,
      analyzedAt: new Date().toISOString()
    }, null, 2),
    'utf8'
  );
  console.log(`Analysis saved to: ${analysisFile}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('ATLASSIAN PORTAL SCRAPER');
    console.log('='.repeat(60));
    console.log();

    const results = await scrapeAtlassianPortals();

    if (results.length > 0) {
      await analyzeResults(results);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Scraping completed!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  scrapeAtlassianPortals,
  CONFIG
};
