import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrivacyToolHandlers } from '../../../src/privacy-platform/mcp/handlers.js';
import { privacyPlatformTools } from '../../../src/privacy-platform/mcp/tools.js';
import { RequestContext, PolicyConfig } from '../../../src/privacy-platform/types/index.js';

// --- Mock helpers ---

function createMockRepository() {
  return {
    initSchema: vi.fn(),
    createTenant: vi.fn(),
    getTenant: vi.fn(),
    createUser: vi.fn(),
    getUser: vi.fn(),
    getUserByEmail: vi.fn(),
    createMembership: vi.fn(),
    getMembership: vi.fn(),
    listMemberships: vi.fn(),
    createWorkspace: vi.fn().mockReturnValue({
      id: 'ws-1', tenantId: 't-1', displayName: 'Test Workspace', tags: [],
      status: 'active', createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }),
    getWorkspace: vi.fn().mockReturnValue({
      id: 'ws-1', tenantId: 't-1', displayName: 'Test Workspace', tags: [],
      status: 'active', createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }),
    listWorkspaces: vi.fn().mockReturnValue([]),
    updateWorkspace: vi.fn(),
    archiveWorkspace: vi.fn(),
    createPolicyTemplate: vi.fn().mockReturnValue({
      id: 'pt-1', tenantId: 't-1', name: 'Test', createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }),
    getPolicyTemplate: vi.fn(),
    listPolicyTemplates: vi.fn(),
    createPolicyTemplateVersion: vi.fn().mockReturnValue({
      id: 'pv-1', tenantId: 't-1', templateId: 'pt-1', versionLabel: '1.0',
      policyJson: { version: '1.0', name: 'Test', rules: [{ id: 'r1', category: 'network', action: 'enforce', condition: 'test' }] },
      policyHash: 'abc', createdAt: '2026-01-01',
    }),
    getPolicyTemplateVersion: vi.fn().mockReturnValue({
      id: 'pv-1', tenantId: 't-1', templateId: 'pt-1', versionLabel: '1.0',
      policyJson: { version: '1.0', name: 'Test', rules: [{ id: 'r1', category: 'network', action: 'enforce', condition: 'test' }] },
      policyHash: 'abc', createdAt: '2026-01-01',
    }),
    getLatestPolicyVersion: vi.fn(),
    listPolicyVersions: vi.fn(),
    createPolicyAssignment: vi.fn().mockReturnValue({
      id: 'pa-1', tenantId: 't-1', workspaceId: 'ws-1', templateVersionId: 'pv-1',
      appliedVia: 'mcp', mode: 'apply', createdAt: '2026-01-01',
    }),
    getActivePolicyAssignment: vi.fn().mockReturnValue(null),
    listPolicyAssignments: vi.fn(),
    createConnector: vi.fn().mockReturnValue({
      id: 'c-1', tenantId: 't-1', type: 'extension', name: 'TestConn', status: 'active',
      metadata: {}, createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }),
    getConnector: vi.fn(),
    listConnectors: vi.fn(),
    createWorkspaceBinding: vi.fn().mockReturnValue({
      id: 'wb-1', tenantId: 't-1', workspaceId: 'ws-1', connectorId: 'c-1',
      status: 'active', createdAt: '2026-01-01',
    }),
    listWorkspaceBindings: vi.fn().mockReturnValue([]),
    createAuditEvent: vi.fn().mockImplementation((event) => ({
      id: 'evt-1', eventTime: '2026-01-01T00:00:00Z', ...event,
    })),
    listAuditEvents: vi.fn().mockReturnValue([]),
    getIdempotencyRecord: vi.fn().mockReturnValue(null),
    setIdempotencyRecord: vi.fn(),
    cleanExpiredIdempotencyRecords: vi.fn(),
  } as any;
}

function makeAdminCtx(overrides?: Partial<RequestContext>): RequestContext {
  return {
    tenantId: 't-1',
    userId: 'u-1',
    role: 'admin',
    scopes: [
      'workspace:read', 'workspace:write', 'workspace:delete',
      'policy:read', 'policy:write', 'policy:validate',
      'connector:read', 'connector:write',
      'network:read', 'network:write', 'network:check',
      'audit:read', 'system:health', 'system:docs',
    ],
    ...overrides,
  };
}

function makeLauncherCtx(): RequestContext {
  return {
    tenantId: 't-1',
    userId: 'u-2',
    role: 'launcher',
    scopes: [
      'workspace:read', 'policy:read', 'policy:validate',
      'connector:read', 'network:read', 'network:check',
      'system:health', 'system:docs',
    ],
  };
}

