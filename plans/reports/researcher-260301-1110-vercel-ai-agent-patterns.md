# Vercel AI SDK Agent & Tool-Calling Patterns Research Report

**Date**: 2026-03-01
**Focus**: Vercel AI SDK 5.x → 6.0 agent patterns, tool definitions, multi-step execution, structured output, provider architecture
**Scope**: Research only (no implementation)

---

## 1. TOOL DEFINITIONS & API

### 1.1 Core Tool Structure

Tools in Vercel AI SDK are defined with four essential elements:

```typescript
interface ToolDefinition {
  description: string        // Guides model tool selection
  inputSchema: ZodSchema     // Zod or JSON schema for parameters
  execute?: (params) => any  // Optional async execution function
  strict?: boolean           // Enable strict tool calling (provider-dependent)
}
```

**Tool Creation Pattern**:
```typescript
tools: {
  weatherTool: tool({
    description: 'Get weather in a location',
    inputSchema: z.object({
      location: z.string().describe('City name')
    }),
    execute: async ({ location }) => {
      // Execute tool logic
      return { temp: 72, condition: 'sunny' }
    }
  })
}
```

**Key Insights**:
- Tools are defined as objects with tool names as keys
- Input schema is required (Zod or JSON schema)
- Execute function is optional (for server-side tool execution)
- Description heavily influences model's tool selection behavior

### 1.2 Advanced Tool Features (AI SDK 6+)

**Approval Gates** (Human-in-the-Loop):
```typescript
tool({
  description: 'Delete user data',
  inputSchema: deleteSchema,
  execute: deleteData,
  needsApproval: true  // Requires authorization before execution
})
```

When `needsApproval: true`, tool calls appear in results as `'tool-call'` content that requires explicit user approval before proceeding.

**Strict Mode** (Schema Compliance):
```typescript
tool({
  description: '...',
  inputSchema: schema,
  execute: handler,
  strict: true  // Forces provider to strictly validate schema
})
```

Providers supporting strict mode (OpenAI, Anthropic) guarantee tool calls strictly conform to schema.

**Dynamic Tools** (Runtime-defined schemas):
```typescript
import { dynamicTool } from 'ai'

dynamicTool({
  description: 'Call any MCP function',
  inputSchema: z.any(),  // Schema unknown at compile-time
  execute: ({ toolName, params }) => mcpServer.call(toolName, params)
})
```

Used for MCP (Model Context Protocol) servers where input schemas are discovered at runtime.

**Input Examples** (AI SDK 6):
```typescript
tool({
  description: '...',
  inputSchema: schema,
  execute: handler,
  examples: [
    { location: 'San Francisco', timezone: 'America/Los_Angeles' }
  ]  // Clarifies expected input patterns
})
```

### 1.3 Tool Result Handling

**Simple Results** (Automatic):
```typescript
execute: async ({ param }) => {
  return { success: true, data: [...] }  // Auto-converted to tool result
}
```

**Rich Results with Content** (AI SDK 6):
```typescript
execute: async ({ imageId }) => {
  return {
    result: 'Image analysis complete',
    content: [
      { type: 'image', data: base64Image },
      { type: 'text', text: 'Analysis: ...' }
    ]
  }  // Rich multi-type results
}
```

**Error Handling**:
- Three tool-specific errors: `NoSuchToolError`, `InvalidToolInputError`, `ToolCallRepairError`
- Execution errors appear as `'tool-error'` parts in multi-step results
- By default, tool execution errors convert to LLM messages (agent can recover)

### 1.4 Tool Callbacks for Monitoring

```typescript
const result = await generateText({
  model,
  prompt,
  tools: { ... },
  experimental_onToolCallStart: ({ toolName, args }) => {
    console.log(`Starting: ${toolName}`, args)
  },
  experimental_onToolCallFinish: ({ toolName, result }) => {
    console.log(`Finished: ${toolName}`, result)
  }
})
```

Enables timing, performance tracking, and observability without interrupting flow.

---

## 2. MULTI-STEP AGENT PATTERNS

### 2.1 `maxSteps` vs `stopWhen` (AI SDK 5+)

