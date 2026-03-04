import { describe, it, expect } from 'vitest';
import {
  hasScope,
  hasAllScopes,
  hasAnyScope,
  enforceScope,
  enforceAllScopes,
  enforceTenantIsolation,
  buildRequestContext,
  enforceToolAccess,
  TOOL_SCOPES,
} from '../../../src/privacy-platform/services/rbac.js';
import { ROLE_SCOPES, type Role, type Scope, type RequestContext } from '../../../src/privacy-platform/types/index.js';
import { PrivacyPlatformError } from '../../../src/privacy-platform/errors/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(overrides: Partial<RequestContext> & { role: Role; tenantId: string }): RequestContext {
  return buildRequestContext({
    tenantId: overrides.tenantId,
    userId: overrides.userId ?? 'user-1',
    role: overrides.role,
    correlationId: overrides.correlationId,
    idempotencyKey: overrides.idempotencyKey,
  });
}

const ALL_SCOPES: Scope[] = [
  'workspace:read', 'workspace:write', 'workspace:delete',
  'policy:read', 'policy:write', 'policy:validate',
  'connector:read', 'connector:write',
  'network:read', 'network:write', 'network:check',
  'audit:read', 'system:health', 'system:docs',
];

// ---------------------------------------------------------------------------
// hasScope
// ---------------------------------------------------------------------------

