#!/usr/bin/env node

/**
 * Script to create the first admin user
 * Usage: node scripts/create-first-admin.js <email> <name>
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFirstAdmin() {
  const email = process.argv[2];
  const name = process.argv[3];

  if (!email || !name) {
    console.error('Usage: node scripts/create-first-admin.js <email> <name>');
    console.error(
      'Example: node scripts/create-first-admin.js admin@example.com "Admin User"'
    );
    process.exit(1);
  }

  try {
    // Check if any admin users exist
    const adminCount = await prisma.user.count({
      where: { role: 'admin' },
    });

    if (adminCount > 0) {
      console.log(
        '❌ Admin users already exist. Use the regular user creation interface.'
      );
      process.exit(1);
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('❌ User with this email already exists');
      process.exit(1);
    }

    // Create the first admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        name,
        role: 'admin',
        subscriptionTier: 'PREMIUM',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ First admin user created successfully!');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log('');
    console.log(
      'You can now log in with this account and create additional users.'
    );
  } catch (error) {
    console.error('❌ Error creating first admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createFirstAdmin();
