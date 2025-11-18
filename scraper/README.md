# Atlassian Portal Scraper

This scraper helps find Atlassian user portal pages on Google to identify potential leads.

## Features

- Scrapes Google search results for Atlassian portals
- Supports up to 1000 results with pagination
- Two scraping methods: Direct scraping or Google Custom Search API
- Exports results in JSON and CSV formats
- Built-in analysis of domains and portal types
- Rate limiting to avoid being blocked
- Duplicate removal

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your search query in `google-scraper.js`:
   ```javascript
   searchQuery: 'site:atlassian.net OR inurl:atlassian.net OR "powered by atlassian"'
   ```

   **Note:** Update this query based on the how-to-sell document instructions.

3. (Optional) For using Google Custom Search API:
   - Create a Custom Search Engine at https://programmablesearchengine.google.com/
   - Get an API key from https://console.cloud.google.com/
   - Set environment variables:
     ```bash
     export GOOGLE_API_KEY=your_api_key
     export GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
     ```
   - Update `CONFIG.method = 'api'` in the scraper

## Usage

### Quick Start

Run the scraper:
```bash
npm run scrape
```

Or directly:
```bash
node scraper/google-scraper.js
```

### Configuration

Edit the `CONFIG` object in `google-scraper.js`:

```javascript
const CONFIG = {
  // Search query - customize based on your needs
  searchQuery: 'site:atlassian.net OR inurl:atlassian.net',

  // Number of results to scrape
  targetResults: 1000,

  // Results per page (Google shows 10)
  resultsPerPage: 10,

  // Delay between requests (milliseconds)
  requestDelay: 2000,

  // Output file path
  outputFile: path.join(__dirname, 'atlassian_portals.json'),

  // Scraping method: 'direct' or 'api'
  method: 'direct'
};
```

## Output Files

The scraper generates three files:

1. **atlassian_portals.json** - Full results with metadata
   ```json
   {
     "metadata": {
       "searchQuery": "...",
       "totalResults": 1000,
       "scrapedAt": "2024-01-15T10:30:00.000Z"
     },
     "results": [
       {
         "title": "Company JIRA Portal",
         "url": "https://company.atlassian.net",
         "snippet": "...",
         "scrapedAt": "2024-01-15T10:30:00.000Z"
       }
     ]
   }
   ```

2. **atlassian_portals.csv** - CSV format for spreadsheet import
   ```
   Title,URL,Snippet,Scraped At
   "Company JIRA","https://company.atlassian.net","...","2024-01-15T10:30:00.000Z"
   ```

3. **atlassian_portals_analysis.json** - Domain analysis and statistics
   ```json
   {
     "totalResults": 1000,
     "uniqueDomains": 450,
     "topDomains": [
       ["company.atlassian.net", 25],
       ["another.atlassian.net", 18]
     ],
     "atlassianPortals": 876
   }
   ```

## Search Query Examples

Customize the search query based on what you're looking for:

### Find Atlassian-hosted sites
```javascript
searchQuery: 'site:atlassian.net'
```

### Find sites with Atlassian in the URL
```javascript
searchQuery: 'inurl:atlassian.net OR inurl:/jira/ OR inurl:/servicedesk/'
```

### Find sites powered by Atlassian
```javascript
searchQuery: '"powered by atlassian" OR "powered by jira" OR "powered by confluence"'
```

### Find Atlassian service desks
```javascript
searchQuery: 'site:atlassian.net "service desk" OR "support portal"'
```

### Combined search
```javascript
searchQuery: '(site:atlassian.net OR inurl:atlassian.net) AND ("service desk" OR "support" OR "jira")'
```

## Scraping Methods

### 1. Direct Scraping (Default)
- Scrapes Google search results directly
- Free but may hit rate limits
- Use with caution to avoid IP blocking
- Includes delays between requests

**Pros:**
- No API key needed
- Free to use

**Cons:**
- May violate Google's Terms of Service
- Risk of IP blocking
- Less reliable
- CAPTCHA challenges

### 2. Google Custom Search API
- Uses official Google API
- More reliable and stable
- Requires API key and setup
- Free tier: 100 queries/day

**Pros:**
- Official API, no ToS violations
- More reliable
- Better rate limits
- No CAPTCHA

**Cons:**
- Requires API key
- Limited free tier (100 queries/day)
- May need paid plan for 1000 results

## Rate Limiting

To avoid being blocked:

1. **Increase delay between requests:**
   ```javascript
   requestDelay: 5000  // 5 seconds
   ```

2. **Use rotating proxies** (advanced)

3. **Use Google Custom Search API**

4. **Run in batches:**
   ```javascript
   targetResults: 100  // Run multiple times
   ```

## Best Practices

1. **Respect rate limits** - Don't scrape too aggressively
2. **Use API when possible** - More reliable and legal
3. **Save results incrementally** - Don't lose data if interrupted
4. **Review results manually** - Automated scraping may miss context
5. **Update search queries** - Based on findings from the how-to-sell document

## Troubleshooting

### No results found
- Check your search query
- Verify internet connection
- Try using Google Custom Search API instead
- Reduce targetResults to test

### Rate limiting / IP blocked
- Increase `requestDelay`
- Use a VPN or proxy
- Switch to Google Custom Search API
- Wait a few hours before retrying

### Error: "Google API credentials not configured"
- Set GOOGLE_API_KEY environment variable
- Set GOOGLE_SEARCH_ENGINE_ID environment variable
- Or change `method` back to 'direct'

## Legal Notice

**Important:** Web scraping may violate Terms of Service. Always:
- Check the website's robots.txt
- Review Terms of Service
- Consider using official APIs when available
- Respect rate limits and robots.txt
- Use scraped data ethically and legally

The Google Custom Search API is the recommended approach for compliance with Google's Terms of Service.

## Next Steps

1. Update the search query based on the how-to-sell document
2. Run the scraper to collect portal URLs
3. Review and analyze the results
4. Filter for high-quality leads
5. Export to your CRM or sales tools

## Support

For issues or questions:
- Review the configuration section
- Check the troubleshooting guide
- Ensure dependencies are installed
- Verify your search query syntax
