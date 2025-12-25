#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Run this script before building to ensure all required environment variables are set
 */

import { validateEnv } from '../src/lib/env.js';
import chalk from 'chalk';

console.log(chalk.blue('\n🔍 Validating Environment Variables...\n'));

const validation = validateEnv();

if (!validation.success) {
  console.error(chalk.red('❌ Validation failed! Please fix the errors above before building.\n'));
  process.exit(1);
}

console.log(chalk.green('✅ All environment variables are valid!\n'));

// Check for common issues
const warnings = [];

// Check if using placeholder values
if (process.env.CLERK_WEBHOOK_SECRET?.includes('placeholder')) {
  warnings.push('⚠️  Clerk webhook secret appears to be a placeholder');
}

if (process.env.SUPABASE_DATABASE_URL?.includes('[YOUR-PASSWORD]')) {
  warnings.push('⚠️  Supabase database URL contains placeholder password');
}

// Check if using development keys in production
if (process.env.NODE_ENV === 'production') {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
    warnings.push('⚠️  Using Clerk test keys in production');
  }
  
  if (process.env.RESEND_FROM_EMAIL?.includes('resend.dev')) {
    warnings.push('⚠️  Using Resend development email in production');
  }
}

if (warnings.length > 0) {
  console.log(chalk.yellow('\n⚠️  Warnings:\n'));
  warnings.forEach(warning => console.log(chalk.yellow(`  ${warning}\n`)));
}

// Show configuration summary
console.log(chalk.blue('📊 Configuration Summary:\n'));
console.log(`  Environment: ${chalk.cyan(process.env.NODE_ENV || 'development')}`);
console.log(`  App URL: ${chalk.cyan(process.env.NEXT_PUBLIC_APP_URL || 'Not set')}`);
console.log(`  Support Email: ${chalk.cyan(process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'Not set')}`);
console.log(`  Require Admin Approval: ${chalk.cyan(process.env.REQUIRE_ADMIN_APPROVAL === 'true' ? 'Yes' : 'No')}`);

console.log(chalk.green('\n✅ Ready to build!\n'));
