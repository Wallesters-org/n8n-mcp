import * as crypto from 'crypto';
import { AuditEvent, RequestContext } from '../types/index.js';
import { PrivacyRepository } from '../database/repository.js';

export interface AuditLogOptions {
  /** Tool being called */
  toolName?: string;
  /** Action description */
  action: string;
  /** Additional payload data */
  payload?: Record<string, unknown>;
  /** Operation status */
  status: 'success' | 'failure';
  /** Error code if status is failure */
  errorCode?: string;
  /** Parameters to hash (for audit trail without storing sensitive data) */
  paramsToHash?: Record<string, unknown>;
}

export class AuditService {
  constructor(private repository: PrivacyRepository) {}

  /**
   * Log an audit event. This is the primary method for all audit logging.
   * Events are append-only and cannot be modified or deleted.
   */
  logEvent(ctx: RequestContext, options: AuditLogOptions): AuditEvent {
    const paramsHash = options.paramsToHash
      ? crypto.createHash('sha256').update(JSON.stringify(options.paramsToHash)).digest('hex')
      : undefined;

    return this.repository.createAuditEvent({
      tenantId: ctx.tenantId,
      actorType: 'user',
      actorId: ctx.userId,
      actorRole: ctx.role,
      toolName: options.toolName,
      action: options.action,
      correlationId: ctx.correlationId,
      idempotencyKey: ctx.idempotencyKey,
      paramsHash,
      status: options.status,
      errorCode: options.errorCode,
      payload: options.payload ?? {},
    });
  }

  /**
   * Log a tool call event (convenience wrapper)
   */
  logToolCall(
    ctx: RequestContext,
    toolName: string,
    params: Record<string, unknown>,
    result: { status: 'success' | 'failure'; errorCode?: string; data?: Record<string, unknown> }
  ): AuditEvent {
    return this.logEvent(ctx, {
      toolName,
      action: 'TOOL_CALL',
      paramsToHash: params,
      status: result.status,
      errorCode: result.errorCode,
      payload: {
        tool: toolName,
        ...(result.data ?? {}),
      },
    });
  }

  /**
   * Log a policy change event
   */
  logPolicyChange(
    ctx: RequestContext,
    workspaceId: string,
    templateVersionId: string,
    mode: 'apply' | 'dry_run'
  ): AuditEvent {
    return this.logEvent(ctx, {
      action: 'POLICY_APPLIED',
      status: 'success',
      payload: {
        workspaceId,
        templateVersionId,
        mode,
      },
    });
  }

  /**
   * Log a connector enrollment event
   */
  logConnectorEnrollment(
    ctx: RequestContext,
    connectorId: string,
    connectorType: string
  ): AuditEvent {
    return this.logEvent(ctx, {
      action: 'CONNECTOR_ENROLLED',
      status: 'success',
      payload: {
        connectorId,
        connectorType,
      },
    });
  }

  /**
   * Query audit events with filtering
   */
  queryEvents(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
      toolName?: string;
      correlationId?: string;
    }
  ): AuditEvent[] {
    return this.repository.listAuditEvents(tenantId, options);
  }

  /**
   * Count audit events for a tenant (for metrics/monitoring)
   */
  countEvents(tenantId: string, since?: string): number {
    const events = this.repository.listAuditEvents(tenantId, {
      limit: 100000,
    });
    if (!since) return events.length;
    return events.filter(e => e.eventTime >= since).length;
  }
}
