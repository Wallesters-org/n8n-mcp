export interface WorkflowTemplate {
  key: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  workflow: {
    nodes: Array<{
      name: string;
      id: string;
      type: string;
      typeVersion: number;
      position: [number, number];
      parameters: Record<string, unknown>;
    }>;
    connections: Record<string, { main: Array<Array<{ node: string; type: string; index: number }>> }>;
  };
}

const WORKSPACE_ONBOARDING: WorkflowTemplate = {
  key: 'workspace-onboarding',
  name: 'Workspace Onboarding',
  description: 'Provision a new privacy workspace with policy, connector enrollment, and leak checks.',
  category: 'provisioning',
  tags: ['onboarding', 'workspace', 'policy', 'connector'],
  workflow: {
    nodes: [
      { name: 'Start', id: 'a1b2c3d4-0001', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [250, 300], parameters: {} },
      { name: 'Create Workspace', id: 'a1b2c3d4-0002', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [500, 300], parameters: { tool: 'create_workspace', params: { display_name: '={{ $json.workspace_name }}', policy_template: '={{ $json.template || "privacy" }}', tags: '={{ $json.tags || [] }}' } } },
      { name: 'Validate Policy', id: 'a1b2c3d4-0003', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [750, 300], parameters: { tool: 'validate_policy', params: { workspace_id: '={{ $json.workspace.id }}' } } },
      { name: 'Enroll Connector', id: 'a1b2c3d4-0004', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [1000, 300], parameters: { tool: 'enroll_connector', params: { type: 'extension', workspace_id: '={{ $json.workspace.id }}' } } },
      { name: 'Check Network', id: 'a1b2c3d4-0005', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [1250, 300], parameters: { tool: 'check_network_leaks', params: { workspace_id: '={{ $json.workspace.id }}' } } },
      { name: 'Has Warnings?', id: 'a1b2c3d4-0006', type: 'n8n-nodes-base.if', typeVersion: 2, position: [1500, 300], parameters: { conditions: { options: { caseSensitive: true, leftValue: '' }, conditions: [{ leftValue: '={{ $json.summary.warnings }}', rightValue: '0', operator: { type: 'number', operation: 'gt' } }] } } },
      { name: 'Notify Team', id: 'a1b2c3d4-0007', type: 'n8n-nodes-base.slack', typeVersion: 2, position: [1750, 200], parameters: { channel: '#privacy-alerts', text: 'Workspace onboarding complete with {{ $json.summary.warnings }} warnings. Review at your earliest convenience.' } },
    ],
    connections: {
      'Start': { main: [[{ node: 'Create Workspace', type: 'main', index: 0 }]] },
      'Create Workspace': { main: [[{ node: 'Validate Policy', type: 'main', index: 0 }]] },
      'Validate Policy': { main: [[{ node: 'Enroll Connector', type: 'main', index: 0 }]] },
      'Enroll Connector': { main: [[{ node: 'Check Network', type: 'main', index: 0 }]] },
      'Check Network': { main: [[{ node: 'Has Warnings?', type: 'main', index: 0 }]] },
      'Has Warnings?': { main: [[{ node: 'Notify Team', type: 'main', index: 0 }], []] },
    },
  },
};

