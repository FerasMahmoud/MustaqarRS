import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  readDB,
  writeDB,
  withLock,
  getAllRooms,
  getAllGuests,
  getAllBookings,
  getAllAvailabilityBlocks,
  getAdminSettings,
  invalidateDbCache,
  Room,
  Guest,
  Booking,
  AvailabilityBlock,
  ProcessedWebhookEvent,
  AdminSettings,
  Database,
  now,
} from '@/lib/db';

// Valid collection names
const VALID_COLLECTIONS = [
  'rooms',
  'guests',
  'bookings',
  'availabilityBlocks',
  'processedWebhookEvents',
  'adminSettings',
] as const;

type CollectionName = typeof VALID_COLLECTIONS[number];

// Collections that cannot be deleted from
const DELETE_FORBIDDEN_COLLECTIONS: CollectionName[] = ['rooms', 'adminSettings', 'processedWebhookEvents'];

// Fields that cannot be modified in any collection
const IMMUTABLE_FIELDS = ['id', 'created_at'];

// Allowed fields per collection for updates
const ALLOWED_UPDATE_FIELDS: Record<CollectionName, string[]> = {
  rooms: [
    'name', 'name_ar', 'description', 'description_ar',
    'monthly_rate', 'yearly_rate', 'amenities', 'images',
    'size_sqm', 'capacity', 'featured', 'slug',
    'door_code', 'wifi_network', 'wifi_password',
    'studio_guide_url', 'checkin_time', 'checkout_time',
  ],
  guests: [
    'full_name', 'email', 'phone', 'id_type',
    'id_number', 'nationality',
  ],
  bookings: [
    'start_date', 'end_date', 'rental_type', 'rate_at_booking',
    'total_amount', 'status', 'payment_status',
    'notes', 'rate_model', 'duration_days', 'weekly_cleaning_service',
    'cleaning_fee', 'terms_accepted', 'contract_sent', 'buffer_days',
    'reminders_enabled', 'guest_locale', 'payment_method',
    'cancellation_reason', 'receipt_sent',
  ],
  availabilityBlocks: ['room_id', 'start_date', 'end_date', 'reason'],
  processedWebhookEvents: [], // READ-ONLY - no updates allowed
  adminSettings: [
    'whatsapp_enabled',
    'automation_contract_whatsapp', 'automation_contract_email',
    'automation_checkin_7d', 'automation_checkin_3d', 'automation_checkin_same',
    'automation_pre_arrival',
    'automation_checkout_7d', 'automation_checkout_3d', 'automation_checkout_same',
  ],
};

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

// Authenticate admin from request
async function authenticateAdmin(request: NextRequest): Promise<boolean> {
  const adminSession = request.cookies.get('admin_session');
  if (!adminSession?.value) return false;
  return await verifyAdminToken(adminSession.value);
}

// Validate collection name
function isValidCollection(collection: string): collection is CollectionName {
  return VALID_COLLECTIONS.includes(collection as CollectionName);
}

// Filter updates to only allowed fields
function filterUpdates(collection: CollectionName, updates: Record<string, unknown>): Record<string, unknown> {
  const allowedFields = ALLOWED_UPDATE_FIELDS[collection];
  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && !IMMUTABLE_FIELDS.includes(key)) {
      filtered[key] = value;
    }
  }

  return filtered;
}

// Validate booking status
function validateBookingStatus(status: unknown): boolean {
  const validStatuses = ['pending', 'pending_payment', 'confirmed', 'cancelled'];
  return typeof status === 'string' && validStatuses.includes(status);
}

// Check if a booking can be deleted
function canDeleteBooking(booking: Booking): { allowed: boolean; reason?: string } {
  if (booking.status === 'confirmed' && booking.payment_status === 'paid') {
    return { allowed: false, reason: 'Cannot delete confirmed and paid bookings' };
  }
  if (booking.receipt_sent) {
    return { allowed: false, reason: 'Cannot delete bookings with sent receipts' };
  }
  return { allowed: true };
}

// Check if a guest can be deleted
function canDeleteGuest(guestId: string, db: Database): { allowed: boolean; reason?: string; warning?: string } {
  const hasBookings = db.bookings.some(b => b.guest_id === guestId);
  if (hasBookings) {
    return {
      allowed: false,
      reason: 'Cannot delete guest with existing bookings. Delete or reassign bookings first.'
    };
  }
  return { allowed: true };
}

