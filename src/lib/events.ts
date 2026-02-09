/**
 * Real-time Event System for Admin Dashboard
 * Provides in-memory event store, SSE broadcasting, and visitor tracking
 */

// Event types for the admin dashboard
export type ActivityEventType =
  | 'booking_created'      // New booking attempt
  | 'payment_confirmed'    // Stripe payment confirmed
  | 'bank_transfer'        // Bank transfer booking created
  | 'visitor_joined'       // Someone started viewing a room
  | 'visitor_left';        // Someone stopped viewing a room

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
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

export interface VisitorSession {
  sessionId: string;
  roomSlug: string;
  roomName?: string;
  joinedAt: string;
  lastSeen: string;
}

// Configuration
const MAX_EVENTS = 50;           // Keep last 50 events
const VISITOR_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL for visitors

// In-memory stores (singleton pattern for serverless)
const activityEvents: ActivityEvent[] = [];
const visitorSessions: Map<string, VisitorSession> = new Map();
const sseClients: Set<(event: ActivityEvent) => void> = new Set();

// Generate unique ID
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Emit a new activity event
 */
export function emitActivityEvent(
  type: ActivityEventType,
  data: ActivityEvent['data']
): ActivityEvent {
  const event: ActivityEvent = {
    id: generateEventId(),
    type,
    timestamp: new Date().toISOString(),
    data,
  };

  // Add to events array
  activityEvents.unshift(event);

  // Keep only MAX_EVENTS
  while (activityEvents.length > MAX_EVENTS) {
    activityEvents.pop();
  }

  // Broadcast to all SSE clients
  sseClients.forEach(callback => {
    try {
      callback(event);
    } catch (error) {
      console.error('Error broadcasting event to client:', error);
    }
  });

  return event;
}

/**
 * Get recent activity events
 */
export function getRecentEvents(limit: number = 20): ActivityEvent[] {
  return activityEvents.slice(0, limit);
}

/**
 * Subscribe to activity events (for SSE)
 */
export function subscribeToEvents(callback: (event: ActivityEvent) => void): () => void {
  sseClients.add(callback);

  // Return unsubscribe function
  return () => {
    sseClients.delete(callback);
  };
}

/**
 * Track a visitor viewing a room
 */
export function trackVisitor(roomSlug: string, roomName?: string, existingSessionId?: string): VisitorSession {
  // Clean up stale sessions first
  cleanupStaleVisitors();

  const sessionId = existingSessionId || generateSessionId();
  const now = new Date().toISOString();

  // Check if session already exists
  const existing = visitorSessions.get(sessionId);
  if (existing) {
    // Update last seen
    existing.lastSeen = now;
    // Update room if changed
    if (existing.roomSlug !== roomSlug) {
      existing.roomSlug = roomSlug;
      existing.roomName = roomName;
    }
    return existing;
  }

  // Create new session
  const session: VisitorSession = {
    sessionId,
    roomSlug,
    roomName,
    joinedAt: now,
    lastSeen: now,
  };

  visitorSessions.set(sessionId, session);

  // Emit visitor joined event
  emitActivityEvent('visitor_joined', {
    roomSlug,
    roomName,
    message: `New visitor viewing ${roomName || roomSlug}`,
  });

  return session;
}

/**
 * Update visitor heartbeat (keep alive)
 */
export function heartbeatVisitor(sessionId: string): boolean {
  const session = visitorSessions.get(sessionId);
  if (session) {
    session.lastSeen = new Date().toISOString();
    return true;
  }
  return false;
}

/**
 * Remove a visitor session
 */
export function removeVisitor(sessionId: string): boolean {
  const session = visitorSessions.get(sessionId);
  if (session) {
    visitorSessions.delete(sessionId);

    // Emit visitor left event
    emitActivityEvent('visitor_left', {
      roomSlug: session.roomSlug,
      roomName: session.roomName,
      message: `Visitor left ${session.roomName || session.roomSlug}`,
    });

    return true;
  }
  return false;
}

/**
 * Clean up stale visitor sessions (older than TTL)
 */
export function cleanupStaleVisitors(): number {
  const now = Date.now();
  let removed = 0;

  visitorSessions.forEach((session, sessionId) => {
    const lastSeen = new Date(session.lastSeen).getTime();
    if (now - lastSeen > VISITOR_TTL_MS) {
      visitorSessions.delete(sessionId);
      removed++;
    }
  });

  return removed;
}

/**
 * Get current visitor count per room
 */
export function getVisitorCounts(): Record<string, { count: number; roomName?: string }> {
  // Clean up stale sessions first
  cleanupStaleVisitors();

  const counts: Record<string, { count: number; roomName?: string }> = {};

  visitorSessions.forEach(session => {
    if (!counts[session.roomSlug]) {
      counts[session.roomSlug] = { count: 0, roomName: session.roomName };
    }
    counts[session.roomSlug].count++;
  });

  return counts;
}

/**
 * Get total active visitor count
 */
export function getTotalVisitorCount(): number {
  cleanupStaleVisitors();
  return visitorSessions.size;
}

/**
 * Get all visitor sessions (for debugging)
 */
export function getAllVisitorSessions(): VisitorSession[] {
  cleanupStaleVisitors();
  return Array.from(visitorSessions.values());
}

/**
 * Helper: Emit booking created event
 */
export function emitBookingCreated(data: {
  guestName: string;
  roomName: string;
  amount: number;
  bookingId?: string;
}): ActivityEvent {
  return emitActivityEvent('booking_created', {
    guestName: data.guestName,
    roomName: data.roomName,
    amount: data.amount,
    bookingId: data.bookingId,
    message: `${data.guestName} started booking ${data.roomName}`,
  });
}

/**
 * Helper: Emit payment confirmed event
 */
export function emitPaymentConfirmed(data: {
  guestName: string;
  roomName: string;
  amount: number;
  bookingId?: string;
}): ActivityEvent {
  return emitActivityEvent('payment_confirmed', {
    guestName: data.guestName,
    roomName: data.roomName,
    amount: data.amount,
    bookingId: data.bookingId,
    message: `${data.guestName} paid ${data.amount.toLocaleString()} SAR for ${data.roomName}`,
  });
}

/**
 * Helper: Emit bank transfer booking event
 */
export function emitBankTransferBooking(data: {
  guestName: string;
  roomName: string;
  amount: number;
  bookingId?: string;
}): ActivityEvent {
  return emitActivityEvent('bank_transfer', {
    guestName: data.guestName,
    roomName: data.roomName,
    amount: data.amount,
    bookingId: data.bookingId,
    message: `${data.guestName} created bank transfer booking for ${data.roomName}`,
  });
}
