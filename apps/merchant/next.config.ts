import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@airrand/contracts"],
};

export default nextConfig;
