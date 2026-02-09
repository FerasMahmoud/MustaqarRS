'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Repeat,
  Clock,
  CreditCard,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { AreaChart } from '@/components/admin/charts/AreaChart';
import { BarChart } from '@/components/admin/charts/BarChart';
import { PieChart } from '@/components/admin/charts/PieChart';
import { MiniChart } from '@/components/admin/charts/MiniChart';

export const dynamic = 'force-dynamic';

interface AnalyticsData {
  summary: {
    totalBookings: number;
    revenue: number;
    avgBookingValue: number;
    occupancyRate: number;
    uniqueGuests: number;
    repeatGuestRate: number;
  };
  comparison: {
    bookingsChange: number;
    revenueChange: number;
  };
  timeSeries: {
    bookings: Array<{ date: string; count: number }>;
    revenue: Array<{ date: string; amount: number }>;
  };
  byRoom: Array<{
    roomId: string;
    roomName: string;
    bookings: number;
    revenue: number;
  }>;
  byPaymentMethod: {
    stripe: { count: number; amount: number };
    bank_transfer: { count: number; amount: number };
  };
  byStatus: {
    confirmed: number;
    pending_payment: number;
    cancelled: number;
  };
}

type DateRange = '7d' | '30d' | '90d' | 'custom';

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);

  const getDateParams = useCallback(() => {
    const endDate = new Date();
    let startDate: Date;

    switch (dateRange) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (customStart && customEnd) {
          return {
            startDate: customStart,
            endDate: customEnd,
          };
        }
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }, [dateRange, customStart, customEnd]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateParams();
      const response = await fetch(
        `/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      setData(result);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [getDateParams]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const { startDate, endDate } = getDateParams();
      const response = await fetch(
        `/api/admin/analytics/export?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A96E] mx-auto mb-4"></div>
          <p className="text-[#2D2D2D]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  // Prepare chart data
  const bookingsChartData = data?.timeSeries.bookings.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    Bookings: item.count,
  })) || [];

  const revenueChartData = data?.timeSeries.revenue.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    Revenue: item.amount,
  })) || [];

  const roomChartData = data?.byRoom.map((room) => ({
    name: room.roomName,
    value: room.revenue,
    color: ROOM_COLORS[room.roomId] || '#C9A96E',
  })) || [];

  const statusChartData = data ? [
    { name: 'Confirmed', value: data.byStatus.confirmed, color: '#5B8A6B' },
    { name: 'Pending', value: data.byStatus.pending_payment, color: '#C9A96E' },
    { name: 'Cancelled', value: data.byStatus.cancelled, color: '#C97355' },
  ] : [];

  const paymentChartData = data ? [
    { name: 'Card (Stripe)', value: data.byPaymentMethod.stripe.count, color: '#6B7BC9' },
    { name: 'Bank Transfer', value: data.byPaymentMethod.bank_transfer.count, color: '#C9A96E' },
  ] : [];

  // Mini chart data for metrics
  const bookingsTrendData = data?.timeSeries.bookings.slice(-7).map((item) => ({
    date: item.date,
    value: item.count,
  })) || [];

  const revenueTrendData = data?.timeSeries.revenue.slice(-7).map((item) => ({
    date: item.date,
    value: item.amount,
  })) || [];

  return (
    <div className="space-y-8">
      {/* Header with Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Analytics</h1>
          <p className="text-[#8B7355] mt-1">
            Track your business performance and insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="relative">
            <button
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E8E3DB] rounded-xl hover:border-[#C9A96E] transition-colors"
            >
              <Calendar className="h-4 w-4 text-[#C9A96E]" />
              <span className="text-[#2D2D2D] font-medium">
                {DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label}
              </span>
              <ChevronDown className="h-4 w-4 text-[#8B7355]" />
            </button>

            {showRangeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRangeDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E8E3DB] z-50 overflow-hidden">
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setDateRange(option.value);
                        if (option.value !== 'custom') {
                          setShowRangeDropdown(false);
                        }
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-[#FAF7F2] transition-colors ${
                        dateRange === option.value
                          ? 'bg-[#FAF7F2] text-[#C9A96E] font-medium'
                          : 'text-[#2D2D2D]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}

                  {dateRange === 'custom' && (
                    <div className="p-4 border-t border-[#E8E3DB] space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[#8B7355] mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="w-full px-3 py-2 border border-[#E8E3DB] rounded-lg text-sm focus:outline-none focus:border-[#C9A96E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#8B7355] mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="w-full px-3 py-2 border border-[#E8E3DB] rounded-lg text-sm focus:outline-none focus:border-[#C9A96E]"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setShowRangeDropdown(false);
                          fetchAnalytics();
                        }}
                        disabled={!customStart || !customEnd}
                        className="w-full px-4 py-2 bg-[#C9A96E] text-white rounded-lg font-medium hover:bg-[#B89A5F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A96E] text-white rounded-xl hover:bg-[#B89A5F] transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="font-medium">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Bookings"
          value={data?.summary.totalBookings || 0}
          icon={<Calendar className="h-5 w-5" />}
          change={data?.comparison.bookingsChange}
          trendData={bookingsTrendData}
          trendColor="#C9A96E"
        />
        <MetricCard
          title="Revenue"
          value={`SAR ${(data?.summary.revenue || 0).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          change={data?.comparison.revenueChange}
          trendData={revenueTrendData}
          trendColor="#5B8A6B"
        />
        <MetricCard
          title="Average Booking Value"
          value={`SAR ${(data?.summary.avgBookingValue || 0).toLocaleString()}`}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          title="Occupancy Rate"
          value={`${(data?.summary.occupancyRate || 0).toFixed(1)}%`}
          icon={<Activity className="h-5 w-5" />}
        />
        <MetricCard
          title="Unique Guests"
          value={data?.summary.uniqueGuests || 0}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Repeat Guest Rate"
          value={`${(data?.summary.repeatGuestRate || 0).toFixed(1)}%`}
          icon={<Repeat className="h-5 w-5" />}
        />
      </div>

      {/* Charts Row 1 - Time Series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Bookings Over Time" icon={<Calendar className="h-5 w-5" />}>
          <AreaChart
            data={bookingsChartData}
            dataKeys={[{ key: 'Bookings', name: 'Bookings', color: '#C9A96E' }]}
            xAxisKey="date"
            height={280}
            showLegend={false}
          />
        </ChartCard>

        <ChartCard title="Revenue Over Time" icon={<DollarSign className="h-5 w-5" />}>
          <AreaChart
            data={revenueChartData}
            dataKeys={[{ key: 'Revenue', name: 'Revenue', color: '#5B8A6B' }]}
            xAxisKey="date"
            height={280}
            showLegend={false}
            valueFormatter={(value) => `SAR ${value.toLocaleString()}`}
          />
        </ChartCard>
      </div>

      {/* Charts Row 2 - Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Revenue by Room" icon={<BarChart3 className="h-5 w-5" />}>
          <BarChart
            data={roomChartData}
            layout="vertical"
            height={280}
            valueFormatter={(value) => `SAR ${value.toLocaleString()}`}
            barSize={24}
          />
        </ChartCard>

        <ChartCard title="Booking Status" icon={<PieChartIcon className="h-5 w-5" />}>
          <PieChart
            data={statusChartData}
            height={280}
            innerRadius={50}
            outerRadius={80}
          />
        </ChartCard>

        <ChartCard title="Payment Methods" icon={<CreditCard className="h-5 w-5" />}>
          <PieChart
            data={paymentChartData}
            height={280}
            innerRadius={50}
            outerRadius={80}
          />
        </ChartCard>
      </div>

      {/* Detailed Room Performance Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E8E3DB]">
        <div className="bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8] px-6 py-4 border-b border-[#E8E3DB]">
          <h2 className="text-lg font-bold text-[#2D2D2D]">Room Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FAF7F2]/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#8B7355] uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#8B7355] uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#8B7355] uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#8B7355] uppercase tracking-wider">
                  Avg. Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#8B7355] uppercase tracking-wider">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E3DB]">
              {data?.byRoom.map((room) => {
                const totalRevenue = data.summary.revenue || 1;
                const share = ((room.revenue / totalRevenue) * 100).toFixed(1);
                const avgBooking = room.bookings > 0 ? room.revenue / room.bookings : 0;

                return (
                  <tr key={room.roomId} className="hover:bg-[#FFF9F0] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ROOM_COLORS[room.roomId] || '#C9A96E' }}
                        />
                        <span className="font-medium text-[#2D2D2D]">{room.roomName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#2D2D2D]">{room.bookings}</td>
                    <td className="px-6 py-4 text-[#2D2D2D] font-bold">
                      SAR {room.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-[#8B7355]">
                      SAR {avgBooking.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#E8E3DB] rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full bg-[#C9A96E] rounded-full"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="text-sm text-[#8B7355] font-medium">{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Room color mapping
const ROOM_COLORS: Record<string, string> = {
  'studio-a': '#C9A96E',
  'studio-b': '#5B8A6B',
  'studio-c': '#C97355',
  'penthouse': '#6B7BC9',
};

// Metric Card Component
function MetricCard({
  title,
  value,
  icon,
  change,
  trendData,
  trendColor,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  trendData?: Array<{ date: string; value: number }>;
  trendColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E8E3DB] shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] flex items-center justify-center text-[#C9A96E]">
          {icon}
        </div>
        {change !== undefined && change !== 0 && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              change > 0 ? 'text-[#5B8A6B]' : 'text-[#C97355]'
            }`}
          >
            {change > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
          </div>
        )}
      </div>

      <p className="text-[#8B7355] text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-[#2D2D2D]">{value}</p>

      {trendData && trendData.length > 0 && (
        <div className="mt-4">
          <MiniChart data={trendData} color={trendColor} height={40} />
        </div>
      )}
    </div>
  );
}

// Chart Card Component
function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E8E3DB] shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] flex items-center justify-center text-[#C9A96E]">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-[#2D2D2D]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
