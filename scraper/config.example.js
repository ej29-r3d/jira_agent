/**
 * Configuration Template for Atlassian Portal Scraper
 *
 * Copy this file to config.js and customize for your needs.
 * You can also modify CONFIG directly in google-scraper.js
 */

module.exports = {
  // ============================================================
  // SEARCH CONFIGURATION
  // ============================================================

  /**
   * Google search query to find Atlassian portals
   *
   * UPDATE THIS based on the how-to-sell document instructions!
   *
   * Examples:
   * - 'site:atlassian.net'
   * - 'inurl:atlassian.net OR inurl:/jira/'
   * - '"powered by atlassian" OR "jira service desk"'
   * - '(site:atlassian.net) AND ("service desk" OR "support")'
   */
  searchQuery: 'site:atlassian.net OR inurl:atlassian.net OR "powered by atlassian"',

  // ============================================================
  // SCRAPING LIMITS
  // ============================================================

  /**
   * Target number of results to scrape
   * Google Custom Search API free tier: 100 queries/day
   * For 1000 results, you may need direct scraping or paid API
   */
  targetResults: 1000,

  /**
   * Results per page (Google typically shows 10)
   * Don't change this unless you know what you're doing
   */
  resultsPerPage: 10,

  // ============================================================
  // RATE LIMITING
  // ============================================================

  /**
   * Delay between requests in milliseconds
   * Recommended:
   * - Direct scraping: 2000-5000ms (2-5 seconds)
   * - API: 1000ms (1 second)
   *
   * Increase if you get rate limited or blocked
   */
  requestDelay: 2000,

  // ============================================================
  // SCRAPING METHOD
  // ============================================================

  /**
   * Scraping method to use:
   * - 'direct': Scrape Google directly (may violate ToS, risk of blocking)
   * - 'api': Use Google Custom Search API (requires setup, more reliable)
   *
   * For 1000 results, 'direct' is more practical due to API limits
   */
  method: 'direct', // 'direct' or 'api'

  // ============================================================
  // GOOGLE CUSTOM SEARCH API (if using method: 'api')
  // ============================================================

  /**
   * Google Custom Search API Key
   * Get one at: https://console.cloud.google.com/
   * Or set environment variable: GOOGLE_API_KEY
   */
  googleApiKey: process.env.GOOGLE_API_KEY || '',

  /**
   * Google Custom Search Engine ID
   * Create one at: https://programmablesearchengine.google.com/
   * Or set environment variable: GOOGLE_SEARCH_ENGINE_ID
   */
  googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID || '',

  // ============================================================
  // OUTPUT FILES
  // ============================================================

  /**
   * Output directory for results
   * Leave as __dirname to save in scraper folder
   */
  outputDir: __dirname,

  /**
   * Output filename (without extension)
   * Will generate .json, .csv, and _analysis.json files
   */
  outputFilename: 'atlassian_portals',

  // ============================================================
  // HTTP HEADERS
  // ============================================================

  /**
   * User agent to use for requests
   * Mimics a real browser to avoid detection
   */
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // ============================================================
  // ADVANCED OPTIONS
  // ============================================================

  /**
   * Request timeout in milliseconds
   */
  timeout: 10000,

  /**
   * Maximum consecutive empty pages before stopping
   * If N pages in a row return no results, the scraper will stop
   */
  maxConsecutiveEmptyPages: 3,

  /**
   * Enable verbose logging
   */
  verbose: true,

  /**
   * Save results incrementally (after each page)
   * Useful for long-running scrapes to avoid data loss
   */
  incrementalSave: false,
};
