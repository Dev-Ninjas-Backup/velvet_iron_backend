# Velvet & Iron Backend - Complete API Reference Manual

**Document ID:** `09-api-documentation.md`  
**Target Audience:** Frontend Engineers, Mobile Developers, QA Engineers, Backend Integrators  
**Base URL:** `http://localhost:3200` (or configured `PORT`)  
**Interactive Docs:** `http://localhost:3200/api-docs`  

---

## 1. Authentication Standards & Headers

All protected endpoints utilize NestJS guards (`OptionalJwtGuard` + `RoleGuard`). Authentication credentials can be provided in any of three formats:
1. **HTTP Authorization Header:** `Authorization: Bearer <access_token>`
2. **Custom Header Pair:** `X-Access-Token: <access_token>` and `X-Refresh-Token: <refresh_token>`
3. **HTTP Cookies:** Cookie header containing `access_token` and `refresh_token`

When an access token is expired but a valid refresh token is supplied, the response includes new tokens in response headers:
* `X-New-Access-Token`: `<new_jwt>`
* `X-New-Refresh-Token`: `<new_jwt>`

---

## 2. Authentication Endpoints (`/auth`)

### 2.1 Register New User
* **Method & Path:** `POST /auth/register`
* **Purpose:** Register a new user account and send email verification OTP.
* **Authentication:** None (`Public`).
* **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "Alex Mercer",
    "username": "alexmercer"
  }
  ```
* **Validation:** `registerDto` (`email` valid, `password` min length 6, `name` string, `username` optional string).
* **Business Logic:** Checks if email/username already exists. Hashes password using bcrypt. If username is omitted, cleans `name` and appends random digits until unique. Generates 4-digit OTP valid for 10 minutes. If `EMAIL_VERIFICATION_REQUIRED=true`, sends OTP email.
* **Database Operations:** `prisma.user.create()`
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully. Please check your email for verification code.",
    "data": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "alexmercer",
      "name": "Alex Mercer",
      "avatar": "https://i.pinimg.com/...",
      "role": "USER",
      "emailVerified": false,
      "createdAt": "2026-03-01T12:00:00.000Z"
    }
  }
  ```
* **Error Responses:**
  * `200 OK` with `{ success: false, message: "Email/Username already in use..." }`

---

### 2.2 Login
* **Method & Path:** `POST /auth/login`
* **Purpose:** Authenticate with email/username and password.
* **Authentication:** `AuthGuard('local')`.
* **Request Body (JSON):**
  ```json
  {
    "emailOrUsername": "alexmercer",
    "password": "SecurePassword123!"
  }
  ```
* **Business Logic:** `LocalStrategy` calls `AuthService.validateUser()`. If `EMAIL_VERIFICATION_REQUIRED=true` and email is not verified, rejects with 401. Generates dual JWT tokens. Sets cookies `access_token` and `refresh_token`. Sets response headers `X-Access-Token` and `X-Refresh-Token`.
* **Success Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "refresh_token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "alexmercer",
      "name": "Alex Mercer",
      "role": "USER"
    }
  }
  ```
* **Error Responses:** `401 Unauthorized` ("Invalid credentials" or "Please verify your email").

---

### 2.3 Firebase Social Login (Google / Apple / Facebook)
* **Method & Path:** `POST /auth/firebase-login`
* **Purpose:** Universal social login using client-side Firebase ID tokens.
* **Authentication:** None (`Public`).
* **Request Body (JSON):**
  ```json
  {
    "token": "FIREBASE_ID_TOKEN_FROM_CLIENT_SDK"
  }
  ```
* **Business Logic:** `FirebaseAuthService` verifies the ID token with Google's public certificates. Checks if user exists by `googleId` or `email`. If new, generates a 16-character password, hashes it, creates account, and emails the password to the user. Returns JWT tokens and sets auth cookies.
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Account created successfully. Check your email for password details.",
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "user": { "id": "user_...", "email": "user@gmail.com", "name": "Google User" }
  }
  ```

---

### 2.4 Discord OAuth Redirect & Callback
* **Initiation:** `GET /auth/discord` -> Triggers Passport redirect to Discord consent screen.
* **Manual URL:** `GET /auth/discord-auth-url` -> Returns raw authorization URL string.
* **Callback:** `GET /auth/discord/callback?code=...`
  * Exchanged authorization code for Discord profile.
  * Links or creates account, generates JWT tokens.
  * Issues 302 Redirect to Flutter deep link:
    ```text
    velvetapp://auth/discordapp?access_token=...&refresh_token=...&user=...
    ```

---

