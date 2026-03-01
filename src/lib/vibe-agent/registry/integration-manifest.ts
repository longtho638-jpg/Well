import { Integration } from './integration-registry';

/**
 * Integration Manifest
 *
 * Static definitions for all available integrations in the WellNexus Agent-OS.
 * This acts as the "App Store" catalog, mirroring Cal.com's structural pattern.
 */
export const INTEGRATION_MANIFESTS: Record<string, Integration> = {
  'google-calendar': {
    id: 'int_001',
    slug: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync health coaching sessions with Google Calendar',
    type: 'calendar',
    version: '1.0.0',
    enabled: true,
    capabilities: ['read_events', 'create_events', 'sync_availability'],
    config: {
      auth_type: 'oauth2',
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    }
  },
  'stripe-payment': {
    id: 'int_002',
    slug: 'stripe-payment',
    name: 'Stripe Payments',
    description: 'Process HealthFi subscription payments via Stripe',
    type: 'payment',
    version: '2.1.0',
    enabled: true,
    capabilities: ['charge', 'refund', 'subscription_management'],
    config: {
      api_version: '2023-10-16',
    }
  },
  'polar-sh': {
    id: 'int_003',
    slug: 'polar-sh',
    name: 'Polar.sh',
    description: 'Official payment provider for AgencyOS integrations',
    type: 'payment',
    version: '1.0.0',
    enabled: true,
    capabilities: ['checkout', 'webhooks', 'benefit_management'],
    config: {
      environment: 'production',
    }
  },
  'openai-gpt4': {
    id: 'int_004',
    slug: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    description: 'Advanced reasoning engine for health diagnostics',
    type: 'ai_model',
    version: '4.0.0',
    enabled: true,
    capabilities: ['chat_completion', 'embeddings', 'function_calling'],
    config: {
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
    }
  },
  'n8n-workflow': {
    id: 'int_005',
    slug: 'n8n-workflow',
    name: 'n8n Automation',
    description: 'Connect agents to 400+ external services via n8n',
    type: 'messaging',
    version: '1.0.0',
    enabled: true,
    capabilities: ['trigger_workflow', 'receive_webhook'],
    config: {
      base_url: 'https://n8n.wellnexus.vn',
    }
  }
};

/**
 * Helper to initialize the registry with the manifest
 */
export const initializeIntegrations = (registry: { register: (i: Integration) => void }) => {
  Object.values(INTEGRATION_MANIFESTS).forEach(integration => {
    registry.register(integration);
  });
};
