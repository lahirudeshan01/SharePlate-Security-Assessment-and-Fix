console.log("Starting backend server...");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./config/swagger");
const { errorHandler } = require("./middleware/errorHandler");
const config = require("./config/config");
const passport = require("./config/passport");
const { verifyCsrfToken } = require("./middleware/csrfProtection");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const donationRoutes = require("./routes/donationRoutes");
const requestRoutes = require("./routes/requestRoutes");
const pickupRoutes = require("./routes/pickupRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");

const app = express();

// 1. Disable diagnostic technology header
app.disable("x-powered-by");

// 2. Configure Helmet Anti-Clickjacking and Content Security Policy
app.use(
  helmet({
    frameguard: { action: "deny" }, // Sends X-Frame-Options: DENY
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://lh3.googleusercontent.com"],
        connectSrc: ["'self'", "http://localhost:5000", "https://accounts.google.com"],
        frameAncestors: ["'none'"], // Defeats Clickjacking across all modern browsers
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    noSniff: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  })
);

// CORS — restrict to allowed origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("CORS: origin not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Express Session & Passport for OAuth 2.0 / OIDC
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    }
  })
);
app.use(passport.initialize());

// NoSQL Injection sanitization - strip keys beginning with $ or containing .
app.use(
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`[SECURITY] Sanitized MongoDB operator injection attempt on key: ${key}`);
    }
  })
);

// XSS protection - sanitize user input
app.use(xss());

// Rate limiting — controlled via RATE_LIMIT_ENABLED env var
if (config.rateLimitEnabled) {
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
  });
  app.use("/api", limiter);
}

// Anti-CSRF Token Generation endpoint (Double-Submit Cookie Pattern)
app.get("/api/csrf-token", (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  res.cookie("XSRF-TOKEN", csrfToken, {
    httpOnly: false, // Accessible by frontend JS to set X-CSRF-Token header
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ csrfToken });
});

// Verify Anti-CSRF Token on state-changing API requests
app.use("/api", verifyCsrfToken);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/pickups", pickupRoutes);
app.use("/api/delivery", deliveryRoutes);

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
