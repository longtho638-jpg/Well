/**
 * Supabase-backed AI Provider
 * Routes all LLM calls through Supabase Edge Functions
 */
import { supabase } from '@/lib/supabase';
import type { AIProvider, GenerateParams, GenerateResult } from './ai-provider-types';

export class SupabaseAIProvider implements AIProvider {
  private functionName: string;

  constructor(functionName = 'agent-chat') {
    this.functionName = functionName;
  }

  async generateText(params: GenerateParams): Promise<GenerateResult> {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${this.functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ ...params, stream: false }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI Provider error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<GenerateResult>;
  }

  async streamText(params: GenerateParams): Promise<ReadableStream<string>> {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${this.functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ ...params, stream: true }),
      }
    );

    if (!response.ok || !response.body) {
      throw new Error(`AI Provider stream error: ${response.status}`);
    }

    return response.body.pipeThrough(new TextDecoderStream());
  }
}
