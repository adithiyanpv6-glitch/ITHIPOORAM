// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — TELEGRAM BOT & GROUP CONFIGURATION
// Configured with your bot and group link
// ============================================================================

export const TELEGRAM_CONFIG = {
  // Bot Token from @BotFather
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8653995416:AAHeBSH9kdFLMlZ-VvmnLRzZjbpkJunJOHc',

  // Telegram Group Chat ID (Numeric group ID resolved from https://t.me/+9eJM_DO7vyUxMjE9)
  CHAT_ID: process.env.TELEGRAM_CHAT_ID || '-5302629028',

  // Permanent Group Direct Link for Admin / Staff quick access
  GROUP_INVITE_LINK: 'https://t.me/+9eJM_DO7vyUxMjE9',
};

export function getTelegramCredentials() {
  const token = (TELEGRAM_CONFIG.BOT_TOKEN || '').trim();
  const chat = (TELEGRAM_CONFIG.CHAT_ID || '').trim();

  return {
    botToken: token || null,
    chatId: chat || null,
    groupLink: TELEGRAM_CONFIG.GROUP_INVITE_LINK,
    isConfigured: Boolean(token),
  };
}
