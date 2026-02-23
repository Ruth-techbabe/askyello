const Provider = require('../models/Provider.model');
const User = require('../models/User.model');
const geolocationService = require('../services/geolocation.service');
const { Op } = require('sequelize');

const createProvider = async (req, res) => {
  try {
    const userId = req.user.id;

    const existingProvider = await Provider.findOne({ where: { userId } });
    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: 'You already have a provider profile',
      });
    }

    const {
      businessName,
      description,
      category,
      subCategories,
      phoneNumber,
      whatsappNumber,
      address,
      workingHours,
      services,
    } = req.body;

    const location = await geolocationService.geocodeAddress(address);

    const provider = await Provider.create({
      userId,
      businessName,
      description,
      category,
      subCategories: subCategories || [],
      phoneNumber,
      whatsappNumber,
      address: location.formattedAddress,
      latitude: location.latitude,
      longitude: location.longitude,
      placeId: location.placeId,
      workingHours: workingHours || {},
      services: services || [],
      verificationStatus: 'pending',
    });

    await User.update({ role: 'provider' }, { where: { id: userId } });

    res.status(201).json({
      success: true,
      message: 'Provider profile created successfully',
      data: provider,
    });
  } catch (error) {
    console.error('Create provider error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create provider profile',
    });
  }
};

const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const provider = await Provider.findOne({
      where: { id, userId },
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found or unauthorized',
      });
    }

    const { address } = req.body;

    let locationData = {};
    if (address && address !== provider.address) {
      const location = await geolocationService.geocodeAddress(address);
      locationData = {
        address: location.formattedAddress,
        latitude: location.latitude,
        longitude: location.longitude,
        placeId: location.placeId,
      };
    }

    await provider.update({
      ...req.body,
      ...locationData,
    });

    res.json({
      success: true,
      message: 'Provider updated successfully',
      data: provider,
    });
  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update provider',
    });
  }
};

const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const provider = await Provider.findOne({
      where: { id, userId },
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found or unauthorized',
      });
    }

    await provider.update({ isActive: false });

    res.json({
      success: true,
      message: 'Provider profile deactivated successfully',
    });
  } catch (error) {
    console.error('Delete provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete provider',
    });
  }
};

// Get nearby providers
const getNearbyProviders = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, category, minRating } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const whereClause = {
      isActive: true,
      verificationStatus: 'verified',
      // Only include providers with coordinates
      latitude: { [Op.ne]: null },
      longitude: { [Op.ne]: null },
    };

    if (category) whereClause.category = category;
    if (minRating) whereClause.averageRating = { [Op.gte]: parseFloat(minRating) };

    let providers = await Provider.findAll({
      where: whereClause,
      order: [
        ['averageRating', 'DESC'],
        ['totalReviews', 'DESC'],
      ],
    });

    // Filter by distance
    providers = providers
      .map((provider) => ({
        provider,
        distance: geolocationService.calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(provider.latitude),
          parseFloat(provider.longitude)
        ),
      }))
      .filter((item) => item.distance !== null && item.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance)
      .map((item) => ({
        ...item.provider.toJSON(),
        distance: item.distance,
      }));

    res.json({
      success: true,
      data: providers,
      count: providers.length,
    });
  } catch (error) {
    console.error('Get nearby providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby providers',
    });
  }
};

// Search providers
const searchProviders = async (req, res) => {
  try {
    const {
      query,
      category,
      minRating,
      latitude,
      longitude,
      radius,
      page = 1,
      limit = 20,
    } = req.query;

    const whereClause = {
      isActive: true,
      verificationStatus: 'verified',
    };

    if (category) whereClause.category = category;
    if (minRating) whereClause.averageRating = { [Op.gte]: parseFloat(minRating) };
    if (query) {
      whereClause[Op.or] = [
        { businessName: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
        { services: { [Op.like]: `%${query}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    let providers = await Provider.findAll({
      where: whereClause,
      order: [
        ['averageRating', 'DESC'],
        ['totalReviews', 'DESC'],
      ],
      limit: Number(limit),
      offset,
    });

    //  If user location provided, sort by distance (only for providers with coordinates)
    if (latitude && longitude) {
      providers = providers
        .map((provider) => {
          //  Check if provider has coordinates
          if (provider.latitude === null || provider.longitude === null) {
            return {
              ...provider.toJSON(),
              distance: null,  // No distance available
              hasCoordinates: false,
            };
          }

          const distance = geolocationService.calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(provider.latitude),
            parseFloat(provider.longitude)
          );

          return {
            ...provider.toJSON(),
            distance,
            hasCoordinates: true,
          };
        })
        .sort((a, b) => {
          //  Providers with coordinates first, sorted by distance
          if (a.hasCoordinates && !b.hasCoordinates) return -1;
          if (!a.hasCoordinates && b.hasCoordinates) return 1;
          if (a.hasCoordinates && b.hasCoordinates) {
            if (radius && a.distance > parseFloat(radius)) return 1;
            if (radius && b.distance > parseFloat(radius)) return -1;
            return a.distance - b.distance;
          }
          return 0;
        });
    }

    res.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error('Search providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
    });
  }
};

// Get provider by ID
const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.query;

    const provider = await Provider.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['name', 'picture'],
        },
      ],
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }

    const providerData = provider.toJSON();

    // Calculate distance if user location and provider coordinates available
    if (latitude && longitude && provider.latitude !== null && provider.longitude !== null) {
      providerData.distance = geolocationService.calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(provider.latitude),
        parseFloat(provider.longitude)
      );
    } else {
      providerData.distance = null;
    }

    // Add flag to indicate if coordinates are available
    providerData.hasCoordinates = provider.latitude !== null && provider.longitude !== null;

    res.json({
      success: true,
      data: providerData,
    });
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch provider',
    });
  }
};
module.exports = {
  createProvider,
  updateProvider,
  deleteProvider,
  getProviderById,
  searchProviders,
  getNearbyProviders,
};