**`maxSteps` (Deprecated/Legacy)**:
- Old parameter for controlling tool loop depth
- Only works with certain configurations
- Being phased out in favor of `stopWhen`

**`stopWhen` (Modern Approach - AI SDK 5+)**:
```typescript
const result = await generateText({
  model,
  prompt: 'Find weather and convert to Celsius',
  tools: { getWeather, convertTemperature },
  stopWhen: 'text'  // Stop when model outputs text (not tool calls)
})
```

**stopWhen Values**:
- `'text'`: Stop when text is generated (default for single-step)
- Function: Custom condition `({ reason, toolCalls }) => boolean`

### 2.2 Agent Execution Loop Flow

When `stopWhen` is configured, the SDK automatically orchestrates this flow:

```
1. Send prompt to LLM
   ↓
2. LLM decides: Generate text OR Call tool(s)?
   ↓
   If tool call:
   ├─ SDK executes tool(s)
   ├─ Appends tool results to message history
   ├─ Triggers new generation with updated context
   └─ Loop back to step 2
   ↓
   If text:
   └─ Return result with finishReason='stop'
   ↓
   If max steps reached:
   └─ Return result with finishReason='maxSteps'
```

**Key Points**:
- Tool results automatically append to conversation history
- Conversation context preserved across loop iterations
- Model has full visibility into previous tool calls and results
- Loop terminates on text generation or max steps reached

### 2.3 Multi-Step with `prepareStep` (Advanced Control)

```typescript
const result = await generateText({
  model,
  prompt: 'Execute complex workflow',
  tools: { ... },
  stopWhen: ({ reason }) => reason === 'text',
  prepareStep: async (step) => {
    // Customize settings per loop iteration
    if (step.stepNumber === 1) {
      return { ...step, model: cheaperModel }  // Use cheaper model for first step
    }
    if (step.toolCalls?.length > 3) {
      return { ...step, maxOutputTokens: 500 }  // Restrict output if many tools called
    }
    return step
  }
})
```

Enables:
- Dynamic model switching between steps
- Step-specific parameter adjustments
- Adaptive tool set per iteration
- Token budget management

---

## 3. TOOL LOOP AGENT CLASS (AI SDK 6+)

The new `ToolLoopAgent` class provides production-ready agent implementation:

### 3.1 Basic Usage

```typescript
import { ToolLoopAgent } from 'ai'

const agent = new ToolLoopAgent({
  model,
  instructions: 'You are a helpful assistant that uses tools',
  tools: {
    getWeather: tool({ ... }),
    searchWeb: tool({ ... })
  }
})

const result = await agent.execute({
  goal: 'What is the weather in Paris?'
})
```

### 3.2 Agent Configuration

```typescript
interface ToolLoopAgentConfig {
  model: LanguageModel
  instructions: string           // System prompt (renamed from `system` in v5)
  tools: Record<string, Tool>   // Available tools
  maxSteps?: number             // Default: 20
  onStepFinish?: (step) => void
  onFinish?: (result) => void
}
```

**Key Differences from generateText**:
- Encapsulates entire agent configuration in reusable object
- Automatically manages tool loop (no manual `stopWhen` needed)
- Better for multi-context usage (CLI, API, streaming)
- Reduces boilerplate in application code

### 3.3 When to Use ToolLoopAgent vs Core Functions

**Use `ToolLoopAgent` when**:
- Building reusable agent definitions across multiple contexts
- Need simple, declarative agent configuration
- Okay with non-deterministic execution
- Want built-in loop management

**Use `generateText` with `stopWhen` when**:
- Need explicit control over execution flow
- Deterministic/repeatable results required
- Building complex workflows with conditional logic
- Want fine-grained step customization via `prepareStep`

---

## 4. STRUCTURED OUTPUT PATTERNS

### 4.1 AI SDK 5.x Pattern (generateObject - Deprecated)

```typescript
const result = await generateObject({
  model,
  prompt: 'Extract recipe information',
  schema: z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    servings: z.number()
  })
})
// Returns: { object: {...}, finishReason: 'stop' }
```

