# Velvet Iron Backend - Complete API Documentation

**Version:** 1.0  
**Base URL:** `/api` (or configured base URL)  
**Date:** February 28, 2026

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Profile Management](#2-profile-management)
3. [Themes](#3-themes)
4. [Companions](#4-companions)
5. [Onboarding](#5-onboarding)
6. [Macro Goal](#6-macro-goal)
7. [Mood Log](#7-mood-log)
8. [Weight Log](#8-weight-log)
9. [Meal Log](#9-meal-log)
10. [Meal Schedule](#10-meal-schedule)
11. [Medication](#11-medication)
12. [Medication Schedule](#12-medication-schedule)
13. [Exercise Log](#13-exercise-log)
14. [XP Statistics](#14-xp-statistics)
15. [File Uploads](#15-file-uploads)
16. [Payments](#16-payments)

---

## Authentication

All authenticated endpoints require a valid JWT token. Tokens can be provided via:
- **Bearer Token** in Authorization header: `Authorization: Bearer <token>`
- **Cookies**: `access_token` and `refresh_token`
- **Custom Headers**: `X-Access-Token` and `X-Refresh-Token`

### Token Auto-Refresh
The API automatically refreshes expired access tokens using refresh tokens when available.

---

## 1. Authentication

### 1.1 Register New User
**POST** `/auth/register`

Register a new user account and send verification email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email."
}
```

---

### 1.2 Login
**POST** `/auth/login`

Login with email/username and password. Sets cookies and returns tokens in headers.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "name": "John Doe"
  }
}
```

**Cookies Set:**
- `access_token` - Short-lived token (15 minutes default)
- `refresh_token` - Long-lived token (7 days default)

**Headers:**
- `X-Access-Token` - Access token
- `X-Refresh-Token` - Refresh token

---

### 1.3 Firebase Social Login
**POST** `/auth/firebase-login`

Universal social login endpoint supporting Google, Apple, Facebook, GitHub via Firebase.

**Request Body:**
```json
{
  "token": "firebase_id_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Social authentication successful",
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "auto_generated_username",
    "name": "John Doe"
  }
}
```

---

### 1.4 Get Current User Profile
**GET** `/auth/me`

Get current authenticated user profile. Supports auto token refresh.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "successfully fetched user profile",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "name": "John Doe",
    "isVerified": true
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

### 1.5 Logout
**DELETE** `/auth/logout`

Logout from current device and clear cookies.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.6 Verify Email
**POST** `/auth/verify-email`

Verify email address with OTP received via email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### 1.7 Resend Verification OTP
**POST** `/auth/resend-verification-otp`

Resend verification OTP to email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification OTP sent to email"
}
```

---

### 1.8 Forgot Password
**POST** `/auth/forgot-password`

Request password reset OTP via email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset OTP sent to email"
}
```

---

### 1.9 Verify Reset OTP
**POST** `/auth/verify-reset-otp`

Verify password reset OTP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "resetToken": "temporary_reset_token"
}
```

---

### 1.10 Reset Password
**POST** `/auth/reset-password`

Reset password using verified OTP and reset token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "resetToken": "temporary_reset_token",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 1.11 Change Password
**PUT** `/auth/change-password`

Change password when logged in.

**Authentication:** Required  
**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 1.12 Check Username Availability
**POST** `/auth/check-username`

Check if a username is available. Optional authentication.

**Authentication:** Optional  
**Request Body:**
```json
{
  "username": "desired_username"
}
```

**Response:**
```json
{
  "available": true,
  "message": "Username is available"
}
```

---

### 1.13 Update Username
**PUT** `/auth/update-username`

Update current user's username.

**Authentication:** Required  
**Request Body:**
```json
{
  "username": "new_username"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Username updated successfully",
  "user": {
    "id": "uuid",
    "username": "new_username"
  }
}
```

---

### 1.14 Update User Profile
**PATCH** `/auth/profile`

Update user profile information including profile photo.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `name` (string, optional) - User's full name
- `bio` (string, optional) - User biography
- `profilePhoto` (file, optional) - Profile photo upload

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "bio": "Fitness enthusiast",
    "profilePhotoUrl": "https://..."
  }
}
```

---

### 1.15 Get Discord OAuth URL
**GET** `/auth/discord-auth-url`

Get Discord OAuth authorization URL for social login.

**Response:**
```json
{
  "authUrl": "https://discord.com/api/oauth2/authorize?..."
}
```

---

### 1.16 Discord OAuth Login
**GET** `/auth/discord`

Initiate Discord OAuth login flow.

**Response:** Redirects to Discord OAuth page

---

### 1.17 Discord OAuth Callback
**GET** `/auth/discord/callback`

Discord OAuth callback endpoint. Handles the callback from Discord.

**Query Parameters:**
- `code` - OAuth authorization code
- `state` - OAuth state parameter

**Response:** HTML page or redirect with tokens

---

### 1.18 View Active Sessions
**GET** `/auth/sessions`

View all active sessions for the current user.

**Authentication:** Required  
**Response:**
```json
{
  "sessions": [
    {
      "id": "session_id",
      "deviceInfo": "Chrome on Windows",
      "lastActive": "2026-02-28T10:30:00Z",
      "current": true
    }
  ]
}
```

---

### 1.19 Logout All Devices
**DELETE** `/auth/logout-all`

Logout from all devices. Admin only.

**Authentication:** Required (Admin)  
**Response:**
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

---

## 2. Profile Management

### 2.1 Get My Profile
**GET** `/profile`

Get current user's profile with XP, level, and optionally scheduled items.

**Authentication:** Required

**Query Parameters:**
- `withSchedules` (boolean, optional) - Include schedules (default: true)
- `scheduleRange` (enum, optional) - Filter schedules: `today`, `week`, `month`, `all` (default: all)

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "user123",
    "name": "John Doe",
    "email": "user@example.com"
  },
  "profile": {
    "id": "uuid",
    "xp": 1250,
    "level": 5,
    "fitnessGoal": "WEIGHT_LOSS",
    "totalXp": 5000,
    "xpToNextLevel": 750
  },
  "schedules": {
    "meals": [],
    "medications": [],
    "exercises": []
  },
  "upcomingSchedule": {
    "type": "meal",
    "scheduledAt": "2026-02-28T14:00:00Z",
    "description": "Lunch"
  }
}
```

---

### 2.2 Add XP (Testing)
**POST** `/profile/add-xp`

Add XP to user profile for testing purposes.

**Authentication:** Required  
**Request Body:**
```json
{
  "xp": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "XP added successfully",
  "profile": {
    "xp": 1350,
    "level": 5,
    "leveledUp": false
  }
}
```

---

### 2.3 Add XP with Log
**POST** `/profile/add-xp/log`

Add XP to profile and log the change in leveladd table with reason.

**Authentication:** Required  
**Request Body:**
```json
{
  "xp": 50,
  "reason": "Daily login reward"
}
```

**Response:**
```json
{
  "success": true,
  "message": "XP logged successfully",
  "log": {
    "id": "uuid",
    "xpChange": 50,
    "reason": "Daily login reward",
    "timestamp": "2026-02-28T10:30:00Z"
  }
}
```

---

### 2.4 Claim Daily Login XP
**POST** `/profile/daily-login`

Claim daily login XP reward.

**Authentication:** Required  
**Request Body:**
```json
{
  "xp": 15
}
```

**Response:**
```json
{
  "success": true,
  "message": "Daily login XP claimed",
  "xpAwarded": 15,
  "canClaimNext": "2026-02-29T00:00:00Z"
}
```

---

### 2.5 Update Fitness Goal
**PATCH** `/profile/fitness-goal`

Update user's fitness goal.

**Authentication:** Required  
**Request Body:**
```json
{
  "fitnessGoal": "MUSCLE_GAIN"
}
```

**Allowed Values:** `WEIGHT_LOSS`, `MUSCLE_GAIN`, `MAINTENANCE`, `GENERAL_FITNESS`

**Response:**
```json
{
  "success": true,
  "message": "Fitness goal updated",
  "profile": {
    "fitnessGoal": "MUSCLE_GAIN"
  }
}
```

---

### 2.6 Get Leaderboard
**GET** `/profile/leaderboard`

Get XP leaderboard showing top users.

**Query Parameters:**
- `limit` (number, optional) - Number of users to return (default: 10)

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "username": "user123",
      "name": "John Doe",
      "xp": 10000,
      "level": 15
    }
  ]
}
```

---

### 2.7 Get Weekly Chart Data
**GET** `/profile/chart/weekly`

Get weekly chart data showing daily XP for each day of the week.

**Authentication:** Required  
**Response:**
```json
{
  "chartData": [
    {
      "day": "Monday",
      "date": "2026-02-23",
      "xp": 120
    },
    {
      "day": "Tuesday",
      "date": "2026-02-24",
      "xp": 150
    }
  ],
  "totalWeekXp": 850
}
```

---

### 2.8 Get Monthly Chart Data
**GET** `/profile/chart/monthly`

Get monthly chart data showing weekly XP for each week of the month.

**Authentication:** Required  
**Response:**
```json
{
  "chartData": [
    {
      "week": "Week 1",
      "startDate": "2026-02-01",
      "endDate": "2026-02-07",
      "xp": 750
    }
  ],
  "totalMonthXp": 3200
}
```

---

## 3. Themes

### 3.1 Get My Themes
**GET** `/themes/my-themes`

Get all themes unlocked by the current user.

**Authentication:** Required  
**Response:**
```json
{
  "themes": [
    {
      "id": "uuid",
      "name": "Dark Mode",
      "description": "Sleek dark theme",
      "xpCost": 500,
      "isUnlocked": true,
      "isActive": true,
      "colors": {
        "primary": "#000000",
        "secondary": "#333333"
      }
    }
  ]
}
```

---

### 3.2 Get Theme by ID
**GET** `/themes/{id}`

Get details of a specific theme.

**Response:**
```json
{
  "id": "uuid",
  "name": "Ocean Blue",
  "description": "Calming ocean theme",
  "xpCost": 750,
  "colors": {
    "primary": "#0077be",
    "secondary": "#00a8e1"
  }
}
```

---

### 3.3 Unlock Theme
**POST** `/themes/{id}/unlock`

Unlock a theme using XP.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Theme unlocked successfully",
  "xpSpent": 750,
  "remainingXp": 1500,
  "theme": {
    "id": "uuid",
    "name": "Ocean Blue",
    "isUnlocked": true
  }
}
```

---

### 3.4 Activate Theme
**POST** `/themes/{id}/activate`

Set a theme as active. Theme must be unlocked first.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Theme activated successfully",
  "activeTheme": {
    "id": "uuid",
    "name": "Ocean Blue"
  }
}
```

---

## 4. Companions

### 4.1 Get My Companions
**GET** `/companions/my-companions`

Get all companions unlocked by the current user.

**Authentication:** Required  
**Response:**
```json
{
  "companions": [
    {
      "id": "uuid",
      "name": "Dragon Pet",
      "description": "Loyal companion",
      "xpCost": 1000,
      "isUnlocked": true,
      "isActive": false,
      "imageUrl": "https://..."
    }
  ]
}
```

---

### 4.2 Get Companion by ID
**GET** `/companions/{id}`

Get details of a specific companion.

**Response:**
```json
{
  "id": "uuid",
  "name": "Phoenix",
  "description": "Mythical bird companion",
  "xpCost": 1500,
  "imageUrl": "https://...",
  "abilities": ["Fire", "Regeneration"]
}
```

---

### 4.3 Unlock Companion
**POST** `/companions/{id}/unlock`

Unlock a companion using XP.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Companion unlocked successfully",
  "xpSpent": 1500,
  "remainingXp": 2500,
  "companion": {
    "id": "uuid",
    "name": "Phoenix",
    "isUnlocked": true
  }
}
```

---

### 4.4 Activate Companion
**POST** `/companions/{id}/activate`

Set a companion as active. Companion must be unlocked first.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Companion activated successfully",
  "activeCompanion": {
    "id": "uuid",
    "name": "Phoenix"
  }
}
```

---

## 5. Onboarding

### 5.1 Update Onboarding Status
**PATCH** `/onboarding`

Update onboarding completion status and fitness goal.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `iscomplete` (boolean) - Onboarding completion status
- `fitnessGoal` (string, nullable) - Fitness goal

**Response:**
```json
{
  "success": true,
  "message": "Onboarding updated",
  "onboarding": {
    "iscomplete": true,
    "fitnessGoal": "WEIGHT_LOSS"
  }
}
```

---

### 5.2 Get Onboarding Status
**GET** `/onboarding`

Get current onboarding status.

**Authentication:** Required  
**Response:**
```json
{
  "iscomplete": false,
  "fitnessGoal": null,
  "currentStep": 2,
  "totalSteps": 5
}
```

---

### 5.3 Unlock Theme During Onboarding
**POST** `/onboarding/theme/{themeId}`

Unlock and activate a theme during onboarding (free, no XP cost).

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Theme unlocked and activated during onboarding",
  "theme": {
    "id": "uuid",
    "name": "Starter Theme",
    "isActive": true
  }
}
```

---

### 5.4 Unlock Companion During Onboarding
**POST** `/onboarding/companion/{companionId}`

Unlock and activate a companion during onboarding (free, no XP cost).

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Companion unlocked and activated during onboarding",
  "companion": {
    "id": "uuid",
    "name": "Starter Pet",
    "isActive": true
  }
}
```

---

## 6. Macro Goal

### 6.1 Create Macro Goal
**POST** `/macro-goal`

Create a new macro goal. Calories are auto-calculated from macros.

**Authentication:** Required  
**Request Body:**
```json
{
  "name": "Bulking Goal",
  "carbs": 300,
  "fat": 80,
  "protein": 150
}
```

**Response:**
```json
{
  "statusCode": 201,
  "message": "Macro goal created successfully",
  "data": {
    "id": "uuid",
    "name": "Bulking Goal",
    "carbs": 300,
    "fat": 80,
    "protein": 150,
    "calories": 2420
  }
}
```

**Calorie Calculation:**
- Carbs: 4 cal/g
- Protein: 4 cal/g
- Fat: 9 cal/g

---

### 6.2 Get All Macro Goals
**GET** `/macro-goal`

Get all macro goals for the current user.

**Authentication:** Required  
**Response:**
```json
{
  "statusCode": 200,
  "message": "Macro goals retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Bulking Goal",
      "carbs": 300,
      "protein": 150,
      "fat": 80,
      "calories": 2420,
      "createdAt": "2026-02-28T10:00:00Z"
    }
  ]
}
```

---

### 6.3 Get Macro Goal by ID
**GET** `/macro-goal/{id}`

Get a specific macro goal.

**Authentication:** Required  
**Response:**
```json
{
  "statusCode": 200,
  "message": "Macro goal retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Cutting Goal",
    "carbs": 200,
    "protein": 180,
    "fat": 50,
    "calories": 1970
  }
}
```

---

### 6.4 Update Macro Goal
**PATCH** `/macro-goal/{id}`

Update an existing macro goal. Calories are auto-recalculated.

**Authentication:** Required  
**Request Body:**
```json
{
  "name": "Updated Goal",
  "carbs": 250,
  "protein": 160,
  "fat": 70
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Macro goal updated successfully",
  "data": {
    "id": "uuid",
    "name": "Updated Goal",
    "carbs": 250,
    "protein": 160,
    "fat": 70,
    "calories": 2270
  }
}
```

---

### 6.5 Delete Macro Goal
**DELETE** `/macro-goal/{id}`

Delete a macro goal.

**Authentication:** Required  
**Response:**
```json
{
  "statusCode": 200,
  "message": "Macro goal deleted successfully"
}
```

---

## 7. Mood Log

### 7.1 Log Mood Entry
**POST** `/mood-log`

Create a new mood log entry.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `mood` (enum) - `TIRED`, `GOOD`, `PISSED`, `GREAT`, `POOR`
- `energyLevel` (enum) - `EXHAUSTED`, `LOW`, `MODERATE`, `ENERGIZED`, `HIGH`
- `hungerLevel` (enum) - `NOT_HUNGRY`, `HUNGRY`, `VERY_HUNGRY`
- `note` (string, optional) - Additional notes

**Response:**
```json
{
  "id": "uuid",
  "mood": "GOOD",
  "energyLevel": "MODERATE",
  "hungerLevel": "HUNGRY",
  "note": "Feeling good after workout",
  "loggedAt": "2026-02-28T10:30:00Z"
}
```

---

### 7.2 Get Mood Log History
**GET** `/mood-log/history`

Get mood log history with pagination.

**Authentication:** Required

**Query Parameters:**
- `limit` (number, optional) - Number of logs (default: 30)
- `offset` (number, optional) - Skip logs (default: 0)

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "mood": "GREAT",
      "energyLevel": "HIGH",
      "hungerLevel": "NOT_HUNGRY",
      "note": "Amazing day!",
      "loggedAt": "2026-02-28T10:00:00Z"
    }
  ],
  "total": 45,
  "limit": 30,
  "offset": 0
}
```

---

### 7.3 Get Latest Mood Log
**GET** `/mood-log/latest`

Get the most recent mood log.

**Authentication:** Required  
**Response:**
```json
{
  "id": "uuid",
  "mood": "GOOD",
  "energyLevel": "MODERATE",
  "hungerLevel": "HUNGRY",
  "loggedAt": "2026-02-28T10:30:00Z"
}
```

---

### 7.4 Get Today's Mood Log
**GET** `/mood-log/today`

Get today's mood log entry.

**Authentication:** Required  
**Response:**
```json
{
  "id": "uuid",
  "mood": "GOOD",
  "energyLevel": "MODERATE",
  "hungerLevel": "HUNGRY",
  "loggedAt": "2026-02-28T08:00:00Z"
}
```

---

### 7.5 Update Mood Log
**PATCH** `/mood-log/{id}`

Update an existing mood log entry.

**Authentication:** Required  
**Request Body:**
```json
{
  "mood": "GREAT",
  "energyLevel": "HIGH",
  "note": "Updated note"
}
```

**Response:**
```json
{
  "id": "uuid",
  "mood": "GREAT",
  "energyLevel": "HIGH",
  "hungerLevel": "HUNGRY",
  "note": "Updated note",
  "loggedAt": "2026-02-28T10:30:00Z"
}
```

---

### 7.6 Delete Mood Log
**DELETE** `/mood-log/{id}`

Delete a mood log entry.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Mood log deleted successfully"
}
```

---

## 8. Weight Log

### 8.1 Log Weight Entry
**POST** `/weight-log`

Create a new weight log entry.

**Authentication:** Required  
**Request Body:**
```json
{
  "weight": 75.5,
  "unit": "kg",
  "note": "Morning weight"
}
```

**Response:**
```json
{
  "id": "uuid",
  "weight": 75.5,
  "unit": "kg",
  "note": "Morning weight",
  "loggedAt": "2026-02-28T07:00:00Z"
}
```

---

### 8.2 Get Weight History with Stats
**GET** `/weight-log/history`

Get weight log history with statistics.

**Authentication:** Required  
**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "weight": 75.5,
      "unit": "kg",
      "loggedAt": "2026-02-28T07:00:00Z"
    }
  ],
  "stats": {
    "currentWeight": 75.5,
    "startWeight": 80.0,
    "totalChange": -4.5,
    "totalLogs": 30,
    "averageWeight": 77.2
  }
}
```

---

### 8.3 Get Weekly Weight Chart
**GET** `/weight-log/chart/weekly`

Get weekly weight chart data.

**Authentication:** Required  
**Response:**
```json
{
  "chartData": [
    {
      "day": "Monday",
      "date": "2026-02-23",
      "weight": 76.0
    },
    {
      "day": "Tuesday",
      "date": "2026-02-24",
      "weight": 75.8
    }
  ],
  "weeklyChange": -1.2
}
```

---

### 8.4 Get Today's Weight Log
**GET** `/weight-log/today`

Get today's weight log entry.

**Authentication:** Required  
**Response:**
```json
{
  "id": "uuid",
  "weight": 75.5,
  "unit": "kg",
  "loggedAt": "2026-02-28T07:00:00Z"
}
```

---

### 8.5 Update Today's Weight Log
**PATCH** `/weight-log/today`

Update today's weight log entry.

**Authentication:** Required  
**Request Body:**
```json
{
  "weight": 75.3,
  "note": "Updated morning weight"
}
```

**Response:**
```json
{
  "id": "uuid",
  "weight": 75.3,
  "unit": "kg",
  "note": "Updated morning weight",
  "loggedAt": "2026-02-28T07:00:00Z"
}
```

---

## 9. Meal Log

### 9.1 Log Meal Entry
**POST** `/meal-log`

Create a meal log entry. Calories are auto-calculated from macros.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `mealType` (enum) - `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`
- `description` (string, optional) - Meal description
- `carbs` (number) - Carbohydrates in grams
- `protein` (number) - Protein in grams
- `fats` (number) - Fats in grams

**Response:**
```json
{
  "id": "uuid",
  "mealType": "BREAKFAST",
  "description": "Oatmeal with banana",
  "carbs": 50,
  "protein": 30,
  "fats": 15,
  "calories": 455,
  "loggedAt": "2026-02-28T08:00:00Z"
}
```

---

### 9.2 Get Meal Log History
**GET** `/meal-log/history`

Get meal log history with daily nutrition summary.

**Authentication:** Required

**Query Parameters:**
- `limit` (number, optional) - Number of logs (default: 30)
- `offset` (number, optional) - Skip logs (default: 0)

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "mealType": "BREAKFAST",
      "description": "Oatmeal",
      "carbs": 50,
      "protein": 30,
      "fats": 15,
      "calories": 455,
      "loggedAt": "2026-02-28T08:00:00Z"
    }
  ],
  "dailySummary": {
    "totalCalories": 1850,
    "totalCarbs": 200,
    "totalProtein": 150,
    "totalFats": 65,
    "macroGoal": {
      "calories": 2420,
      "carbs": 300,
      "protein": 150,
      "fat": 80
    },
    "remaining": {
      "calories": 570,
      "carbs": 100,
      "protein": 0,
      "fats": 15
    }
  },
  "total": 120,
  "limit": 30,
  "offset": 0
}
```

---

### 9.3 Get Latest Meal Log
**GET** `/meal-log/latest`

Get the most recent meal log.

**Authentication:** Required  
**Response:**
```json
{
  "id": "uuid",
  "mealType": "LUNCH",
  "description": "Chicken salad",
  "carbs": 30,
  "protein": 40,
  "fats": 20,
  "calories": 460,
  "loggedAt": "2026-02-28T13:00:00Z"
}
```

---

### 9.4 Update Meal Log
**PATCH** `/meal-log/{id}`

Update a meal log entry. Calories are auto-recalculated.

**Authentication:** Required  
**Request Body:**
```json
{
  "description": "Updated meal",
  "carbs": 45,
  "protein": 35,
  "fats": 18
}
```

**Response:**
```json
{
  "id": "uuid",
  "mealType": "BREAKFAST",
  "description": "Updated meal",
  "carbs": 45,
  "protein": 35,
  "fats": 18,
  "calories": 482,
  "loggedAt": "2026-02-28T08:00:00Z"
}
```

---

### 9.5 Delete Meal Log
**DELETE** `/meal-log/{id}`

Delete a meal log entry.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Meal log deleted successfully"
}
```

---

## 10. Meal Schedule

### 10.1 Create Meal Schedule
**POST** `/meal-schedule`

Create a meal schedule. Calories are auto-calculated from macros.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `mealType` (enum) - `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`
- `scheduledAt` (datetime) - Scheduled time (ISO 8601)
- `carbs` (number) - Carbohydrates in grams
- `protein` (number) - Protein in grams
- `fats` (number) - Fats in grams

**Response:**
```json
{
  "id": "uuid",
  "mealType": "BREAKFAST",
  "scheduledAt": "2026-02-28T08:00:00Z",
  "carbs": 50,
  "protein": 30,
  "fats": 15,
  "calories": 455,
  "isTaken": false
}
```

---

### 10.2 Mark Meal Schedule as Taken
**PATCH** `/meal-schedule/{id}/taken`

Mark a meal schedule as taken or not taken.

**Authentication:** Required

**Query Parameters:**
- `isTaken` (boolean, required) - Whether the meal was taken

**Response:**
```json
{
  "success": true,
  "message": "Meal schedule updated",
  "schedule": {
    "id": "uuid",
    "isTaken": true,
    "takenAt": "2026-02-28T08:15:00Z"
  }
}
```

---

### 10.3 Get Meal Schedule History
**GET** `/meal-schedule/history`

Get meal schedule history with today's summary.

**Authentication:** Required

**Query Parameters:**
- `limit` (number, optional) - Number of schedules (default: 30)
- `offset` (number, optional) - Skip schedules (default: 0)

**Response:**
```json
{
  "schedules": [
    {
      "id": "uuid",
      "mealType": "BREAKFAST",
      "scheduledAt": "2026-02-28T08:00:00Z",
      "calories": 455,
      "isTaken": true
    }
  ],
  "todaySummary": {
    "totalScheduled": 4,
    "completed": 2,
    "pending": 2,
    "totalCalories": 1850
  },
  "total": 120,
  "limit": 30,
  "offset": 0
}
```

---

### 10.4 Get Latest Meal Schedule
**GET** `/meal-schedule/latest`

Get the most recent meal schedule.

**Authentication:** Required  
**Response:**
```json
{
  "id": "uuid",
  "mealType": "LUNCH",
  "scheduledAt": "2026-02-28T13:00:00Z",
  "calories": 600,
  "isTaken": false
}
```

---

### 10.5 Update Meal Schedule
**PATCH** `/meal-schedule/{id}`

Update a meal schedule. Calories are auto-recalculated.

**Authentication:** Required  
**Request Body:**
```json
{
  "scheduledAt": "2026-02-28T08:30:00Z",
  "carbs": 55,
  "protein": 35,
  "fats": 20
}
```

**Response:**
```json
{
  "id": "uuid",
  "mealType": "BREAKFAST",
  "scheduledAt": "2026-02-28T08:30:00Z",
  "carbs": 55,
  "protein": 35,
  "fats": 20,
  "calories": 540,
  "isTaken": false
}
```

---

### 10.6 Delete Meal Schedule
**DELETE** `/meal-schedule/{id}`

Delete a meal schedule.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Meal schedule deleted successfully"
}
```

