const config = require('../config/config');

// Create token, create cookie and send response
exports.sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + config.jwtCookieExpire * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Set secure flag in production
  if (config.nodeEnv === 'production') {
    options.secure = true;
  }

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      data: user
    });
};

// Generate JWT token
exports.generateToken = (userId, role) => {
  const jwt = require('jsonwebtoken');
  
  return jwt.sign(
    { id: userId, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );
};

// Verify JWT token
exports.verifyToken = (token) => {
  const jwt = require('jsonwebtoken');
  
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};
