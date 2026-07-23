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
| Auth         | Cookie-session, role-based access control             |
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

All default passwords are `concordia123`. Users are prompted to change
their password on first login.

| Role         | Email                          |
| ------------ | ------------------------------ |
| Super Admin  | faisu577277@gmail.com          |
| Admin        | admin@concordia.edu.pk         |
| Admissions   | admissions@concordia.edu.pk    |
| Accountant   | accountant@concordia.edu.pk    |
| Academic     | academics@concordia.edu.pk     |
| Teacher      | teacher@concordia.edu.pk       |
| Student      | student@concordia.edu.pk       |

## Getting Started

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env
# Edit .env — set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for production
# (falls back to local SQLite automatically in dev)

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
│   └── page.tsx             # Single route — switches landing/login/portal
├── components/
│   ├── auth/                 # Sign-in page
│   ├── brand-logo.tsx        # Concordia logo
│   ├── landing/              # Marketing landing page
│   ├── onboarding/           # First-visit tooltips
│   ├── portal/               # 7 role portals + shared shell
│   └── ui/                   # shadcn/ui primitives
├── hooks/                    # use-mobile, use-toast
└── lib/
    ├── api.ts                # Typed API client (frontend)
    ├── db.ts                 # Prisma client
    ├── modules.ts            # Module metadata (landing page)
    ├── role-modules.ts       # Per-role sidebar definitions
    ├── server/               # Server-only code
    │   ├── auth.ts           # Role equivalence + requireRole
    │   ├── db.ts             # DB init, seed, schema
    │   └── handler.ts        # Express-style API handler
    ├── store.ts              # Zustand store
    └── utils.ts              # cn() + helpers
prisma/
└── schema.prisma             # Prisma schema (Turso/libSQL)
public/                       # Static assets (logos, campus photo)
```

## Architecture Notes

- **Single route.** The entire app renders at `/`. The view (landing →
  login → portal) is driven by the Zustand store, not URL routing. This
  keeps the auth flow seamless and avoids SSR hydration complexity.
- **API catch-all.** All API requests flow through `src/app/api/[...path]/route.ts`
  into a single Express-style handler in `src/lib/server/handler.ts`.
- **Role equivalence.** Legacy roles (`institute-admin`, `branch-manager`)
  are mapped to their Concordia equivalents in `src/lib/server/auth.ts` so
  the access-control layer stays clean.
- **No dummy data.** Every portal fetches live data from the API. Seed data
  is limited to the 7 default accounts above.
- **Server-only SDK.** `z-ai-web-dev-sdk` (and any AI/DB secrets) is
  imported only in `src/lib/server/*` — never in client components.

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

Proprietary — Concordia College. All rights reserved.
