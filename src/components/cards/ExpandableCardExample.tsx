import React from 'react';
import { ExpandableCard } from './ExpandableCard';

/**
 * Example usage of the ExpandableCard component
 * Demonstrates different configurations and content types
 */

export const ExpandableCardExample: React.FC = () => {
  return (
    <div style={{ display: 'grid', gap: '16px', maxWidth: '800px', margin: '0 auto', padding: '24px' }}>

      {/* Example 1: Basic Card with Highlights */}
      <ExpandableCard
        title="Luxury Amenities"
        summary="Click to see all available amenities in our studios"
        highlights={[
          'Free high-speed WiFi',
          'Smart home integration',
          'Climate control system',
          'Premium bedding & linens',
          'Modern kitchen appliances',
        ]}
      />

      {/* Example 2: Card with Extra Content */}
      <ExpandableCard
        title="Booking Availability"
        summary="Check our current availability and booking options"
        highlights={[
          'Real-time availability calendar',
          'Instant booking confirmation',
          'Flexible cancellation policy',
          'Monthly discounts available',
        ]}
      >
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Peak Season:</strong> December - March (30% premium)
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Off Season:</strong> April - November (standard rates)
          </p>
          <p style={{ margin: '0' }}>
            Book 3+ months in advance for special group rates.
          </p>
        </div>
      </ExpandableCard>

      {/* Example 3: Features Card */}
      <ExpandableCard
        title="Premium Features"
        summary="Discover what makes our studio rentals unique"
        highlights={[
          'Professional photography setup',
          'Fiber optic internet (1Gbps)',
          '4K Smart TV & streaming',
          'Adjustable LED lighting',
          '24/7 security monitoring',
        ]}
      >
        <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '4px' }}>
          <p style={{ margin: '0', fontSize: '13px', color: '#555' }}>
            All studios are fully equipped for content creators, remote work, and comfortable living.
            Our 24/7 support team is here to assist you.
          </p>
        </div>
      </ExpandableCard>

      {/* Example 4: Minimal Card */}
      <ExpandableCard
        title="Quick Facts"
        summary="Essential information at a glance"
        highlights={[
          'Located in downtown Dubai',
          'Walking distance to metro',
          'Pet-friendly',
          'No hidden fees',
        ]}
      />

    </div>
  );
};
