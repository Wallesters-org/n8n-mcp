/**
 * Privacy & Isolation Platform
 *
 * AI-powered privacy policy management with MCP integration.
 * Provides workspace management, policy enforcement, and connector
 * enrollment for browser privacy isolation.
 */

// Types
export * from './types/index.js';

// Errors
export { PrivacyPlatformError } from './errors/index.js';

// Database
export { PrivacyRepository } from './database/repository.js';

// Services
export { EnvelopeEncryption } from './services/encryption.js';
export { AuditService } from './services/audit.js';
export { PolicyEngine } from './services/policy-engine.js';
export {
  hasScope,
  hasAllScopes,
  hasAnyScope,
  enforceScope,
  enforceToolAccess,
  buildRequestContext,
  TOOL_SCOPES,
} from './services/rbac.js';

// Policy templates
export { BUILTIN_POLICY_TEMPLATES, getBuiltinTemplate, getBuiltinTemplateKeys } from './policies/templates.js';

// MCP
export { PrivacyMCPServer } from './mcp/server.js';
export { PrivacyToolHandlers } from './mcp/handlers.js';
export { privacyPlatformTools } from './mcp/tools.js';
