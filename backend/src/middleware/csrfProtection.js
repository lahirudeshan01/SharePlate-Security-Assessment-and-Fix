const crypto = require("crypto");

// Middleware to generate and verify Double-Submit Anti-CSRF Tokens
exports.verifyCsrfToken = (req, res, next) => {
  // Skip safe non-state changing HTTP methods (GET, HEAD, OPTIONS) as per Lecture Slide 163
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF check in automated integration test environment
  if (process.env.NODE_ENV === "test") {
    return next();
  }
  
  const clientToken = req.headers["x-csrf-token"] || req.body?._csrf;
  const cookieToken = req.cookies ? req.cookies["XSRF-TOKEN"] : null;

  if (!clientToken || !cookieToken || clientToken !== cookieToken) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Invalid or missing Anti-CSRF token."
    });
  }
  next();
};
