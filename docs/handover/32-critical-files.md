# Top 25 Critical Files Ranked

## Overview

This document ranks and analyzes the top 25 most critical files in the **Velvet & Iron** codebase. Every incoming software engineer and systems architect must review these files to understand the operational mechanics, security posture, and business logic of the service.

---

## Master Ranking Matrix

| Rank | File Path | Component / Subsystem | Primary Purpose | Risk / Attention Level |
| :---: | :--- | :--- | :--- | :---: |
| **1** | `src/main.ts` | Bootstrap & Application Core | Entry point, global filters, pipes, CORS, Swagger setup | **Critical** |
| **2** | `src/app.module.ts` | NestJS Module Architecture | Root dependency injection tree, imports all 12 feature modules | **High** |
| **3** | `src/prisma/prisma.service.ts` | Data Access / ORM | Database connection lifecycle, PostgreSQL connection pool | **Critical** |
| **4** | `prisma/schema.prisma` | Data Model & Schema | Single source of truth for 13 database tables and 6 enums | **Critical** |
| **5** | `src/auth/auth.service.ts` | Authentication Engine | Password hashing, token generation, refresh rotation | **Critical** |
| **6** | `src/auth/auth.controller.ts` | Auth API Endpoints | Ingress for login, registration, refresh, and OAuth | **High** |
| **7** | `src/common/leveladd/leveladd.service.ts` | Gamification Core | XP engine, level math curve, 50 fantasy titles assignment | **High** |
| **8** | `src/profile/profile.service.ts` | Profile & Onboarding | User stats, daily login streak, companion/theme bindings | **High** |
| **9** | `src/revenuecat/revenuecat.service.ts` | Monetization / In-App Purchases | Webhook processing, VIP subscription lifecycle | **High** |
| **10** | `src/common/guards/jwt-auth.guard.ts` | Security & Access Control | Primary Passport JWT gatekeeper across all protected routes | **Critical** |
| **11** | `src/common/filters/all-exception.filter.ts` | Error Handling & Resilience | Global error boundary, Prisma error translation | **High** |
| **12** | `src/s3/s3.service.ts` | File Management & Storage | AWS S3 SDK v3 integration, image uploading | **Medium** |
| **13** | `src/s3/s3.controller.ts` | Storage API Endpoints | Image upload ingress (contains public upload flaw) | **High (Security)** |
| **14** | `src/meal-log/meal-log.service.ts` | Clinical Logging (Nutrition) | Meal/macro persistence, daily total aggregations | **High** |
| **15** | `src/macro-goal/macro-goal.controller.ts` | Nutrition API Endpoints | Macro goals CRUD (contains missing guard bug) | **High (Bug)** |
| **16** | `src/macro-goal/macro-goal.service.ts` | Nutrition Target Engine | Calorie calculation, protein/carb/fat goal formulas | **Medium** |
| **17** | `src/injection-log/injection-log.service.ts` | Clinical Logging (GLP-1) | Injection history, medication dosage, site rotation | **Medium** |
| **18** | `src/common/decorators/valid-user.decorator.ts` | Request Context Decorator | Extracts authenticated user payload from request object | **High** |
| **19** | `src/common/guards/optional-jwt.guard.ts` | Conditional Security Guard | Allows public browsing with authenticated context parsing | **Medium** |
| **20** | `src/auth/strategies/jwt.strategy.ts` | Passport Strategy | Extracts Bearer JWT, validates signature, extracts `sub` | **Medium** |
| **21** | `prisma-multischema.sh` | Build & Migration Script | Concatenates multi-file schemas into `prisma/schema.prisma` | **Medium** |
| **22** | `docker-compose.yml` | Infrastructure Orchestration | Production & local container stack (App, Postgres, Caddy) | **High** |
| **23** | `Caddyfile` | Reverse Proxy & SSL | HTTPS termination, static asset routing, proxy rules | **High** |
| **24** | `.github/workflows/ci.yml` | CI/CD Pipeline | Automated lint, build, and deployment automation | **Medium** |
| **25** | `src/user/user.controller.ts` | User Management API | User profile lookups (contains unauthenticated endpoint) | **High (Security)** |