### 2.5 Get My Account Profile
* **Method & Path:** `GET /auth/me`
* **Authentication:** `@ValidUser()` (Bearer or Cookies).
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "successfully fetched user profile",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "alexmercer",
      "name": "Alex Mercer",
      "avatar": "https://...",
      "role": "USER",
      "emailVerified": true
    },
    "accessToken": "new_token_if_refreshed",
    "refreshToken": "new_token_if_refreshed"
  }
  ```

---

### 2.6 Update Account Profile & Photo
* **Method & Path:** `PATCH /auth/profile`
* **Authentication:** `@ValidUser()`.
* **Content-Type:** `multipart/form-data`.
* **Form Fields:** `name`, `username`, `gender`, `dateOfBirth` (YYYY-MM-DD), `profilePhoto` (file), `avatar` (file).
* **File Validation:** Max 5MB, image MIME types only (`jpeg`, `png`, `webp`, `gif`, `svg`).
* **External Services:** AWS S3 upload (`profiles/${userId}/avatar-${Date.now()}`).
* **Success Response (200 OK):** Returns updated user object with S3 image URLs.

---

### 2.7 Verification & Password Reset Endpoints
* `POST /auth/verify-email`: Body `{ email, otp }` -> Marks email verified.
* `POST /auth/resend-verification-otp`: Body `{ email }` -> Issues new 4-digit code.
* `POST /auth/forgot-password`: Body `{ email }` -> Sends password reset OTP.
* `POST /auth/verify-reset-otp`: Body `{ email, otp }` -> Sets `resetPasswordVerified = true`.
* `POST /auth/reset-password`: Body `{ email, newPassword }` -> Updates password, clears sessions.
* `PUT /auth/change-password`: `@ValidUser()`, Body `{ currentPassword, newPassword }`.
* `POST /auth/check-username`: Body `{ username }` -> Returns `{ available: boolean }`.
* `PUT /auth/update-username`: `@ValidUser()`, Body `{ username }`.
* `GET /auth/sessions`: `@ValidUser()` -> Lists active device sessions.
* `DELETE /auth/logout`: `@ValidUser()` -> Clears cookies and current session.
* `DELETE /auth/logout-all`: `@ValidAdmin()` -> Clears all device sessions for user.

---

## 3. User Profile & Onboarding Endpoints

### 3.1 Get Comprehensive Profile with Timeline
* **Method & Path:** `GET /profile`
* **Query Parameters:**
  * `scheduleRange`: `'today'` | `'week'` | `'month'` | `'all'` (defaults to `'all'`).
  * `withSchedules`: `boolean` (deprecated; returns schedules by default).
* **Authentication:** `@ValidUser()`.
* **Response Body:**
  ```json
  {
    "id": "uuid",
    "userId": "uuid",
    "balanceXp": 450,
    "totalEarnXp": 1250,
    "level": 6,
    "levelStatus": "Adept",
    "userName": "Alex Mercer",
    "profilePhoto": "https://s3.amazonaws.com/...",
    "activeTheme": { "theme": { "name": "Adventurer" } },
    "activeCompanion": { "companion": { "name": "Pyraxis", "quote": "Rise, little warrior..." } },
    "nextLevel": { "level": 7, "xpRequired": 1450 },
    "todaySchedule": [
      {
        "id": "meal-1",
        "type": "meal",
        "title": "BREAKFAST",
        "description": "350 kcal • C: 30g P: 25g F: 10g",
        "scheduledAt": "Sunday, March 1, 2026, 8:30 AM",
        "earnedXp": 10,
        "isTaken": true
      }
    ],
    "todayMood": { "mood": "GREAT", "energyLevel": "HIGH", "hungerLevel": "NOT_HUNGRY" },
    "XPcharts": { "weekly": [...], "monthly": [...] }
  }
  ```

### 3.2 Update Onboarding Status
* **Method & Path:** `PATCH /onboarding`
* **Authentication:** `@ValidUser()`.
* **Content-Type:** `multipart/form-data` or JSON.
* **Body:** `{ iscomplete: boolean, fitnessGoal: string }`.
* **Business Logic:** Sets `user.onBoarded = true`, `userProfile.onBoardingCompleted = true`, and updates `onboarding` record.

### 3.3 Free Starter Asset Unlocks (Onboarding Only)
* `POST /onboarding/theme/:themeId`: Unlocks starter theme for free. Rejects if onboarding is complete.
* `POST /onboarding/companion/:companionId`: Unlocks starter companion for free. Rejects if onboarding is complete.

---

## 4. Themes & Companions Store (`/themes`, `/companions`)

* `GET /themes/my-themes`: `@ValidUser()` -> Lists all global themes with `isUnlocked`, `isActive`, current user level, and remaining unlocks allowed.
* `POST /themes/:id/unlock`: `@ValidUser()` -> Deducts theme XP cost from `userProfile.balanceXp`, records unlock. Rejects if level tier or balance is insufficient.
* `POST /themes/:id/activate`: `@ValidUser()` -> Deactivates all themes, activates theme `:id`, sets `userProfile.activeThemeId`.
* `GET /companions/my-companions`: `@ValidUser()` -> Lists all companions with unlock status and active status.
* `POST /companions/:id/unlock`: `@ValidUser()` -> Deducts companion XP cost, unlocks companion.
* `POST /companions/:id/activate`: `@ValidUser()` -> Activates companion `:id`, sets `userProfile.activeCompanionId`.

---

## 5. Health & Nutrition Tracking

### 5.1 Meal Logging (`/meal-log`)
* `POST /meal-log`: `@ValidUser()`, `multipart/form-data`.
  * Body: `{ mealType: "BREAKFAST"|"LUNCH"|"DINNER"|"SNACK", carbs: int, protein: int, fats: int, description: str }`.
  * Calculates `calories = (carbs * 4) + (protein * 4) + (fats * 9)`.
* `GET /meal-log/history`: `@ValidUser()` -> Returns paginated history and today's macro summary (consumed vs needed).
* `PATCH /meal-log/:id`: Updates meal log, recalculates calories.
* `DELETE /meal-log/:id`: Removes meal log record.

### 5.2 Meal Schedules (`/meal-schedule`)
* `POST /meal-schedule`: Schedules meal with planned macros and time.
* `PATCH /meal-schedule/:id/taken?isTaken=true`: Toggles meal completed status.

### 5.3 Macro Goals (`/macro-goal`)
* `POST /macro-goal`: `@ValidUser()`. Body: `{ name, carbs, fat, protein }`. Calories auto-derived.
* `GET /macro-goal`: Lists active macro goals.

### 5.4 GLP-1 Medications (`/medication`, `/medication-schedule`)
* `POST /medication`: Creates medication entry (`name`, `type`: `CAPSULE`|`INJECTION`|`LIQUID`|`TABLET`, `doseMg`).
* `GET /medication/history`: Lists medications and total count.
* `POST /medication-schedule`: Plans medication timing (`name`, `type`, `doseMg`, `scheduleTime`).
* `PATCH /medication-schedule/:id/taken?isTaken=true`: Marks dose taken. Feeds into `track-your-shot` quest.

### 5.5 Exercise Logging (`/exercise-log`)
* `POST /exercise-log`: Records workout (`type`: `CARDIO`|`STRENGTH`|`FLEXIBILITY`|`BALANCE`, `intensity`: `LOW`|`MEDIUM`|`HIGH`, `duration`: minutes, `name`, `note`).
* `POST /exercise-log/schedule`: Schedules upcoming workout session.
* `PATCH /exercise-log/schedule/:id/taken`: Marks workout completed.

### 5.6 Mood & Weight Tracking (`/mood-log`, `/weight-log`)
* `POST /mood-log`: Records `mood`, `energyLevel`, `hungerLevel`, `note`.
* `GET /mood-log/history`: Historical mood trends.
* `POST /weight-log`: Records `weight` (string), `note`.
* `GET /weight-log/history`: Returns weight records and delta changes.
* `GET /weight-log/chart/weekly`: 7-day weight trend data.

---

## 6. Gamification, Quests & XP Analytics (`/xp-stats`)

* `GET /xp-stats/quests`: Returns today's quest checklist:
  ```json
  {
    "todayTotalXp": 80,
    "todayLogCount": 4,
    "quests": [
      { "id": "track-your-shot", "title": "Track Your Shot", "xp": 10, "isDone": true },
      { "id": "three-meals", "title": "Three Meals a Day", "xp": 30, "isDone": false },
      { "id": "mood-check", "title": "Mood Check", "xp": 30, "isDone": true },
      { "id": "step-master", "title": "Step Master", "xp": 20, "isDone": true },
      { "id": "protein-power", "title": "Protein Power", "xp": 30, "isDone": false }
    ]
  }
  ```
* `GET /xp-stats/today`, `/weekly`, `/monthly`: Aggregated XP totals for time windows.
* `GET /xp-stats/chart/weekly`: Daily XP earnings for current week (Sunday to Saturday).
* `GET /xp-stats/chart/monthly`: Weekly XP earnings for current month.
* `GET /xp-stats/logs?skip=0&take=50`: Paginated audit log of all XP awards.

---

## 7. Monetization & Subscriptions (`/payment`)

### 7.1 RevenueCat Webhook Ingestion
* **Method & Path:** `POST /payment/webhooks/revenuecat`
* **Authentication:** Header `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.
* **Payload Structure:**
  ```json
  {
    "event": {
      "type": "INITIAL_PURCHASE",
      "app_user_id": "user-uuid",
      "product_id": "monthly_premium",
      "store": "app_store",
      "is_trial_period": false,
      "purchased_at_ms": 1772370000000,
      "expiration_at_ms": 1775048400000,
      "original_transaction_id": "1000000123456789"
    }
  }
  ```
* **Success Response (200 OK):** `{ "success": true }`

### 7.2 Subscription Status
* `GET /payment/subscription`: `@ValidUser()` -> Returns current subscription status (`active`, `cancelled`, `expired`, `billing_issue`, or `none`).
* `GET /payment/history`: `@ValidUser()` -> Returns list of recorded subscription events.
* `PATCH /payment/subscription`: `@ValidAdmin()` -> Manual subscription override for test accounts.

---

## 8. S3 File Uploads (`/s3`)

> [!WARNING]
> These endpoints are currently unauthenticated (`Public`). Any caller can upload files directly to your AWS S3 bucket up to the Multer size limits.

* `POST /s3/upload`: Single file upload (Max 10MB). Returns `{ status: "success", url: "https://bucket.s3.amazonaws.com/uploads/..." }`.
* `POST /s3/upload-multiple`: Batch upload up to 20 files (10MB each). Returns array of uploaded S3 URLs.

