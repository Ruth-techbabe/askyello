const express = require('express');
const reviewController = require('../controllers/review.controller');
const { optionalAuth } = require('../middleware/auth.middleware');
const { checkReviewFingerprint } = require('../middleware/reviewFingerprint.middleware');
const { validateReview } = require('../middleware/validation.middleware');
const { reviewRateLimit } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.get('/provider/:providerId', reviewController.getProviderReviews);
router.post(
  '/',
  optionalAuth,
  reviewRateLimit,
  validateReview,
  checkReviewFingerprint,
  reviewController.createReview
);

module.exports = router;