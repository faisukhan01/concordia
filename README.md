# Concordia College — Management Portal

A production-ready, role-based management platform for Concordia College.
Built with Next.js 16, TypeScript, and Tailwind CSS 4. Single-institution
deployment — Concordia is THE institute, with one main campus and seven
role-based portals.

**Live:** [concordia-eight.vercel.app](https://concordia-eight.vercel.app)

---

## Tech Stack

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| Framework    | Next.js 16 (App Router) + React 19                    |
| Language     | TypeScript 5 (strict)                                 |
| Styling      | Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons  |
| Database     | Prisma ORM — Turso (libSQL) prod, local SQLite dev    |
| Auth         | Bearer-token sessions, server-side RBAC, edge middleware |
| State        | Zustand (client) + TanStack Query (server)            |
| Animations   | Framer Motion                                         |
| Deployment   | Vercel                                                |

## Role-Based Portals

| Role         | Scope                                         |
| ------------ | --------------------------------------------- |
| Super Admin  | Product owner — college-wide oversight        |
| Admin        | College operations, staff, announcements      |
| Admissions   | Student admissions, applications              |
| Accountant   | Fees, invoices, finance                       |
| Academic     | Classes, courses, timetable, results          |
| Teacher      | Classes, attendance, diary, course materials  |
| Student      | Attendance, results, timetable, fees, diary   |

## Default Accounts

Default accounts are **seeded automatically** on first database init.
Passwords are read from environment variables — see `.env.example`.

| Role         | Email                          | Env var                          |
| ------------ | ------------------------------ | -------------------------------- |
| Super Admin  | faisu577277@gmail.com          | `SEED_PASSWORD_SUPER_ADMIN`      |
| Admin        | admin@concordia.edu.pk         | `SEED_PASSWORD_ADMIN`            |
| Admissions   | admissions@concordia.edu.pk    | `SEED_PASSWORD_ADMISSIONS`       |
| Accountant   | accountant@concordia.edu.pk    | `SEED_PASSWORD_ACCOUNTANT`       |
| Academic     | academics@concordia.edu.pk     | `SEED_PASSWORD_ACADEMIC`         |

**Production deployments must set all `SEED_PASSWORD_*` env vars** to strong,
unique values. If unset, a development fallback is used (suitable for local
dev only — never for production).

All seeded users are prompted to change their password on first login
(`mustChangePassword` flag).

## Getting Started

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env
# Edit .env — set TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, and all SEED_PASSWORD_* vars

# 3. Push database schema
bun run db:push

# 4. Start dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes (catch-all handler)
│   ├── download/             # Mobile APK download page
│   ├── globals.css           # Tailwind + theme tokens
│   ├── layout.tsx            # Root layout
│   └── page.tsx             # Single route — switches login/portal
├── components/
│   ├── auth/                 # Sign-in page
│   ├── brand-logo.tsx        # Concordia logo
│   ├── onboarding/           # First-visit tooltips
│   ├── portal/               # 7 role portals + shared shell
│   └── ui/                   # shadcn/ui primitives
├── hooks/                    # use-mobile, use-toast
├── lib/
│   ├── api.ts                # Typed API client (frontend)
│   ├── db.ts                 # Prisma client
│   ├── role-modules.ts       # Per-role sidebar definitions
│   ├── server/               # Server-only code
│   │   ├── auth.ts           # Bearer-token sessions + requireRole RBAC
│   │   ├── db.ts             # DB init, seed, schema
│   │   └── handler.ts        # Express-style API handler
│   ├── store.ts              # Zustand store
│   └── utils.ts              # cn() + helpers
├── middleware.ts             # Edge middleware — API auth gate + security headers
prisma/
└── schema.prisma             # Prisma schema (Turso/libSQL)
public/                       # Static assets (logos, campus photo)
```

## Architecture Notes

- **Single route.** The entire app renders at `/`. The view (login →
  portal) is driven by the Zustand store, not URL routing. This keeps
  the auth flow seamless and avoids SSR hydration complexity. The
  tradeoff (no deep-linking to specific portal sub-pages) is acceptable
  for this use case because each portal is role-gated and personalized.
- **API catch-all.** All API requests flow through `src/app/api/[...path]/route.ts`
  into a single Express-style handler in `src/lib/server/handler.ts`. A
  single handler keeps the RBAC logic, error handling, and session
  validation in one audited place.
- **Bearer-token auth.** Sessions are server-issued random tokens stored
  in the `sessions` table, sent by the client in the `Authorization`
  header. Because the browser does NOT auto-attach bearer tokens (unlike
  cookies), CSRF is inherently mitigated — no CSRF token needed.
- **Defense in depth.** Three layers protect every API call:
  1. `src/middleware.ts` — edge gate rejects requests with no/short
     `Authorization` header before the handler runs.
  2. `requireAuth(req)` — validates the token against the `sessions`
     table and loads the user record on every protected handler.
  3. `requireRole(user, ...roles)` — enforces role-based access on
     privileged endpoints.
- **Role equivalence.** Legacy roles (`institute-admin`, `branch-manager`)
  are mapped to their Concordia equivalents in `src/lib/server/auth.ts` so
  the access-control layer stays clean.
- **No dummy data.** Every portal fetches live data from the API. Seed data
  is limited to the default accounts above.
- **Server-only SDK.** `z-ai-web-dev-sdk` (and any AI/DB secrets) is
  imported only in `src/lib/server/*` — never in client components.

## Security

See [SECURITY.md](./SECURITY.md) for the full security posture, including
the auth model, rate limiting, security headers, and production hardening
checklist.

## Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `bun run dev`        | Start dev server on port 3000        |
| `bun run build`      | Production build                     |
| `bun run start`      | Start production server              |
| `bun run lint`       | ESLint                               |
| `bun run db:push`    | Push Prisma schema to database       |
| `bun run db:generate`| Generate Prisma client               |

## License

Proprietary — Concordia College. All rights reserved. See [LICENSE](./LICENSE).
