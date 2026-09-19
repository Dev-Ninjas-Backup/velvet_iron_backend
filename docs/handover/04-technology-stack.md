# Velvet & Iron Backend - Technology Stack Inventory

**Document ID:** `04-technology-stack.md`  
**Target Audience:** Architects, Lead Developers, DevOps Engineers  

---

## 1. Master Technology Inventory

The following table details every technology, runtime, framework, library, and tool utilized in the Velvet & Iron codebase based on `package.json`, configuration files, and source code inspection:

| Technology / Package | Version | Classification | Purpose | Where Used |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | `20.x` | Runtime | JavaScript execution engine | `Dockerfile`, `ci.yml`, server host |
| **TypeScript** | `^5.7.3` | Language | Statically typed JavaScript | Whole project (`src/**/*.ts`, `tsconfig.json`) |
| **pnpm** | `latest` (CI: global) | Package Manager | Fast, disk-efficient dependency manager | `pnpm-lock.yaml`, `Dockerfile`, `ci.yml` |
| **NestJS Core (`@nestjs/core`)** | `^11.0.1` | Framework | IoC Container, Dependency Injection, Lifecycle | `src/main.ts`, `src/app.module.ts` |
| **NestJS Common (`@nestjs/common`)** | `^11.0.1` | Framework | Decorators, exceptions, filters, pipes | All controllers, services, guards |
| **NestJS Express (`@nestjs/platform-express`)** | `^11.0.1` | HTTP Adapter | Underlying HTTP server implementation | `src/main.ts` |
| **Express** | `^5.2.1` | HTTP Engine | Underlying web framework | Imported by `@nestjs/platform-express` |
| **Prisma ORM (`prisma`)** | `^7.2.0` | CLI / Tooling | Schema migration, client generation, Studio | `prisma/`, `prisma.config.ts`, `package.json` scripts |
| **Prisma Client (`@prisma/client`)** | `^7.2.0` | ORM Client | Type-safe database client | `src/lib/prisma/prisma.service.ts` |
| **Prisma PG Adapter (`@prisma/adapter-pg`)** | `^7.2.0` | DB Driver Adapter | Connects Prisma Client to native `pg` pool | `src/lib/prisma/prisma.service.ts`, `prisma/seed.ts` |
| **Prisma SQLite Adapter (`@prisma/adapter-better-sqlite3`)** | `^7.2.0` | DB Driver Adapter | Unused secondary adapter dependency | Listed in `package.json` dependencies |
| **PostgreSQL (`pg`)** | `^8.16.3` | DB Client | Native Node PostgreSQL driver | Injected into `@prisma/adapter-pg` |
| **PostgreSQL Database** | `16-alpine` | Database Engine | Relational persistence store | `docker-compose.yml` (`postgres:16-alpine`) |
| **NestJS Swagger (`@nestjs/swagger`)** | `^11.2.4` | API Docs | OpenAPI 3.0 specification & Swagger UI | `src/main.ts`, all controllers and DTOs |
| **Passport (`passport`)** | `^0.7.0` | Authentication | Authentication middleware framework | `src/lib/strategy/` |
| **Passport JWT (`passport-jwt`)** | `^4.0.1` | Authentication | JWT authentication strategy | `src/lib/strategy/jwt.ts` |
| **Passport Local (`passport-local`)** | `^1.0.0` | Authentication | Username/password authentication strategy | `src/lib/strategy/local.strategy.ts` |
| **Passport Discord (`passport-discord`)** | `^0.1.4` | Authentication | Discord OAuth2 authentication strategy | `src/lib/strategy/discord.strategy.ts` |
| **NestJS JWT (`@nestjs/jwt`)** | `^11.0.2` | Token Signer | Signing and verifying JWT tokens | `src/auth/auth.service.ts`, `optional-auth.guard.ts` |
| **bcryptjs** | `^3.0.3` | Cryptography | Password hashing and comparison | `src/common/hashText.ts`, `auth.service.ts` |
| **Firebase Admin (`firebase-admin`)** | `^13.6.0` | Cloud Identity | Verifying Google/Apple/FB social ID tokens | `src/auth/services/firebase-auth.service.ts` |
| **AWS SDK v2 (`aws-sdk`)** | `^2.1693.0` | Cloud Storage | S3 file and profile image uploads | `src/aws/aws.service.ts` |
| **AWS SDK v3 S3 (`@aws-sdk/client-s3`)**| `^3.971.0` | Cloud Storage | Installed next-gen SDK (currently unreferenced) | `package.json` |
| **AWS S3 Presigner (`@aws-sdk/s3-request-presigner`)**| `^3.971.0`| Cloud Storage | Presigned URL generator (unreferenced) | `package.json` |
| **Multer (`multer`)** | `^2.0.2` | File Handling | Multipart/form-data upload parsing | Controllers (`AnyFilesInterceptor`, `FileFieldsInterceptor`)|
| **Cookie Parser (`cookie-parser`)** | `^1.4.7` | Middleware | Parses HTTP cookies for token storage | `src/main.ts`, `src/common/optional-auth.guard.ts` |
| **NestJS Mailer (`@nestjs-modules/mailer`)**| `^2.0.2` | Email Client | Wrapper around Nodemailer for NestJS | `src/email/email.module.ts` |
| **Nodemailer (`nodemailer`)** | `^7.0.12` | SMTP Transport | Sends emails via SMTP relay | Injected by `@nestjs-modules/mailer` |
| **class-validator** | `^0.14.3` | Validation | Declarative DTO schema validation decorators | All `src/**/dto/*.dto.ts` |
| **class-transformer** | `^0.5.1` | Transformation | Type coercion and object deserialization | Handled by `ValidationPipe` |
| **dotenv-expand** | `^12.0.3` | Configuration | Variable expansion inside `.env` files | `prisma.config.ts`, `prisma/seed.ts` |
| **dotenv** | `^8.2.0` | Configuration | Loading `.env` file into `process.env` | `prisma.config.ts`, `prisma/seed.ts` |
| **NestJS Config (`@nestjs/config`)** | `^4.0.2` | Configuration | Global environment variable service | `src/app.module.ts`, injected across services |
| **RxJS** | `^7.8.1` | Reactive Streams | Reactive programming primitives used by NestJS | Internal NestJS dependency |
| **Caddy** | `latest` (Docker) | Reverse Proxy / SSL | Automatic Let's Encrypt SSL & Reverse Proxy | `Caddyfile`, `docker-compose.yml` |
| **Docker & Docker Compose** | Compose v2 | Infrastructure | Containerized execution environment | `Dockerfile`, `docker-compose.yml` |
| **GitHub Actions** | CI/CD | Automation | Building image, testing, SSH deploy to EC2 | `.github/workflows/ci.yml` |
| **Jest (`jest`)** | `^30.0.0` | Testing | Test runner and assertion library | `package.json`, `test/app.e2e-spec.ts` |
| **Supertest (`supertest`)** | `^7.0.0` | Testing | HTTP integration test assertions | `test/app.e2e-spec.ts` |
| **Prettier (`prettier`)** | `^3.4.2` | Code Style | Code formatting engine | `.prettierrc`, `package.json` |
| **ESLint (`eslint`)** | `^9.18.0` | Code Quality | Static code analysis and linting | `eslint.config.mjs`, `package.json` |

