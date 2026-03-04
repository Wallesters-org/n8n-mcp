import { PolicyConfig } from '../types/index.js';

/**
 * Built-in policy templates covering common use cases.
 * These are seeded into the database on first run.
 */
export const BUILTIN_POLICY_TEMPLATES: Record<string, { name: string; description: string; policy: PolicyConfig }> = {
  basic: {
    name: 'Basic Privacy',
    description: 'Minimal privacy settings for general browsing. Low overhead, basic protections.',
    policy: {
      version: '1.0',
      name: 'Basic Privacy',
      description: 'Minimal privacy settings for general browsing',
      rules: [
        {
          id: 'basic-cookie-isolation',
          category: 'storage',
          action: 'enforce',
          condition: 'cookies.thirdParty === false',
          description: 'Block third-party cookies',
        },
        {
          id: 'basic-https',
          category: 'network',
          action: 'warn',
          condition: 'connection.protocol === "https"',
          description: 'Warn on non-HTTPS connections',
        },
      ],
      network: {
        proxyRequired: false,
        dnsPolicy: 'system',
        webrtcPolicy: 'relay_only',
        vpnRequired: false,
      },
      privacy: {
        cookieIsolation: true,
        storagePartitioning: false,
        canvasProtection: 'allow',
        webglProtection: 'allow',
        audioProtection: 'allow',
        fontEnumeration: 'allow',
        screenResolution: 'real',
      },
    },
  },

  privacy: {
    name: 'Privacy Standard',
    description: 'Balanced privacy with fingerprint noise and encrypted DNS. Recommended for daily use.',
    policy: {
      version: '1.0',
      name: 'Privacy Standard',
      description: 'Balanced privacy with fingerprint noise and encrypted DNS',
      rules: [
        {
          id: 'priv-cookie-isolation',
          category: 'storage',
          action: 'enforce',
          condition: 'cookies.thirdParty === false',
          description: 'Block third-party cookies',
        },
        {
          id: 'priv-storage-partition',
          category: 'storage',
          action: 'enforce',
          condition: 'storage.partitioned === true',
          description: 'Enforce storage partitioning',
        },
        {
          id: 'priv-canvas-noise',
          category: 'browser',
          action: 'enforce',
          condition: 'canvas.protection === "noise"',
          description: 'Apply canvas fingerprint noise',
        },
        {
          id: 'priv-webgl-noise',
          category: 'browser',
          action: 'enforce',
          condition: 'webgl.protection === "noise"',
          description: 'Apply WebGL fingerprint noise',
        },
        {
          id: 'priv-dns-encrypted',
          category: 'network',
          action: 'enforce',
          condition: 'dns.encrypted === true',
          description: 'Require encrypted DNS',
        },
      ],
      network: {
        proxyRequired: false,
        dnsPolicy: 'doh',
        dnsProvider: 'cloudflare',
        webrtcPolicy: 'relay_only',
        vpnRequired: false,
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
    },
  },

  hardened: {
    name: 'Hardened',
    description: 'Maximum privacy with proxy, VPN, and full fingerprint protection. For sensitive operations.',
    policy: {
      version: '1.0',
      name: 'Hardened',
      description: 'Maximum privacy with proxy, VPN, and full fingerprint protection',
      rules: [
        {
          id: 'hard-proxy',
          category: 'network',
          action: 'enforce',
          condition: 'proxy.active === true',
          description: 'Require active proxy',
        },
        {
          id: 'hard-vpn',
          category: 'network',
          action: 'enforce',
          condition: 'vpn.active === true',
          description: 'Require active VPN tunnel',
        },
        {
          id: 'hard-webrtc-disable',
          category: 'network',
          action: 'block',
          condition: 'webrtc.enabled === false',
          description: 'Disable WebRTC completely',
        },
        {
          id: 'hard-canvas-block',
          category: 'browser',
          action: 'enforce',
          condition: 'canvas.protection === "block"',
          description: 'Block canvas fingerprinting',
        },
        {
          id: 'hard-webgl-block',
          category: 'browser',
          action: 'enforce',
          condition: 'webgl.protection === "block"',
          description: 'Block WebGL fingerprinting',
        },
        {
          id: 'hard-audio-block',
          category: 'browser',
          action: 'enforce',
          condition: 'audio.protection === "block"',
          description: 'Block audio fingerprinting',
        },
        {
          id: 'hard-font-restrict',
          category: 'browser',
          action: 'enforce',
          condition: 'fonts.enumeration === "restrict"',
          description: 'Restrict font enumeration',
        },
        {
          id: 'hard-storage',
          category: 'storage',
          action: 'enforce',
          condition: 'storage.partitioned === true && cookies.thirdParty === false',
          description: 'Full storage isolation',
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
        canvasProtection: 'block',
        webglProtection: 'block',
        audioProtection: 'block',
        fontEnumeration: 'restrict',
        screenResolution: 'letterbox',
      },
    },
  },

  'team-strict': {
    name: 'Team Strict',
    description: 'Enterprise team policy with mandatory proxy, audit logging, and compliance rules.',
    policy: {
      version: '1.0',
      name: 'Team Strict',
      description: 'Enterprise team policy with mandatory proxy and compliance',
      rules: [
        {
          id: 'team-proxy-required',
          category: 'network',
          action: 'enforce',
          condition: 'proxy.active === true',
          description: 'Require proxy for all team members',
        },
        {
          id: 'team-dns-encrypted',
          category: 'network',
          action: 'enforce',
          condition: 'dns.encrypted === true',
          description: 'Require encrypted DNS',
        },
        {
          id: 'team-webrtc-relay',
          category: 'network',
          action: 'enforce',
          condition: 'webrtc.mode === "relay_only"',
          description: 'WebRTC relay mode only',
        },
        {
          id: 'team-canvas-noise',
          category: 'browser',
          action: 'enforce',
          condition: 'canvas.protection === "noise"',
          description: 'Canvas noise required',
        },
        {
          id: 'team-audit-required',
          category: 'access',
          action: 'enforce',
          condition: 'audit.enabled === true',
          description: 'Audit logging mandatory',
        },
        {
          id: 'team-no-export',
          category: 'access',
          action: 'block',
          condition: 'data.export === false',
          description: 'Block unauthorized data export',
        },
      ],
      network: {
        proxyRequired: true,
        proxyType: 'residential',
        dnsPolicy: 'doh',
        dnsProvider: 'cloudflare',
        webrtcPolicy: 'relay_only',
        vpnRequired: false,
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
    },
  },

  travel: {
    name: 'Travel Mode',
    description: 'Geo-aware privacy for travel/remote work. VPN required with location-consistent settings.',
    policy: {
      version: '1.0',
      name: 'Travel Mode',
      description: 'Geo-aware privacy for travel and remote work',
      rules: [
        {
          id: 'travel-vpn',
          category: 'network',
          action: 'enforce',
          condition: 'vpn.active === true',
          description: 'VPN required in travel mode',
        },
        {
          id: 'travel-proxy',
          category: 'network',
          action: 'enforce',
          condition: 'proxy.active === true',
          description: 'Proxy required for geo-consistency',
        },
        {
          id: 'travel-dns',
          category: 'network',
          action: 'enforce',
          condition: 'dns.encrypted === true && dns.geoConsistent === true',
          description: 'DNS must be encrypted and geo-consistent',
        },
        {
          id: 'travel-timezone',
          category: 'browser',
          action: 'enforce',
          condition: 'browser.timezone === proxy.timezone',
          description: 'Browser timezone must match proxy location',
        },
        {
          id: 'travel-locale',
          category: 'browser',
          action: 'enforce',
          condition: 'browser.locale === proxy.locale',
          description: 'Browser locale must match proxy location',
        },
        {
          id: 'travel-fingerprint',
          category: 'browser',
          action: 'enforce',
          condition: 'canvas.protection !== "allow"',
          description: 'Fingerprint protection required',
        },
      ],
      network: {
        proxyRequired: true,
        proxyType: 'residential',
        dnsPolicy: 'doh',
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
    },
  },

  dev: {
    name: 'Developer Mode',
    description: 'Relaxed policy for development and testing. Minimal restrictions, full browser access.',
    policy: {
      version: '1.0',
      name: 'Developer Mode',
      description: 'Relaxed policy for development and testing',
      rules: [
        {
          id: 'dev-log-only',
          category: 'privacy',
          action: 'log',
          condition: 'always',
          description: 'Log all privacy events without blocking',
        },
        {
          id: 'dev-cookie-basic',
          category: 'storage',
          action: 'warn',
          condition: 'cookies.thirdParty === false',
          description: 'Warn on third-party cookies but allow',
        },
      ],
      network: {
        proxyRequired: false,
        dnsPolicy: 'system',
        webrtcPolicy: 'allow',
        vpnRequired: false,
      },
      privacy: {
        cookieIsolation: false,
        storagePartitioning: false,
        canvasProtection: 'allow',
        webglProtection: 'allow',
        audioProtection: 'allow',
        fontEnumeration: 'allow',
        screenResolution: 'real',
      },
    },
  },
};

/**
 * Get a built-in template by key
 */
export function getBuiltinTemplate(key: string): typeof BUILTIN_POLICY_TEMPLATES[string] | undefined {
  return BUILTIN_POLICY_TEMPLATES[key];
}

/**
 * Get all built-in template keys
 */
export function getBuiltinTemplateKeys(): string[] {
  return Object.keys(BUILTIN_POLICY_TEMPLATES);
}
