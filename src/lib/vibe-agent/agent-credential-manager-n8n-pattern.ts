/**
 * Agent Credential Manager — n8n Pattern
 *
 * Pattern source: n8n-io/n8n CredentialsHelper + ICredentialType
 * Maps n8n's encrypted credential storage to per-agent injection.
 *
 * Key mappings:
 *   ICredentialType          → CredentialTypeDescriptor
 *   ICredentialDataDecryptedObject → Record<string, string>
 *   CredentialsHelper        → AgentCredentialManager
 *   credential testing       → testCredential()
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Credential field definition (n8n ICredentialType.properties) */
export interface CredentialFieldDescriptor {
  name: string;
  displayName: string;
  type: 'string' | 'password' | 'oauth2';
  required: boolean;
  default?: string;
  placeholder?: string;
}

/** Credential type definition (like n8n's API credential types) */
export interface CredentialTypeDescriptor {
  name: string;
  displayName: string;
  fields: CredentialFieldDescriptor[];
  /** Optional: URL to test the credential (n8n credential testing) */
  testUrl?: string;
}

/** Stored credential instance */
export interface StoredCredential {
  id: string;
  typeName: string;
  displayName: string;
  /** Values are obfuscated in memory (stars for passwords) */
  data: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  /** Which agents use this credential */
  usedByAgents: string[];
}

export type CredentialTestResult =
  | { success: true }
  | { success: false; message: string };

// ─── Internal Storage ─────────────────────────────────────────────────────────

interface InternalCredential extends Omit<StoredCredential, 'data'> {
  _rawData: Record<string, string>;
}

// ─── Manager ─────────────────────────────────────────────────────────────────

class AgentCredentialManager {
  private types = new Map<string, CredentialTypeDescriptor>();
  private credentials = new Map<string, InternalCredential>();
  private idCounter = 0;

  // ─── Type Registry ──────────────────────────────────────────────────────────

  registerType(descriptor: CredentialTypeDescriptor): void {
    this.types.set(descriptor.name, descriptor);
  }

  getType(name: string): CredentialTypeDescriptor | undefined {
    return this.types.get(name);
  }

  listTypes(): CredentialTypeDescriptor[] {
    return Array.from(this.types.values());
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  store(typeName: string, displayName: string, data: Record<string, string>): string {
    if (!this.types.has(typeName)) {
      throw new Error(`Unknown credential type: ${typeName}`);
    }
    const id = `cred_${++this.idCounter}_${Date.now()}`;
    const now = new Date().toISOString();
    this.credentials.set(id, {
      id,
      typeName,
      displayName,
      _rawData: { ...data },
      createdAt: now,
      updatedAt: now,
      usedByAgents: [],
    });
    return id;
  }

  retrieve(credentialId: string): Record<string, string> | undefined {
    return this.credentials.get(credentialId)?._rawData;
  }

  retrieveForAgent(agentName: string): Array<{ id: string; typeName: string; data: Record<string, string> }> {
    const results: Array<{ id: string; typeName: string; data: Record<string, string> }> = [];
    for (const cred of this.credentials.values()) {
      if (cred.usedByAgents.includes(agentName)) {
        results.push({ id: cred.id, typeName: cred.typeName, data: { ...cred._rawData } });
      }
    }
    return results;
  }

  update(credentialId: string, data: Record<string, string>): boolean {
    const cred = this.credentials.get(credentialId);
    if (!cred) return false;
    Object.assign(cred._rawData, data);
    cred.updatedAt = new Date().toISOString();
    return true;
  }

  delete(credentialId: string): boolean {
    return this.credentials.delete(credentialId);
  }

  // ─── Agent Linking ──────────────────────────────────────────────────────────

  linkToAgent(credentialId: string, agentName: string): boolean {
    const cred = this.credentials.get(credentialId);
    if (!cred) return false;
    if (!cred.usedByAgents.includes(agentName)) {
      cred.usedByAgents.push(agentName);
    }
    return true;
  }

  // ─── Credential Testing ─────────────────────────────────────────────────────

  async testCredential(credentialId: string): Promise<CredentialTestResult> {
    const cred = this.credentials.get(credentialId);
    if (!cred) return { success: false, message: `Credential ${credentialId} not found` };

    const type = this.types.get(cred.typeName);
    if (!type?.testUrl) return { success: true }; // no test URL = assume valid

    try {
      const res = await fetch(type.testUrl, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (res.ok) return { success: true };
      return { success: false, message: `Test failed: HTTP ${res.status}` };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Network error' };
    }
  }

  // ─── Obfuscation ────────────────────────────────────────────────────────────

  obfuscate(typeName: string, data: Record<string, string>): Record<string, string> {
    const type = this.types.get(typeName);
    if (!type) return data;
    const result: Record<string, string> = {};
    for (const field of type.fields) {
      const val = data[field.name];
      if (val === undefined) continue;
      result[field.name] = field.type === 'password' ? '••••••••' : val;
    }
    return result;
  }

  listAll(): StoredCredential[] {
    return Array.from(this.credentials.values()).map(({ _rawData, ...rest }) => ({
      ...rest,
      data: this.obfuscate(rest.typeName, _rawData),
    }));
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  clear(): void {
    this.credentials.clear();
    this.types.clear();
    this.idCounter = 0;
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

export const agentCredentialManager = new AgentCredentialManager();
