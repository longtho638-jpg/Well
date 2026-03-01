/**
 * Factory function for creating AI providers
 * Inspired by Vercel AI SDK's createOpenAI(), createGoogle()
 */
import type { AIProvider } from './ai-provider-types';
import { SupabaseAIProvider } from './supabase-edge-function-ai-provider';

export type ProviderType = 'supabase' | 'gemini';

export function createAIProvider(type: ProviderType = 'supabase'): AIProvider {
  switch (type) {
    case 'supabase':
    case 'gemini': // Both route through Supabase Edge Functions
      return new SupabaseAIProvider();
    default:
      return new SupabaseAIProvider();
  }
}

// Singleton default provider
let defaultProvider: AIProvider | null = null;

export function getDefaultAIProvider(): AIProvider {
  if (!defaultProvider) {
    defaultProvider = createAIProvider('supabase');
  }
  return defaultProvider;
}
