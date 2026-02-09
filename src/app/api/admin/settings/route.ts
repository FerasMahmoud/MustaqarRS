import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getAdminSettings, updateAdminSettingsLocked, AdminSettings } from '@/lib/db';

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
 * GET /api/admin/settings
 * Returns current admin settings
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

    const settings = getAdminSettings();

    // Add connection status check
    const hasApiKey = !!process.env.TEXTMEBOT_API_KEY;
    const isDemoMode = process.env.TEXTMEBOT_DEMO_MODE === 'true';

    return NextResponse.json({
      settings,
      status: {
        whatsapp_configured: hasApiKey,
        demo_mode: isDemoMode,
      },
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * Updates admin settings
 */
export async function POST(request: NextRequest) {
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

    // Validate that only allowed fields are being updated
    const booleanFields: (keyof Omit<AdminSettings, 'id' | 'updated_at' | 'admin_whatsapp_number'>)[] = [
      'whatsapp_enabled',
      'automation_contract_whatsapp',
      'automation_contract_email',
      'automation_checkin_7d',
      'automation_checkin_3d',
      'automation_checkin_same',
      'automation_pre_arrival',
      'automation_checkout_7d',
      'automation_checkout_3d',
      'automation_checkout_same',
      // Admin notification toggles
      'admin_notify_booking_created',
      'admin_notify_payment_confirmed',
      'admin_notify_bank_transfer',
    ];

    const updates: Partial<AdminSettings> = {};

    // Handle boolean fields
    for (const field of booleanFields) {
      if (typeof body[field] === 'boolean') {
        (updates as Record<string, boolean>)[field] = body[field];
      }
    }

    // Handle admin phone number (string field)
    if (typeof body.admin_whatsapp_number === 'string') {
      // Clean the phone number - only allow digits and +
      updates.admin_whatsapp_number = body.admin_whatsapp_number.replace(/[^\d+]/g, '');
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedSettings = await updateAdminSettingsLocked(updates);

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
