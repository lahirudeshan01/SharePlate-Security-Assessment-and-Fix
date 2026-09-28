const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [donor, shelter]
 *                 example: donor
 *               organizationName:
 *                 type: string
 *                 example: Food Bank NGO
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
const rateLimit = require("express-rate-limit");

// Dedicated Authentication Rate Limiter (CWE-307)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login/registration attempts from this IP, please try again after 15 minutes."
  }
});

router.post(
  "/register",
  authLimiter,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"),
    body("role")
      .isIn(["donor", "shelter", "manager"])
      .withMessage("Role must be donor, shelter, or manager"),
    validate
  ],
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 */
const passport = require("../config/passport");
const jwt = require("jsonwebtoken");

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail().withMessage("A valid email string is required"),
    body("password").isString().notEmpty().withMessage("Password is required"),
    validate
  ],
  authController.login
);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth 2.0 Single Sign-On
 *     tags: [Authentication]
 */
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth 2.0 redirect callback endpoint
 *     tags: [Authentication]
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`, session: false }),
  (req, res) => {
    // Issue signed JWT token for the authenticated user
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "7d" }
    );
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?token=${token}&role=${req.user.role}&name=${encodeURIComponent(req.user.name)}`);
  }
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get the logged-in user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", authMiddleware, authController.getProfile);

/**
 * @swagger
 * /api/auth/updatepassword:
 *   put:
 *     summary: Update the logged-in user's password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       401:
 *         description: Current password is incorrect
 */
router.put("/updatepassword", authMiddleware, authController.updatePassword);
router.put("/update-password", authMiddleware, authController.updatePassword);

module.exports = router;
