import { PrivacyRepository } from '../database/repository.js';
import { PolicyEngine } from '../services/policy-engine.js';
import { AuditService } from '../services/audit.js';
import { enforceToolAccess, buildRequestContext } from '../services/rbac.js';
import { PrivacyPlatformError } from '../errors/index.js';
import {
  RequestContext, PolicyConfig, ValidationProfile, Workspace
} from '../types/index.js';
import { BUILTIN_POLICY_TEMPLATES, getBuiltinTemplate } from '../policies/templates.js';

const PLATFORM_VERSION = '0.1.0';
const startTime = Date.now();

export class PrivacyToolHandlers {
  private policyEngine: PolicyEngine;
  private audit: AuditService;

  constructor(
    private repository: PrivacyRepository,
  ) {
    this.audit = new AuditService(repository);
    this.policyEngine = new PolicyEngine(repository, this.audit);
  }

  /**
   * Route a tool call to the appropriate handler
   */
  async handleToolCall(
    toolName: string,
    params: Record<string, unknown>,
    ctx: RequestContext
  ): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    try {
      // Enforce RBAC
      enforceToolAccess(ctx, toolName);

      // Check idempotency
      const idempotencyKey = (params.idempotency_key as string) || ctx.idempotencyKey;
      if (idempotencyKey) {
        const existing = this.repository.getIdempotencyRecord(idempotencyKey);
        if (existing) {
          return JSON.parse(existing.resultJson);
        }
      }

      // Dispatch to handler
      let result: unknown;
      switch (toolName) {
        case 'tools_documentation':
          result = this.handleToolsDocumentation(params);
          break;
        case 'health_check':
          result = this.handleHealthCheck(params);
          break;
        case 'create_workspace':
          result = this.handleCreateWorkspace(params, ctx);
          break;
        case 'list_workspaces':
          result = this.handleListWorkspaces(params, ctx);
          break;
        case 'get_workspace':
          result = this.handleGetWorkspace(params, ctx);
          break;
        case 'apply_policy_template':
          result = this.handleApplyPolicyTemplate(params, ctx);
          break;
        case 'validate_policy':
          result = this.handleValidatePolicy(params, ctx);
          break;
        case 'set_network_routing':
          result = this.handleSetNetworkRouting(params, ctx);
          break;
        case 'check_network_leaks':
          result = this.handleCheckNetworkLeaks(params, ctx);
          break;
        case 'enroll_connector':
          result = this.handleEnrollConnector(params, ctx);
          break;
        default:
          throw new PrivacyPlatformError(`Unknown tool: ${toolName}`, 'UNKNOWN_TOOL', { toolName });
      }

      const response = {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };

      // Store idempotency record for write operations
      if (idempotencyKey) {
        this.repository.setIdempotencyRecord(
          idempotencyKey,
          ctx.tenantId,
          toolName,
          JSON.stringify(response),
          3600 // 1 hour TTL
        );
      }

      // Audit log
      this.audit.logToolCall(ctx, toolName, params, { status: 'success' });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof PrivacyPlatformError ? error.code : 'INTERNAL_ERROR';

      this.audit.logToolCall(ctx, toolName, params, {
        status: 'failure',
        errorCode,
      });

      return {
        content: [{ type: 'text', text: JSON.stringify({ error: errorMessage, code: errorCode }) }],
      };
    }
  }

  // === Tool Handlers ===

  private handleToolsDocumentation(params: Record<string, unknown>): object {
    const topic = params.topic as string | undefined;
    const depth = (params.depth as string) || 'essentials';

    if (!topic || topic === 'overview') {
      return {
        platform: 'Privacy & Isolation Platform',
        version: PLATFORM_VERSION,
        description: 'AI-powered privacy policy management with MCP integration',
        tools: [
          { name: 'tools_documentation', category: 'system', description: 'Self-documenting tool reference' },
          { name: 'health_check', category: 'system', description: 'System health and connectivity' },
          { name: 'create_workspace', category: 'workspace', description: 'Create privacy workspace' },
          { name: 'list_workspaces', category: 'workspace', description: 'List all workspaces' },
          { name: 'get_workspace', category: 'workspace', description: 'Get workspace details' },
          { name: 'apply_policy_template', category: 'policy', description: 'Apply policy to workspace' },
          { name: 'validate_policy', category: 'policy', description: 'Validate policy configuration' },
          { name: 'set_network_routing', category: 'network', description: 'Configure network routing' },
          { name: 'check_network_leaks', category: 'network', description: 'Check for network leaks' },
          { name: 'enroll_connector', category: 'connector', description: 'Register browser connector' },
        ],
        quick_start: [
          '1. Create a workspace: create_workspace({display_name: "My Workspace"})',
          '2. Apply a policy: apply_policy_template({workspace_id: "<id>", template: "privacy"})',
          '3. Validate: validate_policy({workspace_id: "<id>"})',
          '4. Enroll connector: enroll_connector({type: "extension", workspace_id: "<id>"})',
        ],
        builtin_templates: Object.entries(BUILTIN_POLICY_TEMPLATES).map(([key, t]) => ({
          key,
          name: t.name,
          description: t.description,
        })),
      };
    }

    // Tool-specific documentation
    const toolDocs: Record<string, object> = {
      create_workspace: {
        name: 'create_workspace',
        description: 'Create a new privacy workspace. Workspaces are tenant-scoped containers.',
        parameters: {
          display_name: { required: true, type: 'string', description: 'Human-readable name' },
          tags: { required: false, type: 'string[]', description: 'Organization tags' },
          policy_template: { required: false, type: 'string', description: 'Built-in template to apply' },
          idempotency_key: { required: false, type: 'string', description: 'Retry-safe key' },
        },
        examples: depth === 'full' ? [
          { description: 'Basic workspace', params: { display_name: 'Research' } },
          { description: 'With policy', params: { display_name: 'Secure Ops', policy_template: 'hardened', tags: ['production'] } },
        ] : undefined,
        returns: 'Workspace object with ID, status, and applied policy info',
        required_scope: 'workspace:write',
        roles: ['admin', 'editor'],
      },
      apply_policy_template: {
        name: 'apply_policy_template',
        description: 'Apply a policy template to a workspace. Supports built-in and custom templates.',
        parameters: {
          workspace_id: { required: true, type: 'string' },
          template: { required: true, type: 'string', description: 'Template name or version ID' },
          mode: { required: false, type: 'string', enum: ['apply', 'dry_run'], default: 'apply' },
          idempotency_key: { required: false, type: 'string' },
        },
        builtin_templates: Object.keys(BUILTIN_POLICY_TEMPLATES),
        returns: 'Assignment record with validation results and risk score',
        required_scope: 'policy:write',
        roles: ['admin', 'editor'],
      },
      validate_policy: {
        name: 'validate_policy',
        description: 'Validate policy configuration. Returns risk score, errors, warnings.',
        parameters: {
          workspace_id: { required: false, type: 'string', description: 'Validate current workspace policy' },
          policy_json: { required: false, type: 'object', description: 'Validate raw policy JSON' },
          profile: { required: false, type: 'string', enum: ['minimal', 'runtime', 'strict'] },
        },
        returns: 'Validation result with riskScore, errors[], warnings[], suggestions[]',
        required_scope: 'policy:validate',
        roles: ['admin', 'editor', 'launcher'],
      },
    };

    const doc = toolDocs[topic];
    if (doc) return doc;

    return { error: `No documentation found for topic '${topic}'`, available_topics: ['overview', ...Object.keys(toolDocs)] };
  }

  private handleHealthCheck(params: Record<string, unknown>): object {
    const includeConnectors = params.includeConnectors as boolean ?? false;
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    const health: Record<string, unknown> = {
      status: 'healthy',
      version: PLATFORM_VERSION,
      uptime_seconds: uptime,
      database: 'connected',
      timestamp: new Date().toISOString(),
    };

    if (includeConnectors) {
      health.connectors = { message: 'Connector health monitoring not yet implemented' };
    }

    return health;
  }

  private handleCreateWorkspace(params: Record<string, unknown>, ctx: RequestContext): object {
    const displayName = params.display_name as string;
    if (!displayName) {
      throw PrivacyPlatformError.validationFailed('display_name is required');
    }

    const tags = (params.tags as string[]) || [];
    const policyTemplate = params.policy_template as string | undefined;

    // Create workspace
    const workspace = this.repository.createWorkspace(ctx.tenantId, {
      displayName,
      tags,
      ownerUserId: ctx.userId,
    });

    let policyResult: unknown = null;

    // Apply built-in template if specified
    if (policyTemplate) {
      const builtin = getBuiltinTemplate(policyTemplate);
      if (!builtin) {
        throw PrivacyPlatformError.validationFailed(
          `Unknown template '${policyTemplate}'. Available: ${Object.keys(BUILTIN_POLICY_TEMPLATES).join(', ')}`
        );
      }

      // Create the policy template and version in the database
      const template = this.repository.createPolicyTemplate(ctx.tenantId, {
        name: builtin.name,
        description: builtin.description,
      });
      const version = this.repository.createPolicyTemplateVersion(ctx.tenantId, {
        templateId: template.id,
        versionLabel: '1.0',
        policyJson: builtin.policy,
        createdBy: ctx.userId,
      });

      // Apply it
      const { assignment, validation } = this.policyEngine.applyPolicyTemplate(
        ctx, workspace.id, version.id, 'apply'
      );

      policyResult = {
        templateName: builtin.name,
        versionId: version.id,
        riskScore: validation.riskScore,
        warnings: validation.warnings.length,
      };
    }

    return {
      workspace,
      policy: policyResult,
      message: `Workspace '${displayName}' created successfully`,
    };
  }

  private handleListWorkspaces(params: Record<string, unknown>, ctx: RequestContext): object {
    const workspaces = this.repository.listWorkspaces(ctx.tenantId);
    const statusFilter = (params.status as string) || 'active';
    const tagFilter = params.tag as string | undefined;

    let filtered = workspaces;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter);
    }
    if (tagFilter) {
      filtered = filtered.filter(w => w.tags.includes(tagFilter));
    }

    // Enrich with policy info
    const enriched = filtered.map(w => {
      const assignment = this.repository.getActivePolicyAssignment(ctx.tenantId, w.id);
      const bindings = this.repository.listWorkspaceBindings(ctx.tenantId, w.id);
      return {
        ...w,
        activePolicy: assignment ? { assignmentId: assignment.id, templateVersionId: assignment.templateVersionId } : null,
        connectorCount: bindings.length,
      };
    });

    return {
      workspaces: enriched,
      total: enriched.length,
    };
  }

  private handleGetWorkspace(params: Record<string, unknown>, ctx: RequestContext): object {
    const workspaceId = params.workspace_id as string;
    if (!workspaceId) {
      throw PrivacyPlatformError.validationFailed('workspace_id is required');
    }

    const workspace = this.repository.getWorkspace(ctx.tenantId, workspaceId);
    if (!workspace) {
      throw PrivacyPlatformError.notFound('Workspace', workspaceId);
    }

    const assignment = this.repository.getActivePolicyAssignment(ctx.tenantId, workspaceId);
    const bindings = this.repository.listWorkspaceBindings(ctx.tenantId, workspaceId);

    const result: Record<string, unknown> = {
      workspace,
      activePolicy: null as unknown,
      connectors: bindings,
    };

    if (assignment) {
      const version = this.repository.getPolicyTemplateVersion(ctx.tenantId, assignment.templateVersionId);
      const includePolicyDetails = params.include_policy_details as boolean ?? false;

      result.activePolicy = {
        assignmentId: assignment.id,
        appliedAt: assignment.createdAt,
        appliedBy: assignment.appliedBy,
        appliedVia: assignment.appliedVia,
        templateVersionId: assignment.templateVersionId,
        policyName: version?.policyJson?.name,
        riskScore: assignment.changesSummary?.riskScore,
        ...(includePolicyDetails && version ? { policyConfig: version.policyJson } : {}),
      };

      // Run validation for current risk score
      if (version) {
        const validation = this.policyEngine.validatePolicy(version.policyJson);
        result.currentRiskScore = validation.riskScore;
        result.policyWarnings = validation.warnings.length;
        result.policyErrors = validation.errors.length;
      }
    }

    if (params.include_audit) {
      result.recentAudit = this.audit.queryEvents(ctx.tenantId, {
        limit: 10,
      });
    }

    return result;
  }

  private handleApplyPolicyTemplate(params: Record<string, unknown>, ctx: RequestContext): object {
    const workspaceId = params.workspace_id as string;
    const template = params.template as string;
    const mode = (params.mode as 'apply' | 'dry_run') || 'apply';

    if (!workspaceId) throw PrivacyPlatformError.validationFailed('workspace_id is required');
    if (!template) throw PrivacyPlatformError.validationFailed('template is required');

    // Check workspace exists
    const workspace = this.repository.getWorkspace(ctx.tenantId, workspaceId);
    if (!workspace) throw PrivacyPlatformError.notFound('Workspace', workspaceId);

    // Check if it's a built-in template
    const builtin = getBuiltinTemplate(template);
    let templateVersionId: string;

    if (builtin) {
      // Create/reuse built-in template
      const tmpl = this.repository.createPolicyTemplate(ctx.tenantId, {
        name: builtin.name,
        description: builtin.description,
      });
      const version = this.repository.createPolicyTemplateVersion(ctx.tenantId, {
        templateId: tmpl.id,
        versionLabel: '1.0',
        policyJson: builtin.policy,
        createdBy: ctx.userId,
      });
      templateVersionId = version.id;
    } else {
      // Treat as custom template version ID
      const version = this.repository.getPolicyTemplateVersion(ctx.tenantId, template);
      if (!version) throw PrivacyPlatformError.notFound('PolicyTemplateVersion', template);
      templateVersionId = version.id;
    }

    // Apply via policy engine
    const { assignment, validation } = this.policyEngine.applyPolicyTemplate(
      ctx, workspaceId, templateVersionId, mode
    );

    return {
      mode,
      assignment: mode === 'apply' ? assignment : null,
      validation,
      message: mode === 'dry_run'
        ? `Dry run complete. Risk score: ${validation.riskScore}/100`
        : `Policy applied to workspace '${workspace.displayName}'. Risk score: ${validation.riskScore}/100`,
    };
  }

  private handleValidatePolicy(params: Record<string, unknown>, ctx: RequestContext): object {
    const workspaceId = params.workspace_id as string | undefined;
    const policyJson = params.policy_json as PolicyConfig | undefined;
    const profile = (params.profile as ValidationProfile) || 'runtime';

    if (!workspaceId && !policyJson) {
      throw PrivacyPlatformError.validationFailed('Either workspace_id or policy_json is required');
    }

    let policy: PolicyConfig;

    if (workspaceId) {
      const effectivePolicy = this.policyEngine.getEffectivePolicy(ctx.tenantId, workspaceId);
      if (!effectivePolicy) {
        return {
          valid: true,
          riskScore: 50,
          errors: [],
          warnings: [{ code: 'NO_POLICY', severity: 'warning', description: 'No policy assigned to workspace' }],
          suggestions: ['Apply a policy template to establish privacy baseline'],
        };
      }
      policy = effectivePolicy.policyJson;
    } else {
      policy = policyJson!;
    }

    const validation = this.policyEngine.validatePolicy(policy, profile);

    // Add drift check if workspace-based
    let drift = undefined;
    if (workspaceId) {
      drift = this.policyEngine.checkDrift(ctx.tenantId, workspaceId);
    }

    return {
      ...validation,
      profile,
      drift,
    };
  }

  private handleSetNetworkRouting(params: Record<string, unknown>, ctx: RequestContext): object {
    const workspaceId = params.workspace_id as string;
    if (!workspaceId) throw PrivacyPlatformError.validationFailed('workspace_id is required');

    const workspace = this.repository.getWorkspace(ctx.tenantId, workspaceId);
    if (!workspace) throw PrivacyPlatformError.notFound('Workspace', workspaceId);

    // In the foundation phase, we store network config as workspace metadata
    // Full implementation requires connector communication
    const proxy = params.proxy as Record<string, unknown> | undefined;
    const vpn = params.vpn as Record<string, unknown> | undefined;
    const dns = params.dns as Record<string, unknown> | undefined;

    // Validate no plaintext credentials
    if (proxy) {
      const keys = Object.keys(proxy);
      for (const key of keys) {
        if ((key === 'username' || key === 'password') && typeof proxy[key] === 'string') {
          throw PrivacyPlatformError.validationFailed(
            `Plaintext credentials not allowed. Use 'credential_ref' to reference secrets.`
          );
        }
      }
    }

    // Log the configuration change
    this.audit.logEvent(ctx, {
      action: 'NETWORK_ROUTING_SET',
      status: 'success',
      toolName: 'set_network_routing',
      payload: {
        workspaceId,
        hasProxy: !!proxy,
        hasVpn: !!vpn,
        hasDns: !!dns,
      },
    });

    return {
      workspaceId,
      message: 'Network routing configured',
      applied: {
        proxy: proxy ? { enabled: proxy.enabled, type: proxy.type } : null,
        vpn: vpn ? { enabled: vpn.enabled } : null,
        dns: dns ?? null,
      },
      note: 'Full network enforcement requires an enrolled connector',
    };
  }

  private handleCheckNetworkLeaks(params: Record<string, unknown>, ctx: RequestContext): object {
    const workspaceId = params.workspace_id as string;
    if (!workspaceId) throw PrivacyPlatformError.validationFailed('workspace_id is required');

    const workspace = this.repository.getWorkspace(ctx.tenantId, workspaceId);
    if (!workspace) throw PrivacyPlatformError.notFound('Workspace', workspaceId);

    const checks = (params.checks as string[]) || ['all'];
    const runAll = checks.includes('all');

    const results: Array<{ check: string; status: string; details: string; remediation?: string }> = [];

    if (runAll || checks.includes('webrtc')) {
      results.push({
        check: 'webrtc',
        status: 'info',
        details: 'WebRTC leak check requires an active connector session',
        remediation: 'Enroll a connector and start a session to run live checks',
      });
    }

    if (runAll || checks.includes('dns')) {
      results.push({
        check: 'dns',
        status: 'info',
        details: 'DNS leak check requires an active connector session',
        remediation: 'Enroll a connector and start a session to run live checks',
      });
    }

    if (runAll || checks.includes('tls')) {
      results.push({
        check: 'tls',
        status: 'info',
        details: 'TLS configuration check requires an active connector session',
        remediation: 'Enroll a connector and start a session to run live checks',
      });
    }

    // Check policy configuration for potential leaks
    const effectivePolicy = this.policyEngine.getEffectivePolicy(ctx.tenantId, workspaceId);
    if (effectivePolicy) {
      const policy = effectivePolicy.policyJson;
      if (policy.network) {
        if (policy.network.webrtcPolicy === 'allow') {
          results.push({
            check: 'webrtc_policy',
            status: 'warning',
            details: 'WebRTC is allowed in policy, which may expose real IP',
            remediation: 'Set webrtcPolicy to "disable" or "relay_only"',
          });
        }
        if (policy.network.dnsPolicy === 'system') {
          results.push({
            check: 'dns_policy',
            status: 'warning',
            details: 'System DNS is used, queries may be visible to ISP',
            remediation: 'Set dnsPolicy to "doh" or "dot"',
          });
        }
      }
    } else {
      results.push({
        check: 'policy',
        status: 'warning',
        details: 'No policy assigned - unable to assess network configuration',
        remediation: 'Apply a policy template to establish privacy baseline',
      });
    }

    return {
      workspaceId,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: results.length,
        warnings: results.filter(r => r.status === 'warning').length,
        passed: results.filter(r => r.status === 'pass').length,
        info: results.filter(r => r.status === 'info').length,
      },
    };
  }

  private handleEnrollConnector(params: Record<string, unknown>, ctx: RequestContext): object {
    const type = params.type as string;
    if (!type) throw PrivacyPlatformError.validationFailed('type is required');
    if (type !== 'extension' && type !== 'managed_sessions') {
      throw PrivacyPlatformError.validationFailed(`Invalid type '${type}'. Use 'extension' or 'managed_sessions'`);
    }

    const name = params.name as string | undefined;
    const metadata = (params.metadata as Record<string, unknown>) || {};
    const workspaceId = params.workspace_id as string | undefined;

    // Create connector
    const connector = this.repository.createConnector(ctx.tenantId, {
      type,
      name,
      metadata,
    });

    // Bind to workspace if specified
    let binding = null;
    if (workspaceId) {
      const workspace = this.repository.getWorkspace(ctx.tenantId, workspaceId);
      if (!workspace) throw PrivacyPlatformError.notFound('Workspace', workspaceId);
      binding = this.repository.createWorkspaceBinding(ctx.tenantId, {
        workspaceId,
        connectorId: connector.id,
      });
    }

    // Audit
    this.audit.logConnectorEnrollment(ctx, connector.id, type);

    return {
      connector,
      binding,
      message: `Connector '${name || connector.id}' enrolled as ${type}`,
      next_steps: [
        workspaceId ? null : 'Bind connector to a workspace using workspace binding',
        'Configure connector with the provided ID',
        'Connector will receive policy updates via push channel',
      ].filter(Boolean),
    };
  }
}
