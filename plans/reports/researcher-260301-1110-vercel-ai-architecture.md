# Vercel AI SDK — Comprehensive Architecture Research Report

**Date:** 2026-03-01
**Status:** Final Research
**Scope:** Core architecture, APIs, streaming, providers, agents, React integration, TypeScript patterns
**Confidence:** High (official docs + recent releases through SDK v6)

---

## Executive Summary

Vercel AI SDK is a **type-safe, provider-agnostic TypeScript toolkit** for building AI-powered applications and agents. Split into two main components:

- **AI SDK Core**: Unified API for text generation, structured objects, tool calling, and agent building
- **AI SDK UI**: Framework-agnostic React/Vue/Svelte/Svelte hooks for streaming chat/completion UI

Key strength: **single code path works with 100+ models** (OpenAI, Anthropic, Google, Hugging Face, local, etc.) via pluggable provider packages.

Latest version: **AI SDK 6** (Feb 2026) introduces first-class agents, human-in-the-loop tool approval, DevTools, and full MCP support.

---

## 1. CORE ARCHITECTURE

### 1.1 Two-Layer Abstraction

```
┌─────────────────────────────────────────────────────┐
│ AI SDK UI Layer                                     │
│ ├─ React Hooks: useChat, useCompletion, useObject  │
│ ├─ Framework adapters: Vue, Svelte, Angular        │
│ └─ Stream protocol handlers (v1 SSE format)        │
├─────────────────────────────────────────────────────┤
│ AI SDK Core Layer                                   │
│ ├─ generateText() / streamText() - text gen         │
│ ├─ generateObject() / streamObject() - structured   │
│ ├─ Agent class - multi-step tool loops             │
│ ├─ Tool definitions - Zod-based schemas            │
│ └─ Middleware - custom LM behavior                  │
├─────────────────────────────────────────────────────┤
│ Provider Interface (@ai-sdk/provider)               │
│ ├─ Language models (OpenAI, Anthropic, Google...)  │
│ ├─ Embedding models                                │
│ ├─ Custom provider creation pattern                │
│ └─ Provider registry & aliasing                    │
├─────────────────────────────────────────────────────┤
│ Runtimes: Node.js, Edge (Vercel), Cloudflare       │
│ Frameworks: Next.js, React, Vue, Svelte            │
└─────────────────────────────────────────────────────┘
```

### 1.2 Main Packages

| Package | Purpose | Version |
|---------|---------|---------|
| `ai` | Core SDK (text, objects, agents) | v6.x |
| `@ai-sdk/openai` | OpenAI provider | Latest |
| `@ai-sdk/anthropic` | Anthropic/Claude provider | Latest |
| `@ai-sdk/google` | Google Gemini provider | Latest |
| `@ai-sdk/react` | React hooks (useChat, useCompletion, useObject) | v6.x |
| `@ai-sdk/vue` | Vue 3 composables | v6.x |
| `@ai-sdk/svelte` | Svelte stores | v6.x |
| `@ai-sdk/mcp` | Model Context Protocol integration | Stable |
| `@ai-sdk/provider` | Base provider interface (for custom providers) | v6.x |

### 1.3 Design Philosophy

- **Provider-agnostic**: Same code, different models → one-line switch
- **Type-first**: Full TypeScript support with generics for tool definitions
- **Streaming-native**: Built for real-time data via SSE/WebSocket
- **Modular middleware**: Intercept & enhance LM calls (guardrails, caching, logging)
- **Framework-flexible**: Core logic separates from UI framework choice

---

## 2. KEY APIS & PATTERNS

### 2.1 Text Generation: `generateText()` & `streamText()`

#### generateText() — Non-streaming text generation

**When to use**: Batch processing, email drafting, summarization, agent tool execution

```typescript
const result = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'Summarize this: ...',
  temperature: 0.7,
  maxTokens: 1000,
  experimental_lifecycle: {
    onBeforeGenerate: (params) => { /* logging */ },
    onAfterGenerate: (params, result) => { /* observability */ }
  }
});

console.log(result.text);
console.log(result.usage); // { promptTokens: 42, completionTokens: 18 }
console.log(result.finishReason); // 'stop' | 'length' | 'content-filter'
```

#### streamText() — Server-to-client streaming

**When to use**: Chat UIs, real-time text generation, progressive rendering

```typescript
// Server-side (Next.js API route or Node.js)
const stream = streamText({
  model: openai('gpt-4-turbo'),
  prompt: userInput,
  onChunk: (chunk) => { /* observability */ },
  experimental_lifecycle: {
    onStepStart: (step) => { /* agent step logging */ }
  }
});

// Returns ReadableStream + helper methods
const { textStream, messageStream, fullStream } = stream;

// Client-side (via AI SDK UI)
return textStream; // Pairs with useCompletion hook
```

