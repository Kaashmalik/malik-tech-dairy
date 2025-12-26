
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading .env.local from:', envLocalPath);

if (fs.existsSync(envLocalPath)) {
    console.log('.env.local exists. File size:', fs.statSync(envLocalPath).size);
    // Read raw content to check for weird characters
    const rawContent = fs.readFileSync(envLocalPath, 'utf8');
    console.log('First 50 chars:', rawContent.substring(0, 50));

    // Try dotenv
    const result = dotenv.config({ path: envLocalPath });
    if (result.error) {
        console.error('dotenv error:', result.error);
    } else {
        console.log('dotenv parsed keys:', Object.keys(result.parsed));
    }
} else {
    console.error('.env.local does NOT exist');
}

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
