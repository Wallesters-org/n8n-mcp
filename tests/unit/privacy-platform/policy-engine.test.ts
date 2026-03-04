import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PolicyEngine } from '../../../src/privacy-platform/services/policy-engine.js';
import {
  BUILTIN_POLICY_TEMPLATES,
  getBuiltinTemplate,
  getBuiltinTemplateKeys,
} from '../../../src/privacy-platform/policies/templates.js';
import type {
  PolicyConfig,
  PolicyRule,
  PolicyValidationResult,
  PolicyAssignment,
  PolicyTemplateVersion,
  RequestContext,
} from '../../../src/privacy-platform/types/index.js';
import type { PrivacyRepository } from '../../../src/privacy-platform/database/repository.js';
import type { AuditService } from '../../../src/privacy-platform/services/audit.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRepository(): {
  [K in keyof PrivacyRepository]: ReturnType<typeof vi.fn>;
} {
  return {
    initSchema: vi.fn(),
    createTenant: vi.fn(),
    getTenant: vi.fn(),
    createUser: vi.fn(),
    getUser: vi.fn(),
    getUserByEmail: vi.fn(),
    createMembership: vi.fn(),
    getMembership: vi.fn(),
    listTenantMembers: vi.fn(),
    createWorkspace: vi.fn(),
    getWorkspace: vi.fn(),
    listWorkspaces: vi.fn(),
    updateWorkspace: vi.fn(),
    archiveWorkspace: vi.fn(),
    createPolicyTemplate: vi.fn(),
    getPolicyTemplate: vi.fn(),
    listPolicyTemplates: vi.fn(),
    createPolicyTemplateVersion: vi.fn(),
    getPolicyTemplateVersion: vi.fn(),
    getLatestPolicyVersion: vi.fn(),
    listPolicyVersions: vi.fn(),
    createPolicyAssignment: vi.fn(),
    getActivePolicyAssignment: vi.fn(),
    getPolicyAssignment: vi.fn(),
    listPolicyAssignments: vi.fn(),
    createConnector: vi.fn(),
    getConnector: vi.fn(),
    listConnectors: vi.fn(),
    updateConnectorStatus: vi.fn(),
    createWorkspaceBinding: vi.fn(),
    getWorkspaceBinding: vi.fn(),
    listWorkspaceBindings: vi.fn(),
    createAuditEvent: vi.fn(),
    listAuditEvents: vi.fn(),
  } as any;
}

function createMockAudit(): {
  [K in keyof AuditService]: ReturnType<typeof vi.fn>;
} {
  return {
    logEvent: vi.fn(),
    logToolCall: vi.fn(),
    logPolicyChange: vi.fn(),
    logConnectorEnrollment: vi.fn(),
    queryEvents: vi.fn(),
    countEvents: vi.fn(),
  } as any;
}

function makeValidPolicy(overrides?: Partial<PolicyConfig>): PolicyConfig {
  return {
    version: '1.0',
    name: 'Test Policy',
    description: 'A test policy',
    rules: [
      {
        id: 'rule-1',
        category: 'network',
        action: 'enforce',
        condition: 'proxy.active === true',
        description: 'Require proxy',
      },
    ],
    network: {
      proxyRequired: true,
      proxyType: 'socks5',
      dnsPolicy: 'doh',
      dnsProvider: 'cloudflare',
      webrtcPolicy: 'disable',
      vpnRequired: true,
    },
    privacy: {
      cookieIsolation: true,
      storagePartitioning: true,
      canvasProtection: 'noise',
      webglProtection: 'noise',
      audioProtection: 'noise',
      fontEnumeration: 'restrict',
      screenResolution: 'letterbox',
    },
    ...overrides,
  };
}

