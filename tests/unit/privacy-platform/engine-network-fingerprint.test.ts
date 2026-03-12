import { describe, it, expect, beforeEach } from 'vitest';
import { EngineManager } from '../../../src/privacy-platform/engines/engine-manager.js';
import { NetworkManager } from '../../../src/privacy-platform/network/network-manager.js';
import { FingerprintGenerator } from '../../../src/privacy-platform/fingerprint/generator.js';
import {
  PRIVACY_WORKFLOW_TEMPLATES,
  getWorkflowTemplate,
  getWorkflowTemplateKeys,
} from '../../../src/privacy-platform/workflows/templates.js';

// ============================================================
// EngineManager
// ============================================================

describe('EngineManager', () => {
  let engine: EngineManager;

  beforeEach(() => {
    engine = new EngineManager({ maxSessions: 3 });
  });

  describe('launchSession', () => {
    it('launches a session successfully', async () => {
      const result = await engine.launchSession({ type: 'camoufox', profileId: 'p-1' });
      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session!.status).toBe('running');
      expect(result.session!.engineType).toBe('camoufox');
    });

    it('sets workspace ID when provided', async () => {
      const result = await engine.launchSession({ type: 'patchright', profileId: 'p-1' }, 'ws-1');
      expect(result.session!.workspaceId).toBe('ws-1');
    });

    it('rejects when max sessions reached', async () => {
      await engine.launchSession({ type: 'camoufox', profileId: 'p-1' });
      await engine.launchSession({ type: 'camoufox', profileId: 'p-2' });
      await engine.launchSession({ type: 'camoufox', profileId: 'p-3' });
      const result = await engine.launchSession({ type: 'camoufox', profileId: 'p-4' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum');
    });

    it('records metadata about proxy and fingerprint config', async () => {
      const result = await engine.launchSession({
        type: 'camoufox',
        profileId: 'p-1',
        proxyConfig: { type: 'socks5', host: 'proxy', port: 1080 },
        fingerprintConfig: { os: 'windows' },
        headless: true,
      });
      expect(result.session!.metadata.hasProxy).toBe(true);
      expect(result.session!.metadata.hasFingerprint).toBe(true);
      expect(result.session!.metadata.headless).toBe(true);
    });
  });

  describe('stopSession', () => {
    it('stops a running session', async () => {
      const { session } = await engine.launchSession({ type: 'camoufox', profileId: 'p-1' });
      const stopped = await engine.stopSession(session!.id);
      expect(stopped).toBe(true);
      expect(engine.getSession(session!.id)!.status).toBe('stopped');
    });

    it('returns false for unknown session', async () => {
      expect(await engine.stopSession('nonexistent')).toBe(false);
    });
  });

  describe('pauseSession / resumeSession', () => {
    it('pauses and resumes a session', async () => {
      const { session } = await engine.launchSession({ type: 'camoufox', profileId: 'p-1' });
      expect(await engine.pauseSession(session!.id)).toBe(true);
      expect(engine.getSession(session!.id)!.status).toBe('paused');
      expect(await engine.resumeSession(session!.id)).toBe(true);
      expect(engine.getSession(session!.id)!.status).toBe('running');
    });

    it('cannot pause a stopped session', async () => {
      const { session } = await engine.launchSession({ type: 'camoufox', profileId: 'p-1' });
      await engine.stopSession(session!.id);
      expect(await engine.pauseSession(session!.id)).toBe(false);
    });

    it('cannot resume a running session', async () => {
      const { session } = await engine.launchSession({ type: 'camoufox', profileId: 'p-1' });
      expect(await engine.resumeSession(session!.id)).toBe(false);
    });
  });

  describe('listSessions', () => {
    it('lists all sessions', async () => {
      await engine.launchSession({ type: 'camoufox', profileId: 'p-1' }, 'ws-1');
      await engine.launchSession({ type: 'patchright', profileId: 'p-2' }, 'ws-2');
      expect(engine.listSessions()).toHaveLength(2);
    });

    it('filters by workspace', async () => {
      await engine.launchSession({ type: 'camoufox', profileId: 'p-1' }, 'ws-1');
      await engine.launchSession({ type: 'camoufox', profileId: 'p-2' }, 'ws-2');
      expect(engine.listSessions({ workspaceId: 'ws-1' })).toHaveLength(1);
    });

    it('filters by status', async () => {
      const { session } = await engine.launchSession({ type: 'camoufox', profileId: 'p-1' });
      await engine.launchSession({ type: 'camoufox', profileId: 'p-2' });
      await engine.stopSession(session!.id);
      expect(engine.listSessions({ status: 'running' })).toHaveLength(1);
      expect(engine.listSessions({ status: 'stopped' })).toHaveLength(1);
    });

    it('filters by engine type', async () => {
      await engine.launchSession({ type: 'camoufox', profileId: 'p-1' });
      await engine.launchSession({ type: 'patchright', profileId: 'p-2' });
      expect(engine.listSessions({ engineType: 'camoufox' })).toHaveLength(1);
    });
  });

  describe('cleanupSessions', () => {
    it('cleans stopped sessions older than max age', async () => {
      const { session } = await engine.launchSession({ type: 'camoufox', profileId: 'p-1' });
      await engine.stopSession(session!.id);
      // Simulate old timestamp
      const s = engine.getSession(session!.id)!;
      (s as any).lastActivityAt = new Date(Date.now() - 7200000).toISOString();
      expect(engine.cleanupSessions(3600000)).toBe(1);
    });

    it('does not clean running sessions', async () => {
      await engine.launchSession({ type: 'camoufox', profileId: 'p-1' });
      expect(engine.cleanupSessions(0)).toBe(0);
    });
  });

  describe('getEngineStatus', () => {
    it('returns status for all three engines', () => {
      const status = engine.getEngineStatus();
      expect(status.camoufox).toBeDefined();
      expect(status.patchright).toBeDefined();
      expect(status.nodriver).toBeDefined();
    });
  });

  describe('getActiveSessionCount', () => {
    it('counts only running sessions', async () => {
      const { session } = await engine.launchSession({ type: 'camoufox', profileId: 'p-1' });
      await engine.launchSession({ type: 'camoufox', profileId: 'p-2' });
      await engine.stopSession(session!.id);
      expect(engine.getActiveSessionCount()).toBe(1);
    });
  });
});

// ============================================================
// NetworkManager
// ============================================================

describe('NetworkManager', () => {
  let network: NetworkManager;

  beforeEach(() => {
    network = new NetworkManager();
  });

  const makeProfile = (overrides?: Record<string, unknown>) => ({
    id: 'np-1',
    workspaceId: 'ws-1',
    dns: { policy: 'doh' as const, provider: 'cloudflare' },
    webrtcPolicy: 'disable' as const,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  });

  describe('setProfile / getProfile', () => {
    it('stores and retrieves a profile', () => {
      network.setProfile(makeProfile());
      expect(network.getProfile('ws-1')).toBeDefined();
      expect(network.getProfile('ws-1')!.dns.policy).toBe('doh');
    });

    it('rejects plaintext credentials', () => {
      expect(() => {
        network.setProfile(makeProfile({
          proxy: { type: 'socks5', host: 'x', port: 1080, enabled: true, username: 'admin' },
        }) as any);
      }).toThrow('Plaintext credentials');
    });

    it('returns undefined for unknown workspace', () => {
      expect(network.getProfile('nonexistent')).toBeUndefined();
    });
  });

  describe('removeProfile', () => {
    it('removes existing profile', () => {
      network.setProfile(makeProfile());
      expect(network.removeProfile('ws-1')).toBe(true);
      expect(network.getProfile('ws-1')).toBeUndefined();
    });

    it('returns false for nonexistent profile', () => {
      expect(network.removeProfile('nope')).toBe(false);
    });
  });

  describe('checkLeaks', () => {
    it('returns warning when no profile configured', () => {
      const results = network.checkLeaks('ws-no-profile');
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('warning');
    });

    it('passes DNS check with encrypted DNS', () => {
      network.setProfile(makeProfile({ dns: { policy: 'doh', provider: 'cloudflare' } }));
      const results = network.checkLeaks('ws-1');
      const dns = results.find(r => r.check === 'dns');
      expect(dns!.status).toBe('pass');
    });

    it('warns on system DNS', () => {
      network.setProfile(makeProfile({ dns: { policy: 'system' } }));
      const results = network.checkLeaks('ws-1');
      const dns = results.find(r => r.check === 'dns');
      expect(dns!.status).toBe('warning');
    });

    it('warns on WebRTC allow', () => {
      network.setProfile(makeProfile({ webrtcPolicy: 'allow' }));
      const results = network.checkLeaks('ws-1');
      const webrtc = results.find(r => r.check === 'webrtc');
      expect(webrtc!.status).toBe('warning');
    });

    it('passes WebRTC check when disabled', () => {
      network.setProfile(makeProfile({ webrtcPolicy: 'disable' }));
      const results = network.checkLeaks('ws-1');
      const webrtc = results.find(r => r.check === 'webrtc');
      expect(webrtc!.status).toBe('pass');
    });

    it('reports proxy status', () => {
      network.setProfile(makeProfile({
        proxy: { type: 'socks5', host: 'proxy.example', port: 1080, enabled: true, credentialRef: 'ref-1' },
      }));
      const results = network.checkLeaks('ws-1');
      const proxy = results.find(r => r.check === 'proxy');
      expect(proxy!.status).toBe('pass');
    });
  });

  describe('getHealth', () => {
    it('returns healthy when no failures', () => {
      network.setProfile(makeProfile());
      const health = network.getHealth('ws-1');
      expect(health.healthy).toBe(true);
      expect(health.dnsEncrypted).toBe(true);
      expect(health.webrtcSafe).toBe(true);
    });

    it('reports unhealthy DNS when system', () => {
      network.setProfile(makeProfile({ dns: { policy: 'system' } }));
      const health = network.getHealth('ws-1');
      expect(health.dnsEncrypted).toBe(false);
    });
  });

  describe('getRecommendedDnsServers', () => {
    it('returns DoH servers', () => {
      const servers = network.getRecommendedDnsServers('doh');
      expect(servers.length).toBeGreaterThanOrEqual(3);
      expect(servers[0].servers[0]).toContain('https://');
    });

    it('returns DoT servers', () => {
      const servers = network.getRecommendedDnsServers('dot');
      expect(servers.length).toBeGreaterThanOrEqual(3);
      expect(servers[0].servers[0]).toContain('tls://');
    });
  });
});

// ============================================================
// FingerprintGenerator
// ============================================================

describe('FingerprintGenerator', () => {
  let gen: FingerprintGenerator;

  beforeEach(() => {
    gen = new FingerprintGenerator();
  });

  describe('generate', () => {
    it('generates a complete fingerprint for Windows/Chrome', () => {
      const fp = gen.generate({ os: 'windows', browser: 'chrome' });
      expect(fp.userAgent).toContain('Windows');
      expect(fp.userAgent).toContain('Chrome');
      expect(fp.platform).toBe('Win32');
      expect(fp.cookieEnabled).toBe(true);
      expect(fp.generatedAt).toBeDefined();
    });

    it('generates a complete fingerprint for macOS/Firefox', () => {
      const fp = gen.generate({ os: 'macos', browser: 'firefox' });
      expect(fp.userAgent).toContain('Macintosh');
      expect(fp.userAgent).toContain('Firefox');
      expect(fp.platform).toBe('MacIntel');
    });

    it('generates a complete fingerprint for Linux', () => {
      const fp = gen.generate({ os: 'linux', browser: 'chrome' });
      expect(fp.userAgent).toContain('Linux');
      expect(fp.platform).toContain('Linux');
    });

    it('produces deterministic output for same spec', () => {
      const spec = { os: 'windows' as const, browser: 'chrome' as const, locale: 'en-US', timezone: 'America/New_York' };
      const fp1 = gen.generate(spec);
      const fp2 = gen.generate(spec);
      expect(fp1.userAgent).toBe(fp2.userAgent);
      expect(fp1.hardwareConcurrency).toBe(fp2.hardwareConcurrency);
      expect(fp1.canvasNoiseSeed).toBe(fp2.canvasNoiseSeed);
    });

    it('produces different output for different specs', () => {
      const fp1 = gen.generate({ os: 'windows', browser: 'chrome' });
      const fp2 = gen.generate({ os: 'linux', browser: 'firefox' });
      expect(fp1.userAgent).not.toBe(fp2.userAgent);
      expect(fp1.platform).not.toBe(fp2.platform);
    });

    it('sets correct fonts for each OS', () => {
      const winFp = gen.generate({ os: 'windows', browser: 'chrome' });
      expect(winFp.fonts).toContain('Segoe UI');

      const macFp = gen.generate({ os: 'macos', browser: 'chrome' });
      expect(macFp.fonts).toContain('Helvetica');

      const linFp = gen.generate({ os: 'linux', browser: 'chrome' });
      expect(linFp.fonts).toContain('DejaVu Sans');
    });

    it('sets maxTouchPoints=0 for desktop/laptop', () => {
      const fp = gen.generate({ os: 'windows', browser: 'chrome', screenCategory: 'desktop' });
      expect(fp.maxTouchPoints).toBe(0);
    });

    it('sets maxTouchPoints>0 for mobile', () => {
      const fp = gen.generate({ os: 'linux', browser: 'chrome', screenCategory: 'mobile' });
      expect(fp.maxTouchPoints).toBeGreaterThan(0);
    });

    it('uses provided timezone and locale', () => {
      const fp = gen.generate({ os: 'windows', browser: 'chrome', timezone: 'Asia/Tokyo', locale: 'ja-JP' });
      expect(fp.timezone).toBe('Asia/Tokyo');
      expect(fp.language).toBe('ja-JP');
    });

    it('computes coherence score', () => {
      const fp = gen.generate({ os: 'windows', browser: 'chrome' });
      expect(fp.coherenceScore).toBeGreaterThanOrEqual(0);
      expect(fp.coherenceScore).toBeLessThanOrEqual(100);
    });

    it('has standard deviceMemory values', () => {
      const fp = gen.generate({ os: 'windows', browser: 'chrome' });
      expect([1, 2, 4, 8, 16, 32]).toContain(fp.deviceMemory);
    });

    it('has standard colorDepth', () => {
      const fp = gen.generate({ os: 'macos', browser: 'firefox' });
      expect([24, 30, 32]).toContain(fp.colorDepth);
    });
  });

  describe('validateCoherence', () => {
    it('returns coherent for a well-formed fingerprint', () => {
      const fp = gen.generate({ os: 'windows', browser: 'chrome', screenCategory: 'laptop' });
      const result = gen.validateCoherence(fp);
      expect(result.score).toBeGreaterThanOrEqual(80);
    });

    it('detects OS/platform mismatch', () => {
      const fp = gen.generate({ os: 'windows', browser: 'chrome' });
      fp.platform = 'MacIntel'; // mismatch
      const result = gen.validateCoherence(fp);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
    });

    it('detects non-standard screen resolution', () => {
      const fp = gen.generate({ os: 'windows', browser: 'chrome' });
      fp.screenWidth = 1234;
      fp.screenHeight = 567;
      const result = gen.validateCoherence(fp);
      expect(result.issues.some(i => i.includes('resolution'))).toBe(true);
    });

    it('detects availHeight > screenHeight', () => {
      const fp = gen.generate({ os: 'windows', browser: 'chrome' });
      fp.availHeight = fp.screenHeight + 100;
      const result = gen.validateCoherence(fp);
      expect(result.issues.some(i => i.includes('availHeight'))).toBe(true);
    });

    it('detects timezone offset mismatch', () => {
      const fp = gen.generate({ os: 'windows', browser: 'chrome', timezone: 'America/New_York' });
      fp.timezoneOffset = -540; // Tokyo offset, not NY
      const result = gen.validateCoherence(fp);
      expect(result.issues.some(i => i.includes('offset'))).toBe(true);
    });

    it('score is clamped between 0 and 100', () => {
      const fp = gen.generate({ os: 'windows', browser: 'chrome' });
      const result = gen.validateCoherence(fp);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});

// ============================================================
// Workflow Templates
// ============================================================

describe('Privacy Workflow Templates', () => {
  it('defines exactly 6 templates', () => {
    expect(PRIVACY_WORKFLOW_TEMPLATES).toHaveLength(6);
  });

  it('all templates have required fields', () => {
    for (const t of PRIVACY_WORKFLOW_TEMPLATES) {
      expect(t.key).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.tags.length).toBeGreaterThan(0);
      expect(t.workflow.nodes.length).toBeGreaterThan(0);
      expect(Object.keys(t.workflow.connections).length).toBeGreaterThan(0);
    }
  });

  it('all templates have unique keys', () => {
    const keys = PRIVACY_WORKFLOW_TEMPLATES.map(t => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('all template node connections use node names (not IDs)', () => {
    for (const t of PRIVACY_WORKFLOW_TEMPLATES) {
      const nodeNames = new Set(t.workflow.nodes.map(n => n.name));
      for (const key of Object.keys(t.workflow.connections)) {
        expect(nodeNames.has(key)).toBe(true);
      }
    }
  });

  it('all template nodes have valid structure', () => {
    for (const t of PRIVACY_WORKFLOW_TEMPLATES) {
      for (const node of t.workflow.nodes) {
        expect(node.name).toBeTruthy();
        expect(node.id).toBeTruthy();
        expect(node.type).toBeTruthy();
        expect(node.typeVersion).toBeGreaterThan(0);
        expect(node.position).toHaveLength(2);
      }
    }
  });

  it('getWorkflowTemplate returns correct template', () => {
    const t = getWorkflowTemplate('workspace-onboarding');
    expect(t).toBeDefined();
    expect(t!.name).toBe('Workspace Onboarding');
  });

  it('getWorkflowTemplate returns undefined for nonexistent', () => {
    expect(getWorkflowTemplate('nonexistent')).toBeUndefined();
  });

  it('getWorkflowTemplateKeys returns all keys', () => {
    const keys = getWorkflowTemplateKeys();
    expect(keys).toHaveLength(6);
    expect(keys).toContain('workspace-onboarding');
    expect(keys).toContain('policy-drift-monitor');
    expect(keys).toContain('exception-approval');
    expect(keys).toContain('network-hygiene');
    expect(keys).toContain('incident-lockdown');
    expect(keys).toContain('backup-export');
  });

  describe('specific templates', () => {
    it('workspace-onboarding has MCP tool nodes', () => {
      const t = getWorkflowTemplate('workspace-onboarding')!;
      const mcpNodes = t.workflow.nodes.filter(n => n.type === 'n8n-nodes-base.mcpClientTool');
      expect(mcpNodes.length).toBeGreaterThanOrEqual(3);
    });

    it('incident-lockdown applies hardened template', () => {
      const t = getWorkflowTemplate('incident-lockdown')!;
      const applyNode = t.workflow.nodes.find(n => n.name === 'Apply Hardened');
      expect(applyNode).toBeDefined();
      expect(applyNode!.parameters.params).toMatchObject({ template: 'hardened' });
    });

    it('policy-drift-monitor has schedule trigger', () => {
      const t = getWorkflowTemplate('policy-drift-monitor')!;
      const scheduleNode = t.workflow.nodes.find(n => n.type === 'n8n-nodes-base.scheduleTrigger');
      expect(scheduleNode).toBeDefined();
    });
  });
});
