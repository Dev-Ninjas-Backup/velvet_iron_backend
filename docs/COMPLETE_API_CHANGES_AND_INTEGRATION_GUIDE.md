# Velvet & Iron Backend: Comprehensive API Specification & Frontend Integration Guide

**Document Release:** October 17, 2026  
**Applicability:** Mobile App (React Native / Flutter / iOS / Android) & Web Client  
**Scope:** All features, bug fixes, and API updates implemented on October 16–17, 2026  
**Status:** Implemented, Tested (`scripts/test-recent-changes.js` 7/7 Passing), Verified in Production Engine  

---

## Table of Contents
1. [Executive Summary & Global Headers](#1-executive-summary--global-headers)
2. [Recurrence Engine & Weekday Mapping Standard](#2-recurrence-engine--weekday-mapping-standard)
3. [Route Specifications](#3-route-specifications)
   - [3.1 Custom Quests ("Specific Days", 10 XP, & Daily Recurrence)](#31-custom-quests-specific-days-10-xp--daily-recurrence)
   - [3.2 Meal Schedules (Daily Repeating & Recurrence)](#32-meal-schedules-daily-repeating--recurrence)
   - [3.3 Unified Quests Feed & "Walk the Realm" Completion Sync](#33-unified-quests-feed--walk-the-realm-completion-sync)
   - [3.4 Exercise Schedules & Logging](#34-exercise-schedules--logging)
   - [3.5 Medication Schedules](#35-medication-schedules)
   - [3.6 Timezone Alignment, XP Charts & "Titan's Nourishment"](#36-timezone-alignment-xp-charts--titans-nourishment)
   - [3.7 Step Journey & "Set Up Camp"](#37-step-journey--set-up-camp)
4. [Frontend Implementation Guidelines & Best Practices](#4-frontend-implementation-guidelines--best-practices)
5. [Production Deployment Process from Local Machine](#5-production-deployment-process-from-local-machine)

---

## 1. Executive Summary & Global Headers

### Global Headers Required for All Requests
All client requests must provide the user's authentication token and their local IANA timezone name:

| Header Name | Type | Required | Description / Example |
| :--- | :--- | :--- | :--- |
| `Authorization` | `string` | **Yes** | Bearer access token: `Bearer eyJhbGciOi...` |
| `x-timezone` | `string` | **Yes** | Standard IANA timezone string: `America/Chicago`, `America/New_York`, `Asia/Dhaka`, `Europe/London` |
| `Content-Type` | `string` | For POST/PATCH | `application/json` |

> **Why `x-timezone` is critical:** The backend evaluates local midnight-to-midnight day windows (`00:00:00.000` to `23:59:59.999`) based on this header. Without it, the server defaults to UTC, which will cause items to reset at 8:00 PM / 7:00 PM local time for US users.

---

## 2. Recurrence Engine & Weekday Mapping Standard

The backend now uses an omni-channel recurrence engine supporting flexible weekday inputs across all schedule types (Custom Quests, Exercise, Medication, Meal, and General Schedules).

### ISO-8601 Day Number Mapping
| Day Name | ISO Integer | Accepted String Formats |
| :--- | :--- | :--- |
| **Monday** | `1` | `1`, `"1"`, `"MONDAY"`, `"Monday"`, `"mon"`, `"m"` |
| **Tuesday** | `2` | `2`, `"2"`, `"TUESDAY"`, `"Tuesday"`, `"tue"`, `"tu"` |
| **Wednesday** | `3` | `3`, `"3"`, `"WEDNESDAY"`, `"Wednesday"`, `"wed"`, `"w"` |
| **Thursday** | `4` | `4`, `"4"`, `"THURSDAY"`, `"Thursday"`, `"thu"`, `"th"` |
| **Friday** | `5` | `5`, `"5"`, `"FRIDAY"`, `"Friday"`, `"fri"`, `"f"` |
| **Saturday** | `6` | `6`, `"6"`, `"SATURDAY"`, `"Saturday"`, `"sat"`, `"sa"` |
| **Sunday** | `7` | `7`, `"7"`, `"SUNDAY"`, `"Sunday"`, `"sun"`, `"su"` |

### Supported Recurrence Types
- `DAILY`: Repeats every calendar day.
- `SPECIFIC_DAYS`: Repeats on the selected days specified in `daysOfWeek` (or `repeatDays`).
- `WEEKLY`: Repeats on specific days of the week (synonymous with `SPECIFIC_DAYS`).
- `NONE` / `ONCE` / `NEVER`: Non-repeating one-off scheduled item.

---

## 3. Route Specifications

---

### 3.1 Custom Quests ("Specific Days", 10 XP, & Daily Recurrence)

Resolves client complaints:
1. *"Selecting Specific Days offers no weekday options / payload is ignored."*
2. *"Selecting 10 XP causes the quest to save or display 15 XP."*

#### Route 1.1: Create Custom Quest
* **Method:** `POST`
* **Path:** `/custom-quests` (Alias: `/quests/custom`)
* **Headers:**
  ```http
  Authorization: Bearer <JWT_TOKEN>
  x-timezone: America/Chicago
  Content-Type: application/json
  ```
* **Payload Fields & Data Types:**

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Yes** | Quest title (3–60 chars). Legacy alias: `name`. |
| `category` | `string` | No | Category: `FITNESS`, `NUTRITION`, `MINDFULNESS`, `GENERAL` (Default: `GENERAL`). |
| `description` | `string` | No | Optional notes/instructions. |
| `xpReward` | `number` \| `string` | No | XP reward: values between `5` and `15` (Default: `10`). Alias: `xp`. |
| `recurrence` | `string` | No | `DAILY`, `SPECIFIC_DAYS`, `WEEKLY`, `NONE` (Default: `DAILY`). |
| `daysOfWeek` | `number[]` \| `string[]` | Required if `SPECIFIC_DAYS` | Array of day numbers `[1, 3, 5]` or names `["MONDAY", "WEDNESDAY", "FRIDAY"]`. |
| `repeatDays` | `number[]` \| `string[]` | No | Alias for `daysOfWeek`. |
| `scheduledTime` | `string` | No | Time of day in `HH:mm` 24-hr format (e.g. `"08:30"`). |
| `reminderEnabled`| `boolean` | No | Whether to trigger push notification (Default: `false`). |
| `reminderTime` | `string` | No | Optional reminder time in `HH:mm` format. |

* **Request Body Sample:**
```json
{
  "title": "Gym Strength Session",
  "category": "FITNESS",
  "description": "Legs & Core workout routine",
  "xpReward": 10,
  "recurrence": "SPECIFIC_DAYS",
  "daysOfWeek": [1, 3, 5],
  "scheduledTime": "07:30",
  "reminderEnabled": true,
  "reminderTime": "07:15"
}
```

* **cURL Sample:**
```bash
curl -X POST "https://api.velvetiron.com/custom-quests" \
  -H "Authorization: Bearer eyJhbGciOi..." \
  -H "x-timezone: America/Chicago" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gym Strength Session",
    "category": "FITNESS",
    "description": "Legs & Core workout routine",
    "xpReward": 10,
    "recurrence": "SPECIFIC_DAYS",
    "daysOfWeek": [1, 3, 5],
    "scheduledTime": "07:30",
    "reminderEnabled": true
  }'
```

* **Response Sample (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "7f8b9c2a-43d1-4e1b-9a88-123456789abc",
    "userId": "9e0e37a5-c2c3-48af-a955-e2b7b9f115e9",
    "title": "Gym Strength Session",
    "name": "Gym Strength Session",
    "category": "FITNESS",
    "description": "Legs & Core workout routine",
    "scheduledTime": "07:30",
    "frequency": "SPECIFIC_DAYS",
    "recurrence": "SPECIFIC_DAYS",
    "daysOfWeek": [1, 3, 5],
    "reminderEnabled": true,
    "reminderTime": "07:15",
    "isCompleted": false,
    "isDone": false,
    "completedAt": null,
    "isPaused": false,
    "xpReward": 10,
    "xp": 10,
    "isCustom": true,
    "createdAt": "2026-10-17T09:15:00.000Z",
    "updatedAt": "2026-10-17T09:15:00.000Z"
  }
}
```

---

#### Route 1.2: Fetch Custom Quests for Date
* **Method:** `GET`
* **Path:** `/custom-quests` (Query Param: `?date=YYYY-MM-DD`)
* **Headers:** `x-timezone: America/Chicago`
* **Response Sample (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "7f8b9c2a-43d1-4e1b-9a88-123456789abc",
      "title": "Gym Strength Session",
      "category": "FITNESS",
      "recurrence": "SPECIFIC_DAYS",
      "daysOfWeek": [1, 3, 5],
      "xpReward": 10,
      "isCompleted": false,
      "isCustom": true
    }
  ],
  "meta": {
    "todayCustomXpEarned": 20,
    "dailyCustomXpCap": 50
  }
}
```

---

#### Route 1.3: Update Custom Quest
* **Method:** `PATCH`
* **Path:** `/custom-quests/:id`
* **Request Body Sample:**
```json
{
  "title": "Gym Strength & Mobility",
  "xpReward": 10,
  "recurrence": "SPECIFIC_DAYS",
  "daysOfWeek": [1, 2, 4, 6]
}
```

---

### 3.2 Meal Schedules (Daily Repeating & Recurrence)

Resolves client complaint:
* *"Daily schedules don't repeat — when created yesterday or completed, they disappear today."*

#### Route 2.1: Create Meal Schedule
* **Method:** `POST`
* **Path:** `/meal-schedules`
* **Headers:** `x-timezone: America/Chicago`, `Authorization: Bearer <TOKEN>`
* **Payload Fields & Data Types:**

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `mealType` | `string` | **Yes** | `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK` |
| `scheduledAt` | `string` (ISO 8601) | **Yes** | Timestamp: e.g. `"2026-10-17T08:00:00Z"` |
| `carbs` | `number` | **Yes** | Carbohydrates in grams ($\ge 0$) |
| `protein` | `number` | **Yes** | Protein in grams ($\ge 0$) |
| `fats` | `number` | **Yes** | Fats in grams ($\ge 0$) |
| `recurrence` | `string` | No | `DAILY`, `SPECIFIC_DAYS`, `ONCE` (Default: `DAILY`) |
| `daysOfWeek` | `number[]` \| `string[]` | No | e.g. `[1, 2, 3, 4, 5]` or `["MON", "TUE"]` |
| `isPaused` | `boolean` | No | Pause recurrence without deleting (Default: `false`) |

* **Request Body Sample:**
```json
{
  "mealType": "BREAKFAST",
  "scheduledAt": "2026-10-17T08:00:00.000Z",
  "carbs": 40,
  "protein": 35,
  "fats": 15,
  "recurrence": "DAILY",
  "daysOfWeek": [],
  "isPaused": false
}
```

* **cURL Sample:**
```bash
curl -X POST "https://api.velvetiron.com/meal-schedules" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "x-timezone: America/Chicago" \
  -H "Content-Type: application/json" \
  -d '{
    "mealType": "BREAKFAST",
    "scheduledAt": "2026-10-17T08:00:00.000Z",
    "carbs": 40,
    "protein": 35,
    "fats": 15,
    "recurrence": "DAILY"
  }'
```

* **Response Sample (`201 Created`):**
```json
{
  "id": "e81d2f5a-904c-47aa-85cc-c7908b9815e1",
  "userId": "9e0e37a5-c2c3-48af-a955-e2b7b9f115e9",
  "mealType": "BREAKFAST",
  "scheduledAt": "2026-10-17T08:00:00.000Z",
  "calories": 435,
  "carbs": 40,
  "protein": 35,
  "fats": 15,
  "recurrence": "DAILY",
  "daysOfWeek": [],
  "isPaused": false,
  "isTaken": false
}
```

---

#### Route 2.2: Get Today's Meal Schedules
* **Method:** `GET`
* **Path:** `/meal-schedules/today` (Optional param: `?date=YYYY-MM-DD`)
* **Behavior:** Returns all active daily and matching weekday meals. `isTaken` evaluates to `true` **only if** taken today in the user's timezone; on the next morning, `isTaken` automatically resets to `false`.
* **Response Sample (`200 OK`):**
```json
[
  {
    "id": "e81d2f5a-904c-47aa-85cc-c7908b9815e1",
    "mealType": "BREAKFAST",
    "scheduledAt": "2026-10-17T08:00:00.000Z",
    "calories": 435,
    "carbs": 40,
    "protein": 35,
    "fats": 15,
    "recurrence": "DAILY",
    "daysOfWeek": [],
    "isPaused": false,
    "isTaken": false
  }
]
```

---

#### Route 2.3: Mark Meal as Taken
* **Method:** `PATCH`
* **Path:** `/meal-schedules/:id/mark-taken`
* **Headers:** `x-timezone: America/Chicago`
* **Request Body:**
```json
{
  "isTaken": true
}
```
* **Response Sample (`200 OK`):**
```json
{
  "id": "e81d2f5a-904c-47aa-85cc-c7908b9815e1",
  "isTaken": true,
  "lastTakenDate": "2026-10-17T09:20:00.000Z",
  "earnedXp": 10
}
```

---

### 3.3 Unified Quests Feed & "Walk the Realm" Completion Sync

Resolves client complaint:
* *"Walk the Realm quest resets to incomplete when marked from Today's Quests, but works in Exercise History."*

#### Route 3.1: Get Today's Quests (Unified Feed)
* **Method:** `GET`
* **Path:** `/quests/today`
* **Headers:** `x-timezone: America/Chicago` (Optional param: `?date=YYYY-MM-DD`)
* **cURL Sample:**
```bash
curl -X GET "https://api.velvetiron.com/quests/today" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "x-timezone: America/Chicago"
```
* **Response Sample (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "codex_titan-nourishment",
      "title": "Titan's Nourishment",
      "description": "Log a meal with 30g+ protein",
      "xpReward": 30,
      "isCompleted": true,
      "questType": "codex",
      "originalRefId": "titan-nourishment"
    },
    {
      "id": "workout_schedule_walk-the-realm-id",
      "title": "Walk the Realm",
      "description": "CARDIO • 30 min • Saturday, October 17 at 8:00 AM",
      "xpReward": 10,
      "isCompleted": false,
      "questType": "workout_schedule",
      "originalRefId": "walk-the-realm-id",
      "scheduledAt": "2026-10-17T13:00:00.000Z",
      "timeOfDay": "08:00"
    },
    {
      "id": "custom_7f8b9c2a-43d1-4e1b-9a88-123456789abc",
      "title": "Gym Strength Session",
      "description": "Legs & Core workout routine",
      "xpReward": 10,
      "isCompleted": false,
      "questType": "custom",
      "originalRefId": "7f8b9c2a-43d1-4e1b-9a88-123456789abc"
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

#### Route 3.2: Complete Quest from Feed (Bidirectional Sync)
* **Method:** `POST`
* **Path:** `/quests/complete`
* **Headers:** `x-timezone: America/Chicago`
* **Payload Fields:**

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `questId` | `string` | **Yes** | Either unified ID (e.g. `"workout_schedule_walk-the-realm-id"`) or raw ID (`"walk-the-realm-id"`). |
| `questType` | `string` | **Yes** | `workout_schedule`, `medication_schedule`, or `custom`. *(Codex quests cannot be completed manually; they trigger by logging the activity).* |

* **Request Body Sample:**
```json
{
  "questId": "workout_schedule_walk-the-realm-id",
  "questType": "workout_schedule"
}
```
* **Response Sample (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "workout_schedule_walk-the-realm-id",
    "isCompleted": true,
    "xpAwarded": 10,
    "companionTotalXp": 490,
    "companionLevel": 3
  }
}
```
> **Bidirectional Sync Guarantee:** Completing this quest immediately updates both `schedule_completion_logs` and `exercise_schedule_logs.isTaken = true`. Refreshing the screen or navigating to Exercise History will reflect `isTaken: true` without reverting.

---

### 3.4 Exercise Schedules & Logging

#### Route 4.1: Create Exercise Schedule
* **Method:** `POST`
* **Path:** `/exercise-logs/schedules`
* **Request Body Sample:**
```json
{
  "name": "Walk the Realm",
  "type": "CARDIO",
  "intensity": "MEDIUM",
  "duration": 30,
  "scheduledAt": "2026-10-17T08:00:00Z",
  "recurrence": "DAILY",
  "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
  "timeOfDay": "08:00",
  "reminderEnabled": true
}
```

#### Route 4.2: Get Today's Exercise Schedules
* **Method:** `GET`
* **Path:** `/exercise-logs/schedule/today` (Alias: `/exercise-logs/scheduled/today`)
* **Headers:** `x-timezone: America/Chicago`

#### Route 4.3: Mark Exercise Schedule Taken (From History)
* **Method:** `PATCH`
* **Path:** `/exercise-logs/schedules/:id/mark-taken`
* **Request Body:**
```json
{
  "isTaken": true
}
```

---

### 3.5 Medication Schedules

#### Route 5.1: Create Medication Schedule
* **Method:** `POST`
* **Path:** `/medication-schedules`
* **Request Body Sample:**
```json
{
  "name": "Vitamin D3",
  "type": "CAPSULE",
  "doseMg": 1000,
  "scheduleTime": "2026-10-17T09:00:00.000Z",
  "recurrence": "SPECIFIC_DAYS",
  "daysOfWeek": [1, 3, 5],
  "reminderEnabled": true
}
```

#### Route 5.2: Get Today's Medications
* **Method:** `GET`
* **Path:** `/medication-schedules/today`
* **Headers:** `x-timezone: America/Chicago`

#### Route 5.3: Mark Medication Taken
* **Method:** `PATCH`
* **Path:** `/medication-schedules/:id/mark-taken`
* **Request Body:**
```json
{
  "isTaken": true
}
```

---

### 3.6 Timezone Alignment, XP Charts & "Titan's Nourishment"

#### Route 6.1: Weekly XP Chart
* **Method:** `GET`
* **Path:** `/xp-stats/chart/weekly`
* **Headers:** `x-timezone: America/Chicago`
* **Changes:** Dynamically builds Sunday-to-Saturday columns matching the user's local timezone clock. XP earned Thursday night (e.g. 8:17 PM CDT) is strictly attributed to Thursday.

#### Route 6.2: Codex Quests Status
* **Method:** `GET`
* **Path:** `/xp-stats/quests`
* **Changes:** "Titan's Nourishment" evaluates `protein >= 30` on any single meal logged today, awarding 30 XP once completed.

---

### 3.7 Step Journey & "Set Up Camp"

#### Route 7.1: Set Up Camp
* **Method:** `POST`
* **Path:** `/step-log/camp`
* **Headers:** `x-timezone: America/Chicago`
* **Behavior:** Finalizes the user's steps for the day, awards XP, and locks camp in the user's local day record (`YYYY-MM-DD`).

---

## 4. Frontend Implementation Guidelines & Best Practices

### A. Centralized Axios / Fetch Interceptor
Always attach the user's device timezone to outgoing requests:
```typescript
import axios from 'axios';
import * as Localization from 'expo-localization'; // or Intl.DateTimeFormat().resolvedOptions().timeZone

const api = axios.create({
  baseURL: 'https://api.velvetiron.com',
});

api.interceptors.request.use((config) => {
  const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  config.headers['x-timezone'] = deviceTimezone;
  return config;
});

export default api;
```

### B. Custom Quest Creation UI: "Specific Days" Picker
When the user selects **"Specific Days"** in the recurrence dropdown:
1. Render 7 toggle chips/buttons: `[Mon, Tue, Wed, Thu, Fri, Sat, Sun]`.
2. Maintain selected state as an array of ISO integers: `1` (Monday) to `7` (Sunday).
3. Send payload with `recurrence: "SPECIFIC_DAYS"` and `daysOfWeek: selectedDaysArray`:
```typescript
const handleCreateQuest = async () => {
  const payload = {
    title: questTitle,
    category: selectedCategory,
    xpReward: 10, // Always pass 10 XP as default
    recurrence: isSpecificDays ? 'SPECIFIC_DAYS' : 'DAILY',
    daysOfWeek: isSpecificDays ? selectedDays : [], // e.g. [1, 3, 5]
    scheduledTime: timePickerValue, // "08:30"
  };

  await api.post('/custom-quests', payload);
};
```

### C. Quests Feed & Schedule Completion UI
When user toggles the completion checkbox for a quest:
```typescript
const handleToggleQuest = async (questItem: UnifiedQuestItem) => {
  if (questItem.questType === 'codex') {
    Alert.alert('System Quest', 'This quest completes automatically when you log the required activity.');
    return;
  }

  // Call the unified completion endpoint
  await api.post('/quests/complete', {
    questId: questItem.originalRefId || questItem.id,
    questType: questItem.questType,
  });

  // Optimistically mark complete in local state
  setQuests((prev) =>
    prev.map((q) => (q.id === questItem.id ? { ...q, isCompleted: true } : q))
  );
};
```

---

## 5. Production Deployment Process from Local Machine

Here is the exact step-by-step deployment procedure used to deploy the backend from your local macOS machine to the remote production server (`98.91.110.54`).

### Prerequisites
1. Docker Desktop running on your Mac.
2. The server private key located at:
   `/Users/betopia/Downloads/projects/velvet_iron/server/velvet_iron_bk.pem`
3. Terminal opened in:
   `/Users/betopia/Downloads/projects/velvet_iron/velvet_iron_backend`

---

### Step 1: Pre-Deployment Build & Verification
Ensure the code compiles and passes all verification tests locally:
```bash
npm run build
node scripts/test-recent-changes.js
```

---

### Step 2: Build the Linux AMD64 Docker Image
The production server runs Linux AMD64. Build the image locally specifying the target platform:
```bash
docker build --platform linux/amd64 -t softvence/velvet_backend:latest .
```

---

### Step 3: Stream Image to Server & Restart Containers (Zero-Hub Method)
Stream the built image directly over SSH and trigger the container update in a single command:
```bash
docker save softvence/velvet_backend:latest | ssh -i /Users/betopia/Downloads/projects/velvet_iron/server/velvet_iron_bk.pem ubuntu@98.91.110.54 "
  sudo docker load && \
  cd /home/ubuntu/velvet_backend && \
  sudo docker compose --profile prod up -d --force-recreate server
"
```

---

### Step 4: Verify the Live Deployment
Check the container creation timestamp and monitor startup logs:

```bash
# 1. Check container creation timestamp and image ID
ssh -i /Users/betopia/Downloads/projects/velvet_iron/server/velvet_iron_bk.pem ubuntu@98.91.110.54 "sudo docker inspect velvet_backend --format 'Created: {{.Created}} | Image: {{.Image}}'"

# 2. View live production application logs
ssh -i /Users/betopia/Downloads/projects/velvet_iron/server/velvet_iron_bk.pem ubuntu@98.91.110.54 "sudo docker logs -n 50 -f velvet_backend"
```

