import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrivacyRepository } from '../../../src/privacy-platform/database/repository.js';
import { AuditService } from '../../../src/privacy-platform/services/audit.js';
import { RequestContext, PolicyConfig } from '../../../src/privacy-platform/types/index.js';

// --- Mock helpers ---

function createMockStmt() {
  return {
    run: vi.fn().mockReturnValue({ changes: 1 }),
    get: vi.fn().mockReturnValue(null),
    all: vi.fn().mockReturnValue([]),
  };
}

function createMockDb() {
  const stmt = createMockStmt();
  return {
    db: {
      exec: vi.fn(),
      prepare: vi.fn().mockReturnValue(stmt),
    } as any,
    stmt,
  };
}

function makeCtx(overrides?: Partial<RequestContext>): RequestContext {
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

function makeValidPolicy(): PolicyConfig {
  return {
    version: '1.0',
    name: 'Test Policy',
    rules: [{ id: 'r1', category: 'network', action: 'enforce', condition: 'proxy.active', description: 'Test rule' }],
  };
}

// ============================================================
// PrivacyRepository
// ============================================================

describe('PrivacyRepository', () => {
  let mock: ReturnType<typeof createMockDb>;
  let repo: PrivacyRepository;

  beforeEach(() => {
    mock = createMockDb();
    repo = new PrivacyRepository(mock.db);
  });

  describe('initSchema', () => {
    it('executes the provided SQL schema', () => {
      repo.initSchema('CREATE TABLE test (id TEXT);');
      expect(mock.db.exec).toHaveBeenCalledWith('CREATE TABLE test (id TEXT);');
    });
  });

  // --- Tenants ---
  describe('Tenants', () => {
    it('createTenant calls INSERT and returns tenant via getTenant', () => {
      const tenantRow = { id: 'gen-id', name: 'Acme', plan: 'solo', status: 'active', created_at: '2026-01-01', updated_at: '2026-01-01', deleted_at: null };
      // First call = INSERT, second call = SELECT in getTenant
      mock.stmt.get.mockReturnValueOnce(tenantRow);
      const result = repo.createTenant({ name: 'Acme' });
      expect(mock.db.prepare).toHaveBeenCalled();
      expect(mock.stmt.run).toHaveBeenCalled();
      expect(result).toMatchObject({ name: 'Acme', plan: 'solo', status: 'active' });
    });

    it('getTenant returns null when not found', () => {
      mock.stmt.get.mockReturnValueOnce(null);
      expect(repo.getTenant('nonexistent')).toBeNull();
    });

    it('getTenant maps snake_case to camelCase', () => {
      mock.stmt.get.mockReturnValueOnce({
        id: 't-1', name: 'Acme', plan: 'team', status: 'active',
        created_at: '2026-01-01', updated_at: '2026-01-02', deleted_at: null,
      });
      const t = repo.getTenant('t-1');
      expect(t).toMatchObject({ id: 't-1', createdAt: '2026-01-01', updatedAt: '2026-01-02' });
      expect(t?.deletedAt).toBeUndefined();
    });

    it('createTenant defaults plan and status', () => {
      mock.stmt.get.mockReturnValueOnce({ id: 'x', name: 'Test', plan: 'solo', status: 'active', created_at: 'a', updated_at: 'b', deleted_at: null });
      repo.createTenant({ name: 'Test' });
      expect(mock.stmt.run).toHaveBeenCalledWith(expect.any(String), 'Test', 'solo', 'active');
    });
  });

  // --- Users ---
  describe('Users', () => {
    it('createUser calls INSERT and returns user', () => {
      mock.stmt.get.mockReturnValueOnce({ id: 'u-1', email: 'a@b.com', display_name: null, status: 'active', created_at: 'a', updated_at: 'b', deleted_at: null });
      const u = repo.createUser({ email: 'a@b.com' });
      expect(u.email).toBe('a@b.com');
      expect(u.status).toBe('active');
    });

    it('getUser returns null for nonexistent', () => {
      expect(repo.getUser('none')).toBeNull();
    });

    it('getUserByEmail returns mapped user', () => {
      mock.stmt.get.mockReturnValueOnce({ id: 'u-2', email: 'test@x.com', display_name: 'Test', status: 'active', created_at: 'a', updated_at: 'b', deleted_at: null });
      const u = repo.getUserByEmail('test@x.com');
      expect(u?.displayName).toBe('Test');
    });

    it('getUserByEmail returns null when not found', () => {
      expect(repo.getUserByEmail('none@x.com')).toBeNull();
    });
  });

  // --- Memberships ---
  describe('Memberships', () => {
    it('createMembership returns membership', () => {
      mock.stmt.get.mockReturnValueOnce({ tenant_id: 't-1', user_id: 'u-1', role: 'admin', created_at: 'a', deleted_at: null });
      const m = repo.createMembership('t-1', 'u-1', 'admin');
      expect(m.role).toBe('admin');
    });

    it('getMembership returns null when not found', () => {
      expect(repo.getMembership('t-1', 'u-x')).toBeNull();
    });

    it('listMemberships returns array', () => {
      mock.stmt.all.mockReturnValueOnce([
        { tenant_id: 't-1', user_id: 'u-1', role: 'admin', created_at: 'a', deleted_at: null },
        { tenant_id: 't-1', user_id: 'u-2', role: 'editor', created_at: 'b', deleted_at: null },
      ]);
      const list = repo.listMemberships('t-1');
      expect(list).toHaveLength(2);
      expect(list[1].role).toBe('editor');
    });
  });

  // --- Workspaces ---
  describe('Workspaces', () => {
    const wsRow = (overrides?: Record<string, unknown>) => ({
      id: 'ws-1', tenant_id: 't-1', display_name: 'Test WS', tags_json: '["dev"]',
      owner_user_id: 'u-1', status: 'active', created_at: 'a', updated_at: 'b', deleted_at: null,
      ...overrides,
    });

    it('createWorkspace returns workspace with parsed tags', () => {
      mock.stmt.get.mockReturnValueOnce(wsRow());
      const ws = repo.createWorkspace('t-1', { displayName: 'Test WS', tags: ['dev'] });
      expect(ws.tags).toEqual(['dev']);
      expect(ws.displayName).toBe('Test WS');
    });

    it('getWorkspace returns null when not found', () => {
      expect(repo.getWorkspace('t-1', 'nope')).toBeNull();
    });

    it('listWorkspaces returns array of workspaces', () => {
      mock.stmt.all.mockReturnValueOnce([wsRow(), wsRow({ id: 'ws-2', display_name: 'WS 2' })]);
      expect(repo.listWorkspaces('t-1')).toHaveLength(2);
    });

    it('updateWorkspace with displayName applies update', () => {
      mock.stmt.get
        .mockReturnValueOnce(wsRow()) // existing check
        .mockReturnValueOnce(wsRow({ display_name: 'Updated' })); // return updated
      const updated = repo.updateWorkspace('t-1', 'ws-1', { displayName: 'Updated' });
      expect(updated?.displayName).toBe('Updated');
    });

    it('updateWorkspace returns null for non-existent workspace', () => {
      mock.stmt.get.mockReturnValueOnce(null);
      expect(repo.updateWorkspace('t-1', 'nope', { displayName: 'X' })).toBeNull();
    });

    it('updateWorkspace with no changes returns existing', () => {
      mock.stmt.get.mockReturnValueOnce(wsRow());
      const result = repo.updateWorkspace('t-1', 'ws-1', {});
      expect(result?.id).toBe('ws-1');
    });

    it('archiveWorkspace returns true on success', () => {
      mock.stmt.run.mockReturnValueOnce({ changes: 1 });
      expect(repo.archiveWorkspace('t-1', 'ws-1')).toBe(true);
    });

    it('archiveWorkspace returns false when not found', () => {
      mock.stmt.run.mockReturnValueOnce({ changes: 0 });
      expect(repo.archiveWorkspace('t-1', 'nope')).toBe(false);
    });
  });

  // --- Policy Templates ---
  describe('PolicyTemplates', () => {
    it('createPolicyTemplate returns template', () => {
      mock.stmt.get.mockReturnValueOnce({ id: 'pt-1', tenant_id: 't-1', name: 'Test', description: null, created_at: 'a', updated_at: 'b', deleted_at: null });
      const pt = repo.createPolicyTemplate('t-1', { name: 'Test' });
      expect(pt.name).toBe('Test');
    });

    it('getPolicyTemplate returns null when not found', () => {
      expect(repo.getPolicyTemplate('t-1', 'nope')).toBeNull();
    });

    it('listPolicyTemplates returns templates', () => {
      mock.stmt.all.mockReturnValueOnce([
        { id: 'pt-1', tenant_id: 't-1', name: 'A', description: null, created_at: 'a', updated_at: 'b', deleted_at: null },
      ]);
      expect(repo.listPolicyTemplates('t-1')).toHaveLength(1);
    });
  });

  // --- Policy Template Versions ---
  describe('PolicyTemplateVersions', () => {
    const pvRow = (overrides?: Record<string, unknown>) => ({
      id: 'pv-1', tenant_id: 't-1', template_id: 'pt-1', version_label: '1.0',
      policy_json: JSON.stringify(makeValidPolicy()),
      policy_hash: 'abc123', created_by: 'u-1', created_at: 'a', deleted_at: null,
      ...overrides,
    });

    it('createPolicyTemplateVersion computes hash and returns version', () => {
      mock.stmt.get.mockReturnValueOnce(pvRow());
      const v = repo.createPolicyTemplateVersion('t-1', {
        templateId: 'pt-1', versionLabel: '1.0', policyJson: makeValidPolicy(),
      });
      expect(v.policyHash).toBe('abc123');
      expect(v.policyJson.name).toBe('Test Policy');
    });

    it('getPolicyTemplateVersion parses policyJson', () => {
      mock.stmt.get.mockReturnValueOnce(pvRow());
      const v = repo.getPolicyTemplateVersion('t-1', 'pv-1');
      expect(v?.policyJson.version).toBe('1.0');
    });

    it('getLatestPolicyVersion returns most recent', () => {
      mock.stmt.get.mockReturnValueOnce(pvRow({ version_label: '2.0' }));
      const v = repo.getLatestPolicyVersion('t-1', 'pt-1');
      expect(v?.versionLabel).toBe('2.0');
    });

    it('listPolicyVersions returns array', () => {
      mock.stmt.all.mockReturnValueOnce([pvRow(), pvRow({ id: 'pv-2', version_label: '2.0' })]);
      expect(repo.listPolicyVersions('t-1', 'pt-1')).toHaveLength(2);
    });

    it('getPolicyTemplateVersion returns null for nonexistent', () => {
      expect(repo.getPolicyTemplateVersion('t-1', 'nope')).toBeNull();
    });
  });

  // --- Policy Assignments ---
  describe('PolicyAssignments', () => {
    const paRow = (overrides?: Record<string, unknown>) => ({
      id: 'pa-1', tenant_id: 't-1', workspace_id: 'ws-1', template_version_id: 'pv-1',
      applied_by: 'u-1', applied_via: 'mcp', correlation_id: null, idempotency_key: null,
      mode: 'apply', changes_summary_json: '{"riskScore":10}', created_at: 'a', deleted_at: null,
      ...overrides,
    });

    it('createPolicyAssignment creates and returns assignment', () => {
      mock.stmt.get.mockReturnValueOnce(paRow());
      const a = repo.createPolicyAssignment('t-1', { workspaceId: 'ws-1', templateVersionId: 'pv-1' });
      expect(a.workspaceId).toBe('ws-1');
      expect(a.changesSummary).toEqual({ riskScore: 10 });
    });

    it('getActivePolicyAssignment returns latest', () => {
      mock.stmt.get.mockReturnValueOnce(paRow());
      const a = repo.getActivePolicyAssignment('t-1', 'ws-1');
      expect(a?.templateVersionId).toBe('pv-1');
    });

    it('getActivePolicyAssignment returns null when none', () => {
      expect(repo.getActivePolicyAssignment('t-1', 'ws-none')).toBeNull();
    });

    it('listPolicyAssignments returns array', () => {
      mock.stmt.all.mockReturnValueOnce([paRow()]);
      expect(repo.listPolicyAssignments('t-1', 'ws-1')).toHaveLength(1);
    });
  });

  // --- Connectors ---
  describe('Connectors', () => {
    it('createConnector returns connector with parsed metadata', () => {
      mock.stmt.get.mockReturnValueOnce({
        id: 'c-1', tenant_id: 't-1', type: 'extension', name: 'MyExt',
        status: 'active', metadata_json: '{"browser":"chrome"}',
        created_at: 'a', updated_at: 'b', deleted_at: null,
      });
      const c = repo.createConnector('t-1', { type: 'extension', name: 'MyExt', metadata: { browser: 'chrome' } });
      expect(c.metadata).toEqual({ browser: 'chrome' });
    });

    it('getConnector returns null when not found', () => {
      expect(repo.getConnector('t-1', 'nope')).toBeNull();
    });

    it('listConnectors returns array', () => {
      mock.stmt.all.mockReturnValueOnce([
        { id: 'c-1', tenant_id: 't-1', type: 'extension', name: null, status: 'active', metadata_json: '{}', created_at: 'a', updated_at: 'b', deleted_at: null },
      ]);
      expect(repo.listConnectors('t-1')).toHaveLength(1);
    });
  });

  // --- Workspace Bindings ---
  describe('WorkspaceBindings', () => {
    it('createWorkspaceBinding returns binding', () => {
      mock.stmt.get.mockReturnValueOnce({
        id: 'wb-1', tenant_id: 't-1', workspace_id: 'ws-1', connector_id: 'c-1',
        status: 'active', created_at: 'a', deleted_at: null,
      });
      const b = repo.createWorkspaceBinding('t-1', { workspaceId: 'ws-1', connectorId: 'c-1' });
      expect(b.connectorId).toBe('c-1');
    });

    it('listWorkspaceBindings returns empty for unbound workspace', () => {
      expect(repo.listWorkspaceBindings('t-1', 'ws-none')).toEqual([]);
    });
  });

  // --- Audit Events ---
  describe('AuditEvents', () => {
    const evtRow = (overrides?: Record<string, unknown>) => ({
      id: 'evt-1', tenant_id: 't-1', event_time: '2026-01-01',
      actor_type: 'user', actor_id: 'u-1', actor_role: 'admin',
      tool_name: 'create_workspace', action: 'TOOL_CALL',
      correlation_id: 'corr-1', idempotency_key: null,
      params_hash: 'h1', status: 'success', error_code: null,
      payload_json: '{"key":"val"}',
      ...overrides,
    });

    it('createAuditEvent creates event with payload', () => {
      mock.stmt.get.mockReturnValueOnce(evtRow());
      const e = repo.createAuditEvent({
        tenantId: 't-1', actorType: 'user', actorId: 'u-1', actorRole: 'admin',
        action: 'TOOL_CALL', status: 'success', payload: { key: 'val' },
      });
      expect(e.payload).toEqual({ key: 'val' });
      expect(e.action).toBe('TOOL_CALL');
    });

    it('listAuditEvents returns events with default limit', () => {
      mock.stmt.all.mockReturnValueOnce([evtRow()]);
      const list = repo.listAuditEvents('t-1');
      expect(list).toHaveLength(1);
    });

    it('listAuditEvents filters by toolName', () => {
      mock.stmt.all.mockReturnValueOnce([evtRow()]);
      repo.listAuditEvents('t-1', { toolName: 'create_workspace' });
      // The prepare should be called with SQL containing tool_name filter
      const lastCall = mock.db.prepare.mock.calls[mock.db.prepare.mock.calls.length - 1][0];
      expect(lastCall).toContain('tool_name');
    });

    it('listAuditEvents filters by correlationId', () => {
      mock.stmt.all.mockReturnValueOnce([evtRow()]);
      repo.listAuditEvents('t-1', { correlationId: 'corr-1' });
      const lastCall = mock.db.prepare.mock.calls[mock.db.prepare.mock.calls.length - 1][0];
      expect(lastCall).toContain('correlation_id');
    });
  });

  // --- Idempotency ---
  describe('IdempotencyRecords', () => {
    it('setIdempotencyRecord stores record', () => {
      repo.setIdempotencyRecord('key-1', 't-1', 'create_workspace', '{"result":"ok"}', 3600);
      expect(mock.stmt.run).toHaveBeenCalled();
    });

    it('getIdempotencyRecord returns null for nonexistent', () => {
      expect(repo.getIdempotencyRecord('nope')).toBeNull();
    });

    it('getIdempotencyRecord returns record when found', () => {
      mock.stmt.get.mockReturnValueOnce({ result_json: '{"ok":true}' });
      const rec = repo.getIdempotencyRecord('key-1');
      expect(rec?.resultJson).toBe('{"ok":true}');
    });

    it('cleanExpiredIdempotencyRecords returns count', () => {
      mock.stmt.run.mockReturnValueOnce({ changes: 3 });
      expect(repo.cleanExpiredIdempotencyRecords()).toBe(3);
    });
  });

  // --- Row mapping edge cases ---
  describe('Row mapping', () => {
    it('handles null deleted_at as undefined', () => {
      mock.stmt.get.mockReturnValueOnce({
        id: 't-1', name: 'Test', plan: 'solo', status: 'active',
        created_at: 'a', updated_at: 'b', deleted_at: null,
      });
      const t = repo.getTenant('t-1');
      expect(t?.deletedAt).toBeUndefined();
    });

    it('safely parses invalid JSON with default', () => {
      mock.stmt.get.mockReturnValueOnce({
        id: 'ws-1', tenant_id: 't-1', display_name: 'X', tags_json: 'INVALID',
        owner_user_id: null, status: 'active', created_at: 'a', updated_at: 'b', deleted_at: null,
      });
      const ws = repo.getWorkspace('t-1', 'ws-1');
      expect(ws?.tags).toEqual([]);
    });

    it('handles null optional fields gracefully', () => {
      mock.stmt.get.mockReturnValueOnce({
        id: 'u-1', email: 'x@y.com', display_name: null,
        status: 'active', created_at: 'a', updated_at: 'b', deleted_at: null,
      });
      const u = repo.getUser('u-1');
      expect(u?.displayName).toBeUndefined();
    });
  });
});

// ============================================================
// AuditService
// ============================================================

describe('AuditService', () => {
  let mockRepo: any;
  let audit: AuditService;

  beforeEach(() => {
    mockRepo = {
      createAuditEvent: vi.fn().mockImplementation((event) => ({
        id: 'evt-1',
        eventTime: '2026-01-01T00:00:00Z',
        ...event,
      })),
      listAuditEvents: vi.fn().mockReturnValue([]),
    };
    audit = new AuditService(mockRepo);
  });

  describe('logEvent', () => {
    it('creates audit event with fields from RequestContext', () => {
      const ctx = makeCtx({ correlationId: 'corr-1', idempotencyKey: 'idem-1' });
      audit.logEvent(ctx, { action: 'TEST', status: 'success' });
      expect(mockRepo.createAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 't-1',
          actorId: 'u-1',
          actorRole: 'admin',
          correlationId: 'corr-1',
          idempotencyKey: 'idem-1',
          action: 'TEST',
          status: 'success',
        })
      );
    });

    it('computes paramsHash when paramsToHash is provided', () => {
      const ctx = makeCtx();
      audit.logEvent(ctx, { action: 'TEST', status: 'success', paramsToHash: { key: 'value' } });
      const call = mockRepo.createAuditEvent.mock.calls[0][0];
      expect(call.paramsHash).toBeDefined();
      expect(call.paramsHash).toHaveLength(64); // SHA-256 hex
    });

    it('does not set paramsHash when paramsToHash is absent', () => {
      const ctx = makeCtx();
      audit.logEvent(ctx, { action: 'TEST', status: 'success' });
      const call = mockRepo.createAuditEvent.mock.calls[0][0];
      expect(call.paramsHash).toBeUndefined();
    });

    it('passes toolName and errorCode', () => {
      const ctx = makeCtx();
      audit.logEvent(ctx, { action: 'FAIL', status: 'failure', toolName: 'create_workspace', errorCode: 'VALIDATION_FAILED' });
      const call = mockRepo.createAuditEvent.mock.calls[0][0];
      expect(call.toolName).toBe('create_workspace');
      expect(call.errorCode).toBe('VALIDATION_FAILED');
    });
  });

  describe('logToolCall', () => {
    it('logs successful tool call with TOOL_CALL action', () => {
      const ctx = makeCtx();
      audit.logToolCall(ctx, 'create_workspace', { name: 'test' }, { status: 'success' });
      const call = mockRepo.createAuditEvent.mock.calls[0][0];
      expect(call.action).toBe('TOOL_CALL');
      expect(call.status).toBe('success');
    });

    it('logs failed tool call with error code', () => {
      const ctx = makeCtx();
      audit.logToolCall(ctx, 'create_workspace', {}, { status: 'failure', errorCode: 'VALIDATION_FAILED' });
      const call = mockRepo.createAuditEvent.mock.calls[0][0];
      expect(call.status).toBe('failure');
      expect(call.errorCode).toBe('VALIDATION_FAILED');
    });

    it('includes tool name in payload', () => {
      const ctx = makeCtx();
      audit.logToolCall(ctx, 'validate_policy', {}, { status: 'success' });
      const call = mockRepo.createAuditEvent.mock.calls[0][0];
      expect(call.payload.tool).toBe('validate_policy');
    });
  });

  describe('logPolicyChange', () => {
    it('logs POLICY_APPLIED event', () => {
      const ctx = makeCtx();
      audit.logPolicyChange(ctx, 'ws-1', 'pv-1', 'apply');
      const call = mockRepo.createAuditEvent.mock.calls[0][0];
      expect(call.action).toBe('POLICY_APPLIED');
      expect(call.payload).toMatchObject({ workspaceId: 'ws-1', templateVersionId: 'pv-1', mode: 'apply' });
    });

    it('includes mode in payload for dry_run', () => {
      const ctx = makeCtx();
      audit.logPolicyChange(ctx, 'ws-1', 'pv-1', 'dry_run');
      const call = mockRepo.createAuditEvent.mock.calls[0][0];
      expect(call.payload.mode).toBe('dry_run');
    });
  });

  describe('logConnectorEnrollment', () => {
    it('logs CONNECTOR_ENROLLED event', () => {
      const ctx = makeCtx();
      audit.logConnectorEnrollment(ctx, 'c-1', 'extension');
      const call = mockRepo.createAuditEvent.mock.calls[0][0];
      expect(call.action).toBe('CONNECTOR_ENROLLED');
      expect(call.payload).toMatchObject({ connectorId: 'c-1', connectorType: 'extension' });
    });
  });

  describe('queryEvents', () => {
    it('delegates to repository.listAuditEvents', () => {
      audit.queryEvents('t-1');
      expect(mockRepo.listAuditEvents).toHaveBeenCalledWith('t-1', undefined);
    });

    it('passes filter options through', () => {
      audit.queryEvents('t-1', { limit: 50, toolName: 'health_check' });
      expect(mockRepo.listAuditEvents).toHaveBeenCalledWith('t-1', { limit: 50, toolName: 'health_check' });
    });
  });

  describe('countEvents', () => {
    it('returns total count without since filter', () => {
      mockRepo.listAuditEvents.mockReturnValueOnce([
        { id: '1', eventTime: '2026-01-01' },
        { id: '2', eventTime: '2026-01-02' },
      ]);
      expect(audit.countEvents('t-1')).toBe(2);
    });

    it('filters by timestamp when since is provided', () => {
      mockRepo.listAuditEvents.mockReturnValueOnce([
        { id: '1', eventTime: '2025-12-01' },
        { id: '2', eventTime: '2026-01-15' },
        { id: '3', eventTime: '2026-02-01' },
      ]);
      expect(audit.countEvents('t-1', '2026-01-01')).toBe(2);
    });
  });
});
