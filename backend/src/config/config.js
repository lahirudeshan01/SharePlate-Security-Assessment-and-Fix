require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtCookieExpire: process.env.JWT_COOKIE_EXPIRE || 7,
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
  
  // Email Service Configuration (Third-party API)
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.FROM_EMAIL || 'noreply@shareplate.com',
  fromName: process.env.FROM_NAME || 'SharePlate',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  
  // Nodemailer (Gmail) Configuration - Fallback
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,
  
  // SMS Service (for future use)
  smsService: {
    apiKey: process.env.SMS_API_KEY,
    accountSid: process.env.SMS_ACCOUNT_SID
  }
};