function makeAdminContext(overrides?: Partial<RequestContext>): RequestContext {
  return {
    tenantId: 'tenant-1',
    userId: 'user-1',
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PolicyEngine', () => {
  let engine: PolicyEngine;
  let mockRepository: ReturnType<typeof createMockRepository>;
  let mockAudit: ReturnType<typeof createMockAudit>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockAudit = createMockAudit();
    engine = new PolicyEngine(
      mockRepository as unknown as PrivacyRepository,
      mockAudit as unknown as AuditService,
    );
  });

  // =========================================================================
  // Policy Validation
  // =========================================================================

  describe('validatePolicy', () => {
    // 1. Valid policy passes validation
    it('should pass validation for a valid policy', () => {
      const policy = makeValidPolicy();
      const result = engine.validatePolicy(policy);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    // 2. Missing version field produces critical error
    it('should produce critical error when version is missing', () => {
      const policy = makeValidPolicy({ version: '' });
      const result = engine.validatePolicy(policy);

      expect(result.valid).toBe(false);
      const versionError = result.errors.find(e => e.code === 'MISSING_VERSION');
      expect(versionError).toBeDefined();
      expect(versionError!.severity).toBe('critical');
    });

    // 3. Missing name field produces critical error
    it('should produce critical error when name is missing', () => {
      const policy = makeValidPolicy({ name: '' });
      const result = engine.validatePolicy(policy);

      expect(result.valid).toBe(false);
      const nameError = result.errors.find(e => e.code === 'MISSING_NAME');
      expect(nameError).toBeDefined();
      expect(nameError!.severity).toBe('critical');
    });

    // 4. Missing rules produces critical error
    it('should produce critical error when rules is missing', () => {
      const policy = makeValidPolicy({ rules: undefined as any });
      const result = engine.validatePolicy(policy);

      expect(result.valid).toBe(false);
      const rulesError = result.errors.find(e => e.code === 'MISSING_RULES');
      expect(rulesError).toBeDefined();
      expect(rulesError!.severity).toBe('critical');
    });

    // 5. Duplicate rule IDs produce error
    it('should produce error for duplicate rule IDs', () => {
      const policy = makeValidPolicy({
        rules: [
          { id: 'dup-1', category: 'network', action: 'enforce', condition: 'a' },
          { id: 'dup-1', category: 'browser', action: 'warn', condition: 'b' },
        ],
      });
      const result = engine.validatePolicy(policy);

      expect(result.valid).toBe(false);
      const dupError = result.errors.find(e => e.code === 'DUPLICATE_RULE_ID');
      expect(dupError).toBeDefined();
      expect(dupError!.severity).toBe('error');
      expect(dupError!.ruleId).toBe('dup-1');
    });

    // 6. Invalid rule category produces error
    it('should produce error for invalid rule category', () => {
      const policy = makeValidPolicy({
        rules: [
          { id: 'bad-cat', category: 'unknown' as any, action: 'enforce', condition: 'x' },
        ],
      });
      const result = engine.validatePolicy(policy);

      expect(result.valid).toBe(false);
      const catError = result.errors.find(e => e.code === 'INVALID_RULE_CATEGORY');
      expect(catError).toBeDefined();
      expect(catError!.severity).toBe('error');
      expect(catError!.ruleId).toBe('bad-cat');
    });

    // 7. Invalid rule action produces error
    it('should produce error for invalid rule action', () => {
      const policy = makeValidPolicy({
        rules: [
          { id: 'bad-action', category: 'network', action: 'invalid' as any, condition: 'x' },
        ],
      });
      const result = engine.validatePolicy(policy);

      expect(result.valid).toBe(false);
      const actionError = result.errors.find(e => e.code === 'INVALID_RULE_ACTION');
      expect(actionError).toBeDefined();
      expect(actionError!.severity).toBe('error');
      expect(actionError!.ruleId).toBe('bad-action');
    });

    // 8. No enforcement rules produces warning
    it('should produce warning when no enforcement or blocking rules exist', () => {
      const policy = makeValidPolicy({
        rules: [
          { id: 'log-only', category: 'network', action: 'log', condition: 'x' },
          { id: 'warn-only', category: 'browser', action: 'warn', condition: 'y' },
        ],
      });
      const result = engine.validatePolicy(policy);

      const warnNoEnforce = result.warnings.find(w => w.code === 'NO_ENFORCEMENT_RULES');
      expect(warnNoEnforce).toBeDefined();
      expect(warnNoEnforce!.severity).toBe('warning');
    });

    // 9. Network validation - proxy required without type
    it('should produce error when proxy is required but no type specified', () => {
      const policy = makeValidPolicy({
        network: {
          proxyRequired: true,
          dnsPolicy: 'doh',
          webrtcPolicy: 'disable',
          vpnRequired: false,
        },
      });
      const result = engine.validatePolicy(policy);

      expect(result.valid).toBe(false);
      const proxyError = result.errors.find(e => e.code === 'PROXY_TYPE_MISSING');
      expect(proxyError).toBeDefined();
      expect(proxyError!.severity).toBe('error');
    });

    // 10. Network validation - system DNS warning
    it('should produce warning when DNS policy is system', () => {
      const policy = makeValidPolicy({
        network: {
          proxyRequired: false,
          dnsPolicy: 'system',
          webrtcPolicy: 'disable',
          vpnRequired: false,
        },
      });
      const result = engine.validatePolicy(policy);

      const dnsWarning = result.warnings.find(w => w.code === 'SYSTEM_DNS_RISK');
      expect(dnsWarning).toBeDefined();
      expect(dnsWarning!.severity).toBe('warning');
    });

    // 11. Network validation - WebRTC allow warning
    it('should produce warning when WebRTC policy is allow', () => {
      const policy = makeValidPolicy({
        network: {
          proxyRequired: false,
          dnsPolicy: 'doh',
          webrtcPolicy: 'allow',
          vpnRequired: false,
        },
      });
      const result = engine.validatePolicy(policy);

      const webrtcWarning = result.warnings.find(w => w.code === 'WEBRTC_LEAK_RISK');
      expect(webrtcWarning).toBeDefined();
      expect(webrtcWarning!.severity).toBe('warning');
    });

    // 12. Privacy validation - cookie isolation disabled warning
    it('should produce warning when cookie isolation is disabled', () => {
      const policy = makeValidPolicy({
        privacy: {
          cookieIsolation: false,
          storagePartitioning: true,
          canvasProtection: 'noise',
          webglProtection: 'noise',
          audioProtection: 'noise',
          fontEnumeration: 'restrict',
          screenResolution: 'letterbox',
        },
      });
      const result = engine.validatePolicy(policy);

      const cookieWarning = result.warnings.find(w => w.code === 'COOKIE_ISOLATION_DISABLED');
      expect(cookieWarning).toBeDefined();
      expect(cookieWarning!.severity).toBe('warning');
    });

    // 13. Consistency checks - canvas blocked without proxy
    it('should produce info warning when canvas is blocked but no proxy configured', () => {
      const policy = makeValidPolicy({
        network: {
          proxyRequired: false,
          dnsPolicy: 'doh',
          webrtcPolicy: 'disable',
          vpnRequired: false,
        },
        privacy: {
          cookieIsolation: true,
          storagePartitioning: true,
          canvasProtection: 'block',
          webglProtection: 'noise',
          audioProtection: 'noise',
          fontEnumeration: 'restrict',
          screenResolution: 'letterbox',
        },
      });
      const result = engine.validatePolicy(policy);

      const inconsistentWarning = result.warnings.find(w => w.code === 'INCONSISTENT_PROTECTION');
      expect(inconsistentWarning).toBeDefined();
      expect(inconsistentWarning!.severity).toBe('info');
    });

    // 14. Strict profile requires network and privacy sections
    it('should produce errors in strict mode when network or privacy sections are missing', () => {
      const policy: PolicyConfig = {
        version: '1.0',
        name: 'Minimal Policy',
        rules: [
          { id: 'r1', category: 'network', action: 'enforce', condition: 'x' },
        ],
      };
      const result = engine.validatePolicy(policy, 'strict');

      expect(result.valid).toBe(false);
      const networkMissing = result.errors.find(e => e.code === 'STRICT_MISSING_NETWORK');
      const privacyMissing = result.errors.find(e => e.code === 'STRICT_MISSING_PRIVACY');
      expect(networkMissing).toBeDefined();
      expect(privacyMissing).toBeDefined();
    });

    it('should produce error in strict mode when proxy is not required', () => {
      const policy = makeValidPolicy({
        network: {
          proxyRequired: false,
          dnsPolicy: 'doh',
          webrtcPolicy: 'disable',
          vpnRequired: false,
        },
      });
      const result = engine.validatePolicy(policy, 'strict');

      expect(result.valid).toBe(false);
      const proxyError = result.errors.find(e => e.code === 'STRICT_PROXY_REQUIRED');
      expect(proxyError).toBeDefined();
    });

    it('should produce error in strict mode when DNS is system', () => {
      const policy = makeValidPolicy({
        network: {
          proxyRequired: true,
          proxyType: 'socks5',
          dnsPolicy: 'system',
          webrtcPolicy: 'disable',
          vpnRequired: true,
        },
      });
      const result = engine.validatePolicy(policy, 'strict');

      expect(result.valid).toBe(false);
      const dnsError = result.errors.find(e => e.code === 'STRICT_DNS_REQUIRED');
      expect(dnsError).toBeDefined();
    });

    // 15. Risk score computation
    it('should compute a low risk score for the hardened policy', () => {
      const hardened = BUILTIN_POLICY_TEMPLATES['hardened'].policy;
      const result = engine.validatePolicy(hardened);

      expect(result.valid).toBe(true);
      expect(result.riskScore).toBeLessThanOrEqual(10);
    });

    it('should compute a high risk score for the dev policy', () => {
      const dev = BUILTIN_POLICY_TEMPLATES['dev'].policy;
      const result = engine.validatePolicy(dev);

      // Dev policy has system DNS, WebRTC allow, no proxy, no VPN,
      // cookie isolation off, storage partitioning off, canvas/webgl/audio allow,
      // font enumeration allow, plus warning-level penalties
      expect(result.riskScore).toBeGreaterThanOrEqual(40);
    });

    it('should return risk score between 0 and 100', () => {
      // A maximally bad policy that should accumulate many risk points
      const badPolicy: PolicyConfig = {
        version: '',
        name: '',
        rules: undefined as any,
      };
      const result = engine.validatePolicy(badPolicy);

      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('should not produce strict errors in runtime profile', () => {
      const policy: PolicyConfig = {
        version: '1.0',
        name: 'No sections',
        rules: [
          { id: 'r1', category: 'browser', action: 'warn', condition: 'x' },
        ],
      };
      const result = engine.validatePolicy(policy, 'runtime');

      const strictErrors = result.errors.filter(
        e => e.code.startsWith('STRICT_'),
      );
      expect(strictErrors).toHaveLength(0);
    });

    it('should produce warning when network enforcement rules exist without network config', () => {
      const policy: PolicyConfig = {
        version: '1.0',
        name: 'Rules without config',
        rules: [
          { id: 'net-rule', category: 'network', action: 'enforce', condition: 'x' },
        ],
      };
      const result = engine.validatePolicy(policy);

      const warning = result.warnings.find(w => w.code === 'NETWORK_RULES_WITHOUT_CONFIG');
      expect(warning).toBeDefined();
      expect(warning!.severity).toBe('warning');
    });

    it('should include suggestions for canvas allow and webgl allow', () => {
      const policy = makeValidPolicy({
        privacy: {
          cookieIsolation: true,
          storagePartitioning: true,
          canvasProtection: 'allow',
          webglProtection: 'allow',
          audioProtection: 'noise',
          fontEnumeration: 'restrict',
          screenResolution: 'letterbox',
        },
      });
      const result = engine.validatePolicy(policy);

      expect(result.suggestions.some(s => s.toLowerCase().includes('canvas'))).toBe(true);
      expect(result.suggestions.some(s => s.toLowerCase().includes('webgl'))).toBe(true);
    });

    it('should suggest VPN when proxy is required but VPN is not', () => {
      const policy = makeValidPolicy({
        network: {
          proxyRequired: true,
          proxyType: 'socks5',
          dnsPolicy: 'doh',
          webrtcPolicy: 'disable',
          vpnRequired: false,
        },
      });
      const result = engine.validatePolicy(policy);

      expect(result.suggestions.some(s => s.toLowerCase().includes('vpn'))).toBe(true);
    });
  });

  // =========================================================================
  // applyPolicyTemplate
  // =========================================================================

  describe('applyPolicyTemplate', () => {
    const ctx = makeAdminContext();
    const workspaceId = 'ws-1';
    const versionId = 'ver-1';

    it('should return error when template version is not found', () => {
      mockRepository.getPolicyTemplateVersion.mockReturnValue(null);

      const { assignment, validation } = engine.applyPolicyTemplate(ctx, workspaceId, versionId);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0].code).toBe('TEMPLATE_VERSION_NOT_FOUND');
      expect(validation.riskScore).toBe(100);
    });

    it('should perform dry run without creating assignment', () => {
      const version: PolicyTemplateVersion = {
        id: versionId,
        tenantId: ctx.tenantId,
        templateId: 'tmpl-1',
        versionLabel: 'v1',
        policyJson: makeValidPolicy(),
        policyHash: 'abc123',
        createdAt: new Date().toISOString(),
      };
      mockRepository.getPolicyTemplateVersion.mockReturnValue(version);

      const { assignment, validation } = engine.applyPolicyTemplate(
        ctx, workspaceId, versionId, 'dry_run',
      );

      expect(validation.valid).toBe(true);
      expect(mockRepository.createPolicyAssignment).not.toHaveBeenCalled();
      expect(mockAudit.logPolicyChange).not.toHaveBeenCalled();
    });

    it('should not create assignment when validation fails', () => {
      const version: PolicyTemplateVersion = {
        id: versionId,
        tenantId: ctx.tenantId,
        templateId: 'tmpl-1',
        versionLabel: 'v1',
        policyJson: { version: '', name: '', rules: [] } as PolicyConfig,
        policyHash: 'abc123',
        createdAt: new Date().toISOString(),
      };
      mockRepository.getPolicyTemplateVersion.mockReturnValue(version);

      const { validation } = engine.applyPolicyTemplate(ctx, workspaceId, versionId);

      expect(validation.valid).toBe(false);
      expect(mockRepository.createPolicyAssignment).not.toHaveBeenCalled();
      expect(mockAudit.logPolicyChange).not.toHaveBeenCalled();
    });

    it('should create assignment and log audit when validation passes', () => {
      const validPolicy = makeValidPolicy();
      const version: PolicyTemplateVersion = {
        id: versionId,
        tenantId: ctx.tenantId,
        templateId: 'tmpl-1',
        versionLabel: 'v1',
        policyJson: validPolicy,
        policyHash: 'abc123',
        createdAt: new Date().toISOString(),
      };
      const fakeAssignment: PolicyAssignment = {
        id: 'assign-1',
        tenantId: ctx.tenantId,
        workspaceId,
        templateVersionId: versionId,
        appliedBy: ctx.userId,
        appliedVia: 'mcp',
        mode: 'apply',
        createdAt: new Date().toISOString(),
      };

      mockRepository.getPolicyTemplateVersion.mockReturnValue(version);
      mockRepository.createPolicyAssignment.mockReturnValue(fakeAssignment);

      const { assignment, validation } = engine.applyPolicyTemplate(ctx, workspaceId, versionId);

      expect(validation.valid).toBe(true);
      expect(mockRepository.createPolicyAssignment).toHaveBeenCalledTimes(1);
      expect(mockRepository.createPolicyAssignment).toHaveBeenCalledWith(
        ctx.tenantId,
        expect.objectContaining({
          workspaceId,
          templateVersionId: versionId,
          appliedBy: ctx.userId,
          appliedVia: 'mcp',
          mode: 'apply',
        }),
      );
      expect(mockAudit.logPolicyChange).toHaveBeenCalledWith(
        ctx, workspaceId, versionId, 'apply',
      );
      expect(assignment).toEqual(fakeAssignment);
    });
  });

  // =========================================================================
  // getEffectivePolicy
  // =========================================================================

  describe('getEffectivePolicy', () => {
    it('should return null when no active assignment exists', () => {
      mockRepository.getActivePolicyAssignment.mockReturnValue(null);

      const result = engine.getEffectivePolicy('tenant-1', 'ws-1');
      expect(result).toBeNull();
    });

    it('should return the policy version for an active assignment', () => {
      const assignment: PolicyAssignment = {
        id: 'a-1',
        tenantId: 'tenant-1',
        workspaceId: 'ws-1',
        templateVersionId: 'ver-1',
        appliedVia: 'mcp',
        mode: 'apply',
        createdAt: new Date().toISOString(),
      };
      const version: PolicyTemplateVersion = {
        id: 'ver-1',
        tenantId: 'tenant-1',
        templateId: 'tmpl-1',
        versionLabel: 'v1',
        policyJson: makeValidPolicy(),
        policyHash: 'hash',
        createdAt: new Date().toISOString(),
      };

      mockRepository.getActivePolicyAssignment.mockReturnValue(assignment);
      mockRepository.getPolicyTemplateVersion.mockReturnValue(version);

      const result = engine.getEffectivePolicy('tenant-1', 'ws-1');
      expect(result).toEqual(version);
      expect(mockRepository.getPolicyTemplateVersion).toHaveBeenCalledWith('tenant-1', 'ver-1');
    });
  });

  // =========================================================================
  // checkDrift
  // =========================================================================

  describe('checkDrift', () => {
    it('should return no drift when no policy is assigned', () => {
      mockRepository.getActivePolicyAssignment.mockReturnValue(null);

      const result = engine.checkDrift('tenant-1', 'ws-1');
      expect(result.hasDrift).toBe(false);
      expect(result.details).toBe('No policy assigned');
    });

    it('should return no drift when policy is assigned', () => {
      const assignment: PolicyAssignment = {
        id: 'a-1',
        tenantId: 'tenant-1',
        workspaceId: 'ws-1',
        templateVersionId: 'ver-1',
        appliedVia: 'mcp',
        mode: 'apply',
        createdAt: new Date().toISOString(),
      };
      const version: PolicyTemplateVersion = {
        id: 'ver-1',
        tenantId: 'tenant-1',
        templateId: 'tmpl-1',
        versionLabel: 'v1',
        policyJson: makeValidPolicy(),
        policyHash: 'expected-hash',
        createdAt: new Date().toISOString(),
      };

      mockRepository.getActivePolicyAssignment.mockReturnValue(assignment);
      mockRepository.getPolicyTemplateVersion.mockReturnValue(version);

      const result = engine.checkDrift('tenant-1', 'ws-1');
      expect(result.hasDrift).toBe(false);
      expect(result.currentPolicyHash).toBe('expected-hash');
      expect(result.expectedPolicyHash).toBe('expected-hash');
    });
  });
});

