# Configuration Guide

Детайлни конфигурационни инструкции за GitHub Workflow Error Auto-Fixer.

## 🔐 Credentials Configuration

### 1. Airtop API Credential

**Създаване на Airtop Account:**

1. Посетете [airtop.ai](https://airtop.ai)
2. Sign up за account
3. Navigate to API Keys section
4. Generate new API key

**n8n Configuration:**

1. В n8n, отидете на **Credentials → New**
2. Изберете **HTTP Header Auth**
3. Попълнете:
   ```
   Name: Airtop API
   Header Name: Authorization
   Header Value: Bearer YOUR_AIRTOP_API_KEY
   ```
4. Тествайте connection
5. Save

**Environment Variable (Alternative):**

```bash
export AIRTOP_API_KEY="your-api-key-here"
```

### 2. Anthropic (Claude) Credential

**Получаване на API Key:**

1. Посетете [console.anthropic.com](https://console.anthropic.com)
2. Create account или sign in
3. Navigate to API Keys
4. Create new key

**n8n Configuration:**

1. В n8n, отидете на **Credentials → New**
2. Изберете **Anthropic**
3. Попълнете:
   ```
   Name: Claude API
   API Key: YOUR_ANTHROPIC_API_KEY
   ```
4. Save

**Recommended Models:**

- `claude-opus-4.5` - Най-мощен model (препоръчан)
- `claude-sonnet-3.5` - Балансиран speed/quality
- `claude-haiku-3.5` - Най-бърз и евтин

### 3. OpenAI Credential (Alternative)

**Получаване на API Key:**

1. Посетете [platform.openai.com](https://platform.openai.com)
2. Create account или sign in
3. Navigate to API Keys
4. Create new key

**n8n Configuration:**

1. В n8n, отидете на **Credentials → New**
2. Изберете **OpenAI**
3. Попълнете:
   ```
   Name: OpenAI API
   API Key: YOUR_OPENAI_API_KEY
   Organization ID: (optional)
   ```
4. Save

**Recommended Models:**

- `gpt-4-turbo` - Latest GPT-4 (препоръчан)
- `gpt-4` - Standard GPT-4
- `gpt-3.5-turbo` - По-евтин вариант

### 4. Slack API Credential

**Създаване на Slack App:**

1. Посетете [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App**
3. Choose **From scratch**
4. Name: "GitHub Error Bot"
5. Select workspace

**Configure Bot Permissions:**

Navigate to **OAuth & Permissions** и добавете:

```
Bot Token Scopes:
- chat:write        (Send messages)
- chat:write.public (Send to channels without joining)
- channels:read     (View channels)
- users:read        (View user info)
```

**Install App:**

1. Click **Install to Workspace**
2. Authorize app
3. Copy **Bot User OAuth Token** (starts with `xoxb-`)

**n8n Configuration:**

1. В n8n, отидете на **Credentials → New**
2. Изберете **Slack API**
3. Попълнете:
   ```
   Name: Slack Bot
   Access Token: YOUR_BOT_TOKEN (xoxb-...)
   ```
4. Save

**Add Bot to Channel:**

```
/invite @GitHub Error Bot
```

### 5. GitHub Webhook Secret (Optional)

За допълнителна security:

**Generate Secret:**

```bash
openssl rand -hex 32
```

**Configure in GitHub:**

1. Repository → Settings → Webhooks
2. Edit webhook
3. Secret: Paste generated secret

**Configure in n8n:**

1. Edit **GitHub Webhook** node
2. Activate **Webhook Security**
3. Select **Header Auth**
4. Header: `X-Hub-Signature-256`
5. Value: Use GitHub secret

## 🔧 Advanced Configuration

### AI Agent Configuration

**Model Settings:**

```json
{
  "model": "claude-opus-4.5",
  "temperature": 0.2,
  "maxTokens": 4096,
  "topP": 1.0
}
```

**Agent Options:**

```json
{
  "maxIterations": 10,
  "returnIntermediateSteps": true,
  "verbose": true
}
```

**Memory Configuration:**

```json
{
  "type": "windowBuffer",
  "k": 5  // Number of previous interactions to remember
}
```

### Airtop Browser Configuration

**Session Configuration:**

```json
{
  "configuration": {
    "timeoutMinutes": 30,
    "persistProfile": false,
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "timezone": "Europe/Sofia",
    "locale": "en-US"
  }
}
```

**Proxy Configuration (Optional):**

```json
{
  "configuration": {
    "proxyConfiguration": {
      "server": "http://proxy.example.com:8080",
      "username": "user",
      "password": "pass"
    }
  }
}
```

### Webhook Configuration

**Custom Path:**

Change webhook path in **GitHub Webhook** node:

```json
{
  "path": "custom/webhook/path",
  "httpMethod": "POST"
}
```

**Response Options:**

```json
{
  "options": {
    "responseMode": "lastNode",
    "responseData": "allEntries"
  }
}
```

### Slack Configuration

**Custom Channel:**

```json
{
  "channel": "#your-custom-channel",
  "username": "GitHub Error Bot",
  "icon_emoji": ":robot_face:"
}
```

**Message Attachments:**

```json
{
  "attachments": [
    {
      "color": "#FF0000",
      "title": "Error Details",
      "text": "{{ $json.errorDetails }}"
    }
  ]
}
```

## 🌍 Environment Variables

**n8n Instance:**

```bash
# Required
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://your-n8n-instance.com/

# Optional
N8N_ENCRYPTION_KEY=your-encryption-key
N8N_USER_MANAGEMENT_JWT_SECRET=your-jwt-secret

# Timezone
GENERIC_TIMEZONE=Europe/Sofia
TZ=Europe/Sofia
```

**Workflow-Specific:**

```bash
# Airtop
AIRTOP_API_KEY=your-airtop-key
AIRTOP_SESSION_TIMEOUT=1800000  # 30 min in ms

# AI Models
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Slack
SLACK_BOT_TOKEN=xoxb-your-token

# GitHub
GITHUB_WEBHOOK_SECRET=your-secret
```

## 📋 Workflow Settings

**Execution Settings:**

```json
{
  "executionOrder": "v1",
  "saveExecutionProgress": true,
  "saveManualExecutions": true,
  "timezone": "Europe/Sofia"
}
```

**Error Workflow:**

Create error handling workflow:

```json
{
  "settings": {
    "errorWorkflow": "error-handler-workflow-id"
  }
}
```

## 🔄 GitHub Webhook Configuration

**Repository Settings:**

```
Settings → Webhooks → Add webhook

Payload URL: https://your-n8n.com/webhook/github-workflow-error
Content type: application/json
Secret: (optional but recommended)
SSL verification: Enable SSL verification

Which events would you like to trigger this webhook?
☑ Workflow runs
```

**Webhook Events:**

The workflow listens for these GitHub events:

- `workflow_run` - When workflow completes
- `check_run` - Alternative event type

**Webhook Payload Example:**

```json
{
  "action": "completed",
  "workflow_run": {
    "id": 12345,
    "name": "CI",
    "status": "completed",
    "conclusion": "failure",
    "html_url": "https://github.com/user/repo/actions/runs/12345",
    "head_branch": "main",
    "head_sha": "abc123def456"
  },
  "repository": {
    "full_name": "user/repo",
    "html_url": "https://github.com/user/repo"
  },
  "sender": {
    "login": "username"
  }
}
```

## 🧪 Testing Configuration

**Local Testing:**

```bash
# Start n8n in development mode
n8n start --tunnel

# Get webhook URL
echo "Webhook URL: https://<random>.tunnel.n8n.cloud/webhook/github-workflow-error"
```

**Simulate GitHub Webhook:**

```bash
curl -X POST https://your-n8n.com/webhook/github-workflow-error \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: workflow_run" \
  -d @test-payload.json
```

**Test Payload (test-payload.json):**

```json
{
  "action": "completed",
  "workflow_run": {
    "id": 99999,
    "name": "Test Workflow",
    "conclusion": "failure",
    "html_url": "https://github.com/test/repo/actions/runs/99999",
    "head_branch": "test-branch",
    "head_sha": "test123"
  },
  "repository": {
    "full_name": "test/repo"
  },
  "sender": {
    "login": "testuser"
  }
}
```

## 🐛 Debugging

**Enable Verbose Logging:**

In **AI Agent** node:

```json
{
  "options": {
    "verbose": true
  }
}
```

**Check Execution Logs:**

1. n8n → Executions
2. Click on failed execution
3. Review node outputs
4. Check error messages

**Airtop Debugging:**

Enable screenshot after each action:

```javascript
// Add to each Airtop tool
const screenshot = await this.helpers.httpRequest({
  method: 'POST',
  url: `https://api.airtop.ai/v1/sessions/${sessionId}/windows/${windowId}/screenshot`
});
console.log('Screenshot:', screenshot.data.dataUrl);
```

## 📊 Monitoring

**Track Metrics:**

- Webhook success rate
- AI agent execution time
- Airtop session duration
- Fix success rate

**Set Up Alerts:**

Create monitoring workflow that triggers on:
- Repeated failures
- Long execution times
- API quota warnings

---

**Conceived by Romuald Członkowski** - [AI Advisors](https://www.aiadvisors.pl/en)
