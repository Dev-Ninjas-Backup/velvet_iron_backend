# Velvet & Iron Backend - Testing Architecture & Coverage Analysis

**Document ID:** `21-testing.md`  
**Target Audience:** QA Engineers, Backend Developers, Technical Leads  

---

## 1. Current Testing Architecture State

### Overall Coverage Assessment: **CRITICALLY LOW (< 2%)**

The repository currently contains **only 2 boilerplate test files**, both inherited from the default NestJS starter template:

1. `src/app.controller.spec.ts` (Unit Test)
2. `test/app.e2e-spec.ts` (E2E Integration Test)

**There are ZERO unit tests, integration tests, or end-to-end tests for any domain feature:**
* ❌ No tests for Authentication, OTP generation, or password resets.
* ❌ No tests for the Dual-Token rotation logic (`OptionalJwtGuard`).
* ❌ No tests for the XP calculation formula (`(xp - 400) / 150 + 1`).
* ❌ No tests for Level Titles (Tier 1–6).
* ❌ No tests for Meal calorie derivation (`4*carbs + 4*protein + 9*fat`).
* ❌ No tests for Daily Quest checklist aggregation.
* ❌ No tests for RevenueCat webhook processing.
* ❌ No tests for S3 file uploads or MIME validation.

---

## 2. Test Files Deep Dive

### 2.1 Unit Test: `src/app.controller.spec.ts`
```typescript
describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    }); 
  });
});
```
* **Scope:** Tests that `AppController.getHello()` returns `'Hello World!'`.
* **Dependencies:** Only `AppService`. Does not touch database or authentication.

### 2.2 End-to-End Test: `test/app.e2e-spec.ts`
```typescript
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
```
* **Scope:** Bootstraps the full `AppModule` and fires an HTTP GET to `/`.
* **Important Caveat:** Because `AppModule` connects to PostgreSQL on `OnModuleInit`, running this E2E test **requires an active PostgreSQL database** with valid credentials in `.env`, or it will crash.

---

## 3. The CI Pipeline Testing Anomaly

> [!WARNING]
> **CI Pipeline Anomaly in `.github/workflows/ci.yml`**  
> In `.github/workflows/ci.yml`, the `test` job contains the following step:
> ```yaml
> - name: Run tests
>   run: pnpm format
> ```
> **The CI pipeline does NOT run Jest or any automated tests.** It runs `prettier --write` (formatting), and then immediately runs `pnpm build`. Automated tests are completely skipped in CI!

---

## 4. Manual API Test Suites (`*.http` Files)

In lieu of automated unit tests, the previous developer created VS Code REST Client test files:

1. **`test-auth.http` (3,357 bytes):**  
   Contains HTTP request definitions for all 18 core auth endpoints (register, verify OTP, login, forgot password, reset password, update profile, sessions).
2. **`test-token-refresh.http` (1,553 bytes):**  
   Step-by-step test script for validating the 4 token states in `OptionalJwtGuard` against `http://localhost:3000/auth/me`.
3. **`test-google-auth.http` (626 bytes):**  
   Sample payload testing `POST /auth/firebase-login` with a Firebase ID token.

---

## 5. How to Run Existing Tests

### Run Unit Tests
```bash
pnpm test
```
Runs Jest on all files matching `.*\.spec\.ts$`.

### Run Unit Tests in Watch Mode
```bash
pnpm test:watch
```

### Run E2E Tests
Ensure your local PostgreSQL instance is running, then execute:
```bash
pnpm test:e2e
```

### Generate Test Coverage
```bash
pnpm test:cov
```

---

## 6. Recommended QA Implementation Plan

1. **Priority 1: Core Calculation Unit Tests (Zero External Dependencies)**
   * `src/leveladd/levelCalculator.spec.ts`: Test `calculateLevel()` across boundary values (0, 399, 400, 549, 550, 7750, 10000).
   * `src/leveladd/levelStatus.spec.ts`: Test that levels 1 to 50 map to expected titles.
   * `src/meal-log/meal-log.service.spec.ts`: Test `calculateCalories(carbs, protein, fats)`.
2. **Priority 2: Security & Guard Unit Tests**
   * Mock `JwtService` and `ConfigService` to test the 4 scenarios of `OptionalJwtGuard`.
   * Test `RoleGuard` role hierarchy and rejections.
3. **Priority 3: Service Integration Tests with In-Memory PostgreSQL**
   * Test `AuthService.Register` and duplicate prevention.
   * Test `OnboardingService.unlockThemeOnboarding` logic gate.
4. **Fix GitHub Actions Workflow:** Update `ci.yml` step from `pnpm format` to `pnpm test`.