⚠️ **Deprecated**: `generateObject` is removed in AI SDK 6.0+

### 4.2 AI SDK 6.0+ Pattern (generateText with output)

```typescript
const result = await generateText({
  model,
  prompt: 'Extract recipe information',
  output: {
    schema: z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      servings: z.number()
    })
  }
})
// Returns: { text: '...', object: {...}, ... }
```

Or using output.object helper:

```typescript
import { output } from 'ai'

const result = await generateText({
  model,
  prompt: 'Extract recipe information',
  output: output.object({
    schema: z.object({ ... })
  })
})
```

### 4.3 Combining Tool Calling with Structured Output (AI SDK 6)

**Previously Required Chaining**:
- Call `generateText` with tools
- Then call `generateObject` on tool results
- Complex orchestration needed

**Now Unified** (AI SDK 6):
```typescript
const result = await generateText({
  model,
  prompt: 'Find restaurants and extract details',
  tools: { searchRestaurants: tool({ ... }) },
  output: output.object({
    schema: z.object({
      restaurants: z.array(restaurantSchema)
    })
  }),
  stopWhen: 'text'  // Loop until structured output generated
})
```

Single function handles both tool calls AND structured output generation.

### 4.4 Zod Schema Integration

**Basic Schema**:
```typescript
const schema = z.object({
  title: z.string().describe('Article title'),
  tags: z.array(z.enum(['tech', 'news', 'AI'])).min(1),
  summary: z.string().max(500)
})
```

**Converting to JSON Schema** (for providers):
```typescript
import { zodSchema } from 'ai'

const jsonSchema = zodSchema(schema)
// Returns { type: 'object', properties: {...}, required: [...] }
```

**Type Inference**:
```typescript
type RecipeData = z.infer<typeof recipeSchema>
// TypeScript automatically infers correct types
```

---

## 5. PROVIDER & MODEL PATTERNS

### 5.1 Provider Factory Pattern

**Creating Provider Instances**:
```typescript
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogle } from '@ai-sdk/google'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
  headers: { 'custom-header': 'value' }
})

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30000
})

const google = createGoogle({
  apiKey: process.env.GOOGLE_API_KEY
})
```

**Provider Configuration**:
- API key (via env vars or constructor)
- Custom base URLs (for proxies/gateways)
- Custom headers (for auth, tracing)
- Fetch implementation (for Node.js/Edge Runtime compatibility)
- Timeout settings

### 5.2 Model Selection & Capabilities

**Using Models**:
```typescript
const gpt4 = openai('gpt-4o')
const claude = anthropic('claude-3-5-sonnet-20241022')
const gemini = google('gemini-2.0-pro')

// Use in any function
const result = await generateText({
  model: claude,  // Swap at runtime
  prompt: '...'
})
```

**Model Capabilities** (varies by provider):
- Text generation (all)
- Tool use (all modern models)
- Structured output (most)
- Vision/Images (most)
- Streaming (all)
- Extended context (provider-specific)
- Parallel tool calls (some)

**Provider-Specific Features**:

| Provider | Special Capabilities |
|----------|---------------------|
| Anthropic | Extended thinking, memory management, computer control, code execution |
| OpenAI | Structured outputs, parallel function calling, vision |
| Google | Maps grounding, web search, RAG integration, code execution |
| xAI | Web search, X (Twitter) search, code execution |

### 5.3 Custom Provider Interface (Language Model Spec V3)

**Creating Custom Provider**:
```typescript
const customProvider = {
  create: (modelId: string): LanguageModelV3 => ({
    modelId,
    provider: 'custom-provider',

    // Async generation
    async doGenerate(input) {
      const response = await customApi.complete({
        prompt: input.prompt,
        tools: input.tools
      })
      return {
        text: response.text,
        toolCalls: response.toolCalls,
        finishReason: response.finishReason
      }
    },

    // Streaming
    async doStream(input) {
      const stream = customApi.stream({...})
      return {
        stream: stream.asAsyncIterable(),
        ...
      }
    }
  })
}
```

**Supports**:
- Text output
- Tool calls (with `toolCallId` for correlation)
- Streaming events
- Provider-specific features via `metadata`

