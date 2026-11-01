const ADMIN = (process.env.NEXT_PUBLIC_ADMIN_PATH || "admin").replace(/^\/+|\/+$/g, "") || "admin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async rewrites() {
    // Path rahasia dashboard diteruskan ke halaman /admin di dalam aplikasi.
    if (ADMIN === "admin") return [];
    return { beforeFiles: [{ source: `/${ADMIN}/:path*`, destination: "/admin/:path*" }] };
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
      {
        source: `/${ADMIN}/:path*`,
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
