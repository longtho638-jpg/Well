/**
 * Docs Manager Agent Types
 * Extracted interfaces for better modularity and reusability.
 */

export interface ReadmeResult {
    file: string;
    content: string;
    sections: string[];
    wordCount: number;
}

export interface APIDocsResult {
    file: string;
    endpoints: unknown[];
    totalEndpoints: number;
    format: 'markdown';
}

export interface ArchitectureDocsResult {
    file: string;
    diagrams: Array<{
        type: string;
        file: string;
        content: string;
    }>;
    overview: string;
    components: string[];
}

export interface SyncDocsResult {
    updates: Array<{
        file: string;
        status: 'up-to-date' | 'needs-update' | 'outdated';
    }>;
    outdated: number;
    upToDate: number;
}

export type DocsManagerAction =
    | { action: 'generateReadme'; options?: DocsOptions }
    | { action: 'documentAPI' }
    | { action: 'createArchitectureDocs' }
    | { action: 'syncDocs' };

export interface DocsOptions {
    sections?: string[];
    format?: 'markdown' | 'html';
    includeExamples?: boolean;
}
