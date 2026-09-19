# Velvet & Iron Backend - Frontend Integration & Client Applications

**Document ID:** `13-frontend.md`  
**Target Audience:** Mobile Developers (Flutter), Frontend Engineers, Full-Stack Developers  

---

## 1. Overview of Client Interfaces

While this repository is primarily a backend API service, it interfaces with three distinct frontend applications and consumer layers:

1. **Flutter Mobile Application:** The primary consumer application for iOS and Android. Communicates via REST and handles OAuth deep links.
2. **Static Social Login Test Application:** An embedded single-page HTML/JS application located at `src/auth/socialLogin.html`, statically served at `/auth/socialLogin.html`.
3. **Swagger UI OpenAPI Explorer:** An interactive developer portal mounted at `/api-docs`.

---

## 2. Flutter Mobile Application Integration

### 2.1 Deep Linking Configuration
* **Environment Variable:** `FLUTTER_DEEP_LINK_URL` (defaults to `velvetapp://auth/discordapp`).
* **OAuth Redirection Flow:**
  1. Mobile app launches system browser pointing to `https://<api-domain>/auth/discord`.
  2. After authentication and user profile resolution, the backend constructs the deep link:
     ```text
     velvetapp://auth/discordapp?access_token=<JWT>&refresh_token=<JWT>&user=<URL_ENCODED_JSON>
     ```
  3. In case of failure:
     ```text
     velvetapp://auth/discordapp?error=discord_auth_failed
     ```
* **Required Mobile App Schema Configuration (`AndroidManifest.xml` / `Info.plist`):**
  * Custom scheme: `velvetapp`
  * Host: `auth`
  * Path: `/discordapp`

### 2.2 Token Management Protocol for Mobile
Mobile HTTP interceptors must implement the following token handling lifecycle:
1. **Initial Storage:** Store `access_token` and `refresh_token` in secure device storage (e.g. Flutter Secure Storage / Keychain / Keystore).
2. **Outbound Headers:** Attach both headers to every protected request:
   ```http
   Authorization: Bearer <access_token>
   X-Refresh-Token: <refresh_token>
   ```
3. **Inbound Header Interception:** Listen for automatic rotation headers on every HTTP response:
   ```http
   X-New-Access-Token: <new_jwt>
   X-New-Refresh-Token: <new_jwt>
   ```
   If either header is present, immediately overwrite the stored tokens in secure device storage.
4. **Logout Protocol:** Clear local storage and call `DELETE /auth/logout`.

---

## 3. Static Test Client (`src/auth/socialLogin.html`)

* **Purpose:** A standalone developer test client built directly into the backend for verifying Google, Apple, and Discord authentication flows in a desktop web browser.
* **Serving Mechanism:** Configured in `src/main.ts`:
  ```typescript
  app.useStaticAssets(join(__dirname, 'auth'), { prefix: '/auth' });
  ```
* **URL:** `http://localhost:3200/auth/socialLogin.html`
* **Features:**
  * Embeds Firebase Web SDK 10.7.1.
  * Direct Google Sign-In popup: prompts user, captures Firebase ID token, posts token to `POST /auth/firebase-login`, and displays returned JWTs.
  * Discord OAuth button: navigates to `/auth/discord`.
  * Status display card with token inspector and cookie status indicators.

---

## 4. Swagger UI & The Missing `swagger-helper.js`

* **Endpoint:** `http://localhost:3200/api-docs`
* **Configuration:** Configured in `src/main.ts` with `persistAuthorization: true` and `withCredentials: true`.
* **Custom Script Reference:**
  ```typescript
  SwaggerModule.setup('api-docs', app, documentFactory, {
    customJs: '/swagger-helper.js',
  });
  ```
* **The Missing Asset Problem:**
  `main.ts` attempts to mount `../public` statically:
  ```typescript
  app.useStaticAssets(join(__dirname, '..', 'public'));
  ```
  Because `public/` was deleted during supply-chain malware cleanup, `/swagger-helper.js` returns a `404 Not Found`. While Swagger UI still renders, any custom token-saving logic previously performed by `swagger-helper.js` is inactive.
* **Restoration Requirement:** Create `public/swagger-helper.js` with an interceptor to automatically populate the Swagger `Authorize` modal from login responses.

---

## 5. Client Request & Response Contract Conventions

### 5.1 Form-Data vs JSON
Most health-tracking endpoints (`/meal-log`, `/exercise-log`, `/mood-log`, `/medication-schedule`) utilize `AnyFilesInterceptor()`. This allows mobile clients to submit data as **either** `application/json` **or** `multipart/form-data` with identical backend handling.

### 5.2 Standard Error Response Envelope
Every non-2xx response from the backend is formatted by `AllExceptionFilter` into a uniform JSON structure:
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-03-01T12:00:00.000Z",
  "path": "/meal-log",
  "message": "Carbs must be a number"
}
```
If validation errors occur, `message` will contain an array of string error descriptions from `class-validator`.

