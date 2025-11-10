# Atlassian Service Portal Scraper

A comprehensive toolkit for discovering and collecting Atlassian service portal URLs at scale. Supports both web scraping and API-based search methods.

## Overview

This scraper helps you collect hundreds of publicly accessible Atlassian service portals (`.atlassian.net` domains) that organizations use for customer support and service management.

## Features

- **Two scraping methods**: Web scraping and API-based searching
- **Multiple search APIs**: SerpAPI, Google Custom Search, Bing Search API
- **Smart deduplication**: Automatically removes duplicate portals
- **Resume capability**: Continue from where you left off
- **Rate limiting**: Respects rate limits to avoid blocking
- **Multiple output formats**: JSON and CSV
- **Portal classification**: Automatically categorizes portal types
- **Statistics**: Get insights about collected portals

## Quick Start

### Method 1: Web Scraping (No API Key Required)

```bash
# Basic usage - scrapes Google search results
node portal-scraper.js

# Custom settings
node portal-scraper.js --max 300 --delay 3000 --output my-portals.json
```

**Pros**: No API key needed, completely free
**Cons**: Slower, may get rate limited, limited to ~100-200 results

### Method 2: API-Based Scraping (Recommended)

```bash
# Using SerpAPI (100 free searches/month)
node api-scraper.js --api serpapi --key YOUR_API_KEY --max 500

# Using Google Custom Search
node api-scraper.js --api google-custom --key YOUR_KEY --engine-id YOUR_ENGINE_ID

# Using Bing Search API
node api-scraper.js --api bing --key YOUR_KEY --max 1000
```

**Pros**: Fast, reliable, can get 500+ results easily
**Cons**: Requires API key (but most have free tiers)

## Installation

```bash
cd scraper
npm install axios
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# For API-based scraping
SEARCH_API_KEY=your_serpapi_or_google_or_bing_key
GOOGLE_SEARCH_ENGINE_ID=your_google_custom_search_engine_id
```

### API Setup

#### SerpAPI (Recommended - Easiest)

1. Sign up at https://serpapi.com/
2. Get 100 free searches/month
3. Copy your API key
4. Use: `--api serpapi --key YOUR_KEY`

#### Google Custom Search API

1. Go to https://developers.google.com/custom-search/v1/overview
2. Create a project and enable Custom Search API
3. Get API key from Google Cloud Console
4. Create a Custom Search Engine at https://programmablesearchengine.google.com/
5. Get your Search Engine ID
6. Use: `--api google-custom --key YOUR_KEY --engine-id YOUR_ENGINE_ID`

Note: 100 free searches/day, then $5 per 1000 queries

#### Bing Search API

1. Go to https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
2. Sign up for Azure account
3. Create a Bing Search resource
4. Get your API key
5. Use: `--api bing --key YOUR_KEY`

Note: Free tier includes 1000 searches/month

## Usage Examples

### Basic Scraping

```bash
# Start fresh with API scraper (recommended)
node api-scraper.js --api serpapi --key abc123 --max 200

# Resume from existing results
node api-scraper.js --api serpapi --key abc123 --max 500 --resume

# Export to both JSON and CSV
node api-scraper.js --api serpapi --key abc123 --csv
```

### Advanced Usage

```bash
# Custom output location
node api-scraper.js \
  --api serpapi \
  --key abc123 \
  --output ./my-data/portals.json \
  --max 1000 \
  --delay 500

# Use web scraper with custom settings
node portal-scraper.js \
  --output portals-web.json \
  --max 150 \
  --delay 4000
```

### Using as Module

```javascript
const ApiPortalScraper = require('./api-scraper');

const scraper = new ApiPortalScraper({
  apiType: 'serpapi',
  apiKey: 'your-key',
  maxResults: 500,
  outputFile: './data/portals.json'
});

// Load existing results to continue
scraper.loadExisting();

// Start scraping
scraper.scrapePortals()
  .then(() => {
    console.log('Done!');
    console.log('Total:', scraper.portals.size);

    // Export to CSV
    scraper.exportToCSV();
  });
```

### Custom Search Queries

```javascript
const scraper = new ApiPortalScraper({
  apiType: 'serpapi',
  apiKey: process.env.SEARCH_API_KEY
});

// Use your own search queries
const customQueries = [
  'site:atlassian.net "customer portal"',
  'site:atlassian.net "IT help desk"',
  'site:atlassian.net inurl:servicedesk',
  // Add more queries
];

scraper.scrapePortals(customQueries);
```

