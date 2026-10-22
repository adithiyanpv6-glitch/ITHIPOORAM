// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — STAFF & SESSIONS EXCEL AUTO-DISPATCHER TO TELEGRAM
// In-place updating: Never creates random multiple files, edits pinned message!
// ============================================================================

import { syncStaffDatabasePinned, syncStaffSessionDatabasePinned } from './telegramPinnedVault';

export async function autoDispatchStaffDatabaseToTelegram(
  reason: string = 'Live Staff & Session Update'
): Promise<{ success: boolean; message: string }> {
  try {
    const resStaff = await syncStaffDatabasePinned();
    const resSession = await syncStaffSessionDatabasePinned();
    return {
      success: resStaff.success && resSession.success,
      message: `${resStaff.message} | ${resSession.message}`,
    };
  } catch (err: any) {
    console.error('Error auto-dispatching staff database to Telegram:', err);
    return { success: false, message: err.message || 'Error syncing staff database' };
  }
}
