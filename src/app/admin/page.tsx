'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, TrendingDown, ArrowRight, Calendar, DollarSign, Users, Home, Loader2 } from 'lucide-react';
import { LiveActivity } from '@/components/admin/LiveActivity';

// Prevent prerendering for protected admin pages
export const dynamic = 'force-dynamic';

interface Stats {
  totalBookings: number;
  pendingPayments: number;
  revenue: number;
  occupancyRate: number;
  // Comparison data (this month vs last month)
  comparison?: {
    bookingsChange: number;
    revenueChange: number;
    occupancyChange: number;
  };
  recentBookings: Array<{
    id: string;
    guest_name: string;
    guest_email?: string;
    room_name: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    payment_status: string;
  }>;
}

interface SearchResult {
  id: string;
  guest_name: string;
  guest_email: string;
  room_name: string;
  status: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setSearchLoading(true);
      const response = await fetch(`/api/admin/bookings?search=${encodeURIComponent(query)}&limit=5`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data.bookings?.map((b: any) => ({
        id: b.id,
        guest_name: b.guest_name,
        guest_email: b.guest_email,
        room_name: b.room?.name || 'Studio',
        status: b.status,
      })) || []);
      setShowSearchDropdown(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchResultClick = (bookingId: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    router.push(`/admin/bookings/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A96E] mx-auto mb-4"></div>
          <p className="text-[#2D2D2D]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  const pendingCount = stats?.pendingPayments || 0;

  return (
    <div className="space-y-8">
      {/* Quick Search Bar */}
      <div className="relative">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#E8E3DB] p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355]" />
            <input
              type="text"
              placeholder="Search bookings by guest name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              className="w-full pl-12 pr-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] placeholder-[#8B7355]/60 focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
            />
            {searchLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C9A96E] animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#E8E3DB] z-50 overflow-hidden">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSearchResultClick(result.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors border-b border-[#E8E3DB] last:border-0"
                >
                  <div className="text-left">
                    <p className="font-medium text-[#2D2D2D]">{result.guest_name}</p>
                    <p className="text-sm text-[#8B7355]">{result.guest_email} • {result.room_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={result.status} paymentStatus="" />
                    <ArrowRight className="h-4 w-4 text-[#C9A96E]" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSearchDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#E8E3DB] z-50 p-4 text-center text-[#8B7355]">
              No bookings found for &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>

        {/* Click outside to close */}
        {showSearchDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSearchDropdown(false)}
          />
        )}
      </div>

      {/* Live Activity Widget */}
      <LiveActivity />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={<Calendar className="h-6 w-6" />}
          variant="gold"
          change={stats?.comparison?.bookingsChange}
        />
        <MetricCard
          title="Pending Payments"
          value={pendingCount}
          icon={<Users className="h-6 w-6" />}
          variant={pendingCount > 0 ? 'terracotta' : 'sage'}
          highlight={pendingCount > 0}
        />
        <MetricCard
          title="Revenue"
          value={`SAR ${(stats?.revenue || 0).toLocaleString('en-US')}`}
          icon={<DollarSign className="h-6 w-6" />}
          variant="sage"
          change={stats?.comparison?.revenueChange}
        />
        <MetricCard
          title="Occupancy Rate"
          value={`${(stats?.occupancyRate || 0).toFixed(1)}%`}
          icon={<Home className="h-6 w-6" />}
          variant="goldDark"
          change={stats?.comparison?.occupancyChange}
        />
      </div>

      {/* Pending Payments Alert */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-[#FFF5F0] to-[#FFF0E8] border-l-4 border-[#C97355] p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#C97355]/20 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#8B5A45]">Action Required</h3>
                <p className="text-[#A67355] mt-0.5">
                  {pendingCount} booking{pendingCount !== 1 ? 's' : ''} awaiting payment confirmation
                </p>
              </div>
            </div>
            <Link
              href="/admin/bookings?status=pending_payment"
              className="px-6 py-2.5 bg-gradient-to-r from-[#C97355] to-[#B86345] text-white rounded-xl font-semibold hover:from-[#D98365] hover:to-[#C97355] transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              Review Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E8E3DB]">
        <div className="bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8] px-6 py-4 border-b border-[#E8E3DB]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2D2D2D]">Recent Bookings</h2>
            <Link
              href="/admin/bookings"
              className="text-[#C9A96E] hover:text-[#B89A5F] font-semibold flex items-center gap-1 group"
            >
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {stats?.recentBookings && stats.recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAF7F2]/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#8B7355] uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#8B7355] uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#8B7355] uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#8B7355] uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#8B7355] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#8B7355] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E3DB]">
                {stats.recentBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-[#FFF9F0] transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#FAF7F2] text-[#2D2D2D] font-mono text-sm border border-[#E8E3DB]">
                        {booking.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#2D2D2D] font-medium">{booking.guest_name}</td>
                    <td className="px-6 py-4 text-[#2D2D2D]">{booking.room_name}</td>
                    <td className="px-6 py-4 text-[#8B7355] text-sm">
                      {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                      {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-[#2D2D2D] font-bold">
                      SAR {booking.total_amount.toLocaleString('en-US')}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={booking.status}
                        paymentStatus={booking.payment_status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Calendar className="h-12 w-12 text-[#E8E3DB] mx-auto mb-4" />
            <p className="text-[#8B7355]">No recent bookings</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          title="View All Bookings"
          description="Manage all customer bookings"
          icon={<Calendar className="h-7 w-7" />}
          href="/admin/bookings"
        />
        <QuickActionCard
          title="Room Calendar"
          description="Check room availability"
          icon={<Home className="h-7 w-7" />}
          href="/admin/calendar"
        />
        <QuickActionCard
          title="Customers"
          description="Manage customer information"
          icon={<Users className="h-7 w-7" />}
          href="/admin/customers"
        />
      </div>
    </div>
  );
}

// Brand color variants for MetricCard
const cardVariants = {
  gold: {
    bg: 'bg-gradient-to-br from-[#FAF7F2] to-[#FFF9F0]',
    border: 'border-[#C9A96E]',
    iconBg: 'bg-[#C9A96E]/20',
    iconColor: 'text-[#C9A96E]',
    valueColor: 'text-[#2D2D2D]',
  },
  goldDark: {
    bg: 'bg-gradient-to-br from-[#FAF7F2] to-[#F5F0E8]',
    border: 'border-[#B89355]',
    iconBg: 'bg-[#B89355]/20',
    iconColor: 'text-[#B89355]',
    valueColor: 'text-[#2D2D2D]',
  },
  sage: {
    bg: 'bg-gradient-to-br from-[#F0F9F4] to-[#E8F5EC]',
    border: 'border-[#5B8A6B]',
    iconBg: 'bg-[#5B8A6B]/20',
    iconColor: 'text-[#5B8A6B]',
    valueColor: 'text-[#2D2D2D]',
  },
  terracotta: {
    bg: 'bg-gradient-to-br from-[#FFF5F0] to-[#FFF0E8]',
    border: 'border-[#C97355]',
    iconBg: 'bg-[#C97355]/20',
    iconColor: 'text-[#C97355]',
    valueColor: 'text-[#2D2D2D]',
  },
};

function MetricCard({
  title,
  value,
  icon,
  variant = 'gold',
  highlight = false,
  change,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: keyof typeof cardVariants;
  highlight?: boolean;
  change?: number;
}) {
  const colors = cardVariants[variant];

  return (
    <div
      className={`${colors.bg} rounded-2xl p-6 border-l-4 ${colors.border} shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${
        highlight ? 'ring-2 ring-[#C97355]/30' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[#8B7355] text-sm font-medium mb-1">{title}</p>
          <p className={`${colors.valueColor} text-3xl font-bold`}>{value}</p>

          {/* Comparison indicator */}
          {change !== undefined && change !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
              change > 0 ? 'text-[#5B8A6B]' : 'text-[#C97355]'
            }`}>
              {change > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{change > 0 ? '+' : ''}{change.toFixed(1)}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`${colors.iconBg} ${colors.iconColor} p-3 rounded-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  paymentStatus,
}: {
  status: string;
  paymentStatus: string;
}) {
  if (status === 'pending_payment') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF5F0] text-[#C97355] rounded-full text-xs font-bold border border-[#C97355]/20">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C97355] animate-pulse"></span>
        Pending Payment
      </span>
    );
  }

  if (status === 'confirmed' && paymentStatus === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F9F4] text-[#5B8A6B] rounded-full text-xs font-bold border border-[#5B8A6B]/20">
        <span className="w-1.5 h-1.5 rounded-full bg-[#5B8A6B]"></span>
        Confirmed
      </span>
    );
  }

  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5F5] text-[#6B6B6B] rounded-full text-xs font-bold border border-[#6B6B6B]/20">
        <span className="w-1.5 h-1.5 rounded-full bg-[#6B6B6B]"></span>
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF9F0] text-[#B89355] rounded-full text-xs font-bold border border-[#B89355]/20">
      <span className="w-1.5 h-1.5 rounded-full bg-[#B89355]"></span>
      {status}
    </span>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#E8E3DB] hover:border-[#C9A96E] hover:shadow-xl transition-all hover:-translate-y-1"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C9A96E]/20 to-[#C9A96E]/10 flex items-center justify-center text-[#C9A96E] mb-4 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-[#2D2D2D] mb-1">{title}</h3>
          <p className="text-[#8B7355] text-sm">{description}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-[#C9A96E] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}
