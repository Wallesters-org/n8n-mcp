# Quick Start Guide

Бързо ръководство за инсталиране и стартиране на GitHub Workflow Error Auto-Fixer за 5 минути.

## ⏱️ 5-Minute Setup

### Step 1: Get API Keys (2 min)

```bash
# 1. Airtop API Key
# Sign up at: https://airtop.ai
# Copy API key from dashboard

# 2. Claude API Key (or OpenAI)
# Sign up at: https://console.anthropic.com
# Create new API key

# 3. Slack Bot Token
# Create app at: https://api.slack.com/apps
# Add bot scope: chat:write
# Install to workspace
# Copy Bot User OAuth Token
```

### Step 2: Import Workflow (1 min)

**Option A - Using n8n UI:**

1. Open your n8n instance
2. Click **"Add Workflow"**
3. Click **"Import from File"**
4. Select `workflow.json`
5. Done!

**Option B - Using n8n-mcp:**

```javascript
// In Claude Desktop or MCP client
n8n_create_workflow({
  name: "GitHub Workflow Error Auto-Fixer",
  workflow: <paste workflow.json content>
})
```

### Step 3: Configure Credentials (1 min)

**Airtop:**
```
Type: HTTP Header Auth
Name: Airtop API
Header: Authorization
Value: Bearer YOUR_AIRTOP_KEY
```

**Claude/OpenAI:**
```
Type: Anthropic (or OpenAI)
Name: Claude API
API Key: YOUR_ANTHROPIC_KEY
```

**Slack:**
```
Type: Slack API
Name: Slack Bot
Token: xoxb-YOUR-TOKEN
```

### Step 4: Setup GitHub Webhook (1 min)

1. Go to your GitHub repository
2. **Settings → Webhooks → Add webhook**
3. Fill in:
   ```
   Payload URL: https://your-n8n.com/webhook/github-workflow-error
   Content type: application/json
   Events: Workflow runs
   Active: ✓
   ```
4. Click **Add webhook**

### Step 5: Test! (30 sec)

```bash
# Send test webhook
curl -X POST https://your-n8n.com/webhook/github-workflow-error \
  -H "Content-Type: application/json" \
  -d '{
    "repository": {"full_name": "test/repo"},
    "workflow_run": {
      "name": "CI",
      "conclusion": "failure",
      "html_url": "https://github.com/test/repo/actions/runs/123"
    }
  }'
```

Check Slack for notification! 🎉

## 🎯 What to Expect

After setup, your workflow will:

1. ✅ Receive GitHub webhook when workflow fails
2. ✅ Parse error details automatically
3. ✅ Launch Airtop browser session
4. ✅ AI agent analyzes the error
5. ✅ Attempts to fix the issue
6. ✅ Sends summary to Slack

## 🔍 Verify Installation

**Check 1: Webhook Active**
- Go to n8n → Workflows
- Find "GitHub Workflow Error Auto-Fixer"
- Status should be: 🟢 Active

**Check 2: Webhook URL**
- Click on workflow
- Click "GitHub Webhook" node
- Copy webhook URL
- Should be: `https://your-n8n.com/webhook/github-workflow-error`

**Check 3: Test Execution**
- Click "Test Workflow"
- Should execute without errors

## ⚙️ Minimal Configuration

Edit only these fields:

**AI Agent Node:**
- Credential: Select your Claude/OpenAI credential

**Slack Node:**
- Credential: Select your Slack credential
- Channel: Change `#devops-alerts` to your channel

**Airtop Nodes:**
- Credential: Select your Airtop credential (all 3 nodes)

## 🚨 Common Issues

### Issue: Webhook Not Triggering

**Fix:**
```bash
# Test webhook manually
curl -X POST YOUR_WEBHOOK_URL -H "Content-Type: application/json" -d '{"test": true}'

# Check GitHub webhook deliveries
# Repository → Settings → Webhooks → Recent Deliveries
```

### Issue: AI Agent Not Working

**Fix:**
1. Check API credential is valid
2. Verify model name is correct
3. Check API quota/limits

### Issue: Slack Message Not Sent

**Fix:**
1. Verify bot is added to channel: `/invite @YourBot`
2. Check bot permissions include `chat:write`
3. Test Slack credential in n8n

## 📊 First Run Checklist

After deploying, verify:

- [ ] Workflow is active (green toggle)
- [ ] GitHub webhook is configured
- [ ] Webhook URL is accessible (test with curl)
- [ ] All credentials are configured
- [ ] Slack bot is in target channel
- [ ] Test execution successful
- [ ] Received test Slack message

## 🎓 Next Steps

Once basic setup works:

1. **Customize AI prompts** - Edit system message for your needs
2. **Add error handling** - Create error workflow
3. **Monitor metrics** - Track success rate
4. **Scale to multiple repos** - Update webhook to handle multiple repositories

## 📚 Full Documentation

- [README.md](README.md) - Complete guide
- [CONFIGURATION.md](CONFIGURATION.md) - Advanced settings
- [EXAMPLES.md](EXAMPLES.md) - Real-world examples

## 💡 Pro Tips

1. **Start with test repository** - Don't use production immediately
2. **Monitor first few runs** - Check AI agent behavior
3. **Adjust AI prompts** - Customize for your tech stack
4. **Set up alerts** - Get notified of workflow failures
5. **Review AI changes** - Always review before merging to production

## 🆘 Need Help?

If you get stuck:

1. Check execution logs in n8n
2. Review [CONFIGURATION.md](CONFIGURATION.md) for detailed setup
3. Test each node individually
4. Enable verbose logging in AI agent
5. Check API quotas and limits

## ✅ Success Criteria

You'll know it's working when:

1. GitHub webhook delivers successfully (green checkmark in GitHub)
2. n8n workflow executes (check Executions tab)
3. AI agent analyzes error (check node output)
4. Slack message received (with error details)

Expected execution time: **2-5 minutes** per failure

---

**Need more help?** Check the full documentation or open an issue.

**Conceived by Romuald Członkowski** - [AI Advisors](https://www.aiadvisors.pl/en)
