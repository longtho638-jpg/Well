# n8n Node & Trigger Architecture — Agent System Mapping

**Date:** 2026-03-01
**Focus:** n8n node/trigger patterns mapped to AI Agent system design
**Sources:** n8n-io/n8n GitHub, packages/workflow/src/Interfaces.ts, packages/core/src/nodes-loader/

---

## 1. INodeType Interface

Every n8n node implements `INodeType`. It's the single contract all nodes satisfy.

```typescript
export interface INodeType {
  description: INodeTypeDescription;  // metadata, UI config, properties

  // Choose one execution mode:
  execute?(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
  trigger?(this: ITriggerFunctions): Promise<ITriggerResponse | undefined>;
  poll?(this: IPollFunctions): Promise<INodeExecutionData[][] | null>;
  webhook?(this: IWebhookFunctions): Promise<IWebhookResponseData>;

  // Webhook lifecycle (for external service registration)
  webhookMethods?: {
    [webhookName: string]: {
      checkExists(this: IHookFunctions): Promise<boolean>;
      create(this: IHookFunctions): Promise<boolean>;
      delete(this: IHookFunctions): Promise<boolean>;
    };
  };

  // Dynamic helpers (listSearch, resourceLocator, credentialTest)
  methods?: {
    listSearch?: { [fnName: string]: (this: ILoadOptionsFunctions, ...) => Promise<...> };
    credentialTest?: { [fnName: string]: ICredentialTestFunction };
    localResourceMapping?: { ... };
  };
}
```

### INodeTypeDescription (key fields)

```typescript
export interface INodeTypeDescription {
  displayName: string;        // UI label
  name: string;               // programmatic key, e.g. 'githubTrigger'
  group: string[];            // ['trigger'] | ['transform'] | ['output']
  version: number | number[]; // supports multi-version nodes
  description: string;
  subtitle?: string;          // dynamic expression shown in node header
  icon?: string | { light: string; dark: string };
  inputs: string[];           // ['main'] or [] for triggers
  outputs: string[];          // ['main'] or multiple for branching
  credentials?: INodeCredentials[];
  webhooks?: IWebhookDescription[];
  properties: INodeProperties[];   // all configurable fields
}
```

### Agent Mapping

| n8n Concept | Agent Equivalent |
|---|---|
| `INodeType` | Agent capability/skill definition |
| `description` | Agent manifest (metadata + schema) |
| `execute()` | Agent `run()` / tool invocation |
| `trigger()` | Agent event listener / sensor |
| `poll()` | Agent scheduled probe |
| `webhook()` | Agent HTTP event handler |
| `methods.listSearch` | Agent dynamic option resolver |

---

## 2. Node Properties (INodeProperties)

All node inputs are described declaratively via `INodeProperties[]`. The UI renders from this schema.

```typescript
export interface INodeProperties {
  displayName: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'options' | 'multiOptions'
      | 'collection' | 'fixedCollection' | 'json' | 'code'
      | 'dateTime' | 'color' | 'file' | 'hidden' | 'notice'
      | 'resourceLocator';
  default: any;
  description?: string;
  required?: boolean;
  placeholder?: string;

  // Conditional visibility
  displayOptions?: {
    show?: { [propertyName: string]: Array<string | number | boolean | null> };
    hide?: { [propertyName: string]: Array<string | number | boolean | null> };
  };

  // For 'options' / 'multiOptions'
  options?: Array<{ name: string; value: string | number; description?: string }>;

  // For 'resourceLocator': allows URL / list / manual input modes
  modes?: INodePropertyMode[];

  // Declarative routing (instead of execute())
  routing?: {
    request?: DeclarativeRestApiSettings.HttpRequestOptions;
    send?: { type: 'body' | 'query'; property: string };
    output?: { postReceive?: PostReceiveAction[] };
  };
}
```

### Declarative vs Programmatic Nodes