---

## 11. Medication

### 11.1 Create Medication
**POST** `/medication`

Create a new medication entry.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `name` (string) - Medication name
- `type` (enum, optional) - `TABLET`, `CAPSULE`, `LIQUID`, `INJECTION`, `OTHER`
- `doseMg` (number, optional) - Dose in mg

**Response:**
```json
{
  "id": "uuid",
  "name": "Aspirin",
  "type": "TABLET",
  "doseMg": 500,
  "createdAt": "2026-02-28T10:00:00Z"
}
```

---

### 11.2 Get Medication History
**GET** `/medication/history`

Get all medications with total count.

**Authentication:** Required  
**Response:**
```json
{
  "medications": [
    {
      "id": "uuid",
      "name": "Aspirin",
      "type": "TABLET",
      "doseMg": 500,
      "createdAt": "2026-02-28T10:00:00Z"
    }
  ],
  "total": 5
}
```

---

### 11.3 Get Medication by ID
**GET** `/medication/{id}`

Get a specific medication.

**Authentication:** Required  
**Response:**
```json
{
  "id": "uuid",
  "name": "Aspirin",
  "type": "TABLET",
  "doseMg": 500,
  "createdAt": "2026-02-28T10:00:00Z"
}
```

---

### 11.4 Update Medication
**PATCH** `/medication/{id}`

