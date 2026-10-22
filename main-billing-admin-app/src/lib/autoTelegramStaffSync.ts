// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — STAFF & SESSIONS EXCEL AUTO-DISPATCHER TO TELEGRAM
// In-place updating: Never creates random multiple files, edits pinned message!
// ============================================================================

import { syncMasterDatabasePinned } from './telegramPinnedVault';

export async function autoDispatchStaffDatabaseToTelegram(
  reason: string = 'Live Staff & Session Update'
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await syncMasterDatabasePinned();
    return res;
  } catch (err: any) {
    console.error('Error auto-dispatching staff database to Telegram:', err);
    return { success: false, message: err.message || 'Error syncing staff database' };
  }
}
