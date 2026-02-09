'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseVisitorTrackingOptions {
  roomSlug: string;
  roomName?: string;
  enabled?: boolean;
  heartbeatInterval?: number; // ms
}

/**
 * Hook for tracking visitor presence on room pages
 * Automatically joins on mount, sends heartbeats, and leaves on unmount
 */
export function useVisitorTracking({
  roomSlug,
  roomName,
  enabled = true,
  heartbeatInterval = 60000, // 1 minute default
}: UseVisitorTrackingOptions) {
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Join visitor tracking
  const join = useCallback(async () => {
    if (!enabled || !roomSlug) return;

    try {
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          roomSlug,
          roomName,
          sessionId: sessionIdRef.current,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionIdRef.current = data.sessionId;
      }
    } catch (error) {
      console.error('Failed to join visitor tracking:', error);
    }
  }, [roomSlug, roomName, enabled]);

  // Send heartbeat
  const heartbeat = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          sessionId: sessionIdRef.current,
        }),
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }, []);

  // Leave visitor tracking
  const leave = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      // Use sendBeacon for reliable delivery on page unload
      const data = JSON.stringify({
        action: 'leave',
        sessionId: sessionIdRef.current,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/visitors', data);
      } else {
        // Fallback to fetch
        await fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        });
      }
    } catch (error) {
      console.error('Failed to leave visitor tracking:', error);
    }

    sessionIdRef.current = null;
  }, []);

  // Setup effect
  useEffect(() => {
    if (!enabled || !roomSlug) return;

    // Join on mount
    join();

    // Setup heartbeat interval
    heartbeatRef.current = setInterval(heartbeat, heartbeatInterval);

    // Cleanup on unmount
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      leave();
    };
  }, [enabled, roomSlug, join, heartbeat, leave, heartbeatInterval]);

  // Handle page visibility changes
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is hidden, send leave signal
        leave();
      } else if (document.visibilityState === 'visible') {
        // Page is visible again, rejoin
        join();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, join, leave]);

  // Handle beforeunload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      leave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, leave]);

  return {
    sessionId: sessionIdRef.current,
    leave,
    heartbeat,
  };
}
