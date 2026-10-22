# Backend API Specification: Complete Implementation & Bug Fix Summary (October 20, 2026)

**Document Release:** October 20, 2026  
**Target Environment:** Production (`https://velvet.api.softvence.app` / Host `98.91.110.54`)  
**Target Modules:** Unified Quests Feed, Custom Quests, XP Stats & Weekly Activity Graph, Mood Log, Meal Schedules Migration, Docker Build Optimization  
**Validation Suite:** `npm run test:prod` (Live Production Suite) & `npm run test:recent` (8/8 Suites Passing)  
**Compilation & Build Status:** `npm run build` Passing (0 errors) | Docker Build: 34s (Linux AMD64)  

---

## 1. Executive Summary

This release resolves critical production blockers and behavioral discrepancies reported across the Velvet & Iron platform:

1. **Custom Quest Unable to Complete from Today's Quests (Resolved):**
   - **Problem:** Users could not complete custom quests (e.g., "Study Italian", 5 XP) from "Today's Quests".
   - **Root Cause 1 (ID Prefix Mismatch):** `GET /quests/today` returns unified IDs (e.g. `custom_1fdd4a6f...`). When the frontend submitted this ID to `POST/PATCH /quests/custom/:id/complete`, the backend threw `404 Not Found: "Custom quest not found"` because the database stored the raw UUID (`1fdd4a6f...`) without the `custom_` prefix.
   - **Root Cause 2 (Missing `isCompleted` in Feed):** In `QuestsFeedService`, `isCompleted` evaluated to `undefined` when false and uncompleted, causing `JSON.stringify` to omit the field entirely from the response.
   - **Root Cause 3 (Strict DTO Validation):** `POST /quests/today/complete` strictly required uppercase enum `questType: "CUSTOM"`. Omitting it, sending lowercase `"custom"`, or passing `{ id }` triggered `400 Bad Request`.
   - **Resolution:**
     - Added `normalizeId(id)` in `CustomQuestService` to strip `custom_` or any prefix across `complete()`, `findOne()`, `update()`, `pause()`, and `remove()`.
     - Wrapped `isCompleted: Boolean(...)` in `QuestsFeedService.getTodaysQuests` to guarantee a strict boolean in JSON (`true` or `false`).
     - Enhanced `CompleteQuestDto` to auto-infer `questType` from ID prefix or database lookup, accept lowercase strings, and support either `questId` or `id`.
     - Added route alias `POST /quests/:id/complete` in `QuestsFeedController`.

