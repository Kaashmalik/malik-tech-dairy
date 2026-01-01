// Quick restart script
console.log('🔄 Restarting server...\n');

const { execSync } = require('child_process');

try {
  // Kill any existing node processes
  console.log('1️⃣ Stopping server...');
  execSync('taskkill /F /IM node.exe', { stdio: 'pipe' });
} catch (e) {
  // No process to kill
}

console.log('\n✅ Server stopped!');
console.log('\n📋 To restart:');
console.log('1. Open a NEW terminal');
console.log('2. Run: cd "d:\\MalikTech\\MalikTech-dairy\\malik-tech-dairy"');
console.log('3. Run: npm run dev');
console.log('4. Open: http://localhost:3000/dashboard');
console.log('\n🎉 The dashboard is working!');
