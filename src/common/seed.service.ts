import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedDatabase();
  }

  private async seedDatabase() {
    try {
      this.logger.log('🌱 Checking seed data...');

      await this.seedThemes();
      await this.seedCompanions();
      await this.seedSuperAdmin();

      this.logger.log('✅ Seed data check completed');
    } catch (error) {
      this.logger.error('❌ Error during seed data check:', error);
    }
  }

  private async seedThemes() {
    const themes = [
      {
        name: 'Adventurer',
        tagline: 'Embrace the Journey',
        description: 'For those who seek excitement and new experiences',
        unlockXp: 250,
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

    // Migrate legacy theme names if they exist in the database
    const readerTheme = await this.prisma.client.theme.findUnique({
      where: { name: 'Reader' },
    });
    if (readerTheme) {
      await this.prisma.client.theme.update({
        where: { id: readerTheme.id },
        data: { name: 'Scribe' },
      });
      this.logger.log('  ✓ Migrated theme: Reader -> Scribe');
    }

    const gamerTheme = await this.prisma.client.theme.findUnique({
      where: { name: 'Gamer' },
    });
    if (gamerTheme) {
      await this.prisma.client.theme.update({
        where: { id: gamerTheme.id },
        data: { name: 'Realmwalker' },
      });
      this.logger.log('  ✓ Migrated theme: Gamer -> Realmwalker');
    }

    this.logger.log('📦 Seeding / syncing themes...');
    for (const theme of themes) {
      await this.prisma.client.theme.upsert({
        where: { name: theme.name },
        update: theme,
        create: theme,
      });
      this.logger.log(`  ✓ Synced theme: ${theme.name}`);
    }
  }

  private async seedCompanions() {
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

    // Migrate legacy companion names if present
    const legacyMigrations = [
      { from: 'Riven Ashcroft', to: 'Riven' },
      { from: 'Ser Kael Thornwatch', to: 'Thyra' },
      { from: 'Bram Ironledger', to: 'General Leon' },
      { from: 'Pyraxis', to: 'Visepheron' },
    ];

    for (const mig of legacyMigrations) {
      const legacyComp = await this.prisma.client.companion.findFirst({
        where: { name: mig.from },
      });
      if (legacyComp) {
        const destComp = await this.prisma.client.companion.findFirst({
          where: { name: mig.to },
        });
        if (!destComp) {
          await this.prisma.client.companion.update({
            where: { id: legacyComp.id },
            data: { name: mig.to },
          });
          this.logger.log(`  ✓ Migrated companion: ${mig.from} -> ${mig.to}`);
        }
      }
    }

    this.logger.log('🐉 Seeding / syncing companions...');
    for (const companion of companions) {
      const existing = await this.prisma.client.companion.findFirst({
        where: { name: companion.name },
      });

      if (existing) {
        await this.prisma.client.companion.update({
          where: { id: existing.id },
          data: companion,
        });
        this.logger.log(
          `  ✓ Updated companion: ${companion.name} - ${companion.title}`,
        );
      } else {
        await this.prisma.client.companion.create({
          data: companion,
        });
        this.logger.log(
          `  ✓ Created companion: ${companion.name} - ${companion.title}`,
        );
      }
    }
  }

  private async seedSuperAdmin() {
    const superAdminEmail = this.configService.get<string>('SUPERADMIN_EMAIL');
    const superAdminUsername = this.configService.get<string>(
      'SUPERADMIN_USERNAME',
    );
    const superAdminPassword = this.configService.get<string>(
      'SUPERADMIN_PASSWORD',
    );

    if (!superAdminEmail || !superAdminUsername || !superAdminPassword) {
      this.logger.warn(
        '⚠️  Skipping super admin creation: Missing environment variables',
      );
      this.logger.warn(
        '   Required: SUPERADMIN_EMAIL, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD',
      );
      return;
    }

    const existingSuperAdmin = await this.prisma.client.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (!existingSuperAdmin) {
      this.logger.log('👑 Creating super admin...');
      const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

      const superAdmin = await this.prisma.client.user.create({
        data: {
          email: superAdminEmail,
          username: superAdminUsername,
          password: hashedPassword,
          role: 'SUPERADMIN',
          emailVerified: true,
          isActive: true,
          name: 'Super Admin',
        },
      });

      await this.prisma.client.userProfile.create({
        data: {
          userId: superAdmin.id,
          totalEarnXp: 0,
          balanceXp: 0,
          level: 1,
        },
      });

      this.logger.log(
        `  ✓ Super Admin created: ${superAdmin.email} (${superAdmin.username})`,
      );
    } else {
      this.logger.log(
        `👑 Super Admin already exists: ${existingSuperAdmin.email}`,
      );
    }
  }
}
