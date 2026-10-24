# Production Release & Architecture Report: Recurring Activities & Date-Based Completion Tracking

**Date:** October 24, 2026  
**Environment:** Production (`https://velvet.api.softvence.app` / Host: `98.91.110.54`)  
**Status:** Deployed & Verified Live (HTTP 200 OK)  
**Migration:** `20261024000000_add_schedule_completions` (Applied successfully in production)  

---

## 1. Executive Summary & Root Cause Resolution

### The Issue Reported
> "Scheduled Activities Not Appearing on Subsequent Days: the activity only appears on the first scheduled day. When the next selected day arrives, the activity does not reappear as it should."

### Root Causes Discovered During Production Audit
1. **Creation Bug (Empty `daysOfWeek: {}`):**
   When recurring exercises were created (e.g. `Walk the Realm` `e8277452-25cd-410b-81eb-edff3b5c98b2`), `daysOfWeek` was stored as `{}` (empty array) because the fallback from `scheduledAt` was missing in `createExerciseSchedule`.
2. **Dashboard Query Bug (`filterItemsByDateRange`):**
   In `src/profile/profile.service.ts` (lines 445–448), today's workouts and medications were filtered strictly using:
   `new Date(e.loggedAt) >= startDate && new Date(e.loggedAt) <= endDate`.
   Because `loggedAt` was the creation day, the activity vanished completely on Wednesday, Friday, and all subsequent scheduled days.
3. **Master Record Overwrite Bug (`isTaken: true`):**
   When an activity was marked completed, `isTaken = true` was written directly onto the master row in `exercise_schedule_logs`, permanently locking the schedule in a completed state and preventing it from reappearing on subsequent scheduled days.
4. **Timezone Drift:**
   Server-side `.getDay()` was executed on UTC dates rather than evaluating the user's localized calendar date (e.g., US Central Time).

---

## 2. Implemented Architecture

### A. Dedicated Separate Table: `schedule_completions`
The master schedule rules are decoupled from daily completions. Master schedules store the recurrence pattern (`daysOfWeek`), while `schedule_completions` tracks completions per calendar date:

```prisma
model ScheduleCompletion {
    id           String   @id @default(uuid())
    userId       String
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    scheduleId   String   // ID of master schedule (exercise, medication, meal, or scheduledItem)
    scheduleType String   // 'WORKOUT', 'MEDICATION', 'MEAL', 'GENERAL'
    date         String   // 'YYYY-MM-DD' representing the user's local calendar date
    isCompleted  Boolean  @default(true)
    completedAt  DateTime @default(now())
    earnedXp     Int      @default(10)
    createdAt    DateTime @default(now())

    @@unique([userId, scheduleId, date])
    @@index([userId, date])
    @@index([scheduleId, date])
    @@map("schedule_completions")
}
```

### B. Idempotent Migration & Live Data Repair
Migration `20261024000000_add_schedule_completions`:
- Created table `schedule_completions` with unique constraint `(userId, scheduleId, date)`.
- Repaired all existing production records that had empty `daysOfWeek: {}` by extracting their ISO weekday:
  - Repaired `Walk the Realm`: updated `daysOfWeek` from `{}` to `{3}` (Wednesday).
  - Repaired `Flexibility`: updated `daysOfWeek` from `{}` to `{6}` (Saturday).

---

## 3. Services Updated

### 1. Robust Weekday Utility (`src/common/utils/weekday.util.ts`)
- **`normalizeDaysOfWeek`**:
  - Automatically maps Sunday `0` to `7` (ISO-8601).
  - Parses comma-separated strings (`"1, 3, 5"`).
  - Parses stringified JSON (`"[1, 3, 5]"`).
  - Supports aliases: `repeatDays`, `days`, `weekdays`, `selectedDays`.
- **`getIsoWeekday(timezone, targetDate)`**: Computes weekday without server `.getDay()` timezone drift.
- **`getUserDateString(timezone, targetDate)`**: Returns formatted local `'YYYY-MM-DD'`.

