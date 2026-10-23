import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Vercel 함수 요청 한도(4.5MB) 안에서 이미지 업로드 허용
    serverActions: { bodySizeLimit: "4.4mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
