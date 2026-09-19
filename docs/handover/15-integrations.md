# Velvet & Iron Backend - External Third-Party Integrations

**Document ID:** `15-integrations.md`  
**Target Audience:** DevOps Engineers, Backend Engineers, Security Architects  

---

## 1. Master Integrations Summary

| Integration | Vendor / Service | SDK / Library Used | Authentication Method | Code Location |
| :--- | :--- | :--- | :--- | :--- |
| **Asset Storage** | Amazon Web Services (S3) | `aws-sdk` (v2, `^2.1693.0`) | IAM Access Key + Secret | `src/aws/aws.service.ts` |
| **Social Auth** | Google / Apple / Firebase | `firebase-admin` (`^13.6.0`) | RSA Private Key Service Account | `src/auth/services/firebase-auth.service.ts` |
| **Community Auth** | Discord Developer Portal | `passport-discord` (`^0.1.4`) | OAuth2 Client Secret | `src/lib/strategy/discord.strategy.ts` |
| **Subscriptions** | RevenueCat | Native HTTP Webhook Parser | Shared Bearer Secret | `src/payment/payment.service.ts` |
| **Email Delivery** | Google Workspace / Gmail | `nodemailer` (`^7.0.12`) | SMTP App Password | `src/email/email.service.ts` |

---

## 2. Deep Dive: AWS S3 Storage

* **Purpose:** Uploading and serving user profile photos, avatars, and attachments.
* **Environment Variables:**
  * `AWS_ACCESS_KEY_ID`: IAM user identifier.
  * `AWS_SECRET_ACCESS_KEY`: IAM secret key.
  * `AWS_BUCKET_REGION`: Region code read in code (`eu-north-1`).
  * `AWS_S3_BUCKET_NAME`: Target bucket (`shamimrana2006`).
* **Object Path Conventions:**
  * User profile photos: `profiles/${userId}/avatar-${Date.now()}`
  * Generic uploads: `uploads/${file.originalname}-${Date.now()}`
* **Storage Mode:** `ContentDisposition: 'inline'`, publicly accessible URL returned (`uploadResult.Location`).
* **Error Handling:** Throws `BadRequestException` if file is missing or file type is not an image (for avatars). Network errors throw directly to `AllExceptionFilter`.
* **Discrepancies / Risks:** Legacy v2 SDK used; `AWS_REGION` in `.env.example` vs `AWS_BUCKET_REGION` in code; unauthenticated upload routes in `S3Controller`.

---

## 3. Deep Dive: Firebase Admin Authentication

* **Purpose:** Allows mobile clients to sign in using Google, Apple, Facebook, or GitHub via native client SDKs, then send the Firebase ID token to the backend for verification.
* **Environment Variables:**
  * `FIREBASE_PROJECT_ID`
  * `FIREBASE_PRIVATE_KEY` (formatted with `\n` line breaks)
  * `FIREBASE_CLIENT_EMAIL`
* **Initialization Paradigm:**
  * Lazy initialization inside `FirebaseAuthService.initializeFirebase()`.
  * If environment variables are missing, Firebase authentication is disabled without crashing the server.
* **Verification Logic:**
  * `admin.auth(this.firebaseApp).verifyIdToken(token)` verifies Google's cryptographic RSA signatures.
  * Maps decoded claims (`uid`, `email`, `name`, `picture`, `email_verified`).
* **Database Impact:** Creates new user or links `googleId` on existing user.

---

## 4. Deep Dive: Discord OAuth2

* **Purpose:** Discord social login popular in gaming communities, tailored for fantasy RPG users.
* **Environment Variables:**
  * `DISCORD_CLIENT_ID`
  * `DISCORD_CLIENT_SECRET`
  * `DISCORD_CALLBACK_URL`
  * `FLUTTER_DEEP_LINK_URL` (`velvetapp://auth/discordapp`)
* **Request Flow:**
  1. Frontend initiates `GET /auth/discord`.
  2. Passport redirects to `https://discord.com/api/oauth2/authorize`.
  3. Discord redirects back to `GET /auth/discord/callback` with authorization code.
  4. Backend exchanges code for Discord profile.
  5. Account linked or created.
  6. Backend issues 302 redirect to `FLUTTER_DEEP_LINK_URL` with auth tokens in query params.

---

## 5. Deep Dive: RevenueCat Webhook Subscriptions

* **Purpose:** In-app purchase management across iOS App Store and Android Google Play Store.
* **Environment Variables:**
  * `REVENUECAT_WEBHOOK_SECRET`
* **Webhook Endpoint:** `POST /payment/webhooks/revenuecat`
* **Authentication:**
  * Inspects `Authorization: Bearer <secret>`.
  * If secret is set in `.env` and header fails to match, rejects with `401 Unauthorized`.
* **Event Handlers:**
  * `INITIAL_PURCHASE`, `RENEWAL`, `UNCANCELLATION` $\to$ status: `'active'`.
  * `CANCELLATION` $\to$ status: `'cancelled'`.
  * `EXPIRATION` $\to$ status: `'expired'`.
  * `BILLING_ISSUE` $\to$ status: `'billing_issue'`.
* **Database Impact:** Upserts record in `Subscription` table, writes immutable payload to `SubscriptionEvent` table.

---

## 6. Deep Dive: Nodemailer SMTP Relay

* **Purpose:** Transactional email delivery for email verification OTPs, password reset codes, and credentials.
* **Environment Variables:**
  * `MAIL_HOST` (e.g. `smtp.gmail.com`)
  * `MAIL_PORT` (`587`)
  * `MAIL_USER`
  * `MAIL_PASSWORD` (Google App Password)
  * `MAIL_FROM_NAME`
  * `MAIL_FROM`
* **Transport Configuration:** Synchronous SMTP relay using `@nestjs-modules/mailer`.
* **Security Consideration:** Blocking synchronous calls during request cycles; cleartext passwords sent for OAuth users.

