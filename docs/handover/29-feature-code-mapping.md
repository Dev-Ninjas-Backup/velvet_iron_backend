# Velvet & Iron Backend - Master Feature-to-Code Mapping Matrix

**Document ID:** `29-feature-code-mapping.md`  
**Target Audience:** All Engineers  

---

## 1. Complete Feature-to-Code Matrix

The following master matrix traces every functional feature from client entry points through routes, controllers, services, database models, external integrations, and test coverage:

| Feature | Frontend Entry Point | HTTP Route(s) | Controller | Service | Database Models | External Services | Test Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User Registration** | Register Screen | `POST /auth/register` | `AuthController` | `AuthService` | `User` | Nodemailer / SMTP | `test-auth.http` | **Implemented** |
| **Email Verification** | OTP Input Screen | `POST /auth/verify-email`<br>`POST /auth/resend-verification-otp` | `AuthController` | `AuthService` | `User` | Nodemailer / SMTP | `test-auth.http` | **Implemented** |
| **Local Login** | Login Screen | `POST /auth/login` | `AuthController` | `AuthService` | `User`, `RefreshToken`, `Session` | None | `test-auth.http` | **Implemented** |
| **Token Auto-Refresh** | Mobile Interceptor | Transparent on all routes | Guard: `OptionalJwtGuard` | `AuthService` | `Session`, `User` | None | `test-token-refresh.http` | **Implemented** |
| **Firebase Social Login** | Google / Apple Button | `POST /auth/firebase-login` | `AuthController` | `AuthService`, `FirebaseAuthService` | `User`, `Session` | Firebase Admin SDK | `test-google-auth.http` | **Implemented** |
| **Discord OAuth Login** | Discord Button | `GET /auth/discord`<br>`GET /auth/discord/callback` | `AuthController` | `AuthService`, `DiscordStrategy` | `User`, `Session` | Discord OAuth2 API | Manual Browser | **Implemented** |
| **Password Reset** | Forgot Password | `POST /auth/forgot-password`<br>`POST /auth/verify-reset-otp`<br>`POST /auth/reset-password` | `AuthController` | `AuthService` | `User`, `Session` | Nodemailer / SMTP | `test-auth.http` | **Implemented** |
| **User Profile Management**| Profile Screen | `GET /auth/me`<br>`PATCH /auth/profile` | `AuthController` | `AuthService`, `AwsService` | `User` | AWS S3 (Avatars) | `test-auth.http` | **Implemented** |
| **Onboarding Wizard** | Onboarding Flow | `PATCH /onboarding`<br>`GET /onboarding` | `OnboardingController` | `OnboardingService` | `onboarding`, `User`, `UserProfile` | None | None | **Implemented** |
| **Onboarding Starter Asset**| Starter Selection | `POST /onboarding/theme/:themeId`<br>`POST /onboarding/companion/:companionId` | `OnboardingController` | `OnboardingService` | `UserTheme`, `UserCompanion` | None | None | **Implemented** |
| **Profile & Schedule Feed**| Home / Dashboard | `GET /profile` | `ProfileController` | `ProfileService` | `UserProfile`, `MealSchedule`, `MedicationSchedule`, `ExerciseScheduleLog`, `MoodLog` | None | None | **Implemented** |
| **XP & Level Progression** | Level Bar / Badges | `POST /profile/add-xp`<br>`POST /profile/add-xp/log` | `ProfileController` | `LeveladdService`, `ProfileService` | `UserProfile`, `XpLog` | None | None | **Implemented** |
| **Daily Login XP** | Daily Claim Modal | `POST /profile/daily-login` | `ProfileController` | `ProfileService`, `LeveladdService` | `UserProfile`, `XpLog` | None | None | **Implemented** |
| **Themes Catalog & Unlock**| Theme Store | `GET /themes/my-themes`<br>`POST /themes/:id/unlock`<br>`POST /themes/:id/activate` | `ThemeController` | `ThemeService` | `Theme`, `UserTheme`, `UserProfile` | None | None | **Implemented** |
| **Companions & Quotes** | Companion Store | `GET /companions/my-companions`<br>`POST /companions/:id/unlock`<br>`POST /companions/:id/activate` | `CompanionController`| `CompanionService` | `Companion`, `UserCompanion`, `UserProfile`| None | None | **Implemented** |
| **Meal Logging & Macros** | Nutrition Screen | `POST /meal-log`<br>`GET /meal-log/history`<br>`PATCH /meal-log/:id`<br>`DELETE /meal-log/:id` | `MealLogController` | `MealLogService`, `LeveladdService` | `MealLog`, `XpLog` | None | None | **Implemented** (Inverted XP bug) |
| **Meal Scheduling** | Meal Planner | `POST /meal-schedule`<br>`PATCH /meal-schedule/:id/taken`<br>`GET /meal-schedule/history` | `MealScheduleController`| `MealScheduleService` | `MealSchedule` | None | None | **Implemented** |
| **Macro Goals Target** | Goal Settings | `POST /macro-goal`<br>`GET /macro-goal`<br>`PATCH /macro-goal/:id`<br>`DELETE /macro-goal/:id` | `MacroGoalController` | `MacroGoalService` | `MacroGoal` | None | None | **Implemented** (Crash bug on :id) |
| **Medication & GLP-1 Shots**| Med Cabinet | `POST /medication`<br>`GET /medication/history`<br>`PATCH /medication/:id`<br>`DELETE /medication/:id` | `MedicationController`| `MedicationService` | `Medication` | None | None | **Implemented** (Inverted XP bug) |
| **Medication Schedules** | Med Reminders | `POST /medication-schedule`<br>`PATCH /medication-schedule/:id/taken`<br>`GET /medication-schedule/today`| `MedicationScheduleController`| `MedicationScheduleService` | `MedicationSchedule` | None | None | **Implemented** |
| **Exercise & Workouts** | Workout Tracker | `POST /exercise-log`<br>`GET /exercise-log/history`<br>`POST /exercise-log/schedule`<br>`PATCH /exercise-log/schedule/:id/taken` | `ExerciseLogController`| `ExerciseLogService` | `ExerciseLog`, `ExerciseScheduleLog` | None | None | **Implemented** (Inverted XP bug) |
| **Mood, Energy & Hunger** | Daily Check-in | `POST /mood-log`<br>`GET /mood-log/history`<br>`GET /mood-log/latest`<br>`PATCH /mood-log/:id` | `MoodLogController` | `MoodLogService` | `MoodLog` | None | None | **Implemented** (Inverted XP bug) |
| **Weight & Delta Stats** | Weigh-in Screen | `POST /weight-log`<br>`GET /weight-log/history`<br>`GET /weight-log/chart/weekly` | `WeightLogController` | `WeightLogService` | `WeightLog` | None | None | **Implemented** (Inverted XP bug) |
| **Daily Quests Engine** | Quest Dashboard | `GET /xp-stats/quests` | `XpStatsController` | `XpStatsService` | Multi-model aggregation query | None | None | **Implemented** |
| **XP Period Analytics** | Analytics / Charts | `GET /xp-stats/today`<br>`GET /xp-stats/weekly`<br>`GET /xp-stats/chart/weekly` | `XpStatsController` | `XpStatsService` | `XpLog` | None | None | **Implemented** |
| **24-Hour Rate Limiting** | Timed Claims | `GET /xp-timeout`<br>`GET /xp-timeout/readstory` | `XpTimeoutController` | `XpTimeoutService` | In-memory `Map` (No DB) | None | None | **Implemented** (Fragile) |
| **RevenueCat Webhooks** | Store Webhook | `POST /payment/webhooks/revenuecat` | `PaymentController` | `PaymentService` | `Subscription`, `SubscriptionEvent` | RevenueCat API | None | **Implemented** |
| **Subscription Status** | Subscription Screen | `GET /payment/subscription`<br>`GET /payment/history` | `PaymentController` | `PaymentService` | `Subscription`, `SubscriptionEvent` | None | None | **Implemented** |
| **S3 Media Ingestion** | File Picker | `POST /s3/upload`<br>`POST /s3/upload-multiple` | `S3Controller` | `AwsService` | None (Direct S3) | AWS S3 | None | **Implemented** (Unauthenticated) |
| **Admin User Inspection** | Admin Console | `GET /user`<br>`GET /user/:id` | `UserController` | `UserService` | `User` | None | None | **Implemented** (Unauthenticated) |

