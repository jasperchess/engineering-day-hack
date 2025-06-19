import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Configure API routes with security and size limits
  async headers() {
    return [
      {
        source: "/api/files",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
  // Set server-side limits
  serverRuntimeConfig: {
    maxFileSize: 2 * 1024 * 1024, // 10MB
  },
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

export default nextConfig;
