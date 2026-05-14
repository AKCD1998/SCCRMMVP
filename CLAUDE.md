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
- Entry point: `index.ts`
- Main application surface: `App.tsx` — mounts providers, owns `mode`/`busy`/`message`, routes to screens
- Config/env loader: `src/config.ts`
- Generic API client: `src/lib/api.ts`
- OAuth helpers: `src/lib/auth.ts`
- Shared frontend types: `src/types.ts`
- App-level navigation types: `src/types/app.ts`
- SecureStore key constants + demo credentials: `src/constants/keys.ts`
- **Customer domain state + handlers**: `src/context/CustomerSessionContext.tsx` — exposed via `useCustomerSession()`
- **Staff domain state + handlers**: `src/context/StaffSessionContext.tsx` — exposed via `useStaffSession()`
- Pure UI components: `src/components/`
- Screen UI components: `src/screens/` — all screens are now prop-free; they pull from context

There is no router. A Jest test suite exists for `src/utils/validation.ts` (57 test cases).

## Folder structure

```text
SCCRMMVP/
  .github/workflows/eas-build.yml   CI/CD build workflow for EAS Android builds
  assets/                           Expo icons and splash assets
  App.tsx                           Root: providers + AppShell + loading screen
  app.json                          Expo app config
  eas.json                          EAS build profiles
  index.ts                          Expo root registration
  package.json                      npm scripts and dependencies
  src/
    config.ts                       Environment variable wiring
    constants/
      keys.ts                       SecureStore key names + demo login credentials
      theme.ts                      Central design tokens — colors, radius, spacing, shadow
    components/
      ActionButton.tsx              Pressable button (primary / secondary / ghost)
      Field.tsx                     Labelled TextInput
      Section.tsx                   Card-style section wrapper (headerRight slot)
      ScanButton.tsx                ScanButtonV1 (QR icon) + ScanButtonV2 (barcode icon)
      CustomerDrawer.tsx            Slide-out customer navigation drawer
      MemberCodeModal.tsx           Member card bottom sheet: CODE128B + QR + selectable text
    context/
      CustomerSessionContext.tsx    Customer state, auth/signup/profile handlers, useCustomerSession()
      StaffSessionContext.tsx       Staff state, device/search/points handlers, useStaffSession()
    lib/
      api.ts                        fetch wrapper + JWT payload decode
      auth.ts                       LINE and Google browser auth helpers
    screens/
      CustomerAuthScreen.tsx        Login + inline signup (email + LINE + Google)
      CustomerHistoryScreen.tsx     Point transaction list
      CustomerNavBar.tsx            Tab bar + logout for authenticated customer
      CustomerPointsScreen.tsx      Points balance + tier progress bar
      CustomerProfileScreen.tsx     Profile edit form
      SocialCompleteScreen.tsx      Post-social-login profile completion
      StaffAuthScreen.tsx           Staff device PIN authentication
      StaffCustomerProfileScreen.tsx  Customer detail view for staff
      StaffEarnScreen.tsx           Add points by purchase amount
      StaffHomeScreen.tsx           Phone search + new-customer shortcut
      StaffRedeemScreen.tsx         Point redemption form
      StaffRegisterScreen.tsx       New customer registration form
    types.ts                        Customer / points / session data types
    types/
      app.ts                        Mode / StaffView / CustomerView union types
      memberTypes.ts                MemberQRPayload, MemberCardData, MemberCardViewModel
      base-64.d.ts                  Type support for base-64 package
    mocks/
      mockMemberData.ts             MOCK_MEMBER_CODE + mockMemberCardData — swap when backend ready
    services/
      memberService.ts              fetchMemberCard() adapter — mock now, real API later
    utils/
      validation.ts                 Compound input validators (no external dependencies)
    __tests__/
      validation.test.ts            57 test cases for all validators
```

## State architecture

App.tsx owns three thin pieces of cross-cutting state:

