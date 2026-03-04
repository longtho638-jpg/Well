import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const OUTPUT_PATH = './docs/product-hunt/thumbnail.png';

async function generateThumbnail() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 240, height: 240 },
  });
  const page = await context.newPage();

  // Create HTML for thumbnail
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 240px;
            height: 240px;
            background: linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .logo {
            font-size: 100px;
            font-weight: 700;
            color: white;
            text-shadow: 0 4px 10px rgba(0,0,0,0.3);
            line-height: 1;
          }
          .brand {
            font-size: 18px;
            font-weight: 600;
            color: white;
            margin-top: 8px;
          }
          .tagline {
            font-size: 11px;
            color: rgba(255,255,255,0.9);
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="logo">W</div>
        <div class="brand">WellNexus</div>
        <div class="tagline">Open-Source RaaS</div>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(500); // Wait for fonts

  await page.screenshot({
    path: OUTPUT_PATH,
    type: 'png',
  });

  await browser.close();

  console.log(`✅ Thumbnail generated: ${OUTPUT_PATH}`);
  console.log(`📏 Size: 240x240px`);
}

generateThumbnail().catch(console.error);