- **Programmatic**: implements `execute()` manually — full control, HTTP + logic in code
- **Declarative**: uses `routing` on each property — n8n auto-generates HTTP calls, no `execute()` needed

```typescript
// Declarative property example
{
  displayName: 'User ID',
  name: 'userId',
  type: 'string',
  routing: {
    request: { method: 'GET', url: '/users/{{$value}}' },
    output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] }
  }
}
```

### Resource/Operation Pattern (complex nodes)

Standard pattern for API nodes with multiple resources:
```
resource: 'user' | 'post' | 'comment'
operation: 'create' | 'get' | 'update' | 'delete' | 'list'
```
Each `operation` property uses `displayOptions.show` to appear only when `resource` matches.

### Agent Mapping

| n8n Concept | Agent Equivalent |
|---|---|
| `INodeProperties[]` | Agent input schema / JSON Schema for tool calls |
| `displayOptions.show/hide` | Conditional parameter visibility in agent UI |
| `resourceLocator` mode | Dynamic resource picker (list from API vs manual ID) |
| `routing` field | Auto-HTTP: declarative agent HTTP action |
| resource/operation pattern | Agent capability matrix (entity × action) |

---

## 3. Trigger Nodes: Polling vs Webhook

### 3.1 ITriggerFunctions (for `trigger()` method)

```typescript
export interface ITriggerFunctions extends FunctionsBase {
  emit(data: INodeExecutionData[][], responsePromise?: IDeferredPromise<...>): void;
  emitError(error: Error, responsePromise?: IDeferredPromise<...>): void;
  getActivationMode(): WorkflowActivateMode; // 'init' | 'activate' | 'leadershipChange'
  helpers: SchedulingFunctions & TriggerHelperFunctions;
}

// Scheduling helper
interface SchedulingFunctions {
  registerCron(cron: Cron, onTick: () => void): void;
}
```

### 3.2 Polling Trigger Pattern

```typescript
// IPollFunctions context
poll?(this: IPollFunctions): Promise<INodeExecutionData[][] | null>

// ScheduleTrigger-style implementation
async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
  const { cronExpression } = getScheduleConfig(this);

  const executePoll = async () => {
    const items = await fetchNewItems();
    if (items.length) this.emit([items]);
  };

  if (this.getActivationMode() !== 'manual') {
    this.helpers.registerCron({ cronExpression }, executePoll);
  }

  // Return manual trigger function for test mode
  return {
    manualTriggerFunction: executePoll,
    closeFunction: async () => { /* cleanup cron */ }
  };
}
```

Key: `getActivationMode()` distinguishes test (`manual`) from production (`activate`/`init`).

### 3.3 Webhook Trigger Pattern

```typescript
// IWebhookFunctions context
webhook?(this: IWebhookFunctions): Promise<IWebhookResponseData>

// Declared in description.webhooks
webhooks: [{
  name: 'default',
  httpMethod: 'POST',
  responseMode: 'onReceived',  // | 'lastNode' | 'responseNode' | 'streaming'
  path: 'webhook'
}]

// Implementation
async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  const body = this.getBodyData();
  const headers = this.getHeaderData();

  // Verify signature
  const secret = workflowStaticData.webhookSecret;
  if (!verifySignature(body, headers, secret)) {
    this.getResponseObject().status(401).send();
    return { noWebhookResponse: true };
  }

  return {
    workflowData: [[{ json: { body, headers } }]]
  };
}
```

### 3.4 webhookMethods: External Registration Lifecycle

For services that need n8n to register a webhook URL (GitHub, Stripe, etc.):

