/**
 * Agent Script Runner — Google/zx Shell Script Pattern
 *
 * Maps google/zx's developer-friendly shell scripting to agent task automation.
 * Chain async operations, capture output, handle errors with template literals.
 *
 * zx concepts mapped:
 * - $`command`: tagged template for shell execution → agent action execution
 * - ProcessOutput: structured result with stdout/stderr/exitCode
 * - cd/within: directory context → agent execution context switching
 * - question: interactive prompt → agent input collection
 * - retry: built-in retry with count → agent retry wrapper
 * - spinner: progress indicator → agent progress tracking
 *
 * Pattern source: google/zx core.ts
 */

// ─── Types ──────────────────────────────────────────────────

/** Structured output from an agent action (zx ProcessOutput equivalent) */
export interface ActionOutput {
  actionId: string;
  actionName: string;
  /** Primary result */
  stdout: string;
  /** Error/diagnostic output */
  stderr: string;
  /** 0 = success, non-zero = failure */
  exitCode: number;
  durationMs: number;
  timestamp: string;
}

/** Script step definition */
export interface ScriptStep {
  name: string;
  /** Action to execute — returns stdout string */
  action: (ctx: ScriptContext) => Promise<string>;
  /** Continue on failure (zx $.nothrow equivalent) */
  nothrow?: boolean;
  /** Timeout in ms */
  timeoutMs?: number;
}

/** Script execution context (zx $ context equivalent) */
export interface ScriptContext {
  /** Get output from a previous step by name */
  getOutput: (stepName: string) => ActionOutput | undefined;
  /** Store data for later steps */
  env: Record<string, string>;
  /** Current step index */
  stepIndex: number;
  /** Verbose mode — log each step */
  verbose: boolean;
  /** Signal to abort script */
  abort: (reason: string) => void;
}

/** Full script result */
export interface ScriptResult {
  scriptName: string;
  success: boolean;
  steps: ActionOutput[];
  totalDurationMs: number;
  abortReason?: string;
}

// ─── Script Runner ──────────────────────────────────────────

/**
 * Singleton script runner for chaining agent actions.
 * Mirrors google/zx's fluent shell scripting pattern.
 */
class AgentScriptRunner {
  private defaultTimeout = 30_000;
  private verbose = false;
  private idCounter = 0;

  /** Set verbose mode (zx $.verbose) */
  setVerbose(v: boolean): void {
    this.verbose = v;
  }

  /** Set default timeout */
  setDefaultTimeout(ms: number): void {
    this.defaultTimeout = ms;
  }

  /** Run a script — sequential steps with shared context (zx script execution) */
  async run(scriptName: string, steps: ScriptStep[]): Promise<ScriptResult> {
    const startTime = Date.now();
    const outputs: ActionOutput[] = [];
    let aborted = false;
    let abortReason: string | undefined;

    const ctx: ScriptContext = {
      getOutput: (name) => outputs.find((o) => o.actionName === name),
      env: {},
      stepIndex: 0,
      verbose: this.verbose,
      abort: (reason) => { aborted = true; abortReason = reason; },
    };

    for (let i = 0; i < steps.length; i++) {
      if (aborted) break;
      ctx.stepIndex = i;
      const step = steps[i];
      const stepStart = Date.now();

      const output: ActionOutput = {
        actionId: `act_${++this.idCounter}`,
        actionName: step.name,
        stdout: '',
        stderr: '',
        exitCode: 0,
        durationMs: 0,
        timestamp: new Date().toISOString(),
      };

      try {
        const timeout = step.timeoutMs ?? this.defaultTimeout;
        const result = await this.withTimeout(step.action(ctx), timeout);
        output.stdout = result;
        output.exitCode = 0;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        output.stderr = errMsg;
        output.exitCode = 1;

        if (!step.nothrow) {
          output.durationMs = Date.now() - stepStart;
          outputs.push(output);
          return {
            scriptName,
            success: false,
            steps: outputs,
            totalDurationMs: Date.now() - startTime,
          };
        }
      }

      output.durationMs = Date.now() - stepStart;
      outputs.push(output);
    }

    return {
      scriptName,
      success: !aborted && outputs.every((o) => o.exitCode === 0 || steps.find((s) => s.name === o.actionName)?.nothrow),
      steps: outputs,
      totalDurationMs: Date.now() - startTime,
      abortReason,
    };
  }

  /** Retry helper (zx retry equivalent) */
  async retry<T>(count: number, fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    for (let i = 0; i < count; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (i < count - 1) await this.sleep(1000 * (i + 1));
      }
    }
    throw lastError;
  }

  /** Sleep helper (zx sleep equivalent) */
  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
    ]);
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const agentScriptRunner = new AgentScriptRunner();
