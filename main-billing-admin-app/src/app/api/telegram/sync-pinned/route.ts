import { NextResponse } from 'next/server';
import { syncAllThreePinnedDatabases, syncStaffDatabasePinned, syncStaffSessionDatabasePinned, syncTableOrdersDatabasePinned } from '@/lib/telegramPinnedVault';

export async function GET() {
  try {
    const results = await syncAllThreePinnedDatabases();
    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const target = body?.target;

    if (target === 'staff') {
      const res = await syncStaffDatabasePinned();
      return NextResponse.json(res);
    } else if (target === 'sessions') {
      const res = await syncStaffSessionDatabasePinned();
      return NextResponse.json(res);
    } else if (target === 'tables') {
      const res = await syncTableOrdersDatabasePinned();
      return NextResponse.json(res);
    }

    const results = await syncAllThreePinnedDatabases();
    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