```typescript
webhookMethods = {
  default: {
    // Called before create — prevents duplicate registration
    async checkExists(this: IHookFunctions): Promise<boolean> {
      const { webhookId } = this.getWorkflowStaticData('node');
      if (!webhookId) return false;
      try {
        await externalApi.getWebhook(webhookId);
        return true;
      } catch { return false; }
    },

    // Called when workflow activates
    async create(this: IHookFunctions): Promise<boolean> {
      const webhookUrl = this.getNodeWebhookUrl('default');
      const secret = generateSecret();
      const { id } = await externalApi.createWebhook({ url: webhookUrl, secret });

      const staticData = this.getWorkflowStaticData('node');
      staticData.webhookId = id;
      staticData.webhookSecret = secret;
      return true;
    },

    // Called when workflow deactivates
    async delete(this: IHookFunctions): Promise<boolean> {
      const { webhookId } = this.getWorkflowStaticData('node');
      await externalApi.deleteWebhook(webhookId);
      delete staticData.webhookId;
      return true;
    }
  }
};
```

### Agent Mapping

| n8n Concept | Agent Equivalent |
|---|---|
| `trigger()` + `emit()` | Agent event sensor that publishes to event bus |
| `poll()` + registerCron | Agent scheduled job (cron-based probe) |
| `webhook()` | Agent HTTP listener / inbound event handler |
| `webhookMethods.create/delete` | Agent lifecycle hooks (register/deregister on external service) |
| `workflowStaticData` | Agent persistent state store (cross-session) |
| `activationMode` | Agent deployment context (init vs manual test) |
| `responseMode` | Agent response strategy (sync vs async vs streaming) |

---

## 4. Node Execution: execute() Deep Dive

```typescript
// IExecuteFunctions — available as `this` in execute()
interface IExecuteFunctions extends FunctionsBase {
  // Input data
  getInputData(inputIndex?: number, inputName?: string): INodeExecutionData[];
  getNodeParameter(paramName: string, itemIndex: number, fallback?: any): NodeParameterValueType;
  getInputSourceData(inputIndex?: number, inputName?: string): ISourceData;

  // Output
  addOutputData(connectionType: NodeConnectionType, currentNodeRunIndex: number, data: ...): void;

  // Credentials
  getCredentials<T>(type: string, itemIndex?: number): Promise<T>;

  // Helpers
  helpers: {
    httpRequest(options: IHttpRequestOptions): Promise<any>;
    httpRequestWithAuthentication(credType: string, options: ...): Promise<any>;
    returnJsonArray(items: IDataObject[]): INodeExecutionData[];
    prepareBinaryData(buffer: Buffer, filename?: string, mimeType?: string): Promise<IBinaryData>;
    getBinaryDataBuffer(itemIndex: number, propertyName: string): Promise<Buffer>;
    constructExecutionMetaData(items: INodeExecutionData[], ...): INodeExecutionData[];
    // ... deduplication, assertions, SSH, etc.
  };

  continueOnFail(error?: Error): boolean;
}
```

### INodeExecutionData: the universal item format

```typescript
interface INodeExecutionData {
  json: IDataObject;           // main JSON payload
  binary?: IBinaryKeyData;     // files/images: { [key]: IBinaryData }
  pairedItem?: IPairedItem;    // tracks item lineage through workflow
  error?: NodeApiError;        // per-item error (for continueOnFail)
}
```

### Output Array Shape

`execute()` returns `INodeExecutionData[][]`:
- Outer array = output connections (index 0 = main, 1 = second output, etc.)
- Inner array = items on that connection

```typescript
// Single output, 3 items
return [[item1, item2, item3]];

// Two outputs (e.g. true/false branches)
return [[trueItems], [falseItems]];
```

### Agent Mapping

| n8n Concept | Agent Equivalent |
|---|---|
| `getInputData()` | Agent reads incoming messages/context |
| `getNodeParameter()` | Agent reads configuration/prompt params |
| `getCredentials()` | Agent fetches auth token from secret store |
| `helpers.httpRequest()` | Agent tool: external API call |
| `INodeExecutionData` | Agent message envelope (payload + metadata) |
| `binary` field | Agent file/blob attachment handling |
| `pairedItem` | Agent message lineage / trace |
| `INodeExecutionData[][]` | Agent multi-output routing (parallel branches) |
| `continueOnFail()` | Agent error recovery / graceful degradation |

---

## 5. Credential System