describe('hasScope', () => {
  describe('admin role', () => {
    it('should have every defined scope', () => {
      for (const scope of ALL_SCOPES) {
        expect(hasScope('admin', scope)).toBe(true);
      }
    });
  });

  describe('editor role', () => {
    const editorScopes = ROLE_SCOPES.editor;

    it('should have workspace:read', () => {
      expect(hasScope('editor', 'workspace:read')).toBe(true);
    });

    it('should have workspace:write', () => {
      expect(hasScope('editor', 'workspace:write')).toBe(true);
    });

    it('should NOT have workspace:delete', () => {
      expect(hasScope('editor', 'workspace:delete')).toBe(false);
    });

    it('should NOT have connector:write', () => {
      expect(hasScope('editor', 'connector:write')).toBe(false);
    });

    it('should have all scopes defined in ROLE_SCOPES.editor', () => {
      for (const scope of editorScopes) {
        expect(hasScope('editor', scope)).toBe(true);
      }
    });

    it('should not have scopes outside ROLE_SCOPES.editor', () => {
      const missing = ALL_SCOPES.filter(s => !editorScopes.includes(s));
      for (const scope of missing) {
        expect(hasScope('editor', scope)).toBe(false);
      }
    });
  });

  describe('launcher role', () => {
    const launcherScopes = ROLE_SCOPES.launcher;

    it('should have workspace:read', () => {
      expect(hasScope('launcher', 'workspace:read')).toBe(true);
    });

    it('should NOT have workspace:write', () => {
      expect(hasScope('launcher', 'workspace:write')).toBe(false);
    });

    it('should NOT have workspace:delete', () => {
      expect(hasScope('launcher', 'workspace:delete')).toBe(false);
    });

    it('should NOT have policy:write', () => {
      expect(hasScope('launcher', 'policy:write')).toBe(false);
    });

    it('should NOT have connector:write', () => {
      expect(hasScope('launcher', 'connector:write')).toBe(false);
    });

    it('should NOT have network:write', () => {
      expect(hasScope('launcher', 'network:write')).toBe(false);
    });

    it('should have policy:read', () => {
      expect(hasScope('launcher', 'policy:read')).toBe(true);
    });

    it('should have policy:validate', () => {
      expect(hasScope('launcher', 'policy:validate')).toBe(true);
    });

    it('should have system:health', () => {
      expect(hasScope('launcher', 'system:health')).toBe(true);
    });

    it('should have system:docs', () => {
      expect(hasScope('launcher', 'system:docs')).toBe(true);
    });

    it('should have all scopes defined in ROLE_SCOPES.launcher', () => {
      for (const scope of launcherScopes) {
        expect(hasScope('launcher', scope)).toBe(true);
      }
    });

    it('should not have scopes outside ROLE_SCOPES.launcher', () => {
      const missing = ALL_SCOPES.filter(s => !launcherScopes.includes(s));
      for (const scope of missing) {
        expect(hasScope('launcher', scope)).toBe(false);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// hasAllScopes
// ---------------------------------------------------------------------------

describe('hasAllScopes', () => {
  it('should return true when admin checks all scopes', () => {
    expect(hasAllScopes('admin', ALL_SCOPES)).toBe(true);
  });

  it('should return true when role has all requested scopes', () => {
    expect(hasAllScopes('editor', ['workspace:read', 'policy:read'])).toBe(true);
  });

  it('should return false when role is missing at least one scope', () => {
    expect(hasAllScopes('editor', ['workspace:read', 'workspace:delete'])).toBe(false);
  });

  it('should return true for an empty scope list', () => {
    expect(hasAllScopes('launcher', [])).toBe(true);
  });

  it('should return false when launcher checks write scopes', () => {
    expect(hasAllScopes('launcher', ['workspace:write', 'policy:write'])).toBe(false);
  });

  it('should return true when launcher checks only its own scopes', () => {
    expect(hasAllScopes('launcher', ROLE_SCOPES.launcher)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hasAnyScope
// ---------------------------------------------------------------------------

describe('hasAnyScope', () => {
  it('should return true when at least one scope matches', () => {
    expect(hasAnyScope('editor', ['workspace:delete', 'workspace:read'])).toBe(true);
  });

  it('should return false when no scopes match', () => {
    expect(hasAnyScope('launcher', ['workspace:write', 'workspace:delete', 'connector:write'])).toBe(false);
  });

  it('should return false for an empty scope list', () => {
    expect(hasAnyScope('admin', [])).toBe(false);
  });

  it('should return true when admin checks any single scope', () => {
    expect(hasAnyScope('admin', ['workspace:delete'])).toBe(true);
  });

  it('should return true when launcher has at least one matching scope', () => {
    expect(hasAnyScope('launcher', ['workspace:write', 'system:health'])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// enforceScope
// ---------------------------------------------------------------------------

describe('enforceScope', () => {
  it('should not throw when role has the required scope', () => {
    const ctx = makeContext({ role: 'admin', tenantId: 'tenant-1' });
    expect(() => enforceScope(ctx, 'workspace:delete', 'delete workspace')).not.toThrow();
  });

  it('should not throw for editor with workspace:read', () => {
    const ctx = makeContext({ role: 'editor', tenantId: 'tenant-1' });
    expect(() => enforceScope(ctx, 'workspace:read', 'read workspace')).not.toThrow();
  });

  it('should throw PrivacyPlatformError when scope is missing', () => {
    const ctx = makeContext({ role: 'launcher', tenantId: 'tenant-1' });
    expect(() => enforceScope(ctx, 'workspace:write', 'write workspace')).toThrow(PrivacyPlatformError);
  });

  it('should throw with UNAUTHORIZED error code', () => {
    const ctx = makeContext({ role: 'launcher', tenantId: 'tenant-1' });
    try {
      enforceScope(ctx, 'workspace:write', 'write workspace');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PrivacyPlatformError);
      expect((err as PrivacyPlatformError).code).toBe('UNAUTHORIZED');
    }
  });

  it('should include action and scope in error context', () => {
    const ctx = makeContext({ role: 'editor', tenantId: 'tenant-1' });
    try {
      enforceScope(ctx, 'workspace:delete', 'delete workspace');
      expect.unreachable('Should have thrown');
    } catch (err) {
      const ppErr = err as PrivacyPlatformError;
      expect(ppErr.context).toEqual({
        action: 'delete workspace',
        requiredScope: 'workspace:delete',
      });
    }
  });

  it('should include descriptive message', () => {
    const ctx = makeContext({ role: 'launcher', tenantId: 'tenant-1' });
    try {
      enforceScope(ctx, 'connector:write', 'enroll connector');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect((err as PrivacyPlatformError).message).toContain('enroll connector');
      expect((err as PrivacyPlatformError).message).toContain('connector:write');
    }
  });
});

// ---------------------------------------------------------------------------
// enforceAllScopes
// ---------------------------------------------------------------------------

describe('enforceAllScopes', () => {
  it('should not throw when role has all required scopes', () => {
    const ctx = makeContext({ role: 'admin', tenantId: 'tenant-1' });
    expect(() => enforceAllScopes(ctx, ['workspace:read', 'workspace:write', 'workspace:delete'], 'manage workspace')).not.toThrow();
  });

  it('should not throw for editor with editor-level scopes', () => {
    const ctx = makeContext({ role: 'editor', tenantId: 'tenant-1' });
    expect(() => enforceAllScopes(ctx, ['workspace:read', 'policy:write'], 'edit policy')).not.toThrow();
  });

  it('should throw on the first missing scope', () => {
    const ctx = makeContext({ role: 'launcher', tenantId: 'tenant-1' });
    expect(() => enforceAllScopes(ctx, ['workspace:read', 'workspace:write'], 'update workspace')).toThrow(PrivacyPlatformError);
  });

  it('should throw with the missing scope in the error', () => {
    const ctx = makeContext({ role: 'editor', tenantId: 'tenant-1' });
    try {
      enforceAllScopes(ctx, ['workspace:read', 'workspace:delete'], 'manage workspace');
      expect.unreachable('Should have thrown');
    } catch (err) {
      const ppErr = err as PrivacyPlatformError;
      expect(ppErr.code).toBe('UNAUTHORIZED');
      expect(ppErr.context?.requiredScope).toBe('workspace:delete');
    }
  });

  it('should not throw for an empty scope list', () => {
    const ctx = makeContext({ role: 'launcher', tenantId: 'tenant-1' });
    expect(() => enforceAllScopes(ctx, [], 'no-op')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// enforceTenantIsolation
// ---------------------------------------------------------------------------

describe('enforceTenantIsolation', () => {
  it('should not throw when tenant IDs match', () => {
    const ctx = makeContext({ role: 'admin', tenantId: 'tenant-abc' });
    expect(() => enforceTenantIsolation(ctx, 'tenant-abc')).not.toThrow();
  });

  it('should throw PrivacyPlatformError when tenant IDs differ', () => {
    const ctx = makeContext({ role: 'admin', tenantId: 'tenant-abc' });
    expect(() => enforceTenantIsolation(ctx, 'tenant-xyz')).toThrow(PrivacyPlatformError);
  });

  it('should throw with TENANT_ISOLATION_VIOLATION code', () => {
    const ctx = makeContext({ role: 'editor', tenantId: 'tenant-1' });
    try {
      enforceTenantIsolation(ctx, 'tenant-2');
      expect.unreachable('Should have thrown');
    } catch (err) {
      const ppErr = err as PrivacyPlatformError;
      expect(ppErr.code).toBe('TENANT_ISOLATION_VIOLATION');
    }
  });

  it('should include the resource tenant ID in error context', () => {
    const ctx = makeContext({ role: 'launcher', tenantId: 'my-tenant' });
    try {
      enforceTenantIsolation(ctx, 'other-tenant');
      expect.unreachable('Should have thrown');
    } catch (err) {
      const ppErr = err as PrivacyPlatformError;
      expect(ppErr.context).toEqual({ tenantId: 'other-tenant' });
    }
  });

  it('should include descriptive message referencing the tenant', () => {
    const ctx = makeContext({ role: 'admin', tenantId: 'a' });
    try {
      enforceTenantIsolation(ctx, 'b');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect((err as PrivacyPlatformError).message).toContain('b');
    }
  });
});

// ---------------------------------------------------------------------------
// buildRequestContext
// ---------------------------------------------------------------------------

describe('buildRequestContext', () => {
  it('should build context with correct tenantId, userId, and role', () => {
    const ctx = buildRequestContext({
      tenantId: 'tenant-42',
      userId: 'user-7',
      role: 'editor',
    });
    expect(ctx.tenantId).toBe('tenant-42');
    expect(ctx.userId).toBe('user-7');
    expect(ctx.role).toBe('editor');
  });

  it('should resolve scopes from ROLE_SCOPES for admin', () => {
    const ctx = buildRequestContext({
      tenantId: 't',
      userId: 'u',
      role: 'admin',
    });
    expect(ctx.scopes).toEqual(ROLE_SCOPES.admin);
  });

  it('should resolve scopes from ROLE_SCOPES for editor', () => {
    const ctx = buildRequestContext({
      tenantId: 't',
      userId: 'u',
      role: 'editor',
    });
    expect(ctx.scopes).toEqual(ROLE_SCOPES.editor);
  });

  it('should resolve scopes from ROLE_SCOPES for launcher', () => {
    const ctx = buildRequestContext({
      tenantId: 't',
      userId: 'u',
      role: 'launcher',
    });
    expect(ctx.scopes).toEqual(ROLE_SCOPES.launcher);
  });

  it('should include correlationId when provided', () => {
    const ctx = buildRequestContext({
      tenantId: 't',
      userId: 'u',
      role: 'admin',
      correlationId: 'corr-123',
    });
    expect(ctx.correlationId).toBe('corr-123');
  });

  it('should include idempotencyKey when provided', () => {
    const ctx = buildRequestContext({
      tenantId: 't',
      userId: 'u',
      role: 'admin',
      idempotencyKey: 'idem-456',
    });
    expect(ctx.idempotencyKey).toBe('idem-456');
  });

  it('should leave correlationId undefined when not provided', () => {
    const ctx = buildRequestContext({
      tenantId: 't',
      userId: 'u',
      role: 'launcher',
    });
    expect(ctx.correlationId).toBeUndefined();
  });

  it('should leave idempotencyKey undefined when not provided', () => {
    const ctx = buildRequestContext({
      tenantId: 't',
      userId: 'u',
      role: 'launcher',
    });
    expect(ctx.idempotencyKey).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// enforceToolAccess
// ---------------------------------------------------------------------------

describe('enforceToolAccess', () => {
  it('should not throw for admin accessing any tool', () => {
    const ctx = makeContext({ role: 'admin', tenantId: 'tenant-1' });
    for (const toolName of Object.keys(TOOL_SCOPES)) {
      expect(() => enforceToolAccess(ctx, toolName)).not.toThrow();
    }
  });

  it('should not throw for editor accessing tools within editor scopes', () => {
    const ctx = makeContext({ role: 'editor', tenantId: 'tenant-1' });
    // editor has workspace:read, workspace:write, policy:read, policy:write,
    // policy:validate, network:read, network:write, network:check, etc.
    expect(() => enforceToolAccess(ctx, 'list_workspaces')).not.toThrow();
    expect(() => enforceToolAccess(ctx, 'create_workspace')).not.toThrow();
    expect(() => enforceToolAccess(ctx, 'validate_policy')).not.toThrow();
    expect(() => enforceToolAccess(ctx, 'set_network_routing')).not.toThrow();
    expect(() => enforceToolAccess(ctx, 'health_check')).not.toThrow();
  });

  it('should throw for editor accessing archive_workspace (requires workspace:delete)', () => {
    const ctx = makeContext({ role: 'editor', tenantId: 'tenant-1' });
    expect(() => enforceToolAccess(ctx, 'archive_workspace')).toThrow(PrivacyPlatformError);
  });

  it('should throw for editor accessing enroll_connector (requires connector:write)', () => {
    const ctx = makeContext({ role: 'editor', tenantId: 'tenant-1' });
    expect(() => enforceToolAccess(ctx, 'enroll_connector')).toThrow(PrivacyPlatformError);
  });

  it('should not throw for launcher accessing read-only tools', () => {
    const ctx = makeContext({ role: 'launcher', tenantId: 'tenant-1' });
    expect(() => enforceToolAccess(ctx, 'list_workspaces')).not.toThrow();
    expect(() => enforceToolAccess(ctx, 'get_workspace')).not.toThrow();
    expect(() => enforceToolAccess(ctx, 'list_policy_templates')).not.toThrow();
    expect(() => enforceToolAccess(ctx, 'validate_policy')).not.toThrow();
    expect(() => enforceToolAccess(ctx, 'check_network_leaks')).not.toThrow();
    expect(() => enforceToolAccess(ctx, 'health_check')).not.toThrow();
    expect(() => enforceToolAccess(ctx, 'tools_documentation')).not.toThrow();
  });

  it('should throw for launcher accessing write tools', () => {
    const ctx = makeContext({ role: 'launcher', tenantId: 'tenant-1' });
    const writeTools = [
      'create_workspace',
      'update_workspace',
      'archive_workspace',
      'create_policy_template',
      'apply_policy_template',
      'auto_remediate_risks',
      'set_network_routing',
      'set_dns_policy',
      'enroll_connector',
      'bind_workspace_to_connector',
      'auto_fix_detection',
    ];
    for (const tool of writeTools) {
      expect(() => enforceToolAccess(ctx, tool)).toThrow(PrivacyPlatformError);
    }
  });

  it('should throw PrivacyPlatformError with UNKNOWN_TOOL for unregistered tools', () => {
    const ctx = makeContext({ role: 'admin', tenantId: 'tenant-1' });
    try {
      enforceToolAccess(ctx, 'nonexistent_tool');
      expect.unreachable('Should have thrown');
    } catch (err) {
      const ppErr = err as PrivacyPlatformError;
      expect(ppErr).toBeInstanceOf(PrivacyPlatformError);
      expect(ppErr.code).toBe('UNKNOWN_TOOL');
      expect(ppErr.context).toEqual({ toolName: 'nonexistent_tool' });
    }
  });

  it('should throw for empty tool name', () => {
    const ctx = makeContext({ role: 'admin', tenantId: 'tenant-1' });
    expect(() => enforceToolAccess(ctx, '')).toThrow(PrivacyPlatformError);
  });

  it('should include tool name prefix in the action when throwing unauthorized', () => {
    const ctx = makeContext({ role: 'launcher', tenantId: 'tenant-1' });
    try {
      enforceToolAccess(ctx, 'create_workspace');
      expect.unreachable('Should have thrown');
    } catch (err) {
      const ppErr = err as PrivacyPlatformError;
      expect(ppErr.code).toBe('UNAUTHORIZED');
      expect(ppErr.context?.action).toBe('tool:create_workspace');
    }
  });
});

// ---------------------------------------------------------------------------
// TOOL_SCOPES mapping
// ---------------------------------------------------------------------------

describe('TOOL_SCOPES mapping', () => {
  const expectedTools = [
    'create_workspace',
    'list_workspaces',
    'get_workspace',
    'update_workspace',
    'archive_workspace',
    'create_policy_template',
    'list_policy_templates',
    'apply_policy_template',
    'validate_policy',
    'auto_remediate_risks',
    'set_network_routing',
    'set_dns_policy',
    'check_network_leaks',
    'enroll_connector',
    'bind_workspace_to_connector',
    'analyze_privacy_posture',
    'suggest_configuration',
    'auto_fix_detection',
    'health_check',
    'tools_documentation',
  ];

  it('should contain exactly 20 tools', () => {
    expect(Object.keys(TOOL_SCOPES)).toHaveLength(20);
  });

  it('should contain all expected tool names', () => {
    for (const tool of expectedTools) {
      expect(TOOL_SCOPES).toHaveProperty(tool);
    }
  });

  it('should have no extra tools beyond the expected list', () => {
    const actual = Object.keys(TOOL_SCOPES).sort();
    const expected = [...expectedTools].sort();
    expect(actual).toEqual(expected);
  });

  it('should map every tool to a non-empty array of scopes', () => {
    for (const [tool, scopes] of Object.entries(TOOL_SCOPES)) {
      expect(Array.isArray(scopes)).toBe(true);
      expect(scopes.length).toBeGreaterThan(0);
    }
  });

  it('should map all scopes to valid Scope values', () => {
    for (const [, scopes] of Object.entries(TOOL_SCOPES)) {
      for (const scope of scopes) {
        expect(ALL_SCOPES).toContain(scope);
      }
    }
  });

  // Verify specific tool-to-scope mappings
  it('should require workspace:write for create_workspace', () => {
    expect(TOOL_SCOPES.create_workspace).toEqual(['workspace:write']);
  });

  it('should require workspace:read for list_workspaces and get_workspace', () => {
    expect(TOOL_SCOPES.list_workspaces).toEqual(['workspace:read']);
    expect(TOOL_SCOPES.get_workspace).toEqual(['workspace:read']);
  });

  it('should require workspace:delete for archive_workspace', () => {
    expect(TOOL_SCOPES.archive_workspace).toEqual(['workspace:delete']);
  });

  it('should require policy:write for create_policy_template and apply_policy_template', () => {
    expect(TOOL_SCOPES.create_policy_template).toEqual(['policy:write']);
    expect(TOOL_SCOPES.apply_policy_template).toEqual(['policy:write']);
  });

  it('should require policy:validate for validate_policy', () => {
    expect(TOOL_SCOPES.validate_policy).toEqual(['policy:validate']);
  });

  it('should require network:write for set_network_routing and set_dns_policy', () => {
    expect(TOOL_SCOPES.set_network_routing).toEqual(['network:write']);
    expect(TOOL_SCOPES.set_dns_policy).toEqual(['network:write']);
  });

  it('should require network:check for check_network_leaks', () => {
    expect(TOOL_SCOPES.check_network_leaks).toEqual(['network:check']);
  });

  it('should require connector:write for enroll_connector and bind_workspace_to_connector', () => {
    expect(TOOL_SCOPES.enroll_connector).toEqual(['connector:write']);
    expect(TOOL_SCOPES.bind_workspace_to_connector).toEqual(['connector:write']);
  });

  it('should require system:health for health_check', () => {
    expect(TOOL_SCOPES.health_check).toEqual(['system:health']);
  });

  it('should require system:docs for tools_documentation', () => {
    expect(TOOL_SCOPES.tools_documentation).toEqual(['system:docs']);
  });

  it('should require workspace:read for analyze_privacy_posture and suggest_configuration', () => {
    expect(TOOL_SCOPES.analyze_privacy_posture).toEqual(['workspace:read']);
    expect(TOOL_SCOPES.suggest_configuration).toEqual(['workspace:read']);
  });

  it('should require workspace:write for auto_fix_detection', () => {
    expect(TOOL_SCOPES.auto_fix_detection).toEqual(['workspace:write']);
  });

  it('should require policy:write for auto_remediate_risks', () => {
    expect(TOOL_SCOPES.auto_remediate_risks).toEqual(['policy:write']);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: Role hierarchy consistency
// ---------------------------------------------------------------------------

describe('role hierarchy consistency', () => {
  it('admin should have a superset of editor scopes', () => {
    for (const scope of ROLE_SCOPES.editor) {
      expect(ROLE_SCOPES.admin).toContain(scope);
    }
  });

  it('admin should have a superset of launcher scopes', () => {
    for (const scope of ROLE_SCOPES.launcher) {
      expect(ROLE_SCOPES.admin).toContain(scope);
    }
  });

  it('editor should have a superset of launcher scopes', () => {
    for (const scope of ROLE_SCOPES.launcher) {
      expect(ROLE_SCOPES.editor).toContain(scope);
    }
  });

  it('launcher should have the fewest scopes', () => {
    expect(ROLE_SCOPES.launcher.length).toBeLessThan(ROLE_SCOPES.editor.length);
    expect(ROLE_SCOPES.editor.length).toBeLessThan(ROLE_SCOPES.admin.length);
  });
});
