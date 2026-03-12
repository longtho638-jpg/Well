# AGI SOPs System - Project Report

## Overview

Hệ thống tạo và quản lý Standard Operating Procedures (SOPs) sử dụng local LLM (Ollama) để generate executable workflows cho AI agents.

**Repository:** `agi-sops/`
**Status:** ✅ Phase 1-5 Complete (Core Implementation)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  FastAPI Server (api/main.py)                       │
│  /sops/*  /models/*  /health                        │
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
```

---

## Project Structure

```
agi-sops/
├── api/
│   ├── main.py              # FastAPI server (7 endpoints)
│   └── __init__.py
├── sop_engine/
│   ├── sop_types.py         # Pydantic models
│   ├── sop_parser.py        # YAML parser
│   ├── sop_orchestrator.py  # Execution engine
│   └── __init__.py
├── llm-runtime/
│   ├── ollama_client.py     # Ollama API client
│   ├── model_router.py      # Model selection
│   ├── prompts.py           # SOP templates
│   └── __init__.py
├── sops/
│   ├── code-review.yaml     # Code review SOP
│   ├── testing.yaml         # Testing SOP
│   ├── deployment.yaml      # Deployment SOP
│   ├── security-audit.yaml  # Security audit SOP
│   └── customer-onboarding.yaml
├── requirements.txt
├── README.md
└── .gitignore
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/sops/list` | List available SOPs |
| POST | `/sops/validate` | Validate SOP YAML |
| POST | `/sops/execute` | Execute SOP |
| GET | `/models/status` | LLM runtime status |
| POST | `/models/switch` | Switch model |

---

## Sample SOPs

### 1. Code Review SOP
- Security check (OWASP Top 10)
- Quality check (DRY, type safety)
- Style check (naming, formatting)

### 2. Testing SOP
- Unit test generation
- Integration test check
- Coverage validation

### 3. Deployment SOP
- Pre-deploy checklist
- Deploy steps
- Post-deploy verification

### 4. Security Audit SOP
- Dependency scan
- Secret detection
- Auth review

---

## Setup & Installation

### Prerequisites

1. **Install Ollama:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

2. **Pull models:**
```bash
ollama pull llama3
ollama pull mistral
```

### Install Dependencies

```bash
cd agi-sops
pip install -r requirements.txt
```

### Run Server

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Server runs at: `http://localhost:8000`

---

## Usage Examples

### List SOPs

```bash
curl http://localhost:8000/sops/list
```

### Validate SOP

```bash
curl -X POST http://localhost:8000/sops/validate \
  -H "Content-Type: application/json" \
  -d '{"yaml_content": "name: test\nversion: 1.0\nsteps: [...]"}'
```

### Execute SOP

```bash
curl -X POST http://localhost:8000/sops/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sop_name": "code-review",
    "context": {"files": ["src/main.py"]}
  }'
```

### Check Model Status

```bash
curl http://localhost:8000/models/status
```

### Switch Model

```bash
curl -X POST http://localhost:8000/models/switch \
  -H "Content-Type: application/json" \
  -d '{"model_name": "mistral"}'
```

---

## SOP Format

```yaml
name: code-review
version: 1.0
description: Review code for quality and security

triggers:
  - on: pull_request
  - on: commit

steps:
  - id: security-check
    order: 1
    agent: llm
    prompt: |
      Review code for OWASP Top 10 vulnerabilities
    expected_output: security-report.md

  - id: quality-check
    order: 2
    agent: llm
    depends_on: [security-check]
    prompt: |
      Check code quality: DRY, type safety
    expected_output: quality-report.md

success_criteria:
  - no_critical_issues: true
  - tests_pass: true

output_format:
  type: markdown
  include_summary: true
```

---

## Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| LLM Runtime | Ollama | Open source, M1 optimized, OpenAI API compatible |
| Models | Llama 3 8B, Mistral 7B | Best quality/speed ratio |
| Backend | FastAPI | Async, type hints, easy LLM integration |
| SOP Format | YAML | Human-readable, easy to version |
| Validation | Pydantic | Type-safe, auto-documentation |

---

## Next Steps (Phase 6+)

### Phase 6: Testing
- Unit tests for SOP parser
- Integration tests for API endpoints
- Mock LLM responses for testing

### Phase 7: Agent Integration
- Claude Code SDK integration
- Execute SOPs via Claude agents
- Real-time progress tracking

### Phase 8: UI Dashboard
- React frontend
- SOP editor with live preview
- Execution history and logs

### Phase 9: Production
- Authentication (JWT)
- Rate limiting
- Logging and monitoring
- Docker containerization

---

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| api/main.py | 168 | FastAPI server |
| sop_engine/sop_types.py | 88 | Pydantic models |
| sop_engine/sop_parser.py | 124 | YAML parser |
| sop_engine/sop_orchestrator.py | 115 | Execution engine |
| llm-runtime/ollama_client.py | 72 | Ollama client |
| llm-runtime/model_router.py | 95 | Model routing |
| llm-runtime/prompts.py | 118 | Prompt templates |
| sops/*.yaml | ~600 | SOP definitions |

**Total:** ~1,400 lines of code

---

## Unresolved Questions

1. Should we add WebSocket support for real-time execution streaming?
2. Need authentication before production deploy?
3. Should SOPs support variables/templates (Jinja2)?
4. Add support for remote SOPs (HTTP URLs)?

---

**Report Generated:** 2026-03-12
**Author:** AGI SOPs Bootstrap
