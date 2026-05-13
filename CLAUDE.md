# SCCRM MVP Handoff

## Project purpose

This repository is an early-stage Expo React Native mobile app for a pharmacy-oriented CRM / loyalty MVP. It currently contains only the frontend client. The app supports two conceptual flows:

- Staff flow: authenticate a staff device, search/create customers, add points, redeem points.
- Customer flow: log in, sign up, view points, view transaction history, update profile, and initiate social auth.

The repo is not production-ready. It is a thin mobile client that assumes an existing backend API and database outside this repository.

## Current architecture

- Runtime: Expo SDK 54 + React Native 0.81 + React 19
- Language: TypeScript
- Package manager: npm (`package-lock.json` present)
- Entry point: [index.ts](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/index.ts)
- Main application surface: [App.tsx](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/App.tsx)
- Config/env loader: [src/config.ts](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/src/config.ts)
- Generic API client: [src/lib/api.ts](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/src/lib/api.ts)
- OAuth helpers: [src/lib/auth.ts](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/src/lib/auth.ts)
- Shared frontend types: [src/types.ts](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/src/types.ts)

Important reality: almost all business logic and UI state currently live in one large file, `App.tsx`. There is no component split yet, no router, no state library, and no test suite.

## Folder structure

```text
SCCRMMVP/
  .github/workflows/eas-build.yml   CI/CD build workflow for EAS Android builds
  assets/                           Expo icons and splash assets
  App.tsx                           Main app UI and state logic
  app.json                          Expo app config
  eas.json                          EAS build profiles
  index.ts                          Expo root registration
  package.json                      npm scripts and dependencies
  src/
    config.ts                       Environment variable wiring
    lib/
      api.ts                        fetch wrapper + JWT payload decode
      auth.ts                       LINE and Google browser auth helpers
    types.ts                        Customer / points / session data types
    types/base-64.d.ts              Type support for base-64 package
```

## How to run locally

Prerequisites:

- Node.js 20 is the intended CI version.
- npm
- Expo-compatible Android emulator or Expo Go on a real device
- Android Studio if using an emulator

Install:

```powershell
npm install
```

Start dev server:

```powershell
npm start
```

Run on Android:

```powershell
npm run android
```

Run on web:

```powershell
npm run web
```

Notes:

- This project currently uses Expo Go / Expo dev flow, not a checked-in native `android/` project.
- If port `8081` is already occupied by an existing Expo server for this repo, reuse it instead of blindly starting another copy.
- Android Studio's normal JVM "Application" run configuration is not the right way to run this repo.

## How to build

Local build tooling is not wired beyond Expo/EAS config.

Configured remote build path:

- CI workflow: [eas-build.yml](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/.github/workflows/eas-build.yml)
- EAS config: [eas.json](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/eas.json)

Build profiles:

- `preview`: Android APK, internal distribution
- `production`: Android app bundle

Expected CI path:

```powershell
npm ci
eas build --platform android --profile preview
eas build --platform android --profile production
```

## How to test

There is no formal automated test suite yet.

Current useful verification commands:

```powershell
npx tsc --noEmit
```

Manual QA currently matters more than anything else:

- Launch in Expo Go on Android emulator
- Exercise login / signup / points / profile screens
- Verify behavior with and without API env vars configured
- Verify social auth only on a real device when possible

## Backend / API overview

There is no backend code in this repo. The frontend assumes a shared backend reachable at `EXPO_PUBLIC_API_BASE_URL`.

Observed API contract from `App.tsx`:

### Auth

- `POST /api/sccrm/auth/refresh`
  - body: `{ refreshToken }`
  - returns new access + refresh tokens

- `POST /api/sccrm/auth/staff-device`
  - body: `{ deviceId, deviceName, pin }`
  - returns staff token

- `POST /api/sccrm/auth/login`
  - body: `{ email, password, deviceLabel }`
  - returns customer session

- `POST /api/sccrm/auth/register`
  - multi-step endpoint used for:
  - `step: "send-otp"`
  - `step: "complete-email-signup"`
  - `step: "complete-social-signup"`

- `POST /api/sccrm/auth/line-callback`
- `POST /api/sccrm/auth/google-callback`
  - body: `{ code, deviceLabel }`
  - may return either:
    - full session, or
    - onboarding-required payload with `onboardingToken`

### Customers

