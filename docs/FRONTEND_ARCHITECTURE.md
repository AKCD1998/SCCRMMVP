# Frontend Architecture

Current state of SCCRMMVP as of 2026-05-14.
**Update this file whenever a new file, layer, or pattern is introduced.**

---

## Technology stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Expo SDK | 54 |
| Framework | React Native | 0.81 |
| Language | TypeScript | 5.9 (strict mode) |
| UI | Plain `StyleSheet.create` | — |
| State | React Context | built-in |
| Navigation | Manual conditional rendering | no library |
| HTTP | Custom `apiRequest()` fetch wrapper | `src/lib/api.ts` |
| Session persistence | Expo SecureStore | `expo-secure-store` |
| Auth (social) | Expo AuthSession | `expo-auth-session` |
| QR generation | `qrcode` (pure JS) | — |
| Barcode generation | Custom CODE128B encoder (pure TS) | `src/components/MemberCodeModal.tsx` |
| Validation | Custom pure validators | `src/utils/validation.ts` |
| Testing | Jest + jest-expo | — |
| Build | EAS (Expo Application Services) | — |
| CI | GitHub Actions | `.github/workflows/eas-build.yml` |

---

## Full folder map (current)

```
SCCRMMVP/
│
├── App.tsx                         Root orchestrator — mounts providers, owns mode/busy/message
├── index.ts                        Expo entry point (registerRootComponent)
├── app.json                        Expo config (newArchEnabled: true, scheme: sccrm)
├── eas.json                        EAS build profiles (preview APK, production AAB)
├── package.json                    Dependencies + npm scripts
├── AGENTS.md                       Rules for AI agents working in this repo
├── CHANGELOG.md                    Full record of every change (newest first)
├── DECISIONS.md                    Architectural decision records (ADR)
│
├── docs/
│   ├── BACKEND_INTEGRATION.md     Step-by-step guide to connecting the real backend
│   └── FRONTEND_ARCHITECTURE.md   This file
│
├── src/
│   │
│   ├── config.ts                   Env var loader — appConfig.apiBaseUrl, lineChannelId, etc.
│   │
│   ├── types.ts                    Shared domain types: Customer, Transaction, PointHistoryItem,
│   │                               Promotion, SessionResponse
│   │
│   ├── types/
│   │   ├── app.ts                  Union types: Mode, StaffView, CustomerView
│   │   ├── memberTypes.ts          MemberQRPayload, MemberCardData, MemberCardViewModel
│   │   └── base-64.d.ts            Type shim for base-64 package
│   │
│   ├── constants/
│   │   ├── keys.ts                 SecureStore key names + demo credentials
│   │   └── theme.ts                Design tokens — ALL colors, radii, spacing, shadow
│   │
│   ├── lib/
│   │   ├── api.ts                  apiRequest<T>() + decodeJwtPayload()
│   │   └── auth.ts                 startLineLogin(), startGoogleLogin()
│   │
│   ├── mocks/
│   │   └── mockMemberData.ts       MOCK_MEMBER_CODE + mockMemberCardData
│   │                               ← replace with real API when backend is ready
│   │
│   ├── services/
│   │   └── memberService.ts        fetchMemberCard() — adapter between UI and backend
│   │                               Currently returns mock; swap body for real API call
│   │
│   ├── utils/
│   │   └── validation.ts           Pure compound validators (no side effects, no libs)
│   │
│   ├── context/
│   │   ├── CustomerSessionContext.tsx   All customer state + handlers; useCustomerSession()
│   │   └── StaffSessionContext.tsx      All staff state + handlers; useStaffSession()
│   │
│   ├── components/
│   │   ├── ActionButton.tsx         Pressable: primary | secondary | ghost variants
│   │   ├── Field.tsx                Labelled TextInput
│   │   ├── Section.tsx              Card wrapper with optional headerRight slot
│   │   ├── ScanButton.tsx           ScanButtonV1 (QR icon) + ScanButtonV2 (barcode icon)
│   │   ├── CustomerDrawer.tsx       Slide-out navigation drawer for customer flow
│   │   └── MemberCodeModal.tsx      Member card bottom sheet: CODE128B + QR + text
│   │
│   └── screens/
│       ├── CustomerAuthScreen.tsx          Login + inline email/social signup
│       ├── CustomerHistoryScreen.tsx       Point transaction list
│       ├── CustomerNavBar.tsx              Tab bar + logout (customer flow)
│       ├── CustomerPointsScreen.tsx        Points + tier + member card modal trigger
│       ├── CustomerProfileScreen.tsx       Profile edit form
│       ├── SocialCompleteScreen.tsx        Post-social-login onboarding
│       ├── StaffAuthScreen.tsx             Staff device PIN login
│       ├── StaffCustomerProfileScreen.tsx  Customer detail view (staff)
│       ├── StaffEarnScreen.tsx             Add points by purchase amount
│       ├── StaffHomeScreen.tsx             Phone search + new customer shortcut
│       ├── StaffRedeemScreen.tsx           Redeem points form
│       └── StaffRegisterScreen.tsx         New customer registration
│
└── src/__tests__/
    └── validation.test.ts          57 test cases for all compound validators
```

