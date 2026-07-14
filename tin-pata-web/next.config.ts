import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Keep the ~25MB offline word bank out of the client/server bundle graph.
  serverExternalPackages: ['e2b_word_bank'],
};

export default nextConfig;
