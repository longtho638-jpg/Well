import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('lint-staged configuration', () => {
  const projectRoot = join(process.cwd());
  const huskyPreCommitPath = join(projectRoot, '.husky/pre-commit');
  const packageJsonPath = join(projectRoot, 'package.json');

  describe('pre-commit hook', () => {
    it('should handle empty staging gracefully (exit code 0)', () => {
      // Ensure no files are staged
      execSync('git reset HEAD', { stdio: 'pipe' });

      // Run pre-commit hook
      const result = spawnSync('sh', ['.husky/pre-commit'], {
        cwd: projectRoot,
        encoding: 'utf-8',
        timeout: 10000,
      });

      // Should exit with code 0 when no files staged
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('No files staged for commit');
    });

    it('should have empty staging check in pre-commit hook', () => {
      const preCommitContent = readFileSync(huskyPreCommitPath, 'utf-8');
      expect(preCommitContent).toContain('STAGED_FILES');
      expect(preCommitContent).toContain('No files staged for commit');
      expect(preCommitContent).toContain('exit 0');
    });
  });

  describe('package.json lint-staged config', () => {
    it('should have lint-staged configuration', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson['lint-staged']).toBeDefined();
      expect(packageJson['lint-staged']['*.{ts,tsx}']).toBeDefined();
    });

    it('should use --no-warn-ignored flag for eslint', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const eslintCmd = packageJson['lint-staged']['*.{ts,tsx}'][0];
      expect(eslintCmd).toContain('--no-warn-ignored');
    });
  });
});