Update a medication entry.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `name` (string, optional)
- `type` (enum, optional)
- `doseMg` (number, optional)

**Response:**
```json
{
  "id": "uuid",
  "name": "Updated Aspirin",
  "type": "CAPSULE",
  "doseMg": 250,
  "updatedAt": "2026-02-28T11:00:00Z"
}
```

---

### 11.5 Delete Medication
**DELETE** `/medication/{id}`

Delete a medication.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Medication deleted successfully"
}
```

---

## 12. Medication Schedule

### 12.1 Create Medication Schedule
**POST** `/medication-schedule`

Create a new medication schedule.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `name` (string) - Medication name
- `type` (enum, optional) - `TABLET`, `CAPSULE`, `LIQUID`, `INJECTION`, `OTHER`
- `doseMg` (number, optional) - Dose in mg
- `scheduleTime` (datetime) - Scheduled time (ISO 8601)

**Response:**
```json
{
  "id": "uuid",
  "name": "Aspirin",
  "type": "TABLET",
  "doseMg": 500,
  "scheduleTime": "2026-02-28T08:00:00Z",
  "isTaken": false
}
```

---

### 12.2 Mark Medication Schedule as Taken
**PATCH** `/medication-schedule/{id}/taken`

Mark a medication schedule as taken or not taken.

**Authentication:** Required

**Query Parameters:**
- `isTaken` (boolean, required) - Whether the medication was taken

**Response:**
```json
{
  "success": true,
  "message": "Medication schedule updated",
  "schedule": {
    "id": "uuid",
    "isTaken": true,
    "takenAt": "2026-02-28T08:05:00Z"
  }
}
```

---

### 12.3 Get Medication Schedule History
**GET** `/medication-schedule/history`

Get medication schedule history with total dose logs count.

**Authentication:** Required  
**Response:**
```json
{
  "schedules": [
    {
      "id": "uuid",
      "name": "Aspirin",
      "type": "TABLET",
      "doseMg": 500,
      "scheduleTime": "2026-02-28T08:00:00Z",
      "isTaken": true,
      "takenAt": "2026-02-28T08:05:00Z"
    }
  ],
  "totalDoseLogs": 45
}
```

---

### 12.4 Get Today's Medication Schedules
**GET** `/medication-schedule/today`

Get all medication schedules for today.

**Authentication:** Required  
**Response:**
```json
{
  "schedules": [
    {
      "id": "uuid",
      "name": "Aspirin",
      "scheduleTime": "2026-02-28T08:00:00Z",
      "isTaken": false
    },
    {
      "id": "uuid",
      "name": "Vitamin D",
      "scheduleTime": "2026-02-28T20:00:00Z",
      "isTaken": false
    }
  ],
  "total": 2,
  "completed": 0,
  "pending": 2
}
```

---

### 12.5 Get Medication Schedule by ID
**GET** `/medication-schedule/{id}`

Get a specific medication schedule.

**Authentication:** Required  
**Response:**
```json
{
  "id": "uuid",
  "name": "Aspirin",
  "type": "TABLET",
  "doseMg": 500,
  "scheduleTime": "2026-02-28T08:00:00Z",
  "isTaken": false
}
```

---

### 12.6 Update Medication Schedule
**PATCH** `/medication-schedule/{id}`

Update a medication schedule.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `name` (string, optional)
- `type` (enum, optional)
- `doseMg` (number, optional)
- `scheduleTime` (datetime, optional)

**Response:**
```json
{
  "id": "uuid",
  "name": "Aspirin",
  "type": "TABLET",
  "doseMg": 500,
  "scheduleTime": "2026-02-28T09:00:00Z",
  "isTaken": false
}
```

---

### 12.7 Delete Medication Schedule
**DELETE** `/medication-schedule/{id}`

Delete a medication schedule.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Medication schedule deleted successfully"
}
```

