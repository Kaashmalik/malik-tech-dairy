# Complete Windsurf MCP Supabase Setup

## Current Status ✅
- MCP Server starts successfully
- Token is valid
- Configuration is correct
- Issue: Windsurf not connecting properly to the running server

## Step-by-Step Fix

### 1. Verify MCP Server in Windsurf

1. Look at the **bottom status bar** in Windsurf
2. Find the **MCP icon** (looks like a server/connection icon)
3. Click on it - you should see:
   - Server status
   - List of configured servers
   - Connection state

### 2. Proper Windsurf Configuration

Since you're using Windsurf (not Claude Desktop), ensure your config is at:

```
c:\Users\DELL\.codeium\windsurf\mcp_config.json
```

Your current config is correct:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k",
        "SUPABASE_PROJECT_ID": "gdditqkvzlpnklcoxspj"
      }
    }
  }
}
```

### 3. Reload MCP in Windsurf

1. **Save the config file** if you made any changes
2. Click the **MCP icon** in the status bar
3. Click **"Reload Servers"** or **"Restart"**
4. Wait for the server to initialize

### 4. Test the Connection

Try these commands in the chat:
- "List all tables in my Supabase database"
- "Show me the animals table structure"
- "Count rows in the milk_logs table"

### 5. If Still Not Working - Try These Fixes

#### Fix A: Check Windsurf Version
Make sure you have the latest version of Windsurf that supports MCP servers.

#### Fix B: Use Full Path
Try using the full path to npx:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "C:\\Program Files\\nodejs\\npx.cmd",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k",
        "SUPABASE_PROJECT_ID": "gdditqkvzlpnklcoxspj"
      }
    }
  }
}
```

#### Fix C: Alternative Installation
Install the MCP server globally:

```bash
npm install -g @supabase/mcp-server-supabase@latest
```

Then update config:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "supabase-mcp-server",
      "env": {
        "SUPABASE_ACCESS_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k",
        "SUPABASE_PROJECT_ID": "gdditqkvzlpnklcoxspj"
      }
    }
  }
}
```

#### Fix D: Check Windows PATH
Ensure Node.js and npm are in your PATH:

1. Open Command Prompt
2. Run: `where npx`
3. If not found, add Node.js to PATH:
   - `C:\Program Files\nodejs\`

### 6. Verify Everything Works

Once connected, you should be able to:
- ✅ List tables
- ✅ Query data
- ✅ Create tables
- ✅ Run SQL commands

### 7. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Server not found" | Reload MCP servers |
| "Unauthorized" | Check token is service_role key |
| "Command not found" | Install Node.js or use full path |
| "Connection timeout" | Check internet/firewall |

### 8. Debug Mode

To see what's happening:
1. Open Windsurf
2. Press `Ctrl+Shift+P`
3. Type "Developer: Show Logs"
4. Look for MCP-related messages

## Final Checklist

- [ ] Config file saved at correct location
- [ ] Token is service_role key (not anon key)
- [ ] Node.js installed and in PATH
- [ ] MCP server reloaded in Windsurf
- [ ] Tested with a simple query

## Need Help?

If it still doesn't work:
1. Check Windsurf documentation for MCP
2. Look at the MCP server logs
3. Try the manual test script I created

The server IS working - it's just a matter of Windsurf connecting to it properly!