2. **Weekly Activity Graph Timezone Offset & Axis Usability (Resolved):**
   - **Problem:** A user in Wisconsin (Central Time) completing quests on Monday evening saw a bar for Tuesday. The graph also showed only a few bars.
   - **Root Cause:** Wisconsin is in `America/Chicago` (CDT, UTC-5). Monday 8:00 PM CDT is Tuesday 01:00 AM UTC. If the frontend omitted `x-timezone`, the backend defaulted to UTC, pushing the XP into Tuesday. Furthermore, the graph response lacked short day labels (`dayShort`), making it difficult for the mobile charting library to render baseline bars for 0-XP days.
   - **Resolution:**
     - Extended `extractTimezone(req)` to inspect `x-timezone`, `x-time-zone`, `timezone` headers, plus `?timezone=` query and body parameters.
     - Added `dayShort` (`Sun`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`) to all 7 days in `getWeeklyChartData` and `getLastWeekChartData`.
     - Verified that with `America/Chicago`, Monday evening activity correctly attributes to Monday.

3. **Production Database Migration: Missing `meal_schedules.recurrence` (Resolved):**
   - **Problem:** `GET /meal-log/history?limit=30&offset=0` threw HTTP 400: `The column meal_schedules.recurrence does not exist in the current database`.
   - **Root Cause:** Schema changes made on Oct 17 were applied locally with `npx prisma db push`, but no migration folder existed in `prisma/migrations/`. In production, the container runs `npx prisma migrate deploy`, which applied 0 migrations.
   - **Resolution:**
     - Executed live `ALTER TABLE` hotfix on production PostgreSQL.
     - Created permanent, idempotent migration `prisma/migrations/20261017000000_add_meal_schedule_recurrence/migration.sql`.
     - Verified migration finished and recorded in production `_prisma_migrations`.

4. **Mood Log Today Empty State HTTP 400 (Resolved):**
   - **Problem:** Calling `GET /mood-log/today?date=YYYY-MM-DD` when no mood was logged yet today returned HTTP 400 Bad Request `"No mood log found for today"`.
   - **Root Cause:** `MoodLogService.getTodayMoodLog` explicitly threw `BadRequestException` when `!todayValue`.
   - **Resolution:** Changed to return `null` (`HTTP 200 OK` with `null`), allowing mobile HTTP clients to treat empty morning state cleanly without error triggers.

5. **Docker Build Timeout (ECONNRESET) Fix:**
   - **Problem:** `docker build` failed at `RUN npm install -g prisma` after stalling for 1,172.8 seconds (19.5 minutes).
   - **Root Cause:** Redundant global installs `npm install -g prisma` and `pnpm add express` when both packages were already installed into `node_modules` by `pnpm install`.
   - **Resolution:** Removed redundant lines from `Dockerfile`. Build time dropped from 1,172s failure down to **34 seconds**.

---

## 2. Architecture & Data Flow

```
                      Client Request (Mobile App / Web)
                                      │
               Headers: x-timezone: America/Chicago
                                      │
                                      ▼
                      Unified Timezone Engine
                 (src/common/utils/timezone.util.ts)
                   - Checks: x-timezone, x-time-zone,
                     timezone header, query, body
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
 Today's Quests Feed         Custom Quest Service        Weekly XP Chart
(quests-feed.service.ts)   (custom-quest.service.ts)    (xp-stats.service.ts)
  - isCompleted: Boolean     - normalizeId(id):           - All 7 days (Sun-Sat)
    (never undefined)          strips "custom_" prefix    - dayShort: Sun..Sat
  - Auto-infers questType    - Accurate day bounds by     - Localized Monday
  - Supports /complete and     user timezone                Wisconsin XP stays
    /:id/complete aliases    - Awards exact xpReward        on Monday
```

---

## 3. Database Migrations

### Migration File: `prisma/migrations/20261017000000_add_meal_schedule_recurrence/migration.sql`
```sql
-- AlterTable: Add recurrence, daysOfWeek, and isPaused to meal_schedules idempotently
ALTER TABLE "meal_schedules" ADD COLUMN IF NOT EXISTS "recurrence" TEXT NOT NULL DEFAULT 'DAILY';
ALTER TABLE "meal_schedules" ADD COLUMN IF NOT EXISTS "daysOfWeek" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "meal_schedules" ADD COLUMN IF NOT EXISTS "isPaused" BOOLEAN NOT NULL DEFAULT false;
```

---

## 4. API Endpoint Specifications

### 4.1. Unified Quests Feed: Fetch Today's Quests
- **Route:** `GET /quests/today`
- **Headers:**
  - `Authorization: Bearer <ACCESS_TOKEN>`
  - `x-timezone: <IANA_TIMEZONE>` (e.g. `America/Chicago`)
- **Query Params:** `date` (optional, `YYYY-MM-DD`)
- **Success Response (`200 OK`):**
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
      "id": "custom_1fdd4a6f-cafe-4acc-bf49-e43a0f986ab6",
      "title": "Study Italian",
      "xpReward": 5,
      "isCompleted": false,
      "questType": "CUSTOM",
      "originalRefId": "1fdd4a6f-cafe-4acc-bf49-e43a0f986ab6"
    }
  ],
  "meta": {
    "totalQuests": 7,
    "completedQuests": 0,
    "todayCustomXpEarned": 0,
    "dailyCustomXpCap": 50
  }
}
```
> [!IMPORTANT]
> `isCompleted` is now guaranteed to be a strict boolean (`true` or `false`), never omitted or `undefined`.

---

### 4.2. Complete Quest (Unified & Aliases)
The backend now supports **three interchangeable route formats** for completing quests:
1. `POST /quests/today/complete`
2. `POST /quests/:id/complete` (or `PATCH /quests/:id/complete`)
3. `POST /quests/custom/:id/complete` (or `PATCH /quests/custom/:id/complete`)

#### Option A: Via Unified Feed (`POST /quests/today/complete`)
```bash
curl -X POST "https://velvet.api.softvence.app/quests/today/complete" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-timezone: America/Chicago" \
  -H "Content-Type: application/json" \
  -d '{
    "questId": "custom_1fdd4a6f-cafe-4acc-bf49-e43a0f986ab6"
  }'
```
*(Note: `questType` is optional and auto-inferred if `questId` begins with `custom_`, `med_`, `workout_`, or `codex_`).*

#### Option B: Via URL Parameter (`POST /quests/:id/complete`)
```bash
curl -X POST "https://velvet.api.softvence.app/quests/custom_1fdd4a6f-cafe-4acc-bf49-e43a0f986ab6/complete" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-timezone: America/Chicago"
```

#### Option C: Via Custom Quest Endpoint (`POST /quests/custom/:id/complete`)
```bash
# Both prefixed ID and raw UUID are supported:
curl -X POST "https://velvet.api.softvence.app/quests/custom/1fdd4a6f-cafe-4acc-bf49-e43a0f986ab6/complete" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-timezone: America/Chicago"
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "id": "1fdd4a6f-cafe-4acc-bf49-e43a0f986ab6",
    "isCompleted": true,
    "xpAwarded": 5,
    "companionTotalXp": 8470,
    "companionLevel": 50
  },
  "quest": {
    "id": "1fdd4a6f-cafe-4acc-bf49-e43a0f986ab6",
    "title": "Study Italian",
    "isCompleted": true,
    "isDone": true,
    "completedAt": "2026-10-20T08:00:00.000Z",
    "xpReward": 5
  },
  "earnedXp": 5,
  "newBalanceXp": 6970
}
```

---

### 4.3. Weekly Activity XP Chart
- **Route:** `GET /xp-stats/chart/weekly` (also available via `GET /profile/chart/weekly` and `GET /profile` inside `XPcharts.currentWeek`)
- **Headers:**
  - `Authorization: Bearer <ACCESS_TOKEN>`
  - `x-timezone: <IANA_TIMEZONE>` (e.g. `America/Chicago`)
- **Success Response (`200 OK`):**
```json
{
  "period": "week",
  "timezone": "America/Chicago",
  "data": [
    {
      "day": "Sunday",
      "dayShort": "Sun",
      "dateLabel": "Sunday, October 18, 2026 at 7:00 AM",
      "isoDate": "2026-10-18",
      "xp": 25,
      "logsCount": 1
    },
    {
      "day": "Monday",
      "dayShort": "Mon",
      "dateLabel": "Monday, October 19, 2026 at 7:00 AM",
      "isoDate": "2026-10-19",
      "xp": 5,
      "logsCount": 1
    },
    {
      "day": "Tuesday",
      "dayShort": "Tue",
      "dateLabel": "Tuesday, October 20, 2026 at 7:00 AM",
      "isoDate": "2026-10-20",
      "xp": 0,
      "logsCount": 0
    },
    {
      "day": "Wednesday",
      "dayShort": "Wed",
      "dateLabel": "Wednesday, October 21, 2026 at 7:00 AM",
      "isoDate": "2026-10-21",
      "xp": 0,
      "logsCount": 0
    },
    {
      "day": "Thursday",
      "dayShort": "Thu",
      "dateLabel": "Thursday, October 22, 2026 at 7:00 AM",
      "isoDate": "2026-10-22",
      "xp": 0,
      "logsCount": 0
    },
    {
      "day": "Friday",
      "dayShort": "Fri",
      "dateLabel": "Friday, October 23, 2026 at 7:00 AM",
      "isoDate": "2026-10-23",
      "xp": 0,
      "logsCount": 0
    },
    {
      "day": "Saturday",
      "dayShort": "Sat",
      "dateLabel": "Saturday, October 24, 2026 at 7:00 AM",
      "isoDate": "2026-10-24",
      "xp": 0,
      "logsCount": 0
    }
  ],
  "totalXp": 30
}
```

---

### 4.4. Mood Log: Today's Log
- **Route:** `GET /mood-log/today`
- **Query Params:** `date` (optional, `YYYY-MM-DD`)
- **Headers:** `Authorization: Bearer <ACCESS_TOKEN>`
- **Response when no mood logged today:** Returns `200 OK` with `null`:
  ```json
  null
  ```
  *(HTTP Status: `200 OK`, not `400 Bad Request`).*

---

### 4.5. Meal Log History
- **Route:** `GET /meal-log/history?limit=30&offset=0`
- **Headers:** `Authorization: Bearer <ACCESS_TOKEN>`
- **Response:** Returns `200 OK` with complete log history and summary macros (No `meal_schedules.recurrence` error).

---

## 5. Frontend Integration Guidelines

1. **Attach `x-timezone` Header Globally:**
   In your global Axios/Fetch/Dio HTTP interceptor:
   ```typescript
   // TypeScript / JavaScript
   axios.interceptors.request.use((config) => {
     config.headers['x-timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "America/Chicago"
     return config;
   });
   ```
2. **Weekly Activity Graph Rendering:**
   - Use `item.dayShort` (`Sun`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`) for the 7 columns on the X-axis.
   - Do **not** filter out items where `xp === 0`. Render a baseline indicator (such as a 2px gray bar or dot) so all 7 columns remain visible.
   - Note: The weekly graph represents the **current calendar week** (`Sunday` to `Saturday`). Lifetime total XP is found in `profile.totalEarnXp`.
3. **Completing Quests from Today's Quests:**
   - You can simply call:
     ```typescript
     await api.post(`/quests/${quest.id}/complete`);
     ```
     Or:
     ```typescript
     await api.post('/quests/today/complete', { questId: quest.id });
     ```
     The backend automatically resolves the quest type, strips prefixes, awards the configured XP, and updates the state immediately.

---

## 6. Verification Status

| Suite | Description | Status |
|---|---|---|
| `scripts/test-recent-changes.js` | 8 local verification suites covering Custom Quests 10 XP, Timezone XP Attribution, Walk the Realm Sync, Set Up Camp, Meal Recurrence, and Prefixed ID Completion | **PASSED (8/8)** |
| `scripts/test-prod-issues.js` | Live production integration suite testing `/auth/login`, `/meal-log/history`, `/mood-log/today`, and `/mood-log/history` | **PASSED (5/5)** |
| Production Container Verification | Inspected `velvet_backend` on `98.91.110.54` running image `d851b55d06a2` | **RUNNING (Up)** |

