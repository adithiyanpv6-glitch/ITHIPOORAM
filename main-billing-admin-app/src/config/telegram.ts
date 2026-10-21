// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — TELEGRAM BOT & GROUP CONFIGURATION
// You can paste your Telegram Bot Token and Group Chat ID directly below:
// ============================================================================

export const TELEGRAM_CONFIG = {
  // 1. Paste your bot token from @BotFather between the quotes:
  // Example: '7890123456:AAFl9mX8qN7Y1K3...'
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || 'PASTE_YOUR_BOT_TOKEN_HERE',

  // 2. Paste your Telegram Group Chat ID between the quotes (starts with -100):
  // Example: '-1001234567890'
  CHAT_ID: process.env.TELEGRAM_CHAT_ID || 'PASTE_YOUR_CHAT_ID_HERE',
};

export function getTelegramCredentials() {
  const token = (TELEGRAM_CONFIG.BOT_TOKEN || '').trim();
  const chat = (TELEGRAM_CONFIG.CHAT_ID || '').trim();

  const isTokenValid = token && !token.includes('PASTE_YOUR_BOT_TOKEN_HERE');
  const isChatValid = chat && !chat.includes('PASTE_YOUR_CHAT_ID_HERE');

  return {
    botToken: isTokenValid ? token : null,
    chatId: isChatValid ? chat : null,
    isConfigured: Boolean(isTokenValid && isChatValid),
  };
}
