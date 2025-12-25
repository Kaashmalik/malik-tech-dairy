/**
 * Test Supabase Token Script
 * Use this to verify your service role key works
 */

import { createClient } from '@supabase/supabase-js';

// Test the current token from MCP config
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGl0cWt2emxwbmtsY294c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzMTMzMCwiZXhwIjoyMDgwNDA3MzMwfQ.QV1sqGTY1Qp094VfAsBlAz-BPq4WGIIaQGQyk7u8f5k";
const PROJECT_ID = "gdditqkvzlpnklcoxspj";
const URL = `https://${PROJECT_ID}.supabase.co`;


const supabase = createClient(URL, TOKEN);

async function testToken() {
  try {
    // Test 1: Try to list tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (tablesError) {
    } else {
    }

    // Test 2: Try to access a known table
    const { data: animals, error: animalsError } = await supabase
      .from('animals')
      .select('count')
      .limit(1);
    
    if (animalsError) {
    } else {
    }

    // Test 3: Check token info
    const parts = TOKEN.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log(`   Issued: ${new Date(payload.iat * 1000).toLocaleString()}`);
      console.log(`   Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
      
      if (Date.now() > payload.exp * 1000) {
      } else {
      }
    } else {
    }

    // Test 4: Try RPC call (MCP might use this)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_table_info', { schema_name: 'public' })
      .catch(() => ({ error: { message: 'RPC function does not exist' } }));
    
    if (rpcError) {
      console.log('⚠️  RPC test failed (this is normal):', rpcError.message);
    } else {
    }

  } catch (error) {
  }
}

testToken();