function parseResult(response: { content: Array<{ type: string; text: string }> }): any {
  return JSON.parse(response.content[0].text);
}

// ============================================================
// Tool Definitions
// ============================================================

describe('Privacy Platform Tool Definitions', () => {
  it('defines exactly 10 tools', () => {
    expect(privacyPlatformTools).toHaveLength(10);
  });

  it('each tool has name, description, inputSchema, and annotations', () => {
    for (const tool of privacyPlatformTools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.annotations).toBeDefined();
      expect(tool.annotations?.title).toBeTruthy();
    }
  });

  it('read-only tools have readOnlyHint=true', () => {
    const readOnlyTools = ['tools_documentation', 'health_check', 'list_workspaces', 'get_workspace', 'validate_policy', 'check_network_leaks'];
    for (const name of readOnlyTools) {
      const tool = privacyPlatformTools.find(t => t.name === name);
      expect(tool?.annotations?.readOnlyHint, `${name} should be readOnly`).toBe(true);
    }
  });

  it('write tools do not have readOnlyHint', () => {
    const writeTools = ['create_workspace', 'apply_policy_template', 'set_network_routing', 'enroll_connector'];
    for (const name of writeTools) {
      const tool = privacyPlatformTools.find(t => t.name === name);
      expect(tool?.annotations?.readOnlyHint, `${name} should not be readOnly`).toBeFalsy();
    }
  });

  it('all tools have idempotentHint=true', () => {
    for (const tool of privacyPlatformTools) {
      expect(tool.annotations?.idempotentHint, `${tool.name} should be idempotent`).toBe(true);
    }
  });
});

// ============================================================
// PrivacyToolHandlers
// ============================================================

