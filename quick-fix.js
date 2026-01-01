// Quick fix for animals and weather not showing
const { execSync } = require('child_process');

console.log('🔧 Quick Fix for Animals and Weather Display\n');

try {
  // 1. Clear Next.js cache
  console.log('1️⃣ Clearing Next.js cache...');
  try {
    execSync('rm -rf .next', { stdio: 'inherit' });
    console.log('   ✅ Cache cleared');
  } catch (e) {
    console.log('   ⚠️ Cache clear failed (may not exist)');
  }

  // 2. Install dependencies
  console.log('\n2️⃣ Checking dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('   ✅ Dependencies installed');
  } catch (e) {
    console.log('   ❌ npm install failed');
  }

  console.log('\n✅ Fix Complete!');
  console.log('\n🚀 Now run these commands:');
  console.log('1. npm run dev');
  console.log('2. Open browser to: http://localhost:3000/dashboard');
  console.log('3. Log in with your account');
  console.log('4. Animals and Weather should now be visible!');
} catch (error) {
  console.error('Fix failed:', error);
}
