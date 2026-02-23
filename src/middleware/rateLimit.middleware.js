const rateLimit = require('express-rate-limit');

// Simple memory-based rate limiting (no Redis)
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const reviewRateLimit = rateLimit({
  windowMs: 900000,
  max: parseInt(process.env.RATE_LIMIT_REVIEW_MAX || '5'),
  message: {
    success: false,
    message: 'Too many review submissions, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
// OTP verification rate limiter
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many OTP verification attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const chatbotRateLimit = rateLimit({
  windowMs: 60000,
  max: 10,
  message: {
    success: false,
    message: 'Chatbot rate limit exceeded, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  reviewRateLimit,
  otpVerifyLimiter,
  chatbotRateLimit,
};


