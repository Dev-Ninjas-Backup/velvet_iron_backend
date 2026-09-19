import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';

// Load and expand environment variables
const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || '',
});

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 Seeding database...');

  // =====================
  // 1. Seed Themes
  // =====================
  const themes = [
    {
      name: 'Adventurer',
      tagline: 'Embrace the Journey',
      description: 'For those who seek excitement and new experiences',
      unlockXp: 250, // Free starter theme
    },
    {
      name: 'Scribe',
      tagline: 'Knowledge is Power',
      description: 'For those who find wisdom in books and stories',
      unlockXp: 250,
    },
    {
      name: 'Mage',
      tagline: 'Master the Arcane',
      description: 'For those who harness the power of magic and mystery',
      unlockXp: 250,
    },
    {
      name: 'Realmwalker',
      tagline: 'Level Up Your Life',
      description: 'For those who turn every challenge into a game',
      unlockXp: 250,
    },
  ];

  // Check and migrate legacy themes if present
  const readerTheme = await prisma.theme.findUnique({
    where: { name: 'Reader' },
  });
  if (readerTheme) {
    await prisma.theme.update({
      where: { id: readerTheme.id },
      data: { name: 'Scribe' },
    });
    console.log('  ✓ Migrated theme: Reader -> Scribe');
  }

  const gamerTheme = await prisma.theme.findUnique({
    where: { name: 'Gamer' },
  });
  if (gamerTheme) {
    await prisma.theme.update({
      where: { id: gamerTheme.id },
      data: { name: 'Realmwalker' },
    });
    console.log('  ✓ Migrated theme: Gamer -> Realmwalker');
  }

  console.log('📦 Creating themes...');
  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { name: theme.name },
      update: theme,
      create: theme,
    });
    console.log(`  ✓ Theme: ${theme.name}`);
  }

  // =====================
  // 2. Seed Companions
  // =====================
  const companions = [
    {
      name: 'Riven',
      title: 'High Lord of the Forsaken Court',
      quote: 'Come now. We have things to accomplish.',
      unlockXp: 0, // Free starter companion
    },
    {
      name: 'Thyra',
      title: 'Shield of the Realm',
      quote:
        'A shield is only as strong as the one who holds it. Take care of yourself.',
      unlockXp: 250,
    },
    {
      name: 'General Leon',
      title: 'Commander of the Legions',
      quote:
        'Discipline is choosing what you want most over what you want now.',
      unlockXp: 250,
    },
    {
      name: 'Visepheron',
      title: 'Ancient Dragon',
      quote: 'Come, little flame. Burn steadily today.',
      unlockXp: 250,
    },
  ];

  // Check and migrate legacy companions if present
  const legacyMigrations = [
    { from: 'Riven Ashcroft', to: 'Riven' },
    { from: 'Ser Kael Thornwatch', to: 'Thyra' },
    { from: 'Bram Ironledger', to: 'General Leon' },
    { from: 'Pyraxis', to: 'Visepheron' },
  ];

  for (const mig of legacyMigrations) {
    const legacyComp = await prisma.companion.findFirst({
      where: { name: mig.from },
    });
    if (legacyComp) {
      const destComp = await prisma.companion.findFirst({
        where: { name: mig.to },
      });
      if (!destComp) {
        await prisma.companion.update({
          where: { id: legacyComp.id },
          data: { name: mig.to },
        });
        console.log(`  ✓ Migrated companion: ${mig.from} -> ${mig.to}`);
      }
    }
  }

  console.log('🐉 Creating / syncing companions...');
  for (const companion of companions) {
    const existing = await prisma.companion.findFirst({
      where: { name: companion.name },
    });

    if (existing) {
      await prisma.companion.update({
        where: { id: existing.id },
        data: companion,
      });
      console.log(
        `  ✓ Companion updated: ${companion.name} - ${companion.title}`,
      );
    } else {
      await prisma.companion.create({
        data: companion,
      });
      console.log(
        `  ✓ Companion created: ${companion.name} - ${companion.title}`,
      );
    }
  }

  // =====================
  // 3. Seed Super Admin
  // =====================
  const superAdminEmail = process.env.SUPERADMIN_EMAIL;
  const superAdminUsername = process.env.SUPERADMIN_USERNAME;
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminUsername || !superAdminPassword) {
    console.warn(
      '⚠️  Skipping super admin creation: Missing environment variables',
    );
    console.warn(
      '   Required: SUPERADMIN_EMAIL, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD',
    );
  } else {
    console.log('👑 Creating super admin...');
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {
        username: superAdminUsername,
        password: hashedPassword,
        role: 'SUPERADMIN',
        emailVerified: true,
        isActive: true,
      },
      create: {
        email: superAdminEmail,
        username: superAdminUsername,
        password: hashedPassword,
        role: 'SUPERADMIN',
        emailVerified: true,
        isActive: true,
        name: 'Super Admin',
      },
    });

    console.log(
      `  ✓ Super Admin created: ${superAdmin.email} (${superAdmin.username})`,
    );

    // Create UserProfile for super admin if it doesn't exist
    await prisma.userProfile.upsert({
      where: { userId: superAdmin.id },
      update: {},
      create: {
        userId: superAdmin.id,
        totalEarnXp: 0,
        balanceXp: 0,
        level: 1,
      },
    });
    console.log(`  ✓ Super Admin profile created`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
