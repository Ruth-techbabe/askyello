const Provider = require('../models/Provider.model');
const { Op } = require('sequelize');

const search = async (req, res) => {
  try {
    const {
      query,
      category,
      minRating,
      page = 1,
      limit = 20,
    } = req.body;

    const whereClause = {
      isActive: true,
      verificationStatus: 'verified',
    };

    if (category) whereClause.category = category;
    if (minRating) whereClause.averageRating = { [Op.gte]: parseFloat(minRating) };
    if (query) {
      whereClause[Op.or] = [
        { businessName: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
        { services: { [Op.contains]: [query] } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const providers = await Provider.findAll({
      where: whereClause,
      order: [
        ['averageRating', 'DESC'],
        ['totalReviews', 'DESC'],
      ],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: { providers, query: { text: query, category, minRating } },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = [
      { id: 'plumbing', name: 'Plumbing' },
      { id: 'electrical', name: 'Electrical' },
      { id: 'carpentry', name: 'Carpentry'},
      { id: 'painting', name: 'Painting'},
      { id: 'cleaning', name: 'Cleaning' },
      { id: 'catering', name: 'Catering'},
      { id: 'tailoring', name: 'Tailoring' },
      { id: 'salon', name: 'Salon & Beauty' },
      { id: 'mechanic', name: 'Auto Mechanic'},
      { id: 'photography', name: 'Photography'},
      { id: 'other', name: 'Other Services'},
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
};

module.exports = { search, getCategories };
