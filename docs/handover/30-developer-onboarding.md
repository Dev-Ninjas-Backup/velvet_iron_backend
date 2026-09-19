# Developer Onboarding Checklist & Ramp-Up Guide

## Overview

Welcome to the **Velvet & Iron** backend engineering team. This guide is your tactical operational checklist for taking ownership of the backend service. It is designed to take you from a fresh clone to productive contribution within your first few days, while keeping you aware of the architectural nuances, legacy traps, and security history of this codebase.

---

## Part 1: Day 1 — Environment Setup & Verification

Follow this checklist strictly in sequence. Do not skip verification steps.

### 1.1 Prerequisites Verification

Ensure your host system meets the required runtime baselines:

- [ ] **Node.js**: `v20.18.0` or higher (`node -v`).
  - *Recommendation*: Use `nvm` or `fnm`:
    ```bash
    nvm install 20.18.0
    nvm use 20.18.0
    ```
- [ ] **Package Manager**: `pnpm` version `9.12.3` or higher (`pnpm -v`).
  - If missing: `corepack enable && corepack prepare pnpm@9.12.3 --activate`
- [ ] **Container Engine**: Docker Desktop or Colima running Docker Engine 24+ (`docker --version`, `docker compose version`).
- [ ] **Database Client / CLI**: `psql` (PostgreSQL CLI client) or a GUI like TablePlus, DBeaver, or pgAdmin 4.
- [ ] **HTTP Client**: Postman, Insomnia, or the VS Code REST Client extension.

---

### 1.2 Repository & Workspace Initialization

- [ ] **Inspect Git State**:
  ```bash
  git status
  git branch -a
  git log -n 5 --oneline
  ```
  > [!CAUTION]
  > **Security Notice**: Note commit `6f20aba` ("Deleted BeaverTail malware"). The repository recently underwent remediation for a malicious supply-chain intrusion that targeted developer machines via VS Code settings and encoded payloads in `fa-solid-500.woff2`. Verify that no unexpected scripts exist in `.vscode/tasks.json` or `.vscode/launch.json`.

- [ ] **Install Dependencies via pnpm**:
  ```bash
  pnpm install --frozen-lockfile
  ```
  Verify that all 45 production and 23 development dependencies install cleanly without node-gyp build failures.

---

### 1.3 Environment Configuration (`.env`)

- [ ] **Copy Template**:
  ```bash
  cp .env.example .env
  ```
  *(If `.env.example` is not present, create `.env` using the template below).*

- [ ] **Populate Local Development Values**:
  ```ini
  # Server
  PORT=5000
  NODE_ENV=development
  CLIENT_APP_URL="http://localhost:3000"

  # Database (Local Docker Postgres)
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/velvet_iron?schema=public"

  # JWT Secrets (Generate secure random 64-char hex strings)
  JWT_SECRET="local-dev-jwt-access-secret-32-chars-minimum-key!!"
  JWT_REFRESH_SECRET="local-dev-jwt-refresh-secret-32-chars-minimum-key!!"
  JWT_EXPIRES_IN="15m"
  JWT_REFRESH_EXPIRES_IN="7d"

  # Email / SMTP (Ethereal or Mailtrap recommended for dev)
  EMAIL_HOST="smtp.ethereal.email"
  EMAIL_PORT=587
  EMAIL_USER="dev-test@ethereal.email"
  EMAIL_PASS="dev-secret-password"
  EMAIL_FROM="Velvet & Iron <noreply@velvetandiron.com>"

  # AWS S3 (Leave dummy strings if S3 testing is mocked)
  AWS_ACCESS_KEY_ID="test"
  AWS_SECRET_ACCESS_KEY="test"
  AWS_REGION="us-east-1"
  AWS_S3_BUCKET_NAME="velvet-iron-dev"

  # Discord OAuth2 (Dummy values allow startup; real values needed for OAuth test)
  DISCORD_CLIENT_ID="123456789012345678"
  DISCORD_CLIENT_SECRET="test-discord-secret"
  DISCORD_REDIRECT_URI="http://localhost:5000/api/auth/discord/callback"

  # Webhooks
  REVENUECAT_WEBHOOK_SECRET="local-webhook-test-secret"
  ```

---

### 1.4 Database Startup & Schema Migration

- [ ] **Start Local PostgreSQL Container**:
  ```bash
  docker compose up -d postgres
  ```
  Verify the container is healthy:
  ```bash
  docker ps --filter "name=velvet_backend_postgres"
  ```

