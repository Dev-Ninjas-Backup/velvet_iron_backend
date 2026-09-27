# Milestone 3 Implementation: Unified Quests, Flexible Calories, and Recurring Schedules

This document details the backend architectural changes, APIs, and rules implemented for Milestone 3. It specifically addresses Custom Quests, Recurring Schedules (Medications/Workouts), and Calorie Goal/Meal Log Independence.

---

## 1. Executive Summary
* **Calorie Goal Independence:** Users can now set manual Calorie Goals (`calorieGoalMode: "MANUAL"`) completely detached from strict macro calculations.
* **Meal Log Flexibility:** The `MealLog` endpoints now natively support a `calories` override (crucial for barcode scanning where label calories deviate from pure macro math).
* **Schedule Consolidation:** Medications and workouts were migrated to a unified `ScheduleItem` database table, enabling daily/weekly/specific-day recurrences. 
* **Completion Tracking Architecture:** A new `ScheduleCompletionLog` table guarantees that recurring tasks can only award XP *once* per day.
* **Unified Quests Feed (`QuestsFeedModule`):** A centralized aggregator that merges Codex System Quests, user Custom Quests, and Scheduled Items into a single array for the Today screen.

## 2. Actors
* **Authenticated User**: The end-user logging meals, viewing their daily quests, and marking quests/schedules as complete.
* **System**: The backend server enforcing macro/calorie math fallbacks, daily XP caps, and anti-abuse safeguards.

---

## 3. Complete Workflow Diagram

```mermaid
flowchart TD
    %% Calorie Override Workflow
    A[Client] -->|POST /meal-log| B[Meal Log Controller]
    B --> C{calories provided?}
    C -->|Yes > 0| D[Use Explicit Calories]
    C -->|No / 0| E[Calculate: 4P + 4C + 9F]
    D --> F[Save to Database]
    E --> F
    F --> G[Return Meal Log Response]

    %% Unified Quests Workflow
    H[Client] -->|GET /quests/today| I[QuestsFeedController]
    I --> J[QuestsFeedService]
    J --> K[Fetch Codex Quests]
    J --> L[Fetch Custom Quests]
    J --> M[Fetch ScheduleItems (Meds/Workouts)]
    M --> N[Query ScheduleCompletionLog]
    K & L & N --> O[Map to UnifiedQuestItemDto]
    O --> P[Return Combined Quests Feed]

    %% Quest Completion Workflow
    Q[Client] -->|POST /quests/today/complete| R[QuestsFeedController]
    R --> S[Sanitize questId prefix]
    S --> T{questType?}
    T -->|CODEX| U[Throw 400 Bad Request]
    T -->|CUSTOM| V[CustomQuestService]
    T -->|MEDICATION / WORKOUT| W[QuestsFeedService]
    W --> X[Create ScheduleCompletionLog]
    V & X --> Y[Database Update & Award XP]
    Y --> Z[Return Completion Result with Level]
```

---

## 4. Route Inventory

| Method | Route | Authentication | Description |
| ------ | ----- | -------------- | ----------- |
| GET    | `/quests/today` | Required (JWT) | Retrieves the unified quests feed for the current day. |
| POST   | `/quests/today/complete` | Required (JWT) | Marks a specific unified quest as complete. |
| POST   | `/meal-log` | Required (JWT) | Creates a meal log (accepts optional `calories` override). |
| PATCH  | `/meal-log/:id` | Required (JWT) | Updates a meal log (accepts optional `calories` override). |

---

## 5. Frontend Implementation Guidelines (Universal)

### 1. The Unified Quests Feed
**Concept:** The backend aggregates tasks from different domains (Codex system quests, user custom quests, medications, exercises) into a flattened array.
**Frontend Guideline:** 
- Render the `GET /quests/today` response dynamically.
- Use the `questType` field to show an appropriate icon (e.g., pill for `MEDICATION_SCHEDULE`, dumbbell for `WORKOUT_SCHEDULE`, star for `CUSTOM`).
- Do NOT try to complete `CODEX` quests manually via the completion endpoint. They complete automatically when the user actually logs the requisite activity (e.g., logging 3 meals).
- When calling the completion API, pass the `questId` and `questType` exactly as they appear in the feed.

