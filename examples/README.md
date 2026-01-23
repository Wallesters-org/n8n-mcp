# n8n Workflow Examples

This directory contains example n8n workflows demonstrating various use cases and integrations.

## 📚 Available Examples

### 1. GitHub Workflow Error Auto-Fixer

**Location:** `github-workflow-error-autofixer/`

Автоматичен workflow за анализ и оправяне на грешки от GitHub Actions използвайки AI агенти с Airtop browser capabilities.

**Features:**
- 🤖 AI-powered error analysis
- 🌐 Browser automation via Airtop
- 🔧 Automatic fix attempts
- 📢 Slack notifications
- 🔄 GitHub webhook integration

**Tech Stack:**
- n8n workflow automation
- Claude/OpenAI AI agents
- Airtop browser API
- GitHub Actions webhooks
- Slack API

**Quick Start:**
```bash
cd github-workflow-error-autofixer
cat QUICKSTART.md
```

**Documentation:**
- [README.md](github-workflow-error-autofixer/README.md) - Complete guide
- [QUICKSTART.md](github-workflow-error-autofixer/QUICKSTART.md) - 5-minute setup
- [CONFIGURATION.md](github-workflow-error-autofixer/CONFIGURATION.md) - Advanced config
- [EXAMPLES.md](github-workflow-error-autofixer/EXAMPLES.md) - Real-world use cases

---

## 🚀 Getting Started

### Prerequisites

1. **n8n instance** - Running and accessible
2. **n8n-mcp** - Installed and configured (optional but recommended)
3. **API credentials** - For third-party services used in examples

### Installation Methods

#### Method 1: Using n8n UI

1. Open your n8n instance
2. Click "Add Workflow"
3. Click "Import from File"
4. Select workflow JSON file
5. Configure credentials
6. Activate workflow

#### Method 2: Using n8n-mcp

```javascript
// In Claude Desktop or MCP client with n8n-mcp configured
n8n_create_workflow({
  name: "Workflow Name",
  workflow: <workflow-json-content>
})
```

#### Method 3: Using n8n API

```bash
curl -X POST https://your-n8n.com/api/v1/workflows \
  -H "X-N8N-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

---

## 📖 Example Structure

Each example directory contains:

- **workflow.json** - n8n workflow definition
- **README.md** - Complete documentation
- **CONFIGURATION.md** - Setup and configuration guide
- **EXAMPLES.md** - Usage examples and scenarios
- **deploy.js** - Deployment helper script (if applicable)

---

## 🛠️ Creating Your Own Example

Want to contribute an example?

1. Create a new directory: `examples/your-example-name/`
2. Add your workflow JSON: `workflow.json`
3. Document it:
   - `README.md` - Overview and architecture
   - `CONFIGURATION.md` - Setup instructions
   - `EXAMPLES.md` - Use cases and scenarios
4. Test thoroughly
5. Submit a pull request

### Example Template

```
examples/
└── your-example-name/
    ├── workflow.json          # n8n workflow
    ├── README.md              # Main documentation
    ├── CONFIGURATION.md       # Setup guide
    ├── EXAMPLES.md            # Usage examples
    └── deploy.js              # Deployment script (optional)
```

---

## 🔧 Common Patterns

### Webhook Triggers

Most examples use webhooks for external integration:

```json
{
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2,
  "parameters": {
    "httpMethod": "POST",
    "path": "your-webhook-path"
  }
}
```

### AI Agent Integration

Examples using AI agents typically include:

```json
{
  "name": "AI Agent",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "typeVersion": 1.7,
  "parameters": {
    "agent": "conversationalAgent",
    "systemMessage": "Your system prompt here"
  }
}
```

### External API Calls

HTTP Request nodes for API integration:

```json
{
  "name": "API Call",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "parameters": {
    "method": "POST",
    "url": "https://api.example.com/endpoint"
  }
}
```

---

## 🧪 Testing Examples

Before deploying to production:

1. **Test in development** environment
2. **Use test data** for initial runs
3. **Verify credentials** are configured correctly
4. **Check execution logs** for errors
5. **Monitor resource usage**

---

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n-mcp Repository](https://github.com/czlonkowski/n8n-mcp)
- [n8n Community](https://community.n8n.io/)
- [Workflow Templates](https://n8n.io/workflows/)

---

## 🤝 Contributing

We welcome contributions! If you have a useful workflow example:

1. Fork the repository
2. Create your example following the structure above
3. Test thoroughly
4. Submit a pull request

### Contribution Guidelines

- **Document thoroughly** - Include setup, usage, and troubleshooting
- **Test completely** - Verify all nodes work correctly
- **Use clear naming** - Node and variable names should be descriptive
- **Include credentials template** - Document required API keys
- **Add error handling** - Handle common failure scenarios

---

## 📄 License

All examples are provided under MIT License. See repository LICENSE file.

---

**Conceived by Romuald Członkowski** - [AI Advisors](https://www.aiadvisors.pl/en)
