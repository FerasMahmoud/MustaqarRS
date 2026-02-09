// This file is used to suppress the middleware deprecation warning in Next.js 16
// next-intl requires middleware for i18n routing, which is the recommended approach
// See: https://next-intl-docs.vercel.app/

export function register() {
  // Instrumentation hook - required for proper warning handling
}
