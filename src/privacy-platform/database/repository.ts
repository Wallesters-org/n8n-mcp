import { DatabaseAdapter } from '../../database/database-adapter.js';
import {
  Tenant, User, TenantMembership, Workspace, PolicyTemplate,
  PolicyTemplateVersion, PolicyAssignment, Connector, WorkspaceBinding,
  AuditEvent, PolicyConfig
} from '../types/index.js';
import * as crypto from 'crypto';

export class PrivacyRepository {
  constructor(private db: DatabaseAdapter) {}

  // ============================================================
  // Schema initialization
  // ============================================================

  initSchema(schemaSQL: string): void {
    this.db.exec(schemaSQL);
  }

  // ============================================================
  // Tenants
  // ============================================================

  createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Tenant {
    const id = crypto.randomUUID();
    this.db.prepare(`
      INSERT INTO tenants (id, name, plan, status)
      VALUES (?, ?, ?, ?)
    `).run(id, tenant.name, tenant.plan ?? 'solo', tenant.status ?? 'active');

    return this.getTenant(id)!;
  }

  getTenant(id: string): Tenant | null {
    const row = this.db.prepare(`
      SELECT * FROM tenants WHERE id = ? AND deleted_at IS NULL
    `).get(id) as any;

    if (!row) return null;
    return this.mapTenantRow(row);
  }

  // ============================================================
  // Users
  // ============================================================

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const id = crypto.randomUUID();
    this.db.prepare(`
      INSERT INTO users (id, email, display_name, status)
      VALUES (?, ?, ?, ?)
    `).run(id, user.email, user.displayName ?? null, user.status ?? 'active');

