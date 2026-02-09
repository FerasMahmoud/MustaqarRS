/**
 * Analytics utility functions for tracking events
 * Supports Google Analytics 4 (GA4) event tracking
 */

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Track a custom event in Google Analytics 4
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

/**
 * Track page view (useful for SPA navigation)
 */
export function trackPageView(url: string, title?: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: url,
      page_title: title,
    });
  }
}

// ===== Booking Flow Events =====

/**
 * Track when a user starts the booking process
 */
export function trackBookingStart(roomId: string, roomName: string, locale: string): void {
  trackEvent('booking_start', {
    room_id: roomId,
    room_name: roomName,
    locale,
    event_category: 'booking',
    event_label: roomName,
  });
}

/**
 * Track when a user completes a booking step
 */
export function trackBookingStepComplete(
  stepNumber: number,
  stepName: string,
  roomId: string
): void {
  trackEvent('booking_step_complete', {
    step_number: stepNumber,
    step_name: stepName,
    room_id: roomId,
    event_category: 'booking',
    event_label: `Step ${stepNumber}: ${stepName}`,
  });
}

/**
 * Track payment method selection
 */
export function trackPaymentMethodSelected(
  method: 'stripe' | 'bank_transfer',
  roomId: string,
  amount: number
): void {
  trackEvent('payment_method_selected', {
    payment_method: method,
    room_id: roomId,
    value: amount,
    currency: 'SAR',
    event_category: 'booking',
    event_label: method,
  });
}

/**
 * Track booking completion (conversion event)
 */
export function trackBookingComplete(
  bookingId: string,
  roomId: string,
  roomName: string,
  totalAmount: number,
  paymentMethod: string,
  durationMonths: number
): void {
  // Track as purchase event for GA4 ecommerce
  trackEvent('purchase', {
    transaction_id: bookingId,
    value: totalAmount,
    currency: 'SAR',
    items: [
      {
        item_id: roomId,
        item_name: roomName,
        quantity: durationMonths,
        price: totalAmount / durationMonths,
      },
    ],
  });

  // Also track as custom booking_complete event
  trackEvent('booking_complete', {
    booking_id: bookingId,
    room_id: roomId,
    room_name: roomName,
    total_amount: totalAmount,
    payment_method: paymentMethod,
    duration_months: durationMonths,
    event_category: 'booking',
    event_label: `${roomName} - ${durationMonths} months`,
  });
}

/**
 * Track booking abandonment
 */
export function trackBookingAbandoned(
  stepNumber: number,
  roomId: string,
  roomName: string
): void {
  trackEvent('booking_abandoned', {
    step_number: stepNumber,
    room_id: roomId,
    room_name: roomName,
    event_category: 'booking',
    event_label: `Abandoned at step ${stepNumber}`,
  });
}

// ===== Contact & Lead Events =====

/**
 * Track contact form submission
 */
export function trackContactSubmit(source: string): void {
  trackEvent('contact_form_submit', {
    event_category: 'engagement',
    event_label: source,
  });
}

/**
 * Track newsletter signup
 */
export function trackNewsletterSignup(): void {
  trackEvent('newsletter_signup', {
    event_category: 'engagement',
    event_label: 'footer',
  });
}

// ===== Engagement Events =====

/**
 * Track room view
 */
export function trackRoomView(roomId: string, roomName: string): void {
  trackEvent('view_item', {
    items: [
      {
        item_id: roomId,
        item_name: roomName,
      },
    ],
    event_category: 'engagement',
    event_label: roomName,
  });
}

/**
 * Track image gallery interaction
 */
export function trackGalleryView(roomId: string, imageIndex: number): void {
  trackEvent('gallery_view', {
    room_id: roomId,
    image_index: imageIndex,
    event_category: 'engagement',
  });
}

/**
 * Track external link click (e.g., WhatsApp)
 */
export function trackOutboundClick(url: string, label: string): void {
  trackEvent('click', {
    event_category: 'outbound',
    event_label: label,
    link_url: url,
  });
}
