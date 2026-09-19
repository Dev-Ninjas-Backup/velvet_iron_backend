# Velvet & Iron Backend - Complete Repository Structure

**Document ID:** `03-repository-structure.md`  
**Target Audience:** All Engineers  

---

## 1. Top-Level Repository Directory Map

```text
/Users/betopia/Downloads/projects/velvet_iron_backend/
├── .dockerignore                     # Docker build exclusion rules
├── .env                              # Active environment configuration file
├── .env.example                      # Reference template for all environment variables
├── .git/                             # Git repository metadata
├── .github/                          # GitHub Actions workflows & CI/CD
│   └── workflows/ci.yml              # Build, test, Docker push, and SSH deploy pipeline
├── .gitignore                        # Git ignore patterns
├── .prettierrc                       # Code formatting rules (Prettier)
├── .vscode/                          # Visual Studio Code workspace settings
│   ├── extensions.json               # Recommended VS Code extensions
│   ├── launch.json                   # Debugging configs (contains obsolete SST/Vitest configs)
│   ├── settings.json                 # Editor & linter settings (cleaned after malware audit)
│   ├── spellright.dict               # Custom dictionary
│   └── tasks.json                    # Workspace build/start/test tasks
├── API_DOCS_README.md                # Swagger generation guide
├── API_DOCUMENTATION.html            # Static HTML view of the API documentation
├── API_DOCUMENTATION.md              # 2,800+ line developer API specification
├── API_DOCUMENTATION.pdf             # Compiled PDF version of API documentation
├── Caddyfile                         # Caddy 2 reverse proxy configuration
├── Dockerfile                        # Multi-stage production container build definition
├── README.md                         # Legacy authentication template README
├── convert-to-pdf.js                 # Puppeteer markdown-to-pdf script (Windows hardcoded path)
├── docker-compose.yml                # Multi-service stack (Postgres, Server, Prisma Studio, Caddy)
├── md/                               # Historical developer notes, guides, and feature drafts (24 files)
├── nest-cli.json                     # NestJS CLI configuration
├── package.json                      # NPM dependencies, scripts, and package metadata
├── pnpm-lock.yaml                    # Lockfile for pnpm package manager
├── prisma/                           # Database ORM configuration, schema, migrations, seed
│   ├── generated/                    # Generated Prisma client output (`generated/client`)
│   ├── migrations/                   # PostgreSQL migration SQL files
│   │   ├── 20260223122959_init/      # Core database tables, enums, and foreign keys
│   │   ├── 20260224155228_subcription/ # RevenueCat subscription and event tables
│   │   └── migration_lock.toml       # Locked to 'postgresql' provider
│   ├── schema/                       # Multi-file Prisma schema directory (11 files)
│   │   ├── gamification.prisma       # Theme, Companion, UserTheme, UserCompanion
│   │   ├── health-tracking.prisma    # Weight, Mood, Meals, Meds, Exercises
│   │   ├── macro-goal.prisma         # Macronutrient target model
│   │   ├── onboarding.prisma         # Onboarding state tracking model
│   │   ├── payments.prisma           # Subscription and SubscriptionEvent models
│   │   ├── quests.prisma             # Quest and UserQuest models (DB models exist; see notes)
│   │   ├── schema.prisma             # Generator and datasource config
│   │   ├── subscription.prisma       # 0-byte empty file (superseded by payments.prisma)
│   │   ├── user.prisma               # Core User, RefreshToken, and Session models
│   │   ├── userProfile.prisma        # UserProfile, balanceXp, totalEarnXp, level
│   │   └── xp-log.prisma             # Immutable historical XP log
│   └── seed.ts                       # Standalone database seed script
├── prisma.config.ts                  # Prisma 7 CLI configuration defining schema and migrations path
├── security-scanner-v2.py            # Python forensic malware and supply-chain scanner script
├── src/                              # NestJS Application Source Code
│   ├── app.controller.spec.ts        # Unit test for AppController (Hello World)
│   ├── app.controller.ts             # Root controller (GET / -> "Hello World!")
│   ├── app.module.ts                 # Master application module importing all feature modules
│   ├── app.service.ts                # Root service returning "Hello World!"
│   ├── main.ts                       # Application entry point, Swagger bootstrap, CORS, pipes
│   ├── auth/                         # Authentication & Social Identity module
│   ├── aws/                          # AWS S3 integration module
│   ├── common/                       # Shared decorators, guards, filters, hash/password utilities
│   ├── companion/                    # Companion unlock & active selection module
│   ├── email/                        # Nodemailer / SMTP email delivery module
│   ├── exercise-log/                 # Exercise recording and workout schedule module
│   ├── leveladd/                     # XP addition, level computation & title status engine
│   ├── lib/                          # PrismaService & Passport strategies (JWT, Local, Discord)
│   ├── macro-goal/                   # Macronutrient target calculation module
│   ├── main/                         # Main sub-module group
│   │   └── xp-timeout/               # 24-hour rate limiting module for XP claims
│   ├── meal-log/                     # Meal logging and automated calorie derivation module
│   ├── meal-schedule/                # Meal scheduling and taken-verification module
│   ├── medication/                   # GLP-1 and general medication master registry
│   ├── medication-schedule/          # Medication dosing schedule & adherence module
│   ├── mood-log/                     # Mood, energy, and hunger tracking module
│   ├── onboarding/                   # User onboarding flow & free starter asset selection
│   ├── payment/                      # RevenueCat webhook handler & subscription status
│   ├── profile/                      # User profile aggregation, leaderboards & analytics
│   ├── s3/                           # Generic public file upload controller
│   ├── theme/                        # UI theme unlock & active selection module
│   ├── user/                         # Internal user CRUD module (excluded from Swagger)
│   ├── weight-log/                   # Daily weight logging & weekly delta analytics
│   └── xp-stats/                     # Daily quest checklist & XP period statistics
├── structure.txt                     # Developer scratchpad note regarding Bangladesh timezone
├── test/                             # End-to-end test suite
│   ├── app.e2e-spec.ts               # Supertest e2e test for GET /
│   └── jest-e2e.json                 # Jest configuration for e2e tests
├── test-auth.http                    # VS Code REST Client test requests for Auth endpoints
├── test-google-auth.http             # VS Code REST Client test requests for Firebase Google Auth
├── test-token-refresh.http           # VS Code REST Client test requests for Dual-Token Refresh
├── tsconfig.build.json               # TypeScript config for production builds (excludes tests)
└── tsconfig.json                     # Main TypeScript compiler configuration with path aliases
```