---

## 6. ADVANCED PATTERNS

### 6.1 RAG (Retrieval Augmented Generation)

**Pattern Flow**:
```
User Query
    ↓
Vector Search (Semantic Similarity)
    ↓
Retrieve Top-K Documents (5-20 chunks)
    ↓
Augment Prompt with Retrieved Context
    ↓
Generate Response with Grounding
```

**Implementation**:
```typescript
import { embed } from 'ai'

// 1. Index documents
const documents = ['doc1', 'doc2', ...]
const embeddings = await Promise.all(
  documents.map(doc => embed({
    model: openai.embedding('text-embedding-3-small'),
    value: doc
  }))
)

// 2. Retrieve relevant docs
const queryEmbedding = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: userQuery
})

const relevantDocs = documents
  .map((doc, i) => ({
    doc,
    similarity: cosineSimilarity(queryEmbedding, embeddings[i])
  }))
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 5)

// 3. Augment prompt
const augmentedPrompt = `
Context:
${relevantDocs.map(d => d.doc).join('\n')}

Question: ${userQuery}
`

// 4. Generate
const result = await generateText({
  model,
  prompt: augmentedPrompt,
  tools: { ... }
})
```

**Best Practices**:
- Use cosine similarity for relevance scoring (score 0.7-1.0 is good)
- Retrieve only top 5-20 chunks (avoid context bloat)
- Cache embeddings for frequently-used documents
- Consider hybrid search (keyword + semantic)

### 6.2 Error Recovery & Resilience

**Default Behavior**:
```typescript
// Tool execution errors automatically convert to LLM messages
// Model can recover with alternative approaches
const result = await generateText({
  model,
  prompt: 'Complete task',
  tools: {
    apiCall: tool({
      description: 'Call external API',
      inputSchema: z.object({ url: z.string() }),
      execute: async ({ url }) => {
        try {
          return await fetch(url).then(r => r.json())
        } catch (error) {
          // Error becomes tool-result message
          throw error  // AI SDK converts to 'tool-error'
        }
      }
    })
  },
  stopWhen: 'text'  // Agent can retry or use fallback
})
```

**Production Resilience** (Use Restate + Vercel AI SDK):
```typescript
// With Restate context actions
import { ctx } from '@restate/sdk'

const result = await ctx.run('call-api', async () => {
  // Transient errors auto-retry until success
  return await fetch(url).then(r => r.json())
})

// Full observability + durability:
const agent = new ToolLoopAgent({ ... })
const workflow = await ctx.run('agent-workflow', () =>
  agent.execute({ goal })
)
```

Restate adds:
- Automatic retry of transient failures
- State durability across interruptions
- Built-in observability
- Human-in-the-loop approvals

### 6.3 Multi-Agent Orchestration

**Sequential Agent Chain**:
```typescript
const planner = new ToolLoopAgent({
  instructions: 'Create plan',
  tools: { searchTopic: tool({ ... }) }
})

const executor = new ToolLoopAgent({
  instructions: 'Execute plan',
  tools: { executePlanStep: tool({ ... }) }
})

const result1 = await planner.execute({ goal: userGoal })
const plan = result1.goal  // Extract plan

const result2 = await executor.execute({ goal: plan })
```

**Parallel Agents**:
```typescript
const agents = [
  new ToolLoopAgent({ instructions: 'Research topic A', tools: {...} }),
  new ToolLoopAgent({ instructions: 'Research topic B', tools: {...} }),
  new ToolLoopAgent({ instructions: 'Research topic C', tools: {...} })
]

const results = await Promise.all(
  agents.map(agent => agent.execute({ goal }))
)

const combined = results.map(r => r.goal).join('\n')
```

### 6.4 Content Moderation & Guardrails

**Language Model Middleware**:
```typescript
import { wrapLanguageModel } from 'ai'

const safeguardedModel = wrapLanguageModel({
  model: claude,
  middleware: {
    wrapGenerate: async (call) => {
      // Pre-request: Check for policy violations
      const { prompt, system } = call.params
      if (containsForbiddenContent(prompt)) {
        throw new Error('Request blocked by policy')
      }

      // Execute request
      const result = await call.params.doGenerate()

      // Post-response: Filter output
      return {
        ...result,
        text: sanitizeOutput(result.text)  // Remove harmful content
      }
    }
  }
})

const result = await generateText({
  model: safeguardedModel,
  prompt: userInput
})
```

