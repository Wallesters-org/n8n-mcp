import { PrivacyToolDefinition } from '../types/index.js';

export const privacyPlatformTools: PrivacyToolDefinition[] = [
  {
    name: 'tools_documentation',
    description:
      'Get documentation for privacy platform MCP tools. Call without parameters for quick start guide. Use topic parameter for specific tool docs.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description:
            'Tool name (e.g., "create_workspace") or "overview" for general guide. Leave empty for quick reference.',
        },
        depth: {
          type: 'string',
          enum: ['essentials', 'full'],
          description:
            'Level of detail. "essentials" (default) for quick reference, "full" for comprehensive docs.',
        },
      },
    },
    annotations: {
      title: 'Tools Documentation',
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  {
    name: 'health_check',
    description:
      'Check privacy platform health, database connectivity, and connector status. Returns system version, uptime, and component health.',
    inputSchema: {
      type: 'object',
      properties: {
        includeConnectors: {
          type: 'boolean',
          description: 'Include connector health status (default: false)',
        },
      },
    },
    annotations: {
      title: 'Health Check',
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  {
    name: 'create_workspace',
    description:
      'Create a new privacy workspace with optional policy template. Workspaces are tenant-scoped containers for privacy configurations. Supports idempotency via idempotency_key parameter.',
    inputSchema: {
      type: 'object',
      properties: {
        display_name: {
          type: 'string',
          description: 'Human-readable workspace name',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Optional tags for organization (e.g., ["production", "team-a"])',
        },
        policy_template: {
          type: 'string',
          description:
            'Built-in policy template to apply: basic, privacy, hardened, team-strict, travel, dev',
          enum: ['basic', 'privacy', 'hardened', 'team-strict', 'travel', 'dev'],
        },
        idempotency_key: {
          type: 'string',
          description: 'Optional idempotency key for retry-safe operations',
        },
      },
      required: ['display_name'],
    },
    annotations: {
      title: 'Create Workspace',
      idempotentHint: true,
    },
  },
  {
    name: 'list_workspaces',
    description:
      'List all workspaces for the current tenant. Returns workspace metadata, active policy, and connector bindings.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'archived', 'all'],
          description: 'Filter by status (default: active)',
        },
        tag: {
          type: 'string',
          description: 'Filter by tag',
        },
      },
    },
    annotations: {
      title: 'List Workspaces',
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  {
    name: 'get_workspace',
    description:
      'Get detailed workspace information including privacy posture, active policy, risk score, connectors, and recent audit events.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'Workspace ID',
        },
        include_audit: {
          type: 'boolean',
          description: 'Include recent audit events (default: false)',
        },
        include_policy_details: {
          type: 'boolean',
          description: 'Include full policy configuration (default: false)',
        },
      },
      required: ['workspace_id'],
    },
    annotations: {
      title: 'Get Workspace',
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  {
    name: 'apply_policy_template',
    description:
      'Apply a policy template to a workspace. Supports built-in templates (basic, privacy, hardened, team-strict, travel, dev) or custom template IDs. Use mode=dry_run to preview changes without applying.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'Target workspace ID',
        },
        template: {
          type: 'string',
          description:
            'Built-in template name (basic, privacy, hardened, team-strict, travel, dev) or template version ID',
        },
        mode: {
          type: 'string',
          enum: ['apply', 'dry_run'],
          description:
            'apply (default) applies the policy, dry_run validates without applying',
        },
        idempotency_key: {
          type: 'string',
          description: 'Optional idempotency key for retry-safe operations',
        },
      },
      required: ['workspace_id', 'template'],
    },
    annotations: {
      title: 'Apply Policy Template',
      idempotentHint: true,
    },
  },
  {
    name: 'validate_policy',
    description:
      'Validate a policy configuration for coherence, completeness, and risk. Returns risk score (0-100), errors, warnings, and suggestions. Supports multiple validation profiles: minimal, runtime, strict.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description:
            'Workspace ID to validate current policy. Mutually exclusive with policy_json.',
        },
        policy_json: {
          type: 'object',
          description:
            'Raw policy JSON to validate. Mutually exclusive with workspace_id.',
        },
        profile: {
          type: 'string',
          enum: ['minimal', 'runtime', 'strict'],
          description: 'Validation strictness (default: runtime)',
        },
      },
    },
    annotations: {
      title: 'Validate Policy',
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  {
    name: 'set_network_routing',
    description:
      'Configure network routing for a workspace (proxy, VPN, DNS). Uses secret references, never stores plaintext credentials. Validates consistency with active policy.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'Target workspace ID',
        },
        proxy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', description: 'Enable proxy routing' },
            type: {
              type: 'string',
              enum: ['socks5', 'http', 'residential'],
              description: 'Proxy type',
            },
            host: { type: 'string', description: 'Proxy host' },
            port: { type: 'number', description: 'Proxy port' },
            credential_ref: {
              type: 'string',
              description:
                'Secret reference for proxy credentials (never plaintext)',
            },
          },
          description: 'Proxy configuration',
        },
        vpn: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', description: 'Enable VPN tunnel' },
            provider: { type: 'string', description: 'VPN provider' },
            config_ref: {
              type: 'string',
              description: 'Secret reference for VPN config',
            },
          },
          description: 'VPN configuration',
        },
        dns: {
          type: 'object',
          properties: {
            policy: {
              type: 'string',
              enum: ['system', 'doh', 'dot'],
              description: 'DNS policy',
            },
            provider: {
              type: 'string',
              description: 'DNS provider (e.g., cloudflare, google)',
            },
          },
          description: 'DNS configuration',
        },
        idempotency_key: {
          type: 'string',
          description: 'Optional idempotency key',
        },
      },
      required: ['workspace_id'],
    },
    annotations: {
      title: 'Set Network Routing',
      idempotentHint: true,
    },
  },
  {
    name: 'check_network_leaks',
    description:
      'Run defensive network leak checks for a workspace. Tests WebRTC, DNS, and TLS configuration for potential data exposure. Returns pass/fail per check with remediation steps.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'Workspace ID to check',
        },
        checks: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['webrtc', 'dns', 'tls', 'all'],
          },
          description: 'Which checks to run (default: all)',
        },
      },
      required: ['workspace_id'],
    },
    annotations: {
      title: 'Check Network Leaks',
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  {
    name: 'enroll_connector',
    description:
      'Register a browser extension or managed session connector. Connectors are the data plane that enforces policies in actual browser environments.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['extension', 'managed_sessions'],
          description: 'Connector type',
        },
        name: {
          type: 'string',
          description: 'Human-readable connector name',
        },
        workspace_id: {
          type: 'string',
          description: 'Optional workspace to bind immediately',
        },
        metadata: {
          type: 'object',
          description:
            'Additional connector metadata (browser version, OS, etc.)',
        },
        idempotency_key: {
          type: 'string',
          description: 'Optional idempotency key',
        },
      },
      required: ['type'],
    },
    annotations: {
      title: 'Enroll Connector',
      idempotentHint: true,
    },
  },
];
