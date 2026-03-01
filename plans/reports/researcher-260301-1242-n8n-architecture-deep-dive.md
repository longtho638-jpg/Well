# Research Report: n8n Architecture Deep Dive

**Date:** 2026-03-01
**Sources:** n8n GitHub (n8n-io/n8n), direct codebase inspection
**Packages inspected:** `packages/workflow`, `packages/core`, `packages/cli`

---

## Table of Contents

1. [Monorepo Structure](#1-monorepo-structure)
2. [Node System](#2-node-system)
3. [Workflow Execution Engine](#3-workflow-execution-engine)
4. [Credential Management](#4-credential-management)
5. [Webhook System](#5-webhook-system)
6. [Queue System (Bull/BullMQ)](#6-queue-system)
7. [Expression Engine](#7-expression-engine)
8. [Error Handling & Recovery](#8-error-handling--recovery)
9. [Key Design Patterns](#9-key-design-patterns)
10. [Adaptable Patterns Summary](#10-adaptable-patterns-summary)
11. [Unresolved Questions](#unresolved-questions)

---

## 1. Monorepo Structure

```
n8n/
├── packages/
│   ├── workflow/          # Core types, interfaces, Workflow class, expression engine
│   │   └── src/
│   │       ├── interfaces.ts       # ALL major TypeScript interfaces
│   │       ├── workflow.ts         # Workflow class (graph + node registry)
│   │       ├── expression.ts       # Expression evaluator + sandbox
│   │       ├── workflow-data-proxy.ts  # $node, $json etc context builder
│   │       └── run-execution-data/ # Versioned execution state structure
│   │
│   ├── core/              # Execution engine, credentials, binary data
│   │   └── src/
│   │       ├── execution-engine/
│   │       │   ├── workflow-execute.ts    # Main execution loop
│   │       │   ├── execution-lifecycle-hooks.ts  # Hook system
│   │       │   ├── triggers-and-pollers.ts
│   │       │   └── node-execution-context/  # Per-node context objects
│   │       ├── credentials.ts      # Encrypt/decrypt credentials
│   │       └── encryption/cipher.ts # AES-256-CBC cipher
│   │
│   └── cli/               # App server: REST API, webhook server, queue
│       └── src/
│           ├── active-workflow-manager.ts  # Registers triggers/webhooks
│           ├── workflow-runner.ts          # Launch executions (queue vs direct)
│           ├── scaling/                   # Bull queue + worker
│           ├── webhooks/                  # Webhook HTTP handling
│           └── execution-lifecycle/       # Hooks for saving to DB, push updates
```

**Dependency direction:** `workflow` (no deps) ← `core` ← `cli`

---

## 2. Node System

### 2.1 INode — Instance in a Workflow

```typescript
// packages/workflow/src/interfaces.ts
export interface INode {
  id: string;
  name: string;          // unique within workflow
  type: string;          // e.g. "n8n-nodes-base.httpRequest"
  typeVersion: number;
  position: [number, number];
  disabled?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;     // default 3
  waitBetweenTries?: number; // ms
  alwaysOutputData?: boolean;
  continueOnFail?: boolean;
  onError?: OnError;     // 'stopWorkflow' | 'continueRegularOutput' | 'continueErrorOutput'
  parameters: INodeParameters;
  credentials?: INodeCredentials;
  webhookId?: string;
}
```

### 2.2 INodeType — The Node Implementation

```typescript
export interface INodeType {
  description: INodeTypeDescription;  // static metadata

  // Execution methods — implement ONE based on node behavior:
  execute?(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
  poll?(this: IPollFunctions): Promise<INodeExecutionData[][] | null>;
  trigger?(this: ITriggerFunctions): Promise<ITriggerResponse | undefined>;
  webhook?(this: IWebhookFunctions): Promise<IWebhookResponseData>;
  supplyData?(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;  // AI tools

  methods?: {
    loadOptions?: { [key: string]: (this: ILoadOptionsFunctions) => Promise<INodePropertyOptions[]> };
    credentialTest?: { [fn: string]: ICredentialTestFunction };
  };
  webhookMethods?: { ... };
}
```

### 2.3 INodeTypeDescription — Static Metadata

```typescript
export interface INodeTypeDescription extends INodeTypeBaseDescription {
  version: number | number[];
  defaults: NodeDefaults;   // { name, color }
  inputs: Array<NodeConnectionType | INodeInputConfiguration> | ExpressionString;
  outputs: Array<NodeConnectionType | INodeOutputConfiguration> | ExpressionString;
  properties: INodeProperties[];      // UI form fields
  credentials?: INodeCredentialDescription[];
  polling?: true;
  webhooks?: IWebhookDescription[];
  hooks?: {
    activate?: INodeHookDescription[];    // called on workflow activation
    deactivate?: INodeHookDescription[];  // called on workflow deactivation
  };
  triggerPanel?: TriggerPanelDefinition | boolean;
}
```

### 2.4 Node Types by Execution Method

| Type | Interface | When used |
|------|-----------|-----------|
| **Regular** | `IExecuteFunctions` | HTTP requests, transforms, etc. |
| **Trigger** | `ITriggerFunctions` | Long-lived listeners (WebSocket, event emitters) |
| **Poll** | `IPollFunctions` | Scheduled polling (e.g. check RSS every 5min) |
| **Webhook** | `IWebhookFunctions` | Handle inbound HTTP to registered URL |
| **Supply Data** | `ISupplyDataFunctions` | AI tool nodes (LangChain integration) |

### 2.5 Data Unit: INodeExecutionData

```typescript
// The atom of data flowing between nodes
export interface INodeExecutionData {
  json: IDataObject;       // { [key: string]: any } — always present
  binary?: IBinaryData;    // optional file attachments
  pairedItem?: IPairedItemData | IPairedItemData[] | number;
  metadata?: { subExecution?: RelatedExecution };
  error?: NodeApiError | NodeOperationError;
}

// Nodes always receive/return arrays-of-arrays:
// INodeExecutionData[][] — outer = output branch, inner = items on that branch
```

### 2.6 Context Functions (per-node function injection)

Context objects give nodes access to: input data, credentials, helpers, emit callbacks:

```typescript
// Execute nodes get ALL input items as a batch
export interface IExecuteFunctions {
  getInputData(inputIndex?: number, inputName?: string): INodeExecutionData[];
  getNodeParameter(parameterName: string, itemIndex: number, fallback?: any): NodeParameterValueType;
  getCredentials<T extends object>(type: string): Promise<T>;
  helpers: {
    httpRequest(options: IHttpRequestOptions): Promise<any>;
    returnJsonArray(data: IDataObject | IDataObject[]): INodeExecutionData[];
    // ...many more
  };
}

// Trigger nodes can emit data at any time
export interface ITriggerFunctions {
  emit(data: INodeExecutionData[][], responsePromise?: IDeferredPromise<...>): void;
  emitError(error: Error): void;
  getCredentials<T>(type: string): Promise<T>;
  helpers: { ... };
}

// Webhook nodes receive the HTTP request
export interface IWebhookFunctions {
  getBodyData(): IDataObject;
  getHeaderData(): IncomingHttpHeaders;
  getQueryData(): object;
  getParamsData(): object;
  getCredentials<T>(type: string): Promise<T>;
  getNodeWebhookUrl(name: string): string | undefined;
}
```

---

## 3. Workflow Execution Engine

### 3.1 IRunExecutionData — Execution State

```typescript
// packages/workflow/src/run-execution-data/run-execution-data.v1.ts
export interface IRunExecutionDataV1 {
  version: 1;
  startData?: {
    destinationNode?: IDestinationNode;  // stop at this node
    runNodeFilter?: string[];             // whitelist of allowed nodes
  };
  resultData: {
    error?: ExecutionError;
    runData: IRunData;         // { [nodeName]: ITaskData[] } — completed nodes
    pinData?: IPinData;        // mock data for nodes
    lastNodeExecuted?: string;
  };
  executionData?: {
    nodeExecutionStack: IExecuteData[];  // what to run next (BFS queue)
    waitingExecution: IWaitingForExecution;   // nodes waiting for merging inputs
    waitingExecutionSource: IWaitingForExecutionSource | null;
    contextData: IExecuteContextData;    // node-level static context
  };
  waitTill?: Date;   // for "Wait" nodes
  pushRef?: string;  // frontend WebSocket channel
}

// ITaskData — result of one node run
export interface ITaskData {
  startTime: number;
  executionTime: number;
  executionStatus?: ExecutionStatus;
  data?: ITaskDataConnections;  // { main: INodeExecutionData[][] }
  error?: ExecutionError;
  source?: ITaskDataConnectionsSource;
}

// IRunData — completed node outputs, indexed by node name + run index
type IRunData = { [nodeName: string]: ITaskData[] };
```

### 3.2 WorkflowExecute — Core Loop

Located: `packages/core/src/execution-engine/workflow-execute.ts`

```
WorkflowExecute.run(options)
  │
  ├─ Builds initial nodeExecutionStack: [{ node: startNode, data: { main: [[{json:{}}]] } }]
  ├─ Calls processRunExecutionData(workflow)
  │
  └── processRunExecutionData() → PCancelable<IRun>
        ├── LOOP while nodeExecutionStack.length > 0:
        │   ├── Pop next IExecuteData from stack
        │   ├── Check if node is disabled → skip
        │   ├── Check runNodeFilter → skip if not allowed
        │   ├── Check incomingConnectionIsEmpty → handle merge nodes
        │   ├── Call executeNode(node, inputData, runIndex)
        │   │     ├── await hooks.nodeExecuteBefore(nodeName)
        │   │     ├── instantiate context (ExecuteContext / PollContext / etc)
        │   │     ├── call nodeType.execute() / .poll() / etc
        │   │     ├── handle continueOnFail / alwaysOutputData
        │   │     └── await hooks.nodeExecuteAfter(nodeName, taskData)
        │   ├── Store result in resultData.runData[nodeName]
        │   └── Add connected child nodes to nodeExecutionStack
        └── Return IRun
```

**Key insight:** Execution is a BFS over the workflow DAG. `nodeExecutionStack` is the frontier. Nodes waiting for multiple inputs accumulate in `waitingExecution` until all branches arrive.

### 3.3 Partial Execution (Re-run from Node)

```typescript
// WorkflowExecute.runPartialWorkflow2()
// 1. Find trigger for the subgraph
// 2. Build DirectedGraph from workflow
// 3. findSubgraph(destination, trigger) — prune irrelevant nodes
// 4. cleanRunData — remove data from nodes downstream of dirty nodes
// 5. findStartNodes — find nodes with run data to start from
// 6. handleCycles — detect and resolve loops
// 7. recreateNodeExecutionStack — rebuild the execution frontier
// 8. processRunExecutionData — continue from rebuilt state
```

### 3.4 Execution Modes

```typescript
type WorkflowExecuteMode =
  | 'cli'         // command line
  | 'error'       // error workflow triggered
  | 'integrated'  // sub-workflow called by parent
  | 'internal'    // internal n8n process
  | 'manual'      // user clicked "Execute" in UI
  | 'retry'       // user retried failed execution
  | 'trigger'     // triggered by active trigger node
  | 'webhook'     // triggered by inbound webhook
  | 'evaluation'; // test runner
```

---

## 4. Credential Management

### 4.1 Storage & Encryption

**Algorithm:** AES-256-CBC with key derived from instance `encryptionKey` + random 8-byte salt.

```typescript
// packages/core/src/encryption/cipher.ts
@Service()
export class Cipher {
  encrypt(data: string | object, customKey?: string): string {
    const salt = randomBytes(8);
    const [key, iv] = this.getKeyAndIv(salt, customKey);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encrypted = cipher.update(JSON.stringify(data));
    // Prefix: "Salted__" (CryptoJS compatible) + salt + ciphertext
    return Buffer.concat([RANDOM_BYTES, salt, encrypted, cipher.final()]).toString('base64');
  }

  decrypt(data: string, customKey?: string): string {
    const input = Buffer.from(data, 'base64');
    const salt = input.subarray(8, 16);  // bytes 8-16 are salt
    const [key, iv] = this.getKeyAndIv(salt, customKey);
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([decipher.update(input.subarray(16)), decipher.final()]).toString('utf-8');
  }

  private getKeyAndIv(salt: Buffer, customKey?: string): [Buffer, Buffer] {
    const password = Buffer.concat([Buffer.from(encryptionKey, 'binary'), salt]);
    const hash1 = createHash('md5').update(password).digest();
    const hash2 = createHash('md5').update(Buffer.concat([hash1, password])).digest();
    const iv = createHash('md5').update(Buffer.concat([hash2, password])).digest();
    const key = Buffer.concat([hash1, hash2]);  // 32 bytes = AES-256
    return [key, iv];
  }
}
```

### 4.2 Credential Injection into Nodes

```typescript
// packages/core/src/credentials.ts
export class Credentials<T extends object = ICredentialDataDecryptedObject> extends ICredentials<T> {
  setData(data: T): void { this.data = this.cipher.encrypt(data); }
  getData(): T { return JSON.parse(this.cipher.decrypt(this.data!)); }
  getDataToSave(): ICredentialsEncrypted { return { id, name, type, data: this.data }; }
}
```

Nodes access credentials via `this.getCredentials<MyCredType>('myCredentialType')` inside `execute()`. The `ICredentialsHelper.getDecrypted()` method:
1. Fetches encrypted blob from DB
2. Decrypts with instance encryption key
3. Resolves any expressions in credential fields (e.g. `{{$env.MY_KEY}}`)
4. Calls `ICredentialType.authenticate()` to inject into request (add header, bearer token, etc.)

### 4.3 ICredentialType — Credential Definition

```typescript
export interface ICredentialType {
  name: string;
  displayName: string;
  properties: INodeProperties[];    // form fields shown in UI
  authenticate?: IAuthenticate;     // how to inject into requests
  test?: ICredentialTestRequest;    // endpoint to test validity
  extends?: string[];               // inherit fields from other credential types
  preAuthentication?: (helpers, credentials, typeName, node, expired) => Promise<...>;
}

// Generic injection example:
const authenticate: IAuthenticate = {
  type: 'generic',
  properties: {
    headers: { Authorization: '=Bearer {{$credentials.apiKey}}' },
  },
};
```

---

## 5. Webhook System

### 5.1 Webhook Lifecycle

```
1. ACTIVATE WORKFLOW
   ActiveWorkflowManager.addWebhooks(workflow)
     → for each webhookDescription in nodeType:
         webhookService.storeWebhook({ webhookPath, method, node, workflowId })
         → INSERT into webhook_entity table

2. INCOMING REQUEST
   WebhookServer (Express) → WebhookRequestHandler.handleRequest(req, res)
     → webhookManager.executeWebhook(req, res)
     → LiveWebhooks.executeWebhook() or WaitingWebhooks.executeWebhook()
       → look up webhook_entity by (path, method)
       → WorkflowRunner.run(workflowData, mode='webhook')
       → execute webhook node: nodeType.webhook.call(webhookContext)
         → node returns IWebhookResponseData { workflowData?, noWebhookResponse?, webhookResponse? }
       → send HTTP response back to caller

3. DEACTIVATE WORKFLOW
   → webhookService.deleteWorkflowWebhooks(workflowId)
```

### 5.2 IWebhookDescription

```typescript
export interface IWebhookDescription {
  name: string;             // 'default', 'setup'
  httpMethod: IHttpRequestMethods | IHttpRequestMethods[] | string;
  responseMode?: WebhookResponseMode;  // 'lastNode' | 'responseNode' | 'onReceived'
  path: string;             // URL path segment, can include :param
  isFullPath?: boolean;
  restartWebhook?: boolean; // for Wait node resumption
  ndvHideUrl?: boolean;
  ndvHideMethod?: boolean;
}
```

### 5.3 Webhook Types

| Manager | Path prefix | Use case |
|---------|-------------|----------|
| `LiveWebhooks` | `/webhook/` | Active workflows, permanent webhooks |
| `TestWebhooks` | `/webhook-test/` | Manual test runs in UI |
| `WaitingWebhooks` | `/webhook-waiting/` | Resume paused "Wait" nodes |
| `WaitingForms` | `/form-waiting/` | Resume form-based workflows |

### 5.4 IWebhookResponseData

```typescript
export interface IWebhookResponseData {
  workflowData?: INodeExecutionData[][];  // data to pass as trigger output
  webhookResponse?: any;                  // HTTP response body
  noWebhookResponse?: boolean;            // used for async/streaming responses
}
```

---

## 6. Queue System

### 6.1 Architecture Overview

```
Main Process                      Worker Process(es)
     │                                    │
     ├── WorkflowRunner.run()             │
     │     └── enqueueExecution()        │
     │           └── ScalingService      │
     │               .addJob(JobData)    │
     │                    │              │
     │               [Bull Queue]        │
     │               Redis ←─────────────┤
     │                    │              │
     │                    └─ Job picked ─┤
     │                       up by       │
     │                       worker      │
     │                           └── JobProcessor.processJob(job)
     │                                └── WorkflowRunner.runMainProcess()
     │                                      └── WorkflowExecute.run()
     │
     └── Poll for job-finished message via job.progress()
```

### 6.2 JobData — Queue Job Payload

```typescript
// packages/cli/src/scaling/scaling.types.ts
export type JobData = {
  workflowId: string;
  executionId: string;
  loadStaticData: boolean;
  pushRef?: string;        // frontend WebSocket for live updates
  restartExecutionId?: string;
};
```

### 6.3 ScalingService — Queue Setup

```typescript
// Uses Bull (v4, NOT BullMQ) backed by Redis
await this.queue = new BullQueue(QUEUE_NAME, {
  prefix: redisPrefix,
  settings: { maxStalledCount: 0 },  // n8n handles stall detection itself
  createClient: (type) => redisClientService.createClient({ type }),
});

// Worker side:
this.queue.process(JOB_TYPE_NAME, concurrency, async (job: Job) => {
  await this.jobProcessor.processJob(job);
});
```

### 6.4 Worker↔Main Communication

Communication happens via `job.progress()` messages (Bull's internal pubsub):

```typescript
// Worker → Main messages:
type JobMessage =
  | { kind: 'respond-to-webhook'; executionId; response; workerId }  // webhook reply
  | { kind: 'job-finished'; executionId; success; status; ... }       // completion
  | { kind: 'job-failed'; executionId; errorMsg; errorStack }         // failure
  | { kind: 'abort-job' }                                              // cancellation
  | { kind: 'send-chunk'; chunkText }                                 // streaming AI
```

### 6.5 Queue Recovery

Main process runs periodic recovery for stalled jobs:
```typescript
// Every 5 min (configurable): check in-progress executions in DB
// If job not in queue but execution still marked "running" → mark as crashed
this.scheduleQueueRecovery();
```

---

## 7. Expression Engine

### 7.1 Syntax

n8n uses a custom expression syntax wrapping JavaScript:

```
{{ $json.fieldName }}                    — current item json
{{ $node["NodeName"].json.field }}       — reference other node output
{{ $node["NodeName"].context.key }}      — node context (static data)
{{ $workflow.id }}                       — workflow metadata
{{ $execution.id }}                      — current execution id
{{ $env.MY_VAR }}                        — environment variable
{{ $now }}                              — current DateTime (Luxon)
{{ $('NodeName').item.json.field }}      — shorthand for $node reference
{{ $input.item.json.field }}             — input item to current node
```

### 7.2 Expression Class

```typescript
// packages/workflow/src/expression.ts
// Uses tmpl-based evaluator wrapped in a Proxy sandbox

class Expression {
  resolveSimpleParameterValue(
    parameterValue: NodeParameterValueType,
    siblingParameters: INodeParameters,
    runExecutionData: IRunExecutionData | null,
    runIndex: number,
    itemIndex: number,
    activeNodeName: string,
    connectionInputData: INodeExecutionData[],
    mode: WorkflowExecuteMode,
    additionalKeys: IWorkflowDataProxyAdditionalKeys,
    executeData?: IExecuteData,
    returnObjectAsString?: boolean,
  ): NodeParameterValueType
}
```

**Security:** Evaluated inside a Proxy sandbox that:
- Blocks `Object.defineProperty`, `setPrototypeOf`, `getOwnPropertyDescriptor`
- Blocks `Error.captureStackTrace`, `Error.prepareStackTrace` (prevents V8 sandbox escape)
- Wraps `Object.create` to prevent property descriptor injection
- All blocked methods return `undefined` instead of throwing

### 7.3 WorkflowDataProxy — Context Builder

```typescript
// packages/workflow/src/workflow-data-proxy.ts
// Builds the Proxy object that $json, $node, etc resolve through

export class WorkflowDataProxy {
  constructor(
    workflow: Workflow,
    runExecutionData: IRunExecutionData | null,
    runIndex: number,
    itemIndex: number,
    activeNodeName: string,
    connectionInputData: INodeExecutionData[],
    mode: WorkflowExecuteMode,
    additionalKeys: IWorkflowDataProxyAdditionalKeys,
    executeData?: IExecuteData,
    // ...
  ) {}

  getData(): IWorkflowDataProxyData {
    return {
      $json: /* current item json as Proxy */,
      $node: /* returns Proxy per node name */,
      $workflow: { id, name, active },
      $execution: { id, mode, resumeUrl },
      $env: /* process.env proxy */,
      $now: DateTime.now(),
      $today: DateTime.now().startOf('day'),
      $item: (index, nodeName) => /* item accessor */,
      $input: /* accessor for input items */,
      // ...
    };
  }
}
```

### 7.4 Extension Functions

n8n extends native types with helper methods:

```typescript
// {{ "hello world".toTitleCase() }}
// {{ [1,2,3].sum() }}
// {{ $now.minus({ days: 1 }).toISO() }}

// Implemented via Proxy that intercepts method calls:
extend(value, 'toTitleCase', () => value.replace(/.../))
```

---

## 8. Error Handling & Recovery

### 8.1 Node-level Error Control

```typescript
// INode settings
retryOnFail?: boolean;
maxTries?: number;      // default 3
waitBetweenTries?: number; // ms between retries
continueOnFail?: boolean;  // continue to next node even if this fails
alwaysOutputData?: boolean; // output empty item even if no data
onError?: 'stopWorkflow' | 'continueRegularOutput' | 'continueErrorOutput';
```

**Retry loop in WorkflowExecute:** When `retryOnFail=true`, the node executes up to `maxTries` times with `waitBetweenTries` delay between attempts. If all fail, error propagates.

### 8.2 Error Workflow

```typescript
// packages/cli/src/execution-lifecycle/execute-error-workflow.ts
export function executeErrorWorkflow(
  workflowData: IWorkflowBase,
  fullRunData: IRun,
  mode: WorkflowExecuteMode,
  executionId?: string,
) {
  if (!fullRunData.data.resultData.error) return;

  const { errorWorkflow } = workflowData.settings ?? {};
  if (errorWorkflow && !(mode === 'error' && errorWorkflow === workflowData.id)) {
    // Run designated error workflow, passing error context as input data:
    workflowErrorData = {
      execution: { id, url, error, lastNodeExecuted, mode },
      workflow: { id, name },
    };
    WorkflowExecutionService.executeErrorWorkflow(errorWorkflow, workflowErrorData, project);
  }
}
```

**Infinite loop protection:** If error workflow == current workflow AND mode == 'error', skip.

### 8.3 ExecutionLifecycleHooks — Observation Points

```typescript
// packages/core/src/execution-engine/execution-lifecycle-hooks.ts
export type ExecutionLifecycleHookHandlers = {
  workflowExecuteBefore: Array<(workflow, data?) => Promise<void>>;
  workflowExecuteAfter: Array<(fullRun: IRun, staticData) => Promise<void>>;
  workflowExecuteResume: Array<(workflow, data?) => Promise<void>>;
  nodeExecuteBefore: Array<(nodeName, taskStartData) => Promise<void>>;
  nodeExecuteAfter: Array<(nodeName, taskData, executionData) => Promise<void>>;
  sendResponse: Array<(response: IExecuteResponsePromiseData) => Promise<void>>;
  nodeFetchedData: Array<(workflowId, node) => Promise<void>>;
};

// Usage — each hook is an array; all registered handlers run sequentially:
hooks.addHandler('workflowExecuteAfter', async (run) => {
  await saveToDatabase(executionId, run);
  await pushToFrontend(pushRef, run);
});
```

### 8.4 Manual Retry from Failed Node

Flow:
1. User sees failed execution in UI
2. Click "Retry" → `POST /executions/:id/retry`
3. `WorkflowRunner.run(data, mode='retry', restartExecutionId=id)`
4. `runPartialWorkflow2()` called with `dirtyNodeNames=[failedNode]`
5. Cleans run data for failed node and its descendants
6. Rebuilds `nodeExecutionStack` from last good node
7. Re-executes from that point forward

### 8.5 Execution Status Values

```typescript
type ExecutionStatus =
  | 'new'        // registered but not started
  | 'running'    // currently executing
  | 'success'    // completed successfully
  | 'error'      // failed with error
  | 'canceled'   // user cancelled
  | 'crashed'    // process died
  | 'waiting';   // paused at Wait node
```

---

## 9. Key Design Patterns

### 9.1 Context Injection Pattern
Nodes never get direct DB/service access. All capabilities injected via context interface (`IExecuteFunctions`, `ITriggerFunctions`, etc). This makes nodes testable and platform-agnostic.

### 9.2 PCancelable for Execution Control
`WorkflowExecute.run()` returns `PCancelable<IRun>` (NOT `Promise<IRun>`). This allows cancelling running executions mid-flight:
```typescript
const run = workflowExecute.run(...);
run.cancel(); // stops execution loop
```

### 9.3 Static Data per Node
Nodes can persist small amounts of data across executions via `this.getWorkflowStaticData('node')` — stored as `workflow_entity.staticData` JSON. Used by trigger nodes to track "last seen" IDs.

### 9.4 Versioned Node Types
```typescript
// packages/core/src/execution-engine/versioned-node-type.ts
// Nodes can have multiple versions; workflow stores typeVersion per node instance
// getByNameAndVersion(type, version) picks correct implementation
```

### 9.5 Observable Static Data
`workflow.staticData` is wrapped in a Proxy (`ObservableObject`) that sets `__dataChanged=true` on mutation. After execution, if changed, the new staticData is saved back to DB.

### 9.6 Paired Items
Every `INodeExecutionData` tracks `pairedItem` — index of the input item it came from. Allows n8n to match output items back to their source input for data merging at later nodes.

---

## 10. Adaptable Patterns Summary

For building a similar workflow execution system:

| Pattern | n8n Approach | Adaptation |
|---------|-------------|------------|
| **Node contract** | `INodeType` with `execute/trigger/webhook/poll` methods | Define plugin interface with same 4 method types |
| **Data unit** | `INodeExecutionData` with `json + binary + pairedItem` | Always use array-of-arrays; `json` field mandatory |
| **Execution state** | `IRunExecutionData` with `resultData + executionData` | BFS frontier (`nodeExecutionStack`) + completed results (`runData`) |
| **Credential encryption** | AES-256-CBC + per-instance key + salt | Store encrypted, inject decrypted at runtime only |
| **Expression context** | `WorkflowDataProxy` Proxy object | Build context once per node execution, sandbox JS eval |
| **Lifecycle hooks** | Array of handlers per event, run sequentially | Allows multiple observers (DB save, push, metrics) without coupling |
| **Error workflow** | Separate workflow triggered on failure | Configure via workflow settings, pass error data as trigger input |
| **Queue mode** | Bull + Redis + separate worker processes | JobData = minimal (executionId only), worker fetches full data |
| **Partial re-execution** | Graph analysis + dirty node detection | Only re-run nodes downstream of the changed/failed node |
| **Webhook registration** | Store in DB on activation, lookup by path+method | `webhook_entity` table is source of truth |

---

## Unresolved Questions

1. **BullMQ vs Bull**: n8n CLI still imports `bull` (v4), not `bullmq`. Unclear if they migrated or are using a compatibility layer. The `scaling.types.ts` imports `type Bull from 'bull'` directly.

2. **`packages/nodes-base` node loading**: How n8n discovers and registers all nodes at startup (the `NodesLoader` / `nodes-loader` dir) — not fully traced. Likely auto-discovers `@n8n/*.nodes` packages from `node_modules`.

3. **Expression evaluator proxy**: The actual `expression-evaluator-proxy.ts` uses `tmpl`-based or `vm2`-based evaluation — not fully traced. The sandbox proxy is clear but the JS evaluator engine underneath needs verification.

4. **Multi-main HA**: `multi-main-setup.ee.ts` in scaling dir suggests multi-main leader election (Redis-based). Architecture of leader-only operations (queue recovery, webhook registration) not fully traced.

5. **`IRunExecutionData` serialization size**: For long workflows with large data, the `runData` grows unboundedly. n8n has `EXECUTIONS_DATA_SAVE_ON_*` config flags but the truncation/pruning strategy is not examined here.