**Provider Guardrails** (AWS Bedrock, OpenAI):
```typescript
// AWS Bedrock Guardrails
const result = await generateText({
  model: bedrock('claude-3-sonnet'),
  prompt: userInput,
  guardrails: {
    guardrailId: 'GUARDRAIL-ID',
    guardrailVersion: '1.0'
  }
})

// OpenAI safety/moderation APIs can wrap responses
```

### 6.5 Telemetry & Observability

**Built-in Telemetry** (OpenTelemetry):
```typescript
const result = await generateText({
  model,
  prompt,
  tools: { ... },
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: true,
    recordOutputs: true
  }
})
```

Creates OpenTelemetry spans for:
- Function-level execution (top-level span)
- Provider calls (request/response timing)
- Tool execution (per-tool spans)
- Streaming events (fine-grained timing)

**Integration with Observability Platforms**:
- Axiom
- Braintrust
- Helicone
- Langfuse
- LangSmith
- SigNoz
- Traceloop
- Weave

**Callback-Based Monitoring**:
```typescript
const result = await generateText({
  model,
  prompt,
  tools: { ... },
  onFinish: ({ text, toolCalls, finishReason, usage }) => {
    console.log(`Tokens: ${usage.inputTokens}/${usage.outputTokens}`)
    console.log(`Finish: ${finishReason}`)
  },
  onStepFinish: ({ stepNumber, toolCalls, toolResults }) => {
    console.log(`Step ${stepNumber}: ${toolCalls?.length} calls`)
  }
})
```

---

## 7. STREAMTEXT vs GENERATETEXT

### 7.1 Core Differences

| Aspect | `generateText` | `streamText` |
|--------|---|---|
| **Use Case** | Non-interactive (agents, batch) | Interactive (chat, real-time) |
| **Return Type** | Promise (complete result) | AsyncIterable (streaming chunks) |
| **Errors** | Thrown as exceptions | Part of stream, don't crash server |
| **Tool Calling** | Both support with `stopWhen` | Both support with `stopWhen` |
| **Streaming UI** | Need to wait for complete result | Can stream partial results immediately |
| **Latency** | Higher (waits for completion) | Lower (start streaming immediately) |

### 7.2 Tool Calling in Both

```typescript
// generateText - Full result after completion
const result = await generateText({
  model,
  prompt,
  tools: { ... },
  stopWhen: 'text'  // Tool loop until text
})
// Waits for all tool calls to complete, then returns

// streamText - Stream results as they arrive
const stream = streamText({
  model,
  prompt,
  tools: { ... },
  stopWhen: 'text'  // Tool loop until text
})

for await (const chunk of stream) {
  if (chunk.type === 'tool-call') {
    console.log('Tool called:', chunk.toolName)
  } else if (chunk.type === 'tool-result') {
    console.log('Tool result:', chunk.result)
  } else if (chunk.type === 'text-delta') {
    console.log('Text:', chunk.textDelta)
  }
}
```

### 7.3 UI Generation with Tools (streamText)

```typescript
// Generate React components with tools for interaction
const stream = streamText({
  model,
  messages: [...],
  tools: {
    setTitle: tool({
      description: 'Set page title',
      inputSchema: z.object({ title: z.string() }),
      execute: async ({ title }) => {
        return { success: true, message: `Title set to: ${title}` }
      }
    })
  }
})

// Stream to frontend
const response = new Response(stream.toTextStreamResponse())
```

---

## 8. AI SDK 6.0 BREAKING CHANGES & MIGRATION

### 8.1 Major Breaking Changes