## Output Format

### JSON Output

```json
{
  "scraped_at": "2025-11-10T12:34:56.789Z",
  "api_type": "serpapi",
  "total_portals": 247,
  "portals": [
    {
      "url": "https://acme.atlassian.net/servicedesk/customer/portal/1",
      "baseUrl": "https://acme.atlassian.net",
      "subdomain": "acme",
      "hostname": "acme.atlassian.net",
      "path": "/servicedesk/customer/portal/1",
      "type": "customer-portal",
      "title": "Acme Corp - Customer Support Portal",
      "snippet": "Submit requests and get help...",
      "foundBy": "site:atlassian.net \"customer portal\"",
      "discoveredAt": "2025-11-10T12:35:01.123Z"
    }
  ],
  "statistics": {
    "by_type": {
      "customer-portal": 156,
      "service-desk": 67,
      "customer-service-desk": 24
    },
    "total": 247
  }
}
```

### CSV Output

```csv
subdomain,hostname,url,type,title,foundBy
acme,acme.atlassian.net,https://acme.atlassian.net/servicedesk/customer/portal/1,customer-portal,"Acme Corp - Customer Support","site:atlassian.net ""customer portal"""
```

## Portal Types

The scraper automatically categorizes portals:

- `customer-portal`: Customer-facing portal at `/servicedesk/customer/portal/`
- `customer-service-desk`: General customer service desk
- `service-desk`: Service desk interface
- `service-management`: Service management portal
- `jira-service-desk`: Jira Service Management
- `atlassian-site`: Other Atlassian site

## Command Line Options

### api-scraper.js

| Option | Description | Default |
|--------|-------------|---------|
| `--api <type>` | API type: serpapi, google-custom, bing | serpapi |
| `--key <key>` | API key | SEARCH_API_KEY env var |
| `--engine-id <id>` | Google Custom Search Engine ID | GOOGLE_SEARCH_ENGINE_ID env var |
| `--output <file>` | Output JSON file path | ./data/service-portals.json |
| `--max <number>` | Maximum portals to collect | 200 |
| `--delay <ms>` | Delay between requests (ms) | 1000 |
| `--csv` | Also export to CSV | false |
| `--resume` | Resume from existing file | false |
| `--help` | Show help | - |

### portal-scraper.js

| Option | Description | Default |
|--------|-------------|---------|
| `--output <file>` | Output JSON file path | ./data/service-portals.json |
| `--max <number>` | Maximum portals to collect | 200 |
| `--delay <ms>` | Delay between requests (ms) | 3000 |

## Tips for Best Results

1. **Start with API scraper**: Much more reliable and faster than web scraping

2. **Use SerpAPI**: Easiest to set up, 100 free searches covers 500+ portals

3. **Resume feature**: If interrupted, use `--resume` to continue

4. **Multiple queries**: Different search queries find different portals

5. **Rate limiting**: If using web scraper, increase `--delay` to avoid blocking

6. **Combine methods**: Use both scrapers to maximize coverage

7. **Verify portals**: Some portals may be private or require authentication

## Troubleshooting

### "No API key" error
Set environment variable or use `--key` flag

### Getting blocked by Google
- Increase delay: `--delay 5000`
- Use API scraper instead
- Use VPN or proxy

### Few results returned
- Try different API (Bing often returns more results)
- Use more diverse search queries
- Increase `--max` parameter

### API rate limit errors
- Reduce request rate: `--delay 2000`
- Check your API plan limits
- Wait and resume later

## Cost Estimation

| API | Free Tier | Cost After |
|-----|-----------|------------|
| SerpAPI | 100 searches/month | $50/month for 5000 |
| Google Custom Search | 100 searches/day | $5 per 1000 queries |
| Bing Search API | 1000 searches/month | $7 per 1000 queries |

**To get 500 portals**: ~50-100 API calls (well within free tiers)

## Legal & Ethics

- Only collects publicly accessible URLs from search engines
- Respects robots.txt and rate limits
- No authentication bypass or unauthorized access
- For research and testing purposes
- Be respectful of server resources

## Next Steps

After collecting portals, you can:

1. Test OAuth flows against real portals
2. Analyze portal configurations
3. Build a portal testing suite
4. Study common portal patterns
5. Monitor portal availability

## Support

For issues or questions:
- Check the troubleshooting section
- Review API provider documentation
- Ensure API keys are valid and have quota

## License

MIT - See project root LICENSE file
