# Authentication System Security Audit Report

**Date:** September 27, 2026  
**Scope:** `src/auth`, `src/common/guards`, `src/common/decorators`, `prisma/schema`, JWT Strategy, Token Lifecycle.

---

## 1. Executive Summary

An in-depth technical audit of the authentication module reveals **critical security vulnerabilities**. While the system implements standard modern practices in theory (JWT access/refresh pairs, Social Logins, OTPs, Guards), the actual code implementation suffers from fundamental execution flaws.

The most critical issues allow for trivial token theft (XSS), infinite token lifespans (miscalculated expiry strings), broken session revocation (stateless refresh tokens), and predictable OAuth password generation. **Immediate remediation is required before this application can be considered secure for production use.**

---

## 2. Architecture Overview

The system uses a mixed-strategy authentication approach:
* **Primary Auth:** JWT (JSON Web Tokens) with short-lived Access Tokens and long-lived Refresh Tokens.
* **Strategies:** Local (Email/Username + Password), Firebase OAuth, Discord OAuth.
* **Token Transport:** Tokens are returned in HTTP headers (`X-Access-Token`) and set as cookies.
* **Guard Logic:** A custom `OptionalJwtGuard` universally intercepts requests, implicitly acting as a transparent token refresh mechanism.

---

## 3. Critical Vulnerabilities (Immediate Fix Required)

### 3.1. XSS Vulnerability: Tokens exposed via `httpOnly: false`
**Location:** `src/auth/auth.controller.ts` (`login` method) & `src/common/optional-auth.guard.ts`
**Description:** When generating and setting cookies, the code explicitly hardcodes `httpOnly: false`. While a comment claims this is to "Allow JavaScript access in dev for Swagger", there is no environment check guarding this flag.
**Impact:** Any Cross-Site Scripting (XSS) vulnerability on the frontend will allow an attacker to trivially steal the `access_token` and `refresh_token` via `document.cookie`.
**Fix:** 
```typescript
httpOnly: true, // MUST be true in all environments
```

### 3.2. Broken Expiry Math: Access Tokens Live for 15 Days, not 15 Minutes
**Location:** `src/auth/auth.service.ts` (`generateTokens` method)
**Description:** The default access token expiration logic is fundamentally flawed:
```typescript
const accessTokenExpiration = Number(this.configService.get('ACCESS_TOKEN_EXPIRATION_MS')) / 86400000 || 15; // 15 minutes?
...
expiresIn: `${accessTokenExpiration}d`
```
Because of the `|| 15` fallback combined with the `d` (days) suffix, if the env variable is missing or misconfigured, **the access token expires in 15 days, not 15 minutes**. (Similarly, the refresh token expires in 7 days). This inverses the entire security model of short-lived access tokens.
**Fix:** Define environment variables purely in seconds or strictly use standard JWT strings (e.g., `'15m'`, `'7d'`) without division math.

### 3.3. Broken Token Revocation: Ghost Sessions & Stateless Refresh Tokens
**Location:** `src/auth/auth.service.ts` (`generateTokens` & `logout`)
**Description:** The Prisma database schema explicitly contains `Session` and `RefreshToken` tables to track active logins. However, `generateTokens` **never creates these database records**. It merely returns signed JWTs. 
When a user calls the `/logout` endpoint, the system runs:
```typescript
await this.Prisma.client.session.deleteMany({ where: { userId } });
```
This query executes successfully but deletes `0` rows. 
**Impact:** **Server-side token revocation does not exist.** If an attacker steals a refresh token, logging out does absolutely nothing to stop them. The token remains cryptographically valid until its expiration date.
**Fix:** `generateTokens` MUST save the `refreshToken` hash and user metadata into the `Session` or `RefreshToken` database tables. The `OptionalJwtGuard` must verify the token's existence in the database before accepting it.

### 3.4. Predictable Cryptography: Social Login Hijacking
**Location:** `src/common/password-generator.ts` (`generateStrongPassword`)
**Description:** When users log in via Firebase or Discord, the system creates an account for them and assigns an auto-generated password using `Math.random()`.
`Math.random()` is **not cryptographically secure**. It is heavily predictable.
**Impact:** If an attacker knows approximately when a user used social login, they could theoretically predict the output of `Math.random()` and derive the user's generated password, allowing them to bypass OAuth and log in directly using the local email/password strategy.
**Fix:** Replace all instances of `Math.random()` in `password-generator.ts` with `crypto.randomInt` or `crypto.randomBytes`.

### 3.5. Security Bypass: The "Silent Refresh" Guard Surface Area
**Location:** `src/common/optional-auth.guard.ts`
**Description:** The custom guard intercepts every request. If it detects an invalid/missing access token but a valid refresh token, it silently generates a brand new access and refresh token pair, injects them into the response headers/cookies, and authorizes the request.
**Impact:** There is no dedicated `/refresh-token` endpoint (it is commented out in the controller). Every single protected API route is secretly a refresh endpoint. This drastically increases the attack surface. An attacker with a stolen refresh token doesn't need to spoof a refresh lifecycle—they can just blindly hit any endpoint and the server will gracefully hand them fresh tokens.
**Fix:** Remove token regeneration logic from the Guard. Guards should strictly Validate/Reject. Token regeneration must ONLY happen at a dedicated `POST /auth/refresh` endpoint.

---

## 4. Medium & Low Vulnerabilities

### 4.1. Hardcoded Fallback JWT Secret
**Location:** `src/lib/strategy/jwt.ts` and `src/auth/auth.module.ts`
**Description:** If `JWT_SECRET` is missing from the environment, the system gracefully falls back to `'secretKey'`. 
**Impact:** If this app is deployed without the env var, anyone who knows NestJS defaults can forge an admin token instantly.
**Fix:** The application should crash (`throw new Error`) on startup if `JWT_SECRET` is missing in production.

### 4.2. OTP Brute-Forcing Risk
**Location:** `src/auth/auth.service.ts`
**Description:** Email verification and password resets rely on OTPs valid for 10 minutes. There is no rate-limiting or attempt-tracking on the validation endpoints.
**Impact:** An attacker could brute-force the OTP within the 10-minute window.
**Fix:** Implement `@nestjs/throttler` or track `failedAttempts` in the User model.

---

## 5. Remediation Plan / Next Steps

To secure the backend, I recommend executing the following steps in order:
1. **Fix Cookies:** Set `httpOnly: true` globally for all token cookies immediately.
2. **Fix Expiration Math:** Refactor `ACCESS_TOKEN_EXPIRATION` handling to safely generate `"15m"` instead of `"15d"`.
3. **Isolate Refresh Logic:** Re-enable the `POST /refresh-token` controller endpoint, and strip the automatic token regeneration logic entirely out of `OptionalJwtGuard`.
4. **Implement Stateful Sessions:** Update `generateTokens` to save a `Session` record, and ensure `logout` properly deletes that specific session record.
5. **Upgrade Crypto:** Refactor `generateStrongPassword` to use Node's native `crypto` module.
