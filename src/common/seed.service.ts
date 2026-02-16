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
        unlockXp:250,
      },
      {
        name: 'Reader',
        tagline: 'Knowledge is Power',
        description: 'For those who find wisdom in books and stories',
        unlockXp:250,
      },
      {
        name: 'Mage',
        tagline: 'Master the Arcane',
        description: 'For those who harness the power of magic and mystery',
        unlockXp:250,
      },
      {
        name: 'Gamer',
        tagline: 'Level Up Your Life',
        description: 'For those who turn every challenge into a game',
        unlockXp:250,
      },
    ];

    const existingThemesCount = await this.prisma.client.theme.count();

    if (existingThemesCount === 0) {
      this.logger.log('📦 Seeding themes...');
      for (const theme of themes) {
        await this.prisma.client.theme.create({ data: theme });
        this.logger.log(`  ✓ Created theme: ${theme.name}`);
      }
    } else {
      this.logger.log(`📦 Themes already exist (${existingThemesCount} found)`);
    }
  }

  private async seedCompanions() {
    const companions = [
      {
        name: 'Ser Kael Thornwatch',
        title: 'The Unbroken',
        quote: 'Stand tall. We finish what we start — together.',
        unlockXp:250,
      },
      {
        name: 'Riven Ashcroft',
        title: 'High Lord of the Veil',
        quote:
          'Try not to disappoint me… I was just starting to enjoy your potential.',
        unlockXp:250,
      },
      {
        name: 'Pyraxis',
        title: 'The Emberbound',
        quote:
          "Rise, little warrior. I don't guard the weak — I forge the strong.",
        unlockXp:250,
      },
      {
        name: 'Bram Ironledger',
        title: 'Keeper of the Codex',
        quote:
          'Every hero stumbles, child. What matters is that you rise wiser.',
        unlockXp:250,
      },
    ];

    const existingCompanionsCount = await this.prisma.client.companion.count();

    if (existingCompanionsCount === 0) {
      this.logger.log('🐉 Seeding companions...');
      for (const companion of companions) {
        await this.prisma.client.companion.create({ data: companion });
        this.logger.log(
          `  ✓ Created companion: ${companion.name} - ${companion.title}`,
        );
      }
    } else {
      this.logger.log(
        `🐉 Companions already exist (${existingCompanionsCount} found)`,
      );
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
