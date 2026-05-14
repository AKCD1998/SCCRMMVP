# SCCRMMVP — Changelog

All notable changes to this project are recorded here.
Format: `[date] commit — description`. Newest entries at top.
**Rule: every code change, tweak, or fix must add an entry here before closing the session.**

---

## 2026-05-14

### `26d6b92` — Phase 2: service layer, CODE128 barcode, structured QR payload, scalable modal

**What changed**

Created a full three-layer service architecture for the member card feature:

| New file | Purpose |
|---|---|
| `src/types/memberTypes.ts` | `MemberQRPayload`, `MemberCardData`, `MemberCardViewModel` — typed contracts between layers |
| `src/mocks/mockMemberData.ts` | `MOCK_MEMBER_CODE = 'SCM-A1B2C3D4'` + `mockMemberCardData` — single place to replace when backend is live |
| `src/services/memberService.ts` | `fetchMemberCard(customerId, accessToken)` — the adapter seam; returns mock now, real API later |

Modified files:

| Modified file | What changed |
|---|---|
| `src/components/MemberCodeModal.tsx` | Full rebuild — real CODE128B encoder, structured QR JSON payload, loading skeleton, drag handle, future props stubbed |
| `src/screens/CustomerPointsScreen.tsx` | Now calls `memberService.fetchMemberCard()` lazily on first open; no direct mock import |
| `src/types.ts` | Added `member_code?: string \| null` to `Customer` type |

**Key decisions made**

- `memberService` is the single seam between mock and real backend. Nothing else in the app imports from `mockMemberData` directly.
- QR payload is structured JSON: `{ type: 'member_card', version: 1, memberCode }` — versioned so the scanner app can evolve the format.
- CODE128B encoder is pure TypeScript (107-entry pattern table + checksum). No native module. No library.
- Member card is fetched lazily (only when modal opens, only once per session). Result cached in screen local state.
- `MemberCodeModal` is a pure presentation component — no API calls, no context reads, no business logic.

**Why it matters**

The previous version had `MOCK_MEMBER_CODE` imported directly into the screen and the modal. The new version has a proper layer boundary: screen → service → mock/API. When the backend migration runs, only `memberService.ts` changes — no UI code needs to be touched.

---

### `f6285d9` — Fix Metro bundler 500 error (react-native-svg incompatible with Expo SDK 54 managed workflow)

**Problem**

`react-native-svg` 15.12.1 sets its `react-native` package.json field to `src/index.ts` (source TypeScript). Metro processes this source, which chains to `src/elements/Shape.tsx`, which imports `SvgTouchableMixin`. That file in turn tries to use `Touchable` from React Native via a path that Metro could not resolve in the Expo Go managed-workflow bundler.

Error message seen: `UnableToResolveError: Unable to resolve module …/lib/SvgTouchableMixin from …/react-native-svg/src/elements/Shape.tsx`

**Fix**

Removed `react-native-svg` and `react-native-qrcode-svg` entirely. Replaced with `qrcode` (pure JS, zero native modules):
- `QRCodeView`: calls `QRCodeLib.create()` synchronously inside `useMemo`, builds `boolean[][]` matrix, renders each cell as a `<View>`. Produces a real, scannable QR code.
- `MockBarcode`: was already pure Views — unchanged.

**Why pure-JS is better here**

Expo Go managed workflow does not support arbitrary native modules without a custom development client (EAS build). Pure-JS libraries work in both Expo Go AND production EAS builds with zero configuration.

**Files changed**

- `src/components/MemberCodeModal.tsx` — removed SVG imports, rewrote `QRCodeView`
- `package.json` — removed `react-native-svg`, `react-native-qrcode-svg`; added `qrcode`, `@types/qrcode`

---

### `9881f25` — Merge claude/elastic-driscoll-b2d95b into master (conflict resolution)

**Conflict cause**

Master had a parallel commit (`397e916`) from the user that added:
- `src/components/ScanButton.tsx` with `ScanButtonV1` and `ScanButtonV2` (elaborate QR icon designs)
- `Section.tsx` with `headerRight` prop (named differently from the branch's `rightAction`)
- `CustomerPointsScreen.tsx` already wired `ScanButtonV1` into the `Section` header

The branch added:
- `MemberCodeModal.tsx` (the bottom sheet — missing from master)
- `CustomerPointsScreen.tsx` with `QrIconButton` (simpler, View-only icon)
- `Section.tsx` with `rightAction` prop

**Resolution strategy**

| File | Decision | Reason |
|---|---|---|
| `Section.tsx` | Kept master's `headerRight` prop and `titleRow` layout | Already live on master, `ScanButton.tsx` depends on it |
| `CustomerPointsScreen.tsx` | Used master's `ScanButtonV1` icon; kept branch's modal state + `MemberCodeModal` | `ScanButtonV1` is the better icon design; modal is the missing piece from master |
| `MemberCodeModal.tsx` | Kept in full | This was the whole point of the branch — master had no modal at all |
| `package.json` / `lock` | Installed `react-native-qrcode-svg` + `react-native-svg` in main repo (branch had them in worktree only) | Needed for TypeScript to compile |

---

### `88fe67e` — Add member code modal with barcode and QR to My Points card

**First implementation of member card feature**

- Installed `react-native-qrcode-svg` and `react-native-svg` (later replaced — see `f6285d9`)
- Added `rightAction` prop to `Section.tsx`
- Created `MemberCodeModal.tsx` with SVG-based barcode + real QR code
- Added `QrIconButton` (3×3 View-grid icon) in `CustomerPointsScreen`
- Mock member code: `SCM-POINT-v1-A1B2C3D4`

**Note**: This commit introduced the `react-native-svg` dependency that later caused Metro errors in Expo Go. Fixed in `f6285d9`.

---

### `397e916` — User commit: adding mock QR generating button (master branch)

User independently implemented a QR icon button on master while the worktree branch was in progress. Added:
- `src/components/ScanButton.tsx` — `ScanButtonV1` (QR finder-square icon) + `ScanButtonV2` (barcode-with-corners icon)
- `src/components/CustomerDrawer.tsx` — slide-out customer navigation drawer
- `Section.tsx` — `headerRight` prop
- `CustomerPointsScreen.tsx` — `ScanButtonV1` wired to `headerRight` (no modal yet)

---

### Earlier commits (pre-member-card session)

| Commit | Description |
|---|---|
| `c0c860c` | Add jest ignore patterns + update worktree pointer |
| `2fb95f3` | Merge claude/magical-varahamihira-96421a into master |
| `1351021` | Refactor, validation, tests, and premium theme |
| `673f479` | Input validation |
| `c95b65b` | Refactoring |

---

## Recording rule for future agents and developers

When you make any change — no matter how small — add an entry to this file in the same commit. Use this template:

```markdown
### `<short-hash>` — <one-line summary>

**What changed**
- bullet list of files + what exactly changed in each

**Why**
- one paragraph explaining the decision or the bug

**Impact**
- what breaks if you revert this / what depends on it
```

If you are fixing a bug, also note:
- Root cause
- How it was diagnosed
- Why this fix and not another approach