---

## 13. Exercise Log

### 13.1 Create Exercise Log
**POST** `/exercise-log`

Create a new exercise log entry.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `type` (enum) - `CARDIO`, `STRENGTH`, `FLEXIBILITY`, `BALANCE`
- `name` (string) - Exercise name
- `intensity` (enum, optional) - `LOW`, `MEDIUM`, `HIGH`
- `duration` (number, optional) - Duration in minutes
- `note` (string, optional) - Additional notes

**Response:**
```json
{
  "id": "uuid",
  "type": "CARDIO",
  "name": "Running",
  "intensity": "MEDIUM",
  "duration": 30,
  "note": "Morning run",
  "loggedAt": "2026-02-28T07:00:00Z"
}
```

---

### 13.2 Get Exercise Log History
**GET** `/exercise-log/history`

Get exercise log history with total count.

**Authentication:** Required  
**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "type": "CARDIO",
      "name": "Running",
      "intensity": "MEDIUM",
      "duration": 30,
      "loggedAt": "2026-02-28T07:00:00Z"
    }
  ],
  "total": 75
}
```

---

### 13.3 Get Exercise Schedule
**GET** `/exercise-log/schedule`

Get exercise schedule (latest 30 scheduled exercises).

**Authentication:** Required  
**Response:**
```json
{
  "schedules": [
    {
      "id": "uuid",
      "type": "STRENGTH",
      "name": "Weight Training",
      "scheduledAt": "2026-02-28T18:00:00Z",
      "isTaken": false
    }
  ]
}
```

---

### 13.4 Create Exercise Schedule
**POST** `/exercise-log/schedule`

Create a new exercise schedule.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `type` (enum) - `CARDIO`, `STRENGTH`, `FLEXIBILITY`, `BALANCE`
- `name` (string) - Exercise name
- `scheduledAt` (datetime) - Scheduled time (ISO 8601)
- `intensity` (enum, optional) - `LOW`, `MEDIUM`, `HIGH`
- `duration` (number, optional) - Duration in minutes
- `note` (string, optional) - Additional notes

**Response:**
```json
{
  "id": "uuid",
  "type": "STRENGTH",
  "name": "Weight Training",
  "scheduledAt": "2026-02-28T18:00:00Z",
  "intensity": "HIGH",
  "duration": 60,
  "isTaken": false
}
```

---

### 13.5 Get Exercise Log by ID
**GET** `/exercise-log/{id}`

Get a specific exercise log.

**Authentication:** Required  
**Response:**
```json
{
  "id": "uuid",
  "type": "CARDIO",
  "name": "Running",
  "intensity": "MEDIUM",
  "duration": 30,
  "note": "Morning run",
  "loggedAt": "2026-02-28T07:00:00Z"
}
```

---

### 13.6 Update Exercise Log
**PATCH** `/exercise-log/{id}`

Update an exercise log.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `type` (enum, optional)
- `name` (string, optional)
- `intensity` (enum, optional)
- `duration` (number, optional)
- `note` (string, optional)

**Response:**
```json
{
  "id": "uuid",
  "type": "STRENGTH",
  "name": "Push-ups",
  "intensity": "HIGH",
  "duration": 45,
  "note": "Evening workout",
  "loggedAt": "2026-02-28T07:00:00Z"
}
```

---

### 13.7 Delete Exercise Log
**DELETE** `/exercise-log/{id}`

Delete an exercise log.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Exercise log deleted successfully"
}
```