---

## 2. Detailed Breakdown of Key Directories

### `src/auth/`
* **Purpose:** Handles all user authentication, token generation, password resets, email OTP verification, Firebase social login, and Discord OAuth.
* **Important Files:**
  * `auth.controller.ts`: 21 endpoints exposed, token cookie & header emission.
  * `auth.service.ts`: 1,000 lines of authentication logic, bcrypt hashing, session creation, OTP logic.
  * `services/firebase-auth.service.ts`: Lazy Firebase Admin SDK initialization and ID token verification.
  * `socialLogin.html`: Static web client for browser-based OAuth testing.
  * `dto/*.dto.ts`: Validation DTOs for register, login, OTP, profile, and passwords.
* **Status:** Actively used.

### `src/common/`
* **Purpose:** Cross-cutting concerns used across all feature modules.
* **Important Files:**
  * `all-exception.filter.ts`: Catches all exceptions, handles Prisma `P2002`, `P2025`, `P2003` errors, outputs standard error response.
  * `optional-auth.guard.ts`: `OptionalJwtGuard` implements automatic token rotation.
  * `decorators/validate.decorator.ts`: Composite decorators `@ValidUser()`, `@ValidAdmin()`, `@ValidSuperAdmin()`.
  * `decorators/get-user.decorator.ts`: Extracts current user ID or object from request.
  * `guards/role.guard.ts`: Verifies user role against route `@Roles()`.
  * `seed.service.ts`: Runs on `OnModuleInit` to seed initial Themes, Companions, and Super Admin.
  * `hashText.ts` & `password-generator.ts`: Cryptographic utilities.
