import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100',
  },
  images: {
    // Allow placeholder hero photos from Unsplash until the real
    // car-rental imagery lands.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
    ],
  },
};

export default config;
