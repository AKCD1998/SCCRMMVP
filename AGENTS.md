# Agent Rules

## Scope

These rules apply to the whole repository.

## Operating rules

- Inspect the repository before editing. This codebase is small; read the relevant files fully.
- Prefer small patches. Do not rewrite `App.tsx` wholesale unless explicitly asked.
- Run `npx tsc --noEmit` after non-trivial code changes.
- Preserve existing API route names, request field names, and SecureStore keys unless the backend contract is intentionally changing.
- Do not hard-code secrets, production credentials, or real service tokens.
- Do not run destructive migrations or invent database changes from frontend guesses.
- Preserve current UI/UX ordering unless the user requests a change.
- Document risky assumptions in `CLAUDE.md` when backend behavior is inferred rather than confirmed.
- If touching auth, session persistence, or social login, verify both the no-backend preview path and the real configured-backend path when possible.
- If a change depends on the real backend, say so clearly instead of faking certainty.

## Current hotspots

- `src/context/CustomerSessionContext.tsx`: all customer auth/session/profile logic; changes here affect all customer screens
- `src/context/StaffSessionContext.tsx`: all staff device/search/points logic; changes here affect all staff screens
- `src/lib/api.ts`: central request behavior; any change affects all backend calls
- `src/lib/auth.ts`: provider auth assumptions and redirect handling
- `src/constants/keys.ts`: SecureStore key names — changing these invalidates stored user sessions
- `src/constants/theme.ts`: all design tokens — colors, radii, spacing, shadow; touch here for any visual change
- `App.tsx`: thin orchestrator; only touch for top-level routing or provider wiring
- `.github/workflows/eas-build.yml`: deployment/build path

## File map

| File | Responsibility |
|------|---------------|
| `App.tsx` | Root: mounts providers, owns `mode`/`busy`/`message`, routes screens |
| `src/constants/keys.ts` | SecureStore key names + demo credentials |
| `src/types/app.ts` | `Mode`, `StaffView`, `CustomerView` union types |
| `src/context/CustomerSessionContext.tsx` | All customer state + handlers; `useCustomerSession()` hook |
| `src/context/StaffSessionContext.tsx` | All staff state + handlers; `useStaffSession()` hook |
| `src/components/ActionButton.tsx` | Reusable button (primary/secondary/ghost) |
| `src/components/Field.tsx` | Reusable labelled text input |
| `src/components/Section.tsx` | Reusable card section wrapper |
| `src/screens/StaffAuthScreen.tsx` | Staff PIN login UI |
| `src/screens/StaffHomeScreen.tsx` | Staff customer search UI |
| `src/screens/StaffRegisterScreen.tsx` | Staff new-customer form |
| `src/screens/StaffCustomerProfileScreen.tsx` | Customer details view for staff |
| `src/screens/StaffEarnScreen.tsx` | Add-points form |
| `src/screens/StaffRedeemScreen.tsx` | Redeem-points form |
| `src/screens/CustomerAuthScreen.tsx` | Customer login + inline signup |
| `src/screens/SocialCompleteScreen.tsx` | Post-social-login profile completion |
| `src/screens/CustomerNavBar.tsx` | Customer tab navigation + logout |
| `src/screens/CustomerPointsScreen.tsx` | Points balance + tier progress |
| `src/screens/CustomerHistoryScreen.tsx` | Transaction history list |
| `src/screens/CustomerProfileScreen.tsx` | Profile edit form |
| `src/constants/theme.ts` | Design tokens — colors, radius, spacing, card shadow |
| `src/utils/validation.ts` | Pure compound validators — no side effects, no external libs |

## Context editing rules

- To add a customer-side feature: add state/handler to `CustomerSessionContext`, add to the value type, call from the screen via `useCustomerSession()`.
- To add a staff-side feature: same pattern in `StaffSessionContext` + `useStaffSession()`.
- Do not mix customer and staff concerns in a single context.
- Do not call `useCustomerSession()` from a staff screen or vice versa.
- Do not add a new top-level `useState` to `App.tsx` unless the state genuinely spans both domains (like `busy`, `message`, `mode`).

## Styling rules

- **Never hardcode a hex color** in a component or screen. Import `theme` from `src/constants/theme.ts` and use a token.
- To change a color globally: update the value in `theme.ts` — it propagates everywhere automatically.
- To add a new color: add a token to `theme.colors` with a descriptive name before using it.
- `brandYellow` (`#F6E96B`) is defined but intentionally unused so far. Use it only for badge/chip/accent elements with sufficient contrast (dark text on yellow).
- Shadow/elevation is applied via `...theme.shadow.card` spread — keep it consistent across cards.

## Validation rules

- All compound validators live in `src/utils/validation.ts`. They are pure functions — no React, no side effects.
- Every action handler that accepts user input must call its validator **before** `setBusy(true)`, so that synchronous validation errors never show the loading spinner.
- Pattern: `const err = validateXxx(...); if (err) { setMessage(err); return; }`
- If adding a new handler that takes user input, add a matching validator in `validation.ts` and call it first.
- Do not add Zod, Yup, or any schema library unless explicitly requested.

## Safe verification baseline

```powershell
npm test
npx tsc --noEmit
```

Both commands must pass before a task is reported complete.

If Android emulator access is available, also manually verify the main customer flow in Expo Go.
