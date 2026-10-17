import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'ithipooram-super-secret-jwt-key-trivandrum-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  TIMEZONE: 'Asia/Kolkata',
  BUSINESS_DAY_CUTOFF_HOUR: 3, // 3 AM cutoff
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  RESTAURANT: {
    NAME: 'Ithi Pooram',
    MALAYALAM_NAME: 'ഇത്തിപ്പൂരം',
    TAGLINE: 'Authentic Kerala Lunch & Seafood Spot',
    LOCATION: 'Near Secretariat, Statue, Trivandrum, Kerala 695001',
    PHONE: '+91 471 233 4567',
    GSTIN: '32AAAAI0000A1Z5',
    FSSAI: '11324007000890',
  },
  TAX: {
    CGST_PERCENT: 2.5,
    SGST_PERCENT: 2.5,
    TOTAL_PERCENT: 5.0,
  },
};
