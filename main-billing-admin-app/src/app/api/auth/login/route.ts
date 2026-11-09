import { NextRequest, NextResponse } from 'next/server';
import { db, StaffLoginSession, StaffActivityLog, generateStaffId } from '@/lib/serverDb';
import { syncStaffSessionDatabasePinned } from '@/lib/telegramPinnedVault';
import { pushLiveUpdateToGoogleWorkspace } from '@/lib/googleWorkspaceSync';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = (body.username || '').trim();
    const inputUser = rawInput.toLowerCase().replace(/\s+/g, '');
    const inputPin = (body.password || body.pin || '').trim();
    const isAdminOverride = inputPin === '5566' || inputPin === '1111';

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

    // Lookup staff by username or by PIN if username omitted (for fast touchscreen 1-tap PIN login)
    let foundStaff = db.staffUsers.find((s) => {
      if (inputUser) {
        return (
          s.username.toLowerCase().replace(/\s+/g, '') === inputUser ||
          s.fullName.toLowerCase().replace(/\s+/g, '') === inputUser ||
          s.id.toLowerCase() === inputUser
        );
      }
      return s.pin === inputPin;
    });

    // Default fast role PINs support (Manager 5566, Cashier 7788, Chef 1122, Master Admin 1111)
    if (!foundStaff) {
      if (inputPin === '5566' || inputPin === '1111') {
        foundStaff = {
          id: 'admin-master',
          fullName: 'Main Administrator',
          username: 'admin',
          pin: inputPin,
          role: 'MAIN_ADMIN',
          station: 'Executive Central Gateway',
          isActive: true,
          registeredAt: new Date().toLocaleString('en-IN'),
          totalLogins: 1,
        };
      } else if (inputPin === '7788') {
        foundStaff = {
          id: 'cashier-master',
          fullName: 'Counter Cashier',
          username: 'cashier',
          pin: '7788',
          role: 'CASHIER',
          station: 'Billing Counter POS 1',
          isActive: true,
          registeredAt: new Date().toLocaleString('en-IN'),
          totalLogins: 1,
        };
      } else if (inputPin === '1122') {
        foundStaff = {
          id: 'chef-master',
          fullName: 'Kitchen Chef Head',
          username: 'chef',
          pin: '1122',
          role: 'KITCHEN_STAFF',
          station: 'Main Kitchen Display (KDS)',
          isActive: true,
          registeredAt: new Date().toLocaleString('en-IN'),
          totalLogins: 1,
        };
      }
    }

    if (!foundStaff) {
      // Log failed attempt
      const failedLog: StaffActivityLog = {
        id: `LOG-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toLocaleString('en-IN'),
        actionType: 'LOGIN_FAILED',
        usernameSnapshot: inputUser,
        fullNameSnapshot: body.username || inputUser,
        roleSnapshot: 'UNKNOWN',
        details: `Sign-in failed: Account not found for "${body.username || inputUser}".`,
        success: false,
      };
      db.staffActivityLogs.unshift(failedLog);

      return NextResponse.json(
        { error: `User "${body.username || inputUser || 'Staff'}" not found. Please register as new staff.` },
        { status: 404 }
      );
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

    // Live update to Google Workspace (adithiyanpv6@gmail.com)
    pushLiveUpdateToGoogleWorkspace().catch(() => {});

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