/**
 * GET /api/admin/database
 * Returns all collections with metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const isValid = await authenticateAdmin(request);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get optional collection filter
    const { searchParams } = new URL(request.url);
    const collectionFilter = searchParams.get('collection');

    const db = readDB();

    // If specific collection requested
    if (collectionFilter) {
      if (!isValidCollection(collectionFilter)) {
        return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
      }

      if (collectionFilter === 'adminSettings') {
        return NextResponse.json({
          collection: 'adminSettings',
          data: getAdminSettings(),
        });
      }

      const collection = db[collectionFilter as keyof Database];
      return NextResponse.json({
        collection: collectionFilter,
        data: collection || [],
        count: Array.isArray(collection) ? collection.length : 1,
      });
    }

    // Return all collections with metadata
    const response = {
      rooms: getAllRooms(),
      guests: getAllGuests(),
      bookings: getAllBookings(),
      availabilityBlocks: getAllAvailabilityBlocks(),
      processedWebhookEvents: db.processedWebhookEvents || [],
      adminSettings: getAdminSettings(),
      metadata: {
        counts: {
          rooms: db.rooms?.length || 0,
          guests: db.guests?.length || 0,
          bookings: db.bookings?.length || 0,
          availabilityBlocks: db.availabilityBlocks?.length || 0,
          processedWebhookEvents: db.processedWebhookEvents?.length || 0,
        },
        lastUpdated: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Database GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch database' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/database
 * Update a record in any collection
 * Body: { collection: string, id?: string, updates: object }
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate
    const isValid = await authenticateAdmin(request);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { collection, id, updates } = body;

    // Validate collection
    if (!collection || !isValidCollection(collection)) {
      return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
    }

    // ProcessedWebhookEvents is read-only
    if (collection === 'processedWebhookEvents') {
      return NextResponse.json({
        error: 'Webhook events are read-only and cannot be modified'
      }, { status: 403 });
    }

    // Validate updates object
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Updates must be an object' }, { status: 400 });
    }

    // Filter to allowed fields only
    const filteredUpdates = filterUpdates(collection, updates);

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({
        error: 'No valid fields to update',
        allowedFields: ALLOWED_UPDATE_FIELDS[collection],
      }, { status: 400 });
    }

    // Validate specific fields
    if (collection === 'bookings' && 'status' in filteredUpdates) {
      if (!validateBookingStatus(filteredUpdates.status)) {
        return NextResponse.json({
          error: 'Invalid booking status. Must be: pending, pending_payment, confirmed, or cancelled'
        }, { status: 400 });
      }
    }

    // Handle adminSettings (singleton - no id needed)
    if (collection === 'adminSettings') {
      const result = await withLock(() => {
        const db = readDB();
        const current = db.adminSettings || {
          id: 'admin-settings',
          whatsapp_enabled: true,
          automation_contract_whatsapp: true,
          automation_contract_email: true,
          automation_checkin_7d: true,
          automation_checkin_3d: true,
          automation_checkin_same: true,
          automation_pre_arrival: true,
          automation_checkout_7d: true,
          automation_checkout_3d: true,
          automation_checkout_same: true,
          updated_at: now(),
        };

        const updated = {
          ...current,
          ...filteredUpdates,
          updated_at: now(),
        };

        db.adminSettings = updated as AdminSettings;
        writeDB(db);
        invalidateDbCache();
        return updated;
      });

      return NextResponse.json({ success: true, record: result });
    }

    // For array collections, id is required
    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    // Update record in collection
    const result = await withLock(() => {
      const db = readDB();
      const collectionData = db[collection as keyof Database] as Array<{ id: string; updated_at?: string }>;

      if (!Array.isArray(collectionData)) {
        return null;
      }

      const index = collectionData.findIndex(item => item.id === id);
      if (index === -1) {
        return null;
      }

      // Update the record
      const updatedRecord = {
        ...collectionData[index],
        ...filteredUpdates,
        updated_at: now(),
      };

      collectionData[index] = updatedRecord;
      writeDB(db);
      invalidateDbCache();

      return updatedRecord;
    });

    if (!result) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, record: result });
  } catch (error) {
    console.error('Database PUT error:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/database
 * Delete a record from a collection
 * Body: { collection: string, id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate
    const isValid = await authenticateAdmin(request);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { collection, id } = body;

    // Validate collection
    if (!collection || !isValidCollection(collection)) {
      return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
    }

    // Check if collection allows deletion
    if (DELETE_FORBIDDEN_COLLECTIONS.includes(collection)) {
      return NextResponse.json({
        error: `Cannot delete from ${collection}`,
        code: 'DELETE_FORBIDDEN',
        reason: collection === 'rooms'
          ? 'Rooms are critical business data and cannot be deleted'
          : collection === 'adminSettings'
          ? 'Admin settings cannot be deleted'
          : 'Webhook events are audit logs and cannot be deleted',
      }, { status: 403 });
    }

    // ID is required
    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    // Perform deletion with validation
    const result = await withLock(() => {
      const db = readDB();

      // Collection-specific deletion checks
      if (collection === 'bookings') {
        const booking = db.bookings.find(b => b.id === id);
        if (!booking) {
          return { success: false, error: 'Booking not found', status: 404 };
        }
        const canDelete = canDeleteBooking(booking);
        if (!canDelete.allowed) {
          return { success: false, error: canDelete.reason, status: 403 };
        }
      }

      if (collection === 'guests') {
        const canDelete = canDeleteGuest(id, db);
        if (!canDelete.allowed) {
          return { success: false, error: canDelete.reason, status: 403 };
        }
      }

      // Find and delete the record
      const collectionData = db[collection as keyof Database] as Array<{ id: string }>;
      if (!Array.isArray(collectionData)) {
        return { success: false, error: 'Invalid collection type', status: 500 };
      }

      const index = collectionData.findIndex(item => item.id === id);
      if (index === -1) {
        return { success: false, error: 'Record not found', status: 404 };
      }

      // Remove the record
      collectionData.splice(index, 1);
      writeDB(db);
      invalidateDbCache();

      return { success: true };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    return NextResponse.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Database DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