---

## Data flow

### Customer login flow

```
CustomerAuthScreen
  → useCustomerSession().loginWithEmail()
    → validateEmailLogin() [sync, returns error string or null]
    → setBusy(true)
    → apiRequest('/api/sccrm/auth/login', { method: 'POST', body: { email, password, deviceLabel } })
    → decodeJwtPayload(accessToken) → extracts customerId
    → apiRequest('/api/sccrm/customers/:id')        → sets customer
    → apiRequest('/api/sccrm/points/:id/balance')   → sets customerBalance, lifetimeEarned
    → apiRequest('/api/sccrm/points/:id/history')   → sets customerHistory
    → SecureStore.setItemAsync(CUSTOMER_REFRESH_TOKEN_KEY, refreshToken)
    → setBusy(false)
    → setCustomerView('points')   ← navigates to points screen
```

### Member card modal flow (current — mock)

```
CustomerPointsScreen
  → ScanButtonV1 onPress → handleOpenMemberCard()
    → setShowMemberCode(true)   ← modal renders immediately (loading state)
    → memberService.fetchMemberCard(customer.id, customerAccessToken)
      → returns toViewModel(mockMemberCardData)   ← mock only, no API call
    → setMemberCard(card)
  → MemberCodeModal receives memberCard prop
    → Code128Barcode renders card.barcodePayload with CODE128B encoder
    → QRCodeView renders card.qrPayload (JSON string) as QR matrix
    → member code text displayed + selectable
```

### Member card modal flow (future — real backend)

```
CustomerPointsScreen
  → ScanButtonV1 onPress → handleOpenMemberCard()
    → setShowMemberCode(true)
    → memberService.fetchMemberCard(customer.id, customerAccessToken)
      → Promise.all([
          apiRequest('/api/sccrm/customers/:id'),    ← includes member_code
          apiRequest('/api/sccrm/points/:id/balance')
        ])
      → toViewModel({ memberId, memberCode, fullName, tier, pointsBalance, lifetimeEarned })
    → setMemberCard(card)
  → MemberCodeModal (same component, no changes needed)
```

---

