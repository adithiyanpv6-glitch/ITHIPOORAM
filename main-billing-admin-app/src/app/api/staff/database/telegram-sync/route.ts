import { NextRequest, NextResponse } from 'next/server';
import { autoDispatchStaffDatabaseToTelegram } from '@/lib/autoTelegramStaffSync';

export async function POST(req: NextRequest) {
  try {
    let reason = 'Manual Admin Request from Staff Console';
    try {
      const body = await req.json();
      if (body?.reason) reason = body.reason;
    } catch (e) {}

    const result = await autoDispatchStaffDatabaseToTelegram(reason);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const result = await autoDispatchStaffDatabaseToTelegram('Instant Admin Heartbeat Sync');
  return NextResponse.json(result);
}
