const User = require('../models/User.model');
const Provider = require('../models/Provider.model');
const Review = require('../models/Review.model');
const { Op } = require('sequelize');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const whereClause = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: users, count } = await User.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
      attributes: { exclude: ['googleId'] }, // Don't expose Google ID
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

// Change user role
const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'provider', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: user, provider, or admin',
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change user role',
    });
  }
};

// Get pending providers
const getPendingProviders = async (req, res) => {
  try {
    const providers = await Provider.findAll({
      where: { verificationStatus: 'pending' },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['name', 'email', 'picture'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error('Get pending providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending providers',
    });
  }
};

// Verify provider
const verifyProvider = async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await Provider.findByPk(id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }

    provider.verificationStatus = 'verified';
    await provider.save();

    res.json({
      success: true,
      message: 'Provider verified successfully',
      data: provider,
    });
  } catch (error) {
    console.error('Verify provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify provider',
    });
  }
};

// Reject provider
const rejectProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const provider = await Provider.findByPk(id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }

    provider.verificationStatus = 'rejected';
    await provider.save();

    // TODO: Send email notification to provider with reason

    res.json({
      success: true,
      message: 'Provider rejected',
      data: provider,
    });
  } catch (error) {
    console.error('Reject provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject provider',
    });
  }
};

// Get flagged reviews
const getFlaggedReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: {
        [Op.or]: [
          { status: 'flagged' },
          { status: 'pending' },
        ],
      },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['name', 'email', 'picture'],
        },
        {
          model: Provider,
          as: 'provider',
          attributes: ['businessName', 'category'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Get flagged reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
    });
  }
};

// Approve review
const approveReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    review.status = 'approved';
    review.approvedAt = new Date();
    await review.save();

    // Update provider rating
    const reviewAnalysisService = require('../services/reviewAnalysis.service');
    const allReviews = await Review.findAll({
      where: { providerId: review.providerId, status: 'approved' },
    });
    const weightedRating = reviewAnalysisService.calculateWeightedRating(allReviews);

    await Provider.update(
      {
        averageRating: parseFloat(weightedRating.toFixed(1)),
        totalReviews: allReviews.length,
      },
      { where: { id: review.providerId } }
    );

    res.json({
      success: true,
      message: 'Review approved successfully',
      data: review,
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve review',
    });
  }
};

// Reject review
const rejectReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    review.status = 'rejected';
    await review.save();

    res.json({
      success: true,
      message: 'Review rejected successfully',
      data: review,
    });
  } catch (error) {
    console.error('Reject review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject review',
    });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProviders,
      verifiedProviders,
      pendingProviders,
      totalReviews,
      pendingReviews,
      flaggedReviews,
    ] = await Promise.all([
      User.count(),
      Provider.count(),
      Provider.count({ where: { verificationStatus: 'verified' } }),
      Provider.count({ where: { verificationStatus: 'pending' } }),
      Review.count(),
      Review.count({ where: { status: 'pending' } }),
      Review.count({ where: { status: 'flagged' } }),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
        },
        providers: {
          total: totalProviders,
          verified: verifiedProviders,
          pending: pendingProviders,
        },
        reviews: {
          total: totalReviews,
          pending: pendingReviews,
          flagged: flaggedReviews,
        },
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
};

// Manually trigger review processing
const processReviews = async (req, res) => {
  try {
    const reviewProcessingJob = require('../jobs/reviewProcessing.job');
    await reviewProcessingJob.processPendingReviews();

    res.json({
      success: true,
      message: 'Review processing completed successfully',
    });
  } catch (error) {
    console.error('Process reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process reviews',
    });
  }
};

module.exports = {
  getAllUsers,
  changeUserRole,
  getPendingProviders,
  verifyProvider,
  rejectProvider,
  getFlaggedReviews,
  approveReview,
  rejectReview,
  getDashboardStats,
  processReviews,
};