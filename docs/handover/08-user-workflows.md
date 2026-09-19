# Velvet & Iron Backend - Complete User Workflows

**Document ID:** `08-user-workflows.md`  
**Target Audience:** Backend Engineers, Mobile Developers, QA Automation Engineers  

---

## 1. User Registration & Email Verification Workflow

### Purpose
Allows a new user to create an account, generates a 4-digit verification OTP, emails the code via SMTP, and verifies the email.

```mermaid
sequenceDiagram
    autonumber
    actor User as New User
    participant Client as Mobile / Web App
    participant AuthCtrl as AuthController
    participant AuthSvc as AuthService
    participant EmailSvc as EmailService
    participant DB as PostgreSQL (Prisma)

    User->>Client: Enters name, email, password, username
    Client->>AuthCtrl: POST /auth/register
    AuthCtrl->>AuthSvc: Register(createAuthDto)
    AuthSvc->>DB: findFirst({ email OR username })
    alt Account Already Exists
        DB-->>AuthSvc: existingUser found
        AuthSvc-->>Client: { success: false, message: "Email/Username already in use" }
    end
    AuthSvc->>AuthSvc: Hash password with bcrypt(10)
    AuthSvc->>AuthSvc: generateOtp() -> 4-digit numeric string
    AuthSvc->>DB: user.create({ email, password, otp, expiry: now + 10m })
    opt EMAIL_VERIFICATION_REQUIRED == 'true'
        AuthSvc->>EmailSvc: sendVerificationOtp(email, otp, name)
        EmailSvc-->>User: Delivers HTML email with 4-digit OTP
    end
    AuthSvc-->>Client: 201 Created { success: true, message: "Registered successfully" }

    User->>Client: Inputs 4-digit OTP received in email
    Client->>AuthCtrl: POST /auth/verify-email { email, otp }
    AuthCtrl->>AuthSvc: verifyEmail(dto)
    AuthSvc->>DB: findUnique({ email })
    alt OTP Invalid or Expired
        AuthSvc-->>Client: 400 Bad Request ("Invalid or expired OTP")
    end
    AuthSvc->>DB: user.update({ emailVerified: true, emailVerificationOtp: null })
    AuthSvc-->>Client: 200 OK { success: true, message: "Email verified successfully" }
```

* **Actor:** Unauthenticated visitor.
* **Database Mutations:**
  * `INSERT INTO users`: creates record with `emailVerified: false`, `emailVerificationOtp: "XXXX"`, `emailVerificationExpiry`.
  * `UPDATE users`: sets `emailVerified: true`, clears OTP columns.
* **Failure Modes:** 
  * Duplicate email/username: returns `{ success: false }`.
  * Expired OTP (>10 mins): throws `BadRequestException`.

---

## 2. Standard Login & Session Token Issuance

### Purpose
Authenticates a user via local credentials, generates JWT access and refresh tokens, creates a tracked session in the database, and delivers tokens via dual channels (JSON body + HTTP cookies + response headers).

* **Trigger:** User submits `emailOrUsername` and `password` on `POST /auth/login`.
* **Flow:**
  1. Passport `LocalStrategy` calls `AuthService.validateUser(emailOrUsername, password)`.
  2. Queries `User` where `email == input OR username == input`.
  3. Compares plaintext password against `user.password` using `bcrypt.compare()`.
  4. If `EMAIL_VERIFICATION_REQUIRED === 'true'` and `user.emailVerified === false`, throws `401 Unauthorized`.
  5. `AuthService.generateTokens()` signs:
     * `access_token`: payload `{ id, email, name, role }` with lifespan based on `ACCESS_TOKEN_EXPIRATION_MS`.
     * `refresh_token`: payload `{ id, email, name, role }` with lifespan based on `REFRESH_TOKEN_EXPIRATION_MS`.
  6. `AuthController.login()` sets:
     * Cookie `access_token`: `maxAge: accessTokenExpirMs`, `sameSite: 'lax'`, `secure: isProduction`.
     * Cookie `refresh_token`: `maxAge: refreshTokenExpirMs`.
     * Header `X-Access-Token`: `<token>`.
     * Header `X-Refresh-Token`: `<token>`.
  7. Returns JSON response containing `{ access_token, refresh_token, user }`.

---

## 3. Inflight Dual-Token Auto-Refresh Workflow