const POLICY_DRIFT_MONITOR: WorkflowTemplate = {
  key: 'policy-drift-monitor',
  name: 'Policy Drift Monitor',
  description: 'Nightly scan of all workspaces to detect policy drift and elevated risk scores.',
  category: 'monitoring',
  tags: ['drift', 'policy', 'monitoring', 'scheduled'],
  workflow: {
    nodes: [
      { name: 'Schedule', id: 'b1b2c3d4-0001', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1, position: [250, 300], parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 2 * * *' }] } } },
      { name: 'List Workspaces', id: 'b1b2c3d4-0002', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [500, 300], parameters: { tool: 'list_workspaces', params: { status: 'active' } } },
      { name: 'Loop Workspaces', id: 'b1b2c3d4-0003', type: 'n8n-nodes-base.splitInBatches', typeVersion: 3, position: [750, 300], parameters: { batchSize: 1 } },
      { name: 'Validate Policy', id: 'b1b2c3d4-0004', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [1000, 300], parameters: { tool: 'validate_policy', params: { workspace_id: '={{ $json.id }}' } } },
      { name: 'Risk Changed?', id: 'b1b2c3d4-0005', type: 'n8n-nodes-base.if', typeVersion: 2, position: [1250, 300], parameters: { conditions: { options: { caseSensitive: true, leftValue: '' }, conditions: [{ leftValue: '={{ $json.riskScore }}', rightValue: '30', operator: { type: 'number', operation: 'gt' } }] } } },
      { name: 'Alert Team', id: 'b1b2c3d4-0006', type: 'n8n-nodes-base.slack', typeVersion: 2, position: [1500, 200], parameters: { channel: '#privacy-alerts', text: 'Policy drift detected: workspace {{ $json.workspace_id }} risk score {{ $json.riskScore }}/100' } },
    ],
    connections: {
      'Schedule': { main: [[{ node: 'List Workspaces', type: 'main', index: 0 }]] },
      'List Workspaces': { main: [[{ node: 'Loop Workspaces', type: 'main', index: 0 }]] },
      'Loop Workspaces': { main: [[{ node: 'Validate Policy', type: 'main', index: 0 }], []] },
      'Validate Policy': { main: [[{ node: 'Risk Changed?', type: 'main', index: 0 }]] },
      'Risk Changed?': { main: [[{ node: 'Alert Team', type: 'main', index: 0 }], [{ node: 'Loop Workspaces', type: 'main', index: 0 }]] },
      'Alert Team': { main: [[{ node: 'Loop Workspaces', type: 'main', index: 0 }]] },
    },
  },
};

const EXCEPTION_APPROVAL: WorkflowTemplate = {
  key: 'exception-approval',
  name: 'Exception Approval',
  description: 'Webhook-driven approval flow for policy exceptions with audit trail.',
  category: 'governance',
  tags: ['approval', 'exception', 'webhook', 'governance'],
  workflow: {
    nodes: [
      { name: 'Webhook', id: 'c1b2c3d4-0001', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [250, 300], parameters: { path: '/privacy/approval', httpMethod: 'POST' } },
      { name: 'Parse Request', id: 'c1b2c3d4-0002', type: 'n8n-nodes-base.set', typeVersion: 3, position: [500, 300], parameters: { assignments: { assignments: [{ name: 'workspace_id', value: '={{ $json.body.workspace_id }}', type: 'string' }, { name: 'template', value: '={{ $json.body.template }}', type: 'string' }, { name: 'approved', value: '={{ $json.body.approved }}', type: 'boolean' }, { name: 'approver', value: '={{ $json.body.approver }}', type: 'string' }] } } },
      { name: 'Is Approved?', id: 'c1b2c3d4-0003', type: 'n8n-nodes-base.if', typeVersion: 2, position: [750, 300], parameters: { conditions: { options: { caseSensitive: true, leftValue: '' }, conditions: [{ leftValue: '={{ $json.approved }}', rightValue: 'true', operator: { type: 'boolean', operation: 'true' } }] } } },
      { name: 'Apply Policy', id: 'c1b2c3d4-0004', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [1000, 200], parameters: { tool: 'apply_policy_template', params: { workspace_id: '={{ $json.workspace_id }}', template: '={{ $json.template }}', mode: 'apply' } } },
      { name: 'Notify Approved', id: 'c1b2c3d4-0005', type: 'n8n-nodes-base.slack', typeVersion: 2, position: [1250, 200], parameters: { channel: '#privacy-approvals', text: 'Policy exception approved by {{ $json.approver }} for workspace {{ $json.workspace_id }}' } },
      { name: 'Notify Denied', id: 'c1b2c3d4-0006', type: 'n8n-nodes-base.slack', typeVersion: 2, position: [1000, 400], parameters: { channel: '#privacy-approvals', text: 'Policy exception denied for workspace {{ $json.workspace_id }}' } },
    ],
    connections: {
      'Webhook': { main: [[{ node: 'Parse Request', type: 'main', index: 0 }]] },
      'Parse Request': { main: [[{ node: 'Is Approved?', type: 'main', index: 0 }]] },
      'Is Approved?': { main: [[{ node: 'Apply Policy', type: 'main', index: 0 }], [{ node: 'Notify Denied', type: 'main', index: 0 }]] },
      'Apply Policy': { main: [[{ node: 'Notify Approved', type: 'main', index: 0 }]] },
    },
  },
};

const NETWORK_HYGIENE: WorkflowTemplate = {
  key: 'network-hygiene',
  name: 'Network Hygiene',
  description: 'Hourly network leak scans across all active workspaces with alerting.',
  category: 'monitoring',
  tags: ['network', 'leaks', 'hygiene', 'scheduled'],
  workflow: {
    nodes: [
      { name: 'Schedule', id: 'd1b2c3d4-0001', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1, position: [250, 300], parameters: { rule: { interval: [{ field: 'hours', value: 1 }] } } },
      { name: 'List Workspaces', id: 'd1b2c3d4-0002', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [500, 300], parameters: { tool: 'list_workspaces', params: { status: 'active' } } },
      { name: 'Loop', id: 'd1b2c3d4-0003', type: 'n8n-nodes-base.splitInBatches', typeVersion: 3, position: [750, 300], parameters: { batchSize: 1 } },
      { name: 'Check Leaks', id: 'd1b2c3d4-0004', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [1000, 300], parameters: { tool: 'check_network_leaks', params: { workspace_id: '={{ $json.id }}', checks: ['all'] } } },
      { name: 'Has Issues?', id: 'd1b2c3d4-0005', type: 'n8n-nodes-base.if', typeVersion: 2, position: [1250, 300], parameters: { conditions: { options: { caseSensitive: true, leftValue: '' }, conditions: [{ leftValue: '={{ $json.summary.warnings }}', rightValue: '0', operator: { type: 'number', operation: 'gt' } }] } } },
      { name: 'Report Issues', id: 'd1b2c3d4-0006', type: 'n8n-nodes-base.slack', typeVersion: 2, position: [1500, 200], parameters: { channel: '#privacy-alerts', text: 'Network hygiene: {{ $json.summary.warnings }} issue(s) detected for workspace {{ $json.workspaceId }}' } },
    ],
    connections: {
      'Schedule': { main: [[{ node: 'List Workspaces', type: 'main', index: 0 }]] },
      'List Workspaces': { main: [[{ node: 'Loop', type: 'main', index: 0 }]] },
      'Loop': { main: [[{ node: 'Check Leaks', type: 'main', index: 0 }], []] },
      'Check Leaks': { main: [[{ node: 'Has Issues?', type: 'main', index: 0 }]] },
      'Has Issues?': { main: [[{ node: 'Report Issues', type: 'main', index: 0 }], [{ node: 'Loop', type: 'main', index: 0 }]] },
      'Report Issues': { main: [[{ node: 'Loop', type: 'main', index: 0 }]] },
    },
  },
};

const INCIDENT_LOCKDOWN: WorkflowTemplate = {
  key: 'incident-lockdown',
  name: 'Incident Lockdown',
  description: 'Emergency policy escalation: applies hardened template, validates, and alerts.',
  category: 'incident-response',
  tags: ['incident', 'lockdown', 'hardened', 'emergency'],
  workflow: {
    nodes: [
      { name: 'Incident Trigger', id: 'e1b2c3d4-0001', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [250, 300], parameters: { path: '/privacy/lockdown', httpMethod: 'POST' } },
      { name: 'Apply Hardened', id: 'e1b2c3d4-0002', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [500, 300], parameters: { tool: 'apply_policy_template', params: { workspace_id: '={{ $json.body.workspace_id }}', template: 'hardened', mode: 'apply' } } },
      { name: 'Validate', id: 'e1b2c3d4-0003', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [750, 300], parameters: { tool: 'validate_policy', params: { workspace_id: '={{ $json.body.workspace_id }}' } } },
      { name: 'Check Network', id: 'e1b2c3d4-0004', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [1000, 300], parameters: { tool: 'check_network_leaks', params: { workspace_id: '={{ $json.body.workspace_id }}' } } },
      { name: 'Lockdown Alert', id: 'e1b2c3d4-0005', type: 'n8n-nodes-base.slack', typeVersion: 2, position: [1250, 300], parameters: { channel: '#privacy-incidents', text: 'LOCKDOWN ACTIVATED for workspace {{ $json.body.workspace_id }}. Hardened policy applied. Risk score: {{ $json.riskScore }}/100' } },
    ],
    connections: {
      'Incident Trigger': { main: [[{ node: 'Apply Hardened', type: 'main', index: 0 }]] },
      'Apply Hardened': { main: [[{ node: 'Validate', type: 'main', index: 0 }]] },
      'Validate': { main: [[{ node: 'Check Network', type: 'main', index: 0 }]] },
      'Check Network': { main: [[{ node: 'Lockdown Alert', type: 'main', index: 0 }]] },
    },
  },
};

const BACKUP_EXPORT: WorkflowTemplate = {
  key: 'backup-export',
  name: 'Backup & Export Governance',
  description: 'Weekly export of all workspace configurations and policies for backup governance.',
  category: 'governance',
  tags: ['backup', 'export', 'governance', 'scheduled'],
  workflow: {
    nodes: [
      { name: 'Schedule', id: 'f1b2c3d4-0001', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1, position: [250, 300], parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 3 * * 0' }] } } },
      { name: 'List Workspaces', id: 'f1b2c3d4-0002', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [500, 300], parameters: { tool: 'list_workspaces', params: { status: 'all' } } },
      { name: 'Loop', id: 'f1b2c3d4-0003', type: 'n8n-nodes-base.splitInBatches', typeVersion: 3, position: [750, 300], parameters: { batchSize: 1 } },
      { name: 'Get Details', id: 'f1b2c3d4-0004', type: 'n8n-nodes-base.mcpClientTool', typeVersion: 1, position: [1000, 300], parameters: { tool: 'get_workspace', params: { workspace_id: '={{ $json.id }}', include_policy_details: true, include_audit: true } } },
      { name: 'Build Export', id: 'f1b2c3d4-0005', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1250, 300], parameters: { jsCode: 'const data = $input.all();\nconst exportBlob = {\n  exportedAt: new Date().toISOString(),\n  workspaces: data.map(d => d.json),\n  version: "1.0"\n};\nreturn [{ json: exportBlob }];' } },
      { name: 'Save Backup', id: 'f1b2c3d4-0006', type: 'n8n-nodes-base.writeBinaryFile', typeVersion: 1, position: [1500, 300], parameters: { fileName: '=/backups/privacy-export-{{ $now.format("yyyy-MM-dd") }}.json', dataPropertyName: 'data' } },
      { name: 'Notify', id: 'f1b2c3d4-0007', type: 'n8n-nodes-base.slack', typeVersion: 2, position: [1750, 300], parameters: { channel: '#privacy-ops', text: 'Weekly privacy backup completed. {{ $json.workspaces.length }} workspaces exported.' } },
    ],
    connections: {
      'Schedule': { main: [[{ node: 'List Workspaces', type: 'main', index: 0 }]] },
      'List Workspaces': { main: [[{ node: 'Loop', type: 'main', index: 0 }]] },
      'Loop': { main: [[{ node: 'Get Details', type: 'main', index: 0 }], [{ node: 'Build Export', type: 'main', index: 0 }]] },
      'Get Details': { main: [[{ node: 'Loop', type: 'main', index: 0 }]] },
      'Build Export': { main: [[{ node: 'Save Backup', type: 'main', index: 0 }]] },
      'Save Backup': { main: [[{ node: 'Notify', type: 'main', index: 0 }]] },
    },
  },
};

export const PRIVACY_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  WORKSPACE_ONBOARDING,
  POLICY_DRIFT_MONITOR,
  EXCEPTION_APPROVAL,
  NETWORK_HYGIENE,
  INCIDENT_LOCKDOWN,
  BACKUP_EXPORT,
];

/** Get a workflow template by key */
export function getWorkflowTemplate(key: string): WorkflowTemplate | undefined {
  return PRIVACY_WORKFLOW_TEMPLATES.find(t => t.key === key);
}

/** Get all template keys */
export function getWorkflowTemplateKeys(): string[] {
  return PRIVACY_WORKFLOW_TEMPLATES.map(t => t.key);
}
