import { z } from 'zod';
import { agentLogger } from '@/utils/logger';

/**
 * Integration Schema
 *
 * Defines the structure for apps/integrations that can be plugged into the Agent-OS.
 * This mirrors Cal.com's App Store / Integration Registry pattern.
 */
export const IntegrationSchema = z.object({
  id: z.string().min(1),
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['crm', 'calendar', 'payment', 'messaging', 'ai_model', 'tool']),
  version: z.string(),
  enabled: z.boolean().default(true),
  config: z.record(z.string(), z.unknown()).optional(),
  capabilities: z.array(z.string()).default([]),
  manifest: z.record(z.unknown()).optional(),
});

export type Integration = z.infer<typeof IntegrationSchema>;

/**
 * IntegrationRegistry
 *
 * A centralized registry for managing available integrations.
 */
export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  private integrations: Map<string, Integration> = new Map();

  private constructor() {}

  public static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry();
    }
    return IntegrationRegistry.instance;
  }

  /**
   * Registers a new integration after validating it with Zod.
   */
  public register(integration: Integration): void {
    try {
      const validated = IntegrationSchema.parse(integration);
      this.integrations.set(validated.id, validated);
      agentLogger.info(`[IntegrationRegistry] Registered: ${validated.name} (${validated.slug})`);
    } catch (error) {
      agentLogger.error(`[IntegrationRegistry] Registration Failed for ${integration.name}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves an integration by its ID.
   */
  public getById(id: string): Integration | undefined {
    return this.integrations.get(id);
  }

  /**
   * Retrieves an integration by its slug.
   */
  public getBySlug(slug: string): Integration | undefined {
    return Array.from(this.integrations.values()).find((i) => i.slug === slug);
  }

  /**
   * Returns all registered integrations, optionally filtered by type.
   */
  public getAll(type?: Integration['type']): Integration[] {
    const all = Array.from(this.integrations.values());
    return type ? all.filter((i) => i.type === type) : all;
  }

  /**
   * Checks if an integration is enabled.
   */
  public isEnabled(id: string): boolean {
    const integration = this.integrations.get(id);
    return integration?.enabled ?? false;
  }
}

/**
 * Singleton instance of the registry.
 */
export const integrationRegistry = IntegrationRegistry.getInstance();
