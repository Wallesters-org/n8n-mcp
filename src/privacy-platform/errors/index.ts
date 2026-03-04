export class PrivacyPlatformError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PrivacyPlatformError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PrivacyPlatformError);
    }
  }

  static unauthorized(action: string, requiredScope: string): PrivacyPlatformError {
    return new PrivacyPlatformError(
      `Unauthorized: action '${action}' requires scope '${requiredScope}'`,
      'UNAUTHORIZED',
      { action, requiredScope }
    );
  }

  static notFound(entityType: string, id: string): PrivacyPlatformError {
    return new PrivacyPlatformError(
      `${entityType} not found: ${id}`,
      'NOT_FOUND',
      { entityType, id }
    );
  }

  static conflict(message: string, context?: Record<string, unknown>): PrivacyPlatformError {
    return new PrivacyPlatformError(message, 'CONFLICT', context);
  }

  static validationFailed(message: string, context?: Record<string, unknown>): PrivacyPlatformError {
    return new PrivacyPlatformError(message, 'VALIDATION_FAILED', context);
  }

  static idempotencyConflict(key: string): PrivacyPlatformError {
    return new PrivacyPlatformError(
      `Idempotency conflict: operation with key '${key}' already completed`,
      'IDEMPOTENCY_CONFLICT',
      { idempotencyKey: key }
    );
  }

  static tenantIsolationViolation(tenantId: string): PrivacyPlatformError {
    return new PrivacyPlatformError(
      `Tenant isolation violation: cannot access resources for tenant '${tenantId}'`,
      'TENANT_ISOLATION_VIOLATION',
      { tenantId }
    );
  }
}