| State | Type | Why it stays in App |
|-------|------|---------------------|
| `mode` | `'customer' \| 'staff' \| 'gateway'` | Controls which domain renders; set by both contexts |
| `busy` | `boolean` | Shared full-screen loading indicator across domains |
| `message` | `string` | Shared status banner across domains |

Both providers receive `setBusy`, `setMessage`, `setMode` as stable setter props so they can drive top-level UI from within domain handlers.

### CustomerSessionContext (`useCustomerSession`)

Owns all customer-domain state and handlers:

- Post-login data: `customer`, `customerAccessToken`, `customerBalance`, `customerLifetimeEarned`, `customerHistory`, `tierProgress`
- View routing: `customerView`, `setCustomerView`
- Auth/signup form fields: `customerEmail`, `customerPassword`, `customerName`, `customerPhone`, `customerOtp`, `signupExpanded`
- Actions: `loginWithEmail`, `handleProviderLogin`, `startEmailOtpSignup`, `completeEmailSignup`, `completeSocialSignup`, `saveCustomerProfile`, `logoutCustomer`
- Session restoration: runs automatically in `useEffect` on provider mount

### StaffSessionContext (`useStaffSession`)

Owns all staff-domain state and handlers:

- Auth: `staffToken`, `staffView`, `staffDeviceName`, `staffPin`
- Customer lookup: `staffSearchPhone`, `selectedCustomer`
- Points form: `staffAmount`, `staffRedeemPoints`, `staffRewardName`
- Register form: `staffRegisterName`, `staffRegisterPhone`, `staffRegisterEmail`
- Actions: `bootstrapStaffDevice`, `searchCustomer`, `registerStaffCustomer`, `earnPoints`, `redeemPoints`, `logoutStaff`
- Session restoration: reads SecureStore on provider mount (no API call needed)

### Rules for future edits

- **Adding a new customer screen**: call `useCustomerSession()` for state and handlers. No props needed.
- **Adding a new staff screen**: call `useStaffSession()`. No props needed.
- **Adding a new customer action**: add handler inside `CustomerSessionProvider`; expose in the context value type.
- **Adding a new staff action**: same pattern in `StaffSessionProvider`.
- **Do not** put unrelated state into an existing context — create a new one.
- **Do not** call `useCustomerSession()` from a staff screen or vice versa.
- **Do not** read `mode` from inside a screen component — the parent already guards by `mode ===` before rendering.

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

A minimal Jest test suite is in place for the validation layer.

### Run tests

```powershell
npm test
```

Watch mode (re-runs on save):

```powershell
npm run test:watch
```

Type check:

```powershell
npx tsc --noEmit
```

**Rule for future edits:** run `npm test` and `npx tsc --noEmit` before reporting a task complete.

### What is covered

- `src/utils/validation.ts` — all 10 exported compound validators (57 test cases)
  - Valid inputs accepted
  - Required-field rejections
  - Email format validation
  - Thai phone format validation (with/without non-digit characters)
  - Positive numeric amount parsing (zero, negative, NaN all rejected)
  - Optional-field handling (blank email accepted where email is optional)

### What is intentionally not covered yet

- Screen rendering (no snapshot or component tests)
- Context handler behavior (no mocks of SecureStore or the API layer)
- Social login OAuth flow
- End-to-end / Detox flows

Manual QA still matters for runtime behavior:

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
- All screens implemented for auth, points, staff, profile flows
- SecureStore session persistence
- API contract assumptions for auth/customers/points
- EAS build workflow for Android
- Member card modal (`MemberCodeModal`) with CODE128B barcode + QR code (pure-JS, no native modules)
- Three-layer service architecture for member card: `types/memberTypes.ts` → `mocks/mockMemberData.ts` → `services/memberService.ts`
- Jest test suite: 57 test cases for `src/utils/validation.ts`
- Full documentation: `CHANGELOG.md`, `DECISIONS.md`, `docs/FRONTEND_ARCHITECTURE.md`, `docs/BACKEND_INTEGRATION.md`

