# Getting Started with n8n-MCP

This guide helps you quickly connect n8n-MCP to your preferred AI coding assistant.

## 🤔 Which Tool Should I Use?

n8n-MCP works with multiple AI assistants. Here's how to choose:

| Tool | Best For | Setup Time | Cost |
|------|----------|------------|------|
| **Claude Code** | Command-line workflows, full control | 2 minutes | Paid (Claude Pro) |
| **GitHub Copilot** | VS Code integration, team collaboration | 5 minutes | Paid (GitHub) |
| **Cursor** | Modern IDE, built-in AI chat | 3 minutes | Free/Paid |
| **Windsurf** | Codebase-aware AI | 3 minutes | Free/Paid |
| **Claude Desktop** | Simple desktop app | 2 minutes | Free/Paid |

💡 **Clarification**: Claude Code and GitHub Copilot are **different tools**:
- **Claude Code** = Anthropic's CLI tool that uses Claude AI
- **GitHub Copilot** = GitHub's VS Code extension that can use various AI models

## 🚀 Quick Start Paths

### Path 1: Claude Code (Recommended for Command Line)

**Prerequisites:** 
- [Claude Pro subscription](https://claude.ai/upgrade) (required for Claude Code)
- Node.js installed

**Setup (2 minutes):**

```bash
# Install Claude Code CLI (if not already installed)
npm install -g @anthropic/claude-code

# Add n8n-MCP server
claude mcp add n8n-mcp \
  -e MCP_MODE=stdio \
  -e LOG_LEVEL=error \
  -e DISABLE_CONSOLE_OUTPUT=true \
  -- npx n8n-mcp

# Start using it!
claude chat
# Type: "search for n8n slack nodes"
```

📖 **Full guide:** [CLAUDE_CODE_SETUP.md](./CLAUDE_CODE_SETUP.md)

---

### Path 2: GitHub Copilot + VS Code (Recommended for Teams)

**Prerequisites:**
- [GitHub Copilot subscription](https://github.com/features/copilot)
- VS Code installed
- n8n-MCP running as HTTP server (deployed)

**Setup (5 minutes):**

1. **Deploy n8n-MCP as HTTP server:**
   ```bash
   # Option A: Use hosted service (easiest)
   # Sign up at https://dashboard.n8n-mcp.com
   
   # Option B: Self-host with Railway
   # Click: https://railway.com/deploy/n8n-mcp
   
   # Option C: Deploy yourself
   # See: ./HTTP_DEPLOYMENT.md
   ```

2. **Configure VS Code:**
   
   Create `.vscode/mcp.json` in your project:
   ```json
   {
       "inputs": [
           {
               "type": "promptString",
               "id": "n8n-mcp-token",
               "description": "Your n8n-MCP AUTH_TOKEN",
               "password": true
           }
       ],
       "servers": {
           "n8n-mcp": {
               "type": "http",
               "url": "https://your-n8n-mcp-url.com/mcp",
               "headers": {
                   "Authorization": "Bearer ${input:n8n-mcp-token}"
               }
           }
       }
   }
   ```

3. **Add project instructions:**
   
   Create `.github/copilot-instructions.md` - see [VS_CODE_PROJECT_SETUP.md](./VS_CODE_PROJECT_SETUP.md#step-4) for the full template.

4. **Start chatting with Copilot!**

📖 **Full guide:** [VS_CODE_PROJECT_SETUP.md](./VS_CODE_PROJECT_SETUP.md)

---

### Path 3: Claude Desktop (Recommended for Beginners)

**Prerequisites:**
- [Claude Desktop app](https://claude.ai/download) installed
- Node.js installed

**Setup (2 minutes):**

1. **Find your config file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add this configuration:**
   ```json
   {
     "mcpServers": {
       "n8n-mcp": {
         "command": "npx",
         "args": ["n8n-mcp"],
         "env": {
           "MCP_MODE": "stdio",
           "LOG_LEVEL": "error",
           "DISABLE_CONSOLE_OUTPUT": "true"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

4. **Test it:**
   - Open a new chat
   - Type: "search for n8n slack nodes"
   - You should see the MCP tools being called!

📖 **Full guide:** [README_CLAUDE_SETUP.md](./README_CLAUDE_SETUP.md)

---

### Path 4: Other IDEs

We support several other IDEs:

- **[Cursor](./CURSOR_SETUP.md)** - Modern AI-powered IDE
- **[Windsurf](./WINDSURF_SETUP.md)** - Codebase-aware coding assistant
- **[Codex](./CODEX_SETUP.md)** - AI coding assistant
- **[Antigravity](./ANTIGRAVITY_SETUP.md)** - Specialized AI IDE

## 🔧 Connecting to Your n8n Instance (Optional)

By default, n8n-MCP provides **documentation and validation tools** only.

To enable **workflow management** (create, update, execute workflows), add your n8n API credentials:

### For Claude Code / Claude Desktop (npx):
```bash
claude mcp add n8n-mcp \
  -e MCP_MODE=stdio \
  -e LOG_LEVEL=error \
  -e DISABLE_CONSOLE_OUTPUT=true \
  -e N8N_API_URL=https://your-n8n-instance.com \
  -e N8N_API_KEY=your-api-key \
  -- npx n8n-mcp
```

### For GitHub Copilot (HTTP):
Your n8n credentials should be configured on the **HTTP server** that's running n8n-MCP, not in the VS Code config.

### Getting Your n8n API Key:

1. Log in to your n8n instance
2. Go to **Settings** → **API**
3. Click **Create API Key**
4. Copy the key (you'll only see it once!)

💡 **Local n8n instance?** Use `http://host.docker.internal:5678` as the URL if running n8n in Docker.

## 🎯 What Can You Do With n8n-MCP?

Once connected, try these commands in your AI assistant:

### Discovery & Search
```
"Search for n8n nodes that can send emails"
"Show me all trigger nodes available"
"Find nodes for working with Google Sheets"
```

### Configuration & Templates
```
"Get configuration details for the Slack node"
"Show me an example workflow for Slack notifications"
"What are the essential properties for the HTTP Request node?"
```

### Validation
```
"Validate this Slack node configuration: {config}"
"Check if this workflow is valid: {workflow JSON}"
"What's wrong with this node configuration?"
```

### Workflow Management (requires n8n API connection)
```
"Create a new workflow that sends Slack notifications when a webhook is triggered"
"List all my workflows"
"Update the webhook URL in workflow ID 123"
"Test workflow ID 456"
```

## 📚 Next Steps

Once you're connected:

1. **📖 Learn the tools**: Run `tools_documentation()` to see all available MCP tools
2. **🎓 Add Claude Skills** (optional): Install [n8n-skills](https://github.com/czlonkowski/n8n-skills) for enhanced workflow guidance
3. **🤖 Set up project instructions**: Add the instructions from [README.md](../README.md#-claude-project-setup) to get optimal results
4. **🚀 Start building**: Ask your AI to help create n8n workflows!

## ❓ Troubleshooting

### "MCP server not responding"
- Verify Node.js is installed: `node --version`
- Try rebuilding: `npm install -g n8n-mcp`
- Check logs in Claude Desktop: Look in the MCP section

### "Tools not appearing"
- Restart your IDE/app after configuration changes
- Verify your config file syntax (must be valid JSON)
- Check that `MCP_MODE` is set to `stdio` for local tools

### "Authentication failed"
- Verify your n8n API key is correct
- Check that `N8N_API_URL` has no trailing slash
- For local n8n, use `http://host.docker.internal:5678`

### Still stuck?
- 📖 Check our detailed guides linked above
- 🐛 [Open an issue](https://github.com/czlonkowski/n8n-mcp/issues)
- 💬 Ask in [n8n community](https://community.n8n.io/)

## 🎉 Success?

If this guide helped you, consider:
- ⭐ [Star the repository](https://github.com/czlonkowski/n8n-mcp)
- 💖 [Sponsor the project](https://github.com/sponsors/czlonkowski)
- 🐦 Share your experience on social media!

---

**Need more details?** Check out:
- [Installation Guide](./INSTALLATION.md)
- [MCP Quick Start](./MCP_QUICK_START_GUIDE.md)
- [HTTP Deployment Guide](./HTTP_DEPLOYMENT.md)
- [Full README](../README.md)
