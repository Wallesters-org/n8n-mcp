# GitHub Workflow Error Auto-Fixer

Автоматичен n8n workflow за анализ и оправяне на грешки от GitHub Actions използвайки AI агенти с Airtop browser capabilities.

## 🎯 Общ Преглед

Този workflow автоматично:
1. Получава GitHub webhook нотификация при workflow failure
2. Анализира error logs с AI агент
3. Използва Airtop browser за навигация и debugging
4. Опитва се да оправи проблема автоматично
5. Изпраща детайлно резюме в Slack

## 📐 Архитектура

```
GitHub Webhook (Trigger)
        ↓
Parse Error Details (Code Node)
        ↓
Airtop - Create Browser Session (HTTP Request)
        ↓
AI Agent Node (Claude/OpenAI LLM)
    ├── Tool: Navigate Browser
    ├── Tool: Extract Page Content  
    ├── Tool: Click Element
    ├── Tool: Type Text
    └── Tool: Screenshot
        ↓
Airtop - Close Session (HTTP Request)
        ↓
Slack - Send Summary
```

## 🚀 Setup Instructions

### 1. Prerequisites

Необходими API credentials:
- **Airtop API Key** - [airtop.ai](https://airtop.ai)
- **Anthropic/OpenAI API Key** - за AI agent
- **Slack API Token** - за notifications
- **GitHub Webhook Secret** (optional) - за security

### 2. Install n8n-mcp

Уверете се, че имате достъп до n8n-mcp tools:

```bash
# Install via npm
npm install -g n8n-mcp

# Or use npx
npx n8n-mcp
```

### 3. Create Workflow in n8n

#### Option A: Using n8n MCP Tools (Recommended)

Ако имате n8n-mcp конфигуриран с вашия n8n instance:

```javascript
// Use MCP tool to create workflow
n8n_create_workflow({
  name: "GitHub Workflow Error Auto-Fixer",
  workflow: <content-of-workflow.json>
})
```

#### Option B: Manual Import

1. Отворете вашия n8n instance
2. Натиснете **+ Add Workflow**
3. Импортирайте `workflow.json` файла
4. Конфигурирайте credentials (виж секция 4)

### 4. Configure Credentials

#### Airtop API Credentials

Създайте **HTTP Header Auth** credential:
- **Name:** Airtop API
- **Header Name:** `Authorization`
- **Header Value:** `Bearer YOUR_AIRTOP_API_KEY`

#### AI Agent (Claude/OpenAI)

Изберете един от следните:

**Claude (Anthropic):**
- **Credential Type:** Anthropic
- **API Key:** Your Anthropic API key
- **Model:** claude-opus-4.5 или claude-sonnet-3.5

**OpenAI:**
- **Credential Type:** OpenAI
- **API Key:** Your OpenAI API key
- **Model:** gpt-4 или gpt-4-turbo

#### Slack API

Създайте **Slack API** credential:
- **Access Token:** Your Slack Bot Token (starts with `xoxb-`)
- **Permissions:** `chat:write`, `channels:read`

### 5. Configure GitHub Webhook

#### В GitHub Repository:

1. Отидете на **Settings → Webhooks → Add webhook**
2. **Payload URL:** `https://your-n8n-instance.com/webhook/github-workflow-error`
3. **Content type:** `application/json`
4. **Events:** Select "Workflow runs"
5. **Active:** ✓

#### Test Webhook:

```bash
curl -X POST https://your-n8n-instance.com/webhook/github-workflow-error \
  -H "Content-Type: application/json" \
  -d '{
    "repository": {
      "full_name": "user/repo"
    },
    "workflow_run": {
      "name": "CI",
      "id": 12345,
      "conclusion": "failure",
      "html_url": "https://github.com/user/repo/actions/runs/12345",
      "head_branch": "main",
      "head_sha": "abc123"
    },
    "sender": {
      "login": "testuser"
    }
  }'
```

## 🔧 Customization

### AI Agent System Prompt

Може да персонализирате system prompt-а на AI агента в **AI Agent - Error Analyzer** node:

```
Ти си AI агент специализиран в анализ и оправяне на GitHub Actions workflow грешки. 
Имаш достъп до Airtop browser за навигация и взаимодействие с GitHub. 
Винаги следвай структуриран подход: анализ → план → изпълнение → верификация → отчет.
```

### Airtop Browser Configuration

Можете да конфигурирате browser session в **Airtop - Create Browser Session** node:

```json
{
  "configuration": {
    "timeoutMinutes": 30,        // Session timeout
    "persistProfile": false,     // Browser profile persistence
    "proxyConfiguration": null   // Optional proxy settings
  }
}
```

### Slack Message Format

Персонализирайте Slack notification template в **Slack - Send Summary** node.

## 📊 Node Details

### 1. GitHub Webhook
- **Type:** `n8n-nodes-base.webhook`
- **Method:** POST
- **Path:** `github-workflow-error`

### 2. Parse Error Details
- **Type:** `n8n-nodes-base.code`
- **Purpose:** Извлича key information от GitHub payload
- **Output:** Structured error object

### 3. Airtop - Create Browser Session
- **Type:** `n8n-nodes-base.httpRequest`
- **API:** `POST https://api.airtop.ai/v1/sessions`
- **Purpose:** Стартира browser session за AI agent

### 4. AI Agent - Error Analyzer
- **Type:** `@n8n/n8n-nodes-langchain.agent`
- **LLM:** Claude Opus 4.5 or OpenAI GPT-4
- **Tools:** 5 Airtop browser tools (navigate, extract, click, type, screenshot)
- **Memory:** Window Buffer Memory для conversation context

### 5. Airtop Tools

#### Tool: Airtop Navigate
```javascript
// Навигира browser към URL
POST /v1/sessions/{sessionId}/windows
{
  "url": "https://github.com/..."
}
```

#### Tool: Airtop Extract Content
```javascript
// Извлича content от страницата
POST /v1/sessions/{sessionId}/windows/{windowId}/page-query
{
  "prompt": "Extract all error messages and logs",
  "configuration": {
    "outputSchema": { /* ... */ }
  }
}
```

#### Tool: Airtop Click
```javascript
// Clicks на element
POST /v1/sessions/{sessionId}/windows/{windowId}/click
{
  "elementDescription": "Edit button"
}
```

#### Tool: Airtop Type
```javascript
// Въвежда текст
POST /v1/sessions/{sessionId}/windows/{windowId}/type
{
  "text": "console.log('fixed')",
  "elementDescription": "code editor"
}
```

#### Tool: Airtop Screenshot
```javascript
// Прави screenshot
POST /v1/sessions/{sessionId}/windows/{windowId}/screenshot
```

### 6. Airtop - Close Session
- **Type:** `n8n-nodes-base.httpRequest`
- **API:** `DELETE https://api.airtop.ai/v1/sessions/{sessionId}`
- **Purpose:** Затваря browser session

### 7. Slack - Send Summary
- **Type:** `n8n-nodes-base.slack`
- **Channel:** `#devops-alerts`
- **Format:** Structured report with emojis

## 🎬 Example Usage

### Scenario: CI Test Failure

1. **GitHub Actions fails** - test suite has errors
2. **Webhook triggered** - n8n receives notification
3. **AI Agent analyzes** error logs using browser
4. **Agent identifies** missing dependency in package.json
5. **Agent navigates** to repo, edits package.json
6. **Agent commits** fix and triggers re-run
7. **Slack notification** sent with summary

### Expected Slack Message

```
🤖 GitHub Workflow Error - Auto-Fix Report

📦 Repository: myorg/myapp
⚙️ Workflow: CI Tests
🔀 Branch: main

---

🔍 AI Agent Analysis & Fix Summary:
Problem: Missing dependency 'axios' in package.json causing import errors
Fix Applied: Added "axios": "^1.6.0" to dependencies
Status: ✅ Fix committed, workflow re-triggered
Verification: Tests now passing

---

🔗 Links:
• View Workflow Run

🕐 Processed at: 2024-01-23T19:30:00.000Z
```

## ⚠️ Important Notes

### Safety Considerations

1. **Test First:** Always test in a development/staging environment
2. **Review Changes:** AI-generated fixes should be reviewed before production deployment
3. **Rate Limits:** Be aware of GitHub API rate limits
4. **Permissions:** Ensure AI agent has appropriate repository permissions

### Error Handling

Workflow включва error handling за:
- Network failures
- API rate limits
- Browser session timeouts
- Authentication errors

### Resource Management

- Browser sessions автоматично се затварят (даже при error)
- Session timeout: 30 minutes (configurable)
- Maximum iterations: 10 (configurable in AI agent)

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Airtop API Documentation](https://docs.airtop.ai/)
- [GitHub Webhooks Guide](https://docs.github.com/webhooks)
- [n8n-mcp GitHub Repository](https://github.com/czlonkowski/n8n-mcp)

## 🐛 Troubleshooting

### Webhook Not Triggering

1. Check GitHub webhook delivery status
2. Verify n8n webhook URL is accessible
3. Check webhook secret configuration

### AI Agent Not Working

1. Verify API credentials are valid
2. Check AI model availability
3. Review agent logs for errors

### Airtop Browser Issues

1. Verify Airtop API key
2. Check session timeout settings
3. Review browser console logs

### Slack Notification Failed

1. Verify Slack bot permissions
2. Check channel name is correct
3. Ensure bot is added to channel

## 📄 License

MIT License - see repository LICENSE file

## 👥 Contributing

Contributions are welcome! Please see the main repository for contribution guidelines.

---

**Conceived by Romuald Członkowski** - [AI Advisors](https://www.aiadvisors.pl/en)
