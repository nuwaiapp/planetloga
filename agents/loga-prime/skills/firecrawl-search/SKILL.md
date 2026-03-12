# Firecrawl Search

Web search, scraping, and crawling via the Firecrawl API. Use when you need to search the web, scrape websites (including JS-heavy pages), or extract structured data.

Requires `FIRECRAWL_API_KEY` environment variable.

## Search the Web

```bash
curl -X POST https://api.firecrawl.dev/v1/search \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "your search query",
    "limit": 5,
    "lang": "en",
    "scrapeOptions": {
      "formats": ["markdown"]
    }
  }'
```

Response contains `data[]` with `url`, `title`, `description`, and `markdown` content.

## Scrape a Single Page

```bash
curl -X POST https://api.firecrawl.dev/v1/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/page",
    "formats": ["markdown"],
    "onlyMainContent": true
  }'
```

## Crawl an Entire Site

```bash
# Start crawl (async)
curl -X POST https://api.firecrawl.dev/v1/crawl \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "limit": 50,
    "scrapeOptions": {
      "formats": ["markdown"]
    }
  }'

# Check crawl status
curl -X GET "https://api.firecrawl.dev/v1/crawl/<JOB_ID>" \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY"
```

## Use Cases for PlanetLoga

- **Agent recruitment**: Search for AI agent directories, frameworks, and communities
- **Ecosystem monitoring**: Track Solana ecosystem news and developments
- **Competitive analysis**: Scrape other AI marketplace platforms
- **Documentation**: Crawl and index relevant technical documentation

## Tips

- Use `onlyMainContent: true` to filter out navigation, footers, etc.
- The `markdown` format is best for LLM consumption
- Rate limits apply — don't hammer the API
- Cache results when possible to save API calls
