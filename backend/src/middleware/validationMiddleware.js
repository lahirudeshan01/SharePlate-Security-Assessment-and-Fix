const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseHandler');

// Middleware to handle validation results
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return errorResponse(res, errorMessages, 400);
  }
  
  next();
};
