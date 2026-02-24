#!/usr/bin/env node

import { execSync, spawnSync } from 'child_process';
import readline from 'readline';

/**
 * 🚀 Antigravity Ship Protocol
 * Automates the deployment pipeline: Check -> Build -> Type -> Commit -> Push
 */

// Configuration
const CONFIG = {
  mainBranch: 'main',
  dryRun: process.argv.includes('--dry-run'),
  yes: process.argv.includes('--yes') || process.argv.includes('-y'),
};

// Utilities
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

function log(msg: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function step(name: string) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}▶ STEP: ${name}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

function run(command: string, errorMessage: string) {
  try {
    if (CONFIG.dryRun && (command.startsWith('git push'))) {
      log(`[DRY RUN] Would execute: ${command}`, 'yellow');
      return '';
    }
    log(`$ ${command}`, 'gray');
    return execSync(command, { stdio: 'inherit', encoding: 'utf-8' });
  } catch (error) {
    log(`\n❌ ERROR: ${errorMessage}`, 'red');
    if (!CONFIG.dryRun) process.exit(1);
    return '';
  }
}

function runSilent(command: string) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (e) {
    return '';
  }
}

async function ask(question: string): Promise<string> {
  if (CONFIG.yes) return 'y';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question}${colors.reset} `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Steps

async function preFlightCheck() {
  step('1. Pre-flight Check');

  // Check git status
  const status = runSilent('git status --porcelain');
  if (!status) {
    log('✓ No changes to ship.', 'yellow');
  } else {
    log('✓ Uncommitted changes detected:', 'green');
    console.log(status.split('\n').map(l => `  ${l}`).join('\n'));
  }

  // Check for secrets (naive check using grep if available, else skip)
  try {
    const secretsPattern = 'API_KEY|SECRET|PASSWORD|TOKEN';
    // Using git grep is safer and respects .gitignore
    const grepSecrets = runSilent(`git grep -E "${secretsPattern}" -- src || true`);
    if (grepSecrets) {
      log('⚠️  POTENTIAL SECRETS DETECTED:', 'yellow');
      // console.log(grepSecrets); // Don't print secrets
      log('  (Please verify no hardcoded secrets before proceeding)', 'yellow');
    } else {
      log('✓ No obvious secrets found.', 'green');
    }
  } catch (e) {
    log('⚠️  Skipping secret check (grep failed)', 'yellow');
  }

  const answer = await ask('Ready to ship? [Y/n]');
  if (answer.toLowerCase() === 'n') {
    log('Aborted.', 'red');
    process.exit(0);
  }
}

async function buildVerification() {
  step('2. Build Verification');

  const startTime = Date.now();
  run('npm run build', 'Build failed. Please fix errors and try again.');
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  log(`✓ Build successful in ${duration}s`, 'green');
}

async function typeCheck() {
  step('3. Type Check');

  run('npx tsc --noEmit', 'TypeScript validation failed.');
  log('✓ TypeScript checks passed.', 'green');
}

async function commitChanges() {
  step('4 & 5. Commit Changes');

  const status = runSilent('git status --porcelain');
  if (!status) {
    log('No changes to commit.', 'yellow');
    return;
  }

  // Determine change type
  let type = 'chore';
  if (status.includes('src/features') || status.includes('src/pages')) type = 'feat';
  if (status.includes('fix') || status.includes('bug')) type = 'fix';

  let message = '';
  const defaultMessage = `${type}: update`;

  if (!CONFIG.yes) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    await new Promise<void>((resolve) => {
        rl.question(`${colors.yellow}Enter commit message (default: "${defaultMessage}"):${colors.reset} `, (answer) => {
            message = answer.trim() || defaultMessage;
            rl.close();
            resolve();
        });
    });
  } else {
      message = `${type}: automated ship`;
  }

  // Stage
  run('git add .', 'Failed to stage files.');

  // Commit using spawnSync to handle quotes correctly
  if (CONFIG.dryRun) {
      log(`[DRY RUN] Would execute: git commit -m "${message}"`, 'yellow');
  } else {
      log(`$ git commit -m "${message}"`, 'gray');
      const commit = spawnSync('git', ['commit', '-m', message], { stdio: 'inherit', encoding: 'utf-8' });
      if (commit.status !== 0) {
          log('\n❌ ERROR: Failed to commit.', 'red');
          process.exit(1);
      }
  }

  log(`✓ Committed: "${message}"`, 'green');
}

async function pushToMain() {
  step('6. Push to Main');

  const currentBranch = runSilent('git rev-parse --abbrev-ref HEAD') || 'main';

  if (currentBranch !== CONFIG.mainBranch) {
    log(`⚠️  Current branch is "${currentBranch}", not "${CONFIG.mainBranch}".`, 'yellow');
    const answer = await ask(`Merge/Push to ${CONFIG.mainBranch}? [Y/n]`);
    if (answer.toLowerCase() === 'n') {
       log(`Pushing to ${currentBranch} instead...`, 'yellow');
       run(`git push origin ${currentBranch}`, 'Failed to push.');
       return;
    }
  }

  // Push logic
  const targetBranch = currentBranch === CONFIG.mainBranch ? CONFIG.mainBranch : currentBranch;
  run(`git push origin ${targetBranch}`, 'Failed to push.');

  log('✓ Pushed to remote.', 'green');
}

async function deployTrigger() {
  step('7 & 8. Deployment Trigger');

  log('🚀 Triggering Vercel deployment (via git push)...', 'green');
  log('⏳ Waiting for Vercel to pick up the change...', 'yellow');
  log('\n🎉 SHIPPED! Check your deployment dashboard.', 'green');
}

async function main() {
  console.log(`\n${colors.magenta}🚀 ANTIGRAVITY SHIP PROTOCOL${colors.reset}\n`);

  try {
    await preFlightCheck();
    await buildVerification();
    await typeCheck();
    await commitChanges();
    await pushToMain();
    await deployTrigger();
  } catch (error) {
    log(`\n❌ SHIP ABORTED: ${error}`, 'red');
    process.exit(1);
  }
}

main().catch(console.error);
