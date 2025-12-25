# MCP Server Troubleshooting Guide

## Current Status
✅ Your Supabase token is **VALID** and working
✅ Token expires in 2035 (no expiry issues)
✅ Can access database tables directly
❌ MCP server still reports "Unauthorized"

## Possible Issues & Solutions

### 1. MCP Server Not Reading Config Correctly

**Solution A: Try Alternative Config Location**
Some MCP clients look for config in different locations:

1. **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
2. **Windsurf/Cascade**: `c:\Users\DELL\.codeium\windsurf\mcp_config.json`
3. **Global**: `c:\Users\DELL\.config\claude\claude_desktop_config.json`

Try copying the config to all locations:

```bash
# Copy to Claude directory
mkdir -p "%APPDATA%\Claude"
copy "c:\Users\DELL\.codeium\windsurf\mcp_config.json" "%APPDATA%\Claude\claude_desktop_config.json"

# Copy to config directory
mkdir -p "c:\Users\DELL\.config\claude"
copy "c:\Users\DELL\.codeium\windsurf\mcp_config.json" "c:\Users\DELL\.config\claude\claude_desktop_config.json"
```

### 2. Environment Variable Issue

**Solution B: Use Environment Variable Instead**

1. Open PowerShell as Administrator
2. Set the token as environment variable:

```powershell
# Set for current session
$env:SUPABASE_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k"

# Set permanently (optional)
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k', 'User')
```

3. Update your config to remove the token:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ],
      "env": {
        "SUPABASE_PROJECT_ID": "gdditqkvzlpnklcoxspj"
      }
    }
  }
}
```

### 3. MCP Server Version Issue

**Solution C: Force Install Latest Version**

1. Open Command Prompt
2. Run:

```bash
# Clear npm cache
npm cache clean --force

# Install globally
npm install -g @supabase/mcp-server-supabase@latest

# Update config to use global installation
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

### 4. Test MCP Server Directly

**Solution D: Manual Test**

1. Open Command Prompt
2. Run the MCP server directly:

```bash
set SUPABASE_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k
set SUPABASE_PROJECT_ID=gdditqkvzlpnklcoxspj
npx -y @supabase/mcp-server-supabase@latest
```

3. If it starts successfully, the issue is with the IDE integration

### 5. Alternative: Use Different MCP Server

**Solution E: Try the Official Supabase CLI**

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login:
```bash
supabase login
```

3. Use Supabase CLI commands instead of MCP

## Quick Fix Steps

1. **First**, try copying the config to all locations
2. **If that fails**, try the environment variable method
3. **As last resort**, use the manual test to confirm the server works

## Verification

After each fix:
1. Completely restart your IDE
2. Wait 10 seconds
3. Try an MCP command like: "List tables in my database"

## Contact Support

If none of these work:
- MCP Server GitHub: https://github.com/supabase/mcp-server-supabase
- Supabase Discord: https://discord.supabase.com
- Create an issue with your error details
