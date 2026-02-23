const ReviewFingerprint = require('../models/ReviewFingerprint.model');
const {
  generateDeviceFingerprint,
  getClientIP,
} = require('../utils/deviceFingerprint');

const checkReviewFingerprint = async (req, res, next) => {
  try {
    const { providerId } = req.body;
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    const { ipHash, deviceHash } = generateDeviceFingerprint(userAgent, ip);

    const existingFingerprint = await ReviewFingerprint.findOne({
      where: {
        providerId,
        ipHash,
        deviceHash,
      },
    });

    if (existingFingerprint) {
      return res.status(429).json({
        success: false,
        message: 'You have already reviewed this provider from this device',
        code: 'DUPLICATE_REVIEW',
      });
    }

    req.body._fingerprint = {
      ipHash,
      deviceHash,
      userAgent,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkReviewFingerprint };
