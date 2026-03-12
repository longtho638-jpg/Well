# AGI SOPs Integration Guide

## Overview

AGI SOPs (Standard Operating Procedures) là hệ thống tự động hóa quy trình làm việc sử dụng local LLM (Ollama) để generate và execute workflows cho AI agents.

## Installation

### 1. Install Ollama (Required)

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull llama3
ollama pull mistral
```

### 2. Install Python Dependencies

```bash
npm run sop:install
```

### 3. Verify Installation

```bash
npm run sop:test
```

## Usage

### Start SOP Server

```bash
npm run sop:dev
```

Server chạy tại: `http://localhost:8000`

### API Endpoints

#### List SOPs
```bash
curl http://localhost:8000/sops/list
```

#### Validate SOP YAML
```bash
curl -X POST http://localhost:8000/sops/validate \
  -H "Content-Type: application/json" \
  -d '{"yaml_content": "name: test\nversion: 1.0\nsteps: []"}'
```

#### Execute SOP
```bash
curl -X POST http://localhost:8000/sops/execute \
  -H "Content-Type: application/json" \
  -d '{"sop_name": "code-review", "context": {"files": ["src/main.ts"]}}'
```

#### Check Model Status
```bash
curl http://localhost:8000/models/status
```

#### Switch Model
```bash
curl -X POST http://localhost:8000/models/switch \
  -H "Content-Type: application/json" \
  -d '{"model_name": "mistral"}'
```

## Available SOPs

### 1. Code Review (`code-review.yaml`)
- Security scan (OWASP Top 10)
- Quality check (DRY, type safety)
- Style check (naming, formatting)

**Trigger:** Pull request, pre-commit, manual

### 2. Testing (`testing.yaml`)
- Unit test generation
- Integration test check
- Coverage validation
- Flaky test detection

**Trigger:** Pull request, feature complete

### 3. Deployment (`deployment.yaml`)
- Pre-deploy checklist
- Frontend/backend deploy
- Smoke tests
- Post-deploy verification

**Trigger:** Merge to main, tag created

### 4. Security Audit (`security-audit.yaml`)
- Dependency vulnerability scan
- Secret detection
- Auth review
- Security headers check

**Trigger:** Weekly schedule, new dependency

### 5. Customer Onboarding (`customer-onboarding.yaml`)
- Welcome message
- Collect customer info
- Setup account

**Trigger:** New signup

## Create Custom SOP

Create YAML file in `agi-sops/sops/`:

```yaml
name: my-custom-sop
version: 1.0.0
description: My custom workflow

triggers:
  - on: manual
    command: "/my-sop"

steps:
  - id: step-1
    name: First Step
    prompt: |
      Perform this task...
    expected_output: output_1

  - id: step-2
    name: Second Step
    depends_on: [step-1]
    prompt: |
      Use output_1 to perform...
    expected_output: final_output

success_criteria:
  - all_steps_completed: true

output_format:
  type: markdown
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  FastAPI Server (agi-sops/api/main.py)              │
│  Port 8000                                           │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │  SOP Orchestrator  │  sop_engine/
         │  - Parse YAML      │
         │  - Validate        │
         │  - Execute steps   │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │  Model Router      │  llm-runtime/
         │  - Ollama Client   │
         │  - Model Selection │
         │  - Prompt Templates│
         └────────────────────┘
                   │
         ┌─────────▼──────────┐
         │  Ollama (local)    │
         │  Port 11434        │
         │  Models: llama3,   │
         │          mistral   │
         └────────────────────┘
```

## Troubleshooting

### SOP Parser Errors

**Error:** `validation error for SOPDefinition`

**Fix:** Ensure YAML format matches schema:
- `name`, `version`, `description` required
- `steps` array with `id`, `prompt`, `expected_output`
- `triggers` as list of strings

### Ollama Connection Failed

**Error:** `Failed to connect to Ollama`

**Fix:**
```bash
# Check Ollama status
ollama list

# Restart Ollama
brew services restart ollama
# Or
systemctl restart ollama
```

### Module Import Errors

**Error:** `No module named 'sop_engine'`

**Fix:**
```bash
cd agi-sops
pip install -r requirements.txt
```

## Development

### Add New SOP

1. Create YAML in `agi-sops/sops/`
2. Test validation: `curl -X POST http://localhost:8000/sops/validate`
3. Execute manually to verify

### Modify SOP Engine

Python files located in `agi-sops/sop_engine/`:
- `sop_types.py` - Pydantic models
- `sop_parser.py` - YAML parser
- `sop_orchestrator.py` - Execution engine

### Modify LLM Runtime

Python files in `agi-sops/llm-runtime/`:
- `ollama_client.py` - Ollama API client
- `model_router.py` - Model selection
- `prompts.py` - Prompt templates

## Next Steps

1. **Install Ollama** - Required for LLM execution
2. **Pull models** - `ollama pull llama3`
3. **Start server** - `npm run sop:dev`
4. **Test endpoints** - Use curl or Postman
5. **Create custom SOPs** - Define your workflows

---

**Docs:** https://github.com/longtho638-jpg/WellNexus-AGI-SOPs