---

## Detailed File Audits

### 1. `src/main.ts`
- **Component**: Bootstrap & Core Pipeline
- **Why It Is Critical**: Initializes the entire NestJS application. Sets up global filters (`AllExceptionFilter`), validation pipes (`ValidationPipe`), CORS rules, Swagger OpenAPI generator at `/api/docs`, and binds to `process.env.PORT || 5000`.
- **Key Symbols / Lines**:
  - `const app = await NestFactory.create(AppModule)`
  - `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`
  - `SwaggerModule.setup('api/docs', app, document)`
- **Gotchas / Traps**:
  - Contains a console log that outputs `process.env.DATABASE_URL` in development mode, which can leak database credentials in log aggregators.
  - Swagger setup references `/swagger-helper.js` which returns a 404 because the file was purged during the BeaverTail malware cleanup.

---

### 2. `src/app.module.ts`
- **Component**: NestJS Dependency Injection Root
- **Why It Is Critical**: Assembles all 12 functional domain modules (`AuthModule`, `UserModule`, `ProfileModule`, `MacroGoalModule`, `MealLogModule`, `ExerciseLogModule`, `WaterLogModule`, `InjectionLogModule`, `DailyTasksModule`, `StoreModule`, `S3Module`, `RevenuecatModule`) alongside infrastructure singletons (`PrismaModule`, `ConfigModule`).
- **Key Symbols / Lines**:
  - `@Module({ imports: [ ... ], providers: [ ... ] })`
- **Gotchas / Traps**:
  - Adding a new service or controller requires registering its module here; circular dependencies between `ProfileModule` and `LeveladdModule` must be avoided by keeping `LeveladdModule` strictly in `CommonModule`.

---

### 3. `src/prisma/prisma.service.ts`
- **Component**: Data Access & ORM Connection
- **Why It Is Critical**: Extends `PrismaClient` and implements `OnModuleInit` and `OnModuleDestroy`. Manages PostgreSQL connection pools and ensures clean database shutdowns.
- **Key Symbols / Lines**:
  - `async onModuleInit() { await this.$connect(); }`
  - `async onModuleDestroy() { await this.$disconnect(); }`
- **Gotchas / Traps**:
  - Unhandled connection failures here prevent the entire NestJS application from starting.

---

### 4. `prisma/schema.prisma`
- **Component**: Database Schema Definition
- **Why It Is Critical**: The canonical schema file for Prisma ORM containing all 13 models (`User`, `Profile`, `MacroGoal`, `MealLog`, `ExerciseLog`, `WaterLog`, `InjectionLog`, `DailyTask`, `AppTheme`, `AppCompanion`, `UserTheme`, `UserCompanion`, `RefreshToken`) and 6 enums.
- **Key Symbols / Lines**:
  - `model User { id String @id @default(uuid()) ... }`
  - `enum Role { USER ADMIN }`
- **Gotchas / Traps**:
  - **Do NOT edit this file directly**. It is generated by `prisma-multischema.sh` from sub-schemas in `prisma/schema/*.prisma`. Edits made directly to this file will be overwritten on the next build!

---

### 5. `src/auth/auth.service.ts`
- **Component**: Authentication & Token Management
- **Why It Is Critical**: Handles user credential validation, password verification with `bcrypt.compare`, dual JWT generation (`accessToken`, `refreshToken`), token refresh rotation, and token revocation upon logout.
- **Key Symbols / Lines**:
  - `validateUser(email, password)`
  - `generateTokens(userId, email, role)`
  - `refreshToken(oldRefreshToken)`
  - `logout(userId, refreshToken)`