### 2. Dedicated Global Service (`src/schedule-completion/`)
- **`ScheduleCompletionService`**:
  - `recordCompletion`: Records completion for local date, guarantees strictly one-time 10 XP award per calendar day.
  - `removeCompletion`: Unmarks completion if unchecked on same day.
  - `getCompletedScheduleIds`: Fast indexed lookup for date queries.

### 3. Exercise Log Service (`src/exercise-log/exercise-log.service.ts`)
- **`createExerciseSchedule`**: Automatically populates `daysOfWeek` from `scheduledAt` if empty.
- **`getTodaySchedules`**:
  - Determines local weekday and date string (`dateStr`).
  - Matches active recurring schedules (`daysOfWeek.includes(dayOfWeek)` or `recurrence == 'DAILY'`).
  - Looks up daily completions from `schedule_completions` for `date = dateStr`.
  - Maps `isTaken: completedIds.has(schedule.id)` (guaranteeing 0% leakage into future days).
- **`updateExerciseSchedule` & `markExerciseLogAsTaken`**: Updates date-based completions and keeps `lastTakenDate` synced.

### 4. Medication Schedule Service (`src/medication-schedule/medication-schedule.service.ts`)
- Same architecture: date-based completion tracking, auto-fallback `daysOfWeek`, and zero leakage between days.

### 5. Profile Dashboard (`src/profile/profile.service.ts`)
- Dynamic schedule integration: replaced static date range filtering with active calls to:
  - `exerciseLogService.getTodaySchedules(userId, timezone)`
  - `medicationScheduleService.getTodaySchedules(userId, timezone)`
  - `mealScheduleService.getTodaySchedules(userId, timezone)`
- **Upcoming Schedule Persistence:**
  - If today has pending items, shows the earliest pending item.
  - If all of today's items are completed, keeps displaying today's completed item (`isTaken: true`, `earnedXp: 10`) until midnight.
  - After midnight (or on days with no scheduled items), advances to the next upcoming uncompleted occurrence.
- **`thisWeek` and `thisMonth` Expansion:** Recurring schedules are checked across the entire date range, so recurring activities appear correctly throughout the week and month.

### 6. Quests Feed (`src/quests-feed/quests-feed.service.ts`)
- Integrates both workouts and medications into `GET /quests/today`.
- Supports bidirectional completion via `/quests/today/complete` with `targetDateStr` support.

---

## 4. Verification Test Results

All 10 test suites in `scripts/test-recent-changes.js` passed with 100% success:
- ✔ **Test 1:** Custom Quest 10 XP Handling (PASS)
- ✔ **Test 2:** Universal Timezone Attribution (Wisconsin vs Dhaka) (PASS)
- ✔ **Test 3:** Medication Schedule Local Day Boundaries & Anti-Duplication (PASS)
- ✔ **Test 4:** Exercise Schedule Completion (PASS)
- ✔ **Test 4B:** "Walk the Realm" Bidirectional Sync (PASS)
- ✔ **Test 5:** Step Tracking & "Set Up Camp" (PASS)
- ✔ **Test 6:** Unified Quests Feed (PASS)
- ✔ **Test 7:** Meal Schedule Recurrence & Daily Reset (PASS)
- ✔ **Test 8:** Custom Quest Completion & Feed Resilience (PASS)
- ✔ **Test 9:** Meal Log Timezone Attribution & Zero Leakage (PASS)
- ✔ **Test 10 (Recurring Scheduled Activities Reappearance & Date Isolation):**
  - Mon/Wed/Fri exercise created: ID `6fc4b89a-d182-4c75-b87f-42ba4ef9987d`
  - Monday (Day 1) initial status: `isTaken: false` (PASS)
  - Monday (Day 1) completion: marked complete, recorded in `schedule_completions` (PASS)
  - Tuesday (Day 2) query: correctly excluded as non-scheduled day (PASS)
  - Wednesday (Day 3) query: **AUTOMATICALLY REAPPEARED with `isTaken: false`** (PASS)
  - Friday (Day 5) query: appeared with `isTaken: false` (PASS)
  - Wednesday completion via Quests Feed: confirmed complete for Wednesday (PASS)
  - Friday independence check: **Friday remained `isTaken: false` (0% leakage)** (PASS)
