import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../docs/product-hunt/gallery');

const PAGES = [
  { name: '01-hero-dashboard', url: 'https://wellnexus.vn/', description: 'Hero Dashboard - Main analytics view' },
  { name: '02-pricing', url: 'https://wellnexus.vn/pricing', description: 'Subscription Pricing - Free/Pro/Enterprise' },
  { name: '03-features', url: 'https://wellnexus.vn/features', description: 'Features Overview' },
  { name: '04-mobile', url: 'https://wellnexus.vn/', description: 'Mobile Responsive View', mobile: true },
];

async function captureScreenshot(pageConfig) {
  console.log(`📸 Capturing: ${pageConfig.name} - ${pageConfig.description}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: pageConfig.mobile ? { width: 375, height: 812 } : { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    await page.goto(pageConfig.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // Wait for animations

    const outputPath = path.join(OUTPUT_DIR, `${pageConfig.name}.png`);
    await page.screenshot({
      path: outputPath,
      fullPage: false,
      type: 'png',
    });

    console.log(`✅ Saved: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error capturing ${pageConfig.name}:`, error.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🎬 Starting Product Hunt Screenshot Capture\n');
  console.log(`📁 Output Directory: ${OUTPUT_DIR}\n`);

  for (const pageConfig of PAGES) {
    await captureScreenshot(pageConfig);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between captures
  }

  console.log('\n✨ Screenshot capture complete!');
}

main().catch(console.error);
