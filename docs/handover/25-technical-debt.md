# Velvet & Iron Backend - Technical Debt & Suspicious Code Inventory

**Document ID:** `25-technical-debt.md`  
**Target Audience:** Technical Leads, Senior Engineers, Refactoring Teams  

---

## 1. Technical Debt Classification Matrix

| Item | Classification | Location | Impact |
| :--- | :--- | :--- | :--- |
| **Inverted Onboarding XP Check** | **Confirmed Bug** | 7 Logging Services | Onboarded users receive no XP for logging health actions |
| **Missing Guard on Macro Goal ID Routes**| **Confirmed Bug** | `src/macro-goal/macro-goal.controller.ts` | `GET /:id` and `DELETE /:id` crash with TypeError if unauthenticated |
| **Dead Code after Early Returns** | **Dead Code** | `theme.service.ts`, `companion.service.ts` | 50+ lines of unreachable duplicate logic |
| **Missing Public Directory** | **Maintenance Concern** | Root directory | Causes 404 on `/swagger-helper.js` |
| **Dual AWS SDKs (v2 & v3)** | **Maintenance Concern** | `package.json`, `src/aws/aws.service.ts` | Bloats bundle size by ~80MB, uses deprecated v2 SDK |
| **In-Memory Rate Limiting** | **Fragile Architecture** | `src/main/xp-timeout/xp-timeout.service.ts` | Memory leak risk, resets on restart, shared across endpoints |
| **Hardcoded Timezone** | **Maintenance Concern** | `src/xp-stats/xp-stats.service.ts`, `profile.service.ts`| Hardcoded to `'Asia/Dhaka'`, ignores user local time |
| **Windows Path in PDF Script** | **Confirmed Bug** | `convert-to-pdf.js` (line 83) | Fails on macOS/Linux due to hardcoded Windows path |
| **Obsolete VS Code Launch Configs**| **Legacy Residue** | `.vscode/launch.json` | Leftover references to `sst`, `yarn`, and `vitest` |
| **Commented-Out Endpoints** | **Maintenance Concern** | `theme.controller.ts`, `companion.controller.ts`| Admin CRUD routes commented out instead of implemented |
| **Spelling Errors in Source** | **Code Hygiene** | Multiple files | `'dayliLoggin'`, `'isAcitve'`, `'IMMAGE_NAME'` |

---

## 2. Detailed Technical Debt Analysis

### 2.1 Confirmed Bug: Missing `@ValidUser()` in `MacroGoalController`
* **Location:** `src/macro-goal/macro-goal.controller.ts` (lines 100, 173)
* **Code:**
  ```typescript
  @Get(':id')
  async getMacroGoalById(@GetUser() user: any, @Param('id') id: string) {
      const macroGoal = await this.macroGoalService.getMacroGoalById(user.id, id);
      ...
  }

  @Delete(':id')
  async deleteMacroGoal(@GetUser() user: any, @Param('id') id: string) {
      const result = await this.macroGoalService.deleteMacroGoal(user.id, id);
      ...
  }
  ```
* **The Bug:** Unlike the other routes in this controller, `@Get(':id')` and `@Delete(':id')` do **not** have `@ValidUser()`. When an unauthenticated request arrives, `user` is `undefined`. Calling `user.id` immediately throws an unhandled `TypeError: Cannot read properties of undefined (reading 'id')`, resulting in an HTTP 500 error.

---

### 2.2 Confirmed Bug: Inverted Onboarding XP Logic
* **Locations:**
  * `src/meal-log/meal-log.service.ts` (line 50)
  * `src/meal-schedule/meal-schedule.service.ts` (line 67)
  * `src/medication/medication.service.ts` (line 32)
  * `src/medication-schedule/medication-schedule.service.ts` (line 52)
  * `src/exercise-log/exercise-log.service.ts` (lines 39, 71)
  * `src/mood-log/mood-log.service.ts` (line 76)
  * `src/weight-log/weight-log.service.ts` (line 57)
* **The Code:**
  ```typescript
  //if onboarded then add xp
  if (user && !user.onBoarded) {
    await this.leveladdService.addXpToUser(userId, earnedXp, '...');
  }
  ```
* **The Problem:** The comment says `if onboarded then add xp`, but the conditional checks `!user.onBoarded`. As a result, users who finish onboarding never earn XP for logging their meals, exercises, medications, moods, or weight.

---

### 2.3 Unreachable Dead Code in `ThemeService` and `CompanionService`
* **Locations:** `src/theme/theme.service.ts` (lines 171–204) and `src/companion/companion.service.ts` (lines 189–232)
* **The Code:**
  ```typescript
  if (availableThemes) {
    // ... complete theme unlock logic ...
    return { message: 'Theme unlocked successfully', ... };
  }

  // UNREACHABLE DEAD CODE:
  const theme = await this.findOne(themeId);
  let userProfile = await this.prisma.client.userProfile.findUnique(...);
  ...
  return this.prisma.client.userTheme.create(...);
  ```
* **The Problem:** `if (availableThemes)` already returns from the function. The code below it is completely unreachable dead code left over from a previous refactoring.

---

### 2.4 In-Memory XP Rate Limiting Fragility
* **Location:** `src/main/xp-timeout/xp-timeout.service.ts`
* **The Code:**
  ```typescript
  private userRequestTimestamps: Map<string, number> = new Map();
  ```
* **The Problems:**
  1. The Map is stored in Node.js process RAM. If the server restarts or deploys a new container, all 24-hour rate limit timestamps are erased.
  2. If multiple container replicas run behind a load balancer, each container maintains its own isolated Map.
  3. `getXpTimeout` and `getReadstoryXpTimeout` share the exact same Map. Calling one locks the user out of the other for 24 hours.

---

### 2.5 Hardcoded Local Windows Path in `convert-to-pdf.js`
* **Location:** `convert-to-pdf.js` (line 83)
* **The Code:**
  ```javascript
  executablePath: 'C:\\Users\\Shamim Rana\\.cache\\puppeteer\\chrome\\win64-138.0.7204.92\\chrome-win64\\chrome.exe',
  ```
* **The Problem:** Hardcoded to previous developer's Windows user directory (`Shamim Rana`). Running this script on macOS, Linux, or CI immediately crashes with a file not found error.

