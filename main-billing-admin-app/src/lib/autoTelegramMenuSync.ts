// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — Menu Database (Local Only - No Telegram Clutter)
// The Telegram vault strictly maintains ONLY the 3 pinned databases requested by Admin:
// 1. Staff Database
// 2. Staff Session Database
// 3. Table Orders Database
// ============================================================================

export async function autoDispatchMenuExcelToTelegram(reason: string = 'Menu Update'): Promise<boolean> {
  // Intentional no-op: All Telegram updates are strictly consolidated into the 3 pinned files.
  return true;
}
