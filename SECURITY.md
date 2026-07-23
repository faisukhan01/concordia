# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:
**Email:** faisu577277@gmail.com
Please do NOT open a public GitHub issue for security vulnerabilities.

---

## Authentication & Authorization Model

### Bearer-Token Sessions (not cookies)

This application uses **bearer-token authentication**, not cookie-based
sessions:

1. On login, the server issues a cryptographically-random session token
   (`crypto.randomBytes(32)`) and stores it in the `sessions` table with
   an 8-hour TTL.
2. The client stores the token in `sessionStorage` (per-tab) and attaches
   it to every API request via the `Authorization: Bearer <token>` header.
3. On logout, the session row is deleted server-side.

**Why bearer tokens, not cookies?**

- **CSRF is inherently mitigated.** Browsers auto-attach cookies to every
  cross-site request, which is the root cause of CSRF. Bearer tokens must
  be explicitly attached by application code, so an attacker site cannot
  forge a request with the victim's token. No CSRF token or SameSite
  cookie attribute needed.
- **No cookie-flag misconfiguration risk.** There are no cookies to
  misconfigure (HttpOnly, Secure, SameSite, Domain, Path).

### Defense in Depth — Three Layers

Every protected API call passes through three independent security checks:

| Layer | File | Responsibility |
|-------|------|----------------|
| 1. Edge middleware | `src/middleware.ts` | Rejects requests with no/short `Authorization` header before the handler runs. Reduces log noise and blocks obviously-unauthenticated traffic. |
| 2. Session validation | `src/lib/server/auth.ts` → `requireAuth()` | Validates the token against the `sessions` table, checks expiry, loads the user record, and verifies the user/institute/branch is not blocked. |
| 3. Role-based access | `src/lib/server/auth.ts` → `requireRole()` | Enforces that the user's role (or role-equivalent) is permitted for the endpoint. |

### Rate Limiting

Login attempts are rate-limited in-memory:
- **10 failed attempts** per identifier (email + IP) before lockout.
- **2-minute lockout** after exceeding the threshold.
- Locks auto-clear after expiry.

### Session Management

- Sessions expire after **8 hours** of inactivity.
- Expired sessions are periodically purged from the database (every 10 min).
- Blocking a user/institute/branch cascades — all their active sessions
  are deleted immediately, forcing re-authentication.

---

## Security Headers

Applied to every response via `next.config.ts` `headers()` and re-asserted
in `src/middleware.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS for 1 year |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), usb=()` | Lock down browser features |
| `Content-Security-Policy` | `default-src 'self'; frame-ancestors 'none'; ...` | Restrict resource loading |
| `Cross-Origin-Opener-Policy` | `same-origin` | Cross-origin isolation |

---

## Secret Management

- **Server-only SDKs.** `z-ai-web-dev-sdk` and all database credentials
  are imported only in `src/lib/server/*` — never in client components.
  Next.js tree-shaking ensures these never reach the client bundle.
- **Environment variables.** All secrets live in environment variables
  (`.env` locally, Vercel project settings in production). The `.env`
  file is gitignored and never committed.
- **Seed passwords** are read from `SEED_PASSWORD_*` env vars. Production
  deployments must set these to strong, unique values. A development
  fallback exists for local dev only.

---

## Production Hardening Checklist

Before going live with real student data:

- [ ] Set all `SEED_PASSWORD_*` env vars to strong, unique passwords in Vercel.
- [ ] Log in as each default account and change the password immediately.
- [ ] Confirm all `mustChangePassword` flags are honored (the UI forces a
      password change on first login).
- [ ] Verify security headers are present on production responses:
  ```bash
  curl -sI https://concordia-eight.vercel.app | grep -iE "x-frame|strict-transport|content-security"
  ```
- [ ] Review Vercel access logs for unauthorized access patterns.
- [ ] Rotate the Turso auth token if it was ever exposed.
- [ ] Set up database backups via Turso's built-in replication.

---

## Known Architectural Tradeoffs

These are documented for transparency — they are intentional design
decisions, not oversights:

1. **Single-route SPA (`/`).** The app renders at one URL and drives
   views via Zustand state. Tradeoff: no deep-linking to specific portal
   sub-pages. Accepted because each portal is role-gated and personalized;
   deep-linking adds little value. All data access is still protected by
   server-side RBAC regardless of client state.

2. **Catch-all API handler.** All `/api/*` routes flow through one
   Express-style handler. Tradeoff: less granular per-route middleware
   than dedicated route handlers. Accepted because it keeps RBAC, session
   validation, and error handling in one audited location.

3. **Custom session management.** Sessions use a custom `sessions` table
   rather than an audited framework (NextAuth, Clerk). Tradeoff: less
   community-reviewed code. Accepted because the implementation is small,
   well-understood, and avoids the cookie/CSRF complexity that frameworks
   introduce. The defense-in-depth layers above mitigate the risk.

These tradeoffs can be revisited if the threat model changes (e.g.
multi-tenant SaaS, public API access, compliance certifications).