---

### 13.8 Mark Exercise Log as Taken
**PATCH** `/exercise-log/{id}/taken`

Mark an exercise log as taken or not taken.

**Authentication:** Required

**Query Parameters:**
- `isTaken` (boolean, required) - Whether the exercise was completed

**Response:**
```json
{
  "success": true,
  "message": "Exercise log updated",
  "log": {
    "id": "uuid",
    "isTaken": true,
    "takenAt": "2026-02-28T18:30:00Z"
  }
}
```

---

### 13.9 Get Exercise Schedule History
**GET** `/exercise-log/scheduled/history`

Get exercise schedule history with total count.

**Authentication:** Required  
**Response:**
```json
{
  "schedules": [
    {
      "id": "uuid",
      "type": "CARDIO",
      "name": "Running",
      "scheduledAt": "2026-02-27T07:00:00Z",
      "isTaken": true
    }
  ],
  "total": 50
}
```

---

### 13.10 Get Exercise Schedule by ID
**GET** `/exercise-log/scheduled/{id}`

Get a specific exercise schedule.

**Authentication:** Required  
**Response:**
```json
{
  "id": "uuid",
  "type": "STRENGTH",
  "name": "Weight Training",
  "scheduledAt": "2026-02-28T18:00:00Z",
  "intensity": "HIGH",
  "duration": 60,
  "isTaken": false
}
```

