# গ্যামিফিকেশন ও হেলথ ট্র্যাকিং সিস্টেম ✅

## ✅ সম্পন্ন কাজ

### 🗄️ ডাটাবেস টেবিল (১৭টি নতুন টেবিল)

#### গ্যামিফিকেশন সিস্টেম:

1. **user_profiles** - ইউজারের XP, লেভেল, এক্টিভ থিম ও কম্প্যানিয়ন
2. **themes** - এডমিন যে থিম তৈরি করবে (গ্লোবাল)
3. **companions** - এডমিন যে কম্প্যানিয়ন তৈরি করবে (গ্লোবাল)
4. **user_themes** - ইউজার যে থিমগুলো আনলক করেছে
5. **user_companions** - ইউজার যে কম্প্যানিয়নগুলো আনলক করেছে

#### হেলথ ট্র্যাকিং:

6. **weight_logs** - ওজন ট্র্যাকিং
7. **mood_logs** - মুড, এনার্জি, ক্ষুধা লেভেল
8. **meal_schedules** - খাবারের সময়সূচী
9. **meal_logs** - খাবার ট্র্যাকিং (ক্যালোরি, কার্বস, প্রোটিন, ফ্যাট)
10. **medications** - ঔষধের তালিকা
11. **medication_schedules** - ঔষধ খাওয়ার সময়
12. **medication_logs** - ঔষধ খাওয়ার রেকর্ড
13. **exercise_logs** - ব্যায়াম ট্র্যাকিং

#### কোয়েস্ট সিস্টেম:

14. **quests** - এডমিন যে কোয়েস্ট তৈরি করবে
15. **user_quests** - ইউজার কোয়েস্ট সম্পন্ন করার রেকর্ড

#### সাবস্ক্রিপশন:

16. **subscriptions** - ইউজার সাবস্ক্রিপশন প্ল্যান

---

## 🎯 কিভাবে কাজ করে

### 1️⃣ **Admin → Theme/Companion তৈরি করে**

```bash
POST /themes
{
  "name": "Ocean Breeze",
  "tagline": "Calm and Refreshing",
  "unlockXp": 1000  # কত XP লাগবে আনলক করতে
}
```

- এডমিন থিম/কম্প্যানিয়ন তৈরি করে
- সেটা **themes** / **companions** টেবিলে সেভ হয়
- সব ইউজারের জন্য ভিজিবল/এভেইলেবল

### 2️⃣ **User → XP দিয়ে আনলক করে**

```bash
# প্রথমে XP এড করো (টেস্টিং এর জন্য)
POST /profile/add-xp
{
  "xp": 1500
}

# এরপর আনলক করো
POST /themes/:themeId/unlock
```

- ইউজার যদি পর্যাপ্ত XP থাকে
- তাহলে সে আনলক করতে পারবে
- আনলক হলে **user_themes** / **user_companions** টেবিলে এন্ট্রি যোগ হবে

### 3️⃣ **Active → একটাই থাকবে**

```bash
POST /themes/:themeId/activate
```

- ইউজার একাধিক থিম/কম্প্যানিয়ন আনলক করতে পারবে
- কিন্তু একসময়ে **শুধু একটা থিম** ও **একটা কম্প্যানিয়ন** এক্টিভ থাকবে
- `is_active = true` শুধু একটার জন্য
- বাকি সবগুলো `is_active = false`

---

## 📱 API Endpoints তৈরি হয়েছে

### **থিম ম্যানেজমেন্ট** (/themes)

#### এডমিন এন্ডপয়েন্ট (শুধু ADMIN/SUPER_ADMIN):

- ✅ `POST /themes` - নতুন থিম তৈরি
- ✅ `PATCH /themes/:id` - থিম আপডেট
- ✅ `DELETE /themes/:id` - থিম ডিলিট

#### পাবলিক এন্ডপয়েন্ট:

- ✅ `GET /themes` - সব থিম দেখা
- ✅ `GET /themes/:id` - একটা থিম এর বিস্তারিত

#### ইউজার এন্ডপয়েন্ট (লগইন লাগবে):

- ✅ `GET /themes/my-themes` - আমার আনলক করা থিমগুলো
- ✅ `POST /themes/:id/unlock` - XP দিয়ে আনলক করো
- ✅ `POST /themes/:id/activate` - এক্টিভ করো

### **কম্প্যানিয়ন ম্যানেজমেন্ট** (/companions)

একই রকম এন্ডপয়েন্ট themes এর মতো

### **প্রোফাইল ম্যানেজমেন্ট** (/profile)

- ✅ `GET /profile` - নিজের প্রোফাইল (XP, level, active theme/companion)
- ✅ `POST /profile/add-xp` - XP যোগ করো (টেস্টিং এর জন্য)
- ✅ `GET /profile/leaderboard?limit=10` - টপ ইউজার XP অনুযায়ী

---

## 🔑 গুরুত্বপূর্ণ পয়েন্ট

### ✅ Admin এর কাজ:

1. থিম/কম্প্যানিয়ন তৈরি করা
2. আনলক করার জন্য XP সেট করা
3. কোয়েস্ট তৈরি করা

