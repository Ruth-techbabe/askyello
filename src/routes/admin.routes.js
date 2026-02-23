const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(authenticateJWT);
router.use(requireAdmin);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.changeUserRole);

// Provider management
router.get('/providers/pending', adminController.getPendingProviders);
router.put('/providers/:id/verify', adminController.verifyProvider);
router.put('/providers/:id/reject', adminController.rejectProvider);

// Review moderation
router.get('/reviews/flagged', adminController.getFlaggedReviews);
router.put('/reviews/:id/approve', adminController.approveReview);
router.put('/reviews/:id/reject', adminController.rejectReview);

// Stats & Analytics
router.get('/stats', adminController.getDashboardStats);

// System management
router.post('/jobs/process-reviews', adminController.processReviews);

module.exports = router;