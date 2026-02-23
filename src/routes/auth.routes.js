const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { validateProviderRegistration } = require('../middleware/validation.middleware');
const { otpVerifyLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

// Provider registration & login
router.post('/register-provider', validateProviderRegistration, authController.registerProvider);
router.post('/login-provider', authController.loginProvider);

// Email & OTP verification
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-otp', otpVerifyLimiter, authController.verifyProviderOTP);
// Regular user login
router.post('/login', authController.loginWithEmail);

// Admin login
router.post('/admin/login', authController.loginAsAdmin);
router.put('/admin/change-password', authenticateJWT, requireAdmin, authController.changeAdminPassword);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/auth/error`,
    session: false,
  }),
  authController.googleCallback
);

// User management
router.get('/me', authenticateJWT, authController.getCurrentUser);
router.post('/logout', authenticateJWT, authController.logout);

module.exports = router;