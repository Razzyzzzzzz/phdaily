import rateLimit from 'express-rate-limit'

// Brute-force protection for register / login (per IP).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.', code: 'RATE_LIMIT' },
})

// Generic API limiter (saves are debounced on the client, so this is generous).
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMIT' },
})
