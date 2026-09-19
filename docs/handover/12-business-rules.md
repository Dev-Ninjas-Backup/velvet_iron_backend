# Velvet & Iron Backend - Extracted Business Rules Engine

**Document ID:** `12-business-rules.md`  
**Target Audience:** Product Managers, Core Developers, Business Analysts  

---

## 1. Gamification & Progression Business Rules

### 1.1 The Level Mathematical Formula
* **Location:** `src/leveladd/levelCalculator.ts` (lines 1–9)
* **Code Implementation:**
  ```typescript
  export const calculateLevel = (xp: number): number => {
    const raw = Math.floor((Number(xp) - 400) / 150) + 1;
    if (raw >= 50) return 50;
    if (raw < 1) return 1;
    return raw;
  };
  ```
* **Mathematical Function:**
  $$\text{Level}(XP) = \min\left(50, \max\left(1, \left\lfloor\frac{XP - 400}{150}\right\rfloor + 1\right)\right)$$
* **Progression Milestones:**
  * $XP < 400 \implies \text{Level } 1$
  * $XP = 400 \implies \text{Level } 1$
  * $XP = 550 \implies \text{Level } 2$
  * $XP = 700 \implies \text{Level } 3$
  * $XP = 850 \implies \text{Level } 4$
  * $XP \ge 7,750 \implies \text{Level } 50\text{ (Maximum Cap)}$
* **Next Level XP Requirement Calculation:**
  In `src/profile/profile.service.ts` (line 102):
  $$\text{Next Level XP} = 400 + (\text{level} \times 150) \quad (\text{if level } < 50)$$

---

### 1.2 The 50 RPG Level Titles (Tier Structure)
* **Location:** `src/leveladd/levelStatus.ts`
* **Rules:** Every user level (1 to 50) corresponds to a unique fantasy rank divided into 6 distinct tiers:

| Tier | Level Range | Titles Awarded |
| :--- | :--- | :--- |
| **Tier I: The Awakened** | Levels 1–7 | `Unbound`, `Initiate`, `Novice`, `Disciple`, `Acolyte`, `Adept`, `Bound` |
| **Tier II: The Seekers** | Levels 8–15 | `Aspirant`, `Pathfinder`, `Vanguard`, `Oathbound`, `Waymarked`, `Waymarked II`, `Waymarked III`, `Waymarked IV` |
| **Tier III: The Tempered** | Levels 16–25 | `Veteran`, `Sentinel`, `Ironbound`, `Hardened`, `Proven`, `Proven II`, `Proven III`, `Proven IV`, `Proven V`, `Proven VI` |
| **Tier IV: The Ascendant** | Levels 26–35 | `Elite`, `Champion`, `Paragon`, `Exemplar`, `Ascendant`, `Ascendant II`, `Ascendant III`, `Ascendant IV`, `Ascendant V`, `Ascendant VI` |
| **Tier V: The Mythic** | Levels 36–45 | `Ascended`, `Mythic`, `Eternal`, `Transcendent`, `Unyielding`, `Unyielding II`, `Unyielding III`, `Unyielding IV`, `Unyielding V`, `Unyielding VI` |
| **Tier VI: The Legends** | Levels 46–50 | `Legend`, `Warden`, `High Sovereign`, `Ironbound Legend`, `Ironbound Legend II` |

---

### 1.3 Store Unlock Eligibility & Level Gates

Users cannot spend `balanceXp` to unlock items whenever they wish; unlock capacity is strictly throttled by the user's current level.

#### Theme Unlock Rules (`src/leveladd/levelCalculator.ts` lines 11–28 & `src/theme/theme.service.ts` lines 277–298)
```typescript
// Number of total unlockable themes based on level tier:
// Level >= 30: up to 4 themes
// Level >= 20: up to 3 themes
// Level >= 10: up to 2 themes
// Level >= 1:  up to 1 theme
```
* **XP Cost:** Base themes cost **250 XP**.
* **Deduction Rule:** `userProfile.balanceXp` is decremented by 250; `totalEarnXp` remains untouched so the user never loses levels by unlocking assets.

