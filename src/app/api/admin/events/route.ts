import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import {
  subscribeToEvents,
  getRecentEvents,
  getVisitorCounts,
  getTotalVisitorCount,
  ActivityEvent,
} from '@/lib/events';

// Get secret key for JWT verification
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret || secret.length < 32) {
    const baseSecret = secret || 'default-secret-change-me-in-production';
    const paddedSecret = baseSecret.padEnd(32, 'x').slice(0, 64);
    return new TextEncoder().encode(paddedSecret);
  }
  return new TextEncoder().encode(secret);
}

// Verify admin JWT token
async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    return payload.sub === 'admin' && payload.admin === true;
  } catch {
    return false;
  }
}

/**
 * GET /api/admin/events
 * Server-Sent Events endpoint for real-time admin notifications
 *
 * Query params:
 * - mode: 'poll' for one-time fetch, 'stream' for SSE (default: stream)
 */
export async function GET(request: NextRequest) {
  // Check for admin session
  const adminSession = request.cookies.get('admin_session');
  if (!adminSession || !adminSession.value) {
    return new Response('Unauthorized', { status: 401 });
  }

  const isValid = await verifyAdminToken(adminSession.value);
  if (!isValid) {
    return new Response('Invalid session', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'stream';

  // Polling mode - return current state as JSON
  if (mode === 'poll') {
    const events = getRecentEvents(20);
    const visitorCounts = getVisitorCounts();
    const totalVisitors = getTotalVisitorCount();

    return Response.json({
      events,
      visitors: {
        total: totalVisitors,
        byRoom: visitorCounts,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // SSE streaming mode
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      const initialData = {
        type: 'init',
        events: getRecentEvents(20),
        visitors: {
          total: getTotalVisitorCount(),
          byRoom: getVisitorCounts(),
        },
        timestamp: new Date().toISOString(),
      };

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`)
      );

      // Subscribe to new events
      const unsubscribe = subscribeToEvents((event: ActivityEvent) => {
        try {
          const eventData = {
            type: 'event',
            event,
            visitors: {
              total: getTotalVisitorCount(),
              byRoom: getVisitorCounts(),
            },
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`)
          );
        } catch (error) {
          console.error('Error sending SSE event:', error);
        }
      });

      // Heartbeat to keep connection alive (every 30 seconds)
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
            visitors: {
              total: getTotalVisitorCount(),
              byRoom: getVisitorCounts(),
            },
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`)
          );
        } catch {
          // Connection might be closed
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
