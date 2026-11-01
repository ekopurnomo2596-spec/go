const LOGIN = (process.env.LOGIN_PATH || process.env.NEXT_PUBLIC_ADMIN_PATH || "").replace(/^\/+|\/+$/g, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async rewrites() {
    // Path login rahasia diteruskan ke halaman login di dalam aplikasi.
    if (!LOGIN) return [];
    return { beforeFiles: [{ source: `/${LOGIN}`, destination: "/admin/login" }] };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      ...(LOGIN ? [{ source: `/${LOGIN}`, headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "Cache-Control", value: "no-store" }] }] : []),
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
