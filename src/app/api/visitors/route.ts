import { NextRequest, NextResponse } from 'next/server';
import {
  trackVisitor,
  heartbeatVisitor,
  removeVisitor,
  getVisitorCounts,
  getTotalVisitorCount,
} from '@/lib/events';

/**
 * GET /api/visitors
 * Get current visitor counts (public endpoint)
 */
export async function GET() {
  const counts = getVisitorCounts();
  const total = getTotalVisitorCount();

  return NextResponse.json({
    total,
    byRoom: counts,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/visitors
 * Track a visitor viewing a room page
 *
 * Body:
 * - action: 'join' | 'heartbeat' | 'leave'
 * - roomSlug: string (required for join)
 * - roomName: string (optional, for display)
 * - sessionId: string (required for heartbeat/leave)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomSlug, roomName, sessionId } = body;

    switch (action) {
      case 'join': {
        if (!roomSlug) {
          return NextResponse.json(
            { error: 'roomSlug is required for join action' },
            { status: 400 }
          );
        }

        const session = trackVisitor(roomSlug, roomName, sessionId);
        return NextResponse.json({
          success: true,
          sessionId: session.sessionId,
          message: 'Visitor tracked',
        });
      }

      case 'heartbeat': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId is required for heartbeat action' },
            { status: 400 }
          );
        }

        const success = heartbeatVisitor(sessionId);
        return NextResponse.json({
          success,
          message: success ? 'Heartbeat received' : 'Session not found',
        });
      }

      case 'leave': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId is required for leave action' },
            { status: 400 }
          );
        }

        const removed = removeVisitor(sessionId);
        return NextResponse.json({
          success: removed,
          message: removed ? 'Visitor removed' : 'Session not found',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: join, heartbeat, or leave' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Visitor tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to process visitor tracking' },
      { status: 500 }
    );
  }
}
