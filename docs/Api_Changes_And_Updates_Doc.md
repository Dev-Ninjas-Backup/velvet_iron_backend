# API Changes & System Update Documentation

**Date:** October 16–17, 2026  
**Project:** Velvet & Iron Backend  
**Document Purpose:** Detailed technical specification of all backend bug fixes, updated endpoints, payload modifications, timezone handling, and data synchronization.

---

## 1. Summary of Changes

| Area | Issue Description | Fix Summary |
|---|---|---|
| **XP Calculation** | User expected 85 XP (Spirit 30 XP + Titan's Nourishment 30 XP + Daily Login 25 XP), but only ~30 XP was recorded. | Centralized XP constants; fixed inverted onboarding guard; updated Spirit to 30 XP, Daily Login to 25 XP, and Titan's Nourishment to single-meal $\ge 30\text{g}$ protein check. |
| **Custom Quest XP** | Selecting 10 XP for custom quests caused them to display or revert to 15 XP. | Added `@Type(() => Number)` in DTO; fixed `update()` in service to recognize `xpReward` as well as `xp`; clamped values within `[5, 15]`. |
| **Timezone Alignment** | XP earned Thursday at 8:17 PM in Wisconsin (CDT) was attributed to Friday. | Removed hardcoded `Asia/Dhaka` timezone; implemented dynamic user timezone resolution (`x-timezone`) across all chart and stat endpoints. |
| **Schedule Completion Sync** | "Walk the Realm" quest completed from "Today's Quests" reset to incomplete. | Implemented bidirectional synchronization between `ScheduleCompletionLog` and `ExerciseScheduleLog` / `MedicationSchedule`. |
| **Step Tracking** | Adding steps or setting up camp did not commit to the user's local day. | Bound `updateSteps` and `setUpCamp` to user-local calendar boundaries (`getUserDayBoundaries(timezone)`). |

---

## 2. API Endpoint Changes & Specifications

### 2.1 XP Statistics & Charts

#### `GET /xp-stats/chart/weekly`
* **Purpose:** Returns daily XP totals for each day of the current week (Sunday to Saturday).
* **Changes:**
  - Now accepts user timezone via header or query param (previously hardcoded to `Asia/Dhaka`).
  - Sunday-to-Saturday window and day names are now calculated dynamically based on user local time.
* **Headers:**
  - `Authorization: Bearer <jwt_token>`
  - `x-timezone: <IANA_timezone>` (e.g. `America/Chicago`)
* **Response Sample:**
  ```json
  {
    "period": "week",
    "timezone": "America/Chicago",
    "data": [
      {
        "day": "Sunday",
        "dateLabel": "Sunday, October 11, 2026 at 12:00 AM",
        "isoDate": "2026-10-11",
        "xp": 0,
        "logsCount": 0
      },
      {
        "day": "Thursday",
        "dateLabel": "Thursday, October 15, 2026 at 8:17 PM",
        "isoDate": "2026-10-15",
        "xp": 85,
        "logsCount": 3
      },
      {
        "day": "Friday",
        "dateLabel": "Friday, October 16, 2026 at 12:00 AM",
        "isoDate": "2026-10-16",
        "xp": 0,
        "logsCount": 0
      }
    ],
    "totalXp": 85
  }
  ```

---

#### `GET /xp-stats/chart/monthly`
* **Purpose:** Returns weekly aggregate XP for each week of the current month.
* **Changes:** Now accepts and calculates weeks using user timezone.
* **Headers:**
  - `Authorization: Bearer <jwt_token>`
  - `x-timezone: <IANA_timezone>` (e.g. `America/Chicago`)

---

#### `GET /xp-stats/weekly` & `GET /xp-stats/monthly` & `GET /xp-stats/summary`
* **Purpose:** Returns overall user XP summary for current day, week, and month.
* **Changes:** Now extracts `x-timezone` from request and calculates periods relative to user local calendar time rather than server system clock.

---

### 2.2 Custom Quests

#### `POST /quests/custom`
* **Purpose:** Creates a new user custom quest.
* **Changes:**
  - Added support for string-formatted numbers in `xp` and `xpReward` (e.g., `"10"` is parsed as `10`).
  - Clamps reward strictly between `5` and `15` XP.
  - Default XP if not specified is `10` XP.
* **Request Payload Sample:**
  ```json
  {
    "title": "Evening Mobility",
    "category": "FITNESS",
    "xpReward": 10,
    "recurrence": "DAILY",
    "timeOfDay": "20:00"
  }
  ```
* **Response Sample:**
  ```json
  {
    "success": true,
    "data": {
      "id": "e4a7d182-3591-447a-85b9-1f061e828452",
      "title": "Evening Mobility",
      "name": "Evening Mobility",
      "category": "FITNESS",
      "xp": 10,
      "xpReward": 10,
      "frequency": "DAILY",
      "recurrence": "DAILY",
      "isCompleted": false,
      "isDone": false,
      "isCustom": true
    }
  }
  ```

---

#### `PATCH /quests/custom/:id`
* **Purpose:** Updates existing custom quest fields.
* **Changes:**
  - Fixed bug where `xpReward` was ignored in the update payload.
  - Now accepts either `xp` or `xpReward`, coerces strings to numbers, and applies `[5, 15]` clamp.
* **Request Payload Sample:**
  ```json
  {
    "xpReward": 10
  }
  ```
* **Response Sample:**
  ```json
  {
    "id": "e4a7d182-3591-447a-85b9-1f061e828452",
    "title": "Evening Mobility",
    "xp": 10,
    "xpReward": 10
  }
  ```

---

#### `POST /quests/custom/:id/complete` (and legacy `PATCH /quests/custom/:id/complete`)
* **Purpose:** Marks a custom quest complete and awards XP subject to daily anti-abuse limit (50 XP/day).
* **Changes:**
  - Extracts user timezone (`x-timezone`).
  - Daily 50 XP cap is evaluated over the user's localized 24-hour day (`[startOfDay, endOfDay]`) rather than UTC/server midnight.

---

### 2.3 Today's Quests & Unified Feed

#### `GET /quests/today`
* **Purpose:** Returns all unified quests for today (Codex quests, Custom quests, and Scheduled Items).
* **Changes:**
  - Correctly outputs `xpReward: 10` for custom quests.
  - Formats scheduled workout descriptions using user local timezone.
  - Evaluates completion status against the user's localized date boundaries.
* **Headers:**
  - `x-timezone: America/Chicago`
* **Response Sample:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "codex_titan_nourishment",
        "title": "Titan's Nourishment",
        "description": "Log a single meal containing at least 30g of protein",
        "xpReward": 30,
        "isCompleted": true,
        "questType": "CODEX"
      },
      {
        "id": "workout_walk_the_realm",
        "title": "Walk the Realm",
        "description": "CARDIO • 30 min • 6:00 PM",
        "xpReward": 10,
        "isCompleted": true,
        "questType": "WORKOUT_SCHEDULE"
      },
      {
        "id": "custom_e4a7d182",
        "title": "Evening Mobility",
        "xpReward": 10,
        "isCompleted": false,
        "questType": "CUSTOM"
      }
    ]
  }
  ```

---

#### `POST /quests/today/complete`
* **Purpose:** Marks a unified quest card as completed.
* **Changes:**
  - Extracts user timezone (`x-timezone`).
  - Evaluates `scheduleCompletionLog` using user's localized day bounds.
  - **Bidirectional Sync:** When completing a `WORKOUT` item (e.g. "Walk the Realm"), it automatically updates the corresponding record in `ExerciseScheduleLog` (`isTaken: true`, `lastTakenDate: now`).
  - When completing a `MEDICATION` item, updates `MedicationSchedule.isTaken = true`.
* **Request Payload Sample:**
  ```json
  {
    "questId": "workout_b81c2f90-1e52-4402-9901-2e6e30018d99",
    "questType": "WORKOUT_SCHEDULE"
  }
  ```
* **Response Sample:**
  ```json
  {
    "success": true,
    "data": {
      "id": "workout_b81c2f90-1e52-4402-9901-2e6e30018d99",
      "isCompleted": true,
      "xpAwarded": 10,
      "companionTotalXp": 85,
      "companionLevel": 1
    }
  }
  ```

---

### 2.4 Exercise & Medication Schedules

#### `PATCH /exercise-log/schedules/:id/taken?isTaken=true`
* **Purpose:** Marks an exercise schedule as taken from Exercise History.
* **Changes:**
  - Evaluates `alreadyTakenToday` using `getUserDayBoundaries(timezone)`.
  - **Bidirectional Sync:** Automatically inserts a completion record into `scheduleCompletionLog` so Today's Quests immediately reflects the workout as completed.

---

#### `PATCH /medication-schedule/:id/taken?isTaken=true`
* **Purpose:** Marks a medication schedule as taken.
* **Changes:**
  - Extracts `x-timezone`.
  - Uses `getUserDayBoundaries(timezone)` to prevent duplicate XP awards on the same local calendar day.

---

### 2.5 Step Tracking & Set Up Camp

#### `POST /step-log`
* **Purpose:** Updates or adds to daily step count.
* **Changes:**
  - Accepts user timezone (`x-timezone`).
  - Normalizes target date to the user's localized calendar date (`YYYY-MM-DD`).
* **Request Payload Sample:**
  ```json
  {
    "steps": 1960
  }
  ```

---

#### `POST /step-log/set-up-camp`
* **Purpose:** Finalizes daily walk ritual and locks steps for the day.
* **Changes:**
  - Accepts user timezone (`x-timezone`).
  - Locks and commits the step log for the user's exact local date (`YYYY-MM-DD`) rather than UTC midnight.

---

### 2.6 Daily Login Reward

#### `POST /profile/daily-login`
* **Purpose:** Claims the daily login XP reward.
* **Changes:**
  - Default reward value increased from 10 XP to **25 XP** (`XP_REWARDS.DAILY_LOGIN`).
  - Anti-duplication check checks user local calendar boundaries (`getUserDayBoundaries(timezone)`).

---

## 3. Centralized XP Configuration Reference

All reward values are now defined in `src/common/constants/xp.constants.ts`:

```typescript
export const XP_REWARDS = {
  // Daily Login Claim Reward
  DAILY_LOGIN: 25,

  // Action Logging (Immediate XP on entry)
  MOOD_LOG: 30, // Spirit (Mood Check)
  MEAL_LOG: 10,
  EXERCISE_LOG: 10,
  MEDICATION_LOG: 10,
  WEIGHT_LOG: 10,
  SCHEDULE_ITEM_COMPLETION: 10,

  // Daily Codex Quests (Quests screen & XP stats evaluation)
  QUESTS: {
    TRACK_YOUR_SHOT: 10,
    THREE_MEALS: 30,
    MOOD_CHECK: 30, // Spirit
    STEP_MASTER: 20,
    TITANS_NOURISHMENT: 30, // >= 30g single-meal protein
    MANA_INFUSION: 20,
  },

  // Custom Quests
  CUSTOM_QUEST: {
    MIN_XP: 5,
    MAX_XP: 15,
    DEFAULT_XP: 10,
    DAILY_TOTAL_CAP: 50,
  },
} as const;
```

---

## 4. Test Verification Script

An automated test script was created to verify all changes against the live database:
- **Location:** `scripts/test-recent-changes.js`
- **Execution Command:**
  ```bash
  node scripts/test-recent-changes.js
  ```
- **Test Scenarios Covered:**
  - Custom Quest 10 XP (number & string coercion).
  - Timezone attribution (Wisconsin CDT 8:17 PM $\rightarrow$ Thursday, Dhaka $\rightarrow$ Friday).
  - Medication schedule local boundary & duplicate protection.
  - Exercise schedule local boundary completion.
  - "Walk the Realm" bidirectional synchronization.
  - Step tracking local calendar date persistence.
  - Unified `/quests/today` feed response validation.
