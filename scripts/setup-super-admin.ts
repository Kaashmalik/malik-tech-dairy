// Script to set up super admin user
// Run with: npx tsx scripts/setup-super-admin.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { platformUsers } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const SUPER_ADMIN_EMAIL = 'mtkdairy@gmail.com';

async function setupSuperAdmin() {
  console.log('Setting up super admin...');
  
  const connectionString = process.env.SUPABASE_DATABASE_URL;
  if (!connectionString) {
    console.error('SUPABASE_DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(platformUsers)
      .where(eq(platformUsers.email, SUPER_ADMIN_EMAIL))
      .limit(1);

    if (existingUser) {
      // Update to super admin
      await db
        .update(platformUsers)
        .set({ 
          platformRole: 'super_admin',
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(platformUsers.email, SUPER_ADMIN_EMAIL));
      
      console.log(`✅ Updated ${SUPER_ADMIN_EMAIL} to super_admin`);
      console.log(`   User ID: ${existingUser.id}`);
    } else {
      console.log(`⚠️  User ${SUPER_ADMIN_EMAIL} not found in database`);
      console.log('   The user will be auto-created as super_admin when they first sign in');
      console.log('   Or you can manually add them after they sign up');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

setupSuperAdmin();
