#!/usr/bin/env node

/**
 * CLI Script: Create First Admin User
 * Usage: node scripts/create-first-admin.js <email> "<name>" <password>
 */

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFirstAdmin(email, name, password) {
  try {
    console.log('🔍 Checking for existing admin users...');

    // Check if any admin users already exist
    const existingAdmins = await prisma.user.count({
      where: { role: 'admin' },
    });

    if (existingAdmins > 0) {
      console.error('❌ Error: Admin users already exist.');
      console.error(
        '   Use the admin panel or web UI to create additional admins.'
      );
      process.exit(1);
    }

    console.log('✅ No admin users found. Proceeding with bootstrap...');

    // Initialize Supabase client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Error: Missing Supabase environment variables');
      console.error(
        '   Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set'
      );
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('🔐 Creating admin user in Supabase Auth...');

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for first admin
        user_metadata: {
          name,
        },
      });

    if (authError) {
      console.error('❌ Supabase Auth Error:', authError.message);
      process.exit(1);
    }

    if (!authData.user) {
      console.error('❌ Failed to create user in Supabase Auth');
      process.exit(1);
    }

    console.log('✅ User created in Supabase Auth');
    console.log('💾 Creating user profile in database...');

    // Create user profile in database with admin role
    const profile = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        name,
        role: 'admin',
        subscriptionTier: 'FREE',
        themePreference: 'system',
      },
    });

    console.log('');
    console.log('✅ First admin user created successfully!');
    console.log('');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🔑 Role: admin');
    console.log('🆔 User ID:', profile.id);
    console.log('');
    console.log(
      '🔗 You can now log in at:',
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    );
    console.log('');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log(
    'Usage: node scripts/create-first-admin.js <email> "<name>" <password>'
  );
  console.log('');
  console.log('Example:');
  console.log(
    '  node scripts/create-first-admin.js admin@example.com "Admin User" SecurePassword123'
  );
  console.log('');
  process.exit(1);
}

const [email, name, password] = args;

// Validate inputs
if (!email || !name || !password) {
  console.error('❌ Error: All arguments are required (email, name, password)');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌ Error: Password must be at least 8 characters long');
  process.exit(1);
}

// Run the script
createFirstAdmin(email, name, password);
