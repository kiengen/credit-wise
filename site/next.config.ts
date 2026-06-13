import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "creditcards.chase.com" },
      { protocol: "https", hostname: "ecm.capitalone.com" },
      { protocol: "https", hostname: "www.bankofamerica.com" },
      { protocol: "https", hostname: "icm.aexp-static.com" },
      { protocol: "https", hostname: "creditcards.wellsfargo.com" },
      { protocol: "https", hostname: "www.wellsfargo.com" },
    ],
  },
};

export default nextConfig;