### ✅ User এর কাজ:

1. XP অর্জন করা (কোয়েস্ট, এক্টিভিটি থেকে)
2. থিম/কম্প্যানিয়ন আনলক করা
3. পছন্দের একটা এক্টিভ করা

### ✅ সিস্টেম এর কাজ:

- একসাথে একটাই থিম ও একটাই কম্প্যানিয়ন এক্টিভ রাখা
- XP থেকে অটোমেটিক লেভেল ক্যালকুলেট করা
- `Level = floor(XP / 1000) + 1`

---

## 📊 ডাটা ফ্লো

```
1. Admin তৈরি করে:
   themes (name, unlockXp) → সব ইউজার দেখতে পারে

2. User XP জমা করে:
   user_profiles (xp, level) → অটোমেটিক লেভেল হিসাব

3. User আনলক করে:
   user_themes (userId, themeId) → আনলক রেকর্ড

4. User এক্টিভ করে:
   user_themes (is_active = true)  → শুধু একটা
   user_profiles (activeThemeId)   → রেফারেন্স
```

---

## 🧪 টেস্ট করার জন্য

### ধাপ ১: এডমিন হিসেবে থিম তৈরি করো

```bash
POST http://localhost:3000/themes
Authorization: Bearer <admin_token>

{
  "name": "Dark Knight",
  "tagline": "শক্তিশালী ও রহস্যময়",
  "description": "একটি ডার্ক থিম",
  "unlockXp": 1000
}
```

### ধাপ ২: নিজের প্রোফাইলে XP যোগ করো

```bash
POST http://localhost:3000/profile/add-xp
Authorization: Bearer <user_token>

{
  "xp": 1500
}
```

### ধাপ ৩: থিম আনলক করো

```bash
POST http://localhost:3000/themes/{themeId}/unlock
Authorization: Bearer <user_token>
```

### ধাপ ৪: থিম এক্টিভ করো

```bash
POST http://localhost:3000/themes/{themeId}/activate
Authorization: Bearer <user_token>
```

### ধাপ ৫: প্রোফাইল চেক করো

```bash
GET http://localhost:3000/profile
Authorization: Bearer <user_token>
```

---

## 📁 ফাইল স্ট্রাকচার

```
prisma/
  schema/
    ├── schema.prisma           # মূল কনফিগ
    ├── user.prisma            # ইউজার মডেল (আপডেটেড)
    ├── gamification.prisma    # 🆕 থিম/কম্প্যানিয়ন মডেল
    ├── health-tracking.prisma # 🆕 হেলথ ট্র্যাকিং মডেল
    ├── quests.prisma          # 🆕 কোয়েস্ট মডেল
    └── subscription.prisma    # 🆕 সাবস্ক্রিপশন মডেল

src/
  ├── theme/                   # 🆕 থিম মডিউল
  │   ├── theme.controller.ts
  │   ├── theme.service.ts
  │   ├── theme.module.ts
  │   └── dto/
  ├── companion/               # 🆕 কম্প্যানিয়ন মডিউল
  │   ├── companion.controller.ts
  │   ├── companion.service.ts
  │   ├── companion.module.ts
  │   └── dto/
  ├── profile/                 # 🆕 প্রোফাইল মডিউল
  │   ├── profile.controller.ts
  │   ├── profile.service.ts
  │   ├── profile.module.ts
  │   └── dto/
  └── common/
      └── decorators/
          └── get-user.decorator.ts  # 🆕 GetUser ডেকোরেটর
```

---

## ✅ সম্পূর্ণ হয়েছে

1. ✅ সব টেবিল তৈরি (১৭টি নতুন)
2. ✅ Prisma migration রান করা
3. ✅ Theme মডিউল (Controller + Service)
4. ✅ Companion মডিউল (Controller + Service)
5. ✅ Profile মডিউল (Controller + Service)
6. ✅ সব এন্ডপয়েন্ট তৈরি
7. ✅ Authentication & Authorization সেটআপ
8. ✅ GetUser ডেকোরেটর তৈরি
9. ✅ প্রজেক্ট বিল্ড সফল
10. ✅ সার্ভার রান হচ্ছে

---

## 🚀 পরবর্তী ধাপ (ভবিষ্যতে করা যাবে)

এই টেবিলগুলোর জন্য এখনো Controller/Service তৈরি করা বাকি:

- Weight Logging
- Mood Logging
- Meal Tracking
- Medication Tracking
- Exercise Logging
- Quest System

এগুলো একই প্যাটার্ন অনুসরণ করে যেকোনো সময় তৈরি করা যাবে।

---

## 🎉 সব কিছু রেডি!

এখন তুমি:

1. ✅ এডমিন হিসেবে থিম/কম্প্যানিয়ন তৈরি করতে পারবে
2. ✅ ইউজার হিসেবে XP অর্জন করতে পারবে
3. ✅ XP দিয়ে আনলক করতে পারবে
4. ✅ পছন্দের থিম/কম্প্যানিয়ন এক্টিভ করতে পারবে
5. ✅ লিডারবোর্ডে নিজের অবস্থান দেখতে পারবে
