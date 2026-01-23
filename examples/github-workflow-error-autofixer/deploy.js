#!/usr/bin/env node

/**
 * Deployment script for GitHub Workflow Error Auto-Fixer
 * 
 * This script uses n8n-mcp tools to create the workflow in your n8n instance.
 * 
 * Prerequisites:
 * - n8n-mcp configured and running
 * - n8n instance accessible
 * - Valid credentials configured
 * 
 * Usage:
 *   node deploy.js [--update]
 * 
 * Options:
 *   --update    Update existing workflow instead of creating new
 */

const fs = require('fs');
const path = require('path');

// Load workflow JSON
const workflowPath = path.join(__dirname, 'workflow.json');
const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('🚀 GitHub Workflow Error Auto-Fixer Deployment\n');

// Check if update mode
const updateMode = process.argv.includes('--update');

console.log('📋 Deployment Configuration:');
console.log(`   Mode: ${updateMode ? 'Update' : 'Create'}`);
console.log(`   Workflow Name: ${workflowData.name}`);
console.log(`   Nodes: ${workflowData.nodes.length}`);
console.log(`   Tags: ${workflowData.tags.map(t => t.name).join(', ')}`);
console.log('');

// Instructions for using n8n-mcp tools
console.log('📝 Deployment Steps:\n');

if (updateMode) {
  console.log('To UPDATE an existing workflow:');
  console.log('');
  console.log('1. Find your workflow ID:');
  console.log('   n8n_list_workflows()');
  console.log('');
  console.log('2. Update the workflow:');
  console.log('   n8n_update_full_workflow({');
  console.log('     workflowId: "YOUR_WORKFLOW_ID",');
  console.log('     workflow: <paste-workflow.json-content>');
  console.log('   })');
} else {
  console.log('To CREATE a new workflow:');
  console.log('');
  console.log('1. Use n8n-mcp tool:');
  console.log('   n8n_create_workflow({');
  console.log('     name: "GitHub Workflow Error Auto-Fixer",');
  console.log('     workflow: <paste-workflow.json-content>');
  console.log('   })');
  console.log('');
  console.log('2. Or use the n8n UI:');
  console.log('   - Open your n8n instance');
  console.log('   - Click "Add Workflow"');
  console.log('   - Click "Import from File"');
  console.log('   - Select workflow.json');
}

console.log('\n⚙️  Post-Deployment Configuration:\n');

console.log('1. Configure Credentials:');
console.log('   ✓ Airtop API (HTTP Header Auth)');
console.log('   ✓ Claude/OpenAI API');
console.log('   ✓ Slack API');
console.log('');

console.log('2. Update Node References:');
console.log('   ✓ AI Agent → Select your LLM credential');
console.log('   ✓ Slack → Select your Slack credential');
console.log('   ✓ Airtop nodes → Select Airtop credential');
console.log('');

console.log('3. Customize Settings:');
console.log('   ✓ Update Slack channel name');
console.log('   ✓ Adjust AI agent prompts if needed');
console.log('   ✓ Configure webhook path (optional)');
console.log('');

console.log('4. Activate Workflow:');
console.log('   ✓ Click "Active" toggle');
console.log('   ✓ Note the webhook URL');
console.log('');

console.log('5. Configure GitHub Webhook:');
console.log('   ✓ Go to GitHub repository settings');
console.log('   ✓ Add webhook with your n8n URL');
console.log('   ✓ Select "Workflow runs" event');
console.log('');

console.log('🧪 Testing:\n');

console.log('Test the webhook with curl:');
console.log('');
console.log('curl -X POST https://your-n8n.com/webhook/github-workflow-error \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"repository":{"full_name":"test/repo"},"workflow_run":{"name":"CI","conclusion":"failure"}}\'');
console.log('');

console.log('📚 Documentation:\n');
console.log('   README.md - Complete setup guide');
console.log('   CONFIGURATION.md - Detailed configuration');
console.log('   EXAMPLES.md - Usage examples');
console.log('');

console.log('✅ Ready to deploy! Follow the steps above.\n');

// Export workflow JSON for easy copy-paste
console.log('📋 Workflow JSON (for copy-paste):\n');
console.log(JSON.stringify(workflowData, null, 2));
console.log('\n');

console.log('---');
console.log('Conceived by Romuald Członkowski - https://www.aiadvisors.pl/en');