### Purpose
Allows an authorized user with an expired access token to continue making API requests uninterrupted without manual token refresh round-trips.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Flutter App
    participant Guard as OptionalJwtGuard
    participant JwtSvc as JwtService
    participant AuthSvc as AuthService
    participant Ctrl as Route Controller

    Client->>Guard: GET /profile (Expired Access Token, Valid Refresh Token)
    Guard->>JwtSvc: verify(accessToken) -> THROWS TokenExpiredError
    Guard->>JwtSvc: verify(refreshToken) -> SUCCEEDS (valid)
    Guard->>AuthSvc: generateAccessTokenOnly(userPayload)
    Guard->>AuthSvc: generateRefreshTokenOnly(userPayload, oldRefreshToken)
    Guard->>Client: Injects headers: X-New-Access-Token, X-New-Refresh-Token
    Guard->>Client: Injects Set-Cookie: access_token, refresh_token
    Guard->>Ctrl: Sets req.user = userPayload, returns true
    Ctrl-->>Client: 200 OK (Returns requested profile data seamlessly)
```

---

## 4. Discord OAuth Mobile Deep-Link Workflow

### Purpose
Authenticates users via Discord on mobile, provisions accounts with a generated password, and redirects back into Flutter via custom URL scheme.

1. **Initiation:** Mobile client opens URL `GET /auth/discord` in system browser.
2. **Discord Auth:** User authorizes the application on Discord's consent screen.
3. **Callback Handling:** Discord redirects browser to `GET /auth/discord/callback?code=...`.
4. **Account Resolution:**
   * Checks if user exists with matching `discordId` or `email`.
   * If non-existent: generates 16-character secure random password, hashes it, creates `User` record, assigns unique username, and sends credentials via `emailService.sendGoogleAuthPassword()`.
   * If existing: links `user.discord = discordId` and sets `emailVerified = true`.
5. **Token Generation:** Signs new `access_token` and `refresh_token`.
6. **Mobile Deep-Link Redirect:**
   * Backend issues an HTTP 302 redirect to:
     ```text
     velvetapp://auth/discordapp?access_token=<JWT>&refresh_token=<JWT>&user=<ENCODED_JSON>
     ```
   * Operating system hands redirect to Flutter app, which parses tokens and transitions to logged-in state.

---

## 5. Onboarding & Free Starter Theme/Companion Claim

### Purpose
New users select their fitness goal and claim their free starter Theme and Lore Companion without spending XP.

```mermaid
sequenceDiagram
    autonumber
    actor User as New User
    participant Client as Flutter App
    participant OnboardCtrl as OnboardingController
    participant OnboardSvc as OnboardingService
    participant DB as PostgreSQL

    User->>Client: Selects Starter Theme (e.g., "Adventurer")
    Client->>OnboardCtrl: POST /onboarding/theme/:themeId
    OnboardCtrl->>OnboardSvc: unlockThemeOnboarding(userId, themeId)
    OnboardSvc->>DB: onboarding.findUnique({ userId })
    alt onboarding.iscomplete == true
        OnboardSvc-->>Client: 400 Bad Request ("Cannot unlock theme after onboarding is complete")
    end
    OnboardSvc->>DB: userTheme.deleteMany({ userId })
    OnboardSvc->>DB: userTheme.create({ userId, themeId, isActive: true })
    OnboardSvc-->>Client: 200 OK { success: true, message: "Theme unlocked and activated" }

    User->>Client: Selects Starter Companion (e.g., "Pyraxis")
    Client->>OnboardCtrl: POST /onboarding/companion/:companionId
    OnboardCtrl->>OnboardSvc: unlockCompanionOnboarding(userId, companionId)
    OnboardSvc->>DB: userCompanion.deleteMany({ userId })
    OnboardSvc->>DB: userCompanion.create({ userId, companionId, isActive: true })
    OnboardSvc-->>Client: 200 OK { success: true, message: "Companion unlocked and activated" }

    User->>Client: Completes Questionnaire (e.g., Fitness Goal = "Muscle Gain")
    Client->>OnboardCtrl: PATCH /onboarding { iscomplete: true, fitnessGoal: "Muscle Gain" }
    OnboardCtrl->>OnboardSvc: updateOnboardingStatus(userId, dto)
    OnboardSvc->>DB: user.update({ onBoarded: true })
    OnboardSvc->>DB: userProfile.updateMany({ onBoardingCompleted: true })
    OnboardSvc->>DB: onboarding.upsert({ iscomplete: true, fitnessGoal: "Muscle Gain" })
    OnboardSvc-->>Client: 200 OK { success: true, data: { iscomplete: true } }
