# Backend API Specification: Recent Updates & Timezone Alignments

**Document Version:** 1.0.0  
**Last Updated:** October 10, 2026  
**Status:** Implemented & Verified in Production  

---

## Table of Contents
1. [Overview & Architectural Changes](#1-overview--architectural-changes)
2. [Global Headers & Parameters](#2-global-headers--parameters)
3. [Route Specifications](#3-route-specifications)
   - [3.1 Exercise Logging (Backdating Supported)](#31-exercise-logging-backdating-supported)
   - [3.2 Exercise Log History](#32-exercise-log-history)
   - [3.3 Quests Feed (`/quests/today`)](#33-quests-feed-queststoday)
   - [3.4 Daily XP Stats & Codex Quests (`/xp-stats`)](#34-daily-xp-stats--codex-quests-xp-stats)
   - [3.5 Water Log (`/water-log/today`)](#35-water-log-water-logtoday)
   - [3.6 Step Log (`/step-log/today`)](#36-step-log-step-logtoday)
   - [3.7 Mood Log (`/mood-log/today`)](#37-mood-log-mood-logtoday)
   - [3.8 Medication Schedules (`/medication-schedule/today`)](#38-medication-schedules-medication-scheduletoday)
   - [3.9 Workout Schedules (`/exercise-log/schedule/today`)](#39-workout-schedules-exercise-logscheduletoday)
   - [3.10 Meal Schedules (`/meal-schedules/today`)](#310-meal-schedules-meal-schedulestoday)
   - [3.11 Daily Login & Streak Retention (`/profile/daily-login`)](#311-daily-login--streak-retention-profiledaily-login)
4. [Enum Reference Table](#4-enum-reference-table)

---

## 1. Overview & Architectural Changes

This release resolves two critical mobile tracking issues and eliminates time-zone drift across the platform:

1. **Exercise History Backdating (Issue 4):**
   - Endpoints accept custom ISO 8601 timestamps (`loggedAt`) to allow users to log past workouts.
   - History queries sort chronologically by `loggedAt DESC`.

2. **Timezone-Aware Day Boundaries & Streak Alignment (Issue 5):**
   - Replaced server UTC midnight (`00:00:00Z`) and hardcoded `Asia/Dhaka` references with dynamic IANA timezone resolution.
   - Day boundaries evaluate from `00:00:00.000` to `23:59:59.999` in the user's local timezone.
   - Daily logs no longer reset prematurely at 8:00 PM EDT / 5:00 PM PDT.

3. **Step Quest Trigger Decoupling (Bonus Fix):**
   - Logging a 30+ min exercise no longer marks the step quest (`step-master` / "Stride of the Realmwalker") as completed. Step quests complete exclusively when step targets are achieved.

---

## 2. Global Headers & Parameters

All endpoints support two methods to specify the user's local day:

### Approach A: `x-timezone` Header (Recommended)
Pass the user's standard IANA timezone name in the request header:
```http
x-timezone: America/New_York
```
*(Acceptable alternatives: `x-time-zone: America/Chicago`)*

### Approach B: Query Parameter Fallback (`?date=YYYY-MM-DD`)
Target a specific calendar date explicitly via query parameter:
```http
GET /quests/today?date=2026-10-10
```

> **Priority Rule:** If both are passed, the backend calculates the start and end of that specific `date` within the specified `x-timezone`. If omitted, defaults to current time in `UTC`.

---

## 3. Route Specifications

---

### 3.1 Exercise Logging (Backdating Supported)
Logs an exercise activity. Can be logged for the current time or backdated to past dates.

- **Route:** `POST /exercise-log`
- **Auth:** `Bearer <JWT>`
- **Content-Type:** `application/json` or `multipart/form-data`

#### Request Headers
| Header | Type | Required | Description |
|---|---|---|---|
| `Authorization` | String | Yes | `Bearer <access_token>` |
| `x-timezone` | String | No | User IANA timezone (e.g. `America/New_York`) |

#### Request Body Schema
| Field | Type | Required | Constraints / Enum Values | Description |
|---|---|---|---|---|
| `type` | String (Enum) | **Yes** | `CARDIO`, `STRENGTH`, `FLEXIBILITY`, `BALANCE` | Category of exercise |
| `name` | String | **Yes** | 1 - 255 chars | Name of exercise (e.g. `"Aerial Silks"`) |
| `duration` | Integer | No | Min: `1`, Default: `30` | Duration in minutes |
| `intensity` | String (Enum) | No | `LOW`, `MEDIUM`, `HIGH` (Default: `MEDIUM`) | Exercise intensity |
| `note` | String | No | Max: 1000 chars | Optional notes |
| `loggedAt` | String (ISO 8601) | No | Valid ISO string (e.g. `"2026-10-04T15:30:00.000Z"`) | **Backdating timestamp.** Defaults to `now()` if omitted. |

#### Request Sample
```json
{
  "type": "STRENGTH",
  "name": "Aerial Silks",
  "duration": 45,
  "intensity": "HIGH",
  "note": "Completed evening routine",
  "loggedAt": "2026-10-05T18:30:00.000Z"
}
```

#### Success Response Sample (`201 Created`)
```json
{
  "id": "da4f09d0-9feb-4bf3-a71d-d3fe61f748c8",
  "type": "STRENGTH",
  "name": "Aerial Silks",
  "intensity": "HIGH",
  "duration": 45,
  "note": "Completed evening routine",
  "loggedAt": "2026-10-05T18:30:00.000Z",
  "isTaken": true,
  "earnedXp": 10
}
```

---

### 3.2 Exercise Log History
Retrieves exercise history grouped chronologically by user-logged dates.

- **Route:** `GET /exercise-log/history`
- **Auth:** `Bearer <JWT>`

#### Request Parameters
| Parameter | Placement | Type | Required | Description |
|---|---|---|---|---|
| `x-timezone` | Header | String | No | User IANA timezone (e.g. `America/New_York`) |
| `page` | Query | Integer | No | Page number (default: `1`) |
| `limit` | Query | Integer | No | Items per page (default: `20`) |

#### Success Response Sample (`200 OK`)
```json
{
  "totalCount": 1,
  "pendingCount": 0,
  "totalEarnedXp": 10,
  "nextSchedule": null,
  "logs": [
    {
      "id": "da4f09d0-9feb-4bf3-a71d-d3fe61f748c8",
      "userId": "973e4883-5902-4e00-abcb-283f6bfe082c",
      "type": "STRENGTH",
      "name": "Aerial Silks",
      "intensity": "HIGH",
      "duration": 45,
      "isTaken": true,
      "loggedAt": "2026-10-05T18:30:00.000Z",
      "scheduledAt": null,
      "earnedXp": 10,
      "entryType": "LOG"
    }
  ]
}
```

---

### 3.3 Quests Feed (`/quests/today`)
Returns unified daily quests including system codex quests, custom quests, and scheduled medications/workouts for the user's local day.

- **Route:** `GET /quests/today`
- **Auth:** `Bearer <JWT>`

#### Request Parameters
| Parameter | Placement | Type | Required | Description |
|---|---|---|---|---|
| `x-timezone` | Header | String | No | User IANA timezone |
| `date` | Query | String | No | Target date in `YYYY-MM-DD` |

#### Success Response Sample (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "codex_track-your-shot",
      "title": "Track Your Shot",
      "description": "Log your GLP-1 medication",
      "xpReward": 10,
      "isCompleted": false,
      "questType": "CODEX",
      "originalRefId": "track-your-shot"
    },
    {
      "id": "codex_step-master",
      "title": "Step Master",
      "description": "Complete your daily step goal or walk at least 8,000 steps",
      "xpReward": 20,
      "isCompleted": false,
      "questType": "CODEX",
      "originalRefId": "step-master"
    },
    {
      "id": "medication_med-1",
      "title": "Aspirin",
      "description": "Time for your medication",
      "xpReward": 10,
      "isCompleted": true,
      "questType": "MEDICATION_SCHEDULE",
      "originalRefId": "med-1"
    }
  ],
  "meta": {
    "totalQuests": 3,
    "completedQuests": 1,
    "todayCustomXpEarned": 0,
    "dailyCustomXpCap": 50
  }
}
```

---

### 3.4 Daily XP Stats & Codex Quests (`/xp-stats`)
Returns daily XP logs, local day boundaries, and quest completion status.

- **Routes:** 
  - `GET /xp-stats/today`
  - `GET /xp-stats/quests`
- **Auth:** `Bearer <JWT>`

#### Request Headers & Query
| Parameter | Placement | Type | Description |
|---|---|---|---|
| `x-timezone` | Header | String | User IANA timezone (e.g. `America/New_York`) |
| `date` | Query | String | Optional target date (`YYYY-MM-DD`) |

#### Sample Response (`GET /xp-stats/today` - 200 OK)
Notice that `startDate` and `endDate` calculate the exact 24-hour window matching the user's local timezone:
```json
{
  "totalXp": 40,
  "period": "today",
  "startDate": "2026-10-10T04:00:00.000Z",
  "endDate": "2026-10-11T03:59:59.999Z",
  "logs": [
    {
      "id": "xp-101",
      "amount": 10,
      "reason": "EXERCISE_LOG: Aerial Silks",
      "createdAt": "2026-10-10T14:30:00.000Z"
    }
  ]
}
```

#### Sample Response (`GET /xp-stats/quests` - 200 OK)
```json
{
  "todayTotalXp": 40,
  "todayLogCount": 1,
  "quests": [
    {
      "id": "track-your-shot",
      "title": "Track Your Shot",
      "xp": 10,
      "description": "Log your GLP-1 medication",
      "isDone": false
    },
    {
      "id": "three-meals",
      "title": "Three Meals a Day",
      "xp": 30,
      "description": "Log breakfast, lunch, and dinner",
      "isDone": false
    },
    {
      "id": "step-master",
      "title": "Step Master",
      "xp": 20,
      "description": "Complete your daily step goal or walk at least 8,000 steps",
      "isDone": false
    }
  ]
}
```

---

### 3.5 Water Log (`/water-log/today`)
Returns the user's water consumption aggregated within local day boundaries.

- **Route:** `GET /water-log/today`
- **Auth:** `Bearer <JWT>`

#### Request Parameters
| Parameter | Placement | Type | Description |
|---|---|---|---|
| `x-timezone` | Header | String | User IANA timezone |
| `date` | Query | String | Optional `YYYY-MM-DD` |

#### Success Response Sample (`200 OK`)
```json
{
  "totalAmount": 48,
  "unit": "OZ",
  "goal": 64,
  "logs": [
    {
      "id": "water-log-1",
      "amount": 16,
      "loggedAt": "2026-10-10T12:00:00.000Z"
    },
    {
      "id": "water-log-2",
      "amount": 32,
      "loggedAt": "2026-10-10T16:30:00.000Z"
    }
  ]
}
```

---

### 3.6 Step Log (`/step-log/today`)
Returns step count progress evaluated on the user's calendar date.

- **Route:** `GET /step-log/today`
- **Auth:** `Bearer <JWT>`

#### Request Parameters
| Parameter | Placement | Type | Description |
|---|---|---|---|
| `x-timezone` | Header | String | User IANA timezone |
| `date` | Query | String | Optional `YYYY-MM-DD` |

#### Success Response Sample (`200 OK`)
```json
{
  "date": "2026-10-10",
  "steps": 6240,
  "goal": 8000,
  "isGoalReached": false,
  "remaining": 1760
}
```

---

### 3.7 Mood Log (`/mood-log/today`)
Returns all mood check-ins logged during the user's local day.

- **Route:** `GET /mood-log/today`
- **Auth:** `Bearer <JWT>`

#### Request Parameters
| Parameter | Placement | Type | Description |
|---|---|---|---|
| `x-timezone` | Header | String | User IANA timezone |
| `date` | Query | String | Optional `YYYY-MM-DD` |

#### Success Response Sample (`200 OK`)
```json
{
  "loggedToday": true,
  "mood": "HAPPY",
  "energyLevel": 4,
  "note": "Feeling energetic after workout",
  "loggedAt": "2026-10-10T15:10:00.000Z"
}
```

---

### 3.8 Medication Schedules (`/medication-schedule/today`)
Returns medications scheduled for the current day of the week in the user's timezone.

- **Route:** `GET /medication-schedule/today`
- **Auth:** `Bearer <JWT>`

#### Request Parameters
| Parameter | Placement | Type | Description |
|---|---|---|---|
| `x-timezone` | Header | String | User IANA timezone |
| `date` | Query | String | Optional `YYYY-MM-DD` |

#### Success Response Sample (`200 OK`)
```json
{
  "date": "2026-10-10",
  "dayOfWeek": "SATURDAY",
  "schedules": [
    {
      "id": "med-sched-1",
      "medicationId": "med-uuid-1",
      "medicationName": "Semaglutide",
      "dosage": "0.5mg",
      "time": "09:00",
      "isTaken": true,
      "takenAt": "2026-10-10T13:05:00.000Z"
    }
  ]
}
```

---

### 3.9 Workout Schedules (`/exercise-log/schedule/today`)
Returns workout plans scheduled for today in the user's timezone.

- **Route:** `GET /exercise-log/schedule/today`
- **Auth:** `Bearer <JWT>`

#### Request Parameters
| Parameter | Placement | Type | Description |
|---|---|---|---|
| `x-timezone` | Header | String | User IANA timezone |
| `date` | Query | String | Optional `YYYY-MM-DD` |

#### Success Response Sample (`200 OK`)
```json
[
  {
    "id": "workout-plan-1",
    "exerciseName": "Full Body Resistance",
    "duration": 45,
    "targetIntensity": "HIGH",
    "isTaken": false,
    "scheduledTime": "18:00"
  }
]
```

---

### 3.10 Meal Schedules (`/meal-schedules/today`)
Returns meal schedules and logged meals matching the user's local day.

- **Route:** `GET /meal-schedules/today`
- **Auth:** `Bearer <JWT>`

#### Request Parameters
| Parameter | Placement | Type | Description |
|---|---|---|---|
| `x-timezone` | Header | String | User IANA timezone |
| `date` | Query | String | Optional `YYYY-MM-DD` |

#### Success Response Sample (`200 OK`)
```json
{
  "totalMealsLogged": 2,
  "targetMeals": 3,
  "meals": [
    {
      "id": "meal-log-1",
      "mealType": "BREAKFAST",
      "name": "Oatmeal and Whey Protein",
      "calories": 420,
      "proteinGrams": 35,
      "loggedAt": "2026-10-10T12:30:00.000Z"
    },
    {
      "id": "meal-log-2",
      "mealType": "LUNCH",
      "name": "Grilled Chicken Salad",
      "calories": 550,
      "proteinGrams": 45,
      "loggedAt": "2026-10-10T17:00:00.000Z"
    }
  ]
}
```

---

### 3.11 Daily Login & Streak Retention (`/profile/daily-login`)
Claims the daily login reward and updates streaks. The claim window evaluates using local day boundaries to prevent evening claim loss.

- **Route:** `POST /profile/daily-login`
- **Auth:** `Bearer <JWT>`

#### Request Headers
| Header | Type | Required | Description |
|---|---|---|---|
| `Authorization` | String | Yes | `Bearer <access_token>` |
| `x-timezone` | String | No | User IANA timezone |

#### Success Response Sample (`200 OK` - First Claim of Local Day)
```json
{
  "success": true,
  "message": "Daily login reward claimed successfully",
  "streakDays": 5,
  "xpAwarded": 10,
  "totalEarnXp": 160
}
```

#### Success Response Sample (`200 OK` - Already Claimed in Local Day)
```json
{
  "success": true,
  "message": "Already claimed for today",
  "streakDays": 5,
  "xpAwarded": 0,
  "totalEarnXp": 160
}
```

---

## 4. Enum Reference Table

| Enum Name | Defined Values | Usage |
|---|---|---|
| `ExerciseType` | `CARDIO`, `STRENGTH`, `FLEXIBILITY`, `BALANCE` | `POST /exercise-log` (`type`) |
| `IntensityLevel` | `LOW`, `MEDIUM`, `HIGH` | `POST /exercise-log` (`intensity`) |
| `QuestType` | `CODEX`, `CUSTOM`, `MEDICATION_SCHEDULE`, `WORKOUT_SCHEDULE` | `/quests/today` (`questType`) |
| `MealType` | `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK` | Meal logging & schedules |
| `WaterUnit` | `OZ`, `ML` | User profile & water logging |
| `CalorieGoalMode` | `AUTO`, `MANUAL` | User nutrition settings |
| `MoodType` | `HAPPY`, `CALM`, `TIRED`, `STRESSED`, `ANXIOUS`, `SAD` | `/mood-log/today` |

