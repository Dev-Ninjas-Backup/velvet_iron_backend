# Velvet & Iron Backend - Troubleshooting & Diagnostic Runbook

**Document ID:** `26-troubleshooting.md`  
**Target Audience:** Support Engineers, On-Call Developers, DevOps Engineers  

---

## 1. Troubleshooting Guide Matrix

### Problem 1: Database Connection Refused on Startup (`P1001`)
* **Symptoms:** Backend crashes on boot with `PrismaClientInitializationError: Can't reach database server at localhost:5432`.
* **Likely Location:** `.env` / `DATABASE_URL` / `src/lib/prisma/prisma.service.ts`.
* **Diagnosis:** Check if PostgreSQL container is running: `docker ps | grep postgres`. Verify host and port.
* **Potential Cause:** Docker container stopped, port conflict with native PostgreSQL on port 5432, or incorrect credentials in `DATABASE_URL`.
* **Safe Resolution:** 
  ```bash
  docker compose --profile prod up -d postgres
  # Or verify DATABASE_URL in .env matches the running instance
  ```

---

### Problem 2: Cannot Find Module `'generated/client'`
* **Symptoms:** TypeScript compiler or `pnpm start:dev` fails with `Cannot find module 'generated/client' or its corresponding type declarations`.
* **Likely Location:** `tsconfig.json` paths mapping or `prisma/generated/`.
* **Diagnosis:** Check if `prisma/generated/client` exists.
* **Potential Cause:** Dependencies installed, but Prisma Client generation has not been executed yet.
* **Safe Resolution:**
  ```bash
  pnpm mg
  # Or directly: npx prisma generate
  ```

---

### Problem 3: Users Not Receiving XP for Logging Meals/Medications
* **Symptoms:** A user logs a meal, workout, or medication, and the API returns 201 Created, but their `totalEarnXp` and `level` do not increase.
* **Likely Location:** `src/meal-log/meal-log.service.ts` (line 50) and other logging services.
* **Relevant Logs:** No `xp_logs` row created for the action.
* **Potential Cause:** The inverted onboarding logic bug: `if (user && !user.onBoarded)`. If the user has completed onboarding (`onBoarded: true`), XP is skipped!
* **Safe Resolution:** Update code in logging services to `if (user && user.onBoarded)` or award XP unconditionally.

---

### Problem 4: 502 Bad Gateway on Prisma Studio (`:8001` / `velvet.db.softvence.app`)
* **Symptoms:** Visiting `https://velvet.db.softvence.app` or `http://localhost:8001` yields Caddy 502 Bad Gateway.
* **Likely Location:** `Caddyfile` (line 20).
* **Diagnosis:** Check container name in `docker compose ps`. Notice the container is named `velvet_backend_prisma_studio`, while Caddy targets `velvet_backend_postgres:7896`.
* **Safe Resolution:** Edit `Caddyfile` to target `velvet_backend_prisma_studio:7896`, then reload Caddy:
  ```bash
  sudo docker compose --profile prod exec caddy caddy reload
  ```

---

### Problem 5: Discord OAuth Callback Fails or Redirects to White Screen
* **Symptoms:** User clicks Discord login, authorizes, but browser hangs or redirects with `velvetapp://... error=discord_auth_failed`.
* **Likely Location:** `src/auth/auth.controller.ts` (line 481) and `src/lib/strategy/discord.strategy.ts`.
* **Relevant Logs:** `console.error('Discord callback error:', error)`.
* **Potential Cause:** 
  1. `DISCORD_CALLBACK_URL` in `.env` does not match the Redirect URI configured in Discord Developer Portal.
  2. Missing `DISCORD_CLIENT_ID` or `DISCORD_CLIENT_SECRET`.
  3. The client is not running on a mobile device configured to handle the `velvetapp://` custom scheme.
* **Safe Resolution:** Update `.env` with exact matching Discord Developer credentials and ensure tests are performed on a device with the Flutter app installed.

---

### Problem 6: `GET /macro-goal/:id` Throws Internal Server Error
* **Symptoms:** Requesting a specific macro goal by ID returns `500 Internal Server Error`.
* **Likely Location:** `src/macro-goal/macro-goal.controller.ts` (line 100).
* **Diagnosis:** Terminal log shows `TypeError: Cannot read properties of undefined (reading 'id')`.
* **Potential Cause:** Missing `@ValidUser()` decorator on `@Get(':id')` and `@Delete(':id')` handlers, causing `@GetUser() user` to be undefined.
* **Safe Resolution:** Add `@ValidUser()` decorator above `@Get(':id')` and `@Delete(':id')`.

---

### Problem 7: 404 on `/swagger-helper.js` in Swagger UI
* **Symptoms:** Browser console displays `GET http://localhost:3200/swagger-helper.js 404 (Not Found)`.
* **Likely Location:** Missing `public/` directory at repository root.
* **Diagnosis:** Check if `public` folder exists.
* **Potential Cause:** Folder deleted during malware audit.
* **Safe Resolution:**
  ```bash
  mkdir -p public && touch public/swagger-helper.js
  ```

