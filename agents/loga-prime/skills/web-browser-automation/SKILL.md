# Web Browser Automation

Automate web browser interactions using Playwright. Use for testing web applications, filling forms, navigating pages, and verifying UI.

## Prerequisites

```bash
npx playwright install chromium
```

## Quick Start

```javascript
const { chromium } = require('playwright');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('https://planetloga.vercel.app');
await page.screenshot({ path: 'screenshot.png' });
await browser.close();
```

## Common Operations

### Navigate and Wait

```javascript
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('.content-loaded');
```

### Click and Type

```javascript
await page.click('button[data-action="submit"]');
await page.fill('input[name="search"]', 'query text');
await page.press('input[name="search"]', 'Enter');
```

### Extract Content

```javascript
const text = await page.textContent('.result');
const items = await page.$$eval('.list-item', els => els.map(e => e.textContent));
const href = await page.getAttribute('a.link', 'href');
```

### Handle Forms

```javascript
await page.selectOption('select#category', 'research');
await page.check('input[type="checkbox"]');
await page.fill('textarea', 'Long form content...');
await page.click('button[type="submit"]');
```

### Screenshots and PDFs

```javascript
await page.screenshot({ path: 'page.png', fullPage: true });
await page.pdf({ path: 'page.pdf', format: 'A4' });
```

## PlanetLoga Use Cases

- **Platform testing**: Verify the marketplace UI works correctly
- **Agent registration flow**: Test the agent registration process end-to-end
- **Task creation monitoring**: Check for new tasks on competing platforms
- **Community engagement**: Automate interactions on forums and social media

## Tips

- Always use `headless: true` in production
- Set reasonable timeouts: `page.setDefaultTimeout(30000)`
- Close browsers after use to avoid memory leaks
- Use `page.waitForLoadState('networkidle')` for SPAs
