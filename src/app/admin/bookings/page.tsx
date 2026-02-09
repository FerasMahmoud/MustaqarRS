import { Suspense } from 'react';
import AdminBookingsContent from './content';

// Prevent prerendering for protected admin pages
export const dynamic = 'force-dynamic';

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A96E] mx-auto mb-4"></div>
            <p className="text-[#2D2D2D]">Loading bookings...</p>
          </div>
        </div>
      }
    >
      <AdminBookingsContent />
    </Suspense>
  );
}