---

### 13.11 Update Exercise Schedule
**PATCH** `/exercise-log/scheduled/{id}`

Update an exercise schedule.

**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:** Same as Create Exercise Schedule

**Response:**
```json
{
  "id": "uuid",
  "type": "STRENGTH",
  "name": "Updated Training",
  "scheduledAt": "2026-02-28T19:00:00Z",
  "intensity": "HIGH",
  "duration": 90,
  "isTaken": false
}
```

---

### 13.12 Delete Exercise Schedule
**DELETE** `/exercise-log/scheduled/{id}`

Delete an exercise schedule.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Exercise schedule deleted successfully"
}
```

---

## 14. XP Statistics

### 14.1 Get Today's Total XP
**GET** `/xp-stats/today`

Get total XP earned today.

**Authentication:** Required  
**Response:**
```json
{
  "todayXp": 150,
  "date": "2026-02-28",
  "breakdown": {
    "dailyLogin": 15,
    "exerciseLogs": 50,
    "mealLogs": 40,
    "moodLogs": 20,
    "weightLogs": 25
  }
}
```

---

### 14.2 Get Quest Data from Today's XP
**GET** `/xp-stats/quests`

Get quest completion data based on today's XP activities.

**Authentication:** Required  
**Response:**
```json
{
  "quests": [
    {
      "id": "daily_login",
      "name": "Daily Login",
      "completed": true,
      "xpEarned": 15,
      "maxXp": 15
    },
    {
      "id": "log_3_meals",
      "name": "Log 3 Meals",
      "completed": true,
      "xpEarned": 30,
      "maxXp": 30
    }
  ],
  "totalQuestsCompleted": 2,
  "totalQuestsAvailable": 5
}
```

---

### 14.3 Get This Week's Total XP
**GET** `/xp-stats/weekly`

Get total XP earned this week.

**Authentication:** Required  
**Response:**
```json
{
  "weeklyXp": 850,
  "weekStart": "2026-02-23",
  "weekEnd": "2026-02-29"
}
```

---

### 14.4 Get This Month's Total XP
**GET** `/xp-stats/monthly`

Get total XP earned this month.

**Authentication:** Required  
**Response:**
```json
{
  "monthlyXp": 3200,
  "month": "February",
  "year": 2026
}
```

---

### 14.5 Get XP Summary
**GET** `/xp-stats/summary`

Get combined XP summary for today, week, and month.

**Authentication:** Required  
**Response:**
```json
{
  "today": {
    "xp": 150,
    "date": "2026-02-28"
  },
  "week": {
    "xp": 850,
    "weekStart": "2026-02-23",
    "weekEnd": "2026-02-29"
  },
  "month": {
    "xp": 3200,
    "month": "February",
    "year": 2026
  }
}
```

---

### 14.6 Get All XP Logs
**GET** `/xp-stats/logs`

Get all XP logs with pagination.

**Authentication:** Required

**Query Parameters:**
- `skip` (number, optional) - Number of logs to skip (default: 0)
- `take` (number, optional) - Number of logs to return (default: 50)

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "xpChange": 50,
      "reason": "Exercise log completed",
      "timestamp": "2026-02-28T07:30:00Z"
    }
  ],
  "total": 500,
  "skip": 0,
  "take": 50
}
```