- `GET /api/sccrm/customers/:id`
- `GET /api/sccrm/customers/search?phone=...`
- `POST /api/sccrm/customers`
- `PATCH /api/sccrm/customers/:id`

### Points

- `GET /api/sccrm/points/:customerId/balance`
- `GET /api/sccrm/points/:customerId/history`
- `POST /api/sccrm/points/earn`
- `POST /api/sccrm/points/redeem`

## Database overview

No database schema exists in this repository.

Inferred backend entities from the frontend contract:

- `customers`
  - `id`
  - `phone`
  - `full_name`
  - `email`
  - `tier`
  - `is_active`

- point transaction / history records
  - `amount`
  - `type`
  - `reference_id`
  - `note`
  - `created_by`
  - `created_at`

- purchase / POS-linked transactions
  - `total_amount`
  - `point_earned`
  - `source`
  - `pos_ref_id`
  - `created_at`

- staff device auth records
  - `deviceId`
  - `deviceName`
  - `pin`

Treat all DB assumptions as inferred, not authoritative.

## Auth / session model

Customer auth:

- Login returns `accessToken` + `refreshToken`.
- `refreshToken` is stored in Expo SecureStore under `sccrm_customer_refresh_token`.
- On app boot, `restoreLocalSessions()` attempts refresh if `EXPO_PUBLIC_API_BASE_URL` is configured.
- Access token JWT payload is decoded client-side to extract `customerId`.

Staff auth:

- Staff flow uses a device bootstrap endpoint and stores a staff token in SecureStore under `sccrm_staff_token`.
- A locally generated staff device id is stored under `sccrm_staff_device_id`.

Social auth:

- Google and LINE both use Expo browser auth helpers with PKCE-like challenge generation.
- Redirect URI is `EXPO_PUBLIC_AUTH_REDIRECT_URI` or default `sccrm://oauth`.

Current preview fallback:

- `App.tsx` currently contains a hardcoded demo preview path that allows the customer flow to be inspected when `EXPO_PUBLIC_API_BASE_URL` is missing.
- This is for local preview only and should not survive into production work.

## Important business logic

Customer side:

- Login page now prioritizes email/password above LINE and Google.
- Signup UI is hidden behind an explicit `Open Signup` action.
- Customer screens include:
  - points summary
  - transaction history
  - profile edit

Staff side:

- Staff device auth precedes customer operations.
- Staff can search by phone, create customer, add points, and redeem points.

Points:

- Earn points logic assumes `1 point per 10 THB`.
- Tier progress UI assumes thresholds:
  - bronze: first 1000 lifetime points
  - silver: next 4000 lifetime points
  - gold: capped at full progress

## Current work status

The app is in MVP/prototype state.

What exists:

- Expo shell app configured
- Single-screen-file implementation for auth, points, staff, profile
- SecureStore session persistence
- API contract assumptions for auth/customers/points
- EAS build workflow for Android

What is incomplete:

- No backend in repo
- No real env configured by default
- No automated tests
- No componentization
- No navigation library
- No production auth hardening visible from frontend
- No role/authorization model yet
- Redeem flow on customer side is placeholder only

## Known issues, risks, and fragile areas

1. `App.tsx` is oversized and mixes presentation, API orchestration, local demo behavior, and session state. Refactoring risk is high.
2. There is no backend implementation here, so frontend changes can easily drift away from the real server contract.
3. The app currently includes a demo preview path when `EXPO_PUBLIC_API_BASE_URL` is unset. That is useful for UI inspection but dangerous if forgotten.
4. Social auth likely needs real-device testing. The code itself notes that LINE emulator behavior differs.
5. Session refresh relies on JWT payload containing `customerId`. If backend token shape changes, hydration breaks.
6. `apiRequest()` assumes JSON responses on both success and error paths. Non-JSON backend responses will fail noisily.
7. There is no client-side validation layer worth trusting yet for email, phone, numeric amount, OTP, or password inputs.
8. There is no offline/error-retry strategy.
9. No linting, unit tests, or integration tests are present.
10. Expo Go state and SecureStore can preserve stale sessions; manual cleanup may be needed during QA.

## Deployment notes

- Android package id: `com.scgroup.sccrm`
- App scheme: `sccrm`
- EAS is assumed for Android builds
- CI requires `EXPO_TOKEN` secret for GitHub Actions
- Native folders are not checked in; this repo expects Expo managed workflow

## Environment variables

See [.env.example](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/.env.example).

Required or likely needed:

