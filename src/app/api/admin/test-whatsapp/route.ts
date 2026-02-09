import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

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
 * POST /api/admin/test-whatsapp
 * Sends a test WhatsApp message to verify the connection
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

    // Check if API key is configured
    const apiKey = process.env.TEXTMEBOT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TextMeBot API key not configured. Set TEXTMEBOT_API_KEY in environment.' },
        { status: 400 }
      );
    }

    // Get test phone number from environment or use default
    const testPhone = process.env.ADMIN_PHONE || process.env.WHATSAPP_TEST_NUMBER;
    if (!testPhone) {
      return NextResponse.json(
        { error: 'No test phone number configured. Set ADMIN_PHONE or WHATSAPP_TEST_NUMBER in environment.' },
        { status: 400 }
      );
    }

    // Normalize phone number
    let normalizedPhone = testPhone.replace(/^0/, '966');
    if (!normalizedPhone.startsWith('966')) {
      normalizedPhone = '966' + normalizedPhone.replace(/^\+/, '');
    }

    // Check for demo mode
    const isDemoMode = process.env.TEXTMEBOT_DEMO_MODE === 'true';
    if (isDemoMode) {
      console.log('🧪 DEMO MODE: Test message would be sent');
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'Demo mode - message not actually sent',
      });
    }

    // Send test message
    const testMessage = `🧪 Test Message from شركة مستقر\n\nThis is a test message to verify WhatsApp connection.\n\nTimestamp: ${new Date().toISOString()}`;

    const params = new URLSearchParams({
      recipient: normalizedPhone,
      apikey: apiKey,
      text: testMessage,
    });

    const url = `http://api.textmebot.com/send.php?${params.toString()}`;
    console.log('Sending test WhatsApp message to:', normalizedPhone);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TextMeBot test error:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to send test message: ${response.status}` },
        { status: 500 }
      );
    }

    const responseText = await response.text();
    console.log('Test message sent successfully:', responseText);

    return NextResponse.json({
      success: true,
      message: 'Test message sent successfully',
      phone: normalizedPhone.slice(0, 6) + '***' + normalizedPhone.slice(-2),
    });
  } catch (error) {
    console.error('Error sending test WhatsApp:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test message' },
      { status: 500 }
    );
  }
}
