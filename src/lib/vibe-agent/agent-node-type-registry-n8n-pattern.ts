/**
 * Agent Node Type Registry — n8n-inspired declarative node type system.
 * Maps INodeTypeDescription, INodeProperties, INodeCredential, and the
 * resource-operation pattern to a typed registry for agent node descriptors.
 *
 * Pattern source: n8n-io/n8n INodeType + INodeProperties
 */

// ─── Property Types (n8n: INodePropertyType) ────────────────

/** n8n-inspired property types for node parameters */
export type NodePropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'options'
  | 'json'
  | 'collection';

/** Node group classification (n8n: INodeTypeGroup) */
export type NodeGroup = 'trigger' | 'action' | 'transform' | 'flow' | 'output';

// ─── Property Descriptor (n8n: INodeProperties) ─────────────

/** A single selectable option (n8n: INodePropertyOptions) */
export interface NodePropertyOption {
  name: string;
  value: string | number;
  description?: string;
}

/** Conditional display rule — show when another property matches a value (n8n: displayOptions) */
export interface NodePropertyDisplayOptions {
  show: Record<string, unknown[]>;
}

/** Descriptor for a single configurable parameter (n8n: INodeProperties) */
export interface NodePropertyDescriptor {
  name: string;
  displayName: string;
  type: NodePropertyType;
  default: unknown;
  required?: boolean;
  description?: string;
  placeholder?: string;
  /** Valid only when type === 'options' */
  options?: NodePropertyOption[];
  /** Show this field only when another property has a specific value */
  displayOptions?: NodePropertyDisplayOptions;
}

// ─── Credential Requirement (n8n: INodeCredential) ──────────

/** Credential that the node requires at runtime (n8n: INodeCredential) */
export interface NodeCredentialRequirement {
  name: string;
  required: boolean;
}

// ─── Resource-Operation Pattern (n8n: resource + operation) ──

/** Resource-operation grouping, e.g. resource="contact", ops=["create","get","delete"] (n8n pattern) */
export interface NodeResourceOperation {
  resource: string;
  operations: string[];
}

// ─── Node Type Descriptor (n8n: INodeTypeDescription) ────────

/** Full declarative descriptor for a node type (n8n: INodeTypeDescription) */
export interface NodeTypeDescriptor {
  /** Unique machine name (n8n: name, e.g. "n8n-nodes-base.httpRequest") */
  name: string;
  /** Human-readable label shown in the editor */
  displayName: string;
  /** Short description of what this node does */
  description: string;
  /** Icon identifier (e.g. "fa:globe" or "file:http.svg") */
  icon: string;
  /** Functional group for categorisation */
  group: NodeGroup;
  /** Descriptor schema version (increment on breaking changes) */
  version: number;
  /** Ordered list of configurable parameters */
  properties: NodePropertyDescriptor[];
  /** Credentials required at runtime */
  credentials?: NodeCredentialRequirement[];
  /** Resource-operation pairs (omit for simple nodes) */
  resourceOperations?: NodeResourceOperation[];
}

// ─── Validation Result ───────────────────────────────────────

/** Result of parameter validation against a descriptor */
export interface NodeValidationResult {
  valid: boolean;
  /** One message per failing field */
  errors: string[];
}

// ─── Registry (n8n: NodesAndCredentialsModule) ───────────────

/** Central registry — mirrors n8n's node loading layer (register, lookup, validate, defaults). */
class NodeTypeRegistry {
  private readonly descriptors = new Map<string, NodeTypeDescriptor>();

  /** Register a node type. Overwrites any existing entry with the same name. */
  register(descriptor: NodeTypeDescriptor): void {
    this.descriptors.set(descriptor.name, descriptor);
  }

  /** Retrieve a descriptor by its unique name. Returns undefined if not found. */
  get(name: string): NodeTypeDescriptor | undefined {
    return this.descriptors.get(name);
  }

  /** Filter descriptors by functional group (n8n: group filter in editor). */
  getByGroup(group: NodeGroup): NodeTypeDescriptor[] {
    return [...this.descriptors.values()].filter((d) => d.group === group);
  }

  /** Return all registered descriptors. */
  listAll(): NodeTypeDescriptor[] {
    return [...this.descriptors.values()];
  }

  /** Extract declared default values for all properties of a node type (n8n: pre-fill pattern). */
  getPropertyDefaults(name: string): Record<string, unknown> {
    const descriptor = this.descriptors.get(name);
    if (!descriptor) return {};

    return Object.fromEntries(
      descriptor.properties.map((p) => [p.name, p.default]),
    );
  }

  /** Validate params against descriptor: checks required fields and 'options' allowed values. */
  validateParameters(
    name: string,
    params: Record<string, unknown>,
  ): NodeValidationResult {
    const descriptor = this.descriptors.get(name);
    if (!descriptor) {
      return { valid: false, errors: [`Unknown node type: "${name}"`] };
    }

    const errors: string[] = [];

    for (const prop of descriptor.properties) {
      const value = params[prop.name];
      const isMissing = value === undefined || value === null || value === '';

      if (prop.required && isMissing) {
        errors.push(`Required parameter "${prop.displayName}" is missing.`);
        continue;
      }

      if (prop.type === 'options' && !isMissing && prop.options) {
        const allowed = prop.options.map((o) => o.value);
        if (!allowed.includes(value as string | number)) {
          errors.push(
            `"${prop.displayName}" must be one of: ${allowed.join(', ')}.`,
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /** Remove a registered node type by name. */
  unregister(name: string): void {
    this.descriptors.delete(name);
  }

  /** Remove all registered node types. */
  clear(): void {
    this.descriptors.clear();
  }
}

// ─── Singleton Export ────────────────────────────────────────

/** Shared registry instance — import and call register() to add node types. */
export const nodeTypeRegistry = new NodeTypeRegistry();