- **Gotchas / Traps**:
  - Refresh tokens are hashed with bcrypt before saving to the database. When comparing incoming refresh tokens, `bcrypt.compare` must be run across active tokens.

---

### 6. `src/auth/auth.controller.ts`
- **Component**: Authentication HTTP Ingress
- **Why It Is Critical**: Defines public entry points for registration, login, token refresh, Discord OAuth redirects, and password reset requests.
- **Key Symbols / Lines**:
  - `@Post('register')`
  - `@Post('login')`
  - `@Post('refresh-token')`
  - `@Get('discord/callback')`
- **Gotchas / Traps**:
  - Lacks an IP or account-based rate limiter on `POST /login` and `POST /register`, making it vulnerable to brute-force credential stuffing.

---

### 7. `src/common/leveladd/leveladd.service.ts`
- **Component**: Gamification Engine
- **Why It Is Critical**: Manages the core leveling mechanics. Calculates level thresholds using an exponential curve, awards XP, promotes users through the 50 fantasy titles, and updates user profile records.
- **Key Symbols / Lines**:
  - `xpForLevel(level: number): number`
  - `addXp(userId: string, xpToAdd: number)`
  - `TITLES: string[]` (array of 50 rank titles)
- **Gotchas / Traps**:
  - Level calculations cap at Level 50. If a user reaches Level 50, further XP additions must not throw an index out-of-bounds error when referencing `TITLES[50]`.

---

### 8. `src/profile/profile.service.ts`
- **Component**: Profile & Gamification State
- **Why It Is Critical**: Handles onboarding completion, user bio updates, companion and theme equipping, and daily login streak progression.
- **Key Symbols / Lines**:
  - `completeOnboarding(userId, dto)`
  - `claimDailyLogin(userId)`
  - `equipCompanion(userId, companionId)`
  - `equipTheme(userId, themeId)`
- **Gotchas / Traps**:
  - Uses an in-memory `Map<string, number>` for tracking the 24-hour daily login cooldown. If the server process restarts or scales to multiple instances, this rate limit resets.

---

### 9. `src/revenuecat/revenuecat.service.ts`
- **Component**: Subscription Lifecycle Engine
- **Why It Is Critical**: Processes RevenueCat webhook events to grant or revoke VIP membership (`isVip: true/false`), unlocking premium companions and themes for paying subscribers.
- **Key Symbols / Lines**:
  - `handleWebhook(payload)`
  - Handles `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`.
- **Gotchas / Traps**:
  - Relies on `app_user_id` matching the backend `User.id` UUID exactly. If a user makes an anonymous purchase before logging in, entitlement mapping will fail unless aliasing is handled.

---

### 10. `src/common/guards/jwt-auth.guard.ts`
- **Component**: Access Control Guard
- **Why It Is Critical**: Protects sensitive endpoints by enforcing valid Passport JWT access tokens.
- **Key Symbols / Lines**:
  - `export class JwtAuthGuard extends AuthGuard('jwt')`
- **Gotchas / Traps**:
  - If applied at the controller level, all routes in that controller require authentication unless explicitly decorated with `@Public()`.

---

### 11. `src/common/filters/all-exception.filter.ts`
- **Component**: Global Error Boundary
- **Why It Is Critical**: Catches every unhandled exception across the entire application, intercepts Prisma database errors (`P2002`, `P2025`, `P2003`), and formats responses into a consistent JSON envelope: `{ statusCode, message, error, timestamp, path }`.
- **Key Symbols / Lines**:
  - `catch(exception: unknown, host: ArgumentsHost)`
  - Prisma error code translation block.
- **Gotchas / Traps**:
  - Masking internal database errors with generic messages is good for security, but can make debugging in development difficult without comprehensive terminal logging.

---

