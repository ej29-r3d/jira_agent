#!/usr/bin/env node

/**
 * Simple CLI wrapper for portal scraping
 * Provides an easy interface to both web and API scrapers
 */

const path = require('path');
const fs = require('fs');

// Load environment variables if .env exists
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         Atlassian Service Portal Scraper                      ║
╚═══════════════════════════════════════════════════════════════╝

Collect hundreds of Atlassian service portal URLs

USAGE:
  node scrape.js [mode] [options]

MODES:
  web                  Web scraping (no API key required)
  api                  API-based scraping (requires API key)
  help                 Show this help

WEB MODE (No API Key):
  node scrape.js web --max 200

  Options:
    --max <number>     Maximum portals (default: 200)
    --delay <ms>       Delay between requests (default: 3000)
    --output <file>    Output file (default: ./data/service-portals.json)

API MODE (Recommended):
  node scrape.js api --provider serpapi --max 500

  Options:
    --provider <type>  serpapi, google, bing (default: serpapi)
    --key <key>        API key (or use SEARCH_API_KEY env var)
    --max <number>     Maximum portals (default: 200)
    --delay <ms>       Delay between requests (default: 1000)
    --output <file>    Output file (default: ./data/service-portals.json)
    --csv              Also export to CSV
    --resume           Resume from existing results

QUICK START:

1. No API Key (Free but slower):
   node scrape.js web --max 150

2. With SerpAPI (Recommended):
   node scrape.js api --provider serpapi --key YOUR_KEY --max 500

3. Resume interrupted scraping:
   node scrape.js api --provider serpapi --resume --max 1000

API SETUP:
  • SerpAPI: https://serpapi.com/ (100 free/month)
  • Google:  https://developers.google.com/custom-search/v1/overview
  • Bing:    https://azure.microsoft.com/services/cognitive-services/

ENVIRONMENT VARIABLES:
  SEARCH_API_KEY             Your API key
  GOOGLE_SEARCH_ENGINE_ID    Google Custom Search Engine ID
  MAX_PORTALS                Default max portals
  OUTPUT_FILE                Default output file

EXAMPLES:
  # Quick start with web scraping
  node scrape.js web

  # API scraping with all options
  node scrape.js api --provider serpapi --key abc123 --max 500 --csv

  # Resume from where you left off
  node scrape.js api --resume --max 1000

For more details, see README.md
`);
}

function parseOptions(args) {
  const options = {
    maxResults: parseInt(process.env.MAX_PORTALS) || 200,
    outputFile: process.env.OUTPUT_FILE || './data/service-portals.json',
    delay: 1000,
    apiKey: process.env.SEARCH_API_KEY,
    searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
    apiType: 'serpapi',
    csv: false,
    resume: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--max':
        options.maxResults = parseInt(args[++i]);
        break;
      case '--delay':
        options.delay = parseInt(args[++i]);
        break;
      case '--output':
        options.outputFile = args[++i];
        break;
      case '--key':
        options.apiKey = args[++i];
        break;
      case '--provider':
        const provider = args[++i];
        options.apiType = provider === 'google' ? 'google-custom' : provider;
        break;
      case '--csv':
        options.csv = true;
        break;
      case '--resume':
        options.resume = true;
        break;
    }
  }

  return options;
}

async function runWebScraper(options) {
  console.log('Starting web scraper (no API key required)...\n');

  const PortalScraper = require('./portal-scraper');
  const scraper = new PortalScraper(options);

  if (options.resume) {
    scraper.loadExisting();
  }

  try {
    await scraper.scrapePortals();
    console.log('\n✓ Web scraping completed!');
    console.log(`Total portals: ${scraper.portals.size}`);
    console.log(`Saved to: ${options.outputFile}`);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

async function runApiScraper(options) {
  if (!options.apiKey) {
    console.error(`
❌ Error: API key required for API mode

Please provide an API key using one of these methods:
  1. Command line: --key YOUR_API_KEY
  2. Environment variable: SEARCH_API_KEY=YOUR_API_KEY
  3. .env file: Add SEARCH_API_KEY=YOUR_API_KEY

Get a free API key:
  • SerpAPI: https://serpapi.com/ (100 free/month)
  • Google:  https://developers.google.com/custom-search/v1/overview
  • Bing:    https://azure.microsoft.com/services/cognitive-services/

Example: node scrape.js api --provider serpapi --key YOUR_KEY
`);
    process.exit(1);
  }

  console.log(`Starting API scraper (${options.apiType})...\n`);

  const ApiPortalScraper = require('./api-scraper');
  const scraper = new ApiPortalScraper(options);

  if (options.resume) {
    scraper.loadExisting();
  }

  try {
    await scraper.scrapePortals();

    console.log('\n✓ API scraping completed!');
    console.log(`Total portals: ${scraper.portals.size}`);
    console.log(`Saved to: ${options.outputFile}`);

    if (options.csv) {
      scraper.exportToCSV();
    }

    // Show statistics
    const stats = scraper.getStatistics(scraper.getResults());
    console.log('\nPortal Types:');
    Object.entries(stats.by_type).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error Details:', error.response.data);
    }
    process.exit(1);
  }
}

// Main execution
async function main() {
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const mode = args[0];
  const modeArgs = args.slice(1);
  const options = parseOptions(modeArgs);

  switch (mode) {
    case 'web':
      options.delay = options.delay || 3000; // Higher delay for web scraping
      await runWebScraper(options);
      break;

    case 'api':
      await runApiScraper(options);
      break;

    default:
      console.error(`Unknown mode: ${mode}`);
      console.error('Use "web", "api", or "help"');
      process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
