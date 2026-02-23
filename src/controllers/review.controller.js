const Review = require('../models/Review.model');
const ReviewFingerprint = require('../models/ReviewFingerprint.model');
const Provider = require('../models/Provider.model');
const User = require('../models/User.model');
const reviewAnalysisService = require('../services/reviewAnalysis.service');
const { v4: uuidv4 } = require('uuid');

const createReview = async (req, res) => {
  try {
    const { providerId, rating, comment, images } = req.body;
    const { ipHash, deviceHash, userAgent } = req.body._fingerprint;
    const userId = req.user?.id || null;

    const provider = await Provider.findByPk(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }

    const analysis = await reviewAnalysisService.analyzeReview(comment, rating);

    let initialWeight = analysis.suggestedWeight;
    if (!userId) {
      initialWeight *= parseFloat(process.env.REVIEW_WEIGHT_NEW_USER || '0.5');
    }

    const fingerprintId = uuidv4();
    const review = await Review.create({
      providerId,
      userId,
      rating,
      comment,
      images: images || [],
      status: analysis.isManipulative ? 'flagged' : 'pending',
      weight: initialWeight,
      sentimentScore: analysis.sentimentScore,
      aiFlags: analysis.flags,
      fingerprintId,
    });

    await ReviewFingerprint.create({
      providerId,
      ipHash,
      deviceHash,
      userAgent,
      lastReviewAt: new Date(),
      reviewCount: 1,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will be visible after review.',
      data: {
        id: review.id,
        status: review.status,
      },
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
    });
  }
};

const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: reviews, count } = await Review.findAndCountAll({
      where: {
        providerId,
        status: 'approved',
      },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['name', 'picture'],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
    });
  }
};

module.exports = {
  createReview,
  getProviderReviews,
};