### 12. `src/s3/s3.service.ts`
- **Component**: File Storage Integration
- **Why It Is Critical**: Direct wrapper around AWS SDK v3 (`@aws-sdk/client-s3`). Handles file buffer uploads to S3, generates unique UUID file keys, and constructs public S3 object URLs.
- **Key Symbols / Lines**:
  - `uploadFile(file: Express.Multer.File, folder: string)`
  - `deleteFile(fileUrl: string)`
- **Gotchas / Traps**:
  - Does not enforce strict MIME type checking or file size validation at the service level; relies on caller configuration.

---

### 13. `src/s3/s3.controller.ts`
- **Component**: Storage HTTP Endpoints
- **Why It Is Critical**: Exposes endpoints for uploading single and multiple files to AWS S3.
- **Key Symbols / Lines**:
  - `@Post('upload')`
  - `@Post('upload-multiple')`
- **Gotchas / Traps**:
  - **Security Vulnerability**: These endpoints are completely public! They lack `@UseGuards(JwtAuthGuard)`, allowing unauthenticated actors to upload arbitrary files to your S3 bucket.

---

### 14. `src/meal-log/meal-log.service.ts`
- **Component**: Nutrition Logging Engine
- **Why It Is Critical**: Creates meal log entries, updates daily calorie and macronutrient sums, and awards gamification XP.
- **Key Symbols / Lines**:
  - `create(userId, createMealLogDto)`
  - `getDailyLogs(userId, date)`
- **Gotchas / Traps**:
  - **Confirmed Bug on Line 36**:
    ```typescript
    //if onboarded then add xp
    if (user && !user.onBoarded) {
      await this.leveladdService.addXp(userId, 10);
    }
    ```
    The negation operator `!` means only non-onboarded users receive XP. Onboarded users receive 0 XP for logging meals.

---

### 15. `src/macro-goal/macro-goal.controller.ts`
- **Component**: Nutrition Target HTTP Controller
- **Why It Is Critical**: Provides CRUD operations for user calorie and macronutrient targets.
- **Key Symbols / Lines**:
  - `@Get(':id')`
  - `@Delete(':id')`
- **Gotchas / Traps**:
  - **Confirmed Bug**: Lines 33 and 45 use `@ValidUser() user: User` but omit `@UseGuards(JwtAuthGuard)`. When called without a token, `user` is `undefined`, causing `user.id` to throw an unhandled `TypeError: Cannot read properties of undefined (reading 'id')`.

---

### 16. `src/macro-goal/macro-goal.service.ts`
- **Component**: Nutrition Target Calculator
- **Why It Is Critical**: Computes target caloric intake and macronutrient splits (protein, carbohydrates, fat) based on user goals (e.g., deficit, maintenance, surplus).
- **Key Symbols / Lines**:
  - `calculateMacros(calorieTarget, splitRatio)`
  - `getActiveGoal(userId)`
- **Gotchas / Traps**:
  - Ensure that the sum of calories derived from macros ($4 \times \text{protein} + 4 \times \text{carbs} + 9 \times \text{fat}$) aligns with the total calorie target to avoid user confusion.

---

### 17. `src/injection-log/injection-log.service.ts`
- **Component**: GLP-1 Clinical Schedule Engine
- **Why It Is Critical**: Records weekly GLP-1 injections (dose, medication name, subcutaneous injection site) and awards health milestone XP.
- **Key Symbols / Lines**:
  - `create(userId, createInjectionLogDto)`
  - `getInjectionHistory(userId)`
- **Gotchas / Traps**:
  - Also contains the inverted onboarding check bug (`!user.onBoarded`) when awarding XP.

---

### 18. `src/common/decorators/valid-user.decorator.ts`
- **Component**: Custom Parameter Decorator
- **Why It Is Critical**: Extracts the authenticated user object attached to `request.user` by Passport JWT Strategy and injects it into controller route handler arguments.
- **Key Symbols / Lines**:
  - `export const ValidUser = createParamDecorator((data, ctx) => ... )`
