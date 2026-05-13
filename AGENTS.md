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

- `App.tsx`: oversized and stateful; easiest place to break unrelated flows
- `src/lib/api.ts`: central request behavior; any change affects all backend calls
- `src/lib/auth.ts`: provider auth assumptions and redirect handling
- `.github/workflows/eas-build.yml`: deployment/build path

## Safe verification baseline

```powershell
npx tsc --noEmit
```

If Android emulator access is available, also manually verify the main customer flow in Expo Go.