describe('PrivacyToolHandlers', () => {
  let mockRepo: ReturnType<typeof createMockRepository>;
  let handlers: PrivacyToolHandlers;

  beforeEach(() => {
    mockRepo = createMockRepository();
    handlers = new PrivacyToolHandlers(mockRepo);
  });

  describe('handleToolCall routing', () => {
    it('returns structured response for known tools', async () => {
      const result = await handlers.handleToolCall('health_check', {}, makeAdminCtx());
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
    });

    it('returns error for unknown tool', async () => {
      const result = await handlers.handleToolCall('nonexistent_tool', {}, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.code).toBe('UNKNOWN_TOOL');
    });

    it('returns error response (not throws) on failure', async () => {
      const result = await handlers.handleToolCall('create_workspace', {}, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.code).toBe('VALIDATION_FAILED'); // missing display_name
    });
  });

  describe('RBAC enforcement', () => {
    it('admin can call write tools', async () => {
      const result = await handlers.handleToolCall('create_workspace', { display_name: 'Test' }, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.workspace).toBeDefined();
    });

    it('launcher cannot call write tools', async () => {
      const result = await handlers.handleToolCall('create_workspace', { display_name: 'Test' }, makeLauncherCtx());
      const parsed = parseResult(result);
      expect(parsed.code).toBe('UNAUTHORIZED');
    });

    it('launcher can call read-only tools', async () => {
      const result = await handlers.handleToolCall('health_check', {}, makeLauncherCtx());
      const parsed = parseResult(result);
      expect(parsed.status).toBe('healthy');
    });
  });

  describe('Idempotency', () => {
    it('returns cached result for existing idempotency key', async () => {
      const cachedResponse = { content: [{ type: 'text', text: '{"cached":true}' }] };
      mockRepo.getIdempotencyRecord.mockReturnValueOnce({ resultJson: JSON.stringify(cachedResponse) });

      const result = await handlers.handleToolCall(
        'create_workspace',
        { display_name: 'Test', idempotency_key: 'idem-1' },
        makeAdminCtx()
      );
      expect(parseResult(result)).toEqual({ cached: true });
    });

    it('stores idempotency record after new write', async () => {
      const result = await handlers.handleToolCall(
        'create_workspace',
        { display_name: 'Test', idempotency_key: 'idem-new' },
        makeAdminCtx()
      );
      expect(mockRepo.setIdempotencyRecord).toHaveBeenCalledWith(
        'idem-new', 't-1', 'create_workspace', expect.any(String), 3600
      );
    });
  });

  describe('tools_documentation', () => {
    it('returns overview with tool list when no topic', async () => {
      const result = await handlers.handleToolCall('tools_documentation', {}, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.platform).toBeDefined();
      expect(parsed.tools).toBeDefined();
      expect(parsed.tools.length).toBe(10);
    });

    it('returns tool-specific docs for known topic', async () => {
      const result = await handlers.handleToolCall('tools_documentation', { topic: 'create_workspace' }, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.name).toBe('create_workspace');
      expect(parsed.parameters).toBeDefined();
    });

    it('returns error for unknown topic', async () => {
      const result = await handlers.handleToolCall('tools_documentation', { topic: 'nonexistent' }, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.error).toContain('nonexistent');
    });
  });

  describe('health_check', () => {
    it('returns healthy status with version', async () => {
      const result = await handlers.handleToolCall('health_check', {}, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.status).toBe('healthy');
      expect(parsed.version).toBeDefined();
      expect(parsed.uptime_seconds).toBeGreaterThanOrEqual(0);
    });

    it('includes connectors info when requested', async () => {
      const result = await handlers.handleToolCall('health_check', { includeConnectors: true }, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.connectors).toBeDefined();
    });
  });

  describe('create_workspace', () => {
    it('creates workspace successfully', async () => {
      const result = await handlers.handleToolCall('create_workspace', { display_name: 'My WS' }, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.workspace).toBeDefined();
      expect(parsed.message).toContain('My WS');
    });

    it('creates workspace with policy template', async () => {
      const result = await handlers.handleToolCall(
        'create_workspace',
        { display_name: 'Secure', policy_template: 'privacy' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.policy).not.toBeNull();
      expect(parsed.policy.templateName).toBe('Privacy Standard');
    });

    it('returns error for missing display_name', async () => {
      const result = await handlers.handleToolCall('create_workspace', {}, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.code).toBe('VALIDATION_FAILED');
    });

    it('returns error for unknown policy template', async () => {
      const result = await handlers.handleToolCall(
        'create_workspace',
        { display_name: 'Test', policy_template: 'nonexistent' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.code).toBe('VALIDATION_FAILED');
      expect(parsed.error).toContain('nonexistent');
    });
  });

  describe('list_workspaces', () => {
    it('returns workspace list with enrichment', async () => {
      mockRepo.listWorkspaces.mockReturnValueOnce([
        { id: 'ws-1', tenantId: 't-1', displayName: 'WS1', tags: ['dev'], status: 'active' },
      ]);
      const result = await handlers.handleToolCall('list_workspaces', {}, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.workspaces).toHaveLength(1);
      expect(parsed.total).toBe(1);
    });

    it('filters by tag', async () => {
      mockRepo.listWorkspaces.mockReturnValueOnce([
        { id: 'ws-1', tags: ['dev'], status: 'active' },
        { id: 'ws-2', tags: ['prod'], status: 'active' },
      ]);
      const result = await handlers.handleToolCall('list_workspaces', { tag: 'prod' }, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.workspaces).toHaveLength(1);
    });
  });

  describe('get_workspace', () => {
    it('returns workspace with policy and connector info', async () => {
      const result = await handlers.handleToolCall('get_workspace', { workspace_id: 'ws-1' }, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.workspace).toBeDefined();
      expect(parsed.connectors).toBeDefined();
    });

    it('returns error for missing workspace_id', async () => {
      const result = await handlers.handleToolCall('get_workspace', {}, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.code).toBe('VALIDATION_FAILED');
    });

    it('returns error for nonexistent workspace', async () => {
      mockRepo.getWorkspace.mockReturnValueOnce(null);
      const result = await handlers.handleToolCall('get_workspace', { workspace_id: 'nope' }, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.code).toBe('NOT_FOUND');
    });
  });

  describe('apply_policy_template', () => {
    it('applies built-in template', async () => {
      const result = await handlers.handleToolCall(
        'apply_policy_template',
        { workspace_id: 'ws-1', template: 'basic' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.mode).toBe('apply');
      expect(parsed.validation).toBeDefined();
    });

    it('supports dry_run mode', async () => {
      const result = await handlers.handleToolCall(
        'apply_policy_template',
        { workspace_id: 'ws-1', template: 'privacy', mode: 'dry_run' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.mode).toBe('dry_run');
      expect(parsed.assignment).toBeNull();
    });

    it('returns error for missing workspace_id', async () => {
      const result = await handlers.handleToolCall(
        'apply_policy_template',
        { template: 'basic' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.code).toBe('VALIDATION_FAILED');
    });

    it('returns error for nonexistent workspace', async () => {
      mockRepo.getWorkspace.mockReturnValueOnce(null);
      const result = await handlers.handleToolCall(
        'apply_policy_template',
        { workspace_id: 'nope', template: 'basic' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.code).toBe('NOT_FOUND');
    });
  });

  describe('validate_policy', () => {
    it('validates raw policy JSON', async () => {
      const policy: PolicyConfig = {
        version: '1.0', name: 'Test',
        rules: [{ id: 'r1', category: 'network', action: 'enforce', condition: 'test' }],
      };
      const result = await handlers.handleToolCall(
        'validate_policy',
        { policy_json: policy },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.valid).toBeDefined();
      expect(typeof parsed.riskScore).toBe('number');
    });

    it('returns error when neither workspace_id nor policy_json', async () => {
      const result = await handlers.handleToolCall('validate_policy', {}, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.code).toBe('VALIDATION_FAILED');
    });

    it('returns warning when workspace has no policy', async () => {
      mockRepo.getActivePolicyAssignment.mockReturnValueOnce(null);
      const result = await handlers.handleToolCall(
        'validate_policy',
        { workspace_id: 'ws-1' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.warnings).toBeDefined();
      expect(parsed.warnings.some((w: any) => w.code === 'NO_POLICY')).toBe(true);
    });
  });

  describe('set_network_routing', () => {
    it('configures network routing', async () => {
      const result = await handlers.handleToolCall(
        'set_network_routing',
        { workspace_id: 'ws-1', proxy: { enabled: true, type: 'socks5', host: 'proxy.example.com', port: 1080, credential_ref: 'ref-1' } },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.message).toContain('configured');
    });

    it('rejects plaintext credentials', async () => {
      const result = await handlers.handleToolCall(
        'set_network_routing',
        { workspace_id: 'ws-1', proxy: { enabled: true, type: 'http', host: 'x', port: 80, username: 'admin', password: 'secret' } },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.code).toBe('VALIDATION_FAILED');
      expect(parsed.error).toContain('credential_ref');
    });
  });

  describe('check_network_leaks', () => {
    it('returns info results when no connector', async () => {
      const result = await handlers.handleToolCall(
        'check_network_leaks',
        { workspace_id: 'ws-1' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.results).toBeDefined();
      expect(parsed.summary).toBeDefined();
    });

    it('warns on leaky policy settings', async () => {
      mockRepo.getActivePolicyAssignment.mockReturnValueOnce({ id: 'pa-1', templateVersionId: 'pv-1' });
      mockRepo.getPolicyTemplateVersion.mockReturnValueOnce({
        id: 'pv-1', policyJson: {
          version: '1.0', name: 'Leaky',
          rules: [],
          network: { webrtcPolicy: 'allow', dnsPolicy: 'system', proxyRequired: false, vpnRequired: false },
        },
        policyHash: 'x',
      });
      const result = await handlers.handleToolCall(
        'check_network_leaks',
        { workspace_id: 'ws-1' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      const warnings = parsed.results.filter((r: any) => r.status === 'warning');
      expect(warnings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('enroll_connector', () => {
    it('enrolls extension connector', async () => {
      const result = await handlers.handleToolCall(
        'enroll_connector',
        { type: 'extension', name: 'MyExt' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.connector).toBeDefined();
      expect(parsed.message).toContain('extension');
    });

    it('enrolls and binds to workspace', async () => {
      const result = await handlers.handleToolCall(
        'enroll_connector',
        { type: 'managed_sessions', workspace_id: 'ws-1' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.binding).toBeDefined();
    });

    it('returns error for missing type', async () => {
      const result = await handlers.handleToolCall('enroll_connector', {}, makeAdminCtx());
      const parsed = parseResult(result);
      expect(parsed.code).toBe('VALIDATION_FAILED');
    });

    it('returns error for invalid type', async () => {
      const result = await handlers.handleToolCall(
        'enroll_connector',
        { type: 'invalid_type' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('Error handling', () => {
    it('returns structured error for PrivacyPlatformError', async () => {
      mockRepo.getWorkspace.mockReturnValueOnce(null);
      const result = await handlers.handleToolCall(
        'get_workspace',
        { workspace_id: 'missing' },
        makeAdminCtx()
      );
      const parsed = parseResult(result);
      expect(parsed.code).toBe('NOT_FOUND');
      expect(parsed.error).toBeDefined();
    });

    it('logs audit event for failed calls', async () => {
      await handlers.handleToolCall('create_workspace', {}, makeAdminCtx());
      const failCalls = mockRepo.createAuditEvent.mock.calls.filter(
        (c: any[]) => c[0].status === 'failure'
      );
      expect(failCalls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
