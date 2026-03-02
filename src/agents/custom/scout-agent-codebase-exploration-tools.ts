/**
 * ScoutAgent — internal type definitions and private helper implementations
 * extracted to keep ScoutAgent.ts under 200 LOC.
 */

export interface CodeFinding {
    file: string;
    relevance: number;
    summary: string;
    codeSnippet?: string;
    lineNumber?: number;
}

export interface PatternMatch {
    name: string;
    files: string[];
    description: string;
    examples: string[];
}

export interface DependencyMap {
    target: string;
    dependents: string[];
    dependencies: string[];
    impactRadius: 'low' | 'medium' | 'high';
}

export interface ExploreResult {
    query: string;
    scope: string;
    findings: CodeFinding[];
    totalFiles: number;
    categories: Record<string, string[]>;
}

/**
 * Categorise findings by folder segment (core / api / components / utils / other).
 */
export function categorizeFindings(findings: CodeFinding[]): Record<string, string[]> {
    const categories: Record<string, string[]> = {
        core: [],
        api: [],
        components: [],
        utils: [],
        other: [],
    };

    findings.forEach(finding => {
        if (finding.file.includes('/core/')) categories.core.push(finding.file);
        else if (finding.file.includes('/api/')) categories.api.push(finding.file);
        else if (finding.file.includes('/components/')) categories.components.push(finding.file);
        else if (finding.file.includes('/utils/') || finding.file.includes('/lib/'))
            categories.utils.push(finding.file);
        else categories.other.push(finding.file);
    });

    return categories;
}

/**
 * Simulate codebase exploration based on keyword query.
 */
export async function exploreCodebase(query: string, scope?: string): Promise<ExploreResult> {
    const findings: CodeFinding[] = [];

    if (query.toLowerCase().includes('auth')) {
        findings.push(
            {
                file: 'src/middleware/auth.ts',
                relevance: 0.95,
                summary: 'Authentication middleware handling JWT tokens',
                codeSnippet: 'export const authMiddleware = (req, res, next) => {...}',
                lineNumber: 10,
            },
            {
                file: 'src/api/auth.ts',
                relevance: 0.90,
                summary: 'Authentication API endpoints',
                codeSnippet: "router.post('/login', loginHandler);",
                lineNumber: 25,
            }
        );
    }

    if (query.toLowerCase().includes('agent')) {
        findings.push(
            {
                file: 'src/agents/custom/GeminiCoachAgent.ts',
                relevance: 0.92,
                summary: 'Agent extending BaseAgent pattern',
                codeSnippet: 'export class GeminiCoachAgent extends BaseAgent {...}',
                lineNumber: 14,
            },
            {
                file: 'src/agents/registry.ts',
                relevance: 0.88,
                summary: 'Agent registry singleton',
                codeSnippet: 'export class AgentRegistry {...}',
                lineNumber: 10,
            }
        );
    }

    return {
        query,
        scope: scope || 'project-wide',
        findings,
        totalFiles: findings.length,
        categories: categorizeFindings(findings),
    };
}

/**
 * Simulate pattern discovery across the codebase.
 */
export async function discoverPatterns(query: string): Promise<Record<string, unknown>> {
    const patterns: PatternMatch[] = [
        {
            name: 'BaseAgent Extension Pattern',
            files: [
                'src/agents/custom/GeminiCoachAgent.ts',
                'src/agents/custom/AgencyOSAgent.ts',
                'src/agents/custom/DebuggerAgent.ts',
            ],
            description: 'All custom agents extend BaseAgent class',
            examples: ['export class XAgent extends BaseAgent'],
        },
        {
            name: 'Registry Singleton Pattern',
            files: ['src/agents/registry.ts'],
            description: 'Centralized agent registry using singleton',
            examples: ['export const agentRegistry = AgentRegistry.getInstance()'],
        },
    ];

    return { query, patterns, totalPatterns: patterns.length };
}

/**
 * Simulate dependency analysis for a target file/module.
 */
export async function analyzeDependencies(target: string): Promise<DependencyMap> {
    return {
        target,
        dependents: [
            'src/pages/Dashboard.tsx',
            'src/components/AgentPanel.tsx',
        ],
        dependencies: [
            'src/agents/core/BaseAgent.ts',
            'src/types/agentic.ts',
        ],
        impactRadius: 'medium',
    };
}
