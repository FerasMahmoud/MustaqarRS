import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getAllRooms, updateRoomLocked, Room } from '@/lib/db';

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
 * GET /api/admin/rooms
 * Returns all rooms for admin management
 */
export async function GET(request: NextRequest) {
  try {
    // Check for admin session and verify JWT signature
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession || !adminSession.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isValid = await verifyAdminToken(adminSession.value);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const rooms = getAllRooms();

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/rooms
 * Updates a room
 */
export async function PUT(request: NextRequest) {
  try {
    // Check for admin session and verify JWT signature
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession || !adminSession.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isValid = await verifyAdminToken(adminSession.value);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Allowed fields for update
    const allowedFields: (keyof Omit<Room, 'id' | 'created_at'>)[] = [
      'name',
      'name_ar',
      'description',
      'description_ar',
      'monthly_rate',
      'yearly_rate',
      'amenities',
      'images',
      'size_sqm',
      'capacity',
      'featured',
      'slug',
      'door_code',
      'wifi_network',
      'wifi_password',
      'studio_guide_url',
      'checkin_time',
      'checkout_time',
    ];

    // Filter to only allowed fields
    const filteredUpdates: Partial<Omit<Room, 'id' | 'created_at'>> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        (filteredUpdates as Record<string, unknown>)[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedRoom = await updateRoomLocked(id, filteredUpdates);

    if (!updatedRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      room: updatedRoom,
    });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}
