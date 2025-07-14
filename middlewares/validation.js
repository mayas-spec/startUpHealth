const Joi = require('joi');



const validateSignUp = (req, res, next) => {
  console.log('Validating signup data:', req.body);
  const schema = Joi.object({
    fullName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    contact: Joi.string().min(10).max(15).required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Passwords do not match'
      })
  }).unknown(true);

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }
  
  next();
};

const validateLogIn = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }
  
  next();
};

const validatePasswordReset = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }
  
  next();
};

const validatefacilitySignUp = (req, res, next) => {
  const schema = Joi.object({
    fullName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    contact: Joi.string().optional(),
    facility: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};


const validateFacility = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    type: Joi.string().valid('hospital', 'pharmacy').required(),
    location: Joi.object({
      address: Joi.string().required(),
      city: Joi.string().required(),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180)
      }).optional()
    }).required(),
    contact: Joi.object({
      phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).required(),
      email: Joi.string().email().optional(),
      website: Joi.string().uri().optional()
    }).optional(),
    hours: Joi.object({
      monday: Joi.object({ open: Joi.string(), close: Joi.string() }).optional(),
      tuesday: Joi.object({ open: Joi.string(), close: Joi.string() }).optional(),
      wednesday: Joi.object({ open: Joi.string(), close: Joi.string() }).optional(),
      thursday: Joi.object({ open: Joi.string(), close: Joi.string() }).optional(),
      friday: Joi.object({ open: Joi.string(), close: Joi.string() }).optional(),
      saturday: Joi.object({ open: Joi.string(), close: Joi.string() }).optional(),
      sunday: Joi.object({ open: Joi.string(), close: Joi.string() }).optional()
    }).optional(),
    description: Joi.string().max(500).optional(),
    admin: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }

  next();
};



const validateService = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    type: Joi.string().valid('medication', 'vaccine', 'test').required(),
    description: Joi.string().max(500).optional(),
    category: Joi.string().max(50).optional(),
    stock: Joi.object({
      quantity: Joi.number().min(0).optional(),
      lowStockThreshold: Joi.number().min(1).optional()
    }).optional(),
    price: Joi.object({
      amount: Joi.number().min(0).optional(),
      currency: Joi.string().optional()
    }).optional(),
    requiresAppointment: Joi.boolean().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }
  
  next();
};

// Validation for stock updates
const validateStockUpdate = (req, res, next) => {
  const schema = Joi.object({
    quantity: Joi.number().min(0).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }
  
  next();
};

const validateAppointment = (req, res, next) => {
  const schema = Joi.object({
    facility: Joi.string().required(),
    service: Joi.string().required(),
    appointmentDate: Joi.date().min('now').required(),
    timeSlot: Joi.object({
      start: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
          'string.pattern.base': 'Start time must be in HH:MM format'
        }),
      end: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
          'string.pattern.base': 'End time must be in HH:MM format'
        })
    }).required(),
    reason: Joi.string().min(10).max(200).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }
  
  next();
};

const validateReview = (req, res, next) => {
  const schema = Joi.object({
    facility: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().min(10).max(500).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }
  
  next();
};

const validateBlog = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(10).max(200).required(),
    content: Joi.string().min(50).required(),
    excerpt: Joi.string().min(20).max(200).required(),
    category: Joi.string().valid('health_education', 'emergency_preparedness', 'general').required(),
    tags: Joi.array().items(Joi.string().max(20)).max(10).optional(),
    status: Joi.string().valid('draft', 'published').optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }
  
  next();
};



module.exports = {
  validateSignUp,
  validateLogIn,
  validatePasswordReset,
  validatefacilitySignUp,
  validateFacility,
  validateService,
  validateStockUpdate,
  validateAppointment ,
  validateReview,
  validateBlog
  
};