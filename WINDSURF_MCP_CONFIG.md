# Cascade/Windsurf MCP Server Configuration Guide

## MCP Configuration in Windsurf/Cascade

Since you're using Windsurf/Cascade's built-in MCP server (not the desktop app), the configuration might be in a different location or format.

## Step 1: Check MCP Server Status in Windsurf

1. Look for the **MCP Server icon** in Windsurf's status bar (usually bottom left)
2. Click on it to see server status
3. Check if Supabase server is listed and connected

## Step 2: Correct Configuration Location

For Windsurf/Cascade, the MCP config should be at:
```
c:\Users\DELL\.codeium\windsurf\mcp_config.json
```

## Step 3: Verify Your Current Config

Your current config looks correct:
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
        "SUPABASE_ACCESS_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k",
        "SUPABASE_PROJECT_ID": "gdditqkvzlpnklcoxspj"
      }
    }
  }
}
```

## Step 4: Windsurf-Specific Troubleshooting

### Option A: Reload MCP Servers
1. In Windsurf, press `Ctrl+Shift+P`
2. Type "MCP: Reload Servers"
3. Press Enter
4. Check the MCP server icon again

### Option B: Check Windsurf Settings
1. Press `Ctrl+,` to open Settings
2. Search for "MCP"
3. Verify the MCP config path is correct
4. It should point to: `c:\Users\DELL\.codeium\windsurf\mcp_config.json`

### Option C: Use Windsurf's MCP UI
1. Click the MCP server icon in status bar
2. Look for "Add Server" or "Configure"
3. Add Supabase server with:
   - Name: `supabase`
   - Command: `npx`
   - Args: `-y`, `@supabase/mcp-server-supabase@latest`
   - Environment:
     - `SUPABASE_ACCESS_TOKEN`: your token
     - `SUPABASE_PROJECT_ID`: `gdditqkvzlpnklcoxspj`

### Option D: Check Logs
1. In Windsurf, press `Ctrl+Shift+P`
2. Type "Developer: Show Logs"
3. Select "MCP Server" or "Extension Host"
4. Look for Supabase-related errors

## Step 5: Alternative Configuration

If the above doesn't work, try this alternative format:

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

## Step 6: Verify Token Format

Make sure there are no extra spaces or line breaks in your token. The token should be a single continuous string.

## Step 7: Test Connection

After configuring:
1. Save the config file
2. Click the MCP server icon
3. Click "Reload" or "Restart"
4. Try asking: "List all Supabase tables"

## Common Windsurf MCP Issues

1. **Config not loading**: Check file permissions
2. **Server not starting**: Check if Node.js is installed
3. **Authentication failing**: Verify token is service_role key
4. **Port conflicts**: Restart Windsurf completely

## Need More Help?

If it still doesn't work:
1. Check Windsurf documentation for MCP setup
2. Look in Help → About → Extension Host for errors
3. Try resetting Windsurf settings
