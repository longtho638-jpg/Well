# AGI SOPs System - Technical Architecture

## Overview

Hệ thống tạo và quản lý Standard Operating Procedures (SOPs) sử dụng local LLM để generate executable workflows cho AI agents.

## Core Components

### 1. SOP Engine
- **SOP Parser**: YAML/JSON → Executable prompts
- **Workflow Builder**: Chain SOPs thành workflows
- **Validator**: Check syntax và completeness

### 2. Local LLM Adapter
- **Ollama Integration**: Primary LLM runtime
- **Model Router**: Switch giữa models (Llama 3, Mistral, Qwen)
- **Prompt Templates**: SOP-specific templates

### 3. Agent Executor
- **Task Dispatcher**: Gửi SOPs cho agents
- **Progress Tracker**: Monitor execution
- **Result Validator**: Verify output quality

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| LLM Runtime | Ollama | Open source, M1 optimized, OpenAI API compatible |
| Models | Llama 3 8B, Mistral 7B | Best quality/speed ratio |
| Backend | Python FastAPI | Async, type hints, easy LLM integration |
| SOP Format | YAML | Human-readable, easy to version |
| Agent Interface | Claude Code SDK | Native integration |

## Project Structure

```
agi-sops/
├── sop-engine/
│   ├── parser.py          # YAML → prompt
│   ├── validator.py       # SOP validation
│   └── workflow.py        # Chain SOPs
├── llm-runtime/
│   ├── ollama-client.py   # Ollama API
│   ├── model-router.py    # Model selection
│   └── prompts/           # SOP templates
├── agent-executor/
│   ├── dispatcher.py      # Task dispatch
│   ├── tracker.py         # Progress tracking
│   └── validator.py       # Output validation
├── sops/                  # SOP definitions
│   ├── code-review.yaml
│   ├── testing.yaml
│   └── deployment.yaml
└── api/
    └── main.py            # FastAPI endpoints
```

## SOP Format Example

```yaml
name: code-review
version: 1.0
description: Review code for quality and security

triggers:
  - on: pull_request
  - on: commit

steps:
  - name: security-check
    prompt: |
      Review code for OWASP Top 10 vulnerabilities:
      1. SQL injection
      2. XSS
      3. CSRF
      4. Auth issues
    output: security-report.md

  - name: quality-check
    prompt: |
      Check code quality:
      1. DRY violations
      2. Type safety
      3. Error handling
    output: quality-report.md

success_criteria:
  - no_critical_issues: true
  - tests_pass: true
```

## API Endpoints

```
POST /sops/execute     - Execute SOP
GET  /sops/status      - Check execution status
POST /sops/validate    - Validate SOP syntax
GET  /sops/list        - List available SOPs
POST /models/switch    - Switch LLM model
GET  /models/status    - LLM runtime status
```

## Implementation Phases

1. **Phase 1**: SOP Engine + Parser
2. **Phase 2**: Ollama Integration
3. **Phase 3**: Agent Executor
4. **Phase 4**: API + UI

## Next Steps

1. Initialize git repo
2. Scaffold project structure
3. Implement SOP parser
4. Integrate Ollama
5. Create sample SOPs
6. Build executor
7. Add API endpoints
