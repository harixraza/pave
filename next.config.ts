import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pave.gov.pk",
        pathname: "/landing/img/**",
      },
    ],
  },
};

export default nextConfig;
