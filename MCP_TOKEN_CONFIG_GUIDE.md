# MCP Supabase Token Configuration Guide

## Step 1: Get Your Access Token

### Method 1: Via Supabase Dashboard (Recommended)
1. Open your browser and go to: https://supabase.com/dashboard
2. Sign in to your account
3. Click on your project: **gdditqkvzlpnklcoxspj**
4. In the left sidebar, go to **Settings** → **API**
5. Scroll down to **Project API keys**
6. Find the **service_role** key (NOT the anon key)
7. Click the "Copy" button next to it

Your service role key should look like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k
```

### Method 2: Generate New Access Token
If you need a new token:
1. Go to: https://supabase.com/dashboard/project/gdditqkvzlpnklcoxspj/settings/api
2. Under **Project API keys**, click **Generate new token**
3. Select **Service role key**
4. Give it a name (e.g., "MCP Access")
5. Copy the generated key immediately (it won't be shown again)

## Step 2: Update Your MCP Configuration

Your MCP config file is located at:
```
c:\Users\DELL\.codeium\windsurf\mcp_config.json
```

### Current Configuration:
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
        "SUPABASE_ACCESS_TOKEN":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k",
        "SUPABASE_PROJECT_ID": "gdditqkvzlpnklcoxspj"
      }
    }
  }
}
```

### To Update:
1. Replace the `SUPABASE_ACCESS_TOKEN` value with your new token
2. Keep the `SUPABASE_PROJECT_ID` as `gdditqkvzlpnklcoxspj`

## Step 3: Verify Token Validity

After updating your config, you can verify the token works by:
1. Opening Command Prompt or PowerShell
2. Running: `curl -X POST "https://gdditqkvzlpnklcoxspj.supabase.co/rest/v1/" -H "apikey: YOUR_TOKEN_HERE" -H "Authorization: Bearer YOUR_TOKEN_HERE"`
3. You should get a JSON response (not an error)

## Step 4: Restart Cascade/IDE

After updating the config:
1. Completely close Cascade/your IDE
2. Wait 10 seconds
3. Restart the application
4. The MCP server should now connect properly

## Important Notes:

⚠️ **Security Warning**:
- Never share your service role key publicly
- It has full database access
- Only use it in secure environments
- Rotate keys periodically

🔑 **Key Differences**:
- **Service Role Key**: Full access, bypasses RLS (for MCP)
- **Anon Key**: Limited access, respects RLS (for client apps)

📝 **Direct Links**:
- Supabase Dashboard: https://supabase.com/dashboard
- Your Project: https://supabase.com/dashboard/project/gdditqkvzlpnklcoxspj
- API Settings: https://supabase.com/dashboard/project/gdditqkvzlpnklcoxspj/settings/api

## Troubleshooting:

If MCP still doesn't work:
1. Check if the token expired (go to Supabase Dashboard)
2. Verify no extra spaces in the token
3. Ensure the project ID is correct: `gdditqkvzlpnklcoxspj`
4. Check your internet connection
5. Try generating a new token

## Testing MCP Connection:

Once configured, you can test by asking:
- "List all tables in my Supabase database"
- "Show me the structure of the animals table"
- "Count rows in the milk_logs table"
