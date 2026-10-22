import { NextRequest, NextResponse } from 'next/server';
import { db, StaffUserRecord, StaffLoginSession, StaffActivityLog, generateStaffId } from '@/lib/serverDb';
import { syncStaffDatabasePinned, syncStaffSessionDatabasePinned } from '@/lib/telegramPinnedVault';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawName = (body.name || body.fullName || body.username || '').trim();
    const pin = (body.pin || body.password || '').trim();
    const role = body.role || 'CASHIER';

    if (!rawName) {
      return NextResponse.json({ error: 'Staff full name is required.' }, { status: 400 });
    }
    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Password / PIN must be exactly 4 digits.' }, { status: 400 });
    }

    if (!db.staffUsers) {
      db.staffUsers = [];
    }
    if (!db.loginSessions) {
      db.loginSessions = [];
    }
    if (!db.staffActivityLogs) {
      db.staffActivityLogs = [];
    }

    // Default station based on role
    let station = 'Billing Counter POS 1';
    if (role === 'MAIN_ADMIN') station = 'Executive Central Gateway';
    else if (role === 'MANAGER') station = 'Floor Operations Desk';
    else if (role === 'KITCHEN_STAFF') station = 'Main Kitchen Display (KDS)';
    else if (role === 'MENU_EDITOR') station = 'QR & Menu Control Desk';

    const now = new Date();

    // Check if staff name already exists
    const existingIdx = db.staffUsers.findIndex(
      (s) => s.fullName.toLowerCase() === rawName.toLowerCase() || s.username.toLowerCase() === rawName.toLowerCase()
    );
    let targetStaff: StaffUserRecord;

    if (existingIdx >= 0) {
      // Update existing
      db.staffUsers[existingIdx].pin = pin;
      db.staffUsers[existingIdx].role = role;
      db.staffUsers[existingIdx].station = station;
      db.staffUsers[existingIdx].fullName = rawName;
      db.staffUsers[existingIdx].username = rawName;
      targetStaff = db.staffUsers[existingIdx];
    } else {
      const orderNumber = db.staffUsers.length + 1;
      const staffId = generateStaffId(rawName, orderNumber);
      targetStaff = {
        id: staffId,
        fullName: rawName,
        username: rawName,
        pin,
        role,
        station,
        isActive: true,
        registeredAt: now.toLocaleString('en-IN', { hour12: true }),
        totalLogins: 1,
        notes: `Registered staff account`,
      };
      db.staffUsers.push(targetStaff);
    }

    // Automatically create immediate active session upon registration
    const sessionId = `SES-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
    const newSession: StaffLoginSession = {
      sessionId,
      staffId: targetStaff.id,
      fullName: targetStaff.fullName,
      username: targetStaff.username,
      role: targetStaff.role,
      station: targetStaff.station,
      loginDate: now.toLocaleDateString('en-GB'),
      loginTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      clientIp: req.headers.get('x-forwarded-for') || 'POS Registration Terminal',
      status: 'ACTIVE',
      lastActive: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    db.loginSessions.unshift(newSession);

    // Record Activity Log
    const regLog: StaffActivityLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: now.toLocaleString('en-IN'),
      actionType: 'STAFF_REGISTRATION',
      usernameSnapshot: targetStaff.username,
      fullNameSnapshot: targetStaff.fullName,
      roleSnapshot: targetStaff.role,
      details: `New staff account created: ${targetStaff.fullName} (${targetStaff.role}) assigned to ${station}.`,
      success: true,
    };
    db.staffActivityLogs.unshift(regLog);

    // Update pinned Staff Database and Session Database in-place on Telegram
    syncStaffDatabasePinned().catch(() => {});
    syncStaffSessionDatabasePinned().catch(() => {});

    return NextResponse.json({
      message: 'Staff registered and logged in successfully',
      token: `jwt-session-${targetStaff.id}-${Date.now()}`,
      sessionId,
      user: {
        id: targetStaff.id,
        username: targetStaff.username,
        fullName: targetStaff.fullName,
        role: targetStaff.role,
        station: targetStaff.station,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: err.message || 'Server error during staff registration' }, { status: 500 });
  }
}
