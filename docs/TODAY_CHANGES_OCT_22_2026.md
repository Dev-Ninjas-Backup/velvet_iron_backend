# Backend API Specification: Meal Log Date Isolation & Timezone Synchronization (October 22, 2026)

**Document Release:** October 22, 2026  
**Target Environment:** Production (`https://velvet.api.softvence.app` / Host `98.91.110.54`)  
**Target Modules:** Meal Log, Macro Goal, User Profile, XP Stats, Timezone Utilities  
**Validation Suite:** `npm run test:recent` (9/9 Suites Passing, including Live Production Verification)  
**Compilation & Build Status:** `npm run build` Passing (0 errors) | Docker Build & Deploy: Complete  

---

## 1. Executive Summary

This release resolves the critical nutrition-tracking bug reported where meals logged on Monday evening were erroneously carrying over into Tuesday's dashboard:

### 1. The Issue
- **Reported Bug:** On Tuesday, October 20, with NO meals logged, the Meal Log dashboard displayed `374/1740 calories, 54g protein, 8g carbs, 15g fat`.
- **Root Cause:** 
  1. The meals were logged on Monday, October 19 at approximately 9:18–9:19 PM Central Time (CDT, UTC-5).
  2. Because CDT is 5 hours behind UTC, `9:18 PM CDT` is `02:18 AM UTC` on the next calendar day (`2026-10-20T02:18:01.340Z`).
  3. `MealLogService.getMealLogHistory` had previously computed "today" using `new Date().setHours(0, 0, 0, 0)` in server UTC. Since midnight UTC occurs at 7:00 PM CDT of the previous day, Monday evening meals after 7:00 PM CDT were bucketed into Tuesday's UTC window.
  4. `MealLogController.getMealLogHistory` lacked `@Query('date')`, `@Query('timezone')`, and `@Req()` request parsing, making it impossible to query historical or specific local calendar dates.
  5. `weeklyPresent` was computing day-of-week via `loggedAt.getDay()` in server UTC, incorrectly flagging Monday evening meals under Tuesday.

---

## 2. Core Resolutions Implemented

### A. Localized Day Boundaries & Target Date Querying (`MealLogService` & `MealLogController`)
- **`GET /meal-log/history`** now accepts:
  - `?date=YYYY-MM-DD`: Calculates `consumed`, `daily`, and `remaining` nutrition totals specifically for that local calendar date.
  - `?timezone=America/Chicago`: Overrides or specifies the client's local IANA timezone.
  - `?filterLogsByDate=true|false`: When set to `true`, filters the returned `logs` array to entries on the target local date; defaults to `false` (full paginated history) preserving existing behavior.
- Added route aliases: **`GET /meal-log/today`** and **`GET /meal-log/daily`**.
- Uses `getUserDayBoundaries(timezone, targetDate)` to determine localized UTC timestamp range:
  - For `America/Chicago` on Monday Oct 19: `2026-10-19T05:00:00.000Z` to `2026-10-20T04:59:59.999Z`.
  - For `America/Chicago` on Tuesday Oct 20: `2026-10-20T05:00:00.000Z` to `2026-10-21T04:59:59.999Z`.
  - The Monday 9:18 PM meals (`02:18 UTC`) are strictly bounded to Monday and cannot leak into Tuesday.

### B. Persistent User Profile Timezone & Fallback Protection
- Added `timezone String? @default("America/Chicago")` to `UserProfile` in `prisma/schema/userProfile.prisma`.
- Created idempotent production migration:
  `prisma/migrations/20261022000000_add_user_profile_timezone/migration.sql`.
- Updated `extractTimezone(req)` in `src/common/utils/timezone.util.ts` with default fallback to `'America/Chicago'` (US Central Time) rather than UTC.
- Services inspect `userProfile.timezone` if headers/query params are omitted by older frontend clients.
- Added `PATCH /profile/timezone` endpoint and support in `UpdateProfileDto` to allow users to update their timezone preference.

### C. Localized `weeklyPresent` & Macro Goal Alignment
- `weeklyPresent` (Sunday through Saturday) is now computed with `getUserDateMeta(loggedAt, timezone).dayName` using localized calendar arithmetic, preventing Monday evening meals from checking Tuesday.
- Macro goals active on or before `endOfDay` of the target date (`createdAt: { lte: endOfDay }`) are resolved so historical views show the goal applicable at that time.

---

## 3. Production Verification Results

Live verification executed against production database (`velvet_backend_DB` on host `98.91.110.54`) for user `friddlejay@gmail.com`:

| Metric | Monday, Oct 19 (`date=2026-10-19`) | Tuesday, Oct 20 (`date=2026-10-20`) |
| :--- | :--- | :--- |
| **Calories Consumed** | **374 kcal** | **570 kcal** (Tuesday lunch only) |
| **Protein Consumed** | **54g** | **48g** |
| **Carbs Consumed** | **8g** | **55g** |
| **Fat Consumed** | **15g** | **20g** |
| **Meals Included** | 1. Protein shake (170 kcal)<br>2. Porkchop (204 kcal)<br>3. Air (0 kcal) | Protein bagel with turkey, cream cheese, avocado (570 kcal) |
| **Leakage between Days** | **None (0% overlap)** | **None (0% overlap)** |

---

## 4. Automated Test Suite Status

Command: `npm run test:recent`  
Output: **9 of 9 test suites passing** (0 errors).
