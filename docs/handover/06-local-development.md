# Velvet & Iron Backend - Local Development Setup Guide

**Document ID:** `06-local-development.md`  
**Target Audience:** New Developers Onboarding to the Project  

---

## 1. Prerequisites & Required Software

Ensure you have the following installed on your workstation before starting:

| Tool | Version | Verification Command | Purpose |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.x` (LTS recommended) | `node -v` | JavaScript runtime engine |
| **pnpm** | `v9.x` or `v10.x` | `pnpm -v` | Primary package manager for the repository |
| **Docker & Docker Compose** | Docker Desktop (v24+) | `docker --version` | Local PostgreSQL containerization |
| **PostgreSQL Client** | `v15` or `v16` | `psql --version` | Optional CLI client for manual SQL inspection |
| **Git** | `2.x` | `git --version` | Version control |

---

## 2. Step-by-Step Setup Guide

### Step 1: Clone and Inspect Working Tree
```bash
git clone <repository-url> velvet_iron_backend
cd velvet_iron_backend
```

### Step 2: Install Dependencies via `pnpm`
Do **not** use `npm install` or `yarn` directly; use `pnpm` to preserve the lockfile structure (`pnpm-lock.yaml`):
```bash
pnpm install
```

> [!NOTE]
> In CI and Docker, an explicit `pnpm add express` command was used. Under modern `pnpm install`, `express` is already listed in `package.json` dependencies.

### Step 3: Configure Environment File
Copy the reference template into your active `.env`:
```bash
cp .env.example .env
```
Open `.env` in your editor and configure the minimum variables required for local boot:
```ini
PORT=3200
NODE_ENV=development
SERVER_NAME=velvet_backend

# PostgreSQL Credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=velvet_iron_dev
POSTGRES_PORT=5432

# Local Database URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/velvet_iron_dev?schema=public"

# JWT Authentication
JWT_SECRET=local_development_jwt_secret_key_minimum_32_chars_long
ACCESS_TOKEN_EXPIRATION_MS=86400000
REFRESH_TOKEN_EXPIRATION_MS=172800000

# Email Verification (set false for frictionless local testing)
EMAIL_VERIFICATION_REQUIRED=false

# AWS S3 (Leave dummy values if not testing file uploads locally)
AWS_ACCESS_KEY_ID=dummy_key
AWS_SECRET_ACCESS_KEY=dummy_secret
AWS_REGION=us-east-1
AWS_BUCKET_REGION=us-east-1
AWS_S3_BUCKET_NAME=dummy_bucket
```

### Step 4: Start PostgreSQL Database
You can either run a native local PostgreSQL instance or run it via Docker:
```bash
docker run -d \
  --name velvet_postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=velvet_iron_dev \
  -p 5432:5432 \
  postgres:16-alpine
```

### Step 5: Execute Database Migrations and Generate Prisma Client
Use the actual `package.json` script:
```bash
pnpm mg
# This runs: npx prisma migrate dev && npx prisma generate
```
This will apply the SQL migrations inside `prisma/migrations/` and generate the compiled Prisma Client inside `prisma/generated/client`.

### Step 6: Seed the Database
Seed the required starter Themes, Lore Companions, and Super Admin:
```bash
pnpm seed
# This runs: ts-node prisma/seed.ts
```

> [!NOTE]
> The backend also has an internal `SeedService` in `src/common/seed.service.ts` that runs automatically on server startup via `OnModuleInit`. If `pnpm seed` was already executed, `SeedService` will safely detect existing records and log `Theme already exists`, `Companions already exist`.

### Step 7: Launch the Development Server
```bash
pnpm start:dev
# or: pnpm sdev
```
Expected terminal output:
```text
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [PrismaService] data base connected
[Nest] LOG [SeedService] 🌱 Checking seed data...
[Nest] LOG [SeedService] 📦 Themes already exist (4 found)
[Nest] LOG [SeedService] 🐉 Companions already exist (4 found)
[Nest] LOG [SeedService] ✅ Seed data check completed
[Nest] LOG [NestApplication] Nest application successfully started
API docs available at http://localhost:3200/api-docs
```

---

## 3. Verified NPM Script Reference (`package.json`)

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `pnpm build` | `nest build` | Compiles TypeScript source to `./dist` |
| `pnpm start:dev` | `nest start --watch` | Starts development server with hot-reload |
| `pnpm sdev` | `nest start --watch` | Alias shortcut for `start:dev` |
| `pnpm start:debug` | `nest start --debug --watch` | Starts dev server with Node inspector listening on port 9229 |
| `pnpm start:prod` | `node dist/main` | Runs the compiled production build |
| `pnpm mg` | `npx prisma migrate dev && npx prisma generate` | Runs pending migrations and re-generates Prisma client |
| `pnpm reset` | `npx prisma migrate reset --force && npx prisma generate` | **DESTRUCTIVE:** Wipes database, reapplies migrations, regenerates client |
| `pnpm mgsdev` | `pnpm mg && nest start --watch` | Migrates, generates, and starts server in one step |
| `pnpm rmgsdev` | `rm -rf prisma/migrations prisma/generated && ...` | **HIGH RISK:** Nukes migration history and rebuilds an `init` migration |
| `pnpm studio` | `npx prisma studio` | Launches Prisma Studio GUI at `http://localhost:5555` |
| `pnpm seed` | `ts-node prisma/seed.ts` | Runs standalone database seed script |
| `pnpm test` | `jest` | Runs unit test suite (`*.spec.ts`) |
| `pnpm test:e2e` | `jest --config ./test/jest-e2e.json` | Runs end-to-end test suite |
| `pnpm format` | `prettier --write "src/**/*.ts" "test/**/*.ts"` | Formats code with Prettier |
| `pnpm lint` | `eslint "{src,apps,libs,test}/**/*.ts" --fix` | Runs ESLint and auto-fixes issues |

---

## 4. Common Startup Pitfalls & Solutions

### 1. `Cannot find module 'generated/client'` or Prisma Type Errors
* **Symptom:** Build fails with `Cannot find module 'generated/client'` or symbol errors.
* **Root Cause:** `tsconfig.json` maps `"generated/*": ["prisma/generated/*"]`. If `npx prisma generate` has not run, that directory is missing or stale.
* **Solution:** Run `npx prisma generate`.

### 2. Missing `public` Folder Warning or 404 on `/swagger-helper.js`
* **Symptom:** In console or browser: `GET /swagger-helper.js 404 (Not Found)`.
* **Root Cause:** In `src/main.ts`, `app.useStaticAssets(join(__dirname, '..', 'public'))` is called, but the `public` directory was deleted in commit `6f20aba` during supply-chain malware removal.
* **Solution:** Create an empty `public/` folder at project root and add an empty `swagger-helper.js` file:
  ```bash
  mkdir -p public && touch public/swagger-helper.js
  ```

### 3. Database Connection Refused (`P1001`)
* **Symptom:** `PrismaClientInitializationError: Can't reach database server at localhost:5432`.
* **Solution:** Verify that your PostgreSQL Docker container or local service is running via `docker ps` and that the password/port match `DATABASE_URL`.

### 4. Discord Login Fails on Redirect
* **Symptom:** Clicking Discord login throws `UnauthorizedException` or redirect error.
* **Root Cause:** Discord requires an exact match for the redirect URL in Developer Portal.
* **Solution:** Ensure `DISCORD_CALLBACK_URL` in `.env` matches the URL registered in the Discord Developer Portal (e.g. `http://localhost:3200/auth/discord/callback`).

