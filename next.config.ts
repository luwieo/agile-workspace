import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tldraw is ESM-only and ships its own CSS — Next.js must transpile it
  // or the canvas renders blank (styles not processed, JS not bundled).
  transpilePackages: [
    'tldraw',
    '@tldraw/editor',
    '@tldraw/tldraw',
    '@tldraw/tlschema',
    '@tldraw/utils',
    '@tldraw/validate',
    '@tldraw/store',
    '@tldraw/assets',
    '@tldraw/driver',
    '@tldraw/state',
    '@tldraw/state-react',
  ],
};

export default nextConfig;
