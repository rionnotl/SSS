# 音楽SNS

A Japanese music-sharing social network where users post and discover songs they love — with support for Spotify links, YouTube links, or manual text entry.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/music-sns run dev` — run the frontend (port 24850)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `SESSION_SECRET` — secret for express-session (already set)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + better-sqlite3 (SQLite) + express-session + bcryptjs
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui + TanStack Query + wouter
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation
- `artifacts/api-server/src/` — Express backend
- `artifacts/api-server/src/lib/sqlite.ts` — SQLite setup + schema + seed data
- `artifacts/api-server/src/routes/` — auth, posts, users, stats route handlers
- `artifacts/api-server/data/music.db` — SQLite database file
- `artifacts/music-sns/src/` — React frontend
- `artifacts/music-sns/src/pages/` — timeline, login, register, profile pages
- `artifacts/music-sns/src/components/` — PostCard, CreatePostModal, Layout, NavBar, etc.

## Architecture decisions

- SQLite via better-sqlite3 instead of PostgreSQL — simpler setup, no DATABASE_URL needed, fast for this use case
- Session-based auth (express-session, memory store) — username + password only, no email
- bcryptjs for password hashing
- Dark theme forced always (no light mode toggle) — `dark` class added in main.tsx
- API is contract-first: OpenAPI spec → codegen → typed hooks used everywhere

## Product

- **タイムライン**: Scrolling feed of all users' song posts, newest first, with trending mood tags
- **投稿作成**: Floating compose button opens a sheet to post songs via YouTube/Spotify URL or manual entry, with optional mood tags (#感動 #テンション上がる etc.) and a 140-char message
- **プロフィール**: Per-user profile page with bio editing, post count, and all their posts
- **認証**: Username + password registration and login, session-based

## Seed data

3 demo users seeded with password `password123`:
- `haru_music`, `neon_beats`, `sakura_tunes`

## Gotchas

- `better-sqlite3` requires the `onlyBuiltDependencies` entry in `pnpm-workspace.yaml` to compile its native addon
- Session cookies use `sameSite: "lax"` in dev and `"none"` in production (required for cross-origin proxy setup)
- `dark` variant in Tailwind v4 cannot be used with `@apply` — set `document.documentElement.classList.add("dark")` in main.tsx instead

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
