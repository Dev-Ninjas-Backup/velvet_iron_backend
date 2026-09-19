# Velvet & Iron Backend - Environment Configuration Guide

**Document ID:** `05-environment-configuration.md`  
**Target Audience:** DevOps Engineers, Backend Engineers, System Administrators  

---

## 1. Master Environment Variables Reference

All real secrets, API keys, passwords, and private certificates in this table have been replaced with `[REDACTED]` in accordance with documentation security rules.

| Variable Name | Purpose / Description | Required? | Consuming Module | Safe Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Local application HTTP listening port | Optional (Default: `3000`) | `src/main.ts` | `3200` |
| `NODE_ENV` | Runtime environment mode | Required | Multiple (`main.ts`, `auth.controller.ts`) | `development` / `production` |
| `SERVER_NAME` | Identifier used to name containers, compose services, and DBs | Required for Docker | `docker-compose.yml`, `main.ts`, `seed.service.ts` | `velvet_backend` |
| `IMMAGE_NAME` | Docker image tag repository and version (note spelling in code) | Required for CI/CD | `docker-compose.yml`, `ci.yml` | `yourdockerhub/velvet_backend:latest` |
| `POSTGRES_USER` | PostgreSQL superuser username | Required for DB | `docker-compose.yml`, Prisma connection | `velvet_backend_user` |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password | Required for DB | `docker-compose.yml`, Prisma connection | `[REDACTED]` |
| `POSTGRES_DB` | PostgreSQL primary database name | Required for DB | `docker-compose.yml`, Prisma connection | `velvet_backend_DB` |
| `POSTGRES_PORT` | PostgreSQL external port mapping | Optional (Default: `5432`) | `docker-compose.yml` | `5432` / `7458` |
| `DATABASE_URL` | Prisma PostgreSQL connection string | **CRITICAL** | `src/lib/prisma/prisma.service.ts`, `prisma.config.ts` | `postgresql://user:[REDACTED]@localhost:5432/db?schema=public` |
| `SERVER_PORT` | Host port exposed for backend API container | Required for Docker | `docker-compose.yml` | `6000` |
| `PRISMA_STUDIO_PORT` | Container internal port for Prisma Studio | Optional | `docker-compose.yml` | `7896` |
| `PRISMA_STUDIO_PORT_LOCAL`| Host port mapped for Prisma Studio | Optional | `docker-compose.yml` | `8462` |
| `JWT_SECRET` | Secret key used to sign and verify JWT access and refresh tokens | **CRITICAL** | `src/auth/auth.module.ts`, `src/lib/strategy/jwt.ts` | `[REDACTED]` |
| `ACCESS_TOKEN_EXPIRATION_MS` | Access token lifespan in milliseconds | Optional | `src/auth/auth.service.ts`, `auth.controller.ts` | `86400000` (1 day) |
| `REFRESH_TOKEN_EXPIRATION_MS`| Refresh token lifespan in milliseconds | Optional | `src/auth/auth.service.ts`, `auth.controller.ts` | `172800000` (2 days) |
| `EMAIL_VERIFICATION_REQUIRED`| Toggle enforcing email verification before permitting login | Optional (Default: `false`) | `src/auth/auth.service.ts` | `false` / `true` |
| `SUPERADMIN_EMAIL` | Email address for bootstrapped super admin account | Optional | `src/common/seed.service.ts`, `prisma/seed.ts` | `admin@velvetandiron.com` |
| `SUPERADMIN_USERNAME` | Username for bootstrapped super admin account | Optional | `src/common/seed.service.ts`, `prisma/seed.ts` | `superadmin` |
| `SUPERADMIN_PASSWORD` | Password for bootstrapped super admin account | Optional | `src/common/seed.service.ts`, `prisma/seed.ts` | `[REDACTED]` |
| `MAIL_HOST` | SMTP server hostname | Optional (Default: `smtp.gmail.com`) | `src/email/email.module.ts` | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP server port | Optional (Default: `587`) | `src/email/email.module.ts` | `587` |
| `MAIL_USER` | SMTP username / sender email | Required for Email | `src/email/email.module.ts` | `alerts@velvetandiron.com` |
| `MAIL_PASSWORD` | SMTP password or Google App Password | Required for Email | `src/email/email.module.ts` | `[REDACTED]` |
| `MAIL_FROM_NAME` | Display name in outgoing email headers | Optional | `src/email/email.module.ts` | `Velvet & Iron Support` |
| `MAIL_FROM` | From email address in outgoing email headers | Optional | `src/email/email.module.ts` | `noreply@velvetandiron.com` |
| `AWS_ACCESS_KEY_ID` | IAM Access Key ID with S3 PutObject permissions | Required for Uploads | `src/aws/aws.service.ts` | `AKIA[REDACTED]` |
| `AWS_SECRET_ACCESS_KEY` | IAM Secret Access Key | Required for Uploads | `src/aws/aws.service.ts` | `[REDACTED]` |
| `AWS_REGION` | AWS datacenter region | Required for S3 | Referenced in `.env.example` | `eu-north-1` |
| `AWS_BUCKET_REGION` | AWS region variable actually read by code | Required for S3 | Read by `src/aws/aws.service.ts` (Line 9) | `eu-north-1` |
| `AWS_S3_BUCKET_NAME` | Target S3 bucket name | Required for Uploads | `src/aws/aws.service.ts` | `velvet-iron-assets` |
| `FIREBASE_PROJECT_ID` | Firebase console project ID | Required for Social Auth | `src/auth/services/firebase-auth.service.ts` | `velvet-iron-app` |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin service account private RSA key | Required for Social Auth | `src/auth/services/firebase-auth.service.ts` | `"-----BEGIN PRIVATE KEY-----\n[REDACTED]\n-----END PRIVATE KEY-----\n"` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service account client email | Required for Social Auth | `src/auth/services/firebase-auth.service.ts` | `firebase-adminsdk@[REDACTED].iam.gserviceaccount.com` |
| `google` | Flag indicating Google login is enabled | Optional (Swagger flag) | `src/main.ts` | `true` |
| `facebook` | Flag indicating Facebook login is enabled | Optional (Swagger flag) | `src/main.ts` | `true` |
| `apple` | Flag indicating Apple login is enabled | Optional (Swagger flag) | `src/main.ts` | `true` |
| `DISCORD_CLIENT_ID` | Discord Developer Portal Application Client ID | Required for Discord | `src/lib/strategy/discord.strategy.ts`, `main.ts` | `146477[REDACTED]` |
| `DISCORD_CLIENT_SECRET` | Discord Developer Portal Application Client Secret | Required for Discord | `src/lib/strategy/discord.strategy.ts`, `main.ts` | `[REDACTED]` |
| `DISCORD_CALLBACK_URL` | Redirect URI registered in Discord OAuth settings | Required for Discord | `src/lib/strategy/discord.strategy.ts`, `main.ts` | `https://api.velvetandiron.com/auth/discord/callback` |
| `FRONTEND_URL` | Web client URL for post-authentication redirects | Optional | Referenced in `.env.example` | `http://localhost:3000` |
| `FLUTTER_DEEP_LINK_URL` | Deep link custom URI scheme to redirect auth to Flutter app | Required for Discord Mobile | `src/auth/auth.controller.ts` (Line 519) | `velvetapp://auth/discordapp` |
| `REVENUECAT_WEBHOOK_SECRET` | Cryptographic secret for verifying RevenueCat webhook Bearer header | Required for In-App Purchases | `src/payment/payment.controller.ts` (Line 25) | `[REDACTED]` |
| `EC2_HOST` | Target AWS EC2 host IP / DNS for automated SSH deployment | Required for CI/CD | `.github/workflows/ci.yml` | `[REDACTED]` |
| `EC2_USER` | SSH login user on EC2 instance | Required for CI/CD | `.github/workflows/ci.yml` | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH key for EC2 authentication | Required for CI/CD | `.github/workflows/ci.yml` | `[REDACTED]` |
| `DOCKER_USERNAME` | Docker Hub username for pushing container image | Required for CI/CD | `.github/workflows/ci.yml` | `[REDACTED]` |
| `DOCKER_PASSWORD` | Docker Hub access token or password | Required for CI/CD | `.github/workflows/ci.yml` | `[REDACTED]` |

