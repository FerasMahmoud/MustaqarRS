export function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] pt-24 pb-12">
      <div className="geometric-pattern" />
      <div className="w-full px-[3%] relative z-10">
        {/* Back Link Skeleton */}
        <div className="h-6 w-32 bg-gray-200 rounded mb-8 animate-pulse" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Room Info Skeleton */}
          <div className="space-y-6">
            {/* Image Gallery Skeleton */}
            <div className="aspect-[16/9] bg-gray-200 rounded-xl animate-pulse" />

            {/* Room Details Card Skeleton */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              {/* Size Badge */}
              <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />

              {/* Title */}
              <div className="space-y-2">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>

              {/* Amenities Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Price Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-12 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form Skeleton */}
          <div className="space-y-6">
            {/* Progress Steps Skeleton */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
                  {i < 2 && <div className="w-8 h-1 bg-gray-200 animate-pulse" />}
                </div>
              ))}
            </div>

            {/* Form Content Skeleton */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Button Skeleton */}
              <div className="h-12 bg-gray-300 rounded-lg animate-pulse mt-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
