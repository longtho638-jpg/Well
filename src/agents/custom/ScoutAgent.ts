import { BaseAgent } from '../core/BaseAgent';
import {
    CodeFinding,
    PatternMatch,
    DependencyMap,
    exploreCodebase,
    discoverPatterns,
    analyzeDependencies,
} from './scout-agent-codebase-exploration-tools';

/**
 * ScoutAgent - Codebase exploration and pattern discovery
 * 
 * Capabilities:
 * - Explore codebase to find relevant files
 * - Discover implementation patterns
 * - Map file dependencies
 * - Gather context for development work
 */
export class ScoutAgent extends BaseAgent {
    private codebasesExplored: number = 0;
    private patternsFound: number = 0;

    constructor() {
        super({
            agent_name: 'Scout',
            business_function: 'Operations & Logistics',
            primary_objectives: [
                'Explore codebase to find relevant implementation examples',
                'Discover and document common patterns',
                'Map file dependencies and relationships',
                'Gather context for feature development',
            ],
            inputs: [
                { source: 'search_query', dataType: 'user_input' },
                { source: 'file_paths', dataType: 'API' },
                { source: 'codebase', dataType: 'API' },
            ],
            tools_and_systems: [
                'File System Scanner',
                'AST Parser',
                'Dependency Analyzer',
                'Pattern Matcher',
            ],
            core_actions: [
                'explore',
                'findPatterns',
                'mapDependencies',
                'gatherContext',
            ],
            outputs: [
                'findings_report',
                'pattern_list',
                'dependency_map',
            ],
            success_kpis: [
                { name: 'Codebases Explored', target: 100, current: 0, unit: 'searches' },
                { name: 'Patterns Found', target: 200, current: 0, unit: 'patterns' },
                { name: 'Context Quality', target: 90, current: 0, unit: '%' },
            ],
            risk_and_failure_modes: [
                'Irrelevant results from broad queries',
                'Missing files due to incorrect scope',
                'Performance issues on large codebases',
            ],
            human_in_the_loop_points: [
                'Query refinement for better results',
                'Validation of discovered patterns',
            ],
            policy_and_constraints: [
                {
                    rule: 'Respect .gitignore and excluded directories',
                    enforcement: 'hard',
                    notes: 'Do not scan node_modules, .git, etc.',
                },
            ],
            visibility: 'all',
        });
    }

    async execute(action: {
        action: 'explore' | 'findPatterns' | 'mapDependencies' | 'gatherContext';
        query: string;
        scope?: string;
        maxResults?: number;
    }): Promise<{ success: boolean;[key: string]: unknown }> {
        try {
            let result: Record<string, unknown>;

            switch (action.action) {
                case 'explore': {
                    const findings = await this.exploreCodebase(action.query, action.scope);
                    result = findings;
                    this.codebasesExplored++;
                    this.updateKPI('Codebases Explored', this.codebasesExplored);
                    break;
                }

                case 'findPatterns': {
                    const patterns = await this.discoverPatterns(action.query, action.scope);
                    result = patterns;
                    this.patternsFound += (patterns.patterns as PatternMatch[])?.length || 0;
                    this.updateKPI('Patterns Found', this.patternsFound);
                    break;
                }

                case 'mapDependencies': {
                    const deps = await this.analyzeDependencies(action.query);
                    result = { ...deps };
                    break;
                }

                case 'gatherContext': {
                    const context = await this.collectContext(action.query, action.scope);
                    result = context;
                    break;
                }

                default: {
                    const _exhaustiveCheck: never = action.action;
                    throw new Error(`Unknown action: ${_exhaustiveCheck}`);
                }
            }

            return { success: true, ...result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Explore codebase to find relevant files
     */
    private async exploreCodebase(query: string, scope?: string): Promise<{
        query: string;
        scope: string;
        findings: CodeFinding[];
        totalFiles: number;
        categories: Record<string, string[]>;
    }> {
        return exploreCodebase(query, scope);
    }

    /**
     * Discover implementation patterns
     */
    private async discoverPatterns(query: string, _scope?: string): Promise<Record<string, unknown>> {
        return discoverPatterns(query);
    }

    /**
     * Analyze file dependencies
     */
    private async analyzeDependencies(target: string): Promise<DependencyMap> {
        return analyzeDependencies(target);
    }

    /**
     * Gather context from codebase
     */
    private async collectContext(query: string, scope?: string): Promise<Record<string, unknown>> {
        const exploration = await this.exploreCodebase(query, scope);
        const patterns = await this.discoverPatterns(query, scope);
        const relatedFiles = exploration.findings.slice(0, 3).map((f) => f.file);

        return {
            query,
            findings: exploration.findings,
            patterns: (patterns as { patterns: PatternMatch[] }).patterns,
            relatedFiles,
            summary: `Found ${exploration.totalFiles} files and ${(patterns as { totalPatterns: number }).totalPatterns} patterns`,
        };
    }
}
