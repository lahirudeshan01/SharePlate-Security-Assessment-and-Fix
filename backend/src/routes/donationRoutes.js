const express = require("express");
const router = express.Router();
const donationController = require("../controllers/donationController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");

/**
 * @swagger
 * /api/donations:
 *   post:
 *     summary: Create a new donation (Donor only)
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [foodName, quantity, expiryDate]
 *             properties:
 *               foodName:
 *                 type: string
 *                 example: Rice
 *               quantity:
 *                 type: integer
 *                 example: 10
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-01"
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                     example: 123 Main St
 *                   lat:
 *                     type: number
 *                     example: 6.9271
 *                   lng:
 *                     type: number
 *                     example: 79.8612
 *     responses:
 *       201:
 *         description: Donation created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authMiddleware,
  authorizeRoles("donor", "restaurant"),
  [
    body("foodName").notEmpty().withMessage("Food name is required"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive number"),
    body("expiryDate")
      .notEmpty()
      .withMessage("Expiry date is required")
      .isISO8601()
      .withMessage("Invalid date format"),
    validate
  ],
  donationController.createDonation
);

/**
 * @swagger
 * /api/donations/available:
 *   get:
 *     summary: Get all available donations (public)
 *     tags: [Donations]
 *     responses:
 *       200:
 *         description: List of available donations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 donations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Donation'
 */
router.get("/available", donationController.getAvailableDonations);

// Public: get all donations (all statuses)
router.get("/public", donationController.getPublicDonations);

/**
 * @swagger
 * /api/donations/my-donations:
 *   get:
 *     summary: Get all donations created by the logged-in donor
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of donor's donations
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/my-donations",
  authMiddleware,
  authorizeRoles("donor", "restaurant"),
  donationController.getMyDonations
);

/**
 * @swagger
 * /api/donations/{id}:
 *   get:
 *     summary: Get a single donation by ID
 *     tags: [Donations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donation ID
 *     responses:
 *       200:
 *         description: Donation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Donation'
 *       404:
 *         description: Donation not found
 */
router.get("/:id", donationController.getDonationById);

// Update a donation (donor only, own donations)
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("donor", "restaurant"),
  donationController.updateDonation
);

// Delete a donation (donor only, own donations)
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("donor", "restaurant"),
  donationController.deleteDonation
);

/**
 * @swagger
 * /api/donations:
 *   get:
 *     summary: Get all donations (authenticated users)
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all donations
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  authMiddleware,
  donationController.getAllDonations
);

module.exports = router;
