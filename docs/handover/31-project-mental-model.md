# Project Mental Model & Plain-English System Narrative

## Overview

This document presents a plain-English mental model of how the **Velvet & Iron** backend functions. Rather than presenting abstract architectural diagrams or isolated code snippets, it walks through the end-to-end lifecycle of real user interactions: from opening the mobile application on day one, through logging daily health activities and earning experience points (XP), to purchasing a VIP subscription and leveling up through the 50 fantasy ranks.

---

## 1. The Core Philosophy of Velvet & Iron

**Velvet & Iron** transforms the often arduous, clinical journey of GLP-1 weight loss medications (Semaglutide/Ozempic/Wegovy, Tirzepatide/Mounjaro/Zepbound) into an engaging fantasy role-playing game (RPG).

The system operates on three interwoven loops:
1. **The Clinical Tracking Loop**: Users record nutritional macros (protein, carbs, fat, calories), hydration (water in ounces/ml), physical workouts, and weekly subcutaneous GLP-1 injection sites and dosages.
2. **The Gamification Loop**: Every positive clinical action yields Experience Points (XP). Accumulated XP drives level progression (Levels 1 through 50), unlocks prestigious fantasy titles (from *"Novice Traveler"* to *"Iron Legend"*), and rewards lore-rich companions and app visual themes.
3. **The Monetization Loop**: VIP subscriptions (managed via RevenueCat and App Store/Google Play in-app purchases) unlock exclusive companions, premium UI skins, and advanced health analytics.

---

## 2. The User Journey: A Step-by-Step Narrative

### Step 1: The User Opens the Mobile App (Splash & Auth Verification)

1. **Flutter App Launch**: The user launches the Velvet & Iron Flutter application on iOS or Android.
2. **Local Token Check**: The Flutter app checks its secure device storage (`flutter_secure_storage`) for an existing JWT `accessToken`.
   - **Case A: Valid Access Token**: The app immediately calls `GET /api/profile/me`. If the token is valid, the user lands directly on the Dashboard.
   - **Case B: Expired Access Token**: The app hits `GET /api/profile/me` and receives a `401 Unauthorized`. The Flutter HTTP interceptor intercepts this error and makes a silent call to `POST /api/auth/refresh-token` with the persisted `refreshToken`.
     - *Backend Action*: [src/auth/auth.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/auth/auth.service.ts) verifies the refresh token signature, finds the user, checks the bcrypt hash of the stored token in the `RefreshToken` table, issues a brand-new token pair, and rotates the stored refresh token in the database.
   - **Case C: First-Time User / Logged Out**: No tokens exist. The app displays the Welcome & Authentication Screen.

---

### Step 2: Account Creation & Authentication

1. **Registration**:
   - The user inputs their email, password, and display name.
   - The Flutter app sends `POST /api/auth/register` to the NestJS backend.
   - **Backend Processing**:
     - [src/auth/auth.controller.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/auth/auth.controller.ts) receives the request and validates the payload with `class-validator` via `ValidationPipe`.
     - [src/auth/auth.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/auth/auth.service.ts) queries the database to ensure the email is unique.
     - The password is encrypted using `bcrypt.hash(password, 10)`.
     - A new record is created in the `User` table.
     - An associated `Profile` record is automatically initialized with Level 1, 0 XP, current title *"Novice Traveler"*, and a starter avatar.
     - A dual JWT pair (`accessToken` valid for 15m, `refreshToken` valid for 7d) is returned.
2. **Alternative: Discord OAuth2**:
   - The user taps "Sign in with Discord".
   - The app opens an in-app browser to `GET /api/auth/discord`.
   - The user authorizes the application on Discord's servers.
   - Discord redirects to `GET /api/auth/discord/callback`.
   - The backend exchanges the OAuth code for the user's Discord profile, creates or finds the user in PostgreSQL, generates a JWT pair, and sends a deep-link redirect (`velvetapp://auth/discordapp?accessToken=...&refreshToken=...`) back to the Flutter app.

---

### Step 3: The Onboarding Ritual

Before accessing the main gameplay, the user completes the GLP-1 onboarding questionnaire:

