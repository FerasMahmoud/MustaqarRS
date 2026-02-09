'use client';

import Script from 'next/script';

interface GoogleAnalyticsProps {
  measurementId?: string;
}

/**
 * Google Analytics 4 component
 *
 * Loads the gtag.js script and configures GA4 tracking.
 * Uses Next.js Script component with afterInteractive strategy
 * to load after the page becomes interactive without blocking render.
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  // Don't render if no measurement ID is provided
  if (!measurementId) {
    return null;
  }

  return (
    <>
      {/* Load gtag.js */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />

      {/* Initialize GA4 */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}

export default GoogleAnalytics;