## Layer responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│  SCREENS (src/screens/)                                          │
│  • Renders UI using data from context or service                 │
│  • Calls context actions on user events                          │
│  • Owns modal visibility state (local useState)                  │
│  • Never calls apiRequest() directly                             │
│  • Never contains business logic                                 │
├─────────────────────────────────────────────────────────────────┤
│  COMPONENTS (src/components/)                                    │
│  • Pure presentation — no API calls, no context reads            │
│  • Receive all data via props                                     │
│  • Contain layout, styling, minor UX logic (pressed states etc)  │
├─────────────────────────────────────────────────────────────────┤
│  CONTEXT (src/context/)                                          │
│  • Owns domain state (customer or staff)                         │
│  • Calls apiRequest() directly for auth/session/profile flows    │
│  • Calls setBusy/setMessage from App.tsx                         │
│  • Never imports from services/ (for now — contexts predate them) │
├─────────────────────────────────────────────────────────────────┤
│  SERVICES (src/services/)                                        │
│  • Thin adapters between UI and backend                          │
│  • Shape API responses into ViewModels                           │
│  • Contain no business logic                                     │
│  • Currently return mock data; swap body for real apiRequest()   │
├─────────────────────────────────────────────────────────────────┤
│  LIB (src/lib/)                                                  │
│  • Generic utilities: apiRequest(), decodeJwtPayload()           │
│  • OAuth helpers: startLineLogin(), startGoogleLogin()           │
│  • No domain knowledge                                           │
├─────────────────────────────────────────────────────────────────┤
│  UTILS (src/utils/)                                              │
│  • Pure functions — no React, no side effects                    │
│  • Validation only (currently)                                   │
├─────────────────────────────────────────────────────────────────┤
│  MOCKS (src/mocks/)                                              │
│  • Static fake data that matches backend response shapes exactly  │
│  • Single place to update when backend format changes            │
│  • Only imported by services/ — never by screens or components   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design system

All visual design lives in `src/constants/theme.ts`. **Never hardcode a hex color in a screen or component.**

### Colors

| Token | Value | Use |
|---|---|---|
| `brand` | `#0B1FB8` | Primary CTA, headings, progress fill, icon fill |
| `brandAccent` | `#1D3CFF` | Active / focused states |
| `brandYellow` | `#F6E96B` | Reserved — badge/accent (not yet used in production) |
| `pageBackground` | `#FAFAF4` | App shell background |
| `cardBackground` | `#FFFFFF` | Section card surfaces |
| `inputBackground` | `#F9FAFB` | TextInput fields |
| `textHeading` | `#111827` | Titles, large numbers, barcode color |
| `textBody` | `#374151` | Body text, data rows |
| `textMuted` | `#6B7280` | Subtitles, helpers, section labels |
| `textPlaceholder` | `#9CA3AF` | Input placeholder |
| `textOnBrand` | `#FFFFFF` | Text on brand-blue backgrounds |
| `border` | `#E5E7EB` | Card borders, input strokes |
| `borderLight` | `#F3F4F6` | Internal list dividers |
| `progressTrack` | `#E0E7FF` | Tier progress bar background |
| `primaryBg/Text` | `#0B1FB8` / `#FFFFFF` | Primary button |
| `secondaryBg/Text` | `#EEF1FF` / `#0B1FB8` | Secondary button |
| `ghostBorder/Text` | `#C7D2FE` / `#0B1FB8` | Ghost button |
| `success` | `#16A34A` | Positive point amounts, earn confirmations |
| `warning` | `#D97706` | Alerts, low-balance warnings |
| `error` | `#DC2626` | Error states, validation failures |

### Spacing

| Token | Value |
|---|---|
| `xs` | 8px |
| `sm` | 12px |
| `md` | 18px |
| `lg` | 24px |

### Radius

| Token | Value |
|---|---|
| `sm` | 10px |
| `md` | 14px |
| `lg` | 18px |
| `full` | 999px (pill shape) |

### Shadow

Single preset `theme.shadow.card` applied via spread: `...theme.shadow.card`. Android elevation + iOS shadow.

---

## Validation pattern

All user-input handlers follow this exact pattern — enforced project-wide:

