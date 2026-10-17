import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: {
    error: 'Too many login attempts from this device. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 orders per minute per IP
  message: {
    error: 'Order request rate limit exceeded. Please wait a moment before trying again.',
  },
});
