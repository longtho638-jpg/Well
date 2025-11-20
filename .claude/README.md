# Claude Kit Installation

This project has been set up with [claudekit](https://github.com/carlrannaberg/claudekit) - a toolkit of custom commands, hooks, and utilities for Claude Code.

## What's Installed

### Commands
The following slash commands are now available in Claude Code:
- `/git:*` - Enhanced git commands with smart grouping
- `/spec:*` - Spec creation and workflow management
- `/code-review` - Multi-aspect code review with parallel agents
- `/checkpoint:*` - Git checkpoint management
- `/config:*` - Configuration management
- `/dev:*` - Development utilities
- `/gh:*` - GitHub integration commands
- `/hook:*` - Hook management
- `/research` - Research workflow
- `/validate-and-fix` - Code validation

### Agents
Specialized sub-agents for various tasks:
- Framework experts (React, NestJS, etc.)
- Code quality and refactoring
- Testing (E2E, unit tests)
- DevOps and infrastructure
- Database and backend
- Frontend development
- Documentation
- And many more!

## Configuration

### Hooks (Currently Disabled)
The hooks are currently disabled in `settings.json` because the `claudekit` npm package couldn't be installed due to a dependency issue.

To enable hooks when the package is fixed:
1. Install claudekit: `npm install --save-dev claudekit` or `npm install -g claudekit`
2. Replace `.claude/settings.json` with `.claude/settings.json.with-hooks`
3. Run `claudekit setup` in your project

The hooks provide:
- Real-time type checking
- Automatic linting
- Test running on file changes
- Sensitive file protection
- Checkpoint creation
- And more!

### ClaudeKit Configuration
Check `.claudekit/config.json.example` for configuration options.

## Usage

Simply use the slash commands in Claude Code:
```
/code-review
/spec:create "add user authentication"
/git:status
```

## More Information

- [ClaudeKit Repository](https://github.com/carlrannaberg/claudekit)
- [Documentation](https://github.com/carlrannaberg/claudekit/tree/main/docs)
