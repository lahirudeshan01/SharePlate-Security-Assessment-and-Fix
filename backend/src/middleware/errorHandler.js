const sanitizeHtml = require("sanitize-html");

exports.errorHandler = (err, req, res, next) => {
  // Log full internal error stack on the server console for developer diagnostics
  console.error(`[SERVER ERROR] ${err.stack || err}`);

  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || 500;

  // Sanitize error message to neutralize potential Reflected XSS payloads
  const rawMessage = err.message || "An unexpected error occurred";
  const cleanMessage = sanitizeHtml(rawMessage, { allowedTags: [], allowedAttributes: {} });

  // Expose detailed error message only in non-production environments
  const clientMessage = (isProduction && statusCode === 500)
    ? "Internal Server Error"
    : cleanMessage;

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(isProduction ? {} : { stack: err.stack })
  });
};
