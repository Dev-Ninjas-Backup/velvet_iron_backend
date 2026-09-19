# Velvet & Iron Backend - Change Impact Map

**Document ID:** `27-change-impact-map.md`  
**Target Audience:** Architects, Senior Developers, Code Reviewers  

---

## 1. Feature Modification Impact Analysis

Before modifying any business logic or schema in this repository, consult this matrix to trace the cascading impact across modules, database models, and integrations:

### 1.1 Modifying the XP Progression or Level Formula
* **If you change:** Level thresholds, maximum level cap, or XP required per level.
* **Cascade Flow:**
  ```text
  Level Formula Modification
  ├── Engine: src/leveladd/levelCalculator.ts (calculateLevel)
  ├── Titles: src/leveladd/levelStatus.ts (levelStatus titles array)
  ├── Service: src/leveladd/leveladd.service.ts (addXpToUser)
  ├── Profile: src/profile/profile.service.ts (getProfile nextLevel calculation)
  ├── Gating: src/leveladd/levelCalculator.ts (availableThemesForLevel, availableCompanionForLevel)
  ├── Store: src/theme/theme.service.ts & src/companion/companion.service.ts
  └── Database: user_profiles table (level column constraints)
  ```
* **Developer Warning:** If you increase the level cap beyond 50, you must add corresponding rank title strings in `levelStatus.ts`; otherwise, users at levels > 50 will receive `"Invalid Level"`.

---

### 1.2 Adding or Modifying Daily Quests
* **If you change:** The 5 daily health checklist quests.
* **Cascade Flow:**
  ```text
  Daily Quest Modification
  ├── Engine: src/xp-stats/xp-stats.service.ts (getTodayQuestXp)
  ├── Affected Aggregations:
  │   ├── Medication: this.prisma.client.medication.count()
  │   ├── Meals: this.prisma.client.mealLog.findMany()
  │   ├── Mood: this.prisma.client.moodLog.count()
  │   └── Exercise: this.prisma.client.exerciseLog.aggregate()
  ├── DTO: src/xp-stats/dto/xp-stats-response.dto.ts
  ├── Profile: src/profile/profile.service.ts (ProfileWithSchedulesDto)
  └── Client: Flutter Mobile Quest Dashboard UI
  ```
* **Developer Warning:** Quests are currently hardcoded in `xp-stats.service.ts` rather than dynamically queried from the `quests` database table. Changing a quest requires editing the TypeScript code in `XpStatsService`.

---

### 1.3 Changing Meal Calorie or Macro Calculations
* **If you change:** Calorie calculation factors, macro targets, or validation.
* **Cascade Flow:**
  ```text
  Calorie & Macro Modification
  ├── Meal Log: src/meal-log/meal-log.service.ts (calculateCalories)
  ├── Meal Schedule: src/meal-schedule/meal-schedule.service.ts (calculateCalories)
  ├── Macro Goals: src/macro-goal/macro-goal.service.ts (createMacroGoal, updateMacroGoal)
  ├── DTOs:
  │   ├── src/meal-log/dto/create-meal-log.dto.ts
  │   └── src/macro-goal/dto/create-macro-goal.dto.ts
  └── Analytics: src/xp-stats/xp-stats.service.ts (evaluating 120g protein quest)
  ```

---

### 1.4 Adding a New OAuth Identity Provider
* **If you change:** Adding a new social login (e.g. Apple Sign-In native or Twitter).
* **Cascade Flow:**
  ```text
  New OAuth Provider
  ├── Database: prisma/schema/user.prisma (Add providerId column)
  ├── Migration: npx prisma migrate dev --name add_provider_id
  ├── Strategy: src/lib/strategy/<provider>.strategy.ts (Create Passport Strategy)
  ├── Controller: src/auth/auth.controller.ts (Mount initiation & callback routes)
  ├── Service: src/auth/auth.service.ts (Add account linking/creation callback)
  ├── Config: .env.example & src/main.ts (Add provider credentials & Swagger flags)
  └── Client: Flutter Auth Bloc & deep link handler
  ```

---

### 1.5 Modifying In-App Subscriptions (RevenueCat)
* **If you change:** Adding subscription tiers, trial lengths, or product IDs.
* **Cascade Flow:**
  ```text
  Subscription Product Modification
  ├── RevenueCat: RevenueCat Dashboard (Create new Product / Entitlement)
  ├── Webhook: src/payment/payment.service.ts (mapEventToStatus, product_id handling)
  ├── Controller: src/payment/payment.controller.ts (Update Swagger DTOs)
  ├── Database: prisma/schema/payments.prisma (Subscription table)
  └── Client: Flutter In-App Purchase Paywall
  ```

---

### 1.6 Modifying User Avatar or File Storage
* **If you change:** S3 bucket, folder prefixes, or file size limits.
* **Cascade Flow:**
  ```text
  Storage Pipeline Modification
  ├── Environment: .env (AWS_S3_BUCKET_NAME, AWS_BUCKET_REGION)
  ├── Service: src/aws/aws.service.ts (upload, uploadProfilePhoto key patterns)
  ├── Auth Controller: src/auth/auth.controller.ts (Multer file limits & MIME filter)
  ├── S3 Controller: src/s3/s3.controller.ts (upload & upload-multiple)
  └── User Profile: User.avatar, User.profilePhoto DB columns
  ```