**Key differences from generateText**:
- Immediately starts streaming without waiting for full completion
- Errors become part of stream (don't crash server)
- Better for UX (progressive rendering)
- Enables concurrent requests

### 2.2 Structured Output: `generateObject()` & `streamObject()`

**Use case**: Extract structured data, validation, synthetic data generation

#### Pattern: Zod Schema Definition

```typescript
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

const recipeSchema = z.object({
  name: z.string().describe('Recipe name'),
  ingredients: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      unit: z.enum(['g', 'ml', 'cup', 'tbsp'])
    })
  ).describe('List of ingredients'),
  instructions: z.array(z.string()).describe('Step-by-step instructions'),
  cookTime: z.number().describe('Minutes'),
  difficulty: z.enum(['easy', 'medium', 'hard'])
});

const result = await generateObject({
  model: openai('gpt-4-turbo'),
  prompt: 'Generate a pasta recipe',
  schema: recipeSchema,
  system: 'You are a professional chef...'
});

// result.object is fully typed as z.infer<typeof recipeSchema>
console.log(result.object.name);
console.log(result.object.ingredients);
```

#### streamObject() — Streaming structured data

```typescript
const { partialObjectStream, objectStream } = streamObject({
  model: openai('gpt-4-turbo'),
  prompt: 'Extract top 5 recipe ingredients in order',
  schema: z.object({
    ingredients: z.array(z.string())
  })
});

// Stream partial updates as they're generated
for await (const partialObject of partialObjectStream) {
  console.log(partialObject); // { ingredients: ['flour'] }
  console.log(partialObject); // { ingredients: ['flour', 'eggs'] }
  // ...useful for progressive UI updates
}
```

**Zod schema support**:
- Enums, unions (with limitations), arrays, nested objects
- `.describe()` provides context to model (crucial for accuracy)
- Model constraints: Not all Zod features supported; provider JSON schema support varies

**Important limitation**: Models don't support full Zod → must convert to JSON Schema → provider support varies.

### 2.3 Agent Patterns: Multi-Step Tool Loops

**AI SDK 6 introduction**: Agents are **first-class abstraction** (not just custom loops).

#### ToolLoopAgent — Built-in agentic loop

```typescript
import { generateText, ToolLoopAgent } from 'ai';
import { openai } from '@ai-sdk/openai';

const agent = new ToolLoopAgent({
  model: openai('gpt-4-turbo'),
  instructions: 'You are a helpful weather assistant...',
  tools: {
    getTemperature: {
      description: 'Get current temperature for a city',
      inputSchema: z.object({ city: z.string() }),
      execute: async ({ city }) => {
        const temp = await fetchWeatherAPI(city);
        return { city, temperature: temp };
      }
    },
    convertTemperature: {
      description: 'Convert temperature between Celsius and Fahrenheit',
      inputSchema: z.object({
        temp: z.number(),
        from: z.enum(['C', 'F']),
        to: z.enum(['C', 'F'])
      }),
      execute: async ({ temp, from, to }) => {
        return from === 'C'
          ? { converted: (temp * 9/5) + 32 }
          : { converted: (temp - 32) * 5/9 };
      }
    }
  },
  maxSteps: 10 // Default: 20
});

// Run agent
const result = await generateText({
  model: agent, // Pass agent as a "model"
  prompt: 'What is the temperature in New York in Fahrenheit?',
  tools: agent.tools
});

console.log(result.text); // "The temperature in New York is 72°F"
```

#### Agent Loop Internals

1. **Step 1**: LLM receives prompt + tool descriptions
2. **Step 2**: Model identifies needed tool calls (if any)
3. **Step 3**: SDK executes tools in parallel
4. **Step 4**: Tool results added back to conversation
5. **Step 5**: Repeat until model says "stop" or max steps reached

```
User Input
    ↓
[Step 1] LLM decides: "Need weather API call"
    ↓
[Step 2] Execute getTemperature('NYC') → { temperature: 72 }
    ↓
[Step 3] LLM decides: "Need to convert to exact units"
    ↓
[Step 4] Execute convertTemperature(72, 'F', 'C') → { converted: 22.2 }
    ↓
[Step 5] LLM decides: "Now I can answer"
    ↓
Final Text Response
```

#### Human-in-the-Loop: Tool Approval (AI SDK 6)

```typescript
const agent = new ToolLoopAgent({
  model: openai('gpt-4-turbo'),
  tools: {
    deleteDatabase: {
      description: 'Delete entire database (DANGEROUS)',
      needsApproval: true, // ← Pauses execution here
      inputSchema: z.object({ confirmation: z.boolean() }),
      execute: async (input) => {
        // Won't execute until approval received
      }
    }
  }
});

// Client-side approval flow
const approvedResult = await agent.execute({
  prompt: 'Delete old data',
  onApprovalRequired: async (toolCall) => {
    // Show user confirmation dialog
    const approved = await getUserConfirmation(toolCall);
    return approved;
  }
});
```

### 2.4 Tool Definition Pattern (Type-Safe)

```typescript
const tools = {
  searchWeb: {
    description: 'Search the web for information',
    inputSchema: z.object({
      query: z.string().describe('Search query'),
      maxResults: z.number().int().min(1).max(20).default(10)
    }).describe('Web search parameters'),
    execute: async (input) => {
      // input is type-safe: { query: string, maxResults: number }
      const results = await searchEngine.search(input.query, input.maxResults);
      return results;
    }
  },

  calculateTax: {
    description: 'Calculate income tax based on income level',
    inputSchema: z.object({
      income: z.number().positive(),
      state: z.enum(['CA', 'NY', 'TX', 'FL']),
      filingStatus: z.enum(['single', 'married', 'head-of-household'])
    }),
    execute: async ({ income, state, filingStatus }) => {
      return calculateTaxRate(income, state, filingStatus);
    }
  }
};

// Type-safe: IDE provides autocomplete for tool.description, inputSchema fields
// Input validation automatic: Zod validates before execute() called
```

---

## 3. REACT INTEGRATION: HOOKS

### 3.1 useChat() — Real-time chat messaging

**Purpose**: Build chat UIs with streaming support, state management, message history.

```typescript
import { useChat } from '@ai-sdk/react';

export function ChatComponent() {
  const {
    messages,        // Message history: { id, role, content, createdAt }
    input,          // Current user input
    handleInputChange,
    handleSubmit,   // Sends message to /api/chat endpoint
    data,           // Custom data from server (tools results, metadata)
    error,          // Error state
    isLoading,      // True while waiting for response
    stop,           // Function to stop streaming
    reload          // Function to regenerate last assistant message
  } = useChat({
    api: '/api/chat',
    initialMessages: [], // Pre-populate chat
    maxSteps: 5,
    onError: (error) => console.error(error),
    onFinish: (message, { usage }) => {
      console.log(`Used ${usage.completionTokens} tokens`);
    }
  });

  return (
    <div>
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={m.role}>
            {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type message..."
        />
      </form>

      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

**API Route** (`/api/chat`):

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const POST = async (request: Request) => {
  const { messages } = await request.json();

  const response = streamText({
    model: openai('gpt-4-turbo'),
    system: 'You are a helpful assistant...',
    messages: messages,
    tools: { /* define tools */ }
  });

  return response.toDataStreamResponse(); // ← Pairs with useChat
};
```

**Message Type Evolution (AI SDK 5+)**:
- **UIMessage**: Client state (what displays in UI) — includes tools, metadata, custom data
- **ModelMessage**: Optimized for LLM (no unnecessary fields) — what's sent to API

### 3.2 useCompletion() — Text completion (non-chat)

**Use**: Content generators, auto-complete, code completion

```typescript
import { useCompletion } from '@ai-sdk/react';

export function AutoCompleteComponent() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useCompletion({
    api: '/api/complete',
    onFinish: (prompt, completion) => {
      saveToDatabase(prompt, completion);
    }
  });

  return (
    <>
      <textarea
        value={input}
        onChange={handleInputChange}
        placeholder="Start typing..."
      />
      <button onClick={handleSubmit}>Get Suggestions</button>
      {isLoading && <div>Generating...</div>}
      <div className="completion">{completion}</div>
    </>
  );
}
```

### 3.3 useObject() — Streaming structured objects

**Use**: Progressive data extraction, real-time JSON parsing

```typescript
import { useObject } from '@ai-sdk/react';
import { z } from 'zod';

const articleSchema = z.object({
  title: z.string(),
  summary: z.string(),
  keywords: z.array(z.string())
});

export function ArticleExtractor() {
  const { object, isLoading } = useObject({
    api: '/api/extract-article',
    schema: articleSchema,
    prompt: 'Extract article metadata from this text...'
  });

  return (
    <div>
      {object && (
        <>
          <h2>{object.title}</h2>
          <p>{object.summary}</p>
          <div>Tags: {object.keywords.join(', ')}</div>
        </>
      )}
      {isLoading && <div>Extracting...</div>}
    </div>
  );
}
```

### 3.4 useAssistant() — OpenAI Assistants API

**Use**: Stateful assistants with persistent files & tools on OpenAI platform

```typescript
import { useAssistant } from '@ai-sdk/react';

export function OpenAIAssistantUI() {
  const {
    status,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error
  } = useAssistant({
    api: '/api/assistant',
    assistantId: 'asst_xxxxx', // Pre-created on OpenAI dashboard
    threadId: 'thread_xxxxx'    // Optional: continue existing conversation
  });

  // Note: Requires actual OpenAI library, not @ai-sdk/openai
  // Tools must be defined in OpenAI Dashboard

  return (
    <>
      {messages.map((m) => (
        <div key={m.id} className={m.role}>
          {m.content[0]?.type === 'text' ? m.content[0].text : '...'}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </>
  );
}
```

**Important note**: `useAssistant` is OpenAI-specific and uses actual OpenAI library, NOT the AI SDK's provider abstraction.

### 3.5 AI SDK 5+ Message Type System

**Breaking change**: useChat no longer manages input state internally.

```typescript
// AI SDK 5+ pattern
const { messages, input, setInput, handleInputChange } = useChat({
  api: '/api/chat',
  onFinish: (message) => {
    // message.tool_invocations: {
    //   [toolName]: {
    //     toolCallId,
    //     args,
    //     result
    //   }
    // }
  }
});

// Type-safe tool results
// Each tool call has unique part id: "tool-{TOOLNAME}"
// e.g. "tool-getWeather", "tool-searchWeb"
```

---

## 4. STREAMING ARCHITECTURE

### 4.1 AI Stream Protocol (v1 — Server-Sent Events)

**Format**: SSE (Server-Sent Events) + JSON payloads

```
Server sends:
─────────────────────────────
data: {"type":"message-start","id":"msg_123"}

data: {"type":"text-start","id":"txt_456"}
data: {"type":"text-delta","id":"txt_456","delta":"Hello"}
data: {"type":"text-delta","id":"txt_456","delta":" world"}
data: {"type":"text-finish","id":"txt_456"}

data: {"type":"tool-call-start","tool":"getWeather","id":"tool_789"}
data: {"type":"tool-input-delta","id":"tool_789","delta":"{\"city"}
data: {"type":"tool-input-delta","id":"tool_789","delta":"\":\"NYC\"}"}
data: {"type":"tool-input-available","id":"tool_789","args":{"city":"NYC"}}
data: {"type":"tool-result","id":"tool_789","result":"{\"temp\":72}"}

data: {"type":"message-finish","id":"msg_123"}
─────────────────────────────
```

**Client-side parsing**: AI SDK UI hooks automatically parse this stream.

### 4.2 Stream Message Types

| Type | Structure | Purpose |
|------|-----------|---------|
| `message-start` | `{ type, id, metadata }` | New message beginning |
| `text-start` | `{ type, id }` | Text block starts |
| `text-delta` | `{ type, id, delta }` | Incremental text chunk |
| `text-finish` | `{ type, id }` | Text block complete |
| `reasoning-start` | `{ type, id }` | Reasoning block (Claude) |
| `reasoning-delta` | `{ type, id, delta }` | Reasoning increments |
| `reasoning-finish` | `{ type, id }` | Reasoning complete |
| `tool-call-start` | `{ type, tool, id }` | Tool call initiated |
| `tool-input-delta` | `{ type, id, delta }` | Tool input chunks |
| `tool-input-available` | `{ type, id, args }` | Tool input ready |
| `tool-result` | `{ type, id, result }` | Tool execution result |
| `data` | `{ type: "data-{suffix}", data: {} }` | Custom server data |
| `message-finish` | `{ type, id, finishReason }` | Message complete |

### 4.3 RSC (React Server Components) & StreamableUI

**Status**: Experimental; Vercel recommends AI SDK UI for production.

```typescript
// Server Component
import { createStreamableUI, createStreamableValue } from 'ai/rsc';

export async function ChatAction(userMessage: string) {
  const ui = createStreamableUI(<div>Loading...</div>);
  const data = createStreamableValue('');

  (async () => {
    const { text } = await streamText({
      model: openai('gpt-4-turbo'),
      prompt: userMessage,
      onChunk: (chunk) => {
        data.update(chunk.text);
      }
    });

    ui.update(
      <div>
        <h3>Response</h3>
        <p>{text}</p>
      </div>
    );

    ui.done(); // Close stream
    data.done();
  })();

  return { ui, data };
}
```

**When to use RSC approach**: Generating complex React components server-side with real-time updates.

---

## 5. PROVIDER PATTERN & ARCHITECTURE

### 5.1 @ai-sdk/provider Interface

All providers implement a standardized interface:

```typescript
// Core Provider Interface
interface LanguageModel {
  // Basic properties
  modelId: string;

  // Core methods
  doGenerate(options: GenerateOptions): Promise<GenerateResult>;
  doStream(options: StreamOptions): Promise<StreamResult>;

  // Optional
  countTokens?(request: TokenCountRequest): Promise<number>;
}

// What's in GenerateOptions
interface GenerateOptions {
  messages: Message[];
  system?: string;
  tools?: Tools;
  toolChoice?: ToolChoice;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

// What's returned
interface GenerateResult {
  text: string;
  finishReason: 'stop' | 'length' | 'content-filter' | 'error' | 'tool-calls';
  usage?: { promptTokens: number, completionTokens: number };
  rawResponse?: object; // Raw provider response
  toolCalls?: ToolCall[];
}
```

### 5.2 Built-in Provider Packages

#### OpenAI (@ai-sdk/openai)

```typescript
import { openai } from '@ai-sdk/openai';

// Models
const gpt4 = openai('gpt-4-turbo');
const gpt35 = openai('gpt-3.5-turbo');
const gpt4o = openai('gpt-4o');
const o1 = openai('o1-preview');

// Custom config
const custom = openai('gpt-4-turbo', {
  apiKey: 'sk-...',
  baseURL: 'https://api.openai.com/v1',
  headers: { 'User-Agent': 'MyApp/1.0' }
});
```

#### Anthropic (@ai-sdk/anthropic)

```typescript
import { anthropic } from '@ai-sdk/anthropic';

const claude3Opus = anthropic('claude-3-opus-20250219');
const claude3Sonnet = anthropic('claude-3-5-sonnet-20241022');
const claude3Haiku = anthropic('claude-3-5-haiku-20241022');

// Custom config
const custom = anthropic('claude-3-opus-20250219', {
  apiKey: 'sk-ant-...',
  headers: { 'anthropic-beta': 'max-tokens-3-5-sonnet-20241022' }
});
```

#### Google (@ai-sdk/google)

```typescript
import { google } from '@ai-sdk/google';

const geminiPro = google('gemini-pro');
const geminiFlas = google('gemini-1.5-flash');
const geminiExperi = google('gemini-exp-1126');

const custom = google('gemini-pro', {
  apiKey: 'AIzaSy...',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/'
});
```

#### Other Providers

- `@ai-sdk/huggingface` — HuggingFace Inference API
- `@ai-sdk/cohere` — Cohere
- `@ai-sdk/mistral` — Mistral
- `@ai-sdk/groq` — Groq
- `@ai-sdk/fireworks` — Fireworks AI
- And 100+ more via community providers

### 5.3 Custom Provider Creation

```typescript
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';

// Option 1: Pre-configure existing providers
const registry = createProviderRegistry({
  openai: openai({ apiKey: process.env.OPENAI_API_KEY }),
  anthropic: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
  google: google({ apiKey: process.env.GOOGLE_API_KEY })
});

// Access as: registry.languageModel('openai:gpt-4-turbo')
const model = registry.languageModel('openai:gpt-4-turbo');

// Option 2: Custom aliases & model overrides
const customRegistry = createProviderRegistry({
  default: openai({ apiKey: process.env.OPENAI_API_KEY }),
  // Override model behavior
  models: {
    'openai:fast': openai('gpt-3.5-turbo', { temperature: 0.5 }),
    'openai:accurate': openai('gpt-4-turbo', { temperature: 0.1 })
  }
});

// Use
const fastModel = customRegistry.languageModel('openai:fast');
const accurateModel = customRegistry.languageModel('openai:accurate');

// Option 3: Limit available models
const restrictedRegistry = createProviderRegistry({
  whitelist: ['openai:gpt-4-turbo', 'anthropic:claude-3-opus']
});
```

### 5.4 Model Provider Switching (Key Pattern)

```typescript
// Define model selection logic
function getModel(modelName?: string) {
  const selected = modelName || process.env.DEFAULT_MODEL || 'gpt-4-turbo';

  switch(selected) {
    case 'fast':
      return openai('gpt-3.5-turbo');
    case 'accurate':
      return openai('gpt-4-turbo');
    case 'claude':
      return anthropic('claude-3-opus-20250219');
    case 'gemini':
      return google('gemini-1.5-pro');
    default:
      throw new Error(`Unknown model: ${selected}`);
  }
}

// API route lets users pick model
export const POST = async (request: Request) => {
  const { messages, model } = await request.json();

  const response = streamText({
    model: getModel(model), // ← Switch providers seamlessly
    messages
  });

  return response.toDataStreamResponse();
};
```

**Benefit**: Same `streamText()` code works with any provider — no refactoring needed.

---

## 6. MIDDLEWARE PATTERN: LANGUAGE MODEL CUSTOMIZATION

### 6.1 Winding LMs with Middleware

**Purpose**: Add cross-cutting concerns (logging, guardrails, caching, guardrails) without touching core code.

```typescript
import { wrapLanguageModel } from 'ai';

// Original model
const baseModel = openai('gpt-4-turbo');

// Middleware 1: Logging
const loggingMiddleware: LanguageModelV3Middleware = {
  wrapGenerate: async (call) => {
    console.log('🚀 Generating:', call.rawRequest);
    const result = await call.rawGenerate();
    console.log('✅ Result:', result.text);
    return result;
  },
  wrapStream: async (call) => {
    console.log('📡 Streaming:', call.rawRequest);
    const stream = await call.rawStream();
    return stream;
  }
};

// Middleware 2: Guardrails
const guardrailsMiddleware: LanguageModelV3Middleware = {
  transformParams: async (call) => {
    // Inject guardrail prompt
    return {
      ...call,
      prompt: call.prompt + '\nReminder: Follow company policies.'
    };
  },
  wrapGenerate: async (call) => {
    const result = await call.rawGenerate();

    // Block unsafe content
    if (containsProhibited(result.text)) {
      return { ...result, text: '[Content blocked by guardrails]' };
    }
    return result;
  }
};

// Middleware 3: Caching
const cachingMiddleware: LanguageModelV3Middleware = {
  wrapGenerate: async (call) => {
    const cacheKey = hashRequest(call.rawRequest);
    const cached = await cache.get(cacheKey);

    if (cached) {
      console.log('💾 Cache hit!');
      return cached;
    }

    const result = await call.rawGenerate();
    await cache.set(cacheKey, result);
    return result;
  }
};

// Apply middleware (order matters!)
const wrappedModel = wrapLanguageModel({
  model: baseModel,
  middleware: [loggingMiddleware, guardrailsMiddleware, cachingMiddleware]
});

// Use wrapped model
const result = await generateText({
  model: wrappedModel, // ← Middleware automatically applied
  prompt: 'What is 2+2?'
});
```

### 6.2 Middleware Composition Pattern

```typescript
// Reusable middleware library
export const AIMiddleware = {
  logging: (logger) => ({ /* ... */ }),
  caching: (cacheFn) => ({ /* ... */ }),
  guardrails: (policies) => ({ /* ... */ }),
  rateLimit: (tokensPerMinute) => ({ /* ... */ }),
  costTracking: (provider) => ({ /* ... */ }),
  // ... more
};

// Apply multiple
const model = wrapLanguageModel({
  model: openai('gpt-4-turbo'),
  middleware: [
    AIMiddleware.logging(myLogger),
    AIMiddleware.rateLimit(10000),
    AIMiddleware.costTracking('openai'),
    AIMiddleware.guardrails(companyPolicies),
    AIMiddleware.caching(redisCache)
  ]
});
```

---

## 7. AGENT PATTERNS (AI SDK 6+)

### 7.1 Agent as First-Class Abstraction

**Key innovation**: Define agent once, use everywhere.

```typescript
// agents/researchAssistant.ts
import { ToolLoopAgent } from 'ai';
import { openai } from '@ai-sdk/openai';

export const researchAssistant = new ToolLoopAgent({
  model: openai('gpt-4-turbo'),

  instructions: `You are a research assistant helping users find information.
Use the available tools to search, analyze, and synthesize information.
Always cite sources in your response.`,

  tools: {
    searchWeb: {
      description: 'Search the web for information',
      inputSchema: z.object({
        query: z.string().describe('The search query'),
        limit: z.number().int().min(1).max(10).default(5)
      }),
      execute: async ({ query, limit }) => {
        const results = await searchEngine.search(query, limit);
        return results.map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet
        }));
      }
    },

    analyzeText: {
      description: 'Perform sentiment/entity analysis on text',
      inputSchema: z.object({
        text: z.string(),
        analysis: z.enum(['sentiment', 'entities', 'keywords'])
      }),
      execute: async ({ text, analysis }) => {
        if (analysis === 'sentiment') {
          return await sentimentAnalyzer.analyze(text);
        } else if (analysis === 'entities') {
          return await entityExtractor.extract(text);
        } else {
          return await keywordExtractor.extract(text);
        }
      }
    }
  },

  maxSteps: 10
});
```

### 7.2 Using Agents in Multiple Contexts

```typescript
// API Route
export const POST = async (request: Request) => {
  const { prompt } = await request.json();

  return streamText({
    model: researchAssistant, // ← Agent as model
    prompt,
    tools: researchAssistant.tools // ← Tools available
  }).toDataStreamResponse();
};

// Direct invocation
const result = await generateText({
  model: researchAssistant,
  prompt: 'Find information about AI safety',
  tools: researchAssistant.tools
});

// In serverless function
export async function researchTask(topic: string) {
  const result = await generateText({
    model: researchAssistant,
    prompt: `Research: ${topic}`,
    tools: researchAssistant.tools
  });
  return result.text;
}
```

### 7.3 Multi-Agent Workflows

```typescript
// Individual agents
const researchAgent = new ToolLoopAgent({ /* ... */ });
const analysisAgent = new ToolLoopAgent({ /* ... */ });
const synthesisAgent = new ToolLoopAgent({ /* ... */ });

// Orchestrate
async function multiAgentWorkflow(topic: string) {
  // Phase 1: Research
  console.log('📚 Research phase...');
  const researchResult = await generateText({
    model: researchAgent,
    prompt: `Research this topic: ${topic}`,
    tools: researchAgent.tools
  });

  // Phase 2: Analyze
  console.log('🔍 Analysis phase...');
  const analysisResult = await generateText({
    model: analysisAgent,
    prompt: `Analyze this information:\n${researchResult.text}`,
    tools: analysisAgent.tools
  });

  // Phase 3: Synthesize
  console.log('✍️ Synthesis phase...');
  const finalResult = await generateText({
    model: synthesisAgent,
    prompt: `Synthesize into actionable insights:\n${analysisResult.text}`,
    tools: synthesisAgent.tools
  });

  return finalResult.text;
}
```

### 7.4 Agent Memory & Context Management

**Problem**: Without memory, each conversation starts fresh.

#### Approach 1: Simple Message History

```typescript
const messages: Message[] = [];

async function chat(userInput: string) {
  messages.push({ role: 'user', content: userInput });

  const response = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: 'You are a helpful assistant...',
    messages: messages // ← Full history sent each time
  });

  messages.push({ role: 'assistant', content: response.text });
  return response.text;
}
```

**Limitation**: Token usage grows with conversation length.

#### Approach 2: Sliding Window (Recent + Semantic)

```typescript
async function chatWithSemanticsMemory(userInput: string, conversationId: string) {
  // Keep last 10 messages
  const recentMessages = await db.getMessages(conversationId, limit: 10);

  // Find semantically similar past messages
  const embedding = await embedder.embed(userInput);
  const similarMessages = await vectorDb.search(embedding, limit: 5);

  // Combine: recent + relevant past
  const contextMessages = [
    ...recentMessages,
    ...similarMessages.filter(m => !recentMessages.includes(m))
  ];

  const response = await generateText({
    model: openai('gpt-4-turbo'),
    messages: contextMessages,
    prompt: userInput
  });

  await db.saveMessage(conversationId, { role: 'assistant', content: response.text });
  return response.text;
}
```

#### Approach 3: External Memory Systems

**Mem0 Integration**:

```typescript
import { wrapLanguageModel } from 'ai';
import { Mem0 } from '@mem0/vercel-ai-provider';

const mem0 = new Mem0({ apiKey: process.env.MEM0_API_KEY });

const memoryModel = wrapLanguageModel({
  model: openai('gpt-4-turbo'),
  middleware: {
    transformParams: async (call) => {
      // Retrieve relevant memories
      const memories = await mem0.retrieve(call.rawRequest.prompt);

      // Inject into system
      return {
        ...call,
        system: call.system + `\nRelevant memories:\n${memories.join('\n')}`
      };
    },
    wrapGenerate: async (call) => {
      const result = await call.rawGenerate();

      // Store new memories
      await mem0.add(call.rawRequest.prompt, result.text);

      return result;
    }
  }
});

// Now agent has persistent memory
const response = await generateText({
  model: memoryModel,
  prompt: 'What did we discuss last week?'
});
```

**Letta Integration** (Stateful agents with core + archival memory):

```typescript
import { createLettaProvider } from '@letta/vercel-ai-provider';

const lettaModel = createLettaProvider({
  agentId: 'agent_xxxxx',
  apiKey: process.env.LETTA_API_KEY
});

// Letta manages memory automatically:
// - Core memory: Current context (editable by agent)
// - Archival memory: Historical data (retrievable)
// - Recall: Semantic search over archival

const result = await generateText({
  model: lettaModel,
  prompt: 'Remember: my favorite color is blue' // Stored in agent memory
});

// Next call automatically retrieves relevant memories
```

---

## 8. TYPESCRIPT PATTERNS & TYPE SAFETY

### 8.1 Tool Type Safety (End-to-End)

```typescript
// Define tool with full types
const tools = {
  weather: {
    description: 'Get weather for a city',
    inputSchema: z.object({
      city: z.string(),
      units: z.enum(['celsius', 'fahrenheit']).default('celsius')
    }),
    execute: async (input) => {
      // input is typed: { city: string, units: 'celsius' | 'fahrenheit' }
      return { temp: 22, city: input.city };
    }
  }
};

// When passed to model, type system validates:
const result = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'What is the weather in NYC?',
  tools: tools // ← Type-checked
});

// Tool calls in result are typed
if (result.toolCalls && result.toolCalls.length > 0) {
  const call = result.toolCalls[0];
  console.log(call.toolName); // ← 'weather' | ...
  console.log(call.args); // ← { city: string, units?: string }
}
```

### 8.2 Custom Message Types (AI SDK 5+)

```typescript
// Define app-specific message type
type AppMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    userId: string;
    sessionId: string;
    timestamp: Date;
    sentiment?: 'positive' | 'negative' | 'neutral';
  };
};

// Use with useChat
const { messages } = useChat<AppMessage>({
  api: '/api/chat',
  onFinish: (message) => {
    // message is fully typed as AppMessage
    console.log(message.metadata?.sentiment);
  }
});

// Server-side streaming
export const POST = async (request: Request) => {
  const { messages } = await request.json() as { messages: AppMessage[] };

  const response = streamText({
    model: openai('gpt-4-turbo'),
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
      // metadata not sent to model, but available for app logic
    }))
  });

  return response.toDataStreamResponse();
};
```

### 8.3 Generic Provider Management

```typescript
// Type-safe provider registry
type ProviderName = 'openai' | 'anthropic' | 'google';

function createModelFactory<T extends ProviderName>(
  selectedProvider: T
): LanguageModel {
  switch(selectedProvider) {
    case 'openai':
      return openai('gpt-4-turbo');
    case 'anthropic':
      return anthropic('claude-3-opus-20250219');
    case 'google':
      return google('gemini-1.5-pro');
    default:
      const _exhaustive: never = selectedProvider;
      throw new Error(`Unknown provider: ${_exhaustive}`);
  }
}

const model = createModelFactory('openai'); // ← Type-safe
const invalidModel = createModelFactory('mistral'); // ← Type error!
```

### 8.4 Middleware Generic Types

```typescript
import { LanguageModelV3Middleware } from 'ai';

// Reusable middleware factory
function createLoggingMiddleware<T extends object>(
  context: T
): LanguageModelV3Middleware {
  return {
    wrapGenerate: async (call) => {
      console.log('Context:', context);
      return await call.rawGenerate();
    }
  };
}

// Use with type inference
const userContext = { userId: 'user_123', org: 'acme' };
const middleware = createLoggingMiddleware(userContext); // ← T inferred
```

---

## 9. MODEL CONTEXT PROTOCOL (MCP) INTEGRATION

### 9.1 What is MCP?

**Model Context Protocol**: Standard for connecting AI agents to data sources, tools, and resources via server-client architecture.

**In AI SDK 6**: Full support for MCP servers (OAuth, resources, prompts, elicitation).

### 9.2 Using MCP Tools in Agents

```typescript
import { mcp } from '@ai-sdk/mcp';

// Connect to MCP server
const mcpServer = mcp({
  name: 'my-tools-server',
  url: 'sse://localhost:3000/mcp',
  apiKey: process.env.MCP_API_KEY
});

// Agent uses MCP tools automatically
const agent = new ToolLoopAgent({
  model: openai('gpt-4-turbo'),
  instructions: 'You are a helpful assistant with access to MCP tools',

  // Load tools from MCP server
  tools: await mcpServer.getTools(),

  maxSteps: 15
});

// MCP tools work like regular tools
const result = await generateText({
  model: agent,
  prompt: 'Search for Python libraries on PyPI',
  tools: agent.tools
});
```

### 9.3 MCP Resource Access

```typescript
// MCP servers expose resources (files, databases, etc.)
const fileResource = await mcpServer.getResource('file://docs/api.md');
const dbResource = await mcpServer.getResource('database://users');

// Use in prompts
const result = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: `Based on this API documentation:\n${fileResource.content}\n\nAnswer the user's question...`,
  tools: await mcpServer.getTools()
});
```

### 9.4 Real-World Example: Clay Claygent

**Clay's Claygent AI agent** uses MCP + Vercel AI SDK:

1. **Public data**: Web scraping via MCP server
2. **First-party data**: Enterprise CRM via MCP server
3. **Unified interface**: Both tools available to agent via MCP

Result: AI agents with access to both public and proprietary data sources.

---

## 10. AI SDK 6 NEW FEATURES (Feb 2026)

### 10.1 Agents as First-Class Abstraction

✅ Define once, use everywhere
✅ Reduced boilerplate (loop management automatic)
✅ Reusable across routes, serverless functions, batch jobs

### 10.2 Tool Execution Approval (Human-in-the-Loop)

```typescript
tools: {
  dangerousTool: {
    description: 'Perform dangerous action',
    needsApproval: true, // ← New in SDK 6
    inputSchema: z.object({ /* ... */ }),
    execute: async (input) => { /* ... */ }
  }
}
```

Execution pauses until user approves via client.

### 10.3 AI SDK DevTools

**Inspector for LLM calls**:
- View every model invocation
- Inspect input parameters, system prompts
- See token usage, timing, raw provider responses
- Debug agent loops visually
- Export traces for analysis

```bash
# Enable DevTools
NEXT_PUBLIC_AI_SDK_DEVTOOLS=true npm run dev
```

### 10.4 Unified Tool Calling + Structured Output

```typescript
// Before: separate generateText (for tools) vs generateObject (for structure)
// After: Unified in v6
const result = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'Extract data and call tools',
  tools: { /* ... */ },
  output: { // ← New: structured output with tools
    schema: z.object({
      analysis: z.string(),
      confidence: z.number()
    })
  }
});