#### Companion Unlock Rules (`src/leveladd/levelCalculator.ts` lines 32–48 & `src/companion/companion.service.ts` lines 298–319)
* Level $\ge 32$: up to 4 companions.
* Level $\ge 22$: up to 3 companions.
* Level $\ge 12$: up to 2 companions.
* Level $< 10$: 1 companion.
* **XP Cost:** Base companions cost **250 XP**.

---

### 1.4 The Daily Login XP Rule
* **Location:** `src/profile/profile.service.ts` (lines 235–267)
* **Rule:** A user can claim daily login XP at most **once per calendar day**.
* **Detection Mechanism:** Queries `xp_logs` for `userId == currentUser` AND `source == 'dayliLoggin'` AND `createdAt >= todayStart (00:00:00)`.
* **Behavior:** If found, returns `{ success: false, message: 'Already XP claimed today' }`. If not found, calls `LeveladdService.addXpToUser()` with source `'dayliLoggin'`.

---

## 2. Nutrition & Health Tracking Rules

### 2.1 Calorie Auto-Calculation Rule
* **Locations:**
  * `src/meal-log/meal-log.service.ts` (line 26)
  * `src/meal-schedule/meal-schedule.service.ts`
  * `src/macro-goal/macro-goal.service.ts`
* **Rule:** Calories cannot be arbitrary; they are strictly derived from macronutrients using Atwater general factors:
  $$\text{Calories} = (4 \times \text{Carbohydrates}) + (4 \times \text{Protein}) + (9 \times \text{Fat})$$
* **Update Caveat:** When updating a meal log via `PATCH /meal-log/:id`, the caller must supply all three macro fields (`carbs`, `protein`, `fats`); otherwise, missing fields update to 0.

---

### 2.2 The Inverted Onboarding XP Award Bug

> [!CAUTION]
> **Confirmed Logic Bug in Production Code**  
> Across all logging services (`meal-log`, `meal-schedule`, `medication`, `medication-schedule`, `exercise-log`, `mood-log`, `weight-log`), XP awards are wrapped in the following check:
> ```typescript
> // if onboarded then add xp
> if (user && !user.onBoarded) {
>   await this.leveladdService.addXpToUser(userId, 10, '...');
> }
> ```
> * **Intended Behavior (from comment):** Only users who have completed onboarding (`onBoarded === true`) should receive XP.
> * **Actual Code Behavior:** Only users who have **NOT** completed onboarding (`!user.onBoarded`) receive XP. Users who complete onboarding are permanently blocked from earning XP through logging activities.
> * **Action Required:** Product decision needed to flip the boolean check to `if (user && user.onBoarded)`.

---

## 3. Daily Quests Evaluation Rules

* **Location:** `src/xp-stats/xp-stats.service.ts` (`getTodayQuestXp`)
* **Timezone:** Bangladesh Standard Time (`Asia/Dhaka`, UTC+6). Start of day is calculated from midnight in Dhaka.
* **Rules Evaluated Daily:**

| Quest ID | Title | XP Reward | Pass Condition |
| :--- | :--- | :--- | :--- |
| `track-your-shot` | Track Your Shot | 10 XP | `COUNT(medication + medication_schedules taken today) > 0` |
| `three-meals` | Three Meals a Day | 30 XP | `COUNT(meal_logs + meal_schedules taken today where type in [BREAKFAST, LUNCH, DINNER]) >= 3` |
| `mood-check` | Mood Check | 30 XP | `COUNT(mood_logs recorded today) > 0` |
| `step-master` | Step Master | 20 XP | `SUM(exercise_log.duration + exercise_schedule_log.duration today) >= 30` minutes |
| `protein-power` | Protein Power | 30 XP | `SUM(meal_logs.protein + meal_schedules.protein today) >= 120` grams |

---

## 4. In-Memory XP Rate Limiting Rules

* **Location:** `src/main/xp-timeout/xp-timeout.service.ts`
* **Rule:** Calls to `getXpTimeout` and `getReadstoryXpTimeout` are limited to once every 24 hours per user.
* **Memory Mechanism:** Uses an in-memory JavaScript `Map<string, number>` storing `userId -> timestamp`.
* **Key Pitfall:** The same Map is shared by both endpoints. Calling `getXpTimeout` automatically blocks `getReadstoryXpTimeout` for 24 hours. Furthermore, restarting the server or deploying new containers erases all active rate limit records.

