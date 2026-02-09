import { NextRequest, NextResponse } from 'next/server';
import { sendDailyReminders } from '@/lib/reminders';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request from Vercel
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Cron job triggered: Send reminders');

    const result = await sendDailyReminders();

    return NextResponse.json({
      success: true,
      message: 'Reminders sent successfully',
      details: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// For manual testing during development
export async function POST(request: NextRequest) {
  try {
    console.log('Manual reminder send triggered');

    const result = await sendDailyReminders();

    return NextResponse.json({
      success: true,
      message: 'Reminders sent successfully',
      details: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual reminder send error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