    return this.getUser(id)!;
  }

  getUser(id: string): User | null {
    const row = this.db.prepare(`
      SELECT * FROM users WHERE id = ? AND deleted_at IS NULL
    `).get(id) as any;

    if (!row) return null;
    return this.mapUserRow(row);
  }

  getUserByEmail(email: string): User | null {
    const row = this.db.prepare(`
      SELECT * FROM users WHERE email = ? AND deleted_at IS NULL
    `).get(email) as any;

    if (!row) return null;
    return this.mapUserRow(row);
  }

  // ============================================================
  // Tenant Memberships
  // ============================================================

  createMembership(tenantId: string, userId: string, role: string): TenantMembership {
    this.db.prepare(`
      INSERT INTO tenant_memberships (tenant_id, user_id, role)
      VALUES (?, ?, ?)
    `).run(tenantId, userId, role);

    return this.getMembership(tenantId, userId)!;
  }

  getMembership(tenantId: string, userId: string): TenantMembership | null {
    const row = this.db.prepare(`
      SELECT * FROM tenant_memberships
      WHERE tenant_id = ? AND user_id = ? AND deleted_at IS NULL
    `).get(tenantId, userId) as any;

    if (!row) return null;
    return this.mapMembershipRow(row);
  }

  listMemberships(tenantId: string): TenantMembership[] {
    const rows = this.db.prepare(`
      SELECT * FROM tenant_memberships
      WHERE tenant_id = ? AND deleted_at IS NULL
      ORDER BY created_at
    `).all(tenantId) as any[];

    return rows.map(row => this.mapMembershipRow(row));
  }

  // ============================================================
  // Workspaces
  // ============================================================

  createWorkspace(
    tenantId: string,
    workspace: { displayName: string; tags?: string[]; ownerUserId?: string }
  ): Workspace {
    const id = crypto.randomUUID();
    const tagsJson = JSON.stringify(workspace.tags ?? []);

    this.db.prepare(`
      INSERT INTO workspaces (id, tenant_id, display_name, tags_json, owner_user_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, tenantId, workspace.displayName, tagsJson, workspace.ownerUserId ?? null);

    return this.getWorkspace(tenantId, id)!;
  }

  getWorkspace(tenantId: string, id: string): Workspace | null {
    const row = this.db.prepare(`
      SELECT * FROM workspaces
      WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
    `).get(id, tenantId) as any;

    if (!row) return null;
    return this.mapWorkspaceRow(row);
  }

  listWorkspaces(tenantId: string): Workspace[] {
    const rows = this.db.prepare(`
      SELECT * FROM workspaces
      WHERE tenant_id = ? AND deleted_at IS NULL
      ORDER BY display_name
    `).all(tenantId) as any[];

    return rows.map(row => this.mapWorkspaceRow(row));
  }

  updateWorkspace(
    tenantId: string,
    id: string,
    updates: Partial<Pick<Workspace, 'displayName' | 'tags' | 'status'>>
  ): Workspace | null {
    const existing = this.getWorkspace(tenantId, id);
    if (!existing) return null;

    const setClauses: string[] = [];
    const params: any[] = [];

    if (updates.displayName !== undefined) {
      setClauses.push('display_name = ?');
      params.push(updates.displayName);
    }
    if (updates.tags !== undefined) {
      setClauses.push('tags_json = ?');
      params.push(JSON.stringify(updates.tags));
    }
    if (updates.status !== undefined) {
      setClauses.push('status = ?');
      params.push(updates.status);
    }

    if (setClauses.length === 0) return existing;

    setClauses.push("updated_at = datetime('now')");
    params.push(id, tenantId);

    this.db.prepare(`
      UPDATE workspaces
      SET ${setClauses.join(', ')}
      WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
    `).run(...params);

    return this.getWorkspace(tenantId, id);
  }

  archiveWorkspace(tenantId: string, id: string): boolean {
    const result = this.db.prepare(`
      UPDATE workspaces
      SET status = 'archived', deleted_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
    `).run(id, tenantId);

    return result.changes > 0;
  }

  // ============================================================
  // Policy Templates
  // ============================================================

  createPolicyTemplate(
    tenantId: string,
    template: { name: string; description?: string }
  ): PolicyTemplate {
    const id = crypto.randomUUID();

    this.db.prepare(`
      INSERT INTO policy_templates (id, tenant_id, name, description)
      VALUES (?, ?, ?, ?)
    `).run(id, tenantId, template.name, template.description ?? null);

    return this.getPolicyTemplate(tenantId, id)!;
  }

  getPolicyTemplate(tenantId: string, id: string): PolicyTemplate | null {
    const row = this.db.prepare(`
      SELECT * FROM policy_templates
      WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
    `).get(id, tenantId) as any;

    if (!row) return null;
    return this.mapPolicyTemplateRow(row);
  }

  listPolicyTemplates(tenantId: string): PolicyTemplate[] {
    const rows = this.db.prepare(`
      SELECT * FROM policy_templates
      WHERE tenant_id = ? AND deleted_at IS NULL
      ORDER BY name
    `).all(tenantId) as any[];

    return rows.map(row => this.mapPolicyTemplateRow(row));
  }

  // ============================================================
  // Policy Template Versions
  // ============================================================

  createPolicyTemplateVersion(
    tenantId: string,
    version: {
      templateId: string;
      versionLabel: string;
      policyJson: PolicyConfig;
      createdBy?: string;
    }
  ): PolicyTemplateVersion {
    const id = crypto.randomUUID();
    const policyJsonStr = JSON.stringify(version.policyJson);
    const policyHash = crypto.createHash('sha256').update(policyJsonStr).digest('hex');

    this.db.prepare(`
      INSERT INTO policy_template_versions
        (id, tenant_id, template_id, version_label, policy_json, policy_hash, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, tenantId, version.templateId, version.versionLabel,
      policyJsonStr, policyHash, version.createdBy ?? null
    );

    return this.getPolicyTemplateVersion(tenantId, id)!;
  }

  getPolicyTemplateVersion(tenantId: string, id: string): PolicyTemplateVersion | null {
    const row = this.db.prepare(`
      SELECT * FROM policy_template_versions
      WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
    `).get(id, tenantId) as any;

    if (!row) return null;
    return this.mapPolicyTemplateVersionRow(row);
  }

  getLatestPolicyVersion(tenantId: string, templateId: string): PolicyTemplateVersion | null {
    const row = this.db.prepare(`
      SELECT * FROM policy_template_versions
      WHERE tenant_id = ? AND template_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `).get(tenantId, templateId) as any;

    if (!row) return null;
    return this.mapPolicyTemplateVersionRow(row);
  }

  listPolicyVersions(tenantId: string, templateId: string): PolicyTemplateVersion[] {
    const rows = this.db.prepare(`
      SELECT * FROM policy_template_versions
      WHERE tenant_id = ? AND template_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
    `).all(tenantId, templateId) as any[];

    return rows.map(row => this.mapPolicyTemplateVersionRow(row));
  }

  // ============================================================
  // Policy Assignments
  // ============================================================

  createPolicyAssignment(
    tenantId: string,
    assignment: {
      workspaceId: string;
      templateVersionId: string;
      appliedBy?: string;
      appliedVia?: string;
      correlationId?: string;
      idempotencyKey?: string;
      mode?: string;
      changesSummary?: Record<string, unknown>;
    }
  ): PolicyAssignment {
    const id = crypto.randomUUID();
    const changesSummaryJson = assignment.changesSummary
      ? JSON.stringify(assignment.changesSummary)
      : null;

    this.db.prepare(`
      INSERT INTO policy_assignments
        (id, tenant_id, workspace_id, template_version_id, applied_by,
         applied_via, correlation_id, idempotency_key, mode, changes_summary_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, tenantId, assignment.workspaceId, assignment.templateVersionId,
      assignment.appliedBy ?? null, assignment.appliedVia ?? 'mcp',
      assignment.correlationId ?? null, assignment.idempotencyKey ?? null,
      assignment.mode ?? 'apply', changesSummaryJson
    );

    return this.getPolicyAssignment(tenantId, id)!;
  }

  getActivePolicyAssignment(tenantId: string, workspaceId: string): PolicyAssignment | null {
    const row = this.db.prepare(`
      SELECT * FROM policy_assignments
      WHERE tenant_id = ? AND workspace_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `).get(tenantId, workspaceId) as any;

    if (!row) return null;
    return this.mapPolicyAssignmentRow(row);
  }

  listPolicyAssignments(tenantId: string, workspaceId: string): PolicyAssignment[] {
    const rows = this.db.prepare(`
      SELECT * FROM policy_assignments
      WHERE tenant_id = ? AND workspace_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
    `).all(tenantId, workspaceId) as any[];

    return rows.map(row => this.mapPolicyAssignmentRow(row));
  }

  // ============================================================
  // Connectors
  // ============================================================

  createConnector(
    tenantId: string,
    connector: { type: string; name?: string; metadata?: Record<string, unknown> }
  ): Connector {
    const id = crypto.randomUUID();
    const metadataJson = JSON.stringify(connector.metadata ?? {});

    this.db.prepare(`
      INSERT INTO connectors (id, tenant_id, type, name, metadata_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, tenantId, connector.type, connector.name ?? null, metadataJson);

    return this.getConnector(tenantId, id)!;
  }

  getConnector(tenantId: string, id: string): Connector | null {
    const row = this.db.prepare(`
      SELECT * FROM connectors
      WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
    `).get(id, tenantId) as any;

    if (!row) return null;
    return this.mapConnectorRow(row);
  }

  listConnectors(tenantId: string): Connector[] {
    const rows = this.db.prepare(`
      SELECT * FROM connectors
      WHERE tenant_id = ? AND deleted_at IS NULL
      ORDER BY name
    `).all(tenantId) as any[];

    return rows.map(row => this.mapConnectorRow(row));
  }

  // ============================================================
  // Workspace Bindings
  // ============================================================

  createWorkspaceBinding(
    tenantId: string,
    binding: { workspaceId: string; connectorId: string }
  ): WorkspaceBinding {
    const id = crypto.randomUUID();

    this.db.prepare(`
      INSERT INTO workspace_bindings (id, tenant_id, workspace_id, connector_id)
      VALUES (?, ?, ?, ?)
    `).run(id, tenantId, binding.workspaceId, binding.connectorId);

    return this.getWorkspaceBinding(tenantId, id)!;
  }

  listWorkspaceBindings(tenantId: string, workspaceId: string): WorkspaceBinding[] {
    const rows = this.db.prepare(`
      SELECT * FROM workspace_bindings
      WHERE tenant_id = ? AND workspace_id = ? AND deleted_at IS NULL
      ORDER BY created_at
    `).all(tenantId, workspaceId) as any[];

    return rows.map(row => this.mapWorkspaceBindingRow(row));
  }

  // ============================================================
  // Audit Events
  // ============================================================

  createAuditEvent(event: Omit<AuditEvent, 'id' | 'eventTime'>): AuditEvent {
    const id = crypto.randomUUID();
    const payloadJson = JSON.stringify(event.payload ?? {});

    this.db.prepare(`
      INSERT INTO audit_events
        (id, tenant_id, actor_type, actor_id, actor_role, tool_name, action,
         correlation_id, idempotency_key, params_hash, status, error_code, payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, event.tenantId, event.actorType, event.actorId ?? null,
      event.actorRole ?? null, event.toolName ?? null, event.action,
      event.correlationId ?? null, event.idempotencyKey ?? null,
      event.paramsHash ?? null, event.status, event.errorCode ?? null,
      payloadJson
    );

    return this.getAuditEvent(event.tenantId, id)!;
  }

  listAuditEvents(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
      toolName?: string;
      correlationId?: string;
    }
  ): AuditEvent[] {
    const conditions: string[] = ['tenant_id = ?'];
    const params: any[] = [tenantId];

    if (options?.toolName) {
      conditions.push('tool_name = ?');
      params.push(options.toolName);
    }
    if (options?.correlationId) {
      conditions.push('correlation_id = ?');
      params.push(options.correlationId);
    }

    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    const sql = `
      SELECT * FROM audit_events
      WHERE ${conditions.join(' AND ')}
      ORDER BY event_time DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(row => this.mapAuditEventRow(row));
  }

  // ============================================================
  // Idempotency Records
  // ============================================================

  getIdempotencyRecord(key: string): { resultJson: string } | null {
    const row = this.db.prepare(`
      SELECT result_json FROM idempotency_records
      WHERE key = ? AND expires_at > datetime('now')
    `).get(key) as any;

    if (!row) return null;
    return { resultJson: row.result_json };
  }

  setIdempotencyRecord(
    key: string,
    tenantId: string,
    toolName: string,
    resultJson: string,
    ttlSeconds: number = 3600
  ): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO idempotency_records
        (key, tenant_id, tool_name, result_json, expires_at)
      VALUES (?, ?, ?, ?, datetime('now', '+' || ? || ' seconds'))
    `).run(key, tenantId, toolName, resultJson, ttlSeconds);
  }

  cleanExpiredIdempotencyRecords(): number {
    const result = this.db.prepare(`
      DELETE FROM idempotency_records WHERE expires_at <= datetime('now')
    `).run();

    return result.changes;
  }

  // ============================================================
  // Private helpers
  // ============================================================

  private getPolicyAssignment(tenantId: string, id: string): PolicyAssignment | null {
    const row = this.db.prepare(`
      SELECT * FROM policy_assignments
      WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
    `).get(id, tenantId) as any;

    if (!row) return null;
    return this.mapPolicyAssignmentRow(row);
  }

  private getWorkspaceBinding(tenantId: string, id: string): WorkspaceBinding | null {
    const row = this.db.prepare(`
      SELECT * FROM workspace_bindings
      WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
    `).get(id, tenantId) as any;

    if (!row) return null;
    return this.mapWorkspaceBindingRow(row);
  }

  private getAuditEvent(tenantId: string, id: string): AuditEvent | null {
    const row = this.db.prepare(`
      SELECT * FROM audit_events
      WHERE id = ? AND tenant_id = ?
    `).get(id, tenantId) as any;

    if (!row) return null;
    return this.mapAuditEventRow(row);
  }

  private safeJsonParse<T>(json: string | null | undefined, defaultValue: T): T {
    if (json === null || json === undefined) return defaultValue;
    try {
      return JSON.parse(json);
    } catch {
      return defaultValue;
    }
  }

  // ============================================================
  // Row mappers (snake_case DB columns -> camelCase TS properties)
  // ============================================================

  private mapTenantRow(row: any): Tenant {
    return {
      id: row.id,
      name: row.name,
      plan: row.plan,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  }

  private mapUserRow(row: any): User {
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  }

  private mapMembershipRow(row: any): TenantMembership {
    return {
      tenantId: row.tenant_id,
      userId: row.user_id,
      role: row.role,
      createdAt: row.created_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  }

  private mapWorkspaceRow(row: any): Workspace {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      displayName: row.display_name,
      tags: this.safeJsonParse<string[]>(row.tags_json, []),
      ownerUserId: row.owner_user_id ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  }

  private mapPolicyTemplateRow(row: any): PolicyTemplate {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  }

  private mapPolicyTemplateVersionRow(row: any): PolicyTemplateVersion {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      templateId: row.template_id,
      versionLabel: row.version_label,
      policyJson: this.safeJsonParse<PolicyConfig>(row.policy_json, {
        version: '',
        name: '',
        rules: [],
      }),
      policyHash: row.policy_hash,
      createdBy: row.created_by ?? undefined,
      createdAt: row.created_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  }

  private mapPolicyAssignmentRow(row: any): PolicyAssignment {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      workspaceId: row.workspace_id,
      templateVersionId: row.template_version_id,
      appliedBy: row.applied_by ?? undefined,
      appliedVia: row.applied_via,
      correlationId: row.correlation_id ?? undefined,
      idempotencyKey: row.idempotency_key ?? undefined,
      mode: row.mode,
      changesSummary: this.safeJsonParse<Record<string, unknown> | undefined>(
        row.changes_summary_json,
        undefined
      ),
      createdAt: row.created_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  }

  private mapConnectorRow(row: any): Connector {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type,
      name: row.name ?? undefined,
      status: row.status,
      metadata: this.safeJsonParse<Record<string, unknown>>(row.metadata_json, {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  }

  private mapWorkspaceBindingRow(row: any): WorkspaceBinding {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      workspaceId: row.workspace_id,
      connectorId: row.connector_id,
      status: row.status,
      createdAt: row.created_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  }

  private mapAuditEventRow(row: any): AuditEvent {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      eventTime: row.event_time,
      actorType: row.actor_type,
      actorId: row.actor_id ?? undefined,
      actorRole: row.actor_role ?? undefined,
      toolName: row.tool_name ?? undefined,
      action: row.action,
      correlationId: row.correlation_id ?? undefined,
      idempotencyKey: row.idempotency_key ?? undefined,
      paramsHash: row.params_hash ?? undefined,
      status: row.status,
      errorCode: row.error_code ?? undefined,
      payload: this.safeJsonParse<Record<string, unknown>>(row.payload_json, {}),
    };
  }
}