### ICredentialType Interface

```typescript
interface ICredentialType {
  name: string;           // 'githubApi', 'openAiApi', etc.
  displayName: string;
  icon?: Icon;
  documentationUrl?: string;
  extends?: string[];     // inherit from parent credential type
  genericAuth?: boolean;

  properties: INodeProperties[];  // fields user fills in (apiKey, clientId, etc.)

  authenticate?: IAuthenticate;   // how to inject creds into HTTP requests
  preAuthentication?: (this: IHttpRequestHelper, creds: ICredentialDataDecryptedObject) => Promise<IDataObject>;

  test?: ICredentialTestRequest;  // auto-test endpoint
  httpRequestNode?: ICredentialHttpRequestNode;
  supportedNodes?: string[];
}
```

### Authentication Injection

```typescript
// Generic auth: attach to all requests
authenticate: IAuthenticateGeneric = {
  type: 'generic',
  properties: {
    headers: { Authorization: '=Bearer {{$credentials.apiKey}}' }
    // or: qs: { api_key: '={{$credentials.apiKey}}' }
  }
};

// Custom auth function
authenticate: IAuthenticate = async (credentials, requestOptions) => {
  requestOptions.headers['X-API-Key'] = credentials.apiKey;
  return requestOptions;
};
```

### Credential Testing

```typescript
test: ICredentialTestRequest = {
  request: {
    baseURL: 'https://api.example.com',
    url: '/me',
    method: 'GET'
  },
  rules: [
    { type: 'responseSuccessBody', properties: { key: 'status', value: 'active', message: 'Invalid API key' } }
  ]
};
```

### OAuth2 Support

```typescript
// Node using OAuth2
credentials: [{
  name: 'githubOAuth2Api',
  required: true,
}]

// INodeProperties credentialTypes filter
{
  name: 'authentication',
  type: 'options',
  options: [
    { name: 'Access Token', value: 'accessToken' },
    { name: 'OAuth2', value: 'oAuth2' }
  ]
}

// In execute() — n8n handles token refresh automatically
const creds = await this.getCredentials<{ apiKey: string }>('githubApi');
```

### Storage: encrypted at rest

```typescript
// Stored in DB
interface ICredentialData {
  id?: string;
  name: string;
  data: string;  // AES-256 encrypted JSON blob
}

// Available in node execution
interface ICredentialDataDecryptedObject {
  [key: string]: string | number | boolean;
}
```

### Node declares credential requirements

```typescript
// In INodeTypeDescription
credentials: [
  {
    name: 'githubApi',
    required: true,
    displayOptions: { show: { authentication: ['accessToken'] } }
  },
  {
    name: 'githubOAuth2Api',
    required: true,
    displayOptions: { show: { authentication: ['oAuth2'] } }
  }
]
```

### Agent Mapping

| n8n Concept | Agent Equivalent |
|---|---|
| `ICredentialType` | Agent auth provider definition |
| `authenticate` | Agent request interceptor (inject auth headers) |
| `preAuthentication` | Agent token refresh hook |
| `test` endpoint | Agent health check for credentials |
| `extends` | Auth type inheritance (API key extends base type) |
| AES-256 encrypted storage | Agent secrets vault |
| `getCredentials<T>()` in execute | Agent fetches secret at runtime |
| OAuth2 flow | Agent OAuth dance (authorization_code + refresh_token) |

---

## 6. Node Discovery & Loading

### Package Convention

Any npm package with `n8n-nodes-*` naming is auto-discovered.

```json
// community-node/package.json
{
  "name": "n8n-nodes-my-integration",
  "version": "1.0.0",
  "n8n": {
    "nodes": [
      "dist/nodes/MyNode.node.js",
      "dist/nodes/MyTrigger.node.js"
    ],
    "credentials": [
      "dist/credentials/MyApi.credentials.js"
    ]
  },
  "peerDependencies": {
    "n8n-workflow": "^1.0.0",
    "n8n-core": "^1.0.0"
  }
}
```

