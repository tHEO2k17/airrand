import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const monorepoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: [
    "@airrand/contracts",
    "@airrand/domain",
    "@airrand/product-icons",
  ],
};

export default nextConfig;
