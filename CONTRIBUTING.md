# Contributing to WellNexus

Thank you for your interest in contributing to WellNexus! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/longtho638-jpg/Well.git
   cd Well
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Making Changes

1. Write clear, concise code
2. Follow existing code style
3. Add tests for new features
4. Update documentation as needed

### Testing

Run tests before committing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage
```

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions:
  - PascalCase for components and types
  - camelCase for functions and variables
  - kebab-case for file names
- Write meaningful comments for complex logic
- Keep functions small and focused

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```
feat(wallet): add transaction history export
fix(auth): resolve logout redirect issue
docs(readme): update installation instructions
```

## Pull Request Process

1. **Update from main**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Push your changes**
   ```bash
   git push origin your-branch
   ```

3. **Create Pull Request**
   - Provide clear description of changes
   - Reference related issues
   - Ensure CI passes
   - Request review from maintainers

4. **Code Review**
   - Address review comments
   - Keep commits clean and logical
   - Squash commits if needed

5. **Merge**
   - Once approved, maintainers will merge
   - Delete feature branch after merge

## Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Aim for 80%+ coverage

### Integration Tests

- Test component interactions
- Test user workflows
- Test API integrations

### Writing Good Tests

```typescript
describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = setupTestData();

    // Act
    const result = performAction(input);

    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

## Documentation

- Update README.md for major changes
- Add JSDoc comments for public APIs
- Document complex algorithms
- Update CHANGELOG.md

## Issue Reporting

### Bug Reports

Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

### Feature Requests

Include:
- Problem statement
- Proposed solution
- Use cases
- Alternative approaches considered

## Code Review Checklist

Before requesting review:

- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] TypeScript errors resolved
- [ ] Build passes locally
- [ ] Tests pass locally

## Questions?

- Check existing issues and PRs
- Review documentation
- Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
