import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://10.236.231.218",
    "http://10.236.231.218:3000",
    "http://10.236.231.218:3001",
  ],
  async headers() {
    // Keep CSP minimal to avoid breaking Next assets. Tighten further when ready.
    const csp = [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable powerful APIs by default
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "payment=()",
              "usb=()",
              "interest-cohort=()",
            ].join(", "),
          },
          // Start with enforced CSP; if this causes issues, switch to Content-Security-Policy-Report-Only.
          {
            key: "Content-Security-Policy",
            value: csp
              .replace(
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com"
              )
              .replace(
                "connect-src 'self'",
                "connect-src 'self' https://assets6.lottiefiles.com"
              )
              .replace(
                "img-src 'self' data: blob:",
                "img-src 'self' data: blob: https://assets6.lottiefiles.com"
              ),
          },
        ],
      },
      {
        source: "/(.*)",
        has: [{ type: "host", value: "localhost(:\\d+)?" }],
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/(.*)",
        has: [{ type: "host", value: "127.0.0.1(:\\d+)?" }],
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
