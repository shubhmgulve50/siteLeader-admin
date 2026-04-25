import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d1ee7knodiza2n.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "d3apo1dvh0os5u.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