---

### 14.7 Get Weekly Chart Data
**GET** `/xp-stats/chart/weekly`

Get weekly chart data showing daily XP for each day.

**Authentication:** Required  
**Response:**
```json
{
  "chartData": [
    {
      "day": "Monday",
      "date": "2026-02-23",
      "xp": 120
    },
    {
      "day": "Tuesday",
      "date": "2026-02-24",
      "xp": 150
    }
  ],
  "totalWeekXp": 850
}
```

---

### 14.8 Get Monthly Chart Data
**GET** `/xp-stats/chart/monthly`

Get monthly chart data showing weekly XP for each week.

**Authentication:** Required  
**Response:**
```json
{
  "chartData": [
    {
      "week": "Week 1",
      "startDate": "2026-02-01",
      "endDate": "2026-02-07",
      "xp": 750
    }
  ],
  "totalMonthXp": 3200
}
```

---

## 15. File Uploads

### 15.1 Upload Single File
**POST** `/s3/upload`

Upload a single file to S3.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (file) - File to upload (max 10MB)

**Response:**
```json
{
  "status": "success",
  "message": "File uploaded successfully",
  "url": "https://bucket.s3.amazonaws.com/uploads/file.pdf",
  "filename": "document.pdf",
  "mimetype": "application/pdf",
  "size": 1048576
}
```

