const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PAGES = [
  'home',
  'personas',
  'capabilities',
  'self-assessment',
  'anti-patterns',
  'persona-explorer',
  'persona-artisan',
  'persona-catalyst',
  'persona-multiplier',
  'persona-strategist',
  'capability-technical',
  'capability-consulting',
  'capability-delivery',
  'capability-mentorship',
  'capability-communication'
];

const BASE_URL = 'http://localhost:8080';
const OUTPUT_DIR = path.join(__dirname, '..', 'baseline-screenshots');

async function captureScreenshots() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  for (const theme of ['light', 'dark']) {
    console.log(`\nCapturing ${theme} mode screenshots...`);

    for (const pageId of PAGES) {
      const url = `${BASE_URL}/#${pageId}`;
      console.log(`  ${pageId}...`);

      await page.goto(url, { waitUntil: 'networkidle' });

      // Set theme
      if (theme === 'dark') {
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('theme', 'dark');
        });
        // Wait for theme transition
        await page.waitForTimeout(300);
      } else {
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'light');
          localStorage.setItem('theme', 'light');
        });
        await page.waitForTimeout(300);
      }

      // Capture full page screenshot
      const filename = `${pageId}-${theme}.png`;
      await page.screenshot({
        path: path.join(OUTPUT_DIR, filename),
        fullPage: true
      });
    }
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${OUTPUT_DIR}`);
  console.log(`Total: ${PAGES.length * 2} screenshots`);
}

captureScreenshots().catch(console.error);