---

## 2. Dependency Audit & Architectural Observations

### 2.1 AWS SDK Version Divergence
* **Observation:** The codebase has both `aws-sdk` (v2, version `2.1693.0`) and `@aws-sdk/client-s3` (v3, version `3.971.0`) installed in `package.json`.
* **Current Code Usage:** `src/aws/aws.service.ts` exclusively imports and instantiates the **legacy AWS SDK v2**:
  ```typescript
  import { S3 } from 'aws-sdk';
  ```
* **Impact:** AWS SDK v2 went into maintenance mode in 2023 and is officially deprecated. Furthermore, keeping both v2 and v3 in `node_modules` adds approximately 80MB of unnecessary bundle weight to the Docker build.
* **Recommendation:** Migrate `AwsService` to `@aws-sdk/client-s3` and uninstall `aws-sdk`.

### 2.2 Express 5 with NestJS 11
* **Observation:** `package.json` includes `express: ^5.2.1`. NestJS 11 officially introduced support for Express 5.
* **Current Status:** Stable and working as expected, but ensure third-party middleware packages remain compatible with Express 5 routing internals.

### 2.3 Outdated `dotenv` in Dependencies
* **Observation:** `dotenv: ^8.2.0` is specified in `dependencies`. Version 8 is several major versions behind (current is v16+).
* **Current Status:** Used only in `prisma.config.ts` and `prisma/seed.ts`. NestJS itself uses `@nestjs/config`, which embeds a modern `dotenv`.
* **Recommendation:** Update `dotenv` to `^16.x` or eliminate it in favor of standard Node.js `--env-file` or `@nestjs/config`.

### 2.4 Unused Database Adapter Dependency
* **Observation:** `@prisma/adapter-better-sqlite3: ^7.2.0` is installed in `dependencies`.
* **Evidence:** There are no SQLite databases or configurations anywhere in the repository. The project runs purely on PostgreSQL.
* **Recommendation:** Remove `@prisma/adapter-better-sqlite3`.

### 2.5 Puppeteer and PDF Dependencies
* **Observation:** `markdown-pdf: ^11.0.0` and `md-to-pdf: ^5.2.5` are installed in `devDependencies`.
* **Where Used:** Used only by `convert-to-pdf.js` to compile `API_DOCUMENTATION.md` into `API_DOCUMENTATION.pdf`.
* **Note:** `convert-to-pdf.js` currently fails on macOS/Linux due to a hardcoded Windows Chrome executable path.

