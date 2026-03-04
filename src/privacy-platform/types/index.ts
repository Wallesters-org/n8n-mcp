// Tenant types
export interface Tenant {
  id: string;
  name: string;
  plan: 'solo' | 'team' | 'enterprise';
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// RBAC
export type Role = 'admin' | 'editor' | 'launcher';
export type Scope = 'workspace:read' | 'workspace:write' | 'workspace:delete' |
  'policy:read' | 'policy:write' | 'policy:validate' |
  'connector:read' | 'connector:write' |
  'network:read' | 'network:write' | 'network:check' |
  'audit:read' | 'system:health' | 'system:docs';

export interface TenantMembership {
  tenantId: string;
  userId: string;
  role: Role;
  createdAt: string;
  deletedAt?: string;
}

// Workspace types
export interface Workspace {
  id: string;
  tenantId: string;
  displayName: string;
  tags: string[];
  ownerUserId?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Policy types
export interface PolicyTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PolicyTemplateVersion {
  id: string;
  tenantId: string;
  templateId: string;
  versionLabel: string;
  policyJson: PolicyConfig;
  policyHash: string;
  createdBy?: string;
  createdAt: string;
  deletedAt?: string;
}

export interface PolicyConfig {
  version: string;
  name: string;
  description?: string;
  rules: PolicyRule[];
  network?: NetworkPolicyConfig;
  privacy?: PrivacyPolicyConfig;
}

export interface PolicyRule {
  id: string;
  category: 'network' | 'browser' | 'storage' | 'privacy' | 'access';
  action: 'enforce' | 'warn' | 'log' | 'block';
  condition: string;
  description?: string;
}

export interface NetworkPolicyConfig {
  proxyRequired: boolean;
  proxyType?: 'socks5' | 'http' | 'residential';
  dnsPolicy: 'system' | 'doh' | 'dot';
  dnsProvider?: string;
  webrtcPolicy: 'disable' | 'relay_only' | 'allow';
  vpnRequired: boolean;
}

export interface PrivacyPolicyConfig {
  cookieIsolation: boolean;
  storagePartitioning: boolean;
  canvasProtection: 'noise' | 'block' | 'allow';
  webglProtection: 'noise' | 'block' | 'allow';
  audioProtection: 'noise' | 'block' | 'allow';
  fontEnumeration: 'restrict' | 'allow';
  screenResolution: 'letterbox' | 'spoof' | 'real';
}

// Policy assignment
export interface PolicyAssignment {
  id: string;
  tenantId: string;
  workspaceId: string;
  templateVersionId: string;
  appliedBy?: string;
  appliedVia: 'mcp' | 'ui' | 'system' | 'n8n';
  correlationId?: string;
  idempotencyKey?: string;
  mode: 'apply' | 'dry_run';
  changesSummary?: Record<string, unknown>;
  createdAt: string;
  deletedAt?: string;
}

// Connector types
export type ConnectorType = 'extension' | 'managed_sessions';

export interface Connector {
  id: string;
  tenantId: string;
  type: ConnectorType;
  name?: string;
  status: 'active' | 'inactive' | 'revoked';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface WorkspaceBinding {
  id: string;
  tenantId: string;
  workspaceId: string;
  connectorId: string;
  status: 'active' | 'inactive';
  createdAt: string;
  deletedAt?: string;
}

// Audit types
export interface AuditEvent {
  id: string;
  tenantId: string;
  eventTime: string;
  actorType: 'user' | 'service';
  actorId?: string;
  actorRole?: string;
  toolName?: string;
  action: string;
  correlationId?: string;
  idempotencyKey?: string;
  paramsHash?: string;
  status: 'success' | 'failure';
  errorCode?: string;
  payload: Record<string, unknown>;
}

// Validation types (reuse patterns from existing config-validator)
export type ValidationProfile = 'minimal' | 'runtime' | 'strict';

export interface PolicyValidationResult {
  valid: boolean;
  riskScore: number;  // 0-100
  errors: PolicyValidationError[];
  warnings: PolicyValidationWarning[];
  suggestions: string[];
}

export interface PolicyValidationError {
  code: string;
  severity: 'critical' | 'error';
  description: string;
  recommendedAction: string;
  ruleId?: string;
}

export interface PolicyValidationWarning {
  code: string;
  severity: 'warning' | 'info';
  description: string;
  recommendedAction?: string;
}

// MCP Tool types
export interface PrivacyToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  annotations: {
    title: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

// Request context for multi-tenant operations
export interface RequestContext {
  tenantId: string;
  userId: string;
  role: Role;
  scopes: Scope[];
  correlationId?: string;
  idempotencyKey?: string;
}

// RBAC scope mapping
export const ROLE_SCOPES: Record<Role, Scope[]> = {
  admin: [
    'workspace:read', 'workspace:write', 'workspace:delete',
    'policy:read', 'policy:write', 'policy:validate',
    'connector:read', 'connector:write',
    'network:read', 'network:write', 'network:check',
    'audit:read', 'system:health', 'system:docs',
  ],
  editor: [
    'workspace:read', 'workspace:write',
    'policy:read', 'policy:write', 'policy:validate',
    'connector:read',
    'network:read', 'network:write', 'network:check',
    'audit:read', 'system:health', 'system:docs',
  ],
  launcher: [
    'workspace:read',
    'policy:read', 'policy:validate',
    'connector:read',
    'network:read', 'network:check',
    'system:health', 'system:docs',
  ],
};
