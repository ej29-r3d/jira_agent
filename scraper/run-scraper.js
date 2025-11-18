#!/usr/bin/env node

/**
 * Interactive runner for the Atlassian Portal Scraper
 *
 * Provides an easy-to-use interface for running scrapes with different strategies
 */

const { scrapeAtlassianPortals, CONFIG } = require('./google-scraper');
const strategies = require('./search-strategies');

// Parse command line arguments
const args = process.argv.slice(2);

function printUsage() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║          Atlassian Portal Scraper - Interactive Runner         ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
  node run-scraper.js [strategy] [options]

STRATEGIES:
  You can use predefined search strategies or provide a custom query.

  Predefined strategies:
${strategies.getStrategyNames().map((name, i) => `    ${i + 1}. ${name}`).join('\n')}

  Or use 'custom' to provide your own search query.

OPTIONS:
  --query "custom query"    Custom search query
  --results N               Number of results (default: 1000)
  --delay N                 Delay between requests in ms (default: 2000)
  --method [direct|api]     Scraping method (default: direct)
  --output filename         Output filename (default: atlassian_portals)
  --list-strategies         Show all available strategies
  --help                    Show this help message

EXAMPLES:

  1. Use the comprehensive strategy:
     node run-scraper.js comprehensive

  2. Find only service desks with 500 results:
     node run-scraper.js serviceDesks --results 500

  3. Custom query:
     node run-scraper.js custom --query "site:atlassian.net support"

  4. Use API method with longer delay:
     node run-scraper.js atlassianHosted --method api --delay 3000

  5. List all strategies:
     node run-scraper.js --list-strategies

QUICK START:
  node run-scraper.js comprehensive

  This will run the comprehensive search strategy to find 1000 Atlassian portals.

`);
}

function parseArgs(args) {
  const options = {
    strategy: null,
    customQuery: null,
    results: 1000,
    delay: 2000,
    method: 'direct',
    output: 'atlassian_portals',
    listStrategies: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--list-strategies') {
      options.listStrategies = true;
    } else if (arg === '--query') {
      options.customQuery = args[++i];
    } else if (arg === '--results') {
      options.results = parseInt(args[++i], 10);
    } else if (arg === '--delay') {
      options.delay = parseInt(args[++i], 10);
    } else if (arg === '--method') {
      options.method = args[++i];
    } else if (arg === '--output') {
      options.output = args[++i];
    } else if (!arg.startsWith('--') && !options.strategy) {
      options.strategy = arg;
    }
  }

  return options;
}

async function runWithStrategy(strategyKey, options) {
  const strategy = strategies.getStrategy(strategyKey);

  if (!strategy) {
    console.error(`Error: Unknown strategy '${strategyKey}'`);
    console.log('\nAvailable strategies:');
    strategies.getStrategyNames().forEach((name, i) => {
      console.log(`  ${i + 1}. ${name}`);
    });
    process.exit(1);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Using Strategy: ${strategy.name}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Description: ${strategy.description}`);
  console.log(`Query: ${strategy.query}`);
  console.log(`Expected Results: ${strategy.expectedResults}`);
  console.log(`${'='.repeat(70)}\n`);

  // Update CONFIG
  CONFIG.searchQuery = strategy.query;
  CONFIG.targetResults = options.results;
  CONFIG.requestDelay = options.delay;
  CONFIG.method = options.method;
  CONFIG.outputFile = require('path').join(__dirname, `${options.output}.json`);

  await scrapeAtlassianPortals();
}

async function runWithCustomQuery(query, options) {
  console.log(`\n${'='.repeat(70)}`);
  console.log('Using Custom Query');
  console.log(`${'='.repeat(70)}`);
  console.log(`Query: ${query}`);
  console.log(`${'='.repeat(70)}\n`);

  // Update CONFIG
  CONFIG.searchQuery = query;
  CONFIG.targetResults = options.results;
  CONFIG.requestDelay = options.delay;
  CONFIG.method = options.method;
  CONFIG.outputFile = require('path').join(__dirname, `${options.output}.json`);

  await scrapeAtlassianPortals();
}

async function main() {
  const options = parseArgs(args);

  if (options.help || args.length === 0) {
    printUsage();
    process.exit(0);
  }

  if (options.listStrategies) {
    strategies.printStrategies();
    process.exit(0);
  }

  try {
    if (options.customQuery) {
      await runWithCustomQuery(options.customQuery, options);
    } else if (options.strategy === 'custom') {
      console.error('Error: --query required when using custom strategy');
      console.log('Example: node run-scraper.js custom --query "site:atlassian.net"');
      process.exit(1);
    } else if (options.strategy) {
      await runWithStrategy(options.strategy, options);
    } else {
      console.error('Error: No strategy specified');
      printUsage();
      process.exit(1);
    }
  } catch (error) {
    console.error('\nFatal error:', error.message);
    process.exit(1);
  }
}

// Run
main();
