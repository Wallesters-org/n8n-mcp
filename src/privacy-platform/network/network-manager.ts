export interface NetworkProfile {
  id: string;
  workspaceId: string;
  proxy?: {
    type: 'socks5' | 'http' | 'residential';
    host: string;
    port: number;
    credentialRef?: string;
    enabled: boolean;
  };
  vpn?: {
    provider: string;
    configRef?: string;
    enabled: boolean;
  };
  dns: {
    policy: 'system' | 'doh' | 'dot';
    provider?: string;
    servers?: string[];
  };
  webrtcPolicy: 'disable' | 'relay_only' | 'allow';
  createdAt: string;
  updatedAt: string;
}

export interface LeakCheckResult {
  check: string;
  status: 'pass' | 'fail' | 'warning' | 'info' | 'skipped';
  details: string;
  remediation?: string;
}

export interface NetworkHealthResult {
  healthy: boolean;
  proxyReachable: boolean | null;
  dnsEncrypted: boolean;
  webrtcSafe: boolean;
  checks: LeakCheckResult[];
}

/**
 * Manages per-workspace network profiles, proxy routing, DNS config, and leak detection.
 * Phase 1: policy-based analysis only (no live network checks).
 */
export class NetworkManager {
  private profiles: Map<string, NetworkProfile> = new Map();

  /** Set or update a workspace's network profile */
  setProfile(profile: NetworkProfile): void {
    const proxy = profile.proxy as Record<string, unknown> | undefined;
    if (proxy && ('username' in proxy || 'password' in proxy)) {
      throw new Error('Plaintext credentials not allowed. Use credentialRef.');
    }
    profile.updatedAt = new Date().toISOString();
    this.profiles.set(profile.workspaceId, profile);
  }

  /** Get network profile for a workspace */
  getProfile(workspaceId: string): NetworkProfile | undefined {
    return this.profiles.get(workspaceId);
  }

  /** Remove a workspace's network profile */
  removeProfile(workspaceId: string): boolean {
    return this.profiles.delete(workspaceId);
  }

  /** List all network profiles */
  listProfiles(): NetworkProfile[] {
    return [...this.profiles.values()];
  }

  /**
   * Run leak checks against a workspace's network configuration.
   * Phase 1: returns policy-based analysis (no live traffic checks).
   */
  checkLeaks(workspaceId: string): LeakCheckResult[] {
    const profile = this.profiles.get(workspaceId);
    const results: LeakCheckResult[] = [];

    if (!profile) {
      results.push({
        check: 'profile',
        status: 'warning',
        details: 'No network profile configured',
        remediation: 'Set a network profile for this workspace',
      });
      return results;
    }

    // DNS check
    if (profile.dns.policy === 'system') {
      results.push({
        check: 'dns',
        status: 'warning',
        details: 'System DNS in use - queries visible to ISP',
        remediation: 'Switch to DoH or DoT',
      });
    } else {
      results.push({
        check: 'dns',
        status: 'pass',
        details: `Encrypted DNS (${profile.dns.policy}) via ${profile.dns.provider || 'default'}`,
      });
    }

    // WebRTC check
    if (profile.webrtcPolicy === 'allow') {
      results.push({
        check: 'webrtc',
        status: 'warning',
        details: 'WebRTC allowed - may expose real IP via STUN',
        remediation: 'Set webrtcPolicy to "disable" or "relay_only"',
      });
    } else {
      results.push({
        check: 'webrtc',
        status: 'pass',
        details: `WebRTC policy: ${profile.webrtcPolicy}`,
      });
    }

    // Proxy check
    if (profile.proxy?.enabled) {
      results.push({
        check: 'proxy',
        status: 'pass',
        details: `Proxy: ${profile.proxy.type} at ${profile.proxy.host}:${profile.proxy.port}`,
      });
      if (!profile.proxy.credentialRef) {
        results.push({
          check: 'proxy_auth',
          status: 'info',
          details: 'No credential reference set for proxy',
        });
      }
    } else {
      results.push({
        check: 'proxy',
        status: 'info',
        details: 'No proxy configured',
        remediation: 'Consider adding a proxy for IP anonymization',
      });
    }

    // VPN check
    if (profile.vpn?.enabled) {
      results.push({
        check: 'vpn',
        status: 'pass',
        details: `VPN enabled via ${profile.vpn.provider}`,
      });
    } else {
      results.push({
        check: 'vpn',
        status: 'info',
        details: 'No VPN configured',
        remediation: 'Consider adding VPN for additional network privacy',
      });
    }

    return results;
  }

  /** Get overall network health for a workspace */
  getHealth(workspaceId: string): NetworkHealthResult {
    const profile = this.profiles.get(workspaceId);
    const checks = this.checkLeaks(workspaceId);

    return {
      healthy: !checks.some(c => c.status === 'fail'),
      proxyReachable: profile?.proxy?.enabled ? null : null,
      dnsEncrypted: profile?.dns.policy !== 'system',
      webrtcSafe: profile?.webrtcPolicy !== 'allow',
      checks,
    };
  }

  /** Get recommended DNS servers by encryption policy */
  getRecommendedDnsServers(policy: 'doh' | 'dot'): Array<{ provider: string; servers: string[] }> {
    if (policy === 'doh') {
      return [
        { provider: 'cloudflare', servers: ['https://1.1.1.1/dns-query', 'https://1.0.0.1/dns-query'] },
        { provider: 'google', servers: ['https://dns.google/dns-query'] },
        { provider: 'quad9', servers: ['https://dns.quad9.net/dns-query'] },
      ];
    }
    return [
      { provider: 'cloudflare', servers: ['tls://1.1.1.1', 'tls://1.0.0.1'] },
      { provider: 'google', servers: ['tls://dns.google'] },
      { provider: 'quad9', servers: ['tls://dns.quad9.net'] },
    ];
  }
}
