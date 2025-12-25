# MCP Supabase Server Setup Guide

## Overview
This guide will help you configure the MCP (Model Context Protocol) Supabase server to interact with your Supabase database through Claude.

## Prerequisites
- Claude Desktop installed
- Supabase project access
- Node.js installed

## Step 1: Get Your Supabase Access Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `gdditqkvzlpnklcoxspj`
3. Go to **Settings** → **API**
4. Find the **Service Role** key (not the anon key)
5. Copy the Service Role key - this will be your `SUPABASE_ACCESS_TOKEN`

Your Service Role key should look like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k
```

## Step 2: Configure Claude Desktop

### Option A: Windows
1. Press `Win + R` and type `%APPDATA%`
2. Navigate to `Claude` folder (create if it doesn't exist)
3. Create or edit `claude_desktop_config.json`

### Option B: macOS
1. Open Terminal
2. Navigate to `~/Library/Application Support/Claude/`
3. Create or edit `claude_desktop_config.json`

### Option C: Linux
1. Navigate to `~/.config/claude/`
2. Create or edit `claude_desktop_config.json`

## Step 3: Add the Configuration

Copy this configuration to your `claude_desktop_config.json`:

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
        "SUPABASE_ACCESS_TOKEN": "YOUR_SERVICE_ROLE_KEY_HERE",
        "SUPABASE_PROJECT_ID": "gdditqkvzlpnklcoxspj"
      }
    }
  }
}
```

**Important**: Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual Service Role key from Step 1.

## Step 4: Restart Claude Desktop

1. Completely close Claude Desktop
2. Restart the application
3. The MCP server should now be connected

## Step 5: Verify and Setup Tables

After configuring the MCP server, run these commands to check and create missing tables:

```bash
# Check which tables exist
npm run check:tables

# Create missing tables (if any)
npm run setup:supabase-tables
```

## Step 6: Test the MCP Server

You can now interact with your Supabase database through Claude! Try these commands:

1. **List all tables**:
   - "List all tables in my Supabase database"

2. **Check a specific table**:
   - "Show me the structure of the animals table"
   - "Get the first 5 records from the milk_logs table"

3. **Run queries**:
   - "Count how many animals are in the database"
   - "Show me all milk logs from the last 7 days"

## Available Tables

Your database should have these tables:
- ✅ `tenants` - Farm organizations
- ✅ `platform_users` - All users
- ✅ `tenant_members` - User-tenant relationships
- ✅ `subscriptions` - Subscription plans
- ✅ `animals` - Livestock records
- ✅ `milk_logs` - Milk production data
- ✅ `health_records` - Animal health data
- ✅ `breeding_records` - Breeding information
- ✅ `expenses` - Financial expenses
- ✅ `sales` - Sales records
- ✅ `payments` - Payment records
- ✅ `api_keys` - API key management
- ✅ `audit_logs` - Audit trail
- ✅ `farm_applications` - New farm applications
- ✅ `custom_fields_config` - Custom field definitions
- ✅ `email_subscriptions` - Email preferences
- ✅ `predictions` - AI predictions

## Troubleshooting

### MCP Server Not Connecting
1. Verify your Service Role key is correct
2. Check that the project ID matches: `gdditqkvzlpnklcoxspj`
3. Make sure you have internet connection
4. Restart Claude Desktop completely

### Permission Errors
- Ensure you're using the **Service Role** key, not the anon key
- The Service Role key has full access to your database

### Tables Missing
- Run `npm run check:tables` to see what's missing
- Run `npm run setup:supabase-tables` to create them
- Or manually run the SQL from `scripts/supabase-complete-migration.sql`

## Security Notes

⚠️ **Important**: 
- Never share your Service Role key
- It has full database access
- Only use it in secure environments
- Rotate keys periodically in Supabase Dashboard

## Next Steps

Once configured, you can:
1. Ask Claude to analyze your data
2. Generate reports from your database
3. Create complex queries
4. Export data in various formats
5. Perform data analysis

Example prompts:
- "Generate a report of milk production by animal for the last month"
- "Find all animals that need health checkups this week"
- "Calculate total expenses by category for this quarter"
