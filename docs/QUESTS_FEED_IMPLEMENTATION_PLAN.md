# Implementation Plan: Quests Feed Module & Unified Scheduled Items

## Phase 1: Clean up Duplicate Schema (Data Modeling)
Currently, the database has duplicate tables for scheduling:
* `ScheduleItem` (the new consolidated model requested in Milestone 3)
* `MedicationSchedule`
* `ExerciseScheduleLog`
* `MealSchedule`

**Action:** We will use `ScheduleItem` as the single source of truth for all schedules. Any logic relying on the legacy specific schedules will be updated to use `ScheduleItem`. 

## Phase 2: Completion Tracking Architecture
Currently, `ScheduleItem` does not track *when* an item was completed on a specific day (it only tracks `startDate`, `endDate`, and `recurrenceType`). 
**Action:** We will introduce a new table: `ScheduleCompletionLog`.
* **Fields:** `id`, `scheduleItemId`, `userId`, `completedAt`.
* **Purpose:** Allows us to track if a recurring task (like a daily medication) was already completed *today*.

## Phase 3: Building the Quests Feed Service (`GET /quests-feed/today`)
We will write the aggregation logic inside `src/quests-feed/quests-feed.service.ts`:
1. **Fetch Codex Quests:** Query the system generated daily quests based on the user's progress.
2. **Fetch Custom Quests:** Query the user's custom quests, filter by recurrence for the current day, and check `lastCompletedAt` to see if it's already done today.
3. **Fetch Scheduled Items:** Query `ScheduleItem` where `isPaused == false` and the recurrence matches today's weekday/date. Join against `ScheduleCompletionLog` to determine the `isCompleted` status for today.
4. **Aggregate & Map:** Map all these disparate models into a single `UnifiedQuestItemDto` array.

## Phase 4: Building the Completion Endpoint (`POST /quests-feed/today/complete`)
The mobile app should only need to hit one endpoint to complete *any* of the aggregated items.
1. **Route to Handler:** Inspect the `questType` payload (`CODEX`, `CUSTOM`, `MEDICATION`, `WORKOUT`).
2. **Handle Custom Quests:** Delegate to `CustomQuestService.complete(id)` which already handles the 50 XP daily cap.
3. **Handle Scheduled Items:** 
   * Verify the `ScheduleItem` exists and is due today.
   * Check if a `ScheduleCompletionLog` already exists for today to prevent duplicate completion.
   * Create the `ScheduleCompletionLog`.
   * Award the standard XP for completing a schedule.
4. **Handle Codex Quests:** Return a `400 Bad Request` informing the client that Codex quests are completed automatically by logging activities (e.g., logging a meal), not via manual checkboxes.

## Phase 5: Testing
Write a node execution script (`scratch-quests-test.js`) to test the aggregation logic across the various tables and verify the completion routing successfully awards XP and blocks abuse.
