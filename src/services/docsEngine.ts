/**
 * Docs Engine
 * High-performance logic for generating project documentation and Mermaid diagrams.
 */

export interface DocsOptions {
    sections?: string[];
}

export const docsEngine = {
    /**
     * Build comprehensive README content based on selected sections
     */
    buildReadmeContent(sections: string[]): string {
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
    },

    /**
     * Generate Mermaid component diagram
     */
    generateComponentDiagram(): string {
        return `graph TB
    A[User Interface] --> B[Agent Registry]
    B --> C[Custom Agents]
    B --> D[ClaudeKit Agents]
    C --> E[BaseAgent]
    D --> E`;
    },

    /**
     * Generate Mermaid data-flow diagram
     */
    generateDataFlowDiagram(): string {
        return `graph LR
    A[User Request] --> B[Agent Execution]
    B --> C[Data Processing]
    C --> D[Response]`;
    },

    /**
     * Generate mock API endpoints for demonstration
     */
    getMockEndpoints() {
        return [
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
    }
};
