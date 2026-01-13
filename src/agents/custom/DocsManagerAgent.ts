/**
 * Docs Manager Agent (Refactored)
 * Coordinator for project documentation maintenance.
 * 
 * Logic delegated to docsEngine.ts for content generation.
 */

import { BaseAgent } from '../core/BaseAgent';
import { docsEngine } from '@/services/docsEngine';
import {
    ReadmeResult,
    APIDocsResult,
    ArchitectureDocsResult,
    SyncDocsResult,
    DocsManagerAction,
    DocsOptions,
} from '@/types/docsManager';

// Re-export types for external use
export type { ReadmeResult, APIDocsResult, ArchitectureDocsResult, SyncDocsResult, DocsManagerAction, DocsOptions };

type DocsExecutionResult = ReadmeResult | APIDocsResult | ArchitectureDocsResult | SyncDocsResult;

export class DocsManagerAgent extends BaseAgent {
    private readonly docsGenerated: { count: number } = { count: 0 };

    constructor() {
        super({
            agent_name: 'Docs Manager',
            business_function: 'Operations & Logistics',
            primary_objectives: [
                'Generate and maintain project documentation',
                'Create comprehensive README files',
                'Document API endpoints and schemas',
                'Generate architecture and design documentation',
            ],
            inputs: [
                { source: 'codebase_structure', dataType: 'API' },
                { source: 'api_endpoints', dataType: 'API' },
                { source: 'documentation_requirements', dataType: 'user_input' },
            ],
            tools_and_systems: [
                'File System',
                'Markdown Generator',
                'Mermaid Diagram Generator',
                'Docs Engine (Internal)',
            ],
            core_actions: [
                'generateReadme',
                'documentAPI',
                'createArchitectureDocs',
                'syncDocs',
            ],
            outputs: [
                'readme_file',
                'api_documentation',
                'architecture_docs',
            ],
            success_kpis: [
                { name: 'Docs Generated', target: 50, current: 0, unit: 'documents' },
                { name: 'Docs Up-to-Date', target: 95, current: 0, unit: '%' },
                { name: 'Coverage', target: 90, current: 0, unit: '%' },
            ],
            risk_and_failure_modes: [
                'Outdated documentation if code changes',
                'Incomplete API documentation',
                'Missing architecture updates',
            ],
            human_in_the_loop_points: [
                'Review generated documentation for accuracy',
                'Approve architectural diagrams',
            ],
            policy_and_constraints: [
                {
                    rule: 'Documentation must follow project standards',
                    enforcement: 'soft',
                    notes: 'Consistent formatting and structure',
                },
            ],
            visibility: 'all',
        });
    }

    async execute(action: DocsManagerAction): Promise<{ success: boolean; data?: DocsExecutionResult; error?: string }> {
        try {
            let result: DocsExecutionResult;

            switch (action.action) {
                case 'generateReadme':
                    result = await this.createReadme(action.options);
                    this.docsGenerated.count++;
                    this.updateKPI('Docs Generated', this.docsGenerated.count);
                    break;

                case 'documentAPI':
                    result = await this.generateAPIDocs();
                    this.docsGenerated.count++;
                    this.updateKPI('Docs Generated', this.docsGenerated.count);
                    break;

                case 'createArchitectureDocs':
                    result = await this.documentArchitecture();
                    this.docsGenerated.count++;
                    this.updateKPI('Docs Generated', this.docsGenerated.count);
                    break;

                case 'syncDocs':
                    result = await this.synchronizeDocs();
                    break;

                default:
                    const exhaustiveCheck: never = action;
                    throw new Error(`Unknown action: ${(action as { action: string }).action}`);
            }

            return { success: true, data: result };
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Generate comprehensive README file
     */
    private async createReadme(options?: DocsOptions): Promise<ReadmeResult> {
        const sections = options?.sections || [
            'overview',
            'installation',
            'usage',
            'architecture',
            'contributing',
            'license',
        ];

        const content = docsEngine.buildReadmeContent(sections);

        return {
            file: 'README.md',
            content,
            sections,
            wordCount: content.split(/\s+/).length,
        };
    }

    /**
     * Generate API documentation
     */
    private async generateAPIDocs(): Promise<APIDocsResult> {
        const endpoints = docsEngine.getMockEndpoints();

        return {
            file: 'API_REFERENCE.md',
            endpoints,
            totalEndpoints: endpoints.length,
            format: 'markdown',
        };
    }

    /**
     * Generate architecture documentation
     */
    private async documentArchitecture(): Promise<ArchitectureDocsResult> {
        const diagrams = [
            {
                type: 'component',
                file: 'architecture/components.mmd',
                content: docsEngine.generateComponentDiagram(),
            },
            {
                type: 'data-flow',
                file: 'architecture/data-flow.mmd',
                content: docsEngine.generateDataFlowDiagram(),
            },
        ];

        return {
            file: 'ARCHITECTURE.md',
            diagrams,
            overview: 'WellNexus platform architecture overview',
            components: ['Agents', 'Registry', 'UI', 'API'],
        };
    }

    /**
     * Synchronize documentation with code
     */
    private async synchronizeDocs(): Promise<SyncDocsResult> {
        return {
            updates: [
                { file: 'README.md', status: 'up-to-date' },
                { file: 'API_REFERENCE.md', status: 'needs-update' },
                { file: 'ARCHITECTURE.md', status: 'up-to-date' },
            ],
            outdated: 1,
            upToDate: 2,
        };
    }
}