// ===========================================================================
// Built-in Templates
// ===========================================================================

describe('Built-in Policy Templates', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    const mockRepository = createMockRepository();
    const mockAudit = createMockAudit();
    engine = new PolicyEngine(
      mockRepository as unknown as PrivacyRepository,
      mockAudit as unknown as AuditService,
    );
  });

  // 16. All 6 templates exist
  it('should contain all 6 expected templates', () => {
    const keys = getBuiltinTemplateKeys();
    expect(keys).toContain('basic');
    expect(keys).toContain('privacy');
    expect(keys).toContain('hardened');
    expect(keys).toContain('team-strict');
    expect(keys).toContain('travel');
    expect(keys).toContain('dev');
    expect(keys).toHaveLength(6);
  });

  // 17. All templates pass runtime validation
  it('should validate all templates without errors in runtime profile', () => {
    const keys = getBuiltinTemplateKeys();
    for (const key of keys) {
      const template = getBuiltinTemplate(key)!;
      const result = engine.validatePolicy(template.policy, 'runtime');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  // 18. Hardened template has lowest risk score
  it('should assign the lowest risk score to the hardened template', () => {
    const keys = getBuiltinTemplateKeys();
    const scores: Record<string, number> = {};
    for (const key of keys) {
      const template = getBuiltinTemplate(key)!;
      const result = engine.validatePolicy(template.policy);
      scores[key] = result.riskScore;
    }

    const hardenedScore = scores['hardened'];
    for (const key of keys) {
      if (key !== 'hardened') {
        expect(hardenedScore).toBeLessThanOrEqual(scores[key]);
      }
    }
  });

  // 19. Dev template has highest risk score
  it('should assign the highest risk score to the dev template', () => {
    const keys = getBuiltinTemplateKeys();
    const scores: Record<string, number> = {};
    for (const key of keys) {
      const template = getBuiltinTemplate(key)!;
      const result = engine.validatePolicy(template.policy);
      scores[key] = result.riskScore;
    }

    const devScore = scores['dev'];
    for (const key of keys) {
      if (key !== 'dev') {
        expect(devScore).toBeGreaterThanOrEqual(scores[key]);
      }
    }
  });

  // 20. getBuiltinTemplate returns correct template
  it('should return the correct template for a given key', () => {
    const basic = getBuiltinTemplate('basic');
    expect(basic).toBeDefined();
    expect(basic!.name).toBe('Basic Privacy');
    expect(basic!.policy.name).toBe('Basic Privacy');

    const hardened = getBuiltinTemplate('hardened');
    expect(hardened).toBeDefined();
    expect(hardened!.name).toBe('Hardened');

    const nonexistent = getBuiltinTemplate('nonexistent');
    expect(nonexistent).toBeUndefined();
  });

  // 21. getBuiltinTemplateKeys returns all keys
  it('should return all template keys via getBuiltinTemplateKeys', () => {
    const keys = getBuiltinTemplateKeys();
    const expectedKeys = Object.keys(BUILTIN_POLICY_TEMPLATES);
    expect(keys).toEqual(expectedKeys);
    expect(keys.length).toBe(6);
  });

  // Additional template-level checks
  it('should ensure every template has version, name, and rules', () => {
    const keys = getBuiltinTemplateKeys();
    for (const key of keys) {
      const template = getBuiltinTemplate(key)!;
      const policy = template.policy;
      expect(policy.version).toBeTruthy();
      expect(policy.name).toBeTruthy();
      expect(Array.isArray(policy.rules)).toBe(true);
      expect(policy.rules.length).toBeGreaterThan(0);
    }
  });

  it('should ensure every template has unique rule IDs within itself', () => {
    const keys = getBuiltinTemplateKeys();
    for (const key of keys) {
      const template = getBuiltinTemplate(key)!;
      const ruleIds = template.policy.rules.map(r => r.id);
      const uniqueIds = new Set(ruleIds);
      expect(uniqueIds.size).toBe(ruleIds.length);
    }
  });

  it('should ensure every template has both network and privacy sections', () => {
    const keys = getBuiltinTemplateKeys();
    for (const key of keys) {
      const template = getBuiltinTemplate(key)!;
      expect(template.policy.network).toBeDefined();
      expect(template.policy.privacy).toBeDefined();
    }
  });
});
