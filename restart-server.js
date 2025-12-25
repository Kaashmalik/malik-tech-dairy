// Quick fix to restart the server
const { execSync } = require('child_process');

console.log('🔄 Restarting Development Server...\n');

try {
  // Kill any existing Next.js processes
  console.log('1️⃣ Stopping any running processes...');
  try {
    execSync('taskkill /F /IM node.exe', { stdio: 'pipe' });
  } catch (e) {
    // No process to kill
  }

  // Clear cache
  console.log('2️⃣ Clearing cache...');
  const fs = require('fs');
  const path = require('path');
  
  const nextDir = path.join(__dirname, '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('   ✅ Cache cleared');
  }

  console.log('\n✅ Ready to restart!');
  console.log('\n📋 Run these commands in a NEW terminal:');
  console.log('1. cd "d:\\MalikTech\\MalikTech-dairy\\malik-tech-dairy"');
  console.log('2. npm run dev');
  console.log('3. Open browser to: http://localhost:3000/dashboard');
  
} catch (error) {
  console.error('Error:', error.message);
}