// Result includes both tool calls AND structured output
```

### 10.5 Full MCP Support

✅ OAuth authentication
✅ Resources (files, databases)
✅ Prompts (templates)
✅ Server-initiated requests (for user input)

### 10.6 Standard JSON Schema Support

Previously: Zod-only for object generation
Now: Also supports standard JSON Schema

```typescript
const jsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }
  },
  required: ['name', 'age']
};

const result = await generateObject({
  model: openai('gpt-4-turbo'),
  prompt: 'Extract person info',
  schema: jsonSchema // ← Direct JSON Schema
});
```

### 10.7 Image Editing

New image generation/editing capabilities:

```typescript
import { generateImage } from 'ai';

const image = await generateImage({
  model: openai('dall-e-3'),
  prompt: 'A serene landscape',
  mask: existingImage // ← Inpainting support
});
```

---

## 11. COMMON PATTERNS & BEST PRACTICES

### 11.1 API Route Pattern

```typescript
// app/api/chat/route.ts (Next.js)
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { tools } from '@/lib/tools';

export const runtime = 'nodejs'; // or 'edge'

export const POST = async (request: Request) => {
  try {
    const { messages } = await request.json();

    const stream = streamText({
      model: openai('gpt-4-turbo'),
      system: 'You are a helpful assistant...',
      messages,
      tools,
      maxSteps: 10,
      onChunk: ({ chunk }) => {
        // Observability: log each chunk
        console.log('[CHUNK]', chunk);
      }
    });

    return stream.toDataStreamResponse();
  } catch (error) {
    console.error('API error:', error);
    return new Response('Internal error', { status: 500 });
  }
};
```

### 11.2 Error Handling

```typescript
try {
  const result = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: userInput,
    maxRetries: 3 // Built-in retry
  });

  return result.text;
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, waiting...');
    await sleep(5000);
    return retryGenerateText(); // Exponential backoff
  } else if (error instanceof APIError) {
    return 'Service temporarily unavailable';
  } else {
    throw error; // Unknown error
  }
}
```

### 11.3 Token Counting (Observability)

```typescript
const result = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: userInput
});

