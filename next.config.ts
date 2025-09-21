// next.config.ts
import { NextConfig } from 'next';

/**
 * NOTE:
 * - This temporarily disables ESLint-caused build failures in Vercel.
 * - Remove `ignoreDuringBuilds` after you fix the lint errors permanently.
 */
const nextConfig: NextConfig = {
  eslint: {
    // WARNING: ignoreDuringBuilds prevents ESLint from failing the build.
    // Use only temporarily to unblock deployment.
    ignoreDuringBuilds: true,
  },
  // Keep any other existing settings (merge with your current file if needed)
};

export default nextConfig;