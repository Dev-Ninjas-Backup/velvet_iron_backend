# Velvet & Iron Backend - Background Jobs & Scheduled Tasks

**Document ID:** `17-background-jobs.md`  
**Target Audience:** Backend Engineers, System Architects, Performance Engineers  

---

## 1. Asynchronous Systems & Background Processing Status

### Current Architecture State: **NO DEDICATED BACKGROUND WORKERS OR QUEUES**

* **Queues (Redis / Bull / RabbitMQ):** `NOT FOUND IN CODEBASE`
* **Cron Schedulers (`@nestjs/schedule`):** `NOT FOUND IN CODEBASE`
* **Worker Processes / Separate Daemons:** `NOT FOUND IN CODEBASE`

All processing in the Velvet & Iron backend is executed **synchronously within the HTTP request/response thread**.

---

## 2. Existing Lifecycle & In-Memory Mechanisms

While true background queues do not exist, the application relies on two asynchronous/lifecycle mechanisms:

### 2.1 OnModuleInit Database Seeding (`src/common/seed.service.ts`)
* **Trigger:** Invoked automatically by the NestJS framework during application bootstrap.
* **Mechanism:** Implements `OnModuleInit`.
* **Execution:**
  1. Checks if `themes` table count is 0; if so, seeds 4 starter themes.
  2. Checks if `companions` table count is 0; if so, seeds 4 lore companions.
  3. Checks if super admin exists (via `SUPERADMIN_EMAIL`); if not, creates super admin user and profile.
* **Failure Impact:** If the database connection is slow or fails during boot, application startup will be delayed or terminate.

### 2.2 In-Memory XP Rate Limiting (`src/main/xp-timeout/xp-timeout.service.ts`)
* **Trigger:** User queries `GET /xp-timeout` or `GET /xp-timeout/readstory`.
* **Mechanism:** Maintains an in-memory JavaScript `Map<string, number>` storing `userId -> timestamp`.
* **Behavior:** Checks if $currentTimestamp - lastTimestamp > 24 \times 60 \times 60 \times 1000$.
* **Limitations:**
  * Memory leak risk over long uptimes with thousands of users.
  * Ineffective across multiple container replicas or horizontally scaled servers.
  * Resets on every server restart or redeployment.

---

## 3. Architectural Implications & Risks of Missing Workers

1. **Email Sending Blocks HTTP Responses:**
   * When a user registers or requests a password reset, `await this.emailService.sendMail(...)` is called synchronously in the controller/service thread.
   * If the Gmail SMTP server encounters network latency or throttling (e.g. taking 3–8 seconds), the user's mobile app or browser will hang until SMTP communication completes.
2. **Lazy Daily Quest Evaluation:**
   * Quests and streaks are not updated by a midnight cron job.
   * Instead, they are computed **on-the-fly** whenever the client queries `GET /xp-stats/quests`.
3. **Lazy Subscription Expiration:**
   * If a user's subscription expires on Apple App Store or Google Play, the database status remains `'active'` until RevenueCat delivers an `EXPIRATION` webhook or an admin manually modifies the record.

---

## 4. Production Roadmap Recommendations

1. **Introduce Redis + BullMQ (`@nestjs/bullmq`):**
   * Decouple email dispatch (`sendVerificationOtp`, `sendGoogleAuthPassword`) into a dedicated background queue with retry backoff.
   * Decouple S3 media processing into background jobs.
2. **Implement NestJS Schedule (`@nestjs/schedule`):**
   * Replace in-memory `XpTimeoutService` with a Redis cache or a lightweight scheduled cron cleanup.
   * Add a nightly database maintenance job to purge expired `sessions` and stale OTP codes from `users`.

