# Medication & Medication Schedule API Documentation

## Overview

Complete API implementation for managing medications and medication schedules with dose history logs and count endpoints.

## Medication APIs

### Base URL: `/medication`

### 1. Create Medication

**POST** `/medication`

```json
{
  "name": "Aspirin",
  "type": "TABLET",
  "doseMg": 500
}
```

**Response:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Aspirin",
  "type": "TABLET",
  "doseMg": 500,
  "createdAt": "2026-02-15T00:00:00.000Z"
}
```

### 2. Get Medication History (with Total Count)

**GET** `/medication/history`

**Response:**

```json
{
  "totalCount": 5,
  "medications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Aspirin",
      "type": "TABLET",
      "doseMg": 500,
      "createdAt": "2026-02-15T00:00:00.000Z"
    }
  ]
}
```

### 3. Get Medication by ID

**GET** `/medication/:id`

**Response:** Single medication object

### 4. Update Medication

**PATCH** `/medication/:id`

```json
{
  "name": "Ibuprofen",
  "type": "CAPSULE",
  "doseMg": 400
}
```

### 5. Delete Medication

**DELETE** `/medication/:id`

**Response:**

```json
{
  "message": "Medication deleted successfully"
}
```

---

## Medication Schedule APIs

### Base URL: `/medication-schedule`

### 1. Create Medication Schedule

**POST** `/medication-schedule`

```json
{
  "name": "Aspirin",
  "type": "TABLET",
  "doseMg": 500,
  "scheduleTime": "2026-02-15T08:00:00Z"
}
```

**Response:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Aspirin",
  "type": "TABLET",
  "doseMg": 500,
  "scheduleTime": "2026-02-15T08:00:00.000Z"
}
```

### 2. Get Dose History Logs (with Total Count)

**GET** `/medication-schedule/history`

**Response:**

```json
{
  "totalCount": 10,
  "schedules": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Aspirin",
      "type": "TABLET",
      "doseMg": 500,
      "scheduleTime": "2026-02-15T08:00:00.000Z"
    }
  ]
}
```

### 3. Get Today's Schedules (with Count)

**GET** `/medication-schedule/today`

**Response:**

```json
{
  "totalToday": 3,
  "schedules": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Aspirin",
      "type": "TABLET",
      "doseMg": 500,
      "scheduleTime": "2026-02-15T08:00:00.000Z"
    }
  ]
}
```

### 4. Get Schedule by ID

**GET** `/medication-schedule/:id`

**Response:** Single schedule object

### 5. Update Medication Schedule

**PATCH** `/medication-schedule/:id`

```json
{
  "name": "Ibuprofen",
  "type": "CAPSULE",
  "doseMg": 400,
  "scheduleTime": "2026-02-15T09:00:00Z"
}
```

### 6. Delete Medication Schedule

**DELETE** `/medication-schedule/:id`

**Response:**

```json
{
  "message": "Medication schedule deleted successfully"
}
```

---

## Enums

### MedicationType

- `CAPSULE`
- `INJECTION`
- `LIQUID`
- `TABLET`

---

## Key Features Implemented

✅ **Medication Management**

- Create, Read, Update, Delete medications
- Get medication history
- Total medications count

✅ **Medication Schedule Management**

- Create, Read, Update, Delete schedules
- Get dose history logs (all schedules)
- Get today's schedules with count
- Total schedule logs count

✅ **Security**

- All endpoints protected with JWT authentication
- User-specific data isolation
- Bearer token authentication required

✅ **Validation**

- Input validation using class-validator
- Type checking with TypeScript
- Swagger API documentation

---

## Next Steps to Test

1. **Start the server:**

   ```bash
   npm run start:dev
   ```

2. **Access Swagger Documentation:**
   Open: `http://localhost:3000/api`

3. **Authenticate:**
   - Login to get JWT token
   - Click "Authorize" in Swagger
   - Enter token as: `Bearer <your-token>`

4. **Test Endpoints:**
   - Create medications
   - Create medication schedules
   - View history with counts
   - View today's schedules

---

## Database Models

### Medication Table (`medications`)

- id: String (UUID)
- userId: String
- name: String
- type: MedicationType (optional)
- doseMg: Int (optional)
- createdAt: DateTime

### MedicationSchedule Table (`medication_schedules`)

- id: String (UUID)
- userId: String
- name: String
- type: MedicationType (optional)
- doseMg: Int (optional)
- scheduleTime: DateTime

---

## Notes

- Both APIs follow the same patterns as existing modules (weight-log, mood-log)
- All responses are properly typed with DTOs
- Authentication guards are applied to all endpoints
- Prisma ORM is used for database operations
- Proper error handling with NotFoundException for missing records
