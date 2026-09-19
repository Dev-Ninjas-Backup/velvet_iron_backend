# Velvet & Iron Backend - "Where Do I Change This?" Developer Guide

**Document ID:** `28-where-to-change-guide.md`  
**Target Audience:** New Developers taking over tickets and feature requests  

---

## 1. Quick Task Lookup Table

Use this direct index to find the exact source files to inspect and modify for common maintenance tasks:

| Developer Task | Primary Files to Modify | Secondary Files / Configurations |
| :--- | :--- | :--- |
| **Change login logic or JWT payload** | `src/auth/auth.service.ts` (`login`, `generateTokens`) | `src/common/optional-auth.guard.ts`, `src/lib/strategy/jwt.ts` |
| **Change token expiration times** | `.env` (`ACCESS_TOKEN_EXPIRATION_MS`) | `src/auth/auth.service.ts` (Lines 159–166) |
| **Fix the inverted onboarding XP bug**| `src/meal-log/meal-log.service.ts` (Line 50)<br>`src/exercise-log/exercise-log.service.ts` (Lines 39, 71)<br>`src/mood-log/mood-log.service.ts` (Line 76)<br>`src/weight-log/weight-log.service.ts` (Line 57)<br>`src/medication/medication.service.ts` (Line 32) | `src/leveladd/leveladd.service.ts` |
| **Modify the XP-to-Level formula** | `src/leveladd/levelCalculator.ts` (`calculateLevel`) | `src/leveladd/levelStatus.ts`, `src/profile/profile.service.ts` |
| **Add or edit RPG rank titles** | `src/leveladd/levelStatus.ts` (`levelStatus` array) | `src/leveladd/levelCalculator.ts` (level cap) |
| **Modify daily health quests** | `src/xp-stats/xp-stats.service.ts` (`getTodayQuestXp`) | `src/xp-stats/dto/xp-stats-response.dto.ts` |
| **Change theme unlock costs or level gates**| `src/leveladd/levelCalculator.ts` (`availableThemesForLevel`)<br>`src/theme/theme.service.ts` (`unlockTheme`, `getMyThemes`) | `prisma/schema/gamification.prisma` (`Theme.unlockXp`) |
| **Change companion unlock costs or gates**| `src/leveladd/levelCalculator.ts` (`availableCompanionForLevel`)<br>`src/companion/companion.service.ts` (`unlockCompanion`) | `prisma/schema/gamification.prisma` (`Companion.unlockXp`) |
| **Change meal calorie calculation** | `src/meal-log/meal-log.service.ts` (`calculateCalories`) | `src/meal-schedule/meal-schedule.service.ts`, `src/macro-goal/macro-goal.service.ts` |
| **Change user permissions or roles** | `src/common/decorators/validate.decorator.ts`<br>`src/common/guards/role.guard.ts` | `prisma/schema/user.prisma` (`UserRole` enum) |
| **Change email templates or sender info**| `src/email/email.service.ts`<br>`src/email/email.module.ts` | `.env` (`MAIL_USER`, `MAIL_FROM_NAME`, `MAIL_PASSWORD`) |
| **Change Discord mobile deep link** | `src/auth/auth.controller.ts` (Line 519) | `.env` (`FLUTTER_DEEP_LINK_URL`) |
| **Change RevenueCat webhook secret** | `src/payment/payment.controller.ts` (Line 25) | `.env` (`REVENUECAT_WEBHOOK_SECRET`) |
| **Add or alter database columns** | `prisma/schema/*.prisma` (Target model) | `prisma.config.ts`, run `pnpm mg` |
| **Fix missing Swagger helper script** | Create `public/swagger-helper.js` | `src/main.ts` (Line 42) |
| **Fix macro goal crash bug on :id** | `src/macro-goal/macro-goal.controller.ts` (Lines 100, 173) | Add `@ValidUser()` decorator |
| **Change CORS origins or headers** | `src/main.ts` (Lines 56–74) | Reverse proxy `Caddyfile` |
| **Change production server port** | `docker-compose.yml` (`SERVER_PORT`), `Dockerfile` (`EXPOSE`) | `.env` (`PORT`, `SERVER_PORT`), `Caddyfile` |
| **Fix Caddy Prisma Studio 502 error** | `Caddyfile` (Line 20) | Change `velvet_backend_postgres:7896` to `velvet_backend_prisma_studio:7896` |

