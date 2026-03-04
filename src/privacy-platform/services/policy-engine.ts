import {
  PolicyConfig, PolicyRule, PolicyValidationResult, PolicyValidationError,
  PolicyValidationWarning, ValidationProfile, RequestContext, Workspace,
  PolicyTemplateVersion
} from '../types/index.js';
import { PrivacyRepository } from '../database/repository.js';
import { AuditService } from './audit.js';
import { enforceScope } from './rbac.js';

/**
 * Policy engine responsible for validation, risk scoring, and enforcement.
 * Stateless service - all state lives in the database.
 */
export class PolicyEngine {
  constructor(
    private repository: PrivacyRepository,
    private audit: AuditService
  ) {}

  /**
   * Validate a policy configuration and compute risk score
   */
  validatePolicy(
    policy: PolicyConfig,
    profile: ValidationProfile = 'runtime'
  ): PolicyValidationResult {
    const errors: PolicyValidationError[] = [];
    const warnings: PolicyValidationWarning[] = [];
    const suggestions: string[] = [];

    // 1. Structure validation
    this.validateStructure(policy, errors);

    // 2. Rule validation
    this.validateRules(policy.rules, errors, warnings);

    // 3. Network policy validation
    if (policy.network) {
      this.validateNetworkPolicy(policy.network, errors, warnings, suggestions);
    }

    // 4. Privacy policy validation
    if (policy.privacy) {
      this.validatePrivacyPolicy(policy.privacy, errors, warnings, suggestions);
    }

    // 5. Cross-concern consistency checks
    this.validateConsistency(policy, warnings, suggestions);

    // 6. Profile-specific checks
    if (profile === 'strict') {
      this.applyStrictChecks(policy, errors, warnings);
    }

    // Compute risk score
    const riskScore = this.computeRiskScore(policy, errors, warnings);

    return {
      valid: errors.length === 0,
      riskScore,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Apply a policy template to a workspace
   */
  applyPolicyTemplate(
    ctx: RequestContext,
    workspaceId: string,
    templateVersionId: string,
    mode: 'apply' | 'dry_run' = 'apply'
  ): { assignment: import('../types/index.js').PolicyAssignment; validation: PolicyValidationResult } {
    enforceScope(ctx, 'policy:write', 'apply_policy_template');

    // Get the policy version
    const version = this.repository.getPolicyTemplateVersion(ctx.tenantId, templateVersionId);
    if (!version) {
      return {
        assignment: null as any,
        validation: {
          valid: false,
          riskScore: 100,
          errors: [{
            code: 'TEMPLATE_VERSION_NOT_FOUND',
            severity: 'critical',
            description: `Policy template version '${templateVersionId}' not found`,
            recommendedAction: 'Verify the template version ID exists',
          }],
          warnings: [],
          suggestions: [],
        },
      };
    }

    // Validate the policy
    const validation = this.validatePolicy(version.policyJson);

    if (mode === 'dry_run') {
      return { assignment: null as any, validation };
    }

    if (!validation.valid) {
      return { assignment: null as any, validation };
    }

    // Create the assignment
    const assignment = this.repository.createPolicyAssignment(ctx.tenantId, {
      workspaceId,
      templateVersionId,
      appliedBy: ctx.userId,
      appliedVia: 'mcp',
      correlationId: ctx.correlationId,
      idempotencyKey: ctx.idempotencyKey,
      mode,
      changesSummary: { riskScore: validation.riskScore },
    });

    // Log the audit event
    this.audit.logPolicyChange(ctx, workspaceId, templateVersionId, mode);

    return { assignment, validation };
  }

  /**
   * Get the current effective policy for a workspace
   */
  getEffectivePolicy(tenantId: string, workspaceId: string): PolicyTemplateVersion | null {
    const assignment = this.repository.getActivePolicyAssignment(tenantId, workspaceId);
    if (!assignment) return null;
    return this.repository.getPolicyTemplateVersion(tenantId, assignment.templateVersionId);
  }

  /**
   * Check for policy drift (current vs expected)
   */
  checkDrift(tenantId: string, workspaceId: string): {
    hasDrift: boolean;
    currentPolicyHash?: string;
    expectedPolicyHash?: string;
    details?: string;
  } {
    const effectivePolicy = this.getEffectivePolicy(tenantId, workspaceId);
    if (!effectivePolicy) {
      return { hasDrift: false, details: 'No policy assigned' };
    }
    // In the current implementation, drift detection compares the stored hash
    // Future: compare with actual runtime state from connectors
    return {
      hasDrift: false,
      currentPolicyHash: effectivePolicy.policyHash,
      expectedPolicyHash: effectivePolicy.policyHash,
    };
  }

  // === Private validation methods ===

  private validateStructure(policy: PolicyConfig, errors: PolicyValidationError[]): void {
    if (!policy.version) {
      errors.push({
        code: 'MISSING_VERSION',
        severity: 'critical',
        description: 'Policy must have a version field',
        recommendedAction: 'Add a version field (e.g., "1.0")',
      });
    }
    if (!policy.name) {
      errors.push({
        code: 'MISSING_NAME',
        severity: 'critical',
        description: 'Policy must have a name',
        recommendedAction: 'Add a descriptive name for the policy',
      });
    }
    if (!policy.rules || !Array.isArray(policy.rules)) {
      errors.push({
        code: 'MISSING_RULES',
        severity: 'critical',
        description: 'Policy must have a rules array',
        recommendedAction: 'Add at least one policy rule',
      });
    }
  }

  private validateRules(
    rules: PolicyRule[],
    errors: PolicyValidationError[],
    warnings: PolicyValidationWarning[]
  ): void {
    if (!rules) return;

    const ruleIds = new Set<string>();
    for (const rule of rules) {
      if (!rule.id) {
        errors.push({
          code: 'RULE_MISSING_ID',
          severity: 'error',
          description: 'Each rule must have a unique id',
          recommendedAction: 'Add a unique id to the rule',
        });
      }
      if (ruleIds.has(rule.id)) {
        errors.push({
          code: 'DUPLICATE_RULE_ID',
          severity: 'error',
          description: `Duplicate rule id: '${rule.id}'`,
          recommendedAction: 'Ensure all rule IDs are unique',
          ruleId: rule.id,
        });
      }
      ruleIds.add(rule.id);

      const validCategories = ['network', 'browser', 'storage', 'privacy', 'access'];
      if (!validCategories.includes(rule.category)) {
        errors.push({
          code: 'INVALID_RULE_CATEGORY',
          severity: 'error',
          description: `Invalid category '${rule.category}' for rule '${rule.id}'`,
          recommendedAction: `Use one of: ${validCategories.join(', ')}`,
          ruleId: rule.id,
        });
      }

      const validActions = ['enforce', 'warn', 'log', 'block'];
      if (!validActions.includes(rule.action)) {
        errors.push({
          code: 'INVALID_RULE_ACTION',
          severity: 'error',
          description: `Invalid action '${rule.action}' for rule '${rule.id}'`,
          recommendedAction: `Use one of: ${validActions.join(', ')}`,
          ruleId: rule.id,
        });
      }
    }

    // Warn if no enforcement rules exist
    const enforceRules = rules.filter(r => r.action === 'enforce' || r.action === 'block');
    if (enforceRules.length === 0) {
      warnings.push({
        code: 'NO_ENFORCEMENT_RULES',
        severity: 'warning',
        description: 'Policy has no enforcement or blocking rules',
        recommendedAction: 'Consider adding enforcement rules for critical privacy settings',
      });
    }
  }

  private validateNetworkPolicy(
    network: import('../types/index.js').NetworkPolicyConfig,
    errors: PolicyValidationError[],
    warnings: PolicyValidationWarning[],
    suggestions: string[]
  ): void {
    if (network.proxyRequired && !network.proxyType) {
      errors.push({
        code: 'PROXY_TYPE_MISSING',
        severity: 'error',
        description: 'Proxy is required but no proxy type specified',
        recommendedAction: 'Set proxyType to socks5, http, or residential',
      });
    }

    if (network.dnsPolicy === 'system') {
      warnings.push({
        code: 'SYSTEM_DNS_RISK',
        severity: 'warning',
        description: 'Using system DNS may leak browsing data to ISP',
        recommendedAction: 'Consider using DoH or DoT for encrypted DNS',
      });
    }

    if (network.webrtcPolicy === 'allow') {
      warnings.push({
        code: 'WEBRTC_LEAK_RISK',
        severity: 'warning',
        description: 'WebRTC is allowed, which may expose real IP',
        recommendedAction: 'Consider disabling WebRTC or using relay_only mode',
      });
    }

    if (!network.vpnRequired && network.proxyRequired) {
      suggestions.push('Consider enabling VPN for additional network privacy beyond proxy');
    }
  }

  private validatePrivacyPolicy(
    privacy: import('../types/index.js').PrivacyPolicyConfig,
    errors: PolicyValidationError[],
    warnings: PolicyValidationWarning[],
    suggestions: string[]
  ): void {
    if (!privacy.cookieIsolation) {
      warnings.push({
        code: 'COOKIE_ISOLATION_DISABLED',
        severity: 'warning',
        description: 'Cookie isolation is disabled, allowing cross-site tracking',
        recommendedAction: 'Enable cookie isolation for better privacy',
      });
    }

    if (!privacy.storagePartitioning) {
      warnings.push({
        code: 'STORAGE_PARTITIONING_DISABLED',
        severity: 'warning',
        description: 'Storage partitioning is disabled',
        recommendedAction: 'Enable storage partitioning to prevent cross-site data leaks',
      });
    }

    if (privacy.canvasProtection === 'allow') {
      suggestions.push('Canvas fingerprinting is allowed. Consider noise or block mode for privacy.');
    }

    if (privacy.webglProtection === 'allow') {
      suggestions.push('WebGL fingerprinting is allowed. Consider noise or block mode.');
    }
  }

  private validateConsistency(
    policy: PolicyConfig,
    warnings: PolicyValidationWarning[],
    suggestions: string[]
  ): void {
    // Check if privacy rules conflict with network settings
    if (policy.privacy && policy.network) {
      if (policy.privacy.canvasProtection === 'block' && !policy.network.proxyRequired) {
        warnings.push({
          code: 'INCONSISTENT_PROTECTION',
          severity: 'info',
          description: 'Canvas is blocked but no proxy is configured - partial protection',
          recommendedAction: 'Consider adding proxy for consistent privacy posture',
        });
      }
    }

    // Check that enforcement rules have corresponding policy configs
    if (policy.rules) {
      const networkRules = policy.rules.filter(r => r.category === 'network' && r.action === 'enforce');
      if (networkRules.length > 0 && !policy.network) {
        warnings.push({
          code: 'NETWORK_RULES_WITHOUT_CONFIG',
          severity: 'warning',
          description: 'Network enforcement rules exist but no network policy is configured',
          recommendedAction: 'Add a network policy section or remove network rules',
        });
      }
    }
  }

  private applyStrictChecks(
    policy: PolicyConfig,
    errors: PolicyValidationError[],
    warnings: PolicyValidationWarning[]
  ): void {
    // Strict mode requires both network and privacy sections
    if (!policy.network) {
      errors.push({
        code: 'STRICT_MISSING_NETWORK',
        severity: 'error',
        description: 'Strict mode requires a network policy section',
        recommendedAction: 'Add network policy configuration',
      });
    }
    if (!policy.privacy) {
      errors.push({
        code: 'STRICT_MISSING_PRIVACY',
        severity: 'error',
        description: 'Strict mode requires a privacy policy section',
        recommendedAction: 'Add privacy policy configuration',
      });
    }
    // Strict mode requires proxy
    if (policy.network && !policy.network.proxyRequired) {
      errors.push({
        code: 'STRICT_PROXY_REQUIRED',
        severity: 'error',
        description: 'Strict mode requires proxy to be enabled',
        recommendedAction: 'Set proxyRequired to true',
      });
    }
    // Strict mode requires encrypted DNS
    if (policy.network && policy.network.dnsPolicy === 'system') {
      errors.push({
        code: 'STRICT_DNS_REQUIRED',
        severity: 'error',
        description: 'Strict mode requires encrypted DNS (DoH or DoT)',
        recommendedAction: 'Set dnsPolicy to doh or dot',
      });
    }
  }

  /**
   * Compute risk score 0-100 based on policy configuration.
   * Lower is better (fewer risks).
   */
  private computeRiskScore(
    policy: PolicyConfig,
    errors: PolicyValidationError[],
    warnings: PolicyValidationWarning[]
  ): number {
    let score = 0;

    // Errors add significant risk
    score += errors.filter(e => e.severity === 'critical').length * 25;
    score += errors.filter(e => e.severity === 'error').length * 15;

    // Warnings add moderate risk
    score += warnings.filter(w => w.severity === 'warning').length * 5;
    score += warnings.filter(w => w.severity === 'info').length * 2;

    // Missing sections add risk
    if (!policy.network) score += 15;
    if (!policy.privacy) score += 15;

    // Weak settings add risk
    if (policy.network) {
      if (!policy.network.proxyRequired) score += 10;
      if (policy.network.dnsPolicy === 'system') score += 8;
      if (policy.network.webrtcPolicy === 'allow') score += 10;
      if (!policy.network.vpnRequired) score += 5;
    }

    if (policy.privacy) {
      if (!policy.privacy.cookieIsolation) score += 8;
      if (!policy.privacy.storagePartitioning) score += 5;
      if (policy.privacy.canvasProtection === 'allow') score += 8;
      if (policy.privacy.webglProtection === 'allow') score += 5;
      if (policy.privacy.audioProtection === 'allow') score += 3;
      if (policy.privacy.fontEnumeration === 'allow') score += 3;
    }

    return Math.min(100, score);
  }
}