1. **Questionnaire Submission**:
   - The user inputs their biological data (age, gender, height, current weight, target weight), medication details (medication name, current dose, weekly injection day), and selects a starting companion (e.g., *"Seraphina the Guide"*) and UI theme (e.g., *"Iron Vanguard"*).
   - The Flutter app sends `POST /api/profile/onboarding`.
2. **Backend Processing**:
   - [src/profile/profile.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/profile/profile.service.ts) extracts the `userId` from the `@ValidUser()` decorator.
   - It updates the `User` table setting `onBoarded: true`.
   - It calculates baseline nutritional goals (BMR/TDEE formula based on weight, height, and goal rate) and creates an initial `MacroGoal` record.
   - It binds the chosen starter companion and theme to the user's `UserCompanion` and `UserTheme` tables.
   - It invokes [src/common/leveladd/leveladd.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/common/leveladd/leveladd.service.ts) to award the initial onboarding bonus (e.g., 50 XP).
   - The user transitions from the onboarding flow to the Main Hub.

---

### Step 4: Daily Gameplay & Health Tracking

During a typical day, the user interacts with the app repeatedly to record health milestones:

#### A. The Daily Login Claim
- Upon opening the app for the day, the user taps "Claim Daily Bonus".
- App calls `POST /api/profile/daily-login`.
- The backend checks the user's `lastLoginDate`.
- If 24 hours have elapsed since the last claim, the user's `loginStreak` increments by 1, and 20 XP is awarded.
- *Developer Note*: This rate-limiting currently relies on an in-memory `Map<string, number>` in [src/profile/profile.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/profile/profile.service.ts#L42).

#### B. Logging a Meal
- The user eats lunch (e.g., Grilled Chicken Breast, 45g protein, 0g carbs, 4g fat, 220 kcal).
- The app sends `POST /api/meal-log` with the nutritional breakdown and optional photo.
- The backend:
  1. Creates a record in the `MealLog` table linked to the `userId`.
  2. Increments the user's daily totals in their active `MacroGoal`.
  3. Evaluates if the action completes a daily quest in `DailyTask` (e.g., *"Hit 100g Protein Today"*).
  4. Calls `LeveladdService.addXp(userId, 10)` to award meal logging XP.
  5. Returns the created meal record and the updated macro balance.

#### C. Logging an Injection (Weekly GLP-1 Dose)
- On Sunday evening, the user administers their weekly GLP-1 injection (e.g., 0.5mg Semaglutide into the right abdomen).
- The user records the injection in the app via `POST /api/injection-log`.
- The backend creates an `InjectionLog` record storing medication name, dose, unit, injection site, and notes.
- This action is treated as a major health milestone and triggers a larger XP grant (e.g., 50 XP).

---

### Step 5: The Level-Up Mechanic

What happens behind the scenes when a user earns XP?

1. **XP Addition**: A service calls `await this.leveladdService.addXp(userId, xpAmount)`.
2. **Current State Lookup**: [src/common/leveladd/leveladd.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/common/leveladd/leveladd.service.ts) loads the user's `Profile` (`currentLevel`, `currentXp`, `title`).
3. **New Total Calculation**: `newXp = currentXp + xpAmount`.
4. **Threshold Evaluation**:
   - The engine checks the XP required to reach the next level using the mathematical curve:
     $$\text{XP Required} = \lfloor 100 \times 1.15^{(\text{currentLevel} - 1)} \rfloor$$
   - If `newXp >= xpRequired` and `currentLevel < 50`:
     - `currentLevel` increments by 1.
     - `newXp` subtracts `xpRequired` (overflow XP carries over).
     - The engine looks up the new title from the 50-entry `TITLES` array (e.g., Level 5 becomes *"Warden of Will"*).
     - If the new level unlocks a companion or theme, an unlock event is noted.
5. **Database Persistence**: The updated level, XP, and title are saved to PostgreSQL in a single Prisma update.
6. **Client Notification**: The API response includes `{ leveledUp: true, newLevel: 5, newTitle: "Warden of Will" }`. The Flutter app responds by triggering a celebratory level-up animation and audio cue.

---

### Step 6: Monetization & VIP Upgrades (The RevenueCat Pipeline)

1. **Store Browsing**: The user visits the in-app Store (`GET /api/store/companions` and `GET /api/store/themes`).
   - Standard items can be equipped freely or unlocked by reaching specific levels.
   - VIP items (e.g., *"Mythic Dragon Companion"*, *"Abyssal Dark Theme"*) display a golden padlock with the tag `isVip: true`.
2. **Subscription Purchase**:
   - The user selects an annual VIP membership and completes the purchase via Apple In-App Purchase or Google Play Billing.
   - The mobile device communicates directly with **RevenueCat SDK**.
3. **Webhook Dispatch**:
   - RevenueCat's servers dispatch an HTTP POST webhook event (`INITIAL_PURCHASE` or `RENEWAL`) to `https://api.velvetandiron.com/api/revenuecat/webhook`.
4. **Backend Authorization & Ingestion**:
   - [src/revenuecat/revenuecat.controller.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/revenuecat/revenuecat.controller.ts) receives the webhook and validates the `Authorization: Bearer <SECRET>` header against `REVENUECAT_WEBHOOK_SECRET`.
   - [src/revenuecat/revenuecat.service.ts](file:///Users/betopia/Downloads/projects/velvet_iron_backend/src/revenuecat/revenuecat.service.ts) parses the event payload.
   - It extracts the `app_user_id` (which matches the user's UUID in the backend database).
   - It updates the user's profile:
     ```typescript
     await this.prisma.profile.update({
       where: { userId },
       data: { isVip: true, vipExpiresAt: expirationDate }
     });
     ```
5. **Entitlement Unlocked**:
   - The next time the user opens the store or refreshes their profile, `isVip` evaluates to `true`.
   - The user can now equip VIP companions and themes without restriction.
6. **Cancellation / Expiration**:
   - If the user cancels their subscription, RevenueCat sends an `EXPIRATION` or `CANCELLATION` event.
   - The backend updates `isVip: false`.
   - If the user currently had a VIP theme or companion equipped, the app falls back to default assets.

---

## 3. High-Level System Architecture Mapping

To visualize how the parts connect:

```
+-------------------------------------------------------------------------+
|                           Flutter Mobile App                            |
|             (Presentation, Local Storage, In-App Purchase UI)           |
+-------------------------------------------------------------------------+
       |                                              |
       | HTTPS REST API Requests                      | Mobile SDK Purchases
       | (Bearer Access Token)                        v
       v                                       +-------------------+
+-----------------------+                      |    Apple / Google |
|    Caddy Reverse      |                      |    App Stores     |
|         Proxy         |                      +-------------------+
+-----------------------+                                |
       |                                                 | Purchase Receipt
       v                                                 v
+------------------------------------+         +-------------------+
|     NestJS Application Server      |         |    RevenueCat     |
|   - Auth & Passport Strategy       |         |   Subscription    |
|   - Health Tracking Controllers    |         |     Platform      |
|   - Gamification Engine (Leveladd) |         +-------------------+
|   - RevenueCat Webhook Controller  |<------------------+
+------------------------------------+   HTTP Webhook Notification
       |                     |
       v                     v
+--------------+     +-------------------+
|  PostgreSQL  |     |   Amazon Web      |
|   Database   |     |    Services S3    |
| (13 Tables)  |     | (Avatar & Media)  |
+--------------+     +-------------------+
```

---

## 4. Key Takeaways for New Developers

1. **Everything is Synchronous**: There is currently no Redis, BullMQ, or RabbitMQ. When a user logs a meal or an injection, the database write, the macro recalculation, the XP addition, and the level check all occur in the same synchronous HTTP request cycle.
2. **Stateless Auth with Database Refresh Tracking**: Access tokens are purely stateless JWTs. Refresh tokens are tracked in PostgreSQL (`RefreshToken` table) with bcrypt hashing to allow token revocation and multi-device session management.
3. **The Multi-File Prisma Architecture**: Prisma models are organized into domain-specific files under `prisma/schema/`. Never edit `prisma/schema.prisma` directly; modify the sub-schemas and run `pnpm prisma:generate` (which invokes `prisma-multischema.sh`).
4. **Be Aware of Known Architectural Debt**:
   - XP logic in 7 logging services has an inverted onboarding check (`!user.onBoarded`).
   - Daily login streak rate-limiting is in-memory and will reset on application restart.
   - Public endpoints exist on `/user` and `/s3/upload` that require immediate security guards.

