/**
 * Test MCP Server Startup
 * This simulates how Windsurf would start the MCP server
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration from your mcp_config.json
const config = {
  command: 'npx',
  args: ['-y', '@supabase/mcp-server-supabase@latest'],
  env: {
    SUPABASE_ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k',
    SUPABASE_PROJECT_ID: 'gdditqkvzlpnklcoxspj'
  }
};

console.log(`Args: ${config.args.join(' ')}`);
console.log(`Token: ${config.env.SUPABASE_ACCESS_TOKEN.substring(0, 20)}...\n`);

// Create child process
const mcpServer = spawn(config.command, config.args, {
  env: { ...process.env, ...config.env },
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let stdout = '';
let stderr = '';

mcpServer.stdout.on('data', (data) => {
  stdout += data.toString();
});

mcpServer.stderr.on('data', (data) => {
  stderr += data.toString();
});

mcpServer.on('spawn', () => {
  
  // Send a test JSON-RPC message
  const testMessage = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  });
  
  mcpServer.stdin.write(testMessage + '\n');
});

mcpServer.on('error', (error) => {
  
  if (error.code === 'ENOENT') {
  }
});

setTimeout(() => {
  
  if (stdout) {
  }
  
  if (stderr) {
    
    if (stderr.includes('Unauthorized') || stderr.includes('401')) {
    }
  }
  
  if (!stdout && !stderr) {
  }
  
  // Clean up
  mcpServer.kill();
  process.exit(0);
}, 5000);

// Handle process termination
process.on('SIGINT', () => {
  mcpServer.kill();
  process.exit(0);
});