- `EXPO_PUBLIC_API_BASE_URL`
  - shared backend base URL
- `EXPO_PUBLIC_AUTH_REDIRECT_URI`
  - deep link redirect, default `sccrm://oauth`
- `EXPO_PUBLIC_LINE_CHANNEL_ID`
  - LINE OAuth client id
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
  - Google OAuth client id

Do not commit real values.

## Coding conventions

- TypeScript strict mode is enabled
- Current style is function-based React components with inline local helpers
- Styling is plain `StyleSheet.create`
- Existing data shape uses snake_case from backend responses (`full_name`, `created_at`) mixed with camelCase request bodies (`fullName`, `deviceLabel`)
- Preserve that contract unless backend changes are coordinated

## Safe development rules

- Inspect before editing; this repo is small enough to read fully.
- Prefer small targeted patches over large rewrites.
- Run `npx tsc --noEmit` after every non-trivial change.
- If changing API payloads or token assumptions, document the backend expectation in the same change.
- Do not hard-code secrets or production credentials.
- Do not remove the preview fallback unless backend setup is ready and validated.
- Do not silently change UI flow ordering; recent user-requested auth layout changes are intentional.
- Treat SecureStore keys as part of persisted app state; changing them can invalidate user sessions.

## Things Claude must not break

- Expo app boot via `index.ts`
- Email-first customer login flow
- Hidden signup-by-default behavior
- Staff search/create/earn/redeem pathways
- SecureStore session persistence keys
- Existing backend route names and request field names unless explicitly coordinated
- EAS Android build configuration

## Recommended MCP / External Tools for Claude Code

### Filesystem access

- Required: yes
- Why: the repo is mostly a single-file frontend and requires direct file inspection/editing
- Without it: work is severely limited
- Safety: avoid blind rewrites of `App.tsx`

### Browser / DevTools MCP

- Required: optional but highly useful
- Why: if web preview is used later, it helps inspect runtime UI and network issues
- Without it: Claude can still use terminal + emulator/manual testing
- Safety: not a substitute for Android-native QA

### Playwright MCP

- Required: optional
- Why: useful only if the team later invests in web-based regression checks via `expo start --web`
- Without it: manual testing remains possible
- Safety: low value right now because the core target is Android, not browser-first

### GitHub MCP

- Required: optional
- Why: useful for CI inspection, PR review, and workflow troubleshooting
- Without it: standard `git` and reading `.github/workflows` are enough for most local work
- Safety: avoid mutating workflows blindly without understanding Expo/EAS assumptions

### PostgreSQL MCP

- Required: optional
- Why: only helpful if the real backend database is available externally and schema debugging is needed
- Without it: frontend work can continue, but backend assumptions remain inferred
- Safety: do not run destructive DB operations without explicit approval

### Supabase MCP

- Required: only if the missing backend is actually on Supabase
- Why: could help if auth/database/storage are Supabase-backed
- Without it: frontend-only work remains possible
- Safety: verify the backend stack before installing or using it; there is no evidence in this repo that Supabase is in use

### Docker tools

- Required: not currently
- Why: no Docker config exists in this repo
- Without it: nothing is blocked
- Safety: do not invent container workflows that the project does not already use

### Google Drive / Sheets MCP

- Required: no
- Why: no spreadsheet or document integration is present in code
- Without it: no impact

### LINE-related tools

- Required: optional
- Why: LINE login exists, but normal OAuth debugging can mostly be done via env/config + real-device testing
- Without it: frontend integration work can continue
- Safety: do not assume emulator auth proves production LINE behavior

## Recommended first reads for the next agent

1. [CLAUDE.md](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/CLAUDE.md)
2. [AGENTS.md](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/AGENTS.md)
3. [App.tsx](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/App.tsx)
4. [src/lib/api.ts](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/src/lib/api.ts)
5. [src/lib/auth.ts](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/src/lib/auth.ts)
6. [.env.example](C:/Users/scgro/Desktop/Webapp training project/SCCRMMVP/.env.example)

## Recommended next steps

1. Split `App.tsx` into smaller screens/components before adding many more features.
2. Confirm the real backend contract and document any mismatch with current frontend assumptions.
3. Decide whether the preview-only demo login path should remain temporarily or be replaced with a proper mock/dev backend.
4. Add at least lightweight validation and error-state handling for auth and points flows.
5. Add automated checks beyond `npx tsc --noEmit`.
