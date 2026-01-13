/**
 * Scout External Agent Types
 * Extracted interfaces for better modularity and reusability.
 */

export interface WebSearchResult {
    title: string;
    url: string;
    summary: string;
    relevance: number;
    source: string;
}

export interface SearchResults {
    query: string;
    sources: string[];
    resources: WebSearchResult[];
    totalResults: number;
}

export interface DocumentationResult {
    officialDocs: string[];
    tutorials: string[];
    apiReference: string[];
}

export interface CodeExample {
    source: string;
    repository: string;
    code: string;
    stars: number;
    url: string;
}

export interface CodeExamplesResult {
    examples: CodeExample[];
}

export interface ComparisonOption {
    pros: string[];
    cons: string[];
}

export interface ComparisonResult {
    comparison: {
        optionA: ComparisonOption;
        optionB: ComparisonOption;
        recommendation: string;
    };
}

export type ScoutExternalAction =
    | { action: 'searchWeb'; query: string; sources?: string[] }
    | { action: 'findDocs'; query: string }
    | { action: 'gatherExamples'; query: string }
    | { action: 'compareSolutions'; query: string };

export type ScoutExternalResult = SearchResults | DocumentationResult | CodeExamplesResult | ComparisonResult;
