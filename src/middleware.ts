import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────
// Next.js Middleware — server-side request gate that runs BEFORE the route
// handler. Two responsibilities:
//
//   1. API protection (defense-in-depth):
//      Every /api/* request EXCEPT the public auth routes must carry an
//      Authorization: Bearer <token> header. Requests without one are
//      rejected with 401 here, before the handler is even invoked. The
//      actual session validation still happens in requireAuth() inside
//      the handler — this layer just catches obviously-unauthenticated
//      traffic early and reduces handler log noise.
//
//   2. Security headers:
//      next.config.ts headers() already applies these to all responses,
//      but middleware re-asserts them as a belt-and-braces measure so
//      they're guaranteed present even on error responses / edge cases.
//
// AUTH MODEL NOTE:
//   This app uses Bearer-token auth (Authorization header), NOT cookies.
//   The token is stored client-side in sessionStorage and attached to
//   every API call by src/lib/api.ts. Because tokens are NOT auto-attached
//   by the browser (unlike cookies), CSRF is inherently mitigated — an
//   attacker site cannot forge a request with the victim's token.
// ─────────────────────────────────────────────────────────────────────────

// Public API routes that do NOT require an Authorization header.
const PUBLIC_API_ROUTES = new Set([
  "/api/auth/login",
  "/api/auth/super-admin-login",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. API protection ────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const isPublic = PUBLIC_API_ROUTES.has(pathname);
    if (!isPublic) {
      const auth = req.headers.get("authorization") || "";
      if (!auth.startsWith("Bearer ") || auth.length < 20) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }
  }

  // ── 2. Re-assert security headers on the response ─────────────────────
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), usb=()"
  );
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return res;
}

// Only run middleware on API routes + the single page route. Skip static
// assets (_next/static, images, favicons) to keep the edge function fast.
export const config = {
  matcher: ["/api/:path*", "/"],
};