```

---

## 6. Meal Logging & Automated Calorie Calculation

### Purpose
Allows users to log nutritional intake by entering raw macronutrients. Caloric values are derived automatically on the backend.

* **Actor:** Authenticated `USER`.
* **Trigger:** `POST /meal-log` with body `{ mealType: "LUNCH", description: "Grilled Chicken Salad", carbs: 15, protein: 45, fats: 12 }`.
* **Backend Processing:**
  1. Computes total calories:
     $$\text{Calories} = (15 \times 4) + (45 \times 4) + (12 \times 9) = 60 + 180 + 108 = 348\text{ kcal}$$
  2. Evaluates XP award condition:
     ```typescript
     // Current codebase behavior:
     if (user && !user.onBoarded) {
       await this.leveladdService.addXpToUser(userId, 10, 'Meal log entry');
     }
     ```
  3. Creates record in `meal_logs` with computed calories.
  4. Returns complete `MealLogResponseDto`.
* **Side Effects:** If user has not completed onboarding, awards 10 XP, creates an entry in `xp_logs`, and recalculates user level.

---

## 7. GLP-1 Medication Schedule & Adherence Tracking

### Purpose
Tracks subcutaneous injections (semaglutide, tirzepatide) or oral medications and records when doses are taken.

1. **Schedule Creation:**
   * User submits `POST /medication-schedule` with `{ name: "Ozempic", type: "INJECTION", doseMg: 1, scheduleTime: "2026-03-01T09:00:00Z" }`.
   * Record created in `medication_schedules` with `isTaken: false`.
2. **Taking the Dose:**
   * User clicks "Mark Taken" in the app on injection day.
   * Client calls `PATCH /medication-schedule/:id/taken?isTaken=true`.
   * Backend updates `medication_schedules.isTaken = true`.
   * If `!user.onBoarded`, calls `LeveladdService.addXpToUser(userId, 10, 'Medication schedule marked as taken')`.
3. **Daily Quest Update:**
   * `GET /xp-stats/quests` checks if any medication was taken today.
   * Marks quest `track-your-shot` as `isDone: true`.

---

## 8. Theme / Companion XP Store Unlock Workflow

### Purpose
Allows high-level users to spend earned `balanceXp` to unlock additional fantasy themes and companions.

```mermaid
sequenceDiagram
    autonumber
    actor User as Level 15 User
    participant Client as Mobile App
    participant ThemeCtrl as ThemeController
    participant ThemeSvc as ThemeService
    participant DB as PostgreSQL

    User->>Client: Clicks "Unlock Mage Theme" (Cost: 250 XP)
    Client->>ThemeCtrl: POST /themes/:id/unlock
    ThemeCtrl->>ThemeSvc: unlockTheme(userId, themeId)
    ThemeSvc->>DB: Query userProfile and userTheme records
    ThemeSvc->>ThemeSvc: calculateLevel(totalEarnXp) -> Level 15
    ThemeSvc->>ThemeSvc: availableThemesForLevel(15, currentUnlockedCount: 1)
    alt Level Too Low for Additional Theme
        ThemeSvc-->>Client: 400 Bad Request ("Your level does not allow you to unlock more themes")
    end
    alt Insufficient balanceXp (< 250)
        ThemeSvc-->>Client: 400 Bad Request ("Not enough XP to unlock this theme")
    end
    ThemeSvc->>DB: userProfile.update({ balanceXp: { decrement: 250 } })
    ThemeSvc->>DB: userTheme.create({ userId, themeId, isActive: false })
    ThemeSvc-->>Client: 200 OK { message: "Theme unlocked successfully", updatedBalanceXp: 450 }
```

---

## 9. RevenueCat Subscription Webhook Workflow

### Purpose
Receives asynchronous purchase and cancellation events from Apple App Store and Google Play Store via RevenueCat.

```mermaid
sequenceDiagram
    autonumber
    participant RevCat as RevenueCat Server
    participant PayCtrl as PaymentController
    participant PaySvc as PaymentService
    participant DB as PostgreSQL

    RevCat->>PayCtrl: POST /payment/webhooks/revenuecat (Header: Authorization: Bearer SECRET)
    PayCtrl->>PayCtrl: Verify Header matches REVENUECAT_WEBHOOK_SECRET
    alt Secret Invalid
        PayCtrl-->>RevCat: 401 Unauthorized
    end
    PayCtrl->>PaySvc: handleRevenueCatWebhook(payload)
    PaySvc->>DB: subscription.findFirst({ userId: app_user_id })
    alt New Subscription
        PaySvc->>DB: subscription.create({ userId, appUserId, status: "active", productId, ... })
    else Existing Subscription Renewal / Cancel
        PaySvc->>DB: subscription.update({ status: mapEventToStatus(type), expirationDate })
    end
    PaySvc->>DB: subscriptionEvent.create({ subscriptionId, eventType, payload })
    PaySvc-->>PayCtrl: { success: true }
    PayCtrl-->>RevCat: 200 OK
```

