# Gamification and Health Tracking Implementation

## ✅ Implemented Features

### 1. **Database Schema** (Prisma)

All tables have been created with the following structure:

#### **User Management**

- ✅ `user_profiles` - User XP, levels, active theme/companion
- ✅ `themes` - Global themes created by admins
- ✅ `companions` - Global companions created by admins
- ✅ `user_themes` - User's unlocked themes (one active at a time)
- ✅ `user_companions` - User's unlocked companions (one active at a time)

#### **Health Tracking**

- ✅ `weight_logs` - Weight tracking with notes
- ✅ `mood_logs` - Mood, energy, and hunger levels
- ✅ `meal_schedules` - Meal planning
- ✅ `meal_logs` - Meal tracking with macros (calories, carbs, protein, fats)
- ✅ `medications` - User medications
- ✅ `medication_schedules` - Medication timing
- ✅ `medication_logs` - Medication intake tracking
- ✅ `exercise_logs` - Exercise tracking with duration and intensity

#### **Quest System**

- ✅ `quests` - Admin-created quests with XP rewards
- ✅ `user_quests` - User quest completion tracking

#### **Subscriptions**

- ✅ `subscriptions` - User subscription plans

---

## 📁 API Endpoints

### **Theme Management**

#### Admin Endpoints (Requires ADMIN/SUPER_ADMIN role):

- `POST /themes` - Create a new theme
- `PATCH /themes/:id` - Update a theme
- `DELETE /themes/:id` - Delete a theme

#### Public Endpoints:

- `GET /themes` - Get all available themes
- `GET /themes/:id` - Get theme details

#### User Endpoints (Requires Authentication):

- `GET /themes/my-themes` - Get user's unlocked themes
- `POST /themes/:id/unlock` - Unlock a theme with XP
- `POST /themes/:id/activate` - Set a theme as active

---

### **Companion Management**

#### Admin Endpoints (Requires ADMIN/SUPER_ADMIN role):

- `POST /companions` - Create a new companion
- `PATCH /companions/:id` - Update a companion
- `DELETE /companions/:id` - Delete a companion

#### Public Endpoints:

- `GET /companions` - Get all available companions
- `GET /companions/:id` - Get companion details

#### User Endpoints (Requires Authentication):

- `GET /companions/my-companions` - Get user's unlocked companions
- `POST /companions/:id/unlock` - Unlock a companion with XP
- `POST /companions/:id/activate` - Set a companion as active

---

### **Profile Management**

#### User Endpoints (Requires Authentication):

- `GET /profile` - Get user profile with XP, level, active theme & companion
- `POST /profile/add-xp` - Add XP to user profile (for testing)

#### Public Endpoints:

- `GET /profile/leaderboard?limit=10` - Get XP leaderboard

---

## 🎮 How It Works

### **Gamification Flow:**

1. **Admin Creates Content:**
   - Admin creates themes and companions
   - Sets XP requirements for unlocking

2. **User Earns XP:**
   - User completes quests
   - User performs tracked activities
   - XP is added to their profile
   - Level is automatically calculated (Level = floor(XP / 1000) + 1)

3. **User Unlocks Items:**
   - User checks available themes/companions
   - If user has enough XP, they can unlock items
   - Items are added to `user_themes` or `user_companions`

4. **User Activates Items:**
   - User can have multiple themes/companions unlocked
   - Only ONE theme and ONE companion can be active at a time
   - Setting an item as active automatically deactivates others
   - Active items are referenced in `user_profiles` table

---

## 🔐 Authentication & Authorization

- **Public Routes:** Get all themes/companions, leaderboard
- **Authenticated Routes:** User-specific operations (unlock, activate, profile)
- **Admin Routes:** Create, update, delete themes/companions

---

## 🗄️ Database Relations

```
User (1) -> (1) UserProfile
User (1) -> (*) UserTheme
User (1) -> (*) UserCompanion

UserProfile (1) -> (1) Theme (active)
UserProfile (1) -> (1) Companion (active)

Theme (1) -> (*) UserTheme
Companion (1) -> (*) UserCompanion

UserTheme -> User + Theme (unique constraint)
UserCompanion -> User + Companion (unique constraint)
```

---

## 📝 Notes

- XP system is flexible - can be awarded for:
  - Completing quests
  - Logging meals
  - Tracking exercises
  - Maintaining streaks
  - etc.

- Level calculation is simple: `Level = floor(XP / 1000) + 1`
  - Can be customized as needed

- Only one theme and one companion can be active at a time per user
- `is_active` flag in `user_themes` and `user_companions` ensures this

---

## 🚀 Next Steps (Future Implementation)

The following tables are created but don't have controllers/services yet:

- Weight logging
- Mood logging
- Meal tracking
- Medication tracking
- Exercise logging
- Quest system

These can be implemented as needed using the same pattern as themes/companions.

---

## 🧪 Testing

1. **Create a theme (as admin):**

```bash
POST /themes
{
  "name": "Ocean Breeze",
  "tagline": "Calm and Refreshing",
  "description": "A soothing ocean-inspired theme",
  "unlockXp": 1000
}
```

2. **Add XP to your profile:**

```bash
POST /profile/add-xp
{
  "xp": 1500
}
```

3. **Unlock the theme:**

```bash
POST /themes/:themeId/unlock
```

4. **Activate the theme:**

```bash
POST /themes/:themeId/activate
```

5. **Check your profile:**

```bash
GET /profile
```

---

## 📚 Migration Info

Migration created: `20260202221551_add_gamification_and_health_tracking`

- All 17 new tables created
- All relations established
- Database is ready to use