### 2. Meal Log Barcode Flexibility
**Concept:** Previously, if a user scanned a barcode, the backend overwrote the barcode's listed calories by aggressively recalculating `(4*P) + (4*C) + (9*F)`. 
**Frontend Guideline:**
- When a user scans a barcode, or manually enters a specific calorie target, send the `calories` payload directly in the `POST /meal-log` request.
- If you don't send `calories`, the backend will gracefully fallback to calculating it using macro multipliers.

---

## 6. Route-by-Route Documentation

### GET /quests/today

**Description:** Retrieves a consolidated list of today's tasks across all schedules and quest types.

**Query Parameters:**
| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `date` | string | No | Filter by YYYY-MM-DD. Defaults to today UTC. |

**Response Example (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "codex_three-meals",
      "title": "Three Meals a Day",
      "description": "Log breakfast, lunch, and dinner",
      "xpReward": 30,
      "isCompleted": true,
      "questType": "CODEX",
      "originalRefId": "three-meals"
    },
    {
      "id": "medication_123e4567",
      "title": "Aspirin",
      "description": "Time for your medication",
      "xpReward": 10,
      "isCompleted": false,
      "questType": "MEDICATION_SCHEDULE",
      "originalRefId": "123e4567"
    }
  ],
  "meta": {
    "totalQuests": 2,
    "completedQuests": 1,
    "todayCustomXpEarned": 15,
    "dailyCustomXpCap": 50
  }
}
```

---

### POST /quests/today/complete

**Description:** Marks a unified quest as complete. Safely writes to the `ScheduleCompletionLog` to prevent duplicate daily XP.

**Request Body:**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `questId` | string | Yes | The ID of the quest. Can be the prefixed `id` (e.g. `medication_123`) or `originalRefId` (`123`). |
| `questType` | enum | Yes | `"CUSTOM"`, `"MEDICATION_SCHEDULE"`, `"WORKOUT_SCHEDULE"` |

**Request Example:**
```json
{
  "questId": "medication_123e4567",
  "questType": "MEDICATION_SCHEDULE"
}
```

**Response Example (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "medication_123e4567",
    "isCompleted": true,
    "xpAwarded": 10,
    "companionTotalXp": 450,
    "companionLevel": 3
  }
}
```

---

### POST /meal-log & PATCH /meal-log/:id

**Description:** The existing meal logging endpoints have been updated to accept an optional `calories` override field.

**Request Body Fields (Pertinent to Update):**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `carbs` | number | Yes (POST) | Carbohydrates in grams |
| `protein` | number | Yes (POST) | Protein in grams |
| `fats` | number | Yes (POST) | Fats in grams |
| `calories`| number | No | Optional manual calorie override. |

**Request Example:**
```json
{
  "mealType": "LUNCH",
  "carbs": 10,
  "protein": 10,
  "fats": 10,
  "calories": 250
}
```

**Business Rule:** If `calories` is omitted or left empty, the backend will calculate `(4 * 10) + (4 * 10) + (9 * 10) = 170` and save `170`. By passing `250`, the backend will save `250` exactly.

---

## 7. Error Handling & Anti-Abuse Rules

* **Codex Guard (400 Bad Request):** Occurs if you attempt to send `questType: "CODEX"` to the `/quests/today/complete` endpoint. The API responds with: `"Codex quests cannot be completed manually. Log the required activity instead."`
* **Custom Quest Anti-Abuse Cap:** When completing a `CUSTOM` quest, the backend queries the `XpLog` database. If the user has already earned 50 XP from custom quests today, the quest will be marked as complete, but `0` XP will be awarded.
* **Schedule Idempotency:** Completing an already-completed medication or workout does not throw an error, but it guards against duplicate XP via the `ScheduleCompletionLog` table. It will respond with `success: true` but `xpAwarded: 0`.