- **Gotchas / Traps**:
  - Always pair this decorator with `@UseGuards(JwtAuthGuard)`. If used on a public route, `request.user` will be undefined.

---

### 19. `src/common/guards/optional-jwt.guard.ts`
- **Component**: Optional Authorization Guard
- **Why It Is Critical**: Enables endpoints (such as Store listings) to be viewed by unauthenticated users while enriching the request context with user data if a valid JWT is provided.
- **Key Symbols / Lines**:
  - `handleRequest(err, user, info)`
- **Gotchas / Traps**:
  - Never assumes `user` is present in downstream services; callers must explicitly check `if (user) { ... }`.

---

### 20. `src/auth/strategies/jwt.strategy.ts`
- **Component**: Passport Authentication Strategy
- **Why It Is Critical**: Decodes the incoming Bearer token from the `Authorization` header, verifies the signature against `JWT_SECRET`, and returns the user payload.
- **Key Symbols / Lines**:
  - `ExtractJwt.fromAuthHeaderAsBearerToken()`
  - `validate(payload: JwtPayload)`
- **Gotchas / Traps**:
  - If `JWT_SECRET` in `.env` is empty or undefined, Passport falls back to a hardcoded string (`'secretKey'`), creating a security vulnerability.

---

### 21. `prisma-multischema.sh`
- **Component**: Build & Schema Concatenation Tool
- **Why It Is Critical**: A custom shell script that merges all sub-schemas in `prisma/schema/` (`auth.prisma`, `gamification.prisma`, `health.prisma`, `store.prisma`) into the root `prisma/schema.prisma`.
- **Key Symbols / Lines**:
  - `cat prisma/schema/*.prisma > prisma/schema.prisma`
- **Gotchas / Traps**:
  - Requires executable permissions (`chmod +x prisma-multischema.sh`).
  - Running on non-POSIX environments (native Windows CMD) requires Git Bash or WSL.

---

### 22. `docker-compose.yml`
- **Component**: Infrastructure Orchestration
- **Why It Is Critical**: Defines the multi-container deployment architecture: `velvet_backend_app` (NestJS), `velvet_backend_postgres` (PostgreSQL 16), and `velvet_backend_caddy` (Caddy reverse proxy).
- **Key Symbols / Lines**:
  - Service definitions, volume mounts, port bindings, and environment variable references.
- **Gotchas / Traps**:
  - Uses Docker internal networking. Ensure environment variables reference container names (e.g., `DATABASE_URL="postgresql://...:5432@postgres/..."`) in containerized environments.

---

### 23. `Caddyfile`
- **Component**: Reverse Proxy & TLS Engine
- **Why It Is Critical**: Manages SSL termination, security headers, static asset serving, and reverse proxying to the NestJS application container.
- **Key Symbols / Lines**:
  - `reverse_proxy velvet_backend_app:5000`
- **Gotchas / Traps**:
  - Line 20 references `reverse_proxy velvet_backend_postgres:7896` instead of `velvet_backend_prisma_studio:7896`, breaking port 8001 proxying.

---

### 24. `.github/workflows/ci.yml`
- **Component**: Continuous Integration Pipeline
- **Why It Is Critical**: Runs automated checks on every pull request and push to `main`.
- **Key Symbols / Lines**:
  - `pnpm install --frozen-lockfile`
  - `pnpm build`
- **Gotchas / Traps**:
  - Line 38 executes `pnpm format` instead of `pnpm test`. Unit tests are currently bypassed in the CI pipeline!

---

### 25. `src/user/user.controller.ts`
- **Component**: User Management API
- **Why It Is Critical**: Handles user account retrieval and user directory queries.
- **Key Symbols / Lines**:
  - `@Get()`
  - `@Get(':id')`
- **Gotchas / Traps**:
  - **Security Vulnerability**: `GET /user` and `GET /user/:id` have no authentication guards. Any unauthenticated caller can enumerate all registered users and their email addresses.

