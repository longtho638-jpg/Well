# Vercel AI SDK Architecture Research

## 1. useChat() Hook — Streaming Chat State
**Problem:** Managing chat state (messages, loading, error, streaming) is complex boilerplate.
**Solution:** `useChat()` hook handles everything: message array, input state, submit handler, streaming response, loading/error states. One hook = complete chat UI state.
**API:** `const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({ api: '/api/chat' })`.
**Key decisions:** Messages array auto-updates as tokens stream. Optimistic UI (user message shows immediately). Custom fetch for auth headers. Callbacks: onFinish, onError, onResponse.
**Well lesson:** Create `useAgentChat()` hook for distributor-agent interactions. Handles Gemini streaming, message history, loading states. One hook per agent (Coach, Copilot).

## 2. AI SDK Core — Provider Abstraction
**Problem:** Each LLM provider has different API format, streaming protocol, response schema.
**Solution:** `generateText()` / `streamText()` / `generateObject()` with provider parameter. Provider = wrapper (openai(), anthropic(), google()). Switch provider = one line change.
**API:** `const { text } = await generateText({ model: google('gemini-2.0-flash'), prompt: '...' })`.
**Key decisions:** Provider factory pattern. Model = provider + model name. Unified response format (text, usage, finishReason). Middleware support (logging, caching).
**Well lesson:** AI gateway with provider factory. `createProvider('gemini')` returns typed provider. Edge Function uses unified generateText/streamText API.

## 3. Structured Output — Zod Schemas
**Problem:** LLM text output is unstructured. Parsing unreliable. No type safety.
**Solution:** `generateObject({ schema: z.object({...}) })` forces LLM to return valid JSON matching Zod schema. Type-safe output guaranteed. Partial streaming for incremental structured data.
**API:** `const { object } = await generateObject({ model, schema: z.object({ advice: z.string(), confidence: z.number() }) })`.
**Key decisions:** Zod schema = both validation AND type inference. Retry on invalid output (auto-correct). Partial object streaming for large structures.
**Well lesson:** Agent responses as structured objects (not raw text). Coach response = { advice, actionItems, confidence }. Copilot response = { suggestion, objectionHandler, nextStep }. Type-safe throughout.

## 4. Tool Calling — Agent Actions
**Problem:** LLMs can only generate text. Need to interact with systems (DB, API, calculations).
**Solution:** Define tools with Zod parameter schemas. LLM decides which tool to call. SDK executes tool, returns result to LLM. Multi-step chains (LLM → tool → LLM → tool → final answer).
**API:** `tools: { getCommission: { parameters: z.object({ period: z.string() }), execute: async ({ period }) => db.query(...) } }`.
**Key decisions:** Tool = name + description + Zod params + execute function. LLM chooses tools based on user query. Multi-step = automatic (maxSteps configurable). Tool results fed back to LLM.
**Well lesson:** Agents get tools: queryCommissions, getTeamMetrics, lookupProduct, calculateTax. LLM decides which to use based on distributor question. Multi-step reasoning enabled.

## 5. Streaming UI — Token-by-Token Rendering
**Problem:** LLM responses take 2-10s. Users wait staring at spinner.
**Solution:** Stream tokens as they generate. React components render incrementally. Markdown support. Code highlighting. Loading indicators per-message.
**API:** `streamText()` returns ReadableStream. Frontend consumes with `useChat()` auto-streaming.
**Key decisions:** Server-Sent Events (SSE) transport. Backpressure handling. Abort support (cancel generation). Streaming structured data (partial JSON).
**Well lesson:** Stream agent responses token-by-token. Immediate feedback for distributor. Markdown rendering for formatted advice. Cancel button for long responses.