| Change | Impact | Migration |
|--------|--------|-----------|
| `generateObject` removed | Structured output API changed | Use `generateText` with `output.object()` |
| `Experimental_Agent` → `ToolLoopAgent` | Agent class renamed, API simplified | Rename class, change `system` → `instructions` |
| `convertToCoreMessages` async | Message conversion now async | Await calls, update flow |
| `streamObject` deprecated | Use `streamText` instead | Migrate to `streamText` with output |
| Strict mode moved | From provider to per-tool | Add `strict: true` to tools |
| Embeddings renamed | `textEmbedding` → `embedding` | Update method names |
| Output function signature | Output API unified | Use `output.object()` helper |
| Provider keys changed | `google` → `vertex` (Google) | Update imports and key names |

### 8.2 Migration Steps

1. **Update Dependencies**:
   ```bash
   npm install ai@^6.0.0 @ai-sdk/openai@^3.0.0 @ai-sdk/anthropic@^3.0.0
   ```

2. **Run Codemods** (Automates most updates):
   ```bash
   npx @ai-sdk/codemod v6
   ```

3. **Manual Fixes**:
   - Replace `generateObject()` with `generateText()` + `output.object()`
   - Rename `Experimental_Agent` to `ToolLoopAgent`
   - Change `system` to `instructions` in agent config
   - Add `await` to `convertToModelMessages()` calls
   - Update provider imports if using Google/Vertex

4. **Test & Validate**:
   - Run test suite
   - Verify tool calls still work
   - Check structured output generation
   - Validate streaming behavior

### 8.3 Backward Compatibility

- ✅ Core API mostly stable (generateText, streamText)
- ✅ Tool calling patterns unchanged
- ✅ Message format preserved
- ⚠️ Structured output API significantly changed
- ⚠️ Agent class renamed and simplified
- ⚠️ Some provider-specific features updated

**Good News**: For basic text generation and tool calling, minimal changes needed. Mainly structured output and agent code require updates.

---

## 9. BEST PRACTICES & PATTERNS

### 9.1 Agent Design Patterns

✅ **Recommended**:
- Use `ToolLoopAgent` for reusable agent definitions
- Set reasonable `maxSteps` (default 20, often 3-5 sufficient)
- Keep tool descriptions detailed and specific
- Implement tool callbacks for monitoring
- Use tool result validation before returning to model
- Store agent configuration in reusable objects

❌ **Avoid**:
- Unlimited `stopWhen` conditions (can cause infinite loops)
- Generic tool descriptions ("do something")
- Exposing sensitive operations without approval gates
- Ignoring tool execution errors in production
- Mixing tool logic with application state

### 9.2 Tool Definition Best Practices

```typescript
// ✅ Good: Detailed, specific, well-documented
const tools = {
  weatherAPI: tool({
    description: 'Get current weather conditions for a specific city. Returns temperature (°F), humidity (%), wind speed (mph), and weather condition. Supports cities worldwide.',
    inputSchema: z.object({
      city: z.string()
        .describe('City name (e.g., "San Francisco", "Tokyo")'),
      units: z.enum(['celsius', 'fahrenheit'])
        .describe('Temperature unit (default: fahrenheit)')
    }),
    execute: async ({ city, units }) => {
      // Actual API call
      const data = await weatherAPI.current({ city })
      return {
        city,
        temperature: data.temp,
        condition: data.condition,
        humidity: data.humidity,
        windSpeed: data.wind
      }
    }
  })
}

// ❌ Bad: Vague, no documentation
const tools = {
  get: tool({
    description: 'get info',
    inputSchema: z.object({ q: z.string() }),
    execute: async ({ q }) => fetch(url + '?q=' + q)
  })
}
```

### 9.3 Production Resilience

```typescript
// ✅ Production-ready pattern
const result = await generateText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  prompt: userInput,
  tools: {
    apiCall: tool({
      description: '...',
      inputSchema: schema,
      execute: async (params) => {
        try {
          const response = await fetch(url, { timeout: 5000 })
          if (!response.ok) throw new Error(`Status ${response.status}`)
          return await response.json()
        } catch (error) {
          // Let SDK convert to tool-error, agent can retry
          console.error('Tool error:', error)
          throw error
        }
      },
      needsApproval: params.isSensitive  // Gate dangerous operations
    })
  },
  stopWhen: ({ reason }) => reason === 'text',
  maxSteps: 5,
  experimental_telemetry: { isEnabled: true },
  onStepFinish: (step) => {
    console.log(`Step ${step.stepNumber} completed`)
  }
})
```

