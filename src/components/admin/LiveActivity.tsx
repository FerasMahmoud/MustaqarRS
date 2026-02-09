'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, Users, CreditCard, Calendar, Radio, Clock, Eye } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: string;
  timestamp: string;
  data: {
    guestName?: string;
    roomName?: string;
    roomSlug?: string;
    amount?: number;
    bookingId?: string;
    message?: string;
  };
}

interface VisitorData {
  total: number;
  byRoom: Record<string, { count: number; roomName?: string }>;
}

interface SSEMessage {
  type: 'init' | 'event' | 'heartbeat';
  events?: ActivityEvent[];
  event?: ActivityEvent;
  visitors?: VisitorData;
  timestamp?: string;
}

export function LiveActivity() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [visitors, setVisitors] = useState<VisitorData>({ total: 0, byRoom: {} });
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connect = () => {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/admin/events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnected(true);
        console.log('SSE connected');
      };

      eventSource.onmessage = (e) => {
        try {
          const data: SSEMessage = JSON.parse(e.data);

          switch (data.type) {
            case 'init':
              // Initial data load
              if (data.events) setEvents(data.events);
              if (data.visitors) setVisitors(data.visitors);
              setLastUpdate(new Date());
              break;

            case 'event':
              // New event received
              if (data.event) {
                setEvents(prev => [data.event!, ...prev.slice(0, 19)]); // Keep last 20
              }
              if (data.visitors) setVisitors(data.visitors);
              setLastUpdate(new Date());
              break;

            case 'heartbeat':
              // Just update visitors count
              if (data.visitors) setVisitors(data.visitors);
              setLastUpdate(new Date());
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        eventSource.close();

        // Attempt to reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Get event icon and color
  const getEventStyle = (type: string) => {
    switch (type) {
      case 'booking_created':
        return { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'payment_confirmed':
        return { icon: CreditCard, color: 'text-green-500', bg: 'bg-green-100' };
      case 'bank_transfer':
        return { icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-100' };
      case 'visitor_joined':
        return { icon: Eye, color: 'text-purple-500', bg: 'bg-purple-100' };
      case 'visitor_left':
        return { icon: Eye, color: 'text-gray-400', bg: 'bg-gray-100' };
      default:
        return { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  const roomVisitors = Object.entries(visitors.byRoom);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#E8E3DB] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8] border-b border-[#E8E3DB] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-5 w-5 text-red-500" />
            {connected && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-[#2D2D2D]">Live Activity</h2>
            <p className="text-xs text-[#8B7355]">
              {connected ? 'Connected' : 'Reconnecting...'}
              {lastUpdate && ` • Updated ${formatRelativeTime(lastUpdate.toISOString())}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-[#8B7355]" />
          <span className="font-semibold text-[#2D2D2D]">{visitors.total}</span>
          <span className="text-[#8B7355]">viewing</span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visitor Counts by Room */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-[#2D2D2D] mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#8B7355]" />
              Visitors by Room
            </h3>
            {roomVisitors.length > 0 ? (
              <div className="space-y-2">
                {roomVisitors.map(([slug, data]) => (
                  <div
                    key={slug}
                    className="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-lg"
                  >
                    <span className="text-sm text-[#2D2D2D]">
                      {data.roomName || slug}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#2D2D2D]">{data.count}</span>
                      <Users className="h-3.5 w-3.5 text-[#8B7355]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-[#8B7355]">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active visitors</p>
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-[#2D2D2D] mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#8B7355]" />
              Recent Activity
            </h3>
            {events.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.slice(0, 10).map((event) => {
                  const style = getEventStyle(event.type);
                  const Icon = style.icon;

                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 bg-[#FAF7F2] rounded-lg hover:bg-[#E8E3DB]/50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-4 w-4 ${style.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#2D2D2D] truncate">
                          {event.data.message || `${event.type}: ${event.data.guestName || event.data.roomName}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-[#8B7355]" />
                          <span className="text-xs text-[#8B7355]">
                            {formatRelativeTime(event.timestamp)}
                          </span>
                          {event.data.amount && (
                            <>
                              <span className="text-[#E8E3DB]">•</span>
                              <span className="text-xs font-medium text-green-600">
                                {event.data.amount.toLocaleString()} SAR
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[#8B7355]">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs mt-1">Events will appear here in real-time</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
