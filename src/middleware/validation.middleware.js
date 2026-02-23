const Joi = require('joi');

const providerSchema = Joi.object({
  businessName: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(1000),
  category: Joi.string().required(),
  subCategories: Joi.array().items(Joi.string()),
  phoneNumber: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).required(),
  whatsappNumber: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/),
  address: Joi.string().required(),
  workingHours: Joi.object(),
  services: Joi.array().items(Joi.string()),
});

const reviewSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string()
    .min(parseInt(process.env.REVIEW_MIN_TEXT_LENGTH || '10'))
    .max(1000)
    .required(),
  images: Joi.array().items(Joi.string().uri()).max(5),
});


const providerRegistrationSchema = Joi.object({
  
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(100).required(),
  
  
  businessName: Joi.string().min(3).max(100).required(),
  category: Joi.string().required(),
  phoneNumber: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).required(),
  whatsappNumber: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/),
  address: Joi.string().required(),
  description: Joi.string().max(1000),
  services: Joi.array().items(Joi.string()),
  workingHours: Joi.object(),
});

const validateProviderRegistration = (req, res, next) => {
  const { error } = providerRegistrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};

const validateProvider = (req, res, next) => {
  const { error } = providerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};

module.exports = {
  validateProvider,
  validateReview,
  validateProviderRegistration
};
