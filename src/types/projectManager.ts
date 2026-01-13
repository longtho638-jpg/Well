/**
 * Project Manager Agent Types
 * Extracted interfaces for better modularity and reusability.
 */

export interface ProjectReport {
    reportType: string;
    generatedAt: string;
    summary: {
        totalAgents: number;
        activeAgents: number;
        tasksCompleted: number;
        tasksInProgress: number;
        blockers: number;
    };
    highlights: string[];
    nextPriorities: string[];
}

export interface WorkflowPlan {
    workflow: string;
    agents: string[];
    sequence: Array<{ agent: string; action: string }>;
    estimatedTime: string;
}

export interface ProgressMetrics {
    scope: string;
    velocity: number;
    completed: number;
    inProgress: number;
    planned: number;
    percentComplete: number;
}

export interface Blocker {
    id: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    affectedAgents: string[];
    suggestedResolution: string;
}

export interface BlockerList {
    blockers: Blocker[];
    totalBlockers: number;
    criticalBlockers: number;
}

export type ProjectManagerAction =
    | { action: 'generateReport'; reportType?: string }
    | { action: 'coordinateAgents'; agents?: string[] }
    | { action: 'trackProgress'; scope?: string }
    | { action: 'identifyBlockers' };
