# Database Seeding Guide

This guide explains how to seed your database with initial data including themes, companions, and a super admin user.

## Prerequisites

Before running the seed script, make sure you have:

1. A running PostgreSQL database
2. Prisma schema synced with your database (run migrations)
3. Environment variables configured in your `.env` file

## Environment Variables

Add the following variables to your `.env` file for super admin creation:

```env
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=your_super_secure_password_here
```

**⚠️ Important:** Change these values to secure credentials before deploying to production!

## Seed Data

The seed script will create:

### Themes (4 total)

| Name           | Tagline             | Description                                          | Unlock XP |
| -------------- | ------------------- | ---------------------------------------------------- | --------- |
| **Adventurer** | Embrace the Journey | For those who seek excitement and new experiences    | 0 (Free)  |
| **Reader**     | Knowledge is Power  | For those who find wisdom in books and stories       | 500       |
| **Mage**       | Master the Arcane   | For those who harness the power of magic and mystery | 1000      |
| **Gamer**      | Level Up Your Life  | For those who turn every challenge into a game       | 1500      |

### Companions (4 total)

| Name                    | Title                 | Quote                                                                    | Unlock XP |
| ----------------------- | --------------------- | ------------------------------------------------------------------------ | --------- |
| **Ser Kael Thornwatch** | The Unbroken          | "Stand tall. We finish what we start — together."                        | 0 (Free)  |
| **Riven Ashcroft**      | High Lord of the Veil | "Try not to disappoint me… I was just starting to enjoy your potential." | 750       |
| **Pyraxis**             | The Emberbound        | "Rise, little warrior. I don't guard the weak — I forge the strong."     | 1250      |
| **Bram Ironledger**     | Keeper of the Codex   | "Every hero stumbles, child. What matters is that you rise wiser."       | 2000      |

### Super Admin

If environment variables are configured, a super admin account will be created with:

- Email from `SUPERADMIN_EMAIL`
- Username from `SUPERADMIN_USERNAME`
- Password (hashed) from `SUPERADMIN_PASSWORD`
- Role: `SUPERADMIN`
- Email verified: `true`
- Status: Active

## Running the Seed Script

### Option 1: Standalone Seed Command

```bash
pnpm seed
```

### Option 2: With Prisma Reset (⚠️ Development Only)

This will reset your database and re-run all migrations before seeding:

```bash
pnpm reset
```

The seed script will automatically run after migrations when using `prisma migrate reset` or `prisma migrate dev`.

### Option 3: Manual Execution

```bash
ts-node prisma/seed.ts
```

## Output

When the seed script runs successfully, you should see:

```
🌱 Seeding database...
📦 Creating themes...
  ✓ Theme: Adventurer
  ✓ Theme: Reader
  ✓ Theme: Mage
  ✓ Theme: Gamer
🐉 Creating companions...
  ✓ Companion created: Ser Kael Thornwatch - The Unbroken
  ✓ Companion created: Riven Ashcroft - High Lord of the Veil
  ✓ Companion created: Pyraxis - The Emberbound
  ✓ Companion created: Bram Ironledger - Keeper of the Codex
👑 Creating super admin...
  ✓ Super Admin created: admin@example.com (superadmin)
  ✓ Super Admin profile created
✅ Seeding completed successfully!
```

## Idempotent Seeding

The seed script is **idempotent**, meaning:

- Running it multiple times won't create duplicates
- Themes are upserted by name (updates if exists, creates if not)
- Companions are checked by name before creating/updating
- Super admin is upserted by email

This allows you to safely re-run the seed script without worrying about duplicate data.

## Troubleshooting

### "Missing environment variables" Warning

If you see this warning, the super admin won't be created. Add the required environment variables to your `.env` file.

### "Invalid URL" Error

This means your `DATABASE_URL` is not properly configured. Check your `.env` file and ensure it matches this format:

```env
DATABASE_URL="postgresql://username:password@localhost:port/database?schema=public"
```

### Prisma Client Not Generated

If you get import errors, run:

```bash
npx prisma generate
```

## Companion Character Descriptions

### Ser Kael Thornwatch — The Unbroken

- **Personality:** Steadfast, loyal, Brienne-of-Tarth energy
- **Style:** Honorable knight, unwavering support

### Riven Ashcroft — High Lord of the Veil

- **Personality:** Sarcastic, witty, charming, morally-grey
- **Style:** Elegant antagonist turned mentor, refined encouragement

### Pyraxis — The Emberbound

- **Personality:** Sassy dragon, strength + integrity, Tairn-coded
- **Style:** Fierce but protective, tough love approach

### Bram Ironledger — Keeper of the Codex

- **Personality:** Wise elder, patient teacher, experienced guide
- **Style:** Gentle wisdom, emphasis on learning from failure

## Next Steps

After seeding:

1. Verify the data using Prisma Studio: `pnpm studio`
2. Test the super admin login credentials
3. Check that themes and companions appear correctly in your application
4. Consider creating additional custom seed data for your specific needs

## Production Considerations

- ✅ Always use strong passwords for super admin
- ✅ Run seeds on initial deployment only
- ✅ Consider separating production seeds from development seeds
- ✅ Never commit `.env` file with production credentials
- ✅ Use secure environment variable management in production (AWS Secrets Manager, etc.)
