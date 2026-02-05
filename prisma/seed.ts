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
      unlockXp: 0, // Free starter theme
    },
    {
      name: 'Reader',
      tagline: 'Knowledge is Power',
      description: 'For those who find wisdom in books and stories',
      unlockXp: 500,
    },
    {
      name: 'Mage',
      tagline: 'Master the Arcane',
      description: 'For those who harness the power of magic and mystery',
      unlockXp: 1000,
    },
    {
      name: 'Gamer',
      tagline: 'Level Up Your Life',
      description: 'For those who turn every challenge into a game',
      unlockXp: 1500,
    },
  ];

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
      name: 'Ser Kael Thornwatch',
      title: 'The Unbroken',
      quote: 'Stand tall. We finish what we start — together.',
      unlockXp: 0, // Free starter companion
    },
    {
      name: 'Riven Ashcroft',
      title: 'High Lord of the Veil',
      quote:
        'Try not to disappoint me… I was just starting to enjoy your potential.',
      unlockXp: 750,
    },
    {
      name: 'Pyraxis',
      title: 'The Emberbound',
      quote:
        "Rise, little warrior. I don't guard the weak — I forge the strong.",
      unlockXp: 1250,
    },
    {
      name: 'Bram Ironledger',
      title: 'Keeper of the Codex',
      quote: 'Every hero stumbles, child. What matters is that you rise wiser.',
      unlockXp: 2000,
    },
  ];

  console.log('🐉 Creating companions...');
  for (const companion of companions) {
    // Check if companion exists by name
    const existing = await prisma.companion.findFirst({
      where: { name: companion.name },
    });

    if (existing) {
      // Update existing companion
      await prisma.companion.update({
        where: { id: existing.id },
        data: companion,
      });
      console.log(
        `  ✓ Companion updated: ${companion.name} - ${companion.title}`,
      );
    } else {
      // Create new companion
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