* **Status:** Actively used.

### `src/leveladd/`
* **Purpose:** The core gamification and XP computation engine.
* **Important Files:**
  * `leveladd.service.ts`: Increments user balance/total XP, logs entry to `xp_logs`, re-computes level.
  * `levelCalculator.ts`: Contains `calculateLevel(xp)` and level unlock limit functions.
  * `levelStatus.ts`: Array mapping levels 1–50 to fantasy titles.
* **Status:** Actively used by all logging and profile modules.

### `src/health-tracking modules` (`meal-log`, `meal-schedule`, `medication`, `medication-schedule`, `exercise-log`, `mood-log`, `weight-log`, `macro-goal`)
* **Purpose:** Provides complete CRUD and historical aggregation for the health pillars.
* **Design Pattern:** Each module contains `*.controller.ts`, `*.service.ts`, `*.module.ts`, and `dto/`. Controllers accept `multipart/form-data` with `AnyFilesInterceptor()` to handle mobile form submissions flexibly.
* **Status:** Actively used.

### `src/payment/`
* **Purpose:** Ingests external RevenueCat webhooks, verifies authorization Bearer secret, updates subscription status, and records historical events.
* **Status:** Actively used.

### `src/lib/`
* **Purpose:** Core infrastructure adapters.
* **Important Files:**
  * `prisma/prisma.service.ts`: PrismaClient wrapper with `@prisma/adapter-pg`.
  * `strategy/jwt.ts`: Passport JWT extraction from Bearer header and cookies.
  * `strategy/local.strategy.ts`: Passport local username/password validation.
  * `strategy/discord.strategy.ts`: Discord OAuth validation.
* **Status:** Actively used.

### `prisma/`
* **Purpose:** Defines the data models, migration history, and database seeding.
* **Multi-file Schema:** Configured via `prisma.config.ts` targeting `prisma/schema`.
* **Important Files:**
  * `prisma/schema/*.prisma`: 11 schema modules.
  * `prisma/seed.ts`: Standalone seed script executable via `pnpm seed`.
  * `prisma/generated/`: Contains compiled Prisma Client (`import from 'generated/client'`).
* **Status:** Actively used.

---

## 3. Dead, Unused, or Suspicious Files Inventory

| File Path | Classification | Detailed Rationale |
| :--- | :--- | :--- |
| `prisma/schema/subscription.prisma` | **Dead Code** | 0-byte empty file. Subscription models were relocated to `payments.prisma`. Can be safely deleted. |
| `convert-to-pdf.js` | **Fragile / Defective** | Contains a hardcoded local Windows file path (`C:\Users\Shamim Rana\...`) for Puppeteer; fails on macOS/Linux. |
| `structure.txt` | **Scratchpad Note** | Unused text scratchpad describing Bangladesh timezone formatting. Not code. |
| `src/auth/dto/update-auth.dto.ts` | **Dead Code** | Leftover NestJS CLI boilerplate DTO; not imported anywhere. |
| `src/lib/prisma/dto/*.dto.ts` | **Dead Code** | Boilerplate DTOs inside `src/lib/prisma/dto/`; unused. |
| `src/user/entities/user.entity.ts` | **Dead Code** | Empty stub entity class from NestJS generator. |
| `src/main/xp-timeout/entities/` | **Dead Code** | Empty stub entity class. |
| `security-scanner-v2.py` | **Utility / Forensic** | Standalone Python security script used to detect supply-chain malware. Keep for ongoing security audits. |
| `md/` (24 markdown files) | **Legacy Documentation** | Historical developer notes from February 2026. Contains useful context but has discrepancies with current code. |
| `public/` (Missing Directory) | **Missing Asset** | `src/main.ts` attempts to mount `../public` statically for `/swagger-helper.js`. Deleted during malware cleanup; needs restoration of legitimate files. |

