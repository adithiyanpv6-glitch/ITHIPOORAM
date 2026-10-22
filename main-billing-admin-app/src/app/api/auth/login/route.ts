import { NextRequest, NextResponse } from 'next/server';
import { db, StaffLoginSession, StaffActivityLog, generateStaffId } from '@/lib/serverDb';
import { syncStaffSessionDatabasePinned } from '@/lib/telegramPinnedVault';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = (body.username || '').trim();
    const inputUser = rawInput.toLowerCase().replace(/\s+/g, '');
    const inputPin = (body.password || body.pin || '').trim();

    if (!inputUser) {
      return NextResponse.json({ error: 'Staff name or username is required.' }, { status: 400 });
    }
    if (!inputPin) {
      return NextResponse.json({ error: '4-digit password / PIN is required.' }, { status: 400 });
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

    // Lookup staff
    let foundStaff = db.staffUsers.find(
      (s) =>
        s.username.toLowerCase().replace(/\s+/g, '') === inputUser ||
        s.fullName.toLowerCase().replace(/\s+/g, '') === inputUser ||
        s.id.toLowerCase() === inputUser
    );

    // Universal Admin master PIN support (1111) or registered admin
    const isAdminOverride = inputPin === '1111';

    if (!foundStaff) {
      // If admin master pin is used, create the admin session on the fly
      if (isAdminOverride) {
        const orderNum = db.staffUsers.length + 1;
        const adminName = rawInput || 'Admin';
        foundStaff = {
          id: generateStaffId(adminName, orderNum),
          fullName: adminName,
          username: adminName,
          pin: '1111',
          role: 'MAIN_ADMIN',
          station: 'Executive Central Gateway',
          isActive: true,
          registeredAt: new Date().toLocaleString('en-IN'),
          totalLogins: 1,
          notes: 'Admin master session',
        };
        db.staffUsers.push(foundStaff);
      } else {
        // Log failed attempt
        const failedLog: StaffActivityLog = {
          id: `LOG-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toLocaleString('en-IN'),
          actionType: 'LOGIN_FAILED',
          usernameSnapshot: inputUser,
          fullNameSnapshot: body.username || inputUser,
          roleSnapshot: 'UNKNOWN',
          details: `Sign-in failed: Account not found for username "${body.username}".`,
          success: false,
        };
        db.staffActivityLogs.unshift(failedLog);

        return NextResponse.json(
          { error: `User "${body.username}" not found. Please register as new staff.` },
          { status: 404 }
        );
      }
    }

    // Verify PIN
    if (!isAdminOverride && foundStaff.pin !== inputPin) {
      const failedLog: StaffActivityLog = {
        id: `LOG-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toLocaleString('en-IN'),
        actionType: 'LOGIN_FAILED',
        usernameSnapshot: foundStaff.username,
        fullNameSnapshot: foundStaff.fullName,
        roleSnapshot: foundStaff.role,
        details: `Sign-in failed: Incorrect 4-digit PIN entered.`,
        success: false,
      };
      db.staffActivityLogs.unshift(failedLog);

      return NextResponse.json(
        { error: 'Incorrect 4-digit password / PIN. Please try again.' },
        { status: 401 }
      );
    }

    // Increment logins
    foundStaff.totalLogins = (foundStaff.totalLogins || 0) + 1;

    // Create session
    const sessionId = `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const newSession: StaffLoginSession = {
      sessionId,
      staffId: foundStaff.id,
      fullName: foundStaff.fullName,
      username: foundStaff.username,
      role: foundStaff.role,
      station: foundStaff.station || 'POS Tablet Terminal',
      loginDate: now.toLocaleDateString('en-GB'),
      loginTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      clientIp: req.headers.get('x-forwarded-for') || 'POS Tablet Terminal',
      status: 'ACTIVE',
      lastActive: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    db.loginSessions.unshift(newSession);

    // Keep top 100 sessions
    if (db.loginSessions.length > 100) {
      db.loginSessions = db.loginSessions.slice(0, 100);
    }

    // Record Activity Log
    const successLog: StaffActivityLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: now.toLocaleString('en-IN'),
      actionType: 'LOGIN_SUCCESS',
      usernameSnapshot: foundStaff.username,
      fullNameSnapshot: foundStaff.fullName,
      roleSnapshot: foundStaff.role,
      details: `Sign-in authenticated for ${foundStaff.fullName} (${foundStaff.role}). Session ${sessionId} active.`,
      success: true,
    };
    db.staffActivityLogs.unshift(successLog);

    // Update live session Excel database in-place on Telegram
    syncStaffSessionDatabasePinned().catch(() => {});

    return NextResponse.json({
      message: 'Login successful',
      token: `jwt-session-${foundStaff.id}-${Date.now()}`,
      sessionId,
      user: {
        id: foundStaff.id,
        username: foundStaff.username,
        fullName: foundStaff.fullName,
        role: foundStaff.role,
        station: foundStaff.station,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Server error during authentication' }, { status: 500 });
  }
}
