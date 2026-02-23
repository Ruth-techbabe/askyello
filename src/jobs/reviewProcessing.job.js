const Review = require('../models/Review.model');
const Provider = require('../models/Provider.model');
const reviewAnalysisService = require('../services/reviewAnalysis.service');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

class ReviewProcessingJob {
  async processPendingReviews() {
    try {
      const pendingHours = parseInt(process.env.REVIEW_PENDING_HOURS || '24');
      const cutoffTime = new Date(Date.now() - pendingHours * 60 * 60 * 1000);

      const pendingReviews = await Review.findAll({
        where: {
          status: 'pending',
          createdAt: { [Op.lte]: cutoffTime },
        },
      });

      logger.info(`Processing ${pendingReviews.length} pending reviews`);

      for (const review of pendingReviews) {
        review.status = 'approved';
        review.approvedAt = new Date();
        await review.save();

        await this.updateProviderRating(review.providerId);
      }

      logger.info('Pending reviews processed successfully');
    } catch (error) {
      logger.error('Error processing pending reviews:', error);
    }
  }

  async updateProviderRating(providerId) {
    const provider = await Provider.findByPk(providerId);
    if (!provider) return;

    const reviews = await Review.findAll({
      where: { providerId, status: 'approved' },
    });

    const weightedRating = reviewAnalysisService.calculateWeightedRating(reviews);

    provider.averageRating = parseFloat(weightedRating.toFixed(1));
    provider.totalReviews = reviews.length;
    await provider.save();
  }
}

module.exports = new ReviewProcessingJob();
