import { Role, Scope, ROLE_SCOPES, RequestContext } from '../types/index.js';
import { PrivacyPlatformError } from '../errors/index.js';

/**
 * Check if a role has the required scope
 */
export function hasScope(role: Role, scope: Scope): boolean {
  return ROLE_SCOPES[role].includes(scope);
}

/**
 * Check if a role has ALL of the required scopes
 */
export function hasAllScopes(role: Role, scopes: Scope[]): boolean {
  const roleScopes = ROLE_SCOPES[role];
  return scopes.every(s => roleScopes.includes(s));
}

/**
 * Check if a role has ANY of the required scopes
 */
export function hasAnyScope(role: Role, scopes: Scope[]): boolean {
  const roleScopes = ROLE_SCOPES[role];
  return scopes.some(s => roleScopes.includes(s));
}

/**
 * Enforce that the request context has the required scope.
 * Throws PrivacyPlatformError.unauthorized if not.
 */
export function enforceScope(ctx: RequestContext, scope: Scope, action: string): void {
  if (!hasScope(ctx.role, scope)) {
    throw PrivacyPlatformError.unauthorized(action, scope);
  }
}

/**
 * Enforce that the request context has ALL required scopes.
 */
export function enforceAllScopes(ctx: RequestContext, scopes: Scope[], action: string): void {
  for (const scope of scopes) {
    if (!hasScope(ctx.role, scope)) {
      throw PrivacyPlatformError.unauthorized(action, scope);
    }
  }
}

/**
 * Enforce tenant isolation - request context tenant must match resource tenant
 */
export function enforceTenantIsolation(ctx: RequestContext, resourceTenantId: string): void {
  if (ctx.tenantId !== resourceTenantId) {
    throw PrivacyPlatformError.tenantIsolationViolation(resourceTenantId);
  }
}

/**
 * Build a RequestContext from auth token claims
 */
export function buildRequestContext(claims: {
  tenantId: string;
  userId: string;
  role: Role;
  correlationId?: string;
  idempotencyKey?: string;
}): RequestContext {
  return {
    tenantId: claims.tenantId,
    userId: claims.userId,
    role: claims.role,
    scopes: ROLE_SCOPES[claims.role],
    correlationId: claims.correlationId,
    idempotencyKey: claims.idempotencyKey,
  };
}

/**
 * Tool-to-scope mapping for MCP tools.
 * Each tool requires specific scopes to execute.
 */
export const TOOL_SCOPES: Record<string, Scope[]> = {
  create_workspace: ['workspace:write'],
  list_workspaces: ['workspace:read'],
  get_workspace: ['workspace:read'],
  update_workspace: ['workspace:write'],
  archive_workspace: ['workspace:delete'],
  create_policy_template: ['policy:write'],
  list_policy_templates: ['policy:read'],
  apply_policy_template: ['policy:write'],
  validate_policy: ['policy:validate'],
  auto_remediate_risks: ['policy:write'],
  set_network_routing: ['network:write'],
  set_dns_policy: ['network:write'],
  check_network_leaks: ['network:check'],
  enroll_connector: ['connector:write'],
  bind_workspace_to_connector: ['connector:write'],
  analyze_privacy_posture: ['workspace:read'],
  suggest_configuration: ['workspace:read'],
  auto_fix_detection: ['workspace:write'],
  health_check: ['system:health'],
  tools_documentation: ['system:docs'],
};

/**
 * Enforce that the request context can call the specified tool.
 */
export function enforceToolAccess(ctx: RequestContext, toolName: string): void {
  const requiredScopes = TOOL_SCOPES[toolName];
  if (!requiredScopes) {
    throw new PrivacyPlatformError(
      `Unknown tool: ${toolName}`,
      'UNKNOWN_TOOL',
      { toolName }
    );
  }
  enforceAllScopes(ctx, requiredScopes, `tool:${toolName}`);
}