What is incomplete:

- No backend in repo
- No real env configured by default
- No navigation library
- No production auth hardening visible from frontend
- No role/authorization model yet
- Redeem flow on customer side is placeholder only
- `member_code` column not yet in backend DB — member card shows mock data (`SCM-A1B2C3D4`)
- Backend DB migration SQL is documented in `docs/BACKEND_INTEGRATION.md` but not yet applied
- CODE128B encoder (107-entry table) is not unit-tested

## Known issues, risks, and fragile areas

1. `App.tsx` is a thin shell that owns only `mode`, `busy`, and `message`. All domain state lives in the two context providers.
2. There is no backend implementation here, so frontend changes can easily drift away from the real server contract.
3. The app currently includes a demo preview path when `EXPO_PUBLIC_API_BASE_URL` is unset. That is useful for UI inspection but dangerous if forgotten.
4. Social auth likely needs real-device testing. The code itself notes that LINE emulator behavior differs.
5. Session refresh relies on JWT payload containing `customerId`. If backend token shape changes, hydration breaks.
6. `apiRequest()` assumes JSON responses on both success and error paths. Non-JSON backend responses will fail noisily.
7. Client-side validation is now in place via `src/utils/validation.ts`. All ten action handlers validate inputs before calling `setBusy(true)` and before any API call. Errors surface through `setMessage`. No third-party validation library is used.
8. There is no offline/error-retry strategy.
9. A minimal Jest suite covers `src/utils/validation.ts` (57 tests). Screen rendering and context mocks are not yet tested.
10. Expo Go state and SecureStore can preserve stale sessions; manual cleanup may be needed during QA.

## Design tokens

All colors, radii, spacing, and shadow presets are centralized in `src/constants/theme.ts`. **Never add a hardcoded hex color to a component or screen.** Import `theme` and reference a token instead.

Corporate identity roots: blue `#0000FE`, yellow `#FCFF59`, white `#FFFFFF`.

Refined premium palette in use:

| Token | Value | Use |
|-------|-------|-----|
| `brand` | `#0B1FB8` | Primary CTA, headings, progress fill |
| `brandAccent` | `#1D3CFF` | Active/focused states |
| `brandYellow` | `#F6E96B` | Reserved — badge/accent future use |
| `pageBackground` | `#FAFAF4` | App shell background |
| `cardBackground` | `#FFFFFF` | Section card surfaces |
| `inputBackground` | `#F9FAFB` | Text input fields |
| `textHeading` | `#111827` | Titles, large numbers |
| `textBody` | `#374151` | Data rows, body text |
| `textMuted` | `#6B7280` | Subtitles, helpers, timestamps |
| `border` | `#E5E7EB` | Card/input outlines |
| `primaryBg/Text` | `#0B1FB8` / `#FFFFFF` | Primary button |
| `secondaryBg/Text` | `#EEF1FF` / `#0B1FB8` | Secondary button |
| `ghostBorder/Text` | `#C7D2FE` / `#0B1FB8` | Ghost button |
| `success` | `#16A34A` | Positive point amounts |
| `error` | `#DC2626` | Error states |

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

## Mandatory changelog rule

**Every code change — no matter how small — must add an entry to `CHANGELOG.md` in the same commit.**

Use the template at the bottom of `CHANGELOG.md`. Include:
- Files changed and what changed in each
- Why the change was made
- What breaks if reverted

If fixing a bug, also record: root cause, diagnosis, and why this fix was chosen over alternatives.

Do not batch multiple sessions into one entry. One commit = one entry.

---

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

1. Confirm the real backend contract and document any mismatch with current frontend assumptions.
2. Decide whether the preview-only demo login path should remain temporarily or be replaced with a proper mock/dev backend.
3. Add automated checks beyond `npx tsc --noEmit`.
4. Consider adding OTP length/format validation once the backend's expected OTP length is confirmed.