```typescript
// 1. Validate synchronously BEFORE setting busy
const err = validateXxx(input1, input2, ...);
if (err) { setMessage(err); return; }

// 2. Now safe to show loading
setBusy(true);
try {
  // 3. API call
  const result = await apiRequest(...);
  // 4. Update state
  setMessage('Success');
} catch (e) {
  setMessage(e instanceof Error ? e.message : 'Something went wrong');
} finally {
  // 5. Always clear loading
  setBusy(false);
}
```

All validators live in `src/utils/validation.ts`. They are pure functions — no React, no side effects, no async.

---

## SecureStore keys

Defined in `src/constants/keys.ts`. **Changing a key name will invalidate all existing user sessions on devices that have the app installed.**

| Key | Content |
|---|---|
| `sccrm_customer_refresh_token` | Customer JWT refresh token |
| `sccrm_staff_token` | Staff device opaque token |
| `sccrm_staff_device_id` | Generated staff device UUID |

---

## Adding a new feature — decision tree

```
Is it a new customer-facing screen?
  → Add state/handler to CustomerSessionContext
  → Call useCustomerSession() in the screen
  → Screen is prop-free — all data from context

Is it a new staff-facing screen?
  → Same pattern in StaffSessionContext + useStaffSession()

Is it data that needs to be fetched from the backend and displayed in a modal?
  → Add a function to src/services/memberService.ts (or create a new service file)
  → Add the data shape to src/types/memberTypes.ts
  → Add mock data to src/mocks/mockMemberData.ts
  → Screen calls the service function, passes ViewModel to a component

Is it a new reusable UI element?
  → Add to src/components/
  → Accept all data via props — no context reads in components

Is it a new color?
  → Add to theme.ts first with a descriptive token name
  → Then use the token in the component

Is it a new validator?
  → Add to src/utils/validation.ts
  → Add test cases to src/__tests__/validation.test.ts
  → Call the validator before setBusy(true) in the handler

Is it a new SecureStore key?
  → Add the constant to src/constants/keys.ts
  → Document it in this file under SecureStore keys
  → Warn in CHANGELOG.md that changing it invalidates existing sessions
```

---

## Test coverage

| Area | Coverage |
|---|---|
| `src/utils/validation.ts` | ✅ 57 test cases, all validators |
| Screen rendering | ❌ Not covered — manual QA in Expo Go |
| Context handlers | ❌ Not covered — would require SecureStore + API mocks |
| `memberService.ts` | ❌ Not covered — trivial while it returns mock; add tests when real API is wired |
| CODE128B encoder | ❌ Not covered — add tests before enabling real barcode scanning |
| QRCodeView component | ❌ Not covered |

**Run before any commit:**

```powershell
npm test
npx tsc --noEmit
```

---

## Known limitations and fragile areas

1. **No router** — as screens grow, conditional rendering in `App.tsx` / contexts will become hard to scan. See ADR-001 for migration plan.

2. **Context re-renders** — every screen consuming `useCustomerSession()` re-renders when any context value changes. Acceptable now; watch for jank when context grows past ~20 state values.

3. **No offline support** — session state is lost on app restart except for what's in SecureStore. Network errors are surfaced via `setMessage()` with no retry.

4. **Demo preview path** — `App.tsx` has a hardcoded fallback when `EXPO_PUBLIC_API_BASE_URL` is unset. This shows the customer flow with mock data. **Do not remove this until the backend is configured in a staging environment.**

5. **Social auth (LINE) emulator issue** — LINE auth behaves differently in Android emulator vs real device. Always test social login on a real device before marking it as working.

6. **member_code is mock-only** — the `MemberCodeModal` currently shows `SCM-A1B2C3D4` for every user. This is the intended temporary state. See `docs/BACKEND_INTEGRATION.md` for the full integration path.

7. **CODE128B encoder is not tested** — the 107-entry pattern table was hand-compiled from the ISO/IEC 15417 standard. Before shipping real barcode scanning to staff devices, add unit tests that verify known CHARACTER → BAR_PATTERN outputs.