- [ ] **Run Prisma Schema Generation**:
  ```bash
  pnpm prisma:generate
  ```
  *Note*: This executes `prisma-multischema.sh` to merge the multi-file schema located in [prisma/schema/](file:///Users/betopia/Downloads/projects/velvet_iron_backend/prisma/schema/) into `prisma/schema.prisma` before generating `@prisma/client`.

- [ ] **Push Schema to Local Database**:
  ```bash
  pnpm prisma:push
  ```
  Verify all 13 tables (`User`, `Profile`, `MacroGoal`, `MealLog`, `ExerciseLog`, `WaterLog`, `InjectionLog`, `DailyTask`, `AppTheme`, `AppCompanion`, `UserTheme`, `UserCompanion`, `RefreshToken`) are created in PostgreSQL.

- [ ] **Seed Initial Themes & Companions**:
  Check if a seed script exists in `package.json`. If not, run a one-time script or insert the starter theme and companion directly via Prisma Studio:
  ```bash
  pnpm prisma studio
  ```
  (Opens Prisma Studio at `http://localhost:5555`). Ensure at least one `AppTheme` (`name: "Iron Vanguard"`, `isVip: false`) and one `AppCompanion` (`name: "Seraphina"`, `isVip: false`) exist so the onboarding endpoint does not fail.

---

### 1.5 Application Startup & Smoke Testing

- [ ] **Launch Development Server**:
  ```bash
  pnpm start:dev
  ```
  Observe the NestJS bootstrap logs. Confirm:
  - `AppModule dependencies initialized`
  - `RoutesResolver` mapped all controllers: `/auth`, `/user`, `/profile`, `/macro-goal`, `/meal-log`, `/exercise-log`, `/water-log`, `/injection-log`, `/daily-tasks`, `/store`, `/s3`, `/revenuecat`.
  - `Nest application successfully started on port 5000`.

- [ ] **Verify Swagger Documentation**:
  Open your browser to:
  ```
  http://localhost:5000/api/docs
  ```
  - Verify Swagger UI loads.
  - *Note*: If the browser console logs a 404 for `/swagger-helper.js`, refer to [docs/handover/13-frontend.md](file:///Users/betopia/Downloads/projects/velvet_iron_backend/docs/handover/13-frontend.md) to understand why the script was removed during the malware cleanup.

- [ ] **Execute Registration Smoke Test**:
  ```bash
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email": "dev-tester@example.com",
      "password": "Password123!",
      "name": "Dev Pioneer"
    }'
  ```
  Expected Response: `201 Created` with `accessToken`, `refreshToken`, and `user` object.

---

## Part 2: Initial Codebase Investigation (Days 2–3)

Spend your first two days tracing how data flows through the application and inspecting the architectural boundaries.

### 2.1 Authentication & Session Trace

- [ ] **Inspect Dual-Token JWT Logic**:
  - Open [src/auth/auth.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/auth/auth.service.ts).
  - Trace `login()`, `generateTokens()`, `refreshToken()`, and `logout()`.
  - Notice how `RefreshToken` records are stored in PostgreSQL with a bcrypt-hashed token string, and how `logout()` deletes the record matching the provided refresh token.
- [ ] **Inspect JWT Passport Strategy**:
  - Open [src/auth/strategies/jwt.strategy.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/auth/strategies/jwt.strategy.ts).
  - Understand the payload extraction: `sub` maps to `user.id`.
- [ ] **Inspect the Auth Guards**:
  - Open [src/common/guards/jwt-auth.guard.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/common/guards/jwt-auth.guard.ts) (`JwtAuthGuard`).
  - Open [src/common/guards/optional-jwt.guard.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/common/guards/optional-jwt.guard.ts) (`OptionalJwtGuard`).
  - Open [src/common/decorators/valid-user.decorator.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/common/decorators/valid-user.decorator.ts) (`@ValidUser()`).

---

### 2.2 Gamification & Business Logic Engines

- [ ] **Inspect the Level Engine**:
  - Open [src/common/leveladd/leveladd.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/common/leveladd/leveladd.service.ts).
  - Review the exponential XP formula: `xpForLevel(lvl) = Math.floor(100 * Math.pow(1.15, lvl - 1))`.
  - Review the 50 level titles array (`TITLES`).
  - Trace `addXp(userId, xpToAdd)`.
- [ ] **Audit the Inverted Onboarding Check**:
  - Open [src/meal-log/meal-log.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/meal-log/meal-log.service.ts#L36).
  - Notice:
    ```typescript
    //if onboarded then add xp
    if (user && !user.onBoarded) {
      await this.leveladdService.addXp(userId, 10);
    }
    ```
  - Read [docs/handover/12-business-rules.md](file:///Users/betopia/Downloads/projects/velvet_iron_backend/docs/handover/12-business-rules.md#critical-business-logic-flaws) and [docs/handover/25-technical-debt.md](file:///Users/betopia/Downloads/projects/velvet_iron_backend/docs/handover/25-technical-debt.md) for details on why this bug exists across 7 logging services.
- [ ] **Inspect Daily Login Streak Engine**:
  - Open [src/profile/profile.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/profile/profile.service.ts#L42).
  - Trace `claimDailyLogin()`. Notice the 24-hour rate limit stored in-memory (`Map<string, number>`) rather than in Redis or the database.

---

### 2.3 External Integrations & Webhooks

- [ ] **Inspect RevenueCat Webhook**:
  - Open [src/revenuecat/revenuecat.controller.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/revenuecat/revenuecat.controller.ts) and [src/revenuecat/revenuecat.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/revenuecat/revenuecat.service.ts).
  - Review how `app_user_id` is mapped to `userId`.
  - Review the `INITIAL_PURCHASE`, `RENEWAL`, and `CANCELLATION` event handlers.
- [ ] **Inspect AWS S3 Service**:
  - Open [src/s3/s3.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/s3/s3.service.ts).
  - Notice the direct `@aws-sdk/client-s3` usage with Multer memory storage.
  - Review the security observation in [docs/handover/24-security-review.md](file:///Users/betopia/Downloads/projects/velvet_iron_backend/docs/handover/24-security-review.md): `POST /s3/upload` lacks an authentication guard!

---

## Part 3: Before Making Any Changes (Week 1 Ramp-Up)

Before writing any feature code or refactoring existing logic:

### 3.1 Quality Gate Check

- [ ] **Execute Existing Tests**:
  ```bash
  pnpm test
  ```
  Notice that only 2 test files exist ([src/app.controller.spec.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/app.controller.spec.ts) and [src/auth/auth.service.spec.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/auth/auth.service.spec.ts)). Test coverage is currently `< 2%`.

- [ ] **Run Linter and Formatter**:
  ```bash
  pnpm lint
  pnpm format
  ```
  Ensure your editor/IDE is configured with Prettier and ESLint using the root `.eslintrc.js` and `.prettierrc`.

- [ ] **Verify CI Workflow Anomaly**:
  - Inspect [.github/workflows/ci.yml](file:///Users/betopia/Downloads/projects/velvet_iron_backend/.github/workflows/ci.yml).
  - Notice that line 38 runs `pnpm format` instead of `pnpm test`. Be aware that tests are currently not run automatically in CI.

---

### 3.2 Git Branching & Contribution Workflow

- [ ] **Branch Naming Standard**:
  - Feature: `feat/<feature-name>` (e.g., `feat/fix-onboarding-xp-gate`)
  - Bug Fix: `fix/<ticket-or-description>` (e.g., `fix/macro-goal-missing-guard`)
  - Refactoring: `refactor/<module-name>`
  - Security Patch: `sec/<cve-or-vulnerability>`
- [ ] **Commit Message Convention**:
  - Follow Conventional Commits: `type(scope): concise description`
  - Examples:
    - `fix(meal-log): correct inverted onboarding check for XP award`
    - `feat(auth): add rate limiter to POST /auth/login`
    - `sec(s3): protect upload endpoints with JwtAuthGuard`
- [ ] **Pull Request Guidelines**:
  - Every PR must include unit tests for new or modified services.
  - No PR may commit secrets or `.env` files.
  - If schema changes are made, include both the sub-schema in `prisma/schema/` and the generated root `prisma/schema.prisma`.

---

## Part 4: Immediate Takeover Tasks (First 30 Days)

Priority roadmap for the incoming engineer:

| Priority | Task | Target File | Impact |
| :--- | :--- | :--- | :--- |
| **P0 (Day 1)** | Fix MacroGoal Missing Guard | `src/macro-goal/macro-goal.controller.ts` | Prevents 500 crash on `GET /macro-goal/:id` |
| **P0 (Day 2)** | Secure Public Endpoints | `src/user/user.controller.ts`, `src/s3/s3.controller.ts` | Blocks public user harvesting & unrestricted S3 uploads |
| **P0 (Day 3)** | Correct Inverted Onboarding Logic | 7 logging services (`meal-log`, `exercise-log`, etc.) | Restores gamification XP progression to all active users |
| **P1 (Week 1)** | Fix Caddy Proxy Container Name | `Caddyfile` line 20 | Restores Prisma Studio proxy on port 8001 |
| **P1 (Week 2)** | Move In-Memory Rate Limit to Redis | `src/profile/profile.service.ts` | Prevents exploit of daily login streak across restarts |
| **P2 (Week 3)** | Add `/health` Endpoint & Sentry | `src/app.controller.ts`, `src/main.ts` | Production observability and liveness probes |
| **P2 (Week 4)** | Expand Unit & Integration Test Suite | `test/` and `src/**/*.spec.ts` | Increases test coverage from 2% to 60%+ |

