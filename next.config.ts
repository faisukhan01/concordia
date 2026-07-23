import type { NextConfig } from "next";

// ─────────────────────────────────────────────────────────────────────────
// Security headers — applied to EVERY response (pages + assets + API).
// These complement the runtime checks in src/middleware.ts and the
// server-side RBAC in src/lib/server/auth.ts.
// ─────────────────────────────────────────────────────────────────────────
const securityHeaders = [
  // Prevent clickjacking — this app must NEVER be framed.
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information leakage.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 1 year (including subdomains). Vercel already enforces
  // HTTPS at the edge, but this belt-and-braces header protects any direct
  // origin access.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Lock down browser features — no camera/mic/geolocation/USB access needed.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), usb=(), magnetometer=(), gyroscope=()",
  },
  // Content Security Policy — restricts where scripts/styles/fonts/images
  // can load from. 'unsafe-inline' + 'unsafe-eval' are required for Next.js
  // dev mode + styled-components style injection; 'unsafe-eval' is needed
  // because Next.js 16 App Router uses eval for source maps in dev.
  // In production builds the runtime is CSP-friendly.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  // Cross-Origin policies — isolate the app from cross-origin documents.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
