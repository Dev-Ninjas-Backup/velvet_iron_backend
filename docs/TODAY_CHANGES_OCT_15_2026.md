# Backend API Specification: Changes Implemented Today (October 15, 2026)

**Document Release:** October 15, 2026  
**Target Modules:** Unified Quests Feed, Gamification/Codex Quests, Profile & Schedules, Timezone Engine, CI/CD Docker Pipeline  
**Deployment Status:** Successfully Compiled & Deployed on Production  

---

## 1. Executive Summary of Today's Changes

Today's updates resolve two client-reported issues on production:
1. **Titan's Nourishment (Issue 1):** Transitioned the protein codex quest from cumulative daily sum ($120\text{g}$) to **a single meal containing $\ge 30\text{g}$ protein**, updating the quest title to `"Titan's Nourishment"` and description to `"Log a meal with 30g+ protein"`.
2. **Quests Screen Timezone & Scheduled Exercises Alignment (Issue 2):** Eliminated the $+11$-hour offset between client local time (e.g. US Central UTC-5) and Bangladesh server time (`UTC+6`). Scheduled workouts and medications now format using the client's `x-timezone` header, and raw UTC `scheduledAt` + `timeOfDay` fields have been added to the response payload.
3. **Profile Schedule Formatting:** Replaced hardcoded `'Asia/Dhaka'` in `formatTimeToBasic()` with the requester's `x-timezone` across today, weekly, monthly, and upcoming schedule lists.
4. **CI/CD & Dockerfile Fixes:** Fixed Docker tag missing error in `.github/workflows/ci.yml` and normalized instruction casing in `Dockerfile`.

---

## 2. Workflows & Architecture Changes

```
Client Request (Mobile / Web)
      │
      ├─► Headers:
      │     - Authorization: Bearer <JWT>
      │     - x-timezone: America/Chicago (or America/New_York, etc.)
      │
      ▼
Timezone Utility (timezone.util.ts)
      │
      ├─► getUserDayBoundaries(timezone, dateStr):
      │     Calculates precise local day window (00:00:00 to 23:59:59.999)
      │
      ├─► formatDateInTimezone(date, timezone):
      │     Renders human-readable date/time matching client's local clock
      │     e.g., "Tuesday, October 13, 2026 at 6:45 PM"
      ▼
Endpoints Updated Today:
  ├── GET /quests/today
  │     - Evaluates Codex, Custom Quests & Schedule Items within local window
  │     - Populates raw `scheduledAt` (ISO UTC) and `timeOfDay` ("18:45")
  │     - Injects formatted workout string in `description`
  │
  ├── GET /xp-stats/quests
  │     - Checks single-meal protein: `some(meal => meal.protein >= 30)`
  │     - Sets title: "Titan's Nourishment", xp: 30
  │
  └── GET /profile?withSchedules=true
        - Formats `todaySchedules`, `thisWeek`, `thisMonth`, `upcoming` in user timezone
```

---

## 3. Detailed Route Specifications

---

### Route 1: Unified Quests Feed (`GET /quests/today`)

Retrieves today's quests, combining Codex system quests, custom quests, and scheduled medications/workouts.

- **HTTP Method:** `GET`
- **Path:** `/quests/today`
- **Auth:** `Bearer <JWT>`

#### Request Headers & Query
| Parameter | Type | In | Required | Default | Description |
|---|---|---|---|---|---|
| `Authorization` | String | Header | **Yes** | — | `Bearer <access_token>` |
| `x-timezone` | String | Header | No | `UTC` | Client's IANA timezone (e.g. `America/Chicago`, `America/New_York`) |
| `date` | String | Query | No | Today | Explicit target date formatted as `YYYY-MM-DD` |

#### New & Updated Response Fields in `UnifiedQuestItemDto`
| Field | Type | Description / Probable Values | Status |
|---|---|---|---|
| `id` | String | Unified identifier with prefix (e.g. `"workout_123"`, `"codex_protein-power"`) | Existing |
| `title` | String | Quest title. Updated to `"Titan's Nourishment"` for protein quest | **Updated** |
| `description` | String | Timezone-aware formatted text (e.g. `"CARDIO • 30 min • Tuesday, October 13, 2026 at 6:45 PM"`) | **Updated** |
| `xpReward` | Integer | XP points awarded on completion (`10`, `20`, `30`) | Existing |
| `isCompleted` | Boolean | Completion status (`true` / `false`) | Existing |
| `questType` | String (Enum) | `CODEX`, `CUSTOM`, `MEDICATION_SCHEDULE`, `WORKOUT_SCHEDULE` | Existing |
| `originalRefId`| String | Raw database reference ID without prefix | Existing |
| **`scheduledAt`** | **String (ISO 8601)** | **Raw UTC scheduled timestamp (e.g. `"2026-10-13T23:45:00.000Z"`). Nullable.** | **NEW** |
| **`timeOfDay`** | **String** | **Scheduled time string (e.g. `"18:45"`, `"09:00"`). Nullable.** | **NEW** |

#### Request Sample
```bash
curl -X GET "https://velvet.api.softvence.app/quests/today" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-timezone: America/Chicago"
```