### 9.4 Type Safety

```typescript
// ✅ Leverage TypeScript for type safety
import { z } from 'zod'
import { Tool, generateText } from 'ai'

const weatherSchema = z.object({
  city: z.string(),
  units: z.enum(['celsius', 'fahrenheit'])
})

type WeatherInput = z.infer<typeof weatherSchema>

const weatherTool: Tool = tool({
  description: 'Get weather',
  inputSchema: weatherSchema,
  execute: async (input: WeatherInput) => {
    // TypeScript enforces input shape
    return { temp: 72, condition: 'sunny' }
  }
})

// Function result is also typed
const result = await generateText({
  model,
  prompt: '...',
  tools: { weather: weatherTool }
})

// Type-safe access to results
const text: string = result.text
const finishReason: 'stop' | 'maxSteps' | 'toolCalls' = result.finishReason
```

---

## 10. UNRESOLVED QUESTIONS & KNOWLEDGE GAPS

1. **Performance Characteristics**: How do different agent configurations (maxSteps, prepareStep callbacks) impact latency/cost? No benchmarking docs found.

2. **Streaming Tool Results**: When using `streamText` with tools, can individual tool results stream back as they complete, or does SDK wait for all tools in a step to finish?

3. **Token Optimization**: Best practices for managing token usage in long multi-step agents. SDK docs don't provide token budgeting strategies.

4. **MCP Integration Details**: How does OAuth flow work with MCP servers in real-world scenarios? Need concrete examples.

5. **Provider-Specific Optimizations**: What model-specific features (reasoning, extended thinking) integrate with agent loops? Anthropic docs mention thinking tokens but integration unclear.

6. **Error Recovery Strategies**: When should agents use fallback tools vs. retry? No decision guidance in docs.

7. **Production Scaling**: How to scale agents for high concurrency? No scaling patterns documented.

8. **Tool Execution Timeout Handling**: SDK automatically handles tool timeouts? Need clarification.

---

## 11. REFERENCES & SOURCES

### Official Documentation
- [Vercel AI SDK - Introduction](https://ai-sdk.dev/docs/introduction)
- [Tool Calling & Agent Patterns](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [generateText Reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text)
- [streamText Reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text)
- [Agents Foundations](https://ai-sdk.dev/docs/foundations/agents)
- [ToolLoopAgent Class](https://ai-sdk.dev/docs/foundations/agents)
- [Structured Data Extraction](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [generateObject (Deprecated)](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object)

### AI SDK 6.0 Release
- [AI SDK 6 Release Blog](https://vercel.com/blog/ai-sdk-6)
- [Migration Guide 5.x to 6.0](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0)

### Provider Documentation
- [Anthropic Provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)
- [OpenAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai)
- [Google Provider](https://ai-sdk.dev/providers/ai-sdk-providers/google)
- [Custom Providers](https://ai-sdk.dev/providers/community-providers/custom-providers)

### Advanced Patterns
- [RAG Pattern](https://vercel.com/kb/guide/what-is-rag)
- [RAG Cookbook](https://ai-sdk.dev/cookbook/node/retrieval-augmented-generation)
- [Guardrails & Middleware](https://ai-sdk.dev/docs/ai-sdk-core/middleware)
- [Telemetry & Observability](https://ai-sdk.dev/docs/ai-sdk-core/telemetry)
- [Restate + Vercel AI for Durable Agents](https://docs.restate.dev/tour/vercel-ai-agents)

### Getting Started Guides
- [AI Agents on Vercel](https://vercel.com/kb/guide/ai-agents)
- [Building AI Agents with Vercel](https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk)
- [Vercel Academy - Tool Use](https://vercel.com/academy/ai-sdk/tool-use)

---

**Report Compiled**: 2026-03-01
**Status**: Research Complete - Ready for Implementation Planning
**Next Steps**: Use findings to design agent architecture for Well payment SDK integration

