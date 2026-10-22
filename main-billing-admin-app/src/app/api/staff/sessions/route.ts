import { NextResponse } from 'next/server';
import { db } from '@/lib/serverDb';

export async function GET() {
  try {
    return NextResponse.json({
      staff: db.staffUsers || [],
      sessions: db.loginSessions || [],
      logs: db.staffActivityLogs || [],
      activeCount: (db.loginSessions || []).filter((s) => s.status === 'ACTIVE').length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
