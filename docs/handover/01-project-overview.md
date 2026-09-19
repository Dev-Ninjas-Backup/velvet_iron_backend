# Velvet & Iron Backend - Executive Project Overview

**Document ID:** `01-project-overview.md`  
**Target Audience:** Incoming Lead Developers, Full-Stack Engineers, DevOps Engineers, Product Owners  
**Codebase Name:** `velvet_iroon_backend` (package.json) / `velvet_backend` (Docker/CI)  
**Handover Status:** Comprehensive Technical Handover & Onboarding  

---

## 1. Executive Summary

**Velvet & Iron** is a gamified, fantasy-RPG-themed health, fitness, habit, and medication tracking backend. It is explicitly designed for individuals undergoing **GLP-1 receptor agonist therapy** (such as semaglutide, tirzepatide, Ozempic, Wegovy, or Mounjaro) and comprehensive lifestyle transformation. 

The application transforms the clinical and often exhausting routine of chronic weight management, daily nutrition monitoring, exercise tracking, and subcutaneous injection schedules into an immersive fantasy role-playing journey. Users earn **Experience Points (XP)**, level up from **Level 1 ("Unbound")** to **Level 50 ("Ironbound Legend II")**, unlock mythical **Companions** (guardians and mentors with thematic motivational quotes), unlock stylized **Themes**, and complete daily quests.

The system is built on **NestJS 11**, **Node.js 20**, **Prisma ORM 7.2**, and **PostgreSQL 16**, with integrations for **AWS S3** (asset storage), **Firebase Auth** (social login), **Discord OAuth2** (community login with Flutter deep-linking), **Nodemailer/Gmail SMTP** (OTP email verification), and **RevenueCat** (in-app subscriptions via secure webhooks).

---

## 2. Business Problem & Solution

### The Problem
Adherence to GLP-1 weight loss medications and accompanying lifestyle habits suffers from high attrition rates. Users face:
1. Gastrointestinal side effects and fatigue requiring careful mood, hunger, and energy monitoring.
2. Inadequate protein and macronutrient intake, which risks lean muscle loss during rapid weight reduction.
3. Rigid, clinical health applications that feel punitive and monotonous rather than encouraging.
4. Fragmented tracking tools (separate apps for injections, meal macros, body weight, and exercise).

### The Velvet & Iron Solution
* **Unified Tracking Matrix:** Single backend handling Weight, Mood/Energy/Hunger, Meals with automated macro/calorie computations, GLP-1 Medications & Doses, and Exercise Logs with schedule forecasting.
* **Fantasy RPG Gamification Engine:** Every health action (taking a shot, logging 3 meals, hitting 120g of protein, recording mood, working out 30 minutes) feeds into daily quests and awards XP.
* **Progression System:** XP unlocks custom Lore Companions (*Ser Kael Thornwatch*, *Riven Ashcroft*, *Pyraxis*, *Bram Ironledger*) and UI Themes (*Adventurer*, *Reader*, *Mage*, *Gamer*) tied to user level tiers.
* **Automated Aggregation:** Aggregated daily schedule endpoints combine upcoming meals, medications, and workouts into a chronological timeline for the client app.
* **Mobile-First Client Integration:** Engineered to support a cross-platform Flutter mobile client with OAuth deep linking (`velvetapp://auth/discordapp`) and automatic token rotation.

---

## 3. User Types and Roles

The authorization model is defined in `prisma/schema/user.prisma` via the `UserRole` enum:

| Role | Database Value | Scope & Permissions |
| :--- | :--- | :--- |
| **User** | `USER` | Standard end user. Can manage own profile, log health metrics, unlock companions/themes with earned XP, view leaderboards and personal analytics, and manage active subscription. |
| **Admin** | `ADMIN` | Administrative user. Can access protected administrative endpoints, view global user records, trigger multi-device logouts, and manually override subscriptions for testing. |
| **Super Admin** | `SUPERADMIN` | System administrator. Seeded automatically on system startup via `src/common/seed.service.ts` using environment credentials (`SUPERADMIN_EMAIL`, `SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD`). Has full unrestricted operational access. |

---

## 4. Main Business Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Velvet & Iron Backend                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
[ Core & Identity ]         [ Gamification Engine ]       [ Health Tracking ]
• Registration & Email OTP  • XP Calculation Engine       • GLP-1 Medication & Shots
• Dual-Token Auth (JWT)     • 50 Level Progression        • Medication Schedules
• Multi-Device Sessions     • 50 Level Status Titles      • Meal Logs & Auto-Calories
• Google/Firebase OAuth     • Theme Unlock System         • Meal Schedules & Planning
• Discord OAuth & DeepLink  • Companion Unlock System     • Exercise Logs & Schedules
• Profile & AWS S3 Photos   • Daily Quest Aggregation     • Mood, Hunger & Energy Logs
• Onboarding Wizard         • Weekly/Monthly XP Charts    • Daily Weight Logs & Stats
                            • In-Memory XP Timeout Engine
                                    │
                                    ▼
                         [ Monetization & Infra ]
                         • RevenueCat Webhook Ingestion
                         • Subscription Status & History
                         • Docker, Caddy SSL & Compose