console.log(`Cost estimate: $${(result.usage.completionTokens * 0.03 + result.usage.promptTokens * 0.01) / 1000}`);

// Fine-grained token tracking
const tokenCount = await openai('gpt-4-turbo').countTokens(messages);
console.log(`Message tokens: ${tokenCount}`);
```

### 11.4 Testing Agents

```typescript
import { generateText } from 'ai';
import { researchAgent } from '@/agents/research';

describe('Research Agent', () => {
  it('should research a topic', async () => {
    const result = await generateText({
      model: researchAgent,
      prompt: 'Research AI safety',
      tools: researchAgent.tools,
      maxSteps: 5
    });

    expect(result.text).toContain('safety');
    expect(result.toolCalls).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const result = await generateText({
      model: researchAgent,
      prompt: 'Invalid request',
      tools: researchAgent.tools,
      maxSteps: 1
    });

    expect(result.finishReason).toBe('stop');
  });
});
```

---

## 12. UNRESOLVED QUESTIONS & GAPS

1. **Model-specific tool support**: Not all models equally support tool calling. Which models have best tool support? (Likely: GPT-4, Claude 3 Opus, Gemini 2.0)

2. **Streaming backpressure**: How does AI SDK handle backpressure when client disconnects mid-stream? (Documented but not deep-dived)

3. **Large-scale agent memory**: Best practices for agents handling 1000+ message histories? (Likely: vector embeddings + sliding window)

4. **Cost tracking per-agent**: Multi-agent workflows — how to track costs per-agent? (Likely: middleware approach)

5. **Custom provider complexity**: Creating a custom provider that wraps a proprietary API — full implementation guide missing from docs

6. **RSC maturity timeline**: When will RSC support move from experimental to stable? (Current recommendation: use AI SDK UI instead)

7. **MCP server hosting**: Best practices for deploying MCP servers alongside Vercel AI apps?

8. **Provider fallback**: Automatic fallback between providers (e.g., if GPT-4 rate-limited, fall back to Claude 3 Sonnet)?

9. **Structured output performance**: Token cost difference between generateText + tool-calls vs generateObject with Zod?

10. **Type safety with streaming**: How to maintain TypeScript type safety for streaming tool calls in real-time?

---

## SOURCES

- [AI SDK 6 - Vercel](https://vercel.com/blog/ai-sdk-6)
- [AI SDK by Vercel - Official Docs](https://ai-sdk.dev/docs/introduction)
- [GitHub - vercel/ai](https://github.com/vercel/ai)
- [AI SDK Core: generateText](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text)
- [AI SDK Core: streamText](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text)
- [AI SDK Core: generateObject](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object)
- [AI SDK Core: streamObject](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-object)
- [AI SDK Core: Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [AI SDK Core: Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [AI SDK UI: useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- [AI SDK UI: useCompletion](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-completion)
- [AI SDK UI: Stream Protocols](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)
- [AI SDK Agents: Overview](https://ai-sdk.dev/docs/agents/overview)
- [Agents: Memory](https://ai-sdk.dev/docs/agents/memory)
- [AI SDK Core: Language Model Middleware](https://ai-sdk.dev/docs/ai-sdk-core/middleware)
- [AI SDK Core: Provider & Model Management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management)
- [AI SDK Core: Model Context Protocol (MCP)](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools)
- [How to build AI Agents with Vercel and the AI SDK](https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk)
- [Model Context Protocol (MCP) explained: An FAQ - Vercel](https://vercel.com/blog/model-context-protocol-mcp-explained)
- [Tool Use - Vercel Academy](https://vercel.com/academy/ai-sdk/tool-use)
- [Structured Output - Vercel Academy](https://vercel.com/academy/ai-summary-app-with-nextjs/structured-output)
- [Vercel AI Review 2026: Detailed Analysis](https://www.truefoundry.com/blog/vercel-ai-review-2026-we-tested-it-so-you-dont-have-to)
- [A Complete Guide to Vercel's AI SDK - Codecademy](https://www.codecademy.com/article/guide-to-vercels-ai-sdk)
- [How to build unified AI interfaces using the Vercel AI SDK - LogRocket Blog](https://blog.logrocket.com/unified-ai-interfaces-vercel-sdk/)

---

**Report Status**: ✅ Complete. Ready for implementation planning.
