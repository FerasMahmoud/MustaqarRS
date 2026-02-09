import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Security Headers Configuration
const securityHeaders = [
  {
    // Content Security Policy
    key: 'Content-Security-Policy',
    value: [
      // Default fallback
      "default-src 'self'",
      // Scripts: self, Stripe, Google Analytics, Vercel Analytics, and inline for Next.js
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com",
      // Styles: self and unsafe-inline for Tailwind CSS
      "style-src 'self' 'unsafe-inline'",
      // Images: self, data URIs, blobs, and allowed image hosts
      "img-src 'self' data: blob: https://a0.muscache.com https://ui-avatars.com https://studio-rentals.vercel.app https://maps.googleapis.com https://maps.gstatic.com https://*.google.com https://*.googleusercontent.com",
      // Fonts: self only
      "font-src 'self' data:",
      // Connect: self, Stripe API, n8n webhooks, Google Maps, Analytics, and external APIs
      "connect-src 'self' https://api.stripe.com https://primary-production-22d7.up.railway.app https://maps.googleapis.com https://api.textmebot.com https://www.google-analytics.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
      // Frame sources: Stripe for 3D Secure, Google Maps
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://maps.google.com https://www.google.com",
      // Object sources: none for security
      "object-src 'none'",
      // Base URI: self only
      "base-uri 'self'",
      // Form actions: self only
      "form-action 'self'",
      // Frame ancestors: none to prevent clickjacking (similar to X-Frame-Options)
      "frame-ancestors 'none'",
      // Upgrade insecure requests in production
      "upgrade-insecure-requests",
    ].join('; '),
  },
  {
    // Prevent clickjacking attacks
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Prevent MIME type sniffing
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Control referrer information
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Restrict browser features
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',
      'interest-cohort=()',
      'payment=(self)',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', '),
  },
  {
    // Enable XSS protection (legacy browsers)
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    // DNS prefetch control
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // Cache optimized images for 1 year
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a0.muscache.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'studio-rentals.vercel.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  // Enable React strict mode for better performance warnings
  reactStrictMode: true,
  // Compress output
  compress: true,
  // PoweredBy header is disabled by default
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Apply security headers to all routes
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
