// Agent System Types
// Comprehensive type definitions for the Agent OS architecture

export interface AgentInput {
    action: string;
    context?: Record<string, unknown>;
    data?: unknown;
}

export interface AgentOutput {
    success: boolean;
    data?: unknown;
    message?: string;
    error?: string;
}

export interface AgentCacheData<T = unknown> {
    data: T;
    timestamp: number;
}

export interface TransactionInput {
    id: string;
    amount: number;
    type: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    date?: string;
}

export type TranslationVars = Record<string, string | number>;

export interface AIActionData {
    type: string;
    target: string;
    value: unknown;
    confidence: number;
    reasoning: string;
}