#### Success Response Sample (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "codex_protein-power",
      "title": "Titan's Nourishment",
      "description": "Log a meal with 30g+ protein",
      "xpReward": 30,
      "isCompleted": false,
      "questType": "CODEX",
      "originalRefId": "protein-power",
      "scheduledAt": null,
      "timeOfDay": null
    },
    {
      "id": "workout_e430da27-2c97-4028-a28a-6b5cf0bfd650",
      "title": "Ice Skating",
      "description": "CARDIO • 30 min • Tuesday, October 13, 2026 at 6:45 PM",
      "xpReward": 10,
      "isCompleted": false,
      "questType": "WORKOUT_SCHEDULE",
      "originalRefId": "e430da27-2c97-4028-a28a-6b5cf0bfd650",
      "scheduledAt": "2026-10-13T23:45:00.000Z",
      "timeOfDay": "18:45"
    },
    {
      "id": "medication_b82a7f01-7bfa-4a25-9f5e-4c7b8e1920aa",
      "title": "Semaglutide Injection",
      "description": "Time for your medication",
      "xpReward": 10,
      "isCompleted": true,
      "questType": "MEDICATION_SCHEDULE",
      "originalRefId": "b82a7f01-7bfa-4a25-9f5e-4c7b8e1920aa",
      "scheduledAt": "2026-10-13T14:00:00.000Z",
      "timeOfDay": "09:00"
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

### Route 2: Daily Codex Quests Evaluation (`GET /xp-stats/quests`)

Evaluates the user's progress on core daily codex quests.

- **HTTP Method:** `GET`
- **Path:** `/xp-stats/quests`
- **Auth:** `Bearer <JWT>`

#### Changes Implemented:
- Quest ID `protein-power` now checks:
  $$\exists \text{ meal} \in (\text{mealLogs} \cup \text{mealSchedules}) \text{ where } \text{meal.protein} \ge 30$$
- Renamed from `"Protein Power"` to `"Titan's Nourishment"`.
- Description updated to `"Log a meal with 30g+ protein"`.

#### Request Sample
```bash
curl -X GET "https://velvet.api.softvence.app/xp-stats/quests" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-timezone: America/Chicago"
```

#### Success Response Sample (`200 OK`)
```json
{
  "todayTotalXp": 30,
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
      "id": "mood-check",
      "title": "Mood Check",
      "xp": 30,
      "description": "Log your mood and energy levels",
      "isDone": false
    },
    {
      "id": "step-master",
      "title": "Step Master",
      "xp": 20,
      "description": "Complete your daily step goal or walk at least 8,000 steps",
      "isDone": false
    },
    {
      "id": "protein-power",
      "title": "Titan's Nourishment",
      "xp": 30,
      "description": "Log a meal with 30g+ protein",
      "isDone": true
    },
    {
      "id": "mana-infusion",
      "title": "Mana Infusion",
      "xp": 20,
      "description": "Drink at least 80% of your daily water potion goal",
      "isDone": false
    }
  ]
}
```

---

### Route 3: User Profile & Schedule Aggregations (`GET /profile`)

Retrieves profile data along with today's, weekly, monthly, and upcoming schedules formatted in the user's timezone.

- **HTTP Method:** `GET`
- **Path:** `/profile`
- **Auth:** `Bearer <JWT>`

#### Changes Implemented:
- Passed `x-timezone` from controller to `ProfileService.getProfileWithSchedules()`.
- Replaced hardcoded `Asia/Dhaka` in `formatTimeToBasic()` so `scheduledAt` strings render in the client's local timezone.
- Evaluates `todayMoodLog` and `todayRange` within the client's local day boundaries (`startOfToday` to `endOfToday`).

#### Request Sample
```bash
curl -X GET "https://velvet.api.softvence.app/profile?withSchedules=true&scheduleRange=today" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-timezone: America/Chicago"
```

#### Success Response Sample (`200 OK`)
```json
{
  "id": "5d29491f-5df1-4d5c-96d0-e15bdb9a5bb2",
  "userId": "06017c22-d291-412f-ac49-48e9372f56a5",
  "totalEarnXp": 80,
  "level": 1,
  "todaySchedules": {
    "combined": [
      {
        "id": "ex-101",
        "type": "exercise",
        "title": "Ice Skating",
        "description": "CARDIO • 30 min",
        "scheduledAt": "Tuesday, October 13, 2026 at 6:45 PM",
        "earnedXp": 0,
        "details": {
          "type": "CARDIO",
          "duration": 30
        }
      }
    ]
  },
  "upcoming": {
    "id": "ex-101",
    "type": "exercise",
    "title": "Ice Skating",
    "scheduledAt": "Tuesday, October 13, 2026 at 6:45 PM",
    "earnedXp": 0
  }
}
```

---

## 4. Code Diffs & Small Details

### 4.1 Timezone Formatter Utility
**File:** `src/common/utils/timezone.util.ts`
```typescript
export function formatDateInTimezone(date: Date, timezone: string = 'UTC'): string {
  let tz = timezone.trim();
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = 'UTC';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const hour = parts.find((p) => p.type === 'hour')?.value || '';
  const minute = parts.find((p) => p.type === 'minute')?.value || '';
  const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value || '';

  return `${weekday}, ${month} ${day}, ${year} at ${hour}:${minute} ${dayPeriod}`;
}
```

### 4.2 CI/CD Fallback Tag
**File:** `.github/workflows/ci.yml`
```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v4
  with:
    context: .
    push: true
    tags: ${{ secrets.IMMAGE_NAME || 'softvence/velvet_backend:latest' }}
```

### 4.3 Dockerfile Linter Consistency
**File:** `Dockerfile`
- Normalized lowercase `run pnpm add express` to standard uppercase `RUN pnpm add express`.

