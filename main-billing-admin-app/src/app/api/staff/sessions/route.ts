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

export async function DELETE() {
  try {
    db.staffUsers = [];
    db.loginSessions = [];
    db.staffActivityLogs = [];
    return NextResponse.json({ success: true, message: 'All staff, session, and activity data reset cleanly.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