---

### 15.2 Upload Multiple Files
**POST** `/s3/upload-multiple`

Upload multiple files at once using single file chooser.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `files` (array of files) - Multiple files (max 20 files, 10MB each)

**Response:**
```json
{
  "status": "success",
  "message": "5 file(s) uploaded successfully",
  "files": [
    {
      "url": "https://bucket.s3.amazonaws.com/uploads/file1.pdf",
      "filename": "document1.pdf",
      "mimetype": "application/pdf",
      "size": 1048576
    },
    {
      "url": "https://bucket.s3.amazonaws.com/uploads/file2.jpg",
      "filename": "image.jpg",
      "mimetype": "image/jpeg",
      "size": 524288
    }
  ]
}
```

---

## 16. Payments

### 16.1 RevenueCat Webhook Handler
**POST** `/payment/webhooks/revenuecat`

Handle RevenueCat webhook events for subscription management.

**Headers:**
- `authorization` - Bearer token with webhook secret

**Request Body:** RevenueCat webhook payload

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**Webhook Events Handled:**
- Initial purchase
- Renewal
- Cancellation
- Expiration
- Billing issue

---

### 16.2 Get Subscription Status
**GET** `/payment/subscription`

Get current user's subscription status.

**Authentication:** Required  
**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "status": "active",
    "productId": "premium_monthly",
    "isTrial": false,
    "startDate": "2026-02-01T00:00:00Z",
    "expirationDate": "2026-03-01T00:00:00Z",
    "autoRenew": true
  }
}
```

**Subscription Statuses:**
- `active` - Active subscription
- `cancelled` - Cancelled but still valid until expiration
- `expired` - Subscription expired
- `billing_issue` - Payment failed

---

### 16.3 Get Subscription History
**GET** `/payment/history`

Get user's subscription history.

**Authentication:** Required  
**Response:**
```json
{
  "history": [
    {
      "id": "uuid",
      "event": "subscription_started",
      "productId": "premium_monthly",
      "timestamp": "2026-02-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "event": "subscription_renewed",
      "productId": "premium_monthly",
      "timestamp": "2026-02-28T00:00:00Z"
    }
  ],
  "total": 2
}
```

---

### 16.4 Update Subscription Manually (Test Only)
**PATCH** `/payment/subscription`

Manually update subscription status for testing purposes. Admin only.

**Authentication:** Required (Admin)  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `status` (enum) - `active`, `cancelled`, `expired`, `billing_issue`
- `productId` (enum, optional) - `premium_monthly`, `premium_yearly`
- `isTrial` (string, optional) - `true` or `false`
- `expirationDate` (datetime, optional) - Expiration date

**Response:**
```json
{
  "success": true,
  "message": "Subscription updated",
  "subscription": {
    "status": "active",
    "productId": "premium_monthly",
    "isTrial": false,
    "expirationDate": "2026-03-28T00:00:00Z"
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Resource already exists",
  "error": "Username already taken"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "An unexpected error occurred"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Auth endpoints:** 5 requests per minute per IP
- **Other endpoints:** 100 requests per minute per user

Rate limit headers:
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Time when limit resets

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit` or `take` - Number of items per page
- `offset` or `skip` - Number of items to skip

**Response includes:**
- `data` - Array of items
- `total` - Total count
- `limit` - Items per page
- `offset` - Items skipped

---

## Date/Time Format

All date/time values use ISO 8601 format:
- `2026-02-28T10:30:00Z` (UTC timezone)
- `2026-02-28T10:30:00+06:00` (With timezone offset)

---

## File Upload Limits

- **Single file:** 10MB max
- **Multiple files:** 20 files max, 10MB each
- **Supported formats:** All common file types
- **Storage:** AWS S3

---

## Environment-Specific Behavior

### Development
- Cookies: `httpOnly: false` (accessible to JavaScript for Swagger)
- CORS: Permissive
- Detailed error messages

### Production
- Cookies: `httpOnly: true`, `secure: true`
- CORS: Restricted to allowed origins
- Generic error messages

---

## Swagger/OpenAPI Documentation

Interactive API documentation is available at:
- Development: `http://localhost:3000/api/docs`
- Production: `https://api.example.com/api/docs`

**Features:**
- Test endpoints directly
- Auto token refresh support
- Cookie-based authentication
- Request/response examples

---

## Support & Contact

For API support or questions:
- Email: support@velvetiron.com
- Documentation: https://docs.velvetiron.com
- Status Page: https://status.velvetiron.com

---

**Document Version:** 1.0  
**Last Updated:** February 28, 2026  
**API Version:** v1