### LazyPackageDirectoryLoader

Two-phase loading: metadata first, code on demand.

```
Phase 1 (startup): loadAll()
  → Read dist/known/nodes.json + dist/types/nodes.json
  → Populate: Map<name, { sourcePath, className }>
  → isLazyLoaded = true
  → NO require() calls yet

Phase 2 (execution): getNode(nodeType)
  → Check in-memory nodeTypes cache
  → If miss and isLazyLoaded:
      → require(sourcePath) — load single node
      → loadClassInIsolation(filePath, className)
      → Cache result
  → Return node instance
```

### Directory Scanning (LoadNodesAndCredentials)

```
Scan order:
1. n8n-nodes-base          (built-in nodes ~400+)
2. @n8n/n8n-nodes-langchain (AI/LLM nodes)
3. node_modules/n8n-nodes-* (community nodes, glob)
4. node_modules/@*/n8n-nodes-* (scoped community nodes)
5. N8N_CUSTOM_EXTENSIONS env var dirs (CustomDirectoryLoader)
6. instanceSettings.customExtensionDir
```

### Community Node Installation

```bash
# Runtime install via n8n API
POST /api/v1/community-packages
{ "name": "n8n-nodes-my-integration" }

# n8n does:
1. npm install n8n-nodes-my-integration
2. Dynamically load via LoadNodesAndCredentials.loadNpmModule()
3. Register in NodeTypes service
4. Available in workflow without restart
```

### Agent Mapping

| n8n Concept | Agent Equivalent |
|---|---|
| `n8n` field in package.json | Agent manifest registration |
| `n8n-nodes-*` naming | Agent package convention for auto-discovery |
| `LazyPackageDirectoryLoader` | Agent registry: index at startup, load on use |
| `LoadNodesAndCredentials` | Agent loader service / plugin manager |
| Community node npm install | Agent plugin marketplace (hot-install) |
| `dist/known/nodes.json` | Pre-built agent index for fast startup |
| Custom extension dirs | Agent local plugin development path |

---

## 7. Community Nodes Pattern

### Minimal community node structure

```
n8n-nodes-my-integration/
├── package.json           # n8n field required
├── tsconfig.json
├── index.js               # re-exports (optional)
├── dist/
│   ├── known/
│   │   ├── nodes.json     # enables lazy loading
│   │   └── credentials.json
│   ├── nodes/
│   │   └── MyNode.node.js
│   └── credentials/
│       └── MyApi.credentials.js
└── src/
    ├── nodes/
    │   ├── MyNode.node.ts
    │   └── MyNode.description.ts  # separate file for INodeProperties
    └── credentials/
        └── MyApi.credentials.ts
```

### dist/known/nodes.json (enables lazy loading)

```json
{
  "MyNode": {
    "className": "MyNode",
    "sourcePath": "dist/nodes/MyNode.node.js"
  }
}
```

### Typical community node TypeScript

```typescript
import { IExecuteFunctions, INodeType, INodeTypeDescription, INodeExecutionData } from 'n8n-workflow';

export class MyNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'My Integration',
    name: 'myNode',
    icon: 'file:myIcon.svg',
    group: ['transform'],
    version: 1,
    description: 'Does something useful',
    defaults: { name: 'My Integration' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'myApiCredentials', required: true }],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          { name: 'User', value: 'user' },
          { name: 'Post', value: 'post' }
        ],
        default: 'user'
      }
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0) as string;
    const creds = await this.getCredentials<{ apiKey: string }>('myApiCredentials');

    const results = await Promise.all(
      items.map(async (item, i) => {
        const data = await this.helpers.httpRequest({
          method: 'GET',
          url: `https://api.example.com/${resource}`,
          headers: { Authorization: `Bearer ${creds.apiKey}` }
        });
        return { json: data };
      })
    );

    return [results];
  }
}
```

---

## 8. Complete Agent System Mapping

### Architecture equivalences

```
n8n Concept                 → Agent System Equivalent
────────────────────────────────────────────────────────────────────
INodeType                   → Agent / Tool definition (capability unit)
INodeTypeDescription        → Agent manifest (schema, metadata)
INodeProperties             → Agent input/output schema (JSON Schema)
execute()                   → Agent.run() — main capability execution
trigger()                   → Event sensor — publishes to agent bus
poll()                      → Scheduled probe — cron-based data fetch
webhook()                   → HTTP listener — inbound event handler
webhookMethods              → Lifecycle hooks (register/deregister)