```

1. **Authentication & Identity (`src/auth`):** Local email/password registration with 4-digit OTP verification, multi-device session management, Firebase Google/social token verification, Discord OAuth2 with mobile deep-link redirection, and auto-refreshing JWT cookie/header rotation.
2. **User Profile & Onboarding (`src/profile`, `src/onboarding`, `src/user`):** User profile aggregation, free starter theme/companion activation during onboarding, goal setting, avatar and profile photo uploads to AWS S3.
3. **Gamification & Progression (`src/leveladd`, `src/theme`, `src/companion`, `src/xp-stats`, `src/main/xp-timeout`):** Mathematical level computation, thematic companion quote delivery, XP logging, daily login XP reward, daily quest progress calculation, and 24-hour rate limiting.
4. **Nutrition & Macro Tracking (`src/meal-log`, `src/meal-schedule`, `src/macro-goal`):** Meal logging with automated calorie derivation ($Calories = 4 \times Carbs + 4 \times Protein + 9 \times Fat$), scheduled meal reminders, and personal daily macronutrient target goals.
5. **GLP-1 Medication Management (`src/medication`, `src/medication-schedule`):** Drug registration (tablets, capsules, injections, liquids), dosage tracking (mg), and schedule adherence verification.
6. **Fitness & Wellbeing (`src/exercise-log`, `src/mood-log`, `src/weight-log`):** Cardio/strength/flexibility exercise logging, mood/energy/hunger tracking, daily weight records with delta statistics.
7. **Monetization (`src/payment`):** RevenueCat mobile payment webhook processor verifying cryptographic Bearer headers, tracking subscriptions (`active`, `cancelled`, `expired`, `billing_issue`), and logging historical purchase events.

---

## 5. Major Integrations

| External Service | Integration Type | Code Location | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **AWS S3** | REST SDK (`aws-sdk` / `@aws-sdk/client-s3`) | `src/aws/aws.service.ts` | Uploading and hosting profile avatars and user media attachments |
| **Firebase Admin SDK** | Service Account Auth | `src/auth/services/firebase-auth.service.ts` | Verifying ID tokens from Google, Apple, and Facebook social logins |
| **Discord OAuth2** | Passport Strategy (`passport-discord`) | `src/lib/strategy/discord.strategy.ts` | Discord social authentication and deep-link redirection to mobile |
| **RevenueCat** | Webhook Processor | `src/payment/payment.service.ts` | Receiving Apple App Store / Google Play Store subscription events |
| **Nodemailer / Gmail** | SMTP Relay | `src/email/email.service.ts` | Sending OTP verification codes, password reset links, and credentials |

---

## 6. Applications & Interfaces

1. **Backend REST API:** NestJS Express application running on configurable `PORT` (defaults to `3200` in `.env.example`, `3000` in code fallback).
2. **Swagger OpenAPI Documentation:** Served at `/api-docs` with persistent authorization and token-cookie transmission.
3. **Static Social Login Test Client:** HTML5/JavaScript application served at `/auth/socialLogin.html` for browser-based testing of Firebase and Discord OAuth.
4. **Mobile Client Interface:** Cross-platform Flutter mobile app (communicates via REST and handles deep link `velvetapp://auth/discordapp`).
5. **Database Admin UI:** Prisma Studio configured in Docker Compose on port `7896` / `8462`, reverse-proxied by Caddy on port `8001`.

---

## 7. New Developer "Day One" Directive

> **"If I am a completely new developer joining this project today, what do I need to understand first?"**

1. **The Codebase is NOT Just an Auth Server:**  
   The repository was originally cloned from an open-source template named `authentication_server`. Early documentation (such as root `README.md`) still refers to it as "NestJS Authentication with Email OTP Verification". In reality, the codebase has evolved into a feature-complete, gamified GLP-1 health tracking API. Treat root `README.md` as legacy and refer to `API_DOCUMENTATION.md` and this handover documentation for accurate implementation details.

2. **Supply Chain Malware History & Forensic Cleanup:**  
   In mid-February 2026, the repository suffered a supply chain intrusion (BeaverTail / Lazarus campaign patterns) that inserted malicious payloads into `.vscode/tasks.json`, `.vscode/settings.json`, `.env`, and a disguised font file inside `public/fonts/`. The malware has been neutralized (uncommitted working tree cleanups and commit `6f20aba`). A Python forensic script `security-scanner-v2.py` exists in the root directory. **Never restore automated task execution on folder open**, and understand why `public/` is currently missing.

3. **Custom Dual-Token Cookie/Header Auto-Refresh Guard:**  
   The application uses a custom authentication guard (`OptionalJwtGuard` in `src/common/optional-auth.guard.ts`) wrapped inside `@ValidUser()`. When a client makes a request with an expired access token but a valid refresh token, the guard **automatically regenerates both tokens on the fly**, sets them in response headers (`X-New-Access-Token`, `X-New-Refresh-Token`), sets Set-Cookie headers, and allows the request through without returning a 401.

4. **The Onboarding Logic Inversion Bug:**  
   Across all tracking services (`meal-log`, `exercise-log`, `mood-log`, `weight-log`, `medication`), XP is awarded with the condition:
   ```typescript
   //if onboarded then add xp
   if (user && !user.onBoarded) { ... }
   ```
   Notice the exclamation mark (`!user.onBoarded`). Due to this bug, users who complete onboarding **stop receiving XP** for their daily health logs. You will need to address this inversion with product stakeholders.

5. **Multi-File Prisma Schema:**  
   Prisma schemas are partitioned across 11 files inside `prisma/schema/` (`user.prisma`, `health-tracking.prisma`, `gamification.prisma`, etc.) using the Prisma 7 multi-file schema feature configured via `prisma.config.ts`.

