import { BaseAgent } from '../core/BaseAgent';

/** Options for docs generation */
interface DocsOptions {
    sections?: string[];
}

/**
 * DocsManagerAgent - Automated documentation generation and maintenance
 * 
 * Capabilities:
 * - Generate README files
 * - Create API documentation
 * - Generate architecture docs
 * - Keep docs synchronized with code
 */
export class DocsManagerAgent extends BaseAgent {
    private docsGenerated: number = 0;

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
                'API Schema Parser',
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

    async execute(action: {
        action: 'generateReadme' | 'documentAPI' | 'createArchitectureDocs' | 'syncDocs';
        scope?: string;
        options?: DocsOptions;
    }): Promise<{ success: boolean;[key: string]: unknown }> {
        try {
            let result: Record<string, unknown>;

            switch (action.action) {
                case 'generateReadme':
                    result = await this.createReadme(action.options);
                    this.docsGenerated++;
                    this.updateKPI('Docs Generated', this.docsGenerated);
                    break;

                case 'documentAPI':
                    result = await this.generateAPIDocs(action.scope);
                    this.docsGenerated++;
                    this.updateKPI('Docs Generated', this.docsGenerated);
                    break;

                case 'createArchitectureDocs':
                    result = await this.documentArchitecture(action.scope);
                    this.docsGenerated++;
                    this.updateKPI('Docs Generated', this.docsGenerated);
                    break;

                case 'syncDocs':
                    result = await this.synchronizeDocs();
                    break;

                default:
                    throw new Error(`Unknown action: ${action.action}`);
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
     * Generate comprehensive README file
     */
    private async createReadme(options?: DocsOptions): Promise<Record<string, unknown>> {
        const sections = options?.sections || [
            'overview',
            'installation',
            'usage',
            'architecture',
            'contributing',
            'license',
        ];

        const content = this.buildReadmeContent(sections);

        return {
            file: 'README.md',
            content,
            sections,
            wordCount: content.split(' ').length,
        };
    }

    /**
     * Generate API documentation
     */
    private async generateAPIDocs(scope?: string): Promise<Record<string, unknown>> {
        // Simulate API documentation generation
        const endpoints = [
            {
                path: '/api/users',
                method: 'GET',
                description: 'Retrieve all users',
                parameters: [{ name: 'page', type: 'number', required: false }],
                responses: {
                    200: { description: 'Success', schema: 'User[]' },
                    401: { description: 'Unauthorized' },
                },
                example: 'curl -X GET https://api.example.com/api/users?page=1',
            },
            {
                path: '/api/agents',
                method: 'GET',
                description: 'List all agents',
                responses: {
                    200: { description: 'Success', schema: 'Agent[]' },
                },
            },
        ];

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
    private async documentArchitecture(scope?: string): Promise<Record<string, unknown>> {
        const diagrams = [
            {
                type: 'component',
                file: 'architecture/components.mmd',
                content: this.generateComponentDiagram(),
            },
            {
                type: 'data-flow',
                file: 'architecture/data-flow.mmd',
                content: this.generateDataFlowDiagram(),
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
    private async synchronizeDocs(): Promise<Record<string, unknown>> {
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

    // Helper methods

    private buildReadmeContent(sections: string[]): string {
        let content = '# WellNexus HealthFi OS\n\n';

        if (sections.includes('overview')) {
            content += '## Overview\n\n';
            content += 'WellNexus is a comprehensive HealthFi platform with 28 integrated agents.\n\n';
        }

        if (sections.includes('installation')) {
            content += '## Installation\n\n';
            content += '```bash\nnpm install\n```\n\n';
        }

        if (sections.includes('usage')) {
            content += '## Usage\n\n';
            content += '```bash\nnpm run dev\n```\n\n';
        }

        if (sections.includes('architecture')) {
            content += '## Architecture\n\n';
            content += 'See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.\n\n';
        }

        if (sections.includes('contributing')) {
            content += '## Contributing\n\n';
            content += 'See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.\n\n';
        }

        if (sections.includes('license')) {
            content += '## License\n\n';
            content += 'MIT License\n';
        }

        return content;
    }

    private generateComponentDiagram(): string {
        return `graph TB
    A[User Interface] --> B[Agent Registry]
    B --> C[Custom Agents]
    B --> D[ClaudeKit Agents]
    C --> E[BaseAgent]
    D --> E`;
    }

    private generateDataFlowDiagram(): string {
        return `graph LR
    A[User Request] --> B[Agent Execution]
    B --> C[Data Processing]
    C --> D[Response]`;
    }
}
