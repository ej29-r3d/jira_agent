# Quick Start Guide - Atlassian Portal Scraper

Get started scraping Atlassian user portals in 3 simple steps!

## Step 1: View Available Search Strategies

```bash
npm run scrape:strategies
```

This will show you all 12 predefined search strategies with descriptions.

## Step 2: Run a Quick Test (100 results)

```bash
npm run scrape:quick
```

This runs a quick test with 100 results to make sure everything works.

## Step 3: Run Full Scrape (1000 results)

```bash
npm run scrape:comprehensive
```

This will scrape 1000 Atlassian portal pages using the comprehensive search strategy.

## Alternative: Use Different Strategies

### Service Desks Only
```bash
npm run scrape -- serviceDesks
```

### JIRA Project Management
```bash
npm run scrape -- projectManagement
```

### All Atlassian Hosted Sites
```bash
npm run scrape -- atlassianHosted
```

### Company Domain Patterns (Recommended for leads)
```bash
npm run scrape -- companyPatterns
```

## Custom Search Query

If you have specific criteria from the how-to-sell document:

```bash
npm run scrape -- custom --query "your custom Google search query here"
```

Example:
```bash
npm run scrape -- custom --query "site:atlassian.net (support OR service)"
```

## Adjust Number of Results

```bash
npm run scrape -- comprehensive --results 500
```

## Change Request Delay (if you get rate limited)

```bash
npm run scrape -- comprehensive --delay 5000
```

This sets a 5-second delay between requests.

## Output Files

After running the scraper, check these files in the `scraper/` folder:

1. **atlassian_portals.json** - Full results with all data
2. **atlassian_portals.csv** - CSV format for Excel/Sheets
3. **atlassian_portals_analysis.json** - Domain statistics

## View Results

### JSON (detailed)
```bash
cat scraper/atlassian_portals.json | less
```

### CSV (in terminal)
```bash
cat scraper/atlassian_portals.csv | column -t -s ',' | less
```

### Count total results
```bash
cat scraper/atlassian_portals.json | grep '"url"' | wc -l
```

## Common Issues

### "No results found"
- Your search query might be too specific
- Try a broader strategy like `comprehensive` or `atlassianHosted`
- Check your internet connection

### Rate Limited / Blocked
- Increase delay: `--delay 5000`
- Try Google Custom Search API method (see README.md)
- Wait a few hours and try again

### Not reaching 1000 results
- Google may not have 1000 results for your query
- Try a broader search strategy
- Combine multiple strategies

## Next Steps

1. **Review Results**: Open the CSV file in Excel or Google Sheets
2. **Filter Leads**: Look for company domains (*.atlassian.net)
3. **Analyze Domains**: Check the analysis.json file for top domains
4. **Export**: Import the CSV into your CRM or sales tool

## Getting Help

```bash
npm run scrape:help
```

Shows all available options and examples.

## Important: Update Search Query

**Before running the full scrape**, update the search query based on your how-to-sell document:

1. Open `scraper/google-scraper.js`
2. Find the `CONFIG` object
3. Update `searchQuery` with your specific criteria

Or create a custom query:
```bash
npm run scrape -- custom --query "YOUR QUERY FROM HOW-TO-SELL DOC"
```

---

**Ready to scrape? Start with:**
```bash
npm run scrape:quick
```

This will run a quick 100-result test to make sure everything works!
