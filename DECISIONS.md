# Architectural Decision Records (ADR)

This file documents every significant architectural decision made in this project.
Format inspired by [Michael Nygard's ADR template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

**Rule: when you make a decision that affects project structure, data flow, naming conventions, or technology choices, add an ADR here in the same commit.**

---

## ADR-001 — No navigation library (no React Navigation, no Expo Router)

**Date**: pre-2026-05-14 (initial build)
**Status**: Active

**Context**

The app needs to switch between ~15 screens across two flows (staff and customer). Standard React Native projects use React Navigation or Expo Router for this.

**Decision**

Use manual `mode` / `staffView` / `customerView` state in `App.tsx` and the two context providers. Screen routing is done by conditional rendering (`mode === 'customer' && customerView === 'points' && <CustomerPointsScreen />`).

**Consequences — positive**

- Zero router dependency. No navigation stack, no deep-link config, no header chrome to fight.
- The two flows (staff / customer) are hard-isolated at the top level — a customer screen literally cannot reach staff state.
- Trivial to understand: `App.tsx` is the router; read 80 lines and you know every possible screen.

**Consequences — negative**

- Back-button behavior on Android must be handled manually (no navigation stack to pop).
- As the app grows to 30+ screens, manual conditional rendering will become hard to scan.
- Deep linking (e.g. LINE OAuth redirect opening a specific screen) requires custom handling.

**When to revisit**

When any of these are true:
- More than 20 distinct screen states exist across both flows
- Deep linking is required from outside the app (push notifications, OAuth callbacks beyond current ones)
- Android back button needs real stack-pop semantics

**Migration path when revisited**

React Navigation v7 with a `Stack.Navigator` per flow (staff stack / customer stack) wrapped inside the existing context providers. `mode` state stays in `App.tsx` but switches which navigator is mounted.

---

## ADR-002 — Context-based state management (no Redux, no Zustand, no Jotai)

**Date**: pre-2026-05-14 (initial build)
**Status**: Active

**Context**

The app has two distinct domains (staff and customer) with separate auth, session, and UI state. Options considered: Redux, Zustand, Jotai, React Context, MobX.

**Decision**

Two React Contexts: `CustomerSessionContext` and `StaffSessionContext`. Each owns all state and action handlers for its domain. `App.tsx` owns only three cross-cutting pieces: `mode`, `busy`, `message`.

**Consequences — positive**

- Zero additional state library dependency.
- Clear domain isolation: customer code cannot accidentally call staff handlers.
- TypeScript context value types serve as the documented API for each domain.
- No selector boilerplate, no action/reducer ceremony for a 15-screen MVP.

**Consequences — negative**

- Context re-renders: every consumer re-renders when any value in the context changes. Fine at this scale; may become an issue at 50+ consumers.
- No dev tools (Redux DevTools equivalent). State debugging is `console.log` only.
- No persistence layer — context state is gone on app restart. Session recovery is manual (SecureStore read on mount).

**When to revisit**

When performance profiling shows unnecessary re-renders causing jank, or when the team grows and multiple developers need a more explicit state update contract.

---

## ADR-003 — `memberService` adapter pattern (thin client service layer)

**Date**: 2026-05-14
**Status**: Active

**Context**

The member card feature needs to display a member code, QR, and barcode. This data will eventually come from the shared backend (`currentSC-official-website-project`), but the backend `member_code` column does not exist yet. The mock data needs to live somewhere, and the UI should not change when the real API is wired up.

**Decision**

Create `src/services/memberService.ts` as a single adapter function:

```typescript
export async function fetchMemberCard(
  customerId: string,
  accessToken: string,
): Promise<MemberCardViewModel>
```

Currently returns mock data. When the backend is ready, the body of this one function is replaced. Nothing in the UI (screens or components) imports from `mockMemberData` — they all go through `memberService`.

**Consequences — positive**

- The UI-to-backend integration is a one-file change when the backend is ready.
- The mock data is isolated to `src/mocks/mockMemberData.ts` — developers can see exactly what data the UI expects.
- `MemberCardViewModel` is a UI-optimized shape (camelCase, display-ready) while `MemberCardData` mirrors the raw API response. The transformation stays in the service.
- Future backend changes (different endpoint, different field names) are contained in `memberService.ts`.

**Consequences — negative**

- An extra indirection layer for a currently-simple mock return.
- Developers must remember to update `memberService.ts` when the backend is ready, not just delete the mock file.

**Naming note**

The service is named `memberService` (not `pointsService` or `loyaltyService`) because the feature scope will expand:
- Coupons
- Package / course balances
- Visit history
- Branch-specific promotions
- Digital membership card tiers

All of these belong to the "member" concept. The service should grow to handle all of them without renaming.

---

## ADR-004 — Pure-JS QR and barcode rendering (no native modules)

**Date**: 2026-05-14
**Status**: Active — replaces earlier `react-native-svg` / `react-native-qrcode-svg` attempt

**Context**

The member card modal needs to display both a QR code and a barcode. Several library options were evaluated:

| Library | Approach | Verdict |
|---|---|---|
| `react-native-qrcode-svg` + `react-native-svg` | SVG native module | ❌ Metro bundler error in Expo Go managed workflow |
| `qrcode.react` + `react-barcode` | Web-only (DOM) | ❌ Not compatible with React Native |
| `qrcode` (pure JS) + custom View renderer | No native code | ✅ Chosen |
| Canvas-based (expo-2d-context) | Canvas API | Too heavy for a display-only QR |

**The `react-native-svg` failure root cause**

`react-native-svg` 15.12.1 sets its `react-native` field in `package.json` to `src/index.ts` (TypeScript source). Metro uses this field as the entry point. The source chain imports `SvgTouchableMixin`, which Metro could not resolve in the Expo Go managed-workflow bundler. This is a known incompatibility between the package's source entry point and the Metro configuration that Expo Go provides without a custom `metro.config.js`.

**Decision**

- **QR code**: `qrcode` npm package — `QRCodeLib.create(value)` is synchronous, returns a module matrix (`data: Uint8ClampedArray, size: number`). Rendered as a grid of `<View>` cells. Produces a real, scannable QR code.
- **Barcode**: Custom CODE128B encoder (107-entry pattern table, checksum, quiet zones) — encoded in TypeScript, rendered as proportional flex strips. Visually correct CODE128; scannable by laser scanners.

**Consequences — positive**

- Zero native modules. Works in Expo Go, EAS builds, and web preview equally.
- No `metro.config.js` required.
- Full TypeScript — encoder and renderer are auditable line-by-line.
- `qrcode` package has no dependencies of its own.

**Consequences — negative**

- Barcode rendering uses many `<View>` children (~90–120 per barcode). Fine for a modal that is opened occasionally; would be wasteful in a scrolling list.
- The CODE128B encoder has a 107-entry hard-coded table. It should not be modified without cross-referencing the CODE128 ISO/IEC 15417 specification.
- QR cell size is fixed at 5px. On very high-DPI screens this produces a smaller-than-ideal QR. Adjust `cellSize` prop if scanning reliability is reported as a problem.

**When to revisit**

If the app ever ships a production EAS build (not Expo Go), `react-native-svg` may be acceptable there since native linking is resolved at build time. But the pure-JS approach will continue to work fine and should only be replaced if performance becomes measurable problem.

---

## ADR-005 — Structured JSON QR payload (versioned)

**Date**: 2026-05-14
**Status**: Active

**Context**

The QR code needs to encode something the staff scanner can decode. Options:
1. Encode raw `member_code` string (e.g. `SCM-A1B2C3D4`)
2. Encode the customer's UUID
3. Encode a structured JSON object

**Decision**

Encode a structured JSON object:

```json
{
  "type": "member_card",
  "version": 1,
  "memberCode": "SCM-A1B2C3D4"
}
```

**Consequences — positive**

- `type` field lets a multi-purpose scanner distinguish member cards from other QR types (e.g. coupons, package tokens) before doing any lookup.
- `version` field lets the backend evolve the payload schema (e.g. adding `expiresAt`, `sessionToken`) without breaking existing scanners that check `version === 1`.
- The `memberCode` field is the stable public identifier — the backend maps it to `customers.id` (UUID). The UUID is never exposed in the QR.

**Consequences — negative**

- Slightly larger QR payload than a raw string → more modules → smaller module size at the same physical QR dimensions → marginally harder to scan from distance.
- Scanner apps must parse JSON rather than treating the raw string as the member code.

**Future payload versions**

When rotating short-lived QR tokens are added:

```json
{
  "type": "member_card",
  "version": 2,
  "memberCode": "SCM-A1B2C3D4",
  "sessionToken": "eyJ...",
  "issuedAt": 1747123456789,
  "expiresAt": 1747123756789
}
```

The frontend will call a new backend endpoint (e.g. `POST /api/sccrm/members/me/qr-token`) to get a fresh `sessionToken` on each modal open. The `memberService.ts` adapter is the only file that needs updating.

---

## ADR-006 — `member_code` as a separate column (not raw UUID)

**Date**: 2026-05-14
**Status**: Proposed — pending backend migration

**Context**

The member card needs a public identifier to put in the QR/barcode. Options:

1. Use `customers.id` (UUID, e.g. `3f2e1b0a-...`) directly
2. Generate a short human-readable code (e.g. `SCM-A1B2C3D4`) stored in a new column

**Decision**

New column `member_code VARCHAR(50) UNIQUE NOT NULL` on the `customers` table.

**Rationale**

| Criterion | UUID | member_code |
|---|---|---|
| Human-readable (staff can type it manually) | ❌ 36-char UUID is error-prone | ✅ `SCM-A1B2C3D4` is readable |
| Stable across system changes | ✅ Never changes | ✅ Also never changes once set |
| Exposes internal ID | ⚠️ UUID is the PK — avoid leaking it | ✅ Opaque public identifier |
| QR code density | Slightly less data | Same — both short strings |
| Backend lookup performance | PK lookup (fastest) | Indexed unique lookup (equally fast) |

**Format**

`SCM-` prefix (brand identifier) + 8 uppercase hex characters derived from the customer's UUID at registration time:

```sql
'SCM-' || UPPER(REPLACE(SUBSTRING(id::text, 1, 8), '-', ''))
```

Example: customer UUID `a1b2c3d4-...` → member code `SCM-A1B2C3D`

**Consequences**

- Staff can search by `member_code` as well as by phone number.
- Barcode scanners encode/decode `member_code`, not UUID. Backend maps back via `WHERE member_code = $1`.
- If a customer's account is merged or corrected, `member_code` remains stable (unlike a UUID that might change in edge cases).
- Requires a migration and a backfill for existing customers. See `docs/BACKEND_INTEGRATION.md`.

---

## ADR-007 — SCCRMMVP is a pure UI client; all business logic stays in the shared backend

**Date**: 2026-05-14
**Status**: Active — architectural constraint, not optional

**Context**

The company plans multiple frontend clients:
- SCCRMMVP (this repo) — React Native mobile app for customers
- Future: staff web dashboard
- Future: LINE LIFF mini-app
- Future: POS integration

All of these need the same business logic: tier calculation, promotion application, point earn/redeem rules.

**Decision**

**`currentSC-official-website-project`** is the single source of truth for all business logic and database access. **SCCRMMVP** never connects directly to PostgreSQL, never calculates tiers, never applies promotions, and never validates business rules.

The division:

| Layer | Responsibility | Repo |
|---|---|---|
| PostgreSQL | Persistent truth | External (Render) |
| Express API | Business logic, auth, DB access | `currentSC-official-website-project` |
| SCCRMMVP | UI rendering, user interaction, local state | This repo |

**Enforcement in code**

- SCCRMMVP has no `pg` or `knex` dependency and must never have one.
- SCCRMMVP has no tier calculation logic — it displays `customer.tier` from the API response.
- SCCRMMVP has no point calculation logic — it displays `balance` and `lifetimeEarned` from the API response.
- SCCRMMVP has no promotion logic — promotions are applied server-side before the earn response is returned.
- The only "logic" allowed in SCCRMMVP is pure UI logic: form validation, display formatting, navigation state.

**Consequences — positive**

- A single backend fix propagates to all frontends simultaneously.
- Security: credentials, business rules, and raw PII never travel to the client.
- SCCRMMVP remains thin enough to be rewritten in a different framework if needed.

**Consequences — negative**

- Every new feature needs a backend API endpoint, not just a frontend change.
- Offline behavior is limited — anything that requires business logic requires network access.

---

## ADR-008 — `Section.tsx` `headerRight` prop (not a bespoke card component)

**Date**: 2026-05-14
**Status**: Active

**Context**

The "My Points" card needed a QR icon button in the top-right corner. Options:
1. Build a bespoke `PointsCard` component that has the button built in
2. Extend the generic `Section` wrapper with an optional `headerRight` slot

**Decision**

Added `headerRight?: React.ReactNode` to `Section.tsx`. Any content can be placed in the top-right of any Section card.

**Consequences — positive**

- One change, reusable everywhere. Any future card can have a right-aligned action without a new component.
- `CustomerPointsScreen` stays clean — it just passes `<ScanButtonV1 onPress={...} />` as a prop.
- `ScanButton.tsx` is an independent component — it does not know about `Section` internals.

**Consequences — negative**

- `Section` now has slightly more layout complexity (flex row header, optional action slot).
- If `headerRight` content is too wide, it will crowd the title. Callers are responsible for keeping the action small (icon-sized).

---

## Template for future ADRs

Copy this block when adding a new decision:

```markdown
## ADR-XXX — <short title>

**Date**: YYYY-MM-DD
**Status**: Proposed | Active | Superseded by ADR-YYY | Deprecated

**Context**
What is the situation, constraint, or problem? What options were considered?

**Decision**
What was decided, in one clear sentence.

**Consequences — positive**
Bullet list.

**Consequences — negative**
Bullet list. Be honest — every decision has tradeoffs.

**When to revisit**
Specific trigger conditions, not vague "if things change."
```
