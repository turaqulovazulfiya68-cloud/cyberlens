# Project memory

## Product intent & audience

- **CyberLens**: cybersecurity analysis/scanning application with file upload and API-driven scanning features.
- Audience: security analysts/users performing cybersecurity scans and reviewing results.
- Deployed via Bolt hosting; must work independently of Bolt Preview environment.

## Brand personality & voice

- Dark cybersecurity aesthetic; professional, technical, security-focused tone.
- Preserve existing visual identity — no redesign permitted.

## Visual design & UX direction

- Dark theme with cybersecurity color palette (preserve existing colors/layout).
- Responsive: must work on desktop and mobile.
- Error and loading states required so UI never shows a permanent blank screen.
- Multi-route SPA with Navbar, SettingsView, and scanner views.

## Decisions, constraints & rationale

- **`vite.config.ts` base path**: changed from `/cyberlens/` to `./` (relative) because published host serves from root; absolute base caused all asset 404s → white screen.
- **Supabase client (`src/lib/supabase.ts`)**: returns a safe stub client when env vars are missing instead of calling `createClient(undefined, undefined)` which throws at module load and crashes app before React renders.
- **Error boundary (`src/components/ErrorBoundary.tsx`)**: wraps app in `main.tsx` as safety net for unexpected render errors; includes reload button.
- **Scanner (`src/lib/scanner.ts`)**: fixed pre-existing type error (wrong arg count in `finalize` call).
- Vite build uses esbuild and ignores TypeScript type errors; `npm run typecheck` is separate and must pass.
- Do NOT redesign, remove features, delete files, or replace project with a new template.

## Open questions & assumptions

- Supabase environment variables (URL + anon key) are not present in local `.env`; production deployment may also lack them — stub fallback prevents crash but real backend won't function until configured.
- Whether env vars need to be set on the bolt.host deployment platform is unresolved.
- Full route set beyond Navbar/SettingsView/scanner not fully enumerated.