---

## 2. Critical Configuration Traps & Discrepancies

### Trap 1: `AWS_REGION` vs. `AWS_BUCKET_REGION`
* **The Discrepancy:** `.env.example` specifies `AWS_REGION=eu-north-1`.
* **The Code:** `src/aws/aws.service.ts` at line 9 reads:
  ```typescript
  region: process.env.AWS_BUCKET_REGION,
  ```
* **Consequence:** If you set `AWS_REGION` in `.env`, AWS S3 requests will fail or fall back to default US East because `AWS_BUCKET_REGION` is undefined.
* **Resolution:** Set **both** `AWS_REGION` and `AWS_BUCKET_REGION` to the same region in your `.env`.

### Trap 2: Token Expiration Calculation Math
* **The Code:** In `src/auth/auth.service.ts`:
  ```typescript
  const accessTokenExpiration =
    Number(this.configService.get<string>('ACCESS_TOKEN_EXPIRATION_MS')) / 86400000 || 15;
  ```
  The resulting number is passed to JWT sign as `${accessTokenExpiration}d` (DAYS, not minutes!).
* **Consequence:** If `ACCESS_TOKEN_EXPIRATION_MS` is set to `86400000` (1 day in milliseconds), $86400000 / 86400000 = 1$, giving `1d`. If the variable is unset, `Number(undefined)` is `NaN`, so `NaN || 15` evaluates to `15`, creating a **15-day access token**, even though the code comments say `// 15 minutes`!