INodeExecutionData          → Agent message envelope
  .json                     →   payload (typed data)
  .binary                   →   attachments (files/blobs)
  .pairedItem               →   trace/lineage reference
INodeExecutionData[][]      → Multi-output routing (parallel branches)

ICredentialType             → Auth provider definition
authenticate                → Request interceptor (auth injection)
getCredentials()            → Secret fetch at runtime

LoadNodesAndCredentials     → Agent plugin manager / registry
LazyPackageDirectoryLoader  → Lazy agent loader (index then load)
n8n package.json field      → Agent package manifest
Community nodes             → Agent plugin ecosystem

workflowStaticData          → Agent persistent state (cross-session KV)
getActivationMode()         → Deployment context (init/test/production)
IHookFunctions              → Lifecycle context (checkExists/create/delete)
```

### Agent Pipeline = n8n Workflow

```
n8n Workflow structure:
  Trigger Node → Transform Node → Action Node → Output Node
         ↕ INodeExecutionData[][] flows between nodes

Agent Pipeline equivalent:
  Event Sensor → Reasoner Agent → Tool Agent → Response Agent
         ↕ Message envelopes flow through pipeline
```

### Key design principles from n8n to adopt

1. **Single interface, multiple execution modes** — `INodeType` with optional execute/trigger/poll/webhook lets one capability definition cover all interaction patterns. Agents should have one `AgentType` interface similarly.

2. **Declarative schema for inputs** — `INodeProperties[]` with `displayOptions` for conditional visibility is powerful. Agent tool schemas should be similarly declarative (JSON Schema or equivalent).

3. **Lifecycle hooks for external integrations** — `webhookMethods.checkExists/create/delete` pattern is clean. Any agent that registers with external systems needs this idempotent lifecycle.

4. **`workflowStaticData` for cross-run state** — Simple persistent KV per node instance. Agents need equivalent: session memory that survives restart.

5. **Lazy loading** — Don't load all agents at startup. Index → load on first call. Critical at scale (n8n has 400+ nodes; an agent system will have many tools).

6. **Credential separation** — Auth defined separately from node logic, injected via context. Agents should not embed auth in capability code.

7. **`continueOnFail` + per-item errors** — Item-level error handling (not whole-batch failure). Agent pipelines should support partial success.

8. **Package naming convention** — `n8n-nodes-*` enables zero-config discovery. Agent plugins should follow `agent-tool-*` or `@agencyos/agent-*` pattern.

---

## Unresolved Questions

1. How does n8n handle agent-to-agent communication (sub-workflows) — does the `executeWorkflow()` helper fully cover multi-agent orchestration or does it have limitations?
2. n8n's `workflowStaticData` is workflow-scoped. For agent systems, do we need instance-scoped vs session-scoped vs user-scoped persistence?
3. Community node hot-reload: n8n requires restart for some changes — is the `loadNpmModule()` truly live or partial?
4. How does n8n's multi-main (HA) mode handle webhook registration — is it deduplicated across instances?
5. The `pairedItem` lineage tracking — how does this map to agent observability/tracing (OpenTelemetry spans)?
6. n8n's declarative routing generates HTTP calls automatically — is there an analog for agent tool calls (function calling schemas)?

---

*Sources: n8n-io/n8n GitHub — packages/workflow/src/Interfaces.ts, packages/core/src/nodes-loader/, packages/cli/src/LoadNodesAndCredentials.ts, n8n docs*
