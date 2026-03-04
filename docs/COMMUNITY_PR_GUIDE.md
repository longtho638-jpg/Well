# Community PR Guide

> Thank you for contributing to WellNexus! This guide helps community members submit high-quality pull requests.

---

## 🚀 Quick Start

### 1. Fork the Repository

```bash
# Click "Fork" button on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Well.git
cd Well
git remote add upstream https://github.com/longtho638-jpg/Well.git
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-123
```

### 3. Make Changes

Follow the [Development Rules](./development-rules.md):
- Write TypeScript with strict mode
- Add tests for new features
- Update documentation
- Keep files under 200 lines

### 4. Test Locally

```bash
# Install dependencies
npm install

# Run tests
npm run test:run

# Build
npm run build

# Lint
npm run lint
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
# Use conventional commits (see below)
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
# Then open GitHub and create Pull Request
```

---

## 📝 Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear commit history.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons) |
| `refactor` | Code refactoring (no functional change) |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks, dependencies |

### Examples

```
feat(subscription): add usage metering for AI calls
fix(auth): resolve logout redirect issue on Safari
docs(readme): update installation instructions
refactor(wallet): simplify balance calculation logic
test(commission): add edge case tests for level 8
style(components): format Prettier configuration
chore(deps): update React to v19.2.4
```

---

## 🧪 Testing Requirements

### Unit Tests

All new features must have unit tests:

```typescript
// src/services/__tests__/new-feature.test.ts
describe('NewFeature', () => {
  it('should do something specific', () => {
    // Arrange
    const input = setupTestData();

    // Act
    const result = performAction(input);

    // Assert
    expect(result).toBe(expectedValue);
  });

  it('should handle edge case', () => {
    // Test edge cases
  });
});
```

### Test Coverage

- **New features:** >80% coverage required
- **Bug fixes:** Test the specific bug scenario
- **Refactors:** Maintain existing coverage

### Run Tests

```bash
# All tests
npm run test:run

# Specific file
npm test -- src/services/new-feature.test.ts

# With coverage
npm run test:coverage
```

---

## 📚 Documentation Requirements

### Update README

If your PR changes functionality:

```markdown
## ✨ Key Features
- 🆕 **New Feature** - Description of what it does
```

### Add JSDoc Comments

```typescript
/**
 * Calculate commission for a given level.
 *
 * @param level - Commission level (1-8)
 * @param amount - Order amount in VND
 * @returns Commission amount in VND
 * @throws Error if level is outside valid range
 */
function calculateCommission(level: number, amount: number): number {
  // Implementation
}
```

### Update Changelog

Add entry to `CHANGELOG.md`:

```markdown
## [Unreleased]

### Added
- New feature description (#123)

### Fixed
- Bug fix description (#456)
```

---

## 🔍 PR Checklist

Before submitting your PR:

```markdown
## Description
<!-- Describe your changes clearly -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style update (formatting, renaming)
- [ ] 🔧 Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test update
- [ ] 🔒 Security fix

## Testing
- [ ] I have added unit tests for my changes
- [ ] I have updated E2E tests (if applicable)
- [ ] All tests pass locally (`npm run test:run`)
- [ ] Build passes locally (`npm run build`)

## Code Quality
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have checked my code for security vulnerabilities

## Related Issues
<!-- Link any related issues using "Fixes #123" or "Related to #456" -->

Fixes #123
Related to #456

## Screenshots (if applicable)
<!-- Add screenshots or screen recordings to demonstrate the changes -->

## Deployment Notes (if applicable)
<!-- List any special deployment instructions -->
- [ ] Requires database migration
- [ ] Requires environment variable changes
- [ ] Requires feature flag toggle
```

---

## 🎯 Good PR Examples

### ✅ Good: Bug Fix

```markdown
## Description
Fix logout redirect issue on Safari where users are redirected to homepage instead of login page.

## Related Issues
Fixes #234

## Testing
- [x] Manually tested on Safari 17.2
- [x] All existing tests pass

## Screenshots
Before: Redirects to / (wrong)
After: Redirects to /auth/login (correct)
```

### ✅ Good: New Feature

```markdown
## Description
Add usage metering for AI calls with quota tracking per subscription tier.

## Type of Change
- [x] ✨ New feature

## Testing
- [x] Added unit tests for usage tracking
- [x] Added unit tests for quota checks
- [x] All 440 tests pass
- [x] Build passes (0 TypeScript errors)

## Documentation
- [x] Updated API_REFERENCE.md with new endpoints
- [x] Updated FEATURE_FLAGS.md with usage examples
- [x] Added JSDoc comments to all public functions
```

---

## 🚫 Common PR Rejections

### ❌ No Tests

> "Please add unit tests for your changes. See [Testing Requirements](#testing-requirements)."

### ❌ Failing Build

> "Build fails with 5 TypeScript errors. Please fix before we can review."

### ❌ Incomplete Description

> "Please fill out the PR template with a clear description and testing checklist."

### ❌ Code Style Issues

> "Code doesn't follow project style. Run `npm run lint` and fix all issues."

### ❌ Security Concerns

> "This change exposes API keys in client code. Please move to server-side."

---

## 🔄 PR Review Process

### Timeline

1. **Automated Checks** (5-10 min)
   - Build passes
   - Tests pass
   - Linting passes

2. **Maintainer Review** (1-3 days)
   - Code quality check
   - Security review
   - Testing verification

3. **Merge** (After approval)
   - Squash and merge to main
   - Delete feature branch

### Review Feedback

If changes are requested:

```bash
# Make requested changes
git add .
git commit -m "fix: address review comments"
git push origin feature/your-feature-name
```

Don't rebase or amend commits during review (preserves review context).

---

## 🏆 Contributor Recognition

### After Your First PR

- 🎉 Welcome message in PR comments
- 🏷️ `first-time-contributor` label
- 📢 Shout-out in next release notes

### Active Contributors

- 👥 Invited to GitHub organization
- 💬 Discord moderator role
- 🎁 WellNexus swag (stickers, t-shirts)

### Top Contributors

- 🌟 Featured in README Contributors section
- 🎤 Speaking opportunities at community events
- 💼 Job referral network access

---

## 📞 Need Help?

- 💬 [Discussions](https://github.com/longtho638-jpg/Well/discussions) — Ask questions
- 📧 [Email](mailto:support@wellnexus.vn) — Direct support
- 🐛 [Issues](https://github.com/longtho638-jpg/Well/issues) — Bug reports

---

**Ready to contribute?** [Fork the repo](https://github.com/longtho638-jpg/Well/fork) and submit your first PR!