### Trap 3: Docker Compose PostgreSQL Healthcheck User
* In `docker-compose.yml`:
  ```yaml
  healthcheck:
    test: ['CMD-SHELL', 'pg_isready -U postgres']
  ```
  If `POSTGRES_USER` in `.env` is set to `${SERVER_NAME}_user` (e.g. `velvet_backend_user`), the PostgreSQL container will not initialize a default user named `postgres`. As a result, `pg_isready -U postgres` will continuously fail, preventing dependent containers from starting. Ensure `POSTGRES_USER` is either `postgres` or update the healthcheck command to `-U ${POSTGRES_USER}`.

### Trap 4: Container Name Mismatch in `Caddyfile`
* In `docker-compose.yml`, the Prisma Studio container is named `${SERVER_NAME}_prisma_studio`.
* In `Caddyfile`, line 20:
  ```caddyfile
  reverse_proxy velvet_backend_postgres:7896
  ```
  Notice it targets `velvet_backend_postgres:7896` instead of `velvet_backend_prisma_studio:7896`. This will cause Caddy to return a 502 Bad Gateway when navigating to port 8001.

---

## 3. Environment Comparison Matrix

| Aspect | Local Development | Docker Compose (`dev` / `server`) | Staging / Production (`prod`) |
| :--- | :--- | :--- | :--- |
| **Node Environment** | `development` | `production` (in container) | `production` |
| **Port Binding** | `3000` or `3200` directly on host | `SERVER_PORT:PORT` (`6000:3200`) | Bound to internal network, exposed via Caddy (:8000 / :443) |
| **Database Host** | `localhost:5432` | `postgres:5432` (Docker DNS) | `postgres:5432` (isolated bridge network) |
| **Cookies Security** | `secure: false`, `httpOnly: false` | `secure: false` (if HTTP) | `secure: true`, `sameSite: 'lax'` (HTTPS enforced by Caddy) |
| **Swagger UI** | Available at `/api-docs` | Available on `:6000/api-docs` | Available via public domain `/api-docs` |
| **Database URL Format** | `postgresql://user:pass@localhost:5432/db` | `postgresql://user:pass@postgres:5432/db` | `postgresql://user:pass@postgres:5432/db` |

