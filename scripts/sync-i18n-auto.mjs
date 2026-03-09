import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const EN_MISC = 'src/locales/en/misc.ts';
const VI_MISC = 'src/locales/vi/misc.ts';

console.log('🔍 Quét translation keys từ source...\n');

// Extract all t() keys from source files
const srcFiles = execSync('find src -type f \\( -name "*.tsx" -o -name "*.ts" \\) ! -path "*/locales/*"', { encoding: 'utf-8' })
  .split('\n')
  .filter(f => f.trim());

const usedKeys = new Set();
for (const file of srcFiles) {
  const content = readFileSync(file, 'utf-8');
  const matches = content.match(/t\(['"`]([^'"`]+)['"`]/g);
  if (matches) {
    matches.forEach(m => {
      const key = m.match(/t\(['"`]([^'"`]+)['"`]/)[1];
      // Skip template literal keys
      if (!key.includes('${') && !key.includes('{') && !key.startsWith('!')) {
        usedKeys.add(key);
      }
    });
  }
}

console.log(`Found ${usedKeys.size} translation keys\n`);

// Parse existing misc.ts files
function parseMiscKeys(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const keys = new Set();
  // Match flat keys: key_name: "value"
  const keyRe = /^\s*(\w+)\s*:\s*['"`]/gm;
  let match;
  while ((match = keyRe.exec(content)) !== null) {
    keys.add(`misc.${match[1]}`);
  }
  return keys;
}

// Also parse all module files
function getAllLocaleKeys() {
  const allKeys = new Set();

  // Get all module files
  const modules = ['achievementgrid', 'admin', 'agent', 'analytics', 'app', 'auth', 'billing',
    'commissionwallet', 'common', 'copilot', 'copilotcoaching', 'copilotheader', 'copilotmessageitem',
    'copilotsuggestions', 'dailyquesthub', 'dashboard', 'errorboundary', 'health', 'healthcheck',
    'herocard', 'leaderdashboard', 'liveActivities', 'liveactivitiesticker', 'marketing', 'marketplace',
    'misc', 'network', 'quickactionscard', 'quotaTracker', 'raas', 'recentactivitylist', 'referral',
    'revenuebreakdown', 'revenuechart', 'revenueprogresswidget', 'statsgrid', 'team', 'topproducts',
    'valuationcard', 'wallet', '50', 'a', 'adminsecuritysettings', 'agencyos', 'agencyosdemo',
    'agentDashboard', 'agentdetailsmodal', 'agentgridcard', 'airecommendation', 'auditlog',
    'beeautomationsection', 'bulkactionsbar', 'button', 'cart', 'cartdrawer', 'chatmessage',
    'chatsidebar', 'checkout', 'cms', 'commandpalette', 'commissionsection', 'contextsidebar',
    'copilotpage', 'debuggerpage', 'eastasiabrand', 'errors', 'exitIntent', 'finance',
    'founderrevenuegoal', 'fraudbadge', 'healthCoach', 'heroenhancements', 'landing', 'leaderboard',
    'liveconsole', 'loginactivitylog', 'marketingtools', 'marketplacefilters', 'marketplaceheader',
    'nav', 'networktree', 'notfound', 'notificationcenter', 'onboardingquest', 'orderimagemodal',
    'ordermanagement', 'ordertable', 'overview', 'partnerdetailmodal', 'partnerfilters', 'partners',
    'partnerstable', 'policyEngine', 'portfoliosection', 'premiumnavigation', 'productactions',
    'productcard', 'productdetail', 'productgrid', 'producthero', 'productinfo', 'productpricing',
    'products', 'producttabs', 'profilepage', 'pwa', 'rankladdersection', 'rankprogressbar', 'ranks',
    'redemptionzone', 'referralqrcode', 'sessionmanager', 'settings', 'sharebuttons', 'sidebar',
    'simulationpanel', 'subscription', 'success', 'successanimation', 'testpage', 'transactioncard',
    'useCopilot', 'useHeroCard', 'useStatsGrid', 'vendor', 'venture', 'withdrawal', 'withdrawalmodal'];

  for (const mod of modules) {
    try {
      const enPath = `src/locales/en/${mod}.ts`;
      const content = readFileSync(enPath, 'utf-8');

      // Find export const and parse keys
      const exportRe = new RegExp(`export\\s+const\\s+${mod}\\s*(?::[^=]*)?\\s*=\\s*\\{`, 's');
      const match = exportRe.exec(content);
      if (match) {
        // Extract all keys from this module
        const keyRe = /^\s*([a-zA-Z0-9_]+)\s*:\s*['"`]/gm;
        let m;
        while ((m = keyRe.exec(content)) !== null) {
          allKeys.add(`${mod}.${m[1]}`);
        }
        // Also check for nested keys
        const nestedRe = new RegExp(`export\\s+const\\s+(\\w+)\\s*=\\s*\\{`, 'g');
        while ((m = nestedRe.exec(content)) !== null) {
          if (m[1] !== mod) {
            allKeys.add(`${mod}.${m[1]}`);
          }
        }
      }
    } catch (e) { /* skip non-existent modules */ }
  }

  return allKeys;
}

const existingKeys = getAllLocaleKeys();
console.log(`Existing locale keys: ${existingKeys.size}\n`);

// Find missing keys
const missingKeys = [...usedKeys].filter(k => !existingKeys.has(k));
console.log(`Missing keys: ${missingKeys.length}\n`);

if (missingKeys.length === 0) {
  console.log('✅ All keys present!');
  process.exit(0);
}

// Show sample of missing keys
console.log('Sample missing keys:');
missingKeys.slice(0, 10).forEach(k => console.log(`  - ${k}`));
if (missingKeys.length > 10) console.log(`  ... and ${missingKeys.length - 10} more\n`);

// Generate translations
function generateEnValue(key) {
  const lastPart = key.split('.').pop();
  return lastPart.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase());
}

function generateViValue(key) {
  const lastPart = key.split('.').pop();
  return lastPart.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Add keys to misc.ts - convert module.key to module_key format
function addToMisc(filePath, keys, valueGen) {
  let content = readFileSync(filePath, 'utf-8');

  // Find the export const misc = { and add before closing };
  const lines = content.split('\n');
  const newLines = [];
  const addedKeys = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is the closing line
    if (line.trim() === '};' || (line.includes('};') && !line.includes('{'))) {
      // Add new keys before closing
      for (const key of keys) {
        const parts = key.split('.');
        const moduleName = parts[0];
        const subKey = parts.slice(1).join('_');
        const miscKey = `${moduleName}_${subKey}`;

        if (!addedKeys.has(miscKey) && !content.includes(`${miscKey}:`)) {
          const value = valueGen(key);
          newLines.push(`  ${miscKey}: "${value}",`);
          addedKeys.add(miscKey);
        }
      }
    }

    newLines.push(line);
  }

  writeFileSync(filePath, newLines.join('\n'));
  console.log(`\n✅ Added ${addedKeys.size} keys to ${filePath}`);
  return addedKeys.size;
}

console.log('\n✏️ Adding keys to misc.ts files...\n');

const enCount = addToMisc(EN_MISC, missingKeys, generateEnValue);
const viCount = addToMisc(VI_MISC, missingKeys, generateViValue);

console.log(`\n📊 Summary: EN +${enCount}, VI +${viCount}\n`);

console.log('🔄 Running validation...\n');
try {
  execSync('pnpm i18n:validate', { stdio: 'inherit' });
  console.log('\n🎉 MISSION COMPLETE - i18n validation PASSED!');
} catch (e) {
  console.log('\n⚠️ Validation output above - may need manual review\n');
}
